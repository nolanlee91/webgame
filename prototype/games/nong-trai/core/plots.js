// Ruộng: gieo / tưới / thu hoạch / mở ô. Thời gian tuyệt đối (plantAt / readyAt) ⇒ cây lớn cả khi tắt trang.
// Ruộng 5×5, mở sẵn 3×3 ở giữa. Các hàm đổi trạng thái chỉ gọi qua apply() và trả { err } hoặc kết quả.
import { CROP } from "../data/crops.js?v=m4";
import { MATERIALS } from "../data/catalog.js?v=m4";
import { cropUnlocked, hasFeature, addXp } from "./progression.js?v=m4";
import { add, canAdd } from "./inventory.js?v=m4";
import { rand, pick } from "./rng.js?v=m4";

export const W = 5, H = 5;
// Milestone 3: s.plots có 43 ô cố định — 0..24 ruộng chính (5×5), 25..33 Khu đất phía Đông (cấp 17, +9 ô, east: true),
// 34..42 Nhà kính (gh: true; 6 ô khi xây, 9 ô khi nâng cấp 2). Ô vùng mới mở theo công trình (core/construct.js applyEffects),
// không mua từng ô. Mía (crop.requires = "nha-kinh") CHỈ gieo ở ô nhà kính; ô nhà kính không cần tưới (gieo xong = đã tưới).
export const BASE_PLOTS = W * H, EAST_FIRST = BASE_PLOTS, EAST_COUNT = 9, GH_FIRST = EAST_FIRST + EAST_COUNT, GH_COUNT = 9;
export const PLOT_COUNT = GH_FIRST + GH_COUNT;
export const isEastIndex = (i) => i >= EAST_FIRST && i < EAST_FIRST + EAST_COUNT;
export const isGreenhouseIndex = (i) => i >= GH_FIRST && i < GH_FIRST + GH_COUNT;
export const WATER_FACTOR = 0.7; // tưới: thời gian CÒN LẠI × 0.7
export const MATERIAL_DROP = 0.02, MATERIAL_DROP_LEVEL = 3; // 2% rơi vật liệu khi thu hoạch, từ cấp 3
const idx = (x, y) => y * W + x;
export const START_OPEN = new Set([idx(1, 1), idx(2, 1), idx(3, 1), idx(1, 2), idx(2, 2), idx(3, 2), idx(1, 3), idx(2, 3), idx(3, 3)]);
export const emptyPlot = (open) => ({ open, crop: null, plantAt: 0, readyAt: 0, watered: false });
/** Ô trống đúng vùng theo chỉ số (cờ east / gh giữ cả khi thu hoạch xong). */
export function blankPlot(i, open = START_OPEN.has(i)) {
  const p = emptyPlot(open);
  if (isEastIndex(i)) p.east = true;
  if (isGreenhouseIndex(i)) p.gh = true;
  return p;
}
const reset = (p) => Object.assign(p, emptyPlot(true), p.gh ? { gh: true } : {}, p.east ? { east: true } : {});

/** Giá mở ô tiếp theo: 30 xu, mỗi ô đã mua đắt thêm 35%, làm tròn 5. */
export const plotCost = (s) => Math.round((30 * 1.35 ** s.bought) / 5) * 5;
export const isReady = (p, now) => !!p.crop && now >= p.readyAt;
/** Tiến độ 0..1 của ô đang trồng. */
export function progress(p, now) {
  if (!p.crop) return 0;
  const span = p.readyAt - p.plantAt;
  return span <= 0 ? 1 : Math.max(0, Math.min(1, (now - p.plantAt) / span));
}
/** Giai đoạn hiển thị: "empty" | "seed" | "sprout" | "grow" | "mature" | "ready". */
export function stage(p, now) {
  if (!p.crop) return "empty";
  if (isReady(p, now)) return "ready";
  const k = progress(p, now);
  if (k < 0.2) return "seed";
  if (k < 0.45) return "sprout";
  return k < 0.78 ? "grow" : "mature";
}
/** Ô khoá có kề (trên/dưới/trái/phải) một ô đã mở không. */
export function canBuy(s, i) {
  if (!Number.isInteger(i) || i < 0 || i >= BASE_PLOTS) return false; // ô vùng mới mở theo công trình, không mua lẻ
  const p = s.plots[i];
  if (!p || p.open) return false;
  const x = i % W, y = Math.floor(i / W);
  return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
    const nx = x + dx, ny = y + dy;
    return nx >= 0 && nx < W && ny >= 0 && ny < H && s.plots[idx(nx, ny)].open;
  });
}
const plotAt = (s, i) => (Number.isInteger(i) ? s.plots[i] : undefined);

export function plant(s, i, id, now, events) {
  const p = plotAt(s, i), c = CROP[id];
  if (!p || !c) return { err: "bad" };
  if (!p.open) return { err: "locked" };
  if (p.crop) return { err: "busy" };
  if (!cropUnlocked(s, id)) return { err: "level" };
  if (c.requires === "nha-kinh" && !p.gh) return { err: "greenhouse-only" };
  const free = id === "ca-rot" && s.freeSeeds > 0;
  const cost = free ? 0 : c.seed;
  if (s.coins < cost) return { err: "coins" };
  if (free) s.freeSeeds--;
  s.coins -= cost;
  // nhà kính: không cần tưới ⇒ gieo xong coi như đã tưới (thời gian ×0,7 như tưới ngay lúc gieo)
  const grow = p.gh ? Math.round(c.growMs * WATER_FACTOR) : c.growMs;
  Object.assign(p, { crop: id, plantAt: now, readyAt: now + grow, watered: !!p.gh });
  events.push({ type: "planted", i, crop: id, cost, free, greenhouse: !!p.gh });
  return { ok: true, cost };
}

export function water(s, i, now, events) {
  const p = plotAt(s, i);
  if (!p || !p.crop) return { err: "empty" };
  if (isReady(p, now)) return { err: "ready" };
  if (p.gh) return { err: "greenhouse" }; // nhà kính tự tưới
  if (p.watered) return { err: "watered" };
  const left = p.readyAt - now;
  const cut = Math.round(left * (1 - WATER_FACTOR));
  // giữ tỉ lệ tiến độ liền mạch: kéo cả plantAt về trước cùng lượng để thanh tiến độ nhảy lên, không tụt
  p.readyAt -= cut; p.plantAt -= cut; p.watered = true;
  events.push({ type: "watered", i, saved: cut });
  return { ok: true, saved: cut };
}

export function harvest(s, i, now, events) {
  const p = plotAt(s, i);
  if (!p || !p.crop) return { err: "empty" };
  if (!isReady(p, now)) return { err: "growing" };
  const c = CROP[p.crop];
  if (!canAdd(s, c.id, 1)) return { err: "basket-full" }; // kho đầy + giỏ tràn đầy: chỉ lúc này mới chặn
  const { overflowed } = add(s, c.id, 1);
  s.stats.harvested++;
  reset(p);
  const ev = { type: "harvested", i, crop: c.id, xp: c.xp, overflow: overflowed > 0, material: null };
  if (s.level >= MATERIAL_DROP_LEVEL && rand(s) < MATERIAL_DROP) {
    ev.material = pick(s, MATERIALS);
    add(s, ev.material, 1);
  }
  events.push(ev);
  addXp(s, c.xp, events);
  return { ok: true, crop: c.id, xp: c.xp };
}

/** Thu hoạch mọi ô đã chín (dừng khi giỏ tràn đầy). */
export function harvestAll(s, now, events) {
  let count = 0, blocked = false;
  for (let i = 0; i < s.plots.length; i++) {
    if (!isReady(s.plots[i], now)) continue;
    const r = harvest(s, i, now, events);
    if (r.err) { blocked = true; break; }
    count++;
  }
  if (!count) return { err: blocked ? "basket-full" : "none-ready" };
  return { ok: true, count, blocked };
}

export function buyPlot(s, i, events) {
  const p = plotAt(s, i);
  if (!p || i >= BASE_PLOTS) return { err: "bad" };
  if (p.open) return { err: "open" };
  if (!hasFeature(s, "plots")) return { err: "plots-level" };
  if (!canBuy(s, i)) return { err: "far" };
  const cost = plotCost(s);
  if (s.coins < cost) return { err: "coins" };
  s.coins -= cost; s.bought++; p.open = true;
  events.push({ type: "plotBought", i, cost });
  return { ok: true, cost };
}

/** Số ô đã chín trong lúc vắng mặt (chín sau lần cuối nhìn thấy, trước hiện tại). */
export const readyWhileAway = (s, now) => s.plots.filter((p) => p.crop && p.readyAt > s.lastSeen && p.readyAt <= now).length;
