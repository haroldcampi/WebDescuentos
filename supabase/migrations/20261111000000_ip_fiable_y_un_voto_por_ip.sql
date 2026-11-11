-- SEGURIDAD (auditoría 2026-11-11): IP fiable para los límites y un voto por IP en cada oferta.
-- Se aplica con `supabase db push`, o pegándolo en Supabase (SQL Editor > New query > Run).

/* ===== V1 · IP del visitante =====
   Antes, si faltaba «cf-connecting-ip», se usaba el PRIMER valor de «x-forwarded-for».
   Ese valor lo escribe el propio navegador, así que cualquiera podía inventarse una IP en cada
   petición y saltarse todos los límites (votos, comentarios, ofertas, nombres de usuario).
   Ahora: «cf-connecting-ip» (la pone Cloudflare y no se puede falsificar) y, si faltara,
   el ÚLTIMO valor de «x-forwarded-for», que añade el proxy de Supabase y no el visitante.

   Para comprobar que funciona (después de unos votos o comentarios):
     select ip, tipo, sum(veces) from seguridad.registro group by 1, 2 order by 3 desc limit 20;
   Las IPs deben ser de visitantes reales y distintas entre sí. */
create or replace function seguridad.ip()
returns text language sql stable set search_path = '' as $$
  with h as (select current_setting('request.headers', true)::json as j)
  select nullif(btrim(coalesce(
    nullif(btrim(h.j ->> 'cf-connecting-ip'), ''),
    (select btrim(x) from unnest(string_to_array(h.j ->> 'x-forwarded-for', ',')) with ordinality as t(x, n)
      where btrim(x) <> '' order by n desc limit 1)
  )), '')
  from h;
$$;
revoke all on function seguridad.ip() from public, anon, authenticated;

/* ===== F1 · Un voto por IP en cada oferta =====
   Antes, una misma IP podía votar 6 veces la misma oferta cambiando el identificador de visitante
   (que lo genera el navegador). Ahora cada voto guarda una huella de la IP (sha256, no la IP en claro)
   y se rechaza el voto si esa IP ya votó esa oferta con otro visitante.
   Cambiar o quitar el propio voto sigue funcionando igual.
   Nota: dos personas detrás de la misma conexión (misma casa u oficina) cuentan como un solo voto por oferta. */
alter table public.votos add column if not exists ip_huella text;
create index if not exists votos_producto_ip_idx on public.votos (producto_id, ip_huella);

create or replace function public.votar(p_producto text, p_visitante text, p_valor int)
returns bigint
language plpgsql security definer set search_path = public as $$
declare
  dir text := coalesce(seguridad.ip(), 'desconocida');
  huella text := encode(sha256(convert_to('radar-voto:' || dir, 'UTF8')), 'hex');
begin
  if not seguridad.producto_valido(p_producto)
     or p_visitante is null or p_visitante !~ '^[A-Za-z0-9-]{8,64}$'
     or p_valor is null or p_valor not in (-1, 0, 1) then
    perform seguridad.alerta('voto_invalido', jsonb_build_object('producto', left(p_producto, 80), 'valor', p_valor));
    return null;
  end if;
  if not seguridad.pasa_limite('voto:' || dir, 120, interval '1 hour')
     or not seguridad.pasa_limite('voto:' || dir || ':' || p_producto, 6, interval '1 day') then
    perform seguridad.alerta('limite_votos', jsonb_build_object('producto', p_producto));
    return null;
  end if;
  if p_valor = 0 then
    delete from public.votos where producto_id = p_producto and visitante = p_visitante;
  else
    -- Esta IP ya votó esta oferta con otro visitante: no cuenta otra vez
    if dir <> 'desconocida' and exists (
      select 1 from public.votos
      where producto_id = p_producto and ip_huella = huella and visitante <> p_visitante
    ) then
      perform seguridad.alerta('voto_repetido_ip', jsonb_build_object('producto', p_producto));
      return null;
    end if;
    insert into public.votos (producto_id, visitante, valor, ip_huella) values (p_producto, p_visitante, p_valor, huella)
    on conflict (producto_id, visitante) do update set valor = excluded.valor, ip_huella = excluded.ip_huella, creado = now();
  end if;
  return coalesce((select sum(valor) from public.votos where producto_id = p_producto), 0);
end;
$$;
revoke all on function public.votar(text, text, int) from public;
grant execute on function public.votar(text, text, int) to anon, authenticated;
