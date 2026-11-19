# Bàn giao asset Đợt 1 · Tiệm Bánh Mì

## Bản chỉnh tỉ lệ nhân vật

Asset commit `a7db7ed` trên `codex/banh-mi-wave1`, đã đồng bộ hợp đồng từ master local `0c8fb0a`.

- Vẽ lại 5 sheet cho đủ 9 vai, ô 216×288, anchor [108,262], lưới 2×, alpha cứng, WebP lossless. Chiều cao thực 244–268 px. Đối chiếu với bản trước cho thấy đủ 115 tên frame và 14 clip với FPS, thứ tự frame và kiểu loop ban đầu.
- Xe đẩy đo khoảng 156 px từ mặt quầy xuống mặt đất, tương ứng 257 px cho người cao 1,65 m. Cửa tiệm đo khoảng 331 px cho cửa 2,1 m, tương ứng 260 px. Hai giá trị đã ghi vào `sceneScale`.
- Đã căn lại hàng chờ, cửa vào, lối ra và mốc đứng của chủ tiệm để mặt quầy che đến ngang hông. Soi ảnh hàng nhân vật và ghép đủ 6 khách ở tiệm, 4 khách ở xe đẩy theo vị trí thật. Kiểm tra cả ô 216×288 nằm trong khung 1280×720 tại các điểm và khi nội suy thẳng giữa chúng. Kiểm trên asset và ảnh ghép tĩnh.

## Bản bàn giao ban đầu
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

Nhật ký ở trên đã được đối chiếu với lần chạy cuối trên hợp đồng mới. Kết quả vẫn là 0 lỗi, 9 cảnh báo thuộc Đợt 2.
