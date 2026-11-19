# Tiệm Trà Sữa · Ghi chú phát triển

Game ở `prototype/games/tiem-tra-sua/`. JS module thuần, không build, không thư viện. Lưu ở `localStorage["wgp.tiemtrasua.v1"]`, tắt tiếng theo khoá chung `wgp.muted`, nhúng `../_shared/feedback.js`.

## Trạng thái milestone

| Mốc | Trạng thái | Nội dung đã có |
|---|---|---|
| M1 · Audit, kiến trúc, cảnh tiệm | Xong | Audit 24 file asset (bảng dưới). Tách data / core / render / ui / save. Cảnh tiệm dựng từ `shop-scene` + lớp che quầy + máy + nhân viên + khách theo anchor của manifest. Bố cục desktop và mobile. |
| M2 · Pha chế, khách, một ca thật | Xong | Pha 7 bước, ly đổi lớp sprite ở từng bước, có hiệu ứng rót / đá / topping / đóng nắp và nhân viên thân trên diễn theo bước. Khách đi vào từ cửa, nói món, có thanh kiên nhẫn, sốt ruột rồi bỏ về. Ghim phiếu bằng chạm khách hoặc phiếu. Chấm 60/25/15 ra 1–5 sao, review hài, tiền, XP, danh tiếng (±8 mỗi ca). Sai món nền mở hội thoại khiếu nại với 3 cách xử lý. Hoàn tác và đổ bỏ tính hao hụt. Bảng chốt ca có lời lỗ đúng ECONOMY. Lưu tự động, tải lại giữa ca giữ nguyên ly, phiếu và khách. |
| M3 · Economy, 20 cấp, kho, nâng cấp, trang trí | Một phần | 8 công thức, 20 cấp (dữ liệu và mở khóa nguyên liệu / công thức), nhập hàng theo gói, sức chứa 60, nhập gấp +15% giữa ca. Chưa làm: bếp topping (mẻ 3/6 phần), mua máy, trang trí đặt trong cảnh, nhiệm vụ ngày, gói ký gửi khi hụt vốn. |
| M4 · Drama, review, Nhật Ký Làm Chủ | Chưa | Đã có nền: hội thoại khiếu nại (tiền thân C01), `moments`, `journal` và `headline` cuối ca. |
| M5 · Hoạt ảnh, mobile, cân bằng, polish | Chưa | |

## Kiến trúc

```
data/        bảng số liệu thuần: ingredients (kho + lựa chọn từng bước), recipes, customers, levels, shift (nhịp, vị trí), lines (thoại)
             asset-manifest.json = bản chép của docs/tiem-tra-sua/asset-manifest.json (test kiểm khớp)
core/        luật thuần, không DOM, test bằng node
  apply.js       cửa duy nhất đổi trạng thái: apply(state, action) chạy trên bản nháp, kiểm bất biến, lỗi thì không đổi gì
  shift.js       vòng ca: mở quán, tick (khách đến, kiên nhẫn, bỏ về), ghim, pha, hoàn tác, đổ bỏ, giao, khiếu nại, chốt ca
  score.js       chấm ly (60 công thức + 25 thời gian + 15 kỳ vọng) → sao; sai món nền tối đa 2 sao
  cupview.js     ly → danh sách lớp cup-layers theo thứ tự vẽ (test "đổi hình mỗi bước")
  economy.js     giá vốn tính từ nguyên liệu (khớp bảng 11/10/12/14/11/13/17/13), kho, nhập hàng, lợi nhuận vận hành
  progression.js XP, cấp, mở khóa
  state.js       tạo mới, đọc + kẹp bản lưu, MIGRATIONS cho các phiên bản sau
  rng.js, text.js  RNG có hạt lưu trong state, điền biến vào thoại
render/      atlas.js (manifest → frame/clip, paint theo anchor), scene.js (cảnh 1280×720 + camera), cup.js (ly lớn ở Quầy pha)
ui/          brew.js (phiếu, ly, dải bước, nút nguyên liệu), screens.js (HUD, dải phiếu, chào mừng, chuẩn bị ca, khiếu nại, chốt ca, tạm dừng), sfx.js
game.js      nạp manifest + ảnh, đọc lưu, vòng lặp rAF, xử lý sự kiện → hiệu ứng / âm thanh / thông báo, lưu tự động, phím tắt, móc __game
save.js      adapter localStorage; bản hỏng được chép sang *.corrupt trước khi mở tiệm mới
```

Thời gian ca (`shift.t`) chỉ tăng qua action `tick`. Ca dừng khi có hội thoại, bảng phủ, tạm dừng hoặc rời tab. Vì vậy tải lại không làm khách "già" đi và test tua thời gian được. Vị trí khách, frame đi và mood đều suy ra từ `shift.t` nên phần render là hàm thuần của trạng thái. Giao, giải quyết khiếu nại và từng bước pha chỉ hợp lệ một lần: giao cần khách còn ở pha `wait`, giải quyết cần `dialog`, bước pha phải đúng bước kế tiếp. Bấm lặp hoặc tải lại vì thế không cộng tiền hai lần.

Cách M3–M5 gắn vào: thiết bị và trang trí thêm `data/equipment.js` cùng handler `buy` trong `apply.js` (perk theo `LEVELS[].perks`). Drama thêm `data/events.js` (C01–X05) cùng một `dialog.kind` mới và dùng lại khung hội thoại trong `ui/screens.js`. Nhật Ký vẽ canvas trên `journal-card.png` từ `state.lastSummary` và `moments`.

## Audit asset (24 file, 243 frame, 27 clip)

| File | Dùng ở đâu | Ghi chú / thiếu |
|---|---|---|
| shop-scene.webp | Nền cảnh tiệm. Phông sau Quầy pha và hội thoại (crop). | |
| shop-counter-foreground.webp | Lớp che thân dưới nhân viên sau quầy | |
| street-background.webp | Ảnh đầu bảng chào mừng | Chưa dùng cho cửa sổ hoặc cảnh ngoài phố |
| equipment.webp | Máy trà, máy đóng nắp, hũ trân châu, hũ đá đặt trong cảnh | fridge, topping-stove, stool, table, plant, lantern để M3 |
| characters.webp | Nhân viên đứng trong cảnh (barista) | Dáng đứng của khách chưa dùng vì customer-reactions đủ hơn |
| portraits.webp | Chân dung bảng chào mừng và hội thoại khiếu nại | Thiếu office-worker |
| portrait-expressions.webp | Nhân viên ngạc nhiên và khách regular trong hội thoại | Chỉ có 2 vai |
| cup-layers.webp | Ly lớn ở Quầy pha và ly nhỏ trên mặt quầy (mọi lớp) | Xem "Cần Codex" về đường, trái cây, pudding, matcha nhạt |
| cup-states-and-ingredients.webp | Icon nguyên liệu (hồng trà, sữa, đường, đá, trân châu), ảnh món trong menu | |
| cup-fx.webp | Clip rót (trà, sữa, siro), topping rơi, hơi nước | |
| lid-and-ice-fx.webp | Clip đá rơi, hạ nắp | |
| decor-and-pantry.webp | Icon matcha, vải, chanh dây, pudding, thạch, đào | Đồ trang trí để M3 |
| pantry-supply.webp | Icon ô long, trà lài, kem sữa, sốt đường đen, chồng ly, chồng nắp, hộp sữa | raw-pearls để bếp topping M3 |
| customer-reactions.webp | Dáng chờ / vui / sốt ruột của 6 vai trong cảnh, mặt trên phiếu | |
| customer-actions.webp | Dáng gọi món khi vừa tới, ngạc nhiên khi khiếu nại | |
| character-motion-sample.webp | Chu kỳ đi của khách regular | Hàng thao tác nhân viên chưa dùng vì barista-actions đủ hơn |
| customer-walk-cycles.webp | Chu kỳ đi của vip, reviewer, courier, neighbor | Thiếu office-worker |
| barista-actions.webp | Nhân viên thân trên ở Quầy pha diễn rót / topping / giao | |
| barista-fx.webp | Lấp lánh ở ly và xu bay ở khách khi giao | |
| ui-icons.webp | Icon HUD (tiền, đồng hồ, sao, cấp, kho), sao review, sổ | customer, ticket chưa dùng |
| journal-card.png | Chưa dùng | M4: ảnh Nhật Ký Làm Chủ |
| upgrades.webp | Chưa dùng | M3: máy và nội thất nâng cấp |
| shop-fixtures.webp | Chưa dùng | M3 |
| shop-tiles.webp | Chưa dùng | M3: xem trước trang trí hoặc nền bếp |

Không dùng emoji hoặc hộp CSS cho vật thể trong thế giới. Lựa chọn "Không thêm / Không topping / 0% đường / Không đá" dùng icon bước làm mờ.

## Cần Codex

Cùng chuẩn Phase 2: WebP lossless, alpha cứng, lưới 2×. Ghi rect, anchor và clip vào manifest.

| # | Sheet đề xuất | Frame | Ô · anchor | Lý do (đang tạm dùng) |
|---|---|---|---|---|
| 1 | `customer-walk-cycles.webp` (thêm hàng) | `office-worker-walk-1..4`, clip `office-worker-walk` 8 fps loop | 96×128 · [48,116] | Dân văn phòng chưa có chu kỳ đi. Đang dùng dáng chờ kèm nhún. |
| 2 | `portraits.webp` (thêm ô) | `office-worker` | 192×160 · [96,154] | Hội thoại của khách văn phòng đang dùng sprite toàn thân. |
| 3 | `portrait-expressions.webp` (thêm hàng) | `{vip,reviewer,courier,neighbor,office-worker}-{waiting,happy,sheepish,annoyed}` | 192×160 · [96,154] | Drama M4 cần biểu cảm cho mọi vai. Đang dùng chân dung mặc định. |
| 4 | `cup-layers.webp` (thêm) | `syrup-swirl` (vệt siro đường trên chất lỏng), `brown-sugar-streak` (vệt đường đen thành ly) | 160×192 · [80,174] | Bước đường không đổi hình với trà trái cây (đã 75%). |
| 5 | `cup-layers.webp` (thêm) | `fruit-peach`, `fruit-lychee`, `fruit-passion` (miếng trái lơ lửng) | 160×192 · [80,174] | Trà đào / vải / chanh dây hiện giống nhau. |
| 6 | `cup-layers.webp` (thêm) | `pudding-bottom`, `matcha-50`, `matcha-milk-75`, `cream-top` (lớp kem sữa) | 160×192 · [80,174] | Pudding đang dùng jelly-bottom. Matcha chỉ có 75%. Kem sữa chưa có lớp riêng. |
| 7 | `barista-scene.webp` (mới) | `idle-1..2`, `pour-1..4`, `serve-1..4`, đứng sau quầy, góc 3/4 như characters | 96×128 · [48,116] | Nhân viên trong cảnh chỉ có một dáng đứng. Đang nhún 1 px khi pha. |
| 8 | Đồng bộ vai | `vip`, `reviewer` giữa characters / customer-reactions / customer-actions / walk | | VIP ở reactions và actions khác người với characters và walk. Reviewer đổi trang phục giữa các sheet. Cần một nhân vật xuyên suốt cho mỗi vai trước M4. |
| 9 | `customer-actions.webp` | `vip-order-1` | 96×128 | Frame này vẽ nhỏ hơn các frame khác (lệch tỉ lệ). |
| 10 | `ui-icons.webp` (thêm) | `sound-on`, `sound-off`, `pause`, `help` | 48×48 · [24,42] | Nút thanh trên đang dùng chữ. |

## Kiểm thử

- `cd prototype/games/tiem-tra-sua && node --test "test/*.test.mjs"` chạy 49 test: economy, kiểm đơn và chấm điểm, tiến trình, lưu/tải, nhịp ca, asset.
- E2E: ở gốc repo chạy `PORT=8810 node server.js`, rồi `PORT=8810 node prototype/games/tiem-tra-sua/test/e2e.mjs <thư mục ảnh>`. Test bấm chuột và chạm thật qua CDP, chụp desktop 1366×768 và mobile 390×844, kiểm 0 lỗi console.
- Móc kiểm thử: `window.__game` có `state`, `act(action)`, `advance(ms)` để tua thời gian ca, và `paused`. `?seed=N` cố định RNG.

## Vấn đề đã biết

- Bước đường không đổi hình ở trà trái cây (chờ asset #4). 0% đường hoặc không đá cũng không đổi hình, đúng ý nghĩa nhưng chỉ hiện trên phiếu.
- Mobile ẩn nhân viên thân trên ở Quầy pha để tiết kiệm chỗ. Cảnh dùng camera zoom 1.4 nên cửa ra vào nằm ngoài khung.
- Đơn nhiều ly (cấp 3+) và nhiều chỗ pha chưa làm. Mỗi lúc chỉ pha một ly.
- Hụt vốn chỉ trừ phần phí ca đang có. Gói ký gửi để M3.
