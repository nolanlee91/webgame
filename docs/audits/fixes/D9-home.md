# D9 (phần A): font trang chủ không giữ LCP, test hết rò ổ đĩa (đợt 2), sửa e2e online Cờ Tỷ Phú, ô tìm gọn + bỏ "Mở phòng nhanh"

Nhánh `claude/d9-home` (từ master `01ed8d1`). Số đo chạy bằng Chrome headless qua `_shared/test/cdp.mjs`
(`tools/perf/home-vitals.mjs`, script chẩn đoán tạm trong thư mục nháp, không commit). Máy đo dùng chung với agent khác ⇒ số thời gian dao động;
trước/sau chạy **xen kẽ** trên hai server cùng lúc (master xuất ra thư mục tạm ở cổng 8961, nhánh này ở 8962) để hai bên chịu cùng tải.

## 1. HOME2-05 phần font: LCP trang chủ không còn chờ font

### Nguyên nhân (đo, không đoán)

390×844 dpr 3, Slow 4G (150 ms, 1,6 Mbps) + CPU 4×, dòng thời gian request của master:

- CSS xong ở ~0,58 s, ảnh hero (39 KB) xong ở ~1,1 s, nhưng **FCP 1,96 s**: lần vẽ đầu đợi font.
- Thủ phạm chính là 2 thẻ `<link rel="preload" as="font">` (Be Vietnam Pro 800 latin + Roboto Slab latin): Chrome giữ lần vẽ đầu tới khi font
  preload về. Bỏ riêng 2 thẻ preload (font vẫn trong `<head>`) ⇒ FCP 1,07–1,38 s ngay.
- Chặn `app.js` (thử giả thuyết "JS giữ lần vẽ") ⇒ FCP vẫn 1,7–2,4 s ⇒ không phải do JS.
- Phần còn lại: 10 file font (~180 KB) độ ưu tiên VeryHigh, lấy băng thông của ảnh hero và gây relayout lúc swap ngay trước khi ảnh kịp vẽ.
- `font-display: swap` đã có sẵn trong `fonts.css`. Không bớt được độ đậm: body không khai `font-weight` (400 ⇒ dùng file 500), nên cả 500/600/700/800
  đều có chữ ngay màn đầu. Bỏ đi thì chữ đổi độ đậm, tức là đổi thiết kế.

### Sửa (`homepage/index.html`, `homepage/styles.css`)

- Bỏ 2 thẻ preload font và `<link rel="stylesheet" fonts.css>` trong `<head>` của trang chủ.
- Script nhỏ trong `<head>` định nghĩa `__lkFonts()` (chèn `fonts.css?v=f1`). Script cuối trang gọi nó **sau khi ảnh hero (phần tử LCP) tải xong**
  (rAF + setTimeout; ảnh lỗi hoặc quá 3 s thì gọi luôn). `<noscript>` vẫn nạp `fonts.css`.
- Lần sau: khi font tải xong (`document.fonts` `loadingdone`) đặt cờ `localStorage["lk.fonts"] = "f1"`. Có cờ thì `<head>` chèn `fonts.css` ngay,
  vì font đã nằm trong cache (`?v=` một năm), nên lần hai hiện đúng font từ đầu. Đổi bản font (f1 ⇒ f2) thì cờ cũ tự hết tác dụng.
- Font dự phòng chỉnh cỡ (`styles.css`): `"LK Body Fallback"` = Arial / Arial Bold, `"LK Title Fallback"` = Times New Roman Bold, mỗi mặt chữ có
  `size-adjust` + `ascent/descent-override`. Số đo bằng fontTools trên chuỗi tiếng Việt của trang:
  - BVP 500 rộng hơn Arial 8,3 % ⇒ 108 %;
  - BVP 600–800 rộng hơn Arial Bold 3,7–4,6 % ⇒ 104 %;
  - Roboto Slab 700–800 (instance biến thiên) rộng hơn Times Bold 7,9–8,2 % ⇒ 108 %;
  - ascent/descent = số của font web chia cho `size-adjust`.

  Chen vào `--font-body` / `--font-title` ngay sau font web. Máy không có Arial (Android) thì `local()` hỏng, rơi về `system-ui` như trước.
  Không dùng Georgia (vỡ dấu chồng).
- Trang khác (`bang-xep-hang`, `quyen-rieng-tu`, game) giữ cách nạp cũ, chỉ đổi tag `styles.css`.

### Kết quả: 390×844 dpr 3, Slow 4G + CPU 4×, `home-vitals.mjs --only 390-slow --runs 3 --dpr 3`, 2 vòng xen kẽ

| | Trước (master) | Sau |
|---|---|---|
| LCP vòng 1 | 2604 / 3256 / 2836 ⇒ trung vị **2836 ms** | 1576 / 1580 / 1148 ⇒ trung vị **1576 ms** |
| LCP vòng 2 | 2364 / 2336 / 1996 ⇒ trung vị **2336 ms** | 1540 / 1560 / 1664 ⇒ trung vị **1560 ms** |
| FCP (trung vị vòng 1 / vòng 2) | 2188 / 2236 ms | 980 / 948 ms |
| CLS | 0 – 0,0001 | 0 – 0,0001 (một lần 0,0047; chạy thêm 4 lần: 0 – 0,0001, shift nhỏ nhất ở `.kicker` khi slide hero đổi) |
| Tổng tải lúc mở / font | 946 KB / 180 KB | 947 KB / 180 KB (font vẫn tải, nhưng sau ảnh hero) |

- Phần tử LCP vẫn là ảnh hero Cờ Cá Ngựa (360w).
- **Lệch bố cục khi đổi font** (đo `getBoundingClientRect` 39 phần tử màn đầu ở 390: chặn woff2 so với có font):
  - master (dự phòng `system-ui` = Segoe UI): 12 phần tử xê dịch, hàng tab lọc lệch tới 29 px;
  - sau: 7 phần tử, nhiều nhất 12 px, chỉ ở hàng tab cuộn ngang dưới màn đầu;
  - chiều cao trang bằng nhau (3183 px). Ảnh chụp hai trạng thái gần như trùng.
- Cái giá: lần đầu vào trang, chữ hiện bằng Arial chỉnh cỡ khoảng 1–3 s rồi đổi sang Be Vietnam Pro. Lần sau thì không đổi.
- LCP sau còn dao động 1,1–1,7 s, do luồng chính: profile CPU cho thấy JS chỉ ~250 ms, còn lại là style/layout/paint/giải mã ảnh ở CPU 4×.
  Đây là việc khác, không thuộc phần font.

## 2. Test hết rò ổ đĩa (đợt 2)

- **Thêm vào `lk-temp.mjs`:** `guardServer(proc)` cho tiến trình con không phải Chrome (vd. `node server.js` do test tự bật). Nó dùng chung vòng
  dọn của `guardChrome`, không có hồ sơ:
  - thoát / lỗi / tín hiệu ⇒ `taskkill /T /F`;
  - test bị giết cứng ⇒ lính gác tắt server.
- **Server con:** `daily-e2e`, `daily-board-e2e`, `google-login-e2e`, `account-supabase-e2e` bọc `spawn(… "server.js" …)` bằng `guardServer`.
  Trước: bị giết cứng thì server con còn giữ cổng (D8 ghi "chưa sửa").
- **Đổi sang `tempProfile` + `guardChrome` (+ `shotDir` cho ảnh mặc định)**, sửa máy móc, không đổi điều test kiểm:
  - `games-server/{ma-soi, ai-la-noi-gian, dat-bom, noi-tu}/test/browser-e2e.mjs` (trước `mkdtemp` `masoi-e2e-*`…; ảnh Ma Sói / Nối Từ online
    trước ghi vào thư mục `screenshots/` chưa theo dõi trong repo).
  - `prototype/games/noi-tu/test/browser/e2e.mjs` (bỏ `rm(prof)` tự làm; `e2e-ket-qua.txt` vẫn ghi vào `screenshots/` như cũ).
  - Cờ online / ảnh chụp: `co-ca-ngua/screenshots/{e2e, hud-shots, online-e2e}.mjs`, `co-caro/screenshots/{e2e, online-e2e}.mjs`,
    `co-tuong/screenshots/e2e.mjs`, `co-vua/screenshots/e2e.mjs`, `co-ty-phu/screenshots/e2e-online.mjs`, `o-an-quan/screenshots/e2e.mjs`.
    Trước, hồ sơ Chrome nằm ở `<thư mục output>/prof` (mặc định `.` = thư mục đang đứng, thường là gốc repo). Cá Ngựa `e2e` / `hud-shots`
    không truyền thư mục thì ghi vào `undefined/prof`.
  - Nông Trại: `test/{e2e, e2e-cards, e2e-m4}.mjs` (trước `<output>/prof`, `prof-<thời gian>`).
- Không còn script nào tự `--user-data-dir` / `mkdtemp` mà không qua `lk-temp` (`grep` lại cả repo).
- Script không tự bật server (cờ, Nông Trại) chỉ cần dọn Chrome. Script của `games-server` và Nối Từ chạy server **trong cùng tiến trình**
  nên chết theo test.

### Kiểm (`leakrun.mjs` trong thư mục nháp)

Cách đo: theo dõi cây tiến trình con của đúng PID test + lính gác của nó + hồ sơ `lk-e2e-*` mà Chrome của nó dùng. Máy có agent khác chạy
song song nên không đếm theo tên chung. 8 giây sau khi test kết thúc thì đếm hồ sơ, Chrome, node còn lại.

| Suite | Chạy thường | Giết cứng (`Stop-Process -Force` đúng PID test) |
|---|---|---|
| `games-server/ma-soi` browser-e2e | Tất cả đạt; còn lại 0 / 0 / 0 | ở giây 20: 0 / 0 / 0 |
| `games-server/ai-la-noi-gian` | Tất cả đạt; 0 hồ sơ của nó | |
| `games-server/dat-bom` | Tất cả đạt; 0 hồ sơ của nó | |
| `games-server/noi-tu` | Tất cả đạt; 0 / 0 / 0 | |
| `noi-tu/test/browser/e2e.mjs` | 80/80; 0 / 0 / 0 | ở giây 15: 0 / 0 / 0 |
| `co-caro/screenshots/e2e.mjs` | 68/68; 0 / 0 / 0 | ở giây 15: 0 / 0 / 0 |
| `co-ty-phu/screenshots/e2e-online.mjs` | 53/53; 0 / 0 / 0 | ở giây 15: 0 / 0 / 0 |
| `co-ca-ngua/screenshots/hud-shots.mjs` | đạt (errors: none); 0 / 0 / 0 | |
| `co-ca-ngua/screenshots/e2e.mjs` | có `play(600)` (tới 10 phút chơi); bị harness cắt ở 420 s, các bước tới đó PASS | lần cắt đó là giết cứng: 0 / 0 / 0 |
| `nong-trai/test/e2e.mjs` | 181/181; 0 / 0 / 0 | ở giây 20: 0 / 0 / 0 |
| `nong-trai/test/e2e-cards.mjs` / `e2e-m4.mjs` | 44/44, ALL PASS; 0 / 0 / 0 | |
| `daily-e2e` (server con) | 40/40; 0 / 0 / 0 (lúc chạy: server + 2 lính gác) | ở giây 15: 0 / 0 / 0, cổng 8964 không còn ai nghe |
| `daily-board-e2e`, `account-supabase-e2e` (server con) | đạt; 0 / 0 / 0 | |
| `google-login-e2e` (server con) | đạt; 0 / 0 / 0 | ở giây 8: 0 / 0 / 0 |
| `co-ca-ngua/online-e2e`, `co-caro/online-e2e`, `co-tuong/e2e`, `co-vua/e2e`, `o-an-quan/e2e` | **trượt sớm, có từ trước** (xem dưới); vẫn 0 / 0 / 0 | |

(0 / 0 / 0 = hồ sơ / Chrome / node còn lại.)

**5 script cờ cũ trượt cả trên master** (chạy bản master nguyên gốc với server master, cùng lỗi). Bộ chọn lệch với UI hiện tại, không phải
do đợt này. Không sửa vì ngoài phạm vi:
- Cá Ngựa online: `.err` không còn (tên tự điền nên không còn báo "Nhập tên");
- Caro online: không thấy `#joinBtn`;
- Cờ Tướng / Cờ Vua: không thấy `#nextBtn`;
- Ô Ăn Quan: không thấy `#createBtn`.

Nên làm lại như Tỷ Phú ở đợt sau.

## 3. `co-ty-phu/screenshots/e2e-online.mjs` chạy lại được

- **Nguyên nhân:** script mở 3 tab (A chủ phòng, B, C) trong **cùng một browser context**, tức là chung `localStorage`. Từ khi Tỷ Phú lưu ghế
  vào `localStorage["<SEAT_KEY>.<MÃ>"]` (mở lại link mời trong 30 phút ⇒ về đúng ghế cũ), B mở `?room=MÃ` thì dùng lại token ghế của A. Máy chủ
  coi đó là A đổi sang tab mới nên đá kết nối của A; A về chế độ chơi với máy (`room = null`) ⇒ `#start` của A bị ẩn ⇒ "không bấm được #start".
- Đây là hành vi đúng (một người, một trình duyệt), **không phải lỗi game**. Người thật ở 3 máy khác nhau không gặp chuyện này.
- **Sửa:** mỗi người chơi một browser context riêng (`Target.createBrowserContext`), giống `co-ca-ngua/online-e2e.mjs`.
- Kiểm tra kệ trang chủ cũ ("Cờ Vua + Cờ Tướng ở kệ Trí tuệ") lỗi thời: trang chủ nay gom mọi game online vào kệ Đối kháng (`DUEL_IDS`) ⇒ sửa
  thành "Cờ Vua + Cờ Tướng ở kệ Đối kháng, không lặp ở kệ Trí tuệ".
- Kết quả: **53/53 PASS** (tạo phòng, link mời, mã, linh vật, bắt đầu, 8 nước bấm thật, chat, rớt mạng nối lại, F5, rời ván, chơi tới hết ván,
  về phòng chờ, ván 2, chơi với máy, kệ trang chủ). Không đổi code game.

## 4. Việc thêm của chủ dự án: ô tìm gọn, bỏ "Mở phòng nhanh"

- **Ô tìm** (`#q`, `index.html`): placeholder "Tìm game, thể loại, số người…" ⇒ **"Tìm game"**.
  - Đã rà: cùng một ô cho cả máy tính và điện thoại; `bang-xep-hang.html` không có ô tìm; không `aria-label` nào lặp câu dài.
  - Giữ nhãn ẩn cho trình đọc màn hình "Tìm game theo tên, thể loại hoặc số người": nó nói đúng việc ô tìm làm được và không hiện ra.
- **Bỏ khối "Mở phòng nhanh"** (trùng lựa chọn game với hero và danh sách bên dưới):
  - HTML `.lobby__quick` / `#quickTitle` / `#quickGrid`;
  - `app.js`: `QUICK_SIZES`, `renderQuick` + `matchMedia` listener, dòng cập nhật `quickTitle`;
  - CSS chết trong `portal.css` / `portal-pixel.css` (`.quick*`, `.lobby__quick`, `.quick__item--skel`);
  - `a.quick__item[href]` trong `press-nav.js`, vẫn import `feedback.js?v=f3`.
  - Máy tính bớt 10 ảnh thumb tải lười ở khung sảnh.
- **Sảnh trống:** trước đây khối Mở phòng nhanh lấp chỗ (lời nhắn bị ẩn khi `is-empty`). Nay có khối `#lobbyEmpty`, `app.js` bật khi không có phòng
  chờ lẫn ván đang chơi: "Chưa có phòng nào đang chờ", một câu gợi ý và nút "+ Tạo phòng mới" (cùng hành vi nút trên thanh: cuộn tới kệ Đối kháng).
  - Máy tính: `margin-block: auto` ⇒ nằm giữa phần còn lại của khung (khung vẫn cao bằng hero).
  - Điện thoại (≤ 720 px): ẩn, khung co theo nội dung như trước.
- Ảnh (`/api/lobby` giả: trống / 2 phòng chờ + 2 game đang diễn ra) ở `%TEMP%/lk-d9-home/lobby/` (thư mục nháp, đã dọn sau khi xem):

  | Khung | Trống | Có phòng |
  |---|---|---|
  | 1366×768 | sảnh 99–569 = hero; khối trống 324–478, giữa vùng dưới thanh mã phòng (236–569) | danh sách phòng 314–555 |
  | 1920×1080 | sảnh 99–570 = hero; khối trống 325–479 | danh sách phòng 314–556 |
  | 1024×768 | khối trống 415–569 trong sảnh 145–641 | phòng 424–627 |
  | 390×844 | khung co còn 134 px (không chỗ trống) | phòng hiện |

  Không tràn ngang ở cả 8 trường hợp.
  - Còn một chỗ trống: khi chỉ có 1–2 phòng, phần dưới danh sách phòng trên máy tính vẫn trống (~170 px ở 1366). Trước đây chỗ này là 5 ô Mở phòng nhanh.
    Chưa lấp; nếu cần có thể cho khung co theo nội dung khi có ít phòng.
- **Test đã sửa:**
  - `home-d5-e2e.mjs` (dòng 58): "sảnh trống có lời nhắn + nút Tạo phòng, không còn `.quick__item` / `#quickTitle` / `#quickGrid`";
  - `touch-scroll-e2e.mjs` (dòng 57): "ô Mở phòng nhanh" ⇒ "slide hero" (`a.slide[href]`, cũng là phần tử `press-nav` xử lý). Trước đây trên điện thoại
    ô này luôn bị bỏ qua vì khối bị ẩn.

## Tag đã đổi

- `homepage/styles.css` d3a ⇒ d9a, `portal.css` perf1 ⇒ d9a, `portal-pixel.css` d7a ⇒ d9a (`index.html`, `bang-xep-hang.html`, `quyen-rieng-tu.html`).
- `homepage/app.js` d8a ⇒ d9a, `press-nav.js` d3b ⇒ d9a (`index.html`, `bang-xep-hang.html`).
- `fonts.css` không đổi (vẫn `?v=f1`).
- `node tools/cache-tags/check-tags.mjs master` ⇒ `OK: 25 file tĩnh đổi, mọi tham chiếu ?v= tới chúng đã đổi tag.`

## Test

| Suite | Kết quả |
|---|---|
| `home-d3-e2e` | 37/37 đạt |
| `home-d5-e2e` | 20/20 đạt (kể cả kiểm sảnh trống mới) |
| `touch-scroll-e2e` | 26 đạt, 0 lỗi |
| `daily-e2e` | 40/40 đạt |
| `sound-press-e2e` | lần 1: 245/246 (FAIL "dua-xe: hết ván ⇒ tiếng máy gain 0", game Đua Xe không đổi trong đợt này). Chạy lại một mình: **246/246**. |
| `co-ty-phu/screenshots/e2e-online.mjs` | 53/53 (trước: dừng ở "không bấm được #start") |
| Suite e2e của mục 2 | xem bảng mục 2 |

Script đo / chẩn đoán (`timeline`, `prof`, `swapdiff`, `lobbyshots`, `leakrun`) chỉ nằm trong thư mục nháp, không commit.

## Chưa làm / ghi chú

- 5 script cờ cũ (Cá Ngựa online, Caro online, Cờ Tướng, Cờ Vua, Ô Ăn Quan) trượt cả trên master vì bộ chọn cũ. Đã gắn `lk-temp`, chưa sửa bộ chọn.
- `co-ca-ngua/screenshots/e2e.mjs` chạy hơn 10 phút (`play(600)`), chưa chạy trọn.
- Font: các trang khác (bảng xếp hạng, game) vẫn preload + nạp font trong `<head>`. Chỉ trang chủ đổi.
- Font dự phòng chỉnh theo Arial. Android không có Arial nên vẫn dùng Roboto (system-ui) không chỉnh cỡ: lúc đổi font có thể xê dịch như trước.
  Chưa đo trên máy thật.
- Sảnh máy tính có 1–2 phòng vẫn còn khoảng trống dưới danh sách (mục 4).
