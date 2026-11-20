// Dây chuyền ráp ổ trên thớt (GAME-DESIGN §3.2): lấy bánh → (nướng lại) → rạch → phết → nhân → rau dưa → gia vị → gói → giao + thối tiền.
// Thứ tự một chiều: làm bước sau thì bước trước khoá lại (sửa được bước đang làm; Hoàn tác để quay lui). Nguyên liệu trừ ngay khi bỏ lên ổ;
// bỏ ra / hoàn tác / đổ ổ thì phần đã dùng ghi hao hụt (không hoàn kho). Hết hàng ở bước nào thì mở hội thoại cứu (core/rescue.js).
import { STOCK, LEVEL_USE, SPREADS, FILLINGS, VEG, VEG_IDS, SAUCES, WRAPS, TOASTER } from "../data/economy.js?v=b1";
import { addWaste, toastResult } from "./oven.js?v=b1";

export const STEPS = ["take", "toast", "slice", "spread", "fill", "veg", "spice", "wrap"];
export const STEP_NAME = { take: "Lấy bánh", toast: "Nướng lại", slice: "Rạch bánh", spread: "Phết", fill: "Nhân", veg: "Rau dưa", spice: "Gia vị", wrap: "Gói" };
const IDX = Object.fromEntries(STEPS.map((s, i) => [s, i]));

export const emptyBoard = (cid = null, item = 0) => ({ cid, item, loaf: null, step: -1, hist: [] });
export const board = (s) => s.shift.boards[s.shift.sel];
const blank = () => ({ spreads: {}, fills: [], veg: {}, ot: 0, sauces: {}, wrap: null, sliced: false, toasted: false, toastT0: null, used: {} });
const snap = (l) => { const { used, ...rest } = l; return JSON.stringify(rest); };

/** Dùng `n` phần `id` cho ổ đang ráp. Thiếu kho ⇒ mở hội thoại hết hàng, không làm bước. */
function use(s, l, id, n, ev) {
  if (n <= 0) return true;
  if ((s.stock[id] || 0) < n) { openStockout(s, id, ev); return false; }
  s.stock[id] -= n;
  l.used[id] = (l.used[id] || 0) + n;
  if (s.stock[id] <= 2 && STOCK[id].kho !== undefined) lowStock(s, id, ev);
  return true;
}
function lowStock(s, id, ev) {
  const sh = s.shift;
  if (s.stock[id] > 2 || sh.lowSaid[id] === s.stock[id] || s.stock[id] === 0) return;
  sh.lowSaid[id] = s.stock[id];
  ev.push({ type: "lowStock", id, n: s.stock[id] });
}
export function openStockout(s, id, ev) {
  const sh = s.shift;
  if (sh.dialog) return;
  const cid = board(s)?.cid ?? null;
  sh.dialog = { kind: "stockout", id, cid };
  ev.push({ type: "stockout", id, cid });
}

/** Kiểm thứ tự: bước `step` làm được khi thớt có phiếu, chưa gói, không đi lùi; rạch trước rồi mới phết / nhân… */
function guard(s, step) {
  const sh = s.shift;
  if (!sh) return { err: "no-shift" };
  if (sh.away) return { err: "away" };
  if (sh.dialog) return { err: "dialog" };
  if (sh.paying !== null && sh.paying !== undefined) return { err: "paying" };
  const b = board(s);
  if (b.cid === null) return { err: "no-ticket" };
  const i = IDX[step];
  if (step !== "take" && !b.loaf) return { err: "wrong-step", detail: { want: "take" } };
  if (b.loaf?.wrap && step !== "wrap") return { err: "wrapped" };
  if (b.loaf && b.loaf.toastT0 !== null && step !== "toast") return { err: "toasting" };
  if (step === "take" && b.loaf) return { err: "has-loaf" };
  if (step === "toast" && b.loaf?.sliced) return { err: "wrong-step", detail: { want: STEPS[Math.max(b.step, 2)] } };
  if (i >= IDX.spread && !b.loaf.sliced) return { err: "wrong-step", detail: { want: "slice" } };
  if (i < b.step && step !== "toast") return { err: "wrong-step", detail: { want: STEPS[b.step], back: step } };
  return { b };
}
function record(b, step) { b.hist.push({ step: b.step, loaf: snap(b.loaf) }); if (b.hist.length > 20) b.hist.shift(); b.step = Math.max(b.step, IDX[step]); }

/** Bước 1: lấy một ổ từ tủ kính (mặc định ổ giòn nhất). */
export function take(s, loafId, ev) {
  const g = guard(s, "take"); if (g.err) return g;
  const sh = s.shift, b = g.b;
  if (!sh.case.length) { openStockout(s, "banh", ev); return { ok: true, dialog: true }; }
  let i = Number.isInteger(loafId) ? sh.case.findIndex((l) => l.id === loafId) : -1;
  if (i < 0) i = sh.case.reduce((bi, l, k) => (l.crisp > sh.case[bi].crisp ? k : bi), 0);
  const [l] = sh.case.splice(i, 1);
  b.loaf = { ...blank(), id: l.id, crisp: l.crisp, src: l.src, dark: !!l.dark };
  b.hist = []; b.step = 0;
  ev.push({ type: "step", step: "take", crisp: Math.round(l.crisp) });
  return { ok: true };
}
/** Bước 2 (tuỳ chọn): nướng lại trên lò than. Gọi lần 1 = bỏ vào (tốn 1 lần than), lần 2 = lấy ra. */
export function toast(s, ev) {
  const g = guard(s, "toast"); if (g.err) return g;
  const sh = s.shift, l = g.b.loaf;
  if (l.toastT0 === null) {
    const busy = sh.boards.filter((x) => x.loaf && x.loaf.toastT0 !== null).length;
    if (busy >= TOASTER.slots) return { err: "toaster-busy" };
    if (!use(s, l, "than", 1, ev)) return { ok: true, dialog: true };
    record(g.b, "toast");
    l.toastT0 = sh.t; l.readyWarned = false; l.burntWarned = false;
    sh.stats.toasts++;
    ev.push({ type: "step", step: "toast", on: true });
    return { ok: true };
  }
  const r = toastResult(l, sh.t - l.toastT0);
  l.crisp = r.crisp; l.toastT0 = null; l.toasted = l.toasted || r.toasted;
  if (r.burnt) l.burnt = true;
  ev.push({ type: "step", step: "toast", on: false, crisp: Math.round(l.crisp), burnt: !!r.burnt });
  return { ok: true };
}
export function slice(s, ev) {
  const g = guard(s, "slice"); if (g.err) return g;
  if (g.b.loaf.sliced) return { err: "done" };
  record(g.b, "slice");
  g.b.loaf.sliced = true;
  ev.push({ type: "step", step: "slice" });
  return { ok: true };
}
/** Phết: đặt nấc 0–3 cho pate / bơ / mayo. Lên nấc thì dùng thêm phần; xuống nấc thì phần đã phết ghi hao. */
export function spread(s, id, lvl, ev) {
  if (!SPREADS.includes(id) || !Number.isInteger(lvl) || lvl < 0 || lvl > 3) return { err: "bad-choice" };
  if (STOCK[id].unlock > s.level) return { err: "locked" };
  const g = guard(s, "spread"); if (g.err) return g;
  const l = g.b.loaf, cur = l.spreads[id] || 0;
  if (cur === lvl) return { err: "same" };
  const need = LEVEL_USE[lvl] - LEVEL_USE[cur];
  if (need > 0 && !use(s, l, id, need, ev)) return { ok: true, dialog: true };
  if (need < 0) addWaste(s.shift, "spoil", -need * STOCK[id].cost);
  record(g.b, "spread");
  if (lvl) l.spreads[id] = lvl; else delete l.spreads[id];
  ev.push({ type: "step", step: "spread", id, lvl });
  return { ok: true };
}
/** Nhân: bật / tắt một nhân. */
export function fill(s, id, ev) {
  if (!FILLINGS.includes(id)) return { err: "bad-choice" };
  if (STOCK[id].unlock > s.level) return { err: "locked" };
  const g = guard(s, "fill"); if (g.err) return g;
  const l = g.b.loaf;
  if (l.fills.includes(id)) { record(g.b, "fill"); l.fills = l.fills.filter((x) => x !== id); addWaste(s.shift, "spoil", STOCK[id].cost); ev.push({ type: "step", step: "fill", id, on: false }); return { ok: true }; }
  if (!use(s, l, id, 1, ev)) return { ok: true, dialog: true };
  record(g.b, "fill");
  l.fills.push(id);
  ev.push({ type: "step", step: "fill", id, on: true });
  return { ok: true };
}
/** Bỏ qua nhân (pate bơ không có nhân): đánh dấu đã qua bước nhân. */
export function skip(s, step, ev) {
  if (!["fill", "spread", "veg", "spice"].includes(step)) return { err: "bad-choice" };
  const g = guard(s, step); if (g.err) return g;
  record(g.b, step);
  ev.push({ type: "step", step, skip: true });
  return { ok: true };
}
/** Rau dưa: bật / tắt từng thứ, "all" = đủ bốn thứ (rồi gỡ hành nếu phiếu dặn). Rau mùi + hành lá dùng chung một phần rau. */
export function veg(s, id, ev) {
  if (id !== "all" && !VEG_IDS.includes(id)) return { err: "bad-choice" };
  const g = guard(s, "veg"); if (g.err) return g;
  const l = g.b.loaf;
  const ids = id === "all" ? VEG_IDS.filter((x) => !l.veg[x]) : [id];
  if (id === "all" && !ids.length) return { err: "same" };
  const turnOn = id === "all" || !l.veg[id];
  if (turnOn) {
    const need = {};
    for (const x of ids) { const k = VEG[x]; if (!(l.used[k] > 0) && !need[k]) need[k] = 1; }
    for (const [k, n] of Object.entries(need)) if ((s.stock[k] || 0) < n) { openStockout(s, k, ev); return { ok: true, dialog: true }; }
    for (const [k, n] of Object.entries(need)) use(s, l, k, n, ev);
  }
  record(g.b, "veg");
  for (const x of ids) l.veg[x] = turnOn;
  ev.push({ type: "step", step: "veg", id, on: turnOn });
  return { ok: true };
}
/** Gia vị: ớt nấc 0–3, nước tương / tương ớt bật tắt. Có gia vị nào thì dùng 1 phần gia vị (một lần mỗi ổ). */
export function spice(s, id, lvl, ev) {
  if (id !== "ot" && !SAUCES.includes(id)) return { err: "bad-choice" };
  const g = guard(s, "spice"); if (g.err) return g;
  const l = g.b.loaf;
  if (id === "ot" && (!Number.isInteger(lvl) || lvl < 0 || lvl > 3 || lvl === l.ot)) return { err: "bad-choice" };
  const on = id === "ot" ? lvl > 0 : !l.sauces[id];
  if (on && !(l.used["gia-vi"] > 0) && !use(s, l, "gia-vi", 1, ev)) return { ok: true, dialog: true };
  record(g.b, "spice");
  if (id === "ot") l.ot = lvl; else if (on) l.sauces[id] = true; else delete l.sauces[id];
  ev.push({ type: "step", step: "spice", id, lvl: id === "ot" ? lvl : on ? 1 : 0 });
  return { ok: true };
}
/** Gói: giấy / cắt đôi / túi. Túi: một túi đựng tới 5 ổ của cùng đơn. */
export function wrap(s, kind, ev) {
  if (!WRAPS[kind]) return { err: "bad-choice" };
  const g = guard(s, "wrap"); if (g.err) return g;
  const sh = s.shift, l = g.b.loaf;
  if (l.wrap) return { err: "wrapped" };
  if (!use(s, l, "giay-goi", 1, ev)) return { ok: true, dialog: true };
  if (kind === "tui") {
    const c = sh.customers.find((x) => x.id === g.b.cid);
    const bagged = c ? c.filled.filter((f) => f?.wrap === "tui").length : 0;
    if (bagged % 5 === 0 && !use(s, l, "tui", 1, ev)) return { ok: true, dialog: true };
  }
  record(g.b, "wrap");
  l.wrap = kind;
  ev.push({ type: "step", step: "wrap", id: kind });
  return { ok: true };
}
/** Hoàn tác bước gần nhất (phần nguyên liệu đã dùng không hoàn kho: ghi hao). */
export function undo(s, ev) {
  const sh = s.shift;
  if (!sh || sh.away) return { err: sh ? "away" : "no-shift" };
  if (sh.paying !== null && sh.paying !== undefined) return { err: "paying" };
  const b = board(s);
  if (!b.loaf || !b.hist.length) return { err: "nothing" };
  if (b.loaf.toastT0 !== null) return { err: "toasting" };
  const h = b.hist.pop();
  const used = b.loaf.used, crisp = b.loaf.crisp, burnt = b.loaf.burnt, toasted = b.loaf.toasted;
  const prev = JSON.parse(h.loaf);
  const added = diffUse(prev, b.loaf);
  for (const [id, n] of Object.entries(added)) addWaste(sh, "spoil", n * STOCK[id].cost);
  b.loaf = { ...prev, used, crisp, burnt, toasted, toastT0: null };
  b.step = h.step;
  ev.push({ type: "undone" });
  return { ok: true };
}
/** Nguyên liệu nằm trên ổ `now` mà `prev` chưa có (để ghi hao khi hoàn tác). */
function diffUse(prev, now) {
  const out = {};
  for (const id of SPREADS) { const d = LEVEL_USE[now.spreads[id] || 0] - LEVEL_USE[prev.spreads?.[id] || 0]; if (d > 0) out[id] = d; }
  for (const id of now.fills) if (!(prev.fills || []).includes(id)) out[id] = (out[id] || 0) + 1;
  if (now.wrap && !prev.wrap) out["giay-goi"] = 1;
  return out;
}
/** Đổ ổ đang ráp (hao cả ổ), thớt giữ phiếu để làm lại. */
export function discard(s, ev) {
  const sh = s.shift;
  if (!sh || sh.away) return { err: sh ? "away" : "no-shift" };
  if (sh.paying !== null && sh.paying !== undefined) return { err: "paying" };
  const b = board(s);
  if (!b.loaf) return { err: "nothing" };
  wasteLoaf(sh, b.loaf, "Đổ ổ đang ráp");
  b.loaf = null; b.step = -1; b.hist = [];
  ev.push({ type: "discarded" });
  return { ok: true };
}
/** Ghi hao cả ổ: phôi + mọi phần đã dùng. */
export function wasteLoaf(sh, l, label) {
  let k = l.src === "si" ? STOCK["banh-si"].cost : STOCK.phoi.cost;
  for (const [id, n] of Object.entries(l.used || {})) k += n * STOCK[id].cost;
  addWaste(sh, "spoil", k, label);
}
/** Ổ đã gói ⇒ bản ghi để chấm (không giữ lịch sử). */
export function finished(l, item) {
  return { spreads: { ...l.spreads }, fills: [...l.fills], veg: { ...l.veg }, ot: l.ot, sauces: { ...l.sauces }, wrap: l.wrap, crisp: l.crisp,
    burnt: !!l.burnt, dark: !!l.dark, toasted: !!l.toasted, src: l.src, used: { ...l.used }, item };
}
