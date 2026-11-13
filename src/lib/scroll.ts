/* Desplazamientos de la página al buscar o filtrar */

// En móvil y tablet los filtros van encima de los productos: la búsqueda baja directa a los resultados
export const esMovil = () => matchMedia("(max-width: 1080px)").matches;
const cabecera = () => document.querySelector<HTMLElement>("[data-cabecera]");
export const destinoBusqueda = () => document.getElementById(esMovil() ? "resultados" : "catalogo");
export const irAlCatalogo = () => document.getElementById("catalogo")?.scrollIntoView({ block: "start" });

// Deja el destino justo debajo de la cabecera. Si se baja con el teclado cerrado la cabecera se esconde, así que no se descuenta.
export function bajarA(el: HTMLElement | null) {
  if (!el) return;
  const top = el.getBoundingClientRect().top;
  const cab = top < 0 || document.activeElement === document.getElementById("q") ? Math.max(0, cabecera()?.getBoundingClientRect().bottom || 0) : 0;
  scrollTo({ top: scrollY + top - cab - 12, behavior: "smooth" });
}
// Lleva la vista a los resultados (si ya están arriba en pantalla, no se mueve). El cursor sigue en el buscador.
export function irAResultados() {
  const el = destinoBusqueda(); if (!el) return;
  const arriba = el.getBoundingClientRect().top - (cabecera()?.getBoundingClientRect().bottom || 0);
  if (arriba > 24 || arriba < -el.offsetHeight + 200) bajarA(el);
}
// Cierra el teclado del celular. Se repite un instante después porque algunos teclados (iPhone, texto predictivo en Android) ignoran el primer intento.
export function cerrarTeclado() {
  const q = document.getElementById("q");
  q?.blur(); (document.activeElement as HTMLElement | null)?.blur?.();
  setTimeout(() => { if (document.activeElement === q) q?.blur(); }, 50);
}
