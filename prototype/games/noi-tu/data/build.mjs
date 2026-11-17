// Build từ điển: words-src.txt → words.json (đã chuẩn hóa, bỏ trùng, sắp xếp) + in hash và dung lượng gzip THẬT.
// Dừng lại nếu gặp từ trong blocklist.txt hoặc dòng không đúng 2 âm tiết.
// Dùng: node data/build.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { gzipSync, brotliCompressSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { normalizeWord, syllables } from '../core/normalize.js';
import { createDict } from '../core/dict.js';

const here = (f) => fileURLToPath(new URL(f, import.meta.url));
const lines = (f) => readFileSync(here(f), 'utf8').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));

const block = lines('blocklist.txt').map(normalizeWord);
const words = new Set(), rare = new Set(), problems = [];
for (const raw of lines('words-src.txt')) {
  const isRare = raw.startsWith('~');
  const key = normalizeWord(isRare ? raw.slice(1) : raw);
  if (syllables(key).length !== 2) problems.push(`không đủ 2 âm tiết: "${raw}"`);
  const hit = block.find((b) => (` ${key} `).includes(` ${b} `));
  if (hit) problems.push(`từ bị chặn: "${raw}" (${hit})`);
  (isRare ? rare : words).add(key);
}
for (const r of rare) words.delete(r);
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }

const data = { words: [...words].sort(), rare: [...rare].sort() };
const dict = createDict(data);
const json = JSON.stringify({ format: 1, contentHash: dict.contentHash, ...data });
writeFileSync(here('words.json'), json);
const raw = Buffer.byteLength(json), gz = gzipSync(json, { level: 9 }).length, br = brotliCompressSync(json).length;
console.log(JSON.stringify({ words: dict.size, contentHash: dict.contentHash, bytes: raw, gzip: gz, brotli: br,
  gzipPerWord: +(gz / dict.size).toFixed(2) }));
