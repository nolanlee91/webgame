// Ô Ăn Quan — luật thuần (ES module, không DOM, không canvas). Dùng chung cho trình duyệt và máy chủ
// (games-server/o-an-quan nạp file này bằng import(), không chép lại luật).
//
// Bàn 12 ô, đánh số theo chiều +1 (ngược kim đồng hồ khi nhìn từ phía đội A):
//   ô 0 = quan trái · ô 1..5 = hàng dưới (đội A, trái → phải) · ô 6 = quan phải · ô 7..11 = hàng trên (đội B, phải → trái)
//
//        11 10  9  8  7
//    0                    6
//         1  2  3  4  5
//
// Luật (dân gian, bản phổ biến):
//  • Đến lượt: chọn một ô dân bên mình còn sỏi, chọn hướng, bốc hết rải mỗi ô một viên (ô quan cũng nhận dân).
//  • Rải xong, xét ô kế tiếp:
//      – ô quan → mất lượt;
//      – ô dân có sỏi → bốc ô đó rải tiếp;
//      – ô dân trống → nếu ô sau nữa có quân thì ĂN ô đó; ăn liên tiếp theo mẫu trống–có (trống–có…);
//        gặp hai ô trống liền nhau thì dừng.
//  • Quan = 10 dân. Luật "quan non" (tuỳ chọn): ô quan còn quan mà có ít hơn 5 dân thì chưa được ăn (dừng lượt).
//  • Đến lượt mà cả hàng mình trống: lấy 5 dân từ điểm của mình rải lại mỗi ô một viên; không đủ thì vay của đội kia
//    (ghi nợ, cuối ván trả lại).
//  • Hai ô quan đều trống (hết quan, không còn dân trong ô quan) → hết ván: mỗi bên thu dân còn trên hàng mình, trả nợ,
//    ai nhiều điểm hơn thắng.
//
// Tổng điểm luôn bảo toàn: dân trên bàn + 10 × quan còn trên bàn + điểm hai đội = 70.

export const QUAN = [0, 6];
export const ROWS = [[1, 2, 3, 4, 5], [7, 8, 9, 10, 11]];
export const QUAN_VALUE = 10;
export const QUAN_NON_MIN = 5;
export const TOTAL = 70;
export const RULES = ["thuong", "quan-non"];
export const LEVELS = ["easy", "medium", "hard"];
export const MAX_PLIES = 240;  // chặn ván kéo dài vô tận (gần như không bao giờ chạm)
const MAX_LAPS = 80;           // chặn vòng rải tiếp vô tận trong một lượt

export const other = (t) => 1 - t;
export const next = (i, dir) => (i + dir + 12) % 12;
export const isQuan = (i) => i === 0 || i === 6;
export const sideOf = (pit) => (pit >= 1 && pit <= 5 ? 0 : pit >= 7 && pit <= 11 ? 1 : -1);
const qi = (i) => (i === 0 ? 0 : 1);
const emptyAt = (pits, quan, i) => !pits[i] && !(isQuan(i) && quan[qi(i)]);

/** Trận mới. opts: { quanNon | rule, mode: "ai"|"pvp", aiLevel, first } */
export function newMatch(opts = {}) {
  const quanNon = opts.quanNon === true || opts.rule === "quan-non";
  const mode = opts.mode === "ai" ? "ai" : "pvp";
  const aiLevel = LEVELS.includes(opts.aiLevel) ? opts.aiLevel : "medium";
  const m = { quanNon, mode, aiLevel, aiSide: 1, tally: [0, 0, 0], round: 0 };
  return newRound(m, opts.first === 1 ? 1 : 0);
}

/** Ván mới trong cùng trận (giữ tỉ số các ván). first: đội đi trước (0 = A, 1 = B). */
export function newRound(m, first) {
  return { ...freshBoard(m, first), round: (m.round | 0) + 1 };
}

function freshBoard(m, first) {
  return {
    quanNon: !!m.quanNon, mode: m.mode, aiLevel: m.aiLevel, aiSide: m.aiSide ?? 1, tally: (m.tally || [0, 0, 0]).slice(), round: m.round | 0,
    first, turn: first,
    pits: [0, 5, 5, 5, 5, 5, 0, 5, 5, 5, 5, 5],
    quan: [true, true],
    score: [0, 0],   // điểm hiện có (dân ăn được + 10/quan, đã trừ phần lấy ra rải lại / cho vay)
    debt: [0, 0],    // số dân đội này đã vay của đội kia
    eaten: [0, 0],   // số quan mỗi đội đã ăn
    moves: [], ply: 0, winner: null, final: null, last: null,
  };
}

/** Bàn lại từ đầu, giữ nguyên số ván + tỉ số (dùng cho "đi lại" bằng replay). */
export const restartRound = (s) => freshBoard(s, s.first);

/** Ván kế: đội thua đi trước; hòa thì đổi đội đi trước. */
export function nextRound(s) {
  const first = s.winner === 0 ? 1 : s.winner === 1 ? 0 : other(s.first);
  return newRound(s, first);
}

export const isOver = (s) => s.winner !== null && s.winner !== undefined;
export const isAiTurn = (s) => !!s && s.mode === "ai" && !isOver(s) && s.turn === s.aiSide;
export const total = (s) => s.pits.reduce((a, b) => a + b, 0) + QUAN_VALUE * s.quan.filter(Boolean).length + s.score[0] + s.score[1];

export function canPlay(s, pit, dir) {
  return !!s && !isOver(s) && Number.isInteger(pit) && (dir === 1 || dir === -1) && sideOf(pit) === s.turn && s.pits[pit] > 0;
}

/** Danh sách nước hợp lệ của đội đang tới lượt: [[ô, hướng], …] */
export function legalMoves(s) {
  if (!s || isOver(s)) return [];
  const out = [];
  for (const p of ROWS[s.turn]) if (s.pits[p] > 0) out.push([p, 1], [p, -1]);
  return out;
}

// ---------- Lõi: chạy một nước trên vị thế có thể sửa (pos: { pits, quan, score, debt, eaten, turn, ply, winner, final })
// steps (tuỳ chọn): mảng nhận chuỗi bước để client dựng hoạt cảnh.
export function step(pos, pit, dir, quanNon, steps) {
  const { pits, quan, score } = pos, side = pos.turn;
  let cur = pit, gained = 0, laps = 0;
  for (;;) {
    let n = pits[cur]; pits[cur] = 0;
    if (steps) steps.push({ k: "pick", at: cur, n });
    while (n-- > 0) { cur = next(cur, dir); pits[cur]++; if (steps) steps.push({ k: "drop", at: cur }); }
    const q = next(cur, dir);
    if (isQuan(q)) { if (steps) steps.push({ k: "stop", at: q, why: "quan" }); break; }        // ô kế là ô quan → mất lượt
    if (pits[q] > 0) {                                                                         // ô kế có dân → bốc rải tiếp
      if (++laps >= MAX_LAPS) { if (steps) steps.push({ k: "stop", at: q, why: "loop" }); break; }
      cur = q; continue;
    }
    // ô kế trống → ăn theo mẫu trống–có
    let e = q;
    for (;;) {
      const t = next(e, dir);
      if (emptyAt(pits, quan, t)) { if (steps) steps.push({ k: "stop", at: t, why: gained ? "het" : "trong" }); break; } // hai ô trống liền
      const hasQ = isQuan(t) && quan[qi(t)];
      if (hasQ && quanNon && pits[t] < QUAN_NON_MIN) { if (steps) steps.push({ k: "stop", at: t, why: "quan-non" }); break; }
      const n2 = pits[t], v = n2 + (hasQ ? QUAN_VALUE : 0);
      pits[t] = 0;
      if (hasQ) { quan[qi(t)] = false; pos.eaten[side]++; }
      score[side] += v; gained += v;
      if (steps) steps.push({ k: "take", at: t, n: n2, quan: hasQ, v, side });
      e = next(t, dir);
      if (!emptyAt(pits, quan, e)) break;                                                      // sau ô vừa ăn không trống → dừng
    }
    break;
  }
  pos.ply++;
  afterTurn(pos, quanNon, steps);
  return gained;
}

function finish(pos, steps) {
  const { pits, score, debt } = pos;
  for (const side of [0, 1]) {
    let n = 0; const at = [];
    for (const p of ROWS[side]) if (pits[p]) { n += pits[p]; at.push([p, pits[p]]); pits[p] = 0; }
    score[side] += n;
    if (steps && n) steps.push({ k: "collect", side, n, at });
  }
  for (const side of [0, 1]) if (debt[side]) {
    const d = debt[side];
    score[side] -= d; score[other(side)] += d;
    if (steps) steps.push({ k: "repay", side, n: d });
  }
  pos.winner = score[0] > score[1] ? 0 : score[1] > score[0] ? 1 : 2;
  pos.final = { score: score.slice(), debt: debt.slice(), eaten: pos.eaten.slice() };
  if (steps) steps.push({ k: "end", winner: pos.winner, score: score.slice() });
}

function afterTurn(pos, quanNon, steps) {
  const { pits, quan, score, debt } = pos;
  if ((QUAN.every((i) => emptyAt(pits, quan, i))) || pos.ply >= MAX_PLIES) return finish(pos, steps);
  const t = other(pos.turn);
  pos.turn = t;
  if (ROWS[t].every((p) => pits[p] === 0)) {                                                    // hết dân → rải lại 5 dân
    const own = Math.min(5, Math.max(0, score[t]));
    const borrow = Math.min(5 - own, Math.max(0, score[other(t)]));
    if (own + borrow === 0) return finish(pos, steps);                                         // không còn gì để rải: hết ván
    score[t] -= own; score[other(t)] -= borrow; debt[t] += borrow;
    const at = ROWS[t].slice(0, own + borrow);
    for (const p of at) pits[p]++;
    if (steps) steps.push({ k: "refill", side: t, own, borrow, at });
  }
}

function clone(s) {
  return { ...s, pits: s.pits.slice(), quan: s.quan.slice(), score: s.score.slice(), debt: s.debt.slice(), eaten: s.eaten.slice(), tally: s.tally.slice() };
}

/** Đi một nước cho đội đang tới lượt. Trả { state, steps, gained } (không sửa trạng thái cũ) hoặc null nếu không hợp lệ. */
export function playSteps(s, pit, dir) {
  if (!canPlay(s, pit, dir)) return null;
  const n = clone(s), steps = [], side = s.turn;
  const gained = step(n, pit, dir, n.quanNon, steps);
  n.moves = s.moves.concat([[pit, dir]]);
  n.last = { pit, dir, side, gained };
  if (isOver(n)) n.tally[n.winner]++;
  return { state: n, steps, gained };
}

/** Như playSteps nhưng chỉ trả trạng thái mới (hoặc null). */
export function play(s, pit, dir) {
  const r = playSteps(s, pit, dir);
  return r ? r.state : null;
}

/** Dựng lại ván từ danh sách nước [[ô, hướng], …] trên bàn đầu ván của `base`. null nếu có nước không hợp lệ. */
export function replay(base, moves) {
  let s = base;
  if (!Array.isArray(moves)) return null;
  for (const m of moves) {
    if (!Array.isArray(m)) return null;
    s = play(s, m[0], m[1]);
    if (!s) return null;
  }
  return s;
}

/** Trạng thái tối giản cho máy nghĩ (không có danh sách nước). */
export function position(s) {
  return { pits: s.pits.slice(), quan: s.quan.slice(), score: s.score.slice(), debt: s.debt.slice(), eaten: s.eaten.slice(), turn: s.turn, ply: s.ply, winner: s.winner ?? null, final: null };
}
export function copyPos(p) {
  return { pits: p.pits.slice(), quan: p.quan.slice(), score: p.score.slice(), debt: p.debt.slice(), eaten: p.eaten.slice(), turn: p.turn, ply: p.ply, winner: p.winner, final: null };
}
