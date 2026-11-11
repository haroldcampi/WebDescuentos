-- SEGURIDAD (auditoría 2026-11-11): nombres de usuario reservados y reportes de comentarios.
-- Aplicar DESPUÉS de 20261111010000_huella_con_secreto_y_nombre_fijo.sql
-- (con `supabase db push`, o pegándolo en Supabase > SQL Editor > New query > Run).

/* ===== Nombres reservados =====
   Nadie puede llamarse como el equipo de la web o como una tienda (admin, soporte, radardeofertas, amazon…).
   Se comparan sin «_» ni «.» y leyendo 0→o, 1→i, 3→e, 4→a, 5→s, 7→t, así «adm1n» o «sop.orte» también cuentan.
   Desde el SQL Editor (sin sesión de usuario) sí puedes ponerle uno de estos nombres a una cuenta, por ejemplo la tuya. */
create or replace function public.nombre_reservado(p text)
returns boolean language sql immutable set search_path = '' as $$
  with n as (select translate(lower(coalesce(p, '')), '013457_.', 'oieast') as v)
  select n.v ~ '^(admin|administr|soporte|support|moderador|moderator|staff|oficial|official|radardeofertas|radarofertas|dealradar|webmaster|noreply|seguridad|security|sistema|system)'
      or n.v in ('root', 'mod', 'mods', 'ayuda', 'help', 'equipo', 'team', 'info', 'contacto', 'contact', 'radar', 'null', 'undefined',
                 'anonimo', 'anonymous', 'eliminado', 'deleted', 'usuario', 'user',
                 'amazon', 'walmart', 'target', 'bestbuy', 'ebay', 'etsy', 'temu', 'aliexpress', 'homedepot', 'lowes', 'google')
  from n;
$$;

-- Sustituye a la regla del nombre fijo (N2) y añade la de los reservados
create or replace function public.nombre_no_se_quita()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and old.usuario is not null and new.usuario is null then
    raise exception 'el nombre de usuario no se puede quitar, solo cambiar' using errcode = 'check_violation';
  end if;
  if new.usuario is not null
     and (tg_op = 'INSERT' or new.usuario is distinct from old.usuario)
     and auth.uid() is not null
     and public.nombre_reservado(new.usuario) then
    raise exception 'ese nombre de usuario está reservado' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;
revoke all on function public.nombre_no_se_quita() from public, anon, authenticated;
drop trigger if exists antes_de_cambiar_usuario on public.perfiles;
create trigger antes_de_cambiar_usuario before insert or update of usuario on public.perfiles
  for each row execute function public.nombre_no_se_quita();

-- Al registrarse con un nombre reservado, la cuenta se crea igual pero sin nombre (lo elige después)
create or replace function public.crear_perfil()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  u text := lower(btrim(coalesce(new.raw_user_meta_data ->> 'usuario', '')));
  a jsonb := new.raw_user_meta_data -> 'avatar';
begin
  if u !~ '^[a-z0-9_][a-z0-9_.]{1,18}[a-z0-9_]$' or public.nombre_reservado(u) then u := null; end if;
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

-- «¿Está libre?» responde que no para los reservados
create or replace function public.usuario_disponible(p_usuario text)
returns boolean language plpgsql volatile security definer set search_path = public as $$
declare u text := lower(btrim(coalesce(p_usuario, '')));
begin
  if not seguridad.pasa_limite('usuario:' || coalesce(seguridad.ip(), 'desconocida'), 60, interval '10 minutes') then
    perform seguridad.alerta('limite_usuario_disponible');
    return false;
  end if;
  return u ~ '^[a-z0-9_][a-z0-9_.]{1,18}[a-z0-9_]$'
     and not public.nombre_reservado(u)
     and not exists (select 1 from public.perfiles where usuario = u and id is distinct from (select auth.uid()));
end;
$$;
revoke all on function public.usuario_disponible(text) from public;
grant execute on function public.usuario_disponible(text) to anon, authenticated;

/* ===== Reportar comentarios =====
   Cualquiera con cuenta puede reportar un comentario (no el suyo). Con 3 reportes de cuentas Y conexiones
   distintas, el comentario se oculta solo y queda constancia en seguridad.registro («comentario_oculto»).
   Para revisarlos (SQL Editor):
     select c.id, c.nombre, c.texto, c.oculto, count(r.*) as reportes
     from public.comentarios c join public.comentarios_reportes r on r.comentario_id = c.id
     group by c.id order by reportes desc;
   Para volver a mostrar uno: update public.comentarios set oculto = false where id = …;
                              delete from public.comentarios_reportes where comentario_id = …; */
create table if not exists public.comentarios_reportes (
  comentario_id bigint not null references public.comentarios (id) on delete cascade,
  usuario_id    uuid not null references auth.users (id) on delete cascade,
  ip_huella     text,
  creado        timestamptz not null default now(),
  primary key (comentario_id, usuario_id)
);
alter table public.comentarios_reportes enable row level security;
revoke all on public.comentarios_reportes from anon, authenticated;

-- Devuelve 'ok', 'oculto' (ya se ocultó), 'ya' (ya lo habías reportado), 'limite', 'invalido' o 'login'
create or replace function public.reportar_comentario(p_id bigint)
returns text language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  dir text := coalesce(seguridad.ip(), 'desconocida');
  n int;
begin
  if uid is null then return 'login'; end if;
  if p_id is null or not exists (select 1 from public.comentarios where id = p_id and not oculto and usuario_id is distinct from uid) then
    return 'invalido';
  end if;
  if exists (select 1 from public.comentarios_reportes where comentario_id = p_id and usuario_id = uid) then
    return 'ya';
  end if;
  if not seguridad.pasa_limite('reporte:' || uid, 20, interval '1 day')
     or not seguridad.pasa_limite('reporte_ip:' || dir, 40, interval '1 day') then
    perform seguridad.alerta('limite_reportes', jsonb_build_object('comentario', p_id));
    return 'limite';
  end if;
  insert into public.comentarios_reportes (comentario_id, usuario_id, ip_huella)
    values (p_id, uid, case when dir = 'desconocida' then null else seguridad.huella_ip(dir) end)
    on conflict do nothing;
  select count(distinct coalesce(ip_huella, usuario_id::text)) into n
    from public.comentarios_reportes where comentario_id = p_id;
  if n >= 3 then
    update public.comentarios set oculto = true where id = p_id;
    perform seguridad.alerta('comentario_oculto', jsonb_build_object('comentario', p_id, 'reportes', n));
    return 'oculto';
  end if;
  return 'ok';
end;
$$;
revoke all on function public.reportar_comentario(bigint) from public, anon;
grant execute on function public.reportar_comentario(bigint) to authenticated;
