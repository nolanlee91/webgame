# Tiệm Trà Sữa · Ghi chú phát triển

Game ở `prototype/games/tiem-tra-sua/`. JS module thuần, không build, không thư viện. Lưu ở `localStorage["wgp.tiemtrasua.v1"]`, tắt tiếng theo khoá chung `wgp.muted`, nhúng `../_shared/feedback.js`.

## Trạng thái milestone

| Mốc | Trạng thái | Nội dung đã có |
|---|---|---|
| M1 · Audit, kiến trúc, cảnh tiệm | Xong | Audit 24 file asset (bảng dưới). Tách data / core / render / ui / save. Cảnh tiệm dựng từ `shop-scene` + lớp che quầy + máy + nhân viên + khách theo anchor của manifest. Bố cục desktop và mobile. |
| M2 · Pha chế, khách, một ca thật | Xong | Pha 7 bước, ly đổi lớp sprite ở từng bước, có hiệu ứng rót / đá / topping / đóng nắp và nhân viên thân trên diễn theo bước. Khách đi vào từ cửa, nói món, có thanh kiên nhẫn, sốt ruột rồi bỏ về. Ghim phiếu bằng chạm khách hoặc phiếu. Chấm 60/25/15 ra 1–5 sao, review hài, tiền, XP, danh tiếng (±8 mỗi ca). Sai món nền mở hội thoại khiếu nại với 3 cách xử lý. Hoàn tác và đổ bỏ tính hao hụt. Bảng chốt ca có lời lỗ đúng ECONOMY. Lưu tự động, tải lại giữa ca giữ nguyên ly, phiếu và khách. |
| M3 · Economy, 20 cấp, kho, nâng cấp, trang trí | Xong | 8 công thức, 20 cấp, nhập hàng theo gói, sức chứa 60/90, bếp topping 3/6 phần, 13 món mua được. **Đơn nhiều ly** (2 ly từ cấp 3 hoặc ngày 3, 3 ly từ cấp 10 vào giờ cao điểm, kiên nhẫn +60% mỗi ly thêm): pha từng ly rồi "Ghép ly vào đơn", đủ ly mới giao chung một lượt, ly tự ghép vào ô hợp nhất, chấm sao theo điểm trung bình. **Bàn pha đôi / ba chỗ** (cấp 9 / 17): mỗi chỗ pha giữ ly và phiếu riêng, đổi chỗ không mất ly dở, ly ở chỗ khác cùng bước và cùng yêu cầu được rót cùng lúc (2 ly = 7 lần bấm). **Nhiệm vụ ngày** (cấp 2): 3 mục mỗi ca từ 12 mẫu, đếm khi giao / chốt ca / xử lý sự kiện, thưởng XP + tiền đúng một lần. **Nhà cung cấp thứ hai** (cấp 12, vựa sỉ: gói gấp đôi, rẻ 10%, chỉ giao trước ca). **Quảng bá** (cấp 14: tờ rơi, check-in, livestream; một lần mỗi ngày, thêm khách + người theo dõi). **Gói ký gửi** khi không đủ tiền + hàng để pha một ly cơ bản (một lần mỗi ngày, trừ dần bằng giá vốn khi bán) nên không bao giờ kẹt. **Kéo-thả trang trí** (chuột hoặc chạm; chặn chỗ khách đứng, lối từ cửa vào, đồ treo phải lên tường; nút đặt lại). Đồ mới từ `shop-fixtures.webp`: ghế chờ (+8% kiên nhẫn), bình phong mây (+1 hấp dẫn), kệ kho làm icon Kho; `shop-tiles.webp` (terrazzo) lát vùng đặt được khi xếp chỗ. Trần hấp dẫn 4 từ cấp 19. |
| M4 · Drama, review, Nhật Ký Làm Chủ | Xong | **Drama Engine** `core/drama.js` + `data/events.js`: 45 sự kiện (đủ C02–X05 của DRAMA.md, C01 là hội thoại khiếu nại; thêm khách Gen Z, "ít ngọt mà ngọt", khách quen ghi sổ, nhóm chat 15 ly phút chót, shipper, tiệm Hẻm Bên chép menu, mẹ gọi giữa ca, trend nguyên liệu, livestream, KOL xin ly miễn phí, mưa bão, cúp điện, bảng hiệu sai chính tả lên mạng, 5 sự kiện "lỗi lên mạng"). 29 trong ca (đồng hồ dừng), 16 giữa hai ca; 14 sự kiện nhiều bước, 18 có hẹn quay lại ngày sau (cờ + `chain`), 8 lựa chọn hên xui. Điều kiện khai báo, ưu tiên sự cố do người chơi gây ra, nghỉ 2+ ngày, mỗi ba sự kiện có một tình huống vui. Mỗi lựa chọn hiện chi phí trước, hậu quả ngay sau (tiền, danh tiếng, người theo dõi, độ hot, kho, khách ca này / ca sau, món được gọi nhiều) và lưu một khoảnh khắc cho Nhật Ký. **Hài kịch pha nhầm** `data/lines-mistakes.js`: 8 loại lỗi (sai món, sai đường, sai đá, topping, quên nắp, chậm, giao nhầm khách, đổi chỗ hai ly trong đơn nhóm), mỗi loại 6+ câu chung và 3–4 câu riêng từng nhóm khách cho cả câu nói lẫn review (387 câu), review theo sao 184 câu (11–12 câu mỗi mức mỗi nhóm khách, giọng mạng xã hội có hashtag), chọn bằng `freshLine` nên không lặp trong ca. Quên nắp giao được (tối đa 3 sao), giao nhầm khách tối đa 2 sao. **Review**: sổ review 40 mục qua các ngày, điểm đánh giá 20 review gần nhất, người theo dõi, độ hot; cộng/trừ khách ca sau; trả lời một lần mỗi review (xin lỗi tạo lời hứa, ca sau ≥ 4 sao thì +2 danh tiếng). **Sổ quản lý** (Review, Nhật ký, Sự kiện, Nhiệm vụ). **Nhật Ký Làm Chủ**: câu chốt ca kiểu meme theo dữ kiện ca, thẻ 1080×1350 vẽ canvas trên `journal-card.png`, ẩn tên tiệm, đổi khoảnh khắc, lưu PNG, chia sẻ qua thiết bị nếu hỗ trợ. Ly: "không đá" rót thêm trà (mực nước cao hơn), 0% đường không nhích mực nước, nhãn chữ "0% đường / Không đá / Không topping" cạnh ly. Mobile 390: khung cảnh luôn thấy từ nhân viên tới cửa. |
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

Thiết bị và trang trí ở `data/equipment.js` (giá, cấp, sprite, vị trí trong cảnh, hiệu ứng) và `core/equipment.js` (`buy`, `owns`, `appeal`, `kitchenSlots`, `capacityFor`). Bếp topping nằm ở `shift.kitchen` (`cook` và `tick`).

Milestone 3–4:

```
core/drama.js     Drama Engine: điều kiện khai báo (meets), chọn sự kiện, mở hội thoại trong ca (sh.dialog kind "event") hoặc giữa hai ca
                  (s.drama.pending), áp hậu quả, hẹn quay lại (s.drama.queue), cờ (s.drama.flags, hết hạn sau 3 ngày), lịch sử
core/reviews.js   sổ review (s.feed), điểm đánh giá, người theo dõi, độ hot, khách thêm ca sau, trả lời review, lời hứa
core/missions.js  nhiệm vụ ngày (data/missions.js)
core/business.js  gói ký gửi, quảng bá
core/decor.js     kéo-thả trang trí: vùng hợp lệ, chặn chỗ đứng / lối vào
core/journal.js   câu chốt ca meme, nội dung thẻ Nhật Ký
data/events.js    45 sự kiện (cấu trúc ghi ở đầu file)
data/lines-mistakes.js  câu nói / review theo loại lỗi, review theo sao, theo nhóm khách
ui/panels.js      hội thoại sự kiện + bảng hậu quả, Sổ quản lý, Nhật Ký, thanh xếp chỗ
ui/journal.js     vẽ thẻ 1080×1350, tải PNG, chia sẻ
```

Bản lưu v2 (khoá vẫn là `wgp.tiemtrasua.v1`, trường `v` = 2). `MIGRATIONS[1]` chuyển ca dở dang (một ly ⇒ chỗ pha 0, khách một ly ⇒ đơn 1 ly). Trước khi nâng, `save.js` chép nguyên văn bản cũ sang `wgp.tiemtrasua.v1.bak-v1` (một lần). Test ở `test/m4.test.mjs`.

Ca có `stations` (chỗ pha) thay cho `cup` / `active` cũ. Dùng `curCup(sh)`, `activeCid(sh)`, `orderAt(state, station)` ở core/shift.js. Khách có `items` (từng ly) và `filled` (ly đã ghép). `c.order` / `c.recipe` là ly đầu, `c.price` là tổng đơn.

Móc kiểm thử thêm: `__game.forceEvent(id)`, `__game.sceneToClient(x, y)`, `?calm=1` (không tự mở sự kiện trong ca), `?event=ID` (xem thử một sự kiện).

## Audit asset (24 file, 243 frame, 27 clip)

| File | Dùng ở đâu | Ghi chú / thiếu |
|---|---|---|
| shop-scene.webp | Nền cảnh tiệm. Phông sau Quầy pha và hội thoại (crop). | |
| shop-counter-foreground.webp | Lớp che thân dưới nhân viên sau quầy | |
| street-background.webp | Ảnh đầu bảng chào mừng | Chưa dùng cho cửa sổ hoặc cảnh ngoài phố |
| equipment.webp | Máy trà, máy đóng nắp, bếp topping, hũ trân châu, hũ đá trong cảnh. Icon Bếp topping. | fridge, stool, table, plant, lantern chưa dùng |
| characters.webp | Nhân viên đứng trong cảnh (barista) | Dáng đứng của khách chưa dùng vì customer-reactions đủ hơn |
| portraits.webp | Chân dung bảng chào mừng và hội thoại khiếu nại | Thiếu office-worker |
| portrait-expressions.webp | Nhân viên ngạc nhiên và khách regular trong hội thoại | Chỉ có 2 vai |
| cup-layers.webp | Ly lớn ở Quầy pha và ly nhỏ trên mặt quầy (mọi lớp) | Xem "Cần Codex" về đường, trái cây, pudding, matcha nhạt |
| cup-states-and-ingredients.webp | Icon nguyên liệu (hồng trà, sữa, đường, đá, trân châu), ảnh món trong menu | |
| cup-fx.webp | Clip rót (trà, sữa, siro), topping rơi, hơi nước | |
| lid-and-ice-fx.webp | Clip đá rơi, hạ nắp | |
| decor-and-pantry.webp | Icon matcha, vải, chanh dây, pudding, thạch, đào | Đồ trang trí để M3 |
| pantry-supply.webp | Icon ô long, trà lài, kem sữa, sốt đường đen, chồng ly, chồng nắp, hộp sữa, trân châu sống | |
| customer-reactions.webp | Dáng chờ / vui / sốt ruột của 6 vai trong cảnh, mặt trên phiếu | |
| customer-actions.webp | Dáng gọi món khi vừa tới, ngạc nhiên khi khiếu nại | |
| character-motion-sample.webp | Chu kỳ đi của khách regular | Hàng thao tác nhân viên chưa dùng vì barista-actions đủ hơn |
| customer-walk-cycles.webp | Chu kỳ đi của vip, reviewer, courier, neighbor | Thiếu office-worker |
| barista-actions.webp | Nhân viên thân trên ở Quầy pha diễn rót / topping / giao | |
| barista-fx.webp | Lấp lánh ở ly và xu bay ở khách khi giao | |
| ui-icons.webp | Icon HUD (tiền, đồng hồ, sao, cấp, kho), sao review, sổ | customer, ticket chưa dùng |
| journal-card.png | Thẻ Nhật Ký Làm Chủ (canvas 1080×1350, chữ ở khung đầu và vùng kem dưới) | |
| upgrades.webp | 13 món mua trong bảng Chuẩn bị ca (icon) và đặt vào cảnh khi đã mua; bàn pha đôi / ba chỗ trên mặt quầy | dual-spout-brewer chưa có luật |
| shop-fixtures.webp | Ghế chờ, bình phong (đồ mua được), kệ kho (icon Kho) | counter-*, serving-counter, kitchen-workbench, cold-cabinet chưa dùng |
| shop-tiles.webp | Ô terrazzo lát vùng đặt được khi xếp chỗ trang trí | Các ô khác chưa dùng |

Không dùng emoji hoặc hộp CSS cho vật thể trong thế giới. Lựa chọn "Không thêm / Không topping / 0% đường / Không đá" dùng icon bước làm mờ.

## Cần Codex

Cùng chuẩn Phase 2: WebP lossless, alpha cứng, lưới 2×. Ghi rect, anchor và clip vào manifest (`docs/` và bản chép `prototype/games/tiem-tra-sua/data/asset-manifest.json`). **Code đã tự dùng các tên dưới đây ngay khi chúng có trong manifest**, không cần sửa code. Chưa có thì giữ cách tạm.

| # | Sheet | Frame / clip code tự dùng | Ô · anchor | Đang tạm dùng |
|---|---|---|---|---|
| 1 | `customer-walk-cycles.webp` (thêm hàng) | `office-worker-walk-1..4` | 96×128 · [48,116] | Dáng chờ kèm nhún |
| 2 | `portraits.webp` (thêm ô) | `office-worker` | 192×160 · [96,154] | Sprite toàn thân trong hội thoại |
| 3 | `portrait-expressions.webp` (thêm hàng) | `{vip,reviewer,courier,neighbor,office-worker}-{waiting,happy,sheepish,annoyed}` (hội thoại khiếu nại và Drama chọn theo mood của bước) | 192×160 · [96,154] | Chân dung mặc định |
| 4 | `cup-layers.webp` (thêm) | `syrup-swirl` (đường > 0%), `brown-sugar-streak` (sốt đường đen) | 160×192 · [80,174] | Mực nước nhích lên 25% |
| 5 | `cup-layers.webp` (thêm) | `fruit-peach`, `fruit-lychee`, `fruit-passion` | 160×192 · [80,174] | Trà trái cây giống nhau |
| 6 | `cup-layers.webp` (thêm) | `pudding-bottom`, `matcha-50`, `matcha-milk-75`, `cream-top` | 160×192 · [80,174] | jelly-bottom, matcha-75, không có lớp kem |
| 7 | `barista-scene.webp` (mới, bí danh `bscene`) | `idle-1..2`, `pour-1..4` (đang pha), `serve-1..4` (vừa giao) | 96×128 · [48,116] | Dáng đứng characters + nhún 1 px |
| 8 | Đồng bộ vai | `vip`, `reviewer` giữa characters / reactions / actions / walk | | VIP, reviewer đổi trang phục giữa các sheet |
| 9 | `customer-actions.webp` | `vip-order-1` | 96×128 | Frame vẽ nhỏ hơn |
| 10 | `equipment.webp` | `topping-stove-cooking-1..4` + clip `topping-stove-cooking` (8 fps loop) | 192×192 · [96,168] | Hơi nước cup-fx |
| 11 | `ui-icons.webp` (thêm) | `sound-on`, `sound-off`, `pause`, `help` (thanh trên; Sổ dùng `journal` có sẵn) | 48×48 · [24,42] | Chữ |
| 12 | `portraits.webp` hoặc sheet mới (đề xuất, chưa nối) | NPC Drama: mẹ, shipper Anh Tèo, KOL Bé Bông, chị Lụa Hẻm Bên, cô tổ kiểm tra | 192×160 · [96,154] | Mượn vai neighbor / courier / vip / reviewer |
| 13 | Đề xuất, chưa nối | Cảnh mưa (clip `rain`), cúp điện (lớp tối) cho V15 / O04 | 1280×720 | Chỉ chữ trong hội thoại |

## Kiểm thử

- `cd prototype/games/tiem-tra-sua && node --test "test/*.test.mjs"`: 107 test (economy, đơn và chấm điểm, tiến trình, lưu/tải + nâng v1→v2, nhịp ca, bếp và thiết bị, asset, M3: đơn nhiều ly / chỗ pha / nhiệm vụ / nhà cung cấp / quảng bá / ký gửi / kéo-thả, M4: review / Nhật Ký / ly 0% đường, Drama: cấu trúc 45 sự kiện, mọi sự kiện mở được, mọi lựa chọn ở mọi bước giải quyết được, mô phỏng 14 ngày; hài kịch pha nhầm: đủ câu, không emoji, không lặp trong ca, quên nắp / giao nhầm / đổi chỗ).
- E2E: ở gốc worktree chạy `PORT=8811 node server.js`, rồi `PORT=8811 node prototype/games/tiem-tra-sua/test/e2e.mjs <thư mục ảnh>`. Bấm chuột, kéo-thả và chạm thật qua CDP, chụp desktop 1366×768 và mobile 390×844, kiểm 0 lỗi console. Thêm: Nhật Ký (canvas, PNG), sự kiện giữa hai ca, kéo-thả trang trí, sự kiện trong ca trên 390 px, đơn hai ly, Sổ quản lý.
- Móc kiểm thử: `window.__game` có `state`, `act(action)`, `advance(ms)`, `paused`, `forceEvent(id)`, `sceneToClient(x, y)`. `?seed=N` cố định RNG, `?calm=1` tắt sự kiện tự mở trong ca.

## Vấn đề đã biết

- Trà trái cây: đường 0% và 50% cùng chạm trần mực nước 75% nên trông giống nhau (chờ asset #4); nhãn chữ cạnh ly ghi "0% đường".
- Desktop phóng cảnh tới 1:1 điểm ảnh (tối đa +20%) nên mép phải cảnh bị cắt; đồ trang trí kéo sát mép phải có thể khuất. Mobile dùng khung theo vùng (nhân viên → cửa), có thể lọc mượt.
- Đổi chỗ hai ly trong đơn nhóm hiếm xảy ra vì ly tự ghép vào ô hợp nhất; lỗi này chủ yếu đến từ sự kiện O05 / V23.
- Một vài hậu quả sự kiện hẹn "later" tới sự kiện không phải chain chỉ mở nếu điều kiện vẫn đúng trong 3 ngày.
- Hội chợ (cấp 18), huy hiệu và lịch ca thử thách (cấp 20) chưa có luật (M5).
- Mô-đun chỉ gắn tag `?v=m34` ở game.js; các mô-đun con có thể lẫn bản cũ trong bộ nhớ đệm tối đa 5 phút sau khi deploy.
