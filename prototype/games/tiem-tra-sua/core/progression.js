// Cấp, XP, mở khóa. XP theo sao: 4–5 sao đủ XP công thức, 3 sao 60%, 1–2 sao 25% (làm tròn xuống), hủy / không thu tiền: 0.
import { LEVELS, MAX_LEVEL } from "../data/levels.js?v=m34";
import { RECIPES } from "../data/recipes.js?v=m34";
import { CHOICES, STOCK } from "../data/ingredients.js?v=m34";
import { ARCHETYPES } from "../data/customers.js?v=m34";
import { EQUIPMENT } from "../data/equipment.js?v=m34";

export function levelForXp(xp) {
  let lv = 1;
  for (const L of LEVELS) if (xp >= L.xp) lv = L.level;
  return Math.min(lv, MAX_LEVEL);
}
export const xpAt = (level) => LEVELS[Math.min(level, MAX_LEVEL) - 1].xp;
/** { into, need } trong cấp hiện tại; cấp tối đa ⇒ need = 0. */
export function xpProgress(s) {
  if (s.level >= MAX_LEVEL) return { into: s.xp - xpAt(MAX_LEVEL), need: 0 };
  return { into: s.xp - xpAt(s.level), need: xpAt(s.level + 1) - xpAt(s.level) };
}
export function xpForServe(recipe, stars) {
  if (stars >= 4) return recipe.xp;
  if (stars === 3) return Math.floor(recipe.xp * 0.6);
  if (stars >= 1) return Math.floor(recipe.xp * 0.25);
  return 0;
}
export const recipesAt = (level) => RECIPES.filter((r) => r.unlock <= level);
export const choiceUnlocked = (step, c, level) => (c.unlock || 1) <= level;
export const archetypesFor = (s) => Object.entries(ARCHETYPES).filter(([, a]) => a.unlock <= s.level && (a.minRep || 0) <= s.rep).map(([id]) => id);

/** Những gì cấp `level` vừa mở (để báo khi lên cấp). */
export function unlocksAt(level) {
  const out = [];
  for (const r of RECIPES) if (r.unlock === level) out.push({ kind: "recipe", id: r.id, name: r.name });
  for (const [id, it] of Object.entries(STOCK)) if (it.unlock === level) out.push({ kind: "stock", id, name: it.name });
  for (const c of CHOICES.base) if (c.unlock === level && !STOCK[c.id]) out.push({ kind: "base", id: c.id, name: c.name });
  for (const [id, it] of Object.entries(EQUIPMENT)) if (it.unlock === level) out.push({ kind: "equipment", id, name: it.name });
  for (const [id, a] of Object.entries(ARCHETYPES)) if (a.unlock === level && level > 1) out.push({ kind: "customer", id, name: "Khách " + a.label });
  const L = LEVELS[level - 1];
  if (L?.note) out.push({ kind: "note", name: L.note });
  return out;
}

export function gainXp(s, n, events) {
  if (n <= 0) return 0;
  s.xp += n;
  const before = s.level;
  s.level = levelForXp(s.xp);
  for (let lv = before + 1; lv <= s.level; lv++) {
    events.push({ type: "levelUp", level: lv, unlocks: unlocksAt(lv) });
    if (s.shift) s.shift.levelUps.push(lv);
  }
  return n;
}
