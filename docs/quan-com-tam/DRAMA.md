# Drama, pha nhầm và review · Quán Cơm Tấm

Brief nội dung cho M3/M4. Pool đầy đủ (~1.000 câu) viết ở M3/M4 vào `data/events*.js` và `data/lines*.js`, chọn bằng `freshLine`.

Engine chép từ Bánh Mì (`core/drama.js`):
- Điều kiện khai báo bằng `if`.
- Ưu tiên sự cố do người chơi gây ra.
- Tối đa 1 sự kiện mỗi ca + 1 giữa hai ca / sau ngày.
- Mỗi tình huống nghỉ ≥ 2 ngày.
- Cứ ba sự kiện có ít nhất một tình huống vui.
- Cờ hết hạn sau 3 ngày nếu không ghi khác.
- Đồng hồ ca dừng khi hội thoại mở.
- Mọi bước luôn có lựa chọn không tốn tiền / hàng.

**Không chen vào giữa lúc chủ quán đang bưng dĩa**: chờ dĩa xuống bàn rồi mới mở hội thoại. Bếp **dừng** khi hội thoại mở (không cháy oan).

Giọng văn:
- Hài đời thường Sài Gòn, châm chọc tình huống, tử tế với nhân vật.
- Không thương hiệu, không người thật, không cơ quan thật, không emoji.
- Mọi tên quán, công ty, người đều hư cấu.
- "Đội trật tự khu phố", "tổ dân phố" là vai chung, không gắn tên cơ quan nào.

**Ký hiệu.**

| Ký hiệu | Nghĩa |
|---|---|
| k | 1.000 đồng ảo |
| DD | danh tiếng |
| TD | người theo dõi |
| HOT | độ hot |
| KCS | khách ca sau |
| **NB** | nhiều bước |
| **HẸN** | hẹn quay lại ngày sau |
| **HX** | hên xui (`roll`) |
| **LM** | lỗi lên mạng |

Mỗi lựa chọn hiện **chi phí trên nút** và **hậu quả ngay sau khi chọn**, rồi lưu một khoảnh khắc Nhật Ký (cột cuối).

## 1. Nhân vật (NPC Drama, 12)

Chân dung ở `drama-portraits-hd.webp`, mỗi người 4 biểu cảm: neutral / happy / annoyed / surprised. Khách thường dùng 11 vai trong cảnh.

| id | Tên | Tiểu sử |
|---|---|---|
| `me` | Mẹ | Bán cơm tấm ở chợ huyện hai mươi năm, giờ nghỉ, "chỉ ghé chơi". Gọi điện hỏi "bán cơm cả ngày mà ăn cơm chưa". Nêm nước mắm bằng mắt, không bao giờ sai. |
| `chu-tu` | Chú Tư | Cai đội thợ công trình 10 người, giọng to hơn loa. Nhớ món của từng thợ, nhưng nhớ tên thì không. Trả tiền bằng xấp 50k gấp tư. |
| `anh-sau` | Anh Sáu | Xe ôm truyền thống đầu hẻm, khách quen "ghi sổ". Nợ đều, trả cũng đều, mỗi lần trả kèm một câu chuyện dài hơn tiền nợ. Kiêm chở hàng gấp cho quán. |
| `co-ba` | Cô Ba | Sạp thịt ở chợ, nhà cung cấp 1. Chọn sườn bằng ngón tay, tự ái nếu quán "đi mua chỗ khác". Biết công thức ướp của mọi quán trong phường, không kể ai. |
| `chu-hoa` | Chú Hòa | Chủ vựa gạo + than, nhà cung cấp 2 (cấp 9). Nói chậm, tính nhanh, giao hàng lúc 4 giờ sáng bằng xe ba gác. |
| `co-lan` | Cô Lan | Tiệm may sát vách, treo đồ khách ra trước cửa. Rất nhạy mùi khói. Bí mật: tối nào cũng lén mua một hộp cơm sườn cháy cạnh. |
| `anh-quang` | Anh Quang | Thành viên đội trật tự khu phố. Hiền, ngại nhắc người khác, luôn nhắc sau khi đã ăn xong dĩa cơm. Thuộc lòng mọi vạch sơn vỉa hè. |
| `bep-vu` | Bếp trưởng Vũ | Đầu bếp đi học nước ngoài về, mở "Cơm Tấm Vũ Kim" bên kia đường: dĩa vuông, sườn hun khói gỗ táo, 89k. Đối thủ chứ không phải người xấu. Lén ăn cơm vỉa hè lúc nửa đêm. |
| `mai-an-dem` | Mai Ăn Đêm | Food vlogger chuyên quán khuya. Ăn thử miếng đầu bằng mắt nhắm, nói "để Mai cảm nhận". Một clip của Mai có thể làm cả hẻm kẹt xe. |
| `bong` | Bông | Em họ chủ quán, 19 tuổi, phụ bàn từ cấp 9. Bưng 4 dĩa một lúc, nhớ món giỏi, hay hát theo radio. Cùng người với sprite `helper`. |
| `anh-hung` | Anh Hùng "Bass" | Trưởng nhóm nhậu khuya, mang theo loa kéo. Hát sai lời nhưng tự tin tuyệt đối. Tốt bụng, hay bao cả bàn. |
| `chi-thu` | Chị Thư | Thư ký Công ty Cơ khí Bình Minh. Đặt mâm cơm cho cả xưởng, ghi chú bằng file ba trang, gọi xác nhận đúng ba lần. |

Khách có tên lặp lại (dùng vai trong cảnh):
- Cô Út bán vé số (`regular`), khách khuya, ngồi lâu.
- Điều dưỡng Hạnh (`nurse`), khoa cấp cứu bệnh viện quận.
- Tài xế Lộc (`driver`).
- Hai sinh viên Tèo và Mít (`student`, `student2`).
- Thợ Lực "thêm cơm" (`worker2`).
- Du khách Lucas (`tourist`).
- Reviewer: Tí Mập Ăn Khuya, Bé Su Review (`reviewer`).

## 2. Sự kiện (58)

**Tổng: 58 sự kiện**:

| Chỉ số | Số | Tỉ lệ |
|---|---:|---:|
| Trong ca | 37 | 64% |
| Giữa hai ca / sau ngày | 21 | 36% |
| Nhiều bước | 24 | 41% |
| Có hẹn quay lại ngày sau | 20 | 34% |
| Có lựa chọn hên xui | 50 | |
| Lỗi lên mạng (V01–V07) | 7 | |

Thêm ~28 sự kiện cơ chế ở §2.7.

### 2.1 Khách (K)

| ID · lúc | Kích hoạt · thoại mở | Lựa chọn: chi phí → hậu quả | Loại | Nhật Ký |
|---|---|---|---|---|
| **K01** · ca | Khuya, từ ngày 3, có bàn 4 (hoặc ghép bàn) trống. Chú Tư dẫn 4 thợ: "Bốn dĩa! Thằng Tèo không bì, thằng Lực thêm cơm, thằng Bin trứng lòng đào, còn tao đặc biệt, cháy cạnh!" | **Nhận cả bàn** → 4 phiếu cùng màu, kiên nhẫn ×1,5, đúng hết +15k tip · **Nhận, xin làm 2 dĩa trước** → 2 phiếu ngay, 2 phiếu sau 20 s · **Mời ghép bàn với khách khác** → HX 50% vui vẻ (+1 DD), 50% chú cằn nhằn (−kiên nhẫn). Bước 2 (khi giao xong): "Thằng Lực đòi thêm cơm lần hai!" → **Thêm miễn phí** +2 DD, +1 KCS thợ · **Tính 4k như thường** → không gì | NB · HX · HẸN → K02 (+1) | "Bốn thợ, bốn kiểu, một thằng Lực ăn ba vá cơm." |
| **K02** · ngày | Hẹn từ K01 giao ≥ 3 sao. Chú Tư: "Đội chú làm ca đêm ba tháng. Tối thứ Hai, Tư, Sáu con làm 12 hộp giao công trình được không?" | **Nhận, giảm 10%** → hợp đồng định kỳ 12 hộp × 3 tối × 3 tuần · **Nhận giá gốc** → HX 50% chú đồng ý, 50% chú thử 1 tuần · **Từ chối khéo** → +1 DD, chú vẫn ghé lẻ. Bước 2 (nếu nhận): "Con giao tận nơi hay tụi chú qua lấy?" → **Giao tận nơi** (+5k phí, chủ quán rời cảnh 10 s mỗi lần) · **Để thợ qua lấy** → đơn tới quầy | NB · HX | "Có hợp đồng đầu tiên. Ký bằng một cái bắt tay dính mỡ hành." |
| **K03** · ca | Khuya, ngày ≥ 3 (trước khi mở sổ nợ). Anh Sáu ăn xong, móc túi: "Ủa… quên ví ở nhà. Ghi sổ nghen, mai anh trả." | **Ghi sổ** → mất giá dĩa hôm nay, mở **sổ nợ** sớm cho riêng Anh Sáu, mở K04 · **Cho luôn dĩa này** → −giá dĩa, +2 DD, Anh Sáu quảng cáo quán khắp bến (+1 KCS) · **Đề nghị chuyển khoản** → HX 40% anh có app, trả đủ; 60% "điện thoại anh đời cũ", anh dỗi (−1 KCS) | HX · HẸN → K04 (+2) | "Sổ nợ có dòng đầu tiên: Anh Sáu, 1 dĩa sườn, 'mai trả'." |
| **K04** · ngày | Hẹn từ K03 "Ghi sổ". Anh Sáu tới, trả nợ cũ… rồi: "Tháng này cuốc ít, cho anh ghi sổ cả tháng, cuối tháng anh trả một cục." | Bước 1: **Đồng ý, hạn mức 200k** → mỗi tối Anh Sáu ghi sổ 1 dĩa (tối đa 20 lần), hẹn K05 sau 7 ngày · **Chỉ ghi tối đa 5 dĩa** → như trên, hạn mức 75k · **Không ghi nữa** → HX 50% anh hiểu (+1 DD), 50% anh đi ăn quán khác 3 ngày. Bước 2 (nếu đồng ý): "Anh chở hàng gấp cho em miễn phí cả tháng, coi như lãi." → **Nhận** → chở gấp (§ECONOMY 10) miễn phí 7 ngày · **Thôi, anh giữ sức** → +1 DD | NB · HX · HẸN → K05 (+7) | "Ký hợp đồng ghi sổ một tháng. Bằng chứng: một cuốn tập học trò." |
| **K05** · ca | Hẹn từ K04, khuya. Anh Sáu đứng trước quầy, tay sau lưng. Nợ đang có: {debt}k. | Bước 1: **Hỏi thẳng** → HX 60% trả đủ + bó hoa giấy "của vợ anh gửi" (+1 trang trí); 40% "trả nửa nghen em" · **Không hỏi, mời ăn** → HX 50% anh tự trả đủ + giới thiệu cả bến xe ôm (+3 KCS 3 ngày); 50% anh ăn thêm một dĩa, ghi tiếp. Bước 2 (nếu trả nửa / ghi tiếp): **Xoá phần còn lại** → +3 DD, Anh Sáu thành "đại sứ quán" (khách quen +1 mỗi tối 7 ngày) · **Ghi tiếp, hẹn tháng sau** → mở lại K05 sau 7 ngày | NB · HX | "Anh Sáu trả nợ một tháng: 160k, một bó hoa giấy và chuyện năm 1999." |
| **K06** · ca | Tối, ngày ≥ 3. Tèo và Mít đếm tiền lẻ: "Chị ơi… tụi em có 50 ngàn hai đứa, hai dĩa sườn với xin thêm cơm miễn phí được không chị?" | **Bán 2 dĩa giá 25k, cơm thêm miễn phí** → −14k so với giá, +2 DD, mở K07 · **Bán 2 dĩa bì chả + cơm thêm** (nếu có) → đủ tiền, +1 DD, mở K07 · **Nói khéo không được** → HX 50% tụi nhỏ mua 1 dĩa chia đôi; 50% đi | HẸN → K07 (+4) | "Hai sinh viên, năm chục ngàn, bốn vá cơm và rất nhiều lời cảm ơn." |
| **K07** · ngày | Hẹn từ K06. Tèo nhắn: "Chị ơi lớp em liên hoan cuối kỳ, đặt 20 hộp tối mai, tụi em góp tiền rồi!" | Bước 1: **Nhận 20 hộp sườn** → đơn đặt trước, cọc 30% · **Nhận 20 hộp bì chả** (rẻ, không cần bếp) · **Từ chối**. Bước 2: "Lớp em có 3 bạn ăn chay, 1 bạn không ăn được mỡ hành." → **Ghi nhãn từng hộp** → phiếu có nhãn riêng · **Đề nghị làm chung chay hết** → HX 40% lớp đồng ý (dễ làm), 60% "không được chị ơi" | NB · HX | "Lớp 2 khoá 22 liên hoan bằng 20 hộp cơm của quán. Có 3 hộp chay, dán nhãn đỏ." |
| **K08** · ca | Khuya, cấp 4+ (có hộp). Điều dưỡng Hạnh: "Cho em 6 hộp mang vô khoa, trứng lòng đào hết nha chị, 20 phút nữa em vô ca!" | **Nhận, ưu tiên** → đơn 6 hộp, kiên nhẫn 60 s, đúng hết +10k tip, +1 DD · **Nhận, làm trứng chín kỹ cho nhanh** → HX 60% "thôi cũng được chị"; 40% 6 review 3 sao trứng · **Hẹn 30 phút** → Hạnh đi, quay lại sau 40 s ca | HX | "Sáu hộp trứng lòng đào cho khoa cấp cứu. Không ai cấp cứu vì trứng." |
| **K09** · ca | Khuya, ngày ≥ 5, có bàn 4. Anh Hùng Bass mở loa kéo: "Bài này tặng chủ quán! 'Đêm nay… em có về…'" Khách bàn khác nhăn mặt. | Bước 1: **Nhờ anh vặn nhỏ** → HX 60% anh vặn nhỏ, tặng quán 20k "xin lỗi"; 40% anh hát nhỏ hơn… một chút · **Kệ, hát chung** → HOT +1, khách trẻ vui, khách văn phòng / điều dưỡng −kiên nhẫn · **Mời anh hát bài cuối rồi tính tiền** → bước 2. Bước 2: Anh Hùng: "Hát bài cuối nha, bài này dài 8 phút." → **Đồng ý, tặng cả bàn trà tắc** (−4k) → +2 DD, bàn trả thêm 30k · **Xin rút gọn còn điệp khúc** → HX 50% cả quán vỗ tay (+1 DD); 50% anh dỗi, về sớm | NB · HX · HẸN → K10 (+2) | "Có buổi hoà nhạc miễn phí lúc 22 giờ. Ca sĩ hát sai lời, khán giả ăn đúng món." |
| **K10** · ngày | Hẹn từ K09. Hai khả năng theo lựa chọn cũ. Anh Hùng quay lại: "Hôm qua anh hơi quá. Tuần sau sinh nhật anh, đặt 8 dĩa đặc biệt, không mang loa!" (hoặc Cô Lan: "Tối qua ồn quá con ơi.") | Nhánh Anh Hùng: **Nhận tiệc 8 dĩa** → đơn đặt trước bàn 4 × 2, cọc · **Nhận, tặng bánh kem nhỏ** (−20k) → +3 DD, HX 50% cả nhóm thành khách quen thứ Bảy. Nhánh Cô Lan: **Hứa giờ yên lặng sau 22:30** → khuya −1 khách, +2 DD với hẻm · **Tặng cô hộp cơm** (−1 phần) → HX 70% cô vui | NB · HX | "Anh Hùng đặt sinh nhật không loa. Cả bàn hát chay, vẫn sai lời." |
| **K11** · ca | Cấp 8+, Lucas trong hàng chờ. "Excuse me… broken rice? Why broken? Is it… okay?" | **Giải thích bằng tay + vẽ hạt gạo lên giấy** → HX 60% Lucas gọi dĩa đặc biệt + tip 15k; 40% Lucas gọi cơm sườn, chụp 30 tấm · **Đưa bảng hình** → Lucas chọn đúng món, kiên nhẫn +10 s · **Gọi Bông ra nói tiếng Anh** (cấp 9) → HX 50% Bông nói trôi chảy (+1 DD); 50% Bông nói "yes yes" cả buổi | HX | "Giải thích 'cơm tấm' cho người nước ngoài: gạo bể nhưng lòng không bể." |
| **K12** · ca | Cao điểm, còn đúng 1 bàn 4 sạch, một nhóm 4 và một cặp đôi tới cùng lúc. "Bàn đó tụi anh thấy trước!" — "Tụi em đứng đây nãy giờ mà!" | **Bàn 4 cho nhóm 4, mời cặp đôi chờ bàn 2 sắp xong** → cặp đôi kiên nhẫn −10 s · **Cặp đôi ngồi trước (tới trước), nhóm 4 chờ ghép bàn** → HX 50% nhóm vui vẻ; 50% nhóm bỏ đi (−4 khách) · **Mời cặp đôi ngồi chung với nhóm** → HX 40% cả bàn thành bạn (+2 DD, câu vui); 60% ngại ngùng, 3 sao cả bàn | HX | "Hai nhóm giành một cái bàn. Quán giải quyết bằng sự công bằng và một bình trà đá." |
| **K13** · ca | Ca trưa, khách văn phòng: "Chị ơi, em có 12 phút, họp lúc 12 giờ 30, làm gì nhanh nhất?" | **Bán sườn đang giữ ấm, bưng trước** → kiên nhẫn ×1,5, khách 5 sao nếu ≤ 25 s · **Gợi ý cơm bì chả** (không cần bếp) → giao nhanh, giá thấp · **Đề nghị gói mang lên văn phòng** → HX 70% khách đồng ý (đơn hộp); 30% "em không ăn ở bàn làm việc được" | HX | "Một dĩa cơm trong 11 phút 40 giây. Kịp họp. Không kịp thở." |
| **K14** · ca | Cao điểm, có ≥ 2 khách chờ bàn. Cô Út bán vé số ăn xong từ lâu, vẫn ngồi kể chuyện xổ số tuần trước. | **Mời cô ly trà ngồi ghế đẩu cạnh bếp** → bàn trống ngay, +1 DD, cô kể chuyện cho chủ quán (câu vui) · **Để cô ngồi** → khách chờ −kiên nhẫn · **Mua một tờ vé số cho vui** (−10k) → HX 10% trúng 100k (cô hét to, cả quán vui, +HOT); 90% không trúng, cô vẫn vui đứng dậy nhường bàn | HX | "Cô Út nhường bàn, quán mua một tờ vé số. Không trúng, nhưng có câu chuyện." |

### 2.2 Vận hành (O)

| ID · lúc | Kích hoạt · thoại mở | Lựa chọn: chi phí → hậu quả | Loại | Nhật Ký |
|---|---|---|---|---|
| **O01** · ca | Cao điểm, mức than < 15, kho 0 rổ, không có bao dự phòng. Than chuyển màu xám. "Ủa… lửa đâu rồi?" | Bước 1: **Gọi Chú Hòa giao gấp** (50k, chỉ cấp 9+) → bếp yếu 20 s · **Nhờ Anh Sáu chạy mua** (45k + 5k) → 25 s · **Mượn quán bánh xèo bên cạnh 2 rổ** → 0k, 8 s, mai trả (hẹn) · **Bán bì chả, không nướng nữa** → menu tạm còn món không cần bếp. Bước 2 (miếng đang dở trên vỉ): **Quạt cho đỏ lại** → khói +30, miếng dở chín kịp · **Gắp ra, nướng lại sau** → miếng dở thành "tái", phải nướng lại từ 60 | NB | "Hết than lúc 19 giờ. Quạt mo cứu cả buổi tối." |
| **O02** · ca | Ngẫu nhiên, ca tối. Đèn tắt cả dãy. Lớp `power-cut-glow`. "Cúp điện! Nồi cơm tắt rồi!" | **Thắp đèn bình, nướng tiếp** → bếp than không sợ cúp điện; nồi cơm đang nấu dừng 30 s · **Bật đèn điện thoại, mời khách ngồi tiếp** → khách khuya thích không khí (+HOT), khách văn phòng −1 sao · **Đóng tạm 15 s** → giữ khách đang ngồi, khách mới không vào | HX | "Cúp điện. Nồi cơm nghỉ, bếp than vẫn làm việc. Than: 1, điện: 0." |
| **O03** · ca | Nồi cơm đang nấu, từ ngày 4. "Tạch." Nồi tắt, đèn đỏ nhấp nháy. "Nồi cơm… đình công rồi." | Bước 1: **Đập nhẹ vào hông nồi** → HX 40% nồi chạy lại (câu vui); 60% không · **Mượn nồi Cô Lan** → 10 s, mai trả · **Nấu bằng nồi gang trên bếp phụ** → 70 s, gas +4k. Bước 2 (nếu hỏng thật): **Mua nồi mới ngay** (150k, Anh Sáu chở 20 s) → hết sự cố · **Sửa ngày mai** (40k) → ca này chỉ còn cơm đang có, ca sau bình thường | NB · HX | "Nồi cơm đình công lúc 18 giờ 45. Đập nhẹ một cái, không ăn thua." |
| **O04** · ca | Ngày mưa (dự báo ở Chuẩn bị), quán vỉa hè, từ ngày 4. Lớp `rain` + `flood`. "Mưa lớn quá, nước tràn lên vỉa hè rồi! Bàn ngoài ướt hết!" | Bước 1: **Dồn bàn sát mái** → 2 bàn ngoài khoá tới hết mưa, khách đang ngồi chuyển chỗ (kiên nhẫn −) · **Mở dù che từng bàn** (20k) → giữ đủ bàn, HX 30% gió lật dù (câu vui) · **Chuyển sang bán hộp mang về** → shipper +4, khách ngồi 0. Bước 2: Cô Út đứng trú mưa dưới mái → **Mời ngồi uống trà** +1 DD · **Mời một chén canh nóng** (−1 phần canh) +2 DD | NB · HX · HẸN → O05 (+1) | "Mưa ngập vỉa hè. Quán bán cơm dưới bốn cái dù và một tấm bạt." |
| **O05** · ngày | Hẹn từ O04. Cô Lan và Anh Sáu: "Mưa hoài vầy, con làm mái bạt đi, cô biết chỗ may bạt rẻ." | **Làm mái bạt ngay** (80k, giảm 10% nhờ Cô Lan) → mưa −15% khách · **Mua 4 ghế nhựa cao** (30k) → bàn ngoài không bị nước, nhưng mưa vẫn −30% · **Để sau** → không gì | — | "Mua mái bạt qua người quen của người quen. Giá tốt, màu xanh lá." |
| **O06** · ca | Ngẫu nhiên, ca tối, từ ngày 5. Vòi nước kêu khè khè rồi im. "Mất nước! Thau chén còn đầy!" | Bước 1: **Dùng can nước dự trữ** (nếu có) → rửa được 18 dĩa · **Chạy xin nước Cô Lan** → chủ quán rời cảnh 8 s, rửa được 12 dĩa · **Chuyển sang hộp ăn tại chỗ** → tốn hộp, trần 4 sao. Bước 2 (khi dĩa còn ≤ 3): **Mua 20 dĩa nhựa dùng một lần** (20k) → khách văn phòng chê "không bảo vệ môi trường" (−1 DD) · **Treo bảng "chỉ bán mang về"** → khách ngồi 0 tới hết ca | NB · HX · HẸN → O07 (+2) | "Mất nước giữa ca. Rửa chén bằng can nước của tiệm may." |
| **O07** · ngày | Hẹn từ O06. Tổ dân phố (vai `regular`): "Mấy nhà góp tiền đặt bồn nước chung, quán góp không?" | **Góp 100k** → mất nước sau này không mở O06 bước 1, +2 DD · **Góp bằng một mâm cơm cho buổi họp** (−10 phần) → +3 DD · **Để sau** → HX 50% bị nhắc lại tuần sau | HX | "Góp mười dĩa cơm cho buổi họp tổ dân phố. Họp xong sớm vì ai cũng no." |
| **O08** · ca | Dĩa sạch = 0, có khách vừa ngồi, chưa có Dì Năm. "Chị ơi, dĩa đâu chị?" | **Rửa ngay 6 dĩa** → chủ quán đứng thau 6 s (bếp vẫn chạy!) · **Hộp ăn tại chỗ cho bàn này** (−2k) → trần 4 sao · **Nhờ khách quen phụ rửa** → HX 50% Cô Út rửa giùm (+1 DD, câu vui); 50% cô kể chuyện thay vì rửa | HX | "Hết dĩa lúc cao điểm. Cô Út rửa giùm 6 cái, kể giùm 6 câu chuyện." |
| **O09** · ca | Thêm than khi mức ≥ 60, hoặc ≥ 3 miếng vùng nóng. Mỡ nhỏ xuống, lửa bùng cao. "Ối, lửa!" Lớp `grill-flare`. | **Rưới nước** → lửa tắt, mức than −20, khói +20 · **Gắp hết sang vùng giữ ấm** → không cháy miếng nào, ba miếng đang chín dừng · **Để lửa liếm cho thơm** → HX 50% "sườn thơm khói" (+3 kỳ vọng các dĩa này); 50% 2 miếng cháy đen | HX | "Lửa bùng cao bằng nửa người. Sườn thơm, lông mày còn nguyên." |
| **O10** · ca | Gạo tấm ≤ 0, cấp 3+. "Bao gạo tấm… hết rồi." | **Nấu gạo thường** → 1k / phần, trần 4 sao, câu "đâu phải cơm tấm" · **Mượn quán bên cạnh 6 phần** → 0k, mai trả · **Nhờ Anh Sáu chạy mua** (+15%, 20 s) · **Bán bánh mì sườn** (tối đa 3 ổ) | HX · HẸN → U03 (+1, nếu cấp 9) | "Quán cơm tấm hết tấm. Bán bánh mì sườn, khách khen 'sáng tạo'." |
| **O11** · ca | Ngẫu nhiên khi rửa chén, từ ngày 6. "Xoảng!" Chồng dĩa trượt khỏi tay. | **Dọn ngay** → mất 2 dĩa (16k), quầy trống 4 s · **Cười trừ "của đi thay người"** → HX 60% khách vỗ tay (+HOT); 40% một khách bị văng mảnh nhỏ, xin lỗi, tặng trà (−2k) · **Gọi Bông dọn** (cấp 9) → Bông dọn, hát "xoảng xoảng" (câu vui) | HX | "Bể hai cái dĩa. Cả quán hô 'mừng quán làm ăn phát đạt'." |
| **O12** · ca | Ngẫu nhiên, tối, có ≥ 2 miếng ở vùng giữ ấm. Một con mèo vàng ngồi cạnh bếp, nhìn chằm chằm vỉ sườn. | **Cho mèo một miếng vụn** → mèo ở lại, khách thích chụp ảnh (+TD), mở D08 · **Đuổi nhẹ** → mèo đi, quay lại mai · **Đặt chén nước, mặc kệ** → HX 50% mèo ngủ cạnh ghế khách (+1 DD); 50% mèo nhảy lên bàn, khách hét (−1 sao bàn đó) | HX · HẸN → D08 (+2) | "Có một nhân viên mới không lương: một con mèo vàng canh vỉ sườn." |

### 2.3 Nhà cung cấp (U) và đối thủ (T)

| ID · lúc | Kích hoạt · thoại mở | Lựa chọn: chi phí → hậu quả | Loại | Nhật Ký |
|---|---|---|---|---|
| **U01** · ngày | Từ ngày 6. Cô Ba: "Heo lên giá, sườn cô phải tăng 1 ngàn một miếng, con thông cảm." | Bước 1: **Đồng ý** → sườn 10 → 11k, +1 thân thiết · **Mặc cả** → bước 2 · **Nói sẽ tìm chỗ khác** → mở U04 sớm. Bước 2: "Vậy con lấy 20 miếng một lần, cô giữ giá." → **Lấy 20 miếng ngay** (200k) → giữ giá 7 ngày · **Tăng nửa** → 10,5k | NB · HẸN → U04 (+5) | "Mặc cả giá sườn với Cô Ba. Thắng 500 đồng, thua một bài giảng về giá cám." |
| **U02** · ca | Vừa nhập sườn Cô Ba, từ ngày 5. Mở bao: miếng mỏng, nhiều mỡ. "Lô này… mỏng như lời hứa." | **Gọi Cô Ba đổi** → 20 s sau có lô mới, miễn phí · **Dùng tiếp, nướng kỹ** → HX 60% không ai để ý; 40% 2 review "sườn mỏng" · **Ghép 2 miếng làm dĩa đặc biệt** → tốn 2 miếng cho 1 dĩa | HX · HẸN → U04 (+2) | "Một lô sườn mỏng. Quán chọn không bán sự thất vọng." |
| **U03** · ngày | Cấp 9 (hoặc hẹn từ O10). Chú Hòa: "Gạo tấm, than, hộp, dĩa, chú giao sỉ hết. Rẻ hơn 10%, nhưng giao lúc 4 giờ sáng nghen." | **Lấy thử gạo + than** → mở Chú Hòa, mai có hàng · **Chỉ lấy than** → than rẻ 10% · **Cảm ơn, mua chợ thôi** → +1 thân thiết Cô Ba | HẸN → U04 (+2) | "Có nhà cung cấp thứ hai. Gặp nhau lần đầu lúc 4 giờ sáng." |
| **U04** · ngày | Hẹn từ U01 / U02 / U03, hoặc đã nhập Chú Hòa ≥ 2 lần. Cô Ba: "Cô nghe nói con lấy gạo ông Hòa. Sườn thì sao, cũng lấy chỗ khác hả?" | Bước 1: **Nói thật: gạo ông Hòa, thịt vẫn của cô** → bước 2 · **Chối** → HX 40% cô tin; 60% cô biết (Anh Sáu kể), sườn +1k 5 ngày. Bước 2: **Hứa chỉ lấy thịt của cô** → sườn Cô Ba rẻ 5% vĩnh viễn · **Mời cô ăn dĩa cơm** → +2 thân thiết, cô chỉ "bí quyết ướp sả" (+2 kỳ vọng sườn 5 ngày) | NB · HX | "Bị nhà cung cấp hỏi 'con mua của ai'. Trả lời bằng một dĩa cơm sườn." |
| **T01** · ngày | Từ ngày 8. Anh Sáu: "Bên kia đường mới mở 'Cơm Tấm Vũ Kim', dĩa vuông, 89 ngàn, có nhạc piano." | **Giảm 3k mọi món 3 ngày** → giữ khách, lãi giảm · **Tặng chén canh + trà tắc cho mọi bàn** (−1k / khách) → HX 60% khách ở lại; 40% không ai để ý · **Giữ giá, tập trung "sườn cháy cạnh"** → 3 ngày −2 KCS, sau đó +2 nếu điểm nướng trung bình ≥ 17 · **Qua chào hỏi** → mở T03 sớm | HX · HẸN → T02 (+1), T03 (+5) | "Đối thủ có dĩa vuông. Quán có dĩa tròn và mùi than." |
| **T02** · ca | Hẹn từ T01. Khách đội nón kín, chụp lén vỉ sườn. Bông thì thầm: "Người của quán bên kia đó chị." | **Mời ngồi, tặng một miếng sườn cháy cạnh** → HX 60% người đó gọi luôn 2 dĩa, khen thật (+1 DD); 40% người đó ăn xong đi, không nói gì · **Che vỉ lại** → không gì · **Hỏi thẳng "em học nướng hả?"** → HX 50% người đó cười, thú nhận là phụ bếp bên kia (+câu vui, mở trước T03) | HX | "Bị đối thủ chụp lén vỉ sườn. Tặng luôn một miếng để họ chụp cho rõ." |
| **T03** · ngày | Hẹn từ T01. Bếp trưởng Vũ, nửa đêm: "Tôi bán dĩa 89 ngàn mà khách vẫn qua bên chị. Chị nướng sao vậy?" | Bước 1: **Chỉ cách canh than** → bước 2 · **Rủ thi nướng ở hội chợ** → cờ F01 thêm đối thủ Vũ (thắng: +200 TD) · **Mời ăn, không nói gì** → +1 DD, Vũ ăn 2 dĩa. Bước 2: **Chỉ hết** → +3 DD, Vũ đổi menu sang "cơm tấm sườn hun khói" giá 59k (không còn tranh khách ca tối) · **Chỉ một nửa** → Vũ bỏ ca trưa, chỉ cạnh tranh ca tối | NB · HX | "Dạy bếp trưởng nước ngoài về canh than. Anh ấy ghi chép bằng iPad, quạt bằng quạt mo." |

### 2.4 Mạng và lỗi lên mạng (M, V)

| ID · lúc | Kích hoạt · thoại mở | Lựa chọn: chi phí → hậu quả | Loại | Nhật Ký |
|---|---|---|---|---|
| **M01** · ca | DD ≥ 55, khuya. Mai Ăn Đêm bật đèn quay: "Xin chào cả nhà, hôm nay Mai ghé một quán vỉa hè được đồn là sườn cháy cạnh ngon nhất quận!" | Bước 1: **Cho quay, làm dĩa đặc biệt** → bước 2 · **Xin quay sau ca** → không ảnh hưởng nhịp, +20 TD · **Từ chối nhẹ** → không gì. Bước 2: Mai: "Mai muốn quay cảnh lật sườn cận cảnh." → **Cho quay cận** → mini thử thách: 3 lần lật đúng lúc liên tiếp. Đạt: +250 TD, HOT, mở M02 tốt; trượt: clip "sườn hơi khét", mở M02 xấu · **Quay toàn cảnh quán** → +80 TD chắc chắn | NB · HX · HẸN → M02 (+1) | "Mai Ăn Đêm nhắm mắt ăn miếng đầu. Mở mắt ra thì gọi thêm dĩa nữa." |
| **M02** · ngày | Hẹn từ M01. Clip lên. | Tốt: **Đăng lại kèm cảm ơn** → +150 TD, +5 KCS mai (chuẩn bị đông!) · **Treo ảnh Mai lên tường** → trang trí +0,5. Xấu: **Nhận góp ý công khai** → +1 DD, +40 TD · **Mời Mai quay lại** → HX 50% Mai quay lại, clip sửa sai (+120 TD) | HX | "Lên clip của Mai Ăn Đêm. Tối hôm sau hẻm kẹt xe." |
| **M03** · ngày | Từ ngày 9. Bông: "Chị ơi trên mạng đang trend cơm tấm sườn phô mai kéo sợi!" | Bước 1: **Nhập phô mai, bán 3 ngày** (40k) → món trend 49k, HOT, khách trẻ +3 / ca; HX 50% trend kéo thêm 2 ngày · **Làm phiên bản của quán: sườn sốt me** (25k) → HX 60% "biết biến tấu"; 40% "không giống trend" · **Không chạy theo** → +1 DD với khách quen. Bước 2 (nếu làm): Bông xin quay clip kéo sợi → **Cho quay** → HX 50% +120 TD; 50% phô mai không kéo sợi, clip thành meme (+HOT, −1 DD) · **Bán trước, quay sau** | NB · HX · HẸN → M04 (+3) | "Theo trend sườn phô mai. Phô mai kéo sợi, khách kéo ghế." |
| **M04** · ca | Hẹn từ M03 (có nhập). Trend tàn, còn phô mai. Khách: "Ủa quán còn bán cái đó hả? Hết trend rồi mà." | **Giảm còn 35k, bán nốt** → bán hết phần còn lại · **Tặng kèm dĩa thường** → +1 DD mỗi dĩa · **Đổi tên "sườn phô mai bản hoài niệm"** → HX 40% trend nhỏ thứ hai | HX | "Trend tàn, phô mai còn. Đặt tên 'bản hoài niệm'." |
| **V01** · ca | Vừa giao phiếu "không bì" mà có bì, khách có điện thoại (reviewer hoặc sinh viên). "Mọi người coi nè, 'không bì' mà bì phủ kín như tuyết." | **Xin lỗi, làm dĩa mới** (−1 dĩa) → clip thành "quán sửa sai nhanh", +1 DD · **Biến thành trend "dĩa bì bão tuyết"** → HX 50% +HOT, +80 TD; 50% −2 DD "chủ quán cãi" · **Tặng thêm phần sườn** (−1 miếng) → +2 DD | LM · HX | "Lên mạng vì 'không bì' mà bì như tuyết. Từ nay phiếu 'không bì' dán đỏ." |
| **V02** · ca | Giao miếng cháy đen (hoặc nhiều mặt ≥ 125), khách có điện thoại. "Sườn nướng than hay sườn LÀ than vậy mọi người?" | **Đổi miếng mới + xin lỗi** → +1 DD · **Cười theo, đặt tên "sườn than hoạt tính" bán 1 ngày giảm 5k** → HX 45% trend vui (+HOT, +3 KCS); 55% review "quán không biết nướng" · **Giải thích "do lửa bùng"** → không gì | LM · HX | "Miếng sườn lên mạng với tên 'than hoạt tính'. Bếp than bị đặt biệt danh." |
| **V03** · ca | Phiếu "trứng lòng đào" giao trứng chín kỹ, khách là reviewer. "Trứng lòng đào của quán: đào xong lấp lại luôn rồi." | **Chiên trứng mới tặng** (−1 trứng) → +1 DD · **Thách khách "đoán giờ chiên"** → HX 50% vui, +60 TD; 50% "lạc đề" −1 DD · **Xin lỗi, giảm 6k** → không gì thêm | LM · HX | "Trứng lòng đào bị chê 'đào xong lấp lại'. Chảo được giao nhiệm vụ mới." |
| **V04** · ca | Phiếu "nước mắm để riêng" mà chan, khách văn phòng có điện thoại. "Dặn để riêng. Cơm tấm của tôi đang đi bơi." | **Làm dĩa mới, chén riêng** (−1 dĩa) → +1 DD · **Biến thành "cơm tấm hồ bơi" có công thức** → HX 40% trend nhỏ; 60% −1 DD · **Tặng ly trà tắc, xin lỗi** (−2k) → +1 DD | LM · HX | "Cơm tấm đi bơi. Từ nay chén nước mắm có ghế riêng." |
| **V05** · ca | Bưng nhầm bàn và khách bàn đó đã ăn mất. Khách bàn đúng quay clip: "Dĩa của mình đang được bàn bên ăn rất ngon miệng." | Bước 1: **Làm dĩa mới gấp cho bàn đúng** (−1 dĩa) → bước 2 · **Cười trừ "chia sẻ là hạnh phúc"** → HX 40% hai bàn cười, cụng ly trà (+HOT); 60% −2 DD. Bước 2: bàn ăn nhầm hỏi: "Vậy giờ tụi anh trả dĩa đó không?" → **Không tính, coi như quán mời** → +2 DD cả hai bàn · **Tính như thường, họ đã ăn mà** → HX 70% họ trả vui vẻ | LM · NB · HX | "Bưng nhầm bàn. Hai bàn thành bạn, một dĩa cơm thành câu chuyện." |
| **V06** · ngày | Có bàn bị tính dư ≥ 30k. Bài đăng: "Dĩa cơm tấm vỉa hè 450 ngàn??? (ảnh phiếu tính tiền)" | **Xin lỗi, đăng ảnh phiếu đúng + hoàn tiền** → +1 DD, phiếu tính tiền hiện tổng to hơn · **Mời khách quay lại ăn miễn phí** → hứa ca sau ≥ 4 sao thì +2 DD · **Giải thích "do khăn lạnh"** → HX 30% cư dân mạng bật cười; 70% −2 DD | LM · HX | "Phiếu tính tiền lên mạng. Hoá ra cộng nhầm một khăn lạnh thành 200 ngàn." |
| **V07** · ca | Cho khách ngồi bàn chưa lau, khách có điện thoại. "Quán này phục vụ kiểu mới: khách tự lau bàn." | **Chạy ra lau ngay + tặng trà tắc** (−2k) → +1 DD · **Cảm ơn khách "nhân viên tháng này"** → HX 50% khách cười, +60 TD; 50% −2 DD · **Xin lỗi, giảm 5k** | LM · HX | "Khách tự lau bàn và quay clip. Được mời làm nhân viên danh dự." |

### 2.5 Đời thường (D) và đặc biệt (X)

| ID · lúc | Kích hoạt · thoại mở | Lựa chọn: chi phí → hậu quả | Loại | Nhật Ký |
|---|---|---|---|---|
| **D01** · ngày | Ngày ≥ 2, ưu tiên sau ngày lỗ. Mẹ gọi: "Bán cơm cả ngày mà con ăn cơm chưa?" | **Nói thật: chưa** → mẹ gửi hũ mắm ruốc, mai chủ quán "no bụng" (+5% tốc độ bày dĩa ca đầu mai) · **Nói ăn rồi** → mẹ không tin, gọi lại hai lần (câu vui) · **Kể chuyện quán** → +1 DD (mẹ khoe xóm, +1 KCS) | — | "Mẹ hỏi ăn cơm chưa. Bán 40 dĩa, ăn được ba miếng cơm cháy đáy nồi." |
| **D02** · ca | Cao điểm, ≥ 2 bàn dơ, ngày ≥ 6. Mẹ ghé, xắn tay áo: "Để mẹ dọn bàn cho!" | Bước 1: **Cho mẹ phụ** → 60 s mẹ tự dọn, lau bàn (như phụ bàn) · **Mời mẹ ngồi ăn** → không gì, mẹ "ngồi coi" và bình luận. Bước 2 (nếu mẹ phụ): mẹ nếm nước mắm, nhăn mặt: "Nước mắm con pha hơi ngọt." → **Để mẹ pha lại** → nước mắm hôm nay +2 kỳ vọng, khách quen khen · **Cảm ơn, giữ công thức của con** → HX 50% mẹ khen "cũng được"; 50% mẹ im lặng đầy ý nghĩa | NB · HX | "Mẹ ghé dọn bàn. Dọn nhanh hơn con, và nói ra điều đó ba lần." |
| **D03** · ngày | Từ ngày 4, đã có khói ≥ 70 hoặc ≥ 3 miếng cháy trong ngày, chưa có chụp hút khói. Cô Lan: "Khói bếp con bay qua ám hết áo dài khách cô gửi may!" Lớp `smoke`. | **Mua chụp hút khói** (180k, cấp 8; trước cấp 8 là quạt hút nhỏ 80k, khói ×0,7) → hết phàn nàn, +2 DD · **Tặng cô hộp cơm mỗi tối 5 ngày** (−5 phần) → HX 70% cô vui; 30% cô vẫn ngửi khói · **Dời bếp sang đầu kia vỉa hè** → khói không qua tiệm may, chủ quán đi xa hơn tới bàn (+0,4 s mỗi lượt) 3 ngày | HX · HẸN → D04 (+3) | "Hàng xóm kêu khói. Quán xin lỗi bằng một hộp sườn cháy cạnh." |
| **D04** · ngày | Hẹn từ D03. Cô Lan quay lại. Theo lựa chọn cũ: vui hoặc vẫn khó chịu. | Nếu vui: **Mời cô làm "khách nếm món mới"** → mỗi món mới mở có review 5 sao đầu tiên từ cô. Nếu còn khó chịu: bước 1 **Mời cô qua coi bếp** → bước 2 · **Mua chụp hút khói giờ**. Bước 2: cô thấy cách quạt → HX 60% cô hiểu, thành khách quen; 40% cô báo tổ dân phố (mở X01 sớm) | NB · HX | "Cô Lan từ người kêu khói thành người chấm món. Bí mật: cô thích sườn cháy cạnh." |
| **D05** · ca | Khách vừa đi, để quên ví trên ghế. Ví dày, có ảnh một em bé. | Bước 1: **Cất vào hộp tiền, ghi giờ** → mở D06 · **Chạy theo ra đầu hẻm** → chủ quán rời cảnh 10 s (bếp vẫn chạy!), HX 50% kịp trả (+2 DD); 50% không kịp, cất ví · **Nhờ Anh Quang giữ giùm** → an toàn, không gì thêm. Bước 2 (nếu cất): hai người tới nhận cùng lúc → **Hỏi ảnh trong ví là ai** → đúng chủ, mở D06 · **Đưa người tới trước** → HX 50% đúng; 50% sai, người thật tới sau, −2 DD, phải nhờ Anh Quang | NB · HX · HẸN → D06 (+1) | "Giữ ví cho khách. Trong ví có ảnh em bé và phiếu ăn cơm tấm của quán." |
| **D06** · ca | Hẹn từ D05. Chủ ví quay lại: "Hôm qua anh tưởng mất hết giấy tờ. Xưởng anh đặt 15 phần trưa mai, không mặc cả!" | **Nhận 15 phần** → đơn đặt trước ca trưa (hoặc ca tối nếu chưa mở ca trưa), +1 DD · **Tặng dĩa, cảm ơn lại** → +2 DD · **Nhận, mời đánh giá quán** → review 5 sao chắc chắn | — | "Trả ví hôm qua, hôm nay có đơn 15 phần. Lòng tốt có lãi." |
| **D07** · ca | Tối có trận bóng đá (lịch ngẫu nhiên 1 lần / 7 ngày), khuya. Cả hẻm hỏi: "Quán có TV không?" | Có TV cũ: **Mở TV, kê thêm ghế** → +4 khách khuya, ồn (khói +10), HX 50% đội nhà thắng (cả quán gọi thêm, +20% gọi thêm); 50% thua (ăn lặng lẽ). Không TV: **Mở radio** (nếu có) → +2 khách · **Mượn TV nhà Cô Lan** → HX 60% cô cho mượn (+1 DD) · **Bán bình thường** → không gì | HX | "Đêm bóng đá. Đội nhà thắng, quán hết sạch trà đá." |
| **D08** · ngày | Hẹn từ O12 (cho mèo ăn). Con mèo vàng nằm trên ghế đẩu cạnh bếp từ sáng. | **Nhận nuôi, đặt tên** (người chơi nhập tên, 15k mua chén) → mèo ngồi cạnh bếp mỗi ca (khách thích, +0,5 hấp dẫn), câu khách riêng · **Cho ăn nhưng không nuôi** → mèo ghé thỉnh thoảng · **Gửi Cô Lan nuôi** → HX 50% cô nhận (+1 thân thiết) | HX | "Quán có mèo. Mèo có tên. Tên là {catName}." |
| **X01** · ca | Quán vỉa hè, cấp 3+, khuya; hoặc chain D04. Anh Quang ăn xong dĩa cơm, lau miệng, ngại ngùng: "Chị ơi… mai có đợt nhắc vỉa hè gọn. Chị kéo bàn vô trong vạch sơn giùm em nha. Em nhắc vậy thôi, em ăn xong rồi mới nói." | Bước 1: **Kéo bàn vô ngay** → bàn ngoài cùng khoá tới hết ca, +2 DD · **Mời anh ly trà, hứa mai kéo** → HX 70% anh vui; 30% mai anh nhắc lại (mở lại X01) · **Hỏi "vạch sơn ở đâu em?"** → bước 2. Bước 2: Anh Quang lấy phấn vẽ vạch: "Đây nè chị, một mét hai." → **Vẽ theo, dán băng keo đỏ** → từ nay bàn ngoài luôn nằm trong vạch, mở X02 · **Xin vạch rộng thêm** → HX 20% anh "để em hỏi"; 80% anh cười trừ | NB · HX · HẸN → X02 (+3) | "Được nhắc vỉa hè gọn. Người nhắc ăn hết dĩa cơm rồi mới dám nhắc." |
| **X02** · ngày | Hẹn từ X01 làm đúng vạch. Tổ dân phố gửi giấy khen "Hộ kinh doanh vỉa hè gọn đẹp". | **Treo giấy khen** → trang trí "khung giấy khen" (+0,5 hấp dẫn) · **Chụp đăng** → +80 TD · **Gửi mẹ một tấm** → mẹ gọi (câu vui), +1 DD | — | "Có giấy khen vỉa hè gọn. Mẹ đóng khung trước cả quán." |
| **X03** · ngày | Cấp 10+ (mâm cơm). Chị Thư: "Mai xưởng em có đoàn khách, đặt 40 phần, giao 11 giờ 30, 10 phần chay, 6 phần không mỡ hành. Em gửi file ghi chú ba trang nha chị." | Bước 1: **Nhận 40** → mâm cơm ca trưa (bắt buộc mở ca trưa), cọc 30% · **Nhận 25, giới thiệu quán bạn phần còn lại** · **Từ chối**. Bước 2: "Sếp em muốn thêm 'dĩa đặc biệt' cho bàn khách VIP, 4 phần." → **Thêm 4 đặc biệt** → mâm thành 44 · **Đề nghị đồng loạt sườn trứng, giảm 5%** → HX 50% chị đồng ý (dễ làm) | NB · HX · HẸN → X04 (+1) | "Nhận đơn 40 phần. Đọc file ghi chú ba trang, đặt báo thức ba cái." |
| **X04** · ca | Hẹn từ X03. Ca trưa mở, đồng hồ đếm ngược 40 phần. 11:15 Chị Thư nhắn: "Xe xưởng tới sớm 10 phút nha chị!" | Bước 1: **Ưu tiên mâm, đóng nhận khách ngồi 60 s** → khách lẻ bỏ đi một phần · **Xen khách lẻ** → nguy cơ trễ. Bước 2 (giao): **Kiểm từng hộp theo nhãn** (8 s) → không tráo · **Giao luôn** → HX 80% đúng; 20% một hộp chay bị tráo với hộp mặn (mở lỗi `veganMeat`, xin lỗi nghiêm túc) | NB · HX · HẸN → X05 (+2) | "Bốn mươi phần, xe tới sớm 10 phút, một chủ quán chạy bằng hai chân và một cái quạt mo." |
| **X05** · ngày | Hẹn từ X04 ≥ 4 sao. Chị Thư: "Sếp khen. Xưởng muốn đặt cơm trưa mỗi thứ Hai và thứ Năm, 30 phần." | **Ký 4 tuần, giảm 8%** → hợp đồng định kỳ (8 đợt) · **Ký 2 tuần giá gốc** → HX 60% đồng ý · **Cảm ơn, nhận khi rảnh**. Bước 2 (nếu ký): "Xưởng cần hộp có in tên quán." → **Đặt in hộp** (80k) → +1 hấp dẫn, đơn xưởng +5% giá · **Dùng hộp thường** → HX 70% không sao | NB · HX | "Có khách hàng doanh nghiệp. Giờ cơm trưa của cả xưởng có mùi mỡ hành." |
| **F01** · ca | Ca hội chợ (cấp 18). MC: "Mời quán lên sân khấu thi nướng sườn nhanh và đẹp nhất!" | **Lên thi** → mini thử thách: 4 miếng chín hai mặt trong 40 s, không miếng nào cháy đen. Đạt: +250 TD, +150k; trượt: thua vui, +60 TD (có Bếp trưởng Vũ nếu cờ T03) · **Nhờ MC đọc menu** → +4 khách hội chợ · **Vẫy tay** | HX | "Thi nướng sườn trên sân khấu. Bốn miếng chín, một miếng bay xuống khán giả." |

### 2.6 Bảng tổng

| Nhóm | Trong ca | Giữa hai ca / sau ngày | Tổng |
|---|---:|---:|---:|
| Khách K01–K14 | 10 (K01, K03, K05, K06, K08, K09, K11–K14) | 4 (K02, K04, K07, K10) | 14 |
| Vận hành O01–O12 | 10 (O01–O04, O06, O08–O12) | 2 (O05, O07) | 12 |
| Nhà cung cấp U01–U04 | 1 (U02) | 3 | 4 |
| Đối thủ T01–T03 | 1 (T02) | 2 | 3 |
| Mạng M01–M04 | 2 (M01, M04) | 2 (M02, M03) | 4 |
| Lỗi lên mạng V01–V07 | 6 | 1 (V06) | 7 |
| Đời thường D01–D08 | 4 (D02, D05, D06, D07) | 4 (D01, D03, D04, D08) | 8 |
| Đặc biệt X01–X05, F01 | 3 (X01, X04, F01) | 3 (X02, X03, X05) | 6 |
| **Tổng** | **37 (64%)** | **21 (36%)** | **58** |

**Chuỗi hẹn chính:**
- K01 → K02
- K03 → K04 → K05 (ghi sổ một tháng)
- K06 → K07
- K09 → K10
- O04 → O05
- O06 → O07
- O10 → U03
- O12 → D08
- U01 / U02 / U03 → U04
- T01 → T02, T03 (→ F01)
- M01 → M02
- M03 → M04
- D03 → D04 (→ X01)
- D05 → D06
- X01 → X02
- X03 → X04 → X05

### 2.7 Sự kiện riêng cho cơ chế (M3, PLAYBOOK §5)

Mỗi cơ chế có đủ bốn thứ:
- sự kiện;
- câu khách;
- review theo kết quả;
- khoảnh khắc Nhật Ký.

Các sự kiện dưới đây viết ở M3, ngoài 58 sự kiện trên.

| Cơ chế | Sự kiện thêm | Kết quả có review riêng |
|---|---|---|
| Bếp + vùng nhiệt + lật | O01, O09, V02, M01 + **G01** (miếng sườn "lật đúng lúc lần thứ 100", Mẹ gọi khen) · **G02** (khách đứng xem lật sườn như xem xiếc) | chín đều · cháy cạnh đúng ý · khô · tái |
| Than + khói | O01, D03, D04 + **G03** (Anh Sáu mang tặng bao than "loại tốt", hên xui than ướt) | |
| Nồi cơm + gạo tấm | O03, O10 + **C01** (cơm dư thành cơm chiên, khách hỏi "mai có nữa không") · **C02** (cháy đáy nồi, khách quen xin cơm cháy) | cơm nóng · cơm chiên · gạo thường |
| Bày dĩa / dĩa đặc biệt | **P01** (khách chụp dĩa đặc biệt đẹp như hình, xin đăng) · V01, V03, V04 | đẹp như hình · đủ lớp · thiếu lớp |
| Phục vụ tại bàn | K12, K14, V05, V07, O08 + **B01** (khách để quên áo khoác, Bông giữ) · **B02** (cặp đôi cầu hôn ở bàn 2, xin quán tắt đèn) · **B03** (ghép bàn hai nhóm lạ thành bạn) | trà đá kịp · bàn sạch · chờ bàn lâu · bỏ về |
| Dĩa sạch + rửa chén | O06, O08, O11 + **W01** (Dì Năm đòi tăng lương bằng… một radio) | |
| Hộp mang về | K08, K13 + **H01** (shipper đọc nhầm đơn app, 3 hộp thành 13) · **H02** (shipper ngồi chờ nhờ sạc điện thoại) | đủ bịch nước mắm · thiếu bịch · trễ |
| Tính tiền + sổ nợ | K03–K05, V06 + **S01** (khách đòi "chia tiền từng người" ở bàn 4) · **S02** (sổ nợ chạm hạn mức, Anh Sáu dẫn bạn tới ghi chung) · **S03** (khách nợ quên luôn, 14 ngày sau trả kèm thư) | tính đúng · tính dư · tính thiếu · ghi sổ |
| Ca trưa / ca tối | **R01** (ca trưa: cả văn phòng tới cùng lúc 12:00) · **R02** (khuya: tài xế ngủ gật trên ghế) | |
| Đơn đặt trước / mâm cơm | X03–X05, K02, K07, D06 | đúng giờ · trễ ít · trễ nhiều · thiếu phần |
| Hai nhà cung cấp | U01–U04 | |
| Quảng bá | **Q01–Q09** (tờ rơi / check-in trà tắc / livestream × lên mạng / phản tác dụng / khách ăn ké) như Bánh Mì | review riêng khách ngày quảng bá |
| Ký gửi | **KG1** Cô Ba ghé hỏi gói ký gửi · **KG2** ngày trả đủ · **KG3** mẹ hỏi khi lỗ | |
| Hết hàng giữa ca | O10 + **HH1** quán bên cạnh đòi trả 4 phần · **HH2** reviewer đăng "quán cơm tấm hết sườn lúc 7 giờ tối" (LM) | khách chứng kiến chạy chợ · đổi món chịu / không |
| Lên quán (cấp 7) | **Q10** ngày dọn từ vỉa hè vào quán: Anh Sáu, Cô Út, Anh Quang tới chúc ("giờ khỏi nhắc vạch sơn rồi") · **Q11** khách quen hỏi "ngồi vỉa hè vui hơn mà" | |
| Quán nổi tiếng (cấp 16) | **N01** khách xếp hàng tới đầu hẻm, Cô Lan than kẹt xe · **N02** reviewer xin "bàn riêng để quay" | |
| Phụ bàn Bông | **BO1** Bông bưng 4 dĩa một lúc, trượt chân (hên xui) · **BO2** Bông đề xuất "dĩa Gen Z" có trứng hình trái tim | |
| Trả lời review | **RV1–RV10** như Bánh Mì (ảnh câu trả lời lan nhóm chat, cư dân mạng nghi "bị hack nick", mẹ đọc câu cục súc…) | |
| Hội chợ / thử thách | F01 + **F02** (gian Vũ Kim bên cạnh) + **F03** (ban tổ chức mời năm sau) · **CH1** reviewer livestream chấm thử thách · **CH2** mẹ khoe huy hiệu | great / ok / bad · win / lose |

## 3. Kiểu lỗi (13)

Ở M4, mỗi kiểu có:
- 6–10 câu khách nói;
- 6–10 câu review;
- biến thể theo nhóm khách.

Dưới đây là 4 + 4 câu mẫu mỗi kiểu, dùng biến `{self} {call} {Call} {dish}`.

| # | Lỗi (`mistake`) | Phát hiện | Trần sao |
|---:|---|---|---:|
| 1 | Sai món (`wrongDish`) | Món mặn chính khác phiếu | 2 |
| 2 | "Không bì" mà có bì (`biAnyway`) | Phiếu cấm mà dĩa có lớp `bi` | 3 |
| 3 | Lòng đào thành chín kỹ (`hardEgg`) | Phiếu "lòng đào" mà trứng ≥ 9 s | 4 |
| 4 | Sườn cháy khét (`burnt`) | Miếng có mặt ≥ 130, hoặc cháy cạnh cho khách không dặn và điểm nướng < 10 | 2 |
| 5 | Sườn sống / tái (`raw`) | Miếng có mặt < 100 | 1 |
| 6 | Quên mỡ hành (`noMoHanh`) | Công thức có mỡ hành mà không rưới; hoặc "thêm mỡ hành" mà chỉ 1 phần | 4 |
| 7 | Nước mắm chan khi dặn để riêng (`sauceMixed`) | Phiếu "để riêng" / mang về mà chan | 3 |
| 8 | Quên châm trà đá (`noTea`) | Ly rỗng > 20 s khi khách đang chờ / ăn | 4 |
| 9 | Cho ngồi bàn dơ / bàn dơ lâu (`dirtyTable`) | Xếp khách vào bàn chưa lau, hoặc bàn bên cạnh dơ > 15 s | 3 |
| 10 | Bưng nhầm bàn (`wrongTable`) | Dĩa xuống bàn không có phiếu đó | 2 |
| 11 | Tráo dĩa trong bàn (`swapped`) | Dĩa đúng bàn nhưng sai người | 3 |
| 12 | Tính tiền sai (`wrongBill`) | Dư → trần 2 + khiếu nại · thiếu → mất tiền, không trừ sao | 2 / — |
| 13 | Cơm chay dính mặn (`veganMeat`) | Dĩa chay có mỡ hành, nước mắm, hoặc món mặn | 1 |

Lỗi 5 (sườn sống) và lỗi 13 (chay dính mặn) **luôn mở hội thoại xin lỗi**:
- Giọng nghiêm túc và tử tế, không đùa vào sức khoẻ hay niềm tin của khách.
- Lựa chọn: làm lại miễn phí / hoàn tiền + hứa.

**1. Sai món**
- Khách:
  - "{Call} ơi, {self} gọi sườn mà sao dĩa này là… gà?"
  - "Dĩa này ngon, mà của ai vậy {call}?"
  - (thợ) "Chú kêu đặc biệt mà, trứng đâu, chả đâu, chỉ thấy sườn với nỗi buồn."
  - (sinh viên) "Ủa em gọi bì chả, sao có sườn, em không đủ tiền đâu chị."
- Review:
  - "Gọi sườn, nhận gà. Ngon, nhưng là bữa tối của người khác. #comtam #nhầmmón"
  - "Dĩa cơm có ý kiến riêng, không nghe lời phiếu. 2 sao."
  - "Tôi gọi sườn non, quán trả lời bằng lạp xưởng."
  - "Quán nướng giỏi, chỉ là nướng đề bài khác."

**2. "Không bì" mà có bì**
- Khách:
  - "{Call}, {self} dặn không bì mà… bì phủ trắng luôn."
  - "Bì này tự leo lên hả {call}?"
  - "Em nói 'không bì', chắc chị nghe 'thêm bì'."
  - (văn phòng) "Em dị ứng thính đó chị, thôi để em gạt ra."
- Review:
  - "Dặn không bì. Bì vẫn đến, đông đủ. #khôngbì"
  - "Ngồi gạt bì 3 phút, cơm nguội luôn."
  - "Bì ngon, tiếc là tôi không mời nó."
  - "3 sao, trừ 2 sao cho từng sợi bì."

**3. Lòng đào thành chín kỹ**
- Khách:
  - "Trứng lòng đào của {self} đâu {call}, sao cứng như cục tẩy?"
  - "Lòng đào mà đào không ra giọt nào hết {call}."
  - (điều dưỡng) "Thôi cũng được chị, nhưng em mong chảy chút xíu."
  - "Trứng này chắc chiên từ hôm qua hả {call}?"
- Review:
  - "Gọi lòng đào, nhận lòng… đá. 4 sao vì sườn cứu. #trứnglòngđào"
  - "Quả trứng đã sống một cuộc đời quá đầy đủ trên chảo."
  - "Không có giọt lòng đỏ nào chảy xuống cơm. Tôi buồn."
  - "Trứng chín kỹ, đúng chuẩn an toàn, sai chuẩn yêu cầu."

**4. Sườn cháy khét**
- Khách:
  - "{Call} ơi, miếng sườn này hơi… đen tối."
  - "Sườn nướng than hay sườn than vậy {call}?"
  - "Cháy cạnh thì {self} thích, cháy cả miếng thì {self} hết thích."
  - (văn phòng) "Chị đổi giùm em miếng khác được không, em ăn kiêng… khói."
- Review:
  - "Miếng sườn màu cà phê đen không đường. 2 sao. #sườncháy"
  - "Vị khói rất chân thật, chân thật quá mức."
  - "Đề nghị quán canh vỉ thay vì canh điện thoại."
  - "Cơm ngon, đồ chua ngon, sườn thì đã hoá thạch."

**5. Sườn sống / tái** (nghiêm túc)
- Khách:
  - "{Call} ơi, miếng sườn bên trong còn hồng, nướng lại giùm {self} được không?"
  - "Sườn chưa chín {call}, {self} không dám ăn."
  - (điều dưỡng) "Chị nướng kỹ lại giùm em, thịt heo phải chín hẳn chị ơi."
  - (khách quen) "Hôm nay vội hả con, miếng này chưa tới."
- Review:
  - "Sườn còn sống bên trong. Quán xin lỗi và làm lại nhanh, nhưng mong cẩn thận hơn. 1 sao. #antoàn"
  - "Thịt chưa chín là điều không nên có ở quán nướng."
  - "Quán thái độ tốt, đổi ngay. Nhưng lần đầu ăn mà gặp vậy thì hơi sợ."
  - "Mong quán đừng vội tới mức bỏ qua bước quan trọng nhất."

**6. Quên mỡ hành**
- Khách:
  - "{Call} ơi, mỡ hành đi đâu rồi, cơm khô quá."
  - "Cơm tấm không mỡ hành là cơm tấm đang buồn đó {call}."
  - "{Self} dặn thêm mỡ hành mà {call} rưới có một giọt."
  - (thợ) "Mỡ hành là linh hồn đó con, đâu rồi?"
- Review:
  - "Dĩa ngon, chỉ là mỡ hành đã nghỉ phép. 4 sao. #mỡhành"
  - "Cơm trắng tinh như chưa từng biết mỡ hành là gì."
  - "Dặn thêm mỡ hành, nhận phiên bản ăn kiêng ngoài ý muốn."
  - "Thiếu đúng một muỗng mỡ hành mà thiếu cả bầu trời."

**7. Nước mắm chan khi dặn để riêng**
- Khách:
  - "{Self} dặn để riêng mà {call}… cơm {self} đi bơi rồi."
  - "Nước mắm ngập vầy {self} ăn sao đây {call}?"
  - (shipper) "Hộp mang về mà chan nước mắm, tới nơi thành cháo mất chị ơi."
  - (văn phòng) "Em ăn nhạt mà chị, giờ dĩa này mặn như nước mắt."
- Review:
  - "Dặn để riêng. Cơm tấm đã đi bơi. 3 sao. #nướcmắmđểriêng"
  - "Hộp cơm tới nhà thành hồ nước mắm."
  - "Nước mắm ngon, chỉ là nhiều hơn tôi cần cả tuần."
  - "Quán hào phóng nước mắm, hơi quá hào phóng."

**8. Quên châm trà đá**
- Khách:
  - "{Call} ơi, cho {self} ly trà đá… ly này cạn từ hồi chiều."
  - "Ăn sườn mà không có trà đá là nghẹn đó {call}."
  - (tài xế) "Chị ơi trà đá, anh chạy cả ngày khô cổ rồi."
  - "{Self} vẫy nãy giờ mỏi tay luôn {call} ơi."
- Review:
  - "Cơm ngon, trà đá thì chỉ có trong trí tưởng tượng. 4 sao. #tràđá"
  - "Ly trà rỗng từ đầu tới cuối bữa, như ví tôi cuối tháng."
  - "Quán đông, hiểu mà. Nhưng trà đá là quyền con người."
  - "Gọi ba lần mới có trà. Lần thứ tư thì tôi về."

**9. Bàn dơ**
- Khách:
  - "{Call} ơi, bàn này chưa lau hả, còn hạt cơm nè."
  - "Bàn bên kia dơ quá, ruồi bay qua đây chơi rồi {call}."
  - (văn phòng) "Chị lau giùm em cái bàn, em để túi xách."
  - "Cho {self} miếng khăn giấy, để {self} tự lau cho nhanh."
- Review:
  - "Ngồi xuống thấy hạt cơm của khách trước chào mình. 3 sao. #bàndơ"
  - "Đồ ăn ngon, bàn thì cần một cái khăn và một chút yêu thương."
  - "Bàn bên cạnh để dĩa dơ cả 10 phút, mất hết hứng."
  - "Quán nên lau bàn trước khi mời khách ngồi."

**10. Bưng nhầm bàn**
- Khách:
  - "{Call} ơi, bàn {self} chưa gọi cái này."
  - "Dĩa của {self} đâu {call}, sao bàn bên kia đang ăn món {self} gọi?"
  - (thợ) "Dĩa đặc biệt của chú mà bàn sinh viên ăn mất rồi kìa!"
  - "Ủa, bàn số mấy đây {call}?"
- Review:
  - "Dĩa của tôi đi lạc qua bàn khác và không quay về. 2 sao. #bưngnhầm"
  - "Chờ 15 phút, dĩa của mình được người khác ăn ngon lành."
  - "Quán cần đánh số bàn. Hoặc đánh số dĩa. Hoặc cả hai."
  - "Bàn bên cạnh cảm ơn quán vì dĩa đặc biệt của tôi."

**11. Tráo dĩa trong bàn**
- Khách:
  - "Dĩa không bì là của thằng Tèo, sao nằm trước mặt tao?"
  - "{Call} ơi, trứng lòng đào của {self} qua bên kia rồi."
  - (sinh viên) "Thôi tụi em đổi dĩa cho nhau cũng được chị."
  - "Bốn dĩa đúng hết, mà đúng của người khác."
- Review:
  - "Bàn 4 người, 4 dĩa đúng, sai 4 chỗ. #tráodĩa"
  - "Cả bàn đổi dĩa qua lại như chơi trò chơi."
  - "Dĩa thêm cơm tới tay người ăn ít cơm. Dĩa ít cơm tới tay tôi."
  - "Quán giỏi nướng, chưa giỏi phân phát."

**12. Tính tiền sai**
- Khách:
  - "{Call} ơi, {self} đâu có ăn hai dĩa, tính lại giùm."
  - "Khăn lạnh gì mà 200 ngàn vậy {call}?"
  - "Ủa sao rẻ vậy {call}, quên thêm cơm của {self} rồi kìa." (tính thiếu)
  - (sinh viên) "Tụi em chia tiền rồi chị ơi, lệch 10 ngàn là tụi em cãi nhau đó."
- Review:
  - "Cơm ngon, toán thì chưa. Tính dư 30k. #tínhtiền"
  - "Phiếu tính tiền có một món tôi không hề ăn."
  - "Được tính thiếu, đã nhắc lại. Quán nên mua máy tính."
  - "Dĩa cơm 5 sao, phần tính tiền 1 sao."

**13. Cơm chay dính mặn** (nghiêm túc)
- Khách:
  - "{Call} ơi, cơm chay mà có mỡ hành hả?"
  - "Chị ăn chay mà em, sao có mùi nước mắm?"
  - "Dĩa chay này có miếng sườn, chắc sườn chay hả em?"
  - (văn phòng) "Hôm nay mùng một đó em…"
- Review:
  - "Cơm chay có mỡ hành. Quán cần chỗ riêng cho đồ chay. 1 sao. #ănchay"
  - "Tôi ăn chay, dĩa cơm thì không."
  - "Mong quán cẩn thận hơn với khách ăn chay. Ngon nhưng tôi không ăn được."
  - "Quán xin lỗi rất nhanh, nhưng ngày rằm của tôi thì không làm lại được."

## 4. Review theo sao (mẫu)

M4 viết 8–12 câu mỗi mức mỗi nhóm khách. Giọng mạng xã hội, có hashtag, không emoji.

**5 sao**
- "Sườn cháy cạnh thơm mùi than, mỡ hành béo, nước mắm vừa. Ăn xong muốn gọi dĩa thứ hai. #comtam #sườncháycạnh"
- "Ngồi ghế nhựa, ăn cơm tấm, gió bờ sông thổi. Đây là định nghĩa của hạnh phúc."
- "Chủ quán nhớ tôi không ăn bì. Tôi nhớ quán suốt tuần."
- "Bốn thợ, bốn kiểu, quán làm đúng hết. Nể. #quánquen"
- "Trứng lòng đào chảy xuống cơm đúng lúc. Đỉnh."
- "Trà đá chưa kịp cạn đã được châm. Phục vụ như nhà mình."
- "Dĩa đặc biệt đẹp như hình menu, mà hình menu còn không đẹp bằng."
- "Khuya rồi mà vẫn có dĩa cơm nóng hổi. Cảm ơn quán."

**4 sao**
- "Ngon, đông, chờ bàn hơi lâu. Đáng chờ. #comtamđêm"
- "Sườn mềm, đồ chua giòn. Muốn thêm chút mỡ hành."
- "Dĩa chuẩn vị, chỉ tiếc bàn bên cạnh chưa dọn."
- "Giá hợp lý, lên món nhanh, canh nóng. Sẽ quay lại."
- "Sườn hơi khô vì nướng sẵn, nhưng nước mắm cứu được hết."
- "Ngon nhưng quán cần thêm ghế, đứng chờ mỏi chân."
- "Trà đá châm hơi chậm, cơm thì không chê được."

**3 sao**
- "Ăn được, không có gì đặc biệt. Sườn hơi mỏng. #bìnhthường"
- "Chờ 15 phút cho một dĩa sườn. Dĩa ngon, thời gian thì không."
- "Bàn hơi dơ, trà đá hơi ít, cơm thì ổn."
- "Giá ổn, vị ổn, cảm xúc cũng… ổn."
- "Nước mắm hôm nay ngọt hơn hôm qua. Chắc nước mắm có ngày vui."
- "Hết sườn, phải ăn bì chả. Bì chả ngon, nhưng tôi tới vì sườn."

**2 sao**
- "Gọi không bì, nhận bì. Gọi lòng đào, nhận trứng chín. #thấtvọng"
- "Chờ bàn lâu, chờ món lâu, chờ trà đá lâu nhất."
- "Sườn cháy, cơm nguội, bàn dơ. Hôm nay không phải ngày của quán."
- "Tính tiền dư, phải nhắc mới sửa."
- "Dĩa của tôi đi lạc qua bàn khác."
- "Khói bếp bay thẳng vào mặt suốt bữa ăn."

**1 sao**
- "Chờ 20 phút không có bàn, bỏ về. Bụng đói, lòng buồn. #bỏvề"
- "Cơm chay có mỡ hành. Mong quán tôn trọng người ăn chay hơn."
- "Sườn còn sống bên trong. Quán có xin lỗi, nhưng tôi không dám quay lại."
- "Gọi mãi không ai ra lấy món."
- "Hôm nay quán như đang có ngày tệ. Tôi cũng vậy, sau khi ăn."
- "Nhận nhầm dĩa, tính nhầm tiền, quên trà đá. Bộ ba hoàn hảo."

## 5. Tính cách chủ quán (trả lời review)

Chép 4 tính cách Bánh Mì (`PERSONAS`).
- Chọn ở màn chào, **đổi ngay trên từng review** bằng hàng nút trên các lựa chọn trả lời. Tính cách vừa đổi thành mặc định.
- Hậu quả như Bánh Mì:

  | Tính cách | Hậu quả |
  |---|---|
  | Hiền lành | An toàn |
  | Cục súc | Đánh cược viral / phốt |
  | Lầy lội | Lên xuống độ hot |
  | Sale-man | Ra khách nhưng có người thấy phiền |

- Cục súc thẳng nhưng **không bao giờ chê người**.

| Tính cách | Trả lời review khen | Trả lời review lỗi |
|---|---|---|
| **Hiền lành, lễ phép** | 1. "Dạ quán cảm ơn {name} nhiều lắm. Lần sau {name} ghé, quán để dành miếng sườn cháy cạnh đẹp nhất ạ." <br> 2. "Dạ được {name} khen là cả quán vui cả tối. Mong {name} ghé hoài nha." | 1. "Dạ quán xin lỗi vì {mistake}. Lần sau {name} ghé, quán làm lại dĩa khác và dán phiếu đỏ để không quên nữa ạ." <br> 2. "Dạ lỗi của quán, quán đã nhắc cả nhà rút kinh nghiệm. Mong {name} cho quán cơ hội sửa sai ạ." |
| **Cục súc, thẳng như ruột ngựa** | 1. "Sườn ngon là chuyện bình thường. Mai tới sớm, còn chỗ ngồi." <br> 2. "Cảm ơn. Than đỏ, sườn thơm, vậy thôi." | 1. "{Mistake}. Lỗi quán. Mai tới, quán làm lại. Hết." <br> 2. "Quán sai. Quán sửa. Không hứa hươu hứa vượn." |
| **Lầy lội, meme lord** | 1. "Miếng sườn đọc review xong cháy cạnh thêm 20% vì ngại. #sườncócảmxúc" <br> 2. "Đã in review này dán lên nồi cơm cho nồi có động lực. #nồicơmđượckhen" | 1. "Bì tự leo lên dĩa, quán đã khiển trách bì. Mai bì bị cấm cửa. #khôngbì" <br> 2. "Trứng lòng đào đã nhận lỗi và đang tự kiểm điểm trong chảo. #trứnghốilỗi" |
| **Sale-man chốt đơn** | 1. "Cảm ơn {name}! Mai dẫn 3 người bạn, tặng nguyên bình trà tắc nha!" <br> 2. "Cảm ơn {name}! Đặt mâm cơm văn phòng giảm 5%, rủ cả phòng luôn nha!" | 1. "Xin lỗi {name} vì {mistake}! Mai ghé đọc mã 'COMNONG' giảm 5k dĩa bất kỳ, quán làm lại chuẩn 100%!" <br> 2. "Quán xin lỗi! Tặng {name} một chén canh + trứng ốp la lần sau, nhớ ghé nha!" |

## 6. Nhật Ký Làm Chủ (câu chốt ngày mẫu)

Chọn theo dữ kiện ca (`core/journal.js`). Thẻ 1080×1350, câu nổi bật lên đầu thẻ.

- "Bán {n} dĩa, cháy 1 miếng, Anh Sáu ghi sổ dĩa thứ {debtCount}."
- "Hôm nay lật {flips} miếng sườn. {perfect} lần đúng lúc. Lần còn lại có cá tính."
- "Không bàn nào dơ quá 10 giây. Cái khăn lau làm việc chăm hơn chủ."
- "{n} khách dặn 'không bì'. {n} lần quán nhớ. Một lần bì thắng."
- "Giao 40 phần lúc 11 giờ 30. Ăn trưa lúc 3 giờ chiều."
- "Hết than lúc 19 giờ. Quạt mo là người hùng."
- "Doanh thu {revenue}k. Lời {profit}k. Ăn tối: ba miếng cơm cháy đáy nồi."
- "Mưa ngập vỉa hè, bán {n} dĩa dưới bốn cây dù."
- "Rửa {plates} cái dĩa. Bể 1. Cả quán hô 'phát tài'."
- "Bàn nhậu hát {songs} bài. Sai lời {songs} bài."
