// Bảng đơn hàng: sinh đơn (chỉ món đã mở, số lượng theo sản lượng thật), giao (id + revision, không trừ trước khi giao),
// bỏ đơn (đơn mới sau 2 phút theo mốc thời gian), đơn đặc biệt có hạn. Chỉ gọi qua apply().
//
// s.orders = { nextId, slots: [{ rev, order | null, refillAt }], special: { rev, order | null, refillAt } | null, special2: … | null }
// Milestone 6: "đơn đặc biệt hai lúc" (cấp 18) = ô thứ hai `special2`, cùng luật với `special` (hạn 2 giờ, chờ 15 phút sau khi giao / hết hạn).
// order = { id, type, npc, items: { id: qty }, mult, coins, xp, materials: { id: qty }, createdAt, expiresAt | null }
import { CROP, CROPS } from "../data/crops.js?v=m15";
import { ITEM, MATERIALS } from "../data/catalog.js?v=m15";
import { ORDER_TYPES, CANCEL_REFILL_MS, SPECIAL_COOLDOWN_MS, COMBO_CHANCE, COMBO_MAX } from "../data/orders.js?v=m15";
import { featureLevel } from "../data/levels.js?v=m15";
import { cropUnlocked, orderSlotCount, addXp } from "./progression.js?v=m15";
import { have, take, add } from "./inventory.js?v=m15";
import { rand, randInt, pick, sample } from "./rng.js?v=m15";
import { RECIPES } from "../data/recipes.js?v=m15";
import { MACHINE } from "../data/machines.js?v=m15";
import { CURRENT_MILESTONE } from "../data/levels.js?v=m15";
import { capacity as queueCap } from "./production.js?v=m15";
import { extraSlots } from "./workshop.js?v=m15";
import { ANIMALS, ANIMAL, LEGACY_KIND } from "../data/animals.js?v=m15";
import { effects as buildEffects } from "./build.js?v=m15";

/** Xu thật nhận khi giao đơn: thưởng của phiếu + danh tiếng Nhà (Milestone 5, +2 % mỗi bậc). Phiếu lưu giá gốc ⇒ nâng Nhà có tác dụng ngay. */
export function orderPayout(s, order, now) {
  const bonus = s?.buildings ? buildEffects(s, now).orderBonus || 0 : 0;
  return Math.round(order.coins * (1 + bonus));
}

export const COMBO_LEVEL = featureLevel("orders-combo"), SPECIAL_LEVEL = featureLevel("orders-special"), SPECIAL2_LEVEL = featureLevel("special-2");
/** Ô đơn đặc biệt (theo thứ tự mở). */
export const SPECIAL_SLOTS = Object.freeze(["special", "special2"]);
export const isSpecialSlot = (slot) => SPECIAL_SLOTS.includes(slot);
/** Số ô đơn đặc biệt theo cấp: 0 · 1 (cấp 11) · 2 (cấp 18). */
export const specialSlotCount = (level) => (level >= SPECIAL2_LEVEL ? 2 : level >= SPECIAL_LEVEL ? 1 : 0);

/** Nông sản có thể yêu cầu trong đơn (đã mở). */
export const orderableCrops = (s) => CROPS.filter((c) => cropUnlocked(s, c.id)).map((c) => c.id);
/**
 * Sản phẩm vật nuôi trang trại sản xuất được (Milestone 4): { "trung-ga": số quả / chu kỳ, sua: ... } — chỉ loại có ≥ 1 con
 * trong s.animals.list. Không có s.animals (save M1–M3) ⇒ {} ⇒ bộ sinh đơn y như cũ (cùng chuỗi ngẫu nhiên).
 * Kind cũ "bo" (trước khi đổi tên) vẫn được hiểu là bò sữa.
 */
export function animalGoods(s) {
  const out = {};
  for (const a of Array.isArray(s?.animals?.list) ? s.animals.list : []) {
    const k = a && typeof a.kind === "string" ? (Object.prototype.hasOwnProperty.call(LEGACY_KIND, a.kind) ? LEGACY_KIND[a.kind] : a.kind) : null;
    const def = k ? ANIMAL[k] : null;
    if (def) out[def.product] = (out[def.product] || 0) + def.qty;
  }
  return out;
}
/** Trứng / sữa có thể yêu cầu trong đơn (thứ tự cố định theo data/animals.js). */
export const orderableAnimalGoods = (s) => { const g = animalGoods(s); return ANIMALS.map((a) => a.product).filter((id) => g[id] > 0); };
/** "Một lứa" trứng / sữa theo đàn thật: số con × sản phẩm mỗi chu kỳ (1 gà ⇒ đơn đòi 1 trứng, 6 gà ⇒ 3–6). */
export const animalUnit = (s, id) => Math.max(1, Math.min(12, animalGoods(s)[id] || 0));
/**
 * Thành phẩm người chơi THẬT SỰ làm được lúc now (DESIGN §2.6): máy đã xây xong, đủ cấp công thức + level máy,
 * và mọi nguyên liệu cũng có được (nông sản đã mở, trứng / sữa khi có gà / bò, hoặc thành phẩm làm được — vd. bột gạo từ lúa).
 * easy=true ⇒ chỉ công thức nhanh (≤ 2 ph) từ nông sản thô (cho đơn thường "món dễ").
 */
export function orderableProducts(s, now, easy = false) {
  const machines = s.production?.machines || {};
  const ok = new Set([...orderableCrops(s), ...orderableAnimalGoods(s)]), out = [];
  for (let pass = 0, grew = true; grew && pass < 4; pass++) {
    grew = false;
    for (const r of RECIPES) {
      const m = machines[r.machine], def = MACHINE[r.machine];
      if (ok.has(r.output) || !m || !(now >= m.readyAt) || def.milestone > CURRENT_MILESTONE) continue;
      if (s.level < r.level || m.level < r.machineLevel) continue;
      if (!Object.keys(r.inputs).every((id) => ok.has(id))) continue;
      if (easy && (r.ms > 120_000 || !Object.keys(r.inputs).every((id) => CROP[id]))) continue;
      ok.add(r.output); out.push(r.output); grew = true;
    }
  }
  return out;
}
/** Món có thể yêu cầu trong đơn (nông sản đã mở + thành phẩm làm được). */
export const orderableItems = (s, now = 0) => [...orderableCrops(s), ...orderableAnimalGoods(s), ...orderableProducts(s, now)];
/** Thành phẩm Bác Tư thích (lò bánh + mứt) — được chọn gấp đôi trong đơn kết hợp. */
const FAVOURITE = (id) => { const r = RECIPES.find((x) => x.output === id); return !!r && (r.machine === "lo-banh" || id === "mut-dau"); };
/** "Một mẻ" thành phẩm theo máy thật: số ô hàng chờ × số món mỗi ô (không đòi 20 bánh khi mới có 1 máy). */
export function productUnit(s, id) {
  const r = RECIPES.find((x) => x.output === id), m = r && s.production?.machines?.[r.machine];
  if (!m) return 1;
  let unit = Math.max(1, Math.min(12, queueCap(m, { extraSlots: extraSlots(s) }) * r.qty));
  // nguyên liệu từ vật nuôi: không đòi quá 1 lứa của đàn hiện có (1 gà ⇒ 1 bánh trứng / 1 bánh bí ngô mỗi đơn)
  const goods = animalGoods(s);
  for (const [id, need] of Object.entries(r.inputs)) {
    if (goods[id] > 0) unit = Math.min(unit, Math.max(1, Math.floor(goods[id] / need)));
  }
  return unit;
}

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
  // Đơn thường: nông sản + thành phẩm "dễ". Đơn kết hợp / đặc biệt: mọi thành phẩm làm được; kết hợp có ≥ 1 thành phẩm (nếu có máy).
  const products = orderableProducts(s, now, type === "thuong");
  const pool = [...orderableCrops(s), ...orderableAnimalGoods(s), ...products];
  const minKinds = type === "ket-hop" ? 3 : 1;
  if (pool.length < minKinds) return null;
  const busy = new Set(allOrders(s).map((o) => Object.keys(o.items).sort().join()));
  let items;
  for (let attempt = 0; attempt < 4; attempt++) {
    const k = Math.min(pool.length, randInt(s, T.items[0], T.items[1]));
    const scale = type === "thuong" && k > 1 ? 0.7 : 1;
    items = {};
    const chosen = sample(s, pool, k);
    if (type === "ket-hop" && products.length && !chosen.some((id) => products.includes(id))) {
      const weighted = products.flatMap((id) => (FAVOURITE(id) ? [id, id] : [id]));
      chosen[chosen.length - 1] = pick(s, weighted);
    }
    for (const id of chosen) {
      const u = CROP[id] ? cropUnit(s, id) : ITEM[id]?.cat === "chan-nuoi" ? animalUnit(s, id) : productUnit(s, id);
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
  let npc = pick(s, T.npcs);
  if (T.npcs.includes("bac-tu") && Object.keys(items).some(FAVOURITE)) npc = "bac-tu"; // Bác Tư đặt đồ lò bánh / mứt
  return build(s, type, npc, items, mult, materials, now);
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

export const allOrders = (s) => [...s.orders.slots.map((x) => x.order), ...SPECIAL_SLOTS.map((k) => s.orders[k]?.order)].filter(Boolean);
const slotOf = (s, slot) => (isSpecialSlot(slot) ? s.orders[slot] || null : Number.isInteger(slot) ? s.orders.slots[slot] : null);

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
  SPECIAL_SLOTS.slice(0, specialSlotCount(s.level)).forEach((key) => {
    if (!s.orders[key]) s.orders[key] = { rev: 0, order: null, refillAt: now };
    const sp = s.orders[key];
    if (sp.order && now >= sp.order.expiresAt) {
      events.push({ type: "orderExpired", slot: key, id: sp.order.id });
      sp.refillAt = sp.order.expiresAt + SPECIAL_COOLDOWN_MS; sp.order = null; sp.rev++;
    }
    if (!sp.order && sp.refillAt <= now) {
      const order = generate(s, "dac-biet", now);
      if (order) { sp.order = order; sp.rev++; events.push({ type: "orderNew", slot: key, id: order.id, orderType: order.type }); }
    }
  });
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
  const coins = orderPayout(s, order, now);
  s.coins += coins;
  s.stats.earned += coins;
  s.stats.delivered++;
  for (const [m, q] of Object.entries(order.materials)) add(s, m, q);
  // items: bản sao món đã giao — nhiệm vụ M4 (core/village.js hasItem) đếm "đơn có trứng / sữa", "đơn kết hợp có bánh"
  events.push({ type: "delivered", slot, id: order.id, orderType: order.type, npc: order.npc, items: { ...order.items }, coins, baseCoins: order.coins, xp: order.xp, materials: { ...order.materials },
    withProduct: Object.keys(order.items).some((it) => ITEM[it]?.cat === "thanh-pham") });
  x.rev++;
  if (isSpecialSlot(slot)) { x.order = null; x.refillAt = now + SPECIAL_COOLDOWN_MS; }
  else {
    x.order = generateRegular(s, now);
    if (x.order) events.push({ type: "orderNew", slot, id: x.order.id, orderType: x.order.type });
    else x.refillAt = now;
  }
  addXp(s, order.xp, events);
  return { ok: true, coins, xp: order.xp };
}

/** Bỏ đơn: ô trống, đơn mới sau 2 phút (đơn đặc biệt: sau thời gian chờ). Không mất gì. */
export function cancel(s, slot, id, rev, now, events) {
  const c = check(s, slot, id, rev, now);
  if (c.err) return c;
  const { x } = c;
  events.push({ type: "orderCancelled", slot, id });
  x.order = null; x.rev++;
  x.refillAt = now + (isSpecialSlot(slot) ? SPECIAL_COOLDOWN_MS : CANCEL_REFILL_MS);
  return { ok: true, refillAt: x.refillAt };
}

/** Dữ liệu hiển thị bảng đơn: có / cần từng món, đủ hàng chưa. */
export function boardView(s) {
  const one = (x, slot) => {
    if (!x.order) return { slot, rev: x.rev, order: null, refillAt: x.refillAt };
    const items = Object.entries(x.order.items).map(([id, need]) => ({ id, need, have: Math.min(need, have(s, id)), owned: have(s, id) }));
    return { slot, rev: x.rev, order: x.order, items, ready: items.every((it) => it.owned >= it.need) };
  };
  return { slots: s.orders.slots.map(one), special: s.orders.special ? one(s.orders.special, "special") : null,
    special2: s.orders.special2 ? one(s.orders.special2, "special2") : null };
}
/** Tổng số mỗi món mà các đơn đang cần (để kho nhắc "đơn đang cần"). */
export function demand(s) {
  const out = {};
  for (const o of allOrders(s)) for (const [id, q] of Object.entries(o.items)) out[id] = (out[id] || 0) + q;
  return out;
}
