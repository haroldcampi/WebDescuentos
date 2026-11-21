/* Pie compacto: marca y tiendas rastreadas, aviso de afiliados (obligatorio para Amazon), compartir una oferta e instalar la app */
import { abrirPanelCookies } from "@/lib/privacidad";
import { Download, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { contar } from "@/lib/catalogo";
import { abrirCompartir } from "@/lib/compartir";
import { COMUNIDAD } from "@/lib/config";
import { useI18n } from "@/lib/store";

interface AvisoInstalar extends Event { prompt: () => void; userChoice: Promise<unknown> }

export function Pie() {
  const { t, lang } = useI18n();
  const [instalar, setInstalar] = useState<AvisoInstalar | null>(null);
  useEffect(() => {
    const aviso = (e: Event) => { e.preventDefault(); setInstalar(e as AvisoInstalar); };
    const hecho = () => setInstalar(null);
    addEventListener("beforeinstallprompt", aviso); addEventListener("appinstalled", hecho);
    return () => { removeEventListener("beforeinstallprompt", aviso); removeEventListener("appinstalled", hecho); };
  }, []);
  const tiendas = new Intl.ListFormat(lang, { type: "conjunction" }).format(contar("tienda").map(([n]) => n));
  const enlace = "inline-flex items-center gap-1.5 font-semibold text-slate-600 hover:text-acento tactil:min-h-11 [&_svg]:size-3.5";
  return (
    <footer className="mt-12 border-t border-slate-200/80 bg-card" aria-labelledby="pie-title">
      <h2 className="sr-only" id="pie-title">{t("foot.sr")}</h2>
      <div className="wrap flex flex-col gap-4 py-6 text-xs text-slate-500">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex flex-wrap items-center justify-center gap-2 text-center sm:justify-start sm:text-left">
            <span className="font-bold text-slate-800">Radar de Ofertas</span>
            <span aria-hidden="true">•</span>
            <span>{t("d.footer", { n: tiendas })}</span>
          </div>
          <p className="text-center sm:text-right">{t("d.footerNote")}</p>
        </div>
        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-start">
          <div className="max-w-3xl space-y-1 text-center text-xs leading-relaxed text-slate-500 sm:text-left">
            <p>{t("foot.amazon")}</p>
            <p>{t("foot.legal")} {t("foot.copy")}</p>
            <nav className="flex flex-wrap justify-center gap-x-4 gap-y-1 pt-2 font-semibold text-slate-600 sm:justify-start" aria-label={t("legal.privacy")}>
              <a className="hover:text-acento" href="privacidad">{t("legal.privacy")}</a>
              <a className="hover:text-acento" href="terminos">{t("legal.terms")}</a>
              <a className="hover:text-acento" href="cookies">{t("legal.cookies")}</a>
              <a className="hover:text-acento" href="creditos">{t("legal.credits")}</a>
              <button type="button" className="font-semibold hover:text-acento" onClick={abrirPanelCookies}>{t("legal.choices")}</button>
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            {COMUNIDAD && <button type="button" className={enlace} onClick={abrirCompartir}><Send aria-hidden="true" />{t("share.title")}</button>}
            {instalar && (
              <button type="button" className={enlace} onClick={async () => { instalar.prompt(); await instalar.userChoice.catch(() => {}); setInstalar(null); }}>
                <Download aria-hidden="true" />{t("install")}
              </button>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
