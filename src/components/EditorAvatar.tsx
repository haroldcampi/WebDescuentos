/* Editor del avatar: panel flotante bajo el botón de ajustes (forma, expresión, fondo y color).
   Se coloca respecto a la pantalla (no lo recorta la ventana); si abajo no cabe, se abre hacia arriba. */
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { AVA_EXPRESIONES, AVA_FONDOS, AVA_FORMAS, AVA_TONOS } from "@/lib/avatar";
import { useI18n } from "@/lib/store";
import type { ConfigAvatar } from "@/lib/tipos";
import { Avatar } from "./Avatar";
import { AUTH_LINK, LABEL, cx } from "./ui";

interface Props {
  semilla: string;
  cfg: ConfigAvatar;
  onCambio: (c: ConfigAvatar) => void;
  ancla: RefObject<HTMLElement | null>;
  onCerrar: () => void;
}

export function EditorAvatar({ semilla, cfg, onCambio, ancla, onCerrar }: Props) {
  const { t } = useI18n();
  const panel = useRef<HTMLDivElement>(null);
  const [todas, setTodas] = useState(false);
  const [pos, setPos] = useState<CSSProperties>({});

  useLayoutEffect(() => {
    const colocar = () => {
      const b = ancla.current; if (!b) return;
      const r = b.getBoundingClientRect(), vw = innerWidth, vh = innerHeight, m = 12;
      const ancho = Math.min(360, vw - 2 * m);
      const left = Math.min(Math.max(m, r.right - ancho), vw - ancho - m);
      const abajo = vh - r.bottom - 8 - m, arriba = r.top - 8 - m;
      setPos(abajo >= 320 || abajo >= arriba
        ? { width: ancho, left, top: r.bottom + 8, bottom: "auto", maxHeight: Math.min(560, abajo) }
        : { width: ancho, left, top: "auto", bottom: vh - r.top + 8, maxHeight: Math.min(560, arriba) });
    };
    colocar();
    addEventListener("resize", colocar); document.addEventListener("scroll", colocar, true);
    return () => { removeEventListener("resize", colocar); document.removeEventListener("scroll", colocar, true); };
  }, [ancla]);

  // Se cierra al tocar fuera o con Esc
  useEffect(() => {
    panel.current?.querySelector<HTMLElement>('[aria-pressed="true"]')?.focus({ preventScroll: true });
    const fuera = (e: MouseEvent) => {
      const camino = e.composedPath();
      if (camino.includes(panel.current as EventTarget) || camino.some((n) => n instanceof HTMLElement && "avaAbrir" in n.dataset)) return;
      onCerrar();
    };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); onCerrar(); ancla.current?.focus(); } };
    document.addEventListener("click", fuera); document.addEventListener("keydown", esc, true);
    return () => { document.removeEventListener("click", fuera); document.removeEventListener("keydown", esc, true); };
  }, [onCerrar, ancla]);

  const poner = (k: keyof ConfigAvatar, v: string | number) => onCambio({ ...cfg, [k]: v });
  const op = "flex flex-col items-center gap-1.5 rounded-box border border-transparent bg-transparent px-1 pt-2.5 pb-2 text-caption font-normal text-steel transition-[background-color,border-color] duration-200 hover:bg-mist aria-pressed:bg-wash aria-pressed:font-medium aria-pressed:text-midnight";
  const seg = "rounded-[3px] border-0 bg-transparent px-3 py-[7px] text-small font-normal text-steel hover:text-indigo aria-pressed:bg-wash aria-pressed:text-indigo tactil:min-h-10";
  const lista = todas ? AVA_EXPRESIONES : AVA_EXPRESIONES.slice(0, 4).concat(AVA_EXPRESIONES.slice(4).includes(cfg.expresion) ? [cfg.expresion] : []);
  const grupo = (titulo: string, hijos: React.ReactNode) => <div><p className={cx(LABEL, "mb-2")}>{titulo}</p>{hijos}</div>;

  return (
    <div ref={panel} id="ava-editor" role="dialog" aria-label={t("ava.title")} style={pos}
      className="fixed z-[6] flex animate-pop flex-col gap-[18px] overflow-auto overscroll-contain rounded-box border border-lavender bg-paper px-3.5 py-4">
      {grupo(t("ava.shape"), <div className="grid grid-cols-4 gap-1.5">
        {["auto", ...Object.keys(AVA_FORMAS)].map((f) => (
          <button key={f} type="button" className={op} aria-pressed={cfg.forma === f} onClick={() => poner("forma", f)}>
            <Avatar semilla={semilla} cfg={{ ...cfg, forma: f }} className="size-9" /><span>{f === "auto" ? t("ava.auto") : t("ava.s." + f)}</span>
          </button>
        ))}
      </div>)}
      <div>
        <p className={cx(LABEL, "mb-2")}>{t("ava.expr")}</p>
        <div className="grid grid-cols-4 gap-1.5">
          {lista.map((e) => (
            <button key={e} type="button" className={op} aria-pressed={cfg.expresion === e} onClick={() => poner("expresion", e)}>
              <Avatar semilla={semilla} cfg={{ ...cfg, expresion: e }} className="size-9" /><span>{t("ava.e." + e)}</span>
            </button>
          ))}
        </div>
        <button type="button" className={cx(AUTH_LINK, "mx-auto mt-2 block")} onClick={() => setTodas((v) => !v)}>
          {todas ? t("ava.less") : t("ava.more", { n: AVA_EXPRESIONES.length - 4 })}
        </button>
      </div>
      {grupo(t("ava.bg"), <div className="inline-flex flex-wrap gap-0.5 rounded-box border border-frost bg-paper p-0.5">
        {AVA_FONDOS.map((b) => <button key={b} type="button" className={seg} aria-pressed={cfg.fondo === b} onClick={() => poner("fondo", b)}>{t("ava.b." + b)}</button>)}
      </div>)}
      {grupo(t("ava.hue"), <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={cx(seg, "border border-frost bg-paper aria-pressed:border-lilac")} aria-pressed={cfg.tono === "auto"} onClick={() => poner("tono", "auto")}>{t("ava.auto")}</button>
        {AVA_TONOS.map((h, k) => (
          <button key={h} type="button" aria-pressed={cfg.tono === h} aria-label={t("ava.h." + k)} title={t("ava.h." + k)} onClick={() => poner("tono", h)}
            className="size-[26px] rounded-full border-2 border-paper p-0 shadow-[0_0_0_1px_var(--color-frost)] transition-transform duration-150 ease-brand hover:scale-110 aria-pressed:shadow-[0_0_0_2px_var(--color-indigo)] tactil:size-[34px]"
            style={{ background: `oklch(0.72 0.12 ${h})` }} />
        ))}
      </div>)}
    </div>
  );
}
