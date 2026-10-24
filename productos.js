/*
  CATÁLOGO DE PRODUCTOS
  ---------------------
  Cada producto es un objeto. Para añadir uno, copia un bloque y cambia los datos.
  - tienda: "Amazon", "Walmart", "Target", "Best Buy", "eBay", "Etsy", "Temu" o "AliExpress"
  - imagenes: lista de URLs de las fotos que te da la tienda o su API/feed.
              Si la dejas vacía [], la web dibuja una imagen provisional.
  - tituloEn: (opcional) el título en inglés. Si falta, la versión inglesa muestra el título en español.
  - enlace:   TU enlace de afiliado (con tu tag/ID de seguimiento).
  - precio / precioAnterior: en dólares (USD). precioAnterior es opcional (para mostrar el descuento).
  - actualizado: fecha en que comprobaste el precio (Amazon exige mostrarla).
  - marca:      (opcional) marca del producto, para «Agrupar por marca».
  - tipo:       (opcional) tipo de oferta propio, p. ej. "Cupón", "Liquidación", "Envío gratis".
                Si falta, se deduce: por tiempo limitado, gran rebaja (40 % o más), rebaja o precio normal.
  - verificado: (opcional) true si comprobaste a mano precio y tienda -> etiqueta «Verificada».
  - publicado:  (opcional) "AAAA-MM-DD" en que añadiste la oferta -> etiqueta «Nueva» durante 2 días.
  - termina:    (opcional) "AAAA-MM-DD" (o "AAAA-MM-DDTHH:MM") en que acaba la oferta -> «Termina en…».
                Pasada esa fecha, la oferta deja de mostrarse sola.

  Los productos de abajo son EJEMPLOS: precios y enlaces no son reales.
  Puedes regenerar este archivo automáticamente desde un feed CSV con:
      node importar-feed.js mi-feed.csv
*/
window.PRODUCTOS = [
  { id: "amz-001", titulo: "Auriculares inalámbricos con cancelación de ruido, 40 h de batería", tituloEn: "Wireless noise-cancelling headphones, 40-hour battery", tienda: "Amazon", categoria: "Electrónica", precio: 59.99, precioAnterior: 99.99, valoracion: 4.6, resenas: 18240, imagenes: [], enlace: "https://www.amazon.com/dp/EJEMPLO01?tag=TU-TAG-20", actualizado: "2026-10-17", verificado: true, publicado: "2026-10-23", termina: "2026-10-24T23:00" },
  { id: "amz-002", titulo: "Freidora de aire 6 qt con ventana y 8 programas", tituloEn: "6 qt air fryer with window and 8 presets", tienda: "Amazon", categoria: "Hogar y cocina", precio: 69.95, precioAnterior: 119.99, valoracion: 4.7, resenas: 32110, imagenes: [], enlace: "https://www.amazon.com/dp/EJEMPLO02?tag=TU-TAG-20", actualizado: "2026-10-17", verificado: true, termina: "2026-10-29" },
  { id: "amz-003", titulo: "Tablet 10\" Full HD, 64 GB, con funda", tituloEn: "10\" Full HD tablet, 64 GB, with case", tienda: "Amazon", categoria: "Electrónica", precio: 89.99, precioAnterior: 139.99, valoracion: 4.5, resenas: 9420, imagenes: [], enlace: "https://www.amazon.com/dp/EJEMPLO03?tag=TU-TAG-20", actualizado: "2026-10-17" },
  { id: "amz-004", titulo: "Set de mancuernas ajustables de 5 a 52 lb", tituloEn: "Adjustable dumbbell set, 5 to 52 lb", tienda: "Amazon", categoria: "Deportes", precio: 249.0, precioAnterior: 349.0, valoracion: 4.8, resenas: 6120, imagenes: [], enlace: "https://www.amazon.com/dp/EJEMPLO04?tag=TU-TAG-20", actualizado: "2026-10-17" },
  { id: "amz-005", titulo: "Sérum de vitamina C con ácido hialurónico, 30 ml", tituloEn: "Vitamin C serum with hyaluronic acid, 30 ml", tienda: "Amazon", categoria: "Belleza", precio: 14.99, precioAnterior: 24.99, valoracion: 4.4, resenas: 51200, imagenes: [], enlace: "https://www.amazon.com/dp/EJEMPLO05?tag=TU-TAG-20", actualizado: "2026-10-17" },

  { id: "wmt-001", titulo: "Smart TV 55\" 4K UHD con HDR", tituloEn: "55\" 4K UHD smart TV with HDR", tienda: "Walmart", categoria: "Electrónica", precio: 268.0, precioAnterior: 348.0, valoracion: 4.4, resenas: 12030, imagenes: [], enlace: "https://www.walmart.com/ip/EJEMPLO01", actualizado: "2026-10-17", verificado: true, publicado: "2026-10-22" },
  { id: "wmt-002", titulo: "Aspiradora robot con mapeo y base de autovaciado", tituloEn: "Robot vacuum with mapping and self-empty base", tienda: "Walmart", categoria: "Hogar y cocina", precio: 179.0, precioAnterior: 299.0, valoracion: 4.3, resenas: 2210, imagenes: [], enlace: "https://www.walmart.com/ip/EJEMPLO02", actualizado: "2026-10-17", verificado: true, termina: "2026-10-25" },
  { id: "wmt-003", titulo: "Bicicleta de montaña 27.5\" de 21 velocidades", tituloEn: "27.5\" 21-speed mountain bike", tienda: "Walmart", categoria: "Deportes", precio: 198.0, precioAnterior: 278.0, valoracion: 4.2, resenas: 1840, imagenes: [], enlace: "https://www.walmart.com/ip/EJEMPLO03", actualizado: "2026-10-17" },
  { id: "wmt-004", titulo: "Comida seca para perro adulto, pollo y arroz, 40 lb", tituloEn: "Adult dry dog food, chicken and rice, 40 lb", tienda: "Walmart", categoria: "Mascotas", precio: 42.98, precioAnterior: 52.98, valoracion: 4.7, resenas: 8800, imagenes: [], enlace: "https://www.walmart.com/ip/EJEMPLO04", actualizado: "2026-10-17" },

  { id: "tgt-001", titulo: "Juego de sábanas de algodón 400 hilos, Queen", tituloEn: "400 thread count cotton sheet set, Queen", tienda: "Target", categoria: "Hogar y cocina", precio: 35.0, precioAnterior: 50.0, valoracion: 4.6, resenas: 3150, imagenes: [], enlace: "https://www.target.com/p/EJEMPLO01", actualizado: "2026-10-17" },
  { id: "tgt-002", titulo: "Set de bloques de construcción, 1.000 piezas", tituloEn: "Building block set, 1,000 pieces", tienda: "Target", categoria: "Juguetes", precio: 39.99, precioAnterior: 59.99, valoracion: 4.8, resenas: 1270, imagenes: [], enlace: "https://www.target.com/p/EJEMPLO02", actualizado: "2026-10-17", publicado: "2026-10-23" },
  { id: "tgt-003", titulo: "Chaqueta acolchada para mujer, resistente al agua", tituloEn: "Women's water-resistant puffer jacket", tienda: "Target", categoria: "Moda", precio: 32.0, precioAnterior: 45.0, valoracion: 4.5, resenas: 890, imagenes: [], enlace: "https://www.target.com/p/EJEMPLO03", actualizado: "2026-10-17" },
  { id: "tgt-004", titulo: "Cafetera de goteo programable, 12 tazas", tituloEn: "Programmable drip coffee maker, 12 cups", tienda: "Target", categoria: "Hogar y cocina", precio: 24.99, precioAnterior: 39.99, valoracion: 4.3, resenas: 2440, imagenes: [], enlace: "https://www.target.com/p/EJEMPLO04", actualizado: "2026-10-17" },

  { id: "bby-001", titulo: "Portátil 15.6\" con 16 GB RAM y SSD de 512 GB", tituloEn: "15.6\" laptop with 16 GB RAM and 512 GB SSD", tienda: "Best Buy", categoria: "Electrónica", precio: 549.99, precioAnterior: 749.99, valoracion: 4.5, resenas: 2980, imagenes: [], enlace: "https://www.bestbuy.com/site/EJEMPLO01", actualizado: "2026-10-17", verificado: true, termina: "2026-11-02" },
  { id: "bby-002", titulo: "Monitor gaming 27\" QHD 165 Hz", tituloEn: "27\" QHD 165 Hz gaming monitor", tienda: "Best Buy", categoria: "Electrónica", precio: 199.99, precioAnterior: 299.99, valoracion: 4.7, resenas: 4510, imagenes: [], enlace: "https://www.bestbuy.com/site/EJEMPLO02", actualizado: "2026-10-17", verificado: true, publicado: "2026-10-22", termina: "2026-10-26" },
  { id: "bby-003", titulo: "Reloj inteligente con GPS y medición de oxígeno", tituloEn: "Smartwatch with GPS and blood oxygen tracking", tienda: "Best Buy", categoria: "Electrónica", precio: 179.99, precioAnterior: 249.99, valoracion: 4.6, resenas: 3320, imagenes: [], enlace: "https://www.bestbuy.com/site/EJEMPLO03", actualizado: "2026-10-17" },
  { id: "bby-004", titulo: "Licuadora de alta potencia 1.400 W", tituloEn: "1,400 W high-power blender", tienda: "Best Buy", categoria: "Hogar y cocina", precio: 89.99, precioAnterior: 129.99, valoracion: 4.6, resenas: 1150, imagenes: [], enlace: "https://www.bestbuy.com/site/EJEMPLO04", actualizado: "2026-10-17" },

  { id: "eby-001", titulo: "Consola portátil reacondicionada, 64 GB", tituloEn: "Refurbished handheld console, 64 GB", tienda: "eBay", categoria: "Electrónica", precio: 229.0, precioAnterior: 299.0, valoracion: 4.5, resenas: 640, imagenes: [], enlace: "https://www.ebay.com/itm/EJEMPLO01", actualizado: "2026-10-17" },
  { id: "eby-002", titulo: "Taladro percutor inalámbrico 20 V con 2 baterías", tituloEn: "20 V cordless hammer drill with 2 batteries", tienda: "eBay", categoria: "Herramientas", precio: 79.99, precioAnterior: 129.0, valoracion: 4.7, resenas: 2100, imagenes: [], enlace: "https://www.ebay.com/itm/EJEMPLO02", actualizado: "2026-10-17", verificado: true },
  { id: "eby-003", titulo: "Zapatillas de running para hombre, talla 10", tituloEn: "Men's running shoes, size 10", tienda: "eBay", categoria: "Moda", precio: 64.99, precioAnterior: 120.0, valoracion: 4.6, resenas: 410, imagenes: [], enlace: "https://www.ebay.com/itm/EJEMPLO03", actualizado: "2026-10-17" },

  { id: "ety-001", titulo: "Collar personalizado con nombre en plata 925", tituloEn: "Personalized name necklace in 925 silver", tienda: "Etsy", categoria: "Moda", precio: 28.5, precioAnterior: 38.0, valoracion: 4.9, resenas: 15300, imagenes: [], enlace: "https://www.etsy.com/listing/EJEMPLO01", actualizado: "2026-10-17" },
  { id: "ety-002", titulo: "Vela de soja hecha a mano, aroma lavanda", tituloEn: "Handmade soy candle, lavender scent", tienda: "Etsy", categoria: "Hogar y cocina", precio: 18.0, precioAnterior: null, valoracion: 4.9, resenas: 2870, imagenes: [], enlace: "https://www.etsy.com/listing/EJEMPLO02", actualizado: "2026-10-17" },
  { id: "ety-003", titulo: "Cama para gato tejida a mano, lana natural", tituloEn: "Hand-knitted cat bed, natural wool", tienda: "Etsy", categoria: "Mascotas", precio: 46.0, precioAnterior: 54.0, valoracion: 4.8, resenas: 960, imagenes: [], enlace: "https://www.etsy.com/listing/EJEMPLO03", actualizado: "2026-10-17" },

  { id: "temu-001", titulo: "Organizador de maquillaje giratorio 360°", tituloEn: "360° rotating makeup organizer", tienda: "Temu", categoria: "Belleza", precio: 9.98, precioAnterior: 22.99, valoracion: 4.6, resenas: 7400, imagenes: [], enlace: "https://www.temu.com/EJEMPLO01.html", actualizado: "2026-10-17" },
  { id: "temu-002", titulo: "Juego de 12 destornilladores de precisión magnéticos", tituloEn: "12-piece magnetic precision screwdriver set", tienda: "Temu", categoria: "Herramientas", precio: 6.49, precioAnterior: 15.99, valoracion: 4.5, resenas: 5100, imagenes: [], enlace: "https://www.temu.com/EJEMPLO02.html", actualizado: "2026-10-17" },
  { id: "temu-003", titulo: "Bandas de resistencia, set de 5 niveles", tituloEn: "Resistance bands, 5-level set", tienda: "Temu", categoria: "Deportes", precio: 5.99, precioAnterior: 13.49, valoracion: 4.6, resenas: 11800, imagenes: [], enlace: "https://www.temu.com/EJEMPLO03.html", actualizado: "2026-10-17" },
  { id: "temu-004", titulo: "Coche teledirigido todoterreno 1:16", tituloEn: "1:16 off-road remote control car", tienda: "Temu", categoria: "Juguetes", precio: 19.79, precioAnterior: 42.0, valoracion: 4.4, resenas: 2300, imagenes: [], enlace: "https://www.temu.com/EJEMPLO04.html", actualizado: "2026-10-17" },

  { id: "ali-001", titulo: "Mini proyector portátil 1080p con Wi-Fi", tituloEn: "Portable 1080p mini projector with Wi-Fi", tienda: "AliExpress", categoria: "Electrónica", precio: 54.3, precioAnterior: 98.7, valoracion: 4.6, resenas: 8900, imagenes: [], enlace: "https://www.aliexpress.us/item/EJEMPLO01.html", actualizado: "2026-10-17" },
  { id: "ali-002", titulo: "Fuente de agua para gatos con filtro, 2.5 L", tituloEn: "Cat water fountain with filter, 2.5 L", tienda: "AliExpress", categoria: "Mascotas", precio: 15.6, precioAnterior: 29.9, valoracion: 4.7, resenas: 4020, imagenes: [], enlace: "https://www.aliexpress.us/item/EJEMPLO02.html", actualizado: "2026-10-17" },
  { id: "ali-003", titulo: "Rizador de pelo cerámico inalámbrico", tituloEn: "Cordless ceramic hair curler", tienda: "AliExpress", categoria: "Belleza", precio: 21.4, precioAnterior: 39.0, valoracion: 4.3, resenas: 1300, imagenes: [], enlace: "https://www.aliexpress.us/item/EJEMPLO03.html", actualizado: "2026-10-17" },
  { id: "ali-004", titulo: "Llave de impacto eléctrica sin escobillas", tituloEn: "Brushless electric impact wrench", tienda: "AliExpress", categoria: "Herramientas", precio: 48.9, precioAnterior: 89.0, valoracion: 4.5, resenas: 2760, imagenes: [], enlace: "https://www.aliexpress.us/item/EJEMPLO04.html", actualizado: "2026-10-17" }
];
