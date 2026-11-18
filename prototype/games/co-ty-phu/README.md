# Cờ Tỷ Phú — Lụm Kèo Đại Phú

Chơi một mình với 1–3 bot, không cần server. Mở `index.html` qua máy chủ tĩnh (game đọc `assets/asset-manifest.json`).

- `logic.js` — luật thuần (test bằng `npm test`): 2 xúc xắc, mua đất, nâng cấp nhà tức thì (3 cấp), độc quyền vùng thuê x2,
  Kèo Thơm/Kèo Thối, tù (đổ đôi / nộp 50K / chờ 2 lượt), cầm cố tự động khi thiếu tiền, phá sản, tối đa 25 vòng.
  RNG có seed và khuôn state machine giống `co-ca-ngua/logic.js`.
- `game.js` — giao diện DOM đè lên ảnh bàn theo tọa độ ô `board.tiles` của manifest (hệ 1024×1024), HUD 4 góc, đếm ngược 15 giây.
- Bàn hiện tại 40 ô, 8 nhóm màu × 4 ô. Đổi bàn (số ô khác): thay mảng `TILES` trong `logic.js` và `board.tiles` trong manifest; số ô, vị trí tù/bến xe tự suy ra.
