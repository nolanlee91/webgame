# D2 · Game tiệm (Trà Sữa, Bánh Mì, Cơm Tấm) + Thám Tử Hẻm

Mục audit: TLC1-01, TLC2-01, TLC2-02, TLC2-03, TLC2-05, TTH-01. Nhánh `claude/d2-shops` (tách từ master ef5bee2).

## Cách đo

Chrome headless qua `test/cdp.mjs` của từng game, server của nhánh (`PORT=89xx node server.js`), giả lập chạm + `mobile: true`, dpr 2.
"Phải cuộn" = trước khi chạm nút của bước kế (ghim phiếu, các bước ráp / pha, Giao, Thối đúng), `elementFromPoint` ở tâm nút
**không** trả về chính nút (nút nằm ngoài khung hoặc bị thanh Hoàn tác / Giao che) ⇒ người chơi phải tự cuộn. Đếm trên 2–3 đơn
đầu ngày 1 (Trà Sữa thêm tiệm "cuối game": cấp 20, bếp topping 2 ngăn, máy định lượng, kho đầy). Script đo nằm ngoài repo; phần kiểm
tương đương đã đưa vào e2e (`test/e2e-layout.mjs` của 3 game tiệm).

## Từng lỗi: thay đổi + số đo trước → sau

| Mã | Game | Thay đổi | Trước | Sau |
|---|---|---|---|---|
| TLC1-01 | Trà Sữa | `ui/brew.js`: bước / chỗ pha / khách đổi ⇒ `reveal()` cuộn vùng cuộn của quầy pha để dải bước + nút nguyên liệu nằm trọn trên thanh Hoàn tác / Đổ bỏ ly / Giao (cụm quá cao thì ưu tiên nút gợi ý), giữ phiếu + ly ở mép trên nếu vừa. `index.html` (≤760): bếp topping xuống dưới nút (`order`), dải bước + nút ngay dưới phiếu | lần phải cuộn / 3 đơn: 390 ngày 1 **2** (Nắp), cuối game **3** (Lấy ly bị `#undoBtn` che); 360 **3 / 3**; 412 0 / 3; 320 3 / 3; 844×390 3 / 3; 1366 0 / 3 | **0** ở mọi khung, cả ngày 1 lẫn cuối game (390, 360, 412, 320, 768×1024, 844×390, 1366×768) |
| TLC2-01 | Bánh Mì | `ui/bench.js` `reveal(keys)` + `game.js` `revealStep()`: khi bước đổi, cuộn `.app` (điện thoại) / quầy ráp (máy tính) để thấy cùng lúc nhóm đang làm + nhóm kế **mà phiếu thật sự cần** (bỏ nhóm phiếu không có), trừ chiều cao thanh Hoàn tác / Giao; chờ ghim phiếu ⇒ về cảnh + dải phiếu. Không tự cuộn khi đang ráp mà lò chín, khi chờ lò / nướng lại, khi có bảng phủ | mỗi đơn cuộn tay: 390 **2 / 4 / 4**, 360 2 / 4, 412 2 / 3, 320 3 / 4, 844×390 3 / 3, 1366 0 | 390 / 360 / 412 / 320 / 768 / 1366: **0** mỗi đơn (11–12 chạm/đơn, không đổi); 844×390: 2 / 0 (xem "Chưa làm") |
| TLC2-02 | Cơm Tấm | `index.html` + `game.js` (`narrow`): bố cục điện thoại cho ≤ 1024 dọc (cảnh `min(56,25vw, 44svh)`); tầng xoay ngang (`landscape, max-height:500px`, rộng ≥ 640): giữ 2 cột, cột dĩa 300 px, thanh bếp 2 hàng (vỉ 42 px / nút 2 dòng, dư thì vuốt ngang), phiếu 64 px, dĩa + ô bày cạnh nhau, Giao dính đáy, 1 thông báo; 761–1180 cao > 500: thanh bếp cao theo nội dung, nút 2 dòng, ≤ 940 xếp vỉ trên nút; ≤ 380: 6 vỉ co theo bề ngang | 768×1024: +Than / Quạt / Nấu cơm / Rửa chén **bị cột dĩa đè** (thanh bếp 426 px), vỉ 6 bị ô bày đè; 844×390: như trên + Giao ngoài khung; 1024×768: +Than, Quạt bị cảnh đè (nút tràn lên); 360: vỉ thứ 6 lọt mép phải | 768, 844×390, 740×360, 1024×768, 360, 320: mọi nút thanh bếp, 6 vỉ, ô bày, Giao bấm được, không bị che (e2e 5 điểm); cảnh 768: 768×432 (trước 426×240); 844×390 cảnh 459×258 |
| TLC2-03 | Bánh Mì | `index.html`: bố cục xếp dọc của điện thoại áp cho ≤ 1024 dọc (`(max-width:760px), (max-width:1024px) and (orientation:portrait)`, khớp `matchMedia` trong `game.js`); 761–1024 dọc: cảnh `clamp(300px, 40svh, 440px)`, ô nguyên liệu nhiều cột; luật 1 thông báo đi theo | 768×1024: cảnh **312×176**, 3 thông báo, phiếu cao **750 px** (dải phiếu 758) | cảnh **756×410**, 1 thông báo, phiếu 92 px, dải phiếu 100 px |
| TLC2-05 | Bánh Mì | `index.html`: `.app { overflow-x: clip }`, con của `.app` / `.bench` / `.sheet` `min-width: 0`, `.steps` `max-width: 100%`; thanh trên điện thoại: tên game co + "…", nhóm nút `flex: none` (đây là chỗ tràn thật: 3 nút + tên game rộng hơn 360) | trong ca 360: scrollWidth **376** (+16), 320: **376** (+56) | 360 / 320: 0 tràn ở màn chào, mọi tab Chuẩn bị ca, trong ca |
| TTH-01 | Thám Tử Hẻm | `index.html`: `.dlg { inset: var(--barH) 0 0 0 }` (khung thoại bắt đầu dưới thanh trên); `ui/dialog.js` thêm `cancel()`, `game.js leaveCase()` gọi để bấm "Về bản đồ" giữa thoại thì đóng thoại, không chạy tiếp phần sau lời thoại | `elementFromPoint` ở nút Tắt tiếng / ← = `DIV.dlg#dlg` suốt đoạn thoại | 390 / 1366 / 844×390: Tắt tiếng + Về bản đồ bấm được khi đang thoại; bấm Tắt tiếng thoại vẫn mở; bấm Về bản đồ ⇒ màn bản đồ, thoại đóng, 0 lỗi console |

Không tràn ngang (màn mở, 4 game × 11 khung 320×568 … 1920×1080, kể cả 568×320, 844×390, 768×1024): 0 khung tràn.

## Tag cache đã đổi

- Bánh Mì: `ui/bench.js` b6 → **b7** (trong `game.js`), `game.js` b6 → **b7** (`index.html`).
- Cơm Tấm: `game.js` c6 → **c7** (`index.html`).
- Trà Sữa: `ui/brew.js` m38 → **m39** (`game.js`, `ui/screens.js`, `ui/stockout.js`), kéo theo `ui/screens.js`, `ui/stockout.js` → m39 (`game.js`), `game.js` → m39 (`index.html`).
- Thám Tử Hẻm: `ui/dialog.js` t10 → **t11** (`game.js`, `ui/panels.js`, `ui/screens.js`), kéo theo `ui/panels.js`, `ui/screens.js`, `game.js` → t11 (import + `modulepreload` trong `index.html`).
- Bánh Mì thêm: `ui/screens.js` (nhập `bench.js`) b6 → **b7** (cả `game.js`); lần đầu sót, `check-tags` bắt được.
- `node tools/cache-tags/check-tags.mjs master` ⇒ `OK: 13 file tĩnh đổi, mọi tham chiếu ?v= tới chúng đã đổi tag.`

## Kiểm thử

Server `PORT=8957 node server.js` từ gốc worktree.

- Unit: Trà Sữa 179/179, Bánh Mì 117/117, Cơm Tấm 141/141, Thám Tử Hẻm 42/42.
- E2E Trà Sữa `test/e2e.mjs` (gồm bố cục): **158/158 PASS**. Lần chạy đầu bị treo ở phần âm thanh (máy đang chạy song song 3 e2e khác), dừng tay và chạy lại một mình: đạt.
- E2E Bánh Mì `test/e2e.mjs` (desktop + mobile + bố cục): **E2E ĐẠT**. Sau khi sửa tag `screens.js` chạy lại thì 1 FAIL chập chờn
  "trong ca mới tải nhạc giờ cao điểm + phố sáng" (`rush-music-loop.mp3` chưa kịp tải lúc kiểm, máy bận); chạy lại lần nữa: ĐẠT.
- E2E Cơm Tấm (5 lần tách: `DESK_PART=1`, `DESK_PART=2`, `M3_ONLY=1`, `M5_ONLY=1`, `MOBILE_ONLY=1` gồm bố cục): cả 5 **E2E ĐẠT**; `LAYOUT_ONLY=1` riêng: 25/25.
- E2E Thám Tử Hẻm: `e2e.mjs` **E2E ĐẠT**, `e2e-season.mjs` **E2E-MÙA-2 ĐẠT**, `e2e-bot.mjs` **E2E-BOT ĐẠT** (25 PASS; hai lần đầu chạy song song với e2e khác bị `timeout 900` cắt giữa chừng, chạy riêng lại thì đạt).
- `_shared/test/sound-press-e2e.mjs` (`BASE=http://localhost:8957`): **246 PASS, 0 FAIL**.
- 0 lỗi console ở mọi e2e và script đo.

## E2E thêm

- `tiem-banh-mi/test/e2e-layout.mjs` (gọi cuối phần mobile của `e2e.mjs`; `LAYOUT_ONLY=1` chạy riêng, `SKIP_LAYOUT=1` bỏ): 390 / 360 / 412 / 768×1024 / 320 — 2 đơn ngày 1 bằng chạm, **0 lần tự cuộn**, `noOverflowX` ở màn chào + mọi tab Chuẩn bị ca + trong ca, 768: cảnh ≥ 700, phiếu ≤ 140, ≤ 1 thông báo.
- `quan-com-tam/test/e2e-layout.mjs` (gọi trong `MOBILE_ONLY=1`; `LAYOUT_ONLY=1` riêng): 768×1024, 844×390, 740×360, 1024×768, 360, 320 — không tràn, +Than / Quạt / Nấu cơm / Rửa chén / 6 vỉ / ô bày / Giao / Hoàn tác có, trong khung, không bị che (5 điểm). Chạy trên master: FAIL ở 768, 844×390, 1024×768.
- `tiem-tra-sua/test/e2e-layout.mjs` (gọi cuối `e2e.mjs`, hoặc `PORT=… node …/e2e-layout.mjs <thư mục>`): 7 khung × ngày 1 / cuối game, 2 đơn, 0 lần tự cuộn, không tràn.
- `tham-tu-hem/test/e2e.mjs`: đang thoại, Tắt tiếng + Về bản đồ không bị che; bấm Tắt tiếng được, thoại vẫn mở (desktop + mobile).

## Chưa làm / đề xuất

- **TLC2-04 (Bánh Mì 844×390, P2, ngoài phạm vi):** vẫn dùng bố cục máy tính, quầy ráp chỉ ~250 px cao ⇒ đơn đầu còn 2 lần cuộn (bước Phết + Rau dưa cùng lúc không vừa), 3 thông báo đè cảnh. Cần tầng ngang riêng như Cơm Tấm.
- **Gộp Lấy + Rạch ngày 1–3 (Bánh Mì):** là thay đổi gameplay ⇒ không làm. Đề xuất: ngày 1–3 nút "Lấy ổ giòn nhất" tự rạch luôn (bớt 1 chạm/ổ); cần chủ dự án duyệt.
- Không thu cảnh khi ghim phiếu (TLC2-01 gợi ý ~150 px): tự cuộn đã đạt 0 lần cuộn nên giữ cảnh 300 px.
- Cơm Tấm 568×320 (ngang < 640): vẫn bố cục điện thoại cuộn dọc (như trước), nút không mất nhưng phải cuộn.
- Chưa thử máy thật iOS/Android.
