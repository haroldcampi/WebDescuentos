/* Gráfica del historial de precios de los últimos 90 días: línea escalonada (el precio cambia a saltos) con área degradada,
   línea punteada del promedio, línea verde del mínimo, puntos en cada cambio, lectura al pasar el ratón o el dedo
   y el veredicto de si es buen momento para comprar. */
import { Info, LineChart, ShieldCheck, TriangleAlert } from "lucide-react";
import { useRef, useState, type PointerEvent } from "react";
import { DIA, analisis, money } from "@/lib/catalogo";
import { useI18n } from "@/lib/store";
import type { Producto } from "@/lib/tipos";
import { cx } from "./ui";

const W = 640, H = 200, Tp = 12, B = 26; // el SVG ocupa la zona de la línea; las etiquetas van en HTML encima
const LAB = "pointer-events-none absolute text-[10px] leading-none font-semibold whitespace-nowrap tabular-nums";

export function Grafica({ p }: { p: Producto }) {
  const i = useI18n(), { t } = i;
  const svg = useRef<SVGSVGElement>(null), caja = useRef<HTMLDivElement>(null);
  const [punto, setPunto] = useState<{ i: number; x: number; left: number } | null>(null);
  const an = analisis(p);
  if (!an) return null;

  // Eje horizontal: los últimos 90 días hasta el último precio conocido
  const t1 = new Date(an.h[an.h.length - 1][0]).getTime(), t0 = t1 - 90 * DIA;
  const valores = an.h.map((x) => x[1]).concat(p.precioAnterior ? [p.precioAnterior] : []);
  const maxV = Math.max(...valores);
  let lo = Math.min(...valores), hi = maxV;
  const pad = (hi - lo) * 0.12 || hi * 0.1 || 1; lo = Math.max(0, lo - pad); hi += pad;
  const X = (d: string) => Math.max(0, ((new Date(d).getTime() - t0) / (t1 - t0)) * W);
  const Y = (v: number) => Tp + (1 - (v - lo) / (hi - lo)) * (H - Tp - B);
  let d = ""; an.h.forEach((x, k) => { d += k ? `H${X(x[0]).toFixed(1)}V${Y(x[1]).toFixed(1)}` : `M0,${Y(x[1]).toFixed(1)}H${X(x[0]).toFixed(1)}`; });
  d += `H${W}`;
  const area = `${d}V${H - B}H0Z`;
  const pctY = (y: number) => ((y / H) * 100).toFixed(2) + "%";
  const posX = (x: number) => `calc(var(--g-l) + (100% - var(--g-l) - var(--g-r)) * ${(x / W).toFixed(4)})`;
  const ult = an.h.length - 1;
  const fechas = [["d.ago90", 0], ["d.ago60", W / 3], ["d.ago30", (2 * W) / 3], ["d.today", W]] as const;

  // Fecha y precio del punto más cercano al puntero
  function mover(e: PointerEvent) {
    const s = svg.current, c = caja.current; if (!s || !c) return;
    const r = s.getBoundingClientRect();
    const x = Math.min(Math.max(0, (e.clientX - r.left) / r.width), 1) * W;
    const tt = t0 + (x / W) * (t1 - t0);
    let k = an!.h.length - 1; while (k > 0 && new Date(an!.h[k][0]).getTime() > tt) k--;
    const cb = c.getBoundingClientRect(), left = r.left - cb.left + (x / W) * r.width;
    setPunto({ i: k, x, left: Math.min(Math.max(left, 60), cb.width - 60) });
  }

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4" aria-labelledby="hist-title">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 id="hist-title" className="flex items-center gap-1.5 text-sm font-bold text-slate-900"><LineChart className="size-4 text-acento" aria-hidden="true" />{t("d.chartTitle")}</h3>
          <p className="text-xs text-slate-500">{t("d.chartSub")}</p>
        </div>
        <dl className="flex flex-wrap items-center gap-2 text-xs sm:gap-3">
          <div className="flex gap-1 rounded-lg border border-slate-200 bg-card px-2.5 py-1"><dt className="text-slate-400">{t("d.max")}</dt><dd className="font-bold text-slate-700 tabular-nums">{money.format(an.max)}</dd></div>
          <div className="flex gap-1 rounded-lg border border-slate-200 bg-card px-2.5 py-1"><dt className="text-slate-400">{t("d.avg")}</dt><dd className="font-bold text-slate-700 tabular-nums">{money.format(an.media)}</dd></div>
          <div className="flex gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-800"><dt>{t("d.min")}</dt><dd className="font-extrabold tabular-nums">{money.format(an.min)}</dd></div>
        </dl>
      </div>

      <div ref={caja} className="relative h-[200px] touch-pan-y select-none [--g-l:54px] [--g-r:8px] max-sm:h-[170px]" onPointerMove={mover} onPointerLeave={() => setPunto(null)}>
        <svg ref={svg} className="absolute inset-y-0 left-(--g-l) block h-full w-[calc(100%-var(--g-l)-var(--g-r))] overflow-visible text-indigo-600" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img"
          aria-label={t("hist.aria", { a: money.format(an.min), b: money.format(an.max), c: money.format(p.precio) })}>
          <defs>
            <linearGradient id="grad-precio" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.01" />
            </linearGradient>
          </defs>
          <line x1={0} x2={W} y1={Y(an.media)} y2={Y(an.media)} className="stroke-slate-400" strokeWidth={1} strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
          <line x1={0} x2={W} y1={Y(an.min)} y2={Y(an.min)} className="stroke-emerald-500" strokeWidth={1.2} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
          <path d={area} fill="url(#grad-precio)" />
          <path d={d} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          {punto && <line className="stroke-slate-400" strokeWidth={1} y1={Tp} y2={H - B} x1={punto.x} x2={punto.x} vectorEffect="non-scaling-stroke" />}
        </svg>
        <span className={cx(LAB, "left-0 w-[46px] -translate-y-1/2 text-right text-slate-500")} style={{ top: pctY(Y(maxV)) }}>{money.format(maxV)}</span>
        <span className={cx(LAB, "left-0 w-[46px] -translate-y-1/2 text-right text-slate-500")} style={{ top: pctY(Y(an.media)) }}>{money.format(Math.round(an.media))}</span>
        <span className={cx(LAB, "left-0 w-[46px] -translate-y-1/2 text-right font-bold text-emerald-600")} style={{ top: pctY(Y(an.min) + 8) }}>{money.format(an.min)}</span>
        {fechas.map(([k, x], n) => (
          <span key={k} className={cx(LAB, "bottom-1 text-[10.5px] font-medium text-slate-500", n === 0 ? "" : n === 3 ? "-translate-x-full" : "-translate-x-1/2")} style={{ left: posX(x) }}>{t(k)}</span>
        ))}
        {an.h.map((x, k) => {
          const minimo = x[1] === an.min, ultimo = k === ult;
          return <span key={x[0]} className={cx("pointer-events-none absolute rounded-full border-2 border-card", ultimo ? "-mt-[6px] -ml-[6px] size-3 bg-emerald-500" : minimo ? "-mt-1 -ml-1 size-2 bg-emerald-600" : "-mt-1 -ml-1 size-2 bg-indigo-600")}
            style={{ left: posX(X(x[0])), top: pctY(Y(x[1])) }} />;
        })}
        {punto && (
          <div className="pointer-events-none absolute top-0 flex -translate-x-1/2 flex-col items-center rounded-lg border border-slate-200 bg-card px-2.5 py-1.5 text-xs whitespace-nowrap text-slate-500 shadow-md" style={{ left: punto.left }}>
            <span>{i.fecha(an.h[punto.i][0])}</span><b className="text-sm font-bold text-slate-900 tabular-nums">{money.format(an.h[punto.i][1])}</b>
          </div>
        )}
      </div>

      <div className="mt-2 flex items-start gap-2 border-t border-slate-200/70 pt-2.5 text-xs">
        {an.dudoso
          ? <span className="inline-flex items-start gap-1.5 font-semibold text-amber-800"><TriangleAlert className="mt-px size-4 shrink-0 text-amber-600" aria-hidden="true" />{t("hist.fake", { p: money.format(p.precioAnterior as number), m: money.format(Math.max(...an.h.slice(0, -1).map((x) => x[1]))) })}</span>
          : an.minimo
            ? <span className="inline-flex items-start gap-1.5 font-semibold text-emerald-700"><ShieldCheck className="mt-px size-4 shrink-0 text-emerald-600" aria-hidden="true" />{t("d.verdictGood")}</span>
            : <span className="inline-flex items-start gap-1.5 font-medium text-slate-600"><Info className="mt-px size-4 shrink-0 text-indigo-500" aria-hidden="true" />{t("d.verdictAvg")}</span>}
      </div>

      <table className="sr-only">
        <caption>{t("hist.title")}</caption>
        <thead><tr><th>{t("hist.date")}</th><th>{t("cmp.price")}</th></tr></thead>
        <tbody>{an.h.map((x) => <tr key={x[0]}><td>{i.fecha(x[0])}</td><td>{money.format(x[1])}</td></tr>)}</tbody>
      </table>
    </section>
  );
}
