/* «Mis alertas»: los productos que sigue el usuario, primero los que han bajado de precio */
import { catalogo, money } from "@/lib/catalogo";
import { alternarSeguir, bajadas, marcarSeguidoVisto } from "@/lib/cuenta";
import { abrirAcceso, abrirAlertas, abrirFicha, useApp, useI18n } from "@/lib/store";
import { Dialogo } from "./Dialogo";
import { DIALOGO_ANCHO, GHOST, LINKBTN, cx } from "./ui";

export function Alertas() {
  const { t } = useI18n();
  const abierto = useApp((s) => s.alertasAbierto);
  return (
    <Dialogo abierto={abierto} onCerrar={() => abrirAlertas(false)} etiqueta={t("alert.title")} className={DIALOGO_ANCHO.medio}>
      <div className="flex flex-col gap-4 p-8 max-sm:p-5">
        <h2 className="text-head">{t("alert.title")}</h2>
        <h3 className="mt-2 text-lead font-normal">{t("follow.section")}</h3>
        <Seguidos />
      </div>
    </Dialogo>
  );
}

function Seguidos() {
  const i = useI18n(), { t } = i;
  const usuario = useApp((s) => s.usuario), seguidos = useApp((s) => s.seguidos), objetivos = useApp((s) => s.objetivos);
  const vacio = "rounded-box bg-mist p-5 text-small font-normal";
  if (!usuario) return (
    <p className={vacio}>{t("follow.login")} <button className={LINKBTN} type="button" onClick={() => { abrirAlertas(false); abrirAcceso("entrar"); }}>{t("auth.titleIn")}</button></p>
  );
  const { porId } = catalogo();
  const ids = [...seguidos.keys()].filter((id) => porId.has(id));
  if (!ids.length) return <p className={vacio}>{t("follow.none")}</p>;
  const baj = new Set(bajadas(seguidos, objetivos));
  ids.sort((a, b) => Number(baj.has(b)) - Number(baj.has(a)));
  return (
    <ul className="mt-2 border-t border-frost">
      {ids.map((id) => {
        const p = porId.get(id)!, visto = seguidos.get(id) as number, obj = objetivos.get(id), bajo = baj.has(id);
        const estado = (bajo && obj ? t("target.reached", { b: money.format(p.precio), o: money.format(obj) }) + " · " : "")
          + (bajo ? t("follow.drop", { a: money.format(visto), b: money.format(p.precio) })
            : obj ? t("target.waiting", { o: money.format(obj), b: money.format(p.precio) })
            : p.precio > visto ? t("follow.up", { b: money.format(p.precio) }) : t("follow.same", { b: money.format(p.precio) }));
        return (
          <li key={id} className="flex items-center gap-3 border-b border-frost py-3.5 max-sm:flex-wrap">
            <img className="size-11 flex-none rounded-box border border-frost bg-mist object-cover" src={p.imagenes[0]} alt="" />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <b className="line-clamp-2 text-small font-normal [overflow-wrap:anywhere]">{i.tit(p)}</b>
              <span className={cx("text-small font-normal", bajo ? "text-indigo" : "text-slate")}>{estado}</span>
            </div>
            <button className={cx(GHOST, "px-3.5 py-[9px]")} type="button" onClick={() => { abrirAlertas(false); marcarSeguidoVisto(id); abrirFicha(id); }}>{t("follow.view")}</button>
            <button className={LINKBTN} type="button" aria-label={t("follow.stopX", { t: i.tit(p) })} onClick={() => alternarSeguir(id)}>{t("follow.stop")}</button>
          </li>
        );
      })}
    </ul>
  );
}
