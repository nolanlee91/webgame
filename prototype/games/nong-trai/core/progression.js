// XP / cấp / mở khoá — đọc bảng cấp từ data/levels.js.
import { CROP } from "../data/crops.js?v=m12";
import { LEVELS, CURRENT_MILESTONE, ORDER_SLOT_LEVELS, featureLevel, MAX_LEVEL, XP_TO_NEXT } from "../data/levels.js?v=m12";

/** XP cần để đi từ cấp `lv` lên `lv + 1` (bảng data/levels.js XP_TO_NEXT, cân bằng bằng tools/sim). lv ≥ 20 ⇒ trần cấp 20. */
export const xpNeed = (lv) => XP_TO_NEXT[Math.min(Math.max(1, Math.floor(lv) || 1), XP_TO_NEXT.length) - 1];

/** Cây đã mở: đủ cấp và (nếu cần) đã có công trình. */
export function cropUnlocked(s, id) {
  const c = CROP[id];
  if (!c || s.level < c.level) return false;
  return !c.requires || (s.buildings?.[c.requires]?.level ?? 0) >= 1; // công trình đã xây xong (core/build.js level)
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
  if (s.level >= MAX_LEVEL) { s.level = MAX_LEVEL; s.xp = Math.min(s.xp, xpNeed(MAX_LEVEL)); return; } // trần cấp 20
  while (s.xp >= xpNeed(s.level) && s.level < MAX_LEVEL) {
    s.xp -= xpNeed(s.level);
    s.level++;
    if (s.level >= MAX_LEVEL) s.xp = Math.min(s.xp, xpNeed(MAX_LEVEL));
    events.push({ type: "levelUp", level: s.level, unlocks: unlocksAt(s.level).map((u) => u.name) });
  }
}
