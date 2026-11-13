/* Iconos SVG de la web (24x24, usan el color del texto) */
import type { ReactNode, SVGProps } from "react";
import { ICO } from "@/lib/iconos-cat";

type P = SVGProps<SVGSVGElement> & { size?: number; sw?: number };
function Svg({ size = 16, children, sw = 1.7, ...r }: P & { children: ReactNode }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...r}>{children}</svg>;
}

// Icono de una categoría (el dibujo viene de iconos-cat.ts, texto fijo de la web)
export function IcoCategoria({ c, size = 18, className }: { c: string; size?: number; className?: string }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className} dangerouslySetInnerHTML={{ __html: ICO[c] || ICO["Todas"] }} />;
}

export const Flecha = (p: P) => <Svg size={15} sw={2.2} {...p}><path d="M7 17 17 7M9 7h8v8" /></Svg>;
export const Mas = (p: P) => <Svg size={14} sw={2.4} {...p}><path d="M12 5v14M5 12h14" /></Svg>;
export const Check = (p: P) => <Svg size={12} sw={2.4} {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></Svg>;
export const Reloj = (p: P) => <Svg size={12} sw={2.2} {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></Svg>;
export const Aviso = (p: P) => <Svg size={12} sw={2.2} {...p}><path d="M12 3 2 20h20L12 3Z" /><path d="M12 10v4M12 17h.01" /></Svg>;
export const Tijera = (p: P) => <Svg size={12} sw={2} {...p}><circle cx="6" cy="6" r="2.5" /><circle cx="6" cy="18" r="2.5" /><path d="M8 7.5 20 17M8 16.5 20 7" /></Svg>;
export const Rayo = (p: P) => <Svg size={12} sw={2} {...p}><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" /></Svg>;
export const Tendencia = (p: P) => <Svg size={12} sw={2.2} {...p}><path d="m3 17 6-6 4 4 8-8" /><path d="M15 7h6v6" /></Svg>;
export const PulgarArriba = (p: P) => <Svg size={18} sw={1.6} {...p}><path d="M7 10v12" /><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" /></Svg>;
export const PulgarAbajo = (p: P) => <Svg size={18} sw={1.6} {...p}><path d="M17 14V2" /><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z" /></Svg>;
export const Sobre = (p: P) => <Svg {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></Svg>;
export const Enlace = (p: P) => <Svg {...p}><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1" /><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" /></Svg>;
export const Corazon = (p: P) => <Svg {...p}><path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20Z" /></Svg>;
export const Campana = (p: P) => <Svg {...p}><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16ZM10 20.5a2 2 0 0 0 4 0" /></Svg>;
export const Engranaje = (p: P) => <Svg {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></Svg>;
export const Ajustes = (p: P) => <Svg size={18} sw={1.6} {...p}><path d="M4 8h9M17 8h3M4 16h3M11 16h9" /><circle cx="15" cy="8" r="2" /><circle cx="9" cy="16" r="2" /></Svg>;
export const Candado = (p: P) => <Svg {...p}><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /><circle cx="12" cy="15.5" r="1.2" fill="currentColor" /></Svg>;
export const Ojo = ({ tachado, ...p }: P & { tachado: boolean }) => <Svg {...p}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="3" />{tachado && <path d="M4 20 20 4" />}</Svg>;
export const Lupa = (p: P) => <Svg size={18} sw={2} {...p}><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></Svg>;
export const Luna = (p: P) => <Svg sw={1.5} {...p}><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" /></Svg>;
export const Sol = (p: P) => <Svg sw={1.5} {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" /></Svg>;
export const Usuario = (p: P) => <Svg sw={1.5} {...p}><circle cx="12" cy="8" r="4" /><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" /></Svg>;
export const Rejilla = (p: P) => <Svg sw={1.8} {...p}><rect x="4" y="4" width="7" height="7" rx="1" /><rect x="13" y="4" width="7" height="7" rx="1" /><rect x="4" y="13" width="7" height="7" rx="1" /><rect x="13" y="13" width="7" height="7" rx="1" /></Svg>;
export const Ordenar = (p: P) => <Svg sw={1.8} {...p}><path d="M8 19V5M4.5 8.5 8 5l3.5 3.5M16 5v14M12.5 15.5 16 19l3.5-3.5" /></Svg>;
export const Escudo = (p: P) => <Svg size={20} sw={1.5} {...p}><path d="M12 3 4.5 6v5.5c0 4.5 3.2 8.2 7.5 9.5 4.3-1.3 7.5-5 7.5-9.5V6L12 3Z" /><path d="m8.5 12 2.5 2.5 4.5-5" /></Svg>;
export const Moneda = (p: P) => <Svg size={20} sw={1.5} {...p}><circle cx="12" cy="12" r="8.5" /><path d="M14.5 9.5c-.5-1-1.4-1.5-2.5-1.5-1.5 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1 2-2.5 2c-1.2 0-2.1-.5-2.6-1.5M12 6.5V8M12 16v1.5" /></Svg>;

export function LogoMarca({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
      <circle cx="16" cy="16" r="14" fill="var(--color-indigo)" />
      <circle cx="16" cy="16" r="8.5" fill="none" stroke="#fff" strokeWidth="2.4" />
      <path d="M16 16 L25 8" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="16" cy="16" r="2.4" fill="#fff" />
    </svg>
  );
}

export function LogoGoogle() {
  return (
    <svg viewBox="0 0 18 18" width="18" height="18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33Z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z" />
    </svg>
  );
}
