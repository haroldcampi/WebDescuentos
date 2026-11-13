/*
  IMPORTAR UN FEED DE PRODUCTOS (CSV) -> src/data/productos.ts

  Las redes de afiliados (Impact, CJ, Rakuten, Awin, eBay Partner Network, AliExpress Portals...)
  te dejan descargar un "product feed" en CSV con título, precio, imágenes y tu enlace de afiliado.
  Este script lo convierte al formato que usa la web.

  Uso:
     npm run importar -- feed-walmart.csv feed-target.csv ...
  Resultado: reescribe src/data/productos.ts con todos los productos de esos archivos.
  Después, `npm run build` genera la web con el catálogo nuevo.

  Cada red llama distinto a las columnas. Ajusta el bloque COLUMNAS si hace falta:
  a la izquierda el campo de la web, a la derecha los nombres posibles en el CSV.
*/
import fs from "node:fs";
import path from "node:path";

const raiz = path.join(import.meta.dirname, "..");

const COLUMNAS: Record<string, string[]> = {
  titulo:         ["titulo", "title", "name", "product name", "product_name"],
  tienda:         ["tienda", "store", "advertiser", "advertiser name", "merchant", "program name", "brand store"],
  categoria:      ["categoria", "category", "product type", "product_type", "google product category", "merchant_category"],
  precio:         ["precio", "sale price", "sale_price", "current price", "price"],
  precioAnterior: ["precioanterior", "original price", "list price", "retail price", "msrp", "price"],
  imagenes:       ["imagenes", "image url", "image_link", "image link", "imageurl", "additional image link", "additional_image_link", "image urls"],
  marca:          ["marca", "brand", "manufacturer"],
  enlace:         ["enlace", "affiliate url", "buy url", "click url", "link", "aw_deep_link", "tracking url", "url"]
};

function parseCSV(texto: string) {
  const filas: string[][] = []; let fila: string[] = []; let campo = ""; let comillas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (comillas) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') comillas = false;
      else campo += c;
    } else if (c === '"') comillas = true;
    else if (c === "," || c === "\t") { fila.push(campo); campo = ""; }
    else if (c === "\n") { fila.push(campo); filas.push(fila); fila = []; campo = ""; }
    else if (c !== "\r") campo += c;
  }
  if (campo || fila.length) { fila.push(campo); filas.push(fila); }
  return filas.filter((f) => f.some((x) => x.trim()));
}

const num = (v: string): number | null => { const n = parseFloat(String(v || "").replace(/[^0-9.]/g, "")); return isNaN(n) ? null : n; };

type Fila = { id: string; titulo: string; tienda: string; categoria: string; precio: number | null; precioAnterior: number | null; imagenes: string[]; enlace: string; marca?: string; actualizado: string; historial?: [string, number][] };

function convertir(archivo: string): Fila[] {
  const filas = parseCSV(fs.readFileSync(archivo, "utf8").replace(/^\uFEFF/, ""));
  const cab = (filas.shift() || []).map((h) => h.trim().toLowerCase());
  const col = (campo: string) => cab.findIndex((h) => COLUMNAS[campo].includes(h));
  const idx = Object.fromEntries(Object.keys(COLUMNAS).map((k) => [k, col(k)]));
  // Para las imágenes se usan TODAS las columnas que parezcan de imagen
  const colsImg = cab.map((h, i) => (COLUMNAS.imagenes.includes(h) ? i : -1)).filter((i) => i >= 0);
  const tiendaPorDefecto = path.basename(archivo).replace(/^feed-|\.csv$/gi, "");
  const hoy = new Date().toISOString().slice(0, 10);

  return filas.map((f, n) => {
    const v = (k: string) => (idx[k] >= 0 ? (f[idx[k]] || "").trim() : "");
    const imagenes = colsImg.flatMap((i) => (f[i] || "").split(/[|,;]\s*(?=https?:)/)).map((s) => s.trim()).filter((s) => /^https:\/\/[^\s"'<>`]+$/i.test(s));
    let precio = num(v("precio")), anterior = num(v("precioAnterior"));
    if (anterior !== null && precio !== null && anterior <= precio) anterior = null;
    return {
      id: `${tiendaPorDefecto}-${n + 1}`.toLowerCase().replace(/[^a-z0-9-]/g, ""),
      titulo: v("titulo"),
      tienda: v("tienda") || tiendaPorDefecto,
      categoria: (v("categoria").split(/>|\//).pop() || "Otros").trim(),
      precio, precioAnterior: anterior,
      imagenes: [...new Set(imagenes)],
      // Solo enlaces https sin espacios: un feed manipulado no puede colar "javascript:..."
      enlace: /^https:\/\/[^\s"'<>`]+$/i.test(v("enlace")) ? v("enlace") : "",
      ...(v("marca") ? { marca: v("marca") } : {}),
      actualizado: hoy
    };
  }).filter((p) => p.titulo && p.precio !== null && p.enlace);
}

const archivos = process.argv.slice(2);
if (!archivos.length) { console.log("Uso: node importar-feed.js feed1.csv [feed2.csv ...]"); process.exit(1); }
const todos = archivos.flatMap(convertir);
const salida = path.join(raiz, "src", "data", "productos.ts");

/* Historial de precios: se conserva el de la ejecución anterior y se añade el precio de hoy.
   Así, ejecutando este script cada día, la web va teniendo su gráfica de precios (hasta 180 días).
   SEGURIDAD: el historial se LEE como datos (JSON), nunca se ejecuta productos.js.
   Se guarda en historial-precios.json; si aún no existe, se lee de un productos.ts generado por este script. */
const archivoHistorial = path.join(raiz, "historial-precios.json");
type Historial = Map<string, [string, number][]>;
function historialAnterior(): Historial {
  const aMapa = (lista: unknown): Historial => new Map((Array.isArray(lista) ? lista : [])
    .filter((p) => p && typeof p.id === "string" && Array.isArray(p.historial))
    .map((p) => [p.id, (p.historial as unknown[]).filter((x): x is [string, number] => Array.isArray(x) && typeof x[0] === "string" && typeof x[1] === "number")]));
  try {
    const datos = JSON.parse(fs.readFileSync(archivoHistorial, "utf8"));
    return aMapa(Object.entries(datos).map(([id, historial]) => ({ id, historial })));
  } catch (e) { const er = e as NodeJS.ErrnoException; if (er.code !== "ENOENT") console.warn(`Aviso: no se pudo leer ${archivoHistorial} (${er.message}).`); }
  try {
    // Formato que escribe este script: «export const PRODUCTOS: ProductoBase[] = [ …JSON… ];» (una línea JSON por producto)
    const texto = fs.readFileSync(salida, "utf8");
    const m = texto.match(/export const PRODUCTOS[^=]*=\s*(\[[\s\S]*\]);?\s*$/);
    return m ? aMapa(JSON.parse(m[1])) : new Map();
  } catch (e) {
    console.warn("Aviso: productos.ts no tiene el formato de este script; se empieza el historial de cero.");
    return new Map();
  }
}
const previos = historialAnterior();
const limite = new Date(Date.now() - 180 * 864e5).toISOString().slice(0, 10);
for (const p of todos) {
  const h = (previos.get(p.id) || []).filter((x) => Array.isArray(x) && x[0] >= limite && x[0] !== p.actualizado);
  h.push([p.actualizado, p.precio as number]);
  p.historial = h;
}
fs.writeFileSync(salida, `// Generado por scripts/importar-feed.ts el ${new Date().toISOString()}\nimport type { ProductoBase } from "@/lib/tipos";\n\nexport const PRODUCTOS: ProductoBase[] = [\n${todos.map((p) => "  " + JSON.stringify(p)).join(",\n")}\n];\n`);
fs.writeFileSync(archivoHistorial, JSON.stringify(Object.fromEntries(todos.map((p) => [p.id, p.historial])), null, 1) + "\n");
console.log(`Listo: ${todos.length} productos guardados en ${salida}`);
