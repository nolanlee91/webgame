// Móc đếm phòng online dùng chung cho mọi host.js (Đợt 10). host.js chỉ gọi roomEvent() sau khi tạo / vào phòng THÀNH CÔNG;
// server.js gắn nơi nhận số đếm (games-server/stats.js) bằng setSink(). Chưa gắn (test host riêng lẻ) ⇒ không làm gì.
//
// Phân biệt "vào từ sảnh" với "vào bằng link / mã": nút "Vào" ở sảnh chờ trang chủ đặt cookie ngắn hạn lk_via=sanh (2 phút,
// giá trị cố định, không định danh ai). Trình duyệt gửi cookie này kèm yêu cầu mở WebSocket ⇒ host.js đọc bằng viaOf(req).
"use strict";

let sink = null;

/** Gắn nơi nhận: fn(event, game). null ⇒ gỡ. */
function setSink(fn) { sink = typeof fn === "function" ? fn : null; }

/** "sanh" nếu kết nối mở ngay sau khi bấm "Vào" ở sảnh chờ trang chủ, ngược lại "". */
function viaOf(req) {
  const c = String((req && req.headers && req.headers.cookie) || "");
  return /(?:^|;\s*)lk_via=sanh(?:;|$)/.test(c) ? "sanh" : "";
}

/** t: "create" | "join" | "resume" (resume không đếm). Không bao giờ ném lỗi ra host. */
function roomEvent(game, t, via) {
  if (!sink) return;
  try {
    if (t === "create") sink("room_create", game);
    else if (t === "join") sink(via === "sanh" ? "room_join_lobby" : "room_join_link", game);
  } catch { /* đếm hỏng không được làm hỏng phòng */ }
}

module.exports = { setSink, viaOf, roomEvent };
