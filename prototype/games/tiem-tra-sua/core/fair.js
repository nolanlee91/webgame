// Milestone 5: Hội chợ khu phố (cấp 18) và Hạng tiệm (chỗ tiêu tiền cuối game). Thuần, đổi trạng thái qua apply().
// Hội chợ: trả phí gian hàng trước ca ⇒ ca hôm nay là ca hội chợ: dài hơn, đông hơn (+6 khách), giá +15%, khách kém kiên nhẫn hơn,
// nhiều đơn nhóm kết hợp (mỗi người một món, tới 3 ly cả nhóm khách nào). Mỗi FAIR.every ngày một lần.
// Hạng tiệm: 8 bậc mua bằng tiền (mở theo cấp), mỗi bậc +1 khách đi ngang mỗi ca và +2% kiên nhẫn; tiền thuê ca tăng theo cấp.
import { DRAMA } from "../data/shift.js?v=m37";

export const FAIR = { unlock: 18, fee: 150, every: 4, duration: 240000, lastAt: 222000, guests: 6, priceMul: 1.15, patienceMul: 0.9, two: 0.45, three: 0.25 };

export const fairToday = (s) => s.fair?.day === s.day;
export function fairAvailable(s) {
  if (s.level < FAIR.unlock || s.shift) return false;
  if (fairToday(s)) return false;
  return (s.fair?.last ?? -99) + FAIR.every <= s.day;
}
/** Ngày hội chợ kế tiếp có thể đăng ký (để hiện trên bảng Chuẩn bị ca). */
export const nextFairDay = (s) => Math.max(s.day, (s.fair?.last ?? -99) + FAIR.every);

export function joinFair(s, events) {
  if (s.shift) return { err: "shift-open" };
  if (s.level < FAIR.unlock) return { err: "locked" };
  if (!fairAvailable(s)) return { err: fairToday(s) ? "already" : "too-soon" };
  if (s.money < FAIR.fee) return { err: "money" };
  s.money -= FAIR.fee;
  s.fair = { day: s.day, last: s.day, count: (s.fair?.count || 0) + 1 };
  if (s.drama) s.drama.flags["hoi-cho"] = s.day; // sự kiện FA1 / FA2 trong ca hội chợ
  events.push({ type: "fairJoined", fee: FAIR.fee, day: s.day });
  return { ok: true };
}
/** Gọi trong endShift của ca hội chợ. */
export function fairDone(s) { if (s.drama) s.drama.flags["hoi-cho-xong"] = s.day + DRAMA.flagDays; }

// ---------- Hạng tiệm ----------
export const TIERS = [
  { id: 1, name: "Tiệm có tên trong hẻm", unlock: 10, price: 300 },
  { id: 2, name: "Tiệm quen của xóm", unlock: 11, price: 600 },
  { id: 3, name: "Tiệm có biển đẹp", unlock: 12, price: 1000 },
  { id: 4, name: "Tiệm được hỏi đường", unlock: 14, price: 1600 },
  { id: 5, name: "Tiệm có tiếng khu phố", unlock: 15, price: 2400 },
  { id: 6, name: "Tiệm lên báo phường", unlock: 17, price: 3400 },
  { id: 7, name: "Tiệm nổi tiếng quận", unlock: 19, price: 4600 },
  { id: 8, name: "Tiệm Chủ Tiệm", unlock: 20, price: 6000 },
];
export const tierOf = (s) => Math.max(0, Math.min(TIERS.length, s.tier || 0));
export const nextTier = (s) => TIERS[tierOf(s)] || null;
export const TIER_GUESTS = 1, TIER_PATIENCE = 0.02;
export function buyTier(s, events) {
  if (s.shift) return { err: "shift-open" };
  const T = nextTier(s);
  if (!T) return { err: "max" };
  if (s.level < T.unlock) return { err: "locked" };
  if (s.money < T.price) return { err: "money" };
  s.money -= T.price;
  s.tier = T.id;
  s.stats.spentGear = (s.stats.spentGear || 0) + T.price;
  events.push({ type: "tierUp", tier: T.id, name: T.name, price: T.price });
  return { ok: true };
}

/** Tiền thuê ca: 12k ở cấp 1, +2k mỗi cấp (tiệm lớn, mặt bằng đắt). */
export const shiftFee = (s) => 12 + 2 * Math.max(0, (s.level || 1) - 1);
