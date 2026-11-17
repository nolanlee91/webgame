# Nối Từ — chơi offline với máy (bước 2: giao diện)

Mở `prototype/games/noi-tu/` qua server tĩnh (`node server.js` ở gốc repo). Kiến trúc: `docs/noi-tu-architecture.md`.

- `index.html` + `game.js` — giao diện (pixel V5 / Lụm Kèo). `game.js` là gốc lắp ráp: chỉ import `createDict`
  và `createLocalSession`; mọi luật, đồng hồ, lượt đều do trọng tài quyết. UI **không tự đếm giờ** — đồng hồ
  vẽ từ `session.remainingMs()` mỗi khung hình.
- `core/` — luật thuần (chuẩn hóa tiếng Việt, từ điển, validate/reduce, AI). Dùng chung trình duyệt + server.
- `session/referee.js` — trọng tài (nguồn sự thật), `session/client.js` — MatchSession cho UI,
  `session/local.js` — chơi offline (trọng tài cùng trang), `session/scheduler.js` — đồng hồ tiêm vào.
- `data/words-src.txt` → `npm run build:dict` → `data/words.json` (in hash + dung lượng gzip thật).
- `assets/` — ảnh/âm thanh có sẵn chép từ Cờ Cá Ngựa (ngựa Đỏ/Xanh dương) và 2048 (icon, sfx). Không ảnh AI mới.

## Luật đang chạy
15 giây/lượt · từ ghép 2 tiếng, bắt đầu bằng tiếng cuối của từ trước · không lặp từ · hết giờ hoặc chịu thua
là thua ván · đánh được từ cụt là thắng ngay · tỉ số giữ qua các ván · người thua đi trước ván sau.

## Lựa chọn giao diện
- Chỉ chế độ đấu máy (Dễ / Khó). Hotseat có trong lớp phiên nhưng chưa mở trên UI.
- Gõ tắt: khi đã có từ trước, chỉ cần gõ tiếng thứ hai (vd đang cần “học” → gõ “sinh” = “học sinh”).
- Tạm dừng (nút ⏸, Esc, ẩn tab/tắt màn hình) đóng phiên thật nên đồng hồ trọng tài dừng; chơi tiếp dựng lại
  từ nhật ký đã lưu và lượt đang dở được **tính lại đủ 15 giây** (giống mở lại tab).
- Từ bị báo “chưa có trong từ điển” được lưu cục bộ (`localStorage["noi-tu:missing"]`, tối đa 200) để sau này duyệt bổ sung.

## Test
- `npm test` — 62 test: hợp đồng trọng tài (tiến trình riêng + cùng tiến trình), lõi, LocalSession, đọc chữ gõ khi chưa bật bộ gõ (`core/input.js`).
- `npm run test:e2e` — 70–71 kiểm tra (1 kiểm tra gõ tắt không dấu chỉ chạy khi máy không đánh từ cụt) trên Chrome headless thật (chuột/chạm/gõ, đồng hồ thật, ~2 phút):
  desktop 1440×900 / 1280×720, mobile 390×844 / 360×740 / ngang 844×390 / bàn phím ảo mở (390×440).
  Ảnh + `e2e-ket-qua.txt` vào `screenshots/`.
