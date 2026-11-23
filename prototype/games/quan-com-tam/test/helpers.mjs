// Tiện ích test + bot chơi tự động (chỉ dùng apply(), như người chơi). Import có ?v=c1 để dùng chung module với core.
import { apply } from "../core/apply.js?v=c1";
import { createState } from "../core/state.js?v=c1";
import { itemResult, isCooked, zoneOf, freeWarm } from "../core/grill.js?v=c1";
import { tableJob, groupById } from "../core/tables.js?v=c1";
import { nextStep, slotOf } from "../core/plate.js?v=c1";
import { stockoutOptions } from "../core/rescue.js?v=c1";
import { ownerFree } from "../core/walker.js?v=c1";
import { canAutoBill } from "../core/bill.js?v=c1";
import { GRILL } from "../data/economy.js?v=c1";
import { heatMul } from "../core/grill.js?v=c1";
import { pickFree } from "../core/drama.js?v=c1"; // B: drama

/** Giây tới lúc miếng cần tay (mặt dưới chạm 100 nếu chưa chín, chạm 128 nếu đã chín) — bot chăm không rời bếp khi sắp tới lúc. */
export function grillSafeSec(s) {
  const g = s.shift.grill;
  let min = Infinity;
  g.slots.forEach((it, i) => {
    if (!it) return;
    const z = zoneOf(i);
    if (z === "warm" && it.warmMs < GRILL.warmSafeMs - 8000) return;
    const rate = (100 / GRILL.side[it.item]) * GRILL.zoneMul[z] * Math.max(0.6, heatMul(g)) * (s.shift.tutorial ? 0.85 : 1) * (z === "hot" ? 1.3 : 1);
    const b = it.sides[0];
    const target = b < 100 ? 100 : 127;
    min = Math.min(min, Math.max(0, (target - b) / rate));
  });
  return min;
}

export { apply, createState };
/** apply + ném lỗi nếu không được. */
export function must(s, a) { const r = apply(s, a); if (r.err) throw new Error(`${a.type}: ${r.err} ${JSON.stringify(r.detail ?? "").slice(0, 300)}`); return r; }
export function tryAct(s, a) { return apply(s, a); }
export function newGame(seed = 7, { intro = true } = {}) {
  const s = createState(seed);
  if (intro) must(s, { type: "seeIntro" });
  return s;
}
/** Chuẩn bị đầu ngày như người chơi: nhập + ướp đủ, nấu nồi cơm, làm mỡ hành, nhóm bếp. */
export function prepDay(s, { light = true, cook = true, moHanh = true, restock = true } = {}) {
  const log = [];
  if (restock) log.push(apply(s, { type: "restockToday" }));
  if (cook) log.push(apply(s, { type: "prepCook" }));
  if (moHanh && s.moHanh.n < 10) log.push(apply(s, { type: "prepMoHanh" }));
  if (light) log.push(apply(s, { type: "prepLight" }));
  return log;
}

/**
 * Một bước bot trong ca. skill: "good" (chăm), "sloppy" (ẩu: lật trễ, quên lớp, không châm trà). Trả số thao tác thành công.
 * Bot ẩu dùng rng riêng (không đụng s.rng) để kết quả vẫn tất định theo hạt.
 */
export function botStep(s, skill = "good", rnd = Math.random, events = []) {
  const sh = s.shift;
  if (!sh) return 0;
  let n = 0;
  const A = (a) => { const r = apply(s, a); if (r.ok) { n++; events.push(...r.events); } return r; };
  const d = sh.dialog;
  if (d) {
    if (d.kind === "complaint") A({ type: "complaint", choice: d.serious ? "remake" : skill === "good" ? "discount" : "free" });
    else if (d.kind === "overcharge") A({ type: "overcharge", choice: "refund" });
    else if (d.kind === "stockout") {
      const opts = stockoutOptions(s).filter((o) => o.ok);
      const pref = ["consign", "marinate", "borrow", "ship", "run", "bread", "dismiss", "soldOut"];
      const o = pref.map((id) => opts.find((x) => x.id === id)).find(Boolean) || opts[0];
      A({ type: "stockout", choice: o.id });
    } else if (d.kind === "event") A({ type: "event", choice: pickFree(s, rnd) }); // B: drama — bot chọn một lựa chọn bấm được
    return n;
  }
  // tính tiền
  if (sh.billing) {
    if (canAutoBill(s) && skill === "good") A({ type: "autoBill" });
    else for (const l of sh.billing.lines) if ((l.real || (skill === "sloppy" && rnd() < 0.15)) && !sh.billing.tapped.includes(l.key)) A({ type: "tapLine", key: l.key });
    A({ type: "collect" });
    return n;
  }
  // xếp chỗ
  for (const g of sh.groups.filter((x) => x.phase === "wait")) {
    const t = sh.tables.find((x) => x.gid === null && x.state !== "dirty" && x.seats >= g.size);
    if (t) A({ type: "seat", gid: g.id, tid: t.id });
  }
  // bếp (khi cô chủ ở bếp)
  if (ownerFree(s)) {
    const g = sh.grill;
    g.slots.forEach((it, i) => {
      if (!it) return;
      const r = itemResult(it);
      if (r === "burnt") { A({ type: "discardMeat", slot: i }); return; }
      const late = skill === "sloppy" ? 106 + rnd() * 16 : 100;
      if (it.sides[0] >= late && it.sides[1] < 100) A({ type: "flip", slot: i });
      else if (isCooked(it) && zoneOf(i) !== "warm" && freeWarm(g) >= 0) {
        const sl = slotOf(s);
        if (!(sl.plate && sl.plate.com && !sl.plate.meat)) A({ type: "moveWarm", slot: i });
      }
    });
    if (g.coal < 40 && !g.pending.length) A({ type: "addCoal" });
    if (sh.rice.n <= 2 && !sh.rice.cooking && (s.stock["gao-tam"] || 0) > 0) A({ type: "cookRice" });
    // bày dĩa
    const sl = slotOf(s);
    if (sl.tk === null) {
      const t = sh.tickets.find((x) => x.status === "open" && groupById(s, x.gid)?.phase === "seated") || sh.tickets.find((x) => x.status === "open");
      if (t) A({ type: "pin", tk: t.id });
    }
    for (let k = 0; k < 14 && slotOf(s).tk !== null && ownerFree(s) && !s.shift.dialog; k++) {
      const step = nextStep(s);
      if (!step || step.startsWith("wait")) break;
      if (skill === "sloppy" && ["moHanh", "doChua"].includes(step) && rnd() < 0.12) { A({ type: "serve" }); break; }
      const r = A({ type: "autoStep" });
      if (r.err) { if (r.err === "no-meat" || r.err === "rice-cooking" || r.err === "rice-empty") break; if (step === "dia" && r.err === "no-plates") { A({ type: "layer", id: "hop" }); continue; } break; }
      if (step === "serve" || !s.shift) break;
    }
    // nướng sẵn cho phiếu đang chờ
    if (s.shift && ownerFree(s)) {
      const want = sh.tickets.filter((x) => x.status === "open" || x.status === "pinned").length;
      const onGrill = sh.grill.slots.filter(Boolean).length;
      const plated = sh.slots.some((x) => x.plate && !x.plate.meat) ? 1 : 0;
      const need = sh.tickets.filter((x) => (x.status === "open" || x.status === "pinned")).length - sh.grill.slots.filter((it) => it && isCooked(it)).length;
      if (onGrill < Math.min(skill === "good" ? 3 : 4, want) && need > 0 + (plated ? 0 : 0) && (s.stock["suon-uop"] || 0) > 0) A({ type: "placeMeat", slot: skill === "good" ? 2 + (sh.grill.slots[2] ? 1 : 0) : -1 });
      if (s.moHanh.n < 2 && (s.stock["mo-hanh-bo"] || 0) > 0 && !sh.owner.queue.some((q) => q.kind === "moHanh")) A({ type: "moHanh" });
    }
  }
  if (!s.shift) return n;
  // việc ở bàn (bot chăm không rời bếp khi miếng sắp tới lúc lật / gắp)
  const safe = skill === "good" ? grillSafeSec(s) : Infinity;
  for (const t of sh.tables) {
    if (safe < 7 && ownerFree(s)) break;
    const job = tableJob(s, t.id);
    if (!job || job === "seat") continue;
    if (skill === "sloppy" && job === "visit" && rnd() < 0.3) continue;
    A({ type: "tableTap", tid: t.id });
  }
  if (sh.cleanPlates <= 2 && sh.dirty > 0 && safe >= 9) A({ type: "wash" });
  return n;
}
/** Chơi trọn một ca bằng bot; trả sự kiện. */
export function playShift(s, { skill = "good", dt = 200, rnd = Math.random, maxMs = 900000 } = {}) {
  const events = [];
  must(s, { type: "startShift" });
  for (let t = 0; s.shift && t < maxMs; t += dt) {
    botStep(s, skill, rnd, events);
    if (!s.shift) break;
    if (!s.shift.dialog) { const r = apply(s, { type: "tick", dt }); if (r.err) throw new Error("tick: " + r.err + " " + (r.detail || "")); events.push(...r.events); }
  }
  if (s.shift) throw new Error("ca không kết thúc");
  return events;
}
/** Chơi trọn một ngày: chuẩn bị, các ca, sang ngày mới. */
export function playDay(s, opts = {}) {
  prepDay(s, opts.prep || {});
  const ev = [];
  do { ev.push(...playShift(s, opts)); } while (!s.dayDone);
  must(s, { type: "nextDay" });
  return ev;
}
/** RNG có hạt cho bot ẩu (không đụng s.rng). */
export function seeded(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/** Tua ca tới khi cond(s) đúng (tối đa maxMs), không tua qua hội thoại. */
export function until(s, cond, maxMs = 60000, dt = 100) {
  for (let t = 0; t < maxMs; t += dt) { if (cond(s)) return true; if (!s.shift || s.shift.dialog) return cond(s); must(s, { type: "tick", dt }); }
  return cond(s);
}
/** Mở ca ngày 1 (đã chuẩn bị đủ) và đưa nhóm khách đầu tiên vào bàn, lấy phiếu xong. Trả { g, t (phiếu) }. */
export function openWithOrder(seed = 7, opts = {}) {
  const s = newGame(seed);
  if (opts.notTutorial) s.tutorialDone = true;
  prepDay(s);
  must(s, { type: "startShift" });
  until(s, (x) => x.shift.groups.some((g) => g.phase === "wait"), 90000);
  const g = s.shift.groups.find((x) => x.phase === "wait");
  const tid = s.shift.tables.find((t) => t.seats >= g.size).id;
  must(s, { type: "seat", gid: g.id, tid });
  until(s, () => g.phase === "seated" || s.shift.groups.find((x) => x.id === g.id)?.phase === "seated");
  must(s, { type: "tableTap", tid });
  until(s, (x) => x.shift.tickets.length > 0, 20000);
  return { s, g: s.shift.groups.find((x) => x.id === g.id), tid, t: s.shift.tickets[0] };
}
/** Đợi cô chủ về bếp. */
export const home = (s) => until(s, (x) => ownerFree(x), 30000);
/** Bày đủ một dĩa đúng phiếu đang ghim (dùng miếng chín đặt sẵn lên vỉ). */
export function cookedPiece(s, slot = 4, item = "suon", sides = [105, 105]) {
  s.shift.grill.slots[slot] = { id: 99 + slot, item, sides: [...sides], fresh: 100, freshMax: 100, warmMs: 0, flips: 2, perfect: 1, said: {} };
}
