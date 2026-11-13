# Radar de Ofertas · cómo usar tu web

Web hecha con **Next.js (Pages Router) + TypeScript + Tailwind CSS v4**. Se compila a una web estática (HTML, CSS y JavaScript, sin servidor): `npm run build` genera la carpeta `out/`, que se publica en Vercel o se sube tal cual a Hostinger, Netlify o cualquier hosting.

## Trabajar con la web

```
npm install        # la primera vez
npm run dev        # web en http://localhost:3000 con recarga al guardar
npm run build      # genera out/ y comprueba que la CSP de vercel.json permite los scripts de la página
npm start          # sirve out/ para probar la versión final
npm run typecheck  # revisa los tipos de TypeScript
```

Vercel detecta Next.js y ejecuta `npm run build` solo en cada push. Para Hostinger, sube el contenido de `out/`.

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `src/pages/index.tsx` | La página: orden de las secciones y los 3 espacios de anuncios. |
| `src/pages/_document.tsx` | El `<head>`: fuentes, iconos, verificación de Impact, AdSense y el script del tema. |
| `src/components/` | Cada parte de la web (cabecera, catálogo, tarjeta, ficha, comparador, cuenta…), con sus estilos en clases de Tailwind. |
| `src/components/ui.ts` | Estilos que se repiten (botones, campos, etiquetas). |
| `src/styles/globals.css` | Colores, letras y medidas del diseño (`@theme` de Tailwind), modo oscuro y animaciones. |
| `src/lib/config.ts` | Ajustes: AdSense, Supabase, colores de tiendas, eventos de rebajas, tamaño de las tandas. |
| `src/lib/catalogo.ts` | Descuentos, urgencia, historial de precios, filtros, orden y grupos. |
| `src/lib/i18n/textos.ts` | Todos los textos en español e inglés. |
| `src/data/productos.ts` | **Tu catálogo.** Cada producto: tienda, categoría, precio, precio anterior, fotos y tu enlace de afiliado. |
| `scripts/importar-feed.ts` | Convierte los feeds CSV de las redes de afiliados en `src/data/productos.ts`. |
| `public/` | Archivos que se publican tal cual: iconos, `manifest.webmanifest`, `sw.js`, `ads.txt`. |

Los 31 productos que trae son de ejemplo (precios y enlaces no son reales). Las imágenes de colores son provisionales y se sustituyen solas cuando un producto tiene fotos en `imagenes`.

## Añadir productos a mano

Abre `src/data/productos.ts`, copia una línea y cambia los datos. En `imagenes` pon las URLs de las fotos que te da el programa de afiliados, y en `enlace` tu enlace con tu ID de afiliado. Las categorías y tiendas nuevas aparecen solas en los filtros.

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
npm run importar -- feed-walmart.csv feed-target.csv feed-etsy.csv
npm run build
```

Eso reescribe `src/data/productos.ts` y `npm run build` vuelve a generar la web. Si una red usa nombres de columna distintos, añádelos en el bloque `COLUMNAS` del script. Para tener precios al día, programa esos dos comandos a diario (por ejemplo con un cron, o un GitHub Action que haga commit y deje que Vercel publique).

## Búsqueda

Al escribir en el buscador de arriba, la página baja sola hasta los resultados y muestra «Buscar “…” en todas las tiendas» encima de los productos que coinciden.

El bloque `BUSQUEDA_TIENDAS` de `src/lib/config.ts` (enlaces de búsqueda de cada tienda con tu ID de afiliado) ya no se muestra en la web; se conserva por si quieres volver a poner los botones de cada tienda.

## Confianza, urgencia, alertas y comunidad

- **Etiquetas en cada oferta** (campos opcionales en `src/data/productos.ts`): `verificado: true` muestra «Verificada»; `publicado: "AAAA-MM-DD"` muestra «Nueva» durante 2 días; `termina: "AAAA-MM-DD"` muestra «Termina en…» y oculta la oferta cuando pasa la fecha.
- **Alertas**: el visitante busca algo y pulsa «Avísame». Al volver, la campana de la cabecera cuenta las ofertas nuevas que coinciden. Se guardan en su navegador (sin correo ni registro).
- **App instalable**: `public/manifest.webmanifest`, `public/sw.js` y los iconos permiten instalar la web en el móvil. Solo funciona con la web publicada en https.
- **Votos y comentarios** (Supabase): ejecuta `supabase db push` (aplica `supabase/migrations/20261023000000_comunidad.sql`) o pega ese archivo en el SQL Editor de Supabase, y pon la URL y la clave pública "anon" en el bloque `SUPABASE` de `src/lib/config.ts`. Mientras esté vacío, no se muestran. Para ocultar un comentario, marca `oculto` en la tabla `comentarios`.

## Historial de precios, cupones y ofertas de la comunidad

- **Historial de precios**: cada producto puede llevar `historial` (lista de fechas y precios). La ficha muestra la gráfica, el mínimo, la media y el máximo de 90 días, la etiqueta «Mínimo en 90 días» y avisa de **descuentos dudosos** cuando el «precio antes» no aparece en el historial. `scripts/importar-feed.ts` lo va completando solo: ejecútalo cada día y guardará hasta 180 días.
- **Campos opcionales nuevos** en `src/data/productos.ts`: `cupon`, `prime`, `reclamado` (% vendido en ofertas relámpago) y `errorPrecio`. Las ofertas con 70 % o más se marcan solas como «Posible error de precio».
- **Alerta con precio objetivo**: quien sigue un producto puede poner «Avísame si baja de $X».
- **Eventos**: la franja de Black Friday y Cyber Monday sale sola en los 60 días previos. Añade o cambia eventos en el bloque `EVENTOS` de `src/lib/config.ts`.
- **Ofertas de la comunidad**: lo que envían los usuarios llega a Supabase, tabla `ofertas_enviadas`, con estado `pendiente`. Revísalas allí; si una es buena, añádela a `src/data/productos.ts` y cambia su estado a `publicada` (o `rechazada`).

## Google AdSense

Tu código de AdSense (`ca-pub-6410047185817436`) ya está en el `<head>` de `src/pages/_document.tsx`, y `public/ads.txt` está creado.

1. **Bloques de anuncio**: en AdSense, ve a *Anuncios > Por bloque de anuncios* y crea un anuncio **de display** para cada espacio (superior, lateral e inferior). Copia su número `data-ad-slot` y pégalo en el bloque `ADSENSE` de `src/lib/config.ts`. Hasta entonces, cada espacio enseña el recuadro «Publicidad».
2. **Sin anuncios entre productos**: la web nunca pone anuncios dentro de la lista. En AdSense, en *Anuncios > Por sitio*, desactiva los **anuncios automáticos** (o al menos los anuncios «in-page»), porque si están activos Google decide solo dónde ponerlos y podría meterlos entre productos.
3. **ads.txt**: Google lo busca en la raíz del dominio (`tudominio.com/ads.txt`). Con un dominio propio funciona tal cual. En `haroldcampi.github.io/WebDescuentos/` no está en la raíz: tendría que ir en un repositorio llamado `haroldcampi.github.io`.

Google exige contenido propio además de los productos para aprobar la web; conviene añadir guías o reseñas.

## Aviso legal

El pie ya incluye la frase obligatoria de Amazon ("Como Afiliado de Amazon, obtengo ingresos…") y el aviso de los demás programas. Añade una página de privacidad antes de activar AdSense.

## Diseño (octubre 2026)

La portada muestra un **anillo con las 20 ofertas de mayor descuento** alrededor del titular: al pasar el ratón (o el foco) por una, la frase de debajo enseña su nombre, precio y tienda; al pulsarla se abre su ficha. Se rellena sola desde `src/data/productos.ts`, igual que la lista de tiendas y categorías, la tira "Las rebajas más fuertes" y la oferta del día.

La copia de la versión anterior está en `../web-ofertas-backup-20261018/`.

## Idiomas (español e inglés)

La web está en español y en inglés. El botón **ES / EN** de la cabecera cambia el idioma y recuerda la elección. La primera vez se usa el idioma del navegador del visitante. Para enlazar directamente una versión, añade `?lang=en` o `?lang=es` a la dirección.

- **Textos de la página:** están en `src/lib/i18n/textos.ts`, en dos bloques (`es` y `en`). Para cambiar una frase, cámbiala en los dos.
- **Productos:** en `src/data/productos.ts`, el campo `tituloEn` es el título en inglés. Si falta, la versión inglesa muestra el título en español.
- **Categorías:** se escriben en español en `src/data/productos.ts` y su nombre en inglés está en `CATEGORIAS_EN`, dentro de `src/lib/i18n/textos.ts`. Si creas una categoría nueva, añádela ahí.
- **Aviso de Amazon:** en inglés se usa la frase oficial: "As an Amazon Associate I earn from qualifying purchases."

## Rendimiento con catálogos grandes

El catálogo muestra las ofertas de 24 en 24, con un botón «Ver N ofertas más». Así la web sigue rápida en el móvil aunque cargues cientos de productos desde feeds. Para cambiar el número de cada tanda, edita `POR_TANDA` en `src/lib/config.ts`.

## Seguridad (noviembre 2026)

- **Claves**: en `src/lib/config.ts` solo va la clave pública «anon» de Supabase, que está hecha para estar en el navegador. La seguridad la ponen los permisos de la base de datos. La clave `service_role` (o `sb_secret_…`) **nunca** debe ir en ningún archivo de la web ni del repositorio.
- **Base de datos**: todas las tablas están cerradas. La web solo lee lo público (comentarios visibles y puntuaciones) y escribe a través de funciones que validan los datos. Cada cuenta solo ve sus favoritos, alertas, perfil y ofertas. Las tablas y funciones nuevas empiezan cerradas: cada migración tiene que dar los permisos a mano.
- **Límites**: votos (120 por hora y 6 al día por oferta, por IP), comentarios (3 cada 10 min y 20 al día por cuenta, 30 al día por IP), ofertas (5 al día por cuenta, 15 por IP) y comprobación de nombres (60 cada 10 min por IP). Los de entrar, registrarse y emails los pone Supabase Auth.
- **Vigilar** (Supabase > SQL Editor):
  - `select * from seguridad.resumen;` intentos bloqueados en 24 h, por tipo e IP.
  - `select * from seguridad.actividad_cuentas;` registros y peticiones de contraseña por IP en 24 h.
  - Supabase > Logs > Auth para intentos de entrada fallidos.
- **Contraseñas**: las guarda Supabase con bcrypt (la web nunca las ve guardadas). Mínimo 8 caracteres con letras y números. Los enlaces de recuperación caducan a los 30 minutos y sirven una sola vez.
- **Navegador**: `vercel.json` envía una política de contenido (cabecera `Content-Security-Policy`) que solo deja ejecutar JavaScript de esta web y de Google AdSense. Si añades un script en línea o de otro dominio, añádelo a esa cabecera o el navegador lo bloqueará. Si cambias el script del tema (`SCRIPT_TEMA` en `src/pages/_document.tsx`), recalcula su `sha256` y cámbialo en `vercel.json`: `npm run build` avisa y falla si algún script en línea no está permitido. Por eso la web se compila con webpack (`next build --webpack`) y con Pages Router: Turbopack y el App Router meten scripts de arranque en línea que la CSP bloquearía.
- **Cabeceras** (Vercel): `vercel.json` fuerza https, impide meter la web en marcos de otras webs y añade el resto de cabeceras de seguridad. `.vercelignore` deja fuera de la publicación este LEEME y la carpeta `supabase`.
- **supabase-js** se instala con npm (`@supabase/supabase-js`, versión fija en `package.json`) y va dentro del JavaScript de la web, no desde un CDN externo. Para actualizarlo: `npm install @supabase/supabase-js@VERSIÓN` y `npm run build`.
- **Aplicar cambios de Supabase**: las migraciones con `supabase db push`; los ajustes de `[auth]` de `supabase/config.toml` con `supabase config push` (o a mano en Authentication > Settings).
