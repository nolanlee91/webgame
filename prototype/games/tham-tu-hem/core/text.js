// Chữ trong vụ án: tách [[từ khoá]] để hiển thị, RNG có hạt (lưu trong state), chọn câu không lặp liên tiếp. Thuần, không DOM.
import { lineOf } from "./validate.js?v=t3";

const SEG_RE = /\[\[([^\]|]+)(?:\|([^\]]*))?\]\]/g;

/** "Em ngủ từ [[9h-toi|9 giờ]]" ⇒ [{t:"text",v:"Em ngủ từ "},{t:"word",id:"9h-toi",v:"9 giờ"}]. Từ khoá lạ hiện chữ thô (không làm vỡ). */
export function segments(text, words = {}) {
  const s = String(text ?? ""), out = [];
  let last = 0;
  for (const m of s.matchAll(SEG_RE)) {
    if (m.index > last) out.push({ t: "text", v: s.slice(last, m.index) });
    const id = m[1], w = words[id];
    out.push(w ? { t: "word", id, v: m[2] ?? w.text } : { t: "text", v: m[2] ?? id });
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push({ t: "text", v: s.slice(last) });
  return out;
}
/** Chữ thuần (bỏ dấu [[ ]]). */
export const plain = (text, words) => segments(text, words).map((x) => x.v).join("");

/** Chuẩn hoá một dòng thoại về { who, text, mood }. */
export const norm = (l) => { const x = lineOf(l); return { who: x.who || "narr", text: String(x.text ?? ""), mood: x.mood || "neutral" }; };

// ---- RNG mulberry32, hạt nằm trong state (s.rng) để tải lại vẫn ra cùng câu
export function rngNext(seed) {
  let t = (seed + 0x6d2b79f5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return { seed: (seed + 0x6d2b79f5) >>> 0, r: ((t ^ (t >>> 14)) >>> 0) / 4294967296 };
}

/** Chọn một phần tử của `pool` theo khoá `key`, không trùng lần chọn trước của cùng khoá. Đổi s.rng và s.pick (s là bản nháp). */
export function pickFrom(s, key, pool) {
  if (!pool?.length) return undefined;
  if (pool.length === 1) { s.pick[key] = 0; return pool[0]; }
  const { seed, r } = rngNext(s.rng >>> 0);
  s.rng = seed;
  const last = s.pick[key];
  let i = Math.floor(r * (pool.length - (last == null ? 0 : 1)));
  if (last != null && i >= last) i++;
  s.pick[key] = i;
  return pool[i];
}
