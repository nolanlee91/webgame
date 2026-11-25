# D5 · Thám Tử Hẻm xoay ngang, trang chủ xoay ngang, tab sảnh (P-F), thẻ Tài trợ

Nhánh `claude/d5-home` (tách từ master c05e799). Phạm vi: `prototype/games/tham-tu-hem`, `prototype/homepage`, thêm một thay đổi nhỏ ở máy chủ (`/api/lobby`).
Không sửa `_shared/*` (chỉ thêm test `home-d5-e2e.mjs` và chỉnh một check trong `home-d3-e2e.mjs`). Bản lưu Thám Tử không đổi (vẫn `wgp.tham-tu-hem.v1`, `v: 1`).

## Cách đo

Chrome headless qua `tham-tu-hem/test/cdp.mjs`, giả lập chạm + `mobile: true`, dpr 2. "Trước" = master chạy trên một server riêng (worktree tạm, cổng 8963),
"sau" = nhánh này (cổng 8961); cùng một script đo (ngoài repo). Thám Tử đo trên Vụ 1 thật (`noi-thit-kho`, `?fast=1`), tiến độ dựng bằng `core/solver.js`:
mỗi màn ghi nút chính có nằm trọn trong khung không, `elementFromPoint` ở tâm có trúng nút không, cỡ vùng chạm nhỏ nhất, tràn ngang.

## 1. Thám Tử Hẻm xoay ngang (844×390, 740×360, 568×320)

Mọi thay đổi bố cục nằm trong khối `@media (orientation: landscape) and (max-height: 500px)` cuối stylesheet `index.html` (cùng query với TTH-03),
JS chỉ đổi khi `landShort()` khớp ⇒ dọc / máy tính giữ nguyên (đo 390×844 và 1366×768 trước/sau: kết quả **giống hệt**).

| Màn | Thay đổi | 844×390 trước → sau | 740×360 trước → sau | 568×320 trước → sau |
|---|---|---|---|---|
| Đặt tên | `screens.js title()`: xoay ngang không dùng băng ảnh (568 px rộng trước đây băng cao trọn màn), tranh phủ nền (`landCover`, bản HD nếu có) + bóng tối trái; logo 1 dòng `clamp(26px, 9svh, 36px)`, nhãn "Tên thám tử" ẩn trực quan (ô vẫn có `aria-label`), ≤ 340 px cao ẩn dòng tag | "Mở văn phòng" **ngoài khung** (phải cuộn 180 px) → trong khung, 44 px | ngoài → trong | ngoài (cả ô tên) → trong |
| Chọn vụ (bản đồ) | Lưới 2 cột: trái = thẻ thám tử (chân dung 44) + tab mùa + bản đồ (cỡ theo chiều cao còn lại), phải = danh sách hồ sơ cuộn riêng; thẻ hồ sơ gọn (16 px) | thẻ hồ sơ thấy trọn: **0 → 3** | 0 → 2 | 0 → 1 (cột phải cuộn) |
| Sổ tay | Tab thành cột dọc trái (44 px), vật chứng = lưới trái + chi tiết phải (sticky); đầu bảng gọn | thẻ vật chứng thấy: 0 → 6; lời khai: 2/3 → 3/3 | 0 → 6; 2 → 3 | 0 → 2; 1 → 1 |
| Thẩm vấn | Chân dung 96 + tên + tiểu sử cột trái (sticky), chủ đề cột phải; "Đưa vật chứng" dính đáy (`scroll-padding-bottom` để chủ đề cuộn tới không nằm dưới) | "Đưa vật chứng" ngoài → trong; chủ đề 2 → 4 | ngoài → trong; 1 → 4 | ngoài → trong; 0 → 3 |
| Bảng suy luận | Bảng bần trái (cuộn), khay từ khoá + trạng thái + "Chốt bảng" cột phải | phần bảng bần thấy được **120 → 302 px** | 90 → 272 | 50 → 232 |
| Gợi ý Tèo | Hộp hỏi gọn; hộp thoại thấp hơn (min-height 150 → theo chữ, 16 px), nút Tua 44 px | hộp thoại 150 → 124 px | 150 → 124 | 150 → 124 |
| Vạch mặt | 2 cột (chân dung trái ≤ 160 px, lời chối + nút phải) | "Đưa vật chứng" ngoài → trong | ngoài → trong | ngoài → trong |
| Kết vụ | Hồ sơ trái (tem / sao / số liệu gọn), tường bình luận phải (sticky); hàng "Về bản đồ / Chơi lại / Khoe" dính đáy | 3 nút ngoài → trong | ngoài → trong | ngoài → trong |
| Văn phòng | Bìa hồ sơ gọn (đã vừa từ trước) | "Nhận vụ" trong | trong | trong |

Vùng chạm ≥ 44 px khi xoay ngang: nút thanh trên (← Bản đồ, loa, nhạc: 40 → 44), "Đóng" bảng phủ (36 → 44), mọi `.btn--sm` (Xem kỹ, Gỡ, câu hỏi phụ, Đổi tên…),
tab Sổ tay (42 → 44), chỗ trống bảng suy luận (36 → 44), chip từ khoá (36 → 44), nút Tua, `details` Cách chơi. Thông báo nổi (toast) chuyển xuống góc dưới trái
(trước nằm đè nút Đóng ở góc trên phải). Không tràn ngang ở mọi màn × 3 khung; 0 lỗi console.

Còn cuộn (cố ý, trong vùng cuộn riêng, nút chính vẫn thấy): danh sách hồ sơ, lưới vật chứng, từ khoá, bảng bần, câu hỏi phụ ở kết vụ.

## 2. Trang chủ xoay ngang (844×390, 740×360)

`nav.css` + `portal-pixel.css`, khối `(orientation: landscape) and (max-height: 500px) and (max-width: 1023px)` ⇒ không đụng dọc / máy tính.

- Thanh trên **không dính** khi xoay ngang (trước ~115 px dính suốt lúc cuộn trên khung 390), ẩn slogan, logo 18 px.
- Slide nổi bật thành băng thấp: ảnh 4:3 bên trái cao `--hh = clamp(92px, 100svh − 272px, 150px)`, tên game + "Chơi ngay" bên phải (ẩn mô tả, ≤ 380 px cao ẩn nhãn "Tựa game của tuần"); mũi tên ‹ › và chấm 44 px.
- Dải "Chơi ngay" (8 game, có sẵn từ HOME-02, trước chỉ ≤ 720 px) hiện 1 hàng ngay dưới slide ⇒ đó là kệ game đầu tiên trên màn đầu.

| Khung | Slide trước → sau | Thẻ game thấy trọn trong màn đầu | Kệ "Tất cả game" bắt đầu ở |
|---|---|---|---|
| 844×390 | 332 px (85% khung) → **118 px (30%)** | 0 → **6** | 1038 → 907 px |
| 740×360 | 289 px → **92 px (26%)** | 0 → **6** | 1011 → 887 px |
| 568×320 | 184 → 92 px | 0 → 0 (dải bắt đầu y 291, xem Câu hỏi) | 1067 → 706 px |
| 390×844, 360×800, 1366×768, 1920×1080 | không đổi (đo trước/sau giống hệt) | 6 / 6 / 0 / 4 như cũ | như cũ |

## 3. P-F: tab sảnh "Phòng chờ / Đang diễn ra" + "N người đang chơi"

- Máy chủ (`server.js`, `games-server/public-rooms.js`): `/api/lobby` trả thêm `players` (tổng người thật đang kết nối, mọi game online)
  và `playing: [{ game, rooms, n }]` (game có ván đang chơi, đông trước). **Không** có mã phòng / tên người trong 2 trường mới. `rooms` giữ nguyên dạng
  ⇒ trang cũ (đang cache) vẫn chạy. Hàm `roomPulse` đọc 2 dạng phòng (đa số game `{room:{phase,players}}`, Nối Từ `{seats,conns,ref}`), dạng lạ bỏ qua không ném lỗi.
- Trang chủ (`index.html`, `app.js`): hàng tab ARIA (← → Home End, chỉ tab đang chọn nhận Tab) thay dòng "Phòng công khai đang chờ".
  "Phòng chờ N" = danh sách cũ; "Đang diễn ra N" = mỗi game 1 dòng "X bàn đang chơi · Y người" + nút "Chơi" mở game (không vào giữa ván được).
  Chưa tự chọn tab mà không có phòng chờ nhưng có ván đang chơi ⇒ mở sẵn "Đang diễn ra". Không phòng chờ + không ván ⇒ như cũ ("mở phòng nhanh").
- "N người đang chơi" ở đầu sảnh chỉ hiện khi `players ≥ 20` (`ONLINE_MIN` trong `app.js`), định dạng `1.234`.
- Test: `games-server/lobby-pulse.test.mjs` (3 test: đếm phòng, gộp theo game, `GET /api/lobby` có cả 3 trường), `home-d5-e2e.mjs` (tab, phím, ngưỡng 20, máy chủ cũ).

## 4. Thẻ Tài trợ SpeakUp Kids

`app.js sponsorHTML()`: chỉ vẽ khi `SPONSOR.url` (`games.js`) là `https://…` có tên miền. Trống / `#` / `http://` / `javascript:` / `https://` ⇒ không có thẻ.
URL đọc lúc vẽ kệ ⇒ điền link vào `games.js` là thẻ tự hiện (link tab mới, `rel="sponsored noopener"`). `home-d3-e2e.mjs` sửa có chủ đích: kiểm ẩn khi trống, rồi điền link mới kiểm cỡ / vị trí thẻ.

## Tag cache đã đổi

- Thám Tử: `ui/screens.js` t12 → **t13**, `ui/panels.js` t12 → **t13** (import chéo nhau + `game.js` + modulepreload), kéo theo `game.js` t12 → **t13** (`<script>` + modulepreload). File vụ vẫn `?v=t12` (không đổi).
- Trang chủ: `app.js` d3a → **d5a**, `games.js` d3a → **d5a**, `nav.css` d3b → **d5a**, `portal-pixel.css` d3b → **d5a** (ở `index.html`, `bang-xep-hang.html`, `quyen-rieng-tu.html`).
  `play.html` nạp `games.js` không tag (như cũ). `press-nav.js` vẫn nhập `feedback.js?v=f3` = `index.html`.
- `node tools/cache-tags/check-tags.mjs master` ⇒ xem Kiểm thử.

## Kiểm thử

Server `PORT=8961 node server.js` ở gốc worktree (master tạm: 8963, chỉ để đo "trước").

| Lệnh | Kết quả |
|---|---|
| `node --test prototype/games/tham-tu-hem/test/*.test.mjs` | 44/44 |
| `node --test games-server/lobby-pulse.test.mjs games-server/moderation-rooms.test.mjs server-static.test.mjs` | 20/20 |
| `tham-tu-hem/test/e2e.mjs` | E2E ĐẠT (desktop + 390, 0 FAIL) |
| `tham-tu-hem/test/e2e-season.mjs` | E2E-MÙA-2 ĐẠT |
| `tham-tu-hem/test/e2e-bot.mjs` (desktop / `VIEW=mob` / **`VIEW=land` mới, 844×390 chạm**) | xem dưới |
| `_shared/test/home-d5-e2e.mjs` (mới) | 20/20 TẤT CẢ ĐẠT |
| `_shared/test/home-d3-e2e.mjs` | TẤT CẢ ĐẠT |
| `_shared/test/touch-scroll-e2e.mjs` | 22 đạt, 0 lỗi |
| `_shared/test/daily-e2e.mjs`, `daily-board-e2e.mjs` | TẤT CẢ ĐẠT / TẤT CẢ ĐẠT |
| `_shared/test/sound-press-e2e.mjs` | 194 PASS, 1 FAIL: `do-vui-nhanh 1366 đã trả lời: nút vô hiệu không lún` — game Đố Vui, ngoài phạm vi, nhánh này không đụng file nào của nó (lần chạy đầu Chrome không mở được do máy bận, chạy lại) |
| `homepage/screenshots/check.mjs` | 78 PASS, 6 FAIL = đúng 5 lỗi có sẵn trên master đã ghi ở D3 (nút vàng/teal, Tập Làm Chủ "3 Sắp ra mắt", viền mảnh, Trà Sữa "Sắp ra mắt", hero__dot 37 px ở 360) + "Nông Trại mở thẳng" (chập chờn như D3). Lần chạy đầu có thêm "không có số người online mẫu" vì phần tử mới dùng class `lobby__stat` ⇒ đổi tên `lobby__online` |
| `node tools/cache-tags/check-tags.mjs master` | `OK: 10 file tĩnh đổi, mọi tham chiếu ?v= tới chúng đã đổi tag.` |

e2e-bot (12 vụ, bấm thật):
- `VIEW=land` 844×390 chạm (mới): **25 PASS, 0 FAIL, 12/12 vụ 3★**, 0 lỗi console — E2E-BOT ĐẠT.
- desktop 1366×768: 24 PASS, 12/12 vụ 3★, 1 FAIL "0 lỗi console" = `net::ERR_CACHE_OPERATION_NOT_SUPPORTED` khi tải 3 file âm thanh (3 Chrome chạy song song tranh bộ nhớ đệm đĩa, không liên quan bố cục). Chạy lại một mình: 7 PASS đầu, 0 FAIL, rồi dừng theo yêu cầu điều phối (chưa chạy hết).
- `VIEW=mob` 390×844: 23 PASS, 0 FAIL, 11/12 vụ 3★ trước khi tiến trình bị dừng ở vụ cuối; chạy lại `tham-tu-gia noi-thit-kho`: 5 PASS, 0 FAIL.

`VIEW=land` lần đầu báo "bị che" ở chủ đề thẩm vấn cuối danh sách (cuộn tới nằm dưới hàng "Đưa vật chứng" dính đáy) ⇒ thêm `scroll-padding-bottom` cho `.talk-body` và màn kết vụ.

## Câu hỏi / chưa làm

- 568×320 trang chủ (thuộc bố cục điện thoại ≤ 720 px): slide đã thấp còn 92 px nhưng hàng logo dính + hàng chip điều hướng + ô tìm vẫn chiếm ~180 px nên dải game bắt đầu ở y 291 (khung 320). Muốn thấy game ở khung này cần gộp chip + ô tìm thành 1 hàng khi xoay ngang; chưa làm vì ngoài 2 khung được giao.
- Ngưỡng hiện "N người đang chơi" đang là 20 (`ONLINE_MIN`), và chỉ đếm người trong các game online (không tính game chơi một mình). Chủ dự án muốn ngưỡng khác / đếm cả khách đang mở trang thì cần thêm số liệu máy chủ.
- Tab "Đang diễn ra" không cho xem trận (chưa có chế độ khán giả); nút "Chơi" chỉ mở game để tạo phòng mới.
- Hiện trường Thám Tử ở 568×320 (bố cục TTH-03 cũ): cột "Người trong vụ" chỉ còn ~53 px (cuộn riêng). Không đổi trong đợt này.
- Chưa thử máy thật.
