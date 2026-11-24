// Phiên chợ (Milestone 6) — luật thuần, không DOM. Giờ phiên + hàng săn suy ra từ thời gian (data/fair.js); trạng thái lưu duy nhất
// là s.fair = { day, sold: { id: số hàng săn đã bán trong phiên của ngày `day` } } (save v7). Mọi chỗ bán (Nhà kho, giỏ tràn, Khu chợ,
// bộ mô phỏng) tính tiền qua quote() rồi ghi commitSale() ⇒ một nguồn giá.
import { ITEMS, ITEM } from "../data/catalog.js?v=m7";
import { featureLevel } from "../data/levels.js?v=m7";
import { FAIR_DURATION_MS, FAIR_TZ_MS, FAIR_FIRST_MIN, FAIR_SLOTS, FAIR_SLOT_MIN, FAIR_GOODS_MULT, FAIR_HOT_MULT, FAIR_HOT_CAP, FAIR_HOT_COUNT } from "../data/fair.js?v=m7";
import { MARKET } from "./market.js?v=m7";

export const FAIR_LEVEL = featureLevel("fair");
const DAY = 24 * 3600_000;
export const dayOf = (now) => Math.floor((now + FAIR_TZ_MS) / DAY);

function hash(key) {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return h >>> 0;
}
const sellable = (it) => it.sell > 0;
/** Hàng săn có thể chọn: nông sản; chăn nuôi + thành phẩm (trừ thức ăn gia súc — món phụ). */
export const HOT_CROPS = ITEMS.filter((it) => it.cat === "nong-san" && sellable(it)).map((it) => it.id);
export const HOT_GOODS = ITEMS.filter((it) => (it.cat === "chan-nuoi" || it.cat === "thanh-pham") && it.id !== "thuc-an-gia-suc" && sellable(it)).map((it) => it.id);
export const hotEligible = (id) => HOT_CROPS.includes(id) || HOT_GOODS.includes(id);

function pickN(list, n, seed) {
  const pool = [...list], out = [];
  for (let k = 0; k < n && pool.length; k++) out.push(pool.splice(hash(seed + ":" + k) % pool.length, 1)[0]);
  return out;
}
/** Phiên của ngày `day`: giờ bắt đầu / kết thúc (ms) + 3 hàng săn. */
export function fairOfDay(day) {
  const slot = hash("phien-cho@" + day) % FAIR_SLOTS;
  const startAt = day * DAY - FAIR_TZ_MS + (FAIR_FIRST_MIN + slot * FAIR_SLOT_MIN) * 60_000;
  const hot = [...pickN(HOT_CROPS, FAIR_HOT_COUNT.crop, "nong-san@" + day), ...pickN(HOT_GOODS, FAIR_HOT_COUNT.goods, "hang@" + day)];
  return { day, startAt, endAt: startAt + FAIR_DURATION_MS, hot };
}
/** Phiên hôm nay lúc now (có thể đã qua / chưa tới) + active. */
export function fairAt(now) {
  const f = fairOfDay(dayOf(now));
  return { ...f, active: now >= f.startAt && now < f.endAt };
}
/** Phiên đang diễn ra hoặc phiên kế tiếp. */
export function nextFair(now) {
  const f = fairAt(now);
  return now < f.endAt ? f : { ...fairOfDay(f.day + 1), active: false };
}
/** Phiên người chơi được dự (đủ cấp) đang mở lúc now, kèm số hàng săn còn bán giá cao; null ⇒ không có phiên. */
export function activeFair(s, now) {
  if (!(s?.level >= FAIR_LEVEL) || !Number.isFinite(now)) return null;
  const f = fairAt(now);
  if (!f.active) return null;
  const sold = s.fair?.day === f.day ? s.fair.sold || {} : {};
  return { ...f, left: Object.fromEntries(f.hot.map((id) => [id, Math.max(0, FAIR_HOT_CAP - (sold[id] || 0))])) };
}

/** Tiền khi bán n món id lúc now: hàng săn giá ×1,5 cho phần còn trong hạn mức, phần dư giá phiên (thành phẩm) / giá chợ. */
export function quote(s, id, n, now) {
  const base = MARKET.priceOf(id, now);
  if (base === null || !Number.isInteger(n) || n <= 0) return null;
  const f = activeFair(s, now), it = ITEM[id];
  const rest = !f ? base : it.cat === "thanh-pham" ? Math.round(it.sell * FAIR_GOODS_MULT) : base;
  const hotUnits = f && f.hot.includes(id) ? Math.min(n, f.left[id]) : 0;
  const hotPrice = Math.round(it.sell * FAIR_HOT_MULT);
  return { coins: hotUnits * hotPrice + (n - hotUnits) * rest, price: hotUnits ? hotPrice : rest, rest, hotUnits, fair: !!f, day: f ? f.day : null };
}
/** Giá món kế tiếp (hiển thị). null ⇒ không bán được. */
export const unitPrice = (s, id, now) => quote(s, id, 1, now)?.price ?? null;
/** Ghi số hàng săn vừa bán (gọi sau khi bán thành công, với kết quả của quote). */
export function commitSale(s, id, q) {
  if (!q || !q.hotUnits || q.day === null) return;
  if (!s.fair || s.fair.day !== q.day) s.fair = { day: q.day, sold: {} };
  s.fair.sold[id] = (s.fair.sold[id] || 0) + q.hotUnits;
}

export const createFair = () => ({ day: null, sold: {} });
/** Kẹp s.fair từ bản lưu: day số nguyên (không ở tương lai), sold chỉ món hàng săn hợp lệ, 0..FAIR_HOT_CAP. */
export function sanitize(raw, now) {
  const out = createFair();
  if (!raw || typeof raw !== "object" || !Number.isInteger(raw.day)) return out;
  if (Number.isFinite(now) && raw.day > dayOf(now)) return out;
  out.day = raw.day;
  if (raw.sold && typeof raw.sold === "object") for (const [id, n] of Object.entries(raw.sold)) {
    if (hotEligible(id) && Number.isFinite(n)) { const q = Math.min(FAIR_HOT_CAP, Math.max(0, Math.floor(n))); if (q) out.sold[id] = q; }
  }
  return out;
}
