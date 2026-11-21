/* Aviso de cookies y panel «Tus opciones de privacidad».
   Aceptar y Rechazar tienen el mismo peso visual (sin trucos para empujar a aceptar).
   Sin decisión no se carga ninguna publicidad; ver lib/privacidad.ts. */
import { Cookie, X } from "lucide-react";
import { useEffect, useState } from "react";
import { elegirCookies, iniciarCookies, senalGPC } from "@/lib/privacidad";
import { useApp, useI18n } from "@/lib/store";
import { cx } from "./ui";

const BOTON = "inline-flex min-h-10 flex-1 items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-colors sm:flex-none";

export function AvisoCookies() {
  const { t } = useI18n();
  const cookies = useApp((s) => s.cookies), panel = useApp((s) => s.panelCookies);
  const [listo, setListo] = useState(false);
  useEffect(() => { iniciarCookies(); setListo(true); }, []);
  if (!panel && (cookies !== null || !listo)) return null;
  return (
    <section role="dialog" aria-modal="false" aria-labelledby="cookies-titulo"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-2xl animate-[entrar_.26s_var(--ease-brand)_both] rounded-2xl border border-slate-200 bg-card p-4 shadow-xl sm:p-5">
      {panel && (
        <button type="button" aria-label={t("sheet.close")} onClick={() => useApp.setState({ panelCookies: false })}
          className="absolute top-2.5 right-2.5 grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><X className="size-4" aria-hidden="true" /></button>
      )}
      <h2 id="cookies-titulo" className="flex items-center gap-2 pr-8 text-sm font-bold text-slate-900">
        <Cookie className="size-4 text-acento" aria-hidden="true" />{t(panel ? "ck.choices" : "ck.title")}
      </h2>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-600 sm:text-sm">
        {t("ck.text")}{" "}
        <a className="font-semibold text-acento underline-offset-4 hover:underline" href="cookies">{t("legal.cookies")}</a>
        {" · "}
        <a className="font-semibold text-acento underline-offset-4 hover:underline" href="privacidad">{t("legal.privacy")}</a>
      </p>
      {panel && (
        <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
          {t(cookies === true ? "ck.stateOn" : "ck.stateOff")}{senalGPC() ? " " + t("ck.gpc") : ""}
        </p>
      )}
      <div className="mt-3.5 flex flex-wrap gap-2.5">
        <button type="button" className={cx(BOTON, "border border-slate-300 bg-card text-slate-800 hover:bg-slate-50")} onClick={() => elegirCookies(false)}>{t("ck.reject")}</button>
        <button type="button" className={cx(BOTON, "border border-slate-300 bg-card text-slate-800 hover:bg-slate-50")} onClick={() => elegirCookies(true)}>{t("ck.accept")}</button>
      </div>
    </section>
  );
}
