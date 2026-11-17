# Homepage prototype — "Rich Visuals, Simple UX"

Prototype tĩnh (HTML/CSS/JS thuần, không cần cài gì), theo Art Direction V4 – Premium Detailed Pixel Art.
Chưa chọn framework: khi kiến trúc được duyệt, các phần này chuyển thành component (GameCard, FilterChips, RoomCodeDialog).

## Bố cục (V2 — có phân cấp thị giác, Pixel UI Kit theo V4)
Ba cấp rõ ràng, không thêm banner quảng cáo:
1. **Mới & Hot** (bento): 1 thẻ lớn "Game của tuần" (Đào Vàng, cảnh cắt từ concept V4) + 4 thẻ vừa có nút "Chơi ngay" xanh ngọc. Dòng "đang online" là số giả tĩnh.
2. **Chơi tiếp**: hàng thẻ mini (chỉ hiện khi đã chơi), điểm nhấn phụ.
3. **Tất cả game**: ô nhỏ 4:3, chia nhóm Trí tuệ / Giải đố / Hành động, có khoảng nghỉ; tab lọc liền khối.

Thanh trên 1 hàng: logo · tìm kiếm (không dấu) · ô mã phòng + "Vào phòng" (desktop, 1 bước). Bấm 1 lần vào thẻ = vào chơi.

Mobile có bố cục riêng: thanh trên chỉ logo + nút "Mã phòng" (mở hộp thoại), ô tìm ở đầu trang, thẻ lớn tràn ngang,
4 game nổi bật thành dải vuốt ngang, Tất cả game 3 cột.

Pixel UI Kit (styles.css): góc ≤ 4px (không pill), khung gỗ 2 lớp + bóng "bậc" pixel, nút vát sáng trên/tối dưới và lún khi bấm,
ô nhập lõm, nhãn HOT/MỚI cắt góc pixel. Tiêu đề Roboto Slab, chữ thường Be Vietnam Pro — không dùng pixel font cho văn bản.

Đã bỏ: sidebar, cây cảnh/sách/khung trang trí, banner, chuông/thư/avatar ở header.

## Chạy
```
cd prototype/homepage
python -m http.server 8765
```
Mở http://127.0.0.1:8765/

Muốn bấm "Chơi ngay" ở Đào Vàng để vào game thật (`../games/dao-vang/`) thì chạy server từ thư mục `prototype/`:
```
cd prototype
python -m http.server 8766
```
rồi mở http://127.0.0.1:8766/homepage/. Game nào có field `url` trong `games.js` sẽ mở thẳng game đó; game chưa làm vẫn vào trang chờ `play.html`.

Kiểm tra tự động (Chrome headless): chạy server cổng 8766 từ `prototype/` như trên rồi `node screenshots/check.mjs <thư-mục-ra-ảnh>`.

## Giới hạn
- 6 ảnh thumbnail cắt từ `assets/concepts-v4/direction-premium-pixel-art.png`; 12 game còn lại dùng bộ thumbnail 4:3 riêng đã duyệt (`assets/thumbs/`). Hình vẽ bằng code (icon/hue) chỉ còn làm dự phòng.
- `play.html` chỉ là trang giữ chỗ (chưa có gameplay/lobby).
