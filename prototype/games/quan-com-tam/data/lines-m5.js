// S (M5): câu cho hội chợ, ca thử thách, huy hiệu, nước mắm nhà pha, vỉ chay, tủ kính. Mọi câu chọn qua freshLine (không lặp trong ngày).
// Biến: {self} {call} {name} (khách), {n} số, {badge} tên huy hiệu, {shop} tên quán.

/** Hội chợ "Đêm hội ẩm thực bờ sông": câu lúc mở gian. */
export const FAIR_OPEN = [
  "Đèn lồng giăng dọc bờ sông, gian cơm tấm của mình nằm ngay đầu dãy. Khói sườn bay tới đâu, khách quay đầu tới đó.",
  "Ban tổ chức phát số gian. Mình được gian 12, kế bên gian bánh xèo đang chiên xèo xèo.",
  "Loa phường mở nhạc Trịnh, khách đi từng nhóm, ai cũng cầm sẵn tiền lẻ.",
  "Bàn nhựa xếp sát mép sông, gió thổi mát mà than vẫn đỏ. Đêm nay đông đây.",
  "Biển gian viết tay bằng phấn: 'Cơm tấm sườn nướng than, nóng tại chỗ'. Đơn sơ mà nhìn là thèm.",
  "Ông bán kem bên cạnh hứa ai ăn cơm xong qua mua kem được giảm 2 nghìn. Liên minh bờ sông thành lập.",
  "Nhóm sinh viên thiện nguyện đứng phát tờ rơi hộ, đổi lại xin mỗi đứa một chén cơm cháy.",
  "Mấy gian bên kia bán đồ chiên, chỉ có mình nướng than. Mùi sườn đêm nay độc quyền.",
  "Trời quang, trăng tròn, khách đi hội cả nhà. Nồi cơm lớn đã đầy, than đã nhóm.",
  "Ban tổ chức đi qua dặn: 'Gian nào cháy khói đen là bị nhắc nha cô'. Quạt nhẹ tay thôi.",
];
/** Khách hội chợ nói khi tới (đi nhóm). */
export const FAIR_SAY = [
  "Cả nhóm {n} người nha {call}, đi hội đói bụng quá!",
  "Gian này thơm nhất dãy đó, ngồi đây đi tụi bây.",
  "{Call} ơi cho {self} {n} dĩa, ăn xong còn đi coi múa lân.",
  "Nghe mùi sườn từ đầu cầu, đi theo mùi tới đây luôn.",
  "Hội chợ mà có cơm tấm than là chuẩn bài rồi.",
  "Ngồi sát sông cho mát nha {call}, {n} người.",
  "Bữa nay giá hội chợ hả {call}? Thôi kệ, ngon là được.",
  "Đi một vòng hội chợ rồi, quay lại gian này là chắc ăn nhất.",
];
/** Review ca hội chợ theo kết quả (great ≥ 5 sao, ok 3–4, bad ≤ 2). */
export const FAIR_REVIEW = {
  great: [
    "Đêm hội bờ sông mà có dĩa cơm tấm sườn than nóng hổi, ngồi ăn nghe nhạc, đáng đi lắm.",
    "Gian cơm tấm đông nhất hội chợ, vậy mà lên món nhanh, sườn mềm thơm. 10 điểm.",
    "Ăn xong cả nhóm đứng dậy vỗ tay cho cô chủ. Hội chợ năm sau nhất định quay lại gian này.",
    "Giá hội chợ hơi cao mà xứng: sườn cháy cạnh đúng ý, nước mắm vừa miệng.",
    "Gió sông, đèn lồng, dĩa cơm tấm thơm mỡ hành. Đêm hội trọn vẹn.",
    "Đi hội chợ cả chục gian, chỉ nhớ mỗi gian cơm tấm này.",
    "Cô chủ vừa nướng vừa cười với khách, đông vậy mà không ai bị bỏ quên.",
    "Mình là người thứ ba mươi mấy xếp hàng, vẫn được ăn sườn vừa chín tới. Phục.",
    "Con nít trong nhóm ăn hết sạch dĩa, xin thêm chén cơm. Vậy là biết ngon cỡ nào.",
    "Hội chợ đồ ăn mà ít chỗ ngon thiệt, gian cơm tấm này là ngoại lệ đáng giá.",
  ],
  ok: [
    "Đông quá nên chờ hơi lâu, bù lại sườn nướng than thơm, ngồi bờ sông mát.",
    "Cơm tấm ổn, giá hội chợ nên mắc hơn ngoài quán chút. Được trải nghiệm.",
    "Gian cơm tấm đông nhất dãy, tụi mình chờ bàn mười phút mới có chỗ.",
    "Sườn ngon, đồ chua hơi ít. Đi hội thì vậy là được rồi.",
    "Không khí vui, món ổn. Chắc tại đông nên cô chủ hơi luống cuống.",
    "Ăn tạm được, sườn hơi khô vì chắc nướng sẵn cho kịp khách.",
    "Đi hội cả nhà, ghé ăn cho vui. Không xuất sắc nhưng không chê.",
    "Lần sau tới sớm hơn, giờ cao điểm gian này đông dữ.",
  ],
  bad: [
    "Chờ gần hết đêm hội mới có dĩa, tới nơi sườn nguội. Thất vọng.",
    "Giá hội chợ đã mắc mà còn ra món sai. Cả nhóm bỏ về nửa chừng.",
    "Đông quá không kham nổi, tụi mình gọi ba lần không ai ghé bàn.",
    "Khói bay mù mịt, ngồi ăn mà cay mắt. Gian bên cạnh còn than phiền.",
    "Hội chợ là để vui, ngồi chờ đói meo thì vui gì nổi.",
    "Sườn cháy khét, nước mắm quên đưa. Chắc cô chủ quá tải rồi.",
    "Thấy đông tưởng ngon, ai dè chờ lâu mà món bình thường.",
    "Tụi mình đứng chờ bàn rồi bỏ đi gian khác. Tiếc mùi sườn.",
  ],
};
/** Câu chốt ca hội chợ (bảng chốt ca). */
export const FAIR_DONE = {
  great: [
    "Đêm hội khép lại, gian 12 bán sạch nồi cơm. Ban tổ chức hỏi năm sau có tới nữa không.",
    "Dọn gian lúc nửa đêm, túi tiền nặng tay, tay áo thơm mùi than.",
    "Ông bán kem bên cạnh nói: 'Nhờ gian cô mà kem tui cũng hết.'",
    "Khách hội chợ đi về còn hỏi địa chỉ quán. Mai chắc có khách lạ.",
    "Đêm hội thành công. Cô chủ ngồi bệt xuống ghế, cười không nổi vì mỏi.",
    "Bán tới dĩa cuối cùng, còn đúng một miếng sườn cho mình ăn khuya.",
    "Ban tổ chức đi ngang khen gian sạch, khói ít, khách đông.",
    "Một đêm bằng ba ngày bán ở quán. Hội chợ đáng đồng tiền thuê gian.",
  ],
  ok: [
    "Đêm hội cũng tạm ổn, lời được chút, quen thêm mấy chủ gian bên cạnh.",
    "Đông mà không kịp tay, bỏ lỡ vài nhóm khách. Lần sau chuẩn bị kỹ hơn.",
    "Hội chợ vui nhưng mệt. Lần sau nhóm thêm than từ sớm.",
    "Bán được kha khá, có nhóm chờ lâu bỏ đi. Rút kinh nghiệm.",
    "Gian mình không đông nhất, nhưng khách nào ăn cũng gật gù.",
    "Đêm hội trôi qua, tiền thuê gian gỡ lại được, thêm chút lời.",
    "Tới khuya mới vắng, dọn gian về nhà là gần sáng.",
    "Không tệ cho lần đi hội này. Lần sau chuẩn bị nhiều sườn hơn.",
  ],
  bad: [
    "Đêm hội không như mơ: khách đông mà mình không kham nổi.",
    "Dọn gian sớm, tiền thuê gian chưa gỡ lại. Đi hội cũng là đi học.",
    "Ban tổ chức nhắc khói hai lần. Năm sau phải nướng khéo hơn.",
    "Khách bỏ về nhiều quá, nhìn mà xót. Lần sau mang thêm người phụ.",
    "Mệt, lỗ, nhưng biết được hội chợ cần chuẩn bị cỡ nào.",
    "Gian bên cạnh cháy hàng, gian mình cháy sườn. Huề.",
    "Về tới nhà mới thấy còn nguyên khay chả chưa hấp. Uổng.",
    "Đêm hội buồn. Mai về quán bán lại cho quen tay.",
  ],
};

/** Ca thử thách: câu khi đạt / không đạt, mỗi thử thách riêng. */
export const CHALLENGE_TEXT = {
  "mot-bep": {
    win: [
      "Một bếp, ca khuya kéo dài, vậy mà không ai phải chờ quá lâu. Tay nướng thượng thừa.",
      "Tắt bếp 2 cả ca mà vẫn đủ món cho khách khuya. Than một bếp cũng đủ ấm quán.",
      "Khách khuya đông như ban ngày, một bếp gánh hết. Thử thách đạt!",
      "Sườn ra đều tay, không miếng nào chờ ai. Một bếp mà như hai.",
      "Thợ tan ca, tài xế đêm, ai cũng có dĩa nóng. Bếp 2 nghỉ một bữa cũng không sao.",
      "Mười tám dĩa trên một bếp than, cô chủ chùi mồ hôi cười khà.",
      "Thử thách một bếp: xong. Mai bật lại bếp 2 cho tay nghỉ.",
      "Một bếp, một người, một ca khuya dài. Đạt mục tiêu ngon lành.",
    ],
    lose: [
      "Một bếp không kịp cho ca khuya, khách chờ rồi bỏ về. Thử thách chưa qua.",
      "Bếp 1 quá tải, sườn ra chậm. Lần sau canh vùng nóng khéo hơn.",
      "Tắt bếp 2 mới thấy nó quý cỡ nào. Thử thách hụt.",
      "Ca khuya dài quá, than hết giữa chừng. Chưa đạt.",
      "Khách khuya đông, một bếp đuối sức. Mai thử lại.",
      "Thiếu vài dĩa là đạt, tiếc ghê. Lần sau nướng sẵn vùng ấm.",
      "Bỏ về hơi nhiều, thử thách một bếp còn nợ đó.",
      "Một bếp đúng là bài khó. Học thêm cách xoay vỉ đã.",
    ],
  },
  "khong-chay": {
    win: [
      "Cả ca không miếng nào cháy đen. Tay lật đúng nhịp như đồng hồ.",
      "Mười sáu dĩa, không miếng sườn nào phải bỏ. Thử thách đạt!",
      "Không khói đen, không mùi khét. Bếp than hôm nay ngoan lạ thường.",
      "Lật đúng lúc, dời vùng ấm đúng lúc. Không cháy miếng nào là thật.",
      "Khách khen sườn đều màu, cô chủ khen chính mình. Đạt!",
      "Một ca sạch sẽ: không miếng nào vô thùng rác.",
      "Thử thách không cháy: qua. Than đỏ mà sườn vẫn hồng.",
      "Tay nướng hôm nay xứng đáng một tấm bằng khen.",
    ],
    lose: [
      "Một miếng cháy đen là hỏng cả thử thách. Tiếc!",
      "Mải bưng ra bàn xa, quay về sườn đã đen. Chưa đạt.",
      "Vùng nóng nóng quá, một phút lơ là là cháy. Mai thử lại.",
      "Cháy mất một miếng lúc cao điểm. Thử thách chưa qua.",
      "Không cháy thì phải bán đủ dĩa, hôm nay hụt cả hai.",
      "Lửa bùng đúng lúc đang tính tiền. Xui.",
      "Thùng rác hôm nay có một miếng sườn đen. Rút kinh nghiệm.",
      "Thử thách khó thiệt: cháy một miếng là thua.",
    ],
  },
  "trua-khong-phu": {
    win: [
      "Ca trưa không Bông, không Dì Năm, vậy mà dân văn phòng ai cũng kịp giờ làm.",
      "Một mình cân trọn giờ trưa. Bông nghe kể chắc trầm trồ.",
      "Mười bốn dĩa trưa, tự châm trà, tự dọn bàn. Đạt!",
      "Văn phòng đông như kiến mà không ai bỏ về. Thử thách qua.",
      "Không phụ bàn mà bàn vẫn sạch, trà vẫn đầy. Tay chân thoăn thoắt.",
      "Giờ trưa dồn 45 phút, một người gánh hết. Đáng một huy hiệu.",
      "Bông nghỉ một bữa, quán vẫn chạy ro ro.",
      "Ca trưa tự lực: hoàn thành.",
    ],
    lose: [
      "Không có Bông mới biết châm trà dọn bàn tốn tay cỡ nào. Chưa đạt.",
      "Dân văn phòng chờ không nổi, vài người bỏ về. Thử thách hụt.",
      "Một mình giờ trưa đúng là cực. Mai thử lại.",
      "Bàn dơ chất đống, khách đứng chờ. Chưa qua.",
      "Thiếu vài dĩa, dư vài người bỏ về. Tiếc.",
      "Trưa nay quá đông cho một người. Lần sau nướng sẵn nhiều hơn.",
      "Thử thách trưa không phụ: còn nợ.",
      "Mệt rã rời mà vẫn hụt mục tiêu. Học thêm cách gom việc.",
    ],
  },
  "toan-mang-ve": {
    win: [
      "Cả ca toàn hộp mang về, không hộp nào thiếu bịch nước mắm. Shipper khen nức nở.",
      "Mười bốn hộp ra đúng, đúng món, đúng dặn. Đạt!",
      "Quầy mang về chạy như dây chuyền. Thử thách qua.",
      "Shipper nối đuôi nhau, cô chủ đóng hộp không sót món nào.",
      "Hộp nào cũng đủ cơm, đủ sườn, đủ mắm. Ca mang về hoàn hảo.",
      "Không ai ngồi lại mà quán vẫn đông. Ngày toàn mang về: xong.",
      "App giao hàng nhảy liên tục, mình theo kịp hết.",
      "Mang về toàn ca, sai không quá một hộp. Tuyệt.",
    ],
    lose: [
      "Hộp mang về sai món, shipper quay lại đổi. Chưa đạt.",
      "Quên bịch nước mắm mấy hộp liền. Thử thách hụt.",
      "Shipper chờ lâu quá bỏ đơn. Mai thử lại.",
      "Hộp ra chậm, hàng chờ dài. Chưa qua.",
      "Mang về tưởng dễ, ai dè dặn riêng nhiều quá.",
      "Thiếu vài hộp là đạt. Tiếc ghê.",
      "Sai hai hộp rồi, thử thách thua.",
      "Ngày toàn mang về: còn phải luyện đóng hộp.",
    ],
  },
  "mam-40": {
    win: [
      "Mâm 40 phần giao đúng giờ, đủ phần. Công ty gửi lời cảm ơn kèm hình chụp.",
      "Bốn mươi hộp xếp hàng như lính, giao kịp trước giờ hẹn. Đạt!",
      "Khay mâm chạy hết công suất, không hộp nào thiếu sườn.",
      "Đơn lớn nhất từ trước tới nay, giao trọn. Thử thách qua.",
      "Bên công ty khen hộp nào cũng nóng. Bốn mươi phần một lèo.",
      "Mâm 40 phần: xong, còn kịp phục vụ khách tại quán.",
      "Bày ×N đúng là cứu tinh. Mâm 40 giao trước hẹn.",
      "Cả bếp như xưởng sản xuất, kết quả xứng đáng.",
    ],
    lose: [
      "Mâm 40 phần giao trễ, khách lấy phần đã xong. Chưa đạt.",
      "Bốn mươi phần nhiều quá, thiếu sườn giữa chừng. Thử thách hụt.",
      "Giao thiếu vài hộp, công ty chỉ trả bảy phần. Mai thử lại.",
      "Mải phục vụ tại quán, quên mất giờ giao mâm. Chưa qua.",
      "Khay mâm chưa đủ nhanh cho đơn này.",
      "Trễ hẹn rồi, thử thách mâm lớn còn nợ.",
      "Cơm hết nồi giữa chừng mâm 40. Rút kinh nghiệm nấu xen kẽ.",
      "Mâm lớn là bài khó nhất. Lần sau chuẩn bị từ sáng.",
    ],
  },
};
/** Câu khi nhận huy hiệu. */
export const BADGE_LINES = [
  "Huy hiệu mới: {badge}! Dán lên tường cạnh menu liền.",
  "Ting! {badge}. Cô chủ chụp màn hình gửi nhóm gia đình.",
  "{badge} vào sổ. Quán mình có thêm một chuyện để kể.",
  "Nhận huy hiệu {badge}. Khách quen vỗ tay, khách lạ ngơ ngác.",
  "{badge}: xứng đáng sau bao nhiêu miếng sườn.",
  "Thêm một huy hiệu: {badge}. Bông đòi treo khung.",
  "{badge}! Tối nay ăn mừng bằng dĩa cơm chiên.",
  "Sổ huy hiệu dày thêm: {badge}.",
  "{badge}. Cả hẻm biết rồi.",
  "Huy hiệu {badge} về tay. Mai bán hăng hơn.",
];
/** Review riêng khi quán có nước mắm nhà pha. */
export const FISH_SAUCE_REVIEW = [
  "Nước mắm quán tự pha, chan cơm không cần gì thêm.",
  "Chén nước mắm vừa chua vừa ngọt, đậm vị nhà làm. Muốn mua chai đem về.",
  "Ăn cơm tấm nhiều quán, nước mắm ở đây là ngon nhất. Pha khéo thiệt.",
  "Sườn ngon đã đành, nước mắm nhà pha mới là linh hồn dĩa cơm.",
  "Nước mắm tỏi ớt sánh, thơm, chan lên cơm tấm là hết sẩy.",
  "Hỏi xin thêm chén nước mắm, cô chủ cười bảo 'bí kíp đó nghen'.",
  "Vị nước mắm làm mình nhớ cơm nhà ngoại. Năm sao.",
  "Đi xa về là ghé, chỉ vì chén nước mắm nhà pha.",
  "Nước mắm không gắt, không ngọt lợ. Đúng chuẩn cơm tấm Sài Gòn.",
  "Cơm, sườn, mỡ hành đều ổn, nhưng nước mắm mới là điểm mười.",
];
/** Tủ kính / vỉ chay (bong bóng thông báo). */
export const CASE_LINES = [
  "Cất sườn vào tủ kính, giữ ấm chờ khách.",
  "Tủ kính có thêm một miếng chín, khách tới là có liền.",
  "Vùng ấm đầy, miếng này vô tủ kính.",
  "Tủ kính sáng đèn, sườn nằm ngay ngắn.",
];
export const VEG_LINES = [
  "Đậu hũ lên vỉ chay riêng, dĩa chay sạch mặn.",
  "Vỉ chay riêng: khách ăn chay yên tâm.",
  "Nướng đậu hũ bên vỉ chay, không lẫn mùi sườn.",
];
