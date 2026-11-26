// Vẽ thẻ Nhật Ký Làm Chủ 1080×1350 (canvas cùng nguồn ⇒ xuất PNG được). Nội dung từ core/journal.js journalCard. Chép ui/journal.js của Tiệm Bánh Mì.
// Nền: assets/journal-card.webp (Codex đợt 2) khi manifest có; chưa có thì vẽ nền dự phòng bằng canvas (kem, khung nâu, vùng ảnh cắt từ cảnh quán).
// Khung đầu (70..1010 × 60..175): "Lụm Kèo · Nhật Ký Làm Chủ", tên quán và ngày. Vùng ảnh 60..1020 × 210..850. Vùng kem dưới (40..1040 × 885..1320):
// câu chốt ngày, câu trích, ba số, lumkeo.com. Chữ dài tự xuống dòng và thu cỡ.
import { journalCard } from "../core/journal.js?v=c8";

export const CARD_W = 1080, CARD_H = 1350;
const FONT = '"Be Vietnam Pro", system-ui, sans-serif';
let bgImg = null, bgSrc = null;
/** Gọi một lần lúc khởi động: có journal-card trong manifest thì dùng ảnh thật. */
export function setJournalBg(src) { bgSrc = src; bgImg = null; }
export const journalBg = () => bgSrc;
function loadBg() {
  if (!bgSrc) return Promise.resolve(null);
  if (bgImg) return bgImg;
  bgImg = new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = bgSrc; });
  return bgImg;
}
function sceneCrop(ctx, scene) {
  if (!scene) return;
  try {
    ctx.imageSmoothingEnabled = false;
    const sw = scene.naturalWidth || scene.width, sh = scene.naturalHeight || scene.height;
    if (!sw || !sh) return;
    const cw = Math.min(sw, sh * 1.5);
    ctx.drawImage(scene, (sw - cw) / 2, 0, cw, cw / 1.5, 60, 210, 960, 640);
  } catch { /* ảnh chưa tải: bỏ qua */ }
}
/** Nền dự phòng: kem + khung nâu + vùng ảnh (cắt cảnh) ở nửa trên + dải than đỏ. */
function fallbackBg(ctx, scene) {
  ctx.fillStyle = "#fff2dc"; ctx.fillRect(0, 0, CARD_W, CARD_H);
  ctx.fillStyle = "#7a4a30"; ctx.fillRect(0, 0, CARD_W, 24); ctx.fillRect(0, CARD_H - 24, CARD_W, 24); ctx.fillRect(0, 0, 24, CARD_H); ctx.fillRect(CARD_W - 24, 0, 24, CARD_H);
  // dĩa cơm tấm nhỏ (biểu tượng góc)
  ctx.fillStyle = "#e3a04a"; ctx.fillRect(60, 60, 90, 90);
  ctx.fillStyle = "#fff2dc"; ctx.fillRect(72, 84, 66, 42);
  ctx.fillStyle = "#a4522a"; ctx.fillRect(96, 92, 34, 18);
  ctx.fillStyle = "#1c1a3a"; ctx.fillRect(60, 210, 960, 640);
  sceneCrop(ctx, scene);
  ctx.fillStyle = "#c2361e"; ctx.fillRect(60, 842, 960, 8);
  ctx.strokeStyle = "#7a4a30"; ctx.lineWidth = 8; ctx.strokeRect(60, 210, 960, 640);
}

function wrap(ctx, text, maxW) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let cur = "";
  for (const w of words) {
    const t = cur ? cur + " " + w : w;
    if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}
/** Viết đoạn chữ trong hộp: giảm cỡ cho tới khi vừa số dòng tối đa. Trả y cuối. */
function block(ctx, text, { x, y, w, size, min = 22, weight = 700, color, maxLines = 3, lh = 1.28, align = "left", style = "" }) {
  let s = size, lines = [];
  for (; s >= min; s -= 2) {
    ctx.font = `${style} ${weight} ${s}px ${FONT}`;
    lines = wrap(ctx, text, w);
    if (lines.length <= maxLines) break;
  }
  s = Math.max(s, min);
  if (lines.length > maxLines) { lines = lines.slice(0, maxLines); lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, "…"); }
  ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = "top";
  const ax = align === "center" ? x + w / 2 : align === "right" ? x + w : x;
  lines.forEach((ln, i) => ctx.fillText(ln, ax, y + i * s * lh));
  return y + lines.length * s * lh;
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

/** Vẽ thẻ cho một ngày Nhật Ký (s.journal[i]). opts = { shopName, hideName, moment, scene }. Trả nội dung thẻ (để test / e2e đọc câu trích). */
export async function drawJournal(canvas, entry, opts = {}) {
  const card = journalCard(entry, opts);
  canvas.width = CARD_W; canvas.height = CARD_H;
  const ctx = canvas.getContext("2d");
  try { await document.fonts?.ready; } catch { /* không có font API */ }
  const bg = await loadBg();
  ctx.fillStyle = "#fff2dc"; ctx.fillRect(0, 0, CARD_W, CARD_H);
  if (bg) { ctx.imageSmoothingEnabled = false; ctx.drawImage(bg, 0, 0, CARD_W, CARD_H); sceneCrop(ctx, opts.scene); }
  else fallbackBg(ctx, opts.scene || null);
  const ink = "#3b2618", indigo = "#2c3a78", moss = "#2f5a50", brown = "#7a4a30";
  // khung đầu
  ctx.textBaseline = "top";
  ctx.font = `800 54px ${FONT}`; ctx.fillStyle = indigo; ctx.textAlign = "left";
  ctx.fillText(card.brand, 170, 76);
  const bw = ctx.measureText(card.brand).width;
  ctx.font = `700 30px ${FONT}`; ctx.fillStyle = brown;
  ctx.fillText("· " + card.title, 170 + bw + 16, 96);
  block(ctx, card.shop ? `${card.shop} · ${card.day}` : card.day, { x: 170, y: 136, w: 800, size: 28, min: 18, weight: 700, color: moss, maxLines: 1 });
  // vùng dưới
  // ngân sách chữ: 895..1160 (ba số bắt đầu ở 1168): câu chốt ≤ 2 dòng, câu trích ≤ 2 dòng, người nói 1 dòng
  let y = 895;
  y = block(ctx, card.headline, { x: 90, y, w: 900, size: 42, min: 26, weight: 800, color: ink, maxLines: 2, lh: 1.22 }) + 12;
  ctx.fillStyle = "rgba(122,74,48,.35)"; ctx.fillRect(90, y, 900, 3); y += 14;
  y = block(ctx, "“" + card.quote + "”", { x: 90, y, w: 900, size: 30, min: 20, weight: 600, color: indigo, maxLines: 2, lh: 1.22, style: "italic" });
  if (card.who) block(ctx, "— " + card.who, { x: 90, y: Math.min(y + 2, 1132), w: 900, size: 22, min: 16, weight: 700, color: brown, maxLines: 1, align: "right" });
  // ba số
  const sy = 1168, bw3 = 280;
  card.stats.forEach((st, i) => {
    const x = 90 + i * (bw3 + 30);
    ctx.fillStyle = "rgba(255,250,240,.94)";
    roundRect(ctx, x, sy, bw3, 96, 18); ctx.fill();
    ctx.strokeStyle = "rgba(122,74,48,.35)"; ctx.lineWidth = 3; ctx.stroke();
    ctx.textAlign = "center"; ctx.fillStyle = brown; ctx.font = `700 24px ${FONT}`; ctx.fillText(st.label, x + bw3 / 2, sy + 12);
    ctx.fillStyle = i === 1 && st.value.startsWith("−") ? "#9a3a2a" : moss; ctx.font = `800 42px ${FONT}`; ctx.fillText(st.value, x + bw3 / 2, sy + 42);
  });
  ctx.textAlign = "right"; ctx.fillStyle = indigo; ctx.font = `800 28px ${FONT}`; ctx.fillText(card.footer, 1000, 1282);
  ctx.textAlign = "left"; ctx.fillStyle = brown; ctx.font = `700 24px ${FONT}`; ctx.fillText(card.game, 90, 1284);
  return card;
}

export const toBlob = (canvas) => new Promise((ok) => canvas.toBlob((b) => ok(b), "image/png"));
export async function download(canvas, name) {
  const b = await toBlob(canvas);
  if (!b) return false;
  const url = URL.createObjectURL(b);
  const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return true;
}
/** Chia sẻ qua thiết bị nếu hỗ trợ file, ngược lại trả false (UI tải PNG thay). */
export async function share(canvas, name, text) {
  const b = await toBlob(canvas);
  if (!b || !navigator.canShare) return false;
  const file = new File([b], name, { type: "image/png" });
  if (!navigator.canShare({ files: [file] })) return false;
  try { await navigator.share({ files: [file], text, title: "Nhật Ký Làm Chủ" }); return true; } catch { return false; }
}
