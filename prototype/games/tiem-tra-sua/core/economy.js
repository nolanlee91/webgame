// Giá vốn, kho, nhập hàng, lời lỗ. Thuần (không DOM). Đơn vị k.
import { STOCK, STOCK_IDS, START_CAPACITY, useOf } from "../data/ingredients.js?v=m36";
import { RECIPE } from "../data/recipes.js?v=m36";

export const EXPRESS_MARKUP = 0.15; // nhập gấp giữa ca

/** Tiền của một tập phần dùng { id: n }. */
export function costOfUse(use) {
  let k = 0;
  for (const [id, n] of Object.entries(use)) k += (STOCK[id]?.cost ?? 0) * n;
  return k;
}
/** Phần nguyên liệu (gộp) của một đơn/công thức: { base, add, sugar, ice, topping } + ly. */
export function useOfSpec(spec) {
  const total = {};
  const addUse = (u) => { for (const [id, n] of Object.entries(u)) total[id] = (total[id] || 0) + n; };
  addUse(useOf("cup", "ly"));
  for (const step of ["base", "add", "sugar", "ice", "topping"]) addUse(useOf(step, spec[step]));
  return total;
}
export const recipeCost = (id) => costOfUse(useOfSpec(RECIPE[id]));
export const recipeMargin = (id) => RECIPE[id].price - recipeCost(id);

/** Giá vốn ly đang pha (mọi phần đã rót, kể cả phần dư). */
export function cupCost(cup) {
  if (!cup) return 0;
  let k = 0;
  for (const st of cup.steps) k += costOfUse(useOf(st.step, st.id));
  return k;
}

export const capacity = (s) => s.capacity || START_CAPACITY;
export const stockUsed = (s) => STOCK_IDS.reduce((a, id) => a + (s.stock[id] || 0), 0);
export const hasStock = (s, use) => Object.entries(use).every(([id, n]) => (s.stock[id] || 0) >= n);
export function takeStock(s, use) {
  for (const [id, n] of Object.entries(use)) s.stock[id] = (s.stock[id] || 0) - n;
}

/** Nhà cung cấp: Dì Ba (mặc định, giữa ca giao gấp +15%) và vựa sỉ Anh Út (cấp 12: gói gấp đôi, rẻ hơn 10%, chỉ nhận trước ca). */
export const SUPPLIERS = {
  "di-ba": { name: "Tạp hoá Dì Ba", unlock: 1, packMul: 1, priceMul: 1, midShift: true },
  "si": { name: "Vựa sỉ Anh Út", unlock: 12, packMul: 2, priceMul: 0.9, midShift: false },
};
export const packSize = (id, supplier = "di-ba") => STOCK[id].pack * (SUPPLIERS[supplier]?.packMul || 1);
/** Giá một lần nhập (gói) — giữa ca là giao gấp +15%, làm tròn lên; vựa sỉ gói gấp đôi giảm 10%. */
export function packPrice(id, express = false, supplier = "di-ba") {
  const S = SUPPLIERS[supplier] || SUPPLIERS["di-ba"];
  const base = STOCK[id].cost * packSize(id, supplier);
  if (S.priceMul !== 1) return Math.round(base * S.priceMul);
  return express ? Math.ceil(base * (1 + EXPRESS_MARKUP)) : base;
}

/** Nhập một gói. Lỗi: unknown / locked / money / capacity / supplier. */
export function restock(s, id, events, supplier = "di-ba") {
  const it = STOCK[id];
  if (!it) return { err: "unknown-stock" };
  const S = SUPPLIERS[supplier];
  if (!S) return { err: "bad-supplier" };
  if (s.level < it.unlock || s.level < S.unlock) return { err: "locked" };
  const express = !!(s.shift && s.shift.status === "open");
  if (express && !S.midShift) return { err: "supplier-closed" };
  const price = packPrice(id, express, supplier);
  const n = packSize(id, supplier);
  if (s.money < price) return { err: "money" };
  const room = capacity(s) - stockUsed(s);
  if (room < n) return { err: "capacity" };
  s.money -= price;
  s.stock[id] = (s.stock[id] || 0) + n;
  if (s.shift) s.shift.ledger.restock += price;
  s.stats.spentStock += price;
  if (supplier === "si" && s.drama) s.drama.flags["si-mua"] = s.day + 3; // hàng vựa sỉ: drama U01–U06 (core/drama.js ENGINE_FLAG)
  events.push({ type: "restocked", id, n, price, express, supplier });
  return { ok: true };
}

/** Lợi nhuận vận hành = doanh thu − giá vốn bán − hao hụt − phí ca (ECONOMY.md). */
export const operatingProfit = (L) => L.revenue - L.cogs - L.waste - L.fee;
