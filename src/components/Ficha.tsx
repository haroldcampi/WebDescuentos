/* Ficha del producto (ventana): cabecera con tienda y categoría; foto y datos con precio, votos, compra y guardar;
   gráfica de 90 días; alerta de precio; cupón y cuenta atrás; compartir; comentarios.
   La dirección del navegador apunta al producto abierto (?producto=id), para copiarla o recargar. */
import { BellRing, Check, Plus, ChevronLeft, ChevronRight, CircleCheck, Clock, Link as LinkIcon, Mail, Scissors, X, Zap } from "lucide-react";
import Image from "next/image";
import { useEffect, useState, type FormEvent } from "react";
import { DIA, analisis, catalogo, cuentaAtras, finDe, money } from "@/lib/catalogo";
import { COMUNIDAD } from "@/lib/config";
import { alternarSeguir, guardarObjetivo, marcarSeguidoVisto, pedirCuenta } from "@/lib/cuenta";
import { alternarComparar, cerrarFicha, useApp, useI18n } from "@/lib/store";
import { sb } from "@/lib/supabase";
import type { Producto } from "@/lib/tipos";
import { Comentarios } from "./Comentarios";
import { Dialogo } from "./Dialogo";
import { Grafica } from "./Grafica";
import { BloquePrecio, Descuento, EnlaceCompra, Estrellas, Etiquetas, Favorito, InsigniaTienda, Votos } from "./piezas";
import { FLAG, FLAG_TIPO, cx } from "./ui";

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
    <Dialogo abierto={!!p} onCerrar={cerrarFicha} etiqueta={t("sheet.aria")} claveScroll={id || ""} sinCerrar className="w-[min(56rem,100%-1.5rem)]"
      onKeyDown={(e) => { if (e.key === "ArrowRight") ver(foto + 1); if (e.key === "ArrowLeft") ver(foto - 1); }}
      onTouchStart={(e) => { if ((e.target as Element).closest("[data-foto-grande]")) setX0(e.touches[0].clientX); }}
      onTouchEnd={(e) => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) ver(foto + (dx < 0 ? 1 : -1)); setX0(null); }}>
      {p && <Detalle p={p} foto={foto % n} ver={ver} />}
    </Dialogo>
  );
}

function Detalle({ p, foto, ver }: { p: Producto; foto: number; ver: (k: number) => void }) {
  const i = useI18n(), { t } = i;
  const titulo = i.tit(p);
  const an = analisis(p);
  const nav = "absolute top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-xl bg-card/95 text-slate-700 shadow-sm hover:bg-card tactil:size-11";
  return (
    <>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3.5">
        <div className="flex min-w-0 items-center gap-2">
          <InsigniaTienda tienda={p.tienda} className="py-0.5 shadow-none" />
          <span className="truncate text-xs font-medium text-slate-500">• {i.cat(p.categoria)}</span>
        </div>
        <button type="button" onClick={cerrarFicha} aria-label={t("sheet.close")}
          className="rounded-xl p-1.5 text-slate-400 transition-colors hover:bg-slate-200/60 hover:text-slate-700 tactil:p-2.5">
          <X className="size-5" aria-hidden="true" />
        </button>
      </div>

      <div className="space-y-6 p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-12 md:items-start">
          <div className="md:col-span-5">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-slate-200/70 bg-slate-50" data-foto-grande>
              <Image className="object-cover" src={p.imagenes[foto]} alt={titulo} fill sizes="(max-width: 768px) 100vw, 360px" fetchPriority="high" />
              {p.imagenes.length > 1 && <>
                <button className={cx(nav, "left-2.5")} type="button" aria-label={t("sheet.prev")} onClick={() => ver(foto - 1)}><ChevronLeft className="size-5" aria-hidden="true" /></button>
                <button className={cx(nav, "right-2.5")} type="button" aria-label={t("sheet.next")} onClick={() => ver(foto + 1)}><ChevronRight className="size-5" aria-hidden="true" /></button>
              </>}
            </div>
            {p.imagenes.length > 1 && (
              <div className="mt-2 flex gap-2">
                {p.imagenes.map((src, k) => (
                  <button key={k} type="button" aria-current={k === foto} aria-label={t("d.photo", { n: k + 1, t: p.imagenes.length })} onClick={() => ver(k)}
                    className="relative size-14 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 opacity-60 transition hover:opacity-100 aria-[current=true]:border-indigo-500 aria-[current=true]:opacity-100">
                    <Image className="object-cover" src={src} alt="" fill sizes="56px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3.5 md:col-span-7">
            <div className="flex flex-wrap items-center gap-2">
              {an && (an.minimo
                ? <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700"><CircleCheck className="size-3.5" aria-hidden="true" />{t("d.goodBuyLong")}</span>
                : <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{t("d.avgLong")}</span>)}
              <Etiquetas p={p} />
            </div>

            <h2 className="text-lg leading-snug font-extrabold text-slate-900 sm:text-xl">{titulo}</h2>
            <Estrellas p={p} />

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50 p-3.5">
              {p.sinPrecio ? (
                <div className="max-w-sm">
                  <p className="text-lg font-extrabold text-slate-900">{t("price.hidden", { s: p.tienda })}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{t("price.hiddenNote", { s: p.tienda })}</p>
                </div>
              ) : (
                <div>
                  <div className="flex flex-wrap items-baseline gap-2.5">
                    <BloquePrecio p={p} grande />
                    <Descuento p={p} className="border-0 bg-rose-100 text-rose-700" />
                  </div>
                  {p.descuento > 0 && <p className="mt-0.5 text-xs font-semibold text-emerald-700">{t("d.saves", { a: money.format(p.ahorro) })}</p>}
                  <p className="mt-0.5 text-xs text-slate-500">{t("d.priceAt", { d: i.fecha(p.actualizado) })}</p>
                </div>
              )}
              <Votos p={p} grande />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <EnlaceCompra p={p} className="min-w-[180px] flex-1 px-5 py-3">{t("d.goTo", { s: p.tienda })}</EnlaceCompra>
              <Favorito p={p} grande />
              <BotonComparar p={p} />
            </div>
            <Extras p={p} />
            {!p.sinPrecio && <p className="text-xs leading-relaxed text-slate-500">{t("sheet.disclaimer", { d: i.fecha(p.actualizado), s: p.tienda })}</p>}
          </div>
        </div>

        <Grafica p={p} />
        {COMUNIDAD && !p.sinPrecio && <AlertaPrecio p={p} />}
        <Compartir p={p} />
        {COMUNIDAD && <Comentarios id={p.id} />}
      </div>
    </>
  );
}

/* Compartir el producto: por email o copiando el enlace */
function Compartir({ p }: { p: Producto }) {
  const i = useI18n(), { t } = i;
  const [copiado, setCopiado] = useState(false);
  const url = enlaceProducto(p.id, i.lang);
  const asunto = t("link.subject", { t: i.tit(p) });
  const cuerpo = t("link.body", { t: i.tit(p), p: p.sinPrecio ? t("price.hidden", { s: p.tienda }) : money.format(p.precio), s: p.tienda, a: p.descuento ? t("link.was", { w: money.format(p.precioAnterior as number) }) : "", u: url });
  const btn = "inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-card px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 tactil:min-h-10 [&_svg]:size-3.5";
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
      <span className="mr-1 font-semibold">{t("link.label")}</span>
      <a className={btn} href={`mailto:?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`}><Mail aria-hidden="true" /><span>{t("link.email")}</span></a>
      <button className={cx(btn, copiado && "border-emerald-200 bg-emerald-50 text-emerald-700")} type="button"
        onClick={async (e) => { await copiar(url, e.currentTarget.closest("dialog")); setCopiado(true); setTimeout(() => setCopiado(false), 1800); }}>
        {copiado ? <Check aria-hidden="true" /> : <LinkIcon aria-hidden="true" />}<span>{t(copiado ? "link.copied" : "link.copy")}</span>
      </button>
    </div>
  );
}

/* Alerta de precio: sigue el producto y, si se indica, avisa al llegar al precio objetivo (en la campana de Alertas) */
function AlertaPrecio({ p }: { p: Producto }) {
  const { t } = useI18n();
  const usuario = useApp((s) => s.usuario), seguido = useApp((s) => s.seguidos.has(p.id)), obj = useApp((s) => s.objetivos.get(p.id));
  const sugerido = (Math.floor(p.precio * 0.9 * 100) / 100).toFixed(2);
  const [valor, setValor] = useState(obj ? obj.toFixed(2) : sugerido);
  const [msg, setMsg] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  useEffect(() => { setValor(obj ? obj.toFixed(2) : sugerido); setMsg(null); }, [obj, p.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function guardar(e: FormEvent) {
    e.preventDefault();
    if (!usuario) return pedirCuenta("auth.reasonFollow");
    const txt = valor.trim(), v = txt ? parseFloat(txt.replace(",", ".")) : null;
    if (txt && !((v as number) > 0)) return setMsg(t("target.bad"));
    setMsg(null); setOcupado(true);
    try {
      if (!useApp.getState().seguidos.has(p.id)) await alternarSeguir(p.id);
      if (useApp.getState().seguidos.has(p.id) && !(await guardarObjetivo(p.id, v))) setMsg(t("auth.err.generic"));
    } finally { setOcupado(false); }
  }

  return (
    <section className="rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4 sm:p-5" aria-labelledby="alerta-titulo">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h3 id="alerta-titulo" className="flex items-center gap-1.5 text-sm font-bold text-slate-900"><BellRing className="size-4 text-amber-600" aria-hidden="true" />{t("d.alertBox")}</h3>
          <p className="mt-0.5 text-xs text-slate-600">{t("d.alertBoxText")}</p>
        </div>
        {seguido && (
          <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 sm:self-auto">
            <Check className="size-3.5" aria-hidden="true" />{obj ? t("d.alertActive", { o: money.format(obj) }) : t("d.alertFollowing")}
          </span>
        )}
      </div>
      <form onSubmit={guardar} className="mt-3.5 flex flex-col gap-2.5 sm:flex-row">
        <label className="relative sm:w-48">
          <span className="sr-only">{t("d.targetPh")}</span>
          <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm font-bold text-slate-400" aria-hidden="true">$</span>
          <input type="number" inputMode="decimal" min={0.01} step={0.01} value={valor} onChange={(e) => setValor(e.target.value)} placeholder={t("d.targetPh")}
            className="w-full rounded-xl border border-amber-300/80 bg-card py-2 pr-3 pl-7 text-sm font-semibold text-slate-900 tabular-nums outline-none focus:border-amber-500 tactil:min-h-11" />
        </label>
        <button type="submit" disabled={ocupado}
          className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white shadow-2xs transition-colors hover:bg-amber-600 disabled:opacity-60 tactil:min-h-11">
          {t(seguido ? "d.alertUpdate" : "d.alertCreate")}
        </button>
        {seguido && (
          <button type="button" onClick={() => alternarSeguir(p.id)}
            className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-amber-100 hover:text-rose-600 tactil:min-h-11">
            {t("d.alertRemove")}
          </button>
        )}
      </form>
      {msg && <p className="mt-2 text-xs font-medium text-rose-600" role="status">{msg}</p>}
    </section>
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
  if (!cupon && !p.prime && !conCuenta && !reclamado) return null;
  return (
    <div className="space-y-2.5">
      {cupon && (
        <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-dashed border-indigo-300 bg-indigo-50 px-3 py-2.5 text-sm text-acento">
          <Scissors className="size-4" aria-hidden="true" /><span className="flex-[1_1_160px] font-medium text-slate-800">{cupon.texto || t("deal.coupon")}</span>
          {cupon.codigo && (
            <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-card px-2.5 py-1.5 text-xs font-semibold text-acento hover:border-indigo-300" type="button" aria-label={t("coupon.copyX", { c: cupon.codigo })}
              onClick={async (e) => { await copiar(cupon.codigo as string, e.currentTarget.closest("dialog")); setCopiado(true); setTimeout(() => setCopiado(false), 1600); }}>
              <code className="font-mono font-bold tracking-[0.04em] text-slate-900">{cupon.codigo}</code><span>{t(copiado ? "coupon.copied" : "coupon.copy")}</span>
            </button>
          )}
        </div>
      )}
      {p.prime && <p className="flex items-center gap-2 text-xs text-slate-600"><span className={cx(FLAG, FLAG_TIPO.prime)}>Prime</span> {t("deal.primeTip")}</p>}
      {conCuenta && (
        <p className="flex items-center gap-1.5 text-sm text-slate-600">
          <Clock className="size-4 text-amber-600" aria-hidden="true" /><span>{t("deal.endsIn")}</span> <b className="font-bold text-amber-700 tabular-nums">{cuentaAtras(fin - ahora)}</b>
        </p>
      )}
      {reclamado > 0 && (
        <div className="flex flex-col gap-1.5 text-xs text-slate-600">
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={reclamado} aria-label={t("deal.claimed", { n: reclamado })}>
            <i className="block h-full rounded-full bg-indigo-600" style={{ width: reclamado + "%" }} />
          </div>
          <span className="inline-flex items-center gap-1"><Zap className="size-3.5" aria-hidden="true" />{t("deal.claimed", { n: reclamado })}</span>
        </div>
      )}
    </div>
  );
}

function BotonComparar({ p }: { p: Producto }) {
  const { t } = useI18n();
  const en = useApp((s) => s.comparar.includes(p.id));
  return (
    <button type="button" aria-pressed={en} onClick={() => alternarComparar(p.id)}
      className={cx("group/c flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors",
        en ? "border-indigo-200 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-card text-slate-700 hover:bg-slate-50")}>
      <Plus className="size-4 transition-transform group-aria-pressed/c:rotate-45" aria-hidden="true" /><span>{t(en ? "sheet.inCompare" : "card.compare")}</span>
    </button>
  );
}
