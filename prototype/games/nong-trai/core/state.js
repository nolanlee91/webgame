// Trạng thái nông trại: tạo mới, đọc + kẹp bản lưu v4 (và v3 của Milestone 1 ⇒ di chuyển lên v4), di chuyển bản lưu v2. Thuần, nhận `now`.
// v4 (Milestone 2) thêm: production (Xưởng), buildings.xuong (công trình Xưởng), decor (túi trang trí). Giá chợ suy ra từ thời gian, không lưu.
import { CROP, CROPS } from "../data/crops.js?v=m2";
import { ITEM, isDecor } from "../data/catalog.js?v=m2";
import { WORKSHOP } from "../data/workshop.js?v=m2";
import { createProduction, sanitize as sanitizeProduction, grantMachine } from "./production.js?v=m2";
import { MACHINES_NOW } from "./workshop.js?v=m2";
import { sanitize as sanitizeBuild } from "./build.js?v=m3";
import { NPC } from "../data/npcs.js?v=m2";
import { WAREHOUSE, OVERFLOW_MAX } from "../data/warehouse.js?v=m2";
import { UPGRADES } from "../data/decor.js?v=m2";
import { QUESTS, TUTORIAL } from "../data/quests.js?v=m2";
const TUTORIAL_LENGTH = TUTORIAL.length;
import { ORDER_TYPES, FIRST_ORDERS, LEGACY_RECIPES, CANCEL_REFILL_MS, SPECIAL_COOLDOWN_MS } from "../data/orders.js?v=m2";
import { W, H, START_OPEN, emptyPlot } from "./plots.js?v=m2";
import { xpNeed, cropUnlocked, orderSlotCount } from "./progression.js?v=m2";
import { priceOrder, SPECIAL_LEVEL } from "./orders.js?v=m2";

export const SAVE_VERSION = 4;
/** Phiên bản đọc được (v3 = Milestone 1, chưa có Xưởng). */
export const READABLE_VERSIONS = [3, 4];
export const START_COINS = 24;
export const SKIP_TUTORIAL_LEVEL = 3; // bản lưu cũ đã cấp ≥ 3 ⇒ bỏ qua hướng dẫn

function makeOrder(s, { type, npc, items, mult, materials = {} }, now) {
  const order = { id: s.orders.nextId++, type, npc, items: { ...items }, mult, coins: 0, xp: 0, materials: { ...materials }, createdAt: now,
    expiresAt: ORDER_TYPES[type].durationMs ? now + ORDER_TYPES[type].durationMs : null };
  Object.assign(order, (({ coins, xp }) => ({ coins, xp }))(priceOrder(order)));
  return order;
}

export function createState(now = 0, seed = (now >>> 0) ^ 0x9e3779b9) {
  const s = {
    v: SAVE_VERSION, coins: START_COINS, xp: 0, level: 1, bought: 0, lastSeen: now, seed: seed >>> 0,
    freeSeeds: 3, giftAt: 0, upgrade: 0, warehouse: 0, buildings: {},
    inv: {}, overflow: {}, decor: {},
    production: createProduction(),
    orders: { nextId: 1, slots: [], special: null },
    quests: { tut: 0, progress: 0 },
    plots: Array.from({ length: W * H }, (_, i) => emptyPlot(START_OPEN.has(i))),
    stats: { harvested: 0, earned: 0, delivered: 0 },
  };
  s.orders.slots = FIRST_ORDERS.map((o) => ({ rev: 0, order: makeOrder(s, o, now), refillAt: now }));
  return s;
}

// ---------- kẹp số ----------
const num = (v, lo, hi, d) => (typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d);
const int = (v, lo, hi, d) => Math.floor(num(v, lo, hi, d));
const MAX_REV = Number.MAX_SAFE_INTEGER - 1;
const parse = (raw) => { if (typeof raw !== "string") return raw; try { return JSON.parse(raw); } catch { return null; } };
const own = (o, k) => o && typeof o === "object" && Object.prototype.hasOwnProperty.call(o, k);

function loadPlots(plots, now) {
  return plots.map((q, i) => {
    const p = emptyPlot(!!q?.open || START_OPEN.has(i));
    if (p.open && q && typeof q.crop === "string" && CROP[q.crop]) {
      const grow = CROP[q.crop].growMs;
      // readyAt không xa hơn một chu kỳ trồng (chặn bản lưu bị sửa / đồng hồ lùi làm cây kẹt mãi)
      const readyAt = num(q.readyAt, 0, now + grow, now + grow), plantAt = num(q.plantAt, readyAt - grow, readyAt, readyAt - grow);
      Object.assign(p, { crop: q.crop, plantAt, readyAt, watered: !!q.watered });
    }
    return p;
  });
}
function loadBag(bag, pred = () => true) {
  const out = {};
  if (!bag || typeof bag !== "object") return out;
  for (const id of Object.keys(bag)) {
    if (!ITEM[id] || !pred(id)) continue;
    const q = int(bag[id], 0, 1e9, 0);
    if (q > 0) out[id] = q;
  }
  return out;
}
function loadOrder(s, o, slot, now) {
  if (!o || typeof o !== "object" || !own(ORDER_TYPES, o.type)) return null;
  const T = ORDER_TYPES[o.type];
  if ((slot === "special") !== (o.type === "dac-biet")) return null;
  const items = {};
  if (!o.items || typeof o.items !== "object") return null;
  for (const id of Object.keys(o.items)) {
    const okItem = ITEM[id] && (CROP[id] ? cropUnlocked(s, id) : ITEM[id].producer.kind === "machine" && ITEM[id].cat === "thanh-pham");
    if (!okItem) return null; // món chưa mở / lạ ⇒ bỏ đơn, ô sẽ sinh đơn mới
    items[id] = int(o.items[id], 1, 99, 1);
  }
  const kinds = Object.keys(items).length;
  if (kinds < 1 || kinds > 4) return null;
  const materials = {};
  if (T.materials && o.materials && typeof o.materials === "object") {
    for (const id of Object.keys(o.materials)) if (ITEM[id]?.cat === "vat-lieu") materials[id] = int(o.materials[id], 1, 5, 1);
  }
  const order = {
    id: int(o.id, 1, MAX_REV, 0), type: o.type, npc: own(NPC, o.npc) ? o.npc : T.npcs[0], items,
    mult: num(o.mult, T.mult[0], T.mult[1], T.mult[0]), coins: 0, xp: 0, materials,
    createdAt: num(o.createdAt, 0, now, now), expiresAt: null,
  };
  if (!order.id) return null;
  if (T.durationMs) order.expiresAt = num(o.expiresAt, 0, order.createdAt + T.durationMs, order.createdAt + T.durationMs);
  const { coins, xp } = priceOrder(order); // thưởng tính lại từ món + hệ số, không tin số trong bản lưu
  order.coins = coins; order.xp = xp;
  return order;
}

/** Công trình (core/build.js sanitize — cùng mô hình với Milestone 3) + máy trong bản lưu (v4). Xưởng chưa có ⇒ không có máy. */
function loadWorkshop(s, d, now) {
  s.buildings = sanitizeBuild({ buildings: d.buildings }, now).buildings;
  s.production = createProduction();
  if (s.buildings.xuong && s.level < WORKSHOP.unlock) delete s.buildings.xuong;
  const b = s.buildings.xuong;
  if (!b) return;
  const readyAt = b.level >= 1 ? Math.min(b.startAt, b.readyAt) : b.readyAt; // Xưởng dùng được từ lúc xây xong lần đầu
  s.production = sanitizeProduction(d.production, now);
  for (const id of Object.keys(s.production.machines)) if (!MACHINES_NOW.some((m) => m.id === id)) delete s.production.machines[id];
  for (const m of MACHINES_NOW.filter((m) => m.withWorkshop)) {
    if (!s.production.machines[m.id]) grantMachine(s.production, m.id, readyAt);
    else s.production.machines[m.id].readyAt = Math.min(s.production.machines[m.id].readyAt, readyAt);
  }
}

/** Đọc bản lưu v4 — hoặc v3 của Milestone 1 (di chuyển: thêm Xưởng trống, túi trang trí). Hỏng / sai phiên bản ⇒ null. Mọi số kẹp về khoảng hợp lệ. */
export function loadSave(raw, now) {
  const d = parse(raw);
  if (!d || typeof d !== "object" || !READABLE_VERSIONS.includes(d.v) || !Array.isArray(d.plots) || d.plots.length !== W * H) return null;
  const s = createState(now);
  s.coins = int(d.coins, 0, 1e12, START_COINS);
  s.level = int(d.level, 1, 999, 1);
  s.xp = int(d.xp, 0, xpNeed(s.level) - 1, 0);
  s.bought = int(d.bought, 0, W * H, 0);
  s.lastSeen = num(d.lastSeen, 0, now, now);
  s.seed = int(d.seed, 0, 0xffffffff, s.seed) >>> 0;
  s.freeSeeds = int(d.freeSeeds, 0, 3, 0);
  s.giftAt = num(d.giftAt, 0, now, 0);
  s.upgrade = int(d.upgrade, 0, UPGRADES.length, 0);
  s.warehouse = int(d.warehouse, 0, WAREHOUSE.length - 1, 0);
  loadWorkshop(s, d, now);
  s.inv = loadBag(d.inv, (id) => !isDecor(id));
  s.decor = loadBag(d.decor, isDecor);
  s.overflow = loadBag(d.overflow, (id) => ITEM[id].counts && !isDecor(id));
  let extra = Object.values(s.overflow).reduce((a, b) => a + b, 0) - OVERFLOW_MAX;
  for (const id of Object.keys(s.overflow)) { // giỏ tràn quá 10 ⇒ phần thừa về kho (không xoá hàng của người chơi)
    if (extra <= 0) break;
    const n = Math.min(extra, s.overflow[id]);
    s.overflow[id] -= n; s.inv[id] = (s.inv[id] || 0) + n; extra -= n;
    if (!s.overflow[id]) delete s.overflow[id];
  }
  s.plots = loadPlots(d.plots, now);
  s.stats.harvested = int(d.stats?.harvested, 0, 1e12, 0);
  s.stats.earned = int(d.stats?.earned, 0, 1e15, 0);
  s.stats.delivered = int(d.stats?.delivered, 0, 1e12, 0);
  s.quests.tut = int(d.quests?.tut, 0, QUESTS.length, 0);
  s.quests.progress = s.quests.tut < QUESTS.length ? int(d.quests?.progress, 0, QUESTS[s.quests.tut].count, 0) : 0;
  // bảng đơn
  const o = d.orders && typeof d.orders === "object" ? d.orders : {};
  s.orders = { nextId: 1, slots: [], special: null };
  const ids = new Set();
  const slotFrom = (x, slot) => {
    let order = loadOrder(s, x?.order, slot, now);
    if (order && ids.has(order.id)) order = null;
    if (order) ids.add(order.id);
    const wait = slot === "special" ? SPECIAL_COOLDOWN_MS : CANCEL_REFILL_MS;
    return { rev: int(x?.rev, 0, MAX_REV, 0), order, refillAt: num(x?.refillAt, 0, now + wait, now) };
  };
  const slots = Array.isArray(o.slots) ? o.slots.slice(0, orderSlotCount(s.level)) : [];
  s.orders.slots = slots.map((x, k) => slotFrom(x, k));
  if (s.level >= SPECIAL_LEVEL && o.special) s.orders.special = slotFrom(o.special, "special");
  s.orders.nextId = Math.max(int(o.nextId, 1, MAX_REV, 1), ...[...ids].map((id) => id + 1));
  return s;
}

/** Bản lưu v2 (wgp.nongtrai.v2, kể cả đơn hàng chưa commit) → trạng thái v3. Kẹp như load() cũ. null nếu không đọc được. */
export function migrateV2(raw, now) {
  const d = parse(raw);
  if (!d || typeof d !== "object" || d.v !== 2 || !Array.isArray(d.plots) || d.plots.length !== W * H) return null;
  const s = createState(now);
  s.coins = int(d.coins, 0, 1e12, START_COINS);
  s.level = int(d.level, 1, 999, 1);
  s.xp = int(d.xp, 0, xpNeed(s.level) - 1, 0);
  s.bought = int(d.bought, 0, W * H, 0);
  s.lastSeen = num(d.lastSeen, 0, now, now);
  s.freeSeeds = int(d.freeSeeds, 0, 3, 0);
  s.upgrade = int(d.upgrade, 0, UPGRADES.length, 0);
  // kho v2 không giới hạn ⇒ giữ nguyên toàn bộ (vượt sức chứa vẫn giữ; chỉ hàng MỚI mới bị giới hạn)
  for (const { id } of CROPS) { const q = int(d.stock?.[id], 0, 1e9, 0); if (q > 0) s.inv[id] = q; }
  s.stats.harvested = int(d.stats?.harvested, 0, 1e12, 0);
  s.stats.earned = int(d.stats?.earned, 0, 1e15, 0);
  s.plots = loadPlots(d.plots, now);
  // đơn v2: [{ recipe, revision }] ⇒ đơn thường cùng món, thưởng ×1,2 như bản cũ; ô còn thiếu sẽ được sinh khi đồng bộ
  s.orders = { nextId: 1, slots: [], special: null };
  const npcs = ["bac-tu", "co-hai", "chi-ba"];
  (Array.isArray(d.orders) ? d.orders : []).slice(0, orderSlotCount(s.level)).forEach((o, k) => {
    const items = Number.isInteger(o?.recipe) ? LEGACY_RECIPES[o.recipe] : null;
    const ok = items && Object.keys(items).every((id) => cropUnlocked(s, id));
    s.orders.slots.push({ rev: int(o?.revision, 0, MAX_REV, 0), order: ok ? makeOrder(s, { type: "thuong", npc: npcs[k % 3], items, mult: 1.2 }, now) : null, refillAt: now });
  });
  if (!s.orders.slots.length) s.orders.slots = FIRST_ORDERS.map((o) => ({ rev: 0, order: makeOrder(s, o, now), refillAt: now }));
  if (s.level >= SKIP_TUTORIAL_LEVEL) s.quests.tut = TUTORIAL_LENGTH;
  return s;
}

/** Tên cũ (Milestone 1) — đọc cả v3 lẫn v4. */
export const loadV3 = loadSave;

export const dump = (s, now) => JSON.stringify({ ...s, lastSeen: now });
