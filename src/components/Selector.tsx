/* Selector en cápsula (estilo del ThemeSwitcher de Vercel): opciones en fila dentro de un borde redondeado;
   la elegida va en un círculo con borde y fondo. Es un grupo de radio accesible: flechas para moverse, Enter/Espacio para elegir. */
import { useEffect, useState, type KeyboardEvent, type ReactNode } from "react";
import { aplicarTema, guardarTema, leerTema, seguirSistema, TEMAS, type Tema } from "@/lib/tema";
import { IDIOMAS, type Idioma } from "@/lib/i18n";
import { useI18n } from "@/lib/store";
import { cx } from "./ui";

interface Opcion<V extends string> { valor: V; etiqueta: string; contenido: ReactNode }

export function Selector<V extends string>({ opciones, valor, onCambio, etiqueta, className }: {
  opciones: Opcion<V>[]; valor: V; onCambio: (v: V) => void; etiqueta: string; className?: string;
}) {
  const mover = (e: KeyboardEvent<HTMLDivElement>) => {
    const paso = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!paso) return;
    e.preventDefault();
    const k = (opciones.findIndex((o) => o.valor === valor) + paso + opciones.length) % opciones.length;
    onCambio(opciones[k].valor);
    (e.currentTarget.children[k] as HTMLElement | undefined)?.focus();
  };
  return (
    <div role="radiogroup" aria-label={etiqueta} onKeyDown={mover}
      className={cx("flex items-center gap-0.5 rounded-full border border-slate-300 bg-card p-[3px]", className)}>
      {opciones.map((o) => {
        const activa = o.valor === valor;
        return (
          <button key={o.valor} type="button" role="radio" aria-checked={activa} aria-label={o.etiqueta} title={o.etiqueta} tabIndex={activa ? 0 : -1}
            onClick={() => onCambio(o.valor)}
            className={cx("grid h-8 min-w-8 place-items-center rounded-full border px-1.5 text-xs font-bold tracking-wide transition-[color,background-color,border-color] duration-150 tactil:h-10 tactil:min-w-10 [&_svg]:size-[18px]",
              activa ? "border-slate-300 bg-slate-100 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-900")}>
            {o.contenido}
          </button>
        );
      })}
    </div>
  );
}

// Iconos dibujados a mano (trazo fino, como los de Vercel): sistema (pantalla), claro (sol) y oscuro (luna con estrella)
const svg = (d: ReactNode) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>;
const ICONOS: Record<Tema, ReactNode> = {
  sistema: svg(<><rect x="5" y="3" width="14" height="18" rx="2.5" /><path d="M8 6.5h8v7.5H8z" /><path d="M11 17.5h2" /></>),
  claro: svg(<><circle cx="12" cy="12" r="3.5" /><path d="M12 3v1.5M12 19.5V21M3 12h1.5M19.5 12H21M5.6 5.6l1.1 1.1M17.3 17.3l1.1 1.1M5.6 18.4l1.1-1.1M17.3 6.7l1.1-1.1" /></>),
  oscuro: svg(<><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" /><path d="M17.5 3.5v4M15.5 5.5h4" /></>)
};

export function SelectorTema() {
  const { t } = useI18n();
  const [tema, setTema] = useState<Tema>("claro");
  useEffect(() => { setTema(leerTema()); }, []);
  useEffect(() => { aplicarTema(tema); return seguirSistema(tema); }, [tema]);
  const nombres: Record<Tema, string> = { sistema: t("theme.system"), claro: t("theme.light"), oscuro: t("theme.dark") };
  return <Selector etiqueta={t("theme.aria")} valor={tema} onCambio={(v) => { setTema(v); guardarTema(v); }}
    opciones={TEMAS.map((v) => ({ valor: v, etiqueta: nombres[v], contenido: ICONOS[v] }))} />;
}

export function SelectorIdioma({ onCambio }: { onCambio: (l: Idioma) => void }) {
  const { t, lang } = useI18n();
  const nombres: Record<Idioma, string> = { es: "Español", en: "English" };
  return <Selector etiqueta={t("lang.aria")} valor={lang} onCambio={onCambio}
    opciones={IDIOMAS.map((l) => ({ valor: l, etiqueta: nombres[l], contenido: <span lang={l}>{l.toUpperCase()}</span> }))} />;
}
