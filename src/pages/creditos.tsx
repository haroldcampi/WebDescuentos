/* Créditos y licencias. El texto completo de la licencia MIT de Blobatar se lee del archivo al compilar (la licencia exige incluirlo). */
import fs from "node:fs";
import path from "node:path";
import { PaginaLegal } from "@/components/PaginaLegal";

export function getStaticProps() {
  return { props: { blobatar: fs.readFileSync(path.join(process.cwd(), "src/lib/vendor/blobatar-LICENSE.txt"), "utf8") } };
}

export default function Creditos({ blobatar }: { blobatar: string }) {
  return <PaginaLegal doc="creditos" extra={
    <section className="mt-8">
      <h2 className="text-lg font-bold text-slate-900">Blobatar — MIT License</h2>
      <pre className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed whitespace-pre-wrap text-slate-700">{blobatar}</pre>
    </section>
  } />;
}
