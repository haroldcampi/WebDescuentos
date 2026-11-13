/* Secciones fijas de la portada: «¿Encontraste una ganga?», «Cómo elegimos las ofertas» y el pie */
import { useEffect, useState } from "react";
import { abrirCompartir } from "@/lib/compartir";
import { useI18n } from "@/lib/store";
import { COMUNIDAD } from "@/lib/config";
import * as I from "./iconos";
import { BTN, EYEBROW, cx } from "./ui";

// Invitación a compartir una oferta (solo con cuentas activas)
export function CompartirCta() {
  const { t } = useI18n();
  if (!COMUNIDAD) return null;
  return (
    <section className="wrap mt-(--space-section) flex flex-wrap items-center justify-between gap-6 border-y border-frost py-8" id="compartir-cta" aria-labelledby="share-cta-title">
      <div className="flex flex-[1_1_360px] flex-col gap-1.5">
        <h2 className="text-sub" id="share-cta-title">{t("share.ctaTitle")}</h2>
        <p className="max-w-[60ch] text-small font-normal text-steel">{t("share.ctaText")}</p>
      </div>
      <button className={BTN} type="button" onClick={abrirCompartir}>{t("share.title")}</button>
    </section>
  );
}

/* Cómo elegimos: cinco pasos numerados, separados por líneas finas */
export function Metodo() {
  const { t } = useI18n();
  const sinLinea = COMUNIDAD; // justo debajo de «¿Encontraste una ganga?», que ya tiene su línea
  const pasos = [1, 2, 3, 4, 5];
  return (
    <section className={cx("mt-(--space-section) pt-(--space-section)", sinLinea ? "" : "border-t border-frost")} id="como-elegimos" aria-labelledby="como-title">
      <div className="wrap flex flex-col items-start">
        <p className={EYEBROW}>{t("how.eyebrow")}</p>
        <h2 className="max-w-[20ch] text-head" id="como-title">{t("how.title")}</h2>
      </div>
      <div className="wrap pasos mt-12 grid grid-cols-5 border-t border-frost max-tab:grid-cols-2 max-sm:grid-cols-1">
        {pasos.map((n, k) => {
          const ultimo = k === pasos.length - 1;
          return (
            <article key={n} data-in data-paso className={cx(
              "flex flex-col gap-3 py-8 pr-6 pl-0",
              k > 0 && "border-l border-frost pl-6",
              ultimo && "rounded-b-box border-l-0 bg-wash px-6",
              "max-tab:border-b max-tab:border-l-0 max-tab:border-frost max-tab:py-7 max-tab:pr-6 max-tab:pl-0",
              k % 2 === 1 && "max-tab:border-l max-tab:pl-6",
              ultimo && "max-tab:col-span-full max-tab:border-b-0 max-tab:pl-6",
              "max-sm:border-l-0 max-sm:px-0 max-sm:py-6",
              ultimo && "max-sm:px-4"
            )}>
              <h3 className="text-lead font-normal">{t(`how.${n}h`)}</h3>
              <p className="text-small leading-[1.55] font-normal text-steel">{t(`how.${n}p`)}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

interface AvisoInstalar extends Event { prompt: () => void; userChoice: Promise<unknown> }

/* Pie: franja de confianza, aviso de afiliados, enlaces y «Volver arriba» */
export function Pie() {
  const { t } = useI18n();
  const [instalar, setInstalar] = useState<AvisoInstalar | null>(null);
  useEffect(() => {
    const aviso = (e: Event) => { e.preventDefault(); setInstalar(e as AvisoInstalar); };
    const hecho = () => setInstalar(null);
    addEventListener("beforeinstallprompt", aviso); addEventListener("appinstalled", hecho);
    return () => { removeEventListener("beforeinstallprompt", aviso); removeEventListener("appinstalled", hecho); };
  }, []);

  const confianza = [
    { ico: <I.Escudo />, h: "trust.1h", p: "trust.1p" },
    { ico: <I.Rejilla size={20} sw={1.5} />, h: "trust.2h", p: "trust.2p" },
    { ico: <I.Moneda />, h: "trust.3h", p: "trust.3p" },
    { ico: <I.Campana size={20} sw={1.5} />, h: "trust.4h", p: "trust.4p" }
  ];
  const enlace = "flex min-h-16 items-center justify-between gap-3 rounded-box border border-frost bg-paper px-[18px] py-3.5 text-left text-small font-normal text-midnight no-underline transition-[border-color,color,background-color] duration-200 hover:border-lavender hover:text-indigo after:text-indigo after:transition-transform after:duration-200 after:ease-brand after:content-['→'] hover:after:translate-x-[3px]";
  const enlaces = [["#destacadas", "foot.top"], ["#catalogo", "foot.all"], ["#como-elegimos", "foot.how"]];
  return (
    <footer className="mt-(--space-section) grid grid-cols-12 gap-x-8 border-t border-frost bg-mist pt-16 pr-[max(var(--m),calc((100%-1320px)/2+var(--m)),env(safe-area-inset-right,0px))] pb-[max(32px,env(safe-area-inset-bottom,0px))] pl-[max(var(--m),calc((100%-1320px)/2+var(--m)),env(safe-area-inset-left,0px))] max-sm:gap-x-0 max-sm:gap-y-8 max-sm:pt-12 [&>*]:min-w-0"
      aria-labelledby="pie-title">
      <h2 className="sr-only" id="pie-title">{t("foot.sr")}</h2>
      <div className="col-span-full mb-12 border-b border-frost pb-12 max-sm:mb-2 max-sm:pb-8">
        <ul className="grid grid-cols-4 gap-8 max-tab:grid-cols-2 max-sm:grid-cols-1 max-sm:gap-5" aria-label={t("trust.aria")}>
          {confianza.map((c) => (
            <li key={c.h} className="flex items-start gap-3.5 [&>svg]:box-border [&>svg]:size-10 [&>svg]:rounded-box [&>svg]:border [&>svg]:border-frost [&>svg]:bg-paper [&>svg]:p-[9px] [&>svg]:text-indigo">
              {c.ico}
              <div><h3 className="mt-px mb-1 text-body font-normal">{t(c.h)}</h3><p className="text-small leading-[1.45] font-normal text-steel">{t(c.p)}</p></div>
            </li>
          ))}
        </ul>
      </div>
      <div className="col-span-7 flex flex-col justify-start gap-4 text-small max-tab:col-span-full">
        <p className="max-w-[52ch] text-body leading-[1.45] font-normal text-midnight">{t("foot.amazon")}</p>
        <p className="max-w-[72ch] text-caption leading-[1.55] font-normal text-steel">{t("foot.legal")}</p>
      </div>
      <nav className={cx("col-start-8 col-end-[-1] grid auto-rows-[minmax(64px,1fr)] grid-cols-2 gap-2 self-stretch max-tab:col-span-full max-tab:mt-6 max-sm:grid-cols-2", instalar ? "max-tab:grid-cols-4" : "max-tab:grid-cols-3")} aria-label={t("foot.navAria")}>
        {enlaces.map(([href, k], n) => (
          <a key={k} href={href} className={cx(enlace, !instalar && n === enlaces.length - 1 && "col-span-full max-tab:col-span-1 max-sm:col-span-full")}>{t(k)}</a>
        ))}
        {instalar && (
          <button className={cx(enlace, "border-lilac bg-wash text-indigo after:content-['↓']")} type="button"
            onClick={async () => { instalar.prompt(); await instalar.userChoice.catch(() => {}); setInstalar(null); }}>
            {t("install")}
          </button>
        )}
      </nav>
      <div className="col-span-7 mt-16 flex flex-row flex-wrap items-baseline justify-between gap-4 border-t border-frost pt-6 text-small max-tab:col-span-full max-sm:mt-0">
        <p className="text-sub leading-none font-medium tracking-[-0.02em]" aria-hidden="true">{t("brand")}</p>
        <p className="text-caption font-normal text-slate">{t("foot.copy")}</p>
      </div>
      <a className="group/go col-start-8 col-end-[-1] mt-16 flex flex-row items-center justify-start gap-2 border-t border-frost pt-6 text-small text-indigo no-underline max-tab:col-span-full max-tab:mt-0 max-tab:border-t-0 max-tab:pt-2 max-sm:pt-0" href="#inicio">
        <svg className="order-first size-4 transition-transform duration-300 ease-brand group-hover/go:-translate-y-[3px]" viewBox="0 0 48 48" width="36" height="36" aria-hidden="true"><path d="M24 40V9M11 21 24 8l13 13" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" /></svg>
        <span className="text-small font-normal">{t("foot.back")}</span>
      </a>
    </footer>
  );
}
