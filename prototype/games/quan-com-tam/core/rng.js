// RNG có hạt (mulberry32) lưu ngay trong trạng thái (s.rng) ⇒ cùng hạt + cùng chuỗi action ⇒ cùng kết quả; tải lại không "quay lại" kết quả cũ.
export function next(s) {
  let t = (s.rng = (s.rng + 0x6d2b79f5) >>> 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
export const int = (s, n) => Math.floor(next(s) * n);
export const pick = (s, arr) => arr[int(s, arr.length)];
/** Chọn theo trọng số: items = [{ w, ... }]. */
export function weighted(s, items) {
  const total = items.reduce((a, x) => a + x.w, 0);
  let r = next(s) * total;
  for (const x of items) { if ((r -= x.w) < 0) return x; }
  return items[items.length - 1];
}
