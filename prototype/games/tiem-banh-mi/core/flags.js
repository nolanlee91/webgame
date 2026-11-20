// Cờ Drama + bộ điều chỉnh có hạn (mods). Thuần, không import để mọi module dùng được (không vòng import).
// s.drama.flags = { cờ: ngày cuối còn hiệu lực } · s.mods = [{ id, until, guests, price, pate, cost, zone, prepMax, exchange, patience, sliceMs }]
export const FLAG_DAYS = 3;
export const freshDrama = () => ({ flags: {}, queue: [], seen: {}, history: [], pending: null, nextGuests: 0, nextArch: {}, recent: [] });
/** Ngày "hôm nay" của tiệm: trong ca = s.day; giữa hai ca s.day đã là ngày mai ⇒ hôm nay = s.day − 1. */
export const today = (s) => (s.shift ? s.day : Math.max(1, s.day - 1));
export function engineFlag(s, f, days = FLAG_DAYS) {
  if (!s.drama) s.drama = freshDrama();
  s.drama.flags[f] = Math.max(s.drama.flags[f] || 0, today(s) + days);
}
export const hasFlag = (s, f) => (s.drama?.flags?.[f] ?? -1) >= today(s);
export const liveFlags = (s) => new Set(Object.entries(s.drama?.flags || {}).filter(([, u]) => u >= today(s)).map(([f]) => f));
export function dropFlag(s, f) { if (s.drama) delete s.drama.flags[f]; }

/** Thêm bộ điều chỉnh có hạn (cùng id thì thay). days tính từ hôm nay. */
export function addMod(s, m) {
  if (!m || typeof m.id !== "string") return;
  s.mods = (s.mods || []).filter((x) => x.id !== m.id);
  const { days = 1, ...rest } = m;
  s.mods.push({ ...rest, until: today(s) + Math.max(0, days) });
}
/** Mod còn hiệu lực cho ca của ngày `day` (mặc định ca hiện tại / ca kế tiếp). */
export const activeMods = (s, day = s.day) => (s.mods || []).filter((m) => m.until >= day);
export const modSum = (s, key, day) => activeMods(s, day).reduce((a, m) => a + (typeof m[key] === "number" ? m[key] : 0), 0);
export function modGuests(s, day) {
  let total = 0; const byArch = {};
  for (const m of activeMods(s, day)) {
    if (typeof m.guests === "number") total += m.guests;
    else if (m.guests && typeof m.guests === "object") for (const [a, n] of Object.entries(m.guests)) byArch[a] = (byArch[a] || 0) + n;
  }
  return { total, byArch };
}
export function modCost(s, id, day) {
  let k = 1;
  for (const m of activeMods(s, day)) if (m.cost && typeof m.cost[id] === "number") k *= m.cost[id];
  return k;
}
export function pruneMods(s) { s.mods = (s.mods || []).filter((m) => m.until >= s.day); }
