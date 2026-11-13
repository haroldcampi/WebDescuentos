/* Portada: rebajas más fuertes · anuncio · catálogo con filtros · compartir · cómo elegimos · anuncio · pie.
   El HTML se genera al compilar (en español); al abrirse en el navegador se aplica el idioma del visitante
   y se pintan los productos (las ofertas caducadas se quitan con la hora del visitante). */
import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { Anuncio } from "@/components/Anuncio";
import { Cabecera } from "@/components/Cabecera";
import { Catalogo } from "@/components/Catalogo";
import { BarraComparar } from "@/components/Comparador";
import { Destacadas } from "@/components/Destacadas";
import { Evento } from "@/components/Evento";
import { CompartirCta, Metodo, Pie } from "@/components/Secciones";
import { catalogo, reloj } from "@/lib/catalogo";
import { iniciarComunidad } from "@/lib/comunidad";
import { iniciarCuenta } from "@/lib/cuenta";
import { idiomaInicial } from "@/lib/i18n";
import { abrirFicha, useApp, useI18n } from "@/lib/store";

/* Las ventanas (ficha con galería, gráfica y comentarios; comparador; alertas; cuenta; compartir) no se ven al abrir la web:
   su código se descarga la primera vez que se abre cada una, no con la página. */
const Ficha = dynamic(() => import("@/components/Ficha").then((m) => m.Ficha), { ssr: false });
const VentanaComparador = dynamic(() => import("@/components/Comparador").then((m) => m.VentanaComparador), { ssr: false });
const Alertas = dynamic(() => import("@/components/Alertas").then((m) => m.Alertas), { ssr: false });
const Acceso = dynamic(() => import("@/components/Acceso").then((m) => m.Acceso), { ssr: false });
const CompartirOferta = dynamic(() => import("@/components/CompartirOferta").then((m) => m.CompartirOferta), { ssr: false });

// true desde la primera vez que se cumple la condición (la ventana, una vez cargada, se queda montada)
function useUnaVez(c: boolean) {
  const visto = useRef(false);
  if (c) visto.current = true;
  return visto.current;
}
function Ventanas() {
  const ficha = useUnaVez(useApp((s) => !!s.fichaId));
  const comparador = useUnaVez(useApp((s) => s.comparadorAbierto));
  const alertas = useUnaVez(useApp((s) => s.alertasAbierto));
  const acceso = useUnaVez(useApp((s) => !!s.acceso));
  const compartir = useUnaVez(useApp((s) => s.compartirAbierto));
  return <>
    {ficha && <Ficha />}
    {comparador && <VentanaComparador />}
    {alertas && <Alertas />}
    {acceso && <Acceso />}
    {compartir && <CompartirOferta />}
  </>;
}

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
    <Ventanas />
  </>;
}
