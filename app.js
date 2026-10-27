/* Lógica de la web: lee window.PRODUCTOS (productos.js) y monta portada, tiendas, catálogo, ficha y comparador. */
(function () {
  "use strict";

  // Máximo de productos en el comparador
  const MAX_COMPARAR = 4;

  /* GOOGLE ADSENSE
     Crea en AdSense (Anuncios > Por bloque de anuncios) un anuncio «de display» por cada espacio
     y pega aquí su número data-ad-slot. Mientras esté vacío, ese espacio muestra el recuadro «Publicidad».
     Nunca se ponen anuncios dentro de la lista de productos. */
  const ADSENSE = {
    cliente: "ca-pub-6410047185817436",
    bloques: { superior: "", lateral: "", inferior: "" }
  };

  /* COMUNIDAD (votos y comentarios) con Supabase.
     Pon la URL de tu proyecto y su clave pública "anon" (Supabase > Project Settings > API).
     Si las dejas vacías, la web funciona igual pero sin votos ni comentarios. */
  const SUPABASE = { url: "https://xvzmxhvsmuhrqiymvzoe.supabase.co", clave: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2em14aHZzbXVocnFpeW12em9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4MDg3MjAsImV4cCI6MjEwODM4NDcyMH0.Xze2amBDqd954nlg_H9LMX0jnudLA8q_oY5CRsLLn98" };
  const COMUNIDAD = !!(SUPABASE.url && SUPABASE.clave);

  // Color de identificación de cada tienda
  const TIENDAS = {
    "Amazon": "#e88a00", "Walmart": "#0071ce", "Target": "#cc0000", "Best Buy": "#0046be",
    "eBay": "#5f8f12", "Etsy": "#e2581a", "Temu": "#f06a00", "AliExpress": "#d8290a",
    "Home Depot": "#f96302", "Lowe’s": "#004990"
  };

  /* BÚSQUEDA EN TODAS LAS TIENDAS
     Cuando alguien busca, además de tus productos se muestran botones que abren esa
     misma búsqueda dentro de cada tienda. {q} es lo que escribió el visitante.
     - "buscar": página de resultados de la tienda.
     - "afiliado": opcional. Envuelve la búsqueda con tu enlace de afiliado para cobrar
       comisión. {url} es la búsqueda ya codificada. Cambia TU-... por tus datos. */
  const BUSQUEDA_TIENDAS = {
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
  function urlBusqueda(tienda, q) {
    const c = BUSQUEDA_TIENDAS[tienda];
    if (!c) return null;
    const qq = tienda === "AliExpress" ? encodeURIComponent(q.trim().replace(/\s+/g, "-")) : encodeURIComponent(q.trim());
    const url = c.buscar.replace("{q}", qq);
    return c.afiliado ? c.afiliado.replace("{url}", encodeURIComponent(url)) : url;
  }

  // Iconos pequeños de categoría (24x24, usan el color del texto)
  const ICO = {
    "Electrónica": '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M9 20h6M12 16v4"/>',
    "Hogar y cocina": '<path d="M4 11h16v5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/><path d="M2 11h20M9 8c0-1.5 1-1.5 1-3M14 8c0-1.5 1-1.5 1-3"/>',
    "Deportes": '<path d="M7 12h10"/><rect x="4" y="8" width="3" height="8" rx="1"/><rect x="17" y="8" width="3" height="8" rx="1"/><path d="M2 10v4M22 10v4"/>',
    "Belleza": '<rect x="8" y="9" width="8" height="12" rx="2"/><rect x="10" y="4" width="4" height="5" rx="1"/>',
    "Mascotas": '<circle cx="12" cy="15" r="4"/><circle cx="6" cy="10" r="1.8"/><circle cx="9.5" cy="6.5" r="1.8"/><circle cx="14.5" cy="6.5" r="1.8"/><circle cx="18" cy="10" r="1.8"/>',
    "Moda": '<path d="M9 4 4 7l2 4 2-1v10h8V10l2 1 2-4-5-3a3 3 0 0 1-6 0z"/>',
    "Juguetes": '<rect x="3" y="13" width="8" height="7" rx="1"/><rect x="13" y="13" width="8" height="7" rx="1"/><rect x="8" y="5" width="8" height="7" rx="1"/>',
    "Herramientas": '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/>',
    "Todas": '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>'
  };
  const icono = (c) => `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO[c] || ICO["Todas"]}</svg>`;
  const FLECHA = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>';
  const MAS = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';

  /* Imagen provisional cuando el producto aún no tiene fotos de la tienda.
     Se dibuja como una foto de estudio: fondo suave, el objeto y su sombra. */
  const TONOS = { "Electrónica": 214, "Hogar y cocina": 24, "Deportes": 152, "Belleza": 334, "Mascotas": 38, "Moda": 268, "Juguetes": 190, "Herramientas": 8 };
  function imagenesProvisionales(p) {
    const h = TONOS[p.categoria] ?? 200;
    const path = ICO[p.categoria] || ICO["Todas"];
    const vistas = [
      { bg: 78, rot: 0, s: 7.2 },
      { bg: 66, rot: -12, s: 6.4 },
      { bg: 22, rot: 8, s: 8.2 }
    ];
    return vistas.map((v, i) => {
      const fg = i === 2 ? `hsl(${h} 70% 78%)` : `hsl(${h} 60% 22%)`;
      const off = 150 - 12 * v.s; // centra el icono de 24px escalado
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><rect width="300" height="300" fill="hsl(${h} 50% ${v.bg}%)"/><ellipse cx="150" cy="252" rx="86" ry="10" fill="hsl(${h} 40% 12%)" opacity=".18"/><g transform="rotate(${v.rot} 150 140) translate(${off} ${off - 10}) scale(${v.s})" fill="none" stroke="${fg}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${path}</g><text x="286" y="290" text-anchor="end" font-family="sans-serif" font-size="10" fill="${fg}" opacity=".55">ejemplo · sample</text></svg>`;
      return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    });
  }

  function normalizar(s) { return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function esc(s) { return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
  const fecha = (f) => { if (!f) return ""; const d = new Date(f + "T12:00:00"); return isNaN(d) ? f : d.toLocaleDateString(i18n.locale, { day: "numeric", month: "short", year: "numeric" }); };
  // Textos traducidos (i18n.js): T("clave", {huecos}), CAT(categoría), TIT(producto)
  const T = (k, v) => i18n.t(k, v), CAT = (c) => i18n.cat(c), TIT = (p) => i18n.titulo(p);
  const $ = (s) => document.querySelector(s);
  const safe = (fn) => { try { fn(); } catch (e) { console.error(e); } };

  /* Urgencia: campos opcionales de cada producto (ver productos.js)
     - publicado: "AAAA-MM-DD" -> etiqueta «Nueva» durante 2 días
     - termina:   "AAAA-MM-DD" o "AAAA-MM-DDTHH:MM" -> «Termina en…»; pasada la fecha, la oferta deja de mostrarse */
  const DIA = 864e5;
  const finDe = (p) => { if (!p.termina) return 0; const d = new Date(p.termina.length <= 10 ? p.termina + "T23:59:59" : p.termina); return isNaN(d) ? 0 : d.getTime(); };
  const vigente = (p) => !finDe(p) || finDe(p) > Date.now();
  const esNueva = (p) => { if (!p.publicado) return false; const d = new Date(p.publicado + "T00:00:00").getTime(); return !isNaN(d) && Date.now() - d < 2 * DIA && Date.now() >= d; };
  function quedan(p) {
    const ms = finDe(p) - Date.now();
    if (!finDe(p) || ms <= 0) return null;
    const h = Math.ceil(ms / 36e5);
    if (h <= 36) return { txt: T("deal.endsH", { n: h }), urgente: true };
    const d = Math.ceil(ms / DIA);
    return { txt: d <= 1 ? T("deal.ends1") : T("deal.endsD", { n: d }), urgente: d <= 2 };
  }

  const productos = (window.PRODUCTOS || []).filter(vigente).map((p) => {
    const descuento = p.precioAnterior && p.precioAnterior > p.precio ? Math.round((1 - p.precio / p.precioAnterior) * 100) : 0;
    const r = {
      ...p,
      descuento,
      ahorro: descuento ? p.precioAnterior - p.precio : 0,
      _texto: normalizar([p.titulo, p.tituloEn || "", p.tienda, p.categoria, i18n.catEn(p.categoria)].join(" "))
    };
    // Sin fotos: la imagen provisional se dibuja solo cuando alguna parte de la web la pide
    if (!(p.imagenes && p.imagenes.length)) {
      let cache = null;
      Object.defineProperty(r, "imagenes", { get: () => cache || (cache = imagenesProvisionales(p)), enumerable: true });
    }
    return r;
  });
  const porId = new Map(productos.map((p) => [p.id, p]));

  const estado = { q: "", categoria: "Todas", tiendas: new Set(), orden: "relevancia", grupo: "ninguno", favoritos: false, min: 0, max: 0, comparar: [] };

  /* Ordenar y agrupar (menús «Ordenado por» y «Agrupado por» del catálogo) */
  const ORDENES = ["relevancia", "tendencias", "recientes", "popularidad", "descuento", "ahorro", "precio-asc", "precio-desc", "valoracion"];
  const GRUPOS = ["ninguno", "tipo", "categoria", "tienda", "marca"];
  const fechaDe = (p) => p.publicado || p.actualizado || "";
  const votosDe = (p) => comunidad.total[p.id] || 0;
  const recientesDe = (p) => comunidad.recientes[p.id] || 0;
  // Popularidad: votos de la comunidad y, a igualdad, reseñas y nota en la tienda
  const popularidad = (p) => votosDe(p) * 1000 + Math.log10((p.resenas || 0) + 1) * (p.valoracion || 3);
  // Tendencia: votos de las últimas 48 h, novedad, urgencia y descuento
  const tendencia = (p) => recientesDe(p) * 3 + votosDe(p) + (esNueva(p) ? 4 : 0) + (quedan(p)?.urgente ? 2 : 0) + p.descuento / 10 + Math.log10((p.resenas || 0) + 1) / 2;

  // Tipo de oferta: el campo «tipo» si existe; si no, se deduce del producto
  const TIPOS = ["flash", "gran", "rebaja", "normal"];
  const tipoDe = (p) => (p.tipo ? "x:" + p.tipo : finDe(p) ? "flash" : p.descuento >= 40 ? "gran" : p.descuento > 0 ? "rebaja" : "normal");
  const claveGrupo = (p) => ({ tipo: tipoDe, categoria: (x) => x.categoria, tienda: (x) => x.tienda, marca: (x) => x.marca || "" })[estado.grupo]?.(p) ?? "";
  function nombreGrupo(k) {
    if (estado.grupo === "tipo") return k.startsWith("x:") ? k.slice(2) : T("tipo." + k);
    if (estado.grupo === "categoria") return CAT(k);
    if (estado.grupo === "marca") return k || T("marca.otras");
    return k;
  }

  /* Piezas reutilizables */
  const marcaTienda = (t) => `<i style="--c:${TIENDAS[t] || "#888"}"></i>`;
  const estrellas = (p) => p.valoracion ? `<span class="stars">${T("card.rating", { r: p.valoracion.toFixed(1), n: (p.resenas || 0).toLocaleString("en-US") })}</span>` : "";
  const precios = (p) => `<div class="price-row"><span class="price">${money.format(p.precio)}</span>${p.descuento ? `<span class="was">${money.format(p.precioAnterior)}</span>` : ""}</div>`;
  const CHECK = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
  const RELOJ = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>';
  /* Historial de precios (campo «historial»): mínimo, máximo y media de los últimos 90 días,
     y aviso de descuento dudoso cuando el «precio antes» no aparece en el historial */
  function analisis(p) {
    const h = (p.historial || []).filter((x) => Array.isArray(x) && x.length === 2 && typeof x[0] === "string" && isFinite(x[1]));
    if (h.length < 4) return null;
    const corte = new Date(Date.now() - 90 * DIA).toISOString().slice(0, 10);
    const ult = h.filter((x) => x[0] >= corte), usa = ult.length >= 4 ? ult : h;
    const precios = usa.map((x) => x[1]), previos = precios.slice(0, -1);
    const min = Math.min(...precios), max = Math.max(...precios), media = precios.reduce((a, b) => a + b, 0) / precios.length;
    return {
      h: usa, min, max, media,
      minimo: p.precio <= min + 0.005 && previos.some((v) => v > p.precio + 0.005),
      dudoso: !!(p.precioAnterior && Math.max(...previos) < p.precioAnterior * 0.97)
    };
  }
  const esErrorPrecio = (p) => !!p.errorPrecio || p.descuento >= 70;
  const AVISO = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 2 20h20L12 3Z"/><path d="M12 10v4M12 17h.01"/></svg>';
  const TIJERA = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><path d="M8 7.5 20 17M8 16.5 20 7"/></svg>';
  const RAYO = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/></svg>';
  function etiquetas(p) {
    const q = quedan(p), f = [], an = analisis(p);
    if (esErrorPrecio(p)) f.push(`<span class="flag ends hot" title="${esc(T("deal.errorTip"))}">${RAYO}${T("deal.error")}</span>`);
    if (an?.minimo) f.push(`<span class="flag ok" title="${esc(T("hist.minTip"))}">${CHECK}${T("deal.min90")}</span>`);
    if (an?.dudoso) f.push(`<span class="flag warn" title="${esc(T("hist.fakeTip"))}">${AVISO}${T("deal.fake")}</span>`);
    if (p.cupon) f.push(`<span class="flag new">${TIJERA}${T("deal.coupon")}</span>`);
    if (p.prime) f.push(`<span class="flag prime">Prime</span>`);
    if (p.verificado) f.push(`<span class="flag ok" title="${esc(T("deal.verifiedTip"))}">${CHECK}${T("deal.verified")}</span>`);
    if (esNueva(p)) f.push(`<span class="flag new">${T("deal.new")}</span>`);
    if (comunidad.enTendencia.has(p.id)) f.push(`<span class="flag trend"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/></svg>${T("deal.trending")}</span>`);
    if (q) f.push(`<span class="flag ends${q.urgente ? " hot" : ""}">${RELOJ}${esc(q.txt)}</span>`);
    return f.length ? `<div class="flags">${f.join("")}</div>` : "";
  }
  const PULGAR_ARR = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/></svg>';
  const PULGAR_ABA = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"/></svg>';
  const conSigno = (n) => (n > 0 ? "+" + n : String(n));
  /* Votos de la comunidad: puntuación + «Buena» / «Mala». completo = versión grande de la ficha */
  function votos(p, completo) {
    if (!COMUNIDAD) return "";
    const mio = comunidad.mios[p.id] || 0, n = comunidad.total[p.id] || 0;
    const caja = `<div class="vote${completo ? " big" : ""}" data-voto="${esc(p.id)}" role="group" aria-label="${esc(T("vote.score", { n }))}">
      <span class="vote-score${n > 0 ? " pos" : n < 0 ? " neg" : ""}"><small>${T("vote.scoreLab")}</small><b class="score">${conSigno(n)}</b></span>
      <button class="vote-btn up" type="button" data-votar="1" aria-pressed="${mio === 1}" aria-label="${esc(T("vote.up"))}" title="${esc(T("vote.up"))}">${PULGAR_ARR}<span>${T(completo ? "vote.up" : "vote.upShort")}</span></button>
      <button class="vote-btn down" type="button" data-votar="-1" aria-pressed="${mio === -1}" aria-label="${esc(T("vote.down"))}" title="${esc(T("vote.down"))}">${PULGAR_ABA}<span>${T(completo ? "vote.down" : "vote.downShort")}</span></button></div>`;
    return completo ? `<section class="vote-block"><h3>${T("vote.title")}</h3>${caja}</section>` : caja;
  }
  const enlace = (p, texto) => `<a class="cta" href="${esc(p.enlace)}" target="_blank" rel="sponsored nofollow noopener">${texto} ${FLECHA}</a>`;

  /* Filtros */
  function filtrar() {
    const palabras = normalizar(estado.q).split(/\s+/).filter(Boolean);
    let lista = productos.filter((p) =>
      (estado.categoria === "Todas" || p.categoria === estado.categoria) &&
      (estado.tiendas.size === 0 || estado.tiendas.has(p.tienda)) &&
      (!estado.max || p.precio <= estado.max) &&
      (!estado.min || p.precio >= estado.min) &&
      (!estado.favoritos || cuenta.favoritos.has(p.id)) &&
      palabras.every((w) => p._texto.includes(w))
    );
    const ord = {
      "precio-asc": (a, b) => a.precio - b.precio,
      "precio-desc": (a, b) => b.precio - a.precio,
      "descuento": (a, b) => b.descuento - a.descuento,
      "ahorro": (a, b) => b.ahorro - a.ahorro,
      "valoracion": (a, b) => (b.valoracion || 0) - (a.valoracion || 0),
      "recientes": (a, b) => fechaDe(b).localeCompare(fechaDe(a)) || b.descuento - a.descuento,
      "popularidad": (a, b) => popularidad(b) - popularidad(a),
      "tendencias": (a, b) => tendencia(b) - tendencia(a)
    }[estado.orden];
    if (ord) lista = lista.slice().sort(ord);
    if (estado.grupo !== "ninguno") {
      // Grupos: los tipos en orden fijo; el resto, de más a menos ofertas («Otras marcas» al final)
      const n = new Map();
      lista.forEach((p) => { const k = claveGrupo(p); n.set(k, (n.get(k) || 0) + 1); });
      const rango = (k) => estado.grupo === "tipo" ? (k.startsWith("x:") ? 2.5 : TIPOS.indexOf(k)) : k === "" ? Infinity : -n.get(k);
      const orden = [...n.keys()].sort((a, b) => rango(a) - rango(b) || nombreGrupo(a).localeCompare(nombreGrupo(b), i18n.lang));
      const pos = new Map(orden.map((k, i) => [k, i]));
      lista = lista.slice().sort((a, b) => pos.get(claveGrupo(a)) - pos.get(claveGrupo(b))); // sort estable: respeta el orden elegido dentro de cada grupo
      cuentaGrupos = n;
    }
    return lista;
  }
  function contar(campo) {
    const m = new Map();
    productos.forEach((p) => m.set(p[campo], (m.get(p[campo]) || 0) + 1));
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0], "es"));
  }

  /* Portada: oferta del día, tira de las más rebajadas y categorías */
  const porDescuento = () => productos.slice().sort((a, b) => b.descuento - a.descuento || (b.valoracion || 0) - (a.valoracion || 0));

  /* Las rebajas más fuertes: carrusel que avanza hacia la izquierda cada 5 segundos.
     La primera imagen va en grande y su ficha se muestra a la izquierda. */
  const ROTAR_CADA = 5000, EN_GIRO = 8;
  let giro = [], giroPausa = false;
  function pintarDestacada(p) {
    $("#oferta-dia").innerHTML = `<span class="lab">${T(p === giro[0] ? "top.dealOfDay" : "top.featured")}</span>${etiquetas(p)}<h3>${esc(TIT(p))}</h3>${precios(p)}
      <p class="save">${T("top.saveIn", { a: money.format(p.ahorro), d: p.descuento, s: esc(p.tienda) })}</p>${enlace(p, T("top.seeDeal", { s: esc(p.tienda) }))}`;
  }
  function pintarPortada() {
    if ($("#hero-cta")) $("#hero-cta").textContent = T("hero.ctaN", { n: productos.length });
    giro = porDescuento().slice(0, EN_GIRO);
    if (!giro.length) { $("#destacadas").hidden = true; return; }
    pintarDestacada(giro[0]);
    $("#run-track").innerHTML = giro.map((p, k) => `<div class="run-item${k === 0 ? " lifted" : ""}" data-id="${esc(p.id)}">
        <button type="button" data-abrir="${esc(p.id)}" aria-label="${esc(T("card.viewSheet", { t: TIT(p) }))}"><img src="${esc(p.imagenes[0])}" alt="${esc(TIT(p))}" loading="lazy"></button>
        <span class="meta"><span>${esc(p.tienda)}</span>${p.descuento ? `<span class="v">-${p.descuento}%</span>` : ""}</span></div>`).join("");
  }
  function avanzarGiro() {
    const track = $("#run-track"), first = track.firstElementChild;
    if (!first || track.children.length < 2) return;
    const nota = $("#oferta-dia");
    const cerrar = () => {
      track.style.transition = "none";
      track.appendChild(first);
      first.classList.remove("lifted");
      track.firstElementChild.classList.add("lifted");
      track.style.transform = "";
      void track.offsetWidth;
      track.style.transition = "";
      pintarDestacada(porId.get(track.firstElementChild.dataset.id));
      nota.classList.remove("cambia");
    };
    nota.classList.add("cambia");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return cerrar();
    const dx = first.getBoundingClientRect().width + 8;
    track.style.transition = "transform .7s cubic-bezier(0.22, 1, 0.36, 1)";
    track.style.transform = `translateX(${-dx}px)`;
    let hecho = false;
    const fin = () => { if (!hecho) { hecho = true; cerrar(); } };
    track.addEventListener("transitionend", (e) => { if (e.target === track) fin(); }, { once: true });
    setTimeout(fin, 900);
  }
  function pintarTiendasPortada() {
    if (!$("#cats-hero")) return;
    $("#cats-hero").innerHTML = categoriasOrdenadas().map(([c, n]) =>
      `<button class="row" type="button" data-cat="${esc(c)}" aria-pressed="${c === estado.categoria}">${icono(c)}<span>${esc(CAT(c))}</span><span class="v">${n}</span></button>`).join("");
  }

  // Categorías ordenadas por su nombre en el idioma actual
  const categoriasOrdenadas = () => contar("categoria").sort((a, b) => CAT(a[0]).localeCompare(CAT(b[0]), i18n.lang));
  function pintarCategorias() {
    const cats = [["Todas", productos.length], ...categoriasOrdenadas()];
    $("#cats").innerHTML = cats.map(([c, n]) =>
      `<button class="chip" type="button" data-cat="${esc(c)}" aria-pressed="${c === estado.categoria}">${icono(c)}${esc(CAT(c))}<span class="n">${n}</span></button>`
    ).join("");
  }
  function pintarTiendasFiltro() {
    $("#tiendas").innerHTML = contar("tienda").map(([t, n]) =>
      `<label class="check"><input type="checkbox" value="${esc(t)}" ${estado.tiendas.has(t) ? "checked" : ""}><span class="store">${marcaTienda(t)}${esc(t)}</span><span class="n">${n}</span></label>`
    ).join("");
  }

  /* Catálogo */
  function tarjeta(p) {
    const enComp = estado.comparar.includes(p.id);
    return `<article class="card">
      <div class="card-media">
        <button class="card-img" type="button" data-abrir="${esc(p.id)}" aria-label="${esc(T("card.viewPhotos", { t: TIT(p) }))}"><img src="${esc(p.imagenes[0])}" alt="${esc(TIT(p))}" loading="lazy"></button>
        ${p.descuento ? `<span class="badge-off">-${p.descuento}%</span>` : ""}
        ${p.imagenes.length > 1 ? `<span class="img-count">${T("card.photos", { n: p.imagenes.length })}</span>` : ""}
        <button class="cmp" type="button" data-comparar="${esc(p.id)}" aria-pressed="${enComp}" aria-label="${esc(T("card.compareX", { t: TIT(p) }))}">${MAS}<span class="t">${T(enComp ? "card.compareOn" : "card.compare")}</span></button>
        ${botonesCuenta(p)}
      </div>
      <div class="card-body">
        ${etiquetas(p)}
        <span class="store">${marcaTienda(p.tienda)}${esc(p.tienda)}<span class="cat">· ${esc(CAT(p.categoria))}</span></span>
        <h3 class="card-title"><button type="button" data-abrir="${esc(p.id)}">${esc(TIT(p))}</button></h3>
        ${estrellas(p)}
        ${precios(p)}
        ${p.descuento ? `<span class="saving">${T("card.save", { a: money.format(p.ahorro) })}</span>` : ""}
        ${votos(p)}
        ${enlace(p, T("card.seeAt", { s: esc(p.tienda) }))}
        <span class="updated">${T("card.updated", { d: esc(fecha(p.actualizado)) })}</span>
      </div>
    </article>`;
  }
  function pintarEnTodas() {
    const box = $("#everywhere");
    const q = estado.q;
    if (!q) { box.hidden = true; box.innerHTML = ""; return; }
    const tiendas = Object.keys(BUSQUEDA_TIENDAS);
    box.innerHTML = `<p class="ew-title">${T("ew.title", { q: esc(q) })}</p>
      <div class="ew-row">${tiendas.map((t) => `<a class="ew-btn" style="--c:${TIENDAS[t] || "#888"}" href="${esc(urlBusqueda(t, q))}" target="_blank" rel="sponsored nofollow noopener"><span class="mono" aria-hidden="true">${esc(t[0])}</span>${esc(t)} ${FLECHA}</a>`).join("")}</div>`;
    box.hidden = false;
  }
  /* Catálogo por tandas: con cientos de productos, pintar todos de golpe vuelve lenta la página en el móvil */
  const POR_TANDA = 24;
  let listaActual = [], visibles = POR_TANDA, cuentaGrupos = new Map();
  function tanda(desde, hasta) {
    const partes = [];
    const agrupar = estado.grupo !== "ninguno";
    listaActual.slice(desde, hasta).forEach((p, k) => {
      const i = desde + k;
      if (agrupar) {
        const g = claveGrupo(p);
        if (i === 0 || claveGrupo(listaActual[i - 1]) !== g) partes.push(`<h3 class="group-head">${estado.grupo === "categoria" ? icono(g) : estado.grupo === "tienda" ? marcaTienda(g) : ""}<span>${esc(nombreGrupo(g))}</span><span class="n">${cuentaGrupos.get(g) || ""}</span></h3>`);
      }
      partes.push(tarjeta(p));
    });
    return partes.join("");
  }
  function pintarMas() {
    const quedan = listaActual.length - visibles;
    const b = $("#ver-mas");
    b.hidden = quedan <= 0;
    if (quedan > 0) b.textContent = T("results.more", { n: Math.min(POR_TANDA, quedan), total: listaActual.length - visibles });
  }
  function verMas() {
    const desde = visibles;
    visibles = Math.min(listaActual.length, visibles + POR_TANDA);
    $("#grid").insertAdjacentHTML("beforeend", tanda(desde, visibles));
    pintarMas();
    const nueva = $("#grid").querySelectorAll(".card")[desde];
    if (nueva) nueva.querySelector("button")?.focus({ preventScroll: true });
  }
  // mantener = true conserva cuántas tandas se han abierto (cambio de idioma, comparador)
  function pintar(mantener) {
    const lista = filtrar();
    listaActual = lista;
    if (mantener !== true) visibles = POR_TANDA;
    visibles = Math.min(Math.max(visibles, POR_TANDA), Math.max(lista.length, POR_TANDA));
    safe(pintarEnTodas);
    $("#grid").innerHTML = tanda(0, visibles) || (estado.favoritos ? `<div class="empty">${T("fav.empty")} <button class="linkbtn" type="button" data-limpiar>${T("results.emptyBtn")}</button>.</div>` : "") || `<div class="empty"><strong>${estado.q ? T("results.emptyQueryTitle", { q: esc(estado.q) }) : T("results.emptyTitle")}</strong><br>${T(estado.q ? "results.emptyQueryText" : "results.emptyText")} <button class="linkbtn" type="button" data-limpiar>${T(estado.q ? "results.emptyQueryBtn" : "results.emptyBtn")}</button>.</div>`;
    let titulo = T("cat.allDeals");
    if (estado.favoritos) titulo = T("fav.title");
    else if (estado.q) titulo = T("results.for", { q: estado.q });
    else if (estado.categoria !== "Todas") titulo = CAT(estado.categoria);
    else if (estado.tiendas.size === 1) titulo = T("results.store", { s: [...estado.tiendas][0] });
    $("#titulo").textContent = titulo;
    pintarMas();
    // En móvil los filtros están plegados: el botón dice cuántos hay activos
    const activos = estado.tiendas.size + (estado.categoria !== "Todas" ? 1 : 0) + (estado.min || estado.max ? 1 : 0);
    $("#toggle-filtros").textContent = activos ? T("tools.filtersN", { n: activos }) : T("tools.filters");
    const nt = new Set(lista.map((p) => p.tienda)).size;
    $("#conteo").textContent = `${T(lista.length === 1 ? "results.products1" : "results.productsN", { n: lista.length })} · ${T(nt === 1 ? "results.stores1" : "results.storesN", { n: nt })}`;
    document.querySelectorAll("#cats .chip").forEach((b) => b.setAttribute("aria-pressed", b.dataset.cat === estado.categoria));
    document.querySelectorAll("#stores [data-tienda]").forEach((b) => b.setAttribute("aria-pressed", estado.tiendas.size === 1 && estado.tiendas.has(b.dataset.tienda)));
    document.querySelectorAll("#stores [data-cat]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.cat === estado.categoria));
  }

  /* Cupón, oferta relámpago (% reclamado) y cuenta atrás en la ficha */
  function extrasFicha(p) {
    const partes = [];
    if (p.cupon) {
      const c = typeof p.cupon === "string" ? { texto: p.cupon } : p.cupon;
      partes.push(`<div class="coupon">${TIJERA}<span>${esc(c.texto || T("deal.coupon"))}</span>${c.codigo ? `<button class="coupon-code" type="button" data-copiar="${esc(c.codigo)}" aria-label="${esc(T("coupon.copyX", { c: c.codigo }))}"><code>${esc(c.codigo)}</code><span>${T("coupon.copy")}</span></button>` : ""}</div>`);
    }
    if (p.prime) partes.push(`<p class="prime-note"><span class="flag prime">Prime</span> ${T("deal.primeTip")}</p>`);
    const fin = finDe(p), ms = fin - Date.now();
    if (fin && ms > 0 && ms < 2 * DIA) partes.push(`<p class="countdown">${RELOJ}<span>${T("deal.endsIn")}</span> <b data-cuenta-atras="${fin}">${cuentaAtras(ms)}</b></p>`);
    if (isFinite(p.reclamado) && p.reclamado > 0) {
      const v = Math.min(100, Math.max(0, Math.round(p.reclamado)));
      partes.push(`<div class="claimed"><div class="claimed-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${v}" aria-label="${esc(T("deal.claimed", { n: v }))}"><i style="width:${v}%"></i></div><span>${RAYO}${T("deal.claimed", { n: v })}</span></div>`);
    }
    return partes.join("");
  }
  function cuentaAtras(ms) {
    const t = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), sg = t % 60;
    return `${h}:${String(m).padStart(2, "0")}:${String(sg).padStart(2, "0")}`;
  }
  setInterval(() => { document.querySelectorAll("[data-cuenta-atras]").forEach((el) => { el.textContent = cuentaAtras(+el.dataset.cuentaAtras - Date.now()); }); }, 1000);

  /* Gráfica del historial de precios: una sola línea escalonada (el precio cambia a saltos),
     rejilla discreta, mínimo marcado, línea del «precio antes» y lectura al pasar el ratón */
  function graficaHistorial(p) {
    const an = analisis(p); if (!an) return "";
    const W = 640, H = 220, L = 0, Rm = 0, Tp = 14, B = 28; // el SVG ocupa solo la zona de la línea; las etiquetas van fuera
    const t0 = new Date(an.h[0][0]).getTime(), t1 = new Date(an.h[an.h.length - 1][0]).getTime() || t0 + 1;
    const valores = an.h.map((x) => x[1]).concat(p.precioAnterior ? [p.precioAnterior] : []);
    let lo = Math.min(...valores), hi = Math.max(...valores); const pad = (hi - lo) * 0.12 || hi * 0.1 || 1; lo = Math.max(0, lo - pad); hi += pad;
    const X = (d) => L + ((new Date(d).getTime() - t0) / Math.max(1, t1 - t0)) * (W - L - Rm);
    const Y = (v) => Tp + (1 - (v - lo) / (hi - lo)) * (H - Tp - B);
    let d = ""; an.h.forEach((x, i) => { d += i ? `H${X(x[0]).toFixed(1)}V${Y(x[1]).toFixed(1)}` : `M${X(x[0]).toFixed(1)},${Y(x[1]).toFixed(1)}`; });
    const marcas = [lo + (hi - lo) * 0.15, lo + (hi - lo) * 0.5, lo + (hi - lo) * 0.85];
    // Las etiquetas van en HTML encima del SVG: así no se deforman al estirar la gráfica a lo ancho
    const pctY = (y) => (y / H) * 100;
    const posX = (x) => `calc(var(--g-l) + (100% - var(--g-l) - var(--g-r)) * ${(x / W).toFixed(4)})`;
    const rejilla = marcas.map((v) => `<line x1="${L}" x2="${W - Rm}" y1="${Y(v)}" y2="${Y(v)}" class="g-grid"/>`).join("");
    const etiquetasY = marcas.map((v) => `<span class="g-lab g-y" style="top:${pctY(Y(v)).toFixed(2)}%">${money.format(v)}</span>`).join("");
    const etiquetasX = [an.h[0], an.h[Math.floor(an.h.length / 2)], an.h[an.h.length - 1]].map((x, i) => `<span class="g-lab g-x g-x${i}" style="left:${posX(X(x[0]))}">${esc(fecha(x[0]))}</span>`).join("");
    const iMin = an.h.findIndex((x) => x[1] === an.min), pm = an.h[iMin];
    const antes = p.precioAnterior ? `<line x1="${L}" x2="${W - Rm}" y1="${Y(p.precioAnterior)}" y2="${Y(p.precioAnterior)}" class="g-ref"/>` : "";
    const antesLab = p.precioAnterior ? `<span class="g-lab g-ref-lab" style="top:${pctY(Y(p.precioAnterior)).toFixed(2)}%">${T("hist.before", { p: money.format(p.precioAnterior) })}</span>` : "";
    const ult = an.h[an.h.length - 1];
    const tabla = `<table class="sr"><caption>${T("hist.title")}</caption><thead><tr><th>${T("hist.date")}</th><th>${T("cmp.price")}</th></tr></thead><tbody>${an.h.map((x) => `<tr><td>${esc(fecha(x[0]))}</td><td>${money.format(x[1])}</td></tr>`).join("")}</tbody></table>`;
    return `<section class="hist" aria-labelledby="hist-title">
      <div class="hist-head"><h3 id="hist-title">${T("hist.title")}</h3><span class="hist-sub">${T("hist.sub", { n: an.h.length })}</span></div>
      ${an.dudoso ? `<p class="hist-alert warn">${AVISO}<span>${T("hist.fake", { p: money.format(p.precioAnterior), m: money.format(Math.max(...an.h.slice(0, -1).map((x) => x[1]))) })}</span></p>` : an.minimo ? `<p class="hist-alert ok">${CHECK}<span>${T("hist.isMin")}</span></p>` : ""}
      <dl class="hist-stats">
        <div><dt>${T("hist.now")}</dt><dd>${money.format(p.precio)}</dd></div>
        <div><dt>${T("hist.min")}</dt><dd>${money.format(an.min)}</dd></div>
        <div><dt>${T("hist.avg")}</dt><dd>${money.format(an.media)}</dd></div>
        <div><dt>${T("hist.max")}</dt><dd>${money.format(an.max)}</dd></div>
      </dl>
      <div class="hist-chart" data-hist="${esc(p.id)}">
        <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(T("hist.aria", { a: money.format(an.min), b: money.format(an.max), c: money.format(p.precio) }))}" preserveAspectRatio="none">
          ${rejilla}${antes}
          <path d="${d}" class="g-line"/>
          <line class="g-cross" y1="${Tp}" y2="${H - B}" x1="-10" x2="-10"/>
        </svg>
        ${etiquetasY}${etiquetasX}${antesLab}
        <span class="g-dot g-min" style="left:${posX(X(pm[0]))};top:${pctY(Y(pm[1])).toFixed(2)}%"></span>
        <span class="g-dot g-now" style="left:${posX(X(ult[0]))};top:${pctY(Y(ult[1])).toFixed(2)}%"></span>
        <div class="g-tip" hidden></div>
      </div>${tabla}
    </section>`;
  }
  // Lectura al pasar el ratón o el dedo por la gráfica: fecha y precio del punto más cercano
  document.addEventListener("pointermove", (e) => {
    const box = e.target.closest?.(".hist-chart"); if (!box) return;
    const p = porId.get(box.dataset.hist), an = p && analisis(p); if (!an) return;
    const svg = box.querySelector("svg"), r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal;
    const x = Math.min(Math.max(0, (e.clientX - r.left) / r.width), 1) * vb.width;
    const t0 = new Date(an.h[0][0]).getTime(), t1 = new Date(an.h[an.h.length - 1][0]).getTime();
    const t = t0 + (x / vb.width) * (t1 - t0);
    let i = an.h.length - 1; while (i > 0 && new Date(an.h[i][0]).getTime() > t) i--;
    const px = ((new Date(an.h[i][0]).getTime() - t0) / Math.max(1, t1 - t0)) * vb.width;
    const cross = box.querySelector(".g-cross"); cross.setAttribute("x1", px); cross.setAttribute("x2", px);
    const tip = box.querySelector(".g-tip"); tip.hidden = false;
    tip.innerHTML = `<span>${esc(fecha(an.h[i][0]))}</span><b>${money.format(an.h[i][1])}</b>`;
    const caja = box.getBoundingClientRect(), left = r.left - caja.left + (px / vb.width) * r.width;
    tip.style.left = Math.min(Math.max(left, 60), caja.width - 60) + "px";
  });
  document.addEventListener("pointerleave", (e) => {
    const box = e.target.closest?.(".hist-chart"); if (!box) return;
    box.querySelector(".g-tip").hidden = true; const c = box.querySelector(".g-cross"); c.setAttribute("x1", -10); c.setAttribute("x2", -10);
  }, true);
  // Copiar el código del cupón
  document.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-copiar]"); if (!b) return;
    try { await navigator.clipboard.writeText(b.dataset.copiar); } catch (er) { const t = document.createElement("textarea"); t.value = b.dataset.copiar; document.body.appendChild(t); t.select(); document.execCommand("copy"); t.remove(); }
    const sp = b.querySelector("span"); sp.textContent = T("coupon.copied"); setTimeout(() => { sp.textContent = T("coupon.copy"); }, 1600);
  });

  /* Ficha del producto */
  let fotoActual = 0;
  function abrir(id) {
    const p = porId.get(id);
    if (!p) return;
    fotoActual = 0;
    const similares = productos.filter((x) => x.id !== p.id && x.categoria === p.categoria)
      .sort((a, b) => Math.abs(a.precio - p.precio) - Math.abs(b.precio - p.precio)).slice(0, 4);
    const enComp = estado.comparar.includes(p.id);
    const d = $("#ficha");
    d.innerHTML = `<button class="close" type="button" aria-label="${T("sheet.close")}" data-cerrar>×</button>
      <div class="detail">
        <div class="gallery">
          <div class="main"><img id="foto" src="${esc(p.imagenes[0])}" alt="${esc(TIT(p))}">
            ${p.imagenes.length > 1 ? `<button class="gal-nav prev" type="button" data-mover="-1" aria-label="${T("sheet.prev")}">‹</button><button class="gal-nav next" type="button" data-mover="1" aria-label="${T("sheet.next")}">›</button>` : ""}
          </div>
          <div class="thumbs">${p.imagenes.map((src, i) => `<button type="button" data-foto="${i}" aria-current="${i === 0}" aria-label="${T("sheet.photoN", { n: i + 1 })}"><img src="${esc(src)}" alt=""></button>`).join("")}</div>
        </div>
        <div class="info">
          ${etiquetas(p)}
          <span class="store">${marcaTienda(p.tienda)}${esc(p.tienda)}<span class="cat">· ${esc(CAT(p.categoria))}</span></span>
          <h2>${esc(TIT(p))}</h2>
          ${estrellas(p)}
          <div>${precios(p)}${p.descuento ? `<span class="save">${T("sheet.saveFull", { a: money.format(p.ahorro), d: p.descuento })}</span>` : ""}</div>
          <div class="info-actions">${enlace(p, T("sheet.buyAt", { s: esc(p.tienda) }))}<button class="ghost" type="button" data-comparar="${esc(p.id)}" aria-pressed="${enComp}">${T(enComp ? "sheet.inCompare" : "card.compare")}</button>${botonesCuenta(p, true)}</div>
          <div class="share-row"><span>${T("link.label")}</span>
            <a class="btn-ghost share-btn" href="${esc(mailtoProducto(p))}">${ICO_SOBRE}<span>${T("link.email")}</span></a>
            <button class="btn-ghost share-btn" type="button" data-copiar-enlace="${esc(p.id)}">${ICO_ENLACE}<span>${T("link.copy")}</span></button></div>
          <div id="objetivo-box" data-id="${esc(p.id)}">${cajaObjetivo(p.id)}</div>
          ${extrasFicha(p)}
          ${votos(p, true)}
          <dl class="facts">
            <dt>${T("sheet.store")}</dt><dd>${esc(p.tienda)}</dd>
            <dt>${T("sheet.category")}</dt><dd>${esc(CAT(p.categoria))}</dd>
            <dt>${T("sheet.usual")}</dt><dd>${p.precioAnterior ? money.format(p.precioAnterior) : "—"}</dd>
            <dt>${T("sheet.photos")}</dt><dd>${p.imagenes.length}</dd>
          </dl>
          <p class="disclaimer">${T("sheet.disclaimer", { d: esc(fecha(p.actualizado)), s: esc(p.tienda) })}</p>
        </div>
        ${graficaHistorial(p)}
        ${COMUNIDAD ? `<section class="comments" id="comentarios" aria-labelledby="com-title"><h3 id="com-title">${T("com.title")}</h3>
          <div class="com-box" id="com-box" data-id="${esc(p.id)}">${cajaComentar(p.id)}</div>
          <div class="com-list" id="com-list"><p class="com-note">${T("com.loading")}</p></div></section>` : ""}
        ${similares.length ? `<div class="similar"><h3>${T("sheet.more", { c: esc(CAT(p.categoria)) })}</h3><div class="grid sim-grid">${similares.map(tarjeta).join("")}</div></div>` : ""}
      </div>`;
    d.dataset.id = id;
    // La dirección del navegador apunta a este producto (se puede copiar o recargar)
    try { const u = new URL(location.href); u.searchParams.set("producto", id); history.replaceState(null, "", u); } catch (e) {}
    if (COMUNIDAD) safe(() => cargarComentarios(id));
    if (sb && cuenta.seguidos.has(id)) safe(() => marcarSeguidoVisto(id));
    if (!d.open) { if (typeof d.showModal === "function") d.showModal(); else d.setAttribute("open", ""); }
    d.scrollTop = 0;
  }
  function verFoto(i) {
    const p = porId.get($("#ficha").dataset.id);
    if (!p) return;
    fotoActual = (i + p.imagenes.length) % p.imagenes.length;
    $("#foto").src = p.imagenes[fotoActual];
    document.querySelectorAll("[data-foto]").forEach((b) => b.setAttribute("aria-current", +b.dataset.foto === fotoActual));
  }

  /* Comparador */
  function refrescarComparar() {
    pintarBarraComparar();
    document.querySelectorAll("[data-comparar]").forEach((b) => {
      const on = estado.comparar.includes(b.dataset.comparar);
      b.setAttribute("aria-pressed", on);
      if (b.classList.contains("ghost")) b.textContent = T(on ? "sheet.inCompare" : "card.compare");
      const tx = b.querySelector(".t"); if (tx) tx.textContent = T(on ? "card.compareOn" : "card.compare");
    });
  }
  function alternarComparar(id) {
    const i = estado.comparar.indexOf(id);
    if (i >= 0) estado.comparar.splice(i, 1);
    else { if (estado.comparar.length >= MAX_COMPARAR) estado.comparar.shift(); estado.comparar.push(id); }
    refrescarComparar();
  }
  function pintarBarraComparar() {
    const n = estado.comparar.length;
    $("#compare-bar").hidden = n === 0;
    document.body.classList.toggle("has-compare", n > 0);
    const slots = estado.comparar.map((id) => { const p = porId.get(id); return `<div class="slot"><div class="ph"><img src="${esc(p.imagenes[0])}" alt="${esc(TIT(p))}"></div><button type="button" data-quitar="${esc(id)}" aria-label="${esc(T("cmp.remove", { t: TIT(p) }))}">×</button></div>`; });
    for (let i = n; i < MAX_COMPARAR; i++) slots.push(`<div class="slot"><div class="ph"></div></div>`);
    $("#compare-slots").innerHTML = slots.join("") + (n < 2 ? `<span class="compare-hint">${T("cmp.addAnother")}</span>` : n >= MAX_COMPARAR ? `<span class="compare-hint full">${T("cmp.full")}</span>` : "");
    $("#compare-open").disabled = n < 2;
    $("#compare-open").textContent = T("cmp.openN", { n });
  }
  function abrirComparador() {
    const ps = estado.comparar.map((id) => porId.get(id));
    const filas = [
      [T("cmp.price"), (p) => money.format(p.precio), (p) => -p.precio],
      [T("cmp.usual"), (p) => (p.precioAnterior ? money.format(p.precioAnterior) : "—"), null],
      [T("cmp.discount"), (p) => (p.descuento ? `-${p.descuento}%` : "—"), (p) => p.descuento],
      [T("cmp.saving"), (p) => (p.ahorro ? money.format(p.ahorro) : "—"), (p) => p.ahorro],
      [T("cmp.rating"), (p) => (p.valoracion ? T("cmp.ratingV", { r: p.valoracion.toFixed(1) }) : "—"), (p) => p.valoracion || 0],
      [T("cmp.reviews"), (p) => (p.resenas ? p.resenas.toLocaleString("en-US") : "—"), (p) => p.resenas || 0],
      [T("cmp.store"), (p) => esc(p.tienda), null],
      [T("cmp.category"), (p) => esc(CAT(p.categoria)), null],
      [T("cmp.asOf"), (p) => esc(fecha(p.actualizado)), null]
    ];
    const cuerpo = filas.map(([nombre, ver, puntuar]) => {
      const mejor = puntuar ? Math.max(...ps.map(puntuar)) : null;
      return `<tr><th scope="row">${nombre}</th>${ps.map((p) => `<td class="${puntuar && puntuar(p) === mejor ? "best" : ""}">${ver(p)}</td>`).join("")}</tr>`;
    }).join("");
    const d = $("#comparador");
    d.innerHTML = `<button class="close" type="button" aria-label="${T("sheet.close")}" data-cerrar>×</button>
      <div class="cmp-wrap"><h2>${T("cmp.title")}</h2><div class="cmp-scroll"><table class="cmp-table">
        <thead><tr><th></th>${ps.map((p) => `<th scope="col"><img src="${esc(p.imagenes[0])}" alt=""><span>${esc(TIT(p))}</span></th>`).join("")}</tr></thead>
        <tbody>${cuerpo}<tr><th scope="row"></th>${ps.map((p) => `<td>${enlace(p, T("card.seeAt", { s: esc(p.tienda) }))}</td>`).join("")}</tr></tbody>
      </table></div><p class="disclaimer">${T("cmp.note")}</p></div>`;
    if (typeof d.showModal === "function") d.showModal(); else d.setAttribute("open", "");
  }

  /* Eventos */
  let t;
  // Lleva la vista a los resultados (si ya están arriba en pantalla, no se mueve). El cursor sigue en el buscador.
  function irAResultados() {
    const cat = $("#catalogo"), cab = $(".top").getBoundingClientRect().bottom;
    const arriba = cat.getBoundingClientRect().top - cab;
    if (arriba > 24 || arriba < -cat.offsetHeight + 200) cat.scrollIntoView({ block: "start" });
  }
  let tBajar;
  $("#q").addEventListener("input", (e) => {
    clearTimeout(t); clearTimeout(tBajar);
    t = setTimeout(() => { estado.q = e.target.value.trim(); pintar(); }, 120);
    // Al dejar de escribir un momento, la página baja sola hasta los resultados
    tBajar = setTimeout(() => { if (e.target.value.trim()) irAResultados(); }, 600);
  });
  $("#buscador").addEventListener("submit", (e) => {
    e.preventDefault(); clearTimeout(tBajar); estado.q = $("#q").value.trim(); pintar();
    $("#catalogo").scrollIntoView({ block: "start" });
  });
  $("#cats").addEventListener("click", (e) => { const b = e.target.closest("[data-cat]"); if (b) { estado.categoria = b.dataset.cat; pintar(); } });
  $("#stores")?.addEventListener("click", (e) => {
    const c = e.target.closest("[data-cat]");
    if (c) { estado.categoria = estado.categoria === c.dataset.cat ? "Todas" : c.dataset.cat; pintar(); $("#catalogo").scrollIntoView({ block: "start" }); return; }
    const b = e.target.closest("[data-tienda]"); if (!b) return;
    const v = b.dataset.tienda;
    const soloEsta = estado.tiendas.size === 1 && estado.tiendas.has(v);
    estado.tiendas.clear();
    if (!soloEsta) estado.tiendas.add(v);
    pintarTiendasFiltro(); pintar();
    $("#catalogo").scrollIntoView({ block: "start" });
  });
  $("#tiendas").addEventListener("change", (e) => { const v = e.target.value; e.target.checked ? estado.tiendas.add(v) : estado.tiendas.delete(v); pintar(); });
  /* Menús desplegables «Ordenado por» y «Agrupado por» */
  const MENUS = { orden: { opciones: ORDENES, clave: (v) => "sort." + v, titulo: "sort.menu" }, grupo: { opciones: GRUPOS, clave: (v) => "group." + v, titulo: "group.menu" } };
  function pintarMenus() {
    document.querySelectorAll("[data-menu]").forEach((m) => {
      const cfg = MENUS[m.dataset.menu], actual = estado[m.dataset.menu];
      m.querySelector(".menu-val").textContent = T(cfg.clave(actual));
      const pop = m.querySelector(".menu-pop");
      pop.setAttribute("aria-label", T(cfg.titulo));
      pop.innerHTML = `<p class="menu-head" aria-hidden="true">${T(cfg.titulo)}</p>` + cfg.opciones.map((v) =>
        `<button type="button" role="option" data-valor="${v}" aria-selected="${v === actual}" tabindex="-1">${T(cfg.clave(v))}</button>`).join("");
    });
    document.querySelectorAll("[data-tendencias]").forEach((a) => a.toggleAttribute("aria-current", estado.orden === "tendencias"));
  }
  function cerrarMenus(excepto) {
    document.querySelectorAll("[data-menu]").forEach((m) => {
      if (m === excepto) return;
      m.querySelector(".menu-pop").hidden = true;
      m.querySelector(".menu-btn").setAttribute("aria-expanded", "false");
    });
  }
  document.querySelectorAll("[data-menu]").forEach((m) => {
    const btn = m.querySelector(".menu-btn"), pop = m.querySelector(".menu-pop");
    const opciones = () => [...pop.querySelectorAll("[role=option]")];
    const abrirMenu = () => {
      cerrarMenus(m); pop.hidden = false; btn.setAttribute("aria-expanded", "true");
      (pop.querySelector('[aria-selected="true"]') || opciones()[0]).focus();
    };
    const cerrarMenu = (foco) => { pop.hidden = true; btn.setAttribute("aria-expanded", "false"); if (foco) btn.focus(); };
    btn.addEventListener("click", () => (pop.hidden ? abrirMenu() : cerrarMenu()));
    btn.addEventListener("keydown", (e) => { if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); abrirMenu(); } });
    pop.addEventListener("click", (e) => {
      const o = e.target.closest("[data-valor]"); if (!o) return;
      estado[m.dataset.menu] = o.dataset.valor;
      cerrarMenu(true); pintarMenus(); pintar();
    });
    pop.addEventListener("keydown", (e) => {
      const ops = opciones(), i = ops.indexOf(document.activeElement);
      if (e.key === "ArrowDown") { e.preventDefault(); ops[Math.min(ops.length - 1, i + 1)].focus(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); ops[Math.max(0, i - 1)].focus(); }
      else if (e.key === "Home") { e.preventDefault(); ops[0].focus(); }
      else if (e.key === "End") { e.preventDefault(); ops[ops.length - 1].focus(); }
      else if (e.key === "Escape") { e.preventDefault(); cerrarMenu(true); }
      else if (e.key === "Tab") cerrarMenu();
    });
  });
  document.addEventListener("click", (e) => { if (!e.target.closest("[data-menu]")) cerrarMenus(); });
  // «Tendencias» en la cabecera: ordena el catálogo por tendencia y baja hasta él
  document.querySelectorAll("[data-tendencias]").forEach((a) => a.addEventListener("click", () => { estado.orden = "tendencias"; pintarMenus(); pintar(); }));

  const maxPrecio = Math.ceil(Math.max(...productos.map((p) => p.precio), 10) / 10) * 10;
  const rango = $("#max");
  rango.max = maxPrecio; rango.value = maxPrecio;
  const pMin = $("#p-min"), pMax = $("#p-max");
  const pintarRango = () => {
    const { min, max } = estado;
    $("#max-val").textContent = min && max ? T("range.fromTo", { a: money.format(min), b: money.format(max) }) : max ? T("range.upTo", { b: money.format(max) }) : min ? T("range.fromOnly", { a: money.format(min) }) : T("range.any");
    rango.value = max || maxPrecio;
    const malo = !!(min && max && min > max);
    pMin.setAttribute("aria-invalid", malo); pMax.setAttribute("aria-invalid", malo);
    $("#rango-error").hidden = !malo;
  };
  rango.addEventListener("input", () => { const v = +rango.value; estado.max = v >= maxPrecio ? 0 : v; pMax.value = estado.max || ""; pintarRango(); pintar(); });
  // Rango escrito a mano: "Desde" y "Hasta" en dólares; vacío = sin límite
  const leer = (el) => { const v = parseFloat(String(el.value).replace(",", ".")); return v > 0 ? v : 0; };
  let rtm;
  [pMin, pMax].forEach((el) => el.addEventListener("input", () => {
    clearTimeout(rtm);
    rtm = setTimeout(() => { estado.min = leer(pMin); estado.max = leer(pMax); pintarRango(); pintar(); }, 200);
  }));

  function limpiar() {
    Object.assign(estado, { q: "", categoria: "Todas", orden: "relevancia", grupo: "ninguno", favoritos: false, min: 0, max: 0 });
    pMin.value = ""; pMax.value = "";
    estado.tiendas.clear();
    $("#q").value = ""; pintarMenus(); rango.value = maxPrecio;
    pintarTiendasFiltro(); pintarRango(); pintar();
  }

  document.addEventListener("click", (e) => {
    const fv = e.target.closest("[data-fav]"); if (fv) return alternarFavorito(fv.dataset.fav);
    const sg = e.target.closest("[data-seguir]"); if (sg) return alternarSeguir(sg.dataset.seguir);
    const vs = e.target.closest("[data-ver-seguido]"); if (vs) { $("#alertas").close(); marcarSeguidoVisto(vs.dataset.verSeguido); return abrir(vs.dataset.verSeguido); }
    const ds = e.target.closest("[data-dejar-seguir]"); if (ds) return alternarSeguir(ds.dataset.dejarSeguir);
    const v = e.target.closest("[data-votar]"); if (v) return votar(v.closest("[data-voto]").dataset.voto, +v.dataset.votar);
    const c = e.target.closest("[data-comparar]"); if (c) return alternarComparar(c.dataset.comparar);
    const a = e.target.closest("[data-abrir]");
    if (a) { if ($("#comparador").open) $("#comparador").close(); return abrir(a.dataset.abrir); }
    if (e.target.closest("[data-limpiar]")) return limpiar();
    const q = e.target.closest("[data-quitar]"); if (q) return alternarComparar(q.dataset.quitar);
    const x = e.target.closest("[data-cerrar]"); if (x) return x.closest("dialog").close();
    const m = e.target.closest("[data-mover]"); if (m) return verFoto(fotoActual + +m.dataset.mover);
    const f = e.target.closest("[data-foto]"); if (f) return verFoto(+f.dataset.foto);
  });
  document.querySelectorAll("dialog").forEach((d) => d.addEventListener("click", (e) => { if (e.target === d) d.close(); }));
  /* Compartir un producto: enlace directo, por email o copiándolo */
  const ICO_SOBRE = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>';
  const ICO_ENLACE = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/></svg>';
  function enlaceProducto(id) {
    const u = new URL(location.origin + location.pathname);
    u.searchParams.set("producto", id);
    if (i18n.lang === "en") u.searchParams.set("lang", "en");
    return u.toString();
  }
  function mailtoProducto(p) {
    const asunto = T("link.subject", { t: TIT(p) });
    const cuerpo = T("link.body", { t: TIT(p), p: money.format(p.precio), s: p.tienda, a: p.descuento ? T("link.was", { w: money.format(p.precioAnterior) }) : "", u: enlaceProducto(p.id) });
    return `mailto:?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
  }
  document.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-copiar-enlace]"); if (!b) return;
    const url = enlaceProducto(b.dataset.copiarEnlace);
    // Copia con el portapapeles del navegador; si no responde en 1 s o falla, usa el método clásico
    const clasico = () => { const t = document.createElement("textarea"); t.value = url; t.setAttribute("readonly", ""); t.style.position = "fixed"; t.style.opacity = "0"; b.closest("dialog, body").appendChild(t); t.select(); try { document.execCommand("copy"); } catch (er) {} t.remove(); };
    try { await Promise.race([navigator.clipboard.writeText(url), new Promise((_, no) => setTimeout(() => no(new Error("tiempo")), 1000))]); } catch (er) { clasico(); }
    const sp = b.querySelector("span"); sp.textContent = T("link.copied"); b.classList.add("ok");
    setTimeout(() => { sp.textContent = T("link.copy"); b.classList.remove("ok"); }, 1800);
  });
  // Al cerrar la ficha, la dirección vuelve a ser la de la web
  $("#ficha").addEventListener("close", () => { try { const u = new URL(location.href); if (u.searchParams.has("producto")) { u.searchParams.delete("producto"); history.replaceState(null, "", u); } } catch (e) {} });

  $("#ficha").addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") verFoto(fotoActual + 1);
    if (e.key === "ArrowLeft") verFoto(fotoActual - 1);
  });
  // Deslizar el dedo sobre la foto en el móvil
  let x0 = null;
  $("#ficha").addEventListener("touchstart", (e) => { if (e.target.closest(".main")) x0 = e.touches[0].clientX; }, { passive: true });
  $("#ficha").addEventListener("touchend", (e) => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) verFoto(fotoActual + (dx < 0 ? 1 : -1)); x0 = null; });
  $("#compare-open").addEventListener("click", abrirComparador);
  $("#ver-mas").addEventListener("click", verMas);
  $("#compare-clear").addEventListener("click", () => { estado.comparar = []; refrescarComparar(); });
  $("#toggle-filtros").addEventListener("click", (e) => {
    const s = $("#side"); s.classList.toggle("open");
    e.currentTarget.setAttribute("aria-expanded", s.classList.contains("open"));
  });

  /* Giro: se pausa con el ratón encima, con el foco dentro, o con la pestaña oculta */
  const sec = $("#destacadas");
  sec.addEventListener("pointerenter", () => { giroPausa = true; });
  sec.addEventListener("pointerleave", () => { giroPausa = false; });
  sec.addEventListener("focusin", () => { giroPausa = true; });
  sec.addEventListener("focusout", () => { giroPausa = false; });
  setInterval(() => { if (!giroPausa && !document.hidden) safe(avanzarGiro); }, ROTAR_CADA);

  /* Cabecera: se esconde al bajar y reaparece al subir (solo actúa en móvil y pantallas bajas, ver styles.css) */
  (() => {
    const top = $(".top"); let y0 = scrollY, ticking = false;
    addEventListener("scroll", () => {
      if (ticking) return; ticking = true;
      requestAnimationFrame(() => {
        const y = scrollY, enBusqueda = document.activeElement === $("#q");
        if (y > y0 + 6 && y > 240 && !enBusqueda) top.classList.add("oculta");
        else if (y < y0 - 6 || y < 240) top.classList.remove("oculta");
        y0 = y; ticking = false;
      });
    }, { passive: true });
    top.addEventListener("focusin", () => top.classList.remove("oculta"));
  })();

  /* Entrada de cada sección al aparecer en pantalla */
  function entradas() {
    const els = document.querySelectorAll("[data-in]");
    const ver = (el) => el.classList.add("in");
    if (!("IntersectionObserver" in window)) return els.forEach(ver);
    const io = new IntersectionObserver((ents) => ents.forEach((en) => { if (en.isIntersecting) { ver(en.target); io.unobserve(en.target); } }), { threshold: 0.05 });
    els.forEach((el) => io.observe(el));
    setTimeout(() => els.forEach((el) => { if (el.getBoundingClientRect().top < innerHeight) ver(el); }), 2500);
  }

  /* ===== Comunidad: votos y comentarios (Supabase) =====
     Cada navegador recibe un identificador anónimo; un voto por oferta y navegador. */
  const comunidad = { total: {}, recientes: {}, enTendencia: new Set(), mios: {}, visitante: "", nombre: "" };
  (function () {
    try { comunidad.mios = JSON.parse(localStorage.getItem("radar-mis-votos") || "{}"); } catch (e) {}
    try { comunidad.nombre = localStorage.getItem("radar-nombre") || ""; } catch (e) {}
    try {
      comunidad.visitante = localStorage.getItem("radar-visitante") || "";
      if (!comunidad.visitante) { comunidad.visitante = crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2); localStorage.setItem("radar-visitante", comunidad.visitante); }
    } catch (e) { comunidad.visitante = crypto.randomUUID ? crypto.randomUUID() : String(Date.now()); }
  })();
  async function api(ruta, cuerpo) {
    const r = await fetch(`${SUPABASE.url.replace(/\/$/, "")}/rest/v1/${ruta}`, {
      method: cuerpo ? "POST" : "GET",
      headers: { apikey: SUPABASE.clave, Authorization: `Bearer ${SUPABASE.clave}`, "Content-Type": "application/json" },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined
    });
    if (!r.ok) throw new Error(await r.text());
    return r.status === 204 ? null : r.json();
  }
  function pintarVotos(id) {
    document.querySelectorAll(`[data-voto="${CSS.escape(id)}"]`).forEach((w) => {
      const n = comunidad.total[id] || 0, mio = comunidad.mios[id] || 0;
      w.querySelector(".score").textContent = conSigno(n);
      w.querySelector(".vote-score").className = "vote-score" + (n > 0 ? " pos" : n < 0 ? " neg" : "");
      w.querySelector('[data-votar="1"]').setAttribute("aria-pressed", mio === 1);
      w.querySelector('[data-votar="-1"]').setAttribute("aria-pressed", mio === -1);
      w.setAttribute("aria-label", T("vote.score", { n }));
    });
  }
  async function cargarVotos() {
    const filas = await api("rpc/puntuaciones", {});
    comunidad.total = {}; comunidad.recientes = {};
    (filas || []).forEach((f) => { comunidad.total[f.producto_id] = Number(f.total) || 0; comunidad.recientes[f.producto_id] = Number(f.recientes) || 0; });
    // «En tendencia»: las 3 ofertas con más votos positivos en 48 h (mínimo 3)
    comunidad.enTendencia = new Set(Object.entries(comunidad.recientes).filter(([id, n]) => n >= 3 && porId.has(id)).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => id));
    if (comunidad.enTendencia.size || ["popularidad", "tendencias"].includes(estado.orden)) pintar(true);
    else Object.keys(comunidad.total).forEach(pintarVotos);
  }
  async function votar(id, valor) {
    const antes = comunidad.mios[id] || 0, nuevo = antes === valor ? 0 : valor;
    // Se pinta al momento y se corrige si el servidor falla
    comunidad.mios[id] = nuevo; comunidad.total[id] = (comunidad.total[id] || 0) - antes + nuevo; pintarVotos(id);
    try {
      const total = await api("rpc/votar", { p_producto: id, p_visitante: comunidad.visitante, p_valor: nuevo });
      comunidad.total[id] = Number(total) || 0; pintarVotos(id);
      try { localStorage.setItem("radar-mis-votos", JSON.stringify(comunidad.mios)); } catch (e) {}
    } catch (e) {
      console.error(e);
      comunidad.mios[id] = antes; comunidad.total[id] = (comunidad.total[id] || 0) - nuevo + antes; pintarVotos(id);
      alert(T("vote.error"));
    }
  }
  const fechaHora = (iso) => { const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleString(i18n.locale, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }); };
  async function cargarComentarios(id) {
    const caja = $("#com-list"); if (!caja) return;
    try {
      const lista = await api(`comentarios?select=id,nombre,avatar,texto,creado&producto_id=eq.${encodeURIComponent(id)}&order=creado.desc&limit=50`);
      if ($("#ficha").dataset.id !== id) return;
      $("#com-title").textContent = lista.length ? T("com.titleN", { n: lista.length }) : T("com.title");
      caja.innerHTML = lista.length ? lista.map((c) => `<article class="com">${avatar(c.nombre, "ava-sm", c.avatar)}<div class="com-body"><header><b>@${esc(c.nombre)}</b><time datetime="${esc(c.creado)}">${esc(fechaHora(c.creado))}</time></header><p>${esc(c.texto)}</p></div></article>`).join("") : `<p class="com-note">${T("com.empty")}</p>`;
    } catch (e) { console.error(e); caja.innerHTML = `<p class="com-note">${T("com.loadError")}</p>`; }
  }
  /* Para comentar hace falta cuenta y nombre de usuario. En el comentario solo se ve el @usuario, nunca el email:
     el nombre lo pone la base de datos a partir del perfil. */
  function cajaComentar(id) {
    if (typeof sb === "undefined" || !sb) return "";
    if (!cuenta.usuario) return `<div class="com-cta"><p>${T("com.login")}</p><button class="btn" type="button" data-acct="login">${T("com.loginBtn")}</button></div>`;
    if (!cuenta.perfil) return `<div class="com-cta"><p>${T("com.needUser")}</p><button class="btn" type="button" data-acct="perfil">${T("com.needUserBtn")}</button></div>`;
    return `<form class="com-form" id="com-form" data-id="${esc(id)}">
      <div class="com-as">${miAvatar("ava-sm")}<span>${T("com.as", { u: "<b>@" + esc(cuenta.perfil) + "</b>" })}</span></div>
      <label class="sr" for="com-texto">${T("com.text")}</label>
      <textarea id="com-texto" name="texto" maxlength="500" rows="3" required placeholder="${esc(T("com.hint"))}"></textarea>
      <div class="com-actions"><span class="com-note">${T("com.privacy")}</span><span class="com-msg" id="com-msg" role="status"></span><button class="btn" type="submit">${T("com.send")}</button></div>
    </form>`;
  }
  function pintarCajaComentar() { const b = $("#com-box"); if (b) b.innerHTML = cajaComentar(b.dataset.id); }
  document.addEventListener("submit", async (e) => {
    const f = e.target.closest("#com-form"); if (!f) return;
    e.preventDefault();
    const texto = f.texto.value.trim(), btn = f.querySelector('button[type="submit"]'), msg = $("#com-msg");
    if (!texto) return f.texto.focus();
    btn.disabled = true; msg.textContent = T("com.sending");
    try {
      const { error } = await sb.rpc("comentar", { p_producto: f.dataset.id, p_texto: texto });
      if (error) throw error;
      f.texto.value = ""; msg.textContent = "";
      await cargarComentarios(f.dataset.id);
    } catch (er) { console.error(er); msg.textContent = /demasiados/.test(er?.message || "") ? T("auth.err.rate") : T("com.error"); }
    btn.disabled = false;
  });

  /* ===== Mis alertas: los productos que sigue el usuario (bajadas de precio) ===== */
  function pintarCampana() {
    const n = bajadas().length, dot = $("#campana-n"), b = $("#campana");
    dot.hidden = n === 0; dot.textContent = n > 9 ? "9+" : n;
    const lab = n ? T("alert.bellN", { n }) : T("alert.bell");
    b.setAttribute("aria-label", lab); b.title = lab;
  }
  function pintarAlertas() {
    $("#alertas").innerHTML = `<button class="close" type="button" aria-label="${T("sheet.close")}" data-cerrar>×</button>
      <div class="alerts-wrap"><h2>${T("alert.title")}</h2>
      <h3 class="alerts-sub">${T("follow.section")}</h3>${pintarSeguidos()}</div>`;
  }
  $("#campana").addEventListener("click", () => {
    pintarAlertas();
    const d = $("#alertas"); if (typeof d.showModal === "function") d.showModal(); else d.setAttribute("open", "");
  });

  /* ===== Cuentas de usuario (Supabase Auth): favoritos y productos seguidos =====
     Entrar con email y contraseña, Google o Apple. Google y Apple hay que activarlos en Supabase
     (Authentication > Providers) con las claves de cada uno; ver LEEME.md. */
  // «Recordarme»: con la casilla marcada la sesión se guarda en el navegador; sin marcar, se borra al cerrar la pestaña
  const almacen = {
    recordar() { try { return localStorage.getItem("radar-recordar") !== "no"; } catch (e) { return true; } },
    getItem(k) { try { return localStorage.getItem(k) ?? sessionStorage.getItem(k); } catch (e) { return null; } },
    setItem(k, v) { try { if (this.recordar()) { localStorage.setItem(k, v); sessionStorage.removeItem(k); } else { sessionStorage.setItem(k, v); localStorage.removeItem(k); } } catch (e) {} },
    removeItem(k) { try { localStorage.removeItem(k); sessionStorage.removeItem(k); } catch (e) {} }
  };
  const sb = COMUNIDAD && window.supabase ? window.supabase.createClient(SUPABASE.url, SUPABASE.clave, { auth: { flowType: "pkce", persistSession: true, detectSessionInUrl: true, storage: almacen } }) : null;
  const cuenta = { usuario: null, favoritos: new Set(), seguidos: new Map(), objetivos: new Map(), pendiente: null };
  const CORAZON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20Z"/></svg>';
  const CAMPANA = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16ZM10 20.5a2 2 0 0 0 4 0"/></svg>';
  const LOGO_GOOGLE = '<svg viewBox="0 0 18 18" width="18" height="18" aria-hidden="true"><path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"/><path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33Z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"/></svg>';
  const LOGO_APPLE = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M16.37 12.6c-.02-2.27 1.86-3.36 1.94-3.41-1.06-1.55-2.7-1.76-3.28-1.78-1.4-.14-2.73.82-3.44.82-.71 0-1.8-.8-2.96-.78-1.52.02-2.93.89-3.71 2.25-1.58 2.75-.4 6.81 1.14 9.04.75 1.09 1.65 2.31 2.82 2.27 1.13-.05 1.56-.73 2.93-.73 1.37 0 1.75.73 2.95.71 1.22-.02 1.99-1.11 2.73-2.2.86-1.26 1.22-2.49 1.24-2.55-.03-.01-2.37-.91-2.4-3.62ZM14.12 5.93c.62-.76 1.04-1.8.93-2.85-.9.04-1.99.6-2.63 1.35-.58.67-1.08 1.74-.95 2.77 1 .08 2.03-.51 2.65-1.27Z"/></svg>';

  function botonesCuenta(p, completo) {
    if (!sb) return "";
    const fav = cuenta.favoritos.has(p.id), seg = cuenta.seguidos.has(p.id);
    if (completo) return `<button class="ghost acct-act" type="button" data-fav="${esc(p.id)}" aria-pressed="${fav}">${CORAZON}<span>${T(fav ? "fav.on" : "fav.add")}</span></button>
      <button class="ghost acct-act" type="button" data-seguir="${esc(p.id)}" aria-pressed="${seg}">${CAMPANA}<span>${T(seg ? "follow.on" : "follow.add")}</span></button>`;
    return `<div class="card-acts">
      <button class="act" type="button" data-fav="${esc(p.id)}" aria-pressed="${fav}" aria-label="${esc(T(fav ? "fav.on" : "fav.add"))}" title="${esc(T(fav ? "fav.on" : "fav.add"))}">${CORAZON}</button>
      <button class="act" type="button" data-seguir="${esc(p.id)}" aria-pressed="${seg}" aria-label="${esc(T(seg ? "follow.on" : "follow.add"))}" title="${esc(T(seg ? "follow.on" : "follow.add"))}">${CAMPANA}</button></div>`;
  }
  /* «Avísame si baja de $X»: precio objetivo de un producto seguido */
  function cajaObjetivo(id) {
    if (!sb || !cuenta.usuario || !cuenta.seguidos.has(id)) return "";
    const p = porId.get(id), obj = cuenta.objetivos.get(id);
    return `<form class="target" id="target-form" data-id="${esc(id)}"><label for="target-v">${T("target.label")}</label>
      <span class="target-in"><span aria-hidden="true">$</span><input id="target-v" name="v" type="number" inputmode="decimal" min="0.01" step="0.01" placeholder="${esc((p.precio * 0.9).toFixed(2))}" value="${obj ? obj.toFixed(2) : ""}"></span>
      <button class="btn-ghost" type="submit">${T("target.save")}</button><span class="target-msg" role="status">${obj ? T("target.active", { o: money.format(obj) }) : T("target.hint")}</span></form>`;
  }
  function pintarObjetivo() { const b = $("#objetivo-box"); if (b) b.innerHTML = cajaObjetivo(b.dataset.id); }
  document.addEventListener("submit", async (e) => {
    const f = e.target.closest("#target-form"); if (!f) return;
    e.preventDefault();
    const id = f.dataset.id, txt = f.v.value.trim(), v = txt ? parseFloat(txt.replace(",", ".")) : null, msg = f.querySelector(".target-msg");
    if (txt && !(v > 0)) { msg.textContent = T("target.bad"); return; }
    const r = await sb.from("seguidos").update({ precio_objetivo: v }).eq("producto_id", id);
    if (r.error) { console.error(r.error); msg.textContent = T("auth.err.generic"); return; }
    v ? cuenta.objetivos.set(id, v) : cuenta.objetivos.delete(id);
    msg.textContent = v ? T("target.active", { o: money.format(v) }) : T("target.hint");
    pintarCampana();
  });
  // Repinta los corazones y campanas ya dibujados sin volver a pintar toda la rejilla
  function pintarBotonesCuenta() {
    pintarObjetivo();
    document.querySelectorAll("[data-fav]").forEach((b) => {
      const on = cuenta.favoritos.has(b.dataset.fav), txt = T(on ? "fav.on" : "fav.add");
      b.setAttribute("aria-pressed", on);
      const sp = b.querySelector("span"); if (sp) sp.textContent = txt; else { b.setAttribute("aria-label", txt); b.title = txt; }
    });
    document.querySelectorAll("[data-seguir]").forEach((b) => {
      const on = cuenta.seguidos.has(b.dataset.seguir), txt = T(on ? "follow.on" : "follow.add");
      b.setAttribute("aria-pressed", on);
      const sp = b.querySelector("span"); if (sp) sp.textContent = txt; else { b.setAttribute("aria-label", txt); b.title = txt; }
    });
  }
  /* Avatares (blobatar): un dibujo fijo generado a partir del nombre de usuario.
     El mismo nombre da siempre el mismo avatar; no se guarda ninguna imagen. */
  let dibujarAvatar = null, EXPRESIONES = {};
  Promise.all([import("./vendor/blobatar.js"), import("./vendor/blobatar-expression.js")])
    .then(([m, ex]) => { dibujarAvatar = m.blobatar; EXPRESIONES = ex; document.dispatchEvent(new Event("radar-avatares")); }).catch((e) => console.error(e));
  /* Personalización (se guarda en el perfil): forma, expresión, fondo y color.
     Las formas se eligen con su posición en la tabla de blobatar (el centro de cada franja). */
  const AVA_FORMAS = { round: 0.11, organic: 0.35, boxy: 0.54, capsule: 0.65, nub: 0.745, cloud: 0.825, droplet: 0.8875, hexagon: 0.9325, sun: 0.965, triangle: 0.99 };
  const AVA_EXPRESIONES = ["idle", "happy", "sad", "mad", "surprised", "wink", "sleepy", "smug", "unsure", "scared", "love", "shy", "sick", "thinking"];
  const AVA_FONDOS = ["none", "squircle", "circle", "square"];
  const AVA_TONOS = [350, 18, 42, 125, 172, 205, 235, 285];
  const AVA_DEFECTO = { forma: "auto", expresion: "idle", fondo: "squircle", tono: "auto" };
  function limpiarAvatar(c) {
    c = c && typeof c === "object" ? c : {};
    return {
      forma: c.forma in AVA_FORMAS ? c.forma : "auto",
      expresion: AVA_EXPRESIONES.includes(c.expresion) ? c.expresion : "idle",
      fondo: AVA_FONDOS.includes(c.fondo) ? c.fondo : "squircle",
      tono: AVA_TONOS.includes(Number(c.tono)) ? Number(c.tono) : "auto"
    };
  }
  function opcionesAvatar(c) {
    c = limpiarAvatar(c);
    const o = { background: c.fondo === "none" ? false : c.fondo };
    if (c.forma !== "auto") o.traits = { shape: AVA_FORMAS[c.forma] };
    if (c.expresion !== "idle" && EXPRESIONES[c.expresion]) o.expression = EXPRESIONES[c.expresion];
    if (c.tono !== "auto") o.hue = c.tono;
    return o;
  }
  function avatar(semilla, cls, cfg) {
    const k = String(semilla || "").replace(/^@/, "");
    if (dibujarAvatar && k) { try { return `<span class="ava${cls ? " " + cls : ""}" aria-hidden="true">${dibujarAvatar(k, opcionesAvatar(cfg))}</span>`; } catch (e) { console.error(e); } }
    return `<span class="ava ava-ini${cls ? " " + cls : ""}" aria-hidden="true">${esc((k[0] || "?").toUpperCase())}</span>`;
  }
  const USUARIO_OK = /^[a-z0-9_][a-z0-9_.]{1,18}[a-z0-9_]$/;
  const nombreUsuario = (u) => (cuenta.perfil ? "@" + cuenta.perfil : (u && (u.user_metadata?.nombre || u.user_metadata?.full_name || u.user_metadata?.name || (u.email || "").split("@")[0])) || "");
  const semillaAvatar = () => cuenta.perfil || cuenta.usuario?.id || "";
  const miAvatar = (cls) => avatar(semillaAvatar(), cls, cuenta.avatar);

  /* Editor del avatar (al crear la cuenta y al cambiar el nombre de usuario) */
  let avatarEdit = { ...AVA_DEFECTO }, verTodasExpr = false;
  const semillaEditor = () => ($('#auth-form [name="usuario"]')?.value || T("auth.userPh"));
  function editorAvatar() {
    const sem = semillaEditor(), c = avatarEdit;
    const op = (k, v, lab, prev) => `<button type="button" class="ava-op" data-ava-k="${k}" data-ava-v="${v}" aria-pressed="${String(c[k]) === String(v)}">${prev}<span>${esc(lab)}</span></button>`;
    const formas = ["auto", ...Object.keys(AVA_FORMAS)].map((f) => op("forma", f, f === "auto" ? T("ava.auto") : T("ava.s." + f), avatar(sem, "ava-md", { ...c, forma: f }))).join("");
    const lista = verTodasExpr ? AVA_EXPRESIONES : AVA_EXPRESIONES.slice(0, 4).concat(AVA_EXPRESIONES.slice(4).includes(c.expresion) ? [c.expresion] : []);
    const expr = lista.map((e) => op("expresion", e, T("ava.e." + e), avatar(sem, "ava-md", { ...c, expresion: e }))).join("");
    const fondos = AVA_FONDOS.map((b) => `<button type="button" class="ava-seg" data-ava-k="fondo" data-ava-v="${b}" aria-pressed="${c.fondo === b}">${T("ava.b." + b)}</button>`).join("");
    const tonos = `<button type="button" class="ava-seg" data-ava-k="tono" data-ava-v="auto" aria-pressed="${c.tono === "auto"}">${T("ava.auto")}</button>` +
      AVA_TONOS.map((h, i) => `<button type="button" class="ava-dot" data-ava-k="tono" data-ava-v="${h}" aria-pressed="${c.tono === h}" aria-label="${esc(T("ava.h." + i))}" title="${esc(T("ava.h." + i))}" style="--h:${h}"></button>`).join("");
    return `<div class="ava-grp"><p class="ava-lab">${T("ava.shape")}</p><div class="ava-grid">${formas}</div></div>
      <div class="ava-grp"><p class="ava-lab">${T("ava.expr")}</p><div class="ava-grid">${expr}</div>
        <button type="button" class="auth-link ava-more" data-ava-mas>${verTodasExpr ? T("ava.less") : T("ava.more", { n: AVA_EXPRESIONES.length - 4 })}</button></div>
      <div class="ava-grp"><p class="ava-lab">${T("ava.bg")}</p><div class="ava-segs">${fondos}</div></div>
      <div class="ava-grp"><p class="ava-lab">${T("ava.hue")}</p><div class="ava-hues">${tonos}</div></div>`;
  }
  // Panel flotante: se abre bajo el botón de ajustes, encima del formulario, sin agrandarlo
  function abrirEditorAvatar(abrir) {
    const panel = $("#ava-editor"); if (!panel) return;
    panel.hidden = !abrir;
    document.querySelectorAll("[data-ava-abrir]").forEach((b) => b.setAttribute("aria-expanded", String(abrir)));
    if (abrir) { colocarEditorAvatar(); panel.querySelector('[aria-pressed="true"]')?.focus({ preventScroll: true }); }
  }
  // Se coloca respecto a la pantalla (no lo recorta la ventana de la cuenta); si abajo no cabe, se abre hacia arriba
  function colocarEditorAvatar() {
    const panel = $("#ava-editor"), btn = $(".ava-tune");
    if (!panel || panel.hidden || !btn) return;
    const r = btn.getBoundingClientRect(), vw = innerWidth, vh = innerHeight, m = 12;
    const ancho = Math.min(360, vw - 2 * m);
    panel.style.width = ancho + "px";
    panel.style.left = Math.min(Math.max(m, r.right - ancho), vw - ancho - m) + "px";
    const abajo = vh - r.bottom - 8 - m, arriba = r.top - 8 - m;
    if (abajo >= 320 || abajo >= arriba) { panel.style.top = r.bottom + 8 + "px"; panel.style.bottom = "auto"; panel.style.maxHeight = Math.min(560, abajo) + "px"; }
    else { panel.style.top = "auto"; panel.style.bottom = vh - r.top + 8 + "px"; panel.style.maxHeight = Math.min(560, arriba) + "px"; }
  }
  addEventListener("resize", colocarEditorAvatar);
  document.addEventListener("scroll", colocarEditorAvatar, true);
  // Se cierra al tocar fuera o con Esc (composedPath: los botones del panel se repintan al elegir)
  document.addEventListener("click", (e) => {
    const panel = $("#ava-editor");
    if (!panel || panel.hidden) return;
    const camino = e.composedPath();
    if (camino.includes(panel) || camino.some((n) => n.dataset && "avaAbrir" in n.dataset)) return;
    abrirEditorAvatar(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const panel = $("#ava-editor");
    if (panel && !panel.hidden) { e.preventDefault(); e.stopPropagation(); abrirEditorAvatar(false); $(".ava-tune")?.focus(); }
  }, true);
  function pintarEditorAvatar() {
    const ed = $("#ava-editor"); if (ed) ed.innerHTML = editorAvatar();
    const prev = $("#acceso .ava-prev"); if (prev) prev.innerHTML = avatar(semillaEditor(), "ava-lg", avatarEdit);
  }

  let pf_preguntado = false;
  async function cargarCuenta() {
    cuenta.favoritos = new Set(); cuenta.seguidos = new Map(); cuenta.perfil = null;
    if (cuenta.usuario) {
      const [f, sg, pf] = await Promise.all([
        sb.from("favoritos").select("producto_id"),
        sb.from("seguidos").select("producto_id,precio_visto,precio_objetivo"),
        sb.from("perfiles").select("usuario,avatar").eq("id", cuenta.usuario.id).maybeSingle()
      ]);
      cuenta.perfil = pf.data?.usuario || null;
      cuenta.avatar = pf.data?.avatar ? limpiarAvatar(pf.data.avatar) : null;
      (f.data || []).forEach((r) => cuenta.favoritos.add(r.producto_id));
      cuenta.objetivos = new Map();
      (sg.data || []).forEach((r) => { cuenta.seguidos.set(r.producto_id, Number(r.precio_visto)); if (r.precio_objetivo) cuenta.objetivos.set(r.producto_id, Number(r.precio_objetivo)); });
      if (cuenta.perfil || !comunidad.nombre) comunidad.nombre = nombreUsuario(cuenta.usuario);
    }
    pintarCuenta(); pintarBotonesCuenta(); pintarCampana(); pintarCajaComentar();
    // Quien entra sin nombre de usuario (Google, Apple o cuentas antiguas) lo elige ahora
    if (cuenta.usuario && !cuenta.perfil && !pf_preguntado && !$("#acceso").open) { pf_preguntado = true; abrirAcceso("usuario"); }
    if (estado.favoritos) pintar(true);
    if ($("#alertas").open) pintarAlertas();
  }
  function pintarCuenta() {
    const caja = $("#cuenta"); caja.hidden = !sb; if (!sb) return;
    const u = cuenta.usuario, b = $("#cuenta-btn");
    b.classList.toggle("in", !!u);
    caja.querySelector(".acct-ini").innerHTML = u ? miAvatar() : "";
    const lab = u ? `${T("acct.menu")}: ${nombreUsuario(u)}` : T("acct.btn");
    b.setAttribute("aria-label", lab); b.title = lab;
    $("#cuenta-pop").innerHTML = u ? `<div class="acct-who">${miAvatar("ava-md")}<p><b>${esc(nombreUsuario(u))}</b><span>${esc(u.email || "")}</span></p></div>
      <button type="button" data-acct="perfil">${miAvatar("ava-xs")}${T("acct.profile")}</button>
      <button type="button" data-acct="favs">${CORAZON}${T("acct.favsN", { n: cuenta.favoritos.size })}</button>
      <button type="button" data-acct="alerts">${CAMPANA}${T("acct.alerts")}</button>
      <button type="button" data-acct="logout">${T("acct.logout")}</button>` : "";
  }
  function pedirCuenta(motivo, accion) { cuenta.pendiente = accion || null; abrirAcceso("crear", motivo); }

  async function alternarFavorito(id) {
    if (!cuenta.usuario) return pedirCuenta("auth.reasonFav", () => alternarFavorito(id));
    const on = cuenta.favoritos.has(id);
    on ? cuenta.favoritos.delete(id) : cuenta.favoritos.add(id);
    pintarBotonesCuenta(); pintarCuenta();
    const r = on ? await sb.from("favoritos").delete().eq("producto_id", id) : await sb.from("favoritos").insert({ producto_id: id });
    if (r.error && r.error.code !== "23505") { console.error(r.error); on ? cuenta.favoritos.add(id) : cuenta.favoritos.delete(id); pintarBotonesCuenta(); pintarCuenta(); alert(T("auth.err.generic")); }
    if (estado.favoritos) pintar(true);
  }
  async function alternarSeguir(id) {
    if (!cuenta.usuario) return pedirCuenta("auth.reasonFollow", () => alternarSeguir(id));
    const p = porId.get(id); if (!p) return;
    const on = cuenta.seguidos.has(id), antes = cuenta.seguidos.get(id);
    on ? (cuenta.seguidos.delete(id), cuenta.objetivos.delete(id)) : cuenta.seguidos.set(id, p.precio);
    pintarBotonesCuenta(); pintarCampana(); if ($("#alertas").open) pintarAlertas();
    const r = on ? await sb.from("seguidos").delete().eq("producto_id", id) : await sb.from("seguidos").insert({ producto_id: id, precio_visto: p.precio });
    if (r.error && r.error.code !== "23505") { console.error(r.error); on ? cuenta.seguidos.set(id, antes) : cuenta.seguidos.delete(id); pintarBotonesCuenta(); pintarCampana(); alert(T("auth.err.generic")); }
  }
  // Productos seguidos cuyo precio actual es menor que el que vio el usuario
  // Con precio objetivo, solo avisa al llegar a ese precio; sin objetivo, avisa de cualquier bajada
  const bajadas = () => [...cuenta.seguidos].filter(([id, visto]) => {
    const p = porId.get(id); if (!p || !(p.precio < visto - 0.005)) return false;
    const obj = cuenta.objetivos.get(id); return !obj || p.precio <= obj + 0.005;
  }).map(([id]) => id);
  async function marcarSeguidoVisto(id) {
    const p = porId.get(id); if (!p || !cuenta.seguidos.has(id) || cuenta.seguidos.get(id) === p.precio) return;
    cuenta.seguidos.set(id, p.precio); pintarCampana();
    const r = await sb.from("seguidos").update({ precio_visto: p.precio }).eq("producto_id", id);
    if (r.error) console.error(r.error);
  }
  function pintarSeguidos() {
    if (!cuenta.usuario) return `<p class="alerts-empty">${T("follow.login")} <button class="linkbtn" type="button" data-acct="login">${T("auth.titleIn")}</button></p>`;
    const ids = [...cuenta.seguidos.keys()].filter((id) => porId.has(id));
    if (!ids.length) return `<p class="alerts-empty">${T("follow.none")}</p>`;
    const baj = new Set(bajadas());
    ids.sort((a, b) => baj.has(b) - baj.has(a));
    return `<ul class="alerts-list">${ids.map((id) => {
      const p = porId.get(id), visto = cuenta.seguidos.get(id);
      const obj = cuenta.objetivos.get(id);
      const estadoTxt = (baj.has(id) && obj ? T("target.reached", { b: money.format(p.precio), o: money.format(obj) }) + " · " : "") + (baj.has(id) ? T("follow.drop", { a: money.format(visto), b: money.format(p.precio) }) : obj ? T("target.waiting", { o: money.format(obj), b: money.format(p.precio) }) : p.precio > visto ? T("follow.up", { b: money.format(p.precio) }) : T("follow.same", { b: money.format(p.precio) }));
      return `<li><img class="alerts-ph" src="${esc(p.imagenes[0])}" alt=""><div><b>${esc(TIT(p))}</b><span class="${baj.has(id) ? "fresh" : ""}">${estadoTxt}</span></div>
        <button class="btn-ghost" type="button" data-ver-seguido="${esc(id)}">${T("follow.view")}</button>
        <button class="linkbtn" type="button" data-dejar-seguir="${esc(id)}" aria-label="${esc(T("follow.stopX", { t: TIT(p) }))}">${T("follow.stop")}</button></li>`;
    }).join("")}</ul>`;
  }

  /* Ventana de acceso: entrar, crear cuenta, recuperar contraseña y poner una nueva */
  let modoAcceso = "entrar", motivoAcceso = "";
  function abrirAcceso(modo, motivo) {
    avatarEdit = modo === "usuario" && cuenta.avatar ? { ...cuenta.avatar } : { ...AVA_DEFECTO }; verTodasExpr = false;
    modoAcceso = modo || "entrar"; motivoAcceso = motivo || "";
    pintarAcceso();
    const d = $("#acceso"); if (!d.open) { if (typeof d.showModal === "function") d.showModal(); else d.setAttribute("open", ""); }
    setTimeout(() => d.querySelector("input")?.focus(), 50);
  }
  const ICO_AJUSTES = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M4 8h9M17 8h3M4 16h3M11 16h9"/><circle cx="15" cy="8" r="2"/><circle cx="9" cy="16" r="2"/></svg>';
  const ICO_MAIL = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>';
  const ICO_CANDADO = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.5" r="1.2" fill="currentColor"/></svg>';
  const ICO_OJO = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/><path class="tachado" d="M4 20 20 4"/></svg>';
  // Campo de contraseña con botón de mostrar/ocultar
  const campoPass = (name, ph, auto) => `<span class="pass-wrap"><input name="${name}" type="password" required placeholder="${esc(ph)}" autocomplete="${auto}"${auto === "new-password" ? ' minlength="8"' : ""}><button class="eye" type="button" data-ojo aria-label="${esc(T("auth.show"))}" aria-pressed="false">${ICO_OJO}</button></span>`;
  // Campo con la etiqueta encajada en el borde (formulario de registro)
  const campoMuesca = (lab, html) => `<label class="fld"><span class="fld-lab">${lab}</span>${html}</label>`;
  // Campo tipo píldora con icono redondo (formulario de entrada)
  const campoPildora = (ico, html) => `<label class="pill"><span class="pill-ico">${ico}</span>${html}</label>`;
  function pintarAcceso(msg, ok) {
    const m = modoAcceso;
    const titulo = { entrar: "auth.titleIn", crear: "auth.titleUp", olvido: "auth.titleForgot", nueva: "auth.titleNew", usuario: "auth.titleUser" }[m];
    const enviar = { entrar: "auth.submitIn", crear: "auth.submitUp", olvido: "auth.submitForgot", nueva: "auth.submitNew", usuario: "auth.submitUser" }[m];
    // Nombre de usuario con «@» delante, vista previa del avatar y aviso de disponibilidad
    const campoUsuario = (valor) => `<div class="user-row">${campoMuesca(T("auth.username"), `<span class="at-wrap"><span class="at" aria-hidden="true">@</span><input name="usuario" required maxlength="20" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="${esc(T("auth.userPh"))}" value="${esc(valor || "")}"></span>`)}
        <button type="button" class="ava-prev" data-ava-abrir aria-controls="ava-editor" aria-expanded="false" aria-label="${esc(T("ava.title"))}" title="${esc(T("ava.title"))}">${avatar(valor || T("auth.userPh"), "ava-lg", avatarEdit)}</button>
        <button type="button" class="ava-tune" data-ava-abrir aria-controls="ava-editor" aria-expanded="false" aria-label="${esc(T("ava.title"))}" title="${esc(T("ava.title"))}">${ICO_AJUSTES}</button>
        <div class="ava-edit" id="ava-editor" role="dialog" aria-label="${esc(T("ava.title"))}" hidden>${editorAvatar()}</div></div>
      <p class="user-status" id="user-status" aria-live="polite">${T("auth.userHint")}</p>`;
    let recordar = true; try { recordar = localStorage.getItem("radar-recordar") !== "no"; } catch (e) {}
    let campos = "";
    if (m === "entrar") campos = `
      ${campoPildora(ICO_MAIL, `<input name="email" type="email" required autocomplete="email" placeholder="${esc(T("auth.email"))}" aria-label="${esc(T("auth.email"))}">`)}
      ${campoPildora(ICO_CANDADO, campoPass("pass", T("auth.pass"), "current-password").replace("<input ", `<input aria-label="${esc(T("auth.pass"))}" `))}
      <div class="auth-row"><label class="chk"><input type="checkbox" name="recordar" ${recordar ? "checked" : ""}><span>${T("auth.remember")}</span></label>
        <button class="auth-link" type="button" data-auth-modo="olvido">${T("auth.forgot")}</button></div>`;
    else if (m === "crear") campos = `
      <div class="fld-2">${campoMuesca(T("auth.name"), `<input name="nombre" maxlength="40" autocomplete="given-name" placeholder="${esc(T("auth.firstPh"))}">`)}
        ${campoMuesca(T("auth.lastName"), `<input name="apellido" maxlength="40" autocomplete="family-name" placeholder="${esc(T("auth.lastPh"))}">`)}</div>
      ${campoMuesca(T("auth.email"), `<input name="email" type="email" required autocomplete="email" placeholder="${esc(T("auth.emailPh"))}">`)}
      ${campoUsuario("")}
      <div class="fld-2">${campoMuesca(T("auth.pass"), campoPass("pass", T("auth.passPh"), "new-password"))}
        ${campoMuesca(T("auth.confirm"), campoPass("pass2", T("auth.passPh"), "new-password"))}</div>
      <label class="chk"><input type="checkbox" name="terminos" required><span>${T("auth.terms")}</span></label>`;
    else if (m === "usuario") campos = campoUsuario(cuenta.perfil || "");
    else if (m === "olvido") campos = campoPildora(ICO_MAIL, `<input name="email" type="email" required autocomplete="email" placeholder="${esc(T("auth.email"))}" aria-label="${esc(T("auth.email"))}">`);
    else campos = campoPildora(ICO_CANDADO, campoPass("pass", T("auth.newPass"), "new-password").replace("<input ", `<input aria-label="${esc(T("auth.newPass"))}" `)) + `<p class="auth-hint">${T("auth.passHint")}</p>`;
    const sociales = m === "entrar" || m === "crear" ? `<p class="auth-or">${T(m === "crear" ? "auth.orUp" : "auth.orIn")}</p>
      <div class="auth-social">
        <button class="soc" type="button" data-oauth="google">${LOGO_GOOGLE}<span>Google</span></button>
        <button class="soc apple" type="button" data-oauth="apple">${LOGO_APPLE}<span>Apple</span></button></div>` : "";
    const pie = m === "entrar" ? `<p class="auth-switch">${T("auth.toUp")} <button class="auth-link" type="button" data-auth-modo="crear">${T("auth.toUpBtn")}</button></p>`
      : m === "crear" ? `<p class="auth-switch">${T("auth.toIn")} <button class="auth-link" type="button" data-auth-modo="entrar">${T("auth.toInBtn")}</button></p>`
      : m === "olvido" ? `<p class="auth-switch"><button class="auth-link" type="button" data-auth-modo="entrar">${T("auth.back")}</button></p>` : "";
    const d = $("#acceso");
    d.dataset.modo = m;
    d.innerHTML = `<button class="close" type="button" aria-label="${T("sheet.close")}" data-cerrar>×</button>
      <div class="auth-wrap">
        ${m === "crear" ? `<p class="auth-tag">${T("auth.tagUp")}</p>` : ""}
        <h2>${T(titulo)}</h2>
        ${motivoAcceso ? `<p class="auth-reason">${T(motivoAcceso)}</p>` : m === "entrar" ? `<p class="auth-tag">${T("auth.tagIn")}</p>` : m === "usuario" ? `<p class="auth-tag">${T("auth.introUser")}</p>` : ""}
        <form class="auth-form" id="auth-form" novalidate>${campos}
          <p class="auth-msg${ok ? " ok" : ""}" id="auth-msg" role="status">${msg || ""}</p>
          <button class="btn auth-submit" type="submit">${T(enviar)}</button>
        </form>
        ${sociales}${pie}
      </div>`;
  }
  let revisionUsuario = { v: "", libre: null }, temporizadorUsuario;
  async function usuarioLibre(v) {
    if (revisionUsuario.v === v && revisionUsuario.libre !== null) return revisionUsuario.libre;
    const { data, error } = await sb.rpc("usuario_disponible", { p_usuario: v });
    if (error) throw error;
    revisionUsuario = { v, libre: !!data };
    return !!data;
  }
  document.addEventListener("input", (e) => {
    const inp = e.target.closest('#auth-form [name="usuario"]'); if (!inp) return;
    const limpio = inp.value.toLowerCase().replace(/^@+/, "").replace(/[^a-z0-9_.]/g, "").slice(0, 20);
    if (limpio !== inp.value) inp.value = limpio;
    pintarEditorAvatar();
    const st = $("#user-status"); clearTimeout(temporizadorUsuario);
    st.className = "user-status";
    if (!limpio) { st.textContent = T("auth.userHint"); return; }
    if (!USUARIO_OK.test(limpio)) { st.textContent = T("auth.userBad"); st.classList.add("bad"); return; }
    if (limpio === cuenta.perfil && modoAcceso === "usuario") { st.textContent = T("auth.userFree"); st.classList.add("ok"); return; }
    st.textContent = T("auth.userChecking");
    temporizadorUsuario = setTimeout(async () => {
      try {
        const libre = await usuarioLibre(limpio);
        if (inp.value !== limpio) return;
        st.textContent = T(libre ? "auth.userFree" : "auth.userTaken"); st.classList.add(libre ? "ok" : "bad");
      } catch (er) { console.error(er); st.textContent = ""; }
    }, 350);
  });
  // Traduce los errores de Supabase a mensajes claros
  function errorAcceso(e, proveedor) {
    const t = String(e?.message || e || "").toLowerCase();
    if (/provider is not enabled|unsupported provider/.test(t)) return T("auth.err.provider", { p: proveedor === "apple" ? "Apple" : "Google" });
    if (/invalid login credentials/.test(t)) return T("auth.err.creds");
    if (/already registered|already been registered/.test(t)) return T("auth.err.exists");
    if (/email not confirmed/.test(t)) return T("auth.err.confirm");
    if (/password should be at least|weak password/.test(t)) return T("auth.err.short");
    if (/rate limit|too many/.test(t) || e?.status === 429) return T("auth.err.rate");
    return T("auth.err.generic");
  }
  const volverAqui = () => location.origin + location.pathname;
  document.addEventListener("submit", async (e) => {
    const f = e.target.closest("#auth-form"); if (!f) return;
    e.preventDefault();
    const btn = f.querySelector('button[type="submit"]'), msg = $("#auth-msg");
    const email = f.email?.value.trim(), pass = f.pass?.value, nombre = f.nombre?.value.trim();
    const fallo = (k) => { msg.className = "auth-msg"; msg.textContent = T(k); };
    if (["entrar", "crear", "olvido"].includes(modoAcceso) && !/^\S+@\S+\.\S+$/.test(email || "")) { f.email.focus(); return fallo("auth.err.email"); }
    const usuario = f.usuario?.value.trim().toLowerCase() || "";
    if ((modoAcceso === "crear" || modoAcceso === "usuario") && !USUARIO_OK.test(usuario)) { f.usuario.focus(); return fallo("auth.userBad"); }
    if ((modoAcceso === "crear" || modoAcceso === "nueva") && (pass || "").length < 8) return fallo("auth.err.short");
    if (modoAcceso === "entrar" && !pass) { f.pass.focus(); return; }
    if (modoAcceso === "crear" && pass !== f.pass2.value) return fallo("auth.err.match");
    if (modoAcceso === "crear" && !f.terminos.checked) return fallo("auth.err.terms");
    if (modoAcceso === "entrar") { try { localStorage.setItem("radar-recordar", f.recordar.checked ? "si" : "no"); } catch (er) {} }
    btn.disabled = true; msg.className = "auth-msg"; msg.textContent = T("auth.wait");
    try {
      let r;
      if ((modoAcceso === "crear" || (modoAcceso === "usuario" && usuario !== cuenta.perfil)) && !(await usuarioLibre(usuario))) { fallo("auth.userTaken"); f.usuario.focus(); return; }
      if (modoAcceso === "entrar") r = await sb.auth.signInWithPassword({ email, password: pass });
      else if (modoAcceso === "crear") {
        const apellido = f.apellido?.value.trim() || "";
        const datos = { usuario, avatar: limpiarAvatar(avatarEdit), ...(nombre || apellido ? { nombre, apellido, full_name: [nombre, apellido].filter(Boolean).join(" ") } : {}) };
        r = await sb.auth.signUp({ email, password: pass, options: { data: datos, emailRedirectTo: volverAqui() } });
        // Supabase no da error si el email ya existe: devuelve un usuario sin identidades
        if (!r.error && r.data?.user && !(r.data.user.identities || []).length) r = { error: { message: "already registered" } };
        else if (!r.error && !r.data.session) { pintarAcceso(T("auth.checkEmail", { e: esc(email) }), true); return; }
      } else if (modoAcceso === "olvido") {
        r = await sb.auth.resetPasswordForEmail(email, { redirectTo: volverAqui() });
        if (!r.error) { pintarAcceso(T("auth.resetSent", { e: esc(email) }), true); return; }
      } else if (modoAcceso === "usuario") {
        // El perfil ya existe (se crea con la cuenta): solo se cambia el nombre. Si faltara, se crea.
        const av = limpiarAvatar(avatarEdit);
        r = await sb.from("perfiles").update({ usuario, avatar: av }).eq("id", cuenta.usuario.id).select("usuario");
        if (!r.error && !(r.data || []).length) r = await sb.from("perfiles").insert({ id: cuenta.usuario.id, usuario, avatar: av });
        if (!r.error) cuenta.avatar = av;
        if (r.error?.code === "23505") { revisionUsuario = { v: usuario, libre: false }; fallo("auth.userTaken"); return; }
        if (!r.error) {
          cuenta.perfil = usuario; comunidad.nombre = "@" + usuario;
          pintarCuenta(); $("#acceso").close();
          pintarCajaComentar();
          return;
        }
      } else if (modoAcceso === "nueva") {
        r = await sb.auth.updateUser({ password: pass });
        if (!r.error) { $("#acceso").close(); return; }
      }
      if (r.error) throw r.error;
    } catch (er) { console.error(er); msg.className = "auth-msg"; msg.textContent = errorAcceso(er); }
    finally { if (document.body.contains(btn)) btn.disabled = false; }
  });
  document.addEventListener("click", async (e) => {
    const ab = e.target.closest("[data-ava-abrir]");
    if (ab) { abrirEditorAvatar($("#ava-editor").hidden); return; }
    const ao = e.target.closest("[data-ava-k]");
    if (ao) { const k = ao.dataset.avaK, v = ao.dataset.avaV; avatarEdit[k] = k === "tono" && v !== "auto" ? Number(v) : v; pintarEditorAvatar(); $(`#ava-editor [data-ava-k="${k}"][data-ava-v="${v}"]`)?.focus(); return; }
    if (e.target.closest("[data-ava-mas]")) { verTodasExpr = !verTodasExpr; pintarEditorAvatar(); $("#ava-editor [data-ava-mas]")?.focus(); return; }
    const ojo = e.target.closest("[data-ojo]");
    if (ojo) { const inp = ojo.parentElement.querySelector("input"), ver = inp.type === "password"; inp.type = ver ? "text" : "password"; ojo.setAttribute("aria-pressed", ver); ojo.setAttribute("aria-label", T(ver ? "auth.hide" : "auth.show")); return; }
    const m = e.target.closest("[data-auth-modo]"); if (m) { modoAcceso = m.dataset.authModo; pintarAcceso(); $("#acceso").querySelector("input")?.focus(); return; }
    const o = e.target.closest("[data-oauth]");
    if (o) {
      const msg = $("#auth-msg"), prov = o.dataset.oauth;
      // Google y Apple se abren en una ventanita: la web se queda donde está.
      // Si el navegador bloquea la ventana, se usa la redirección normal.
      const ventana = window.open("", "radar-login", "width=500,height=640,left=" + Math.max(0, (screen.width - 500) / 2) + ",top=" + Math.max(0, (screen.height - 640) / 2));
      try {
        const { data, error } = await sb.auth.signInWithOAuth({ provider: prov, options: { redirectTo: volverAqui() + "?popup=1", skipBrowserRedirect: true } });
        if (error) throw error;
        if (ventana && !ventana.closed) ventana.location.href = data.url;
        else location.href = data.url.replace(encodeURIComponent("?popup=1"), "");
      } catch (er) { console.error(er); if (ventana && !ventana.closed) ventana.close(); if (msg) msg.textContent = errorAcceso(er, prov); }
      return;
    }
    const a = e.target.closest("[data-acct]");
    if (a) {
      cerrarMenuCuenta();
      const k = a.dataset.acct;
      if (k === "perfil") abrirAcceso("usuario");
      else if (k === "login") { if ($("#alertas").open) $("#alertas").close(); abrirAcceso("entrar"); }
      else if (k === "logout") { await sb.auth.signOut(); }
      else if (k === "alerts") $("#campana").click();
      else if (k === "favs") { Object.assign(estado, { favoritos: true, q: "", categoria: "Todas" }); estado.tiendas.clear(); $("#q").value = ""; pintarTiendasFiltro(); pintar(); $("#catalogo").scrollIntoView({ block: "start" }); }
    }
  });
  // Menú de la cuenta en la cabecera
  const cerrarMenuCuenta = () => { $("#cuenta-pop").hidden = true; $("#cuenta-btn").setAttribute("aria-expanded", "false"); };
  $("#cuenta-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    if (!cuenta.usuario) return abrirAcceso("entrar");
    const pop = $("#cuenta-pop"); pop.hidden = !pop.hidden;
    $("#cuenta-btn").setAttribute("aria-expanded", String(!pop.hidden));
    if (!pop.hidden) pop.querySelector("button")?.focus();
  });
  document.addEventListener("click", (e) => { if (!e.target.closest("#cuenta")) cerrarMenuCuenta(); });
  $("#cuenta").addEventListener("keydown", (e) => { if (e.key === "Escape") { cerrarMenuCuenta(); $("#cuenta-btn").focus(); } });
  $("#acceso").addEventListener("close", () => { motivoAcceso = ""; });

  // Ventanita de Google/Apple: al terminar, pasa la sesión a la web principal y se cierra
  const enVentanita = new URLSearchParams(location.search).has("popup") && window.opener && window.opener.location.origin === location.origin;
  addEventListener("message", async (e) => {
    if (!sb || e.origin !== location.origin || e.data?.tipo !== "radar-sesion") return;
    const { error } = await sb.auth.setSession({ access_token: e.data.access_token, refresh_token: e.data.refresh_token });
    if (error) console.error(error);
  });
  document.addEventListener("radar-avatares", () => {
    if (sb) safe(pintarCuenta);
    const prev = $("#acceso .ava-prev"), inp = $('#auth-form [name="usuario"]');
    if (prev) pintarEditorAvatar();
    const f = $("#ficha"); if (f.open && f.dataset.id && $("#com-list")) safe(() => cargarComentarios(f.dataset.id));
  });
  if (sb) $("#compartir-cta").hidden = false;
  /* Al volver del email de confirmación: si el enlace se abrió en otro navegador o en la app del correo,
     Supabase confirma la cuenta pero no puede iniciar la sesión aquí. Entonces avisamos y abrimos «Entrar». */
  const vueltaEmail = (() => {
    const q = new URLSearchParams(location.search), h = new URLSearchParams(location.hash.replace(/^#/, ""));
    return { codigo: q.has("code"), error: q.get("error_description") || h.get("error_description") || "" };
  })();
  if (sb && (vueltaEmail.codigo || vueltaEmail.error) && !new URLSearchParams(location.search).has("popup")) {
    sb.auth.getSession().then(({ data }) => {
      const u = new URL(location.href);
      ["code", "error", "error_code", "error_description"].forEach((k) => u.searchParams.delete(k));
      u.hash = "";
      history.replaceState(null, "", u);
      if (data?.session) return; // la sesión se abrió bien: nada que avisar
      abrirAcceso("entrar");
      pintarAcceso(T(vueltaEmail.error ? "auth.linkExpired" : "auth.confirmed"), !vueltaEmail.error);
    }).catch((e) => console.error(e));
  }
  if (sb) {
    pintarCuenta();
    sb.auth.onAuthStateChange((evento, sesion) => {
      const antes = cuenta.usuario?.id;
      cuenta.usuario = sesion?.user || null;
      if (evento === "PASSWORD_RECOVERY") { abrirAcceso("nueva"); }
      else if (evento === "SIGNED_IN" && $("#acceso").open && modoAcceso !== "nueva") $("#acceso").close();
      // Al volver de Google/Apple o del email, quita el código de la dirección
      if (/[?&](code|error_description)=/.test(location.search)) { const u = new URL(location.href); ["code", "error", "error_code", "error_description"].forEach((k) => u.searchParams.delete(k)); history.replaceState(null, "", u); }
      if (enVentanita && sesion && evento === "SIGNED_IN") {
        window.opener.postMessage({ tipo: "radar-sesion", access_token: sesion.access_token, refresh_token: sesion.refresh_token }, location.origin);
        setTimeout(() => window.close(), 100);
        return;
      }
      if (antes !== cuenta.usuario?.id) setTimeout(async () => {
        await cargarCuenta().catch((er) => console.error(er));
        if (cuenta.usuario && cuenta.pendiente) { const fn = cuenta.pendiente; cuenta.pendiente = null; fn(); }
      }, 0);
    });
  }

  /* ===== Grandes eventos de rebajas: cuenta atrás en una franja bajo la cabecera =====
     Añade aquí los eventos que quieras (Prime Day, Back to School…). Se muestra el próximo en los 60 días previos. */
  const EVENTOS = [
    { nombre: "Black Friday", fecha: "2026-11-27" },
    { nombre: "Cyber Monday", fecha: "2026-11-30" }
  ];
  function pintarEvento() {
    const caja = $("#evento"); if (!caja) return;
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const ev = EVENTOS.map((e) => ({ ...e, t: new Date(e.fecha + "T00:00:00") })).filter((e) => e.t >= hoy && (e.t - hoy) / DIA <= 60).sort((a, b) => a.t - b.t)[0];
    let cerrado = false; try { cerrado = ev && localStorage.getItem("radar-evento-cerrado") === ev.fecha; } catch (e) {}
    if (!ev || cerrado) { caja.hidden = true; return; }
    const dias = Math.round((ev.t - hoy) / DIA);
    caja.innerHTML = `<div class="wrap event-row">
      <p><b>${dias === 0 ? T("event.today", { e: esc(ev.nombre) }) : dias === 1 ? T("event.tomorrow", { e: esc(ev.nombre) }) : T("event.in", { e: esc(ev.nombre), n: dias })}</b> <span>${T("event.tip")}</span></p>
      <button class="btn-ghost event-btn" type="button" data-evento-alertas>${CAMPANA}${T("event.cta")}</button>
      <button class="event-x" type="button" data-evento-cerrar="${esc(ev.fecha)}" aria-label="${esc(T("sheet.close"))}">×</button></div>`;
    caja.hidden = false;
  }
  document.addEventListener("click", (e) => {
    const x = e.target.closest("[data-evento-cerrar]");
    if (x) { try { localStorage.setItem("radar-evento-cerrado", x.dataset.eventoCerrar); } catch (er) {} $("#evento").hidden = true; return; }
    if (e.target.closest("[data-evento-alertas]")) { if (sb && !cuenta.usuario) return pedirCuenta("auth.reasonFollow"); $("#campana").click(); }
  });

  /* ===== Comparte una oferta (comunidad). Se guarda como «pendiente» y la revisas antes de publicarla ===== */
  function abrirCompartir() {
    if (!sb) return;
    if (!cuenta.usuario) return pedirCuenta("share.reason", abrirCompartir);
    const tiendas = Object.keys(TIENDAS).map((t) => `<option>${esc(t)}</option>`).join("") + `<option value="Otra">${T("share.other")}</option>`;
    const d = $("#compartir");
    d.innerHTML = `<button class="close" type="button" aria-label="${T("sheet.close")}" data-cerrar>×</button>
      <div class="auth-wrap"><h2>${T("share.title")}</h2><p class="auth-tag">${T("share.intro")}</p>
      <form class="auth-form" id="share-form" novalidate>
        <label class="fld"><span class="fld-lab">${T("share.url")}</span><input name="url" type="url" required placeholder="https://"></label>
        <label class="fld"><span class="fld-lab">${T("share.name")}</span><input name="titulo" required maxlength="140" placeholder="${esc(T("share.namePh"))}"></label>
        <div class="fld-2"><label class="fld"><span class="fld-lab">${T("share.store")}</span><select name="tienda" required>${tiendas}</select></label>
          <label class="fld"><span class="fld-lab">${T("share.coupon")}</span><input name="cupon" maxlength="60" placeholder="${esc(T("share.couponPh"))}"></label></div>
        <div class="fld-2"><label class="fld"><span class="fld-lab">${T("share.price")}</span><input name="precio" type="number" inputmode="decimal" min="0" step="0.01" placeholder="0.00"></label>
          <label class="fld"><span class="fld-lab">${T("share.before")}</span><input name="antes" type="number" inputmode="decimal" min="0" step="0.01" placeholder="0.00"></label></div>
        <label class="fld"><span class="fld-lab">${T("share.note")}</span><textarea name="nota" maxlength="500" rows="3" placeholder="${esc(T("share.notePh"))}"></textarea></label>
        <p class="auth-msg" id="share-msg" role="status"></p>
        <button class="btn auth-submit" type="submit">${T("share.send")}</button>
      </form></div>`;
    if (!d.open) d.showModal();
    setTimeout(() => d.querySelector("input")?.focus(), 50);
  }
  document.addEventListener("click", (e) => { if (e.target.closest("[data-compartir]")) { cerrarMenuCuenta?.(); abrirCompartir(); } });
  document.addEventListener("submit", async (e) => {
    const f = e.target.closest("#share-form"); if (!f) return;
    e.preventDefault();
    const msg = $("#share-msg"), btn = f.querySelector('button[type="submit"]'), num = (v) => (v.trim() ? parseFloat(v.replace(",", ".")) : null);
    const datos = { url: f.url.value.trim(), titulo: f.titulo.value.trim(), tienda: f.tienda.value, precio: num(f.precio.value), precio_antes: num(f.antes.value), cupon: f.cupon.value.trim() || null, nota: f.nota.value.trim() || null };
    msg.className = "auth-msg";
    if (!/^https:\/\/\S+\.\S+/.test(datos.url)) { msg.textContent = T("share.badUrl"); return f.url.focus(); }
    if (datos.titulo.length < 3) { msg.textContent = T("share.badName"); return f.titulo.focus(); }
    btn.disabled = true; msg.textContent = T("auth.wait");
    const { error } = await sb.from("ofertas_enviadas").insert(datos);
    btn.disabled = false;
    if (error) { console.error(error); msg.textContent = /demasiadas/.test(error.message) ? T("share.limit") : T("auth.err.generic"); return; }
    f.reset(); msg.className = "auth-msg ok"; msg.textContent = T("share.thanks");
  });

  /* ===== App instalable (PWA) ===== */
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch((e) => console.error(e)));
  }
  let avisoInstalar = null;
  addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); avisoInstalar = e; $("#instalar").hidden = false; });
  $("#instalar").addEventListener("click", async () => { if (!avisoInstalar) return; avisoInstalar.prompt(); await avisoInstalar.userChoice.catch(() => {}); avisoInstalar = null; $("#instalar").hidden = true; });
  addEventListener("appinstalled", () => { $("#instalar").hidden = true; });

  /* Selector de idioma: cambia los textos fijos y vuelve a pintar todo lo que genera la web */
  function redibujar() {
    [pintarPortada, pintarTiendasPortada, pintarCategorias, pintarTiendasFiltro, pintarRango, pintarMenus, () => pintar(true), pintarBarraComparar].forEach(safe);
    const f = $("#ficha"), c = $("#comparador");
    if (f.open && f.dataset.id) safe(() => abrir(f.dataset.id));
    if (c.open) safe(abrirComparador);
    safe(pintarCampana); safe(pintarEvento);
    if ($("#alertas").open) safe(pintarAlertas);
    if (sb) safe(pintarCuenta);
    if ($("#acceso").open) safe(() => pintarAcceso());
  }
  document.querySelectorAll("[data-lang]").forEach((b) => b.addEventListener("click", () => { if (i18n.set(b.dataset.lang)) redibujar(); }));

  /* Modo claro / oscuro: claro por defecto; la elección se guarda en este navegador */
  (function () {
    const btn = $("#tema"), meta = document.querySelector('meta[name="theme-color"]');
    const poner = (oscuro) => {
      if (oscuro) document.documentElement.dataset.theme = "dark"; else delete document.documentElement.dataset.theme;
      if (btn) btn.setAttribute("aria-pressed", oscuro);
      if (meta) meta.content = oscuro ? "#0a1628" : "#ffffff";
    };
    poner(document.documentElement.dataset.theme === "dark");
    if (btn) btn.addEventListener("click", () => {
      const oscuro = document.documentElement.dataset.theme !== "dark";
      poner(oscuro);
      try { localStorage.setItem("radar-tema", oscuro ? "oscuro" : "claro"); } catch (e) {}
    });
  })();

  /* Coloca los anuncios configurados en ADSENSE dentro de sus espacios */
  function ponerAnuncios() {
    Object.entries(ADSENSE.bloques).forEach(([sitio, slot]) => {
      const caja = $("#ad-" + sitio);
      if (!caja || !/^\d{6,}$/.test(String(slot).trim()) || caja.dataset.puesto) return;
      caja.dataset.puesto = "1";
      caja.classList.add("ad-on");
      caja.innerHTML = `<ins class="adsbygoogle" style="display:block" data-ad-client="${ADSENSE.cliente}" data-ad-slot="${String(slot).trim()}" data-ad-format="auto" data-full-width-responsive="true"></ins>`;
      try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { console.error(e); }
    });
  }

  safe(() => i18n.apply());
  safe(ponerAnuncios);
  safe(pintarPortada); safe(entradas); safe(pintarTiendasPortada); safe(pintarCategorias); safe(pintarTiendasFiltro); safe(pintarRango); safe(pintarMenus); safe(pintarEvento); safe(pintar);
  // Enlace compartido (?producto=id): abre directamente la ficha de ese producto
  safe(() => { const id = new URLSearchParams(location.search).get("producto"); if (id && porId.has(id)) abrir(id); }); safe(pintarBarraComparar); safe(pintarCampana);
  if (COMUNIDAD) cargarVotos().catch((e) => console.error(e));
})();
