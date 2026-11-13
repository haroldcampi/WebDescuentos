/* Ajustes de la web: anuncios, base de datos de la comunidad, tiendas y grandes eventos de rebajas. */

// Máximo de productos en el comparador
export const MAX_COMPARAR = 4;

/* GOOGLE ADSENSE
   Crea en AdSense (Anuncios > Por bloque de anuncios) un anuncio «de display» por cada espacio
   y pega aquí su número data-ad-slot. Mientras esté vacío, ese espacio muestra el recuadro «Publicidad».
   Nunca se ponen anuncios dentro de la lista de productos. */
export const ADSENSE = {
  cliente: "ca-pub-6410047185817436",
  bloques: { superior: "", lateral: "", inferior: "" } as Record<"superior" | "lateral" | "inferior", string>
};

/* COMUNIDAD (votos, comentarios y cuentas) con Supabase.
   La URL del proyecto y su clave pública "anon" (Supabase > Project Settings > API).
   Si las dejas vacías, la web funciona igual pero sin votos, comentarios ni cuentas. */
export const SUPABASE = {
  url: "https://xvzmxhvsmuhrqiymvzoe.supabase.co",
  clave: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2em14aHZzbXVocnFpeW12em9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4MDg3MjAsImV4cCI6MjEwODM4NDcyMH0.Xze2amBDqd954nlg_H9LMX0jnudLA8q_oY5CRsLLn98"
};
export const COMUNIDAD = !!(SUPABASE.url && SUPABASE.clave);

// Color de identificación de cada tienda
export const TIENDAS: Record<string, string> = {
  "Amazon": "#e88a00", "Walmart": "#0071ce", "Target": "#cc0000", "Best Buy": "#0046be",
  "eBay": "#5f8f12", "Etsy": "#e2581a", "Temu": "#f06a00", "AliExpress": "#d8290a",
  "Home Depot": "#f96302", "Lowe’s": "#004990"
};

/* BÚSQUEDA EN TODAS LAS TIENDAS (ahora no se muestra en la web; se conserva por si vuelven los botones de cada tienda)
   {q} es lo que escribió el visitante. "afiliado" es opcional: envuelve la búsqueda con tu enlace de afiliado ({url}). */
export const BUSQUEDA_TIENDAS: Record<string, { buscar: string; afiliado?: string }> = {
  "Amazon":     { buscar: "https://www.amazon.com/s?k={q}&tag=TU-TAG-20" },
  "Walmart":    { buscar: "https://www.walmart.com/search?q={q}", afiliado: "" /* Impact: https://goto.walmart.com/c/TU-ID/568844/9383?u={url} */ },
  "Target":     { buscar: "https://www.target.com/s?searchTerm={q}", afiliado: "" /* Impact: https://goto.target.com/c/TU-ID/81938/2092?u={url} */ },
  "Best Buy":   { buscar: "https://www.bestbuy.com/site/searchpage.jsp?st={q}", afiliado: "" /* Impact: https://bestbuy.7tiv.net/c/TU-ID/614286/10014?u={url} */ },
  "eBay":       { buscar: "https://www.ebay.com/sch/i.html?_nkw={q}&mkcid=1&mkrid=711-53200-19255-0&campid=TU-CAMPID&toolid=10001" },
  "Etsy":       { buscar: "https://www.etsy.com/search?q={q}", afiliado: "" /* Awin: https://www.awin1.com/cread.php?awinmid=6220&awinaffid=TU-ID&ued={url} */ },
  "Temu":       { buscar: "https://www.temu.com/search_result.html?search_key={q}" },
  "AliExpress": { buscar: "https://www.aliexpress.us/w/wholesale-{q}.html" },
  "Home Depot": { buscar: "https://www.homedepot.com/s/{q}", afiliado: "" /* Impact: pega tu enlace de seguimiento de Home Depot y deja {url} donde va la página */ },
  "Lowe’s":     { buscar: "https://www.lowes.com/search?searchTerm={q}", afiliado: "" /* Impact o CJ: pega tu enlace de seguimiento y deja {url} donde va la página */ }
};
export function urlBusqueda(tienda: string, q: string) {
  const c = BUSQUEDA_TIENDAS[tienda];
  if (!c) return null;
  const qq = tienda === "AliExpress" ? encodeURIComponent(q.trim().replace(/\s+/g, "-")) : encodeURIComponent(q.trim());
  const url = c.buscar.replace("{q}", qq);
  return c.afiliado ? c.afiliado.replace("{url}", encodeURIComponent(url)) : url;
}

/* GRANDES EVENTOS DE REBAJAS: cuenta atrás en una franja bajo la cabecera.
   Añade aquí los que quieras (Prime Day, Back to School…). Se muestra el próximo en los 60 días previos. */
export const EVENTOS = [
  { nombre: "Black Friday", fecha: "2026-11-27" },
  { nombre: "Cyber Monday", fecha: "2026-11-30" }
];

// El carrusel de «Las rebajas más fuertes» avanza cada 5 s con las 8 más rebajadas
export const ROTAR_CADA = 5000;
export const EN_GIRO = 8;
// Productos que se pintan de cada vez en el catálogo («Ver más»)
export const POR_TANDA = 24;
