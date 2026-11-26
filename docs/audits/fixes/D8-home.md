# D8: test hết rò ổ đĩa, ảnh trang chủ ở máy dpr cao, 10 game nhỏ, Đào Vàng, Thám Tử, lặt vặt trang chủ

Nhánh `claude/d8-home` (từ master `d4be7a6`). Nguồn lỗi: `docs/audits/v2/raw/HOME.md`, `QUICK.md`, `TTH.md` (phần Thám Tử).
Số đo dưới đây chạy bằng Chrome headless qua `_shared/test/cdp.mjs` (script đo tạm trong thư mục nháp, không commit).
Máy đo dùng chung, nhiều agent chạy song song ⇒ số thời gian (LCP, FCP) dao động mạnh; số byte thì ổn định.

## 1. Test trình duyệt hết rò ổ đĩa (ưu tiên cao)

- **Nguyên nhân.** Mỗi script e2e tự tạo hồ sơ Chrome (`--user-data-dir`) trong `%TEMP%` với tên riêng (`lk-share-*`, `prof-*`, `masoi-e2e-*`…).
  Chỉ `close()` mới xoá, mà xoá bằng `setTimeout(…, 800)` nên phần lớn script gọi `process.exit` trước khi kịp xoá. Bị giết giữa chừng
  (hết giờ, Ctrl+C) thì vừa còn hồ sơ vừa còn Chrome mồ côi giữ khoá hồ sơ.
- **Sửa** (`prototype/games/_shared/test/lk-temp.mjs`, mới):
  - `tempProfile(name)`: hồ sơ ở `%TEMP%/lk-e2e-<name>-XXXXXX`, ghi sổ để xoá.
  - `guardChrome(proc, prof)`: thoát bình thường, lỗi không bắt, promise bị từ chối, `process.exit`, SIGINT/SIGTERM/SIGHUP/SIGBREAK
    ⇒ `taskkill /T /F` cả cây Chrome rồi xoá hồ sơ (đồng bộ, trong `process.on("exit")`).
  - Bị giết cứng (TerminateProcess, không handler nào chạy): mỗi Chrome có một "lính gác" tách rời (`lk-temp-watchdog.mjs`)
    hỏi PID tiến trình test mỗi giây; tiến trình chết ⇒ tắt cây Chrome, xoá hồ sơ, tự thoát. Đường bình thường thì lính gác thấy
    Chrome tắt + hồ sơ đã xoá ⇒ tự thoát.
  - Lúc khởi động (lần đầu gọi `tempProfile`): quét `lk-e2e-*` và các tiền tố cũ (`lk-share-*`, `masoi-e2e-*`, `noigian-e2e-*`,
    `datbom*`, `noitu-e2e-*`, `noitu-online-*`, `scoped_dir*`; `prof-*` và `e2e4`/`e2e5` chỉ khi bên trong đúng là hồ sơ Chrome)
    cũ hơn 1 giờ. Thư mục bị khoá (Chrome còn mở) thì bỏ qua: đổi tên trước, đổi tên thất bại = đang bị khoá.
  - `shotDir(name)`: ảnh chụp mặc định ở `%TEMP%/lk-e2e-shots-<name>` (dùng lại giữa các lần chạy, không cộng dồn),
    thay cho thư mục `*-shots` rải ở thư mục đang đứng (repo gốc đang có `home-d3-shots/`, `google-login-shots/`…).
- **Áp vào** (sửa máy móc, không đổi điều test kiểm):
  - `_shared/test/cdp.mjs` (`launchChrome(name)`), nên mọi suite dùng nó tự được: home-d3/d5, touch-scroll, google-login, sound-press,
    daily-board, account-supabase, chat-off, share, levelup-share, resume, kick, `tools/perf/home-vitals.mjs`, `tools/og/render-og-images.mjs`,
    và cả `games-server/board-online-e2e.mjs`, `games-server/co-ca-ngua/test/rematch-e2e.mjs` (không phải sửa file của họ).
  - Bản `cdp.mjs` riêng của Tiệm Trà Sữa, Tiệm Bánh Mì, Quán Cơm Tấm, Thám Tử.
  - Script tự bật Chrome: `daily-e2e.mjs`, `homepage/screenshots/check.mjs`, `screenshots/e2e.mjs` của 10 game nhỏ.
  - Ảnh mặc định chuyển sang `shotDir`: các suite `_shared/test`, 10 game nhỏ, 3 e2e Thám Tử.
- **Dọn tay:** `node tools/clean-test-temp.mjs` (`--dry`, `--kill` tắt Chrome test còn treo, `--keep-shots`). Xoá cả thư mục `*-shots`
  chưa theo dõi ở gốc repo / `_shared/test` / `homepage`. Đã ghi vào `AGENTS.md` (mục "Khi chạy test trình duyệt").
- **Chưa sửa (ngoài phạm vi, agent khác đang làm):** script tự `mkdtemp` trong `games-server/*/test/browser-e2e.mjs` (Ma Sói, Ai Là Nội Gián,
  Đặt Bom, Nối Từ online), `prototype/games/noi-tu/test/browser/e2e.mjs`, e2e các game cờ online (`co-*`, `o-an-quan`) và Nông Trại.
  Hồ sơ của chúng vẫn bị lần quét khởi động (>1 giờ) và `tools/clean-test-temp.mjs` dọn. Nên đổi sang `tempProfile`/`guardChrome` ở đợt sau.

- **Kiểm** (không còn thư mục hồ sơ nào trong `%TEMP%` sau mỗi lần; ảnh `lk-e2e-shots-*` thì giữ lại có chủ ý):
  - Thử nhanh: thoát thường, `throw`, promise bị từ chối, `process.exit(3)`, và giết cứng giữa chừng ⇒ 0 hồ sơ, 0 Chrome, 0 lính gác còn lại.
  - Chạy đủ 16 suite e2e (6 trang chủ + Thám Tử + 9 game nhỏ, hai luồng song song): sau cùng 0 thư mục `lk-e2e-*` ngoài thư mục ảnh.
  - Cố ý giết đúng PID tiến trình test giữa chừng (`Stop-Process -Force`, không handler nào kịp chạy), 4 suite khác nhau:
    `tools/perf/home-vitals.mjs` (giây 15), `2048/screenshots/e2e.mjs` (giây 12), `daily-e2e.mjs` (giây 20), `home-d3-e2e.mjs` (giây 10):
    lúc chạy có 1 hồ sơ + 1 Chrome; 6 giây sau khi giết: 0 hồ sơ, 0 tiến trình Chrome, 0 lính gác.
  - Một lần thấy hồ sơ `home-d5` còn sót sau khi suite xong bình thường (tệp bị con của Chrome giữ lâu hơn số lần thử). Đã sửa: lính gác thử xoá
    mỗi giây tới 2 phút thay vì một lần `rmSync`. Xoá tay ngay sau đó thì được (không còn tiến trình nào giữ).

## 2. HOME2-05: ảnh trang chủ ở máy dpr cao

- **Nguyên nhân.** `sizes` khai rộng hơn ô thật (dải Chơi ngay `32vw` trong khi ô thật 25,6vw; lưới `34vw` / thật 29vw; hero `45vw` / thật 42vw)
  và ở dpr 3 thì `sizes × 3 > 360` ⇒ trình duyệt lấy bản 720w cho cả 12 ảnh màn đầu.
- **Thumb có phải ảnh pixel 2× không?** Không: thumb 720×540 là tranh vẽ mịn, WebP lossy (VP8). Chỉ 5 thumb 480×360 lossless (Trà Sữa,
  Bánh Mì, Nông Trại, Ô Ăn Quan, Thám Tử) là pixel lưới 2×; bản nửa của chúng đã là nearest-neighbour đúng từng pixel
  (`tools/thumbs/make-half-thumbs.py`). Không tạo ảnh mới.
- **Sửa** (`homepage/app.js`, `homepage/index.html` phần viết sẵn):
  - `sizes` theo bề rộng ô đo thật ở 320–1920 (cả xoay ngang 568×320 → 844×390): hero, lưới, Chơi ngay, Mở phòng nhanh.
  - Thumb tranh vẽ 720w: thêm dòng `(min-resolution: 2.5dppx)` khai 2/3 bề rộng ⇒ máy dpr 3 chọn bản như máy dpr 2 (360w).
  - Thumb pixel 480w không có dòng đó ⇒ vẫn lấy bản 480 khi ô cần, không phóng to bản 240 (nhoè lưới).
  - Máy tính > 1180 px: hero khai 360px (ô thật 334–352) ⇒ dpr 1 lấy bản 360w.
- **Kết quả ở 390×844 dpr 3** (Slow 4G 1,6 Mbps + CPU 4×, trung vị):

  | | Trước (master) | Sau |
  |---|---|---|
  | LCP, 6 lần xen kẽ | 2320 / 2324 / 2344 / 2432 / 2492 / 2604 ms, trung vị **≈ 2,43 s** | 1424 / 2036 / 2360 / 2596 / 2676 / 2912 ms, trung vị **≈ 2,6 s** |
  | Tổng tải lúc mở | **1650 KB** | **946 KB** |
  | Ảnh | 1401 KB (12 thumb 720w) | 697 KB (9 thumb 360w + 3 thumb pixel 480w) |

  412 dpr 3: LCP 2564–2836 ms ⇒ 1408–2792 ms; 1744 ⇒ 1040 KB. (Audit đo 3,3–4,4 s khi máy chạy 6 auditor cùng lúc.)

  - Phần tử LCP vẫn là ảnh hero Cờ Cá Ngựa, nay bản 360w (39 KB thay vì 119 KB).
  - LCP không giảm rõ: ảnh đã về ở ~1,2–1,8 s nhưng lần vẽ đầu (FCP) chờ font. Thử chặn hết `woff2`: FCP 0,8–0,9 s, LCP 1,2–1,5 s
    (3 lần xen kẽ). Font tự host `font-display: swap` 10 file (~190 KB, độ ưu tiên VeryHigh) tranh băng thông với ảnh và giữ lần vẽ đầu.
    Đây là việc của đợt sau (bớt độ đậm / gộp subset / `preload` ít hơn), không sửa trong D8.
  - Đã thử `defer` cho `games.js` / `app.js` / `community.js`: không cải thiện đo được nên bỏ.

## 3. QUICK2-03: tai thỏ / thanh home ở 9 game nhỏ

- 2048, Sudoku, Đố Vui, Ghép Kẹo, Đua Xe, Xếp Gạch, Nối Thú, Rắn, Bắn Bóng: `body { padding: env(safe-area-inset-*) }`.
  Mọi game đã `* { box-sizing: border-box }` + `html, body { height: 100% }` ⇒ thanh trên, bàn chơi, pad, bàn đạp Đua Xe nằm trong vùng an toàn.
  Máy không tai thỏ: `env() = 0` ⇒ không đổi gì (đo lại 10 khung: bố cục trùng trước).
- Lớp phủ cố định (`.ss-ov`) và hàng nút ghim (`.ss-cta`) trong `_shared/short-screen.css` thêm `env(safe-area-inset-bottom)` ở lề dưới.
- Đố Vui: thanh trên khi xoay ngang trước đã tự cộng `env()`; bỏ để không chừa hai lần.
- **Chưa kiểm trên iPhone thật** (Chrome headless không giả lập tai thỏ).

## 4. QUICK2-06 / QUICK2-07

- **"← Trang chủ"** (9 game nhỏ + Đào Vàng): vùng chạm `::after` từ giữa link lên 22 px, xuống 31 px ⇒ tính từ mép trên màn luôn ≥ 44 px
  dù thanh chỉ cao 26–42 px; link nổi trên lớp phủ menu (`z-index: 40`) để phần thò xuống vẫn bấm được.
  Dò `elementFromPoint` theo cột qua tâm link, y 0–120:

  | Game | 390×844 | 320×568 | 844×390 | 740×360 | 1366×768 |
  |---|---|---|---|---|---|
  | Trước (2048 / Sudoku) | 44 | 44 | 31 | 31 | 44 |
  | Trước (Ghép Kẹo, Xếp Gạch, Nối Thú, Rắn) | 42 | 42 | 38 | 38 | 42 |
  | Trước (Đua Xe / Bắn Bóng) | 38 | 38 | 38 | 38 | 42 |
  | Trước (Đố Vui) | 0 (lớp phủ menu che) | 0 | 26 | 26 | 0 |
  | Sau (cả 10) | 47–53 | 47–53 | 44–47 | 44–47 | 51–53 |

- **Loa 2048** `#muteBtn2` (dọc): 36 ⇒ 44 px ngang.
- **Đố Vui "Kỷ lục" (QUICK2-07):** ô HUD trùng tên lớp `.best` của dòng kỷ lục ở menu (`margin-top: 12px; font-size: 13px`) ⇒ lệch 12 px.
  Thêm `.stat.best { margin-top: 0; font-size: inherit }`. Đo đỉnh nhãn 4 ô: trước `63/63/63/75` (390), sau `63/63/63/63` ở 390, 320, 844×390, 1366.

## 5. Đào Vàng (C+)

- **Bố cục mới** (`dao-vang/index.html`): trang đúng một màn hình, không cuộn. `main` là khung đo (`container-type: size`), khung chơi
  rộng `min(100cqw, (100cqh − HUD − hàng nút) × 1,6, 1000px)`. Xoay ngang thấp (≤ 500 px): khung chơi bên trái cao hết chỗ,
  HUD + 3 nút thành cột bên phải. Menu chứa luôn phần "Cách chơi" + bảng điểm (trước nằm dưới khung, đẩy trang dài);
  xoay ngang thì menu 2 cột. Chừa tai thỏ bằng `env()` (thêm `viewport-fit=cover`).
- **Chữ đọc được** (`dao-vang/game.js`, `?v=d8a`):
  - HUD (Điểm / Mục tiêu / Màn / Thời gian + thanh thời gian 40 ô) thành chữ HTML 12–18 px (`ctx.hudEl`; không truyền thì vẽ trên canvas như cũ).
  - Bảng Qua màn / Hết giờ / Tạm dừng thành thẻ HTML phủ khung chơi, có nút thật ("Sang màn 2", "Chơi lại", "Chơi tiếp", "Khoe kết quả" ≥ 44 px).
    Space / P / chạm vùng tối quanh thẻ vẫn như cũ. Máy cảm ứng bỏ dòng "hoặc nhấn Space".
  - Chữ còn vẽ trên canvas (gợi ý "Chạm màn hình để thả móc", "+500" bay lên) phóng theo cỡ khung ⇒ ≥ 12,5 px CSS.
- **Đo** 14 khung × 4 trạng thái (menu, đang chơi, hết giờ, tạm dừng): 320×568, 360×740, 390×844, 430×932, 768×1024, 1024×768, 1280×800,
  1366×768, 1920×1080, 844×390, 740×360, 568×320, 667×375, 1366×600. Tiêu chí: không cuộn dọc/ngang, mọi nút trong khung và ≥ 44 px,
  không bị che, chữ HTML nhỏ nhất ≥ 12 px. **56/56 đạt.** Trước: 1366×768 trang cao hơn khung 226 px, 844×390 menu +114 / kết quả +305,
  nút Tạm dừng / Âm thanh / Về menu ở y 402–446 (ngoài 390), chữ kết quả ~7 px CSS ở 390.
  - Menu ở 568×320 cuộn bên trong khung menu (bảng điểm ở cột phải); nút "Bắt đầu chơi" luôn thấy.
- **Test e2e Đào Vàng:** sửa bộ chọn cũ `a.card.tile[data-id=dao-vang]` ⇒ `#grid a.card.tile[…]` (ô đầu tiên khớp là ô Chơi ngay ẩn trên máy tính,
  lỗi có từ trước, master cũng trượt); cổng server / CDP lấy từ `PORT` / `CDP_PORT`.

## 6. Thám Tử (tag t13 ⇒ t14: `game.js`, `ui/screens.js`, `ui/panels.js`)

- **TTH2-02:** ở ≤ 560 px "← Bản đồ" và loa 44×44 (trước 24×40 và 34×38 ở 320/390). Bù chỗ ở ≤ 400 bằng khoảng cách nút công cụ 1 px.
  Đo `elementFromPoint` ±40 px quanh tâm ở 320, 390, 400, 430, 480: cả hai 44×44; thanh không tràn (320: loa ở x 274–318).
- **TTH2-05:** điện thoại dọc ≤ 480 px: 4 tab sổ tay thành lưới 2×2. 320: Vật chứng 12–160 · Lời khai 160–308 / Từ khoá · Nhân vật cùng cột,
  thấy trọn (trước: Từ khoá cắt ở 357, Nhân vật 357–476 ngoài màn). Xoay ngang giữ cột dọc cũ.
- **TTH2-03:** băng tựa điện thoại dọc (≤ 480 px CSS) dùng bản 960 dù dpr 3 (`hdCover` trong `screens.js`); ảnh chờ tải `boot-art` đổi
  `sizes="100vw"` ⇒ `(max-width: 480px) 320px, 100vw`. 390×844 dpr 3: ảnh màn tựa **1101 KB ⇒ 259 KB**. Xoay ngang / máy tính vẫn HD.

## 7. Trang chủ P2/P3 (tag `app.js` d5a ⇒ d8a, `nav.css` d7b ⇒ d8a)

- **HOME-10:** đang focus slide hero mà bấm ← / → thì focus chuyển sang slide mới (trước: rơi về `<body>` vì slide cũ thành `inert`).
  Đo: → → ← ⇒ `ma-soi, noi-tu, ma-soi` (trước `BODY, BODY, BODY`).
- **HOME2-08:** tên hồ sơ xuống 2 dòng (`-webkit-line-clamp: 2`) thay vì luôn "…"; ở ≤ 720 px bỏ icon bút để nhường chỗ
  (nút vẫn có nhãn ẩn "sửa tên"). 7 tên mẫu ("Sư Phụ Xó Bếp", "Mèo Mướp Siêu Quậy"…) ở 10 khung 320 → 1366: hết bị cắt, nút vẫn cao 44.
  Chỉ tên 16 chữ "M" liền ở 320 còn cắt.
- **HOME2-11:** nút "Lưu" 40 ⇒ 44 px (`.portal .btn` đè `.me__save`).
- **HOME2-09:** từ đệm (game, tro, choi, cho, be, danh, cac, de) không bắt buộc phải khớp. "tro choi 2 nguoi" 0 ⇒ 8, "game cho be" 0 ⇒ 25.

## Tag đã đổi

- `homepage/app.js` d5a ⇒ d8a, `homepage/nav.css` d7b ⇒ d8a (`index.html`, `bang-xep-hang.html`).
- `games/_shared/short-screen.css` ss2 ⇒ ss3 (8 game nhỏ).
- `dao-vang/game.js` s1f ⇒ d8a.
- Thám Tử `game.js`, `ui/screens.js`, `ui/panels.js` t13 ⇒ t14 (import chéo + `index.html`).
- `press-nav.js` / `feedback.js` không đổi.
- `node tools/cache-tags/check-tags.mjs master` ⇒ `OK: 41 file tĩnh đổi, mọi tham chiếu ?v= tới chúng đã đổi tag.`

## Test

| Suite | Kết quả |
|---|---|
| `home-d3-e2e` | 37/37 đạt |
| `home-d5-e2e` | 20/20 đạt |
| `touch-scroll-e2e` | 22 đạt, 0 lỗi |
| `google-login-e2e` | 34/34 đạt |
| `daily-e2e` | 40/40 đạt |
| `sound-press-e2e` (900 s) | lần 1 245/246 (Đố Vui 390 "nút vô hiệu vẫn lún", chạy song song 9 suite khác); chạy lại một mình **246/246** |
| Thám Tử unit (`node --test` 6 file) | 44/44 |
| Thám Tử `test/e2e.mjs` | 136 đạt, 0 lỗi |
| Unit 10 game nhỏ | Đào Vàng 22, 2048 13, Sudoku 15, Đố Vui 7, Ghép Kẹo 15, Đua Xe 19, Xếp Gạch 18, Nối Thú 13, Rắn 8, Bắn Bóng 18: 0 lỗi |
| e2e 10 game nhỏ | 2048 59, Sudoku 68, Đố Vui 38, Ghép Kẹo 62, Đua Xe 55, Xếp Gạch 46, Nối Thú 32, Bắn Bóng 59: 0 lỗi. Rắn lần 1 trượt ("ăn đủ 5 mồi", rắn đâm tường khi máy tải nặng), chạy lại **39/39**. Đào Vàng lần 1 40/41 ("có ảnh lúc đang kéo vàng lên", phụ thuộc may rủi), chạy lại **41/41** |

e2e game nhỏ giờ nhận `PORT` (và Đào Vàng `CDP_PORT`) từ biến môi trường để chạy trên cổng 8951.

## Chưa làm

- HOME2-05 phần font (xem mục 2); LCP 390 dpr 3 vẫn quanh 2,3–2,6 s trên máy đo đang tải nặng.
- QUICK2-03 chưa kiểm trên iPhone thật.
- Script e2e ngoài phạm vi chưa đổi sang `tempProfile` (mục 1).
- `daily-e2e.mjs`, `google-login-e2e.mjs`, `account-supabase-e2e.mjs`, `daily-board-e2e.mjs` tự bật `server.js` con; bị giết cứng thì server con
  còn chạy (không tốn ổ đĩa, nhưng giữ cổng). Chưa sửa.
