// Review theo sao (DRAMA.md §4): giọng mạng xã hội, có hashtag, không emoji. Mỗi mức sao: câu chung + câu theo vai.
// M4 sẽ nâng lên 8–12 câu mỗi mức mỗi nhóm; M2 có đủ để không lặp trong một ngày.

export const REVIEWS = {
  5: {
    default: [
      "Sườn cháy cạnh thơm mùi than, mỡ hành béo, nước mắm vừa. Ăn xong muốn gọi dĩa thứ hai. #comtam #sườncháycạnh",
      "Ngồi ghế nhựa, ăn cơm tấm, gió bờ sông thổi. Đây là định nghĩa của hạnh phúc.",
      "Trà đá chưa kịp cạn đã được châm. Phục vụ như nhà mình.",
      "Khuya rồi mà vẫn có dĩa cơm nóng hổi. Cảm ơn quán.",
      "Sườn mềm, thấm, vân vỉ đẹp như tranh. 5 sao không suy nghĩ. #cơmtấmđêm",
      "Cơm tơi, mỡ hành bóng, đồ chua giòn. Quán làm đúng từng thứ nhỏ.",
      "Lên món nhanh, bàn sạch, cô chủ cười suốt. Sẽ quay lại. #quánquen",
      "Một dĩa cơm tấm đúng vị Sài Gòn. Không cần gì thêm.",
      "Dặn gì quán làm nấy, chuẩn từng chi tiết. Hiếm có.",
      "Ăn xong ngồi thêm mười phút chỉ để ngửi mùi than. #comtam",
    ],
    worker: ["Cả đội tan ca ghé, quán làm đúng hết, cơm đầy dĩa. Mai ghé tiếp. #thợăncơm", "Cơm nhiều, sườn to, nước mắm chan đã. Thợ chấm 5 sao."],
    student: ["Giá sinh viên, chất lượng nhà hàng. Ví mỏng vẫn vui. #sinhviên", "Ăn xong có sức chạy deadline tới sáng. Cảm ơn quán."],
    office: ["Mười lăm phút có cơm, bàn sạch, chuyển khoản lẹ. Dân văn phòng cảm động. #giờtrưa"],
    regular: ["Ăn ở đây mấy năm rồi, quán vẫn giữ được cái tình. 5 sao."],
    driver: ["Chạy xe cả đêm, ghé quán có dĩa cơm nóng với ly trà đá đầy. Đủ rồi. #tàixếđêm"],
    nurse: ["Ra ca trực ăn dĩa cơm này thấy được an ủi. Cảm ơn chị chủ quán. #cađêm"],
    reviewer: ["Chấm 9,5 trên 10. Trừ nửa điểm vì tôi ăn hết nhanh quá không kịp quay. #reviewthậtlòng"],
    tourist: ["Broken rice is the best rice. Cơm tấm số một. Will come back. #saigon"],
  },
  4: {
    default: [
      "Ngon, đông, chờ bàn hơi lâu. Đáng chờ. #comtamđêm",
      "Sườn mềm, đồ chua giòn. Muốn thêm chút mỡ hành.",
      "Giá hợp lý, lên món nhanh. Sẽ quay lại.",
      "Sườn hơi khô vì nướng sẵn, nhưng nước mắm cứu được hết.",
      "Ngon nhưng quán cần thêm ghế, đứng chờ mỏi chân.",
      "Trà đá châm hơi chậm, cơm thì không chê được.",
      "Dĩa chuẩn vị, chỉ tiếc bàn bên cạnh chưa dọn.",
      "Ổn áp. Không xuất sắc nhưng muốn ăn lại. #cơmtấm",
      "Cô chủ dễ thương, sườn thơm. Chờ món lâu xíu thôi.",
      "Một dĩa cơm đàng hoàng giữa đêm. 4 sao.",
    ],
    worker: ["Cơm ngon, cơm thêm hơi lâu. Đội chú vẫn vui."],
    student: ["Ngon, rẻ, chỉ hơi đông. Tụi em vẫn quay lại."],
    office: ["Ngon nhưng em suýt trễ họp. Lần sau em tới sớm hơn."],
    regular: ["Con nướng ngon, chỉ là nay đông nên cô chờ xíu."],
  },
  3: {
    default: [
      "Ăn được, không có gì đặc biệt. Sườn hơi mỏng. #bìnhthường",
      "Chờ hơi lâu cho một dĩa sườn. Dĩa ngon, thời gian thì không.",
      "Bàn hơi dơ, trà đá hơi ít, cơm thì ổn.",
      "Giá ổn, vị ổn, cảm xúc cũng… ổn.",
      "Nước mắm hôm nay ngọt hơn hôm qua. Chắc nước mắm có ngày vui.",
      "Không tệ, không đỉnh. Một dĩa cơm cho xong bữa.",
      "Quán đông nên phục vụ hơi rối. Món thì tạm.",
      "Có vài chỗ chưa tới, nhưng thái độ quán tốt. 3 sao.",
    ],
    worker: ["Cơm hơi ít so với sức thợ. Tạm được."],
    student: ["Ăn được, nhưng tụi em chờ hơi lâu. 3 sao."],
    office: ["Ổn, nhưng không đủ nhanh cho giờ trưa của tôi."],
  },
  2: {
    default: [
      "Chờ bàn lâu, chờ món lâu, chờ trà đá lâu nhất. #thấtvọng",
      "Sườn cháy, cơm nguội, bàn dơ. Hôm nay không phải ngày của quán.",
      "Khói bếp bay thẳng vào mặt suốt bữa ăn.",
      "Món không như dặn, phải nhắc mấy lần.",
      "Quán có vẻ quá tải. Mong quán sắp xếp lại.",
      "Tiếc, vì nghe đồn quán ngon lắm. Hôm nay thì chưa.",
      "Dĩa cơm làm vội, thiếu trước hụt sau. 2 sao.",
    ],
    worker: ["Đội thợ đói mà quán làm chậm, làm sai. Buồn."],
    office: ["Mất giờ nghỉ trưa mà ăn không ngon. 2 sao."],
  },
  1: {
    default: [
      "Chờ mãi không có bàn, bỏ về. Bụng đói, lòng buồn. #bỏvề",
      "Gọi mãi không ai ra lấy món.",
      "Hôm nay quán như đang có ngày tệ. Tôi cũng vậy, sau khi ăn.",
      "Nhận nhầm dĩa, tính nhầm tiền, quên trà đá. Bộ ba hoàn hảo.",
      "Không quay lại nữa, ít nhất là trong tuần này.",
      "Đói tới, đói về. #thấtvọng",
    ],
    office: ["Mất trọn giờ trưa mà không có gì bỏ bụng. 1 sao."],
    worker: ["Cả đội đứng chờ rồi kéo nhau đi quán khác."],
  },
};
/** Review riêng khi bỏ về vì chờ (chờ bàn hoặc chờ món). */
export const TIMEOUT_REVIEW = {
  default: [
    "Chờ không có bàn, đành đi quán khác. #bỏvề",
    "Ngồi chờ món mãi không thấy, đứng dậy về. 1 sao.",
    "Quán đông quá, không ai để ý tới bàn tôi.",
    "Đứng chờ bàn mỏi chân, bụng thì réo. Về.",
    "Mùi sườn thơm mà không được ăn. Đau lòng. #chờlâu",
    "Quán nên có người đón khách. Tôi chờ không nổi.",
  ],
  office: ["Giờ trưa có hạn, quán thì không vội. 1 sao. #giờtrưa"],
  worker: ["Thợ đói không chờ được lâu vậy. Cả đội đi quán khác."],
};
/** Review khi quán báo hết món (khách gọi rồi mà không có). */
export const SOLD_OUT_REVIEW = [
  "Gọi món xong mới biết hết. Quán xin lỗi đàng hoàng, mai ghé lại. #hếtmón",
  "Tới trễ nên hết sườn. Chắc quán đắt hàng thật.",
  "Hết món giữa chừng, tiếc ghê. Cô chủ có mời ly trà.",
];
