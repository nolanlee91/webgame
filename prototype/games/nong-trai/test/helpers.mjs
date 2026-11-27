// Tiện ích chung cho test luật Nông Trại.
import { apply } from "../core/apply.js?v=m15";
import { createState } from "../core/state.js?v=m15";
export const START = 1_000_000;
export const CENTER = 12;
export function farm(seed = 7, now = START) { return createState(now, seed); }
/** Chạy action, ném lỗi nếu thất bại (trừ khi expectErr). */
export function act(s, action, now = START) {
  const r = apply(s, action, now);
  if (r.err) throw new Error(`${action.type}: ${r.err}`);
  return r;
}
export const err = (s, action, now = START) => apply(s, action, now).err;
export const types = (r) => r.events.map((e) => e.type);
