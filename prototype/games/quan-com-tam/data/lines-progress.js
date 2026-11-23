// A: câu thoại + review riêng của cơ chế M3 (tiến trình + kinh tế). Chọn qua freshLine (core/text.js), không emoji.
// Biến: {self} {call} {Call} (xưng hô khách), {name}, {n}, {dish}, {amount}, {days}, {plates}, {item}.
// Mỗi kết quả có 8–12 câu review: ghi sổ (còn nợ / đã trả), mâm cơm (đúng giờ / trễ), ca trưa, mang về, cơm chiên, phụ bàn.

// ---------- ghi sổ ----------
export const GHISO_ASK = [
  "{Call} ơi, ghi sổ giùm {self} nghen, mai lãnh lương {self} ghé trả.",
  "Bữa nay quên ví rồi {call}, ghi sổ cho {self} nha.",
  "Ghi sổ nghen {call}, cuối tuần {self} trả một lượt.",
  "{Call} ghi vô cuốn sổ giùm {self}, tháng này kẹt chút xíu.",
  "Cho {self} thiếu bữa nay nha {call}, mai mốt {self} trả đủ.",
  "Ghi sổ như mọi khi nghen {call}.",
  "{Call} ơi, hôm nay {self} ăn chịu được hông? Mai {self} trả liền.",
  "Ví {self} để quên ở công trình rồi, ghi sổ giùm nha {call}.",
  "Lương chưa về {call} ơi, cho {self} ghi sổ một bữa.",
  "Ghi sổ nghen, {self} có bao giờ quỵt đâu {call}.",
];
export const GHISO_THANKS = [
  "Cảm ơn {call} nghen, {self} nhớ mà.",
  "{Call} tốt bụng ghê, mai {self} ghé trả liền.",
  "Có {call} là có chỗ ăn cơm, cảm ơn nha.",
  "Ơn {call} nhiều, cuối tuần {self} trả gọn.",
  "{Self} ghi nhớ trong bụng rồi nha {call}.",
  "Quán {call} có tình ghê, cảm ơn nghen.",
  "Thôi {self} về, mai ghé trả, {call} yên tâm.",
  "Cảm ơn {call}, bữa sau {self} dắt thêm bạn tới ăn.",
];
export const GHISO_REFUSED = [
  "Ờ thôi {self} trả liền vậy, {call} đừng giận.",
  "Không sao, {self} còn chút tiền lẻ đây {call}.",
  "Hơi buồn nha {call}, mà thôi {self} trả.",
  "Ừ, quán nhỏ mà, {self} hiểu. Gửi {call} nè.",
  "Lục túi còn đủ, may ghê. Nè {call}.",
  "Thôi được, {self} trả. Bữa sau ghi sổ nha {call}.",
  "Khó ghê ta, mà thôi tiền đây {call}.",
  "Vậy để {self} chuyển khoản cho {call}.",
];
export const GHISO_TAB_REVIEW = [
  "Quán có cuốn sổ nợ dày cộm, khách quen ăn trước trả sau, đúng kiểu xóm nghèo thương nhau.",
  "Bữa nay kẹt tiền, cô chủ cho ghi sổ không hỏi một câu. Cơm ngon mà tình còn ngon hơn.",
  "Ăn chịu mà cô chủ vẫn múc thêm mỡ hành. Lãnh lương là ghé trả liền.",
  "Ở đây được ghi sổ như hồi xưa, giờ kiếm đâu ra quán vậy nữa.",
  "Cuối tháng ví mỏng, may có cuốn sổ của cô chủ. Sườn vẫn nướng thơm như thường.",
  "Cô chủ ghi tên mình vô sổ, cười cái rụp. Ăn xong thấy nợ ân tình hơn nợ tiền.",
  "Quán quen thì phải vầy: đói thì ăn, kẹt thì ghi sổ, có tiền thì trả.",
  "Ghi sổ mà cô chủ không làm mặt khó, còn dặn ăn thêm cơm cho no.",
  "Lần đầu ăn chịu ở quán cơm, ngại mà cô chủ nói tỉnh bơ: mai trả cũng được.",
  "Quán có tình người. Nợ một dĩa cơm sườn, nhớ cả tuần.",
];
export const GHISO_PAID_REVIEW = [
  "Trả xong cuốn sổ {amount}k, nhẹ cả người. Cảm ơn cô chủ tin {self}.",
  "Lãnh lương ghé trả nợ, cô chủ còn mời thêm ly trà đá. Quán này giữ khách kiểu đó.",
  "Nợ bao lâu cô chủ cũng không nhắc, giờ trả đủ {amount}k mới thấy thương quán.",
  "Trả nợ xong ngồi ăn thêm dĩa cơm sườn, coi như ăn mừng.",
  "Sổ nợ gạch tên mình rồi, mai lại ghé ăn đàng hoàng.",
  "Cô chủ gạch sổ mà cười tươi, còn hỏi thăm nhà cửa. Năm sao cho cái tình.",
  "Quán tin khách thì khách giữ chữ tín. Trả đủ rồi nha cô chủ.",
  "Cầm {amount}k ra trả, cô chủ nói cứ từ từ. Quán này mình ăn hoài.",
  "Hết nợ quán cơm, giờ ăn dĩa nào trả dĩa đó cho sướng.",
  "Nợ ân tình thì trả không hết, nợ tiền thì trả rồi. Cảm ơn cô chủ.",
];
export const DEBT_PAID_NEWS = [
  "{name} ghé trả nợ {amount}k, còn mua thêm bịch trà đá.",
  "{name} trả đủ {amount}k trong sổ, gạch tên rồi.",
  "Sáng nay {name} gửi {amount}k trả nợ, nhắn cảm ơn quán.",
  "{name} lãnh lương, ghé trả gọn {amount}k.",
  "{name} trả nợ {amount}k, nói tuần sau dắt bạn tới ăn.",
  "Cuốn sổ nhẹ bớt: {name} trả {amount}k.",
  "{name} trả {amount}k, còn khen sườn bữa trước.",
  "{name} ghé ngang, trả {amount}k rồi chạy đi làm.",
];
export const DEBT_FORGOT_NEWS = [
  "{name} lâu quá không ghé, chắc khoản {amount}k trong sổ thành kỷ niệm rồi.",
  "Nghe nói {name} chuyển công trình đi tỉnh khác, nợ {amount}k coi như cho luôn.",
  "{name} biệt tăm, cô chủ gạch sổ {amount}k, thở dài một cái.",
  "Khoản {amount}k của {name} nằm trong sổ lâu quá, cô chủ xé trang đó luôn.",
  "{name} đổi số điện thoại rồi. Khoản {amount}k thôi bỏ.",
  "Hàng xóm nói {name} về quê ăn Tết sớm. Nợ {amount}k chắc quên luôn.",
  "Cô chủ lật sổ thấy tên {name}, {amount}k. Thôi, coi như làm phước.",
  "{name} không quay lại, {amount}k trong sổ thành hao.",
];

// ---------- mâm cơm công ty / đơn đặt trước ----------
export const CATERING_ONTIME_REVIEW = [
  "Đặt {n} phần {dish} cho văn phòng, tới giờ là có, hộp nào cũng đủ bịch nước mắm. Tháng sau đặt tiếp.",
  "Quán giao mâm cơm đúng giờ, cơm còn nóng, anh chị em trong công ty khen nức nở.",
  "{n} hộp cơm xếp ngay ngắn, không thiếu hộp nào. Làm ăn đàng hoàng.",
  "Đặt cơm cho cả xưởng mà không lo trễ ca. Cô chủ làm việc chuẩn.",
  "Họp xong là có cơm. Sườn thơm, đồ chua giòn, hộp sạch sẽ.",
  "Lần đầu đặt mâm cơm ở đây, đúng giờ, đúng số, đúng món. Năm sao.",
  "Mâm cơm tới trước giờ hẹn mấy phút, ai cũng kịp ăn nóng.",
  "Giá phải chăng mà cơm ngon, giao đúng hẹn. Công ty sẽ ký đặt hằng tuần.",
  "Đếm đủ {n} hộp, không ai bị thiếu trứng thiếu bì. Rất ổn.",
  "Đặt cơm trưa cho nhân viên ở đây yên tâm, không phải gọi giục câu nào.",
];
export const CATERING_LATE_REVIEW = [
  "Đặt {n} phần mà trễ hẹn, cả phòng ngồi đói chờ. Cơm ngon nhưng giờ giấc phải sửa.",
  "Mâm cơm tới trễ, có người phải đi họp bỏ bữa. Lần sau chắc đặt chỗ khác.",
  "Giao thiếu hộp, quán trả lại tiền phần thiếu nhưng anh em vẫn đói.",
  "Hẹn mười một giờ rưỡi mà gần một giờ mới đủ. Cơm nguội bớt rồi.",
  "Cơm thì được, mà đặt trước rồi vẫn phải gọi giục. Hơi mệt.",
  "Thiếu mấy phần {dish}, xưởng phải chia nhau ăn. Mong quán chuẩn bị kỹ hơn.",
  "Trễ giờ giao làm cả công ty lỡ giờ nghỉ trưa. Hai sao cho rút kinh nghiệm.",
  "Đặt từ sáng mà tới hạn vẫn chưa xong. Cô chủ xin lỗi rối rít, thôi bỏ qua lần này.",
  "Mâm cơm tới muộn, hộp thì ngon nhưng đói quá ăn không thấy ngon nữa.",
  "Quán đông khách lẻ quá nên bỏ quên mâm cơm đặt trước. Hơi buồn.",
];
export const CATERING_PICKUP_ONTIME = [
  "{name} tới lấy đủ {n} phần, khen quán làm nhanh.",
  "Người của {name} xách mâm cơm đi, cười tươi rói.",
  "{name}: đúng giờ ghê, mai đặt tiếp nha cô.",
  "{name} lấy cơm, còn hỏi số điện thoại để đặt thường xuyên.",
  "{name} nhận đủ {n} hộp, trả nốt tiền liền.",
  "{name} xách mâm cơm về, dặn tuần sau đặt nhiều hơn.",
  "{name} đếm hộp xong gật gù: chuẩn rồi cô.",
  "{name} cảm ơn quán, cơm còn nóng hổi.",
];
export const CATERING_PICKUP_LATE = [
  "{name} lấy phần đã xong, mặt hơi buồn: trễ quá cô ơi.",
  "{name} chờ không nổi nữa, xách phần làm xong đi trước.",
  "{name}: lần sau cô làm sớm giùm nha, anh em đói rồi.",
  "{name} trả bớt tiền vì trễ hẹn, quán đành chịu.",
  "{name} gọi điện giục hai lần, cuối cùng lấy được phần đã xong.",
  "{name} lắc đầu nhận cơm, chắc lần sau khó đặt lại.",
  "{name} lấy cơm mà không nói gì, nhìn đồng hồ hoài.",
  "{name}: thôi lấy nhiêu đây, phần còn lại cô khỏi làm.",
];

// ---------- ca trưa ----------
export const LUNCH_SAY = [
  "{Call} ơi nhanh giùm {self}, một giờ vô làm rồi.",
  "Cho {self} dĩa cơm, nước mắm để riêng nha, ăn lẹ còn về họp.",
  "Còn bàn không {call}? {Self} có ba mươi phút thôi.",
  "Trưa nào cũng chạy qua đây, nhanh giùm nha {call}.",
  "{Self} ăn xong phải chạy về chấm công, {call} ơi.",
  "Bàn nào cũng được {call}, miễn có chỗ ngồi.",
  "Sếp gọi rồi, {call} làm nhanh giùm {self}.",
  "Giờ trưa đông ghê, {self} đứng đây chờ chút nha {call}.",
  "{Call} ơi, cơm trưa văn phòng, lẹ lẹ nha.",
  "Trưa nay nắng quá, cho {self} ly trà đá trước nha {call}.",
];
export const LUNCH_REVIEW = [
  "Trưa văn phòng chạy qua ăn vừa kịp giờ chấm công. Cơm nóng, nước mắm để riêng đúng ý.",
  "Giờ trưa đông nghẹt mà vẫn có bàn, lên món nhanh. Quán ruột của phòng mình rồi.",
  "Ăn trưa ở đây mười lăm phút là xong, no bụng, không trễ giờ họp.",
  "Đồng nghiệp rủ qua ăn trưa, giờ tuần nào cũng ghé. Sườn mềm, cơm tơi.",
  "Trưa nắng mà có ly trà đá châm liền tay, cảm động thiệt.",
  "Quán xoay bàn nhanh, dân văn phòng như mình rất mê.",
  "Ăn trưa giá văn phòng, chất lượng nhà hàng. Cô chủ nhanh tay ghê.",
  "Không phải chờ, không phải nhắc, ăn xong tính tiền chuyển khoản cái rụp.",
  "Bữa trưa gọn gàng: dĩa cơm đủ lớp, nước mắm chén riêng, bàn sạch.",
  "Mười hai giờ trưa ghé vẫn kịp có chỗ. Năm sao cho tốc độ.",
];
export const LUNCH_REVIEW_LOW = [
  "Giờ trưa đông quá, chờ lâu tới trễ giờ làm. Cơm ngon nhưng không kịp ăn từ từ.",
  "Trưa văn phòng mà phải đứng chờ bàn, mất toi nửa giờ nghỉ.",
  "Dân văn phòng cần nhanh, quán thì chậm quá vào giờ trưa.",
  "Ăn vội nuốt không trôi, vì chờ món lâu quá rồi.",
  "Trưa nào cũng đông, quán cần thêm người phụ.",
  "Ngồi chờ mãi không ai châm trà, giờ trưa nóng muốn xỉu.",
  "Cơm được mà giờ trưa bàn dơ chưa dọn, ngồi không yên.",
  "Hẹn đồng nghiệp ăn trưa mà ai cũng phải về sớm vì chờ món.",
];

// ---------- mang về / shipper ----------
export const TAKEAWAY_SAY = [
  "{Call} ơi, {n} hộp mang về, nhớ bịch nước mắm nha.",
  "Đơn app nè {call}, khách dặn thêm đồ chua.",
  "{Self} lấy {n} hộp, khách đang chờ, nhanh giùm nha {call}.",
  "{Call} ơi, cho {self} hộp cơm sườn, khách hối rồi.",
  "Đơn này giao xa, {call} gói kỹ giùm {self}.",
  "{Self} chạy ba đơn liền, {call} làm lẹ giùm nha.",
  "Nhớ bịch nước mắm riêng nha {call}, khách hay phàn nàn lắm.",
  "{Call} ơi, {n} hộp nhé, có túi xách thì càng tốt.",
  "Mưa lâm râm rồi, {call} gói kỹ giùm {self}.",
  "Khách đặt đúng quán {call} đó, ngon nên đặt lại.",
];
export const TAKEAWAY_REVIEW = [
  "Đặt app giao tới còn ấm, hộp kín, có bịch nước mắm riêng. Chuẩn bài.",
  "Hộp cơm mang về đầy đặn, đồ chua để riêng không bị úng cơm.",
  "Shipper nói quán gói nhanh lắm, nên cơm tới nhà còn nóng.",
  "Đặt cơm về văn phòng, mở hộp ra thơm mùi sườn nướng than.",
  "Mua mang về mà không thiếu gì, có cả túi xách gọn gàng.",
  "Hộp cơm ở đây đáng tiền, sườn to, cơm nhiều.",
  "Đặt ba hộp, đủ ba bịch nước mắm. Quán cẩn thận ghê.",
  "Cơm mang về ăn ở nhà vẫn ngon như ngồi quán.",
  "Gói kỹ, không đổ nước mắm ra túi. Năm sao.",
  "Giao nhanh, đóng hộp sạch, sẽ đặt lại.",
];
export const TAKEAWAY_REVIEW_LOW = [
  "Hộp cơm tới nơi thiếu bịch nước mắm, ăn cơm khô như ngậm cát.",
  "Shipper chờ lâu quá, cơm tới nhà nguội ngắt.",
  "Mang về mà đổ nước mắm ra túi, ướt hết.",
  "Đặt app mà sai món, gọi lại thì quán đông quá không nghe máy.",
  "Hộp cơm bị móp, đồ chua tràn qua cơm.",
  "Chờ shipper lấy cơm mà quán làm chậm, giao trễ cả nửa tiếng.",
  "Cơm mang về thiếu đồ chua, hơi tiếc.",
  "Gói vội nên hộp hở nắp, tới nơi cơm bị khô.",
];

// ---------- cơm chiên từ cơm dư ----------
export const COM_CHIEN_ORDER = [
  "{Call} ơi, còn cơm chiên hôm qua không, cho {self} một dĩa.",
  "Cho {self} dĩa cơm chiên trứng, nghe nói quán chiên ngon.",
  "Hôm nay có cơm chiên hả {call}? {Self} lấy một dĩa.",
  "Cơm chiên với trứng ốp la nha {call}, rẻ mà no.",
  "{Self} thích cơm chiên cơm nguội, {call} chiên giòn giùm nha.",
  "Một dĩa cơm chiên, thêm dưa leo nha {call}.",
  "Cuối tháng rồi, cho {self} dĩa cơm chiên hai chục thôi {call}.",
  "{Call} ơi, cơm chiên còn không, {self} ăn sáng luôn.",
];
export const COM_CHIEN_REVIEW = [
  "Cơm chiên từ cơm hôm qua mà hạt nào hạt nấy săn lại, thơm mùi trứng. Hai chục mà no.",
  "Cô chủ không bỏ phí hạt cơm nào, chiên lên dĩa cơm chiên giòn rụm.",
  "Ăn cơm chiên ở quán cơm tấm mới thấy cơm tấm chiên ngon kiểu khác.",
  "Dĩa cơm chiên trứng giá sinh viên, ăn xong muốn gọi thêm.",
  "Cơm chiên có trứng ốp la lòng đào, chấm chút nước mắm là hết sảy.",
  "Mấy ai biết quán có cơm chiên, đến sớm mới còn. Ngon và rẻ.",
  "Cơm chiên hạt tơi, không dầu mỡ ngấy. Món giấu nghề của cô chủ.",
  "Cuối tháng ăn cơm chiên hai chục mà vẫn thấy sang.",
  "Cơm dư hôm qua thành dĩa cơm chiên hôm nay, quán làm ăn khéo.",
  "Ăn cơm chiên mà nhớ cơm mẹ nấu hồi nhỏ.",
];
export const COM_CHIEN_REVIEW_LOW = [
  "Cơm chiên hơi khô, trứng chín quá. Giá rẻ nên thôi bỏ qua.",
  "Cơm chiên mà nhạt, phải xin thêm nước mắm.",
  "Dĩa cơm chiên ít quá, ăn chưa no đã hết.",
  "Cơm chiên lâu ra quá, chờ mãi mới có dĩa.",
  "Cơm chiên còn lổn nhổn hạt cứng, chắc cơm để lâu.",
  "Trứng ốp la cháy cạnh, cơm chiên thiếu dưa leo.",
  "Cơm chiên được cái rẻ, chứ ngon thì chưa.",
  "Gọi cơm chiên mà ra hơi nguội.",
];

// ---------- phụ bàn Bông ----------
export const HELPER_SAY = [
  "Để con châm trà cho bàn này nha cô!",
  "Bàn kia dơ rồi, con dọn liền!",
  "Cô cứ đứng bếp đi, con lo ngoài này.",
  "Trà đá tới đây, anh chị uống cho mát nha!",
  "Bàn sạch rồi, mời khách vô được nha cô!",
  "Con lau bàn xong rồi nè cô.",
  "Anh chị chờ chút, cơm sắp ra rồi, uống trà trước nha.",
  "Bông tới liền, khỏi gọi!",
  "Cô ơi, thau dĩa dơ đầy rồi đó, lát con phụ rửa.",
  "Hôm nay đông ghê cô, mà vui!",
];
export const HELPER_REVIEW = [
  "Có em phụ bàn nhanh nhẹn, chưa kịp khát là đã có trà đá châm đầy.",
  "Bàn vừa trống là em phụ bàn lau sạch bong, không phải đứng chờ lâu.",
  "Quán có thêm người phụ, cô chủ đứng bếp yên tâm, sườn nướng đều tay hơn hẳn.",
  "Em Bông dễ thương, châm trà liên tục, còn hỏi có cần thêm khăn lạnh không.",
  "Phục vụ nhanh, bàn sạch, trà đầy. Quán lên đời thật rồi.",
  "Em phụ bàn chạy như con thoi mà vẫn cười, ăn thấy vui lây.",
  "Ngồi xuống là có trà, ăn xong là có người dọn. Đúng chuẩn quán đông.",
  "Phải công nhận từ khi có em phụ bàn, quán bớt cảnh bàn dơ.",
  "Em Bông nhớ cả bàn mình hay uống trà đá nhiều. Dễ thương ghê.",
  "Quán đông mà không loạn, nhờ có người phụ bàn tinh ý.",
];

// ---------- lên quán, đồ mới, hạng quán, quảng bá ----------
export const STREET_MEMORY = [
  "Ngày cuối ở vỉa hè: {days} ngày, {plates} dĩa cơm, bốn cái ghế nhựa và một bếp than đã theo cô chủ từ đầu.",
  "Tạm biệt góc vỉa hè. {plates} dĩa cơm, không biết bao nhiêu ly trà đá, và cơn mưa nào cũng phải dọn bàn chạy.",
  "Cuốn lại tấm bạt vỉa hè: {days} ngày nướng sườn dưới ánh đèn đường, {plates} dĩa cơm đầu đời.",
  "Vỉa hè cũ còn vết than dưới gạch. {days} ngày, {plates} dĩa, giờ dọn vô quán có mái.",
  "Bốn cái ghế nhựa xếp chồng lên xe. Sau {days} ngày, quán vỉa hè thành quán có mái.",
  "Hàng xóm đứng tiễn: {plates} dĩa cơm sườn ở góc này, nhớ ghé lại nha cô.",
];
export const RENT_LINES = [
  "Treo bảng hiệu mới lên cửa quán. Có mái rồi, mưa cũng không sợ.",
  "Quán có mái, ba cái bàn, nồi cơm lớn. Cô chủ đứng ngó một hồi lâu.",
  "Chìa khoá mặt bằng trong tay. Từ nay khách ngồi trong quán, gió không thổi bay khăn giấy nữa.",
  "Dọn vô quán mới, bếp than vẫn là cái bếp cũ, mùi sườn vẫn y như xưa.",
  "Lên quán rồi! Thêm bàn, thêm dĩa, thêm người đứng chờ.",
  "Khách quen đi tìm quán mới, thấy bếp than đỏ là biết đúng chỗ.",
];
export const UPGRADE_LINES = [
  "Mua {item} về, quán nhìn ra dáng hơn hẳn.",
  "{item} mới tinh, cô chủ lau đi lau lại.",
  "Có thêm {item}, khách quen ghé ngó thử liền.",
  "{item} đặt vô góc quán, vừa xinh.",
  "Thêm {item}, quán bớt trống trải.",
  "Hàng xóm khen {item} của quán đẹp.",
];
export const TIER_LINES = [
  "Hạng quán lên bậc {n}: người đi ngang dừng lại ngó nhiều hơn.",
  "Quán lên bậc {n}, khách mới nghe tiếng tìm tới.",
  "Bậc {n} rồi! Danh tiếng quán lan ra tới đầu hẻm.",
  "Lên hạng bậc {n}, mấy trang ăn uống bắt đầu nhắc tới quán.",
  "Hạng quán bậc {n}: khách kiên nhẫn chờ hơn một chút.",
  "Quán bậc {n}, cô chủ thêm tự tin, đứng bếp hiên ngang.",
];
export const PROMO_LINES = {
  "to-roi": ["Phát tờ rơi khắp khu trọ, tối nay sinh viên kéo tới.", "Tờ rơi dán đầy bảng tin khu trọ: cơm tấm ngon, giá sinh viên.", "Mấy bạn sinh viên cầm tờ rơi hỏi đường tới quán."],
  "check-in": ["Check-in tặng trà tắc: khách chụp hình quán đăng mạng.", "Khách check-in xong được ly trà tắc, ai cũng vui.", "Hình dĩa cơm tấm của quán lên mạng, có người theo dõi mới."],
  viral: ["Livestream lúc lật sườn lên xu hướng! Tối nay đông chắc luôn.", "Clip miếng sườn xèo xèo được chia sẻ khắp nơi.", "Livestream nổ: người xem hỏi địa chỉ quán liên tục."],
  ok: ["Livestream được vài trăm người xem, có người hẹn tối ghé.", "Buổi livestream lúc nướng ổn áp, thêm chút người theo dõi.", "Livestream bình thường, nhưng có khách hứa ghé thử."],
  flop: ["Livestream đúng lúc miếng sườn cháy khét, bình luận cười quá trời.", "Mạng lag, livestream đứng hình ngay lúc lật sườn.", "Livestream ít người xem, coi như tập dượt."],
};

// ---------- nhiệm vụ, thời tiết ----------
export const MISSION_DONE = [
  "Ngon lành!", "Cô chủ có nghề thiệt.", "Tay nướng có tiếng rồi.", "Quán vận hành trơn tru.", "Đúng chuẩn quán cơm tấm.",
  "Ghi một điểm vô sổ.", "Khách quen gật gù.", "Làm vậy là được thưởng.",
];
export const MISSION_MISS = [
  "Mai làm lại.", "Hụt chút xíu thôi.", "Ca sau gỡ lại.", "Không sao, quán còn dài ngày.", "Rút kinh nghiệm.", "Lần sau chắc chắn được.",
];
export const RAIN_LINES = [
  "Trời mưa, khách vắng hơn thường lệ.",
  "Mưa lâm râm, người đi đường vội về nhà, ít ai ghé.",
  "Mưa rồi, ai có mái che thì còn khách.",
  "Trời mưa, shipper chạy cực, khách ngồi quán thưa.",
  "Mưa nặng hạt, chỉ còn khách quen đội mưa tới.",
  "Mưa chiều, quán bớt đông nhưng bếp than vẫn đỏ.",
];
