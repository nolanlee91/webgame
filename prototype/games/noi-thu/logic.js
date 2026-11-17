// Nối Thú — luật chơi thuần (không DOM), test bằng node --test.
// Bàn rows×cols nằm trong lưới đệm (rows+2)×(cols+2): viền ngoài luôn trống, đường nối được đi vòng qua viền.
// Ô: null = trống, { id, t } = ô có hình loại t (1..36). Hai ô cùng loại nối được nếu có đường ≤ 3 đoạn thẳng
// (≤ 2 lần gấp khúc) đi qua toàn ô trống.

export const LEVELS = [
  { rows: 6, cols: 10, types: 15, time: 200, gravity: "none" },
  { rows: 7, cols: 12, types: 21, time: 240, gravity: "down" },
  { rows: 8, cols: 14, types: 28, time: 300, gravity: "left" },
  { rows: 9, cols: 16, types: 36, time: 360, gravity: "none" },
  { rows: 9, cols: 16, types: 36, time: 360, gravity: "down" },
  { rows: 9, cols: 16, types: 36, time: 340, gravity: "up" },
  { rows: 9, cols: 16, types: 36, time: 320, gravity: "left" },
  { rows: 9, cols: 16, types: 36, time: 300, gravity: "right" },
];
export const HINTS_PER_LEVEL = 3;
export const SHUFFLES_PER_LEVEL = 2;
export const PAIR_POINTS = 10;
export const COMBO_WINDOW = 4; // giây: nối cặp tiếp theo trong khoảng này thì được cộng combo
export const MAX_COMBO = 5;

export function rng(seed) {
  let s = (seed >>> 0) || 1;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function shuffleArr(a, rand) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

export const H = (g) => g.length;
export const W = (g) => g[0].length;
const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

// Trả về các điểm gấp [[r,c], ...] từ a tới b (2–4 điểm) hoặc null. Ưu tiên đường ít đoạn nhất.
export function findPath(g, a, b) {
  const [ar, ac] = a, [br, bc] = b;
  if (ar === br && ac === bc) return null;
  const A = g[ar][ac], B = g[br][bc];
  if (!A || !B || A.t !== B.t) return null;
  const h = H(g), w = W(g);
  const seen = new Map([[ar * w + ac, null]]);
  let frontier = [[ar, ac]];
  for (let seg = 1; seg <= 3; seg++) {
    const next = [];
    for (const p of frontier) {
      for (const [dr, dc] of DIRS) {
        let r = p[0] + dr, c = p[1] + dc;
        while (r >= 0 && r < h && c >= 0 && c < w) {
          if (r === br && c === bc) {
            const path = [[br, bc], p];
            let k = seen.get(p[0] * w + p[1]);
            while (k) { path.push(k); k = seen.get(k[0] * w + k[1]); }
            return path.reverse();
          }
          if (g[r][c]) break;
          const key = r * w + c;
          if (!seen.has(key)) { seen.set(key, p); next.push([r, c]); }
          r += dr; c += dc;
        }
      }
    }
    frontier = next;
  }
  return null;
}

export function tilesOf(g) {
  const out = [];
  for (let r = 1; r < H(g) - 1; r++) for (let c = 1; c < W(g) - 1; c++) if (g[r][c]) out.push([r, c]);
  return out;
}

// Cặp nối được đầu tiên tìm thấy: { a, b, path } hoặc null (bàn bế tắc).
export function findAnyPair(g) {
  const byType = new Map();
  for (const p of tilesOf(g)) { const t = g[p[0]][p[1]].t; if (!byType.has(t)) byType.set(t, []); byType.get(t).push(p); }
  for (const list of byType.values()) {
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      const path = findPath(g, list[i], list[j]);
      if (path) return { a: list[i], b: list[j], path };
    }
  }
  return null;
}

// Đảo vị trí các ô còn lại (giữ nguyên tập ô đang có hình) cho tới khi có ít nhất 1 cặp nối được.
export function reshuffle(g, rand) {
  const pos = tilesOf(g);
  if (pos.length === 0) return true;
  const tiles = pos.map(([r, c]) => g[r][c]);
  for (let tries = 0; tries < 200; tries++) {
    shuffleArr(tiles, rand);
    pos.forEach(([r, c], i) => { g[r][c] = tiles[i]; });
    if (findAnyPair(g)) return true;
  }
  return false;
}

export function deal(level, rand) {
  const L = LEVELS[level];
  const n = L.rows * L.cols, pairs = n / 2;
  // Chia cặp xoay vòng qua các loại → mỗi loại luôn có số chẵn ô; xáo thứ tự loại để loại dư cặp thay đổi mỗi ván.
  const order = shuffleArr(Array.from({ length: 36 }, (_, i) => i + 1), rand).slice(0, L.types);
  const list = [];
  let id = 1;
  for (let i = 0; i < pairs; i++) { const t = order[i % L.types]; list.push({ id: id++, t }, { id: id++, t }); }
  shuffleArr(list, rand);
  const g = Array.from({ length: L.rows + 2 }, () => Array(L.cols + 2).fill(null));
  let k = 0;
  for (let r = 1; r <= L.rows; r++) for (let c = 1; c <= L.cols; c++) g[r][c] = list[k++];
  if (!findAnyPair(g)) reshuffle(g, rand);
  return g;
}

// Trọng lực sau khi xoá ô: dồn các ô trong cột/hàng bị ảnh hưởng về phía dir. Trả về danh sách {id, from, to}.
export function applyGravity(g, dir, removed) {
  const moves = [];
  if (dir === "none") return moves;
  const rows = H(g) - 2, cols = W(g) - 2;
  const vertical = dir === "down" || dir === "up";
  const lines = [...new Set(removed.map(([r, c]) => (vertical ? c : r)))];
  for (const L of lines) {
    const n = vertical ? rows : cols;
    const cells = Array.from({ length: n }, (_, i) => (vertical ? [i + 1, L] : [L, i + 1]));
    if (dir === "down" || dir === "right") cells.reverse(); // cells[0] = phía ô dồn về
    const items = [];
    for (const [r, c] of cells) if (g[r][c]) items.push({ tile: g[r][c], from: [r, c] });
    for (const [r, c] of cells) g[r][c] = null;
    items.forEach((it, i) => {
      const [r, c] = cells[i];
      g[r][c] = it.tile;
      if (r !== it.from[0] || c !== it.from[1]) moves.push({ id: it.tile.id, from: it.from, to: [r, c] });
    });
  }
  return moves;
}

export function newGame({ level = 0, seed = Date.now(), score = 0 } = {}) {
  const rand = rng(seed);
  const L = LEVELS[level];
  return {
    level, rand, seed, score, levelStartScore: score,
    grid: deal(level, rand), gravity: L.gravity,
    timeMax: L.time, time: L.time,
    hints: HINTS_PER_LEVEL, shuffles: SHUFFLES_PER_LEVEL,
    sel: null, combo: 0, lastMatchAt: -99, clock: 0, pairs: 0,
    status: "playing", // playing | cleared | timeout | won (qua hết 8 màn)
    bonus: 0,
  };
}

export const remaining = (s) => tilesOf(s.grid).length;
const same = (a, b) => a && b && a[0] === b[0] && a[1] === b[1];

// Người chơi chọn ô [r,c]. Trả về một sự kiện để phần vẽ/âm thanh phản hồi.
export function pick(s, p) {
  if (s.status !== "playing") return { type: "ignored" };
  const [r, c] = p;
  if (r < 1 || c < 1 || r > H(s.grid) - 2 || c > W(s.grid) - 2 || !s.grid[r][c]) return { type: "ignored" };
  if (!s.sel) { s.sel = [r, c]; return { type: "select", at: [r, c] }; }
  if (same(s.sel, p)) { s.sel = null; return { type: "deselect", at: [r, c] }; }
  const a = s.sel, A = s.grid[a[0]][a[1]], B = s.grid[r][c];
  if (A.t !== B.t) { s.sel = [r, c]; return { type: "mismatch", from: a, at: [r, c] }; }
  const path = findPath(s.grid, a, p);
  if (!path) { s.sel = [r, c]; return { type: "blocked", from: a, at: [r, c] }; }
  // Nối được
  s.grid[a[0]][a[1]] = null; s.grid[r][c] = null; s.sel = null;
  s.combo = s.clock - s.lastMatchAt <= COMBO_WINDOW ? Math.min(MAX_COMBO, s.combo + 1) : 0;
  s.lastMatchAt = s.clock; s.pairs++;
  const gained = PAIR_POINTS + s.combo * 5;
  s.score += gained;
  const removedTiles = [{ id: A.id, t: A.t, at: a }, { id: B.id, t: B.t, at: [r, c] }];
  const moves = applyGravity(s.grid, s.gravity, [a, [r, c]]);
  const ev = { type: "match", path, removed: removedTiles, moves, gained, combo: s.combo };
  if (remaining(s) === 0) {
    s.bonus = Math.floor(s.time) * 2; s.score += s.bonus;
    s.status = s.level === LEVELS.length - 1 ? "won" : "cleared";
    ev.cleared = true;
  } else if (!findAnyPair(s.grid)) {
    reshuffle(s.grid, s.rand); ev.autoShuffle = true; // bế tắc → tự đảo miễn phí
  }
  return ev;
}

export function hint(s) {
  if (s.status !== "playing" || s.hints <= 0) return null;
  const h = findAnyPair(s.grid);
  if (h) s.hints--;
  return h;
}

export function shuffle(s) {
  if (s.status !== "playing" || s.shuffles <= 0) return false;
  s.shuffles--; s.sel = null;
  reshuffle(s.grid, s.rand);
  return true;
}

export function tick(s, dt) {
  if (s.status !== "playing") return null;
  s.clock += dt;
  s.time = Math.max(0, s.time - dt);
  if (s.time <= 0) { s.status = "timeout"; s.sel = null; return { type: "timeout" }; }
  return null;
}

// Sang màn sau (giữ điểm) hoặc chơi lại màn hiện tại (trả điểm về lúc bắt đầu màn).
export const nextLevel = (s, seed) => newGame({ level: s.level + 1, seed, score: s.score });
export const retryLevel = (s, seed) => newGame({ level: s.level, seed, score: s.levelStartScore });
