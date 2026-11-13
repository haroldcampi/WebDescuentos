/* Gráfica del historial de precios: una sola línea escalonada (el precio cambia a saltos),
   rejilla discreta, mínimo marcado, línea del «precio antes» y lectura al pasar el ratón o el dedo */
import { useRef, useState, type PointerEvent } from "react";
import { analisis, money } from "@/lib/catalogo";
import { useI18n } from "@/lib/store";
import type { Producto } from "@/lib/tipos";
import * as I from "./iconos";
import { cx } from "./ui";

const W = 640, H = 220, Tp = 14, B = 28; // el SVG ocupa solo la zona de la línea; las etiquetas van fuera
const LAB = "pointer-events-none absolute text-[11px] leading-none whitespace-nowrap text-slate tabular-nums";

export function Grafica({ p }: { p: Producto }) {
  const i = useI18n(), { t } = i;
  const svg = useRef<SVGSVGElement>(null), caja = useRef<HTMLDivElement>(null);
  const [punto, setPunto] = useState<{ i: number; x: number; left: number } | null>(null);
  const an = analisis(p);
  if (!an) return null;

  const t0 = new Date(an.h[0][0]).getTime(), t1 = new Date(an.h[an.h.length - 1][0]).getTime() || t0 + 1;
  const valores = an.h.map((x) => x[1]).concat(p.precioAnterior ? [p.precioAnterior] : []);
  let lo = Math.min(...valores), hi = Math.max(...valores);
  const pad = (hi - lo) * 0.12 || hi * 0.1 || 1; lo = Math.max(0, lo - pad); hi += pad;
  const X = (d: string) => ((new Date(d).getTime() - t0) / Math.max(1, t1 - t0)) * W;
  const Y = (v: number) => Tp + (1 - (v - lo) / (hi - lo)) * (H - Tp - B);
  let d = ""; an.h.forEach((x, k) => { d += k ? `H${X(x[0]).toFixed(1)}V${Y(x[1]).toFixed(1)}` : `M${X(x[0]).toFixed(1)},${Y(x[1]).toFixed(1)}`; });
  const marcas = [lo + (hi - lo) * 0.15, lo + (hi - lo) * 0.5, lo + (hi - lo) * 0.85];
  // Las etiquetas van en HTML encima del SVG: así no se deforman al estirar la gráfica a lo ancho
  const pctY = (y: number) => ((y / H) * 100).toFixed(2) + "%";
  const posX = (x: number) => `calc(var(--g-l) + (100% - var(--g-l) - var(--g-r)) * ${(x / W).toFixed(4)})`;
  const pm = an.h[an.h.findIndex((x) => x[1] === an.min)], ult = an.h[an.h.length - 1];
  const fechasX = [an.h[0], an.h[Math.floor(an.h.length / 2)], an.h[an.h.length - 1]];

  // Fecha y precio del punto más cercano al puntero
  function mover(e: PointerEvent) {
    const s = svg.current, c = caja.current; if (!s || !c) return;
    const r = s.getBoundingClientRect();
    const x = Math.min(Math.max(0, (e.clientX - r.left) / r.width), 1) * W;
    const tt = t0 + (x / W) * (t1 - t0);
    let k = an!.h.length - 1; while (k > 0 && new Date(an!.h[k][0]).getTime() > tt) k--;
    const px = ((new Date(an!.h[k][0]).getTime() - t0) / Math.max(1, t1 - t0)) * W;
    const cb = c.getBoundingClientRect(), left = r.left - cb.left + (px / W) * r.width;
    setPunto({ i: k, x: px, left: Math.min(Math.max(left, 60), cb.width - 60) });
  }

  return (
    <section className="col-span-full flex flex-col gap-3.5 border-t border-frost pt-8" aria-labelledby="hist-title">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="text-sub" id="hist-title">{t("hist.title")}</h3>
        <span className="text-caption text-slate">{t("hist.sub", { n: an.h.length })}</span>
      </div>
      {an.dudoso
        ? <p className="flex items-start gap-2 rounded-box border border-warn-line bg-warn-bg px-3 py-2.5 text-small leading-[1.45] font-normal text-warn-ink [&_svg]:mt-[3px]"><I.Aviso /><span>{t("hist.fake", { p: money.format(p.precioAnterior as number), m: money.format(Math.max(...an.h.slice(0, -1).map((x) => x[1]))) })}</span></p>
        : an.minimo ? <p className="flex items-start gap-2 rounded-box bg-wash px-3 py-2.5 text-small leading-[1.45] font-normal text-indigo [&_svg]:mt-[3px]"><I.Check /><span>{t("hist.isMin")}</span></p> : null}
      <dl className="m-0 grid grid-cols-4 gap-2 max-sm:grid-cols-2">
        {[["hist.now", p.precio], ["hist.min", an.min], ["hist.avg", an.media], ["hist.max", an.max]].map(([k, v]) => (
          <div key={k} className="rounded-box border border-frost px-3 py-2.5">
            <dt className="text-caption text-slate">{t(k as string)}</dt>
            <dd className="mt-0.5 text-lead text-midnight tabular-nums">{money.format(v as number)}</dd>
          </div>
        ))}
      </dl>
      <div ref={caja} className="relative h-[220px] touch-pan-y [--g-l:62px] [--g-r:10px] max-sm:h-[180px]" onPointerMove={mover} onPointerLeave={() => setPunto(null)}>
        <svg ref={svg} className="absolute inset-y-0 left-(--g-l) block h-full w-[calc(100%-var(--g-l)-var(--g-r))] overflow-visible" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img"
          aria-label={t("hist.aria", { a: money.format(an.min), b: money.format(an.max), c: money.format(p.precio) })}>
          {marcas.map((v, k) => <line key={k} x1={0} x2={W} y1={Y(v)} y2={Y(v)} className="trazo-fijo stroke-frost" strokeWidth={1} />)}
          {p.precioAnterior && <line x1={0} x2={W} y1={Y(p.precioAnterior)} y2={Y(p.precioAnterior)} className="trazo-fijo stroke-slate" strokeWidth={1} strokeDasharray="4 4" />}
          <path d={d} className="trazo-fijo fill-none stroke-indigo" strokeWidth={2} strokeLinejoin="round" />
          {punto && <line className="trazo-fijo stroke-slate" strokeWidth={1} y1={Tp} y2={H - B} x1={punto.x} x2={punto.x} />}
        </svg>
        {marcas.map((v, k) => <span key={k} className={cx(LAB, "left-0 w-[50px] -translate-y-1/2 text-right")} style={{ top: pctY(Y(v)) }}>{money.format(v)}</span>)}
        {fechasX.map((x, k) => <span key={k} className={cx(LAB, "bottom-1", k === 0 ? "" : k === 2 ? "-translate-x-full" : "-translate-x-1/2")} style={{ left: posX(X(x[0])) }}>{i.fecha(x[0])}</span>)}
        {p.precioAnterior && <span className={cx(LAB, "right-(--g-r) -translate-y-[calc(100%+4px)]")} style={{ top: pctY(Y(p.precioAnterior)) }}>{t("hist.before", { p: money.format(p.precioAnterior) })}</span>}
        <span className="pointer-events-none absolute -mt-[5px] -ml-[5px] size-2.5 rounded-full border-2 border-indigo bg-paper" style={{ left: posX(X(pm[0])), top: pctY(Y(pm[1])) }} />
        <span className="pointer-events-none absolute -mt-[5px] -ml-[5px] size-2.5 rounded-full border-2 border-paper bg-indigo shadow-[0_0_0_1px_var(--color-indigo)]" style={{ left: posX(X(ult[0])), top: pctY(Y(ult[1])) }} />
        {punto && (
          <div className="pointer-events-none absolute top-0 flex -translate-x-1/2 flex-col items-center rounded-box border border-lavender bg-paper px-2.5 py-1.5 text-caption whitespace-nowrap text-slate" style={{ left: punto.left }}>
            <span>{i.fecha(an.h[punto.i][0])}</span><b className="text-small font-medium text-midnight tabular-nums">{money.format(an.h[punto.i][1])}</b>
          </div>
        )}
      </div>
      <table className="sr-only">
        <caption>{t("hist.title")}</caption>
        <thead><tr><th>{t("hist.date")}</th><th>{t("cmp.price")}</th></tr></thead>
        <tbody>{an.h.map((x) => <tr key={x[0]}><td>{i.fecha(x[0])}</td><td>{money.format(x[1])}</td></tr>)}</tbody>
      </table>
    </section>
  );
}
