# Drama, pha nhầm và review · Tiệm Bánh Mì

Brief nội dung cho M3/M4. Pool đầy đủ (~1.000 câu) viết ở M3/M4 vào `data/events*.js` và `data/lines*.js`, chọn bằng `freshLine`. Engine chép từ Trà Sữa (`core/drama.js`): điều kiện khai báo, ưu tiên sự cố do người chơi gây ra, tối đa 1 sự kiện trong ca + 1 giữa hai ca, nghỉ ≥ 2 ngày mỗi tình huống, mỗi ba sự kiện có ít nhất một tình huống vui, cờ hết hạn sau 3 ngày nếu không ghi khác, đồng hồ ca dừng khi hội thoại mở, mọi bước luôn có lựa chọn không tốn tiền / hàng.

Giọng: hài đời thường Việt Nam, châm chọc tình huống, tử tế với nhân vật. Không thương hiệu, không người thật, không emoji. Mọi tên tiệm, công ty, người đều hư cấu.

**Ký hiệu.** k = 1.000 đồng ảo · DD = danh tiếng · TD = người theo dõi · HOT = độ hot · KCS = khách ca sau · **NB** = nhiều bước · **HẸN** = hẹn quay lại ngày sau · **HX** = hên xui (`roll`) · **LM** = lỗi lên mạng. Mỗi lựa chọn hiện **chi phí trên nút** và **hậu quả ngay sau khi chọn**, rồi lưu một khoảnh khắc Nhật Ký (cột cuối).

## 1. Nhân vật (NPC Drama)

Chân dung ở `drama-portraits-hd.webp` (4 biểu cảm mỗi người). Khách thường dùng 8 vai trong cảnh.

| id | Tên | Tiểu sử |
|---|---|---|
| `me` | Mẹ | Bán xôi ở chợ quê ba chục năm. Gọi điện 5 giờ sáng hỏi "ăn gì chưa", chê con nướng bánh "lửa non", nhưng khoe con với cả xóm. |
| `chu-tam` | Chú Tám | Cai đội thợ hồ 12 người. Nói to, trả tờ 500k, nhớ tên từng thợ và từng người "không ăn hành". |
| `anh-bay` | Anh Bảy | Xe ôm đầu hẻm từ thời xe số. "Ghi sổ nghen, mai anh trả." Đôi khi trả thật, kèm một câu chuyện dài hơn tiền nợ. |
| `ba-tu` | Bà Tư | Nhà cung cấp 1 ở chợ hẻm: pate nhà làm, chả lụa, đồ tươi. Giữ công thức pate gia truyền, dễ tự ái nếu tiệm "đi mua chỗ khác". |
| `chi-mai` | Chị Mai | Chủ Lò Sỉ Mai Vàng, nhà cung cấp 2 (cấp 9). Giao bánh bằng xe ba gác lúc 3 giờ sáng, tính nhanh hơn máy tính. |
| `cau-hung` | Cậu Hưng | 22 tuổi, xe đẩy "Bánh Mì Hưng Phát" bên kia đường. Hăng, giảm giá liều, học lỏm giỏi. Đối thủ chứ không phải người xấu. |
| `co-hai` | Cô Hai | Hàng xóm sát vách, phơi đồ ban công. Rất nhạy mùi khói. Bí mật: mê ổ chả lụa nhiều đồ chua. |
| `co-sau` | Cô Sáu | Tạp hoá đầu hẻm, "ngân hàng tiền lẻ" của cả hẻm, biết mọi chuyện trước khi nó xảy ra. |
| `co-thanh` | Cô Thanh | Cán bộ kiểm tra an toàn thực phẩm phường. Nghiêm, công tâm, có cuốn sổ tay ghi chép kỹ hơn sổ kho của tiệm. |
| `anh-lam` | Anh Lâm | Giao gas kiêm chở hàng bằng xe ba bánh. Câu cửa miệng: "5 phút nữa anh tới", thực tế 5–25 phút. |
| `be-na` | Bé Na | Cháu gái chủ tiệm, sinh viên năm nhất. Đếm tiền nhanh, mê quay clip, phụ việc từ cấp 17. |
| `ollie` | Ollie | Du khách làm clip ẩm thực ("Ollie Ăn Khắp Nơi"), nói được đúng 6 câu tiếng Việt và dùng cả 6 câu trong một lần gọi món. |

Khách có tên lặp lại (dùng vai trong cảnh): Cụ Năm (`regular`, khách quen sáng sớm, trả tiền xu), chị Hạnh (`shipper`), chị Thảo thư ký công ty Hoa Sen Xanh (`office`), reviewer Tí Mập Ăn Sáng / Ngọc Giòn Rụm / Bé Su Review (`reviewer`).

## 2. Sự kiện (57)

Tổng: **59 sự kiện · 36 trong ca (61%) · 23 giữa hai ca (39%)** · 21 nhiều bước (36%) · 23 có hẹn quay lại ngày sau (39%) · 37 có lựa chọn hên xui · 7 lỗi lên mạng (V01–V06 + nhánh trend của O06). Thêm ~25 sự kiện cơ chế ở §2.7.

### 2.1 Khách (K)

| ID · lúc | Kích hoạt · thoại mở | Lựa chọn: chi phí → hậu quả | Loại | Nhật Ký |
|---|---|---|---|---|
| **K01** · ca | 06:00–06:40, từ ngày 3, hàng chờ chưa đầy. Chú Tám: "Mười hai ổ, đứa nào cũng thêm trứng, trừ thằng Hải không ăn hành, thằng Lộc không ăn ớt!" | **Nhận hết** → đơn 12 ổ, kiên nhẫn ×2, đúng hết +15k tip · **Nhận, hẹn 10 phút** → đơn đặt trước trong ca, khách mới đến chậm 20 s · **Xin chia hai đợt** → 6 ổ giờ, 6 ổ sau. Bước 2 (khi giao): "Ủa thằng Hải đâu… à nó mới vô, mười ba ổ nha!" → **Làm thêm 1** (đủ bánh) +DD 1 · **Hẹn mai bù** → mở K02 sớm | NB · HẸN → K02 (+1) | "Mười hai ổ, hai cái không hành, một cái không ớt, và một thằng Hải tới trễ." |
| **K02** · ngày | Hẹn từ K01 giao ≥ 3 sao. Chú Tám: "Đội chú làm công trình bên kia ba tháng. Mỗi sáng thứ Hai, Tư, Sáu con làm 12 ổ được không?" | **Nhận, giảm 10%** → đơn đặt trước cố định 3 ngày/tuần trong 3 tuần · **Nhận giá gốc** → 50% chú đồng ý (HX), không thì chú lấy 1 tuần thử · **Từ chối khéo** → +1 DD, chú vẫn ghé lẻ. Bước 2 (nếu nhận): "Con giao tận công trình được không?" **Giao tận nơi** → mỗi lần quầy trống 10 s, +5k phí · **Để chú cho thợ qua lấy** → đơn tới quầy, không mất giờ | NB · HX | "Có hợp đồng đầu tiên. Ký bằng một cái bắt tay dính bột." |
| **K03** · ca | Khách quen Anh Bảy, ngày ≥ 4. "Hôm nay khách ít, ghi sổ nghen, mai anh trả." | **Ghi sổ** → mất giá ổ hôm nay, mở K04 · **Cho luôn ổ này** → −giá ổ, +2 DD, Anh Bảy kể chuyện quảng cáo cho tiệm (+1 KCS) · **Từ chối khéo, mời trà đá** → không mất tiền, 30% anh dỗi (−1 KCS) | HX · HẸN → K04 (+3) | "Sổ nợ có dòng đầu tiên: Anh Bảy, 1 ổ thịt nướng, 'mai trả'." |
| **K04** · ngày | Hẹn từ K03 "Ghi sổ". Anh Bảy tới, móc túi. | Bước 1: **Nhắc nhẹ** → 70% trả đủ + 5k tip (HX), 30% "trả nửa, nửa kia mai" · **Không nhắc** → 50% anh tự trả + giới thiệu cả bến xe ôm (+3 KCS). Bước 2 (nếu trả nửa): **Xoá nợ phần còn lại** +2 DD · **Ghi tiếp** → hẹn lại (+3) | NB · HX | "Anh Bảy trả nợ bằng 12k và một câu chuyện năm 1998." |
| **K05** · ca | Cấp 6+, khách Tây trong hàng. "Excuse me… phở? Có phở không?" | **Chỉ đường quán phở đầu hẻm** → mất khách, +2 DD, mở K06 · **Diễn tả bánh mì bằng tay** → HX 60%: khách mua 2 ổ + tip 10k; 40%: khách mua nhưng ăn thử như phở (câu vui) · **Đưa bảng hình** → khách chọn ổ thịt nướng, kiên nhẫn +10 s | HX · HẸN → K06 (+2) | "Bị hỏi phở ở tiệm bánh mì. Trả lời bằng tay, chân và một ổ thịt nướng." |
| **K06** · ca | Hẹn từ K05 hoặc DD ≥ 60 và cấp 6+. Ollie: "Xin chào! Cảm ơn! Ngon quá! … Một bánh mì, quay được không?" | Bước 1: **Cho quay** → bước 2 · **Xin quay sau ca** → không ảnh hưởng nhịp, +5 TD. Bước 2: **Làm ổ đặc biệt** (−1 phần heo quay + trứng, tặng) → HX 65%: clip lên (+200 TD, +HOT, mở K07); 35%: clip chỉ quay mặt Ollie (+20 TD) · **Ráp bình thường, dạy anh nói "giòn quá"** → +60 TD chắc chắn | NB · HX · HẸN → K07 (+1) | "Dạy một người nước ngoài nói 'giòn quá'. Anh nói thành 'dòn quá' và cả mạng sửa giùm." |
| **K07** · ngày | Hẹn từ K06. Clip Ollie lên. Cô Sáu: "Con ơi, có ông Tây quay tiệm con, cả hẻm coi rồi." | **Làm bảng menu song ngữ** (25k) → khách Tây +2 mỗi ca trong 5 ngày · **Đăng lại clip** → +80 TD, HOT · **Kệ, bán như thường** → +1 DD | — | "Lên mạng nước ngoài. Mẹ hỏi 'cái ông đó nói gì vậy con'." |
| **K08** · ca | Học sinh, 06:40–07:20, ngày ≥ 3. "Chị ơi… em còn mười hai ngàn, ổ mười hai ngàn được không?" | **Bán ổ pate không bơ** → lãi còn 2k, +1 DD, mở K09 · **Bán ổ pate bơ, tính 12k** → −4k, +2 DD, mở K09 · **Nói khéo không được** → không mất tiền, học sinh mua bánh mì que nếu có | HẸN → K09 (+5) | "Ổ mười hai ngàn. Lãi hai ngàn và một lời cảm ơn ngọng líu." |
| **K09** · ngày | Hẹn từ K08. Cô giáo chủ nhiệm lớp 11A2 gọi: "Lớp đi dã ngoại, đặt 35 ổ que và 10 ổ pate, 6 giờ 30 sáng mai, có em học sinh giới thiệu." | Bước 1: **Nhận hết** → đơn đặt trước lớn, cọc 30% · **Nhận nửa** → đơn 20 que + 5 ổ · **Từ chối** → +0. Bước 2: "Cô xin bớt chút cho tụi nhỏ." **Giảm 10%** +2 DD · **Tặng bình trà đá** (−5k) +3 DD · **Giữ giá** | NB | "Lớp 11A2 đi dã ngoại bằng 35 que bánh mì của tiệm." |
| **K10** · ca | Phụ huynh, ngày ≥ 2. "Cắt làm tư cho bé. Không ớt, không hành, không rau, không đồ chua, không dưa leo… chỉ bánh với pate thôi." | **Làm ổ trơn, tính giá pate bơ** → khách vui, +1 DD · **Tính rẻ 3k** → −3k, +2 DD, phụ huynh thành khách quen · **Gợi ý bánh mì que** (nếu có) → bán bịch que, bé đòi thêm một bịch | — | "Một ổ bánh mì cắt tư, không gì cả. Bé ăn hết, mẹ bé ăn phần ớt tưởng tượng." |
| **K11** · ca | Khách mới tự tin, ngày ≥ 4. "Như cũ nha!" (khách chưa từng tới) | **Đoán: thập cẩm** → HX 40% đúng gu (+1 DD, khách tưởng tiệm nhớ thật); 60% "Ủa, em tưởng anh nhớ" (ổ vẫn bán) · **Hỏi khéo "cũ là ổ nào ta?"** → khách cười, gọi lại, kiên nhẫn −5 s · **Ghi vào Sổ khách quen ngay** → lần sau "như cũ" có thật | HX | "Khách mới nói 'như cũ'. Tiệm đoán trúng. Giờ phải nhớ thật." |
| **K12** · ca | Cụ Năm, 06:00–07:30, hàng chờ ≥ 2. Cụ đếm từng tờ 1k, 2k và một đồng xu. | **Đếm cùng cụ** → hàng chờ −8 s kiên nhẫn, +2 DD, +1k xu "lì xì" · **Tin cụ, nhận luôn** → HX 80% đủ, 20% thiếu 2k (cụ mai bù) · **Nhờ khách sau đếm giùm** → HX 50% khách vui vẻ (+1 DD hai người), 50% khách kêu trễ giờ | HX | "Nhận tiền bằng 14 tờ và một đồng xu. Quỹ tiền lẻ chưa bao giờ giàu vậy." |
| **K13** · ca | Shipper, ngày ≥ 5. Chị Hạnh: "Bảy đơn, hai mươi ổ, em ghi tay trong điện thoại, 5 phút nữa app phạt em!" | Bước 1: **Nhận, đọc từng đơn** → đơn 20 ổ chia 7 phần, kiên nhẫn ×2 · **Nhận 3 đơn trước** → đơn 8 ổ, phần còn lại xếp sau. Bước 2 (giữa chừng): "Đơn số 4 khách huỷ… à không, khách đổi sang không hành." **Sửa ổ đang ráp** (hao 1 phần hành) · **Ghi chú, sửa ổ sau** → nguy cơ "tráo đơn" | NB · HẸN → K14 (+2) | "Hai mươi ổ, bảy khách, một shipper và một danh sách viết bằng ngón cái." |
| **K14** · ca | Hẹn từ K13 ≥ 3 sao. Chị Hạnh dẫn thêm ba shipper tới cùng lúc. "Em giới thiệu cả nhóm nè!" | **Nhận cả bốn** → 4 đơn 2–4 ổ cùng lúc, +5 KCS mỗi ngày trong 3 ngày nếu ≥ 3 sao trung bình · **Nhận lần lượt** → kiên nhẫn shipper −20% · **Mời đặt trước qua tin nhắn** → mở 1 đơn đặt trước mai | — | "Được cả nhóm shipper đặt tên tiệm là 'trạm tiếp tế'." |
| **K15** · ca | Tủ còn đúng 1 ổ giòn ≥ 85, hai khách cùng muốn. "Ổ đó của em!" — "Anh tới trước mà!" | **Ổ giòn cho người tới trước, nướng lại ổ khác cho người sau** → tốn 4 s · **Bẻ đôi chia mỗi người nửa ổ giòn + nửa ổ thường** → HX 50% cả hai cười (+2 DD), 50% cả hai cùng 3 sao · **Nướng mẻ mới, mời cả hai chờ** → kiên nhẫn −15 s cả hai | HX | "Hai người giành một ổ bánh. Tiệm giải quyết bằng một con dao và sự công bằng." |
| **K16** · ca | Khách văn phòng, ổ đang phết pate. "À… em đổi ý, cho em ổ chay nha." | **Làm lại ổ chay** → hao ổ đang làm (giá vốn ghi hao hụt), khách 5 sao · **Bán ổ này giảm 5k cho khách sau** → giữ ổ, khách hiện tại chờ thêm · **Giải thích đã phết pate** → khách lấy ổ này, 3 sao, câu "thôi mai em chay" | — | "Đổi ý giữa chừng: ổ pate thành ổ chay, nửa hũ pate thành bài học." |

### 2.2 Vận hành (O)

| ID · lúc | Kích hoạt · thoại mở | Lựa chọn: chi phí → hậu quả | Loại | Nhật Ký |
|---|---|---|---|---|
| **O01** · ca | Gas < 1 mẻ, 06:00–08:00, không có bình dự phòng. Lò tắt lửa giữa mẻ. "Ủa… lửa đâu rồi?" | Bước 1: **Gọi Anh Lâm** (60k bình mới + 5k) → lò dừng 20 s · **Chạy qua mượn bình Cô Sáu** → quầy trống 10 s, mai trả bình (mở hẹn) · **Bán hết bánh trong tủ, nướng lại bằng lò than** → không nướng mẻ mới tới khi có gas. Bước 2 (mẻ đang dở): **Bật lại khi có gas** → mẻ thành "sống" (giòn 60) · **Bỏ mẻ** → hao 4–6 phôi | NB | "Mất gas lúc 6 giờ 15. Bán bánh bằng lò than và lòng tin." |
| **O02** · ca | Có lò điện. Đèn tắt, lò điện tắt. "Cúp điện rồi! Cả hẻm luôn!" Lớp `power-cut-glow`. | **Bật lò gas cũ** (nếu còn) → nướng tiếp bằng 1 ngăn · **Chỉ bán bánh trong tủ + nướng lại lò than** → khách ca này −20% · **Đóng tạm 15 s, thắp đèn bình ắc quy** → giữ khách đang chờ | HẸN → O03 (+1) | "Cúp điện. Lò điện im re, lò than cũ cứu cả buổi sáng." |
| **O03** · ngày | Hẹn từ O02. Cô Hai và Cô Sáu: "Cả dãy góp tiền mua máy phát điện chung, tiệm góp không?" | **Góp 120k** → cúp điện sau này lò điện chạy tiếp, +2 DD với hẻm · **Góp 60k, dùng nửa công suất** → 1 ngăn lò điện khi cúp · **Không góp** → HX 50% cô Hai giận (−1 DD) | HX | "Góp tiền mua máy phát với cả hẻm. Họp ba tiếng, chốt trong ba phút." |
| **O04** · ca | Ngày mưa (dự báo ở Chuẩn bị ca), từ ngày 5. Nước dâng ngập mắt cá. Lớp `rain` + `flood`. "Hẻm thành sông rồi, shipper không vô được!" | Bước 1: **Kê ván làm cầu** (15k) → khách ca này +3, +2 DD · **Mang ủng giao tận đầu hẻm** → HX 60% bán thêm 6 ổ cho shipper đứng ngoài; 40% trượt chân, ướt 2 ổ (hao) · **Đóng cửa sớm** → giữ bánh làm bánh hôm qua. Bước 2 (nếu kê ván): Cụ Năm xin đứng nhờ trú mưa → **Mời trà đá** +1 DD · **Mời vô bên trong** (tiệm) +2 DD | NB · HX · HẸN → O05 (+3) | "Mưa ngập hẻm. Tiệm bắc cầu bằng hai tấm ván và một cái thớt cũ." |
| **O05** · ngày | Hẹn từ O04. Tổ trưởng tổ dân phố (vai `regular`): "Phường cho nâng hẻm, mỗi nhà góp chút." | **Góp 80k** → mưa sau này không mở O04 bước ngập, +2 DD · **Góp bằng 20 ổ cho buổi họp** (−20 phần) → +3 DD, +1 KCS mỗi ngày 3 ngày · **Hẹn sau** → không mất gì | — | "Góp 20 ổ bánh mì cho cuộc họp nâng hẻm. Cuộc họp kết thúc sớm vì ai cũng no." |
| **O06** · ca | Người chơi để cháy mẻ trong giờ cao điểm. Khói bốc, khách ho. "Mùi gì khét vậy em?" | **Bỏ mẻ, nướng lại, xin lỗi hàng chờ** → kiên nhẫn hàng chờ +10 s, hao mẻ · **Bán "bánh mì xém" giảm 5k cho ai thích** → HX 50% thành trend "xém mà ngon" (+HOT, mở V02 bản tốt); 50% 2 review 2 sao · **Mở cửa sổ, quạt khói** → không mất thêm, −1 DD | HX | "Cháy một mẻ lúc 6 giờ 30. Đặt tên là 'phiên bản than hoạt tính'." |
| **O07** · ca | Quỹ lẻ không thối được, 06:00–07:30. Thợ hồ đưa tờ 500k cho ổ 22k. "Không có lẻ hả em? Anh có mỗi tờ này." | **Chạy qua Cô Sáu đổi** → quầy trống 10 s · **Cho thiếu, mai trả** → mất giá ổ hôm nay, HX 85% mai khách trả + tip · **Khách tự đi đổi** → kiên nhẫn −20 s, 20% khách bỏ về | HX · HẸN → O08 (+1) | "Khách đưa 500k lúc 6 giờ sáng. Cả hẻm cùng đi tìm tiền lẻ." |
| **O08** · ngày | Hẹn từ O07. Cô Sáu: "Mai mốt con muốn lẻ thì nói cô, cô để dành từ tối." | **Thoả thuận đổi lẻ mỗi sáng** (5k/ngày) → giới hạn đổi lẻ +100k, có tờ 1–2k nhiều hơn · **Tặng cô ổ chả lụa mỗi sáng** (−1 phần/ngày) → như trên, +1 DD · **Cảm ơn, tự lo** → không đổi | — | "Ký thoả thuận tiền lẻ với Cô Sáu. Phí: một ổ chả lụa nhiều đồ chua." |
| **O09** · ca | Từ ngày 4, ngẫu nhiên lúc ráp. Dao răng cưa gãy cán. "Rắc." | **Dùng dao thường** → bước rạch chậm 2 s tới hết ca · **Chạy mua dao mới** (25k) → quầy trống 8 s · **Mượn dao Cậu Hưng** → HX 50% cậu cho mượn và tặng câu "trả bằng bí quyết pate nha" (mở T02); 50% cậu đang dùng | HX | "Dao gãy giữa ca. Ổ tiếp theo được rạch bằng sự quyết tâm." |
| **O10** · ca | Đồ chua tới ngày thứ 3. Khách nhăn mặt: "Đồ chua hôm nay… chua thiệt." | **Bỏ hũ, dùng hũ mới** → hao phần còn lại · **Pha thêm đường, dùng tiếp** → tốn 1 gia vị, HX 60% ổn, 40% 2 review 3 sao · **Đổi tên thành "đồ chua đậm đà"** → không mất gì, câu Lầy lội | HX | "Đồ chua chua quá. Tiệm đổi tên nó thành 'đậm đà' và hy vọng." |

### 2.3 Nhà cung cấp (U) và đối thủ (T)

| ID · lúc | Kích hoạt · thoại mở | Lựa chọn: chi phí → hậu quả | Loại | Nhật Ký |
|---|---|---|---|---|
| **U01** · ngày | Từ ngày 6. Bà Tư: "Gan heo lên giá, pate bà phải tăng 20%, con thông cảm." | Bước 1: **Đồng ý** → pate 2k → 2,4k/phần, +1 thân thiết · **Mặc cả** → bước 2 · **Nói sẽ tìm chỗ khác** → mở U04 sớm. Bước 2: Bà Tư: "Vậy con lấy hũ lớn thì bà giữ giá." **Lấy hũ 20** (40k ngay) → giữ giá 7 ngày · **Tăng 10%** → chốt | NB · HẸN → U05 (+4) | "Mặc cả giá pate với Bà Tư. Thắng 10%, thua một bài giảng về gan heo." |
| **U02** · ca | Vừa nhập pate Bà Tư, từ ngày 5. Mở hũ: mùi lạ, màu sậm hơn. "Hũ này… thơm kiểu khác." | **Bỏ hũ, dùng ổ không pate giảm 3k** → hao hũ, khách chịu · **Dùng tiếp** → HX 70% không sao; 30% 2 review "pate hôm nay lạ" · **Gọi Bà Tư** → bà gửi hũ mới sau 20 s, miễn phí | HX · HẸN → U04 (+2) | "Một hũ pate có mùi bí ẩn. Tiệm chọn không làm thí nghiệm trên khách." |
| **U03** · ngày | Cấp 9, mở nhà cung cấp 2. Chị Mai: "Bánh sỉ chị nướng 3 giờ sáng, em khỏi canh lò, giá 3k." | **Lấy thử 10 ổ** → bánh sỉ trong kho mai · **Lấy phôi giá sỉ thôi** → phôi rẻ 10% · **Cảm ơn, tự nướng** → +1 DD ("tiệm tự nướng") | HẸN → U04 (+2) | "Được mời bỏ lò. Tiệm chọn giữ lò, vì lò là linh hồn." |
| **U04** · ngày | Hẹn từ U02 / U03, hoặc đã nhập Chị Mai ≥ 2 lần. Bà Tư biết tiệm mua chỗ khác. "Bà nghe nói con mua của con Mai hả?" | Bước 1: **Nói thật** → bước 2 · **Chối** → HX 40% bà tin; 60% bà biết (Cô Sáu kể), giá pate +10% 5 ngày. Bước 2: **Hứa chỉ mua pate của bà** → pate Bà Tư rẻ 5% vĩnh viễn, không mua pate Chị Mai được · **Nói "con cần cả hai"** → bà im lặng, mở U05 | NB · HX · HẸN → U05 (+3) | "Bị nhà cung cấp hỏi 'con mua của ai'. Câu khó nhất từ hồi mở tiệm." |
| **U05** · ngày | Hẹn từ U01 / U04. Bà Tư mang qua một hũ nhỏ. "Bà làm hũ pate theo công thức ông nhà, con thử." | **Nhận, đưa lên menu "ổ pate Bà Tư"** → +2k giá ổ pate trong 5 ngày, +2 DD · **Nhận, cảm ơn** → +1 thân thiết, 10 phần pate miễn phí · **Mời bà ngồi ăn ổ** → +2 thân thiết, mở trước bậc 1 Pate nhà làm giảm 25% | — | "Bà Tư trao công thức pate. Kèm điều kiện: không được kể cho con Mai." |
| **T01** · ngày | Từ ngày 4. Cô Sáu: "Xe thằng Hưng bên kia đường treo bảng 'ổ 10k'." | **Giảm theo 3k mọi ổ 3 ngày** → giữ khách, lãi giảm · **Tặng thêm trứng cho ổ ≥ 20k** (−3k/ổ) → HX 60% khách quay về, 40% không ai để ý · **Giữ giá, tập trung giòn** → 3 ngày −2 KCS, sau đó +2 nếu điểm giòn trung bình ≥ 85 · **Qua chào hỏi** → mở T02 sớm | HX · HẸN → T02 (+2), T03 (+5) | "Đối thủ giảm còn 10k. Tiệm đáp bằng tiếng giòn." |
| **T02** · ca | Hẹn từ T01 / O09 / mượn hàng. Cậu Hưng chạy qua: "Anh ơi, em hết bánh, cho em mua 10 ổ, khách em đứng chờ!" | **Bán giá vốn** (−10 ổ, +25k) → +1 DD, Hưng nợ ơn · **Bán giá thường** (+65k) → HX 50% cậu mua; 50% cậu đi chỗ khác · **Không bán** → giữ bánh cho mình | HX | "Bán bánh cho đối thủ. Cậu ấy trả tiền và nói 'mai em giảm giá tiếp'." |
| **T03** · ngày | Hẹn từ T01. Cậu Hưng: "Em bán lỗ một tuần rồi. Anh chỉ em canh lò được không, em không giảm giá nữa." | Bước 1: **Chỉ cách canh lò** → bước 2 · **Rủ góp chung lò sỉ** → hai bên nhập phôi rẻ 8% · **Từ chối** → T01 có thể quay lại sau 7 ngày. Bước 2: **Chỉ hết** → +3 DD, Hưng chuyển sang bán xôi buổi sáng (không còn đối thủ) · **Chỉ một nửa** → Hưng bán buổi chiều, đối thủ chỉ còn buổi chiều | NB | "Dạy đối thủ canh lò. Cậu ấy đổi sang bán xôi và gửi qua một gói mỗi sáng." |

### 2.4 Mạng và lỗi lên mạng (M, V)

| ID · lúc | Kích hoạt · thoại mở | Lựa chọn: chi phí → hậu quả | Loại | Nhật Ký |
|---|---|---|---|---|
| **M01** · ca | DD ≥ 55. Khách đội nón kết, đeo khẩu trang, gọi thập cẩm, hỏi rất kỹ. Sau khi giao, Tí Mập Ăn Sáng lộ mặt: "Mình là reviewer, mình chấm điểm tiệm nha." | Bước 1: **Hỏi "chấm sao rồi anh"** → hiện điểm ổ vừa giao · **Mời ổ thứ hai miễn phí** (−1 ổ) → HX 50% "không nhận quà, chấm khách quan" (+1 DD); 50% ăn và khen thêm. Bước 2: **Xin góp ý** → nhận một gợi ý cụ thể (ví dụ "đồ chua nhiều hơn"), mở nhiệm vụ · **Cảm ơn, tiếp khách khác** | NB · HX · HẸN → M02 (+1) | "Một reviewer giấu mặt chấm tiệm. Tiệm phát hiện khi anh ấy chụp ổ bánh 14 tấm." |
| **M02** · ngày | Hẹn từ M01. Bài review lên. Điểm theo sao ổ giao ở M01. | 4–5 sao: **Đăng lại kèm cảm ơn** → +150 TD, +4 KCS mai · 3 sao: **Nhận góp ý công khai** → +1 DD, +60 TD · 1–2 sao: **Xin lỗi, mời quay lại** → hứa ca sau ≥ 4 sao thì +2 DD · **Cãi lại** (chỉ khi 1–2 sao) → HX 30% cư dân mạng bênh tiệm; 70% dính phốt −3 DD | HX | "Lên bài review của Tí Mập. Đọc đi đọc lại 9 lần." |
| **M03** · ngày | Từ ngày 8, ngẫu nhiên. Bé Na: "Chú ơi, trên mạng đang trend bánh mì sốt phô mai tan chảy rắc bánh tráng!" | **Nhập nguyên liệu trend, bán 3 ngày** (36k) → món trend 35k, HOT, khách trẻ +3/ca; HX 50% trend kéo dài thêm · **Làm phiên bản của tiệm (pate + phô mai)** (20k) → HX 60% khách khen "biết biến tấu"; 40% "không giống trend" · **Không chạy theo** → +1 DD với khách quen. Bước 2 (nếu làm): Bé Na xin quay clip ổ trend đầu tiên → **Cho quay** → HX 50% +100 TD; 50% clip bị chê "giống tiệm khác" · **Bán trước, quay sau** → không gì | NB · HX · HẸN → M04 (+3) | "Chạy theo trend bánh mì phô mai bánh tráng. Ba ngày, tám hũ, một bài học." |
| **M04** · ca | Hẹn từ M03 (nhập trend). Trend đã tàn, còn nguyên liệu. Khách cuối cùng: "Ủa, tiệm vẫn bán cái đó hả? Hết trend rồi mà." | **Giảm còn 20k, bán nốt** → bán được phần còn lại · **Tặng kèm ổ thường** → +1 DD mỗi ổ · **Đổi tên "phiên bản hoài niệm"** → HX 40% có trend nhỏ thứ hai | HX | "Trend tàn, phô mai còn. Đặt tên là 'phiên bản hoài niệm'." |
| **M05** · ca | Ổ vừa giao có giòn ≥ 95, khách trẻ. "Chị bẻ ổ bánh cho em quay tiếng giòn được không? ASMR đó chị." | **Bẻ ổ mới cho quay** (−1 ổ) → HX 70% clip lên (+120 TD, HOT); 30% tiếng xe máy át mất · **Cho quay lúc rạch bánh** → +40 TD, bước rạch chậm 2 s · **Từ chối nhẹ nhàng** → không gì | HX | "Tiếng giòn của tiệm có 12 nghìn lượt nghe. Nhiều hơn tiếng hát của chủ tiệm." |
| **V01** · ca | Vừa giao phiếu "không hành" mà có hành, khách có điện thoại (reviewer hoặc học sinh). "Mọi người coi nè, 'không hành' mà hành phủ kín." | **Xin lỗi, làm lại** (−1 ổ) → video thành "tiệm sửa sai nhanh", +1 DD · **Biến thành trend: "ổ không hành bản giới hạn"** → HX 50% +HOT, +80 TD; 50% −2 DD "chủ tiệm cãi" · **Tặng thêm phần không hành cho cả nhóm bạn** (−2 ổ) → +2 DD | LM · HX | "Lên mạng vì 'không hành' mà hành ngập. Từ nay phiếu 'không hành' được dán đỏ." |
| **V02** · ca | Giao ổ cháy (bánh xém quá) hoặc chain từ O06. "Bánh mì than hoạt tính nè mọi người!" | **Đổi ổ mới + xin lỗi** → +1 DD · **Cười theo, đặt tên "ổ than hoạt tính" bán 1 ngày** → HX 45% trend vui (+HOT, +3 KCS); 55% review "tiệm không biết nướng" · **Giải thích lò mới** → không gì | LM · HX | "Ổ cháy lên mạng với tên 'than hoạt tính'. Lò bị đặt biệt danh." |
| **V03** · ca | Thối dư ≥ 50k (người chơi thối 100k thay vì 10k). Khách quay lại cầm tờ tiền, bạn khách quay clip: "Tiệm thối dư, mình trả lại nè!" | **Cảm ơn, tặng ổ** (−1 ổ) → clip "người tử tế gặp nhau", +2 DD, +100 TD · **Cảm ơn, mời trà đá** → +1 DD · **Xin quay chung** → HX 60% +150 TD; 40% bình luận chê "chủ tiệm đếm tiền tệ" | LM · HX | "Thối dư 90k. Được trả lại kèm 10 nghìn lượt xem." |
| **V04** · ca | Giao ổ "nhiều ớt" mà ớt quá tay ở mức ×2, khách là reviewer. "Ổ này… cay tới mức mình thấy quá khứ." (rưng rưng trên clip) | **Đưa sữa đậu nành / trà đá** (−2k) → +1 DD · **Biến thành "thử thách ổ cay" có ghi danh** → HX 50% trend, khách trẻ +3/ca 2 ngày; 50% review "nguy hiểm" −1 DD · **Làm ổ ít ớt tặng** (−1 ổ) → +1 DD | LM · HX | "Reviewer khóc vì ớt. Tiệm có bảng vinh danh 'người sống sót'." |
| **V05** · ngày | Có ổ ba chục giao với tổng giá thấp hơn 22k. Bài đăng: "Ổ ba chục mà ba sợi chả, mọi người thấy sao?" | **Xin lỗi, đăng cách tính ổ ba chục** → +1 DD, phiếu ổ ba chục hiện tổng giá to hơn · **Mời khách quay lại ăn ổ ba chục "đầy tình cảm"** → hứa ca sau, ≥ 4 sao thì +2 DD · **Đăng ảnh ổ ba chục đúng chuẩn** → HX 50% cư dân mạng khen; 50% "ảnh mạng" | LM · HX | "Ổ ba chục bị đếm từng sợi chả trên mạng. Tiệm đếm lại và xin lỗi." |
| **V06** · ca | Đơn nhiều ổ có ổ chay bị tráo vào phần của khách khác (hoặc tráo phần trong đơn thợ hồ). Chú Tám quay clip: "Thằng Hải ăn chay hồi nào vậy trời!" | Bước 1: **Đổi lại ngay** (−2 ổ) → bước 2 · **Cười trừ "ăn chay một bữa cho khoẻ"** → HX 40% cả đội cười (+HOT); 60% −2 DD. Bước 2: khách chay hỏi: "Ổ chay của tôi có dính pate không?" **Làm ổ chay mới bằng thớt riêng** (−1 ổ) → +2 DD, khách tin tiệm · **Xin lỗi, giảm 50%** | LM · NB · HX | "Đơn thợ hồ nhận nhầm ổ chay. Thằng Hải nói ngon, nhưng đòi ổ thịt." |

### 2.5 Đời thường (D) và đặc biệt (X)

| ID · lúc | Kích hoạt · thoại mở | Lựa chọn: chi phí → hậu quả | Loại | Nhật Ký |
|---|---|---|---|---|
| **D01** · ngày | Ngày ≥ 2, ngẫu nhiên, ưu tiên sau ngày lỗ. Mẹ gọi: "Bán bánh mì cả ngày mà con ăn gì chưa?" | **Nói thật: chưa** → mẹ gửi gói xôi, mai chủ tiệm "no bụng" (+5% tốc độ ráp sáng mai) · **Nói đã ăn rồi** → mẹ không tin, gọi lại hai lần (câu vui) · **Kể chuyện tiệm** → +1 DD (mẹ khoe xóm, +1 KCS) | — | "Mẹ hỏi ăn gì chưa. Trả lời 'ăn rồi', thật ra là ăn hai miếng ổ bị rạch lệch." |
| **D02** · ca | Cao điểm sáng, hàng chờ ≥ 3, ngày ≥ 6. Mẹ ghé, xắn tay áo. "Để mẹ gói cho!" | Bước 1: **Cho mẹ gói** → 60 s tự gói (như phụ việc) · **Mời mẹ ngồi uống trà** → không gì, mẹ "ngồi coi" (câu bình luận). Bước 2 (nếu mẹ gói): "Sao con để lửa non vậy?" **Nghe mẹ chỉnh lửa** → mẻ kế tiếp vùng chín rộng +3 s · **Cảm ơn, giữ cách của con** → HX 50% mẹ khen "cũng được"; 50% mẹ im lặng đầy ý nghĩa | NB · HX | "Mẹ ghé phụ gói. Gói nhanh hơn con, và nói ra điều đó ba lần." |
| **D03** · ngày | Từ ngày 5, đã có mẻ cháy hoặc ≥ 6 mẻ/ngày, chưa có chụp hút khói. Cô Hai: "Khói lò con bay qua ám hết đồ phơi của cô." Lớp `smoke`. | **Mua chụp hút khói** (140k) → hết phàn nàn, +2 DD · **Tặng cô ổ chả lụa mỗi sáng 5 ngày** (−5 phần) → HX 70% cô vui; 30% cô vẫn ngửi khói · **Dời giờ nướng mẻ đầu sớm hơn** → mẻ đầu ngày tối đa giảm 1 mẻ 3 ngày | HX · HẸN → D04 (+3) | "Hàng xóm kêu khói. Tiệm hối lộ bằng ổ chả lụa nhiều đồ chua, hợp pháp." |
| **D04** · ngày | Hẹn từ D03. Cô Hai quay lại. Theo lựa chọn cũ: vui hoặc vẫn khó chịu. | Nếu vui: **Mời cô làm "khách thử món"** → mỗi món mới có review 5 sao đầu tiên từ cô. Nếu còn khó chịu: bước 1 **Mời cô qua coi lò** → bước 2 · **Mua chụp hút khói giờ** (140k). Bước 2: cô thấy cách nướng → HX 60% cô hiểu, thành khách quen; 40% cô báo tổ dân phố (mở X01 sớm) | NB · HX | "Cô Hai từ người kêu khói thành người chấm món. Bí mật: cô thích ổ cháy cạnh." |
| **D05** · ca | Khách vừa đi, để quên điện thoại trên quầy. Điện thoại đổ chuông "Mẹ". | Bước 1: **Nghe máy** → bước 2 · **Cất vào hộp, ghi giờ** → mở D06 · **Đưa Cô Sáu giữ** → an toàn, không gì thêm. Bước 2: hai người tới nhận cùng lúc. **Hỏi hình nền là gì** → đúng chủ, mở D06 · **Đưa người tới trước** → HX 50% đúng; 50% sai, người thật tới sau, −2 DD, phải nhờ phường | NB · HẸN → D06 (+1) | "Giữ điện thoại cho khách. Hình nền là ổ bánh mì của tiệm." |
| **D06** · ca | Hẹn từ D05. Chủ điện thoại quay lại: "Hôm qua anh suýt mất hết ảnh con. Cho anh đặt 10 ổ cho văn phòng." | **Nhận đơn 10 ổ** → đơn đặt trước trong ca, +1 DD · **Tặng ổ, cảm ơn lại** → +2 DD · **Nhận, mời đánh giá tiệm** → review 5 sao chắc chắn | — | "Trả điện thoại hôm qua, hôm nay nhận đơn 10 ổ. Lòng tốt có lãi." |
| **D07** · ngày | Có ≥ 4 bánh dư (bánh hôm qua). Ông lao công đẩy xe rác đầu hẻm: "Bánh hôm qua tiệm bỏ hả? Cho tôi xin được không?" | **Cho hết** → +2 DD, mở nhân vật ông lao công chào mỗi sáng · **Nướng lại + kẹp pate cho ông** (−2 pate) → +3 DD · **Để bán nướng bơ đường** → không gì | HẸN → X02 (+6, nếu cho) | "Bánh hôm qua có chỗ đi. Ông lao công nói 'giòn hơn tiệm khác bán hôm nay'." |
| **D08** · ca | Cấp 12+, cao điểm sáng, hàng chờ ≥ 3. Bé Na ghé: "Con nghỉ hè, cho con phụ đếm tiền nha, con nhanh lắm!" | **Cho phụ ngay, trả 30k/ca 5 ngày** → Na tự thối tiền từ giờ (thử phụ việc trước cấp 17) · **Cho phụ, trả bằng bánh mì** → HX 50% Na vui; 50% Na đòi thêm "phí quay clip" · **Bảo Na về lo học** → không gì | HX · HẸN → N01 (+3, nếu cho phụ) | "Thuê cháu phụ hè. Cháu thối tiền nhanh và quay 37 clip." |
| **X01** · ca | Cấp 7+, đầu ca, hoặc chain từ D04. Cô Thanh: "Cô kiểm tra an toàn thực phẩm. Cho cô xem sổ nhập hàng, găng tay, chỗ để đồ sống chín." | Bước 1: **Trình sổ** → đạt nếu đã nhập hàng ở Bà Tư / Chị Mai trong 3 ngày (luôn có nếu chơi bình thường) · **Xin 5 phút dọn** → quầy dừng 12 s. Bước 2: "Thớt chay với thớt mặn để chung hả con?" **Tách thớt ngay** (nếu có thớt chay) → đạt · **Hứa mua thớt riêng** (20k) → đạt có điều kiện | NB · HẸN → X02 (+2) | "Được kiểm tra an toàn thực phẩm. Cô Thanh ghi sổ kỹ hơn cả tiệm." |
| **X02** · ngày | Hẹn từ X01 đạt hoặc D07. Phường gửi giấy khen "Hộ kinh doanh sạch đẹp". | **Treo giấy khen** → đồ trang trí "khung giấy khen" (+0,5 hấp dẫn) · **Chụp đăng** → +80 TD · **Gửi mẹ một tấm** → mẹ gọi (câu vui), +1 DD | — | "Có giấy khen đầu tiên. Mẹ đóng khung trước cả tiệm." |
| **X03** · ngày | Cấp 7+, có đơn đặt trước. Chị Thảo thư ký công ty Hoa Sen Xanh gọi: "Mai công ty khai trương chi nhánh, đặt 30 ổ thập cẩm, giao đúng 6 giờ." | Bước 1: **Nhận 30** → đơn đặt trước 6:00 (giờ mở cửa + 30 s), cọc 30% · **Nhận 20, giới thiệu ổ que cho phần còn lại** · **Từ chối**. Bước 2: "Mười ổ không pate, năm ổ chay nha chị." **Ghi chú đầy đủ** → phiếu có nhãn riêng · **Đề nghị đồng loạt, giảm 5%** → HX 50% chị đồng ý | NB · HX · HẸN → X04 (+1) | "Nhận đơn 30 ổ giao lúc 6 giờ sáng. Đặt báo thức 3 cái." |
| **X04** · ca | Hẹn từ X03. Ca mở, đồng hồ đếm ngược 30 ổ. 05:50 chị Thảo nhắn: "Xe công ty tới sớm 5 phút nha." | Bước 1: **Ưu tiên đơn công ty** → khách lẻ chờ thêm 10 s · **Xen khách lẻ** → nguy cơ trễ. Bước 2 (giao): **Kiểm từng ổ theo nhãn** (8 s) → không tráo · **Giao luôn** → HX 80% đúng; 20% tráo một ổ chay (mở V06) | NB · HX · HẸN → X05 (+2) | "Ba mươi ổ, 5 giờ 55, một chiếc xe công ty tới sớm." |
| **X05** · ngày | Hẹn từ X04 ≥ 4 sao. Chị Thảo: "Sếp khen. Công ty muốn đặt mỗi sáng thứ Hai 25 ổ cho họp giao ban." | **Ký 4 tuần, giảm 8%** → đơn đặt trước cố định · **Ký 2 tuần giá gốc** → HX 60% đồng ý · **Cảm ơn, nhận khi rảnh** → +1 DD. Bước 2 (nếu ký): "Công ty cần hoá đơn và giao bằng hộp giấy có logo tiệm." **Đặt in hộp** (60k) → +1 hấp dẫn, đơn công ty +5% giá · **Dùng túi thường** → chị Thảo nhận, HX 70% không sao | NB · HX | "Có khách hàng doanh nghiệp. Họp giao ban của họ giờ có mùi pate." |
| **F01** · ca | Ca hội chợ (cấp 18). MC: "Mời tiệm lên sân khấu làm ổ bánh mì nhanh nhất!" | **Lên thi** → HX 55% thắng (+200 TD, +100k); 45% thua vui (+60 TD) · **Nhờ MC đọc menu** → +4 khách hội chợ · **Vẫy tay** → không gì | HX | "Thi ráp bánh mì nhanh trên sân khấu. Ráp xong trong 41 giây, rơi 2 lát dưa leo." |

### 2.6 Bảng tổng

| Nhóm | Trong ca | Giữa hai ca | Tổng |
|---|---:|---:|---:|
| Khách K01–K16 | 12 (K01, K03, K05, K06, K08, K10–K16) | 4 (K02, K04, K07, K09) | 16 |
| Vận hành O01–O10 | 7 (O01, O02, O04, O06, O07, O09, O10) | 3 (O03, O05, O08) | 10 |
| Nhà cung cấp U01–U05 | 1 (U02) | 4 | 5 |
| Đối thủ T01–T03 | 1 (T02) | 2 | 3 |
| Mạng M01–M05 | 3 (M01, M04, M05) | 2 (M02, M03) | 5 |
| Lỗi lên mạng V01–V06 | 5 | 1 (V05) | 6 |
| Đời thường D01–D08 | 4 (D02, D05, D06, D08) | 4 (D01, D03, D04, D07) | 8 |
| Đặc biệt X01–X05, F01 | 3 (X01, X04, F01) | 3 (X02, X03, X05) | 6 |
| **Tổng** | **36 (61%)** | **23 (39%)** | **59** |

Chuỗi hẹn chính: K01 → K02 · K03 → K04 · K05 → K06 → K07 · K08 → K09 · K13 → K14 · O02 → O03 · O04 → O05 · O07 → O08 · U01 / U02 / U03 → U04 → U05 · T01 → T02, T03 · M01 → M02 · M03 → M04 · D03 → D04 (→ X01) · D05 → D06 · D07 → X02 · D08 → N01 · X01 → X02 · X03 → X04 → X05 (→ V06 nếu tráo).

### 2.7 Sự kiện riêng cho cơ chế (M3, PLAYBOOK §5)

Mỗi cơ chế có sự kiện + câu khách + review theo kết quả + khoảnh khắc Nhật Ký. Sự kiện cơ chế bổ sung (viết ở M3, ngoài 59 sự kiện trên):

| Cơ chế | Sự kiện thêm | Kết quả có review riêng |
|---|---|---|
| Đơn nhiều ổ / ráp ×N | dùng K01, K13, K14, V06 | đúng hết · một ổ lệch · tráo phần · ổ ra trễ (> 18 s giữa ổ đầu và cuối) · giao cùng lúc |
| Đơn đặt trước | X03–X05, K02, K09 | đúng giờ · trễ ít · trễ nhiều · thiếu ổ |
| Lò + độ giòn | O01, O02, O06, M05, V02 + **L01** (mẻ đầu ngày vàng đều, khách đầu tiên khen) | giòn ≥ 95 · ỉu · nướng lại · xém |
| Tiền lẻ | O07, O08, K12, V03 | thối đúng · thiếu · dư được trả · dư mất |
| Hai nhà cung cấp | U01–U05 | |
| Quảng bá | **Q01–Q09** (tờ rơi / check-in trà đá / livestream × lên mạng / phản tác dụng / khách ăn ké) như Trà Sữa | review riêng khách ngày quảng bá |
| Ký gửi | **B01** Bà Tư ghé hỏi thăm gói ký gửi · **B02** ngày trả đủ · **B03** mẹ hỏi khi lỗ | |
| Hết hàng giữa ca | **H01** Cậu Hưng đòi nợ 4 phần · **H02** mẹ nghe tiệm đóng cửa sớm · **H03** reviewer đăng "tiệm bánh mì hết bánh mì" (LM) | review khách chứng kiến chạy đi mua, đổi món chịu / không |
| Lên tiệm (cấp 7) | **S01** ngày dọn từ xe đẩy vào tiệm: Cô Sáu, Anh Bảy, Cụ Năm tới chúc · **S02** khách quen hỏi "xe đẩy đâu rồi?" | |
| Tiệm nổi tiếng (cấp 16) | **S03** hàng dài tới đầu hẻm, Cô Hai than kẹt xe · **S04** reviewer xin xếp hàng riêng | |
| Lò điện | **E01** lò điện nướng đều quá, Mẹ nghi "bánh công nghiệp" · O02 | |
| Phụ việc Bé Na | **N01** Na quay clip lúc thối tiền, thối nhầm · **N02** Na đề xuất "ổ Gen Z" | |
| Trả lời review | **R01–R10** như Trà Sữa (ảnh chụp câu trả lời lan nhóm chat, cư dân mạng nghi "bị hack nick", mẹ đọc câu cục súc…) | |
| Hội chợ / thử thách | F01 + **F02** (gian Cậu Hưng bên cạnh) + **F03** (ban tổ chức mời năm sau) · **CH1** reviewer livestream chấm thử thách · **CH2** mẹ khoe huy hiệu | great / ok / bad · win / lose |

## 3. Kiểu lỗi (11)

Mỗi kiểu ở M4 có 6–10 câu khách nói + 6–10 câu review, kèm biến thể theo nhóm khách. Dưới đây là câu mẫu (biến `{self} {call} {Call} {loaf}`).

| # | Lỗi (`mistake`) | Phát hiện | Trần sao |
|---:|---|---|---:|
| 1 | Sai nhân (`wrongFilling`) | Nhân chính khác phiếu | 2 |
| 2 | Quên pate (`noPate`) | Công thức có pate mà không phết | 3 |
| 3 | "Không hành" mà có hành (`onionAnyway`) | Phiếu cấm mà có `hanh-la` | 3 |
| 4 | Ớt quá tay (`tooSpicy`) | Mức ớt cao hơn phiếu ≥ 2 nấc | 3 |
| 5 | Bánh cháy / xém nặng (`burnt`) | Giao ổ xém cho khách không thích giòn, hoặc ổ cháy | 2 |
| 6 | Bánh ỉu / nguội (`soggy`) | Độ giòn < 50 | 3 |
| 7 | Quên nướng lại (`notToasted`) | Phiếu "giòn giòn nha" mà < 85 | 4 |
| 8 | Gói sai / quên túi (`wrongWrap`) | Không cắt đôi khi phiếu cần, shipper / mua về không túi | 4 |
| 9 | Thối nhầm tiền (`wrongChange`) | Thối thiếu (thiếu → 2 sao) hoặc dư (mất tiền) | 2 / — |
| 10 | Tráo đơn nhiều ổ (`swapped`) | Ổ đúng nhưng vào nhầm phần / nhầm khách | 2 |
| 11 | Chay dính mặn (`veganMeat`) | Ổ chay có pate, mayo trứng hoặc nhân mặn | 1 |

**1. Sai nhân**
- Khách: "{Call} ơi, {self} gọi chả lụa mà sao ổ này toàn… xíu mại?" · "Ổ này ngon, mà của ai vậy {call}?" · "Thịt nướng đâu {call}, sao có trứng ốp la nằm đó?" · (thợ hồ) "Chú kêu heo quay mà, heo đâu, chỉ thấy chả."
- Review: "Gọi chả lụa, nhận xíu mại. Ngon nhưng là một ổ của người khác. #banhmi #nhầmnhân" · "Ổ bánh có bản lĩnh riêng, không nghe lời phiếu. 2 sao." · "Tôi gọi gà xé, ổ bánh trả lời bằng thịt nguội." · "Tiệm ráp giỏi, chỉ là ráp đề bài khác."

**2. Quên pate**
- Khách: "{Call} ơi, pate đi đâu rồi, ổ khô queo à." · "Bánh mì không pate là bánh mì đang buồn đó {call}." · "Ổ này nhìn thiếu thiếu… à, thiếu cái béo." · (khách quen) "Con quên pate của cô rồi, hôm nay mệt hả?"
- Review: "Ổ ngon, chỉ là pate đã nghỉ phép. 3 sao. #thiếupate" · "Bánh giòn, đồ chua ngon, pate thì… mất tích." · "Lần đầu ăn ổ chả lụa phiên bản ăn kiêng ngoài ý muốn." · "Tiệm tiết kiệm pate giùm tôi. Không cần đâu ạ."

**3. "Không hành" mà có hành**
- Khách: "{Call}, {self} dặn không hành mà… hành nhiều hơn bánh luôn." · "Hành này chắc tự leo vô hả {call}?" · "Em nói 'không hành', chắc chị nghe 'không, hành!'" · (văn phòng) "Chiều nay anh họp đó em, hành là hết cứu."
- Review: "Dặn không hành. Hành vẫn đến, đông đủ. #khônghành" · "Ngồi gỡ hành 4 phút, ổ bánh nguội luôn." · "Hành lá ngon, tiếc là tôi không mời nó." · "3 sao, trừ 2 sao cho từng cọng hành."

**4. Ớt quá tay**
- Khách: "Ít ớt mà {call}… đây là ít của ai vậy?" · "Ổ này cay tới mức {self} nghe được màu sắc." · "Trà đá! Cho {self} trà đá gấp!" · (khách Tây) "Spicy… very spicy… cảm ơn… nước!"
- Review: "Gọi ít ớt, nhận đủ ớt cho cả tuần. #cayxémồm" · "Ổ bánh ngon, nhưng tôi không cảm nhận được vì lưỡi đã nghỉ việc." · "Ăn xong tỉnh ngủ hơn uống ba ly cà phê." · "Tiệm hào phóng ớt. Hơi quá hào phóng."

**5. Bánh cháy / xém nặng**
- Khách: "{Call} ơi, ổ này hơi… đen tối." · "Bánh mì hay than vậy {call}?" · "Giòn thì giòn thiệt, giòn kiểu than củi." · (phụ huynh) "Cái này bé nhà chị không ăn được đâu em."
- Review: "Vỏ bánh màu cà phê đen không đường. 2 sao. #cháycạnh" · "Ổ bánh có vị khói rất… chân thật." · "Bánh giòn tới mức gãy cả kế hoạch ăn sáng." · "Đề nghị tiệm canh lò thay vì canh điện thoại."

**6. Bánh ỉu / nguội**
- Khách: "Ổ này dai như dây thun vậy {call}." · "Bánh nguội rồi {call} ơi, nướng lại giùm được không?" · "Bóp vô không nghe tiếng gì hết, buồn ghê." · (học sinh) "Bánh này chắc cũng mệt như em sáng nay."
- Review: "Bánh mềm như lời hứa giảm cân. 3 sao. #bánhỉu" · "Nhân ngon, bánh thì đã hết giòn từ hôm qua." · "Ăn ổ bánh mì mà nhai như ăn xôi." · "Lần sau tới sớm hơn, chắc bánh còn trẻ."

**7. Quên nướng lại**
- Khách: "{Self} dặn giòn giòn mà {call}…" · "Giòn giòn là phải kêu rộp rộp nha {call}." · "Nướng lại giùm {self} xíu đi, chưa giòn." · (khách quen) "Cô dặn giòn mà con quên cô rồi."
- Review: "Dặn giòn giòn, nhận mềm mềm. 4 sao vì vẫn ngon. #giòngiòn" · "Ổ bánh ổn, chỉ thiếu bước 'rộp' quan trọng nhất." · "Gần đạt, thiếu đúng 30 giây lò than." · "Tiệm nghe 'giòn giòn' như 'bình thường thôi'."

**8. Gói sai / quên túi**
- Khách: "Cắt đôi giùm {self} mà {call}…" · "{Call} ơi, năm ổ mà không túi, {self} ôm sao đây?" · (shipper) "Không túi là em chở bằng niềm tin hả chị?" · "Giấy gói bung hết rồi {call}."
- Review: "Ổ ngon, nhưng tôi phải ôm 5 ổ như ôm con. #quêntúi" · "Dặn cắt đôi, nhận nguyên ổ, và một con dao tưởng tượng." · "Đồ chua rơi suốt quãng đường về nhà." · "Shipper tôi kể lại câu chuyện ôm 5 ổ bánh với ánh mắt mệt mỏi."

**9. Thối nhầm tiền**
- Khách: "{Call} ơi, thối thiếu {self} 10 ngàn rồi." · "Ủa, sao dư nhiều vậy {call}? Trả lại nè." · "Ổ 22 ngàn mà thối {self} 8 ngàn hả {call}?" · (cụ Năm) "Con đếm lại giùm cụ, mắt cụ kém mà tiền cụ tính kỹ."
- Review: "Ổ ngon, toán thì chưa. Thối thiếu 10k. #thốitiền" · "Được thối dư, đã trả lại. Tiệm nên mua máy tính." · "Thối tiền kiểu xổ số, hôm nay tôi trúng âm." · "Bánh 5 sao, phần thối tiền 1 sao."

**10. Tráo đơn nhiều ổ**
- Khách: "Ổ không ớt của thằng Lộc sao nằm trong túi của tôi?" · "{Call} ơi, ổ chay của chị đi đâu, sao chị cầm ổ heo quay?" · (shipper) "Đơn số 3 với đơn số 5 đổi nhau rồi chị ơi, app phạt em." · "Năm ổ đúng hết, mà đúng của người khác."
- Review: "Đơn 6 ổ, đúng 6 ổ, sai 6 người. #tráođơn" · "Cả phòng ăn ổ của nhau, coi như team building." · "Ổ không hành đi tới tay người thích hành. Ổ có hành đi tới tay tôi." · "Tiệm giỏi ráp, chưa giỏi phân phát."

**11. Chay dính mặn**
- Khách: "{Call} ơi, ổ chay mà có pate hả?" · "Chị ăn chay mà em, sao có mùi chả lụa?" · "Ổ chay này… có thịt nguội, chắc thịt nguội chay hả em?" · (văn phòng) "Hôm nay mùng một đó em…"
- Review: "Ổ chay có pate. Tiệm cần thớt riêng. 1 sao. #ănchay" · "Tôi ăn chay, ổ bánh thì không." · "Mong tiệm cẩn thận hơn với khách ăn chay. Bánh ngon nhưng tôi không ăn được." · "Tiệm xin lỗi rất nhanh, nhưng ngày rằm của tôi thì không làm lại được."

Lỗi 11 luôn mở hội thoại xin lỗi (làm lại bằng thớt chay miễn phí / hoàn tiền + hứa), giọng nghiêm túc và tử tế, không đùa vào niềm tin của khách.

## 4. Review theo sao (mẫu)

M4: 8–12 câu mỗi mức mỗi nhóm khách. Giọng mạng xã hội, có hashtag, không emoji.

**5 sao**
- "Giòn rụm, pate béo, đồ chua chua vừa. Ăn xong muốn quay lại mua ổ thứ hai. #banhmi #giònrụm"
- "Tiếng rộp đầu tiên lúc 6 giờ sáng là lý do để thức dậy."
- "Chủ tiệm nhớ tôi không ăn hành. Tôi nhớ tiệm suốt buổi họp."
- "Ổ thịt nướng thơm khói, nước sốt thấm mà bánh không ỉu. 10/10."
- "Mười hai ổ cho đội thợ, đúng từng ổ không hành không ớt. Nể."
- "Bánh ra lò nóng hổi, cầm trên tay ấm như được mẹ đưa."
- "Ổ ba chục mà đầy như ổ bốn chục. Tiệm làm ăn có tâm. #ổbachục"
- "Khách Tây bên cạnh nói 'giòn quá'. Tôi đồng ý với anh ấy."

**4 sao**
- "Ngon, giòn, chờ hơi lâu vì đông. Đáng chờ. #banhmisáng"
- "Pate ngon, chả lụa dày. Muốn thêm chút đồ chua."
- "Ổ chuẩn vị, chỉ tiếc tới trễ nên bánh hơi nguội."
- "Giá hợp lý, ráp nhanh, rau tươi. Sẽ quay lại."
- "Ổ trứng ốp la lòng đào chảy xuống tay. Hơi khó ăn, rất đáng."
- "Ngon nhưng tiệm cần thêm ghế cho người đứng chờ."

**3 sao**
- "Ăn được, không có gì đặc biệt. Bánh hơi dai. #bìnhthường"
- "Nhân ổn, bánh nguội. Có lẽ tới sớm sẽ khác."
- "Chờ 10 phút cho một ổ pate. Ổ ngon, thời gian thì không."
- "Ớt hơi nhiều so với 'ít ớt' của tôi."
- "Giá ổn, vị ổn, cảm xúc cũng… ổn."
- "Đồ chua hôm nay chua hơn hôm qua. Tôi đoán đồ chua có ngày buồn."

**2 sao**
- "Gọi không hành, nhận hành. Gọi giòn, nhận dai. #thấtvọng"
- "Chờ lâu, bánh nguội, nhân ít. Mong tiệm cải thiện."
- "Ổ bánh cháy cạnh, vị khói lấn át pate."
- "Thối thiếu tiền, bánh lại sai nhân. Hôm nay không phải ngày của tiệm."
- "Tôi nghĩ tiệm quên tôi trong hàng chờ."
- "Ổ ba chục mà ba sợi chả, đếm được luôn."

**1 sao**
- "Chờ 15 phút rồi bỏ về. Bụng đói, lòng buồn. #bỏvề"
- "Ổ chay có pate. Mong tiệm tôn trọng người ăn chay hơn."
- "Nhận nhầm đơn, gọi lại không ai nghe."
- "Bánh cháy đen, tiệm vẫn đưa. Tôi không hiểu."
- "Hôm nay tiệm như đang có ngày tệ. Tôi cũng vậy, sau khi ăn."

## 5. Tính cách chủ tiệm (trả lời review)

Chép 4 tính cách Trà Sữa (`PERSONAS`). Chọn ở màn chào, **đổi ngay trên từng review** bằng hàng nút trên các lựa chọn trả lời; tính cách vừa đổi thành mặc định. Hậu quả như Trà Sữa (Hiền lành an toàn, Cục súc đánh cược viral / phốt, Lầy lội lên xuống độ hot, Sale-man ra khách nhưng có người thấy phiền). Cục súc thẳng nhưng **không bao giờ chê người**.

| Tính cách | Trả lời review khen | Trả lời review lỗi |
|---|---|---|
| **Hiền lành, lễ phép** | "Dạ tiệm cảm ơn {name} nhiều lắm. Mai tiệm nướng mẻ đầu sớm hơn để {name} có ổ giòn nhất ạ." | "Dạ tiệm xin lỗi vì {mistake}. Lần sau {name} ghé, tiệm làm lại ổ khác và dán phiếu đỏ để không quên nữa ạ." |
| **Cục súc, thẳng như ruột ngựa** | "Giòn là chuyện bình thường. Mai tới sớm, còn giòn hơn." | "{Mistake}. Lỗi tiệm. Mai tới, tiệm làm lại. Hết." |
| **Lầy lội, meme lord** | "Ổ bánh đọc review xong giòn thêm 20%. #bánhmìcócảmxúc" | "Hành tự leo vô ổ, tiệm đã khiển trách hành. Mai hành bị cấm cửa. #khônghành" |
| **Sale-man chốt đơn** | "Cảm ơn {name}! Mai mua 5 ổ tặng 1 trà đá, rủ cả phòng luôn nha!" | "Xin lỗi {name} vì {mistake}! Mai ghé đọc mã 'GIONLAI' giảm 5k ổ bất kỳ, tiệm làm lại chuẩn 100%!" |

## 6. Nhật Ký Làm Chủ (câu chốt ca mẫu)

Chọn theo dữ kiện ca (`core/journal.js`). Thẻ 1080×1350, câu nổi bật lên đầu thẻ.

- "Bán {n} ổ, cháy 1 mẻ, thối dư cho chú Tám 10k và chú trả lại kèm câu 'buôn bán vậy sao giàu'."
- "Hôm nay tiệm nướng {batches} mẻ. Mẻ nào cũng vàng. Trừ mẻ thứ ba. Mẻ thứ ba có cá tính."
- "Không ổ nào ỉu. Lò than làm việc chăm hơn chủ."
- "{n} khách nói 'không hành'. {n} lần tiệm nhớ. Một lần hành thắng."
- "Giao 30 ổ lúc 6 giờ sáng. Ngủ trưa lúc 9 giờ sáng."
- "Hết tiền lẻ lúc 6 giờ 10. Cô Sáu là người hùng."
- "Doanh thu {revenue}k. Lời {profit}k. Ăn sáng: nửa ổ rạch lệch."
- "Ngày mưa ngập hẻm, bán {n} ổ qua một cây cầu ván."
