# Bàn giao asset · Tiệm Bánh Mì

## Kiểm mép ô sau Đợt 2

Asset commit `3dd5aa9`. Đã đồng bộ checker từ master local `250df10`.

- Đã tách lại 5 ổ nguyên HD từ ảnh nguồn để bỏ mẩu bánh lẫn ở `loaf-whole-pale` và khôi phục đầu ổ bị cắt ở các ô kế. Đã soi cả 39 ô mỗi atlas. Lề trong suốt nhỏ nhất là 6 px ở bản thường và 9 px ở bản HD.
- Đã chừa lề cho mũ công nhân, mũ reviewer, tóc khách du lịch và các tư thế đưa tay hoặc đưa bánh chạm mép phải. Giữ mốc chân, rect và clip. Đã bỏ chấm rời ở bên trái `star-empty`.
- **Đã soi, bỏ qua 30 cảnh báo còn lại**, gồm:

| Sheet | Frame | Lý do giữ |
| --- | --- | --- |
| `drama-portraits-hd` | `chi-mai-neutral/happy/annoyed/surprised`, `be-na-neutral/happy/surprised`, `ollie-neutral` | Sợi tóc và điểm sáng viền tóc/kính, đối chiếu với ảnh nguồn. |
| `weather-fx` | `rain-1..4`, `lightning-1..2`, `flood-1..2` | Giọt mưa rời và lớp mưa phủ sát biên, tia chớp đi từ cạnh trên, nước ngập phủ đáy và hai bên. |
| `decor` | `wheat-bundle`, `wall-fan`, `wind-chime` | Đầu bông lúa, điểm sáng trên lồng quạt và dây treo. |
| `ingredients` | `ga-xe`, `cha-bong`, `than` | Sợi và vụn cùng nguyên liệu với phần chính. |
| `fx` | `steam-1` | Điểm rời ở đuôi vệt hơi nước. |
| `ui-icons` | `crisp`, `upgrade` | Vụn bánh và đốm sáng quanh mũi tên. |
| `journal-card` | `journal-card` | Thẻ nền kín, chủ đích phủ hết ảnh. |

```text
python -I tools/asset-check/check_assets.py docs/tiem-banh-mi/asset-spec.json --preview <tmp>

0 lỗi, 30 cảnh báo — ĐẠT, giao được.
Ảnh soi nhân vật: <tmp>/nhan-vat-xep-hang-x2.png
```

## Đợt 2

Asset commit `da56168` trên `codex/banh-mi-wave2`. Nhánh gồm master local `0c8fb0a` và bản bàn giao Đợt 1 `abea23e`.

- Đã bỏ cờ `optional` cho cả 9 sheet Đợt 2. Bộ mới gồm 208 frame, 11 clip, WebP lossless và alpha cứng. Các sheet HD dùng lưới 1×. Cảnh, vật dụng, thời tiết và thẻ Nhật Ký dùng lưới 2×.
- Chủ tiệm nam giữ khăn, ria và tạp dề từ Đợt 1. Có đủ 7 clip quầy ráp, 39 lớp ổ bánh trùng tên bản nhỏ, 9 chân dung chính, 45 biểu cảm của dàn vai và 48 chân dung biểu cảm của 12 NPC Drama.
- Trong cảnh xe đẩy, tủ kính đã tách khỏi cả nền lẫn lớp che quầy. Vẽ `fixtures.webp#cart-display-empty` ở `placements.cart-display.at = [766,348]`, rồi xếp bánh theo ba dãy `stockSlots` trong tọa độ cảnh. Các bản `low` và `full` vẫn có trong atlas theo spec. Dùng bản `empty` khi dựng số bánh theo tồn kho.
- Manifest ghi điểm đặt cho tủ kính, bảng hiệu, dây chờ, chỗ phụ việc và đồ trang trí. Thẻ Nhật Ký 1080×1350 có `safeAreas` cho đầu thẻ, ảnh cảnh 960×640 và phần chữ cuối.
- Đã soi ảnh từ `nhan-vat-xep-hang-x2.png`, đối chiếu mặt và trang phục của dàn vai, kiểm tra các biểu cảm Drama, ảnh ghép tủ trống và ảnh ráp ổ HD. Kiểm ở cấp asset và ảnh ghép, chưa tích hợp gameplay.

```text
python -I tools/asset-check/check_assets.py docs/tiem-banh-mi/asset-spec.json --preview <tmp>

0 lỗi, 0 cảnh báo — ĐẠT, giao được.
Ảnh soi nhân vật: <tmp>/nhan-vat-xep-hang-x2.png
```

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
