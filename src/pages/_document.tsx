import fs from "node:fs";
import path from "node:path";
import { Head, Html, Main, NextScript } from "next/document";
import { ADSENSE, SUPABASE } from "@/lib/config";

/* SEGURIDAD (CSP): la política de contenido está en vercel.json (cabecera Content-Security-Policy).
   Si añades un script en línea o de otro dominio, añádelo allí o el navegador lo bloqueará.
   Este script del tema va en línea para que no haya parpadeo: si lo cambias, recalcula su sha256 y cámbialo en vercel.json
   (npm run build lo comprueba: ver scripts/comprobar-csp.ts). */
export const SCRIPT_TEMA = 'document.documentElement.classList.add("js");try{if(localStorage.getItem("radar-tema")==="oscuro")document.documentElement.dataset.theme="dark";}catch(e){}';

/* CSS en línea: al compilar, la hoja de estilos (unos 12 KB comprimida) se mete dentro del HTML en vez de pedirse aparte.
   Así el navegador puede pintar en cuanto llega la página, sin esperar otra descarga. Es una web de una sola página,
   así que no se pierde nada de caché. La CSP ya permite estilos en línea (style-src 'unsafe-inline').
   En desarrollo (npm run dev) se dejan los <link> normales para que la recarga de estilos funcione. */
class HeadConCss extends Head {
  getCssLinks(files: Parameters<Head["getCssLinks"]>[0]) {
    if (process.env.NODE_ENV !== "production") return super.getCssLinks(files);
    const css = files.allFiles.filter((f) => f.endsWith(".css"));
    if (!css.length) return null;
    return css.map((f) => (
      <style key={f} data-n-href={"/_next/" + f} dangerouslySetInnerHTML={{ __html: fs.readFileSync(path.join(process.cwd(), ".next", f), "utf8") }} />
    ));
  }
}

export default function Documento() {
  return (
    <Html lang="es">
      <HeadConCss>
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <meta name="theme-color" content="#ffffff" />
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
        <link rel="preconnect" href={SUPABASE.url} crossOrigin="" />
        <link rel="manifest" href="manifest.webmanifest" />
        <link rel="icon" href="icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="icon-180.png" />
        <meta name="apple-mobile-web-app-title" content="Deal Radar" />
        {/* IMPACT: verificación del sitio (afiliados de Walmart, Target, Best Buy, Home Depot y Lowe's) */}
        <meta name="impact-site-verification" {...{ value: "b43df43f-daac-4433-90e4-e32c89bf35a0" }} />
        <meta name="impact-site-verification" {...{ value: "e47def77-022a-4476-b6ef-abbc0ac523d2" }} />
        {/* GOOGLE ADSENSE: identifica la cuenta aunque el script se cargue más tarde (ver src/pages/_app.tsx) */}
        <meta name="google-adsense-account" content={ADSENSE.cliente} />
        {/* La fuente (next/font) y el script de AdSense (al primer gesto del visitante) se cargan desde src/pages/_app.tsx */}
      </HeadConCss>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
