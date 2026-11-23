// Review theo lý do (M4, core/reviews.js reviewPool): chờ lâu mà vẫn được ăn, hộp mang về, khen riêng sườn cháy cạnh / trứng lòng đào / trà đá kịp.
// Giọng mạng xã hội, hashtag được, không emoji. Biến: {self} {call} {Call} {name} {dish}.
// Review theo lỗi (13 kiểu) ở data/lines-mistakes.js, review theo sao ở data/lines-reviews.js.

/** Được ăn nhưng chờ lâu (điểm thời gian thấp, không lỗi món), 2–3 sao. */
export const SLOW_REVIEW = {
  default: [
    "Dĩa {dish} ngon, nhưng chờ lâu tới mức quên mình gọi gì. #chờlâu",
    "Ngồi nhìn cô chủ chạy qua chạy lại mười lăm phút mới tới dĩa của mình.",
    "Cơm ngon, sườn thơm, chỉ là tới tay hơi trễ so với cái bụng.",
    "Quán đông quá, tôi chờ món mà đếm được hết vạch sơn vỉa hè.",
    "Lần sau tới sớm hơn hoặc mang theo đồ ăn vặt để chờ. 3 sao.",
    "Đồ ăn không có gì chê, chỉ có đồng hồ là chê.",
    "Chờ lâu tới mức ly trà đá tan hết đá, rồi mới có cơm.",
    "Quán cần thêm người phụ, một mình cô chủ không kịp đâu.",
  ],
  office: ["Giờ nghỉ trưa có một tiếng, chờ món hết nửa tiếng. Ngon nhưng căng. #giờtrưa", "Ăn vội cho kịp họp, tiếc cho dĩa cơm ngon."],
  worker: ["Cả đội chờ hơi lâu, bụng réo to hơn loa. Cơm thì ngon.", "Thợ đói chờ lâu là dễ nổi nóng lắm nha quán."],
  student: ["Tụi em chờ hơi lâu nhưng ăn xong thấy cũng đáng. 3 sao.", "Chờ món mà làm xong luôn bài tập nhóm."],
  driver: ["Chạy xe cả đêm, ghé ăn mà chờ lâu hơn một cuốc xe."],
  nurse: ["Em có ít phút giữa ca, chờ món hơi lâu nên ăn vội quá."],
};

/** Hộp mang về: khen (4–5 sao). */
export const TAKEAWAY_REVIEW = {
  5: [
    "Hộp {dish} tới nơi còn nóng, bịch nước mắm buộc chặt, đồ chua riêng. Quá có tâm. #mangvề",
    "Đặt hộp mang về mà mở ra như mới gắp từ vỉ. 5 sao.",
    "Shipper nói quán gói kỹ nhất khu. Mở hộp ra thì tin liền.",
    "Cơm tơi, sườn nằm trên không bị ướt, đủ dưa leo. Ăn ở nhà mà như ngồi vỉa hè.",
    "Đặt cho cả nhà, hộp nào cũng đủ món đúng dặn. Cảm ơn quán.",
    "Hộp cơm khuya tới đúng lúc đói nhất. Nước mắm để riêng chuẩn bài.",
  ],
  4: [
    "Hộp mang về ngon, chỉ hơi nguội xíu do đường xa. 4 sao.",
    "Gói kỹ, đủ món. Mong quán cho thêm đồ chua.",
    "Hộp cơm ổn áp, sườn thơm. Lần sau đặt sớm hơn cho nóng.",
    "Mang về ăn vẫn ngon, chỉ tiếc không có mùi than như ngồi tại quán.",
    "Shipper chờ hơi lâu nhưng hộp cơm thì không chê được.",
    "Đủ bịch nước mắm, đủ đũa muỗng. Quán làm việc gọn.",
  ],
};
/** Hộp mang về: chưa vui (≤ 3 sao, không lỗi món cụ thể). */
export const TAKEAWAY_LOW = [
  "Hộp cơm tới hơi trễ, cơm nguội mất rồi. #mangvề",
  "Shipper chờ quá lâu ở quán, tới nhà thì đói lả.",
  "Hộp cơm thiếu chút đồ chua, dưa leo thì đi đâu mất.",
  "Mang về ăn không ngon bằng ngồi tại quán. 3 sao.",
  "Đặt hộp mà quán làm chậm, shipper gọi điện xin lỗi giùm quán.",
  "Hộp cơm hơi lộn xộn, sườn đè lên cơm ướt hết.",
];

/** Khen riêng: dặn cháy cạnh và được đúng ý (5 sao). */
export const CHARRED_PRAISE = [
  "Dặn cháy cạnh, nhận đúng cháy cạnh. Mép sườn giòn thơm mùi than. #sườncháycạnh",
  "Ai thích sườn cháy cạnh thì tới đây, cô chủ canh lửa như nghệ sĩ.",
  "Miếng sườn cháy cạnh vừa tới, không khét, không khô. 5 sao.",
  "Lần đầu dặn cháy cạnh mà quán hiểu đúng ý. Cảm động.",
  "Cạnh sườn sém vàng, thịt bên trong vẫn mềm. Chuẩn vị vỉa hè.",
  "Dĩa {dish} cháy cạnh đúng kiểu {self} thích. Mai ghé tiếp.",
];
/** Khen riêng: trứng lòng đào chảy đúng (5 sao). */
export const EGG_PRAISE = [
  "Trứng lòng đào chảy xuống cơm đúng lúc. Đỉnh. #trứnglòngđào",
  "Chọc lòng đỏ ra là cả dĩa cơm vàng óng. 5 sao.",
  "Quán chiên trứng lòng đào chuẩn như đồng hồ.",
  "Lòng đỏ sánh, lòng trắng giòn viền. Ai dạy quán chiên trứng vậy?",
  "Dặn lòng đào được đúng lòng đào, hiếm lắm luôn.",
  "Trứng ngon tới mức quên luôn miếng sườn. Mà sườn cũng ngon.",
];
/** Khen riêng: phục vụ tại bàn tốt (trà đá kịp, bàn sạch), 5 sao ăn tại quán. */
export const SERVICE_PRAISE = [
  "Trà đá chưa kịp cạn đã được châm. Phục vụ như nhà mình. #tràđá",
  "Bàn lau sạch bóng trước khi mời ngồi, ly trà đầy suốt bữa.",
  "Cô chủ vừa nướng vừa để ý từng bàn, không ai phải vẫy tay.",
  "Ngồi vỉa hè mà được phục vụ chu đáo hơn nhà hàng.",
  "Ly trà đá luôn đầy, khăn lạnh tới liền. Quán nhỏ mà tinh tế.",
  "Không phải gọi lần thứ hai cho bất cứ thứ gì. 5 sao phục vụ.",
];
