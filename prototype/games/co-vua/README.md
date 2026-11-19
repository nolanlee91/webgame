# Cờ Vua — Lụm Kèo

Cờ vua đủ luật chuẩn: nhập thành, bắt Tốt qua đường, phong cấp (chọn Hậu/Xe/Tượng/Mã), chiếu / chiếu bí, hòa pat,
không đủ quân, 50 nước, lặp 3 lần, xin thua, hòa thỏa thuận. Mỗi ván sau hai bên đổi màu.

- `logic.js` — luật thuần (không DOM), dùng chung cho client và máy chủ online. Kiểm bằng perft chuẩn.
- `ai.js` — máy chơi: negamax alpha-beta, mức Dễ (độ sâu 1 + nhiễu + 15% nước ngẫu nhiên) / Vừa (độ sâu 2).
- `net.js` — kết nối phòng online `/ws/co-vua` (máy chủ ở `games-server/co-vua/`, tắt bằng `COVUA_ONLINE=0`).
- `game.js` + `index.html` — canvas, HUD, menu, phong cấp, chat, lưu ván dở (`localStorage` `wgp.covua.v1`, dựng lại từ danh sách nước).
- Ảnh: `assets/board-grid.webp` + `assets/pieces.png` (Codex, xem `assets/HANDOFF.md`); âm thanh + icon UI chép từ Cờ Caro.

Màn vào game (chuẩn chung của Lụm Kèo): **Tên của bạn** → **Tạo phòng online** (tạo ngay, có ô *Phòng kín · vào bằng mã riêng*) → *hoặc vào phòng của bạn bè*: mã + **Vào phòng** → *hoặc* **Chơi với máy** (bước 2: độ khó Dễ/Vừa + **Bắt đầu**, **Quay lại**/Esc về màn đầu). Có ván dở với máy thì hiện thêm **▶ Chơi tiếp**. Luật gập trong **Cách chơi**. Link mời `?room=MÃ` điền sẵn mã.
Chế độ: chơi với máy · online qua mã phòng + chat. Không còn chế độ 2 người chung một máy (bản lưu cũ có chế độ này tự chuyển sang chơi với máy, ván dở chung máy bị bỏ).

## Test

```
node --test test/logic.test.mjs                                   # luật (perft) + bot
node --test --test-concurrency=1 ../../../games-server/co-vua/test/*.test.mjs   # máy chủ phòng
# e2e trình duyệt (Chrome headless, bấm/chạm thật, chụp desktop + mobile, thử online):
PORT=8768 node server.js            # ở gốc repo
node prototype/games/co-vua/screenshots/e2e.mjs <thư mục ảnh>
```
