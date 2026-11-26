// Khu chợ — luật thuần (DESIGN-2.0 §2.1). Không DOM, không biến toàn cục, mọi hàm nhận `now` (ms).
//
// GIÁ BÁN dao động ±15 % theo chu kỳ 3 giờ, TẤT ĐỊNH từ thời gian: hệ số = hash(id, floor(now / 3h)) ∈ [-1, 1],
//   giá = gốc + trunc(gốc × 0,15 × hệ số) (≥ 1) ⇒ |giá − gốc| ≤ 15 % gốc, cùng `now` ⇒ cùng giá, không lưu gì vào save.
//   Đơn hàng KHÔNG dùng giá này (dùng giá gốc). Giá MUA ở chợ cố định.
// CHỢ BÁN RA: hạt giống (từ danh sách cây truyền vào — mua lúc gieo ở ô đất, `buy` từ chối với "plant-only"),
//   thức ăn gia súc dự phòng, vật liệu, trang trí (data/catalog.js: `buy`, `shopLevel`).
// CHỐNG LỜI VÔ HẠN: assertEconomy() kiểm (1) mọi món chợ bán: giá mua ≥ 1,6 × giá bán lại cao nhất (gốc × 1,15, hoặc giá Phiên chợ);
//   (2) mọi chuỗi chỉ dùng hàng mua ở chợ (công thức Xưởng, vật nuôi ăn thức ăn mua) đều lỗ ở giá chợ cao nhất.
//   Nông sản không tính là "mua được" — hạt giống cần ô đất + thời gian trồng, lời là chủ ý của game.
//
// GIAO DIỆN TIÊM VÀO (giống core/production.js):
//   inv    = { count(id), has(id, n), take(id, n) -> bool, add(id, n) -> { ok, overflow }, canAdd?(id, n) }  (add nguyên tử)
//   wallet = { coins() -> number, spend(n) -> bool, earn(n) }
//   ctx    = { level }

import { ITEMS, ANIMAL_REF } from "../data/catalog.js?v=m14";
import { CROPS } from "../data/crops.js?v=m14";
import { RECIPES } from "../data/recipes.js?v=m14";
import { FAIR_GOODS_MULT, FAIR_HOT_MULT } from "../data/fair.js?v=m14";

export const CYCLE_MS = 3 * 3600_000;
export const SWING = 0.15;
export const RESALE_MIN_RATIO = 1.6;
export const MAX_LOT = 999; // số lượng tối đa mỗi lần mua / bán (chống số khổng lồ)
export const seedId = (cropId) => "hat-" + cropId;

const isCount = (n) => Number.isInteger(n) && n > 0 && n <= MAX_LOT;
export const cycleOf = (now) => Math.floor(now / CYCLE_MS);
export const nextChangeAt = (now) => (cycleOf(now) + 1) * CYCLE_MS;

/** Hệ số tất định ∈ [-1, 1] cho (id, chu kỳ). FNV-1a + trộn bit kiểu murmur. */
export function swing(id, cycle) {
  let h = 0x811c9dc5;
  const key = id + "@" + cycle;
  for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return ((h >>> 0) / 0xffffffff) * 2 - 1;
}

/**
 * Tạo chợ. crops: [{ id, name, seed, sell, level }] (đúng hình dạng CROPS của data/crops.js — truyền vào, không import).
 * Trả object chứa mọi hàm của chợ.
 */
export function createMarket({ crops = CROPS } = {}) {
  const base = Object.create(null);   // id → giá bán gốc (> 0 ⇒ bán được ở chợ)
  const names = Object.create(null);
  for (const c of crops) { base[c.id] = c.sell; names[c.id] = c.name; }
  const cropIds = new Set(crops.map((c) => c.id));
  const GOODS = ITEMS.filter((it) => !cropIds.has(it.id) && it.producer.kind !== "crop");
  for (const g of GOODS) { if (g.sell > 0) base[g.id] = g.sell; names[g.id] = g.name; }

  const shop = [
    ...crops.map((c) => ({ id: seedId(c.id), name: "Hạt " + c.name.toLowerCase(), kind: "seed", crop: c.id, buy: c.seed, level: c.level })),
    ...GOODS.filter((g) => g.buy > 0).map((g) => ({ id: g.id, name: g.name, kind: g.bag === "decor" ? "decor" : g.cat === "vat-lieu" ? "material" : "feed", buy: g.buy, level: g.shopLevel })),
  ];
  const SHOP = Object.assign(Object.create(null), Object.fromEntries(shop.map((s) => [s.id, s])));

  const sellable = (id) => base[id] > 0;
  const basePrice = (id) => (sellable(id) ? base[id] : 0);
  // Milestone 6 — Phiên chợ (core/fair.js): hàng săn ×1,5, thành phẩm ×1,25 ⇒ "bán tối đa" tính cả giá phiên chợ.
  const catOf = Object.create(null);
  for (const it of ITEMS) catOf[it.id] = it.cat;
  const fairMult = (id) => (id !== "thuc-an-gia-suc" && ["nong-san", "chan-nuoi", "thanh-pham"].includes(catOf[id]) ? FAIR_HOT_MULT : catOf[id] === "thanh-pham" ? FAIR_GOODS_MULT : 1);
  const maxSell = (id) => basePrice(id) * Math.max(1 + SWING, fairMult(id));

  function priceAt(id, cycle) {
    if (!sellable(id)) return null;
    const b = base[id];
    return Math.max(1, b + Math.trunc(b * SWING * swing(id, cycle)));
  }
  /** Giá bán ở chợ lúc now (null ⇒ không bán được). */
  const priceOf = (id, now) => priceAt(id, cycleOf(now));
  /** "↑" / "↓" / "·" so với chu kỳ trước. */
  function trend(id, now) {
    const c = cycleOf(now), p = priceAt(id, c), q = priceAt(id, c - 1);
    if (p === null) return "·";
    return p > q ? "↑" : p < q ? "↓" : "·";
  }
  /** Bảng giá hôm nay cho mọi món bán được. */
  const board = (now) => Object.keys(base).map((id) => ({ id, name: names[id], base: base[id], price: priceOf(id, now), trend: trend(id, now) }));

  /** Danh sách chợ bán (đã mở theo ctx.level, hoặc tất cả nếu không truyền ctx). */
  const catalogue = (ctx) => shop.filter((s) => !ctx || ctx.level >= s.level).map((s) => ({ ...s }));

  function sell(inv, wallet, id, n, now) {
    if (!sellable(id) || !Number.isFinite(now)) return { err: "bad" };
    if (!isCount(n)) return { err: "bad-count" };
    if (!inv.has(id, n)) return { err: "empty-stock" };
    const price = priceOf(id, now), coins = price * n;
    if (!inv.take(id, n)) return { err: "empty-stock" };
    wallet.earn(coins);
    return { ok: true, id, count: n, price, coins };
  }

  function buy(inv, wallet, id, n, now, ctx) {
    const s = SHOP[id];
    if (!s || !Number.isFinite(now)) return { err: "bad" };
    if (!isCount(n)) return { err: "bad-count" };
    if (!(ctx?.level >= s.level)) return { err: "locked" };
    if (s.kind === "seed") return { err: "plant-only" }; // hạt mua lúc gieo (action plant của M1)
    const cost = s.buy * n;
    if (!Number.isSafeInteger(cost) || wallet.coins() < cost) return { err: "coins" };
    if (inv.canAdd && !inv.canAdd(id, n)) return { err: "full" };
    const r = inv.add(id, n);
    if (!r || !r.ok) return { err: "full" };
    if (!wallet.spend(cost)) { inv.take(id, n); return { err: "coins" }; }
    return { ok: true, id, count: n, price: s.buy, coins: cost, overflow: r.overflow || 0 };
  }

  /**
   * Kiểm bất biến kinh tế. Trả { ok, violations: [chuỗi], costs } — không ném; test gọi và đòi violations rỗng.
   * costs[id] = giá rẻ nhất để có món chỉ bằng cách mua ở chợ (+ chế biến / nuôi), Infinity ⇒ không thể.
   */
  function assertEconomy() {
    const violations = [];
    for (const s of shop) {
      if (s.kind === "seed" && sellable(s.id)) violations.push(`${s.id}: hạt giống không được bán lại`);
      if (!(s.buy >= RESALE_MIN_RATIO * maxSell(s.id))) violations.push(`${s.id}: mua ${s.buy} < 1,6 × bán tối đa ${maxSell(s.id).toFixed(2)}`);
    }
    // Giá "mua-được" của mọi món qua chuỗi chỉ dùng chợ (lặp tới khi ổn định, đề phòng chuỗi nhiều bước).
    const costs = Object.create(null);
    const cost = (id) => costs[id] ?? Infinity;
    for (const s of shop) if (s.kind !== "seed") costs[s.id] = s.buy;
    const conversions = [
      ...RECIPES.map((r) => ({ label: `công thức ${r.id}`, inputs: r.inputs, output: r.output, qty: r.qty })),
      ...ANIMAL_REF.map((a) => ({ label: `vật nuôi ${a.id}`, inputs: { "thuc-an-gia-suc": a.feed }, output: a.output, qty: a.qty })),
    ];
    for (let pass = 0, changed = true; changed && pass < 20; pass++) {
      changed = false;
      for (const c of conversions) {
        const total = Object.entries(c.inputs).reduce((t, [id, q]) => t + cost(id) * q, 0);
        if (total / c.qty < cost(c.output)) { costs[c.output] = total / c.qty; changed = true; }
      }
    }
    for (const c of conversions) {
      const total = Object.entries(c.inputs).reduce((t, [id, q]) => t + cost(id) * q, 0);
      if (Number.isFinite(total) && !(maxSell(c.output) * c.qty < total)) {
        violations.push(`${c.label}: đầu vào mua chợ ${total} ≤ bán tối đa ${(maxSell(c.output) * c.qty).toFixed(2)}`);
      }
    }
    return { ok: violations.length === 0, violations, costs: { ...costs } };
  }

  return { priceOf, trend, nextChangeAt, board, catalogue, sell, buy, sellable, basePrice, maxSell, assertEconomy, shop: SHOP };
}

/** Chợ dùng chung của game (một nguồn giá: chợ, Nhà kho "Bán nhanh", giỏ tràn). */
export const MARKET = createMarket({ crops: CROPS });
