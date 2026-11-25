// Xây dựng & nâng cấp công trình + trang trí (DESIGN-2.0 §1 khu 8, §3). Luật thuần: không DOM, không biến toàn cục,
// mọi hàm nhận `now` (ms). Dữ liệu ở data/buildings.js.
//
// TRẠNG THÁI (lưu trong save; `b` có thể là chính gốc save `s` — 3 field ở cấp trên cùng):
//   b = {
//     buildings: {
//       [id]: {
//         level: 0..max,           // level ĐÃ XONG (0 = đang xây lần đầu, chưa dùng được) — core/animals.js đọc `.level`
//         done: bool,              // false ⇒ đang xây / nâng: tới readyAt thì level + 1. Nhiệm vụ { building } đọc `.done`
//         startAt: ms, readyAt: ms // lần xây / nâng gần nhất (tức thì ⇒ startAt = readyAt)
//       }
//     },
//     decor: { [id]: n },          // TÚI trang trí (= s.decor của M2: chợ bán đồ trang trí vào đây), không tính sức chứa kho
//     decorPlaced: [{ id, slot }], // đồ đang đặt trên bản đồ (mỗi ô tối đa 1 món). Đặt ⇒ túi −1; cất ⇒ túi +1
//   }
// Bản ghi Xưởng của M2 ({ level, readyAt, done }, level = level ĐANG xây, không có startAt) được sanitize() đổi sang dạng này.
// Công trình "prebuilt" (nhà, sạp chợ, bảng đơn) coi như level 1 khi không có bản ghi; "auto" (biển Làng, xe giao hàng)
// xuất hiện khi đủ cấp, không lưu; "machine" (Cối xay gió) theo máy của core/production.js — build.js không xây loại đó.
//
// THỜI GIAN chỉ suy ra từ timestamp ⇒ đúng khi offline bao lâu cũng được. Các hàm đọc (status, effects, builtIds)
// tự coi bản ghi chưa done có readyAt ≤ now là đã xong; tick(b, now) ghi hẳn vào trạng thái và trả danh sách vừa xong.
// Trong lúc NÂNG CẤP công trình vẫn dùng được ở level cũ (effects dùng level cũ tới khi xong).
//
// GIAO DIỆN TIÊM VÀO (giống core/README-M2.md):
//   wallet = { coins() -> number, spend(n) -> bool, earn(n) }
//   inv    = { count(id), has(id, n), take(id, n) -> bool, add(id, n) -> { ok, overflow } }   (vật liệu: van-go, hop-dinh, thung-son)
//   ctx    = { level }   (cấp người chơi)
// Hàm đổi trạng thái trả { ok: true, ... } hoặc { err: "<mã>" }; khi err thì KHÔNG đổi gì (b, wallet, inv).

import { BUILDING, BUILDINGS, BUILDABLE_KINDS, DECOR_ITEM, DECOR_SLOT, DECOR_BAG_MAX, maxLevel } from "../data/buildings.js?v=m12";
import { WAREHOUSE } from "../data/warehouse.js?v=m12";

export const ERR = Object.freeze({
  BAD: "bad", LOCKED: "locked", BUILT: "built", NOT_BUILT: "not-built", BUILDING: "building", MAX: "max",
  COINS: "coins", MATERIALS: "materials", NOT_BUILDABLE: "not-buildable",
  SLOT: "slot", SLOT_TAKEN: "slot-taken", SLOT_EMPTY: "slot-empty", SLOT_SIZE: "slot-size", NO_DECOR: "no-decor", BAG_FULL: "bag-full",
});

export function createBuild() { return { buildings: {}, decor: {}, decorPlaced: [] }; }

const isTime = (t) => Number.isFinite(t);
const lvOf = (ctx) => (Number.isFinite(ctx?.level) ? ctx.level : 0);
const rec = (b, id) => (b?.buildings && Object.prototype.hasOwnProperty.call(b.buildings, id) ? b.buildings[id] : null);

/** Level đã xong ở thời điểm now (tính cả bản ghi đang xây đã quá readyAt). Prebuilt không bản ghi ⇒ 1. */
export function levelOf(b, id, now) {
  const def = BUILDING[id];
  if (!def) return 0;
  const r = rec(b, id);
  if (!r) return def.kind === "prebuilt" ? 1 : 0;
  const finished = !r.done && isTime(now) && now >= r.readyAt;
  return Math.min(r.level + (finished ? 1 : 0), maxLevel(id));
}
/** Đang xây / nâng ở thời điểm now. */
export const isBusy = (b, id, now) => { const r = rec(b, id); return !!r && !r.done && !(isTime(now) && now >= r.readyAt); };
/** Đã xây xong (level ≥ 1) — dùng được. */
export const isBuilt = (b, id, now) => levelOf(b, id, now) >= 1;

/** Mốc kế tiếp (xây nếu level 0, nâng nếu ≥ 1); null ⇒ tối đa / không xây được bằng build.js. */
export function nextStep(b, id, now) {
  const def = BUILDING[id];
  if (!def || !BUILDABLE_KINDS.includes(def.kind)) return null;
  const lv = levelOf(b, id, now), step = def.levels[lv];
  return step ? { level: lv + 1, ...step } : null;
}

/**
 * Trạng thái hiển thị (§3): "locked" | "available" | "building" | "done" | "upgradeable".
 * machine: truyền ctx.production (save.production của M2) để biết máy đã xây chưa.
 */
export function buildingStatus(b, id, now, level, ctx = {}) {
  const def = BUILDING[id];
  if (!def) return "locked";
  const first = def.levels[0];
  if (def.kind === "auto") return level >= first.unlock ? "done" : "locked";
  if (def.kind === "machine") {
    const m = ctx.production?.machines?.[def.machine];
    if (!m) return level >= first.unlock ? "available" : "locked";
    return isTime(now) && now >= m.readyAt ? "done" : "building";
  }
  if (isBusy(b, id, now)) return "building";
  const lv = levelOf(b, id, now);
  if (lv === 0) return level >= first.unlock ? "available" : "locked";
  const next = def.levels[lv];
  return next && level >= next.unlock ? "upgradeable" : "done";
}

/** Đủ xu + vật liệu cho một mốc { cost, materials } không. Trả null hoặc mã lỗi. */
export function affordError(step, wallet, inv) {
  if (!(wallet.coins() >= step.cost)) return ERR.COINS;
  for (const [mid, q] of Object.entries(step.materials || {})) if (!inv || !inv.has(mid, q)) return ERR.MATERIALS;
  return null;
}
export const canAfford = (step, wallet, inv) => !!step && affordError(step, wallet, inv) === null;

/** Trừ vật liệu rồi xu; lỗi giữa chừng ⇒ hoàn lại hết. Trả mã lỗi hoặc null. */
function pay(step, wallet, inv) {
  const e = affordError(step, wallet, inv);
  if (e) return e;
  const taken = [];
  for (const [mid, q] of Object.entries(step.materials)) {
    if (!inv.take(mid, q)) { for (const [tid, tq] of taken) inv.add(tid, tq); return ERR.MATERIALS; }
    taken.push([mid, q]);
  }
  if (step.cost > 0 && !wallet.spend(step.cost)) { for (const [tid, tq] of taken) inv.add(tid, tq); return ERR.COINS; }
  return null;
}

/** Lý do không xây được (null ⇒ được, chưa kiểm xu / vật liệu). */
export function canStartBuild(b, id, now, ctx) {
  const def = BUILDING[id];
  if (!def || !isTime(now)) return ERR.BAD;
  if (def.kind !== "build" && def.kind !== "expansion") return ERR.NOT_BUILDABLE;
  if (rec(b, id)) return isBusy(b, id, now) ? ERR.BUILDING : ERR.BUILT;
  if (lvOf(ctx) < def.levels[0].unlock) return ERR.LOCKED;
  return null;
}

/** Xây công trình ở lô của nó. ms = 0 ⇒ xong ngay (level 1, done). */
export function startBuild(b, wallet, inv, id, now, ctx) {
  const e = canStartBuild(b, id, now, ctx);
  if (e) return { err: e };
  const step = BUILDING[id].levels[0];
  const pe = pay(step, wallet, inv);
  if (pe) return { err: pe };
  const instant = step.ms <= 0;
  b.buildings[id] = instant ? { level: 1, done: true, startAt: now, readyAt: now } : { level: 0, done: false, startAt: now, readyAt: now + step.ms };
  return { ok: true, id, level: 1, instant, readyAt: b.buildings[id].readyAt, cost: step.cost, materials: { ...step.materials } };
}

/** Lý do không nâng được (null ⇒ được, chưa kiểm xu / vật liệu). */
export function canStartUpgrade(b, id, now, ctx) {
  const def = BUILDING[id];
  if (!def || !isTime(now)) return ERR.BAD;
  if (!BUILDABLE_KINDS.includes(def.kind)) return ERR.NOT_BUILDABLE;
  if (isBusy(b, id, now)) return ERR.BUILDING;
  const lv = levelOf(b, id, now);
  if (lv < 1) return ERR.NOT_BUILT;
  const next = def.levels[lv];
  if (!next) return ERR.MAX;
  if (lvOf(ctx) < next.unlock) return ERR.LOCKED;
  return null;
}

/** Nâng 1 level. ms = 0 ⇒ xong ngay. Trong lúc nâng công trình vẫn dùng ở level cũ. */
export function startUpgrade(b, wallet, inv, id, now, ctx) {
  const e = canStartUpgrade(b, id, now, ctx);
  if (e) return { err: e };
  const lv = levelOf(b, id, now);
  const step = BUILDING[id].levels[lv];
  const pe = pay(step, wallet, inv);
  if (pe) return { err: pe };
  const instant = step.ms <= 0;
  b.buildings[id] = instant ? { level: lv + 1, done: true, startAt: now, readyAt: now } : { level: lv, done: false, startAt: now, readyAt: now + step.ms };
  return { ok: true, id, level: lv + 1, instant, readyAt: b.buildings[id].readyAt, cost: step.cost, materials: { ...step.materials } };
}

/** Ghi xong 1 công trình nếu đã tới readyAt. Trả { id, level, at } hoặc null. */
export function finishIfReady(b, id, now) {
  const r = rec(b, id);
  if (!r || r.done || !isTime(now) || now < r.readyAt) return null;
  r.level = Math.min(r.level + 1, maxLevel(id));
  r.done = true;
  return { id, level: r.level, at: r.readyAt };
}

/** Ghi xong mọi công trình đã tới readyAt (gọi trong sync của apply). Trả danh sách vừa xong (cho event / "Trong lúc bạn vắng"). */
export function tick(b, now) {
  const out = [];
  for (const id of Object.keys(b.buildings || {})) { const f = finishIfReady(b, id, now); if (f) out.push(f); }
  return out;
}

/** Id công trình đang dùng được (level ≥ 1) — cho ctx.buildings của core/production.js. level ⇒ gồm cả "auto". */
export function builtIds(b, now, level) {
  return BUILDINGS.filter((d) => d.kind === "auto" ? Number.isFinite(level) && level >= d.levels[0].unlock
    : d.kind !== "machine" && levelOf(b, d.id, now) >= 1).map((d) => d.id);
}

/**
 * Giá trị suy ra từ công trình (đọc ở đây thay vì s.warehouse / s.buildings.xuong.level / hằng số):
 *   warehouseTier (index vào data/warehouse.js), warehouseCap, extraQueueSlots (ctx.extraSlots của production),
 *   workshopLevel, chickenCap, cowCap (0 = chưa có chuồng), greenhousePlots, greenhouseNoWater, eastOpen, eastPlots, eastLots,
 *   marketFull, fameLevel (bậc Nhà = "Nông trại danh tiếng", Milestone 5), orderBonus (xu cộng thêm khi giao đơn), levels: { [id]: level }.
 */
export function effects(b, now) {
  const e = { warehouseTier: 0, warehouseCap: 0, workshopLevel: 0, extraQueueSlots: 0, chickenCap: 0, cowCap: 0,
    greenhousePlots: 0, greenhouseNoWater: false, eastOpen: false, eastPlots: 0, eastLots: 0, marketFull: false, fameLevel: 1, orderBonus: 0, levels: {} };
  for (const def of BUILDINGS) {
    if (!BUILDABLE_KINDS.includes(def.kind)) continue;
    const lv = levelOf(b, def.id, now);
    e.levels[def.id] = lv;
    for (let i = 0; i < lv; i++) Object.assign(e, def.levels[i].effect);
  }
  e.warehouseTier = Math.min(Math.max(0, e.warehouseTier | 0), WAREHOUSE.length - 1);
  e.warehouseCap = WAREHOUSE[e.warehouseTier].cap;
  return e;
}

// ---------------- Trang trí ----------------

/** Thêm đồ trang trí vào túi (mua ở chợ, thưởng đơn đặc biệt). */
export function addDecor(b, id, n = 1) {
  if (!DECOR_ITEM[id] || !Number.isInteger(n) || n <= 0) return { err: ERR.BAD };
  const have = b.decor[id] || 0;
  if (have + n > DECOR_BAG_MAX) return { err: ERR.BAG_FULL };
  b.decor[id] = have + n;
  return { ok: true, id, count: b.decor[id] };
}

/** Ô trang trí dùng được không (đủ cấp; ô phía Đông cần đã mở đất). */
export function slotOpen(b, slotId, now, level) {
  const s = DECOR_SLOT[slotId];
  if (!s || !(level >= s.unlock)) return false;
  return s.area !== "east" || effects(b, now).eastOpen;
}

/** Đặt 1 món từ túi vào ô trống. ctx = { level }. */
export function placeDecor(b, id, slotId, now, ctx) {
  const d = DECOR_ITEM[id], s = DECOR_SLOT[slotId];
  if (!d || !s || !isTime(now)) return { err: ERR.BAD };
  if (lvOf(ctx) < d.unlock) return { err: ERR.LOCKED };
  if (!slotOpen(b, slotId, now, lvOf(ctx))) return { err: ERR.SLOT };
  if (d.size === "l" && s.size !== "l") return { err: ERR.SLOT_SIZE };
  if (b.decorPlaced.some((x) => x.slot === slotId)) return { err: ERR.SLOT_TAKEN };
  if (!((b.decor[id] || 0) >= 1)) return { err: ERR.NO_DECOR };
  b.decor[id] -= 1;
  if (!b.decor[id]) delete b.decor[id];
  b.decorPlaced.push({ id, slot: slotId });
  return { ok: true, id, slot: slotId };
}

/** Cất món ở ô về túi (luôn được — món vốn của người chơi). */
export function removeDecor(b, slotId) {
  const i = b.decorPlaced.findIndex((x) => x.slot === slotId);
  if (i < 0) return { err: ERR.SLOT_EMPTY };
  const { id } = b.decorPlaced[i];
  b.decorPlaced.splice(i, 1);
  b.decor[id] = (b.decor[id] || 0) + 1;
  return { ok: true, id, slot: slotId };
}

// ---------------- Đọc save ----------------

/**
 * Kẹp / sửa dữ liệu xây dựng đọc từ save (dữ liệu lạ, đồng hồ lùi …). Trả bản sạch { buildings, decor, decorPlaced }.
 * - Bỏ id lạ / loại không lưu (auto, machine); level kẹp 0..max; level 0 chỉ hợp lệ khi đang xây.
 * - Bản ghi M2 (Xưởng: { level, readyAt, done }, không có startAt): level là level ĐANG xây ⇒ chưa done thì level − 1.
 * - Đang xây ở level tối đa ⇒ done. readyAt kẹp ≤ now + thời gian của mốc; startAt = readyAt − thời gian mốc.
 * - Không ghi xong công trình ở đây (để tick() sau đó còn báo "vừa xong" cho màn chào quay lại).
 * - Trang trí: túi là số nguyên 1..DECOR_BAG_MAX; id / ô lạ bị bỏ, mỗi ô 1 món, đồ cỡ "l" chỉ ở ô "l".
 */
export function sanitize(raw, now) {
  const out = createBuild();
  if (!raw || typeof raw !== "object") return out;
  const src = raw.buildings && typeof raw.buildings === "object" ? raw.buildings : {};
  for (const [id, r] of Object.entries(src)) {
    const def = BUILDING[id];
    if (!def || !BUILDABLE_KINDS.includes(def.kind) || !r || typeof r !== "object") continue;
    const max = def.levels.length;
    let level = Number.isInteger(r.level) ? Math.min(Math.max(r.level, 0), max) : 0;
    let done = r.done !== false;
    if (!done && !("startAt" in r) && level >= 1) level -= 1; // bản ghi kiểu M2: level = level đang xây
    if (level >= max) done = true;
    if (done && level === 0) continue; // chưa xây mà "xong" ⇒ rác
    const ms = done ? 0 : def.levels[level].ms;
    if (!done && ms <= 0) { level += 1; done = true; } // mốc tức thì không thể "đang xây"
    let readyAt = isTime(r.readyAt) ? r.readyAt : (isTime(now) ? now : 0);
    if (isTime(now)) readyAt = Math.min(readyAt, now + ms);
    // xong rồi: giữ startAt cũ nếu hợp lệ (lưu / tải không đổi bản ghi); đang xây: startAt suy từ thời gian mốc
    const startAt = done && r.done !== false ? (isTime(r.startAt) && r.startAt <= readyAt && r.startAt >= readyAt - 3_600_000 ? r.startAt : readyAt) : readyAt - ms;
    out.buildings[id] = { level, done, startAt, readyAt };
  }
  const bag = raw.decor && typeof raw.decor === "object" && !Array.isArray(raw.decor) ? raw.decor : {};
  for (const [id, n] of Object.entries(bag)) {
    if (DECOR_ITEM[id] && Number.isFinite(n) && n >= 1) out.decor[id] = Math.min(Math.floor(n), DECOR_BAG_MAX);
  }
  const used = new Set();
  for (const x of Array.isArray(raw.decorPlaced) ? raw.decorPlaced : []) {
    if (!x || !DECOR_ITEM[x.id] || !DECOR_SLOT[x.slot] || used.has(x.slot)) continue;
    if (DECOR_ITEM[x.id].size === "l" && DECOR_SLOT[x.slot].size !== "l") continue;
    used.add(x.slot);
    out.decorPlaced.push({ id: x.id, slot: x.slot });
  }
  return out;
}

/**
 * Tạo trạng thái xây dựng cho save chưa có M3. warehouseTier = s.warehouse (đã nâng kho bằng xu ở M1/M2)
 * ⇒ Nhà kho coi như đã xây, level = tier + 1, để không mất sức chứa người chơi đã trả tiền.
 * Xưởng của M2 (s.buildings.xuong) không cần migrate: truyền thẳng s.buildings vào sanitize().
 */
export function migrate({ warehouseTier = 0 } = {}, now = 0) {
  const b = createBuild();
  const t = Number.isInteger(warehouseTier) ? Math.min(Math.max(warehouseTier, 0), maxLevel("nha-kho") - 1) : 0;
  if (t >= 1) b.buildings["nha-kho"] = { level: t + 1, done: true, startAt: now, readyAt: now };
  return b;
}
