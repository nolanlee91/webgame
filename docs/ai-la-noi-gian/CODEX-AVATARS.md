# Ai Là Nội Gián: 8 chân dung người chơi (giao cho Codex)

Chủ dự án đã duyệt quota ngày 25/11/2026 (audit PTY-10). Hiện người chơi là **ô màu + chữ cái đầu** (`prototype/games/ai-la-noi-gian/app.js`, hàm `avatar()`, 8 màu ghế `SEAT_COLOR`). Mục tiêu: thay bằng 8 chân dung pixel V5, mỗi ghế (0–7) một nhân vật cố định.

## Hợp đồng asset

| Mục | Yêu cầu |
|---|---|
| File | `prototype/games/ai-la-noi-gian/assets/avatars.webp`: một sheet ngang 8 ô, WebP **lossless**, alpha cứng (không bán trong suốt) |
| Cỡ ô | **96×96 px** mỗi ô ⇒ sheet 768×96. Lưới 2× (1 điểm vẽ = ô 2×2 px ⇒ 48×48 điểm vẽ/ô) |
| Thứ tự ô | trái → phải = ghế 0 → 7 (khớp `SEAT_COLOR[0..7]`) |
| Khung hình | Chân dung bán thân (đầu + vai), mặt nhìn thẳng hoặc ¾, đỉnh đầu cách mép trên ~6 px, vai chạm mép dưới. Mắt ở khoảng y = 40–46 px để 8 ô thẳng hàng |
| Nền | **Trong suốt**: game tự vẽ nền màu ghế + viền phía sau. Không vẽ khung, không vẽ chữ |
| Bảng màu | Art bible V5 (`docs/art-bible-v5.md`), viền tối 2 px quanh dáng người, bóng cứng, không chuyển màu mượt, không khử răng cưa |
| Đọc được ở 36 px | Dáng tóc / phụ kiện khác nhau rõ (nhìn bóng đen cũng phân biệt được 8 người) |
| Kèm theo | `assets/avatars-x4-preview.png` (phóng nearest 4× để soi) và cập nhật `assets/asset-manifest.json` (mục `avatars`: file, cell 96, count 8, thứ tự ghế, tên nhân vật) |

## 8 nhân vật (người lớn, bối cảnh mật vụ đô thị Việt Nam, khớp poster + 8 thẻ vai đang có)

Không được lộ vai trò: không ai cầm USB hack hay đeo còng; trông như 8 đồng nghiệp bình thường trong cùng một đội. Đa dạng tuổi và giới, ăn mặc đời thường, lịch sự.

| Ghế | Màu ghế | Nhân vật | Nét nhận diện |
|---|---|---|---|
| 0 | vàng `#f5d77f` | Anh trưởng nhóm ~40 tuổi | tóc vuốt gọn, ria mỏng, áo vest xám, cà vạt |
| 1 | xanh nhạt `#7ec8e3` | Chị kỹ thuật ~28 tuổi | tóc bob ngang cằm, kính gọng tròn, áo khoác hoodie |
| 2 | cam `#f29e6d` | Chú bảo vệ ~55 tuổi | tóc muối tiêu cắt ngắn, lông mày rậm, áo sơ mi kaki |
| 3 | xanh lá `#9fd88a` | Cậu thực tập ~22 tuổi | tóc xù, tai nghe quàng cổ, áo thun |
| 4 | tím `#d6a2f0` | Cô phân tích ~35 tuổi | tóc búi cao, khuyên tai nhỏ, áo blazer |
| 5 | hồng `#f28fae` | Bạn nữ liên lạc ~25 tuổi | tóc dài buộc đuôi ngựa, kẹp tóc, áo len cổ lọ |
| 6 | ngọc `#6fe0c6` | Anh hiện trường ~32 tuổi | đầu cạo sát, râu quai nón ngắn, áo khoác bomber |
| 7 | be `#e8c39e` | Bà cố vấn ~60 tuổi | tóc bạc uốn ngắn, kính dây đeo, khăn quàng |

Màu áo nên hợp (không trùng hẳn) màu ghế để vẫn nhận ra ghế khi nền ghế bị tối (người chơi bị loại sẽ xám đi).

## Luật

- Vẽ đúng lưới 2×, alpha cứng, WebP lossless; không phóng to mượt ảnh lớn rồi thu nhỏ mờ. Nếu tạo bằng ảnh AI cỡ lớn thì phải thu về lưới 48×48 bằng nearest, sửa tay điểm lỗi, rồi phóng 2× nearest.
- 8 nhân vật cùng một phong cách, cùng ánh sáng (sáng từ trên trái), cùng độ dày viền.
- Không chữ, không logo, không vũ khí, không biểu cảm đáng sợ (game có trẻ em chơi).
- Tối đa **8 lượt tạo ảnh** (mỗi nhân vật 1 lượt) + được 2 lượt làm lại nếu lệch phong cách. Ghi prompt thật vào `assets/generation-prompts.json`.
- Không sửa code game. Dev sẽ tích hợp sau khi nhận asset.
- Làm trên nhánh riêng `codex/noi-gian-avatars`, commit, ghi bàn giao vào `assets/HANDOFF.md` (mục mới "Chân dung người chơi"): file, cỡ, số lượt đã dùng, ảnh preview, commit hash. Không push master.

## Dev làm sau khi nhận

`avatar()` vẽ `<span class="av" style="--c:…; --i:N">` với nền màu ghế + `background: url(assets/avatars.webp) calc(var(--i) * -100%) 0 / 800% 100%`, `image-rendering: pixelated`; giữ chữ BOT cho máy; giữ lọc xám cho người bị loại / mất kết nối. Tăng `?v=`.
