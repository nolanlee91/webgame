// Tiện ích chung cho test luật Tiệm Trà Sữa.
import { apply } from "../core/apply.js";
import { createState } from "../core/state.js";
import { customer } from "../core/shift.js";
import { currentEvent, affordable } from "../core/drama.js";
import { EVENT } from "../data/events.js";

export const shop = (seed = 7) => createState(seed);
export function act(s, a) { const r = apply(s, a); if (r.err) throw new Error(`${a.type}: ${r.err}`); return r; }
export const err = (s, a) => apply(s, a).err;
export const types = (r) => r.events.map((e) => e.type);
/** Tua thời gian ca theo từng nhịp 200 ms, gom sự kiện. */
export function advance(s, ms) {
  const ev = [];
  for (let left = ms; left > 0 && s.shift && !s.shift.dialog; left -= 200) ev.push(...act(s, { type: "tick", dt: Math.min(200, left) }).events);
  return ev;
}
/** Tua tới khi có khách đứng chờ. */
export function untilWaiting(s, max = 120000) {
  for (let t = 0; t < max && s.shift; t += 200) {
    const c = s.shift.customers.find((q) => q.phase === "wait");
    if (c) return c;
    act(s, { type: "tick", dt: 200 });
  }
  throw new Error("không có khách");
}
export const stepsFor = (o) => [["cup", "ly"], ["base", o.base], ["add", o.add], ["sugar", o.sugar], ["ice", o.ice], ["topping", o.topping], ["lid", "dong-nap"]];
/** Pha đúng phiếu (có thể ghi đè một bước) rồi giao. */
export function brewFor(s, c, override = {}) {
  const o = { ...c.order, ...override };
  if (o.topping === "tran-chau" && s.shift.kitchen.ready < 1) { act(s, { type: "cook", size: 3 }); advance(s, 18200); } // nấu mẻ trân châu trước
  for (const [step, id] of stepsFor(o)) act(s, { type: "brew", step, id });
}
export function serveRight(s, c, override = {}) {
  act(s, { type: "pin", cid: c.id });
  brewFor(s, c, override);
  return act(s, { type: "serve", cid: c.id });
}
/** Giải quyết sự kiện đang chờ (giữa hai ca hoặc trong ca) bằng lựa chọn miễn phí đầu tiên, lặp qua mọi bước. */
export function clearDrama(s) {
  for (let i = 0; i < 10; i++) {
    const d = currentEvent(s);
    if (!d) return;
    const ch = EVENT[d.id].nodes[d.node].choices.find((c) => affordable(s, c));
    act(s, { type: "choose", choice: ch.id });
  }
}
/** Sang ca mới: dọn sự kiện giữa ngày rồi mở quán. */
export function openDay(s) { clearDrama(s); return act(s, { type: "startShift" }); }
export { customer };
