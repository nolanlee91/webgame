// "Tắt chat" chung cho mọi game online của Lụm Kèo (BRD-07 / PTY-02).
// Người chơi tắt ⇒ không thấy tin nhắn, không có toast/tiếng tin nhắn, ô nhập bị khoá. Nhớ chung toàn trang:
// localStorage "wgp.chatOff" = "1". Mặc định: chat BẬT.
//
// Đánh dấu trong HTML (game tự lo màu sắc/kiểu nút của mình):
//   [data-chat-toggle]  nút bật/tắt (chữ "Tắt chat" / "Bật chat", aria-pressed)
//   [data-chat-check]   ô tick "Tắt chat" (trong phòng chờ)
//   [data-chat-on]      nút "Bật lại"
//   [data-chat-offnote] dòng mờ "Đã tắt chat · Bật lại" — chỉ hiện khi đang tắt
//   [data-chat-hide]    phần bị giấu khi tắt (khung tin nhắn)
// Lớp `wgp-chat-off` trên <html> khi đang tắt.

export const CHAT_OFF_KEY = "wgp.chatOff";
const EVT = "wgp:chatoff";

export function isChatOff() {
  try { return localStorage.getItem(CHAT_OFF_KEY) === "1"; } catch { return false; }
}

export function setChatOff(off) {
  try { if (off) localStorage.setItem(CHAT_OFF_KEY, "1"); else localStorage.removeItem(CHAT_OFF_KEY); } catch {}
  window.dispatchEvent(new CustomEvent(EVT, { detail: !!off }));
}

const subs = new Set();
let wired = false, cssDone = false;
function css() {
  if (cssDone) return; cssDone = true;
  const s = document.createElement("style");
  s.dataset.chatOff = "";
  s.textContent = "html:not(.wgp-chat-off) [data-chat-offnote]{display:none!important}html.wgp-chat-off [data-chat-hide]{display:none!important}";
  document.head.appendChild(s);
}

/** Cập nhật mọi nút/ô tick/dòng ghi chú đang có trên trang theo trạng thái hiện tại. */
export function syncChatOff(root = document) {
  const off = isChatOff();
  document.documentElement.classList.toggle("wgp-chat-off", off);
  root.querySelectorAll("[data-chat-toggle]").forEach((b) => {
    b.textContent = off ? "Bật chat" : "Tắt chat";
    b.setAttribute("aria-pressed", String(off));
    b.title = off ? "Bật lại trò chuyện" : "Tắt trò chuyện: không nhận tin nhắn";
  });
  root.querySelectorAll("[data-chat-check]").forEach((c) => { c.checked = off; });
  return off;
}

/**
 * Gắn "Tắt chat" cho trang: bấm nút / tick ô ở đâu cũng được (bắt sự kiện ở document, nên phần tử
 * tạo sau vẫn chạy). `onChange(off)` gọi mỗi lần đổi (kể cả đổi từ tab khác) để game vẽ lại khung chat.
 */
export function initChatOff(onChange) {
  if (onChange) subs.add(onChange);
  if (!wired) {
    wired = true; css();
    document.addEventListener("click", (e) => {
      const t = e.target.closest && e.target.closest("[data-chat-toggle], [data-chat-on]");
      if (!t) return;
      e.preventDefault();
      setChatOff(t.hasAttribute("data-chat-on") ? false : !isChatOff());
    });
    document.addEventListener("change", (e) => {
      if (e.target.matches && e.target.matches("[data-chat-check]")) setChatOff(e.target.checked);
    });
    const fire = () => { const off = syncChatOff(); subs.forEach((f) => f(off)); };
    window.addEventListener(EVT, fire);
    window.addEventListener("storage", (e) => { if (e.key === CHAT_OFF_KEY || e.key === null) fire(); });
  }
  return syncChatOff();
}
