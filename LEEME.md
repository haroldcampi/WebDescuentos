# Radar de Ofertas · cómo usar tu web

Web estática (HTML, CSS y JavaScript, sin servidor ni base de datos). Se sube tal cual a Hostinger, Netlify o cualquier hosting.

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `index.html` | La página. Aquí están los 4 espacios de anuncios. |
| `styles.css` | Colores, letras y diseño. |
| `app.js` | Buscador, categorías, filtros por tienda y precio, ficha con galería de fotos. |
| `productos.js` | **Tu catálogo.** Cada producto: tienda, categoría, precio, precio anterior, fotos y tu enlace de afiliado. |
| `importar-feed.js` | Convierte los feeds CSV de las redes de afiliados en `productos.js`. |

Los 31 productos que trae son de ejemplo (precios y enlaces no son reales). Las imágenes de colores son provisionales y se sustituyen solas cuando un producto tiene fotos en `imagenes`.

## Añadir productos a mano

Abre `productos.js`, copia un bloque y cambia los datos. En `imagenes` pon las URLs de las fotos que te da el programa de afiliados, y en `enlace` tu enlace con tu ID de afiliado. Las categorías y tiendas nuevas aparecen solas en los filtros.

## Cargar productos automáticamente (fotos, precios y categorías)

Para traer todos los artículos con sus fotos y precios hay que usar la API o el feed oficial de cada programa. Copiar datos de las webs de las tiendas con un "scraper" va contra las condiciones de casi todos estos programas y te pueden cerrar la cuenta.

| Tienda | Cómo se obtienen los productos |
|---|---|
| Amazon | API oficial de Amazon Associates (Product Advertising API). Amazon solo da acceso después de que tu cuenta tenga ventas calificadas. Revisa en tu panel de Associates la versión vigente de la API. Amazon pide mostrar la fecha y hora del precio y no guardar precios más de 24 h. |
| Walmart, Target | Programa en Impact: descarga del catálogo de productos (CSV/FTP). |
| Best Buy | API de productos de Best Buy (developer.bestbuy.com) + enlaces de afiliado vía su red (Impact/CJ). |
| eBay | eBay Partner Network + Browse API de eBay. |
| Etsy | Programa en Awin: feed de productos. |
| AliExpress | AliExpress Portals: API y feeds de productos. |
| Temu | Programa de afiliados de Temu (enlaces y catálogo desde su panel). |
| Otras (CJ, Rakuten, Awin, Impact) | Todas ofrecen "product feeds" en CSV por anunciante. |

Con los feeds CSV:

```
node importar-feed.js feed-walmart.csv feed-target.csv feed-etsy.csv
```

Eso reescribe `productos.js`. Si una red usa nombres de columna distintos, añádelos en el bloque `COLUMNAS` del script. Para tener precios al día, programa ese comando a diario (por ejemplo con un cron en Hostinger).

## Búsqueda en todas las tiendas

Cuando alguien busca algo, la web enseña tus productos que coinciden y, encima, un botón por tienda que abre esa misma búsqueda en Amazon, Walmart, Target, Best Buy, eBay, Etsy, Temu y AliExpress.

Para cobrar comisión por esas búsquedas, pon tus datos en el bloque `BUSQUEDA_TIENDAS` al principio de `app.js`: tu tag de Amazon (`TU-TAG-20`), tu `campid` de eBay y, para Walmart, Target, Best Buy y Etsy, tu enlace de Impact o Awin en el campo `afiliado` (el ejemplo está escrito al lado, solo hay que cambiar `TU-ID`). Copia esos enlaces de tu panel de cada red, que te da el formato exacto.

Mostrar los productos de las tiendas dentro de tu web, en vivo, necesita las API de cada tienda y un pequeño servidor que guarde tus claves; se puede añadir cuando tengas las cuentas aprobadas.

## Confianza, urgencia, alertas y comunidad

- **Etiquetas en cada oferta** (campos opcionales en `productos.js`): `verificado: true` muestra «Verificada»; `publicado: "AAAA-MM-DD"` muestra «Nueva» durante 2 días; `termina: "AAAA-MM-DD"` muestra «Termina en…» y oculta la oferta cuando pasa la fecha.
- **Alertas**: el visitante busca algo y pulsa «Avísame». Al volver, la campana de la cabecera cuenta las ofertas nuevas que coinciden. Se guardan en su navegador (sin correo ni registro).
- **App instalable**: `manifest.webmanifest`, `sw.js` y los iconos permiten instalar la web en el móvil. Solo funciona con la web publicada en https.
- **Votos y comentarios** (Supabase): ejecuta `supabase db push` (aplica `supabase/migrations/20261023000000_comunidad.sql`) o pega ese archivo en el SQL Editor de Supabase, y pon la URL y la clave pública "anon" en el bloque `SUPABASE` al principio de `app.js`. Mientras esté vacío, no se muestran. Para ocultar un comentario, marca `oculto` en la tabla `comentarios`.

## Google AdSense

1. En `index.html`, quita los comentarios de la línea `adsbygoogle.js` del `<head>` y pon tu `ca-pub-...`.
2. Sustituye el contenido de cada caja gris (`ad-superior`, `ad-lateral`, `ad-inferior`) por el bloque `<ins class="adsbygoogle" ...></ins>` que te da AdSense, seguido de `<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>`.
3. El anuncio intercalado entre productos está en `app.js`, función `anuncioFeed` (cada 8 productos; cámbialo en `ANUNCIO_CADA`).

Google exige contenido propio además de los productos para aprobar la web; conviene añadir guías o reseñas.

## Aviso legal

El pie ya incluye la frase obligatoria de Amazon ("Como Afiliado de Amazon, obtengo ingresos…") y el aviso de los demás programas. Añade una página de privacidad antes de activar AdSense.

## Diseño (octubre 2026)

La portada muestra un **anillo con las 20 ofertas de mayor descuento** alrededor del titular: al pasar el ratón (o el foco) por una, la frase de debajo enseña su nombre, precio y tienda; al pulsarla se abre su ficha. Se rellena sola desde `productos.js`, igual que la lista de tiendas y categorías, la tira "Las rebajas más fuertes" y la oferta del día.

La copia de la versión anterior está en `../web-ofertas-backup-20261018/`.

## Idiomas (español e inglés)

La web está en español y en inglés. El botón **ES / EN** de la cabecera cambia el idioma y recuerda la elección. La primera vez se usa el idioma del navegador del visitante. Para enlazar directamente una versión, añade `?lang=en` o `?lang=es` a la dirección.

- **Textos de la página:** están en `i18n.js`, en dos bloques (`es` y `en`). Para cambiar una frase, cámbiala en los dos.
- **Productos:** en `productos.js`, el campo `tituloEn` es el título en inglés. Si falta, la versión inglesa muestra el título en español.
- **Categorías:** se escriben en español en `productos.js` y su nombre en inglés está en `CATEGORIAS_EN`, dentro de `i18n.js`. Si creas una categoría nueva, añádela ahí.
- **Aviso de Amazon:** en inglés se usa la frase oficial: "As an Amazon Associate I earn from qualifying purchases."

## Rendimiento con catálogos grandes

El catálogo muestra las ofertas de 24 en 24, con un botón «Ver N ofertas más». Así la web sigue rápida en el móvil aunque cargues cientos de productos desde feeds. Para cambiar el número de cada tanda, edita `POR_TANDA` en `app.js`.
