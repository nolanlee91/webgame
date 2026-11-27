// Cửa duy nhất đổi trạng thái: apply(state, action) ⇒ { ok, events, result } | { err, events: [] }.
// Chạy trên bản nháp (structuredClone): lỗi ⇒ trạng thái không đổi. Kiểm bất biến một chỗ trước khi ghi:
// tiền ≥ 0 (số nguyên), quỹ lẻ là tờ nguyên ≥ 0 và không vượt tổng tiền, kho số nguyên ≥ 0 và không vượt sức chứa vì hàng mới,
// tủ kính không vượt sức chứa, danh tiếng 0–100, cấp khớp XP.
// Bấm lặp / tải lại không cộng hai lần: giao chỉ khi ổ đã gói và khách còn chờ; thối tiền chỉ khi đang có khách trả tiền; mỗi bước ráp đúng thứ tự.
import * as shift from "./shift.js?v=b14";
import * as bd from "./board.js?v=b14";
import { loadBatch, pullBatch, firstBatch, caseCap } from "./oven.js?v=b14";
import { restock, restockToday, exchangePack, consign, capacity, stockUsed } from "./stock.js?v=b14";
import { resolveStockout, resolveNochange } from "./rescue.js?v=b14";
import { floatValue } from "./money.js?v=b14";
import { STOCK_IDS, FLOAT_BILLS } from "../data/economy.js?v=b14";
import { autoSpread } from "./board.js?v=b14";
import { setPersona, reply } from "./reviews.js?v=b14";
import { missionsOnPull } from "./missions.js?v=b14";
import * as pg from "./progress.js?v=b14";
import { scenePointsShop } from "./placements.js?v=b14";
import { fry, grillLoad, grillPull } from "./cook.js?v=b14";
import { checkBadges } from "./challenge.js?v=b14";

const HANDLERS = {
  tick: (s, a, ev) => shift.tick(s, a.dt, ev),
  startShift: (s, a, ev) => shift.startShift(s, ev),
  pin: (s, a, ev) => shift.pin(s, a.cid, ev),
  selectItem: (s, a, ev) => shift.selectItem(s, a.idx, ev),
  selectBoard: (s, a, ev) => shift.selectBoard(s, a.idx, ev),
  take: (s, a, ev) => bd.take(s, a.loaf, ev, a.n),
  takeSlice: (s, a, ev) => bd.takeSlice(s, a.loaf, ev, a.n),
  autoSpread: (s, a, ev) => autoSpread(s, ev),
  toast: (s, a, ev) => bd.toast(s, ev, !!a.slice),
  slice: (s, a, ev) => bd.slice(s, ev),
  spread: (s, a, ev) => bd.spread(s, a.id, a.lvl, ev),
  fill: (s, a, ev) => bd.fill(s, a.id, ev),
  skip: (s, a, ev) => bd.skip(s, a.step, ev),
  veg: (s, a, ev) => bd.veg(s, a.id, ev),
  spice: (s, a, ev) => bd.spice(s, a.id, a.lvl, ev),
  wrap: (s, a, ev) => bd.wrap(s, a.kind, ev),
  undo: (s, a, ev) => bd.undo(s, ev),
  discard: (s, a, ev) => bd.discard(s, ev),
  serve: (s, a, ev) => shift.serve(s, ev),
  complaint: (s, a, ev) => shift.resolveComplaint(s, a.choice, ev),
  giveChange: (s, a, ev) => shift.giveChange(s, a.bills, ev),
  autoChange: (s, a, ev) => shift.autoChange(s, ev),
  noChange: (s, a, ev) => shift.noChange(s, ev),
  fry: (s, a, ev) => fry(s, ev),
  grill: (s, a, ev) => grillLoad(s, ev),
  grillPull: (s, a, ev) => grillPull(s, ev),
  bake: (s, a, ev) => loadBatch(s, a.slot ?? 0, ev, a.kind === "que" ? "que" : "banh"),
  pull: (s, a, ev) => { const r = pullBatch(s, a.slot ?? 0, ev); const p = ev.find((e) => e.type === "batchPulled"); if (p) missionsOnPull(s, p.level, ev, shift.gainXp); return r; },
  firstBatch: (s, a, ev) => firstBatch(s, a.sec, ev),
  restock: (s, a, ev) => restock(s, a.id, ev, a.sup || "tu"),
  restockToday: (s, a, ev) => restockToday(s, ev),
  exchange: (s, a, ev) => exchangePack(s, a.pack, ev),
  consign: (s, a, ev) => consign(s, ev),
  stockout: (s, a, ev) => resolveStockout(s, a.choice, ev, shift.endShift),
  nochange: (s, a, ev) => resolveNochange(s, a.choice, ev, shift.settle),
  setName: (s, a) => {
    const n = typeof a.name === "string" ? a.name.replace(/\s+/g, " ").trim().slice(0, 32) : "";
    if (!n) return { err: "empty-name" };
    s.shopName = n;
    return { ok: true };
  },
  seeIntro: (s) => { s.introSeen = true; return { ok: true }; },
  // M4: drama, review, tính cách
  event: (s, a, ev) => shift.chooseEvent(s, a.choice, ev),
  persona: (s, a, ev) => setPersona(s, a.persona, ev),
  reply: (s, a, ev) => reply(s, a.id, a.kind, ev),
  // M3: tiến trình
  buy: (s, a, ev) => pg.buyItem(s, a.id, ev),
  rentShop: (s, a, ev) => pg.rentShop(s, ev),
  buyRank: (s, a, ev) => { const r = pg.buyRank(s, ev); if (r.ok) checkBadges(s, null, ev); return r; },
  buyPate: (s, a, ev) => pg.buyPate(s, ev),
  promo: (s, a, ev) => pg.promo(s, a.kind, ev),
  helper: (s, a, ev) => pg.hireHelper(s, a.on !== false, ev),
  fair: (s, a, ev) => pg.rentFair(s, ev),
  challenge: (s, a, ev) => pg.setChallenge(s, a.on !== false, ev),
  house: (s, a, ev) => pg.setHouse(s, a, ev),
  stale: (s, a, ev) => pg.staleChoice(s, a.choice, ev),
  place: (s, a, ev) => pg.placeDecor(s, a.id, a.x, a.y, scenePointsShop(), ev),
  resetPlace: (s, a, ev) => pg.resetDecor(s, a.id, ev),
  acceptOffer: (s, a, ev) => pg.acceptOffer(s, a.idx, ev),
  closeSummary: (s) => { if (!s.lastSummary) return { err: "none" }; s.lastSummary.seen = true; return { ok: true }; },
};
export const ACTIONS = Object.keys(HANDLERS);

/** Hàng ký gửi / cứu giữa ca được để tạm dưới gầm xe: vượt sức chứa kho được (không bao giờ kẹt vì kho đầy). */
const OVER_CAP_OK = new Set(["consign", "stockout", "tick", "event", "reply", "startShift"]);
export function invariantError(s, before, type = "") {
  if (!Number.isSafeInteger(s.money) || s.money < 0) return "money";
  for (const b of FLOAT_BILLS) { const n = s.float[b] ?? 0; if (!Number.isInteger(n) || n < 0) return "float"; }
  if (floatValue(s.float) > s.money) return "float-money";
  for (const id of STOCK_IDS) { const q = s.stock[id]; if (!Number.isInteger(q) || q < 0) return "stock"; }
  const u = stockUsed(s);
  if (u > capacity(s) && u > (before ? stockUsed(before) : 0) && !OVER_CAP_OK.has(type)) return "capacity";
  if (!(s.rep >= 0 && s.rep <= 100)) return "rep";
  if (s.level !== shift.levelForXp(s.xp)) return "level";
  if (s.shift) {
    const sh = s.shift;
    if (sh.case.length > caseCap(s) + 30) return "case"; // bánh sỉ cứu giữa ca được để tạm ngoài tủ
    if (!(sh.sel >= 0 && sh.sel < sh.boards.length)) return "board";
    if (sh.paying !== null && !sh.customers.some((c) => c.id === sh.paying && c.phase === "pay")) return "paying";
    for (const b of sh.boards) if (b.loaf && b.cid === null) return "board-loaf";
  }
  return null;
}

/** Bản nháp: chép sâu mọi thứ, trừ các danh sách lớn chỉ thêm / bớt phần tử (sổ review, Nhật Ký, lịch sử Drama) — chép nông (phần tử
 *  không bị sửa tại chỗ, trừ khi trả lời review ⇒ "reply" chép sâu hết). Nhịp ca chạy 60 lần / giây nên tiết kiệm đáng kể. */
function cloneFor(state, type) {
  if (type === "reply" || !state.feed) return structuredClone(state);
  const { feed, journal, drama, ...rest } = state;
  const out = structuredClone(rest);
  out.feed = feed.slice();
  out.journal = (journal || []).slice();
  if (drama) { const { history, ...d } = drama; out.drama = { ...structuredClone(d), history: (history || []).slice() }; }
  return out;
}
export function apply(state, action) {
  const type = action && typeof action === "object" ? action.type : undefined;
  if (typeof type !== "string" || !Object.prototype.hasOwnProperty.call(HANDLERS, type)) return { err: "bad-action", events: [] };
  const draft = cloneFor(state, type);
  const events = [];
  let result;
  try { result = HANDLERS[type](draft, action, events); } catch (e) { return { err: "exception", detail: String(e?.stack || e), events: [] }; }
  if (!result || result.err) return { err: result?.err || "bad", detail: result?.detail ?? result, events: [] };
  const bad = invariantError(draft, state, type);
  if (bad) return { err: "invariant-" + bad, events: [] };
  for (const k of Object.keys(state)) delete state[k];
  Object.assign(state, draft);
  return { ok: true, events, result };
}
