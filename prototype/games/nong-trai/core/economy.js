// Bán hàng, nâng trang trí, lưới an toàn. Chỉ gọi qua apply(). (Nâng kho: Nhà kho là công trình — startUpgrade nha-kho, core/construct.js.)
// Giá bán: MỘT nguồn — core/market.js priceOf(id, now) (±15 % theo chu kỳ 3 giờ). Đơn hàng giữ thưởng cố định riêng.
import { ITEM } from "../data/catalog.js?v=m10";
import { UPGRADES } from "../data/decor.js?v=m10";
import { CROPS } from "../data/crops.js?v=m10";
import { have, take } from "./inventory.js?v=m10";
import { MARKET } from "./market.js?v=m10";
import { cropUnlocked } from "./progression.js?v=m10";
import * as fair from "./fair.js?v=m10";

export const SAFETY_GIFT = 3, SAFETY_COOLDOWN_MS = 10 * 60_000;
export const sellable = (id) => !!ITEM[id] && ITEM[id].sell > 0;
/** Giá bán lúc now (giá chợ, chưa tính Phiên chợ — xem salePrice). */
export const priceOf = (id, now) => MARKET.priceOf(id, now);
/** Giá bán món kế tiếp cho người chơi s lúc now: giá chợ, hoặc giá Phiên chợ khi đang có phiên (Milestone 6, core/fair.js). */
export const salePrice = (s, id, now) => fair.unitPrice(s, id, now);
/** Có món thành phẩm đang ↑ trong danh sách bán ⇒ cho nhiệm vụ "bán khi giá lên". */
const productUp = (ids, now) => ids.some((id) => ITEM[id]?.cat === "thanh-pham" && MARKET.trend(id, now) === "↑");

function pay(s, coins) { s.coins += coins; s.stats.earned += coins; }

/** Bán `n` món `id` (n bỏ trống ⇒ bán hết món đó). Lấy giỏ tràn trước. */
export function sell(s, id, n, now, events) {
  if (!sellable(id)) return { err: "bad" };
  const owned = have(s, id);
  const q = n === undefined ? owned : n;
  if (!Number.isInteger(q) || q <= 0) return { err: "bad" };
  if (owned < q) return { err: "empty-stock" };
  take(s, id, q);
  const quote = fair.quote(s, id, q, now), coins = quote.coins, price = quote.price;
  fair.commitSale(s, id, quote);
  pay(s, coins);
  events.push({ type: "sold", count: q, coins, items: { [id]: q }, price, productUp: productUp([id], now), fair: quote.fair, hot: quote.hotUnits });
  return { ok: true, count: q, coins };
}

function sellBags(s, bags, now, events) {
  const items = {};
  for (const bag of bags) for (const [id, q] of Object.entries(bag)) if (sellable(id) && q > 0) items[id] = (items[id] || 0) + q;
  let count = 0, coins = 0;
  let fairSale = false;
  for (const [id, q] of Object.entries(items)) {
    take(s, id, q); count += q;
    const quote = fair.quote(s, id, q, now);
    coins += quote.coins; fair.commitSale(s, id, quote); fairSale ||= quote.fair;
  }
  if (!count) return { err: "empty-stock" };
  pay(s, coins);
  events.push({ type: "sold", count, coins, items, productUp: productUp(Object.keys(items), now), fair: fairSale });
  return { ok: true, count, coins };
}
const raw = (bag) => Object.fromEntries(Object.entries(bag).filter(([id]) => ITEM[id]?.cat === "nong-san"));
/** "Bán hết nông sản": chỉ nông sản thô (kho + giỏ tràn). Thành phẩm / trứng sữa giữ lại cho đơn — bán từng món ở Nhà kho / Khu chợ. */
export const sellAll = (s, now, events) => sellBags(s, [raw(s.inv), raw(s.overflow)], now, events);
/** Bán nhanh cả giỏ tràn. */
export function sellOverflow(s, now, events) {
  const r = sellBags(s, [{ ...s.overflow }], now, events);
  return r.err ? { err: "basket-empty" } : r;
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
/** Vật nuôi còn đường ra hàng (Milestone 4): có con đang làm trứng / sữa hoặc đã chín chờ thu (fedAt có giá trị),
 *  hoặc có con đói mà kho còn thức ăn để cho ăn. Không có s.animals (save cũ) ⇒ false. */
export function animalsBusy(s) {
  const list = Array.isArray(s.animals?.list) ? s.animals.list : [];
  if (!list.length) return false;
  if (list.some((a) => a && Number.isFinite(a.fedAt) && Number.isFinite(a.readyAt))) return true; // đang làm / chờ thu
  return have(s, "thuc-an-gia-suc") > 0; // đói nhưng còn thức ăn ⇒ cho ăn được
}
/** Kẹt: không đủ xu mua hạt rẻ nhất, không có hạt tặng, không cây nào đang trồng, không vật nuôi sắp ra hàng, không gì bán được. */
export function stuck(s) {
  if (s.coins >= cheapestSeed(s) || s.freeSeeds > 0) return false;
  if (s.plots.some((p) => p.crop)) return false;
  if (Object.values(s.production?.machines || {}).some((m) => m.queue.length)) return false; // máy còn hàng sẽ ra
  if (animalsBusy(s)) return false; // gà / bò sắp có trứng / sữa, hoặc còn thức ăn để cho ăn
  return ![...Object.entries(s.inv), ...Object.entries(s.overflow)].some(([id, q]) => q > 0 && sellable(id));
}
/** Lưới an toàn (DESIGN §2.1): Chị Ba tặng 3 hạt cà rốt, tối đa 1 lần / 10 phút. */
export function safetyNet(s, now, events) {
  if (!stuck(s) || now - s.giftAt < SAFETY_COOLDOWN_MS) return;
  s.freeSeeds = SAFETY_GIFT;
  s.giftAt = now;
  events.push({ type: "gift", seeds: SAFETY_GIFT, crop: "ca-rot" });
}
