// Cửa duy nhất đổi trạng thái: apply(state, action, now) ⇒ { ok: true, events, result } | { err, events: [] }.
// Chạy trên bản nháp (structuredClone): lỗi ⇒ trạng thái không đổi chút nào. Kiểm bất biến ở MỘT chỗ trước khi ghi:
// xu ≥ 0, số món là số nguyên ≥ 0, kho không vượt sức chứa vì hàng mới, giỏ tràn ≤ 10 ⇒ không âm xu, không dùng món không có.
// Mỗi action đều đồng bộ trước theo `now` (Xưởng xây xong, lấp ô đơn, hết hạn đơn đặc biệt, giỏ tràn về kho, lưới an toàn).
// Milestone 2: Xưởng (buildWorkshop, upgradeWorkshop, buildMachine, upgradeMachine, enqueue, collect, collectAll) và Khu chợ
// (marketSell, marketBuy). Bán ở Nhà kho / giỏ tràn dùng cùng giá chợ (core/market.js priceOf).
// Milestone 3: xây dựng (startBuild, startUpgrade — thay cho upgradeWarehouse cũ; buildWorkshop / upgradeWorkshop giữ làm tên
// gọi tắt cho Xưởng), trang trí (placeDecor, removeDecor). Sức chứa kho, ô Nhà kính / phía Đông suy ra từ công trình (core/construct.js).
// Milestone 4: chăn nuôi + làng (core/m4-handlers.js — handler, sync bảng nhiệm vụ làng, track sau quests.track, bất biến đàn).
import { OVERFLOW_MAX } from "../data/warehouse.js?v=m7";
import * as plots from "./plots.js?v=m7";
import * as orders from "./orders.js?v=m7";
import * as eco from "./economy.js?v=m7";
import * as quests from "./quests.js?v=m7";
import * as ws from "./workshop.js?v=m7";
import * as build from "./construct.js?v=m7";
import { settleOverflow, used, capacity, overflowCount, bag, wallet } from "./inventory.js?v=m7";
import { addXp } from "./progression.js?v=m7";
import { effects, isBuilt } from "./build.js?v=m7";
import { bindM4, m4Sync, m4Track, m4InvariantError, m4Ctx } from "./m4-handlers.js?v=m7";
import * as book from "./collection.js?v=m7";
// Milestone 6: Sổ sưu tập (core/collection.js — ghi sổ bằng so kho trước / sau mỗi action, nhận mốc claimBook), Phiên chợ (giá bán
// trong core/fair.js, dùng ở economy.sell / workshop.marketSell), đơn đặc biệt thứ hai (core/orders.js special2).

/** Milestone 4 (chăn nuôi + làng, core/m4-handlers.js): kho / ví / XP tiêm vào; sức chứa chuồng từ công trình (core/build.js effects),
 *  chuồng đang xây lần đầu ⇒ 0 (chưa mua được). Nhiệm vụ tiến trình M4 chỉ mở khi hướng dẫn M1 xong (ctx.tutorialDone). */
export const M4DEPS = Object.freeze({
  bag, wallet, addXp,
  capacity: (s, kind, now) => { const e = effects(s, now); return kind === "ga" ? e.chickenCap || 0 : kind === "bo-sua" ? e.cowCap || 0 : 0; },
  isBuilt: (s, id, now) => isBuilt(s, id, now),
});
/** ctx cho core/animals.js / core/village.js (giao diện dùng chung với luật ⇒ không lệch). */
export const rulesCtx = (s, now) => m4Ctx(s, now, M4DEPS);

function sync(s, now, events) {
  build.sync(s, now, events); // công trình xây xong (kể cả Xưởng) + hiệu ứng: sức chứa kho, ô Nhà kính / phía Đông
  orders.sync(s, now, events);
  const moved = settleOverflow(s);
  if (moved) events.push({ type: "overflowSettled", count: moved });
  eco.safetyNet(s, now, events);
  m4Sync(s, now, events, M4DEPS); // lấp bảng nhiệm vụ làng khi làng mở / lên cấp
}

const HANDLERS = {
  tick: () => ({ ok: true }),
  plant: (s, a, now, ev) => plots.plant(s, a.i, a.crop, now, ev),
  water: (s, a, now, ev) => plots.water(s, a.i, now, ev),
  harvest: (s, a, now, ev) => plots.harvest(s, a.i, now, ev),
  harvestAll: (s, a, now, ev) => plots.harvestAll(s, now, ev),
  buyPlot: (s, a, now, ev) => plots.buyPlot(s, a.i, ev),
  sell: (s, a, now, ev) => eco.sell(s, a.id, a.n, now, ev),
  sellAll: (s, a, now, ev) => eco.sellAll(s, now, ev),
  sellOverflow: (s, a, now, ev) => eco.sellOverflow(s, now, ev),
  deliver: (s, a, now, ev) => orders.deliver(s, a.slot, a.id, a.rev, now, ev),
  cancelOrder: (s, a, now, ev) => orders.cancel(s, a.slot, a.id, a.rev, now, ev),
  upgradeFarm: (s, a, now, ev) => eco.upgradeFarm(s, ev),
  claimQuest: (s, a, now, ev) => quests.claim(s, a.id, ev),
  buildWorkshop: (s, a, now, ev) => ws.buildWorkshop(s, now, ev),
  upgradeWorkshop: (s, a, now, ev) => ws.upgradeWorkshop(s, now, ev),
  buildMachine: (s, a, now, ev) => ws.buildMachine(s, a, now, ev),
  upgradeMachine: (s, a, now, ev) => ws.upgradeMachine(s, a, now, ev),
  enqueue: (s, a, now, ev) => ws.enqueue(s, a, now, ev),
  collect: (s, a, now, ev) => ws.collect(s, a, now, ev),
  collectAll: (s, a, now, ev) => ws.collectAll(s, a, now, ev),
  marketSell: (s, a, now, ev) => ws.marketSell(s, a, now, ev),
  marketBuy: (s, a, now, ev) => ws.marketBuy(s, a, now, ev),
  startBuild: (s, a, now, ev) => build.startBuild(s, a, now, ev),
  startUpgrade: (s, a, now, ev) => build.startUpgrade(s, a, now, ev),
  placeDecor: (s, a, now, ev) => build.placeDecor(s, a, now, ev),
  removeDecor: (s, a, now, ev) => build.removeDecor(s, a, now, ev),
  // Milestone 4: buyAnimal feedAnimal feedAll collectAnimal collectAllAnimals talkNpc claimProgressQuest claimChainStep claimBoardQuest
  ...bindM4(M4DEPS),
  // Milestone 6: nhận thưởng mốc Sổ sưu tập (10 / 20 / 30 món)
  claimBook: (s, a, now, ev) => book.claim(s, a.tier, ev),
};
export const ACTIONS = Object.keys(HANDLERS);

const isCount = (q) => Number.isInteger(q) && q >= 0;
/** Bất biến sau mỗi action. `before` = trạng thái trước (kho cũ v2 có thể vượt sức chứa — chỉ cấm tăng thêm). */
export function invariantError(s, before) {
  if (!Number.isSafeInteger(s.coins) || s.coins < 0) return "coins";
  if (!Number.isInteger(s.freeSeeds) || s.freeSeeds < 0) return "seeds";
  for (const bag of [s.inv, s.overflow, s.decor || {}]) for (const q of Object.values(bag)) if (!isCount(q)) return "count";
  if (overflowCount(s) > OVERFLOW_MAX) return "overflow";
  const u = used(s);
  if (u > capacity(s) && u > (before ? used(before) : 0)) return "capacity";
  const q = ws.queueError(s, before);
  if (q) return q;
  const b = build.invariantError(s);
  if (b) return b;
  const m = m4InvariantError(s);
  if (m) return m;
  for (const q of Object.values(s.collection?.counts || {})) if (!Number.isInteger(q) || q < 1) return "book";
  return null;
}

export function apply(state, action, now) {
  const type = action && typeof action === "object" ? action.type : undefined;
  if (typeof type !== "string" || !Object.prototype.hasOwnProperty.call(HANDLERS, type)) return { err: "bad-action", events: [] };
  if (!Number.isFinite(now)) return { err: "bad-time", events: [] };
  const draft = structuredClone(state);
  const events = [];
  sync(draft, now, events);
  const result = HANDLERS[type](draft, action, now, events);
  if (!result || result.err) return { err: result?.err || "bad", events: [] };
  if (type !== "tick") sync(draft, now, events); // giao đơn / lên cấp có thể mở ô đơn, bán có thể dọn giỏ tràn
  quests.track(draft, events);
  m4Track(draft, events, now, M4DEPS); // MỘT lần mỗi action (cả tick): nhiệm vụ làng + mốc xe giao hàng (lastDeliveryAt)
  book.track(draft, state, type, events); // Sổ sưu tập: món vừa làm ra / nhận (không tính mua ở chợ)
  const bad = invariantError(draft, state);
  if (bad) return { err: "invariant-" + bad, events: [] };
  for (const k of Object.keys(state)) delete state[k];
  Object.assign(state, draft);
  return { ok: true, events, result };
}

/**
 * Đồng bộ theo thời gian có đổi gì không (để giao diện chỉ khoá + ghi khi cần). Giao diện gọi mỗi giây ⇒ chỉ chép trạng thái
 * MỘT lần (bản M4 gọi apply trên bản chép ⇒ chép 2 lần mỗi giây). Cùng thứ tự như apply({ type: "tick" }): sync rồi track.
 */
export function needsSync(state, now) {
  if (!Number.isFinite(now)) return false;
  const draft = structuredClone(state), events = [];
  sync(draft, now, events);
  if (events.length) return true;
  quests.track(draft, events);
  m4Track(draft, events, now, M4DEPS);
  return events.length > 0;
}
