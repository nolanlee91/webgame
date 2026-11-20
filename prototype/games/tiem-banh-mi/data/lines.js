// Thoại khách Tiệm Bánh Mì (DRAMA.md). Mọi pool chọn bằng freshLine (core/text.js): nhớ 40 câu gần nhất trong ca, ưu tiên câu chưa dùng.
// Biến: {self} khách tự xưng · {call} gọi chủ tiệm · {Call}/{Self} viết hoa đầu · {order} "một ổ chả lụa, không hành" · {loaf} tên món
// · {name} tên khách · {shop} tên tiệm · {price} giá · {target} giá ổ ba chục · {n} số ổ. Không emoji, không thương hiệu, không người thật.

/** Câu gọi món chung (≥ 16). */
export const ORDER_LINES = [
  "{Call} ơi, cho {self} {order} nha.",
  "Cho {self} {order}, lẹ giùm {self} nha {call}.",
  "{Call} ơi, {order}. Cảm ơn {call}!",
  "Bán cho {self} {order} đi {call}.",
  "{Order}, {call} làm giùm {self} với.",
  "{Call} còn bánh nóng không? Cho {self} {order}.",
  "Sáng nay {self} ăn {order}, {call} nhé.",
  "{Call} ơi, {self} lấy {order} mang đi.",
  "Cho {order}, {call} nhớ dặn kỹ giùm {self} nha.",
  "Ê {call}, {order} liền tay nha.",
  "{Order} nha {call}, {self} đứng đây chờ.",
  "Chào {call}! Hôm nay {self} lấy {order}.",
  "Thơm quá trời. {Call} cho {self} {order}.",
  "{Call} ơi, ngửi mùi lò là đói. {Order} giùm {self}.",
  "Cho {self} xin {order}, cảm ơn {call} nhiều.",
  "{Call}, {self} vội nè, {order} nha.",
  "Bánh mì {call} giòn nổi tiếng hẻm này. {Order} nha.",
  "{Order}. {Call} làm như hôm bữa là được.",
];
/** Câu riêng theo nhóm khách (4–5 mỗi nhóm). */
export const ORDER_BY_ARCH = {
  student: [
    "{Call} ơi, {order}, em sắp trễ giờ vô lớp rồi!",
    "Cho em {order}, em có mười lăm phút thôi {call}.",
    "{Call}, {order} nha, em ăn trên xe buýt.",
    "Hôm nay kiểm tra mười lăm phút, em cần {order} lấy tinh thần.",
    "Mẹ cho em tiền ăn sáng nè {call}. {Order} nha.",
  ],
  worker: [
    "Em ơi, {order}, anh còn phải lên giàn giáo!",
    "{Order}, làm chắc tay nha em, anh làm cả buổi.",
    "Cho anh {order}. Bữa nay đổ bê tông, phải no.",
    "Em ơi, nhanh giùm anh, cả đội đang chờ ngoài công trình. {Order}.",
    "{Order} nha em, nhân nhiều nhiều anh mới đủ sức.",
  ],
  shipper: [
    "{Call} ơi, {order}, bỏ túi giùm em, app đang hối!",
    "Đơn app nè {call}: {order}. Năm phút nữa em bị phạt đó.",
    "{Order}, {call} gói chắc giùm em, em chở xa lắm.",
    "Khách ghi chú vầy nè {call}: {order}. Em đọc đúng từng chữ.",
    "{Call} lẹ giùm em, {order}, khách gọi em ba cuộc rồi.",
  ],
  office: [
    "Em ơi, {order}. Chín giờ chị có họp.",
    "{Order} nha em. Chị chuyển khoản được không?",
    "Cho chị {order}, chị ăn ở bàn làm việc.",
    "Em làm giùm chị {order}, sếp chị đang chờ ở thang máy.",
    "{Order}. Hôm qua chị ăn ngon nên nay quay lại nè em.",
  ],
  regular: [
    "Con ơi, {order}. Như mọi bữa đó con.",
    "Sáng nay trời mát ghê. Cho {self} {order} nghe con.",
    "{Self} ghé nè con. {Order}, không vội đâu.",
    "Con làm giùm {self} {order}. Bánh con nướng là {self} ăn quen rồi.",
    "Hồi xưa đầu hẻm bánh mì năm trăm đồng đó con. Thôi cho {self} {order}.",
  ],
  parent: [
    "Em ơi, {order}, cho bé nhà chị ăn trước giờ học.",
    "Chị lấy {order} nha em, bé nhà chị kén lắm.",
    "{Order}. Em làm khéo giùm chị, bé hay chê.",
    "Bé đòi ăn bánh mì tiệm em đó. {Order} nha.",
    "Em ơi, {order}, chị còn phải chạy đi làm.",
  ],
  reviewer: [
    "Chào anh, {order}. Mình xem anh làm từng bước được không?",
    "Cho mình {order}. Mình nghe nói tiệm anh giòn lắm.",
    "{Order} nha anh. Mình chụp một tấm trước khi ăn nha.",
    "Anh ơi, {order}. Nghe đồn bánh tiệm này rộp rộp.",
  ],
  tourist: [
    "Hello! Xin chào! One bánh mì please, {order}.",
    "Cảm ơn! Ngon quá! Uh… {order}, please.",
    "Hi! {Order}… đúng không? Thank you!",
    "One bánh mì… {order}. I saw it on video!",
  ],
};
/** Khách quen nói "như cũ" (phiếu ẩn, xem Sổ khách quen). */
export const NHU_CU_LINES = [
  "Như cũ nha con.",
  "Con biết rồi đó, như cũ.",
  "Như mọi bữa nghe con, khỏi hỏi.",
  "Như cũ, con nhớ không đó?",
  "Ổ của {self} đó con, như cũ.",
  "Như cũ nghe con. Coi con còn nhớ {self} không.",
];
/** Ổ ba chục: khách nói giá. */
export const BACHUC_LINES = [
  "{Call} ơi, cho {self} ổ {target} ngàn, gì cũng được.",
  "Ổ {target} ngàn nha {call}, {call} bỏ gì cũng được.",
  "{Self} có {target} ngàn à, {call} làm ổ nào vừa giá nha.",
  "Cho ổ {target} ngàn, {call} tự chọn nhân giùm {self}.",
  "Ổ {target} chục… à {target} ngàn đó {call}, nhân gì cũng được.",
];
/** Đơn nhiều ổ. */
export const MULTI_LINES = [
  "{Call} ơi, {n} ổ nha: {order}.",
  "Cho {self} {n} ổ: {order}. Gói chung một túi giùm {self}.",
  "{n} ổ nè {call}: {order}. Đừng tráo nha {call}.",
  "Mua cho cả nhà, {n} ổ: {order}.",
  "{Call}, {self} lấy {n} ổ: {order}. Ai không ăn gì {self} dặn rồi đó.",
];

/** Sốt ruột (kiên nhẫn dưới 35%). */
export const IMPATIENT_LINES = [
  "{Call} ơi, của {self} sắp xong chưa?",
  "Lâu vậy {call}…",
  "{Self} trễ giờ mất {call} ơi.",
  "{Call} làm giùm {self} lẹ lẹ chút nha.",
  "Ổ của {self} đâu rồi {call}?",
  "Hàng đông quá ha {call}…",
  "{Self} đứng mỏi chân rồi nè.",
  "Còn lâu không {call}? {Self} canh đồng hồ nè.",
];
/** Bỏ về vì chờ lâu (khách nói + review 1 sao). */
export const TIMEOUT_SAY = [
  "Thôi {self} đi đây, trễ rồi.",
  "Chờ hoài, thôi để mai.",
  "Thôi {call} ơi, {self} ghé chỗ khác.",
  "Không kịp rồi, {self} đi trước.",
  "Hết giờ rồi, {self} đi nha.",
  "{Self} đói mà chờ không nổi nữa.",
];
export const TIMEOUT_REVIEW = [
  "Chờ mười lăm phút rồi bỏ về. Bụng đói, lòng buồn. #bỏvề",
  "Tiệm đông nhưng ráp chậm quá, tôi trễ học luôn.",
  "Đứng chờ tới mức thuộc luôn menu. Chưa được ăn. #chờlâu",
  "Bánh thơm từ xa, nhưng tới lượt tôi thì tôi phải đi rồi.",
  "Không biết tiệm có thấy tôi đứng đó không.",
  "Mong tiệm thêm người phụ, giờ cao điểm kẹt quá.",
  "Hôm nay không phải ngày tôi được ăn bánh mì.",
  "Chờ lâu hơn thời gian tôi ăn ổ bánh. 1 sao.",
];

/** Khách nhận ổ đúng, vui. */
export const HAPPY_LINES = [
  "Cảm ơn {call} nha!",
  "Giòn quá {call} ơi!",
  "Thơm ghê, mai {self} ghé nữa.",
  "Đúng ý {self} luôn.",
  "Ổ này ngon nè {call}.",
  "Nghe tiếng rộp là biết ngon rồi.",
  "{Call} làm khéo ghê.",
  "Cảm ơn {call}, chúc {call} bán đắt.",
];
/** Khách nhận ổ ổn nhưng chưa ưng. */
export const MEH_LINES = [
  "Ừ, cũng được {call}.",
  "Cảm ơn {call}.",
  "Lần sau {call} làm kỹ hơn chút nha.",
  "Tạm được {call} ơi.",
  "{Self} lấy nha.",
  "Ăn được đó {call}.",
];

/** Khiếu nại: chọn cách xử lý. */
export const COMPLAINT_RESULT = {
  remake: ["Ừ, {call} làm lại giùm {self} nha.", "Không sao, {self} chờ thêm chút.", "Được rồi {call}, lần này nhớ kỹ nha."],
  discount: ["Thôi giảm cho {self} là được.", "Ừ, vậy cũng được {call}.", "Cảm ơn {call}, lần sau nhớ nha."],
  free: ["Ủa tặng luôn hả {call}? Cảm ơn nha.", "{Call} dễ thương ghê, mai {self} ghé.", "Thôi được, {self} không giận đâu."],
};

/** Thối tiền. */
export const CHANGE_LINES = {
  right: ["Đủ rồi {call}, cảm ơn nha.", "Tiền đủ nè, cảm ơn {call}.", "{Call} đếm nhanh ghê.", "Đúng rồi {call}."],
  transfer: ["{Self} chuyển khoản rồi nha {call}.", "{Self} quét mã rồi đó {call}.", "Chuyển rồi nha, {call} kiểm giùm."],
  exact: ["Tiền vừa đủ nè {call}.", "{Self} đưa đúng tiền nha.", "Tiền lẻ đủ đó con, đếm lại giùm {self}."],
  short: ["{Call} ơi, thối thiếu {self} {diff} ngàn rồi.", "Ủa, còn thiếu {diff} ngàn nè {call}.", "Ổ {price} ngàn mà {call} thối vầy là thiếu {diff} ngàn đó."],
  overBack: ["Ủa, {call} thối dư {diff} ngàn nè, trả lại nha.", "{Call} ơi dư rồi, {self} trả lại {diff} ngàn.", "Buôn bán vậy sao giàu {call}, dư {diff} ngàn nè."],
  overGone: ["Cảm ơn {call} nha.", "Ok {call}, {self} đi nha.", "Cảm ơn nha, chúc {call} đông khách."],
};

/** Review theo sao: chung + riêng theo nhóm khách. Giọng mạng xã hội, có hashtag, không emoji. */
export const STAR_REVIEWS = {
  5: [
    "Giòn rụm, pate béo, đồ chua chua vừa. Ăn xong muốn quay lại mua ổ thứ hai. #banhmi #giònrụm",
    "Tiếng rộp đầu tiên lúc 6 giờ sáng là lý do để thức dậy.",
    "Bánh ra lò nóng hổi, cầm trên tay ấm như được mẹ đưa.",
    "Ổ chả lụa dày, rau tươi, giòn tới miếng cuối. 10/10. #ănsáng",
    "Ráp nhanh mà kỹ, đúng từng chữ trên phiếu. Nể chủ tiệm.",
    "Xe đẩy nhỏ mà tay nghề lớn. Sẽ quay lại mỗi sáng. #banhmixeday",
    "Dặn gì nhớ nấy, giòn từ đầu tới đuôi. #đúngý",
    "Bánh mì ngon nhất hẻm, tôi nói vậy là có trách nhiệm.",
    "Pate thơm, bơ béo, ớt vừa cay. Một ổ đủ năng lượng tới trưa.",
    "Nhận ổ trong một phút, cắn một cái nghe rộp. Hết ý. #giòn",
  ],
  4: [
    "Ngon, giòn, chờ hơi lâu vì đông. Đáng chờ. #banhmisáng",
    "Pate ngon, chả lụa dày. Muốn thêm chút đồ chua.",
    "Giá hợp lý, ráp nhanh, rau tươi. Sẽ quay lại.",
    "Ổ chuẩn vị, chỉ tiếc tới hơi trễ nên bánh bớt nóng.",
    "Ngon nhưng tiệm cần thêm ghế cho người đứng chờ.",
    "Bánh giòn, nhân ổn. Chủ tiệm vui tính. #ổngon",
    "Ăn ổn áp, lần sau gọi thêm pate. #banhmi",
    "Không chê được gì nhiều, trừ việc tôi muốn ổ to hơn.",
  ],
  3: [
    "Ăn được, không có gì đặc biệt. Bánh hơi dai. #bìnhthường",
    "Nhân ổn, bánh nguội. Có lẽ tới sớm sẽ khác.",
    "Chờ hơi lâu cho một ổ pate. Ổ ngon, thời gian thì không.",
    "Giá ổn, vị ổn, cảm xúc cũng… ổn.",
    "Ổ bánh tròn trịa như một ngày thứ Hai.",
    "Tạm được. Mong lần sau tiệm làm kỹ hơn.",
    "Không dở, không mê. Ăn cho no rồi đi làm.",
    "Có tiềm năng, cần thêm chút chăm chút. #banhmi",
  ],
  2: [
    "Gọi một kiểu, nhận một kiểu khác. #thấtvọng",
    "Chờ lâu, bánh nguội, nhân ít. Mong tiệm cải thiện.",
    "Hôm nay không phải ngày của tiệm.",
    "Tôi nghĩ tiệm quên tôi trong hàng chờ.",
    "Ổ bánh có vẻ làm vội, ăn thấy thiếu thiếu.",
    "Bánh mì mà không giòn thì buồn lắm. #bánhỉu",
    "Có lẽ tiệm đang bận, nhưng tôi thì đói.",
    "Hơi thất vọng so với lời đồn trong hẻm.",
  ],
  1: [
    "Hôm nay tiệm như đang có ngày tệ. Tôi cũng vậy, sau khi ăn.",
    "Nhận ổ sai, chờ lâu, không muốn quay lại. #thấtvọng",
    "Mong tiệm cẩn thận hơn. Ổ bánh không giống gì tôi gọi.",
    "Bánh nguội, nhân sai. Tiền mất, bụng vẫn đói.",
    "Tôi đã cho tiệm cơ hội, tiệm cho tôi một bài học.",
    "Không biết nói gì hơn. 1 sao.",
    "Ổ bánh hôm nay buồn hơn tôi.",
    "Chắc tôi chọn nhầm giờ, hoặc nhầm tiệm.",
  ],
};
export const STAR_REVIEWS_BY_ARCH = {
  student: {
    5: ["Ăn xong vô lớp kịp giờ, kiểm tra được 9 điểm. Cảm ơn ổ bánh. #họcsinh", "Ổ mười mấy ngàn mà ngon như ổ ba chục. #rẻmàngon", "Cả nhóm em thống nhất: bánh mì tiệm này số một trước cổng trường."],
    4: ["Ngon nha, chỉ là em hơi hồi hộp vì sợ trễ giờ.", "Bánh giòn, em ăn hết trước khi tới trường luôn."],
    3: ["Ăn tạm được, em cần nhanh hơn chút để kịp giờ vô lớp.", "Bánh ổn, nhưng em bị ghi tên đi trễ rồi."],
    2: ["Chờ lâu quá, em bị cô chủ nhiệm nhắc tên. #trễhọc", "Ổ không giống em gọi, nhưng em không kịp đổi."],
    1: ["Em trễ giờ mà vẫn không có bánh. Buồn ghê.", "Hôm nay em ăn sáng bằng niềm tin."],
  },
  worker: {
    5: ["Ăn một ổ làm tới trưa không đói. Tiệm làm ăn có tâm. #thợhồ", "Nhân đầy, ớt đủ cay, bánh giòn. Cả đội khen."],
    4: ["Ngon, chắc bụng. Lần sau cho thêm ớt.", "Ổ bánh xứng đáng với buổi sáng đổ bê tông."],
    3: ["Ăn được, mà hơi ít nhân so với sức anh em làm.", "Tạm ổn, anh em ăn rồi lên giàn."],
    2: ["Chờ lâu, ổ lại sai. Cả đội trễ ca.", "Bánh nguội như gạch, mà gạch thì anh thấy đủ rồi."],
    1: ["Đội thợ đứng chờ cả buổi mà không có ổ nào ra hồn.", "Lần sau anh em ghé chỗ khác thôi."],
  },
  shipper: {
    5: ["Ráp nhanh, bỏ túi gọn, khách app chấm em 5 sao luôn. #shipper", "Tiệm hiểu nghề shipper: lẹ, gọn, đúng ghi chú."],
    4: ["Ổn áp, gói chắc tay, chỉ hơi đông.", "Ngon, khách em không chê gì."],
    3: ["Được, nhưng chờ hơi lâu, app nhắc em hai lần.", "Ổ ổn, túi hơi mỏng."],
    2: ["Chậm quá, em bị trừ điểm trên app. #appphạt", "Khách em gọi điện hỏi sao bánh nguội."],
    1: ["Em bị huỷ đơn vì chờ tiệm. Buồn.", "Không túi, không kịp giờ, không gì cả."],
  },
  office: {
    5: ["Ăn ở bàn làm việc mà cả phòng hỏi mua ở đâu. #vănphòng", "Không hành, ít ớt, đúng từng chữ. Họp chín giờ mà vẫn thơm tho."],
    4: ["Nhanh, gọn, chuyển khoản tiện. Sẽ ghé tiếp.", "Ngon, giá hợp lý cho dân văn phòng."],
    3: ["Ổn, nhưng tôi trễ thang máy vì chờ.", "Vị được, cần nhanh hơn vào giờ cao điểm."],
    2: ["Dặn kỹ mà vẫn sai, họp xong mới phát hiện.", "Bánh nguội, sếp nhìn tôi ăn với ánh mắt thương hại."],
    1: ["Trễ họp, ổ sai, cả buổi sáng hỏng.", "Tôi không có thời gian để thất vọng, nhưng vẫn thất vọng."],
  },
  regular: {
    5: ["Con nướng bánh giỏi hơn hồi mới mở nhiều rồi đó. Cụ khen.", "Như cũ mà đúng y như cũ. Cụ vui."],
    4: ["Bánh ngon con ạ, mai cụ ghé.", "Ổn đó con, nhớ giữ lửa vậy hoài nghe."],
    3: ["Cũng được con, mai làm kỹ hơn chút.", "Bữa nay con bận hả, ổ hơi vội."],
    2: ["Con quên ổ của cụ rồi phải không.", "Bữa nay không được như mọi bữa con ạ."],
    1: ["Cụ ăn bánh hẻm này ba chục năm, bữa nay buồn nhất.", "Con mệt thì nghỉ, đừng làm vội vậy."],
  },
  parent: {
    5: ["Bé nhà mình ăn hết sạch, còn đòi mai ghé tiếp. #mẹbỉm", "Cắt đôi gọn gàng, không ớt, bé cầm vừa tay."],
    4: ["Ngon, bé thích. Lần sau mình dặn kỹ hơn.", "Ổn áp, kịp giờ đưa bé đi học."],
    3: ["Bé ăn được nửa ổ, nửa còn lại mẹ ăn.", "Tạm ổn, mong nhanh hơn giờ đưa con."],
    2: ["Bé chê cay, mình đã dặn không ớt rồi.", "Không cắt đôi, bé cầm không nổi."],
    1: ["Bé khóc vì ổ bánh. Mẹ cũng muốn khóc.", "Trễ giờ học của con, ổ lại sai."],
  },
  reviewer: {
    5: ["Chấm 9,5/10: vỏ giòn, ruột xốp, nhân cân bằng. Clip lên tối nay. #review", "Đây là ổ bánh mì đáng quay lại nhất tuần này của mình."],
    4: ["8/10: giòn, đậm vị, cần nhanh hơn chút. #reviewbanhmi", "Ổn áp, đáng thử nếu đi ngang hẻm."],
    3: ["6/10: không dở, chưa có điểm nhấn.", "Ổ bánh an toàn, review cũng an toàn."],
    2: ["4/10: bánh không còn giòn khi tới tay mình.", "Mình kỳ vọng nhiều hơn so với lời đồn."],
    1: ["2/10: mình sẽ không quay clip tiệm này. Tiếc.", "Không đạt chuẩn ổ bánh mì sáng của mình."],
  },
  tourist: {
    5: ["Best bánh mì of my trip. Giòn quá! #vietnam", "Crunchy, fresh, amazing. Chủ tiệm rất thân thiện."],
    4: ["Very good. A bit busy but worth it.", "Delicious, cảm ơn! Will come back."],
    3: ["It was okay. Bread a little soft.", "Good but I waited long."],
    2: ["Not what I ordered, but people are nice.", "Too spicy for me. I said no spicy."],
    1: ["I waited and left. Sad.", "Wrong order, very confusing."],
  },
};

/** Ráp cho đúng nhưng phải đổi món do hết hàng (khách chịu / không chịu). */
export const SWAP_SAY = { yes: ["Thôi cũng được {call}.", "Không có thì đổi đi {call}.", "Ừ, ổ nào cũng được."], no: ["Không có thì thôi {call}.", "Vậy {self} đi chỗ khác nha.", "Thôi để mai {self} quay lại."] };

/** Ổ ba chục: review theo kết quả (đúng giá / thiếu nhân / dư nhân). */
export const BACHUC_REVIEW = {
  right: ["Ổ {target} ngàn đúng chuẩn {target} ngàn. Tiệm tính toán có tâm. #ổbachục", "Nói giá, tiệm tự chọn nhân, vừa túi tiền mà ngon.", "Ổ ba chục mà đầy như ổ bốn chục. #ổbachục", "Đưa đúng {target} ngàn, nhận đúng một ổ đáng {target} ngàn."],
  low: ["Ổ {target} ngàn mà ba sợi chả, đếm được luôn. #ổbachục", "Trả {target} ngàn nhận ổ chừng mười mấy ngàn. Hơi buồn.", "Ổ ba chục phiên bản tiết kiệm. Không vui lắm.", "Lần sau tôi tự chọn nhân cho chắc."],
  high: ["Ổ {target} ngàn mà nhân như ổ năm chục. Tiệm lỗ chắc luôn. #hờihết", "Tiệm hào phóng quá, ăn mà thấy thương chủ tiệm.", "Nói ổ {target} ngàn, nhận ổ thịnh soạn. Cảm ơn tiệm."],
};
/** Khách quen: "như cũ" làm đúng. */
export const NHU_CU_REVIEW = ["Nói 'như cũ' là tiệm làm đúng y như cũ. Ấm lòng. #kháchquen", "Tiệm nhớ ổ của tôi, tôi nhớ tiệm.", "Như cũ, đúng như cũ, ngon như cũ."];
