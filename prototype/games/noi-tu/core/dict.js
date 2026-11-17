// Từ điển — chỉ nhận dữ liệu (không tự tải). Mỗi ván ghim contentHash + NORM_VERSION + RULES_VERSION.
import { normalizeWord, firstSyl, syllables, NORM_VERSION } from './normalize.js';

// FNV-1a 64 bit trên UTF-8 của danh sách khóa đã chuẩn hóa + sắp xếp ⇒ cùng nội dung ⇒ cùng hash,
// bất kể thứ tự hay kiểu đặt dấu trong file nguồn. (Không phải chữ ký bảo mật — chỉ để phát hiện lệch bản.)
function fnv1a64(str) {
  let h = 0xcbf29ce484222325n;
  const P = 0x100000001b3n, M = (1n << 64n) - 1n;
  for (const b of new TextEncoder().encode(str)) { h ^= BigInt(b); h = (h * P) & M; }
  return h.toString(16).padStart(16, '0');
}

/** data = { words: string[], rare?: string[] } — rare: từ hợp lệ nhưng bot Dễ không dùng */
export function createDict(data) {
  const rare = new Set((data.rare || []).map(normalizeWord));
  const keys = [...new Set([...(data.words || []), ...(data.rare || [])].map(normalizeWord))]
    .filter((k) => syllables(k).length === 2)
    .sort();
  const set = new Set(keys);
  const byFirst = new Map();
  for (const k of keys) {
    const f = firstSyl(k);
    if (!byFirst.has(f)) byFirst.set(f, []);
    byFirst.get(f).push(k);
  }
  const contentHash = fnv1a64(`n${NORM_VERSION}\n${keys.join('\n')}\n#rare\n${[...rare].sort().join('\n')}`);
  return {
    contentHash,
    size: keys.length,
    has: (k) => set.has(k),
    isCommon: (k) => set.has(k) && !rare.has(k),
    startsWith: (syl) => byFirst.get(syl) || [],
    /** số từ còn dùng được bắt đầu bằng syl, trừ các từ trong used (Set) */
    countNext(syl, used) {
      let n = 0;
      for (const k of byFirst.get(syl) || []) if (!used.has(k)) n++;
      return n;
    },
    all: () => keys,
  };
}
