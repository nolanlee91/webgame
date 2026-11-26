# REPORT v2 — TLC2 (Tiệm Bánh Mì + Quán Cơm Tấm)

Bản kiểm: worktree `audit2` (ab70036, chỉ đọc). Ảnh, script, JSON ở thư mục tạm ngoài repo (`scratchpad/audit2/TLC2/`, ảnh trong `shots/`). Tên ảnh dưới đây là tên file trong `shots/`.

## 1. Phạm vi đã chạy thật

- Server `PORT=9121 node server.js`, Chrome headless qua `test/cdp.mjs` của từng game. Chạm thật `Input.dispatchTouchEvent`, mobile + touch, dpr 3 (≤ 430 px), dpr 2 (768, ngang).
- **Chơi ngày 1 từ hồ sơ mới, thời gian thật.** Bot chỉ chạm nút đang hiện, theo đúng dải gợi ý của game, như trẻ làm theo hướng dẫn. Trước mỗi chạm kiểm `elementFromPoint` ở tâm nút. Nút bị che hoặc ngoài khung thì tính "phải cuộn tay", rồi mới cuộn.
  - Bánh Mì: 390×844 (3 lượt), 360×800 (trọn ngày, 10 khách), 768×1024, 844×390, 740×360 (mỗi khung 200 s, 7–8 đơn).
  - Cơm Tấm: 390×844 (2 lượt trọn ca tối ngày 1).
- **Quét bố cục giữa ca**, cả 2 game × 9 khung (320×568, 360×800, 390×844, 412×915, 768×1024, 844×390, 740×360, 1366×768, 1920×1080):
  - tràn ngang ở màn chào, mọi tab Chuẩn bị, trong ca;
  - vùng chạm < 44 px;
  - số hàng HUD, vị trí thông báo, cỡ cảnh, hệ số pixel.
- **Cuối game dựng bằng logic của game.**
  - Bánh Mì: cấp 18, `EQUIPMENT_IDS` đủ, ngày 12 (22 món đồ).
  - Cơm Tấm: `__game.setLevel(15)` + `addMoney`.
  - Đo ở 390 và 360.
- **CPU 4×** (`Emulation.setCPUThrottlingRate`): 3 lượt × 6 s, đếm rAF. Có đo 1× làm đối chứng.
- Độ lún nút (`audit-lib pressAudit`), tiếng (SOUND_HOOK).
- Khoe chốt ca, chốt ca bằng `__game.advance`, mở quán khi chưa nhập hàng.
- Chạy `e2e-layout` (LAYOUT_ONLY) của 2 game: **cả hai trượt ở khung thứ 2** vì race xoá localStorage (xem TLC22-06). Kết luận chỉ dựa trên số đo của tôi.
- **Lưu ý máy:** 6 auditor khác chạy song song, CPU rất bận. Số đo "thời gian thật" và fps tuyệt đối bị kéo xuống.
  - Một lượt Bánh Mì 390 bị loại vì bot chậm, khách bỏ về.
  - Đối chứng 1×: 58,5–59,8 fps.

## 2. Hạng

- **Tiệm Bánh Mì: B** (trước C).
  - Đã đạt: 0 lần cuộn tay mỗi đơn ở 360/390/768/844×390, 740×360 còn 1/8 đơn; 8–15 chạm/đơn (trung vị 11); tablet và xoay ngang dùng được; HUD 1 hàng; 0 nút < 44; không tràn ngang.
  - Còn P2: khi game tự cuộn tới quầy ráp thì cảnh, HUD, gợi ý và thông báo trôi khỏi màn; bảng chốt ca kiểu "kế toán"; fps 4× thấp.
- **Quán Cơm Tấm: C** (giữ nguyên).
  - Tablet và xoay ngang đã sửa tốt, vùng chạm đạt.
  - Còn **lỗi cuối ca làm đơ cả game** (TLC22-01, P1, 1/2 lượt thật). Mở quán được khi sườn / cơm / than = 0. Gợi ý ngày 1 vẫn bị cắt "…". Chip vỉ "N · bỏ sườn" vẫn khó hiểu.

## 3. Điểm 0–10

| Hạng mục | Điểm | Ghi chú |
|---|---|---|
| Visual / V5 | 8 | Khung pixel V5 đồng bộ cả hai game: 0 `border-radius` ≠ 0, bóng cứng, viền theo `--b`. Hệ số pixel lẻ vẫn còn (1920: 1,144 / 1,1875; Cơm Tấm 844×390: 1,0172). |
| Mobile UX | 7 | 0 cuộn, 0 tràn, nút ≥ 44. Bánh Mì che mất cảnh khi ráp. Cơm Tấm gợi ý bị cắt, nút Vào quán dưới mép màn. |
| Trải nghiệm game | 7 | Bánh Mì ngày 1 trơn: 10/10 khách, 3,4★ ở 360. Cơm Tấm mở quán rỗng hàng được, nhãn vỉ khó hiểu. |
| Điều hướng / luồng | 6 | Cơm Tấm có thể đơ ở cuối ca, không ra bảng chốt ca. Bánh Mì nút "Ngày tiếp theo" ở y = 820/844. |
| Hoạt ảnh / tương tác | 7 | 21/22 nút trong ca lún (chỉ link về trang chủ không lún). Nút Tạm dừng vẫn im lặng. |
| Hiệu năng | 5 | 4×, máy bận: Bánh Mì ngày 1 14,9 fps, cuối game 13,5 (khung hở tới 1,5 s); Cơm Tấm 22,2 / 34,8. Chưa đạt ≥ 30 với Bánh Mì. |
| Tiếp cận | 6 | Có `focus-visible`, `aria-live`, reduced-motion, phím tắt. Còn: chữ gợi ý bị cắt, ô tên quán tự focus. |
| Quảng cáo | n/a | Thẻ SpeakUp Kids đang ẩn; trong game tiệm không có vị trí quảng cáo (đúng hướng an toàn cho trẻ). Không chấm. |

## 4. Bảng đối chiếu

| ID | Trạng thái | Bằng chứng |
|---|---|---|
| TLC2-01 | **SỬA MỘT PHẦN** | **Cuộn:** 0 lần cuộn tay/đơn ở 360 (10 đơn), 768 (8), 844×390 (7); 740×360 1/8 đơn ("veg" bị `.app` che). Đạt. **Chạm/đơn** (gồm ghim, Thối đúng): 360 `[11,11,9,11,13,8,11,11,15,10]` (trung vị 11, 3/10 đơn ≤ 10); 768 `[11,11,9,11,12,8,11,9]`. Chưa đạt "≤ 10". "Lấy + rạch" gộp đúng ngày 1 (`bm-360.json`). |
| TLC2-02 | **ĐÃ SỬA** | Cơm Tấm 768: cảnh 768×432, +Than / Quạt / Cơm / Dĩa sạch / 6 vỉ / ô bày / Giao đều hiện, không bị che (`scan-quan-com-tam-768x1024-shift.png`). 844×390 và 740×360: đủ nút, 0 tràn, 0 nút < 44. |
| TLC2-03 | **ĐÃ SỬA** | Bánh Mì 768: cảnh 756×410, phiếu 92 px, 1 thông báo. 8 đơn 0 cuộn (`scan-tiem-banh-mi-768x1024-shift.png`, `bm-768.json`). |
| TLC2-04 | **ĐÃ SỬA** | 844×390 và 740×360: HUD 1 hàng 6 ô (đáy 89 px), thông báo ở y = 108 / 101 (dưới HUD), gợi ý 1 dòng ở đáy cảnh (`scan-tiem-banh-mi-844x390-shift.png`). Còn nhỏ: màn chào / Chuẩn bị ngang phải cuộn (TLC22-05). |
| TLC2-05 | **ĐÃ SỬA** | scrollWidth − clientWidth = 0 ở cả 9 khung, mọi tab Chuẩn bị, trong ca, cuối game 360 (`scan-*.json`). |
| TLC2-06 | **CHƯA SỬA (không tái hiện)** | `ui/bench.js:110` không đổi, không có trong fixes. Lượt chơi này chưa gặp lại. |
| TLC2-07 | **CHƯA SỬA** | `quan-com-tam/index.html:335` vẫn `nowrap; text-overflow: ellipsis`. Ảnh `ct-390b-02-shift-start.png`: "…dời sang vùng giữ…". |
| TLC2-08 | **CHƯA SỬA** | `ui/grillbar.js:13` nhãn N/V/Ấ; `.zone > small { display:none }` ở mobile (`index.html:301`). Chip vẫn ghi "N · bỏ sườn". |
| TLC2-09 | **CHƯA SỬA, nặng hơn mô tả cũ** | Tái hiện 1/2 lượt thật ở 390: `TypeError … reading 'groups' at groupById (tables.js:22) ← act (game.js:180) ← frame (game.js:259)`. Lỗi làm đơ cả game, xem TLC22-01. |
| TLC2-10 | **CHƯA SỬA** | 4× (máy bận, 1× = 58,5–59,8). Bánh Mì ngày 1 14,9 fps (13,3–20,1), khung hở 0,8–1,1 s, 12–34 long task/6 s; cuối game 13,5 (8,2–16,6), khung hở 1,5 s. Cơm Tấm ngày 1 22,2 (18,5–23,8, khung 750 ms); cấp 15: 34,8 (24,8–40,3). Bánh Mì chưa được tối ưu như Trà Sữa (`avoidRects` đọc `getBoundingClientRect` mỗi khung, D5 tự ghi nhận). |
| TLC2-11 | **ĐÃ SỬA** | 0 phần tử bấm được < 44 px ở 9 khung × 2 game (màn chào, Chuẩn bị, trong ca). Hàng lò Bánh Mì cuối game cao 44, cách 8 px (`[490,44],[542,44],[594,44]`). |
| TLC2-12 | **SỬA MỘT PHẦN** | Mobile còn 1 thông báo. Nhưng khi mở bảng chốt ca, thông báo vẫn đè thanh trên: Bánh Mì y = 9 ("…bỏ về…"), Cơm Tấm `ct-390-09-end.png`. Bánh Mì 1366 vẫn 3 thông báo xếp giữa cảnh. |
| TLC2-13 | **CHƯA SỬA** | Vẫn "Giá vốn ổ đã bán", "Hao hụt", "Lời vận hành", "Lợi nhuận vận hành". Bánh Mì "Ngày tiếp theo" ở y = 820/844, nút không dính đáy (`position: static`). Cơm Tấm ca đông: các nút dưới mép màn (`ct-390-09-end.png`). |
| TLC2-14 | **CHƯA SỬA** | Bấm "Mở quán" ngay: ca chạy với sườn 0, cơm 0, than 0, không hộp xác nhận (`misc-quan-com-tam-open-empty.png`). Đã có nút "Nhập + ướp đủ cho hôm nay" ở đầu bảng (đỡ phần nào). |
| TLC2-15 | **CHƯA SỬA** | `fmtK` không phân cách (`ui/common.js:18`). Cuối game HUD hiện "99888k" (`ctfps-late.png`). |
| TLC2-16 | **CHƯA SỬA** | Hệ số px thiết bị: Bánh Mì 1920 → 1,1444, 1366@1 → 0,7111; Cơm Tấm 1920 → 1,1875, 844×390 → 1,0172. |
| TLC2-17 | **CHƯA SỬA** | Mở game: `document.activeElement = #shopName`. Nút vào quán ở y = 886 > 844 (phải cuộn). |
| TLC2-18 | **SỬA MỘT PHẦN** | Khung V5 chung đã có (D4). Thanh đầu vẫn khác: Bánh Mì có tên game + HUD trong cảnh; Cơm Tấm có HUD trên thanh đầu, nút "Dừng / ?". |
| TLC2-19 | **SỬA MỘT PHẦN** | Lún: 21/22 nút trong ca lún, 5/5 nút bảng Tạm dừng lún. Tiếng: chạm Tạm dừng → 0 tiếng (`perf-tiem-banh-mi.json`, `sound`). |

**Đếm:** ĐÃ SỬA 5 (02, 03, 04, 05, 11) · SỬA MỘT PHẦN 4 (01, 12, 18, 19) · CHƯA SỬA 10 (06–10, 13–17; 09 nặng hơn) · HỒI QUY 0.

## 5. Lỗi mới

### TLC22-01 · P1 · Cơm Tấm cuối ca có thể đơ cả game, không ra bảng chốt ca (`game.js`)

**Vấn đề:**
- Khi tick vừa thu tiền bàn cuối vừa chốt ca, `act` phát event `paid` sau lúc `state.shift = null` (`core/shift.js:240`).
- Handler `case "paid"` gọi `groupById(state, …)` và ném TypeError (`game.js:180`).
- Lỗi ném ra trong `frame()` **trước** `requestAnimationFrame(frame)` ở cuối hàm (`game.js:~296`), nên vòng lặp chết hẳn.
- Kết quả: đồng hồ đứng ở 23:00, dải gợi ý cũ vẫn hiện, bảng chốt ca không mở. Chạm gì cũng không có phản hồi (bot chạm thêm ~100 s).
- Ảnh `ct-390b-09-end.png`; `ct-390b.json` có `overlayEnd: null` và lỗi trên. Gặp 1/2 lượt thật (audit 1: 1/3).
- Trẻ chỉ thoát được bằng cách tải lại trang.

**Sửa:**
1. `const g = state.shift && groupById(state, e.gid)` (hoặc cho `groupById` trả null khi `!s.shift`).
2. Đặt `requestAnimationFrame(frame)` ở đầu `frame`, hoặc bọc `try/finally`, để một lỗi event không giết vòng lặp.

**Đạt khi:** unit/e2e ép "bàn cuối thu tiền đúng tick chốt ca" 20 lượt → 20/20 hiện bảng chốt ca, 0 lỗi console.

**Công:** S.

### TLC22-02 · P2 · Bánh Mì điện thoại / tablet: tự cuộn tới quầy ráp làm mất cảnh, HUD, gợi ý, thông báo

**Vấn đề:**
- 390 giữa đơn: cảnh ở y = −252, đáy HUD −217, thông báo ở y = −28 (ngoài màn).
- 768: HUD cũng trôi khỏi màn (`scan-tiem-banh-mi-390x844-shift.png`, `…768x1024-shift.png`).
- Trẻ không thấy dải "Bước 1: …", thanh kiên nhẫn của khách trong cảnh, hay lời khách.

**Sửa:** một dải nhỏ dính trên quầy ráp, gồm giờ, tiền, 1 dòng gợi ý và thông báo mới nhất (`position: sticky` dưới thanh đầu). Hoặc thông báo `position: fixed` dưới thanh đầu.

**Đạt khi:** ở mọi bước ráp tại 390 / 768 thấy được dòng gợi ý và thông báo mới, mà vẫn 0 lần cuộn.

**Công:** M.

### TLC22-03 · P2 · Bánh Mì khay thối tiền: nút chính "Thối 0k" là bẫy cho trẻ

**Vấn đề:**
- Nút chính (màu nổi) `Thối Nk` đứng trước nút "Thối đúng".
- Bấm nó khi chưa chọn tờ nào vẫn được nhận, và bị tính lỗi "Thối nhầm tiền".
- Lượt đầu, bot bấm nút đầu tiên của hàng thì cả ca "thối đúng 0, sai 2" (`bm-390-09-end.png`).

**Sửa:**
- Tắt `giveChange` khi tổng = 0.
- Ngày 1–3 đặt "Thối đúng" làm nút chính, đứng đầu.

**Đạt khi:** không thể "thối" 0k; ngày 1 nút nổi bật nhất là "Thối đúng".

**Công:** S.

### TLC22-04 · P2 · Cơm Tấm tự tắt bếp / thiếu hàng mà không cảnh báo (gộp với TLC2-14)

Mở quán rỗng hàng thì ca chạy với than 0: bếp không nhóm, không nướng được, khách bỏ về. Xem TLC2-14. Hộp xác nhận nên liệt kê **cả than**. S.

### TLC22-05 · P3 · Màn chào / Chuẩn bị ca khi xoay ngang phải cuộn

**Vấn đề:**
- 844×390 và 740×360: `#introGo` nằm dưới mép màn.
- `restockToday` bị `.tab` che (`bm-844x390.json` pre: `introGo`, `restockToday(che:tab)`, `openShop`).
- Cơm Tấm dọc 390: nút vào quán ở y = 886.

**Sửa:** chân màn ghim nút chính (như Đặt Bom).

**Công:** S.

### TLC22-06 · P3 · `e2e-layout` của Bánh Mì và Cơm Tấm chập chờn khi máy bận

**Vấn đề:**
- Cả hai trượt ở khung thứ 2 với "không thấy `#introGo`" (`e2e-bm.out`, `e2e-ct.out`).
- Cùng nguyên nhân D4 đã sửa cho `e2e-m5`: xoá localStorage 500 ms sau about:blank, nhưng pagehide của trang cũ ghi lại bản lưu.

**Sửa:** chờ `location.href === "about:blank"` rồi xoá, và thử lại nếu chưa có `#introGo`.

**Công:** S.

### TLC22-07 · P3 · Bánh Mì dải bước ngày 1 vẫn có "Nướng lại"

Ngày 1 ít khi dùng bước này. Khung ổ rỗng "Lấy một ổ từ tủ kính…" cao ~150 px ở 390 đẩy các nút xuống. Nên ẩn "Nướng lại" khi phiếu không cần, và thu khung ổ khi chưa có ổ. S.

## 6. Top 3

**Thắng lớn:**
1. Tablet + xoay ngang hai game dùng được thật. Bánh Mì 768 / 844×390 0 lần cuộn; Cơm Tấm đủ nút bếp ở 768 / 844 / 740.
2. Bánh Mì ngày 1 trên điện thoại 0 lần cuộn tay/đơn (trước 2–4), thối tiền 1 chạm, gộp "Lấy + rạch". 10/10 khách, 3,4★ ở 360.
3. Toàn bộ vùng chạm ≥ 44 px, không tràn ngang ở 9 khung, khung pixel V5 đồng bộ. Khoe chốt ca tạo ảnh 1080×1080, 0 lỗi.

**Vấn đề còn lại lớn nhất:**
1. Cơm Tấm cuối ca đơ cả game (TLC22-01 / TLC2-09).
2. Cơm Tấm ngày 1 với trẻ:
   - mở quán rỗng hàng được (sườn / cơm / than 0);
   - gợi ý bị cắt "…";
   - chip vỉ "N · bỏ sườn";
   - nút vào quán dưới mép màn + tự focus ô tên.
3. Hiệu năng 4× Bánh Mì vẫn ~14–15 fps (khung hở tới 1,5 s), chưa áp cách tối ưu đã làm cho Trà Sữa. Kèm theo: bảng chốt ca kiểu kế toán, thông báo đè khi chốt ca.

## Chưa kiểm

- Máy thật iOS / Android.
- Nghe tiếng thật.
- Cân bằng kinh tế nhiều ngày.
- Bánh Mì ngày 4 tách lại Lấy / Rạch.
- Nghi vấn chưa xác nhận: ở 390 cuối ca (lúc đã đơ), nút "Cơm" của dải lớp bị `.plate-view` che tại tâm nút. Cần kiểm khi game không đơ, với phiếu "thêm cơm" (2 vá).
- Live lumkeo.com chưa đối chiếu.
