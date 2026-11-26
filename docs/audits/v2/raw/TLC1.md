# REPORT v2 — TLC1 (Nông Trại + Tiệm Trà Sữa)

Kiểm lại ngày 25–26/11/2026 trên bản đóng băng `ab70036` (worktree `audit2`). Cùng cách đo, cùng thang điểm với lần 1 (`docs/audits/raw/TLC1.md`).
Ảnh và script nằm ngoài repo, ở thư mục tạm của phiên (`scratchpad/audit2/TLC1/shots`, ~95 ảnh; log `log-*.txt`, `run-*.txt`).

## 1. Phạm vi đã chạy thật

- **Server:** `PORT=9111 node server.js` từ worktree. Chrome headless qua `_shared/test/cdp.mjs`, giả lập chạm, `mobile:true`. Một lần phiên bị khởi động lại giữa chừng, server được bật lại và chạy tiếp.
- **Nông Trại, hồ sơ mới, 390×844 dpr 3, chạm** (`ntA.mjs`):
  - Mở bảng Cách chơi.
  - Làm theo đúng ô đang sáng (`.qhl`) như một đứa trẻ, không tự cuộn: NV1 Gieo → NV2 Tưới → NV3 Thu hoạch 3 → NV4 Bán → NV5 Giao đơn.
  - Trước mỗi lần chạm đều đo `elementFromPoint` ở tâm của ô đang sáng.
- **Nông Trại cuối game** (`nt3.mjs`, `nt7.mjs`):
  - Dựng trạng thái bằng `apply()` thật: cấp 20, 999.999.999 xu, mọi công trình, 25 ô ruộng, vật nuôi, trang trí.
  - Đã xem: bản đồ Đông/Tây, Kho, Đơn, Nâng cấp, Xưởng, Chợ, Chăn nuôi, Làng, chế độ Xây, thẻ trang trí.
  - Khung: 390, 360, 412, 320×568, 844×390, 740×360, 768×1024, 1366, 1920.
  - Đo thêm: số hàng HUD, phần ruộng nhìn thấy, nút "Phía Đông" che gì, nhãn chế độ Xây bị che, fps 1×/4×, tiếng (`__game.sfx.log`) và kiểu lún.
- **Trà Sữa, hồ sơ mới, 390×844 dpr 3, chạm** (`tts1.mjs`, `tts2.mjs`):
  - Màn chào: gõ tên 70 ký tự → Chuẩn bị ca → Mở quán.
  - Pha theo nút "Phiếu ghi" và đo nút có bị che không **trước** khi cuộn.
  - Trọn ngày 1 (5 khách). Giữa ca tải lại trang rồi "Tiếp tục".
  - Sau ca: Chốt ca → Khoe kết quả → Nhật Ký.
  - Chạy lại trọn ngày 1 ở 360×800, 844×390, 320×568.
- **Trà Sữa cuối game** (`tts3.mjs`):
  - Cấp 20, 999.999.999k, 123 triệu người theo dõi, đủ 14 thiết bị, ngày 40.
  - Đã xem: HUD, cảnh đông khách, Tạm dừng, sự kiện, hệ số cảnh ở 7 khung, fps 1×/4×, heap.
- **Bố cục bằng e2e của repo:** `tiem-tra-sua/test/e2e-layout.mjs` (dpr 2). Đạt 9 khung liền nhau: 390/360/412/320 ngày 1 + cuối game, 768 ngày 1. Tới 768 cuối game thì vỡ do test tìm `#introGo` (chập chờn khi máy bận), chưa chạy lại.
- **Sự kiện khi xoay ngang** (`tts6.mjs`): `forceEvent('V12')` ở 844×390, 740×360, 390. Thêm `pressAudit` ở 390.
- **PERF-01** (`perf.mjs`): đếm byte tải trong 60 s khi đứng yên, tắt cache, 390×844 dpr 3. Ba trường hợp: Trà Sữa hồ sơ mới, Trà Sữa người chơi cũ (đã có save ngày 1), Nông Trại hồ sơ mới.
- **lumkeo.com:** chỉ chạy HEAD tài sản (đã có `Content-Encoding: br`, `Cache-Control: max-age=300`).
- **Lỗi JS:** 0 ở mọi lượt chạy. Lỗi 404 duy nhất là trang `/__blank` mà script dùng để nạp save.

## 2. Hạng

- **Nông Trại: C** (lần 1: B, hạ một bậc).
  - Bố cục điện thoại tốt lên rõ: HUD 1 hàng 50 px, nhiệm vụ 1 dòng 44 px, khay dính đáy, ruộng chiếm 58 % màn 390, xoay ngang 2 cột thấy hết.
  - Nhưng khi làm đúng theo mũi tên, hướng dẫn **bị kẹt hai lần** (TLC12-01, P1):
    - NV1 chỉ bảo gieo 1 hạt. Tới NV3 "Thu hoạch 3", sau khi thu 1 cây thì không còn mũi tên nào, ruộng trống.
    - Mũi tên NV4 trỏ "Bán hết". Tới NV5 "Giao đơn", kho 0 món, cũng không còn mũi tên.
  - Trên điện thoại, dòng gợi ý của nhiệm vụ nay bị gập (thay đổi của D4), nên trẻ chỉ thấy "Thu hoạch 3 nông sản 1/3" mà không biết làm gì. Với trẻ chơi lần đầu, đây là ma sát đáng kể.
- **Tiệm Trà Sữa: B** (lần 1: C, lên một bậc).
  - P1 nút bị che đã sửa: 0 lần phải cuộn ở 390/360/412/844 trong ngày 1 chơi thật, e2e 9/9 khung đạt.
  - HUD 1 hàng có nhãn; khung V5 vuông, bóng cứng; tải ngầm 2,4 MB.
  - Còn P2: chọn lựa sự kiện khi xoay ngang khuất hẳn, fps cuối game ở CPU 4× ~30, sót che nút ở 320 khi có thông báo, cảnh hệ số lẻ.

## 3. Điểm 0–10

| Hạng mục | Lần 1 | Lần 2 | Ghi chú |
|---|---|---|---|
| Visual / V5 | 7 | **8** | TTS hết bo tròn (0 `border-radius`), bóng cứng. NT viền theo `--b` đã ăn. Còn: hệ số cảnh lẻ, `zoom:.62–.8`, khung trang trí NT còn pixel nhiễu, quầng mờ khi rê lên khách. |
| Mobile UX | 6 | **7,5** | TTS 0 lần phải cuộn; NT HUD/khay gọn. Còn: NT 320×568 ruộng 0 % thấy được ở cuối game, HUD 2 hàng khi xu lớn, sự kiện TTS khi ngang, 768 HUD TTS 4 hàng. |
| Game experience | 7,5 | **7** | TTS nhẹ tay hơn. NT hướng dẫn kẹt ở NV3/NV5 nếu làm đúng mũi tên (P1 mới). |
| Navigation / flow | 7 | **7** | Tải lại giữa ca TTS vẫn ra "Ca đang dở dang". NT bảng Cách chơi vẫn mở ở cuối. Cảnh phụ NT chỉ có "← Trang chủ" trên thanh. |
| Animation / interaction | 7 | **7,5** | NT nút `transition translate/scale .07s`, `user-select:none`, `touch-action:manipulation`. TTS `pressAudit` 4/4 lún + 1 lần bấm thật lún. NT lên cấp vẫn chỉ là toast. |
| Performance | 6 | **7** | PERF-01 đạt (2,38 MB / 60 s). TTS cuối game ở CPU 4×: 29–34 fps khi đông khách, chưa tới mục tiêu ≥ 35/45. NT 4×: 36,9 fps. |
| Accessibility | 6 | **6,5** | TTS HUD có nhãn chữ; NT số ở `aria-label`. Link "←" TTS 21×42. Lớp phủ NT che nút tắt tiếng. Ô "Ẩn tên tiệm" 22×22. |
| Ads | n/a | **n/a** | Hai game không có chỗ đặt quảng cáo; thẻ SpeakUp Kids nằm ở trang chủ và đang ẩn. Không chấm. |

## 4. Bảng đối chiếu

Tổng: 16 mã của lần 1 cộng PERF-01 và viền `--b` của Nông Trại.
**ĐÃ SỬA 6 · SỬA MỘT PHẦN 4 · CHƯA SỬA 8 · HỒI QUY 0** (TLC1-16 gồm nhiều mục nhỏ, tính là một phần).

| Mã | Trạng thái | Bằng chứng |
|---|---|---|
| TLC1-01 (P1) TTS nút nguyên liệu bị che | **ĐÃ SỬA** (sót ở 320 → TLC12-05) | Ngày 1 chơi thật, chưa cuộn tay: 390 0/35 bước bị che, 360 0, 844×390 0. Nút Giao đều bấm được. `e2e-layout` PASS 390/360/412/320 ngày 1 + cuối game, 768 ngày 1 ("phải cuộn: 0"). Riêng 320×568 seed 42: 2 lần nút "70%" và "Nhiều đá" bị `#undoBtn` che (`tts-320-13-hint-hidden-1.png`). |
| TLC1-02 NT Cách chơi mở ở cuối | **CHƯA SỬA** | `ovHelp scrollTop 351/1195`, tiêu đề y = −314 (`ntA-390-01-help.png`). `game.js:1298` `ui.helpOk.focus()` vẫn thiếu `preventScroll`. |
| TLC1-03 TTS HUD chỉ icon / 2 hàng | **SỬA MỘT PHẦN** | Cuối game 1 hàng, có nhãn "Tiền / Ngày 40 / Danh tiếng / 5★ / Cấp / sắp hết", "999 tỷ", "123tr" ở 390/360/412/320/844×390/740×360/1366 (cao 31–33 px). **768×1024: 4 hàng, cao 146 px** (`tts-768-25-late-shift.png`). Bong bóng dưới HUD đúng (`tts-390-23-late-crowded.png`). |
| TLC1-04 TTS khung bo tròn | **ĐÃ SỬA** | `grep border-radius index.html` = 0; viền khuyết + bóng cứng ở thẻ, nút, phiếu, sheet (`tts-390-07-brewing.png`, `tts-390-15-summary.png`). Còn sót: `.cust:hover/.active` dùng `drop-shadow(0 0 6–8px)` (`index.html:79–80`), quầng mờ không V5 (P3). |
| TLC1-05 NT HUD + nhiệm vụ chiếm 1/3 màn | **ĐÃ SỬA** (sót ở 320 → TLC12-03) | 390: HUD y 50–100, nhiệm vụ 106–150, bản đồ 156–663, khay dính đáy 637–844, ô sáng NV1 ở tâm y = 441 bấm được. 844×390: không cuộn trang, ruộng + khay cùng thấy. |
| TLC1-06 NT "Phía Đông →" che biển Làng / xe | **CHƯA SỬA** | 390/360 cuối game nút đè xe giao hàng (`nt-390-20-late-top.png`, `nt7-360-late.png`). Chế độ Xây: `under:["bien-lang"]`. 844×390: che `sap-cho`, `xuong`. 1366/1920: che `sap-cho`. |
| TLC1-07 NT nhãn chế độ Xây đè nhau | **SỬA MỘT PHẦN** | Nhãn không còn đè nhau (0 cặp chồng). Nhưng nhãn "Hoàn thành" bị `panBtn` che, "Nâng cấp được" của Nhà bị ô trang trí (ghế) đè (`nt7-390-buildmode.png`, `nt-390-28-late-buildmode2.png`). |
| TLC1-08 TTS fps CPU 4× | **SỬA MỘT PHẦN** | Cuối game đông khách (4 khách chờ), 390 dpr 3, CPU 4×, ba lượt: 29,6 / 28,9 / 33,7 fps, khung xấu 67–183 ms. Ít khách: 39–45 fps. 1×: 55–60. Mục tiêu "cuối ≥ 35, ngày 1 ≥ 45" chưa đạt ở cảnh đông. Máy đo dùng chung với 6 auditor, số dao động mạnh. |
| TLC1-09 TTS sự kiện khi xoay ngang | **CHƯA SỬA** (nặng hơn) | 844×390: sheet 318 px, ảnh minh hoạ chiếm hơn nửa, **0/2 lựa chọn thấy trọn** (lựa chọn 1 y 317–395, mép dưới sheet 374; lựa chọn 2 y 403+). 740×360 tương tự (`tts6-844x390-event-V12.png`). Ở 390 cả 2 lựa chọn đều thấy. |
| TLC1-10 TTS hệ số cảnh lẻ + `zoom` | **CHƯA SỬA** | Thiết bị: 360 = 1,2555, 412 = 1,2646, 320 = 0,7397, 740×360 = 1,6969, 768 = 0,5031. `zoom:.62–.8` có 7 chỗ (`index.html:336–388`), thêm `.chip > .ico { zoom:.62 }`. |
| TLC1-11 NT lên cấp chỉ là toast | **CHƯA SỬA** | `game.js:399/414`: vẫn là toast 4,2 s + hiệu ứng ở ô Cấp. "Đơn đã giao" trên thẻ khoe vẫn lấy `st.delivered`. |
| TLC1-12 NT lớp phủ che nút tắt tiếng | **CHƯA SỬA** | Bảng Cách chơi mở: `#muteBtn free:false`, bị lớp phủ đè. |
| TLC1-13 NT gà gần bằng chuồng | **CHƯA SỬA** | Không có mục sửa nào nhắc tới. Ảnh `nt-390-28` gà ~40 px cạnh chuồng ~70 px. |
| TLC1-14 nền ui-kit có pixel nhiễu | **CHƯA SỬA** | Thẻ "Đồ trang trí" còn các vệt sáng lẻ trên viền và sau tiêu đề (`nt-390-28-late-buildmode2.png`). |
| TLC1-15 NT long task do placePan | **ĐÃ SỬA** | `placePan` không còn trong nhịp 1 s (D1, đã đọc code). Cuối game 4×: 36,9 fps, 1×: 52 fps. |
| TLC1-16 lặt vặt | **SỬA MỘT PHẦN** | Đã sửa: NT "← Trang chủ" cao 44; nút NT `user-select:none`. Chưa sửa: TTS link "←" 21×42, không lún; nút "Nhận tiệm" vẫn y = 989 dưới mép 844; tên tiệm `maxlength 32` cắt ngầm (gõ 70 ký tự còn "Tiệm Trà Sữa Siêu Cấp Vũ Trụ Của"); NV4 vẫn trỏ "Bán hết" (nay gây kẹt, xem TLC12-01). |
| PERF-01 TTS tải ngầm 7 MB | **ĐÃ SỬA** | Hồ sơ mới đứng yên 60 s: **2.378 KB / 74 yêu cầu** (5 s 10 KB → 15 s xong). Lớn nhất: `portraits-hd` 604 KB, `street-background` 504 KB, `shop-scene` 475 KB. Người chơi cũ: 3.917 KB trong 5 s (tải đồ cần cho ca, chấp nhận được). NT hồ sơ mới: 1.427 KB. |
| NT viền `--b` | **ĐÃ SỬA** | Đo computed: `.btn --b=#6d6150`, `#allBtn` viền `rgb(23,82,28)`, `.farm` `rgb(58,39,22)`, `.plot --b=#3f2716`; ảnh thấy viền nâu/xanh đúng màu. |

## 5. Lỗi mới

| ID | Ưu tiên | Ở đâu | Vấn đề | Đề xuất | Đạt khi | Công |
|---|---|---|---|---|---|---|
| **TLC12-01** | **P1** | NT hướng dẫn NV1–NV5, `game.js` `highlight()` (590–620), `data/quests.js:6–10` | Làm đúng mũi tên thì kẹt 2 lần. NV1 chỉ gieo 1 hạt, nên NV3 "Thu hoạch 3" thu xong 1 cây là hết mũi tên, chế độ đang là Tưới, ruộng trống (`ntA-390-10-after-tut.png`). NV4 trỏ "Bán hết" bán cả 3 cà rốt, nên NV5 "Giao đơn" mở Bảng đơn thấy toàn "Còn thiếu hàng" và không còn mũi tên (`ntA-390-q4.png`, 44 vòng không có mục tiêu). Trên điện thoại gợi ý chữ bị gập nên trẻ không biết phải làm gì. | (a) `plot-ready` khi không còn cây chín và cũng không có cây đang lớn ⇒ trỏ Hạt giống / ô trống; khi có cây đang lớn ⇒ hiện "Chờ cây chín… 0:12". (b) NV1 gieo 3 hạt (đúng 3 hạt miễn phí), hoặc NV3 chỉ cần 1. (c) NV4 trỏ nút "Bán" của 1 món, hoặc giữ lại số món mà đơn đầu cần; NV5 thiếu hàng ⇒ trỏ Hạt giống. (d) Khi không có mục tiêu thì tự mở gợi ý. | Bot chỉ chạm vào `.qhl`/`#qClaim`, hồ sơ mới, 390: đi hết NV1→NV6 mà không có vòng nào thiếu ô sáng quá 1 nhịp chờ cây. | S–M |
| TLC12-02 | P2 | TTS sự kiện / drama khi xoay ngang (≤ 500 px cao) | 0/2 lựa chọn thấy trọn. Ảnh minh hoạ ~170 px chiếm hơn nửa sheet 318 px (gộp/thay TLC1-09). | Ở màn thấp: ảnh thành dải 80–96 px hoặc đặt cạnh chữ (2 cột); lựa chọn ghim đáy sheet. | 844×390 và 740×360: mọi lựa chọn `elementFromPoint` = chính nó, không cần cuộn. | S |
| TLC12-03 | P2 | NT 320×568 (và màn thấp dọc) | Cuối game ruộng 0 % thấy được: khay dính đáy y 360 che ruộng y 364+. Ngày 1 thì D4 đã ghi là "phải cuộn lên". HUD 2 hàng + nhiệm vụ + khay ăn hết chiều cao. | ≤ 600 px cao: khay hạt thu thành 1 hàng cuộn ngang, nút điều hướng 1 hàng biểu tượng, hoặc khay dính đáy chỉ hiện hàng hạt. | 320×568: ô ruộng đang sáng ở NV1 bấm được không cuộn; cuối game thấy ≥ 50 % ruộng. | M |
| TLC12-04 | P2 | NT HUD, số xu lớn (360/390/412/844×390/740×360) | 999.999.999 xu làm HUD xuống 2 hàng (cao 100 px, đẩy bản đồ xuống 50 px). TTS đã rút gọn số ("999 tỷ"), NT thì chưa. | `shortNum` giống TTS (1,2 tr / 999 tr), số đủ để ở `title` / `aria-label`. | HUD 1 hàng, cao ≤ 50 px ở 360–412 và ngang, với 999.999.999 xu và kho 270/60. | S |
| TLC12-05 | P2 | TTS 320×568, ngày 1, khi có thông báo hết hàng | 2 lần nút gợi ý (Đường 70 %, Đá nhiều) bị `#undoBtn` che. `reveal()` chạy trước khi thông báo đổi bố cục, hoặc cụm nút cao hơn khoảng trống. e2e (seed 777, không có thông báo) không bắt được. | Chạy lại `reveal()` khi thông báo/HUD đổi cỡ (ResizeObserver trên `.brew`); ở 320 ưu tiên đúng nút gợi ý. | e2e-layout thêm seed 42 / thông báo hết hàng ở 320: 0 lần che. | S |
| TLC12-06 | P2 | TTS 768×1024 cuối game | HUD dùng bố cục máy tính: 4 hàng, cao 146 px, đè lên cảnh 322×181. | Gộp 768 dọc vào khối HUD 1 hàng (`max-width:1024px and (orientation:portrait)`). | 768×1024 cuối game: HUD 1 hàng. | S |
| TLC12-07 | P3 | NT xoay ngang 844×390 / 740×360 | Ô ruộng 42×42 (< 44). | Ruộng 5×5 ⇒ bản đồ rộng hơn một chút, hoặc vùng chạm nở 1 px. | Ô ≥ 44 px. | S |
| TLC12-08 | P3 | TTS Nhật Ký | Ô "Ẩn tên tiệm" 22×22 (nhãn có bấm được nhưng ô nhỏ). | Ô 28 px + nhãn bọc vùng chạm 44 px. | Quét vùng chạm 44: 0. | S |
| TLC12-09 | P3 | NT thông báo "Nhiệm vụ xong" | Thông báo hiện đè lên HUD (che Cấp/Kho) đúng lúc trẻ cần thấy thưởng (`ntA-390-q4.png`). | Đặt thông báo dưới dòng nhiệm vụ hoặc bay thưởng vào ô Xu/Cấp. | Thông báo không che ô HUD. | S |

## 6. Top 3

**Cải thiện lớn nhất**
1. **Trà Sữa pha bằng một tay:** 0 lần phải cuộn ở 390/360/412/844 trong ngày 1 chơi thật, e2e 9/9 khung đạt. P1 cũ đã đóng.
2. **Khung V5 thống nhất cho dòng Tập Làm Chủ:** Trà Sữa hết bo tròn, HUD 1 hàng có nhãn và số gọn ("999 tỷ", "123tr"). Viền `--b` của Nông Trại đã ăn.
3. **Nông Trại trên điện thoại + tải nhẹ:** HUD 50 px, nhiệm vụ 44 px, khay dính đáy, xoay ngang 2 cột. Trà Sữa tải ngầm từ 12,2 MB xuống 2,38 MB.

**Vấn đề lớn nhất còn lại**
1. **TLC12-01 (P1):** hướng dẫn Nông Trại kẹt ở NV3 và NV5 khi làm đúng mũi tên; gợi ý chữ bị gập trên điện thoại.
2. **Màn thấp:** sự kiện Trà Sữa khi xoay ngang không thấy lựa chọn (TLC12-02); Nông Trại 320×568 không thấy ruộng (TLC12-03); HUD 2 hàng khi xu lớn (TLC12-04), HUD Trà Sữa 4 hàng ở 768 (TLC12-06).
3. **Hoàn thiện chưa xong:** fps Trà Sữa cuối game ở 4× ~30 (TLC1-08); hệ số cảnh lẻ + `zoom` (TLC1-10); "Phía Đông →" vẫn che công trình (TLC1-06); Cách chơi Nông Trại mở ở cuối (TLC1-02, sửa 1 dòng).

## Chưa kiểm

- iOS/Android thật.
- `e2e-layout` 768 cuối game / 844×390 / 1366: test vỡ ở bước `#introGo` khi máy bận; ngày 1 844×390 đã đo tay (0 che).
- CLS Nông Trại không đo lại.
- Hội chợ, thử thách cấp 20, kéo-thả trang trí Trà Sữa.
- Bấm Khoe ở Nông Trại.
