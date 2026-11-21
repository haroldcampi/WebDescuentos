import { Bell, BellRing, CircleCheck, Clock, Heart, Plus } from "lucide-react";
import Image from "next/image";
import { analisis, money, quedan } from "@/lib/catalogo";
import { COMUNIDAD, TIENDAS } from "@/lib/config";
import { alternarFavorito, alternarSeguir } from "@/lib/cuenta";
import { abrirFicha, alternarComparar, useApp, useI18n } from "@/lib/store";
import type { Producto } from "@/lib/tipos";
import { EnlaceCompra, Etiquetas, VotosMini } from "./piezas";
import { cx } from "./ui";

// Fondo oscuro fijo para las píldoras sobre la foto (no cambia con el modo oscuro: siempre van sobre la imagen)
const SOBRE_FOTO = "bg-[#0f172a]/85 text-white backdrop-blur-xs";

/* Tarjeta compacta del catálogo (5 por fila en pantalla grande):
   foto cuadrada con el descuento, «+» comparar, nº de fotos, favorito y alerta; título (hasta 3 líneas);
   precio con el anterior tachado y el ahorro; tienda, valoración y fecha del precio; «Ver en {tienda}»; votos.
   prioridad: 0 = primera foto de la página (se descarga antes que nada), 1 = resto de la primera fila (sin carga diferida)
   entrada: posición entre las tarjetas recién añadidas con «Ver más» (aparecen escalonadas, 35 ms entre una y otra) */
export function Tarjeta({ p, prioridad, entrada }: { p: Producto; prioridad?: 0 | 1; entrada?: number }) {
  const i = useI18n(), { t } = i;
  const enComp = useApp((s) => s.comparar.includes(p.id));
  const fav = useApp((s) => s.favoritos.has(p.id)), seg = useApp((s) => s.seguidos.has(p.id));
  useApp((s) => s.ahora);
  const titulo = i.tit(p);
  const an = analisis(p);
  const q = quedan(p, t);
  const accion = "grid size-8 place-items-center rounded-lg border shadow-sm transition-[transform,background-color,color] active:scale-90 tactil:size-9 [&_svg]:size-4";
  return (
    <article style={entrada !== undefined ? { animationDelay: Math.min(entrada, 10) * 35 + "ms" } : undefined}
      className={cx("group flex min-w-0 flex-col rounded-2xl border border-slate-200/90 bg-card p-2 shadow-2xs transition-all duration-200 hover:border-indigo-300 hover:shadow-md", entrada !== undefined && "animate-entrar")} data-tarjeta>
      <div className="relative aspect-[15/14] overflow-hidden rounded-xl bg-slate-100">
        <button type="button" className="absolute inset-0 block size-full p-0" aria-label={t("card.viewPhotos", { t: titulo })} onClick={() => abrirFicha(p.id)}>
          <Image className="object-contain object-center p-2 mix-blend-multiply transition-transform duration-300 group-hover:scale-105" src={p.imagenes[0]} alt={titulo} fill
            sizes="(max-width: 640px) 50vw, (max-width: 1280px) 30vw, 250px"
            {...(prioridad === 0 ? { fetchPriority: "high" as const, loading: "eager" as const, preload: !p.imagenes[0].startsWith("data:") } : prioridad === 1 ? { loading: "eager" as const } : {})} />
        </button>

        {p.descuento > 0 && <span className="pointer-events-none absolute top-2 left-2 rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-bold text-white tabular-nums shadow-xs">-{p.descuento}%</span>}

        <button type="button" aria-pressed={enComp} aria-label={t("card.compareX", { t: titulo })} title={t(enComp ? "card.compareOn" : "card.compare")} onClick={() => alternarComparar(p.id)}
          className={cx("group/cmp absolute top-2 right-2 grid size-8 place-items-center rounded-lg shadow-sm transition-colors tactil:size-9",
            enComp ? "bg-indigo-600 text-white" : cx(SOBRE_FOTO, "hover:bg-[#0f172a]"))}>
          <Plus className="size-4 transition-transform duration-200 group-aria-pressed/cmp:rotate-45" aria-hidden="true" />
        </button>

        <div className="pointer-events-none absolute bottom-2 left-2 flex flex-col items-start gap-1">
          {q?.urgente && <span className="inline-flex items-center gap-1 rounded-full bg-[#b45309] px-2 py-0.5 text-[11px] font-bold text-white"><Clock className="size-3" aria-hidden="true" />{q.txt}</span>}
          {p.imagenes.length > 1 && <span className={cx("rounded-full px-2 py-0.5 text-[11px] font-semibold max-sm:hidden", SOBRE_FOTO)}>{t("card.photos", { n: p.imagenes.length })}</span>}
        </div>

        {COMUNIDAD && (
          <div className="absolute right-2 bottom-2 flex gap-1">
            <button type="button" aria-pressed={fav} aria-label={t(fav ? "d.favRemove" : "d.favAdd")} title={t(fav ? "d.favRemove" : "d.favAdd")} onClick={() => alternarFavorito(p.id)}
              className={cx(accion, "latido", fav ? "border-rose-200 bg-rose-50 text-rose-600" : "border-slate-200/70 bg-card/95 text-slate-600 hover:text-rose-500")}>
              <Heart className={cx(fav && "fill-current")} aria-hidden="true" />
            </button>
            {!p.sinPrecio && <button type="button" aria-pressed={seg} aria-label={t(seg ? "follow.on" : "follow.add")} title={t(seg ? "follow.on" : "follow.add")} onClick={() => alternarSeguir(p.id)}
              className={cx(accion, "latido", seg ? "border-transparent bg-[#b45309] text-white" : "border-slate-200/70 bg-card/95 text-slate-600 hover:text-amber-600")}>
              {seg ? <BellRing aria-hidden="true" /> : <Bell aria-hidden="true" />}
            </button>}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col px-1 pt-2">
        <h2 className="min-h-[4.125em] text-sm leading-[1.375] [text-wrap:pretty] sm:text-[15px]">
          <button type="button" onClick={() => abrirFicha(p.id)}
            className="line-clamp-3 text-left text-sm leading-[1.375] font-medium text-slate-800 transition-colors group-hover:text-acento sm:text-[15px]">
            {titulo}
          </button>
        </h2>

        <div className="mt-1.5 flex min-h-[22px] flex-wrap gap-1">
          {an?.minimo && <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-px text-[11px] font-semibold text-emerald-700"><CircleCheck className="size-3" aria-hidden="true" />{t("d.min90Short")}</span>}
          <Etiquetas p={p} className="contents [&>span]:px-1.5 [&>span]:py-px [&>span]:text-[11px] [&_svg]:size-3" />
        </div>

        {p.sinPrecio ? <p className="mt-1.5 text-sm font-semibold text-slate-600">{t("price.hidden", { s: p.tienda })}</p> : <>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5">
            <span className="text-xl font-extrabold tracking-tight text-slate-900 tabular-nums">{money.format(p.precio)}</span>
            {p.descuento > 0 && <span className="text-sm font-medium text-rose-700 line-through tabular-nums">{money.format(p.precioAnterior as number)}</span>}
          </div>
          {p.descuento > 0 && <p className="text-xs font-semibold text-acento">{t("card.save", { a: money.format(p.ahorro) })}</p>}
        </>}

        <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-slate-500">
          <span className="size-2 shrink-0 rounded-[3px]" style={{ background: TIENDAS[p.tienda] || "#94a3b8" }} aria-hidden="true" />
          <span className="truncate">{p.tienda}</span>
          {p.valoracion ? <span className="ml-auto shrink-0 text-xs" title={t("card.rating", { r: p.valoracion.toFixed(1), n: (p.resenas || 0).toLocaleString("en-US") })}>★ {p.valoracion.toFixed(1)}</span> : null}
        </p>
        {!p.sinPrecio && <p className="mt-0.5 text-[11px] text-slate-500">{t("d.priceOn", { d: i.fecha(p.actualizado) })}</p>}

        <div className="mt-auto pt-2.5">
          <EnlaceCompra p={p} className="h-8 w-full rounded-lg border border-indigo-300 bg-transparent px-2 py-0 text-xs text-acento shadow-none hover:border-indigo-600 hover:bg-indigo-600 hover:text-white tactil:min-h-11">
            {t("card.seeAt", { s: p.tienda })}
          </EnlaceCompra>
          {COMUNIDAD && <div className="mt-2 -mb-1.5 flex items-center justify-between border-t border-slate-100 pt-1"><VotosMini p={p} /></div>}
        </div>
      </div>
    </article>
  );
}
