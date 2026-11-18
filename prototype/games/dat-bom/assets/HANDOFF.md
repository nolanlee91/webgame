# Đặt Bom — bộ asset Pixel V5

Tài sản hình ảnh cho Lụm Kèo: sân lát đá phố Việt, tường đá gia cố, gạch đất nung, nhân vật trưởng thành mặc đồ bảo hộ bốn màu. Hạt pixel rõ, outline tối, bevel và bóng cứng theo Art Bible V5. Không sử dụng nhân vật/trang phục Bomberman có sẵn. Đã xem ảnh gốc và bản thu nhỏ, có GIF xem khung đi bộ; chờ chủ dự án duyệt mỹ thuật cuối và Dev kiểm tra trong renderer thực.

**Chỉ bàn giao asset, không sửa logic/gameplay, chưa commit/push.**

## File và tọa độ

| File | Kích thước | Nội dung |
|---|---|---|
| `map-tiles.webp` | 128×128 | 2×2 ô 64px: sàn, tường cứng, gạch phá A, gạch phá B |
| `player-red.png` | 192×256 | 3 cột × 4 hàng, 12 frame 64×64 |
| `player-blue.png` | 192×256 | Như trên, ghế Xanh dương |
| `player-green.png` | 192×256 | Như trên, ghế Xanh lá |
| `player-yellow.png` | 192×256 | Như trên, ghế Vàng |
| `bomb-sprite.png` | 128×128 | 2×2, 4 frame nhấp nháy 64×64 |
| `explosion-sprite.png` | 256×192 | 4 cột × 3 hàng, 12 module/pha 64×64 |
| `powerups-sprite.png` | 96×32 | 3 icon 32×32 |
| `poster-dat-bom.webp` | 960×640 | Poster 3:2 dùng cho card/banner/loading |

PNG đều RGBA có nền trong suốt thật; WebP dùng lossless. Dùng nearest-neighbor, `image-rendering: pixelated`; Canvas `imageSmoothingEnabled=false`. Không dùng kích thước ảnh để quyết định va chạm/quyền sở hữu/tầm nổ.

### Ô bản đồ

Mỗi vùng 64×64, gốc tọa độ trái trên:

- `floor`: (0,0).
- `solid-wall`: (64,0), không phá được.
- `breakable-brick-a`: (0,64).
- `breakable-brick-b`: (64,64).

Sàn là nền walkable; các ô tường/gạch là hình bề mặt đặc che kín ô. Hai biến thể gạch cùng loại logic phá được. Sàn có đường mạch đá; chưa bảo đảm seamless tuyệt đối tại mọi cạnh, cần xem map lớn sau ghép. Không có cả bản đồ gameplay vẽ sẵn: Dev ghép từng ô theo state.

### Nhân vật — 4 atlas có cùng bố cục

Mỗi frame 64×64. Hàng y=0 **down**, y=64 **left**, y=128 **right**, y=192 **up**. Cột x=0 **step-a**, x=64 **idle**, x=128 **step-b**.

Đứng yên chọn cột 1. Đi bộ dùng chỉ số cột **[0,1,2,1]**, gợi ý 110ms/frame. Điểm đặt chân **[32,60]** tính trong frame, ở mọi màu/hướng. Khi vẽ, đặt điểm chân vào tâm chân nhân vật trong ô gameplay; hitbox do logic định nghĩa riêng. Đã cắt từ lưới gốc, chuẩn hóa chiều cao/scale trong từng atlas và canh alpha-bounds về cùng mốc chân. Các pose là các khung AI riêng, không phải rig cơ thể; mức thay đổi nhỏ giữa pose vẫn cần xem trong game khi nội suy vị trí.

Không recolor bằng CSS để tạo bốn người: có sẵn 4 atlas màu/skin độc lập. Cùng bộ đồ bảo hộ trưởng thành, không mũ robot/đầu khổng lồ chibi.

### Bom

`idle`=(0,0), `amber-flash`=(64,0), `red-flash`=(0,64), `white-flash`=(64,64), tất cả 64×64. Đây là quả bom **hoạt hình trong game**, 4 frame cảnh báo thay vì mô tả cơ chế vật lý. Gợi ý nhịp 180ms/frame có thể tăng tốc gần deadline; hạn nổ thực phải do logic/trọng tài quyết định. Khi hết hạn, bỏ sprite bom và render các ô nổ theo dữ liệu ván.

### Nổ lan theo ô

Hàng y=0 **ignite**, y=64 **peak**, y=128 **fade**. Cột x=0 **center**, x=64 **horizontal**, x=128 **vertical**, x=192 **cap-right**. Mỗi frame vẫn 64×64. Gợi ý 100ms/pha, không lặp.

- Ô đặt bom dùng `center`.
- Các ô giữa nhánh ngang/dọc dùng `horizontal`/`vertical` tương ứng.
- Ô cuối nhánh dùng `cap-right`, xoay quanh [32,32]: phải 0°, xuống 90°, trái 180°, lên 270° theo chiều kim đồng hồ trong Canvas y hướng xuống.
- Nếu nhánh không có ô hợp lệ, không vẽ thêm cap ra ngoài tâm.
- Tường cứng, gạch phá được và bom nối chuỗi phải xử lý bằng logic; ảnh không chứa luật hay giới hạn phạm vi.

Đã cắt bỏ gutter trong nguồn và chuẩn hóa đoạn nối theo trục để chạm cạnh ô. Cột dọc có vài pixel của sprite láng giềng ở mép ảnh gốc; khi trích xuất đã chọn dải trung tâm của cột để loại phần lẫn đó, rồi crop/resize. Đây là thao tác cắt sprite, không vẽ hiệu ứng thay bằng code. Các viền/độ dày qua pha có thể khác nhẹ; cần kiểm mối nối và thứ tự layer trên renderer thật. Không stretch cả atlas hoặc dùng alpha của ảnh làm vùng sát thương.

### Vật phẩm

Mỗi vùng 32×32: `speed-up`=(0,0), `bomb-count-up`=(32,0), `blast-range-up`=(64,0). Tăng tốc là ủng xanh có vệt tốc độ; tăng số bom là huy hiệu đỏ hai quả bom; tăng tầm nổ là bốn mũi tên cam. Nên hiển thị 32px hoặc 64px và có nhãn/aria-label trong UI. Đặt trong ô 64px với offset [16,16] nếu dùng native32px.

## Manifest, nguồn và số lượt

`asset-manifest.json` có 9 file (kích thước/mode/bytes/SHA-256), **71 tọa độ sprite**, 6 định nghĩa animation (4 nhân vật + bom + nổ), anchor và phép xoay cap. `generation-prompts.json` giữ đúng toàn bộ prompt đã gửi và đường dẫn 9 ảnh gốc nhận được.

Đã gửi **11 yêu cầu tạo ảnh**, nhận **9 ảnh dùng được**. Batch đầu chỉ trả ảnh map; hai yêu cầu còn lại không trả file, trong đó có một phản hồi từ chối an toàn. Không xác định riêng được yêu cầu nào trong hai yêu cầu đầu trả lỗi vì batch bị kết thúc cùng lúc; log đánh dấu `no-artifact-delivered` cho cả hai. Thiết kế bom/vật phẩm được thu gọn thành biểu tượng hoạt hình arcade và tạo thành công ở lượt sau. Không dùng CLI/API fallback, không có thao tác dựng bom thật hoặc hướng dẫn vật lý.

Các bước đóng gói: cắt ô nguồn, resize nearest-neighbor, chuẩn hóa mốc chân nhân vật và crop module nổ; giữ alpha ảnh nguồn. Không sao chép asset từ game khác, không sửa file logic của Dev. SHA-256 có thể kiểm bằng `Get-FileHash -Algorithm SHA256 <file>`.

## Kiểm tra đã làm / còn lại

- Đủ 4 tile, 4 màu × 12 frame, 4 frame bom, 12 module nổ, 3 vật phẩm, poster.
- Đã mở xem nguồn và contact sheet sau xuất; kiểm mọi frame nằm trong atlas, đúng kích thước và có alpha; hash khớp file.
- Có GIF xem đi bộ 4 hướng × 4 màu để duyệt.
- Chưa ghép vào gameplay/browser/mobile thật; chưa xác nhận collision, tốc độ chạy hay thời gian nổ. Đây là trách nhiệm logic và bước kiểm thử tích hợp, không phải kết quả kiểm chứng của bộ ảnh.
