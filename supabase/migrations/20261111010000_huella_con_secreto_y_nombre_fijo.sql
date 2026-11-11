-- SEGURIDAD (auditoría 2026-11-11, run-2): huella de IP con secreto y nombre de usuario que no se puede soltar.
-- Aplicar DESPUÉS de 20261111000000_ip_fiable_y_un_voto_por_ip.sql
-- (con `supabase db push`, o pegándolo en Supabase > SQL Editor > New query > Run).

/* ===== N1 · Huella de IP con un secreto =====
   Sin secreto, sha256(ip) se puede revertir probando todas las IPs posibles.
   El secreto se genera aquí, una sola vez, y vive en el esquema «seguridad» (cerrado a la API).
   Quien tenga solo una copia de la tabla «votos» ya no puede sacar las IPs. */
create table if not exists seguridad.ajustes (
  clave text primary key,
  valor text not null
);
revoke all on seguridad.ajustes from public, anon, authenticated;
insert into seguridad.ajustes (clave, valor)
  values ('secreto_huella', replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''))
  on conflict (clave) do nothing;

create or replace function seguridad.huella_ip(p_ip text)
returns text language sql stable security definer set search_path = '' as $$
  select encode(sha256(convert_to(
    (select valor from seguridad.ajustes where clave = 'secreto_huella') || ':' || p_ip, 'UTF8')), 'hex');
$$;
revoke all on function seguridad.huella_ip(text) from public, anon, authenticated;

-- Las huellas antiguas (sin secreto) ya no coinciden con las nuevas: se borran.
-- Solo afecta a la comprobación «un voto por IP» de los votos ya hechos; los votos se mantienen.
update public.votos set ip_huella = null where ip_huella is not null;

create or replace function public.votar(p_producto text, p_visitante text, p_valor int)
returns bigint
language plpgsql security definer set search_path = public as $$
declare
  dir text := coalesce(seguridad.ip(), 'desconocida');
  huella text := seguridad.huella_ip(dir);
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

/* ===== N2 · El nombre de usuario no se puede quitar =====
   Antes, por la API, se podía poner el nombre a null: los comentarios seguían mostrando el nombre viejo
   y ese nombre quedaba libre para otra persona (dos cuentas con el mismo @nombre).
   Ahora, una vez elegido, el nombre solo se puede CAMBIAR por otro válido, nunca quitar.
   (Las cuentas nuevas de Google empiezan sin nombre y lo eligen después: eso sigue funcionando.) */
create or replace function public.nombre_no_se_quita()
returns trigger language plpgsql set search_path = '' as $$
begin
  if old.usuario is not null and new.usuario is null then
    raise exception 'el nombre de usuario no se puede quitar, solo cambiar' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;
revoke all on function public.nombre_no_se_quita() from public, anon, authenticated;
drop trigger if exists antes_de_cambiar_usuario on public.perfiles;
create trigger antes_de_cambiar_usuario before update of usuario on public.perfiles
  for each row execute function public.nombre_no_se_quita();

-- Si ya pasó antes: los comentarios de cuentas que se quedaron sin nombre dejan de mostrarse
update public.comentarios c set oculto = true
  from public.perfiles p
  where c.usuario_id = p.id and p.usuario is null and not c.oculto;
