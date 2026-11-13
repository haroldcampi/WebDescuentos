import type { NextConfig } from "next";

/* Web estática: `npm run build` genera la carpeta out/ (HTML, CSS y JS) que se sube a Vercel, Hostinger o cualquier hosting.
   SEGURIDAD: las cabeceras (CSP incluida) están en vercel.json. Con Pages Router, Next.js no mete scripts en línea
   ejecutables (solo el JSON de __NEXT_DATA__), así que la CSP sigue sin necesitar 'unsafe-inline' en script-src. */
const config: NextConfig = {
  output: "export",
  reactStrictMode: true,
  poweredByHeader: false,
  images: { unoptimized: true },
  devIndicators: false,
  outputFileTracingRoot: import.meta.dirname
};

export default config;
