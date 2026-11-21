/* Portada: cabecera fija con la franja de filtros · aviso del próximo evento · ofertas (o favoritos / alertas) · pie.
   El HTML se genera al compilar (en español); al abrirse en el navegador se aplica el idioma del visitante
   y se pintan los productos (las ofertas caducadas se quitan con la hora del visitante). */
import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { Cabecera } from "@/components/Cabecera";
import { Catalogo } from "@/components/Catalogo";
import { BarraComparar } from "@/components/Comparador";
import { Evento } from "@/components/Evento";
import { Pie } from "@/components/Secciones";
import { catalogo, reloj } from "@/lib/catalogo";
import { iniciarComunidad } from "@/lib/comunidad";
import { iniciarCuenta } from "@/lib/cuenta";
import { idiomaInicial } from "@/lib/i18n";
import { abrirFicha, i18nActual, useApp } from "@/lib/store";

/* Las ventanas (ficha con gráfica y comentarios; comparador; cuenta; compartir) no se ven al abrir la web:
   su código se descarga la primera vez que se abre cada una, no con la página. */
const Ficha = dynamic(() => import("@/components/Ficha").then((m) => m.Ficha), { ssr: false });
const VentanaComparador = dynamic(() => import("@/components/Comparador").then((m) => m.VentanaComparador), { ssr: false });
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
  const acceso = useUnaVez(useApp((s) => !!s.acceso));
  const compartir = useUnaVez(useApp((s) => s.compartirAbierto));
  return <>
    {ficha && <Ficha />}
    {comparador && <VentanaComparador />}
    {acceso && <Acceso />}
    {compartir && <CompartirOferta />}
  </>;
}

// La hora de la compilación viaja en las props: el primer render del navegador usa la misma que el HTML generado
export function getStaticProps() {
  return { props: { generado: Date.now() } };
}

export default function Inicio() {
  useEffect(() => {
    const lang = idiomaInicial();
    document.documentElement.lang = lang;
    // El HTML se generó con la hora de la compilación: ahora pasa a la del visitante (quita ofertas caducadas, «Nueva», «Termina en…»)
    reloj.ahora = Date.now();
    useApp.setState({ lang, montado: true, ahora: reloj.ahora });
    iniciarComunidad();
    iniciarCuenta();
    // Enlace compartido (?producto=id): abre directamente la ficha de ese producto
    const q = new URLSearchParams(location.search), id = q.get("producto");
    // Vuelta tras borrar la cuenta: se confirma y se limpia la dirección
    if (q.get("cuenta") === "borrada") {
      history.replaceState(history.state, "", location.pathname);
      setTimeout(() => alert(i18nActual().t("set.deleted")), 300);
    }
    if (id && catalogo().porId.has(id)) abrirFicha(id);
    /* App instalable (PWA) */
    if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch((e) => console.error(e));
  }, []);

  return (
    <div className="flex min-h-svh flex-col">
      <Cabecera />
      <Evento />
      <Catalogo />
      <BarraComparar />
      <Pie />
      <Ventanas />
    </div>
  );
}
