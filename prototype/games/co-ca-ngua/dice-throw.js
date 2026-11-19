// Cờ Cá Ngựa — quỹ đạo tung xúc xắc (thuần, không DOM; test được trong Node).
// Chỉ là HÌNH: mặt xúc xắc do logic.js / máy chủ quyết định, hoạt ảnh chỉ đáp xuống đúng mặt đó.
// simulateThrow(): mô phỏng nhìn từ trên xuống — xúc xắc bay (độ cao z), xoay, nảy trên mặt sân, dội vào mép sân,
// chậm dần rồi nằm yên. Mỗi seed/vận tốc cho một đường khác nhau. Kết quả là các khung đều nhau 1/60 s.
export const FRAME_MS = 1000 / 60;

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Vùng cấm (keepOut) = [{x, y, r}]: hình tròn quanh ngựa đang đứng trong sân — xúc xắc NẰM YÊN không được đè lên
// (tâm xúc xắc cách tâm vùng ≥ r + bán kính xúc xắc). Bay / nảy ngang qua thì được, chỉ chỗ dừng cuối phải trống.
const clear = (x, y, keepOut, r) => keepOut.reduce((m, k) => Math.min(m, Math.hypot(x - k.x, y - k.y) - (k.r + r)), Infinity);

// Chỗ trống gần (x, y) nhất trong sân (tâm cách mép ≥ r, không chạm vùng cấm). Thuần, tất định.
// (x, y) đã trống → giữ nguyên. Không còn chỗ nào trống → chỗ "ít đè" nhất (xa vùng cấm nhất).
export function freeSpot(x, y, bounds, r = 26, keepOut = [], step = 2) {
  const [bx0, by0, bx1, by1] = bounds;
  const minX = bx0 + r, maxX = Math.max(minX, bx1 - r), minY = by0 + r, maxY = Math.max(minY, by1 - r);
  x = clamp(x, minX, maxX); y = clamp(y, minY, maxY);
  if (!keepOut || !keepOut.length || clear(x, y, keepOut, r) >= 0) return { x, y };
  let best = null, bd = Infinity, worst = { x, y }, wc = -Infinity;
  const pts = (a, b) => { const out = []; for (let v = a; v < b; v += step) out.push(v); out.push(b); return out; };
  for (const px of pts(minX, maxX)) for (const py of pts(minY, maxY)) {
    const c = clear(px, py, keepOut, r);
    if (c >= 0) { const d = (px - x) ** 2 + (py - y) ** 2; if (d < bd) { bd = d; best = { x: px, y: py }; } }
    else if (c > wc) { wc = c; worst = { x: px, y: py }; }
  }
  return best || worst;
}

// bounds = [x0, y0, x1, y1] (vùng sân), r = nửa cạnh xúc xắc (tâm luôn cách mép ≥ r).
// vx, vy (px/giây) = hướng + lực tung (kéo-thả); không có → tung nhẹ theo hướng ngẫu nhiên.
// keepOut = vùng cấm (ngựa trong sân): nếu xúc xắc dừng đè lên thì trong lúc "nằm yên" nó trượt sang chỗ trống gần nhất.
// Trả về { frames: [{x, y, z, a}], bounces: [{t, k}], duration (ms), end: {x, y, a}, seed }.
export function simulateThrow({ x, y, vx, vy, bounds, r = 26, seed = 1, reduced = false, gentle = false, keepOut = [] }) {
  const R = rng(seed);
  const [bx0, by0, bx1, by1] = bounds;
  const minX = bx0 + r, maxX = Math.max(minX, bx1 - r), minY = by0 + r, maxY = Math.max(minY, by1 - r);
  x = clamp(x == null ? (bx0 + bx1) / 2 : x, minX, maxX);
  y = clamp(y == null ? (by0 + by1) / 2 : y, minY, maxY);
  let sp = Math.hypot(vx || 0, vy || 0);
  if (!(sp > 40)) { // bấm/chạm không kéo: tung nhẹ, hướng ngẫu nhiên
    const ang = R() * Math.PI * 2, s = gentle ? 160 + R() * 160 : 450 + R() * 550;
    vx = Math.cos(ang) * s; vy = Math.sin(ang) * s; sp = s;
  }
  const cap = clamp(sp, 120, 1600);
  vx = (vx / sp) * cap; vy = (vy / sp) * cap;
  if (reduced) { // giảm chuyển động: trượt ngắn ~0,25 s, không xoay, không nảy
    const n = 15, { x: tx, y: ty } = freeSpot(x + vx * 0.08, y + vy * 0.08, bounds, r, keepOut), frames = [];
    for (let i = 0; i <= n; i++) { const k = 1 - (1 - i / n) ** 2; frames.push({ x: x + (tx - x) * k, y: y + (ty - y) * k, z: 0, a: 0 }); }
    return { frames, bounces: [], duration: n * FRAME_MS, end: { x: tx, y: ty, a: 0 }, seed };
  }
  let z = 0, vz = gentle ? 120 + R() * 120 : 220 + R() * 260 + cap * 0.12, a = R() * Math.PI * 2;
  let w = (R() < 0.5 ? -1 : 1) * (6 + R() * 10 + cap / 120);
  const G = 2000, dt = 1 / 120, frames = [], bounces = [];
  const bump = (t, k) => { const last = bounces[bounces.length - 1]; if (last && t - last.t < 45) last.k = Math.max(last.k, k); else bounces.push({ t, k: clamp(k, 0.15, 1) }); };
  let step = 0;
  for (; step < 2.4 / dt; step++) {
    const t = step * dt * 1000;
    if (step % 2 === 0) frames.push({ x, y, z, a });
    x += vx * dt; y += vy * dt; z += vz * dt; vz -= G * dt; a += w * dt;
    // dội vào mép sân (hệ số nảy + chút ngẫu nhiên để mỗi lần một khác)
    if (x < minX || x > maxX) { x = x < minX ? minX + (minX - x) : maxX - (x - maxX); x = clamp(x, minX, maxX); bump(t, Math.abs(vx) / 900); vx = -vx * (0.5 + R() * 0.2); vy *= 0.9; w = -w * (0.6 + R() * 0.3); }
    if (y < minY || y > maxY) { y = y < minY ? minY + (minY - y) : maxY - (y - maxY); y = clamp(y, minY, maxY); bump(t, Math.abs(vy) / 900); vy = -vy * (0.5 + R() * 0.2); vx *= 0.9; w = -w * (0.6 + R() * 0.3); }
    if (z <= 0) {
      z = 0;
      if (vz < -90) { bump(t, -vz / 600); vz = -vz * (0.38 + R() * 0.12); w += (R() - 0.5) * 6; const j = (R() - 0.5) * 0.5; const c = Math.cos(j), s = Math.sin(j); [vx, vy] = [vx * c - vy * s, vx * s + vy * c]; }
      else vz = 0;
    }
    const ground = z === 0 && vz === 0;
    const f = ground ? 1 - 6.5 * dt : 1 - 0.35 * dt;
    vx *= f; vy *= f; w *= ground ? 1 - 7 * dt : 1 - 0.3 * dt;
    if (ground && Math.hypot(vx, vy) < 22 && Math.abs(w) < 1.2) break;
  }
  // nằm yên: xoay về THẲNG ĐỨNG (bội của 360°, ~230 ms). Ảnh xúc xắc là khối nghiêng 3 mặt — xoay 90° là mặt trên
  // lật sang bên, nhìn chéo không biết mặt nào ngửa ⇒ chỉ dừng ở góc 0.
  // Dừng đè lên ngựa (vùng cấm) → cùng lúc đó trượt sang chỗ trống gần nhất (xa hơn thì trượt lâu hơn, tối đa ~0,5 s).
  const a1 = Math.round(a / (Math.PI * 2)) * (Math.PI * 2), a0 = a, x0 = x, y0 = y;
  ({ x, y } = freeSpot(x, y, bounds, r, keepOut));
  const n = Math.min(30, 14 + Math.round(Math.hypot(x - x0, y - y0) / 8));
  for (let i = 1; i <= n; i++) { const k = 1 - (1 - i / n) ** 3; frames.push({ x: x0 + (x - x0) * k, y: y0 + (y - y0) * k, z: 0, a: a0 + (a1 - a0) * k }); }
  return { frames, bounces, duration: (frames.length - 1) * FRAME_MS, end: { x, y, a: a1 }, seed };
}

// Vị trí ở thời điểm t (ms) kể từ lúc tung — nội suy giữa 2 khung.
export function sampleThrow(sim, t) {
  const F = sim.frames, u = clamp(t / FRAME_MS, 0, F.length - 1), i = Math.floor(u), k = u - i;
  const p = F[i], q = F[Math.min(i + 1, F.length - 1)];
  return { x: p.x + (q.x - p.x) * k, y: p.y + (q.y - p.y) * k, z: p.z + (q.z - p.z) * k, a: p.a + (q.a - p.a) * k };
}

// Vận tốc thả tay (px/giây) từ các điểm kéo gần nhất [{x, y, t}] — chỉ lấy ~100 ms cuối.
export function releaseVelocity(samples, now) {
  const rec = samples.filter((s) => now - s.t <= 110);
  if (rec.length < 2) return { vx: 0, vy: 0 };
  const a = rec[0], b = rec[rec.length - 1], dt = Math.max(16, b.t - a.t) / 1000;
  return { vx: (b.x - a.x) / dt, vy: (b.y - a.y) / dt };
}
