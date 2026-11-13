import { money } from "@/lib/catalogo";
import { COMUNIDAD } from "@/lib/config";
import { abrirFicha, alternarComparar, useApp, useI18n } from "@/lib/store";
import type { Producto } from "@/lib/tipos";
import * as I from "./iconos";
import { BotonesCuenta, EnlaceCompra, Estrellas, Etiquetas, Precios, Tienda, Votos } from "./piezas";
import { cx } from "./ui";

/* Tarjeta del catálogo: sin borde ni sombra, separada solo por el espacio.
   Tres grupos: qué es (tienda, título, valoración) · cuánto cuesta (precio, ahorro) · comprar (votos, botón, fecha) */
export function Tarjeta({ p }: { p: Producto }) {
  const i = useI18n(), { t } = i;
  const enComp = useApp((s) => s.comparar.includes(p.id));
  const titulo = i.tit(p);
  return (
    <article className="@container flex min-w-0 flex-col" data-tarjeta>
      <div className="relative overflow-clip rounded-box border border-frost bg-mist">
        <button className="group/img block aspect-square w-full overflow-clip border-0 bg-transparent p-0" type="button" aria-label={t("card.viewPhotos", { t: titulo })} onClick={() => abrirFicha(p.id)}>
          <img className="size-full object-cover transition-transform duration-500 ease-brand group-hover/img:scale-[1.04]" src={p.imagenes[0]} alt={titulo} loading="lazy" />
        </button>
        {p.descuento > 0 && <span className="absolute top-2.5 left-2.5 rounded-full bg-indigo px-[9px] py-[3px] text-caption font-medium text-white tabular-nums max-sm:top-1.5 max-sm:left-1.5 max-sm:px-[7px] max-sm:py-0.5 max-sm:text-mini">-{p.descuento}%</span>}
        {p.imagenes.length > 1 && <span className="absolute bottom-2.5 left-2.5 rounded-full bg-paper px-2 py-0.5 text-caption font-normal text-steel max-sm:hidden">{t("card.photos", { n: p.imagenes.length })}</span>}
        <button
          className="group/cmp absolute top-2.5 right-2.5 inline-flex items-center gap-1.5 rounded-box border border-frost bg-paper px-[9px] py-1 text-caption font-normal text-midnight transition-[border-color,background-color,color] duration-200 hover:border-lavender hover:text-indigo aria-pressed:border-lilac aria-pressed:bg-wash aria-pressed:text-indigo tactil:sm:min-h-11 tactil:sm:min-w-11 max-sm:top-1.5 max-sm:right-1.5 max-sm:gap-[3px] max-sm:px-1.5 max-sm:py-[3px] max-sm:text-mini max-sm:leading-[1.3]"
          type="button" aria-pressed={enComp} aria-label={t("card.compareX", { t: titulo })} onClick={() => alternarComparar(p.id)}>
          <I.Mas className="size-3 transition-transform duration-[250ms] ease-brand group-aria-pressed/cmp:rotate-45 max-sm:size-2.5" />
          <span>{t(enComp ? "card.compareOn" : "card.compare")}</span>
        </button>
        <BotonesCuenta p={p} />
      </div>
      <div className="flex flex-1 flex-col pt-4">
        <Etiquetas p={p} />
        <Tienda p={p} className="flex-wrap gap-y-0 text-caption font-normal text-steel" />
        <h3 className="mt-1.5 text-body leading-[1.3] font-normal tracking-[-0.01em]">
          <button className="line-clamp-2 border-0 bg-transparent p-0 text-left hover:text-indigo" type="button" onClick={() => abrirFicha(p.id)}>{titulo}</button>
        </h3>
        <Estrellas p={p} className="mt-1" />
        <Precios p={p} className={cx("mt-3.5", !p.descuento && "pb-4")} />
        {p.descuento > 0 && <span className="mt-0.5 pb-4 text-small font-normal text-indigo">{t("card.save", { a: money.format(p.ahorro) })}</span>}
        <Votos p={p} />
        <EnlaceCompra p={p} className={cx(COMUNIDAD ? "mt-0" : "mt-auto", "w-full border-lavender bg-transparent px-4 py-[11px] text-indigo hover:border-indigo hover:bg-indigo hover:text-white max-sm:px-2 max-sm:py-2.5 max-sm:text-caption")}>
          {t("card.seeAt", { s: p.tienda })}
        </EnlaceCompra>
        <span className="mt-2 text-caption font-normal text-slate">{t("card.updated", { d: i.fecha(p.actualizado) })}</span>
      </div>
    </article>
  );
}
