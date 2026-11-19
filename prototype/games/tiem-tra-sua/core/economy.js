// Giá vốn, kho, nhập hàng, lời lỗ. Thuần (không DOM). Đơn vị k.
import { STOCK, STOCK_IDS, START_CAPACITY, useOf } from "../data/ingredients.js";
import { RECIPE } from "../data/recipes.js";

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

/** Giá một lần nhập (gói) — giữa ca là giao gấp +15%, làm tròn lên. */
export function packPrice(id, express = false) {
  const base = STOCK[id].cost * STOCK[id].pack;
  return express ? Math.ceil(base * (1 + EXPRESS_MARKUP)) : base;
}

/** Nhập một gói. Lỗi: unknown / locked / money / capacity. */
export function restock(s, id, events) {
  const it = STOCK[id];
  if (!it) return { err: "unknown-stock" };
  if (s.level < it.unlock) return { err: "locked" };
  const express = !!(s.shift && s.shift.status === "open");
  const price = packPrice(id, express);
  if (s.money < price) return { err: "money" };
  const room = capacity(s) - stockUsed(s);
  if (room < it.pack) return { err: "capacity" };
  s.money -= price;
  s.stock[id] = (s.stock[id] || 0) + it.pack;
  if (s.shift) s.shift.ledger.restock += price;
  s.stats.spentStock += price;
  events.push({ type: "restocked", id, n: it.pack, price, express });
  return { ok: true };
}

/** Lợi nhuận vận hành = doanh thu − giá vốn bán − hao hụt − phí ca (ECONOMY.md). */
export const operatingProfit = (L) => L.revenue - L.cogs - L.waste - L.fee;
