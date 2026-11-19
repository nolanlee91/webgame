// Sprite từ assets/v3/manifest.json: nạp atlas, vẽ khung theo điểm neo, cắt khung ui-kit / ô nền ra data URL cho CSS
// (border-image 9-slice, nền lặp), hiệu ứng fx.webp một lần. Chỉ hiển thị — không có luật ở đây.
const BASE = new URL("../assets/v3/", import.meta.url).href;
const img = {}, frames = {}, sheets = {};
let readyP = null;

const loadImg = (src) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });

/** Nạp manifest + các atlas cần (một lần). Trả Promise<boolean>. */
export function loadSprites(names = ["machines", "machines-2", "workshop", "ui-kit", "market-stall", "npc-market", "fx", "items", "buildings", "buildings-2", "decor", "animals"]) { // animals: gà / bò trên bản đồ (M5)
  readyP ||= (async () => {
    let man = null;
    try { const r = await fetch(BASE + "manifest.json"); if (r.ok) man = await r.json(); } catch {}
    if (!man) return false;
    await Promise.all(names.map(async (n) => {
      const sh = man.sheets?.[n];
      if (!sh) return;
      sheets[n] = sh;
      img[n] = await loadImg(BASE + sh.file);
      for (const f of sh.frames || []) frames[n + ":" + f.id] = f;
    }));
    exportCss();
    return true;
  })();
  return readyP;
}
export const sheet = (n) => sheets[n] || null;
export const frame = (n, id) => frames[n + ":" + id] || null;
export const image = (n) => img[n] || null;

/**
 * Vẽ khung `id` của atlas `n` vào ctx: chân (anchor) đặt tại (x, y), phóng `k` lần (pixel vuông, không làm mờ).
 * Không có ảnh ⇒ false (người gọi tự vẽ chỗ trống).
 */
export function draw(g, n, id, x, y, k = 1, alpha = 1) {
  const f = frame(n, id), im = img[n];
  if (!f || !im) return false;
  const [ax, ay] = f.anchor || [f.width / 2, f.height];
  g.save(); g.imageSmoothingEnabled = false; g.globalAlpha = alpha;
  g.drawImage(im, f.x, f.y, f.width, f.height, Math.round(x - ax * k), Math.round(y - ay * k), Math.round(f.width * k), Math.round(f.height * k));
  g.restore();
  return true;
}

/** Khung animation của máy: idle hoặc running (luân phiên) theo manifest.animations. */
export function machineFrame(sheetName, prefix, running, t) {
  const a = sheets[sheetName]?.animations?.[prefix];
  const list = sheets[sheetName]?.frames || [];
  if (!a) return `${prefix}-idle`;
  const k = running ? a.running[Math.floor(t / (a.frameMs || 240)) % a.running.length] : a.idle[0];
  return list[k]?.id || `${prefix}-idle`;
}

const urls = {};
/** Cắt một khung ra data URL (cache). */
export function cropUrl(n, id) {
  const key = n + ":" + id;
  if (urls[key]) return urls[key];
  const f = frame(n, id), im = img[n];
  if (!f || !im) return null;
  const c = document.createElement("canvas"); c.width = f.width; c.height = f.height;
  const g = c.getContext("2d"); g.imageSmoothingEnabled = false;
  g.drawImage(im, f.x, f.y, f.width, f.height, 0, 0, f.width, f.height);
  try { urls[key] = c.toDataURL(); } catch { urls[key] = null; }
  return urls[key];
}

/** Đặt biến CSS cho khung ui-kit + ô nền Xưởng: --uk-<id>, --ws-<id>. CSS dùng làm border-image / nền lặp. */
function exportCss() {
  const root = document.documentElement.style;
  for (const f of sheets["ui-kit"]?.frames || []) { const u = cropUrl("ui-kit", f.id); if (u) root.setProperty("--uk-" + f.id, `url(${u})`); }
  for (const f of sheets.workshop?.frames || []) { const u = cropUrl("workshop", f.id); if (u) root.setProperty("--ws-" + f.id, `url(${u})`); }
  // sàn gỗ: ô 128 px ghép A/B so le (hai loại ván khớp mép ngang)
  const a = frame("workshop", "san-go-a"), b = frame("workshop", "san-go-b");
  if (a && b && img.workshop) {
    const c = document.createElement("canvas"); c.width = c.height = 128;
    const g = c.getContext("2d"); g.imageSmoothingEnabled = false;
    [[a, 0, 0], [b, 64, 0], [b, 0, 64], [a, 64, 64]].forEach(([f, x, y]) => g.drawImage(img.workshop, f.x, f.y, 64, 64, x, y, 64, 64));
    try { root.setProperty("--ws-floor", `url(${c.toDataURL()})`); } catch {}
  }
  document.documentElement.classList.add("sprites-ready");
}

/**
 * Hiệu ứng fx.webp một lần (xu-bay, lap-lanh, nuoc-tuoi, khoi-xay-dung, giao-don) tại (x, y) trong `host` (position: relative).
 * size: cỡ hiển thị (px). Tự xoá sau khi chạy. prefers-reduced-motion ⇒ CSS ẩn.
 */
export function playFx(host, kind, x, y, size = 64) {
  if (!host) return;
  const row = { "xu-bay": 0, "lap-lanh": 1, "nuoc-tuoi": 2, "khoi-xay-dung": 3, "giao-don": 4, "thanh-am-vat-nuoi": 5 }[kind];
  if (row === undefined) return;
  const ms = (sheets.fx?.animations?.[kind]?.frameMs || 90) * 4;
  const e = document.createElement("span");
  e.className = "fx"; e.setAttribute("aria-hidden", "true");
  e.style.cssText = `left:${x}px;top:${y}px;width:${size}px;height:${size}px;--row:${row};animation-duration:${ms}ms`;
  host.append(e);
  setTimeout(() => e.remove(), ms + 60);
}
