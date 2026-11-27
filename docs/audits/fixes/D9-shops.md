# D9 · Tiệm (phần B): HUD Nông Trại, lỗi frame(), soát bố cục sau D8

Nhánh `claude/d9-shops`. Không đổi định dạng bản lưu. Không đụng asset.

## 1. Nông Trại: HUD xuống 2 hàng ở 360 (cuối game)

**Đo trước khi sửa** (cấp 20, 999.999.999 xu, kho 320/320; HUD = khung chỉ số + 3 nút Thu hết / Xây / Sổ):

| Khung dọc | Trước | Sau |
|---|---|---|
| 320×568 | 2 hàng (cố ý, xem dưới) | 2 hàng (giữ) |
| 360×640 | 2 hàng (100 px) | **1 hàng** (50 px) |
| 375×667 | 2 hàng | **1 hàng** |
| 390×844 | 2 hàng | **1 hàng** |
| 412×915 | 2 hàng | **1 hàng** |

Ở 390, D7 (TLC12-04) chỉ đo chiều cao `.stats` nên không thấy: khung chỉ số vẫn 1 dòng, nhưng 3 nút bị đẩy xuống hàng dưới.
Đo ra: chỉ số cần ~266 px, nút ~172 px, cộng lại ~444 px trong khi chỗ có 374 px (390) / 344 px (360).

**Sửa** (`index.html`, `game.js`), áp dụng ở điện thoại dọc ≤ 440 px:
- Nhãn chữ "Cấp" / "Kho" (10 px) thành biểu tượng sao / nhà kho, giống cách ≤ 360 px đã làm từ D4. Chữ vẫn còn cho trình đọc màn hình.
  Hết chữ < 12 px trong HUD (trước có nhãn 10 px và chữ nút 11 px ở ≤ 360).
- "Thu hết" xuống 2 dòng, chữ 12 px, nút rộng 46 px (vẫn ≥ 44 × 44).
- Khoảng cách / lề trong khung chỉ số bớt vài px. Số xu 16 px (≤ 360: 15 px), số khác 15 px (≤ 360: 14 px).
- `fitHud()` trong `game.js`: hiện đủ "320/320" trước; nếu nút vẫn bị đẩy xuống hàng dưới thì thêm `.hud.nocap`, ô Kho chỉ hiện số
  đang chứa ("320"). Phần "/320" vẫn còn cho trình đọc màn hình. `title` có đủ "Kho: 320/320 chỗ", thanh đầy dưới số vẫn đỏ khi đầy.
  Chỉ đo lại khi chữ xu / cấp / kho đổi, khi đổi cỡ khung và khi font tải xong (không đo mỗi lần vẽ).
  - Người mới (24 xu, 0/60) ở 360: vẫn hiện đủ "0/60".
  - Cuối game ở 360 / 375 / 390 / 412: "999tr · ★20 · 320", 1 hàng. Có "+12 giỏ tràn" hay "1,5 tỷ" cũng vẫn 1 hàng.

**320×568: chưa làm 1 hàng, cần quyết định thiết kế.** Ở 320 có 304 px. Ba nút ≥ 44 px chiếm 147 px, còn ~137 px cho 3 số. Mà 3 số
(xu có biểu tượng, cấp, kho chỉ số đang chứa) ở 14–15 px đã cần ~170 px. Muốn 1 hàng thì phải bỏ hẳn một thứ khỏi HUD, ví dụ:
(a) chuyển nút Sổ lên thanh đầu (thanh đầu ở 320 đã cắt chữ "NÔNG TR…"), (b) bỏ ô Cấp khỏi HUD ở ≤ 340, hoặc (c) chuyển "Thu hết"
xuống khay hạt. Vì vậy vẫn giữ bố cục D4 ở ≤ 340: hàng số liệu (đủ "320/320") rồi hàng 3 nút. Chữ ở 320 cũng đã ≥ 12 px.

**Tag:** Nông Trại `m14` → `m15` ở mọi tham chiếu (418 chỗ, cả test và `tools/sim`). `test/m5.test.mjs` kiểm `m15`.

**Test:** e2e Nông Trại thêm 4 kiểm tra "D9: HUD cuối game một hàng" ở 360×640, 375×667, 390×844, 412×915. Cả 4 kiểm 999tr + kho
320/320 thật (Nhà kho cấp 6). Mỗi kiểm tra đòi: nút cùng hàng với chỉ số, nút ≥ 44 px, chữ hiện ≥ 12 px, không tràn ngang.

## 2. `frame()` ghi lỗi có tiết chế (Cơm Tấm, Bánh Mì, Trà Sữa)

Cả 3 tiệm có cùng mẫu từ D7 (TLC22-01): `try { step(now); } catch (err) { console.error(err); }`. Một lỗi lặp lại sẽ in ~60 dòng/giây.

- Module mới `_shared/frame-errors.js`, hàm `frameErrorLog(label)` trả `{ error(err), ok() }`:
  - Mỗi lỗi khác nhau (khoá theo `name: message`) in đầy đủ **một lần**, kèm chính đối tượng lỗi để còn stack.
  - Lỗi lặp lại thì chỉ đếm. Cứ ~5 s in một dòng `[Cơm Tấm] lỗi lặp lại N lần trong 5 s: TypeError: …`.
  - Lỗi đổi sang lỗi khác thì in ngay số đếm của lỗi cũ. Lỗi cũ quay lại thì chỉ đếm, không in lại cả stack.
  - Lỗi thôi lặp: `ok()` (gọi sau mỗi khung êm) in nốt số đếm sau ~5 s. Không có lỗi chờ thì `ok()` chỉ so một số, gần như không tốn.
  - Không bao giờ ném lỗi, kể cả khi lỗi là `null` / chuỗi / đối tượng có getter ném, hoặc `console` hỏng. Game vẫn chạy như cũ.
  - Nhớ tối đa 50 loại lỗi rồi xoá danh sách, để không phình bộ nhớ khi thông điệp lỗi chứa id thay đổi.
- `game.js` của 3 tiệm: `try { step(now); frameErr.ok(); } catch (err) { frameErr.error(err); }`. rAF vẫn hẹn trước `step()`.
- Test: `_shared/test/frame-errors.test.mjs` (6 test):
  - lỗi lặp 12 s ở 60 fps chỉ in 3 dòng;
  - đổi lỗi thì in đúng thứ tự;
  - lỗi thôi lặp thì in nốt số đếm;
  - lỗi ngắt quãng (cứ 2 khung một lỗi) vẫn không in mỗi khung;
  - không bao giờ ném;
  - kiểm mã nguồn 3 `game.js` dùng `frameErrorLog` và `frame()` không còn `console.error`.
  `quan-com-tam/test/endshift.test.mjs` (rAF trước `step()`, có `try`) vẫn đạt.

Nông Trại không có vòng rAF chính bọc try (như D7 đã ghi), nên không áp dụng.

## 3. Soát bố cục 4 tính năng D8

Quét bằng Chrome headless (chạm, dpr 2) ở 320×568, 360×640, 390×844, 844×390, 768×1024. Mỗi khung chụp ảnh và đo các phần tử chính:
có nằm trong khung không, tâm có bị che không (`elementFromPoint`), chữ có bị cắt không (`scrollWidth/Height`), các phần tử có chồng nhau
không, có tràn ngang không.

| Tính năng D8 | Kết quả | Sửa |
|---|---|---|
| Bánh Mì: dải HUD dính khi cuộn | **Lỗi ở 320 và 360:** trong dải, 3 ô HUD bị cắt ("1,2 tỷ" mất số đầu, "05:44" đè ô tiền), vì 2 viên Lò / Gas giữ `min-width: 100px` | Đã sửa (dưới) |
| Cơm Tấm: hỏi lại ở chân bảng | Đạt cả 5 khung: dòng đỏ + "Chuẩn bị nhanh" / "Vẫn mở quán" thấy trọn, ≥ 44 px, không chồng | Không cần |
| Trà Sữa: bảng sự kiện 2 cột khi xoay ngang | Đạt ở 844×390 (2 cột), 390×844, 768×1024. Ở 320×568 và 360×640 dọc thì phải cuộn trong bảng mới thấy lựa chọn 2–3 (xem dưới) | Báo lại |
| Nông Trại: khung cuộn ruộng | Đạt: 320×568 thấy 13/25 ô, 360×640 thấy 25/25, trang không cuộn. 390 / 768 / 844 không dùng khung cuộn, không chồng | Không cần |

**Bánh Mì, dải dính** (`index.html`, `ui/screens.js`):
- Trong dải, viên Lò / Gas không còn `min-width` và gọn hơn (vòng lò 26 px).
- Viên Gas trong dải bỏ chữ "mẻ" ("Gas 29"). `screens.js` bọc " mẻ" trong `<span class="u">`, trong cảnh vẫn hiện "Gas 29 mẻ".
- ≤ 360 px: ô HUD trong dải bớt lề.
- Đo lại ở 320 / 360 / 375 với tiền 1,2 tỷ: không ô nào bị cắt. Lò 73 px, Gas 49 px (trước 100 + 100).

**Thấy thêm khi quét (ngoài 4 tính năng), đã sửa: Cơm Tấm, ô tiền trên thanh đầu bị cắt ở điện thoại dọc.**
- Ở 360, ô tiền chỉ còn "1234…", "150k" cũng bị cắt. Ở 320 thì mất hẳn ô tiền, cả lúc chuẩn bị lẫn trong ca.
- Nguyên nhân: ô "17:35 Ngày 1" nằm ngang, 3 nút Tiếng / Dừng / ? đã chiếm ~170 px, và tiền lớn hiện "1234567k".
- Sửa (`index.html`, `game.js`):
  - Ở bố cục dọc, ô ngày xếp 2 dòng: giờ ở trên, "Ngày N" (hoặc "chuẩn bị") ở dưới.
  - Tiền từ 1.000k hiện dạng gọn "1,2tr" / "1,2 tỷ". `title` có số đủ.
  - ≤ 340 px: khoảng cách trên thanh đầu bớt vài px.
- Sau sửa: 360 / 390 / 768 thấy đủ ô tiền. Ở 320 vừa khít với "150k" và "1,2 tỷ". Nếu đang chọn "Tiếng: hiệu ứng" (chữ dài hơn) thì ở 320
  ô tiền vẫn bị cắt một phần. Muốn hết hẳn thì phải đổi nút Tiếng thành biểu tượng, là việc thiết kế nên chưa làm.

**Báo lại, cần quyết định thiết kế: Trà Sữa, bảng sự kiện ở điện thoại dọc thấp** (320×568, 360×640).
- R09 (3 lựa chọn): bảng cao 496 px nhưng nội dung cao 708 px (320×568). Lựa chọn 2–3 nằm dưới mép, phải cuộn trong bảng. Ở 360×640 thì
  lựa chọn 3 phải cuộn. Lựa chọn 1 thấy được, và lựa chọn bị cắt ở mép dưới cho thấy còn nữa.
- D8 không gây ra lỗi này: D8 chỉ đổi khối xoay ngang, còn dọc vẫn như cũ.
- Muốn thấy trọn thì phải bớt dải ảnh chân dung (~190 px ở 320) ở màn dọc thấp: thu nhỏ, bỏ ảnh, hoặc làm 2 cột như xoay ngang. Việc này
  đổi bố cục tranh nên cần chủ dự án chọn.

Còn thấy (đã có từ trước, không thuộc đợt này): ở Nông Trại 360, nút "Phía Đông →" che nhãn "Bảng đơn" (TLC1-06, D8 đã hoãn). Ở Nông
Trại 320, thông báo nổi che HUD trong 2–3 giây.

## Tag cache

| Game / file | Trước | Sau |
|---|---|---|
| Nông Trại (mọi module) | `m14` | `m15` |
| Cơm Tấm (mọi module, cả test / tools/sim) | `c9` | `c10` |
| Bánh Mì (mọi module, cả test / tools/sim) | `b11` | `b12` |
| Trà Sữa `game.js` | `m43` | `m44` (module khác giữ `m43` / `m38`) |
| `_shared/frame-errors.js` (mới) | — | `fe1` |

`node tools/cache-tags/check-tags.mjs master`: `OK: 177 file tĩnh đổi, mọi tham chiếu ?v= tới chúng đã đổi tag.`

## Kết quả test

Unit (`node --test test/*.test.mjs`):

| Gói | Kết quả |
|---|---|
| Trà Sữa | 179/179 |
| Bánh Mì | 124/124 |
| Cơm Tấm | 147/147 |
| Nông Trại | 182/182 |
| `_shared` | 65/65 (có 6 test mới ở `frame-errors.test.mjs`) |

E2E (Chrome headless, server cổng 8971):

| Test | Kết quả |
|---|---|
| Trà Sữa `e2e.mjs` (gồm e2e-layout + sự kiện ngang) | **177/177** |
| Bánh Mì `e2e.mjs` (gồm layout) | **150 PASS, E2E ĐẠT** |
| Cơm Tấm `e2e.mjs` (gồm layout, m3a, m5, m5v) | **211 PASS, E2E ĐẠT**, 0 lỗi console |
| Nông Trại `e2e.mjs` | **185/185** (thêm 4 kiểm tra D9) |
| Nông Trại `e2e-cards.mjs` | 44/44 |
| Nông Trại `e2e-m4.mjs` | ALL PASS |

Chạy một lượt, không có lần chập chờn nào.
