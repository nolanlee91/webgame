# Lụm Kèo — trang chủ "The Grand Arcade Lobby"

Tên thương hiệu **Lụm Kèo**, slogan **"Rủ bạn vào chơi"**. Prototype tĩnh (HTML/CSS/JS thuần, không cần cài gì),
bố cục theo `docs/homepage-redesign-spec.md`, Pixel UI theo Art Bible V5 (cùng ngôn ngữ với Cờ Cá Ngựa / Đào Vàng).

## Bố cục 4 tầng
- **Thanh trên**: logo + slogan · tìm game (không dấu) · [+ Tạo phòng] (xanh ngọc) · [Nhập mã] (mở hộp thoại).
- **Tầng 1 — Arena** (desktop ≥1024 chia 60/40): trái là "Tựa game của tuần" (Đào Vàng, nút vàng "Chơi ngay");
  phải là **Sảnh chờ trực tiếp**: ô nhập mã 6 ký tự, 3 phòng đang chờ (ghế trống, nút "Vào"), nút "Tạo phòng mới".
- **Tầng 2 — Chơi tiếp**: dải thấp các game vừa chơi (`localStorage wgp.recent`), chỉ hiện khi đã có lịch sử.
- **Tầng 3 — Kệ game**: tab lọc liền khối; kệ **Đối kháng đông người** (4 thẻ lớn ảnh 3:2: Cờ Cá Ngựa, Cờ Caro, Đặt Bom, Nối Từ,
  nhãn "Nhiều người", số phòng mở, nút "Rủ bạn") và **Thư viện chơi nhanh** (14 ô 4:3, lưới 6 cột).
- **Tầng 4 — Footer**: banner tài trợ SpeakUp Kids, bản quyền, bật/tắt âm thanh (`wgp.muted`, dùng chung với game).

Mobile (<720px): thanh trên 1 hàng (logo + slogan, Nhập mã), ô tìm ở đầu trang, khối tiêu điểm xếp dọc,
ngay dưới là thanh to [+ Tạo phòng][Nhập mã], phòng chờ thành dải vuốt ngang, kệ đối kháng 2 cột, thư viện 3 cột.

Quy ước màu: **vàng chỉ dùng cho nút chính "Chơi ngay"**; mọi hành động phòng (Tạo phòng, Vào, Rủ bạn) là xanh ngọc;
"Nhập mã" là nút tối phụ. Pixel UI: viền đen 3px góc khuyết, vát sáng/tối 2px, bóng đổ cứng, bấm lún 4px; không bo góc, không blur.

Số người online, số phòng và các phòng chờ là **số minh họa** (`LOBBY_ROOMS`, `DUELS` trong `games.js`) — chưa có multiplayer thật.
"Tạo phòng" hiện mở Cờ Cá Ngựa (game duy nhất đã có sảnh tạo phòng).

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
