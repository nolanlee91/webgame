// Cửa duy nhất đổi trạng thái: apply(state, action) ⇒ { ok, events, result } | { err, events: [] }.
// Chạy trên bản nháp (structuredClone): lỗi ⇒ trạng thái không đổi. Kiểm bất biến một chỗ trước khi ghi:
// tiền ≥ 0 (số nguyên), kho là số nguyên ≥ 0 và không vượt sức chứa vì hàng mới, danh tiếng 0–100, cấp khớp XP.
// Bấm lặp / tải lại không cộng hai lần: giao chỉ hợp lệ khi khách còn đang chờ, giải quyết chỉ khi còn hội thoại, bước pha phải đúng thứ tự.
import * as shift from "./shift.js?v=m38";
import { restock, stockUsed, capacity } from "./economy.js?v=m38";
import { levelForXp } from "./progression.js?v=m38";
import { buy } from "./equipment.js?v=m38";
import { place, resetPlace } from "./decor.js?v=m38";
import { choose } from "./drama.js?v=m38";
import { reply, setPersona } from "./reviews.js?v=m38";
import { consign, promo } from "./business.js?v=m38";
import { STOCK_IDS } from "../data/ingredients.js?v=m38";
import { restockToday, resolveStockout } from "./stockout.js?v=m38";
import { joinFair, buyTier } from "./fair.js?v=m38";
import { joinChallenge, checkBadges } from "./challenge.js?v=m38";

const HANDLERS = {
  tick: (s, a, ev) => shift.tick(s, a.dt, ev),
  startShift: (s, a, ev) => shift.startShift(s, ev),
  pin: (s, a, ev) => shift.pin(s, a.cid, ev),
  select: (s, a, ev) => shift.select(s, a.station, ev),
  brew: (s, a, ev) => shift.brew(s, a.step, a.id, ev),
  undo: (s, a, ev) => shift.undo(s, ev),
  discard: (s, a, ev) => shift.discard(s, ev),
  serve: (s, a, ev) => shift.serve(s, a.cid, ev),
  resolve: (s, a, ev) => shift.resolve(s, a.choice, ev),
  restock: (s, a, ev) => restock(s, a.id, ev, a.supplier || "di-ba"),
  cook: (s, a, ev) => shift.cook(s, a.size, ev),
  restockToday: (s, a, ev) => restockToday(s, ev),
  stockout: (s, a, ev) => resolveStockout(s, a.choice, ev),
  fair: (s, a, ev) => joinFair(s, ev),
  challenge: (s, a, ev) => joinChallenge(s, a.id, ev),
  tier: (s, a, ev) => { const r = buyTier(s, ev); if (r.ok) checkBadges(s, null, ev); return r; },
  buy: (s, a, ev) => buy(s, a.id, ev),
  place: (s, a, ev) => place(s, a.id, a.x, a.y, ev),
  resetPlace: (s, a, ev) => resetPlace(s, a.id, ev),
  choose: (s, a, ev) => choose(s, a.choice, ev),
  reply: (s, a, ev) => reply(s, a.id, a.kind, ev),
  setPersona: (s, a, ev) => setPersona(s, a.persona, ev),
  consign: (s, a, ev) => consign(s, ev),
  promo: (s, a, ev) => promo(s, a.kind, ev),
  setName: (s, a) => {
    const n = typeof a.name === "string" ? a.name.replace(/\s+/g, " ").trim().slice(0, 32) : "";
    if (!n) return { err: "empty-name" };
    s.shopName = n;
    return { ok: true };
  },
  seeIntro: (s) => { s.introSeen = true; return { ok: true }; },
  closeSummary: (s) => { if (!s.lastSummary) return { err: "none" }; s.lastSummary.seen = true; return { ok: true }; },
};
export const ACTIONS = Object.keys(HANDLERS);

/** Hàng Dì Ba ký gửi để tạm dưới gầm quầy: được vượt sức chứa kho (không bao giờ kẹt vì kho đầy hàng khác). */
const OVER_CAP_OK = new Set(["consign", "stockout", "tick"]); // tick: hàng chạy đi mua / Anh Tèo mang về (core/stockout.js)
export function invariantError(s, before, type = "") {
  if (!Number.isSafeInteger(s.money) || s.money < 0) return "money";
  for (const id of STOCK_IDS) { const q = s.stock[id]; if (!Number.isInteger(q) || q < 0) return "stock"; }
  const u = stockUsed(s);
  if (u > capacity(s) && u > (before ? stockUsed(before) : 0) && !OVER_CAP_OK.has(type)) return "capacity";
  if (!(s.rep >= 0 && s.rep <= 100)) return "rep";
  if (s.shift && (!Number.isInteger(s.shift.kitchen.ready) || s.shift.kitchen.ready < 0)) return "kitchen";
  if (s.shift && !(s.shift.sel >= 0 && s.shift.sel < s.shift.stations.length)) return "station";
  if (s.level !== levelForXp(s.xp)) return "level";
  return null;
}

export function apply(state, action) {
  const type = action && typeof action === "object" ? action.type : undefined;
  if (typeof type !== "string" || !Object.prototype.hasOwnProperty.call(HANDLERS, type)) return { err: "bad-action", events: [] };
  const draft = structuredClone(state);
  const events = [];
  const result = HANDLERS[type](draft, action, events);
  if (!result || result.err) return { err: result?.err || "bad", detail: result, events: [] };
  const bad = invariantError(draft, state, type);
  if (bad) return { err: "invariant-" + bad, events: [] };
  for (const k of Object.keys(state)) delete state[k];
  Object.assign(state, draft);
  return { ok: true, events, result };
}
