# Art Bible · Tiệm Bánh Mì

Mẫu gốc đã duyệt: [`prototype/homepage/assets/thumbs/tiem-banh-mi.webp`](../../prototype/homepage/assets/thumbs/tiem-banh-mi.webp). Chuẩn kỹ thuật bắt buộc: `docs/tap-lam-chu/PLAYBOOK.md` §1–§2 và `AGENTS.md`. Hợp đồng sheet, cỡ ô, tên frame: [`asset-spec.json`](asset-spec.json). Đọc thêm [Art Bible V5 mục 0.1](../art-bible-v5.md).

## 1. Giữ gì từ thumbnail

| Chi tiết trong thumbnail | Giữ trong game |
|---|---|
| Tiệm gỗ ban đêm, cửa chớp xanh rêu, cửa sổ nhìn ra hẻm tối có ánh đèn nhà xa | Tường sau `shop-scene`: cửa chớp gỗ xanh rêu bên trái, ô cửa thấy hẻm đêm xanh lam, ánh vàng nhà đối diện. |
| Thợ bánh đội khăn kem, ria mép, áo kem xắn tay, tạp dề nâu đậm, đang cầm dao cưa rạch ổ | Chủ tiệm (`baker`) đúng người này trên mọi sheet: cảnh, cận cảnh HD, chân dung. |
| Tủ kính bánh mì nhiều tầng, đèn vàng trong tủ, ổ xếp hàng | `fixtures.webp display-case-*`: 3 tầng, viền gỗ, kính có vệt phản sáng mảnh, đèn vàng trong tủ. |
| Đồ chua cà rốt củ cải trong tô sứ xanh trắng, chén tương ớt, rau mùi, ớt lát | `pickle-jar`, `chili-bowl`, `herb-basket`, lớp `do-chua`, `ot-*`, `rau-mui`. |
| Đèn mây treo vàng ấm, hũ sứ xanh trắng, bó lúa mì, rổ tre, lá chuối lót | Đèn mây là nguồn sáng chính. `ceramic-jar`, `wheat-bundle`, rổ tre đựng bánh, lá chuối dưới ổ HD. |
| Ổ bánh cắt ngang thấy lớp: thịt nướng, đồ chua, rau, ớt, dưa leo | Thứ tự lớp ở `loaf-layers*` (mục 5). Món ăn đọc được ở góc 3/4. |
| Mái bạt sọc đỏ kem ngoài cửa | Mái bạt ở `cart-scene` (xe đẩy) và mép phải `shop-scene`. |

## 2. Bảng màu

| Vai trò | Màu | Ghi chú |
|---|---|---|
| Đêm ngoài trời | `#18222F` · `#22344A` | Bầu trời, hẻm, khoảng tối xa. |
| Cửa chớp, gỗ sơn xanh | `#24453F` · `#2F5A50` · `#3E7364` | Sơn bạc màu, phản sáng hẹp vàng khi gần đèn. |
| Gỗ quầy, kệ | `#5A311E` · `#7A4526` · `#A0623A` · `#C88A55` | Mảng bậc thang dài theo thớ gỗ. |
| Vỏ bánh | sống `#E9C48A` · chín `#E3A04A` · `#C9772E` · xém `#8E4F22` · cháy `#3B2418` | Thanh màu vỏ trong UI dùng đúng 5 màu này. |
| Ruột bánh | `#F6E7C1` · `#EBD39E` | |
| Đèn mây, đèn tủ | `#FFD27A` · `#F2B65A` · `#E8963C` | Nguồn sáng ấm chủ đạo. |
| Đồ chua | cà rốt `#EE8A3C` · củ cải `#F4EEDD` | |
| Rau | rau mùi `#4E8A3A` · `#7DB34A` · hành lá `#9CC75A` | |
| Ớt, tương ớt | `#C8342A` · `#E2553B` | |
| Sứ xanh trắng | `#2F5D9A` · `#5B86C2` · `#E8EEF2` | |
| Lá chuối | `#4F7F36` · `#6E9E45` | |
| Áo, khăn chủ tiệm | kem `#E9DCC0` · `#D2C2A0` · tạp dề `#4A3024` · `#5E3E2E` | |

UI (lớp riêng với sprite, Modern Cozy như Trà Sữa): kem `#FFF2DC`, nâu caramel `#80543A`, xanh rêu `#2F5A50`, đỏ mái bạt `#B8433A` cho nút cảnh báo / đơn đặt trước. Chữ Be Vietnam Pro (hoặc font có đủ dấu tiếng Việt trong repo).

## 3. Ánh sáng và vật liệu

- **Nguồn sáng chính**: đèn mây treo trên quầy (trên giữa-phải), vàng ấm, đổ bóng ngắn xuống mặt quầy. **Nguồn phụ**: đèn trong tủ kính (vàng, hắt lên mặt khách đứng trước tủ) và ánh xanh lạnh từ cửa sổ / cửa chính (viền lạnh trên vai nhân vật phía trái).
- Bóng đổ nhân vật: elip tối mềm bằng dithering, không bán trong suốt (alpha cứng).
- Vật liệu: gỗ = mảng bậc thang dài theo thớ; kính = vệt phản sáng hẹp, thấy ổ bánh bên trong; sứ = đốm sáng tròn nhỏ, viền hoa xanh đơn giản; kim loại (lò, dao, chảo) = nét sáng lạnh ở viền; vỏ bánh = 3–4 mảng màu + vài vệt nứt sáng; vải tạp dề = bè bóng cong đơn giản; hơi nóng = vệt trắng ngà 2–3 khung.
- Ban ngày / ban đêm: game dùng một bộ cảnh (rạng sáng + đèn bật). Buổi trưa và chiều do code phủ màu nhẹ, Codex không cần vẽ thêm cảnh.

## 4. Nhân vật

- Tỉ lệ tự nhiên, đầu ~1/6,5 chiều cao. Mắt, lông mày là dấu hiệu biểu cảm chính. Ô **144×192**, anchor **[72,174]**, cao 150–180 px (đề xuất 164–172 cho người lớn, 150–158 cho học sinh). Mọi frame cùng vai cao bằng nhau ±8%.
- Mỗi vai là **cùng một người** trên mọi sheet (cảnh, phản ứng, gọi món, đi, chân dung HD, biểu cảm HD). Codex tự soi `nhan-vat-xep-hang-x2.png` trước khi giao.

| Vai | Ngoại hình (giữ nhất quán) |
|---|---|
| `baker` | Nam ~30, ria mép, khăn kem buộc đầu, áo kem xắn tay, tạp dề nâu đậm, dao cưa. Như thumbnail. |
| `student` | Học sinh cấp 3, áo sơ mi trắng, quần xanh đậm, ba lô xanh dương, khăn quàng hoặc bảng tên (không chữ). |
| `worker` | Thợ hồ trung niên, nón vải rộng vành, áo thun cam bạc màu, quần kaki, khăn vắt vai. |
| `shipper` | Nữ ~25, áo khoác gió xanh lá có phản quang (không logo), nón bảo hiểm nửa đầu, điện thoại kẹp tay. |
| `office` | Nữ ~30, sơ mi xanh nhạt, quần tây, thẻ nhân viên đeo cổ (không chữ), túi xách. |
| `regular` | Cụ ông ~70 (Cụ Năm), áo bà ba xám, dép, cầm túi ni lông đựng tiền lẻ. |
| `reviewer` | Nam ~28, nón kết, áo khoác jean, điện thoại có gậy tự sướng ngắn, túi đeo chéo. |
| `tourist` | Du khách ~30, tóc vàng hoe, áo thun xanh ngọc, ba lô lớn, nón lá mua làm kỷ niệm. |
| `parent` | Mẹ ~35, áo chống nắng hồng nhạt, dắt theo (vẽ trong cùng ô) một bé nhỏ tới thắt lưng. |

Chân dung HD ô 384×320, anchor [192,308], lưới 1×, mỗi khách đủ `waiting / happy / sheepish / annoyed / surprised`, chủ tiệm `neutral / happy / concerned / surprised / proud`. NPC Drama (DRAMA.md §1) mỗi người `neutral / happy / annoyed / surprised`.

## 5. Ổ bánh và các lớp

- `loaf-layers.webp` (lưới 2×, ô 160×192, anchor [80,174]) dùng trên mặt quầy, phiếu, tủ. `loaf-layers-hd.webp` (lưới 1×, ô **320×384** = 2× ô thường, anchor [160,348]) dùng ở Quầy ráp. Hai sheet **cùng tên frame, cùng bố cục**, HD chỉ thêm chi tiết.
- Mọi lớp vẽ trên **cùng một khung ổ** (góc 3/4, ổ nằm hơi chéo, rạch dọc mở về phía người xem), để chồng lên nhau khớp không cần dời. Lớp nhân nằm trong "lòng ổ" giữa `loaf-open-back` và `loaf-open-front`.
- Thứ tự vẽ (dưới lên): bóng + lá chuối (trong `loaf-open-back`) → `loaf-open-back` (nửa sau + ruột) → `spread-*` → `fill-*` (nhiều nhân chồng được: chả lụa, thịt nguội, chà bông rắc trên) → `do-chua` → `dua-leo` → `rau-mui` → `hanh-la` → `ot-*` → `sauce-*` → `loaf-open-front` (mép vỏ trước) → `loaf-toasted-sheen` (khi nướng lại) → `wrap-*` (gói thay toàn bộ ổ bằng ổ đã gói, thấy đầu ổ ló ra).
- `loaf-whole-{raw,pale,golden,dark,burnt}`: ổ nguyên chưa rạch theo 5 mức nướng (khớp 5 màu vỏ ở mục 2). `loaf-cut-half`: ổ đã ráp cắt đôi (phiếu "cắt đôi").
- `ot-{it,vua,nhieu}` khác nhau rõ bằng số lát ớt (3 / 6 / 10). `fill-trend`: sốt phô mai vàng tan chảy rắc vụn bánh tráng (topping trend sự kiện M03).
- Bánh mì que: `que-{raw,golden,burnt,pate}` (que mảnh, dài gần hết ô), `que-bag-5` (bịch giấy 5 que).

## 6. Bố cục cảnh 1280×720

Góc nhìn 3/4 chính diện như Trà Sữa: quầy gỗ ở trước, chủ tiệm sau quầy, khách ở lớp giữa phía trước quầy, lò và kệ ở lớp sau. Lớp `*-foreground` che thân dưới chủ tiệm và chân đồ trên quầy.

**`shop-scene` (tiệm, cấp 7+)**
- Tường sau (y 0–330): cửa chớp xanh rêu bên trái (cửa sổ ra hẻm đêm), kệ hũ sứ + bó lúa mì giữa, móc treo túi, đèn mây treo trên giữa-phải. Cửa ra vào bên phải (x ~1150–1260) có mái bạt sọc.
- Quầy sau (mặt bàn y ≈ 350): lò bên trái, lò than nướng lại, bếp than, nồi xíu mại, chảo trứng.
- Quầy trước (mặt bàn y ≈ 460, x 100–720): hũ pate / bơ / mayo, 3 thớt, đồ chua, rổ rau. Tủ kính ở đầu phải quầy (x ~730–1110).
- Sàn gạch bông cũ (y 480–720): đường khách từ cửa phải vào, xếp hàng trước tủ kính, đi ra lại cửa.

**`cart-scene` (xe đẩy, cấp 1–6)**
- Vỉa hè rạng sáng trước một mặt bằng **đóng cửa cuốn** (chính là mặt tiền tiệm sau này, không chữ). Cột điện, dây điện, cây bàng, vài ghế nhựa.
- Xe đẩy gỗ + kính giữa cảnh (x ~330–960, mặt xe y ≈ 425), mái bạt sọc đỏ kem, đèn mây treo ở cần xe. Lò mini trái xe, tủ kính nhỏ phải xe, bình gas dưới gầm.
- Khách đi từ phải vào, xếp hàng phía trước xe, đi ra phía trái.

**Toạ độ đề xuất** (điểm chạm mặt bàn, Codex ghi giá trị thật vào `asset-manifest.json` → `placements`):

| Khoá | Đề xuất `at` | Mặt (`surface`) | | Khoá | Đề xuất `at` | Mặt |
|---|---|---|---|---|---|---|
| `oven` | [250, 350] | back-counter | | `cart-oven` | [380, 418] | cart |
| `toaster` | [420, 352] | back-counter | | `cart-toaster` | [470, 420] | cart |
| `grill` | [540, 352] | back-counter | | `cart-sauce-bottles` | [430, 424] | cart |
| `xiu-mai-pot` | [640, 354] | back-counter | | `cart-pate-jar` | [520, 424] | cart |
| `egg-pan` | [730, 356] | back-counter | | `cart-board` | [590, 426] | cart |
| `gas-tank` | [120, 600] | floor | | `cart-pickle-jar` | [655, 424] | cart |
| `sauce-bottles` | [160, 456] | front-counter | | `cart-herb-basket` | [700, 426] | cart |
| `pate-jar` | [205, 458] | front-counter | | `cart-display` | [810, 422] | cart |
| `butter-tub` | [250, 458] | front-counter | | `cart-paper-stack` | [905, 430] | cart |
| `mayo-bottle` | [295, 456] | front-counter | | `cart-cash-tin` | [940, 432] | cart |
| `chili-bowl` | [340, 470] | front-counter | | `cart-gas-tank` | [360, 560] | floor |
| `board-1` | [400, 462] | front-counter | | `cart-tea-jug` | [1010, 560] | stool |
| `board-2` | [495, 462] | front-counter | | `cart-baker` | [580, 444] | sau xe |
| `board-3` | [590, 462] | front-counter | | | | |
| `pickle-jar` | [650, 458] | front-counter | | | | |
| `herb-basket` | [700, 462] | front-counter | | | | |
| `display-case` | [920, 470] | front-counter | | | | |
| `cash-tin` | [700, 470] → nếu chật dời [1060, 330] | front-counter / mặt tủ | | | | |
| `paper-stack` | [120, 470] | front-counter | | | | |
| `bag-hook` | [90, 300] | wall | | | | |
| `tea-jug` | [1130, 600] | floor | | | | |
| `signboard` | [640, 70] | wall | | | | |
| `baker` | [480, 452] | sau quầy | | | | |

Đường khách (đề xuất):
- Tiệm: `door` [1200, 470] · `queueSpots` [[820, 560], [930, 590], [1040, 620], [930, 660], [820, 690]] (chỗ thứ 6 khi có dây xếp hàng: [710, 650]) · `exitPath` [[1060, 560], [1140, 510], [1200, 470]].
- Xe đẩy: `cartEntry` [1260, 590] · `cartQueueSpots` [[760, 600], [870, 625], [980, 650], [1090, 670]] · `cartExitPath` [[700, 640], [400, 670], [20, 660]].

## 7. Danh sách sheet (Phase 1, đủ bộ)

Tên frame chính xác ở `asset-spec.json`. Lưới 2× trừ khi ghi "1×". WebP lossless, alpha cứng.

| Sheet | Ô · anchor | Nội dung |
|---|---|---|
| `shop-scene`, `shop-counter-foreground` | 1280×720 | Cảnh tiệm + lớp che quầy. |
| `cart-scene`, `cart-foreground` | 1280×720 | Cảnh xe đẩy + lớp che mặt xe. |
| `title-art` | 1280×720 | Tranh màn chào theo thumbnail (thợ bánh rạch ổ, tủ kính, đồ chua), chừa vùng phải 420 px cho bảng. |
| `characters` | 144×192 · [72,174] | Dáng đứng 9 vai (chủ tiệm + 8 khách). |
| `customer-walk-cycles` | 144×192 · [72,174] | 8 vai × đi 4 khung + clip `<vai>-walk` (8 fps loop). |
| `customer-reactions` | 144×192 · [72,174] | 8 vai × waiting / happy / impatient. |
| `customer-actions` | 144×192 · [72,174] | 8 vai × order-1..2 / surprised-1..2. |
| `baker-scene` | 144×192 · [72,174] | Chủ tiệm trong cảnh: idle 2, slice 4, oven 4 (mở cửa lò, rút khay), serve 4, wrap 2, change 2 + clip. |
| `baker-actions-hd` | 320×320 · [160,316] · 1× | Cận cảnh thân trên ở Quầy ráp: idle 2, slice / spread / fill / sauce / wrap / change × 4 + clip. |
| `loaf-layers-hd` | 320×384 · [160,348] · 1× | 39 lớp ổ bánh (mục 5). |
| `loaf-layers` | 160×192 · [80,174] | Cùng 39 lớp, bản nhỏ. |
| `portraits-hd` | 384×320 · [192,308] · 1× | Chân dung 9 vai. |
| `portrait-expressions-hd` | 384×320 · [192,308] · 1× | 8 khách × 5 biểu cảm + chủ tiệm 5. |
| `drama-portraits-hd` | 384×320 · [192,308] · 1× | 12 NPC × 4 biểu cảm. |
| `ovens` | 256×256 · [128,240] | Lò mini / gas / điện × cold, ready, burnt, baking-1..4, smoke-1..2; `oven-electric-off` (cúp điện); khay `tray-{raw,pale,golden,burnt}`, `que-tray-{raw,golden}`. Clip baking 6 fps loop, smoke 4 fps loop. |
| `equipment` | 192×192 · [96,168] | Lò than nướng lại, chảo trứng, nồi xíu mại, bếp than (mỗi thứ idle + hoạt cảnh), bình gas 3 mức, thớt (trống / đang ráp), thớt dài, hũ pate, hộp bơ, chai mayo, hũ đồ chua sứ xanh trắng, rổ rau, chén ớt, chai nước tương + tương ớt, xấp giấy, móc túi, hộp tiền, khay thối tiền, bình trà đá. |
| `fixtures` | 384×256 · [192,240] | Tủ kính tiệm (rỗng / ít / đầy, thường + sưởi), tủ kính xe đẩy, bảng hiệu 3 bậc, dây xếp hàng, chỗ phụ việc. |
| `decor` | 128×128 · [64,120] | 14 đồ trang trí (ECONOMY §7). |
| `ingredients` | 64×64 · [32,32] | 28 icon nguyên liệu (id khớp ECONOMY §1). |
| `bills` | 96×48 · [48,24] | Tờ tiền 1k → 500k (hư cấu, không in hình người thật, chỉ số và hoa văn) + chồng xu. |
| `fx` | 96×96 · [48,48] | Vụn bánh khi rạch, hơi nóng, lấp lánh, xu bay, "ting" lò, chữ tượng thanh "rộp" (hình, không chữ cái). |
| `ui-icons` | 48×48 · [24,42] | 25 icon HUD (spec). |
| `weather-fx` | 640×360 · [0,0] (vẽ ×2) | Mưa 4, chớp 2, `power-cut-glow`, nước ngập hẻm 2, khói lò 3. Lớp này được phép alpha bán trong suốt. |
| `journal-card` | 1080×1350 | Khung thẻ Nhật Ký (SCREENS.md). |

## 8. Luật cứng (nhắc lại từ PLAYBOOK §1–§2)

- Một mật độ điểm vẽ cho cả bộ. Không vẽ nhân vật thô hơn cảnh. Không phóng to mượt.
- Kiểm nhanh: thu ½ rồi phóng ×2 nearest phải y hệt (sheet lưới 2×).
- Rect và anchor chia hết cho 2 ở sheet lưới 2×.
- Không chữ trên đồ vật trong cảnh (bảng hiệu, menu, thùng) để UI thay nội dung. Không logo, không thương hiệu, không người thật. Không emoji.
- Chạy `python -I tools/asset-check/check_assets.py docs/tiem-banh-mi/asset-spec.json --preview <tmp>` tới **0 lỗi**, soi `nhan-vat-xep-hang-x2.png`.
