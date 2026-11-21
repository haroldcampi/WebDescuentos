-- SEGURIDAD (auditoría 2026-11-20): registro de quién hizo qué y GraphQL desactivado.
--
-- Consultas útiles (en el SQL Editor de Supabase):
--   select * from seguridad.auditoria order by creado desc limit 100;                 -- lo último que ha pasado
--   select * from seguridad.auditoria where usuario = '<uuid>' order by creado desc;   -- todo lo que hizo una cuenta
--   select * from seguridad.auditoria where tabla = 'perfiles' and operacion = 'UPDATE'; -- cambios de nombre/avatar

/* ===== B2 · Registro de acciones =====
   Antes solo se guardaban los intentos bloqueados (seguridad.registro) y los eventos de cuenta del log de Supabase.
   Ahora cada alta, cambio o borrado en las tablas de los usuarios deja una fila: tabla, operación, cuenta, IP,
   fila afectada y los datos de antes y después. Vive en el esquema «seguridad», cerrado a la API. */
create table if not exists seguridad.auditoria (
  id        bigint generated always as identity primary key,
  tabla     text not null,
  operacion text not null check (operacion in ('INSERT', 'UPDATE', 'DELETE')),
  usuario   uuid,          -- quién (null = visitante sin sesión o un proceso interno)
  ip        text,          -- desde dónde (IPv6 agrupada en bloque /64, como en el resto de la seguridad)
  fila      text,          -- identificador de la fila afectada
  antes     jsonb,
  despues   jsonb,
  creado    timestamptz not null default now()
);
create index if not exists auditoria_creado_idx on seguridad.auditoria (creado desc);
create index if not exists auditoria_usuario_idx on seguridad.auditoria (usuario, creado desc);
revoke all on seguridad.auditoria from public, anon, authenticated;

create or replace function seguridad.auditar()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  antes jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  despues jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
  fila text := coalesce(despues, antes) ->> (case when tg_table_name in ('favoritos', 'seguidos') then 'producto_id' else 'id' end);
begin
  -- Un UPDATE que no cambia nada no se apunta
  if tg_op = 'UPDATE' and antes = despues then return null; end if;
  insert into seguridad.auditoria (tabla, operacion, usuario, ip, fila, antes, despues)
  values (tg_table_name, tg_op, auth.uid(), seguridad.ip(), fila, antes, despues);
  -- Limpieza de vez en cuando: se guardan 180 días
  if random() < 0.001 then delete from seguridad.auditoria where creado < now() - interval '180 days'; end if;
  return null;
end;
$$;
revoke all on function seguridad.auditar() from public, anon, authenticated;

-- Perfiles: crear cuenta, cambiar nombre de usuario o avatar
drop trigger if exists auditar on public.perfiles;
create trigger auditar after insert or update or delete on public.perfiles
  for each row execute function seguridad.auditar();

-- Ofertas enviadas por los usuarios (y su cambio de estado)
drop trigger if exists auditar on public.ofertas_enviadas;
create trigger auditar after insert or update or delete on public.ofertas_enviadas
  for each row execute function seguridad.auditar();

-- Comentarios: publicar, ocultar por reportes y borrar
drop trigger if exists auditar on public.comentarios;
create trigger auditar after insert or update or delete on public.comentarios
  for each row execute function seguridad.auditar();

-- Reportes de comentarios
drop trigger if exists auditar on public.comentarios_reportes;
create trigger auditar after insert or delete on public.comentarios_reportes
  for each row execute function seguridad.auditar();

-- Favoritos y alertas de precio: guardar, quitar y cambiar el precio objetivo
drop trigger if exists auditar on public.favoritos;
create trigger auditar after insert or delete on public.favoritos
  for each row execute function seguridad.auditar();
drop trigger if exists auditar on public.seguidos;
create trigger auditar after insert or update or delete on public.seguidos
  for each row execute function seguridad.auditar();

/* ===== I2 · GraphQL desactivado =====
   La web solo usa la API REST. La API GraphQL estaba expuesta (sin datos, porque los permisos están quitados),
   pero es una puerta más que no hace falta. Si algún día se necesita: create extension pg_graphql; */
drop extension if exists pg_graphql;
