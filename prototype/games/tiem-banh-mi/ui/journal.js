// Vẽ thẻ Nhật Ký Làm Chủ 1080×1350 (canvas cùng nguồn ⇒ xuất PNG được). Nội dung từ core/journal.js.
// Nền: assets/journal-card.webp (Codex đợt 2) khi manifest có; chưa có thì vẽ nền dự phòng bằng canvas (kem, khung nâu, vùng ảnh cảnh).
// Khung đầu (70..1010 × 60..175): "Lụm Kèo · Nhật Ký Làm Chủ", tên tiệm và ngày. Vùng kem dưới (40..1040 × 885..1320): câu meme,
// câu trích, ba số, lumkeo.com. Chữ dài tự xuống dòng và thu cỡ.
import { journalCard } from "../core/journal.js?v=b5";

export const CARD_W = 1080, CARD_H = 1350;
const FONT = '"Be Vietnam Pro", system-ui, sans-serif';
let bgImg = null, bgSrc = null;
/** Gọi một lần lúc khởi động: có journal-card trong manifest thì dùng ảnh thật. */
export function setJournalBg(src) { bgSrc = src; bgImg = null; }
function loadBg() {
  if (!bgSrc) return Promise.resolve(null);
  if (bgImg) return bgImg;
  bgImg = new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = bgSrc; });
  return bgImg;
}
/** Nền dự phòng: kem + khung nâu + vùng ảnh (crop cảnh) ở nửa trên. scene = ảnh / canvas cảnh để crop (tuỳ chọn). */
function fallbackBg(ctx, scene) {
  ctx.fillStyle = "#fff2dc"; ctx.fillRect(0, 0, CARD_W, CARD_H);
  ctx.fillStyle = "#80543a"; ctx.fillRect(0, 0, CARD_W, 24); ctx.fillRect(0, CARD_H - 24, CARD_W, 24); ctx.fillRect(0, 0, 24, CARD_H); ctx.fillRect(CARD_W - 24, 0, 24, CARD_H);
  ctx.fillStyle = "#e3a04a"; ctx.fillRect(60, 60, 90, 90);
  ctx.fillStyle = "#fff2dc"; ctx.fillRect(78, 96, 54, 20);
  ctx.fillStyle = "#22344a"; ctx.fillRect(60, 210, 960, 640);
  if (scene) { try { ctx.imageSmoothingEnabled = false; const sw = scene.naturalWidth || scene.width, sh = scene.naturalHeight || scene.height; const cw = Math.min(sw, sh * 1.5); ctx.drawImage(scene, (sw - cw) / 2, 0, cw, cw / 1.5, 60, 210, 960, 640); } catch {} }
  ctx.strokeStyle = "#80543a"; ctx.lineWidth = 8; ctx.strokeRect(60, 210, 960, 640);
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
  let s = size, lines;
  for (; s >= min; s -= 2) {
    ctx.font = `${style} ${weight} ${s}px ${FONT}`;
    lines = wrap(ctx, text, w);
    if (lines.length <= maxLines) break;
  }
  if (lines.length > maxLines) { lines = lines.slice(0, maxLines); lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, "…"); }
  ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = "top";
  const ax = align === "center" ? x + w / 2 : align === "right" ? x + w : x;
  lines.forEach((ln, i) => ctx.fillText(ln, ax, y + i * s * lh));
  return y + lines.length * s * lh;
}

export async function drawJournal(canvas, sum, opts = {}) {
  const card = journalCard(sum, opts);
  canvas.width = CARD_W; canvas.height = CARD_H;
  const ctx = canvas.getContext("2d");
  try { await document.fonts?.ready; } catch {}
  const bg = await loadBg();
  ctx.fillStyle = "#fff2dc"; ctx.fillRect(0, 0, CARD_W, CARD_H);
  if (bg) ctx.drawImage(bg, 0, 0, CARD_W, CARD_H);
  else fallbackBg(ctx, opts.scene || null);
  if (bg && opts.scene) { try { ctx.imageSmoothingEnabled = false; const sc = opts.scene, sw = sc.naturalWidth || sc.width, sh = sc.naturalHeight || sc.height, cw = Math.min(sw, sh * 1.5); ctx.drawImage(sc, (sw - cw) / 2, 0, cw, cw / 1.5, 60, 210, 960, 640); } catch {} }
  const ink = "#3b2618", plum = "#71364e", teal = "#29625c", caramel = "#80543a";
  // khung đầu
  ctx.textBaseline = "top";
  ctx.font = `800 54px ${FONT}`; ctx.fillStyle = plum; ctx.textAlign = "left";
  ctx.fillText(card.brand, 170, 76);
  const bw = ctx.measureText(card.brand).width;
  ctx.font = `700 30px ${FONT}`; ctx.fillStyle = caramel;
  ctx.fillText("· " + card.title, 170 + bw + 16, 96);
  const right = card.shop ? `${card.shop} · ${card.day}` : card.day;
  block(ctx, right, { x: 170, y: 136, w: 740, size: 28, min: 18, weight: 700, color: teal, maxLines: 1 });
  // vùng dưới
  let y = 910;
  y = block(ctx, card.headline, { x: 90, y, w: 900, size: 46, min: 30, weight: 800, color: ink, maxLines: 3 }) + 18;
  ctx.fillStyle = "rgba(128,84,58,.35)"; ctx.fillRect(90, y, 900, 3); y += 22;
  y = block(ctx, "“" + card.quote + "”", { x: 90, y, w: 900, size: 34, min: 24, weight: 600, color: plum, maxLines: 3, style: "italic" });
  if (card.who) { ctx.font = `700 26px ${FONT}`; ctx.fillStyle = caramel; ctx.textAlign = "right"; ctx.fillText("— " + card.who, 990, y + 6); }
  // ba số
  const sy = 1168, bw3 = 280;
  card.stats.forEach((st, i) => {
    const x = 90 + i * (bw3 + 30);
    ctx.fillStyle = "rgba(255,250,240,.92)";
    roundRect(ctx, x, sy, bw3, 96, 18); ctx.fill();
    ctx.strokeStyle = "rgba(128,84,58,.35)"; ctx.lineWidth = 3; ctx.stroke();
    ctx.textAlign = "center"; ctx.fillStyle = caramel; ctx.font = `700 24px ${FONT}`; ctx.fillText(st.label, x + bw3 / 2, sy + 12);
    ctx.fillStyle = i === 1 && st.value.startsWith("−") ? "#b8463c" : teal; ctx.font = `800 42px ${FONT}`; ctx.fillText(st.value, x + bw3 / 2, sy + 42);
  });
  ctx.textAlign = "right"; ctx.fillStyle = plum; ctx.font = `800 28px ${FONT}`; ctx.fillText(card.footer, 1000, 1282);
  ctx.textAlign = "left"; ctx.fillStyle = caramel; ctx.font = `700 24px ${FONT}`; ctx.fillText("Tiệm Bánh Mì · Tập Làm Chủ", 90, 1284);
  return card;
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
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
/** Chia sẻ qua thiết bị nếu hỗ trợ file, ngược lại trả false (UI dùng nút tải PNG). */
export async function share(canvas, name, text) {
  const b = await toBlob(canvas);
  if (!b || !navigator.canShare) return false;
  const file = new File([b], name, { type: "image/png" });
  if (!navigator.canShare({ files: [file] })) return false;
  try { await navigator.share({ files: [file], text, title: "Nhật Ký Làm Chủ" }); return true; } catch { return false; }
}
