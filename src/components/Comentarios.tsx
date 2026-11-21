/* Comentarios de cada oferta. Para comentar hace falta cuenta y nombre de usuario.
   En el comentario solo se ve el @usuario, nunca el email: el nombre lo pone la base de datos a partir del perfil. */
import { MessageSquare } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { pedirCuenta } from "@/lib/cuenta";
import { abrirAcceso, useApp, useI18n } from "@/lib/store";
import { COMUNIDAD } from "@/lib/config";
import { api, sb } from "@/lib/supabase";
import type { ConfigAvatar } from "@/lib/tipos";
import { Avatar, MiAvatar } from "./Avatar";
import { BTN, LINKBTN, OSCURO, cx } from "./ui";

interface Comentario { id: number; nombre: string; avatar: ConfigAvatar | null; texto: string; creado: string }
const NOTA = "py-2 text-xs text-slate-500 italic";

/* Caché de comentarios por oferta: volver a abrir la misma ficha no repite la petición durante 1 minuto,
   y si se abre dos veces mientras carga, se comparte la misma petición. Al comentar se fuerza la recarga. */
const FRESCO_MS = 60_000;
const cache = new Map<string, { t: number; filas: Comentario[] }>();
const enCurso = new Map<string, Promise<Comentario[]>>();
function pedirComentarios(id: string, forzar = false): Promise<Comentario[]> {
  const c = cache.get(id);
  if (!forzar && c && Date.now() - c.t < FRESCO_MS) return Promise.resolve(c.filas);
  const ya = enCurso.get(id); if (ya && !forzar) return ya;
  const p = api<Comentario[]>(`comentarios?select=id,nombre,avatar,texto,creado&producto_id=eq.${encodeURIComponent(id)}&order=creado.desc&limit=50`)
    .then((filas) => { cache.set(id, { t: Date.now(), filas: filas || [] }); return filas || []; })
    .finally(() => enCurso.delete(id));
  enCurso.set(id, p);
  return p;
}

// Esqueleto mientras cargan: la misma forma que un comentario, con pulso suave
const Esqueleto = ({ texto }: { texto: string }) => (
  <div role="status" aria-label={texto} className="flex flex-col gap-2.5">
    {[0, 1, 2].map((k) => (
      <div key={k} className="flex animate-pulse gap-3 rounded-xl border border-slate-200/70 bg-slate-50 p-3.5" aria-hidden="true">
        <div className="size-8 shrink-0 rounded-full bg-slate-200" />
        <div className="flex flex-1 flex-col gap-2 pt-0.5">
          <div className="h-3 w-1/3 rounded bg-slate-200" />
          <div className={cx("h-3 rounded bg-slate-200", k === 1 ? "w-2/3" : "w-5/6")} />
        </div>
      </div>
    ))}
  </div>
);

export function Comentarios({ id }: { id: string }) {
  const { t } = useI18n();
  const [lista, setLista] = useState<Comentario[] | null>(() => cache.get(id)?.filas ?? null);
  const [error, setError] = useState(false);

  const cargar = useCallback(async (forzar = false) => {
    try { setLista(await pedirComentarios(id, forzar)); setError(false); }
    catch (e) { console.error(e); setError(true); }
  }, [id]);
  useEffect(() => { setLista(cache.get(id)?.filas ?? null); setError(false); cargar(); }, [id, cargar]);

  return (
    <section className="space-y-4" id="comentarios" aria-labelledby="com-title">
      <h3 className="flex items-center gap-1.5 text-sm font-bold text-slate-900" id="com-title">
        <MessageSquare className="size-4 text-acento" aria-hidden="true" />{t("d.comments", { n: lista?.length || 0 })}
      </h3>
      <CajaComentar id={id} alEnviar={() => cargar(true)} />
      <div className="flex max-h-[480px] flex-col gap-2.5 overflow-auto">
        {error ? <p className={NOTA}>{t("com.loadError")}</p>
          : !lista ? <Esqueleto texto={t("com.loading")} />
          : !lista.length ? <p className={NOTA}>{t("d.commentsEmpty")}</p>
          : lista.map((c) => <UnComentario key={c.id} c={c} alOcultar={() => { cache.delete(id); setLista((l) => (l || []).filter((x) => x.id !== c.id)); }} />)}
      </div>
    </section>
  );
}

function UnComentario({ c, alOcultar }: { c: Comentario; alOcultar: () => void }) {
  const i = useI18n();
  const perfil = useApp((s) => s.perfil);
  return (
    <article className="flex gap-3 rounded-xl border border-slate-200/70 bg-slate-50 p-3.5">
      <Avatar semilla={c.nombre} cfg={c.avatar} className="size-8 shrink-0" />
      <div className="min-w-0 flex-1">
        <header className="flex items-center gap-2">
          <b className="text-xs font-bold text-slate-900">@{c.nombre}</b>
          <time className="text-xs whitespace-nowrap text-slate-500" dateTime={c.creado}>{i.fechaHora(c.creado)}</time>
        </header>
        <p className="mt-1 text-xs leading-relaxed whitespace-pre-line text-slate-700 [overflow-wrap:anywhere] sm:text-sm">{c.texto}</p>
        {COMUNIDAD && c.nombre !== perfil && <Reportar id={c.id} alOcultar={alOcultar} />}
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
    <button className={cx(LINKBTN, "mt-1.5 text-xs font-medium text-slate-500 hover:text-rose-600 disabled:cursor-default disabled:no-underline")} type="button" disabled={fase === "enviando" || fase === "hecho"} onClick={pulsar}>
      {etiqueta}
    </button>
  );
}

function CajaComentar({ id, alEnviar }: { id: string; alEnviar: () => Promise<void> }) {
  const { t } = useI18n();
  const usuario = useApp((s) => s.usuario), perfil = useApp((s) => s.perfil);
  const [texto, setTexto] = useState(""), [msg, setMsg] = useState(""), [enviando, setEnviando] = useState(false);
  if (!COMUNIDAD) return null;
  const cta = "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/70 bg-slate-50 p-3.5 [&_p]:flex-[1_1_240px] [&_p]:text-xs [&_p]:text-slate-600 sm:[&_p]:text-sm";
  if (!usuario) return <div className={cta}><p>{t("com.login")}</p><button className={cx(BTN, "px-4 py-2")} type="button" onClick={() => abrirAcceso("entrar")}>{t("com.loginBtn")}</button></div>;
  if (!perfil) return <div className={cta}><p>{t("com.needUser")}</p><button className={cx(BTN, "px-4 py-2")} type="button" onClick={() => abrirAcceso("usuario")}>{t("com.needUserBtn")}</button></div>;

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
    <form className="flex flex-col gap-2" onSubmit={enviar}>
      <div className="flex gap-2.5">
        <MiAvatar className="mt-0.5 size-8 shrink-0" />
        <label className="sr-only" htmlFor="com-texto">{t("com.text")}</label>
        <textarea className="min-h-[42px] flex-1 resize-y rounded-xl border border-transparent bg-slate-100 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-card"
          id="com-texto" name="texto" maxLength={500} rows={1} required placeholder={t("d.commentAs", { u: perfil })} value={texto} onChange={(e) => setTexto(e.target.value)} />
        <button className={cx(OSCURO, "shrink-0 self-start px-4 py-2.5 text-xs sm:text-sm")} type="submit" disabled={enviando}>{t("d.publish")}</button>
      </div>
      <div className="flex flex-wrap items-center gap-3 pl-10.5">
        <span className="flex-[1_1_200px] text-xs text-slate-500">{t("com.privacy")}</span>
        <span className="text-xs text-slate-500" role="status">{msg}</span>
      </div>
    </form>
  );
}
