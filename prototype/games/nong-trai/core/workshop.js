// Xưởng chế biến trong apply(): công trình Xưởng trên bản đồ (xây có giàn giáo + đồng hồ, chạy cả khi tắt trang),
// và ghép luật thuần core/production.js + core/market.js vào trạng thái nông trại (kho, ví, cấp, XP). Chỉ gọi qua apply().
//
// Công trình dùng MỘT mô hình với Milestone 3 — core/build.js (data/buildings.js id "xuong", số liệu khớp data/workshop.js):
//   s.buildings.xuong = { level (level ĐÃ XONG; 0 khi đang xây lần đầu), done, startAt, readyAt }
// s.production = { machines: { [id]: { level, slots, readyAt, queue: [{ uid, recipe, startAt, endAt }], nextUid } } }
import { WORKSHOP } from "../data/workshop.js?v=m15";
import { MACHINE, MACHINES } from "../data/machines.js?v=m15";
import { CURRENT_MILESTONE } from "../data/levels.js?v=m15";
import { ITEM } from "../data/catalog.js?v=m15";
import * as P from "./production.js?v=m15";
import * as B from "./build.js?v=m15";
import { MARKET, MAX_LOT } from "./market.js?v=m15";
import * as fair from "./fair.js?v=m15";
import { bag, wallet } from "./inventory.js?v=m15";
import { addXp } from "./progression.js?v=m15";

const ID = WORKSHOP.id; // "xuong"
export const workshopOf = (s) => s.buildings?.[ID] || null;
/** Level Xưởng dùng được lúc now (0 = chưa có / đang xây lần đầu). */
export const workshopLevel = (s, now) => B.levelOf(s, ID, now);
/** "locked" (chưa đủ cấp) | "available" (có thể xây) | "building" (giàn giáo lần đầu) | "done" (dùng được, kể cả đang nâng). */
export function workshopState(s, now) {
  if (workshopLevel(s, now) >= 1) return "done";
  if (workshopOf(s)) return "building";
  return s.level >= WORKSHOP.unlock ? "available" : "locked";
}
/** Máy có trong bản hiện tại (Xưởng chỉ hiện / cho xây những máy này). */
export const MACHINES_NOW = MACHINES.filter((m) => m.milestone <= CURRENT_MILESTONE);
/** Ô hàng chờ cộng thêm cho mọi máy (Xưởng cấp 2 ⇒ +1). now bỏ trống ⇒ theo level đã ghi. */
export const extraSlots = (s, now = Infinity) => B.effects(s, now).extraQueueSlots || 0;
/** ctx cho core/production.js + core/market.js (công trình đang nâng vẫn dùng được). */
export function ctxOf(s, now) {
  return { level: s.level, buildings: B.builtIds(s, now, s.level), extraSlots: extraSlots(s, now) };
}
/** Mốc nâng Xưởng kế tiếp { level (cấp người chơi cần), cost, toLevel } hoặc null. */
export function nextWorkshopUpgrade(s, now = Infinity) {
  if (workshopLevel(s, now) < 1) return null;
  const st = B.nextStep(s, ID, now);
  return st ? { level: st.unlock ?? WORKSHOP.unlock, cost: st.cost, toLevel: st.level, materials: st.materials } : null;
}

// Đồng bộ công trình (Xưởng xây xong khi offline): core/construct.js sync (build.tick) — gọi trong apply().

/** Xây Xưởng = build.startBuild("xuong") + tặng Bếp sên (dùng được cùng lúc Xưởng xong). */
export function buildWorkshop(s, now, events) {
  if (workshopOf(s)) return { err: "built" };
  if (s.level < WORKSHOP.unlock) return { err: "workshop-level" };
  const r = B.startBuild(s, wallet(s), bag(s), ID, now, { level: s.level });
  if (r.err) return r;
  for (const m of MACHINES_NOW.filter((m) => m.withWorkshop)) P.grantMachine(s.production, m.id, r.readyAt);
  events.push({ type: "buildStarted", id: ID, name: WORKSHOP.name, cost: r.cost, readyAt: r.readyAt });
  if (r.instant) events.push({ type: "buildingDone", id: ID, level: 1, at: now, name: WORKSHOP.name });
  return { ok: true, readyAt: r.readyAt };
}

/** Nâng Xưởng = build.startUpgrade("xuong"). Cấp 2 (cấp 13): tức thì, +1 ô hàng chờ mọi máy. */
export function upgradeWorkshop(s, now, events) {
  if (workshopState(s, now) !== "done") return { err: "no-workshop" };
  const r = B.startUpgrade(s, wallet(s), bag(s), ID, now, { level: s.level });
  if (r.err) return { err: r.err === "locked" ? "workshop-level" : r.err };
  if (r.instant) events.push({ type: "workshopUpgraded", level: r.level, cost: r.cost, extraSlots: extraSlots(s, now) });
  else events.push({ type: "upgradeStarted", id: ID, level: r.level, cost: r.cost, readyAt: r.readyAt });
  return { ok: true, level: r.level };
}

const needWorkshop = (s, now) => (workshopState(s, now) === "done" ? null : { err: "no-workshop" });

export function buildMachine(s, a, now, events) {
  const def = MACHINE[a.machine];
  if (!def || typeof a.machine !== "string") return { err: "bad" };
  if (def.milestone > CURRENT_MILESTONE) return { err: "locked" };
  if (def.withWorkshop) return { err: "built" }; // đi kèm Xưởng
  const w = needWorkshop(s, now); if (w) return w;
  const r = P.buildMachine(s.production, wallet(s), a.machine, now, ctxOf(s, now));
  if (r.err) return r;
  events.push({ type: "machineBuildStarted", machine: a.machine, cost: r.cost, readyAt: r.readyAt });
  return r;
}
export function upgradeMachine(s, a, now, events) {
  if (!MACHINE[a.machine]) return { err: "bad" };
  const r = P.upgradeMachine(s.production, wallet(s), a.machine, now, ctxOf(s, now));
  if (r.err) return r;
  events.push({ type: "machineUpgraded", machine: a.machine, level: r.level, slots: r.slots, cost: r.cost });
  return r;
}
export function enqueue(s, a, now, events) {
  if (!MACHINE[a.machine]) return { err: "bad" };
  const r = P.enqueue(s.production, bag(s), a.machine, a.recipe, now, ctxOf(s, now));
  if (r.err) return r;
  events.push({ type: "jobQueued", machine: a.machine, recipe: a.recipe, uid: r.job.uid, startAt: r.job.startAt, endAt: r.job.endAt, inputs: r.inputs });
  return r;
}
export function collect(s, a, now, events) {
  if (!MACHINE[a.machine] || !Number.isInteger(a.uid)) return { err: "bad" };
  const r = P.collect(s.production, bag(s), a.machine, a.uid, now);
  if (r.err) return r;
  events.push({ type: "jobCollected", machine: a.machine, uid: a.uid, item: r.item, qty: r.qty, xp: r.xp, overflow: r.overflow });
  addXp(s, r.xp, events);
  return r;
}
export function collectAll(s, a, now, events) {
  if (a.machine !== undefined && !MACHINE[a.machine]) return { err: "bad" };
  const r = P.collectAll(s.production, bag(s), now, a.machine);
  if (r.err) return r;
  for (const c of r.collected) events.push({ type: "jobCollected", machine: c.machine, uid: c.uid, item: c.item, qty: c.qty, overflow: c.overflow, xp: 0 });
  events.push({ type: "jobsCollected", count: r.collected.length, xp: r.xp, full: r.full });
  addXp(s, r.xp, events);
  return r;
}

/** Bán ở Khu chợ: kiểm như MARKET.sell (món bán được, số lượng 1..999, đủ hàng), tiền theo giá chợ hoặc Phiên chợ (core/fair.js). */
export function marketSell(s, a, now, events) {
  if (!MARKET.sellable(a.id) || !Number.isFinite(now)) return { err: "bad" };
  if (!Number.isInteger(a.n) || a.n <= 0 || a.n > MAX_LOT) return { err: "bad-count" };
  const inv = bag(s);
  if (!inv.has(a.id, a.n)) return { err: "empty-stock" };
  const q = fair.quote(s, a.id, a.n, now);
  if (!inv.take(a.id, a.n)) return { err: "empty-stock" };
  fair.commitSale(s, a.id, q);
  wallet(s).earn(q.coins);
  const trend = q.fair ? "·" : MARKET.trend(a.id, now);
  events.push({ type: "sold", count: a.n, coins: q.coins, items: { [a.id]: a.n }, price: q.price, market: true, trend, fair: q.fair, hot: q.hotUnits,
    productUp: !q.fair && trend === "↑" && ITEM[a.id]?.cat === "thanh-pham" });
  return { ok: true, id: a.id, count: a.n, price: q.price, coins: q.coins };
}
export function marketBuy(s, a, now, events) {
  const r = MARKET.buy(bag(s), wallet(s), a.id, a.n, now, ctxOf(s, now));
  if (r.err) return r;
  events.push({ type: "bought", id: a.id, count: r.count, coins: r.coins, price: r.price, overflow: r.overflow });
  return r;
}

/** Số ô đã xong, chưa nhận (mọi máy). */
export const finishedJobs = (s, now) => Object.values(s.production.machines).reduce((n, m) => n + m.queue.filter((j) => now >= j.endAt).length, 0);
/** Ô xong trong lúc vắng (sau lần cuối nhìn thấy). */
export const finishedWhileAway = (s, now) => Object.values(s.production.machines).reduce((n, m) => n + m.queue.filter((j) => j.endAt > s.lastSeen && j.endAt <= now).length, 0);
/** Kiểm hàng chờ không vượt sức chứa (bất biến chung của apply). */
export function queueError(s, before) {
  for (const [id, m] of Object.entries(s.production?.machines || {})) {
    const cap = P.capacity(m, { extraSlots: extraSlots(s) });
    const had = before?.production?.machines?.[id]?.queue.length ?? 0;
    if (m.queue.length > cap && m.queue.length > had) return "queue";
    if (!Number.isInteger(m.nextUid) || m.queue.some((j) => !Number.isInteger(j.uid) || j.uid >= m.nextUid)) return "uid";
  }
  return null;
}
