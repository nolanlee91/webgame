// Ngẫu nhiên có seed lưu trong trạng thái (mulberry32) ⇒ sinh đơn / rơi vật liệu tất định, test được, không đổi khi tải lại.
export function rand(s) {
  let t = (s.seed = (s.seed + 0x6d2b79f5) >>> 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
/** Số nguyên trong [lo, hi]. */
export const randInt = (s, lo, hi) => lo + Math.floor(rand(s) * (hi - lo + 1));
export const pick = (s, list) => list[Math.floor(rand(s) * list.length)];
/** Lấy k phần tử khác nhau. */
export function sample(s, list, k) {
  const pool = list.slice(), out = [];
  while (out.length < k && pool.length) out.push(pool.splice(Math.floor(rand(s) * pool.length), 1)[0]);
  return out;
}
