// Tính tiền tại bàn (GAME-DESIGN §3.4, ECONOMY §4.3). Thuần.
// Phiếu tính tiền liệt kê các dòng có thể tính: món đã ăn + phần gọi thêm (dòng thật) và 1–2 dòng "nhiễu" (món bàn không ăn).
// Người chơi chạm từng dòng để cộng. Thiếu dòng = tính thiếu (mất tiền, không trừ sao). Thừa dòng = tính dư (trần 2 sao + khách phản đối).
// Ngày 1–3 có nút "Tính đúng" (tự chạm đúng các dòng thật); hộp tính tiền (cấp 15) cũng tự cộng.
import { DISHES, EXTRAS } from "../data/economy.js?v=c12";
import { QUIRKS } from "../data/customers.js?v=c12";
import { next, int } from "./rng.js?v=c12";

export const AUTO_BILL_DAYS = 3;
export const canAutoBill = (s) => s.day <= AUTO_BILL_DAYS || !!s.owned?.["cash-box"];

/** Giá một dĩa theo phiếu (đã trừ giảm giá / miễn phí do khiếu nại). */
export function ticketPrice(t) {
  const base = Math.round(((DISHES[t.dish]?.price ?? 0) + (t.plus || 0)) * (t.fairMul || 1)); // A: nước mắm nhà pha +1k / bậc; S: giá hội chợ
  if (t.free) return 0;
  return Math.round(base * (1 - (t.discount || 0)));
}
/** Dòng thật của bàn: mỗi dĩa đã ăn, mỗi "thêm cơm" (dặn lúc gọi hoặc gọi thêm), mỗi khăn lạnh. */
export function realLines(s, g) {
  const out = [];
  for (const m of g.members) {
    const t = s.shift.tickets.find((x) => x.id === m.tk);
    if (t && t.status === "served" && !t.refunded) {
      const name = DISHES[t.dish]?.name || "Dĩa cơm";
      out.push({ key: "d" + t.id, label: `${name} · ${m.name}`, price: ticketPrice(t), real: true });
      if (t.quirks?.includes("themCom") && t.plateCom >= 2) out.push({ key: "c" + t.id, label: `${QUIRKS.themCom.text[0].toUpperCase() + QUIRKS.themCom.text.slice(1)} · ${m.name}`, price: EXTRAS.com.price, real: true });
    }
    for (let i = 0; i < (m.extras?.com || 0); i++) out.push({ key: `x${m.idx}c${i}`, label: `Chén cơm thêm · ${m.name}`, price: EXTRAS.com.price, real: true });
    for (let i = 0; i < (m.extras?.khan || 0); i++) out.push({ key: `x${m.idx}k${i}`, label: `Khăn lạnh · ${m.name}`, price: EXTRAS.khan.price, real: true });
  }
  return out;
}
/** Dòng nhiễu: thứ bàn không dùng (người chơi phải nhớ bàn đã ăn gì). */
function decoys(s, g, real) {
  const pool = [];
  const names = g.members.map((m) => m.name);
  const anyKhan = real.some((l) => /^x\d+k/.test(l.key));
  const anyCom = real.some((l) => l.key.startsWith("c") || /^x\d+c/.test(l.key));
  if (!anyKhan) pool.push({ key: "zk", label: `Khăn lạnh · ${names[0]}`, price: EXTRAS.khan.price, real: false });
  if (!anyCom) pool.push({ key: "zc", label: `Chén cơm thêm · ${names[names.length - 1]}`, price: EXTRAS.com.price, real: false });
  const first = real.find((l) => l.key.startsWith("d"));
  if (first) pool.push({ key: "zd", label: first.label.split(" · ")[0] + " · (dĩa thêm)", price: first.price, real: false });
  pool.push({ key: "zt", label: `Thêm trứng · ${names[0]}`, price: EXTRAS.trung.price, real: false });
  const n = Math.min(pool.length, g.members.length > 1 ? 2 : 1);
  const out = [];
  while (out.length < n && pool.length) out.push(pool.splice(int(s, pool.length), 1)[0]);
  return out;
}
/** Mở phiếu tính tiền cho nhóm khách (khi cô chủ tới bàn). */
export function makeBill(s, g) {
  const real = realLines(s, g);
  const lines = [...real, ...decoys(s, g, real)];
  for (let i = lines.length - 1; i > 0; i--) { const j = Math.floor(next(s) * (i + 1)); [lines[i], lines[j]] = [lines[j], lines[i]]; }
  return { gid: g.id, tid: g.table, lines, tapped: [], openT: s.shift.t, auto: false };
}
export const billTotal = (b) => b.lines.filter((l) => b.tapped.includes(l.key)).reduce((a, l) => a + l.price, 0);
export const billCorrect = (b) => b.lines.filter((l) => l.real).reduce((a, l) => a + l.price, 0);
export function tapLine(b, key) {
  if (!b.lines.some((l) => l.key === key)) return { err: "bad-line" };
  b.tapped = b.tapped.includes(key) ? b.tapped.filter((k) => k !== key) : [...b.tapped, key];
  return { ok: true };
}
/** Nút "Tính đúng" (ngày 1–3 / hộp tính tiền). */
export function autoTap(s, b) {
  if (!canAutoBill(s)) return { err: "manual-bill" };
  b.tapped = b.lines.filter((l) => l.real).map((l) => l.key);
  b.auto = true;
  return { ok: true };
}
/** Kết quả thu tiền: { total, correct, over, under }. */
export function settle(b) {
  const total = billTotal(b), correct = billCorrect(b);
  return { total, correct, over: Math.max(0, total - correct), under: Math.max(0, correct - total) };
}
