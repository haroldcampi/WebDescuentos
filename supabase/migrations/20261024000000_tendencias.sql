-- Tendencias: además del total, cuántos votos netos ha recibido cada oferta en las últimas 48 horas.
drop function if exists public.puntuaciones();
create function public.puntuaciones()
returns table (producto_id text, total bigint, recientes bigint)
language sql stable security definer set search_path = public as $$
  select v.producto_id,
         sum(v.valor)::bigint,
         coalesce(sum(v.valor) filter (where v.creado > now() - interval '48 hours'), 0)::bigint
  from public.votos v group by v.producto_id;
$$;
revoke all on function public.puntuaciones() from public;
grant execute on function public.puntuaciones() to anon, authenticated;
