// Cửa duy nhất đổi trạng thái: apply(state, action) ⇒ { ok, events, result } | { err, events: [] }.
// Chạy trên bản nháp (structuredClone): lỗi ⇒ trạng thái không đổi. Kiểm bất biến một chỗ trước khi ghi:
// tiền ≥ 0 (số nguyên), kho số nguyên ≥ 0 và không vượt sức chứa vì hàng mới, danh tiếng 0–100, cấp khớp XP,
// trong ca: dĩa được bảo toàn (sạch + dơ + đang bày + đang bưng + trên bàn = số dĩa quán có), than / khói 0–100, nồi cơm không âm.
// Bấm lặp / tải lại không cộng hai lần: giao chỉ khi ô bày có dĩa, tính tiền chỉ khi phiếu tính tiền đang mở, mỗi lớp trừ kho đúng một lần.
import * as sh from "./shift.js?v=c8";
import * as pl from "./plate.js?v=c8";
import * as tb from "./tables.js?v=c8";
import * as st from "./stock.js?v=c8";
import { tapLine, autoTap } from "./bill.js?v=c8";
import { resolveStockout, openStockout } from "./rescue.js?v=c8";
import { cookNow, makeJar, freshRice } from "./rice.js?v=c8";
import { enqueue, ownerFree } from "./walker.js?v=c8";
import { levelForXp } from "./progress.js?v=c8";
import { STOCK_IDS, SHIFTS, GRILL } from "../data/economy.js?v=c8";
import { setPersona, reply } from "./reviews.js?v=c8"; // C: tính cách + trả lời review
import { choose as dramaChoose, openEvent } from "./drama.js?v=c8"; // B: drama
import { aHandlers } from "./progression-actions.js?v=c8"; // A: thao tác tiến trình + kinh tế M3
import { afterApply as aAfter } from "./progression.js?v=c8"; // A: nhiệm vụ, ghi sổ, câu theo cơ chế sau mỗi action
import { sHandlers, HAND as S_HAND, afterApply as sAfter } from "./extras.js?v=c8"; // S: M5 (menu, hội chợ, thử thách, bày ×N, tủ kính, vỉ chay, bếp 2, nợ, trang trí Drama)
import { batchLayer as aBatchLayer } from "./progression.js?v=c8"; // S: bày ×N dùng chung với mâm cơm

const inShift = (f) => (s, a, ev) => (s.shift ? f(s, a, ev) : { err: "no-shift" });
const noShift = (f) => (s, a, ev) => (s.shift ? { err: "in-shift" } : f(s, a, ev));
const noDialog = (f) => inShift((s, a, ev) => (s.shift.dialog ? { err: "dialog" } : f(s, a, ev)));

/** Bước mặc định theo phiếu (phím Space, bot). */
function autoStep(s, ev) {
  const n = pl.nextStep(s);
  if (!n) return { err: "no-ticket" };
  if (n === "grill") return sh.placeMeat(s, -1, ev);
  if (n === "egg") return sh.eggAct(s, ev);
  if (n === "serve") return sh.serve(s, ev);
  if (n.startsWith("wait")) return { err: n };
  return outToDialog(s, pl.layer(s, n, ev), ev);
}
/** Hết nguyên liệu khi bày ⇒ mở hội thoại hết hàng (không bao giờ kẹt). Hết cơm mà còn gạo ⇒ báo nấu; hết cả gạo ⇒ hội thoại. */
function outToDialog(s, r, ev) {
  if (r.err === "out" && r.id) return openStockout(s, r.id, ev);
  if (r.err === "rice-empty" && (s.stock["gao-tam"] || 0) <= 0) return openStockout(s, "gao-tam", ev);
  if (r.err === "mo-hanh-empty" && (s.stock["mo-hanh-bo"] || 0) <= 0) return openStockout(s, "mo-hanh-bo", ev);
  if (r.err === "no-plates" && sh.platesNone(s) && (s.stock.hop || 0) <= 0) return openStockout(s, "hop", ev);
  if (r.err === "no-hop") return openStockout(s, "hop", ev); // S (M5): hết hộp khi bày hộp mang về ⇒ hội thoại cứu (trước đây phiếu shipper kẹt ở bước hộp)
  return r;
}
const ownerOnly = (f) => noDialog((s, a, ev) => (ownerFree(s) ? f(s, a, ev) : { err: "owner-busy" }));

let A_H = null; // S: bản của A (để extras.js bọc autoStep / serve)
const HANDLERS = {
  tick: inShift((s, a, ev) => sh.tick(s, a.dt, ev)),
  startShift: (s, a, ev) => sh.startShift(s, ev),
  nextDay: (s, a, ev) => sh.nextDay(s, ev),
  setName: (s, a) => {
    const n = typeof a.name === "string" ? a.name.replace(/\s+/g, " ").trim().slice(0, 32) : "";
    if (!n) return { err: "empty-name" };
    s.shopName = n;
    return { ok: true };
  },
  seeIntro: (s) => { s.introSeen = true; return { ok: true }; },
  // C: tính cách cô chủ (màn chào / hỏi một lần / đổi trên bảng trả lời) + trả lời review (trong ca cũng được, khi không có hội thoại)
  persona: (s, a, ev) => setPersona(s, a.persona, ev),
  reply: (s, a, ev) => (s.shift?.dialog ? { err: "dialog" } : reply(s, a.id, a.kind, ev)),
  closeSummary: (s) => { if (!s.lastSummary) return { err: "none" }; s.lastSummary.seen = true; return { ok: true }; },
  // ---- Chuẩn bị (ngoài ca) ----
  restock: (s, a, ev) => (s.shift && s.shift.dialog ? { err: "dialog" } : st.restock(s, a.id, ev, { express: !!s.shift })),
  restockToday: noShift((s, a, ev) => st.restockToday(s, ev)),
  marinate: noShift((s, a, ev) => st.marinate(s, a.n, ev)),
  prepCook: noShift((s, a, ev) => { const r = { n: s.kitchen.rice, size: freshRice().size, cooking: null }; const out = cookNow(s, r, ev); if (out.ok) s.kitchen.rice = r.n; return out; }),
  prepMoHanh: noShift((s, a, ev) => { if (s.moHanh.n >= 10) return { err: "jar-full" }; return makeJar(s, ev); }),
  prepLight: noShift((s, a, ev) => {
    // S (M5): bếp 2 (quán, cấp 14) có than riêng: một chạm nhóm cả hai bếp (bếp 1 trước), mỗi bếp 2 rổ
    const two = !!s.owned?.["grill-2"] && s.stage === "quan";
    const need1 = s.kitchen.coal < GRILL.prepLight.level, need2 = two && (s.kitchen.coal2 || 0) < GRILL.prepLight.level;
    if (!need1 && !need2) return { err: "lit" };
    if ((s.stock.than || 0) < GRILL.prepLight.baskets) return { err: "no-than" };
    for (const k of [need1 && "coal", need2 && "coal2"].filter(Boolean)) {
      if ((s.stock.than || 0) < GRILL.prepLight.baskets) break;
      s.stock.than -= GRILL.prepLight.baskets; s.kitchen.prepCoal += GRILL.prepLight.baskets; s.kitchen[k] = GRILL.prepLight.level;
      ev.push({ type: "lit", grill: k === "coal2" ? 2 : 1 });
    }
    return { ok: true };
  }),
  buyGear: noShift((s, a, ev) => st.buyGear(s, a.id, ev)),
  setPlan: noShift((s, a) => {
    const kinds = Array.isArray(a.kinds) ? a.kinds.filter((k) => SHIFTS[k] && SHIFTS[k].unlock <= s.level) : [];
    if (!kinds.length) return { err: "empty-plan" };
    if (s.shiftIdx > 0 || s.dayDone) return { err: "day-started" };
    s.plan = ["trua", "toi"].filter((k) => kinds.includes(k));
    return { ok: true };
  }),
  consign: (s, a, ev) => (s.shift?.dialog ? { err: "dialog" } : st.consign(s, ev)),
  // ---- Bếp (cô chủ phải đứng ở bếp) ----
  grillTap: noDialog((s, a, ev) => sh.grillTap(s, a.slot, ev)),
  placeMeat: noDialog((s, a, ev) => sh.placeMeat(s, a.slot ?? -1, ev, a.item || null)),
  flip: noDialog((s, a, ev) => sh.flipSlot(s, a.slot, ev)),
  moveWarm: noDialog((s, a, ev) => sh.moveWarm(s, a.slot, ev)),
  discardMeat: noDialog((s, a, ev) => sh.discardMeat(s, a.slot, ev)),
  addCoal: noDialog((s, a, ev) => sh.addCoalAct(s, ev, a.grill === 2 ? 2 : 1)), // S: a.grill = 2 ⇒ bếp 2 than riêng
  fan: inShift((s, a, ev) => sh.fanAct(s, !!a.on, ev)),
  cookRice: noDialog((s, a, ev) => sh.cookRiceAct(s, ev)),
  moHanh: noDialog((s, a, ev) => sh.moHanhAct(s, ev)),
  marinateNow: noDialog((s, a, ev) => sh.marinateAct(s, ev)),
  egg: noDialog((s, a, ev) => sh.eggAct(s, ev)),
  steam: noDialog((s, a, ev) => sh.steamAct(s, ev)),
  // ---- Ô bày ----
  pin: noDialog((s, a, ev) => pl.pin(s, a.tk, ev)),
  selectSlot: noDialog((s, a) => { if (!(a.i >= 0 && a.i < s.shift.slots.length)) return { err: "bad-slot" }; s.shift.sel = a.i; return { ok: true }; }),
  layer: ownerOnly((s, a, ev) => outToDialog(s, pl.layer(s, a.id, ev), ev)),
  pickMeat: ownerOnly((s, a, ev) => pl.pickMeat(s, a.slot, ev)),
  undo: ownerOnly((s, a, ev) => pl.undo(s, ev)),
  discard: noDialog((s, a, ev) => pl.discard(s, ev)),
  serve: noDialog((s, a, ev) => sh.serve(s, ev)),
  autoStep: ownerOnly((s, a, ev) => autoStep(s, ev)),
  voidTicket: noDialog((s, a, ev) => tb.voidTicket(s, a.tk, ev)),
  // ---- Bàn ----
  seat: noDialog((s, a, ev) => tb.seat(s, a.gid, a.tid, ev)),
  tableTap: noDialog((s, a, ev) => tb.tableTap(s, a.tid, ev, a.gid ?? null)),
  wash: noDialog((s, a, ev) => sh.washAct(s, ev)),
  tapLine: noDialog((s, a) => (s.shift.billing ? tapLine(s.shift.billing, a.key) : { err: "no-bill" })),
  autoBill: noDialog((s) => (s.shift.billing ? autoTap(s, s.shift.billing) : { err: "no-bill" })),
  collect: noDialog((s, a, ev) => tb.collect(s, ev)),
  // ---- Hội thoại ----
  complaint: inShift((s, a, ev) => tb.resolveComplaint(s, a.choice, ev)),
  overcharge: inShift((s, a, ev) => tb.resolveOvercharge(s, a.choice, ev)),
  event: (s, a, ev) => dramaChoose(s, a.choice, ev), // B: drama — chọn trong hội thoại sự kiện (trong ca hoặc trên Chuẩn bị)
  eventOpen: (s, a) => openEvent(s, a.id), // B: drama — mở thẳng (test, ?event=ID)
  stockout: inShift((s, a, ev) => {
    const r = resolveStockout(s, a.choice, ev);
    if (r.ok && r.task === "marinate") enqueue(s, { kind: "marinate" }, ev);
    return r;
  }),
  ...(A_H = aHandlers({ noShift, noDialog, ownerOnly, inShift, outToDialog, pl, tb, sh, autoStep })), // A: M3 (bọc layer/undo/discard/serve/buyGear/prepCook + thao tác mới)
  ...sHandlers({ noShift, noDialog, ownerOnly, inShift, outToDialog, pl, tb, sh, autoStep }), // S: M5
};
S_HAND.autoStep = A_H.autoStep; S_HAND.serve = A_H.serve; S_HAND.batchLayer = aBatchLayer; // S
export const ACTIONS = Object.keys(HANDLERS);

/** Hàng ký gửi / cứu giữa ca / nhịp ca được vượt sức chứa kho (không bao giờ kẹt vì kho đầy). */
const OVER_CAP_OK = new Set(["consign", "stockout", "tick", "startShift", "nextDay", "event"]); // B: "event" (quà hàng từ sự kiện)
/** Số dĩa đang có mặt ở mọi nơi trong ca. */
export function platesInPlay(sh) {
  let n = sh.cleanPlates + sh.dirty;
  for (const sl of sh.slots) { if (sl.plate?.kind === "dia") n++; for (const p of sl.batch || []) if (p?.kind === "dia") n++; } // S: bày ×N cho bàn dùng dĩa
  for (const t of [sh.owner.task, ...sh.owner.queue]) { if (t?.plate?.kind === "dia") n++; for (const x of t?.more || []) if (x.plate?.kind === "dia") n++; } // S: bưng 2 dĩa
  for (const g of sh.groups) if (g.table && (g.phase === "seated" || g.phase === "toTable")) for (const m of g.members) if (m.plate?.kind === "dia") n++;
  for (const t of sh.tables) n += t.plates || 0;
  return n;
}
export function invariantError(s, before, type = "") {
  if (!Number.isSafeInteger(s.money) || s.money < 0) return "money";
  for (const id of STOCK_IDS) { const q = s.stock[id]; if (!Number.isInteger(q) || q < 0) return "stock:" + id; }
  const u = st.stockUsed(s);
  if (u > st.capacity(s) && u > (before ? st.stockUsed(before) : 0) && !OVER_CAP_OK.has(type)) return "capacity";
  if (!(s.rep >= 0 && s.rep <= 100)) return "rep";
  if (s.level !== levelForXp(s.xp)) return "level";
  if (!(s.moHanh.n >= 0)) return "mo-hanh";
  if (s.shift) {
    const x = s.shift;
    if (!Number.isInteger(x.cleanPlates) || x.cleanPlates < 0 || !Number.isInteger(x.dirty) || x.dirty < 0) return "plates";
    if (platesInPlay(x) !== s.plates) return "plates-count";
    if (!(x.grill.coal >= 0 && x.grill.coal <= 100)) return "coal";
    if (x.grill.coal2 !== undefined && !(x.grill.coal2 >= 0 && x.grill.coal2 <= 100)) return "coal2"; // S
    if (!(x.grill.smoke >= 0 && x.grill.smoke <= 100)) return "smoke";
    if (!(x.rice.n >= 0)) return "rice";
    if (!(x.sel >= 0 && x.sel < x.slots.length)) return "slot";
    if (x.billing && !x.groups.some((g) => g.id === x.billing.gid && g.phase === "seated")) return "billing";
  }
  return null;
}

/** Bản nháp: chép sâu mọi thứ, trừ sổ review (chỉ thêm phần tử, chép nông). Nhịp ca chạy 60 lần / giây nên tiết kiệm đáng kể. */
function cloneFor(state) {
  const { feed, ...rest } = state;
  const out = structuredClone(rest);
  out.feed = (feed || []).slice();
  return out;
}
export function apply(state, action) {
  const type = action && typeof action === "object" ? action.type : undefined;
  if (typeof type !== "string" || !Object.prototype.hasOwnProperty.call(HANDLERS, type)) return { err: "bad-action", events: [] };
  const draft = cloneFor(state);
  const events = [];
  let result;
  try { result = HANDLERS[type](draft, action, events); } catch (e) { return { err: "exception", detail: String(e?.stack || e), events: [] }; }
  if (!result || result.err) return { err: result?.err || "bad", detail: result?.detail ?? result, events: [] };
  try { aAfter(draft, action, events, result); } catch (e) { return { err: "exception", detail: String(e?.stack || e), events: [] }; } // A:
  try { sAfter(draft, action, events, result); } catch (e) { return { err: "exception", detail: String(e?.stack || e), events: [] }; } // S:
  const bad = invariantError(draft, state, type);
  if (bad) return { err: "invariant-" + bad, events: [] };
  for (const k of Object.keys(state)) delete state[k];
  Object.assign(state, draft);
  return { ok: true, events, result };
}
