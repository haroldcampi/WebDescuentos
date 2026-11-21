/* Consentimiento de cookies de publicidad (Google AdSense).
   - Nada de publicidad ni rastreo hasta que el visitante pulse «Aceptar».
   - La señal Global Privacy Control del navegador (obligatoria en California y otros estados) cuenta como rechazo:
     no se muestra el aviso y AdSense no se carga, salvo que el visitante lo acepte después desde «Tus opciones de privacidad».
   - La elección se guarda solo en este navegador, con la fecha (no es un dato personal ni sale del navegador). */
import { useApp } from "./store";

const CLAVE = "radar-cookies";

export const senalGPC = () => typeof navigator !== "undefined" && (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;

// Al abrir la web: elección guardada; si no hay, GPC = rechazo; si tampoco, sin decidir (aviso visible)
export function iniciarCookies() {
  let guardada: boolean | null = null;
  try {
    const d = JSON.parse(localStorage.getItem(CLAVE) || "null");
    if (d && typeof d.publicidad === "boolean") guardada = d.publicidad;
  } catch {}
  useApp.setState({ cookies: guardada ?? (senalGPC() ? false : null) });
}

export function elegirCookies(publicidad: boolean) {
  const antes = useApp.getState().cookies;
  try { localStorage.setItem(CLAVE, JSON.stringify({ publicidad, fecha: new Date().toISOString() })); } catch {}
  useApp.setState({ cookies: publicidad, panelCookies: false });
  // Retirar el permiso después de haberlo dado: se recarga para que el código de Google deje de ejecutarse
  if (antes === true && !publicidad) location.reload();
}

export const abrirPanelCookies = () => useApp.setState({ panelCookies: true });
