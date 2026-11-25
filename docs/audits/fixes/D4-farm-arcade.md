# D4 — Nông Trại trên điện thoại + 7 game nhỏ (vùng chạm, nhãn nội bộ)

Nhánh `claude/d4-farm-arcade` (từ master 039f3cc). Phạm vi: `nong-trai/`, `ran-san-moi/`, `xep-gach/`, `ban-bong/`, `ghep-keo/`, `dua-xe/`, `dao-vang/`, `noi-thu/`.
Đo bằng Chrome headless (`_shared/test/cdp.mjs`), "chạm" = giả lập touch. Ảnh trước/sau ở thư mục tạm của phiên, không commit.

## TLC1-05 · Nông Trại trên điện thoại

Nguyên tắc: giữ khung pixel V5 sẵn có (viền 3 px bằng box-shadow, vát, bóng cứng, không bo tròn). Không đổi gameplay, kinh tế, bản lưu.

| Phần | Thay đổi |
|---|---|
| Thanh đầu trang | Nút Âm thanh + Cách chơi chuyển lên góc phải thanh đầu trang (mọi khung). Thanh cao 44 px, link "← Trang chủ" cao 44 px, nút biểu tượng 40×36 + `::after` ⇒ vùng chạm 44×44. `.bar` `z-index: 7` (trên bản đồ / khay, dưới lớp phủ). |
| HUD (≤ 760 px và xoay ngang) | Một hàng cao 44 px: đồng xu + số (nhãn "Xu" chỉ cho đọc màn hình), "Cấp N" với thanh XP 3 px dưới số, "Kho a/b" với thanh 3 px; vạch ngăn pixel giữa các số. Ẩn "Ô ruộng" và chữ XP. Bên phải: Thu hết, Xây (búa), Sổ (chỉ biểu tượng trên điện thoại dọc, số món ở `aria-label`, chấm "!" giữ nguyên). ≤ 360 px: nhãn "Cấp"/"Kho" thành biểu tượng (sao XP trong `icons.png`, nhà kho trong `items.webp`), chữ vẫn còn cho đọc màn hình. Số lớn (xu hàng triệu, kho tràn) hoặc ≤ 340 px ⇒ tự xuống 2 hàng (`flex-wrap`), không tràn, không che số. |
| Nhiệm vụ Chị Ba | Một dòng 44 px: chân dung 28 px, tên nhiệm vụ (cắt "…"), tiến độ, nút Nhận khi xong, nút mũi tên `#qMore` (`aria-expanded`). Chạm dòng hoặc mũi tên ⇒ mở chi tiết (bước, gợi ý, thưởng, thanh tiến độ). Máy tính giữ nguyên bản đầy đủ (nút ẩn). |
| Khay (điện thoại dọc) | `.farm-controls` (10 nút + khay hạt) dính đáy màn (`position: sticky`, cộng `env(safe-area-inset-bottom)`) khi đang Gieo / Tưới. Mở Kho / Đơn / Nâng cấp ⇒ khay thôi dính, trang cuộn tới khay để bảng hiện ngay dưới nút; về Hạt giống / Tưới ⇒ cuộn lại lên ruộng (`game.js` `openPanel`). Nút điều hướng giữ ≥ 48 px (test M5), hạt giống gọn (ảnh 28 px). Thông báo (toast) chuyển lên trên để không che khay. |
| Xoay ngang (≤ 500 px cao) | 2 cột: bản đồ trái (cao trọn khung, bản đồ rộng 700 px ⇒ ô ruộng ≈ 44 px, cuộn trong khung, `centerField()` đặt ruộng vào giữa theo cả hai chiều, đặt lại khi xoay máy); cột phải `clamp(300px, 40vw, 380px)`: HUD, nhiệm vụ, thanh Chế độ Xây, khay (cột khay tự cuộn khi mở Kho / Đơn). `.farm-world` thành `display: contents` chỉ ở cảnh nông trại; cảnh Xưởng / Chợ / Chăn nuôi / Làng giữ bố cục cũ. `placePan()` tính vị trí nút "Xem thêm →" theo `offsetParent` chung. |
| Chữ | "Chọn hạt cà rốt ở khay dưới" ⇒ "trong khay hạt giống" (khay nằm bên phải khi xoay ngang); bảng Cách chơi tương tự. |
| Tag module | `?v=m11` ⇒ `?v=m12` đồng loạt (400 import, `test/m5.test.mjs` kiểm một tag). |

### Số đo trước → sau

| Khung | Trước | Sau |
|---|---|---|
| 390×844 | HUD 128 px (y 49–177) + nhiệm vụ 75 px; bản đồ từ y 272; nút điều hướng y 796–909; khay hạt y 920–1029 (dưới mép màn); trang 1050 | HUD 50 px (y 50–100), nhiệm vụ 44 px (y 106–150), bản đồ y 156–663, khay dính đáy: điều hướng y 645–750, hạt y 756–836 (bấm được không cuộn). Ruộng thấy y 156–645 = 489 px = **58 %** màn; ô ruộng 5×5 trọn trong khung (y 314–567) |
| 844×390 | HUD + nhiệm vụ tới y 251; bản đồ từ y 263 (thấy 127 px); khay hạt y 924; trang 1046 | Không cuộn trang (cao 390). Bản đồ x 8–486, y 50–384; ruộng 233×233 y 100–333 trọn trong khung; HUD y 50–150, nhiệm vụ 156–200, điều hướng 216–309, hạt 315–381 — thấy cùng lúc |
| 360×800 | như 390, khay hạt y 917 | HUD 1 hàng 50 px, khay hạt y 712–792, không tràn ngang |
| 320×568 | ô hạt 40 px ngang, khay y 932 | HUD 2 hàng, khay dính đáy (hạt y 468–560), không tràn ngang (`scrollWidth` 320) |
| 1366×768 | thanh 39 px, Âm thanh / ? trong hàng công cụ | thanh 44 px, Âm thanh / ? ở góc phải thanh; HUD, nhiệm vụ, bản đồ, khay như cũ (dời xuống 5 px) |

Số lớn (xu 1.234.567, kho 270/60): 390/360 HUD xuống 2 hàng, số kho nằm trọn trong ô chỉ số, không đè nút Thu hết; 844×390 và 1366 vẫn 1 hàng.

## QCK-04 · Vùng chạm ≥ 44×44 px (7 game nhỏ)

Kiểm bằng `elementFromPoint` ở 8 điểm biên ô 44×44 quanh tâm mỗi nút / link đang hiện (menu, đang chơi, tạm dừng) × 390×844, 844×390, 1366×768, 320×568.

| Game | Trước | Thay đổi |
|---|---|---|
| Tất cả 7 | "← Trang chủ" 92×23 (Bắn Bóng / Đua Xe điện thoại 79×20) | `.bar a::after` mở vùng chạm lên 44 px cao (chữ giữ cỡ); `.bar a { z-index: 40 }` để phần thò xuống không bị lớp phủ menu (bắt đầu ngay dưới thanh) che |
| Rắn, Xếp Gạch | Tạm dừng / Âm thanh 36×24 (dọc, xếp chồng), 40×38 (ngang), 40×44 (máy tính) | Dọc: hai nút nằm cạnh nhau 44×44; ngang `min-height` 44; `.btn--icon` `min-width` 44 |
| Xếp Gạch | Ô chọn cấp bắt đầu 34×34 | 44×44 |
| Bắn Bóng, Ghép Kẹo | Âm thanh cạnh HUD 36 px ngang; nút "∞ Tự do" 34 px cao; xoay ngang Đổi viên / Gợi ý / Menu / Âm thanh 36 px cao | `min-width` 44; `min-height` 44 |
| Đua Xe | Tạm dừng / Âm thanh 40×40 (dọc), 38×36 (ngang); nút "Mua · … xu" 40 px cao | 44×44; 44 px cao |
| Đào Vàng | Tạm dừng / Âm thanh / Về menu 40 px cao | `.btn` `min-height` 44 (nút lớn giữ 52) |
| Nối Thú | Ngang: Gợi ý / Đảo / Tạm dừng / Âm thanh 36 px cao; máy tính Tạm dừng / Âm thanh 40 px ngang | 44 px |

Sau: 0 nút / link thiếu vùng chạm ở cả 4 khung × 3 trạng thái, 7 game; không tràn ngang.

## QCK-01 · Nhãn nội bộ

- Rắn, Xếp Gạch, Bắn Bóng, Ghép Kẹo, Đua Xe, Nối Thú: "Lụm Kèo · bản chơi thử · pixel V5" ⇒ "Lụm Kèo".
- Đào Vàng: `<title>` "Đào Vàng — bản chơi thử" ⇒ "Đào Vàng — Lụm Kèo"; nhãn "Bản chơi thử · pixel art V5" ⇒ "Lụm Kèo".
- Còn lại (agent khác đang sửa, không đụng): 2048, Cờ Caro, Cờ Tướng, Cờ Vua, Đố Vui Nhanh, Nối Từ, Sudoku ("Lụm Kèo · bản chơi thử · pixel V5"); Cờ Cá Ngựa (`<title>` "— bản chơi thử" + nhãn "Bản chơi thử · Hội đua ngựa làng"); Ô Ăn Quan ("Lụm Kèo · trò chơi dân gian · pixel V5").

## Tag cache

- Nông Trại: mọi import `?v=m11` ⇒ `?v=m12` (đã sửa `game.js`, `data/quests.js`; các file khác chỉ đổi tag).
- 7 game nhỏ chỉ sửa `index.html` (không có tag).

## Kiểm thử

- Unit (`node --test`): Nông Trại 175/175 (gồm m5 kiểm một tag `m12`), Rắn 8/8, Xếp Gạch 18/18, Bắn Bóng 18/18, Ghép Kẹo 15/15, Đua Xe 19/19, Đào Vàng 22/22, Nối Thú 13/13.
- E2E Nông Trại (server riêng của worktree): `e2e.mjs` 171/171 (lần chạy đầu 170/171: một lần "không thấy #buildOk" ở bước hàng rào M6, chạy lại 2 lần đều đạt ⇒ chập chờn do máy chạy nhiều agent), `e2e-cards.mjs` 44/44, `e2e-m4.mjs` ALL PASS.
- `_shared/test/sound-press-e2e.mjs`: 245 PASS, 1 FAIL — `do-vui-nhanh 1366 đã trả lời: nút vô hiệu không lún` (game ngoài phạm vi, không sửa). Lần chạy đầu bị `timeout` cắt giữa chừng (213 PASS, 0 FAIL). Cả 7 game nhỏ đều đạt.
- `levelup-share-e2e.mjs`: 63/64 — FAIL `quan-com-tam 1366` hết giờ chờ ảnh khoe (ngoài phạm vi); chạy lại riêng Cơm Tấm 24/24 ⇒ chập chờn. Nông Trại đạt.
- `touch-scroll-e2e.mjs`: 22 đạt, 0 lỗi.
- Đo tay (Chrome headless): vùng chạm 44×44 bằng `elementFromPoint` cho 8 game × 4 khung × 3 trạng thái ⇒ 0 thiếu; `scrollWidth ≤ innerWidth` ở 320/360/390/844/1366 cho cả 8 game; Nông Trại: chạm hạt ⇒ chạm ô ⇒ gieo được (390 và 844), mở/gập nhiệm vụ, mở Kho rồi về Hạt giống.
- `node tools/cache-tags/check-tags.mjs master` ⇒ `OK: 66 file tĩnh đổi, mọi tham chiếu ?v= tới chúng đã đổi tag.`

## Chưa làm / đề xuất

- TLC1-06 (nút "Xem thêm → / Phía Đông →" che biển Làng / xe giao hàng) không thuộc đợt này; ở xoay ngang nút vẫn nằm góc trên phải bản đồ.
- Nông Trại 320×568: ruộng nằm dưới khay dính đáy, phải cuộn lên một chút (màn quá thấp cho HUD + bản đồ 760 px + khay).
- Xu rất lớn trên điện thoại làm HUD thành 2 hàng (+50 px). Có thể rút gọn số ("1,2 tr") nếu muốn luôn 1 hàng.
- Đào Vàng 844×390: trang vẫn cao 504 px ở menu (có từ trước, không thuộc QCK-04).
- Đề xuất chung (`_shared/`): một lớp tiện ích `.hit44` (mở vùng chạm bằng `::after`) để các game khác dùng thay vì chép CSS.
