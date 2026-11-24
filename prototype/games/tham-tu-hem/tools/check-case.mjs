// Kiểm một (hoặc mọi) vụ án: node prototype/games/tham-tu-hem/tools/check-case.mjs [data/cases/<id>.js …]
import { readdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { validateCase } from "../core/validate.js";

const here = dirname(fileURLToPath(import.meta.url));
let files = process.argv.slice(2);
if (!files.length) files = readdirSync(join(here, "../data/cases")).filter((f) => f.endsWith(".js")).map((f) => join(here, "../data/cases", f));
let bad = 0;
for (const f of files) {
  const c = (await import(pathToFileURL(resolve(f)).href)).default;
  const { errors, warns, stats } = validateCase(c);
  console.log(`\n== ${c?.id ?? f} (${c?.title ?? "?"}) — độ khó ${c?.difficulty}`);
  console.log("   " + Object.entries(stats).map(([k, v]) => `${k}=${v}`).join(" "));
  for (const w of warns) console.log("   ⚠ " + w);
  for (const e of errors) console.log("   ✗ " + e);
  console.log(errors.length ? `   ${errors.length} lỗi — CHƯA ĐẠT` : "   0 lỗi — ĐẠT");
  if (errors.length) bad++;
}
process.exit(bad ? 1 : 0);
