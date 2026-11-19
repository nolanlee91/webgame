// Hài kịch pha nhầm + review theo sao (giọng mạng xã hội Việt, không emoji, có hashtag). Nhân vật hư cấu, không thương hiệu thật.
// Mỗi bảng: { default: [...], "hoc-sinh": [...], "van-phong": [...], "khach-quen": [...], "di-ngang": [...], "reviewer": [...], "vip": [...] }.
// core/shift.js gộp default + câu của nhóm khách rồi chọn bằng freshLine (không lặp câu trong cùng ca).
// Biến: {self} {Self} {call} {Call} {drink} {sugar} {ice} {topping} {name} {n}.

/** Loại lỗi (để chọn câu): ưu tiên từ trên xuống. */
export const MISTAKE_KINDS = ["wrongCustomer", "swapped", "wrongDrink", "noLid", "topping", "sugar", "ice", "slow"];
const ERR_TO_KIND = {
  wrongCustomer: "wrongCustomer", swapped: "swapped", baseWrong: "wrongDrink", addWrong: "wrongDrink", noLid: "noLid",
  toppingMissing: "topping", toppingWrong: "topping", toppingExtra: "topping", sugarHigh: "sugar", sugarLow: "sugar", iceHigh: "ice", iceLow: "ice", slow: "slow",
};
export function mistakeOf(errors = []) {
  const kinds = new Set(errors.map((e) => ERR_TO_KIND[e]).filter(Boolean));
  return MISTAKE_KINDS.find((k) => kinds.has(k)) || null;
}

/** Câu khách nói ngay khi nhận ly lỗi. */
export const MISTAKE_SAY = {
  wrongCustomer: {
    default: [
      "Ủa ly này của ai vậy {call}? {Self} gọi {drink} mà.",
      "{Call} ơi, ly này hình như đang tìm chủ cũ của nó.",
      "Ly ngon đó, mà là ngon của người khác {call} ơi.",
      "{Self} nhận ly mà cảm giác như đang mặc nhầm áo người ta.",
      "Ly này có tên ai trên phiếu vậy {call}? Chắc không phải {self}.",
      "Hình như ly của {self} đang đi lạc sang khách bên cạnh rồi.",
    ],
    "hoc-sinh": [
      "Chị ơi plot twist dữ vậy, ly này đâu phải của em.",
      "Ly này mang năng lượng của người khác chị ơi, em cảm nhận được.",
      "Em gọi {drink} mà chị trao em kịch bản của bạn kia rồi.",
    ],
    "van-phong": [
      "Em ơi ly này là của người khác, giống như anh nhận nhầm task của phòng bên.",
      "Anh không có thời gian đổi đâu, nhưng ly này đúng là không phải của anh.",
      "Em gửi nhầm file rồi, à không, gửi nhầm ly.",
    ],
    "khach-quen": [
      "Con ơi, ly này của ai đó, cô uống {drink} mà con quên rồi hả?",
      "Cô lớn tuổi chứ chưa lẫn đâu con, ly này không phải của cô.",
      "Con đưa nhầm ly rồi, mà thôi cô chờ được, con đổi giùm cô.",
    ],
    "di-ngang": [
      "Em ơi ly này giao nhầm địa chỉ rồi, anh là shipper nên anh biết.",
      "Anh ghé có hai phút mà ly đi lạc sang nhà hàng xóm luôn.",
      "Ly này không phải của anh, giống đơn giao nhầm phường vậy em.",
    ],
    reviewer: [
      "Chị chủ ơi, ly này của bạn kia, mình quay lại cảnh này nha.",
      "Khán giả ơi, đây là ly của người khác, tiệm đang thử thách mình đó.",
      "Ly này không phải đơn của mình, nhưng content thì có rồi.",
    ],
    vip: [
      "Em ơi, chị trả tiền sòng phẳng nên chị cần đúng ly của chị.",
      "Ly này của người khác em, chị nhìn là biết, chị kỹ lắm.",
      "Chị không uống ly của người lạ đâu em, đổi giùm chị.",
    ],
  },
  swapped: {
    default: [
      "Hai ly đúng hết, chỉ là đổi chỗ cho nhau thôi {call}.",
      "{Call} ơi, ly này ghi tên người kia, ly kia ghi tên người này.",
      "Ly đúng, tên sai. Như hai đứa sinh đôi bị gọi nhầm.",
      "Cả nhóm phải tráo ly như chơi trò đổi quà Noel vậy {call}.",
      "Hai ly đổi chỗ cho nhau, chắc tụi nó thích ngồi cạnh người lạ.",
      "Đúng món, đúng số ly, chỉ có nhãn là đi du lịch.",
    ],
    "hoc-sinh": [
      "Chị ơi ly của em với ly của nhỏ bạn đổi vai cho nhau rồi.",
      "Tụi em phải đổi ly như đổi chỗ ngồi trong lớp luôn chị.",
      "Hai ly này swap vai diễn, em xin một tràng pháo tay.",
    ],
    "van-phong": [
      "Em ơi ly của sếp với ly của anh đổi chỗ, may anh phát hiện trước.",
      "Hai ly bị hoán đổi, giống file final với file final thật.",
      "Anh phải đổi ly lại trước khi vào họp, không là sếp uống ly ngọt của anh.",
    ],
    "khach-quen": [
      "Con ơi, ly của cô với ly thằng cháu đổi chỗ rồi, cô uống thử mới biết.",
      "Cô đổi lại được, mà con ghi tên cho đúng nghen con.",
      "Hai ly giống nhau quá nên con nhầm, cô hiểu mà.",
    ],
    "di-ngang": [
      "Hai ly đổi nhãn, anh mà giao thì khách phàn nàn liền em.",
      "Em ơi anh tráo lại rồi, nhưng lần sau ghi tên kỹ giùm anh.",
      "Anh chở hai ly mà tên dán ngược, như giao nhầm hai nhà đối diện.",
    ],
    reviewer: [
      "Khoan khoan, hai ly này bị đổi tên, mình quay lại bằng chứng nha.",
      "Khán giả ơi, đơn nhóm của mình bị tráo ly, để mình review cả hai.",
      "Hai ly đúng vị nhưng đổi chủ, cảnh này lên clip chắc vui.",
    ],
    vip: [
      "Em ơi ly của chị ghi tên người khác, chị không thích nhầm lẫn kiểu này.",
      "Hai ly đổi chỗ, chị phát hiện ngay vì chị luôn kiểm tra kỹ.",
      "Chị trả cho hai ly đúng tên, em đổi lại giùm chị.",
    ],
  },
  wrongDrink: {
    default: [
      "{Self} gọi {drink}. Ly này rõ ràng là… một trải nghiệm khác.",
      "{Call} ơi, đây là món gì vậy? {Self} gọi {drink} mà.",
      "Ly này ngon, nhưng là ngon theo một hướng {self} không chọn.",
      "{Self} đặt {drink}, vũ trụ gửi {self} một món bất ngờ.",
      "Ly này lạ quá {call}, như playlist bị ai đó bấm trộn bài.",
      "Ủa sao vị này lạc đề vậy {call}? Đề là {drink} mà.",
      "Ly này đi sai lối từ bước rót trà rồi {call} ơi.",
    ],
    "hoc-sinh": [
      "Chị ơi em gọi {drink} mà sao ra món khác, lạc trôi quá chị.",
      "Ly này sai đề rồi chị, em làm bài cũng không lạc đề kiểu này.",
      "Uống một ngụm mà em thấy mình đang ở một tiệm khác luôn.",
      "Em order {drink} chứ có order bất ngờ đâu chị.",
    ],
    "van-phong": [
      "Em ơi anh gọi {drink}, ly này như email gửi nhầm người nhận.",
      "Anh còn mười phút họp, ly này lại không phải {drink}.",
      "Ly này là phiên bản khác, anh cần bản đúng yêu cầu em ơi.",
    ],
    "khach-quen": [
      "Con ơi, cô uống {drink} mấy năm rồi, ly này lạ quá con.",
      "Ly này không phải món cô quen đâu con, con pha lại giùm cô.",
      "Cô uống là biết liền, con lấy nhầm trà rồi đó con.",
    ],
    "di-ngang": [
      "Em ơi anh gọi {drink}, ly này giống đơn của khách khác.",
      "Anh vội mà ly này lại sai món, em làm nhanh lại giùm anh.",
      "Ly này lệch tuyến rồi em, như anh chạy nhầm đường một chiều.",
    ],
    reviewer: [
      "Khoan, đây không phải {drink}, mình sẽ ghi chú trong clip nha chị chủ.",
      "Khán giả ơi, mình gọi {drink} mà nhận được một bất ngờ.",
      "Món này lạ quá, mình review món mình gọi hay món mình nhận đây.",
    ],
    vip: [
      "Em ơi chị gọi {drink}, ly này sai từ phần nền luôn.",
      "Chị uống là biết sai món, em pha lại đúng giùm chị.",
      "Chị trả tiền sòng phẳng, chị cần đúng {drink} em ơi.",
    ],
  },
  noLid: {
    default: [
      "Ly này mở mui hả {call}? Đi xe về chắc tắm trà luôn.",
      "{Call} quên nắp rồi, ly này đang hóng gió quá trời.",
      "Không nắp hả {call}? Ly này tự do quá, {self} hơi lo.",
      "Ly đẹp đó, mà thiếu cái nắp kêu cạch là mất linh hồn.",
      "{Self} cầm ly không nắp mà tay run như cầm bát canh nóng.",
      "Ly này phiên bản mui trần, mát thì mát mà đổ thì đổ.",
    ],
    "hoc-sinh": [
      "Chị ơi ly này không nắp, em chạy về lớp chắc đổ hết lên vở.",
      "Thiếu nắp là thiếu tiếng cạch, mà thiếu cạch là thiếu vibe chị ơi.",
      "Em cầm ly mà phải đi chậm như đang thi đi bộ đội đầu chén.",
    ],
    "van-phong": [
      "Em ơi ly không nắp, anh mang lên thang máy chắc thành sự cố.",
      "Anh để ly trên bàn phím thì nguy, em cho anh xin cái nắp.",
      "Ly mở nắp như deadline không có ngày, nghe thôi đã lo.",
    ],
    "khach-quen": [
      "Con ơi, con quên nắp rồi, cô đi bộ về là đổ ra áo đó con.",
      "Ly không nắp con ơi, cô cầm mà tay cô run quá.",
      "Thôi cô uống tại đây luôn, con quên nắp rồi đó.",
    ],
    "di-ngang": [
      "Em ơi anh chạy xe mà ly không nắp là thành mưa trà sữa đó.",
      "Thiếu nắp rồi em, anh treo lên móc xe là đổ hết.",
      "Ly này không chịu nổi ổ gà đâu em, cho anh xin cái nắp.",
    ],
    reviewer: [
      "Chị chủ ơi ly không nắp, mình quay cận cảnh mặt nước luôn nè.",
      "Khán giả ơi, ly mui trần đầu tiên mình từng review.",
      "Thiếu tiếng cạch thì clip mình mất điểm nhấn rồi chị chủ ơi.",
    ],
    vip: [
      "Em ơi ly không nắp, chị mặc váy trắng hôm nay đó em.",
      "Chị không cầm ly mở nắp đâu em, đóng nắp giùm chị.",
      "Chi tiết nhỏ như cái nắp mà em quên, chị hơi buồn.",
    ],
  },
  topping: {
    default: [
      "{Topping} đâu {call}? {Self} nhai không khí nãy giờ.",
      "Ly ngon, mà {topping} chắc đi vắng rồi {call}.",
      "{Call} ơi, topping này không giống cái {self} gọi.",
      "{Self} hút một hơi, ống hút báo cáo: không thấy {topping}.",
      "Topping ly này có quan điểm riêng, không theo phiếu {call} ơi.",
      "Ủa có topping tặng hả {call}? {Self} không gọi mà cảm động.",
    ],
    "hoc-sinh": [
      "Chị ơi trà sữa mà không có {topping} là mất nửa linh hồn em luôn.",
      "Em hút mãi không thấy {topping}, tưởng ống hút bị lỗi.",
      "Topping này lạ quá chị, em gọi {topping} mà chị cho em bất ngờ.",
    ],
    "van-phong": [
      "Em ơi thiếu {topping}, giống báo cáo thiếu phụ lục vậy.",
      "Anh cần {topping} để nhai lúc họp, ly này để anh nhai gì đây.",
      "Topping không đúng em ơi, như họp xong không có biên bản.",
    ],
    "khach-quen": [
      "Con ơi, ly của cô thiếu {topping} rồi, con quên hả con?",
      "Cô răng yếu mà con cho cô topping lạ quá, cô nhai không nổi.",
      "Thôi không sao, mà lần sau con nhớ {topping} cho cô nghen.",
    ],
    "di-ngang": [
      "Em ơi ly thiếu {topping}, anh cần nhai cho tỉnh để chạy tiếp.",
      "Topping sai rồi em, giống đơn giao thiếu món phụ.",
      "Anh không kịp đổi đâu, mà ly này thiếu {topping} thiệt đó em.",
    ],
    reviewer: [
      "Khán giả ơi, mình lắc ly mà {topping} không xuất hiện.",
      "Chị chủ ơi topping ly này không khớp đơn, mình phải ghi chú lại.",
      "Mình quay cảnh lắc ly mà không có {topping} nào nhảy múa cả.",
    ],
    vip: [
      "Em ơi, chị gọi {topping}, ly này thiếu đúng phần chị thích nhất.",
      "Topping sai rồi em, chị để ý từng chi tiết đó.",
      "Chị không ăn topping lạ đâu em, đổi đúng cho chị.",
    ],
  },
  sugar: {
    default: [
      "{Self} gọi {sugar} đường mà ly này có quan điểm riêng.",
      "Ly này ít ngọt mà ngọt, ngọt kiểu có tâm sự {call} ơi.",
      "Ngọt quá {call}, ngọt như lời hứa đầu tháng.",
      "{Self} gọi {sugar} mà ly này giữ dáng giùm {self} luôn rồi.",
      "Đường ly này tự tăng lương cho mình hả {call}?",
      "Nhạt nhẹ nhàng, như tin nhắn \"ừ\" lúc 11 giờ đêm.",
      "Mức đường này không có trên menu đâu {call} ơi.",
    ],
    "hoc-sinh": [
      "Chị ơi ngọt quá, em uống xong chắc làm bài tập bằng năng lượng đường.",
      "Em gọi {sugar} đường mà ly này mood khác hẳn chị ơi.",
      "Ly này nhạt như điểm kiểm tra của em hôm qua luôn chị.",
    ],
    "van-phong": [
      "Em ơi anh gọi {sugar} đường, ly này ngọt hơn lời sếp khen.",
      "Đường không đúng em ơi, anh đang cố giữ chỉ số khám sức khỏe.",
      "Ly này nhạt như cuộc họp không có kết luận.",
    ],
    "khach-quen": [
      "Con ơi, cô dặn {sugar} đường mà, bác sĩ la cô đó con.",
      "Ngọt quá con ơi, cô uống xong phải đi bộ hai vòng chợ.",
      "Lần này con pha khác mọi khi đó, cô nhớ vị mà.",
    ],
    "di-ngang": [
      "Em ơi ngọt quá, anh uống xong chạy xe bay luôn.",
      "Anh gọi {sugar} đường mà ly này như khách tự ý đổi địa chỉ.",
      "Nhạt quá em, anh cần ngọt để còn chở tiếp mười đơn.",
    ],
    reviewer: [
      "Khán giả ơi, đây là phiên bản ít ngọt mà ngọt huyền thoại.",
      "Mình gọi {sugar} đường, vị này mình chấm là {sugar} cộng thêm tình cảm.",
      "Độ ngọt lệch phiếu rồi chị chủ ơi, mình ghi lại cho minh bạch.",
    ],
    vip: [
      "Em ơi chị gọi {sugar} đường, ly này không đúng mức chị dặn.",
      "Chị kiểm soát đường rất kỹ, ly này lệch rồi em.",
      "Ngọt quá em, chị trả tiền cho đúng {sugar} đường thôi.",
    ],
  },
  ice: {
    default: [
      "{Self} gọi {ice}, mà đá ở đây tự quyết định.",
      "Đá nhiều tới mức {self} tưởng mua nước đá có vị trà.",
      "Ít đá quá {call}, ly đổ mồ hôi còn nhiều hơn {self}.",
      "Ly này mát lạnh… chủ yếu là đá thôi {call} ơi.",
      "Đá ở ly này chơi trốn tìm, {self} tìm mãi không thấy.",
      "{Call} ơi, đá ly này không đọc phiếu hả?",
    ],
    "hoc-sinh": [
      "Chị ơi đá nhiều quá, em uống ba ngụm là hết nước còn đá.",
      "Em gọi {ice} mà ly này như sân trượt băng luôn chị.",
      "Đá ít quá chị ơi, trời nóng vầy em tan chảy trước ly.",
    ],
    "van-phong": [
      "Em ơi đá nhiều quá, anh đang trả tiền trà chứ đâu phải đá.",
      "Ly này ít đá, anh để trên bàn chờ họp là thành trà ấm.",
      "Đá không đúng yêu cầu, giống KPI ai đó tự đổi giùm anh.",
    ],
    "khach-quen": [
      "Con ơi, cô răng ê mà con cho cô nhiều đá quá.",
      "Cô dặn {ice} mà con, lần này con quên rồi.",
      "Đá ít quá con, cô đi chợ về nóng lắm con ơi.",
    ],
    "di-ngang": [
      "Em ơi đá nhiều quá, anh treo xe là ly nặng như bao gạo.",
      "Ít đá vầy anh chạy hai cây số là trà nóng luôn em.",
      "Anh gọi {ice} mà ly này chở đá như xe đá cây.",
    ],
    reviewer: [
      "Khán giả ơi, tỉ lệ đá trên trà ly này đáng để làm bài phân tích.",
      "Mình gọi {ice}, mà ly này có kế hoạch riêng về đá.",
      "Chị chủ ơi đá lệch phiếu, mình ghi điểm trừ nhẹ thôi.",
    ],
    vip: [
      "Em ơi chị gọi {ice}, ly này sai mức đá rồi.",
      "Chị không uống nhiều đá đâu em, chị dặn rõ rồi mà.",
      "Mức đá là chi tiết, mà chị sống bằng chi tiết đó em.",
    ],
  },
  slow: {
    default: [
      "Ngon, mà {self} chờ lâu tới mức thuộc luôn menu.",
      "Ly này đáng chờ, nhưng {self} chờ hơi lố {call} ơi.",
      "{Self} đứng chờ lâu tới mức quen luôn khách bên cạnh.",
      "Cuối cùng ly cũng tới, {self} tưởng phải chờ qua mùa sau.",
      "{Call} pha kỹ quá, {self} kịp đọc hết điều khoản sử dụng app.",
      "Chờ lâu vậy mà ngon, coi như {self} tập kiên nhẫn.",
    ],
    "hoc-sinh": [
      "Chị ơi em chờ lâu tới mức học thuộc luôn bài lịch sử.",
      "Em suýt trễ học thêm rồi chị, mà thôi ly ngon nên tha.",
      "Chờ lâu quá chị ơi, nhóm chat của em gửi ba trăm tin rồi.",
    ],
    "van-phong": [
      "Em ơi anh trễ họp năm phút rồi, mà ly ngon nên anh không giận.",
      "Chờ lâu vầy sếp gọi anh ba cuộc luôn em ơi.",
      "Ly tới chậm hơn email phản hồi của phòng kế toán.",
    ],
    "khach-quen": [
      "Con làm lâu quá, cô đứng mỏi chân luôn rồi con ơi.",
      "Thôi không sao, cô quen chờ con rồi, mà hôm nay hơi lâu.",
      "Cô chờ lâu tới mức nồi cơm ở nhà chắc chín rồi đó con.",
    ],
    "di-ngang": [
      "Em ơi anh trễ hai đơn rồi, lần sau nhanh giùm anh.",
      "Anh chờ lâu tới mức app báo anh đứng yên quá lâu.",
      "Ly ngon mà chờ lâu, khách của anh đang gọi liên tục đó em.",
    ],
    reviewer: [
      "Khán giả ơi, thời gian chờ ly này đủ để mình quay hết intro.",
      "Mình chấm thời gian chờ hơi dài, nhưng vị thì cứu lại.",
      "Chị chủ ơi clip của mình có đoạn chờ ly dài nhất từ trước tới giờ.",
    ],
    vip: [
      "Em ơi chị chờ hơi lâu, thời gian của chị quý lắm đó.",
      "Chị không thích chờ, nhưng ly đúng vị nên chị bỏ qua lần này.",
      "Lần sau em ưu tiên giùm chị chút nha, chị chờ lâu quá.",
    ],
  },
};

/** Câu review đăng lên sổ review khi ly có lỗi. */
export const MISTAKE_REVIEW = {
  wrongCustomer: {
    default: [
      "Nhận nhầm ly của người khác. Ngon, nhưng là ngon của người ta. #nhầmlẫnđángyêu",
      "Ly đi lạc sang mình, tiệm đổi lại liền nên vẫn vui. #giaonhầmkhách",
      "Mình được trải nghiệm ly của khách bàn bên trước khi có ly của mình. #trảinghiệmmới",
      "10 điểm không có nhưng, nhưng ly đầu tiên không phải của mình. #lầnsauvẫnghé",
      "Tiệm dễ thương, chỉ là ly của mình hơi thích đi chơi với người khác.",
      "Nhầm ly một chút, cười cả tiệm một trận. #tiệmnhỏvuivẻ",
    ],
    "hoc-sinh": [
      "Uống nhầm ly của bạn khác xong mới biết, plot twist cả buổi chiều. #nhầmly",
      "Ly của em đi lạc, nhưng chị chủ xin lỗi dễ thương nên em tha. #lầnsauvẫnghé",
      "Trà sữa phiên bản không phải của mình, cũng ngon mà ngại ghê. #genzreview",
    ],
    "van-phong": [
      "Nhận nhầm ly như nhận nhầm task, may mà xử lý nhanh. #dânvănphòng",
      "Ly giao nhầm người, anh mất năm phút giải thích, vẫn kịp họp. #deadline",
      "Quán ổn, quy trình giao ly cần thêm bước kiểm tra tên. #gópýnhẹ",
    ],
    "khach-quen": [
      "Con bé đưa nhầm ly cho cô, mà nó xin lỗi ngoan quá nên cô vẫn ghé.",
      "Cô uống ở đây lâu rồi, lần đầu nhận nhầm ly, cô cho qua. #kháchquen",
      "Ly của cô đi lạc, cô chờ chút là có ly đúng. #tiệmquen",
    ],
    "di-ngang": [
      "Ghé vội mà nhận nhầm ly, may phát hiện trước khi chạy đi. #ghévội",
      "Ly giao nhầm như đơn giao nhầm địa chỉ, nghề anh hiểu mà. #shipperreview",
      "Tiệm sửa nhanh, chỉ là ly đầu tiên không phải của anh.",
    ],
    reviewer: [
      "Mình nhận nhầm ly của bạn khác, quay lại được cảnh tiệm xử lý rất mềm. #reviewthật",
      "Điểm trừ: giao nhầm khách. Điểm cộng: cách xin lỗi đáng học. #reviewquán",
      "Clip hôm nay có cảnh ly đi lạc, khán giả chắc thích. #contentbấtngờ",
    ],
    vip: [
      "Nhận nhầm ly của người khác, chị không vui lắm. Cần cẩn thận hơn.",
      "Dịch vụ tốt nhưng giao nhầm ly là lỗi chị khó bỏ qua. #kỹtính",
      "Lần sau em kiểm tra tên trước khi giao nha, chị góp ý thật lòng.",
    ],
  },
  swapped: {
    default: [
      "Hai ly đổi tên cho nhau, nhóm mình tráo lại là xong. #đơnnhóm",
      "Đơn nhóm đúng hết, chỉ có tên trên ly là đi du lịch. #tráoly",
      "Cả nhóm chơi trò đổi ly bất đắc dĩ, cuối cùng ai cũng đúng món.",
      "Ly đúng vị, nhãn sai chủ. 10 điểm không có nhưng, có một chút nhưng. #lầnsauvẫnghé",
      "Hai ly như hai đứa sinh đôi bị gọi nhầm tên. #nhầmnhãn",
      "Đơn nhiều ly giao một lượt, chỉ cần ghi tên kỹ hơn xíu. #gópýnhẹ",
    ],
    "hoc-sinh": [
      "Ly của em với nhỏ bạn đổi chỗ, tụi em đổi lại còn chụp hình. #genzreview",
      "Đơn nhóm của lớp bị tráo ly, vui như chơi trò chơi. #đilàmgìcũngvui",
      "Hai ly swap vai, em vẫn chấm ổn vì chị chủ dễ thương. #lầnsauvẫnghé",
    ],
    "van-phong": [
      "Ly của sếp và của anh đổi tên, suýt nữa sếp uống ly ngọt của anh. #dânvănphòng",
      "Đơn cả phòng đúng món, chỉ lộn nhãn. Cần thêm bước đối chiếu. #quytrình",
      "Hai ly hoán đổi như file final và final_v2. #vănphònglife",
    ],
    "khach-quen": [
      "Ly của cô với ly thằng cháu đổi chỗ, cô phát hiện ra nhờ uống quen.",
      "Con bé ghi tên lộn, cô đổi lại liền, không sao. #tiệmquen",
      "Đơn nhà cô đúng hết, chỉ có tên dán ngược. #kháchquen",
    ],
    "di-ngang": [
      "Hai ly dán tên ngược, anh suýt giao nhầm cho khách. #shipperreview",
      "Đơn đúng món nhưng nhãn lộn, may anh kiểm tra trước. #ghévội",
      "Ghi tên kỹ giùm anh nha, nghề giao hàng sợ nhất lộn nhãn.",
    ],
    reviewer: [
      "Đơn nhóm của mình bị tráo ly, mình review cả hai vị luôn. #reviewthật",
      "Điểm trừ nhỏ: nhãn ly đổi chỗ. Vị thì đúng cả hai. #reviewquán",
      "Clip hôm nay có màn tráo ly, khán giả đoán ly nào của ai. #contentbấtngờ",
    ],
    vip: [
      "Ly của chị ghi tên người khác, chị không thích nhầm lẫn kiểu này.",
      "Hai ly đổi nhãn, chi tiết nhỏ nhưng chị để ý. #kỹtính",
      "Vị ổn, nhãn sai. Lần sau em kiểm tra lại nha.",
    ],
  },
  wrongDrink: {
    default: [
      "Gọi một đằng, nhận một nẻo. Tiệm xử lý dễ thương nên thôi. #saimón",
      "Mình gọi {drink}, nhận một món bí ẩn. Trải nghiệm khó quên. #mónbấtngờ",
      "Sai món nhưng tiệm nhận lỗi liền, lần sau vẫn ghé vì chị chủ dễ thương.",
      "Ly này lạc đề, như bài văn tả mẹ mà viết về con mèo. #lạcđề",
      "10 điểm không có nhưng, nhưng món không phải món mình gọi. #saimón",
      "Vị lạ như playlist bị bấm trộn bài, nhưng thái độ tiệm thì chuẩn.",
    ],
    "hoc-sinh": [
      "Em gọi {drink} mà ra món khác, lạc trôi nhưng vẫn vui. #genzreview",
      "Sai đề nhẹ, em chấm điểm thái độ cao. #lầnsauvẫnghé",
      "Món này không phải món em gọi, nhưng chị chủ xin lỗi cute quá. #tiệmxinh",
    ],
    "van-phong": [
      "Nhận sai món như email gửi nhầm người, may xử lý kịp. #dânvănphòng",
      "Gọi {drink} mà nhận bản khác, cần review quy trình gấp. #gópýnhẹ",
      "Sai món giữa giờ nghỉ trưa, anh vẫn kịp quay lại làm. #deadline",
    ],
    "khach-quen": [
      "Cô uống {drink} bao năm, hôm nay con bé lấy nhầm trà. Cô bỏ qua.",
      "Món lạ quá, cô uống là biết liền. Con nó sửa nhanh. #tiệmquen",
      "Lần đầu tiệm làm sai món của cô, chắc tại hôm nay đông. #kháchquen",
    ],
    "di-ngang": [
      "Ghé vội mà nhận sai món, phải chờ làm lại. #ghévội",
      "Sai món như đơn giao nhầm phường, nhưng sửa nhanh. #shipperreview",
      "Ly đầu sai, ly sau đúng, tốn thêm hai phút của anh.",
    ],
    reviewer: [
      "Mình gọi {drink}, nhận món khác. Điểm trừ món, điểm cộng cách xử lý. #reviewthật",
      "Clip hôm nay có cảnh sai món, mình để nguyên cho minh bạch. #reviewquán",
      "Món nhận được không khớp đơn, mình chấm lại sau khi tiệm sửa. #reviewcôngtâm",
    ],
    vip: [
      "Sai món ngay phần nền, chị khó chấm cao. #kỹtính",
      "Chị gọi {drink}, tiệm pha nhầm. Thái độ ổn, chuyên môn cần chắc hơn.",
      "Chị trả tiền sòng phẳng nên mong đúng món ngay lần đầu.",
    ],
  },
  noLid: {
    default: [
      "Ly không nắp, đi xe về thành ly trà sữa phiên bản chống nóng. #quênnắp",
      "Thiếu tiếng cạch là thiếu linh hồn, nhưng vị vẫn ổn. #nắpđâurồi",
      "Ly mui trần đầu tiên trong đời, tay mình run cả đoạn đường. #muitrần",
      "Ngon mà quên nắp, áo mình có thêm họa tiết trà sữa. #lầnsauvẫnghé",
      "10 điểm không có nhưng, nhưng có cái nắp thì tốt hơn. #quênnắp",
      "Tiệm quên nắp, mình nhớ mãi. Theo cả nghĩa tốt lẫn nghĩa ướt.",
    ],
    "hoc-sinh": [
      "Ly không nắp, em chạy về lớp đổ lên vở, giờ vở thơm mùi trà. #genzreview",
      "Thiếu tiếng cạch là thiếu vibe, chị chủ nhớ nắp nha. #thiếucạch",
      "Em đi chậm như rùa để không đổ, ai thấy cũng tưởng em đang thiền. #quênnắp",
    ],
    "van-phong": [
      "Ly không nắp lên thang máy, anh sống trong lo âu suốt tám tầng. #dânvănphòng",
      "Quên nắp làm anh không dám để ly gần laptop. #gópýnhẹ",
      "Ly mở nắp như deadline mở, nghe đã thấy rủi ro. #vănphònglife",
    ],
    "khach-quen": [
      "Con bé quên nắp, cô uống tại quán luôn, cũng vui. #kháchquen",
      "Ly không nắp, cô đi bộ về đổ ra áo một chút. Lần sau nhớ nha con.",
      "Cô thương tiệm nên cô bỏ qua cái nắp. #tiệmquen",
    ],
    "di-ngang": [
      "Ly không nắp mà anh chạy xe máy, thành mưa trà sữa luôn. #shipperreview",
      "Quên nắp với khách đi xe là lỗi nặng đó nha. #ghévội",
      "Anh phải xin thêm túi để ly khỏi đổ, tốn hai phút. #gópýnhẹ",
    ],
    reviewer: [
      "Ly không nắp, mình quay cận cảnh mặt nước, cũng đẹp đó. #reviewthật",
      "Mất điểm nhấn tiếng cạch, clip mình thiếu âm thanh đặc trưng. #reviewquán",
      "Quên nắp thì trừ điểm trình bày, vị vẫn giữ điểm. #reviewcôngtâm",
    ],
    vip: [
      "Ly không nắp, chi tiết nhỏ mà chị thấy thiếu chuyên nghiệp. #kỹtính",
      "Chị mặc váy trắng mà ly không nắp. Lần sau em cẩn thận nha.",
      "Vị được, dịch vụ cần chỉn chu ở từng cái nắp.",
    ],
  },
  topping: {
    default: [
      "Ly ngon, mà topping chắc đi vắng. #toppingđâurồi",
      "Hút cả ly không thấy {topping}, ống hút mình buồn lắm. #thiếutopping",
      "Topping lạ ghê, chắc là bản cập nhật mới của tiệm. #bấtngờ",
      "10 điểm không có nhưng, nhưng {topping} thì không có thật. #lầnsauvẫnghé",
      "Được tặng topping không gọi, cảm động mà hơi bối rối. #toppingtặng",
      "Vị trà ổn, phần nhai thì chưa đúng đơn. #gópýnhẹ",
    ],
    "hoc-sinh": [
      "Trà sữa không có {topping} là mất nửa tuổi thơ của em. #genzreview",
      "Em lắc ly mãi không thấy {topping}, tưởng bị ảo giác. #toppingđâurồi",
      "Topping sai nhưng chị chủ đổi liền, vẫn mười điểm thái độ. #tiệmxinh",
    ],
    "van-phong": [
      "Thiếu {topping} như báo cáo thiếu phụ lục. #dânvănphòng",
      "Anh cần nhai để tỉnh táo họp chiều, ly này để anh nhai không khí. #deadline",
      "Topping không khớp đơn, cần kiểm tra lại trước khi giao. #gópýnhẹ",
    ],
    "khach-quen": [
      "Con bé quên {topping} cho cô, mà ly vẫn ngon. #kháchquen",
      "Cô răng yếu mà nhận topping lạ, cô nhai hơi mệt. #tiệmquen",
      "Lần sau con nhớ {topping} cho cô nha, cô vẫn ghé.",
    ],
    "di-ngang": [
      "Ly thiếu {topping}, anh không kịp quay lại đổi. #ghévội",
      "Giống đơn giao thiếu món phụ, khách anh mà gặp là nhắn liền. #shipperreview",
      "Ly ngon nhưng phần topping chưa đúng đơn.",
    ],
    reviewer: [
      "Mình quay cảnh lắc ly mà {topping} không xuất hiện. #reviewthật",
      "Topping không khớp đơn, mình trừ điểm phần nhai. #reviewquán",
      "Clip hôm nay thiếu cảnh topping nhảy múa trong ly. #reviewcôngtâm",
    ],
    vip: [
      "Thiếu đúng phần chị thích nhất. Chị chấm thấp phần topping. #kỹtính",
      "Topping sai đơn, chi tiết này chị luôn để ý.",
      "Vị nền ổn, topping cần đúng như đã gọi.",
    ],
  },
  sugar: {
    default: [
      "Đường không đúng mức, nhưng thái độ thì đúng mức. #ítngọtmàngọt",
      "Gọi {sugar} mà nhận phiên bản ngọt theo cảm xúc. #ítngọtmàngọt",
      "Ngọt như lời hứa đầu tháng, mình hơi lo cho cuối tháng. #ngọtquá",
      "Nhạt nhẹ nhàng như tin nhắn \"ừ\" lúc nửa đêm. #nhạtnhẽo",
      "10 điểm không có nhưng, nhưng mức đường thì có tâm sự riêng. #lầnsauvẫnghé",
      "Mức đường lệch phiếu, vị trà vẫn đáng quay lại. #gópýnhẹ",
    ],
    "hoc-sinh": [
      "Ly ngọt tới mức em làm xong bài tập trong mười phút. #genzreview",
      "Em gọi {sugar} mà ly này có mood khác, ít ngọt mà ngọt thiệt. #ítngọtmàngọt",
      "Nhạt như điểm kiểm tra hôm qua, nhưng chị chủ dễ thương. #lầnsauvẫnghé",
    ],
    "van-phong": [
      "Ly ngọt hơn lời sếp khen, chỉ số đường của anh lo lắng. #dânvănphòng",
      "Gọi {sugar} mà nhận bản khác, cần chuẩn hóa quy trình đong đường. #gópýnhẹ",
      "Nhạt như cuộc họp không có kết luận. #vănphònglife",
    ],
    "khach-quen": [
      "Cô dặn {sugar} đường mà con quên, cô uống bớt một nửa. #kháchquen",
      "Lần này ngọt hơn mọi khi, chắc con bé thương cô quá.",
      "Cô nhớ vị quen nên biết lệch đường, con sửa là được. #tiệmquen",
    ],
    "di-ngang": [
      "Ngọt quá, anh uống xong chạy một mạch mười đơn. #shipperreview",
      "Gọi {sugar} mà như khách tự đổi địa chỉ giữa chừng. #ghévội",
      "Nhạt quá, không đủ đường cho một ca giao hàng.",
    ],
    reviewer: [
      "Phiên bản ít ngọt mà ngọt huyền thoại, mình chấm là {sugar} cộng tình cảm. #ítngọtmàngọt",
      "Độ ngọt lệch phiếu, mình ghi lại cho minh bạch. #reviewthật",
      "Mức đường cần chuẩn hơn, các bạn gọi nhớ dặn kỹ nha. #reviewquán",
    ],
    vip: [
      "Chị gọi {sugar} đường, ly lệch mức. Chị kiểm soát đường rất kỹ. #kỹtính",
      "Ngọt hơn yêu cầu, chị không uống hết được.",
      "Chuyên môn cần chính xác hơn ở khâu đường.",
    ],
  },
  ice: {
    default: [
      "Đá chơi trốn tìm, ly vẫn mát lòng. #đáđâu",
      "Đá nhiều tới mức mình tưởng mua nước đá có vị trà. #nhiềuđá",
      "Ít đá quá, ly đổ mồ hôi còn nhiều hơn mình. #ítđáquá",
      "10 điểm không có nhưng, nhưng tỉ lệ đá cần xem lại. #lầnsauvẫnghé",
      "Mát lạnh, chủ yếu là đá. Vị vẫn ổn. #gópýnhẹ",
      "Đá không đọc phiếu, nhưng chị chủ thì đọc tâm lý khách tốt.",
    ],
    "hoc-sinh": [
      "Ba ngụm là hết nước còn đá, em nhai đá cho đỡ buồn. #genzreview",
      "Ly như sân trượt băng mini, em vẫn thích. #nhiềuđá",
      "Ít đá quá, trời nóng em tan chảy trước ly. #ítđáquá",
    ],
    "van-phong": [
      "Trả tiền trà mà nhận nhiều đá, anh hơi tiếc. #dânvănphòng",
      "Ít đá, để chờ họp xong là thành trà ấm. #vănphònglife",
      "Mức đá chưa đúng yêu cầu, góp ý để tiệm tốt hơn. #gópýnhẹ",
    ],
    "khach-quen": [
      "Cô răng ê mà nhiều đá quá, lần sau con nhớ nha. #kháchquen",
      "Cô dặn {ice} mà con quên, cô vẫn thương tiệm. #tiệmquen",
      "Ít đá quá, đi chợ về nóng mà ly hết mát nhanh.",
    ],
    "di-ngang": [
      "Nhiều đá treo xe nặng như bao gạo. #shipperreview",
      "Ít đá chạy hai cây số là thành trà nóng. #ghévội",
      "Mức đá lệch phiếu, nhưng ly vẫn cứu được buổi trưa.",
    ],
    reviewer: [
      "Tỉ lệ đá trên trà ly này đáng làm bài phân tích. #reviewthật",
      "Đá lệch phiếu, mình trừ nhẹ thôi vì vị ổn. #reviewquán",
      "Mình gọi {ice}, ly có kế hoạch riêng về đá. #reviewcôngtâm",
    ],
    vip: [
      "Sai mức đá, chị dặn rõ rồi mà. #kỹtính",
      "Mức đá là chi tiết, mà chị sống bằng chi tiết.",
      "Vị ổn, đá cần đúng như yêu cầu của khách.",
    ],
  },
  slow: {
    default: [
      "Đáng chờ, nhưng lần sau chờ ít thôi nha. #chờlâu",
      "Chờ lâu tới mức thuộc luôn menu, vị thì đáng. #đángchờ",
      "Mình đứng chờ lâu tới mức quen luôn khách bên cạnh. #kếtbạnởtiệm",
      "10 điểm không có nhưng, nhưng thời gian chờ thì có. #lầnsauvẫnghé",
      "Ly ngon cứu được buổi chiều, thời gian chờ thì chưa. #gópýnhẹ",
      "Chờ lâu nhưng tiệm xin lỗi đàng hoàng, mình vẫn ghé.",
    ],
    "hoc-sinh": [
      "Chờ lâu tới mức học thuộc bài lịch sử luôn. #genzreview",
      "Nhóm chat nhắn ba trăm tin trong lúc em chờ ly. #chờlâu",
      "Suýt trễ học thêm, nhưng ly ngon nên em tha. #lầnsauvẫnghé",
    ],
    "van-phong": [
      "Trễ họp năm phút vì chờ ly, nhưng ly đáng. #dânvănphòng",
      "Ly tới chậm hơn email của phòng kế toán. #vănphònglife",
      "Giờ cao điểm cần nhanh hơn, dân văn phòng chỉ có mười lăm phút. #deadline",
    ],
    "khach-quen": [
      "Hôm nay cô chờ hơi lâu, chắc tiệm đông. Cô vẫn ghé. #kháchquen",
      "Cô đứng mỏi chân, nhưng con bé xin lỗi ngoan. #tiệmquen",
      "Chờ lâu tới mức nồi cơm nhà cô chín luôn.",
    ],
    "di-ngang": [
      "Chờ lâu làm anh trễ hai đơn. #shipperreview",
      "App báo anh đứng yên quá lâu, vì chờ ly. #ghévội",
      "Ly ngon nhưng nghề anh không có thời gian chờ.",
    ],
    reviewer: [
      "Thời gian chờ đủ để mình quay hết đoạn mở đầu. #reviewthật",
      "Chờ hơi dài, vị cứu lại được phần lớn. #reviewquán",
      "Khán giả nhớ đi sớm tránh giờ cao điểm nha. #mẹoreview",
    ],
    vip: [
      "Chị chờ hơi lâu, thời gian của chị quý lắm. #kỹtính",
      "Ly đúng vị nên chị bỏ qua lần này, nhưng chờ lâu quá.",
      "Mong tiệm sắp xếp quầy nhanh hơn vào giờ đông.",
    ],
  },
};

/** Review theo số sao khi không có lỗi nổi bật (hoặc 5 sao). */
export const REVIEW_BY_STARS = {
  1: {
    default: [
      "Một sao cho đôi giày đứng chờ. #chờdàicổ",
      "Chưa uống mà đã thấy no, no chờ đợi. #mộtsao",
      "Quán dễ thương nhưng mình chưa kịp biết ly trà vị gì.",
      "Một sao, mình xin phép đánh giá bằng ánh mắt. #buồnnhẹ",
      "Hôm nay không phải ngày của mình và cũng không phải ngày của tiệm. #thôinghỉ",
      "Chờ mãi rồi về, mong lần sau may mắn hơn. #lầnsauthửlại",
      "Một sao tượng trưng, vì vẫn tin tiệm sẽ làm tốt hơn.",
    ],
    "hoc-sinh": [
      "Em chờ tới mức chuông vào học reo, một sao cho tiếng chuông. #genzreview",
      "Một sao buồn như điểm kiểm tra miệng không thuộc bài. #mộtsao",
      "Em gom tiền ăn sáng ba ngày mà về tay không. #tiềnđểdành",
      "Mood hôm nay down, ly thì không tới. #downmood",
      "Một sao nhưng em vẫn theo dõi tiệm, chờ màn lội ngược dòng.",
    ],
    "van-phong": [
      "Mười lăm phút nghỉ trưa chỉ để đứng chờ. #dânvănphòng",
      "Một sao như cuộc họp kéo dài không kết luận. #vănphònglife",
      "Sếp gọi ba cuộc, ly vẫn chưa xong. #deadline",
      "Trải nghiệm chưa đạt yêu cầu, cần cải thiện quy trình. #gópýthẳng",
      "Một sao, nhưng anh vẫn để lại góp ý vì muốn tiệm tốt lên.",
    ],
    "khach-quen": [
      "Hôm nay cô về không, chắc tiệm đông quá. Cô buồn chút xíu.",
      "Cô chờ lâu rồi về nấu cơm, mai cô ghé lại. #kháchquen",
      "Lần đầu cô cho một sao, mong con cố gắng. #tiệmquen",
      "Cô đứng mỏi chân mà ly chưa tới, thôi để bữa khác.",
      "Một sao cho hôm nay thôi, cô vẫn thương tiệm.",
    ],
    "di-ngang": [
      "Ghé vội mà về không, mất hai đơn. #shipperreview",
      "Một sao cho tốc độ, anh chạy xe nhanh hơn tiệm pha. #ghévội",
      "Chờ không nổi, khách của anh đang gọi. #mộtsao",
      "Hẹn tiệm kiếp shipper sau. #ghévội",
      "Tiệm cần nhanh hơn với khách đi đường.",
    ],
    reviewer: [
      "Mình không có gì để review ngoài đoạn chờ. #reviewthật",
      "Clip hôm nay chỉ có cảnh đứng chờ và một sao. #reviewquán",
      "Trải nghiệm chưa tới, mình sẽ quay lại để công bằng. #reviewcôngtâm",
      "Một sao tạm thời, khán giả đợi phần hai nha. #series",
      "Không đủ dữ liệu để chấm vị, chỉ đủ để chấm thời gian chờ.",
    ],
    vip: [
      "Trải nghiệm không xứng với kỳ vọng của chị. #kỹtính",
      "Chị trả tiền sòng phẳng nhưng nhận về sự chờ đợi.",
      "Một sao. Chị mong lần sau tiệm chỉn chu hơn.",
      "Dịch vụ chưa đạt, chị góp ý thẳng để tiệm tốt lên. #gópýthẳng",
      "Thời gian của chị quý, hôm nay tiệm chưa tôn trọng điều đó.",
    ],
  },
  2: {
    default: [
      "Ly có cố gắng, mình ghi nhận sự cố gắng. #cốgắngđượcghinhận",
      "Hai sao, vì chị chủ cười dễ thương. Phần còn lại cần cải thiện.",
      "Uống được nhưng chưa thương được. #haisao",
      "Ly này như bản nháp của một ly ngon. #bảnnháp",
      "Có tiềm năng, chưa có phong độ. #chờlộtxác",
      "Hai sao, mình vẫn hy vọng vào phiên bản sau. #lầnsauthửlại",
    ],
    "hoc-sinh": [
      "Ly này em chấm hai sao, như bài kiểm tra chưa ôn kỹ. #genzreview",
      "Vibe tiệm xinh mà ly chưa xinh bằng. #tiệmxinh",
      "Hai sao nhưng em vẫn quay lại vì nhóm bạn thích chỗ ngồi.",
      "Chưa slay lắm chị ơi, cố lên. #cốlênchị",
      "Em ủng hộ tiệm nhỏ, nhưng ly hôm nay chưa ổn. #ủnghộtiệmnhỏ",
    ],
    "van-phong": [
      "Đạt yêu cầu tối thiểu, chưa đạt kỳ vọng. #dânvănphòng",
      "Hai sao như bản báo cáo còn nhiều lỗi chính tả. #vănphònglife",
      "Ly ổn để tỉnh ngủ, chưa ổn để vui. #gópýnhẹ",
      "Cần cải thiện độ chính xác. Thái độ phục vụ tốt.",
      "Anh cho hai sao, nhưng vẫn sẽ thử lại tuần sau.",
    ],
    "khach-quen": [
      "Hôm nay pha chưa ngon bằng mọi khi, cô chấm thấp chút. #kháchquen",
      "Con bé mệt hay sao mà ly hôm nay lạ. #tiệmquen",
      "Hai sao thôi, cô thương mà cô cũng phải nói thật.",
      "Cô uống quen nên biết, hôm nay chưa đúng vị.",
      "Lần sau con pha kỹ hơn nha, cô vẫn ghé.",
    ],
    "di-ngang": [
      "Uống tạm cho đỡ khát, chưa có gì đặc biệt. #shipperreview",
      "Hai sao cho một ly vội vàng. #ghévội",
      "Được cái tiện đường, chưa được cái ngon. #tiệnđường",
      "Ly cứu được cơn khát, chưa cứu được tâm trạng.",
      "Anh sẽ thử món khác lần sau.",
    ],
    reviewer: [
      "Hai sao: trình bày ổn, độ chính xác cần cải thiện. #reviewthật",
      "Ly này chưa đủ để lên clip nổi bật. #reviewquán",
      "Mình chấm hai sao, các bạn có thể thử món khác. #mẹoreview",
      "Tiệm có tiềm năng, cần đều tay hơn. #reviewcôngtâm",
      "Điểm cộng cho chị chủ, điểm trừ cho ly.",
    ],
    vip: [
      "Chưa đạt tiêu chuẩn của chị. #kỹtính",
      "Hai sao. Chi tiết chưa chỉn chu.",
      "Chị kỳ vọng nhiều hơn ở một ly giá này.",
      "Phục vụ lịch sự, sản phẩm cần cải thiện.",
      "Chị sẽ cho tiệm thêm một cơ hội.",
    ],
  },
  3: {
    default: [
      "Uống được, như một ngày thứ Tư bình thường. #bìnhthườngthôi",
      "Không tệ, không xuất sắc, rất trung lập. #basao",
      "Ba sao, ổn áp cho một buổi chiều không có gì đặc biệt.",
      "Ly vừa đủ để quên cái nóng, chưa đủ để nhớ mãi. #vừađủ",
      "Ổn, lần sau thử món khác xem sao. #thửmónmới",
      "Ba sao, chị chủ dễ thương cộng thêm nửa sao trong lòng.",
      "Ly giữ được phong độ ở mức an toàn. #antoàn",
    ],
    "hoc-sinh": [
      "Ổn áp nha, nhưng chưa tới mức em khoe nhóm chat. #genzreview",
      "Ba sao, vì em đòi hỏi cao như cô chủ nhiệm. #basao",
      "Ly này 7 điểm, qua môn nhưng chưa giỏi. #quamôn",
      "Uống được, chụp hình đẹp, vị thì bình thường.",
      "Em sẽ quay lại thử món có trân châu. #lầnsauvẫnghé",
    ],
    "van-phong": [
      "Đủ tỉnh táo cho cuộc họp chiều. #dânvănphòng",
      "Ba sao, đạt KPI nhưng chưa vượt KPI. #vănphònglife",
      "Ly ổn, giao đúng giờ nghỉ trưa. #đúnggiờ",
      "Không có gì để phàn nàn, cũng chưa có gì để khen nhiều.",
      "Anh sẽ đặt lại khi cả phòng thèm ngọt.",
    ],
    "khach-quen": [
      "Ly hôm nay bình thường, cô vẫn ghé đều. #kháchquen",
      "Cô chấm ba sao, mai pha ngon như mọi khi nha con.",
      "Vị quen quen nhưng chưa đúng vị cô thích nhất. #tiệmquen",
      "Ổn, con bé dễ thương nên cô thương.",
      "Ba sao cho ngày tiệm đông khách.",
    ],
    "di-ngang": [
      "Tiện đường ghé, uống ổn. #shipperreview",
      "Ba sao cho một ly cứu khát giữa trưa nắng. #ghévội",
      "Không đặc biệt nhưng đáng ghé khi đi ngang. #tiệnđường",
      "Ly vừa đủ để chạy thêm năm đơn.",
      "Ổn, giá hợp lý cho dân chạy xe.",
    ],
    reviewer: [
      "Ba sao: an toàn, chưa có điểm nhấn. #reviewthật",
      "Ly đúng chuẩn cơ bản, cần thêm cá tính. #reviewquán",
      "Phù hợp cho các bạn thích vị nhẹ nhàng. #mẹoreview",
      "Mình sẽ quay lại thử món signature. #reviewcôngtâm",
      "Không có drama, cũng không có wow.",
    ],
    vip: [
      "Tạm được. Chị chưa thấy điểm đặc biệt. #kỹtính",
      "Ba sao, đạt mức cơ bản.",
      "Phục vụ ổn, sản phẩm cần nâng tầm.",
      "Chị sẽ thử thêm một lần trước khi kết luận.",
      "Ly đúng đơn, nhưng chưa làm chị nhớ.",
    ],
  },
  4: {
    default: [
      "10 điểm không có nhưng, à có, lần sau nhanh xíu. #lầnsauvẫnghé",
      "Ngon nha, lần sau mình quay lại. #bốnsao",
      "Ổn áp, chấm điểm cao, trừ hao vì mình khó tính.",
      "Lần sau vẫn ghé vì chị chủ dễ thương. #chịchủdễthương",
      "Ly này làm buổi chiều của mình dễ chịu hơn hẳn. #chiềunay",
      "Gần như hoàn hảo, thiếu đúng một tiếng cạch nữa thôi. #gầnhoànhảo",
      "Bốn sao, giữ một sao để tiệm còn có mục tiêu.",
    ],
    "hoc-sinh": [
      "Ly này slay nha chị, em khoe nhóm chat liền. #genzreview",
      "Bốn sao vì em sợ chị chủ tự mãn, chứ ngon lắm. #ngonthiệt",
      "Ngon tới mức em quên luôn bài tập về nhà. #quênbàitập",
      "Đi học về ghé là chân ái. #chânái",
      "Em sẽ rủ cả lớp tới, chuẩn bị tinh thần nha chị.",
    ],
    "van-phong": [
      "Ly này là đồng đội đáng tin nhất của anh chiều nay. #dânvănphòng",
      "Bốn sao, đạt và vượt KPI giải khát. #vănphònglife",
      "Ngon, nhanh, đúng đơn. Anh sẽ đặt cho cả phòng. #đặtnhóm",
      "Chất lượng ổn định, anh khuyến nghị. #khuyếnnghị",
      "Uống xong trả lời email nhẹ nhàng hơn hẳn.",
    ],
    "khach-quen": [
      "Con bé pha ngon, cô ghé hoài không chán. #kháchquen",
      "Ly này đúng vị cô thích, chỉ hơi lâu chút xíu. #tiệmquen",
      "Bốn sao cho đứa con gái chịu khó của xóm.",
      "Cô giới thiệu mấy bà trong chợ rồi đó con.",
      "Ngon, nhớ giữ vị này nha con.",
    ],
    "di-ngang": [
      "Ghé vội mà ngon bất ngờ. #shipperreview",
      "Bốn sao, anh sẽ ghé mỗi lần chạy ngang. #tiệnđường",
      "Ly ngon, giá ổn, tiệm vui vẻ. #ghévội",
      "Uống xong chạy thêm mười đơn không mệt.",
      "Anh lưu địa chỉ tiệm vào bản đồ rồi.",
    ],
    reviewer: [
      "Bốn sao: vị chuẩn, trình bày đẹp, thời gian ổn. #reviewthật",
      "Đáng thử nha mọi người, mình sẽ quay lại. #reviewquán",
      "Tiệm nhỏ mà có tâm, khán giả ủng hộ nha. #ủnghộtiệmnhỏ",
      "Gần hoàn hảo, chỉ cần đều tay hơn. #reviewcôngtâm",
      "Clip này mình để nhạc vui vì ly vui.",
    ],
    vip: [
      "Khá tốt. Chị hài lòng. #kỹtính",
      "Bốn sao, đúng yêu cầu của chị.",
      "Chị sẽ quay lại và giới thiệu bạn bè.",
      "Sản phẩm ổn, dịch vụ lịch sự.",
      "Gần đạt chuẩn của chị, cố thêm chút nữa.",
    ],
  },
  5: {
    default: [
      "Đúng chuẩn, chị chủ đo lường như kỹ sư. #nămsao",
      "Ly này ngon tới mức mình quên luôn deadline. #quêndeadline",
      "Năm sao, thêm một sao tưởng tượng cho cái nắp kêu cạch. #tiếngcạch",
      "Không có gì để chê, chỉ có gì để khen. #10điểm",
      "Lần sau vẫn ghé vì chị chủ dễ thương, và vì ly quá ngon. #lầnsauvẫnghé",
      "Mười điểm không có nhưng. Thật đó. #khôngcónhưng",
      "Ly này đáng để mình chụp hình trước khi uống. #sốngảo",
    ],
    "hoc-sinh": [
      "Ly này slay hết nấc, em đánh giá mười trên mười. #genzreview",
      "Năm sao, ngon như được nghỉ học đột xuất. #nghỉhọc",
      "Chân ái của em đây rồi, chị chủ là idol. #chânái",
      "Em khoe nhóm chat, giờ cả lớp đòi ghé. #cảlớpghé",
      "Ngon xỉu, em để dành tiền ăn sáng tuần sau luôn.",
    ],
    "van-phong": [
      "Ly này cứu cả buổi họp chiều của anh. #dânvănphòng",
      "Năm sao, vượt KPI giải khát của cả phòng. #vượtkpi",
      "Đúng đơn, đúng giờ, đúng vị. Hiếm có. #vănphònglife",
      "Anh sẽ đề xuất tiệm làm nhà cung cấp chính của phòng. #đặtnhóm",
      "Uống xong anh trả lời email bằng giọng tích cực.",
    ],
    "khach-quen": [
      "Con bé pha ngon nhất xóm, cô nói thiệt. #kháchquen",
      "Đúng vị cô thích từ hồi nào tới giờ. #tiệmquen",
      "Năm sao cho đứa nhỏ biết nhớ khẩu vị cô.",
      "Cô giới thiệu cả nhóm dưỡng sinh tới uống rồi đó.",
      "Ngon như mọi khi, mà còn ngon hơn mọi khi.",
    ],
    "di-ngang": [
      "Ghé vội mà gặp ly ngon nhất tuần. #shipperreview",
      "Năm sao, anh sẽ đổi tuyến để đi ngang tiệm. #đổituyến",
      "Ngon, nhanh, vui vẻ. Đúng chuẩn cho dân chạy xe. #ghévội",
      "Uống xong chạy cả chiều không mệt.",
      "Anh kể cho cả nhóm shipper nghe rồi.",
    ],
    reviewer: [
      "Năm sao tròn: vị, trình bày, tiếng cạch đều đạt. #reviewthật",
      "Đây là tiệm mình muốn giới thiệu cho mọi người. #reviewquán",
      "Clip hôm nay mình để tên là ly hoàn hảo. #lyhoànhảo",
      "Khán giả ơi đi liền, không hối hận. #điliền",
      "Tiệm nhỏ mà chuẩn chỉnh từng bước. #ủnghộtiệmnhỏ",
    ],
    vip: [
      "Hoàn hảo. Đúng từng chi tiết chị yêu cầu. #kỹtính",
      "Năm sao. Chị hiếm khi cho năm sao.",
      "Chị sẽ giới thiệu cả công ty. #giớithiệu",
      "Chuyên nghiệp và chỉn chu. Chị rất hài lòng.",
      "Ly đúng chuẩn, dịch vụ đúng tầm.",
    ],
  },
};
