-- 1) Alerta con precio objetivo: «avísame cuando baje de $X»
alter table public.seguidos add column if not exists precio_objetivo numeric(10, 2) check (precio_objetivo is null or precio_objetivo > 0);
grant select (precio_objetivo), insert (precio_objetivo), update (precio_objetivo) on public.seguidos to authenticated;

-- 2) Ofertas enviadas por la comunidad. Quedan «pendiente» hasta que las revises en Supabase
--    (Table Editor > ofertas_enviadas) y decidas publicarlas en productos.js.
create table if not exists public.ofertas_enviadas (
  id          bigint generated always as identity primary key,
  usuario_id  uuid not null default auth.uid() references auth.users (id) on delete cascade,
  url         text not null check (url ~ '^https://' and char_length(url) <= 600),
  titulo      text not null check (char_length(btrim(titulo)) between 3 and 140),
  tienda      text not null check (char_length(tienda) between 2 and 40),
  precio      numeric(10, 2) check (precio is null or precio >= 0),
  precio_antes numeric(10, 2) check (precio_antes is null or precio_antes >= 0),
  cupon       text check (cupon is null or char_length(cupon) <= 60),
  nota        text check (nota is null or char_length(nota) <= 500),
  estado      text not null default 'pendiente' check (estado in ('pendiente', 'publicada', 'rechazada')),
  creado      timestamptz not null default now()
);
alter table public.ofertas_enviadas enable row level security;
drop policy if exists "enviar ofertas propias" on public.ofertas_enviadas;
drop policy if exists "ver ofertas propias" on public.ofertas_enviadas;
create policy "enviar ofertas propias" on public.ofertas_enviadas for insert to authenticated with check (usuario_id = (select auth.uid()) and estado = 'pendiente');
create policy "ver ofertas propias" on public.ofertas_enviadas for select to authenticated using (usuario_id = (select auth.uid()));
revoke all on public.ofertas_enviadas from anon, authenticated;
grant select, insert (url, titulo, tienda, precio, precio_antes, cupon, nota) on public.ofertas_enviadas to authenticated;

-- Límite: 5 ofertas al día por usuario
create or replace function public.limite_ofertas()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.ofertas_enviadas where usuario_id = new.usuario_id and creado > now() - interval '1 day') >= 5 then
    raise exception 'demasiadas ofertas, vuelve mañana';
  end if;
  return new;
end;
$$;
drop trigger if exists antes_de_enviar_oferta on public.ofertas_enviadas;
create trigger antes_de_enviar_oferta before insert on public.ofertas_enviadas for each row execute function public.limite_ofertas();
revoke all on function public.limite_ofertas() from public, anon, authenticated;
