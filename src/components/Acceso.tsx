/* Ventana de acceso: entrar, crear cuenta, recuperar contraseña, poner una nueva, elegir nombre de usuario
   y configuración de la cuenta (perfil, email y contraseña). */
import { Radar } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { AVA_DEFECTO, limpiarAvatar } from "@/lib/avatar";
import {
  USUARIO_OK, aceptarTerminos, alCerrarAcceso, asegurarCuenta, borrarMiCuenta, conPassword, descargarMisDatos, entrarConGoogle, errorAcceso, marcarUsuarioOcupado,
  passFuerte, salir, terminarCambioClave, usuarioLibre, volverAqui
} from "@/lib/cuenta";
import { LEGAL } from "@/lib/config";
import { abrirAcceso, cerrarAcceso, useApp, useI18n, type Acceso as DatosAcceso, type ModoAcceso } from "@/lib/store";
import { recordarSesion, sb } from "@/lib/supabase";
import type { ConfigAvatar } from "@/lib/tipos";
import { Avatar } from "./Avatar";
import { useCaptcha } from "./Captcha";
import { Dialogo } from "./Dialogo";
import { EditorAvatar } from "./EditorAvatar";
import * as I from "./iconos";
import { ConValor, HUECO } from "./piezas";
import { AUTH_LINK, BTN, CHK, DIALOGO_ANCHO, FLD, FLD_2, FLD_LAB, FORM, GHOST, INPUT, MSG, MSG_OK, cx } from "./ui";

export function Acceso() {
  const { t } = useI18n();
  const acceso = useApp((s) => s.acceso);
  // Al abrir la ventana se va descargando Supabase, para que esté listo al enviar el formulario
  useEffect(() => { if (acceso) asegurarCuenta().catch((e) => console.error(e)); }, [acceso]);
  const ancho = acceso && ["crear", "ajustes"].includes(acceso.modo) ? DIALOGO_ANCHO.medio : DIALOGO_ANCHO.estrecho;
  return (
    <Dialogo abierto={!!acceso} onCerrar={() => { const m = acceso?.modo; cerrarAcceso(); alCerrarAcceso(m); }} etiqueta={t("acct.menu")} className={ancho} claveScroll={acceso?.modo}>
      {acceso && (acceso.modo === "ajustes" ? <Ajustes key={acceso.v} /> : <Formulario key={acceso.v} a={acceso} />)}
    </Dialogo>
  );
}

const valor = (f: HTMLFormElement, n: string) => (f.elements.namedItem(n) as HTMLInputElement | null)?.value ?? "";
const foco = (f: HTMLFormElement, n: string) => (f.elements.namedItem(n) as HTMLElement | null)?.focus();
// Contraseña incorrecta: el campo (con su icono o etiqueta) tiembla y recibe el foco
function sacudir(f: HTMLFormElement, ...nombres: string[]) {
  nombres.forEach((n) => {
    const el = f.elements.namedItem(n) as HTMLElement | null; if (!el) return;
    const caja = (el.closest("label") || el.parentElement) as HTMLElement;
    caja.classList.remove("animate-sacudir"); void caja.offsetWidth; caja.classList.add("animate-sacudir");
    caja.addEventListener("animationend", () => caja.classList.remove("animate-sacudir"), { once: true });
  });
  foco(f, nombres[0]);
}
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
  nueva: ["auth.titleNew", "auth.submitNew"], usuario: ["auth.titleUser", "auth.submitUser"], terminos: ["tos.title", "tos.accept"]
};

function Formulario({ a }: { a: DatosAcceso }) {
  const { t } = useI18n();
  const [modo, setModo] = useState(a.modo as Exclude<ModoAcceso, "ajustes">);
  const [msg, setMsg] = useState({ txt: a.msg, ok: a.ok });
  const [enviando, setEnviando] = useState(false);
  const perfil = useApp((s) => s.perfil), cfgGuardado = useApp((s) => s.avatar);
  const [avatar, setAvatar] = useState<ConfigAvatar>(modo === "usuario" && cfgGuardado ? { ...cfgGuardado } : { ...AVA_DEFECTO });
  const form = useRef<HTMLFormElement>(null);
  const captcha = useCaptcha();
  useEffect(() => { setTimeout(() => form.current?.querySelector<HTMLInputElement>(a.email ? '[name="pass"]' : "input")?.focus(), 50); }, [modo]); // eslint-disable-line react-hooks/exhaustive-deps

  const [titulo, enviar] = TITULOS[modo];
  const fallo = (k: string) => setMsg({ txt: t(k), ok: false });
  const cambiarModo = (m: typeof modo) => { setModo(m); setMsg({ txt: "", ok: false }); };

  async function alEnviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = e.currentTarget;
    const cliente = await asegurarCuenta(); if (!cliente) return;
    if (modo === "terminos") {
      if (!(f.elements.namedItem("terminos") as HTMLInputElement).checked) return fallo("auth.err.terms");
      setEnviando(true);
      const ok = await aceptarTerminos().finally(() => setEnviando(false));
      return ok ? cerrarAcceso() : fallo("auth.err.generic");
    }
    const email = valor(f, "email").trim(), pass = valor(f, "pass");
    const esPerfil = modo === "usuario";
    if (["entrar", "crear", "olvido"].includes(modo) && !/^\S+@\S+\.\S+$/.test(email)) { foco(f, "email"); return fallo("auth.err.email"); }
    const usuario = valor(f, "usuario").trim().toLowerCase();
    if ((modo === "crear" || esPerfil) && !USUARIO_OK.test(usuario)) { foco(f, "usuario"); return fallo("auth.userBad"); }
    if ((modo === "crear" || modo === "nueva") && !passFuerte(pass)) { sacudir(f, "pass"); return fallo("auth.err.short"); }
    if (modo === "entrar" && !pass) return sacudir(f, "pass");
    if (modo === "crear" && pass !== valor(f, "pass2")) { sacudir(f, "pass", "pass2"); return fallo("auth.err.match"); }
    if (modo === "crear" && !(f.elements.namedItem("terminos") as HTMLInputElement).checked) return fallo("auth.err.terms");
    if (modo === "entrar") { try { localStorage.setItem("radar-recordar", (f.elements.namedItem("recordar") as HTMLInputElement).checked ? "si" : "no"); } catch {} }
    const captchaToken = captcha.token();
    if (captchaToken === "" && ["entrar", "crear", "olvido"].includes(modo)) return fallo("auth.captcha");
    setEnviando(true); setMsg({ txt: t("auth.wait"), ok: false });
    try {
      if ((modo === "crear" || (esPerfil && usuario !== perfil)) && !(await usuarioLibre(usuario))) { fallo("auth.userTaken"); foco(f, "usuario"); return; }
      let error: unknown = null;
      if (modo === "entrar") ({ error } = await cliente.auth.signInWithPassword({ email, password: pass, options: { captchaToken } }));
      else if (modo === "crear") {
        // «terminos»: la versión aceptada con la casilla; la base de datos la apunta al crear la cuenta (seguridad.aceptaciones)
        const datos = { usuario, avatar: limpiarAvatar(avatar), terminos: LEGAL.version };
        const r = await cliente.auth.signUp({ email, password: pass, options: { data: datos, emailRedirectTo: volverAqui() + "?confirmado=1", captchaToken } });
        // SEGURIDAD: si el email ya tiene cuenta (Supabase devuelve un usuario sin identidades o un error «already registered»),
        // se muestra el MISMO mensaje que en un registro nuevo, para que nadie pueda averiguar qué emails están registrados.
        const yaExiste = (!r.error && r.data?.user && !(r.data.user.identities || []).length) || /already registered|already been registered/i.test(r.error?.message || "");
        if (yaExiste || (!r.error && !r.data.session)) return setMsg({ txt: t("auth.checkEmail", { e: email }), ok: true });
        error = r.error;
      } else if (modo === "olvido") {
        const r = await cliente.auth.resetPasswordForEmail(email, { redirectTo: volverAqui() + "?recuperar=1", captchaToken });
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
    } catch (er) { console.error(er); setMsg({ txt: errorAcceso(er), ok: false }); if (modo === "entrar") sacudir(f, "pass"); }
    finally { setEnviando(false); captcha.reiniciar(); }
  }

  const recordar = recordarSesion();
  return (
    <div className="flex flex-col gap-4 p-6 max-sm:px-5">
      <div className="text-center">
        <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm"><Radar className="size-6" aria-hidden="true" /></div>
        <h2 className="text-xl font-extrabold text-slate-900">{modo === "entrar" || modo === "crear" ? t("d.join") : t(titulo)}</h2>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm">
          {modo === "entrar" || modo === "crear" ? t("d.joinText") : modo === "usuario" ? t("auth.introUser") : modo === "terminos" ? t("tos.text") : null}
        </p>
      </div>
      {a.motivo && <p className="rounded-xl border border-indigo-100 bg-indigo-50 px-3.5 py-2.5 text-center text-sm font-medium text-indigo-700">{t(a.motivo)}</p>}
      {(modo === "entrar" || modo === "crear") && <>
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1" role="group">
          {(["entrar", "crear"] as const).map((m) => (
            <button key={m} type="button" aria-pressed={modo === m} onClick={() => cambiarModo(m)}
              className={cx("rounded-lg py-1.5 text-sm font-semibold transition-colors tactil:min-h-10", modo === m ? "bg-card text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-700")}>
              {t(m === "entrar" ? "auth.titleIn" : "auth.titleUp")}
            </button>
          ))}
        </div>
        <button className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-card px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 tactil:min-h-12"
          type="button" onClick={async () => { const err = await entrarConGoogle(); if (err) setMsg({ txt: err, ok: false }); }}>
          <I.LogoGoogle /><span>{t("d.google")}</span>
        </button>
        <p className="flex items-center gap-3 text-xs font-medium text-slate-500 before:h-px before:flex-1 before:bg-slate-200 after:h-px after:flex-1 after:bg-slate-200">{t("d.orEmail")}</p>
      </>}
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
          <Campo lab={t("auth.email")}><input className={INPUT} name="email" type="email" required autoComplete="email" placeholder={t("auth.emailPh")} /></Campo>
          <CampoUsuario inicial="" avatar={avatar} onAvatar={setAvatar} />
          <div className={FLD_2}>
            <Campo lab={t("auth.pass")}><CampoPass name="pass" ph={t("auth.passPh")} auto="new-password" /></Campo>
            <Campo lab={t("auth.confirm")}><CampoPass name="pass2" ph={t("auth.passPh")} auto="new-password" /></Campo>
          </div>
          <CasillaTerminos />
        </>}
        {modo === "terminos" && <CasillaTerminos />}
        {modo === "usuario" && <CampoUsuario inicial={perfil || ""} avatar={avatar} onAvatar={setAvatar} />}
        {modo === "olvido" && <Pildora ico={<I.Sobre />}><input className={INPUT} name="email" type="email" required autoComplete="email" placeholder={t("auth.email")} aria-label={t("auth.email")} /></Pildora>}
        {modo === "nueva" && <>
          <Pildora ico={<I.Candado />}><CampoPass name="pass" ph={t("auth.newPass")} auto="new-password" etiqueta={t("auth.newPass")} /></Pildora>
          <p className="-mt-1.5 text-xs text-slate-500">{t("auth.passHint")}</p>
        </>}
        <Msg txt={msg.txt} ok={msg.ok} />
        {["entrar", "crear", "olvido"].includes(modo) && captcha.nodo}
        <button className={cx(BTN, "mt-0.5 w-full disabled:cursor-wait")} type="submit" disabled={enviando}>{t(enviar)}</button>
      </form>
      {modo === "olvido" && <p className="text-center text-sm text-slate-500"><button className={AUTH_LINK} type="button" onClick={() => cambiarModo("entrar")}>{t("auth.back")}</button></p>}
      {modo === "terminos" && <p className="text-center text-sm text-slate-500"><button className={AUTH_LINK} type="button" onClick={async () => { await salir().catch((e) => console.error(e)); cerrarAcceso(); }}>{t("tos.logout")}</button></p>}
    </div>
  );
}

// Casilla de aceptación (sin marcar por defecto) con enlaces a los textos, que se abren en otra pestaña
function CasillaTerminos() {
  const { t } = useI18n();
  const enlace = "font-semibold text-acento underline underline-offset-2";
  return (
    <label className={CHK}>
      <input type="checkbox" name="terminos" required />
      <span>{t("auth.termsPre")} <a className={enlace} href="terminos" target="_blank" rel="noopener">{t("legal.terms")}</a> {t("auth.termsMid")} <a className={enlace} href="privacidad" target="_blank" rel="noopener">{t("legal.privacy")}</a>.</span>
    </label>
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
  const captcha = useCaptcha();
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
    if (conPassword() && !actual) { sacudir(f, "actual"); return decir("pass", t("set.passWrong")); }
    if (!passFuerte(nueva)) return decir("pass", t("auth.err.short"));
    if (nueva !== rep) return decir("pass", t("auth.err.match"));
    if (actual && actual === nueva) return decir("pass", t("set.passSame"));
    const captchaToken = captcha.token();
    if (conPassword() && captchaToken === "") return decir("pass", t("auth.captcha"));
    setOcupado("pass"); decir("pass", t("auth.wait"));
    try {
      if (conPassword()) {
        const chk = await cliente.auth.signInWithPassword({ email: usuario!.email as string, password: actual, options: { captchaToken } });
        if (chk.error) { sacudir(f, "actual"); return decir("pass", t("set.passWrong")); }
      }
      const { error } = await cliente.auth.updateUser({ password: nueva });
      if (error) return decir("pass", /different|same/i.test(error.message) ? t("set.passSame") : errorAcceso(error));
      f.reset(); decir("pass", t("set.passSaved"), true);
    } catch (er) { console.error(er); decir("pass", t("auth.err.generic")); }
    finally { setOcupado(null); captcha.reiniciar(); }
  }

  const sec = "flex flex-col gap-3 border-t border-frost py-6 first-of-type:border-t-0 first-of-type:pt-3";
  const boton = (k: string, txt: string, principal = false) => (
    <button className={cx(principal ? BTN : GHOST, "mt-0.5 self-start px-5 disabled:cursor-wait max-sm:w-full")} type="submit" disabled={ocupado === k}>{txt}</button>
  );
  return (
    <div className="flex flex-col px-9 pt-10 pb-8 max-sm:px-5 max-sm:py-7">
      <h2 className="mb-2 pr-11 text-xl font-extrabold text-slate-900">{t("set.title")}</h2>
      <section className={sec} aria-labelledby="set-perfil">
        <h3 className="text-sm font-bold text-slate-900" id="set-perfil">{t("set.profile")}</h3>
        <form className={FORM} noValidate onSubmit={perfilEnviar}>
          <CampoUsuario inicial={perfil || ""} avatar={avatar} onAvatar={setAvatar} />
          <Msg txt={msgs.perfil?.txt || ""} ok={msgs.perfil?.ok} />
          {boton("perfil", t("set.saveBtn"), true)}
        </form>
      </section>
      <section className={sec} aria-labelledby="set-email">
        <h3 className="text-sm font-bold text-slate-900" id="set-email">{t("set.email")}</h3>
        <form className={FORM} noValidate onSubmit={emailEnviar}>
          <p className="text-small text-steel [overflow-wrap:anywhere]"><ConValor texto={t("set.current", { e: HUECO })} valor={<b className="font-medium text-midnight">{usuario.email || ""}</b>} /></p>
          <Campo lab={t("set.newEmail")}><input className={INPUT} name="email" type="email" required autoComplete="email" placeholder={t("auth.emailPh")} /></Campo>
          <Msg txt={msgs.email?.txt || ""} ok={msgs.email?.ok} />
          {boton("email", t("set.emailBtn"))}
        </form>
      </section>
      <section className={sec} aria-labelledby="set-pass">
        <h3 className="text-sm font-bold text-slate-900" id="set-pass">{t("set.pass")}</h3>
        <form className={FORM} noValidate onSubmit={passEnviar}>
          {conPassword() ? <Campo lab={t("set.curPass")}><CampoPass name="actual" auto="current-password" /></Campo> : <p className="text-small text-steel">{t("set.noPass")}</p>}
          <div className={FLD_2}>
            <Campo lab={t("set.newPass")}><CampoPass name="pass" ph={t("auth.passPh")} auto="new-password" /></Campo>
            <Campo lab={t("auth.confirm")}><CampoPass name="pass2" ph={t("auth.passPh")} auto="new-password" /></Campo>
          </div>
          {conPassword() && captcha.nodo}
          <Msg txt={msgs.pass?.txt || ""} ok={msgs.pass?.ok} />
          {boton("pass", t("set.passBtn"))}
        </form>
      </section>
      <MisDatos sec={sec} />
    </div>
  );
}

/* Ajustes › Tus datos: descargar una copia y borrar la cuenta (con confirmación escribiendo una palabra) */
function MisDatos({ sec }: { sec: string }) {
  const { t } = useI18n();
  const captcha = useCaptcha();
  const [msg, setMsg] = useState({ txt: "", ok: false });
  const [confirmar, setConfirmar] = useState(false), [texto, setTexto] = useState(""), [ocupado, setOcupado] = useState(false);
  const palabra = t("set.deleteWord");
  async function descargar() {
    setOcupado(true);
    const ok = await descargarMisDatos().finally(() => setOcupado(false));
    setMsg(ok ? { txt: t("set.dataDone"), ok: true } : { txt: t("auth.err.generic"), ok: false });
  }
  async function borrar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = e.currentTarget;
    if (texto.trim().toUpperCase() !== palabra) { sacudir(f, "confirmar"); return setMsg({ txt: t("set.deleteConfirm", { w: palabra }), ok: false }); }
    // Por seguridad la base de datos exige un inicio de sesión de hace menos de 15 minutos:
    // con contraseña, se comprueba aquí mismo; con Google, hay que volver a entrar con Google.
    const pass = valor(f, "actual");
    if (conPassword() && !pass) { sacudir(f, "actual"); return setMsg({ txt: t("set.deleteNeedPass"), ok: false }); }
    const captchaToken = captcha.token();
    if (conPassword() && captchaToken === "") return setMsg({ txt: t("auth.captcha"), ok: false });
    setOcupado(true); setMsg({ txt: t("auth.wait"), ok: false });
    try {
      if (conPassword()) {
        const usuario = useApp.getState().usuario;
        const chk = await sb()!.auth.signInWithPassword({ email: usuario?.email || "", password: pass, options: { captchaToken } });
        if (chk.error) { sacudir(f, "actual"); return setMsg({ txt: t("set.passWrong"), ok: false }); }
      }
      const r = await borrarMiCuenta();
      if (r === "reautenticar") return setMsg({ txt: t(conPassword() ? "auth.err.generic" : "set.deleteReauth"), ok: false });
      if (r !== "ok") setMsg({ txt: t(r === "limite" ? "auth.err.rate" : "auth.err.generic"), ok: false });
    } finally { setOcupado(false); captcha.reiniciar(); }
  }
  return (
    <section className={sec} aria-labelledby="set-datos">
      <h3 className="text-sm font-bold text-slate-900" id="set-datos">{t("set.data")}</h3>
      <p className="text-xs text-slate-500">{t("set.dataText")}</p>
      <button className={cx(GHOST, "self-start px-5 disabled:cursor-wait max-sm:w-full")} type="button" disabled={ocupado} onClick={descargar}>{t("set.dataBtn")}</button>
      <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50/60 p-3.5">
        <h4 className="text-sm font-bold text-rose-700">{t("set.delete")}</h4>
        <p className="mt-1 text-xs text-slate-600">{t("set.deleteText")}</p>
        {!confirmar ? (
          <button className="mt-2.5 rounded-xl border border-rose-300 bg-card px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100" type="button" onClick={() => setConfirmar(true)}>{t("set.delete")}</button>
        ) : (
          <form className="mt-2.5 flex flex-col gap-2.5" noValidate onSubmit={borrar}>
            <label className={FLD}><span className={FLD_LAB}>{t("set.deleteConfirm", { w: palabra })}</span>
              <input className={INPUT} name="confirmar" autoComplete="off" value={texto} onChange={(e) => setTexto(e.target.value)} />
            </label>
            {conPassword()
              ? <Campo lab={t("set.curPass")}><CampoPass name="actual" auto="current-password" /></Campo>
              : <p className="text-xs text-slate-600">{t("set.deleteGoogle")} <button type="button" className={AUTH_LINK} onClick={() => entrarConGoogle()}>{t("d.google")}</button></p>}
            {conPassword() && captcha.nodo}
            <div className="flex flex-wrap gap-2">
              <button className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-wait" type="submit" disabled={ocupado}>{t("set.deleteBtn")}</button>
              <button className={cx(GHOST, "px-4")} type="button" onClick={() => { setConfirmar(false); setTexto(""); }}>{t("set.cancel")}</button>
            </div>
          </form>
        )}
      </div>
      <Msg txt={msg.txt} ok={msg.ok} />
    </section>
  );
}
