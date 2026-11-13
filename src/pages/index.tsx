/* Portada: rebajas más fuertes · anuncio · catálogo con filtros · compartir · cómo elegimos · anuncio · pie.
   El HTML se genera al compilar (en español); al abrirse en el navegador se aplica el idioma del visitante
   y se pintan los productos (las ofertas caducadas se quitan con la hora del visitante). */
import { useEffect } from "react";
import { Acceso } from "@/components/Acceso";
import { Alertas } from "@/components/Alertas";
import { Anuncio } from "@/components/Anuncio";
import { Cabecera } from "@/components/Cabecera";
import { Catalogo } from "@/components/Catalogo";
import { BarraComparar, VentanaComparador } from "@/components/Comparador";
import { CompartirOferta } from "@/components/CompartirOferta";
import { Destacadas } from "@/components/Destacadas";
import { Evento } from "@/components/Evento";
import { Ficha } from "@/components/Ficha";
import { CompartirCta, Metodo, Pie } from "@/components/Secciones";
import { catalogo, reloj } from "@/lib/catalogo";
import { iniciarComunidad } from "@/lib/comunidad";
import { iniciarCuenta } from "@/lib/cuenta";
import { idiomaInicial } from "@/lib/i18n";
import { abrirFicha, useApp, useI18n } from "@/lib/store";

/* Entrada de cada sección al aparecer en pantalla */
function entradas() {
  const els = document.querySelectorAll<HTMLElement>("[data-in]");
  // Navegadores sin sibling-index(): se numeran los hijos para el retraso escalonado (globals.css)
  if (!CSS.supports("transition-delay: calc(sibling-index() * 1ms)")) els.forEach((el) => [...el.children].forEach((h, k) => (h as HTMLElement).style.setProperty("--sibling-index", String(k + 1))));
  const ver = (el: Element) => el.classList.add("in");
  if (!("IntersectionObserver" in window)) return els.forEach(ver);
  const io = new IntersectionObserver((ents) => ents.forEach((en) => { if (en.isIntersecting) { ver(en.target); io.unobserve(en.target); } }), { threshold: 0.05 });
  els.forEach((el) => io.observe(el));
  setTimeout(() => els.forEach((el) => { if (el.getBoundingClientRect().top < innerHeight) ver(el); }), 2500);
}

// La hora de la compilación viaja en las props: el primer render del navegador usa la misma que el HTML generado
export function getStaticProps() {
  return { props: { generado: Date.now() } };
}

export default function Inicio() {
  const { t } = useI18n();
  const montado = useApp((s) => s.montado);

  useEffect(() => {
    const lang = idiomaInicial();
    document.documentElement.lang = lang;
    // El HTML se generó con la hora de la compilación: ahora pasa a la del visitante (quita ofertas caducadas, «Nueva», «Termina en…»)
    reloj.ahora = Date.now();
    useApp.setState({ lang, montado: true, ahora: reloj.ahora });
    iniciarComunidad();
    iniciarCuenta();
    // Enlace compartido (?producto=id): abre directamente la ficha de ese producto
    const id = new URLSearchParams(location.search).get("producto");
    if (id && catalogo().porId.has(id)) abrirFicha(id);
    /* App instalable (PWA) */
    if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch((e) => console.error(e));
  }, []);
  useEffect(() => { if (montado) requestAnimationFrame(entradas); }, [montado]);

  return <>
    <Cabecera />
    <Evento />
    <main id="inicio">
      <h1 className="sr-only">{t("meta.title")}</h1>
      <Destacadas />
      <div className="wrap">
        {/* ANUNCIO 1 · Banner superior */}
        <Anuncio sitio="superior" texto={t("ad.top")} margen="mt-(--space-pause)" alto="min-h-24" />
      </div>
      <Catalogo />
      <CompartirCta />
      <Metodo />
      <div className="wrap">
        {/* ANUNCIO 4 · Banner inferior */}
        <Anuncio sitio="inferior" texto={t("ad.foot")} margen="mt-(--space-section)" alto="min-h-24" />
      </div>
    </main>
    <BarraComparar />
    <Pie />
    <Ficha />
    <VentanaComparador />
    <Alertas />
    <Acceso />
    <CompartirOferta />
  </>;
}
