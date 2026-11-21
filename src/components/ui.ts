/* Piezas de estilo que se repiten (botones, campos, etiquetas…), escritas con clases de Tailwind y con el aspecto del diseño.
   cx() une clases y, si dos chocan (p. ej. dos rellenos), gana la última. */
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["caption", "small", "body", "lead", "sub", "head", "mini"],
      radius: ["box"],
      ease: ["brand"],
      tracking: ["label"]
    }
  }
});
export const cx = (...c: (string | false | null | undefined)[]) => twMerge(c.filter(Boolean).join(" "));

const transicion = "transition-colors duration-200";

// Botón principal (índigo) y secundario (contorno claro)
export const BTN = `inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white no-underline shadow-sm ${transicion} hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none tactil:min-h-11`;
export const GHOST = `inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-card px-4 py-2.5 text-sm font-semibold text-slate-700 no-underline ${transicion} hover:bg-slate-50 aria-pressed:border-indigo-200 aria-pressed:bg-indigo-50 aria-pressed:text-indigo-700 tactil:min-h-11`;
// Botón oscuro («Entrar», «Publicar»)
export const OSCURO = `inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-on-ink shadow-xs ${transicion} hover:opacity-90 disabled:opacity-60 tactil:min-h-11`;
// Botón de compra
export const CTA = `${BTN} font-bold`;
// Enlace con aspecto de texto
export const LINKBTN = `border-0 bg-transparent p-0 text-left text-sm font-semibold text-acento hover:underline underline-offset-4 tactil:inline-flex tactil:min-h-11 tactil:items-center`;
export const AUTH_LINK = "border-0 bg-transparent p-0 text-sm font-semibold text-acento underline-offset-4 hover:underline";

// Botón × de las ventanas: flota a la derecha sin ocupar ancho (-ml-12 = su tamaño + mr-3), así el contenido queda centrado
export const CERRAR = "sticky top-3 right-0 z-[2] float-right mt-3 mr-3 -ml-12 grid size-9 place-items-center rounded-xl bg-card text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700";

export const LABEL = "text-xs font-semibold uppercase tracking-wider text-slate-500";

// Campos de los formularios (acceso, compartir, ajustes)
export const INPUT = "w-full rounded-xl border border-slate-300 bg-card px-3.5 py-2 text-sm text-slate-900 outline-none transition-[border-color,box-shadow] duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";
export const FLD = "flex flex-col gap-1";
export const FLD_LAB = "text-xs font-semibold text-slate-700";
export const FLD_2 = "grid grid-cols-2 gap-3.5 max-sm:grid-cols-1";
export const FORM = "flex flex-col gap-3.5";
export const CHK = "inline-flex cursor-pointer items-start gap-2.5 text-sm leading-[1.4] text-slate-600 [&_input]:mt-0.5 [&_input]:size-4 [&_input]:flex-none [&_input]:accent-indigo-600";

// Etiquetas de cada oferta (verificada, nueva, termina en…)
export const FLAG = "inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-slate-200 bg-card px-2 py-0.5 text-xs font-semibold text-slate-600";
export const FLAG_TIPO = {
  ok: "border-emerald-200 bg-emerald-50 text-emerald-700",
  nueva: "border-indigo-200 bg-indigo-50 text-indigo-700",
  urgente: "border-amber-200 bg-amber-50 text-amber-800",
  aviso: "border-amber-300 bg-amber-50 text-amber-800",
  prime: "border-sky-600 bg-sky-600 text-white",
  tendencia: "border-rose-200 bg-rose-50 text-rose-700"
};

// Caja de un mensaje de error / de éxito en los formularios
export const MSG = "text-sm font-medium text-rose-600 empty:hidden";
export const MSG_OK = "rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-emerald-800";

export const DIALOGO_ANCHO = { estrecho: "w-[min(28rem,100%-1.5rem)]", medio: "w-[min(36rem,100%-1.5rem)]" };
