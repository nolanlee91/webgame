// Cờ Caro — luật chơi thuần (không DOM, không canvas). Trạng thái là object JSON thuần để sau này
// có thể đồng bộ qua mạng (online 1v1) chỉ bằng danh sách nước đi `moves`, không phải viết lại luật.
//
// Quân: 1 = X (đi trước ván đầu), 2 = O. Ô trống = 0.
// Luật:
//   "free"   — 5 quân liên tiếp trở lên (ngang, dọc, chéo) là thắng.
//   "block2" — kiểu Việt Nam: 5 quân liên tiếp nhưng bị quân đối phương chặn CẢ HAI đầu thì không tính thắng
//              (mép bàn không tính là chặn).

export const SIZES = [15, 19];
export const RULES = ["free", "block2"];
export const DIRS = [[0, 1], [1, 0], [1, 1], [1, -1]];
export const other = (p) => (p === 1 ? 2 : 1);

export function newMatch(opts = {}) {
  const size = SIZES.includes(opts.size) ? opts.size : 15;
  const rule = RULES.includes(opts.rule) ? opts.rule : "free";
  const mode = opts.mode === "ai" ? "ai" : "pvp";
  const aiLevel = opts.aiLevel === "easy" ? "easy" : "hard";
  const m = { size, rule, mode, aiLevel, aiSide: 2, score: { 1: 0, 2: 0, draw: 0 }, round: 0, first: 1 };
  return newRound(m, 1);
}

// Bắt đầu ván mới trong cùng trận (giữ tỉ số). first: quân đi trước.
export function newRound(m, first) {
  return { ...m, first, round: m.round + 1, board: new Array(m.size * m.size).fill(0), turn: first,
    moves: [], winner: 0, line: null };
}

// Ván kế: người thua đi trước; hòa thì đổi lượt đi trước.
export function nextRound(s) {
  const first = s.winner === 1 ? 2 : s.winner === 2 ? 1 : other(s.first);
  return newRound(s, first);
}

export const at = (s, r, c) => (r < 0 || c < 0 || r >= s.size || c >= s.size ? -1 : s.board[r * s.size + c]);

export function canPlay(s, r, c) {
  return !s.winner && Number.isInteger(r) && Number.isInteger(c) && at(s, r, c) === 0;
}

// Tìm hàng thắng đi qua (r,c) của quân p. Trả về danh sách ô hoặc null.
export function winLine(s, r, c, p = at(s, r, c)) {
  if (p !== 1 && p !== 2) return null;
  for (const [dr, dc] of DIRS) {
    const cells = [[r, c]];
    let a = 1, b = 1;
    while (at(s, r - dr * a, c - dc * a) === p) { cells.unshift([r - dr * a, c - dc * a]); a++; }
    while (at(s, r + dr * b, c + dc * b) === p) { cells.push([r + dr * b, c + dc * b]); b++; }
    if (cells.length < 5) continue;
    if (s.rule === "block2") {
      const o = other(p);
      if (at(s, r - dr * a, c - dc * a) === o && at(s, r + dr * b, c + dc * b) === o) continue;
    }
    return cells;
  }
  return null;
}

// Đặt quân cho người đang tới lượt. Trả về trạng thái mới (không sửa trạng thái cũ) hoặc null nếu nước không hợp lệ.
export function play(s, r, c) {
  if (!canPlay(s, r, c)) return null;
  const p = s.turn;
  const board = s.board.slice();
  board[r * s.size + c] = p;
  const n = { ...s, board, moves: [...s.moves, [r, c, p]], turn: other(p) };
  const line = winLine(n, r, c, p);
  if (line) {
    n.winner = p; n.line = line; n.score = { ...s.score, [p]: s.score[p] + 1 };
  } else if (n.moves.length === s.size * s.size) {
    n.winner = 3; n.score = { ...s.score, draw: s.score.draw + 1 };
  }
  return n;
}

// Đi lại: bỏ `count` nước cuối (chỉ khi ván chưa kết thúc).
export function undo(s, count = 1) {
  if (s.winner || !s.moves.length) return null;
  count = Math.min(count, s.moves.length);
  const board = s.board.slice();
  const moves = s.moves.slice(0, s.moves.length - count);
  for (const [r, c] of s.moves.slice(moves.length)) board[r * s.size + c] = 0;
  return { ...s, board, moves, turn: moves.length ? other(moves[moves.length - 1][2]) : s.first };
}

// Dựng lại trạng thái từ danh sách nước đi (dùng khi tải ván đang dở, hoặc nhận nước đi qua mạng sau này).
export function replay(base, moves) {
  let s = newRound({ ...base, round: base.round - 1 }, base.first);
  for (const [r, c] of moves) {
    const n = play({ ...s, score: base.score }, r, c);
    if (!n) return null;
    s = { ...n, score: base.score };
  }
  return s;
}

export const isAiTurn = (s) => s.mode === "ai" && !s.winner && s.turn === s.aiSide;
