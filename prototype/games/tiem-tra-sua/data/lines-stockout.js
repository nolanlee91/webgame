// Hết hàng giữa ca: câu nhân viên khi hàng sắp hết / đã hết (theo nhóm hàng), câu khách và review theo từng cách xử lý,
// câu Anh Tèo shipper, chị Lụa Hẻm Bên, câu chốt ca Nhật Ký. Mọi bảng chọn bằng freshLine (core/shift.js) ⇒ không lặp trong ca.
// Biến: {item} tên hàng (chữ thường), {name} {self} {call} {Call} {drink} {sub} (món thay), {shop}, {n} (số phần còn lại).
// Nhân vật hư cấu, không thương hiệu thật.

/** Nhóm hàng của từng mã kho (data/ingredients.js STOCK). */
export const STOCK_KIND = {
  "ly": "cup", "hong-tra": "tea", "o-long": "tea", "tra-lai": "tea", "matcha": "tea", "sua": "milk", "kem-sua": "milk",
  "duong": "sugar", "duong-den": "sugar", "da": "ice", "tran-chau-song": "topping", "thach": "topping", "pudding": "topping",
  "dao": "fruit", "vai": "fruit", "chanh-day": "fruit",
};

/** Nhân viên nhắc khi hàng còn ≤ 2 phần (toast + bong bóng). */
export const LOW_LINES = {
  cup: [
    "Chị chủ ơi, ly sắp hết rồi đó! Còn {n} cái thôi.",
    "Chồng ly còn {n} cái, mỏng như lời hứa giảm cân đầu năm.",
    "Ly còn {n}. Hết ly là mình rót vô tay khách đó chị.",
    "Báo động đỏ: ly nhựa còn {n}. Nắp thì còn, mà nắp không đựng trà được.",
    "Chị ơi, ly sắp cạn. Em đếm đi đếm lại vẫn {n} cái.",
    "Ly còn {n} cái. Em đề nghị mình đi mua trước khi phải dùng ly súc miệng.",
    "Còn {n} ly. Khách mà gọi đơn nhóm là mình toang.",
    "Ly sắp hết rồi chị chủ, chồng ly lùn hơn em luôn rồi.",
  ],
  tea: [
    "Chị chủ ơi, {item} còn {n} phần thôi đó!",
    "{Item} sắp hết, bình trà kêu rột rột nghe thấy thương.",
    "{Item} còn {n} phần. Pha loãng là khách biết liền nha chị.",
    "Báo cáo: {item} còn {n}. Em không pha bằng nước lọc được đâu.",
    "Hũ {item} thấy đáy rồi chị ơi, còn {n} phần.",
    "{Item} còn {n}. Trà sữa mà thiếu trà thì thành sữa thôi chị.",
    "Chị ơi {item} sắp cạn, em ngửi thấy mùi khủng hoảng.",
    "{Item} còn {n} phần, ai gọi món trà là mình đếm từng giọt.",
  ],
  milk: [
    "Chị chủ ơi, {item} còn {n} phần!",
    "{Item} sắp hết rồi, hộp lắc nghe lóc cóc.",
    "{Item} còn {n}. Trà sữa không sữa là trà buồn đó chị.",
    "Báo động {item}: còn {n} phần, em không vắt thêm được đâu.",
    "{Item} sắp cạn, em đề nghị nhập trước giờ cao điểm.",
    "{Item} còn {n} phần thôi, em giữ như giữ vàng.",
    "Chị ơi {item} chỉ còn {n}. Khách văn phòng mà ùa vô là hết vèo.",
    "{Item} còn {n}. Em bắt đầu thấy lo cho ly trà sữa kế tiếp.",
  ],
  sugar: [
    "Chị chủ ơi, {item} còn {n} phần!",
    "{Item} sắp hết. Ai gọi 100% là em toát mồ hôi.",
    "{Item} còn {n}. May mà nhiều khách gọi 0%… mà cũng hết ngọt rồi.",
    "Hũ {item} còn {n} phần, ngọt ngào sắp thành kỷ niệm.",
    "{Item} sắp cạn chị ơi, cuộc đời sắp hết ngọt.",
    "{Item} còn {n}. Em xin phép không pha 100% nữa nha.",
    "Chị ơi {item} còn có {n}, em cạo đáy hũ được thêm một muỗng thôi.",
    "Báo động ngọt: {item} còn {n} phần.",
  ],
  ice: [
    "Chị chủ ơi, đá còn {n} phần thôi!",
    "Thùng đá còn {n}, trời thì nóng như muốn thử lòng mình.",
    "Đá sắp hết. Khách gọi nhiều đá là mình xin lỗi trước.",
    "Đá còn {n} phần, đang tan thêm trong lúc em nói câu này.",
    "Chị ơi đá sắp cạn, trà sữa nóng mùa này không ai uống đâu.",
    "Đá còn {n}. Em canh từng cục như canh tiền thối.",
    "Báo động: đá còn {n}. Em nghe tiếng thùng đá thở dài.",
    "Đá sắp hết chị ơi, sắp tới phải gọi món \"ấm áp\" rồi.",
  ],
  topping: [
    "Chị chủ ơi, {item} còn {n} phần!",
    "{Item} sắp hết, khách học sinh mà biết là buồn cả lớp.",
    "{Item} còn {n}. Ly không topping là ly cô đơn đó chị.",
    "Báo động topping: {item} còn {n} phần.",
    "{Item} sắp cạn, em múc nhẹ tay lắm rồi.",
    "Chị ơi {item} còn {n}. Đứa nào gọi thêm topping là em né.",
    "{Item} còn {n} phần thôi, hũ nhìn trống trải ghê.",
    "{Item} sắp hết rồi chị, nhập thêm kẻo khách hỏi \"topping đâu\".",
  ],
  fruit: [
    "Chị chủ ơi, {item} còn {n} phần!",
    "{Item} sắp hết, trà trái cây sắp thành trà… tưởng tượng.",
    "{Item} còn {n}. Khách mà gọi liền hai ly là hết.",
    "Báo động trái cây: {item} còn {n} phần.",
    "Hộp {item} còn {n}, em thấy được đáy hộp rồi.",
    "{Item} sắp cạn chị ơi, em cắt mỏng lắm rồi đó.",
    "{Item} còn {n} phần. Món trái cây hôm nay sắp thành món hiếm.",
    "Chị ơi {item} còn có {n}, nhập thêm đi chị.",
  ],
};

/** Câu mở hội thoại khi hàng đã hết (nhân viên nói, theo nhóm hàng). */
export const OUT_LINES = {
  cup: [
    "Chị chủ ơi… hết ly rồi. Hết sạch. Em lục cả gầm quầy.",
    "Ly hết rồi chị! Khách đang chờ mà mình không có gì để rót vô.",
    "Em đưa tay lấy ly mà chỉ chạm được không khí.",
    "Hết ly. Em đã kiểm tra ba lần, kể cả trong túi áo.",
    "Chị ơi, chồng ly biến mất rồi. Còn lại cái nắp cô đơn.",
    "Hết ly rồi chị! Trừ khi mình bán trà sữa đựng trong tay.",
  ],
  tea: [
    "Chị chủ ơi, hết {item} rồi! Bình trống trơn.",
    "Hết {item}. Em lắc bình nghe tiếng vọng.",
    "Không còn giọt {item} nào hết chị ơi.",
    "{Item} hết sạch, khách đang chờ ly có trà.",
    "Chị ơi hết {item}, em không dám pha bằng nước lọc đâu.",
    "Hũ {item} trống rồi. Cái này gọi là trà sữa thiếu trà.",
  ],
  milk: [
    "Chị chủ ơi, hết {item} rồi!",
    "Hết {item}. Hộp cuối em vắt tới giọt cuối rồi.",
    "{Item} hết sạch, trà sữa đang chuẩn bị thành trà đen.",
    "Chị ơi không còn {item}, khách đang chờ ly béo.",
    "Hết {item} rồi chị. Em mở tủ ra chỉ thấy hộp rỗng.",
    "{Item} không còn chút nào chị ơi.",
  ],
  sugar: [
    "Chị chủ ơi, hết {item} rồi!",
    "Hết {item}. Ai gọi ngọt là mình chỉ còn cách ăn nói ngọt.",
    "{Item} hết sạch, hũ trống trơn.",
    "Chị ơi hết {item}, cuộc đời tạm thời không ngọt.",
    "Không còn {item}. Em cạo đáy hũ rồi, không ra được hạt nào.",
    "Hết {item} rồi chị, khách đang chờ đúng mức ngọt.",
  ],
  ice: [
    "Chị chủ ơi, hết đá rồi!",
    "Thùng đá trống, chỉ còn nước tan.",
    "Hết đá. Trà sữa nóng giữa trưa, khách chắc chạy mất.",
    "Chị ơi không còn cục đá nào, em mở thùng ra thấy hơi lạnh thôi.",
    "Đá hết sạch, khách đang chờ ly mát.",
    "Hết đá rồi chị! Em đề nghị mình làm gì đó trước khi trời nóng hơn.",
  ],
  topping: [
    "Chị chủ ơi, hết {item} rồi!",
    "Hết {item}, hũ trống trơn.",
    "{Item} hết sạch. Khách đang chờ ly có topping.",
    "Chị ơi không còn {item}, khách học sinh mà biết là buồn.",
    "Hết {item} rồi chị, em múc chỉ ra không khí.",
    "{Item} không còn phần nào chị ơi.",
  ],
  fruit: [
    "Chị chủ ơi, hết {item} rồi!",
    "Hết {item}. Hộp trái cây trống trơn.",
    "{Item} hết sạch, trà trái cây thiếu trái cây.",
    "Chị ơi không còn {item}, khách đang chờ ly thơm mùi trái.",
    "Hết {item} rồi chị, em lục tủ lạnh hai lần.",
    "{Item} không còn miếng nào chị ơi.",
  ],
};

/** Câu chủ tiệm nói khi chọn từng cách xử lý (hiện ở bảng hậu quả, lưu Nhật Ký). */
export const CHOICE_SAY = {
  run: [
    "Trông tiệm giùm chị một chút, chị chạy ra tạp hoá Dì Ba mua {item} liền!",
    "Ba chân bốn cẳng ra đầu hẻm. Ai hỏi thì nói chủ tiệm đi tập thể dục.",
    "Chị chạy đi mua {item}, mười lăm giây quay lại. Mười lăm giây kiểu Việt Nam.",
    "Khách ơi chờ chút, chủ tiệm đi săn {item} về liền!",
    "Chạy! Không ai thấy chủ tiệm chạy nhanh vậy từ hồi thi thể dục lớp chín.",
    "Mua gấp {item}! Dì Ba tính thêm tiền \"phí hớt hải\" cũng chịu.",
  ],
  shipper: [
    "Alo anh Tèo hả, mua giùm em {item} nha, gấp lắm!",
    "Anh Tèo ơi cứu em, ghé tạp hoá lấy {item} giùm, em gửi tiền xăng.",
    "Gọi Anh Tèo. Ảnh nói \"mười phút\", mà mười phút của ảnh là bí ẩn.",
    "Nhờ Anh Tèo mua {item}. Em nhắn ba lần chữ {item} cho chắc.",
    "Anh Tèo ơi, {item} nha, không phải món khác nha, {item} đó!",
    "Đặt Anh Tèo mua giùm. Tiền tip đủ để ảnh chạy nhanh hơn đèn đỏ… không, chạy đúng luật nha anh.",
  ],
  borrow: [
    "Chị Lụa ơi, cho em mượn đỡ ít {item}, mai em trả liền.",
    "Qua tiệm Hẻm Bên mượn {item}. Nuốt tự ái xuống uống với trà.",
    "Em sang xin chị Lụa ít {item}. Chị cười một cái nghe lạnh gáy.",
    "Mượn chị Lụa {item}, hứa trả đủ, có khi trả thêm một nụ cười gượng.",
    "Hàng xóm tối lửa tắt đèn có nhau, nay tiệm mình tắt {item}.",
    "Chị Lụa ơi, cho em xin ít {item}. Em ghi sổ đàng hoàng nha chị.",
  ],
  swap: [
    "{Call} ơi, {item} vừa hết, đổi qua {sub} được không, ngon không kém đâu!",
    "Hôm nay tiệm đề cử {sub} thay cho {drink}, vì lý do kỹ thuật tên là \"quên nhập hàng\".",
    "{Call} thử {sub} nha, món này đang được tiệm… bắt buộc giới thiệu.",
    "Đổi qua {sub} giùm tiệm nha {call}, tiệm hứa ngon bằng.",
    "{Drink} tạm nghỉ, {sub} lên sóng. {Call} thử không?",
    "Thành thật thì tiệm hết {item}. Thành thật hơn nữa thì {sub} cũng ngon lắm.",
  ],
  close: [
    "Hôm nay tiệm xin đóng cửa sớm. Lý do: thiếu {item}, thừa xấu hổ.",
    "Kéo cửa. Treo bảng \"Hết {item}, hẹn mai\".",
    "Thôi đóng cửa sớm, về nhà suy ngẫm về việc kiểm kho.",
    "Tiệm đóng cửa sớm vì… quên mua {item}. Ngày mai sẽ khác.",
    "Xin lỗi cả nhà, tiệm nghỉ sớm. {Item} hết, tinh thần cũng hết.",
    "Đóng cửa sớm. Có những ngày mình phải biết dừng, nhất là khi hết {item}.",
  ],
  consign: [
    "Dì Ba ơi, ký gửi giùm con ít {item}, bán tới đâu con trả tới đó.",
    "Gọi Dì Ba. Dì nói \"lại quên nhập hả con\" rồi vẫn mang ra.",
    "Dì Ba mang {item} qua ký gửi, kèm một bài giảng ngắn về kiểm kho.",
    "Nhờ Dì Ba ký gửi {item}. Dì ghi sổ, con ghi lòng.",
  ],
};

/** Khách đang chờ lúc chủ tiệm chạy đi mua (bong bóng thoại). */
export const AWAY_SAY = [
  "Ủa chủ tiệm đâu rồi?",
  "{Self} thấy chủ tiệm chạy vụt qua, chắc có chuyện lớn.",
  "Quầy trống trơn, {self} đứng canh giùm luôn nè.",
  "Tiệm gì mà chủ chạy nhanh hơn khách vậy?",
  "{Self} chờ thêm chút, mà chút này hơi dài nha.",
  "Không ai pha hả? Hay {self} vô pha giùm?",
  "Chủ tiệm đi mua hàng hả? Thôi {self} lướt điện thoại chờ.",
  "{Self} nghe nói hết hàng. Ráng chờ coi có đáng không.",
  "Đứng trước quầy không người, {self} thấy mình như đang triển lãm.",
  "Chủ tiệm về kịp không ta, {self} đếm tới một trăm rồi.",
];
/** Chủ tiệm vừa chạy về (toast). */
export const BACK_LINES = [
  "Về rồi! Thở không ra hơi nhưng có {item}.",
  "Đã về với {item}. Dì Ba nói lần sau nhập sớm giùm.",
  "Chủ tiệm trở lại, tay xách {item}, mặt đỏ như trái cà chua.",
  "Về tới quầy, {item} đủ dùng. Tim đập như giờ cao điểm.",
  "Mua được {item}! Chạy lẹ tới mức dép muốn ở lại tiệm Dì Ba.",
  "Đã có {item}. Khách vỗ tay, không biết khen hay mỉa.",
];

/** Review của khách phải chờ lúc chủ tiệm chạy đi mua (chọn khi giao ly cho khách đó). */
export const RUN_REVIEW = [
  "Đang chờ thì thấy chủ tiệm chạy vụt ra ngoài. Năm phút sau về với bịch hàng. Trà ngon, tim mệt. #chocothoi",
  "Tiệm hết hàng giữa chừng, chủ tự chạy đi mua. Thành ý có, kế hoạch không. #trasuachaybo",
  "Lần đầu thấy chủ tiệm chạy marathon vì ly trà của mình. Cảm động nhẹ. #tiemnhonhinh",
  "Chờ hơi lâu vì tiệm hết đồ. Bù lại được xem chủ tiệm chạy, giải trí miễn phí. #reviewthat",
  "Quầy trống một lúc, tưởng tiệm bỏ đi luôn. May quay về kịp. #suytbo",
  "Chủ tiệm chạy đi mua hàng, về pha ly vẫn đúng ý. Cho điểm cố gắng. #cogang",
  "Trà ngon nhưng tiệm cần cái sổ kiểm kho. Mình tặng một cuốn cũng được. #gopy",
  "Tiệm hết hàng, chủ chạy đi mua, mình đứng giữ tiệm giùm. Coi như mình có cổ phần. #codong",
  "Đợi chủ tiệm chạy đi mua về mới có ly. Ly ngon, mà mồ hôi chủ tiệm còn ngon hơn… nói vậy thôi. #hehe",
  "Hết hàng giữa ca nhưng xử lý nhanh. Lần sau nhập dư ra giùm nha chủ tiệm. #nhacnho",
];
/** Khách đồng ý đổi món. */
export const SWAP_YES_SAY = [
  "Được thôi, {sub} cũng được, {self} dễ tính mà.",
  "Đổi thì đổi, {self} thích thử món mới.",
  "{Sub} hả? Ok luôn, miễn mát là được.",
  "Thôi {self} chiều tiệm lần này, {sub} nha.",
  "Nghe {call} nói chắc nịch vậy thì {self} thử.",
  "{Self} đổi, nhưng ngon thì phải kể cho bạn nghe đó.",
  "Ok {sub}. Ghi nợ {self} một ly {drink} lần sau nha.",
  "Được. Hôm nay {self} là người linh hoạt.",
];
export const SWAP_YES_REVIEW = [
  "Gọi {drink} mà tiệm hết đồ, được mời {sub}. Uống thử thấy cũng hợp. #doimon",
  "Tiệm hết hàng nên mình đổi món. Ai dè món thay còn ngon hơn. #trongcaixaucodiemtot",
  "Đổi qua {sub} theo lời chủ tiệm. Không thất vọng. #tingioiythieu",
  "Hết {item} nên tiệm gợi ý {sub}. Chủ tiệm nói khéo, ly cũng ổn. #okela",
  "Chưa uống được {drink} nhưng {sub} cứu ngày của mình. #duyen",
  "Tiệm thật thà nói hết hàng, gợi ý món khác hợp lý. Ủng hộ. #thatthagiaobe",
  "Mình dễ tính đổi món, tiệm pha {sub} chuẩn. Lần sau quay lại uống {drink}. #henlansau",
  "Đổi món bất đắc dĩ thành phát hiện mới. #monmoi",
  "{Sub} thay {drink}: điểm cộng cho sự linh hoạt. Điểm trừ cho kho hàng. #congtru",
];
/** Khách không chịu đổi, bỏ về. */
export const SWAP_NO_SAY = [
  "Thôi, {self} đi đường xa tới đây vì {drink} mà.",
  "{Self} không đổi đâu, {self} chung thủy với {drink}.",
  "Không có {drink} thì {self} về, hẹn tiệm hôm khác.",
  "Đổi gì mà đổi, {self} đã tưởng tượng vị {drink} từ sáng.",
  "Thôi khỏi, {self} qua tiệm khác cho nhanh.",
  "{Self} cảm ơn nha, nhưng {self} chỉ uống {drink}.",
  "Không được, {self} đã hứa với bạn mua {drink} rồi.",
  "Lần sau nhớ nhập đủ hàng nha {call}. {Self} về đây.",
];
export const SWAP_NO_REVIEW = [
  "Tới gọi {drink}, tiệm hết đồ, mời món khác. Mình không đổi, đi về tay không. #hetmon",
  "Tiệm hết {item} giữa giờ, mình về. Hi vọng lần sau có đủ. #henlansau",
  "Đi xa tới mà tiệm hết món. Buồn hơn ly trà không đường. #thatvong",
  "Gợi ý đổi món nhưng mình chỉ muốn {drink}. Về tiệm khác. #chungthuy",
  "Tiệm thành thật nói hết hàng, mình cảm ơn nhưng vẫn về. #kosao",
  "Không có {drink}, không có mình. #nguyentac",
  "Chủ tiệm năn nỉ đổi món mà mình cứng đầu. Lỗi một phần ở mình, phần lớn ở kho hàng. #tuky",
  "Ghé tiệm thì hết hàng. Mong tiệm kiểm kho trước khi mở cửa. #gopy",
  "Hết {item} mà mở bán, khách tới chỉ để nghe xin lỗi. #trasuaao",
];
/** Đóng cửa sớm: khách đang chờ nói + review. */
export const CLOSE_SAY = [
  "Ủa đóng cửa hả? {Self} mới tới mà!",
  "Thôi được, {self} về. Nhớ mai mở cửa nha.",
  "Đóng cửa sớm vì hết hàng? Nghe vừa thương vừa tức.",
  "{Self} đứng chờ nãy giờ để nghe chữ \"đóng cửa\".",
  "Không sao, {self} về ngủ sớm luôn.",
  "Tiệm đóng sớm hả {call}? Vậy mai {self} tới sớm.",
  "Hết hàng là hết duyên, {self} về.",
  "{Self} hiểu mà, ai cũng có ngày quên mua đồ.",
  "Đóng cửa sớm thì {self} ghé tiệm Hẻm Bên vậy.",
  "Lần đầu thấy tiệm đóng cửa vì hết… cái đó.",
];
export const CLOSE_REVIEW = [
  "Đang xếp hàng thì tiệm đóng cửa vì hết hàng. Ít nhất được cười. #dongcuasom",
  "Tiệm đóng cửa sớm vì quên nhập hàng. Mình về, hẹn mai. #henmai",
  "Chưa kịp gọi đã nghe \"tiệm nghỉ sớm\". Tiệc tan khi mình vừa tới. #toibuon",
  "Tiệm hết {item} nên đóng cửa. Đây là review cho cái cửa. #reviewcaicua",
  "Chờ mười phút để xem tiệm kéo cửa. Trải nghiệm độc lạ. #docla",
  "Tiệm thành thật đóng cửa sớm, xin lỗi đàng hoàng. Mai mình quay lại. #tutepoint",
  "Bảng ghi \"Hết {item}, hẹn mai\". Mình sẽ nhớ cái bảng này lâu. #bangnoi",
  "Đóng cửa sớm vì hết hàng. Tiệm nhỏ dễ thương mà kho hàng hơi mơ màng. #kiemkhogiumnha",
  "Đi uống trà sữa, về với một câu chuyện. #trasuakhongtra",
  "Tiệm nghỉ sớm, mình nghỉ uống. Công bằng. #hoatiec",
];
/** Anh Tèo shipper. */
export const TEO_RIGHT = [
  "Anh Tèo tới rồi! Đúng {item}, đúng số, đúng người.",
  "Anh Tèo giao {item}, kèm câu \"lần sau đặt trước giùm anh\".",
  "Anh Tèo tới, mồ hôi nhễ nhại, {item} còn nguyên.",
  "{Item} tới tay. Anh Tèo nháy mắt: \"tip xứng đáng\".",
  "Anh Tèo giao {item}, tiện hỏi luôn có ly trà nào cho anh không.",
  "Anh Tèo: \"Giao hàng thần tốc, đánh giá năm sao nha em.\"",
];
export const TEO_WRONG = [
  "Anh Tèo tới… với {wrong}. \"Anh nghe em nói {wrong} mà?\"",
  "Anh Tèo mang về {wrong} thay vì {item}. Ảnh khẳng định tin nhắn bị lỗi font.",
  "Anh Tèo giao {wrong}. \"Hai chữ đó viết giống nhau mà em.\" Không giống.",
  "Mở túi ra là {wrong}. Anh Tèo gãi đầu: \"Lộn… mà cũng xài được chứ?\"",
  "Anh Tèo mua nhầm {wrong}. Ảnh xin lỗi bằng một nụ cười bằng cả gói {item}.",
  "Anh Tèo về với {wrong}, nói Dì Ba bảo vậy. Dì Ba chắc chắn không bảo vậy.",
  "Giao nhầm {wrong}. Anh Tèo: \"Coi như quà tặng kèm, phần chính anh đi lần nữa không nổi.\"",
  "{Wrong} nằm trong túi, {item} nằm trong mơ. Cảm ơn anh Tèo.",
];
/** Chị Lụa Hẻm Bên khi cho mượn (toast / bảng hậu quả). */
export const LUA_GLOAT = [
  "Chị Lụa: \"Lấy đi em, tiệm chị dư lắm. Nhập hàng là phải tính trước nha.\"",
  "Chị Lụa đưa {item}, cười: \"Chị cho mượn, mai trả gấp rưỡi cũng được.\"",
  "Chị Lụa: \"Hết hàng hả? Hồi đó chị cũng vậy… hồi chị mới học lớp ba.\"",
  "Chị Lụa đưa {item}, chụp lại một tấm \"làm kỷ niệm\".",
  "Chị Lụa: \"Không sao em, hàng xóm mà. Chị chỉ kể cho cả hẻm nghe thôi.\"",
  "Chị Lụa: \"Mượn thì mượn, nhớ ghi trên menu là được Hẻm Bên tài trợ.\"",
  "Chị Lụa đưa {item}: \"Tiệm em dễ thương, chỉ thiếu cái sổ kho.\"",
  "Chị Lụa: \"Chị cho mượn, em nhớ lần sau giới thiệu khách qua chị nha.\"",
];
/** Câu chốt ca (Nhật Ký) khi đóng cửa sớm / hết hàng. */
export const CAPTIONS_STOCKOUT = {
  closed: [
    "Tiệm đóng cửa sớm vì… quên mua {item}.",
    "Hôm nay bán {cups} ly, rồi đóng cửa vì hết {item}. Kiểm kho là một môn nghệ thuật.",
    "Ngày {day}: kho hết {item}, tiệm hết giờ, chủ tiệm hết lời.",
    "Bài học hôm nay: {item} không tự mọc trong kho.",
    "Đóng cửa sớm, về nhà ôm sổ kho mà khóc nhẹ.",
    "Hôm nay tiệm nghỉ sớm. Lý do chính thức: \"chiến lược\". Lý do thật: hết {item}.",
  ],
  ran: [
    "Bán {cups} ly và chạy một vòng đầu hẻm mua {item}. Cardio có lãi.",
    "Hôm nay chủ tiệm vừa pha trà vừa chạy bộ. Vì {item}.",
    "Ngày {day}: {item} hết, chân chạy, ly vẫn ra.",
    "Hết {item} giữa ca, giải quyết bằng đôi dép và lòng quyết tâm.",
  ],
};
