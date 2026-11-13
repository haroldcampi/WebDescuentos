import { useEffect } from "react";
import { cargarAvatares, svgAvatar } from "@/lib/avatar";
import { useApp } from "@/lib/store";
import type { ConfigAvatar } from "@/lib/tipos";
import { cx } from "./ui";

const BASE = "inline-grid size-6 flex-none place-items-center overflow-hidden rounded-[6px] [&_svg]:block [&_svg]:size-full";

/* Avatar dibujado a partir del nombre de usuario. Mientras llega la librería, se ve la inicial. */
export function Avatar({ semilla, cfg, className }: { semilla: string; cfg?: ConfigAvatar | null; className?: string }) {
  const listos = useApp((s) => s.avataresListos);
  useEffect(() => {
    if (!listos) cargarAvatares().then(() => useApp.setState({ avataresListos: true })).catch((e) => console.error(e));
  }, [listos]);
  const svg = listos ? svgAvatar(semilla, cfg) : null;
  if (svg) return <span className={cx(BASE, className)} aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} />;
  const k = String(semilla || "").replace(/^@/, "");
  return <span className={cx(BASE, "bg-wash text-caption font-medium text-indigo", className)} aria-hidden="true">{(k[0] || "?").toUpperCase()}</span>;
}

// El avatar del usuario que ha entrado
export function MiAvatar({ className }: { className?: string }) {
  const perfil = useApp((s) => s.perfil), id = useApp((s) => s.usuario?.id), cfg = useApp((s) => s.avatar);
  return <Avatar semilla={perfil || id || ""} cfg={cfg} className={className} />;
}
