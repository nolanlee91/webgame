// Ghép Kẹo — luật match-3 thuần (không đụng DOM), chạy được bằng Node để test.
// Bàn 8×8, ô đánh số 0..63 theo hàng. Mỗi ô: { id, k (loại kẹo 0..5, STAR = 6), sp (0 | "h" | "v" | "b") }.
//  - Khớp 4 thẳng hàng  → kẹo sọc ("h" xóa cả hàng nếu khớp ngang, "v" xóa cả cột nếu khớp dọc)
//  - Khớp hình chữ L / T → kẹo bom ("b" nổ vùng 3×3)
//  - Khớp 5 thẳng hàng  → kẹo sao (STAR, đổi với kẹo nào thì xóa hết loại đó trên bàn)
export const W = 8, H = 8, N = W * H;
export const STAR = 6;
export const KINDS_MAX = 6;
export const SPECIALS = [0, "h", "v", "b"];

// Màn chơi: số kẹo khác nhau, số bước, điểm mục tiêu, mục tiêu thu thập [loại, số lượng].
export const LEVELS = [
  { kinds: 5, moves: 20, target: 1200 },
  { kinds: 5, moves: 18, target: 1800, collect: [[0, 14]] },
  { kinds: 5, moves: 18, target: 2200 },
  { kinds: 5, moves: 18, target: 2000, collect: [[2, 18], [4, 18]] },
  { kinds: 6, moves: 24, target: 1900 },
  { kinds: 6, moves: 24, target: 2000, collect: [[1, 18]] },
  { kinds: 6, moves: 25, target: 2300, collect: [[3, 16], [5, 16]] },
  { kinds: 6, moves: 25, target: 2700 },
  { kinds: 6, moves: 26, target: 2600, collect: [[0, 18], [2, 18], [4, 18]] },
  { kinds: 6, moves: 23, target: 2700 },
  { kinds: 6, moves: 24, target: 2600, collect: [[1, 22], [5, 22]] },
  { kinds: 6, moves: 24, target: 3000, collect: [[0, 18], [3, 18], [4, 18]] },
];
export const FREE_KINDS = 6;
export const BONUS_PER_MOVE = 60; // mỗi bước còn dư khi qua màn
export const STAR_RATIO = [1, 1.35, 1.7]; // ngưỡng 1/2/3 sao theo điểm mục tiêu

export const X = (i) => i % W, Y = (i) => (i / W) | 0;
export function adjacent(a, b) { return a >= 0 && b >= 0 && a < N && b < N && ((Y(a) === Y(b) && Math.abs(a - b) === 1) || Math.abs(a - b) === W); }

export function rngNext(st) {
  let t = (st.rng = (st.rng + 0x6d2b79f5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const randKind = (s) => Math.floor(rngNext(s) * s.kinds);

// ---------- Tìm hàng khớp ----------
const matchable = (c) => c && c.k !== STAR;
// Trả về các nhóm: { cells: number[], kind, runs: [{dir, cells}] }
export function findGroups(cells) {
  const runs = [];
  for (let y = 0; y < H; y++) {
    let x = 0;
    while (x < W) {
      const c = cells[y * W + x];
      let e = x + 1;
      if (matchable(c)) while (e < W && matchable(cells[y * W + e]) && cells[y * W + e].k === c.k) e++;
      if (matchable(c) && e - x >= 3) runs.push({ dir: "h", cells: Array.from({ length: e - x }, (_, j) => y * W + x + j) });
      x = e;
    }
  }
  for (let x = 0; x < W; x++) {
    let y = 0;
    while (y < H) {
      const c = cells[y * W + x];
      let e = y + 1;
      if (matchable(c)) while (e < H && matchable(cells[e * W + x]) && cells[e * W + x].k === c.k) e++;
      if (matchable(c) && e - y >= 3) runs.push({ dir: "v", cells: Array.from({ length: e - y }, (_, j) => (y + j) * W + x) });
      y = e;
    }
  }
  // gộp các đoạn chạm nhau (chung ô) thành một nhóm
  const owner = new Map(), groups = [];
  for (const r of runs) {
    const hit = new Set();
    for (const i of r.cells) if (owner.has(i)) hit.add(owner.get(i));
    let g;
    if (!hit.size) { g = { cells: new Set(), kind: cells[r.cells[0]].k, runs: [] }; groups.push(g); }
    else {
      const list = [...hit]; g = list[0];
      for (const o of list.slice(1)) { for (const i of o.cells) { g.cells.add(i); owner.set(i, g); } g.runs.push(...o.runs); groups.splice(groups.indexOf(o), 1); }
    }
    g.runs.push(r);
    for (const i of r.cells) { g.cells.add(i); owner.set(i, g); }
  }
  return groups.map((g) => ({ cells: [...g.cells].sort((a, b) => a - b), kind: g.kind, runs: g.runs }));
}

// Kẹo đặc biệt sinh ra từ một nhóm + vị trí đặt
export function specialFor(g, pref = []) {
  const maxLen = Math.max(...g.runs.map((r) => r.cells.length));
  const hasH = g.runs.some((r) => r.dir === "h"), hasV = g.runs.some((r) => r.dir === "v");
  let make = null;
  if (maxLen >= 5) make = { k: STAR, sp: 0 };
  else if (hasH && hasV) make = { k: g.kind, sp: "b" };
  else if (maxLen === 4) make = { k: g.kind, sp: g.runs[0].dir === "h" ? "h" : "v" };
  if (!make) return null;
  let at = pref.find((p) => g.cells.includes(p));
  if (at === undefined) {
    if (make.sp === "b") {
      const h = g.runs.filter((r) => r.dir === "h").flatMap((r) => r.cells);
      at = g.runs.filter((r) => r.dir === "v").flatMap((r) => r.cells).find((i) => h.includes(i));
    }
    if (at === undefined) { const long = g.runs.reduce((a, r) => (r.cells.length > a.cells.length ? r : a)); at = long.cells[(long.cells.length - 1) >> 1]; }
  }
  return { ...make, at };
}

// Có hàng khớp đi qua ô i không (dùng khi kiểm tra nước đi)
function lineAt(cells, i) {
  const c = cells[i];
  if (!matchable(c)) return false;
  const x = X(i), y = Y(i), same = (j) => matchable(cells[j]) && cells[j].k === c.k;
  let h = 1; for (let k = x - 1; k >= 0 && same(y * W + k); k--) h++; for (let k = x + 1; k < W && same(y * W + k); k++) h++;
  if (h >= 3) return true;
  let v = 1; for (let k = y - 1; k >= 0 && same(k * W + x); k--) v++; for (let k = y + 1; k < H && same(k * W + x); k++) v++;
  return v >= 3;
}
const isSpecial = (c) => c && (c.k === STAR || c.sp);
// Đổi 2 ô này có hợp lệ không (tạo hàng khớp, hoặc có kẹo sao, hoặc 2 kẹo đặc biệt)
export function validSwap(cells, a, b) {
  if (!adjacent(a, b) || !cells[a] || !cells[b]) return false;
  if (cells[a].k === STAR || cells[b].k === STAR) return true;
  if (cells[a].sp && cells[b].sp) return true;
  if (cells[a].k === cells[b].k) return false;
  [cells[a], cells[b]] = [cells[b], cells[a]];
  const ok = lineAt(cells, a) || lineAt(cells, b);
  [cells[a], cells[b]] = [cells[b], cells[a]];
  return ok;
}
// Tìm một nước đi hợp lệ (cho gợi ý / phát hiện bế tắc). Ưu tiên nước tạo nhóm dài hơn.
export function findMove(cells) {
  let best = null, bestScore = -1;
  for (let i = 0; i < N; i++) for (const j of [X(i) < W - 1 ? i + 1 : -1, Y(i) < H - 1 ? i + W : -1]) {
    if (j < 0 || !validSwap(cells, i, j)) continue;
    let sc = isSpecial(cells[i]) || isSpecial(cells[j]) ? 10 : 0;
    if (!sc) {
      [cells[i], cells[j]] = [cells[j], cells[i]];
      sc = findGroups(cells).reduce((a, g) => a + g.cells.length, 0);
      [cells[i], cells[j]] = [cells[j], cells[i]];
    }
    if (sc > bestScore) { bestScore = sc; best = [i, j]; }
  }
  return best;
}
export const hasMove = (cells) => {
  for (let i = 0; i < N; i++) {
    if (X(i) < W - 1 && validSwap(cells, i, i + 1)) return true;
    if (Y(i) < H - 1 && validSwap(cells, i, i + W)) return true;
  }
  return false;
};

// ---------- Tạo ván ----------
function newTile(s, k, sp = 0) { return { id: s.nextId++, k, sp }; }
function fillStable(s) {
  for (let tries = 0; tries < 200; tries++) {
    for (let i = 0; i < N; i++) {
      let k, guard = 0;
      do {
        k = randKind(s);
        guard++;
      } while (guard < 50 && ((X(i) >= 2 && s.cells[i - 1].k === k && s.cells[i - 2].k === k) || (Y(i) >= 2 && s.cells[i - W].k === k && s.cells[i - 2 * W].k === k)));
      s.cells[i] = newTile(s, k);
    }
    if (!findGroups(s.cells).length && hasMove(s.cells)) return;
  }
}
export function levelInfo(level) { return LEVELS[level - 1] || null; }
export function newGame({ mode = "level", level = 1, seed = 1 } = {}) {
  const L = mode === "free" ? null : levelInfo(level);
  if (mode !== "free" && !L) throw new Error("màn không tồn tại: " + level);
  const s = {
    mode, level: mode === "free" ? 0 : level, kinds: L ? L.kinds : FREE_KINDS,
    target: L ? L.target : 0, movesLeft: L ? L.moves : null, movesMax: L ? L.moves : null,
    goals: L && L.collect ? L.collect.map(([k, n]) => ({ k, n, left: n })) : [],
    cells: new Array(N).fill(null), nextId: 1, score: 0, moves: 0, time: 0,
    status: "playing", rng: seed | 0, cleared: 0, maxCombo: 0, specials: 0, shuffles: 0, bonus: 0, stars: 0,
  };
  fillStable(s);
  return s;
}

// ---------- Nổ + rơi ----------
function blastArea(i, sp, radius = 1) {
  const out = [], x = X(i), y = Y(i);
  if (sp === "h") for (let k = 0; k < W; k++) out.push(y * W + k);
  else if (sp === "v") for (let k = 0; k < H; k++) out.push(k * W + x);
  else if (sp === "b") for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && xx < W && yy >= 0 && yy < H) out.push(yy * W + xx); }
  return out;
}
function mostCommonKind(cells, s) {
  const cnt = new Array(s.kinds).fill(0);
  for (const c of cells) if (matchable(c) && c.k < s.kinds) cnt[c.k]++;
  let best = 0; for (let k = 1; k < cnt.length; k++) if (cnt[k] > cnt[best]) best = k;
  return best;
}
// Lan truyền kích hoạt kẹo đặc biệt trong tập ô bị xóa. Trả về danh sách hiệu ứng để vẽ.
function propagate(s, clear, done, fx) {
  const queue = [...clear];
  while (queue.length) {
    const i = queue.shift();
    const c = s.cells[i];
    if (!c || done.has(i)) continue;
    let area = null;
    if (c.sp) { area = blastArea(i, c.sp); fx.push({ type: c.sp, at: i }); }
    else if (c.k === STAR) { const k = mostCommonKind(s.cells, s); area = []; s.cells.forEach((d, j) => { if (d && d.k === k) area.push(j); }); fx.push({ type: "star", at: i, k }); }
    done.add(i);
    if (area) for (const j of area) if (s.cells[j] && !clear.has(j)) { clear.add(j); queue.push(j); }
  }
}
function gravity(s) {
  const falls = [], spawns = [];
  for (let x = 0; x < W; x++) {
    let wp = H - 1;
    for (let y = H - 1; y >= 0; y--) {
      const i = y * W + x, c = s.cells[i];
      if (!c) continue;
      if (y !== wp) { s.cells[wp * W + x] = c; s.cells[i] = null; falls.push({ id: c.id, from: i, to: wp * W + x }); }
      wp--;
    }
    const n = wp + 1;
    for (let y = wp; y >= 0; y--) { const t = newTile(s, randKind(s)); s.cells[y * W + x] = t; spawns.push({ id: t.id, at: y * W + x, k: t.k, drop: n }); }
  }
  return { falls, spawns };
}
// Một vòng nổ: xóa tập `clear`, đặt kẹo đặc biệt mới, tính điểm, rơi + sinh ô.
function runRound(s, clear, creates, round, extraPts, fx) {
  const done = new Set();
  propagate(s, clear, done, fx);
  const removed = [];
  for (const i of clear) { const c = s.cells[i]; if (c) { removed.push({ at: i, id: c.id, k: c.k, sp: c.sp }); s.cells[i] = null; } }
  for (const r of removed) { const g = s.goals.find((g) => g.k === r.k); if (g && g.left > 0) g.left--; }
  const made = [];
  for (const m of creates) { const t = newTile(s, m.k, m.sp); s.cells[m.at] = t; made.push({ at: m.at, id: t.id, k: t.k, sp: t.sp }); s.specials++; }
  const pts = (removed.length * 10 + extraPts) * round;
  s.score += pts; s.cleared += removed.length;
  const g = gravity(s);
  return { removed, made, fx, pts, falls: g.falls, spawns: g.spawns };
}
function cascade(s, pref, rounds) {
  let round = rounds.length;
  for (;;) {
    const groups = findGroups(s.cells);
    if (!groups.length) break;
    round++;
    const clear = new Set(), creates = [];
    let extra = 0;
    for (const g of groups) {
      for (const i of g.cells) clear.add(i);
      const sp = specialFor(g, pref);
      if (sp) { creates.push(sp); extra += sp.k === STAR ? 100 : sp.sp === "b" ? 60 : 40; }
    }
    const r = runRound(s, clear, creates, round, extra, []);
    r.groups = groups.map((g) => ({ cells: g.cells, kind: g.kind }));
    rounds.push(r);
    pref = [];
  }
}

// Kết quả: { a, b, rounds: [{removed, made, fx, pts, falls, spawns, groups}], shuffle?, status, bonus } hoặc null nếu không hợp lệ.
export function swap(s, a, b) {
  if (s.status !== "playing" || !validSwap(s.cells, a, b)) return null;
  const A = s.cells[a], B = s.cells[b];
  s.moves++;
  if (s.movesLeft !== null) s.movesLeft--;
  [s.cells[a], s.cells[b]] = [B, A]; // A giờ ở b, B ở a
  const rounds = [];
  let combo = null;
  if (A.k === STAR || B.k === STAR || (A.sp && B.sp)) {
    const clear = new Set([a, b]), fx = [], done = new Set();
    if (A.k === STAR && B.k === STAR) { combo = "star2"; s.cells.forEach((c, j) => c && clear.add(j)); fx.push({ type: "star2", at: b }); done.add(a); done.add(b); }
    else if (A.k === STAR || B.k === STAR) {
      const other = A.k === STAR ? B : A, starAt = A.k === STAR ? b : a;
      combo = "star"; s.cells.forEach((c, j) => { if (c && c.k === other.k) clear.add(j); });
      fx.push({ type: "star", at: starAt, k: other.k }); done.add(starAt);
    } else {
      const lines = [A.sp, B.sp].filter((x) => x === "h" || x === "v").length, bombs = 2 - lines;
      const area = new Set();
      const y = Y(b), x = X(b);
      if (lines === 2) { combo = "cross"; for (const j of blastArea(b, "h")) area.add(j); for (const j of blastArea(b, "v")) area.add(j); fx.push({ type: "h", at: b }, { type: "v", at: b }); }
      else if (bombs === 2) { combo = "bomb2"; for (const j of blastArea(b, "b", 2)) area.add(j); fx.push({ type: "b2", at: b }); }
      else {
        combo = "bigcross";
        for (let d = -1; d <= 1; d++) { if (y + d >= 0 && y + d < H) for (const j of blastArea((y + d) * W + x, "h")) area.add(j); if (x + d >= 0 && x + d < W) for (const j of blastArea(y * W + x + d, "v")) area.add(j); }
        fx.push({ type: "h3", at: b }, { type: "v3", at: b });
      }
      for (const j of area) clear.add(j);
      done.add(a); done.add(b);
    }
    // kích hoạt dây chuyền các kẹo đặc biệt khác bị cuốn vào (trừ 2 ô vừa đổi đã xử lý)
    propagate(s, clear, done, fx);
    const r = runRound(s, clear, [], 1, combo === "star2" ? 500 : 150, fx);
    r.combo = combo; r.groups = [];
    rounds.push(r);
    cascade(s, [], rounds);
  } else {
    cascade(s, [b, a], rounds);
  }
  s.maxCombo = Math.max(s.maxCombo, rounds.length);
  const res = { a, b, rounds, combo, shuffle: null, bonus: 0, status: s.status };
  // thắng / thua
  if (s.mode === "level") {
    if (goalsMet(s)) {
      s.bonus = s.movesLeft * BONUS_PER_MOVE; s.score += s.bonus; res.bonus = s.bonus;
      s.status = "won"; s.stars = starsFor(s);
    } else if (s.movesLeft <= 0) s.status = "lost";
  }
  if (s.status === "playing" && !hasMove(s.cells)) res.shuffle = shuffle(s);
  res.status = s.status;
  return res;
}
export function goalsMet(s) { return s.score >= s.target && s.goals.every((g) => g.left <= 0); }
export function starsFor(s) { let n = 0; for (const r of STAR_RATIO) if (s.score >= s.target * r) n++; return n; }

// Xáo bàn khi hết nước đi: giữ nguyên các viên kẹo, đổi chỗ đến khi không có hàng sẵn và có nước đi.
export function shuffle(s) {
  const tiles = s.cells.slice();
  for (let tries = 0; tries < 300; tries++) {
    for (let i = N - 1; i > 0; i--) { const j = Math.floor(rngNext(s) * (i + 1)); [tiles[i], tiles[j]] = [tiles[j], tiles[i]]; }
    if (!findGroups(tiles).length && hasMove(tiles)) { s.cells = tiles.slice(); s.shuffles++; return s.cells.map((c, at) => ({ id: c.id, at })); }
  }
  // quá khó (rất hiếm): làm lại các kẹo thường, giữ kẹo đặc biệt
  const keep = s.cells.slice();
  fillStable(s);
  keep.forEach((c, i) => { if (c && isSpecial(c)) s.cells[i] = c; });
  if (findGroups(s.cells).length || !hasMove(s.cells)) fillStable(s);
  s.shuffles++;
  return s.cells.map((c, at) => ({ id: c.id, at, k: c.k, sp: c.sp }));
}

// ---------- Lưu / nạp ----------
export function serialize(s) {
  return {
    v: 1, mode: s.mode, level: s.level, kinds: s.kinds, target: s.target, movesLeft: s.movesLeft, movesMax: s.movesMax,
    goals: s.goals.map((g) => [g.k, g.n, g.left]), cells: s.cells.map((c) => (c.sp ? [c.k, c.sp] : c.k)),
    score: s.score, moves: s.moves, time: Math.round(s.time * 10) / 10, status: s.status, rng: s.rng,
    cleared: s.cleared, maxCombo: s.maxCombo, specials: s.specials, shuffles: s.shuffles,
  };
}
const int = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
export function deserialize(d) {
  try {
    if (!d || d.v !== 1 || !Array.isArray(d.cells) || d.cells.length !== N || d.status !== "playing") return null;
    let s;
    if (d.mode === "free") s = newGame({ mode: "free", seed: 1 });
    else if (d.mode === "level" && levelInfo(d.level)) s = newGame({ mode: "level", level: d.level, seed: 1 });
    else return null;
    if (s.mode === "level") {
      if (!int(d.movesLeft, 1, s.movesMax)) return null;
      if (!Array.isArray(d.goals) || d.goals.length !== s.goals.length) return null;
      for (let j = 0; j < s.goals.length; j++) { const g = d.goals[j]; if (!Array.isArray(g) || g[0] !== s.goals[j].k || g[1] !== s.goals[j].n || !int(g[2], 0, g[1])) return null; s.goals[j].left = g[2]; }
      s.movesLeft = d.movesLeft;
    }
    s.nextId = 1;
    s.cells = d.cells.map((v) => {
      const [k, sp] = Array.isArray(v) ? v : [v, 0];
      if (!(int(k, 0, s.kinds - 1) || k === STAR) || !SPECIALS.includes(sp) || (k === STAR && sp)) throw new Error("ô hỏng");
      return newTile(s, k, sp);
    });
    if (findGroups(s.cells).length) return null;
    for (const key of ["score", "moves", "cleared", "maxCombo", "specials", "shuffles"]) { if (!int(d[key], 0, 1e9)) return null; s[key] = d[key]; }
    s.time = typeof d.time === "number" && d.time >= 0 && d.time < 1e7 ? d.time : 0;
    s.rng = d.rng | 0;
    if (!hasMove(s.cells)) shuffle(s);
    return s;
  } catch { return null; }
}

// Dùng cho test: dựng bàn từ chuỗi 8 hàng (chữ số = loại kẹo, "*" = sao; hậu tố h/v/b sau chữ số không dùng — xem setCell)
export function boardFrom(s, rows) {
  s.nextId = 1;
  s.cells = rows.join("").split("").map((ch) => newTile(s, ch === "*" ? STAR : +ch));
  return s;
}
export function setCell(s, i, k, sp = 0) { s.cells[i] = newTile(s, k, sp); }
