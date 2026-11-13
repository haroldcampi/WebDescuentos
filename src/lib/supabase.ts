import { createClient, type SupabaseClient } from "@supabase/supabase-js";
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

// El cliente solo existe en el navegador (guarda la sesión en localStorage)
let cliente: SupabaseClient | null = null;
export function sb(): SupabaseClient | null {
  if (!COMUNIDAD || typeof window === "undefined") return null;
  if (!cliente) cliente = createClient(SUPABASE.url, SUPABASE.clave, { auth: { flowType: "pkce", persistSession: true, detectSessionInUrl: true, storage: almacen } });
  return cliente;
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
