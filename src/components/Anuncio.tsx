/* Espacio de anuncio de Google AdSense. Mientras su bloque esté vacío en config.ts, no se muestra nada (el diseño no tiene
   recuadros de publicidad). Con un bloque real, el hueco conserva su alto reservado y el anuncio no empuja el contenido.
   Nunca se ponen anuncios dentro de la lista de productos. */
import { useEffect, useRef } from "react";
import { ADSENSE } from "@/lib/config";
import { useApp } from "@/lib/store";
import { cx } from "./ui";

declare global { interface Window { adsbygoogle?: unknown[] } }

export function Anuncio({ sitio, margen, alto }: { sitio: keyof typeof ADSENSE.bloques; margen?: string; alto: string }) {
  const slot = String(ADSENSE.bloques[sitio] || "").trim();
  // Solo con las cookies de publicidad aceptadas (si no, el hueco no se muestra)
  const permitido = useApp((s) => s.cookies === true);
  const real = /^\d{6,}$/.test(slot) && permitido;
  const puesto = useRef(false);
  useEffect(() => {
    if (!real || puesto.current) return;
    puesto.current = true;
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { console.error(e); }
  }, [real]);
  if (!real) return null;
  return (
    <div id={"ad-" + sitio} className={cx("overflow-hidden", margen, alto)}>
      <ins className="adsbygoogle" data-ad-client={ADSENSE.cliente} data-ad-slot={slot} data-ad-format="auto" data-full-width-responsive="true" />
    </div>
  );
}
