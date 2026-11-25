# REPORT — PARTY (Ma Sói, Ai Là Nội Gián, Đặt Bom, Nối Từ)
(Agent không ghi được file — coordinator chép từ báo cáo gửi qua tin nhắn. Ảnh: `shots/` 67 ảnh.)

## Phạm vi đã chạy thật
Server cổng 8906 (MASOI_SPEED=0.25, NOIGIAN_SPEED=0.25), headless Chromium qua cdp.mjs, mỗi người chơi là một profile riêng.
- Ma Sói: 4 người thật (2×390 cảm ứng, 2×1366) + 2 bot; thêm ván "Chơi với máy" và phòng 8 ghế. Viewport 390/360/320/844×390/1366. Tạo phòng, link mời ?p=, phòng chờ, bot, phát vai, đêm, tải lại giữa đêm, ngày, bàn phím ảo, bỏ phiếu bằng chạm thật, bị loại, hết ván, ván mới, chủ phòng rời, đóng tab rồi quay lại; tên/chat tục, tên dài, emoji, spam.
- Ai Là Nội Gián: 3 người + 5 bot = 8 ghế, 390/1366, toàn vòng đời, tải lại giữa đêm, chủ phòng rời giữa ván.
- Đặt Bom: 390 dọc chạm, 844×390 ngang chạm, 360×640, 1366 phím; danh sách phòng công khai, người lạ vào, chat, D-pad/BOM chạm thật, tải lại giữa ván, chơi hết 3 phút.
- Nối Từ: chơi với máy (390), online 1v1 (390↔1366); từ sai/tục, Telex thô, IME, Enter, bàn phím ảo, hết giờ, chat, tải lại, chịu thua.
Console: 0 lỗi JS, 0 request lỗi.

## Hạng
- Ma Sói **C** · Ai Là Nội Gián **C** · Đặt Bom **C** · Nối Từ **B**.
- Điểm phụ: V5 7 · Mobile UX 5 · Trải nghiệm chơi 6 · Điều hướng 7 · Hoạt cảnh 7 · Hiệu năng 8 (desktop) · Accessibility 6 · An toàn trẻ em 2 · Quảng cáo: không có.

## Lỗi
- **PTY-01 · P0 (an toàn trẻ em)** · Tên tục không lọc, hiện công khai ở "Sảnh chờ trực tiếp" trang chủ và danh sách phòng Đặt Bom ("👑 đụ m…", "👑 Cặc Bự"; chấp nhận cả "địt mẹ mày", "Fuck You", "Con Chó Ngu"). Ảnh: homepage-390-public-rooms-profane.png, datbom-1366-home-publist.png, masoi-1366-lobby.png, noigian-390-end.png, noitu-390-online-mid.png. Nguyên nhân: `cleanText/cleanName` trong `games-server/{ma-soi,ai-la-noi-gian,dat-bom}/room.js`, `noi-tu/host.js` chỉ cắt độ dài; `isProfane()` (`games-server/account/names.mjs`) chỉ dùng cho bảng xếp hạng. Sửa: module lọc dùng chung cho create/join mọi host + lọc ở `/api/lobby`, thêm biến thể không dấu/leetspeak. Effort M.
- **PTY-02 · P1 (an toàn trẻ em)** · Chat cả 4 game không lọc tục, không tắt tiếng/báo cáo người chơi; "Gửi riêng" 1-1 của Nội Gián cũng không lọc. Link không bấm được (tốt), spam bị chặn từ tin thứ 6. Code: `ma-soi/room.js _chat ~272`, `ai-la-noi-gian/room.js _chat/_dispatch ~271`, `dat-bom/chat.js post`, `noi-tu/host.js chat ~105`. Sửa: che ***, ẩn URL, nút "Tắt tiếng người này", cân nhắc chat nhanh cho phòng công khai. Effort M.
- **PTY-03 · P1** · Chủ phòng rời/mất kết nối giữa ván (Ma Sói, Nội Gián) ⇒ hết ván không ai bấm "Chơi ván mới" được (not-host). Nguyên nhân: `setConnected` chỉ chuyển chủ phòng ở lobby (`ai-la-noi-gian/room.js ~127`, `ma-soi/room.js ~111`), `_again` từ chối người không phải chủ (~196/216). Sửa: `_pickHost()` khi chủ phòng mất kết nối ở mọi pha. Effort S.
- **PTY-04 · P1** · Đặt Bom ngang 844×390 không chơi được: canvas y 114–793, D-pad y 801–981, trang cao 1564px. `style.css` thiếu media query ngang. Sửa: `@media (orientation: landscape) and (max-height: 500px)`, canvas theo 100dvh, D-pad/BOM fixed hai bên + safe-area. Effort M.
- **PTY-05 · P1** · Đặt Bom desktop: chat ở phòng chờ ⇒ vào ván con trỏ vẫn ở ô chat, mũi tên không đi, Space gõ dấu cách. `dat-bom/app.js` 274–276, 349. Sửa: blur khi sang pha play/đếm ngược, Esc rời ô chat. Effort S.
- **PTY-06 · P2** · Tên 16 ký tự liền làm vỡ màn kết quả (Ma Sói thẻ đè nhau, Nội Gián tràn phải ở 390). Sửa: `repeat(3, minmax(0,1fr))` + `overflow-wrap:anywhere`. S.
- **PTY-07 · P2** · Ma Sói 390/360/320: ghế và nhãn tên đè nhau (phòng 8 ghế, 4 cặp chồng), chip phiếu che tên. M.
- **PTY-08 · P2** · Đặt Bom 390: nút Hủy phòng ở màn kết quả bị cắt. S.
- **PTY-09 · P2** · Nối Từ 390: tên trên HUD cắt còn ~1 ký tự. S.
- **PTY-10 · P2** · Nội Gián: người chơi là ô màu + chữ cái, lệch V5 (cố ý, `app.js:55`). Đề xuất 8 chân dung pixel (cần duyệt quota). M.
- **PTY-11 · P2** · Banner pha che hàng ghế dưới ~2,6 s đầu pha bỏ phiếu. S.
- **PTY-12 · P2 (an toàn trẻ em)** · Phòng mặc định công khai (Đặt Bom tick sẵn), hiện ngay trên trang chủ, không có nút mời người ra. M.
- **PTY-13 · P3** · Cắt tên theo UTF-16 làm vỡ emoji. Sửa `[...s].slice(0,max)`. S.
- **PTY-14 · P3** · Ma Sói: người bị loại vẫn gõ được vào ô chat. S.
- **PTY-15 · P3** · Đặt Bom hoà: người đã bị loại điểm cao vẫn đứng đầu danh sách. S.

## Điểm tốt nên giữ
Kết nối lại rất tốt (đúng ghế/pha/vai); chuyển chủ phòng ở phòng chờ đúng; rời giữa ván có xác nhận; chống spam có thông báo tiếng Việt; link chat không bấm được; bot tốt; đồng hồ pha rõ + âm báo 5 giây; Nối Từ đọc Telex/VNI thô, chặn từ tục ngoài từ điển, bàn phím ảo không che ô nhập; D-pad kéo đổi hướng; không tràn ngang (trừ PTY-06); câu chữ tiếng Việt tự nhiên.

## Chưa test được
iOS/Android thật (bàn phím ảo chỉ giả lập thu viewport); độ trễ WebSocket thật; IME điện thoại thật; vai đặc biệt Nội Gián thao tác tay; Lighthouse; trình đọc màn hình.

## Ghi chú chéo
1. Bộ lọc tục có sẵn (`account/names.mjs`, `bad-words.json`) chưa dùng cho game online; các game online khác (Cá Ngựa, Tỷ Phú, Vua, Ô Ăn Quan…) nhiều khả năng cũng không lọc ⇒ module moderation dùng chung + lọc ở `/api/lobby`.
2. Grep mẫu lỗi chủ phòng (PTY-03) trên mọi `games-server/*/room.js`.
3. Cần quy ước bố cục ngang chung cho game hành động.
4. Nội Gián là bản sao Ma Sói ⇒ sửa PTY-03/06/13/14 ở cả hai.
