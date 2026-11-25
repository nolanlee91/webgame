// Milestone 5: lịch ca thử thách (cấp 20, tuỳ chọn) và huy hiệu. Thuần.
// Mỗi ngày lịch treo tường có một thử thách (xoay vòng 5 loại theo số ngày). Tham gia trước ca, miễn phí.
// Đạt mục tiêu ⇒ thưởng tiền + XP, lần đầu có huy hiệu riêng. Huy hiệu xét lúc chốt ca (s.badges = { id: ngày nhận }).
import { DRAMA } from "../data/shift.js?v=m38";
import { CHALLENGE_WIN, CHALLENGE_FAIL, BADGE_LINES } from "../data/lines-m5.js?v=m38";
import { pick } from "./rng.js?v=m38";
import { fill } from "./text.js?v=m38";

export const CHALLENGE_UNLOCK = 20;
/** mods: extraGuests, patienceMul, noUndo, stations (ép số chỗ pha), archs (chỉ các nhóm khách này). goal(sum) ⇒ đạt hay không. */
export const CHALLENGES = [
  { id: "cao-diem", name: "Giờ cao điểm kép", desc: "Thêm 5 khách, khách kém kiên nhẫn 15%. Đạt: phục vụ ≥ 10 khách, tối đa 1 người bỏ về.",
    mods: { extraGuests: 5, patienceMul: 0.85 }, goal: (S) => S.served >= 10 && S.lost <= 1 },
  { id: "khong-hoan-tac", name: "Một lần là xong", desc: "Không được hoàn tác bước pha. Đạt: ≥ 8 ly, trung bình ≥ 4,3 sao.",
    mods: { noUndo: true }, goal: (S) => S.cups >= 8 && S.avgStars >= 4.3 },
  { id: "kho-tinh", name: "Ngày khách khó tính", desc: "Chỉ khách quen, reviewer và VIP ghé. Đạt: phục vụ ≥ 8 khách, trung bình ≥ 4,2 sao.",
    mods: { archs: ["khach-quen", "reviewer", "vip"] }, goal: (S) => S.served >= 8 && S.avgStars >= 4.2 },
  { id: "mot-cho", name: "Một chỗ pha", desc: "Cất bàn pha đôi / ba, chỉ một chỗ pha. Đạt: phục vụ ≥ 10 khách, tối đa 2 người bỏ về.",
    mods: { stations: 1 }, goal: (S) => S.served >= 10 && S.lost <= 2 },
  { id: "tiet-kiem", name: "Không giọt nào rơi", desc: "Đạt: ≥ 10 ly, hao hụt không quá 4k.",
    mods: {}, goal: (S) => S.cups >= 10 && S.waste <= 4 },
];
export const CHALLENGE = Object.fromEntries(CHALLENGES.map((c) => [c.id, c]));
export const CHALLENGE_REWARD = { first: { money: 120, xp: 60 }, again: { money: 60, xp: 30 } };

/** Thử thách trên lịch hôm nay (null nếu chưa tới cấp 20 / đang mở ca / đã tham gia hôm nay). */
export function challengeToday(s) {
  if (s.level < CHALLENGE_UNLOCK || s.shift) return null;
  if (s.challenge?.day === s.day) return null;
  return CHALLENGES[s.day % CHALLENGES.length];
}
/** Lịch 5 ngày tới (bảng Chuẩn bị ca). */
export const challengeWeek = (s) => Array.from({ length: CHALLENGES.length }, (_, i) => ({ day: s.day + i, ...CHALLENGES[(s.day + i) % CHALLENGES.length] }));
export const activeChallenge = (s) => (s.challenge?.day === s.day && CHALLENGE[s.challenge.id]) || null;

export function joinChallenge(s, id, events) {
  if (s.shift) return { err: "shift-open" };
  if (s.level < CHALLENGE_UNLOCK) return { err: "locked" };
  const c = challengeToday(s);
  if (!c) return { err: "already" };
  if (c.id !== id) return { err: "not-today" };
  s.challenge = { id, day: s.day };
  if (s.drama) s.drama.flags["thu-thach"] = s.day; // sự kiện CH1 trong ca thử thách
  events.push({ type: "challengeJoined", id, name: c.name });
  return { ok: true };
}

/** Chốt ca thử thách: xét mục tiêu, thưởng (lần đầu có huy hiệu). Trả { id, name, ok, reward, line }. */
export function finishChallenge(s, sum, gainXp, events) {
  const c = activeChallenge(s);
  if (!c) return null;
  const ok = !!c.goal(sum);
  const first = !s.badges?.["tt-" + c.id];
  const R = ok ? (first ? CHALLENGE_REWARD.first : CHALLENGE_REWARD.again) : { money: 0, xp: 0 };
  if (ok) { s.money += R.money; gainXp(s, R.xp, events); s.stats.challenges = (s.stats.challenges || 0) + 1; }
  if (s.drama) s.drama.flags[ok ? "thu-thach-dat" : "thu-thach-hut"] = s.day + DRAMA.flagDays;
  const line = pick(s, ok ? CHALLENGE_WIN : CHALLENGE_FAIL);
  sum.moments.push({ kind: "challenge", id: c.id, name: "Ca thử thách", line, outcome: ok ? "win" : "lose" });
  return { id: c.id, name: c.name, ok, reward: R, line };
}

// ---------- huy hiệu ----------
export const BADGES = [
  { id: "chu-tiem", name: "Chủ Tiệm", desc: "Lên cấp 20", test: (s) => s.level >= 20 },
  { id: "khong-bo-ve", name: "Không ai bỏ về", desc: "Một ca phục vụ ≥ 10 khách, không ai bỏ về", test: (s, S) => S && S.served >= 10 && S.lost === 0 },
  { id: "nam-sao", name: "Ca năm sao", desc: "Một ca ≥ 8 ly, trung bình 5 sao", test: (s, S) => S && S.cups >= 8 && S.avgStars >= 5 },
  { id: "ba-ly", name: "Ba ly năm sao", desc: "Giao trọn một đơn ba ly năm sao", test: (s, S) => S && (S.moments || []).some((m) => m.kind === "multi" && m.id === "perfect3") },
  { id: "hoi-cho", name: "Ngôi sao hội chợ", desc: "Một ca hội chợ trung bình ≥ 4 sao", test: (s, S) => S && S.fair && S.avgStars >= 4 },
  { id: "hoi-cho-5", name: "Gian hàng quen mặt", desc: "Dự 5 lần hội chợ", test: (s) => (s.fair?.count || 0) >= 5 },
  { id: "trieu-phu", name: "Két sắt nặng tay", desc: "Có 3.000k tiền mặt", test: (s) => s.money >= 3000 },
  { id: "tram-ngay", name: "Một trăm ngày", desc: "Mở tiệm tới ngày 100", test: (s) => s.day >= 100 },
  { id: "hang-max", name: "Tiệm Chủ Tiệm", desc: "Lên hạng tiệm cao nhất", test: (s) => (s.tier || 0) >= 8 },
  ...CHALLENGES.map((c) => ({ id: "tt-" + c.id, name: `Thử thách: ${c.name}`, desc: c.desc.replace(/^.*Đạt: /, "Đạt: "), test: (s, S) => !!(S?.challenge?.ok && S.challenge.id === c.id) })),
];
export const BADGE = Object.fromEntries(BADGES.map((b) => [b.id, b]));

/** Xét huy hiệu mới (chốt ca, mua hạng tiệm). Trả danh sách huy hiệu vừa nhận. */
export function checkBadges(s, sum, events) {
  s.badges = s.badges || {};
  const got = [];
  for (const b of BADGES) {
    if (s.badges[b.id]) continue;
    if (!b.test(s, sum)) continue;
    s.badges[b.id] = s.day;
    const line = fill(pick(s, BADGE_LINES), { badge: b.name });
    got.push({ id: b.id, name: b.name, line });
    if (sum?.moments) sum.moments.push({ kind: "badge", id: b.id.slice(0, 12), name: b.name, line });
    events.push({ type: "badge", id: b.id, name: b.name, line });
  }
  return got;
}
