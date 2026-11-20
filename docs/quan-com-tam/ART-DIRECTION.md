# Art Bible · Quán Cơm Tấm

**Tài liệu gốc:**
- Mẫu đã duyệt: [`prototype/homepage/assets/thumbs/quan-com-tam.webp`](../../prototype/homepage/assets/thumbs/quan-com-tam.webp).
- Chuẩn kỹ thuật bắt buộc: `docs/tap-lam-chu/PLAYBOOK.md` §1–§2 và `AGENTS.md`.
- Hợp đồng sheet, cỡ ô, tên frame: [`asset-spec.json`](asset-spec.json).

## 0. Thước đo (đọc trước khi vẽ bất cứ gì)

Hai cảnh vẽ **cận**, cùng một thước với Tiệm Bánh Mì. Codex đang vẽ cảnh theo thước này. Nhân vật và đồ vật vẽ sau phải khớp cảnh.

| Vật thật | Cao thật | Cao trong cảnh (px file) | Dùng để |
|---|---:|---:|---|
| Người lớn đứng | 1,65 m | **≈ 260** (235–275) | Cỡ ô nhân vật đứng 216×288, anchor [108,262] |
| Cửa ra vào / cửa cuốn | 2,1 m | **≈ 330** | Đo cảnh |
| Mặt quầy nướng, bàn bày (so với sàn chỗ chủ quán đứng) | ~95 cm | **≈ 150** | Chủ quán đứng sau quầy: mặt quầy ngang hông |
| Mặt bàn nhựa thấp quán cơm | ~75 cm | **≈ 120** | `tables.webp`: mặt bàn cao 120 px trên anchor |
| Ghế nhựa thấp | ~40 cm | **≈ 64** | `table-items stool-*` |
| Người ngồi ghế nhựa (chân ghế → đỉnh đầu) | ~1,33 m | **≈ 210** (190–232) | `customer-seated` |
| Bếp than dài (thân bếp) | ~60 cm × 1,4 m | ~95 cao (trên mặt quầy) × ~250 rộng | `grill.webp` ô 320×192 |
| Nồi cơm điện lớn | ~35 cm | ~56 | `equipment.webp` ô 192×192 (vẽ nhỏ trong ô, đừng phóng) |
| Dĩa cơm trên bàn (đường kính) | ~25 cm | ~40 rộng | `table-items plate-eating-*` |

**Quy tắc thước:**
- Codex ghi `manifest.sceneScale["assets/street-scene.webp"].humanHeight` và `["assets/quan-scene.webp"].humanHeight`, dự kiến **260**.
- Script so trung vị chiều cao mọi frame nhân vật với số này. Lệch quá 10% là lỗi.
- Mọi frame của một vai cao bằng nhau ±8%. Dáng ngồi tách nhóm riêng (`roleMap` trong spec).
- Không phóng to bản cũ cho khớp. Vẽ thẳng ở ô 216×288, lưới 2×.

## 1. Giữ gì từ thumbnail

| Chi tiết trong thumbnail | Giữ trong game |
|---|---|
| Đêm, trời chàm tím, sông + toà nhà xa có đèn | Nền trên của cả hai cảnh: bờ sông và đường chân trời thành phố (hư cấu, không toà nhà thật nhận ra được), đèn vàng li ti. |
| Hoa giấy hồng tím rủ góc trên trái | Cành hoa giấy góc trên trái `street-scene`. Chậu hoa giấy là trang trí `bougainvillea-pot`. |
| Đèn lồng giấy tròn vàng treo dây | Dây đèn lồng ngang trên cùng (`lantern-string`). Đèn là nguồn sáng ấm thứ hai. |
| Cô chủ khăn chàm buộc đầu, áo chàm xắn tay, tạp dề nâu, khăn trắng vắt vai, bông tai vàng nhỏ, cầm kẹp gắp sườn | Chủ quán (`owner`) đúng người này trên mọi sheet: cảnh, cận cảnh HD, chân dung. |
| Bếp than dài, sườn trên vỉ, khói trắng bốc | `grill.webp` + `grill-items.webp`. Khói là hoạt cảnh `grill-smoke`, `fx smoke-puff`. |
| Tủ kính có sườn nướng xếp tầng, hũ đồ chua, dưa leo | `fixtures glass-case-*` (đèn vàng trong tủ). |
| Đèn treo chao kim loại vàng trên tủ | Nguồn sáng chính trên quầy. |
| Dĩa sứ trắng viền xanh: cơm tấm, sườn, trứng ốp la lòng đào, đồ chua, dưa leo, hành lá | Khung dĩa của `plate-layers*`. |
| Chén nước mắm có ớt, hũ ớt sa tế thuỷ tinh | `chen-nuoc-mam`, `chili-jar`. |
| Ống đũa tre, hũ sứ xanh trắng | Bàn `table2/4-set`: ống đũa, hũ nước mắm. Trang trí `ceramic-jar`. |
| Khách ngồi ghế nhựa đỏ, bàn gỗ, phía sau | Bàn nhựa thấp + ghế nhựa đỏ / xanh. Khách ngồi nhìn 3/4 quay vào bàn. |
| Cửa chớp gỗ xanh rêu, mái tôn, tường gỗ | Mặt tiền nhà phố phía sau quầy (`street-scene`), tường trong `quan-scene`. |

## 2. Bảng màu

| Vai trò | Màu | Ghi chú |
|---|---|---|
| Trời đêm, sông | `#1C1A3A` · `#2B2A5C` · `#3B3F7A` | Chàm tím như thumbnail. |
| Đèn thành phố xa | `#F6D27A` · `#E8A94A` | Chấm 2×2, không vẽ toà nhà thật. |
| Hoa giấy | `#C2336E` · `#E0559A` · lá `#2F6A3A` | |
| Đèn lồng, đèn chao | `#FFD98A` · `#F4B556` · `#E08A36` | Nguồn sáng ấm chủ đạo. |
| Gỗ quầy, bàn, cửa chớp | `#4A2A1C` · `#6B3D24` · `#8E5632` · cửa chớp `#2E5A4C` · `#3F7462` | |
| Áo, khăn chủ quán | chàm `#2C3A78` · `#3E4E96` · tạp dề `#5A3426` · `#74472F` · khăn trắng `#EDE6D8` | |
| Than | tàn `#5A5450` · đỏ `#C2361E` · rực `#F2622A` · `#FFB14A` · tro `#9A938C` | Thanh than UI dùng đúng các màu này. |
| Sườn | sống `#D9887A` · tái `#C26A4E` · **chín** `#A4522A` · `#7E3A1C` · cháy cạnh `#4A2210` · cháy `#231410` | Vòng độ chín trên chip vỉ dùng 5 màu này. |
| Cơm tấm | `#F5F0E4` · `#E6DCC6` | Hạt nhỏ, bóng mỡ hành. |
| Mỡ hành | `#7DB34A` · `#A9CF5E` · ánh mỡ `#F7E7A8` | |
| Đồ chua | cà rốt `#EE8A3C` · đu đủ / củ cải `#F4EEDD` | |
| Dưa leo, cà chua | `#5E9E44` · `#BFE08A` · `#D8432E` | |
| Trứng | lòng trắng `#FBF7EE` · lòng đào `#FFB12E` · chín kỹ `#F2C94C` | |
| Nước mắm | `#D9883A` · `#E8A85A` + ớt `#C8342A` | |
| Sứ xanh trắng | `#2F5D9A` · `#5B86C2` · `#E8EEF2` | |
| Ghế nhựa | đỏ `#C8342A` · `#E2553B` · xanh `#2F6FB0` · `#4A8FD0` | |

UI (lớp riêng với sprite, Modern Cozy như hai game trước):
- Màu: kem `#FFF2DC`, nâu `#7A4A30`, chàm `#2C3A78` (màu chủ quán), đỏ than `#C2361E` cho cảnh báo / đơn đặt trước.
- Màu viền bàn trên phiếu: 5 màu tách biệt rõ (vàng, xanh ngọc, hồng, tím nhạt, cam), kiểm cả người mù màu đỏ-lục.
- Chữ Be Vietnam Pro (hoặc font có đủ dấu tiếng Việt trong repo).

## 3. Ánh sáng và vật liệu

**Nguồn sáng:**
- **Chính**: đèn chao trên quầy (trên giữa-trái). Vàng ấm, đổ bóng ngắn xuống mặt quầy, viền sáng lên chủ quán.
- **Phụ ấm**: dây đèn lồng phía trên bàn (đốm vàng trên mặt bàn, vai khách).
- **Phụ nóng**: than đỏ hắt cam lên mặt dưới cằm, tay chủ quán.
- **Lạnh**: trời đêm chàm, viền tím nhạt trên vai nhân vật phía phải.

**Bóng đổ nhân vật:** elip tối bằng dithering, alpha cứng. Khách ngồi: bóng dưới ghế.

**Vật liệu:**

| Vật liệu | Cách vẽ |
|---|---|
| Gỗ | Mảng bậc thang dài theo thớ |
| Kính tủ | Vệt phản sáng hẹp, thấy sườn bên trong |
| Sứ | Đốm sáng tròn nhỏ, viền hoa xanh đơn giản |
| Nhựa ghế | Bóng cong một vệt sáng |
| Kim loại (vỉ, kẹp, nồi) | Nét sáng lạnh ở viền |
| Thịt nướng | 3–4 mảng màu + vân vỉ (sọc đậm chéo) + mép cháy cạnh |
| Khói | Trắng ngà 2–3 khung, đi lên và lệch theo gió |

**Ngày / đêm:** game dùng một bộ cảnh đêm cho cả hai cảnh. Ca trưa do code phủ màu sáng (bớt đèn, trời xanh nhạt qua lớp màu). Codex không cần vẽ cảnh ngày.

## 4. Nhân vật

**Chuẩn chung:**
- Tỉ lệ tự nhiên, đầu khoảng 1/6,5 chiều cao. Mắt, lông mày là dấu hiệu biểu cảm chính.
- **Đứng:** ô **216×288**, anchor **[108,262]**, cao **235–275 px**. Đề xuất: người lớn 250–266, sinh viên 244–256, người cao như thợ Lực tối đa 272.
- **Ngồi:** cùng ô và anchor. Vẽ **luôn cái ghế nhựa**, nhìn 3/4 quay sang **phải**; code tự lật ngang cho ghế bên phải bàn. Anchor = giữa chân ghế chạm sàn. Cao 190–232 px.
  - `sit-eat-1..2`: cúi xuống dĩa, đũa / muỗng đưa lên, 2 khung lặp.
  - `sit-wait`: ngồi thẳng, tay đặt đùi.
  - `sit-call`: giơ tay vẫy (gọi trà / tính tiền).
  - `sit-happy`: cười, xoa bụng.
  - `sit-annoyed`: khoanh tay, nhíu mày.
  - Dĩa và ly **không** vẽ trong frame ngồi. Code đặt `plate-eating-*` lên `plateSpots` của bàn.
- Mỗi vai là **cùng một người** trên mọi sheet (đứng, đi, phản ứng, gọi món, ngồi, chân dung HD, biểu cảm HD). Codex tự soi `nhan-vat-xep-hang-x2.png` trước khi giao.
- `worker2` và `student2` là **người khác** cùng nhóm: đi nhóm 2–4 người thì không ra bản sao giống hệt.

| Vai | Ngoại hình (giữ nhất quán) |
|---|---|
| `owner` | Nữ ~35, khăn chàm buộc đầu, tóc búi sau, áo bà ba chàm xắn tay, tạp dề nâu đậm, khăn trắng vắt vai trái, bông tai vàng nhỏ, cầm kẹp gắp. Như thumbnail. |
| `helper` | Bông, nữ 19, tóc cột đuôi ngựa, áo thun vàng mù tạt, tạp dề nâu ngắn, dép kẹp, khăn lau giắt túi. Cùng người với chân dung `bong`. |
| `office` | Nữ ~30, sơ mi xanh nhạt, quần tây, thẻ nhân viên đeo cổ (không chữ), túi xách nhỏ. |
| `worker` | Chú Tư kiểu: nam ~45, nón bảo hộ vàng cầm tay hoặc đội, áo phản quang cam (không chữ), quần kaki bám bụi, khăn vắt vai. |
| `worker2` | Thợ Lực: nam ~25, cao to, áo thun xám ba lỗ, khăn rằn quấn cổ, dép tổ ong, cười rất to. |
| `student` | Tèo: nam ~20, áo thun trắng in hình học (không chữ), ba lô xanh dương, kính cận. |
| `student2` | Mít: nữ ~20, áo khoác hoodie hồng nhạt, tóc ngắn kẹp, túi tote. |
| `shipper` | Nữ ~25, áo khoác gió xanh lá có phản quang (không logo), nón bảo hiểm nửa đầu, điện thoại cầm tay, túi giữ nhiệt sau lưng. |
| `regular` | Cô Út bán vé số: nữ ~60, nón vải, áo bà ba hoa nhỏ, xấp vé số kẹp tay (không chữ đọc được). |
| `reviewer` | Nam ~28, nón kết, áo khoác jean, gậy tự sướng ngắn + đèn LED tròn nhỏ, túi đeo chéo. |
| `driver` | Tài xế Lộc: nam ~40, áo khoác gió xám, nón bảo hiểm đội đầu, khẩu trang kéo xuống cằm, mắt thâm. |
| `nurse` | Điều dưỡng Hạnh: nữ ~28, đồng phục xanh ngọc, áo khoác mỏng ngoài, thẻ đeo (không chữ), tóc búi gọn. |
| `tourist` | Lucas: nam ~30, tóc nâu xoăn, râu ngắn, áo thun xanh ngọc, ba lô lớn, nón lá mua làm kỷ niệm. |

**Động tác trong cảnh** (`owner-scene`, `helper-scene`):

| Động tác | Mô tả |
|---|---|
| `grill` | Kẹp lật miếng: tay phải nâng lên, xoay cổ tay, hạ xuống |
| `fan` | Quạt mo, tay trái phẩy nhanh |
| `plate` | Vá cơm xới vào dĩa, rồi gắp đặt |
| `walk` | Đi tay không |
| `carry` | Đi bưng 1–2 dĩa ngang ngực |
| `serve` | Cúi đặt dĩa xuống bàn (bàn ở bên phải nhân vật; code lật khi cần) |
| `pour` | Rót bình trà đá |
| `wipe` | Lau bàn vòng tròn |
| `box` | Đóng nắp hộp |
| `clear` (Bông) | Gom dĩa dơ chồng lên tay |

Chân dung và biểu cảm HD:
- Ô 384×320, anchor [192,308], lưới 1×.
- Mỗi khách đủ `waiting / happy / sheepish / annoyed / surprised`.
- Chủ quán đủ `neutral / happy / concerned / surprised / proud`.
- 12 NPC Drama (DRAMA.md §1), mỗi người `neutral / happy / annoyed / surprised`.

## 5. Dĩa, hộp và các lớp

**Hai sheet cùng tên frame:**
- `plate-layers.webp`: lưới 2×, ô 160×192, anchor [80,174]. Dùng trên thanh phiếu và trong cảnh khi cần.
- `plate-layers-hd.webp`: lưới 1×, ô **320×384** (gấp 2 ô thường), anchor [160,348]. Dùng ở Cột Dĩa.
- Hai sheet **cùng tên frame, cùng bố cục**; bản HD chỉ thêm chi tiết.

**Khung chung:**
- Mọi lớp dĩa vẽ trên **cùng một khung dĩa**: dĩa sứ trắng viền xanh, oval góc 3/4, chiếm khoảng 80% bề rộng ô, nằm nửa dưới ô. Nửa trên ô chừa cho miếng sườn dựng nghiêng, chén nước mắm, chén canh đặt phía sau dĩa.
- Lớp hộp (`box-*`) vẽ trên **cùng một khung hộp giấy kraft** mở nắp.
- Lớp món dùng chung cho dĩa và hộp. Vị trí món nằm trong vùng chung của lòng dĩa và lòng hộp: căn giữa, cùng toạ độ.

**Bố cục trên dĩa:**

| Vị trí | Thứ đặt ở đó |
|---|---|
| Trái | Cơm vun tròn |
| Phải | Sườn, nghiêng ra mép dĩa |
| Trên cơm | Bì, rắc thành ụ nhỏ |
| Cạnh sườn | Chả, một lát hình thang |
| Trên cùng, giữa | Trứng |
| Mép phải trước | Đồ chua, dưa leo, cà chua |
| Sau dĩa, trái | Chén nước mắm |
| Sau dĩa, phải | Chén canh |

**Thứ tự vẽ (dưới lên):**
1. `plate-dia` / `box-open`
2. `com` (hoặc `com-them`: ụ to hơn, cùng tâm)
3. `mo-hanh` / `hanh-phi` (phủ trên cơm)
4. `bi` / `bi-chay`
5. `suon-*` / `suon-non-*` / `ga-*` / `lap-xuong` / `dau-hu`
6. `cha` / `cha-chay`
7. `trung-*`
8. `do-chua`
9. `dua-leo`
10. `ca-chua`
11. `nuoc-mam-chan` (vệt nước mắm thấm trên cơm) **hoặc** `chen-nuoc-mam` / `bich-nuoc-mam`
12. `ot`
13. `ngo-rac`
14. `chen-canh`
15. `box-closed` / `box-bag` (thay toàn bộ hộp mở)

`plate-dia-dirty` là dĩa đã ăn: vụn cơm, xương sườn, vệt nước mắm. Dùng trong thau rửa và khi dọn bàn.

**Phân biệt mức độ (phải đọc được ở ô nhỏ):**
- `suon-half` (hồng giữa vân) · `suon-done` · `suon-charred` (mép đen giòn, giữa vẫn nâu) · `suon-burnt` (đen gần hết).
- `trung-runny`: lòng đỏ bóng, căng tròn, có vệt chảy. `trung-set`: lòng đỏ mờ. `trung-hard`: lòng đỏ vàng nhạt, mép trắng xém vàng.

## 6. Bếp và món trên vỉ

**`grill.webp`** (ô 320×192, anchor [160,176] = giữa đáy thân bếp chạm mặt quầy):
- Bếp than dài nhìn 3/4, vỉ sắt 6 ô chia 3 vùng.
- Vùng phải có tấm tôn kê cao một chút: "giữ ấm".
- Mức than đọc được từ xa: `cold` (than đen) · `low` (đỏ vài cục) · `mid` (đỏ đều) · `high` (cam vàng rực, tia lửa) · `ash` (tro xám).

**`grill-items.webp`** (ô 96×64, anchor [48,52]):
- Mỗi miếng nằm trên vỉ, nhìn chéo nhẹ từ trên.
- `flip-1..2`: miếng nghiêng lên khoảng 45° rồi gần dựng đứng, kẹp không vẽ (code có tay chủ quán).
- `egg-*`: trứng trong chảo nhỏ đen tròn (chảo vẽ chung trong ô).

**Toạ độ 6 chỗ trên vỉ** (tương đối với anchor bếp, để code đặt miếng):

| Chỗ | Vùng | Toạ độ |
|---|---|---|
| 1 | nóng | [−100, −40] |
| 2 | nóng | [−60, −40] |
| 3 | vừa | [−20, −40] |
| 4 | vừa | [20, −40] |
| 5 | giữ ấm | [60, −44] |
| 6 | giữ ấm | [100, −44] |

Codex ghi giá trị thật vào `placements.grill.slots` (và `street-grill.slots`) nếu khác.

## 7. Bố cục cảnh 1280×720

Góc nhìn 3/4 chính diện như Bánh Mì:
- **Trái**: quầy (bếp + bàn bày). Chủ quán đứng sau quầy.
- **Phải và giữa**: hai hàng bàn.
  - Hàng sau: chân bàn y ≈ 530.
  - Hàng trước: chân bàn y ≈ 680.
  - Lối đi giữa hai hàng y ≈ 610: chủ quán và Bông đi ở đây.
- **Lớp `*-foreground`** che thân dưới chủ quán, chân đồ trên quầy và mặt trước quầy.

**Quầy giống nhau ở hai cảnh** (cùng toạ độ, để code dùng chung):

| Phần quầy | Vị trí |
|---|---|
| Xe nướng / quầy nướng | x 40–380, mặt quầy y ≈ 410 |
| Bàn bày | x 380–680, mặt bàn y ≈ 410 |
| Kệ sau lưng chủ quán | x 400–700, mặt kệ y ≈ 322 |
| Chủ quán đứng | [330, 520] |

**`street-scene`** (quán vỉa hè, cấp 1–6):
- **Phía sau** (y 0–440): mặt tiền nhà phố **đóng cửa cuốn** (cửa cuốn cao ~330 px, đáy y ≈ 440, là thước đo), cửa chớp gỗ xanh rêu tầng trên. Cột điện, dây điện. Cành hoa giấy rủ góc trên trái. Dây đèn lồng ngang. Bên phải xa: lan can bờ sông, sông và đường chân trời thành phố.
- **Vỉa hè gạch** (y 440–720), có vạch sơn mờ (sự kiện X01). Bên phải là mép đường, khách đi vào từ mép phải.
- Không có bàn vẽ sẵn trong tranh. Bàn, ghế, đồ là sprite rời đặt theo `tables` / `placements`.

**`quan-scene`** (quán có mái, cấp 7+):
- **Tường trong** (y 0–440): gạch men trắng nửa dưới, tường vàng nửa trên.
- **Cửa sau** bên phải (khung cửa ~330 px, đáy [1245, 440]) dẫn vào hẻm: khách vào ra cửa này.
- **Trên tường**: kệ gỗ, quạt trần, lịch, bảng hiệu phía trên.
- **Mặt trước quán** mở ra vỉa hè (ngoài khung hình, phía người xem). Bếp than đặt sát mặt tiền bên trái để khói bay ra ngoài.
- Có thể thấy một khoảng bờ sông qua ô cửa sổ trên tường trái.

### 7.1 Toạ độ đề xuất (điểm chạm mặt bàn hoặc sàn)

Codex ghi giá trị thật vào `asset-manifest.json` → `placements`. Khoá không tiền tố thuộc `quan-scene`; tiền tố `street-` thuộc `street-scene`.

| Khoá | Đề xuất `at` | Mặt (`surface`) | Khoá street- tương ứng | Đề xuất `at` |
|---|---|---|---|---|
| `owner` | [330, 520] | sau quầy | `street-owner` | [330, 520] |
| `helper-home` | [700, 600] | sàn, đầu lối đi | — | — |
| `grill` | [235, 408] | quầy nướng | `street-grill` | [235, 408] |
| `grill-2` | [210, 326] | kệ sau (bếp phụ) | — | — |
| `suon-tray` | [80, 410] | quầy nướng | `street-suon-tray` | [80, 410] |
| `electric-blower` | [372, 414] | quầy nướng | — | — |
| `smoke-hood` | [235, 290] | treo trên bếp (đáy chụp) | — | — |
| `charcoal-sack` | [40, 600] | sàn | `street-charcoal-sack` | [40, 600] |
| `plate-stack` | [400, 410] | bàn bày | `street-plate-stack` | [400, 410] |
| `bi-tray` | [440, 412] | bàn bày | `street-bi-tray` | [440, 412] |
| `mo-hanh-pot` | [478, 412] | bàn bày | `street-mo-hanh-pot` | [478, 412] |
| `sauce-jar` | [512, 414] | bàn bày | `street-sauce-jar` | [512, 414] |
| `chili-jar` | [538, 414] | bàn bày | `street-chili-jar` | [538, 414] |
| `glass-case` | [585, 396] | bàn bày (phía sau) | `street-glass-case` | [585, 396] |
| `pickle-jar` | [615, 414] | bàn bày | `street-pickle-jar` | [615, 414] |
| `cucumber-tray` | [645, 414] | bàn bày | `street-cucumber-tray` | [645, 414] |
| `box-stack` | [672, 414] | bàn bày | `street-box-stack` | [672, 414] |
| `cash-tin` | [560, 300] | nóc tủ kính | `street-cash-tin` | [560, 300] |
| `ledger` | [610, 302] | nóc tủ kính | `street-ledger` | [610, 302] |
| `rice-cooker` | [440, 322] | kệ sau | `street-rice-cooker` | [440, 322] |
| `rice-cooker-2` | [500, 322] | kệ sau | — | — |
| `soup-pot` | [560, 322] | kệ sau | `street-soup-pot` | [560, 322] |
| `steamer` | [620, 322] | kệ sau | `street-steamer` | [620, 322] |
| `egg-pan` | [680, 324] | kệ sau (bếp gas) | `street-egg-pan` | [680, 324] |
| `tea-cooler` | [690, 560] | ghế đẩu cuối quầy | `street-tea-cooler` | [690, 560] |
| `wash-tub` | [90, 456] | sàn sau quầy nướng | `street-wash-tub` | [90, 456] |
| `water-can` | [40, 456] | sàn sau quầy | `street-water-can` | [40, 456] |
| `wash-station` | [110, 450] | sàn sau quầy (bồn rửa, thay thau) | — | — |
| `bag-hook` | [410, 200] | tường | — | — |
| `takeaway-shelf` | [150, 322] | kệ sau trái | — | — |
| `helper-station` | [740, 470] | sàn | — | — |
| `queue-bench` | [1150, 460] | sàn sát tường, cạnh cửa | — | — |
| `signboard` | [640, 70] | tường trên | `street-signboard` | [600, 620] (bảng chữ A trên vỉa hè) |
| `menu-board` | [460, 250] | tường | — | — |
| `lantern-string` | [800, 40] | treo | `street-lantern-string` | [800, 40] |
| — | | | `street-awning` | [340, 150] (mép dưới mái bạt) |

Trang trí (toạ độ mặc định trong `quan-scene`, người chơi kéo thả được):

| Đồ | `at` | Đồ | `at` |
|---|---|---|---|
| `bougainvillea-pot` | [30, 710] | `wall-fan` | [1100, 200] |
| `red-lantern` | [500, 200] (đáy đèn) | `old-tv` | [880, 300] |
| `paper-lantern` | [760, 180] | `bird-cage` | [1180, 230] |
| `fairy-lights` | [960, 90] | `banana-plant` | [960, 450] |
| `ceramic-jar` | [1010, 440] | `award-frame` | [700, 200] |
| `chalk-menu` | [760, 330] | `neon-sign` | [1000, 160] |
| `wall-calendar` | [1000, 260] | `old-radio` | [560, 230] |

### 7.2 Bàn, ghế, đường đi

**Quy ước toạ độ bàn:**
- Bàn `at` = giữa chân bàn trên sàn.
- Ghế 2 chỗ: trái [x−100, y+6], phải [x+100, y+6].
- Bàn 4 chỗ: mỗi bên 2 ghế so le.
  - Ghế sau: [x∓120, y−20].
  - Ghế trước: [x∓105, y+18].
- `plateSpots` trên mặt bàn (y − 120): mỗi chỗ ngồi một điểm, lệch về phía người ngồi ±30 px.
- `servePoint` nằm trên lối đi (y 610): chủ quán / Bông đứng đó khi bưng, châm, dọn, lau.

**`street-scene` → `placements.streetTables`:**

| id | Chỗ | Mở | `at` | `seatSpots` (face) | `servePoint` | `joinWith` |
|---|---:|---:|---|---|---|---|
| `s1` | 2 | 1 | [800, 530] | [700,536] right · [900,536] left | [800, 610] | `s2` |
| `s2` | 2 | 1 | [1090, 530] | [990,536] right · [1190,536] left | [1090, 610] | `s1` |
| `s3` | 2 | 3 | [800, 680] | [700,686] right · [900,686] left | [800, 610] | `s4` |
| `s4` | 2 | 5 | [1090, 680] | [990,686] right · [1190,686] left | [1090, 610] | `s3` |

- `streetEntry` [1300, 620] (ngoài mép phải).
- `streetWaitSpots` [[1245, 605], [1210, 628]].
- `streetQueueSpots` [[160, 700], [290, 712]]: shipper đứng trước xe nướng.
- `streetExitPath` [[1180, 612], [1300, 620]].
- `streetAisle` [[690, 545], [700, 610], [1280, 610]].

**`quan-scene` → `placements.tables`:**

| id | Chỗ | Mở | `at` | `seatSpots` (face) | `servePoint` |
|---|---:|---:|---|---|---|
| `q1` | 2 | 7 | [820, 530] | [720,536] right · [920,536] left | [820, 610] |
| `q2` | 2 | 7 | [1100, 530] | [1000,536] right · [1200,536] left | [1100, 610] |
| `q3` | 4 | 7 | [820, 680] | [700,660] right · [715,698] right · [940,660] left · [925,698] left | [820, 610] |
| `q4` | 2 | 10 | [520, 690] | [420,696] right · [620,696] left | [560, 610] |
| `q5` | 4 | 13 | [1130, 680] | [1010,660] right · [1025,698] right · [1250,660] left · [1235,698] left | [1130, 610] |

- `door` [1245, 440] (đáy khung cửa sau).
- `waitSpots` [[1200, 462], [1150, 458], [1100, 455]]: đứng sát tường, sau hàng bàn sau.
- `queueSpots` [[160, 700], [290, 712], [60, 690]]: shipper.
- `exitPath` [[1245, 610], [1245, 440]].
- `aisle` [[690, 545], [700, 610], [1245, 610]].

**Ghi chú lớp vẽ:**
- Code sắp lớp theo y chân: bàn, ghế, khách ngồi, chủ quán, khách đứng.
- Khách ngồi ghế sau của bàn 4 chỗ bị mặt bàn che phần chân, đúng như thật.
- Codex chỉ cần bảo đảm cảnh không vẽ vật cố định (cột, chậu) đè lên các điểm trên.

## 8. Danh sách sheet

Tên frame chính xác ở `asset-spec.json`.
- Lưới 2× trừ khi ghi "1×".
- WebP lossless, alpha cứng (trừ `weather-fx`).
- Rect và anchor chia hết cho 2 ở sheet lưới 2×.

### Đợt 1

| Sheet | Ô · anchor | Nội dung |
|---|---|---|
| `street-scene`, `street-foreground` | 1280×720 | Quán vỉa hè + lớp che quầy. **Codex đang vẽ.** |
| `quan-scene`, `quan-foreground` | 1280×720 | Quán có mái + lớp che quầy. **Codex đang vẽ.** |
| `title-art` | 1280×720 | Tranh màn chào theo thumbnail, chừa vùng phải 420 px cho bảng. |
| `characters` | 216×288 · [108,262] | Dáng đứng 13 vai. |
| `customer-walk-cycles` | 216×288 · [108,262] | 11 khách × đi 4 khung + clip `<vai>-walk` (8 fps lặp). |
| `customer-reactions` | 216×288 · [108,262] | 11 khách × waiting / happy / impatient. |
| `customer-actions` | 216×288 · [108,262] | 11 khách × order-1..2 / surprised-1..2. |
| `customer-seated` | 216×288 · [108,262] | 10 khách (trừ shipper) × sit-eat-1..2, sit-wait, sit-call, sit-happy, sit-annoyed + clip `<vai>-sit-eat` (4 fps lặp). Cao 190–232. |
| `owner-scene` | 216×288 · [108,262] | Chủ quán: idle 2; grill / fan / plate / walk / carry / wipe × 4; serve / pour / box × 2; + clip. |
| `helper-scene` | 216×288 · [108,262] | Bông: idle 2; walk / carry / wipe × 4; serve / pour / clear × 2; + clip. |
| `grill` | 320×192 · [160,176] | Bếp than: cold / low / mid / high / ash; flare 1–3; smoke 1–3. Clip flare 8 fps, smoke 4 fps lặp. |
| `grill-items` | 96×64 · [48,52] | 5 món × 5 độ chín + lật 2 khung; trứng 5 độ. |
| `plate-layers` | 160×192 · [80,174] | 35 lớp dĩa / hộp (mục 5). |
| `equipment` | 192×192 · [96,168] | Nồi cơm nhỏ / lớn (rỗng, nấu 1–3, sẵn, sắp hết, hư), chảo trứng, xửng (+khay chả sống / chín), nồi canh, hũ mỡ hành 3 mức, bình trà đá, bao than 3 mức, quạt mo, quạt máy, chồng dĩa 3 mức, thau rửa 3 mức, chồng hộp, hũ nước mắm, hũ ớt, hũ đồ chua, khay dưa leo, khay bì, khay sườn ướp, hộp tiền, sổ nợ, móc túi, chụp hút khói, can nước. Clip theo spec. |
| `tables` | 320×224 · [160,208] | Bàn 2 chỗ và 4 chỗ × clean / set / dirty / wet. Mặt bàn cao 120 px trên anchor. Không kèm ghế. |
| `table-items` | 96×96 · [48,84] | Ghế đỏ / xanh, dĩa đang ăn (đầy / nửa / sạch), hộp đang ăn, ly trà (đầy / nửa / cạn), bình trà, khăn lạnh, khay hoá đơn, chồng dĩa dơ, chén canh. |
| `ingredients` | 64×64 · [32,32] | 28 icon (id khớp ECONOMY §1). |
| `bills` | 96×48 · [48,24] | Tờ tiền 1k → 500k (hư cấu, chỉ số và hoa văn, không hình người thật), chồng xu, phiếu tính tiền (trống / đã trả / ghi sổ), thẻ QR (ô vuông hoa văn, không quét được). |
| `fx` | 96×96 · [48,48] | Khói, xèo, lửa, hơi nóng, lấp lánh, xu bay, "ting", vệt lau sáng, rót trà. |
| `ui-icons` | 48×48 · [24,42] | 35 icon HUD (spec). |

### Đợt 2

| Sheet | Ô · anchor | Nội dung |
|---|---|---|
| `owner-actions-hd` | 320×320 · [160,316] · 1× | Cận cảnh thân trên chủ quán (phía sau dĩa HD / bếp lớn): idle 2; grill / fan / plate / pour / box / bill × 4. |
| `plate-layers-hd` | 320×384 · [160,348] · 1× | 35 lớp, cùng tên + bố cục bản thường. |
| `grill-hd` | 640×320 · [320,304] · 1× | Bếp lớn cận cảnh 5 mức than + flare 2. |
| `grill-items-hd` | 192×128 · [96,104] · 1× | Cùng 40 frame `grill-items`, chi tiết vân vỉ, mỡ bóng. |
| `portraits-hd` | 384×320 · [192,308] · 1× | Chân dung chủ quán + 11 khách (Bông nằm ở drama-portraits). |
| `portrait-expressions-hd` | 384×320 · [192,308] · 1× | 11 khách × 5 biểu cảm + chủ quán 5. |
| `drama-portraits-hd` | 384×320 · [192,308] · 1× | 12 NPC × 4 biểu cảm. |
| `weather-fx` | 640×360 · [0,0] (vẽ ×2) | Mưa 4, chớp 2, nước tràn vỉa hè 2, khói bếp dày 3, `power-cut-glow`. Được phép alpha bán trong suốt. |
| `fixtures` | 384×256 · [192,240] | Tủ kính (rỗng / ít / đầy), bảng hiệu 3 bậc, mái bạt vỉa hè, dây đèn lồng, bảng menu, kệ hộp, chỗ phụ bàn, bồn rửa, ghế chờ dài. |
| `decor` | 128×128 · [64,120] | 14 đồ trang trí (ECONOMY §8). |
| `journal-card` | 1080×1350 | Khung thẻ Nhật Ký (SCREENS.md). |

## 9. Luật cứng (nhắc lại từ PLAYBOOK §1–§2)

- Một mật độ điểm vẽ cho cả bộ. Không vẽ nhân vật thô hơn cảnh. Không phóng to mượt.
- Kiểm nhanh: thu ½ rồi phóng ×2 nearest phải ra y hệt (sheet lưới 2×).
- **Thước:** người đứng ≈ 260, cửa ≈ 330, quầy ≈ 150, mặt bàn ≈ 120. Ghi `sceneScale` cho cả hai cảnh.
- Không chữ trên đồ vật trong cảnh (bảng hiệu, menu, hộp, phiếu) để UI thay nội dung.
- Không logo, không thương hiệu, không người thật, không toà nhà thật nhận ra được, không emoji.
- Chạy `python -I tools/asset-check/check_assets.py docs/quan-com-tam/asset-spec.json --preview <tmp>` tới **0 lỗi**, rồi soi `nhan-vat-xep-hang-x2.png`.
