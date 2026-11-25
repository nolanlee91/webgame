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

- Địa chỉ import mới: `../_shared/account.js?v=name2`. Thêm `hasCustomName()` (= `!isGenerated()`) cho `online-kit.js`.
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
`account.js` ⇒ `name2`, `daily-board.js`/`daily-ui.js` ⇒ `name1` (và `game.js?v=name1` ở 3 index.html); trang chủ `styles.css`, `portal-pixel.css`, `games.js`, `app.js`, `press-nav.js`, `daily.js` ⇒ `d3a` (cả `quyen-rieng-tu.html`); file mới `nav.css`, `profile.js`, `bang-xep-hang.*` ⇒ `d3a` (sửa sau: `nav.css`, `press-nav.js`, `portal-pixel.css` ⇒ `d3b`). `node tools/cache-tags/check-tags.mjs master` ⇒ xem mục Test.

## Gộp với D3-online (`online-kit.js`)
- Đã merge master `653a141` (10 game online dùng `online-kit.js`). Theo yêu cầu agent game online: thêm `hasCustomName()` (= `!isGenerated()`); sinh tên tự động **không** bật cờ `asked` (chỉ `setName` / tên người chơi gõ mới bật).
- `account.js?v=name2` ở mọi chỗ import (gồm `online-kit.js`), `online-kit.js?v=ok2` ở mọi chỗ tham chiếu, và tăng dây chuyền tag (`…h3`) ở các file game import online-kit.js (game.js/net.js/online.js/app.js + index.html của 10 game) để `check-tags` OK.

## Phụ: press-nav + dải Chơi ngay
- Dải "Chơi ngay" ban đầu có `scroll-snap`: trình duyệt chỉnh vị trí vài px ngay lúc chạm ⇒ sự kiện scroll ⇒ press-nav huỷ chạm (touch-scroll-e2e lỗi chập chờn "chạm giữ ⇒ lún", "chạm thật ⇒ kêu"). Bỏ scroll-snap ở dải này; press-nav giờ chỉ huỷ khi thẻ đang chạm **thật sự dịch > 10 px** khi có scroll.
- Mục điều hướng desktop lún khi bấm (sound-press-e2e kiểm mọi phần tử bấm được).

## Số đo
`tools/perf/home-vitals.mjs` (Slow 4G + CPU 4×, mỗi lần hồ sơ mới, 3 lần), máy đang chạy song song test của agent khác nên LCP dao động.
"Trước" = master `27ac178` (worktree tạm, cổng riêng), "sau" = nhánh này.

| Cỡ | CLS trước | CLS sau | LCP trước → sau (ms, 3 lần) |
|---|---|---|---|
| 390×844 chậm | 0 / 0 / 0 | **0 / 0 / 0** | 1680·1556·1784 → 1392·2928·1436 |
| 412×915 chậm | 0 / 0 / 0 | **0 / 0 / 0** | 1828·1672·1880 → 1648·1572·1692 |
| 1366×768 chậm | 0,0061 / 0,0062 / 0,0061 | **0,0066 / 0,0072 / 0,0066** | 2772·2924·2748 → 2624·2684·2612 |
| 1366×768 nhanh | 0,0001 ×3 | 0,0008 / 0,0008 / 0,0013 | 228 → ~560 (máy bận) |

- Bỏ khu Thử thách khiến "Tất cả game" lên màn đầu 1366 ⇒ lần đo đầu CLS 0,11 (tab lọc `#chips` + `#count` do app.js vẽ trễ). Sửa: tab lọc + số đếm **viết sẵn trong HTML** (= `renderChips()`), CLS về ≈ master.
- Bảng xếp hạng (390 / 1366 chậm): CLS ≤ 0,002.
- Màn đầu 390×844: 7 thẻ game thấy trọn (trước 0). Trang chủ 390 tải thêm ~8 ảnh nửa cỡ của dải Chơi ngay (ảnh nhỏ 240–360w).
- Không tràn ngang 320 / 360 / 390 / 412 / 768 / 844×390 / 1024 / 1366 / 1920 (trang chủ + bảng xếp hạng, e2e), không lỗi console.

## Test
| Lệnh | Kết quả |
|---|---|
| `node --test prototype/games/_shared/test/*.test.mjs` | 48/48 (mới: `board-labels.test.mjs`) |
| `npm run test:account` | 26/26 |
| `node --test games-server/*.test.mjs` | 102/102 (mới: `name-gen.test.mjs` ~25 s, duyệt hết ~120.000 tên). `ws-heartbeat` chập chờn khi máy bận (cả trên master), chạy riêng đạt |
| `node --test server-static.test.mjs` | 8/8 |
| `home-d3-e2e.mjs` (**mới**) | 35/35 — tên tự sinh + bản lưu cũ, ô hồ sơ (Enter/Esc/×, lỗi 2–16, tên tục bị máy chủ từ chối, tab khác đổi theo), điều hướng + h1, tài trợ, tìm kiếm, dán mã, màn đầu 390, 320–1920, trang bảng xếp hạng (tab phím, hôm qua, tô dòng, "4/5 · 15 giây") |
| `daily-e2e.mjs` | 40/40 (sửa có chủ đích: kiểm nhãn ★ Thử thách thay hàng thẻ lớn; thêm Về trang chủ / "Còn: …" / "← Trang chủ" không bị che / Esc; thẻ Đã xong ở trang bảng xếp hạng) |
| `daily-board-e2e.mjs` | 26/26 (sửa có chủ đích: không hỏi tên — tên tự sinh; đổi tên qua "Đổi tên" + lỗi 1 ký tự; hạng #N/M kiểm ở trang bảng xếp hạng; trang chủ người mới được nạp account.js nhưng không gọi API) |
| `share-e2e.mjs` | 53/53 |
| `sound-press-e2e.mjs` | 246/246 |
| `touch-scroll-e2e.mjs` | 22/22 (3 lần liền) |
| `chat-off-e2e.mjs` | 248/250 lần đầu (Nối Từ 390 "B thấy tin của A" — chập chờn), chạy lại `noi-tu` 25/25 |
| `screenshots/check.mjs` | 78/84 — 5 lỗi **có sẵn trên master** (nút vàng/teal portal, Tập Làm Chủ "3 thẻ Sắp ra mắt", "viền mảnh + bo góc", Tiệm Trà Sữa "Sắp ra mắt", hero__dot 37 px ở 360) + "Nông Trại mở thẳng" (chờ 1,5 s, máy bận; lần chạy trước đạt). Sửa có chủ đích: không đếm thẻ Tài trợ là game; hàng dính điện thoại là `.topbar__row` (logo + hồ sơ) |
| `node tools/cache-tags/check-tags.mjs master` | OK |

Ảnh trước/sau (scratchpad, không commit): `shots/before-*.png`, `shots/after-*.png` (390×844, 844×390, 1366×768, 320×568), `shots/after-lb-*.png`, ảnh e2e trong `e2e2/`.

## Cần chủ dự án xem
- **20 tên mẫu** (sinh ngẫu nhiên từ kho): Ếch Tí Hon 14 · Nai Gắt 30 · Mèo Mun Gắt 59 · Kỳ Lân Hớn Hở 13 · Heo Phố 66 · Thánh Ham Ăn 12 · Gấu Đáng Yêu 83 · Gấu Hổ Báo 87 · Rùa Siêu Tốc 07 · Sóc Mập 59 · Gấu Trúc Bông 30 · Kỳ Lân Lầy 16 · Gấu Cà Khịa 42 · Heo Bá Đạo 52 · Sư Phụ Lầy 04 · Ong Ú Nu 29 · Cú Cáu Kỉnh 58 · Hiệp Sĩ Tò Mò 55 · Vịt Láo 22 · Trùm Hẻm 31. Danh sách đầy đủ: `NAME_HEADS` / `NAME_TAILS` đầu `account.js`.
- **Link SpeakUp Kids**: khối cũ là `href="#"`; cần URL thật điền vào `window.SPONSOR.url` (`games.js`).
- Avatar là "con thú" pixel sinh theo hash, chưa đúng từng con (Nai/Voi dùng tai ngẫu nhiên).
- Chưa làm: P-F (sảnh "Đang diễn ra"), hero ≤ 60vh khi điện thoại xoay ngang (844×390 vẫn chủ yếu thấy hero), "Đăng nhập" trong ô hồ sơ.
