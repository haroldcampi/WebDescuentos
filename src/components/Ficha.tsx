/* Ficha del producto: galería, precio, acciones, compartir, precio objetivo, cupón, votos, datos, historial, comentarios y similares.
   La dirección del navegador apunta al producto abierto (?producto=id), para copiarla o recargar. */
import { useEffect, useState, type FormEvent } from "react";
import { DIA, catalogo, cuentaAtras, finDe, money } from "@/lib/catalogo";
import { COMUNIDAD } from "@/lib/config";
import { guardarObjetivo, marcarSeguidoVisto } from "@/lib/cuenta";
import { alternarComparar, cerrarFicha, useApp, useI18n } from "@/lib/store";
import { sb } from "@/lib/supabase";
import type { Producto } from "@/lib/tipos";
import { Comentarios } from "./Comentarios";
import { Dialogo } from "./Dialogo";
import { Grafica } from "./Grafica";
import * as I from "./iconos";
import { BotonesCuenta, EnlaceCompra, Estrellas, Etiquetas, Precios, Tienda, Votos } from "./piezas";
import { Tarjeta } from "./Tarjeta";
import { FLAG, FLAG_TIPO, GHOST, cx } from "./ui";

export function enlaceProducto(id: string, lang: string) {
  const u = new URL(location.origin + location.pathname);
  u.searchParams.set("producto", id);
  if (lang === "en") u.searchParams.set("lang", "en");
  return u.toString();
}
function ponerEnDireccion(id: string | null) {
  try {
    const u = new URL(location.href);
    if (id) u.searchParams.set("producto", id);
    else if (u.searchParams.has("producto")) u.searchParams.delete("producto");
    else return;
    history.replaceState(history.state, "", u);
  } catch {}
}
// Copia con el portapapeles del navegador; si no responde en 1 s o falla, usa el método clásico
async function copiar(texto: string, dentro: Element | null) {
  const clasico = () => {
    const t = document.createElement("textarea"); t.value = texto; t.setAttribute("readonly", ""); t.style.position = "fixed"; t.style.opacity = "0";
    (dentro || document.body).appendChild(t); t.select(); try { document.execCommand("copy"); } catch {} t.remove();
  };
  try { await Promise.race([navigator.clipboard.writeText(texto), new Promise((_, no) => setTimeout(() => no(new Error("tiempo")), 1000))]); } catch { clasico(); }
}

export function Ficha() {
  const { t } = useI18n();
  const id = useApp((s) => s.fichaId);
  const p = id ? catalogo().porId.get(id) : undefined;
  const [foto, setFoto] = useState(0);
  const [x0, setX0] = useState<number | null>(null);

  useEffect(() => {
    setFoto(0);
    ponerEnDireccion(id);
    if (id && sb() && useApp.getState().seguidos.has(id)) marcarSeguidoVisto(id);
  }, [id]);

  const n = p?.imagenes.length || 1;
  const ver = (k: number) => setFoto((k + n) % n);
  return (
    <Dialogo abierto={!!p} onCerrar={cerrarFicha} etiqueta={t("sheet.aria")} claveScroll={id || ""}
      onKeyDown={(e) => { if (e.key === "ArrowRight") ver(foto + 1); if (e.key === "ArrowLeft") ver(foto - 1); }}
      onTouchStart={(e) => { if ((e.target as Element).closest("[data-foto-grande]")) setX0(e.touches[0].clientX); }}
      onTouchEnd={(e) => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) ver(foto + (dx < 0 ? 1 : -1)); setX0(null); }}>
      {p && <Detalle p={p} foto={foto % n} ver={ver} />}
    </Dialogo>
  );
}

function Detalle({ p, foto, ver }: { p: Producto; foto: number; ver: (k: number) => void }) {
  const i = useI18n(), { t } = i;
  const enComp = useApp((s) => s.comparar.includes(p.id));
  const similares = catalogo().lista.filter((x) => x.id !== p.id && x.categoria === p.categoria)
    .sort((a, b) => Math.abs(a.precio - p.precio) - Math.abs(b.precio - p.precio)).slice(0, 4);
  const titulo = i.tit(p);
  const nav = "absolute top-1/2 size-10 -translate-y-1/2 rounded-box border border-frost bg-paper text-[22px] text-midnight hover:border-lavender hover:text-indigo tactil:size-12";
  return (
    <div className="grid grid-cols-[1.1fr_1fr] gap-10 p-10 max-tab:grid-cols-1 max-sm:p-5 max-sm:pt-2">
      <div>
        <div className="relative aspect-square overflow-clip rounded-box border border-frost bg-mist" data-foto-grande>
          <img className="size-full object-cover" src={p.imagenes[foto]} alt={titulo} />
          {p.imagenes.length > 1 && <>
            <button className={cx(nav, "left-3")} type="button" aria-label={t("sheet.prev")} onClick={() => ver(foto - 1)}>‹</button>
            <button className={cx(nav, "right-3")} type="button" aria-label={t("sheet.next")} onClick={() => ver(foto + 1)}>›</button>
          </>}
        </div>
        <div className="mt-2 flex gap-2">
          {p.imagenes.map((src, k) => (
            <button key={k} className="size-[72px] overflow-clip rounded-box border border-frost bg-mist p-0 opacity-60 transition-[opacity,border-color] duration-200 hover:border-indigo hover:opacity-100 aria-[current=true]:border-indigo aria-[current=true]:opacity-100"
              type="button" aria-current={k === foto} aria-label={t("sheet.photoN", { n: k + 1 })} onClick={() => ver(k)}>
              <img className="size-full object-cover" src={src} alt="" />
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Etiquetas p={p} className="m-0" />
        <Tienda p={p} />
        <h2 className="text-sub leading-[1.15] tracking-[-0.01em]">{titulo}</h2>
        <Estrellas p={p} />
        <div>
          <Precios p={p} tam="text-head tracking-[-0.025em]" />
          {p.descuento > 0 && <span className="text-small font-normal text-indigo">{t("sheet.saveFull", { a: money.format(p.ahorro), d: p.descuento })}</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          <EnlaceCompra p={p}>{t("sheet.buyAt", { s: p.tienda })}</EnlaceCompra>
          <button className={GHOST} type="button" aria-pressed={enComp} onClick={() => alternarComparar(p.id)}>{t(enComp ? "sheet.inCompare" : "card.compare")}</button>
          <BotonesCuenta p={p} completo />
        </div>
        <Compartir p={p} />
        <Objetivo p={p} />
        <Extras p={p} />
        <Votos p={p} completo />
        <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 rounded-box bg-mist p-5 text-small font-normal [&_dd]:m-0 [&_dt]:text-slate">
          <dt>{t("sheet.store")}</dt><dd>{p.tienda}</dd>
          <dt>{t("sheet.category")}</dt><dd>{i.cat(p.categoria)}</dd>
          <dt>{t("sheet.usual")}</dt><dd>{p.precioAnterior ? money.format(p.precioAnterior) : "—"}</dd>
          <dt>{t("sheet.photos")}</dt><dd>{p.imagenes.length}</dd>
        </dl>
        <p className="text-caption font-normal text-slate">{t("sheet.disclaimer", { d: i.fecha(p.actualizado), s: p.tienda })}</p>
      </div>

      <Grafica p={p} />
      {COMUNIDAD && <Comentarios id={p.id} />}
      {similares.length > 0 && (
        <div className="col-span-full border-t border-frost pt-8">
          <h3 className="mb-5 text-sub">{t("sheet.more", { c: i.cat(p.categoria) })}</h3>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-x-5 gap-y-10 max-sm:grid-cols-2 max-sm:gap-x-3 max-sm:gap-y-8">
            {similares.map((x) => <Tarjeta key={x.id} p={x} />)}
          </div>
        </div>
      )}
    </div>
  );
}

/* Compartir el producto: por email o copiando el enlace */
function Compartir({ p }: { p: Producto }) {
  const i = useI18n(), { t } = i;
  const [copiado, setCopiado] = useState(false);
  const url = enlaceProducto(p.id, i.lang);
  const asunto = t("link.subject", { t: i.tit(p) });
  const cuerpo = t("link.body", { t: i.tit(p), p: money.format(p.precio), s: p.tienda, a: p.descuento ? t("link.was", { w: money.format(p.precioAnterior as number) }) : "", u: url });
  const btn = cx(GHOST, "gap-2 px-3.5 py-2");
  return (
    <div className="flex flex-wrap items-center gap-2 text-small text-steel">
      <span className="mr-1">{t("link.label")}</span>
      <a className={btn} href={`mailto:?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`}><I.Sobre /><span>{t("link.email")}</span></a>
      <button className={cx(btn, copiado && "border-indigo bg-wash")} type="button"
        onClick={async (e) => { await copiar(url, e.currentTarget.closest("dialog")); setCopiado(true); setTimeout(() => setCopiado(false), 1800); }}>
        <I.Enlace /><span>{t(copiado ? "link.copied" : "link.copy")}</span>
      </button>
    </div>
  );
}

/* «Avísame si baja de $X»: precio objetivo de un producto seguido */
function Objetivo({ p }: { p: Producto }) {
  const { t } = useI18n();
  const usuario = useApp((s) => s.usuario), seguido = useApp((s) => s.seguidos.has(p.id)), obj = useApp((s) => s.objetivos.get(p.id));
  const [valor, setValor] = useState(obj ? obj.toFixed(2) : "");
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => { setValor(obj ? obj.toFixed(2) : ""); }, [obj, p.id]);
  if (!sb() || !usuario || !seguido) return null;
  async function guardar(e: FormEvent) {
    e.preventDefault();
    const txt = valor.trim(), v = txt ? parseFloat(txt.replace(",", ".")) : null;
    if (txt && !((v as number) > 0)) return setMsg(t("target.bad"));
    setMsg(null);
    if (!(await guardarObjetivo(p.id, v))) setMsg(t("auth.err.generic"));
  }
  return (
    <form className="flex flex-wrap items-center gap-2 rounded-box border border-frost bg-mist p-3 text-small font-normal" onSubmit={guardar}>
      <label className="text-midnight" htmlFor="target-v">{t("target.label")}</label>
      <span className="relative inline-flex items-center">
        <span className="absolute left-2.5 text-slate" aria-hidden="true">$</span>
        <input className="w-[110px] rounded-box border border-frost bg-paper py-2 pr-2.5 pl-[22px] text-small text-midnight tabular-nums focus:border-indigo focus:outline-none"
          id="target-v" name="v" type="number" inputMode="decimal" min={0.01} step={0.01} placeholder={(p.precio * 0.9).toFixed(2)} value={valor} onChange={(e) => setValor(e.target.value)} />
      </span>
      <button className={cx(GHOST, "px-3.5 py-2")} type="submit">{t("target.save")}</button>
      <span className="basis-full text-caption text-steel" role="status">{msg ?? (obj ? t("target.active", { o: money.format(obj) }) : t("target.hint"))}</span>
    </form>
  );
}

/* Cupón, Prime, cuenta atrás (menos de 2 días) y oferta relámpago (% reclamado) */
function Extras({ p }: { p: Producto }) {
  const { t } = useI18n();
  const [copiado, setCopiado] = useState(false);
  const fin = finDe(p);
  const [ahora, setAhora] = useState(() => Date.now());
  const conCuenta = !!fin && fin - ahora > 0 && fin - ahora < 2 * DIA;
  useEffect(() => {
    if (!conCuenta) return;
    const id = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(id);
  }, [conCuenta]);
  const cupon = p.cupon ? (typeof p.cupon === "string" ? { texto: p.cupon, codigo: undefined } : p.cupon) : null;
  const reclamado = isFinite(Number(p.reclamado)) && Number(p.reclamado) > 0 ? Math.min(100, Math.max(0, Math.round(Number(p.reclamado)))) : 0;
  return <>
    {cupon && (
      <div className="flex flex-wrap items-center gap-2.5 rounded-box border border-dashed border-lavender bg-wash px-3 py-2.5 text-small font-normal text-indigo">
        <I.Tijera /><span className="flex-[1_1_160px] text-midnight">{cupon.texto || t("deal.coupon")}</span>
        {cupon.codigo && (
          <button className="inline-flex items-center gap-2 rounded-box border border-frost bg-paper px-2.5 py-1.5 text-small text-indigo hover:border-lavender" type="button" aria-label={t("coupon.copyX", { c: cupon.codigo })}
            onClick={async (e) => { await copiar(cupon.codigo as string, e.currentTarget.closest("dialog")); setCopiado(true); setTimeout(() => setCopiado(false), 1600); }}>
            <code className="font-mono font-semibold tracking-[0.04em] text-midnight">{cupon.codigo}</code><span>{t(copiado ? "coupon.copied" : "coupon.copy")}</span>
          </button>
        )}
      </div>
    )}
    {p.prime && <p className="flex items-center gap-2 text-small text-steel"><span className={cx(FLAG, FLAG_TIPO.prime)}>Prime</span> {t("deal.primeTip")}</p>}
    {conCuenta && (
      <p className="flex items-center gap-1.5 text-small text-steel [&>svg]:text-indigo">
        <I.Reloj /><span>{t("deal.endsIn")}</span> <b className="text-body font-medium text-indigo tabular-nums">{cuentaAtras(fin - ahora)}</b>
      </p>
    )}
    {reclamado > 0 && (
      <div className="flex flex-col gap-1.5 text-caption text-steel">
        <div className="h-1.5 overflow-hidden rounded-full bg-frost" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={reclamado} aria-label={t("deal.claimed", { n: reclamado })}>
          <i className="block h-full rounded-full bg-indigo" style={{ width: reclamado + "%" }} />
        </div>
        <span className="inline-flex items-center gap-1"><I.Rayo />{t("deal.claimed", { n: reclamado })}</span>
      </div>
    )}
  </>;
}
