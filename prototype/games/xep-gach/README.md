# Xếp Gạch — bản chơi thử (pixel V5, Lụm Kèo)

Khối gạch rơi từ trên xuống. Di chuyển và xoay khối để lấp kín các hàng ngang. Hàng kín sẽ vỡ ra và cộng điểm. Gạch chồng tới nóc là thua. Game chơi một mình, chạy hoàn toàn trên trình duyệt, không cần server.

Cách mở: ở gốc repo chạy `PORT=8767 node server.js`, rồi vào `http://127.0.0.1:8767/games/xep-gach/`. Có thể thêm tham số `?seed=số` để cố định thứ tự khối.

## Chế độ
- **Vô Tận**: chơi tới khi gạch chạm nóc. Cứ 10 hàng lên 1 cấp, tối đa cấp 20. Có thể chọn cấp bắt đầu là 1, 3, 5, 7, 10 hoặc 15.
- **Về Đích 40 Hàng**: ăn đủ 40 hàng nhanh nhất có thể. Tốc độ giữ nguyên ở cấp 1. Kỷ lục được tính theo thời gian.

## Luật
- Bàn 10×20, cộng thêm 2 hàng ẩn phía trên. Có 7 loại khối, ra theo kiểu "túi 7": mỗi lượt 7 khối đều có đủ 7 loại.
- Khi xoay sát tường hoặc sát gạch, khối được đẩy lệch (wall kick) để xoay được.
- Có bóng mờ cho biết khối sẽ rơi xuống đâu.
- Giữ khối được 1 lần cho mỗi khối.
- Khối chạm đáy còn 0,5 giây để chỉnh, tối đa 15 lần chỉnh.
- Điểm ăn hàng: 1/2/3/4 hàng được 100/300/500/800 × cấp.
  - Xếp 4 hàng hai lần liền nhau được ×1,5.
  - Ăn hàng liên tiếp được combo: +50 × combo × cấp.
  - Ăn sạch bàn được +2000 × cấp.
  - Rơi nhanh +1 điểm mỗi ô, thả rơi +2 điểm mỗi ô.
- Thua khi khối mới không còn chỗ xuất hiện, hoặc khi cả khối nằm hết trên nóc.
- Kỷ lục và chế độ, cấp đã chọn được lưu ở `localStorage["wgp.xepgach.v1"]`. Tắt tiếng dùng chung khóa `wgp.muted`.
- Game tự tạm dừng khi chuyển tab hoặc rời cửa sổ.

## Điều khiển
- **Bàn phím:**
  - ←/→ di chuyển (giữ phím để lướt).
  - ↑ hoặc X xoay phải, Z xoay trái.
  - ↓ rơi nhanh, Space thả rơi.
  - C hoặc Shift giữ khối.
  - P hoặc Esc tạm dừng, M tắt/bật tiếng.
- **Chạm trên bàn:**
  - Chạm để xoay.
  - Kéo ngang để di chuyển.
  - Kéo xuống để rơi nhanh.
  - Vuốt nhanh xuống để thả rơi.
  - Vuốt nhanh lên để giữ khối.
- **Bàn nút ảo** hiện trên điện thoại và màn hình hẹp: Giữ, Xoay trái, Xoay, Trái, Nhanh, Phải, Thả. Giữ nút ◀ ▶ ▼ để lặp. Khi điện thoại cầm ngang, bàn nút gọn lại còn 3 cột.

## Hiển thị
- Gạch được **vẽ bằng code** (gạch pixel có mạch vữa, viền sáng/tối), không dùng ảnh AI.
- Bảng màu theo Art Bible V5: đỏ, xanh dương, xanh lá, vàng theo 4 màu phường, thêm tím, ngọc và cam.
- Icon UI và âm thanh dùng lại từ Nối Thú, Đào Vàng và Cờ Cá Ngựa (`assets/ui`, `assets/sfx`).
- Bố cục tự đổi theo màn hình:
  - Máy tính: ô Giữ bên trái, 5 khối Tiếp bên phải.
  - Điện thoại dọc: cột phải có ô Giữ và 3 khối Tiếp.
- Hiệu ứng:
  - Hạt vỡ khi ăn hàng, vệt khi thả rơi, rung màn hình.
  - Điểm bay lên khi ghi điểm, chữ combo.
  - Băng-rôn XẾP 4 HÀNG! / SẠCH BÀN! / LÊN CẤP / VỀ ĐÍCH!
  - Khung bàn nháy đỏ khi gạch cao gần tới nóc.
  - Khi thua, bàn xám dần trước khi hiện bảng kết quả.

## Cấu trúc
- `logic.js`: luật thuần, không đụng tới giao diện. Gồm SRS và wall kick, túi 7, trọng lực, thời gian chỉnh khi chạm đáy, ăn hàng, tính điểm, cấp, thắng/thua.
- `game.js`: vẽ canvas, hiệu ứng, HUD, điều khiển phím/chạm/nút, âm thanh, lưu kỷ lục, menu, tạm dừng, kết thúc.
- `test/logic.test.mjs`: chạy bằng `node --test test/logic.test.mjs`. Có 18 test, gồm cả thử ngẫu nhiên 3000 khối × 5 seed.
- `screenshots/e2e.mjs`: test trên Chrome headless thật, có bấm phím, chạm, vuốt, đổi kích thước và chụp ảnh. Chạy bằng `node screenshots/e2e.mjs <thư mục ra>`. Kết quả lần gần nhất ở `screenshots/e2e-ket-qua.txt`.
