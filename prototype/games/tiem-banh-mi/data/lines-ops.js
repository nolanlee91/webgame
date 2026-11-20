// Thoại vận hành: hết hàng giữa ca, hết tiền lẻ, lò, gợi ý ngày 1. Chọn bằng freshLine.

/** Chủ tiệm nhắc khi còn ≤ 2 phần. */
export const LOW_LINES = [
  "{item} sắp hết rồi, còn {n} phần thôi.",
  "Coi chừng {item}, còn có {n} phần.",
  "{item} gần cạn, nhập gấp đi không thôi lát kẹt.",
  "Ê, {item} còn {n} phần à.",
];
/** Hết hẳn một món giữa ca. */
export const OUT_LINES = [
  "Chết, hết {item} rồi!",
  "Ủa… {item} đâu? Hết sạch rồi!",
  "Hết {item} ngay giữa giờ cao điểm, sao giờ?",
  "Hũ {item} trống trơn rồi.",
  "{Item} hết rồi, khách thì đang chờ.",
];
/** Kết quả từng cách cứu. */
export const RESCUE_SAY = {
  run: ["Chạy ra chợ một chút, mọi người chờ xíu nha!", "Để chạy ra Bà Tư mua liền!", "Giữ chỗ giùm, chạy ra chợ cái vèo!"],
  back: ["Về rồi đây, có {item} rồi!", "Mua được {item} rồi, làm tiếp nè!", "Bà Tư còn đúng mấy phần {item}, may ghê!"],
  ship: ["Anh Lâm nói năm phút nữa tới.", "Gọi Anh Lâm rồi, ảnh nói 'tới liền'.", "Nhờ Anh Lâm chở {item} qua."],
  delivered: ["Anh Lâm tới rồi: {n} phần {item}!", "Anh Lâm giao {item} tới nơi, đúng hẹn lần đầu trong năm."],
  deliveredWrong: ["Anh Lâm mang tới… {got} thay vì {item}. 'Anh tưởng em nói cái này.'", "Anh Lâm giao nhầm {got}. Thôi để dành mai."],
  borrow: ["Cậu Hưng bên kia đường cho mượn {n} phần {item}: 'Mai trả em nha anh.'", "Mượn Cậu Hưng {n} phần {item}. Đối thủ mà tử tế ghê."],
  swapYes: ["Khách chịu bỏ {item}: 'Thôi không có thì thôi {call}.'", "Khách gật đầu: 'Không {item} cũng được.'"],
  swapNo: ["Khách lắc đầu: 'Không có {item} thì thôi {call}.' rồi đi.", "Khách không chịu, đi qua xe khác."],
  consign: ["Bà Tư gửi gói ký gửi: 'Bán tới đâu trả tới đó nghe con.'", "Bà Tư mang qua một gói: 'Cầm đỡ đi con, mai tính.'"],
  close: ["Thôi, dọn xe về sớm hôm nay.", "Treo bảng 'Hết bánh', mai bán tiếp."],
  si: ["Chạy ra lò đầu hẻm mua mười ổ bánh sỉ.", "Lấy tạm bánh sỉ lò đầu hẻm, giòn vừa thôi nhưng đỡ."],
  waitOven: ["Mời khách chờ mẻ đang nướng.", "Mẻ trong lò sắp chín, chờ chút nha."],
  gasCall: ["Gọi Anh Lâm thay bình gas.", "Anh Lâm vác bình gas tới: 'Lần sau gọi sớm nghe em.'"],
  gasBorrow: ["Chạy qua Cô Sáu mượn bình gas, mai trả.", "Cô Sáu cho mượn bình gas: 'Mai trả cô nghe.'"],
};
/** Hết tiền lẻ (khách đưa tờ lớn, quỹ lẻ không thối được). */
export const NOCHANGE = {
  open: ["Khách đưa tờ {bill} ngàn cho ổ {price} ngàn. Quỹ lẻ không đủ thối!", "Tờ {bill} ngàn lúc này… tiền lẻ không còn đủ.", "Không có lẻ hả em? Anh có mỗi tờ này."],
  run: ["Chạy qua Cô Sáu đổi tiền lẻ, quầy trống một chút.", "Cô Sáu đổi cho một nắm tiền lẻ: 'Lần sau đổi sớm nghe con.'"],
  owe: ["'Thôi mai anh trả nha em.' Khách cầm ổ đi.", "Cho khách thiếu, mai trả. Sổ nợ có thêm một dòng."],
  self: ["Khách tự chạy đi đổi tiền.", "'Để anh đi đổi rồi quay lại.'"],
  selfLeft: ["Khách đi đổi tiền rồi… không quay lại.", "Khách đi luôn, ổ bánh nằm lại trên quầy."],
};
/** Lò. */
export const OVEN_LINES = {
  ready: ["Ting! Mẻ bánh vàng óng rồi, rút đi!", "Bánh chín rồi, rút liền kẻo xém!", "Vàng đều rồi đó, rút lò!"],
  dark: ["Bánh đang xém, rút gấp!", "Mùi hơi khét rồi, rút liền!"],
  burnt: ["Cháy mẻ rồi! Khói bay mù mịt.", "Mẻ này thành than rồi, bỏ thôi."],
  noGas: ["Hết gas rồi, lò không lên lửa.", "Bình gas cạn, cần thay bình."],
};

/** Gợi ý ngày 1 (core/tutorial.js chọn theo trạng thái). */
export const HINTS = {
  bake: "Bánh trong tủ còn ít. Bấm “Bỏ mẻ” để nướng 4 phôi.",
  pull: "Vỏ đã vàng óng! Bấm “Rút” ngay, để lâu là xém rồi cháy.",
  waitOven: "Lò đang nướng. Canh thanh màu vỏ, tới vùng xanh “Rút!” thì rút.",
  pin: "Có khách đang chờ. Chạm vào khách (hoặc phiếu) để ghim phiếu lên thớt.",
  take: "Bước 1: lấy một ổ từ tủ kính. Số trên ổ là độ giòn.",
  toast: "Phiếu dặn “giòn giòn”: bấm “Nướng lại” trên lò than trước khi rạch.",
  toasting: "Đang nướng lại. Đủ 4 giây thì bấm “Lấy ra”, quá 10 giây là cháy.",
  slice: "Bước kế: rạch bánh.",
  spread: "Phết theo phiếu (pate, bơ…). Chạm lại ô để đổi nấc ít / vừa / nhiều.",
  fill: "Bỏ nhân theo phiếu. Pate bơ thì không có nhân, bấm bước kế.",
  veg: "Rau dưa: bật / tắt theo phiếu (để ý “không hành”).",
  spice: "Ớt và nước tương theo phiếu (để ý “ít ớt”, “không ớt”).",
  wrap: "Gói ổ bánh (cắt đôi nếu phiếu dặn).",
  serve: "Bấm “Giao” để đưa ổ cho khách.",
  change: "Thối tiền: chọn tờ trong quỹ lẻ cho đủ số cần thối, hoặc bấm “Thối đúng” (ngày 1–3).",
  idle: "Rảnh tay thì nướng thêm mẻ cho khách sau.",
};
