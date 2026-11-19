// XP / cấp / mở khoá — đọc bảng cấp từ data/levels.js.
import { CROP } from "../data/crops.js?v=m2b";
import { LEVELS, CURRENT_MILESTONE, ORDER_SLOT_LEVELS, featureLevel, MAX_LEVEL } from "../data/levels.js?v=m2b";

/** XP cần để đi từ cấp `lv` lên `lv + 1`. */
// 60·cấp² — mô phỏng (tools/sim): cấp 4 ≈ 9 ph, cấp 7 ≈ 47 ph, cấp 10 ≈ 2 giờ, cấp 20 ≈ 14 giờ chơi (DESIGN §3). Bản cũ 10·cấp^1,5 nhanh gấp 6–8 lần.
export const xpNeed = (lv) => 60 * lv * lv;

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
