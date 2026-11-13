/* Piezas de cada oferta que se repiten en la tarjeta, la ficha, el carrusel y el comparador */
import type { ReactNode } from "react";
import { analisis, conSigno, esErrorPrecio, esNueva, money, quedan, urlSegura } from "@/lib/catalogo";
import { COMUNIDAD, TIENDAS } from "@/lib/config";
import { votar } from "@/lib/comunidad";
import { alternarFavorito, alternarSeguir } from "@/lib/cuenta";
import { useApp, useI18n } from "@/lib/store";
import type { Producto } from "@/lib/tipos";
import * as I from "./iconos";
import { CTA, FLAG, FLAG_TIPO, GHOST, cx } from "./ui";

// Frase con un hueco que lleva formato (negrita…): t("clave", { x: HUECO }) y aquí se pone el valor
export const HUECO = "\u0000";
export function ConValor({ texto, valor }: { texto: string; valor: ReactNode }) {
  const [a, z = ""] = texto.split(HUECO);
  return <>{a}{valor}{z}</>;
}

// Cuadradito con el color de la tienda
export const MarcaTienda = ({ t, className }: { t: string; className?: string }) => (
  <i className={cx("size-2 flex-none rounded-[2px]", className)} style={{ background: TIENDAS[t] || "#888" }} />
);

// Tienda · categoría
export function Tienda({ p, className }: { p: Producto; className?: string }) {
  const i = useI18n();
  return (
    <span className={cx("inline-flex items-center gap-2", className)}>
      <MarcaTienda t={p.tienda} />{p.tienda}<span className="whitespace-nowrap text-slate">· {i.cat(p.categoria)}</span>
    </span>
  );
}

export function Estrellas({ p, className }: { p: Producto; className?: string }) {
  const { t } = useI18n();
  if (!p.valoracion) return null;
  return <span className={cx("text-caption font-normal text-slate", className)}>{t("card.rating", { r: p.valoracion.toFixed(1), n: (p.resenas || 0).toLocaleString("en-US") })}</span>;
}

// Precio actual y, tachado, el de antes
export function Precios({ p, className, tam = "text-sub" }: { p: Producto; className?: string; tam?: string }) {
  return (
    <div className={cx("flex flex-wrap items-baseline gap-2.5", className)}>
      <span className={cx("leading-[1.1] font-light tracking-[-0.02em] text-midnight tabular-nums", tam)}>{money.format(p.precio)}</span>
      {p.descuento > 0 && <span className="text-small font-normal text-slate line-through tabular-nums">{money.format(p.precioAnterior as number)}</span>}
    </div>
  );
}

// Botón que lleva a la tienda con el enlace de afiliado
export function EnlaceCompra({ p, children, className }: { p: Producto; children: ReactNode; className?: string }) {
  return (
    <a className={cx(CTA, className)} href={urlSegura(p.enlace)} target="_blank" rel="sponsored nofollow noopener">
      {children} <I.Flecha />
    </a>
  );
}

/* Etiquetas: error de precio, mínimo en 90 días, descuento dudoso, cupón, Prime, verificada, nueva, en tendencia, termina en… */
export function Etiquetas({ p, className }: { p: Producto; className?: string }) {
  const { t } = useI18n();
  const enTendencia = useApp((s) => s.votos.enTendencia.includes(p.id));
  useApp((s) => s.ahora);
  const q = quedan(p, t), an = analisis(p);
  const f: ReactNode[] = [];
  if (esErrorPrecio(p)) f.push(<span key="err" className={cx(FLAG, FLAG_TIPO.urgente)} title={t("deal.errorTip")}><I.Rayo />{t("deal.error")}</span>);
  if (an?.minimo) f.push(<span key="min" className={cx(FLAG, FLAG_TIPO.ok)} title={t("hist.minTip")}><I.Check />{t("deal.min90")}</span>);
  if (an?.dudoso) f.push(<span key="fake" className={cx(FLAG, FLAG_TIPO.aviso)} title={t("hist.fakeTip")}><I.Aviso />{t("deal.fake")}</span>);
  if (p.cupon) f.push(<span key="cup" className={cx(FLAG, FLAG_TIPO.nueva)}><I.Tijera />{t("deal.coupon")}</span>);
  if (p.prime) f.push(<span key="prime" className={cx(FLAG, FLAG_TIPO.prime)}>Prime</span>);
  if (p.verificado) f.push(<span key="ver" className={cx(FLAG, FLAG_TIPO.ok)} title={t("deal.verifiedTip")}><I.Check />{t("deal.verified")}</span>);
  if (esNueva(p)) f.push(<span key="new" className={cx(FLAG, FLAG_TIPO.nueva)}>{t("deal.new")}</span>);
  if (enTendencia) f.push(<span key="trend" className={cx(FLAG, FLAG_TIPO.tendencia)}><I.Tendencia />{t("deal.trending")}</span>);
  if (q) f.push(<span key="ends" className={cx(FLAG, q.urgente && FLAG_TIPO.urgente)}><I.Reloj />{q.txt}</span>);
  return f.length ? <div className={cx("mb-2 flex flex-wrap gap-1.5", className)}>{f}</div> : null;
}

/* Votos de la comunidad: puntuación + «Buena» / «Mala». completo = versión grande de la ficha */
export function Votos({ p, completo = false }: { p: Producto; completo?: boolean }) {
  const { t } = useI18n();
  const mio = useApp((s) => s.votos.mios[p.id] || 0), n = useApp((s) => s.votos.total[p.id] || 0);
  if (!COMUNIDAD) return null;
  const btn = cx(
    "group/v inline-flex min-w-0 items-center justify-center gap-[5px] rounded-box border border-frost bg-paper px-2 py-1.5 text-caption font-normal text-steel transition-[border-color,color,background-color] duration-200 tactil:min-h-10",
    "[&_svg]:size-4 [&_svg]:transition-transform [&_svg]:duration-200 [&_svg]:ease-brand aria-pressed:[&_svg]:fill-current aria-pressed:[&_svg]:[fill-opacity:.18]",
    completo ? "flex-[0_1_auto] gap-2 px-4 py-2.5 text-small [&_svg]:size-5" : "flex-1 basis-0 @max-[270px]:[&_svg]:size-[18px]"
  );
  const texto = cx(!completo && "max-sm:hidden @max-[270px]:hidden");
  const caja = (
    <div className={cx("flex items-stretch", completo ? "gap-2" : "mt-auto mb-3 gap-1.5")} role="group" aria-label={t("vote.score", { n })}>
      <span className="flex flex-none items-stretch overflow-hidden rounded-box border border-lilac tabular-nums tactil:min-h-10">
        <small className={cx("grid max-w-[72px] place-items-center bg-wash px-2 text-center text-mini leading-[1.1] font-medium text-indigo", completo ? "px-3 text-caption" : "max-sm:hidden")}>{t("vote.scoreLab")}</small>
        <b className={cx("grid min-w-10 place-items-center bg-paper px-2 text-body font-medium text-midnight", n > 0 && "text-indigo", n < 0 && "text-steel", completo ? "min-w-14 text-sub font-normal" : "max-sm:min-w-9 max-sm:text-small")}>{conSigno(n)}</b>
      </span>
      <button className={cx(btn, "hover:border-lavender hover:text-indigo hover:[&_svg]:-translate-y-px aria-pressed:border-indigo aria-pressed:bg-wash aria-pressed:text-indigo")} type="button" aria-pressed={mio === 1} aria-label={t("vote.up")} title={t("vote.up")} onClick={() => votar(p.id, 1)}>
        <I.PulgarArriba /><span className={texto}>{t(completo ? "vote.up" : "vote.upShort")}</span>
      </button>
      <button className={cx(btn, "hover:border-slate hover:text-midnight hover:[&_svg]:translate-y-px aria-pressed:border-slate aria-pressed:bg-frost aria-pressed:text-midnight")} type="button" aria-pressed={mio === -1} aria-label={t("vote.down")} title={t("vote.down")} onClick={() => votar(p.id, -1)}>
        <I.PulgarAbajo /><span className={texto}>{t(completo ? "vote.down" : "vote.downShort")}</span>
      </button>
    </div>
  );
  if (!completo) return caja;
  return (
    <section className="flex flex-col gap-3 border-t border-frost pt-4">
      <h3 className="text-lead font-normal">{t("vote.title")}</h3>{caja}
    </section>
  );
}

/* Corazón (favorito) y campana (seguir el precio). completo = botones con texto de la ficha */
export function BotonesCuenta({ p, completo = false }: { p: Producto; completo?: boolean }) {
  const { t } = useI18n();
  const fav = useApp((s) => s.favoritos.has(p.id)), seg = useApp((s) => s.seguidos.has(p.id));
  if (!COMUNIDAD) return null;
  const relleno = "aria-pressed:[&_svg]:fill-current aria-pressed:[&_svg]:[fill-opacity:.25]";
  if (completo) return <>
    <button className={cx(GHOST, relleno, "[&_svg]:size-[18px]")} type="button" aria-pressed={fav} onClick={() => alternarFavorito(p.id)}><I.Corazon /><span>{t(fav ? "fav.on" : "fav.add")}</span></button>
    <button className={cx(GHOST, relleno, "[&_svg]:size-[18px]")} type="button" aria-pressed={seg} onClick={() => alternarSeguir(p.id)}><I.Campana /><span>{t(seg ? "follow.on" : "follow.add")}</span></button>
  </>;
  const act = cx("grid size-8 place-items-center rounded-box border border-frost bg-paper p-0 text-steel transition-[color,border-color,background-color] duration-200 hover:border-lavender hover:text-indigo aria-pressed:border-lilac aria-pressed:bg-wash aria-pressed:text-indigo max-sm:size-7 tactil:min-h-10 tactil:min-w-10", relleno);
  return (
    <div className="absolute right-2.5 bottom-2.5 flex gap-1.5 max-sm:right-1.5 max-sm:bottom-1.5 max-sm:gap-1">
      <button className={act} type="button" aria-pressed={fav} aria-label={t(fav ? "fav.on" : "fav.add")} title={t(fav ? "fav.on" : "fav.add")} onClick={() => alternarFavorito(p.id)}><I.Corazon /></button>
      <button className={act} type="button" aria-pressed={seg} aria-label={t(seg ? "follow.on" : "follow.add")} title={t(seg ? "follow.on" : "follow.add")} onClick={() => alternarSeguir(p.id)}><I.Campana /></button>
    </div>
  );
}
