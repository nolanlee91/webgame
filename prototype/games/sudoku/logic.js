// Sudoku — luật chơi thuần (không DOM, chạy được bằng Node).
// Ô đánh số 0..80 theo hàng. Giá trị 0 = trống. Ghi chú (pencil mark) là bitmask: bit d (1..9) bật = có ghi chú số d.

export const DIFFS = {
  de: { name: "Dễ", target: 38, minTech: 1, maxTech: 1, tries: 1 },   // giải được chỉ bằng "ô chỉ còn 1 số"
  vua: { name: "Vừa", target: 30, minTech: 2, maxTech: 2, tries: 8 }, // cần thêm "số chỉ có 1 chỗ" trong hàng/cột/khối
  kho: { name: "Khó", target: 22, minTech: 3, maxTech: 3, tries: 10 }, // ít gợi ý nhất có thể, ưu tiên đề phải suy luận sâu hơn
};
export const DIFF_IDS = Object.keys(DIFFS);
export const HINTS = 3;
export const HISTORY = 200;

export const ROW = (i) => (i / 9) | 0;
export const COL = (i) => i % 9;
export const BOX = (i) => ((ROW(i) / 3) | 0) * 3 + ((COL(i) / 3) | 0);

// Các nhóm (hàng, cột, khối) và danh sách ô "cùng nhóm" của từng ô
export const UNITS = [];
for (let r = 0; r < 9; r++) UNITS.push([...Array(9)].map((_, c) => r * 9 + c));
for (let c = 0; c < 9; c++) UNITS.push([...Array(9)].map((_, r) => r * 9 + c));
for (let b = 0; b < 9; b++) UNITS.push([...Array(9)].map((_, k) => (((b / 3) | 0) * 3 + ((k / 3) | 0)) * 9 + (b % 3) * 3 + (k % 3)));
export const PEERS = [...Array(81)].map((_, i) => {
  const s = new Set();
  for (const u of UNITS) if (u.includes(i)) for (const j of u) if (j !== i) s.add(j);
  return [...s];
});

const ALL = 0x3fe; // bit 1..9
const bitCount = (m) => { let n = 0; while (m) { m &= m - 1; n++; } return n; };
const lowDigit = (m) => 31 - Math.clz32(m & -m);

export function rngNext(st) {
  // mulberry32, trạng thái là 1 số nguyên 32 bit
  let t = (st.rng = (st.rng + 0x6d2b79f5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function shuffle(arr, st) {
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rngNext(st) * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
  return arr;
}

/** Đếm số lời giải (dừng ở limit). grid: mảng 81 số. Trả về {count, solution}. */
export function solve(grid, limit = 2, st = null) {
  const g = grid.slice();
  const rows = new Array(9).fill(0), cols = new Array(9).fill(0), boxes = new Array(9).fill(0);
  for (let i = 0; i < 81; i++) {
    const v = g[i];
    if (!v) continue;
    const b = 1 << v;
    if ((rows[ROW(i)] | cols[COL(i)] | boxes[BOX(i)]) & b) return { count: 0, solution: null }; // đề mâu thuẫn
    rows[ROW(i)] |= b; cols[COL(i)] |= b; boxes[BOX(i)] |= b;
  }
  let count = 0, solution = null;
  const rec = () => {
    // chọn ô trống ít ứng viên nhất
    let best = -1, bestMask = 0, bestN = 10;
    for (let i = 0; i < 81; i++) {
      if (g[i]) continue;
      const m = ALL & ~(rows[ROW(i)] | cols[COL(i)] | boxes[BOX(i)]);
      const n = bitCount(m);
      if (n < bestN) { best = i; bestMask = m; bestN = n; if (n <= 1) break; }
    }
    if (best < 0) { count++; if (!solution) solution = g.slice(); return count >= limit; }
    if (!bestN) return false;
    const r = ROW(best), c = COL(best), bx = BOX(best);
    const ds = [];
    for (let d = 1; d <= 9; d++) if (bestMask & (1 << d)) ds.push(d);
    if (st) shuffle(ds, st);
    for (const d of ds) {
      const b = 1 << d;
      g[best] = d; rows[r] |= b; cols[c] |= b; boxes[bx] |= b;
      if (rec()) return true;
      g[best] = 0; rows[r] &= ~b; cols[c] &= ~b; boxes[bx] &= ~b;
    }
    return false;
  };
  rec();
  return { count, solution };
}

/** Bàn đầy đủ hợp lệ ngẫu nhiên */
export function fullGrid(st) {
  return solve(new Array(81).fill(0), 1, st).solution;
}

/**
 * Chấm độ khó theo kỹ thuật cần dùng khi giải tuần tự bằng suy luận:
 * 1 = chỉ cần "ô chỉ còn 1 ứng viên"; 2 = cần thêm "số chỉ còn 1 chỗ trong nhóm"; 3 = phải suy luận sâu hơn / thử.
 */
export function grade(grid) {
  const g = grid.slice();
  let level = 1;
  const cand = (i) => { let m = ALL; for (const j of PEERS[i]) if (g[j]) m &= ~(1 << g[j]); return m; };
  for (;;) {
    let empty = 0, placed = false;
    for (let i = 0; i < 81; i++) {
      if (g[i]) continue;
      empty++;
      const m = cand(i);
      if (!m) return 9; // mâu thuẫn
      if (bitCount(m) === 1) { g[i] = lowDigit(m); placed = true; }
    }
    if (!empty) return level;
    if (placed) continue;
    // số chỉ có 1 chỗ trong nhóm
    let hidden = false;
    for (const u of UNITS) {
      for (let d = 1; d <= 9 && !hidden; d++) {
        let pos = -1, n = 0, has = false;
        for (const i of u) {
          if (g[i] === d) { has = true; break; }
          if (!g[i] && cand(i) & (1 << d)) { n++; pos = i; }
        }
        if (!has && n === 1) { g[pos] = d; hidden = true; }
      }
      if (hidden) break;
    }
    if (hidden) { level = Math.max(level, 2); continue; }
    return 3;
  }
}

/** Sinh đề có đúng 1 lời giải theo mức độ */
export function generate(diff = "vua", seed = 1) {
  const D = DIFFS[diff] || DIFFS.vua;
  const st = { rng: seed | 0 };
  let best = null;
  for (let attempt = 0; attempt < D.tries; attempt++) {
    const solution = fullGrid(st);
    const puzzle = solution.slice();
    let clues = 81;
    const order = shuffle([...Array(41)].map((_, i) => i), st); // đục theo cặp đối xứng tâm
    for (const i of order) {
      if (clues <= D.target) break;
      const j = 80 - i;
      const a = puzzle[i], b = puzzle[j];
      puzzle[i] = 0; puzzle[j] = 0;
      const n = i === j ? 1 : 2;
      if (solve(puzzle, 2).count === 1 && (D.maxTech >= 3 || grade(puzzle) <= D.maxTech)) clues -= n;
      else { puzzle[i] = a; puzzle[j] = b; }
    }
    const level = grade(puzzle);
    const cand = { puzzle, solution, clues, level };
    if (!best || level > best.level || (level === best.level && clues < best.clues)) best = cand;
    if (level >= D.minTech && (D.maxTech < 3 || clues <= 26)) break;
  }
  return best;
}

export function newGame({ diff = "vua", seed = 1 } = {}) {
  if (!DIFFS[diff]) diff = "vua";
  const { puzzle, solution, clues, level } = generate(diff, seed);
  return {
    diff, seed, puzzle, solution, clues, level,
    cells: puzzle.slice(),
    notes: new Array(81).fill(0),
    hinted: new Array(81).fill(0),
    mistakes: 0, hintsLeft: HINTS, time: 0, moves: 0,
    status: "playing",
    history: [],
    rng: (seed ^ 0x5bd1e995) | 0,
  };
}

export const isGiven = (s, i) => s.puzzle[i] !== 0;
export const isLocked = (s, i) => s.puzzle[i] !== 0 || s.hinted[i] === 1;
export const isWrong = (s, i) => s.cells[i] !== 0 && s.cells[i] !== s.solution[i];

function snap(s) { return { c: s.cells.join(""), n: s.notes.slice() }; }
function push(s) { s.history.push(snap(s)); if (s.history.length > HISTORY) s.history.shift(); }

/** Các nhóm vừa được lấp kín ĐÚNG sau khi đặt ô i */
function completedUnits(s, i) {
  const out = [];
  for (let k = 0; k < 27; k++) {
    const u = UNITS[k];
    if (u.includes(i) && u.every((j) => s.cells[j] === s.solution[j])) out.push(k);
  }
  return out;
}
function checkWin(s) {
  if (s.cells.every((v, i) => v === s.solution[i])) { s.status = "won"; return true; }
  return false;
}

/**
 * Đặt số d (1..9) vào ô i. Trả về null nếu không có tác dụng.
 * Kết quả: {i, d, wrong, cleared:[ô bị xóa ghi chú], units:[nhóm vừa hoàn thành], won}
 */
export function place(s, i, d) {
  if (s.status !== "playing" || i < 0 || i > 80 || d < 1 || d > 9 || isLocked(s, i)) return null;
  if (s.cells[i] === d) return null;
  push(s);
  s.cells[i] = d;
  s.notes[i] = 0;
  s.moves++;
  const wrong = d !== s.solution[i];
  if (wrong) s.mistakes++;
  // tự xóa ghi chú số d ở các ô cùng hàng/cột/khối
  const cleared = [];
  const bit = 1 << d;
  for (const j of PEERS[i]) if (s.notes[j] & bit) { s.notes[j] &= ~bit; cleared.push(j); }
  const units = wrong ? [] : completedUnits(s, i);
  const won = !wrong && checkWin(s);
  return { i, d, wrong, cleared, units, won };
}

/** Bật/tắt ghi chú d ở ô i (chỉ ô đang trống) */
export function toggleNote(s, i, d) {
  if (s.status !== "playing" || isLocked(s, i) || s.cells[i] !== 0 || d < 1 || d > 9) return null;
  push(s);
  s.notes[i] ^= 1 << d;
  return { i, d, on: !!(s.notes[i] & (1 << d)) };
}

/** Xóa số hoặc ghi chú ở ô i */
export function erase(s, i) {
  if (s.status !== "playing" || isLocked(s, i)) return null;
  if (!s.cells[i] && !s.notes[i]) return null;
  push(s);
  s.cells[i] = 0; s.notes[i] = 0;
  return { i };
}

/** Ô nên gợi ý: ô đang chọn nếu trống/sai, nếu không thì ô trống dễ suy ra nhất */
export function hintTarget(s, sel = -1) {
  if (sel >= 0 && sel < 81 && !isLocked(s, sel) && s.cells[sel] !== s.solution[sel]) return sel;
  let best = -1, bestN = 10;
  for (let i = 0; i < 81; i++) {
    if (s.cells[i] === s.solution[i]) continue;
    let m = ALL;
    for (const j of PEERS[i]) if (s.cells[j] && s.cells[j] === s.solution[j]) m &= ~(1 << s.cells[j]);
    const n = bitCount(m);
    if (n < bestN || (n === bestN && rngNext(s) < 0.35)) { best = i; bestN = n; }
  }
  return best;
}

/** Dùng 1 lượt gợi ý: điền đúng số vào ô, khóa ô đó lại */
export function hint(s, sel = -1) {
  if (s.status !== "playing" || s.hintsLeft <= 0) return null;
  const i = hintTarget(s, sel);
  if (i < 0) return null;
  push(s);
  const d = s.solution[i];
  s.cells[i] = d; s.notes[i] = 0; s.hinted[i] = 1; s.hintsLeft--;
  const cleared = [];
  for (const j of PEERS[i]) if (s.notes[j] & (1 << d)) { s.notes[j] &= ~(1 << d); cleared.push(j); }
  const units = completedUnits(s, i);
  const won = checkWin(s);
  // ô đã gợi ý không hoàn tác được nữa → bỏ lịch sử cũ để không đè mất
  s.history = [];
  return { i, d, cleared, units, won };
}

export const canUndo = (s) => s.status === "playing" && s.history.length > 0;
export function undo(s) {
  if (!canUndo(s)) return false;
  const h = s.history.pop();
  s.cells = h.c.split("").map(Number);
  s.notes = h.n.slice();
  return true;
}

/** Ô trùng số với ô khác trong cùng nhóm */
export function conflicts(s) {
  const bad = new Set();
  for (const u of UNITS) {
    const seen = {};
    for (const i of u) {
      const v = s.cells[i];
      if (!v) continue;
      if (seen[v] !== undefined) { bad.add(i); bad.add(seen[v]); } else seen[v] = i;
    }
  }
  return bad;
}

/** Số lần mỗi chữ số đã được điền ĐÚNG (để mờ phím khi đủ 9) */
export function digitCounts(s) {
  const c = new Array(10).fill(0);
  for (let i = 0; i < 81; i++) if (s.cells[i] && s.cells[i] === s.solution[i]) c[s.cells[i]]++;
  return c;
}

/** Điểm khi giải xong */
export function score(s) {
  const base = { de: 1000, vua: 2000, kho: 3500 }[s.diff] || 1000;
  return Math.max(100, Math.round(base - s.mistakes * 60 - (HINTS - s.hintsLeft) * 150 - Math.floor(s.time / 6)));
}

const str = (a) => a.join("");
export function serialize(s) {
  return {
    v: 1, diff: s.diff, seed: s.seed, puzzle: str(s.puzzle), solution: str(s.solution), cells: str(s.cells),
    notes: s.notes.slice(), hinted: str(s.hinted), mistakes: s.mistakes, hintsLeft: s.hintsLeft,
    time: Math.floor(s.time * 10) / 10, moves: s.moves, status: s.status, level: s.level, clues: s.clues,
    history: s.history.slice(-30), rng: s.rng,
  };
}

export function isValidSolution(sol) {
  if (!Array.isArray(sol) || sol.length !== 81) return false;
  for (const u of UNITS) { let m = 0; for (const i of u) { const v = sol[i]; if (!(v >= 1 && v <= 9)) return false; m |= 1 << v; } if (m !== ALL) return false; }
  return true;
}

export function deserialize(o) {
  try {
    if (!o || o.v !== 1 || !DIFFS[o.diff]) return null;
    const digits = (x) => (typeof x === "string" && /^[0-9]{81}$/.test(x) ? x.split("").map(Number) : null);
    const puzzle = digits(o.puzzle), solution = digits(o.solution), cells = digits(o.cells), hinted = digits(o.hinted);
    if (!puzzle || !solution || !cells || !hinted || !isValidSolution(solution)) return null;
    for (let i = 0; i < 81; i++) {
      if (puzzle[i] && puzzle[i] !== solution[i]) return null;
      if (puzzle[i] && cells[i] !== puzzle[i]) return null;
      if (hinted[i] > 1 || (hinted[i] && cells[i] !== solution[i])) return null;
    }
    if (!Array.isArray(o.notes) || o.notes.length !== 81 || o.notes.some((n) => !Number.isInteger(n) || n < 0 || n > ALL)) return null;
    const history = Array.isArray(o.history) ? o.history.filter((h) => h && /^[0-9]{81}$/.test(h.c) && Array.isArray(h.n) && h.n.length === 81) : [];
    const s = {
      diff: o.diff, seed: o.seed | 0, puzzle, solution, cells, notes: o.notes.map((n) => n & ALL), hinted,
      mistakes: Math.max(0, o.mistakes | 0), hintsLeft: Math.min(HINTS, Math.max(0, o.hintsLeft | 0)),
      time: Math.max(0, +o.time || 0), moves: Math.max(0, o.moves | 0), status: "playing",
      level: o.level | 0, clues: o.clues | 0 || puzzle.filter(Boolean).length, history, rng: o.rng | 0,
    };
    checkWin(s);
    return s;
  } catch { return null; }
}
