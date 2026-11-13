/* Espacio de anuncio de Google AdSense. Mientras su bloque esté vacío en config.ts, muestra el recuadro «Publicidad».
   Nunca se ponen anuncios dentro de la lista de productos. */
import { useEffect, useRef } from "react";
import { ADSENSE } from "@/lib/config";
import { useI18n } from "@/lib/store";
import { cx } from "./ui";

declare global { interface Window { adsbygoogle?: unknown[] } }

// margen: se mantiene también con el anuncio real; className: solo para el recuadro de ejemplo
export function Anuncio({ sitio, texto, margen, className }: { sitio: keyof typeof ADSENSE.bloques; texto: string; margen?: string; className?: string }) {
  const { t } = useI18n();
  const slot = String(ADSENSE.bloques[sitio] || "").trim();
  const real = /^\d{6,}$/.test(slot);
  const puesto = useRef(false);
  useEffect(() => {
    if (!real || puesto.current) return;
    puesto.current = true;
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { console.error(e); }
  }, [real]);
  if (real) return (
    <div id={"ad-" + sitio} className={margen}>
      <ins className="adsbygoogle" data-ad-client={ADSENSE.cliente} data-ad-slot={slot} data-ad-format="auto" data-full-width-responsive="true" />
    </div>
  );
  return (
    <div id={"ad-" + sitio} className={cx("grid place-items-center rounded-box border border-dashed border-frost bg-mist p-4 text-center text-small text-slate", margen, className)}>
      <div><small className="mb-1 block text-caption uppercase tracking-label text-steel">{t("ad.label")}</small><span>{texto}</span></div>
    </div>
  );
}
