# Đặt Bom — máy chủ online

Phòng 2–4 người + chat, đường WebSocket `/ws/dat-bom`. Luôn chạy cùng `server.js` (không có biến bật/tắt).

## File

| File | Việc |
|---|---|
| `host.js` | Nhận kết nối, tạo/vào/nối lại phòng, danh sách phòng công khai, hạn mức gói tin (gói đi riêng: 30/giây; gói khác: 5/giây), dọn phòng trống. |
| `room.js` | Một phòng: phòng chờ → ván → kết thúc → ván mới / về phòng chờ. Máy chủ chạy ván 20 nhịp/giây bằng `prototype/games/dat-bom/logic.js`. |
| `chat.js`, `ws.js` | Chép từ Cờ Cá Ngựa. `ws.js` nới hạn mức khung (80, 45/giây) và bộ đệm, vì gói đi gửi liên tục. |
| `dev.js` | Chạy thử: `npm run dev:dat-bom` rồi mở http://localhost:8768/games/dat-bom/ |

## Luật máy chủ giữ

- Bản đồ, bom, lửa, nổ dây chuyền, vật phẩm, điểm, thắng/thua: tất cả do máy chủ tính, trình duyệt chỉ vẽ.
- Trình duyệt tự đi trước cho mượt (dùng chung hàm `move`), gửi vị trí khoảng 50 ms một lần. Máy chủ kiểm tra bằng `tryMove`: không vượt tốc độ (có dư cho rung mạng), không xuyên tường/bom, mỗi lần chỉ sang ô kề. Sai thì trả `fix` kéo về.
- Thắng: người sống sót cuối cùng. Hết 3 phút: người còn sống nhiều điểm nhất thắng, bằng điểm thì hoà. Hạ người 100, phá gạch 10, nhặt vật phẩm 5.
- Rời phòng giữa ván ⇒ bị loại. Mất mạng thì vẫn giữ ghế; tải lại trang sẽ vào lại đúng ghế.

## Gói tin

Gửi lên: `create{name,public}`, `join{code,name}`, `resume{code,token}`, `list`, `leave`, `mv{x,y,d}`, `bomb{x,y,d}`, `public{on}`, `start`, `again`, `lobby`, `chat{text}`.

Nhận về:
- `state{v}`: phòng, người chơi, chat, kết quả. Chỉ gửi khi có thay đổi.
- `f`: khung ván, 20 lần/giây. Gồm bản đồ, bom, lửa, vật phẩm, người chơi và sự kiện.
- `fix`, `list`, `joined`, `err`.

## Test

- `npm run test:dat-bom`: 21 test luật + phòng qua WebSocket thật.
- `npm run test:dat-bom:e2e [thư mục ảnh]`: Chrome headless, 3 người trong 3 cửa sổ, một người ở khung điện thoại 390×844 cảm ứng. Kiểm phòng chờ, link mời, phòng công khai, chat, đi bằng phím và D-pad, đặt bom, thắng, ván mới, hết giờ, về phòng chờ, rời phòng, tải lại trang. Trang không được có lỗi JS, không ghi console, không tràn ngang.
