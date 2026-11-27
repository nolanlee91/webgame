// Xe giao hàng của Anh Út (DESIGN-2.0 §1 khu 4, §3 cấp 11) — thành phần hoạt cảnh nhỏ, chỉ hiển thị.
// Trạng thái suy ra hoàn toàn từ core/village.js truckVisit(now, lastDeliveryAt, { level }) ⇒ không lưu gì riêng.
// Dùng: const truck = createTruck(hostEl, { now, lastDeliveryAt: () => s.lastDeliveryAt, level: () => s.level });
//       sau mỗi sự kiện "delivered": truck.kick(). Bản đồ nông trại đặt hostEl ở cổng (position: relative / absolute).
// Trả { el, kick(), update(), destroy(), get phase() }. Vẽ trên <canvas> riêng (W × H logic, CSS co giãn, pixel vuông).
import { truckVisit } from "../core/village.js?v=m16";
import { TRUCK } from "../data/village.js?v=m16";
import { loadArt, artReady, draw, injectStyle } from "./m4-art.js?v=m16";

injectStyle("m4-truck", `
.m4-truck { position: relative; display: block; width: 100%; pointer-events: none; image-rendering: pixelated; }
.m4-truck[data-phase="idle"] { visibility: hidden; }
`);

export function drawTruck(g, v, W, H, t = 0) {
  g.clearRect(0, 0, W, H);
  if (!v || v.phase === "idle") return;
  const k = 0.42, margin = 70, x = -margin + v.pos * (W + 2 * margin), y = H - 6;
  const bob = v.phase === "load" ? 0 : Math.round(Math.sin(t / 60) * 1);
  // bụi đường khi chạy
  if (v.phase !== "load") {
    g.save(); g.globalAlpha = 0.35; g.fillStyle = "#d9c08a";
    for (let i = 0; i < 3; i++) { const dx = -(40 + i * 12); /* xe chạy trái → phải, bụi phía sau */ g.fillRect(Math.round(x + dx - ((t / 40 + i * 7) % 10)), y - 6 - i * 3, 6, 4); }
    g.restore();
  }
  draw(g, TRUCK.sprite.sheet, TRUCK.sprite.frame, x, y + bob, k);
  if (v.driver) draw(g, TRUCK.driver.sheet, v.driver, x + (v.phase === "load" ? 62 : 30), y, 0.46);
  if (v.fx) draw(g, TRUCK.fx.sheet, v.fx, x - 4, y - 46, 0.9);
}

export function createTruck(host, opts = {}) {
  const W = opts.width || 360, H = opts.height || 110;
  const now = opts.now || (() => Date.now());
  const last = typeof opts.lastDeliveryAt === "function" ? opts.lastDeliveryAt : () => opts.lastDeliveryAt ?? null;
  const level = typeof opts.level === "function" ? opts.level : () => opts.level;
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H; cv.className = "m4-truck"; cv.setAttribute("aria-hidden", "true"); cv.dataset.phase = "idle";
  host.append(cv);
  const g = cv.getContext("2d");
  let raf = 0, dead = false;
  const visit = () => truckVisit(now(), last(), level() === undefined ? {} : { level: level() });
  function frameLoop(t) {
    raf = 0;
    if (dead) return;
    const v = visit();
    cv.dataset.phase = v.phase;
    if (artReady()) drawTruck(g, v, W, H, t);
    if (v.phase !== "idle" && !document.hidden) raf = requestAnimationFrame(frameLoop);
  }
  const kick = () => { if (!raf && !dead) raf = requestAnimationFrame(frameLoop); };
  loadArt().then(kick);
  return {
    el: cv, kick, update: kick,
    get phase() { return visit().phase; },
    destroy() { dead = true; if (raf) cancelAnimationFrame(raf); cv.remove(); },
  };
}
