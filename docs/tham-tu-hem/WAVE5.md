# Thám Tử Hẻm: đợt 5 cho Codex (mùa 2)

Làm trên nhánh của bạn (`codex/tham-tu-hem-s2`) sau khi `git merge claude/tth-s2`. `asset-spec.json` đã cập nhật sẵn. Kiểm:

```
python -I tools/asset-check/check_assets.py docs/tham-tu-hem/asset-spec.json --preview <tmp>
```

Phải ra "0 lỗi — ĐẠT", ghi vào ASSET-HANDOFF.md.

Có 4 chân dung phụ, 28 điểm soi thêm và 116 icon vật chứng.

1. **Chân dung phụ** (chilan, chihen, basau, chitho): thêm vào sheet chân dung của vụ, ô 256, 4 biểu cảm như các vai khác.
2. **Điểm soi thêm:**
   - Đồ vật đã có trong cảnh thì chỉ ghi `manifest.hotspots`.
   - Chưa có thì vẽ thêm vào cảnh, giữ lưới 2× và giữ nguyên đồ vật cũ.
   - Điểm soi là "hành động" (ví dụ `cho-nua-dem`, `thi-nghiem-*`) thì ghi vùng hợp lý quanh đồ vật liên quan.
   - Đừng để các ô chồng lên nhau nhiều.
3. **Icon vật chứng:** mỗi vụ một sheet `assets/clues-<vụ>.webp`, ô 96×96 lưới 2×, tên frame là id vật chứng. Vẽ đúng cột **Mô tả**. Chữ trên giấy hoặc màn hình chỉ cần gợi hình, trừ con số lớn.

4. **Âm thanh mùa 2** (làm sau ảnh). Thả mp3 vào `prototype/games/tham-tu-hem/assets/audio/`, ghi thêm vào `docs/tham-tu-hem/AUDIO.md`:

| Tên file | Dùng khi |
|---|---|
| `music-map-2.mp3` | Nhạc bản đồ "Chợ Hẻm" và màn chuyển sang mùa 2. Vòng lặp liền mạch 60–120 s, không lời. Tông chợ đêm nhộn nhịp, vui: cùng chất trinh thám hài jazz noir pha nhạc cụ Việt như `music-map`, nhưng nhanh và rộn hơn (thêm mõ, phách, đàn nguyệt, kèn), để nghe là biết đang ở mùa khác. |
| `amb-market.mp3` | Tiếng nền chợ đêm, vòng lặp 60–90 s: tiếng rao xa ("ai bánh mì nóng đây"…), xe máy chạy ngang, tiếng người, chén bát, loa phường văng vẳng. Không câu nào rõ chữ, nhỏ và đều (khoảng −22 LUFS) để không lấn nhạc. |

Code đã sẵn: có file thì bản đồ mùa 2 tự phát, chưa có thì dùng lại nhạc mùa 1.

## Danh sách theo vụ

### Vụ 7: Tờ Vé Số Bốc Hơi (`assets/clues-ve-so.webp`)

| id | Tên | Mô tả (vẽ cái này) |
|---|---|---|
| `danh-sach-cho` | Danh sách đi chợ của bà Chín | Giấy tập học trò, chữ bà Chín: "Cá lóc 1 con. Rau muống 2 bó. Sửa xe (bánh xì). KHÔNG MUA VÉ SỐ." Chữ cuối gạch chân ba lần, lủng cả giấy. |
| `chuyen-xe-app` | Chuyến xe ôm trên app | Lịch sử chuyến trên điện thoại ông Chín: tài xế Lực, Wave xanh. Đón 07:38 ở tiệm chú Tư, trả 07:49 ở cổng chợ. Thanh toán tiền mặt 15.000đ. Ông Chín chưa đánh giá chuyến. |
| `anh-nhan-xe` | Ảnh nhận xe 07:18 | Ảnh chú Tư chụp lúc nhận xe Cub của ông Chín, giờ trên máy 07:18. Ông Chín đứng cạnh xe, trong túi áo ngực ló ra một góc giấy xanh có chữ "...SỐ KIẾN THIẾT". |
| `ly-tra-da` | Ly trà đá đổ | Ly nhựa đổ dưới ghế chờ tiệm chú Tư, khăn lau còn ướt. Chừng 7 giờ 25 ông Chín làm đổ nguyên ly trà đá lên ngực áo, đúng túi đựng vé. |
| `tien-uot` | Tờ 50 ngàn ướt trà | Tờ tiền ông Chín trả chị Lan lúc 07:58 ở sạp cá, còn ẩm, mùi trà đá. Chị Lan nói ông móc tiền rời ra trả, không có tờ vé gói ngoài như mọi ngày. |
| `lich-hen` | Lịch hẹn tiệm chú Tư | "07:15 – Ông Chín – Cub – vá ruột. 07:36 thu 30k, khách đi trước." "08:40 – Lực – Wave xanh – thay bọc yên – GẤP." Sát lề, chữ nhỏ: "230479 – mai mua ké". |
| `giay-bao-no` | Giấy báo nợ góp xe | Trong cốp xe Wave yên da beo: công ty tài chính báo anh Nguyễn Văn Lực quá hạn 3 kỳ góp xe, sẽ thu hồi xe ngày 30. Bên lề có ai bấm máy tính ghi: "còn thiếu 7.450.000". Đó là nợ góp xe. |
| `manh-ve-yen` | Mảnh vé kẹt trên yên da beo | Mảnh giấy xanh bằng móng tay, in nửa chữ "...KIẾN THIẾT TP.H...", kẹt trong đường rạch bọc yên da beo xe Lực. Loang vệt trà đá khô. |
| `ket-qua-xs` | Bảng kết quả xổ số | Đại lý chị Hên: Xổ số TP.HCM xổ chiều qua, giải độc đắc: 230479, trị giá 2 tỉ đồng. |
| `log-may-do` | Lịch sử máy dò số | 08:12: vé 230479 TP.HCM – TRÚNG ĐẶC BIỆT – cảnh báo "không đọc được seri, vé mất góc". 09:05: vé 120861 TP.HCM – không trúng. Không có lượt dò nào lúc 9 giờ 40. |
| `clip-0811` | Camera đại lý 08:11 | Người áo khoác xanh lá, nón bảo hiểm xanh, đậu xe Wave yên da beo trước cửa đại lý, dò vé lúc 08:12 rồi hỏi chị Hên gì đó. |
| `clip-0905` | Camera đại lý 09:05 | Một bà mặc đồ bộ, nón lá kéo sụp tới cằm, đeo túi vải đi chợ, dò một tờ vé lúc 09:05, lắc đầu rồi đi thật nhanh. |
| `ve-e-cat-goc` | Vé ế bị cắt góc | Tờ vé ế đài Bến Tre trong thùng vé cũ của đại lý, bị cắt mất đúng góc in seri bằng kéo. Chị Hên nói thùng bị ai lục sáng nay. Dấu hiệu của ghép góc giả. |
| `so-phat-ve` | Sổ phát vé của đại lý | Trang của Mai hôm qua: "230479 – TP.HCM – 1 tờ – đã bán (Ô. Chín)". Kế đó: 230479 các đài Long An, Bến Tre, Vĩnh Long, Đồng Nai... mỗi đài 1 tờ. Ghi chú của chị Hên: "Mai lấy số này mỗi ngày, 5 năm rồi". |
| `ve-vinh-long` | Vé Vĩnh Long vo tròn | Vé số đài Vĩnh Long số 230479, xổ thứ Sáu tuần trước, vo tròn dưới gầm xe đẩy hàng ở chợ. Cùng số ngày cưới ông Chín, khác đài, đã hết hạn. |
| `goc-ve-rach` | Góc vé trong túi áo ông Chín | Mảnh giấy xanh hình tam giác, bằng hai đốt ngón tay, quấn lẫn trong xấp tiền ướt ở túi áo ông Chín. In "Ký hiệu 6K7 – Seri 0423". Mép rách răng cưa, ố trà đá. Chính là góc số seri của tờ vé. |
| `ve-ba-chin` | Vé số bí mật của bà Chín | Tờ vé 120861 đài TP.HCM giấu trong ngăn kéo khoá của túi vải bà Chín. 120861 là ngày sinh ông Chín: 12/08/61. |

**Chân dung thêm vào `portraits-ve-so.webp`:** `chilan` (Chị Lan: Bán cá ở chợ. 40 tuổi, ủng cao su, tạp dề nhựa, giọng to hơn loa chợ. Nhớ mặt từng khách, nhớ luôn khách nào trả tiền lẻ.); `chihen` (Chị Hên: Chủ đại lý vé số. 50 tuổi, đeo vòng cẩm thạch, chủ "Đại Lý Vé Số Hên" đầu chợ. Nói câu nào cũng chêm chữ "hên".)

**Điểm soi thêm (ghi manifest.hotspots):**
- `market` · `loa-cho`: Loa chợ (rect gợi ý [800,30,120,100])
- `garage` · `yen-xe-wave`: Đường may yên xe (soi kỹ) (rect gợi ý [400,240,150,50])
- `garage` · `radio-cu`: Radio cũ (rect gợi ý [40,60,150,90])
- `lottery` · `ban-tho-than-tai`: Bàn thờ Thần Tài (rect gợi ý [820,160,120,140])

### Vụ 8: Đêm Karaoke Cúp Điện (`assets/clues-karaoke.webp`)

| id | Tên | Mô tả (vẽ cái này) |
|---|---|---|
| `log-laptop` | Nhật ký laptop dàn karaoke | Laptop chạy pin: tiết mục #6 Béo "Hẻm Nhỏ Mùa Mưa" bắt đầu 21:12:15. Mất tín hiệu ra loa 21:14:07, bài đang ở 1:52/4:10. Phần mềm báo "Ghi âm đa kênh: ĐANG BẬT". |
| `so-muon-mic` | Sổ mượn micro | Tờ giấy dán trên mixer: "MIC 1: thí sinh trên sân khấu. MIC 2: cô Thu – 21:00 – check giọng (xin riêng). Trả: (bỏ trống)." |
| `danh-sach-bai` | Danh sách tiết mục chung kết | #4 20:56 Ca Sĩ Nón Lá (bí ẩn). #5 21:04 Hai Lúa. #6 21:12 Béo – "Hẻm Nhỏ Mùa Mưa". #7 21:20 Cô Thu, quán quân năm ngoái – "Bông Điên Điển". |
| `cau-dao-gat-tay` | Cần gạt cầu dao tận đáy | Cầu dao 40A nhảy vì quá tải thì cần gạt về lưng chừng. Chú Ba tới lúc 21:30 thấy cần gạt nằm dưới tận đáy: cầu dao bị gạt tay. |
| `so-dien` | Sổ điện chung kết | Tổng tải sân khấu 2,8kW (dàn loa 2.000W, đèn 800W, tủ lạnh không cắm). Cầu dao 40A chịu khoảng 8kW. "21:14 – ??? – mất điện. 21:31 – bật lại – chú Ba (tới trễ)." |
| `kenh-mic-2` | File ghi âm kênh MIC 2 | 21:05: giọng nữ hát thử "Bông Điên Điển", phô, lạc tông, hụt hơi, rồi lẩm bẩm "trời ơi không có nó thì chết". 21:13:51: tiếng bước chân nhanh, bản lề sắt kêu "KÉÉÉT" dài. 21:14:07: "TÁCH". Rồi im. |
| `kim-sa-chot` | Mảng kim sa ở chốt tủ điện | Mảng vải lưới cỡ bao diêm, đính kín hạt kim sa vàng tròn, mắc vào chốt sắt gỉ của cửa tủ điện. |
| `ao-vang-rach` | Áo kim sa vàng bị rách | Áo kim sa vàng của cô Thu, cuộn giấu giữa hai thùng loa trên xe ba gác. Vạt phải rách một lỗ cỡ bao diêm, mép tua lưới, rơi hạt kim sa vàng. |
| `moc-du-phong` | Móc áo dự phòng trống | Móc "Cô Thu – áo kim sa DỰ PHÒNG (bạc)" ở hậu trường trống trơn. Cô Thu đang mặc áo bạc, trong khi đầu tối cô mặc áo vàng. Cô đã thay áo. |
| `mic-2-thung-bia` | MIC 2 dưới đáy thùng bia | Micro không dây "MIC 2" giấu dưới đáy thùng đá ướp bia ở hậu trường, cách bàn trang điểm ba bước. Lưới micro kẹt hai hạt kim sa vàng. |
| `micro-kim-sa` | Micro kim sa bị bể | Micro kim sa riêng của cô Thu: không dây, có bluetooth và thẻ nhớ chứa đúng một file "BONG_DIEN_DIEN_GIONG_THU_FULL.mp3". Vỏ nứt, nắp pin văng mất. Không phát được nữa. |
| `den-led-ngoc` | Bảng đèn LED "NGỌC ƠI" | Đèn LED 5W hình trái tim chữ "NGỌC ƠI" sau phông sân khấu, dây cắm về ổ nối ở tủ điện, đầu phích ghi "CỦA BÉO – ĐỪNG RÚT". |
| `den-pin-ong-nam` | Đèn pin của ông Năm | Đèn pin sắt cũ khắc "Thanh tra phường – Năm – 1998", rớt dưới chân tường góc tủ điện. |
| `non-la-kim-tuyen` | Nón lá kim tuyến | Nón lá dán kim tuyến bạc, khoét hai lỗ nhìn, kèm bộ áo bà ba sân khấu, giấu trong khe sau tủ điện. Đồ diễn của Ca Sĩ Nón Lá. |
| `clip-livestream` | Clip livestream của bà Tư | 21:13: Béo hát trên sân khấu; anh Tùng ngồi bàn dàn loa; ghế cô Sáu trống; hàng ghế cuối có ông áo ngủ sọc, nón lá, lau nước mắt. 21:14: tối thui, anh Tùng la "Ai cúp điện vậy?!" tại bàn dàn; từ sau sân khấu có giọng cô Sáu thét "Trời đất ơi tui chưa rút mà!". |
| `clip-nam-ngoai` | Clip chung kết năm ngoái | Béo quay ở hàng ghế đầu năm ngoái: phút 3:12 bài "Bông Điên Điển", cô Thu chìa micro kim sa xuống cho khán giả hát theo, nhưng tiếng hát của cô vẫn vang đều đều trên loa, không hụt một chữ. |
| `tem-tu-lanh` | Tem tủ lạnh giải thưởng | Dưới tờ giấy "MỚI 100%" là tem bảo hành năm 2009. Hông tủ còn vết nam châm trái tim, chữ "Tùng ăn vụng là chết với má". Một cái tủ lạnh cũ sơn lại. |

**Điểm soi thêm (ghi manifest.hotspots):**
- `stage` · `livestream`: Điện thoại livestream của bà Tư (rect gợi ý [330,400,90,110])
- `stage` · `ban-giam-khao`: Bàn giám khảo (rect gợi ý [520,420,180,100])
- `fusebox` · `goc-sau-tu`: Góc khuất sau tủ (rect gợi ý [600,40,120,90])
- `backalley` · `cua-sau-nha-nam`: Cửa sau nhà ông Năm (rect gợi ý [40,40,140,140])
- `backalley` · `noi-che`: Nồi chè (rect gợi ý [520,330,150,140])

### Vụ 9: Hoàng Thượng Mất Tích (`assets/clues-meo-mat-tich.webp`)

| id | Tên | Mô tả (vẽ cái này) |
|---|---|---|
| `tin-chuoc` | Tin nhắn đòi chuộc | Từ nick Zalo "Băng Mèo Đen", tạo tối qua. 20:52: "Chị Na. Bơ đang trong tay tụi tui. Muốn Bơ về thì chuẩn bị 5 triệu. Ko đc báo công an 🐾🐾🐾". 20:57: "Tụi tui là băng đảng chuyên nghiệp. Tụi tui fải ra tay vì chị bắt Bơ quay clip quá trời 🐾🐾🐾". 20:59: "Nếu chị ko nghe lời thì" (đứt ngang). 6:31 sáng nay: "...thì tụi tui giữ Bơ thêm 1 tuần. Bơ ko fải cái máy quay clip 🐾🐾🐾". |
| `chen-day` | Chén pate còn đầy | Chén sứ khắc "BƠ", pate Hoàng Gia đổ lúc 7 giờ tối còn nguyên. Mấy tối nay Bơ đều bỏ bữa tối, sáng ra lại no căng. |
| `so-ban-le` | Sổ bán lẻ của shop | Dòng thứ Tư: "3 lon pate Hoàng Gia – khách: bé Tôm – trả 174 đồng xu 1.000đ". Loại pate duy nhất Bơ chịu ăn. |
| `don-hang-hong` | Đơn hàng của cô Hồng | Người nhận "H. Hồng", số máy của Hồng Hot Shop. 2 áo mèo "TEAM BƠ" size S, 1 móc khoá Bơ. Ghi chú gõ lúc 23:14: "Shop gói kín giùm nha, KHÔNG ghi tên shop bên ngoài. Giao sau 10 giờ tối giùm. Cảm ơn bà Na 💅😎". |
| `lich-quay` | Bảng lịch quay của Bơ | Thứ Hai tới Chủ Nhật, 7 giờ sáng tới 10 giờ đêm, mỗi ngày 10 clip, không có ngày nghỉ. Thứ Sáu: "Clip quảng cáo pate Hoàng Gia – 5 triệu". |
| `o-thong-gio` | Ô thông gió gãy nan | Ô thông gió cửa sân thượng nhà chị Na gãy hai nan, vừa một con mèo mập. Mép nan mắc lông xám, sợi cũ sợi mới. Sân thượng nối sang nhà bà Sáu bằng một ống nước. |
| `so-kham` | Sổ khám bệnh | Chiều qua 15:00: Bơ 5,2 kg, stress do làm việc quá sức, dặn giảm đèn quay. Ghi chú: "dụ bé vào lồng bằng pate, khám qua song lồng". Trang 15/11: Mướp, mèo ta, 2,8 kg, chủ là bé Tôm. Bên lề, chữ bút chì: "Bác sĩ ơi Mướp có fải bị tương tư ko ạ 🐾🐾🐾". |
| `long-xam-long` | Lông xám trong lồng nhốt | Lồng inox góc dưới ở phòng khám mắc đầy lông xám ngắn, dày, kiểu mèo Anh. Sàn lồng có vệt pate khô. |
| `hop-an-than` | Ngăn thuốc an thần trống | Ngăn trên cùng tủ thuốc, nhãn "AN THẦN", hộp đã biến mất. Bụi còn in hình cái hộp. |
| `tin-khoi` | Tin nhắn của bác sĩ Khôi | Gửi chị Na lúc 21:34 tối qua: "Chào chị Na. Tôi vừa đọc tin trong nhóm Hẻm 47. Chị bình tĩnh. Mèo Anh lông ngắn hay trốn chỗ cao và kín. Chị tìm kỹ trên cao. Trân trọng. 🐾 BS. Khôi". |
| `tin-den` | Tin nhắn của anh Đen | Gửi chị Na. 19:28: "c Na oi e toi r, c ra lay hang nha 👍". 22:05: "c oi Bo ve chua, e chay 2 vong hem ko thay 👍". |
| `long-thung-hang` | Lông xám trong thùng hàng | Thùng hàng sau xe anh Đen lót một tấm khăn, phủ đầy lông xám ngắn. Góc thùng có một cái gối nhỏ in hình vương miện. |
| `anh-giao-hang` | Ảnh xác nhận giao hàng | App giao hàng của shop, đơn giao lúc 19:30 tối qua. Ảnh anh Đen chụp: thùng pate đặt trước cửa trước, và ngồi chễm chệ trong thùng hàng sau xe là... Bơ, mặt khinh khỉnh. Anh Đen giơ hai ngón tay chữ V, cười tươi rói. |
| `binh-luan-tom` | Bình luận TikTok của Tôm | Nick "Tôm Siêu Nhân 2014", 482 bình luận dưới clip của Bơ trong tháng. "Bơ đẹp trai nhất hẻm 47 luôn ạ 🐾🐾🐾" (6:34). "Chị Na ơi Bơ ngáp kìa, Bơ fải ngủ chứ 🐾🐾🐾" (20:58 thứ Năm). "Clip thứ 10 rồi á, Bơ ko mệt hả 🐾🐾🐾" (20:59 thứ Sáu). Bình luận sớm nhất 6:30, trễ nhất 20:59. Không có cái nào từ 21:00 tới 6:30. |
| `noi-quy` | Nội quy máy tính bảng | Chữ bà Sáu: "Máy tính bảng của Tôm: lấy lúc 6 giờ 30 sáng, nộp lúc 9 giờ tối. Trễ 1 phút mất 1 ngày." Bên dưới chữ con nít: "Dạ con fải nộp đúng giờ ạ 🐾🐾🐾". |
| `chuong-to` | Chuồng mèo tự chế | Ghép từ ba thùng carton và hai rổ nhựa, to cỡ tủ lạnh mini, phủ chăn hoa. Hai cái chén. Dán giấy: "MƯỚP – CẤM MỞ – CẤM CHỤP HÌNH – CẤM QUAY CLIP". Bên trong có hai giọng meo: một nhỏ, một trầm. |
| `dau-chan-to` | Dấu chân trong bồn cát | Hai cỡ dấu chân mèo trên bồn cát sân thượng nhà Tôm. Một nhỏ, thon. Một to tròn, lún sâu, rộng gấp rưỡi: của một con mèo nặng gần gấp đôi. |
| `lon-pate` | Ba lon pate rỗng | Ba lon pate Hoàng Gia nắp vàng, liếm sạch, nắp ghi bút lông "T4", "T5", "T6". Nằm cạnh chuồng mèo trên sân thượng nhà Tôm. |
| `vet-cao-ong-nuoc` | Vết cào trên ống nước | Ống nước nối sân thượng nhà chị Na với nhà bà Sáu chi chít vết cào: vết mới còn trắng, vết cũ bạc màu đã hai tuần. Khớp nối mắc lông xám ngắn, dày. |
| `ao-choang-bmd` | Áo choàng "BMĐ" | Áo choàng đen may từ bao gối cũ, sơn trắng ba chữ "BMĐ", sơn còn mới. Kèm mặt nạ bìa cứng hình đầu mèo đen. Phơi trên sân thượng nhà Tôm. |

**Chân dung thêm vào `portraits-meo-mat-tich.webp`:** `basau` (Bà Sáu: Bà nội của Tôm. 70 tuổi, cầm cây chổi lông gà như cầm lệnh bài. Nội quy nhà bà dán khắp cửa.)

**Điểm soi thêm (ghi manifest.hotspots):**
- `shop` · `lich-quay`: Bảng lịch quay (rect gợi ý [470,60,170,130])
- `shop` · `cau-thang`: Cầu thang sân thượng (rect gợi ý [790,390,160,140])
- `vetclinic` · `poster-meo`: Poster chăm mèo (rect gợi ý [340,50,170,170])
- `rooftop2` · `noi-quy`: Nội quy của bà nội (rect gợi ý [50,230,130,140])

### Vụ 10: Phong Bì Tất Niên (`assets/clues-tat-nien.webp`)

| id | Tên | Mô tả (vẽ cái này) |
|---|---|---|
| `so-do-ghe` | Sơ đồ chỗ ngồi | Chị Vy xếp, dán cửa sảnh. Bàn sếp: ghế 1 Đạt, ghế 2 Vy, ghế 3 Khoa, ghế 4 ông Kim, ghế 5 thám tử, ghế 6 Tèo. Bàn team: ghế 1 (sát cây mai, gần cửa hành lang) là Phong, ghế 2 là Hằng, ghế 3–8 là sáu bạn mới. |
| `the-ten` | Thẻ tên bị đổi | Bàn team: thẻ ghế 1 (sát cây mai) ghi "HẰNG", ghế 2 ghi "PHONG", ngược với sơ đồ. Mép thẻ có vết bút xoá, chữ cũ in hằn. Có người đã đổi chỗ ngồi. |
| `hop-salad-thieu-nia` | Hộp salad thiếu nĩa | Trước ghế 1 bàn team: hộp salad nắp in "Ngày 1/30", hộp quen của Hằng. Ngăn đựng nĩa trống trơn. |
| `thung-nong` | Thùng bốc thăm nông bất thường | Thùng gỗ đỏ chữ "LỘC", sếp Đạt tự đem từ công ty. Bên ngoài cao nửa mét, mà phiếu thăm bên trong nằm rất nông, như đáy chỉ sâu hai gang tay. |
| `log-ket` | Nhật ký két sắt | 18:32 ĐÓNG, cài mã mới. 20:06 MỞ bằng mã đúng. 20:07 ĐÓNG. 20:31 MỞ (anh Lâm, phát hiện trống). Không cạy, không phá. |
| `camera-mai` | Camera hành lang bị che | Từ 19:46, ô camera hành lang chỉ còn hoa mai. Cây mai bị dời tới trước cửa hành lang, che kín ống kính. |
| `video-phat-bieu` | Video sếp Đạt phát biểu | Camera sân khấu, 19:00. Sếp Đạt cầm micro: "Mã két tiền thưởng là sinh nhật sếp: một-hai-không-hai! Ai cũng biết, ai cũng tin nhau!". Cả sảnh vỗ tay. |
| `so-dat-ban` | Sổ đặt bàn | Người đặt: Đạt. Ghi chú chữ sếp: "Xếp cháu Khoa ngồi cạnh tôi. Phong bì đặc biệt (dày nhất, đỏ nhất) để trên cùng, tôi tự bốc sau cùng." |
| `nhap-phat-bieu` | Bản nháp bài phát biểu | Vò nát trong thùng rác bếp. "Ý 3: Nói mã két = sinh nhật sếp → nhân viên thấy sếp minh bạch." "Ý 5: Giải đặc biệt năm nay, ai hên người đó (nháy mắt Khoa)." |
| `banh-kem-phong` | Bánh kem trà sữa | Trên xe đẩy món. Chữ: "Cảm ơn chị Vy. Nợ trà sữa đã trả xong (4/4)." Phiếu: khách bàn 2 áo hoodie xám, tự viết chữ trong bếp từ 20:03 tới 20:14, dặn đừng nói ai đặt. |
| `order-goi` | Phiếu order dĩa gỏi | Bàn 2, ghế 1: gỏi ngó sen "không đường, không dầu, không cảm xúc". Đặt lúc 19:55, khách dặn "20:06 MỚI MANG RA". Dĩa gỏi được đặt trước, hẹn giờ mang ra. |
| `anh-checkin` | Ảnh check-in 18:55 | Khoa chụp cả công ty lúc 18:55, gắn thẻ từng người theo chỗ. Bàn team: ghế sát cây mai gắn thẻ "Hằng Kế Toán", ghế kế bên "Phong IT". Bàn sếp: Đạt, Vy, Khoa sát sếp. |
| `anh-nang-ly` | Ảnh nâng ly 20:02 | Sếp Đạt đăng Facebook 20:02: "Nâng ly cùng anh em bàn team 🍻". Sếp đứng giữa, cốc Best Boss đựng rượu nếp. Ghế sát cây mai: Hằng, áo dài đỏ, quàng một cái khăn lông vũ trắng, tay cầm ly nước detox. Ghế kế bên: Phong. |
| `clip-khoa` | Clip TikTok của Khoa | Quay trước cây mai từ 20:03 tới 20:15. Góc trái khung hình là cửa hành lang. 20:03: người áo hoodie xám đi vào. 20:04: người áo dài đỏ quàng khăn lông trắng lướt vào, quay lưng. 20:06: anh Lâm nhảy vào khung hình xin chụp chung. 20:12: người quàng khăn lông trắng lướt ra. 20:14: người áo hoodie đi ra. |
| `selfie-vy` | Selfie của chị Vy 20:10 | Chị Vy đăng lúc 20:10: "#lanhmuonxiu ai mượn khăn trả chị 🥶". Chị Vy ngồi ghế 2 bàn sếp, áo dài đỏ, vai trần, không khăn. Phía sau: bàn team, ghế sát cây mai trống trơn, dĩa gỏi ngó sen còn nguyên chưa ai đụng đũa. Ghế bên cạnh bị mặt chị Vy che mất. |
| `buoc-chan` | Thành tích bước chân của Hằng | App đồng hồ của Hằng tự đăng vào group chat "Cà Khịa Fam" lúc 20:15: "🎉 Hằng đã đạt 8.000 bước lúc 20:09!". Biểu đồ: 19:00–20:03 gần như đứng yên, 20:04–20:12 vọt lên 900 bước, sau đó đứng yên. |
| `lich-su-giai` | Lịch sử giải đặc biệt | Theo chị Vy: năm kia giải đặc biệt thuộc về "Nguyễn Đăng Khoa – khách mời". Năm ngoái: "Nguyễn Đăng Khoa – cộng tác viên", trúng xe máy. Cả hai lần sếp Đạt tự tay bốc. |
| `day-doi` | Thùng bốc thăm hai đáy | Xoay núm gỗ dưới đáy, một ngăn bí mật trượt ra: hai mươi phiếu thăm hồng nhạt gấp sẵn, tờ nào cũng ghi "Nguyễn Đăng Khoa". Phiếu thường màu trắng nằm ở lớp trên. Một cái thùng hai đáy. |
| `tui-phong-bi` | Túi phong bì trong tủ đông | Ngăn dưới cùng tủ đông bếp: túi zip dán "SALAD – BÀN 2 – ĐỪNG ĐỤNG". Bên trong: mười hai phong bì đỏ còn niêm phong, và một nĩa nhựa hồng cán in "Ngày 1/30". |

**Điểm soi thêm (ghi manifest.hotspots):**
- `banquet` · `so-do-cho-ngoi`: Sơ đồ chỗ ngồi (rect gợi ý [20,60,120,170])
- `banquet` · `day-thung`: Đáy thùng bốc thăm (rect gợi ý [530,330,100,40])
- `office2` · `bang-nhan-vien`: Bảng nhân viên (rect gợi ý [580,40,180,130])
- `kitchen3` · `ngan-duoi-tu-dong`: Ngăn dưới tủ đông (rect gợi ý [700,340,200,80])

### Vụ 11: Con Ma Nhà Số 13 (`assets/clues-ma-nha-13.webp`)

| id | Tên | Mô tả (vẽ cái này) |
|---|---|---|
| `bong-den-moi` | Bóng đèn mới, dây trắng mới | Bóng đèn còn dán tem giá 35.000đ, nối bằng một sợi dây trắng mới chạy lên lỗ trần, lên gác xép. Dây điện cũ của nhà đã đứt. |
| `cong-to-cat` | Công tơ niêm phong | Cầu dao ở nấc OFF, gạt lên cũng không có gì. Công tơ dán niêm phong ‘Ngưng cấp điện – 03/2023’. Nhà số 13 cắt điện từ ngoài cột. |
| `hien-tuong-23h` | Biên bản canh ma | Cầu dao vẫn tắt. 23h đúng: đèn chớp, tường khóc. Tiếng khóc 40 giây lặp lại y chang. 23h13 tắt cùng lúc. Đạt Săn Ma đã đứng chờ quay từ 22h58. |
| `ong-tuong` | Ống tôn trong tường | Ống tôn thoát nước mưa đời cũ bị xây lấp trong bức tường ẩm, thẳng đứng, đầu trên ở gác xép. Tiếng trên gác thả xuống ống thì cả bức tường vọng ra. |
| `ve-xe-onghai` | Vé xe dưới gối ghế đưa | Vé xe khách ‘Bến Tre – Sài Gòn, 21h00, ngày 14/10’, giấy còn mới, nhét dưới gối ghế đưa mây. |
| `o-meo-con` | Ổ mèo con dưới gầm ghế | Thùng các-tông lót khăn, một mèo mẹ với ba mèo con. Chén nhựa ghi bút lông ‘TI’. Mèo con kêu ban ngày nghe như con nít khóc. |
| `vet-bac-ha-guong` | Vết xanh trên gương | Giọt khô màu xanh lá, dính tay, thơm siro bạc hà, lấm tấm trên tấm gương nứt, toàn ở ngang tầm một mét. |
| `nhang-tu-se` | Nhang trầm se tay trên bàn thờ | Ba bốn chục chân nhang trầm se tay, chân sơn đỏ, cây mới nhất cháy tối nay. Kèm lời vọng cổ ‘Tình Anh Bán Chiếu’ chép tay: ‘Ca cho bà Hai nghe, tối nào cũng 21h’. |
| `day-dien-moi` | Dây điện mới trên gác | Dây trắng đóng đinh kẹp cẩn thận theo xà gỗ. Một nhánh xuống bóng đèn, một nhánh ra sau tấm ván góc tường. Cả hai cắm chung một ổ cắm. |
| `o-cam-hen-gio` | Ổ cắm hẹn giờ | Ổ cắm hẹn giờ loại cơ. Chốt bật 23:00, chốt cuối bẻ cong để ngắt lúc 23:13. Công tắc AUTO / ON. |
| `ac-quy-kich-dien` | Ắc quy và kích điện trong rương | Bình ắc quy 12V nối kích điện ra ổ hẹn giờ, chạy được ba bốn đêm thì phải sạc. Tem: ‘Điện máy Bảy Phát – giao 02/10 – tới Nhà số 13 hẻm 47 – SĐT người nhận 0909 456 SĐT đuôi 313’. |
| `loa-qua-tang` | Loa giấu trên miệng ống tôn | Loa bluetooth chống nước, cắm ổ hẹn giờ, áp ngay miệng ống tôn. Thẻ nhớ có một file ‘khoc_ban3_ronhon.mp3’ dài 40 giây. Đáy dán tem ‘Quà tặng khách hàng – An Cư Land – Lô 2026’. |
| `chen-to-roi` | Xấp tờ rơi chèn cửa sổ gác | Cửa sổ gác được chèn mở bằng xấp tờ rơi mới in ‘An Cư Land – thu mua nhà nhanh – liên hệ anh Quân’. Gió lùa giữ cho kích điện khỏi nóng. |
| `tai-hien-ma` | Thí nghiệm: gọi ma bằng một ngón tay | Cầu dao vẫn tắt, gạt ổ hẹn giờ sang ON: đèn chớp, tường khóc y hệt lúc 23h. Gạt về AUTO: tắt hết. Ma chạy bằng ắc quy và hẹn giờ, không cần ai có mặt. |
| `gio-lua-ghe` | Thí nghiệm: ghế đưa và cửa sổ | Rút xấp tờ rơi, đóng cửa sổ gác: ghế đưa đứng im. Mở ra: ghế đưa lại. Ghế tự đưa là do gió lùa từ cửa sổ gác xuống lỗ cầu thang. |
| `bang-rao-ban` | Bảng rao bán nhà cuối hẻm | Bốn căn số 9, 11, 13, 15 giá ‘sốc’ 1,9 tỷ. Nhà 9 và 15 đã bán, nhà 11 sắp ký. ‘Liên hệ anh Quân: 0909 456 SĐT đuôi 313’. |
| `ban-do-khoanh` | Bản đồ quy hoạch khoanh đỏ | Dự thảo mở rộng đường, công bố dự kiến tháng 12: cuối hẻm 47 thành mặt tiền. Nhà 9, 11, 13, 15 khoanh đỏ: ‘Gom đủ 4 căn trước tháng 12. Mua dưới 2 tỷ. Bán lại 8–10 tỷ’. |
| `hop-dong-dat-coc` | Hợp đồng đặt cọc nhà cuối hẻm | Nhà 9 (10/10) và 15 (20/10) đã ký, nhà 11 chờ thứ Hai. Bên mua: Công ty TNHH Lạc Nghiệp, giám đốc Trần Minh Quân. |
| `lich-hen-quan` | Sổ lịch của anh Quân | Từ 06/10, mỗi thứ Hai và thứ Năm: ‘6h sáng: dẫn khách xem nhà 13’. Ô ngày 02/10: ‘Điện máy Bảy Phát – lấy hàng – giao thẳng nhà 13’. |
| `thung-qua-tang` | Thùng loa quà tặng An Cư Land | Thùng mười hai ô, còn mười một loa, trống một ô. Loa nào cũng dán tem bạc ‘Quà tặng khách hàng – An Cư Land – Lô 2026’, y hệt loa trên gác nhà 13. |
| `chia-khoa-13` | Chìa khoá nhà 13 ở văn phòng | Trên bảng chìa khoá của An Cư Land: thẻ ‘NHÀ 13 – bản chính’. Chìa dính vệt bột trắng xanh của cọc bình ắc quy. |
| `clip-san-ma` | Clip đầu tiên của Săn Ma TV | Clip ‘ĐÊM ĐẦU TIÊN NHÀ 13 CÓ MA!!!’ đăng lúc 23h41 ngày 05/10, quay từ 22h55, máy đã dựng sẵn chĩa vô bóng đèn. |
| `chuyen-khoan-dat` | Chuyển khoản cho Săn Ma TV | Ứng dụng ngân hàng của Đạt: ‘04/10 – Nhận 5.000.000đ từ CTY TNHH LAC NGHIEP – ND: hop tac truyen thong nha 13 – quay dung 23h’. |

**Chân dung thêm vào `portraits-ma-nha-13.webp`:** `chitho` (Chị Thơ: Bán chè, nhà số 11 (sát vách nhà 13). Bán chè ba màu đầu hẻm mười năm. Hẹn ký bán nhà sáng thứ Hai cho một công ty anh Quân giới thiệu.)

**Điểm soi thêm (ghi manifest.hotspots):**
- `hauntedhouse` · `hop-cau-dao`: Hộp cầu dao (rect gợi ý [30,110,90,120])
- `hauntedhouse` · `cho-nua-dem`: Ngồi canh tới 23h (rect gợi ý [380,420,200,100])
- `attic` · `thi-nghiem-hen-gio`: Thí nghiệm: gạt ổ hẹn giờ sang ON (rect gợi ý [540,380,140,60])
- `attic` · `thi-nghiem-cua-so`: Thí nghiệm: đóng cửa sổ gác (rect gợi ý [700,190,160,50])
- `realestate` · `thung-qua-tang`: Thùng quà tặng (rect gợi ý [40,360,180,140])
- `realestate` · `moc-chia`: Móc chìa khoá (rect gợi ý [820,300,110,130])

### Vụ 12: Thám Tử Giả Mạo (`assets/clues-tham-tu-gia.webp`)

| id | Tên | Mô tả (vẽ cái này) |
|---|---|---|
| `ho-so-mat` | Tủ hồ sơ mất sáu bìa | Ngăn hai tủ sắt mất sáu bìa hồ sơ vụ 1–6. Ổ khoá tủ không trầy, chìa tủ cắm sẵn trên ổ. Ngăn tiền lẻ không bị đụng. |
| `cua-khong-pha` | Cửa kính không bị phá | Không vết cạy. Trong lỗ khoá có mạt đồng mới, dấu của một chìa 47B mới in còn ba-via, tra vô lần đầu. |
| `dau-son-kinh` | Vết son trên mặt ngoài cửa kính | Mặt NGOÀI kính, ngang tầm mắt: vết son đỏ đậm hình đôi môi, vệt trán và chóp mũi. Người áp mặt nhìn trộm từ ngoài vô. |
| `giay-nho-teo` | Giấy nhớ của Tèo | Dán mép màn hình, chữ Tèo: ‘Hồ sơ vụ 1–6: tủ sắt ngăn 2. Chìa tủ: trong ống bút con mèo. ĐỪNG QUÊN!!!’ |
| `lich-su-may-tinh` | Nhật ký máy tính văn phòng | Phiên 1: 22h03–22h58, tài khoản ‘CucXinhDep1958’ xem phim Hàn tập 13–14. Phiên 2: 23h21–23h33, cắm USB ‘TTP_BACKUP’, chép thư mục ‘Ảnh hiện trường vụ 1–6’. |
| `soi-chi-be` | Sợi chỉ be trong móng mèo | Mèo văn phòng Kính Lúp có mấy sợi chỉ màu be, vải dày dệt chéo, kẹt trong móng chân trước. Nó đã cào kẻ đột nhập. |
| `manh-vai-be` | Mảnh vạt măng tô dưới gầm tủ | Mảnh vải be dệt chéo hình tam giác, một cạnh có đường may viền, dính lông mèo mướp. Vạt măng tô bị móng mèo xé. |
| `bo-dem-may` | Bộ đếm máy cắt chìa | Phôi 47B, thứ Hai: 2 lần cắt, lúc 17h10 và 19h50 thứ Hai. Ổ cửa kính văn phòng thám tử là loại 47B. |
| `the-treo-chia` | Thẻ treo chìa ở sạp khoá | Chữ anh Bảo: ‘TÈO – VP THÁM TỬ – chìa gốc, in 1 – 8h tối lấy’. Treo mép sạp, ai ngồi ghế chờ cũng đọc được. |
| `so-in-khoa` | Sổ in khoá thứ Hai | ‘17h05 – Tèo, VP thám tử – in 1 chìa 47B – để chìa gốc, 20h lấy’. Dòng bị tẩy, soi nghiêng còn hằn: ‘19h50 thứ Hai – người bên VP thám tử – in thêm 1 chìa 47B theo mẫu – măng tô, kính râm – bo 200k’. |
| `danh-thiep-pro` | Danh thiếp kẹt ghế chờ | Danh thiếp nhũ vàng ‘HIẾU – THÁM TỬ PRO – Phá án 60 giây’, kẹt khe ghế nhựa chờ ở sạp khoá, dính trà sữa khô. Anh Bảo: khách thứ Hai ngồi đó gần tiếng đồng hồ. |
| `bang-ghim-gia` | Bảng ghim ‘phá lại’ sáu vụ | Sáu vụ của văn phòng bị ‘phá lại’: Tuấn, cô Mười, Hằng, ông Năm, người yêu cũ, Bé Ti. Toàn người gây nhiễu. Ảnh ghim có dấu ‘Thám Tử Hẻm – Lưu’ và con gà Tèo vẽ. |
| `live-lap` | Bản lưu buổi live đêm qua | Live ‘22h tới 1h’ của Pro: từ 23h05 tới 23h40 là một đoạn 3 phút phát lặp mười hai lần, cùng câu ‘để Pro suy nghĩ’, cùng con thiêu thân. 23h40 Pro thật quay lại, thở dốc, măng tô xộc xệch. |
| `mang-to-rach` | Măng tô rách trong tủ đồ Pro | Một trong ba cái măng tô màu be của Pro rách mất mảnh tam giác ở vạt sau, chỗ rách bám lông mèo mướp. |
| `chia-47b-moi` | Chìa 47B trong túi măng tô | Chìa 47B mới tinh, răng còn ba-via sắc, nằm trong túi cái măng tô bị rách. |
| `ho-so-goc` | Sáu bìa hồ sơ ở studio | Sáu bìa hồ sơ gáy đóng dấu ‘THÁM TỬ HẺM – LƯU’, vệt thịt kho, vết gà mổ, kem bánh đám hỏi. Hồ sơ gốc của văn phòng, nằm trên bàn dựng clip của Pro. |
| `vlog-sap-khoa` | Vlog thứ Hai của Pro | ‘T2_17h06_di_in_chia_studio’: Pro ngồi ghế chờ sạp anh Bảo. Tiếng Tèo: ‘chìa văn phòng thám tử… em để chìa gốc đây, 8 giờ tối em lấy’. Pro thì thầm: ‘Văn phòng thám tử. Thú vị đây’. Pro nghe lén được. |
| `anh-ly-23h17` | Ảnh chị Ly chụp lúc 23h17 | Chụp từ xe đậu bên kia đường lúc 23h17: một người mặc măng tô, đeo kính râm giữa đêm, tra chìa mở cửa kính văn phòng. Điện thoại kẹp ring light mini trên tay. |
| `bai-boi-nho` | Ảnh hồ sơ trên nick ‘Sự Thật Hẻm 47’ | Nick lập lúc 00h47, đăng ảnh trang hồ sơ từ 00h52 đêm qua. Bìa nhựa trong ảnh nào cũng in một vòng sáng tròn trắng phản chiếu, kiểu đèn ring light. |
| `binh-luan-teo` | Bình luận của Tèo đêm qua | Từ 23h12 tới 23h38, Tèo ở nhà bình luận vô live của Pro: ‘anh Pro ơi sao đứng im vậy’, ‘câu này anh nói lần thứ 5 rồi’, ‘lag hả anh’, ‘con thiêu thân lại đậu kìa’. Định vị: nhà Tèo. |

**Điểm soi thêm (ghi manifest.hotspots):**
- `office-night` · `gam-tu`: Gầm tủ hồ sơ (rect gợi ý [60,440,200,70])
- `office-night` · `khung-anh`: Sáu khung ảnh vụ án (rect gợi ý [280,30,100,220])
- `locksmith` · `hu-chia-cu`: Hũ chìa khoá cũ (rect gợi ý [780,300,120,140])
- `locksmith` · `bang-gia-sap`: Bảng giá (rect gợi ý [780,40,140,160])
- `studio` · `laptop-dung-clip`: Laptop dựng clip (rect gợi ý [820,320,120,110])
