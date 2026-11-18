// Rắn Săn Mồi — luật thuần (không DOM), chạy theo "nhịp" rời rạc. game.js gọi step() theo tốc độ interval(s).
// Lưới N×N, rắn = mảng ô {x,y}, đầu ở vị trí 0. Hai chế độ: "classic" (đụng tường là thua) và "wrap" (xuyên tường).

export const N = 20;
export const START_LEN = 4;
export const FOOD_PTS = 10, GOLD_PTS = 50, GOLD_EVERY = 5, GOLD_LIFE = 40; // mồi vàng xuất hiện sau mỗi 5 mồi thường, tồn tại 40 nhịp
export const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const OPP = { up: "down", down: "up", left: "right", right: "left" };

export function rng(seed) {
  let a = seed >>> 0 || 1;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** Thời gian mỗi nhịp (ms): nhanh dần theo độ dài, chạm sàn 55 ms. */
export function interval(s) {
  return Math.max(55, Math.round(160 - (s.snake.length - START_LEN) * 3.2));
}
/** Cấp tốc độ hiển thị (1..): mỗi 5 ô dài thêm lên 1 cấp. */
export const speedLevel = (s) => 1 + Math.floor((s.snake.length - START_LEN) / 5);

export function newGame({ seed = 1, mode = "classic" } = {}) {
  const r = rng(seed);
  const y = N >> 1, x0 = 6;
  const snake = []; for (let i = 0; i < START_LEN; i++) snake.push({ x: x0 - i, y });
  const s = { mode: mode === "wrap" ? "wrap" : "classic", r, snake, dir: "right", queue: [], food: null, gold: null,
    eaten: 0, score: 0, ticks: 0, status: "play", grow: 0, last: null, died: null };
  s.food = freeCell(s);
  return s;
}

const key = (c) => c.y * N + c.x;
/** Ô trống ngẫu nhiên (không trùng thân rắn / mồi khác). null nếu kín bàn. */
export function freeCell(s) {
  const used = new Set(s.snake.map(key));
  if (s.food) used.add(key(s.food));
  if (s.gold) used.add(key(s.gold));
  const free = [];
  for (let i = 0; i < N * N; i++) if (!used.has(i)) free.push(i);
  if (!free.length) return null;
  const k = free[Math.floor(s.r() * free.length)];
  return { x: k % N, y: (k / N) | 0 };
}

/** Đổi hướng (xếp hàng tối đa 2 lần bấm trong 1 nhịp; bỏ qua quay đầu 180° và bấm trùng). */
export function turn(s, d) {
  if (!DIRS[d] || s.status !== "play") return false;
  const lastDir = s.queue.length ? s.queue[s.queue.length - 1] : s.dir;
  if (d === lastDir || d === OPP[lastDir] || s.queue.length >= 2) return false;
  s.queue.push(d);
  return true;
}

/** Một nhịp: rắn tiến 1 ô. Trả về sự kiện { ate: "food"|"gold"|null, died, goldGone }. */
export function step(s) {
  const ev = { ate: null, died: false, goldGone: false, pts: 0 };
  if (s.status !== "play") return ev;
  const hadGold = !!s.gold; // đồng vàng mới sinh trong nhịp này chưa bị trừ thời gian
  if (s.queue.length) s.dir = s.queue.shift();
  const [dx, dy] = DIRS[s.dir], h = s.snake[0];
  let nx = h.x + dx, ny = h.y + dy;
  if (s.mode === "wrap") { nx = (nx + N) % N; ny = (ny + N) % N; }
  s.last = s.snake.map((c) => ({ ...c })); // vị trí nhịp trước — game.js nội suy cho chuyển động mượt
  s.ticks++;
  const hitWall = nx < 0 || ny < 0 || nx >= N || ny >= N;
  const willEat = s.food && nx === s.food.x && ny === s.food.y;
  const willGold = s.gold && nx === s.gold.x && ny === s.gold.y;
  const growing = s.grow > 0 || willEat || willGold;
  // đuôi sẽ dời đi trong nhịp này (trừ khi đang dài ra) ⇒ được phép đi vào ô đuôi cũ
  const body = growing ? s.snake : s.snake.slice(0, -1);
  const hitSelf = !hitWall && body.some((c) => c.x === nx && c.y === ny);
  if (hitWall || hitSelf) {
    s.status = "over"; s.died = { x: nx, y: ny, by: hitWall ? "wall" : "self" }; ev.died = true; s.last = null;
    return ev;
  }
  s.snake.unshift({ x: nx, y: ny });
  if (s.grow > 0) s.grow--;
  else if (!willEat && !willGold) s.snake.pop();
  if (willEat) {
    s.eaten++; ev.ate = "food"; ev.pts = FOOD_PTS * speedLevel(s); s.score += ev.pts;
    s.food = null; s.food = freeCell(s);
    if (s.eaten % GOLD_EVERY === 0 && !s.gold) { s.gold = freeCell(s); if (s.gold) s.gold.life = GOLD_LIFE; }
  } else if (willGold) {
    ev.ate = "gold"; ev.pts = GOLD_PTS * speedLevel(s); s.score += ev.pts; s.grow += 2; s.gold = null;
  }
  if (hadGold && s.gold && --s.gold.life <= 0) { s.gold = null; ev.goldGone = true; }
  if (s.snake.length >= N * N) { s.status = "won"; s.food = null; s.gold = null; }
  else if (!s.food) s.food = freeCell(s);
  return ev;
}
