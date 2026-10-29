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

| Tienda | Programa de afiliados | Cómo se obtienen los productos |
|---|---|---|
| Amazon | Amazon Associates: affiliate-program.amazon.com | API oficial (Product Advertising API). Amazon solo da acceso después de que tu cuenta tenga ventas calificadas. Pide mostrar la fecha y hora del precio y no guardar precios más de 24 h. |
| Walmart | affiliates.walmart.com (gestionado en Impact) | Descarga del catálogo de productos (CSV/FTP) desde Impact. |
| Target | partners.target.com (gestionado en Impact) | Descarga del catálogo de productos desde Impact. |
| Best Buy | Se solicita en impact.com (busca "Best Buy" dentro de la plataforma) | API de productos de Best Buy (developer.bestbuy.com) o el catálogo de Impact. |
| eBay | eBay Partner Network: partnernetwork.ebay.com | Browse API de eBay. |
| Etsy | etsy.com/affiliates (gestionado en Awin) | Feed de productos de Awin. |
| Temu | temu.com/affiliate | Enlaces y catálogo desde su panel de afiliados. |
| AliExpress | AliExpress Portals: portals.aliexpress.com | API y feeds de productos de Portals. |
| Home Depot | A través de impact.com | Catálogo de productos (CSV) desde Impact. |
| Lowe's | A través de impact.com y cj.com | Catálogo de productos (CSV) desde Impact o CJ. |

Con los feeds CSV:

```
node importar-feed.js feed-walmart.csv feed-target.csv feed-etsy.csv
```

Eso reescribe `productos.js`. Si una red usa nombres de columna distintos, añádelos en el bloque `COLUMNAS` del script. Para tener precios al día, programa ese comando a diario (por ejemplo con un cron en Hostinger).

## Búsqueda

Al escribir en el buscador de arriba, la página baja sola hasta los resultados y muestra «Buscar “…” en todas las tiendas» encima de los productos que coinciden.

El bloque `BUSQUEDA_TIENDAS` de `app.js` (enlaces de búsqueda de cada tienda con tu ID de afiliado) ya no se muestra en la web; se conserva por si quieres volver a poner los botones de cada tienda.

## Confianza, urgencia, alertas y comunidad

- **Etiquetas en cada oferta** (campos opcionales en `productos.js`): `verificado: true` muestra «Verificada»; `publicado: "AAAA-MM-DD"` muestra «Nueva» durante 2 días; `termina: "AAAA-MM-DD"` muestra «Termina en…» y oculta la oferta cuando pasa la fecha.
- **Alertas**: el visitante busca algo y pulsa «Avísame». Al volver, la campana de la cabecera cuenta las ofertas nuevas que coinciden. Se guardan en su navegador (sin correo ni registro).
- **App instalable**: `manifest.webmanifest`, `sw.js` y los iconos permiten instalar la web en el móvil. Solo funciona con la web publicada en https.
- **Votos y comentarios** (Supabase): ejecuta `supabase db push` (aplica `supabase/migrations/20261023000000_comunidad.sql`) o pega ese archivo en el SQL Editor de Supabase, y pon la URL y la clave pública "anon" en el bloque `SUPABASE` al principio de `app.js`. Mientras esté vacío, no se muestran. Para ocultar un comentario, marca `oculto` en la tabla `comentarios`.

## Historial de precios, cupones y ofertas de la comunidad

- **Historial de precios**: cada producto puede llevar `historial` (lista de fechas y precios). La ficha muestra la gráfica, el mínimo, la media y el máximo de 90 días, la etiqueta «Mínimo en 90 días» y avisa de **descuentos dudosos** cuando el «precio antes» no aparece en el historial. `importar-feed.js` lo va completando solo: ejecútalo cada día y guardará hasta 180 días.
- **Campos opcionales nuevos** en `productos.js`: `cupon`, `prime`, `reclamado` (% vendido en ofertas relámpago) y `errorPrecio`. Las ofertas con 70 % o más se marcan solas como «Posible error de precio».
- **Alerta con precio objetivo**: quien sigue un producto puede poner «Avísame si baja de $X».
- **Eventos**: la franja de Black Friday y Cyber Monday sale sola en los 60 días previos. Añade o cambia eventos en el bloque `EVENTOS` de `app.js`.
- **Ofertas de la comunidad**: lo que envían los usuarios llega a Supabase, tabla `ofertas_enviadas`, con estado `pendiente`. Revísalas allí; si una es buena, añádela a `productos.js` y cambia su estado a `publicada` (o `rechazada`).

## Google AdSense

Tu código de AdSense (`ca-pub-6410047185817436`) ya está en el `<head>` de `index.html`, y `ads.txt` está creado.

1. **Bloques de anuncio**: en AdSense, ve a *Anuncios > Por bloque de anuncios* y crea un anuncio **de display** para cada espacio (superior, lateral e inferior). Copia su número `data-ad-slot` y pégalo en el bloque `ADSENSE` al principio de `app.js`. Hasta entonces, cada espacio enseña el recuadro «Publicidad».
2. **Sin anuncios entre productos**: la web nunca pone anuncios dentro de la lista. En AdSense, en *Anuncios > Por sitio*, desactiva los **anuncios automáticos** (o al menos los anuncios «in-page»), porque si están activos Google decide solo dónde ponerlos y podría meterlos entre productos.
3. **ads.txt**: Google lo busca en la raíz del dominio (`tudominio.com/ads.txt`). Con un dominio propio funciona tal cual. En `haroldcampi.github.io/WebDescuentos/` no está en la raíz: tendría que ir en un repositorio llamado `haroldcampi.github.io`.

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
