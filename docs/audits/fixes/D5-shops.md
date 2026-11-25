# D5 · Game tiệm: Bánh Mì xoay ngang, vùng chạm 44 px, gộp Lấy + Rạch, fps Trà Sữa

Mục audit: **TLC2-04** (gộp phần Bánh Mì của **TLC1-03**), **TLC2-11**, phần "ngày 1–3 gộp Lấy + Rạch" của **TLC2-01** (chủ dự án duyệt 25/11/2026), **TLC1-08**.
Nhánh `claude/d5-shops` (tách từ master c05e799). Bản lưu ba game không đổi định dạng.

## 1. Bánh Mì xoay ngang (TLC2-04, TLC1-03 phần Bánh Mì)

Trước: ở 844×390 Bánh Mì dùng bố cục máy tính. HUD 3 hàng, cảnh chỉ còn ~390×180, ba thông báo + dải gợi ý che kín cảnh.

- **HUD 1 hàng** (`ui/screens.js` createHud, khối CSS "HUD 1 hàng" trong `index.html`), cùng kiểu Trà Sữa:
  - ô dựng một lần, mỗi khung chỉ ghi chữ khi đổi (trước: dựng lại cả HUD mỗi phút trong game);
  - số gọn `shortMoney` / `shortCount` (148k · 1,2tr · 12k); ô Tiền có `title` ghi số đủ;
  - số trên, nhãn 9 px dưới; ô co được (`min-width: 0`) nên không bao giờ xuống dòng;
  - dọc 3 ô (giờ · tiền · lẻ, như trước); ngang ≥ 700 px đủ cả 6 ô; ngang hẹp (568×320) 3 ô.
- **Bố cục ngang** (khối `@media (orientation: landscape) and (max-height: 500px)` cuối stylesheet):
  - thanh đầu 48 px; cảnh + dải phiếu bên trái; quầy ráp cột phải `min(380px, 46vw)`, cuộn trong cột;
  - cảnh lấp hết chiều cao còn lại, camera theo vùng (chủ tiệm + đầu hàng) như điện thoại dọc; ổ cận cảnh ×0,5;
  - phiếu, ô nguyên liệu, nút gọn lại; dock ẩn, nút Sổ hiện ở thanh đầu.
  - Khối điện thoại dọc thêm `and (min-height: 501px)` để 568×320 không ăn bố cục dọc. `matchMedia` "mobile" / "short" trong `game.js` khớp.
- **Thông báo dưới HUD** (`top: 44px`, chừa cột viên Lò / Gas bên phải), một thông báo một lúc. Dải gợi ý thu một dòng ở đáy cảnh.
- **Bong bóng gọi món**: đã tránh ô HUD và viên Lò từ trước (`avoidRects`), nay HUD 1 hàng nên bong bóng có chỗ.
- **Không phải tự cuộn**: bài `e2e-layout` thêm 844×390 và 568×320. Để qua, sửa hai chỗ tự cuộn trong `game.js` / `ui/bench.js`:
  - nhóm đang làm (vd Phết) đã đủ theo phiếu thì chỉ cuộn tới nhóm kế; chưa đủ mà hai nhóm không vừa khung thì giữ trọn nhóm đang làm;
  - khay thối tiền: cuộn tới cả hàng nút (khung hẹp xuống 2 dòng); vẫn cuộn khi lò chín giữa lúc thối tiền hoặc đang chạy đi đổi lẻ.

| Khung | Trước | Sau |
|---|---|---|
| 844×390 HUD | 3 hàng, che nửa cảnh | 1 hàng, 6 ô (số cuối game 123tr / 12k) |
| 844×390 cảnh | ~390×180, 3 thông báo đè | ~450×250, 1 thông báo dưới HUD |
| 390×844 HUD | 1 hàng, nhãn cạnh số | 1 hàng, số trên nhãn dưới |
| 844×390, 568×320: 2 đơn bằng chạm thật | (chưa kiểm) | 0 lần tự cuộn |

## 2. Vùng chạm ≥ 44 px (TLC2-11)

Quét mọi `button / a / [role=button] / .gchip` đang hiện ở màn chào, mọi tab Chuẩn bị ca, trong ca, khi ghim phiếu, Tạm dừng; khung 844×390, 390×844, 568×320, 1366×768.
Trước: Bánh Mì 6 loại nút < 44, Cơm Tấm 30+ loại. Sau: **0** ở cả hai game.

- **Bánh Mì:**
  - `.btn.small` 38 lên 44 (cả nút "Rút" 42×38 nay ≥ 44×44);
  - nút thanh trên 40 lên 44, nút về ‹ 44×44;
  - viên Lò trên cảnh (điện thoại) 36 lên 44;
  - tab thớt / tab ổ 30–36 lên 44; nút trong thông báo 30–34 lên 44;
  - **các hàng lò cách nhau 8 px** (`.oven-row + .oven-row`); hàng chảo / bếp than cũng cách 8 px;
  - thanh đầu giữ 52 px (máy tính) / 48 px (điện thoại) bằng cách bớt đệm, nên bố cục không trôi.
- **Cơm Tấm:**
  - thanh trên 40 / 36 / 34 lên 48 / 46 / 46 px, nút thanh trên 32 / 30 lên 44;
  - nút về "←" 15×34 thành 44×44;
  - `.btn.small` 36 lên 44 (nút Nhập, Ướp, Làm, Mua, Thuê, Tắt món…); nút "huỷ" trên phiếu 28 lên 44;
  - nút Đóng bếp lớn 32 lên 44, nút trong thông báo lên 44;
  - xoay ngang: vỉ 42 lên 44, nút thanh bếp 40 lên 44, ô bày 40 lên 44, Hoàn tác / Đổ / Giao 42 lên 44;
  - dọc: nút thanh bếp 40 lên 44.
- Bài e2e "0 cuộn" (Bánh Mì) và bố cục (Cơm Tấm) **không phải đổi kỳ vọng**: vẫn qua sau khi nút to ra.

## 3. Bánh Mì ngày 1–3: gộp "Lấy" + "Rạch" (chủ dự án duyệt)

- `core/board.js`:
  - `mergedSlice(s)`: ngày ≤ `MERGE_SLICE_DAYS` (3);
  - action mới `takeSlice`: lấy bánh như `take` rồi rạch luôn bằng chính `slice()`;
  - từ ngày 4 `takeSlice` chỉ lấy bánh (tách lại).
- **Công bằng:**
  - cùng ổ giòn nhất, cùng bước 2 (`b.step`), cùng hao / kho;
  - dao thường (sự kiện O09, `sliceMs`) vẫn làm chậm đúng 2 giây;
  - chấm điểm không đổi (ổ đúng phiếu vẫn 5 sao). Thời gian ca không tăng: bớt một chạm, không bớt luật.
- **Phiếu "giòn giòn"** mà ổ chưa đủ giòn: chỉ lấy, chưa rạch. Lấy ra khỏi lò than là rạch luôn (`toast` với `slice: true`). Ổ cháy thì không rạch, để đổ.
- **Hoàn tác** không tách đôi "Lấy + rạch" (giống ngay sau khi lấy bánh: muốn làm lại thì Đổ ổ).
- **Giao diện:**
  - nút "Lấy + rạch", nhóm "Lấy bánh + rạch"; nút lò than "Lấy ra + rạch";
  - dải bước ghi "Lấy + rạch" và bỏ ô "Rạch bánh";
  - gợi ý ngày 1 (`HINTS.takeMerged / toastMerged / toastingMerged`) và Cách chơi ("Ngày 1–3: “Lấy + rạch” là một bước") khớp nút.
- **Bản lưu:** không thêm trường. Action `take` / `slice` cũ giữ nguyên (test, bot mô phỏng vẫn chạy).
- **Unit test mới** (`assembly.test.mjs` ×5, `tutorial.test.mjs` ×1):
  - gộp một chạm, Hoàn tác, dao thường;
  - giòn giòn / ổ cháy, ngày 4 tách lại, 5 sao, lời gợi ý.
- **E2E:** kiểm ngày 1 ổ đã rạch ngay sau khi chạm "Lấy + rạch".

## 4. Trà Sữa fps (TLC1-08)

**Cách đo** (giống nhau trước / sau; script ngoài repo):
- Chrome headless, 390×844 dpr 3, chạm, `Emulation.setCPUThrottlingRate` ×4;
- tiệm cuối game (cấp 20, đủ đồ), hàng chờ ≥ 4 khách, đang pha một ly (`?calm=1`);
- đếm khung `requestAnimationFrame` trong 6 giây, cộng `Performance.getMetrics` (thời gian main thread: script / style / layout) và CPU profile;
- 5 lượt, lấy trung vị. "Trước" chạy trên bản gốc (git archive HEAD) ở server riêng.

**Điểm nóng tìm được (CPU profile + metrics):**
1. `hudBottom` (D4 thêm) đọc `offsetTop/offsetHeight` của HUD **giữa lúc đang ghi DOM** cho từng khách. Trình duyệt phải tính style + layout đồng bộ mỗi khung: **18 % thời gian JS**, 2 lần layout / khung.
2. `root.clientWidth` đọc mỗi khung sau khi ghi sprite chủ tiệm: thêm 1 lần tính style ép buộc mỗi khung.
3. Cảnh ghi lại mọi thuộc tính của mọi khách mỗi khung dù không đổi: `textContent` tên, `aria-label`, `dataset`, 5 thuộc tính nền sprite, left/top, opacity, z-index. Dải phiếu ghi lại `textContent` trạng thái mỗi khung. Mỗi lần ghi `textContent` thay nút chữ, làm bẩn style / layout.
4. Thanh kiên nhẫn (cảnh, phiếu, quầy) và thanh nấu đổi bề rộng **mỗi khung**, nên vẽ lại (paint / raster) mỗi khung.

**Sửa** (hình ảnh không đổi):
- `render/scene.js`:
  - đáy HUD nhớ sẵn, `ResizeObserver` báo khi HUD đổi cỡ; bề rộng khung nhớ từ `layout()`;
  - ghi DOM qua `wStyle / wText / wClass / wSprite`, chỉ ghi khi giá trị đổi. Vị trí sprite đặt lại khi camera đổi lưới bắt điểm (`camGen`);
  - chủ tiệm cũng vậy.
- `ui/screens.js` (dải phiếu): `setText` cho trạng thái / số ly.
- `ui/brew.js`: thanh kiên nhẫn phiếu, thanh nấu chỉ ghi khi đổi.
- Thanh làm tròn theo bước dưới 1 px: cảnh 1 % trên thanh 58 px, phiếu 0,5 %, quầy 0,25 %. Thanh đổi vài lần mỗi giây thay vì 60 lần.

| Đo (trung vị 5 lượt) | Trước | Sau |
|---|---|---|
| fps | **15,5** (10,4–22,4) | **28,6** (19,1–40,0) |
| Main thread / khung | 14,6 ms | **6,7 ms** |
| script / style / layout mỗi khung | 3,1 / 4,4 / 3,1 ms | 1,9 / 0,85 / 1,2 ms |
| Lần layout / tính style mỗi khung | 2,06 / 2,15 | 1,02 / 1,03 |
| JS rảnh trong profile | 0,5 % | 53 % |

Ghi chú:
- Máy đo đang chạy song song các agent khác (CPU bận), nên fps tuyệt đối dao động mạnh giữa các lượt và thấp hơn số 34 fps của audit (audit đo ngày 1, máy rảnh).
- Số ổn định để so là **thời gian main thread mỗi khung: giảm 54 %** (14,6 xuống 6,7 ms, CPU ×4). Ngân sách 60 fps là 16,7 ms, 45 fps là 22 ms.
- Phần còn lại chủ yếu là vẽ / ghép lớp của cảnh dpr 3 (không phải JS). Cần đo lại trên máy thật để chốt ≥ 45 fps.

## Tag `?v=` đã tăng

- **Bánh Mì:** mọi import JS b6 / b7 lên **b8**, gồm `game.js` trong `index.html`, test và `tools/sim`. Lý do: `board.js`, `apply.js`, `tutorial.js`, `lines-ops.js` đổi và được nhập khắp nơi, nên một tag chung tránh nạp hai bản. `data/asset-manifest.json?v=b6` giữ nguyên vì manifest không đổi.
- **Trà Sữa:**
  - `render/scene.js` m40 lên **m41**; `ui/screens.js` m40 lên **m41**;
  - `ui/brew.js` m39 lên **m41**, trong game.js, screens.js, stockout.js;
  - `ui/stockout.js` m39 lên **m41**, vì đổi dòng import brew;
  - `game.js` m40 lên **m41**, trong index.html.
- **Cơm Tấm:** chỉ sửa `index.html` (không cache theo tag), nên không cần tăng tag.

## Kiểm thử

- Unit (`node --test`):
  - Bánh Mì 122/122 (6 bài mới về bước gộp), cộng `tools/sim/sim.test.mjs` 4/4;
  - Trà Sữa 179/179; Cơm Tấm 141/141.
- E2E (Chrome headless, server riêng cổng 8951 / 8953):
  - **Bánh Mì 144/144**, gồm `e2e-layout` 7 khung (thêm 844×390, 568×320): 2 đơn bằng chạm thật, 0 lần tự cuộn, HUD 1 hàng, thông báo dưới HUD.
    - Ba lần chạy đầu ở khung ngang trượt "phải cuộn" (Phết bơ, Đủ rau dưa, Thối đúng); đã sửa logic tự cuộn (mục 1).
  - **Cơm Tấm 199/199** (bố cục 768×1024, 844×390, 740×360, 1024×768, 360, 320 vẫn qua với nút 44 px).
  - **Trà Sữa 157/158**, 2 lần. Bài trượt: "M5: sự kiện mưa (V15) ⇒ lớp mưa phủ cảnh".
    - Chạy cùng bài e2e trên **bản gốc HEAD** (chưa sửa) cũng trượt đúng bài này (157/158), nên không do D5.
    - Kiểm riêng (mở ca, ép V15) thì lớp mưa hiện đúng ở cả bản gốc lẫn bản sửa. Nghi do thời điểm khi máy bận; chưa sửa vì ngoài phạm vi.
- Quét vùng chạm < 44 px (màn chào, mọi tab Chuẩn bị ca, trong ca, ghim phiếu, Tạm dừng × 844×390, 390×844, 568×320, 1366×768): Bánh Mì 0, Cơm Tấm 0.
- `node tools/cache-tags/check-tags.mjs master`: **OK: 49 file tĩnh đổi, mọi tham chiếu ?v= tới chúng đã đổi tag.**
- Ảnh trước / sau ở thư mục tạm ngoài repo, không commit.

## Còn lại / cần chủ dự án

- fps Trà Sữa: đã giảm hơn nửa thời gian main thread, nhưng chưa xác nhận được ≥ 45 fps trên điện thoại tầm trung thật (máy đo đang bận). Nên đo lại trên máy thật.
- Trà Sữa e2e "lớp mưa V15" trượt cả trên bản gốc ở máy này: nên xem lại bài test (chờ lớp mưa thay vì đọc ngay khi bảng sự kiện hiện).
- Bánh Mì xoay ngang: quầy ráp vẫn cuộn trong cột (game tự cuộn tới bước kế, người chơi không phải cuộn). Muốn không cuộn hẳn thì phải bỏ bớt ổ cận cảnh ở màn thấp. Cần chủ dự án chọn.
- Bánh Mì `avoidRects` (bong bóng tránh HUD) vẫn đọc `getBoundingClientRect` mỗi khung, tương tự lỗi `hudBottom` của Trà Sữa. Chưa đo fps Bánh Mì vì ngoài phạm vi TLC1-08.
