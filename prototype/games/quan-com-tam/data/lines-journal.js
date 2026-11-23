// Câu chốt ngày Nhật Ký Làm Chủ (DRAMA.md §6, core/journal.js captionKind chọn nhóm theo dữ kiện ngày). Kiểu meme, hài tử tế, không emoji.
// Biến: {plates} dĩa bán · {profit} lời / lỗ (số dương) · {revenue} doanh thu · {stars} sao trung bình · {lost} khách bỏ về · {burnt} miếng cháy
// · {perfect} lần lật đúng lúc · {flips} lần lật · {washed} dĩa rửa · {oops} số lỗi · {followers} người theo dõi mới · {takeaway} hộp mang về · {day} {shop}.

export const CAPTIONS = {
  tutorial: [
    "Ngày đầu làm chủ: bán {plates} dĩa, lật {flips} lần, tim đập nhanh hơn quạt mo.",
    "Ngày 1. Học được ba điều: sườn có hai mặt, khách có hai tay để vẫy, và trà đá hết rất nhanh.",
    "Mở quán ngày đầu, {plates} dĩa ra bàn. Mẹ gọi hỏi: con ăn cơm chưa? Chưa.",
    "Ngày đầu tiên: bếp than đỏ, tay cô chủ run, {plates} dĩa vẫn tới đúng bàn.",
    "Hôm nay {plates} dĩa, mai chắc gấp đôi. Hoặc gấp rưỡi. Hoặc bằng. Cứ mơ trước đã.",
  ],
  loss: [
    "Doanh thu {revenue}k. Lỗ {profit}k. Ăn tối: ba miếng cơm cháy đáy nồi.",
    "Hôm nay lỗ {profit}k. Than thì đỏ, sổ sách thì đỏ hơn.",
    "Bán {plates} dĩa mà vẫn lỗ {profit}k. Bài học: than không tự mua, sườn không tự rẻ.",
    "Lỗ {profit}k. Cô chủ ngồi tính lại sổ dưới ánh đèn bình, quạt mo nằm nghỉ cạnh bên.",
    "Một ngày lỗ {profit}k. Mai nhập hàng ít lại, nướng kỹ hơn, cười nhiều hơn.",
  ],
  replyViral: [],
  replyPhot: [],
  flip: [],
  serious: [
    "Hôm nay có một lời xin lỗi nghiêm túc. Quán ghi vào sổ: chuyện an toàn thì không vội.",
    "Bán {plates} dĩa và một bài học lớn: đồ chay dao riêng, thớt riêng, đầu óc cũng riêng.",
    "Một ngày nhắc mình chậm lại: sườn phải chín hẳn, dĩa chay phải chay hẳn.",
    "{plates} dĩa. Có một dĩa quán làm sai và đã xin lỗi. Mai làm đúng cả {plates}.",
  ],
  lost: [
    "{lost} khách bỏ về vì chờ lâu. Mùi sườn thơm tới đầu hẻm mà người thì không chờ tới.",
    "Hôm nay {lost} người đứng chờ rồi đi. Quán cần thêm một đôi chân, hoặc một cái bàn.",
    "Bán {plates} dĩa, để lỡ {lost} khách. Lần sau mời ngồi nhanh hơn, châm trà sớm hơn.",
    "{lost} khách về tay không. Cái ghế nhựa trống nhìn cô chủ đầy trách móc.",
    "Bỏ về {lost} người. Bếp nhanh mà chân chậm thì cũng như không.",
  ],
  burnt: [
    "Cháy {burnt} miếng sườn. Bếp than được đặt biệt danh mới: than hoạt tính.",
    "Hôm nay lật {flips} lần, cháy {burnt} miếng. Mấy miếng còn lại có cá tính.",
    "{burnt} miếng sườn đã hoá than. Quạt mo xin nghỉ phép một hôm.",
    "Bán {plates} dĩa, tiễn {burnt} miếng sườn về với than. Mai canh vỉ thay vì canh điện thoại.",
    "Khói hôm nay đậm đà như {burnt} miếng sườn cháy. Cô Lan bên cạnh chắc đã biết.",
  ],
  oops: [
    "Hôm nay quán phạm {oops} lỗi. Phiếu dặn dò được dán to gấp đôi cho ngày mai.",
    "{oops} lỗi trong một ca: bì leo lên dĩa, trà đá đi vắng, dĩa đi lạc. Mai làm lại.",
    "Bán {plates} dĩa, sai {oops} chỗ. Cái phiếu biết hết, chỉ có cô chủ là quên.",
    "{oops} lần quán xin lỗi hôm nay. Nói dạ nhiều tới mức khàn giọng.",
    "Ngày của {oops} lỗi nhỏ. Lỗi lớn nhất: chưa kịp ăn tối.",
  ],
  grill: [
    "Hôm nay lật {flips} miếng sườn. {perfect} lần đúng lúc. Lần còn lại có cá tính.",
    "{perfect} lần lật đúng lúc. Tay cô chủ giờ nhanh hơn tiếng xèo.",
    "Vỉ sườn hôm nay đẹp như tranh: {perfect} lần lật chuẩn, không miếng nào khét.",
    "Lật đúng lúc {perfect} lần. Khách đứng xem lật sườn như xem xiếc.",
    "Bán {plates} dĩa, lật chuẩn {perfect} lần. Bếp than gật gù hài lòng.",
  ],
  soldOut: [
    "Hết món lúc khách còn đông. Quán cơm tấm hết đồ, khách hết kiên nhẫn, cô chủ hết hơi.",
    "Hôm nay báo hết món mấy lần. Mai nhập dư một chút, ướp dư một chút.",
    "Bán sạch tới miếng cuối. Có người tiếc vì tới trễ, có người mừng vì tới sớm.",
    "Treo bảng hết món sớm. Cảm giác vừa vui vừa có lỗi.",
  ],
  takeaway: [
    "{takeaway} hộp mang về, mỗi hộp hai bịch nước mắm buộc chặt. Shipper khen gói kỹ.",
    "Hôm nay quán bán ra tới tận nhà người ta: {takeaway} hộp, không hộp nào đổ.",
    "{takeaway} hộp mang về và {plates} dĩa tổng cộng. Cái kệ hộp làm việc chăm hơn ai hết.",
    "Shipper ghé {takeaway} lần. Có anh còn xin sạc nhờ điện thoại.",
  ],
  wash: [
    "Rửa {washed} cái dĩa. Bể 0. Cả quán hô phát tài.",
    "{washed} dĩa đi qua thau nước. Đôi tay cô chủ giờ thơm mùi nước rửa chén.",
    "Hôm nay rửa {washed} dĩa, nhiều hơn số lần nhìn điện thoại.",
    "Thau chén đầy rồi vơi {washed} lần. Không bàn nào chờ dĩa sạch.",
  ],
  viral: [
    "Hôm nay quán có thêm {followers} người theo dõi. Mai chắc phải kê thêm ghế.",
    "+{followers} người theo dõi. Cô chủ vẫn chưa biết đăng gì, chỉ biết nướng tiếp.",
    "Quán lên mạng nhẹ nhàng: {followers} người mới theo dõi, {plates} dĩa đã bán.",
    "Có {followers} người mới theo dõi quán. Một nửa hỏi địa chỉ, nửa còn lại hỏi có mỡ hành không.",
  ],
  // gộp A + B: ngày lên quán (A), ngày giao trọn mâm cơm / đơn đặt (A), ngày có chuyện lớn (Drama, B)
  moved: [
    "Ngày {day}: dọn từ vỉa hè vào quán có mái. Bếp than đi theo, cái ghế nhựa đỏ cũng đi theo.",
    "Có mái che rồi. {plates} dĩa đầu tiên trong quán mới, mưa cũng không sợ nữa.",
    "Thuê mặt bằng xong, cô chủ đứng nhìn bảng hiệu năm phút rồi mới nhóm than.",
    "Từ vỉa hè lên quán: {plates} dĩa, lời {profit}k, và một chút nhớ góc cột điện cũ.",
  ],
  catering: [
    "Giao trọn mâm cơm đúng giờ. Bày một lần bốn hộp, tay nhanh hơn cả máy.",
    "Hôm nay quán nhận đơn lớn và giao kịp. {plates} dĩa, lời {profit}k.",
    "Mâm cơm công ty đi đúng giờ, khách gọi điện cảm ơn. Bếp than được nghỉ một phút.",
    "Đơn đặt trước xong xuôi: hộp nào cũng đủ sườn, đủ đồ chua, đủ nước mắm.",
  ],
  drama: [
    "Ngày {day}: chuyện ở quán còn nhiều hơn sườn trên vỉ. Vẫn bán được {plates} dĩa.",
    "Hôm nay có chuyện để kể. {plates} dĩa, {stars} sao, và một câu chuyện cho Nhật Ký.",
    "Quán nhỏ mà chuyện không nhỏ. Xử lý xong, lời {profit}k.",
    "Một ngày nhiều tình huống. Cô chủ vẫn giữ được bếp than và nụ cười.",
  ],
  promise: [
    "Giữ đúng lời hứa với khách hôm qua. Nói được làm được, cơm tấm cũng vậy.",
    "Hôm nay quán trả được một lời hứa. Nhẹ người hơn cả lúc trả nợ.",
    "Hứa sửa, đã sửa. {plates} dĩa, {stars} sao. Khách cũ gật đầu.",
    "Lời hứa hôm qua đã thành {stars} sao hôm nay.",
  ],
  perfect: [
    "{plates} dĩa, {stars} sao. Không bàn nào dơ quá mười giây, không ly trà nào cạn.",
    "Một ngày {stars} sao. Cái khăn lau làm việc chăm hơn chủ.",
    "Bán {plates} dĩa, khách nào cũng gật gù. Cô chủ cười tới lúc dọn hàng.",
    "Ngày đẹp như dĩa đặc biệt trên menu: {stars} sao, {plates} dĩa.",
    "Hôm nay mọi thứ đúng chỗ: sườn chín đều, trà đá đầy, tiền tính đúng.",
  ],
  few: [
    "Bán {plates} dĩa. Ít khách, nhiều thời gian ngồi nghe radio với cái bếp than.",
    "Hôm nay vắng, {plates} dĩa. Con mèo vàng ghé chơi nhiều hơn khách.",
    "{plates} dĩa. Vỉa hè yên tĩnh, cô chủ tập lật sườn cho ngày mai đông.",
    "Một ngày thưa khách: {plates} dĩa, nhiều câu chuyện với Cô Út.",
  ],
  good: [
    "Bán {plates} dĩa, lời {profit}k. Ăn tối: ba miếng cơm cháy đáy nồi.",
    "Doanh thu {revenue}k. Lời {profit}k. Than đỏ tới khuya, chân mỏi tới sáng.",
    "{plates} dĩa ra bàn, {stars} sao. Một ngày bình thường đầy mùi sườn nướng.",
    "Hôm nay lời {profit}k. Cô chủ thưởng cho mình một ly trà đá đầy.",
    "{plates} dĩa, {stars} sao, lời {profit}k. Mẹ hỏi ăn cơm chưa: lát nữa.",
    "Bán {plates} dĩa. Không có gì đặc biệt, trừ mùi than vẫn thơm như mọi ngày.",
  ],
};
