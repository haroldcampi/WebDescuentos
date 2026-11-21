-- SEGURIDAD (auditoría 2026-11-12): cinco refuerzos, en este orden.
-- Aplicar DESPUÉS de 20261111020000_nombres_reservados_y_reportes.sql
-- (con `supabase db push`, o pegándolo entero en Supabase > SQL Editor > New query > Run).
--
--   1. El nombre de usuario se asigna al confirmar el email, no al registrarse.
--   2. Los límites por IP agrupan las direcciones IPv6 por bloque /64.
--   3. Tabla de productos válidos: no se puede votar ni comentar un producto inventado.
--   4. Índice único: un voto por IP en cada oferta (y los límites ya no se saltan con peticiones simultáneas).
--   5. Las restricciones que eran NOT VALID se validan también contra las filas antiguas.
--
-- IMPORTANTE (punto 3): cada vez que cambies el catálogo (src/data/productos.ts) ejecuta `npm run productos-validos`
-- y aplica la migración que genera. Si no, los productos nuevos no admitirán votos ni comentarios.

/* ===== 1 · El nombre de usuario se asigna al confirmar el email =====
   Antes, el nombre (y el avatar) se guardaban al crear la cuenta, antes de demostrar que el email era de quien se registraba.
   Cualquiera podía reservar nombres con emails inventados, o dejar su nombre puesto en la cuenta futura de otra persona.
   Ahora: al registrarse, el perfil se crea sin nombre; al confirmar el email se asigna el nombre pedido en el ÚLTIMO registro
   (si sigue libre y no está reservado). Las cuentas que nacen ya confirmadas (Google) siguen igual. */
create or replace function public.crear_perfil()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  confirmada boolean := new.email_confirmed_at is not null;
  u text := lower(btrim(coalesce(new.raw_user_meta_data ->> 'usuario', '')));
  a jsonb := new.raw_user_meta_data -> 'avatar';
begin
  if not confirmada or u !~ '^[a-z0-9_][a-z0-9_.]{1,18}[a-z0-9_]$' or public.nombre_reservado(u) then u := null; end if;
  if not confirmada or not public.avatar_valido(a) then a := null; end if;
  begin
    insert into public.perfiles (id, usuario, avatar) values (new.id, u, a) on conflict (id) do nothing;
  exception when unique_violation then
    insert into public.perfiles (id, usuario, avatar) values (new.id, null, a) on conflict (id) do nothing;
  end;
  return new;
end;
$$;
revoke all on function public.crear_perfil() from public, anon, authenticated;

create or replace function public.perfil_al_confirmar()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  u text := lower(btrim(coalesce(new.raw_user_meta_data ->> 'usuario', '')));
  a jsonb := new.raw_user_meta_data -> 'avatar';
begin
  if old.email_confirmed_at is not null or new.email_confirmed_at is null then return new; end if;
  if u !~ '^[a-z0-9_][a-z0-9_.]{1,18}[a-z0-9_]$' or public.nombre_reservado(u) then u := null; end if;
  if not public.avatar_valido(a) then a := null; end if;
  insert into public.perfiles (id) values (new.id) on conflict (id) do nothing;
  begin
    update public.perfiles set usuario = coalesce(usuario, u), avatar = coalesce(avatar, a) where id = new.id;
  exception when unique_violation then
    -- El nombre ya lo tiene otra cuenta: se queda sin nombre y la web le pide elegir uno al entrar
    update public.perfiles set avatar = coalesce(avatar, a) where id = new.id;
  end;
  return new;
end;
$$;
revoke all on function public.perfil_al_confirmar() from public, anon, authenticated;
drop trigger if exists al_confirmar_email on auth.users;
create trigger al_confirmar_email after update of email_confirmed_at on auth.users
  for each row execute function public.perfil_al_confirmar();

-- Las cuentas que siguen sin confirmar sueltan el nombre y el avatar que tenían reservados.
-- (La regla «el nombre no se quita» se desactiva solo durante este paso.)
alter table public.perfiles disable trigger antes_de_cambiar_usuario;
update public.perfiles p set usuario = null, avatar = null
  from auth.users u
  where u.id = p.id and u.email_confirmed_at is null and (p.usuario is not null or p.avatar is not null);
alter table public.perfiles enable trigger antes_de_cambiar_usuario;

/* ===== 2 · Límites por IP: las direcciones IPv6 se agrupan por bloque /64 =====
   Una conexión IPv6 de casa o de móvil recibe un bloque /64 entero (millones de direcciones). Antes, cada dirección
   contaba como una IP distinta, así que una sola persona podía multiplicar votos y límites cambiando de dirección.
   Ahora seguridad.ip() devuelve el bloque (por ejemplo «2001:db8:1:2::/64») para IPv6 y la dirección exacta para IPv4.
   Todas las funciones (votar, comentar, enviar ofertas, comprobar nombre, reportar) usan seguridad.ip(), así que
   el cambio les llega a todas. En seguridad.registro, las IPv6 se verán como bloque. */
create or replace function seguridad.ip()
returns text language plpgsql stable set search_path = '' as $$
declare
  h json := nullif(current_setting('request.headers', true), '')::json;
  cruda text;
  d inet;
begin
  cruda := nullif(btrim(coalesce(
    nullif(btrim(h ->> 'cf-connecting-ip'), ''),
    (select btrim(x) from unnest(string_to_array(h ->> 'x-forwarded-for', ',')) with ordinality as t(x, n)
      where btrim(x) <> '' order by n desc limit 1)
  )), '');
  if cruda is null then return null; end if;
  begin
    d := cruda::inet;
  exception when others then
    return left(cruda, 80); -- no es una dirección válida: se usa tal cual (acotada)
  end;
  if family(d) = 4 then return host(d); end if;
  -- IPv4 escrita como IPv6 (::ffff:a.b.c.d): cuenta como esa IPv4
  if d << '::ffff:0:0/96'::inet then return host(d); end if;
  return text(network(set_masklen(d, 64)));
end;
$$;
revoke all on function seguridad.ip() from public, anon, authenticated;

/* ===== 3 · Productos válidos =====
   El catálogo vive en la web (src/data/productos.ts) y la base de datos no sabía qué productos existen: se podían
   guardar votos y comentarios de productos inventados, y la lista de puntuaciones crecía sin límite.
   Esta tabla es la lista de identificadores reales. La genera `npm run productos-validos` a partir del catálogo. */
create table if not exists public.productos_validos (
  id     text primary key check (id ~ '^[A-Za-z0-9_-]{1,64}$'),
  creado timestamptz not null default now()
);
alter table public.productos_validos enable row level security;
revoke all on public.productos_validos from public, anon, authenticated;

insert into public.productos_validos (id) values
  ('amz-001'), ('amz-002'), ('amz-003'), ('amz-004'), ('amz-005'),
  ('wmt-001'), ('wmt-002'), ('wmt-003'), ('wmt-004'),
  ('tgt-001'), ('tgt-002'), ('tgt-003'), ('tgt-004'),
  ('bby-001'), ('bby-002'), ('bby-003'), ('bby-004'),
  ('eby-001'), ('eby-002'), ('eby-003'),
  ('ety-001'), ('ety-002'), ('ety-003'),
  ('temu-001'), ('temu-002'), ('temu-003'), ('temu-004'),
  ('ali-001'), ('ali-002'), ('ali-003'), ('ali-004'),
  ('hdp-001'), ('hdp-002'), ('low-001'), ('low-002')
on conflict (id) do nothing;

-- Las puntuaciones solo incluyen productos del catálogo: la respuesta queda acotada al tamaño del catálogo.
-- (Los votos antiguos de productos que no están en la lista se conservan, pero no se devuelven.)
create or replace function public.puntuaciones()
returns table (producto_id text, total bigint, recientes bigint)
language sql stable security definer set search_path = public as $$
  select v.producto_id,
         sum(v.valor)::bigint,
         coalesce(sum(v.valor) filter (where v.creado > now() - interval '48 hours'), 0)::bigint
  from public.votos v
  where exists (select 1 from public.productos_validos p where p.id = v.producto_id)
  group by v.producto_id;
$$;
revoke all on function public.puntuaciones() from public;
grant execute on function public.puntuaciones() to anon, authenticated;

-- Comentar: el producto tiene que estar en el catálogo
create or replace function public.comentar(p_producto text, p_texto text)
returns text language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); u text; a jsonb; t text := btrim(coalesce(p_texto, ''));
begin
  if uid is null then raise exception 'inicia sesión para comentar'; end if;
  select usuario, avatar into u, a from public.perfiles where id = uid;
  if u is null then raise exception 'elige un nombre de usuario'; end if;
  if not seguridad.producto_valido(p_producto) or char_length(t) not between 1 and 500
     or not exists (select 1 from public.productos_validos where id = p_producto) then
    perform seguridad.alerta('comentario_invalido', jsonb_build_object('producto', left(p_producto, 80), 'largo', char_length(p_texto)));
    return 'invalido';
  end if;
  if (select count(*) from public.comentarios where usuario_id = uid and creado > now() - interval '10 minutes') >= 3
     or (select count(*) from public.comentarios where usuario_id = uid and creado > now() - interval '1 day') >= 20
     or not seguridad.pasa_limite('comentario:' || coalesce(seguridad.ip(), 'desconocida'), 30, interval '1 day') then
    perform seguridad.alerta('limite_comentarios', jsonb_build_object('producto', p_producto));
    return 'limite';
  end if;
  insert into public.comentarios (producto_id, usuario_id, nombre, avatar, texto) values (p_producto, uid, u, a, t);
  return 'ok';
end;
$$;
revoke all on function public.comentar(text, text) from public, anon;
grant execute on function public.comentar(text, text) to authenticated;

/* ===== 4 · Un voto por IP en cada oferta, garantizado por un índice único =====
   Antes la regla era «mirar si ya hay un voto de esta IP y, si no, insertar»: dos peticiones lanzadas a la vez
   pasaban las dos. Ahora la propia tabla lo impide. Los votos son anónimos (no hay usuario), así que la regla es por IP.
   Los votos sin IP conocida no llevan huella y no entran en el índice. */

-- Los límites tampoco se saltan con peticiones simultáneas: cada clave se cuenta de una en una
create or replace function seguridad.pasa_limite(p_clave text, p_max int, p_ventana interval)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(p_clave, 0));
  if (select count(*) from seguridad.limites where clave = p_clave and creado > now() - p_ventana) >= p_max then
    return false;
  end if;
  insert into seguridad.limites (clave) values (p_clave);
  if random() < 0.01 then delete from seguridad.limites where creado < now() - interval '2 days'; end if;
  return true;
end;
$$;
revoke all on function seguridad.pasa_limite(text, int, interval) from public, anon, authenticated;

-- Limpieza previa: los votos sin IP conocida pierden la huella, y de los repetidos (misma oferta y misma IP)
-- solo el más antiguo la conserva. Ningún voto se borra.
update public.votos set ip_huella = null where ip_huella = seguridad.huella_ip('desconocida');
with repetidos as (
  select producto_id, visitante,
         row_number() over (partition by producto_id, ip_huella order by creado, visitante) as n
  from public.votos where ip_huella is not null
)
update public.votos v set ip_huella = null
  from repetidos r
  where r.producto_id = v.producto_id and r.visitante = v.visitante and r.n > 1;

drop index if exists public.votos_producto_ip_idx;
create unique index if not exists votos_un_voto_por_ip on public.votos (producto_id, ip_huella) where ip_huella is not null;

create or replace function public.votar(p_producto text, p_visitante text, p_valor int)
returns bigint
language plpgsql security definer set search_path = public as $$
declare
  ip text := seguridad.ip();
  dir text := coalesce(ip, 'desconocida');
  huella text := case when ip is null then null else seguridad.huella_ip(ip) end;
begin
  if not seguridad.producto_valido(p_producto)
     or p_visitante is null or p_visitante !~ '^[A-Za-z0-9-]{8,64}$'
     or p_valor is null or p_valor not in (-1, 0, 1) then
    perform seguridad.alerta('voto_invalido', jsonb_build_object('producto', left(p_producto, 80), 'valor', p_valor));
    return null;
  end if;
  -- El producto tiene que estar en el catálogo
  if not exists (select 1 from public.productos_validos where id = p_producto) then
    perform seguridad.alerta('voto_producto_inexistente', jsonb_build_object('producto', p_producto));
    return null;
  end if;
  if not seguridad.pasa_limite('voto:' || dir, 120, interval '1 hour')
     or not seguridad.pasa_limite('voto:' || dir || ':' || p_producto, 6, interval '1 day') then
    perform seguridad.alerta('limite_votos', jsonb_build_object('producto', p_producto));
    return null;
  end if;
  if p_valor = 0 then
    delete from public.votos where producto_id = p_producto and visitante = p_visitante;
  else
    -- Esta IP ya votó esta oferta con otro visitante: no cuenta otra vez
    if huella is not null and exists (
      select 1 from public.votos
      where producto_id = p_producto and ip_huella = huella and visitante <> p_visitante
    ) then
      perform seguridad.alerta('voto_repetido_ip', jsonb_build_object('producto', p_producto));
      return null;
    end if;
    begin
      insert into public.votos (producto_id, visitante, valor, ip_huella) values (p_producto, p_visitante, p_valor, huella)
      on conflict (producto_id, visitante) do update set valor = excluded.valor, ip_huella = excluded.ip_huella, creado = now();
    exception when unique_violation then
      -- El índice único lo ha parado: otra petición de la misma IP llegó a la vez.
      -- Si es este mismo visitante cambiando su voto, se cambia el valor sin tocar la huella; si no, no cuenta.
      update public.votos set valor = p_valor, creado = now() where producto_id = p_producto and visitante = p_visitante;
      if not found then
        perform seguridad.alerta('voto_repetido_ip', jsonb_build_object('producto', p_producto));
        return null;
      end if;
    end;
  end if;
  return coalesce((select sum(valor) from public.votos where producto_id = p_producto), 0);
end;
$$;
revoke all on function public.votar(text, text, int) from public;
grant execute on function public.votar(text, text, int) to anon, authenticated;

/* ===== 5 · Las restricciones NOT VALID se validan contra las filas antiguas =====
   «ofertas_url_limpia» y «perfiles_avatar_valido» solo se comprobaban en filas nuevas. Antes de validarlas:
   - los avatares antiguos que no cumplen se quitan (el perfil vuelve al avatar automático; sus comentarios se actualizan solos);
   - las ofertas enviadas con una dirección que no cumple se apartan a seguridad.ofertas_descartadas (no se pierden). */
update public.perfiles set avatar = null where avatar is not null and not public.avatar_valido(avatar);
update public.comentarios set avatar = null where avatar is not null and not public.avatar_valido(avatar);
alter table public.perfiles validate constraint perfiles_avatar_valido;

create table if not exists seguridad.ofertas_descartadas (like public.ofertas_enviadas);
revoke all on seguridad.ofertas_descartadas from public, anon, authenticated;
with apartadas as (
  delete from public.ofertas_enviadas where url !~ '^https://[^\s<>"''`]+$' returning *
)
insert into seguridad.ofertas_descartadas select * from apartadas;
alter table public.ofertas_enviadas validate constraint ofertas_url_limpia;

-- Las funciones auxiliares que no tenían permisos explícitos quedan cerradas a la API
-- (nombre_reservado la usa una regla que se ejecuta como el usuario: se le deja solo a las cuentas con sesión)
revoke all on function public.avatar_valido(jsonb) from public, anon;
grant execute on function public.avatar_valido(jsonb) to authenticated;
revoke all on function public.nombre_reservado(text) from public, anon;
grant execute on function public.nombre_reservado(text) to authenticated;
