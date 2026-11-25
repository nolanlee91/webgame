# D1 — Nền tảng: server nén/cache, font tự host, trang chủ hết nhảy bố cục + nhẹ hơn

Nhánh `claude/d1-platform`. Mục audit: PERF-02, PERF-04, PERF-05, PERF-08, HOME-01, HOME-03, HOME-06.

## Số đo trước / sau (trang chủ `/homepage/`)

Đo bằng `tools/perf/home-vitals.mjs`: Chrome headless, mỗi lần một hồ sơ mới, tắt cache, Slow 4G (150 ms, 1,6 Mbps) + CPU 4×
(cột "nhanh" thì không giới hạn), DPR 1, 3 lần mỗi cỡ. CLS lấy từ PerformanceObserver layout-shift, KB = encodedDataLength.
"Trước" = master `ba9aa37`, "sau" = nhánh này. Cả hai chạy server.js của chính nó.

| Cỡ | CLS trước (3 lần) | CLS sau (3 lần) | LCP trước → sau (trung vị) | FCP trước → sau | KB truyền trước → sau | trong đó font | Request |
|---|---|---|---|---|---|---|---|
| 390×844 chậm | 0,161 / 0,137 / 0,136 | **0 / 0 / 0** | 5 816 → **1 496 ms** | 1 352 → 1 224 | 2 855 → **787** | 252 → 180 | 58 → 38 |
| 412×915 chậm | 0,035 / 0,255 / 0,071 | **0 / 0 / 0,0003** | 5 652 → **1 612 ms** | 1 300 → 1 216 | 2 855 → **787** | 252 → 180 | 58 → 38 |
| 1366×768 chậm | 0,392 / 0,012 / 0,394 | **0,006 / 0,006 / 0,006** | 7 416 → **2 888 ms** | 2 216 → 1 196 | 2 855 → 1 472 | 252 → 180 | 58 → 47 |
| 1366×768 nhanh | 0,015 / 0,015 / 0,030 | **0,0002 / 0,0001 / 0,0001** | 972 → 472 ms | 440 → 472 | 2 753 → 1 362 | 252 → 180 | 54 → 45 |

- 390 lần đầu: 787 KB tính cả font (180 KB, lần sau nằm trong cache 1 năm) ⇒ **607 KB không tính font** (mục tiêu ≤ ~700 KB).
- Thời gian tới `load` ở 390 chậm: ~14,6 s → ~4,3 s.
- Shift trước đây: `#daily`/`#dailyCards`/`#dailyNo` (mobile), `FOOTER` + `#games` khi lưới chưa vẽ (desktop 0,38). Sau: không còn shift ≥ 0,01.
- Không lỗi console, không tràn ngang (320, 360, 390, 412, 600, 720, 721, 768, 1023, 1024, 1180, 1181, 1366, 1440, 1920).

Ảnh chụp (thư mục tạm, không commit): trước `…/scratchpad/before/*.png`, sau `…/scratchpad/after/*.png`, so sánh cả trang
`…/scratchpad/cmp/{before,after}-<rộng>.png`, font bị chặn `…/scratchpad/fontblock/*.png`.

### Bố cục sau khi tải giống hệt bản cũ
`compare.mjs` (so toạ độ 13 phần tử chính + chụp cả trang ở 320–1920): 768/1024/1366/1920 **giống hệt** từng toạ độ;
320/390/412 giống hệt, trừ `.logo` (trên điện thoại thanh logo giờ chính là hộp `.logo`, xem dưới). Khác biệt pixel chỉ nằm trong ảnh
thumbnail (ảnh nửa cỡ được trình duyệt thu nhỏ khác chút) và đồng hồ đếm ngược.

## Thay đổi theo file

### Server (PERF-04)
- `server-static.js` (mới): phục vụ file tĩnh.
  - gzip / brotli theo `Accept-Encoding` (có q=, `br` trước), chỉ html/css/js/mjs/json/svg/txt/xml/md ≥ 256 B; ảnh/âm thanh/font không nén.
  - Bản nén giữ trong RAM (LRU, tối đa 64 MB, khoá = đường dẫn + mtime + cỡ + kiểu nén; nhiều request cùng lúc chỉ nén 1 lần).
    Brotli q11 (file > 512 KB: q9), gzip 9.
  - ETag mạnh `"<cỡ>-<mtime>[-br|-gz]"` + `Last-Modified`; `If-None-Match` (nhận cả ETag của kiểu nén khác, W/) và `If-Modified-Since` ⇒ 304.
  - Cache-Control: HTML `no-cache` (kể cả có ?v=); URL có `?v=` ⇒ `public, max-age=31536000, immutable`; còn lại `public, max-age=300`.
  - `Vary: Accept-Encoding` cho kiểu nén được; `Content-Length` đúng với bản gửi; HEAD trả đủ header không thân.
  - Range: trước đây server bỏ qua Range (luôn 200 đủ byte — `<audio loop>` Ô Ăn Quan vẫn chạy). Giờ có `Accept-Ranges` + 206 /
    416 / If-Range cho file không nén (Safari cần cho `<audio>`).
- `server.js`: `serveFile` gọi `server-static.js`. `/healthz`, `/api/*`, WebSocket upgrade không đổi.
- `server-static.test.mjs` (mới, `npm run test:static`): 8 test, server.js thật cổng ngẫu nhiên.

### Font (PERF-05 / HOME-06)
- `prototype/assets/fonts/`: 10 woff2 (Be Vietnam Pro 500/600/700/800 × vietnamese+latin; Roboto Slab 700–800 biến thiên × 2), tổng 181 KB,
  `fonts.css` (`@font-face`, `font-display: swap`, `unicode-range`, url có `?v=1`), `OFL-BeVietnamPro.txt`,
  `LICENSE-RobotoSlab-Apache-2.0.txt`. **Lưu ý:** Roboto Slab là Apache 2.0 (không phải OFL) — vẫn tự host được, đã kèm license.
- Không thêm độ 400: không trang nào xin 400 (chữ thường đang vẽ bằng 500); thêm 400 sẽ làm chữ mảnh đi.
- Trang chủ preload `be-vietnam-pro-800-latin` + `roboto-slab-700-800-latin`.
- `styles.css`: `--font-title: "Roboto Slab", "Noto Serif", "Times New Roman", Times, serif` (bỏ Georgia);
  `--font-body` thêm `"Noto Sans", Arial`. Kiểm bằng chặn mọi woff2 + Google Fonts: trước "Tâ´t cả game", "Đô´i Kháng" (Georgia trộn
  Times New Roman); sau vẽ toàn Times New Roman, dấu chồng đúng (ảnh `fontblock/after-*`).

### Trang chủ — CLS (PERF-02 / HOME-01)
- `index.html`: slide hero 1 viết sẵn (đúng `slideHTML()` cho HERO_SLIDES[0], ảnh `fetchpriority=high` + srcset ⇒ preload scanner tải
  ngay, khung hero có chiều cao thật); 3 thẻ Thử thách viết sẵn (trạng thái chưa chơi); script nhỏ điền số đề + đếm ngược ngay
  (cùng công thức `_shared/daily.js`); 10 ô "Mở phòng nhanh" giữ chỗ (không ảnh); `.hero`/`.lobby` có `is-loading`;
  bỏ `#mobileSearchSlot`; header thêm `topbar--search`.
- `portal-pixel.css`: ≤ 720 px header `display: contents` ⇒ `.logo` thành thanh dính đầu trang, ô tìm nằm ngay dưới và cuộn theo trang
  (đúng vị trí cũ đến từng px) — có từ lần vẽ đầu, không còn đẩy logo xuống 2 dòng; tab giữ chỗ 48/52 px; sảnh đang tải ở ≤ 1023 px
  trông như lúc "chưa có phòng" (trường hợp phổ biến) để lưới không bị kéo lên.
- `styles.css`: `.hero.is-loading .hero__nav { visibility: hidden }`; `#grid:empty { min-height: 100vh }` (footer không hiện giữa màn);
  nền tạm cho `.tile__art`. `portal.css`: `.hero__dots` min-height 31 px.
- `app.js`: bỏ `placeSearch()`; `renderHero()` giữ slide viết sẵn, chỉ nối slide 2–5 (lệch id ⇒ vẽ lại hết).

### Trang chủ — dung lượng (HOME-03 / PERF-08)
- `assets/thumbs/half/` (25 file, 1 321 KB thay vì 2 682 KB) sinh bằng `tools/thumbs/make-half-thumbs.py`.
  **Phát hiện:** tiền đề "thumb 720×540 lossless trên lưới 2×" chỉ đúng với 6/25 file (Ô Ăn Quan + 5 thumb 480×360 Tập Làm Chủ/Thám Tử,
  WebP lossless). 19 thumb 720 còn lại là WebP **lossy** tranh vẽ mịn (chỉ 1–29 % khối 2×2 đồng màu). Vì vậy script thu đúng ½ bằng
  trung bình khối 2×2 (`reduce(2)`): với ảnh lưới 2× kết quả **trùng từng pixel** với nearest (script tự kiểm); với ảnh không lưới thì
  tránh răng cưa của nearest. Giữ kiểu nén như gốc: lossless → lossless; lossy → lossy q85 (lưu lossless bản ½ của ảnh lossy làm
  file to hơn gốc: 90 → 157 KB). Không phóng to, không tỉ lệ lẻ.
- `games.js`: `tw: 480` cho 5 thumb 480 px. `app.js`: `srcset` (½ + gốc) + `sizes` theo bố cục (ô lưới 34vw/25vw/20vw/200px, hero
  `(max-width:720px) 45vw, 720px` ⇒ desktop giữ bản gốc, phòng 56px, Mở phòng nhanh 130–150px); ảnh lưới + Mở phòng nhanh gắn src bằng
  IntersectionObserver (rootMargin 300 px) thay `loading=lazy` (Chrome tải trước 1 250–2 500 px); slide 2–5 chỉ gắn src khi sắp tới lượt
  (slide hiện tại + slide kế sau `load`); "Mở phòng nhanh" không dựng ở ≤ 720 px (dựng khi màn rộng ra).
- `/api/lobby`: gọi ngay trong `<head>` (`window.__lobbyP`), app.js dùng lại; lỗi ⇒ thử lại 1 lần sau 1 s rồi mới hiện
  "Tạm thời không tải được danh sách phòng" (kiểm bằng Fetch.failRequest: hỏng 1 lần ⇒ vẫn ra danh sách; hỏng 2 lần ⇒ báo lỗi).
- `daily.js`: srcset/sizes giống thẻ viết sẵn.

### Cache tag
`index.html` + `quyen-rieng-tu.html`: `styles.css`, `portal.css`, `portal-pixel.css`, `games.js`, `app.js`, `daily.js` ⇒ `?v=perf1`;
`fonts.css?v=f1`. (`daily.css`, `community.js`, `feedback.js`, `press-nav.js` không đổi nên giữ tag.)

### Công cụ
- `tools/perf/home-vitals.mjs` — đo CLS/LCP/FCP/KB/request (xem đầu file).
- `tools/fonts/use-local-fonts.mjs` — đổi link Google Fonts sang `fonts.css` (xem dưới).
- `tools/thumbs/make-half-thumbs.py` — sinh thumb nửa cỡ (`--check` chỉ kiểm).
- `prototype/homepage/screenshots/check.mjs` — cập nhật cho ô tìm kiểu mới + ảnh lười.

## Cho coordinator: đổi font ở các game

```
node tools/fonts/use-local-fonts.mjs                 # dry-run: in diff, không ghi
node tools/fonts/use-local-fonts.mjs --apply         # ghi mọi trang
node tools/fonts/use-local-fonts.mjs --only games/2048,games/sudoku --apply
node tools/fonts/use-local-fonts.mjs --skip games/tiem-tra-sua --apply
```
Mỗi file: bỏ 2 thẻ preconnect Google, thay `<link … css2?family=…>` bằng `<link rel="stylesheet" href="<tương đối>/assets/fonts/fonts.css?v=f1" />`;
báo nếu trang xin họ/độ đậm không có trong fonts.css (hiện không có trang nào).
Dry-run hiện tại: **28 file sẽ đổi** — 27 trang game (`games/*/index.html` ×25 gồm cả nông-trại, `games/nong-trai/proto/index.html`,
`games/nong-trai/ui/dev-m4.html`) + `homepage/play.html`; 0 cảnh báo. Ví dụ:
```
prototype/games/2048/index.html  →  ../../assets/fonts/fonts.css?v=f1
  26 - <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@500;600;700;800&display=swap&subset=vietnamese" rel="stylesheet" />
  27 + <link rel="stylesheet" href="../../assets/fonts/fonts.css?v=f1" />
```
Còn lại ngoài HTML: `prototype/games/_shared/share.js:179` tự chèn link Google Fonts khi vẽ ảnh khoe kết quả (đổi tay).
`quyen-rieng-tu.html` mục 3 vẫn nhắc Google Fonts — vẫn đúng tới khi các game đổi xong.

## Kiểm thử
- `node --test server-static.test.mjs`: 8/8. `node --test games-server/*.test.mjs`: 40/40. `npm run test:account`: 26/26.
- `daily-e2e.mjs`: 31/31; `share-e2e.mjs`: 53/53; `daily-board-e2e.mjs`: 24/24; `sound-press-e2e.mjs`: 246/246.
- `homepage/screenshots/check.mjs` (tạo 9 phòng công khai thật + 1 phòng riêng): 79 PASS / 5 FAIL — **5 FAIL giống hệt trên master**
  (kiểm cũ lỗi thời: nút vàng/teal, "ba thẻ Sắp ra mắt", góc bo, Tiệm Trà Sữa "Sắp ra mắt", chấm hero 37 px ở 360).
- Kiểm chức năng riêng 27/27: vuốt hero (slide 2 tải ảnh khi tới lượt), tìm "dao vang", tab Đối Kháng, Mở phòng nhanh không dựng ở 390 và
  dựng khi đổi sang 1366, press-nav (lún + giữ ~130 ms rồi chuyển), trang quyền riêng tư dùng font tự host, không tràn 320–1920.
- Đào Vàng: không có e2e trang chủ riêng (chỉ `logic.test.mjs`) — bỏ qua.

## Lưu ý / chưa làm
- `?v=` giờ = cache 1 năm immutable: **sửa file có ?v= mà quên tăng tag ⇒ người chơi giữ bản cũ tới 1 năm** (trước đây 5 phút).
  Các import không có ?v= vẫn 5 phút.
- Có phòng công khai thật trên điện thoại ⇒ danh sách phòng chen vào sau khi `/api/lobby` về (shift nhỏ, không giữ chỗ trước được);
  request đã được đẩy lên `<head>` nên thường về trước lần vẽ đầu.
- Thẻ Thử thách đã chơi xong có thêm dòng hạng/đếm ngược ⇒ thẻ có thể cao thêm 1 dòng khi daily.js vẽ.
- Chưa có CDN (edge Railway ở Chicago), chưa HTTP/2 — ngoài phạm vi.
- Không động vào game, `games-server/**`, Trà Sữa / Thám Tử / Nông Trại.
