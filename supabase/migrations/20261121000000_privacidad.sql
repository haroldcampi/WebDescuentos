-- PRIVACIDAD (revisión legal 2026-11-21, mercado EE. UU.): borrar la cuenta, descargar los datos,
-- registro de quién aceptó los Términos y plazos de conservación aplicados solos cada día.

/* ===== Aceptación de los Términos y la Política de privacidad =====
   Una fila por aceptación: quién, qué versión, cuándo, desde qué IP y por qué vía.
   - «registro»: al crear la cuenta con email (la casilla del formulario manda la versión en los metadatos)
   - «web»: al aceptar en la ventana que aparece si la cuenta entró con Google o si la versión ha cambiado
   Vive en el esquema «seguridad», cerrado a la API: el usuario no puede borrarla ni falsearla. */
create table if not exists seguridad.aceptaciones (
  id       bigint generated always as identity primary key,
  usuario  uuid not null references auth.users (id) on delete cascade,
  version  text not null check (char_length(version) between 1 and 20),
  via      text not null check (via in ('registro', 'web')),
  ip       text,
  creado   timestamptz not null default now()
);
create index if not exists aceptaciones_usuario_idx on seguridad.aceptaciones (usuario, creado desc);
revoke all on seguridad.aceptaciones from public, anon, authenticated;

create or replace function seguridad.aceptacion_al_registrarse()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v text := left(btrim(coalesce(new.raw_user_meta_data ->> 'terminos', '')), 20);
begin
  if v <> '' then insert into seguridad.aceptaciones (usuario, version, via) values (new.id, v, 'registro'); end if;
  return new;
end;
$$;
revoke all on function seguridad.aceptacion_al_registrarse() from public, anon, authenticated;
drop trigger if exists aceptacion_al_registrarse on auth.users;
create trigger aceptacion_al_registrarse after insert on auth.users
  for each row execute function seguridad.aceptacion_al_registrarse();

create or replace function public.aceptar_terminos(p_version text)
returns text language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); v text := btrim(coalesce(p_version, ''));
begin
  if uid is null then return 'login'; end if;
  if v !~ '^[0-9A-Za-z._-]{1,20}$' then return 'invalido'; end if;
  if not seguridad.pasa_limite('terminos:' || uid, 20, interval '1 day') then return 'limite'; end if;
  insert into seguridad.aceptaciones (usuario, version, via, ip) values (uid, v, 'web', seguridad.ip());
  return 'ok';
end;
$$;
revoke all on function public.aceptar_terminos(text) from public, anon;
grant execute on function public.aceptar_terminos(text) to authenticated;

-- Última versión aceptada por la cuenta con sesión (null si nunca aceptó)
create or replace function public.version_aceptada()
returns text language sql stable security definer set search_path = '' as $$
  select version from seguridad.aceptaciones where usuario = auth.uid() order by creado desc limit 1;
$$;
revoke all on function public.version_aceptada() from public, anon;
grant execute on function public.version_aceptada() to authenticated;

/* ===== Descargar mis datos =====
   Todo lo que la base de datos guarda de la cuenta con sesión, en un solo JSON. */
create or replace function public.mis_datos()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then return null; end if;
  return jsonb_build_object(
    'generado', now(),
    'cuenta', (select jsonb_build_object(
        'id', u.id, 'email', u.email, 'creada', u.created_at, 'email_confirmado', u.email_confirmed_at,
        'ultimo_acceso', u.last_sign_in_at, 'proveedores', u.raw_app_meta_data -> 'providers', 'metadatos', u.raw_user_meta_data)
      from auth.users u where u.id = uid),
    'perfil', (select to_jsonb(p) from public.perfiles p where p.id = uid),
    'favoritos', coalesce((select jsonb_agg(to_jsonb(f) - 'usuario' order by f.creado) from public.favoritos f where f.usuario = uid), '[]'),
    'alertas_de_precio', coalesce((select jsonb_agg(to_jsonb(s) - 'usuario' order by s.creado) from public.seguidos s where s.usuario = uid), '[]'),
    'comentarios', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'producto', c.producto_id, 'texto', c.texto, 'creado', c.creado, 'oculto', c.oculto) order by c.creado)
      from public.comentarios c where c.usuario_id = uid), '[]'),
    'reportes_enviados', coalesce((select jsonb_agg(jsonb_build_object('comentario', r.comentario_id, 'creado', r.creado))
      from public.comentarios_reportes r where r.usuario_id = uid), '[]'),
    'ofertas_enviadas', coalesce((select jsonb_agg(to_jsonb(o) - 'usuario_id' order by o.creado) from public.ofertas_enviadas o where o.usuario_id = uid), '[]'),
    'aceptaciones_de_terminos', coalesce((select jsonb_agg(jsonb_build_object('version', a.version, 'via', a.via, 'fecha', a.creado) order by a.creado)
      from seguridad.aceptaciones a where a.usuario = uid), '[]')
  );
end;
$$;
revoke all on function public.mis_datos() from public, anon;
grant execute on function public.mis_datos() to authenticated;

/* ===== Borrar mi cuenta =====
   Borra el usuario de Supabase Auth; todo lo suyo se borra en cascada (perfil, favoritos, alertas, comentarios,
   reportes, ofertas enviadas y aceptaciones). Los votos no van ligados a la cuenta (son anónimos, por navegador).
   El registro de auditoría conserva la huella del borrado 180 días por seguridad (lo dice la Política de privacidad). */
create or replace function public.borrar_mi_cuenta()
returns text language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then return 'login'; end if;
  if not seguridad.pasa_limite('borrar:' || uid, 5, interval '1 hour') then return 'limite'; end if;
  insert into seguridad.auditoria (tabla, operacion, usuario, ip, fila) values ('cuenta', 'DELETE', uid, seguridad.ip(), uid::text);
  delete from auth.users where id = uid;
  return 'ok';
end;
$$;
revoke all on function public.borrar_mi_cuenta() from public, anon;
grant execute on function public.borrar_mi_cuenta() to authenticated;

/* ===== Plazos de conservación (los publicados en la Política de privacidad) =====
   Se aplican solos cada día a las 09:17 UTC con pg_cron. */
create or replace function seguridad.aplicar_plazos()
returns void language plpgsql security definer set search_path = '' as $$
begin
  -- Huella de IP de votos y reportes: solo hace falta para frenar abusos recientes → 90 días
  update public.votos set ip_huella = null where ip_huella is not null and creado < now() - interval '90 days';
  update public.comentarios_reportes set ip_huella = null where ip_huella is not null and creado < now() - interval '90 days';
  -- Contadores de límites por IP: 2 días
  delete from seguridad.limites where creado < now() - interval '2 days';
  -- Ofertas apartadas por dirección no válida: 90 días; ofertas enviadas ya revisadas: 1 año
  delete from seguridad.ofertas_descartadas where creado < now() - interval '90 days';
  delete from public.ofertas_enviadas where estado <> 'pendiente' and creado < now() - interval '1 year';
  -- Registros de seguridad (30 días) y auditoría (180 días)
  delete from seguridad.registro where creado < now() - interval '30 days';
  delete from seguridad.auditoria where creado < now() - interval '180 days';
  -- Cuentas sin entrar en 2 años: se borran con todos sus datos (en cascada)
  delete from auth.users where coalesce(last_sign_in_at, created_at) < now() - interval '2 years';
end;
$$;
revoke all on function seguridad.aplicar_plazos() from public, anon, authenticated;

create extension if not exists pg_cron;
select cron.unschedule('aplicar-plazos') where exists (select 1 from cron.job where jobname = 'aplicar-plazos');
select cron.schedule('aplicar-plazos', '17 9 * * *', 'select seguridad.aplicar_plazos()');
