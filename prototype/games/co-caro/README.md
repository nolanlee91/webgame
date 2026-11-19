# Cờ Caro — bản chơi thử (Lụm Kèo · pixel V5)

Xếp đủ **5 quân liên tiếp** (ngang, dọc, chéo) trước đối thủ là thắng. Chơi với máy chạy hoàn toàn trên trình duyệt; chơi online 1v1 cần máy chủ.

## Màn vào game (chuẩn chung của Lụm Kèo, giống Cờ Tỷ Phú / Cờ Cá Ngựa)
- Từ trên xuống: **Tên của bạn** (nhớ trong `localStorage` `wgp.caro.name`) → nút chính **Tạo phòng online** + ô **Phòng kín · vào bằng mã riêng** → *hoặc vào phòng của bạn bè*: ô mã + **Vào phòng** → *hoặc* **Chơi với máy**. Luật chơi gập trong **Cách chơi** ở cuối.
- **Tạo phòng online** → bước 2 chọn **Bàn cờ** (15/19) + **Luật** rồi bấm **Tạo phòng**. **Chơi với máy** → bước 2 chọn **Máy** (Dễ/Khó), **Bàn cờ**, **Luật** rồi **Bắt đầu**. Bước 2 có **Quay lại** (hoặc Esc) về màn đầu.
- Có ván dở với máy → màn đầu hiện thêm **▶ Chơi tiếp** cạnh *Chơi với máy* (kèm ván/số nước/tỉ số).
- Enter ở ô tên = Tạo phòng online (hoặc Vào phòng nếu đã có mã); Enter ở ô mã = Vào phòng. Link mời `?room=MÃ` điền sẵn mã.

## Chế độ & luật
- Chỉ có **Chơi với máy** và **Online** — không còn chế độ 2 người chung một máy (bản lưu cũ có chế độ này tự chuyển sang chơi với máy, ván dở chung máy bị bỏ).
- **Chơi với máy** (bạn cầm X): Dễ / Khó. Máy nghĩ ~0,5 giây, chạy tức thì trên điện thoại. Tỉ số giữ qua các ván; ván sau người thua đi trước, hòa thì đổi người đi trước.
- Bàn **15×15** hoặc **19×19**.
- Luật **Tự do** (5 quân trở lên là thắng) hoặc **Chặn 2 đầu** (5 quân bị quân đối thủ chặn cả hai đầu thì chưa thắng; mép bàn không tính là chặn).
- Bàn kín mà không ai đủ 5 → hòa.

## Chơi online 1v1 (mỗi người một máy)
- **Tạo phòng online** → chọn bàn + luật → **Tạo phòng** (nhận mã 5 ký tự + link mời `?room=MÃ`, nút chép link), hoặc nhập mã → **Vào phòng**. Cỡ bàn + luật do người tạo phòng chọn; chủ phòng bấm Bắt đầu khi đủ 2 người.
- Máy chủ (`games-server/co-caro/`, WebSocket `/ws/co-caro`) giữ ván và kiểm tra từng nước bằng chính `logic.js`: đúng người, đúng lượt, ô trống, ván chưa xong.
  Client chỉ gửi `move{r,c}`; không có đi lại khi chơi online. Ván sau người thua đi trước (như khi chơi với máy).
- Rớt mạng: tự nối lại, giữ ghế (token trong `sessionStorage`); F5 vào lại đúng ván. Người có lượt im lặng 60 s (mất kết nối: 15 s) → máy chủ đánh thay để ván không treo. Đối thủ rời → báo và về phòng chờ người mới.
- **Trò chuyện**: ô chat bên phải bàn (điện thoại: nút **Chat** có số tin chưa đọc, mở bảng trượt từ dưới). Tin đi qua máy chủ, tên người gửi do máy chủ gắn,
  tối đa 200 ký tự, mỗi người 4 tin liền rồi ~0,7 tin/giây, chỉ giữ 40 tin trong phòng (mất khi phòng đóng).
- Máy chủ online mặc định **bật** (đã qua review độc lập của Codex); tắt bằng `COCARO_ONLINE=0`. Chạy thử: `node games-server/co-caro/dev.js` → http://localhost:8768/games/co-caro/
- Chế độ **Chơi với máy** giữ nguyên, không cần máy chủ.

## Điều khiển
- Chuột: rê để xem trước, nhấp để đặt. Cảm ứng: **chạm một ô** để chọn (hiện quân mờ), chạm ô khác để đổi, rồi bấm nút **Đặt quân** lớn dưới bàn cờ (máy ngang: bên phải bàn) để đặt — tránh bấm nhầm. Nút chỉ bấm được khi đã chọn ô trống và đang tới lượt bạn.
- Bàn phím: mũi tên + Enter đặt quân · U / Ctrl+Z đi lại · N ván mới/ván tiếp · Esc tạm dừng · M tắt/bật tiếng.
- Đi lại (chỉ khi chơi với máy): bỏ cả nước của bạn và của máy.
- Ván dở được lưu (localStorage `wgp.caro.v1`), mở lại có nút "▶ Chơi tiếp" ở màn vào game.

## Tệp
| Tệp | Nội dung |
|---|---|
| `logic.js` | Luật thuần (không đụng DOM): trạng thái ván dạng dữ liệu, `play`, `undo`, `nextRound`, `replay(moves)`. Danh sách nước đi đủ để dựng lại ván → sau này làm online 1v1 chỉ cần gửi nước đi. |
| `ai.js` | Máy chơi: chấm điểm theo mẫu thế cờ (4/3 mở, đòn kép), luôn thắng ngay hoặc chặn nước thua ngay. |
| `game.js` | Vẽ bàn bằng canvas, HUD, menu, âm thanh, chạm/chuột/bàn phím; phòng online + ô chat. |
| `net.js` | Kết nối WebSocket tới máy chủ online, tự nối lại, giữ ghế. |
| `index.html` | Giao diện + CSS pixel V5. |
| `assets/` | Icon UI và âm thanh dùng lại từ Nối Thú. |
| `test/logic.test.mjs` | 13 test luật + máy (`npm test`). |
| `screenshots/e2e.mjs` | Test trình duyệt thật (Chrome headless, chuột + cảm ứng), 68 kiểm tra; kết quả ở `screenshots/e2e-ket-qua.txt`. |
| `screenshots/online-e2e.mjs` | Test online 2 trình duyệt (máy tính + điện thoại), 49 kiểm tra gồm chat; cần `dev.js` đang chạy. |

## Thay đồ họa
Quân X/O và khung bàn hiện **vẽ bằng code** (mặt nạ pixel 9×9 trong `game.js`: `MASK`, `drawPiece`, `pieceSvg`). Khi có sprite thật (vd. `assets/pieces/x.png`, `o.png`), chỉ cần thay `drawPiece` bằng `ctx.drawImage` và `pieceSvg` bằng `<img>` — không phải sửa `logic.js`.

## Chạy thử
Từ thư mục gốc repo: `node server.js` rồi mở `/games/co-caro/`.
