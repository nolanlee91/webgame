# Bàn giao asset Đợt 1 · Tiệm Bánh Mì

Asset commit `0c19812` trên nhánh `codex/banh-mi-wave1`, từ master local `50953d3`.

- 17 sheet WebP lossless, 310 frame và 30 clip trong `prototype/games/tiem-banh-mi/assets/`.
- `asset-manifest.json` ghi rect, anchor, clip, 36 placements và 6 nhóm đường đi. Hai lớp tiền cảnh khớp với nền xe đẩy và nền tiệm để xếp thiết bị, chủ tiệm và khách đúng lớp.
- Chủ tiệm nam theo ảnh bìa. Đã mở ảnh kiểm tra cảnh xe đẩy, cảnh tiệm, hàng nhân vật, các lớp nhân bánh xếp chồng và thiết bị. Các frame nhân vật giữ cùng tỉ lệ và mốc chân giữa tư thế đứng, đi và phản ứng.
- Đợt 1 bàn giao ảnh và manifest cho tích hợp. Kiểm tra lần này chạy trực tiếp trên asset.

## Kết quả kiểm tra

```text
python -I tools/asset-check/check_assets.py docs/tiem-banh-mi/asset-spec.json --preview <tmp>

CẢNH BÁO [assets/baker-actions-hd.webp] thiếu file (tuỳ chọn)
CẢNH BÁO [assets/loaf-layers-hd.webp] thiếu file (tuỳ chọn)
CẢNH BÁO [assets/portraits-hd.webp] thiếu file (tuỳ chọn)
CẢNH BÁO [assets/portrait-expressions-hd.webp] thiếu file (tuỳ chọn)
CẢNH BÁO [assets/drama-portraits-hd.webp] thiếu file (tuỳ chọn)
CẢNH BÁO [assets/weather-fx.webp] thiếu file (tuỳ chọn)
CẢNH BÁO [assets/fixtures.webp] thiếu file (tuỳ chọn)
CẢNH BÁO [assets/decor.webp] thiếu file (tuỳ chọn)
CẢNH BÁO [assets/journal-card.webp] thiếu file (tuỳ chọn)

0 lỗi, 9 cảnh báo — ĐẠT, giao được.
Ảnh soi nhân vật: <tmp>/nhan-vat-xep-hang-x2.png
```

Cả 9 cảnh báo thuộc các sheet tuỳ chọn của Đợt 2.
