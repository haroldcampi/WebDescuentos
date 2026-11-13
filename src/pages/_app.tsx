import type { AppProps } from "next/app";
import { Inter_Tight } from "next/font/google";
import Head from "next/head";
import Script from "next/script";
import { useEffect, useState } from "react";
import { reloj } from "@/lib/catalogo";
import { ADSENSE } from "@/lib/config";
import { useI18n } from "@/lib/store";
import "@/styles/globals.css";

/* Fuente servida desde la propia web (next/font la descarga al compilar): sin peticiones a Google Fonts,
   con display: swap y una fuente de respaldo ajustada al mismo tamaño para que el texto no salte al cambiar */
const fuente = Inter_Tight({ subsets: ["latin"], weight: ["300", "400", "500"], display: "swap", adjustFontFallback: true, variable: "--font-inter-tight" });

// Antes del primer render, el reloj del catálogo se pone en la hora con la que se generó el HTML (ver catalogo.ts)
let relojFijado = false;

/* GOOGLE ADSENSE (tu cuenta): el script (unos 250 KB) no se descarga al abrir la página, sino al primer gesto del visitante
   (desplazar, tocar, pulsar una tecla) o cuando un anuncio ya configurado entra en pantalla. Cada hueco tiene su alto
   reservado (components/Anuncio), así que el anuncio no empuja el contenido al llegar.
   Los bloques de anuncio se configuran en src/lib/config.ts, bloque ADSENSE. */
function AdSense() {
  const [cargar, setCargar] = useState(false);
  useEffect(() => {
    const ya = () => setCargar(true);
    const gestos = ["scroll", "pointerdown", "touchstart", "keydown"];
    gestos.forEach((g) => addEventListener(g, ya, { once: true, passive: true }));
    const io = "IntersectionObserver" in window ? new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) ya(); }) : null;
    document.querySelectorAll("ins.adsbygoogle").forEach((el) => io?.observe(el));
    return () => { gestos.forEach((g) => removeEventListener(g, ya)); io?.disconnect(); };
  }, []);
  return cargar ? <Script id="adsense" src={"https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + ADSENSE.cliente} strategy="afterInteractive" crossOrigin="anonymous" /> : null;
}

export default function App({ Component, pageProps }: AppProps) {
  if (!relojFijado && typeof pageProps.generado === "number") { reloj.ahora = pageProps.generado; relojFijado = true; }
  const { t } = useI18n();
  return <>
    <Head>
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      <title>{t("meta.title")}</title>
      <meta name="description" content={t("meta.desc")} />
    </Head>
    <AdSense />
    <div className={fuente.variable + " font-sans"}>
      <Component {...pageProps} />
    </div>
  </>;
}
