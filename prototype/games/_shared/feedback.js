// Phản hồi chung cho mọi trang Lụm Kèo: bấm nút ⇒ lún xuống (chiều sâu) + tiếng "tách"; gửi chat ⇒ tiếng "vút".
// Nhúng: <script type="module" src="../_shared/feedback.js"></script>. Tôn trọng khoá tắt tiếng chung "wgp.muted".
// Dùng thuộc tính CSS `translate`/`scale` (độc lập với `transform`) nên không phá nút đang được căn giữa bằng transform.
// Bỏ qua một phần tử: thêm data-nosfx (không tiếng) hoặc data-nopress (không lún). data-nosfx đặt trên vùng cha ⇒ cả vùng im (game có tiếng riêng).

const BTN = 'button, .btn, .px-btn, [role="button"], a.btn, a.px-link, input[type="submit"]';

const css = document.createElement("style");
css.textContent = `
:where(${BTN}):not(:disabled):not([aria-disabled="true"]):not([data-nopress]) {
  transition: translate .07s ease-out, scale .07s ease-out, filter .07s ease-out;
}
:where(${BTN}):not(:disabled):not([aria-disabled="true"]):not([data-nopress]):active,
:where(${BTN}).wgp-press {
  translate: 0 2px; scale: .97; filter: brightness(.88);
}
@media (prefers-reduced-motion: reduce) {
  :where(${BTN}):active, :where(${BTN}).wgp-press { translate: none; scale: none; }
}`;
document.head.appendChild(css);

const muted = () => { try { return localStorage.getItem("wgp.muted") === "1"; } catch { return false; } };
let ac = null;
function ctx() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ac) ac = new AC();
  if (ac.state === "suspended") ac.resume().catch(() => {});
  return ac;
}
function tone(f0, f1, dur, vol, type = "square", delay = 0) {
  const a = ctx(); if (!a) return;
  const t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
}
/** Nốt "bụp" êm: vào tiếng 6 ms (không có tiếng tạch ở đầu), tắt dần, trượt tần số xuống. */
function thump(f0, f1, dur, vol, type = "sine", delay = 0) {
  const a = ctx(); if (!a) return;
  const t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
}
const SOUNDS = {
  click: () => { tone(1400, 700, 0.035, 0.07, "square"); tone(240, 160, 0.05, 0.08, "triangle"); },
  // Trang chủ (<html data-click-sfx="bup">): "bụp" trầm, mềm — khác tiếng "tách" trong game
  // Loa điện thoại gần như không phát < ~150 Hz ⇒ thân tiếng 300→120 Hz + lớp "bốp" 700→320 Hz cho nghe rõ mà vẫn tròn.
  bup: () => { thump(300, 120, 0.12, 0.42, "sine"); thump(700, 320, 0.04, 0.14, "triangle"); },
  sent: () => { tone(500, 1500, 0.11, 0.08, "triangle"); tone(1500, 2100, 0.06, 0.05, "sine", 0.09); },
};
const lastPlay = {};
export function play(name) {
  const now = performance.now(); if (now - (lastPlay[name] || 0) < 150) return; lastPlay[name] = now; // Enter trong form chat còn "bấm" nút Gửi ⇒ không kêu 2 lần
  if (!muted() && SOUNDS[name]) try { SOUNDS[name](); } catch {}
}

/** Tiếng bấm của trang: mặc định "click"; trang đặt <html data-click-sfx="bup"> để dùng tiếng khác. */
export const clickName = () => (SOUNDS[document.documentElement.dataset.clickSfx] ? document.documentElement.dataset.clickSfx : "click");
const usable = (el) => el && !el.disabled && el.getAttribute("aria-disabled") !== "true";
let lastAt = 0;
function clickFx(el) {
  if (!usable(el) || el.closest("[data-nosfx]")) return;
  const now = performance.now(); if (now - lastAt < 40) return; lastAt = now; // chạm + click giả không kêu 2 lần
  play(clickName());
}
// Chuột: kêu ngay khi nhấn. Cảm ứng: kêu khi NHẤC tay, chỉ khi ngón chưa di quá 10 px, trang chưa cuộn và trình
// duyệt chưa huỷ chạm (pointercancel = nó nhận cuộn) ⇒ lướt qua nút không kêu.
let pend = null; // { el, id, x, y }
addEventListener("pointerdown", (e) => {
  if (e.pointerType === "mouse") { if (e.button === 0) clickFx(e.target.closest(BTN)); return; }
  const el = e.target.closest(BTN);
  pend = usable(el) ? { el, id: e.pointerId, x: e.clientX, y: e.clientY } : null;
}, true);
addEventListener("pointermove", (e) => {
  if (pend && e.pointerId === pend.id && Math.hypot(e.clientX - pend.x, e.clientY - pend.y) > 10) pend = null;
}, { capture: true, passive: true });
addEventListener("pointercancel", () => { pend = null; }, true);
addEventListener("scroll", () => { pend = null; }, { capture: true, passive: true });
addEventListener("pointerup", (e) => {
  if (!pend || e.pointerId !== pend.id) return;
  const { el } = pend; pend = null;
  if (el.closest("[data-nosfx]")) return;
  const now = performance.now(); if (now - lastAt < 40) return; lastAt = now;
  play(clickName()); // nút có thể vừa bị khoá/ẩn bởi chính lần bấm này ⇒ không kiểm usable lại
}, true);
addEventListener("keydown", (e) => {
  const el = document.activeElement;
  if ((e.key === "Enter" || e.key === " ") && el && el.matches?.(BTN) && !e.repeat) {
    clickFx(el); el.classList.add("wgp-press"); setTimeout(() => el.classList.remove("wgp-press"), 110);
  }
  // Enter trong ô chat ⇒ gửi tin
  if (e.key === "Enter" && !e.shiftKey && !e.isComposing && isChatInput(el) && el.value.trim()) play("sent");
}, true);
// Bấm nút Gửi của khung chat
addEventListener("click", (e) => {
  const b = e.target.closest("button, input[type=submit]");
  if (!b || !usable(b)) return;
  const box = chatBox(b); if (!box) return;
  const inp = box.querySelector("input[type=text], input:not([type]), textarea");
  if (inp && inp.value.trim() && /gửi|send/i.test(b.textContent + (b.getAttribute("aria-label") || "") + (b.value || ""))) play("sent");
}, true);
function chatBox(el) { return el.closest('[class*="chat" i], [id*="chat" i], [class*="Chat"], form[aria-label*="tin" i]'); }
function isChatInput(el) { return !!el && /^(INPUT|TEXTAREA)$/.test(el.tagName) && !!chatBox(el) && !el.closest("form[data-nochatsfx]"); }
