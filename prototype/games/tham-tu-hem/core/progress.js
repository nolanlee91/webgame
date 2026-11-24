// Hồ sơ người chơi (thuần): tên thám tử, vụ đã phá (★, danh tiếng), tiến độ vụ đang dở, hạng thám tử. Đọc / kẹp / MIGRATIONS bản lưu.
export const PROFILE_VERSION = 1;
export const DEFAULT_NAME = "Thám Tử Lụm";
export const RANKS = [
  { id: "tap-su", name: "Thám tử tập sự", rep: 0 },
  { id: "hem", name: "Thám tử hẻm", rep: 120 },
  { id: "phuong", name: "Thám tử phường", rep: 350 },
  { id: "quan", name: "Thám tử quận", rep: 650 },
  { id: "huyen-thoai", name: "Huyền thoại Hẻm 47", rep: 1000 },
  // mùa 2 (vụ 7–12): phá hết 12 vụ 3★ (không tính câu hỏi phụ) = 1950 ⇒ vừa tới hạng cuối
  { id: "cho-hem", name: "Thám tử Chợ Hẻm", rep: 1300 },
  { id: "thanh-pho", name: "Thám tử thành phố", rep: 1600 },
  { id: "huyen-thoai-sg", name: "Huyền thoại Sài Gòn", rep: 1950 },
];
export function rankOf(rep) {
  let i = 0;
  for (let k = 0; k < RANKS.length; k++) if (rep >= RANKS[k].rep) i = k;
  const next = RANKS[i + 1] || null;
  return { ...RANKS[i], index: i, next, toNext: next ? next.rep - rep : 0, pct: next ? (rep - RANKS[i].rep) / (next.rep - RANKS[i].rep) : 1 };
}

/** Danh tiếng của một lần phá: gốc 50 + 50·độ khó, nhân 60/80/100% theo ★, +20 mỗi câu hỏi phụ đúng. */
export const BONUS_REP = 20;
export function caseRep(c, s) {
  const base = 50 + 50 * Math.max(0, c.difficulty || 0);
  const stars = s.result?.stars || 1;
  const bonus = (c.bonus || []).filter((q) => s.bonus?.[q.id] === q.answer).length;
  return { base: Math.round(base * [0, 0.6, 0.8, 1][stars]), bonus: bonus * BONUS_REP, total: Math.round(base * [0, 0.6, 0.8, 1][stars]) + bonus * BONUS_REP };
}

export function createProfile(name = "") {
  return { v: PROFILE_VERSION, name: cleanName(name), rep: 0, solved: {}, runs: {}, created: 0, flags: {} };
}
export const cleanName = (n) => String(n ?? "").replace(/[\u0000-\u001f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 24);
export const displayName = (p) => p.name || DEFAULT_NAME;

/** Ghi kết quả vụ vừa phá. Phá lại: giữ ★ cao nhất, danh tiếng chỉ cộng phần vượt kỷ lục cũ của vụ đó. */
export function recordSolve(p0, c, s) {
  const p = JSON.parse(JSON.stringify(p0));
  const old = p.solved[c.id];
  const r = caseRep(c, s);
  const before = rankOf(p.rep);
  const best = Math.max(old?.rep || 0, r.total);
  const gained = best - (old?.rep || 0);
  p.rep += gained;
  p.solved[c.id] = { stars: Math.max(old?.stars || 0, s.result.stars), rep: best, times: (old?.times || 0) + 1, last: s.result.stars };
  delete p.runs[c.id];
  const after = rankOf(p.rep);
  return { p, gained, rep: r, rankUp: after.index > before.index ? after : null };
}

/** Vụ mở khoá: vụ đầu luôn mở; vụ sau mở khi vụ trước đã phá (nối qua mùa: Vụ 7 mở khi phá Vụ 6). */
export function unlocked(p, list, i) { return i === 0 || !!p.solved[list[i - 1].id]; }

// ---------- mùa ----------
/** Thông tin từng mùa (tab bản đồ). Vụ không ghi `season` thuộc mùa 1. */
export const SEASONS = [
  { no: 1, tab: "Mùa 1 · Hẻm 47", title: "Bản đồ Hẻm 47", map: "assets/scenes/hem-map.webp" },
  { no: 2, tab: "Mùa 2 · Chợ Hẻm", title: "Bản đồ Chợ Hẻm", map: "assets/scenes/hem-map-2.webp", lockMsg: "Phá xong Vụ 6 để mở Chợ Hẻm" },
];
export const seasonOf = (e) => (e && Number.isInteger(e.season) && e.season > 0 ? e.season : 1);
/** Mùa mở khi vụ đầu của mùa đã mở khoá (mùa 1 luôn mở). list = danh mục thật theo thứ tự (không có vụ dev). */
export function seasonUnlocked(p, list, season) {
  if (season <= 1) return true;
  const i = list.findIndex((e) => seasonOf(e) === season);
  return i >= 0 && unlocked(p, list, i);
}
/** Tab tự chọn khi mở bản đồ: mùa của vụ đang dở (vụ mới nhất có tiến độ), không có thì mùa của vụ mới nhất đã mở khoá. */
export function pickSeason(p, list) {
  for (let i = list.length - 1; i >= 0; i--) { const r = p.runs[list[i].id]; if (r && r.phase && r.phase !== "intro" && r.phase !== "done" && unlocked(p, list, i)) return seasonOf(list[i]); }
  for (let i = list.length - 1; i >= 0; i--) if (unlocked(p, list, i)) return seasonOf(list[i]);
  return 1;
}

// ---------- bản lưu ----------
/** MIGRATIONS[n] nâng bản lưu từ phiên bản n lên n+1. v0 = bản thử nghiệm không có trường v ({ name, stars: {id:★}, rep }). */
export const MIGRATIONS = {
  0: (o) => ({
    v: 1, name: o.name ?? o.detective ?? "", rep: Number(o.rep) || 0, runs: {}, created: 0,
    solved: Object.fromEntries(Object.entries(o.stars || {}).map(([id, st]) => [id, { stars: Number(st) || 1, rep: 0, times: 1, last: Number(st) || 1 }])),
  }),
};
export function saveVersion(raw) {
  try { const o = JSON.parse(raw); return o && typeof o === "object" ? (Number.isInteger(o.v) ? o.v : 0) : null; } catch { return null; }
}
/** Đọc chuỗi bản lưu ⇒ hồ sơ đã kẹp, hoặc null nếu hỏng. */
export function loadProfile(raw) {
  let o;
  try { o = JSON.parse(raw); } catch { return null; }
  if (!o || typeof o !== "object" || Array.isArray(o)) return null;
  let v = Number.isInteger(o.v) ? o.v : 0;
  if (v > PROFILE_VERSION) return null;
  while (v < PROFILE_VERSION) { const m = MIGRATIONS[v]; if (!m) return null; o = m(o); v = o.v; }
  const p = createProfile(o.name);
  p.rep = Number.isFinite(o.rep) ? Math.max(0, Math.min(99999, Math.round(o.rep))) : 0;
  p.created = Number.isFinite(o.created) ? o.created : 0;
  // flags (thêm ở mùa 2, tuỳ chọn ⇒ không đổi phiên bản bản lưu; bản cũ không có thì rỗng, code cũ đọc bản mới thì bỏ qua)
  if (o.flags && typeof o.flags === "object" && !Array.isArray(o.flags)) for (const [k, x] of Object.entries(o.flags)) if (/^[\w-]{1,32}$/.test(k) && (typeof x === "number" || typeof x === "boolean")) p.flags[k] = x;
  for (const [id, x] of Object.entries(o.solved || {})) {
    if (!x || typeof x !== "object" || !/^[\w-]+$/.test(id)) continue;
    const st = Math.min(3, Math.max(1, Math.round(Number(x.stars) || 1)));
    p.solved[id] = { stars: st, rep: Math.max(0, Math.round(Number(x.rep) || 0)), times: Math.max(1, Math.round(Number(x.times) || 1)), last: Math.min(3, Math.max(1, Math.round(Number(x.last) || st))) };
  }
  for (const [id, r] of Object.entries(o.runs || {})) if (r && typeof r === "object" && /^[\w-]+$/.test(id)) p.runs[id] = r; // từng vụ kẹp lúc nạp vụ (sanitizeRun)
  return p;
}
export const dumpProfile = (p) => JSON.stringify(p);
