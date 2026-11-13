import { es, en, CATEGORIAS_EN, type Clave } from "./textos";
import type { ProductoBase } from "../tipos";

export type Idioma = "es" | "en";
export const IDIOMAS: Idioma[] = ["es", "en"];
const CLAVE = "radar-idioma";
export type Huecos = Record<string, string | number>;
export type T = (k: Clave | string, v?: Huecos) => string;

export function traducir(lang: Idioma, k: string, v?: Huecos) {
  let s: string = (lang === "en" ? en[k as Clave] : undefined) ?? es[k as Clave] ?? k;
  if (v) s = s.replace(/\{(\w+)\}/g, (m, n) => (v[n] !== undefined ? String(v[n]) : m));
  return s;
}

/* Elección del idioma: ?lang=en|es en la dirección > la última elección guardada > el idioma del navegador */
export function idiomaInicial(): Idioma {
  try { const u = new URLSearchParams(location.search).get("lang") as Idioma; if (IDIOMAS.includes(u)) return u; } catch {}
  try { const g = localStorage.getItem(CLAVE) as Idioma; if (IDIOMAS.includes(g)) return g; } catch {}
  return /^es\b/i.test(navigator.language || "") ? "es" : "en";
}
export function guardarIdioma(l: Idioma) {
  document.documentElement.lang = l;
  try { localStorage.setItem(CLAVE, l); } catch {}
}
export function idiomaEnDireccion(l: Idioma) {
  try { const u = new URL(location.href); u.searchParams.set("lang", l); history.replaceState(history.state, "", u); } catch {}
}

export const localeDe = (lang: Idioma) => (lang === "en" ? "en-US" : "es-US");
export const catEn = (c: string) => CATEGORIAS_EN[c] || c;

// Todo lo que depende del idioma, junto: textos, categorías, títulos y fechas
export function crearI18n(lang: Idioma) {
  const locale = localeDe(lang);
  const t: T = (k, v) => traducir(lang, k, v);
  return {
    lang, locale, t,
    cat: (c: string) => (lang === "en" ? CATEGORIAS_EN[c] || c : c),
    tit: (p: Pick<ProductoBase, "titulo" | "tituloEn">) => (lang === "en" && p.tituloEn) || p.titulo,
    fecha: (f?: string) => {
      if (!f) return "";
      const d = new Date(f + "T12:00:00");
      return isNaN(+d) ? f : d.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
    },
    fechaHora: (iso: string) => {
      const d = new Date(iso);
      return isNaN(+d) ? "" : d.toLocaleString(locale, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
    }
  };
}
export type I18n = ReturnType<typeof crearI18n>;
