/* Captcha de Cloudflare Turnstile (solo si hay clave en config.ts → CAPTCHA.turnstile).
   La librería se descarga al mostrar el primer formulario que lo necesita. Cada respuesta vale para un solo intento:
   después de usarla hay que llamar a reiniciar(). Sin clave, token() devuelve undefined y no se pinta nada. */
import { useEffect, useRef, useState } from "react";
import { CAPTCHA } from "@/lib/config";

interface Turnstile {
  render(el: HTMLElement, o: Record<string, unknown>): string;
  reset(id: string): void;
  remove(id: string): void;
}
declare global { interface Window { turnstile?: Turnstile } }

export const CAPTCHA_ACTIVO = !!CAPTCHA.turnstile;
let carga: Promise<Turnstile> | null = null;
function cargarTurnstile(): Promise<Turnstile> {
  if (!carga) carga = new Promise((ok, mal) => {
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.onload = () => (window.turnstile ? ok(window.turnstile) : mal(new Error("turnstile")));
    s.onerror = () => { carga = null; mal(new Error("turnstile")); };
    document.head.appendChild(s);
  });
  return carga;
}

export function useCaptcha() {
  const caja = useRef<HTMLDivElement>(null), id = useRef<string | null>(null), valor = useRef<string | undefined>(undefined);
  const [, setListo] = useState(false);
  useEffect(() => {
    if (!CAPTCHA_ACTIVO || !caja.current) return;
    let vivo = true;
    cargarTurnstile().then((ts) => {
      if (!vivo || !caja.current) return;
      id.current = ts.render(caja.current, {
        sitekey: CAPTCHA.turnstile, theme: document.documentElement.dataset.theme === "dark" ? "dark" : "light", size: "flexible",
        callback: (t: string) => { valor.current = t; setListo(true); },
        "expired-callback": () => { valor.current = undefined; },
        "error-callback": () => { valor.current = undefined; }
      });
    }).catch((e) => console.error(e));
    return () => { vivo = false; if (id.current) window.turnstile?.remove(id.current); id.current = null; valor.current = undefined; };
  }, []);
  return {
    nodo: CAPTCHA_ACTIVO ? <div ref={caja} className="min-h-[65px]" /> : null,
    // undefined si el captcha está apagado; "" si está encendido pero aún sin resolver
    token: () => (CAPTCHA_ACTIVO ? valor.current || "" : undefined),
    reiniciar: () => { valor.current = undefined; if (id.current) window.turnstile?.reset(id.current); }
  };
}
