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

## Đợt 3

- Thêm Tũn, Khang, Ngọc và chú Sáu Cầm Đồ, mỗi người 4 biểu cảm. Đã mở ảnh chân dung ở 128 px để kiểm nét mặt và nhận diện.
- Bổ sung 33 vùng soi trên 18 cảnh, giữ vùng soi cũ. Đã mở ảnh tổng hợp có khung vùng soi để rà vị trí.
- Thêm 93 icon vật chứng trong 6 sheet WebP lossless, lưới 2×. Đã mở ảnh tổng hợp và dọn các mẩu rời ở rìa sprite.
- Bàn giao 29 MP3 tổng hợp, có thời lượng và nguồn trong AUDIO.md.

```text
0 lỗi, 8 cảnh báo — ĐẠT, giao được.
```

Đã soi các cảnh báo còn lại trên icon `noi-sach`, `hinh-chien-than`, `vet-lua`, `bun-xe-dap`, `hoa-don-vy`, `keo-cat-chi`, `bang-ron` và `sac-rgb`. Các cảnh báo đến từ các cụm pixel nhỏ, chi tiết ở rìa hình và vật phụ như vệt hạt lúa, ống hút hoặc dây.
Commit asset đợt 3: ae69436.

## Đợt 4 · Chợ Hẻm 47

- Bản đồ mùa 2 và 18 cảnh hiện trường, WebP lossless 960×540, lưới 2×.
- 6 sheet chân dung với 23 vai mới × 4 biểu cảm, ô 256×256, lưới 1× và alpha cứng. Số vai lấy theo hợp đồng đợt 4. Các vai dùng lại tiếp tục trỏ tới sheet mùa 1.
- 85 điểm soi và 6 chấm bản đồ. Đã mở ảnh có khung để rà vật thể, kiểm mọi cặp hình chữ nhật trong mỗi ảnh có diện tích giao bằng 0. Các khung rộng và cao ít nhất 24 px trong file.
- Đã soi biểu cảm và nhận diện nhân vật trên ảnh xem trước. Hai bản manifest trùng nhau. Test asset của game đạt 3/3.

```text
0 lỗi, 8 cảnh báo — ĐẠT, giao được.
```

Tám cảnh báo thuộc icon vật chứng mùa 1 đã được soi và ghi ở đợt 3. Đợt 4 có 0 cảnh báo mới.
Bản đồ đã có ảnh và dữ liệu điểm bấm. Màn bản đồ trên nhánh gốc hiện vẫn đọc bản đồ mùa 1.
Commit asset đợt 4: `4f9f5c9`.

### Sửa cảnh mùa 2

Vẽ mới góc tủ điện ngoài trời và bếp tiệc công nghiệp. Sửa giải đặc biệt thành 230479 và băng rôn thành Giọng Ca Vàng Hẻm 47. Đã cập nhật vùng soi và đồng bộ manifest.

Bộ kiểm: 0 lỗi, 8 cảnh báo từ mùa 1 — ĐẠT.

