-- SEGURIDAD (auditoría 2026-11-21, run-1): correcciones del informe ~/security-audit-skill/WebDescuentos/run-1.
-- Va después de 20261121000000_privacidad.sql y redefine sus funciones; aplica las dos en orden.

/* ===== 1 · La huella de IP ya no se borra de forma que rompa los límites antiabuso =====
   Antes, aplicar_plazos ponía ip_huella = NULL a los 90 días. Eso hacía que:
   - un reporte sin huella contara como «otra conexión» por cada cuenta (3 cuentas en una conexión ocultaban un comentario);
   - un voto sin huella dejara de bloquear otro voto desde la misma conexión.
   Ahora:
   - Votos: la huella cifrada (con secreto, no reversible) se guarda mientras exista el voto; es lo que impide votar dos veces.
   - Reportes: a los 90 días se BORRA el reporte entero (no solo la huella), así no queda ningún reporte «sin huella».
   - Al contar reporteros distintos solo cuentan los que tienen huella; un reporte desde una IP desconocida no suma. */
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
  -- Conexiones distintas = huellas distintas. Un reporte sin huella (IP desconocida) no cuenta para ocultar.
  select count(distinct ip_huella) into n
    from public.comentarios_reportes where comentario_id = p_id and ip_huella is not null;
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

/* ===== 2 · Límites por cuenta de comentar, sin carreras =====
   Los límites por cuenta (3 cada 10 min, 20 al día) usaban count(*) sin bloqueo: varias peticiones a la vez podían pasarlos.
   Ahora van por seguridad.pasa_limite, que bloquea por clave antes de contar. */
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
  if not seguridad.pasa_limite('comentario_uid_10m:' || uid, 3, interval '10 minutes')
     or not seguridad.pasa_limite('comentario_uid_dia:' || uid, 20, interval '1 day')
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

/* ===== 3 · Auditoría: al borrar, solo identificadores (no el contenido) =====
   Al borrar una cuenta, la cascada copiaba en la auditoría el contenido completo (comentarios, perfil, ofertas…) durante 180 días,
   y la Política de privacidad dice que se borra todo. Ahora un DELETE guarda solo los identificadores de la fila.
   También se corrige la clave de fila de comentarios_reportes (no tiene columna id). */
create or replace function seguridad.auditar()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  clave text := case when tg_table_name in ('favoritos', 'seguidos') then 'producto_id'
                     when tg_table_name = 'comentarios_reportes' then 'comentario_id' else 'id' end;
  antes jsonb := case when tg_op = 'UPDATE' then to_jsonb(old)
                      when tg_op = 'DELETE' then jsonb_strip_nulls(jsonb_build_object(
                        'id', to_jsonb(old) -> 'id', 'producto_id', to_jsonb(old) -> 'producto_id', 'comentario_id', to_jsonb(old) -> 'comentario_id',
                        'usuario', to_jsonb(old) -> 'usuario', 'usuario_id', to_jsonb(old) -> 'usuario_id')) end;
  despues jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
  fila text := coalesce(to_jsonb(new), to_jsonb(old)) ->> clave;
begin
  if tg_op = 'UPDATE' and antes = despues then return null; end if;
  insert into seguridad.auditoria (tabla, operacion, usuario, ip, fila, antes, despues)
  values (tg_table_name, tg_op, auth.uid(), seguridad.ip(), fila, antes, despues);
  if random() < 0.001 then delete from seguridad.auditoria where creado < now() - interval '180 days'; end if;
  return null;
end;
$$;
revoke all on function seguridad.auditar() from public, anon, authenticated;
-- Lo que ya se guardó de borrados: se queda solo con los identificadores
update seguridad.auditoria a set antes = jsonb_strip_nulls(jsonb_build_object(
    'id', a.antes -> 'id', 'producto_id', a.antes -> 'producto_id', 'comentario_id', a.antes -> 'comentario_id',
    'usuario', a.antes -> 'usuario', 'usuario_id', a.antes -> 'usuario_id'))
  where a.operacion = 'DELETE' and a.antes is not null;

/* ===== 4 · Borrar mi cuenta: confirmación reciente y sin restos =====
   - Hace falta haber iniciado sesión en los últimos 15 minutos: una sesión robada o un ordenador ajeno abierto
     no basta para borrar la cuenta. La web pide la contraseña (o volver a entrar con Google) y repite.
   - Se borran también las ofertas apartadas (seguridad.ofertas_descartadas), que no tienen borrado en cascada. */
create or replace function public.borrar_mi_cuenta()
returns text language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); ultimo timestamptz;
begin
  if uid is null then return 'login'; end if;
  if not seguridad.pasa_limite('borrar:' || uid, 5, interval '1 hour') then return 'limite'; end if;
  select last_sign_in_at into ultimo from auth.users where id = uid;
  if ultimo is null or ultimo < now() - interval '15 minutes' then return 'reautenticar'; end if;
  insert into seguridad.auditoria (tabla, operacion, usuario, ip, fila) values ('cuenta', 'DELETE', uid, seguridad.ip(), uid::text);
  delete from seguridad.ofertas_descartadas where usuario_id = uid;
  delete from auth.users where id = uid;
  return 'ok';
end;
$$;
revoke all on function public.borrar_mi_cuenta() from public, anon;
grant execute on function public.borrar_mi_cuenta() to authenticated;

-- Descargar mis datos: incluye también las ofertas apartadas por dirección no válida
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
    'ofertas_apartadas', coalesce((select jsonb_agg(to_jsonb(o) - 'usuario_id' order by o.creado) from seguridad.ofertas_descartadas o where o.usuario_id = uid), '[]'),
    'aceptaciones_de_terminos', coalesce((select jsonb_agg(jsonb_build_object('version', a.version, 'via', a.via, 'fecha', a.creado) order by a.creado)
      from seguridad.aceptaciones a where a.usuario = uid), '[]')
  );
end;
$$;
revoke all on function public.mis_datos() from public, anon;
grant execute on function public.mis_datos() to authenticated;

/* ===== 5 · Plazos de conservación corregidos =====
   - Votos: ya no se borra su huella (ver 1). Reportes: se borra el reporte entero a los 90 días.
   - Cuentas inactivas: la última actividad es el último inicio de sesión O la última renovación de sesión
     (auth.sessions), para no borrar a quien sigue usando la web con la sesión abierta. */
create or replace function seguridad.aplicar_plazos()
returns void language plpgsql security definer set search_path = '' as $$
begin
  delete from public.comentarios_reportes where creado < now() - interval '90 days';
  delete from seguridad.limites where creado < now() - interval '2 days';
  delete from seguridad.ofertas_descartadas where creado < now() - interval '90 days';
  delete from public.ofertas_enviadas where estado <> 'pendiente' and creado < now() - interval '1 year';
  delete from seguridad.registro where creado < now() - interval '30 days';
  delete from seguridad.auditoria where creado < now() - interval '180 days';
  delete from auth.users u
   where coalesce(u.last_sign_in_at, u.created_at) < now() - interval '2 years'
     and not exists (select 1 from auth.sessions s where s.user_id = u.id and s.updated_at >= now() - interval '2 years');
end;
$$;
revoke all on function seguridad.aplicar_plazos() from public, anon, authenticated;

/* ===== 6 · Registro con el email de otra persona (apropiación previa de cuenta) =====
   Alguien puede registrarse con el email de la víctima (queda sin confirmar) eligiendo el nombre de usuario, el avatar
   y marcando «acepto los términos». Si después la víctima entra con Google y su email queda confirmado así,
   no debe heredar nada de lo que eligió ese desconocido: ni nombre, ni avatar, ni la aceptación de términos
   (la web le pedirá elegir nombre y aceptar los términos ella misma). */
create or replace function public.perfil_al_confirmar()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  u text := lower(btrim(coalesce(new.raw_user_meta_data ->> 'usuario', '')));
  a jsonb := new.raw_user_meta_data -> 'avatar';
  via_otro_proveedor boolean := coalesce(new.raw_app_meta_data -> 'providers', '[]'::jsonb) - 'email' <> '[]'::jsonb;
begin
  if old.email_confirmed_at is not null or new.email_confirmed_at is null then return new; end if;
  if via_otro_proveedor then
    u := null; a := null;
    delete from seguridad.aceptaciones where usuario = new.id and via = 'registro';
  end if;
  if u !~ '^[a-z0-9_][a-z0-9_.]{1,18}[a-z0-9_]$' or public.nombre_reservado(u) then u := null; end if;
  if not public.avatar_valido(a) then a := null; end if;
  insert into public.perfiles (id) values (new.id) on conflict (id) do nothing;
  begin
    update public.perfiles set usuario = coalesce(usuario, u), avatar = coalesce(avatar, a) where id = new.id;
  exception when unique_violation then
    update public.perfiles set avatar = coalesce(avatar, a) where id = new.id;
  end;
  return new;
end;
$$;
revoke all on function public.perfil_al_confirmar() from public, anon, authenticated;

/* ===== 7 · Favoritos y alertas: el navegador solo puede elegir las columnas necesarias =====
   Antes podía escribir cualquier columna al insertar (por ejemplo «creado»). */
revoke insert on public.favoritos from authenticated;
grant insert (producto_id) on public.favoritos to authenticated;
revoke insert on public.seguidos from authenticated;
grant insert (producto_id, precio_visto, precio_objetivo) on public.seguidos to authenticated;
