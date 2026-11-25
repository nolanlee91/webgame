# REPORT — TTH (Thám Tử Hẻm + Ô Ăn Quan)
(Agent không ghi được file — coordinator chép từ báo cáo gửi qua tin nhắn. Ảnh `shots/` 58 tấm; script `scripts/`; log `*.log.json`, `scripts/*.out`, `bot.log`.)

## Phạm vi đã chạy thật
Server 8904, headless Chromium qua CDP (mô phỏng).
- **Thám Tử Hẻm:** Vụ 1 tốc độ thật 390×844 dpr3 chạm (tên dài + emoji, bản đồ, 27 dòng thoại, bài đăng, hiện trường); Vụ 1 kiểu người mới mắc lỗi (chạm loa/← lúc thoại, chạm chỗ trống, Chế độ soi, hỏi Tèo, vạch sai, chốt bảng sai, vạch mặt sai, 3 câu hỏi phụ, kết vụ 2★, Khoe, mở Vụ 2, tải lại, tiếp tục vụ dở); cả 12 vụ bằng `test/e2e-bot.mjs` VIEW=mob ⇒ 12/12 3★, 0 lỗi; viewport 320×568, 360×800, 844×390, 768×1024, 1366×768, 1920×1080 + màn chuyển mùa 2; mạng chậm (150 ms, ~1,6 Mbps, CPU ×4, tắt cache).
- **Ô Ăn Quan:** chơi với máy (hook âm thanh), xoay 390→844×390→390 giữa ván, chạm ô đối thủ/ô quan, bấm loạn 15 lần lúc rải, tạm dừng, hết ván, Xem bàn, Ván tiếp, tắt tiếng, tải lại; viewport 320×568, 568×320, 360×800, 768×1024, 1366×768, 1920×1080; online 1v1 lần 1 (tạo phòng, link mời, tên dài/emoji, B F5, B đóng hẳn trình duyệt rồi mở lại link, chơi hết ván); lần 2 (B mạng rất chậm 400 ms/50 KB/s, chat emoji + HTML + 150 ký tự, A spam 8 tin, B offline 12 s, rematch, menu tạm dừng).
0 lỗi console, 0 request lỗi.

## Hạng
- **Thám Tử Hẻm: B (sát A)**, không P0/P1. Điểm: Hình ảnh 9 · Mobile 7 · Trải nghiệm 8 · Luồng 8 · Chuyển động 8 · Hiệu năng 6 (assets 40 MB, sheet chân dung 1,6–2,2 MB) · Truy cập 6. Bảng Khoe màu navy portal lệch tông gỗ của game.
- **Ô Ăn Quan: B (sát C vì online).** Điểm: Hình ảnh 8 (quan đỏ trùng màu đá "Máy", nền sân lộ đường nối ở 320) · Mobile 7 · Trải nghiệm 7 · Luồng 7 · Chuyển động 8 · Hiệu năng 8 (assets 2,6 MB) · Truy cập 6 (không reduced-motion, nút ngang 38 px) · Online/an toàn trẻ 6.

## Lỗi (không có P0)
- **OAQ-01 · P1** · Online: đóng tab giữa ván là mất ghế vĩnh viễn ("Phòng này đang chơi, không vào thêm được"); máy chủ đi thay mỗi 15 s tới hết ván; người còn lại không được báo; F5 thì vào lại được. Cause: mã ghế trong `sessionStorage` `wgp.o-an-quan.seat`; `games-server/co-caro/host.js:154-166` chỉ nhả ghế khi `phase === "lobby"`; câu lỗi `o-an-quan/game.js:17`. Fix: lưu mã ghế localStorage theo mã phòng (~30 phút) hoặc cho vào lại cùng tên nhận ghế đang mất kết nối, hoặc sau N giây đưa về phòng chờ + toast; nhãn "mất kết nối" trên ô tên đối thủ. Acceptance: đóng tab B, mở lại link ≤5 phút ⇒ về đúng ghế; A thấy nhãn mất kết nối. M. Khung `createRoomHost` dùng chung ⇒ có thể ảnh hưởng mọi game cờ online. Ảnh: oaq-online-B-11-reopen.png, oaq-online-B-12-rejoined.png, oaq-online-A-10-opp-closed-20s.png.
- **TTH-01 · P2** · Lớp thoại che thanh trên: không tắt tiếng, không ← được suốt thoại (`elementFromPoint` = `DIV.dlg#dlg`); điện thoại không có phím M. Cause `index.html:443` `.dlg { position:fixed; inset:0; z-index:50 }` vs `.bar` z 30 (`index.html:93`). Fix `.dlg` bắt đầu dưới thanh trên hoặc đưa `.bar` lên. S.
- **TTH-02 · P2** · Vụ hướng dẫn nặng chữ với trẻ: 27 lần chạm qua thoại, sổ tay 27 từ khoá, bảng 11 chỗ trống; chip "Khác" có "soi"/"từ khoá" (lấy từ câu hướng dẫn); dưới 1100 px Sổ tay/Bảng/Tèo chỉ còn icon 38 px, `title` không hiện trên cảm ứng; điểm soi vô hình tới khi bật Chế độ soi. Cause `data/cases/noi-thit-kho.js`, `index.html:497`. Fix: intro Vụ 1 ~8–10 dòng, bật sẵn Chế độ soi Vụ 1, nhãn chữ dưới icon, giảm chỗ trống. Acceptance tới hiện trường ≤10 chạm. M.
- **TTH-03 · P2** · Xoay ngang 844×390 (và 568×320): cảnh 320×180 (k=1/3), ~500 px bên phải trống, điểm soi 27 px, danh sách người trong vụ bị đẩy xuống. Fix bố cục 2 cột khi màn thấp + ngang (`index.html:498`). Acceptance cảnh ≥480×270. M.
- **TTH-04 · P2** · 320×568: nút loa cắt mất một nửa (5 kính lúp + 4 nút tràn thanh trên), tab "TỪ KHO…" cắt, không thấy tab thứ 4. S.
- **TTH-05 · P2** · Mạng chậm: 7,4 s mới vào được; `title-art-hd.webp` 1920 px chưa xong sau ~9 s; mở game tải luôn 6 file vụ mùa 1 (~436 KB); vào Vụ 1 nền văn phòng đen + thiếu chân dung trong khi thoại đã chạy. Fix nạp vụ khi cần, srcset title (bản 960), preload nền + chân dung trước khi thoại. Acceptance ≤4 s, không khung trống. M.
- **OAQ-02 · P2** · "Bạn giữ hàng dưới (đội A)" sai khi bàn xoay dọc (hàng của mình là cột phải) ⇒ người mới chạm nhầm cột trái. `o-an-quan/index.html:312`. Fix đổi chữ theo `board.info.rot` hoặc "các ô có khung xanh sáng". S.
- **OAQ-03 · P2** · 320×568: k=0,5 (luật bội 0,5 `board.js:38-55`), ô cách 38 px, mũi tên che 3 ô, HUD "B…/M…", bước Chơi với máy phải cuộn mới thấy Bắt đầu, nền sân lộ đường nối. Fix cho phép k lẻ khi ô < 48 px, bỏ icon đá HUD màn hẹp, đặt mũi tên ra rìa. M.
- **OAQ-04 · P2** · Online: tên cắt ngắn ("Bé Mâ…", "👾👾…"), không có dấu hiệu đối thủ mất kết nối khi đang tới lượt mình (`game.js:249`). S.
- **P3:** TTH-06 toast chồng 3 tầng che cảnh/câu hỏi phụ · TTH-07 chữ cắt ("Lịch treo tườn", "Bé Mít Re…"; ô tên cắt 24 ký tự bỏ emoji không báo) · TTH-08 thẻ chia sẻ hạng "Thám tử hẻm" nhưng câu trích "Suýt soát thôi, thám tử tập sự!" · TTH-09 thanh danh tiếng 0% là dải đen trơn trông như lỗi · OAQ-05 mũi tên che số sỏi ô đang chọn · OAQ-06 "Tạm dừng" online không dừng gì (đổi thành "Menu", ghi "ván vẫn tiếp tục") · OAQ-07 rematch: A bấm "Ván tiếp" kéo B khỏi màn kết, không kịp Khoe · OAQ-08 một lần bấm Tạm dừng phát 3 tiếng (2× tiếng tách feedback.js + pause) ⇒ `data-nosfx` cho `#menuBtn`, kiểm vì sao feedback.js kêu 2 lần · OAQ-09 thiếu prefers-reduced-motion.

## Nên giữ
TTH: 12/12 vụ chạy được bằng chạm, không nút bị che; vạch mâu thuẫn tự giải thích; sai không bị phạt nặng, Tèo có xác nhận trừ sao; vạch mặt dễ hiểu ("Lời chối 1/4"); lưu/tiếp tục tốt; desktop 2 cột nét; màn chuyển mùa 2 có không khí; bình luận chỉ lưu cục bộ. OAQ: bàn xoay cho ngón cái, ô 75 px ở 390; 0/7 nước bị che; 3 tiếng mới đúng; bấm loạn không sinh nước thừa; xoay ngang giữa ván ổn; link mời điền sẵn mã, F5 vào lại đúng ghế; chat lọc HTML + chống spam; mạng rất chậm vẫn chơi được.

## Chưa kiểm được
Máy thật, âm thanh nghe thật; rớt mạng thật khi có WebSocket (CDP offline không cắt WS đang mở); 2v2; toast "Có người đã rời phòng" giữa ván; gửi bình luận bài đăng TTH; Vụ 2–12 chỉ bằng bot (không đánh giá độ khó cho trẻ); Lighthouse.

## Ghi chú chéo
- An toàn trẻ: chat OAQ không lọc từ ngữ, không nút tắt chat; nút Facebook/Zalo trong `share.js` to, trẻ dễ bấm nhầm. Bộ lọc từ cấm dùng chung cho mọi game có chat. Nội dung TTH hài, không bạo lực.
- Lỗi có thể lặp: overlay `inset:0` che thanh trên; tiếng tách chung chồng tiếng game (TTH đã `data-nosfx`, OAQ chưa); luật bội 0,5 làm màn 320 rất nhỏ ở game canvas; OAQ-01 ở khung `createRoomHost` chung.
- Quảng cáo đề xuất: dưới tường bình luận màn kết vụ TTH; dưới hàng nút bảng kết ván OAQ; không đặt lúc thoại/lúc rải.
- Mẹo tiêm bản lưu TTH: gọi `__game.store.wipe()` trước, nếu không `pagehide` ghi đè.
