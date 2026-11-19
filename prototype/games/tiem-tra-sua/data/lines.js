// Thoại hài đời thường. Biến: {self} khách tự xưng, {call} gọi chủ quán (viết hoa đầu: {Self} {Call}), {drink}, {sugar}, {ice}, {topping}.
// Giọng châm chọc tình huống, tử tế với nhân vật. Chọn câu bằng RNG của ván (core/lines.js) nên tải lại không đổi câu đã hiện.
export const ORDER_LINES = [
  "{Call} ơi, cho {self} một ly {drink}, {sugar} đường, {ice} nha.",
  "Một {drink}, {sugar} đường, {ice}. {Self} đọc thuộc từ hôm qua rồi.",
  "{Call} làm giùm {self} ly {drink}, {sugar} đường, {ice}. Không vội đâu… mà nhanh giùm nha.",
  "Cho {self} {drink}, {sugar} đường với {ice}. Hôm nay {self} quyết tâm sống lành mạnh một nửa.",
  "{Call} ơi {drink}, {sugar} đường, {ice}. Ly này là phần thưởng vì {self} đã dậy được khỏi giường.",
  "{Self} lấy {drink} nha, {sugar} đường, {ice}. Bác sĩ dặn bớt ngọt, {self} bớt… một chút.",
  "{Drink}, {sugar} đường, {ice} nha {call}. {Self} đi bộ 3 cây số chỉ để uống ly này đó.",
  "{Call} ơi, một {drink}, {sugar} đường, {ice}. Thời tiết này không uống là tan chảy luôn.",
  "Cho {self} {drink} {sugar} đường, {ice}. Ví {self} đang khóc nhưng tim {self} cần.",
  "{Call} ơi làm ly {drink}, {sugar} đường, {ice}. Nhớ lắc kỹ như cách cuộc đời lắc {self}.",
  "Một {drink}, {sugar} đường, {ice}. {Self} hứa đây là ly cuối tuần… của ngày hôm nay.",
  "{Call} ơi, {drink}, {sugar} đường, {ice}. {Self} thấy trên mạng khen nên ghé thử nè.",
  "{Self} order {drink}, {sugar} đường, {ice} nha. Ngọt vừa đủ để quên deadline là được.",
  "Cho {self} một {drink} nha {call}, {sugar} đường, {ice}. Hôm nay {self} được khen nên tự thưởng.",
  "{Drink}, {sugar} đường, {ice}. {Call} pha ngon là {self} kể cả xóm nghe.",
  "{Call} ơi, ly {drink} {sugar} đường {ice}. {Self} chờ được, nhưng cái bụng thì không.",
];
export const ORDER_LINES_BY_ARCH = {
  "van-phong": [
    "Em ơi một ly {drink}, {sugar} đường, {ice}. Anh còn 12 phút họp, ly này là đồng đội duy nhất.",
    "Cho anh {drink}, {sugar} đường, {ice}. Sếp vừa nói \"mình trao đổi nhanh nha\" — tức là hai tiếng.",
    "Em ơi {drink}, {sugar} đường, {ice}. Anh vừa gửi mail \"theo như mail trước\" lần thứ ba.",
    "Một {drink}, {sugar} đường, {ice}. Không có ly này chắc anh trả lời khách bằng sticker.",
    "Em làm giùm anh {drink}, {sugar} đường, {ice}. File tên \"final_final_v7\" đang chờ anh.",
  ],
  "khach-quen": [
    "Con ơi, như mọi khi: {drink}, {sugar} đường, {ice}. Cô dặn rồi đó nghen.",
    "Con ơi {drink}, {sugar} đường, {ice}. Thằng cháu cô nó khen quán con quá trời.",
    "Cho cô ly {drink}, {sugar} đường, {ice}. Bữa trước con pha ngon, cô kể nguyên chợ nghe.",
    "Con ơi {drink}, {sugar} đường, {ice} nha. Cô mới đi tập dưỡng sinh về, phải thưởng chứ.",
    "Như cũ nghen con: {drink}, {sugar} đường, {ice}. Mà con ăn cơm chưa đó?",
  ],
  "di-ngang": [
    "Em ơi cho anh ly {drink}, {sugar} đường, {ice}. Anh ghé nhanh, xe còn nổ máy ngoài kia.",
    "Cho anh {drink}, {sugar} đường, {ice}. Bản đồ chỉ anh quẹo trái, mà anh quẹo vô đây.",
    "Em ơi {drink}, {sugar} đường, {ice}. Anh còn 6 đơn giao nữa, ly này tiếp sức.",
    "Một {drink}, {sugar} đường, {ice} nha. Trời nắng tới mức nón bảo hiểm cũng muốn nghỉ.",
  ],
  "hoc-sinh": [
    "Chị ơi cho em ly {drink}, {sugar} đường, {ice}. Em vừa được 8 điểm Toán nên tự thưởng.",
    "Chị ơi {drink}, {sugar} đường, {ice}. Em gom tiền ăn sáng ba ngày cho ly này đó.",
    "Cho em {drink}, {sugar} đường, {ice}. Mẹ hỏi thì chị nói em mua nước lọc nha.",
    "Chị ơi {drink}, {sugar} đường, {ice}. Mai em kiểm tra 15 phút, cần nạp năng lượng.",
    "Em lấy {drink}, {sugar} đường, {ice}. Nhóm em đang chờ em chụp hình check-in.",
  ],
  "reviewer": [
    "Hello chị chủ, cho mình {drink}, {sugar} đường, {ice}. Mình quay nhẹ thôi, chị cứ tự nhiên.",
    "Cho mình {drink}, {sugar} đường, {ice} nha. Clip này mà lên xu hướng là quán nổi luôn.",
    "Mình lấy {drink}, {sugar} đường, {ice}. Chị pha đẹp xíu, khán giả mình khó tính lắm.",
  ],
  "vip": [
    "Em ơi cho chị {drink}, {sugar} đường, {ice}. Chị hơi kỹ tính, mà chị trả tiền sòng phẳng.",
    "Chị lấy {drink}, {sugar} đường, {ice}. Đúng công thức nha em, chị uống là biết liền.",
    "Cho chị một {drink}, {sugar} đường, {ice}. Ly đẹp thì chị giới thiệu cả công ty.",
  ],
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

/** Đơn nhiều ly. {n} = số ly. */
export const ORDER_LINES_MULTI = [
  "{Call} ơi cho {self} {n} ly, ly đầu {drink} {sugar} đường {ice}. Mấy ly kia ghi trên phiếu giùm nha, nhóm chat đang réo.",
  "{Self} gọi {n} ly cho cả phòng. Ai uống gì {self} chụp màn hình gửi {call} rồi đó.",
  "{n} ly nha {call}. {Self} là người duy nhất trong nhóm chịu đi mua, nên ly nào đúng là công của {self}.",
];
export const REVIEW_MULTI = [
  "Cả nhóm {n} ly đúng hết, nhóm chat im lặng vì bận uống.",
  "{N} ly giao một lượt, không ai bị đổi ly. Hiếm có khó tìm.",
];

/** Trả lời review trong Sổ (core/reviews.js). */
export const REPLIES = {
  sorry: { label: "Xin lỗi và hứa sửa", hint: "Ca sau đạt trung bình ≥ 4 sao: danh tiếng +2", followers: 2, buzz: 0 },
  thanks: { label: "Cảm ơn, hẹn quay lại", hint: "+4 người theo dõi", followers: 4, buzz: 0 },
  meme: { label: "Trả lời bằng meme tự giễu", hint: "+12 người theo dõi, tiệm hot nhẹ", followers: 12, buzz: 0.5 },
};
export const REPLY_LINES = {
  sorry: "Tiệm xin lỗi nha, ca sau tụi mình đo lại từng muỗng. Hứa bằng cả cái nắp kêu cạch.",
  thanks: "Cảm ơn bạn! Ly sau tiệm vẫn làm bằng cả trái tim với cái cân.",
  meme: "Tiệm đọc review xong ngồi im lặng 3 giây, rồi đi nấu trân châu tiếp.",
};

/** Câu chốt ca kiểu meme cho Nhật Ký Làm Chủ (core/journal.js chọn theo dữ kiện). Biến {cups} {lost} {profit} {stars} {shop} {multi} {followers}. */
export const CAPTIONS = {
  loss: ["Bán {cups} ly mà lỗ {profit}k. Tiệm đang đầu tư vào… kinh nghiệm.", "Hôm nay lỗ {profit}k nhưng lời được một bài học và ba tấm hình đẹp."],
  lost: ["Bán {cups} ly, {lost} khách bỏ về vì chờ lâu hơn chờ người yêu nhắn lại.", "{lost} khách về tay không. Tiệm hứa ca sau nhanh hơn deadline của sếp."],
  perfect: ["Bán {cups} ly, trung bình {stars} sao. Tiệm chạy mượt như trân châu mới nấu.", "{cups} ly, {stars} sao, 0 drama. Hôm nay tiệm là main character."],
  few: ["Bán {cups} ly. Ca này yên bình tới mức nghe được tiếng đá tan.", "{cups} ly thôi, nhưng ly nào cũng có câu chuyện riêng."],
  good: ["Bán {cups} ly, trung bình {stars} sao. Khách khen, chủ tiệm tự hào, cái nắp kêu cạch đều tay.", "{cups} ly ra quầy, lời {profit}k. Không giàu nhưng rất có tâm."],
  multi: ["Giao trọn {multi} đơn nhóm không đổi nhầm ly nào. Nhóm chat cảm ơn tiệm bằng 14 sticker.", "{multi} đơn nhiều ly, 0 lần ghi nhầm tên trên ly. Kỹ năng hiếm."],
  sugar0: ["Bán {cups} ly và giải thích rằng 0% vẫn là 0%.", "0% đường, 100% hiểu lầm. Tiệm vẫn lời {profit}k."],
  viral: ["Bán {cups} ly và lên mạng: +{followers} người theo dõi. Mẹ hỏi con nổi tiếng chưa.", "Hôm nay tiệm lên xu hướng nhỏ: +{followers} follow, 0 đồng quảng cáo."],
  oops: ["Bán {cups} ly, pha nhầm {oops} lần, khách vẫn cười. Tiệm gọi đó là phong cách.", "{oops} lần nhầm, {cups} ly bán, 1 bài học: đọc phiếu hai lần trước khi đóng nắp."],
  drama: ["Bán {cups} ly, xử lý {drama} tình huống, vẫn giữ được nụ cười và cái nắp.", "Ca này có {drama} drama, {cups} ly và một chủ tiệm bình tĩnh đáng nể."],
};
