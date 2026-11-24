// Đố Vui Nhanh — luật thuần (không DOM): chọn 10 câu không lặp, xáo đáp án, chấm điểm theo tốc độ + chuỗi đúng, quyền 50:50.
import { QUESTIONS, CATS } from "./questions.js";
export { QUESTIONS, CATS };

export const ROUND_LEN = 10;
export const MODES = {
  normal: { id: "normal", name: "Bình thường", limit: 15000, mult: 1 },
  fast: { id: "fast", name: "Siêu tốc", limit: 8000, mult: 1.5 },
};
export const BASE = 100, SPEED_MAX = 100, STREAK_STEP = 25, STREAK_MAX = 100;

export function rng(seed) {
  let a = seed >>> 0 || 1;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function shuffle(arr, r) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

/** Điểm một câu trả lời đúng: gốc 100 + thưởng tốc độ (tối đa 100, làm tròn 10) + thưởng chuỗi; nhân hệ số chế độ. */
export function scoreFor(msUsed, limit, streak, mult = 1) {
  const left = Math.max(0, Math.min(1, 1 - msUsed / limit));
  const speed = Math.round((left * SPEED_MAX) / 10) * 10;
  const bonus = Math.min(STREAK_MAX, Math.max(0, streak - 1) * STREAK_STEP);
  return { base: BASE, speed, bonus, total: Math.round((BASE + speed + bonus) * mult) };
}

/**
 * Ván mới. cat: "all" hoặc id chủ đề. recent: chỉ số câu đã gặp gần đây (ưu tiên câu chưa gặp, vẫn đủ 10 câu khi bộ hết).
 * Mỗi câu trong ván: { id, cat, q, opts[4], correct (vị trí đáp án đúng sau khi xáo), note }.
 */
export function newRound({ seed = 1, cat = "all", mode = "normal", recent = [], ids = null } = {}) {
  const r = rng(seed), m = MODES[mode] || MODES.normal;
  const fixed = Array.isArray(ids) && ids.length > 0;
  let picks;
  if (fixed) { // thử thách hôm nay: đúng các câu đã chọn sẵn, giữ thứ tự
    picks = ids.filter((id) => Number.isInteger(id) && QUESTIONS[id]).map((id) => ({ ...QUESTIONS[id], id }));
    cat = "all";
  } else {
    const pool = QUESTIONS.map((q, id) => ({ ...q, id })).filter((q) => cat === "all" || q.cat === cat);
    const seen = new Set(recent);
    const fresh = shuffle(pool.filter((q) => !seen.has(q.id)), r), old = shuffle(pool.filter((q) => seen.has(q.id)), r);
    picks = [...fresh, ...old].slice(0, ROUND_LEN);
  }
  if (cat === "all" && !fixed) { // trộn đều chủ đề: không để 3 câu cùng chủ đề liền nhau nếu đổi chỗ được
    for (let i = 2; i < picks.length; i++) {
      if (picks[i].cat === picks[i - 1].cat && picks[i].cat === picks[i - 2].cat) {
        const j = picks.findIndex((p, k) => k > i && p.cat !== picks[i].cat);
        if (j > 0) [picks[i], picks[j]] = [picks[j], picks[i]];
      }
    }
  }
  const qs = picks.map((q) => {
    const order = shuffle([0, 1, 2, 3], r);
    return { id: q.id, cat: q.cat, q: q.q, note: q.note || "", opts: order.map((k) => q.a[k]), correct: order.indexOf(0) };
  });
  return { mode: m.id, limit: m.limit, mult: m.mult, cat, qs, i: 0, score: 0, streak: 0, bestStreak: 0, correct: 0,
    fiftyLeft: 1, hidden: [], answers: [], phase: "ask", status: "play" };
}

export const current = (s) => s.qs[s.i] || null;

/** Trả lời câu hiện tại. pick = -1 nghĩa là hết giờ. Trả về bản ghi câu trả lời, hoặc null nếu không hợp lệ. */
export function answer(s, pick, msUsed) {
  if (s.status !== "play" || s.phase !== "ask") return null;
  const q = current(s);
  if (pick !== -1 && (!Number.isInteger(pick) || pick < 0 || pick > 3 || s.hidden.includes(pick))) return null;
  const ms = Math.max(0, Math.min(s.limit, Number(msUsed) || 0));
  const ok = pick === q.correct;
  let pts = { base: 0, speed: 0, bonus: 0, total: 0 };
  if (ok) { s.streak++; s.correct++; s.bestStreak = Math.max(s.bestStreak, s.streak); pts = scoreFor(ms, s.limit, s.streak, s.mult); s.score += pts.total; }
  else s.streak = 0;
  const rec = { id: q.id, pick, correct: q.correct, ok, ms: pick === -1 ? s.limit : ms, pts: pts.total, detail: pts, timeout: pick === -1 };
  s.answers.push(rec);
  s.phase = "reveal";
  return rec;
}

/** Quyền 50:50 — bỏ 2 đáp án sai (chọn ngẫu nhiên theo r), mỗi ván 1 lần. */
export function fifty(s, r = Math.random) {
  if (s.status !== "play" || s.phase !== "ask" || s.fiftyLeft < 1) return null;
  const q = current(s);
  const wrong = [0, 1, 2, 3].filter((k) => k !== q.correct);
  const keep = wrong[Math.floor(r() * 3)];
  s.hidden = wrong.filter((k) => k !== keep);
  s.fiftyLeft--;
  return s.hidden.slice();
}

/** Sang câu sau (sau khi đã lật đáp án). Hết 10 câu ⇒ status "over". */
export function next(s) {
  if (s.phase !== "reveal") return false;
  s.hidden = [];
  if (s.i + 1 >= s.qs.length) { s.status = "over"; s.phase = "done"; return true; }
  s.i++; s.phase = "ask";
  return true;
}

/** Danh hiệu theo số câu đúng. */
export function rank(correct, total = ROUND_LEN) {
  const p = correct / total;
  if (p === 1) return "Thánh Đố Vui";
  if (p >= 0.8) return "Cao Thủ";
  if (p >= 0.6) return "Khá Lắm";
  if (p >= 0.4) return "Tạm Ổn";
  return "Cố Lên";
}
