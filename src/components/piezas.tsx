/* Piezas de cada oferta que se repiten en la tarjeta y en la ficha */
import { ArrowBigDown, ArrowBigUp, BadgeCheck, ThumbsDown, ThumbsUp, Clock, ExternalLink, Heart, Scissors, Sparkles, TrendingUp, TriangleAlert, Zap } from "lucide-react";
import type { ReactNode } from "react";
import { analisis, conSigno, esErrorPrecio, esNueva, money, quedan, urlSegura } from "@/lib/catalogo";
import { COMUNIDAD, TIENDAS } from "@/lib/config";
import { votar } from "@/lib/comunidad";
import { alternarFavorito } from "@/lib/cuenta";
import { useApp, useI18n } from "@/lib/store";
import type { Producto } from "@/lib/tipos";
import { CTA, FLAG, FLAG_TIPO, cx } from "./ui";

// Frase con un hueco que lleva formato (negrita…): t("clave", { x: HUECO }) y aquí se pone el valor
export const HUECO = "\u0000";
export function ConValor({ texto, valor }: { texto: string; valor: ReactNode }) {
  const [a, z = ""] = texto.split(HUECO);
  return <>{a}{valor}{z}</>;
}

// Punto con el color de la tienda
export const MarcaTienda = ({ t, className }: { t: string; className?: string }) => (
  <span className={cx("size-1.5 flex-none rounded-full", className)} style={{ background: TIENDAS[t] || "#94a3b8" }} />
);

// Insignia de la tienda (esquina de la foto y cabecera de la ficha)
export function InsigniaTienda({ tienda, className }: { tienda: string; className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-card/95 px-2.5 py-1 text-xs font-bold text-slate-800 shadow-2xs", className)}>
      <MarcaTienda t={tienda} />{tienda}
    </span>
  );
}

export function Estrellas({ p, className }: { p: Producto; className?: string }) {
  const { t } = useI18n();
  if (!p.valoracion) return null;
  return <span className={cx("text-xs text-slate-500", className)}>{t("card.rating", { r: p.valoracion.toFixed(1), n: (p.resenas || 0).toLocaleString("en-US") })}</span>;
}

// Porcentaje de descuento
export const Descuento = ({ p, className }: { p: Producto; className?: string }) =>
  p.descuento > 0 ? <span className={cx("rounded-lg border border-rose-200/70 bg-rose-50 px-2 py-0.5 text-xs font-extrabold text-rose-700 tabular-nums", className)}>-{p.descuento}%</span> : null;

// Botón que lleva a la tienda con el enlace de afiliado
export function EnlaceCompra({ p, children, className }: { p: Producto; children: ReactNode; className?: string }) {
  return (
    <a className={cx(CTA, className)} href={urlSegura(p.enlace)} target="_blank" rel="sponsored nofollow noopener">
      <span>{children}</span><ExternalLink className="size-3.5" aria-hidden="true" />
    </a>
  );
}

/* Etiquetas de la ficha: error de precio, descuento dudoso, cupón, Prime, verificada, nueva, en tendencia, termina en… */
export function Etiquetas({ p, className }: { p: Producto; className?: string }) {
  const { t } = useI18n();
  const enTendencia = useApp((s) => s.votos.enTendencia.includes(p.id));
  useApp((s) => s.ahora);
  const q = quedan(p, t), an = analisis(p);
  const f: ReactNode[] = [];
  const ico = "size-3.5";
  if (esErrorPrecio(p)) f.push(<span key="err" className={cx(FLAG, FLAG_TIPO.tendencia)} title={t("deal.errorTip")}><Zap className={ico} aria-hidden="true" />{t("deal.error")}</span>);
  if (an?.dudoso) f.push(<span key="fake" className={cx(FLAG, FLAG_TIPO.aviso)} title={t("hist.fakeTip")}><TriangleAlert className={ico} aria-hidden="true" />{t("deal.fake")}</span>);
  if (p.cupon) f.push(<span key="cup" className={cx(FLAG, FLAG_TIPO.nueva)}><Scissors className={ico} aria-hidden="true" />{t("deal.coupon")}</span>);
  if (p.prime) f.push(<span key="prime" className={cx(FLAG, FLAG_TIPO.prime)}>Prime</span>);
  if (p.verificado) f.push(<span key="ver" className={cx(FLAG, FLAG_TIPO.ok)} title={t("deal.verifiedTip")}><BadgeCheck className={ico} aria-hidden="true" />{t("deal.verified")}</span>);
  if (esNueva(p)) f.push(<span key="new" className={cx(FLAG, FLAG_TIPO.nueva)}><Sparkles className={ico} aria-hidden="true" />{t("deal.new")}</span>);
  if (enTendencia) f.push(<span key="trend" className={cx(FLAG, FLAG_TIPO.tendencia)}><TrendingUp className={ico} aria-hidden="true" />{t("deal.trending")}</span>);
  if (q) f.push(<span key="ends" className={cx(FLAG, FLAG_TIPO.urgente)}><Clock className={ico} aria-hidden="true" />{q.txt}</span>);
  return f.length ? <div className={cx("flex flex-wrap gap-1.5", className)}>{f}</div> : null;
}

/* Votos de la comunidad: flecha arriba, puntuación y flecha abajo. grande = versión de la ficha */
export function Votos({ p, grande = false }: { p: Producto; grande?: boolean }) {
  const { t } = useI18n();
  const mio = useApp((s) => s.votos.mios[p.id] || 0), n = useApp((s) => s.votos.total[p.id] || 0);
  if (!COMUNIDAD) return null;
  const btn = "rounded-lg p-1.5 transition-colors tactil:p-2.5";
  return (
    <div className={cx("inline-flex items-center rounded-xl border", grande ? "border-slate-200 bg-card p-1 shadow-2xs" : "border-slate-200/60 bg-slate-100 p-0.5")}
      role="group" aria-label={t("d.votes", { n })}>
      <button type="button" aria-pressed={mio === 1} aria-label={t("d.voteUp")} title={t("d.voteUp")} onClick={() => votar(p.id, 1)}
        className={cx(btn, mio === 1 ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-card hover:text-emerald-600")}>
        <ArrowBigUp className={cx("size-4", mio === 1 && "fill-current")} aria-hidden="true" />
      </button>
      <span className={cx("px-1.5 text-xs font-extrabold tabular-nums", mio === 1 ? "text-emerald-700" : mio === -1 ? "text-rose-600" : "text-slate-700")}>{n}°</span>
      <button type="button" aria-pressed={mio === -1} aria-label={t("d.voteDown")} title={t("d.voteDown")} onClick={() => votar(p.id, -1)}
        className={cx(btn, mio === -1 ? "bg-rose-600 text-white" : "text-slate-600 hover:bg-card hover:text-rose-600")}>
        <ArrowBigDown className={cx("size-4", mio === -1 && "fill-current")} aria-hidden="true" />
      </button>
    </div>
  );
}

/* Votos compactos (tarjeta): 👍 puntuación 👎 */
export function VotosMini({ p }: { p: Producto }) {
  const { t } = useI18n();
  const mio = useApp((s) => s.votos.mios[p.id] || 0), n = useApp((s) => s.votos.total[p.id] || 0);
  if (!COMUNIDAD) return null;
  const btn = "latido grid size-8 place-items-center rounded-lg transition-colors tactil:size-11 [&_svg]:size-[18px]";
  return (
    <div className="flex items-center gap-0.5" role="group" aria-label={t("d.votes", { n })}>
      <button type="button" aria-pressed={mio === 1} aria-label={t("vote.up")} title={t("vote.up")} onClick={() => votar(p.id, 1)}
        className={cx(btn, mio === 1 ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-100 hover:text-emerald-600")}>
        <ThumbsUp className={cx(mio === 1 && "fill-current/20")} aria-hidden="true" />
      </button>
      <span className={cx("min-w-6 text-center text-sm font-semibold tabular-nums", n > 0 ? "text-acento" : n < 0 ? "text-rose-600" : "text-slate-600")}>{conSigno(n)}</span>
      <button type="button" aria-pressed={mio === -1} aria-label={t("vote.down")} title={t("vote.down")} onClick={() => votar(p.id, -1)}
        className={cx(btn, mio === -1 ? "bg-rose-50 text-rose-700" : "text-slate-600 hover:bg-slate-100 hover:text-rose-600")}>
        <ThumbsDown className={cx(mio === -1 && "fill-current/20")} aria-hidden="true" />
      </button>
    </div>
  );
}

/* Corazón para guardar en favoritos. grande = botón «Guardar» de la ficha */
export function Favorito({ p, grande = false }: { p: Producto; grande?: boolean }) {
  const { t } = useI18n();
  const fav = useApp((s) => s.favoritos.has(p.id));
  if (!COMUNIDAD) return null;
  const etiqueta = t(fav ? "d.favRemove" : "d.favAdd");
  const corazon = <Heart className={cx("size-4", fav ? "fill-rose-500 text-rose-500" : grande ? "" : "text-slate-500")} aria-hidden="true" />;
  if (grande) return (
    <button type="button" aria-pressed={fav} onClick={() => alternarFavorito(p.id)}
      className={cx("latido flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors",
        fav ? "border-rose-200 bg-rose-50 text-rose-700" : "border-slate-200 bg-card text-slate-700 hover:bg-slate-50")}>
      {corazon}<span>{t(fav ? "d.saved" : "d.save")}</span>
    </button>
  );
  return (
    <button type="button" aria-pressed={fav} aria-label={etiqueta} title={etiqueta} onClick={(e) => { e.stopPropagation(); alternarFavorito(p.id); }}
      className="latido absolute top-3 right-3 flex size-9 items-center justify-center rounded-xl border border-slate-200/70 bg-card/95 shadow-sm transition-transform hover:bg-card active:scale-90 [&:hover_svg]:text-rose-500 tactil:size-11">
      {corazon}
    </button>
  );
}

// Precio actual, tachado el anterior y el descuento
export function BloquePrecio({ p, grande = false }: { p: Producto; grande?: boolean }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className={cx("font-extrabold tracking-tight text-slate-900 tabular-nums", grande ? "text-3xl" : "text-2xl")}>{money.format(p.precio)}</span>
      {p.descuento > 0 && <span className={cx("font-medium text-slate-500 line-through tabular-nums", grande ? "text-sm" : "text-xs sm:text-sm")}>{money.format(p.precioAnterior as number)}</span>}
    </div>
  );
}
