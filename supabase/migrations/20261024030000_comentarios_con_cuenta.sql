-- Comentarios solo con cuenta: el nombre que se muestra es el nombre de usuario del perfil,
-- lo pone la base de datos (no el navegador), así que nunca puede aparecer un email.
alter table public.comentarios add column if not exists usuario_id uuid references auth.users (id) on delete cascade;
alter table public.comentarios alter column visitante drop not null;

drop function if exists public.comentar(text, text, text, text);
create or replace function public.comentar(p_producto text, p_texto text)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); u text;
begin
  if uid is null then raise exception 'inicia sesión para comentar'; end if;
  select usuario into u from public.perfiles where id = uid;
  if u is null then raise exception 'elige un nombre de usuario'; end if;
  if (select count(*) from public.comentarios where usuario_id = uid and creado > now() - interval '10 minutes') >= 3
     or (select count(*) from public.comentarios where usuario_id = uid and creado > now() - interval '1 day') >= 20 then
    raise exception 'demasiados comentarios, espera un poco';
  end if;
  insert into public.comentarios (producto_id, usuario_id, nombre, texto) values (p_producto, uid, u, btrim(p_texto));
end;
$$;
revoke all on function public.comentar(text, text) from public, anon;
grant execute on function public.comentar(text, text) to authenticated;

-- Si alguien cambia su nombre de usuario, sus comentarios muestran el nuevo
create or replace function public.renombrar_comentarios()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.usuario is distinct from old.usuario and new.usuario is not null then
    update public.comentarios set nombre = new.usuario where usuario_id = new.id;
  end if;
  return new;
end;
$$;
drop trigger if exists al_cambiar_usuario on public.perfiles;
create trigger al_cambiar_usuario after update of usuario on public.perfiles for each row execute function public.renombrar_comentarios();
revoke all on function public.renombrar_comentarios() from public, anon, authenticated;

-- Los comentarios anónimos anteriores (con nombre escrito a mano) dejan de mostrarse
update public.comentarios set oculto = true where usuario_id is null;
