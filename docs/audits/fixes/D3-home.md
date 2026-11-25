# D3 — Trang chủ theo hướng chủ dự án: tên tự sinh, ô hồ sơ, bảng xếp hạng, điều hướng, màn đầu điện thoại

Nhánh `claude/d3-home` (từ master `27ac178`). Mục: **P-A, P-B, P-C, P-D, P-E, HOME-02, HOME-04, HOME-05, HOME-09, HOME-11, HOME-15,
HOME-16, HOME-17, QCK-03** (`docs/audits/IMPROVEMENT_ROADMAP.md` Đợt 3 + "Quyết định của chủ dự án 25/11/2026").
Tham khảo dautri.com về cấu trúc (khách có tên ngay, ô hồ sơ, bảng xếp hạng dễ thấy), giữ pixel V5 (`portal-pixel.css`, theme-b).

## P-A — Tên khách tự sinh dùng chung (`prototype/games/_shared/account.js`)

API ổn định, ghi ở đầu file (agent làm 10 game online dùng `getName / setName / onNameChange`, **đừng đổi chữ ký**):

| Hàm | Trả về | Ghi chú |
|---|---|---|
| `getName()` | string, **không bao giờ rỗng** | Lần đầu: lấy tên cũ trong game (`ma-soi:name`, `dat-bom:name`, `ai-la-noi-gian:name`) nếu hợp lệ, không thì sinh "<Con vật/Danh xưng> <Tính từ> <NN>" và lưu |
| `setName(name)` | `{ ok, name, error }` | Đồng bộ, chỉ lưu máy. Kiểm 2–16 ký tự, chỉ chữ/số/dấu cách/`. _ - '`. Lỗi ⇒ câu tiếng Việt hiện thẳng, tên cũ giữ |
| `isGenerated()` | boolean | Tên đang là tên tự sinh |
| `onNameChange(cb)` | hàm huỷ | Gọi khi đổi ở trang này **và** tab khác (sự kiện `storage`) |
| `saveName(name, {syncBoard})` | Promise `{ ok, name, error }` | Như setName + hỏi bộ lọc máy chủ `POST /api/name/check`, rồi đổi tên trên bảng hôm nay nếu đã có danh tính |
| `rerollName()`, `randomName()`, `checkName()`, `avatarSvg(name, px)` | | Tên ngẫu nhiên khác; kiểm không lưu; avatar pixel 8×8 sinh từ tên |

- Địa chỉ import mới: `../_shared/account.js?v=name1`.
- Bản lưu `wgp.account.v1` giữ nguyên khoá + dạng `{v:1,…}`, thêm trường `gen`. Người đã có tên ⇒ giữ; người cũ bấm "Bỏ qua" (tên rỗng) ⇒ được tên tự sinh. Dữ liệu `sent`, `devId` giữ.
- Kho tên: 39 đầu × 42 đuôi, lọc độ dài ⇒ ~1.200 cặp × 100 số. Trộn cute ("Cute", "Mập", "Lém Lỉnh", "Ú Nu"…) và cục súc hài ("Cáu Kỉnh", "Láo", "Lầy", "Hổ Báo", "Báo Thủ", "Hẻm"…). Không có từ về vùng miền / giới tính / ngoại hình của người (Mập/Ú Nu chỉ tả con vật).
- Test `games-server/name-gen.test.mjs` duyệt **hết** tổ hợp × 00–99 (~120.000 tên) qua `moderation.cleanPlayerName` (phòng online) + `names.cleanName` (bảng xếp hạng). Test đã bắt được 2 tổ hợp dính bộ lọc ("Sóc Chợ", "Bạch Tuộc Chợ" — chuỗi con "occho") ⇒ bỏ đuôi "Chợ" thay "Phố"; bỏ "Khủng Long", "Chiến Thần", "Tinh Nghịch" (quá dài, không ghép được).
- Máy chủ: thêm `POST /api/name/check` (`games-server/account/index.mjs`, định tuyến ở `server.js`) — không cần danh tính, chạy cả khi bảng tắt, có giới hạn 20 lần/phút/IP. `{name}` ⇒ `{ok:true,name}` (đã làm sạch) | `{ok:false}`.
- Bảng kết quả Thử thách (`daily-board.js`): **bỏ bước hỏi tên**, gửi thẳng bằng `getName()`. Nút "Đổi tên" kiểm 2–16 ký tự ở máy, báo lỗi đỏ (HOME-15), qua bộ lọc máy chủ rồi đổi tên trên bảng. Máy chủ trả "Người chơi" (tên bị lọc) thì máy KHÔNG ghi đè tên chung.

## P-B — Ô hồ sơ (`prototype/homepage/profile.js`, `nav.css`)
- Góc phải thanh trên (desktop 224 px cố định, điện thoại `clamp(118px, 40vw, 176px)` trong hàng dính) — bề rộng cố định nên điền tên sau không xô bố cục. Tên có sẵn được script nội tuyến điền ngay lúc tải.
- Avatar pixel 8×8 sinh từ tên (tai theo con vật: Mèo/Cáo nhọn, Gấu/Heo tròn, Thỏ dài, Vịt/Gà/Ếch chỏm lông; màu + mắt theo hash).
- Chạm/Enter ⇒ popover (`role=dialog`, `aria-expanded`): sửa tên + "Lưu", lỗi rõ, "Tên ngẫu nhiên khác", chuỗi ngày / hôm nay x/3 / dài nhất, hạng hôm nay (chỉ hỏi máy chủ khi mở và đã xong ≥ 1 đề), nút Bảng xếp hạng + Thử thách #N.
- Esc / bấm ra ngoài / Tab ra ngoài / nút × đóng; Esc + × trả focus về nút. Có chuột ⇒ focus sẵn ô tên; cảm ứng ⇒ focus nút × (không bật bàn phím ảo). Mọi nút ≥ 44 px, ô tên 16 px.

## P-C — Trang Bảng xếp hạng (`prototype/homepage/bang-xep-hang.html` + `.js` + `.css`)
- Đầu trang: 3 thẻ "Thử thách hôm nay" (dùng lại `daily.css`, trạng thái Chơi ngay / Đã xong ✓, chuỗi, "🏆 Hạng #N/M").
- Bảng: tab Sudoku / 2048 / Đố Vui (ARIA tabs, ← → Home End) × Hôm nay #N / Hôm qua #N-1; 50 dòng, avatar mỗi dòng, dòng của mình tô teal + nhãn "Bạn"; chưa chơi ⇒ nút "Chơi … để có tên trên bảng"; bảng tắt / lỗi mạng có thông báo + Thử lại. URL giữ lựa chọn `?game=…&day=hom-qua`; bảng kết quả trong game có link "Xem bảng xếp hạng đầy đủ →" mở đúng tab.
- Chỉ đọc (`create:false`): xem bảng không tạo danh tính mới.
- **HOME-16**: `scoreLabels()` trong `daily-board.js` — dòng cùng điểm rút gọn mà khác score ⇒ thêm tiêu chí phụ suy ra từ score: Đố Vui "4/5 · 3,8 giây", 2048 "Ô 512 · 6.120 điểm", Sudoku "4:12 · phạt +0:30". Dùng cả ở trang này lẫn bảng trong game. Test `prototype/games/_shared/test/board-labels.test.mjs`.

## P-D — Thanh điều hướng + h1
- Chơi (`#games`) · Phòng online (`#lobby`) · Thử thách (`bang-xep-hang.html#thu-thach`) · Bảng xếp hạng. Icon pixel 16×16, mục hiện tại gạch vàng.
- > 1180 px: một hàng logo · điều hướng · tìm · hồ sơ. 721–1180: điều hướng xuống hàng 2. ≤ 720: hàng dính = logo + ô hồ sơ; dưới là hàng chip 44 px cuộn ngang (nhãn gọn "Phòng", "Xếp hạng") + ô tìm.
- `<h1>` ẩn trực quan (logo + slogan đã nói) cho SEO / trình đọc màn hình. Trang bảng xếp hạng có h1 hiện.

## P-E — Thu nhỏ "Thử thách hôm nay"
- Bỏ hàng 3 thẻ lớn trên trang chủ (`daily.css` không còn nạp ở trang chủ).
- Nhãn vàng "★ Thử thách" (đã xong: teal "✓ Thử thách #N") trên thẻ Sudoku / 2048 / Đố Vui — là **link riêng** sang `?daily=1`, đặt cạnh thẻ (không lồng link), vùng chạm mở rộng ~44 px, lún khi bấm (press-nav).
- Người có chuỗi ngày thấy 1 dòng: "🔥 Chuỗi 3 ngày · Hôm nay còn: Sudoku #2 · 2048 #2" (xong cả 3 ⇒ "Xong cả 3 thử thách hôm nay ✓ Xem hạng"). Dựng bằng script nội tuyến (không nhảy bố cục), `daily.js` vẽ lại khi quay về / tab khác / qua ngày.

## HOME-02 — Màn đầu điện thoại
- Dải "Chơi ngay · miễn phí · không cần tải" dưới slide: 8 game (`QUICK_PLAY`), 2 hàng × 3,2 ô cuộn ngang, viết sẵn trong HTML (giữ chỗ), ảnh gắn lười; màn > 720 px ẩn, không tải ảnh.
- Sảnh còn 1 hàng: [mã phòng][Vào][+ Tạo phòng]; nhãn / dòng lỗi trải hết bề ngang, không đẩy hàng nút.
- Kết quả 390×844: **7 thẻ game thấy trọn** (slide + 6 ô Chơi ngay) + cả hàng mã phòng trong màn đầu (trước: 0 thẻ game, 1,5 thẻ thử thách).

## HOME-04 / 05 / 09 / 11
- **HOME-04** bỏ `maxlength`; `pickCode()` lọc rồi cắt; dán câu ⇒ lấy cụm đúng 5 chữ-số đứng riêng (ưu tiên có số, rồi viết HOA sẵn, rồi cụm cuối): " WEBYS", "Mã: WEBYS", "vào phòng WEBYS nhé" ⇒ WEBYS.
- **HOME-05** ô tìm 16 px trên ≤ 720 px.
- **HOME-09** khớp tên + thể loại (kệ, danh mục) + số người ("2 nguoi" khớp "2–4 người", số phải nguyên từ nên không khớp "2048") + chế độ + vài từ hay gõ (`SEARCH_WORDS` trong `games.js`); có từ khoá thì tìm trong mọi game (tab bỏ chọn); bấm tab khi đang tìm ⇒ bỏ từ khoá. Rỗng ⇒ "Không tìm thấy game nào cho “…”." + 4 game gợi ý.
- **HOME-11** thẻ "Tài trợ" SpeakUp Kids cùng cỡ thẻ game, cuối kệ cuối (Trí tuệ), nhãn "Tài trợ" rõ, hình vẽ bằng CSS (không ảnh mới). Nội dung lấy từ khối cũ ở `abce682` ("SpeakUp Kids — Tiếng Anh cho bé qua trò chơi"). **Khối cũ có `href="#"` (chưa từng có link thật)** ⇒ `window.SPONSOR.url` trong `games.js` để trống: thẻ hiện nhưng không bấm được; điền `https://…` là thành link mở tab mới `rel="sponsored noopener"`. Đã xoá CSS `.sponsor*` thừa trong `styles.css`.

## HOME-17 + QCK-03 — Bảng kết quả Thử thách (`daily-ui.js`, 2048 / Sudoku / Đố Vui)
- Lớp phủ bắt đầu **dưới** thanh trên của game ⇒ "← Trang chủ" luôn bấm được (e2e kiểm bằng elementFromPoint ở 1366 và 390).
- Thêm nút "Về trang chủ"; dòng "Còn: Sudoku #N · 2048 #N" (link sang 2 thử thách chưa chơi) hoặc "Xong cả 3 thử thách hôm nay ✓".
- Esc = "Xem bàn" (HOME-18).

## Cache tag (`?v=`)
`account.js`/`daily-board.js`/`daily-ui.js` ⇒ `name1` (và `game.js?v=name1` ở 3 index.html); trang chủ `styles.css`, `portal-pixel.css`, `games.js`, `app.js`, `press-nav.js`, `daily.js` ⇒ `d3a` (cả `quyen-rieng-tu.html`); file mới `nav.css`, `profile.js`, `bang-xep-hang.*` ⇒ `d3a`. `node tools/cache-tags/check-tags.mjs master` ⇒ xem mục Test.

SỐ_ĐO_VÀ_TEST
