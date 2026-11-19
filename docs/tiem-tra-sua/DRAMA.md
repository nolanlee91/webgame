# Drama Engine

Mỗi sự kiện có ID, điều kiện, nhóm, độ ưu tiên, lựa chọn ghi hậu quả ngay và cờ theo dõi cho ca sau. Dùng các cờ theo khách hoặc theo quán. Tối đa một sự kiện chọn trong ca và một sau ca, kèm thời gian nghỉ ít nhất hai ca cho cùng một tình huống. Sự cố do người chơi gây ra ưu tiên hơn biến cố hiếm. Không chen vào giữa giao dịch đang xác nhận. Đồng hồ ca dừng khi hội thoại mở. Bảng dưới dùng k = 1.000 đồng ảo và DD = danh tiếng.

Giữ ít nhất một tình huống tích cực hoặc đời thường trong mỗi nhóm ba sự kiện. Chỉ kích hoạt lựa chọn nếu đủ tài nguyên và luôn có phương án không cần tiền. Áp dụng hậu quả một lần, có lịch sử nguyên nhân và kết quả trong Sổ. Các cờ chờ phản hồi hết hạn sau 3 ca nếu dòng sự kiện không ghi mốc khác.

| ID · nhóm | Kích hoạt và thoại mẫu | Lựa chọn, hậu quả và nhánh tiếp |
|---|---|---|
| C01 · Khách | Đơn thực sự sai, khách chấm 1 sao. “Chị đặt ô long. Ly này rõ ràng là… một trải nghiệm khác.” | **Làm lại** tốn một ly, mở C05 nếu giao đúng. **Xin lỗi và ghi chú món** giữ tiền hiện tại, tạo nhiệm vụ khắc phục cho lần sau. |
| C02 · Khách | Giao đúng 0% đường, khách mới vừa uống. “Em gọi 0% đường… sao không ngọt chị?” | **Giải thích công thức** giữ nguyên ly, +1 DD nếu khách hiểu. **Cho thử trà trái cây** tốn một phần trái cây, lưu vị ưa thích. Hai nhánh đều có thể dẫn tới C05. |
| C03 · Khách | Phiếu đã xác nhận và trùng ly giao, khách nhớ khác. “Em bấm ít đá hay em nghĩ em bấm ít đá ta?” | **Đối chiếu phiếu** giữ chi phí, khách chịu xem lại đơn. **Làm lại ít đá** ghi hao hụt một ly, giữ khách trong lượt sau. Gắn trạng thái đối chiếu cho S05 nếu khách có đăng bài. |
| C04 · Khách | Cấp 8+, có khách VIP, quầy có nhiều đơn. “Ly em phải đúng vị, nhưng messenger sếp em cũng đang kêu.” | **Ưu tiên VIP** tăng cơ hội đạt 5 sao của VIP, đơn kế tiếp mất 8 giây kiên nhẫn. **Giữ thứ tự** tặng thông báo thời gian, VIP có thể đặt trước trong ca sau. |
| C05 · Khách | Hai lượt 4 sao hoặc cờ khắc phục C01/C02. “Chị còn nhớ em ít đá không? Em quên mà chị nhớ là được.” | **Gợi lại vị đã lưu** mở đơn quen thường xuyên nếu làm đúng. **Mời món mới** tăng khả năng bán món cao cấp, giữ vị cũ nếu khách từ chối. |
| S01 · Mạng | DD ≥ 60, quầy có ít nhất hai món. “Cho mình quay lúc chị đóng nắp, tiếng ‘cạch’ này nghe ghiền.” | **Cho quay món chủ lực** giao đúng mở S03. **Xin quay góc quầy sau ca** không ảnh hưởng nhịp, nếu quầy sạch mở S04. |
| S02 · Mạng | Có review sai công thức và một phiếu đối chiếu. “Ảnh chụp ghi ô long, dòng mô tả lại bảo matcha.” | **Đính chính bằng phiếu** giảm hiểu nhầm, mở S05. **Mời thử lại** cam kết ly sửa ở ca sau, tốn nguyên liệu khi làm và +2 DD nếu hoàn tất. |
| S03 · Mạng | S01 thành công. “Chị ơi clip đóng nắp có người bật lại mười lần.” | **Nhận đặt theo khung giờ** thêm 2 khách ca tới. **Giữ số đơn hiện tại** nhận một lượt giới thiệu khách quen, giữ nhịp ổn định. |
| S04 · Mạng | Có trang trí đèn hoặc khách có một ly đẹp. “Em chụp ly một tấm. Ly lên hình đẹp hơn em.” | **Cho chụp ở góc quán** ghi ảnh mẫu cho Nhật ký, +1 DD sau ca. **Mời khách ghi món đã gọi** tăng nhu cầu món đó ca sau. |
| S05 · Mạng | Có bài từ S02 hoặc đơn tranh cãi C03. “Tiệm trả lời gọn giúp em, cả nhóm đang theo dõi.” | **Phản hồi và đính chính** nếu có phiếu thì +1 DD, còn thiếu phiếu tạo việc rà soát. **Đăng cách khắc phục** mở cam kết ca sau, hoàn tất +2 DD, bỏ qua −1 DD. |
| O01 · Vận hành | Đã nhập hàng và có hàng thay thế. Shipper: “Em đọc đúng số nhà, mỗi cái đường hơi sai.” | **Đổi lô** chờ 15 giây, dùng hàng cũ. **Nhận phần dùng được** tăng loại hàng sẵn có, phần sửa nhà cung cấp chuyển ca sau. Có thể dẫn O05. |
| O02 · Vận hành | Đang cao điểm, trân châu còn 0 và có đơn yêu cầu. “Hết trân châu thiệt hả chị? Em tưởng tiệm lấy tên em đặt mà.” | **Báo chờ mẻ mới** giữ đơn, khách còn ít thời gian có thể bỏ. **Mời đổi thạch** dùng thạch đã mở và giảm 2k; nếu thiếu thạch thì xin đổi sang món không topping với cùng mức giảm. Ghi dự báo cho ca tới. |
| O03 · Vận hành | Đóng nắp liên tục, máy chưa bảo dưỡng. “Máy kêu cạch. Rồi nó kêu lại lần nữa dù em chưa bấm.” | **Đóng tay** thêm 3 giây mỗi ly trong ca. **Gọi sửa** 18k và tạm ngừng máy 12 giây. Tạo nhắc bảo dưỡng ca tới. |
| O04 · Vận hành | Cấp 6+, kiểm tra lúc quán đang mở. “Đèn tắt rồi, mà đèn soi menu của khách bật lên hết.” | **Chạy menu nguội** thu hẹp món, ưu tiên đơn pha tay. **Tạm nhận đơn mới sau 12 giây** giữ đơn cũ và hàng có sẵn. Có thể mở lời khen S04. |
| O05 · Vận hành | Có đơn hai ly và đang dùng hỗ trợ quầy hoặc đã mở hướng dẫn nhân viên. “Hai ly đều đúng. Chỉ có hai tên bị đổi chỗ.” | **Kiểm phiếu và đổi nhãn** thêm 4 giây, tránh giao sai. **Tạm rút hỗ trợ** giảm công suất một lượt, tạo mục tiêu hướng dẫn lại ca sau. |
| X01 · Đặc biệt | Cấp 6+, đầu ca, có hồ sơ kho. “Cho cô xem lúc mở mẻ. Cái này nhìn sạch, giấy ghi còn sạch hơn.” | **Trình sổ** đạt nếu đã ghi lô, +2 DD. **Tự kiểm và bổ sung** đóng bếp 10 giây, có lịch kiểm lại sau hai ca. |
| X02 · Đặc biệt | Có đồ thất lạc X03 và hai khách cùng nhận. “Bên chú hỏi vài chi tiết, ai nhớ trong túi có gì thì đứng một bên giùm.” | **Giao đồ cho người phụ trách** đóng nhánh an toàn. **Mời đối chiếu mô tả riêng tư** chậm quầy 8 giây, nếu khớp mở C05. Dùng nhân vật và địa danh hư cấu. |
| X03 · Đặc biệt | Một khách vừa rời, ghế có đồ bỏ lại. “Cái túi này ngồi lâu hơn cả người đặt trước.” | **Cất và gọi khách bằng phiếu** mở C05 nếu đúng người. **Ghi vào sổ thất lạc** có thể mở X02 nếu hai khách cùng nhận. |
| X04 · Đặc biệt | Giờ cao điểm, từ ngày 3, hàng chờ chưa đầy. “Tụi em đi ngang, thấy có chỗ trống nên rủ cả phòng.” | **Nhận đơn nhóm** tối đa ba ly, hoa hồng +8k nếu giao đúng giờ. **Mời đặt khung giờ sau** giảm áp lực quầy, tạo một đơn đầu ca sau. |
| X05 · Đặc biệt | DD ≥ 75, từng thấy S03 hoặc S04. “Em xin ngồi góc kia. Hôm nay em nổi tiếng với đúng một người là em.” | **Cho khách dùng như mọi người** mở C05 và một dòng nhật ký vui. **Xin phép chụp bảng món cùng ly** nếu khách đồng ý mở S04 và tăng khách đi ngang ngày sau. |

## Mở rộng M3 (data/events-m3.js)

| Nhóm | Sự kiện | Kích hoạt |
|---|---|---|
| Đơn nhóm nhiều ly | F01 cả nhà Cô Tư 3 ly · F02 ly tới trễ · F03 ba ly năm sao ⇒ F04 đặt mỗi thứ Hai · F05 một ly lệch | `lastServe.outcome` (late / perfect3 / oneWrong) ngay sau khi giao |
| Bàn pha đôi / ba | P01 rót nhầm đồng loạt · P02 hai ly giống nhau hai người · P03 (giữa hai ca) mơ thấy ly · P04 ba ly ba người | `owns` bàn pha đôi / ba chỗ |
| Vựa sỉ Anh Út | U01 trà rẻ mà cũ (gọi Anh Út ⇒ chuyện con gà) · U02 Anh Út kể chuyện · U03 giao trễ (hẹn từ U01 / U02) · U04 Dì Ba giảm giá ⇒ U06 Anh Út phản công / hoà giải · U05 quà cảm ơn | cờ `si-mua` khi nhập vựa sỉ |
| Quảng bá | Q01–Q03 tờ rơi · Q04–Q06 check-in · Q07–Q09 livestream; mỗi loại: lên mạng / phản tác dụng / khách ăn ké | cờ `promo-<loại>` chỉ trong ca hôm đó, chọn xong thì tắt |
| Ký gửi | B01 Dì Ba ghé trong ca · B02 ngày trả đủ · B03 mẹ hỏi thăm khi lỗ và hụt tiền | cờ `ky-gui`, `ky-gui-xong`; `sum.profitMax` + `maxMoney` |

## Bổ sung (hết hàng giữa ca, Milestone 5)

| ID · nhóm | Kích hoạt | Lựa chọn |
|---|---|---|
| H01 · Đời thường | Hẹn từ lựa chọn "Mượn đỡ chị Lụa" khi hết hàng | Trả đủ + hai ly (−20k, +1 DD) · Trả bằng lời giới thiệu (ca sau −1 khách) · Hỏi trả góp bằng nụ cười (hên xui) |
| H02 · Đời thường | Cờ `dong-som` (đóng cửa sớm vì hết hàng) | Nhờ mẹ viết danh sách kiểm kho · Nói mẹ yên tâm · Nhận bịch ly mẹ mua (+10 ly) |
| H03 · Mạng | Cờ `het-hang` | Nhận lỗi · Biến thành trend "đi tìm ly" (hên xui) · Kệ (review 3 sao) |
| FA1 · Đặc biệt | Ca hội chợ, MC mời lên sân khấu | Lên sân khấu · Nhờ MC đọc · Vẫy tay |
| FA2 · Đặc biệt | Ca hội chợ, gian chị Lụa bên cạnh | Thi đông khách (hên xui) · Gộp "phố trà sữa" · Cười trừ |
| FA3 · Đặc biệt | Sau ca hội chợ | Nhận chỗ gần cổng · Tài trợ nước · Xin nghỉ |
| CH1 · Đặc biệt | Ca thử thách, reviewer xin livestream chấm | Livestream (hên xui) · Hẹn quay sau ca · Từ chối |
| CH2 · Đời thường | Đạt thử thách, mẹ đọc trên nhóm khu phố | Gửi mẹ hình huy hiệu · Mời mẹ ghé · Dặn mẹ đừng khoe |
| DS1 · Vận hành | Có máy rót hai vòi, máy phun trà lên trần | Vặn van · Gọi là "trình diễn" (hên xui) |
| DS2 · Mạng | Có máy rót hai vòi, khách xin quay | Rót chậm cho quay · Rót bình thường |
