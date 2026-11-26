# D7: trang chủ, 5 game nhỏ xoay ngang, Tỷ Phú online hẹp và dung lượng Tỷ Phú

Nhánh `claude/d7-home` (từ master `1c31075`). Nguồn lỗi: `docs/audits/v2/AUDIT_SUMMARY.md`, `raw/HOME.md`, `raw/QUICK.md`, `raw/BOARD.md`.
Mọi số đo dưới đây chạy bằng Chrome headless qua `_shared/test/cdp.mjs` (script đo tạm, không commit).

## 1. HOME2-01 (P1): thanh điều hướng máy tính bị ô tìm đè

- **Nguyên nhân.** Cột điều hướng `minmax(0, 1fr)` nhỏ hơn nội dung (511 px), nav tràn sang ô tìm.
- **Sửa** (`homepage/nav.css`):
  - Lưới `auto auto minmax(160px, 1fr) auto`: cột điều hướng rộng đúng nội dung. Ô tìm co 160–300 px, nằm sát ô hồ sơ.
  - Từ 1181 đến 1440 px, mục cuối dùng nhãn ngắn "Xếp hạng" (có sẵn trong DOM, `:has()`). Trình duyệt cũ không có `:has()` thì giữ nhãn dài, vẫn không đè.
  - Bố cục 721–1180 px (2 hàng) giữ ô tìm rộng tới 420 px như cũ.
- **Kiểm.** Đo 1024 → 1920 px, bước 20, thêm 1181: **47/47 đạt**. Tiêu chí: `mainnav.scrollWidth ≤ clientWidth`, mép phải mục cuối < mép trái ô tìm, không cuộn ngang.
  - 1181: nav kết thúc ở x 665, ô tìm bắt đầu ở x 680.
  - 1920: nav kết thúc ở x 1047, ô tìm bắt đầu ở x 1062.
  - Trước khi sửa: 37/47 đè.

## 2. HOME2-02 (P1, một phần): trang quyền riêng tư

- **Dòng phông chữ.** Bỏ "Google Fonts". Giờ trang ghi: phông chữ nằm trên máy chủ Lụm Kèo; jsDelivr chỉ dùng để tải thư viện đăng nhập, và chỉ khi người chơi bấm Google.
- **Khi chưa có email** (`contactEmail: ""`):
  - Mục 5 ghi "Kênh liên hệ: sắp cập nhật."
  - Thêm câu: trong lúc chờ, người chơi vẫn tự đổi tên được, và kết quả chỉ gắn với tên hiển thị và mã ẩn danh.
  - Hai dòng "gửi yêu cầu" giờ trỏ tới "kênh liên hệ bên dưới". Site chưa có form góp ý, nên trang không nhắc tới form nào.
- **Khi điền email.** Điền `COMMUNITY.contactEmail` trong `community.js` là email tự hiện thành link `mailto:`, và câu "trong lúc chờ" tự ẩn. Nhóm Facebook và Zalo cũng tự hiện nếu có link.
  - Script dựng link bằng DOM (`textContent`), không dùng `innerHTML`.
  - Đã kiểm 3 trường hợp: rỗng → "sắp cập nhật"; `" lienhe@lumkeo.com "` → link mailto; `"a<b>@x.y"` → bị loại.
- **Hướng dẫn bật Google.** `docs/account/GOOGLE-LOGIN-SETUP.md` thêm điều kiện bắt buộc trước khi bật Google: phải có email công khai, nhớ đổi `?v=` của `community.js`.
- **Còn chờ chủ dự án:** địa chỉ email. `community.js` chưa đổi, nên chưa phải đổi tag.

## 3. HOME2-03, HOME2-04, Lighthouse

- **Ô tìm.** `@media (pointer: coarse)` đặt 16 px. Đo được 16 px ở 844×390, 740×360 và 768×1024 (trước: 14). Máy tính dùng chuột giữ 14 px.
- **`scroll-margin-top`** cho `#games`, `#lobby` và `.shelf`, bằng chiều cao thanh dính + 8 px:

  | Bề rộng | Thanh dính | scroll-margin-top |
  |---|---|---|
  | > 1180 | 71 | 79 |
  | 721–1180 (2 hàng) | 117 | 125 |
  | ≤ 720 | 57 | 65 |
  | Xoay ngang thấp (thanh không dính) | 0 | 8 |

  Khoảng cách từ tiêu đề mục tới mép dưới thanh dính: 8–22 px ở mọi cỡ đã đo (390, 320, 844×390, 740×360, 768, 1024, 1100, 1366, 1920). Trước khi sửa: −47 tới −117 px.
- **Skip link.** `#games` và `#lobby` có `tabindex="-1"`. Tab rồi Enter thì `activeElement` là `games` (trước: `BODY`). Không hiện viền focus, vì tiêu đề nằm ngay đó.
- **target-size.** Nhãn "★ Thử thách" có `min-height: 24px`: hộp thật 98×24 (trước 98×20 ở máy tính, 86×17 ở điện thoại). Vùng chạm ảo 44 px vẫn giữ.
- **heading-order.** Hero thêm `<h2 class="sr-only">Game nổi bật</h2>`. Thứ tự giờ là h1 → h2 → h3…, trước đó h1 nhảy thẳng xuống h3 (tên slide).

## 4. QUICK2-01 / QUICK2-02: 5 game nhỏ khi xoay ngang

- **Cách làm.** Giống Rắn, Xếp Gạch và Bắn Bóng: nạp `_shared/short-screen.css`, lớp phủ có `ss-ov`, hàng nút có `ss-cta`, `--ss-bar-h: 31px`. Áp cho 2048, Sudoku, Đố Vui, Ghép Kẹo và Nối Thú.
- **Màn dọc không đổi.** Thêm biến thể `ss-cta--land` trong `short-screen.css`: chỉ ghim nút khi điện thoại xoay ngang. Màn dọc và máy tính giữ nguyên bố cục, không thêm nền hay viền trên. Rắn, Xếp Gạch, Bắn Bóng không đổi gì (chỉ đổi tag).
- **Kiểm.** Đo 5 game × 5 khung (844×390, 740×360, 568×320, 390×844, 1366×768). Hiện từng lớp phủ (menu, thắng/thua/kết thúc, tạm dừng, xác nhận), kiểm mọi nút trong hàng nút: nằm trọn trong khung, `elementFromPoint` ở tâm trúng nút, cao ≥ 44.
  - Trước: **11/25 khung hỏng.** Ví dụ 2048 844×390 "Bắt đầu" ở y 495–547; Ghép Kẹo 844 ở y 606–658; Nối Thú 740 ở y 437–489.
  - Sau: **25/25 đạt.**
  - Màn kết thúc của Nối Thú dựng nút bằng JS, nên lúc đo dev chèn 3 nút giả cùng class.
- **Đố Vui khi đang trả lời** (`@media (orientation: landscape) and (max-height: 500px)`):
  - HUD một hàng trên cùng.
  - Cột trái: đồng hồ, câu hỏi, phản hồi (dòng "Đúng rồi/Sai rồi" và nút "Câu tiếp" trên cùng một hàng, lời giải thích bên dưới).
  - Cột phải: 4 đáp án xếp dọc, mỗi ô 44 px.
  - Kiểm: chơi 6 câu ở mỗi khung. 844×390, 740×360 và 568×320 đều đạt: 4 đáp án, phản hồi và "Câu tiếp" nằm trọn trong khung, `.wrap` không cuộn, nút ≥ 44.
  - Ví dụ 740×360: đáp án ở y 118–327, "Câu tiếp" ở y 304–348. Trước: C/D ở y 329–387, bị cắt.
  - 390×844 và 1366×768 không đổi. 360×640 dọc vẫn phải cuộn như trước (lỗi cũ, ngoài phạm vi).

## 5. BOARD2-01 / BOARD2-06: Tỷ Phú online ở 320/360, link Trang chủ

- **Nguyên nhân.** Thanh trên có tổng chiều rộng tối thiểu 379 px (←, tên game, "Vòng 1/25", "CHAT", "Rời", loa, các khoảng cách), nên trang nở ra.
- **Sửa** (`co-ty-phu/index.html`, `game.js`):
  - Ở ≤ 420 px:
    - Chat chỉ còn icon 💬, 44×44.
    - Chữ "Vòng " nằm trong `<span class="rw">` và bị ẩn, chỉ còn "1/25". `game.js` đổi chỗ ghi vòng sang hàm `setRound()`.
    - Tên game co lại (12 px ở ≤ 340 px để không bị "…").
    - Khoảng cách 4 px, mọi phần tử `min-width: 0`.
  - Link "← Trang chủ" có `min-width` và `min-height` 44 px, margin âm để thanh không cao thêm.
  - Thanh trên giờ **luôn** nằm trên lớp phủ (`z-index: 21`, lớp phủ `padding-top: 64px`). Trước đây chỉ khi online. Ở màn vào phòng hay chơi với máy, lớp phủ che mất link Trang chủ (`elementFromPoint` trả `.card`).
- **Kiểm.** Ở 320, 360 và 390, đo 3 trạng thái (màn vào phòng, phòng chờ online, trong ván online). Kết quả **9/9 đạt**:
  - `innerWidth == scrollWidth == bề rộng khung`.
  - Nút loa nằm trong màn.
  - Link Trang chủ 44×44 và chạm trúng.
  - Nút Rời 44×44.
  - Trước: `innerWidth` = 379 ở phòng chờ và trong ván, link chỉ 13×23.
- **Cá Ngựa.** Chỉ sửa 1 dòng CSS `.bar a` (inline-flex, `min-height: 44px`, `margin-block: -10px`), không đụng logic online. Link đo được 92×44, chạm trúng ở 360, 390, 844×390 và 1366. Thanh cao như cũ.

## 6. BRD-06: dung lượng Tỷ Phú

**Điều tra ảnh** (`assets/`):

| File | Cỡ file | Hiện ra (CSS px) | Ô 2×2 trùng màu | Số màu |
|---|---|---|---|---|
| board | 1.024², 1.323 KB | 328–900 | 0,1 % | 286 k |
| poster | 960×640, 922 KB | ≤ 516 rộng | 0,3 % | 324 k |
| cards-keo | 768×512, 372 KB | ≤ 320 | 0,7 % | 81 k |
| tokens | 512², 225 KB | 28–56 | 47 % | 72 k |

- Bàn và poster **không phải lưới 2×**: không có điểm ảnh lặp, nên không được phép thu nhỏ lân cận gần nhất.
- Kích thước file cũng không thừa ở máy dpr cao: bàn hiện tới 900 CSS px ở 1920, và 374 × dpr 3 ở điện thoại.
- Nén lại WebP lossless `method=6`, giữ nguyên từng điểm ảnh: chỉ bớt 0,7 % (board −10 KB, poster −2 KB). Dev **không thay file nhị phân** vì lợi quá nhỏ.
- Bàn cờ là ảnh nền CSS (`background`), dùng `srcset` không được.
- Cách sửa thật: vẽ lại trên lưới 2× với bảng màu ≤ 96. Ước lượng bàn khoảng 140–170 KB, poster khoảng 85–105 KB. Brief cho Codex: [`docs/co-ty-phu/CODEX-OPTIMIZE.md`](../../co-ty-phu/CODEX-OPTIMIZE.md) (chưa dùng quota).

**Phần code đã làm:**
- `<link rel="preload" as="image" fetchpriority="high">` cho poster, vì đây là ảnh lớn đầu tiên người chơi thấy.
- Bàn cờ tải **sau sự kiện `load`** bằng `new Image()`. Khi đã có trong cache, script mới thêm class `html.tp-board` để gắn ảnh vào `.board`. Trong lúc chờ, bàn là màu nền `#46602f`.
- `cards-keo` và `tokens` vốn đã chỉ tải khi cần.
- Ảnh board và poster có `?v=d7a` (cache 1 năm).

**Đo trên Fast 3G** (562 ms, 1,44 Mbps) + CPU ×4, hồ sơ sạch, tắt cache, mỗi cỡ 2 lần:

| | Tổng byte | FCP | Poster tải xong | Sự kiện load | Bàn tải xong | LCP |
|---|---|---|---|---|---|---|
| Trước (390 và 1366) | 2.429 KB | 1,9–2,4 s | 12,8 s | **15,0 s** | 15,0 s | 15,0 s |
| Sau (390 và 1366) | 2.430 KB | 1,9–2,7 s | **7,3–7,4 s** | **7,3–7,4 s** | 15,1–15,2 s | 15,2–15,3 s |

- Tổng byte không đổi: chỉ vẽ lại ảnh mới giảm được.
- Màn vào phòng xong sớm hơn khoảng 5,5 s, và sự kiện load giảm một nửa.
- LCP vẫn tính theo ảnh bàn: bàn to hơn poster và hiện mờ sau lớp phủ, nên khi tới ở giây thứ 15 vẫn được tính là LCP nếu người chơi chưa chạm gì.

## Tag đã đổi

| File | Tag cũ → mới | Trang tham chiếu |
|---|---|---|
| `homepage/nav.css` | d6g → d7b | `index.html`, `bang-xep-hang.html` |
| `homepage/portal-pixel.css` | d6b → d7a | `index.html`, `bang-xep-hang.html`, `quyen-rieng-tu.html` |
| `games/_shared/short-screen.css` | ss1 → ss2 | 8 game: 2048, Sudoku, Đố Vui, Ghép Kẹo, Nối Thú, Rắn, Xếp Gạch, Bắn Bóng |
| `co-ty-phu/game.js` | d6g → d7a | |
| Ảnh Tỷ Phú (board, poster) | không tag → `?v=d7a` | |

`node tools/cache-tags/check-tags.mjs master` ⇒ `OK: 4 file tĩnh đổi, mọi tham chiếu ?v= tới chúng đã đổi tag.`
`feedback.js` vẫn `?v=f3` ở cả `index.html` và `press-nav.js`.

## Kiểm thử

| Bộ test | Kết quả |
|---|---|
| `home-d3-e2e` | 37/37 đạt. Lần đầu 35/36: test cũ đòi nhãn "Bảng xếp hạng" ở 1366, đã sửa test nhận cả "Xếp hạng" và thêm 1 kiểm HOME2-01 |
| `home-d5-e2e` | 20/20 đạt |
| `touch-scroll-e2e` | 22 đạt, 0 lỗi |
| `google-login-e2e` | 34/34 đạt |
| `daily-e2e` | 40/40 đạt |
| `sound-press-e2e` | 246/246 đạt (lần đầu hết giờ 300 s ở 162/162, chạy lại với giới hạn 900 s) |
| `logic.test.mjs` của 2048 / Sudoku / Đố Vui / Ghép Kẹo / Nối Thú / Tỷ Phú | 13 / 15 / 7 / 15 / 13 / 7 đạt, 0 lỗi |
| `co-ty-phu/screenshots/e2e-online.mjs` | 12 đạt, 3 lỗi rồi dừng ở "không bấm được #start". **Master cũng y hệt** (đã chạy trên worktree master tạm): script cũ, không do D7 |

Script đo tạm (nav 1024–1920, scroll-margin, lớp phủ 8 game × 5 khung, Đố Vui đang trả lời, Tỷ Phú 320/360/390 × 3 trạng thái,
Cá Ngựa link, Fast 3G) đều đạt; không commit (đã xoá).

## Còn mở

- **Email liên hệ** (HOME2-02): chờ chủ dự án. Điền `contactEmail` và đổi `?v=` của `community.js` trước khi bật Google.
- **Tỷ Phú LCP 15 s và 2,4 MB**: cần Codex vẽ lại bàn và poster (brief đã viết), cần chủ dự án duyệt quota.
- **Đố Vui 360×640 dọc** vẫn phải cuộn khi trả lời (lỗi cũ, ngoài phạm vi D7).
- **`co-ty-phu/screenshots/e2e-online.mjs`** hỏng sẵn trên master, cần sửa riêng.
