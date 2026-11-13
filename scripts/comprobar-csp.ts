/* Comprobación de seguridad tras `npm run build`:
   cada <script> en línea de out/*.html tiene que estar permitido por su sha256 en la CSP de vercel.json.
   Si no, el navegador lo bloquearía en producción; mejor que falle aquí. Los <script type="application/json"> no se ejecutan y no cuentan. */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const raiz = path.join(import.meta.dirname, "..");
const vercel = JSON.parse(fs.readFileSync(path.join(raiz, "vercel.json"), "utf8"));
const csp: string = vercel.headers.flatMap((h: { headers: { key: string; value: string }[] }) => h.headers).find((h: { key: string }) => h.key === "Content-Security-Policy")?.value || "";
const permitidos = new Set(csp.match(/'sha256-[^']+'/g)?.map((x) => x.slice(1, -1)) || []);

let fallos = 0;
for (const archivo of fs.readdirSync(path.join(raiz, "out")).filter((f) => f.endsWith(".html"))) {
  const html = fs.readFileSync(path.join(raiz, "out", archivo), "utf8");
  for (const [, attrs, cuerpo] of html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (/type="application\/(ld\+)?json"/.test(attrs) || !cuerpo.trim()) continue;
    const hash = "sha256-" + createHash("sha256").update(cuerpo).digest("base64");
    if (!permitidos.has(hash)) { fallos++; console.error(`✗ ${archivo}: script en línea no permitido por la CSP ('${hash}'):\n  ${cuerpo.slice(0, 120)}…`); }
  }
}
if (fallos) { console.error("\nAñade esos hashes a script-src en vercel.json (o quita los scripts en línea)."); process.exit(1); }
console.log("✓ CSP: todos los scripts en línea están permitidos en vercel.json");
