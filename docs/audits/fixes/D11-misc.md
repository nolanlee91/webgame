# D11 · Việc lẻ P3 (trang chủ, Thám Tử, game online) + 3 quyết định trang chủ của chủ dự án

Nhánh `claude/d11-misc`, tách từ master `bbe16a7`. Không đụng 2048, Đào Vàng, Rắn, `_shared/share.js` hay phần đếm phòng / thống kê của `games-server`.
Không đổi ảnh. Đo bằng Chrome headless qua `_shared/test/cdp.mjs`, chạm thật (`Input.dispatchTouchEvent`). Máy đo dùng chung với agent khác nên số thời gian dao động.

## 1. Trang chủ

| Mã | Trước | Sau |
|---|---|---|
| HOME2-06 chạm hero đúng lúc tự chuyển | Slide cũ `inert` ngay khi bắt đầu trượt mà vẫn nằm dưới ngón tay ⇒ chạm rơi xuống `.hero__track` (hụt) hoặc mở game của slide mới | `app.js`: slide cũ chỉ `inert` sau khi trượt xong (560 ms). `pointerdown` trên hero ⇒ **dừng hẳn tự chuyển**; nếu đang trượt thì nhảy tức thì về slide nằm dưới ngón tay ⇒ chạm mở đúng game đang thấy. HOME-10 (focus) giữ nguyên: trượt xong chỉ slide đang hiện không `inert` |
| HOME2-07 thẻ phòng | Tên chủ phòng dài bị cắt cứng, không "…" (`.room__host` là flex nên `text-overflow` không ăn); ở 390 danh sách 1 phòng chỉ rộng 88%, nút "Vào" lệch khỏi mép phải | Tên bọc `<span class="room__hostName">` có `ellipsis` (390, 1366, 320). Điện thoại ≤ 3 phòng ⇒ cột rộng 100%; ≥ 4 phòng vẫn là dải vuốt 88% (lộ mép phòng sau) |
| HOME2-10 chip điều hướng im lặng | Chạm chip (link `#…`) không kêu, nút / thẻ khác kêu | `press-nav.js` thêm `a.mainnav__a[href]` vào bộ chọn (vẫn import `feedback.js?v=f3`); chip lún bằng `.is-pressing` như `:active`. Lướt ngang hàng chip không kêu (cùng cơ chế với thẻ) |
| HOME2-13 568×320 | Hàng chip (y 57–123) + ô tìm (y 133–175) hai hàng ⇒ dải "Chơi ngay" bắt đầu y 291, thấy 1 thẻ | `nav.css`: xoay ngang thấp ≤ 720 px, chip trôi trái (`float`), ô tìm (khối flex) nằm cạnh, rộng phần còn lại (≥ 140 px). Hàng logo vẫn dính. Dải "Chơi ngay" bắt đầu **y 229**, thấy 5 thẻ (phần ảnh; 2 hàng chip sau khi gộp nav còn rộng hơn). 667×375 cũng một hàng. Dọc không đổi |
| HOME2-12 lún chớp khi cuộn (rủi ro) | Lần audit đầu ghi 1 lần lún chớp, 3 lần đo lại không ra | **Không tái hiện được**: `touch-scroll-e2e` chạy 3 lần trong đợt này (cả bản mới thêm ô "Tựa game của tuần" và chip điều hướng): 0 lún, 0 tiếng khi lướt. Giữ `TOUCH_PRESS_DELAY = 70 ms` (tăng lên 100 ms làm cú chạm thật thấy lún chậm hơn). Xem lựa chọn ở mục 6 |

### 1b. Quyết định chủ dự án (thêm giữa đợt)

**Điện thoại dọc: gộp hero vào "Chơi ngay"** (`index.html`, `app.js`, `portal-pixel.css`)
- ≤ 720 px dọc: ẩn hero. Ô đầu dải "Chơi ngay" là ô lớn **"Tựa game của tuần"** (2 cột × 2 hàng): ảnh, kicker, tên, nút "Chơi ngay". Game lấy từ `HERO_SLIDES[0]` trong `games.js` (hôm nay Cờ Cá Ngựa), kicker lấy từ chính slide đó; `QUICK_PLAY` bỏ game trùng. Dải thành 3 hàng: ô lớn góc trái, 2 ô dưới nó, rồi các cột 3 ô.
- Ô lớn viết sẵn trong HTML (CLS), `app.js` kiểm id khớp, lệch thì vẽ lại. Ảnh ô lớn dùng **cùng `srcset` + `sizes` với ảnh slide 1** ⇒ trình duyệt chọn cùng một file, chỉ tải một lần; `fetchpriority="high"`, tải ngay (không lười). Không cần `preload` riêng: ảnh slide 1 (ẩn) đứng trước trong HTML đã bắt đầu tải file đó.
- Hero ẩn thì không tải trước slide 2, không tự chuyển; xoay sang ngang thì gắn ảnh + chạy lại.
- Xoay ngang thấp và > 720 px: hero giữ nguyên, ô lớn ẩn.
- Màn đầu thấy trọn: 390×844 **6 game** (ô lớn + 5), 360×640 **6**, 320×568 **6** (trước: 390 = 7 gồm slide; 320 = 4). Ảnh: `gop-390x844.png`, `gop-360x640.png`, `gop-320x568.png`, `gop-568x320.png` (thư mục ảnh của `home-d11-e2e`).

**Bỏ mục "Phòng online"; gộp "Thử thách" + "Bảng xếp hạng"** (`index.html`, `bang-xep-hang.html`)
- Thanh điều hướng còn **Chơi · Thử thách** (máy tính và hàng chip điện thoại). "Thử thách" trỏ `bang-xep-hang.html#thu-thach`; ở trang đó là mục đang chọn (`#thu-thach`). Đích link nằm ở đúng 2 chỗ có `data-nav="thu-thach"` (có chú thích: đổi sang trang "Kèo ngày" thì sửa 2 chỗ này). `quyen-rieng-tu.html` không có thanh điều hướng nên không đổi.
- `#lobby` vẫn còn (link cũ vẫn nhảy tới sảnh). Không có JS riêng nào cho mục cũ.
- Trang `bang-xep-hang.html`: `<title>` / `og:title` "Thử thách hôm nay và bảng xếp hạng — Lụm Kèo", h1 "Thử thách".

**Sảnh trống thu gọn** (`portal-pixel.css`, `app.js`, `index.html`)
- Không có phòng chờ và không có ván đang chơi (cả lúc đang tải — trường hợp hay gặp nhất, nên lần vẽ đầu đã là dạng gọn): sảnh chỉ còn **một hàng** "Có mã phòng bạn gửi? [mã] Vào phòng · + Tạo phòng mới". Ẩn tiêu đề, tab, danh sách, lời nhắn trống.
- Máy tính (≥ 1024): sảnh gọn ⇒ hero chiếm trọn hàng (ảnh 4:3 rộng 440 px bên trái, tên 38 px + mô tả + Chơi ngay bên phải, chấm chuyển slide dưới phần chữ), hàng mã phòng ngay dưới. Khối đầu trang 470 → 330 + 72 px. `sizes` hero cuối danh sách 360px → 440px (cả HTML viết sẵn).
- Có phòng ⇒ sảnh đầy đủ như cũ (tab Phòng chờ / Đang diễn ra, danh sách).
- **CLS:** nếu kết quả `/api/lobby` về khi trang **đã vẽ** thì tự bung sảnh sẽ xô cả trang (đo: máy tính **0,32**, 390: 0,05). Nên: kết quả về trước lần vẽ ⇒ mở đầy đủ luôn; về sau ⇒ sảnh vẫn gọn, hiện nút nhỏ **"● N phòng đang chờ · Xem"** đè mép trên khung (không chiếm chỗ), bấm mới mở đầy đủ (do người bấm nên không tính CLS). Đã mở thì không tự thu lại.
- CLS lúc tải (mock `/api/lobby`, `home-d11-e2e`): trống 1366 0,0003 · 1920 0,0001 · 390 0; có phòng về ngay 1366 0,0003 · 1920 0,0001 · 390 0; phòng về sau 1,5 s 1366 0,0004 · 390 0,0004.
- Ảnh: `sanh-1366-trong.png`, `sanh-1366-co-phong.png`, `sanh-1920-trong.png`, `sanh-1920-co-phong.png`, `sanh-390-trong.png`, `sanh-390-co-phong.png`, `sanh-muon-1366.png`.

**LCP điện thoại** (`tools/perf/home-vitals.mjs --only 390-slow --runs 3 --dpr 3`, Slow 4G + CPU 4×, master cổng 8912 / nhánh cổng 8911 xen kẽ):

| | master (hero) | D11 (ô Tựa game của tuần) |
|---|---|---|
| Vòng 1 | 19 624 / 1 732 / 6 888 ⇒ trung vị 6 888 ms | 3 356 / 4 992 / 2 720 ⇒ trung vị 3 356 ms |
| Vòng 2 | 3 156 / 2 440 / 1 236 ⇒ trung vị 2 440 ms | 2 120 / 884 / 2 368 ⇒ trung vị 2 120 ms |
| CLS | 0 – 0,0001 | 0,0002 |

Máy đang tải nặng (một lần master ra 19,6 s), nên chỉ kết luận được: không xấu đi rõ rệt; hai bản cùng tầm. Cần đo lại khi máy rảnh.

Phần tử LCP vẫn là ảnh Cờ Cá Ngựa (giờ là ảnh ô "Tựa game của tuần", cùng file 360w). Dung lượng lúc tải 947 → 964 KB.

## 2. Thám Tử Hẻm

| Mã | Sau |
|---|---|
| TTH2-06 | `.slot` `min-height: 44px` ở mọi khung (trước 36 khi dọc). |
| TTH2-04 | Vụ 1: chỗ trống "vết đỏ trên áo là {Vật gì}" chỉ bày **4 chip** (sa tế, nước màu, thịt kho trứng, vòng nước màu) thay vì tới 12 — trường mới `blanks.<id>.choices`, khay lọc theo đó (`ui/panels.js`). Mọi chỗ trống Vụ 1 ≤ 6 chip. Thú nhận 9 → 6 dòng, kết 10 → 8 dòng (gộp câu cùng người nói, bỏ "Live thì live…" và "Đúng rồi!"); cốt truyện, lời giải, vật chứng không đổi. Chưa đạt mục tiêu ≤ 200 chạm của audit: phần lớn chạm nằm ở thoại điểm soi / hỏi cung, cắt sâu hơn là viết lại truyện (mục 6). |
| TTH2-07 | Kết vụ xoay ngang: dấu "ĐÃ PHÁ" + 3 sao một hàng, ô phạt chữ + số một dòng ⇒ dòng "+100 danh tiếng (gốc 100)" và thanh hạng không còn nằm dưới hàng nút dính đáy (740×360, 844×390). Nút **"N câu hỏi phụ ↓"** nổi trên mép hàng nút, cuộn tới câu chưa trả lời. 568×320: "Khoe kết quả" rút thành "Khoe" ⇒ hàng nút còn một hàng (trước 2 hàng). |
| TTH2-08 | `test/e2e-bot.mjs`: bỏ qua đúng lỗi `net::ERR_CACHE_OPERATION_NOT_SUPPORTED` của file `.mp3` (có chú thích). |

Tag: `game.js`, `ui/screens.js`, `ui/panels.js` t14 → **t15**; mọi file vụ t12 → **t15** (`game.js` nạp động — check-tags không thấy).

## 3. Game online

- **PTY-07 Ma Sói** (`ma-soi/style.css`): điện thoại dọc ≤ 640 px, 8 ghế xếp thành vòng elip riêng (tâm 50% / 66,3%, bán kính 37% × 28,7% khung cảnh, ghế 1 ở đỉnh, đi theo chiều kim đồng hồ như cũ), ghế 6,33% của `.world`, tên tối đa 200% ghế. Ảnh không đổi. Đo (8 người, đêm 1): 320×568 / 360×640 / 390×844 **0 cặp khung chồng nhau** (trước 4 cặp ở cả 3 cỡ), **ô đồng hồ pha che 0 ghế** (trước che 3 ghế ở 320, 1 ở 360); 6 người cũng 0/0. Ảnh `ms-320-8.png`.
- **Nội Gián 8 người**: đo cùng cách — 0 chồng, 0 che ở 320/360/390 (bố cục 2 hàng sẵn có). Không sửa.
- **BRD-23 Tỷ Phú**: `#mute` là SVG loa pixel lưới 12×11 `crispEdges` (bật: loa kem + 2 sóng vàng; tắt: loa xám + dấu × đỏ, màu theo bảng của game), `aria-pressed` đổi theo; giữ `aria-label`, nút 44 px trên điện thoại.
- **BOARD2-11 Tỷ Phú**: không dời ô. Hộp thông tin ô có **‹ ›** đi sang ô bên cạnh + "Ô N/40", ô đang xem nhấp nháy ⇒ chạm lệch sang ô kế bên thì sửa ngay trong hộp. Nút số người 2/3/4 ≥ 44 × 44 (trước 38).
- **BOARD2-08 Cá Ngựa**: tên trên thẻ người chơi online xuống tối đa 2 dòng (≤ 420 px: chữ thường 12 px, tối đa 3 dòng ⇒ "Ngọc / Ánh / Dương" đọc trọn ở 320); dòng trạng thái 2 dòng ở ≤ 420 px, chừa chỗ cho nhãn "▼ LƯỢT".
- **BRD-21**: 19 quy tắc `:hover` ở Caro, Vua, Tướng, Ô Ăn Quan (`index.html`) và Cá Ngựa (`hud.css`) bọc trong `@media (hover: hover)`. Kiểm bằng `CSS.forcePseudoState`: 1366 chuột ⇒ nền đổi khi hover (5/5); 390 `hover: none` ⇒ không đổi (5/5). Ảnh `hov-<game>-1366.png`, `hov-<game>-390.png`. Không quy tắc nào khác đổi.

## 4. Test

| Bộ | Kết quả |
|---|---|
| `_shared/test/home-d11-e2e.mjs` (mới) | 48/48 ĐẠT: HOME2-06/07/10/13, gộp hero (320/360/390 + 568×320), nav, sảnh gọn / đầy đủ / phòng về muộn + CLS |
| `home-d3-e2e` | ĐẠT (sửa kỳ vọng nav 4 → 2 mục, mục đang chọn ở trang Thử thách) |
| `home-d5-e2e` | ĐẠT (dọc: không hero, dải 3 hàng; máy tính sảnh trống: hero 330 px) |
| `touch-scroll-e2e` | 30/30 (thay "slide hero" bằng ô Tựa game của tuần + thêm chip điều hướng) |
| `sound-press-e2e` | SOUND_RESULT |
| `daily-e2e` | ĐẠT |
| Thám Tử unit (`node --test`) | 46/46 (thêm test choices + độ dài thú nhận / kết) |
| Thám Tử `e2e-bot` | TTH_BOT |
| Ma Sói `browser-e2e` | ĐẠT (thêm kiểm PTY-07 ở phòng chờ 320/360/390) |
| Nội Gián `browser-e2e` | ĐẠT |
| `board-online-e2e` Caro / Vua / Tướng / Ô Ăn Quan | ĐẠT cả 4 |
| Tỷ Phú `e2e-online` | 56/56 (thêm kiểm loa SVG + hộp ô ‹ ›) |
| Cá Ngựa / Tỷ Phú unit | 31/31 · 7/7 |
| `tools/cache-tags/check-tags.mjs master` | OK |

## 5. Tag cache đã đổi

- Trang chủ: `app.js` d9b → **d11b**; `nav.css` d8a → **d11a**, `portal-pixel.css` d9a → **d11a** (index, bang-xep-hang, quyen-rieng-tu); `press-nav.js` d9a → **d11a** (vẫn import `feedback.js?v=f3`).
- Thám Tử: `game.js`, `ui/screens.js`, `ui/panels.js` → **t15**; file vụ → **t15**.
- Ma Sói `style.css` d8o → **d11a**.
- Tỷ Phú `game.js` d7a → **d11a**.
- Cá Ngựa: `hud.css`, `hud.js`, `online.js`, `game.js` d8o → **d11a**.

## 6. Cần chủ dự án chọn

1. **HOME2-12 (lún chớp khi cuộn, không tái hiện):** (a) giữ 70 ms, theo dõi tiếp; (b) tăng lên 100 ms cho chắc, chấp nhận lún chậm hơn 30 ms khi chạm thật.
2. **TTH2-04 Vụ 1 vẫn dài (~350 chạm theo audit):** (a) giữ như đợt này (chip ≤ 6, thú nhận / kết gọn); (b) cho viết lại thoại điểm soi + hỏi cung Vụ 1 (mỗi điểm 1–2 dòng) để về ≤ 200 chạm — đổi giọng văn; (c) thêm nút "Đọc nhanh" (hiện cả đoạn một lần chạm) cho mọi vụ.
3. **Sảnh có phòng về muộn:** (a) giữ nút "N phòng đang chờ · Xem" (CLS ≈ 0); (b) tự bung sảnh kể cả khi đã vẽ (máy tính CLS ~0,3); (c) máy tính luôn để hero trọn hàng, sảnh đầy đủ nằm dưới hàng mã (không xô hero, nhưng đẩy danh sách game xuống).
4. **Ghế Ma Sói ≤ 640 px không còn ngồi trên ghế gỗ trong ảnh:** (a) giữ vòng elip (dễ đọc, không chồng); (b) đặt Codex vẽ thêm cảnh dọc riêng có 8 ghế đúng vòng này.
