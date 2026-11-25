// Hạn dùng nguyên liệu (Milestone 5, ECONOMY §1 cột "Hạn"), bản đơn giản: kho vẫn là một con số mỗi món; s.lots ghi các lô theo ngày nhập
// để biết phần nào cũ. Đối chiếu một lần lúc chốt ca: dùng theo kiểu lô cũ trước (FIFO), phần tăng không rõ nguồn (nhập, ký gửi, sự kiện) là lô hôm nay;
// lô hết hạn ghi hao hụt "hết hạn" và trừ kho. Tủ mát (cấp 13) giữ thêm 1 ngày cho đồ hạn 2 ngày; chậu rau thơm giữ rau thêm 1 ngày. Thuần.
import { STOCK } from "../data/economy.js?v=b6";
import { addWaste } from "./oven.js?v=b6";

/** Số ngày dùng được (1 = trong ngày: nhập hôm nay, hết hạn cuối ca hôm nay). Món không có ở đây không hết hạn. */
/** M5 (bộ mô phỏng): bản ECONOMY M0 (phôi / chả 2 ngày, rau trong ngày) làm người chơi trung bình bỏ 30–60k mỗi ca vì gói nhập
 *  (8–15 phần) lớn hơn nhu cầu một ngày ⇒ nới thêm một ngày cho mọi món tươi, tủ mát vẫn +1. */
export const SHELF = { phoi: 3, "phoi-que": 3, "cha-lua": 4, "thit-nguoi": 4, "xiu-mai": 4, "thit-nuong": 4, "heo-quay": 3, "ga-xe": 4, "cha-chay": 4,
  "do-chua": 5, "dua-leo": 3, rau: 2, pate: 10, bo: 10, mayo: 10, trung: 10, "cha-bong": 10 };
export function shelfOf(s, id) {
  let k = SHELF[id];
  if (!k) return 0;
  if (k <= 4 && s.owned?.fridge) k += 1;
  if (id === "rau" && s.owned?.["herb-pot"]) k += 1;
  return k;
}
export const loadLots = (o) => Object.fromEntries(Object.entries(o && typeof o === "object" ? o : {}).filter(([id, v]) => SHELF[id] && Array.isArray(v))
  .map(([id, v]) => [id, v.filter((l) => Array.isArray(l) && Number.isInteger(l[0]) && Number.isInteger(l[1]) && l[1] > 0).slice(-10)]));

/** Ghi một lô vừa nhập (nhập hàng, ký gửi, chạy chợ, Anh Lâm chở). Trước đó khớp lô với kho để phần đã dùng trừ vào lô cũ. */
export function addLot(s, id, n) {
  if (!SHELF[id] || !(n > 0)) return;
  const day = s.shift ? s.shift.day : s.day;
  s.lots = s.lots || {};
  const have = (s.stock[id] || 0) - n; // kho trước khi nhập lô này
  trim(s, id, have, day);
  const lots = s.lots[id] || (s.lots[id] = []);
  const last = lots[lots.length - 1];
  if (last && last[0] === day) last[1] += n; else lots.push([day, n]);
}
function trim(s, id, have, day) {
  const lots = (s.lots[id] || []).map((l) => [l[0], l[1]]);
  let sum = lots.reduce((a, l) => a + l[1], 0);
  while (sum > have && lots.length) { const cut = Math.min(lots[0][1], sum - have); lots[0][1] -= cut; sum -= cut; if (!lots[0][1]) lots.shift(); }
  if (have > sum) { const last = lots[lots.length - 1]; if (last && last[0] === day) last[1] += have - sum; else lots.push([day, have - sum]); }
  if (lots.length) s.lots[id] = lots; else delete s.lots[id];
}
/** Khớp lô với số trong kho (lô cũ dùng trước, phần dư không rõ nguồn = lô ngày `day`). */
export function reconcile(s, day) {
  s.lots = s.lots || {};
  for (const id of Object.keys(SHELF)) trim(s, id, s.stock[id] || 0, day);
}
/** Phần sẽ hết hạn cuối ca ngày `day` (để Chuẩn bị ca cảnh báo). { id: n } */
export function expiringOn(s, day) {
  const out = {};
  const copy = { ...s, lots: JSON.parse(JSON.stringify(s.lots || {})) };
  reconcile(copy, day);
  for (const [id, lots] of Object.entries(copy.lots)) { const k = shelfOf(s, id); const n = lots.filter((l) => l[0] + k - 1 <= day).reduce((a, l) => a + l[1], 0); if (n) out[id] = n; }
  return out;
}
/** Chốt ca ngày `sh.day`: bỏ lô hết hạn, ghi hao hụt. Trả { id: n } đã bỏ. */
export function expire(s, sh) {
  reconcile(s, sh.day);
  const gone = {};
  for (const [id, lots] of Object.entries(s.lots)) {
    const k = shelfOf(s, id);
    const keep = [];
    for (const l of lots) { if (l[0] + k - 1 <= sh.day) gone[id] = (gone[id] || 0) + l[1]; else keep.push(l); }
    if (keep.length) s.lots[id] = keep; else delete s.lots[id];
    if (gone[id]) s.stock[id] = Math.max(0, (s.stock[id] || 0) - gone[id]);
  }
  const k = Object.entries(gone).reduce((a, [id, n]) => a + n * STOCK[id].cost, 0);
  if (k) addWaste(sh, "expired", Math.round(k * 10) / 10, "Hết hạn: " + Object.entries(gone).map(([id, n]) => `${STOCK[id].name} ${n}`).join(", "));
  return gone;
}
