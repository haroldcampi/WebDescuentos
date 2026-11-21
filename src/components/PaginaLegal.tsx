/* Páginas legales (Privacidad, Términos, Cookies, Créditos): cabecera sencilla, el texto y enlaces entre ellas.
   Los datos del titular, email y estado vienen de config.ts → LEGAL; si faltan, se marcan bien visibles como PENDIENTE. */
import { ArrowLeft, Radar } from "lucide-react";
import Head from "next/head";
import { Fragment, useEffect, type ReactNode } from "react";
import { LEGAL } from "@/lib/config";
import { guardarIdioma, idiomaInicial, type Idioma } from "@/lib/i18n";
import { documento, type DocLegal } from "@/lib/legal";
import { abrirPanelCookies } from "@/lib/privacidad";
import { useApp, useI18n } from "@/lib/store";
import { SelectorIdioma, SelectorTema } from "./Selector";

const DOCS: [DocLegal, string][] = [["privacidad", "legal.privacy"], ["terminos", "legal.terms"], ["cookies", "legal.cookies"], ["creditos", "legal.credits"]];

// Sustituye {titular} {email} {estado}; lo que falte sale resaltado como PENDIENTE
function Rellenar({ texto }: { texto: string }) {
  const { t } = useI18n();
  const datos: Record<string, string> = { titular: LEGAL.titular, email: LEGAL.email, estado: LEGAL.estado };
  return <>{texto.split(/(\{titular\}|\{email\}|\{estado\})/).map((trozo, k) => {
    const m = trozo.match(/^\{(titular|email|estado)\}$/);
    if (!m) return <Fragment key={k}>{trozo}</Fragment>;
    const v = datos[m[1]];
    if (!v) return <mark key={k} className="rounded bg-amber-200 px-1 font-semibold text-amber-900">[{t("legal.pending")}: {m[1]}]</mark>;
    return m[1] === "email" ? <a key={k} className="font-semibold text-acento underline" href={"mailto:" + v}>{v}</a> : <b key={k}>{v}</b>;
  })}</>;
}

export function PaginaLegal({ doc, extra }: { doc: DocLegal; extra?: ReactNode }) {
  const i = useI18n(), { t, lang } = i;
  useEffect(() => {
    const l = idiomaInicial();
    document.documentElement.lang = l;
    useApp.setState({ lang: l, montado: true });
  }, []);
  const d = documento(doc, lang);
  const cambiar = (l: Idioma) => { guardarIdioma(l); useApp.setState({ lang: l }); };
  return (
    <div className="flex min-h-svh flex-col">
      <Head><title>{d.titulo + " · " + t("meta.title")}</title></Head>
      <header className="border-b border-slate-200/80 bg-card">
        <div className="wrap flex h-16 items-center justify-between gap-4">
          <a href="./" className="flex items-center gap-2.5 font-extrabold text-slate-900 no-underline">
            <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white"><Radar className="size-5" aria-hidden="true" /></span>
            {lang === "en" ? "Deal Radar" : "Radar de Ofertas"}
          </a>
          <div className="flex items-center gap-2">
            <SelectorIdioma onCambio={cambiar} />
            <SelectorTema />
          </div>
        </div>
      </header>

      <main className="wrap flex-1 py-8">
        <article className="mx-auto max-w-3xl">
          <a href="./" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-acento hover:underline"><ArrowLeft className="size-4" aria-hidden="true" />{t("legal.back")}</a>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{d.titulo}</h1>
          <p className="mt-2 text-sm text-slate-500">{t("legal.updated", { d: i.fecha(LEGAL.version) })}</p>
          {d.intro && <p className="mt-5 text-base leading-relaxed text-slate-700"><Rellenar texto={d.intro} /></p>}
          {d.secciones.map((s) => (
            <section key={s.h} className="mt-8">
              <h2 className="text-lg font-bold text-slate-900">{s.h}</h2>
              {s.b.map((b, k) => Array.isArray(b)
                ? <ul key={k} className="mt-3 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-slate-700">{b.map((li) => <li key={li}><Rellenar texto={li} /></li>)}</ul>
                : <p key={k} className="mt-3 text-[15px] leading-relaxed text-slate-700"><Rellenar texto={b} /></p>)}
            </section>
          ))}
          {extra}
        </article>
      </main>

      <footer className="border-t border-slate-200/80 bg-card">
        <nav className="wrap flex flex-wrap items-center justify-center gap-x-5 gap-y-2 py-5 text-xs font-semibold text-slate-600" aria-label={t("foot.navAria")}>
          {DOCS.map(([k, txt]) => <a key={k} href={k} aria-current={k === doc ? "page" : undefined} className="hover:text-acento aria-[current=page]:text-acento">{t(txt)}</a>)}
          <button type="button" className="hover:text-acento" onClick={abrirPanelCookies}>{t("legal.choices")}</button>
        </nav>
      </footer>
    </div>
  );
}
