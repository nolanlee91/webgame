// Đặt Bom — luật chơi dùng chung cho máy chủ (games-server/dat-bom/room.js) và trình duyệt (app.js).
// Toạ độ người chơi tính theo ô: tâm ô (cx, cy) là số nguyên; ô của người = làm tròn toạ độ.
// Máy chủ là nguồn sự thật cho bom, lửa, gạch, vật phẩm, sống/chết, điểm. Vị trí do client tự đi (cho mượt)
// rồi gửi lên; máy chủ kiểm tra bằng tryMove() (không xuyên tường, không nhanh hơn tốc độ cho phép).
export const W = 13, H = 11;
export const RULES = {
  fuse: 2500,        // bom nổ sau 2,5 s
  flame: 500,        // lửa cháy 0,5 s
  baseBombs: 1, maxBombs: 8,
  baseRange: 2, maxRange: 8,
  baseSpeed: 3.2, speedStep: 0.5, maxSpeed: 6, // ô / giây
  dropChance: 0.35,  // tỉ lệ gạch vỡ rơi vật phẩm
  brickChance: 0.7,
  roundMs: 180000,   // 3 phút
  countdown: 3000,   // đếm ngược trước khi được đi
  score: { kill: 100, brick: 10, pick: 5 },
};
export const SPAWNS = [[1, 1], [W - 2, H - 2], [W - 2, 1], [1, H - 2]];
export const ITEM_KINDS = ["b", "f", "s"]; // b = thêm bom, f = lửa dài hơn, s = chạy nhanh hơn
export const DIRS = { l: [-1, 0], r: [1, 0], u: [0, -1], d: [0, 1] };
const BOX = 0.45; // nửa cạnh hộp va chạm của người chơi (ô = 1)

export const idx = (x, y) => y * W + x;
export const inside = (x, y) => x >= 0 && y >= 0 && x < W && y < H;

/** Bản đồ: viền + cột cố định ở ô (chẵn, chẵn), gạch ngẫu nhiên, chừa trống 3 ô mỗi góc xuất phát. */
export function makeGrid(rand) {
  const safe = new Set();
  for (const [sx, sy] of SPAWNS) {
    safe.add(idx(sx, sy));
    safe.add(idx(sx + (sx === 1 ? 1 : -1), sy));
    safe.add(idx(sx, sy + (sy === 1 ? 1 : -1)));
  }
  const g = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (x === 0 || y === 0 || x === W - 1 || y === H - 1 || (x % 2 === 0 && y % 2 === 0)) g.push("#");
    else if (safe.has(idx(x, y))) g.push(".");
    else g.push(rand() < RULES.brickChance ? "+" : ".");
  }
  return g;
}

export const cell = (grid, x, y) => (inside(x, y) ? grid[idx(x, y)] : "#");
export const solid = (grid, x, y) => { const c = cell(grid, x, y); return c === "#" || c === "+"; };

/** Ô (x,y) có chặn người chơi `me` không: tường, gạch, hoặc bom mà người này không còn được đi xuyên. */
export function blocker(grid, bombs, me) {
  return (x, y) => solid(grid, x, y) || bombs.some((b) => b.x === x && b.y === y && !b.pass.includes(me));
}

/** Đi theo hướng `dir` một quãng `dist` (ô). Đi theo làn: phải thẳng hàng trục vuông góc mới tiến được;
 *  có hỗ trợ vào góc (lệch > 0,3 ô về phía làn trống thì tự trượt sang làn đó). Trả vị trí mới {x, y}. */
export function move(pos, dir, dist, blocked) {
  const d = DIRS[dir]; if (!d || !(dist > 0)) return { x: pos.x, y: pos.y };
  const hz = d[0] !== 0, s = hz ? d[0] : d[1];
  let a = hz ? pos.x : pos.y, b = hz ? pos.y : pos.x, rem = dist;
  const blk = hz ? (A, B) => blocked(A, B) : (A, B) => blocked(B, A);
  const ca = Math.round(a), cb = Math.round(b), off = b - cb;
  if (Math.abs(off) > 1e-6) {
    const sg = Math.sign(off), cb2 = cb + sg;
    if (blk(ca + s, cb) && Math.abs(off) > 0.3 && !blk(ca + s, cb2) && !blk(ca, cb2)) {
      const m = Math.min(rem, Math.abs(cb2 - b)); b += sg * m; rem = 0; // trượt vào góc
    } else { const m = Math.min(rem, Math.abs(off)); b -= sg * m; rem -= m; } // canh vào giữa làn
    if (Math.abs(b - Math.round(b)) < 1e-6) b = Math.round(b);
  }
  for (let k = 0; k < 20 && rem > 1e-9; k++) {
    const c = Math.round(a), ahead = (c - a) * s;
    if (ahead > 1e-9) { const m = Math.min(rem, ahead); a += m * s; rem -= m; continue; } // về tâm ô hiện tại
    if (Math.abs(b - Math.round(b)) > 1e-6) break;   // chưa thẳng làn
    if (blk(c + s, Math.round(b))) { if (ahead < -1e-9) a = c; break; }
    const m = Math.min(rem, 1 + ahead); a += m * s; rem -= m;
  }
  a = Math.round(a * 1000) / 1000; b = Math.round(b * 1000) / 1000;
  return hz ? { x: a, y: b } : { x: b, y: a };
}

/** Vị trí hợp lệ: thẳng hàng ít nhất một trục, hộp va chạm không chạm tường/gạch/bom (trừ bom mình được đi xuyên). */
export function fits(grid, bombs, me, x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
  if (Math.min(Math.abs(x - Math.round(x)), Math.abs(y - Math.round(y))) > 0.05) return false;
  const blocked = blocker(grid, bombs, me);
  for (const cx of new Set([Math.round(x - BOX), Math.round(x + BOX)]))
    for (const cy of new Set([Math.round(y - BOX), Math.round(y + BOX)])) if (blocked(cx, cy)) return false;
  return true;
}

const overlaps = (p, x, y) => Math.abs(p.x - x) < 0.95 && Math.abs(p.y - y) < 0.95;

// ---------------------------------------------------------------- ván chơi (chạy trên máy chủ)

export function createGame({ players, rand, now, rules }) {
  const R = { ...RULES, ...(rules || {}) };
  const g = {
    R, grid: makeGrid(rand), bombs: [], flames: new Map(), items: new Map(), pending: [],
    startAt: now + R.countdown, endAt: now + R.countdown + R.roundMs,
    over: false, winner: -1, draw: false, reason: "", bid: 0, ev: [],
    players: [],
  };
  for (let i = 0; i < players; i++) {
    const [x, y] = SPAWNS[i];
    g.players.push({ x, y, dir: "d", alive: true, bombs: R.baseBombs, range: R.baseRange, speed: R.baseSpeed,
      score: 0, kills: 0, bricks: 0, picks: 0, allow: 0, allowAt: now, diedAt: 0 });
  }
  return g;
}

const budgetCap = (p) => p.speed * 0.35 + 0.35;

/** Client gửi vị trí mới. Hợp lệ ⇒ nhận; sai ⇒ false (máy chủ gửi lại vị trí đúng cho client). */
export function tryMove(g, i, x, y, dir, now) {
  const p = g.players[i];
  if (!p || !p.alive || g.over || now < g.startAt) return false;
  p.allow = Math.min(budgetCap(p), p.allow + (Math.max(0, now - p.allowAt) / 1000) * p.speed * 1.25); p.allowAt = now;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
  const dist = Math.abs(x - p.x) + Math.abs(y - p.y);
  if (dist > p.allow + 1e-6) return false;
  if (!fits(g.grid, g.bombs, i, x, y)) return false;
  // mỗi lần chỉ được sang ô kề (không nhảy chéo qua góc tường)
  if (Math.abs(Math.round(p.x) - Math.round(x)) + Math.abs(Math.round(p.y) - Math.round(y)) > 1) return false;
  p.allow -= dist; p.x = x; p.y = y;
  if (DIRS[dir]) p.dir = dir;
  return true;
}

export function placeBomb(g, i, now) {
  const p = g.players[i];
  if (!p || !p.alive || g.over || now < g.startAt) return false;
  const x = Math.round(p.x), y = Math.round(p.y);
  if (g.bombs.some((b) => b.x === x && b.y === y)) return false;
  if (g.bombs.filter((b) => b.owner === i).length >= p.bombs) return false;
  const pass = g.players.map((q, k) => (q.alive && overlaps(q, x, y) ? k : -1)).filter((k) => k >= 0);
  g.bombs.push({ id: ++g.bid, x, y, owner: i, range: p.range, at: now + g.R.fuse, pass });
  g.ev.push({ k: "bomb", x, y });
  return true;
}

function explode(g, first, now, rand) {
  const queue = [first];
  g.bombs = g.bombs.filter((b) => b !== first);
  while (queue.length) {
    const b = queue.shift(), owner = g.players[b.owner];
    const fire = (x, y) => g.flames.set(idx(x, y), { until: now + g.R.flame, owner: b.owner });
    fire(b.x, b.y);
    g.ev.push({ k: "boom", x: b.x, y: b.y });
    for (const [dx, dy] of Object.values(DIRS)) {
      for (let k = 1; k <= b.range; k++) {
        const x = b.x + dx * k, y = b.y + dy * k, c = cell(g.grid, x, y);
        if (c === "#") break;
        if (c === "+") {
          g.grid[idx(x, y)] = "."; fire(x, y);
          if (owner) { owner.bricks++; owner.score += g.R.score.brick; }
          if (rand() < g.R.dropChance) g.pending.push({ i: idx(x, y), kind: ITEM_KINDS[Math.floor(rand() * 3) % 3], at: now + g.R.flame });
          break;
        }
        fire(x, y);
        g.items.delete(idx(x, y)); // vật phẩm trúng lửa thì cháy mất
        const hit = g.bombs.find((o) => o.x === x && o.y === y);
        if (hit) { g.bombs = g.bombs.filter((o) => o !== hit); queue.push(hit); break; } // nổ dây chuyền
      }
    }
  }
}

/** Một nhịp máy chủ (20 lần/giây). */
export function tick(g, now, rand) {
  if (g.over) return;
  for (;;) { const b = g.bombs.find((x) => x.at <= now); if (!b) break; explode(g, b, now, rand); } // bom tới giờ
  for (const [k, f] of g.flames) if (f.until <= now) g.flames.delete(k);                          // lửa tắt
  g.pending = g.pending.filter((it) => { if (it.at > now) return true; if (g.grid[it.i] === ".") g.items.set(it.i, it.kind); return false; });
  // người đã ra khỏi ô bom ⇒ hết được đi xuyên quả bom đó
  for (const b of g.bombs) b.pass = b.pass.filter((k) => g.players[k] && g.players[k].alive && overlaps(g.players[k], b.x, b.y));
  g.players.forEach((p, i) => { // trúng lửa
    if (!p.alive) return;
    const f = g.flames.get(idx(Math.round(p.x), Math.round(p.y)));
    if (!f) return;
    p.alive = false; p.diedAt = now;
    const killer = g.players[f.owner];
    if (killer && f.owner !== i) { killer.kills++; killer.score += g.R.score.kill; }
    g.ev.push({ k: "die", i, by: f.owner });
  });
  g.players.forEach((p, i) => { // nhặt vật phẩm
    if (!p.alive) return;
    const k = idx(Math.round(p.x), Math.round(p.y)), it = g.items.get(k);
    if (!it) return;
    g.items.delete(k); p.picks++; p.score += g.R.score.pick;
    if (it === "b") p.bombs = Math.min(g.R.maxBombs, p.bombs + 1);
    else if (it === "f") p.range = Math.min(g.R.maxRange, p.range + 1);
    else p.speed = Math.min(g.R.maxSpeed, Math.round((p.speed + g.R.speedStep) * 10) / 10);
    g.ev.push({ k: "pick", i, kind: it });
  });
  checkEnd(g, now);
}

/** Người rời ván giữa chừng ⇒ tính như bị loại. */
export function kill(g, i, now) {
  const p = g.players[i]; if (!p || !p.alive || g.over) return;
  p.alive = false; p.diedAt = now; g.ev.push({ k: "die", i, by: -1 });
  checkEnd(g, now);
}

function checkEnd(g, now) {
  if (g.over) return;
  const alive = g.players.map((p, i) => (p.alive ? i : -1)).filter((i) => i >= 0);
  if (alive.length <= 1) { g.over = true; g.reason = "last"; g.winner = alive.length ? alive[0] : -1; g.draw = !alive.length; return; }
  if (now >= g.endAt) { // hết giờ: người còn sống có điểm cao nhất thắng, bằng điểm thì hoà
    g.over = true; g.reason = "time";
    const top = Math.max(...alive.map((i) => g.players[i].score));
    const best = alive.filter((i) => g.players[i].score === top);
    if (best.length === 1) g.winner = best[0]; else { g.winner = -1; g.draw = true; }
  }
}
