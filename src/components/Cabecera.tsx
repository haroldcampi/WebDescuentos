/* Cabecera fija: logo, buscador, idioma, modo oscuro, Alertas, Favoritos y cuenta.
   Debajo, la franja de filtros: tiendas, «Mínimo en 90 días», categorías y orden. */
import { ArrowUpDown, Bell, BellRing, Check, ChevronDown, ChevronRight, Heart, LogOut, Radar, Search, Settings, TrendingUp, User, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent } from "react";
import { catalogo, categoriasOrdenadas, contar, money, ORDENES } from "@/lib/catalogo";
import { COMUNIDAD } from "@/lib/config";
import { bajadas, nombreUsuario, salir } from "@/lib/cuenta";
import { guardarIdioma, idiomaEnDireccion, IDIOMAS, type Idioma } from "@/lib/i18n";
import { cerrarTeclado } from "@/lib/scroll";
import { abrirAcceso, abrirFicha, cambiarFiltros, irAVista, limpiarFiltros, useApp, useI18n } from "@/lib/store";
import type { Filtros as TFiltros, Orden as TOrden } from "@/lib/tipos";
import { MiAvatar } from "./Avatar";
import { MarcaTienda } from "./piezas";
import { SelectorIdioma, SelectorTema } from "./Selector";
import { cx } from "./ui";

export function cambiarIdioma(l: Idioma) {
  if (!IDIOMAS.includes(l) || l === useApp.getState().lang) return;
  useApp.setState({ lang: l });
  guardarIdioma(l); idiomaEnDireccion(l);
}

const BTN_CAB = "relative flex items-center gap-1.5 rounded-xl p-2 text-sm font-semibold transition-colors sm:px-3 tactil:min-h-11 tactil:min-w-11 tactil:justify-center";

export function Cabecera() {
  const i = useI18n(), { t } = i;
  const [recargando, setRecargando] = useState(false);

  /* Logo: recarga la web entera con todo al día (borra las copias guardadas y vuelve al inicio) */
  async function alLogo(e: MouseEvent<HTMLAnchorElement>) {
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.button) return; // abrir en otra pestaña sigue funcionando
    e.preventDefault();
    if (recargando) return;
    setRecargando(true);
    try { cerrarTeclado(); limpiarFiltros(); scrollTo({ top: 0 }); } catch (er) { console.error(er); }
    const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));
    await Promise.race([espera(3000), (async () => {
      try {
        const reg = await navigator.serviceWorker?.getRegistration();
        await reg?.update();
        if (window.caches) await Promise.all((await caches.keys()).map((k) => caches.delete(k)));
        await Promise.all(["./", "manifest.webmanifest"].map((a) => fetch(a, { cache: "reload" }).catch(() => {})));
      } catch (er) { console.error(er); }
    })()]);
    location.replace(location.pathname);
  }

  return (
    <header data-cabecera className="sticky top-0 z-40 border-b border-slate-200/80 bg-card/95 shadow-xs backdrop-blur-md">
      <div className="wrap">
        <div className="flex flex-wrap items-center gap-x-3 sm:h-16 sm:flex-nowrap sm:gap-x-5 max-sm:pt-2.5">
          <a href="#inicio" onClick={alLogo} title={t("logo.aria")} className="group flex shrink-0 items-center gap-2.5 no-underline">
            <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20 transition-transform group-hover:scale-105">
              <Radar className={cx("size-5", recargando && "animate-gira")} aria-hidden="true" />
            </span>
            <span className="flex flex-col leading-none max-xs:sr-only">
              <span className="text-lg font-extrabold tracking-tight text-slate-900">Radar de <span className="text-acento">Ofertas</span></span>
              <span className="mt-0.5 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">{t("d.tagline")}</span>
            </span>
          </a>

          <Buscador />

          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5">
            <SelectorIdioma onCambio={cambiarIdioma} />
            <SelectorTema />
            <Alertas />
            <Favoritos />
            <Cuenta />
          </div>
        </div>
      </div>
      <div className="border-t border-slate-100 bg-slate-50/90">
        <div className="wrap flex flex-wrap items-center gap-x-4 gap-y-1">
          <Pestanas />
          <Orden />
        </div>
      </div>
    </header>
  );
}

/* Buscador: filtra al escribir */
function Buscador() {
  const { t } = useI18n();
  const q = useApp((s) => s.filtros.q);
  const [texto, setTexto] = useState("");
  const temp = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Si la búsqueda cambia desde fuera (borrar filtros), el campo se pone al día
  useEffect(() => { if (texto.trim() !== q) { setTexto(q); clearTimeout(temp.current); } }, [q]); // eslint-disable-line react-hooks/exhaustive-deps
  const poner = (v: string) => {
    setTexto(v); clearTimeout(temp.current);
    temp.current = setTimeout(() => cambiarFiltros({ q: v.trim() }), 250);
  };
  return (
    <form role="search" id="buscador" className="relative max-w-lg min-w-0 flex-1 max-sm:order-last max-sm:my-2.5 max-sm:max-w-none max-sm:basis-full"
      onSubmit={(e) => { e.preventDefault(); clearTimeout(temp.current); cambiarFiltros({ q: texto.trim() }); cerrarTeclado(); }}>
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
      <input id="q" type="search" enterKeyHint="search" autoComplete="off" value={texto} onChange={(e) => poner(e.target.value)}
        placeholder={t("search.placeholder")} aria-label={t("search.aria")}
        className="w-full rounded-xl border border-indigo-200/70 bg-indigo-50/50 py-2 pr-9 pl-10 text-sm text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-card focus:ring-2 focus:ring-indigo-500/20 tactil:min-h-11 [&::-webkit-search-cancel-button]:hidden" />
      {texto && (
        <button type="button" onClick={() => { poner(""); clearTimeout(temp.current); cambiarFiltros({ q: "" }); }} aria-label={t("d.clearSearch")} title={t("d.clearSearch")}
          className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-0.5 text-slate-400 hover:text-slate-600 tactil:p-2">
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </form>
  );
}

const ICONO_CAB = "relative grid size-10 place-items-center rounded-xl text-slate-700 transition-colors hover:bg-slate-100 tactil:size-11 [&_svg]:size-[22px]";

/* Campana: abre un desplegable con las alertas (no cambia de página). Primero las que han bajado; el punto naranja avisa de ellas.
   Desde aquí se puede ir a la pestaña «Alertas de precio» para gestionarlas. */
function Alertas() {
  const i = useI18n(), { t } = i;
  const montado = useApp((s) => s.montado), usuario = useApp((s) => s.usuario);
  const seguidos = useApp((s) => s.seguidos), objetivos = useApp((s) => s.objetivos);
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null), btn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: globalThis.MouseEvent) => { if (!caja.current?.contains(e.target as Node)) setAbierto(false); };
    document.addEventListener("click", fuera);
    return () => document.removeEventListener("click", fuera);
  }, [abierto]);
  if (!COMUNIDAD) return null;
  const baj = montado ? bajadas(seguidos, objetivos) : [];
  const lab = baj.length ? t("alert.bellN", { n: baj.length }) : t("d.alerts");
  const { porId } = catalogo();
  const ids = [...seguidos.keys()].filter((id) => porId.has(id) && !porId.get(id)!.sinPrecio).sort((a, b) => Number(baj.includes(b)) - Number(baj.includes(a)));
  const elegir = (fn: () => void) => () => { setAbierto(false); fn(); };
  return (
    <div className="relative" ref={caja} onKeyDown={(e) => { if (e.key === "Escape") { setAbierto(false); btn.current?.focus(); } }}>
      <button ref={btn} type="button" aria-haspopup="dialog" aria-expanded={abierto} aria-label={lab} title={lab} onClick={() => setAbierto((v) => !v)}
        className={cx(ICONO_CAB, abierto && "bg-amber-50 text-amber-700")}>
        <Bell aria-hidden="true" />
        {baj.length > 0 && <span className="absolute top-1.5 right-2 size-2.5 rounded-full border-2 border-card bg-orange-500" aria-hidden="true" />}
      </button>
      {abierto && (
        <div role="dialog" aria-label={t("al.pop.title")}
          className="absolute top-[calc(100%+8px)] right-0 z-50 w-[min(22rem,calc(100vw-1.5rem))] animate-pop overflow-hidden rounded-2xl border border-slate-200 bg-card shadow-xl max-sm:-right-24">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-bold text-slate-900"><BellRing className="size-4 text-amber-600" aria-hidden="true" />{t("al.pop.title")}</p>
            {baj.length > 0 && <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-bold text-orange-700">{t("al.pop.dropped", { n: baj.length })}</span>}
          </div>
          {!usuario ? (
            <div className="px-4 py-5 text-center">
              <p className="text-sm text-slate-600">{t("al.pop.login")}</p>
              <button type="button" className="mt-3 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700" onClick={elegir(() => abrirAcceso("entrar"))}>{t("d.login")}</button>
            </div>
          ) : !ids.length ? (
            <p className="px-4 py-5 text-center text-sm text-slate-600">{t("al.pop.empty")}</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto p-1.5">
              {ids.slice(0, 6).map((id) => {
                const p = porId.get(id)!, meta = objetivos.get(id), bajo = baj.includes(id);
                return (
                  <li key={id}>
                    <button type="button" onClick={elegir(() => abrirFicha(id))} className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none">
                      <span className="relative size-11 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50"><Image className="object-cover" src={p.imagenes[0]} alt="" fill sizes="44px" /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-bold text-slate-900">{i.tit(p)}</span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                          <b className={cx("text-xs tabular-nums", bajo ? "text-emerald-700" : "text-slate-800")}>{p.sinPrecio ? "—" : money.format(p.precio)}</b>
                          <span>· {meta ? `${t("al.goal")} ${money.format(meta)}` : t("al.anyDrop")}</span>
                        </span>
                      </span>
                      {bajo && <span className="shrink-0 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">{t("al.fell")}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {usuario && (
            <button type="button" onClick={elegir(() => irAVista("alertas"))}
              className="flex w-full items-center justify-center gap-1.5 border-t border-slate-100 px-4 py-3 text-sm font-semibold text-acento hover:bg-indigo-50/60">
              {t("al.pop.all")}<ChevronRight className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Favoritos() {
  const { t } = useI18n();
  const montado = useApp((s) => s.montado), vista = useApp((s) => s.filtros.vista), n = useApp((s) => s.favoritos.size);
  if (!COMUNIDAD) return null;
  const activa = vista === "favoritos";
  const lab = montado && n ? `${t("d.favs")} (${n})` : t("d.favs");
  return (
    <button type="button" aria-pressed={activa} aria-label={lab} title={lab} onClick={() => irAVista(activa ? "catalogo" : "favoritos")}
      className={cx(ICONO_CAB, activa && "bg-rose-50 text-rose-600")}>
      <Heart className={cx(activa && "fill-rose-500 text-rose-500")} aria-hidden="true" />
    </button>
  );
}

/* Pestañas (segunda fila de la cabecera): Ofertas populares · Tendencias · Mayores descuentos · Tiendas (menú) ·
   Categorías (menú) · Alertas de precio. La activa va en verde y subrayada.
   Si no caben (móvil), la fila se desplaza de lado con un difuminado al final. */
function Pestanas() {
  const i = useI18n(), { t } = i;
  const f = useApp((s) => s.filtros);
  const [menu, setMenu] = useState<"tiendas" | "cats" | null>(null);
  const tab = (activa: boolean) => cx("relative flex shrink-0 items-center gap-1 py-3 text-sm font-semibold whitespace-nowrap transition-colors tactil:min-h-11",
    "after:absolute after:inset-x-0 after:bottom-1.5 after:h-0.5 after:rounded-full after:transition-colors",
    activa ? "text-emerald-700 after:bg-emerald-700" : "text-slate-700 after:bg-transparent hover:text-slate-900");
  const ir = (c: Partial<TFiltros>) => { cambiarFiltros({ vista: "catalogo", ...c }); scrollTo({ top: 0, behavior: "smooth" }); };
  const cats = categoriasOrdenadas(i), tiendas = contar("tienda"), total = cats.reduce((n, [, c]) => n + c, 0);
  const enCatalogo = f.vista === "catalogo";
  const tendencias = enCatalogo && !f.min90 && f.orden === "popularidad";
  const descuentos = enCatalogo && !f.min90 && f.orden === "descuento";
  const portada = enCatalogo && !f.min90 && !tendencias && !descuentos;
  return (
    <nav className="sin-barra -mx-1 flex min-w-0 flex-1 items-center gap-5 overflow-x-auto px-1 max-lg:[mask-image:linear-gradient(to_right,#000_88%,transparent)]" aria-label={t("d.navAria")}>
      <button type="button" aria-current={portada ? "page" : undefined} className={tab(portada)}
        onClick={() => ir({ orden: "destacadas", min90: false })}>{t("d.navPopular")}</button>
      <button type="button" aria-pressed={tendencias} className={tab(tendencias)}
        onClick={() => ir({ orden: tendencias ? "destacadas" : "popularidad", min90: false })}>{t("d.trending")}<TrendingUp className="size-4" aria-hidden="true" /></button>
      <button type="button" aria-pressed={descuentos} className={tab(descuentos)}
        onClick={() => ir({ orden: descuentos ? "destacadas" : "descuento", min90: false })}>{t("d.bigDiscounts")}</button>
      <Desplegable id="tiendas" etiqueta={t("d.menuStores")} valor={f.tiendas[0] || ""} abierto={menu} setAbierto={setMenu}
        claseBoton={(abierto) => cx(tab(f.tiendas.length > 0), abierto && "text-slate-900")}
        opciones={[{ v: "", nombre: t("d.allStores"), n: total }, ...tiendas.map(([v, n]) => ({ v, nombre: v, n, marca: true }))]}
        alElegir={(v) => ir({ tiendas: v ? [v] : [] })} />
      <Desplegable id="cats" etiqueta={t("d.menuCats")} valor={f.categoria === "Todas" ? "" : f.categoria} abierto={menu} setAbierto={setMenu}
        claseBoton={(abierto) => cx(tab(f.categoria !== "Todas"), abierto && "text-slate-900")}
        opciones={[{ v: "", nombre: t("d.allCatsLong"), n: total }, ...cats.map(([v, n]) => ({ v, nombre: i.cat(v), n }))]}
        alElegir={(v) => ir({ categoria: v || "Todas" })} />
      <button type="button" aria-current={f.vista === "alertas" ? "page" : undefined} className={tab(f.vista === "alertas")}
        onClick={() => irAVista(f.vista === "alertas" ? "catalogo" : "alertas")}>{t("d.navAlerts")}</button>
    </nav>
  );
}

/* Cuenta: sin sesión, «Entrar»; con sesión, avatar y nombre con un menú de ajustes y salir */
function Cuenta() {
  const { t } = useI18n();
  const usuario = useApp((s) => s.usuario), perfil = useApp((s) => s.perfil);
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null), btn = useRef<HTMLButtonElement>(null), pop = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!abierto) return;
    pop.current?.querySelector("button")?.focus();
    const fuera = (e: globalThis.MouseEvent) => { if (!caja.current?.contains(e.target as Node)) setAbierto(false); };
    document.addEventListener("click", fuera);
    return () => document.removeEventListener("click", fuera);
  }, [abierto]);
  useEffect(() => { if (!usuario) setAbierto(false); }, [usuario]);
  if (!COMUNIDAD) return null;

  if (!usuario) return (
    <button type="button" onClick={() => abrirAcceso("entrar")}
      className="ml-1 flex items-center gap-2 rounded-xl bg-ink px-3.5 py-2 text-sm font-semibold text-on-ink shadow-xs transition-opacity hover:opacity-90 tactil:min-h-11">
      <User className="size-4" aria-hidden="true" /><span className="max-sm:sr-only">{t("d.login")}</span>
    </button>
  );

  const nombre = nombreUsuario(usuario, perfil);
  const elegir = (fn: () => void) => () => { setAbierto(false); fn(); };
  const opcion = "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:bg-slate-100 focus-visible:outline-none tactil:min-h-11 [&_svg]:size-4 [&_svg]:text-slate-400";
  return (
    <div className="relative ml-1" ref={caja} onKeyDown={(e) => { if (e.key === "Escape") { setAbierto(false); btn.current?.focus(); } }}>
      <button ref={btn} type="button" aria-haspopup="true" aria-expanded={abierto} aria-label={`${t("acct.menu")}: ${nombre}`} title={`${t("acct.menu")}: ${nombre}`}
        onClick={() => setAbierto((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 py-1.5 pr-3 pl-1.5 dark:border-indigo-200 tactil:min-h-11">
        <MiAvatar className="size-6 rounded-lg" />
        <span className="hidden max-w-[110px] truncate text-xs font-bold text-slate-800 sm:inline">{nombre}</span>
      </button>
      {abierto && (
        <div ref={pop} className="absolute top-[calc(100%+6px)] right-0 z-50 flex min-w-60 animate-pop flex-col rounded-xl border border-slate-200 bg-card p-1.5 shadow-lg">
          <div className="mb-1 flex items-center gap-3 border-b border-slate-100 px-3 pt-1.5 pb-3">
            <MiAvatar className="size-10" />
            <p className="flex min-w-0 flex-col"><b className="text-sm font-bold text-slate-900">{nombre}</b><span className="text-xs text-slate-500 [overflow-wrap:anywhere]">{usuario.email || ""}</span></p>
          </div>
          <button className={opcion} type="button" onClick={elegir(() => abrirAcceso("ajustes"))}><Settings aria-hidden="true" />{t("acct.settings")}</button>
          <button className={cx(opcion, "hover:text-rose-600")} type="button" onClick={elegir(salir)}><LogOut aria-hidden="true" />{t("acct.logout")}</button>
        </div>
      )}
    </div>
  );
}

/* Orden de las ofertas (a la derecha de las pestañas; en móvil no cabe y se ordena con las pestañas) */
function Orden() {
  const { t } = useI18n();
  const orden = useApp((s) => s.filtros.orden);
  return (
    <label className="relative ml-auto shrink-0 py-1.5 max-sm:hidden">
      <span className="sr-only">{t("d.sortAria")}</span>
      <select value={orden} onChange={(e) => cambiarFiltros({ orden: e.target.value as TOrden })}
        className="cursor-pointer appearance-none rounded-lg border border-slate-200 bg-card py-1.5 pr-8 pl-3 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 tactil:min-h-10">
        {ORDENES.map((o) => <option key={o} value={o}>{t(`d.sort.${o}`)}</option>)}
      </select>
      <ArrowUpDown className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
    </label>
  );
}

interface Opcion { v: string; nombre: string; n: number; marca?: boolean }

/* Menú desplegable de la franja: «Tiendas ▾» / «Categorías ▾». Muestra la elección activa junto al nombre.
   Se cierra al elegir, al pulsar fuera o con Esc; con las flechas se recorren las opciones. */
function Desplegable({ id, etiqueta, valor, opciones, alElegir, abierto, setAbierto, claseBoton }: {
  id: "tiendas" | "cats"; etiqueta: string; valor: string; opciones: Opcion[]; alElegir: (v: string) => void;
  abierto: "tiendas" | "cats" | null; setAbierto: (v: "tiendas" | "cats" | null) => void;
  // Aspecto del botón (p. ej. pestaña de la cabecera); por defecto, el de la franja de filtros
  claseBoton?: (abierto: boolean) => string;
}) {
  // Con aspecto propio (pestaña) no se añade la pastilla de la elección: el color ya indica que hay filtro y así no cambia de ancho
  const caja = useRef<HTMLDivElement>(null), btn = useRef<HTMLButtonElement>(null), lista = useRef<HTMLUListElement>(null);
  const visible = abierto === id;
  const activo = opciones.find((o) => o.v === valor && o.v);
  /* El menú se coloca en posición fija bajo el botón: así no lo recorta una fila desplazable (pestañas en móvil).
     La cabecera tiene desenfoque de fondo, que la convierte en la referencia de «fixed»: se mide respecto a ella. */
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  useEffect(() => {
    if (!visible) return;
    const colocar = () => {
      const r = btn.current?.getBoundingClientRect(); if (!r) return;
      const ref = btn.current?.closest("header")?.getBoundingClientRect() || { top: 0, left: 0 };
      setPos({ top: r.bottom + 6 - ref.top, left: Math.max(8, Math.min(r.left, innerWidth - 264)) - ref.left });
    };
    colocar();
    addEventListener("resize", colocar);
    return () => removeEventListener("resize", colocar);
  }, [visible]);
  useEffect(() => {
    if (!visible) return;
    (lista.current?.querySelector("[aria-checked=true]") as HTMLElement | null)?.focus();
    const fuera = (e: globalThis.MouseEvent) => { if (!caja.current?.contains(e.target as Node)) setAbierto(null); };
    document.addEventListener("click", fuera);
    return () => document.removeEventListener("click", fuera);
  }, [visible, !!pos, setAbierto]); // eslint-disable-line react-hooks/exhaustive-deps
  function teclas(e: ReactKeyboardEvent) {
    if (e.key === "Escape") { setAbierto(null); btn.current?.focus(); return; }
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const items = [...(lista.current?.querySelectorAll<HTMLElement>("[role=menuitemradio]") || [])];
    const k = items.indexOf(document.activeElement as HTMLElement);
    items[(k + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus();
  }
  return (
    <div className="relative" ref={caja} onKeyDown={teclas}>
      <button ref={btn} type="button" aria-haspopup="menu" aria-expanded={visible} aria-controls={"menu-" + id} onClick={() => setAbierto(visible ? null : id)}
        className={claseBoton ? claseBoton(visible) : cx("flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-bold whitespace-nowrap transition-colors tactil:min-h-10",
          visible ? "bg-slate-200/70 text-slate-900" : "text-slate-900 hover:bg-slate-200/60")}>
        <span>{etiqueta}</span>
        {activo && !claseBoton && <span className="max-w-32 truncate rounded-md bg-indigo-50 px-1.5 py-px text-xs font-semibold text-indigo-700">{activo.nombre}</span>}
        <ChevronDown className={cx("size-4 transition-transform duration-200", visible && "rotate-180")} aria-hidden="true" />
      </button>
      {visible && pos && (
        <ul ref={lista} id={"menu-" + id} role="menu" aria-label={etiqueta} style={{ top: pos.top, left: pos.left }}
          className="fixed z-50 max-h-[min(70svh,26rem)] w-64 animate-pop overflow-y-auto rounded-xl border border-slate-200 bg-card p-1.5 shadow-lg">
          {opciones.map((o) => {
            const sel = o.v === valor;
            return (
              <li key={o.v || "todas"} role="none">
                <button type="button" role="menuitemradio" aria-checked={sel} onClick={() => { alElegir(o.v); setAbierto(null); btn.current?.focus(); }}
                  className={cx("flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors focus-visible:bg-slate-100 focus-visible:outline-none tactil:min-h-11",
                    sel ? "bg-indigo-50 font-semibold text-indigo-700" : "font-medium text-slate-700 hover:bg-slate-100")}>
                  {o.marca && <MarcaTienda t={o.v} className="size-2" />}
                  <span className="flex-1 truncate">{o.nombre}</span>
                  <span className="text-xs text-slate-500 tabular-nums">{o.n}</span>
                  <Check className={cx("size-4", sel ? "text-indigo-600" : "invisible")} aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
