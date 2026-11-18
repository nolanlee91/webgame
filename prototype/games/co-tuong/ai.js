// Máy chơi Cờ Tướng — tìm kiếm alpha-beta nông + bảng điểm quân/vị trí đơn giản, chạy nhanh trên điện thoại.
//   "easy"   — nhìn 1 nước + ngẫu nhiên nhiều: luôn ăn Tướng / tránh bị bí ngay, nhưng hay bỏ lỡ đòn.
//   "normal" — nhìn 3 nửa nước (máy – bạn – máy). Máy chủ online dùng mức này để đi thay khi người chơi quá giờ.
import { W, RED, BLACK, other, sideOf, typeOf, legalMoves, inCheck } from "./logic.js";

const VAL = { K: 10000, R: 600, C: 285, N: 270, B: 120, A: 120, P: 30 };

// Điểm vị trí (nhìn từ phía Đỏ, hàng 0 = phía đối phương).
function posBonus(ty, side, r, c) {
  const rr = side === RED ? r : 9 - r;            // quy về góc nhìn của Đỏ
  const center = 4 - Math.abs(c - 4);
  switch (ty) {
    case "P": return rr <= 4 ? 40 + (rr >= 1 ? center * 6 : 0) + (4 - rr) * 4 : (rr === 5 || rr === 6) && (c % 2 === 0) ? 0 : 0;
    case "N": return center * 6 + (rr <= 6 ? 10 : 0) - (rr === 9 ? 10 : 0);
    case "C": return (c === 4 ? 12 : 0) + (rr <= 6 ? 6 : 0);
    case "R": return center * 3 + (rr <= 5 ? 10 : 0);
    default: return 0;
  }
}

export function evaluate(b, side) {
  let v = 0;
  for (let k = 0; k < b.length; k++) {
    const p = b[k]; if (p === ".") continue;
    const s = sideOf(p), ty = typeOf(p);
    const x = VAL[ty] + posBonus(ty, s, Math.floor(k / W), k % W);
    v += s === side ? x : -x;
  }
  return v;
}

const apply = (b, f, t) => { const n = b.slice(); n[t] = n[f]; n[f] = "."; return n; };
const MATE = 100000;

// Sắp xếp: ăn quân giá trị cao bằng quân giá trị thấp trước (MVV-LVA) để cắt tỉa tốt hơn.
function order(b, moves) {
  return moves.map((m) => ({ m, o: b[m[1]] === "." ? 0 : VAL[typeOf(b[m[1]])] * 10 - VAL[typeOf(b[m[0]])] / 10 }))
    .sort((a, c) => c.o - a.o).map((x) => x.m);
}

function search(b, side, depth, alpha, beta, ply) {
  const moves = legalMoves(b, side);
  if (!moves.length) return -MATE + ply;            // bị chiếu bí hoặc hết nước đi → thua
  if (depth === 0) return evaluate(b, side);
  let best = -Infinity;
  for (const [f, t] of order(b, moves)) {
    const v = -search(apply(b, f, t), other(side), depth - 1, -beta, -alpha, ply + 1);
    if (v > best) best = v;
    if (v > alpha) alpha = v;
    if (alpha >= beta) break;
  }
  return best;
}

/** Trả [from, to] cho bên đang tới lượt, hoặc null nếu hết nước. rnd: hàm ngẫu nhiên 0..1 (test lặp lại được). */
export function bestMove(s, level = "easy", rnd = Math.random) {
  const b = s.board, me = s.turn;
  const moves = legalMoves(b, me);
  if (!moves.length) return null;
  const depth = level === "normal" ? 3 : 1;
  const noise = level === "normal" ? 8 : 140;
  // Tránh đi lại đúng thế vừa có (giảm lặp nước vô ích).
  const seen = new Set(s.keys || []);
  let best = null, bestV = -Infinity;
  for (const [f, t] of order(b, moves)) {
    const nb = apply(b, f, t);
    let v = -search(nb, other(me), depth - 1, -Infinity, Infinity, 1);
    if (v > MATE / 2) v += 5000;                   // thắng ngay luôn được chọn, không bị nhiễu che mất
    else v += rnd() * noise;
    if (seen.has(nb.join("") + other(me))) v -= 25;
    if (level === "easy" && inCheck(nb, other(me))) v += 15; // mức dễ thích chiếu cho vui
    if (v > bestV) { bestV = v; best = [f, t]; }
  }
  return best;
}

export { RED, BLACK };
