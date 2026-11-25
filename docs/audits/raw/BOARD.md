# REPORT — BOARD (Cờ Caro, Cờ Vua, Cờ Tướng, Cờ Cá Ngựa, Cờ Tỷ Phú)
(Agent không ghi được file — coordinator chép từ báo cáo gửi qua tin nhắn. Ảnh chính `shots/` 54 tấm, phụ `extra-shots/` 130 tấm; JSON thô `online-*.json`, `solo-*.json`, `misc-*.json`.)

## Phạm vi đã chạy thật
Server 8905, Chrome headless CDP, chạm thật + chuột thật. Viewport Caro/Vua/Tướng 360×800, 390×844 (dpr3 cảm ứng), 320×568, 844×390, 768×1024, 1366×768, 1920×1080 (+412×915 người thứ 3); Cá Ngựa/Tỷ Phú 320/360/390/412/768/844×390/1366. Solo cả 5 game (Caro thắng máy Dễ; Vua/Tướng Xin thua; Cá Ngựa kết quả qua test-hook; Tỷ Phú `setFast` hết 25 vòng) + Khoe, xoay máy giữa ván, tắt tiếng nhớ qua game. Online Caro/Vua/Tướng 2 người + 1: tạo phòng tên 24+ ký tự có dấu + emoji, danh sách công khai trang chủ, mã sai/không tồn tại, vào bằng mã, người thứ 3 ⇒ phòng đầy, Bắt đầu, 4–6 nước, spam 15 chạm, chat, khách F5, chủ rớt mạng (offline + drop WS) rồi nối lại, khách mạng chậm, kết thúc → Ván tiếp, khách Rời giữa ván → vào lại, khách đóng tab → mở lại link → chờ 20 s, chủ rời, Hủy phòng → vào lại mã đã hủy. Cờ Vua thêm chiếu bí Qh4# + mời hòa. Online Cá Ngựa/Tỷ Phú 3 người 45–60 s (Cá Ngựa gieo bằng chạm + kéo-thả xúc xắc). Đo tải Fast-3G + CPU×4 cả 5 game. Console sạch.

## Hạng
Caro **B** · Vua **C** · Tướng **B** · Cá Ngựa **C** · Tỷ Phú **C**. Điểm chung: Visual 8 (art Tỷ Phú/Cá Ngựa tốt nhất repo) · Mobile 6 · Game 7 · Điều hướng 7 · Hoạt ảnh 7 · Hiệu năng 6 · A11y 6 · Ads n/a.

## Lỗi (không có P0)
- **BRD-01 · P1 (cả 5 game)** · Đóng tab là mất ghế, không vào lại được ván đang chơi ("Phòng này đang chơi, không vào thêm được"); máy đánh thay tới hết ván; F5 vẫn vào lại. Cause token ghế trong sessionStorage (`co-caro/net.js:4–7`, cùng khuôn) + server từ chối `join` khi qua lobby. Fix lưu `{code, token}` localStorage theo game + mã phòng, mở link có token còn hạn ⇒ gửi `resume`. Acceptance đóng tab, mở lại ≤60 s ⇒ đúng ghế. M. (Trùng OAQ-01 — sửa một lần trong khuôn chung.)
- **BRD-02 · P1** · Cá Ngựa: bấm Chơi xong trang vẫn cuộn ở dưới (scrollY 323), khay xúc xắc + dòng lượt mình ngoài màn (mà chủ phòng đi trước). Fix scrollTo(0,0) khi vào ván; phòng chờ thành overlay/bottom-sheet trên màn hẹp. S.
- **BRD-03 · P1** · Cá Ngựa không chơi được ở 844×390 (bàn 812×812, trang 1433) và 320 (bàn 381 px tràn ngang, thẻ BẠN/MÁY cắt). Fix cạnh bàn = min(100vw − lề, 100svh − header − status), ngang xếp thẻ hai bên bàn. M.
- **BRD-04 · P1** · Tỷ Phú ngang: bàn 640×640, nút Gieo y=603 trong khung 390. Fix bố cục 2 cột như 1366 cho `landscape and max-height:500px`. M.
- **BRD-05 · P1** · Cờ Vua 844×390: thẻ người chơi bị bóp còn "Q/E/N". Fix `.tools` xuống hàng/cột cạnh bàn, `.who{min-width:0}`. S.
- **BRD-06 · P1** · Tỷ Phú 2.342 KB, FCP 8,2 s, load 14,9 s (Fast-3G + CPU×4): `board-co-ty-phu.webp` 1.323 KB, `poster-co-ty-phu.webp` 922 KB. Fix xuất đúng cỡ (~1.344 px), srcset 1×/2×, poster ≤150 KB, giữ lưới 2×. Acceptance ≤700 KB, FCP ≤3 s. M.
- **BRD-07 · P1 (an toàn trẻ em)** · Phòng công khai chat tự do 200 ký tự, hiện thành toast đè bàn + tiếng báo kể cả khi khung chat đóng; `games-server/*/chat.js` chỉ lọc ký tự điều khiển + giới hạn tốc độ; không nút tắt/chặn/báo cáo. Fix nút "Tắt chat" (localStorage), lọc từ tiếng Việt phía server (cả không dấu), phòng công khai chỉ câu chọn sẵn. M.
- **BRD-08 · P2** · Tên dài cắt vô nghĩa: ô nhập maxlength 16 cắt im lặng giữa chữ; HUD "N…", "Tr…" ở 360; Cờ Tướng ≤360 ẩn hẳn tên, không nhãn "Bạn"; dòng trạng thái 3 dòng; solo "Máy (k…" ở 390 (đã sửa ở Cờ Tướng). S–M.
- **BRD-09 · P2** · Rematch một phía: A bấm "Ván tiếp" ⇒ ván 2 chạy ngay, thẻ kết quả B tự đóng. Fix chỉ mở ván mới khi cả hai sẵn sàng hoặc đếm ngược 10 s. S–M.
- **BRD-10 · P2** · Đối thủ rớt mạng gần như vô hình (Caro/Vua/Tướng): chỉ khi tới lượt người đó mới có dòng "mất kết nối · 13s"; sau 15 s máy âm thầm đánh thay. Tỷ Phú làm đúng. Fix nhãn trên thẻ người chơi theo `players[i].connected` + toast "máy đánh thay". S.
- **BRD-11 · P2** · `window.confirm()` cho Xin thua / Rời / Hủy phòng / Ván mới (`co-vua/game.js:539,547,558,711,719`, `co-ca-ngua/hud.js:94`, `online.js:266,273`) lệch V5. Fix `pxConfirm` dùng chung trong `_shared/`. S–M.
- **BRD-12 · P2** · Cá Ngựa và Tỷ Phú không có nút Khoe kết quả. M.
- **BRD-13 · P2** · Cờ Tướng 844×390: toast "Chạm vào chấm sáng để đi quân" che hàng quân nhà. S.
- **BRD-14 · P2** · Thanh công cụ chật 320–360 (Cờ Vua "VÁN TIẾP ▶" 3 dòng; placeholder "MÃ PHÒ" cắt). S.
- **BRD-15 · P2** · Cá Ngựa nút "Rời bàn — về phòng chờ" thực ra rời hẳn phòng (`hud.js:30`, `online.js:291`). S.
- **BRD-16 · P2** · "NGUYỄN" hiện thành "NGUYÊN" ở phòng chờ Cá Ngựa: dấu chồng bị cắt do `hud.css:121` uppercase + `hud.css:174` overflow hidden + line-height mặc định. S.
- **BRD-17 · P2** · Chữ dev lộ ("Lụm Kèo · bản chơi thử · pixel V5", "Bản chơi thử · Hội đua ngựa làng"). S.
- **P3:** BRD-18 bàn căn giữa để trống ~110 px trên/dưới ở dọc · BRD-19 thẻ kết thúc che bàn chỉ ~1,3 s sau nước quyết định (nên 2–2,5 s) · BRD-20 Cá Ngựa chơi với máy vẫn hiện nút chép link phòng · BRD-21 `:hover` không bọc `@media (hover:hover)` ⇒ sticky hover trên cảm ứng · BRD-22 Caro chèn tên vào innerHTML không escape (`co-caro/game.js:597`; server đã lọc `<>`) · BRD-23 Tỷ Phú loa emoji 🔊/🔇 thay icon pixel · BRD-24 trang chủ tên chủ phòng xén cứng không có "…".

## Nên giữ
Màn vào game thống nhất (input 16 px, cao 44); lỗi tiếng Việt chính xác (mã sai định dạng, không tìm thấy, phòng đủ, đã hủy → 404); link mời tự điền mã; danh sách phòng công khai đúng; F5 vào lại đúng ván cả 5 game; rớt mạng tự nối ≤9 s; spam chạm không đổi trạng thái, desync 0; Caro chạm-chọn rồi bấm Đặt; Vua/Tướng chấm ô đi + lật bàn cho Đen; mời hòa, báo chiếu bí rõ; xoay máy giữ lựa chọn; tắt tiếng nhớ qua game; chat có badge chưa đọc, server gắn tên người gửi; Tỷ Phú báo "Mất kết nối" + thêm/bớt bot.

## Chưa kiểm
iOS Safari/Android thật, trình duyệt trong Zalo/Messenger; navigator.share thật; trọn ván online Cá Ngựa/Tỷ Phú; phòng 4 người đầy, phong cấp Tốt, chiếu tướng Cờ Tướng, Caro 19×19 ở 360; phòng chờ hết hạn 20 s; trình đọc màn hình, tương phản chi tiết, profile khung hình.

## Số liệu
| Game | Load | KB | FCP | FPS đứng yên (4×) | File nặng |
|---|---|---|---|---|---|
| Caro | 2,5 s | 146 | 1516 ms | 60 | |
| Vua | 4,9 s | 414 | 772 ms | 42 | board 211 KB |
| Tướng | 6,9 s | 434 | 2276 ms | 52 | board 180, pieces 79 |
| Cá Ngựa | 3,6 s | 151 | 2212 ms | 56 | |
| Tỷ Phú | 14,9 s | 2342 | 8172 ms | 61 | board 1323, poster 922 |

Cỡ ô (CSS px) 320/360/390/844×390: Caro 18/21/22,7/17,3 · Vua 32,5/37/40,3/29,7 · Tướng 30,5/35/38,3/26,7. Chiều cao bàn ở 844×390: Caro 282 (ổn), Vua 273 (HUD hỏng), Tướng 288 (toast che), Cá Ngựa 812 (hỏng), Tỷ Phú 640 (hỏng).

## Ghi chú chéo
BRD-01 + BRD-07 nằm trong khuôn chung (net/host, chat.js) ⇒ sửa một lần cho mọi game online; màn ngang thấp cần bố cục riêng (tái dùng 2 cột desktop); checklist thẻ kết thúc chuẩn (Ván tiếp · Khoe · Xem bàn · Rời/Hủy); quảng cáo chỉ dưới nút thẻ kết thúc, nhãn "Quảng cáo", cách "Ván tiếp" ≥24 px, không trong ván/phòng chờ, không sticky bar; ngân sách dung lượng ảnh mỗi trang trong PLAYBOOK.
