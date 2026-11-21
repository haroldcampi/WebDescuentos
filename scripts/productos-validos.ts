/*
  LISTA DE PRODUCTOS VÁLIDOS -> migración de Supabase

  La base de datos solo admite votos y comentarios de productos que estén en la tabla public.productos_validos.
  Este script lee el catálogo (src/data/productos.ts) y genera una migración que deja esa tabla igual que el catálogo:
  añade los productos nuevos y quita los que ya no existen (sus votos y comentarios antiguos se conservan).

  Uso:
     npm run productos-validos
  Después aplica la migración generada: `supabase db push`, o pega el archivo en Supabase > SQL Editor.
  `npm run importar` lo ejecuta solo al terminar.
*/
import fs from "node:fs";
import path from "node:path";

const raiz = path.join(import.meta.dirname, "..");
const ID_OK = /^[A-Za-z0-9_-]{1,64}$/;

export function escribirMigracionProductos(ids: string[]): string {
  const validos = [...new Set(ids)].filter((id) => ID_OK.test(id)).sort();
  const descartados = [...new Set(ids)].filter((id) => !ID_OK.test(id));
  if (descartados.length) console.warn(`Aviso: ${descartados.length} identificadores no cumplen el formato (letras, números, - y _; máximo 64) y no admitirán votos: ${descartados.slice(0, 5).join(", ")}`);
  if (!validos.length) throw new Error("El catálogo no tiene ningún identificador válido: no se genera la migración.");
  // Los identificadores solo llevan letras, números, - y _ (comprobado arriba), así que se pueden escribir tal cual en el SQL
  const lista = validos.map((id) => `('${id}')`).join(", ");
  const sql = `-- Generado por scripts/productos-validos.ts el ${new Date().toISOString()}
-- Deja public.productos_validos igual que el catálogo de la web (${validos.length} productos).
insert into public.productos_validos (id) values
  ${lista}
on conflict (id) do nothing;
delete from public.productos_validos where id not in (select v.id from (values ${lista}) as v(id));
`;
  const marca = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
  const archivo = path.join(raiz, "supabase", "migrations", `${marca}_productos_validos.sql`);
  fs.writeFileSync(archivo, sql);
  return archivo;
}

if (import.meta.main) {
  const { PRODUCTOS } = await import("../src/data/productos.ts");
  const archivo = escribirMigracionProductos(PRODUCTOS.map((p) => p.id));
  console.log(`Listo: ${path.relative(raiz, archivo)}\nAplícala con \`supabase db push\` o pegándola en Supabase > SQL Editor.`);
}
