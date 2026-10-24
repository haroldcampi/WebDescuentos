-- Cuentas de usuario: favoritos y productos seguidos (alerta cuando baja el precio).
-- Cada usuario solo puede ver y cambiar sus propias filas (RLS con auth.uid()).

create table if not exists public.favoritos (
  usuario     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  producto_id text not null check (char_length(producto_id) between 1 and 64),
  creado      timestamptz not null default now(),
  primary key (usuario, producto_id)
);
alter table public.favoritos enable row level security;
drop policy if exists "favoritos propios" on public.favoritos;
create policy "favoritos propios" on public.favoritos for all to authenticated
  using (usuario = (select auth.uid())) with check (usuario = (select auth.uid()));
revoke all on public.favoritos from anon, authenticated;
grant select, insert, delete on public.favoritos to authenticated;

-- precio_visto: el precio la última vez que el usuario miró el producto. Si el precio actual es menor, hay aviso.
create table if not exists public.seguidos (
  usuario      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  producto_id  text not null check (char_length(producto_id) between 1 and 64),
  precio_visto numeric(10, 2) not null check (precio_visto >= 0),
  creado       timestamptz not null default now(),
  primary key (usuario, producto_id)
);
alter table public.seguidos enable row level security;
drop policy if exists "seguidos propios" on public.seguidos;
create policy "seguidos propios" on public.seguidos for all to authenticated
  using (usuario = (select auth.uid())) with check (usuario = (select auth.uid()));
revoke all on public.seguidos from anon, authenticated;
grant select, insert, update (precio_visto), delete on public.seguidos to authenticated;
