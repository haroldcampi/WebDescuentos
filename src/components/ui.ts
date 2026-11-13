/* Piezas de estilo que se repiten (botones, campos, etiquetas…), escritas con clases de Tailwind.
   cx() une clases y, si dos chocan (p. ej. dos rellenos), gana la última. */
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["caption", "small", "body", "lead", "sub", "head", "display", "mini"],
      radius: ["box"],
      ease: ["brand"],
      tracking: ["label"]
    }
  }
});
export const cx = (...c: (string | false | null | undefined)[]) => twMerge(c.filter(Boolean).join(" "));

const transicion = "transition-[background-color,border-color,color] duration-200";

// Botón principal (relleno índigo) y secundario (contorno lavanda)
export const BTN = `inline-flex items-center justify-center gap-2 rounded-box border border-indigo bg-indigo px-6 py-3.5 text-small font-normal leading-[1.2] tracking-[-0.01em] text-white no-underline ${transicion} hover:border-accent-hi hover:bg-accent-hi disabled:cursor-not-allowed disabled:border-frost disabled:bg-frost disabled:text-slate tactil:min-h-11`;
export const GHOST = `inline-flex items-center justify-center gap-2 rounded-box border border-lavender bg-transparent px-6 py-3.5 text-small font-normal leading-[1.2] text-indigo no-underline ${transicion} hover:border-indigo-hover hover:bg-wash aria-pressed:border-indigo aria-pressed:bg-wash tactil:min-h-11`;
// Botón de compra: flecha que se mueve al pasar
export const CTA = `${BTN} group/cta [&_svg]:size-3.5 [&_svg]:transition-transform [&_svg]:duration-200 [&_svg]:ease-brand hover:[&_svg]:translate-x-0.5 hover:[&_svg]:-translate-y-0.5`;
// Enlace con aspecto de texto subrayado
export const LINKBTN = `border-0 bg-transparent p-0 text-left text-small font-normal text-indigo underline decoration-lavender decoration-1 underline-offset-4 transition-[color,text-decoration-color] duration-200 hover:decoration-indigo tactil:inline-flex tactil:min-h-11 tactil:items-center`;
export const AUTH_LINK = "border-0 bg-transparent p-0 text-small font-normal text-indigo underline decoration-lavender underline-offset-4 hover:decoration-indigo";

// Botón cuadrado de la cabecera (tema, campana, cuenta)
export const ICON_BTN = "inline-grid size-[38px] flex-none place-items-center rounded-box border border-frost bg-transparent p-0 text-slate transition-[border-color,color] duration-200 hover:border-lavender hover:text-indigo tactil:min-h-11 tactil:min-w-11 max-xs:size-10 max-xs:min-h-10 max-xs:min-w-10";
// Botón × de las ventanas
export const CERRAR = "sticky top-3 right-0 z-[2] float-right mt-3 mr-3 size-10 rounded-box border border-frost bg-paper text-[22px] leading-none font-light text-midnight transition-[border-color,color] duration-200 hover:border-lavender hover:text-indigo";

export const EYEBROW = "mb-4 text-caption font-normal uppercase tracking-label text-slate";
export const LABEL = "text-caption font-normal uppercase tracking-label text-slate";

// Campos de los formularios (acceso, compartir, ajustes)
export const INPUT = "w-full rounded-box border border-frost bg-paper px-3 py-[11px] text-body font-normal text-midnight transition-[border-color] duration-200 focus:border-indigo focus:outline-none";
export const FLD = "flex flex-col gap-1";
export const FLD_LAB = "text-caption font-normal text-steel";
export const FLD_2 = "grid grid-cols-2 gap-3.5 max-sm:grid-cols-1";
export const FORM = "flex flex-col gap-3.5";
export const CHK = "inline-flex cursor-pointer items-start gap-2.5 text-small leading-[1.4] font-normal text-steel [&_input]:mt-0.5 [&_input]:size-4 [&_input]:flex-none [&_input]:accent-indigo";

// Etiquetas de cada oferta (verificada, nueva, termina en…)
export const FLAG = "inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-frost px-2 py-0.5 text-caption leading-normal font-normal text-steel";
export const FLAG_TIPO = {
  ok: "border-lilac text-indigo",
  nueva: "border-wash bg-wash text-indigo",
  urgente: "border-indigo bg-indigo text-white",
  aviso: "border-warn-line bg-warn-bg text-warn-ink",
  prime: "border-deep-violet bg-deep-violet font-medium text-white",
  tendencia: "border-lavender text-indigo"
};

// Píldora de categoría
export const CHIP = "inline-flex items-center gap-2 rounded-full border border-frost bg-paper px-3.5 py-2 text-small font-normal transition-[border-color,background-color,color] duration-200 hover:border-lavender hover:text-indigo aria-pressed:border-lilac aria-pressed:bg-wash aria-pressed:text-indigo [&_svg]:size-4 [&_svg]:text-indigo tactil:min-h-11 tactil:min-w-11";

// Caja de un mensaje de error / de éxito en los formularios
export const MSG = "text-small font-normal text-error empty:hidden";
export const MSG_OK = "rounded-box bg-wash px-3.5 py-3 text-midnight";

export const DIALOGO_ANCHO = { estrecho: "w-[min(440px,100%-32px)]", medio: "w-[min(560px,100%-32px)]" };
