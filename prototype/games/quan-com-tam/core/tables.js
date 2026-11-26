// Phục vụ tại bàn (GAME-DESIGN §3.4): khách tới → đứng chờ bàn → (chạm khách, chạm bàn) ngồi → châm trà + lấy phiếu → chờ món → ăn
// → gọi thêm (thêm cơm, khăn lạnh) → gọi tính tiền → trả tiền → về, để lại bàn dơ → dọn + lau → bàn sạch. Dĩa dơ vào thau, rửa mới có dĩa sạch.
// Mọi việc của cô chủ ở bàn đi qua hàng đợi việc (core/walker.js): tốn thời gian đi + làm, trong lúc đó bếp vẫn chạy.
// Thuần: không DOM; câu thoại chọn bằng freshLine; số liệu ở data/economy.js (SERVICE) và data/customers.js.
import { SERVICE, DISHES, EXTRAS, STOCK, GEAR, TABLE_GEAR, XP_SHARE } from "../data/economy.js?v=c8";
import { ARCHETYPES, QUIRKS } from "../data/customers.js?v=c8";
import { guestIn, guestToSeat, guestOut, shipperIn, shipperOut, pathLen, dist } from "./placements.js?v=c8";
import { enqueue, pointsOf } from "./walker.js?v=c8";
import { next, int } from "./rng.js?v=c8";
import { freshLine } from "./text.js?v=c8";
import { pool, ORDER, ARRIVE, WAIT_LONG, SEATED_WAIT, TEA_CALL, FOOD_LATE, REQUEST, BILL_CALL, HAPPY, UNHAPPY, TIMEOUT, SOLD_OUT, NHU_CU } from "../data/lines.js?v=c8";
import { MISTAKE_SAY, MISTAKE_REVIEW } from "../data/lines-mistakes.js?v=c8";
import { REVIEWS, TIMEOUT_REVIEW, SOLD_OUT_REVIEW } from "../data/lines-reviews.js?v=c8";
import { makeBill, settle, ticketPrice } from "./bill.js?v=c8";
import { scorePlate, servicePoints, finalStars, worstMistake, MISTAKES } from "./score.js?v=c8";
import { addWaste } from "./plate.js?v=c8";
import { takeRice } from "./rice.js?v=c8";
import { gainXp } from "./progress.js?v=c8";
import { pushReview, reviewPool } from "./reviews.js?v=c8"; // C: sổ review + lý do review
import * as PG from "./progression.js?v=c8"; // A: bàn quán theo đồ mua, ghép bàn, chỗ chờ, cơm chiên, nồi canh

// s.shift có thể đã null (event "paid" phát cùng nhịp với chốt ca, TLC22-01) ⇒ trả null, không ném lỗi
export const groupById = (s, gid) => s.shift?.groups.find((g) => g.id === gid) || null;
export const tableById = (s, tid) => s.shift?.tables.find((t) => t.id === tid) || null;
export const tablePoint = (s, tid) => pointsOf(s).tables.find((t) => t.id === tid) || null;
export const memberOfTicket = (g, tk) => g?.members.find((m) => m.tk === tk) || null;
const say = (s, g, list, ctx = {}, who = 0) => {
  const m = g.members[who] || g.members[0];
  const text = freshLine(s, list, { self: m.self, call: m.call, name: m.name, n: g.size, ...ctx });
  g.say = { text, at: s.shift.t, who };
  return text;
};
const lineCtx = (m) => ({ self: m.self, call: m.call, name: m.name });

/** Bàn đang dùng được: theo cấp (unlock trong manifest) + đồ đã mua (bàn 3, bàn 4 ở vỉa hè). */
export function availableTables(s) {
  return pointsOf(s).tables.filter((t) => PG.tableUnlocked(s, t)); // A: quán: bàn 4 / bàn 5 cần mua
}
export const freshTable = (p) => ({ id: p.id, seats: p.seats, state: "clean", gid: null, plates: 0, dirtyT: null, wetUntil: 0 });
export const tableFree = (t) => t && t.gid === null && t.state !== "dirty";

// ---------- khách tới ----------
/** Chỗ đứng đang có người (chỗ chờ tính theo người: vỉa hè 2 chỗ = tối đa 2 người đứng chờ). */
function usedSpots(sh, kind) { return new Set(sh.groups.filter((g) => (g.phase === "enter" || g.phase === "wait" || g.phase === "queue") && (kind === "queue" ? g.takeaway : !g.takeaway)).flatMap((g) => g.spots || [g.spot])); }
/** Một nhóm khách tới theo lịch. Trả false nếu không còn chỗ đứng chờ (lịch sẽ hẹn lại). */
export function spawnGroup(s, plan, ev = []) {
  const sh = s.shift, P = pointsOf(s);
  const A = ARCHETYPES[plan.arch];
  if (!A) return true;
  const takeaway = !!A.takeaway;
  const spotList = takeaway ? P.queueSpots : P.waitSpots;
  const used = usedSpots(sh, takeaway ? "queue" : "wait");
  const cap = takeaway ? spotList.length : Math.min(spotList.length, PG.waitMax(s)); // A: ghế chờ (cấp 16) ⇒ 4
  const free = [];
  for (let i = 0; i < cap; i++) if (!used.has(i)) free.push(i);
  const size = (plan.roles || [plan.arch]).length;
  // đủ chỗ cho cả nhóm; nhóm đông hơn số chỗ chỉ vào khi không ai đang đứng chờ (đứng dồn lại)
  if (!free.length || (free.length < size && free.length < cap)) return false;
  const spots = free.slice(0, size);
  const spot = spots[0];
  const taken = new Set(sh.groups.flatMap((g) => g.members.map((m) => m.name)));
  const members = (plan.roles || [plan.arch]).map((role, idx) => {
    const R = ARCHETYPES[role] || A;
    let name = (idx === 0 && plan.name && !taken.has(plan.name) ? plan.name : null) || R.names.find((n) => !taken.has(n)) || `${R.names[0]} ${idx + 2}`; // C: khách quay lại giữ tên
    taken.add(name);
    return { idx, role, name, self: R.self, call: R.call, tk: null, tea: "empty", teaT: 0, teaEmpty: null, noTea: false, dirty: false, plate: null, eatUntil: null, eatMs: 0, eaten: false, req: null, reqDone: false, extras: { com: 0, khan: 0 }, score: null, bonus: 0 };
  });
  const path = takeaway ? shipperIn(P, spotList[spot]) : guestIn(P, spotList[spot]);
  const g = {
    id: sh.nextGid++, arch: plan.arch, size: members.length, members, takeaway, phase: "enter", t0: sh.t, walkMs: (pathLen(path) / SERVICE.guestSpeed) * 1000,
    spot, spots, table: null, arriveT: null, seatT: null, orderT: null, firstTeaT: null, billT: null, used: 0, patienceMs: Math.round(A.patience * 1000 * (plan.patienceMul || 1) * SERVICE.patienceMul), // S (M5): kiên nhẫn chung
    said: {}, say: plan.line ? { text: plan.line, at: sh.t, who: 0 } : null, tag: plan.tag || null, // C: câu khách quay lại
    paid: false, leaveT: null, outcome: null,
  };
  sh.groups.push(g);
  ev.push({ type: "arrive", gid: g.id, arch: g.arch, size: g.size, takeaway });
  return true;
}

// ---------- xếp chỗ ----------
export function canSeat(s, g, t) { return !!g && g.phase === "wait" && !g.takeaway && tableFree(t) && (t.seats >= g.size || PG.canJoin(s, g, t)); } // A: ghép bàn
export function seat(s, gid, tid, ev = []) {
  const sh = s.shift, g = groupById(s, gid), t = tableById(s, tid);
  if (!g || g.phase !== "wait" || g.takeaway) return { err: "not-waiting" };
  if (!t) return { err: "bad-table" };
  if (t.gid !== null) return { err: "table-taken" };
  if (t.state === "dirty") return { err: "table-dirty" };
  if (t.seats < g.size && !PG.canJoin(s, g, t)) return { err: "table-small" };
  if (t.seats < g.size) PG.joinTables(s, g, t, ev); // A: ghép bàn bên cạnh
  const P = pointsOf(s), tp = tablePoint(s, tid);
  const from = P.waitSpots[g.spot] || P.entry;
  g.walkMs = (pathLen(guestToSeat(P, from, tp.seatSpots[0].at)) / SERVICE.guestSpeed) * 1000;
  g.phase = "toTable"; g.table = tid; g.seat0 = sh.t; t.gid = gid;
  g.wetSeat = t.state === "wet";
  ev.push({ type: "seated", gid, tid });
  return { ok: true };
}
/** Nhóm đang chờ đầu tiên vừa bàn này. */
export const firstFit = (s, t) => s.shift.groups.find((g) => canSeat(s, g, t)) || null;

/** Việc đang chờ của bàn (chạm bàn = làm việc này). */
export function tableJob(s, tid) {
  const sh = s.shift, t = tableById(s, tid);
  if (!t || t.joinOf) return null; // A: bàn ghép theo bàn chính
  if (t.state === "dirty" && t.gid === null) return "clean";
  if (t.gid === null) return firstFit(s, t) ? "seat" : null;
  const g = groupById(s, t.gid);
  if (!g || g.phase !== "seated") return null;
  if (g.billT !== null && !g.paid) return "bill";
  if (needsVisit(s, g)) return "visit";
  if (g.members.some((m) => m.req?.kind === "com")) return "rice";
  return null;
}
export function needsVisit(s, g) {
  if (g.phase !== "seated" || g.paid) return false;
  if (g.orderT === null) return true;
  if (g.billT === null && g.members.some((m) => m.tea === "empty" && !m.eaten)) return true;
  return g.members.some((m) => m.req?.kind === "khan");
}
/** Chạm bàn: mời ngồi (nhóm đang chọn hoặc nhóm đầu tiên vừa bàn) hoặc giao việc đang chờ cho cô chủ. */
export function tableTap(s, tid, ev = [], gid = null) {
  const t = tableById(s, tid);
  if (!t) return { err: "bad-table" };
  if (gid !== null && gid !== undefined) return seat(s, gid, tid, ev);
  const job = tableJob(s, tid);
  if (!job) return { err: t.gid === null ? (t.state === "dirty" ? "table-dirty" : "no-guest") : "no-job" };
  if (job === "seat") return seat(s, firstFit(s, t).id, tid, ev);
  return enqueue(s, { kind: job, tid, ...(job === "rice" ? { pickup: true } : {}) }, ev);
}

// ---------- việc của cô chủ (bảng cho core/walker.js) ----------
const servePt = (s, task) => tablePoint(s, task.tid)?.servePoint || null;
const seatedGroup = (s, tid) => { const t = tableById(s, tid); const g = t && t.gid !== null ? groupById(s, t.gid) : null; return g && g.phase === "seated" && !g.paid ? g : null; };
export const TASKS = {
  visit: {
    target: servePt,
    start: (s, task) => (seatedGroup(s, task.tid) && needsVisit(s, seatedGroup(s, task.tid)) ? { ok: true } : { err: "nothing" }),
    ms: (s, task) => {
      const g = seatedGroup(s, task.tid);
      if (!g) return 0;
      let ms = 0;
      if (g.members.some((m) => m.tea !== "full" && !m.eaten)) ms += SERVICE.pourMs;
      if (g.orderT === null) ms += SERVICE.orderMs;
      if (g.members.some((m) => m.req?.kind === "khan")) ms += SERVICE.khanMs;
      return ms;
    },
    done: (s, task, ev) => visitDone(s, task.tid, ev),
  },
  deliver: {
    target: servePt,
    start: (s, task) => (seatedGroup(s, task.tid) ? { ok: true } : { err: "gone" }),
    drop: (s, task, ev) => { dropPlate(s, task.plate, ev); for (const x of task.more || []) dropPlate(s, x.plate, ev); },
    ms: (s, task) => SERVICE.deliverMs * (1 + (task.more?.length || 0)),
    done: (s, task, ev) => { deliverPlate(s, task, ev); for (const x of task.more || []) deliverPlate(s, { ...task, tk: x.tk, plate: x.plate, more: null }, ev); }, // S: dĩa thứ hai cùng chuyến
  },
  bill: {
    target: servePt,
    start: (s, task) => { const g = seatedGroup(s, task.tid); return g && g.billT !== null ? { ok: true } : { err: "nothing" }; },
    ms: () => SERVICE.billMs,
    done: (s, task, ev) => { const g = seatedGroup(s, task.tid); if (!g) { s.shift.owner.task = null; return; } s.shift.billing = makeBill(s, g); ev.push({ type: "billOpen", gid: g.id, tid: task.tid }); },
    hold: true,
  },
  clean: {
    target: servePt,
    start: (s, task) => (tableById(s, task.tid)?.state === "dirty" ? { ok: true } : { err: "clean" }),
    ms: () => SERVICE.clearMs + SERVICE.wipeMs,
    done: (s, task, ev) => {
      const sh = s.shift, t = tableById(s, task.tid);
      if (!t || t.state !== "dirty") return;
      sh.dirty += t.plates;
      ev.push({ type: "cleaned", tid: t.id, plates: t.plates, dirtyMs: sh.t - (t.dirtyT ?? sh.t) });
      sh.stats.maxDirtyMs = Math.max(sh.stats.maxDirtyMs, sh.t - (t.dirtyT ?? sh.t));
      t.plates = 0; t.state = "wet"; t.wetUntil = sh.t + SERVICE.wetMs; t.dirtyT = null;
    },
  },
  wash: {
    target: (s) => pointsOf(s)["wash-tub"],
    start: (s) => (s.shift.dirty > 0 ? { ok: true } : { err: "no-dirty" }),
    ms: (s) => Math.min(SERVICE.washBatch, s.shift.dirty) * SERVICE.washPerPlateMs,
    done: (s, task, ev) => {
      const sh = s.shift, n = Math.min(SERVICE.washBatch, sh.dirty);
      sh.dirty -= n; sh.cleanPlates += n; sh.stats.washed += n;
      ev.push({ type: "washed", n });
    },
  },
  rice: {
    target: servePt,
    start: (s, task) => {
      const g = seatedGroup(s, task.tid);
      const m = g?.members.find((x) => x.req?.kind === "com");
      if (!m) return { err: "nothing" };
      const r = takeRice(s.shift.rice, 1);
      if (r.err) return r;
      task.mi = m.idx;
      return { ok: true };
    },
    drop: (s, task, ev) => { if (task.mi !== undefined) addWaste(s.shift, "com", 1, STOCK["gao-tam"].cost); },
    ms: () => SERVICE.riceMs,
    done: (s, task, ev) => {
      const g = seatedGroup(s, task.tid);
      const m = g?.members[task.mi];
      if (!m) { addWaste(s.shift, "com", 1, STOCK["gao-tam"].cost); return; }
      m.extras.com++; m.req = null; m.reqDone = true;
      s.shift.stats.cogs += EXTRAS.com.cost;
      ev.push({ type: "extraServed", kind: "com", gid: g.id });
    },
  },
};

function pourTea(s, g, ev) {
  const sh = s.shift;
  let poured = 0;
  for (const m of g.members) {
    if (m.tea === "full" || m.eaten) continue;
    if ((s.stock.tra || 0) > 0) { s.stock.tra--; sh.stats.teaCost += STOCK.tra.cost; } else sh.stats.waterPours++;
    m.tea = "full"; m.teaT = sh.t; m.teaEmpty = null; poured++;
  }
  if (poured && g.firstTeaT === null) g.firstTeaT = sh.t;
  if (poured) ev.push({ type: "teaPoured", gid: g.id, n: poured, water: (s.stock.tra || 0) <= 0 });
}
function visitDone(s, tid, ev) {
  const sh = s.shift, g = seatedGroup(s, tid);
  if (!g) return;
  pourTea(s, g, ev);
  for (const m of g.members) if (m.req?.kind === "khan") {
    if ((s.stock["khan-lanh"] || 0) > 0) { s.stock["khan-lanh"]--; m.extras.khan++; sh.stats.cogs += STOCK["khan-lanh"].cost; ev.push({ type: "extraServed", kind: "khan", gid: g.id }); }
    m.req = null; m.reqDone = true;
  }
  if (g.orderT === null) takeOrder(s, g, ev);
}

// ---------- gọi món ----------
/** Món khách gọi được: đã mở theo cấp, có đủ trạm (chảo, xửng), chưa treo bảng hết. */
export function menu(s) {
  const on = (s.menu || ["com-suon"]).filter((id) => { const d = DISHES[id]; return d && !d.rescue && d.level <= s.level && (d.needs || []).every((k) => s.owned?.[k]); });
  return on.length ? on : ["com-suon"];
}
function rollQuirks(s, arch, dish) {
  const A = ARCHETYPES[arch], d = DISHES[dish], out = [];
  for (const [q, p] of Object.entries(A.quirks || {})) {
    const Q = QUIRKS[q];
    if (!Q || Q.level > s.level || out.length >= 2) continue;
    if (Q.need === "meat" && !d.meat) continue;
    if (Q.need && Q.need !== "meat" && !d[Q.need]) continue;
    if (Q.noVegan && d.vegan) continue;
    if ((Q.not || []).some((x) => out.includes(x))) continue;
    if (next(s) < p * (s.shift?.tutorial ? 0.5 : 1)) out.push(q);
  }
  return out;
}
export function makeTicket(s, g, m, ev = []) {
  const sh = s.shift;
  const dishes = menu(s);
  const fav = s.regulars?.[m.name]?.fav;
  let dish, quirks, nhuCu = false;
  if (fav && DISHES[fav.dish] && dishes.includes(fav.dish) && (s.regulars[m.name].good || 0) >= 2) { dish = fav.dish; quirks = fav.quirks.filter((q) => QUIRKS[q]); nhuCu = true; }
  else {
    dish = dishes.length ? dishes[int(s, dishes.length)] : "com-suon";
    // món mới mở hay được gọi hơn một chút
    if (dishes.length > 1 && next(s) < 0.35) dish = dishes[dishes.length - 1];
    dish = PG.pickDish(s, dish, dishes); // A: cơm chiên chỉ khi còn phần cơm dư
    quirks = rollQuirks(s, m.role, dish);
  }
  const t = { id: sh.nextTk++, gid: g.id, tid: g.table, mi: m.idx, name: m.name, role: m.role, dish, quirks, takeaway: !!g.takeaway, status: "open", orderT: sh.t, nhuCu };
  const quirkTxt = quirks.length ? ", " + quirks.map((q) => QUIRKS[q].text).join(", ") : "";
  t.line = nhuCu ? freshLine(s, NHU_CU, lineCtx(m)) : freshLine(s, pool(ORDER, m.role), { ...lineCtx(m), dish: DISHES[dish].name.toLocaleLowerCase("vi"), quirks: quirkTxt });
  sh.tickets.push(t);
  m.tk = t.id;
  return t;
}
function takeOrder(s, g, ev) {
  const sh = s.shift;
  g.orderT = sh.t; g.used = 0;
  for (const m of g.members) makeTicket(s, g, m, ev);
  const first = sh.tickets.find((x) => x.id === g.members[0].tk);
  g.say = { text: first.line, at: sh.t, who: 0 };
  ev.push({ type: "ordered", gid: g.id, tid: g.table, n: g.members.length });
}

// ---------- bưng dĩa ----------
function dropPlate(s, plate, ev) {
  if (!plate) return;
  const sh = s.shift;
  for (const [id, n] of Object.entries(plate.used || {})) addWaste(sh, id, n, id === "com" ? n * STOCK["gao-tam"].cost : id === "moHanh" ? n * 0.5 : undefined);
  if (plate.kind === "dia") sh.dirty++;
  ev.push({ type: "plateDropped" });
}
export function plateCost(used) {
  let c = 0;
  for (const [id, n] of Object.entries(used || {})) c += (id === "com" ? STOCK["gao-tam"].cost : id === "moHanh" ? 0.5 : STOCK[id]?.cost || 0) * n;
  return c;
}
/** Phiếu khác đang chờ (để nhận ra bưng nhầm bàn / tráo dĩa). */
function otherTickets(s, g, tk) {
  return s.shift.tickets.filter((x) => x.id !== tk && !x.catering && (x.status === "open" || x.status === "pinned")).map((x) => ({ ticket: x, sameTable: x.gid === g.id })); // A: bỏ phiếu mâm cơm
}
export function deliverPlate(s, task, ev) {
  const sh = s.shift, g = seatedGroup(s, task.tid);
  const t = sh.tickets.find((x) => x.id === task.tk);
  const m = memberOfTicket(g, task.tk);
  if (!g || !t || !m || t.status === "void") { dropPlate(s, task.plate, ev); return; }
  const plate = task.plate;
  const res = scorePlate(plate, t, { waitMs: sh.t - t.orderT, patienceMs: g.patienceMs, others: otherTickets(s, g, t.id), dishOrderBonus: DISHES[t.dish]?.ngo && plate.order.indexOf("trung") > plate.order.indexOf("meat"), houseSauce: s.fishSauce || 0 }); // S: nước mắm nhà pha
  t.status = "served"; t.plateCom = plate.com; t.servedT = sh.t;
  m.plate = { kind: plate.kind, frames: null }; m.score = res;
  m.eatMs = Math.round((SERVICE.eatMs[0] + next(s) * (SERVICE.eatMs[1] - SERVICE.eatMs[0])) * (ARCHETYPES[m.role]?.eat || 1) * (sh.tutorial ? 0.75 : 1));
  m.eatUntil = sh.t + m.eatMs; m.eaten = false;
  const cost = plateCost(plate.used);
  sh.stats.cogs += cost; sh.stats.plates++;
  t.cost = cost;
  if (plate.meat) sh.stats.perfectFlips += plate.meat.perfect || 0;
  if (res.mistakes.length) for (const k of res.mistakes) sh.stats.mistakes[k] = (sh.stats.mistakes[k] || 0) + 1;
  ev.push({ type: "delivered", gid: g.id, tid: g.table, tk: t.id, mistakes: res.mistakes, partial: res.partial });
  const worst = worstMistake(res.mistakes);
  if (worst) {
    say(s, g, pool(MISTAKE_SAY[worst], m.role), { dish: DISHES[t.dish].name.toLocaleLowerCase("vi") }, m.idx);
    const W = MISTAKES[worst];
    if (W.food && (W.cap <= 3 || W.serious) && !sh.dialog) {
      sh.dialog = { kind: "complaint", gid: g.id, tk: t.id, mistake: worst, serious: !!W.serious, line: g.say.text };
      ev.push({ type: "complaint", gid: g.id, mistake: worst, serious: !!W.serious });
    }
  }
}
/** Khiếu nại khi dĩa xuống bàn: làm lại · giảm giá 30% (+1 sao trần) · miễn phí (+2). Lỗi nặng: làm lại miễn phí · hoàn tiền + hứa. */
export function resolveComplaint(s, choice, ev = []) {
  const sh = s.shift, d = sh.dialog;
  if (!d || d.kind !== "complaint") return { err: "no-dialog" };
  const g = groupById(s, d.gid), t = sh.tickets.find((x) => x.id === d.tk), m = memberOfTicket(g, d.tk);
  if (!g || !t || !m) { sh.dialog = null; return { ok: true }; }
  const ok = d.serious ? ["remake", "refund"] : ["remake", "discount", "free"];
  if (!ok.includes(choice)) return { err: "bad-choice" };
  if (choice === "remake") {
    sh.stats.cogs -= t.cost || 0; sh.stats.wasteCost += t.cost || 0;
    if (m.plate?.kind === "dia") sh.dirty++;
    t.status = "open"; t.remade = true; t.orderT = Math.min(sh.t, t.orderT + 15000);
    if (d.serious) t.free = true;
    m.plate = null; m.score = null; m.eatUntil = null; m.eaten = false;
    g.used = Math.max(0, g.used - g.patienceMs * 0.4);
  } else if (choice === "discount") { t.discount = 0.3; m.bonus = 1; }
  else if (choice === "free") { t.free = true; m.bonus = 2; }
  else if (choice === "refund") { t.free = true; m.bonus = 1; }
  sh.dialog = null;
  ev.push({ type: "complaintResolved", choice, gid: g.id });
  return { ok: true };
}

// ---------- tính tiền ----------
export function collect(s, ev = []) {
  const sh = s.shift, b = sh.billing;
  if (!b) return { err: "no-bill" };
  const g = groupById(s, b.gid);
  if (!g) { sh.billing = null; if (sh.owner.task?.kind === "bill") sh.owner.task = null; return { err: "gone" }; }
  if (!b.tapped.length) return { err: "empty-bill" };
  const r = settle(b);
  sh.billing = null;
  if (sh.owner.task?.kind === "bill") sh.owner.task = null;
  pay(s, g, r.total, ev, { billMs: sh.t - (g.billT ?? sh.t), auto: false, under: r.under, over: r.over });
  if (r.over > 0) {
    g.overcharged = true;
    sh.dialog = { kind: "overcharge", gid: g.id, over: r.over, line: say(s, g, pool(MISTAKE_SAY.wrongBill, g.members[0].role)) };
    sh.stats.mistakes.wrongBill = (sh.stats.mistakes.wrongBill || 0) + 1;
    ev.push({ type: "overcharge", gid: g.id, over: r.over });
  } else finalizeGroup(s, g, ev, { billMs: sh.t - (g.billT ?? sh.t), auto: b.auto });
  return { ok: true, ...r };
}
/** Khách phản đối vì tính dư: trả lại tiền dư (giữ lỗi, trần 2) hoặc trả lại + tặng trà tắc 4k (+1 trần). */
export function resolveOvercharge(s, choice, ev = []) {
  const sh = s.shift, d = sh.dialog;
  if (!d || d.kind !== "overcharge") return { err: "no-dialog" };
  if (!["refund", "refundTea"].includes(choice)) return { err: "bad-choice" };
  const g = groupById(s, d.gid);
  const back = Math.min(s.money, d.over + (choice === "refundTea" ? 4 : 0));
  s.money -= back; sh.stats.revenue -= Math.min(back, d.over); sh.stats.refunds += back;
  sh.dialog = null;
  if (g) finalizeGroup(s, g, ev, { billMs: sh.t - (g.billT ?? sh.t), auto: false, bonus: choice === "refundTea" ? 1 : 0 });
  ev.push({ type: "overchargeResolved", choice });
  return { ok: true };
}
/** Nhận tiền + trả bớt nợ ký gửi (bán tới đâu trả tới đó). */
function pay(s, g, total, ev, { under = 0 } = {}) {
  const sh = s.shift;
  total = Math.max(0, Math.round(total));
  s.money += total; sh.stats.revenue += total; sh.stats.underBill += under;
  if (s.consign?.owed > 0) {
    const cost = g.members.reduce((a, m) => a + (sh.tickets.find((x) => x.id === m.tk)?.cost || 0), 0);
    const back = Math.min(s.consign.owed, Math.ceil(cost), s.money);
    s.consign.owed -= back; s.money -= back; sh.stats.consignRepaid += back;
    if (s.consign.owed <= 0) s.consign = null;
  }
  const A = ARCHETYPES[g.arch];
  const transfer = next(s) < (A?.transfer ?? 0.2);
  g.paid = true; g.payKind = transfer ? "transfer" : "cash";
  ev.push({ type: "paid", gid: g.id, total, transfer, under });
}
/** Khách gọi tính tiền 40 giây không ai tới: để tiền đúng trên bàn rồi về (không bao giờ kẹt), mất điểm tính tiền. */
export function autoPay(s, g, ev = []) {
  const sh = s.shift;
  if (sh.billing?.gid === g.id) { sh.billing = null; if (sh.owner.task?.kind === "bill") sh.owner.task = null; }
  const b = makeBill(s, g);
  const total = b.lines.filter((l) => l.real).reduce((a, l) => a + l.price, 0);
  pay(s, g, total, ev, {});
  say(s, g, ["Để tiền trên bàn nha {call}.", "{Call} ơi, tiền để dưới ly trà nha.", "Bận quá ha {call}, tiền {self} để trên bàn."]);
  finalizeGroup(s, g, ev, { auto: true });
}

/** Chốt sao từng người, review, XP, khách quen; nhóm đứng dậy về, bàn thành bàn dơ. */
export function finalizeGroup(s, g, ev = [], { billMs = 0, auto = false, bonus = 0 } = {}) {
  const sh = s.shift;
  const level = s.level;
  const results = [];
  let xp = 0;
  for (const m of g.members) {
    const t = sh.tickets.find((x) => x.id === m.tk);
    if (!t || t.status !== "served" || !m.score) continue;
    const mistakes = [...m.score.mistakes];
    if (m.noTea) mistakes.push("noTea");
    if (m.dirty) mistakes.push("dirtyTable");
    if (g.overcharged) mistakes.push("wrongBill");
    const service = servicePoints({ noTea: m.noTea, dirty: m.dirty, canhOk: !sh.soup || !!m.canh, billMs, auto }); // A: nồi canh
    const points = Math.min(100, m.score.partial + service);
    const stars = finalStars(points, mistakes, m.score.errors, m.bonus + bonus);
    m.stars = stars; m.points = points; m.mistakesAll = [...new Set(mistakes)];
    results.push({ m, t, stars });
    if (!t.free && !t.refunded) xp += Math.floor((DISHES[t.dish]?.xp || 0) * (XP_SHARE[stars] ?? 0));
    sh.stats.stars.push(stars);
    if (m.role === "regular" || s.regulars?.[m.name]) {
      const r = (s.regulars[m.name] ||= { visits: 0, good: 0 });
      r.visits++; if (stars >= 4) { r.good++; r.fav = { dish: t.dish, quirks: [...(t.quirks || [])] }; }
    }
  }
  if (results.length) {
    const low = results.reduce((a, r) => (r.stars < a.stars ? r : a), results[0]);
    const avg = results.reduce((a, r) => a + r.stars, 0) / results.length;
    const hi = Math.max(...results.map((r) => r.stars));
    const pickR = hi - low.stars >= 2 ? low : results[0];
    const st = hi - low.stars >= 2 ? low.stars : Math.round(avg);
    const worst = worstMistake(pickR.m.mistakesAll);
    // C: review theo lý do (lỗi · hộp mang về · chờ lâu · cháy cạnh / lòng đào / trà đá kịp), core/reviews.js
    const rp = reviewPool(worst, st, pickR.m.role, { takeaway: !!g.takeaway, slow: !worst && pickR.m.score.time <= 8, quirks: pickR.t.quirks || [], service: !g.takeaway && !pickR.m.mistakesAll.length && !auto });
    addReview(s, { name: pickR.m.name, role: pickR.m.role, stars: st, line: freshLine(s, rp.lines, { ...lineCtx(pickR.m), dish: DISHES[pickR.t.dish].name.toLocaleLowerCase("vi") }), mistake: worst || null, dish: pickR.t.dish, reason: rp.reason, ...(g.takeaway ? { takeaway: true } : {}) });
    say(s, g, pool(st >= 4 ? HAPPY : st <= 2 ? UNHAPPY : HAPPY, pickR.m.role), {}, pickR.m.idx);
    s.rep = Math.max(0, Math.min(100, s.rep + (st - 3) * 0.6));
    sh.stats.groupsServed++;
    ev.push({ type: "groupDone", gid: g.id, stars: st, avg, xp, mistake: worst });
  }
  sh.stats.xp += xp;
  gainXp(s, xp, ev);
  leaveTable(s, g, ev, results.length ? "paid" : "soldout");
}
/** C: review lên sổ qua core/reviews.js (lý do, người theo dõi, đánh giá 20 review gần nhất, cờ review-1star-<lý do>). */
export function addReview(s, r) { return pushReview(s, r); }
/** Nhóm rời bàn (trả tiền xong / bỏ về / hết món): bàn dơ với số dĩa đã dùng. */
export function leaveTable(s, g, ev, outcome) {
  const sh = s.shift, P = pointsOf(s);
  const t = g.table ? tableById(s, g.table) : null;
  if (t) {
    t.gid = null; t.state = "dirty"; t.dirtyT = sh.t;
    t.plates = g.members.filter((m) => m.plate?.kind === "dia").length;
    PG.leaveJoined(s, t, sh); // A: bàn ghép cũng dơ
  }
  for (const m of g.members) { const tk = sh.tickets.find((x) => x.id === m.tk); if (tk && (tk.status === "open" || tk.status === "pinned" || tk.status === "carrying")) tk.status = "void"; }
  for (const sl of sh.slots) { const tk = sh.tickets.find((x) => x.id === sl.tk); if (tk && tk.status === "void") sl.tk = sl.plate ? sl.tk : null; }
  if (sh.billing?.gid === g.id) sh.billing = null;
  const from = t ? tablePoint(s, t.id).seatSpots[0].at : g.takeaway ? P.queueSpots[g.spot] || P.entry : P.waitSpots[g.spot] || P.entry;
  g.outPath = g.takeaway ? shipperOut(P, from) : guestOut(P, from);
  g.walkMs = (pathLen(g.outPath) / SERVICE.guestSpeed) * 1000;
  g.phase = "leave"; g.leaveT = sh.t; g.outcome = outcome;
  ev.push({ type: "leave", gid: g.id, outcome, tid: t?.id || null });
}
/** Bỏ về vì chờ lâu: review 1 sao. */
export function timeoutGroup(s, g, ev, where) {
  const sh = s.shift;
  say(s, g, pool(TIMEOUT, g.members[0].role));
  addReview(s, { name: g.members[0].name, role: g.members[0].role, stars: 1, line: freshLine(s, pool(TIMEOUT_REVIEW, g.members[0].role), lineCtx(g.members[0])), mistake: null, timeout: where, reason: "slow" });
  sh.stats.lost += g.size; sh.stats.timeouts++;
  for (let i = 0; i < g.size; i++) sh.stats.stars.push(1);
  s.rep = Math.max(0, s.rep - 1.5);
  ev.push({ type: "timeout", gid: g.id, name: g.members[0].name, where });
  leaveTable(s, g, ev, "timeout");
}
/** Báo hết món cho một phiếu (luôn có lối ra khi không làm được món). */
export function voidTicket(s, tk, ev = []) {
  const sh = s.shift, t = sh.tickets.find((x) => x.id === tk);
  if (!t || !(t.status === "open" || t.status === "pinned")) return { err: "bad-ticket" };
  const g = groupById(s, t.gid);
  t.status = "void"; t.refunded = true;
  for (const sl of sh.slots) if (sl.tk === tk) { sl.tk = null; if (sl.plate) sl.plate.tk = null; }
  sh.stats.soldOut++;
  if (g) {
    const m = memberOfTicket(g, tk);
    say(s, g, SOLD_OUT, {}, m?.idx || 0);
    if (m) { m.tk = null; m.eaten = true; }
    const live = g.members.some((x) => { const tt = sh.tickets.find((y) => y.id === x.tk); return tt && tt.status !== "void"; });
    if (!live && !g.paid) {
      addReview(s, { name: g.members[0].name, role: g.members[0].role, stars: 3, line: freshLine(s, SOLD_OUT_REVIEW, lineCtx(g.members[0])), mistake: null, soldOut: true });
      sh.stats.stars.push(3);
      leaveTable(s, g, ev, "soldout");
    }
  }
  ev.push({ type: "voided", tk });
  return { ok: true };
}

/** Phần kiên nhẫn còn lại 0..1 (chờ bàn / chờ món). */
export function patienceLeft(s, g) {
  if (!g) return 1;
  if (g.phase === "wait" || g.phase === "queue" || (g.phase === "seated" && !allServed(s, g))) return Math.max(0, 1 - g.used / g.patienceMs);
  return 1;
}
export function allServed(s, g) {
  return g.members.every((m) => { const t = s.shift.tickets.find((x) => x.id === m.tk); return !t || t.status === "served" || t.status === "void"; }) && g.orderT !== null;
}

// ---------- nhịp khách + bàn ----------
const nearGrill = (s) => {
  const P = pointsOf(s);
  return new Set(availableTables(s).slice().sort((a, b) => dist(a.at, P.grill) - dist(b.at, P.grill)).slice(0, 2).map((t) => t.id));
};
export function updateGroups(s, dt, ev) {
  const sh = s.shift, t = sh.t;
  const anyDirty = sh.tables.some((x) => x.state === "dirty");
  const smoky = sh.grill.smoke >= 70 ? nearGrill(s) : null;
  for (const tb of sh.tables) if (tb.state === "wet" && t >= tb.wetUntil) tb.state = "clean";
  for (const g of sh.groups) {
    const role = g.members[0].role;
    if (g.phase === "enter") {
      if (t - g.t0 >= g.walkMs) {
        g.phase = g.takeaway ? "queue" : "wait"; g.arriveT = t; g.used = 0;
        if (g.takeaway) { for (const m of g.members) makeTicket(s, g, m, ev); g.orderT = t; g.say = { text: sh.tickets.find((x) => x.id === g.members[0].tk).line, at: t, who: 0 }; ev.push({ type: "ordered", gid: g.id, tid: null, n: g.size }); }
        else say(s, g, pool(ARRIVE, role));
      }
      continue;
    }
    if (g.phase === "wait" || g.phase === "queue") {
      g.used += dt * (anyDirty && !g.takeaway ? SERVICE.dirtyWaitDrain : 1) * (sh.tutorial ? 0.6 : 1);
      if (!g.said.long && g.used > g.patienceMs * 0.65) { g.said.long = true; g.mood = "impatient"; say(s, g, g.takeaway ? pool(FOOD_LATE, role) : pool(WAIT_LONG, role)); }
      if (g.used >= g.patienceMs) timeoutGroup(s, g, ev, g.takeaway ? "queue" : "wait");
      continue;
    }
    if (g.phase === "toTable") {
      if (t - g.seat0 >= g.walkMs) {
        g.phase = "seated"; g.seatT = t; g.used = 0; g.mood = "wait";
        for (const m of g.members) { m.tea = "empty"; m.teaEmpty = t; }
        ev.push({ type: "sat", gid: g.id, tid: g.table });
      }
      continue;
    }
    if (g.phase === "seated") { updateSeated(s, g, dt, ev, smoky); continue; }
  }
  sh.groups = sh.groups.filter((g) => !(g.phase === "leave" && t - g.leaveT >= g.walkMs + 200));
}
function updateSeated(s, g, dt, ev, smoky) {
  const sh = s.shift, t = sh.t, role = g.members[0].role;
  if (g.paid) return;
  const served = allServed(s, g);
  // kiên nhẫn: trước khi lấy phiếu (chưa châm trà sau 12 giây ⇒ ×2) và trong lúc chờ món
  if (!served) {
    let mul = (sh.tutorial ? 0.6 : 1) / SERVICE.seatedPatience; // S (M5): khách đã ngồi chờ món kiên nhẫn hơn khách đứng chờ bàn
    if (g.firstTeaT === null && t - g.seatT > 12000) mul *= 2;
    if (smoky?.has(g.table)) mul *= 1.3;
    g.used += dt * mul;
    if (g.orderT === null && !g.said.seatWait && g.used > g.patienceMs * 0.45) { g.said.seatWait = true; g.mood = "call"; say(s, g, pool(SEATED_WAIT, role)); }
    if (g.orderT !== null && !g.said.late && g.used > g.patienceMs * 0.6) { g.said.late = true; g.mood = "annoyed"; say(s, g, pool(FOOD_LATE, role)); }
    if (g.used >= g.patienceMs) {
      const anyServed = g.members.some((m) => m.plate);
      if (!anyServed) { timeoutGroup(s, g, ev, "seated"); return; }
      // đã có người ăn: người chưa có món thôi chờ, cả bàn ăn xong rồi tính tiền phần đã ăn
      for (const m of g.members) { const tk = sh.tickets.find((x) => x.id === m.tk); if (tk && tk.status !== "served") { tk.status = "void"; m.eaten = true; m.tk = null; sh.stats.lost++; } }
    }
  }
  // trà đá: đầy → vơi (20 giây) → cạn (40 giây); tài xế uống nhanh gấp đôi
  for (const m of g.members) {
    const half = SERVICE.teaHalfMs * (ARCHETYPES[m.role]?.thirsty ? 0.5 : 1);
    if (m.tea === "full" && t - m.teaT >= half) m.tea = "half";
    if (m.tea === "half" && t - m.teaT >= half * 2) { m.tea = "empty"; m.teaEmpty = t; if (m.plate && !m.eaten && !g.said["tea" + m.idx]) { g.said["tea" + m.idx] = true; g.mood = "call"; say(s, g, pool(TEA_CALL, m.role), {}, m.idx); } }
    if (m.tea === "empty" && !m.eaten && !m.noTea && m.teaEmpty !== null && t - m.teaEmpty >= SERVICE.noTeaMs && g.billT === null) { m.noTea = true; ev.push({ type: "noTea", gid: g.id }); }
    // ăn
    if (m.plate && !m.eaten && m.eatUntil !== null) {
      const prog = 1 - (m.eatUntil - t) / m.eatMs;
      if (!m.reqDone && !m.req && prog >= 0.4) {
        m.reqDone = true;
        const R = ARCHETYPES[m.role]?.request || {};
        const roll = next(s);
        const kind = roll < (R.com || 0) ? "com" : roll < (R.com || 0) + (R.khan || 0) ? "khan" : null;
        if (kind && !sh.tutorialNoReq) { m.req = { kind, t }; g.mood = "call"; say(s, g, REQUEST[kind], {}, m.idx); ev.push({ type: "request", gid: g.id, kind }); }
      }
      if (m.req && t - m.req.t > 15000) { m.req = null; }
      if (t >= m.eatUntil && !m.req) { m.eaten = true; }
    }
  }
  // bàn bên cạnh dơ quá 15 giây
  if (sh.tables.some((x) => x.id !== g.table && x.state === "dirty" && x.dirtyT !== null && t - x.dirtyT > SERVICE.dirtyNeighborMs)) for (const m of g.members) if (!m.dirty && !m.eaten) { m.dirty = true; }
  // ăn xong hết ⇒ gọi tính tiền
  const withTicket = g.members.filter((m) => m.tk !== null);
  if (g.billT === null && served && withTicket.length && withTicket.every((m) => m.eaten)) {
    g.billT = t; g.mood = "call"; say(s, g, pool(BILL_CALL, role)); ev.push({ type: "billCall", gid: g.id, tid: g.table });
  }
  if (g.billT === null && served && !withTicket.length && g.orderT !== null) { leaveTable(s, g, ev, "soldout"); return; }
  if (g.billT !== null && t - g.billT >= SERVICE.billAutoMs && !(sh.billing && sh.billing.gid === g.id) && !g.paid) autoPay(s, g, ev);
}

/** Hộp mang về cho shipper (cấp 4): giao ngay ở quầy, trả tiền liền, chấm như dĩa (không có phần trà / bàn). */
export function serveTakeaway(s, g, t, plate, ev = []) {
  const sh = s.shift, m = memberOfTicket(g, t.id);
  if (!m) return { err: "bad-ticket" };
  const res = scorePlate(plate, t, { waitMs: sh.t - t.orderT, patienceMs: g.patienceMs, others: otherTickets(s, g, t.id), houseSauce: s.fishSauce || 0 }); // S: nước mắm nhà pha
  t.status = "served"; t.plateCom = plate.com; t.servedT = sh.t; t.cost = plateCost(plate.used);
  m.plate = { kind: plate.kind }; m.score = res; m.eaten = true;
  if (plate.kind === "dia") { s.plates--; sh.stats.lostPlates = (sh.stats.lostPlates || 0) + 1; } // shipper mang luôn cái dĩa đi
  sh.stats.cogs += t.cost; sh.stats.plates++; sh.stats.takeaway++;
  for (const k of res.mistakes) sh.stats.mistakes[k] = (sh.stats.mistakes[k] || 0) + 1;
  ev.push({ type: "delivered", gid: g.id, tid: null, tk: t.id, mistakes: res.mistakes, partial: res.partial, takeaway: true });
  if (g.members.every((x) => { const tt = sh.tickets.find((y) => y.id === x.tk); return !tt || tt.status === "served" || tt.status === "void"; })) {
    const total = g.members.reduce((a, x) => { const tt = sh.tickets.find((y) => y.id === x.tk); return a + (tt && tt.status === "served" ? ticketPrice(tt) + (tt.quirks?.includes("themCom") && tt.plateCom >= 2 ? EXTRAS.com.price : 0) : 0); }, 0);
    pay(s, g, total, ev, {});
    finalizeGroup(s, g, ev, { billMs: 0, auto: false });
  }
  return { ok: true };
}
