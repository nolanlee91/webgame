# Sudoku — bản chơi thử (pixel V5, Lụm Kèo)

Điền số 1–9 vào lưới 9×9 sao cho mỗi hàng, mỗi cột và mỗi khối 3×3 đều có đủ 9 số, không trùng nhau. Game chơi một mình, chạy hoàn toàn trên trình duyệt, không cần server. Đề được tạo ngay trên máy và mỗi đề chỉ có đúng 1 lời giải. Hình ảnh đều vẽ bằng CSS theo Art Bible V5, không dùng ảnh AI mới. Âm thanh và icon chép từ bộ có sẵn.

Cách mở: ở gốc repo chạy `PORT=8768 node server.js`, rồi vào `http://127.0.0.1:8768/games/sudoku/`.

## Mức độ
| Mức | Số cho sẵn | Cách giải cần dùng |
|---|---|---|
| Dễ | 36–38 | Chỉ cần "ô chỉ còn 1 số" (naked single) |
| Vừa | 29–32 | Bắt buộc dùng thêm "số chỉ có 1 chỗ đặt" trong hàng/cột/khối (hidden single) |
| Khó | 24–30 | Bắt buộc suy luận sâu hơn (thử loại trừ nhiều bước) |

Bộ chấm độ khó sẽ tự giải từng đề để kiểm tra. Đề nào không khớp mức sẽ bị tạo lại. Các số cho sẵn được đặt đối xứng qua tâm.

## Luật trong game
- Ô **đậm** là số cho sẵn, không sửa được.
- Điền sai: ô hiện đỏ và bị tính 1 lỗi. Không có thua, cứ sửa lại là được.
- Hai số trùng nhau trong cùng hàng, cột hoặc khối sẽ được đánh dấu đỏ.
- **Ghi chú:** ghi các số dự đoán nhỏ trong ô. Khi điền một số, ghi chú cùng số ở các ô cùng hàng, cột và khối sẽ tự xóa.
- **Gợi ý:** mỗi đề có 3 lần. Gợi ý điền đúng ô đang chọn, hoặc ô dễ nhất nếu ô đang chọn đã có số đúng. Ô được gợi ý có màu tím và bị khóa.
- **Hoàn tác:** lùi được tối đa 200 bước. Dùng gợi ý thì lịch sử hoàn tác sẽ bị xóa.
- Điền xong một hàng, cột hoặc khối thì phần đó nháy sáng. Khi một số đã đủ 9 ô, phím số đó sẽ mờ đi.
- Giải xong, bàn chạy hiệu ứng sóng rồi hiện bảng kết quả. Kỷ lục là thời gian nhanh nhất ở từng mức.
- Điểm = điểm gốc (Dễ 1000 / Vừa 2000 / Khó 3500) − 60 × số lỗi − 150 × số gợi ý đã dùng − thời gian (giây) / 6. Tối thiểu là 100 điểm.
- Ván đang chơi được tự lưu sau mỗi nước, mỗi 5 giây và khi rời trang. Mỗi mức lưu một ván riêng. Lưu cả số đã điền, ghi chú, lỗi, thời gian và 30 bước hoàn tác gần nhất.
  - Dữ liệu lưu ở `localStorage["wgp.sudoku.v1"]`.
  - Tắt tiếng dùng chung khóa `wgp.muted`.

## Điều khiển
- **Bàn phím:**
  - 1–9 để điền số. Shift + số để ghi chú nhanh.
  - Phím mũi tên hoặc W/A/S/D để di chuyển ô chọn. Đi quá mép thì vòng sang phía bên kia.
  - Del, Backspace hoặc 0 để xóa ô.
  - N bật/tắt chế độ ghi chú.
  - H để dùng gợi ý.
  - Z, U hoặc Ctrl+Z để hoàn tác.
  - M tắt/bật tiếng.
  - Esc đóng hộp thoại hoặc về menu.
- **Chuột / chạm:** chạm ô rồi chạm bàn phím số trên màn hình. Các nút: Hoàn tác, Xóa, Ghi chú, Gợi ý.
- Màn hình máy tính: HUD bên trái, bàn và bàn phím số bên phải.
- Điện thoại dọc: HUD gọn ở trên, bàn ở giữa, công cụ và 9 phím số ở dưới.
- Điện thoại ngang: HUD ở cột trái, bàn ở giữa, phím số dạng 3×3 ở cột phải.

## Cấu trúc
- `logic.js`: toàn bộ luật chơi, không đụng DOM, có thể chạy bằng Node.
  - Bộ giải: backtracking dùng bitmask, luôn chọn ô có ít ứng viên nhất.
  - Bộ chấm độ khó, bộ sinh đề có seed (tái lập được).
  - Các thao tác: điền, ghi chú, xóa, gợi ý, hoàn tác.
  - Lưu/đọc có kiểm tra dữ liệu: lời giải phải hợp lệ, khớp số cho sẵn, ghi chú đúng định dạng.
- `game.js`: vẽ bằng DOM + CSS, xử lý phím/chuột/chạm, đồng hồ, âm thanh, lưu trữ, các hộp thoại.
  - Có SDK giả: `reportScore` và `gameOver` (gửi `{result:'solved', diff, time, mistakes, hints, score}`).
  - Mở `window.__game` để test.
- `index.html`: giao diện và CSS pixel V5.
- `assets/`: âm thanh và icon có sẵn.

## Test
- Unit test luật chơi: `node --test test/logic.test.mjs`. Hiện 15/15 đạt.
  - Tạo 25 đề mỗi mức, kiểm tra từng đề có đúng 1 lời giải, đúng mức độ khó, đối xứng và đúng số lượng số cho sẵn.
  - Fuzz: 300 thao tác ngẫu nhiên mỗi mức.
- E2E: mở server ở cổng 8768, rồi chạy `node screenshots/e2e.mjs <thư-mục-ra>`. Hiện 68/68 đạt.
  - Script chạy Chrome headless qua CDP, cổng 9345.
  - Có kiểm tra: chuột, bàn phím, chạm trên mobile, điền đúng/sai, ghi chú, tự xóa ghi chú, xóa, hoàn tác, gợi ý, ô trùng số, đồng hồ, thắng và lưu kỷ lục, lưu rồi tải lại trang, hỏi lại khi tạo đề mới, tắt tiếng, đủ 3 mức, không tràn màn hình ở 7 kích thước, không có lỗi console.
  - Kết quả lưu ở `screenshots/e2e-ket-qua.txt`.
