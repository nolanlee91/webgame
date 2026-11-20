// Một ca (GAME-DESIGN §3): mở quán → nhịp ca (khách tới theo lịch, bếp, nồi cơm, cô chủ đi làm việc, khách ăn) → đóng quán → chốt ca.
// Thuần. Mọi thay đổi đi qua core/apply.js. Đồng hồ ca dừng khi có hội thoại / bảng phủ (game.js không gửi tick).
// Ca tối mặc định; ca trưa mở ở cấp 5 (data/economy.js SHIFTS, s.plan). Ngày 1 là ca hướng dẫn: khách thưa, kiên nhẫn dài, có gợi ý từng bước.
import { SHIFTS, SERVICE, GRILL, STOCK, FEES, CLOSE_GRACE_MS, DISHES, guestsFor, MO_HANH } from "../data/economy.js?v=c1";
import { ARCHETYPES, ARCH_IDS } from "../data/customers.js?v=c1";
import { OPS, pool } from "../data/lines.js?v=c1";
import { next, int, weighted } from "./rng.js?v=c1";
import { freshLine } from "./text.js?v=c1";
import { freshGrill, tickGrill, placeItem, flip, moveItem, takeItem, addCoal, setFan, freeWarm, hottestFree, isCooked, itemResult, zoneOf } from "./grill.js?v=c1";
import { freshRice, startCook, tickRice, makeJar, startEgg, tickSteamer, freshSteamer, loadSteamer } from "./rice.js?v=c1";
import { slotOf, ticketOf, targetOf, addWaste, bestPiece, pickMeat } from "./plate.js?v=c1";
import { freshOwner, stepOwner, ownerFree, enqueue, pointsOf } from "./walker.js?v=c1";
import { TASKS, availableTables, freshTable, spawnGroup, updateGroups, leaveTable, autoPay, groupById, serveTakeaway, allServed } from "./tables.js?v=c1";
import { openStockout } from "./rescue.js?v=c1";
import { levelForXp } from "./progress.js?v=c1";
import { expireStock } from "./stock.js?v=c1";

/** Ca hướng dẫn ngày 1: bếp chín chậm hơn để người mới kịp hiểu "hai mặt" (vùng chín rộng hơn theo thời gian). */
export const TUTORIAL_GRILL = 0.85;

// ---------- việc ở bếp của cô chủ (thêm vào bảng việc của tables.js) ----------
const atCounter = (s, key) => { const P = pointsOf(s); const p = P[key] || P.owner; return [p[0], P.owner[1]]; };
export const OWNER_TASKS = {
  ...TASKS,
  moHanh: {
    target: (s) => atCounter(s, "mo-hanh-pot"),
    start: (s) => ((s.stock["mo-hanh-bo"] || 0) > 0 ? { ok: true } : { err: "no-mo-hanh-bo" }),
    ms: () => MO_HANH.makeMs,
    done: (s, task, ev) => { const r = makeJar(s, ev); if (r.ok && r.waste) addWaste(s.shift, "moHanh", r.waste, r.waste * MO_HANH.portionCost); },
  },
  marinate: {
    target: (s) => atCounter(s, "suon-tray"),
    start: (s) => ((s.stock.suon || 0) > 0 ? { ok: true } : { err: "no-suon" }),
    ms: () => SERVICE.marinateMs,
    done: (s, task, ev) => { const n = Math.min(6, s.stock.suon || 0); s.stock.suon -= n; s.stock["suon-uop"] = (s.stock["suon-uop"] || 0) + n; s.shift.uopFresh = Math.min(s.shift.uopFresh ?? 100, 90); ev.push({ type: "marinated", n, rush: true }); },
  },
};

// ---------- lịch khách ----------
/** Lịch khách của ca: nhóm (vai đầu + vai đi cùng), giờ tới, hệ số kiên nhẫn. Ngày 1: thưa, nhóm 1–2 người, kiên nhẫn dài. */
export function makeSchedule(s, kind, maxSeats) {
  const S = SHIFTS[kind], len = S.len;
  const tutorial = s.day === 1 && !s.tutorialDone;
  const total = guestsFor(s.level, kind, s.day);
  const out = [];
  const roles = ARCH_IDS.filter((a) => { const A = ARCHETYPES[a]; return A.unlock <= s.level && (A.minRep || 0) <= s.rep && !(A.takeaway && !s.owned["takeaway-shelf"]); });
  let people = 0;
  const pickArch = (frac) => {
    const khuya = frac >= 0.62 && kind === "toi";
    return weighted(s, roles.map((a) => ({ a, w: (ARCHETYPES[a].shifts[kind] || 0.1) * (khuya ? ARCHETYPES[a].khuya : 1) }))).a;
  };
  if (tutorial) {
    // ca hướng dẫn: nhóm đầu 1 người tới ngay, sau đó thưa dần; tổng ~9 người
    const plan = [["student", 1, 0.008], ["nurse", 1, 0.17], ["worker", 2, 0.3], ["student2", 1, 0.44], ["driver", 1, 0.55], ["worker2", 2, 0.66], ["regular", 1, 0.8]];
    for (const [arch, size, f] of plan) {
      const A = ARCHETYPES[arch];
      const rs = [arch]; for (let i = 1; i < Math.min(size, maxSeats); i++) rs.push(A.mates[int(s, A.mates.length)] || arch);
      out.push({ at: Math.round(len * f), arch, roles: rs, patienceMul: 1.6, tag: "tut" });
      people += rs.length;
    }
    return out;
  }
  while (people < total && out.length < 60) {
    // nhịp: tối sớm thưa, cao điểm dày, khuya vừa
    const r = next(s);
    const frac = kind === "toi" ? (r < 0.2 ? 0.02 + r * 1.0 : r < 0.65 ? 0.24 + (r - 0.2) * 0.84 : 0.62 + (r - 0.65) * 0.6) : 0.02 + r * 0.75;
    const arch = pickArch(frac);
    const A = ARCHETYPES[arch];
    const size = A.takeaway ? 1 : Math.max(1, Math.min(maxSeats, A.size[0] + int(s, A.size[1] - A.size[0] + 1)));
    const rs = [arch];
    for (let i = 1; i < size; i++) rs.push(A.mates.length ? A.mates[int(s, A.mates.length)] : arch);
    out.push({ at: Math.round(len * frac), arch, roles: rs, patienceMul: 1 });
    if (!A.takeaway) people += size;
  }
  return out.sort((a, b) => a.at - b.at);
}

// ---------- mở / đóng ca ----------
export function startShift(s, ev = []) {
  if (s.shift) return { err: "open" };
  if (s.between === null && s.dayDone) return { err: "day-done" };
  const kind = s.plan[s.shiftIdx] || "toi";
  const P = pointsOf(s);
  const tables = availableTables(s).map(freshTable);
  const maxSeats = Math.max(...tables.map((t) => t.seats));
  const tutorial = s.day === 1 && !s.tutorialDone;
  s.shift = {
    status: "open", kind, t: 0, len: SHIFTS[kind].len, day: s.day, tutorial, phaseIdx: 0,
    schedule: makeSchedule(s, kind, maxSeats), groups: [], nextGid: 1, tickets: [], nextTk: 1, nextPid: 1,
    tables, slots: [{ tk: null, plate: null }], sel: 0,
    grill: freshGrill(s.kitchen.coal), rice: freshRice(s.kitchen.rice, s.stage === "quan"), pan: s.owned["egg-pan"] ? { egg: null } : null,
    steamer: s.owned.steamer ? freshSteamer() : null,
    cleanPlates: s.plates, dirty: 0, owner: freshOwner(P), billing: null, dialog: null,
    deliveries: [], closed: false, consignUsed: false, breadUsed: 0, uopFresh: s.uopOld > 0 ? 85 : 100, lowSaid: {}, usedLines: [],
    tutorialNoReq: tutorial,
    waste: {}, coalUsed: 0,
    stats: { plates: 0, revenue: 0, cogs: 0, wasteCost: 0, teaCost: 0, waterPours: 0, restockSpent: 0, rescueSpent: 0, consignRepaid: 0, underBill: 0, refunds: 0,
      lost: 0, timeouts: 0, soldOut: 0, passed: 0, groupsServed: 0, takeaway: 0, washed: 0, perfectFlips: 0, flips: 0, burnt: 0, stars: [], mistakes: {}, reviews: 0, xp: 0, maxDirtyMs: 0, smokeMax: 0 },
  };
  if (s.kitchen.coal > 0) s.shift.lit = true;
  ev.push({ type: "shiftStarted", kind, day: s.day, guests: s.shift.schedule.reduce((a, g) => a + g.roles.length, 0), tutorial });
  return { ok: true };
}

/** Một nhịp ca. */
export function tick(s, dt, ev = []) {
  const sh = s.shift;
  if (!sh || sh.status !== "open") return { err: "no-shift" };
  if (sh.dialog) return { ok: true };
  dt = Math.max(0, Math.min(500, dt));
  sh.t += dt;
  const t = sh.t;
  // nhịp ca (băng chữ)
  const phases = SHIFTS[sh.kind].phases;
  while (sh.phaseIdx + 1 < phases.length && t >= phases[sh.phaseIdx + 1].at * sh.len) { sh.phaseIdx++; ev.push({ type: "phase", text: phases[sh.phaseIdx].text }); }
  // hàng chở tới / chạy chợ về
  for (const d of sh.deliveries.filter((x) => x.at <= t)) {
    s.stock[d.id] = (s.stock[d.id] || 0) + d.n;
    if (d.id === "suon-uop" && d.fresh) sh.uopFresh = Math.min(sh.uopFresh ?? 100, d.fresh);
    ev.push({ type: "delivered-stock", id: d.id, n: d.n, by: d.by || "run" });
  }
  sh.deliveries = sh.deliveries.filter((x) => x.at > t);
  // khách tới theo lịch
  if (!sh.closed && t < sh.len) {
    for (const g of sh.schedule) {
      if (g.done || g.at > t) continue;
      if (spawnGroup(s, g, ev)) g.done = true;
      else { g.retry = (g.retry || 0) + 1; g.at = t + 6000; if (g.retry > 3) { g.done = true; sh.stats.passed += g.roles.length; ev.push({ type: "passedBy", n: g.roles.length }); } }
    }
  }
  // bếp, nồi, chảo, xửng
  if (sh.grill.fan && !ownerFree(s)) setFan(sh.grill, false);
  const gev = [];
  tickGrill(sh.grill, dt, t, gev, sh.tutorial ? TUTORIAL_GRILL : 1);
  for (const e of gev) {
    ev.push(e);
    if (e.type === "burnt") sh.stats.burnt++;
    if (e.type === "coalLow" && !sh.lowSaid.coal) { sh.lowSaid.coal = true; ev.push({ type: "say", text: freshLine(s, OPS.coalLow), kind: "warn" }); }
    if (e.type === "coalOut") ev.push({ type: "say", text: freshLine(s, OPS.coalOut), kind: "warn" });
    if (e.type === "smokeHigh") ev.push({ type: "say", text: freshLine(s, OPS.smoke), kind: "warn" });
  }
  sh.stats.smokeMax = Math.max(sh.stats.smokeMax, sh.grill.smoke);
  tickRice(sh.rice, t, ev);
  if (sh.steamer) tickSteamer(sh.steamer, t, ev);
  if (sh.rice.n <= 3 && !sh.rice.cooking && !sh.lowSaid.rice) { sh.lowSaid.rice = true; ev.push({ type: "riceLow", n: sh.rice.n }); }
  if (sh.rice.n > 3) sh.lowSaid.rice = false;
  if (sh.cleanPlates <= 2 && sh.dirty > 0 && !sh.lowSaid.plates) { sh.lowSaid.plates = true; ev.push({ type: "platesLow", n: sh.cleanPlates }); }
  if (sh.cleanPlates > 3) sh.lowSaid.plates = false;
  // cô chủ đi làm việc
  stepOwner(s, dt, ev, OWNER_TASKS);
  // khách + bàn
  updateGroups(s, dt, ev);
  // đóng quán: hết giờ thì không nhận khách mới; khách đang chờ bàn về; bàn đang ăn được ăn xong
  if (t >= sh.len) {
    for (const g of sh.groups) if (g.phase === "wait" || g.phase === "enter") { g.outcome = "closed"; leaveTable(s, g, ev, "closed"); }
    if (!sh.closingSaid) { sh.closingSaid = true; ev.push({ type: "closing" }); }
  }
  if (t >= sh.len + CLOSE_GRACE_MS) {
    for (const g of sh.groups.slice()) {
      if (g.phase !== "seated" || g.paid) continue;
      if (g.members.some((m) => m.plate)) { for (const m of g.members) if (m.plate) { m.eaten = true; m.req = null; } autoPay(s, g, ev); }
      else leaveTable(s, g, ev, "closed");
    }
  }
  const busy = sh.groups.some((g) => g.phase !== "leave") || sh.schedule.some((g) => !g.done && !sh.closed && g.at < sh.len);
  if (t >= sh.len && !busy && !sh.dialog) return endShift(s, ev);
  return { ok: true };
}

/** Chốt ca: hao (cơm dư cuối ngày, miếng còn trên vỉ, dĩa dở), phí ca, sao, lời lỗ. */
export function endShift(s, ev = []) {
  const sh = s.shift;
  if (!sh) return { err: "no-shift" };
  const lastOfDay = s.shiftIdx >= s.plan.length - 1;
  // miếng còn trên vỉ: chín thì hao, sống thì cũng hao (đã ướp, không để qua ca)
  for (let i = 0; i < sh.grill.slots.length; i++) { const it = sh.grill.slots[i]; if (it) { addWaste(sh, it.item === "suon" ? "suon-uop" : it.item, 1); sh.grill.slots[i] = null; } }
  for (const sl of sh.slots) if (sl.plate) { for (const [id, n] of Object.entries(sl.plate.used)) addWaste(sh, id, n, id === "com" ? n * STOCK["gao-tam"].cost : id === "moHanh" ? n * MO_HANH.portionCost : undefined); sl.plate = null; }
  for (const task of [sh.owner.task, ...sh.owner.queue]) if (task?.plate) for (const [id, n] of Object.entries(task.plate.used)) addWaste(sh, id, n, id === "com" ? n * STOCK["gao-tam"].cost : undefined);
  let riceLeft = sh.rice.n + (sh.rice.cooking?.add || 0);
  if (lastOfDay && riceLeft > 0) { addWaste(sh, "com", riceLeft, riceLeft * STOCK["gao-tam"].cost); }
  s.kitchen.rice = lastOfDay ? 0 : riceLeft;
  s.kitchen.coal = lastOfDay ? 0 : Math.round(sh.grill.coal);
  // phí ca trả bằng tiền trong két (không bao giờ âm)
  const fee = FEES[s.stage === "quan" ? "quan" : "street"](s.level);
  const feePaid = Math.min(s.money, fee);
  s.money -= feePaid;
  const st = sh.stats;
  const coalCost = (sh.coalUsed + (s.kitchen.prepCoal || 0)) * STOCK.than.cost;
  s.kitchen.prepCoal = 0;
  const profit = Math.round(st.revenue - st.cogs - st.wasteCost - coalCost - st.teaCost - fee);
  const avg = st.stars.length ? Math.round((st.stars.reduce((a, b) => a + b, 0) / st.stars.length) * 10) / 10 : 0;
  const people = sh.groups.length;
  const summary = {
    day: s.day, kind: sh.kind, kindName: SHIFTS[sh.kind].name, plates: st.plates, revenue: st.revenue, cogs: Math.round(st.cogs * 10) / 10, waste: Math.round(st.wasteCost * 10) / 10,
    coal: coalCost, coalBaskets: sh.coalUsed, tea: Math.round(st.teaCost * 10) / 10, fee, feePaid, profit, avg, lost: st.lost, timeouts: st.timeouts, passed: st.passed, soldOut: st.soldOut,
    riceLeft: lastOfDay ? riceLeft : 0, burnt: st.burnt, washed: st.washed, perfectFlips: st.perfectFlips, flips: st.flips, mistakes: { ...st.mistakes }, underBill: st.underBill,
    xp: st.xp, level: s.level, money: s.money, consignRepaid: st.consignRepaid, owed: s.consign?.owed || 0, reviews: s.feed.slice(0, Math.min(3, st.reviews)), smokeMax: Math.round(st.smokeMax),
    waterPours: st.waterPours, groups: st.groupsServed, final: lastOfDay, tutorial: sh.tutorial, takeaway: st.takeaway, wasteItems: { ...sh.waste },
  };
  s.stats.plates += st.plates; s.stats.revenue += st.revenue; s.stats.shifts++;
  s.stats.bestProfit = Math.max(s.stats.bestProfit, profit);
  if (sh.tutorial) s.tutorialDone = true;
  s.lastSummary = { ...summary, seen: false };
  s.shift = null;
  if (lastOfDay) { s.dayDone = true; s.between = null; }
  else { s.shiftIdx++; s.between = s.plan[s.shiftIdx]; }
  ev.push({ type: "shiftEnded", profit, plates: st.plates, final: lastOfDay });
  return { ok: true };
}

/** Sang ngày mới: sườn ướp hôm qua hết hạn, hôm nay thành hôm qua (mai tươi tối đa 85), hũ mỡ hành quá 2 ngày bỏ. */
export function nextDay(s, ev = []) {
  if (s.shift) return { err: "open" };
  if (!s.dayDone) return { err: "not-done" };
  const expired = s.uopOld > 0 ? Math.min(s.uopOld, s.stock["suon-uop"] || 0) : 0;
  if (expired) s.stock["suon-uop"] -= expired;
  s.uopOld = s.stock["suon-uop"] || 0;
  let jar = 0;
  if (s.moHanh.n > 0 && s.day + 1 - s.moHanh.day >= MO_HANH.keepDays) { jar = s.moHanh.n; s.moHanh = { n: 0, day: s.day + 1 }; }
  const spoiled = expireStock(s, s.day + 1);
  s.day++; s.dayDone = false; s.between = null; s.shiftIdx = 0;
  s.kitchen = { rice: 0, coal: 0, prepCoal: 0 };
  s.daily = { consigned: false, borrowed: {} };
  s.usedDay = [];
  if (s.lastSummary) s.lastSummary.seen = true;
  ev.push({ type: "newDay", day: s.day, expired, jar, spoiled });
  return { ok: true, expired, jar, spoiled };
}

// ---------- thao tác ở bếp (cô chủ phải đứng ở bếp) ----------
const busy = (s) => (ownerFree(s) ? null : { err: "owner-busy" });
/** Bỏ miếng ướp lên vỉ ở chỗ `slot` (mặc định chỗ trống nóng nhất). Hết sườn ướp ⇒ hội thoại hết hàng. */
export function placeMeat(s, slot, ev = [], item = null) {
  const sh = s.shift, b = busy(s); if (b) return b;
  const sl = slotOf(s);
  const tk = sl.tk !== null ? ticketOf(s, sl.tk) : sh.tickets.find((x) => x.status === "open" || x.status === "pinned");
  item = item || (tk && DISHES[tk.dish]?.meat) || "suon";
  if (slot === null || slot === undefined || slot < 0) slot = hottestFree(sh.grill);
  if (slot < 0) return { err: "grill-full" };
  if (sh.grill.slots[slot]) return { err: "slot-busy" };
  const sid = item === "suon" ? "suon-uop" : item;
  if ((s.stock[sid] || 0) <= 0) return openStockout(s, sid, ev);
  const fresh = item === "suon" ? (s.uopOld > 0 && (s.stock["suon-uop"] || 0) <= s.uopOld ? 85 : sh.uopFresh ?? 100) : 100;
  const r = placeItem(sh.grill, slot, item, fresh);
  if (r.err) return r;
  s.stock[sid]--;
  if (item === "suon" && s.uopOld > 0) s.uopOld = Math.max(0, s.uopOld - 1);
  ev.push({ type: "placed", slot, item });
  return { ok: true };
}
export function flipSlot(s, slot, ev = []) {
  const b = busy(s); if (b) return b;
  const r = flip(s.shift.grill, slot, ev);
  if (r.ok) s.shift.stats.flips++;
  return r;
}
/** Dời miếng chín sang vùng giữ ấm. */
export function moveWarm(s, slot, ev = []) {
  const b = busy(s); if (b) return b;
  const g = s.shift.grill;
  if (zoneOf(slot) === "warm") return { err: "already-warm" };
  const to = freeWarm(g);
  if (to < 0) return { err: "warm-full" };
  const r = moveItem(g, slot, to);
  if (r.ok) ev.push({ type: "moved", from: slot, to });
  return r;
}
/** Bỏ miếng cháy (ghi hao). */
export function discardMeat(s, slot, ev = []) {
  const b = busy(s); if (b) return b;
  const r = takeItem(s.shift.grill, slot);
  if (r.err) return r;
  addWaste(s.shift, r.it.item === "suon" ? "suon-uop" : r.it.item, 1);
  ev.push({ type: "meatDiscarded", slot, result: itemResult(r.it) });
  return { ok: true };
}
/**
 * Chạm một chỗ trên vỉ (chip Thanh Bếp / miếng trong cảnh): trống ⇒ bỏ miếng ướp; cháy đen ⇒ bỏ; chín hai mặt ⇒ gắp vào dĩa đang mở
 * (nếu dĩa cần và đã có cơm), không thì dời sang vùng giữ ấm; còn lại ⇒ lật.
 */
export function grillTap(s, slot, ev = []) {
  const sh = s.shift, b = busy(s); if (b) return b;
  const it = sh.grill.slots[slot];
  if (!it) return placeMeat(s, slot, ev);
  const r = itemResult(it);
  if (r === "burnt") return discardMeat(s, slot, ev);
  if (isCooked(it)) {
    const sl = slotOf(s), p = sl.plate;
    const tg = sl.tk !== null ? targetOf(ticketOf(s, sl.tk)) : null;
    if (p && tg && tg.meat === it.item && !p.meat && (p.com > 0 || tg.com === 0)) return pickMeat(s, slot, ev);
    if (zoneOf(slot) !== "warm" && freeWarm(sh.grill) >= 0) return moveWarm(s, slot, ev);
    if (zoneOf(slot) === "warm") return { err: "cooked-wait", detail: p ? (p.com ? "has-meat" : "need-com") : "no-plate" };
  }
  return flipSlot(s, slot, ev);
}
/** Thêm một rổ than. Hết than trong kho: bao dự phòng tự mở; không có thì hội thoại hết than. */
export function addCoalAct(s, ev = []) {
  const sh = s.shift, b = busy(s); if (b) return b;
  if ((s.stock.than || 0) <= 0) {
    if (s.spareSack > 0) { s.spareSack--; s.stock.than = (s.stock.than || 0) + STOCK.than.pack[0]; ev.push({ type: "spareSack" }); }
    else return openStockout(s, "than", ev);
  }
  s.stock.than--; sh.coalUsed++;
  addCoal(sh.grill, sh.t, ev);
  sh.lit = true;
  return { ok: true };
}
export function fanAct(s, on, ev = []) {
  if (on) { const b = busy(s); if (b) return b; }
  setFan(s.shift.grill, on);
  if (on) ev.push({ type: "fan" });
  return { ok: true };
}
export function cookRiceAct(s, ev = []) {
  const b = busy(s); if (b) return b;
  const sh = s.shift;
  const r = startCook(s, sh.rice, sh.t, ev);
  if (r.err === "no-gao") return openStockout(s, "gao-tam", ev);
  return r;
}
export function eggAct(s, ev = []) {
  const b = busy(s); if (b) return b;
  if (!s.shift.pan) return { err: "locked" };
  return startEgg(s, s.shift.pan, s.shift.t, ev);
}
export function steamAct(s, ev = []) {
  const b = busy(s); if (b) return b;
  if (!s.shift.steamer) return { err: "locked" };
  return loadSteamer(s, s.shift.steamer, s.shift.t, ev);
}
/** Giao dĩa ở ô bày: tại bàn ⇒ cô chủ bưng ra (việc trong hàng đợi); mang về ⇒ đưa shipper ở quầy ngay. */
export function serve(s, ev = []) {
  const sh = s.shift, sl = slotOf(s);
  if (sl.tk === null) return { err: "no-ticket" };
  if (!sl.plate) return { err: "need-container" };
  const t = ticketOf(s, sl.tk);
  if (!t || t.status === "void") return { err: "bad-ticket" };
  const g = groupById(s, t.gid);
  if (!g) return { err: "gone" };
  if (t.takeaway) {
    const b = busy(s); if (b) return b;
    const plate = sl.plate; sl.plate = null; sl.tk = null;
    return serveTakeaway(s, g, t, plate, ev);
  }
  const r = enqueue(s, { kind: "deliver", tid: t.tid, tk: t.id, pid: sh.nextPid++, plate: sl.plate, pickup: true }, ev);
  if (r.err) return r;
  t.status = "carrying";
  sl.plate = null; sl.tk = null;
  ev.push({ type: "serving", tk: t.id, tid: t.tid });
  return { ok: true };
}
/** Không còn dĩa sạch lẫn dĩa dơ trong thau (mọi dĩa đang trên bàn). */
export const platesNone = (s) => s.shift.cleanPlates <= 0 && s.shift.dirty <= 0;
export function washAct(s, ev = []) {
  if (s.shift.dirty <= 0) return { err: "no-dirty" };
  return enqueue(s, { kind: "wash" }, ev);
}
export function moHanhAct(s, ev = []) {
  if ((s.stock["mo-hanh-bo"] || 0) <= 0) return openStockout(s, "mo-hanh-bo", ev);
  return enqueue(s, { kind: "moHanh" }, ev);
}
export function marinateAct(s, ev = []) {
  if ((s.stock.suon || 0) <= 0) return { err: "no-suon" };
  return enqueue(s, { kind: "marinate" }, ev);
}
export { levelForXp, bestPiece, allServed };
