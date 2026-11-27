// Tiền mặt và tiền lẻ (ECONOMY §4). s.money = tổng tiền (k, số nguyên). s.float = quỹ lẻ theo mệnh giá (tờ ≤ 50k), là một phần của s.money;
// phần còn lại là két (tờ lớn). Bất biến: floatValue(s.float) ≤ s.money. Thuần, không DOM.
import { FLOAT_BILLS, BILLS } from "../data/economy.js?v=b12";
import { next, weighted } from "./rng.js?v=b12";

export const floatValue = (bills) => FLOAT_BILLS.reduce((a, d) => a + d * (bills?.[d] || 0), 0);
export const sumBills = (bills) => Object.entries(bills || {}).reduce((a, [d, n]) => a + Number(d) * n, 0);
export const billCount = (bills) => Object.values(bills || {}).reduce((a, n) => a + n, 0);
export const till = (s) => s.money - floatValue(s.float);
const clean = (bills) => Object.fromEntries(Object.entries(bills).filter(([, n]) => n > 0));

/** Tách một số tiền thành tờ (tham lam, mệnh giá lớn trước) — dùng cho tiền khách đưa vừa đủ, tiền thối lại khi mua hàng. */
export function greedyBills(amount, denoms = [...FLOAT_BILLS].reverse()) {
  const out = {};
  let left = amount;
  for (const d of denoms) { const n = Math.floor(left / d); if (n > 0) { out[d] = n; left -= n * d; } }
  return left === 0 ? out : null;
}

/** Tìm cách thối đúng `due` từ quỹ lẻ (ít tờ nhất). Trả { bills } hoặc null nếu không thể (thiếu tờ / thiếu mệnh giá). */
export function makeChange(bills, due) {
  if (due === 0) return {};
  if (!(due > 0) || !Number.isInteger(due)) return null;
  // quy hoạch động có giới hạn số tờ mỗi mệnh giá: best[v] = số tờ ít nhất để ra v, from[v] = [mệnh giá, v trước]
  const INF = 1e9;
  let best = new Array(due + 1).fill(INF);
  let pick = new Array(due + 1).fill(null);
  best[0] = 0; pick[0] = {};
  for (const d of FLOAT_BILLS) {
    const have = bills?.[d] || 0;
    if (!have) continue;
    const nb = best.slice(), np = pick.slice();
    for (let v = 0; v <= due; v++) {
      if (best[v] >= INF) continue;
      for (let k = 1; k <= have && v + k * d <= due; k++) {
        const w = v + k * d;
        if (best[v] + k < nb[w]) { nb[w] = best[v] + k; np[w] = { ...pick[v], [d]: k }; }
      }
    }
    best = nb; pick = np;
  }
  return best[due] < INF ? pick[due] : null;
}
export const canChange = (bills, due) => makeChange(bills, due) !== null;

/** Nhận tiền: tờ ≤ 50k vào quỹ lẻ, tờ lớn vào két. */
export function receive(s, bills) {
  for (const [d, n] of Object.entries(bills)) {
    s.money += Number(d) * n;
    if (FLOAT_BILLS.includes(Number(d))) s.float[d] = (s.float[d] || 0) + n;
  }
}
/** Đưa tờ từ quỹ lẻ (thối cho khách). Trả false nếu quỹ không đủ tờ đó. */
export function payOut(s, bills) {
  for (const [d, n] of Object.entries(bills)) if ((s.float[d] || 0) < n) return false;
  for (const [d, n] of Object.entries(bills)) { s.float[d] -= n; s.money -= Number(d) * n; }
  s.float = clean(s.float);
  return true;
}
/** Chi tiền (nhập hàng, phí ca…): lấy két trước, thiếu thì đổi tờ lẻ lớn trước; người bán thối lại bằng tờ nhỏ (vào quỹ lẻ). */
export function spend(s, k) {
  if (!(k >= 0) || k > s.money) return false;
  let fromTill = Math.min(k, till(s));
  s.money -= fromTill;
  let left = k - fromTill;
  for (const d of [...FLOAT_BILLS].reverse()) {
    while (left > 0 && (s.float[d] || 0) > 0) { s.float[d]--; s.money -= d; left -= d; }
  }
  if (left < 0) receive(s, greedyBills(-left));
  s.float = clean(s.float);
  return true;
}
/** Đổi tiền két ra tờ lẻ (Cô Sáu). */
export function exchange(s, bills) {
  const v = sumBills(bills);
  if (v > till(s)) return false;
  for (const [d, n] of Object.entries(bills)) s.float[d] = (s.float[d] || 0) + n;
  return true;
}

/** Cách khách trả tiền (ECONOMY §4): chuyển khoản / đưa vừa đủ / đưa một tờ ≥ giá. early = 06:00–07:00 (tờ 200k/500k gấp đôi). */
export function customerPays(s, arch, price, { early = false, level = 1 } = {}) {
  if (price <= 0) return { kind: "free" };
  const transfer = Math.min(0.9, arch.transfer + (level - 1) * 0.015);
  if (next(s) < transfer) return { kind: "transfer" };
  if (next(s) < arch.exact) {
    const small = arch.regular ? greedyBills(price, [5, 2, 1]) : greedyBills(price);
    return { kind: "exact", bills: small };
  }
  const big = arch.bigBill * (early ? 2 : 1);
  const options = BILLS.filter((d) => d >= 10 && d >= price).map((d) => ({ d, w: d >= 100 ? big * (d >= 200 ? 0.5 : 1) + 0.05 : 1 }));
  return { kind: "bill", bill: weighted(s, options).d };
}
