# Lộ trình cải thiện

_Audit Lụm Kèo · 24–25/11/2026 · 7 agent kiểm song song trên trình duyệt thật (Chrome headless giả lập). Ảnh chụp nằm ngoài git; bằng chứng chi tiết ở `raw/`._

Chưa sửa gì — chờ chủ dự án duyệt. Sau khi duyệt: Claude Code triển khai theo đợt, Codex review + kiểm thử độc lập.

## Đợt 0 — Vá gấp (an toàn trẻ em + mất ghế online)

**Vì sao:** Đang có trên bản thật: tên tục hiện công khai ở trang chủ, chat không lọc, phòng mặc định công khai; người chơi đóng tab là mất ván.

| ID | Mức | Game / trang | Vấn đề | Đề xuất sửa | Công |
|---|---|---|---|---|---|
| PTY-01 | P0 | Ma Sói, Nội Gián, Đặt Bom, Nối Từ, cờ online, trang chủ | Tên tục không bị lọc và hiện công khai ở Sảnh chờ trực tiếp trên trang chủ (đã thử: "đụ má…", "C*c B*", "Fuck You" đều được chấp nhận) | Đưa bộ lọc từ tục có sẵn (games-server/account/names.mjs) ra module dùng chung, gọi ở create/join của mọi host + lọc ở /api/lobby; thêm biến thể không dấu / leetspeak. Gộp HOME-07. | M |
| PTY-02 | P1 | Ma Sói, Nội Gián, Đặt Bom, Nối Từ | Chat không lọc từ tục, không có nút tắt tiếng hay báo cáo người chơi; "Gửi riêng" 1-1 của Nội Gián cũng không lọc | Che từ tục thành ***, ẩn URL, nút "Tắt tiếng người này"; cân nhắc chat nhanh (câu chọn sẵn) cho phòng công khai. | M |
| BRD-07 | P1 | Cờ Caro, Vua, Tướng, Cá Ngựa, Tỷ Phú, Ô Ăn Quan | Chat tự do ở phòng công khai, không lọc nội dung; tin nhắn hiện thành toast đè bàn cờ kể cả khi khung chat đóng; không có nút tắt/chặn | Nút "Tắt chat" (nhớ trong localStorage); lọc từ tiếng Việt phía server dùng chung games-server/*/chat.js; phòng công khai chỉ câu chọn sẵn. | M |
| PTY-12 | P2 | Mọi game online | Phòng mặc định là công khai (Đặt Bom tick sẵn), hiện ngay trên trang chủ với nút Vào; chủ phòng không có nút mời người ra | Mặc định phòng kín; thêm nút "Mời ra" cho chủ phòng. | M |
| BRD-01 | P1 | Cờ Caro, Vua, Tướng, Cá Ngựa, Tỷ Phú, Ô Ăn Quan | Đóng tab giữa ván là mất ghế vĩnh viễn ("Phòng này đang chơi, không vào thêm được"); máy đánh thay tới hết ván; người còn lại không được báo. F5 thì vẫn vào lại | Lưu {mã phòng, token ghế} vào localStorage theo game, mở link có token còn hạn thì gửi resume thay vì join; sửa một lần trong khuôn createRoomHost / net.js. Gộp OAQ-01. | M |
| PTY-03 | P1 | Ma Sói, Ai Là Nội Gián | Chủ phòng rời hoặc mất kết nối giữa ván thì hết ván không ai bấm "Chơi ván mới" được | Chuyển chủ phòng khi chủ mất kết nối ở mọi pha (_pickHost) hoặc trong _again; sửa cả hai game. | S |
| BRD-22 | P3 | Cờ Caro | Tên chèn vào innerHTML không escape (server đã lọc <> nên chưa khai thác được) | Escape như Cờ Vua/Tướng. | S |

**Nghiệm thu:** Tên/chat tục bị che hoặc từ chối ở mọi game online + sảnh trang chủ (có test); có nút Tắt chat; phòng mặc định kín; đóng tab rồi mở lại link trong 60 giây về đúng ghế; chủ phòng rời giữa ván vẫn chơi lại được.

## Đợt 1 — Nền hiệu năng (lợi cho mọi game)

**Vì sao:** Một lần sửa server + font + giữ chỗ bố cục là cả cổng nhanh hơn; người chơi Việt Nam đang tải từ Chicago, không nén.

| ID | Mức | Game / trang | Vấn đề | Đề xuất sửa | Công |
|---|---|---|---|---|---|
| PERF-04 | P1 | Toàn cổng | Server không nén gzip/br, không ETag/Last-Modified (luôn trả lại đủ byte), HTTP/1.1; server đặt ở Chicago, không CDN | server.js: nén zlib + ETag/304 + max-age 1 năm immutable cho file có ?v=; lâu dài đặt Cloudflare phía trước. | S/M |
| PERF-05 | P2 | Toàn cổng | Google Fonts chặn hiện trang (ước tiết kiệm ~2,1 giây); font dự phòng Georgia vỡ dấu tiếng Việt khi Google Fonts lỗi | Tự host font subset tiếng Việt + preload; đổi font dự phòng. Gộp HOME-06. | S |
| PERF-02 | P1 | Trang chủ | Trang chủ nhảy bố cục khi tải: CLS 1,0–1,2 trên điện thoại (0,94 khi giả lập 4G chậm), tới 0,4 trên desktop; LCP 5,96 giây | Giữ chỗ sẵn cho hero / lưới game / khu thử thách, đặt ô tìm kiếm bằng CSS thay vì JS, preload ảnh slide đầu. Gộp HOME-01. | S-M |
| HOME-03 | P2 | Trang chủ | Trang chủ tải ngay 2,5 MB ảnh (thumb ~100 KB hiện ở 113 px); mạng chậm thì sảnh chờ báo lỗi | Thumb 240w + srcset, gán ảnh slide khi tới lượt, không render lưới Mở phòng nhanh trên mobile, gọi API sảnh trước + thử lại. | M |
| PERF-01 | P1 | Tiệm Trà Sữa (có lẽ cả Bánh Mì, Cơm Tấm) | Trà Sữa tự tải ngầm ~7 MB ảnh HD khi người chơi chưa làm gì (tổng 12,2 MB trên điện thoại) | Chỉ tải mỗi sheet ngay trước khi cần; journal-card sang WebP; dùng bản thường thay -hd trên màn nhỏ. Đạt: đứng yên 60 giây < 3 MB. | M |
| PERF-03 | P1 | Thám Tử Hẻm | Trắng màn hình 18,5 giây khi giả lập 4G chậm + máy yếu: 24 module JS tải nối tiếp, mọi file vụ án tải ngay từ đầu | Nén (PERF-04), modulepreload, màn tựa HTML tĩnh, chỉ nạp file vụ khi chọn vụ, srcset ảnh tựa. Gộp TTH-05. | M |
| BRD-06 | P1 | Cờ Tỷ Phú | Cờ Tỷ Phú nặng 2,3 MB (bàn 1,3 MB + poster 0,9 MB), chữ đầu tiên hiện sau 8,2 giây trên 3G | Xuất ảnh đúng cỡ hiển thị (~1.344 px), srcset 1×/2×, poster ≤ 150 KB, giữ lưới 2× sắc nét. | M |
| PERF-07 | P2 | Ma Sói | Sảnh Ma Sói tải 3,4 MB, gồm cả ảnh làng ban đêm chưa cần | Tải ảnh đêm khi vào phòng; PNG sang WebP. | S |
| PERF-06 | P2 | Nông Trại | Nông Trại nhảy bố cục khi tải (CLS 0,47–0,66), có long task 65–170 ms mỗi giây | Giữ chỗ cho các khối bản đồ; placePan chỉ chạy khi resize/scroll/đổi cảnh. Gộp TLC1-15. | S-M |

**Nghiệm thu:** Có gzip/br + ETag/304 + cache dài cho file có ?v=; CLS trang chủ < 0,1 (390/412, 4G chậm + CPU 4×); Trà Sữa đứng yên 60 giây < 3 MB; Thám Tử FCP < 4 giây; Tỷ Phú ≤ 700 KB.

## Đợt 2 — Thao tác chính trên điện thoại (game ưu tiên)

**Vì sao:** Các game làm kỹ nhất đang vướng chính chỗ người chơi chạm nhiều nhất.

| ID | Mức | Game / trang | Vấn đề | Đề xuất sửa | Công |
|---|---|---|---|---|---|
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
| TTH-01 | P2 | Thám Tử Hẻm | Khung thoại phủ cả thanh trên cùng: không tắt tiếng, không quay lại được suốt đoạn thoại | Khung thoại bắt đầu dưới thanh trên, hoặc nâng thanh trên. | S |
| OAQ-02 | P2 | Ô Ăn Quan | Câu "Bạn giữ hàng dưới" sai khi bàn xoay dọc (hàng của mình là cột phải), người mới chạm nhầm | Đổi chữ theo hướng bàn, hoặc "các ô có khung xanh sáng". | S |
| QCK-02 | P2 | Rắn, Xếp Gạch (ngang), Bắn Bóng (desktop) | Nút "Bắt đầu" nằm dưới mép màn hình, người chơi chỉ thấy phần luật | Rule chung @media (max-height:500px): thu luật vào <details> hoặc ghim nút. | S |
| TLC2-05 | P2 | Tiệm Bánh Mì | Tràn ngang ở 360 và 320 px (tab Chuẩn bị, dải bước) | min-width:0 + overflow-x:auto, .app overflow-x:clip, thêm kiểm noOverflowX 360 vào e2e. | S |

**Nghiệm thu:** Ở 360/390/412: nút của bước hiện tại luôn bấm được không cần cuộn (Trà Sữa, Bánh Mì ≤ 10 chạm/ổ); 768 và 844×390 có bố cục riêng, không mất nút; một rule chung cho màn thấp (max-height ≤ 500 px).

## Đợt 3 — Danh tính + trang chủ theo hướng chủ dự án

**Vì sao:** Chủ dự án muốn bớt giấu: tên tự sinh dùng chung, ô hồ sơ, bảng xếp hạng dễ thấy, trang chủ đưa người mới vào game nhanh.

| ID | Mức | Game / trang | Vấn đề | Đề xuất sửa | Công |
|---|---|---|---|---|---|
| HOME-02 | P1 | Trang chủ | Màn đầu điện thoại chưa có thẻ game nào: chỉ thấy slide nổi bật + khung mã phòng cao 205 px; thẻ game đầu ở dưới màn (Poki thấy ~12 game) | Trên ≤720 px: thu sảnh còn 1 hàng, dải cuộn ngang 6–8 game "Chơi ngay" dưới slide, thêm h1, hạ cấp khu Thử thách (xem P-E). | M |
| HOME-09 | P2 | Trang chủ | Tìm kiếm chỉ khớp tên ("doi khang", "2 nguoi" ra 0), bị giới hạn trong tab đang lọc mà không báo, trạng thái rỗng trơ | Khớp thêm thể loại / số người, bỏ lọc tab khi có từ khoá, trạng thái rỗng gợi ý 4 game. | S-M |
| HOME-04 | P2 | Trang chủ (có thể cả ô mã trong game) | Dán mã phòng kèm khoảng trắng / chữ thì mất ký tự (" WEBYS" → "WEBY", "Mã: WEBYS" → "MW") | Bỏ maxlength, cắt sau khi lọc; khi dán tìm mẫu 5 ký tự chữ-số. | S |
| HOME-05 | P2 | Trang chủ | Ô tìm kiếm chữ 14 px trên điện thoại, iPhone sẽ tự phóng to khi chạm | Cỡ chữ 16 px trên ≤720 px. | S |
| HOME-11 | P2 | Trang chủ | Khối tài trợ SpeakUp Kids đã biến mất từ ngày 18/11 (commit abce682, có lẽ gỡ nhầm), chỉ còn CSS thừa | Chủ dự án quyết vị trí; đề xuất: thẻ "Tài trợ" cùng cỡ thẻ game cuối kệ, hoặc chân trang; không đặt sát nút Chơi/Vào phòng. | S |
| QCK-03 | P2 | 2048, Sudoku, Đố Vui (daily) | Màn kết quả thử thách hôm nay phủ lên link "← Trang chủ", bấm không về được | Thêm nút "Về trang chủ / Thử thách khác" trong panel hoặc nâng header. | S |
| HOME-15 | P3 | Bảng xếp hạng | Đổi tên quá ngắn thì âm thầm thành "Người chơi", không báo lỗi | Kiểm 2–16 ký tự ở client, báo rõ. | S |
| HOME-16 | P3 | Bảng xếp hạng | Cùng "4/5" mà khác hạng, không hiện thời gian (tiêu chí phụ) | Hiện "4/5 · 3,8 giây". | S |
| HOME-17 | P3 | Thử thách hôm nay | Xong một thử thách không có lối sang 2 thử thách còn lại | Thêm dòng "Còn: Sudoku #N · 2048 #N" trong màn kết quả. | S |

**Đề xuất kèm (theo hướng chủ dự án):**

- **P-A** (cao, M): Tên khách tự sinh dùng chung toàn site ("Heo Cute 15", "Mèo Mập 42"), là nguồn tên duy nhất cho mọi game + bảng xếp hạng; tên tự sửa đi qua bộ lọc từ tục. Giải luôn chuyện phải gõ tên ~10 lần.
- **P-B** (cao, S-M): Ô hồ sơ luôn hiện ở góc phải thanh trên cùng (avatar + tên + ✎), chạm mở popover: sửa tên, chuỗi ngày, link Bảng xếp hạng; "Đăng nhập" thêm sau.
- **P-E** (TB, S-M): Hạ cấp khu "Thử thách hôm nay": bỏ hàng thẻ lớn trên trang chủ, thay bằng nhãn "★ Thử thách" trên thẻ Sudoku / 2048 / Đố Vui + mục Thử thách trên điều hướng; người có chuỗi ngày thấy 1 dòng nhắc.
- **P-C** (TB, M): Trang Bảng xếp hạng riêng (3 tab Sudoku / 2048 / Đố Vui, hôm nay + hôm qua), link từ điều hướng, ô hồ sơ, thẻ có hạng.
- **P-D** (TB, M): Thanh điều hướng kiểu Đấu Trí theo phong cách pixel: Chơi · Phòng online · Thử thách · Bảng xếp hạng (desktop); nút ☰ hoặc hàng chip trên điện thoại; thêm h1.
- **P-F** (thấp, M): Sảnh kiểu Đấu Trí: tab "Phòng chờ / Đang diễn ra" + "N người đang chơi" (chỉ sau khi có lọc tên, chỉ hiện số khi đủ lớn).

**Nghiệm thu:** Khách mới có tên tự sinh ở mọi game + bảng xếp hạng; màn đầu 390 có ≥ 6 thẻ game; bảng xếp hạng vào được trong 1 chạm từ điều hướng; quảng cáo SpeakUp Kids đặt lại theo vị trí chủ dự án chọn.

## Đợt 4 — Nhất quán V5 + đánh bóng

**Vì sao:** Thống nhất khung UI dòng game tiệm, bỏ chữ dev, hộp thoại pixel chung, Khoe đủ game, vùng chạm ≥ 44 px, các lỗi P2/P3 còn lại.

| ID | Mức | Game / trang | Vấn đề | Đề xuất sửa | Công |
|---|---|---|---|---|---|
| TLC1-04 | P2 | Tiệm Trà Sữa (lây sang Bánh Mì, Cơm Tấm) | Khung UI bo tròn 12–18 px + bóng mờ kiểu SaaS, lệch art bible V5 và lệch Nông Trại; hai game cùng dòng hai hệ UI | Chủ dự án chốt chuẩn; nếu theo V5: góc bậc pixel + bóng cứng như ui-kit Nông Trại. Gộp TLC2-18. | M |
| QCK-01 | P2 | 13–15 game | Nhãn nội bộ "Lụm Kèo · bản chơi thử · pixel V5" hiện cho người chơi (cả trong <title> vài game) | Xoá hàng loạt một lần. Gộp BRD-17. | S |
| BRD-11 | P2 | Cờ Vua, Cá Ngựa (và các game khác) | Dùng hộp thoại confirm() của trình duyệt cho Xin thua / Rời / Hủy phòng, lệch phong cách V5 | Viết pxConfirm dùng chung trong _shared/. | S-M |
| BRD-12 | P2 | Cờ Cá Ngựa, Cờ Tỷ Phú | Không có nút "Khoe kết quả" | Gắn shareResult ở màn kết thúc. | M |
| BRD-08 | P2 | Cờ Caro, Vua, Tướng, Cá Ngựa | Tên dài bị cắt vô nghĩa ("N…"); Cờ Tướng ≤360 ẩn hẳn tên; ô nhập cắt im lặng giữa chữ | Hiện tên gọi khi hẹp, luôn gắn nhãn "Bạn", bộ đếm ký tự. | S-M |
| TLC2-11 | P2 | Bánh Mì, Cơm Tấm | Nút chạm nhỏ hơn 44 px (Cơm Tấm nút về 15×34, thanh trên cao 32; Bánh Mì nút Rút 42×38, ba hàng lò không khe) | Mọi nút ≥ 44 px, hàng lò cách 8 px. | S |
| QCK-04 | P2 | Rắn, Xếp Gạch, nhiều game | Nút Tạm dừng / Âm thanh 36×24 px, link "← Trang chủ" ~92×23 px | Tối thiểu 44 px. | S |
| TTH-02 | P2 | Thám Tử Hẻm | Vụ hướng dẫn quá nặng chữ với trẻ: 27 lần chạm qua thoại, 27 từ khoá, 11 chỗ trống; công cụ điện thoại chỉ có biểu tượng | Cắt intro vụ 1 còn ~8–10 dòng, bật sẵn chế độ soi ở vụ 1, thêm nhãn chữ dưới icon. | M |
| TTH-03 | P2 | Thám Tử Hẻm | Điện thoại ngang: cảnh chỉ 320×180, nửa phải trống | Bố cục 2 cột như desktop khi màn thấp và ngang. | M |
| TLC1-05 | P2 | Nông Trại | HUD + nhiệm vụ chiếm ~1/3 màn 390, khay hạt nằm dưới mép màn trong khi hướng dẫn bảo "chọn hạt ở khay dưới"; ngang gần như không thấy ruộng | HUD mỏng ~44 px, nhiệm vụ 1 dòng, khay hạt dính đáy, bố cục ngang 2 cột. | M |
| TLC1-03 | P2 | Tiệm Trà Sữa | HUD điện thoại chỉ còn biểu tượng (35 / 0 là gì?), cuối game HUD 2 hàng che nhân viên và bong bóng gọi món | Rút gọn số, nhãn ngắn, HUD tối đa 1 hàng, bong bóng tránh HUD. | S-M |
| BRD-09 | P2 | Cờ Caro, Vua, Tướng, Ô Ăn Quan | Rematch một phía: một người bấm "Ván tiếp" là ván mới chạy và thẻ kết quả của người kia tự đóng, không kịp Khoe | Chỉ mở ván mới khi cả hai sẵn sàng hoặc đếm ngược 10 giây hiện cho cả hai. Gộp OAQ-07. | S-M |
| BRD-10 | P2 | Cờ Caro, Vua, Tướng, Ô Ăn Quan | Đối thủ rớt mạng gần như vô hình; sau 15 giây máy âm thầm đánh thay, người còn lại tưởng vẫn đấu với bạn | Nhãn "mất kết nối" trên thẻ người chơi theo players[i].connected + toast "máy đánh thay" (Tỷ Phú đã làm đúng). Gộp OAQ-04. | S |

**Nghiệm thu:** Không còn chữ "bản chơi thử"; không còn confirm() hệ thống; mọi nút chính ≥ 44 px; dòng game tiệm dùng chung một khung UI theo chuẩn đã chốt.

## Quyết định của chủ dự án, sau Đợt 4 (25/11/2026)

| Câu hỏi | Chốt |
|---|---|
| Đối thủ rớt mạng lúc chờ "Ván tiếp" | Giữ như hiện tại: 10 giây tự mở ván, 15 giây máy đánh thay |
| Nút < 44 px khi xoay ngang (2048, Sudoku, Đặt Bom, Nối Từ) | Sửa lên 44 px |
| Nút "Bắt đầu" Đặt Bom ở 360 px | Ghim chân màn hình |
| Tên khách tự sinh (cute + cục súc) | Duyệt, giữ nguyên |
| Giọng văn mở đầu Vụ 1 Thám Tử | Duyệt, giữ nguyên |
| "Mời ra" giữa ván | Không, chỉ ở phòng chờ và sau ván |
| Bánh Mì ngày 1–3 gộp "Lấy" + "Rạch" | Gộp ở ngày 1–3, từ ngày 4 tách |
| Đăng nhập thật | Google trước |
| Thẻ SpeakUp Kids | Ẩn cho tới khi có link thật |
| Email liên hệ / nhóm FB, Zalo | Chưa có, để sau |
| Đợt 5 dọn nốt | Làm luôn |

## Quyết định của chủ dự án (25/11/2026)

| Câu hỏi | Chốt |
|---|---|
| Tên khách (P-A) | Tên tự sinh dùng chung toàn site, **trộn kiểu cute và kiểu "cục súc" hài** (vì không chỉ trẻ em chơi) — vẫn qua bộ lọc từ tục, không tục/xúc phạm. Tự sửa được. |
| Thử thách hôm nay (P-E) | **Thu nhỏ**: bỏ hàng thẻ lớn, nhãn "★ Thử thách" trên thẻ Sudoku / 2048 / Đố Vui, 1 dòng nhắc cho người có chuỗi ngày. Giữ bảng xếp hạng. |
| Thanh trên + trang chủ | Làm cả 4: **ô hồ sơ** (P-B), **trang Bảng xếp hạng** (P-C), **thanh điều hướng** (P-D), **màn đầu điện thoại nhiều game hơn** (HOME-02). |
| SpeakUp Kids (HOME-11) | **Thẻ "Tài trợ" cuối kệ game**, cùng cỡ thẻ game. |
| Khung UI Tập Làm Chủ (TLC1-04) | **Pixel V5 như Nông Trại** (góc bậc, bóng cứng). Trà Sữa / Bánh Mì / Cơm Tấm đổi theo; PLAYBOOK sửa lại. |
| Chat phòng công khai | **Gõ tự do có lọc** (như hiện tại) + nút **"Mời ra"** cho chủ phòng. |
| Đợt 4 làm | Dọn chữ "bản chơi thử" + pxConfirm + nút ≥ 44 px; game cờ online (BRD-08/09/10/12); HUD Nông Trại + Trà Sữa (TLC1-03/05). Thám Tử (TTH-02/03): chủ dự án hỏi lại — chờ giải thích. |
| Quota / quyền | Duyệt: **8 chân dung pixel Ai Là Nội Gián** (Codex vẽ), **Cloudflare trước Railway** (chủ dự án đổi nameserver), commit audit + skill. |

## Cần chủ dự án quyết trước

- Khung UI chuẩn cho dòng Tập Làm Chủ: theo pixel V5 (góc bậc, bóng cứng như Nông Trại) hay giữ kiểu bo tròn của Trà Sữa? Phải chốt trước khi sửa vì PLAYBOOK đang bảo game sau chép khung Trà Sữa.
- Chat ở phòng công khai: chỉ cho câu chọn sẵn (an toàn nhất cho trẻ) hay chat tự do có lọc từ?
- Vị trí quảng cáo SpeakUp Kids: thẻ "Tài trợ" cuối kệ game, chân trang, hay dưới nút ở thẻ kết thúc ván?
- Khu "Thử thách hôm nay": hạ cấp như đề xuất P-E hay bỏ hẳn?
- Ai Là Nội Gián: có duyệt quota vẽ 8 chân dung pixel thay ô màu không?
- Có đặt Cloudflare (CDN) trước Railway không — cần quyền vào tên miền lumkeo.com.

## Checklist nghiệm thu chung

- [ ] Không P0 nào còn mở; P1 của đợt đã sửa có test tự động
- [ ] Không tràn ngang ở 320 / 360 / 390 / 412 / 768 / 844×390 / 1366 / 1920 (e2e chung)
- [ ] Mọi nút chính ≥ 44 px, lún khi ấn, nút tắt tiếng luôn bấm được
- [ ] CLS < 0,1 trang chủ; trang nặng nhất ≤ 3 MB khi đứng yên
- [ ] Tên / chat qua bộ lọc ở mọi game online; phòng mặc định kín
- [ ] Codex review độc lập từng đợt trước khi push
