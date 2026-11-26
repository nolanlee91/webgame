# Cờ Tỷ Phú: brief cho Codex, giảm dung lượng ảnh (BRD-06)

Viết bởi dev Đợt 7 (`docs/audits/fixes/D7-home.md`). Chưa dùng quota tạo ảnh: chủ dự án duyệt trước khi Codex làm.

## Vì sao cần vẽ lại (code không tự giảm được)

Trang Cờ Tỷ Phú tải 2.430 KB, trong đó 2 ảnh chiếm 92 %:

| File | Cỡ file | Hiện ra (CSS px) | Số màu | Lưới 2× (ô 2×2 trùng màu) |
|---|---|---|---|---|
| `board-co-ty-phu.webp` | 1.024×1.024, **1.323 KB** | 328–900 (điện thoại 344–374, máy tính 672–900) | 286.301 | **0,1 %** ô 2×2 trùng hẳn |
| `poster-co-ty-phu.webp` | 960×640, **922 KB** | 308–516 rộng | 323.880 | **0,3 %** |
| `cards-keo.webp` (chỉ tải khi rút thẻ) | 768×512, 372 KB | ≤ 320 | 80.718 | 0,7 % |
| `tokens-sprite.webp` | 512×512, 225 KB | 28–56 | 72.372 | 47 % |

Cả hai ảnh lớn là tranh vẽ kiểu "pixel" nhưng **không nằm trên lưới**: gần như không có ô 2×2 nào cùng màu, hàng trăm nghìn màu
chuyển mượt (như ảnh AI chưa lượng tử hoá). WebP lossless của ảnh như vậy luôn nặng (khoảng 10 bit mỗi điểm ảnh).

Code không được làm thay:
- Thu nhỏ kiểu lân cận gần nhất (nearest neighbour) sẽ rụng nét, vì ảnh không có điểm ảnh lặp. Thu nhỏ mượt thì cấm.
- Nén lại lossless ở mức nỗ lực cao nhất (`method=6`, giữ nguyên từng điểm ảnh) chỉ bớt **0,7 %** (bàn 1.323 → 1.313 KB,
  poster 922 → 919 KB). Không đáng thay file nhị phân.
- Dùng WebP lossy thì trái luật asset ("WebP lossless").

## Yêu cầu vẽ lại

Vẽ lại **đúng bố cục hiện tại** (cùng vị trí 40 ô, cùng toạ độ trong `assets/asset-manifest.json`, cùng linh vật, cùng tông màu),
chỉ đổi cách vẽ cho đúng chuẩn pixel của dự án (PLAYBOOK §1.1):

1. **Bàn cờ** `board-co-ty-phu.webp`
   - Vẽ ở **512×512 điểm vẽ**, giao file **1.024×1.024 trên lưới 2×** (mỗi điểm vẽ = ô 2×2 px cùng màu).
   - Bảng màu giới hạn **≤ 96 màu** (gợi ý 64), không dither nhiễu, không gradient mượt.
   - Giữ nguyên hình học: mép bàn, 4 ô góc, 9 ô mỗi cạnh, toạ độ tâm từng ô như manifest hiện tại (code đặt giá, quân, nhà theo các toạ độ đó).
   - Mục tiêu dung lượng: **≤ 200 KB**. Ước lượng của dev (lượng tử hoá thử bản cũ xuống 512×512, 64 màu rồi phóng ×2 lân cận gần nhất,
     chỉ để đo, không dùng): 139 KB ở 64 màu, 172 KB ở 128 màu.
2. **Poster** `poster-co-ty-phu.webp`
   - Vẽ ở **480×320 điểm vẽ**, giao file **960×640 lưới 2×**, ≤ 96 màu.
   - Mục tiêu: **≤ 120 KB** (ước lượng: 84 KB ở 64 màu, 103 KB ở 128 màu).
3. **Không bắt buộc, cùng đợt nếu còn quota:** `cards-keo.webp` vẽ lại lưới 2× ở 384×256 điểm vẽ (file 768×512), mục tiêu ≤ 80 KB.
   `tokens-sprite.webp` đã gần lưới 2× (47 % ô trùng), chỉ cần lượng tử hoá cho sạch, mục tiêu ≤ 80 KB.

Luật chung: alpha cứng (bàn và poster không cần alpha), WebP lossless, không phóng to mượt bản cũ, giữ đúng tên file.

## Khi giao

- Chạy kiểm: mọi ô 2×2 trong file phải cùng màu (≥ 99 %), số màu ≤ 96, dung lượng đạt mục tiêu.
- Cập nhật `prototype/games/co-ty-phu/assets/asset-manifest.json` (bytes, sha256).
- Báo dev để làm phần code:
  - Đổi `?v=d7a` của `board-co-ty-phu.webp` (2 chỗ trong `index.html`: CSS `html.tp-board .board` và script tải sau ở cuối trang) và
    `poster-co-ty-phu.webp` (CSS `.poster` và `<link rel="preload">`).
  - Đổi `image-rendering` của `.board, .poster` từ `auto` sang `pixelated` (ảnh lưới 2× hiện ở 0,3–0,9× vẫn nên vẽ mượt khi thu nhỏ;
    dev sẽ soi lại ở 360 và 1.920 để chọn).
  - Đo lại trên Fast 3G + CPU ×4. Kỳ vọng tổng trang từ 2.430 KB xuống khoảng 500 KB, tải xong dưới 5 s.
