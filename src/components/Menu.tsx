/* Menú desplegable de una sola elección («Ordenado por», «Agrupado por») con teclado: flechas, Inicio, Fin, Esc */
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "./ui";

interface Props<V extends string> {
  id: string;
  etiqueta: string;
  titulo: string;
  icono: ReactNode;
  valor: V;
  opciones: readonly V[];
  nombre: (v: V) => string;
  onCambio: (v: V) => void;
  className?: string;
  popClassName?: string;
}

export function Menu<V extends string>({ id, etiqueta, titulo, icono, valor, opciones, nombre, onCambio, className, popClassName }: Props<V>) {
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null), btn = useRef<HTMLButtonElement>(null), pop = useRef<HTMLDivElement>(null);
  const ops = () => [...(pop.current?.querySelectorAll<HTMLButtonElement>("[role=option]") || [])];

  useEffect(() => {
    if (!abierto) return;
    (pop.current?.querySelector<HTMLElement>('[aria-selected="true"]') || ops()[0])?.focus();
    const fuera = (e: MouseEvent) => { if (!caja.current?.contains(e.target as Node)) setAbierto(false); };
    document.addEventListener("click", fuera);
    return () => document.removeEventListener("click", fuera);
  }, [abierto]);

  const cerrar = (foco?: boolean) => { setAbierto(false); if (foco) btn.current?.focus(); };
  const teclas = (e: KeyboardEvent) => {
    const o = ops(), i = o.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === "ArrowDown") { e.preventDefault(); o[Math.min(o.length - 1, i + 1)]?.focus(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); o[Math.max(0, i - 1)]?.focus(); }
    else if (e.key === "Home") { e.preventDefault(); o[0]?.focus(); }
    else if (e.key === "End") { e.preventDefault(); o[o.length - 1]?.focus(); }
    else if (e.key === "Escape") { e.preventDefault(); cerrar(true); }
    else if (e.key === "Tab") cerrar();
  };

  return (
    <div className={cx("relative", className)} id={id} ref={caja}>
      <button ref={btn} className="group/m inline-flex items-center gap-1.5 border-0 bg-transparent px-1 py-2.5 text-small font-normal whitespace-nowrap text-midnight tactil:min-h-11 [&_svg]:text-indigo" type="button"
        aria-haspopup="listbox" aria-expanded={abierto}
        onClick={() => setAbierto((v) => !v)}
        onKeyDown={(e) => { if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); setAbierto(true); } }}>
        <span className="text-steel max-sm:hidden">{etiqueta}</span>{" "}
        <b className="font-medium group-hover/m:text-indigo group-aria-expanded/m:text-indigo">{nombre(valor)}</b>
        {icono}
      </button>
      <div ref={pop} className={cx("absolute top-[calc(100%+6px)] right-0 z-[25] flex min-w-60 flex-col rounded-box border border-lavender bg-paper p-2", popClassName)} role="listbox" tabIndex={-1} aria-label={titulo} hidden={!abierto} onKeyDown={teclas}>
        <p className="px-3 pt-1.5 pb-2 text-caption font-normal uppercase tracking-label text-slate" aria-hidden="true">{titulo}</p>
        {opciones.map((v) => (
          <button key={v} type="button" role="option" aria-selected={v === valor} tabIndex={-1}
            className="block w-full rounded-box border-0 bg-transparent px-3 py-[9px] text-left text-small font-normal text-indigo hover:bg-mist focus-visible:bg-mist focus-visible:outline-none aria-selected:bg-wash aria-selected:font-medium aria-selected:text-midnight tactil:min-h-11"
            onClick={() => { onCambio(v); cerrar(true); }}>
            {nombre(v)}
          </button>
        ))}
      </div>
    </div>
  );
}
