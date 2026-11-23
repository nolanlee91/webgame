// Cấp + XP (GAME-DESIGN §6). Thuần.
import { LEVELS, DISHES } from "../data/economy.js?v=c2";

export function levelForXp(xp) { let l = 1; for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i]) l = i + 1; return l; }
export function xpToNext(s) { const i = s.level; return i >= LEVELS.length ? null : { have: s.xp - LEVELS[i - 1], need: LEVELS[i] - LEVELS[i - 1] }; }
export function gainXp(s, n, ev = []) {
  if (!(n > 0)) return;
  s.xp += Math.floor(n);
  const lv = levelForXp(s.xp);
  if (lv > s.level) { s.level = lv; ev.push({ type: "levelUp", level: lv }); addNewDishes(s, ev); }
}
/** Món mới mở (đủ cấp + đủ trạm) tự vào menu; người chơi tắt được ở Chuẩn bị. */
export function addNewDishes(s, ev = []) {
  s.menu = Array.isArray(s.menu) ? s.menu : ["com-suon"];
  for (const [id, d] of Object.entries(DISHES)) {
    if (d.rescue || d.special || d.level > s.level || s.menu.includes(id) || (s.menuOff || []).includes(id)) continue;
    if ((d.needs || []).some((k) => !s.owned?.[k])) continue;
    s.menu.push(id); ev.push({ type: "newDish", id, name: d.name });
  }
}
