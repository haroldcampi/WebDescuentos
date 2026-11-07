-- SEGURIDAD: límites por IP, validación en el servidor y registro de actividad sospechosa.
--
-- Todo lo nuevo vive en el esquema «seguridad», que la API de Supabase no publica: ni la web
-- ni nadie con la clave pública puede leerlo o cambiarlo. Solo lo usan las funciones de abajo.
--
-- Para vigilar (Supabase > SQL Editor):
--   select * from seguridad.resumen;            -- intentos bloqueados en las últimas 24 h, por tipo e IP
--   select * from seguridad.registro order by creado desc limit 100;
--   select * from seguridad.actividad_cuentas;  -- registros y peticiones de contraseña por IP (24 h)

create schema if not exists seguridad;
revoke all on schema seguridad from public, anon, authenticated;

-- Cada acción que cuenta para un límite deja aquí una fila (se borran solas a los 2 días)
create table if not exists seguridad.limites (
  clave  text not null,
  creado timestamptz not null default now()
);
create index if not exists limites_clave_idx on seguridad.limites (clave, creado desc);

-- Intentos bloqueados o raros. Se agrupan por minuto para que un bot no llene la tabla.
create table if not exists seguridad.registro (
  id      bigint generated always as identity primary key,
  tipo    text not null,
  ip      text,
  usuario uuid,
  detalle jsonb,
  minuto  timestamptz not null default date_trunc('minute', now()),
  veces   int not null default 1,
  creado  timestamptz not null default now()
);
create unique index if not exists registro_agrupado_idx on seguridad.registro (tipo, coalesce(ip, ''), coalesce(usuario, '00000000-0000-0000-0000-000000000000'::uuid), minuto);
create index if not exists registro_creado_idx on seguridad.registro (creado desc);
revoke all on all tables in schema seguridad from public, anon, authenticated;

-- IP del visitante, tal como la ve Supabase
create or replace function seguridad.ip()
returns text language sql stable set search_path = '' as $$
  select nullif(btrim(coalesce(
    current_setting('request.headers', true)::json ->> 'cf-connecting-ip',
    split_part(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ',', 1)
  )), '');
$$;

-- Apunta un intento sospechoso (sin detener nada)
create or replace function seguridad.alerta(p_tipo text, p_detalle jsonb default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into seguridad.registro (tipo, ip, usuario, detalle)
  values (p_tipo, seguridad.ip(), auth.uid(), p_detalle)
  on conflict (tipo, coalesce(ip, ''), coalesce(usuario, '00000000-0000-0000-0000-000000000000'::uuid), minuto)
  do update set veces = seguridad.registro.veces + 1, detalle = excluded.detalle;
  -- Limpieza ocasional: se guardan 30 días
  if random() < 0.01 then delete from seguridad.registro where creado < now() - interval '30 days'; end if;
end;
$$;

-- ¿Puede hacer otra acción con esta clave? Si sí, la cuenta y devuelve true.
create or replace function seguridad.pasa_limite(p_clave text, p_max int, p_ventana interval)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from seguridad.limites where clave = p_clave and creado > now() - p_ventana) >= p_max then
    return false;
  end if;
  insert into seguridad.limites (clave) values (p_clave);
  if random() < 0.01 then delete from seguridad.limites where creado < now() - interval '2 days'; end if;
  return true;
end;
$$;

revoke all on all functions in schema seguridad from public, anon, authenticated;

-- Formato de los identificadores de producto (como "amz-001")
create or replace function seguridad.producto_valido(p text)
returns boolean language sql immutable set search_path = '' as $$
  select p is not null and p ~ '^[A-Za-z0-9_-]{1,64}$';
$$;

/* ===== Votos =====
   Antes cualquiera podía inventarse identificadores de visitante y votar sin fin.
   Ahora, por IP: 120 votos por hora en total y 6 al día sobre la misma oferta.
   Devuelve el total de la oferta, o null si se rechaza (la web lo deshace y avisa). */
create or replace function public.votar(p_producto text, p_visitante text, p_valor int)
returns bigint
language plpgsql security definer set search_path = public as $$
declare dir text := coalesce(seguridad.ip(), 'desconocida');
begin
  if not seguridad.producto_valido(p_producto)
     or p_visitante is null or p_visitante !~ '^[A-Za-z0-9-]{8,64}$'
     or p_valor is null or p_valor not in (-1, 0, 1) then
    perform seguridad.alerta('voto_invalido', jsonb_build_object('producto', left(p_producto, 80), 'valor', p_valor));
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
    insert into public.votos (producto_id, visitante, valor) values (p_producto, p_visitante, p_valor)
    on conflict (producto_id, visitante) do update set valor = excluded.valor, creado = now();
  end if;
  return coalesce((select sum(valor) from public.votos where producto_id = p_producto), 0);
end;
$$;
revoke all on function public.votar(text, text, int) from public;
grant execute on function public.votar(text, text, int) to anon, authenticated;

/* ===== Comentarios =====
   Devuelve 'ok', 'limite' o 'invalido' en vez de dar error, para poder dejar constancia del intento.
   Límites: 3 cada 10 minutos y 20 al día por cuenta, y 30 al día por IP (contra cuentas falsas). */
drop function if exists public.comentar(text, text);
create function public.comentar(p_producto text, p_texto text)
returns text language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); u text; a jsonb; t text := btrim(coalesce(p_texto, ''));
begin
  if uid is null then raise exception 'inicia sesión para comentar'; end if;
  select usuario, avatar into u, a from public.perfiles where id = uid;
  if u is null then raise exception 'elige un nombre de usuario'; end if;
  if not seguridad.producto_valido(p_producto) or char_length(t) not between 1 and 500 then
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

/* ===== Ofertas enviadas =====
   Si pasa el límite (5 al día por cuenta, 15 por IP) la fila no se guarda y queda constancia.
   La web pide la fila de vuelta: si no llega, avisa de que espere. */
create or replace function public.limite_ofertas()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.ofertas_enviadas where usuario_id = new.usuario_id and creado > now() - interval '1 day') >= 5
     or not seguridad.pasa_limite('oferta:' || coalesce(seguridad.ip(), 'desconocida'), 15, interval '1 day') then
    perform seguridad.alerta('limite_ofertas', jsonb_build_object('url', left(new.url, 200)));
    return null;
  end if;
  return new;
end;
$$;
revoke all on function public.limite_ofertas() from public, anon, authenticated;

-- La dirección de la oferta: https y sin espacios ni caracteres de HTML
alter table public.ofertas_enviadas drop constraint if exists ofertas_url_limpia;
alter table public.ofertas_enviadas add constraint ofertas_url_limpia check (url ~ '^https://[^\s<>"''`]+$') not valid;

/* ===== ¿Está libre este nombre? =====
   Máximo 60 consultas cada 10 minutos por IP (evita recorrer la lista de usuarios). */
create or replace function public.usuario_disponible(p_usuario text)
returns boolean language plpgsql volatile security definer set search_path = public as $$
declare u text := lower(btrim(coalesce(p_usuario, '')));
begin
  if not seguridad.pasa_limite('usuario:' || coalesce(seguridad.ip(), 'desconocida'), 60, interval '10 minutes') then
    perform seguridad.alerta('limite_usuario_disponible');
    return false;
  end if;
  return u ~ '^[a-z0-9_][a-z0-9_.]{1,18}[a-z0-9_]$'
     and not exists (select 1 from public.perfiles where usuario = u and id is distinct from (select auth.uid()));
end;
$$;
revoke all on function public.usuario_disponible(text) from public;
grant execute on function public.usuario_disponible(text) to anon, authenticated;

/* ===== Avatar: solo los valores que ofrece el editor =====
   El navegador puede escribir el avatar de su perfil directamente, así que lo comprueba la base de datos. */
create or replace function public.avatar_valido(a jsonb)
returns boolean language sql immutable set search_path = '' as $$
  select a is null or (
    jsonb_typeof(a) = 'object' and pg_column_size(a) < 300
    and not exists (select 1 from jsonb_object_keys(a) k where k not in ('forma', 'expresion', 'fondo', 'tono'))
    and coalesce(a ->> 'forma', 'auto') in ('auto', 'round', 'organic', 'boxy', 'capsule', 'nub', 'cloud', 'droplet', 'hexagon', 'sun', 'triangle')
    and coalesce(a ->> 'expresion', 'idle') in ('idle', 'happy', 'sad', 'mad', 'surprised', 'wink', 'sleepy', 'smug', 'unsure', 'scared', 'love', 'shy', 'sick', 'thinking')
    and coalesce(a ->> 'fondo', 'squircle') in ('none', 'squircle', 'circle', 'square')
    and coalesce(a ->> 'tono', 'auto') in ('auto', '350', '18', '42', '125', '172', '205', '235', '285')
  );
$$;
alter table public.perfiles drop constraint if exists perfiles_avatar_valido;
alter table public.perfiles add constraint perfiles_avatar_valido check (public.avatar_valido(avatar)) not valid;

-- Al crear la cuenta, un avatar que no cumpla se descarta (en vez de impedir el registro)
create or replace function public.crear_perfil()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  u text := lower(btrim(coalesce(new.raw_user_meta_data ->> 'usuario', '')));
  a jsonb := new.raw_user_meta_data -> 'avatar';
begin
  if u !~ '^[a-z0-9_][a-z0-9_.]{1,18}[a-z0-9_]$' then u := null; end if;
  if not public.avatar_valido(a) then a := null; end if;
  begin
    insert into public.perfiles (id, usuario, avatar) values (new.id, u, a) on conflict (id) do nothing;
  exception when unique_violation then
    insert into public.perfiles (id, usuario, avatar) values (new.id, null, a) on conflict (id) do nothing;
  end;
  return new;
end;
$$;
revoke all on function public.crear_perfil() from public, anon, authenticated;

/* ===== Vigilancia ===== */
create or replace view seguridad.resumen as
  select tipo, ip, sum(veces) as intentos, count(distinct usuario) as cuentas, min(creado) as primero, max(creado) as ultimo
  from seguridad.registro where creado > now() - interval '24 hours'
  group by tipo, ip order by intentos desc;

-- Registros y peticiones de cambio de contraseña por IP (del registro de Supabase Auth)
create or replace view seguridad.actividad_cuentas as
  select payload ->> 'action' as accion, ip_address as ip, count(*) as veces, max(created_at) as ultimo
  from auth.audit_log_entries
  where created_at > now() - interval '24 hours'
    and payload ->> 'action' in ('user_signedup', 'user_recovery_requested', 'user_repeated_signup', 'user_confirmation_requested', 'user_updated_password')
  group by 1, 2 order by veces desc;
revoke all on seguridad.resumen, seguridad.actividad_cuentas from public, anon, authenticated;

/* ===== Lo que se cree en el futuro empieza cerrado =====
   Por defecto Supabase abre a la API cada tabla o función nueva de «public».
   Con esto, cada migración tiene que dar los permisos a mano (como ya hacen todas). */
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke execute on functions from public, anon, authenticated;
