# Ô Ăn Quan — bản chơi thử (Lụm Kèo · pixel V5)

Trò chơi dân gian rải sỏi: mỗi đội giữ một hàng 5 ô dân, hai đầu bàn là hai ô quan. Rải sỏi, tính đường ăn dân, ăn quan; hết quan thì ai nhiều điểm hơn thắng. Chơi với máy chạy hoàn toàn trên trình duyệt; chơi online 1v1 / 2v2 cần máy chủ.

## Màn vào game (chuẩn chung của Lụm Kèo, giống Cờ Caro)
- Từ trên xuống: **Tên của bạn** (nhớ trong `localStorage` `wgp.o-an-quan.name`) → nút chính **Tạo phòng online** + ô **Phòng kín · vào bằng mã riêng** → *hoặc vào phòng của bạn bè*: ô mã + **Vào phòng** → *hoặc* **Chơi với máy**. Luật chơi gập trong **Cách chơi** ở cuối.
- **Tạo phòng online** → bước 2 chọn **Chế độ** (1v1 / 2v2) + **Luật** (Thường / Quan non) rồi **Tạo phòng**. **Chơi với máy** → bước 2 chọn **Máy** (Dễ / Vừa / Khó) + **Luật** rồi **Bắt đầu**. Bước 2 có **Quay lại** (hoặc Esc).
- Có ván dở với máy → màn đầu hiện thêm **▶ Chơi tiếp** cạnh *Chơi với máy* (kèm ván / số nước / điểm / mức máy).
- Enter ở ô tên = Tạo phòng online (hoặc Vào phòng nếu đã có mã); Enter ở ô mã = Vào phòng. Link mời `?room=MÃ` điền sẵn mã.

## Luật (logic.js)
Bàn 12 ô: ô 0 = quan trái, ô 1..5 = hàng dưới (đội A, trái → phải), ô 6 = quan phải, ô 7..11 = hàng trên (đội B, phải → trái). Mỗi ô dân 5 sỏi, mỗi ô quan một viên quan. **Quan = 10 dân**; tổng điểm luôn là 70.
- Đến lượt: chọn một ô dân bên mình còn sỏi + hướng; bốc hết, rải mỗi ô một viên (ô quan cũng nhận dân).
- Rải xong, xét ô kế tiếp: **ô quan → mất lượt**; **ô dân có sỏi → bốc rải tiếp**; **ô dân trống → ăn ô sau nó** nếu ô đó có quân, rồi **ăn liên tiếp** theo mẫu trống–có; **hai ô trống liền** thì dừng. Ô quan đã bị ăn hết thì tính là ô trống khi ăn liên hoàn.
- **Quan non** (tuỳ chọn, mặc định tắt; chủ phòng chọn): ô quan còn quan mà ít hơn 5 dân thì chưa được ăn (dừng lượt).
- **Hết dân**: đến lượt mà hàng mình trống → lấy 5 dân từ điểm của mình rải lại mỗi ô một viên; không đủ thì **vay** đội kia, ghi nợ, cuối ván trả.
- **Hết quan** (hai ô quan trống, không còn quan lẫn dân) → mỗi bên thu dân còn trên hàng mình, trả nợ, ai nhiều điểm hơn thắng (bằng nhau là hòa). Chặn an toàn: ván quá 240 nước thì dừng tính điểm (thực tế không chạm tới; mô phỏng ngẫu nhiên trung vị ~25 nước).
- Ván sau đội thua đi trước; hòa thì đổi đội đi trước. Tỉ số các ván giữ qua trận.
- API: `newMatch`, `newRound`, `nextRound`, `restartRound`, `legalMoves`, `canPlay`, `play`, `playSteps` (trả **chuỗi bước** `pick` / `drop` / `stop` / `take` / `refill` / `collect` / `repay` / `end` để dựng hoạt cảnh), `replay(base, moves)`, `step` (lõi cho máy nghĩ).

## Chơi với máy (ai.js)
- **Dễ**: ngẫu nhiên có trọng số (nước ăn nhiều hay được chọn hơn). **Vừa**: tham ăn 2 nước (điểm ăn trừ phần đối thủ ăn lại tốt nhất). **Khó**: alpha-beta sâu dần theo chênh điểm (tính cả nợ sẽ trả và dân trên hàng), giới hạn 160 ms/nước.
- Đo trên máy dev (máy Khó giới hạn 160 ms): Khó thắng Dễ 50/50 ván, Vừa thắng Dễ 49/50, Khó thắng Vừa 30/30; nước chậm nhất ~165 ms. Máy hiện ô + mũi tên mình chọn một nhịp trước khi rải.
- **Đi lại** (U): bỏ nước gần nhất của bạn và nước máy sau đó.
- Ván dở lưu ở `localStorage` `wgp.o-an-quan.v1` dạng `{ v: 1, opts, game: { quanNon, aiLevel, first, round, tally, moves } }`. Mở lại → dựng lại **từ danh sách nước bằng luật** (không tin bàn đã lưu). Bản lưu khác phiên bản / hỏng / có nước sai luật → bỏ ván dở, giữ tuỳ chọn hợp lệ.

## Chơi online 1v1 / 2v2 (mỗi người một máy)
- Máy chủ `games-server/o-an-quan/` (WebSocket `/ws/o-an-quan`) dùng chung khung `createRoomHost` của Cờ Caro (mã phòng, token, resume, chống spam, hủy phòng, danh sách phòng công khai) và nạp **chính** `logic.js` + `ai.js` bằng `import()`.
- Ghế theo thứ tự vào phòng; đội = ghế % 2. 2v2 đi theo thứ tự **A1 → B1 → A2 → B2**. Client chỉ gửi `move{pit,dir}`; máy chủ kiểm đúng người, đúng lượt, nước hợp lệ. Client nhận danh sách nước, tự chạy `playSteps` trên ván trước đó để dựng hoạt cảnh (khớp bàn máy chủ mới chạy, lệch thì nhảy thẳng tới bàn máy chủ).
- Chủ phòng đổi luật quan non ngay ở phòng chờ. Chủ phòng có **Hủy phòng**, khách **Rời phòng**; **Chép link mời**.
- Rớt mạng: tự nối lại, giữ ghế (token trong `sessionStorage` `wgp.o-an-quan.seat`). Người có lượt im lặng 60 s (mất kết nối: 15 s) → máy chủ đi thay bằng máy Khó. Có người rời giữa ván → về phòng chờ, chờ người mới.
- **Trò chuyện**: dùng lại `games-server/co-caro/chat.js` (tên người gửi do máy chủ gắn, tối đa 200 ký tự, 4 tin liền rồi ~0,7 tin/giây, giữ 40 tin).
- Danh sách phòng công khai (`/api/lobby`) ghi đúng sức chứa 2 hoặc 4. Chạy thử: `node games-server/o-an-quan/dev.js` → http://localhost:8769/games/o-an-quan/

## Điều khiển
- **Chạm / nhấp một ô sáng bên bạn** → hai **mũi tên vàng** hiện ngay trên bàn hai bên ô (≥ 50 px CSS, ngón cái bấm được) → bấm mũi tên để rải theo hướng đó. Bấm lại ô để bỏ chọn.
- Điện thoại dọc: bàn tự **xoay dọc** (hàng mình bên phải, gần ngón cái) để ô to gấp rưỡi. Đội B online: bàn lật 180°, hàng mình luôn ở phía mình.
- Đang rải: nút **Tua ×4** (F) và **Bỏ qua** (S) ở góc bàn.
- Bàn phím: ← → (hoặc ↑ ↓ khi bàn dọc) chọn ô · Enter hiện mũi tên · ← → rải theo hướng · Esc bỏ chọn / tạm dừng · U đi lại · N ván mới / ván tiếp · M tắt / bật tiếng.

## Hoạt cảnh + âm thanh
- Theo chuỗi bước của `playSteps`: **bàn tay** (`hand.webp`, khung `hand-hold` / `hand-drop`) nhón nắm sỏi đi theo đường rải, **từng viên bay ô → ô**; ăn quân thì sỏi bay về **khay điểm** của đội (khay nong tre dưới / trên bàn, quan đã ăn nằm đầu khay); chữ nổi "+12", "ĂN QUAN! +13", "Mất lượt", "Quan non, chưa ăn được"; hết dân hiện "… hết dân! Rải lại …, vay thêm … dân".
- Âm thanh Codex `assets/audio/*.mp3` đúng bảng `docs/o-an-quan/AUDIO.md`: `pebble-1..4` xoay vòng mỗi viên rơi, `pick-up` khi bốc, `capture` / `chain` (lần ăn thứ 2 trở đi trong một nước) / `capture-quan`, `borrow` khi rải lại / vay, `select` khi chọn ô (cả tin chat, đếm ngược 5 s), `turn` khi tới lượt mình, `win` / `lose` / `draw`.
- **Nạp lười**: hiệu ứng tải + giải mã sau lần chạm / phím đầu tiên hoặc ~1,5 s rảnh — không chặn lúc vào game. Hai nền lặp `amb-yard` (luôn, vol 0,22) và `music-game` (chỉ khi đang trong ván, không mở bảng; vol 0,14) là `<audio loop>`, chỉ bật **sau lần chạm đầu**.
- Nút loa / phím **M** tắt **tất cả** (cả hai nền lặp), lưu chung `wgp.muted`. Nút bấm dùng `_shared/feedback.js`.

## Hình (asset Codex)
- Đã ghép asset Codex (`docs/o-an-quan/ASSET-HANDOFF.md`, `check_assets` 0 lỗi): `assets/yard-bg.webp`, `board.webp`, `stones.webp` (dan-1..8), `quan.webp` (quan-left/right), `hand.webp`. Toạ độ ô lấy từ manifest Codex (`pit-N.at` + `r`).
- **Đồng bộ manifest**: máy chủ chỉ phục vụ `prototype/`, nên game đọc bản chép `data/asset-manifest.json`. Mỗi lần Codex sửa `docs/o-an-quan/asset-manifest.json`: chạy `node prototype/games/o-an-quan/tools/sync-manifest.mjs` rồi đổi tag `?v=` (hiện `oaq2`) ở `index.html`, `game.js`, `board.js`. `test/assets.test.mjs` báo lỗi nếu hai bản lệch nhau.
- Ảnh bàn kín 10..470 px nên hai khay điểm đặt ngoài bàn (y −18 và 498; manifest có thể ghi đè bằng `tray-a` / `tray-b`). Sỏi Codex (~16 px trong ô 32) vẽ phóng **1,5** cho cân với ô 114 px.
- Sprite (sỏi, quan, tay) luôn vẽ **thẳng đứng theo màn hình** kể cả khi bàn xoay dọc / lật, để bóng đổ nằm dưới.
- Ảnh nào thiếu / tải lỗi thì `art.js` vẽ thay bằng code đúng định dạng hợp đồng (sân gạch, bàn gỗ, sỏi, quan) — game luôn chơi được.
- Hiển thị pixel: hệ số phóng thiết bị là **bội 0,5 lớn nhất mà vừa** (chịu nhỏ đi tới 25% để giữ nét), tắt làm mượt ảnh (PLAYBOOK §2). Điện thoại ngang / màn thấp: HUD + công cụ dồn sang cột trái để bàn lấy trọn chiều cao (844×390 dpr 3 → 1,5).

## Tệp
| Tệp | Nội dung |
|---|---|
| `logic.js` | Luật thuần, dùng chung trình duyệt + máy chủ. |
| `ai.js` | Máy chơi Dễ / Vừa / Khó. |
| `board.js` | Vẽ bàn bằng canvas, bố cục (xoay / lật, bội 0,5), chạm ô, mũi tên, hoạt cảnh theo chuỗi bước. |
| `art.js` | Hình vẽ bằng code (dự phòng khi thiếu ảnh) + toạ độ ô mặc định. |
| `game.js` | Màn vào game, HUD, chơi với máy, phòng online + chat, âm thanh, lưu ván. |
| `net.js` | WebSocket tới máy chủ, tự nối lại, giữ ghế. |
| `index.html` | Giao diện + CSS pixel V5 (cùng token màu Cờ Caro). |
| `data/asset-manifest.json` | Bản chép manifest Codex (xem trên). `tools/sync-manifest.mjs` đồng bộ. |
| `assets/` | Ảnh Codex (`*.webp`), âm thanh Codex (`audio/*.mp3`), icon UI (`ui/`). |
| `test/*.test.mjs` | 21 test luật + máy + manifest (`npm test`). Test phòng online: `games-server/o-an-quan/test/room.test.mjs` (11 test). |
| `screenshots/e2e.mjs` | Test trình duyệt thật (Chrome headless, chuột + cảm ứng, desktop / dpr 1,25 / điện thoại dọc + ngang / online 1v1 + phòng 2v2, ảnh + âm thanh Codex); kết quả ở `screenshots/e2e-ket-qua.txt`. |

## Chạy thử
Từ thư mục gốc repo: `node server.js` rồi mở `/games/o-an-quan/`. E2E: `PORT=8771 node server.js` rồi `node prototype/games/o-an-quan/screenshots/e2e.mjs prototype/games/o-an-quan/screenshots`.
