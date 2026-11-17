# 2048 — bản chơi thử (pixel V5, Lụm Kèo)

Trượt các ô số về một phía. Hai ô cùng số chạm nhau sẽ gộp đôi. Ghép được ô mục tiêu là thắng. Game chơi một mình, chạy hoàn toàn trên trình duyệt, không cần server. Hình ảnh đều vẽ bằng CSS theo Art Bible V5, không dùng ảnh AI mới. Âm thanh và icon chép từ bộ có sẵn của Xếp Gạch.

Cách mở: ở gốc repo chạy `PORT=8768 node server.js`, rồi vào `http://127.0.0.1:8768/games/2048/`.

## Bàn chơi
| Bàn | Tên | Mục tiêu |
|---|---|---|
| 3×3 | Thử thách | 256 |
| 4×4 | Cổ điển | 2048 |
| 5×5 | Rộng rãi | 4096 |

## Luật
- Mỗi lần trượt, tất cả các ô dồn về một phía.
- Hai ô cùng số chạm nhau gộp thành một. Mỗi ô chỉ gộp 1 lần trong một lượt.
- Mỗi lần gộp được cộng điểm bằng số của ô mới.
- Sau mỗi lượt có thay đổi, một ô mới xuất hiện ở chỗ trống: 90% là ô 2, 10% là ô 4.
- Trượt mà không có ô nào nhúc nhích thì không tính là một nước đi.
- Khi đạt ô mục tiêu, game hiện bảng thắng. Bấm "Chơi tiếp" để chơi lên ô lớn hơn.
- Bàn kín mà không còn cặp nào gộp được là hết nước đi.
- Mỗi ván có 3 lần hoàn tác, lùi tối đa 3 nước. Sau khi hết nước đi vẫn được hoàn tác.
  - Hoàn tác khôi phục cả bộ sinh số ngẫu nhiên, nên đi lại đúng nước cũ sẽ ra đúng ô cũ, không "quay" lại được ô khác.
- Mỗi bàn có kỷ lục điểm và ô lớn nhất riêng.
- Ván đang chơi được tự lưu sau mỗi nước, mỗi 5 giây, và khi rời trang. Mở lại trang sẽ chơi tiếp được.
  - Dữ liệu lưu ở `localStorage["wgp.2048.v1"]`.
  - Tắt tiếng dùng chung khóa `wgp.muted`.

## Điều khiển
- **Bàn phím:**
  - Phím mũi tên hoặc W/A/S/D để trượt.
  - Z, U hoặc Backspace để hoàn tác.
  - N chơi ván mới (hỏi lại nếu ván đang dở).
  - M tắt/bật tiếng.
  - Esc đóng hộp thoại hoặc về menu.
- **Chuột / chạm:** vuốt hoặc kéo chuột trên bàn. Trang không bị cuộn khi vuốt trên bàn.
- **Nút:** Hoàn tác (có số lần còn lại), Ván mới, Menu, Âm thanh.

## Giao diện
- Bảng màu ô theo Art Bible V5:
  - 2/4 màu giấy da.
  - 8–64 cam rồi đỏ.
  - 128–1024 xanh dương, xanh ngọc, xanh lá, tím.
  - 2048 vàng.
  - Ô từ 128 trở lên có lấp lánh pixel. Ô từ 2048 trở lên có thêm vệt sáng.
- Hiệu ứng: ô trượt mất 100ms. Ô gộp nảy lên, ô mới hiện dần. Gộp từ 64 trở lên có bụi pixel bắn ra. Khi được từ +8 điểm trở lên sẽ hiện chữ bay "+N".
- Máy tính: cột HUD bên trái, bàn bên phải.
- Điện thoại dọc: HUD gọn ở trên, bàn ở giữa, nút ở dưới.
- Điện thoại ngang: cột trái hẹp, bàn bên phải.

## Cấu trúc
- `logic.js`: toàn bộ luật chơi, không đụng DOM, có thể chạy bằng Node.
  - Gồm: tạo ván, trượt và gộp, sinh ô, thắng/thua, hoàn tác, lưu/đọc.
  - Có kiểm tra dữ liệu lưu: số phải là lũy thừa của 2, đúng kích thước.
- `game.js`: vẽ ô bằng DOM và CSS transform, xử lý bàn phím và vuốt, âm thanh, lưu trữ, các hộp thoại.
  - Có SDK giả: `reportScore` và `gameOver`.
  - Mở `window.__game` để test.
- `index.html`: giao diện và CSS pixel V5.
- `assets/`: âm thanh và icon có sẵn.

## Test
- Unit test luật chơi: `node --test test/logic.test.mjs`. Hiện 13/13 đạt.
  - Có cả fuzz 2000 nước × 3 cỡ bàn × 4 seed để kiểm tra tổng giá trị trên bàn luôn khớp.
- E2E: mở server ở cổng 8768, rồi chạy `node screenshots/e2e.mjs <thư-mục-ra>`. Hiện 59/59 đạt.
  - Script chạy Chrome headless qua CDP, cổng 9344.
  - Có kiểm tra: bàn phím, vuốt, hoạt ảnh gộp, thắng / chơi tiếp, thua / hoàn tác, lưu rồi tải lại trang, tắt tiếng, không tràn màn hình ở 7 kích thước, không có lỗi console, chữ "+điểm" bay mượt (lấy mẫu từng khung hình) và không chồng chữ khi gộp liên tiếp.
  - Kết quả lưu ở `screenshots/e2e-ket-qua.txt`.
