/* Catálogo: título y recuento, menús de orden y agrupado, categorías, filtros (tiendas y precio) y rejilla por tandas */
import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { GRUPOS, ORDENES, catalogo, categoriasOrdenadas, claveGrupo, contar, filtrar, money, nombreGrupo, precioMaximo } from "@/lib/catalogo";
import { bajarA, destinoBusqueda } from "@/lib/scroll";
import { cambiarFiltros, limpiarFiltros, useApp, useI18n, verMas } from "@/lib/store";
import type { Filtros } from "@/lib/tipos";
import { Anuncio } from "./Anuncio";
import * as I from "./iconos";
import { Menu } from "./Menu";
import { ConValor, HUECO, MarcaTienda } from "./piezas";
import { Tarjeta } from "./Tarjeta";
import { CHIP, EYEBROW, GHOST, LABEL, LINKBTN, cx } from "./ui";

const PANEL = "mb-2 rounded-box border border-frost bg-paper p-5";
const leer = (v: string) => { const n = parseFloat(String(v).replace(",", ".")); return n > 0 ? n : 0; };

export function Catalogo() {
  const i = useI18n(), { t } = i;
  const ahora = useApp((s) => s.ahora);
  const f = useApp((s) => s.filtros), visibles = useApp((s) => s.visibles);
  const favoritos = useApp((s) => s.favoritos), votos = useApp((s) => s.votos);
  const [sideAbierto, setSideAbierto] = useState(false);

  const { lista, cuentaGrupos } = useMemo(
    () => filtrar(f, favoritos, votos, i),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ahora, f, favoritos, votos, i.lang]
  );
  const tope = Math.min(Math.max(visibles, 24), Math.max(lista.length, 24));
  const mostrados = lista.slice(0, tope);
  const quedan = lista.length - tope;

  // «Ver más»: el foco pasa a la primera tarjeta nueva
  const rejilla = useRef<HTMLDivElement>(null), focoEn = useRef<number | null>(null);
  useEffect(() => {
    if (focoEn.current === null) return;
    rejilla.current?.querySelectorAll("[data-tarjeta]")[focoEn.current]?.querySelector("button")?.focus({ preventScroll: true });
    focoEn.current = null;
  }, [tope]);

  let titulo = t("cat.allDeals");
  if (f.favoritos) titulo = t("fav.title");
  else if (f.q) titulo = t("results.for", { q: f.q });
  else if (f.categoria !== "Todas") titulo = i.cat(f.categoria);
  else if (f.tiendas.length === 1) titulo = t("results.store", { s: f.tiendas[0] });
  // En móvil los filtros están plegados: el botón dice cuántos hay activos
  const activos = f.tiendas.length + (f.categoria !== "Todas" ? 1 : 0) + (f.min || f.max ? 1 : 0);
  const nt = new Set(lista.map((p) => p.tienda)).size;

  // Rejilla con un encabezado al empezar cada grupo
  const piezas: ReactNode[] = [];
  mostrados.forEach((p, n) => {
    if (f.grupo !== "ninguno") {
      const g = claveGrupo(f.grupo, p);
      if (n === 0 || claveGrupo(f.grupo, mostrados[n - 1]) !== g) piezas.push(
        <h3 key={"g-" + g} className="col-span-full flex items-center gap-2.5 border-b border-frost pb-3 text-sub not-first:mt-6 max-sm:text-lead">
          {f.grupo === "categoria" ? <I.IcoCategoria c={g} size={20} className="text-indigo" /> : f.grupo === "tienda" ? <MarcaTienda t={g} className="size-2.5" /> : null}
          <span>{nombreGrupo(f.grupo, g, i)}</span><span className="text-small font-normal text-slate tabular-nums">{cuentaGrupos.get(g) || ""}</span>
        </h3>
      );
    }
    piezas.push(<Tarjeta key={p.id} p={p} />);
  });

  const vacio = f.favoritos
    ? <div className="col-span-full rounded-box border border-frost bg-mist p-8">{t("fav.empty")} <button className={LINKBTN} type="button" onClick={limpiarFiltros}>{t("results.emptyBtn")}</button>.</div>
    : <div className="col-span-full rounded-box border border-frost bg-mist p-8">
        <strong className="font-medium">{f.q ? t("results.emptyQueryTitle", { q: f.q }) : t("results.emptyTitle")}</strong><br />
        {t(f.q ? "results.emptyQueryText" : "results.emptyText")} <button className={LINKBTN} type="button" onClick={limpiarFiltros}>{t(f.q ? "results.emptyQueryBtn" : "results.emptyBtn")}</button>.
      </div>;

  return (
    <section className="wrap mt-(--space-pause)" id="catalogo" aria-labelledby="titulo">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className={EYEBROW}>{t("deals.eyebrow")}</p>
          <h2 id="titulo" className="text-head">{titulo}</h2>
          <p className="mt-3 text-small font-normal text-slate">
            {`${t(lista.length === 1 ? "results.products1" : "results.productsN", { n: lista.length })} · ${t(nt === 1 ? "results.stores1" : "results.storesN", { n: nt })}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 max-sm:w-full max-sm:gap-x-2 max-sm:gap-y-1">
          <button className="hidden cursor-pointer rounded-box border border-frost bg-paper px-3.5 py-2.5 text-small font-normal text-indigo transition-[border-color] duration-200 hover:border-lavender aria-expanded:border-lavender aria-expanded:bg-wash max-tab:inline-block tactil:min-h-11"
            id="toggle-filtros" type="button" aria-controls="side" aria-expanded={sideAbierto} onClick={() => setSideAbierto((v) => !v)}>
            {activos ? t("tools.filtersN", { n: activos }) : t("tools.filters")}
          </button>
          <Menu<Filtros["grupo"]> id="menu-grupo" etiqueta={t("group.label")} titulo={t("group.menu")} icono={<I.Rejilla />} valor={f.grupo} opciones={GRUPOS}
            nombre={(v) => t("group." + v)} onCambio={(v) => cambiarFiltros({ grupo: v })} popClassName="max-sm:right-auto max-sm:left-0 max-sm:min-w-[220px]" />
          <Menu<Filtros["orden"]> id="menu-orden" etiqueta={t("sort.label")} titulo={t("sort.menu")} icono={<I.Ordenar />} valor={f.orden} opciones={ORDENES}
            nombre={(v) => t("sort." + v)} onCambio={(v) => cambiarFiltros({ orden: v })} popClassName="max-sm:min-w-[220px]"
            className="ml-3 border-l border-frost pl-4 max-sm:ml-0 max-sm:pl-2.5" />
        </div>
      </div>

      <nav className="mt-8 flex flex-wrap gap-2" id="cats" aria-label={t("cat.aria")}>
        {[["Todas", catalogo().lista.length] as [string, number], ...categoriasOrdenadas(i)].map(([c, n]) => (
          <button key={c} className={cx(CHIP, "group")} type="button" aria-pressed={c === f.categoria} onClick={() => cambiarFiltros({ categoria: c })}>
            <I.IcoCategoria c={c} />{i.cat(c)}<span className="text-slate tabular-nums group-aria-pressed:text-indigo">{n}</span>
          </button>
        ))}
      </nav>

      <div className="mt-8 grid grid-cols-[240px_1fr] items-start gap-10 max-tab:grid-cols-1">
        <aside className={cx("sticky top-[calc(var(--head-h)+16px)] max-tab:static", sideAbierto ? "max-tab:grid max-tab:grid-cols-2 max-tab:gap-2 max-sm:grid-cols-1" : "max-tab:hidden")}
          id="side" aria-label={t("side.aria")}>
          <section className={cx(PANEL, "max-tab:m-0")}>
            <h3 className={cx(LABEL, "mb-3")}>{t("side.stores")}</h3>
            <div>
              {contar("tienda").map(([tienda, n]) => (
                <label key={tienda} className="flex cursor-pointer items-center gap-2.5 py-1.5 text-small font-normal tactil:min-h-11">
                  <input className="m-0 size-4 accent-indigo tactil:size-5" type="checkbox" value={tienda} checked={f.tiendas.includes(tienda)}
                    onChange={(e) => cambiarFiltros({ tiendas: e.target.checked ? [...f.tiendas, tienda] : f.tiendas.filter((x) => x !== tienda) })} />
                  <span className="inline-flex items-center gap-2"><MarcaTienda t={tienda} />{tienda}</span>
                  <span className="ml-auto text-slate tabular-nums">{n}</span>
                </label>
              ))}
            </div>
          </section>
          <FiltroPrecio className={cx(PANEL, "max-tab:m-0")} />
          <button className={cx(LINKBTN, "mt-3")} type="button" onClick={limpiarFiltros}>{t("side.clear")}</button>
          <Anuncio sitio="lateral" texto={t("ad.side")} margen={cx("mt-6", sideAbierto && "max-tab:hidden")} className="min-h-[250px]" />
        </aside>

        <div id="resultados">
          {f.q && (
            <div className="mb-8 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-box bg-wash p-6">
              <p><ConValor texto={t("ew.title", { q: HUECO })} valor={<strong className="font-medium">“{f.q}”</strong>} /></p>
              <button className="inline-flex min-h-10 items-center gap-1.5 rounded-box border border-lilac bg-paper px-3.5 text-small transition-[border-color,color] duration-200 hover:border-indigo hover:text-indigo tactil:min-h-11" type="button"
                onClick={() => { cambiarFiltros({ q: "" }); requestAnimationFrame(() => bajarA(destinoBusqueda())); }}>
                <span className="text-[1.25em] leading-none" aria-hidden="true">×</span> {t("search.clear")}
              </button>
            </div>
          )}
          <div ref={rejilla} className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-x-6 gap-y-12 max-sm:grid-cols-2 max-sm:gap-x-3 max-sm:gap-y-9">
            {piezas.length ? piezas : vacio}
          </div>
          {quedan > 0 && (
            <button className={cx(GHOST, "mt-12 flex w-full")} type="button" onClick={() => { focoEn.current = tope; verMas(); }}>
              {t("results.more", { n: Math.min(24, quedan), total: quedan })}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

/* Precio: barra del máximo y, a mano, un rango «Desde» – «Hasta» en dólares (vacío = sin límite) */
function FiltroPrecio({ className }: { className?: string }) {
  const { t } = useI18n();
  useApp((s) => s.ahora);
  const min = useApp((s) => s.filtros.min), max = useApp((s) => s.filtros.max);
  const tope = precioMaximo();
  const [txtMin, setTxtMin] = useState(""), [txtMax, setTxtMax] = useState("");
  const espera = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Si los filtros cambian desde fuera (p. ej. «Borrar filtros»), los campos se ponen al día
  useEffect(() => { if (leer(txtMin) !== min) setTxtMin(min ? String(min) : ""); }, [min]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (leer(txtMax) !== max) setTxtMax(max ? String(max) : ""); }, [max]); // eslint-disable-line react-hooks/exhaustive-deps
  const escribir = (a: string, b: string) => {
    setTxtMin(a); setTxtMax(b);
    clearTimeout(espera.current);
    espera.current = setTimeout(() => cambiarFiltros({ min: leer(a), max: leer(b) }), 200);
  };
  const malo = !!(min && max && min > max);
  const campo = "w-full min-w-0 rounded-box border border-frost bg-paper px-2.5 py-[9px] text-small font-normal text-midnight focus:border-indigo focus:outline-none aria-invalid:border-error tactil:min-h-11";
  const texto = min && max ? t("range.fromTo", { a: money.format(min), b: money.format(max) }) : max ? t("range.upTo", { b: money.format(max) }) : min ? t("range.fromOnly", { a: money.format(min) }) : t("range.any");
  return (
    <section className={className}>
      <h3 className={cx(LABEL, "mb-3")}>{t("side.maxPrice")}</h3>
      <input className="w-full accent-indigo" id="max" type="range" min={5} step={5} max={tope} value={max || tope} aria-label={t("side.maxAria")}
        onChange={(e) => { const v = +e.target.value, m = v >= tope ? 0 : v; clearTimeout(espera.current); setTxtMax(m ? String(m) : ""); cambiarFiltros({ max: m }); }} />
      <span className="mt-2 block text-small font-normal tabular-nums">{texto}</span>
      <p className="mt-[18px] text-small text-slate" id="rango-lab">{t("range.lab")}</p>
      <div className="mt-2 grid grid-cols-2 gap-2" role="group" aria-labelledby="rango-lab">
        <label className="flex flex-col gap-1 text-caption font-normal text-steel"><span>{t("range.from")}</span>
          <input className={campo} id="p-min" type="number" inputMode="decimal" min={0} step={1} placeholder="0" value={txtMin} aria-invalid={malo} onChange={(e) => escribir(e.target.value, txtMax)} /></label>
        <label className="flex flex-col gap-1 text-caption font-normal text-steel"><span>{t("range.to")}</span>
          <input className={campo} id="p-max" type="number" inputMode="decimal" min={0} step={1} placeholder={t("range.noLimit")} value={txtMax} aria-invalid={malo} onChange={(e) => escribir(txtMin, e.target.value)} /></label>
      </div>
      {malo && <p className="mt-2 text-small text-error" role="alert">{t("range.error")}</p>}
    </section>
  );
}
