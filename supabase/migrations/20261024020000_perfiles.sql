-- Perfiles: nombre de usuario único (el avatar se genera a partir de él en el navegador).
-- Reglas: 3 a 20 caracteres, minúsculas, números, "_" o "." (sin punto al principio ni al final).
create table if not exists public.perfiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  usuario     text unique check (usuario ~ '^[a-z0-9_][a-z0-9_.]{1,18}[a-z0-9_]$'),
  creado      timestamptz not null default now()
);
alter table public.perfiles enable row level security;
drop policy if exists "perfil propio: ver" on public.perfiles;
drop policy if exists "perfil propio: crear" on public.perfiles;
drop policy if exists "perfil propio: cambiar" on public.perfiles;
create policy "perfil propio: ver" on public.perfiles for select to authenticated using (id = (select auth.uid()));
create policy "perfil propio: crear" on public.perfiles for insert to authenticated with check (id = (select auth.uid()));
create policy "perfil propio: cambiar" on public.perfiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
revoke all on public.perfiles from anon, authenticated;
grant select (id, usuario), insert (id, usuario), update (usuario) on public.perfiles to authenticated;

-- Al crear una cuenta se crea su perfil con el usuario elegido en el registro (si es válido y está libre).
create or replace function public.crear_perfil()
returns trigger language plpgsql security definer set search_path = public as $$
declare u text := lower(btrim(coalesce(new.raw_user_meta_data ->> 'usuario', '')));
begin
  if u !~ '^[a-z0-9_][a-z0-9_.]{1,18}[a-z0-9_]$' then u := null; end if;
  begin
    insert into public.perfiles (id, usuario) values (new.id, u) on conflict (id) do nothing;
  exception when unique_violation then
    insert into public.perfiles (id, usuario) values (new.id, null) on conflict (id) do nothing;
  end;
  return new;
end;
$$;
drop trigger if exists al_crear_usuario on auth.users;
create trigger al_crear_usuario after insert on auth.users for each row execute function public.crear_perfil();
insert into public.perfiles (id) select id from auth.users on conflict (id) do nothing;

-- ¿Está libre este nombre? (para avisar mientras se escribe)
create or replace function public.usuario_disponible(p_usuario text)
returns boolean language sql stable security definer set search_path = public as $$
  select lower(btrim(p_usuario)) ~ '^[a-z0-9_][a-z0-9_.]{1,18}[a-z0-9_]$'
     and not exists (select 1 from public.perfiles where usuario = lower(btrim(p_usuario)) and id is distinct from (select auth.uid()));
$$;
revoke all on function public.usuario_disponible(text) from public;
grant execute on function public.usuario_disponible(text) to anon, authenticated;
revoke all on function public.crear_perfil() from public, anon, authenticated;
