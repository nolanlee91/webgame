// Khoe kết quả — module chia sẻ dùng chung cho mọi game Lụm Kèo (ES module, không thư viện ngoài).
//   import { shareResult } from "../_shared/share.js?v=s1";
//   shareResult({ game: "o-an-quan", title: "Thắng máy 38–12", lines: ["Quân ăn được: 38", "Số lượt: 21"], tagline: "Máy xin thua!" });
// API + ví dụ: xem SHARE.md cùng thư mục.
//   makeCard(opts)    → Promise<Blob>  ảnh PNG 1080×1080 (pixel V5: khung góc khuyết, bóng cứng, nền navy/gỗ, Be Vietnam Pro)
//   makeBanner(opts)  → Promise<Blob>  ảnh 1200×630 cho thẻ xem trước link (tools/og/render-og-images.mjs dùng)
//   shareResult(opts) → Promise<"native"|"panel"|"cancelled"|"error">  tạo ảnh rồi mở bảng chia sẻ
// Phần dựng nội dung (normalizeOpts, layoutCard, shareUrl, shareText…) là hàm thuần, test được trên Node không cần canvas.
import { SITE_URL, SITE_NAME } from "./site.js";
import { GAMES_META } from "./games-meta.js";

export const CARD_SIZE = 1080;
export const FONT_FAMILY = '"Be Vietnam Pro", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
export const THEMES = {
  navy: { bg: "#0e1623", grid: "rgba(255,255,255,.035)", panel: "#182638", panel2: "#1d2c41", inset: "#111b2a", line: "#0a111c",
    edge: "#3c526d", shadow: "#050a12", ink: "#f5f2e8", soft: "#b5c2d2", dim: "#8fa1b6", teal: "#75d1bf", tealInk: "#c6f7ea" },
  wood: { bg: "#1a120c", grid: "rgba(255,230,190,.035)", panel: "#2a1d13", panel2: "#35251a", inset: "#1d140d", line: "#0a0705",
    edge: "#6b4f37", shadow: "#050302", ink: "#f4ead2", soft: "#cdbb98", dim: "#a8967a", teal: "#6fd0bb", tealInk: "#d5f5e9" },
};
const GOLD = "#f7c96d";

// ───────────────────────── phần thuần (test Node) ─────────────────────────
const clean = (s, max) => {
  s = String(s ?? "").replace(/\s+/g, " ").trim();
  return s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s;
};
export const gameMeta = (id) => GAMES_META[id] || { name: String(id || SITE_NAME), folder: String(id || ""), thumb: "" };
export const hostOf = (base = SITE_URL) => base.replace(/^https?:\/\//, "").replace(/\/+$/, "");

/** Link chia sẻ: trang game trên domain thật + ?ref=share&g=<id> (chỉ để đo sau này, không gửi đi đâu). */
export function shareUrl(game, base = SITE_URL) {
  const m = gameMeta(game);
  const path = m.folder ? `/games/${m.folder}/` : "/homepage/";
  return `${base.replace(/\/+$/, "")}${path}?ref=share&g=${encodeURIComponent(game || "home")}`;
}

/** Câu kèm theo khi chia sẻ (Zalo/Messenger/bảng chia sẻ điện thoại). */
export function shareText(o) {
  const name = gameMeta(o.game).name;
  const title = clean(o.title, 60);
  return title ? `${title} ở ${name} trên ${SITE_NAME}! Vào chơi thử nè 👉` : `Chơi ${name} miễn phí trên ${SITE_NAME} nè 👉`;
}

export const facebookShareUrl = (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
// Messenger không cần app id chỉ có trên điện thoại (mở app qua scheme fb-messenger://). Máy tính cần app id ⇒ không hiện.
export const messengerShareUrl = (url) => `fb-messenger://share/?link=${encodeURIComponent(url)}`;

/** Chuẩn hoá opts: cắt chuỗi dài, tối đa 4 dòng chỉ số, điền tên game/thumbnail/màu nhấn mặc định. */
export function normalizeOpts(opts = {}) {
  const game = String(opts.game || "");
  const meta = gameMeta(game);
  const lines = (Array.isArray(opts.lines) ? opts.lines : []).map((l) => clean(l, 46)).filter(Boolean).slice(0, 4);
  return {
    game, name: meta.name,
    title: clean(opts.title || "Kết quả", 40),
    lines,
    tagline: clean(opts.tagline, 90),
    accent: /^#[0-9a-f]{3,8}$/i.test(opts.accent || "") ? opts.accent : GOLD,
    theme: THEMES[opts.theme] ? opts.theme : "navy",
    thumb: opts.thumb === false ? "" : (opts.thumb || (meta.thumb ? `homepage/assets/thumbs/${meta.thumb}` : "")),
    thumbFocus: Number.isFinite(opts.thumbFocus) ? Math.min(1, Math.max(0, opts.thumbFocus)) : 0.5,
    url: opts.url || shareUrl(game),
    host: hostOf(),
  };
}

/** Tách "Nhãn: giá trị" để vẽ kiểu bảng điểm. Không có ": " ⇒ null (vẽ cả dòng ở giữa). */
export function splitLine(line) {
  const i = line.indexOf(": ");
  return i > 0 && i < line.length - 2 ? [line.slice(0, i), line.slice(i + 2)] : null;
}

/** Xuống dòng theo bề rộng (measure(text) → px). Quá maxLines thì cắt "…". */
export function wrapText(text, maxW, measure, maxLines = 2) {
  const words = text.split(" ");
  const out = [];
  let cur = "";
  for (const w of words) {
    const t = cur ? cur + " " + w : w;
    if (measure(t) <= maxW || !cur) cur = t;
    else { out.push(cur); cur = w; }
  }
  if (cur) out.push(cur);
  if (out.length > maxLines) {
    out.length = maxLines;
    let last = out[maxLines - 1] + "…";
    while (measure(last) > maxW && last.length > 2) last = last.slice(0, -2).trimEnd() + "…";
    out[maxLines - 1] = last;
  }
  return out;
}

export const font = (weight, px) => `${weight} ${px}px ${FONT_FAMILY}`;

/**
 * Dựng bố cục ảnh 1080×1080 (không vẽ). measure(text, fontString) → bề rộng px; thumbSize = {w,h} hoặc null.
 * Trả về toạ độ từng phần để drawCard vẽ — test được bằng measure giả.
 */
export function layoutCard(m, measure, thumbSize) {
  const S = CARD_SIZE, X0 = 84, W = S - 2 * X0, TOP = 84;
  const L = { size: S, frame: { x: 48, y: 48, w: S - 96, h: S - 96 } };
  // Chân trang: logo + domain (cố định ở đáy)
  L.footer = { y: 936, h: 64, sepY: 912, logo: "LỤM KÈO", line1: "Chơi miễn phí tại", line2: m.host };
  const bottom = L.footer.sepY - 24;

  // Tiêu đề lớn: thu cỡ cho vừa 1 dòng, không vừa thì 2 dòng
  let tSize = 92, tLines = [m.title];
  while (tSize > 60 && measure(m.title, font(800, tSize)) > W) tSize -= 4;
  if (measure(m.title, font(800, tSize)) > W) { tSize = 64; tLines = wrapText(m.title, W, (t) => measure(t, font(800, 64)), 2); }
  const titleH = tLines.length * Math.round(tSize * 1.12);

  // Chỉ số: 2 cột nếu đủ 4 dòng và dòng nào cũng vừa nửa bề rộng, không thì 1 cột
  const rows = m.lines.map((t) => ({ text: t, pair: splitLine(t) }));
  const half = (W - 24) / 2 - 36;
  const rowW = (r, labelPx, valuePx) => r.pair ? measure(r.pair[0], font(600, labelPx)) + 20 + measure(r.pair[1], font(800, valuePx)) : measure(r.text, font(700, valuePx));
  const twoCol = rows.length === 4 && rows.every((r) => rowW(r, 30, 34) <= half);
  const rowH = 54, statsPad = 18;
  const nRows = twoCol ? Math.ceil(rows.length / 2) : rows.length;
  const statsH = rows.length ? nRows * rowH + statsPad * 2 : 0;

  // Câu cà khịa: tối đa 2 dòng trong khung thoại
  const tagFont = font(700, 34);
  const tagLines = m.tagline ? wrapText(`“${m.tagline}”`, W - 72, (t) => measure(t, tagFont), 2) : [];
  const tagH = tagLines.length ? tagLines.length * 46 + 34 : 0;

  const gapTitle = 44, gap = 26;
  const textH = gapTitle + titleH + (statsH ? gap + statsH : 0) + (tagH ? gap + tagH : 0);

  // Thumbnail: phóng nguyên bội (crisp), cắt bớt chiều cao nếu thiếu chỗ
  let thumb = null;
  if (thumbSize && thumbSize.w > 0) {
    const s = thumbSize.w <= W ? Math.max(1, Math.floor(W / thumbSize.w)) : 1 / Math.ceil(thumbSize.w / W);
    const dw = Math.round(thumbSize.w * s), fullH = Math.round(thumbSize.h * s);
    const room = bottom - TOP - textH;
    const dh = Math.max(0, Math.min(fullH, room));
    if (dh >= 160) {
      const sh = dh / s;
      thumb = { x: Math.round((S - dw) / 2), w: dw, h: dh, scale: s, sx: 0, sw: thumbSize.w, sh, sy: (thumbSize.h - sh) * m.thumbFocus };
    }
  }
  const used = (thumb ? thumb.h : 0) + textH - (thumb ? 0 : gapTitle) + (thumb ? 0 : 70);
  let y = TOP + Math.max(0, Math.floor((bottom - TOP - used) / 2));
  if (thumb) { thumb.y = y; y += thumb.h; L.chip = { text: m.name.toUpperCase(), x: thumb.x + 20, y: thumb.y + thumb.h - 26, h: 52 }; y += gapTitle; }
  else { L.chip = { text: m.name.toUpperCase(), x: X0, y, h: 52, center: true }; y += 70 + 10; }
  L.thumb = thumb;

  L.title = { lines: tLines, size: tSize, y, lineH: Math.round(tSize * 1.12) };
  y += titleH;
  if (statsH) {
    y += gap;
    const colW = twoCol ? (W - 24) / 2 : W;
    L.stats = { x: X0, y, w: W, h: statsH, twoCol, rows: rows.map((r, i) => ({
      ...r, x: X0 + (twoCol ? (i % 2) * (colW + 24) : 0), w: colW, y: y + statsPad + (twoCol ? Math.floor(i / 2) : i) * rowH, h: rowH,
      labelPx: twoCol ? 30 : 34, valuePx: twoCol ? 34 : 40 })) };
    y += statsH;
  }
  if (tagH) { y += gap; L.tagline = { lines: tagLines, x: X0, y, w: W, h: tagH }; y += tagH; }
  L.contentBottom = y;
  return L;
}

/** Danh sách nút cộng đồng có link hợp lệ (rỗng ⇒ không hiện gì). */
export const COMMUNITY_LABELS = { facebookGroup: "Nhóm Facebook", facebookPage: "Trang Facebook", zalo: "Nhóm Zalo", tiktok: "TikTok" };
export function communityLinks(cfg) {
  if (!cfg || typeof cfg !== "object") return [];
  return Object.keys(COMMUNITY_LABELS).filter((k) => typeof cfg[k] === "string" && /^https?:\/\/\S+$/i.test(cfg[k].trim()))
    .map((k) => ({ key: k, label: COMMUNITY_LABELS[k], url: cfg[k].trim() }));
}

// ───────────────────────── phần trình duyệt ─────────────────────────
const assetUrl = (rel) => new URL(`../../${rel}`, import.meta.url).href; // rel tính từ prototype/

let fontReady = null;
export function ensureFont() {
  if (fontReady) return fontReady;
  if (!document.querySelector('link[href*="Be+Vietnam+Pro"]')) {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@600;700;800&display=swap&subset=vietnamese";
    document.head.appendChild(l);
  }
  const load = Promise.all(["600", "700", "800"].map((w) => document.fonts?.load(`${w} 40px "Be Vietnam Pro"`, "Lụm Kèo ★").catch(() => {})));
  fontReady = Promise.race([load, new Promise((r) => setTimeout(r, 2500))]);
  return fontReady;
}

function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = /^(https?:|data:|blob:|\/)/.test(src) ? src : assetUrl(src);
  });
}

/** Khung pixel V5: viền dày b với góc khuyết 1 bậc (như box-shadow 4 hướng của trang chủ) + bóng cứng lệch. */
function pxBox(ctx, x, y, w, h, { fill, line, b = 6, shadow, sx = 0, sy = 0, hi, lo }) {
  const shape = (ox, oy, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(x + ox, y - b + oy, w, h + 2 * b);
    ctx.fillRect(x - b + ox, y + oy, w + 2 * b, h);
  };
  if (shadow) shape(sx, sy, shadow);
  if (line) shape(0, 0, line);
  if (fill) { ctx.fillStyle = fill; ctx.fillRect(x, y, w, h); }
  if (hi) { ctx.fillStyle = hi; ctx.fillRect(x, y, w, Math.max(2, b / 2)); }
  if (lo) { ctx.fillStyle = lo; ctx.fillRect(x, y + h - Math.max(2, b / 2), w, Math.max(2, b / 2)); }
}

function hardText(ctx, text, x, y, color, shadow, off = 4) {
  ctx.fillStyle = shadow; ctx.fillText(text, x + off, y + off);
  ctx.fillStyle = color; ctx.fillText(text, x, y);
}

function drawBackground(ctx, w, h, T) {
  ctx.fillStyle = T.bg; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = T.grid;
  for (let x = 0; x < w; x += 48) ctx.fillRect(x, 0, 3, h);
  for (let y = 0; y < h; y += 48) ctx.fillRect(0, y, w, 3);
}

function drawLogo(ctx, x, y, size, icon, T) {
  // y = đường giữa logo
  const iconPx = Math.round(size / 16) * 16 || 16;
  if (icon) { ctx.imageSmoothingEnabled = false; ctx.drawImage(icon, x, Math.round(y - iconPx / 2), iconPx, iconPx); }
  ctx.font = font(800, Math.round(size * 0.78));
  ctx.textBaseline = "middle"; ctx.textAlign = "left";
  hardText(ctx, "LỤM KÈO", x + (icon ? iconPx + 16 : 0), y + 2, GOLD, T.shadow, 4);
}

/** Vẽ ảnh 1080×1080 theo bố cục L lên ctx. */
export function drawCard(ctx, L, m, imgs) {
  const T = THEMES[m.theme], S = L.size;
  ctx.save();
  drawBackground(ctx, S, S, T);
  const f = L.frame;
  pxBox(ctx, f.x, f.y, f.w, f.h, { fill: T.panel, line: T.line, b: 6, shadow: T.shadow, sx: 14, sy: 18, hi: "rgba(255,255,255,.07)", lo: "rgba(0,0,0,.3)" });
  // dải nhấn trên đầu thẻ
  ctx.fillStyle = m.accent; ctx.fillRect(f.x, f.y, f.w, 6);

  if (L.thumb && imgs.thumb) {
    const t = L.thumb;
    pxBox(ctx, t.x, t.y, t.w, t.h, { fill: T.inset, line: T.line, b: 6, shadow: T.shadow, sx: 8, sy: 10 });
    ctx.imageSmoothingEnabled = t.scale < 1;
    ctx.drawImage(imgs.thumb, t.sx, t.sy, t.sw, t.sh, t.x, t.y, t.w, t.h);
    ctx.imageSmoothingEnabled = false;
  }
  // chip tên game
  if (L.chip) {
    ctx.font = font(800, 30); ctx.textBaseline = "middle";
    const cw = Math.ceil(ctx.measureText(L.chip.text).width) + 44;
    const cx = L.chip.center ? Math.round((S - cw) / 2) : L.chip.x;
    pxBox(ctx, cx, L.chip.y, cw, L.chip.h, { fill: T.teal, line: T.line, b: 5, shadow: T.shadow, sx: 5, sy: 6, hi: "rgba(255,255,255,.35)", lo: "rgba(0,0,0,.25)" });
    ctx.fillStyle = "#0b1a1c"; ctx.textAlign = "left"; ctx.fillText(L.chip.text, cx + 22, L.chip.y + L.chip.h / 2 + 2);
  }
  // tiêu đề
  ctx.font = font(800, L.title.size); ctx.textAlign = "center"; ctx.textBaseline = "top";
  L.title.lines.forEach((ln, i) => hardText(ctx, ln, S / 2, L.title.y + i * L.title.lineH, m.accent, T.shadow, Math.max(3, Math.round(L.title.size / 18))));
  // bảng chỉ số
  if (L.stats) {
    const st = L.stats;
    pxBox(ctx, st.x, st.y, st.w, st.h, { fill: T.inset, line: T.line, b: 5, hi: "rgba(0,0,0,.35)" });
    st.rows.forEach((r, i) => {
      const cy = r.y + r.h / 2 + 2;
      ctx.textBaseline = "middle";
      const sameRowNext = st.twoCol ? i + 2 < st.rows.length : i + 1 < st.rows.length;
      if (sameRowNext) { ctx.fillStyle = T.panel2; for (let x = r.x + 24; x < r.x + r.w - 24; x += 18) ctx.fillRect(x, r.y + r.h - 2, 9, 3); }
      if (r.pair) {
        ctx.font = font(600, r.labelPx); ctx.textAlign = "left"; ctx.fillStyle = T.soft; ctx.fillText(r.pair[0], r.x + 30, cy);
        ctx.font = font(800, r.valuePx); ctx.textAlign = "right"; ctx.fillStyle = T.ink; ctx.fillText(r.pair[1], r.x + r.w - 30, cy);
      } else {
        ctx.font = font(700, r.valuePx); ctx.textAlign = "center"; ctx.fillStyle = T.ink; ctx.fillText(r.text, r.x + r.w / 2, cy);
      }
    });
  }
  // câu cà khịa (khung thoại có đuôi pixel)
  if (L.tagline) {
    const tg = L.tagline;
    pxBox(ctx, tg.x + 18, tg.y, tg.w - 36, tg.h, { fill: T.panel2, line: T.line, b: 5, shadow: T.shadow, sx: 6, sy: 7, hi: "rgba(255,255,255,.06)" });
    ctx.fillStyle = m.accent; ctx.fillRect(tg.x + 18, tg.y, 8, tg.h);
    ctx.font = font(700, 34); ctx.textAlign = "center"; ctx.textBaseline = "top"; ctx.fillStyle = T.tealInk;
    tg.lines.forEach((ln, i) => ctx.fillText(ln, S / 2 + 4, tg.y + 17 + i * 46));
  }
  // chân trang
  const ft = L.footer;
  ctx.fillStyle = T.line; ctx.fillRect(f.x, ft.sepY, f.w, 4);
  ctx.fillStyle = "rgba(255,255,255,.05)"; ctx.fillRect(f.x, ft.sepY + 4, f.w, 2);
  drawLogo(ctx, 84, ft.y + ft.h / 2, 64, imgs.icon, T);
  ctx.textAlign = "right"; ctx.textBaseline = "middle";
  ctx.font = font(600, 24); ctx.fillStyle = T.dim; ctx.fillText(ft.line1, S - 84, ft.y + 14);
  ctx.font = font(800, 30); ctx.fillStyle = T.ink; ctx.fillText(ft.line2, S - 84, ft.y + 48);
  ctx.restore();
}

function canvasBlob(cv, type = "image/png", quality) {
  return new Promise((resolve, reject) => cv.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob rỗng"))), type, quality));
}

/** Ảnh kết quả 1080×1080 PNG. opts = { game, title, lines: [], tagline?, accent?, thumb?, theme?: "navy"|"wood", thumbFocus? } */
export async function makeCard(opts) {
  const m = normalizeOpts(opts);
  const [, thumb, icon] = await Promise.all([ensureFont(), loadImage(m.thumb), loadImage("homepage/assets/ui/icon-xuc-xac-6.png")]);
  const cv = document.createElement("canvas");
  cv.width = cv.height = CARD_SIZE;
  const ctx = cv.getContext("2d");
  const measure = (t, f) => { ctx.font = f; return ctx.measureText(t).width; };
  const L = layoutCard(m, measure, thumb ? { w: thumb.naturalWidth, h: thumb.naturalHeight } : null);
  drawCard(ctx, L, m, { thumb, icon });
  return canvasBlob(cv);
}

/** Ảnh xem trước link 1200×630 (Open Graph). opts = { game?, title, subtitle?, thumb?, type?: "image/jpeg", quality? } */
export async function makeBanner(opts = {}) {
  const m = normalizeOpts({ ...opts, title: opts.title || gameMeta(opts.game).name });
  const T = THEMES[m.theme];
  const [, thumb, icon] = await Promise.all([ensureFont(), loadImage(m.thumb), loadImage("homepage/assets/ui/icon-xuc-xac-6.png")]);
  const W = 1200, H = 630, cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d");
  drawBackground(ctx, W, H, T);
  pxBox(ctx, 30, 30, W - 60, H - 60, { fill: T.panel, line: T.line, b: 6, shadow: T.shadow, sx: 10, sy: 12, hi: "rgba(255,255,255,.07)", lo: "rgba(0,0,0,.3)" });
  ctx.fillStyle = m.accent; ctx.fillRect(30, 30, W - 60, 6);
  let tx = 84;
  if (thumb) {
    // Thumbnail phóng/thu nguyên bội; rộng quá 600 px thì cắt bớt hai bên (giữ nét) để chừa chỗ cho chữ
    const maxW = 600, maxH = 546, nw = thumb.naturalWidth, nh = thumb.naturalHeight;
    let s = maxH / nh;
    s = s >= 1 ? Math.floor(s) : 1 / Math.ceil(1 / s);
    const dh = Math.round(nh * s), dw = Math.min(maxW, Math.round(nw * s));
    const sw = dw / s, sx = (nw - sw) / 2;
    const x = 54, y = Math.round((H - dh) / 2);
    pxBox(ctx, x, y, dw, dh, { fill: T.inset, line: T.line, b: 6, shadow: T.shadow, sx: 8, sy: 10 });
    ctx.imageSmoothingEnabled = s < 1;
    ctx.drawImage(thumb, sx, 0, sw, nh, x, y, dw, dh);
    ctx.imageSmoothingEnabled = false;
    tx = x + dw + 44;
  }
  const tw = W - 66 - tx;
  const cx = tx + tw / 2;
  drawLogoCentered(ctx, cx, 112, icon, T);
  // tên game
  let size = 76, lines;
  const fits = (px, maxLines) => {
    ctx.font = font(800, px);
    const ls = wrapText(m.title, tw, (t) => ctx.measureText(t).width, 9);
    return ls.length <= maxLines && ls.every((l) => ctx.measureText(l).width <= tw) ? ls : null;
  };
  for (;;) { lines = fits(size, size >= 56 ? 2 : 3); if (lines || size <= 40) break; size -= 4; }
  if (!lines) { ctx.font = font(800, size); lines = wrapText(m.title, tw, (t) => ctx.measureText(t).width, 3); }
  const lh = Math.round(size * 1.12);
  const sub = clean(opts.subtitle || "Chơi miễn phí, không cần tải", 60);
  ctx.font = font(700, 28);
  const subLines = wrapText(sub, tw, (t) => ctx.measureText(t).width, 2);
  const btnTop = H - 54 - 30 - 64, top = 160;
  const blockH = lines.length * lh + 20 + subLines.length * 38;
  let y = Math.round(top + (btnTop - 16 - top - blockH) / 2);
  ctx.font = font(800, size); ctx.textAlign = "center"; ctx.textBaseline = "top";
  lines.forEach((l, i) => hardText(ctx, l, cx, y + i * lh, T.ink, T.shadow, 4));
  y += lines.length * lh + 20;
  ctx.font = font(700, 28); ctx.fillStyle = T.tealInk;
  subLines.forEach((l, i) => ctx.fillText(l, cx, y + i * 38));
  // nút giả "CHƠI NGAY"
  ctx.font = font(800, 30);
  const bw = Math.ceil(ctx.measureText("CHƠI NGAY").width) + 64, bh = 64, bx = Math.round(cx - bw / 2), by = btnTop;
  pxBox(ctx, bx, by, bw, bh, { fill: GOLD, line: "#6b4a12", b: 5, shadow: T.shadow, sx: 6, sy: 7, hi: "#ffe2a4", lo: "rgba(0,0,0,.2)" });
  ctx.fillStyle = "#30250f"; ctx.textBaseline = "middle"; ctx.fillText("CHƠI NGAY", cx, by + bh / 2 + 2);
  return canvasBlob(cv, opts.type, opts.quality);
}

function drawLogoCentered(ctx, cx, y, icon, T) {
  ctx.font = font(800, 44);
  const tw = ctx.measureText("LỤM KÈO").width + (icon ? 48 + 14 : 0);
  ctx.save();
  const x = Math.round(cx - tw / 2);
  if (icon) { ctx.imageSmoothingEnabled = false; ctx.drawImage(icon, x, y - 24, 48, 48); }
  ctx.textAlign = "left"; ctx.textBaseline = "middle";
  hardText(ctx, "LỤM KÈO", x + (icon ? 62 : 0), y + 2, GOLD, T.shadow, 3);
  ctx.restore();
}

// ───────────── nhóm cộng đồng (prototype/homepage/community.js) ─────────────
let communityP = null;
export function loadCommunity() {
  if (window.COMMUNITY) return Promise.resolve(window.COMMUNITY);
  if (communityP) return communityP;
  communityP = new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = assetUrl("homepage/community.js");
    s.onload = () => resolve(window.COMMUNITY || {});
    s.onerror = () => resolve({});
    document.head.appendChild(s);
    setTimeout(() => resolve(window.COMMUNITY || {}), 4000);
  });
  return communityP;
}

// ───────────────────────── bảng chia sẻ ─────────────────────────
const isTouchPhone = () => {
  try { return matchMedia("(pointer: coarse)").matches && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent); } catch { return false; }
};
const canShareFile = (file) => { try { return !!(navigator.share && navigator.canShare && navigator.canShare({ files: [file] })); } catch { return false; } };

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch {}
  try {
    const ta = document.createElement("textarea");
    ta.value = text; ta.setAttribute("readonly", ""); ta.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0";
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch { return false; }
}

function downloadBlob(blob, name) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 30000);
}

const PANEL_CSS = `
.lk-share{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:16px;background:rgba(5,10,18,.78);
  font-family:${FONT_FAMILY};color:#f5f2e8;-webkit-tap-highlight-color:transparent}
.lk-share *{box-sizing:border-box}
.lk-share__box{--b:#0a111c;position:relative;width:min(420px,100%);max-height:calc(100dvh - 32px);overflow:auto;background:#182638;padding:16px;
  box-shadow:inset 0 2px 0 rgba(255,255,255,.08),inset 0 -2px 0 rgba(0,0,0,.35),0 -3px 0 0 var(--b),0 3px 0 0 var(--b),-3px 0 0 0 var(--b),3px 0 0 0 var(--b),6px 8px 0 0 #050a12;
  border-top:4px solid var(--lk-accent,#f7c96d)}
.lk-share__head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 12px}
.lk-share .lk-share__title{margin:0;padding:0;border:0;background:none;color:#f5f2e8;font-family:inherit;line-height:1.2;font-size:18px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;text-shadow:2px 2px 0 #050a12}
.lk-share__x{all:unset;cursor:pointer;display:grid;place-items:center;width:40px;height:40px;font-size:22px;font-weight:800;color:#b5c2d2;background:#111b2a;
  box-shadow:0 -3px 0 0 #0a111c,0 3px 0 0 #0a111c,-3px 0 0 0 #0a111c,3px 0 0 0 #0a111c}
.lk-share__x:focus-visible,.lk-share__btn:focus-visible,.lk-share__comm a:focus-visible{outline:2px solid #f7c96d;outline-offset:4px}
.lk-share .lk-share__img{display:block;width:min(300px,100%,36dvh);height:auto;max-width:none;aspect-ratio:1;object-fit:contain;margin:0 auto 14px;padding:0;border:0;background:#111b2a;
  box-shadow:0 -3px 0 0 #0a111c,0 3px 0 0 #0a111c,-3px 0 0 0 #0a111c,3px 0 0 0 #0a111c,4px 5px 0 0 #050a12}
.lk-share__grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:3px}
.lk-share__btn{--b:#0a111c;all:unset;box-sizing:border-box;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;min-height:46px;padding:8px 10px;
  font:800 14px/1.2 ${FONT_FAMILY};text-transform:uppercase;letter-spacing:.04em;text-align:center;color:#f5f2e8;background:linear-gradient(#2c4059 0 3px,#22344b 3px);
  box-shadow:inset 0 -2px 0 rgba(0,0,0,.35),0 -3px 0 0 var(--b),0 3px 0 0 var(--b),-3px 0 0 0 var(--b),3px 0 0 0 var(--b),3px 4px 0 0 #050a12}
.lk-share__btn:active{transform:translate(3px,3px);box-shadow:0 -3px 0 0 var(--b),0 3px 0 0 var(--b),-3px 0 0 0 var(--b),3px 0 0 0 var(--b)}
.lk-share__btn--main{grid-column:1/-1;color:#30250f;background:linear-gradient(#ffe2a4 0 3px,#f7c96d 3px);--b:#6b4a12}
.lk-share__btn--fb{background:linear-gradient(#5d86d6 0 3px,#3b64b5 3px);--b:#14274d}
.lk-share__btn--zalo{background:linear-gradient(#4aa3ff 0 3px,#0068ff 3px);--b:#002a66}
.lk-share__btn--ms{background:linear-gradient(#b48cff 0 3px,#8b5cf6 3px);--b:#2e1766}
.lk-share .lk-share__msg{padding:0;font-family:inherit;min-height:20px;margin:12px 2px 0;font-size:14px;line-height:1.4;color:#c6f7ea}
.lk-share .lk-share__comm{color:#f5f2e8;font-family:inherit;margin:12px 0 0;padding:10px 12px;background:#111b2a;font-size:14px;font-weight:700;display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center}
.lk-share__comm[hidden]{display:none}
.lk-share__comm a{color:#f7c96d;text-decoration:underline;text-underline-offset:3px}
@media (prefers-reduced-motion:no-preference){.lk-share__box{animation:lk-share-in .14s steps(3) both}}
@keyframes lk-share-in{from{transform:translateY(12px);opacity:0}}
`;

let openPanel = null;
/** Bảng chia sẻ dự phòng (máy tính, hoặc điện thoại không chia sẻ được tệp). Trả về Promise khi đóng. */
export function showSharePanel({ blob, file, m, text, community = [], afterShare = false }) {
  if (openPanel) openPanel.close();
  if (!document.getElementById("lk-share-css")) {
    const st = document.createElement("style"); st.id = "lk-share-css"; st.textContent = PANEL_CSS; document.head.appendChild(st);
  }
  const prevFocus = document.activeElement;
  const root = document.createElement("div");
  root.className = "lk-share";
  root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-labelledby", "lk-share-title");
  root.dataset.game = m.game;
  const imgUrl = URL.createObjectURL(blob);
  const native = canShareFile(file);
  const phone = isTouchPhone();
  root.innerHTML = `
    <div class="lk-share__box" style="--lk-accent:${m.accent}">
      <div class="lk-share__head"><h2 class="lk-share__title" id="lk-share-title">Khoe kết quả</h2>
        <button class="lk-share__x" type="button" data-act="close" aria-label="Đóng">×</button></div>
      <img class="lk-share__img" alt="Ảnh kết quả ${m.name}: ${m.title}" src="${imgUrl}" width="1080" height="1080" />
      <div class="lk-share__grid">
        ${native ? `<button class="lk-share__btn lk-share__btn--main" type="button" data-act="native">Chia sẻ…</button>` : ""}
        <button class="lk-share__btn ${native ? "" : "lk-share__btn--main"}" type="button" data-act="download">Tải ảnh</button>
        <button class="lk-share__btn" type="button" data-act="copy">Chép link</button>
        <button class="lk-share__btn lk-share__btn--fb" type="button" data-act="facebook">Facebook</button>
        ${phone ? `<button class="lk-share__btn lk-share__btn--ms" type="button" data-act="messenger">Messenger</button>` : ""}
        <button class="lk-share__btn lk-share__btn--zalo" type="button" data-act="zalo">Zalo</button>
      </div>
      <p class="lk-share__msg" role="status" aria-live="polite"></p>
      <p class="lk-share__comm" hidden></p>
    </div>`;
  const msg = root.querySelector(".lk-share__msg");
  const comm = root.querySelector(".lk-share__comm");
  const say = (t) => { msg.textContent = t; };
  const fileName = `lumkeo-${m.game || "ket-qua"}.png`;
  const shared = () => {
    if (!community.length || !comm.hidden) return;
    comm.textContent = "Vào nhóm Lụm Kèo:";
    for (const c of community) {
      const a = document.createElement("a");
      a.href = c.url; a.target = "_blank"; a.rel = "noopener"; a.textContent = c.label; a.dataset.comm = c.key;
      comm.appendChild(a);
    }
    comm.hidden = false;
  };
  const actions = {
    close: () => close(),
    native: async () => {
      try { await navigator.share({ files: [file], text, url: m.url }); say("Đã chia sẻ!"); shared(); }
      catch (e) { if (e?.name !== "AbortError") say("Không mở được bảng chia sẻ — thử Tải ảnh rồi gửi nhé."); }
    },
    download: () => { downloadBlob(blob, fileName); say("Đã tải ảnh — đăng kèm link để bạn bè vào chơi nhé."); shared(); },
    copy: async () => { say((await copyText(`${text} ${m.url}`)) ? "Đã chép link! Dán vào tin nhắn là xong." : `Chép tay giúp mình: ${m.url}`); shared(); },
    facebook: () => { window.open(facebookShareUrl(m.url), "_blank", "noopener,width=640,height=560"); say("Đang mở Facebook… nhớ đăng kèm ảnh vừa tải cho xịn."); shared(); },
    messenger: () => { location.href = messengerShareUrl(m.url); say("Đang mở Messenger…"); shared(); },
    zalo: async () => {
      const ok = await copyText(`${text} ${m.url}`);
      say(ok ? "Đã chép link. Mở Zalo, dán vào cuộc trò chuyện (gửi kèm ảnh vừa tải) là xong!" : `Mở Zalo và dán link này: ${m.url}`);
      shared();
    },
  };
  root.addEventListener("click", (e) => {
    if (e.target === root) return close();
    const b = e.target.closest("[data-act]");
    if (b && actions[b.dataset.act]) actions[b.dataset.act]();
  });
  // Không để phím trong bảng lọt xuống game (Space/Enter/mũi tên)
  const onKey = (e) => {
    if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (e.key === "Tab") {
      const f = [...root.querySelectorAll("button, a[href]")].filter((el) => !el.closest("[hidden]"));
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
    e.stopPropagation();
  };
  root.addEventListener("keydown", onKey);
  root.addEventListener("keyup", (e) => e.stopPropagation());
  let done;
  const closed = new Promise((r) => (done = r));
  function close() {
    root.remove(); URL.revokeObjectURL(imgUrl); openPanel = null;
    try { prevFocus?.focus?.({ preventScroll: true }); } catch {}
    done();
  }
  document.body.appendChild(root);
  if (afterShare) { say("Đã chia sẻ!"); shared(); }
  root.querySelector(".lk-share__btn").focus({ preventScroll: true });
  openPanel = { close, root };
  return { close, root, closed };
}

/**
 * Khoe kết quả: tạo ảnh rồi chia sẻ. Điện thoại có bảng chia sẻ hệ thống ⇒ navigator.share({files,text,url});
 * còn lại (hoặc bị từ chối) ⇒ bảng nhỏ pixel V5: Tải ảnh · Chép link · Facebook · Messenger (điện thoại) · Zalo.
 * opts thêm: native?: false (luôn dùng bảng), onDone?(kết quả).
 */
export async function shareResult(opts = {}) {
  const m = normalizeOpts(opts);
  const text = shareText(opts);
  let blob;
  try { blob = await makeCard(opts); } catch (e) { console.warn("[share] không tạo được ảnh", e); return "error"; }
  const file = new File([blob], `lumkeo-${m.game || "ket-qua"}.png`, { type: "image/png" });
  const community = communityLinks(await Promise.race([loadCommunity(), new Promise((r) => setTimeout(() => r({}), 1500))]));
  if (opts.native !== false && isTouchPhone() && canShareFile(file)) {
    try {
      await navigator.share({ files: [file], text, url: m.url });
      // Sau khi chia sẻ xong: có nhóm cộng đồng thì mở bảng nhỏ với dòng "Vào nhóm Lụm Kèo"
      if (community.length) showSharePanel({ blob, file, m, text, community, afterShare: true });
      return "native";
    } catch (e) {
      if (e?.name === "AbortError") return "cancelled";
      // NotAllowedError (mất "cú bấm" do tạo ảnh lâu) ⇒ rơi xuống bảng, trong bảng có nút "Chia sẻ…" bấm lại được
    }
  }
  showSharePanel({ blob, file, m, text, community });
  return "panel";
}
