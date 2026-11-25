// Trang chủ: thẻ game / ô "Mở phòng nhanh" / slide nổi bật / thẻ Thử thách là LINK (không phải nút) nên
// feedback.js chung không kêu, và bấm là trang chuyển ngay ⇒ không kịp thấy lún, tiếng bị cắt.
// File này: chạm xuống ⇒ tiếng "tách" + lún (class is-pressing, chạy cả trên điện thoại nơi :active thất thường),
// bấm ⇒ giữ lún ~130 ms rồi mới chuyển trang. Ctrl/⌘/Shift/chuột giữa / mở tab mới / link #trong trang: để trình duyệt tự xử lý.
// Vuốt slide: app.js chặn click (preventDefault ở pha capture) ⇒ ở đây thấy defaultPrevented thì bỏ qua.
import { play } from "../games/_shared/feedback.js";

const NAV = "a.tile[href], a.slide[href], a.quick__item[href], a.dcard[href]";
const HOLD_MS = 130;
let navigating = false;

const press = (a) => a.classList.add("is-pressing");
const release = (a) => setTimeout(() => a.classList.remove("is-pressing"), 90);

addEventListener("pointerdown", (e) => {
  if (e.pointerType === "mouse" && e.button !== 0) return;
  const a = e.target.closest(NAV);
  if (!a) return;
  press(a);
  play("click");
  const up = () => { release(a); removeEventListener("pointerup", up, true); removeEventListener("pointercancel", up, true); };
  addEventListener("pointerup", up, true);
  addEventListener("pointercancel", up, true);
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
  if (e.detail === 0) play("click"); // Enter trên bàn phím: không có pointerdown
  press(a);
  setTimeout(() => { location.href = url.href; }, HOLD_MS);
});

// Quay lại bằng nút Back (bfcache) ⇒ bỏ trạng thái đang chuyển trang
addEventListener("pageshow", () => {
  navigating = false;
  document.querySelectorAll(".is-pressing").forEach((el) => el.classList.remove("is-pressing"));
});
