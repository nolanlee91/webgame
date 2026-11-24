# Bàn giao asset Thám Tử Hẻm

Asset commit `d591e53` trên `codex/tham-tu-hem-assets`, từ `claude/tham-tu-hem`.

- Giao cả hai đợt, gồm 18 hiện trường của sáu vụ, văn phòng, bản đồ, ảnh mở đầu và 7 atlas chân dung với 144 frame. Đã bỏ cờ tùy chọn cho Đợt 2.
- Các cảnh là WebP lossless 960×540 theo lưới 2×. Chân dung dùng ô 256×256 lưới 1× với alpha cứng. Thumbnail 480×360 được phóng nearest-neighbor từ lưới 240×180.
- Manifest có 92 vùng bấm, gồm 6 vị trí vụ trên bản đồ. Đã đối chiếu tọa độ với ảnh cảnh, xem vùng bấm vẽ đè bên ngoài repo và soi chân dung ở 128 px. Checker không sinh ảnh xếp hàng vì hợp đồng dùng chân dung bán thân, đã xem atlas riêng ở kích thước thoại.
- Đã kiểm file và bố cục tĩnh. Hiển thị và tương tác trong gameplay chưa được chạy thử.

```text
python -I tools/asset-check/check_assets.py docs/tham-tu-hem/asset-spec.json --preview <tmp>

0 lỗi, 0 cảnh báo — ĐẠT, giao được.
```
