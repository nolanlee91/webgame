# Bắn Bóng Khủng Long

Game bắn bóng ghép màu một người chơi, không cần server. Pixel art vẽ bằng code theo Art Bible V5, thương hiệu Lụm Kèo.
Tên và hình là bản riêng của Lụm Kèo, không lấy tên hay giao diện của game thương mại nào.

## Cách chơi
- Bắn bóng lên trần. Ghép từ 3 bóng cùng màu trở lên thì nổ; bóng không còn bám trần sẽ rơi (điểm gấp đôi).
- Mục tiêu mỗi màn: cứu hết trứng khủng long trong đám bóng, bằng cách làm nổ hoặc làm rơi chúng, trước khi hết viên.
- Đá không nổ, chỉ rơi khi mất chỗ bám. Bom nổ tung các bóng quanh nó.
- Bắn hụt đủ số lần thì trần hạ thêm một hàng. Bóng chạm vạch đỏ là thua.
- Có 12 màn khó dần (nhiều màu hơn, nhiều trứng/đá/bom hơn, trần hạ nhanh hơn) và chế độ Tự do không giới hạn viên.
- Thắng được 1–3 sao, cộng thưởng theo số viên còn dư.

## Điều khiển
- Máy tính: rê chuột để ngắm, bấm để bắn; ←/→ xoay nòng (giữ Shift để xoay chậm); Space/↑/Enter bắn; X hoặc bấm vào bệ để đổi viên; M tắt tiếng; Esc mở menu.
- Điện thoại: chạm kéo để ngắm, thả tay để bắn; kéo xuống dưới bệ rồi thả để hủy; chạm bệ hoặc nút Đổi viên để đổi viên.

## Lưu
`localStorage` khóa `wgp.ban-bong.v1` lưu màn đã mở, sao, kỷ lục và ván đang chơi. Lần mở sau có nút "Chơi tiếp". Dữ liệu lưu hỏng sẽ bị bỏ qua.

## Tệp
- `logic.js`: luật thuần (lưới lục giác, đường bay có nảy tường, nổ/rơi, trứng, đá, bom, hạ trần, màn chơi, lưu/khôi phục).
- `game.js`: vẽ canvas, hiệu ứng, âm thanh, điều khiển.
- `index.html`: bố cục, HUD, menu.
- `test/logic.test.mjs`: 18 test luật (`npm test`).
- `tools/sim.mjs`: bot mô phỏng để chỉnh độ khó (`npm run sim`).
- `screenshots/e2e.mjs`: E2E trên Chrome thật qua CDP. Chạy `PORT=8768 node server.js` ở gốc repo, rồi `node prototype/games/ban-bong/screenshots/e2e.mjs <thư mục>`. Kết quả mới nhất nằm trong `screenshots/e2e-ket-qua.txt`.
