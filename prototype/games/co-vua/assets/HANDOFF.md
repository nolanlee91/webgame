# Bàn giao asset Cờ Vua — Dev Phụ
Ngày 18/11/2026. Chỉ ảnh + dữ liệu mô tả; chưa tích hợp game, không sửa luật/UI, không commit/push/deploy.

## File
- board.webp: ảnh bàn gốc có viền gỗ, 1254×1254px. Lưới do AI vẽ có độ lệch khoảng cách nhỏ; không lấy trung bình ô trên bản này để tính gameplay.
- board-grid.webp: bản ưu tiên cho gameplay, 576×576px, đã xuất lại các khoảng lưới thành đúng 64px bằng cắt/resample nearest-neighbor rồi đóng gói. Padding32px. Không tạo thêm nội dung AI ở bước này.
- pieces.png: atlas 384×128, 6 cột × 2 hàng, mỗi frame64×64, nền trong suốt.
- pieces/: 12 ảnh quân lẻ64×64, cùng nội dung atlas, không cần tự cắt.
- asset-manifest.json: tọa độ frame, anchor, tên quân, kích thước bàn, số lượng mỗi loại mỗi bên.
- initial-position.json: vị trí xuất phát theo chỉ số col,row, gốc ở trên-trái; 32 quân.
- generation-prompts.json: prompt dùng tạo ảnh và chỉnh nền.
- sha256.json: SHA-256 cho các file bàn giao, trừ chính sha256.json.

## Tọa độ bản lưới chuẩn
- 8 cột c=0..7, 8 hàng r=0..7. Vùng ô bắt đầu[32,32], mỗi ô64×64; tâm ô[64+64*c,64+64*r].
- Đặt nguyên frame64×64 tại[32+64*c,32+64*r]. Anchor chân quân[32,60]. Quân giữ tương quan chiều cao: Vua cao nhất, Tốt thấp nhất.
- a8 ở trên-trái là ô sáng; a1 ở dưới-trái là ô tối. Trắng ở dưới, Đen ở trên. Hậu đứng trên ô cùng màu với mình.

## Thứ tự và cách nhận quân
Atlas hàng0 Trắng, hàng1 Đen. Cột: king/Vua, queen/Hậu, rook/Xe, bishop/Tượng, knight/Mã, pawn/Tốt.
Mỗi bên: Vua1, Hậu1, Xe2, Tượng2, Mã2, Tốt8 =16 quân. Nhân bản sprite cùng loại theo initial-position.json.
Vua có thập nhỏ, Hậu có vương miện nhiều chóp, Xe có răng thành, Tượng có khe chéo, Mã là đầu ngựa, Tốt thấp.

## Phương pháp và phong cách
3 lượt tạo/chỉnh ảnh tích hợp: bàn + bộ quân + một lượt làm sạch nền quân. Không dùng API trả phí riêng. Tham chiếu board-v5 của Cờ Cá Ngựa về palette gỗ ấm, viền tối, cạnh bậc pixel và bóng cứng; không chép bố cục Ludo.
Sau sinh ảnh: đọc kiểm bàn/loại quân; crop sprite, giữ alpha; xuất64px nearest-neighbor; đóng atlas; cắt và đóng lại lưới bàn ở bước64px; lưu ảnh lossless. Không dùng nội suy làm mờ.
Bản lưới chuẩn giảm trang trí và ưu tiên độ đọc. Nếu dùng bản viền gốc, tọa độ thực riêng đã có trong manifest; không dùng công thức64px của bản chuẩn lên bản gốc.

## Kiểm tra
Đã kiểm đếm 8×8 ô, đúng hướng màu, 12 mẫu quân, tất cả frame64×64, có alpha0 ở nền sprite, tổng xuất phát32 quân, đọc lại file sau lưu. Đã xem preview ở kích thước xuất bản.
Có thể kiểm hash bằng Get-FileHash -Algorithm SHA256 với từng file và đối chiếu sha256.json. Giữ image-rendering:pixelated khi hiển thị.
Chưa kiểm trong giao diện/game thật hoặc thao tác chạm trên điện thoại. Nếu thu nhỏ quá mức (ví dụ64px nguồn còn24px hiển thị), vẫn cần kiểm đọc quân thực tế khi ghép UI.

