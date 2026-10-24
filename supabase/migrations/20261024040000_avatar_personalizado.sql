-- Avatar personalizado: forma, expresión, fondo y color elegidos por el usuario.
-- Se guarda en el perfil y se copia a sus comentarios para que los demás lo vean igual.
-- Formato: {"forma":"auto|round|...","expresion":"idle|happy|...","fondo":"none|squircle|circle|square","tono":"auto"|0-360}
alter table public.perfiles add column if not exists avatar jsonb
  check (avatar is null or (jsonb_typeof(avatar) = 'object' and pg_column_size(avatar) < 300));
alter table public.comentarios add column if not exists avatar jsonb;

revoke all on public.perfiles from anon, authenticated;
grant select (id, usuario, avatar), insert (id, usuario, avatar), update (usuario, avatar) on public.perfiles to authenticated;
grant select (avatar) on public.comentarios to anon, authenticated;

-- Al crear la cuenta: usuario y avatar elegidos en el registro
create or replace function public.crear_perfil()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  u text := lower(btrim(coalesce(new.raw_user_meta_data ->> 'usuario', '')));
  a jsonb := new.raw_user_meta_data -> 'avatar';
begin
  if u !~ '^[a-z0-9_][a-z0-9_.]{1,18}[a-z0-9_]$' then u := null; end if;
  if a is not null and (jsonb_typeof(a) <> 'object' or pg_column_size(a) >= 300) then a := null; end if;
  begin
    insert into public.perfiles (id, usuario, avatar) values (new.id, u, a) on conflict (id) do nothing;
  exception when unique_violation then
    insert into public.perfiles (id, usuario, avatar) values (new.id, null, a) on conflict (id) do nothing;
  end;
  return new;
end;
$$;

-- Comentar copia el avatar del perfil
create or replace function public.comentar(p_producto text, p_texto text)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); u text; a jsonb;
begin
  if uid is null then raise exception 'inicia sesión para comentar'; end if;
  select usuario, avatar into u, a from public.perfiles where id = uid;
  if u is null then raise exception 'elige un nombre de usuario'; end if;
  if (select count(*) from public.comentarios where usuario_id = uid and creado > now() - interval '10 minutes') >= 3
     or (select count(*) from public.comentarios where usuario_id = uid and creado > now() - interval '1 day') >= 20 then
    raise exception 'demasiados comentarios, espera un poco';
  end if;
  insert into public.comentarios (producto_id, usuario_id, nombre, avatar, texto) values (p_producto, uid, u, a, btrim(p_texto));
end;
$$;

-- Si cambia el usuario o el avatar, sus comentarios se actualizan
create or replace function public.renombrar_comentarios()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.usuario is distinct from old.usuario and new.usuario is not null) or new.avatar is distinct from old.avatar then
    update public.comentarios set nombre = coalesce(new.usuario, nombre), avatar = new.avatar where usuario_id = new.id;
  end if;
  return new;
end;
$$;
drop trigger if exists al_cambiar_usuario on public.perfiles;
create trigger al_cambiar_usuario after update of usuario, avatar on public.perfiles for each row execute function public.renombrar_comentarios();
revoke all on function public.crear_perfil(), public.renombrar_comentarios() from public, anon, authenticated;
revoke all on function public.comentar(text, text) from public, anon;
grant execute on function public.comentar(text, text) to authenticated;
