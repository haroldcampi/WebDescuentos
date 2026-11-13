/* «Comparte una oferta»: hace falta cuenta. La oferta se guarda como «pendiente» y la revisas antes de publicarla. */
import { pedirCuenta } from "./cuenta";
import { abrirCompartirVentana, useApp } from "./store";
import { sb } from "./supabase";

export function abrirCompartir() {
  if (!sb()) return;
  if (!useApp.getState().usuario) return pedirCuenta("share.reason", abrirCompartir);
  abrirCompartirVentana(true);
}
