// Phản hồi chung cho mọi trang Lụm Kèo: bấm nút ⇒ lún xuống (chiều sâu) + tiếng "tách"; gửi chat ⇒ tiếng "vút".
// Nhúng: <script type="module" src="../_shared/feedback.js?v=f4"></script> (đổi file ⇒ tăng tag ở MỌI nơi, kể cả import trong homepage/press-nav.js). Tôn trọng khoá tắt tiếng chung "wgp.muted".
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
// ── Phát hiện tiếng của game (toàn trang) ──
// Một lần bấm chỉ được MỘT tiếng: game tự phát tiếng cho lần bấm đó ⇒ bỏ "tách" chung. Mọi nguồn tiếng của trang đi qua 3 cửa
// dưới đây; tiếng của chính file này (cờ `own`) và tiếng lặp (nhạc nền, .loop) không tính. Oscillator chỉ tính khi có hẹn stop()
// (tiếng máy Đua Xe chạy liên tục, gain 0 khi im ⇒ không tính, xét lúc quyết định chứ không phải lúc start()).
let own = 0;
let otherAt = -1;     // lần cuối có tiếng KHÁC "tách"/"bụp": tiếng game, hoặc "vút" khi gửi chat
const oscs = [];      // oscillator của game mới start: { o, at, stopped }
const oscRec = new WeakMap();
const markOther = () => { otherAt = performance.now(); };
// Game phát tiếng KHÔNG đồng bộ (chờ tải/giải mã file rồi mới start(), vd. Trà Sữa) báo trước bằng: dispatchEvent(new Event("wgp:sfx"))
addEventListener("wgp:sfx", markOther);
try {
  const BS = AudioBufferSourceNode.prototype.start;
  AudioBufferSourceNode.prototype.start = function (...a) { if (!own && !this.loop) markOther(); return BS.apply(this, a); };
  const OS = OscillatorNode.prototype.start, OT = OscillatorNode.prototype.stop;
  OscillatorNode.prototype.start = function (...a) {
    if (!own) { const r = { at: performance.now(), stopped: false }; oscRec.set(this, r); oscs.push(r); if (oscs.length > 32) oscs.shift(); }
    return OS.apply(this, a);
  };
  OscillatorNode.prototype.stop = function (...a) { const r = oscRec.get(this); if (r) r.stopped = true; return OT.apply(this, a); };
  const MP = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function (...a) { if (!this.loop && !this.muted) markOther(); return MP.apply(this, a); };
} catch {}
/** Có tiếng khác (game / "vút") bắt đầu từ thời điểm `t` tới giờ không? */
const otherSince = (t) => otherAt >= t || oscs.some((r) => r.stopped && r.at >= t);

const lastPlay = {};
export function play(name) {
  const now = performance.now(); if (now - (lastPlay[name] || 0) < 150) return; lastPlay[name] = now; // Enter trong form chat còn "bấm" nút Gửi ⇒ không kêu 2 lần
  if (name !== "click" && name !== "bup") otherAt = now; // "vút" gửi chat thay cho "tách" của nút Gửi
  if (!muted() && SOUNDS[name]) { own++; try { SOUNDS[name](); } catch {} finally { own--; } }
}

/** Tiếng bấm của trang: mặc định "click"; trang đặt <html data-click-sfx="bup"> để dùng tiếng khác. */
export const clickName = () => (SOUNDS[document.documentElement.dataset.clickSfx] ? document.documentElement.dataset.clickSfx : "click");
const usable = (el) => el && !el.disabled && el.getAttribute("aria-disabled") !== "true";

// ── Một lần bấm ⇒ quyết định SAU KHI game xử lý xong ──
// Bắt đầu bấm (chuột/chạm xuống, phím Enter/Space) ⇒ ghi `press`. Sự kiện click (game đã chạy handler của nó) ⇒ chờ WINDOW ms rồi
// mới quyết: game đã phát tiếng từ lúc bắt đầu bấm ⇒ im; chưa ⇒ "tách". Phần tử làm việc ở pointerdown mà không có click
// (bị gỡ khỏi trang, đổi chỗ…) ⇒ hẹn dự phòng FALLBACK ms sau khi nhấc tay/nhả phím.
// Cảm ứng: lướt (> 10 px), trang cuộn, pointercancel (trình duyệt nhận cuộn) ⇒ huỷ, không kêu.
const WINDOW = 40, FALLBACK = 80, SLOP = 10;
let press = null; // { el, at, id, x, y, touch, timer, done }
let lastAt = 0;
function begin(el, extra) {
  cancel();
  press = usable(el) && !el.closest("[data-nosfx]") ? { el, at: performance.now(), timer: 0, ...extra } : null;
}
function cancel() { if (press) clearTimeout(press.timer); press = null; }
function decideIn(ms) {
  const p = press; if (!p) return;
  clearTimeout(p.timer);
  p.timer = setTimeout(() => {
    if (press !== p) return;
    press = null;
    if (p.el.closest("[data-nosfx]") || otherSince(p.at)) return;
    const now = performance.now(); if (now - lastAt < 40) return; lastAt = now;
    play(clickName()); // nút có thể vừa bị khoá/ẩn bởi chính lần bấm này ⇒ không kiểm usable lại
  }, ms);
}
addEventListener("pointerdown", (e) => {
  if (e.pointerType === "mouse" && e.button !== 0) return;
  begin(e.target.closest(BTN), { id: e.pointerId, x: e.clientX, y: e.clientY, touch: e.pointerType !== "mouse" });
}, true);
addEventListener("pointermove", (e) => {
  if (press && press.touch && e.pointerId === press.id && Math.hypot(e.clientX - press.x, e.clientY - press.y) > SLOP) cancel();
}, { capture: true, passive: true });
addEventListener("pointercancel", (e) => { if (press && e.pointerId === press.id) cancel(); }, true);
addEventListener("scroll", () => { if (press && press.touch) cancel(); }, { capture: true, passive: true });
addEventListener("pointerup", (e) => { if (press && e.pointerId === press.id) decideIn(FALLBACK); }, true);
addEventListener("keydown", (e) => {
  const el = document.activeElement;
  if ((e.key === "Enter" || e.key === " ") && el && el.matches?.(BTN) && !e.repeat) {
    begin(el, { key: true }); decideIn(e.key === " " ? 1500 : FALLBACK); // Space: click tới lúc nhả phím
    el.classList.add("wgp-press"); setTimeout(() => el.classList.remove("wgp-press"), 110);
  }
  // Enter trong ô chat ⇒ gửi tin
  if (e.key === "Enter" && !e.shiftKey && !e.isComposing && isChatInput(el) && el.value.trim()) play("sent");
}, true);
addEventListener("keyup", (e) => { if (press && press.key && (e.key === " " || e.key === "Enter")) decideIn(FALLBACK); }, true);
addEventListener("click", (e) => {
  // Bấm nút Gửi của khung chat ⇒ "vút" (thay cho "tách")
  const b = e.target.closest("button, input[type=submit]");
  if (b && usable(b)) {
    const box = chatBox(b);
    const inp = box && box.querySelector("input[type=text], input:not([type]), textarea");
    if (inp && inp.value.trim() && /gửi|send/i.test(b.textContent + (b.getAttribute("aria-label") || "") + (b.value || ""))) play("sent");
  }
  decideIn(WINDOW); // handler click của game chạy sau pha capture này ⇒ chờ rồi mới quyết
}, true);
function chatBox(el) { return el.closest('[class*="chat" i], [id*="chat" i], [class*="Chat"], form[aria-label*="tin" i]'); }
function isChatInput(el) { return !!el && /^(INPUT|TEXTAREA)$/.test(el.tagName) && !!chatBox(el) && !el.closest("form[data-nochatsfx]"); }
