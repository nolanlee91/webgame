// XP / cấp / mở khoá — đọc bảng cấp từ data/levels.js.
import { CROP } from "../data/crops.js?v=m1";
import { LEVELS, CURRENT_MILESTONE, ORDER_SLOT_LEVELS, featureLevel } from "../data/levels.js?v=m1";

/** XP cần để đi từ cấp `lv` lên `lv + 1`. */
export const xpNeed = (lv) => Math.round(10 * lv ** 1.5);

/** Cây đã mở: đủ cấp và (nếu cần) đã có công trình. */
export function cropUnlocked(s, id) {
  const c = CROP[id];
  if (!c || s.level < c.level) return false;
  return !c.requires || !!s.buildings?.[c.requires];
}
/** Tính năng đã mở theo cấp (chỉ tính năng có trong bảng cấp). */
export const hasFeature = (s, id) => s.level >= featureLevel(id);
export const orderSlotCount = (level) => ORDER_SLOT_LEVELS.filter((lv) => level >= lv).length;

/** Món mở khoá của cấp `lv` đã có trong bản hiện tại (không báo món của milestone sau). */
export function unlocksAt(lv) {
  return (LEVELS.find((l) => l.lv === lv)?.unlocks || []).filter((u) => u.milestone <= CURRENT_MILESTONE);
}
/** Món sắp mở ở các cấp sau (để giao diện hiện "Cấp n: ..."), chỉ món đã có trong bản hiện tại. */
export function nextUnlock(level) {
  for (const l of LEVELS) if (l.lv > level) { const u = unlocksAt(l.lv); if (u.length) return { lv: l.lv, unlocks: u }; }
  return null;
}

/** Cộng XP, lên cấp nếu đủ. Trả danh sách sự kiện levelUp (mỗi cấp một sự kiện). */
export function addXp(s, n, events) {
  s.xp += Math.max(0, Math.floor(n));
  while (s.xp >= xpNeed(s.level)) {
    s.xp -= xpNeed(s.level);
    s.level++;
    events.push({ type: "levelUp", level: s.level, unlocks: unlocksAt(s.level).map((u) => u.name) });
  }
}
