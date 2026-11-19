// Bản đồ nông trại theo cấp + trạng thái công trình (DESIGN-2.0 §1, §3). Thuần: UI chỉ việc vẽ danh sách trả về.
// Không đổi trạng thái. Nguồn: data/buildings.js (lô, sprite), data/levels.js (mở khoá theo cấp), core/build.js (trạng thái).

import { BUILDINGS, BUILDING, LOTS, DECOR, DECOR_SLOTS, DECOR_ITEM, DECOR_SLOT, BLUEPRINT, SCAFFOLD, EAST_W, FIELD, EAST_FIELD } from "../data/buildings.js?v=m5";
import { LEVELS, MAX_LEVEL } from "../data/levels.js?v=m5";
import { buildingStatus, levelOf, effects, slotOpen } from "./build.js?v=m5";

const rec = (b, id) => (b?.buildings && Object.prototype.hasOwnProperty.call(b.buildings, id) ? b.buildings[id] : null);
const progressOf = (startAt, readyAt, now) => (readyAt <= startAt ? 1 : Math.max(0, Math.min(1, (now - startAt) / (readyAt - startAt))));

/**
 * Những gì bản đồ cần vẽ.
 * input = { build, level, now, production? }   (build = { buildings, decor, decorPlaced } — có thể là chính s); production = save.production của M2)
 * Trả {
 *   bounds: { w, h },          // đơn vị bản đồ gốc (w = 1 hoặc EAST_W khi đã mở đất phía Đông)
 *   eastOpen, fields: [{ area, x, y, w, h, cols, rows }],
 *   items: [{                  // theo thứ tự vẽ (y tăng dần)
 *     id, name, kind, lot, area, x, y, w,
 *     status,                  // buildingStatus: locked | available | building | done | upgradeable
 *     view,                    // "locked" (bản vẽ mờ + số cấp) | "blueprint" (bản vẽ xanh nhấp nháy) | "scaffold" (giàn giáo + đồng hồ) | "built"
 *     sprite, rotor?,          // { sheet, id } cần vẽ (built: sprite theo level, vd. buildings-2 ở level 2)
 *     level, maxLevel, unlockLevel,
 *     upgrading: null | { toLevel, progress, remainingMs },   // view "built" nhưng đang nâng (vẽ thêm giàn giáo nhỏ / đồng hồ)
 *     progress, remainingMs,   // view "scaffold"
 *     next: null | { level, unlock, cost, materials, ms },    // mốc xây / nâng kế tiếp (cho bảng chế độ Xây)
 *   }],
 *   emptyLots: [{ id, x, y, w, area }],      // lô chưa có công trình (lô xây phía Đông)
 *   decor: [{ id, slot, x, y, w, sprite }],
 *   decorSlots: [{ id, x, y, w, size, free, open }],  // cho chế độ Xây: ô trống đặt được
 * }
 */
export function mapLayout({ build, level, now, production } = {}) {
  const b = build || { buildings: {}, decor: {}, decorPlaced: [] };
  const eff = effects(b, now);
  const items = [];
  for (const def of BUILDINGS) {
    const status = buildingStatus(b, def.id, now, level, { production });
    const unlockLevel = def.levels[0].unlock;
    // Cảnh "auto" chỉ hiện khi đủ cấp. Công trình phía Đông (trừ chính khu đất) chỉ hiện khi đã mở.
    if (def.kind === "auto" && status === "locked") continue;
    if (def.area === "east" && def.kind !== "expansion" && !eff.eastOpen) continue;
    const lv = def.kind === "machine" ? (status === "done" ? 1 : 0) : def.kind === "auto" ? 1 : levelOf(b, def.id, now);
    const item = {
      id: def.id, name: def.name, kind: def.kind, lot: def.lot, area: def.area, x: def.x, y: def.y, w: def.w,
      status, view: "built", sprite: null, level: lv, maxLevel: def.levels.length, unlockLevel,
      upgrading: null, progress: 0, remainingMs: 0, next: null,
    };
    const r = rec(b, def.id);
    if (status === "locked") { item.view = "locked"; item.sprite = BLUEPRINT; }
    else if (status === "available") { item.view = "blueprint"; item.sprite = BLUEPRINT; }
    else if (status === "building" && lv === 0) {
      item.view = "scaffold"; item.sprite = SCAFFOLD;
      const readyAt = def.kind === "machine" ? production.machines[def.machine].readyAt : r.readyAt;
      item.remainingMs = Math.max(0, readyAt - now);
      item.progress = def.kind === "machine" ? null : progressOf(r.startAt, readyAt, now); // máy: production không lưu startAt ⇒ null
    } else {
      const step = def.levels[Math.max(0, lv - 1)];
      item.sprite = step.sprite || null;
      if (step.rotor) item.rotor = step.rotor;
      if (status === "building" && r) {
        item.upgrading = { toLevel: lv + 1, progress: progressOf(r.startAt, r.readyAt, now), remainingMs: Math.max(0, r.readyAt - now) };
      }
    }
    if (def.kind === "build" || def.kind === "expansion" || def.kind === "prebuilt") {
      const n = def.levels[lv];
      if (n) item.next = { level: lv + 1, unlock: n.unlock, cost: n.cost, materials: { ...n.materials }, ms: n.ms };
    }
    // Khu đất phía Đông đã mở thì không vẽ như một công trình nữa (đã thành ruộng + lô).
    if (def.kind === "expansion" && lv >= 1) continue;
    items.push(item);
  }
  items.sort((a, c) => a.y - c.y);

  const occupied = new Set(BUILDINGS.map((d) => d.lot));
  const emptyLots = LOTS.filter((l) => !l.candidates.length && !occupied.has(l.id) && (l.area !== "east" || eff.eastOpen))
    .map(({ id, x, y, w, area }) => ({ id, x, y, w, area }));

  const decor = (b.decorPlaced || []).filter((d) => DECOR_ITEM[d.id] && DECOR_SLOT[d.slot] && (DECOR_SLOT[d.slot].area !== "east" || eff.eastOpen))
    .map((d) => ({ id: d.id, slot: d.slot, x: DECOR_SLOT[d.slot].x, y: DECOR_SLOT[d.slot].y, w: DECOR_SLOT[d.slot].w, sprite: DECOR_ITEM[d.id].sprite }));
  const taken = new Set((b.decorPlaced || []).map((d) => d.slot));
  const decorSlots = DECOR_SLOTS.filter((s) => s.area !== "east" || eff.eastOpen)
    .map((s) => ({ id: s.id, x: s.x, y: s.y, w: s.w, size: s.size, free: !taken.has(s.id), open: slotOpen(b, s.id, now, level) }));

  const fields = [{ area: "base", ...FIELD }];
  if (eff.eastOpen) fields.push({ area: "east", ...EAST_FIELD });
  return { bounds: { w: eff.eastOpen ? EAST_W : 1, h: 1 }, eastOpen: eff.eastOpen, fields, items, emptyLots, decor, decorSlots };
}

/**
 * Tóm tắt mở khoá khi LÊN cấp `level` (toast lên cấp). Gồm mọi món của data/levels.js ở cấp đó (kèm milestone để UI
 * lọc theo CURRENT_MILESTONE) + phần bản đồ: công trình xây được, nâng cấp mới, cảnh tự xuất hiện, trang trí mới.
 * Trả { level, features: [{ kind, id, name, milestone }], build: [{ id, name, action: "build"|"upgrade"|"appears"|"machine", toLevel }], decor: [{ id, name }] }.
 */
export function unlocksAt(level) {
  const row = LEVELS.find((l) => l.lv === level);
  const out = { level, features: row ? row.unlocks.map((u) => ({ ...u })) : [], build: [], decor: [] };
  if (!Number.isInteger(level) || level < 1 || level > MAX_LEVEL) return out;
  for (const def of BUILDINGS) {
    def.levels.forEach((step, i) => {
      if (step.unlock !== level) return;
      if (def.kind === "auto") { out.build.push({ id: def.id, name: def.name, action: "appears", toLevel: 1 }); return; }
      if (def.kind === "prebuilt" && i === 0) return; // có sẵn từ đầu
      out.build.push({ id: def.id, name: def.name, action: def.kind === "machine" ? "machine" : i === 0 ? "build" : "upgrade", toLevel: i + 1 });
    });
  }
  for (const d of DECOR) if (d.unlock === level) out.decor.push({ id: d.id, name: d.name });
  return out;
}

/** Danh sách mở khoá của mọi cấp 1..MAX_LEVEL (cho sổ tiến trình). */
export const unlockTable = () => Array.from({ length: MAX_LEVEL }, (_, i) => unlocksAt(i + 1));

/** Chi tiết 1 lô cho bảng chế độ Xây (chạm lô ⇒ danh sách công trình xây được ở lô đó). */
export function lotMenu(input, lotId) {
  const lot = LOTS.find((l) => l.id === lotId);
  if (!lot) return null;
  const layout = mapLayout(input);
  return { lot: lot.id, area: lot.area, options: lot.candidates.map((id) => layout.items.find((it) => it.id === id)
    || { id, name: BUILDING[id].name, status: buildingStatus(input?.build || { buildings: {} }, id, input?.now, input?.level, { production: input?.production }) }) };
}
