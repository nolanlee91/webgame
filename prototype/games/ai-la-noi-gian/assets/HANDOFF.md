# Ai Là Nội Gián — bàn giao hình ảnh MVP

Đã dùng đúng **8 lượt image_gen**, mỗi asset một lượt, không có lượt thử lại. Cảnh đêm là lượt chỉnh ánh sáng dựa trên ảnh ngày. Prompt thực tế, thứ tự gọi và đường dẫn ảnh nguồn được giữ trong `generation-prompts.json`. Chỉ tạo asset, chưa tích hợp gameplay, chưa commit/push.

Tham chiếu: `docs/ai-la-noi-gian-game-design-mvp.md` §4–5; `docs/art-bible-v5.md`; đã đối chiếu trực quan thumbnail Rắn Săn Mồi và thẻ Bảo Vệ Ma Sói. Nội dung chuyển sang mật vụ đô thị, âu phục, radar và hồ sơ; không tái sử dụng nhân vật/làng Ma Sói. Đánh giá nội bộ: hạt pixel rõ, viền góc cắt, bóng cứng, nhân vật trưởng thành; chờ chủ dự án duyệt mỹ thuật cuối.

## File chính

| File | Kích thước | Dùng cho |
|---|---|---|
| `role-noi-gian.webp` | 768×1024 | Nội Gián, hồ sơ mật + USB |
| `role-hacker-mat.webp` | 768×1024 | Hacker Mật, máy quét dữ liệu + CRT |
| `role-ky-su-an-ninh.webp` | 768×1024 | Kỹ Sư An Ninh, thẻ khóa + bảng điều khiển khiên |
| `role-dac-vu-hien-truong.webp` | 768×1024 | Đặc Vụ Hiện Trường, sổ chứng cứ + bộ đàm |
| `hq-day.webp` | 1280×720 | Phòng họp 8 ghế ban ngày |
| `hq-night.webp` | 1280×720 | Cùng phòng, tắt đèn, radar xanh + báo động đỏ |
| `hud-icons.png` | 96×64, RGBA | Atlas 3 cột × 2 hàng, mỗi ô 32×32 |
| `poster-ai-la-noi-gian.webp` | 960×640 | Poster 3:2, hai đặc vụ đối đầu |

`thumbs/` chứa 4 thẻ WebP 192×256, cùng tên file tương ứng. Đây là bản thu nhỏ từ 4 lượt tạo thẻ, không phải lượt AI bổ sung. Không tạo mặt sau thẻ vì không nằm trong danh mục 8 lượt; Dev có thể dùng mặt sau trung tính bằng CSS và phải giữ kín vai trò trước khi lật.

## Tọa độ HUD

Tọa độ nguồn, gốc trái trên; mỗi vùng có width=height=32:

| ID trong manifest | Biểu tượng | x | y |
|---|---|---:|---:|
| `radar` | Radar quét | 0 | 0 |
| `handcuffs` | Còng số 8 | 32 | 0 |
| `firewall-shield` | Khiên tường lửa | 64 | 0 |
| `camera-eye` | Mắt camera soi | 0 | 32 |
| `usb-hack` | USB hack | 32 | 32 |
| `lum-keo-badge` | Huy hiệu bắt tay Lụm Kèo | 64 | 32 |

Giữ alpha PNG. Dùng nearest-neighbor / `image-rendering: pixelated`, ưu tiên kích thước 32 hoặc 64px. Bản gốc HUD có alpha mềm nhỏ ở nền, được giữ nguyên, không áp nền màu khi chuyển file. Huy hiệu là biểu tượng bắt tay, không chứa chữ/logo chữ chính thức; tên icon cần đi kèm nhãn/aria-label do UI cung cấp.

## Chuyển cảnh và lớp UI

Ngày: nâu gỗ, hải quân, ánh hổ phách. Đêm: xanh đen terminal, phosphor radar và đỏ cảnh báo theo §4. Các màu phát sáng là ánh sáng cảnh vật, không phải màu nút CTA. Hai ảnh đã được xem cạnh nhau: bàn, 8 ghế, cửa, radar và bảng hồ sơ giữ cùng góc nhìn và vị trí chính. Cùng xuất 1280×720, cùng phép fit/crop trung tâm. Crossfade opacity khoảng 2 giây ở cùng khung, cùng object-fit; có thể dùng mặt nạ dither. AI relight không bảo đảm mọi pixel hình học trùng tuyệt đối; không dùng landmark của ảnh làm tọa độ gameplay. Cần kiểm chứng fade sau khi ghép UI thật.

Không có tên vai, chữ tiêu đề, bộ đếm hoặc nút được vẽ cứng trong ảnh. Dev dựng chữ tiếng Việt và trạng thái ở lớp HTML/canvas riêng để rõ trên mobile và dễ bản địa hóa. Poster 3:2 theo brief, không thay thumbnail homepage 4:3 đang có.

## Kiểm chứng và nguồn

Đã mở xem 8 ảnh AI và contact sheet sau xuất; kiểm tra đủ 8 file chính, đúng kích thước/tỷ lệ, PNG RGBA có alpha, 4 thumbnail đúng 192×256. File WebP dùng lossless; đóng gói bằng fit/crop theo tỷ lệ và resize nearest-neighbor, không vẽ đè nội dung bằng code. Không dùng CLI/API fallback.

`asset-manifest.json` có byte size, mode, kích thước và SHA-256 của từng ảnh chính. Có thể kiểm tra bằng PowerShell: `Get-FileHash -Algorithm SHA256 <tên-file>` rồi so với trường `sha256`. Các ảnh gốc còn tại đường dẫn được ghi trong prompt log.
