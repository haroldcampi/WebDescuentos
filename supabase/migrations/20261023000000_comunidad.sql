-- RADAR DE OFERTAS · votos y comentarios de la comunidad
-- Se aplica con `supabase db push`, o pegándolo en Supabase (SQL Editor > New query > Run).
-- Después pon la URL del proyecto y su clave "anon" en app.js (bloque SUPABASE).
--
-- Seguridad: las tablas están cerradas (RLS sin permisos de escritura).
-- La web solo puede votar y comentar a través de las funciones de abajo, que validan los datos
-- y limitan cuántos comentarios puede enviar cada visitante.
-- Para ocultar un comentario: Table Editor > comentarios > marca "oculto" = true.

-- Votos: uno por oferta y visitante (+1 buena oferta, -1 mala)
create table if not exists public.votos (
  producto_id text not null check (char_length(producto_id) between 1 and 64),
  visitante   text not null check (char_length(visitante) between 8 and 64),
  valor       smallint not null check (valor in (-1, 1)),
  creado      timestamptz not null default now(),
  primary key (producto_id, visitante)
);
alter table public.votos enable row level security;

-- Comentarios públicos
create table if not exists public.comentarios (
  id          bigint generated always as identity primary key,
  producto_id text not null check (char_length(producto_id) between 1 and 64),
  visitante   text not null check (char_length(visitante) between 8 and 64),
  nombre      text not null check (char_length(nombre) between 1 and 40),
  texto       text not null check (char_length(texto) between 1 and 500),
  creado      timestamptz not null default now(),
  oculto      boolean not null default false
);
create index if not exists comentarios_producto_idx on public.comentarios (producto_id, creado desc);
create index if not exists comentarios_visitante_idx on public.comentarios (visitante, creado desc);
alter table public.comentarios enable row level security;

-- Cualquiera puede leer los comentarios visibles (sin ver el identificador del visitante)
drop policy if exists "leer comentarios visibles" on public.comentarios;
create policy "leer comentarios visibles" on public.comentarios for select to anon, authenticated using (not oculto);
revoke all on public.comentarios from anon, authenticated;
grant select (id, producto_id, nombre, texto, creado) on public.comentarios to anon, authenticated;
revoke all on public.votos from anon, authenticated;

-- Total de votos de cada oferta
create or replace function public.puntuaciones()
returns table (producto_id text, total bigint)
language sql stable security definer set search_path = public as $$
  select v.producto_id, sum(v.valor)::bigint from public.votos v group by v.producto_id;
$$;

-- Votar: p_valor = 1, -1, o 0 para quitar el voto. Devuelve el nuevo total de la oferta.
create or replace function public.votar(p_producto text, p_visitante text, p_valor int)
returns bigint
language plpgsql security definer set search_path = public as $$
begin
  if p_valor = 0 then
    delete from public.votos where producto_id = p_producto and visitante = p_visitante;
  elsif p_valor in (-1, 1) then
    insert into public.votos (producto_id, visitante, valor) values (p_producto, p_visitante, p_valor)
    on conflict (producto_id, visitante) do update set valor = excluded.valor, creado = now();
  else
    raise exception 'valor no válido';
  end if;
  return coalesce((select sum(valor) from public.votos where producto_id = p_producto), 0);
end;
$$;

-- Comentar, con límite: 3 cada 10 minutos y 20 al día por visitante
create or replace function public.comentar(p_producto text, p_visitante text, p_nombre text, p_texto text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.comentarios where visitante = p_visitante and creado > now() - interval '10 minutes') >= 3
     or (select count(*) from public.comentarios where visitante = p_visitante and creado > now() - interval '1 day') >= 20 then
    raise exception 'demasiados comentarios, espera un poco';
  end if;
  insert into public.comentarios (producto_id, visitante, nombre, texto)
  values (p_producto, p_visitante, btrim(p_nombre), btrim(p_texto));
end;
$$;

revoke all on function public.puntuaciones() from public;
revoke all on function public.votar(text, text, int) from public;
revoke all on function public.comentar(text, text, text, text) from public;
grant execute on function public.puntuaciones() to anon, authenticated;
grant execute on function public.votar(text, text, int) to anon, authenticated;
grant execute on function public.comentar(text, text, text, text) to anon, authenticated;
