// Bắn Bóng Khủng Long — luật chơi thuần (không DOM), chạy được bằng Node để test.
// Lưới lục giác: hàng chẵn-lệch (offset) — hàng lệch 0 có W ô, hàng lệch 1 có W-1 ô và dịch phải nửa ô.
// Đơn vị tọa độ: đường kính bóng = 1. Gốc (0,0) ở góc trên trái của sân.

export const W = 11;            // số ô của hàng không lệch
export const ROWS = 13;         // hàng 0..12; có bóng ở hàng 12 (vạch đỏ) là thua
export const LOSE_ROW = ROWS - 1;
export const RH = Math.sqrt(3) / 2; // khoảng cách 2 hàng
export const LX = W / 2;        // bệ phóng
export const LY = (ROWS - 1) * RH + 0.5 + 1.7;
export const FH = LY + 1.1;     // chiều cao sân
export const MIN_A = (9 * Math.PI) / 180, MAX_A = Math.PI - MIN_A; // góc bắn hợp lệ (rad, 90° = thẳng lên)
export const KINDS_MAX = 6;
export const NORMAL = 0, EGG = 1, STONE = 2, BOMB = 3; // loại ô
export const SHOT_BONUS = 50;   // mỗi viên còn dư khi qua màn
export const N = ROWS * W;

// Màn: kinds = số màu, rows = số hàng ban đầu, eggs = trứng cần cứu, stones = đá, bombs = bom, shots = số viên, push = bắn hụt bao nhiêu lần thì trần thêm 1 hàng (0 = không)
export const LEVELS = [
  { kinds: 3, rows: 5, eggs: 3, stones: 0, bombs: 0, shots: 20, push: 0 },
  { kinds: 3, rows: 6, eggs: 4, stones: 0, bombs: 1, shots: 20, push: 8 },
  { kinds: 4, rows: 6, eggs: 4, stones: 0, bombs: 1, shots: 22, push: 7 },
  { kinds: 4, rows: 7, eggs: 5, stones: 2, bombs: 1, shots: 26, push: 7 },
  { kinds: 4, rows: 7, eggs: 5, stones: 3, bombs: 2, shots: 26, push: 6 },
  { kinds: 5, rows: 7, eggs: 5, stones: 2, bombs: 1, shots: 30, push: 6 },
  { kinds: 5, rows: 8, eggs: 6, stones: 4, bombs: 2, shots: 32, push: 6 },
  { kinds: 5, rows: 8, eggs: 6, stones: 4, bombs: 2, shots: 32, push: 5 },
  { kinds: 5, rows: 9, eggs: 7, stones: 5, bombs: 2, shots: 34, push: 5 },
  { kinds: 6, rows: 8, eggs: 6, stones: 4, bombs: 2, shots: 38, push: 5 },
  { kinds: 6, rows: 9, eggs: 7, stones: 6, bombs: 3, shots: 40, push: 5 },
  { kinds: 6, rows: 9, eggs: 8, stones: 6, bombs: 3, shots: 42, push: 4 },
];
export const FREE = { kinds: 5, rows: 6, push: 5 };
export const STAR_SHOTS = [0.15, 0.35]; // tỉ lệ viên còn dư để được 2 / 3 sao

export function rngNext(st) {
  let t = (st.rng = (st.rng + 0x6d2b79f5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const rint = (s, n) => Math.floor(rngNext(s) * n);

// ---------- Hình học lưới ----------
export const R = (i) => (i / W) | 0, C = (i) => i % W;
export const off = (s, r) => (r + s.par) & 1;
export const rowLen = (s, r) => (off(s, r) ? W - 1 : W);
export const valid = (s, r, c) => r >= 0 && r < ROWS && c >= 0 && c < rowLen(s, r);
export function center(s, i) { const r = R(i), c = C(i); return [c + 0.5 + off(s, r) * 0.5, r * RH + 0.5]; }
export function neighbors(s, i) {
  const r = R(i), c = C(i), o = off(s, r), out = [];
  const add = (rr, cc) => { if (valid(s, rr, cc)) out.push(rr * W + cc); };
  add(r, c - 1); add(r, c + 1);
  const a = o ? c : c - 1, b = o ? c + 1 : c;
  add(r - 1, a); add(r - 1, b); add(r + 1, a); add(r + 1, b);
  return out;
}
const matchKind = (b) => (b && (b.t === NORMAL || b.t === EGG) ? b.k : -1);

// ---------- Tạo ván ----------
function tile(s, k, t = NORMAL) { return { id: s.nextId++, k, t }; }
function fillRow(s, r, kinds) {
  for (let c = 0; c < rowLen(s, r); c++) {
    const i = r * W + c;
    // gom cụm cùng màu: hay lấy màu của hàng xóm đã có
    const nb = neighbors(s, i).map((j) => matchKind(s.grid[j])).filter((k) => k >= 0);
    const k = nb.length && rngNext(s) < 0.42 ? nb[rint(s, nb.length)] : rint(s, kinds);
    s.grid[i] = tile(s, k);
  }
}
export function levelInfo(level) { return LEVELS[level - 1] || null; }
export function newGame({ mode = "level", level = 1, seed = 1 } = {}) {
  const L = mode === "free" ? null : levelInfo(level);
  if (mode !== "free" && !L) throw new Error("màn không tồn tại: " + level);
  const cfg = L || FREE;
  const s = {
    mode, level: L ? level : 0, kinds: cfg.kinds, push: cfg.push,
    shots: L ? L.shots : null, shotsMax: L ? L.shots : null, eggsTotal: L ? L.eggs : 0, eggsLeft: L ? L.eggs : 0,
    grid: new Array(N).fill(null), par: 0, nextId: 1, cur: 0, next: 0, score: 0, fired: 0, misses: 0,
    popped: 0, dropped: 0, bestChain: 0, time: 0, status: "playing", rng: seed | 0, bonus: 0, stars: 0, refills: 0,
  };
  for (let r = 0; r < cfg.rows; r++) fillRow(s, r, cfg.kinds);
  if (L) {
    // đặt trứng / đá / bom vào các ô khác nhau (trứng ưu tiên nửa trên, đá không ở hàng cuối cùng để không chặn đường bắn)
    const pick = (lo, hi, pred = () => true) => {
      for (let g = 0; g < 400; g++) { const r = lo + rint(s, hi - lo), c = rint(s, rowLen(s, r)), i = r * W + c; if (s.grid[i] && s.grid[i].t === NORMAL && pred(i)) return i; }
      for (let i = 0; i < N; i++) if (s.grid[i] && s.grid[i].t === NORMAL && R(i) >= lo && R(i) < hi && pred(i)) return i;
      return -1;
    };
    for (let e = 0; e < L.eggs; e++) { const i = pick(0, Math.max(2, Math.ceil(L.rows * 0.5))); s.grid[i].t = EGG; }
    for (let e = 0; e < L.stones; e++) { const i = pick(1, L.rows - 1, (j) => !neighbors(s, j).some((n) => s.grid[n] && s.grid[n].t === STONE)); if (i >= 0) { s.grid[i].t = STONE; s.grid[i].k = -1; } }
    for (let e = 0; e < L.bombs; e++) { const i = pick(1, L.rows, (j) => !neighbors(s, j).some((n) => s.grid[n] && s.grid[n].t === BOMB)); if (i >= 0) { s.grid[i].t = BOMB; s.grid[i].k = -1; } }
  }
  s.cur = drawKind(s); s.next = drawKind(s);
  return s;
}
// màu cho viên kế tiếp: chỉ chọn màu còn trên bàn (để không có viên "chết")
export function presentKinds(s) { const set = new Set(); for (const b of s.grid) { const k = matchKind(b); if (k >= 0) set.add(k); } return [...set].sort((a, b) => a - b); }
function drawKind(s) { const ks = presentKinds(s); return ks.length ? ks[rint(s, ks.length)] : rint(s, s.kinds); }

// ---------- Đường bay ----------
export const clampAngle = (a) => Math.min(MAX_A, Math.max(MIN_A, a));
// Trả về { path: [[x,y], ...] (điểm đầu, các điểm nảy tường, điểm cuối = tâm ô dính vào), at }
export function trace(s, a) {
  a = clampAngle(a);
  let x = LX, y = LY, dx = Math.cos(a), dy = -Math.sin(a);
  const path = [[x, y]], STEP = 0.05, HIT2 = 0.8 * 0.8;
  for (let n = 0; n < 4000; n++) {
    x += dx * STEP; y += dy * STEP;
    if (x < 0.5) { x = 1 - x; dx = -dx; path.push([0.5, y]); }
    else if (x > W - 0.5) { x = 2 * (W - 0.5) - x; dx = -dx; path.push([W - 0.5, y]); }
    let hit = y <= 0.5;
    if (!hit) {
      const rr = Math.round((y - 0.5) / RH);
      for (let r = rr - 1; r <= rr + 1 && !hit; r++) {
        if (r < 0 || r >= ROWS) continue;
        for (let c = 0; c < rowLen(s, r); c++) {
          const i = r * W + c; if (!s.grid[i]) continue;
          const [cx, cy] = center(s, i);
          if ((cx - x) ** 2 + (cy - y) ** 2 < HIT2) { hit = true; break; }
        }
      }
    }
    if (hit) { const at = snap(s, x, Math.max(0.5, y)); path.push(center(s, at)); return { path, at }; }
  }
  // không chạm gì (không thể xảy ra vì luôn có trần) — dính trần gần nhất
  const at = snap(s, x, 0.5); path.push(center(s, at)); return { path, at };
}
function snap(s, x, y) {
  const rr = Math.round((y - 0.5) / RH);
  for (let span = 1; span <= ROWS; span++) {
    let best = -1, bd = Infinity;
    for (let r = rr - span; r <= rr + span; r++) {
      if (r < 0 || r >= ROWS) continue;
      for (let c = 0; c < rowLen(s, r); c++) {
        const i = r * W + c; if (s.grid[i]) continue;
        if (r > 0 && !neighbors(s, i).some((j) => s.grid[j])) continue;
        const [cx, cy] = center(s, i), d = (cx - x) ** 2 + (cy - y) ** 2;
        if (d < bd) { bd = d; best = i; }
      }
    }
    if (best >= 0) return best;
  }
  return 0;
}

// ---------- Bắn ----------
function connectedToTop(s) {
  const seen = new Uint8Array(N), q = [];
  for (let c = 0; c < rowLen(s, 0); c++) if (s.grid[c]) { seen[c] = 1; q.push(c); }
  while (q.length) { const i = q.pop(); for (const j of neighbors(s, i)) if (!seen[j] && s.grid[j]) { seen[j] = 1; q.push(j); } }
  return seen;
}
export function bubbles(s) { let n = 0; for (const b of s.grid) if (b) n++; return n; }
export function lowestRow(s) { for (let r = ROWS - 1; r >= 0; r--) for (let c = 0; c < rowLen(s, r); c++) if (s.grid[r * W + c]) return r; return -1; }
function pushRow(s) {
  const g = new Array(N).fill(null);
  for (let i = 0; i < N - W; i++) g[i + W] = s.grid[i];
  s.grid = g; s.par ^= 1;
  const row = [];
  for (let c = 0; c < rowLen(s, 0); c++) { const ks = presentKinds(s); const k = ks.length ? ks[rint(s, ks.length)] : rint(s, s.kinds); s.grid[c] = tile(s, k); row.push({ at: c, id: s.grid[c].id, k }); }
  return row;
}
const info = (s, i) => ({ at: i, id: s.grid[i].id, k: s.grid[i].k, t: s.grid[i].t });

// Kết quả: { a, path, at, k, popped:[{at,id,k,t}], dropped:[...], bombs:[at], eggs, pts, pushed:null|[{at,id,k}], refill:null|[...], status, bonus }
export function shoot(s, a) {
  if (s.status !== "playing") return null;
  const { path, at } = trace(s, a);
  const k = s.cur;
  s.grid[at] = tile(s, k);
  const shotId = s.grid[at].id;
  s.fired++;
  if (s.shots !== null) s.shots--;
  const clear = new Set(), bombs = [];
  // 1) bom: viên bắn chạm bom → bom nổ cả vùng xung quanh (dây chuyền sang bom khác)
  const q = neighbors(s, at).filter((j) => s.grid[j] && s.grid[j].t === BOMB);
  if (q.length) {
    clear.add(at);
    while (q.length) {
      const b = q.pop(); if (bombs.includes(b)) continue;
      bombs.push(b); clear.add(b);
      for (const j of neighbors(s, b)) if (s.grid[j]) { clear.add(j); if (s.grid[j].t === BOMB && !bombs.includes(j)) q.push(j); }
    }
  } else {
    // 2) nhóm cùng màu ≥ 3
    const grp = [at], seen = new Set([at]);
    for (let n = 0; n < grp.length; n++) for (const j of neighbors(s, grp[n])) if (!seen.has(j) && matchKind(s.grid[j]) === k) { seen.add(j); grp.push(j); }
    if (grp.length >= 3) for (const i of grp) clear.add(i);
  }
  const popped = [...clear].map((i) => info(s, i));
  for (const i of clear) s.grid[i] = null;
  // 3) bóng lơ lửng (không còn nối lên trần) rơi xuống
  const dropped = [];
  if (clear.size) {
    const top = connectedToTop(s);
    for (let i = 0; i < N; i++) if (s.grid[i] && !top[i]) { dropped.push(info(s, i)); s.grid[i] = null; }
  }
  const eggs = popped.concat(dropped).filter((b) => b.t === EGG).length;
  s.eggsLeft = Math.max(0, s.eggsLeft - eggs);
  const pts = popped.length * 10 + dropped.length * 20 + (dropped.length >= 6 ? dropped.length * 10 : 0) + eggs * 100 + bombs.length * 50;
  s.score += pts; s.popped += popped.length; s.dropped += dropped.length;
  s.bestChain = Math.max(s.bestChain, popped.length + dropped.length);
  // 4) bắn hụt nhiều lần → trần thêm 1 hàng
  let pushed = null;
  if (clear.size) s.misses = 0;
  else if (s.push) { s.misses++; if (s.misses >= s.push) { s.misses = 0; pushed = pushRow(s); } }
  // 5) Tự do: dọn sạch bàn thì thưởng + bàn mới
  let refill = null, bonus = 0;
  if (s.mode === "free" && !bubbles(s)) {
    bonus = 500; s.score += bonus; s.refills++;
    for (let r = 0; r < FREE.rows; r++) fillRow(s, r, s.kinds);
    refill = []; for (let i = 0; i < N; i++) if (s.grid[i]) refill.push(info(s, i));
  }
  // 6) thắng / thua
  const res = { a: clampAngle(a), path, at, k, shotId, popped, dropped, bombs, eggs, pts, pushed, refill, bonus, status: "playing" };
  if (s.mode === "level" && (s.eggsLeft <= 0 || !bubbles(s))) {
    s.status = "won"; s.bonus = s.shots * SHOT_BONUS; s.score += s.bonus; res.bonus = s.bonus;
    const ratio = s.shots / s.shotsMax; s.stars = 1 + (ratio >= STAR_SHOTS[0] ? 1 : 0) + (ratio >= STAR_SHOTS[1] ? 1 : 0);
  } else if (lowestRow(s) >= LOSE_ROW) { s.status = "lost"; res.reason = "line"; }
  else if (s.shots !== null && s.shots <= 0) { s.status = "lost"; res.reason = "shots"; }
  // 7) viên kế tiếp
  if (s.status === "playing") {
    const ks = presentKinds(s);
    s.cur = ks.includes(s.next) || !ks.length ? s.next : ks[rint(s, ks.length)];
    s.next = drawKind(s);
  }
  res.status = s.status; res.cur = s.cur; res.next = s.next;
  return res;
}
export function swapBalls(s) { if (s.status !== "playing") return false; [s.cur, s.next] = [s.next, s.cur]; return true; }

// Tìm góc bắn tốt (gợi ý / bot / test): thử nhiều góc, chấm điểm theo trứng cứu được, số bóng rơi, số bóng nổ
export function evaluate(s, a) {
  const t = clone(s); const r = shoot(t, a);
  // hòa điểm thì ưu tiên chỗ dính cạnh bóng cùng màu (chuẩn bị nổ ở lượt sau)
  const same = r.popped.length ? 0 : neighbors(t, r.at).filter((j) => matchKind(t.grid[j]) === r.k).length;
  const eggNear = r.popped.length ? 0 : neighbors(t, r.at).filter((j) => t.grid[j] && t.grid[j].t === EGG && t.grid[j].k === r.k).length;
  return { r, score: same * 4 + eggNear * 6 + r.eggs * 1000 + r.dropped.length * 30 + r.popped.length * 10 + r.bombs.length * 40 - (r.pushed ? 60 : 0) + (t.status === "won" ? 1e5 : 0) - (t.status === "lost" ? 1e5 : 0) - R(r.at) * 0.5 };
}
export function bestShot(s, steps = 90) {
  let best = null;
  for (let n = 0; n <= steps; n++) {
    const a = MIN_A + (MAX_A - MIN_A) * (n / steps);
    const e = evaluate(s, a);
    if (!best || e.score > best.score) best = { a, score: e.score, at: e.r.at, pop: e.r.popped.length + e.r.dropped.length };
  }
  return best;
}
export function clone(s) { return { ...s, grid: s.grid.map((b) => (b ? { ...b } : null)) }; }

// ---------- Lưu / nạp ----------
export function serialize(s) {
  return {
    v: 1, mode: s.mode, level: s.level, par: s.par,
    grid: s.grid.map((b) => (b ? [b.k, b.t] : 0)),
    cur: s.cur, next: s.next, shots: s.shots, eggsLeft: s.eggsLeft, score: s.score, fired: s.fired, misses: s.misses,
    popped: s.popped, dropped: s.dropped, bestChain: s.bestChain, refills: s.refills, time: Math.round(s.time * 10) / 10, status: s.status, rng: s.rng,
  };
}
const int = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
export function deserialize(d) {
  try {
    if (!d || d.v !== 1 || d.status !== "playing" || !Array.isArray(d.grid) || d.grid.length !== N) return null;
    let s;
    if (d.mode === "free") s = newGame({ mode: "free", seed: 1 });
    else if (d.mode === "level" && levelInfo(d.level)) s = newGame({ mode: "level", level: d.level, seed: 1 });
    else return null;
    if (!int(d.par, 0, 1)) return null;
    s.par = d.par; s.nextId = 1;
    let eggs = 0;
    s.grid = d.grid.map((v, i) => {
      if (v === 0) return null;
      if (!Array.isArray(v) || !valid(s, R(i), C(i))) throw new Error("ô hỏng");
      const [k, t] = v;
      if (!int(t, 0, 3)) throw new Error("loại hỏng");
      if (t === NORMAL || t === EGG) { if (!int(k, 0, s.kinds - 1)) throw new Error("màu hỏng"); }
      else if (k !== -1) throw new Error("màu hỏng");
      if (t === EGG) eggs++;
      return tile(s, k, t);
    });
    if (!bubbles(s) || lowestRow(s) >= LOSE_ROW) return null;
    // không có bóng lơ lửng
    const top = connectedToTop(s);
    for (let i = 0; i < N; i++) if (s.grid[i] && !top[i]) return null;
    if (!int(d.cur, 0, s.kinds - 1) || !int(d.next, 0, s.kinds - 1)) return null;
    s.cur = d.cur; s.next = d.next;
    if (s.mode === "level") {
      if (!int(d.shots, 1, s.shotsMax) || !int(d.eggsLeft, 1, s.eggsTotal) || d.eggsLeft !== eggs) return null;
      s.shots = d.shots; s.eggsLeft = d.eggsLeft;
    }
    for (const key of ["score", "fired", "popped", "dropped", "bestChain", "refills"]) { if (!int(d[key] ?? 0, 0, 1e9)) return null; s[key] = d[key] ?? 0; }
    if (!int(d.misses, 0, Math.max(0, s.push - 1))) return null;
    s.misses = d.misses;
    s.time = typeof d.time === "number" && d.time >= 0 && d.time < 1e7 ? d.time : 0;
    s.rng = d.rng | 0;
    return s;
  } catch { return null; }
}

// Dùng cho test: dựng bàn từ chuỗi các hàng (par = 0). "." trống, "0"-"5" màu, "a"-"f" trứng màu 0-5, "#" đá, "*" bom.
export function gridFrom(s, rows, { cur, next } = {}) {
  s.grid = new Array(N).fill(null); s.par = 0; s.nextId = 1;
  rows.forEach((row, r) => {
    [...row].forEach((ch, c) => {
      if (!valid(s, r, c) || ch === "." || ch === " ") return;
      const i = r * W + c;
      if (ch >= "0" && ch <= "5") s.grid[i] = tile(s, +ch);
      else if (ch >= "a" && ch <= "f") s.grid[i] = tile(s, ch.charCodeAt(0) - 97, EGG);
      else if (ch === "#") s.grid[i] = tile(s, -1, STONE);
      else if (ch === "*") s.grid[i] = tile(s, -1, BOMB);
    });
  });
  s.eggsLeft = s.grid.filter((b) => b && b.t === EGG).length; s.eggsTotal = Math.max(s.eggsTotal, s.eggsLeft);
  if (cur !== undefined) s.cur = cur;
  if (next !== undefined) s.next = next;
  return s;
}
// Góc bắn để viên bay thẳng (không nảy) tới điểm (x, y)
export const angleTo = (x, y) => Math.atan2(LY - y, x - LX);
