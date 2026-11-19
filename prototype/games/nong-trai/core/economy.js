// Bán hàng, nâng kho, nâng trang trí, lưới an toàn. Chỉ gọi qua apply().
import { ITEM } from "../data/catalog.js?v=m1";
import { WAREHOUSE } from "../data/warehouse.js?v=m1";
import { UPGRADES } from "../data/decor.js?v=m1";
import { CROPS } from "../data/crops.js?v=m1";
import { have, take } from "./inventory.js?v=m1";
import { cropUnlocked } from "./progression.js?v=m1";

export const SAFETY_GIFT = 3, SAFETY_COOLDOWN_MS = 10 * 60_000;
export const sellable = (id) => !!ITEM[id] && ITEM[id].sell > 0;

function pay(s, coins) { s.coins += coins; s.stats.earned += coins; }

/** Bán `n` món `id` (n bỏ trống ⇒ bán hết món đó). Lấy giỏ tràn trước. */
export function sell(s, id, n, events) {
  if (!sellable(id)) return { err: "bad" };
  const owned = have(s, id);
  const q = n === undefined ? owned : n;
  if (!Number.isInteger(q) || q <= 0) return { err: "bad" };
  if (owned < q) return { err: "empty-stock" };
  take(s, id, q);
  const coins = q * ITEM[id].sell;
  pay(s, coins);
  events.push({ type: "sold", count: q, coins, items: { [id]: q } });
  return { ok: true, count: q, coins };
}

function sellBags(s, bags, events) {
  const items = {};
  for (const bag of bags) for (const [id, q] of Object.entries(bag)) if (sellable(id) && q > 0) items[id] = (items[id] || 0) + q;
  let count = 0, coins = 0;
  for (const [id, q] of Object.entries(items)) { take(s, id, q); count += q; coins += q * ITEM[id].sell; }
  if (!count) return { err: "empty-stock" };
  pay(s, coins);
  events.push({ type: "sold", count, coins, items });
  return { ok: true, count, coins };
}
/** Bán hết hàng bán được (kho + giỏ tràn; vật liệu giữ lại). */
export const sellAll = (s, events) => sellBags(s, [s.inv, s.overflow], events);
/** Bán nhanh cả giỏ tràn. */
export function sellOverflow(s, events) {
  const r = sellBags(s, [{ ...s.overflow }], events);
  return r.err ? { err: "basket-empty" } : r;
}

export function nextWarehouse(s) { return WAREHOUSE[s.warehouse + 1] || null; }
export function upgradeWarehouse(s, events) {
  const next = nextWarehouse(s);
  if (!next) return { err: "warehouse-max" };
  if (s.level < next.minLevel) return { err: "warehouse-level" };
  if (s.coins < next.cost) return { err: "coins" };
  for (const [m, q] of Object.entries(next.materials)) if (have(s, m) < q) return { err: "materials" };
  s.coins -= next.cost;
  for (const [m, q] of Object.entries(next.materials)) take(s, m, q);
  s.warehouse++;
  events.push({ type: "warehouseUpgraded", level: s.warehouse, cap: next.cap, cost: next.cost });
  return { ok: true, cap: next.cap };
}

export function upgradeFarm(s, events) {
  const u = UPGRADES[s.upgrade];
  if (!u) return { err: "upgraded" };
  if (s.level < u.level) return { err: "upgrade-level" };
  if (s.coins < u.cost) return { err: "coins" };
  s.coins -= u.cost;
  s.upgrade++;
  events.push({ type: "farmUpgraded", name: u.name });
  return { ok: true, name: u.name };
}

export const cheapestSeed = (s) => Math.min(...CROPS.filter((c) => cropUnlocked(s, c.id)).map((c) => c.seed));
/** Kẹt: không đủ xu mua hạt rẻ nhất, không có hạt tặng, không cây nào đang trồng, không gì bán được. */
export function stuck(s) {
  if (s.coins >= cheapestSeed(s) || s.freeSeeds > 0) return false;
  if (s.plots.some((p) => p.crop)) return false;
  return ![...Object.entries(s.inv), ...Object.entries(s.overflow)].some(([id, q]) => q > 0 && sellable(id));
}
/** Lưới an toàn (DESIGN §2.1): Chị Ba tặng 3 hạt cà rốt, tối đa 1 lần / 10 phút. */
export function safetyNet(s, now, events) {
  if (!stuck(s) || now - s.giftAt < SAFETY_COOLDOWN_MS) return;
  s.freeSeeds = SAFETY_GIFT;
  s.giftAt = now;
  events.push({ type: "gift", seeds: SAFETY_GIFT, crop: "ca-rot" });
}
