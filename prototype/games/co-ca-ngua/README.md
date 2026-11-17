# Cờ Cá Ngựa — bản chơi thử (hình khối tạm)

Chơi: chạy `python -m http.server 8766` trong `prototype/`, mở `http://127.0.0.1:8766/games/co-ca-ngua/`
(thêm `?players=2|3|4&seed=N` để vào thẳng ván / tái hiện cùng chuỗi xúc xắc).

- `logic.js` — luật thuần (không DOM), trạng thái sao chép được (structuredClone) để sau đưa lên server.
- `game.js` — vẽ canvas + điều khiển, theo hợp đồng `mount(el, ctx) -> { pause, resume, destroy }`. Hình vẽ là **hình khối tạm**;
  lưới 13×13 (nhánh 3×5, đường đi 44 ô, chuồng đích 4 bậc) khớp `assets/board.webp` để ghép asset thật sau.
- `test/logic.test.mjs` — `npm test` (15 test luật + 600 ván ngẫu nhiên).
- `screenshots/e2e.mjs` — test trên Chrome headless bằng chuột/phím/chạm thật, quay video.

## Luật mặc định (chỉnh được qua `rules`)
2–4 người chung một máy, mỗi người 4 ngựa. Gieo 6 mới xuất ngựa và được gieo thêm (`launchOn: [1, 6]` cho luật "1 hoặc 6").
Đi đúng số bước, không nhảy qua ngựa khác; dừng đúng ô đối thủ thì đá ngựa đó về chuồng; không dừng lên ngựa mình.
Hết vòng phải dừng đúng cửa chuồng đích; từ cửa gieo n vào bậc n; trong chuồng lên bậc k+1 phải gieo đúng k+1.
Ai đủ 4 ngựa trong chuồng đích trước thì thắng. 2 người ngồi đối diện (Đỏ – Vàng).

## Điều khiển
Gieo: chạm bàn/xúc xắc hoặc Space/Enter. Chọn ngựa: chạm ngựa có viền vàng (hoặc chấm đích) hoặc phím 1–4; chỉ 1 nước thì tự đi. P: tạm dừng.

## Ghi chú cho lúc ghép asset
`board.webp` có màu góc chuồng không khớp màu nhánh (góc xanh lá ở dưới-phải nhưng nhánh xanh lá ở trái; vàng ngược lại).
Khi ghép: đặt ngựa trong chuồng xuất phát theo **góc cùng màu** trên ảnh — không ảnh hưởng luật, không cần tạo lại ảnh.
