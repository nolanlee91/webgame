// Số đếm lượt dùng — phía trình duyệt (Đợt 10). Gửi {e, g} tới POST /api/ev (games-server/stats.js). Không gửi tên, id, gì khác.
//   import { ev } from "../_shared/stats.js?v=st1";
//   ev("share_click", "ran-san-moi");     // e phải nằm trong EVENTS; g = id game trong homepage/games.js (hoặc tên thư mục game)
// Nạp module này là tự đếm "share_open" một lần nếu trang được mở từ link khoe (?ref=share hoặc ?ref=daily).
// Không bao giờ làm hỏng / chậm game: sendBeacon (dự phòng fetch keepalive), không chờ, mọi lỗi bị nuốt.
import { GAMES_META } from "./games-meta.js";

export const EVENTS = ["share_click", "challenge_click", "share_open", "challenge_open", "challenge_done", "room_create", "room_join_link", "room_join_lobby", "daily_submit"];
export const ENDPOINT = "/api/ev";

/** id game hợp lệ từ id hoặc tên thư mục ("do-vui-nhanh" ⇒ "do-vui"); lạ ⇒ "". */
export function gameId(x) {
  x = String(x ?? "");
  if (Object.prototype.hasOwnProperty.call(GAMES_META, x)) return x;
  for (const [id, m] of Object.entries(GAMES_META)) if (m && m.folder === x) return id;
  return "";
}
/** id game từ đường dẫn trang (/games/<thư mục>/…). */
export function gameFromPath(p = (globalThis.location && globalThis.location.pathname) || "") {
  const m = /\/games\/([a-z0-9-]+)\//.exec(String(p));
  return m ? gameId(m[1]) : "";
}

/** Gửi một sự kiện, quên luôn. Trả true nếu đã giao cho trình duyệt gửi. */
export function ev(e, g = "") {
  try {
    if (!EVENTS.includes(e)) return false;
    const body = JSON.stringify({ e, g: gameId(g) });
    const nav = globalThis.navigator;
    // chuỗi ⇒ text/plain (không cần preflight); máy chủ đọc JSON bất kể Content-Type
    if (nav && typeof nav.sendBeacon === "function" && nav.sendBeacon(ENDPOINT, body)) return true;
    if (typeof globalThis.fetch === "function") {
      globalThis.fetch(ENDPOINT, { method: "POST", body, keepalive: true, credentials: "same-origin", headers: { "Content-Type": "text/plain" } }).catch(() => {});
      return true;
    }
  } catch { /* bỏ qua */ }
  return false;
}

/** Trang mở từ link khoe ⇒ đếm "share_open" (một lần cho mỗi địa chỉ trong phiên tab, tải lại không đếm thêm). */
export function trackOpen(loc = globalThis.location) {
  try {
    if (!loc || globalThis.__lkOpenTracked) return false;
    globalThis.__lkOpenTracked = true;
    const p = new URLSearchParams(loc.search || "");
    const ref = p.get("ref");
    if (ref !== "share" && ref !== "daily") return false;
    const key = "lk.open:" + loc.pathname + loc.search;
    try { if (globalThis.sessionStorage?.getItem(key)) return false; globalThis.sessionStorage?.setItem(key, "1"); } catch { /* chế độ riêng tư */ }
    return ev("share_open", gameId(p.get("g")) || gameFromPath(loc.pathname));
  } catch { return false; }
}

if (typeof window !== "undefined") trackOpen();
