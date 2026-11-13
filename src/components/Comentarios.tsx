/* Comentarios de cada oferta. Para comentar hace falta cuenta y nombre de usuario.
   En el comentario solo se ve el @usuario, nunca el email: el nombre lo pone la base de datos a partir del perfil. */
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { pedirCuenta } from "@/lib/cuenta";
import { abrirAcceso, useApp, useI18n } from "@/lib/store";
import { api, sb } from "@/lib/supabase";
import type { ConfigAvatar } from "@/lib/tipos";
import { Avatar, MiAvatar } from "./Avatar";
import { ConValor, HUECO } from "./piezas";
import { BTN, LINKBTN, cx } from "./ui";

interface Comentario { id: number; nombre: string; avatar: ConfigAvatar | null; texto: string; creado: string }
const NOTA = "text-small leading-normal font-normal text-steel";

export function Comentarios({ id }: { id: string }) {
  const { t } = useI18n();
  const [lista, setLista] = useState<Comentario[] | null>(null);
  const [error, setError] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const filas = await api<Comentario[]>(`comentarios?select=id,nombre,avatar,texto,creado&producto_id=eq.${encodeURIComponent(id)}&order=creado.desc&limit=50`);
      setLista(filas || []); setError(false);
    } catch (e) { console.error(e); setError(true); }
  }, [id]);
  useEffect(() => { setLista(null); setError(false); cargar(); }, [cargar]);

  return (
    <section className="col-span-full flex flex-col gap-4 border-t border-frost pt-8" id="comentarios" aria-labelledby="com-title">
      <h3 className="text-sub" id="com-title">{lista?.length ? t("com.titleN", { n: lista.length }) : t("com.title")}</h3>
      <CajaComentar id={id} alEnviar={cargar} />
      <div className="flex max-h-[480px] flex-col overflow-auto">
        {error ? <p className={NOTA}>{t("com.loadError")}</p>
          : !lista ? <p className={NOTA}>{t("com.loading")}</p>
          : !lista.length ? <p className={NOTA}>{t("com.empty")}</p>
          : lista.map((c) => <UnComentario key={c.id} c={c} alOcultar={() => setLista((l) => (l || []).filter((x) => x.id !== c.id))} />)}
      </div>
    </section>
  );
}

function UnComentario({ c, alOcultar }: { c: Comentario; alOcultar: () => void }) {
  const i = useI18n();
  const perfil = useApp((s) => s.perfil);
  return (
    <article className="flex gap-3 border-b border-frost py-3.5 first:pt-0">
      <Avatar semilla={c.nombre} cfg={c.avatar} className="size-8" />
      <div className="min-w-0 flex-1">
        <header className="mb-1 flex justify-between gap-3 text-small">
          <b className="font-medium">@{c.nombre}</b>
          <time className="text-caption font-normal whitespace-nowrap text-slate" dateTime={c.creado}>{i.fechaHora(c.creado)}</time>
        </header>
        <p className="text-small leading-normal font-normal whitespace-pre-line [overflow-wrap:anywhere]">{c.texto}</p>
        {sb() && c.nombre !== perfil && <Reportar id={c.id} alOcultar={alOcultar} />}
      </div>
    </article>
  );
}

/* Reportar un comentario: hace falta cuenta y se confirma con un segundo toque.
   Con 3 reportes de cuentas y conexiones distintas, la base de datos lo oculta sola. */
function Reportar({ id, alOcultar }: { id: number; alOcultar: () => void }) {
  const { t } = useI18n();
  const [fase, setFase] = useState<"" | "confirmar" | "enviando" | "hecho">("");
  const [texto, setTexto] = useState<string | null>(null);
  async function pulsar() {
    if (!useApp.getState().usuario) return pedirCuenta("com.reportReason");
    if (fase === "") { setFase("confirmar"); setTexto(null); return; }
    setFase("enviando");
    try {
      const { data, error } = await sb()!.rpc("reportar_comentario", { p_id: Number(id) });
      if (error) throw error;
      if (data === "oculto") return alOcultar();
      if (data === "ok" || data === "ya" || data === "invalido") return setFase("hecho");
      if (data === "login") { setFase(""); return pedirCuenta("com.reportReason"); }
      throw new Error(data === "limite" ? "demasiados" : String(data));
    } catch (er) {
      console.error(er);
      setFase(""); setTexto(/demasiados/.test((er as Error)?.message || "") ? t("auth.err.rate") : t("com.reportError"));
    }
  }
  const etiqueta = fase === "confirmar" ? t("com.reportConfirm") : fase === "enviando" ? t("com.sending") : fase === "hecho" ? t("com.reported") : texto || t("com.report");
  return (
    <button className={cx(LINKBTN, "mt-1.5 text-caption text-steel decoration-current disabled:cursor-default disabled:no-underline")} type="button" disabled={fase === "enviando" || fase === "hecho"} onClick={pulsar}>
      {etiqueta}
    </button>
  );
}

function CajaComentar({ id, alEnviar }: { id: string; alEnviar: () => Promise<void> }) {
  const { t } = useI18n();
  const usuario = useApp((s) => s.usuario), perfil = useApp((s) => s.perfil);
  const [texto, setTexto] = useState(""), [msg, setMsg] = useState(""), [enviando, setEnviando] = useState(false);
  if (!sb()) return null;
  const cta = "flex flex-wrap items-center justify-between gap-4 rounded-box bg-mist p-5 [&_p]:flex-[1_1_260px] [&_p]:text-small [&_p]:font-normal [&_p]:text-steel";
  if (!usuario) return <div className={cta}><p>{t("com.login")}</p><button className={BTN} type="button" onClick={() => abrirAcceso("entrar")}>{t("com.loginBtn")}</button></div>;
  if (!perfil) return <div className={cta}><p>{t("com.needUser")}</p><button className={BTN} type="button" onClick={() => abrirAcceso("usuario")}>{t("com.needUserBtn")}</button></div>;

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const v = texto.trim();
    if (!v) return (e.currentTarget.elements.namedItem("texto") as HTMLTextAreaElement)?.focus();
    setEnviando(true); setMsg(t("com.sending"));
    try {
      const { data, error } = await sb()!.rpc("comentar", { p_producto: id, p_texto: v });
      if (error) throw error;
      if (data === "limite") throw new Error("demasiados");
      if (data && data !== "ok") throw new Error(data);
      setTexto(""); setMsg("");
      await alEnviar();
    } catch (er) { console.error(er); setMsg(/demasiados/.test((er as Error)?.message || "") ? t("auth.err.rate") : t("com.error")); }
    setEnviando(false);
  }
  return (
    <form className="flex w-full flex-col gap-3 self-start rounded-box bg-mist p-5" onSubmit={enviar}>
      <div className="flex items-center gap-2.5 text-small font-normal text-steel">
        <MiAvatar className="size-8" /><span><ConValor texto={t("com.as", { u: HUECO })} valor={<b className="font-medium text-midnight">@{perfil}</b>} /></span>
      </div>
      <label className="sr-only" htmlFor="com-texto">{t("com.text")}</label>
      <textarea className="w-full resize-y rounded-box border border-frost bg-paper px-3 py-2.5 text-small font-normal text-midnight focus:border-indigo focus:outline-none"
        id="com-texto" name="texto" maxLength={500} rows={3} required placeholder={t("com.hint")} value={texto} onChange={(e) => setTexto(e.target.value)} />
      <div className="flex flex-wrap items-center justify-end gap-3">
        <span className="flex-[1_1_200px] text-caption leading-normal font-normal text-steel">{t("com.privacy")}</span>
        <span className="text-small text-steel" role="status">{msg}</span>
        <button className={BTN} type="submit" disabled={enviando}>{t("com.send")}</button>
      </div>
    </form>
  );
}
