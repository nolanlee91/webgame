# REPORT v2: HOME (trang chủ và cổng game)

Snapshot `ab70036` (worktree `audit2`, chỉ đọc). Ảnh và số đo thô nằm ở scratchpad của phiên audit (`audit2/HOME/shots/` 36 PNG, `s3-vitals.json`, `s1-_homepage_.json`, `s*.log`). Thư mục này không commit.

## 1. Phạm vi đã chạy thật

- **Server và trình duyệt.** `PORT=9101 node server.js` (bảng xếp hạng chế độ memory, `/api/config` → `supabase:false`). Chrome headless qua `_shared/test/cdp.mjs`, mỗi lần đo dùng hồ sơ mới.
- **Viewport.** 320×568, 360×800, 390×844 (dpr 3, chạm), 412×915 (dpr 2,6), 768×1024, 844×390, 740×360, 568×320, 1181, 1280, 1366, 1440, 1536 và 1920 (nav).
- **Màn đầu.** Đếm thẻ game thấy trọn, kiểm tràn ngang và vị trí từng khối.
- **Chạm thật** (`Input.dispatchTouchEvent`, hook âm thanh `audit-lib.mjs`):
  - Cuộn dọc nhanh và chậm qua thẻ, vuốt ngang dải "Chơi ngay", vuốt slide, di 8 px.
  - Chạm thẻ, slide, thẻ lưới và nhãn ★ Thử thách.
  - Chạm 6 nút thường. Chạm khi đã tắt tiếng.
  - Đo khoảng thời gian `pointerdown` → `pointercancel` ×3.
- **Sảnh.** Mở 3 phòng Cờ Caro thật qua WebSocket (1 phòng tên dài) và 1 phòng Cờ Vua 2/2. Kiểm tab "Phòng chờ / Đang diễn ra" bằng chuột và phím →. Mã phòng sai, mã đúng, `?room=`.
- **Dán mã phòng.** 7 chuỗi qua `Input.insertText`.
- **Tìm kiếm.** 13 truy vấn.
- **Hồ sơ.** Chạm mở. Đổi tên 6 trường hợp (1 ký tự, tên tục, hợp lệ, 24 ký tự, emoji, toàn dấu cách), "Tên ngẫu nhiên khác", Esc trả focus. Enter mở bằng bàn phím ở 1366.
- **Nút Google.** Đếm request tới settings, supabase và google.
- **Bàn phím.** Tab 45 điểm dừng ở 1366, skip link, phím mũi tên ở hero.
- **Tương phản.** Quét tự động, rồi kiểm tay các trường hợp nền gradient.
- **CLS/LCP.** Slow 4G (150 ms, 1,6 Mbps) + CPU 4× ở 390 dpr 3, 412 dpr 2,6, 1366 và 844×390; thêm mạng "chậm v1" (400 ms, 640 kbps) ở 390. Mỗi cỡ 3 lần, có cuộn hết trang để bắt shift do ảnh lười.
- **Byte ảnh màn đầu.** Ở 390 với dpr 1, 2, 3 và ở 1366.
- **Trang con.** `bang-xep-hang.html` (390 và 1366), `quyen-rieng-tu.html`, `play.html` (game không có), 404.
- **So sánh (chỉ xem).** poki.com, dautri.com và lumkeo.com bản đang chạy, ở 390 và 1366.

## 2. Hạng: **B** (0 P0, 2 P1, 5 P2, 8 P3). Lần 1: B− (2 P1, 10 P2)

Cổng trang chủ không phải một game. Hạng ở đây áp cho luồng cổng → game của người mới trên điện thoại.

| Trang | Hạng | Ghi chú |
|---|---|---|
| Trang chủ (điện thoại dọc) | **A−** | 7 game ở màn đầu 360–412, CLS 0, chạm/cuộn đúng, tên khách có sẵn |
| Trang chủ (xoay ngang 844/740) | **B+** | Màn đầu có 7 game. Ô tìm 14 px (iOS sẽ phóng to) |
| Trang chủ (máy tính 1181–1920) | **B−** | Mục điều hướng "Bảng xếp hạng" bị ô tìm đè ở **mọi** bề rộng (P1) |
| Bảng xếp hạng | B+ | Có h1, tab ARIA, không tràn. Trạng thái rỗng rõ ràng |
| Quyền riêng tư | C+ | Hứa "gửi yêu cầu xoá" nhưng không có kênh liên hệ (P1 khi bật Google) |
| play.html / 404 | C | 404 vẫn là chữ trơn "Not Found". play.html không tìm thấy game vẫn để title "Đang mở game" |

## 3. Điểm theo hạng mục

| Hạng mục | Lần 1 | Lần 2 | Ghi chú |
|---|---|---|---|
| Thị giác / V5 | 8 | **8** | Nhất quán, font tự host. Trừ: nhãn nav bị cắt ở máy tính, 16/25 game vẫn gắn MỚI/HOT, thẻ lưới mobile trống ~40% chiều cao |
| UX điện thoại | 6 | **8** | Màn đầu 390: 0 → 7 thẻ game. Dán mã đúng, ô tìm 16 px khi dọc. Trừ: ô tìm 14 px khi ngang và ở tablet, chip "Phòng" đưa tiêu đề vào dưới thanh dính |
| Trải nghiệm cổng → game | 7 | **8** | 1 chạm từ màn đầu, không bắt đăng nhập, tên tự sinh dùng chung |
| Điều hướng | 7 | **7** | Có nav, h1, trang xếp hạng. Trừ: nav desktop bị đè, skip link và chip rơi dưới header, 404 trơn |
| Hoạt ảnh / tương tác | 8 | **8** | Cuộn không bụp 5/5 tình huống, chạm bụp 1 lần (2 oscillator = 1 nốt), tắt tiếng đúng. Trừ: mất focus ở hero, chạm đúng lúc slide chuyển thì hụt |
| Hiệu năng | 4 | **6** | CLS ≈ 0. Sảnh không còn báo lỗi khi mạng chậm (15/15). LCP 3,3–4,4 s (390), 1,5–1,65 MB lúc tải ở dpr 3 |
| Accessibility | 7 | **7** | Có h1 ẩn, focus thấy rõ 45/45, Esc/Enter ở hồ sơ, tab sảnh dùng phím được. Trừ: phím ← → ở hero đẩy focus về body, skip link không chuyển focus |
| Quảng cáo | n/a | **n/a (độ sẵn sàng 7/10)** | Thẻ Tài trợ SpeakUp Kids có sẵn trong code (`app.js sponsorHTML`, cuối kệ cuối, `rel="sponsored noopener"`, cùng cỡ thẻ game), ẩn vì `SPONSOR.url=""` (`games.js:80`). Ngoài thẻ này chưa có vị trí nào khác (footer) |

## 4. Bảng đối chiếu

| ID | Trạng thái | Bằng chứng |
|---|---|---|
| HOME-01 CLS | **ĐÃ SỬA** | Slow 4G + CPU 4×, 3 lần mỗi cỡ, có cuộn hết trang: CLS 390 dpr3 = 0/0/0; 412 = 0/0,0003/0,0005; 844×390 = 0/0/0; 390 mạng v1 = 0,0001 ×3; 1366 = 0,013–0,014 (shift duy nhất ở `DIV.lobby__quick` 0,012). `s3-vitals.json` |
| HOME-02 màn đầu | **ĐÃ SỬA** | Thẻ game thấy trọn: 320 → 4, 360/390/412 → 7, 844×390 → 7, 740×360 → 7 (trước đó 0). Có dòng "Chơi ngay · miễn phí · không cần tải". Ảnh `fold_homepage_390x844.png`, `fold_homepage_844x390.png` |
| HOME-03 dung lượng / sảnh lỗi | **SỬA MỘT PHẦN** | Sảnh: 15/15 lần đo mạng chậm hiện đúng "Chưa có phòng…" (trước đó báo lỗi). "Mở phòng nhanh" không dựng khi ≤720. Nhưng dung lượng lúc tải: dpr 1 = 905 KB (ảnh 657 KB), dpr 3 = **1.540–1.650 KB**, trong đó 12 thumb bản gốc 720w và 0 bản nửa, vì `sizes` 34vw/45vw × dpr 3 > 360w. Mục tiêu ≤700 KB chưa đạt. Sau khi cuộn hết: 2,9–3,2 MB. `s6-bytes`, `s3-vitals.json` |
| HOME-04 dán mã | **ĐÃ SỬA** | " WEBYS", "Mã: WEBYS", "vào phòng webys nhé" → WEBYS. Link `…?room=AB12C` → AB12C. "Mời vào phòng XJB62 trên Lụm Kèo" → XJB62. Mã đúng → `/games/co-caro/?room=XJB62`. Mã sai → "Phòng đã đóng hoặc mã phòng chưa đúng." |
| HOME-05 ô tìm 14 px | **SỬA MỘT PHẦN** | 16 px ở 320–412 và 568×320. **Vẫn 14 px ở 844×390, 740×360 (điện thoại ngang) và 768×1024 (iPad)** ⇒ iOS vẫn phóng to. `s1-_homepage_.json` (fontQ) |
| HOME-06 Georgia | **ĐÃ SỬA** | 0 link googleapis ở 4 trang. `--font-title: "Roboto Slab","Noto Serif","Times New Roman"` (`styles.css:18`). Font tự host |
| HOME-07 tên chủ phòng | **ĐÃ SỬA** | `public-rooms.js:5` dùng `cleanPlayerName`. "dit me", "Đ.ị.t", "cặc to" → "Người chơi" |
| HOME-08 cắt mã phòng | **ĐÃ SỬA** | Có 3 phòng thật: `nameClipped:false` ở 390 và 1366 |
| HOME-09 tìm kiếm | **ĐÃ SỬA** | "doi khang" → 10, "2 nguoi" → 8, "online" → 10, rỗng có gợi ý 4 game, không chèn HTML. Còn lỗi nhỏ ở HOME2-09 |
| HOME-10 hero focus / role | **CHƯA SỬA** | Focus slide rồi nhấn ArrowRight ⇒ `activeElement === body` (slide cũ thành inert). `index.html:92` vẫn là `<a … role="group">` |
| HOME-11 tài trợ | **ĐÃ SỬA** (theo quyết định của chủ dự án) | Thẻ ẩn khi chưa có link, CSS thừa đã xoá |
| HOME-12 quyền riêng tư | **SỬA MỘT PHẦN** | Đã nói tên công khai trong phòng online (`quyen-rieng-tu.html:67`). "Liên hệ: đang cập nhật" vẫn còn (`:102`, `community.js contactEmail:""`). Xem HOME2-02 |
| HOME-13 h1 / skip link | **SỬA MỘT PHẦN** | Có h1 ẩn trực quan ở trang chủ, h1 hiện ở bảng xếp hạng. Skip link ở 1366: `#games` top = 0, nằm dưới header dính 71 px; focus = BODY. `#games` không có scroll-margin (chỉ `.shelf` có, `styles.css:266`) |
| HOME-14 MỚI/HOT | **CHƯA SỬA** | Lưới: Mới 12 + Hot 4 = 16/25 thẻ. Kệ Tập Làm Chủ 3/4 MỚI |
| HOME-15 đổi tên | **ĐÃ SỬA** | "A" → "Tên cần ít nhất 2 ký tự."; 24 ký tự → "Tên tối đa 16 ký tự (đang có 24)."; emoji → báo ký tự; toàn dấu cách → "Bạn chưa nhập tên." |
| HOME-16 4/5 cùng hạng | **ĐÃ SỬA** (kiểm bằng test) | `board-labels.test.mjs` 4/4 đạt. Chưa thấy trên bảng thật vì bảng memory trống |
| HOME-17 lối sang thử thách khác | **ĐÃ SỬA** (kiểm mã) | `daily-ui.js:125` có nút "Về trang chủ", dòng "Còn: …". Esc ở `:169` |
| HOME-18 polish | **SỬA MỘT PHẦN** | Đã sửa: Esc ở bảng kết quả, header mobile có ô hồ sơ. Chưa sửa: 404 trơn "Not Found" không title; play.html game không có ⇒ title "Đang mở game — Lụm Kèo"; nút ‹ › hero vẫn đè ảnh; thẻ lưới mobile trống ~40%; chữ 10–11 px (`.kicker` 10, `.tab__n` 10, `.badge` 11, `.tile__chal` 10–11) |
| P-A tên khách | **ĐÃ SỬA** | Khách mới có ngay `{"name":"Sư Phụ Khó Ở 90","gen":true}` |
| P-B ô hồ sơ | **ĐÃ SỬA** | Chạm mở, focus nút ×. Esc đóng và trả focus về `meBtn`. Enter (1366) mở và focus ô tên. Nút ≥44 px trừ "Lưu" (40) |
| P-C bảng xếp hạng | **ĐÃ SỬA** | Trang chạy 390/1366, không tràn, không lỗi console |
| P-D điều hướng | **ĐÃ SỬA, có lỗi mới** | Xem HOME2-01 |
| P-E thu nhỏ Thử thách | **ĐÃ SỬA** | Nhãn ★ Thử thách: chạm ⇒ bụp + `/games/2048/?daily=1` |
| P-F tab sảnh | **ĐÃ SỬA** | Tab "Phòng chờ 3 / Đang diễn ra 0", phím → chuyển tab, có câu báo trống. "N người đang chơi" ẩn khi <20 (5 người ⇒ ẩn). Chưa thấy dòng "X bàn đang chơi" vì phòng Cờ Vua 2/2 chưa bắt đầu ván |
| Google ẩn | **ĐẠT** | Mở hồ sơ: `#meAcct hidden=true`, rỗng. 0 request tới settings/supabase/google |

**Tổng:** ĐÃ SỬA 17 (HOME 11 + P-A…P-F 6). SỬA MỘT PHẦN 5 (03, 05, 12, 13, 18). CHƯA SỬA 2 (10, 14). HỒI QUY 0.

## 5. Lỗi mới

- **HOME2-01 · P1 · Thanh điều hướng máy tính.**
  - **Vấn đề.** Mục "Bảng xếp hạng" bị ô tìm kiếm đè ở **mọi** bề rộng >1180 px, thấy chữ "Bảng xếp hạ". Đo được:

    | Bề rộng | Mép phải nav | Mép trái ô tìm |
    |---|---|---|
    | 1181 | 705 | 616 |
    | 1366 | 768 | 738 |
    | 1920 | 1045 | 1015 |

    `.mainnav` có scrollWidth 511 > clientWidth 461, `overflow: visible`. Bản đang chạy lumkeo.com cũng bị: lỗi có từ D3, không phải hồi quy của D6.
  - **Nguyên nhân.** Cột nav `minmax(0,1fr)` trong `nav.css:8`, `topbar__inner` max 1240 px.
  - **Sửa.** Dùng nhãn ngắn "Xếp hạng" ở ≤1440 (nhãn này đã có sẵn trong DOM), hoặc đổi cột nav thành `auto` và ô tìm thành `minmax(160px,300px)`, giảm gap.
  - **Chấp nhận.** Ở 1181/1280/1366/1440/1920: `mainnav.scrollWidth ≤ clientWidth` và mép phải mục cuối < mép trái ô tìm. Ảnh `fold_homepage_1366x768.png`, `fold_homepage_1920x1080.png`.
  - **Effort.** S.
- **HOME2-02 · P1 (chặn trước khi bật Google) · `quyen-rieng-tu.html`.**
  - **Vấn đề.** Trang hứa "gửi yêu cầu… xoá trong 7 ngày" và "gửi yêu cầu từ chính email đó", nhưng "Liên hệ: đang cập nhật" (`:102`). Không có kênh nào để xoá dữ liệu. Google OAuth (consent screen) cũng cần chính sách có liên hệ. Ngoài ra trang ghi "Google Fonts" ở mục "Lưu ở đâu", trong khi trang chủ đã tự host font.
  - **Sửa.** Điền `COMMUNITY.contactEmail` (email công khai) hoặc thêm form liên hệ. Sửa dòng font.
  - **Chấp nhận.** Trang hiện một kênh liên hệ thật. Checklist trong GOOGLE-LOGIN-SETUP ghi rõ điều kiện này.
  - **Effort.** S.
- **HOME2-03 · P2 · Ô tìm ở điện thoại ngang và tablet.**
  - **Vấn đề.** `#q` 14 px ở 844×390, 740×360 và 768×1024 ⇒ iPhone xoay ngang và iPad phóng to khi focus.
  - **Sửa.** `@media (pointer: coarse) { #q { font-size: 16px } }`.
  - **Chấp nhận.** 16 px ở mọi viewport cảm ứng.
  - **Effort.** S.
- **HOME2-04 · P2 · Nhảy tới mục bị header dính che.**
  - **Vấn đề.** Ở 390, chip "Phòng" đưa `#lobby` lên top 0, tiêu đề "Sảnh chờ trực tiếp" (top 10) và nhãn "Có mã phòng bạn gửi?" nằm dưới thanh 57 px (`chip-lobby-390.png`). Ở 1366, skip link đưa `#games` vào dưới header 71 px và focus ở lại `body`.
  - **Sửa.** `scroll-margin-top` cho `#lobby` và `#games` bằng chiều cao header + 8 px. Đích skip link có `tabindex="-1"` và `.focus()`.
  - **Chấp nhận.** Tiêu đề mục nằm dưới mép header ≥ 8 px ở 390 và 1366. `activeElement` = `#games` sau khi dùng skip link.
  - **Effort.** S.
- **HOME2-05 · P2 · LCP và byte ở máy dpr cao.**
  - **Vấn đề.** Slow 4G + CPU 4×:

    | Cỡ | LCP (3 lần) | Trung vị |
    |---|---|---|
    | 390 dpr 3 | 3.652 / 3.280 / 4.416 ms | ~3,65 s |
    | 412 | 3,9 / 6,3 / 8,5 s | |
    | 1366 | 3,4 / 3,6 / 5,0 s | |
    | 844×390 | 4,1 / 6,1 / 10,6 s | |

    Phần tử LCP luôn là `co-ca-ngua.webp` bản 720w (119 KB). Máy đang chạy song song 6 auditor nên số dao động, nhưng cả 15 lần đều >2,5 s. Ở dpr 3, `sizes` khiến dải "Chơi ngay" tải 12 thumb gốc (~100–140 KB mỗi cái) thay vì bản nửa. "Load" xong sau 12–60 s.
  - **Sửa.** Thêm bản 240w/360w vào srcset và giới hạn mật độ cho thumb (ví dụ `sizes` theo px thật × 2 thay vì vw). Slide 1 dùng bản 360w trên điện thoại (ảnh tranh vẽ lossy nên thu nhỏ không vỡ lưới). Cân nhắc `<link rel=preload imagesrcset>`.
  - **Chấp nhận.** Ở 390 dpr 3 Slow 4G + CPU 4×, trung vị LCP ≤ 2,5 s và byte lúc tải ≤ 900 KB.
  - **Effort.** M.
- **HOME2-06 · P3 · Chạm hero đúng lúc tự chuyển slide thì hụt.** Lúc tự chuyển, slide cũ đã `inert` trong khi vẫn đang nằm dưới ngón tay. `elementFromPoint` trả `DIV.hero__track` ⇒ chạm không làm gì, hoặc mở game của slide mới (s5: 1 lần chạm không chuyển trang, s7: chạm ra Ma Sói thay vì Cờ Cá Ngựa). Ở 6 lần chạm khi slide đứng yên: 6/6 đúng. **Sửa:** chưa đặt `inert` cho tới khi transition xong, và dừng hẳn tự chuyển sau lần chạm đầu. **Effort:** S.
- **HOME2-07 · P3 · Thẻ phòng.** Tên chủ phòng dài bị cắt cứng, không có "…" ("Gấu Trúc Bôn", hostClipped ở cả 390 và 1366). Ở 390 danh sách phòng không lấp hết bề ngang panel, nút "Vào" lệch khỏi mép phải (`lobby-rooms-390.png`). **Sửa:** `text-overflow: ellipsis` và `.rooms` full width. **Effort:** S.
- **HOME2-08 · P3 · Ô hồ sơ luôn cắt tên tự sinh.** Ví dụ "Sư Phụ Xó…" (390), "Cún C…" (320), cả "Ong Đáng Yêu…" ở 844×390 dù còn nhiều chỗ. Bé không thấy trọn tên mình. **Sửa:** ở ≤720 bỏ icon bút hoặc cho 2 dòng 13 px. Ở xoay ngang thì nới bề rộng. **Effort:** S.
- **HOME2-09 · P3 · Tìm kiếm có từ đệm ra 0.** "tro choi 2 nguoi" → 0 và "game cho be" → 0 (mọi từ phải khớp). **Sửa:** bỏ các từ đệm (game, tro, choi, cho, be, danh) trước khi khớp. **Effort:** S.
- **HOME2-10 · P3 · Âm thanh không nhất quán.** Chạm chip điều hướng mobile (link `#lobby`) im lặng, trong khi các nút và thẻ khác đều bụp. **Effort:** S.
- **HOME2-11 · P3.** Nút "Lưu" trong popover hồ sơ cao 40 px (<44). **Effort:** S.
- **HOME2-12 · P3 (rủi ro, chưa tái hiện).**
  - **Vấn đề.** Khi cuộn trên thẻ, `pointercancel` đến 22 / 67 / 66 ms sau `pointerdown`, sát ngưỡng lún 70 ms (`press-nav.js:13`). Lần chạy đầu ghi được 1 lần lún chớp khi cuộn, nhưng 3 lần đo lại không tái hiện. Không lần nào có tiếng (0/5 tình huống cuộn).
  - **Sửa.** Đổi `TOUCH_PRESS_DELAY` thành 100 ms.
- **HOME2-13 · P3 · 568×320 (iPhone SE xoay ngang).** Dải game bắt đầu ở y=291, chỉ thấy 1 thẻ. D5 đã biết. **Sửa:** khi xoay ngang thấp, gộp chip và ô tìm thành 1 hàng.

## 6. Tóm tắt

**Thắng lớn nhất**
1. **Màn đầu điện thoại.** 0 → 7 thẻ game (360–412, 844×390, 740×360), có dòng "miễn phí · không cần tải". Từ màn đầu vào game chỉ 1 chạm. Ngang hàng cách làm của Poki về cấu trúc mà vẫn giữ V5. dautri.com mở trang bằng modal đăng nhập, Lụm Kèo không.
2. **CLS về ~0** trên mọi cỡ, kể cả mạng chậm, CPU 4× và cuộn hết trang. Sảnh không còn báo lỗi giả khi mạng chậm.
3. **Danh tính không ma sát.** Tên khách tự sinh dùng chung toàn site, ô hồ sơ đầy đủ (kiểm tên 2–16 ký tự, lọc tục ở máy chủ, Esc/Enter/focus đúng). Dán mã phòng thông minh. Google ẩn sạch (0 request).

**Vấn đề lớn nhất còn lại**
1. **Nav máy tính bị ô tìm đè** ở mọi bề rộng >1180 (HOME2-01). Đây là lỗi đầu tiên người dùng máy tính thấy, có cả trên bản thật.
2. **Hiệu năng ảnh trên máy dpr cao.** LCP 3,3–4,4 s ở 390 dpr 3 và 1,5–1,65 MB lúc tải, vì `sizes`/srcset chọn thumb 720w (HOME-03 một phần, HOME2-05).
3. **Nợ accessibility và trang phụ.** Hero làm rơi focus (HOME-10), skip link và chip nhảy vào dưới header (HOME2-04), 404 trơn, trang quyền riêng tư không có kênh liên hệ dù hứa xoá dữ liệu (HOME2-02, chặn trước khi bật Google), 16/25 nhãn MỚI/HOT.

## Không kiểm được
- Máy thật iOS/Android: phóng to ô 14 px, fling thật, bfcache.
- Luồng Google thật vì Supabase tắt.
- Dòng "X bàn đang chơi", vì cần một ván đã bắt đầu.
- Bảng xếp hạng có dữ liệu thật (chỉ có unit test).
- Lighthouse.
