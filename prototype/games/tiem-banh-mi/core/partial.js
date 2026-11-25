// Đơn nhiều ổ dang dở mà khách phải đi (hết kiên nhẫn, không chịu đổi món): khách lấy luôn mấy ổ ĐÃ GÓI, trả 70% giá (không XP, không review tốt).
// M5 (bộ mô phỏng): trước đây cả đơn 6–12 ổ đã gói đều ghi hao (người chơi ẩu mất 150–230k một ca, kẹt nghèo nhiều ngày). Thuần.
import { STOCK, QUE } from "../data/economy.js?v=b6";

export const PARTIAL = { pay: 0.7 };
/** Trả số ổ khách mang đi; các ổ đó không còn trong c.filled (không bị ghi hao nữa). */
export function takePartial(s, c, ev) {
  const sh = s.shift;
  if (!sh || c.items.length < 2) return 0;
  let n = 0, k = 0, cogs = 0;
  c.filled.forEach((f, i) => {
    if (!f) return;
    n++; k += c.items[i].price;
    cogs += (f.src === "si" ? STOCK["banh-si"].cost : f.src === "stale" ? 0 : f.src === "que" ? STOCK["phoi-que"].cost * QUE.bag : STOCK.phoi.cost) + Object.entries(f.used || {}).reduce((a, [id, q]) => a + q * STOCK[id].cost, 0);
    c.filled[i] = null;
  });
  if (!n) return 0;
  const pay = Math.round(k * PARTIAL.pay);
  s.money += pay;
  sh.stats.revenue += pay;
  sh.stats.cogs = Math.round((sh.stats.cogs + cogs) * 10) / 10;
  sh.stats.loaves += n;
  sh.moments.push({ kind: "partial", name: c.name, line: `${c.name} chờ không nổi, lấy luôn ${n} ổ đã gói, trả ${pay}k.` });
  ev.push({ type: "partialTaken", cid: c.id, n, pay });
  return n;
}
