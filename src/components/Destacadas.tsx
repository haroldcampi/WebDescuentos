/* Las rebajas más fuertes: carrusel que avanza hacia la izquierda cada 5 segundos.
   La primera imagen va en grande y su ficha se muestra a la izquierda.
   Se pausa con el ratón encima, con el foco dentro o con la pestaña oculta. */
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { money, porDescuento } from "@/lib/catalogo";
import { EN_GIRO, ROTAR_CADA } from "@/lib/config";
import { abrirFicha, useApp, useI18n } from "@/lib/store";
import type { Producto } from "@/lib/tipos";
import { EnlaceCompra, Etiquetas, Precios } from "./piezas";
import { EYEBROW, cx } from "./ui";

export function Destacadas() {
  const i = useI18n(), { t } = i;
  // Se calcula ya en el primer render (va en el HTML compilado) y otra vez cuando el reloj pasa a la hora del visitante
  const ahora = useApp((s) => s.ahora);
  const [giro, setGiro] = useState<Producto[]>(() => porDescuento().slice(0, EN_GIRO));
  const [cambia, setCambia] = useState(false);
  const track = useRef<HTMLDivElement>(null), pausa = useRef(false);
  const primero = useRef<Producto | null>(giro[0] || null);

  useEffect(() => {
    if (!ahora) return;
    const lista = porDescuento().slice(0, EN_GIRO);
    primero.current = lista[0] || null;
    setGiro(lista);
  }, [ahora]);

  useEffect(() => {
    if (giro.length < 2) return;
    const avanzar = () => {
      const el = track.current, first = el?.firstElementChild as HTMLElement | null;
      if (!el || !first || el.children.length < 2) return;
      // Al terminar: el primero pasa al final y el siguiente se agranda
      const cerrar = () => {
        el.style.transition = "none";
        flushSync(() => { setGiro((g) => [...g.slice(1), g[0]]); setCambia(false); });
        el.style.transform = "";
        void el.offsetWidth;
        el.style.transition = "";
      };
      setCambia(true);
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return cerrar();
      const dx = first.getBoundingClientRect().width + 8;
      el.style.transition = "transform .7s cubic-bezier(0.22, 1, 0.36, 1)";
      el.style.transform = `translateX(${-dx}px)`;
      let hecho = false;
      const fin = () => { if (!hecho) { hecho = true; cerrar(); } };
      el.addEventListener("transitionend", (e) => { if (e.target === el) fin(); }, { once: true });
      setTimeout(fin, 900);
    };
    const id = setInterval(() => { if (!pausa.current && !document.hidden) { try { avanzar(); } catch (e) { console.error(e); } } }, ROTAR_CADA);
    return () => clearInterval(id);
  }, [giro.length > 1]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!giro.length) return null;
  const p = giro[0];

  return (
    <section className="wrap mt-[clamp(40px,5vw,72px)] grid grid-cols-12 items-end gap-x-8 [--big:240px] [--small:150px] max-tab:[--big:220px] max-tab:[--small:130px] max-sm:block max-sm:[--big:44vw] max-sm:[--small:21vw]"
      id="destacadas" aria-labelledby="destacadas-title"
      onPointerEnter={() => { pausa.current = true; }} onPointerLeave={() => { pausa.current = false; }}
      onFocus={() => { pausa.current = true; }} onBlur={() => { pausa.current = false; }}>
      <div className="col-span-4 flex flex-col max-tab:col-span-full max-tab:mb-10 max-tab:grid max-tab:grid-cols-2 max-tab:gap-x-8 max-sm:mb-6 max-sm:flex entra">
        <p className={cx(EYEBROW, "max-tab:col-start-1")}>{t("top.eyebrow")}</p>
        <h2 className="text-head max-tab:col-start-1" id="destacadas-title">{t("top.title")}</h2>
        <div className={cx("mt-8 flex min-h-[200px] flex-col items-start gap-2.5 border-t border-frost pt-6 max-tab:col-start-2 max-tab:row-span-2 max-tab:row-start-1 max-tab:mt-0 max-sm:mt-6 max-sm:min-h-[190px] [&>*]:transition-opacity [&>*]:duration-300",
          cambia && "[&>*]:opacity-0")} aria-label={t("top.dealAria")}>
          {p && <>
            <span className="text-caption font-normal uppercase tracking-label text-indigo">{t(p === primero.current ? "top.dealOfDay" : "top.featured")}</span>
            <Etiquetas p={p} className="m-0" />
            <h3 className="max-w-[22ch] text-sub">{i.tit(p)}</h3>
            <Precios p={p} />
            <p className="text-small font-normal text-steel">{t("top.saveIn", { a: money.format(p.ahorro), d: p.descuento, s: p.tienda })}</p>
            <EnlaceCompra p={p}>{t("top.seeDeal", { s: p.tienda })}</EnlaceCompra>
          </>}
        </div>
      </div>
      <div className="col-span-8 col-start-5 min-h-[calc(var(--big)+34px)] overflow-clip max-tab:col-span-full max-tab:col-start-1"
        aria-roledescription={t("top.carousel")} aria-label={t("top.carouselAria")}>
        <div className="flex items-end gap-4 max-sm:gap-2 motion-reduce:transition-none" ref={track}>
          {giro.map((x, k) => {
            const grande = k === 0;
            return (
              <div key={x.id} className={cx("flex min-w-0 flex-none flex-col transition-[width] duration-500 ease-brand motion-reduce:transition-none nth-[n+6]:hidden max-tab:nth-[n+5]:hidden max-sm:nth-[n+4]:hidden", grande ? "w-(--big)" : "w-(--small) motion-safe:animate-aparecer")}>
                <button className={cx("group/run relative aspect-square overflow-clip rounded-box border bg-mist p-0 transition-[border-color] duration-300", grande ? "border-lavender" : "border-frost")}
                  type="button" aria-label={t("card.viewSheet", { t: i.tit(x) })} onClick={() => abrirFicha(x.id)}>
                  {/* La primera foto es la más grande de la portada (LCP): sin carga diferida y con prioridad alta */}
                  <Image className="object-cover transition-transform duration-500 ease-brand group-hover/run:scale-[1.04] motion-reduce:transition-none"
                    src={x.imagenes[0]} alt={i.tit(x)} fill sizes={grande ? "(max-width: 640px) 44vw, 240px" : "(max-width: 640px) 21vw, 150px"}
                    {...(x === primero.current ? { fetchPriority: "high" as const, loading: "eager" as const, preload: !x.imagenes[0].startsWith("data:") } : {})} />
                </button>
                <span className={cx("mt-2.5 flex justify-between gap-2 text-small font-normal", !grande && "max-sm:flex-col max-sm:gap-0.5")}>
                  <span className="truncate text-steel">{x.tienda}</span>
                  {x.descuento > 0 && <span className="text-indigo tabular-nums">-{x.descuento}%</span>}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
