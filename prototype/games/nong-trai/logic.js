// Nông Trại — luật thuần (không DOM). Mọi hàm nhận `now` (ms) từ ngoài để test được và để cây vẫn lớn khi tắt trang:
// mỗi ô lưu mốc thời gian tuyệt đối (plantAt / readyAt), mở lại trang chỉ cần so với Date.now().
// Ruộng 5×5, mở sẵn 3×3 ở giữa; mua thêm ô kề ô đã mở. Trồng → (tưới 1 lần, nhanh 30%) → chín → thu hoạch lấy xu + XP.

export const W = 5, H = 5;
export const SAVE_VERSION = 1;
export const START_COINS = 20;
export const WATER_FACTOR = 0.7; // tưới: thời gian CÒN LẠI × 0.7

// Cây ngắn ngày lời hơn mỗi phút (thưởng người chơi chăm), cây dài ngày hợp để trồng rồi đi làm việc khác.
export const CROPS = [
  { id: "rau-muong", name: "Rau Muống", growMs: 20_000, seed: 2, sell: 5, xp: 1, level: 1 },
  { id: "ca-rot", name: "Cà Rốt", growMs: 60_000, seed: 5, sell: 14, xp: 3, level: 1 },
  { id: "bap", name: "Bắp", growMs: 180_000, seed: 12, sell: 36, xp: 8, level: 2 },
  { id: "bi-do", name: "Bí Đỏ", growMs: 480_000, seed: 25, sell: 80, xp: 18, level: 3 },
  { id: "dua-hau", name: "Dưa Hấu", growMs: 1_200_000, seed: 50, sell: 180, xp: 40, level: 5 },
];
export const CROP = Object.fromEntries(CROPS.map((c) => [c.id, c]));

/** XP cần để đi từ cấp `lv` lên `lv + 1`. */
export const xpNeed = (lv) => Math.round(10 * lv ** 1.5);
/** Giá mở ô tiếp theo: 30 xu, mỗi ô đã mua đắt thêm 35%, làm tròn 5. */
export const plotCost = (s) => Math.round((30 * 1.35 ** s.bought) / 5) * 5;

const idx = (x, y) => y * W + x;
const START_OPEN = new Set([idx(1, 1), idx(2, 1), idx(3, 1), idx(1, 2), idx(2, 2), idx(3, 2), idx(1, 3), idx(2, 3), idx(3, 3)]);
const emptyPlot = (open) => ({ open, crop: null, plantAt: 0, readyAt: 0, watered: false });

export function newFarm(now = 0) {
  return {
    v: SAVE_VERSION, coins: START_COINS, xp: 0, level: 1, bought: 0, lastSeen: now,
    plots: Array.from({ length: W * H }, (_, i) => emptyPlot(START_OPEN.has(i))),
    stats: { harvested: 0, earned: 0 },
  };
}

export const isReady = (p, now) => !!p.crop && now >= p.readyAt;
/** Tiến độ 0..1 của ô đang trồng. */
export function progress(p, now) {
  if (!p.crop) return 0;
  const span = p.readyAt - p.plantAt;
  return span <= 0 ? 1 : Math.max(0, Math.min(1, (now - p.plantAt) / span));
}
/** Giai đoạn hiển thị: "empty" | "seed" | "sprout" | "grow" | "ready". */
export function stage(p, now) {
  if (!p.crop) return "empty";
  if (isReady(p, now)) return "ready";
  const k = progress(p, now);
  return k < 0.34 ? "seed" : k < 0.72 ? "sprout" : "grow";
}
export const unlocked = (s, id) => !!CROP[id] && s.level >= CROP[id].level;

export function plant(s, i, id, now) {
  const p = s.plots[i], c = CROP[id];
  if (!p || !c) return { err: "bad" };
  if (!p.open) return { err: "locked" };
  if (p.crop) return { err: "busy" };
  if (s.level < c.level) return { err: "level" };
  if (s.coins < c.seed) return { err: "coins" };
  s.coins -= c.seed;
  Object.assign(p, { crop: id, plantAt: now, readyAt: now + c.growMs, watered: false });
  return { ok: true, cost: c.seed };
}

export function water(s, i, now) {
  const p = s.plots[i];
  if (!p || !p.crop) return { err: "empty" };
  if (isReady(p, now)) return { err: "ready" };
  if (p.watered) return { err: "watered" };
  const left = p.readyAt - now;
  const cut = Math.round(left * (1 - WATER_FACTOR));
  // giữ tỉ lệ tiến độ liền mạch: kéo cả plantAt về trước cùng lượng để thanh tiến độ nhảy lên, không tụt
  p.readyAt -= cut; p.plantAt -= cut; p.watered = true;
  return { ok: true, saved: cut };
}

function addXp(s, n) {
  s.xp += n;
  let ups = 0;
  while (s.xp >= xpNeed(s.level)) { s.xp -= xpNeed(s.level); s.level++; ups++; }
  return ups;
}

export function harvest(s, i, now) {
  const p = s.plots[i];
  if (!p || !p.crop) return { err: "empty" };
  if (!isReady(p, now)) return { err: "growing" };
  const c = CROP[p.crop];
  s.coins += c.sell; s.stats.harvested++; s.stats.earned += c.sell;
  const before = s.level, ups = addXp(s, c.xp);
  Object.assign(p, emptyPlot(true));
  const unlockedNow = ups ? CROPS.filter((k) => k.level > before && k.level <= s.level).map((k) => k.id) : [];
  return { ok: true, crop: c.id, coins: c.sell, xp: c.xp, levelUp: ups ? s.level : 0, unlocked: unlockedNow };
}

/** Thu hoạch mọi ô đã chín. */
export function harvestAll(s, now) {
  const out = { count: 0, coins: 0, xp: 0, levelUp: 0, unlocked: [], plots: [] };
  s.plots.forEach((p, i) => {
    if (!isReady(p, now)) return;
    const r = harvest(s, i, now);
    out.count++; out.coins += r.coins; out.xp += r.xp; out.plots.push(i);
    if (r.levelUp) out.levelUp = r.levelUp;
    out.unlocked.push(...r.unlocked);
  });
  return out;
}

/** Ô khoá có kề (trên/dưới/trái/phải) một ô đã mở không. */
export function canBuy(s, i) {
  const p = s.plots[i];
  if (!p || p.open) return false;
  const x = i % W, y = Math.floor(i / W);
  return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
    const nx = x + dx, ny = y + dy;
    return nx >= 0 && nx < W && ny >= 0 && ny < H && s.plots[idx(nx, ny)].open;
  });
}

export function buyPlot(s, i) {
  const p = s.plots[i];
  if (!p) return { err: "bad" };
  if (p.open) return { err: "open" };
  if (!canBuy(s, i)) return { err: "far" };
  const cost = plotCost(s);
  if (s.coins < cost) return { err: "coins" };
  s.coins -= cost; s.bought++; p.open = true;
  return { ok: true, cost };
}

/** Số ô đã chín trong lúc vắng mặt (chín sau lần cuối nhìn thấy, trước hiện tại). */
export const readyWhileAway = (s, now) => s.plots.filter((p) => p.crop && p.readyAt > s.lastSeen && p.readyAt <= now).length;

// ---------- lưu / đọc ----------
const num = (v, lo, hi, d) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d);

/** Đọc bản lưu (chuỗi JSON hoặc object). Hỏng / lạ ⇒ ruộng mới. Mọi số đều bị kẹp về khoảng hợp lệ. */
export function load(raw, now) {
  let d = raw;
  try { if (typeof raw === "string") d = JSON.parse(raw); } catch { d = null; }
  if (!d || typeof d !== "object" || d.v !== SAVE_VERSION || !Array.isArray(d.plots) || d.plots.length !== W * H) return newFarm(now);
  const s = newFarm(now);
  s.coins = Math.floor(num(d.coins, 0, 1e12, START_COINS));
  s.level = Math.floor(num(d.level, 1, 999, 1));
  s.xp = Math.floor(num(d.xp, 0, xpNeed(s.level) - 1, 0));
  s.bought = Math.floor(num(d.bought, 0, W * H, 0));
  s.lastSeen = num(d.lastSeen, 0, now, now);
  s.stats.harvested = Math.floor(num(d.stats?.harvested, 0, 1e12, 0));
  s.stats.earned = Math.floor(num(d.stats?.earned, 0, 1e15, 0));
  s.plots = d.plots.map((q, i) => {
    const p = emptyPlot(!!q?.open || START_OPEN.has(i));
    if (p.open && q && CROP[q.crop]) {
      const grow = CROP[q.crop].growMs;
      // readyAt không được xa hơn một chu kỳ trồng (chặn bản lưu bị sửa / đồng hồ bị lùi làm cây kẹt mãi)
      const readyAt = num(q.readyAt, 0, now + grow, now + grow), plantAt = num(q.plantAt, readyAt - grow, readyAt, readyAt - grow);
      Object.assign(p, { crop: q.crop, plantAt, readyAt, watered: !!q.watered });
    }
    return p;
  });
  return s;
}
export const dump = (s, now) => JSON.stringify({ ...s, lastSeen: now });
