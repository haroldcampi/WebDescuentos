/* Franja del próximo gran evento de rebajas (Black Friday, Cyber Monday…). Se configura en config.ts (EVENTOS). */
import { useState } from "react";
import { DIA } from "@/lib/catalogo";
import { EVENTOS } from "@/lib/config";
import { pedirCuenta } from "@/lib/cuenta";
import { abrirAlertas, useApp, useI18n } from "@/lib/store";
import { sb } from "@/lib/supabase";
import * as I from "./iconos";
import { GHOST, cx } from "./ui";

function proximo() {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const ev = EVENTOS.map((e) => ({ ...e, t: new Date(e.fecha + "T00:00:00") }))
    .filter((e) => +e.t >= +hoy && (+e.t - +hoy) / DIA <= 60).sort((a, b) => +a.t - +b.t)[0];
  return ev ? { ev, hoy } : null;
}

export function Evento() {
  const { t } = useI18n();
  const montado = useApp((s) => s.montado);
  const usuario = useApp((s) => s.usuario);
  const [cerrado, setCerrado] = useState<string | null>(null);
  if (!montado) return null;
  const sig = proximo(); if (!sig) return null;
  const { ev, hoy } = sig;
  let guardado = false; try { guardado = localStorage.getItem("radar-evento-cerrado") === ev.fecha; } catch {}
  if (guardado || cerrado === ev.fecha) return null;
  const dias = Math.round((+ev.t - +hoy) / DIA);
  return (
    <div className="border-b border-lilac bg-wash" id="evento">
      <div className="wrap flex min-h-[52px] items-center gap-3 py-2 max-sm:flex-wrap max-sm:gap-2">
        <p className="flex-1 text-small font-normal text-steel max-sm:basis-[calc(100%-44px)]">
          <b className="font-medium text-indigo">{dias === 0 ? t("event.today", { e: ev.nombre }) : dias === 1 ? t("event.tomorrow", { e: ev.nombre }) : t("event.in", { e: ev.nombre, n: dias })}</b> <span>{t("event.tip")}</span>
        </p>
        <button className={cx(GHOST, "bg-paper px-3 py-[7px] max-sm:order-3 [&_svg]:size-3.5")} type="button"
          onClick={() => { if (sb() && !usuario) return pedirCuenta("auth.reasonFollow"); abrirAlertas(); }}>
          <I.Campana />{t("event.cta")}
        </button>
        <button className="size-8 flex-none rounded-box border-0 bg-transparent text-xl text-steel hover:bg-paper hover:text-midnight" type="button" aria-label={t("sheet.close")}
          onClick={() => { try { localStorage.setItem("radar-evento-cerrado", ev.fecha); } catch {} setCerrado(ev.fecha); }}>×</button>
      </div>
    </div>
  );
}
