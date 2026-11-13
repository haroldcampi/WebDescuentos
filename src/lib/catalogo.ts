/* Lógica del catálogo sin pantalla: prepara los productos, calcula descuentos, urgencia, historial de precios,
   filtra, ordena y agrupa. La usan los componentes de src/components. */
import { PRODUCTOS } from "@/data/productos";
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

function preparar(p: ProductoBase): Producto {
  const descuento = p.precioAnterior && p.precioAnterior > p.precio ? Math.round((1 - p.precio / p.precioAnterior) * 100) : 0;
  const r = {
    ...p,
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

/* Ordenar y agrupar (menús «Ordenado por» y «Agrupado por» del catálogo) */
export const ORDENES = ["relevancia", "tendencias", "recientes", "popularidad", "descuento", "ahorro", "precio-asc", "precio-desc", "valoracion"] as const;
export const GRUPOS = ["ninguno", "tipo", "categoria", "tienda", "marca"] as const;
const TIPOS = ["flash", "gran", "rebaja", "normal"];
const fechaDe = (p: Producto) => p.publicado || p.actualizado || "";
// Tipo de oferta: el campo «tipo» si existe; si no, se deduce del producto
const tipoDe = (p: Producto) => (p.tipo ? "x:" + p.tipo : finDe(p) ? "flash" : p.descuento >= 40 ? "gran" : p.descuento > 0 ? "rebaja" : "normal");
export function claveGrupo(grupo: Filtros["grupo"], p: Producto) {
  if (grupo === "tipo") return tipoDe(p);
  if (grupo === "categoria") return p.categoria;
  if (grupo === "tienda") return p.tienda;
  if (grupo === "marca") return p.marca || "";
  return "";
}
export function nombreGrupo(grupo: Filtros["grupo"], k: string, i: I18n) {
  if (grupo === "tipo") return k.startsWith("x:") ? k.slice(2) : i.t("tipo." + k);
  if (grupo === "categoria") return i.cat(k);
  if (grupo === "marca") return k || i.t("marca.otras");
  return k;
}

export interface DatosComunidad { total: Record<string, number>; recientes: Record<string, number> }
// Popularidad: votos de la comunidad y, a igualdad, reseñas y nota en la tienda
const popularidad = (p: Producto, c: DatosComunidad) => (c.total[p.id] || 0) * 1000 + Math.log10((p.resenas || 0) + 1) * (p.valoracion || 3);
// Tendencia: votos de las últimas 48 h, novedad, urgencia y descuento
const tendencia = (p: Producto, c: DatosComunidad, t: T) => (c.recientes[p.id] || 0) * 3 + (c.total[p.id] || 0) + (esNueva(p) ? 4 : 0) + (quedan(p, t)?.urgente ? 2 : 0) + p.descuento / 10 + Math.log10((p.resenas || 0) + 1) / 2;

/* Filtros, orden y grupos. Devuelve la lista y cuántas ofertas tiene cada grupo */
export function filtrar(f: Filtros, favoritos: Set<string>, c: DatosComunidad, i: I18n) {
  const palabras = normalizar(f.q).split(/\s+/).filter(Boolean);
  const tiendas = new Set(f.tiendas);
  let lista = catalogo().lista.filter((p) =>
    (f.categoria === "Todas" || p.categoria === f.categoria) &&
    (tiendas.size === 0 || tiendas.has(p.tienda)) &&
    (!f.max || p.precio <= f.max) &&
    (!f.min || p.precio >= f.min) &&
    (!f.favoritos || favoritos.has(p.id)) &&
    palabras.every((w) => p._texto.includes(w))
  );
  const ord: Partial<Record<Filtros["orden"], (a: Producto, b: Producto) => number>> = {
    "precio-asc": (a, b) => a.precio - b.precio,
    "precio-desc": (a, b) => b.precio - a.precio,
    "descuento": (a, b) => b.descuento - a.descuento,
    "ahorro": (a, b) => b.ahorro - a.ahorro,
    "valoracion": (a, b) => (b.valoracion || 0) - (a.valoracion || 0),
    "recientes": (a, b) => fechaDe(b).localeCompare(fechaDe(a)) || b.descuento - a.descuento,
    "popularidad": (a, b) => popularidad(b, c) - popularidad(a, c),
    "tendencias": (a, b) => tendencia(b, c, i.t) - tendencia(a, c, i.t)
  };
  const fn = ord[f.orden];
  if (fn) lista = lista.slice().sort(fn);
  const cuentaGrupos = new Map<string, number>();
  if (f.grupo !== "ninguno") {
    // Grupos: los tipos en orden fijo; el resto, de más a menos ofertas («Otras marcas» al final)
    lista.forEach((p) => { const k = claveGrupo(f.grupo, p); cuentaGrupos.set(k, (cuentaGrupos.get(k) || 0) + 1); });
    const rango = (k: string) => f.grupo === "tipo" ? (k.startsWith("x:") ? 2.5 : TIPOS.indexOf(k)) : k === "" ? Infinity : -(cuentaGrupos.get(k) || 0);
    const orden = [...cuentaGrupos.keys()].sort((a, b) => rango(a) - rango(b) || nombreGrupo(f.grupo, a, i).localeCompare(nombreGrupo(f.grupo, b, i), i.lang));
    const pos = new Map(orden.map((k, n) => [k, n]));
    // sort estable: respeta el orden elegido dentro de cada grupo
    lista = lista.slice().sort((a, b) => (pos.get(claveGrupo(f.grupo, a)) ?? 0) - (pos.get(claveGrupo(f.grupo, b)) ?? 0));
  }
  return { lista, cuentaGrupos };
}

export function contar(campo: "categoria" | "tienda") {
  const m = new Map<string, number>();
  catalogo().lista.forEach((p) => m.set(p[campo], (m.get(p[campo]) || 0) + 1));
  return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0], "es"));
}
// Categorías ordenadas por su nombre en el idioma actual
export const categoriasOrdenadas = (i: I18n) => contar("categoria").sort((a, b) => i.cat(a[0]).localeCompare(i.cat(b[0]), i.lang));
// Las más rebajadas primero; a igualdad, la mejor valorada
export const porDescuento = () => catalogo().lista.slice().sort((a, b) => b.descuento - a.descuento || (b.valoracion || 0) - (a.valoracion || 0));
export const precioMaximo = () => Math.ceil(Math.max(...catalogo().lista.map((p) => p.precio), 10) / 10) * 10;
