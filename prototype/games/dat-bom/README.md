# Đặt Bom — giao diện

Game đấu trường 2–4 người online: đặt bom phá gạch, nhặt vật phẩm (tăng tốc, thêm bom, lửa dài), hạ đối thủ. Máy chủ ở `games-server/dat-bom/`.

- `logic.js`: luật chung cho cả máy chủ và trình duyệt (ES module).
- `app.js`: kết nối/nối lại, màn đầu (tạo phòng, nhập mã, phòng công khai), phòng chờ, vòng vẽ canvas, điều khiển, chat, âm thanh.
- `index.html`, `style.css`: bố cục theo Ai Là Nội Gián. Trên điện thoại hiện D-pad và nút BOM, khung chat nằm dưới bàn.
- Link mời có dạng `?p=MÃ`, mở ra là ô mã đã điền sẵn.

Điều khiển: phím mũi tên hoặc WASD để đi, Space/Enter để đặt bom. Trên màn cảm ứng: giữ và kéo trên D-pad, bấm BOM.

Đồ hoạ: bộ sprite Pixel V5 của Codex trong `assets/` (tọa độ trong `assets/HANDOFF.md`, hash trong `assets/asset-manifest.json`). Canvas 64 px mỗi ô, đúng cỡ sprite. Lửa: pha tính từ lúc ô bắt đầu cháy, hình tâm/ngang/dọc/đầu nhánh suy từ ô kề. Ghế 4 là màu xanh lá theo bộ ảnh.
