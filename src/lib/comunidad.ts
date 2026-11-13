/* Comunidad: votos «Buena» / «Mala» de cada oferta (Supabase).
   Cada navegador recibe un identificador anónimo; un voto por oferta y navegador. */
import { catalogo } from "./catalogo";
import { COMUNIDAD } from "./config";
import { i18nActual, useApp } from "./store";
import { api } from "./supabase";

let visitante = "";
function idVisitante() {
  if (visitante) return visitante;
  const nuevo = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));
  try {
    visitante = localStorage.getItem("radar-visitante") || "";
    if (!visitante) { visitante = nuevo(); localStorage.setItem("radar-visitante", visitante); }
  } catch { visitante = nuevo(); }
  return visitante;
}

export function iniciarComunidad() {
  let mios: Record<string, number> = {};
  try { mios = JSON.parse(localStorage.getItem("radar-mis-votos") || "{}"); } catch {}
  useApp.setState((s) => ({ votos: { ...s.votos, mios } }));
  if (COMUNIDAD) cargarVotos().catch((e) => console.error(e));
}

async function cargarVotos() {
  const filas = await api<{ producto_id: string; total: number; recientes: number }[]>("rpc/puntuaciones", {});
  const total: Record<string, number> = {}, recientes: Record<string, number> = {};
  (filas || []).forEach((f) => { total[f.producto_id] = Number(f.total) || 0; recientes[f.producto_id] = Number(f.recientes) || 0; });
  // «En tendencia»: las 3 ofertas con más votos positivos en 48 h (mínimo 3)
  const { porId } = catalogo();
  const enTendencia = Object.entries(recientes).filter(([id, n]) => n >= 3 && porId.has(id)).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => id);
  useApp.setState((s) => ({ votos: { ...s.votos, total, recientes, enTendencia } }));
}

export async function votar(id: string, valor: number) {
  const { votos } = useApp.getState();
  const antes = votos.mios[id] || 0, nuevo = antes === valor ? 0 : valor;
  const poner = (mio: number, total: number) => useApp.setState((s) => ({ votos: { ...s.votos, mios: { ...s.votos.mios, [id]: mio }, total: { ...s.votos.total, [id]: total } } }));
  // Se pinta al momento y se corrige si el servidor falla
  const totalAntes = votos.total[id] || 0;
  poner(nuevo, totalAntes - antes + nuevo);
  try {
    const total = await api<number | null>("rpc/votar", { p_producto: id, p_visitante: idVisitante(), p_valor: nuevo });
    if (total === null) throw new Error("limite");
    poner(nuevo, Number(total) || 0);
    try { localStorage.setItem("radar-mis-votos", JSON.stringify(useApp.getState().votos.mios)); } catch {}
  } catch (e) {
    console.error(e);
    poner(antes, totalAntes);
    const { t } = i18nActual();
    alert((e as Error)?.message === "limite" ? t("auth.err.rate") : t("vote.error"));
  }
}
