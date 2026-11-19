// Bảng đơn hàng: sinh đơn (chỉ món đã mở, số lượng theo sản lượng thật), giao (id + revision, không trừ trước khi giao),
// bỏ đơn (đơn mới sau 2 phút theo mốc thời gian), đơn đặc biệt có hạn. Chỉ gọi qua apply().
//
// s.orders = { nextId, slots: [{ rev, order | null, refillAt }], special: { rev, order | null, refillAt } | null }
// order = { id, type, npc, items: { id: qty }, mult, coins, xp, materials: { id: qty }, createdAt, expiresAt | null }
import { CROP, CROPS } from "../data/crops.js?v=m1";
import { ITEM, MATERIALS } from "../data/catalog.js?v=m1";
import { ORDER_TYPES, CANCEL_REFILL_MS, SPECIAL_COOLDOWN_MS, COMBO_CHANCE, COMBO_MAX } from "../data/orders.js?v=m1";
import { featureLevel } from "../data/levels.js?v=m1";
import { cropUnlocked, orderSlotCount, addXp } from "./progression.js?v=m1";
import { have, take, add } from "./inventory.js?v=m1";
import { rand, randInt, pick, sample } from "./rng.js?v=m1";

export const COMBO_LEVEL = featureLevel("orders-combo"), SPECIAL_LEVEL = featureLevel("orders-special");

/** Món có thể yêu cầu trong đơn: nông sản đã mở (thành phẩm / trứng sữa khi có máy, chuồng — Milestone 2+). */
export const orderableItems = (s) => CROPS.filter((c) => cropUnlocked(s, c.id)).map((c) => c.id);

/** "Một vụ" của món theo ruộng thật: số ô đang mở × hệ số theo thời gian lớn (cây nhanh đòi nhiều hơn). */
export function cropUnit(s, id) {
  const open = s.plots.filter((p) => p.open).length;
  const g = CROP[id]?.growMs ?? 300_000;
  const f = g <= 60_000 ? 0.5 : g <= 180_000 ? 0.35 : 0.25;
  return Math.max(1, Math.min(12, Math.round(open * f)));
}
const itemXp = (id) => (CROP[id] ? Math.max(1, Math.round(CROP[id].xp / 2)) : Math.max(1, Math.round((ITEM[id]?.sell || 12) / 12)));
/** Giá trị chợ, thưởng xu, XP của đơn — tính lại từ món + hệ số (không tin số lưu). */
export function priceOrder(order) {
  const entries = Object.entries(order.items);
  const value = entries.reduce((n, [id, q]) => n + ITEM[id].sell * q, 0);
  const xpBase = entries.reduce((n, [id, q]) => n + itemXp(id) * q, 0);
  return { value, coins: Math.ceil(value * order.mult - 1e-9), xp: Math.ceil(xpBase * ORDER_TYPES[order.type].xpMult - 1e-9) };
}

function build(s, type, npc, items, mult, materials, now) {
  const T = ORDER_TYPES[type];
  const order = { id: s.orders.nextId++, type, npc, items, mult, coins: 0, xp: 0, materials,
    createdAt: now, expiresAt: T.durationMs ? now + T.durationMs : null };
  const { coins, xp } = priceOrder(order);
  order.coins = coins; order.xp = xp;
  return order;
}

/** Sinh một đơn loại `type`. Không đủ món cho loại đó ⇒ null. */
export function generate(s, type, now) {
  const T = ORDER_TYPES[type];
  const pool = orderableItems(s);
  const minKinds = type === "ket-hop" ? 3 : 1;
  if (pool.length < minKinds) return null;
  const busy = new Set(allOrders(s).map((o) => Object.keys(o.items).sort().join()));
  let items;
  for (let attempt = 0; attempt < 4; attempt++) {
    const k = Math.min(pool.length, randInt(s, T.items[0], T.items[1]));
    const scale = type === "thuong" && k > 1 ? 0.7 : 1;
    items = {};
    for (const id of sample(s, pool, k)) {
      const u = cropUnit(s, id);
      const lo = Math.max(1, Math.ceil(u * T.qty[0] * scale)), hi = Math.max(lo, Math.round(u * T.qty[1] * scale));
      items[id] = randInt(s, lo, hi);
    }
    if (!busy.has(Object.keys(items).sort().join())) break; // tránh hai đơn cùng bộ món
  }
  const mult = Math.round((T.mult[0] + (T.mult[1] - T.mult[0]) * rand(s)) * 100) / 100;
  const materials = {};
  if (T.materials) {
    for (const id of sample(s, MATERIALS, randInt(s, T.materials.kinds[0], T.materials.kinds[1]))) materials[id] = randInt(s, T.materials.qty[0], T.materials.qty[1]);
  }
  return build(s, type, pick(s, T.npcs), items, mult, materials, now);
}

/** Đơn cho ô thường: từ cấp mở đơn kết hợp, đôi khi là đơn kết hợp. */
function generateRegular(s, now) {
  const combos = s.orders.slots.filter((x) => x.order?.type === "ket-hop").length;
  if (s.level >= COMBO_LEVEL && combos < COMBO_MAX && rand(s) < COMBO_CHANCE) {
    const combo = generate(s, "ket-hop", now);
    if (combo) return combo;
  }
  return generate(s, "thuong", now);
}

export const allOrders = (s) => [...s.orders.slots.map((x) => x.order), s.orders.special?.order].filter(Boolean);
const slotOf = (s, slot) => (slot === "special" ? s.orders.special : Number.isInteger(slot) ? s.orders.slots[slot] : null);

/** Đồng bộ bảng đơn theo thời gian: thêm ô khi lên cấp, lấp ô trống đã tới giờ, hết hạn đơn đặc biệt. */
export function sync(s, now, events) {
  const n = orderSlotCount(s.level);
  while (s.orders.slots.length < n) s.orders.slots.push({ rev: 0, order: null, refillAt: now });
  s.orders.slots.forEach((x, slot) => {
    if (x.order || x.refillAt > now) return;
    const order = generateRegular(s, now);
    if (!order) return;
    x.order = order; x.rev++;
    events.push({ type: "orderNew", slot, id: order.id, orderType: order.type });
  });
  if (s.level < SPECIAL_LEVEL) return;
  if (!s.orders.special) s.orders.special = { rev: 0, order: null, refillAt: now };
  const sp = s.orders.special;
  if (sp.order && now >= sp.order.expiresAt) {
    events.push({ type: "orderExpired", slot: "special", id: sp.order.id });
    sp.refillAt = sp.order.expiresAt + SPECIAL_COOLDOWN_MS; sp.order = null; sp.rev++;
  }
  if (!sp.order && sp.refillAt <= now) {
    const order = generate(s, "dac-biet", now);
    if (order) { sp.order = order; sp.rev++; events.push({ type: "orderNew", slot: "special", id: order.id, orderType: order.type }); }
  }
}

function check(s, slot, id, rev, now) {
  const x = slotOf(s, slot);
  if (!x || !x.order || x.order.id !== id || x.rev !== rev) return { err: "order-changed" };
  if (x.order.expiresAt !== null && now >= x.order.expiresAt) return { err: "order-expired" };
  return { x };
}

/** Giao đơn: kiểm đủ hàng rồi mới trừ. id + rev phải khớp ⇒ bấm 2 lần / 2 tab không giao trùng. */
export function deliver(s, slot, id, rev, now, events) {
  const c = check(s, slot, id, rev, now);
  if (c.err) return c;
  const { x } = c, order = x.order;
  for (const [item, q] of Object.entries(order.items)) if (have(s, item) < q) return { err: "order-stock" };
  for (const [item, q] of Object.entries(order.items)) take(s, item, q);
  s.coins += order.coins;
  s.stats.earned += order.coins;
  s.stats.delivered++;
  for (const [m, q] of Object.entries(order.materials)) add(s, m, q);
  events.push({ type: "delivered", slot, id: order.id, orderType: order.type, npc: order.npc, coins: order.coins, xp: order.xp, materials: { ...order.materials } });
  x.rev++;
  if (slot === "special") { x.order = null; x.refillAt = now + SPECIAL_COOLDOWN_MS; }
  else {
    x.order = generateRegular(s, now);
    if (x.order) events.push({ type: "orderNew", slot, id: x.order.id, orderType: x.order.type });
    else x.refillAt = now;
  }
  addXp(s, order.xp, events);
  return { ok: true, coins: order.coins, xp: order.xp };
}

/** Bỏ đơn: ô trống, đơn mới sau 2 phút (đơn đặc biệt: sau thời gian chờ). Không mất gì. */
export function cancel(s, slot, id, rev, now, events) {
  const c = check(s, slot, id, rev, now);
  if (c.err) return c;
  const { x } = c;
  events.push({ type: "orderCancelled", slot, id });
  x.order = null; x.rev++;
  x.refillAt = now + (slot === "special" ? SPECIAL_COOLDOWN_MS : CANCEL_REFILL_MS);
  return { ok: true, refillAt: x.refillAt };
}

/** Dữ liệu hiển thị bảng đơn: có / cần từng món, đủ hàng chưa. */
export function boardView(s) {
  const one = (x, slot) => {
    if (!x.order) return { slot, rev: x.rev, order: null, refillAt: x.refillAt };
    const items = Object.entries(x.order.items).map(([id, need]) => ({ id, need, have: Math.min(need, have(s, id)), owned: have(s, id) }));
    return { slot, rev: x.rev, order: x.order, items, ready: items.every((it) => it.owned >= it.need) };
  };
  return { slots: s.orders.slots.map(one), special: s.orders.special ? one(s.orders.special, "special") : null };
}
/** Tổng số mỗi món mà các đơn đang cần (để kho nhắc "đơn đang cần"). */
export function demand(s) {
  const out = {};
  for (const o of allOrders(s)) for (const [id, q] of Object.entries(o.items)) out[id] = (out[id] || 0) + q;
  return out;
}
