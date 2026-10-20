/* Lógica de la web: lee window.PRODUCTOS (productos.js) y monta portada, tiendas, catálogo, ficha y comparador. */
(function () {
  "use strict";

  // Cada cuántos productos se intercala un anuncio en la rejilla
  const ANUNCIO_CADA = 8;
  // Máximo de productos en el comparador
  const MAX_COMPARAR = 4;

  // Color de identificación de cada tienda
  const TIENDAS = {
    "Amazon": "#e88a00", "Walmart": "#0071ce", "Target": "#cc0000", "Best Buy": "#0046be",
    "eBay": "#5f8f12", "Etsy": "#e2581a", "Temu": "#f06a00", "AliExpress": "#d8290a"
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
    "AliExpress": { buscar: "https://www.aliexpress.us/w/wholesale-{q}.html" }
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

  const productos = (window.PRODUCTOS || []).map((p) => {
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

  const estado = { q: "", categoria: "Todas", tiendas: new Set(), orden: "relevancia", min: 0, max: 0, comparar: [] };

  /* Piezas reutilizables */
  const marcaTienda = (t) => `<i style="--c:${TIENDAS[t] || "#888"}"></i>`;
  const estrellas = (p) => p.valoracion ? `<span class="stars">${T("card.rating", { r: p.valoracion.toFixed(1), n: (p.resenas || 0).toLocaleString("en-US") })}</span>` : "";
  const precios = (p) => `<div class="price-row"><span class="price">${money.format(p.precio)}</span>${p.descuento ? `<span class="was">${money.format(p.precioAnterior)}</span>` : ""}</div>`;
  const enlace = (p, texto) => `<a class="cta" href="${esc(p.enlace)}" target="_blank" rel="sponsored nofollow noopener">${texto} ${FLECHA}</a>`;

  /* Filtros */
  function filtrar() {
    const palabras = normalizar(estado.q).split(/\s+/).filter(Boolean);
    let lista = productos.filter((p) =>
      (estado.categoria === "Todas" || p.categoria === estado.categoria) &&
      (estado.tiendas.size === 0 || estado.tiendas.has(p.tienda)) &&
      (!estado.max || p.precio <= estado.max) &&
      (!estado.min || p.precio >= estado.min) &&
      palabras.every((w) => p._texto.includes(w))
    );
    const ord = {
      "precio-asc": (a, b) => a.precio - b.precio,
      "precio-desc": (a, b) => b.precio - a.precio,
      "descuento": (a, b) => b.descuento - a.descuento,
      "ahorro": (a, b) => b.ahorro - a.ahorro,
      "valoracion": (a, b) => (b.valoracion || 0) - (a.valoracion || 0)
    }[estado.orden];
    if (ord) lista = lista.slice().sort(ord);
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
    $("#oferta-dia").innerHTML = `<span class="lab">${T(p === giro[0] ? "top.dealOfDay" : "top.featured")}</span><h3>${esc(TIT(p))}</h3>${precios(p)}
      <p class="save">${T("top.saveIn", { a: money.format(p.ahorro), d: p.descuento, s: esc(p.tienda) })}</p>${enlace(p, T("top.seeDeal", { s: esc(p.tienda) }))}`;
  }
  function pintarPortada() {
    $("#hero-cta").textContent = T("hero.ctaN", { n: productos.length });
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
      </div>
      <div class="card-body">
        <span class="store">${marcaTienda(p.tienda)}${esc(p.tienda)}<span class="cat">· ${esc(CAT(p.categoria))}</span></span>
        <h3 class="card-title"><button type="button" data-abrir="${esc(p.id)}">${esc(TIT(p))}</button></h3>
        ${estrellas(p)}
        ${precios(p)}
        ${p.descuento ? `<span class="saving">${T("card.save", { a: money.format(p.ahorro) })}</span>` : ""}
        ${enlace(p, T("card.seeAt", { s: esc(p.tienda) }))}
        <span class="updated">${T("card.updated", { d: esc(fecha(p.actualizado)) })}</span>
      </div>
    </article>`;
  }
  function anuncioFeed(n) {
    // Sustituye el contenido por tu bloque <ins class="adsbygoogle"> de anuncio "In-feed"
    return `<div class="ad ad-feed" data-ad-slot-name="feed-${n}"><div><small>${T("ad.label")}</small>${T("ad.feed")}</div></div>`;
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
  let listaActual = [], visibles = POR_TANDA;
  function tanda(desde, hasta) {
    const partes = [];
    listaActual.slice(desde, hasta).forEach((p, k) => {
      const i = desde + k;
      partes.push(tarjeta(p));
      if ((i + 1) % ANUNCIO_CADA === 0 && i < listaActual.length - 1) partes.push(anuncioFeed((i + 1) / ANUNCIO_CADA));
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
    $("#grid").innerHTML = tanda(0, visibles) || `<div class="empty"><strong>${estado.q ? T("results.emptyQueryTitle", { q: esc(estado.q) }) : T("results.emptyTitle")}</strong><br>${T(estado.q ? "results.emptyQueryText" : "results.emptyText")} <button class="linkbtn" type="button" data-limpiar>${T(estado.q ? "results.emptyQueryBtn" : "results.emptyBtn")}</button>.</div>`;
    let titulo = T("cat.allDeals");
    if (estado.q) titulo = T("results.for", { q: estado.q });
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
          <span class="store">${marcaTienda(p.tienda)}${esc(p.tienda)}<span class="cat">· ${esc(CAT(p.categoria))}</span></span>
          <h2>${esc(TIT(p))}</h2>
          ${estrellas(p)}
          <div>${precios(p)}${p.descuento ? `<span class="save">${T("sheet.saveFull", { a: money.format(p.ahorro), d: p.descuento })}</span>` : ""}</div>
          <div class="info-actions">${enlace(p, T("sheet.buyAt", { s: esc(p.tienda) }))}<button class="ghost" type="button" data-comparar="${esc(p.id)}" aria-pressed="${enComp}">${T(enComp ? "sheet.inCompare" : "card.compare")}</button></div>
          <dl class="facts">
            <dt>${T("sheet.store")}</dt><dd>${esc(p.tienda)}</dd>
            <dt>${T("sheet.category")}</dt><dd>${esc(CAT(p.categoria))}</dd>
            <dt>${T("sheet.usual")}</dt><dd>${p.precioAnterior ? money.format(p.precioAnterior) : "—"}</dd>
            <dt>${T("sheet.photos")}</dt><dd>${p.imagenes.length}</dd>
          </dl>
          <p class="disclaimer">${T("sheet.disclaimer", { d: esc(fecha(p.actualizado)), s: esc(p.tienda) })}</p>
        </div>
        ${similares.length ? `<div class="similar"><h3>${T("sheet.more", { c: esc(CAT(p.categoria)) })}</h3><div class="sim-row">${similares.map((s) =>
          `<button class="sim" type="button" data-abrir="${esc(s.id)}"><img src="${esc(s.imagenes[0])}" alt=""><span>${esc(TIT(s))}</span><b>${money.format(s.precio)}</b></button>`).join("")}</div></div>` : ""}
      </div>`;
    d.dataset.id = id;
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
  $("#q").addEventListener("input", (e) => { clearTimeout(t); t = setTimeout(() => { estado.q = e.target.value.trim(); pintar(); }, 120); });
  $("#buscador").addEventListener("submit", (e) => {
    e.preventDefault(); estado.q = $("#q").value.trim(); pintar();
    $("#catalogo").scrollIntoView({ block: "start" });
  });
  $("#cats").addEventListener("click", (e) => { const b = e.target.closest("[data-cat]"); if (b) { estado.categoria = b.dataset.cat; pintar(); } });
  $("#stores").addEventListener("click", (e) => {
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
  $("#orden").addEventListener("change", (e) => { estado.orden = e.target.value; pintar(); });

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
    Object.assign(estado, { q: "", categoria: "Todas", orden: "relevancia", min: 0, max: 0 });
    pMin.value = ""; pMax.value = "";
    estado.tiendas.clear();
    $("#q").value = ""; $("#orden").value = "relevancia"; rango.value = maxPrecio;
    pintarTiendasFiltro(); pintarRango(); pintar();
  }

  document.addEventListener("click", (e) => {
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

  /* Selector de idioma: cambia los textos fijos y vuelve a pintar todo lo que genera la web */
  function redibujar() {
    [pintarPortada, pintarTiendasPortada, pintarCategorias, pintarTiendasFiltro, pintarRango, () => pintar(true), pintarBarraComparar].forEach(safe);
    const f = $("#ficha"), c = $("#comparador");
    if (f.open && f.dataset.id) safe(() => abrir(f.dataset.id));
    if (c.open) safe(abrirComparador);
  }
  document.querySelectorAll("[data-lang]").forEach((b) => b.addEventListener("click", () => { if (i18n.set(b.dataset.lang)) redibujar(); }));

  safe(() => i18n.apply());
  safe(pintarPortada); safe(entradas); safe(pintarTiendasPortada); safe(pintarCategorias); safe(pintarTiendasFiltro); safe(pintarRango); safe(pintar); safe(pintarBarraComparar);
})();
