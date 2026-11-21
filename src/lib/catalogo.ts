/* Lógica del catálogo sin pantalla: prepara los productos, calcula descuentos, urgencia, historial de precios,
   filtra, ordena y agrupa. La usan los componentes de src/components. */
import { PRODUCTOS } from "@/data/productos";
import { AMAZON_PRECIO_HORAS } from "./config";
import { catEn, type I18n, type T } from "./i18n";
import { ICO } from "./iconos-cat";
import type { Filtros, Producto, ProductoBase } from "./tipos";

export const DIA = 864e5;

/* Reloj de la web. El HTML se genera al compilar con la hora de la compilación; en el navegador, el primer render
   usa esa MISMA hora (llega en las props de la página) para que React no encuentre diferencias al hidratar.
   Justo después, index.tsx lo pone en la hora real del visitante y se quitan las ofertas caducadas. */
export const reloj = { ahora: Date.now() };
export const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
export const normalizar = (s: string) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
// Solo se enlazan direcciones http(s): un feed con "javascript:..." no puede ejecutar código
export const urlSegura = (u?: string) => (/^https?:\/\//i.test(String(u || "").trim()) ? String(u).trim() : "#");
export const conSigno = (n: number) => (n > 0 ? "+" + n : String(n));

/* Urgencia: campos opcionales de cada producto (ver productos.ts)
   - publicado: "AAAA-MM-DD" -> etiqueta «Nueva» durante 2 días
   - termina:   "AAAA-MM-DD" o "AAAA-MM-DDTHH:MM" -> «Termina en…»; pasada la fecha, la oferta deja de mostrarse */
export const finDe = (p: ProductoBase) => {
  if (!p.termina) return 0;
  const d = new Date(p.termina.length <= 10 ? p.termina + "T23:59:59" : p.termina);
  return isNaN(+d) ? 0 : d.getTime();
};
const vigente = (p: ProductoBase) => !finDe(p) || finDe(p) > reloj.ahora;
export const esNueva = (p: ProductoBase) => {
  if (!p.publicado) return false;
  const d = new Date(p.publicado + "T00:00:00").getTime();
  return !isNaN(d) && reloj.ahora - d < 2 * DIA && reloj.ahora >= d;
};
export function quedan(p: ProductoBase, t: T) {
  const fin = finDe(p), ms = fin - reloj.ahora;
  if (!fin || ms <= 0) return null;
  const h = Math.ceil(ms / 36e5);
  if (h <= 36) return { txt: t("deal.endsH", { n: h }), urgente: true };
  const d = Math.ceil(ms / DIA);
  return { txt: d <= 1 ? t("deal.ends1") : t("deal.endsD", { n: d }), urgente: d <= 2 };
}
export function cuentaAtras(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sg = s % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(sg).padStart(2, "0")}`;
}

/* Imagen provisional cuando el producto aún no tiene fotos de la tienda.
   Se dibuja como una foto de estudio: fondo suave, el objeto y su sombra. */
const TONOS: Record<string, number> = { "Electrónica": 214, "Hogar y cocina": 24, "Deportes": 152, "Belleza": 334, "Mascotas": 38, "Moda": 268, "Juguetes": 190, "Herramientas": 8 };
function imagenesProvisionales(p: ProductoBase) {
  const h = TONOS[p.categoria] ?? 200;
  const path = ICO[p.categoria] || ICO["Todas"];
  const vistas = [{ bg: 78, rot: 0, s: 7.2 }, { bg: 66, rot: -12, s: 6.4 }, { bg: 22, rot: 8, s: 8.2 }];
  return vistas.map((v, i) => {
    const fg = i === 2 ? `hsl(${h} 70% 78%)` : `hsl(${h} 60% 22%)`;
    const off = 150 - 12 * v.s; // centra el icono de 24px escalado
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><rect width="300" height="300" fill="hsl(${h} 50% ${v.bg}%)"/><ellipse cx="150" cy="252" rx="86" ry="10" fill="hsl(${h} 40% 12%)" opacity=".18"/><g transform="rotate(${v.rot} 150 140) translate(${off} ${off - 10}) scale(${v.s})" fill="none" stroke="${fg}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${path}</g><text x="286" y="290" text-anchor="end" font-family="sans-serif" font-size="10" fill="${fg}" opacity=".55">ejemplo · sample</text></svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  });
}

// Amazon: el precio solo se enseña si se comprobó hace menos de AMAZON_PRECIO_HORAS (fecha sola = a las 00:00 UTC de ese día)
export function precioCaducado(p: ProductoBase) {
  if (normalizar(p.tienda) !== "amazon") return false;
  const t = Date.parse(p.actualizado ? (p.actualizado.length === 10 ? p.actualizado + "T00:00:00Z" : p.actualizado) : "");
  return !isFinite(t) || reloj.ahora - t > AMAZON_PRECIO_HORAS * 36e5;
}

function preparar(p: ProductoBase): Producto {
  const sinPrecio = precioCaducado(p);
  const descuento = !sinPrecio && p.precioAnterior && p.precioAnterior > p.precio ? Math.round((1 - p.precio / p.precioAnterior) * 100) : 0;
  const r = {
    ...p,
    ...(sinPrecio ? { historial: [], errorPrecio: false, precioAnterior: undefined } : {}),
    sinPrecio,
    descuento,
    ahorro: descuento ? (p.precioAnterior as number) - p.precio : 0,
    _texto: normalizar([p.titulo, p.tituloEn || "", p.tienda, p.categoria, catEn(p.categoria)].join(" "))
  } as Producto;
  // Sin fotos: la imagen provisional se dibuja solo cuando alguna parte de la web la pide
  if (!(p.imagenes && p.imagenes.length)) {
    let cache: string[] | null = null;
    Object.defineProperty(r, "imagenes", { get: () => cache || (cache = imagenesProvisionales(p)), enumerable: true });
  }
  return r;
}

/* Productos vigentes según el reloj (se recalculan cuando cambia la hora: compilación → visitante) */
let cache: { t: number; lista: Producto[]; porId: Map<string, Producto> } | null = null;
export function catalogo() {
  if (!cache || cache.t !== reloj.ahora) {
    const lista = PRODUCTOS.filter(vigente).map(preparar);
    cache = { t: reloj.ahora, lista, porId: new Map(lista.map((p) => [p.id, p])) };
  }
  return cache;
}

/* Historial de precios (campo «historial»): mínimo, máximo y media de los últimos 90 días,
   y aviso de descuento dudoso cuando el «precio antes» no aparece en el historial */
export function analisis(p: Producto) {
  const h = (p.historial || []).filter((x) => Array.isArray(x) && x.length === 2 && typeof x[0] === "string" && isFinite(x[1]));
  if (h.length < 4) return null;
  const corte = new Date(reloj.ahora - 90 * DIA).toISOString().slice(0, 10);
  const ult = h.filter((x) => x[0] >= corte), usa = ult.length >= 4 ? ult : h;
  const precios = usa.map((x) => x[1]), previos = precios.slice(0, -1);
  const min = Math.min(...precios), max = Math.max(...precios), media = precios.reduce((a, b) => a + b, 0) / precios.length;
  return {
    h: usa, min, max, media,
    minimo: p.precio <= min + 0.005 && previos.some((v) => v > p.precio + 0.005),
    dudoso: !!(p.precioAnterior && Math.max(...previos) < p.precioAnterior * 0.97)
  };
}
export const esErrorPrecio = (p: Producto) => !!p.errorPrecio || p.descuento >= 70;

/* Orden del catálogo (desplegable de la franja de filtros) */
export const ORDENES = ["destacadas", "popularidad", "descuento", "precio-asc", "min90"] as const;

export interface DatosComunidad { total: Record<string, number>; recientes: Record<string, number> }
// Popularidad: votos de la comunidad y, a igualdad, reseñas y nota en la tienda
const popularidad = (p: Producto, c: DatosComunidad) => (c.total[p.id] || 0) * 1000 + Math.log10((p.resenas || 0) + 1) * (p.valoracion || 3);
/* Destacadas (orden por defecto): mínimo de 90 días, descuento y valoración en la tienda. No depende de los votos,
   que llegan después de abrir la página: así el orden del HTML generado no cambia al cargar (sin saltos). */
const destacada = (p: Producto) => (esMinimo90(p) ? 40 : 0) + p.descuento + Math.log10((p.resenas || 0) + 1) * (p.valoracion || 3);
// ¿Está hoy en su precio más bajo de los últimos 90 días?
export const esMinimo90 = (p: Producto) => !!analisis(p)?.minimo;

/* Filtros y orden */
export function filtrar(f: Filtros, favoritos: Set<string>, c: DatosComunidad) {
  const palabras = normalizar(f.q).split(/\s+/).filter(Boolean);
  const tiendas = new Set(f.tiendas);
  let lista = catalogo().lista.filter((p) =>
    (f.categoria === "Todas" || p.categoria === f.categoria) &&
    (tiendas.size === 0 || tiendas.has(p.tienda)) &&
    (!f.min90 || esMinimo90(p)) &&
    (!(f.min || f.max) || !p.sinPrecio) && (!f.min || p.precio >= f.min) && (!f.max || p.precio <= f.max) &&
    (f.vista !== "favoritos" || favoritos.has(p.id)) &&
    palabras.every((w) => p._texto.includes(w))
  );
  const ord: Record<Filtros["orden"], (a: Producto, b: Producto) => number> = {
    "destacadas": (a, b) => destacada(b) - destacada(a),
    "popularidad": (a, b) => popularidad(b, c) - popularidad(a, c),
    "descuento": (a, b) => b.descuento - a.descuento,
    "precio-asc": (a, b) => Number(a.sinPrecio) - Number(b.sinPrecio) || a.precio - b.precio,
    "min90": (a, b) => Number(esMinimo90(b)) - Number(esMinimo90(a)) || b.descuento - a.descuento
  };
  return lista.slice().sort(ord[f.orden] || ord.destacadas);
}

// Tope de la barra de precio: el producto más caro, redondeado hacia arriba a decenas
export const precioMaximo = () => Math.ceil(Math.max(...catalogo().lista.filter((p) => !p.sinPrecio).map((p) => p.precio), 10) / 10) * 10;

export function contar(campo: "categoria" | "tienda") {
  const m = new Map<string, number>();
  catalogo().lista.forEach((p) => m.set(p[campo], (m.get(p[campo]) || 0) + 1));
  return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0], "es"));
}
// Categorías ordenadas por su nombre en el idioma actual
export const categoriasOrdenadas = (i: I18n) => contar("categoria").sort((a, b) => i.cat(a[0]).localeCompare(i.cat(b[0]), i.lang));
