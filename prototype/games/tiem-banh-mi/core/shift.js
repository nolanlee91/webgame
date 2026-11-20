// Một ca: khách tới theo ba buổi, ghim phiếu, giao ổ, chấm sao, khiếu nại, trả tiền + thối, review, chốt ca lời lỗ. Thuần.
import { RECIPE, NAMES, LEVELS, XP_MUL, STOCK, AUTO_CHANGE_DAYS, HONEST_RETURN, BACHUC, QUEUE_MAX } from "../data/economy.js?v=b1";
import { ARCHETYPES, ARCH_IDS, REGULARS, REGULAR_KNOWN_AT } from "../data/customers.js?v=b1";
import { QUIRKS } from "../data/quirks.js?v=b1";
import { PHASES, SHIFT_MS, PHASE_BANNER, NORMAL_DAY, TUTORIAL, WALK_MS } from "../data/shift.js?v=b1";
import * as L from "../data/lines.js?v=b1";
import { MISTAKE_SAY, MISTAKE_REVIEW } from "../data/lines-mistakes.js?v=b1";
import { next, int, pick, weighted } from "./rng.js?v=b1";
import { fill, freshLine, poolFor } from "./text.js?v=b1";
import { makeItem, makeBachuc, menuAt, orderText, loafName, bachucMax, bachucPrice } from "./order.js?v=b1";
import { scoreOrder } from "./score.js?v=b1";
import { customerPays, makeChange, canChange, payOut, receive, spend, greedyBills, sumBills } from "./money.js?v=b1";
import { ovenOf, newLoaf, tickOven, addWaste } from "./oven.js?v=b1";
import { emptyBoard, board, finished, wasteLoaf } from "./board.js?v=b1";
import { shiftFee, repayConsign, stage } from "./stock.js?v=b1";
import { tickRescue, openNochange } from "./rescue.js?v=b1";

export const customer = (s, cid) => s.shift?.customers.find((c) => c.id === cid) || null;
export const levelForXp = (xp) => { let lv = 1; for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i]) lv = i + 1; return lv; };
export const phaseAt = (t) => PHASES.find((p) => t < p.to) || PHASES[PHASES.length - 1];
/** Giờ trong game (05:30…19:00) theo ms ca. */
export function clockOf(t) {
  const p = phaseAt(t), f = Math.min(1, Math.max(0, (t - p.from) / (p.to - p.from)));
  const m = Math.floor(p.clock[0] + f * (p.clock[1] - p.clock[0]));
  return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
}
export const autoChangeAllowed = (s) => s.day <= AUTO_CHANGE_DAYS;
export const lineCtx = (c, extra = {}) => ({ self: c.self, call: c.call, name: c.name, ...extra });
export const patienceLeft = (s, c) => (c.phase === "wait" && c.arriveT !== null ? Math.max(0, 1 - (s.shift.t - c.arriveT) / c.patience) : 1);
export const orderPrice = (c) => c.items.reduce((a, it) => a + it.price, 0);

// ---------- khách tới ----------
const TUT = [
  { at: 6000, arch: "student", recipe: "pate-bo", q: [], pay: 20 },
  { at: 26000, arch: "office", recipe: "cha-lua", q: [], pay: 50 },
  { at: 46000, arch: "regular", name: "Cụ Năm", recipe: "cha-lua", q: ["gion-gion", "khong-ot"], pay: "exact" },
  { at: 64000, arch: "worker", recipe: "cha-lua", q: ["nhieu-ot"], pay: "exact" },
  { at: 82000, arch: "student", recipe: "pate-bo", q: ["khong-hanh"], pay: 20 },
  { at: 98000, arch: "parent", recipe: "pate-bo", q: ["cat-doi", "khong-ot"], pay: "exact" },
  { at: 120000, arch: "office", recipe: "pate-bo", q: ["it-ot"], pay: "transfer" },
  { at: 142000, arch: "shipper", recipe: "cha-lua", q: [], pay: "transfer", bag: true },
  { at: 168000, arch: "office", recipe: "cha-lua", q: ["khong-hanh", "it-ot"], pay: 50 },
  { at: 194000, arch: "parent", recipe: "pate-bo", q: [], pay: 20 },
];
function pickQuirks(s, A, level, max = 2) {
  const pool = Object.entries(A.quirks).filter(([q]) => QUIRKS[q] && QUIRKS[q].unlock <= level).map(([q, w]) => ({ q, w }));
  const out = [];
  const n = next(s) < 0.4 ? 0 : next(s) < 0.7 ? 1 : max;
  for (let i = 0; i < n && pool.length; i++) { const x = weighted(s, pool); out.push(x.q); pool.splice(pool.indexOf(x), 1); }
  return out;
}
function pickRecipe(s, A, level) {
  const menu = menuAt(level).map((r) => r.id);
  const likes = A.likes.filter((id) => menu.includes(id));
  return pick(s, likes.length ? likes : menu);
}
/** Lịch khách của ca (xác định theo hạt RNG). */
export function genGuests(s) {
  if (!s.tutorialDone) return TUT.map((g) => ({ ...g, items: [makeItem(g.recipe, g.q, g.bag ? { bag: true } : {})], patienceMul: TUTORIAL.patienceMul }));
  const n = Math.max(NORMAL_DAY.minGuests, Math.min(NORMAL_DAY.maxGuests, NORMAL_DAY.minGuests + Math.floor(s.day / 2) + Math.floor((s.rep - 50) / 15) + Math.floor(s.level / 3) + int(s, 3) - 1));
  const out = [];
  const usedRegulars = new Set();
  for (let i = 0; i < n; i++) {
    const ph = weighted(s, PHASES.map((p) => ({ p, w: p.share }))).p;
    const at = Math.round(ph.from + 2000 + next(s) * (Math.min(ph.to, SHIFT_MS - 20000) - ph.from - 2000));
    const archs = ARCH_IDS.filter((id) => ARCHETYPES[id].unlock <= s.level && (!ARCHETYPES[id].minRep || s.rep >= ARCHETYPES[id].minRep)).map((id) => ({ id, w: ARCHETYPES[id].weight[ph.id] || 0 })).filter((x) => x.w > 0);
    const arch = weighted(s, archs).id, A = ARCHETYPES[arch];
    const g = { at, arch, patienceMul: ph.patience };
    if (A.regular) {
      const free = Object.keys(REGULARS).filter((nm) => !usedRegulars.has(nm));
      if (free.length) { g.name = pick(s, free); usedRegulars.add(g.name); const fav = REGULARS[g.name]; g.items = [makeItem(fav.recipe, fav.quirks)]; out.push(g); continue; }
    }
    if (s.level >= BACHUC.unlock && next(s) < 0.08) {
      const targets = BACHUC.targets.filter((t) => t <= bachucMax(s.level) - BACHUC.tolerance);
      if (targets.length) { g.items = [makeBachuc(pick(s, targets))]; out.push(g); continue; }
    }
    let count = 1;
    if (s.day >= NORMAL_DAY.multiFromDay && ["parent", "worker", "office", "shipper"].includes(arch) && next(s) < NORMAL_DAY.multiChance) count = next(s) < 0.3 ? 3 : 2;
    g.items = [];
    for (let k = 0; k < count; k++) g.items.push(makeItem(pickRecipe(s, A, s.level), pickQuirks(s, A, s.level, count > 1 ? 1 : 2)));
    const bag = A.bag || count >= 3;
    if (bag) for (const it of g.items) { it.bag = true; if (it.wrap === "cat-doi") { it.wrap = "giay"; it.quirks = it.quirks.filter((q) => q !== "cat-doi"); } }
    out.push(g);
  }
  return out.sort((a, b) => a.at - b.at);
}

function spawn(s, g, spot, ev) {
  const sh = s.shift, A = ARCHETYPES[g.arch];
  const reg = g.name && REGULARS[g.name];
  const id = sh.nextCid++;
  const name = g.name || pick(s, A.names);
  const known = reg && (s.regulars[name]?.good || 0) >= REGULAR_KNOWN_AT;
  const c = {
    id, arch: g.arch, sprite: A.sprite, name, self: reg?.self || A.self, call: A.call, items: g.items, filled: g.items.map(() => null),
    phase: "enter", t0: sh.t, arriveT: null, patience: Math.round(A.patience * (g.patienceMul || 1)), spot, mood: "waiting", say: null,
    orderLine: "", nhuCu: !!known, pay: null, payPlan: g.pay ?? null, leaveT: null, reactUntil: null, remade: false, impatientSaid: false, discount: 0,
  };
  const ctx = lineCtx(c, { order: orderText(c.items), n: c.items.length, shop: s.shopName });
  if (c.nhuCu) c.orderLine = freshLine(s, L.NHU_CU_LINES, ctx);
  else if (c.items[0].recipe === "bachuc") c.orderLine = freshLine(s, L.BACHUC_LINES, { ...ctx, target: c.items[0].target });
  else if (c.items.length > 1) c.orderLine = freshLine(s, L.MULTI_LINES, ctx);
  else c.orderLine = freshLine(s, [...L.ORDER_LINES, ...(L.ORDER_BY_ARCH[g.arch] || [])], ctx);
  sh.customers.push(c);
  ev.push({ type: "arrive", cid: id });
}
const freeSpot = (s) => { const used = new Set(s.shift.customers.filter((c) => c.phase !== "leave").map((c) => c.spot)); for (let i = 0; i < QUEUE_MAX[stage(s)]; i++) if (!used.has(i)) return i; return -1; };

// ---------- mở ca ----------
export function startShift(s, ev) {
  if (s.shift) return { err: "shift-open" };
  const fee = Math.min(shiftFee(s), s.money);
  spend(s, fee);
  const sh = {
    status: "open", t: 0, day: s.day, phase: "sang", schedule: [], customers: [], nextCid: 1, boards: [emptyBoard()], sel: 0,
    oven: new Array(ovenOf(s).slots).fill(null), case: [], dialog: null, away: null, deliveries: [], paying: null, usedLines: [], lowSaid: {},
    waste: {}, wasteLog: [], fee, tutorial: !s.tutorialDone, consignUsed: false, settleQueue: [], feedFrom: s.feed.length ? s.feed[0].id : 0,
    stats: { served: 0, loaves: 0, revenue: 0, cogs: 0, batches: s.prep?.batches || 0, burntBatches: 0, goldenPulls: 0, toasts: 0, lost: 0, timeouts: 0, stars: [],
      changeRight: 0, changeWrong: 0, changeLoss: 0, restockSpent: 0, rescueSpent: 0, xp: 0, consignRepaid: 0, owed: 0, mistakes: {} },
  };
  s.shift = sh;
  sh.schedule = genGuests(s);
  for (const l of s.prep?.loaves || []) sh.case.push(newLoaf(s, l.crisp, "oven", l.dark ? { dark: true } : {}));
  if (s.prep?.burnt) addWaste(sh, "burnt", s.prep.burnt * STOCK.phoi.cost, `Mẻ đầu cháy (${s.prep.burnt} ổ)`);
  s.prep = null;
  s.usedDay = [];
  ev.push({ type: "shiftStarted", day: s.day, guests: sh.schedule.length, fee });
  return { ok: true };
}

// ---------- nhịp ca ----------
export function tick(s, dt, ev) {
  const sh = s.shift;
  if (!sh || sh.status !== "open") return { err: "no-shift" };
  if (!(dt > 0) || dt > 1000) return { err: "bad-dt" };
  if (sh.dialog) return { ok: true };
  sh.t += dt;
  const ph = phaseAt(sh.t);
  if (ph.id !== sh.phase && sh.t < SHIFT_MS) { sh.phase = ph.id; ev.push({ type: "phase", id: ph.id, text: PHASE_BANNER[ph.id] || ph.name }); }
  // khách tới (hàng chờ đầy thì đợi tới khi có chỗ); hết giờ ca thì không nhận thêm
  if (sh.t >= SHIFT_MS) sh.schedule = [];
  while (sh.schedule.length && sh.schedule[0].at <= sh.t) {
    const spot = freeSpot(s);
    if (spot < 0) break;
    spawn(s, sh.schedule.shift(), spot, ev);
  }
  for (const c of [...sh.customers]) {
    if (c.phase === "enter" && sh.t - c.t0 >= WALK_MS) {
      c.phase = "wait"; c.arriveT = sh.t; c.say = { text: c.orderLine, at: sh.t };
    } else if (c.phase === "wait") {
      const used = (sh.t - c.arriveT) / c.patience;
      if (used >= 1) timeout(s, c, ev);
      else if (used >= 0.65 && !c.impatientSaid) { c.impatientSaid = true; c.mood = "impatient"; c.say = { text: freshLine(s, L.IMPATIENT_LINES, lineCtx(c)), at: sh.t }; ev.push({ type: "impatient", cid: c.id }); }
    } else if (c.phase === "react" && sh.t >= c.reactUntil) { c.phase = "leave"; c.leaveT = sh.t; }
    else if (c.phase === "leave" && sh.t - c.leaveT >= WALK_MS) sh.customers.splice(sh.customers.indexOf(c), 1);
  }
  tickOven(s, dt, ev);
  tickRescue(s, ev);
  while (sh.settleQueue.length) {
    const q = sh.settleQueue.shift(), c = customer(s, q.cid);
    if (c && c.phase === "pay") settle(s, c, { received: { [c.pay.bill]: 1 }, change: {}, viaExchange: true }, ev);
  }
  if (sh.t >= SHIFT_MS && !sh.customers.length && !sh.schedule.length && !sh.dialog && !sh.away) return endShift(s, ev, false);
  return { ok: true };
}

function timeout(s, c, ev) {
  const sh = s.shift;
  for (const b of sh.boards) if (b.cid === c.id) { if (b.loaf) wasteLoaf(sh, b.loaf, "Ổ làm dở, khách bỏ về"); Object.assign(b, emptyBoard()); }
  for (const f of c.filled) if (f) wasteLoaf(sh, f, "Ổ đã gói, khách bỏ về");
  c.phase = "leave"; c.leaveT = sh.t; c.mood = "impatient";
  c.say = { text: freshLine(s, L.TIMEOUT_SAY, lineCtx(c)), at: sh.t };
  review(s, c, 1, freshLine(s, L.TIMEOUT_REVIEW, lineCtx(c)), "timeout");
  s.rep = Math.max(0, s.rep - 1);
  sh.stats.timeouts++; sh.stats.lost++;
  ev.push({ type: "timeout", cid: c.id, name: c.name });
}

// ---------- ghim phiếu ----------
export function pin(s, cid, ev) {
  const sh = s.shift;
  if (!sh) return { err: "no-shift" };
  if (sh.away) return { err: "away" };
  if (sh.dialog) return { err: "dialog" };
  const c = customer(s, cid);
  if (!c || c.phase !== "wait") return { err: "not-waiting" };
  const b = board(s);
  if (b.cid === cid) return { ok: true };
  if (b.loaf) return { err: "board-busy" };
  const item = c.filled.findIndex((f) => !f);
  Object.assign(b, emptyBoard(cid, item < 0 ? 0 : item));
  c.pinned = true;
  ev.push({ type: "pinned", cid });
  return { ok: true };
}
/** Đơn nhiều ổ: chọn ổ đang ráp. */
export function selectItem(s, idx, ev) {
  const b = s.shift && board(s);
  if (!b || b.cid === null) return { err: "no-ticket" };
  const c = customer(s, b.cid);
  if (!c || !Number.isInteger(idx) || idx < 0 || idx >= c.items.length || c.filled[idx]) return { err: "bad-item" };
  b.item = idx;
  ev.push({ type: "itemSelected", idx });
  return { ok: true };
}

// ---------- giao ----------
export function serve(s, ev) {
  const sh = s.shift;
  if (!sh) return { err: "no-shift" };
  if (sh.away) return { err: "away" };
  if (sh.dialog) return { err: "dialog" };
  if (sh.paying !== null) return { err: "paying" };
  const b = board(s);
  if (!b.loaf || !b.loaf.wrap) return { err: "not-wrapped" };
  const c = customer(s, b.cid);
  if (!c || c.phase !== "wait") return { err: "not-waiting" };
  c.filled[b.item] = finished(b.loaf, b.item);
  const nextItem = c.filled.findIndex((f) => !f);
  if (nextItem >= 0) {
    Object.assign(b, emptyBoard(c.id, nextItem));
    ev.push({ type: "filled", cid: c.id, n: c.filled.filter(Boolean).length, of: c.items.length });
    return { ok: true };
  }
  Object.assign(b, emptyBoard());
  return complete(s, c, ev);
}

function mistakeCtx(c) {
  const it = c.items[0], f = c.filled[0];
  const got = f?.fills?.length ? f.fills.map((x) => NAMES[x].toLocaleLowerCase("vi")).join(", ") : "ổ trơn";
  return lineCtx(c, { want: loafName(it), got, loaf: loafName(it), price: orderPrice(c) });
}
function complete(s, c, ev) {
  const sh = s.shift;
  const sc = scoreOrder(c, sh.t - c.arriveT);
  if (c.remade) sc.stars = Math.min(sc.stars, 4);
  c.score = sc;
  const recipeMistake = sc.mistakes.find((m) => m !== "wrongChange");
  if (sc.stars <= 2 && recipeMistake && !c.remade) {
    const line = freshLine(s, poolFor(MISTAKE_SAY[recipeMistake], c.arch), mistakeCtx(c));
    c.say = { text: line, at: sh.t }; c.mood = "surprised";
    sh.dialog = { kind: "complaint", cid: c.id, stars: sc.stars, mistake: recipeMistake, line };
    ev.push({ type: "complaint", cid: c.id, mistake: recipeMistake });
    return { ok: true };
  }
  return enterPay(s, c, ev);
}
/** Khiếu nại: làm lại / giảm 50% / tặng luôn. */
export function resolveComplaint(s, choice, ev) {
  const sh = s.shift, d = sh?.dialog;
  if (!d || d.kind !== "complaint") return { err: "no-dialog" };
  const c = customer(s, d.cid);
  if (!c) { sh.dialog = null; return { err: "gone" }; }
  if (!["remake", "discount", "free"].includes(choice)) return { err: "bad-choice" };
  sh.dialog = null;
  c.say = { text: freshLine(s, L.COMPLAINT_RESULT[choice], lineCtx(c)), at: sh.t };
  ev.push({ type: "complaintResolved", cid: c.id, choice });
  if (choice === "remake") {
    c.score.per.forEach((p, i) => { if (p.mistakes.length || p.errors.length) { wasteLoaf(sh, c.filled[i], "Ổ làm lại"); c.filled[i] = null; } });
    if (c.filled.every(Boolean)) c.filled = c.filled.map(() => null);
    c.remade = true; c.mood = "waiting"; c.score = null;
    c.arriveT = sh.t - Math.round(c.patience * 0.3); c.impatientSaid = false;
    const b = board(s);
    if (b.cid === null && !b.loaf) Object.assign(b, emptyBoard(c.id, c.filled.findIndex((f) => !f)));
    return { ok: true };
  }
  if (choice === "discount") { c.discount = 0.5; c.score.stars = Math.min(3, c.score.stars + 1); }
  if (choice === "free") { c.discount = 1; c.score.stars = 3; c.free = true; }
  return enterPay(s, c, ev);
}

// ---------- trả tiền + thối ----------
function enterPay(s, c, ev) {
  const sh = s.shift;
  const due = Math.round(orderPrice(c) * (1 - c.discount));
  c.phase = "pay";
  let pay;
  if (due <= 0) pay = { kind: "free" };
  else if (c.payPlan === "exact") pay = { kind: "exact", bills: greedyBills(due, c.arch === "regular" ? [5, 2, 1] : undefined) };
  else if (c.payPlan === "transfer") pay = { kind: "transfer" };
  else if (typeof c.payPlan === "number" && c.payPlan >= due) pay = { kind: "bill", bill: c.payPlan };
  else pay = customerPays(s, ARCHETYPES[c.arch], due, { early: sh.t > 21000 && sh.t < 63000, level: s.level });
  c.pay = { due, ...pay };
  if (pay.kind === "free") return settle(s, c, { received: {}, change: {} }, ev);
  if (pay.kind === "transfer") return settle(s, c, { received: {}, change: {}, transfer: true }, ev);
  if (pay.kind === "exact") return settle(s, c, { received: pay.bills, change: {} }, ev);
  const change = pay.bill - due;
  if (change === 0) return settle(s, c, { received: { [pay.bill]: 1 }, change: {} }, ev);
  c.pay.change = change;
  sh.paying = c.id;
  ev.push({ type: "paying", cid: c.id, bill: pay.bill, due, change });
  if (!canChange(s.float, change)) openNochange(s, c, ev);
  return { ok: true };
}
/** Người chơi thối tiền bằng các tờ đã chọn trong quỹ lẻ. */
export function giveChange(s, bills, ev) {
  const sh = s.shift;
  if (!sh || sh.paying === null) return { err: "not-paying" };
  if (sh.dialog) return { err: "dialog" };
  if (sh.away) return { err: "away" };
  if (!bills || typeof bills !== "object") return { err: "bad-bills" };
  const clean = {};
  for (const [d, n] of Object.entries(bills)) {
    if (!Number.isInteger(n) || n < 0) return { err: "bad-bills" };
    if (n > 0) { if ((s.float[d] || 0) < n) return { err: "no-bills" }; clean[d] = n; }
  }
  const c = customer(s, sh.paying);
  return settle(s, c, { received: { [c.pay.bill]: 1 }, change: clean }, ev);
}
/** Nút "Thối đúng" (ngày 1–3). Không thối được bằng quỹ lẻ ⇒ hội thoại hết lẻ. */
export function autoChange(s, ev) {
  const sh = s.shift;
  if (!sh || sh.paying === null) return { err: "not-paying" };
  if (!autoChangeAllowed(s)) return { err: "manual-change" };
  if (sh.dialog) return { err: "dialog" };
  if (sh.away) return { err: "away" };
  const c = customer(s, sh.paying);
  const mk = makeChange(s.float, c.pay.change);
  if (!mk) { openNochange(s, c, ev); return { ok: true }; }
  return giveChange(s, mk, ev);
}

/** Người chơi báo "hết lẻ" ⇒ mở hội thoại hết lẻ (luôn có lựa chọn miễn phí). */
export function noChange(s, ev) {
  const sh = s.shift;
  if (!sh || sh.paying === null) return { err: "not-paying" };
  if (sh.dialog || sh.away) return { err: sh.dialog ? "dialog" : "away" };
  openNochange(s, customer(s, sh.paying), ev);
  return { ok: true };
}
/** Chốt tiền một khách: nhận tiền, đưa tiền thối, kiểm đúng / thiếu / dư, review, XP. */
export function settle(s, c, pay, ev) {
  const sh = s.shift;
  const due = c.pay.due, needChange = c.pay.kind === "bill" ? c.pay.bill - due : 0;
  let received = 0, changeErr = null, diff = 0, changeLine = null;
  if (pay.owed || pay.lost) {
    sh.stats.owed += due;
  } else if (pay.viaExchange) {
    receive(s, pay.received); spend(s, needChange); received = due;
    sh.stats.changeRight++;
  } else {
    if (!payOut(s, pay.change)) return { err: "no-bills" };
    receive(s, pay.received);
    if (pay.transfer) s.money += due; // chuyển khoản: vào tài khoản (tính vào tiền, không vào quỹ lẻ)
    received = c.pay.kind === "free" ? 0 : due;
    if (c.pay.kind === "bill" && !pay.exact) {
      diff = sumBills(pay.change) - needChange;
      const ctx = lineCtx(c, { diff: Math.abs(diff), price: due });
      if (diff < 0) { changeErr = "short"; spend(s, Math.min(-diff, s.money)); changeLine = freshLine(s, L.CHANGE_LINES.short, ctx); sh.stats.changeWrong++; }
      else if (diff > 0) {
        sh.stats.changeWrong++;
        if (next(s) < HONEST_RETURN) { receive(s, greedyBills(diff)); s.rep = Math.min(100, s.rep + 1); changeErr = "overBack"; changeLine = freshLine(s, L.CHANGE_LINES.overBack, ctx); }
        else { changeErr = "overGone"; sh.stats.changeLoss += diff; changeLine = freshLine(s, L.CHANGE_LINES.overGone, ctx); }
      } else { sh.stats.changeRight++; changeLine = freshLine(s, L.CHANGE_LINES.right, ctx); }
    } else if (c.pay.kind === "transfer") changeLine = freshLine(s, L.CHANGE_LINES.transfer, lineCtx(c));
    else if (c.pay.kind === "exact") changeLine = freshLine(s, L.CHANGE_LINES.exact, lineCtx(c));
  }
  const sc = c.score;
  if (changeErr === "short") { sc.stars = Math.min(sc.stars, 2); if (!sc.mistakes.includes("wrongChange")) sc.mistakes.push("wrongChange"); }
  // giá vốn + trả dần ký gửi
  let cogs = 0;
  for (const f of c.filled) cogs += (f.src === "si" ? STOCK["banh-si"].cost : STOCK.phoi.cost) + Object.entries(f.used || {}).reduce((a, [id, n]) => a + n * STOCK[id].cost, 0);
  sh.stats.cogs = Math.round((sh.stats.cogs + cogs) * 10) / 10;
  if (received > 0) {
    const repay = Math.min(repayConsign(s, cogs), s.money);
    if (repay) { spend(s, repay); sh.stats.consignRepaid += repay; }
  }
  sh.stats.revenue += received;
  sh.stats.served++; sh.stats.loaves += c.items.length; sh.stats.stars.push(sc.stars);
  for (const m of sc.mistakes) sh.stats.mistakes[m] = (sh.stats.mistakes[m] || 0) + 1;
  // XP: 4 ổ đầu đủ, ổ thứ 5 trở đi 50%; tặng luôn = 0 XP
  let xp = 0;
  if (!c.free && !pay.lost) c.items.forEach((it, i) => { xp += (it.recipe === "bachuc" ? 8 : RECIPE[it.recipe].xp) * XP_MUL[sc.stars] * (i >= 4 ? 0.5 : 1); });
  xp = Math.floor(xp);
  s.xp += xp; sh.stats.xp += xp;
  s.rep = Math.min(100, Math.max(0, s.rep + (sc.stars >= 5 ? 1 : sc.stars <= 2 ? -1 : 0)));
  // khách quen
  if (REGULARS[c.name]) { const r = (s.regulars[c.name] ||= { visits: 0, good: 0 }); r.visits++; if (sc.stars >= 4) r.good++; }
  // review + phản ứng
  const line = reviewLine(s, c, sc, changeErr);
  review(s, c, sc.stars, line, sc.mistakes[0] || (sc.stars >= 4 ? "good" : "ok"));
  c.phase = "react"; c.reactUntil = sh.t + 1600; c.mood = sc.stars >= 3 ? "happy" : "impatient"; c.stars = sc.stars;
  c.say = { text: changeLine && changeErr ? changeLine : freshLine(s, sc.stars >= 4 ? L.HAPPY_LINES : L.MEH_LINES, lineCtx(c)), at: sh.t };
  if (sh.paying === c.id) sh.paying = null;
  ev.push({ type: "served", cid: c.id, price: received, stars: sc.stars, xp, change: changeErr, diff, owed: !!pay.owed, lost: !!pay.lost, loaves: c.items.length });
  while (s.level < LEVELS.length && s.xp >= LEVELS[s.level]) { s.level++; ev.push({ type: "levelUp", level: s.level }); }
  return { ok: true };
}
function reviewLine(s, c, sc, changeErr) {
  const ctx = lineCtx(c, { target: c.items[0].target, loaf: loafName(c.items[0]) });
  const mk = sc.mistakes[0];
  if (mk) return freshLine(s, poolFor(MISTAKE_REVIEW[mk], c.arch), ctx);
  const it = c.items[0];
  if (it.recipe === "bachuc") { const d = bachucPrice(c.filled[0]) - it.target; return freshLine(s, L.BACHUC_REVIEW[d < -BACHUC.tolerance ? "low" : d > BACHUC.tolerance ? "high" : "right"], ctx); }
  if (c.nhuCu && sc.stars >= 4 && next(s) < 0.6) return freshLine(s, L.NHU_CU_REVIEW, ctx);
  return freshLine(s, [...L.STAR_REVIEWS[sc.stars], ...(L.STAR_REVIEWS_BY_ARCH[c.arch]?.[sc.stars] || [])], ctx);
}
export function review(s, c, stars, line, reason) {
  s.nextReviewId = (s.nextReviewId || 0) + 1;
  s.feed.unshift({ id: s.nextReviewId, day: s.day, name: c.name, arch: c.arch, stars, line, reason });
  if (s.feed.length > 60) s.feed.length = 60;
  s.stats.reviews[stars] = (s.stats.reviews[stars] || 0) + 1;
}

// ---------- chốt ca ----------
export function endShift(s, ev, early = false) {
  const sh = s.shift;
  if (!sh) return { err: "no-shift" };
  for (const c of sh.customers) if (c.phase === "wait" || c.phase === "enter" || c.phase === "pay") { for (const f of c.filled) if (f) wasteLoaf(sh, f, "Ổ đã gói, đóng cửa"); sh.stats.lost++; }
  for (const b of sh.boards) if (b.loaf) wasteLoaf(sh, b.loaf, "Ổ làm dở lúc đóng cửa");
  const left = sh.case.length + sh.oven.reduce((a, b) => a + (b ? b.n : 0), 0);
  if (left) addWaste(sh, "leftover", left * STOCK.phoi.cost, `Bánh dư cuối ca (${left} ổ)`);
  const st = sh.stats;
  const waste = Math.round(Object.values(sh.waste).reduce((a, b) => a + b, 0) * 10) / 10;
  const gas = st.batches * STOCK.gas.cost, than = Math.round(st.toasts * STOCK.than.cost * 10) / 10;
  const profit = Math.round(st.revenue - st.cogs - waste - gas - than - sh.fee - st.changeLoss);
  const avg = st.stars.length ? Math.round((st.stars.reduce((a, b) => a + b, 0) / st.stars.length) * 10) / 10 : 0;
  const reviews = s.feed.filter((r) => r.day === s.day).slice(0, 12);
  s.lastSummary = {
    day: s.day, early, revenue: st.revenue, cogs: Math.round(st.cogs), waste, wasteDetail: { ...sh.waste }, wasteLog: sh.wasteLog.slice(-8), gas, than, fee: sh.fee,
    changeLoss: st.changeLoss, profit, served: st.served, loaves: st.loaves, lost: st.lost, timeouts: st.timeouts, batches: st.batches, burntBatches: st.burntBatches,
    goldenPulls: st.goldenPulls, toasts: st.toasts, changeRight: st.changeRight, changeWrong: st.changeWrong, avg, xp: st.xp, level: s.level,
    restockSpent: st.restockSpent, rescueSpent: st.rescueSpent, consignRepaid: st.consignRepaid, owed: st.owed, mistakes: { ...st.mistakes },
    best: reviews.slice().sort((a, b) => b.stars - a.stars)[0] || null, worst: reviews.slice().sort((a, b) => a.stars - b.stars)[0] || null, money: s.money, seen: false,
  };
  s.stats.shifts++; s.stats.loaves += st.loaves; s.stats.revenue += st.revenue;
  s.stats.bestProfit = Math.max(s.stats.bestProfit, profit);
  s.day++;
  s.tutorialDone = true;
  s.daily = {};
  s.prep = null;
  s.shift = null;
  s.usedDay = [];
  ev.push({ type: "shiftEnded", day: s.lastSummary.day, profit, early });
  return { ok: true };
}
export { fill as fillLine };
