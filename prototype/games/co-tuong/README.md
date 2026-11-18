# Cờ Tướng

Luật đầy đủ (`logic.js`): đi quân đúng luật 7 loại quân, chặn chân Mã / mắt Tượng, Pháo cần ngòi, Tướng không đối mặt, không được tự để bị chiếu;
chiếu bí, hết nước (bên hết nước thua), chiếu mãi lặp 3 lần bị xử thua, lặp thế 3 lần hòa, 60 lượt mỗi bên không ăn quân hòa, hai bên hết quân tấn công hòa.
Máy (`ai.js`): mức Dễ / Thường. Online 1v1 qua mã phòng (máy chủ ở `games-server/co-tuong/`, mặc định bật).

- `game.js` — vẽ canvas, chạm/nhấp chọn quân rồi chạm ô sáng để đi, bàn phím (mũi tên + Enter, U đi lại, N ván mới, M tắt tiếng), biên bản nước đi,
  cầu hòa / xin thua, lưu ván dở (dựng lại từ danh sách nước, kiểm luật từng nước), online + chat qua `net.js`. Cầm Đen online thì bàn xoay.
- Ảnh bàn + quân: Codex (`assets/HANDOFF.md`) — dùng `board-grid.webp` (lưới đúng 64px, lề 32px) và `pieces.png` (atlas 7×2, khung 64px),
  vẽ nearest-neighbor. Ảnh chưa tải được thì game tự vẽ tạm bằng code.
- Test luật: `node --test test/logic.test.mjs`. E2E (desktop + mobile + online 2 máy): chạy `node games-server/co-tuong/dev.js` rồi
  `node prototype/games/co-tuong/screenshots/e2e.mjs <thư mục ngoài repo>` — kết quả mới nhất ở `screenshots/e2e-ket-qua.txt`.
