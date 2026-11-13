/* Comparador: barra fija abajo con las miniaturas elegidas y ventana con la tabla lado a lado */
import { useEffect, type ReactNode } from "react";
import { catalogo, money } from "@/lib/catalogo";
import { MAX_COMPARAR } from "@/lib/config";
import { abrirComparador, alternarComparar, useApp, useI18n, vaciarComparar } from "@/lib/store";
import type { Producto } from "@/lib/tipos";
import { Dialogo } from "./Dialogo";
import { EnlaceCompra } from "./piezas";
import { BTN, LINKBTN, cx } from "./ui";

export function BarraComparar() {
  const i = useI18n(), { t } = i;
  const ids = useApp((s) => s.comparar);
  const n = ids.length;
  // El pie deja sitio a la barra para que no tape lo último de la página
  useEffect(() => { document.body.classList.toggle("pb-[84px]", n > 0); document.body.classList.toggle("max-sm:pb-[150px]", n > 0); }, [n]);
  if (!n) return null;
  const { porId } = catalogo();
  const casilla = "size-[52px] overflow-hidden rounded-box border border-frost bg-mist max-sm:size-[46px]";
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 animate-subir border-t border-lavender bg-paper pb-[env(safe-area-inset-bottom,0px)] text-midnight" id="compare-bar">
      <div className="wrap flex min-h-[76px] items-center gap-4 max-sm:flex-wrap max-sm:gap-x-4 max-sm:gap-y-2.5 max-sm:pt-4 max-sm:pb-3">
        <div className="flex min-w-0 flex-1 items-center gap-2.5 max-sm:flex-[1_1_100%] max-sm:flex-wrap max-sm:gap-3.5">
          {Array.from({ length: MAX_COMPARAR }, (_, k) => {
            const p = ids[k] ? porId.get(ids[k]) : undefined;
            return (
              <div key={k} className="relative">
                <div className={casilla}>{p && <img className="size-full object-cover" src={p.imagenes[0]} alt={i.tit(p)} />}</div>
                {p && <button className="absolute -top-2 -right-2 size-[22px] rounded-box border border-frost bg-paper text-sm leading-none text-midnight hover:border-lavender hover:text-indigo tactil:-top-3 tactil:-right-3 tactil:size-8 max-sm:-top-[9px] max-sm:-right-[9px] max-sm:size-[26px] max-sm:text-[13px]"
                  type="button" aria-label={t("cmp.remove", { t: i.tit(p) })} onClick={() => alternarComparar(p.id)}>×</button>}
              </div>
            );
          })}
          {n < 2 ? <span className="ml-2 text-small text-steel max-sm:hidden">{t("cmp.addAnother")}</span>
            : n >= MAX_COMPARAR ? <span className="ml-2 text-small text-steel max-sm:ml-0 max-sm:basis-full max-sm:text-caption">{t("cmp.full")}</span> : null}
        </div>
        <button className={cx(BTN, "max-sm:min-h-11 max-sm:flex-1 max-sm:py-2.5")} id="compare-open" type="button" disabled={n < 2} onClick={() => abrirComparador()}>{t("cmp.openN", { n })}</button>
        <button className={cx(LINKBTN, "max-sm:flex-none")} type="button" onClick={vaciarComparar}>{t("cmp.clear")}</button>
      </div>
    </div>
  );
}

export function VentanaComparador() {
  const i = useI18n(), { t } = i;
  const abierto = useApp((s) => s.comparadorAbierto), ids = useApp((s) => s.comparar);
  const { porId } = catalogo();
  const ps = ids.map((id) => porId.get(id)).filter(Boolean) as Producto[];
  const filas: [string, (p: Producto) => ReactNode, ((p: Producto) => number) | null][] = [
    [t("cmp.price"), (p) => money.format(p.precio), (p) => -p.precio],
    [t("cmp.usual"), (p) => (p.precioAnterior ? money.format(p.precioAnterior) : "—"), null],
    [t("cmp.discount"), (p) => (p.descuento ? `-${p.descuento}%` : "—"), (p) => p.descuento],
    [t("cmp.saving"), (p) => (p.ahorro ? money.format(p.ahorro) : "—"), (p) => p.ahorro],
    [t("cmp.rating"), (p) => (p.valoracion ? t("cmp.ratingV", { r: p.valoracion.toFixed(1) }) : "—"), (p) => p.valoracion || 0],
    [t("cmp.reviews"), (p) => (p.resenas ? p.resenas.toLocaleString("en-US") : "—"), (p) => p.resenas || 0],
    [t("cmp.store"), (p) => p.tienda, null],
    [t("cmp.category"), (p) => i.cat(p.categoria), null],
    [t("cmp.asOf"), (p) => i.fecha(p.actualizado), null]
  ];
  const celda = "border-b border-frost p-3 text-left align-top";
  return (
    <Dialogo abierto={abierto && ps.length > 0} onCerrar={() => abrirComparador(false)} etiqueta={t("cmp.aria")}>
      <div className="p-10 max-sm:p-5">
        <h2 className="mb-6 text-head">{t("cmp.title")}</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse text-small font-normal">
            <thead><tr><th className={celda}></th>{ps.map((p) => (
              <th key={p.id} scope="col" className={cx(celda, "font-normal")}>
                <img className="mb-2 aspect-square w-[120px] rounded-box border border-frost object-cover" src={p.imagenes[0]} alt="" /><span>{i.tit(p)}</span>
              </th>))}</tr></thead>
            <tbody>
              {filas.map(([nombre, ver, puntuar]) => {
                const mejor = puntuar ? Math.max(...ps.map(puntuar)) : null;
                return (
                  <tr key={nombre}><th scope="row" className={cx(celda, "font-normal whitespace-nowrap text-slate")}>{nombre}</th>
                    {ps.map((p) => <td key={p.id} className={cx(celda, puntuar && puntuar(p) === mejor && "bg-wash font-medium text-indigo")}>{ver(p)}</td>)}</tr>
                );
              })}
              <tr><th scope="row" className={celda}></th>{ps.map((p) => <td key={p.id} className={celda}><EnlaceCompra p={p} className="whitespace-nowrap">{t("card.seeAt", { s: p.tienda })}</EnlaceCompra></td>)}</tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-caption font-normal text-slate">{t("cmp.note")}</p>
      </div>
    </Dialogo>
  );
}
