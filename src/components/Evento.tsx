/* Franja del próximo gran evento de rebajas (Black Friday, Cyber Monday…). Se configura en config.ts (EVENTOS). */
import { Bell, X, Zap } from "lucide-react";
import { useState } from "react";
import { DIA, reloj } from "@/lib/catalogo";
import { COMUNIDAD, EVENTOS } from "@/lib/config";
import { pedirCuenta } from "@/lib/cuenta";
import { abrirAlertas, useApp, useI18n } from "@/lib/store";

/* Va ya en el HTML compilado para que su hueco esté reservado desde la primera pintura (si no, empuja la página al aparecer).
   El primer render cuenta los días en UTC (igual al compilar y en el navegador); tras montar, con la hora local. */
function proximo(local: boolean) {
  const hoy = new Date(reloj.ahora);
  if (local) hoy.setHours(0, 0, 0, 0); else hoy.setUTCHours(0, 0, 0, 0);
  const ev = EVENTOS.map((e) => ({ ...e, t: new Date(e.fecha + (local ? "T00:00:00" : "T00:00:00Z")) }))
    .filter((e) => +e.t >= +hoy && (+e.t - +hoy) / DIA <= 60).sort((a, b) => +a.t - +b.t)[0];
  return ev ? { ev, hoy } : null;
}

export function Evento() {
  const { t } = useI18n();
  const montado = useApp((s) => s.montado);
  useApp((s) => s.ahora);
  const usuario = useApp((s) => s.usuario);
  const [cerrado, setCerrado] = useState<string | null>(null);
  const sig = proximo(montado); if (!sig) return null;
  const { ev, hoy } = sig;
  let guardado = false;
  if (montado) { try { guardado = localStorage.getItem("radar-evento-cerrado") === ev.fecha; } catch {} }
  if (guardado || cerrado === ev.fecha) return null;
  const dias = Math.round((+ev.t - +hoy) / DIA);
  return (
    <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white" id="evento">
      <div className="wrap flex min-h-11 items-center gap-3 py-1.5 text-xs sm:text-sm max-sm:flex-wrap max-sm:gap-2">
        <p className="flex flex-1 items-center gap-2 max-sm:basis-[calc(100%-44px)]">
          <Zap className="size-4 shrink-0 text-amber-300" aria-hidden="true" />
          <span><b className="font-bold">{dias === 0 ? t("event.today", { e: ev.nombre }) : dias === 1 ? t("event.tomorrow", { e: ev.nombre }) : t("event.in", { e: ev.nombre, n: dias })}</b> <span className="text-white/85">{t("event.tip")}</span></span>
        </p>
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-white/25 max-sm:order-3 tactil:min-h-10" type="button"
          onClick={() => { if (COMUNIDAD && !usuario) return pedirCuenta("auth.reasonFollow"); abrirAlertas(); }}>
          <Bell className="size-3.5" aria-hidden="true" />{t("event.cta")}
        </button>
        <button className="grid size-8 flex-none place-items-center rounded-lg text-white/80 hover:bg-white/15 hover:text-white" type="button" aria-label={t("sheet.close")}
          onClick={() => { try { localStorage.setItem("radar-evento-cerrado", ev.fecha); } catch {} setCerrado(ev.fecha); }}>
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
