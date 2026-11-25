# Audit giao diện & trải nghiệm (Visual, Flow, Copy, Animation, Accessibility, Ads, An toàn trẻ em)

_Audit Lụm Kèo · 24–25/11/2026 · 7 agent kiểm song song trên trình duyệt thật (Chrome headless giả lập). Ảnh chụp nằm ngoài git; bằng chứng chi tiết ở `raw/`._

**Điểm mạnh giữ nguyên:** bản sắc pixel V5 nhất quán ở trang chủ, game cờ, Nông Trại, Thám Tử Hẻm; không thấy dấu vết giao diện "AI làm theo khuôn"; lún + tiếng ở mọi nút; không bắt đăng nhập; câu chữ tiếng Việt tự nhiên, dấu đúng.

**Vấn đề hệ thống:**
- **An toàn trẻ em (2/10):** tên và chat ở mọi game online không lọc từ tục, tên hiện công khai ở sảnh trang chủ (P0), phòng mặc định công khai, không có nút tắt chat / mời ra. Bộ lọc đã có sẵn (bảng xếp hạng) nhưng chưa dùng cho phòng chơi.
- **Lệch V5:** 3 game tiệm (Trà Sữa, Bánh Mì, Cơm Tấm) dùng khung UI bo tròn + bóng mờ kiểu app; hộp thoại confirm() hệ thống ở game cờ; nhãn nội bộ "bản chơi thử · pixel V5" lộ ở 13–15 game; Ai Là Nội Gián dùng ô màu thay chân dung.
- **Danh tính phân mảnh:** tên người chơi lưu ở ~10 chỗ khác nhau, mỗi game hỏi lại (xem đề xuất P-A, P-B).
- **Quảng cáo:** khối SpeakUp Kids đã bị gỡ nhầm ngày 18/11; đề xuất vị trí an toàn: thẻ "Tài trợ" cuối kệ game, chân trang, hoặc dưới nút ở thẻ kết thúc ván (cách nút ≥ 24 px, nhãn rõ, giữ chỗ cố định); tránh trong ván, phòng chờ, thanh dính đáy.

## Đề xuất theo hướng chủ dự án (tham khảo cấu trúc Đấu Trí, giữ V5)

- **P-A** (ưu tiên cao, công M): Tên khách tự sinh dùng chung toàn site ("Heo Cute 15", "Mèo Mập 42"), là nguồn tên duy nhất cho mọi game + bảng xếp hạng; tên tự sửa đi qua bộ lọc từ tục. Giải luôn chuyện phải gõ tên ~10 lần.
- **P-B** (ưu tiên cao, công S-M): Ô hồ sơ luôn hiện ở góc phải thanh trên cùng (avatar + tên + ✎), chạm mở popover: sửa tên, chuỗi ngày, link Bảng xếp hạng; "Đăng nhập" thêm sau.
- **P-C** (ưu tiên TB, công M): Trang Bảng xếp hạng riêng (3 tab Sudoku / 2048 / Đố Vui, hôm nay + hôm qua), link từ điều hướng, ô hồ sơ, thẻ có hạng.
- **P-D** (ưu tiên TB, công M): Thanh điều hướng kiểu Đấu Trí theo phong cách pixel: Chơi · Phòng online · Thử thách · Bảng xếp hạng (desktop); nút ☰ hoặc hàng chip trên điện thoại; thêm h1.
- **P-E** (ưu tiên TB, công S-M): Hạ cấp khu "Thử thách hôm nay": bỏ hàng thẻ lớn trên trang chủ, thay bằng nhãn "★ Thử thách" trên thẻ Sudoku / 2048 / Đố Vui + mục Thử thách trên điều hướng; người có chuỗi ngày thấy 1 dòng nhắc.
- **P-F** (ưu tiên thấp, công M): Sảnh kiểu Đấu Trí: tab "Phòng chờ / Đang diễn ra" + "N người đang chơi" (chỉ sau khi có lọc tên, chỉ hiện số khi đủ lớn).

## Danh sách (63)

### P0 (1)

| ID | Mức | Game / trang | Vấn đề | Đề xuất sửa | Công |
|---|---|---|---|---|---|
| PTY-01 | P0 | Ma Sói, Nội Gián, Đặt Bom, Nối Từ, cờ online, trang chủ | Tên tục không bị lọc và hiện công khai ở Sảnh chờ trực tiếp trên trang chủ (đã thử: "đụ má…", "C*c B*", "Fuck You" đều được chấp nhận) | Đưa bộ lọc từ tục có sẵn (games-server/account/names.mjs) ra module dùng chung, gọi ở create/join của mọi host + lọc ở /api/lobby; thêm biến thể không dấu / leetspeak. Gộp HOME-07. | M |

### P1 (6)

| ID | Mức | Game / trang | Vấn đề | Đề xuất sửa | Công |
|---|---|---|---|---|---|
| PTY-02 | P1 | Ma Sói, Nội Gián, Đặt Bom, Nối Từ | Chat không lọc từ tục, không có nút tắt tiếng hay báo cáo người chơi; "Gửi riêng" 1-1 của Nội Gián cũng không lọc | Che từ tục thành ***, ẩn URL, nút "Tắt tiếng người này"; cân nhắc chat nhanh (câu chọn sẵn) cho phòng công khai. | M |
| BRD-07 | P1 | Cờ Caro, Vua, Tướng, Cá Ngựa, Tỷ Phú, Ô Ăn Quan | Chat tự do ở phòng công khai, không lọc nội dung; tin nhắn hiện thành toast đè bàn cờ kể cả khi khung chat đóng; không có nút tắt/chặn | Nút "Tắt chat" (nhớ trong localStorage); lọc từ tiếng Việt phía server dùng chung games-server/*/chat.js; phòng công khai chỉ câu chọn sẵn. | M |
| BRD-01 | P1 | Cờ Caro, Vua, Tướng, Cá Ngựa, Tỷ Phú, Ô Ăn Quan | Đóng tab giữa ván là mất ghế vĩnh viễn ("Phòng này đang chơi, không vào thêm được"); máy đánh thay tới hết ván; người còn lại không được báo. F5 thì vẫn vào lại | Lưu {mã phòng, token ghế} vào localStorage theo game, mở link có token còn hạn thì gửi resume thay vì join; sửa một lần trong khuôn createRoomHost / net.js. Gộp OAQ-01. | M |
| PTY-03 | P1 | Ma Sói, Ai Là Nội Gián | Chủ phòng rời hoặc mất kết nối giữa ván thì hết ván không ai bấm "Chơi ván mới" được | Chuyển chủ phòng khi chủ mất kết nối ở mọi pha (_pickHost) hoặc trong _again; sửa cả hai game. | S |
| HOME-02 | P1 | Trang chủ | Màn đầu điện thoại chưa có thẻ game nào: chỉ thấy slide nổi bật + khung mã phòng cao 205 px; thẻ game đầu ở dưới màn (Poki thấy ~12 game) | Trên ≤720 px: thu sảnh còn 1 hàng, dải cuộn ngang 6–8 game "Chơi ngay" dưới slide, thêm h1, hạ cấp khu Thử thách (xem P-E). | M |
| BRD-02 | P1 | Cờ Cá Ngựa | Bấm Chơi xong trang vẫn cuộn ở dưới, khay xúc xắc và dòng lượt của mình nằm ngoài màn hình | scrollTo(0,0) khi vào ván; phòng chờ thành overlay trên màn hẹp. | S |

### P2 (31)

| ID | Mức | Game / trang | Vấn đề | Đề xuất sửa | Công |
|---|---|---|---|---|---|
| PTY-12 | P2 | Mọi game online | Phòng mặc định là công khai (Đặt Bom tick sẵn), hiện ngay trên trang chủ với nút Vào; chủ phòng không có nút mời người ra | Mặc định phòng kín; thêm nút "Mời ra" cho chủ phòng. | M |
| BRD-10 | P2 | Cờ Caro, Vua, Tướng, Ô Ăn Quan | Đối thủ rớt mạng gần như vô hình; sau 15 giây máy âm thầm đánh thay, người còn lại tưởng vẫn đấu với bạn | Nhãn "mất kết nối" trên thẻ người chơi theo players[i].connected + toast "máy đánh thay" (Tỷ Phú đã làm đúng). Gộp OAQ-04. | S |
| BRD-09 | P2 | Cờ Caro, Vua, Tướng, Ô Ăn Quan | Rematch một phía: một người bấm "Ván tiếp" là ván mới chạy và thẻ kết quả của người kia tự đóng, không kịp Khoe | Chỉ mở ván mới khi cả hai sẵn sàng hoặc đếm ngược 10 giây hiện cho cả hai. Gộp OAQ-07. | S-M |
| HOME-11 | P2 | Trang chủ | Khối tài trợ SpeakUp Kids đã biến mất từ ngày 18/11 (commit abce682, có lẽ gỡ nhầm), chỉ còn CSS thừa | Chủ dự án quyết vị trí; đề xuất: thẻ "Tài trợ" cùng cỡ thẻ game cuối kệ, hoặc chân trang; không đặt sát nút Chơi/Vào phòng. | S |
| HOME-04 | P2 | Trang chủ (có thể cả ô mã trong game) | Dán mã phòng kèm khoảng trắng / chữ thì mất ký tự (" WEBYS" → "WEBY", "Mã: WEBYS" → "MW") | Bỏ maxlength, cắt sau khi lọc; khi dán tìm mẫu 5 ký tự chữ-số. | S |
| HOME-08 | P2 | Trang chủ | Thẻ phòng trên desktop cắt mất mã phòng và tên chủ phòng ("Cờ Caro #MWZ…") | Mã phòng không co lại, cho tên game rút gọn trước. | S |
| HOME-09 | P2 | Trang chủ | Tìm kiếm chỉ khớp tên ("doi khang", "2 nguoi" ra 0), bị giới hạn trong tab đang lọc mà không báo, trạng thái rỗng trơ | Khớp thêm thể loại / số người, bỏ lọc tab khi có từ khoá, trạng thái rỗng gợi ý 4 game. | S-M |
| HOME-10 | P2 | Trang chủ | Bấm phím mũi tên trên slide nổi bật làm mất focus; slide là link mang role=group | Bọc div role=group ngoài link; focus slide mới. | S |
| HOME-12 | P2 | Trang Quyền riêng tư | Trang Quyền riêng tư ghi "Liên hệ: đang cập nhật" mà lại bảo người dùng gửi yêu cầu xoá dữ liệu | Chủ dự án gửi email liên hệ công khai; thêm ý tên chủ phòng hiện công khai ở sảnh. | S |
| QCK-03 | P2 | 2048, Sudoku, Đố Vui (daily) | Màn kết quả thử thách hôm nay phủ lên link "← Trang chủ", bấm không về được | Thêm nút "Về trang chủ / Thử thách khác" trong panel hoặc nâng header. | S |
| TLC1-04 | P2 | Tiệm Trà Sữa (lây sang Bánh Mì, Cơm Tấm) | Khung UI bo tròn 12–18 px + bóng mờ kiểu SaaS, lệch art bible V5 và lệch Nông Trại; hai game cùng dòng hai hệ UI | Chủ dự án chốt chuẩn; nếu theo V5: góc bậc pixel + bóng cứng như ui-kit Nông Trại. Gộp TLC2-18. | M |
| TLC1-02 | P2 | Nông Trại | "Cách chơi" lần đầu mở ra đã cuộn sẵn tới cuối, trẻ thấy giữa danh sách 11 gạch đầu dòng | focus({preventScroll:true}), scrollTop = 0, lần đầu chỉ 3–4 dòng. | S |
| TLC1-06 | P2 | Nông Trại | Nút "Phía Đông →" che biển Làng, dấu "!" và xe giao hàng | Dời xuống góc dưới hoặc thu thành mũi tên nửa trong suốt. | S |
| TLC1-07 | P2 | Nông Trại | Chế độ Xây: nhãn "Hoàn thành" đè nhau và bị ô trang trí che | Chỉ gắn nhãn cho lô xây/nâng được hoặc đang xây. | S |
| TLC1-10 | P2 | Tiệm Trà Sữa | Cảnh điện thoại phóng ở hệ số lẻ (1,2555 ở 360) nên ô pixel to nhỏ không đều, trái PLAYBOOK §2 | Làm tròn xuống bội 0,5, bỏ zoom lẻ cho icon. Gộp TLC2-16. | S-M |
| TLC2-06 | P2 | Tiệm Bánh Mì | Báo "Chưa có khách chờ" trong khi có 2–5 khách đang chờ | Đổi thành "Có N khách đang chờ, chạm phiếu để ghim". | S |
| TLC2-07 | P2 | Quán Cơm Tấm | Câu gợi ý ngày 1 bị cắt "…" đúng chỗ chỉ cách làm | line-clamp 2 dòng hoặc câu ngắn cho mobile. | S |
| TLC2-08 | P2 | Quán Cơm Tấm | Nhãn vỉ nướng "N / V / Ấ" khó hiểu với trẻ (desktop có nhãn Nóng/Vừa/Giữ ấm) | Giữ nhãn vùng trên mobile hoặc tô màu theo vùng. | S |
| TLC2-11 | P2 | Bánh Mì, Cơm Tấm | Nút chạm nhỏ hơn 44 px (Cơm Tấm nút về 15×34, thanh trên cao 32; Bánh Mì nút Rút 42×38, ba hàng lò không khe) | Mọi nút ≥ 44 px, hàng lò cách 8 px. | S |
| TLC2-12 | P2 | Bánh Mì, Cơm Tấm | 3 thông báo cùng màu xếp chồng che ~40% cảnh | Màu riêng cho lên cấp / gợi ý, ẩn thông báo khi mở bảng chốt ca. | S |
| TLC2-13 | P2 | Bánh Mì, Cơm Tấm | Bảng chốt ca quá "kế toán" với trẻ (Giá vốn, Hao hụt, Lời vận hành, ký gửi) | 3 số to ở đầu, nút chính dính đáy, chi tiết gập lại. | S |
| TTH-01 | P2 | Thám Tử Hẻm | Khung thoại phủ cả thanh trên cùng: không tắt tiếng, không quay lại được suốt đoạn thoại | Khung thoại bắt đầu dưới thanh trên, hoặc nâng thanh trên. | S |
| OAQ-02 | P2 | Ô Ăn Quan | Câu "Bạn giữ hàng dưới" sai khi bàn xoay dọc (hàng của mình là cột phải), người mới chạm nhầm | Đổi chữ theo hướng bàn, hoặc "các ô có khung xanh sáng". | S |
| BRD-11 | P2 | Cờ Vua, Cá Ngựa (và các game khác) | Dùng hộp thoại confirm() của trình duyệt cho Xin thua / Rời / Hủy phòng, lệch phong cách V5 | Viết pxConfirm dùng chung trong _shared/. | S-M |
| BRD-15 | P2 | Cờ Cá Ngựa | Nút "Rời bàn — về phòng chờ" thực ra rời hẳn phòng | Đổi nhãn "Rời phòng" + cảnh báo. | S |
| BRD-16 | P2 | Cờ Cá Ngựa | "NGUYỄN" hiển thị thành "NGUYÊN" ở phòng chờ (dấu chồng bị cắt) | line-height 1,35 hoặc không viết hoa tên người. | S |
| QCK-01 | P2 | 13–15 game | Nhãn nội bộ "Lụm Kèo · bản chơi thử · pixel V5" hiện cho người chơi (cả trong <title> vài game) | Xoá hàng loạt một lần. Gộp BRD-17. | S |
| PTY-06 | P2 | Ma Sói, Nội Gián | Tên dài làm vỡ màn kết quả (thẻ đè nhau / tràn ra ngoài) | Lưới minmax(0,1fr) + overflow-wrap:anywhere. | S |
| PTY-10 | P2 | Ai Là Nội Gián | Người chơi là ô màu + chữ cái, trông như placeholder, lệch V5 | 8 chân dung pixel (cần duyệt quota vẽ). | M |
| QCK-05 | P2 | Đào Vàng | Dọc cảnh quá nhỏ (chữ kết quả ~7 px trên canvas, nút Khoe đè hộp); ngang nút điều khiển ngoài màn | Chuyển về khuôn HUD + overlay HTML như các game khác. | M |
| QCK-04 | P2 | Rắn, Xếp Gạch, nhiều game | Nút Tạm dừng / Âm thanh 36×24 px, link "← Trang chủ" ~92×23 px | Tối thiểu 44 px. | S |

### P3 (25)

| ID | Mức | Game / trang | Vấn đề | Đề xuất sửa | Công |
|---|---|---|---|---|---|
| HOME-13 | P3 | Trang chủ | Không có h1; link "bỏ qua tới danh sách game" bị header dính che | Thêm h1, scroll-margin-top cho #games. | S |
| HOME-14 | P3 | Trang chủ | Nhãn MỚI/HOT phủ 16/25 game nên hết tác dụng | "Mới" chỉ cho game ra trong 14 ngày, tối đa ~4 nhãn. | S |
| HOME-15 | P3 | Bảng xếp hạng | Đổi tên quá ngắn thì âm thầm thành "Người chơi", không báo lỗi | Kiểm 2–16 ký tự ở client, báo rõ. | S |
| HOME-17 | P3 | Thử thách hôm nay | Xong một thử thách không có lối sang 2 thử thách còn lại | Thêm dòng "Còn: Sudoku #N · 2048 #N" trong màn kết quả. | S |
| HOME-18 | P3 | Trang chủ | Vặt: thẻ game mobile trống ~40% chiều cao, nút ‹› đè ảnh slide, header dính chỉ có logo, trang 404 là chữ trơn, chữ 10–11 px ở nhãn, Esc không đóng bảng kết quả thử thách | Xem báo cáo HOME §3. | S |
| TLC1-11 | P3 | Nông Trại | Lên cấp chỉ là một toast đè hàng ruộng cuối; thẻ khoe ghi "Đơn đã giao: 0" | Dùng thẻ ăn mừng toàn màn cho lên cấp có mở khoá. | S |
| TLC1-12 | P3 | Nông Trại | Bảng Cách chơi / Xây / thẻ ăn mừng che nút tắt tiếng | Nút loa nằm trên lớp phủ. | S |
| TLC1-13 | P3 | Nông Trại | Gà to gần bằng chuồng (trái quy tắc cùng thước) | Code thu nhỏ hoặc Codex vẽ lại. | S/M |
| TLC1-16 | P3 | Nông Trại, Trà Sữa | Vặt: link "←" nhỏ và không lún, nút Nhận tiệm dưới mép, tên tiệm cắt ngầm 32 ký tự, nhấn giữ trên iOS bôi chữ, chữ trên nền gỗ đỏ khó đọc | Xem báo cáo TLC1 §3. | S |
| TLC2-15 | P3 | Quán Cơm Tấm | Tiền không có dấu phân cách ("97696k"), số lớn bị cắt đè nút Tiếng | Định dạng có dấu chấm như Bánh Mì. | S |
| TLC2-19 | P3 | Bánh Mì, Cơm Tấm | Vài nút UI im lặng (tab, Tạm dừng, Mở hàng…), link về không lún | Dùng tiếng bấm chung của feedback.js. | S |
| TTH-06 | P3 | Thám Tử Hẻm | Toast chồng 3 tầng che cảnh và câu hỏi phụ | Gộp 1 toast, đặt ở đáy. | S |
| TTH-07 | P3 | Thám Tử Hẻm | Chữ bị cắt ("Lịch treo tườn", "Bé Mít Re…"), tên cắt 24 ký tự bỏ emoji không báo | Cho chữ xuống dòng / rút gọn có nghĩa. | S |
| TTH-08 | P3 | Thám Tử Hẻm | Thẻ chia sẻ ghi hạng "Thám tử hẻm" nhưng câu trích là "Suýt soát thôi, thám tử tập sự!" | Câu trích theo hạng. | S |
| TTH-09 | P3 | Thám Tử Hẻm | Thanh danh tiếng 0% là dải đen trơn trông như lỗi | Hiện khung rỗng có vạch / chữ 0%. | S |
| OAQ-05 | P3 | Ô Ăn Quan | Mũi tên che số sỏi của ô đang chọn | Đặt mũi tên lệch ra ngoài. | S |
| OAQ-06 | P3 | Ô Ăn Quan | "Tạm dừng" khi chơi online không dừng gì (đồng hồ vẫn chạy) | Đổi thành "Menu", ghi "ván vẫn tiếp tục". | S |
| OAQ-08 | P3 | Ô Ăn Quan | Một lần bấm Tạm dừng phát 3 tiếng chồng nhau | data-nosfx cho nút menu, kiểm vì sao feedback.js kêu 2 lần. | S |
| OAQ-09 | P3 | Ô Ăn Quan | Thiếu prefers-reduced-motion; nền sân lộ đường nối ở màn nhỏ | Thêm reduced-motion, sửa ghép nền. | S |
| BRD-19 | P3 | Cờ online | Thẻ kết thúc che bàn chỉ ~1,3 giây sau nước quyết định | Chờ 2–2,5 giây. | S |
| BRD-22 | P3 | Cờ Caro | Tên chèn vào innerHTML không escape (server đã lọc <> nên chưa khai thác được) | Escape như Cờ Vua/Tướng. | S |
| BRD-23 | P3 | Cờ Tỷ Phú | Nút loa dùng emoji 🔊 thay icon pixel | Dùng icon pixel chung. | S |
| PTY-13 | P3 | Ma Sói, Nội Gián | Cắt tên làm vỡ emoji (còn nửa ký tự) | Cắt theo ký tự thật [...s].slice(). | S |
| QCK-06 | P3 | Đố Vui | Link "← Trang chủ" xuống 2 dòng ở chế độ thử thách | white-space:nowrap. | S |
| QCK-07 | P3 | 2048, trang chủ, Trà Sữa | Lỗi a11y Lighthouse: role=grid sai, thiếu <main>, aria-label lệch chữ, dialog không tên, tương phản 2,37:1 | Sửa theo từng mục. | S |
