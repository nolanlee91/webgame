// Milestone 5 (chép khung Trà Sữa core/challenge.js): lịch ca thử thách (cấp 20, tuỳ chọn) và huy hiệu. Thuần.
// Mỗi ngày lịch treo tường có một thử thách (xoay vòng 5 loại theo số ngày, GAME-DESIGN §5). Nhận trước ca, miễn phí, bỏ được trước khi mở hàng.
// Đạt mục tiêu ⇒ thưởng tiền + XP (lần đầu nhiều hơn), lần đầu có huy hiệu riêng. Huy hiệu xét lúc chốt ca và khi mua hạng tiệm (s.badges = { id: ngày nhận }).
import { CHALLENGE } from "../data/equipment.js?v=b6";
import { CHALLENGE_TEXT, BADGE_LINES } from "../data/lines-m5.js?v=b6";
import { fill, freshLine } from "./text.js?v=b6";

/** mods: guests (+khách buổi sáng), patienceMul, slots (ép số ngăn lò), tourist (tỉ lệ khách Tây), manual (không phụ việc / không "Thối đúng" / không hộp đếm tiền gợi ý).
 *  goal(S) ⇒ đạt hay không (S = bảng chốt ca). */
export const CHALLENGES = [
  { id: "rush-kep", name: "Rush kép", desc: "Thêm 6 khách giờ cao điểm sáng, khách kém kiên nhẫn 15%. Đạt: phục vụ ≥ 18 khách, tối đa 1 người bỏ về.",
    mods: { guests: 6, patienceMul: 0.85 }, goal: (S) => S.served >= 18 && S.lost <= 1 },
  { id: "mot-lo", name: "Một lò", desc: "Chỉ dùng một ngăn lò cả ca. Đạt: bán ≥ 24 ổ, tối đa 2 người bỏ về.",
    mods: { slots: 1 }, goal: (S) => S.loaves >= 24 && S.lost <= 2 },
  { id: "khach-tay", name: "Ngày khách Tây", desc: "Phần lớn khách là khách du lịch (phiếu hình, tip). Đạt: phục vụ ≥ 14 khách, trung bình ≥ 4,2 sao.",
    mods: { tourist: 0.7 }, goal: (S) => S.served >= 14 && S.avg >= 4.2 },
  { id: "khong-chay", name: "Không cháy mẻ nào", desc: "Đạt: nướng ≥ 6 mẻ, không mẻ nào cháy, bán ≥ 24 ổ.",
    mods: {}, goal: (S) => S.batches >= 6 && S.burntBatches === 0 && S.loaves >= 24 },
  { id: "thoi-tay", name: "Thối tay toàn bộ", desc: "Không phụ việc thối giùm, không gợi ý tờ. Đạt: thối đúng ≥ 10 lần, không lần nào sai.",
    mods: { manual: true }, goal: (S) => S.changeRight >= 10 && S.changeWrong === 0 },
];
export const CHALLENGE_BY_ID = Object.fromEntries(CHALLENGES.map((c) => [c.id, c]));

/** Thử thách trên lịch hôm nay (null nếu chưa tới cấp 20 / đang mở ca). */
export function challengeToday(s) {
  if (s.level < CHALLENGE.level || s.shift) return null;
  return CHALLENGES[s.day % CHALLENGES.length];
}
/** Lịch 5 ngày tới (bảng Chuẩn bị ca). */
export const challengeWeek = (s) => Array.from({ length: CHALLENGES.length }, (_, i) => ({ day: s.day + i, ...CHALLENGES[(s.day + i) % CHALLENGES.length] }));
export const activeChallenge = (s) => (s.challenge?.day === s.day && CHALLENGE_BY_ID[s.challenge.id]) || null;
/** Bộ điều chỉnh của thử thách đang chạy (rỗng nếu không có). */
export const challengeMods = (s) => activeChallenge(s)?.mods || {};

/** Nhận / bỏ thử thách hôm nay (trước ca). */
export function setChallenge(s, on, ev) {
  if (s.shift) return { err: "shift-open" };
  if (s.level < CHALLENGE.level) return { err: "locked" };
  if (!on) { s.challenge = null; delete s.drama.flags["thu-thach"]; ev.push({ type: "challenge", on: false }); return { ok: true }; }
  const c = challengeToday(s);
  s.challenge = { id: c.id, day: s.day };
  s.drama.flags["thu-thach"] = s.day; // sự kiện CH1 trong ca thử thách
  ev.push({ type: "challenge", on: true, id: c.id, name: c.name });
  return { ok: true };
}

/** Chốt ca thử thách: xét mục tiêu, thưởng. Trả { id, name, ok, money, xp, first, line } hoặc null. */
export function judgeChallenge(s, sum) {
  const c = activeChallenge(s);
  if (!c || s.challenge.day !== sum.day) return null;
  const ok = !!c.goal(sum);
  const first = ok && !s.badges?.["tt-" + c.id];
  const R = ok ? (first ? CHALLENGE.firstReward : CHALLENGE.reward) : { money: 0, xp: 0 };
  if (ok) { s.money += R.money; s.stats.challenges = (s.stats.challenges || 0) + 1; }
  const T = CHALLENGE_TEXT[c.id];
  const line = freshLine(s, ok ? T.win : T.lose, {});
  return { id: c.id, name: c.name, ok, money: R.money, xp: R.xp, first, line };
}

// ---------- huy hiệu (14) ----------
export const BADGES = [
  { id: "chu-tiem", name: "Chủ Tiệm", desc: "Lên cấp 20", test: (s) => s.level >= 20 },
  { id: "khong-bo-ve", name: "Không ai bỏ về", desc: "Một ca phục vụ ≥ 15 khách, không ai bỏ về", test: (s, S) => !!S && S.served >= 15 && S.lost === 0 },
  { id: "nam-sao", name: "Ca năm sao", desc: "Một ca bán ≥ 15 ổ, trung bình ≥ 4,9 sao", test: (s, S) => !!S && S.loaves >= 15 && S.avg >= 4.9 },
  { id: "tay-lo-vang", name: "Tay lò vàng", desc: "Một ca rút ≥ 8 mẻ đúng vùng chín, không mẻ nào cháy", test: (s, S) => !!S && S.goldenPulls >= 8 && S.burntBatches === 0 },
  { id: "thoi-dung", name: "Thối không sai một đồng", desc: "Một ca thối đúng ≥ 15 lần, không lần nào sai", test: (s, S) => !!S && S.changeRight >= 15 && S.changeWrong === 0 },
  { id: "hoi-cho", name: "Ngôi sao hội chợ", desc: "Một ca hội chợ trung bình ≥ 4 sao", test: (s, S) => !!S && S.fair && S.avg >= 4 },
  { id: "hoi-cho-5", name: "Gian hàng quen mặt", desc: "Dự 5 lần hội chợ", test: (s) => (s.fairCount || 0) >= 5 },
  { id: "trieu-phu", name: "Két sắt nặng tay", desc: "Có 3.000k tiền mặt", test: (s) => s.money >= 3000 },
  { id: "hang-max", name: "Tiệm Chủ Tiệm", desc: "Lên hạng tiệm cao nhất (8/8)", test: (s) => (s.rank || 0) >= 8 },
  ...CHALLENGES.map((c) => ({ id: "tt-" + c.id, name: `Thử thách: ${c.name}`, desc: c.desc.replace(/^.*Đạt: /, "Đạt: "), test: (s, S) => !!(S?.challenge?.ok && S.challenge.id === c.id) })),
];
export const BADGE = Object.fromEntries(BADGES.map((b) => [b.id, b]));

/** Xét huy hiệu mới (chốt ca: sum = bảng chốt ca; mua hạng tiệm: sum = null). Trả danh sách vừa nhận. */
export function checkBadges(s, sum, ev) {
  s.badges = s.badges || {};
  const got = [];
  for (const b of BADGES) {
    if (s.badges[b.id] || !b.test(s, sum)) continue;
    s.badges[b.id] = s.day;
    const line = fill(freshLine(s, BADGE_LINES, {}), { badge: b.name });
    got.push({ id: b.id, name: b.name, line });
    if (sum?.moments) sum.moments.push({ kind: "badge", name: b.name, line, id: b.id.slice(0, 20) });
    ev.push({ type: "badge", id: b.id, name: b.name, line });
  }
  return got;
}
