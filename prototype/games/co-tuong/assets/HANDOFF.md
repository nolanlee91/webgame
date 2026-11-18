# Bàn giao asset Cờ Tướng — Dev
Ngày 18/11/2026. Chỉ ảnh + dữ liệu mô tả; chưa tích hợp game, không sửa luật/UI, không commit/push/deploy.

## File
- board.webp: ảnh bàn gốc có viền gỗ, 1196×1315px. Lưới do AI vẽ có độ lệch khoảng cách nhỏ; không lấy trung bình ô trên bản này để tính gameplay.
- board-grid.webp: bản ưu tiên cho gameplay, 577×641px, đã xuất lại các khoảng lưới thành đúng 64px bằng cắt/resample nearest-neighbor rồi đóng gói. Padding32px. Không tạo thêm nội dung AI ở bước này.
- pieces.png: atlas 448×128, 7 cột × 2 hàng, mỗi frame64×64, nền trong suốt.
- pieces/: 14 ảnh quân lẻ64×64, cùng nội dung atlas, không cần tự cắt.
- asset-manifest.json: tọa độ frame, anchor, tên quân, kích thước bàn, số lượng mỗi loại mỗi bên.
- initial-position.json: vị trí xuất phát theo chỉ số col,row, gốc ở trên-trái; 32 quân.
- generation-prompts.json: prompt dùng tạo ảnh và chỉnh nền.
- sha256.json: SHA-256 cho các file bàn giao, trừ chính sha256.json.

## Tọa độ bản lưới chuẩn
- 9 cột giao điểm c=0..8, 10 hàng giao điểm r=0..9. Tâm quân: x=32+64*c; y=32+64*r.
- Sprite quân anchor[32,32], đặt góc trên-trái ở tâm trừ[32,32].
- Sông nằm giữa hàng4 và5. Các đường dọc trong sông ngắt; hai biên ngoài liền.
- Cung: cột3..5, hàng0..2 và7..9. Đen ở trên, Đỏ ở dưới.
- Quân đi trên GIAO ĐIỂM, không đặt ở tâm ô.

## Thứ tự và cách nhận quân
Atlas hàng0 Đỏ, hàng1 Đen. Thứ tự cột và chữ mặt quân:

|Cột|Loại|Đỏ|Đen|
|---|---|---|---|
|0|Tướng / Soái|帥|將|
|1|Sĩ|仕|士|
|2|Tượng|相|象|
|3|Mã|馬|馬|
|4|Xe|車|車|
|5|Pháo|炮|砲|
|6|Tốt / Binh|兵|卒|

Đã thay toàn bộ ký hiệu Latin bằng chữ Hán truyền thống. Dùng 馬 và 車 cho cả hai màu (biến thể truyền thống phổ biến), phân biệt phe bằng màu mực Đỏ/Đen. Chữ đậm và lớn trên nền ngà, xuất nearest-neighbor để không mờ nét.
Mỗi bên: Tướng1, Sĩ2, Tượng2, Mã2, Xe2, Pháo2, Tốt5 =16 quân. Nhân bản sprite theo initial-position.json.
Không dùng lại preview hoặc atlas Latin từ lần bàn giao trước. File và tên sprite không đổi; cần xóa cache ảnh cũ khi tích hợp.

## Phương pháp và phong cách
3 lượt tạo/chỉnh ảnh tích hợp cho Cờ Tướng: bàn + bộ quân gốc + 1 lượt đổi chữ Hán. Lần sửa này dùng đúng 1 lượt. Không dùng API trả phí riêng. Tham chiếu board-v5 của Cờ Cá Ngựa về palette gỗ ấm, viền tối, cạnh bậc pixel và bóng cứng; không chép bố cục Ludo.
Sau sinh ảnh: đọc kiểm bàn/loại quân; crop sprite, giữ alpha; xuất64px nearest-neighbor; đóng atlas; cắt và đóng lại lưới bàn ở bước64px; lưu ảnh lossless. Không dùng nội suy làm mờ.
Bản lưới chuẩn giảm trang trí và ưu tiên độ đọc. Nếu dùng bản viền gốc, tọa độ thực riêng đã có trong manifest; không dùng công thức64px của bản chuẩn lên bản gốc.

## Kiểm tra
Đã kiểm đếm 9×10 giao điểm, hai cung và sông, 14 mẫu quân, tất cả frame64×64, có alpha0 ở nền sprite, tổng xuất phát32 quân, đọc lại file sau lưu. Đã xem preview ở kích thước xuất bản.
Có thể kiểm hash bằng Get-FileHash -Algorithm SHA256 với từng file và đối chiếu sha256.json. Giữ image-rendering:pixelated khi hiển thị.
Chưa kiểm trong giao diện/game thật hoặc thao tác chạm trên điện thoại. Nếu thu nhỏ quá mức (ví dụ64px nguồn còn24px hiển thị), vẫn cần kiểm đọc quân thực tế khi ghép UI.


## Xác minh sửa chữ Hán
Đã kiểm trực quan 14 chữ, atlas64px và preview thu40px; chưa thử trên điện thoại vật lý. Hai ảnh bàn và initial-position.json giữ nguyên SHA-256 so với trước sửa; mọi file Cờ Vua cũng giữ nguyên. Cập nhật sha256.json cho bộ quân và tài liệu mới. Chưa tích hợp/commit/push.
