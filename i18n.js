/* IDIOMAS · español e inglés
   Todos los textos de la web están aquí. Para cambiar una frase, cámbiala en los dos idiomas.
   {n}, {s}, {t}… son huecos que la web rellena (número, tienda, título…).
   Elección del idioma: ?lang=en|es en la dirección > la última elección guardada > el idioma del navegador. */
(function () {
  "use strict";

  const D = {
    es: {
      "brand": "Radar de Ofertas",
      "foot.copy": "© 2026 Radar de Ofertas",
      "meta.title": "Radar de Ofertas · rebajas de 8 tiendas comparadas",
      "meta.desc": "Las mejores ofertas de Amazon, Walmart, Target, Best Buy, eBay, Etsy, Temu y AliExpress en un solo lugar, con precio, descuento y fotos de cada producto.",
      "logo.aria": "Radar de Ofertas, inicio",
      "lang.aria": "Idioma",
      "search.placeholder": "Busca en las 8 tiendas",
      "search.aria": "Buscar productos",
      "search.btn": "Buscar",
      "nav.aria": "Secciones",
      "nav.top": "Más rebajadas",
      "nav.deals": "Ofertas",
      "nav.how": "Cómo elegimos",

      "hero.l1": "Ocho tiendas,",
      "hero.l2": "un solo radar.",
      "hero.lede": "Las rebajas de Amazon, Walmart, Target, Best Buy, eBay, Etsy, Temu y AliExpress, comparadas precio a precio.",
      "hero.cta": "Ver todas las ofertas",
      "hero.ctaN": "Ver las {n} ofertas",
      "hero.byCat": "Por categoría",

      "top.title": "Las rebajas más fuertes",
      "top.dealAria": "Oferta del día",
      "top.carousel": "carrusel",
      "top.carouselAria": "Ofertas más rebajadas, avanzan cada 5 segundos",
      "top.dealOfDay": "Oferta del día",
      "top.featured": "Rebaja destacada",
      "top.saveIn": "Ahorras {a} (-{d}%) en {s}",
      "top.seeDeal": "Ver en {s}",

      "ad.label": "Publicidad",
      "ad.top": "Espacio Google AdSense, banner superior",
      "ad.side": "Espacio Google AdSense, 300 × 250",
      "ad.feed": "Espacio Google AdSense · entre productos",
      "ad.foot": "Espacio Google AdSense, banner inferior",

      "cat.allDeals": "Todas las ofertas",
      "cat.aria": "Categorías",
      "tools.filters": "Filtros",
      "tools.filtersN": "Filtros ({n})",
      "tools.sort": "Ordenar",
      "sort.relevancia": "Destacados",
      "sort.descuento": "Mayor descuento",
      "sort.ahorro": "Mayor ahorro en $",
      "sort.precio-asc": "Precio: menor a mayor",
      "sort.precio-desc": "Precio: mayor a menor",
      "sort.valoracion": "Mejor valorados",
      "side.aria": "Filtros",
      "side.stores": "Tiendas",
      "side.maxPrice": "Precio",
      "range.lab": "O escribe un rango de precio",
      "range.from": "Desde $",
      "range.to": "Hasta $",
      "range.noLimit": "Sin límite",
      "range.fromTo": "De {a} a {b}",
      "range.upTo": "Hasta {b}",
      "range.fromOnly": "Desde {a}",
      "range.any": "Cualquier precio",
      "side.clear": "Borrar filtros y búsqueda",

      "results.for": "Resultados para “{q}”",
      "results.store": "Ofertas de {s}",
      "results.products1": "{n} producto",
      "results.productsN": "{n} productos",
      "results.stores1": "{n} tienda",
      "results.storesN": "{n} tiendas",
      "results.more": "Ver {n} ofertas más",
      "results.emptyTitle": "Ninguna oferta coincide con estos filtros.",
      "results.emptyText": "Prueba a quitar alguno, o",
      "results.emptyBtn": "borra todos los filtros",
      "results.emptyQueryBtn": "borra la búsqueda",
      "ew.title": "Buscar <strong>“{q}”</strong> en todas las tiendas",

      "card.rating": "{r} de 5 · {n} reseñas",
      "card.viewPhotos": "Ver fotos y ficha de {t}",
      "card.viewSheet": "Ver ficha de {t}",
      "card.photos": "{n} fotos",
      "card.compare": "Comparar",
      "card.compareX": "Comparar {t}",
      "card.save": "Ahorras {a}",
      "card.seeAt": "Ver en {s}",
      "card.updated": "Precio orientativo · {d}",

      "sheet.aria": "Ficha del producto",
      "sheet.close": "Cerrar",
      "sheet.prev": "Foto anterior",
      "sheet.next": "Foto siguiente",
      "sheet.photoN": "Foto {n}",
      "sheet.saveFull": "Ahorras {a} (-{d}%)",
      "sheet.buyAt": "Ver precio actual en {s}",
      "sheet.inCompare": "En el comparador",
      "sheet.store": "Tienda",
      "sheet.category": "Categoría",
      "sheet.usual": "Precio habitual",
      "sheet.photos": "Fotos",
      "sheet.disclaimer": "Precio orientativo comprobado el {d}. Puede cambiar: el precio válido es el que muestre {s} al comprar. Enlace de afiliado.",
      "sheet.more": "Más ofertas de {c}",

      "cmp.open": "Comparar",
      "cmp.openN": "Comparar ({n})",
      "cmp.clear": "Vaciar comparador",
      "cmp.remove": "Quitar {t}",
      "cmp.addAnother": "Añade otro producto para comparar",
      "cmp.aria": "Comparar productos",
      "cmp.title": "Comparar productos",
      "cmp.price": "Precio",
      "cmp.usual": "Precio habitual",
      "cmp.discount": "Descuento",
      "cmp.saving": "Ahorro",
      "cmp.rating": "Valoración",
      "cmp.ratingV": "{r} de 5",
      "cmp.reviews": "Reseñas",
      "cmp.store": "Tienda",
      "cmp.category": "Categoría",
      "cmp.asOf": "Precio a fecha",
      "cmp.note": "Resaltado, el mejor valor de cada fila. Precios orientativos.",

      "how.title": "Cómo elegimos las ofertas",
      "how.1h": "Primero, la rebaja",
      "how.1p": "Recorremos las ocho tiendas buscando productos con el precio rebajado de verdad, no con un descuento sobre un precio inflado.",
      "how.2h": "Luego, el precio de siempre",
      "how.2p": "Comparamos el precio actual con el habitual de la tienda y te enseñamos el ahorro en dólares y en porcentaje.",
      "how.3h": "Después, lo que opinan",
      "how.3p": "Damos prioridad a productos con buena nota y muchas reseñas de compradores, para que no haya sorpresas al abrir la caja.",
      "how.4h": "Anotamos la fecha",
      "how.4p": "Cada precio dice cuándo se comprobó. Las ofertas cambian rápido: el precio válido es el que veas en la tienda al pagar.",
      "how.5h": "Y tú pagas allí",
      "how.5p": "Compras en la tienda de siempre, con su envío y su devolución. Si entras desde aquí, nos llevamos una comisión y tú no pagas más.",

      "foot.sr": "Pie de página",
      "foot.amazon": "Como Afiliado de Amazon, obtengo ingresos por las compras adscritas que cumplen los requisitos aplicables.",
      "foot.legal": "También participo en los programas de afiliados de las demás tiendas de esta web: si compras desde nuestros enlaces podemos recibir una comisión, sin coste extra para ti. Precios orientativos a la fecha indicada en cada producto. Amazon y el logotipo de Amazon son marcas comerciales de Amazon.com, Inc. o de sus afiliados. Las demás marcas pertenecen a sus dueños.",
      "foot.navAria": "Pie",
      "foot.top": "Más rebajadas",
      "foot.all": "Todas las ofertas",
      "foot.how": "Cómo elegimos",
      "foot.back": "Volver arriba",
      "side.maxAria": "Precio máximo",
      "range.error": "«Desde» es mayor que «Hasta». Cambia uno de los dos para ver ofertas.",
      "results.emptyQueryTitle": "No tenemos ofertas guardadas para “{q}”.",
      "results.emptyQueryText": "Búscalo directamente en cada tienda con los botones de arriba, o",
      "card.compareOn": "Comparando",
      "cmp.full": "Máximo 4. Si añades otro, se quita el primero."
    },

    en: {
      "brand": "Deal Radar",
      "foot.copy": "© 2026 Deal Radar",
      "meta.title": "Deal Radar · deals from 8 stores, compared",
      "meta.desc": "The best deals from Amazon, Walmart, Target, Best Buy, eBay, Etsy, Temu and AliExpress in one place, with the price, discount and photos of every product.",
      "logo.aria": "Deal Radar, home",
      "lang.aria": "Language",
      "search.placeholder": "Search all 8 stores",
      "search.aria": "Search products",
      "search.btn": "Search",
      "nav.aria": "Sections",
      "nav.top": "Biggest discounts",
      "nav.deals": "Deals",
      "nav.how": "How we pick",

      "hero.l1": "Eight stores,",
      "hero.l2": "one radar.",
      "hero.lede": "Discounts from Amazon, Walmart, Target, Best Buy, eBay, Etsy, Temu and AliExpress, compared price by price.",
      "hero.cta": "See all deals",
      "hero.ctaN": "See all {n} deals",
      "hero.byCat": "By category",

      "top.title": "The biggest discounts",
      "top.dealAria": "Deal of the day",
      "top.carousel": "carousel",
      "top.carouselAria": "Biggest discounts, moving every 5 seconds",
      "top.dealOfDay": "Deal of the day",
      "top.featured": "Featured discount",
      "top.saveIn": "You save {a} (-{d}%) at {s}",
      "top.seeDeal": "See at {s}",

      "ad.label": "Advertisement",
      "ad.top": "Google AdSense space, top banner",
      "ad.side": "Google AdSense space, 300 × 250",
      "ad.feed": "Google AdSense space · between products",
      "ad.foot": "Google AdSense space, bottom banner",

      "cat.allDeals": "All deals",
      "cat.aria": "Categories",
      "tools.filters": "Filters",
      "tools.filtersN": "Filters ({n})",
      "tools.sort": "Sort",
      "sort.relevancia": "Featured",
      "sort.descuento": "Biggest discount",
      "sort.ahorro": "Biggest saving in $",
      "sort.precio-asc": "Price: low to high",
      "sort.precio-desc": "Price: high to low",
      "sort.valoracion": "Top rated",
      "side.aria": "Filters",
      "side.stores": "Stores",
      "side.maxPrice": "Price",
      "range.lab": "Or type a price range",
      "range.from": "From $",
      "range.to": "To $",
      "range.noLimit": "No limit",
      "range.fromTo": "{a} to {b}",
      "range.upTo": "Up to {b}",
      "range.fromOnly": "From {a}",
      "range.any": "Any price",
      "side.clear": "Clear filters and search",

      "results.for": "Results for “{q}”",
      "results.store": "{s} deals",
      "results.products1": "{n} product",
      "results.productsN": "{n} products",
      "results.stores1": "{n} store",
      "results.storesN": "{n} stores",
      "results.more": "Show {n} more deals",
      "results.emptyTitle": "No deals match these filters.",
      "results.emptyText": "Try removing one, or",
      "results.emptyBtn": "clear all filters",
      "results.emptyQueryBtn": "clear the search",
      "ew.title": "Search <strong>“{q}”</strong> in every store",

      "card.rating": "{r} out of 5 · {n} reviews",
      "card.viewPhotos": "View photos and details for {t}",
      "card.viewSheet": "View details for {t}",
      "card.photos": "{n} photos",
      "card.compare": "Compare",
      "card.compareX": "Compare {t}",
      "card.save": "You save {a}",
      "card.seeAt": "See at {s}",
      "card.updated": "Approximate price · {d}",

      "sheet.aria": "Product details",
      "sheet.close": "Close",
      "sheet.prev": "Previous photo",
      "sheet.next": "Next photo",
      "sheet.photoN": "Photo {n}",
      "sheet.saveFull": "You save {a} (-{d}%)",
      "sheet.buyAt": "See current price at {s}",
      "sheet.inCompare": "In comparison",
      "sheet.store": "Store",
      "sheet.category": "Category",
      "sheet.usual": "Usual price",
      "sheet.photos": "Photos",
      "sheet.disclaimer": "Approximate price checked on {d}. It may change: the valid price is the one {s} shows at checkout. Affiliate link.",
      "sheet.more": "More {c} deals",

      "cmp.open": "Compare",
      "cmp.openN": "Compare ({n})",
      "cmp.clear": "Clear comparison",
      "cmp.remove": "Remove {t}",
      "cmp.addAnother": "Add another product to compare",
      "cmp.aria": "Compare products",
      "cmp.title": "Compare products",
      "cmp.price": "Price",
      "cmp.usual": "Usual price",
      "cmp.discount": "Discount",
      "cmp.saving": "Saving",
      "cmp.rating": "Rating",
      "cmp.ratingV": "{r} out of 5",
      "cmp.reviews": "Reviews",
      "cmp.store": "Store",
      "cmp.category": "Category",
      "cmp.asOf": "Price as of",
      "cmp.note": "Highlighted: the best value in each row. Prices are approximate.",

      "how.title": "How we pick the deals",
      "how.1h": "First, the discount",
      "how.1p": "We go through all eight stores looking for products that are really marked down, not discounted from an inflated price.",
      "how.2h": "Then, the usual price",
      "how.2p": "We compare today's price with the store's usual price and show you the saving in dollars and as a percentage.",
      "how.3h": "Next, what buyers say",
      "how.3p": "We favour products with good ratings and plenty of buyer reviews, so there are no surprises when you open the box.",
      "how.4h": "We note the date",
      "how.4p": "Every price says when it was checked. Deals change fast: the valid price is the one you see in the store at checkout.",
      "how.5h": "And you pay there",
      "how.5p": "You buy from the store you know, with its own shipping and returns. If you come from here, we earn a commission and you pay nothing extra.",

      "foot.sr": "Footer",
      "foot.amazon": "As an Amazon Associate I earn from qualifying purchases.",
      "foot.legal": "I also take part in the affiliate programs of the other stores on this site: if you buy through our links we may earn a commission, at no extra cost to you. Prices are approximate as of the date shown on each product. Amazon and the Amazon logo are trademarks of Amazon.com, Inc. or its affiliates. Other brands belong to their owners.",
      "foot.navAria": "Footer",
      "foot.top": "Biggest discounts",
      "foot.all": "All deals",
      "foot.how": "How we pick",
      "foot.back": "Back to top",
      "side.maxAria": "Maximum price",
      "range.error": "“From” is higher than “To”. Change one of them to see deals.",
      "results.emptyQueryTitle": "We have no saved deals for “{q}”.",
      "results.emptyQueryText": "Search for it in each store with the buttons above, or",
      "card.compareOn": "Comparing",
      "cmp.full": "Maximum 4. Adding another removes the first one."
    }
  };

  // Las categorías se guardan en español en productos.js; aquí su nombre en inglés.
  const CATEGORIAS_EN = {
    "Todas": "All", "Belleza": "Beauty", "Deportes": "Sports", "Electrónica": "Electronics",
    "Herramientas": "Tools", "Hogar y cocina": "Home & kitchen", "Juguetes": "Toys",
    "Mascotas": "Pets", "Moda": "Fashion"
  };

  const IDIOMAS = ["es", "en"];
  const CLAVE = "radar-idioma";
  function inicial() {
    try { const u = new URLSearchParams(location.search).get("lang"); if (IDIOMAS.includes(u)) return u; } catch (e) {}
    try { const g = localStorage.getItem(CLAVE); if (IDIOMAS.includes(g)) return g; } catch (e) {}
    return /^es\b/i.test(navigator.language || "") ? "es" : "en";
  }
  let lang = inicial();
  document.documentElement.lang = lang;

  function t(k, v) {
    let s = (D[lang] && D[lang][k]) ?? D.es[k] ?? k;
    if (v) s = s.replace(/\{(\w+)\}/g, (m, n) => (v[n] ?? m));
    return s;
  }
  function apply(root) {
    const r = root || document;
    r.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
    r.querySelectorAll("[data-i18n-attr]").forEach((el) => {
      el.dataset.i18nAttr.split(",").forEach((par) => { const [a, k] = par.split(":"); el.setAttribute(a.trim(), t(k.trim())); });
    });
    document.title = t("meta.title");
    const m = document.querySelector('meta[name="description"]'); if (m) m.content = t("meta.desc");
    document.querySelectorAll("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.lang === lang));
  }
  function set(l) {
    if (!IDIOMAS.includes(l) || l === lang) return false;
    lang = l;
    document.documentElement.lang = l;
    try { localStorage.setItem(CLAVE, l); } catch (e) {}
    try { const u = new URL(location.href); u.searchParams.set("lang", l); history.replaceState(null, "", u); } catch (e) {}
    apply();
    return true;
  }

  window.i18n = {
    get lang() { return lang; },
    get locale() { return lang === "en" ? "en-US" : "es-US"; },
    t, apply, set,
    cat: (c) => (lang === "en" ? CATEGORIAS_EN[c] || c : c),
    catEn: (c) => CATEGORIAS_EN[c] || c,
    titulo: (p) => (lang === "en" && p.tituloEn) || p.titulo
  };
})();
