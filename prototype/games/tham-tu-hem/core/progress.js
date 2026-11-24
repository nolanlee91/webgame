// Hồ sơ người chơi (thuần): tên thám tử, vụ đã phá (★, danh tiếng), tiến độ vụ đang dở, hạng thám tử. Đọc / kẹp / MIGRATIONS bản lưu.
export const PROFILE_VERSION = 1;
export const DEFAULT_NAME = "Thám Tử Lụm";
export const RANKS = [
  { id: "tap-su", name: "Thám tử tập sự", rep: 0 },
  { id: "hem", name: "Thám tử hẻm", rep: 120 },
  { id: "phuong", name: "Thám tử phường", rep: 350 },
  { id: "quan", name: "Thám tử quận", rep: 650 },
  { id: "huyen-thoai", name: "Huyền thoại Hẻm 47", rep: 1000 },
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
  return { v: PROFILE_VERSION, name: cleanName(name), rep: 0, solved: {}, runs: {}, created: 0 };
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

/** Vụ mở khoá: vụ đầu luôn mở; vụ sau mở khi vụ trước đã phá. */
export function unlocked(p, list, i) { return i === 0 || !!p.solved[list[i - 1].id]; }

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
  for (const [id, x] of Object.entries(o.solved || {})) {
    if (!x || typeof x !== "object" || !/^[\w-]+$/.test(id)) continue;
    const st = Math.min(3, Math.max(1, Math.round(Number(x.stars) || 1)));
    p.solved[id] = { stars: st, rep: Math.max(0, Math.round(Number(x.rep) || 0)), times: Math.max(1, Math.round(Number(x.times) || 1)), last: Math.min(3, Math.max(1, Math.round(Number(x.last) || st))) };
  }
  for (const [id, r] of Object.entries(o.runs || {})) if (r && typeof r === "object" && /^[\w-]+$/.test(id)) p.runs[id] = r; // từng vụ kẹp lúc nạp vụ (sanitizeRun)
  return p;
}
export const dumpProfile = (p) => JSON.stringify(p);
