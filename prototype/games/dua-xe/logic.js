// Đua Xe Vượt Đồi — luật + vật lý thuần (không DOM). Đơn vị: mét, giây, trục y hướng lên.
// Xe = 5 chất điểm (PBD/XPBD): 2 điểm khung + 1 điểm đầu tài xế (tam giác cứng), 2 bánh nối khung bằng lò xo giảm xóc.
// Bánh xe có vận tốc góc riêng; lực bám đường giới hạn theo ma sát × lực ép (Coulomb), nên lên dốc gắt sẽ trượt bánh.

export const DT = 1 / 120;
export const G = 13;
export const START_X = 6;
export const DX = 0.5;            // bước lấy mẫu địa hình (polyline)
export const WHEEL_R = 0.42;
const ITER = 6;

// điểm xe trong toạ độ khung (tâm khung là gốc): x, y, khối lượng, bán kính va chạm
const PARTS = [
  { x: -1.0, y: 0, m: 1.6, r: 0.24 },     // 0 khung sau
  { x: 1.05, y: 0, m: 1.6, r: 0.24 },     // 1 khung trước
  { x: -0.2, y: 1.0, m: 0.6, r: 0.24 },   // 2 đầu tài xế (chạm đất = lật xe)
  { x: -0.95, y: -0.62, m: 1, r: WHEEL_R }, // 3 bánh sau
  { x: 1.0, y: -0.62, m: 1, r: WHEEL_R },   // 4 bánh trước
];
// [a, b, độ mềm (compliance)]: 0 = cứng
const CONS = [[0, 1], [0, 2], [1, 2]]; // tam giác khung cứng
for (const c of CONS) c.push(Math.hypot(PARTS[c[0]].x - PARTS[c[1]].x, PARTS[c[0]].y - PARTS[c[1]].y));
// giảm xóc: bánh k gắn vào điểm trên trục khung (nội suy giữa 0 và 1 theo beta), chỉ trượt theo pháp tuyến khung
// trong hành trình [rest - DROOP, rest + BUMP]; ngang theo trục khung là cứng → bánh không bao giờ "lật" qua khung.
export const SUSP = { comp: 0.003, rest: -0.62, bump: 0.24, droop: 0.2, damp: 0.2 };
const BETA = [3, 4].map((i) => (PARTS[i].x - PARTS[0].x) / (PARTS[1].x - PARTS[0].x));
// toạ độ của bánh k trong hệ khung: [dọc trục so với điểm neo, theo pháp tuyến]
export function wheelLocal(s, k) {
  const C = s.p[0], D = s.p[1], A = s.p[3 + k], b = BETA[k];
  const dx = D.x - C.x, dy = D.y - C.y, L = Math.hypot(dx, dy) || 1e-9, ux = dx / L, uy = dy / L;
  const rx = A.x - (C.x + dx * b), ry = A.y - (C.y + dy * b);
  return { u: rx * ux + ry * uy, n: -rx * uy + ry * ux, ux, uy };
}
function solveWheel(s, k, lam, al) {
  const P = s.p, C = P[0], D = P[1], A = P[3 + k], b = BETA[k];
  const wA = 1 / PARTS[3 + k].m, wC = 1 / PARTS[0].m, wD = 1 / PARTS[1].m, wB = (1 - b) ** 2 * wC + b * b * wD;
  const q = wheelLocal(s, k), nx = -q.uy, ny = q.ux;
  const apply = (dirx, diry, dl) => {
    A.x += dirx * dl * wA; A.y += diry * dl * wA;
    C.x -= dirx * dl * (1 - b) * wC; C.y -= diry * dl * (1 - b) * wC;
    D.x -= dirx * dl * b * wD; D.y -= diry * dl * b * wD;
  };
  apply(q.ux, q.uy, -q.u / (wA + wB)); // dọc trục: cứng
  const e = q.n - SUSP.rest;
  if (e > SUSP.bump) apply(nx, ny, -(e - SUSP.bump) / (wA + wB));        // chạm giới hạn nén
  else if (e < -SUSP.droop) apply(nx, ny, -(e + SUSP.droop) / (wA + wB)); // chạm giới hạn giãn
  else { const dl = (-e - al * lam[k]) / (wA + wB + al); lam[k] += dl; apply(nx, ny, dl); } // lò xo mềm
}

// ---------- nâng cấp ----------
export const UPG = {
  engine: { name: "Động cơ", max: 5 },
  grip: { name: "Lốp bám", max: 5 },
  tank: { name: "Bình xăng", max: 5 },
};
const COST = [150, 350, 700, 1200, 2000];
export const upgradeCost = (lvl) => (lvl >= 0 && lvl < COST.length ? COST[lvl] : null);
export function carCfg(up = {}) {
  const e = up.engine | 0, g = up.grip | 0, t = up.tank | 0;
  return {
    vmax: 12.5 + 1.8 * e,             // tốc độ tối đa (m/s)
    force: 18 + 3.5 * e,              // lực kéo tối đa mỗi bánh (m/s² trên khối lượng bánh)
    brake: 30, vrev: 4,               // lực phanh, tốc độ lùi tối đa
    mu: 0.45 + 0.1 * g,                // hệ số bám lốp (tan góc dốc leo được nếu đủ lực)
    tqG: 2.2, tqA: 6.5,               // gia tốc nghiêng khi ga/phanh (trên đất / trên không)
    fuelMax: 100 + 25 * t,
    drainGas: 2.6, drainIdle: 0.7,    // %/giây
  };
}

// ---------- địa hình ----------
function h1(seed, i) {
  let t = (Math.imul(i | 0, 0x27d4eb2d) ^ Math.imul(seed | 0, 0x165667b1) ^ 0x9e3779b9) >>> 0;
  t = Math.imul(t ^ (t >>> 15), 0x85ebca6b); t = Math.imul(t ^ (t >>> 13), 0xc2b2ae35); t ^= t >>> 16;
  return (t >>> 0) / 4294967296 * 2 - 1;
}
function vnoise(seed, x) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return h1(seed, i) * (1 - u) + h1(seed, i + 1) * u;
}
export const difficulty = (x) => Math.min(1, Math.max(0, (x - 40) / 1600));
// độ cao "lý tưởng" tại x; đầu đường bằng phẳng, sau đó đồi cao và dốc dần theo quãng đường
export function heightFn(seed, x) {
  if (x < 0) return -x * 1.4; // vách chặn phía sau vạch xuất phát
  const d = difficulty(x);
  const ramp = x < 22 ? 0 : x > 70 ? 1 : ((x - 22) / 48) ** 2 * (3 - 2 * (x - 22) / 48);
  const h = (3.5 + 9 * d) * vnoise(seed, x / 42) + (1.2 + 3.8 * d) * vnoise(seed + 77, x / 13 + 0.5) + (0.25 + 1.0 * d) * vnoise(seed + 151, x / 4.5);
  return h * ramp;
}
export function makeTerrain(seed) { return { seed: seed >>> 0, ys: [] }; }
function sampleY(T, i) {
  if (i < 0) return heightFn(T.seed, i * DX);
  const ys = T.ys;
  while (ys.length <= i) ys.push(heightFn(T.seed, ys.length * DX));
  return ys[i];
}
export function groundY(T, x) {
  const i = Math.floor(x / DX), f = x / DX - i;
  return sampleY(T, i) * (1 - f) + sampleY(T, i + 1) * f;
}
export function slopeAt(T, x) { const i = Math.floor(x / DX); return Math.atan2(sampleY(T, i + 1) - sampleY(T, i), DX); }

// điểm gần nhất trên polyline địa hình tới (px, py): trả về {nx, ny, d} với d = khoảng cách có dấu (âm = đã chui xuống đất)
function closest(T, px, py, r) {
  const i0 = Math.floor((px - r - DX) / DX), i1 = Math.ceil((px + r + DX) / DX);
  let best = Infinity, bx = 0, by = 0, sx = 0, sy = 1;
  for (let i = i0; i < i1; i++) {
    const ax = i * DX, ay = sampleY(T, i), cx = ax + DX, cy = sampleY(T, i + 1);
    const ex = cx - ax, ey = cy - ay, L2 = ex * ex + ey * ey;
    let t = ((px - ax) * ex + (py - ay) * ey) / L2; t = t < 0 ? 0 : t > 1 ? 1 : t;
    const qx = ax + ex * t, qy = ay + ey * t, dd = (px - qx) ** 2 + (py - qy) ** 2;
    if (dd < best) { best = dd; bx = qx; by = qy; const L = Math.sqrt(L2); sx = -ey / L; sy = ex / L; }
  }
  const d = Math.sqrt(best);
  const below = py < groundY(T, px);
  if (below) return { nx: sx, ny: sy, d: -d };
  if (d < 1e-9) return { nx: sx, ny: sy, d: 0 };
  return { nx: (px - bx) / d, ny: (py - by) / d, d };
}

// ---------- vật phẩm: tiền + can xăng (sinh cố định theo seed) ----------
export const CHUNK = 40;
function rng(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export const fuelGap = (x) => Math.min(330, 125 + 0.11 * (x - START_X));
export function fuelXs(s, upto) {
  const f = s.fuelX;
  if (!f.length) f.push(START_X + 110);
  while (f[f.length - 1] < upto) f.push(f[f.length - 1] + fuelGap(f[f.length - 1]));
  return f;
}
export function chunkItems(s, c) {
  let it = s.itemCache.get(c);
  if (it) return it;
  it = [];
  const x0 = c * CHUNK, x1 = x0 + CHUNK, fx = fuelXs(s, x1 + 10);
  fx.forEach((x, k) => { if (x >= x0 && x < x1) it.push({ id: "f" + k, kind: "fuel", x, y: groundY(s.terrain, x) + 1.0, v: 0 }); });
  if (x1 > START_X + 30) {
    const R = rng(Math.imul(s.seed ^ 0x5bd1e995, 31) + c * 7919);
    const groups = R() < 0.75 ? 1 : 2;
    for (let g = 0; g < groups; g++) {
      const n = 3 + Math.floor(R() * 4), sx = x0 + 3 + R() * (CHUNK - 3 - n * 1.2) ;
      const dist = sx - START_X, big = R();
      const v = dist > 900 && big < 0.25 ? 25 : dist > 300 && big < 0.4 ? 10 : 5;
      for (let k = 0; k < n; k++) {
        const x = sx + k * 1.2;
        if (x < START_X + 30 || fx.some((f) => Math.abs(f - x) < 5)) continue;
        it.push({ id: "c" + c + "_" + g + "_" + k, kind: "coin", x, y: groundY(s.terrain, x) + 0.95, v });
      }
    }
  }
  s.itemCache.set(c, it);
  return it;
}
export function itemsNear(s, xa, xb) {
  const out = [];
  for (let c = Math.floor(xa / CHUNK); c <= Math.floor(xb / CHUNK); c++) for (const it of chunkItems(s, c)) if (!s.taken.has(it.id) && it.x >= xa && it.x <= xb) out.push(it);
  return out;
}

// ---------- vùng (đổi cảnh theo quãng đường) ----------
export const BIOMES = ["Đồi Cỏ", "Đồi Cát", "Hẻm Đá Đỏ", "Đồi Tuyết"];
export const BIOME_LEN = 400;
export const biomeAt = (dist) => Math.floor(Math.max(0, dist) / BIOME_LEN) % BIOMES.length;

// ---------- ván chơi ----------
export function newRun(seed = 1, up = {}) {
  const cfg = carCfg(up);
  const s = {
    seed: seed >>> 0, cfg, terrain: makeTerrain(seed), t: 0, acc: 0,
    p: PARTS.map(() => ({ x: 0, y: 0, px: 0, py: 0, vx: 0, vy: 0, cn: null })),
    w: [0, 0], wa: [0, 0], wc: [false, false], bc: false,
    fuel: cfg.fuelMax, noFuelT: 0, stuckT: 0, crashT: 0,
    status: "run", reason: null,
    maxX: START_X, dist: 0, coins: 0, picked: 0, fuels: 0, flips: 0, airBest: 0,
    airT: 0, flipAcc: 0, lastA: 0, biome: 0,
    fuelX: [], itemCache: new Map(), taken: new Set(), events: [], input: { gas: false, brake: false },
  };
  setPose(s, START_X, 0, 0);
  return s;
}
// đặt xe: tâm khung tại x, cao hơn mức "bánh chạm đất" yOff mét, nghiêng angle (rad), vận tốc vx, vy
export function setPose(s, x, yOff = 0, angle = 0, vx = 0, vy = 0) {
  const c = Math.cos(angle), sn = Math.sin(angle);
  const y = groundY(s.terrain, x) + 0.62 + WHEEL_R + 0.005 + yOff;
  PARTS.forEach((d, i) => {
    const p = s.p[i];
    p.x = p.px = x + d.x * c - d.y * sn; p.y = p.py = y + d.x * sn + d.y * c; p.vx = vx; p.vy = vy; p.cn = null;
  });
  s.w = [vx / WHEEL_R, vx / WHEEL_R];
  s.lastA = angle; s.flipAcc = 0; s.airT = 0;
  return s;
}
export const carX = (s) => (s.p[0].x + s.p[1].x) / 2;
export const carY = (s) => (s.p[0].y + s.p[1].y) / 2;
export const carAngle = (s) => Math.atan2(s.p[1].y - s.p[0].y, s.p[1].x - s.p[0].x);
export const carSpeed = (s) => { let vx = 0, vy = 0, m = 0; PARTS.forEach((d, i) => { vx += s.p[i].vx * d.m; vy += s.p[i].vy * d.m; m += d.m; }); return Math.hypot(vx / m, vy / m); };
export const carVx = (s) => { let vx = 0, m = 0; PARTS.forEach((d, i) => { vx += s.p[i].vx * d.m; m += d.m; }); return vx / m; };
const wrap = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a <= -Math.PI) a += 2 * Math.PI; return a; };

// vật phẩm chạm xe: gần một trong các cạnh khung (sau–trước, sau–đầu, trước–đầu) hoặc gần bánh
const PICK_R = 0.8;
function segD2(px, py, A, B) {
  const ex = B.x - A.x, ey = B.y - A.y, L2 = ex * ex + ey * ey || 1e-9;
  let t = ((px - A.x) * ex + (py - A.y) * ey) / L2; t = t < 0 ? 0 : t > 1 ? 1 : t;
  return (px - A.x - ex * t) ** 2 + (py - A.y - ey * t) ** 2;
}
function touches(P, x, y) {
  const r2 = PICK_R * PICK_R;
  return segD2(x, y, P[0], P[1]) < r2 || segD2(x, y, P[0], P[2]) < r2 || segD2(x, y, P[1], P[2]) < r2 ||
    (P[3].x - x) ** 2 + (P[3].y - y) ** 2 < r2 || (P[4].x - x) ** 2 + (P[4].y - y) ** 2 < r2;
}

function crash(s, reason) {
  if (s.status !== "run") return;
  s.status = "crash"; s.reason = reason; s.crashT = 0;
  s.events.push({ type: "crash", reason });
}

export function substep(s, inp = s.input) {
  const P = s.p, cfg = s.cfg, T = s.terrain;
  const live = s.status === "run";
  const gas = live && inp.gas && s.fuel > 0 ? 1 : 0;
  const brk = live && inp.brake ? 1 : 0;
  s.t += DT;

  // 1) ngoại lực: trọng lực + mô-men nghiêng do ga/phanh (ga: ngóc đầu lên, phanh: chúi xuống)
  for (const p of P) { p.vy -= G * DT; p.vx *= 1 - 0.04 * DT; p.vy *= 1 - 0.04 * DT; }
  const tq = (gas - brk) * (s.wc[0] || s.wc[1] ? cfg.tqG : cfg.tqA);
  if (tq) {
    let cx = 0, cy = 0, m = 0;
    for (let i = 0; i < 3; i++) { cx += P[i].x * PARTS[i].m; cy += P[i].y * PARTS[i].m; m += PARTS[i].m; }
    cx /= m; cy /= m;
    for (let i = 0; i < 3; i++) { P[i].vx += -(P[i].y - cy) * tq * DT; P[i].vy += (P[i].x - cx) * tq * DT; }
  }
  // 2) bánh trên không: quay theo ga/phanh (chỉ để hiển thị)
  for (let k = 0; k < 2; k++) {
    if (s.wc[k]) continue;
    const W = cfg.vmax / WHEEL_R;
    s.w[k] = gas ? s.w[k] + (W - s.w[k]) * Math.min(1, 3 * DT) : brk ? s.w[k] * (1 - Math.min(1, 10 * DT)) : s.w[k] * (1 - 0.4 * DT);
  }
  // 3) dự đoán vị trí
  for (const p of P) { p.px = p.x; p.py = p.y; p.x += p.vx * DT; p.y += p.vy * DT; p.cn = null; }
  // 4) ràng buộc + va chạm đất
  const lam = [0, 0], al = SUSP.comp / (DT * DT);
  for (let it = 0; it < ITER; it++) {
    for (const [a, b, rest] of CONS) {
      const A = P[a], B = P[b], wa = 1 / PARTS[a].m, wb = 1 / PARTS[b].m;
      const dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy) || 1e-9;
      const dl = -(L - rest) / (wa + wb), nx = dx / L, ny = dy / L;
      A.x -= nx * dl * wa; A.y -= ny * dl * wa; B.x += nx * dl * wb; B.y += ny * dl * wb;
    }
    solveWheel(s, 0, lam, al); solveWheel(s, 1, lam, al);
    for (let i = 0; i < P.length; i++) {
      const p = P[i], r = PARTS[i].r, q = closest(T, p.x, p.y, r);
      if (q.d < r) {
        const pen = r - q.d;
        p.x += q.nx * pen; p.y += q.ny * pen;
        if (!p.cn) p.cn = { nx: q.nx, ny: q.ny, j: 0 };
        p.cn.nx = q.nx; p.cn.ny = q.ny; p.cn.j += pen;
      }
    }
  }
  // 5) vận tốc từ vị trí, giảm chấn giảm xóc
  for (const p of P) { p.vx = (p.x - p.px) / DT; p.vy = (p.y - p.py) / DT; }
  for (let k = 0; k < 2; k++) {
    const A = P[3 + k], C = P[0], D = P[1], b = BETA[k], q = wheelLocal(s, k), nx = -q.uy, ny = q.ux;
    const wA = 1, wC = 1 / PARTS[0].m, wD = 1 / PARTS[1].m, wB = (1 - b) ** 2 * wC + b * b * wD;
    const rv = (A.vx - (C.vx * (1 - b) + D.vx * b)) * nx + (A.vy - (C.vy * (1 - b) + D.vy * b)) * ny;
    const dl = -rv * SUSP.damp / (wA + wB);
    A.vx += nx * dl * wA; A.vy += ny * dl * wA;
    C.vx -= nx * dl * (1 - b) * wC; C.vy -= ny * dl * (1 - b) * wC; D.vx -= nx * dl * b * wD; D.vy -= ny * dl * b * wD;
  }
  // 6) ma sát / lực kéo bánh (Coulomb: tối đa mu × xung lực ép)
  for (let i = 0; i < P.length; i++) {
    const p = P[i], c = p.cn;
    if (!c) continue;
    const tx = c.ny, ty = -c.nx, vt = p.vx * tx + p.vy * ty, lim = cfg.mu * c.j / DT;
    if (i >= 3) {
      // động cơ/phanh muốn đổi vận tốc tiếp tuyến một lượng dv (giới hạn bởi lực động cơ), rồi bị giới hạn bởi độ bám
      const k = i - 3;
      let target = vt, cap = 0;
      if (gas) { target = cfg.vmax; cap = cfg.force * DT; }
      else if (brk) { if (vt > 0.2) { target = 0; cap = cfg.brake * DT; } else { target = -cfg.vrev; cap = cfg.force * 0.5 * DT; } }
      else { target = 0; cap = 0.25 * DT; } // lực cản lăn
      let dv = target - vt; if (dv > cap) dv = cap; else if (dv < -cap) dv = -cap;
      const spin = Math.abs(dv) > lim;
      if (dv > lim) dv = lim; else if (dv < -lim) dv = -lim;
      p.vx += tx * dv; p.vy += ty * dv;
      s.w[k] = spin && gas ? Math.max((vt + dv) / WHEEL_R, cfg.vmax * 0.7 / WHEEL_R) : spin && brk && vt > 0.2 ? 0 : (vt + dv) / WHEEL_R;
      if (spin) s.spin = (s.spin || 0) + DT;
    } else {
      const lb = 0.7 * c.j / DT, dv = Math.abs(vt) < lb ? -vt : -Math.sign(vt) * lb;
      p.vx += tx * dv; p.vy += ty * dv;
    }
  }
  for (let k = 0; k < 2; k++) { s.wc[k] = !!P[3 + k].cn; s.wa[k] += s.w[k] * DT; }
  s.bc = !!(P[0].cn || P[1].cn || P[2].cn);

  // 7) luật: lật xe, xăng, quãng đường, vật phẩm, bay lộn vòng
  const ang = carAngle(s);
  if (live) {
    if (P[2].cn) crash(s, "lat");
    else if ((P[0].cn || P[1].cn) && Math.abs(ang) > 1.95) crash(s, "lat");
    const sp = carSpeed(s);
    if (s.status === "run" && Math.abs(ang) > 1.25 && s.bc && !s.wc[0] && !s.wc[1] && sp < 0.8) { s.stuckT += DT; if (s.stuckT > 1.5) crash(s, "lat"); } else s.stuckT = 0;

    if (s.status === "run") {
      s.fuel = Math.max(0, s.fuel - DT * (cfg.drainIdle + cfg.drainGas * gas));
      if (s.fuel <= 0) {
        s.noFuelT += DT;
        if ((sp < 0.35 && s.noFuelT > 1) || s.noFuelT > 9) { s.status = "over"; s.reason = "xang"; s.events.push({ type: "over", reason: "xang" }); }
      } else s.noFuelT = 0;
    }
    const x = carX(s);
    if (x > s.maxX) {
      s.maxX = x;
      const d = Math.floor(s.maxX - START_X);
      if (d !== s.dist) {
        if (Math.floor(d / 100) > Math.floor(s.dist / 100)) s.events.push({ type: "mark", d: Math.floor(d / 100) * 100 });
        const b = biomeAt(d); if (b !== s.biome) { s.biome = b; s.events.push({ type: "biome", b }); }
        s.dist = d;
      }
    }
    if (s.status === "run") {
      for (const it of itemsNear(s, x - 3, x + 3)) {
        if (touches(P, it.x, it.y)) {
          {
            s.taken.add(it.id);
            if (it.kind === "coin") { s.coins += it.v; s.picked++; s.events.push({ type: "coin", v: it.v, x: it.x, y: it.y }); }
            else { s.fuel = cfg.fuelMax; s.fuels++; s.noFuelT = 0; s.events.push({ type: "fuel", x: it.x, y: it.y }); }
          }
        }
      }
      const air = !s.wc[0] && !s.wc[1] && !s.bc;
      if (air) { s.flipAcc += wrap(ang - s.lastA); s.airT += DT; }
      else {
        if (s.airT > 0 && (s.wc[0] || s.wc[1])) {
          const flips = Math.floor((Math.abs(s.flipAcc) + 0.6) / (2 * Math.PI));
          if (flips > 0) { s.flips += flips; s.coins += 50 * flips; s.events.push({ type: "flip", n: flips, v: 50 * flips }); }
          if (s.airT >= 1.0) { const v = Math.round(s.airT * 10); s.coins += v; s.airBest = Math.max(s.airBest, s.airT); s.events.push({ type: "air", t: s.airT, v }); }
          if (s.airT > 0.35) s.events.push({ type: "land", t: s.airT });
        }
        s.flipAcc = 0; s.airT = 0;
      }
    }
  } else if (s.status === "crash") {
    s.crashT += DT;
    if (s.crashT > 1.4) { s.status = "over"; s.events.push({ type: "over", reason: s.reason }); }
  }
  s.lastA = ang;
}

// chạy theo thời gian thực với bước cố định (tất định)
export function update(s, inp, elapsed) {
  s.input = inp;
  s.acc += Math.min(Math.max(0, elapsed), 0.1);
  let n = 0;
  while (s.acc >= DT && s.status !== "over") { substep(s, inp); s.acc -= DT; n++; }
  if (s.status === "over") s.acc = 0;
  return n;
}
export function simulate(s, inp, seconds) { const n = Math.round(seconds / DT); for (let i = 0; i < n && s.status !== "over"; i++) substep(s, inp); return s; }

// ---------- lưu trữ / kỷ lục / nâng cấp ----------
const cl = (v, a, b) => { v = Math.floor(Number(v)); return Number.isFinite(v) ? Math.min(b, Math.max(a, v)) : a; };
export function sanitizeSave(v) {
  const o = v && typeof v === "object" ? v : {};
  const up = o.up && typeof o.up === "object" ? o.up : {};
  return {
    v: 1, best: cl(o.best, 0, 1e6), coins: cl(o.coins, 0, 1e9), runs: cl(o.runs, 0, 1e9),
    up: { engine: cl(up.engine, 0, 5), grip: cl(up.grip, 0, 5), tank: cl(up.tank, 0, 5) },
  };
}
export function buyUpgrade(save, key) {
  if (!UPG[key]) return false;
  const lvl = save.up[key], c = upgradeCost(lvl);
  if (c == null || save.coins < c) return false;
  save.coins -= c; save.up[key] = lvl + 1;
  return true;
}
// kết thúc ván: cộng tiền vào ví, cập nhật kỷ lục
export function finishRun(save, s) {
  const prev = save.best;
  save.coins += s.coins; save.runs += 1;
  const record = s.dist > prev;
  if (record) save.best = s.dist;
  return { record, prev, dist: s.dist, coins: s.coins };
}
