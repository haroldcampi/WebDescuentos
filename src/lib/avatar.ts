/* Avatares (blobatar): un dibujo fijo generado a partir del nombre de usuario.
   El mismo nombre da siempre el mismo avatar; no se guarda ninguna imagen. El nombre no se copia dentro del SVG. */
import type { OpcionesBlobatar } from "./vendor/blobatar";
import type { ConfigAvatar } from "./tipos";

/* Personalización (se guarda en el perfil): forma, expresión, fondo y color.
   Las formas se eligen con su posición en la tabla de blobatar (el centro de cada franja). */
export const AVA_FORMAS: Record<string, number> = { round: 0.11, organic: 0.35, boxy: 0.54, capsule: 0.65, nub: 0.745, cloud: 0.825, droplet: 0.8875, hexagon: 0.9325, sun: 0.965, triangle: 0.99 };
export const AVA_EXPRESIONES = ["idle", "happy", "sad", "mad", "surprised", "wink", "sleepy", "smug", "unsure", "scared", "love", "shy", "sick", "thinking"];
export const AVA_FONDOS = ["none", "squircle", "circle", "square"];
export const AVA_TONOS = [350, 18, 42, 125, 172, 205, 235, 285];
export const AVA_DEFECTO: ConfigAvatar = { forma: "auto", expresion: "idle", fondo: "squircle", tono: "auto" };

export function limpiarAvatar(c: unknown): ConfigAvatar {
  const o = (c && typeof c === "object" ? c : {}) as Record<string, unknown>;
  return {
    forma: Object.prototype.hasOwnProperty.call(AVA_FORMAS, String(o.forma)) ? String(o.forma) : "auto",
    expresion: AVA_EXPRESIONES.includes(String(o.expresion)) ? String(o.expresion) : "idle",
    fondo: AVA_FONDOS.includes(String(o.fondo)) ? String(o.fondo) : "squircle",
    tono: AVA_TONOS.includes(Number(o.tono)) ? Number(o.tono) : "auto"
  };
}

let dibujar: ((semilla: string, o?: OpcionesBlobatar) => string) | null = null;
let EXPRESIONES: Record<string, unknown> = {};
let carga: Promise<void> | null = null;
// Se descarga aparte, cuando hace falta el primer avatar
export function cargarAvatares() {
  if (!carga) carga = Promise.all([import("./vendor/blobatar.js"), import("./vendor/blobatar-expression.js")])
    .then(([m, ex]) => { dibujar = m.blobatar; EXPRESIONES = ex as unknown as Record<string, unknown>; });
  return carga;
}

function opciones(cfg?: ConfigAvatar | null): OpcionesBlobatar {
  const c = limpiarAvatar(cfg);
  const o: OpcionesBlobatar = { background: c.fondo === "none" ? false : c.fondo };
  if (c.forma !== "auto") o.traits = { shape: AVA_FORMAS[c.forma] };
  if (c.expresion !== "idle" && EXPRESIONES[c.expresion]) o.expression = EXPRESIONES[c.expresion];
  if (c.tono !== "auto") o.hue = c.tono;
  return o;
}
// SVG del avatar, o null si la librería aún no ha llegado (entonces se muestra la inicial)
export function svgAvatar(semilla: string, cfg?: ConfigAvatar | null) {
  const k = String(semilla || "").replace(/^@/, "");
  if (!dibujar || !k) return null;
  try { return dibujar(k, opciones(cfg)); } catch (e) { console.error(e); return null; }
}
