// Xếp Gạch — luật thuần (không DOM): bàn 10×20 (+2 hàng ẩn phía trên), 7 khối, túi 7 ngẫu nhiên có seed,
// xoay có đẩy tường (bảng kick chuẩn), giữ khối, bóng rơi, trễ khoá 0,5s, ăn hàng, combo, điểm, cấp, chế độ Về đích 40 hàng.
// game.js chỉ gọi các hàm ở đây và đọc s.events để vẽ hiệu ứng.

export const W = 10, H = 22, HIDDEN = 2;
export const KINDS = ["I", "O", "T", "S", "Z", "J", "L"];      // ô trên bàn lưu 1..7 theo thứ tự này, 8 = gạch xám (thua)
export const LOCK_DELAY = 0.5, MAX_RESETS = 15, CLEAR_TIME = 0.34, SPRINT_LINES = 40, MAX_LEVEL = 20;

const BASE = {
  I: { n: 4, c: [[0, 1], [1, 1], [2, 1], [3, 1]] },
  O: { n: 2, c: [[0, 0], [1, 0], [0, 1], [1, 1]] },
  T: { n: 3, c: [[1, 0], [0, 1], [1, 1], [2, 1]] },
  S: { n: 3, c: [[1, 0], [2, 0], [0, 1], [1, 1]] },
  Z: { n: 3, c: [[0, 0], [1, 0], [1, 1], [2, 1]] },
  J: { n: 3, c: [[0, 0], [0, 1], [1, 1], [2, 1]] },
  L: { n: 3, c: [[2, 0], [0, 1], [1, 1], [2, 1]] },
};
// SHAPES[kind][rot] = [[x,y]...] (y hướng xuống). Xoay phải: (x,y) → (n-1-y, x).
export const SHAPES = {};
for (const k of KINDS) {
  const { n, c } = BASE[k], rots = [c];
  for (let r = 1; r < 4; r++) rots.push(k === "O" ? c : rots[r - 1].map(([x, y]) => [n - 1 - y, x]));
  SHAPES[k] = rots;
}
// Bảng đẩy tường (y hướng lên như bảng gốc; khi dùng thì đảo dấu y). Trạng thái 0, 1=phải, 2, 3=trái.
const K_JLSTZ = {
  "0>1": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]], "1>0": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "1>2": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]], "2>1": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "2>3": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]], "3>2": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "3>0": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]], "0>3": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
};
const K_I = {
  "0>1": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]], "1>0": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  "1>2": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]], "2>1": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  "2>3": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]], "3>2": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  "3>0": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]], "0>3": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
};
const LINE_PTS = [0, 100, 300, 500, 800];
export const LABELS = ["", "1 HÀNG", "2 HÀNG", "3 HÀNG", "XẾP 4 HÀNG!"];

// Thời gian rơi 1 hàng theo cấp (giây): cấp 1 = 1s, cấp 10 ≈ 0,064s, cấp 15+ gần như rơi tức thì.
export const gravityFor = (lv) => { const L = Math.min(15, Math.max(1, lv)); return Math.pow(0.8 - (L - 1) * 0.007, L - 1); };

function rand(s) { // mulberry32 lưu trong state để ván chơi tái hiện được theo seed
  s.rng = (s.rng + 0x6d2b79f5) >>> 0;
  let t = s.rng; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function refill(s) {
  while (s.queue.length < 6) {
    if (!s.bag.length) { const b = KINDS.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rand(s) * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } s.bag = b; }
    s.queue.push(s.bag.shift());
  }
}

export const cellsOf = (kind, rot, x, y) => SHAPES[kind][rot].map(([cx, cy]) => [x + cx, y + cy]);
export function fits(s, kind, rot, x, y) {
  for (const [cx, cy] of SHAPES[kind][rot]) {
    const bx = x + cx, by = y + cy;
    if (bx < 0 || bx >= W || by >= H) return false;
    if (by >= 0 && s.board[by][bx]) return false;
  }
  return true;
}
const grounded = (s) => !fits(s, s.cur.kind, s.cur.rot, s.cur.x, s.cur.y + 1);
export const canAct = (s) => s.status === "playing" && !!s.cur && !s.clearing;
export function ghostY(s) { const p = s.cur; let y = p.y; while (fits(s, p.kind, p.rot, p.x, y + 1)) y++; return y; }

export function newGame({ mode = "endless", startLevel = 1, seed = 1 } = {}) {
  const lv = mode === "sprint" ? 1 : Math.min(MAX_LEVEL, Math.max(1, startLevel | 0));
  const s = {
    mode, startLevel: lv, seed, rng: seed >>> 0, board: Array.from({ length: H }, () => Array(W).fill(0)),
    bag: [], queue: [], cur: null, hold: null, holdUsed: false,
    score: 0, lines: 0, level: lv, combo: -1, b2b: false, status: "playing", time: 0,
    grav: 0, lock: 0, resets: 0, lowest: 0, clearing: null, pieces: 0,
    stats: { 1: 0, 2: 0, 3: 0, 4: 0, maxCombo: 0, perfect: 0 }, events: [],
  };
  refill(s); spawn(s);
  return s;
}

function spawn(s, kind) {
  if (!kind) { kind = s.queue.shift(); refill(s); }
  const p = { kind, rot: 0, x: kind === "O" ? 4 : 3, y: 0 };
  s.cur = p; s.grav = 0; s.lock = 0; s.resets = 0;
  if (!fits(s, kind, 0, p.x, p.y)) { s.cur = null; return gameOver(s, "block"); }
  if (fits(s, kind, 0, p.x, p.y + 1)) p.y++;          // thả ngay 1 hàng để khối ló vào vùng nhìn thấy
  s.lowest = p.y;
  s.events.push({ type: "spawn", kind });
}
function gameOver(s, why) {
  s.status = "over"; s.cur = null;
  s.events.push({ type: "over", why });
}
function setY(s, y) { s.cur.y = y; if (y > s.lowest) { s.lowest = y; s.resets = 0; } }
function afterShift(s) { // di chuyển/xoay thành công khi đang chạm đáy → gia hạn khoá (tối đa 15 lần mỗi hàng thấp mới)
  if (grounded(s) && s.resets < MAX_RESETS) { s.lock = 0; s.resets++; }
}

export function move(s, dx) {
  if (!canAct(s)) return false;
  const p = s.cur;
  if (!fits(s, p.kind, p.rot, p.x + dx, p.y)) { s.events.push({ type: "bump", dx }); return false; }
  p.x += dx; afterShift(s); s.events.push({ type: "move", dx });
  return true;
}
export function rotate(s, dir = 1) {
  if (!canAct(s)) return false;
  const p = s.cur, to = (p.rot + dir + 4) % 4;
  if (p.kind === "O") { s.events.push({ type: "rotate", kick: 0 }); return true; }
  const table = (p.kind === "I" ? K_I : K_JLSTZ)[p.rot + ">" + to];
  for (let i = 0; i < table.length; i++) {
    const [dx, dy] = table[i];
    if (fits(s, p.kind, to, p.x + dx, p.y - dy)) {
      p.rot = to; p.x += dx; setY(s, p.y - dy); afterShift(s);
      s.events.push({ type: "rotate", kick: i });
      return true;
    }
  }
  s.events.push({ type: "bump", dx: 0 });
  return false;
}
export function softDrop(s) {
  if (!canAct(s)) return false;
  const p = s.cur;
  if (!fits(s, p.kind, p.rot, p.x, p.y + 1)) return false;
  setY(s, p.y + 1); s.grav = 0; s.score += 1;
  s.events.push({ type: "soft" });
  return true;
}
export function hardDrop(s) {
  if (!canAct(s)) return false;
  const p = s.cur, from = p.y, to = ghostY(s);
  p.y = to; s.score += 2 * (to - from);
  s.events.push({ type: "hard", kind: p.kind, rot: p.rot, x: p.x, from, to, dist: to - from });
  lockPiece(s);
  return true;
}
export function holdPiece(s) {
  if (!canAct(s) || s.holdUsed) return false;
  const k = s.cur.kind, prev = s.hold;
  s.hold = k; s.holdUsed = true;
  s.events.push({ type: "hold", kind: k });
  spawn(s, prev || undefined);
  return true;
}

function lockPiece(s) {
  const p = s.cur, cells = cellsOf(p.kind, p.rot, p.x, p.y), v = KINDS.indexOf(p.kind) + 1;
  for (const [x, y] of cells) if (y >= 0) s.board[y][x] = v;
  s.cur = null; s.holdUsed = false; s.pieces++;
  s.events.push({ type: "lock", cells, kind: p.kind });
  if (cells.every(([, y]) => y < HIDDEN)) return gameOver(s, "lock");

  const rows = [];
  for (let y = 0; y < H; y++) if (s.board[y].every(Boolean)) rows.push(y);
  const n = rows.length;
  if (!n) { s.combo = -1; return spawn(s); }

  const lv = s.level;
  let pts = LINE_PTS[n] * lv, b2b = false;
  if (n === 4) { if (s.b2b) { pts = Math.floor(pts * 1.5); b2b = true; } s.b2b = true; } else s.b2b = false;
  s.combo++;
  if (s.combo > 0) pts += 50 * s.combo * lv;
  const perfect = s.board.every((row, y) => rows.includes(y) || row.every((c) => !c));
  if (perfect) { pts += 2000 * lv; s.stats.perfect++; }
  s.score += pts; s.lines += n; s.stats[n]++; s.stats.maxCombo = Math.max(s.stats.maxCombo, s.combo);
  s.events.push({ type: "clear", rows, count: n, points: pts, combo: s.combo, b2b, perfect, label: LABELS[n] });

  if (s.mode === "sprint" && s.lines >= SPRINT_LINES) {
    collapse(s, rows); s.status = "won"; s.events.push({ type: "win", time: s.time });
    return;
  }
  if (s.mode === "endless") {
    const nl = Math.min(MAX_LEVEL, s.startLevel + Math.floor(s.lines / 10));
    if (nl !== s.level) { s.level = nl; s.events.push({ type: "level", level: nl }); }
  }
  s.clearing = { rows, t: CLEAR_TIME };
}
function collapse(s, rows) {
  const keep = s.board.filter((_, y) => !rows.includes(y));
  while (keep.length < H) keep.unshift(Array(W).fill(0));
  s.board = keep;
}

// Gọi mỗi khung hình. dt tính bằng giây.
export function step(s, dt) {
  if (s.status !== "playing") return;
  dt = Math.min(dt, 0.25);
  s.time += dt;
  if (s.clearing) {
    s.clearing.t -= dt;
    if (s.clearing.t <= 0) { collapse(s, s.clearing.rows); s.clearing = null; spawn(s); }
    return;
  }
  if (!s.cur) return;
  const g = gravityFor(s.level);
  s.grav += dt;
  while (s.grav >= g) {
    s.grav -= g;
    if (fits(s, s.cur.kind, s.cur.rot, s.cur.x, s.cur.y + 1)) setY(s, s.cur.y + 1);
    else { s.grav = 0; break; }
  }
  if (grounded(s)) {
    s.lock += dt;
    if (s.lock >= LOCK_DELAY) lockPiece(s);
  } else s.lock = 0;
}

// Độ cao chồng gạch (số hàng tính từ đáy tới ô cao nhất) — dùng cho cảnh báo nguy hiểm.
export function stackHeight(s) {
  for (let y = 0; y < H; y++) if (s.board[y].some(Boolean)) return H - y;
  return 0;
}
