/* Ventana modal con <dialog> nativo: Esc y clic fuera la cierran (closedby="any").
   Solo donde no existe closedby (Safari), se imita midiendo dónde se pulsa y se suelta: fuera del recuadro. */
import { useEffect, useRef, type KeyboardEvent, type ReactNode, type TouchEvent } from "react";
import { useI18n } from "@/lib/store";
import { CERRAR, cx } from "./ui";

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  etiqueta: string;
  className?: string;
  // Al cambiar, la ventana vuelve arriba (p. ej. al abrir otra ficha)
  claveScroll?: string | number;
  onKeyDown?: (e: KeyboardEvent<HTMLDialogElement>) => void;
  onTouchStart?: (e: TouchEvent<HTMLDialogElement>) => void;
  onTouchEnd?: (e: TouchEvent<HTMLDialogElement>) => void;
  children: ReactNode;
}

export function Dialogo({ abierto, onCerrar, etiqueta, className, claveScroll, children, ...eventos }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const cerrar = useRef(onCerrar);
  cerrar.current = onCerrar;
  const { t } = useI18n();

  useEffect(() => {
    const d = ref.current; if (!d) return;
    if (abierto && !d.open) { if (typeof d.showModal === "function") d.showModal(); else d.setAttribute("open", ""); }
    if (!abierto && d.open) d.close();
  }, [abierto]);
  useEffect(() => { if (ref.current) ref.current.scrollTop = 0; }, [claveScroll]);

  useEffect(() => {
    const d = ref.current; if (!d) return;
    const alCerrar = () => cerrar.current();
    d.addEventListener("close", alCerrar);
    if ("closedBy" in HTMLDialogElement.prototype) return () => d.removeEventListener("close", alCerrar);
    const fuera = (e: PointerEvent) => { const r = d.getBoundingClientRect(); return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom; };
    let pulsoFuera = false;
    const abajo = (e: PointerEvent) => { pulsoFuera = fuera(e); };
    const arriba = (e: PointerEvent) => { if (pulsoFuera && fuera(e)) d.close(); };
    d.addEventListener("pointerdown", abajo); d.addEventListener("pointerup", arriba);
    return () => { d.removeEventListener("close", alCerrar); d.removeEventListener("pointerdown", abajo); d.removeEventListener("pointerup", arriba); };
  }, []);

  return (
    <dialog ref={ref} {...{ closedby: "any" }} aria-label={etiqueta} className={cx(className)} {...eventos}>
      {abierto && <>
        <button className={CERRAR} type="button" aria-label={t("sheet.close")} onClick={() => ref.current?.close()}>×</button>
        {children}
      </>}
    </dialog>
  );
}
