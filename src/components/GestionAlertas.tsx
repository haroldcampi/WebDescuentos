/* Pestaña «Alertas de precio»: gestión de las alertas del usuario.
   Resumen (alertas activas, metas alcanzadas, ahorro, canal de aviso), filtros y una fila por alerta con
   último precio visto · precio de hoy · tu meta, progreso hacia la meta y acciones (gráfica, cambiar meta, eliminar, comprar).
   Solo datos reales: la base de datos guarda el precio visto por última vez, la meta y la fecha de creación.
   Los avisos llegan por la campana de la web (no hay emails ni notificaciones push). */
import { BellRing, ChevronRight, CircleCheck, ExternalLink, Flame, LineChart, Pencil, Plus, RefreshCw, Search, ShieldCheck, Target, Trash2, TrendingDown } from "lucide-react";
import Image from "next/image";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { analisis, catalogo, contar, money, urlSegura } from "@/lib/catalogo";
import { alternarSeguir, guardarObjetivo } from "@/lib/cuenta";
import { abrirAcceso, abrirFicha, irAVista, useApp, useI18n } from "@/lib/store";
import type { Producto } from "@/lib/tipos";
import { InsigniaTienda } from "./piezas";
import { BTN, cx } from "./ui";

type Estado = "rastreando" | "alcanzada" | "bajada";
interface Alerta { p: Producto; visto: number; meta?: number; creado?: string; estado: Estado; progreso: number }

const CENT = 0.005;
function estadoDe(precio: number, visto: number, meta?: number): Estado {
  if (meta) return precio <= meta + CENT ? "alcanzada" : "rastreando";
  return precio < visto - CENT ? "bajada" : "rastreando";
}

export function GestionAlertas() {
  const i = useI18n(), { t } = i;
  const usuario = useApp((s) => s.usuario), montado = useApp((s) => s.montado);
  const seguidos = useApp((s) => s.seguidos), objetivos = useApp((s) => s.objetivos), creados = useApp((s) => s.creados);
  useApp((s) => s.ahora);
  const [filtro, setFiltro] = useState<"todas" | "rastreando" | "alcanzadas">("todas");
  const [texto, setTexto] = useState(""), [tienda, setTienda] = useState(""), [orden, setOrden] = useState<"cerca" | "bajada" | "recientes">("cerca");

  const { porId, lista: todo } = catalogo();
  const alertas: Alerta[] = useMemo(() => [...seguidos].flatMap(([id, visto]) => {
    const p = porId.get(id); if (!p || p.sinPrecio) return [];
    const meta = objetivos.get(id), estado = estadoDe(p.precio, visto, meta);
    const progreso = meta ? (visto > meta ? Math.min(1, Math.max(0, (visto - p.precio) / (visto - meta))) : 1) : estado === "bajada" ? 1 : 0;
    return [{ p, visto, meta, creado: creados.get(id), estado, progreso }];
  }), [seguidos, objetivos, creados, porId]);

  const logradas = alertas.filter((a) => a.estado !== "rastreando");
  const conMeta = alertas.filter((a) => a.meta);
  const ahorro = alertas.reduce((n, a) => n + (a.p.ahorro || 0), 0);
  const tiendas = contar("tienda").map(([n]) => n);
  const comprobado = todo.reduce<string>((m, p) => ((p.actualizado || "") > m ? p.actualizado || "" : m), "");

  const q = texto.trim().toLowerCase();
  const visibles = alertas
    .filter((a) => filtro === "todas" || (filtro === "alcanzadas" ? a.estado !== "rastreando" : a.estado === "rastreando"))
    .filter((a) => !tienda || a.p.tienda === tienda)
    .filter((a) => !q || i.tit(a.p).toLowerCase().includes(q))
    .sort((a, b) => Number(b.estado !== "rastreando") - Number(a.estado !== "rastreando") || (
      orden === "cerca" ? b.progreso - a.progreso
        : orden === "bajada" ? (b.visto - b.p.precio) / b.visto - (a.visto - a.p.precio) / a.visto
        : (b.creado || "").localeCompare(a.creado || "")));

  const chip = (activo: boolean) => cx("inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors tactil:min-h-10",
    activo ? "bg-ink text-on-ink" : "bg-indigo-50 text-slate-700 hover:bg-indigo-100");
  const control = "rounded-xl border border-slate-200 bg-card py-2 text-xs font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 tactil:min-h-10";

  return (
    <main id="inicio" className="wrap flex-1 py-6">
      <nav aria-label={t("al.crumb")} className="mb-3 flex items-center gap-1.5 text-xs text-slate-500">
        <button type="button" className="hover:text-slate-800 hover:underline" onClick={() => irAVista("catalogo")}>{t("al.home")}</button>
        <ChevronRight className="size-3.5" aria-hidden="true" />
        <span>{t("al.account")}</span>
        <ChevronRight className="size-3.5" aria-hidden="true" />
        <span aria-current="page" className="font-semibold text-slate-800">{t("al.crumb")}</span>
      </nav>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <h1 id="titulo" className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{t("al.title")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t("al.sub", { n: new Intl.ListFormat(i.lang, { type: "conjunction" }).format(tiendas) })}</p>
        </div>
        <button type="button" title={t("al.newTip")} onClick={() => irAVista("catalogo")}
          className="flex items-center gap-2 rounded-xl bg-[#047857] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#065f46] tactil:min-h-11">
          <Plus className="size-4" aria-hidden="true" />{t("al.new")}
        </button>
      </div>

      {!usuario ? (
        <Vacia icono={<BellRing className="size-7" aria-hidden="true" />} titulo={t("al.crumb")} texto={t("al.login")}>
          <button type="button" className={cx(BTN, "mt-4")} onClick={() => abrirAcceso("entrar")}>{t("d.login")}</button>
        </Vacia>
      ) : <>
        <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label={t("al.crumb")}>
          <Indicador titulo={t("al.k.active")} icono={<Target />} tono="indigo"
            valor={<>{montado ? alertas.length : "—"} <span className="ml-1 rounded-md bg-emerald-50 px-1.5 py-0.5 align-middle text-[11px] font-semibold text-emerald-700">{t("al.k.tracking")}</span></>}
            pie={<><span className="size-1.5 rounded-full bg-emerald-600" />{t("al.k.checked", { d: i.fecha(comprobado) })}</>} />
          <Indicador titulo={t("al.k.reached")} icono={<CircleCheck />} tono="emerald"
            valor={logradas.length}
            pie={conMeta.length ? t("al.k.reachedOf", { n: conMeta.length }) : t("al.k.reachedNone")} />
          <Indicador titulo={t("al.k.saving")} icono={<TrendingDown />} tono="rose"
            valor={money.format(ahorro)} pie={<span className="text-orange-700">{t("al.k.savingSub")}</span>} />
          <Indicador titulo={t("al.k.channel")} icono={<BellRing />} tono="indigo"
            valor={<span className="flex items-center gap-2 text-lg"><span className="size-2.5 shrink-0 rounded-full bg-emerald-600" />{t("al.k.bell")}</span>}
            pie={t("al.k.bellSub")} />
        </section>

        <section className="mb-5 rounded-2xl border border-slate-200 bg-card p-4 shadow-2xs sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2" role="group" aria-label={t("al.f.sort")}>
              <button type="button" aria-pressed={filtro === "todas"} className={chip(filtro === "todas")} onClick={() => setFiltro("todas")}>{t("al.f.all", { n: alertas.length })}</button>
              <button type="button" aria-pressed={filtro === "rastreando"} className={chip(filtro === "rastreando")} onClick={() => setFiltro("rastreando")}>
                <span className={cx("size-1.5 rounded-full", filtro === "rastreando" ? "bg-current" : "bg-emerald-600")} />{t("al.f.active", { n: alertas.length - logradas.length })}
              </button>
              <button type="button" aria-pressed={filtro === "alcanzadas"} className={chip(filtro === "alcanzadas")} onClick={() => setFiltro("alcanzadas")}>
                <CircleCheck className={cx("size-3.5", filtro !== "alcanzadas" && "text-emerald-700")} aria-hidden="true" />{t("al.f.reached", { n: logradas.length })}
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="relative">
                <span className="sr-only">{t("al.f.search")}</span>
                <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input type="search" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={t("al.f.search")} className={cx(control, "w-48 pr-3 pl-8")} />
              </label>
              <label><span className="sr-only">{t("d.menuStores")}</span>
                <select value={tienda} onChange={(e) => setTienda(e.target.value)} className={cx(control, "px-3")}>
                  <option value="">{t("al.f.stores", { n: tiendas.length })}</option>
                  {tiendas.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
              <label><span className="sr-only">{t("al.f.sort")}</span>
                <select value={orden} onChange={(e) => setOrden(e.target.value as typeof orden)} className={cx(control, "px-3")}>
                  <option value="cerca">{t("al.s.near")}</option><option value="bajada">{t("al.s.drop")}</option><option value="recientes">{t("al.s.recent")}</option>
                </select>
              </label>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><RefreshCw className="size-3.5" aria-hidden="true" />{t("al.sync")} <b className="font-semibold text-slate-700">{i.fecha(comprobado)}</b></span>
            <span className="flex items-center gap-1.5"><span className="font-semibold tracking-wider uppercase">{t("al.channels")}</span>
              <span className="flex items-center gap-1 font-medium text-emerald-700"><BellRing className="size-3.5" aria-hidden="true" />{t("al.channelBell")}</span></span>
          </div>
        </section>

        {!alertas.length ? (
          <Vacia icono={<BellRing className="size-7" aria-hidden="true" />} titulo={t("al.empty")} texto={t("al.emptyText")}>
            <button type="button" className={cx(BTN, "mt-4")} onClick={() => irAVista("catalogo")}>{t("d.back")}</button>
          </Vacia>
        ) : !visibles.length ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-card py-10 text-center text-sm text-slate-500">{t("al.none")}</p>
        ) : (
          <ul className="flex flex-col gap-4">{visibles.map((a) => <FilaAlerta key={a.p.id} a={a} />)}</ul>
        )}
      </>}
    </main>
  );
}

function Indicador({ titulo, valor, pie, icono, tono }: { titulo: string; valor: ReactNode; pie: ReactNode; icono: ReactNode; tono: "indigo" | "emerald" | "rose" }) {
  const fondo = { indigo: "bg-indigo-50 text-indigo-700", emerald: "bg-emerald-50 text-emerald-700", rose: "bg-orange-50 text-orange-700" }[tono];
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-card p-4 shadow-2xs">
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{titulo}</p>
        <p className="mt-1 text-2xl font-extrabold text-slate-900 tabular-nums">{valor}</p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">{pie}</p>
      </div>
      <span className={cx("grid size-11 shrink-0 place-items-center rounded-xl [&_svg]:size-5", fondo)} aria-hidden="true">{icono}</span>
    </div>
  );
}

function Vacia({ icono, titulo, texto, children }: { icono: ReactNode; titulo: string; texto: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-card px-4 py-14 text-center">
      <div className="mb-3 grid size-14 place-items-center rounded-2xl bg-amber-50 text-amber-600">{icono}</div>
      <h2 className="text-base font-bold text-slate-900">{titulo}</h2>
      <p className="mt-1 max-w-md text-sm text-slate-500">{texto}</p>
      {children}
    </div>
  );
}

/* Una alerta: producto · precios y progreso · estado y acciones. La meta se cambia aquí mismo. */
function FilaAlerta({ a }: { a: Alerta }) {
  const i = useI18n(), { t } = i;
  const { p, visto, meta, estado, progreso } = a;
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(meta ? meta.toFixed(2) : "");
  const [error, setError] = useState(false);
  const logro = estado !== "rastreando";
  const minimo = !!analisis(p)?.minimo;
  const pct = Math.round(progreso * 100);
  const bajada = Math.max(0, visto - p.precio);

  async function guardar(e: FormEvent) {
    e.preventDefault();
    const txt = valor.trim(), v = txt ? parseFloat(txt.replace(",", ".")) : null;
    if (txt && !((v as number) > 0)) return setError(true);
    setError(false);
    if (await guardarObjetivo(p.id, v)) setEditando(false); else setError(true);
  }

  const accion = "grid size-10 place-items-center rounded-xl border border-slate-200 bg-card text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 tactil:size-11 [&_svg]:size-4";
  return (
    <li className={cx("relative overflow-hidden rounded-2xl border bg-card shadow-2xs", logro ? "border-2 border-[#047857]" : "border-slate-200")}>
      {logro && <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-orange-500" aria-hidden="true" />}
      <div className="grid grid-cols-1 items-center gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)_auto] lg:gap-6">
        {/* Producto */}
        <div className="flex min-w-0 items-center gap-4">
          <div className="relative shrink-0">
            {logro && <span className="absolute -top-1.5 -left-1.5 z-[1] rounded-md bg-[#047857] px-1.5 py-0.5 text-[10px] font-extrabold tracking-wide text-white uppercase">{t("al.success")}</span>}
            <button type="button" onClick={() => abrirFicha(p.id)} className="relative block size-20 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 sm:size-24" aria-label={i.tit(p)}>
              <Image className="object-cover" src={p.imagenes[0]} alt="" fill sizes="96px" />
            </button>
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
              <InsigniaTienda tienda={p.tienda} className="py-0.5 shadow-none" />
              {a.creado && <span>{t("al.created", { d: i.fecha(a.creado) })}</span>}
            </div>
            <h3 className="mt-1.5">
              <button type="button" onClick={() => abrirFicha(p.id)} className="line-clamp-2 text-left text-base leading-snug font-bold text-slate-900 hover:text-acento">{i.tit(p)}</button>
            </h3>
            {minimo && <span className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700"><ShieldCheck className="size-3.5" aria-hidden="true" />{t("al.lowest")}</span>}
          </div>
        </div>

        {/* Precios y progreso */}
        <div className={cx("rounded-xl border p-3.5", logro ? "border-emerald-200 bg-emerald-50/60" : "border-slate-200 bg-slate-50")}>
          <dl className="grid grid-cols-3 items-end gap-2 text-center">
            <div><dt className="text-[11px] font-medium text-slate-500">{t("al.seen")}</dt><dd className={cx("text-sm font-semibold tabular-nums", p.precio < visto ? "text-slate-500 line-through" : "text-slate-700")}>{money.format(visto)}</dd></div>
            <div className={cx(logro && "rounded-lg border border-slate-300 bg-card py-1")}>
              <dt className="text-[11px] font-medium text-slate-500">{logro ? t("al.fell") : t("al.now")}</dt>
              <dd className={cx("text-lg font-extrabold tabular-nums sm:text-xl", logro ? "text-emerald-700" : "text-slate-900")}>{money.format(p.precio)}</dd>
            </div>
            <div className={cx("rounded-lg py-1", !logro && !!meta && "bg-emerald-50")}>
              <dt className="text-[11px] font-medium text-slate-500">{t("al.goal")}</dt>
              <dd className={cx("font-extrabold tabular-nums", meta ? "text-lg text-emerald-700 sm:text-xl" : "text-xs text-slate-600")}>{meta ? money.format(meta) : t("al.anyDrop")}</dd>
            </div>
          </dl>
          {editando ? (
            <form onSubmit={guardar} className="mt-3 flex flex-wrap items-center gap-2">
              <label className="relative flex-1"><span className="sr-only">{t("al.goalPh")}</span>
                <span className="absolute top-1/2 left-2.5 -translate-y-1/2 text-xs font-bold text-slate-400" aria-hidden="true">$</span>
                <input autoFocus type="number" inputMode="decimal" min={0.01} step={0.01} value={valor} onChange={(e) => setValor(e.target.value)} placeholder={t("al.noGoal")} aria-invalid={error}
                  className="w-full rounded-lg border border-slate-300 bg-card py-1.5 pr-2 pl-6 text-sm font-semibold tabular-nums outline-none focus:border-indigo-500 aria-invalid:border-rose-400" />
              </label>
              <button type="submit" className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700">{t("al.save")}</button>
              <button type="button" className="rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800" onClick={() => { setEditando(false); setValor(meta ? meta.toFixed(2) : ""); setError(false); }}>{t("al.cancel")}</button>
            </form>
          ) : logro ? (
            <p className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-card px-3 py-2 text-xs font-semibold text-emerald-800">
              <span className="flex items-center gap-1.5"><CircleCheck className="size-4 text-emerald-600" aria-hidden="true" />{meta ? t("al.cheaper", { a: money.format(Math.max(0, meta - p.precio)) }) : t("al.dropSince", { a: money.format(bajada) })}</span>
              {p.descuento > 0 && <span className="rounded-md bg-orange-600 px-1.5 py-0.5 text-[11px] font-bold text-white">{t("al.total", { p: p.descuento })}</span>}
            </p>
          ) : meta ? (
            <div className="mt-3">
              <div className="flex justify-between gap-2 text-[11px] font-semibold">
                <span className="flex items-center gap-1 text-slate-600"><TrendingDown className="size-3.5" aria-hidden="true" />{t("al.toGoal", { a: money.format(p.precio - meta), p: Math.round(((p.precio - meta) / p.precio) * 100) })}</span>
                <span className="text-emerald-700">{t("al.progress", { p: pct })}</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={t("al.progress", { p: pct })}>
                <span className="block h-full rounded-full bg-[#047857]" style={{ width: Math.max(3, pct) + "%" }} />
              </div>
            </div>
          ) : (
            <p className="mt-3 text-[11px] font-medium text-slate-500">{t("al.waitDrop", { a: money.format(visto) })}</p>
          )}
        </div>

        {/* Estado y acciones */}
        <div className="flex flex-wrap items-center justify-between gap-3 lg:flex-col lg:items-end">
          <span className={cx("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase",
            logro ? "border-transparent bg-[#047857] text-white" : "border-emerald-200 bg-emerald-50 text-emerald-700")}>
            {logro ? <CircleCheck className="size-3.5" aria-hidden="true" /> : <span className="size-1.5 rounded-full bg-emerald-600" />}
            {t(estado === "alcanzada" ? "al.st.reached" : estado === "bajada" ? "al.st.dropped" : "al.st.active")}
          </span>
          <div className="flex items-center gap-2">
            <button type="button" className={accion} title={t("al.chart")} aria-label={`${t("al.chart")}: ${i.tit(p)}`} onClick={() => abrirFicha(p.id)}><LineChart aria-hidden="true" /></button>
            <button type="button" className={accion} title={t("al.edit")} aria-label={`${t("al.edit")}: ${i.tit(p)}`} aria-expanded={editando} onClick={() => setEditando((v) => !v)}><Pencil aria-hidden="true" /></button>
            <button type="button" className={cx(accion, "hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600")} title={t("al.remove")} aria-label={`${t("al.remove")}: ${i.tit(p)}`} onClick={() => alternarSeguir(p.id)}><Trash2 aria-hidden="true" /></button>
            <a href={urlSegura(p.enlace)} target="_blank" rel="sponsored nofollow noopener"
              className={cx("flex h-10 items-center gap-1.5 rounded-xl px-4 text-sm font-bold whitespace-nowrap text-white transition-colors tactil:h-11",
                logro ? "bg-orange-600 hover:bg-orange-700" : "bg-[#0f172a] hover:bg-slate-700 dark:hover:bg-[#1e293b]")}>
              {logro ? <><Flame className="size-4" aria-hidden="true" />{t("al.buy", { p: money.format(p.precio) })}</> : <>{t("al.store")}<ExternalLink className="size-3.5" aria-hidden="true" /></>}
            </a>
          </div>
        </div>
      </div>
    </li>
  );
}

