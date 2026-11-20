// Kho, nhập hàng, đổi tiền lẻ, dự báo đầu ngày, gói ký gửi (ECONOMY §1, §4, §5). Thuần.
import { STOCK, STOCK_IDS, CAPACITY, EXPRESS_MARKUP, EXCHANGE, CONSIGN, RECIPE, shiftFeeFor } from "../data/economy.js?v=b1";
import { TUTORIAL, NORMAL_DAY } from "../data/shift.js?v=b1";
import { spend, exchange as doExchange, sumBills, till } from "./money.js?v=b1";
import { menuAt } from "./order.js?v=b1";

export const stage = (s) => (s.level >= 16 ? "famous" : s.level >= 7 && s.shop ? "shop" : "cart");
export const capacity = (s) => (stage(s) === "cart" ? CAPACITY.cart : CAPACITY.shop);
export const stockUsed = (s) => STOCK_IDS.reduce((a, id) => a + (STOCK[id].kho ? s.stock[id] || 0 : 0), 0);
export const packSize = (id) => STOCK[id].pack[0];
export const packPrice = (id, express = false) => Math.ceil(STOCK[id].pack[1] * (express ? 1 + EXPRESS_MARKUP : 1));
export const shiftFee = (s) => shiftFeeFor(s.level);

/** Nhập một gói Bà Tư. Giữa ca = giao gấp +15%. */
export function restock(s, id, ev) {
  const it = STOCK[id];
  if (!it) return { err: "bad-item" };
  if (it.unlock > s.level) return { err: "locked" };
  if (s.shift?.away) return { err: "away" };
  const express = !!s.shift;
  const price = packPrice(id, express), n = packSize(id);
  if (price > s.money) return { err: "money" };
  if (it.kho && stockUsed(s) + n > capacity(s)) return { err: "capacity" };
  spend(s, price);
  s.stock[id] = (s.stock[id] || 0) + n;
  s.stats.spentStock += price;
  if (s.shift) s.shift.stats.restockSpent += price;
  ev.push({ type: "restocked", id, n, price, express });
  return { ok: true };
}

/** Khách dự kiến ca tới (cùng công thức core/shift.js genGuests, bỏ phần ngẫu nhiên). */
export function expectedGuests(s) {
  if (!s.tutorialDone) return TUTORIAL.guests;
  return Math.max(NORMAL_DAY.minGuests, Math.min(NORMAL_DAY.maxGuests, NORMAL_DAY.minGuests + Math.floor(s.day / 2) + Math.floor((s.rep - 50) / 15) + Math.floor(s.level / 3)));
}
/** Phần hàng cần cho ca tới: { guests, loaves, need, short: [{id, have, need}] }. */
export function demandEstimate(s) {
  const guests = expectedGuests(s);
  const loaves = Math.round(guests * (s.tutorialDone ? 1.15 : 1));
  const menu = menuAt(s.level).filter((r) => r.level <= Math.max(1, s.level));
  const need = { phoi: loaves, "do-chua": loaves, "dua-leo": loaves, rau: loaves, "gia-vi": loaves, "giay-goi": loaves, tui: Math.ceil(loaves / 5), than: Math.ceil(loaves / 3), gas: Math.ceil(loaves / 4) + 1 };
  for (const R of menu) {
    const share = loaves / menu.length;
    for (const [id, lvl] of Object.entries(R.spreads)) need[id] = (need[id] || 0) + share * (lvl === 3 ? 2 : 1) * 1.1;
    for (const id of R.fills) need[id] = (need[id] || 0) + share;
  }
  const short = [];
  for (const id of STOCK_IDS) {
    if (!need[id]) continue;
    need[id] = Math.ceil(need[id] - 0.15);
    const have = (s.stock[id] || 0) + (id === "phoi" ? (s.prep?.loaves.length || 0) : 0);
    if (need[id] > 0 && have < need[id]) short.push({ id, have, need: need[id] });
  }
  short.sort((a, b) => (a.id === "phoi" ? -1 : b.id === "phoi" ? 1 : a.have / a.need - b.have / b.need));
  return { guests, loaves, need, short };
}
/** "Nhập đủ cho hôm nay": mua gói cho từng món thiếu, chừa phí ca, không vượt sức chứa. */
export function restockToday(s, ev) {
  if (s.shift) return { err: "shift-open" };
  const bought = {};
  let spent = 0;
  for (let guard = 0; guard < 60; guard++) {
    const { short } = demandEstimate(s);
    const room = capacity(s) - stockUsed(s);
    const x = short.find((q) => STOCK[q.id].unlock <= s.level && packPrice(q.id) <= s.money - shiftFee(s) && (!STOCK[q.id].kho || packSize(q.id) <= room));
    if (!x) break;
    const p = packPrice(x.id);
    spend(s, p);
    s.stock[x.id] += packSize(x.id);
    s.stats.spentStock += p;
    bought[x.id] = (bought[x.id] || 0) + packSize(x.id);
    spent += p;
  }
  if (!spent) return { err: "nothing" };
  ev.push({ type: "restockedToday", spent, bought });
  return { ok: true };
}

/** Đổi tiền lẻ ở Cô Sáu (chỉ trước ca, tối đa theo giai đoạn mỗi ngày). */
export function exchangePack(s, pack, ev) {
  if (s.shift) return { err: "shift-open" };
  const P = EXCHANGE.packs[pack];
  if (!P) return { err: "bad-pack" };
  const v = sumBills(P.bills), limit = EXCHANGE.limit[stage(s)];
  if ((s.daily.exchanged || 0) + v > limit) return { err: "exchange-limit" };
  if (v > till(s)) return { err: "money" };
  doExchange(s, P.bills);
  s.daily.exchanged = (s.daily.exchanged || 0) + v;
  ev.push({ type: "exchanged", pack, value: v });
  return { ok: true };
}

/** Làm được ít nhất một ổ pate bơ từ hàng đang có (kể cả tủ kính / mẻ đầu)? */
export function canMakeOne(s) {
  const bread = (s.stock.phoi || 0) > 0 && (s.stock.gas || 0) > 0 || (s.shift?.case.length || 0) > 0 || (s.prep?.loaves.length || 0) > 0;
  if (!bread) return false;
  return ["pate", "giay-goi"].every((id) => (s.stock[id] || 0) > 0);
}
/** Tiền mua đủ phần thiếu cho một ổ pate bơ. */
export function costToMakeOne(s) {
  let k = 0;
  for (const id of Object.keys(CONSIGN.use)) if ((s.stock[id] || 0) < 1 && !(id === "phoi" && ((s.shift?.case.length || 0) > 0 || (s.prep?.loaves.length || 0) > 0))) k += packPrice(id, !!s.shift);
  if ((s.stock.gas || 0) < 1 && !((s.shift?.case.length || 0) > 0)) k += packPrice("gas", !!s.shift);
  return k;
}
/** Ký gửi mở khi tiền + hàng không làm nổi một ổ pate bơ; một lần mỗi ngày trước ca + một lần giữa ca. */
export function consignAvailable(s) {
  const used = s.shift ? s.shift.consignUsed : s.daily.consigned;
  return !used && !canMakeOne(s) && costToMakeOne(s) > s.money;
}
/** Gói ký gửi Bà Tư: bù phần thiếu cho 10 ổ pate bơ (+3 mẻ gas), vượt sức chứa được, trừ dần giá vốn khi bán. */
export function consign(s, ev, force = false) {
  if (!force && !consignAvailable(s)) return { err: "consign-unavailable" };
  let owed = 0;
  const got = {};
  for (const [id, n] of Object.entries(CONSIGN.use)) {
    const want = n * CONSIGN.loaves, add = Math.max(0, want - (s.stock[id] || 0));
    if (add) { s.stock[id] = (s.stock[id] || 0) + add; got[id] = add; owed += add * STOCK[id].cost; }
  }
  const g = Math.max(0, CONSIGN.gas - (s.stock.gas || 0));
  if (g) { s.stock.gas += g; got.gas = g; owed += g * STOCK.gas.cost; }
  owed = Math.ceil(owed);
  s.consign = { owed: (s.consign?.owed || 0) + owed };
  if (s.shift) s.shift.consignUsed = true; else s.daily.consigned = true;
  ev.push({ type: "consigned", owed, got });
  return { ok: true };
}
/** Bán một ổ: trả dần ký gửi bằng giá vốn ổ. Trả số tiền đã trừ. */
export function repayConsign(s, cost) {
  if (!s.consign?.owed) return 0;
  const k = Math.min(s.consign.owed, Math.ceil(cost));
  s.consign.owed -= k;
  if (!s.consign.owed) s.consign = null;
  return k;
}
export const recipeName = (id) => RECIPE[id]?.name || id;
