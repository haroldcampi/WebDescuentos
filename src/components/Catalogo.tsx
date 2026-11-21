/* Catálogo: título y recuento, panel de alertas (vista Alertas), rejilla de ofertas y estado vacío.
   Los filtros (tiendas, mínimo 90 días, categorías y orden) están en la franja de la cabecera. */
import { ArrowLeft, BellRing, SearchX, Trash2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { catalogo, filtrar, money, precioMaximo } from "@/lib/catalogo";
import { alternarSeguir, bajadas } from "@/lib/cuenta";
import { abrirAcceso, abrirFicha, cambiarFiltros, irAVista, limpiarFiltros, useApp, useI18n, verMas } from "@/lib/store";
import { Anuncio } from "./Anuncio";
import { GestionAlertas } from "./GestionAlertas";
import { Tarjeta } from "./Tarjeta";
import { BTN, GHOST, LINKBTN, cx } from "./ui";

export function Catalogo() {
  const i = useI18n(), { t } = i;
  const ahora = useApp((s) => s.ahora);
  const f = useApp((s) => s.filtros), visibles = useApp((s) => s.visibles);
  const favoritos = useApp((s) => s.favoritos), votos = useApp((s) => s.votos);

  const lista = useMemo(() => filtrar(f, favoritos, votos),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ahora, f, favoritos, votos]);
  const tope = Math.min(Math.max(visibles, 24), Math.max(lista.length, 24));
  const quedan = lista.length - tope;

  // «Ver más»: las tarjetas nuevas entran una tras otra (desde la primera nueva). Al filtrar, sin animación.
  const topeAntes = useRef(tope);
  const desde = tope > topeAntes.current ? topeAntes.current : Infinity;
  useEffect(() => { topeAntes.current = tope; }, [tope]);

  // «Ver más»: el foco pasa a la primera tarjeta nueva
  const rejilla = useRef<HTMLElement>(null), focoEn = useRef<number | null>(null);
  useEffect(() => {
    if (focoEn.current === null) return;
    rejilla.current?.querySelectorAll("[data-tarjeta]")[focoEn.current]?.querySelector("button")?.focus({ preventScroll: true });
    focoEn.current = null;
  }, [tope]);

  if (f.vista === "alertas") return <GestionAlertas />;

  const titulo = f.vista === "favoritos" ? t("d.titleFavs")
    : f.q ? t("d.titleSearch", { q: f.q }) : f.min90 ? t("d.titleMin90") : t("d.title");

  return (
    <main id="inicio" className="wrap flex-1 py-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <h1 id="titulo" className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">{titulo}</h1>
          <span className="rounded-full bg-slate-200/80 px-2.5 py-0.5 text-xs font-semibold text-slate-600 tabular-nums">
            {t(lista.length === 1 ? "d.count1" : "d.countN", { n: lista.length })}
          </span>
        </div>
        {f.vista !== "catalogo" && (
          <button type="button" onClick={() => irAVista("catalogo")}
            className="flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-acento hover:text-indigo-800 dark:hover:text-indigo-800 tactil:min-h-11">
            <ArrowLeft className="size-3.5" aria-hidden="true" />{t("d.back")}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)] xl:gap-5">
        <aside className="flex flex-col gap-3 lg:sticky lg:top-36" aria-label={t("side.aria")}>
          <FiltroPrecio />
          <button className={cx(LINKBTN, "self-start")} type="button" onClick={limpiarFiltros}>{t("side.clear")}</button>
        </aside>

        <div className="min-w-0">

      <Anuncio sitio="superior" margen="mb-5" alto="min-h-24" />

      {lista.length ? (
        <section ref={rejilla} className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 xl:gap-3" aria-labelledby="titulo">
          {lista.slice(0, tope).map((p, n) => <Tarjeta key={p.id} p={p} prioridad={n === 0 ? 0 : n < 5 ? 1 : undefined} entrada={n >= desde ? n - desde : undefined} />)}
        </section>
      ) : f.vista === "favoritos" ? (
        <Vacio titulo={t("d.favsEmptyTitle")} texto={t("d.favsEmptyText")} boton={t("d.back")} onClick={() => irAVista("catalogo")} />
      ) : (
        <Vacio titulo={t("d.emptyTitle")} texto={t("d.emptyText")} boton={t("d.emptyBtn")} onClick={limpiarFiltros} />
      )}

      {quedan > 0 && (
        <button className={cx(GHOST, "mt-8 flex w-full")} type="button" onClick={() => { focoEn.current = tope; verMas(); }}>
          {t("results.more", { n: Math.min(24, quedan), total: quedan })}
        </button>
      )}

      <Anuncio sitio="inferior" margen="mt-8" alto="min-h-24" />
        </div>
      </div>
    </main>
  );
}

function Vacio({ titulo, texto, boton, onClick }: { titulo: string; texto: string; boton: string; onClick: () => void }) {
  return (
    <div className="my-4 flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-card px-4 py-16 text-center">
      <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><SearchX className="size-7" aria-hidden="true" /></div>
      <h2 className="text-base font-bold text-slate-900">{titulo}</h2>
      <p className="mt-1 max-w-md text-sm text-slate-500">{texto}</p>
      <button type="button" onClick={onClick} className={cx(BTN, "mt-4 px-4 py-2")}>{boton}</button>
    </div>
  );
}

/* Precio: barra del máximo y, a mano, un rango «Desde» – «Hasta» en dólares (vacío = sin límite) */
function FiltroPrecio() {
  const { t } = useI18n();
  const min = useApp((s) => s.filtros.min), max = useApp((s) => s.filtros.max);
  const tope = precioMaximo();
  const leer = (v: string) => { const n = parseFloat(v.replace(",", ".")); return n > 0 ? n : 0; };
  const [txtMin, setTxtMin] = useState(min ? String(min) : ""), [txtMax, setTxtMax] = useState(max ? String(max) : "");
  const espera = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Si los filtros cambian desde fuera (borrar filtros), los campos se ponen al día
  useEffect(() => { if (leer(txtMin) !== min) setTxtMin(min ? String(min) : ""); }, [min]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (leer(txtMax) !== max) setTxtMax(max ? String(max) : ""); }, [max]); // eslint-disable-line react-hooks/exhaustive-deps
  function escribir(a: string, b: string) {
    setTxtMin(a); setTxtMax(b); clearTimeout(espera.current);
    espera.current = setTimeout(() => cambiarFiltros({ min: leer(a), max: leer(b) }), 250);
  }
  const malo = !!(min && max && min > max);
  const campo = "w-full min-w-0 rounded-xl border border-slate-200 bg-card px-2.5 py-2.5 text-sm text-slate-900 tabular-nums outline-none transition-[border-color,box-shadow] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 aria-invalid:border-rose-400 tactil:min-h-11";
  const texto = min && max ? t("range.fromTo", { a: money.format(min), b: money.format(max) }) : max ? t("range.upTo", { b: money.format(max) }) : min ? t("range.fromOnly", { a: money.format(min) }) : t("range.any");
  return (
    <section className="rounded-2xl border border-slate-200 bg-card p-5 shadow-2xs" aria-labelledby="precio-titulo">
      <h2 id="precio-titulo" className="mb-3.5 text-xs font-semibold tracking-wider text-slate-500 uppercase">{t("side.maxPrice")}</h2>
      <input className="h-2 w-full cursor-pointer accent-indigo-600" type="range" min={5} step={5} max={tope} value={max || tope} aria-label={t("side.maxAria")} aria-valuetext={texto}
        onChange={(e) => { const v = +e.target.value, m = v >= tope ? 0 : v; clearTimeout(espera.current); setTxtMax(m ? String(m) : ""); cambiarFiltros({ max: m }); }} />
      <p className="mt-3 text-base font-semibold text-slate-900 tabular-nums" aria-live="polite">{texto}</p>
      <p className="mt-4 text-sm text-slate-500" id="rango-lab">{t("range.lab")}</p>
      <div className="mt-2 grid grid-cols-2 gap-2.5" role="group" aria-labelledby="rango-lab">
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600"><span>{t("range.from")}</span>
          <input className={campo} type="number" inputMode="decimal" min={0} step={1} placeholder="0" value={txtMin} aria-invalid={malo} onChange={(e) => escribir(e.target.value, txtMax)} /></label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600"><span>{t("range.to")}</span>
          <input className={campo} type="number" inputMode="decimal" min={0} step={1} placeholder={t("range.noLimit")} value={txtMax} aria-invalid={malo} onChange={(e) => escribir(txtMin, e.target.value)} /></label>
      </div>
      {malo && <p className="mt-2 text-xs font-medium text-rose-600" role="alert">{t("range.error")}</p>}
    </section>
  );
}
