/* Cuentas de usuario (Supabase Auth): favoritos, productos seguidos y perfil (nombre de usuario y avatar).
   Entrar con email y contraseña o con Google. Google hay que activarlo en Supabase (Authentication > Providers). */
import type { AuthError, SupabaseClient, User } from "@supabase/supabase-js";
import { limpiarAvatar } from "./avatar";
import { catalogo } from "./catalogo";
import { abrirAcceso, abrirAlertas, cerrarAcceso, i18nActual, useApp, type ModoAcceso } from "./store";
import { COMUNIDAD } from "./config";
import { cargarSb, haySesionGuardada, sb } from "./supabase";

const set = useApp.setState, get = useApp.getState;

// Igual que exige Supabase (supabase/config.toml): 8 caracteres o más, con letras y números
export const passFuerte = (p: unknown) => typeof p === "string" && p.length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p);
export const USUARIO_OK = /^[a-z0-9_][a-z0-9_.]{1,18}[a-z0-9_]$/;
export const volverAqui = () => location.origin + location.pathname;

export function nombreUsuario(u: User | null, perfil = get().perfil) {
  if (perfil) return "@" + perfil;
  if (!u) return "";
  const m = u.user_metadata || {};
  return m.nombre || m.full_name || m.name || (u.email || "").split("@")[0] || "";
}
export const semillaAvatar = () => get().perfil || get().usuario?.id || "";
// ¿La cuenta tiene contraseña? (las de Google no, hasta que la creen)
export const conPassword = () => {
  const u = get().usuario;
  return (u?.identities || []).some((i) => i.provider === "email") || u?.app_metadata?.provider === "email";
};

/* Acciones que piden cuenta: se guardan y se hacen solas al entrar */
let pendiente: (() => void) | null = null;
export function pedirCuenta(motivo: string, accion?: () => void) { pendiente = accion || null; abrirAcceso("crear", motivo); }

let perfilPreguntado = false;
async function cargarCuenta() {
  const cliente = sb(); if (!cliente) return;
  const usuario = get().usuario;
  const favoritos = new Set<string>(), seguidos = new Map<string, number>(), objetivos = new Map<string, number>();
  let perfil: string | null = null, avatar = null;
  if (usuario) {
    const [f, sg, pf] = await Promise.all([
      cliente.from("favoritos").select("producto_id"),
      cliente.from("seguidos").select("producto_id,precio_visto,precio_objetivo"),
      cliente.from("perfiles").select("usuario,avatar").eq("id", usuario.id).maybeSingle()
    ]);
    perfil = pf.data?.usuario || null;
    avatar = pf.data?.avatar ? limpiarAvatar(pf.data.avatar) : null;
    (f.data || []).forEach((r) => favoritos.add(r.producto_id));
    (sg.data || []).forEach((r) => { seguidos.set(r.producto_id, Number(r.precio_visto)); if (r.precio_objetivo) objetivos.set(r.producto_id, Number(r.precio_objetivo)); });
  }
  set({ favoritos, seguidos, objetivos, perfil, avatar });
  // Quien entra sin nombre de usuario (Google o cuentas antiguas) lo elige ahora
  if (usuario && !perfil && !perfilPreguntado && !get().acceso) { perfilPreguntado = true; abrirAcceso("usuario"); }
}

export async function alternarFavorito(id: string) {
  if (!COMUNIDAD) return;
  if (!get().usuario) return pedirCuenta("auth.reasonFav", () => alternarFavorito(id));
  const cliente = sb(); if (!cliente) return;
  const on = get().favoritos.has(id);
  const cambiar = (poner: boolean) => set((s) => { const f = new Set(s.favoritos); poner ? f.add(id) : f.delete(id); return { favoritos: f }; });
  cambiar(!on);
  const r = on ? await cliente.from("favoritos").delete().eq("producto_id", id) : await cliente.from("favoritos").insert({ producto_id: id });
  if (r.error && r.error.code !== "23505") { console.error(r.error); cambiar(on); alert(i18nActual().t("auth.err.generic")); }
}

export async function alternarSeguir(id: string) {
  if (!COMUNIDAD) return;
  if (!get().usuario) return pedirCuenta("auth.reasonFollow", () => alternarSeguir(id));
  const cliente = sb(); if (!cliente) return;
  const p = catalogo().porId.get(id); if (!p) return;
  const on = get().seguidos.has(id), antes = get().seguidos.get(id), objAntes = get().objetivos.get(id);
  set((s) => {
    const sg = new Map(s.seguidos), ob = new Map(s.objetivos);
    if (on) { sg.delete(id); ob.delete(id); } else sg.set(id, p.precio);
    return { seguidos: sg, objetivos: ob };
  });
  const r = on ? await cliente.from("seguidos").delete().eq("producto_id", id) : await cliente.from("seguidos").insert({ producto_id: id, precio_visto: p.precio });
  if (r.error && r.error.code !== "23505") {
    console.error(r.error);
    set((s) => {
      const sg = new Map(s.seguidos), ob = new Map(s.objetivos);
      if (on) { sg.set(id, antes as number); if (objAntes) ob.set(id, objAntes); } else sg.delete(id);
      return { seguidos: sg, objetivos: ob };
    });
    alert(i18nActual().t("auth.err.generic"));
  }
}

// «Avísame si baja de $X»: precio objetivo de un producto seguido (null = sin objetivo)
export async function guardarObjetivo(id: string, v: number | null) {
  const cliente = sb(); if (!cliente) return false;
  const r = await cliente.from("seguidos").update({ precio_objetivo: v }).eq("producto_id", id);
  if (r.error) { console.error(r.error); return false; }
  set((s) => { const ob = new Map(s.objetivos); v ? ob.set(id, v) : ob.delete(id); return { objetivos: ob }; });
  return true;
}

/* Productos seguidos cuyo precio actual es menor que el que vio el usuario.
   Con precio objetivo, solo avisa al llegar a ese precio; sin objetivo, avisa de cualquier bajada */
export function bajadas(seguidos: Map<string, number>, objetivos: Map<string, number>) {
  const { porId } = catalogo();
  return [...seguidos].filter(([id, visto]) => {
    const p = porId.get(id); if (!p || !(p.precio < visto - 0.005)) return false;
    const obj = objetivos.get(id); return !obj || p.precio <= obj + 0.005;
  }).map(([id]) => id);
}
export async function marcarSeguidoVisto(id: string) {
  const cliente = sb(); const p = catalogo().porId.get(id);
  if (!cliente || !p || !get().seguidos.has(id) || get().seguidos.get(id) === p.precio) return;
  set((s) => { const sg = new Map(s.seguidos); sg.set(id, p.precio); return { seguidos: sg }; });
  const r = await cliente.from("seguidos").update({ precio_visto: p.precio }).eq("producto_id", id);
  if (r.error) console.error(r.error);
}

// Traduce los errores de Supabase a mensajes claros
export function errorAcceso(e: unknown) {
  const { t } = i18nActual();
  const err = e as Partial<AuthError> | undefined;
  const txt = String(err?.message || e || "").toLowerCase();
  if (/provider is not enabled|unsupported provider/.test(txt)) return t("auth.err.provider", { p: "Google" });
  if (/invalid login credentials/.test(txt)) return t("auth.err.creds");
  if (/email not confirmed/.test(txt)) return t("auth.err.confirm");
  if (/password should be at least|weak password/.test(txt)) return t("auth.err.short");
  if (/rate limit|too many/.test(txt) || err?.status === 429) return t("auth.err.rate");
  return t("auth.err.generic");
}

// Comprobación de si un nombre de usuario está libre (con memoria de la última respuesta)
let revision: { v: string; libre: boolean | null } = { v: "", libre: null };
export async function usuarioLibre(v: string) {
  if (revision.v === v && revision.libre !== null) return revision.libre;
  const { data, error } = await (await asegurarCuenta())!.rpc("usuario_disponible", { p_usuario: v });
  if (error) throw error;
  revision = { v, libre: !!data };
  return !!data;
}
export const marcarUsuarioOcupado = (v: string) => { revision = { v, libre: false }; };

/* Recuperar contraseña: sesión abierta solo para poner la contraseña nueva. Si cierra sin ponerla, se cierra la sesión. */
let claveSinCambiar = false;
export const terminarCambioClave = () => { claveSinCambiar = false; };
export function alCerrarAcceso() {
  if (claveSinCambiar) { claveSinCambiar = false; sb()?.auth.signOut({ scope: "local" }).catch((e) => console.error(e)); }
}

export async function salir() { await sb()?.auth.signOut(); }

/* Arranque. Al abrir la web solo se carga Supabase si hay una sesión guardada o se vuelve de Google o del email.
   En los demás casos se carga la primera vez que hace falta (al abrir la ventana de cuenta): asegurarCuenta(). */
let conexion: Promise<SupabaseClient | null> | null = null;
export function asegurarCuenta() {
  if (!conexion) conexion = cargarSb().then((c) => { if (c) conectar(c); return c; });
  return conexion;
}
export function iniciarCuenta() {
  if (haySesionGuardada()) asegurarCuenta().catch((e) => console.error(e));
}

// Sesión, vuelta del email o de Google, y ventanita de Google
function conectar(cliente: SupabaseClient) {
  const { t } = i18nActual();
  const q = new URLSearchParams(location.search), h = new URLSearchParams(location.hash.replace(/^#/, ""));
  const limpiarDireccion = () => {
    const u = new URL(location.href);
    ["code", "error", "error_code", "error_description", "recuperar"].forEach((k) => u.searchParams.delete(k));
    u.hash = ""; history.replaceState(history.state, "", u);
  };

  /* ¿Volvemos del enlace de «He olvidado mi contraseña»? Supabase (modo pkce) entra con ese enlace pero solo avisa
     «SIGNED_IN», no «PASSWORD_RECOVERY», así que lo detectamos: al pedir el enlace guardó una clave que acaba en /PASSWORD_RECOVERY */
  let vueltaRecuperar = (() => {
    try {
      if (!q.has("code")) return false;
      if (q.has("recuperar")) return true;
      return [localStorage, sessionStorage].some((s) => Object.keys(s).some((k) => k.endsWith("-code-verifier") && /\/(PASSWORD_RECOVERY|recovery)"?$/.test(String(s.getItem(k)))));
    } catch { return false; }
  })();

  // Ventanita de Google: al terminar, pasa la sesión a la web principal y se cierra
  // Si nos abre otra web, leer su dirección da error: en ese caso no es nuestra ventanita
  const enVentanita = (() => { try { return q.has("popup") && !!window.opener && window.opener.location.origin === location.origin; } catch { return false; } })();
  addEventListener("message", async (e) => {
    if (e.origin !== location.origin || e.data?.tipo !== "radar-sesion") return;
    const { error } = await cliente.auth.setSession({ access_token: e.data.access_token, refresh_token: e.data.refresh_token });
    if (error) console.error(error);
  });

  /* Al volver del email de confirmación: si el enlace se abrió en otro navegador o en la app del correo,
     Supabase confirma la cuenta pero no puede iniciar la sesión aquí. Entonces avisamos y abrimos «Entrar». */
  const vuelta = { codigo: q.has("code"), recuperar: q.has("recuperar"), error: q.get("error_description") || h.get("error_description") || "" };
  if ((vuelta.codigo || vuelta.error) && !q.has("popup")) {
    cliente.auth.getSession().then(({ data }) => {
      limpiarDireccion();
      if (data?.session) return; // la sesión se abrió bien: nada que avisar
      if (vuelta.recuperar) return abrirAcceso("olvido", "", t(vuelta.error ? "auth.resetExpired" : "auth.resetOtherBrowser"), false);
      abrirAcceso("entrar", "", t(vuelta.error ? "auth.linkExpired" : "auth.confirmed"), !vuelta.error);
    }).catch((e) => console.error(e));
  }

  cliente.auth.onAuthStateChange((evento, sesion) => {
    const antes = get().usuario?.id;
    set({ usuario: sesion?.user || null });
    const acceso = get().acceso;
    if (evento === "PASSWORD_RECOVERY" || (evento === "SIGNED_IN" && vueltaRecuperar)) { vueltaRecuperar = false; claveSinCambiar = true; abrirAcceso("nueva"); }
    else if (evento === "SIGNED_IN" && acceso && acceso.modo !== "nueva") cerrarAcceso();
    // Al volver de Google o del email, quita el código de la dirección
    if (/[?&](code|error_description)=/.test(location.search)) limpiarDireccion();
    if (enVentanita && sesion && evento === "SIGNED_IN") {
      window.opener.postMessage({ tipo: "radar-sesion", access_token: sesion.access_token, refresh_token: sesion.refresh_token }, location.origin);
      setTimeout(() => window.close(), 100);
      return;
    }
    if (antes !== sesion?.user?.id) setTimeout(async () => {
      await cargarCuenta().catch((er) => console.error(er));
      if (get().usuario && pendiente) { const fn = pendiente; pendiente = null; fn(); }
    }, 0);
  });
}

/* Google se abre en una ventanita: la web se queda donde está. Si el navegador la bloquea, se usa la redirección normal. */
export async function entrarConGoogle(): Promise<string | null> {
  if (!COMUNIDAD) return null;
  // La ventanita se abre antes de esperar nada: si no, el navegador la bloquea
  const ventana = window.open("", "radar-login", "width=500,height=640,left=" + Math.max(0, (screen.width - 500) / 2) + ",top=" + Math.max(0, (screen.height - 640) / 2));
  try {
    const cliente = await asegurarCuenta(); if (!cliente) throw new Error("sin cliente");
    const { data, error } = await cliente.auth.signInWithOAuth({ provider: "google", options: { redirectTo: volverAqui() + "?popup=1", skipBrowserRedirect: true } });
    if (error) throw error;
    if (ventana && !ventana.closed) ventana.location.href = data.url;
    else location.href = data.url.replace(encodeURIComponent("?popup=1"), "");
    return null;
  } catch (er) {
    console.error(er);
    if (ventana && !ventana.closed) ventana.close();
    return errorAcceso(er);
  }
}

// Menú de la cuenta y otros botones: «Mis favoritos», «Mis alertas», ajustes…
export function abrirMisAlertas() { abrirAlertas(true); }
export function irAModo(modo: ModoAcceso) { abrirAcceso(modo); }
