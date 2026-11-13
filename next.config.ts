import path from "node:path";
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
  outputFileTracingRoot: import.meta.dirname,
  /* Next mete siempre en su código de cliente unos 13 KB de polyfills (Array.prototype.at, flat, flatMap, Object.fromEntries,
     Object.hasOwn, trimStart/trimEnd) aunque "browserslist" de package.json diga que no hacen falta. Todos los navegadores
     de esa lista ya los traen, así que se sustituyen por un módulo vacío. Si amplías browserslist a navegadores más viejos, quita esto. */
  webpack(config, { isServer, webpack }) {
    if (!isServer) config.plugins.push(new webpack.NormalModuleReplacementPlugin(/[\\/]polyfills[\\/]polyfill-module(\.js)?$/, path.join(import.meta.dirname, "src/lib/vacio.js")));
    return config;
  }
};

export default config;
