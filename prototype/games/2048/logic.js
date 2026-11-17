// 2048 — luật thuần (không đụng DOM). Bàn n×n, mỗi ô là null hoặc { id, v }.
// Mọi ngẫu nhiên đi qua s.rng (mulberry32, lưu được) để ván chơi tái lập được và hoàn tác không "đổ lại xúc xắc".

export const SIZES = [3, 4, 5];
export const GOALS = { 3: 256, 4: 2048, 5: 4096 };
export const UNDOS = 3;            // số lần hoàn tác mỗi ván
export const HISTORY = 3;          // giữ tối đa 3 bước để hoàn tác liên tiếp
export const DIRS = ["left", "right", "up", "down"];

function rand(s) {
  // mulberry32, trạng thái là số nguyên 32-bit trong s.rng
  let t = (s.rng = (s.rng + 0x6d2b79f5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function newGame({ size = 4, seed = 1 } = {}) {
  if (!SIZES.includes(size)) size = 4;
  const s = {
    size, goal: GOALS[size], cells: new Array(size * size).fill(null),
    score: 0, moves: 0, merges: 0, nextId: 1, rng: seed | 0,
    status: "playing", won: false, undoLeft: UNDOS, history: [], time: 0, maxTile: 0,
  };
  spawn(s); spawn(s);
  s.maxTile = maxTile(s);
  return s;
}

export function empties(s) {
  const out = [];
  for (let i = 0; i < s.cells.length; i++) if (!s.cells[i]) out.push(i);
  return out;
}

export function spawn(s) {
  const e = empties(s);
  if (!e.length) return null;
  const at = e[Math.floor(rand(s) * e.length)];
  const v = rand(s) < 0.9 ? 2 : 4;
  const t = { id: s.nextId++, v };
  s.cells[at] = t;
  return { id: t.id, v, at };
}

export function maxTile(s) {
  let m = 0;
  for (const c of s.cells) if (c && c.v > m) m = c.v;
  return m;
}

// Thứ tự ô của từng hàng/cột, bắt đầu từ mép mà ô trượt về.
export function lines(size, dir) {
  const out = [];
  for (let a = 0; a < size; a++) {
    const line = [];
    for (let b = 0; b < size; b++) {
      let x, y;
      if (dir === "left") { x = b; y = a; }
      else if (dir === "right") { x = size - 1 - b; y = a; }
      else if (dir === "up") { x = a; y = b; }
      else { x = a; y = size - 1 - b; }
      line.push(y * size + x);
    }
    out.push(line);
  }
  return out;
}

export function canMove(s) {
  const n = s.size;
  for (let i = 0; i < s.cells.length; i++) {
    const c = s.cells[i];
    if (!c) return true;
    const x = i % n;
    if (x < n - 1 && s.cells[i + 1] && s.cells[i + 1].v === c.v) return true;
    if (i + n < s.cells.length && s.cells[i + n] && s.cells[i + n].v === c.v) return true;
  }
  return false;
}

function snapshot(s) {
  return {
    cells: s.cells.map((c) => (c ? { id: c.id, v: c.v } : null)),
    score: s.score, moves: s.moves, merges: s.merges, nextId: s.nextId, rng: s.rng,
    status: s.status, won: s.won, maxTile: s.maxTile,
  };
}

// Trượt theo hướng dir. Trả về null nếu không có gì thay đổi (không tính là 1 nước).
// Kết quả: { gained, moves:[{id,to}], merges:[{id,v,at,from:[a,b]}], spawned, reachedGoal, over }
export function move(s, dir) {
  if (s.status !== "playing" || !DIRS.includes(dir)) return null;
  const before = snapshot(s);
  const next = new Array(s.cells.length).fill(null);
  const moves = [], merges = [];
  let gained = 0, changed = false;
  for (const line of lines(s.size, dir)) {
    let w = 0, lastFree = null; // lastFree: ô vừa đặt ở vị trí w-1 còn gộp được
    for (const idx of line) {
      const t = s.cells[idx];
      if (!t) continue;
      if (lastFree && lastFree.v === t.v) {
        const at = line[w - 1];
        const nt = { id: s.nextId++, v: t.v * 2 };
        moves.push({ id: t.id, to: at });
        merges.push({ id: nt.id, v: nt.v, at, from: [lastFree.id, t.id] });
        next[at] = nt;
        gained += nt.v;
        lastFree = null;
        changed = true;
      } else {
        const at = line[w++];
        next[at] = t;
        moves.push({ id: t.id, to: at });
        if (at !== idx) changed = true;
        lastFree = t;
      }
    }
  }
  if (!changed) { s.nextId = before.nextId; return null; }
  s.history.push(before);
  if (s.history.length > HISTORY) s.history.shift();
  s.cells = next;
  s.score += gained;
  s.moves++;
  s.merges += merges.length;
  const spawned = spawn(s);
  s.maxTile = maxTile(s);
  let reachedGoal = false;
  if (!s.won && s.maxTile >= s.goal) { s.won = true; s.status = "won"; reachedGoal = true; }
  const over = !reachedGoal && !canMove(s);
  if (over) s.status = "over";
  return { dir, gained, moves, merges, spawned, reachedGoal, over };
}

// Sau khi đạt mục tiêu: chơi tiếp để lên ô lớn hơn.
export function keepGoing(s) {
  if (s.status !== "won") return false;
  s.status = canMove(s) ? "playing" : "over";
  return true;
}

export function canUndo(s) {
  return s.undoLeft > 0 && s.history.length > 0 && s.status !== "won";
}

export function undo(s) {
  if (!canUndo(s)) return false;
  const b = s.history.pop();
  s.cells = b.cells; s.score = b.score; s.moves = b.moves; s.merges = b.merges;
  s.nextId = Math.max(s.nextId, b.nextId); // id mới luôn tăng để phần vẽ không nhầm ô
  s.rng = b.rng; s.won = b.won; s.maxTile = b.maxTile;
  s.status = b.status === "won" ? "playing" : b.status;
  s.undoLeft--;
  return true;
}

// Lưu / nạp ván đang chơi (localStorage). Trả về null nếu dữ liệu hỏng.
export function serialize(s) {
  return {
    size: s.size, cells: s.cells.map((c) => (c ? c.v : 0)), score: s.score, moves: s.moves, merges: s.merges,
    rng: s.rng, status: s.status, won: s.won, undoLeft: s.undoLeft, time: Math.round(s.time),
  };
}

export function deserialize(d) {
  if (!d || typeof d !== "object" || !SIZES.includes(d.size)) return null;
  const n = d.size;
  if (!Array.isArray(d.cells) || d.cells.length !== n * n) return null;
  const s = newGame({ size: n, seed: 1 });
  let id = 1;
  for (let i = 0; i < n * n; i++) {
    const v = d.cells[i] | 0;
    if (v && (v < 2 || (v & (v - 1)) !== 0)) return null;
    s.cells[i] = v ? { id: id++, v } : null;
  }
  s.nextId = id;
  s.score = Math.max(0, d.score | 0); s.moves = Math.max(0, d.moves | 0); s.merges = Math.max(0, d.merges | 0);
  s.rng = d.rng | 0; s.won = !!d.won; s.undoLeft = Math.max(0, Math.min(UNDOS, d.undoLeft | 0));
  s.time = Math.max(0, Number(d.time) || 0); s.history = [];
  s.maxTile = maxTile(s);
  s.status = d.status === "won" ? "won" : canMove(s) ? "playing" : "over";
  if (empties(s).length === n * n) return null;
  return s;
}
