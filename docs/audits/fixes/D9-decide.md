# D9 · Ba việc chủ dự án đã chọn (Trà Sữa, Cơm Tấm, Bánh Mì)

Nhánh `claude/d9-decide`. Bối cảnh: `D9-shops.md` (mục "Báo lại, cần quyết định thiết kế") và `D7-shops.md` (Bánh Mì thối tiền).
Không đổi định dạng bản lưu. Không đụng asset, không đụng `cdp.mjs`.

## 1. Trà Sữa: bảng sự kiện ở điện thoại dọc thấp

**Quyết định:** điện thoại dọc thấp (cao dưới ~700 px) thì thu dải ảnh chân dung từ khoảng 160–200 px xuống ~110 px để mọi lựa chọn
của mọi sự kiện thấy trọn, không phải cuộn. Không đụng bố cục 2 cột khi xoay ngang.

**Đo trước khi sửa:** đo cả 109 bước (mỗi nút `nodes` của mỗi sự kiện trong `data/events*.js`, gồm R01–R10, hết hàng, M3, M5), mở
thật bằng `__game.forceEvent`. Một bước **đạt** khi mọi lựa chọn nằm trọn trong khung, bấm được ở tâm và hai góc, và bảng không phải cuộn.

| Khung dọc | Bước không đạt (trước) | Nặng nhất (trước) | Sau |
|---|---|---|---|
| 320×568 | 79/109 | R09: lựa chọn 2–3 dưới mép, nội dung dư ~210 px | **109/109 đạt**, bảng còn dư ít nhất 35 px (FA2) |
| 360×640 | 19/109 | V20: lựa chọn 3 khuất 37 px | **109/109 đạt**, còn dư ít nhất 108 px (H01) |
| 375×667 | 10/109 | H01: lựa chọn 3 khuất 27 px | **109/109 đạt**, còn dư ít nhất 168 px (H01) |

Chỉ thu dải ảnh 50 px thì chưa đủ cho R09 ở 320, vì bảng ở điện thoại còn chừa lề 16 px mỗi bên (luật `.sheet { padding: 16px }`
của điện thoại đè `.drama { padding: 0 }`), và chữ thoại 16 px có lề lớn. Nên làm thêm phần gọn như bảng xoay ngang đã làm (TLC12-02).

**Sửa** (`index.html`, khối `@media (orientation: portrait) and (max-height: 699px)`, chỉ áp vào `.sheet.drama`):
- Dải ảnh 110 px (cả bảng kết quả `.drama-stage.small`). Chân dung `zoom: .56` (~84 px), tên dưới chân dung 12 px.
- Bảng sự kiện không chừa lề (ảnh sát mép, như trên máy tính), nhãn "Trên mạng · Ca đang tạm dừng" được xuống 2 dòng.
- Lời thoại 14 px, lựa chọn gọn (padding 6/12, cách nhau 6 px, vẫn ≥ 44 px), chữ phụ 11 px. Giống hệt cỡ của bảng xoay ngang.
- Bố cục xoay ngang (`max-height: 520px` + `landscape`) không đổi. Tablet dọc và điện thoại cao (390×844 trở lên) không đổi.

**Ảnh trước / sau** (R09, 320×568): trước, dải ảnh to chiếm gần nửa bảng, lời thoại 16 px xuống 7 dòng, chỉ thấy lựa chọn 1
(bị cắt ở mép dưới). Sau, dải ảnh thấp hơn hẳn (vẫn đủ mặt 2 người, tên, nhãn), lời thoại 6 dòng, cả 3 lựa chọn thấy trọn, dưới lựa
chọn cuối vẫn còn khoảng trống trước thanh Hoàn tác / Giao ly.

**Test:** `test/e2e-layout.mjs` thêm `runEventPortrait` (gọi trong `runLayout`, nên `e2e.mjs` chạy luôn). Ở 320×568, 360×640,
375×667 nó mở từng bước của từng sự kiện, đo các lựa chọn, rồi bấm lựa chọn đầu và đo nút "Tiếp tục" của bảng kết quả. Cách mở:
tạm đổi `when` / `who` / `nodes.start` của bản ghi sự kiện (cùng module với game) để mở được bước cần đo, vẽ xong thì trả lại và đặt
`dialog.node` về bước đó. Có khách đang chờ làm người nói, đủ tiền / hàng để mọi lựa chọn đều bật.

Chưa đo: lời "Bạn" theo từng tính cách chủ tiệm (`meBy`), vì test dùng tính cách mặc định. Bảng chọn cách xử lý hết hàng
(`ui/stockout.js`, 5–6 lựa chọn) và bảng khiếu nại cũng được gọn theo, vì cùng là `.sheet.drama`, nhưng chưa có test riêng.

## 2. Cơm Tấm: nút Tiếng trên thanh đầu

**Quyết định:** ở khung ≤ 360 px, nút Tiếng chỉ hiện biểu tượng, có 3 trạng thái khác nhau theo kiểu pixel của game. Chữ đủ vẫn
ở `aria-label` và `title`. Nút vẫn ≥ 44 × 44. Màn rộng hơn vẫn hiện chữ.

**Trước:** ở 320, chọn "Tiếng: hiệu ứng" (chữ dài nhất) thì nút rộng ra và ô tiền trên thanh đầu bị cắt một phần (D9-shops).

**Sửa:**
- `game.js syncMute()`: nút có `<svg class="snd-ico">` (lưới 12 × 11, 1 điểm = 2 px, `shape-rendering: crispEdges`) và
  `<span class="snd-l">Tiếng: …</span>`. Đặt `aria-label` = "Tiếng: bật" / "Tiếng: hiệu ứng" / "Tiếng: tắt", `title` thêm " (M)".
  `aria-pressed` và `data-mode` giữ như cũ.
  - Bật hết: loa kem + 2 vạch sóng vàng.
  - Chỉ hiệu ứng: loa kem + 1 vạch sóng vàng.
  - Tắt: loa xám + dấu X đỏ cam.
- `index.html`: mặc định ẩn biểu tượng. `@media (max-width: 360px)` thì ẩn chữ, hiện biểu tượng, nút 44 × 44.

**Đo sau khi sửa** (320×568, 360×640, 390×844; lúc Chuẩn bị và trong ca; mỗi trạng thái tiếng với tiền 150k, 123,4tr, 1,2 tỷ):
ô tiền thấy trọn (không bị cắt trong `.chips`, không tràn khung). Trong ca, tâm ô tiền không bị che. Lúc Chuẩn bị, lớp phủ nằm trên
thanh đầu nên chỉ đo khung. Nút 44 × 44 ở 320 / 360, có 3 biểu tượng khác nhau. 390 hiện chữ, không hiện biểu tượng. Không tràn ngang.

**Ảnh:** ở 320 trong ca, thanh đầu là ← · "17:42 / Ngày 1" · "1,2 tỷ" · [loa] · Dừng · ?. Ba trạng thái nhìn khác hẳn nhau
(2 sóng, 1 sóng, X đỏ), ô tiền hiện đủ "1,2 tỷ" ở cả ba.

**Test:** `test/e2e-layout.mjs` thêm `runSoundHeader` (gọi cuối `runLayout`), gồm 6 kiểm tra như trên.

## 3. Bánh Mì: gợi ý thối tiền ngày 4–5

**Quyết định:** chỉ ngày 4–5. Khách cần thối mà chưa chọn tờ nào thì tờ cần đưa nhấp nháy nhẹ, kèm dòng "Chạm tờ tiền để thối".
Chạm một tờ là thôi gợi ý. Từ ngày 6 không gợi ý. Có `prefers-reduced-motion` thì viền đứng yên, không nhấp nháy.

**Sửa:**
- `data/economy.js`: `CHANGE_HINT_DAYS = [4, 5]`.
- `core/shift.js changeHint(s, picked, tapped)` (thuần): trả `{ mệnh giá: số tờ }` của cách thối đúng ít tờ nhất (`makeChange`),
  khi đang thối tay (ngày 4–5, không phải ngày có "Thối đúng"), khách cần thối > 0, chưa chọn tờ nào và chưa chạm tờ nào ở lượt này.
  Các trường hợp khác trả `null`. Không thối đúng được (quỹ lẻ thiếu) thì không gợi ý; người chơi vẫn có "Hết lẻ?".
- `ui/bench.js changePanel`: có gợi ý thì hiện `<p id="chgHint" class="chg-hint">Chạm tờ tiền để thối</p>` trên lưới tờ, các
  tờ cần đưa có lớp `.hint` và `aria-describedby="chgHint"`. Chạm một tờ thì ghi `tapped = "ngày:khách"`, nên gợi ý không hiện lại
  ở lượt thối đó, kể cả sau khi bấm "Chọn lại". Khách sau (vẫn ngày 4–5) thì gợi ý lại.
- `index.html`: tờ gợi ý có viền hổ phách đứng yên (cùng kiểu `.opt.hint`), thêm một vòng sáng `::after` nhấp nháy nhẹ chỉ bằng
  `opacity` (1,6 s). Có `prefers-reduced-motion: reduce` thì `animation: none; opacity: 1` (viền + vòng sáng đứng yên).
- Gợi ý "Hộp đếm tiền" (`.sug`, đồ mua thêm) giữ nguyên.

**Ảnh:** ngày 4, 390×844, khách đưa 50k: dưới "Cần thối …k" có dải vàng "Chạm tờ tiền để thối", các tờ cần đưa có viền vàng và
vòng sáng nhấp nháy. Nút thối vẫn ghi "Chọn tờ để thối" (tắt). Chạm một tờ thì dải vàng và viền tắt ngay.

**Test:**
- Unit `test/change.test.mjs` (1 test mới): ngày 4 và 5 gợi ý đúng `makeChange`. Đã chọn tờ thì `null`, đã chạm rồi "Chọn lại"
  cũng `null`, tờ số 0 không tính là đã chọn. Thối theo gợi ý được tính thối đúng, xong thì hết gợi ý. Ngày 1 / 3 / 6 / 9 không gợi ý.
  Quỹ lẻ không thối được thì không gợi ý.
- E2E `test/e2e.mjs changeHintDay4` (điện thoại 390×844, chạm thật, 5 kiểm tra): ngày 4 có dòng gợi ý và đúng các tờ nhấp nháy
  (`animation-name: billHint`), nút thối tay tắt, không có "Thối đúng". Giả lập `prefers-reduced-motion: reduce` thì `animation: none`,
  `opacity: 1`. Ngày 6 và ngày 3 không có gợi ý. Chạm một tờ thì hết gợi ý, cả sau "Chọn lại". Thối theo các tờ gợi ý là thối đúng.

## Tag cache

| Game / file | Trước | Sau |
|---|---|---|
| Bánh Mì (mọi module, cả test / `tools/sim`) | `b12` | `b13` |
| Cơm Tấm `game.js` | `c10` | `c11` (module khác giữ `c10`; `index.html` không gắn tag) |
| Trà Sữa | — | không đổi (chỉ sửa `index.html` và test) |

`node tools/cache-tags/check-tags.mjs master`: `OK: 45 file tĩnh đổi, mọi tham chiếu ?v= tới chúng đã đổi tag.`

## Kết quả test

Unit (`node --test test/*.test.mjs`):

| Gói | Kết quả |
|---|---|
| Trà Sữa | 179/179 |
| Bánh Mì | 125/125 (thêm 1 test D9 ở `change.test.mjs`) |
| Cơm Tấm | 147/147 |

E2E (Chrome headless, server cổng 8981):

| Test | Kết quả |
|---|---|
| Trà Sữa `e2e.mjs` (gồm e2e-layout, sự kiện ngang, sự kiện dọc D9) | **180/180** (thêm 3 kiểm tra D9), 0 lỗi console |
| Bánh Mì `e2e.mjs` (gồm layout) | **155 PASS, E2E ĐẠT** (thêm 5 kiểm tra D9), 0 lỗi console |
| Cơm Tấm `e2e.mjs` (gồm layout, m3a, m5, m5v) | **217 PASS, E2E ĐẠT** (thêm 6 kiểm tra D9), 0 lỗi console |

Lượt đầu chạy 3 e2e song song trên máy đang có agent khác làm việc thì Bánh Mì và Cơm Tấm có vài lỗi không liên quan
(nhạc giờ cao điểm chưa tải kịp, màn chào chưa hiện sau khi xoá bản lưu, `plate-layers`). Chạy lại từng game một thì đạt hết.
Lượt đầu cũng lộ một lỗi trong chính test D9 của Bánh Mì: khách đầu tiên trả vừa đủ nên không có khay thối. Đã sửa test để phục vụ
tới khi gặp khách cần thối.
