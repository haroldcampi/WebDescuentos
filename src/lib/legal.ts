/* Textos legales (Privacidad, Términos, Cookies y Créditos), en español e inglés, para una web dirigida a EE. UU.
   Marcadores que se rellenan con config.ts → LEGAL: {titular} {email} {estado}. Si faltan, la página los marca como PENDIENTE.
   IMPORTANTE: es un punto de partida redactado a partir de cómo funciona la web; debe revisarlo un abogado antes de publicar. */
import type { Idioma } from "./i18n";

// Un bloque es un párrafo (texto) o una lista (array de textos)
export type Bloque = string | string[];
export interface Seccion { h: string; b: Bloque[] }
export interface Documento { titulo: string; intro?: string; secciones: Seccion[] }
export type DocLegal = "privacidad" | "terminos" | "cookies" | "creditos";

const TIENDAS = "Amazon, Walmart, Target, Best Buy, eBay, Etsy, The Home Depot, Lowe's, Temu y AliExpress";
const STORES = "Amazon, Walmart, Target, Best Buy, eBay, Etsy, The Home Depot, Lowe's, Temu and AliExpress";

const ES: Record<DocLegal, Documento> = {
  privacidad: {
    titulo: "Política de privacidad",
    intro: "Esta política explica qué datos recoge Radar de Ofertas, para qué los usa, con quién los comparte, cuánto tiempo los guarda y cómo puedes verlos, corregirlos o borrarlos. Se aplica a los visitantes de Estados Unidos, incluidos los derechos de California (CCPA/CPRA) y de otros estados con leyes de privacidad.",
    secciones: [
      { h: "1. Quiénes somos", b: ["Radar de Ofertas es un servicio de {titular}. Para cualquier tema de privacidad escríbenos a {email}."] },
      { h: "2. Qué datos recogemos", b: [
        "Recogemos lo mínimo para que la web funcione:",
        [
          "Si creas una cuenta: tu email, tu nombre de usuario y el avatar que elijas. La contraseña la guarda cifrada nuestro proveedor de cuentas (Supabase); nunca la vemos. Si entras con Google, recibimos de Google tu email y los datos básicos de tu perfil que Google comparte (nombre y foto).",
          "Lo que haces con tu cuenta: favoritos, alertas de precio (y el precio objetivo), comentarios (públicos, solo con tu @usuario, nunca tu email), reportes de comentarios y ofertas que nos envías.",
          "Cuándo aceptaste los Términos y la Política de privacidad, y qué versión.",
          "Votos: son anónimos. Se guardan con un identificador aleatorio de tu navegador y una huella cifrada de tu IP (no se puede revertir para obtener la IP) para evitar votos duplicados.",
          "Datos técnicos y de seguridad: tu dirección IP se usa para limitar abusos (por ejemplo, demasiados intentos) y queda en los registros de seguridad y de actividad de la cuenta.",
          "En tu navegador (no en nuestros servidores): idioma, modo oscuro, tus votos, el identificador anónimo, tu elección de cookies y la sesión."
        ],
        "No recogemos datos de pago, ubicación precisa ni datos sensibles. No compramos datos a terceros."
      ] },
      { h: "3. Para qué los usamos", b: [[
        "Darte el servicio: cuenta, favoritos, alertas, comentarios y votos.",
        "Seguridad: frenar bots, spam y abusos, y mantener un registro de quién hizo qué cambios en su cuenta.",
        "Cumplir la ley y atender tus solicitudes de privacidad.",
        "Publicidad, solo si la aceptas (ver la sección 5)."
      ], "No usamos tus datos para entrenar modelos de inteligencia artificial ni los compartimos con nadie para ese fin."] },
      { h: "4. Con quién los compartimos (proveedores)", b: [[
        "Supabase: base de datos y cuentas de usuario.",
        "Vercel y GitHub Pages: alojamiento de la web (reciben tu IP al cargar las páginas).",
        "Cloudflare: red y seguridad de nuestra base de datos y, si está activo, la verificación anti-bots (Turnstile).",
        "Google: inicio de sesión con Google (si lo usas) y Google AdSense (solo si aceptas la publicidad).",
        "Tiendas (" + TIENDAS + "): las fotos de los productos se cargan desde sus servidores, que reciben tu IP. Al pulsar un enlace vas a su web, que puede poner sus propias cookies para saber que llegaste desde aquí y pagarnos una comisión."
      ], "Estos proveedores solo pueden usar los datos para prestarnos su servicio, salvo Google y las tiendas, que también los tratan según sus propias políticas. Podemos revelar datos si la ley nos obliga."] },
      { h: "5. Venta y compartición de datos personales", b: [
        "No vendemos tus datos personales a cambio de dinero.",
        "Si aceptas la publicidad, Google AdSense puede usar cookies e identificadores para mostrarte anuncios personalizados. Según la ley de California eso puede considerarse «compartir» datos para publicidad basada en tu comportamiento. Puedes retirarlo cuando quieras desde «Tus opciones de privacidad» (en el pie de cada página). Si lo rechazas, no se carga ningún código de publicidad.",
        "Respetamos la señal Global Privacy Control (GPC): si tu navegador la envía, la tratamos como un rechazo."
      ] },
      { h: "6. Cuánto tiempo los guardamos", b: [[
        "Cuenta, perfil, favoritos, alertas y comentarios: mientras tengas la cuenta. Se borran al borrar la cuenta, o solos si pasan 2 años sin que entres.",
        "Registro de aceptación de los Términos: mientras exista la cuenta.",
        "Votos: se guardan de forma anónima, con la huella cifrada de la IP mientras exista el voto (es lo que impide votar dos veces desde la misma conexión).",
        "Reportes de comentarios: se borran a los 90 días.",
        "Ofertas que nos envías: hasta revisarlas; las revisadas se borran al año.",
        "Registros de seguridad: 30 días. Registro de actividad de cuentas: 180 días; de lo que se borra solo quedan identificadores, nunca el contenido.",
        "Datos de tu navegador: hasta que los borres desde el propio navegador."
      ]] },
      { h: "7. Tus derechos", b: [
        "Según tu estado de residencia, tienes derecho a:",
        [
          "Saber y acceder: descarga todos tus datos desde Ajustes de la cuenta → Tus datos → Descargar mis datos.",
          "Corregir: cambia tu usuario, avatar, email y contraseña en Ajustes de la cuenta.",
          "Borrar: Ajustes de la cuenta → Borrar mi cuenta. Por seguridad te pediremos tu contraseña (o volver a entrar con Google) y se borra todo al momento.",
          "Retirar el permiso de publicidad y oponerte a la venta o compartición: «Tus opciones de privacidad».",
          "No ser discriminado por ejercer tus derechos: la web funciona igual.",
          "Recurrir una respuesta nuestra, escribiendo a {email} con el asunto «Recurso»."
        ],
        "También puedes hacer cualquier solicitud por email a {email}, tú o un agente autorizado. Para proteger tu cuenta, comprobaremos que la solicitud viene del email de la cuenta. Respondemos en un máximo de 45 días."
      ] },
      { h: "8. Seguridad", b: ["Todo viaja cifrado (HTTPS). Cada usuario solo puede acceder a sus propios datos y los datos de seguridad no son accesibles desde fuera. Ningún sistema es 100 % seguro: si hubiera una brecha que te afecte, te avisaremos según exija la ley."] },
      { h: "9. Menores", b: ["La web no está dirigida a menores de 13 años y no recogemos a sabiendas datos de menores de 13. Si crees que un menor nos ha dado datos, escríbenos a {email} y los borraremos."] },
      { h: "10. Cambios en esta política", b: ["Si la cambiamos, actualizaremos la fecha de arriba. Si el cambio es importante, te pediremos que la aceptes de nuevo al entrar en tu cuenta."] },
      { h: "11. Contacto", b: ["{titular} · {email}"] }
    ]
  },
  terminos: {
    titulo: "Términos del servicio",
    intro: "Al usar Radar de Ofertas aceptas estos términos. Si no estás de acuerdo, no uses la web.",
    secciones: [
      { h: "1. El servicio", b: ["Radar de Ofertas, de {titular}, reúne ofertas de tiendas online y su historial de precios. No vendemos productos: cuando compras, lo haces en la tienda y bajo sus condiciones. Debes tener al menos 13 años; si eres menor de 18, necesitas permiso de tus padres o tutores."] },
      { h: "2. Precios y disponibilidad", b: ["Los precios son orientativos, se comprobaron en la fecha que se indica y pueden cambiar en cualquier momento. No incluyen envío ni impuestos. El precio válido es siempre el que muestra la tienda al pagar. Los precios de Amazon solo se muestran si se comprobaron en las últimas 24 horas. Puede haber errores; no estamos obligados a mantener ningún precio."] },
      { h: "3. Enlaces de afiliado", b: ["Algunos enlaces son de afiliado: si compras a través de ellos, la tienda nos puede pagar una comisión, sin coste extra para ti. Como Afiliado de Amazon, obtenemos ingresos por las compras adscritas que cumplen los requisitos aplicables. Las comisiones no cambian qué ofertas mostramos ni cómo las valoramos."] },
      { h: "4. Tu cuenta", b: ["Da datos reales, guarda tu contraseña y no compartas la cuenta. Eres responsable de lo que se haga con ella. Puedes borrarla cuando quieras desde Ajustes. Podemos suspender o cerrar cuentas que incumplan estos términos."] },
      { h: "5. Lo que publicas", b: [
        "Tus comentarios y las ofertas que envías siguen siendo tuyos, pero nos das permiso (gratuito y mundial) para mostrarlos en la web mientras estén publicados. No está permitido:",
        ["Publicar contenido ilegal, ofensivo, acosador, engañoso o que infrinja derechos de otros.", "Hacer spam, publicidad no autorizada o manipular votos.", "Intentar acceder a datos de otros, saltarse los límites o atacar la web.", "Usar bots o extraer datos de forma masiva."],
        "Los comentarios con 3 reportes de usuarios distintos se ocultan solos, y podemos retirar cualquier contenido que incumpla estas normas."
      ] },
      { h: "6. Propiedad intelectual", b: ["El diseño, los textos y el código de la web son nuestros o tenemos licencia para usarlos (ver Créditos y licencias). Las marcas, logotipos y fotos de productos pertenecen a sus dueños y se usan solo para identificar los productos. Si crees que algo infringe tus derechos de autor, escríbenos a {email} con los datos que exige la DMCA y lo revisaremos."] },
      { h: "7. Webs de terceros", b: ["Los enlaces llevan a tiendas y webs que no controlamos. No somos responsables de sus productos, envíos, devoluciones, precios ni políticas."] },
      { h: "8. Sin garantías", b: ["La web se ofrece «tal cual» y «según disponibilidad», sin garantías de ningún tipo, en la medida en que la ley lo permita. No garantizamos que los precios, ofertas o datos sean exactos, completos o estén actualizados, ni que la web funcione sin interrupciones."] },
      { h: "9. Límite de responsabilidad", b: ["En la medida máxima que permita la ley, no responderemos de daños indirectos, incidentales, especiales o consecuentes, ni de pérdidas por compras hechas en tiendas de terceros. Nuestra responsabilidad total no superará los 50 dólares estadounidenses. Algunos estados no permiten estas limitaciones; en ese caso se aplican en la medida permitida."] },
      { h: "10. Indemnización", b: ["Te comprometes a indemnizarnos frente a reclamaciones de terceros causadas por tu contenido o por incumplir estos términos."] },
      { h: "11. Ley aplicable", b: ["Estos términos se rigen por las leyes del estado de {estado} y por la ley federal de EE. UU., sin tener en cuenta sus normas de conflicto de leyes. Los tribunales de {estado} serán los competentes, salvo que la ley de tu estado diga otra cosa."] },
      { h: "12. Cambios", b: ["Podemos cambiar estos términos. Actualizaremos la fecha de arriba y, si el cambio es importante, te pediremos que los aceptes de nuevo al entrar en tu cuenta. Si sigues usando la web sin cuenta, aceptas la versión vigente."] },
      { h: "13. Contacto", b: ["{titular} · {email}"] }
    ]
  },
  cookies: {
    titulo: "Política de cookies",
    intro: "Qué guardamos en tu navegador, para qué y cómo cambiar tu elección. Sin tu permiso solo se usa lo imprescindible.",
    secciones: [
      { h: "1. Imprescindibles (siempre activas)", b: [
        "Se guardan en el almacenamiento local de tu navegador y no se usan para rastrearte:",
        ["radar-idioma y radar-tema: idioma y modo oscuro.", "radar-visitante y radar-mis-votos: identificador anónimo y tus votos.", "radar-cookies: tu elección sobre la publicidad y su fecha.", "radar-recordar y sb-…-auth-token: tu sesión, si entras en tu cuenta.", "radar-evento-cerrado: si cerraste el aviso de rebajas.", "Verificación anti-bots de Cloudflare (Turnstile), si está activa en los formularios de cuenta."]
      ] },
      { h: "2. Publicidad (solo si la aceptas)", b: ["Google AdSense usa cookies e identificadores (por ejemplo __gads, __gpi o IDE) para mostrar anuncios, medirlos y, en su caso, personalizarlos. Mientras no aceptes, el código de AdSense no se descarga. Más información en la política de Google: policies.google.com/technologies/ads."] },
      { h: "3. Cookies de las tiendas", b: ["Al pulsar «Ver en…» vas a la web de la tienda. Esa web puede poner sus propias cookies para saber que llegaste desde Radar de Ofertas (así nos paga la comisión). Esas cookies son de la tienda y se rigen por su política."] },
      { h: "4. Cómo cambiar tu elección", b: ["Pulsa «Tus opciones de privacidad» en el pie de cualquier página. Si tu navegador envía la señal Global Privacy Control, la tratamos como un rechazo. También puedes borrar los datos de esta web desde los ajustes de tu navegador."] }
    ]
  },
  creditos: {
    titulo: "Créditos y licencias",
    intro: "Radar de Ofertas usa estas fuentes y piezas de software libre. Gracias a sus autores.",
    secciones: [
      { h: "Fuente", b: [["Inter, de Rasmus Andersson — SIL Open Font License 1.1 (servida desde nuestra propia web)."]] },
      { h: "Software", b: [[
        "Next.js y React — licencia MIT.", "Supabase JavaScript client — licencia MIT.", "Zustand — licencia MIT.", "Tailwind CSS y tailwind-merge — licencia MIT.",
        "Lucide (iconos) — licencia ISC.", "Blobatar (avatares) — licencia MIT; texto completo abajo."
      ]] },
      { h: "Marcas y fotos de productos", b: ["Los nombres de tiendas, marcas, logotipos y fotos de productos pertenecen a sus dueños. Se muestran solo para identificar las ofertas y no implican patrocinio ni relación con ellos. Las ilustraciones de ejemplo son propias."] }
    ]
  }
};

const EN: Record<DocLegal, Documento> = {
  privacidad: {
    titulo: "Privacy Policy",
    intro: "This policy explains what information Deal Radar collects, how we use it, who we share it with, how long we keep it and how you can access, correct or delete it. It applies to visitors in the United States, including rights under California law (CCPA/CPRA) and other state privacy laws.",
    secciones: [
      { h: "1. Who we are", b: ["Deal Radar is operated by {titular}. For any privacy matter, email us at {email}."] },
      { h: "2. Information we collect", b: [
        "We collect the minimum needed to run the site:",
        [
          "If you create an account: your email, username and the avatar you choose. Your password is stored encrypted by our account provider (Supabase); we never see it. If you sign in with Google, Google shares your email and basic profile information (name and photo).",
          "What you do with your account: favorites, price alerts (and target price), comments (public, shown only with your @username, never your email), comment reports and deals you submit.",
          "When you accepted the Terms and Privacy Policy, and which version.",
          "Votes: anonymous. Stored with a random browser ID and a keyed one-way hash of your IP address (it cannot be reversed to get your IP) to prevent duplicate votes.",
          "Technical and security data: your IP address is used to rate-limit abuse (for example, too many attempts) and is kept in security and account activity logs.",
          "In your browser (not on our servers): language, dark mode, your votes, the anonymous ID, your cookie choice and your sign-in session."
        ],
        "We do not collect payment information, precise location or sensitive personal information. We do not buy data from third parties."
      ] },
      { h: "3. How we use it", b: [[
        "To provide the service: accounts, favorites, alerts, comments and votes.",
        "Security: to stop bots, spam and abuse, and keep a record of changes made to accounts.",
        "To comply with the law and respond to your privacy requests.",
        "Advertising, only if you accept it (see section 5)."
      ], "We do not use your information to train artificial intelligence models, and we do not share it with anyone for that purpose."] },
      { h: "4. Who we share it with (service providers)", b: [[
        "Supabase: database and user accounts.",
        "Vercel and GitHub Pages: website hosting (they receive your IP address when pages load).",
        "Cloudflare: network and security for our database and, if enabled, bot verification (Turnstile).",
        "Google: Sign in with Google (if you use it) and Google AdSense (only if you accept ads).",
        "Stores (" + STORES + "): product images load from their servers, which receive your IP address. When you click a link you go to their site, which may set its own cookies to know you came from us and pay us a commission."
      ], "These providers may only use the information to provide their services to us, except Google and the stores, which also process it under their own policies. We may disclose information when required by law."] },
      { h: "5. Sale and sharing of personal information", b: [
        "We do not sell your personal information for money.",
        "If you accept ads, Google AdSense may use cookies and identifiers to show you personalized ads. Under California law this may be considered \"sharing\" for cross-context behavioral advertising. You can opt out at any time from \"Your Privacy Choices\" (in the footer of every page). If you decline, no advertising code loads.",
        "We honor the Global Privacy Control (GPC) signal: if your browser sends it, we treat it as an opt-out."
      ] },
      { h: "6. How long we keep it", b: [[
        "Account, profile, favorites, alerts and comments: while you keep your account. Deleted when you delete your account, or automatically after 2 years without signing in.",
        "Record of Terms acceptance: while the account exists.",
        "Votes: kept anonymously, with the keyed IP hash for as long as the vote exists (it is what prevents voting twice from the same connection).",
        "Comment reports: deleted after 90 days.",
        "Deals you submit: until reviewed; reviewed deals are deleted after 1 year.",
        "Security logs: 30 days. Account activity log: 180 days; for deleted data only identifiers are kept, never the content.",
        "Data in your browser: until you clear it from your browser."
      ]] },
      { h: "7. Your rights", b: [
        "Depending on your state of residence, you have the right to:",
        [
          "Know and access: download all your data from Account settings → Your data → Download my data.",
          "Correct: change your username, avatar, email and password in Account settings.",
          "Delete: Account settings → Delete my account. For security we ask for your password (or to sign in with Google again), and everything is deleted immediately.",
          "Opt out of ads and of the sale or sharing of personal information: \"Your Privacy Choices\".",
          "Non-discrimination for exercising your rights: the site works the same.",
          "Appeal our response by emailing {email} with the subject \"Appeal\"."
        ],
        "You or an authorized agent may also submit any request by email to {email}. To protect your account, we will verify that the request comes from the account's email address. We respond within 45 days."
      ] },
      { h: "8. Security", b: ["Everything travels encrypted (HTTPS). Each user can only access their own data, and security data is not reachable from outside. No system is 100% secure: if a breach affects you, we will notify you as required by law."] },
      { h: "9. Children", b: ["The site is not directed to children under 13 and we do not knowingly collect information from children under 13. If you believe a child has given us information, email {email} and we will delete it."] },
      { h: "10. Changes to this policy", b: ["If we change it, we will update the date above. If the change is material, we will ask you to accept it again when you sign in."] },
      { h: "11. Contact", b: ["{titular} · {email}"] }
    ]
  },
  terminos: {
    titulo: "Terms of Service",
    intro: "By using Deal Radar you agree to these terms. If you do not agree, do not use the site.",
    secciones: [
      { h: "1. The service", b: ["Deal Radar, operated by {titular}, collects deals from online stores and their price history. We do not sell products: when you buy, you buy from the store under its terms. You must be at least 13 years old; if you are under 18, you need permission from a parent or guardian."] },
      { h: "2. Prices and availability", b: ["Prices are approximate, were checked on the date shown and may change at any time. They do not include shipping or sales tax. The valid price is always the one the store shows at checkout. Amazon prices are only shown if they were checked in the last 24 hours. Errors may occur; we are not bound to honor any price."] },
      { h: "3. Affiliate links", b: ["Some links are affiliate links: if you buy through them, the store may pay us a commission at no extra cost to you. As an Amazon Associate we earn from qualifying purchases. Commissions do not change which deals we show or how we rate them."] },
      { h: "4. Your account", b: ["Provide accurate information, keep your password safe and do not share your account. You are responsible for activity under it. You can delete it at any time from Settings. We may suspend or close accounts that violate these terms."] },
      { h: "5. What you post", b: [
        "Your comments and submitted deals remain yours, but you grant us a free, worldwide permission to display them on the site while they are published. You may not:",
        ["Post illegal, offensive, harassing or misleading content, or content that infringes others' rights.", "Spam, post unauthorized advertising or manipulate votes.", "Try to access others' data, bypass limits or attack the site.", "Use bots or scrape data in bulk."],
        "Comments reported by 3 different users are hidden automatically, and we may remove any content that breaks these rules."
      ] },
      { h: "6. Intellectual property", b: ["The site's design, text and code are ours or licensed to us (see Credits & licenses). Store names, brands, logos and product images belong to their owners and are used only to identify products. If you believe something infringes your copyright, email {email} with the information required by the DMCA and we will review it."] },
      { h: "7. Third-party sites", b: ["Links lead to stores and sites we do not control. We are not responsible for their products, shipping, returns, prices or policies."] },
      { h: "8. No warranties", b: ["The site is provided \"as is\" and \"as available\", without warranties of any kind, to the extent permitted by law. We do not guarantee that prices, deals or data are accurate, complete or current, or that the site will work without interruption."] },
      { h: "9. Limitation of liability", b: ["To the maximum extent permitted by law, we are not liable for indirect, incidental, special or consequential damages, or for losses from purchases made at third-party stores. Our total liability will not exceed US $50. Some states do not allow these limitations; in that case they apply to the extent permitted."] },
      { h: "10. Indemnification", b: ["You agree to indemnify us against third-party claims arising from your content or your breach of these terms."] },
      { h: "11. Governing law", b: ["These terms are governed by the laws of the State of {estado} and applicable U.S. federal law, without regard to conflict-of-law rules. The courts of {estado} will have jurisdiction, unless the law of your state provides otherwise."] },
      { h: "12. Changes", b: ["We may change these terms. We will update the date above and, if the change is material, ask you to accept them again when you sign in. If you keep using the site without an account, you accept the current version."] },
      { h: "13. Contact", b: ["{titular} · {email}"] }
    ]
  },
  cookies: {
    titulo: "Cookie Policy",
    intro: "What we store in your browser, why, and how to change your choice. Without your permission only what is strictly necessary is used.",
    secciones: [
      { h: "1. Strictly necessary (always on)", b: [
        "Stored in your browser's local storage and never used to track you:",
        ["radar-idioma and radar-tema: language and dark mode.", "radar-visitante and radar-mis-votos: anonymous ID and your votes.", "radar-cookies: your advertising choice and its date.", "radar-recordar and sb-…-auth-token: your session, if you sign in.", "radar-evento-cerrado: whether you closed the sale banner.", "Cloudflare bot verification (Turnstile), if enabled on account forms."]
      ] },
      { h: "2. Advertising (only if you accept)", b: ["Google AdSense uses cookies and identifiers (for example __gads, __gpi or IDE) to show ads, measure them and, where applicable, personalize them. Until you accept, AdSense code is not downloaded. More information in Google's policy: policies.google.com/technologies/ads."] },
      { h: "3. Store cookies", b: ["When you click \"See at…\" you go to the store's website. That site may set its own cookies to know you came from Deal Radar (that is how it pays us a commission). Those cookies belong to the store and follow its policy."] },
      { h: "4. How to change your choice", b: ["Click \"Your Privacy Choices\" in the footer of any page. If your browser sends the Global Privacy Control signal, we treat it as an opt-out. You can also clear this site's data from your browser settings."] }
    ]
  },
  creditos: {
    titulo: "Credits & licenses",
    intro: "Deal Radar uses these fonts and open-source software. Thanks to their authors.",
    secciones: [
      { h: "Font", b: [["Inter, by Rasmus Andersson — SIL Open Font License 1.1 (served from our own site)."]] },
      { h: "Software", b: [[
        "Next.js and React — MIT License.", "Supabase JavaScript client — MIT License.", "Zustand — MIT License.", "Tailwind CSS and tailwind-merge — MIT License.",
        "Lucide (icons) — ISC License.", "Blobatar (avatars) — MIT License; full text below."
      ]] },
      { h: "Brands and product images", b: ["Store names, brands, logos and product images belong to their owners. They are shown only to identify deals and do not imply sponsorship or affiliation. Sample illustrations are our own."] }
    ]
  }
};

export const documento = (doc: DocLegal, lang: Idioma) => (lang === "en" ? EN : ES)[doc];
