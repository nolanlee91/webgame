// Thoại hài đời thường. Biến: {self} khách tự xưng, {call} gọi chủ quán (viết hoa đầu: {Self} {Call}), {drink}, {sugar}, {ice}, {topping}.
// Giọng châm chọc tình huống, tử tế với nhân vật. Chọn câu bằng RNG của ván (core/lines.js) nên tải lại không đổi câu đã hiện.
export const ORDER_LINES = [
  "{Call} ơi, cho {self} một ly {drink}, {sugar} đường, {ice} nha.",
  "Một {drink}, {sugar} đường, {ice}. {Self} đọc thuộc từ hôm qua rồi.",
  "{Call} làm giùm {self} ly {drink}, {sugar} đường, {ice}. Không vội đâu… mà nhanh giùm nha.",
  "Cho {self} {drink}, {sugar} đường với {ice}. Hôm nay {self} quyết tâm sống lành mạnh một nửa.",
];
export const ORDER_LINES_BY_ARCH = {
  "van-phong": ["Em ơi một ly {drink}, {sugar} đường, {ice}. Anh còn 12 phút họp, ly này là đồng đội duy nhất."],
  "khach-quen": ["Con ơi, như mọi khi: {drink}, {sugar} đường, {ice}. Cô dặn rồi đó nghen."],
  "di-ngang": ["Em ơi cho anh ly {drink}, {sugar} đường, {ice}. Anh ghé nhanh, xe còn nổ máy ngoài kia."],
  "hoc-sinh": ["Chị ơi cho em ly {drink}, {sugar} đường, {ice}. Em vừa được 8 điểm Toán nên tự thưởng."],
};

export const IMPATIENT_LINES = [
  "{Call} ơi, ly của {self} đang ở bước nào rồi?",
  "{Self} đứng đây lâu tới mức thuộc luôn menu.",
  "Không hối đâu… {self} chỉ nhìn đồng hồ thôi.",
  "Ủa ly của {self} có đang được tạo ra không {call}?",
];

/** Câu review theo lỗi lớn nhất (ưu tiên từ trên xuống), rồi theo số sao. */
export const REVIEW_LINES = {
  sugarHigh: ["Ngọt quá {call} ơi, ly này ngọt như lời hứa đầu tháng.", "{Self} gọi {sugar} đường mà ly này tự tăng lương cho mình."],
  sugarLow: ["{Self} gọi {sugar} đường mà ly này giữ dáng giùm {self} luôn rồi.", "Nhạt nhẹ nhàng, như tin nhắn \"ừ\" lúc 11 giờ đêm."],
  iceHigh: ["Đá nhiều tới mức {self} tưởng mua nước đá có vị trà.", "Ly này mát lạnh… chủ yếu là đá thôi."],
  iceLow: ["Ít đá quá, ly đổ mồ hôi còn nhiều hơn {self}.", "{Self} gọi {ice} mà đá ở đây chơi trốn tìm."],
  toppingMissing: ["{Topping} đâu {call}? {Self} nhai không khí nãy giờ.", "Ly ngon, mà {topping} chắc đi vắng."],
  toppingWrong: ["{Self} gọi {topping}, ly này cho {self} một bất ngờ khác.", "Topping lạ ghê, chắc là bản cập nhật mới."],
  toppingExtra: ["Ủa có topping tặng hả? {Self} không gọi mà vẫn cảm động."],
  addWrong: ["Vị này lạ lắm, như playlist bị ai đó bấm trộn bài."],
  slow: ["Ngon, mà chờ lâu tới mức {self} đọc hết điều khoản sử dụng app.", "Đáng chờ… nhưng lần sau chờ ít thôi nha {call}."],
  5: ["Đúng chuẩn luôn! {Call} là chuyên gia đo lường hả?", "Ly này ngon tới mức {self} quên luôn deadline.", "Năm sao, thêm một sao tưởng tượng cho cái nắp kêu cạch."],
  4: ["Ngon nha, lần sau {self} quay lại.", "Ổn áp, {self} chấm điểm cao, trừ hao vì mình khó tính."],
  3: ["Uống được, như một ngày thứ Tư bình thường.", "Không tệ, không xuất sắc, rất trung lập."],
  2: ["Ly này… có cố gắng. {Self} ghi nhận sự cố gắng."],
  1: ["Thôi, {self} xin phép đánh giá bằng ánh mắt."],
};
export const TIMEOUT_LINES = {
  default: ["Thôi {self} đi, chờ thêm chắc {self} thành cổ đông của quán.", "{Self} về đây, ly trà sữa này để kiếp sau."],
  "van-phong": ["Sếp gọi lần thứ ba rồi, anh chạy đây em!"],
  "khach-quen": ["Thôi cô về nấu cơm, mai cô ghé. Mai nhanh nhanh nghen con."],
  "di-ngang": ["Đơn của anh sắp trễ, anh đi đây, hẹn em kiếp shipper sau!"],
  "hoc-sinh": ["Chuông vào học rồi chị ơi, em chạy!"],
};
export const TIMEOUT_REVIEW = [
  "Đứng chờ mỏi chân rồi về. Một sao cho đôi giày.",
  "Chưa uống mà đã thấy no… no chờ đợi.",
  "Quán dễ thương, nhưng {self} chưa kịp biết ly trà vị gì.",
];

/** Khách nhận ly sai món nền: hội thoại chọn cách xử lý (nền cho sự kiện C01 ở Milestone 4). */
export const COMPLAINT = {
  line: "{Self} gọi {drink}. Ly này rõ ràng là… một trải nghiệm khác.",
  barista: "Ơ… để em xem lại phiếu chút.",
  choices: [
    { id: "remake", label: "Làm lại ly mới", hint: "Ly sai bỏ đi (tính hao hụt), khách chờ thêm 20 giây" },
    { id: "discount", label: "Năn nỉ nhận, giảm nửa giá", hint: "Thu nửa tiền, review tối đa 2 sao" },
    { id: "refund", label: "Xin lỗi, không lấy tiền", hint: "Không thu tiền, ly bỏ đi; khách ghi nhận lời xin lỗi (2 sao)" },
  ],
  after: {
    remake: "Được, {self} chờ thêm chút. Lần này đúng {drink} nha.",
    discount: "Thôi được, coi như {self} thử món mới. Nhưng {self} ghi nhớ đó.",
    refund: "Không sao, ai cũng có ngày bấm nhầm. {Self} ghé lại sau.",
  },
};

export const BARISTA_REACT = {
  served5: ["Ly này em làm bằng cả trái tim với cái cân."],
  timeout: ["Ơ khoan… em sắp xong rồi mà…"],
  empty: ["Chưa có khách. Lau quầy lần thứ năm cho bóng."],
};

/** Câu chốt ca vui (Nhật Ký Làm Chủ Milestone 4 dùng lại). Biến {cups} {lost} {profit} {stars}. */
export const HEADLINES = {
  perfect: "Bán {cups} ly, không ai bỏ về. Hôm nay tiệm chạy mượt như trân châu mới nấu.",
  lost: "Bán {cups} ly, {lost} khách bỏ về vì chờ lâu hơn chờ người yêu nhắn lại.",
  loss: "Bán {cups} ly mà lỗ {profit}k. Tiệm đang đầu tư vào… kinh nghiệm.",
  few: "Bán {cups} ly. Ca này yên bình tới mức nghe được tiếng đá tan.",
  good: "Bán {cups} ly, trung bình {stars} sao. Khách khen, chủ tiệm tự hào, cái nắp kêu cạch đều tay.",
};
