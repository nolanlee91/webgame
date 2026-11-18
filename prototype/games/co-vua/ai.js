// Bot Cờ Vua — tìm kiếm negamax + cắt tỉa alpha-beta, đánh giá bằng giá trị quân + vị trí đơn giản.
// Mức "easy" (mặc định cho người chơi): chỉ nhìn 1 nước, cộng nhiễu và thỉnh thoảng đi bừa — dễ thắng, hợp chơi giải trí.
// Mức "normal": nhìn 2 nước. Mức "hard": nhìn 3 nước — máy chủ online dùng để đi thay khi người chơi hết giờ.
import { legalMoves, applyRaw, inCheck, typeOf, colorOf } from "./logic.js";

const VAL = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
const MATE = 100000;
// thưởng vị trí: Mã/Tượng thích trung tâm; Tốt thưởng theo độ tiến; Vua thích ở góc an toàn khi còn nhiều quân
const center = (i) => { const r = i >> 3, c = i & 7; return 3.5 - Math.max(Math.abs(r - 3.5), Math.abs(c - 3.5)); };

export function evaluate(s) {
  let sc = 0;
  const b = s.board;
  for (let i = 0; i < 64; i++) {
    const p = b[i]; if (!p) continue;
    const t = typeOf(p), w = colorOf(p) === "w";
    let v = VAL[t];
    if (t === "n" || t === "b") v += center(i) * 10;
    else if (t === "p") { const adv = w ? 6 - (i >> 3) : (i >> 3) - 1; v += adv * adv * 3 + (center(i) > 1 ? 8 : 0); }
    else if (t === "q") v += center(i) * 3;
    else if (t === "k") { const home = w ? i >> 3 === 7 : i >> 3 === 0; v += home ? 12 : -10; }
    sc += w ? v : -v;
  }
  return s.turn === "w" ? sc : -sc;
}

const order = (s, moves) => moves.map((m) => [m, (s.board[m.to] ? VAL[typeOf(s.board[m.to])] * 10 - VAL[typeOf(s.board[m.from])] : 0) + (m.promo === "q" ? 8000 : 0)])
  .sort((a, b) => b[1] - a[1]).map((x) => x[0]);

function search(s, depth, alpha, beta, ply) {
  if (depth === 0) return evaluate(s);
  const moves = legalMoves(s);
  if (!moves.length) return inCheck(s) ? -MATE + ply : 0;
  let best = -Infinity;
  for (const m of order(s, moves)) {
    const v = -search(applyRaw(s, m), depth - 1, -beta, -alpha, ply + 1);
    if (v > best) best = v;
    if (v > alpha) alpha = v;
    if (alpha >= beta) break;
  }
  return best;
}

/** Chọn nước cho bên đang đi. Trả { from, to, promo? } hoặc null nếu hết nước. */
export function bestMove(s, level = "easy", rnd = Math.random) {
  const moves = legalMoves(s);
  if (!moves.length) return null;
  const depth = level === "hard" ? 3 : level === "normal" ? 2 : 1;
  const noise = level === "easy" ? 160 : level === "normal" ? 20 : 0;
  if (level === "easy" && rnd() < 0.15) { // thỉnh thoảng đi bừa (nhưng không bỏ phong cấp Hậu)
    const m = moves[Math.floor(rnd() * moves.length)];
    return m.promo ? { ...m, promo: "q" } : m;
  }
  let best = null, bestV = -Infinity;
  for (const m of order(s, moves)) {
    const n = applyRaw(s, m);
    let v = -search(n, depth - 1, -Infinity, Infinity, 1);
    if (depth === 1 && !legalMoves(n).length) v = inCheck(n) ? MATE : 0; // mức dễ vẫn thấy chiếu bí ngay
    v += (rnd() - 0.5) * noise;
    if (v > bestV) { bestV = v; best = m; }
  }
  return best;
}
