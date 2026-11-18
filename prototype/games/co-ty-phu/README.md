# Cờ Tỷ Phú — Lụm Kèo Đại Phú

Hai chế độ:
- **Chơi với máy**: 1–3 bot, không cần server. Mở `index.html` qua máy chủ tĩnh (game đọc `assets/asset-manifest.json`).
- **Online 2–4 người**: phòng chờ (tạo phòng, mã 5 ký tự hoặc link mời `?room=MÃ`), chọn linh vật, chủ phòng bấm Bắt đầu, khung chat cả phòng.
  Máy chủ ở `games-server/co-ty-phu/` (WebSocket `/ws/co-ty-phu`, gắn trong `server.js`, luôn chạy, không có biến bật/tắt):
  máy chủ gieo xúc xắc và chạy luật bằng `logic.js`, máy khách chỉ gửi ý định. Lượt 25 giây; người rời phòng/mất mạng thì máy chơi thay,
  tải lại trang vẫn giữ chỗ.
  - Test máy chủ: `node --test --test-concurrency=1 --test-timeout=120000 games-server/co-ty-phu/test/room.test.mjs`
  - E2E 3 người (Chrome headless): chạy `PORT=8768 node server.js` rồi `node prototype/games/co-ty-phu/screenshots/e2e-online.mjs`

- `logic.js` — luật thuần (test bằng `npm test`): 2 xúc xắc, mua đất, nâng cấp nhà tức thì (3 cấp), độc quyền vùng thuê x2,
  Kèo Thơm/Kèo Thối, tù (đổ đôi / nộp 50K / chờ 2 lượt), cầm cố tự động khi thiếu tiền, phá sản, tối đa 25 vòng.
  RNG có seed và khuôn state machine giống `co-ca-ngua/logic.js`.
- `game.js` — giao diện DOM đè lên ảnh bàn theo tọa độ ô `board.tiles` của manifest (hệ 1024×1024), HUD 4 góc, đếm ngược 15 giây.
- Bàn hiện tại 40 ô, 8 nhóm màu × 4 ô. Đổi bàn (số ô khác): thay mảng `TILES` trong `logic.js` và `board.tiles` trong manifest; số ô, vị trí tù/bến xe tự suy ra.
