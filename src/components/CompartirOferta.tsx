/* «Comparte una oferta»: la comunidad envía una oferta; se guarda como «pendiente» y la revisas antes de publicarla */
import { useState, type FormEvent } from "react";
import { TIENDAS } from "@/lib/config";
import { abrirCompartirVentana, useApp, useI18n } from "@/lib/store";
import { sb } from "@/lib/supabase";
import { Dialogo } from "./Dialogo";
import { BTN, DIALOGO_ANCHO, FLD, FLD_2, FLD_LAB, FORM, INPUT, MSG, MSG_OK, cx } from "./ui";

export function CompartirOferta() {
  const { t } = useI18n();
  const abierto = useApp((s) => s.compartirAbierto);
  const [msg, setMsg] = useState<{ txt: string; ok: boolean }>({ txt: "", ok: false });
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = e.currentTarget, v = (n: string) => ((f.elements.namedItem(n) as HTMLInputElement)?.value || "").trim();
    const num = (x: string) => (x ? parseFloat(x.replace(",", ".")) : null);
    const datos = { url: v("url"), titulo: v("titulo"), tienda: v("tienda"), precio: num(v("precio")), precio_antes: num(v("antes")), cupon: v("cupon") || null, nota: v("nota") || null };
    const foco = (n: string) => (f.elements.namedItem(n) as HTMLElement)?.focus();
    if (!/^https:\/\/\S+\.\S+/.test(datos.url)) { setMsg({ txt: t("share.badUrl"), ok: false }); return foco("url"); }
    if (datos.titulo.length < 3) { setMsg({ txt: t("share.badName"), ok: false }); return foco("titulo"); }
    setEnviando(true); setMsg({ txt: t("auth.wait"), ok: false });
    const { data, error } = await sb()!.from("ofertas_enviadas").insert(datos).select("id");
    setEnviando(false);
    if (error) { console.error(error); return setMsg({ txt: /demasiadas/.test(error.message) ? t("share.limit") : t("auth.err.generic"), ok: false }); }
    if (!data || !data.length) return setMsg({ txt: t("share.limit"), ok: false });
    f.reset(); setMsg({ txt: t("share.thanks"), ok: true });
  }

  return (
    <Dialogo abierto={abierto} onCerrar={() => { abrirCompartirVentana(false); setMsg({ txt: "", ok: false }); }} etiqueta={t("share.title")} className={DIALOGO_ANCHO.medio}>
      <div className="flex flex-col gap-4 px-9 pt-10 pb-8 max-sm:px-5 max-sm:py-7">
        <h2 className="pr-11 text-head">{t("share.title")}</h2>
        <p className="-mt-1.5 text-small font-normal text-steel">{t("share.intro")}</p>
        <form className={FORM} noValidate onSubmit={enviar}>
          <label className={FLD}><span className={FLD_LAB}>{t("share.url")}</span><input className={INPUT} name="url" type="url" required placeholder="https://" autoFocus /></label>
          <label className={FLD}><span className={FLD_LAB}>{t("share.name")}</span><input className={INPUT} name="titulo" required maxLength={140} placeholder={t("share.namePh")} /></label>
          <div className={FLD_2}>
            <label className={FLD}><span className={FLD_LAB}>{t("share.store")}</span>
              <select className={INPUT} name="tienda" required>{Object.keys(TIENDAS).map((x) => <option key={x}>{x}</option>)}<option value="Otra">{t("share.other")}</option></select></label>
            <label className={FLD}><span className={FLD_LAB}>{t("share.coupon")}</span><input className={INPUT} name="cupon" maxLength={60} placeholder={t("share.couponPh")} /></label>
          </div>
          <div className={FLD_2}>
            <label className={FLD}><span className={FLD_LAB}>{t("share.price")}</span><input className={INPUT} name="precio" type="number" inputMode="decimal" min={0} step={0.01} placeholder="0.00" /></label>
            <label className={FLD}><span className={FLD_LAB}>{t("share.before")}</span><input className={INPUT} name="antes" type="number" inputMode="decimal" min={0} step={0.01} placeholder="0.00" /></label>
          </div>
          <label className={FLD}><span className={FLD_LAB}>{t("share.note")}</span><textarea className={cx(INPUT, "resize-y")} name="nota" maxLength={500} rows={3} placeholder={t("share.notePh")} /></label>
          <p className={cx(MSG, msg.ok && MSG_OK)} role="status">{msg.txt}</p>
          <button className={cx(BTN, "mt-0.5 w-full disabled:cursor-wait")} type="submit" disabled={enviando}>{t("share.send")}</button>
        </form>
      </div>
    </Dialogo>
  );
}
