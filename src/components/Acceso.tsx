/* Ventana de acceso: entrar, crear cuenta, recuperar contraseña, poner una nueva, elegir nombre de usuario
   y configuración de la cuenta (perfil, email y contraseña). */
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { AVA_DEFECTO, limpiarAvatar } from "@/lib/avatar";
import {
  USUARIO_OK, alCerrarAcceso, conPassword, entrarConGoogle, errorAcceso, marcarUsuarioOcupado, passFuerte, terminarCambioClave, usuarioLibre, volverAqui
} from "@/lib/cuenta";
import { abrirAcceso, cerrarAcceso, useApp, useI18n, type Acceso as DatosAcceso, type ModoAcceso } from "@/lib/store";
import { recordarSesion, sb } from "@/lib/supabase";
import type { ConfigAvatar } from "@/lib/tipos";
import { Avatar } from "./Avatar";
import { Dialogo } from "./Dialogo";
import { EditorAvatar } from "./EditorAvatar";
import * as I from "./iconos";
import { ConValor, HUECO } from "./piezas";
import { AUTH_LINK, BTN, CHK, DIALOGO_ANCHO, FLD, FLD_2, FLD_LAB, FORM, GHOST, INPUT, MSG, MSG_OK, cx } from "./ui";

export function Acceso() {
  const { t } = useI18n();
  const acceso = useApp((s) => s.acceso);
  const ancho = acceso && ["crear", "ajustes"].includes(acceso.modo) ? DIALOGO_ANCHO.medio : DIALOGO_ANCHO.estrecho;
  return (
    <Dialogo abierto={!!acceso} onCerrar={() => { cerrarAcceso(); alCerrarAcceso(); }} etiqueta={t("acct.menu")} className={ancho} claveScroll={acceso?.modo}>
      {acceso && (acceso.modo === "ajustes" ? <Ajustes key={acceso.v} /> : <Formulario key={acceso.v} a={acceso} />)}
    </Dialogo>
  );
}

const valor = (f: HTMLFormElement, n: string) => (f.elements.namedItem(n) as HTMLInputElement | null)?.value ?? "";
const foco = (f: HTMLFormElement, n: string) => (f.elements.namedItem(n) as HTMLElement | null)?.focus();
const Msg = ({ txt, ok }: { txt: string; ok?: boolean }) => <p className={cx(MSG, ok && MSG_OK)} role="status">{txt}</p>;

// Campo de contraseña con botón de mostrar/ocultar
function CampoPass({ name, ph = "", auto, etiqueta, className }: { name: string; ph?: string; auto: string; etiqueta?: string; className?: string }) {
  const { t } = useI18n();
  const [ver, setVer] = useState(false);
  return (
    <span className="relative block">
      <input className={cx(INPUT, "pr-11", className)} name={name} type={ver ? "text" : "password"} required placeholder={ph} autoComplete={auto} aria-label={etiqueta} minLength={auto === "new-password" ? 8 : undefined} />
      <button className="absolute top-1/2 right-1 grid size-[34px] -translate-y-1/2 place-items-center rounded-box border-0 bg-transparent p-0 text-slate hover:bg-mist hover:text-indigo tactil:size-10"
        type="button" aria-label={t(ver ? "auth.hide" : "auth.show")} aria-pressed={ver} onClick={() => setVer((v) => !v)}><I.Ojo tachado={!ver} /></button>
    </span>
  );
}
// Campo tipo píldora con icono a la izquierda (formulario de entrada)
const Pildora = ({ ico, children }: { ico: ReactNode; children: ReactNode }) => (
  <label className="relative block [&_input]:pl-[54px]">
    <span className="pointer-events-none absolute inset-y-px left-px z-[1] grid w-[42px] place-items-center rounded-l-[3px] border-r border-frost bg-mist text-indigo">{ico}</span>
    {children}
  </label>
);
// Campo con la etiqueta encima (registro y ajustes)
const Campo = ({ lab, children, className }: { lab: string; children: ReactNode; className?: string }) => (
  <label className={cx(FLD, className)}><span className={FLD_LAB}>{lab}</span>{children}</label>
);

/* Nombre de usuario con «@» delante, vista previa del avatar (abre el editor) y aviso de disponibilidad */
function CampoUsuario({ inicial, avatar, onAvatar }: { inicial: string; avatar: ConfigAvatar; onAvatar: (c: ConfigAvatar) => void }) {
  const { t } = useI18n();
  const perfil = useApp((s) => s.perfil), modo = useApp((s) => s.acceso?.modo);
  const [v, setV] = useState(inicial);
  const [estado, setEstado] = useState<{ txt: string; tipo: "" | "ok" | "bad" }>({ txt: t("auth.userHint"), tipo: "" });
  const [editor, setEditor] = useState(false);
  const ajustesBtn = useRef<HTMLButtonElement>(null), espera = useRef<ReturnType<typeof setTimeout>>(undefined);
  const esPerfil = modo === "usuario" || modo === "ajustes";
  const cerrarEditor = useCallback(() => setEditor(false), []);

  function escribir(texto: string) {
    const limpio = texto.toLowerCase().replace(/^@+/, "").replace(/[^a-z0-9_.]/g, "").slice(0, 20);
    setV(limpio); clearTimeout(espera.current);
    if (!limpio) return setEstado({ txt: t("auth.userHint"), tipo: "" });
    if (!USUARIO_OK.test(limpio)) return setEstado({ txt: t("auth.userBad"), tipo: "bad" });
    if (limpio === perfil && esPerfil) return setEstado({ txt: t("auth.userFree"), tipo: "ok" });
    setEstado({ txt: t("auth.userChecking"), tipo: "" });
    espera.current = setTimeout(async () => {
      try { const libre = await usuarioLibre(limpio); setEstado({ txt: t(libre ? "auth.userFree" : "auth.userTaken"), tipo: libre ? "ok" : "bad" }); }
      catch (er) { console.error(er); setEstado({ txt: "", tipo: "" }); }
    }, 350);
  }
  const semilla = v || t("auth.userPh");
  return <>
    <div className="relative flex items-end gap-3">
      <Campo lab={t("auth.username")} className="min-w-0 flex-1">
        <span className="relative block">
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate" aria-hidden="true">@</span>
          <input className={cx(INPUT, "pl-7")} name="usuario" required maxLength={20} autoComplete="username" autoCapitalize="none" spellCheck={false}
            placeholder={t("auth.userPh")} value={v} onChange={(e) => escribir(e.target.value)} />
        </span>
      </Campo>
      <button type="button" data-ava-abrir className="flex-none rounded-xl border-0 bg-transparent p-0 transition-transform duration-200 ease-brand hover:scale-105"
        aria-controls="ava-editor" aria-expanded={editor} aria-label={t("ava.title")} title={t("ava.title")} onClick={() => setEditor((x) => !x)}>
        <Avatar semilla={semilla} cfg={avatar} className="size-14 rounded-xl" />
      </button>
      <button ref={ajustesBtn} type="button" data-ava-abrir aria-controls="ava-editor" aria-expanded={editor} aria-label={t("ava.title")} title={t("ava.title")} onClick={() => setEditor((x) => !x)}
        className="mt-2.5 grid size-9 flex-none place-items-center self-center rounded-box border border-frost bg-paper p-0 text-slate transition-[color,border-color,background-color] duration-200 hover:border-lavender hover:text-indigo aria-expanded:border-lilac aria-expanded:bg-wash aria-expanded:text-indigo">
        <I.Ajustes />
      </button>
      {editor && <EditorAvatar semilla={semilla} cfg={avatar} onCambio={onAvatar} ancla={ajustesBtn} onCerrar={cerrarEditor} />}
    </div>
    <p className={cx("-mt-1.5 text-caption font-normal text-slate", estado.tipo === "ok" && "text-indigo", estado.tipo === "bad" && "text-error")} aria-live="polite">{estado.txt}</p>
  </>;
}

const TITULOS: Record<Exclude<ModoAcceso, "ajustes">, [string, string]> = {
  entrar: ["auth.titleIn", "auth.submitIn"], crear: ["auth.titleUp", "auth.submitUp"], olvido: ["auth.titleForgot", "auth.submitForgot"],
  nueva: ["auth.titleNew", "auth.submitNew"], usuario: ["auth.titleUser", "auth.submitUser"]
};

function Formulario({ a }: { a: DatosAcceso }) {
  const { t } = useI18n();
  const [modo, setModo] = useState(a.modo as Exclude<ModoAcceso, "ajustes">);
  const [msg, setMsg] = useState({ txt: a.msg, ok: a.ok });
  const [enviando, setEnviando] = useState(false);
  const perfil = useApp((s) => s.perfil), cfgGuardado = useApp((s) => s.avatar);
  const [avatar, setAvatar] = useState<ConfigAvatar>(modo === "usuario" && cfgGuardado ? { ...cfgGuardado } : { ...AVA_DEFECTO });
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { setTimeout(() => form.current?.querySelector<HTMLInputElement>(a.email ? '[name="pass"]' : "input")?.focus(), 50); }, [modo]); // eslint-disable-line react-hooks/exhaustive-deps

  const [titulo, enviar] = TITULOS[modo];
  const fallo = (k: string) => setMsg({ txt: t(k), ok: false });
  const cambiarModo = (m: typeof modo) => { setModo(m); setMsg({ txt: "", ok: false }); };

  async function alEnviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const cliente = sb(); if (!cliente) return;
    const f = e.currentTarget;
    const email = valor(f, "email").trim(), pass = valor(f, "pass"), nombre = valor(f, "nombre").trim();
    const esPerfil = modo === "usuario";
    if (["entrar", "crear", "olvido"].includes(modo) && !/^\S+@\S+\.\S+$/.test(email)) { foco(f, "email"); return fallo("auth.err.email"); }
    const usuario = valor(f, "usuario").trim().toLowerCase();
    if ((modo === "crear" || esPerfil) && !USUARIO_OK.test(usuario)) { foco(f, "usuario"); return fallo("auth.userBad"); }
    if ((modo === "crear" || modo === "nueva") && !passFuerte(pass)) return fallo("auth.err.short");
    if (modo === "entrar" && !pass) return foco(f, "pass");
    if (modo === "crear" && pass !== valor(f, "pass2")) return fallo("auth.err.match");
    if (modo === "crear" && !(f.elements.namedItem("terminos") as HTMLInputElement).checked) return fallo("auth.err.terms");
    if (modo === "entrar") { try { localStorage.setItem("radar-recordar", (f.elements.namedItem("recordar") as HTMLInputElement).checked ? "si" : "no"); } catch {} }
    setEnviando(true); setMsg({ txt: t("auth.wait"), ok: false });
    try {
      if ((modo === "crear" || (esPerfil && usuario !== perfil)) && !(await usuarioLibre(usuario))) { fallo("auth.userTaken"); foco(f, "usuario"); return; }
      let error: unknown = null;
      if (modo === "entrar") ({ error } = await cliente.auth.signInWithPassword({ email, password: pass }));
      else if (modo === "crear") {
        const apellido = valor(f, "apellido").trim();
        const datos = { usuario, avatar: limpiarAvatar(avatar), ...(nombre || apellido ? { nombre, apellido, full_name: [nombre, apellido].filter(Boolean).join(" ") } : {}) };
        const r = await cliente.auth.signUp({ email, password: pass, options: { data: datos, emailRedirectTo: volverAqui() } });
        // SEGURIDAD: si el email ya tiene cuenta (Supabase devuelve un usuario sin identidades o un error «already registered»),
        // se muestra el MISMO mensaje que en un registro nuevo, para que nadie pueda averiguar qué emails están registrados.
        const yaExiste = (!r.error && r.data?.user && !(r.data.user.identities || []).length) || /already registered|already been registered/i.test(r.error?.message || "");
        if (yaExiste || (!r.error && !r.data.session)) return setMsg({ txt: t("auth.checkEmail", { e: email }), ok: true });
        error = r.error;
      } else if (modo === "olvido") {
        const r = await cliente.auth.resetPasswordForEmail(email, { redirectTo: volverAqui() + "?recuperar=1" });
        if (!r.error) return setMsg({ txt: t("auth.resetSent", { e: email }), ok: true });
        error = r.error;
      } else if (esPerfil) {
        const r = await guardarPerfil(usuario, avatar);
        if (r === "ocupado") { fallo("auth.userTaken"); return; }
        if (r === "ok") return cerrarAcceso();
        error = r;
      } else if (modo === "nueva") {
        const r = await cliente.auth.updateUser({ password: pass });
        if (!r.error) {
          // Contraseña cambiada: cerramos la sesión del enlace (en todos los dispositivos) y pedimos que entre con la nueva
          terminarCambioClave();
          const correo = useApp.getState().usuario?.email || "";
          await cliente.auth.signOut().catch((er) => console.error(er));
          abrirAcceso("entrar", "", t("auth.passChanged"), true, correo);
          return;
        }
        error = r.error;
      }
      if (error) throw error;
    } catch (er) { console.error(er); setMsg({ txt: errorAcceso(er), ok: false }); }
    finally { setEnviando(false); }
  }

  const recordar = recordarSesion();
  return (
    <div className="flex flex-col gap-4 px-9 pt-10 pb-8 max-sm:px-5 max-sm:py-7">
      {modo === "crear" && <p className="-mb-2 text-caption font-normal uppercase tracking-label text-slate">{t("auth.tagUp")}</p>}
      <h2 className="pr-11 text-head">{t(titulo)}</h2>
      {a.motivo ? <p className="rounded-box bg-wash px-3.5 py-3 text-small font-normal text-indigo">{t(a.motivo)}</p>
        : modo === "entrar" ? <p className="-mt-1.5 text-small font-normal text-steel">{t("auth.tagIn")}</p>
        : modo === "usuario" ? <p className="-mt-1.5 text-small font-normal text-steel">{t("auth.introUser")}</p> : null}
      <form ref={form} className={FORM} noValidate onSubmit={alEnviar}>
        {modo === "entrar" && <>
          <Pildora ico={<I.Sobre />}><input className={INPUT} name="email" type="email" required autoComplete="email" placeholder={t("auth.email")} aria-label={t("auth.email")} defaultValue={a.email} /></Pildora>
          <Pildora ico={<I.Candado />}><CampoPass name="pass" ph={t("auth.pass")} auto="current-password" etiqueta={t("auth.pass")} /></Pildora>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className={CHK}><input type="checkbox" name="recordar" defaultChecked={recordar} /><span>{t("auth.remember")}</span></label>
            <button className={AUTH_LINK} type="button" onClick={() => cambiarModo("olvido")}>{t("auth.forgot")}</button>
          </div>
        </>}
        {modo === "crear" && <>
          <div className={FLD_2}>
            <Campo lab={t("auth.name")}><input className={INPUT} name="nombre" maxLength={40} autoComplete="given-name" placeholder={t("auth.firstPh")} /></Campo>
            <Campo lab={t("auth.lastName")}><input className={INPUT} name="apellido" maxLength={40} autoComplete="family-name" placeholder={t("auth.lastPh")} /></Campo>
          </div>
          <Campo lab={t("auth.email")}><input className={INPUT} name="email" type="email" required autoComplete="email" placeholder={t("auth.emailPh")} /></Campo>
          <CampoUsuario inicial="" avatar={avatar} onAvatar={setAvatar} />
          <div className={FLD_2}>
            <Campo lab={t("auth.pass")}><CampoPass name="pass" ph={t("auth.passPh")} auto="new-password" /></Campo>
            <Campo lab={t("auth.confirm")}><CampoPass name="pass2" ph={t("auth.passPh")} auto="new-password" /></Campo>
          </div>
          <label className={CHK}><input type="checkbox" name="terminos" required /><span>{t("auth.terms")}</span></label>
        </>}
        {modo === "usuario" && <CampoUsuario inicial={perfil || ""} avatar={avatar} onAvatar={setAvatar} />}
        {modo === "olvido" && <Pildora ico={<I.Sobre />}><input className={INPUT} name="email" type="email" required autoComplete="email" placeholder={t("auth.email")} aria-label={t("auth.email")} /></Pildora>}
        {modo === "nueva" && <>
          <Pildora ico={<I.Candado />}><CampoPass name="pass" ph={t("auth.newPass")} auto="new-password" etiqueta={t("auth.newPass")} /></Pildora>
          <p className="-mt-1.5 text-small text-slate">{t("auth.passHint")}</p>
        </>}
        <Msg txt={msg.txt} ok={msg.ok} />
        <button className={cx(BTN, "mt-0.5 w-full disabled:cursor-wait")} type="submit" disabled={enviando}>{t(enviar)}</button>
      </form>
      {(modo === "entrar" || modo === "crear") && <>
        <p className="mt-1 flex items-center gap-3 text-caption font-normal uppercase tracking-label text-slate before:h-px before:flex-1 before:bg-frost after:h-px after:flex-1 after:bg-frost">{t(modo === "crear" ? "auth.orUp" : "auth.orIn")}</p>
        <button className="flex items-center justify-center gap-2.5 rounded-box border border-frost bg-paper px-4 py-3 text-small font-normal text-midnight transition-[border-color,background-color] duration-200 hover:border-lavender hover:bg-mist tactil:min-h-12"
          type="button" onClick={async () => { const err = await entrarConGoogle(); if (err) setMsg({ txt: err, ok: false }); }}>
          <I.LogoGoogle /><span>Google</span>
        </button>
      </>}
      {modo === "entrar" && <p className="text-center text-small font-normal text-steel">{t("auth.toUp")} <button className={AUTH_LINK} type="button" onClick={() => cambiarModo("crear")}>{t("auth.toUpBtn")}</button></p>}
      {modo === "crear" && <p className="text-center text-small font-normal text-steel">{t("auth.toIn")} <button className={AUTH_LINK} type="button" onClick={() => cambiarModo("entrar")}>{t("auth.toInBtn")}</button></p>}
      {modo === "olvido" && <p className="text-center text-small font-normal text-steel"><button className={AUTH_LINK} type="button" onClick={() => cambiarModo("entrar")}>{t("auth.back")}</button></p>}
    </div>
  );
}

// El perfil ya existe (se crea con la cuenta): solo se cambia el nombre y el avatar. Si faltara, se crea.
async function guardarPerfil(usuario: string, cfg: ConfigAvatar): Promise<"ok" | "ocupado" | unknown> {
  const cliente = sb()!, id = useApp.getState().usuario!.id, av = limpiarAvatar(cfg);
  let r = await cliente.from("perfiles").update({ usuario, avatar: av }).eq("id", id).select("usuario");
  if (!r.error && !(r.data || []).length) r = await cliente.from("perfiles").insert({ id, usuario, avatar: av }).select("usuario");
  if (r.error?.code === "23505") { marcarUsuarioOcupado(usuario); return "ocupado"; }
  if (r.error) return r.error;
  useApp.setState({ perfil: usuario, avatar: av });
  return "ok";
}

/* Configuración de la cuenta: nombre de usuario y avatar, email y contraseña */
function Ajustes() {
  const { t } = useI18n();
  const usuario = useApp((s) => s.usuario), perfil = useApp((s) => s.perfil), cfgGuardado = useApp((s) => s.avatar);
  const [avatar, setAvatar] = useState<ConfigAvatar>(cfgGuardado ? { ...cfgGuardado } : { ...AVA_DEFECTO });
  const [msgs, setMsgs] = useState<Record<string, { txt: string; ok?: boolean }>>({});
  const [ocupado, setOcupado] = useState<string | null>(null);
  if (!usuario) return null;
  const decir = (k: string, txt: string, ok = false) => setMsgs((m) => ({ ...m, [k]: { txt, ok } }));
  const cliente = sb()!;

  async function perfilEnviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = e.currentTarget, u = valor(f, "usuario").trim().toLowerCase();
    if (!USUARIO_OK.test(u)) { foco(f, "usuario"); return decir("perfil", t("auth.userBad")); }
    setOcupado("perfil"); decir("perfil", t("auth.wait"));
    try {
      if (u !== perfil && !(await usuarioLibre(u))) { foco(f, "usuario"); return decir("perfil", t("auth.userTaken")); }
      const r = await guardarPerfil(u, avatar);
      if (r === "ocupado") return decir("perfil", t("auth.userTaken"));
      if (r !== "ok") throw r;
      decir("perfil", t("set.saved"), true);
    } catch (er) { console.error(er); decir("perfil", errorAcceso(er)); }
    finally { setOcupado(null); }
  }
  async function emailEnviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = e.currentTarget, nuevo = valor(f, "email").trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(nuevo)) { foco(f, "email"); return decir("email", t("auth.err.email")); }
    if (nuevo === (usuario!.email || "").toLowerCase()) return decir("email", t("set.emailSame"));
    setOcupado("email"); decir("email", t("auth.wait"));
    const { error } = await cliente.auth.updateUser({ email: nuevo }, { emailRedirectTo: volverAqui() });
    setOcupado(null);
    // SEGURIDAD: si el email nuevo ya es de otra cuenta, el mensaje es el mismo que si estuviera libre
    if (error && !/already|registered|exists/i.test(error.message)) { console.error(error); return decir("email", errorAcceso(error)); }
    f.reset(); decir("email", t("set.emailSent", { e: nuevo }), true);
  }
  // Contraseña: se comprueba la actual antes de cambiarla
  async function passEnviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = e.currentTarget, actual = valor(f, "actual"), nueva = valor(f, "pass"), rep = valor(f, "pass2");
    if (conPassword() && !actual) { foco(f, "actual"); return decir("pass", t("set.passWrong")); }
    if (!passFuerte(nueva)) return decir("pass", t("auth.err.short"));
    if (nueva !== rep) return decir("pass", t("auth.err.match"));
    if (actual && actual === nueva) return decir("pass", t("set.passSame"));
    setOcupado("pass"); decir("pass", t("auth.wait"));
    try {
      if (conPassword()) {
        const chk = await cliente.auth.signInWithPassword({ email: usuario!.email as string, password: actual });
        if (chk.error) return decir("pass", t("set.passWrong"));
      }
      const { error } = await cliente.auth.updateUser({ password: nueva });
      if (error) return decir("pass", /different|same/i.test(error.message) ? t("set.passSame") : errorAcceso(error));
      f.reset(); decir("pass", t("set.passSaved"), true);
    } catch (er) { console.error(er); decir("pass", t("auth.err.generic")); }
    finally { setOcupado(null); }
  }

  const sec = "flex flex-col gap-3 border-t border-frost py-6 first-of-type:border-t-0 first-of-type:pt-3";
  const boton = (k: string, txt: string, principal = false) => (
    <button className={cx(principal ? BTN : GHOST, "mt-0.5 self-start px-5 disabled:cursor-wait max-sm:w-full")} type="submit" disabled={ocupado === k}>{txt}</button>
  );
  return (
    <div className="flex flex-col px-9 pt-10 pb-8 max-sm:px-5 max-sm:py-7">
      <h2 className="mb-2 pr-11 text-head">{t("set.title")}</h2>
      <section className={sec} aria-labelledby="set-perfil">
        <h3 className="text-lead font-normal" id="set-perfil">{t("set.profile")}</h3>
        <form className={FORM} noValidate onSubmit={perfilEnviar}>
          <CampoUsuario inicial={perfil || ""} avatar={avatar} onAvatar={setAvatar} />
          <Msg txt={msgs.perfil?.txt || ""} ok={msgs.perfil?.ok} />
          {boton("perfil", t("set.saveBtn"), true)}
        </form>
      </section>
      <section className={sec} aria-labelledby="set-email">
        <h3 className="text-lead font-normal" id="set-email">{t("set.email")}</h3>
        <form className={FORM} noValidate onSubmit={emailEnviar}>
          <p className="text-small text-steel [overflow-wrap:anywhere]"><ConValor texto={t("set.current", { e: HUECO })} valor={<b className="font-medium text-midnight">{usuario.email || ""}</b>} /></p>
          <Campo lab={t("set.newEmail")}><input className={INPUT} name="email" type="email" required autoComplete="email" placeholder={t("auth.emailPh")} /></Campo>
          <Msg txt={msgs.email?.txt || ""} ok={msgs.email?.ok} />
          {boton("email", t("set.emailBtn"))}
        </form>
      </section>
      <section className={sec} aria-labelledby="set-pass">
        <h3 className="text-lead font-normal" id="set-pass">{t("set.pass")}</h3>
        <form className={FORM} noValidate onSubmit={passEnviar}>
          {conPassword() ? <Campo lab={t("set.curPass")}><CampoPass name="actual" auto="current-password" /></Campo> : <p className="text-small text-steel">{t("set.noPass")}</p>}
          <div className={FLD_2}>
            <Campo lab={t("set.newPass")}><CampoPass name="pass" ph={t("auth.passPh")} auto="new-password" /></Campo>
            <Campo lab={t("auth.confirm")}><CampoPass name="pass2" ph={t("auth.passPh")} auto="new-password" /></Campo>
          </div>
          <Msg txt={msgs.pass?.txt || ""} ok={msgs.pass?.ok} />
          {boton("pass", t("set.passBtn"))}
        </form>
      </section>
    </div>
  );
}
