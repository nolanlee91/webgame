// Thoại khách trong ca (chọn bằng freshLine, không lặp trong ca). Biến: {self} {call} {Call} {dish} {quirks} {name} {n} {table}.
// Mỗi bảng: default (chung) + theo vai. worker2 dùng thêm câu của worker, student2 dùng thêm câu của student (LINE_ALIAS).
// Giọng: hài đời thường Sài Gòn, tử tế, không thương hiệu, không người thật, không emoji.

export const LINE_ALIAS = { worker2: "worker", student2: "student" };
/** Gộp câu chung + câu riêng của vai (+ vai gần). */
export function pool(table, role) {
  const a = LINE_ALIAS[role];
  return [...(table?.default || []), ...(table?.[role] || []), ...(a ? table?.[a] || [] : [])];
}

/** Gọi món: 18 câu chung + 5 câu mỗi vai. {quirks} = ", thêm cơm, nước mắm để riêng" hoặc rỗng. */
export const ORDER = {
  default: [
    "{Call} ơi, cho {self} một dĩa {dish}{quirks} nha.",
    "Một {dish}{quirks}, cảm ơn {call}.",
    "{Call} làm giùm {self} dĩa {dish}{quirks}.",
    "Cho {self} {dish}{quirks}, đói xỉu rồi {call} ơi.",
    "{Dish}{quirks}. Vậy thôi {call}, nhiêu đó là hạnh phúc rồi.",
    "Dĩa {dish}{quirks} nha {call}, nướng thơm thơm giùm {self}.",
    "{Call} ơi, {dish}{quirks}. Cho {self} xin ly trà đá luôn.",
    "Hôm nay {self} ăn {dish}{quirks}.",
    "Như mọi người thôi {call}: {dish}{quirks}.",
    "Ngửi mùi sườn từ đầu hẻm là biết phải ghé. {Dish}{quirks} nha.",
    "{Self} gọi {dish}{quirks}, không cần nhanh, cần ngon.",
    "{Call} ơi, một {dish}{quirks}. Mỡ hành nhớ rưới cho đẹp nha.",
    "Cho {self} một phần {dish}{quirks}. Bàn này nè {call}.",
    "{Dish}{quirks} một dĩa. Than đỏ vầy chắc sườn ngon lắm.",
    "{Call} chọn giùm {self} miếng sườn đẹp nhất, {dish}{quirks}.",
    "Đi làm cả ngày chỉ nghĩ tới dĩa {dish}{quirks} của {call}.",
    "Một {dish}{quirks}. {Self} ngồi đây chờ, không vội đâu.",
    "{Call} ơi ghi giùm: {dish}{quirks}. Cảm ơn nhiều nha.",
  ],
  office: [
    "Chị ơi, em một {dish}{quirks}, em có hai mươi phút thôi.",
    "Cho em {dish}{quirks}, em ăn nhanh rồi chạy họp.",
    "Một {dish}{quirks} chị nhé, em chuyển khoản được không?",
    "Em gọi {dish}{quirks}. Bàn sạch sạch giùm em xíu nha chị.",
    "{Dish}{quirks}, chị ít dầu mỡ giùm em, em đang giữ dáng… từ mai.",
  ],
  worker: [
    "Cô ơi, {dish}{quirks}! Đói muốn xỉu luôn rồi.",
    "Cho chú dĩa {dish}{quirks}, cơm đầy đầy giùm chú.",
    "Tan ca rồi, cô làm chú dĩa {dish}{quirks}, nước mắm chan đẫm.",
    "{Dish}{quirks}! Đổ bê tông cả chiều, giờ phải đổ cơm vô bụng.",
    "Cô ơi, chú một {dish}{quirks}, xong chú còn ra công trình trực đêm.",
  ],
  worker2: [
    "Chị ơi, em {dish}{quirks}! Cơm em ăn như máy trộn đó chị.",
    "Một {dish}{quirks} nha chị, xúc cơm bằng xẻng giùm em.",
    "Em gọi {dish}{quirks}. Chú Tư bao, nên em gọi to.",
    "Chị cho em {dish}{quirks}, em đói tới mức thấy cái ghế cũng ngon.",
    "{Dish}{quirks}! Chị nướng giùm em miếng to nhất, em cảm ơn trước.",
  ],
  student: [
    "Chị ơi, em {dish}{quirks}. Tháng này em sống nhờ dĩa này đó.",
    "Cho em {dish}{quirks} chị, em mới thi xong, thưởng cho mình.",
    "Em gọi {dish}{quirks}. Cơm thêm có tính tiền không chị, em hỏi trước.",
    "Một {dish}{quirks} nha chị, em ngồi học bài luôn được không?",
    "{Dish}{quirks} chị ơi, ăn xong em chạy deadline tiếp.",
  ],
  student2: [
    "Chị ơi cho em {dish}{quirks}, em chụp hình xíu rồi mới ăn nha.",
    "Em một {dish}{quirks}. Bạn em khen quán chị quá trời.",
    "Cho em {dish}{quirks} chị, em ăn ít nhưng ăn hoài.",
    "{Dish}{quirks} nha chị, hôm nay em ăn mừng vì dậy được lúc 3 giờ chiều.",
    "Em gọi {dish}{quirks}. Chị dễ thương quá, em sẽ quay lại.",
  ],
  shipper: [
    "Chị ơi đơn app: {dish}{quirks}, mang về, em gấp lắm.",
    "Một hộp {dish}{quirks} chị, khách em đang đói ở tầng mười hai.",
    "Chị làm giùm em hộp {dish}{quirks}, bịch nước mắm riêng nha.",
    "Em lấy {dish}{quirks} mang đi, chị gói kỹ giùm em, đường xóc lắm.",
    "Hộp {dish}{quirks} nha chị, em còn ba đơn nữa phía sau.",
  ],
  regular: [
    "Con ơi, cô dĩa {dish}{quirks} như mọi bữa.",
    "Cho cô {dish}{quirks}, nay bán hết vé sớm nên cô ăn mừng.",
    "Cô ăn {dish}{quirks} nghen con, ít thôi, tuổi già rồi.",
    "Con làm cô dĩa {dish}{quirks}, cô ngồi đây nghe radio với con.",
    "{Dish}{quirks} nghen con. Hồi trưa cô kể chuyện tới đâu rồi ta?",
  ],
  reviewer: [
    "Chị ơi cho mình {dish}{quirks}, mình quay xíu được không chị?",
    "Mình gọi {dish}{quirks}. Đây là quán thứ ba tối nay, chị đừng nói ai.",
    "Một {dish}{quirks} chị nhé, mình chấm điểm thật lòng đó.",
    "{Dish}{quirks}. Mình nghe đồn sườn quán chị cháy cạnh chuẩn lắm.",
    "Chị làm giùm mình {dish}{quirks}, đẹp đẹp để lên hình nha.",
  ],
  driver: [
    "Em ơi, anh dĩa {dish}{quirks}, anh chạy cả ngày rồi.",
    "Cho anh {dish}{quirks}, trà đá nhiều nhiều giùm anh.",
    "{Dish}{quirks} em ơi, anh ăn nhanh còn đón khách sân bay.",
    "Anh gọi {dish}{quirks}. Xe đậu ngay đây, em coi giùm anh luôn.",
    "Em làm anh dĩa {dish}{quirks}, khuya rồi chỉ có quán em còn đỏ đèn.",
  ],
  nurse: [
    "Chị ơi, em {dish}{quirks}, em vô ca trực lúc mười giờ.",
    "Cho em {dish}{quirks} chị, cả khoa đói mà mình em được ra.",
    "Em gọi {dish}{quirks}, chị nướng kỹ giùm em nha.",
    "Một {dish}{quirks} chị ơi, em đứng tám tiếng rồi.",
    "{Dish}{quirks} nha chị, ăn xong em chạy về khoa liền.",
  ],
  tourist: [
    "Hello chị, tôi muốn… {dish}{quirks}. Đúng không?",
    "Chị ơi, {dish}{quirks}, please. Tôi tập nói tiếng Việt.",
    "Tôi gọi {dish}{quirks}. Broken rice, very famous, đúng không chị?",
    "Một {dish}{quirks}. Tôi thấy trên mạng, hình đẹp lắm.",
    "Chị ơi, cho tôi {dish}{quirks}. Cay ít ít thôi, cảm ơn chị.",
  ],
};

/** Tới quán, đứng chờ bàn. */
export const ARRIVE = {
  default: [
    "Còn bàn không {call}?", "{Call} ơi, cho {self} {n} chỗ nha.", "Đông quá ta, {self} chờ chút được không {call}?",
    "Mùi sườn kéo {self} vô đây nè {call}.", "{Call} ơi, bàn nào trống vậy?", "Cho {self} ngồi đâu {call}?",
    "{N} người nha {call}.", "{Self} chờ bàn chút nha {call}.",
  ],
  worker: ["Cô ơi, đội chú {n} người, có chỗ không?", "Tan ca rồi! Cô kê giùm chú cái bàn."],
  office: ["Chị ơi, em ăn nhanh, có bàn trống không chị?"],
  student: ["Chị ơi, tụi em {n} đứa, ngồi chung bàn được không?"],
  regular: ["Con ơi, cô ngồi chỗ cũ nghen."],
  driver: ["Em ơi còn chỗ không, anh đậu xe ngoài kia."],
  nurse: ["Chị ơi em có chỗ ngồi không, em vô ca sớm."],
  reviewer: ["Chị ơi, cho mình bàn có ánh đèn đẹp nha."],
  tourist: ["Hello, one table? Một bàn?"],
};
/** Chờ bàn lâu. */
export const WAIT_LONG = {
  default: [
    "{Call} ơi, bàn đó dọn chưa {call}?", "Đứng chờ mỏi chân quá {call} ơi.", "Bàn kia ăn xong rồi kìa {call}.",
    "{Self} chờ nãy giờ đó {call}.", "Có bàn chưa {call}, bụng {self} biểu tình rồi.", "Thôi chắc {self} đi quán khác quá…",
  ],
  office: ["Chị ơi em sắp trễ họp rồi."],
  worker: ["Cô ơi, đội chú đứng muốn mọc rễ luôn."],
};
/** Ngồi rồi mà chưa ai ra (chưa châm trà / chưa lấy phiếu). */
export const SEATED_WAIT = {
  default: [
    "{Call} ơi, gọi món!", "Cho {self} ly trà đá trước nha {call}.", "{Call} ơi, bàn này chưa ai lấy món.",
    "Ngồi nãy giờ khát quá {call}.", "{Call} ơi, ra lấy phiếu giùm {self}.", "Trà đá đâu {call} ơi.",
  ],
  driver: ["Em ơi trà đá, anh khát khô cổ rồi."],
  worker: ["Cô ơi, trà đá cho cả đội!"],
};
/** Ly trà cạn giữa bữa. */
export const TEA_CALL = {
  default: [
    "{Call} ơi, châm giùm {self} ly trà.", "Thêm trà đá {call} ơi.", "Ly {self} cạn rồi {call}.",
    "{Call} ơi trà đá, ăn sườn mà không có trà là nghẹn.", "Cho {self} xin thêm đá nha {call}.", "Trà đá {call} ơi, cảm ơn.",
  ],
  driver: ["Em ơi trà, anh uống như xe đổ xăng."],
  worker: ["Cô ơi châm trà, nóng quá."],
};
/** Chờ món lâu. */
export const FOOD_LATE = {
  default: [
    "{Call} ơi, dĩa của {self} sắp chưa?", "Sườn {self} còn trên vỉ hả {call}?", "{Self} đói lắm rồi {call} ơi.",
    "{Call} ơi, quên bàn {self} hả?", "Bàn bên kia có rồi, bàn {self} chưa có {call}.", "Nhanh giùm {self} nha {call}.",
  ],
  office: ["Chị ơi, em còn mười phút thôi."],
  nurse: ["Chị ơi, em sắp vô ca rồi."],
};
/** Gọi thêm giữa bữa. */
export const REQUEST = {
  com: ["{Call} ơi, thêm chén cơm!", "Cho {self} xin thêm cơm nha {call}.", "Cơm ngon quá, thêm một chén {call} ơi.", "{Call}, chén cơm nữa giùm {self}.", "Thêm cơm {call} ơi, sườn còn mà cơm hết rồi."],
  khan: ["{Call} ơi, cho {self} cái khăn lạnh.", "Khăn lạnh {call} ơi.", "Cho {self} xin khăn lạnh nha {call}.", "{Call}, một khăn lạnh giùm {self}."],
};
/** Gọi tính tiền. */
export const BILL_CALL = {
  default: [
    "{Call} ơi, tính tiền!", "Tính tiền giùm {self} nha {call}.", "{Call} ơi, bao nhiêu vậy?", "Ăn xong rồi, tính tiền {call} ơi.",
    "{Call}, tính giùm bàn này.", "No quá, tính tiền {call} ơi.",
  ],
  office: ["Chị ơi em chuyển khoản nha, tính tiền giùm em."],
  student: ["Chị ơi tính tiền, tụi em chia đều nha."],
  worker: ["Cô ơi, tính tiền! Chú trả hết."],
  regular: ["Con ơi, tính tiền cô."],
};
/** Ăn xong vui (khách 4–5 sao, khi trả tiền). */
export const HAPPY = {
  default: [
    "Ngon quá {call}, mai {self} quay lại.", "Sườn thơm ghê {call}.", "Cảm ơn {call}, no căng bụng.", "Dĩa này đáng tiền lắm {call}.",
    "Mỡ hành ngon dữ {call} ơi.", "Ăn xong muốn gọi dĩa nữa luôn.", "Quán {call} số một khu này.", "Nước mắm vừa miệng ghê {call}.",
  ],
  worker: ["Ngon! Mai chú dẫn cả đội qua."],
  student: ["Ngon xỉu chị ơi, em review năm sao."],
  regular: ["Con nướng khéo tay ghê."],
  tourist: ["Very good! Ngon lắm chị!"],
};
/** Ăn xong không vui (1–2 sao). */
export const UNHAPPY = {
  default: [
    "Thôi được rồi {call}.", "Lần sau {call} kỹ hơn nha.", "Ăn cũng được {call}…", "{Self} hơi buồn đó {call}.",
    "Hôm nay quán không được như mọi bữa.", "Dĩa này chưa tới {call} ơi.",
  ],
};
/** Bỏ về vì chờ lâu (chờ bàn hoặc chờ món). */
export const TIMEOUT = {
  default: [
    "Thôi {self} đi quán khác.", "Chờ lâu quá, {self} về.", "Hết kiên nhẫn rồi {call} ơi.", "Đói quá không chờ nổi nữa.",
    "Mai {self} ghé lại, nay hết giờ rồi.", "Quán đông quá, {self} đi chỗ khác nha.",
  ],
  office: ["Em trễ họp rồi, em đi đây."],
  worker: ["Đội chú đi quán khác, đói quá rồi."],
};
/** Hết món, cô chủ xin lỗi khách đã gọi. */
export const SOLD_OUT = [
  "Hết món rồi hả {call}? Thôi để bữa khác.", "Tiếc ghê, {self} ghé lại sau.", "Không sao {call}, mai {self} quay lại.",
  "Vậy {self} uống ly trà rồi về.", "Hết sớm vậy chắc quán đắt hàng ha {call}.",
];
/** Khách quen "như hôm qua". */
export const NHU_CU = [
  "Như hôm qua nha con.", "Như cũ con ơi.", "Con nhớ cô ăn gì mà, làm như hôm qua.", "Dĩa quen của {self} nha {call}.", "Như bữa trước, khỏi hỏi.",
];
/** Khách đổi sang bánh mì sườn khi hết cơm. */
export const BREAD_SWAP = [
  "Bánh mì sườn cũng được {call}, miễn sườn ngon.", "Hết cơm thì bánh mì, {self} dễ mà.", "Bánh mì sườn hả? Nghe lạ mà hấp dẫn.",
];
/** Câu cô chủ / thông báo vận hành. */
export const OPS = {
  coalLow: ["Than sắp tàn, thêm rổ than đi!", "Lửa yếu rồi, sườn chín chậm lắm.", "Than xám dần rồi kìa."],
  coalOut: ["Than tàn rồi! Sườn không chín nữa.", "Hết lửa! Thêm than gấp."],
  flare: ["Lửa bùng! Vùng nóng chín gấp đôi, coi chừng cháy.", "Ối, mỡ nhỏ xuống, lửa bốc cao!"],
  smoke: ["Khói mù mịt, khách gần bếp ho rồi.", "Khói dày quá, bớt quạt lại đi.", "Hàng xóm bắt đầu nhìn qua vì khói."],
  burnt: ["Miếng sườn cháy đen rồi.", "Một miếng thành than luôn rồi.", "Cháy rồi, bỏ miếng đó đi."],
  riceLow: ["Nồi cơm sắp hết, nấu mẻ mới đi.", "Còn ít cơm lắm rồi."],
  plateLow: ["Dĩa sạch sắp hết, rửa chén đi.", "Thau chén đầy rồi kìa."],
};
