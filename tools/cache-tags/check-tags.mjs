#!/usr/bin/env node
// Kiểm "quên tăng ?v=" trước khi push.
// server-static.js cache mọi URL có ?v= 1 năm (immutable), nên sửa một file
// mà tag tham chiếu tới nó không đổi => người chơi giữ bản cũ tới 1 năm.
//
// Cách dùng:  node tools/cache-tags/check-tags.mjs [base]   (mặc định base = origin/master)
// Thoát mã 1 nếu có file đã sửa mà còn tham chiếu bằng tag cũ.

import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '../..');
const PROTO = path.join(ROOT, 'prototype');
const base = process.argv[2] || 'origin/master';

const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 << 20 });
const norm = (p) => p.split(path.sep).join('/');

const changed = new Set(
  git('diff', '--name-only', `${base}...HEAD`).split('\n').filter(Boolean)
    .filter((f) => f.startsWith('prototype/') && !f.endsWith('.html')),
);
if (!changed.size) { console.log('Không có file tĩnh nào đổi so với', base); process.exit(0); }

const REF = /([\w./-]+\.(?:m?js|css|webp|png|jpe?g|gif|svg|json|mp3|ogg|wav|m4a|woff2?))\?v=([\w.-]+)/g;
const TPL = /([\w./-]*)\$\{[^}]+\}([\w.-]*)\.(m?js|css|json|webp|png)\?v=([\w.-]+)/g;
const SKIP = new Set(['node_modules', 'test', 'screenshots']);

function* walk(dir) {
  for (const n of readdirSync(dir)) {
    if (SKIP.has(n)) continue;
    const p = path.join(dir, n);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (/\.(html|m?js|css)$/.test(n)) yield p;
  }
}

function resolveRef(refFile, ref) {
  const abs = ref.startsWith('/')
    ? path.join(PROTO, ref)
    : path.resolve(path.dirname(refFile), ref);
  return norm(path.relative(ROOT, abs));
}

const baseCache = new Map();
function baseText(rel) {
  if (!baseCache.has(rel)) {
    let t = null;
    try { t = execFileSync('git', ['show', `${base}:${rel}`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'ignore'] }); } catch { /* file mới */ }
    baseCache.set(rel, t);
  }
  return baseCache.get(rel);
}

const stale = [];
for (const file of walk(PROTO)) {
  const text = readFileSync(file, 'utf8');
  const rel = norm(path.relative(ROOT, file));
  for (const m of text.matchAll(REF)) {
    const target = resolveRef(file, m[1]);
    if (!changed.has(target)) continue;
    const old = baseText(rel);
    if (old && old.includes(m[0])) stale.push({ rel, target, ref: m[0] });
  }
  // Đường dẫn ghép động: `./data/cases/${id}.js?v=t12` ⇒ khớp mọi file cùng thư mục / đuôi đã đổi
  for (const m of text.matchAll(TPL)) {
    const [whole, pre, post, ext] = m;
    const dir = resolveRef(file, (pre || "./") + "x").replace(/x$/, "");
    const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp("^" + esc(dir) + "[^/]+" + esc(post) + "\\." + ext + "$");
    const hits = [...changed].filter((f) => re.test(f));
    if (!hits.length) continue;
    const old = baseText(rel);
    if (old && old.includes(whole)) stale.push({ rel, target: hits.join(", "), ref: whole });
  }
}

if (!stale.length) {
  console.log(`OK: ${changed.size} file tĩnh đổi, mọi tham chiếu ?v= tới chúng đã đổi tag.`);
  process.exit(0);
}
console.log(`LỖI: ${stale.length} tham chiếu còn tag cũ (file đã sửa nhưng ?v= không đổi):`);
for (const s of stale) console.log(`  ${s.rel}  →  ${s.ref}   (sửa: ${s.target})`);
process.exit(1);
