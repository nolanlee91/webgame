# Rắn Săn Mồi

Rắn săn mồi một người chơi trên lưới 20×20, vẽ hoàn toàn bằng khối pixel trên canvas (không ảnh mới), màu theo Art Bible V5.

- **Luật** (`logic.js`): rắn dài 4, ăn quả đỏ dài thêm 1 ô, +10 × cấp tốc độ. Cứ 5 quả xuất hiện **đồng vàng** (+50 × cấp, dài thêm 2) chỉ tồn tại 40 nhịp. Rắn càng dài càng nhanh (160 ms → tối thiểu 55 ms/nhịp; lên 1 cấp mỗi 5 ô). Phủ kín bàn = thắng.
- **Chế độ**: Cổ điển (tường đá — đụng tường hoặc thân là thua) và Xuyên tường (ra mép này hiện ở mép kia). Kỷ lục lưu riêng từng chế độ.
- Đổi hướng xếp hàng tối đa 2 lần bấm mỗi nhịp, chặn quay đầu 180°; được đi vào ô đuôi vừa rời.
- **Điều khiển**: mũi tên / WASD, P/Esc tạm dừng, M tắt tiếng, Space/Enter bắt đầu/chơi lại. Điện thoại: vuốt trên bàn hoặc 4 nút mũi tên dưới bàn. Ẩn tab/rời cửa sổ thì tự tạm dừng.
- Lưu cục bộ: `localStorage["wgp.ransanmoi.v1"]`. Âm thanh + icon chép từ Xếp Gạch.

Test: `node --test test/logic.test.mjs` · E2E: (gốc repo) `PORT=8768 node server.js` rồi `node screenshots/e2e.mjs <thư mục ảnh>`.
