# D1 · Hiệu năng 5 game (Trà Sữa, Bánh Mì, Cơm Tấm, Nông Trại, Thám Tử Hẻm)

Mục audit: PERF-01, PERF-03 / TTH-05, PERF-06 / TLC1-15, một phần TLC1-08. Nhánh `claude/d1-games`.

## Cách đo

Chrome headless thật qua `prototype/games/_shared/test/cdp.mjs` (server.js của nhánh, cổng ngẫu nhiên), tắt cache, 390×844 dpr 1
(kèm 1366×768). "4G chậm" = 150 ms, 1,6 Mbps; "CPU 4×" = `Emulation.setCPUThrottlingRate 4`. KB = `encodedDataLength` cộng mọi
request trong cửa sổ đo. FCP / LCP / CLS / long task bằng PerformanceObserver chèn trước script trang. Số trước/sau đo trên server cũ
(chưa nén) để chỉ thấy phần game; máy dùng chung nên số thời gian nhiễu ±20 %.

## Kết quả

| Game | Chỉ số | Trước | Sau |
|---|---|---|---|
| Trà Sữa | Đứng yên 60 s, 390×844 | 12.203 KB / 95 req | **2.507 KB** / 78 req |
| Trà Sữa | Đứng yên 60 s, 1366×768 | — | 3.292 KB / 79 req |
| Trà Sữa | Trong ca, CPU 4×, 390 (cửa sổ 12 s) | 31,7 fps · 35 long task, dài nhất 640 ms, khung hở 650 ms | 33,7 fps · 16 long task, dài nhất 89 ms, khung hở 117 ms |
| Bánh Mì | Đứng yên 60 s, 390 / 1366 | 19.432 KB / 100 req | **3.058 KB** / 84 req (cả hai cỡ) |
| Cơm Tấm | Đứng yên 60 s, 390 / 1366 | 22.598 KB / 111 req | **3.461 KB** / 89 req · 1366: 3.508 KB |
| Thám Tử Hẻm | 4G chậm + CPU 4×, 390 | FCP 7.268 ms · LCP 12.220 ms · 1.987 KB / 34 req | **FCP 928 ms · LCP 3.964 ms** · 766 KB / 32 req · CLS 0,001 |
| Nông Trại | 4G chậm + CPU 4×, 390 (2 lần) | CLS 0,466 / 0,815 | **CLS 0 / 0** |
| Nông Trại | Profile 10 s cấp 20, CPU 4× | `placePan` 55 ms tự thân (đọc bố cục mỗi giây) | không còn chạy trong nhịp 1 giây |

Sau khi gộp master (server nén gzip/br): Thám Tử 4G chậm + 4× FCP 784 ms, LCP 2.732 ms, 492 KB; Trà Sữa đứng yên 60 s 1.880 KB.

Audit đo Thám Tử FCP 18,5 s trên máy khác; ở máy này bản cũ là 7,3 s, bản mới < 1 s (mục tiêu < 4 s).

## Đã sửa

### Trà Sữa (`?v=m38`)
- `game.js`: bỏ `requestIdleCallback(() => later.forEach(load))`. LAZY_SHEETS (biểu cảm HD/thường, chân dung NPC, thời tiết,
  thẻ Nhật Ký, ảnh phố) tải khi màn của nó hiện; tải trước màn kế: `shiftStarted` ⇒ drama + biểu cảm + thời tiết,
  `shiftEnded` ⇒ thẻ Nhật Ký. Người chơi mới (màn chào) chỉ chờ sheet màn đầu; `DEFER_SHEETS` (khách, quầy pha, hiệu ứng,
  nâng cấp, trang trí) tải khi bấm "Nhận tiệm". Người chơi cũ: như trước.
- `render/atlas.js`: `preload()` dùng chung (một lần mỗi url); `icon()` gắn `.ico.loading` (ô giữ cỡ, nền mờ nhấp nháy, tắt
  khi giảm chuyển động) tới khi sheet về; `icon()` dùng frame bản thường thay `-hd` khi `scale·dpr < 1,5` (HD bị rơi điểm,
  bản thường Codex tự thu nét bằng hoặc hơn) — chân dung màn chào 60 KB thay 604 KB trên màn dpr 1. Màn dpr ≥ 1,5 vẫn HD.
- `journal-card.png` → `journal-card.webp` lossless (PIL: RGBA giải mã giống hệt từng byte; 2,18 MB → 1,89 MB). Đổi cả
  `docs/tiem-tra-sua/asset-manifest.json` + bản chép trong game.
- TLC1-08 (một phần): HUD và phiếu khách chỉ ghi DOM khi giá trị đổi; `k()` định dạng tiền có cache.

### Bánh Mì (`?v=b6`), Cơm Tấm (`?v=c6`)
- Cùng khuôn với Trà Sữa: hàng tải nền theo lô không còn chứa LAZY_SHEETS (chân dung / biểu cảm / NPC HD, cận cảnh HD,
  thời tiết, thẻ, ảnh tựa); `shiftStarted` tải trước sheet trong ca (trừ thẻ, ảnh tựa, cảnh tiệm lớn), `shiftEnded` tải thẻ.
  Người chơi mới: lô sprite trong quán bắt đầu khi bấm qua màn chào. `icon()` có `.ico.loading`. Hai game không có bản thường
  cho chân dung nên vẫn dùng HD.

### Thám Tử Hẻm (`?v=t10`)
- `index.html`: `modulepreload` cả cây module (16 file) + `preload` manifest ⇒ hết thác nước import; màn tựa tĩnh
  `#bootShell` (logo, câu dẫn, ảnh tựa băng ngang trên điện thoại với `srcset` 960/1920) hiện trước JS, `game.js` gỡ sau khi
  màn tựa thật sẵn sàng.
- File vụ không nạp lúc mở game. `data/case-meta.js` (sinh bởi `tools/gen-case-meta.mjs`, test trong `validate.test.mjs`
  bắt lệch) cho tên / số / câu dẫn thẻ bản đồ; vụ nạp khi bấm mở (thẻ `aria-busy`), bản đồ hiện thì nạp trước đúng vụ đang dở
  hoặc vụ mới nhất chưa phá. Vụ `done` chưa ghi vẫn được nạp và ghi lúc mở game. Mùa khoá vẫn "pending" (e2e-season).
- `ui/screens.js hdCover`: tranh hiện ≤ 960 px thiết bị dùng `title-art.webp` / `hem-map-2.webp` thay bản 1920 px.
- Mở vụ: chờ tối đa 2,5 s tải nền văn phòng + sheet chân dung người nói trong thoại mở đầu; chân dung vẽ thay nằm dưới lớp thật
  cho tới khi sheet về; ảnh cảnh có nền vẽ thay dưới `<img>` (không khung đen).

### Nông Trại (`?v=m10`)
- CLS: bố cục tĩnh trước khi `mount()` vẽ khác lần vẽ đầu (nhiệm vụ Chị Ba hiện ⇒ bản đồ tụt 75 px, nút khoá ẩn) ⇒
  `body:not(.nt-ready) .wrap { visibility: hidden }` (vẫn giữ chỗ), `mount()` thêm `nt-ready` ngay sau lần vẽ đầu.
  Bảng Cách chơi nhảy do đổi font giữa chừng ⇒ `document.fonts.load` các nét 500/700/800 ngay trong `<head>`.
- `placePan` không chạy trong nhịp 1 giây nữa: chỉ khi chữ ký `cảnh|bề rộng bản đồ|chế độ Xây` đổi, khi cuộn / đổi cỡ cửa sổ,
  hoặc ResizeObserver (khung / bản đồ đổi cỡ); gộp vào một `requestAnimationFrame`.

## Kiểm thử

- Unit: Trà Sữa 179/179, Bánh Mì 117/117, Cơm Tấm 141/141, Nông Trại 175/175, Thám Tử 42/42 (thêm 1 test case-meta).
- E2E (trước khi gộp master): Trà Sữa `e2e.mjs` 144/144; Bánh Mì `e2e.mjs` 113 PASS; Cơm Tấm `e2e.mjs` 175 PASS; Nông Trại
  `e2e-cards.mjs` 44/44; Thám Tử `e2e.mjs` 132 PASS, `e2e-season.mjs` 55 PASS, `e2e-bot.mjs` 12/12 vụ 3★; 0 lỗi console.
- `levelup-share-e2e.mjs` 70/71: ô "nong-trai 390×844: bắt đầu nâng Nhà" chập chờn, bản gốc (chưa sửa) cũng trượt 1/3 lần.
- Chập chờn có sẵn (không do nhánh này): Trà Sữa "sự kiện mưa V15 ⇒ lớp mưa" trượt cả trên bản gốc ở 2 lần đầu, lần sau đạt;
  Cơm Tấm "dĩa đổi lớp" trượt 1 lần, chạy lại đạt.
- Sau gộp master: `e2e-bot.mjs` lại 12/12 vụ 3★, 0 lỗi console. `node tools/cache-tags/check-tags.mjs master`: OK.

## Chưa làm / lưu ý

- TLC1-08 phần lớn: tick logic 5–10 lần/giây + nội suy vị trí khách chưa làm (đụng `apply`/test nhiều). Profile CPU 4×: ~70 %
  thời gian là style/layout của trình duyệt do `scene.update` / `paint` ghi style mỗi khung; nên làm tiếp bằng diff style ở
  `render/scene.js`. Mục tiêu ≥ 45 fps chưa đạt (33,7 fps).
- Trà Sữa 1366×768 đứng yên 3,3 MB (quầy pha HD hiện ngay trên desktop) — mục tiêu < 3 MB là cho điện thoại.
- Chân dung Trà Sữa trên màn dpr 1 giờ là bản thường lưới 2× (thô hơn bản HD bị thu nhỏ một chút, nhưng nét đều); dpr ≥ 1,5 không đổi.
- Font Google vẫn chặn hiện trang ở các game này (PERF-05 thuộc nhánh nền tảng; master đã tự host cho trang chủ).
- `journal-card.webp` Trà Sữa vẫn 1,9 MB (tranh nhiễu, không được đổi pixel) nhưng chỉ tải khi hết ca.
