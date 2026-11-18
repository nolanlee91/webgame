# Đặt Bom — giao diện

Game đấu trường 2–4 người online: đặt bom phá gạch, nhặt vật phẩm (tăng tốc, thêm bom, lửa dài), hạ đối thủ. Máy chủ ở `games-server/dat-bom/`.

- `logic.js`: luật chung cho cả máy chủ và trình duyệt (ES module).
- `app.js`: kết nối/nối lại, màn đầu (tạo phòng, nhập mã, phòng công khai), phòng chờ, vòng vẽ canvas, điều khiển, chat, âm thanh.
- `index.html`, `style.css`: bố cục theo Ai Là Nội Gián. Trên điện thoại hiện D-pad và nút BOM, khung chat nằm dưới bàn.
- Link mời có dạng `?p=MÃ`, mở ra là ô mã đã điền sẵn.

Điều khiển: phím mũi tên hoặc WASD để đi, Space/Enter để đặt bom. Trên màn cảm ứng: giữ và kéo trên D-pad, bấm BOM.

Đồ hoạ hiện là khối pixel vẽ bằng code, tạm thời. `assets/` là bộ ảnh Codex bàn giao (xem `assets/HANDOFF.md`), đang chờ chủ dự án duyệt và chưa nối vào renderer.
