// Sinh data/case-meta.js: tên / số / câu dẫn của từng vụ có file, để bản đồ vẽ thẻ vụ mà KHÔNG phải tải file vụ (70–90 KB mỗi vụ).
// Game chỉ nạp file vụ khi người chơi mở vụ đó (PERF-03). Chạy lại sau khi thêm / sửa tên hay câu dẫn vụ:
//   node prototype/games/tham-tu-hem/tools/gen-case-meta.mjs
// test/validate.test.mjs kiểm data/case-meta.js khớp file vụ (quên chạy thì test báo).
import { writeFileSync, existsSync } from "node:fs";
import { CASES } from "../data/cases/index.js";

export async function buildMeta() {
  const out = {};
  for (const e of CASES) {
    const url = new URL(`../data/cases/${e.id}.js`, import.meta.url);
    if (!existsSync(url)) continue;
    const c = (await import(url.href)).default;
    out[e.id] = { title: c.title || e.title, no: c.no ?? e.no, tagline: c.tagline || "" };
  }
  return out;
}
export const render = (meta) => "// SINH TỰ ĐỘNG bởi tools/gen-case-meta.mjs, đừng sửa tay. Tên / số / câu dẫn từng vụ cho thẻ bản đồ (file vụ chỉ nạp khi mở vụ).\n"
  + "export const CASE_META = " + JSON.stringify(meta, null, 2) + ";\n";

if (import.meta.main) {
  writeFileSync(new URL("../data/case-meta.js", import.meta.url), render(await buildMeta()));
  console.log("Đã ghi data/case-meta.js");
}
