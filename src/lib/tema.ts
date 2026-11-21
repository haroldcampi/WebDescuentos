/* Tema de la web: «sistema» (sigue al ordenador o móvil), «claro» u «oscuro». Se guarda en este navegador (radar-tema).
   El primer pintado lo decide SCRIPT_TEMA (_document.tsx) antes de que cargue React, para que no haya parpadeo. */
export type Tema = "sistema" | "claro" | "oscuro";
// Opciones visibles en el selector (sin «sistema»; si alguien lo tenía guardado, se queda en claro)
export const TEMAS: Tema[] = ["claro", "oscuro"];
const CLAVE = "radar-tema";
const consulta = () => matchMedia("(prefers-color-scheme: dark)");

export function leerTema(): Tema {
  try { const t = localStorage.getItem(CLAVE) as Tema; if (TEMAS.includes(t)) return t; } catch {}
  return "claro";
}

export function aplicarTema(t: Tema) {
  const oscuro = t === "oscuro" || (t === "sistema" && consulta().matches);
  if (oscuro) document.documentElement.dataset.theme = "dark"; else delete document.documentElement.dataset.theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", oscuro ? "#131c2e" : "#ffffff");
}

export function guardarTema(t: Tema) {
  try { localStorage.setItem(CLAVE, t); } catch {}
  aplicarTema(t);
}

// Con «sistema», si el ordenador cambia de claro a oscuro (p. ej. al anochecer), la web cambia con él
export function seguirSistema(t: Tema) {
  if (t !== "sistema") return () => {};
  const m = consulta(), alCambiar = () => aplicarTema("sistema");
  m.addEventListener("change", alCambiar);
  return () => m.removeEventListener("change", alCambiar);
}
