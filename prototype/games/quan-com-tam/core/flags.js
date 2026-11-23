// Cờ Drama + bộ điều chỉnh có hạn (mods). Thuần, không import (mọi module dùng được, không vòng import). Chủ: Drama (agent B).
//
// Hai nguồn cờ, điều kiện sự kiện đọc chung một tập (liveFlags):
//   s.flags        cờ "trơn" do hệ khác đặt: { tên: true | số }. Tiến trình (A): ghiso-open, ghiso-unpaid-<regularId>, catering-active,
//                  catering-late, quan-moved, lunch-today, helper-bong, charcoal-low, smoke-high, rain-today. Review (C): reply-viral,
//                  reply-phot, reply-sale, persona-flip (số lần đổi tính cách hôm nay), review-1star-<lý do>. Giá trị falsy / 0 = tắt.
//   s.drama.flags  cờ của Drama có hạn: { tên: ngày cuối còn hiệu lực }. Hết hạn sau FLAG_DAYS ngày nếu không ghi khác.
// Tên cờ trong điều kiện có thể kết thúc bằng "*" = khớp tiền tố (vd "review-1star-*", "ghiso-unpaid-*").
// s.mods = [{ id, until, guests?: n | { <vai>: n }, patience?: ±% }] — áp vào lịch khách lúc mở ca (core/drama.js startDrama).
export const FLAG_DAYS = 3;
export const freshDrama = () => ({ flags: {}, queue: [], seen: {}, history: [], pending: null, nextGuests: 0, nextArch: {}, recent: [], debt: {}, decor: {}, pre: [], catName: null, moments: [] });
/** Ngày "hôm nay" của quán: Chuẩn bị và ca của ngày N đều là N (nextDay tăng s.day trước khi mở Chuẩn bị). */
export const today = (s) => Math.max(1, s.day || 1);
export function engineFlag(s, f, days = FLAG_DAYS) {
  if (!s.drama) s.drama = freshDrama();
  s.drama.flags[f] = Math.max(s.drama.flags[f] || 0, today(s) + days);
}
/** Tập cờ đang bật (cờ Drama còn hạn + cờ trơn truthy). */
export function liveFlags(s) {
  const out = new Set(Object.entries(s.drama?.flags || {}).filter(([, u]) => u >= today(s)).map(([f]) => f));
  for (const [f, v] of Object.entries(s.flags || {})) if (v) out.add(f);
  return out;
}
/** Một tên cờ (có thể kết thúc bằng "*") có trong tập không. */
export function flagIn(set, name) {
  if (!name.endsWith("*")) return set.has(name);
  const p = name.slice(0, -1);
  for (const f of set) if (f.startsWith(p)) return true;
  return false;
}
export const hasFlag = (s, f) => flagIn(liveFlags(s), f);
/** Giá trị số của cờ trơn (persona-flip…); cờ Drama còn hạn tính là 1. */
export function flagNum(s, f) {
  const v = s.flags?.[f];
  if (typeof v === "number") return v;
  if (v) return 1;
  return (s.drama?.flags?.[f] ?? -1) >= today(s) ? 1 : 0;
}
/** Bỏ cờ (cả cờ Drama lẫn cờ trơn; tên có "*" bỏ mọi cờ khớp tiền tố). */
export function dropFlag(s, f) {
  const hit = (k) => (f.endsWith("*") ? k.startsWith(f.slice(0, -1)) : k === f);
  for (const k of Object.keys(s.drama?.flags || {})) if (hit(k)) delete s.drama.flags[k];
  for (const k of Object.keys(s.flags || {})) if (hit(k)) delete s.flags[k];
}
/** Xoá cờ Drama hết hạn (gọi lúc sang ngày). */
export function expireFlags(s) {
  const t = today(s);
  for (const [f, until] of Object.entries(s.drama?.flags || {})) if (until < t) delete s.drama.flags[f];
}

/** Thêm bộ điều chỉnh có hạn (cùng id thì thay). days tính từ hôm nay (1 = còn tới hết ngày mai). */
export function addMod(s, m) {
  if (!m || typeof m.id !== "string") return;
  s.mods = (s.mods || []).filter((x) => x.id !== m.id);
  const { days = 1, ...rest } = m;
  s.mods.push({ ...rest, until: today(s) + Math.max(0, days) });
}
export const activeMods = (s, day = today(s)) => (s.mods || []).filter((m) => m.until >= day);
export function modGuests(s, day) {
  let total = 0; const byArch = {};
  for (const m of activeMods(s, day)) {
    if (typeof m.guests === "number") total += m.guests;
    else if (m.guests && typeof m.guests === "object") for (const [a, n] of Object.entries(m.guests)) byArch[a] = (byArch[a] || 0) + n;
  }
  return { total, byArch };
}
export const modPatience = (s, day) => activeMods(s, day).reduce((a, m) => a + (typeof m.patience === "number" ? m.patience : 0), 0);
export function pruneMods(s) { s.mods = (s.mods || []).filter((m) => m.until >= today(s)); }
