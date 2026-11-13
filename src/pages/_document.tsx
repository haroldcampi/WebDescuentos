import { Head, Html, Main, NextScript } from "next/document";

/* SEGURIDAD (CSP): la política de contenido está en vercel.json (cabecera Content-Security-Policy).
   Si añades un script en línea o de otro dominio, añádelo allí o el navegador lo bloqueará.
   Este script del tema va en línea para que no haya parpadeo: si lo cambias, recalcula su sha256 y cámbialo en vercel.json
   (npm run build lo comprueba: ver scripts/comprobar-csp.ts). */
export const SCRIPT_TEMA = 'document.documentElement.classList.add("js");try{if(localStorage.getItem("radar-tema")==="oscuro")document.documentElement.dataset.theme="dark";}catch(e){}';

export default function Documento() {
  return (
    <Html lang="es">
      <Head>
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <meta name="theme-color" content="#ffffff" />
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@300;400;500&display=swap" />
        <link rel="manifest" href="manifest.webmanifest" />
        <link rel="icon" href="icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="icon-180.png" />
        <meta name="apple-mobile-web-app-title" content="Deal Radar" />
        {/* IMPACT: verificación del sitio (afiliados de Walmart, Target, Best Buy, Home Depot y Lowe's) */}
        <meta name="impact-site-verification" {...{ value: "b43df43f-daac-4433-90e4-e32c89bf35a0" }} />
        <meta name="impact-site-verification" {...{ value: "e47def77-022a-4476-b6ef-abbc0ac523d2" }} />
        {/* GOOGLE ADSENSE (tu cuenta). Los bloques de anuncio se configuran en src/lib/config.ts, bloque ADSENSE. */}
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6410047185817436" crossOrigin="anonymous" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
