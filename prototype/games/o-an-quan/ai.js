// Ô Ăn Quan — máy chơi (ES module thuần, dùng chung trình duyệt + máy chủ đánh thay).
//  • Dễ   : ngẫu nhiên có trọng số — nước ăn được nhiều thì hay được chọn hơn, nhưng vẫn hay đi bừa.
//  • Vừa  : tham ăn 2 nước — điểm ăn được trừ phần đối thủ ăn lại tốt nhất ngay sau đó.
//  • Khó  : alpha-beta sâu dần theo chênh điểm, có giới hạn thời gian (mặc định 160 ms) để chạy mượt trên điện thoại.
import { ROWS, QUAN_VALUE, legalMoves, position, copyPos, step, other } from "./logic.js";

const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

function movesOf(pos) {
  if (pos.winner !== null && pos.winner !== undefined) return [];
  const out = [];
  for (const p of ROWS[pos.turn]) if (pos.pits[p] > 0) out.push([p, 1], [p, -1]);
  return out;
}

// Chênh điểm "thật" nhìn từ đội side: điểm (đã tính nợ sẽ trả) + một phần dân còn trên hàng mình (cuối ván sẽ thu).
function evaluate(pos, side) {
  const o = other(side), sc = pos.score, d = pos.debt;
  const mine = sc[side] - d[side] + d[o], theirs = sc[o] - d[o] + d[side];
  if (pos.winner !== null && pos.winner !== undefined) {
    const diff = pos.final ? pos.final.score[side] - pos.final.score[o] : mine - theirs;
    return diff * 10 + (diff > 0 ? 5000 : diff < 0 ? -5000 : 0);
  }
  let rowM = 0, rowT = 0;
  for (const p of ROWS[side]) rowM += pos.pits[p];
  for (const p of ROWS[o]) rowT += pos.pits[p];
  return (mine - theirs) * 10 + (rowM - rowT) * 3;
}

function apply(pos, m, quanNon) {
  const n = copyPos(pos);
  const g = step(n, m[0], m[1], quanNon, null);
  return { n, g };
}

function easy(s, rng) {
  const pos = position(s), ms = movesOf(pos);
  if (!ms.length) return null;
  const w = ms.map((m) => 1 + Math.max(0, apply(pos, m, s.quanNon).g) * 0.6);
  let r = rng() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < ms.length; i++) { r -= w[i]; if (r <= 0) return ms[i]; }
  return ms[ms.length - 1];
}

function medium(s, rng) {
  const pos = position(s), side = pos.turn, ms = movesOf(pos);
  if (!ms.length) return null;
  let best = -Infinity, pick = [];
  for (const m of ms) {
    const { n } = apply(pos, m, s.quanNon);
    let v;
    if (n.winner !== null) v = evaluate(n, side);
    else if (n.turn === side) v = evaluate(n, side);
    else {
      let worst = Infinity;
      for (const r of movesOf(n)) worst = Math.min(worst, evaluate(apply(n, r, s.quanNon).n, side));
      v = worst === Infinity ? evaluate(n, side) : worst;
    }
    if (v > best + 1e-9) { best = v; pick = [m]; } else if (Math.abs(v - best) <= 1e-9) pick.push(m);
  }
  return pick[Math.floor(rng() * pick.length)];
}

class Timeout extends Error {}

function hard(s, rng, opts) {
  const root = position(s), side = root.turn, ms = movesOf(root);
  if (!ms.length) return null;
  if (ms.length === 1) return ms[0];
  const limit = opts.timeMs ?? 160, maxDepth = opts.depth ?? 8, t0 = now();
  let nodes = 0;
  // alpha-beta, giá trị luôn nhìn từ đội đang nghĩ (side)
  const ab = (pos, depth, alpha, beta) => {
    if ((++nodes & 255) === 0 && now() - t0 > limit) throw new Timeout();
    if (depth === 0 || pos.winner !== null) return evaluate(pos, side);
    const list = movesOf(pos);
    if (!list.length) return evaluate(pos, side);
    // thứ tự: nước ăn nhiều trước (cắt tỉa tốt hơn)
    const kids = list.map((m) => apply(pos, m, s.quanNon)).sort((a, b) => b.g - a.g);
    if (pos.turn === side) {
      let v = -Infinity;
      for (const { n } of kids) { v = Math.max(v, ab(n, depth - 1, alpha, beta)); alpha = Math.max(alpha, v); if (alpha >= beta) break; }
      return v;
    }
    let v = Infinity;
    for (const { n } of kids) { v = Math.min(v, ab(n, depth - 1, alpha, beta)); beta = Math.min(beta, v); if (alpha >= beta) break; }
    return v;
  };
  // gốc: sâu dần, giữ kết quả độ sâu cuối cùng chạy trọn
  const kids = ms.map((m) => ({ m, ...apply(root, m, s.quanNon) })).sort((a, b) => b.g - a.g);
  let bestMove = kids[0].m;
  for (let depth = 1; depth <= maxDepth; depth++) {
    try {
      let alpha = -Infinity, cand = [], bestV = -Infinity;
      for (const k of kids) {
        const v = ab(k.n, depth - 1, alpha - 0.5, Infinity); // -0,5: nước hoà điểm với nước tốt nhất vẫn được tính đúng (điểm là số nguyên)
        k.v = v;
        if (v > bestV + 1e-9) { bestV = v; cand = [k.m]; } else if (Math.abs(v - bestV) <= 1e-9) cand.push(k.m);
        if (v > alpha) alpha = v;
      }
      bestMove = cand[Math.floor(rng() * cand.length)];
      kids.sort((a, b) => b.v - a.v); // nước tốt ở độ sâu này xét trước ở độ sâu sau
      if (Math.abs(bestV) >= 5000) break; // đã thấy thắng/thua chắc
    } catch (e) {
      if (e instanceof Timeout) break;
      throw e;
    }
  }
  return bestMove;
}

/** Chọn nước cho đội đang tới lượt. level: "easy" | "medium" | "hard". opts: { rng, timeMs, depth } → [ô, hướng] hoặc null */
export function bestMove(s, level = "medium", opts = {}) {
  const rng = opts.rng || Math.random;
  if (!legalMoves(s).length) return null;
  if (level === "easy") return easy(s, rng);
  if (level === "hard") return hard(s, rng, opts);
  return medium(s, rng);
}

export { evaluate, QUAN_VALUE };
