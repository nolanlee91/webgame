# Cờ Cá Ngựa — bản chơi thử (asset pixel art V4)

Chơi: chạy `python -m http.server 8766` trong `prototype/`, mở `http://127.0.0.1:8766/games/co-ca-ngua/`
(thêm `?players=2|3|4&seed=N` để vào thẳng ván / tái hiện cùng chuỗi xúc xắc).

- `logic.js` — luật thuần (không DOM), trạng thái sao chép được (structuredClone) để sau đưa lên server.
- `game.js` — vẽ canvas + điều khiển, theo hợp đồng `mount(el, ctx) -> { pause, resume, destroy }`. Vẽ bằng asset thật
  `assets/board.webp`, `quan-co.webp`, `xuc-xac.webp`; nếu ảnh không tải được thì tự quay về hình khối tạm (vẫn chơi được).
- `test/logic.test.mjs` — `npm test` (15 test luật + 600 ván ngẫu nhiên).
- `screenshots/e2e.mjs` — test trên Chrome headless bằng chuột/phím/chạm thật, quay video; có kiểm tra toạ độ từng ô so với màu trên ảnh bàn cờ.

## Luật mặc định (chỉnh được qua `rules`)
2–4 người chung một máy, mỗi người 4 ngựa. Gieo 6 mới xuất ngựa và được gieo thêm (`launchOn: [1, 6]` cho luật "1 hoặc 6").
Đi đúng số bước, không nhảy qua ngựa khác; dừng đúng ô đối thủ thì đá ngựa đó về chuồng; không dừng lên ngựa mình.
Hết vòng phải dừng đúng cửa chuồng đích; từ cửa gieo n vào bậc n; trong chuồng lên bậc k+1 phải gieo đúng k+1.
Ai đủ 4 ngựa trong chuồng đích trước thì thắng. 2 người ngồi đối diện (Đỏ – Vàng).

## Điều khiển
Gieo: chạm bàn/xúc xắc hoặc Space/Enter. Chọn ngựa: chạm ngựa có vòng vàng dưới chân (hoặc chấm đích) hoặc phím 1–4; chỉ 1 nước thì tự đi. P: tạm dừng.

## Ghép asset (đã làm)
- Bàn cờ: cắt khung [165,5,950,950] của `board.webp`, vẽ 696×696. Ô trên ảnh không chia đều tuyệt đối nên tâm từng ô
  lấy theo số đo trên ảnh cho từng nhánh (`ART` trong `game.js`), không dùng lưới đều.
- Ảnh có góc chuồng xanh lá/vàng lệch so với nhánh cùng màu (góc xanh lá ở dưới-phải nhưng nhánh xanh lá ở trái; vàng ngược lại).
  Ngựa trong chuồng xuất phát được đặt theo **góc cùng màu** trên ảnh (`ART.seatCorner`). Ô xuất phát mỗi màu có khung "XP"
  tô màu để người chơi biết ngựa ra ô nào. Không đổi luật, không cần tạo lại ảnh.
- Ghế không chơi (2–3 người): góc chuồng bị phủ tối.
- Quân cờ: cắt 4 con ngựa theo màu từ `quan-co.webp`, có số 1–4 để chọn bằng phím.
- Xúc xắc: ảnh `xuc-xac.webp` chỉ có một mặt cố định, nên mặt trên được vẽ lại chấm theo số gieo được (đúng phối cảnh hình thoi).

## Âm thanh (`assets/sfx/`, Codex)
Phát bằng Web Audio, bắt thời điểm từ sự kiện của `logic.js` và hoạt ảnh (luật không đổi):
`do-xuc-xac` khi gieo · `buoc-nhay` mỗi lần ngựa đáp xuống một ô · `da-quan` khi đá ngựa đối thủ · `ve-chuong` khi ngựa vào/lên bậc chuồng đích ·
`thang` khi thắng (sau tiếng về chuồng 0,3 giây). Tắt tiếng: nút "Âm thanh" dưới bàn hoặc phím M (nhớ qua `localStorage` `wgp.muted`;
game đọc `sdk.sound.muted`, core thật sẽ cấp giá trị này). Trình duyệt chỉ cho phát tiếng sau lần chạm/bấm phím đầu tiên.

## Chơi online (2–4 người, mỗi người một máy)
- Mở trang không có tham số → màn vào phòng: nhập tên → **Tạo phòng online** (nhận mã 5 ký tự + link `?room=MÃ`) hoặc nhập mã → **Vào phòng**,
  hoặc **Chơi chung 1 máy** (phòng chờ cũ; đi thẳng bằng `?local=1`). `?players=2|3|4` vẫn vào bàn chung máy luôn (test cũ dùng).
- Máy chủ (`games-server/co-ca-ngua/`, WebSocket `/ws/co-ca-ngua`) giữ ván, **gieo xúc xắc bằng crypto**, kiểm tra đúng người / đúng pha / nước hợp lệ
  bằng chính `logic.js` (không sửa). Client chỉ gửi ý định (`roll`, `move{horse}`) và phát lại hành động máy chủ gửi về để có hoạt ảnh;
  lệch hoặc thiếu gói thì nhận nguyên trạng thái máy chủ.
- Chủ phòng chọn luật + bấm Bắt đầu (≥ 2 người). Rớt mạng: tự nối lại, giữ ghế (token trong `sessionStorage`, mỗi tab một người);
  tải lại trang vẫn vào lại đúng ghế. Người có lượt im lặng 30 s / mất kết nối 8 s / đã rời → máy chủ đi thay.
- **Trò chuyện trong phòng**: mọi ghế đã vào phòng nhắn được cho cả phòng (phòng chờ lẫn trong ván). Tin đi qua máy chủ, máy chủ gắn tên người gửi
  theo ghế (client không tự khai tên được), cắt ký tự điều khiển, tối đa 200 ký tự/tin, mỗi người 4 tin liền rồi ~0,7 tin/giây; chỉ giữ 40 tin gần nhất
  trong bộ nhớ của phòng (mất khi phòng đóng). Máy rộng ≥ 1360px: cột bên phải bàn; nhỏ hơn: nút **Chat** (có số tin chưa đọc) mở bảng nổi / trượt từ dưới.
- File: `online.js` + `online.css` (màn vào phòng, kết nối, ô chat), `game.js` (`ctx.online`, `netState`), `hud.js` (tên, chủ phòng, mất kết nối).
- Máy chủ mặc định **bật** (đã qua review Codex); tắt bằng `COCANGUA_ONLINE=0`. Chạy thử trên máy: `node games-server/co-ca-ngua/dev.js` → http://localhost:8767/games/co-ca-ngua/
- Test: `node --test --test-concurrency=1 games-server/co-ca-ngua/test/*.test.mjs` (máy chủ, 14 test) ·
  `PORT=8767 node prototype/games/co-ca-ngua/screenshots/online-e2e.mjs <thư mục>` (3 trình duyệt thật, 50 kiểm tra gồm chat; cần dev.js đang chạy).
