# Cờ Tỷ Phú — Lụm Kèo Đại Phú: bàn giao asset

Đợt đầu dùng **6 lượt AI** cho 6 nhóm asset. Lần sửa này dùng đúng **1 lượt thay thế bàn cờ 24 ô bằng 40 ô**, không tạo lại 5 ảnh khác và không mở thêm gói 6 lượt. Bộ bàn giao vẫn gồm 6 ảnh chính. Log kỹ thuật ghi tổng 7 lần gọi thực tế (6 ban đầu + 1 thay thế), tách riêng ngân sách/slot ảnh hiện hành để không nhầm. Công cụ image_gen tích hợp; không dùng CLI/API fallback. Chỉ tạo và đóng gói ảnh, chưa code gameplay, chưa commit/push.

Đối chiếu Art Bible V5: hạt pixel rõ, outline tối, gờ vát cứng, màu đất nung/nâu gỗ/vàng phố cổ/teal; bối cảnh phố Việt và linh vật nguyên bản, không dùng mascot/logo Monopoly. Poster dùng đồ vật linh vật biểu cảm, không có nhân vật người chibi. Đã xem ảnh gốc và contact sheet sau thu nhỏ; chờ chủ dự án duyệt mỹ thuật cuối.

## 6 file ảnh chính

| File | Kích thước | Ghi chú |
|---|---|---|
| `board-co-ty-phu.webp` | 1024×1024 | 40 ô, 4 góc + 32 đất + 2 Kèo Thơm + 2 Kèo Thối; trung tâm cỏ |
| `tokens-sprite.webp` | 512×512, RGBA | 2×2, mỗi ô 256×256, nền trong suốt |
| `buildings-sprite.webp` | 64×64, RGBA | 2×2, mỗi ô 32×32, nền trong suốt |
| `cards-keo.webp` | 768×512 | 2 thẻ đứng 384×512 đặt cạnh nhau, nền tối, không chữ |
| `hud-dice-icons.png` | 160×64, RGBA | 5×2, mỗi ô 32×32, nền trong suốt |
| `poster-co-ty-phu.webp` | 960×640 | 3:2, 4 linh vật quanh bàn giữa phố đèn lồng |

WebP lossless. Đóng gói bằng fit theo tỷ lệ và nearest-neighbor resize; không vẽ sửa nội dung ảnh bằng code. Alpha sinh từ AI được giữ trong cả WebP sprite và PNG HUD. Không cần thêm thumbnail thẻ vì đây là mặt sau thẻ; không có lượt AI bổ sung cho bản thu nhỏ.

## Tọa độ sprite

Tất cả là tọa độ nguồn; gốc trái trên. Manifest có `x,y,width,height` từng sprite.

**Token** — mỗi ô 256×256:

| ID | x | y | Linh vật / màu ghế |
|---|---:|---:|---|
| `xich-lo-red` | 0 | 0 | Xích lô / Đỏ |
| `non-la-blue` | 256 | 0 | Nón lá / Xanh dương |
| `ca-phe-phin-yellow` | 0 | 256 | Cà phê phin / Vàng |
| `trau-vang-green` | 256 | 256 | Trâu vàng, nơ và đế xanh / Xanh lá |

Trâu có thân vàng kim nhưng ghế của nó là **Xanh lá**, không phải ghế Vàng. Không suy ra ghế chỉ từ màu thân. Thu token về 64×64 hoặc 96×96 tùy UI, giữ nguyên tỷ lệ, dùng đáy ô sprite làm mốc chung và kiểm lại anchor sau ghép.

**Công trình** — mỗi ô 32×32:

| ID | x | y |
|---|---:|---:|
| `level-1-thatched-house` | 0 | 0 |
| `level-2-townhouse` | 32 | 0 |
| `level-3-villa-hotel` | 0 | 32 |
| `ownership-flag` | 32 | 32 |

Cờ gốc màu đỏ. Muốn cờ bốn chủ sở hữu, Dev nên thêm viền/marker màu riêng hoặc tint phần lá cờ; không tint toàn bộ atlas/nhà. Nếu cần công trình lớn hơn 32px, có đường dẫn ảnh gốc trong prompt log để xuất lại độ phân giải cao hơn, không cần lượt AI mới.

**Thẻ**: `keo-thom` = (0,0,384,512); `keo-thoi` = (384,0,384,512). Không có nội dung chữ. Mặt trước/nội dung sự kiện do HTML/canvas render riêng, không đè đoạn văn lên hoa văn mặt sau.

**HUD** — mỗi ô 32×32:

| Hàng | Nội dung theo thứ tự trái → phải | y |
|---|---|---:|
| 1 | `dice-1`, `dice-2`, `dice-3`, `dice-4`, `dice-5` | 0 |
| 2 | `dice-6`, `polymer-banknotes`, `gold-bag`, `jail-handcuffs`, `prohibition` | 32 |

Các cột có x = 0,32,64,96,128. Đã đếm trực quan đúng 1–6 chấm cả trước và sau thu nhỏ. Icon chỉ để hiển thị; giá trị xúc xắc phải lấy từ logic/trọng tài.

## Bàn cờ: lưu ý bắt buộc khi ghép

Đếm được **40 ô riêng biệt**: 11 ô trên + 11 ô dưới + 9 ô giữa cạnh trái + 9 ô giữa cạnh phải. Mỗi cạnh có **11 ô tính cả hai góc**, tức 10 bước mỗi cạnh khi dùng chung góc.

**Bàn không chia lưới đều tuyệt đối. Dev bắt buộc dùng tọa độ từng ô, không tự chia đều.** Góc lớn hơn ô đất; ô sự kiện giữa cạnh bên cũng có chiều cao khác ô đất. Manifest ghi `x/y/width/height/center` theo viền minh họa đã đo, không dùng tọa độ lý tưởng trong prompt. Đã xem bản preview kẻ tọa độ để đối chiếu đủ 40 vùng; đây là tọa độ gần đúng phục vụ ghép UI, cần xác nhận hitbox với UI thực tế. Khi co giãn, scale toàn bộ board và overlay cùng một hệ tọa độ 1024×1024.

`board.tiles` có thứ tự **0 ở góc dưới phải**, đi sang trái rồi lên cạnh trái, sang phải cạnh trên, xuống cạnh phải:

- 0 Xuất Phát; 10 Nhà Tù; 20 Bến Xe; 30 Vào Tù.
- 5 và 35 Kèo Thối; 15 và 25 Kèo Thơm.
- 32 ô còn lại là đất. Giá và tên do code render. Dải màu minh họa: trên teal, phải đỏ đất nung, dưới xanh dương, trái vàng; dữ liệu vùng/màu chủ sở hữu vẫn do logic quyết định.
- Trung tâm cỏ khoảng x178,y185,w668,h659, dành cho khay xúc xắc/thẻ/thông báo.

Nếu gameplay yêu cầu bàn có ô **đều tuyệt đối** thì bản minh họa này không đáp ứng tiêu chí đó; cần lớp ô chuẩn do Dev dựng thay cho đường viền minh họa, hoặc một lượt sửa ảnh được duyệt riêng. Không giả định ảnh này là lưới toán học chính xác.

## Kiểm chứng

`generation-prompts.json`: 6 prompt của bộ ảnh hiện hành, prompt bàn 24 ô được chuyển vào `superseded`; có ghi 1 lần thay thế và tổng số lần gọi thực tế. `asset-manifest.json`: 6 file chính, kích thước, mode, byte size, SHA-256, các sprite và **40 tọa độ bàn**. So SHA-256 bằng `Get-FileHash -Algorithm SHA256 <file>`.

Đã kiểm đủ file, tỷ lệ, alpha và tọa độ không vượt kích thước atlas; xem preview sau xuất. Lần sửa bàn 40 ô đã đối chiếu SHA-256: **cả 5 ảnh còn lại giữ nguyên từng byte**. Chưa kiểm trong gameplay/trên thiết bị di động thật. Chưa sửa file của game khác. Đề cương MVP cũ vẫn mô tả 24 ô; cần Dev cập nhật cấu hình/luật theo quyết định bàn 40 ô, không đọc số ô từ đề cương cũ.
