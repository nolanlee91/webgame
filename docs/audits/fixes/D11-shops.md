# D11 · Tiệm: tab cuộn Nông Trại, thông báo khi có bảng phủ, chữ chốt ca Bánh Mì, P3 lặt vặt

Nhánh `claude/d11-shops` (đã gộp master sau D10). Không đổi định dạng bản lưu. Không đụng asset, 2048 / Đào Vàng / Rắn,
`_shared/share.js` hay phần thống kê games-server.

## 1. Nông Trại: "Phía Đông →" che công trình (TLC1-06, TLC1-07)

**Trước** (cấp 20, đủ công trình, đã mở phía Đông): nút chữ 107×44 ở góc trên phải khung bản đồ. Đo chồng lấn:
390 che biển Làng + nhãn, Sạp chợ + mũi tên nâng cấp; 844×390 che Bảng đơn + nhãn + 3 ô ruộng, Sạp chợ + Xưởng;
1366 che Sạp chợ. Chế độ Xây thêm ô trang trí `cong`, `san-kho`, `goc-ruong-tr`.

**Sửa** (`index.html`, `game.js` `placePan`):
- Bỏ nút chữ. Thay bằng 2 tab chỉ có mũi tên pixel (SVG `crispEdges`):
  - `#panE` ôm mép phải khung bản đồ, sang phía Đông;
  - `#panW` ôm mép trái, về ruộng (đã ở ruộng thì về hẳn mép trái).
- Vùng chạm 44 × 44. Phần vẽ 30 px dính sát mép, phần còn lại trong suốt. Có `aria-label` / `title`
  ("Cuộn bản đồ sang phía Đông", "Cuộn bản đồ về phía Tây (ruộng)"; bản đồ chưa mở Đông thì "Xem phần bản đồ bên phải / trái").
- Tab nào hiện tuỳ chỗ cuộn: chưa tới cuối thì có →, đã cuộn khỏi đầu thì có ←, ở giữa thì có cả hai.
- **Vị trí dọc tự chọn chỗ trống.** Dò từng nấc 4 px trong phần bản đồ đang thấy. Phần thấy đã cắt theo màn hình và theo khay
  dính đáy ở điện thoại dọc. Mỗi nấc tính điểm phạt theo vật cản: công trình, ô ruộng, ô trang trí, nhãn, mũi tên nâng cấp.
  - Phạt = phần diện tích bị che, cộng 4 nếu che tâm (chỗ trẻ chạm).
  - Công trình / nhãn / ô trang trí nặng gấp 3 ô ruộng.
  - Lấy nấc ít phạt nhất. Hoà thì lấy nấc gần chỗ cũ, để tab không nhảy.
- Đang cuộn thì giữ chỗ cũ, ngừng cuộn 140 ms mới chọn lại. Không đọc bố cục mỗi giây (giữ luật PERF-06).

**Sau** (7 khung × thường + Xây × đầu / giữa / cuối bản đồ = 56 tab):
- **0 lần che tâm** công trình / ô ruộng / ô trang trí / nhãn.
- Phần còn chạm: công trình tối đa 30 % hộp bao (hộp bao lớn hơn hình, thực tế chỉ là mép cỏ). Ở 320 / 360 / 740 / 844,
  khi cả mép khung là ruộng thì tab nằm vào khe giữa 2 ô, che ≤ 48 % mỗi ô (không che tâm). Xem quyết định A.
- 320×568, 360×640, 390×844, 768×1024, 844×390, 740×360, 1366×768 đều đã chạy.

## 2. Thông báo khi bảng phủ đang mở (TLC2-12): Bánh Mì + Cơm Tấm

Mỗi game có `createToaster` riêng (`tiem-banh-mi/ui/screens.js`, `quan-com-tam/ui/common.js`). Hai bản cùng một luật:

- **Một thông báo một lúc ở mọi cỡ màn, kể cả 1366.** Thông báo mới thay thông báo cũ. Ngoại lệ giữ từ D4: thông báo có nút
  ("Khoe" lúc lên cấp) ở 7 giây và không bị thay. Trước đây Bánh Mì 1366 xếp được 3 cái, Cơm Tấm 2 cái.
- **Bảng phủ mở thì không vẽ thông báo nữa.** Thông báo đang hiện lúc bảng mở được cất lại vào hàng. Câu mới vào hàng, tối đa
  3 câu mới nhất, bỏ câu trùng.
  - Bánh Mì nhận biết bảng phủ qua `#overlay[hidden]`.
  - Cơm Tấm nhận biết qua `body.ov`, gồm cả lớp thoại drama.
- **Đóng bảng thì hiện lần lượt**, 2,4 giây một câu, vẫn một câu một lúc. Câu nằm hàng quá 45 giây thì bỏ (tin cũ, vd sau bảng
  chốt ca dài).
- **Câu quan trọng thành một dòng trong bảng** (`.sheet-note`, `role="status"`):
  - Bánh Mì: sắp hết nguyên liệu (`lowStock`), hết gas dùng bình dự phòng.
  - Cơm Tấm: nồi cơm sắp hết, dĩa sạch sắp hết, mở bao than dự phòng, sang ngày bỏ hàng quá hạn.
  - Câu quan trọng vẫn vào hàng để hiện lại sau khi đóng bảng.
- **Trả lời cho thao tác trong bảng** cũng thành dòng trong bảng (ở 5 giây), không vào hàng. Ví dụ "Không đủ tiền", "Đã nhập đủ
  cho hôm nay", "Đã mua Bàn 3".
  - Gồm `hooks.toast` của bảng và mọi sự kiện từ lệnh do người chơi bấm (không phải nhịp đồng hồ).
  - Lý do: nếu xếp hàng, người chơi bấm mà không thấy phản hồi gì.
- Dòng nằm trong **chân bảng dính đáy**, ngay trên nút chính. Nhờ vậy luôn thấy khi đã cuộn bảng, và không che tab / nút nào.
  Bảng không có chân thì dòng nằm dưới tiêu đề.
- Bỏ CSS cũ đưa thông báo lên `top: 6px` đè thanh đầu khi có bảng phủ. Bánh Mì giữ dải 52 px trên bảng cho thanh đầu.

## 3. Bánh Mì: chữ chốt ca (TLC2-13, phần chữ)

| Cũ | Mới | Chỗ |
|---|---|---|
| Giá vốn ổ đã bán | Tiền nguyên liệu ổ đã bán | bảng chốt ca |
| Hao hụt (bánh cháy, bánh dư, đổ bỏ) | Đồ hỏng bỏ (bánh cháy, bánh dư, đổ bỏ) | bảng chốt ca |
| Hao: … | Đồ hỏng bỏ: … | dòng chi tiết dưới bảng chốt ca |
| Lời vận hành (ô lớn + dòng tổng) | Lời còn lại | bảng chốt ca |
| Lời ca | Lời còn lại | thẻ Nhật Ký (`core/journal.js`) |
| Hao hụt cả ca dưới {n}k | Đồ hỏng bỏ cả ca dưới {n}k | nhiệm vụ (`data/equipment.js`) |
| Hao hụt thấp / cao / {lost}k… | Đồ hỏng bỏ ít / nhiều / {lost}k… | câu Nhật Ký (`data/lines-m3.js`, `lines-m5.js`) |

- Thẻ khoe (`summaryShare`) chỉ có "lời / lỗ", không có các nhãn trên nên giữ nguyên. Cách chơi không có các nhãn này.
- Tên test đã đổi theo: `tutorial.test.mjs`, `e2e.mjs`.
- Tài liệu thiết kế (`docs/tiem-banh-mi/*.md`) và bộ mô phỏng (`tools/sim/report.*`) vẫn dùng thuật ngữ kế toán. Đó là chữ cho
  dev, người chơi không thấy.

## 4. P3

- **TLC12-07 Nông Trại xoay ngang, ô ruộng 42 px.**
  - Nguyên nhân: khe ruộng tính theo bề rộng bản đồ thật. Mở phía Đông (×1,5) làm khe to ra, ô nhỏ lại còn 42,5. Ngày 1 cũng chỉ 43,9.
  - Sửa: bản đồ ngang tối thiểu 700 → 720 px, khe tính theo bản đồ gốc (`.5cqi / --bw`).
  - Sau: 844×390, 740×360, 667×375, 915×412 đều **45,1 px**, cả ngày 1 lẫn cuối game. Dọc không đổi.
- **TLC12-09 Nông Trại, thông báo che HUD.**
  - Điện thoại dọc: thông báo nằm ngay dưới dòng nhiệm vụ (trước ở `top: 52px`, đè ô Xu / Cấp / Kho).
  - Đặt lại khi dòng nhiệm vụ mở / đóng gợi ý, khi HUD đổi cỡ, khi cuộn trang.
  - Đổi lại, ở 320 thông báo đè mép trên bản đồ vài giây.
- **TLC12-08 Trà Sữa, ô "Ẩn tên tiệm".** Ô 22 → 28 px. Nhãn bọc ô cao ≥ 44, rộng ≥ 44, cả nhãn bấm được.
- **TLC22-07 Bánh Mì, dải bước ngày 1.**
  - Ẩn ô "Nướng lại" khi phiếu không dặn "giòn giòn" (và ổ không đang / đã nướng lại). Áp mọi ngày.
  - Khung ổ trống thấp lại, để nút không bị đẩy xuống: 150 → 72 px; điện thoại xoay ngang 104 → 60 px.
    Chỉ áp khi màn cao ≥ 640 px. Ở 320×568, khung thấp làm game tự cuộn xuống quầy lúc ghim phiếu, và phiếu khách bị dải dính
    che (`e2e-layout` 320 trượt 2/4 lần). Ở đó giữ 150 px như cũ.
- **TLC22-05, màn chào / Chuẩn bị ca phải cuộn.**
  - Chưa sửa hết: `#introGo` (844×390, 740×360) và nút Mở hàng vẫn dưới mép màn. Cơm Tấm dọc 390: nút vào quán ở y = 886.
  - Phần đã có từ trước: "Nhập đủ cho hôm nay" không còn bị `.tab` che.
  - Sửa: chân bảng dính đáy, như bảng chốt ca của Bánh Mì (TLC2-13) / Đặt Bom.
    - Bánh Mì: màn chào + Chuẩn bị ca (`.sum-foot`).
    - Cơm Tấm: mọi `.footer` trong bảng (màn chào, Chuẩn bị, chốt ca, xác nhận).
  - Bảng tự đặt `scroll-padding-bottom` bằng chiều cao thật của chân bảng, cộng 12 px (`padFoot` trong toaster). Nhờ vậy Tab /
    focus / `scrollIntoView` không đưa nút xuống sau chân bảng. Chân bảng có dòng thông báo thì cao hơn.
  - Đo lại: BM và CT ở 844×390, 740×360, 390×844, 360×640, 320×568, nút chính đều trong màn và bấm được (`elementFromPoint`).
    CT 390: nút vào quán ở y = 784–832.

## Tag

- **Nông Trại:** `m15` → `m16` → **`m17`** (D10 cũng nâng lên `m16`, nên lấy tag mới). 418 tham chiếu, kể cả test và `tools/sim`.
  `m5.test.mjs` kiểm `m17`.
- **Bánh Mì:** `b13` → **`b14`** mọi module, kể cả `game.js` (master đang để `d10`).
- **Cơm Tấm:** `c10` / `c11` → **`c12`** mọi module, kể cả `game.js` (master để `d10`).
- `share.js` theo master: `s3`.
- Trà Sữa: chỉ đổi `index.html` (CSS) và test, không có file `?v=` nào đổi.
- `node tools/cache-tags/check-tags.mjs master`: **OK** (180 file tĩnh đổi, mọi tham chiếu đã đổi tag).

## Test

Chạy lần lượt từng game (không song song):

Kết quả sau khi gộp master (D10), bản cuối:

| Game | Unit | e2e |
|---|---|---|
| Nông Trại | 182/182 | `e2e` 190/190 · `e2e-m4` ALL PASS · `e2e-cards` 44/44 |
| Bánh Mì | 125/125 | `e2e` 167/167, đạt (gồm `e2e-layout` 7 khung, `e2e-m34`, `e2e-m5`) |
| Cơm Tấm | 147/147 | `e2e` 221/221, đạt (gồm `e2e-m3a`, `e2e-m5`) |
| Trà Sữa | 179/179 | `e2e` 181/181 |

**Kiểm tra mới:**
- **Nông Trại (`e2e.mjs`):**
  - tab cuộn ở 7 khung × thường / Xây × đầu / giữa / cuối: ≥ 44 px, có nhãn, không che tâm, công trình ≤ 35 %, ô ≤ 50 %;
  - bấm → cuộn hết sang Đông (→ ẩn, ← hiện), bấm ← về ruộng;
  - ô ruộng ≥ 44 ở 844×390 và 740×360 cuối game;
  - thông báo không che HUD / dòng nhiệm vụ suốt hướng dẫn NV1–NV5 ở 390.
- **Bánh Mì:**
  - desktop + mobile:
    - 3 thông báo liền ⇒ 1;
    - Tạm dừng mở ⇒ 0 thông báo, câu mới vào hàng;
    - đóng ⇒ lần lượt 1 câu;
  - chốt ca:
    - chữ mới, không còn chữ cũ;
    - 0 thông báo nổi;
    - câu hết hàng thành dòng trong bảng;
  - Chuẩn bị đã cuộn: trả lời thao tác là dòng trong chân bảng, thấy được, không che nút chân bảng;
  - dải bước không có "Nướng lại" với phiếu thường, khung ổ trống ≤ 80 px, phiếu "giòn giòn" vẫn có.
- **Cơm Tấm:**
  - bảng Tạm dừng: 0 thông báo, vào hàng, đóng thì lần lượt;
  - 1366: 3 câu ⇒ 1;
  - chốt ca: dòng "Nồi cơm còn…" trong bảng, câu thường vào hàng.
  - Kiểm "không nút nào bị che" bỏ qua nút nằm sau chân bảng dính đáy. Các nút đó cuộn tới là bấm được, giống bảng chốt ca
    Bánh Mì.
- **Trà Sữa:** ô Ẩn tên tiệm ≥ 28, nhãn ≥ 44 × 44.

**Lỗi có sẵn, không do D11:**
- Cơm Tấm `e2e.mjs` "desktop: dĩa đổi lớp sau mỗi bước bày (plate-layers)" chập chờn: trượt cả trên master (chạy bản master
  `fdc6589` tách riêng, cùng máy). Lần chạy cuối thì đạt.
- `e2e` Bánh Mì một lần vỡ ở "mobile: mở game có ô tên tiệm" (`#shopName` null). Đây là chập chờn TLC22-06, xảy ra khi máy đang
  chạy test Cơm Tấm cùng lúc. Chạy lại một mình thì đạt.

## Cần chủ dự án quyết định

**A. Tab cuộn Nông Trại khi cả mép khung là ruộng** (320 / 360 / 740 / 844, đầu bản đồ). Không có chỗ 44 × 44 nào trống. Tab đang
nằm vào khe giữa 2 ô, che tối đa ~48 % mỗi ô, không che tâm ô.
- (1) Giữ như bây giờ.
- (2) Lúc đó ẩn tab (vẫn vuốt ngang được), chỉ hiện khi có chỗ trống.
- (3) Chừa một dải 30 px ngoài bản đồ cho tab. Bản đồ hẹp lại 30–60 px trên điện thoại.

**B. Thông báo trong hàng quá 45 giây thì bỏ** (vd sau bảng chốt ca lâu, không hiện "khách bỏ về" của hôm qua khi đã sang
ngày mới).
- (1) Giữ 45 giây.
- (2) Không bỏ, hiện hết sau khi đóng bảng.
- (3) Bỏ hết hàng khi sang ngày mới, còn lại giữ.

**C. Nông Trại 320: thông báo dưới dòng nhiệm vụ đè mép trên bản đồ vài giây.**
- (1) Giữ.
- (2) Ở màn ≤ 600 px cao, đưa thông báo vào giữa khay hạt và bản đồ.
- (3) Bay thưởng vào ô Xu / Cấp thay cho thông báo chữ.

## Chưa làm

- TLC1-07 phần "ô trang trí (ghế) đè nhãn 'Nâng cấp được' của Nhà" là chồng lấn giữa ô trang trí và nhãn, không do nút cuộn.
  Đợt này không sửa.
- Hiệu năng (TLC1-08, TLC2-10, TLC1-10): để đợt sau theo yêu cầu.
- TLC2-13 phần nút Cơm Tấm dưới mép màn khi ca đông: chân bảng dính đáy của Cơm Tấm (mục 4) cũng áp vào bảng chốt ca, nhưng
  chưa đo riêng lúc ca đông.
