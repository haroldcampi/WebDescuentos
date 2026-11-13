/* Estado de toda la web en un solo sitio (zustand): idioma, filtros, comparador, ventanas abiertas,
   votos de la comunidad y la cuenta del usuario. Los componentes leen de aquí con useApp(...). */
import type { User } from "@supabase/supabase-js";
import { create } from "zustand";
import { MAX_COMPARAR, POR_TANDA } from "./config";
import { crearI18n, type Idioma } from "./i18n";
import type { ConfigAvatar, Filtros } from "./tipos";

export type ModoAcceso = "entrar" | "crear" | "olvido" | "nueva" | "usuario" | "ajustes";
export interface Acceso { modo: ModoAcceso; motivo: string; msg: string; ok: boolean; v: number; email?: string }

export const FILTROS_INICIALES: Filtros = { q: "", categoria: "Todas", tiendas: [], orden: "relevancia", grupo: "ninguno", favoritos: false, min: 0, max: 0 };

interface Estado {
  montado: boolean;
  // Hora con la que se calcula el catálogo (ver reloj en catalogo.ts); al cambiar, se vuelve a pintar
  ahora: number;
  lang: Idioma;
  filtros: Filtros;
  visibles: number;
  comparar: string[];
  // Ventanas
  fichaId: string | null;
  comparadorAbierto: boolean;
  alertasAbierto: boolean;
  compartirAbierto: boolean;
  acceso: Acceso | null;
  // Comunidad: puntuación de cada oferta, votos de las últimas 48 h y los votos de este navegador
  votos: { total: Record<string, number>; recientes: Record<string, number>; enTendencia: string[]; mios: Record<string, number> };
  // Cuenta
  usuario: User | null;
  perfil: string | null;
  avatar: ConfigAvatar | null;
  favoritos: Set<string>;
  seguidos: Map<string, number>;
  objetivos: Map<string, number>;
  avataresListos: boolean;
}

export const useApp = create<Estado>(() => ({
  montado: false,
  ahora: 0,
  lang: "es",
  filtros: FILTROS_INICIALES,
  visibles: POR_TANDA,
  comparar: [],
  fichaId: null,
  comparadorAbierto: false,
  alertasAbierto: false,
  compartirAbierto: false,
  acceso: null,
  votos: { total: {}, recientes: {}, enTendencia: [], mios: {} },
  usuario: null,
  perfil: null,
  avatar: null,
  favoritos: new Set(),
  seguidos: new Map(),
  objetivos: new Map(),
  avataresListos: false
}));

const set = useApp.setState, get = useApp.getState;

// Textos en el idioma actual (para usar dentro de componentes)
export function useI18n() {
  const lang = useApp((s) => s.lang);
  return crearI18n(lang);
}
export const i18nActual = () => crearI18n(get().lang);

/* Filtros: cambiar cualquiera vuelve a la primera tanda de productos */
export function cambiarFiltros(cambios: Partial<Filtros>, mantener = false) {
  set((s) => ({ filtros: { ...s.filtros, ...cambios }, visibles: mantener ? s.visibles : POR_TANDA }));
}
export function limpiarFiltros() {
  set({ filtros: FILTROS_INICIALES, visibles: POR_TANDA });
}
export const verMas = () => set((s) => ({ visibles: s.visibles + POR_TANDA }));

/* Comparador: hasta 4 productos; el quinto saca al primero */
export function alternarComparar(id: string) {
  set((s) => {
    if (s.comparar.includes(id)) return { comparar: s.comparar.filter((x) => x !== id) };
    const c = [...s.comparar, id];
    return { comparar: c.length > MAX_COMPARAR ? c.slice(1) : c };
  });
}
export const vaciarComparar = () => set({ comparar: [] });

/* Ventanas */
export const abrirFicha = (id: string) => set({ fichaId: id, comparadorAbierto: false });
export const cerrarFicha = () => set({ fichaId: null });
export const abrirComparador = (v = true) => set({ comparadorAbierto: v });
export const abrirAlertas = (v = true) => set({ alertasAbierto: v });
export const abrirCompartirVentana = (v = true) => set({ compartirAbierto: v });
export function abrirAcceso(modo: ModoAcceso, motivo = "", msg = "", ok = false, email?: string) {
  set((s) => ({ acceso: { modo, motivo, msg, ok, email, v: (s.acceso?.v || 0) + 1 } }));
}
// Cambia el aviso de la ventana de acceso sin reiniciar el resto
export const avisoAcceso = (msg: string, ok = false) => set((s) => (s.acceso ? { acceso: { ...s.acceso, msg, ok, v: s.acceso.v + 1 } } : {}));
export const cerrarAcceso = () => set({ acceso: null });
