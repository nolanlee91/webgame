# Lụm Kèo — trang chủ "The Grand Arcade Lobby"

Tên thương hiệu **Lụm Kèo**, slogan **"Rủ bạn vào chơi"**. Prototype tĩnh (HTML/CSS/JS thuần, không cần cài gì),
bố cục theo `docs/homepage-redesign-spec.md`, Pixel UI theo Art Bible V5 (cùng ngôn ngữ với Cờ Cá Ngựa / Đào Vàng).

## Bố cục 3 tầng
- **Thanh trên**: logo + slogan · tìm game (không dấu). Không đặt nút phòng ở đây để khỏi trùng với sảnh chờ.
- **Tầng 1 — Arena** (desktop ≥1181 chia ~30/70, 1024–1180 chia ~42/58): trái là **carousel** các game nổi bật
  (`HERO_SLIDES`, tự chuyển, nút ‹ › + chấm, vuốt trên mobile; ảnh 4:3 hiện trọn bằng `object-fit: contain`, nút vàng "Chơi ngay");
  phải là **Sảnh chờ trực tiếp** — chỗ DUY NHẤT để vào/tạo phòng: ô nhập mã 6 ký tự + "Vào phòng", "Tạo phòng mới"
  (cuộn tới kệ Đối kháng đông người để chọn game), 12 phòng đang chờ xếp 3 phòng/hàng (2 phòng/hàng khi màn hẹp hơn).
- **Tầng 2 — Kệ game**: tab lọc liền khối = **đúng các kệ** (`SHELVES` trong `games.js`): Tất cả · Đối kháng đông người ·
  Giải đố · Hành động · Trí tuệ — tên và số đếm khớp kệ bên dưới vì cả hai dùng chung hàm `group()` (game trong `DUELS`
  thuộc kệ Đối kháng, còn lại theo `cat`; mỗi game đúng 1 kệ). Mọi kệ cùng một kiểu ô 4:3, lưới 6 ô/dòng.
- **Tầng 3 — Footer**: banner tài trợ SpeakUp Kids, bản quyền, bật/tắt âm thanh (`wgp.muted`, dùng chung với game).

Mobile (<720px): thanh trên chỉ có logo + slogan, ô tìm ở đầu trang, carousel rồi sảnh chờ xếp dọc (ô mã + nút to
"Tạo phòng mới"), phòng chờ thành dải vuốt ngang (3 hàng), mọi kệ 3 cột; vùng chạm ≥ 40px.

Quy ước màu: **vàng chỉ dùng cho nút chính "Chơi ngay"**; mọi hành động phòng (Tạo phòng, Vào) là xanh ngọc.
Pixel UI: viền đen 3px góc khuyết, vát sáng/tối 2px, bóng đổ cứng, bấm lún 4px; không bo góc, không blur.

Số người online, số phòng và các phòng chờ là **số minh họa** (`LOBBY_ROOMS`, `DUELS` trong `games.js`).

## Chạy
```
cd prototype/homepage
python -m http.server 8765
```
Mở http://127.0.0.1:8765/

Muốn bấm "Chơi ngay" ở Đào Vàng / Cờ Cá Ngựa để vào game thật (`../games/dao-vang/`, `../games/co-ca-ngua/`) thì chạy server từ thư mục `prototype/`:
```
cd prototype
python -m http.server 8766
```
rồi mở http://127.0.0.1:8766/homepage/. Game nào có field `url` trong `games.js` sẽ mở thẳng game đó; game chưa làm vẫn vào trang chờ `play.html`.

Kiểm tra tự động (Chrome headless): chạy server cổng 8766 từ `prototype/` như trên rồi `node screenshots/check.mjs <thư-mục-ra-ảnh>`.

## Giới hạn
- 6 ảnh thumbnail cắt từ `assets/concepts-v4/direction-premium-pixel-art.png`; 12 game còn lại dùng bộ thumbnail 4:3 riêng đã duyệt (`assets/thumbs/`). Hình vẽ bằng code (icon/hue) chỉ còn làm dự phòng.
- `play.html` chỉ là trang giữ chỗ (chưa có gameplay/lobby).
- Icon UI 16×16 trong `assets/ui/` lấy lại từ bộ Cờ Cá Ngựa; không tạo ảnh mới.
