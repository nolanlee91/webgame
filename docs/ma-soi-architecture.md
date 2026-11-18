# Ma Sói online: phòng, ngày/đêm, giữ bí mật vai

Trạng thái: bản dev, chưa bật ở production. Máy chủ chỉ chạy khi có `MASOI_ONLINE=1`. Thiết kế game: `docs/ma-soi-game-design-mvp.md`.

## Chạy thử
- `npm run dev:ma-soi` rồi mở `http://localhost:8766/games/ma-soi/` ở **6 tab** (mỗi tab là một người).
  Thêm `MASOI_SPEED=0.3` để rút ngắn thời gian mỗi pha.
- `npm run test:ma-soi`: 14 bài test máy chủ, chạy qua WebSocket thật.
- `npm run test:ma-soi:e2e`: Chrome headless, 6 tab chơi trọn một ván. Ảnh chụp lưu vào `prototype/games/ma-soi/screenshots/`.

## Thành phần
| File | Vai trò |
|---|---|
| `games-server/ma-soi/ws.js` | WebSocket tự viết theo RFC 6455, không dùng gói ngoài. Chỉ nhận khung có mặt nạ và khung chữ. Một tin nhắn quá 2 KB hoặc quá 16 mảnh thì đóng 1009. Mỗi kết nối được tối đa 20 khung/giây (cho dồn tới 40), tính cả ping và mảnh rỗng; vượt thì đóng 1008. Khung điều khiển bị phân mảnh hoặc dài quá 125 byte thì đóng 1002. Origin khác host thì trả 403. |
| `games-server/ma-soi/host.js` | Quản lý mã phòng (5 ký tự), danh tính bằng token và giới hạn tốc độ (12 lệnh dồn, hồi 4 lệnh/giây). Mỗi IP được tối đa 16 kết nối và 3 phòng đang mở. Khi chạy sau proxy, chỉ đọc IP từ X-Forwarded-For nếu có `MASOI_TRUST_PROXY=1`, và chỉ lấy phần tử **cuối** (do proxy gần nhất ghi, client không giả được). Chỉ bật cờ này khi backend không nhận kết nối trực tiếp từ ngoài, mà mọi kết nối đều đi qua đúng một proxy có nối thêm header này. Chỉ đẩy góc nhìn cho một ghế khi góc nhìn của ghế đó thay đổi. |
| `games-server/ma-soi/room.js` | Luật chơi và các pha: lobby → reveal → night → dawn → day → vote → verdict → night … → end. `viewFor(seat)` là đường duy nhất để dữ liệu rời khỏi server. |
| `prototype/games/ma-soi/` | Giao diện. Chỉ vẽ đúng góc nhìn server gửi về, không tự suy luận vai. |

## Danh tính (khách, chưa có tài khoản)
- Người chơi chỉ nhập tên hiển thị.
- Server cấp một token ngẫu nhiên 128 bit cho mỗi ghế. Ghế luôn được tra từ token, không tin số ghế hay tên do client gửi lên.
- Tên không được trùng trong cùng phòng.
- Token được lưu ở `sessionStorage` (theo tab) và `localStorage` (bản dự phòng trên máy). Nhờ vậy, lỡ đóng tab vẫn bấm được "Quay lại phòng" để về đúng ghế.
- Nếu cùng một token mở ở tab khác, tab cũ nhận `replaced` và bị đóng.
- Tài khoản thật để sau.
- **Ranh giới khôi phục:** bản dự phòng nằm trong `localStorage`, nên **cùng một trình duyệt trên cùng máy** được coi là cùng một khách. Bất kỳ tab nào của trình duyệt đó bấm "Quay lại phòng" đều lấy lại được ghế, và tab cũ sẽ nhận `replaced`. Đây là chủ đích, để "gắn với thiết bị/trình duyệt" theo yêu cầu. Máy khác không lấy được ghế, vì không có token.
- **Rủi ro chấp nhận ở giai đoạn khách:** một người vẫn có thể mở nhiều trình duyệt để chiếm nhiều ghế trong một phòng. Không chặn theo IP được, vì bạn bè ngồi chung một wifi sẽ dùng chung IP. Hạn mức theo IP chỉ ngăn một máy chiếm hết máy chủ. Muốn chặn triệt để thì cần tài khoản thật.

## Ai được thấy gì (`viewFor`)
- **Vai của một người** chỉ hiện trong các trường hợp:
  - đó là vai của chính mình;
  - ván đã kết thúc;
  - người đó đã chết (vai lộ khi chết);
  - mình là Sói và người đó cũng là Sói.
- **Phiếu cắn của bầy (`night.pack`) và Kênh Sói:** chỉ Sói thấy.
- **Kết quả soi:** chỉ Tiên Tri thấy, và chỉ ghi phe chứ không ghi vai.
- **Thông tin Bảo Vệ (`night.mine`, `banned`):** chỉ Bảo Vệ thấy.
- **Phiếu treo cổ:** công khai.
- **Ban đêm:** góc nhìn của dân làng không đổi, nên dân làng không nhận gói nào. Không đoán được có ai đang hành động qua thời điểm gói tin đến. Đêm luôn chạy đủ thời gian.
- **Mã lỗi:** chỉ phụ thuộc vào vai của người gửi, không bao giờ phụ thuộc vào vai của mục tiêu.
- **Phía client:** trang không ghi gì ra console, không có source map, không giữ dữ liệu nào ngoài góc nhìn của chính mình.

## Giao thức
- **Client gửi lên:** `create{name}`, `join{code,name}`, `resume{code,token}`, `start`, `act{target}`, `vote{target|null}`, `chat{text}`, `quick{id}`, `again`, `leave`, `ping`.
- **Server gửi về:** `state{now,v}`, `joined{code,token}`, `err{code,req}`, `pong`, `kicked`, `replaced`, `left`.

## Những điểm cần review độc lập
- Có đường nào để lộ vai, kênh Sói hoặc kết quả soi không: payload, thời điểm gói tin đến, mã lỗi, thứ tự ghế, avatar.
- Có thể giả danh người khác bằng token hoặc số ghế không; có thể chiếm ghế khi resume không.
- Có lệnh nào làm sai luật không: bỏ phiếu hoặc hành động sai pha, người chết hành động, Bảo Vệ chọn trùng hai đêm, Sói cắn Sói.
- Có thể làm sập máy chủ không (DoS): khung WebSocket lỗi, phân mảnh khung, spam lệnh, mở quá nhiều phòng.
