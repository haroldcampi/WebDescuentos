#!/usr/bin/env node
/*
  IMPORTAR UN FEED DE PRODUCTOS (CSV) -> productos.js

  Las redes de afiliados (Impact, CJ, Rakuten, Awin, eBay Partner Network, AliExpress Portals...)
  te dejan descargar un "product feed" en CSV con título, precio, imágenes y tu enlace de afiliado.
  Este script lo convierte al formato que usa la web.

  Uso:
     node importar-feed.js feed-walmart.csv feed-target.csv ...
  Resultado: reescribe productos.js con todos los productos de esos archivos.

  Cada red llama distinto a las columnas. Ajusta el bloque COLUMNAS si hace falta:
  a la izquierda el campo de la web, a la derecha los nombres posibles en el CSV.
*/
const fs = require("fs");
const path = require("path");

const COLUMNAS = {
  titulo:         ["titulo", "title", "name", "product name", "product_name"],
  tienda:         ["tienda", "store", "advertiser", "advertiser name", "merchant", "program name", "brand store"],
  categoria:      ["categoria", "category", "product type", "product_type", "google product category", "merchant_category"],
  precio:         ["precio", "sale price", "sale_price", "current price", "price"],
  precioAnterior: ["precioanterior", "original price", "list price", "retail price", "msrp", "price"],
  imagenes:       ["imagenes", "image url", "image_link", "image link", "imageurl", "additional image link", "additional_image_link", "image urls"],
  marca:          ["marca", "brand", "manufacturer"],
  enlace:         ["enlace", "affiliate url", "buy url", "click url", "link", "aw_deep_link", "tracking url", "url"]
};

function parseCSV(texto) {
  const filas = []; let fila = []; let campo = ""; let comillas = false;
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

const num = (v) => { const n = parseFloat(String(v || "").replace(/[^0-9.]/g, "")); return isNaN(n) ? null : n; };

function convertir(archivo) {
  const filas = parseCSV(fs.readFileSync(archivo, "utf8").replace(/^﻿/, ""));
  const cab = filas.shift().map((h) => h.trim().toLowerCase());
  const col = (campo) => cab.findIndex((h) => COLUMNAS[campo].includes(h));
  const idx = Object.fromEntries(Object.keys(COLUMNAS).map((k) => [k, col(k)]));
  // Para las imágenes se usan TODAS las columnas que parezcan de imagen
  const colsImg = cab.map((h, i) => (COLUMNAS.imagenes.includes(h) ? i : -1)).filter((i) => i >= 0);
  const tiendaPorDefecto = path.basename(archivo).replace(/^feed-|\.csv$/gi, "");
  const hoy = new Date().toISOString().slice(0, 10);

  return filas.map((f, n) => {
    const v = (k) => (idx[k] >= 0 ? (f[idx[k]] || "").trim() : "");
    const imagenes = colsImg.flatMap((i) => (f[i] || "").split(/[|,;]\s*(?=https?:)/)).map((s) => s.trim()).filter((s) => /^https?:\/\//.test(s));
    let precio = num(v("precio")), anterior = num(v("precioAnterior"));
    if (anterior !== null && precio !== null && anterior <= precio) anterior = null;
    return {
      id: `${tiendaPorDefecto}-${n + 1}`.toLowerCase().replace(/[^a-z0-9-]/g, ""),
      titulo: v("titulo"),
      tienda: v("tienda") || tiendaPorDefecto,
      categoria: (v("categoria").split(/>|\//).pop() || "Otros").trim(),
      precio, precioAnterior: anterior,
      imagenes: [...new Set(imagenes)],
      enlace: v("enlace"),
      ...(v("marca") ? { marca: v("marca") } : {}),
      actualizado: hoy
    };
  }).filter((p) => p.titulo && p.precio !== null && p.enlace);
}

const archivos = process.argv.slice(2);
if (!archivos.length) { console.log("Uso: node importar-feed.js feed1.csv [feed2.csv ...]"); process.exit(1); }
const todos = archivos.flatMap(convertir);
const salida = path.join(__dirname, "productos.js");
fs.writeFileSync(salida, `// Generado por importar-feed.js el ${new Date().toISOString()}\nwindow.PRODUCTOS = ${JSON.stringify(todos, null, 2)};\n`);
console.log(`Listo: ${todos.length} productos guardados en ${salida}`);
