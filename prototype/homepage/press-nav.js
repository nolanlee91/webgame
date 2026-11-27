// Trang chủ: thẻ game / ô "Mở phòng nhanh" / slide nổi bật / thẻ Thử thách là LINK (không phải nút) nên
// feedback.js chung không kêu, và bấm là trang chuyển ngay ⇒ không kịp thấy lún, tiếng bị cắt.
// Chuột: nhấn xuống ⇒ lún + tiếng ngay.
// Cảm ứng: lướt qua thẻ KHÔNG lún, KHÔNG kêu. Chỉ lún sau ~70 ms nếu ngón tay đứng yên, và chỉ kêu khi nhấc tay
// mà chưa di quá 10 px / trang chưa cuộn / trình duyệt chưa huỷ chạm (pointercancel khi nó nhận cuộn).
// Bấm thật ⇒ giữ lún ~130 ms rồi mới chuyển trang. Ctrl/⌘/Shift/chuột giữa / mở tab mới / link #trong trang: để trình duyệt tự xử lý.
// Vuốt slide: app.js chặn click (preventDefault ở pha capture) ⇒ ở đây thấy defaultPrevented thì bỏ qua.
import { play, clickName } from "../games/_shared/feedback.js?v=f4"; // CÙNG địa chỉ với thẻ script trong index.html (khác ⇒ 2 bản, kêu 2 lần)

const NAV = "a.tile[href], a.slide[href], a.dcard[href], a.tile__chal[href]";
const HOLD_MS = 130;
const TOUCH_PRESS_DELAY = 70; // ms đứng yên trước khi lún (lướt nhanh qua thì không lún)
const SLOP = 10; // px di chuyển tối đa vẫn tính là chạm
let navigating = false;
let touch = null; // { a, id, x, y, timer, pressed }

const press = (a) => a.classList.add("is-pressing");
const release = (a) => setTimeout(() => { if (!navigating) a.classList.remove("is-pressing"); }, 90);

function cancelTouch() {
  if (!touch) return;
  clearTimeout(touch.timer);
  touch.a.classList.remove("is-pressing");
  touch = null;
}

addEventListener("pointerdown", (e) => {
  const a = e.target.closest(NAV);
  if (!a) return;
  if (e.pointerType === "mouse") {
    if (e.button !== 0) return;
    press(a);
    play(clickName());
    const up = () => { release(a); removeEventListener("pointerup", up, true); };
    addEventListener("pointerup", up, true);
    return;
  }
  cancelTouch();
  const r = a.getBoundingClientRect();
  touch = { a, id: e.pointerId, x: e.clientX, y: e.clientY, rx: r.left, ry: r.top, pressed: false };
  touch.timer = setTimeout(() => { if (touch && touch.a === a) { touch.pressed = true; press(a); } }, TOUCH_PRESS_DELAY);
}, true);

addEventListener("pointermove", (e) => {
  if (touch && e.pointerId === touch.id && Math.hypot(e.clientX - touch.x, e.clientY - touch.y) > SLOP) cancelTouch();
}, { capture: true, passive: true });
addEventListener("pointercancel", (e) => { if (touch && e.pointerId === touch.id) cancelTouch(); }, true);
// Cuộn trang / cuộn ngang trong kệ ⇒ huỷ, nhưng chỉ khi thẻ đang chạm THỰC SỰ dịch > SLOP px (dải "Chơi ngay" có scroll-snap:
// trình duyệt có thể chỉnh vị trí vài px ngay lúc chạm — không phải người dùng đang lướt).
addEventListener("scroll", () => {
  if (!touch) return;
  const r = touch.a.getBoundingClientRect();
  if (Math.abs(r.left - touch.rx) > SLOP || Math.abs(r.top - touch.ry) > SLOP) cancelTouch();
}, { capture: true, passive: true });

addEventListener("pointerup", (e) => {
  if (!touch || e.pointerId !== touch.id) return;
  const { a, timer } = touch;
  clearTimeout(timer);
  touch = null;
  press(a); // chạm nhanh (< 70 ms) vẫn thấy lún
  play(clickName());
  release(a);
}, true);

addEventListener("click", (e) => {
  const a = e.target.closest(NAV);
  if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  if (a.target && a.target !== "_self") return;
  const url = new URL(a.href, location.href);
  if (url.origin === location.origin && url.pathname === location.pathname && url.hash) return; // link #trong trang
  e.preventDefault();
  if (navigating) return;
  navigating = true;
  if (e.detail === 0) play(clickName()); // Enter trên bàn phím: không có pointerdown
  press(a);
  setTimeout(() => { location.href = url.href; }, HOLD_MS);
});

// Quay lại bằng nút Back (bfcache) ⇒ bỏ trạng thái đang chuyển trang
addEventListener("pageshow", () => {
  navigating = false;
  touch = null;
  document.querySelectorAll(".is-pressing").forEach((el) => el.classList.remove("is-pressing"));
});
