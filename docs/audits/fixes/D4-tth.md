# D4 · Thám Tử Hẻm: Vụ 1 dễ cho trẻ, nhãn chữ thanh trên, xoay ngang 2 cột

Mục audit: TTH-02, TTH-03 (và phần TTH-04 dính tới thanh trên ở 320). Nhánh `claude/d4-tth` (tách từ master 0381de6).
TTH-01 (khung thoại bắt đầu dưới thanh trên, D2) giữ nguyên.

## Cách đo

Chrome headless qua `test/cdp.mjs`, giả lập chạm + `mobile: true`. "Trước" = bản master 0381de6 chạy trên một server riêng,
"sau" = nhánh này; cùng một script đo (ngoài repo).

- **Số chạm Mở vụ 1 → hiện trường**: từ lúc chạm thẻ "Hồ sơ số 1" trên bản đồ tới khi đứng ở hiện trường Bếp chung và khung thoại
  đã đóng (bấm được điểm soi). Đếm mọi chạm: thẻ vụ, từng lần chạm khung thoại, nút "Nhận vụ" trên bài đăng nhóm. 390×844 dpr 3, tốc độ chữ thật.
  - "Đọc kịp": chờ chữ chạy hết mới chạm (1 chạm / dòng).
  - "Chạm vội": chạm mỗi 250 ms, kể cả lúc chữ đang chạy (chạm đầu hiện hết chữ, chạm sau qua dòng), giống trẻ bấm liên tục.
- **Bố cục**: ở hiện trường Vụ 1: cỡ `.scene` (px css), cỡ khung kéo `.scene-wrap`, tràn ngang (`scrollWidth − innerWidth`, cả màn bản đồ),
  vùng chạm nhỏ nhất của điểm soi (khung + `::before`), `elementFromPoint` ở tâm ← Bản đồ / Sổ tay / Bảng / Tèo / Tắt tiếng / Chế độ soi,
  thẻ người đầu tiên có nằm trong khung không.

## Trước → sau

| Mã | Thay đổi | Trước | Sau |
|---|---|---|---|
| TTH-02 | `data/cases/noi-thit-kho.js`: intro 14 → 5 dòng (gộp câu, bỏ ý lặp, bỏ dòng bà Tư báo nhóm Zalo vì câu Tèo báo bài đăng nhóm vẫn chạy sau intro); cách chơi chuyển sang 1 dòng Tèo khi tới Bếp chung (gộp 2 dòng cũ). Cốt truyện, lời giải, thủ phạm, vạch mặt, câu hỏi phụ không đổi | chạm tới hiện trường: **19** (đọc kịp) / **34** (chạm vội) | **9** / **16** |
| TTH-02 | Chế độ soi bật sẵn ở Vụ 1: trường vụ `soiOn: true`, `game.js openCase` đặt `G.ui.soi = !!c.soiOn` (vụ khác như cũ: tắt) | điểm soi vô hình tới khi bấm Chế độ soi | mở vụ là thấy viền + nhãn mọi điểm soi; vẫn tắt được |
| TTH-02 | Bảng suy luận Vụ 1: giữ 4 tờ, mỗi tờ giữ chỗ trống chính, phần còn lại thành chữ sẵn: `moc-gio` {b: 23h30}, `tuan-noi-doi` {b: sa tế}, `ai-noi-doi` {a: ông Sáu}, `thu-pham` {a: Linh, b: sân thượng, c: quay live ăn đêm} (bỏ: 22h30, không xuống bếp, ngủ sớm, 23h52, câu view: nay là chữ in sẵn trong câu). Id chỗ trống + đáp án giữ nguyên | **11** chỗ trống | **6** chỗ trống |
| TTH-02 | Bỏ từ khoá `soi`, `tu-khoa` (loại "Khác") khỏi `words` và bỏ `[[soi]]`, `[[tu-khoa]]` khỏi câu hướng dẫn | chip "Khác" có "soi", "từ khoá"; từ khoá sau intro: 4 | không còn; từ khoá sau intro: 2 (thịt kho trứng, 9h tối) |
| TTH-02 | Nhãn chữ dưới icon: `game.js renderBar` nút Sổ tay / Bảng / Tèo có class `.btn--tool`, chữ `.tl` (thay `.hide-sm`). `index.html` ≤ 1100 px: icon trên, chữ 10 px dưới, nút ≥ 44×44; ≤ 560: lề nút 1 px để vừa thanh 48 px; ≤ 400: kính lúp uy tín 14 px, nút nhạc / loa gọn hơn | dưới 1100 px chỉ còn icon 38 px, `title` không hiện trên cảm ứng | 320 → 1100: icon + "Sổ tay" / "Bảng" / "Tèo", 44×44; ≥ 1101 như cũ (chữ cạnh icon) |
| TTH-03 | `index.html` khối `@media (orientation: landscape) and (max-height: 500px)` (cuối stylesheet, theo docs/mobile-landscape.md): thanh trên 44 px, ẩn chữ tên game khi trong vụ, lề `env(safe-area-inset-*)`; hiện trường thành lưới 2 cột (`.scene-main { display: contents }`): cảnh cao trọn khung bên trái, cột phải = địa điểm, Chế độ soi + đếm vật chứng, Người trong vụ (cuộn riêng), nút Bảng suy luận. `ui/screens.js scene()`: khi khớp media query đó thì cỡ cảnh tính theo chiều cao còn lại (`innerHeight − thanh trên − 6`), bề ngang cho kéo như điện thoại dọc | 844×390: cảnh **320×180**, ~500 px trống bên phải, người trong vụ phải cuộn xuống; 568×320: cảnh **240×135**, nút loa bị đẩy ra ngoài | 844×390: cảnh **480×270**, người trong vụ hiện ngay cột phải; 568×320: cảnh **480×270** (khung 376 px, kéo ngang), loa bấm được |
| TTH-03 | `.hs::before` nở tới 44×44 px (trước 36) | vùng chạm điểm soi nhỏ nhất: 844×390 **36**, 568×320 36, 320×568 40 | **44** ở mọi khung điện thoại (390 / 360: 53) |

Số đo bố cục đầy đủ (hiện trường Vụ 1, Chế độ soi bật):

| Khung | Cảnh trước | Cảnh sau | Khung kéo sau | Tràn ngang (hiện trường / bản đồ) | Vùng chạm điểm soi nhỏ nhất | Thanh trên (← / Sổ tay / Bảng / Tèo / loa) | Thẻ người trong khung |
|---|---|---|---|---|---|---|---|
| 844×390 | 320×180 | **480×270** | 480 | 0 / 0 | 36 → 44 | bấm được | không → **có** |
| 568×320 | 240×135 | **480×270** | 376 | 0 / 0 | 36 → 44 | loa bị che/ngoài → **bấm được** | không → **có** |
| 390×844 | 640×360 | 640×360 | 368 | 0 / 0 | 53 | bấm được | có |
| 360×800 | 640×360 | 640×360 | 338 | 0 / 0 | 53 | bấm được | có |
| 320×568 | 480×270 | 480×270 | 298 | 0 / 0 | 40 → 44 | bấm được (loa phải 316 ≤ 320) | không (cuộn xuống, như cũ) |
| 768×1024 | 720×405 | 720×405 | 746 | 0 / 0 | 60 | bấm được | có |
| 1366×768 | 768×432 | 768×432 | 768 | 0 / 0 | 64 | bấm được | có |
| 1920×1080 | 1440×810 | 1440×810 | 1440 | 0 / 0 | 120 | bấm được | có |

0 lỗi console ở mọi khung, cả trước lẫn sau.

## Bản lưu cũ

`sanitizeRun` đã bỏ id không còn trong file vụ, nên không cần đổi bản lưu (vẫn `v: 1`):
- đang điều tra dở Vụ 1: từ khoá `soi` / `tu-khoa` bị bỏ, ô bảng của chỗ trống đã bỏ bị bỏ, ô còn lại (cùng id, cùng đáp án) giữ nguyên; tiếp tục chơi được tới 3★;
- đã chốt bảng / đang vạch mặt / xong: các ô còn lại đều đúng ⇒ vẫn `solved`, giữ bước vạch mặt;
- đang nghe intro: phát intro mới từ đầu. Các vụ khác không đụng.

Test mới trong `test/engine.test.mjs`: "bản lưu cũ đang dở Vụ 1 …" (dựng bản lưu theo file vụ cũ, đọc lại, giải tiếp bằng `solver.nextAction` ra 3★) và
"Vụ 1 bật sẵn Chế độ soi, bảng ≤ 6 chỗ trống, intro ≤ 6 dòng, không còn chip 'soi' / 'từ khoá'".

## Toàn văn intro Vụ 1 mới (để duyệt giọng văn)

Văn phòng (`intro`, 5 dòng):

1. *(dẫn truyện)* Sáng 28 Tết. Văn phòng thám tử trên lầu tiệm sửa xe, mùi nhớt hoà mùi mai vàng. Tèo dẫn vô một vị khách mặt như vừa mất sổ đỏ.
2. **Cô Hai** (giận): Thám tử ơi, cứu tui! Nồi **thịt kho trứng** tui kho xong lúc **9 giờ tối** qua, để trên bếp chung cho thấm. Sáng ra mất NGUYÊN CÁI NỒI!
3. **Thám tử**: Bình tĩnh cô. Thịt kho bốc hơi là do kho lâu. Còn bốc hơi nguyên cái nồi thì mới đáng điều tra.
4. **Cô Hai** (lo): Nồi đó tui để dành cúng ông bà! Hai chục trứng vịt, ba ký ba rọi! Bếp chung ở tầng trệt xóm trọ ông Sáu, Hẻm 47, trên cùng là sân thượng.
5. **Tèo** (khoái chí): Hai chục trứng... Án ăn uống cấp quận rồi sếp! Vụ đầu năm, sếp cứ đi, em coi phim trinh thám Hàn hết ba mùa rồi!

Sau đó (không đổi, dùng chung mọi vụ): **Tèo**: Sếp ơi, nhóm "Hẻm 47 Hóng Biến" đang nổ bài về vụ này nè! ⇒ điện thoại hiện bài đăng của bà Tư ⇒ nút **Nhận vụ**.

Tới Bếp chung (`locations.kitchen.intro`, 1 dòng, thay 2 dòng cũ):

- **Tèo** (vui): Bếp chung đây sếp, mùi thịt kho còn lảng vảng như hồn ma! Chỗ nào có khung sáng là soi được, bấm vô coi. Chữ đỏ như **thịt kho trứng** là từ khoá, đọc tới là tự vô Sổ tay.

Đã bỏ / gộp so với bản cũ (14 + 2 dòng): Tèo báo "có khách" (gộp vào dòng dẫn truyện); "Không phải cạn! Mất NGUYÊN CÁI NỒI…" + "Nồi đó tui để dành cúng…" (gộp 2+4);
"Cô ở đâu?" / địa chỉ xóm trọ (gộp vào dòng 4); "Đây là án ăn uống cấp quận" + "Sao em rành vậy?" + "phim trinh thám Hàn" (gộp dòng 5);
2 dòng Tèo dạy quy trình + từ khoá (chuyển sang dòng tới Bếp chung); bà Tư báo nhóm Zalo (trùng câu Tèo báo bài đăng); dòng dẫn truyện "hồn ma của nồi thịt" (gộp vào câu Tèo ở bếp).
Các câu hướng dẫn trong lúc chơi (bếp ga, hỏi cô Hai, lời khai Tuấn, bảng suy luận, vạch mặt) giữ nguyên.

## Tag cache đã đổi

- `data/cases/noi-thit-kho.js`: file vụ nạp động bằng `` `./data/cases/${id}.js?v=…` `` trong `game.js` (`loadCase`, `prefetchNextCase`), `check-tags` không thấy chuỗi mẫu này ⇒ tăng tay **t10 → t12** cho mọi file vụ (12 file tải lại một lần).
- `ui/screens.js` t11 → **t12** (`game.js`, `ui/panels.js`, modulepreload `index.html`); kéo theo `ui/panels.js` t11 → **t12** (`game.js`, `ui/screens.js`, modulepreload).
- `game.js` t11 → **t12** (`<script>` + modulepreload `index.html`).
- Giữ: `ui/dialog.js?v=t11`, `../_shared/feedback.js?v=t11`, core t10.
- `test/e2e-bot.mjs`, `test/e2e-season.mjs`: bộ lọc 404 file vụ nhận mọi tag `?v=t<số>` (trước cứng `t10`).
- `node tools/cache-tags/check-tags.mjs master` ⇒ xem mục Kiểm thử.

## Kiểm thử

Server `PORT=8962 node server.js` ở gốc worktree.

- Unit `node --test prototype/games/tham-tu-hem/test/*.test.mjs`: **44/44** (42 cũ + 2 mới TTH-02).
- `tools/check-case.mjs data/cases/noi-thit-kho.js`: **0 lỗi — ĐẠT** (blanks=6, độ khó 1 cần ≥ 4).
- `test/e2e.mjs`: **E2E ĐẠT**. `test/e2e-season.mjs`: **E2E-MÙA-2 ĐẠT** (404 file vụ: 0 dòng).
- `test/e2e-bot.mjs` desktop 1366×768 và `VIEW=mob` 390×844: mỗi bên **25 PASS, 0 FAIL, 12/12 vụ 3★**, 0 lỗi console (hai bản chạy song song, chậm nhưng không chập chờn). Bot không cần sửa cách giải: `solver` đọc chỗ trống từ dữ liệu vụ.
- `_shared/test/sound-press-e2e.mjs`: **246 PASS, 0 FAIL**. `_shared/test/share-e2e.mjs`: **53/53 đạt**.
- `node tools/cache-tags/check-tags.mjs master` ⇒ `OK: 8 file tĩnh đổi, mọi tham chiếu ?v= tới chúng đã đổi tag.`
- Script đo trước/sau (ngoài repo): 0 lỗi console ở 8 khung, cả hai bản.

## Chưa làm / ghi chú

- Ở 844×390, 568×320 màn mở (đặt tên) phải cuộn mới thấy "Mở văn phòng"; bảng phủ Thẩm vấn / Sổ tay / Bảng suy luận khi xoay ngang chưa sửa riêng (ngoài phạm vi TTH-03, vẫn dùng bố cục điện thoại, cuộn được).
- 320×568 dọc: thẻ người trong vụ vẫn nằm dưới cảnh (phải cuộn), như cũ.
- Sổ tay Vụ 1 vẫn nhặt khoảng 25 từ khoá cả vụ (chỉ bỏ 2 từ khoá hướng dẫn); từ khoá không còn chỗ trống (22h30, 23h52, ngủ sớm, không xuống bếp, câu view) vẫn nhặt được và làm lựa chọn nhiễu.
- Chưa thử máy thật / trẻ thật đọc intro mới.
