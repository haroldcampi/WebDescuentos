/* Comparador: barra fija abajo con las miniaturas elegidas y ventana con la tabla lado a lado */
import { X } from "lucide-react";
import Image from "next/image";
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
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 animate-subir border-t border-slate-200 bg-card/95 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-8px_24px_-12px_rgb(15_23_42/0.25)] backdrop-blur-md" id="compare-bar">
      <div className="wrap flex min-h-[76px] items-center gap-4 max-sm:flex-wrap max-sm:gap-x-4 max-sm:gap-y-2.5 max-sm:pt-4 max-sm:pb-3">
        <div className="flex min-w-0 flex-1 items-center gap-2.5 max-sm:flex-[1_1_100%] max-sm:flex-wrap max-sm:gap-3.5">
          {Array.from({ length: MAX_COMPARAR }, (_, k) => {
            const p = ids[k] ? porId.get(ids[k]) : undefined;
            return (
              <div key={k} className="relative">
                <div className={cx("relative size-[52px] overflow-hidden rounded-xl border bg-slate-50 max-sm:size-[46px]", p ? "border-slate-200" : "border-dashed border-slate-300")}>
                  {p && <Image className="object-cover" src={p.imagenes[0]} alt={i.tit(p)} fill sizes="52px" />}
                </div>
                {p && <button className="absolute -top-2 -right-2 grid size-[22px] place-items-center rounded-full border border-slate-200 bg-card text-slate-600 shadow-xs hover:text-rose-600 tactil:-top-3 tactil:-right-3 tactil:size-8"
                  type="button" aria-label={t("cmp.remove", { t: i.tit(p) })} onClick={() => alternarComparar(p.id)}><X className="size-3" aria-hidden="true" /></button>}
              </div>
            );
          })}
          {n < 2 ? <span className="ml-2 text-sm text-slate-500 max-sm:hidden">{t("cmp.addAnother")}</span>
            : n >= MAX_COMPARAR ? <span className="ml-2 text-sm text-slate-500 max-sm:ml-0 max-sm:basis-full max-sm:text-xs">{t("cmp.full")}</span> : null}
        </div>
        <button className={cx(BTN, "max-sm:min-h-11 max-sm:flex-1")} id="compare-open" type="button" disabled={n < 2} onClick={() => abrirComparador()}>{t("cmp.openN", { n })}</button>
        <button className={cx(LINKBTN, "font-medium text-slate-500 max-sm:flex-none")} type="button" onClick={vaciarComparar}>{t("cmp.clear")}</button>
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
    [t("cmp.price"), (p) => (p.sinPrecio ? t("price.hidden", { s: p.tienda }) : money.format(p.precio)), (p) => (p.sinPrecio ? -Infinity : -p.precio)],
    [t("cmp.usual"), (p) => (p.precioAnterior ? money.format(p.precioAnterior) : "—"), null],
    [t("cmp.discount"), (p) => (p.descuento ? `-${p.descuento}%` : "—"), (p) => p.descuento],
    [t("cmp.saving"), (p) => (p.ahorro ? money.format(p.ahorro) : "—"), (p) => p.ahorro],
    [t("cmp.rating"), (p) => (p.valoracion ? t("cmp.ratingV", { r: p.valoracion.toFixed(1) }) : "—"), (p) => p.valoracion || 0],
    [t("cmp.reviews"), (p) => (p.resenas ? p.resenas.toLocaleString("en-US") : "—"), (p) => p.resenas || 0],
    [t("cmp.store"), (p) => p.tienda, null],
    [t("cmp.category"), (p) => i.cat(p.categoria), null],
    [t("cmp.asOf"), (p) => i.fecha(p.actualizado), null]
  ];
  const celda = "border-b border-slate-100 p-3 text-left align-top";
  return (
    <Dialogo abierto={abierto && ps.length > 0} onCerrar={() => abrirComparador(false)} etiqueta={t("cmp.aria")}>
      <div className="p-6 sm:p-8">
        <h2 className="mb-5 pr-11 text-xl font-extrabold text-slate-900">{t("cmp.title")}</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse text-sm">
            <thead><tr><th className={celda}></th>{ps.map((p) => (
              <th key={p.id} scope="col" className={cx(celda, "font-semibold text-slate-800")}>
                <Image className="mb-2 aspect-square w-[120px] rounded-xl border border-slate-200 object-cover" src={p.imagenes[0]} alt="" width={120} height={120} /><span>{i.tit(p)}</span>
              </th>))}</tr></thead>
            <tbody>
              {filas.map(([nombre, ver, puntuar]) => {
                const mejor = puntuar ? Math.max(...ps.map(puntuar)) : null;
                return (
                  <tr key={nombre}><th scope="row" className={cx(celda, "font-medium whitespace-nowrap text-slate-500")}>{nombre}</th>
                    {ps.map((p) => <td key={p.id} className={cx(celda, "text-slate-700 tabular-nums", puntuar && puntuar(p) === mejor && "bg-emerald-50 font-bold text-emerald-700")}>{ver(p)}</td>)}</tr>
                );
              })}
              <tr><th scope="row" className={celda}></th>{ps.map((p) => <td key={p.id} className={celda}><EnlaceCompra p={p} className="px-3.5 py-2 text-xs whitespace-nowrap">{t("card.seeAt", { s: p.tienda })}</EnlaceCompra></td>)}</tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-slate-500">{t("cmp.note")}</p>
      </div>
    </Dialogo>
  );
}
