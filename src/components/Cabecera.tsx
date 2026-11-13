/* Cabecera: logo, buscador, secciones, idioma, alertas, modo oscuro y cuenta.
   En móvil y en pantallas bajas se esconde al bajar y reaparece al subir. */
import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from "react";
import { bajadas, nombreUsuario, salir } from "@/lib/cuenta";
import { guardarIdioma, idiomaEnDireccion, IDIOMAS, type Idioma } from "@/lib/i18n";
import { bajarA, cerrarTeclado, destinoBusqueda, esMovil, irAlCatalogo, irAResultados } from "@/lib/scroll";
import { abrirAcceso, abrirAlertas, cambiarFiltros, limpiarFiltros, useApp, useI18n } from "@/lib/store";
import { sb } from "@/lib/supabase";
import { MiAvatar } from "./Avatar";
import * as I from "./iconos";
import { ICON_BTN, cx } from "./ui";

export function cambiarIdioma(l: Idioma) {
  if (!IDIOMAS.includes(l) || l === useApp.getState().lang) return;
  useApp.setState({ lang: l });
  guardarIdioma(l); idiomaEnDireccion(l);
}

export function Cabecera() {
  const i = useI18n(), { t } = i;
  const [oculta, setOculta] = useState(false);
  const [recargando, setRecargando] = useState(false);
  const orden = useApp((s) => s.filtros.orden);

  useEffect(() => {
    let y0 = scrollY, ticking = false;
    const alBajar = () => {
      if (ticking) return; ticking = true;
      requestAnimationFrame(() => {
        const y = scrollY, enBusqueda = document.activeElement === document.getElementById("q");
        if (y > y0 + 6 && y > 240 && !enBusqueda) setOculta(true);
        else if (y < y0 - 6 || y < 240) setOculta(false);
        y0 = y; ticking = false;
      });
    };
    addEventListener("scroll", alBajar, { passive: true });
    return () => removeEventListener("scroll", alBajar);
  }, []);

  /* Logo: recarga la web entera con todo al día (borra las copias guardadas y vuelve al inicio) */
  async function alLogo(e: MouseEvent<HTMLAnchorElement>) {
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.button) return; // abrir en otra pestaña sigue funcionando
    e.preventDefault();
    if (recargando) return;
    setRecargando(true);
    // Quita al momento la búsqueda y los filtros y sube arriba, sin esperar a la recarga
    try { cerrarTeclado(); limpiarFiltros(); scrollTo({ top: 0 }); } catch (er) { console.error(er); }
    // Si la red tarda, no se queda esperando: como mucho 3 segundos y recarga igual
    const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));
    await Promise.race([espera(3000), (async () => {
      try {
        const reg = await navigator.serviceWorker?.getRegistration();
        await reg?.update();
        if (window.caches) await Promise.all((await caches.keys()).map((k) => caches.delete(k)));
        // Vuelve a descargar la página saltándose la caché del navegador
        await Promise.all(["./", "manifest.webmanifest"].map((a) => fetch(a, { cache: "reload" }).catch(() => {})));
      } catch (er) { console.error(er); }
    })()]);
    location.replace(location.pathname); // sin ficha ni filtros: entra limpia desde arriba
  }

  return (
    <header data-cabecera data-oculta={oculta} onFocus={() => setOculta(false)}
      className="sticky top-0 z-30 border-b border-frost bg-paper transition-transform duration-300 ease-brand pantalla-chica:data-[oculta=true]:-translate-y-full">
      <div className="wrap flex h-(--head-h) items-center gap-6 max-sm:h-auto max-sm:flex-wrap max-sm:gap-x-1.5 max-sm:gap-y-2.5 max-sm:py-3">
        <a className={cx("group/logo flex items-center gap-2.5 text-body font-medium tracking-[-0.02em] whitespace-nowrap text-midnight no-underline tactil:min-h-11 max-sm:mr-auto max-sm:min-w-0 max-sm:flex-[0_1_auto] max-sm:gap-2 max-xs:text-[0.9375rem]")}
          href="#inicio" aria-label={t("logo.aria")} onClick={alLogo}>
          <I.LogoMarca className={cx("transition-transform duration-600 ease-brand group-hover/logo:-rotate-90 max-xs:size-[26px]", recargando && "animate-gira")} />
          <span className="max-sm:truncate max-xxs:sr-only">{t("brand")}</span>
        </a>
        <Buscador />
        <nav className="ml-auto flex gap-2 max-tab:hidden" aria-label={t("nav.aria")}>
          {[
            { href: "#catalogo", txt: t("nav.trending"), trend: true },
            { href: "#destacadas", txt: t("nav.top") },
            { href: "#catalogo", txt: t("nav.deals") },
            { href: "#como-elegimos", txt: t("nav.how") }
          ].map((a) => (
            <a key={a.txt} href={a.href} aria-current={a.trend && orden === "tendencias" ? "true" : undefined}
              onClick={a.trend ? () => cambiarFiltros({ orden: "tendencias" }) : undefined}
              className={cx("rounded-box px-2.5 py-2 text-small font-normal whitespace-nowrap no-underline transition-[background-color,color] duration-200 hover:bg-mist hover:text-indigo tactil:inline-flex tactil:min-h-11 tactil:items-center",
                a.trend && "inline-flex items-center gap-1.5 aria-[current]:bg-wash aria-[current]:text-indigo [&_svg]:text-indigo")}>
              {a.trend ? <><span>{a.txt}</span><I.Tendencia size={16} sw={2} /></> : a.txt}
            </a>
          ))}
        </nav>
        <div className="-mr-4 flex flex-none rounded-box border border-frost p-0.5 max-tab:ml-auto max-sm:mx-0 max-xs:border-0 max-xs:p-0" role="group" aria-label={t("lang.aria")}>
          {(["es", "en"] as Idioma[]).map((l) => (
            <button key={l} type="button" lang={l} aria-label={l === "es" ? "Español" : "English"} aria-pressed={i.lang === l} onClick={() => cambiarIdioma(l)}
              className="h-8 min-w-[38px] rounded-[3px] border-0 bg-transparent px-2 text-caption font-normal tracking-[0.04em] text-slate transition-[background-color,color] duration-200 hover:text-midnight aria-pressed:bg-wash aria-pressed:text-indigo tactil:min-h-11 tactil:min-w-11 max-xs:size-10 max-xs:min-h-10 max-xs:min-w-10 max-xs:rounded-box max-xs:border max-xs:border-frost max-xs:text-small max-xs:aria-pressed:hidden">
              {l.toUpperCase()}
            </button>
          ))}
        </div>
        <Campana />
        <Tema />
        <Cuenta />
      </div>
    </header>
  );
}

/* Buscador: busca al escribir y, al dejar de escribir un momento, la página baja sola hasta los resultados */
function Buscador() {
  const { t } = useI18n();
  const q = useApp((s) => s.filtros.q);
  const [texto, setTexto] = useState("");
  const t1 = useRef<ReturnType<typeof setTimeout>>(undefined), t2 = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Si la búsqueda cambia desde fuera (borrar filtros, quitar búsqueda), el campo se pone al día
  useEffect(() => { if (texto.trim() !== q) { setTexto(q); clearTimeout(t1.current); clearTimeout(t2.current); } }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  function enviar(e: FormEvent) {
    e.preventDefault(); clearTimeout(t1.current); clearTimeout(t2.current);
    if (esMovil()) cerrarTeclado(); // primero el teclado, para que se cierre aunque falle algo al pintar
    cambiarFiltros({ q: texto.trim() });
    if (esMovil()) requestAnimationFrame(() => requestAnimationFrame(() => bajarA(destinoBusqueda())));
    else requestAnimationFrame(irAlCatalogo);
  }
  return (
    <form className="flex min-w-0 max-w-[520px] flex-[1_1_360px] items-center rounded-box border border-frost bg-paper py-[3px] pr-[3px] pl-3.5 text-slate transition-[border-color] duration-200 focus-within:border-lavender focus-within:text-midnight max-sm:order-3 max-sm:max-w-none max-sm:basis-full"
      id="buscador" role="search" onSubmit={enviar}>
      <I.Lupa />
      <input className="min-w-0 flex-1 border-0 bg-transparent px-2.5 py-[9px] text-small font-normal focus:outline-none tactil:min-h-11"
        id="q" type="search" enterKeyHint="search" placeholder={t("search.placeholder")} aria-label={t("search.aria")} autoComplete="off" value={texto}
        onChange={(e) => {
          const v = e.target.value; setTexto(v);
          clearTimeout(t1.current); clearTimeout(t2.current);
          t1.current = setTimeout(() => cambiarFiltros({ q: v.trim() }), 120);
          t2.current = setTimeout(() => { if (v.trim()) irAResultados(); }, 600);
        }}
        // La lupa del teclado envía «Enter»: se busca aquí mismo (el envío cierra el teclado), sin depender de cómo cada teclado envía el formulario
        onKeyDown={(e) => {
          if (e.key !== "Enter" || e.nativeEvent.isComposing || !esMovil()) return;
          e.preventDefault();
          const f = e.currentTarget.form; if (f?.requestSubmit) f.requestSubmit(); else f?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
        }} />
      <button className="rounded-[3px] border-0 bg-indigo px-4 py-[9px] text-small font-normal text-white transition-[background-color] duration-200 hover:bg-accent-hi tactil:min-h-11" type="submit">{t("search.btn")}</button>
    </form>
  );
}

// Campana: cuántos productos seguidos han bajado de precio
function Campana() {
  const { t } = useI18n();
  const montado = useApp((s) => s.montado);
  const seguidos = useApp((s) => s.seguidos), objetivos = useApp((s) => s.objetivos);
  const n = montado ? bajadas(seguidos, objetivos).length : 0;
  const lab = n ? t("alert.bellN", { n }) : t("alert.bell");
  return (
    <button className={cx(ICON_BTN, "relative -mr-4 max-sm:mr-0")} type="button" aria-label={lab} title={lab} onClick={() => abrirAlertas()}>
      <I.Campana sw={1.5} />
      {n > 0 && <span className="absolute -top-1.5 -right-1.5 h-[18px] min-w-[18px] rounded-full bg-indigo px-1 text-center text-[11px] leading-[18px] font-medium text-white tabular-nums">{n > 9 ? "9+" : n}</span>}
    </button>
  );
}

/* Modo claro / oscuro: claro por defecto; la elección se guarda en este navegador */
function Tema() {
  const { t } = useI18n();
  const [oscuro, setOscuro] = useState(false);
  useEffect(() => { setOscuro(document.documentElement.dataset.theme === "dark"); }, []);
  useEffect(() => {
    if (oscuro) document.documentElement.dataset.theme = "dark"; else delete document.documentElement.dataset.theme;
    const meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.setAttribute("content", oscuro ? "#0a1628" : "#ffffff");
  }, [oscuro]);
  return (
    <button className={cx(ICON_BTN, "-mr-4 max-sm:mr-0")} id="tema" type="button" aria-pressed={oscuro} aria-label={t("theme.aria")} title={t("theme.aria")}
      onClick={() => { const v = !oscuro; setOscuro(v); try { localStorage.setItem("radar-tema", v ? "oscuro" : "claro"); } catch {} }}>
      {oscuro ? <I.Sol /> : <I.Luna />}
    </button>
  );
}

/* Cuenta: sin sesión abre «Entrar»; con sesión, un menú con favoritos, alertas, ajustes y salir */
function Cuenta() {
  const { t } = useI18n();
  const montado = useApp((s) => s.montado);
  const usuario = useApp((s) => s.usuario), perfil = useApp((s) => s.perfil), nFav = useApp((s) => s.favoritos.size);
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
  if (!montado || !sb()) return null;

  const nombre = nombreUsuario(usuario, perfil);
  const lab = usuario ? `${t("acct.menu")}: ${nombre}` : t("acct.btn");
  const elegir = (fn: () => void) => () => { setAbierto(false); fn(); };
  const opcion = "flex w-full items-center gap-2.5 rounded-box border-0 bg-transparent px-3 py-[9px] text-left text-small font-normal text-midnight hover:bg-mist hover:text-indigo focus-visible:bg-mist focus-visible:text-indigo focus-visible:outline-none tactil:min-h-11 [&_svg]:text-indigo";
  return (
    <div className="relative flex-none" ref={caja} onKeyDown={(e) => { if (e.key === "Escape") { setAbierto(false); btn.current?.focus(); } }}>
      <button ref={btn} className={cx(ICON_BTN, usuario && "border-lilac bg-wash p-0.5 text-indigo")} type="button" aria-haspopup="true" aria-expanded={abierto} aria-label={lab} title={lab}
        onClick={() => (usuario ? setAbierto((v) => !v) : abrirAcceso("entrar"))}>
        {usuario ? <MiAvatar className="size-full" /> : <I.Usuario />}
      </button>
      {usuario && abierto && (
        <div ref={pop} className="absolute top-[calc(100%+6px)] right-0 z-40 flex min-w-60 flex-col rounded-box border border-lavender bg-paper p-2">
          <div className="mb-1 flex items-center gap-3 border-b border-frost px-3 pt-1.5 pb-3">
            <MiAvatar className="size-10" />
            <p className="flex min-w-0 flex-col gap-0.5"><b className="text-small font-medium text-midnight">{nombre}</b><span className="text-caption text-slate [overflow-wrap:anywhere]">{usuario.email || ""}</span></p>
          </div>
          <button className={opcion} type="button" onClick={elegir(() => { cambiarFiltros({ favoritos: true, q: "", categoria: "Todas", tiendas: [] }); requestAnimationFrame(irAlCatalogo); })}><I.Corazon />{t("acct.favsN", { n: nFav })}</button>
          <button className={opcion} type="button" onClick={elegir(() => abrirAlertas())}><I.Campana />{t("acct.alerts")}</button>
          <button className={opcion} type="button" onClick={elegir(() => abrirAcceso("ajustes"))}><I.Engranaje />{t("acct.settings")}</button>
          <button className={cx(opcion, "mt-1 rounded-t-none border-t border-frost text-steel")} type="button" onClick={elegir(salir)}>{t("acct.logout")}</button>
        </div>
      )}
    </div>
  );
}
