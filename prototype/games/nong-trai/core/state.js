// Trạng thái nông trại: tạo mới, đọc + kẹp bản lưu v7 (và v3 / v4 / v5 / v6 ⇒ di chuyển lên v7), di chuyển bản lưu v2. Thuần, nhận `now`.
// v4 (Milestone 2) thêm: production (Xưởng), buildings.xuong (công trình Xưởng), decor (túi trang trí). Giá chợ suy ra từ thời gian, không lưu.
// v5 (Milestone 3) thêm: buildings đủ loại (core/build.js), decorPlaced (đồ đặt trên bản đồ), plots 43 ô (25 ruộng + 9 phía Đông + 9 Nhà kính).
//   Sức chứa kho suy ra từ công trình Nhà kho: s.warehouse chỉ là bản sao mốc kho (core/construct.js applyEffects), không đọc từ save v5.
//   Di chuyển v3/v4: s.warehouse ≥ 1 (đã nâng kho bằng xu) ⇒ Nhà kho coi như đã xây, level = mốc + 1 (build.migrate) — không ai mất sức chứa.
// v6 (Milestone 4) thêm: animals (đàn gà / bò, core/animals.js), village (thân thiết, nhiệm vụ làng, core/village.js), lastDeliveryAt
//   (xe giao hàng). Save cũ thiếu field ⇒ tạo mới (core/m4-handlers.js ensureM4). Đơn có trứng / sữa giữ được khi tải lại.
import { CROP, CROPS } from "../data/crops.js?v=m11";
import { ITEM, isDecor } from "../data/catalog.js?v=m11";
import { WORKSHOP } from "../data/workshop.js?v=m11";
import { createProduction, sanitize as sanitizeProduction, grantMachine } from "./production.js?v=m11";
import { MACHINES_NOW } from "./workshop.js?v=m11";
import { sanitize as sanitizeBuild, migrate as migrateBuild } from "./build.js?v=m11";
import { applyEffects } from "./construct.js?v=m11";
import { NPC } from "../data/npcs.js?v=m11";
import { WAREHOUSE, OVERFLOW_MAX } from "../data/warehouse.js?v=m11";
import { UPGRADES } from "../data/decor.js?v=m11";
import { QUESTS, TUTORIAL } from "../data/quests.js?v=m11";
const TUTORIAL_LENGTH = TUTORIAL.length;
import { ORDER_TYPES, FIRST_ORDERS, LEGACY_RECIPES, CANCEL_REFILL_MS, SPECIAL_COOLDOWN_MS } from "../data/orders.js?v=m11";
import { W, H, PLOT_COUNT, BASE_PLOTS, blankPlot } from "./plots.js?v=m11";
import { xpNeed, cropUnlocked, orderSlotCount } from "./progression.js?v=m11";
import { priceOrder, SPECIAL_LEVEL } from "./orders.js?v=m11";
import { ensureM4 } from "./m4-handlers.js?v=m11";
import { isSpecialSlot, SPECIAL2_LEVEL } from "./orders.js?v=m11";
import { createCollection, sanitize as sanitizeCollection } from "./collection.js?v=m11";
import { createFair, sanitize as sanitizeFair } from "./fair.js?v=m11";
// v7 (Milestone 6) thêm: collection (Sổ sưu tập — save cũ: món đang có trong kho ghi sẵn vào sổ), fair (hàng săn đã bán trong
//   Phiên chợ hôm nay), orders.special2 (đơn đặc biệt thứ hai, cấp 18). Không đổi / xoá field cũ nào.

export const SAVE_VERSION = 7;
/** Phiên bản đọc được (v3 = Milestone 1, chưa có Xưởng; v4 = Milestone 2, chưa có xây dựng đầy đủ; v5 = Milestone 3, chưa có chăn nuôi / làng;
 *  v6 = Milestone 4–5, chưa có sổ sưu tập / phiên chợ / đơn đặc biệt thứ hai). */
export const READABLE_VERSIONS = [3, 4, 5, 6, 7];
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
    inv: {}, overflow: {}, decor: {}, decorPlaced: [],
    production: createProduction(),
    orders: { nextId: 1, slots: [], special: null, special2: null },
    quests: { tut: 0, progress: 0 },
    plots: Array.from({ length: PLOT_COUNT }, (_, i) => blankPlot(i)),
    stats: { harvested: 0, earned: 0, delivered: 0 },
    collection: createCollection(), fair: createFair(),
  };
  s.orders.slots = FIRST_ORDERS.map((o) => ({ rev: 0, order: makeOrder(s, o, now), refillAt: now }));
  ensureM4(s, null, now); // animals, village, lastDeliveryAt (Milestone 4)
  return s;
}

// ---------- kẹp số ----------
const num = (v, lo, hi, d) => (typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d);
const int = (v, lo, hi, d) => Math.floor(num(v, lo, hi, d));
const MAX_REV = Number.MAX_SAFE_INTEGER - 1;
const parse = (raw) => { if (typeof raw !== "string") return raw; try { return JSON.parse(raw); } catch { return null; } };
const own = (o, k) => o && typeof o === "object" && Object.prototype.hasOwnProperty.call(o, k);

/** Ô ruộng từ save (25 ô của v3/v4 hoặc 43 ô của v5). Ô vùng mới (phía Đông, Nhà kính) luôn đóng ở đây — applyEffects mở
 *  lại theo công trình đã xây, ô bị đóng thì bỏ cây (chỉ xảy ra với save bị sửa tay). */
function loadPlots(plots, now) {
  return Array.from({ length: PLOT_COUNT }, (_, i) => {
    const q = plots[i];
    const p = blankPlot(i, i < BASE_PLOTS ? !!q?.open || blankPlot(i).open : !!q?.open);
    if (p.open && q && typeof q.crop === "string" && CROP[q.crop]) {
      const grow = CROP[q.crop].growMs;
      // readyAt không xa hơn một chu kỳ trồng (chặn bản lưu bị sửa / đồng hồ lùi làm cây kẹt mãi)
      const readyAt = num(q.readyAt, 0, now + grow, now + grow), plantAt = num(q.plantAt, readyAt - grow, readyAt, readyAt - grow);
      Object.assign(p, { crop: q.crop, plantAt, readyAt, watered: !!q.watered || !!p.gh });
    }
    if (i >= BASE_PLOTS) p.open = false; // applyEffects mở lại theo công trình
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
  if (isSpecialSlot(slot) !== (o.type === "dac-biet")) return null;
  const items = {};
  if (!o.items || typeof o.items !== "object") return null;
  for (const id of Object.keys(o.items)) {
    // nông sản đã mở · trứng / sữa (Milestone 4) · thành phẩm máy
    const okItem = ITEM[id] && (CROP[id] ? cropUnlocked(s, id) : ITEM[id].cat === "chan-nuoi" || (ITEM[id].producer.kind === "machine" && ITEM[id].cat === "thanh-pham"));
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

/** Công trình + trang trí (core/build.js sanitize) + máy trong bản lưu. Xưởng chưa có ⇒ không có máy.
 *  v3/v4: Nhà kho đã nâng bằng xu (d.warehouse ≥ 1) ⇒ build.migrate cho Nhà kho level = mốc + 1. */
function loadWorkshop(s, d, now) {
  const built = sanitizeBuild({ buildings: d.buildings, decor: d.decor, decorPlaced: d.decorPlaced }, now);
  if (d.v < 5 && !built.buildings["nha-kho"]) Object.assign(built.buildings, migrateBuild({ warehouseTier: int(d.warehouse, 0, WAREHOUSE.length - 1, 0) }, now).buildings);
  s.buildings = built.buildings;
  s.decor = built.decor;
  s.decorPlaced = built.decorPlaced;
  s.production = createProduction();
  if (s.buildings.xuong && s.level < WORKSHOP.unlock) delete s.buildings.xuong;
  const b = s.buildings.xuong;
  if (!b) return;
  const readyAt = b.level >= 1 ? (b.done ? b.readyAt : Math.min(b.startAt, b.readyAt)) : b.readyAt; // Xưởng dùng được từ lúc xây xong lần đầu (đang nâng ⇒ đã dùng được trước startAt)
  s.production = sanitizeProduction(d.production, now);
  for (const id of Object.keys(s.production.machines)) if (!MACHINES_NOW.some((m) => m.id === id)) delete s.production.machines[id];
  for (const m of MACHINES_NOW.filter((m) => m.withWorkshop)) {
    if (!s.production.machines[m.id]) grantMachine(s.production, m.id, readyAt);
    else s.production.machines[m.id].readyAt = Math.min(s.production.machines[m.id].readyAt, readyAt);
  }
}

/** Đọc bản lưu v6 — hoặc v5 / v4 / v3 (di chuyển: Xưởng trống, túi trang trí, Nhà kho, đàn / làng trống). Hỏng / sai phiên bản ⇒ null. Mọi số kẹp về khoảng hợp lệ. */
/** Đường XP trước Milestone 5 (60·cấp²): XP hợp lệ của save v3–v6 cũ luôn < mức này. */
const LEGACY_XP_NEED = (lv) => 60 * lv * lv;
/**
 * Cấp + XP đọc từ save. Milestone 5 hạ đường XP (data/levels.js XP_TO_NEXT) ⇒ XP đang có của save cũ có thể ≥ mức lên cấp mới:
 * XP hợp lệ theo đường cũ được dồn lên cấp (không mất tiến trình); XP rác (vượt cả đường cũ) bị kẹp dưới mức lên cấp như trước.
 */
export function carryXp(level, rawXp) {
  let xp = int(rawXp, 0, 1e12, 0);
  if (xp >= LEGACY_XP_NEED(level)) return { level, xp: xpNeed(level) - 1 };
  while (level < 20 && xp >= xpNeed(level)) { xp -= xpNeed(level); level++; }
  return { level, xp: Math.min(xp, xpNeed(level) - 1) };
}

export function loadSave(raw, now) {
  const d = parse(raw);
  if (!d || typeof d !== "object" || !READABLE_VERSIONS.includes(d.v) || !Array.isArray(d.plots)) return null;
  if (d.plots.length !== BASE_PLOTS && d.plots.length !== PLOT_COUNT) return null; // 25 ô (v3/v4) hoặc 43 ô (v5)
  const s = createState(now);
  s.coins = int(d.coins, 0, 1e12, START_COINS);
  Object.assign(s, carryXp(int(d.level, 1, 20, 1), d.xp)); // trần cấp (MAX_LEVEL); đường XP M5 rẻ hơn ⇒ XP dư lên cấp, không mất
  s.bought = int(d.bought, 0, W * H, 0);
  s.lastSeen = num(d.lastSeen, 0, now, now);
  s.seed = int(d.seed, 0, 0xffffffff, s.seed) >>> 0;
  s.freeSeeds = int(d.freeSeeds, 0, 3, 0);
  s.giftAt = num(d.giftAt, 0, now, 0);
  s.upgrade = int(d.upgrade, 0, UPGRADES.length, 0);
  loadWorkshop(s, d, now);
  s.inv = loadBag(d.inv, (id) => !isDecor(id));
  s.overflow = loadBag(d.overflow, (id) => ITEM[id].counts && !isDecor(id));
  let extra = Object.values(s.overflow).reduce((a, b) => a + b, 0) - OVERFLOW_MAX;
  for (const id of Object.keys(s.overflow)) { // giỏ tràn quá 10 ⇒ phần thừa về kho (không xoá hàng của người chơi)
    if (extra <= 0) break;
    const n = Math.min(extra, s.overflow[id]);
    s.overflow[id] -= n; s.inv[id] = (s.inv[id] || 0) + n; extra -= n;
    if (!s.overflow[id]) delete s.overflow[id];
  }
  s.plots = loadPlots(d.plots, now);
  applyEffects(s, now); // mốc kho + ô vùng mới theo công trình
  for (let i = BASE_PLOTS; i < PLOT_COUNT; i++) if (!s.plots[i].open && s.plots[i].crop) s.plots[i] = blankPlot(i, false);
  s.stats.harvested = int(d.stats?.harvested, 0, 1e12, 0);
  s.stats.earned = int(d.stats?.earned, 0, 1e15, 0);
  s.stats.delivered = int(d.stats?.delivered, 0, 1e12, 0);
  s.quests.tut = int(d.quests?.tut, 0, QUESTS.length, 0);
  s.quests.progress = s.quests.tut < QUESTS.length ? int(d.quests?.progress, 0, QUESTS[s.quests.tut].count, 0) : 0;
  // bảng đơn
  const o = d.orders && typeof d.orders === "object" ? d.orders : {};
  s.orders = { nextId: 1, slots: [], special: null, special2: null };
  const ids = new Set();
  const slotFrom = (x, slot) => {
    let order = loadOrder(s, x?.order, slot, now);
    if (order && ids.has(order.id)) order = null;
    if (order) ids.add(order.id);
    const wait = isSpecialSlot(slot) ? SPECIAL_COOLDOWN_MS : CANCEL_REFILL_MS;
    return { rev: int(x?.rev, 0, MAX_REV, 0), order, refillAt: num(x?.refillAt, 0, now + wait, now) };
  };
  const slots = Array.isArray(o.slots) ? o.slots.slice(0, orderSlotCount(s.level)) : [];
  s.orders.slots = slots.map((x, k) => slotFrom(x, k));
  if (s.level >= SPECIAL_LEVEL && o.special) s.orders.special = slotFrom(o.special, "special");
  if (s.level >= SPECIAL2_LEVEL && o.special2) s.orders.special2 = slotFrom(o.special2, "special2");
  s.orders.nextId = Math.max(int(o.nextId, 1, MAX_REV, 1), ...[...ids].map((id) => id + 1));
  ensureM4(s, d, now); // đàn (kind "bo" cũ ⇒ "bo-sua"), làng, lastDeliveryAt không ở tương lai
  // Milestone 6: sổ sưu tập (v2–v6 chưa có ⇒ ghi sẵn món đang có trong kho), phiên chợ
  s.collection = sanitizeCollection(d.v >= 7 ? d.collection : null, d.v >= 7 ? null : s);
  s.fair = sanitizeFair(d.fair, now);
  return s;
}

/** Bản lưu v2 (wgp.nongtrai.v2, kể cả đơn hàng chưa commit) → trạng thái v3. Kẹp như load() cũ. null nếu không đọc được. */
export function migrateV2(raw, now) {
  const d = parse(raw);
  if (!d || typeof d !== "object" || d.v !== 2 || !Array.isArray(d.plots) || d.plots.length !== BASE_PLOTS) return null;
  const s = createState(now);
  s.coins = int(d.coins, 0, 1e12, START_COINS);
  s.level = int(d.level, 1, 20, 1); // trần cấp (MAX_LEVEL)
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
  s.orders = { nextId: 1, slots: [], special: null, special2: null };
  const npcs = ["bac-tu", "co-hai", "chi-ba"];
  (Array.isArray(d.orders) ? d.orders : []).slice(0, orderSlotCount(s.level)).forEach((o, k) => {
    const items = Number.isInteger(o?.recipe) ? LEGACY_RECIPES[o.recipe] : null;
    const ok = items && Object.keys(items).every((id) => cropUnlocked(s, id));
    s.orders.slots.push({ rev: int(o?.revision, 0, MAX_REV, 0), order: ok ? makeOrder(s, { type: "thuong", npc: npcs[k % 3], items, mult: 1.2 }, now) : null, refillAt: now });
  });
  if (!s.orders.slots.length) s.orders.slots = FIRST_ORDERS.map((o) => ({ rev: 0, order: makeOrder(s, o, now), refillAt: now }));
  if (s.level >= SKIP_TUTORIAL_LEVEL) s.quests.tut = TUTORIAL_LENGTH;
  s.collection = sanitizeCollection(null, s); // nông sản trong kho v2 ⇒ ghi sẵn vào sổ
  return s;
}

/** Tên cũ (Milestone 1) — đọc v3 … v7. */
export const loadV3 = loadSave;

export const dump = (s, now) => JSON.stringify({ ...s, lastSeen: now });
