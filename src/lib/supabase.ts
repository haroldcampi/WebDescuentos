import type { SupabaseClient } from "@supabase/supabase-js";
import { COMUNIDAD, SUPABASE } from "./config";

// «Recordarme»: con la casilla marcada la sesión se guarda en el navegador; sin marcar, se borra al cerrar la pestaña
export const recordarSesion = () => { try { return localStorage.getItem("radar-recordar") !== "no"; } catch { return true; } };
const almacen = {
  getItem(k: string) { try { return localStorage.getItem(k) ?? sessionStorage.getItem(k); } catch { return null; } },
  setItem(k: string, v: string) {
    try {
      if (recordarSesion()) { localStorage.setItem(k, v); sessionStorage.removeItem(k); }
      else { sessionStorage.setItem(k, v); localStorage.removeItem(k); }
    } catch {}
  },
  removeItem(k: string) { try { localStorage.removeItem(k); sessionStorage.removeItem(k); } catch {} }
};

/* La librería de Supabase (la parte más pesada del JavaScript) se descarga solo cuando hace falta:
   si hay una sesión guardada o se vuelve de un enlace de acceso, al abrir la web; si no, al abrir la ventana de cuenta.
   Los votos y la lista de comentarios no la necesitan (usan api(), más abajo). */
let cliente: SupabaseClient | null = null;
let carga: Promise<SupabaseClient | null> | null = null;
// El cliente si ya está cargado (siempre lo está cuando hay un usuario dentro); null si aún no
export const sb = () => cliente;
export function cargarSb(): Promise<SupabaseClient | null> {
  if (!COMUNIDAD || typeof window === "undefined") return Promise.resolve(null);
  if (!carga) carga = import("@supabase/supabase-js").then(({ createClient }) =>
    (cliente = createClient(SUPABASE.url, SUPABASE.clave, { auth: { flowType: "pkce", persistSession: true, detectSessionInUrl: true, storage: almacen } })));
  return carga;
}
// ¿Hay una sesión guardada en este navegador, o venimos de Google o de un enlace del email?
export function haySesionGuardada() {
  try {
    const q = new URLSearchParams(location.search);
    if (["code", "error_description", "popup", "recuperar", "token_hash"].some((k) => q.has(k)) || location.hash.includes("error_description=")) return true;
    return [localStorage, sessionStorage].some((s) => Object.keys(s).some((k) => /^sb-.+-auth-token/.test(k)));
  } catch { return true; }
}

// Llamadas anónimas a la API REST (votos y lista de comentarios)
export async function api<R = unknown>(ruta: string, cuerpo?: unknown): Promise<R> {
  const r = await fetch(`${SUPABASE.url.replace(/\/$/, "")}/rest/v1/${ruta}`, {
    method: cuerpo ? "POST" : "GET",
    headers: { apikey: SUPABASE.clave, Authorization: `Bearer ${SUPABASE.clave}`, "Content-Type": "application/json" },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined
  });
  if (!r.ok) throw new Error(await r.text());
  return (r.status === 204 ? null : await r.json()) as R;
}
