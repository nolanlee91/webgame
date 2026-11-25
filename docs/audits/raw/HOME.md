# REPORT — HOME (trang chủ & cổng game)
(Agent không ghi được file — coordinator chép từ báo cáo gửi qua tin nhắn. Ảnh: `shots/` 63 PNG; số đo thô `s*-*.json`.)

## Phạm vi đã chạy thật
Server 8901 (bảng xếp hạng memory). Viewport 320×568, 360×800, 390×844 (dpr3 chạm), 412×915, 768×1024, 844×390, 1366×768, 1440×900, 1920×1080. Hero (vuốt thật, phím, đổi cỡ, giảm chuyển động); sảnh (trống / có 2 phòng Cờ Caro từ 2 profile / API bị chặn / offline; mã sai, emoji, 26 ký tự, dán kèm chữ; ?room=); Thử thách Đố Vui 2 người (hỏi tên, bảng xếp hạng, Đổi tên, Khoe); bảng Khoe (Rắn Săn Mồi 390/320/1366); 22 truy vấn tìm kiếm; lún + tiếng bụp; Tab 60 điểm dừng; tương phản 24 cụm chữ; mạng chậm (~640 kbps, 400 ms, CPU 4×, tắt cache) đo CLS; chặn thumb / Google Fonts / API sảnh; trang quyền riêng tư; play.html; 404; số chạm tới lúc chơi; so sánh poki.com + dautri.com (390/1366, chỉ xem).

## Hạng: B− (0 P0, 2 P1, 10 P2)
| Hạng mục | Điểm | Ghi chú |
|---|---|---|
| Thị giác / pixel V5 | 8 | Nhất quán; trừ: thumb 480×360 thu mượt về 113 px, Georgia dự phòng vỡ dấu, 16/25 game có nhãn MỚI/HOT |
| UX điện thoại | 6 | Không tràn 320–412; trừ: màn đầu không có thẻ game, sảnh chiếm ~40% màn đầu, ô tìm 14 px, lỗi dán mã, màn ngang chỉ thấy hero |
| Trải nghiệm cổng → game | 7 | 2–3 chạm, không bắt đăng nhập |
| Điều hướng | 7 | Tab/kệ khớp, "Tạo phòng mới" cuộn đúng; trừ: giới hạn tìm kiếm, xong Thử thách không có lối sang cái khác |
| Hoạt ảnh / tương tác | 8 | Lún tức thì, chặn chạm đúp, tắt tiếng đúng; trừ: mất focus khi bấm mũi tên hero |
| Hiệu năng | 4 | Tải ngay 2,5 MB; CLS ~1,0–1,2 trên điện thoại; mạng chậm sảnh báo lỗi; tải xong 56 s |
| Accessibility | 7 | Focus rõ 60/60, skip link, lang=vi, tương phản 6,6–15,7:1; trừ: không h1, `<a role=group>`, focus rơi về body |
| Quảng cáo | n/a | Khối SpeakUp Kids đã bị gỡ ở commit `abce682` (18/11), còn CSS `styles.css:244-249,353` |

## Lỗi
- **HOME-01 · P1** · Trang nhảy bố cục khi tải (CLS 1,04/1,22 ở 412; 1,14 ở 390 mạng chậm; 0,39–0,42 ở 1366/1920 một nửa số lần). Hero trống, nút ‹› đè tiêu đề Sảnh, ô tìm kiếm ép logo 2 dòng trước khi JS chạy. Cause: `app.js` cuối body dựng hero/kệ + `placeSearch()` (app.js:247-254), `daily.js` module chạy trễ, không giữ chỗ. Fix: đặt ô tìm bằng CSS, aspect-ratio hero, min-height `#dailyCards`/`#grid`, ẩn `.hero__nav` tới khi có slide. Acceptance CLS < 0,1 (390/412 mạng chậm + CPU 4×, 1366), đo 3 lần. Ảnh: home-390-slow3g-t1600.png vs -t7000.png; s2-cls.json. Effort M.
- **HOME-02 · P1** · Màn đầu điện thoại chưa đưa người mới vào game: 390 chỉ có hero + khung mã phòng cao 205 px + 1,5 thẻ Thử thách; thẻ game đầu ở y=898; không có câu "miễn phí, chơi ngay, không cần tải"; ngang: hero 332 px chiếm hết. Fix (giữ V5): ≤720 px thu sảnh thành 1 hàng, "Tạo phòng mới" xuống kệ Đối Kháng, dải cuộn ngang 6–8 thumb "Chơi ngay" dưới hero, h1/slogan, hero ≤60vh khi ngang. Acceptance ≥6 thẻ game ở màn đầu 390. Ảnh: home-390x844-fold.png, home-320x568-fold.png, home-844x390-fold.png, compare-poki-390-fold.png. Effort M.
- **HOME-03 · P2** · Tải 2,5 MB ảnh lúc đầu (3 MB sau cuộn), thumb ~100 KB hiện 113 px; mạng chậm `/api/lobby` (timeout 8 s) bị ảnh tranh băng thông ⇒ "Tạm thời không tải được danh sách phòng". Cause: lazy-load tải trước 1.250–2.500 px; 5 slide hero + 10 ảnh "Mở phòng nhanh" (ẩn trên mobile) vẫn tải. Fix: thumb 240w + srcset/sizes, gán src slide khi tới lượt, không render `#quickGrid` ≤720, gọi API sảnh trước + thử lại 1 lần. Acceptance ≤700 KB lần đầu. Effort M.
- **HOME-04 · P2** · Dán mã phòng mất ký tự: " WEBYS"→"WEBY", "Mã: WEBYS"→"MW". Cause `maxlength=5` trên `#roomInlineCode` cắt trước `cleanCode` (app.js:257). Fix bỏ maxlength, cắt sau lọc, dán thì tìm `/[A-Z0-9]{5}/`; kiểm cả `#codeIn` trong game. S.
- **HOME-05 · P2** · Ô tìm kiếm 14 px trên mobile (iOS phóng to). Fix 16px ≤720. S.
- **HOME-06 · P2** · Georgia dự phòng vỡ dấu khi Google Fonts lỗi ("Tâ´t cả game"). `styles.css:17`. Fix tự host subset vietnamese hoặc dự phòng Noto Serif/Times New Roman. S.
- **HOME-07 · P2** · Tên chủ phòng hiện công khai ở sảnh không qua lọc từ tục (`games-server/co-caro/room.js:17-20` cleanName; Ma Sói/Nội Gián cleanText). (Trùng PTY-01 — PTY-01 đã chứng minh bằng từ tục thật ⇒ nâng P0.) S.
- **HOME-08 · P2** · Thẻ phòng desktop cắt mã phòng + tên ("Cờ Caro #MWZ…"). Fix mã `flex-shrink:0`. S.
- **HOME-09 · P2** · Tìm kiếm chỉ khớp tên ("doi khang", "2 nguoi" ra 0), bị giới hạn trong tab không báo, trạng thái rỗng trơ, khu Thử thách chen giữa. `app.js:193-197`. S–M.
- **HOME-10 · P2** · Hero: phím mũi tên làm mất focus; slide là `<a role="group">`. `app.js:51,72-83`. S.
- **HOME-11 · P2** · Khối tài trợ SpeakUp Kids không còn (gỡ trong `abce682`, có lẽ vô tình), CSS thừa. Chủ dự án quyết. S.
- **HOME-12 · P2** · Trang quyền riêng tư "Liên hệ: đang cập nhật"; chưa nói tên chủ phòng hiện công khai ở sảnh. S.
- **HOME-13 · P3** · Không `<h1>`; skip link `#games` khuất dưới header dính (thêm scroll-margin-top).
- **HOME-14 · P3** · Nhãn MỚI/HOT phủ 16/25 game ⇒ hết tác dụng; "Mới" chỉ cho game ≤14 ngày, tối đa ~4.
- **HOME-15 · P3** · Đổi tên quá ngắn âm thầm thành "Người chơi" (`names.mjs:32`); emoji ký tự 15–16 bị cắt nửa.
- **HOME-16 · P3** · Bảng xếp hạng cùng "4/5" khác hạng mà không hiện thời gian ⇒ hiện "4/5 · 3,8s".
- **HOME-17 · P3** · Xong một Thử thách không có lối sang 2 cái còn lại.
- **HOME-18 · P3** · Polish: thẻ game mobile trống ~40% chiều cao; nút ‹› hero mobile đè ảnh; header dính 55–80 px chỉ có logo; play.html game sai title "Đang mở game"; 404 chữ trơn; chữ 10–11 px ở .kicker/.tab__n/.badge; Esc không đóng bảng kết quả Thử thách.

## Điểm tốt
Bản sắc V5 nhất quán, không dấu vết template AI; press-nav (lún + bụp, chặn chạm đúp, reset khi Back, tôn trọng tắt tiếng); tìm không dấu tốt, không chèn HTML; lỗi sảnh tiếng Việt rõ, link mời vào thẳng phòng; không tràn 320–1920; Tab hợp lý, focus rõ; bảng share có vòng focus kín + Esc, vừa 320×568; không bắt đăng nhập; hàng cộng đồng ẩn khi chưa có link; trang quyền riêng tư dễ hiểu, có mục Trẻ em.

## Không kiểm được
iOS/Android thật (phóng to iOS, bfcache Safari, navigator.share thật); âm sắc tiếng bụp (chỉ hook oscillator); Supabase/production; hạng trên trang chủ ở mode off; khối tài trợ (không còn); Lighthouse (agent 7); poki.com/vi 404 (dùng bản EN).

## Quan sát chung
- Poki 390: ~12 thumb màn đầu, 1 chạm vào game. dautri: có h1, bật modal đăng nhập ngay lần đầu; danh sách phòng + "Online 607" là bằng chứng xã hội đáng học. Lụm Kèo mạnh hơn ở chỗ không bắt đăng nhập + có kệ thể loại; yếu hơn Poki ở mật độ game màn đầu mobile.
- Số chạm 390: Đào Vàng 2 (cuộn ~1,5 màn), Cờ Caro với máy 3, Trà Sữa 2 + cuộn; game trong hero 1 chạm.
- Quảng cáo đề xuất (an toàn trẻ em): (1) thẻ "TÀI TRỢ" cùng cỡ thẻ game cuối kệ Giải đố/Trí tuệ; (2) footer trên dòng bản quyền; tránh: trong sảnh, ngay dưới nút Chơi/Vào phòng, thanh dính đáy mobile, bảng kết quả Thử thách. Giữ chỗ cố định, `rel="sponsored noopener"`, cách nút game ≥16 px.
- Gợi ý chéo: `#codeIn` trong game có thể cùng lỗi maxlength; header "← Trang chủ" xuống 2 dòng ở Đố Vui 390; màn giới thiệu Trà Sữa dùng thẻ kem bo góc lớn khác V5; font dự phòng Georgia ở game dùng font-title tương tự.

## §7. Đề xuất theo hướng chủ dự án (giữ V5; dautri chỉ tham khảo cấu trúc)
**Lỗi phân mảnh tìm thêm:** tên người chơi lưu rời rạc: `wgp.account.v1` (bảng xếp hạng, mặc định "Người chơi"), `ma-soi:name`, `dat-bom:name`, `ai-la-noi-gian:name`, và ô `#nameIn` riêng ở Caro/Tướng/Vua/Tỷ Phú/Cá Ngựa/Ô Ăn Quan (Caro trống, chỉ placeholder). Một người gõ tên ~10 lần; tên trên bảng có thể khác tên trong phòng.
- **P-A · cao · M** · Tên khách tự sinh dùng chung toàn site ("Heo Cute 15", "Mèo Mập 42"; ghép 2 danh sách đã kiểm duyệt + số), lưu `wgp.account.v1.name` (cờ auto). `getName/setName` là nguồn duy nhất; mọi ô tên/khoá `*:name` đọc mặc định từ đây và ghi ngược khi sửa; lần đầu ưu tiên tên cũ đã có. Bỏ bước hỏi tên trong bảng kết quả Thử thách. Tên tự sửa đi qua `names.mjs` ở cả bảng xếp hạng lẫn tên phòng (giải HOME-07). Client kiểm 2–16 ký tự (giải HOME-15). Acceptance: khách mới mở Cờ Caro đã có tên; đổi tên ở trang chủ ⇒ Ma Sói + bảng xếp hạng dùng tên mới; không còn "Người chơi" trên bảng.
- **P-B · cao · S–M** · Chip hồ sơ luôn hiện: desktop góc phải thanh đầu; mobile góc phải header (đang trống). Nút V5 gồm avatar 16×16 + tên + ✎; chạm mở popover: sửa tên, chuỗi 🔥N, link Bảng xếp hạng; "Đăng nhập" thêm sau. Không chép chip góc trái dưới cố định kiểu dautri trên mobile (che nội dung, dễ chạm nhầm).
- **P-C · TB · M** · Trang `/homepage/bang-xep-hang.html` (3 tab Sudoku/2048/Đố Vui, hôm nay + hôm qua, dùng lại daily-board.js); link từ điều hướng, popover chip, đầu kệ; thẻ "🏆 Hạng #N/M" bấm mở thẳng trang.
- **P-D · TB · M** · Điều hướng trên cùng theo V5: desktop thanh tab dưới logo hoặc sidebar hẹp chỉ từ ≥1366 (Chơi · Phòng online · Thử thách · Bảng xếp hạng · Cách chơi); mobile nút ☰ hoặc hàng chip cuộn ngang dưới ô tìm. "Ủng hộ" chỉ khi có kênh thật (có thể là chỗ cho SpeakUp Kids). Thêm h1 "Rủ bạn vào chơi: game miễn phí, không cần tải"; hàng nút cộng đồng khi có link.
- **P-E · khuyến nghị HẠ CẤP, không xoá** khu "Thử thách hôm nay": đồng ý nó chiếm chỗ đắt (160 px mobile, đẩy thẻ game xuống y=898; cả 3 đề cùng nhóm giải đố; chen giữa ô tìm và kết quả). Nhưng xoá hẳn mất cơ chế quay lại mỗi ngày (chuỗi, hạng, khoe kiểu Wordle) và dữ liệu cho bảng xếp hạng. Phương án: (1) bỏ khu riêng; thay bằng nhãn "★ Thử thách #N" trên thẻ Sudoku/2048/Đố Vui (xong ⇒ "✓ #N · Hạng #3/4") + mục Thử thách trong điều hướng tới `/homepage/thu-thach.html`; (2) chỉ người có chuỗi > 0 thấy 1 dòng gọn "🔥 Chuỗi 3 ngày · còn 2 đề" dưới hero; (3) bảng kết quả daily thêm "Còn: Sudoku #N · 2048 #N". Lợi: lấy lại ~190 px màn đầu (HOME-02), bớt module chạy trễ (HOME-01).
- **P-F · thấp · M** · Sảnh kiểu dautri: tab "Phòng chờ / Đang diễn ra" + "N người đang chơi" (server cần trả thêm phòng đang chơi; `public-rooms.js` chỉ trả `phase:"lobby"`). Chỉ làm sau khi có lọc tên; chỉ hiện con số khi đủ lớn.
**Thứ tự gợi ý:** P-A + P-B → P-E (cùng HOME-02) → P-C + P-D → P-F. Không cần asset mới (trừ avatar 16×16 tuỳ chọn).
