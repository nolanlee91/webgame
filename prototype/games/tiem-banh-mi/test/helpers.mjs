// Tiện ích chung cho test luật Tiệm Bánh Mì: tạo tiệm, tua ca, ráp đúng phiếu, bot chơi trọn ca.
import { apply } from "../core/apply.js";
import { createState } from "../core/state.js";
import { customer } from "../core/shift.js";
import { board } from "../core/board.js";
import { batchLevel } from "../core/oven.js";
import { stockoutOptions, nochangeOptions } from "../core/rescue.js";
import { SPREADS, VEG_IDS, SAUCES, RETAIL, BACHUC } from "../data/economy.js";

export const shop = (seed = 7) => { const s = createState(seed); s.introSeen = true; return s; };
export function act(s, a) { const r = apply(s, a); if (r.err) throw new Error(`${a.type}: ${r.err} ${JSON.stringify(r.detail ?? "")}`); return r; }
export const err = (s, a) => apply(s, a).err;
export const types = (r) => r.events.map((e) => e.type);
/** Tua thời gian ca theo nhịp 200 ms (dừng khi có hội thoại hoặc hết ca). */
export function advance(s, ms) {
  const ev = [];
  for (let left = ms; left > 0 && s.shift && !s.shift.dialog; left -= 200) ev.push(...act(s, { type: "tick", dt: Math.min(200, left) }).events);
  return ev;
}
export function untilWaiting(s, max = 240000) {
  for (let t = 0; t < max && s.shift; t += 200) {
    const c = s.shift.customers.find((q) => q.phase === "wait");
    if (c) return c;
    act(s, { type: "tick", dt: 200 });
  }
  throw new Error("không có khách");
}
/** Mở ca với một mẻ đầu chín (đủ 4 ổ trong tủ). */
export function openDay(s, sec = 28) { if (!s.tutorialDone || s.prep === null) act(s, { type: "firstBatch", sec }); return act(s, { type: "startShift" }); }

/** Ráp đúng yêu cầu `it` trên thớt đang ghim (đã có ổ hay chưa). override = sửa yêu cầu để cố tình sai. */
export function build(s, it, override = {}) {
  const want = { ...structuredClone(it), ...override };
  const L = () => board(s).loaf;
  const go = (a) => { if (s.shift?.dialog) throw new Error("dialog"); act(s, a); if (s.shift?.dialog) throw new Error("dialog"); };
  if (!L()) go({ type: "take" });
  if (want.crispy && !L().sliced && L().crisp < 85 && !override.noToast) { if (L().toastT0 === null) go({ type: "toast" }); s.shift.t += 4500; go({ type: "toast" }); }
  if (L().toastT0 !== null) { s.shift.t += 4500; go({ type: "toast" }); }
  if (!L().sliced) go({ type: "slice" });
  let spreads = want.spreads, fills = want.fills;
  if (it.recipe === "bachuc" && !override.fills) ({ spreads, fills } = bachucPick(it.target));
  const step = () => board(s).step;
  if (step() < 3) for (const id of SPREADS) if (spreads[id] && (L().spreads[id] || 0) !== spreads[id]) go({ type: "spread", id, lvl: spreads[id] });
  if (step() <= 4) { for (const id of fills) if (!L().fills.includes(id)) go({ type: "fill", id }); if (step() < 4) go({ type: "skip", step: "fill" }); }
  const vegOn = VEG_IDS.filter((v) => want.veg[v]);
  if (step() <= 5) {
    if (vegOn.length === 4) { if (VEG_IDS.some((v) => !L().veg[v])) go({ type: "veg", id: "all" }); }
    else for (const v of vegOn) if (!L().veg[v]) go({ type: "veg", id: v });
    if (step() < 5) go({ type: "skip", step: "veg" });
  }
  if (step() <= 6) {
    if (want.ot && L().ot !== want.ot) go({ type: "spice", id: "ot", lvl: want.ot });
    for (const id of SAUCES) if (want.sauces[id] && !L().sauces[id]) go({ type: "spice", id });
    if (step() < 6) go({ type: "skip", step: "spice" });
  }
  if (!L().wrap) go({ type: "wrap", kind: want.bag ? "tui" : want.wrap });
}
/** Chọn nhân cho ổ ba chục ở cấp 1–3: pate bơ + chả lụa… sao cho giá gần target. */
export function bachucPick(target) {
  const opts = [
    { spreads: { pate: 2, bo: 2 }, fills: [] },
    { spreads: { pate: 2, bo: 2 }, fills: ["cha-lua"] },
    { spreads: { pate: 3, bo: 2 }, fills: ["cha-lua"] },
    { spreads: { pate: 3, bo: 2, mayo: 2 }, fills: ["cha-lua", "xiu-mai"] },
    { spreads: { pate: 2, bo: 2 }, fills: ["cha-lua", "xiu-mai"] },
  ];
  const price = (o) => BACHUC.base + BACHUC.surcharge + Object.entries(o.spreads).reduce((a, [id, l]) => a + RETAIL[id] * (l === 3 ? 2 : 1), 0) + o.fills.reduce((a, id) => a + RETAIL[id], 0);
  return opts.reduce((b, o) => (Math.abs(price(o) - target) < Math.abs(price(b) - target) ? o : b));
}
/** Ghim + ráp đúng mọi ổ + giao + thối đúng. */
export function serveRight(s, c, override = {}) {
  act(s, { type: "pin", cid: c.id });
  for (let i = 0; i < c.items.length; i++) {
    const cc = customer(s, c.id);
    if (board(s).item !== i && !cc.filled[i]) act(s, { type: "selectItem", idx: i });
    build(s, cc.items[i], override);
    const r = act(s, { type: "serve" });
    if (s.shift.dialog) return r;
  }
  return payRight(s);
}
export function payRight(s) {
  if (s.shift.paying === null) return null;
  if (s.day <= 3) return act(s, { type: "autoChange" });
  const c = customer(s, s.shift.paying);
  const { makeChange } = awaitMoney;
  const mk = makeChange(s.float, c.pay.change);
  return mk ? act(s, { type: "giveChange", bills: mk }) : act(s, { type: "autoChange" });
}
import * as awaitMoney from "../core/money.js";

/** Bot chơi trọn một ca: nướng khi thiếu bánh, rút đúng lúc, ráp đúng, thối đúng; hội thoại chọn lựa chọn miễn phí đầu tiên. Trả số bước. */
/** Chuẩn bị ca như người chơi: ký gửi nếu cần, nhập đủ, mẻ đầu, mở hàng. */
export function prepAndOpen(s, sec = 28) {
  apply(s, { type: "consign" });
  apply(s, { type: "restockToday" });
  apply(s, { type: "firstBatch", sec });
  return act(s, { type: "startShift" });
}
export function playShift(s, { sloppy = 0, rnd = Math.random, maxSteps = 20000 } = {}) {
  let steps = 0;
  while (s.shift && steps++ < maxSteps) {
    const sh = s.shift;
    if (sh.dialog) {
      const d = sh.dialog;
      if (d.kind === "complaint") act(s, { type: "complaint", choice: rnd() < 0.5 ? "remake" : "discount" });
      else if (d.kind === "stockout") { const o = stockoutOptions(s).filter((x) => x.ok); const pick = o.find((x) => x.id !== "close" && x.price > 0) || o.find((x) => x.free && x.id !== "close") || o[0]; act(s, { type: "stockout", choice: pick.id }); }
      else if (d.kind === "nochange") act(s, { type: "nochange", choice: nochangeOptions(s)[rnd() < 0.5 ? 0 : 2].id });
      continue;
    }
    if (sh.away) { act(s, { type: "tick", dt: 200 }); continue; }
    sh.oven.forEach((b, i) => { if (b && ["golden", "dark", "burnt"].includes(batchLevel(s, b))) act(s, { type: "pull", slot: i }); });
    if (sh.paying !== null) { if (sloppy && rnd() < sloppy) { const c = customer(s, sh.paying); const one = Object.keys(s.float).find((d) => s.float[d] > 0); act(s, { type: "giveChange", bills: one ? { [one]: 1 } : {} }); void c; } else payRight(s); continue; }
    const free = sh.oven.findIndex((x) => !x);
    if (free >= 0 && sh.case.length < 4 && (s.stock.phoi || 0) > 0) { apply(s, { type: "bake", slot: free }); if (s.shift?.dialog) continue; }
    const b = board(s);
    const c = b.cid !== null ? customer(s, b.cid) : sh.customers.find((q) => q.phase === "wait");
    if (c && c.phase === "wait" && !sh.case.length && !b.loaf && !sh.oven.some(Boolean) && !(s.stock.phoi > 0 && s.stock.gas > 0)) {
      if (b.cid !== c.id) act(s, { type: "pin", cid: c.id });
      act(s, { type: "take" }); // tủ trống, không phôi ⇒ hội thoại hết bánh
      continue;
    }
    if (c && c.phase === "wait" && (sh.case.length || b.loaf)) {
      try {
        if (b.cid !== c.id) act(s, { type: "pin", cid: c.id });
        const idx = c.filled.findIndex((f) => !f);
        if (board(s).item !== idx) act(s, { type: "selectItem", idx });
        const it = customer(s, c.id).items[idx];
        if (board(s).loaf?.wrap) { act(s, { type: "serve" }); continue; }
        build(s, it, sloppy && rnd() < sloppy ? { ot: 3, veg: { "do-chua": true, "dua-leo": true, "rau-mui": true, "hanh-la": true } } : {});
        act(s, { type: "serve" });
      } catch (e) { if (!s.shift?.dialog && !/away|paying|dialog/.test(String(e.message))) throw e; }
      continue;
    }
    act(s, { type: "tick", dt: 200 });
  }
  return steps;
}
export { customer, board };
