// Đổi <link> Google Fonts trong các trang HTML dưới prototype/ sang font tự host prototype/assets/fonts/fonts.css (PERF-05).
// Mặc định CHỈ IN DIFF (dry-run), không ghi gì. Ghi thật: thêm --apply.
//   node tools/fonts/use-local-fonts.mjs                       # xem trước mọi trang
//   node tools/fonts/use-local-fonts.mjs --apply               # ghi mọi trang
//   node tools/fonts/use-local-fonts.mjs --only games/2048,games/sudoku --apply   # chỉ các thư mục / file khớp
//   node tools/fonts/use-local-fonts.mjs --skip games/tiem-tra-sua                 # bỏ qua thư mục / file khớp
// Việc làm trên mỗi file: bỏ 2 thẻ preconnect fonts.googleapis.com / fonts.gstatic.com, thay thẻ stylesheet css2?family=… bằng
// <link rel="stylesheet" href="<đường tương đối>/assets/fonts/fonts.css?v=VER" />. File không có Google Fonts thì để nguyên.
// Lưu ý: fonts.css có Be Vietnam Pro 500–800 + Roboto Slab 700–800; trang nào xin họ / độ đậm khác sẽ được báo ra (cần xem tay).
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, dirname, sep } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "../..");
const PROTO = join(REPO, "prototype");
const FONTS_CSS = join(PROTO, "assets", "fonts", "fonts.css");
const VER = "f1";
const AVAILABLE = { "Be Vietnam Pro": [500, 600, 700, 800], "Roboto Slab": [700, 800] };

const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf("--" + k); return i >= 0 ? argv[i + 1] : ""; };
const APPLY = argv.includes("--apply");
const ONLY = opt("only").split(",").filter(Boolean);
const SKIP = opt("skip").split(",").filter(Boolean);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out); else if (name.endsWith(".html")) out.push(p);
  }
  return out;
}

const PRECONNECT = /^[ \t]*<link\b(?=[^>]*\brel=["']preconnect["'])(?=[^>]*\bhref=["']https:\/\/fonts\.(?:googleapis|gstatic)\.com\/?["'])[^>]*>[ \t]*\r?\n/gim;
const SHEET = /<link\b(?=[^>]*\bhref=["'](https:\/\/fonts\.googleapis\.com\/css2\?[^"']+)["'])[^>]*>/gi;

function check(url, rel) {
  const warn = [];
  for (const fam of new URL(url).searchParams.getAll("family")) {
    const [name, spec = ""] = fam.split(":");
    const have = AVAILABLE[name];
    if (!have) { warn.push(`${rel}: họ font "${name}" không có trong fonts.css`); continue; }
    const ws = (/wght@([\d;]+)/.exec(spec)?.[1] || "400").split(";").map(Number);
    const miss = ws.filter((w) => !have.includes(w));
    if (miss.length) warn.push(`${rel}: ${name} độ đậm ${miss.join(", ")} không có trong fonts.css (trình duyệt dùng độ gần nhất)`);
  }
  return warn;
}

function rewrite(text, file) {
  const rel = relative(PROTO, file).split(sep).join("/");
  const href = relative(dirname(file), FONTS_CSS).split(sep).join("/") + "?v=" + VER;
  const warns = [];
  let n = 0;
  let out = text.replace(SHEET, (_m, url) => { n++; warns.push(...check(url, rel)); return `<link rel="stylesheet" href="${href}" />`; });
  if (!n) return null;
  out = out.replace(PRECONNECT, "");
  return { out, href, warns };
}

function diff(a, b) {
  const A = a.split("\n"), B = b.split("\n"), lines = [];
  let i = 0, j = 0;
  while (i < A.length || j < B.length) {
    if (A[i] === B[j]) { i++; j++; continue; }
    // tìm điểm khớp lại gần nhất (file chỉ đổi vài dòng liền nhau)
    let k = 1, done = false;
    for (; k < 8 && !done; k++) for (let x = 0; x <= k; x++) {
      if (A[i + x] !== undefined && A[i + x] === B[j + k - x]) {
        for (let y = 0; y < x; y++) lines.push(`  ${i + y + 1} - ${A[i + y].trim()}`);
        for (let y = 0; y < k - x; y++) lines.push(`  ${i + x + 1} + ${B[j + y].trim()}`);
        i += x; j += k - x; done = true; break;
      }
    }
    if (!done) { if (i < A.length) lines.push(`  ${i + 1} - ${A[i++].trim()}`); if (j < B.length) lines.push(`  ${i} + ${B[j++].trim()}`); }
  }
  return lines;
}

const files = walk(PROTO).filter((f) => {
  const rel = relative(PROTO, f).split(sep).join("/");
  if (ONLY.length && !ONLY.some((o) => rel === o || rel.startsWith(o.replace(/\/?$/, "/")))) return false;
  if (SKIP.some((s) => rel === s || rel.startsWith(s.replace(/\/?$/, "/")))) return false;
  return true;
});

let changed = 0;
const allWarns = [];
for (const f of files) {
  const text = readFileSync(f, "utf8");
  const r = rewrite(text, f);
  if (!r) continue;
  changed++;
  allWarns.push(...r.warns);
  console.log(`\n${relative(REPO, f).split(sep).join("/")}  →  ${r.href}`);
  for (const l of diff(text, r.out)) console.log(l);
  if (APPLY) writeFileSync(f, r.out);
}
console.log(`\n${changed} file ${APPLY ? "ĐÃ ghi" : "sẽ đổi (dry-run — thêm --apply để ghi)"}.`);
if (allWarns.length) { console.log("\nCần xem tay:"); for (const w of allWarns) console.log("  - " + w); }
console.log("\nNgoài HTML: prototype/games/_shared/share.js tự chèn link Google Fonts khi vẽ ảnh khoe kết quả — đổi tay nếu muốn bỏ hẳn Google Fonts.");
