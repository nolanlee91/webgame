// S (M5): lối chơi còn thiếu sau M3 + M4 — thuần, không DOM, mọi thay đổi đi qua core/apply.js (gộp bằng một dòng `...sHandlers()`).
// Gồm: bật / tắt món trong menu, hội chợ (cấp 18), ca thử thách + 14 huy hiệu (cấp 20), bày ×N cho bàn cùng món, tủ kính giữ ấm,
// vỉ chay riêng, bếp 2 than riêng, nợ Anh Sáu chung sổ nợ thật, trang trí Drama tặng thành đồ kéo thả, câu review nước mắm nhà pha.
// Móc vào lõi bằng các dòng "// S:" ở core/shift.js (onStart / onTick / beforeEnd / afterEnd), core/apply.js, core/grill.js, core/plate.js,
// core/score.js, core/tables.js, core/bill.js, core/drama.js, core/progression.js, core/state.js.
import { DISHES, GEAR, DECOR, FAIR, CHALLENGE, GLASS_CASE, GRILL, LATE, TIERS, FISH_SAUCE, STAFF } from "../data/economy.js?v=c6";
import { ARCHETYPES } from "../data/customers.js?v=c6";
import * as LM from "../data/lines-m5.js?v=c6";
import { freshLine, fill } from "./text.js?v=c6";
import { next, int, weighted } from "./rng.js?v=c6";
import { gainXp } from "./progress.js?v=c6";
import { isCooked, zoneOf } from "./grill.js?v=c6";
import { slotOf, ticketOf, targetOf } from "./plate.js?v=c6";
import { enqueue } from "./walker.js?v=c6";
import { batchMax, isFamous, staffToday, openDramaOrder, syncDebtFlags } from "./progression.js?v=c6";
import { dayMoment } from "./reviews.js?v=c6";

const owns = (s, id) => !!s.owned?.[id];

// ---------- trạng thái riêng ----------
/** Khoá mặc định (state.js khối "// --- S: M5 ---"). */
export const freshS = () => ({ fair: null, challenge: null, badges: {} });
const obj = (v) => !!v && typeof v === "object" && !Array.isArray(v);
/** Đọc phần S của bản lưu (thiếu / hỏng ⇒ mặc định). */
export function loadS(s, d) {
  const F = freshS();
  if (obj(d?.fair) && Number.isInteger(d.fair.day)) F.fair = { day: d.fair.day, count: Math.max(0, Math.floor(d.fair.count) || 0) };
  if (obj(d?.challenge) && CHALLENGE_BY_ID[d.challenge.id] && Number.isInteger(d.challenge.day)) F.challenge = { id: d.challenge.id, day: d.challenge.day };
  if (obj(d?.badges)) F.badges = Object.fromEntries(Object.entries(d.badges).filter(([k, v]) => BADGE[k] && Number.isInteger(v)));
  return Object.assign(s, F);
}

// ---------- menu ----------
/** Bật / tắt một món (bảng Chuẩn bị · Menu). Tắt ⇒ khách không gọi; món mới mở không tự bật lại món đã tắt. Luôn còn ít nhất một món. */
export function toggleDish(s, id, on, ev = []) {
  const d = DISHES[id];
  if (!d || d.rescue || d.special) return { err: "bad-dish" };
  if (s.shift) return { err: "in-shift" };
  s.menu = Array.isArray(s.menu) ? s.menu : ["com-suon"];
  s.menuOff = Array.isArray(s.menuOff) ? s.menuOff : [];
  const want = on === undefined ? !s.menu.includes(id) : !!on;
  if (want) {
    if (d.level > s.level) return { err: "locked" };
    if ((d.needs || []).some((k) => !s.owned?.[k])) return { err: "needs" };
    if (!s.menu.includes(id)) s.menu.push(id);
    s.menuOff = s.menuOff.filter((x) => x !== id);
  } else {
    if (s.menu.filter((x) => !DISHES[x]?.special && x !== id).length < 1) return { err: "last-dish" };
    s.menu = s.menu.filter((x) => x !== id);
    if (!s.menuOff.includes(id)) s.menuOff.push(id);
  }
  ev.push({ type: "menu", id, on: want });
  return { ok: true, on: want };
}

// ---------- tủ kính giữ ấm (cấp 3) ----------
/** Tủ kính còn chỗ (có mua, đang mở ca). */
export const caseRoom = (s) => !!s.shift?.case && s.shift.case.length < GLASS_CASE.size;
/** Cất miếng chín từ vỉ vào tủ kính (vùng ấm đã đầy). Không có tủ / tủ đầy ⇒ lỗi như cũ. */
export function toCase(s, slot, ev = []) {
  const sh = s.shift, g = sh.grill, it = g.slots[slot];
  if (!it) return { err: "empty-slot" };
  if (!sh.case) return { err: "warm-full" };
  if (sh.case.length >= GLASS_CASE.size) return { err: "case-full" };
  if (!isCooked(it)) return { err: "not-cooked" };
  g.slots[slot] = null;
  sh.case.push({ ...it, warmMs: 0, caseT: sh.t });
  ev.push({ type: "toCase", slot, n: sh.case.length });
  if (sh.case.length === 1 || next(s) < 0.25) ev.push({ type: "say", text: freshLine(s, LM.CASE_LINES, {}), kind: "" });
  return { ok: true };
}

// ---------- bày ×N cho bàn cùng món (ô bày đôi cấp 6, khay mâm cấp 10) ----------
/** Phiếu cùng bàn, cùng món, cùng dặn riêng, chưa bày — gom chung một lượt bày với phiếu tk. Món có trứng chiên từng quả nên không gom. */
export function batchCandidates(s, tk) {
  const sh = s.shift;
  if (!sh || batchMax(s) < 2) return [];
  const t = ticketOf(s, tk);
  if (!t || t.catering || t.takeaway || t.gid === null || DISHES[t.dish]?.trung) return [];
  const key = (x) => x.dish + "|" + [...(x.quirks || [])].sort().join(",");
  const busy = new Set(sh.slots.flatMap((x) => [x.tk, ...(x.batchTks || [])]).filter((x) => x !== null && x !== undefined));
  return sh.tickets.filter((x) => x.id !== tk && x.gid === t.gid && x.status === "open" && !busy.has(x.id) && key(x) === key(t)).slice(0, batchMax(s) - 1).map((x) => x.id);
}
export const isTableBatch = (s) => { const sl = s.shift?.slots[s.shift.sel]; return !!(sl && sl.tk !== null && sl.batchTks?.length); };
/** Bật / tắt bày ×N cho phiếu đang ghim (trước khi đặt dĩa). */
export function batchPin(s, on, ev = []) {
  const sh = s.shift, sl = sh.slots[sh.sel];
  if (sl.tk === null) return { err: "no-ticket" };
  if (sl.plate) return { err: "has-container" };
  releaseBatch(s, sl);
  if (!on) { ev.push({ type: "batch", n: 1 }); return { ok: true, n: 1 }; }
  const ids = batchCandidates(s, sl.tk);
  if (!ids.length) return { err: "no-batch" };
  sl.batchTks = ids;
  for (const id of ids) { const t = ticketOf(s, id); if (t) t.status = "pinned"; }
  ev.push({ type: "batch", n: 1 + ids.length });
  return { ok: true, n: 1 + ids.length };
}
/** Trả các phiếu gom về hàng chờ (khi ghim phiếu khác / tắt ×N / bưng xong dĩa thiếu). */
export function releaseBatch(s, sl, keep = 0) {
  for (const id of (sl.batchTks || []).slice(keep)) { const t = ticketOf(s, id); if (t && t.status === "pinned") t.status = "open"; }
  sl.batchTks = keep ? sl.batchTks.slice(0, keep) : null;
}
/** Bưng cả lượt ×N một chuyến (khay): mỗi dĩa đúng phiếu của người đó. */
export function serveTableBatch(s, ev = []) {
  const sh = s.shift, sl = sh.slots[sh.sel];
  const t = ticketOf(s, sl.tk);
  if (!t || !sl.plate) return { err: sl.plate ? "bad-ticket" : "need-container" };
  const extra = (sl.batch || []).map((p, i) => ({ tk: sl.batchTks[i], plate: { ...p, tk: sl.batchTks[i] } })).filter((x) => x.tk !== undefined);
  const r = enqueue(s, { kind: "deliver", tid: t.tid, tk: t.id, pid: sh.nextPid++, plate: sl.plate, pickup: true, more: extra, tray: true }, ev);
  if (r.err) return r;
  t.status = "carrying";
  for (const x of extra) { const tt = ticketOf(s, x.tk); if (tt) tt.status = "carrying"; }
  releaseBatch(s, sl, extra.length);
  sl.batchTks = null; sl.batch = null; sl.plate = null; sl.tk = null;
  ev.push({ type: "serving", tk: t.id, tid: t.tid, batch: 1 + extra.length });
  return { ok: true };
}

// ---------- sổ nợ chung (nợ Anh Sáu của Drama vào sổ nợ thật) ----------
const NPC_NAME = { "anh-sau": "Anh Sáu", khach: "Khách quen" };
/** fx.debt của Drama ({ who, k, clear }) ghi vào sổ nợ thật s.debts (drama: true ⇒ không tự trả ngẫu nhiên lúc sang ngày, trả theo chuỗi sự kiện). */
export function dramaDebt(s, fx) {
  const who = fx?.who || "khach", k = Math.round(fx?.k || 0);
  s.debts = Array.isArray(s.debts) ? s.debts : [];
  if (fx.clear) s.debts = s.debts.filter((d) => d.id !== who);
  else if (k > 0) s.debts.push({ id: who, name: NPC_NAME[who] || who, amount: k, day: Math.max(1, s.day || 1), drama: true });
  else if (k < 0) {
    let left = -k;
    for (const d of s.debts.filter((x) => x.id === who).sort((a, b) => a.day - b.day)) { const take = Math.min(left, d.amount); d.amount -= take; left -= take; if (!left) break; }
    s.debts = s.debts.filter((d) => d.amount > 0);
  }
  syncDebtFlags(s, [who]);
}

// ---------- đồ trang trí Drama tặng ----------
/** fx.decor ⇒ đồ kéo thả (DECOR, event: true). "mai-bat" (mái bạt Drama dựng) = có mái bạt. Trả true nếu thành đồ. */
export function grantDramaDecor(s, id) {
  if (id === "mai-bat") { s.owned = { ...(s.owned || {}), awning: true }; return true; }
  if (!DECOR[id]) return false;
  s.decor = { ...(s.decor || {}), [id]: true };
  return true;
}
/** Frame decor.webp cho một món (đồ Drama dùng tạm frame gần giống tới khi có art riêng). */
export const decorFrame = (id) => DECOR[id]?.art || id;

// ---------- hội chợ (cấp 18) ----------
export { FAIR };
export const fairToday = (s) => s.fair?.day === s.day;
export const nextFairDay = (s) => (!s.fair?.day ? s.day : Math.max(s.day, s.fair.day + FAIR.every));
export const fairAvailable = (s) => s.level >= FAIR.level && s.stage === "quan" && !s.shift && s.shiftIdx === 0 && !s.dayDone && !fairToday(s) && nextFairDay(s) <= s.day;
/** Thuê gian hội chợ: ca tối hôm nay thành "Đêm hội ẩm thực bờ sông". */
export function rentFair(s, ev = []) {
  if (s.shift) return { err: "in-shift" };
  if (s.level < FAIR.level || s.stage !== "quan") return { err: "locked" };
  if (fairToday(s)) return { err: "already" };
  if (s.shiftIdx > 0 || s.dayDone) return { err: "day-started" };
  if (nextFairDay(s) > s.day) return { err: "too-soon" };
  if (s.money < FAIR.price) return { err: "money" };
  s.money -= FAIR.price; s.stats.spentGear += FAIR.price;
  s.fair = { day: s.day, count: (s.fair?.count || 0) + 1 };
  if (!s.plan.includes("toi")) s.plan = [...s.plan, "toi"];
  if (s.challenge?.day === s.day) s.challenge = null; // hội chợ và thử thách không chung ngày
  ev.push({ type: "fair", count: s.fair.count, price: FAIR.price });
  return { ok: true };
}
function startFair(s, sh, ev) {
  const old = sh.len;
  sh.fair = true; sh.len = FAIR.ms;
  for (const g of sh.schedule) { g.at = Math.round(g.at * (FAIR.ms / old)); g.patienceMul = (g.patienceMul || 1) * FAIR.patienceMul; }
  const roles = Object.keys(ARCHETYPES).filter((a) => { const A = ARCHETYPES[a]; return A.unlock <= s.level && !A.takeaway && (A.minRep || 0) <= s.rep; });
  let people = 0;
  while (people < FAIR.guests && roles.length) {
    const arch = weighted(s, roles.map((a) => ({ a, w: ARCHETYPES[a].shifts.toi || 0.2 }))).a;
    const A = ARCHETYPES[arch];
    const n = FAIR.group[0] + int(s, FAIR.group[1] - FAIR.group[0] + 1);
    const rs = [arch]; for (let i = 1; i < n; i++) rs.push(A.mates.length ? A.mates[int(s, A.mates.length)] : arch);
    sh.schedule.push({ at: Math.round(FAIR.ms * (0.04 + next(s) * 0.8)), arch, roles: rs, patienceMul: FAIR.patienceMul, tag: "fair", line: fill(freshLine(s, LM.FAIR_SAY, {}), { n, self: A.self, call: A.call }) });
    people += n;
  }
  sh.schedule.sort((a, b) => a.at - b.at);
  ev.push({ type: "say", text: freshLine(s, LM.FAIR_OPEN, { shop: s.shopName }), kind: "good" });
}

// ---------- ca thử thách (cấp 20) ----------
export const CHALLENGES = [
  { id: "mot-bep", name: "Một bếp, ca khuya", shift: "toi", desc: "Chỉ dùng bếp 1, ca khuya kéo dài, thêm 4 khách khuya. Đạt: ca tối bán ≥ 18 dĩa, tối đa 3 người bỏ về.",
    goal: (S) => S.plates >= 18 && S.lost <= 3 },
  { id: "khong-chay", name: "Không cháy miếng nào", shift: "toi", desc: "Đạt: ca tối bán ≥ 16 dĩa, không miếng nào cháy đen.", goal: (S) => S.plates >= 16 && S.burnt === 0 },
  { id: "trua-khong-phu", name: "Trưa không phụ bàn", shift: "trua", desc: "Ca trưa không có Bông, Dì Năm (không tính lương). Đạt: ca trưa bán ≥ 14 dĩa, tối đa 2 người bỏ về.",
    goal: (S) => S.plates >= 14 && S.lost <= 2 },
  { id: "toan-mang-ve", name: "Ngày toàn mang về", shift: "toi", desc: "Ca tối chỉ có shipper lấy hộp mang về. Đạt: giao ≥ 14 hộp, sai không quá 1 hộp.",
    goal: (S) => S.takeaway >= 14 && Object.values(S.mistakes || {}).reduce((a, b) => a + b, 0) <= 1 },
  { id: "mam-40", name: "Mâm 40 phần", shift: "toi", desc: "Một mâm cơm công ty 40 phần giao trong ca tối (không cọc, trả đủ khi giao). Đạt: giao đủ 40 phần đúng giờ.",
    goal: (S) => (S.orders || []).some((o) => o.challenge && o.status === "done" && o.done >= o.n) },
];
export const CHALLENGE_BY_ID = Object.fromEntries(CHALLENGES.map((c) => [c.id, c]));
/** Thử thách trên lịch hôm nay (null nếu chưa tới cấp 20 / đang mở ca). */
export function challengeToday(s) {
  if (s.level < CHALLENGE.level || s.shift) return null;
  return CHALLENGES[s.day % CHALLENGES.length];
}
/** Lịch 5 ngày tới (bảng Chuẩn bị). */
export const challengeWeek = (s) => Array.from({ length: CHALLENGES.length }, (_, i) => ({ day: s.day + i, ...CHALLENGES[(s.day + i) % CHALLENGES.length] }));
export const activeChallenge = (s) => (s.challenge?.day === s.day && CHALLENGE_BY_ID[s.challenge.id]) || null;
/** Nhận / bỏ thử thách hôm nay (trước ca đầu ngày). Thử thách ca trưa tự mở ca trưa. */
export function setChallenge(s, on, ev = []) {
  if (s.shift) return { err: "in-shift" };
  if (s.level < CHALLENGE.level) return { err: "locked" };
  if (s.shiftIdx > 0 || s.dayDone) return { err: "day-started" };
  if (!on) { s.challenge = null; ev.push({ type: "challenge", on: false }); return { ok: true }; }
  if (fairToday(s)) return { err: "fair-day" };
  const c = challengeToday(s);
  s.challenge = { id: c.id, day: s.day };
  if (c.shift === "trua" && !s.plan.includes("trua")) s.plan = ["trua", ...s.plan.filter((k) => k !== "trua")];
  ev.push({ type: "challenge", on: true, id: c.id, name: c.name });
  return { ok: true };
}
function startChallenge(s, sh, c, ev) {
  sh.challengeId = c.id;
  if (c.id === "mot-bep") {
    if (sh.grill.slots.length >= GRILL.slots * 2) { sh.grill.slots.splice(GRILL.slots, GRILL.slots); delete sh.grill.coal2; }
    if (!sh.late) { sh.len += LATE.extraMs; sh.late = true; }
    const roles = ["worker", "worker2", "driver", "regular"].filter((a) => ARCHETYPES[a].unlock <= s.level);
    for (let i = 0; i < 4; i++) { const a = roles[int(s, roles.length)]; sh.schedule.push({ at: Math.round(sh.len * (0.62 + next(s) * 0.3)), arch: a, roles: [a], patienceMul: 1, tag: "extra" }); }
  } else if (c.id === "trua-khong-phu") {
    sh.noStaff = { bong: !!sh.helper, "di-nam": !!sh.dishwasher };
    sh.helper = null; sh.dishwasher = false;
  } else if (c.id === "toan-mang-ve") {
    for (const g of sh.schedule) if (!g.tag && !ARCHETYPES[g.arch]?.takeaway) { const n = Math.min(3, g.roles.length); g.arch = "shipper"; g.roles = Array.from({ length: n }, () => "shipper"); }
  } else if (c.id === "mam-40") {
    if (openDramaOrder(s, { n: 40, arch: "office", label: "Mâm 40 phần (thử thách)", at: 0.4, id: "thu-thach" }, ev)) {
      const o = s.orders[s.orders.length - 1];
      o.deposit = 0; o.challenge = true; o.drama = null; o.dueFrac = 0.85; o.dueT = Math.round(sh.len * 0.85);
    }
  }
  sh.schedule.sort((a, b) => a.at - b.at);
  ev.push({ type: "say", text: `Thử thách hôm nay: ${c.name}.`, kind: "good" });
}
/** Chốt ca thử thách: xét mục tiêu, thưởng (tiền + XP; lần đầu nhiều hơn + huy hiệu). */
function judgeChallenge(s, sh, sum, ev) {
  const c = CHALLENGE_BY_ID[sh.challengeId];
  if (!c) return null;
  const ok = !!c.goal(sum);
  const first = ok && !s.badges?.["tt-" + c.id];
  const R = ok ? (first ? CHALLENGE.firstReward : CHALLENGE.reward) : { money: 0, xp: 0 };
  if (ok) { s.money += R.money; gainXp(s, R.xp, ev); s.stats.challenges = (s.stats.challenges || 0) + 1; }
  const line = freshLine(s, LM.CHALLENGE_TEXT[c.id][ok ? "win" : "lose"], {});
  ev.push({ type: "challengeDone", id: c.id, ok, money: R.money, xp: R.xp });
  return { id: c.id, name: c.name, ok, money: R.money, xp: R.xp, first, line };
}

// ---------- huy hiệu (14) ----------
export const BADGES = [
  { id: "chu-quan", name: "Chủ Quán", desc: "Lên cấp 20", test: (s) => s.level >= 20 },
  { id: "khong-bo-ve", name: "Không ai bỏ về", desc: "Một ca bán ≥ 14 dĩa, không ai bỏ về", test: (s, S) => !!S && S.plates >= 14 && S.lost === 0 && S.timeouts === 0 },
  { id: "nam-sao", name: "Ca năm sao", desc: "Một ca bán ≥ 12 dĩa, trung bình ≥ 4,8 sao", test: (s, S) => !!S && S.plates >= 12 && S.avg >= 4.8 },
  { id: "tay-nuong", name: "Tay nướng vàng", desc: "Một ca lật đúng lúc ≥ 12 lần, không miếng nào cháy", test: (s, S) => !!S && S.perfectFlips >= 12 && S.burnt === 0 },
  { id: "mam-tron", name: "Mâm tròn đúng hẹn", desc: "Giao 5 đơn đặt / mâm cơm đúng giờ", test: (s) => (s.stats?.ordersDone || 0) >= 5 },
  { id: "hoi-cho", name: "Ngôi sao hội chợ", desc: "Một đêm hội chợ trung bình ≥ 4 sao", test: (s, S) => !!S && S.fair && S.avg >= 4 },
  { id: "hoi-cho-5", name: "Gian hàng quen mặt", desc: "Dự 5 lần hội chợ", test: (s) => (s.fair?.count || 0) >= 5 },
  { id: "ket-sat", name: "Két sắt nặng tay", desc: "Có 3.000k tiền mặt", test: (s) => s.money >= 3000 },
  { id: "hang-max", name: "Quán Chủ Quán", desc: `Lên hạng quán cao nhất (${TIERS.length}/${TIERS.length})`, test: (s) => (s.tier || 0) >= TIERS.length },
  ...CHALLENGES.map((c) => ({ id: "tt-" + c.id, name: `Thử thách: ${c.name}`, desc: c.desc.replace(/^.*Đạt: /, "Đạt: "), test: (s, S) => !!(S?.challenge?.ok && S.challenge.id === c.id) })),
];
export const BADGE = Object.fromEntries(BADGES.map((b) => [b.id, b]));
/** Xét huy hiệu mới (chốt ca: S = bảng chốt ca; mua hạng: S = null). Trả danh sách vừa nhận. */
export function checkBadges(s, S, ev = []) {
  s.badges = s.badges || {};
  const got = [];
  for (const b of BADGES) {
    if (s.badges[b.id] || !b.test(s, S)) continue;
    s.badges[b.id] = s.day;
    const line = fill(freshLine(s, LM.BADGE_LINES, {}), { badge: b.name });
    got.push({ id: b.id, name: b.name, line });
    ev.push({ type: "badge", id: b.id, name: b.name, line });
    dayMoment(s, { kind: "badge", who: "", line }); // C: khoảnh khắc Nhật Ký
  }
  return got;
}

// ---------- móc vào nhịp ca ----------
/** core/shift.js startShift ⇒ sau PG.onStart (A đã thêm chỗ bếp 2, phụ bàn, đơn mâm). */
export function onStart(s, ev) {
  const sh = s.shift, g = sh.grill;
  const c = activeChallenge(s);
  if (c && c.shift === sh.kind) startChallenge(s, sh, c, ev);
  if (g.slots.length >= GRILL.slots * 2) { g.coal2 = s.kitchen?.coal2 || 0; g.pending2 = []; g.flareUntil2 = 0; } // bếp 2 than riêng
  if (owns(s, "veg-grill") && s.level >= GEAR["veg-grill"].level) { g.vegFrom = g.slots.length; g.slots.push(null, null); }
  g.meatSlots = {};
  if (owns(s, "glass-case")) sh.case = [];
  if (fairToday(s) && sh.kind === "toi") startFair(s, sh, ev);
}
/** core/shift.js tick ⇒ tủ kính: tươi giảm chậm (1 mỗi 5 giây), không cháy. */
export function onTick(s, dt) {
  for (const it of s.shift.case || []) it.fresh = Math.max(0, it.fresh - dt / GLASS_CASE.freshDecayMs);
}
/** core/shift.js endShift ⇒ miếng trong tủ kính cuối ca thành hao. */
export function beforeEnd(s, ev, addWaste) {
  const sh = s.shift;
  for (const it of sh.case || []) addWaste(sh, it.item === "suon" ? "suon-uop" : it.item, 1);
  if (sh.case) sh.case = [];
}
/** core/shift.js endShift ⇒ sau PG.afterEnd: hội chợ, thử thách, huy hiệu. */
export function afterEnd(s, sh, sum, ev) {
  sum.fair = !!sh.fair;
  sum.perfectFlips = sh.stats.perfectFlips || 0;
  if (sh.fair) {
    const k = sum.avg >= 4.3 && sum.lost <= 3 ? "great" : sum.avg >= 3.2 ? "ok" : "bad";
    sum.fairLine = freshLine(s, LM.FAIR_DONE[k], {});
  }
  if (sh.noStaff) { // thử thách trưa không phụ bàn: hoàn lương ca trưa
    const back = (sh.noStaff.bong && staffToday(s, "bong") ? STAFF.bong.price : 0) + (sh.noStaff["di-nam"] && staffToday(s, "di-nam") ? STAFF["di-nam"].price : 0);
    if (back) { s.money += back; sum.staff = Math.max(0, (sum.staff || 0) - back); sum.profit += back; }
  }
  if (sh.challengeId) {
    sum.challenge = judgeChallenge(s, sh, sum, ev);
    if (sum.challenge) dayMoment(s, { kind: "challenge", who: "", line: `${sum.challenge.name}: ${sum.challenge.ok ? "đạt" : "chưa đạt"}. ${sum.challenge.line}` });
  }
  sum.badges = checkBadges(s, sum, ev);
  sum.money = s.money;
}
/** core/apply.js ⇒ sau mỗi action thành công (sau A). Giá hội chợ, review hội chợ / nước mắm nhà pha, huy hiệu khi mua hạng. */
export function afterApply(s, action, events) {
  const ev = [];
  for (const e of events) {
    if (e.type === "tier" || e.type === "fishSauce") checkBadges(s, null, ev);
    const sh = s.shift;
    if (!sh) continue;
    if (e.type === "ordered" && sh.fair) for (const t of sh.tickets) if (t.gid === e.gid && !t.fairMul) t.fairMul = FAIR.priceMul;
    if (e.type === "groupDone") {
      const top = s.feed[0], g = sh.groups.find((x) => x.id === e.gid);
      if (!top || !g || top.day !== s.day || top.mech || !g.members.some((m) => m.name === top.name) || (top.mistake && top.stars <= 3)) continue;
      if (sh.fair && next(s) < 0.6) { top.line = freshLine(s, LM.FAIR_REVIEW[top.stars >= 5 ? "great" : top.stars >= 3 ? "ok" : "bad"], {}); top.mech = "fair"; }
      else if ((s.fishSauce || 0) > 0 && top.stars >= 4 && !g.takeaway && next(s) < 0.2 + 0.1 * s.fishSauce) { top.line = freshLine(s, LM.FISH_SAUCE_REVIEW, {}); top.mech = "fish-sauce"; }
    }
  }
  events.push(...ev);
}

/** Thao tác mới / bọc lại cho core/apply.js (gộp sau aHandlers nên bọc được bản của A). */
export function sHandlers({ noShift, noDialog, ownerOnly, outToDialog, pl, sh, autoStep }) {
  return {
    toggleDish: noShift((s, a, ev) => toggleDish(s, a.id, a.on, ev)),
    fair: noShift((s, a, ev) => rentFair(s, ev)),
    challenge: noShift((s, a, ev) => setChallenge(s, a.on !== false, ev)),
    batchPin: noDialog((s, a, ev) => (batchMax(s) < 2 ? { err: "locked" } : batchPin(s, a.on !== false, ev))),
    // ghim phiếu khác ⇒ trả phiếu đang gom ×N về hàng chờ
    pin: noDialog((s, a, ev) => { const slot = slotOf(s); if (slot.batchTks?.length && slot.tk !== a.tk && !slot.plate) releaseBatch(s, slot); return pl.pin(s, a.tk, ev); }),
    // bày ×N cho bàn (ngoài mâm cơm của A): mỗi lớp áp cho cả hàng, bưng một chuyến
    autoStep: ownerOnly((s, a, ev) => {
      if (isTableBatch(s)) {
        const n = pl.nextStep(s);
        if (n === "serve") return serveTableBatch(s, ev);
        if (n && n !== "grill" && n !== "egg" && !n.startsWith("wait")) return outToDialog(s, batchLayerS(s, n, ev, pl.layer), ev);
        return autoStep(s, ev);
      }
      return HAND.autoStep(s, a, ev);
    }),
    serve: noDialog((s, a, ev) => (isTableBatch(s) ? serveTableBatch(s, ev) : HAND.serve(s, a, ev))),
  };
}
/** core/apply.js cấp bản autoStep / serve của A để bọc lại (tránh vòng import). */
export const HAND = { autoStep: null, serve: null, batchLayer: null };
const batchLayerS = (s, id, ev, layerFn) => HAND.batchLayer(s, id, ev, layerFn);
export { zoneOf, targetOf };
