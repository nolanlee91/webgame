# Tóm tắt audit

_Audit Lụm Kèo · 24–25/11/2026 · 7 agent kiểm song song trên trình duyệt thật (Chrome headless giả lập). Ảnh chụp nằm ngoài git; bằng chứng chi tiết ở `raw/`._

## Kết luận

Lụm Kèo giữ được bản sắc pixel V5 rõ ràng và phần lớn game chơi được trọn vòng trên điện thoại, nhưng có **1 lỗi P0 về an toàn trẻ em đang có trên bản thật** (tên tục hiện công khai ở sảnh trang chủ), **hiệu năng là điểm yếu lớn nhất**, và **màn ngang / tablet chưa được thiết kế** ở nhiều game.

**Điểm tổng: 64/100** · Desktop ~72 · Mobile ~59 · Multiplayer ~55 · An toàn trẻ em 2/10.

Số lỗi: **P0 1 · P1 20 · P2 58 · P3 33** (tổng 112, đã gộp trùng giữa các agent).

## Điểm theo trọng số

| Hạng mục | Trọng số | Điểm 0–10 | Quy đổi | Căn cứ |
|---|---|---|---|---|
| Visual Design & Brand Identity | 15 | 7.9 | 11.8 | Pixel V5 nhất quán ở trang chủ, game cờ, Nông Trại, Thám Tử; trừ: 3 game tiệm dùng UI bo tròn kiểu app, nhãn nội bộ "bản chơi thử" lộ ở 13–15 game, hệ số pixel lẻ, confirm() hệ thống. |
| Mobile UX & Responsive | 25 | 6 | 15.0 | Màn dọc 360–412 phần lớn ổn, không tràn ngang ở hầu hết game; trừ: màn ngang hỏng ở ~8 game, tablet vỡ ở Bánh Mì/Cơm Tấm, thao tác chính bị che (Trà Sữa, Bánh Mì), màn đầu trang chủ không có game. |
| Game Experience | 20 | 7.2 | 14.4 | 10 game casual A/B, Thám Tử B+, cờ B/C; trừ: vụ/ca đầu nặng chữ với trẻ, Trà Sữa/Bánh Mì nặng tay, 2 game thiếu Khoe. |
| Navigation & User Flow | 10 | 7 | 7.0 | 2–3 chạm tới lúc chơi, link mời tốt, F5 vào lại đúng; trừ: đóng tab mất ghế, rematch một phía, kết quả daily che link về. |
| Animation & Interaction | 10 | 7.4 | 7.4 | Lún + tiếng ở mọi nút (sau đợt sửa), xúc xắc / tem mực có hồn; trừ: thông báo chồng nhau, lên cấp Nông Trại chỉ là toast, sticky hover. |
| Performance | 10 | 4.5 | 4.5 | Game casual nhẹ, không rò bộ nhớ; trừ: server không nén/không cache, server ở Chicago, CLS trang chủ ~1,0, Trà Sữa tải ngầm 7 MB, Thám Tử trắng 18 giây trên mạng chậm, Tỷ Phú 2,3 MB. |
| Accessibility | 5 | 6.1 | 3.0 | Focus rõ, lang=vi, tương phản trang chủ tốt, aria-live; trừ: nút < 44 px nhiều nơi, HUD chỉ icon, không h1, thiếu reduced-motion ở nhiều game. |
| Advertising Integration | 5 | 2 | 1.0 | Không còn vị trí quảng cáo nào (khối SpeakUp Kids bị gỡ ngày 18/11); chưa có gì để đánh giá độ tự nhiên — chỉ có đề xuất vị trí. |
| **Tổng** | 100 | | **64** | |

Desktop cao hơn mobile vì phần lớn lỗi nằm ở màn hẹp, màn ngang và tablet; multiplayer thấp vì lỗi mất ghế khi đóng tab, chủ phòng rời, rematch một phía và chat không lọc.

## Hạng từng game

| Game | Nhóm | Hạng | Căn cứ |
|---|---|---|---|
| Trang chủ | Cổng | **B-** | Đúng pixel V5, không bắt đăng nhập, lún + tiếng tốt; nhưng nhảy bố cục khi tải, màn đầu mobile không có thẻ game, tải nặng. |
| Nông Trại | Tập Làm Chủ | **B** | Hướng dẫn mũi tên đúng chỗ, thẻ xây rõ công dụng, bản lưu chắc; HUD dày trên mobile, Cách chơi mở ở cuối. |
| Tiệm Trà Sữa | Tập Làm Chủ | **C** | Nội dung giàu, Nhật Ký đẹp; nút nguyên liệu bị che (P1), tải ngầm 7 MB, UI bo tròn lệch V5, chậm trên máy yếu. |
| Tiệm Bánh Mì | Tập Làm Chủ | **C** | Pixel đẹp, gợi ý từng bước; mỗi đơn phải cuộn 2–4 lần trên điện thoại (P1), tablet vỡ, tràn ngang ở 360. |
| Quán Cơm Tấm | Tập Làm Chủ | **C+** | Điện thoại dọc rất tốt (cả ca cuộn 1 lần); tablet và ngang mất nút bếp (P1), gợi ý bị cắt, lỗi JS lúc chốt ca. |
| Thám Tử Hẻm | Giải đố | **B+** | 12/12 vụ chơi được bằng chạm, cơ chế dạy tại chỗ, lưu tốt; vụ đầu nặng chữ, thoại che nút tắt tiếng, tải chậm trên mạng yếu. |
| Ô Ăn Quan | Đối kháng | **B-** | Chơi với máy gọn, bàn xoay cho ngón cái; online đóng tab mất ghế (P1), câu hướng dẫn sai khi bàn dọc. |
| Cờ Caro | Đối kháng | **B** | Solo xuất sắc (chạm chọn rồi bấm Đặt); online đủ luồng; mất ghế khi đóng tab, tên bị cắt. |
| Cờ Vua | Đối kháng | **C** | Luật đủ, báo chiếu bí chuẩn; ngang HUD hỏng, thanh công cụ chật ở 360. |
| Cờ Tướng | Đối kháng | **B** | Quân pixel đẹp, chấm ô đi rõ; ≤360 ẩn tên, toast che quân khi ngang. |
| Cờ Cá Ngựa | Đối kháng | **C** | Art + xúc xắc vật lý rất đã; trang kẹt cuộn sau khi bấm Chơi (P1), ngang và 320 không chơi được, không có Khoe. |
| Cờ Tỷ Phú | Đối kháng | **C** | Art đẹp nhất nhóm, báo mất kết nối đúng; 2,3 MB tải chậm (P1), ngang nút Gieo ngoài màn. |
| Ma Sói | Đối kháng (nhóm) | **C** | Vòng đời ổn, kết nối lại tốt; tên/chat tục không lọc (P0/P1), chủ phòng rời giữa ván thì kẹt, ghế đè nhau ở mobile. |
| Ai Là Nội Gián | Đối kháng (nhóm) | **C** | Cùng khung Ma Sói nên cùng lỗi; người chơi là ô màu placeholder, kết quả tràn ở 390. |
| Đặt Bom | Đối kháng (nhóm) | **C** | Dọc tốt (D-pad to); ngang không chơi được (P1), phím chết sau khi chat (P1), tên tục ở danh sách phòng. |
| Nối Từ | Đối kháng (nhóm) | **B** | Gõ tiếng Việt Telex/VNI thô rất tốt, bàn phím ảo không che; chat/tên không lọc, tên HUD cắt. |
| 2048 | Trí tuệ | **A** | Vuốt mượt, daily + bảng xếp hạng tốt. |
| Sudoku | Trí tuệ | **A** | Giải bằng chạm thoải mái, daily "HOÀN HẢO!". |
| Đố Vui | Giải đố | **A-** | Màn kết quả tốt, khoe kiểu Wordle; link về xuống 2 dòng. |
| Ghép Kẹo | Giải đố | **A-** | Vuốt nhạy, đủ nút sau ván. |
| Đua Xe | Hành động | **A-** | Pedal to, màn ngang rất hợp. |
| Xếp Gạch | Hành động | **B+** | Nút ảo to, ngang 3 cột tốt; nút Bắt đầu dưới mép khi ngang. |
| Nối Thú | Giải đố | **B+** | Ô to, viền chọn rõ; thiếu hướng dẫn luật cho người mới. |
| Rắn Săn Mồi | Hành động | **B** | D-pad tốt; nút pause/mute nhỏ, nút Bắt đầu dưới mép khi ngang. |
| Bắn Bóng | Hành động | **B** | Kéo ngắm tốt trên cảm ứng; nút Bắt đầu dưới mép trên desktop. |
| Đào Vàng | Hành động | **C+** | Chơi được; dọc cảnh quá nhỏ, ngang nút ngoài màn, khung trang riêng. |

Thang: **A** mượt, người mới (trẻ em) hiểu ngay trên điện thoại, không P0/P1 · **B** tốt, vài P2 · **C** chơi được nhưng vướng đáng kể · **D** hỏng luồng chính.

## Lỗi P0 + P1

| ID | Mức | Game / trang | Vấn đề | Đề xuất sửa | Công |
|---|---|---|---|---|---|
| PTY-01 | P0 | Ma Sói, Nội Gián, Đặt Bom, Nối Từ, cờ online, trang chủ | Tên tục không bị lọc và hiện công khai ở Sảnh chờ trực tiếp trên trang chủ (đã thử: "đụ má…", "C*c B*", "Fuck You" đều được chấp nhận) | Đưa bộ lọc từ tục có sẵn (games-server/account/names.mjs) ra module dùng chung, gọi ở create/join của mọi host + lọc ở /api/lobby; thêm biến thể không dấu / leetspeak. Gộp HOME-07. | M |
| PTY-02 | P1 | Ma Sói, Nội Gián, Đặt Bom, Nối Từ | Chat không lọc từ tục, không có nút tắt tiếng hay báo cáo người chơi; "Gửi riêng" 1-1 của Nội Gián cũng không lọc | Che từ tục thành ***, ẩn URL, nút "Tắt tiếng người này"; cân nhắc chat nhanh (câu chọn sẵn) cho phòng công khai. | M |
| BRD-07 | P1 | Cờ Caro, Vua, Tướng, Cá Ngựa, Tỷ Phú, Ô Ăn Quan | Chat tự do ở phòng công khai, không lọc nội dung; tin nhắn hiện thành toast đè bàn cờ kể cả khi khung chat đóng; không có nút tắt/chặn | Nút "Tắt chat" (nhớ trong localStorage); lọc từ tiếng Việt phía server dùng chung games-server/*/chat.js; phòng công khai chỉ câu chọn sẵn. | M |
| BRD-01 | P1 | Cờ Caro, Vua, Tướng, Cá Ngựa, Tỷ Phú, Ô Ăn Quan | Đóng tab giữa ván là mất ghế vĩnh viễn ("Phòng này đang chơi, không vào thêm được"); máy đánh thay tới hết ván; người còn lại không được báo. F5 thì vẫn vào lại | Lưu {mã phòng, token ghế} vào localStorage theo game, mở link có token còn hạn thì gửi resume thay vì join; sửa một lần trong khuôn createRoomHost / net.js. Gộp OAQ-01. | M |
| PTY-03 | P1 | Ma Sói, Ai Là Nội Gián | Chủ phòng rời hoặc mất kết nối giữa ván thì hết ván không ai bấm "Chơi ván mới" được | Chuyển chủ phòng khi chủ mất kết nối ở mọi pha (_pickHost) hoặc trong _again; sửa cả hai game. | S |
| PERF-04 | P1 | Toàn cổng | Server không nén gzip/br, không ETag/Last-Modified (luôn trả lại đủ byte), HTTP/1.1; server đặt ở Chicago, không CDN | server.js: nén zlib + ETag/304 + max-age 1 năm immutable cho file có ?v=; lâu dài đặt Cloudflare phía trước. | S/M |
| PERF-02 | P1 | Trang chủ | Trang chủ nhảy bố cục khi tải: CLS 1,0–1,2 trên điện thoại (0,94 khi giả lập 4G chậm), tới 0,4 trên desktop; LCP 5,96 giây | Giữ chỗ sẵn cho hero / lưới game / khu thử thách, đặt ô tìm kiếm bằng CSS thay vì JS, preload ảnh slide đầu. Gộp HOME-01. | S-M |
| PERF-01 | P1 | Tiệm Trà Sữa (có lẽ cả Bánh Mì, Cơm Tấm) | Trà Sữa tự tải ngầm ~7 MB ảnh HD khi người chơi chưa làm gì (tổng 12,2 MB trên điện thoại) | Chỉ tải mỗi sheet ngay trước khi cần; journal-card sang WebP; dùng bản thường thay -hd trên màn nhỏ. Đạt: đứng yên 60 giây < 3 MB. | M |
| PERF-03 | P1 | Thám Tử Hẻm | Trắng màn hình 18,5 giây khi giả lập 4G chậm + máy yếu: 24 module JS tải nối tiếp, mọi file vụ án tải ngay từ đầu | Nén (PERF-04), modulepreload, màn tựa HTML tĩnh, chỉ nạp file vụ khi chọn vụ, srcset ảnh tựa. Gộp TTH-05. | M |
| BRD-06 | P1 | Cờ Tỷ Phú | Cờ Tỷ Phú nặng 2,3 MB (bàn 1,3 MB + poster 0,9 MB), chữ đầu tiên hiện sau 8,2 giây trên 3G | Xuất ảnh đúng cỡ hiển thị (~1.344 px), srcset 1×/2×, poster ≤ 150 KB, giữ lưới 2× sắc nét. | M |
| HOME-02 | P1 | Trang chủ | Màn đầu điện thoại chưa có thẻ game nào: chỉ thấy slide nổi bật + khung mã phòng cao 205 px; thẻ game đầu ở dưới màn (Poki thấy ~12 game) | Trên ≤720 px: thu sảnh còn 1 hàng, dải cuộn ngang 6–8 game "Chơi ngay" dưới slide, thêm h1, hạ cấp khu Thử thách (xem P-E). | M |
| TLC1-01 | P1 | Tiệm Trà Sữa | Nút nguyên liệu (thao tác chính) bị thanh "Hoàn tác / Đổ bỏ ly / Giao" che, game không tự cuộn tới; cuối game ở 360/390 cả dải bước nằm dưới thanh đó | Cuộn tới nút gợi ý sau mỗi bước và khi ghim phiếu; mobile đưa dải bước + nút lên ngay dưới phiếu. | M |
| TLC2-01 | P1 | Tiệm Bánh Mì | Trên điện thoại mỗi đơn phải cuộn 2–4 lần mới thấy nút bước kế; mỗi ổ 9–16 chạm + ~11 chạm thối tiền | Khi ghim phiếu thu cảnh ~150 px và cuộn tới thớt; hoặc hàng nguyên liệu dính trên thanh Giao; ngày 1–3 gộp Lấy + Rạch. Đạt: 0 lần cuộn, ≤ 10 chạm. | M |
| TLC2-02 | P1 | Quán Cơm Tấm | Tablet dọc 768 và điện thoại ngang: thanh bếp tràn, mất nút +Than / Quạt / Nấu cơm (không thể nấu cơm giữa ca) | Thêm tầng bố cục tablet/ngang hoặc dùng bố cục mobile tới 1024 px; thêm 768 và 844×390 vào e2e. | M |
| TLC2-03 | P1 | Tiệm Bánh Mì | Tablet 768: cảnh co còn 312×176 bị 3 thông báo che kín, phiếu giãn cao 1500 px | Bố cục mobile cho ≤1024 dọc, áp luật 1 thông báo cho tablet. | M |
| BRD-02 | P1 | Cờ Cá Ngựa | Bấm Chơi xong trang vẫn cuộn ở dưới, khay xúc xắc và dòng lượt của mình nằm ngoài màn hình | scrollTo(0,0) khi vào ván; phòng chờ thành overlay trên màn hẹp. | S |
| BRD-03 | P1 | Cờ Cá Ngựa | Không chơi được ở điện thoại ngang (bàn cao 812 px) và 320 px (bàn tràn ngang) | Cạnh bàn = min(100vw, 100svh − header); ngang xếp thẻ người chơi hai bên bàn. | M |
| BRD-04 | P1 | Cờ Tỷ Phú | Điện thoại ngang: nút Gieo nằm ngoài màn hình (y=603 trong khung 390) | Bố cục 2 cột như bản 1366 khi màn thấp. | M |
| BRD-05 | P1 | Cờ Vua | Điện thoại ngang: thẻ người chơi bị bóp còn "Q", "E", "N" | Thanh công cụ xuống hàng / cột cạnh bàn; .who{min-width:0}. | S |
| PTY-04 | P1 | Đặt Bom | Điện thoại ngang không chơi được: canvas cao 679 px trong khung 390, D-pad nằm ngoài màn | Bố cục ngang: canvas theo 100dvh, D-pad/BOM cố định hai bên. | M |
| PTY-05 | P1 | Đặt Bom | Trên máy tính, ai đã chat ở phòng chờ thì vào ván phím mũi tên / Space không chạy (con trỏ vẫn ở ô chat) | Bỏ focus ô chat khi vào ván; Esc để rời ô chat. | S |

## Cần chủ dự án quyết

- Khung UI chuẩn cho dòng Tập Làm Chủ: theo pixel V5 (góc bậc, bóng cứng như Nông Trại) hay giữ kiểu bo tròn của Trà Sữa? Phải chốt trước khi sửa vì PLAYBOOK đang bảo game sau chép khung Trà Sữa.
- Chat ở phòng công khai: chỉ cho câu chọn sẵn (an toàn nhất cho trẻ) hay chat tự do có lọc từ?
- Vị trí quảng cáo SpeakUp Kids: thẻ "Tài trợ" cuối kệ game, chân trang, hay dưới nút ở thẻ kết thúc ván?
- Khu "Thử thách hôm nay": hạ cấp như đề xuất P-E hay bỏ hẳn?
- Ai Là Nội Gián: có duyệt quota vẽ 8 chân dung pixel thay ô màu không?
- Có đặt Cloudflare (CDN) trước Railway không — cần quyền vào tên miền lumkeo.com.

## Giới hạn của audit

- Toàn bộ kiểm trên Chrome headless giả lập; chưa có iPhone/Android thật, chưa thử Safari/WebKit và Firefox. Lỗi riêng iOS (phóng to ô nhập, thanh địa chỉ, âm thanh .ogg, safe-area) chỉ suy ra từ code.
- Số đo hiệu năng là số phòng lab, nhiễu vì 7 agent chạy song song trên cùng máy; chỉ kết luận khi lặp lại hoặc thấy trong trace. Không có dữ liệu người dùng thật (CrUX).
- Công cụ Lighthouse của MCP không có mục Performance nên phần hiệu năng dùng trace + script CDP.
- Rớt mạng thật khi WebSocket đang mở chưa mô phỏng được (CDP offline không cắt kết nối đang mở).
- Trạng thái cuối game của Tập Làm Chủ dựng bằng chính hàm logic của game, không chơi tay nhiều ngày; cân bằng kinh tế chưa đánh giá.
- Quảng cáo không có vị trí nào để đánh giá (khối SpeakUp Kids đã bị gỡ).
- Không thao tác ghi nào lên bản thật lumkeo.com (chỉ HEAD/đọc).

## Tài liệu

- [IMPROVEMENT_ROADMAP.md](IMPROVEMENT_ROADMAP.md) — lộ trình theo đợt
- [UI_UX_AUDIT.md](UI_UX_AUDIT.md) · [MOBILE_UX_AUDIT.md](MOBILE_UX_AUDIT.md) · [GAME_EXPERIENCE_AUDIT.md](GAME_EXPERIENCE_AUDIT.md) · [PERFORMANCE_AUDIT.md](PERFORMANCE_AUDIT.md)
- [SKILL_INVENTORY.md](SKILL_INVENTORY.md)
- `raw/` — 7 báo cáo gốc của từng agent (phạm vi đã chạy, bằng chứng, file:dòng)
