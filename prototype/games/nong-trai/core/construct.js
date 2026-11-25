// Milestone 3 — ghép luật xây dựng thuần (core/build.js, data/buildings.js) vào trạng thái nông trại. Chỉ gọi qua apply().
// - Công trình: startBuild / startUpgrade (một cửa cho Nhà kho, Nhà kính, Khu đất phía Đông, Sạp chợ, Xưởng).
//   Công trình có milestone > CURRENT_MILESTONE bị từ chối với mã "milestone" (từ Milestone 4 = 4: chuồng gà / chuồng bò xây được; chưa có công trình M5).
// - Trang trí: placeDecor / removeDecor (túi s.decor ⇄ ô DECOR_SLOTS trên bản đồ).
// - sync: build.tick (công trình xây xong khi offline cũng báo đúng một lần) + applyEffects.
// - applyEffects: mọi thứ suy ra từ công trình — s.warehouse = mốc kho (inventory.capacity đọc nó), mở ô Nhà kính / phía Đông.
import * as B from "./build.js?v=m11";
import { BUILDING, DECOR_ITEM, maxLevel } from "../data/buildings.js?v=m11";
import { LEVELS, CURRENT_MILESTONE } from "../data/levels.js?v=m11";
import { WAREHOUSE } from "../data/warehouse.js?v=m11";
import { MACHINES_NOW } from "./workshop.js?v=m11";
import { grantMachine } from "./production.js?v=m11";
import { bag, wallet } from "./inventory.js?v=m11";
import { EAST_FIRST, EAST_COUNT, GH_FIRST, GH_COUNT, blankPlot } from "./plots.js?v=m11";

const MILESTONE_OF_FEATURE = Object.fromEntries(LEVELS.flatMap((l) => l.unlocks).filter((u) => u.kind === "feature").map((u) => [u.id, u.milestone]));
/** Bản (milestone) đưa công trình vào game: theo tính năng của mốc xây đầu tiên trong data/levels.js. */
export function milestoneOf(id) {
  const f = BUILDING[id]?.levels[0]?.feature;
  return f && MILESTONE_OF_FEATURE[f] !== undefined ? MILESTONE_OF_FEATURE[f] : 1;
}
/** Công trình đã có trong bản hiện tại (milestone ≤ CURRENT_MILESTONE; chuồng gà / bò mở từ Milestone 4). */
export const inMilestone = (id) => !!BUILDING[id] && milestoneOf(id) <= CURRENT_MILESTONE;
const nameOf = (id) => BUILDING[id]?.name || id;

/** Áp hiệu ứng công trình lên trạng thái: mốc kho, ô Nhà kính / phía Đông mở (chỉ mở thêm, không bao giờ đóng ô đang trồng). */
export function applyEffects(s, now) {
  const e = B.effects(s, now);
  s.warehouse = Math.min(Math.max(0, e.warehouseTier | 0), WAREHOUSE.length - 1);
  for (let k = 0; k < EAST_COUNT; k++) ensurePlot(s, EAST_FIRST + k, e.eastOpen && k < e.eastPlots);
  for (let k = 0; k < GH_COUNT; k++) ensurePlot(s, GH_FIRST + k, k < e.greenhousePlots);
  return e;
}
function ensurePlot(s, i, open) {
  if (!s.plots[i]) s.plots[i] = blankPlot(i, false);
  if (open && !s.plots[i].open) s.plots[i].open = true;
}

/** Đồng bộ theo thời gian: công trình xây / nâng xong ⇒ sự kiện buildingDone (một lần), rồi áp hiệu ứng. */
export function sync(s, now, events) {
  for (const f of B.tick(s, now)) events.push({ type: "buildingDone", ...f, name: nameOf(f.id) });
  applyEffects(s, now);
}

const okId = (id) => typeof id === "string" && Object.prototype.hasOwnProperty.call(BUILDING, id);

/** Xây công trình ở lô của nó. Xưởng: tặng kèm Bếp sên (dùng được cùng lúc Xưởng xong) như Milestone 2. */
export function startBuild(s, a, now, events) {
  if (!okId(a.id)) return { err: "bad" };
  if (!inMilestone(a.id)) return { err: "milestone" };
  const r = B.startBuild(s, wallet(s), bag(s), a.id, now, { level: s.level });
  if (r.err) return r;
  if (a.id === "xuong") for (const m of MACHINES_NOW.filter((m) => m.withWorkshop)) grantMachine(s.production, m.id, r.readyAt);
  events.push({ type: "buildStarted", id: a.id, name: nameOf(a.id), cost: r.cost, materials: r.materials, readyAt: r.readyAt, instant: r.instant });
  if (r.instant) events.push({ type: "buildingDone", id: a.id, level: 1, at: now, name: nameOf(a.id) });
  applyEffects(s, now);
  return r;
}

/** Nâng công trình 1 level. Nhà kho: sức chứa đổi ngay (mọi mốc kho tức thì). */
export function startUpgrade(s, a, now, events) {
  if (!okId(a.id)) return { err: "bad" };
  if (!inMilestone(a.id)) return { err: "milestone" };
  const capBefore = WAREHOUSE[s.warehouse]?.cap;
  const r = B.startUpgrade(s, wallet(s), bag(s), a.id, now, { level: s.level });
  if (r.err) return r;
  events.push({ type: "upgradeStarted", id: a.id, name: nameOf(a.id), level: r.level, cost: r.cost, materials: r.materials, readyAt: r.readyAt, instant: r.instant });
  applyEffects(s, now);
  if (r.instant) {
    events.push({ type: "buildingDone", id: a.id, level: r.level, at: now, name: nameOf(a.id), upgraded: true });
    if (a.id === "nha-kho") events.push({ type: "warehouseUpgraded", level: r.level, cap: WAREHOUSE[s.warehouse].cap, from: capBefore, cost: r.cost });
  }
  return r;
}

export function placeDecor(s, a, now, events) {
  if (typeof a.id !== "string" || typeof a.slot !== "string") return { err: "bad" };
  const r = B.placeDecor(s, a.id, a.slot, now, { level: s.level });
  if (r.err) return r;
  events.push({ type: "decorPlaced", id: a.id, slot: a.slot, name: DECOR_ITEM[a.id].name });
  return r;
}
export function removeDecor(s, a, now, events) {
  if (typeof a.slot !== "string") return { err: "bad" };
  const r = B.removeDecor(s, a.slot);
  if (r.err) return r;
  events.push({ type: "decorRemoved", id: r.id, slot: a.slot, name: DECOR_ITEM[r.id]?.name || r.id });
  return r;
}

/** Bất biến xây dựng (kiểm trong apply): level trong khoảng, mỗi ô trang trí tối đa một món, đồ đặt có thật. */
export function invariantError(s) {
  for (const [id, r] of Object.entries(s.buildings || {})) {
    if (!BUILDING[id] || !Number.isInteger(r.level) || r.level < 0 || r.level > maxLevel(id)) return "building";
    if (r.level === 0 && r.done) return "building";
  }
  const slots = new Set();
  for (const d of s.decorPlaced || []) {
    if (!DECOR_ITEM[d.id] || slots.has(d.slot)) return "decor";
    slots.add(d.slot);
  }
  return null;
}
