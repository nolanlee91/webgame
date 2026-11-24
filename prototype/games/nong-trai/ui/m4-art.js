// Nghệ thuật dùng chung cho cảnh Milestone 4 (ui/scene-animals.js, ui/scene-village.js, ui/truck.js). Chỉ hiển thị.
// Tự nạp manifest + atlas cần (KHÔNG dùng ui/sprites.js: loadSprites() ở đó nhớ một danh sách atlas cố định, gọi trước
// bởi game.js thì các atlas animals / village / npc không được nạp). Không phụ thuộc markup trong index.html:
// tự chèn <style> có tiền tố `m4-` (hiệu ứng, chữ nổi, icon) và đặt biến CSS --m4-* trên <html>.
import { iconCell } from "../data/catalog.js?v=m6s";

const BASE = new URL("../assets/v3/", import.meta.url).href;
const GARDEN = new URL("../assets/garden/", import.meta.url).href;
const SHEETS = ["animals", "village", "npc", "npc-2", "fx", "ui-kit", "buildings", "buildings-2", "items", "decor"];
const img = {}, frames = {}, sheets = {};
let readyP = null;

const loadImg = (src) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });

/** Nạp manifest + atlas (một lần). Promise<boolean>. */
export function loadArt() {
  readyP ||= (async () => {
    let man = null;
    try { const r = await fetch(BASE + "manifest.json"); if (r.ok) man = await r.json(); } catch {}
    if (!man) return false;
    await Promise.all(SHEETS.map(async (n) => {
      const sh = man.sheets?.[n];
      if (!sh) return;
      sheets[n] = sh;
      img[n] = await loadImg(BASE + sh.file);
      for (const f of sh.frames || []) frames[n + ":" + f.id] = f;
    }));
    const [grass, fence] = await Promise.all([loadImg(GARDEN + "grass.webp"), loadImg(GARDEN + "fence.webp")]);
    img.grass = grass; img.fence = fence;
    exportCss();
    return true;
  })();
  return readyP;
}
export const frame = (n, id) => frames[n + ":" + id] || null;
export const image = (n) => img[n] || null;
export const artReady = () => !!sheets.animals;

/** Vẽ khung `id` của atlas `n`: chân (anchor) tại (x, y), phóng k, lật ngang nếu flip. Không có ảnh ⇒ false. */
export function draw(g, n, id, x, y, k = 1, alpha = 1, flip = false) {
  const f = frame(n, id), im = img[n];
  if (!f || !im) return false;
  const [ax, ay] = f.anchor || [f.width / 2, f.height];
  g.save(); g.imageSmoothingEnabled = false; g.globalAlpha = alpha;
  if (flip) { g.translate(Math.round(x), 0); g.scale(-1, 1); g.translate(-Math.round(x), 0); }
  g.drawImage(im, f.x, f.y, f.width, f.height, Math.round(x - ax * k), Math.round(y - ay * k), Math.round(f.width * k), Math.round(f.height * k));
  g.restore();
  return true;
}
/** Lặp ngang khung `id` dọc đường y (tâm theo anchor) từ x0 tới x1. */
export function tileRow(g, n, id, x0, x1, y, k = 1) {
  const f = frame(n, id);
  if (!f) return;
  const w = Math.round(f.width * k);
  for (let x = x0; x < x1 + w; x += w) draw(g, n, id, x + w / 2, y, k);
}

const urls = {};
/** Cắt một khung ra data URL (cache). */
export function cropUrl(n, id) {
  const key = n + ":" + id;
  if (key in urls) return urls[key];
  const f = frame(n, id), im = img[n];
  if (!f || !im) return null;
  const c = document.createElement("canvas"); c.width = f.width; c.height = f.height;
  const g = c.getContext("2d"); g.imageSmoothingEnabled = false;
  g.drawImage(im, f.x, f.y, f.width, f.height, 0, 0, f.width, f.height);
  try { urls[key] = c.toDataURL(); } catch { urls[key] = null; }
  return urls[key];
}

/** Biến CSS: --m4-uk-<id> (khung ui-kit cho border-image), --m4-grass, --m4-fence, --m4-road, --m4-edge. */
function exportCss() {
  const st = document.documentElement.style;
  for (const f of sheets["ui-kit"]?.frames || []) { const u = cropUrl("ui-kit", f.id); if (u) st.setProperty("--m4-uk-" + f.id, `url(${u})`); }
  const set = (k, u) => { if (u) st.setProperty(k, `url(${u})`); };
  set("--m4-road", cropUrl("village", "duong-lang"));
  set("--m4-edge", cropUrl("village", "mep-co"));
  if (img.grass) st.setProperty("--m4-grass", `url(${GARDEN}grass.webp)`);
  if (img.fence) st.setProperty("--m4-fence", `url(${GARDEN}fence.webp)`);
  document.documentElement.classList.add("m4-art-ready");
}

// ---------- style ----------
const injected = new Set();
/** Chèn <style data-m4="id"> một lần. */
export function injectStyle(id, css) {
  if (injected.has(id) || document.querySelector(`style[data-m4="${id}"]`)) { injected.add(id); return; }
  const el = document.createElement("style");
  el.dataset.m4 = id; el.textContent = css;
  document.head.append(el);
  injected.add(id);
}

const BASE_CSS = `
.m4-fx { position: absolute; pointer-events: none; z-index: 30; transform: translate(-50%, -50%); image-rendering: pixelated;
  background-image: url(${BASE}fx.webp); background-repeat: no-repeat; animation: m4-fx-play steps(4) forwards; }
@keyframes m4-fx-play { from { background-position-x: 0; } to { background-position-x: calc(var(--fw) * -4); } }
.m4-float { position: absolute; z-index: 31; pointer-events: none; transform: translate(-50%, 0); white-space: nowrap;
  font: 800 14px/1 "Be Vietnam Pro", system-ui, sans-serif; color: #ffe9a8; text-shadow: 2px 2px 0 #000, -1px -1px 0 #000;
  animation: m4-float 1.1s ease-out forwards; }
@keyframes m4-float { from { opacity: 1; translate: 0 0; } to { opacity: 0; translate: 0 -34px; } }
.m4-it { display: inline-block; flex: none; width: var(--sz, 24px); height: var(--sz, 24px); vertical-align: -6px; image-rendering: pixelated;
  background: url(${BASE}items.webp) calc(var(--c) * var(--sz, 24px) * -1) calc(var(--r) * var(--sz, 24px) * -1) / calc(var(--sz, 24px) * 8) calc(var(--sz, 24px) * 4) no-repeat; }
.m4-it--decor { background-image: url(${BASE}decor.webp); background-size: calc(var(--sz, 24px) * 4) calc(var(--sz, 24px) * 2); }
.m4-toast { position: fixed; left: 50%; bottom: max(16px, env(safe-area-inset-bottom)); transform: translateX(-50%); z-index: 90; max-width: min(92vw, 520px);
  padding: 10px 14px; background: #1d1a16; color: #f4ead2; font: 600 14px/1.4 "Be Vietnam Pro", system-ui, sans-serif;
  box-shadow: 0 -3px 0 #0a0807, 0 3px 0 #0a0807, -3px 0 0 #0a0807, 3px 0 0 #0a0807, 4px 7px 0 rgba(0,0,0,.6); }
@media (prefers-reduced-motion: reduce) { .m4-fx { display: none; } .m4-float { animation-duration: .01s; } }
`;
injectStyle("m4-base", BASE_CSS);

const FX_ROW = { "xu-bay": 0, "lap-lanh": 1, "nuoc-tuoi": 2, "khoi-xay-dung": 3, "giao-don": 4, "thanh-am-vat-nuoi": 5, "am-vat-nuoi": 5 };
/** Hiệu ứng fx.webp một lần tại (x, y) trong host (position: relative). */
export function fx(host, kind, x, y, size = 64) {
  const row = FX_ROW[kind];
  if (!host || row === undefined) return;
  const ms = (sheets.fx?.animations?.[kind === "am-vat-nuoi" ? "thanh-am-vat-nuoi" : kind]?.frameMs || 90) * 4;
  const e = document.createElement("span");
  e.className = "m4-fx"; e.setAttribute("aria-hidden", "true");
  e.style.cssText = `left:${x}px;top:${y}px;width:${size}px;height:${size}px;--fw:${size}px;` +
    `background-size:${size * 4}px ${size * 6}px;background-position-y:${-row * size}px;animation-duration:${ms}ms`;
  host.append(e);
  setTimeout(() => e.remove(), ms + 80);
}
/** Chữ nổi tại (x, y) trong host. */
export function floatText(host, x, y, text, color) {
  if (!host || !text) return;
  const f = document.createElement("span");
  f.className = "m4-float"; f.textContent = text; f.setAttribute("aria-hidden", "true");
  f.style.left = x + "px"; f.style.top = y + "px";
  if (color) f.style.color = color;
  host.append(f);
  setTimeout(() => f.remove(), 1150);
}
/** Toạ độ tâm phần tử el trong host. */
export function centerIn(host, el) {
  const r = el?.getBoundingClientRect?.(), h = host.getBoundingClientRect();
  return r ? [r.left - h.left + r.width / 2, r.top - h.top + r.height / 2] : null;
}

// ---------- tiện ích ----------
export const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
export const fmtNum = (n) => Math.round(n).toLocaleString("vi-VN");
/** "2:05" / "1 giờ 3 phút". */
export function fmtLeft(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  if (s >= 3600) { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return `${h} giờ${m ? ` ${m} phút` : ""}`; }
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
/** Icon vật phẩm (items.webp / decor.webp), cỡ sz px. */
export function iconHtml(id, sz = 24) {
  const c = iconCell(id);
  return c ? `<i class="m4-it${c.sheet === "decor" ? " m4-it--decor" : ""}" style="--c:${c.col};--r:${c.row};--sz:${sz}px" aria-hidden="true"></i>` : "";
}
/** Thông báo: dùng ctx.toast nếu có, không thì toast riêng. */
export function makeToast(ctx) {
  if (typeof ctx?.toast === "function") return (m, ms) => ctx.toast(m, ms);
  let el = null, t = 0;
  return (m, ms = 2600) => {
    if (!el) { el = document.createElement("div"); el.className = "m4-toast"; el.setAttribute("role", "status"); el.hidden = true; document.body.append(el); }
    el.textContent = m; el.hidden = false;
    clearTimeout(t); t = setTimeout(() => (el.hidden = true), ms);
  };
}
/** Âm thanh: ctx.sfx(name, vol, rate) nếu có, không thì im lặng. */
export const makeSfx = (ctx) => (typeof ctx?.sfx === "function" ? (...a) => { try { ctx.sfx(...a); } catch {} } : () => {});
/** Khối CSS dùng chung cho khung ui-kit (9-slice) — mỗi cảnh chèn với tiền tố riêng. */
export const frameCss = (sel, id, sl, w = sl, fill = true) =>
  `${sel} { border: ${w}px solid transparent; border-image: var(--m4-uk-${id}) ${sl}${fill ? " fill" : ""} / ${w}px stretch; image-rendering: pixelated;${fill ? "" : " background-clip: padding-box;"} }`;
/** Khung ui-kit chỉ lấy viền (không kéo giãn phần giữa — tránh loang lổ trên thẻ lớn), nền màu `bg` bên trong. */
export const frameEdgeCss = (sel, id, sl, w, bg) => frameCss(sel, id, sl, w, false) + `${sel} { background-color: ${bg}; }`;

/** Phần thưởng nhiệm vụ dạng HTML ngắn: xu, XP, món, trang trí. */
export function rewardHtml(r = {}) {
  const out = [];
  if (r.coins) out.push(`${iconHtml("dong-xu", 18)}${fmtNum(r.coins)}`);
  if (r.xp) out.push(`${iconHtml("sao-xp", 18)}${r.xp} XP`);
  for (const [id, n] of [...Object.entries(r.items || {}), ...Object.entries(r.decor || {})]) out.push(`${iconHtml(id, 18)}×${n}`);
  return out.join(" ");
}
/** Phần thưởng dạng chữ (cho chữ nổi). */
export const rewardText = (r = {}) => [r.coins ? `+${fmtNum(r.coins)} xu` : "", r.xp ? `+${r.xp} XP` : ""].filter(Boolean).join(" · ");
