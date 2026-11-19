// Nội dung cho các cơ chế M3: đơn nhiều ly, bàn pha đôi / ba chỗ, nhiệm vụ ngày, quảng bá, gói ký gửi, trang trí.
// Giọng mạng xã hội Việt, hài tử tế: châm chọc tình huống, không chê người. Không emoji, không thương hiệu thật, nhân vật hư cấu.
// Bảng theo nhóm khách: { default: [...], "hoc-sinh": [...], "van-phong": [...], "khach-quen": [...], "di-ngang": [...], "reviewer": [...], "vip": [...] }.
// core/shift.js gộp default + nhóm khách (poolFor) rồi chọn bằng freshLine: không lặp câu trong cùng ca.
// Biến: {self} {Self} {call} {Call} {drink} {sugar} {ice} {topping} {name} {n} {N}.

/** Câu gọi đơn nhiều ly (nhóm bạn, văn phòng, gia đình). {n} = số ly. */
export const ORDER_MULTI = {
  default: [
    "{Call} ơi cho {self} {n} ly, ly đầu {drink} {sugar} đường {ice}. Mấy ly kia ghi trên phiếu giùm nha, nhóm chat đang réo.",
    "{Self} gọi {n} ly cho cả phòng. Ai uống gì {self} chụp màn hình gửi {call} rồi đó.",
    "{n} ly nha {call}. {Self} là người duy nhất trong nhóm chịu đi mua, nên ly nào đúng là công của {self}.",
    "{Call} ơi {n} ly, ly đầu {drink}. {Self} được giao nhiệm vụ đi mua vì lỡ hỏi \"có ai uống gì không\".",
    "Cho {self} {n} ly nha {call}. Danh sách này qua ba lần sửa, bản cuối cùng là bản này, chắc vậy.",
    "{n} ly, mỗi ly một số phận khác nhau. Phiếu ghi rõ rồi, {call} cứu {self} với.",
  ],
  "hoc-sinh": [
    "Chị ơi {n} ly cho nhóm em, ly đầu {drink} {sugar} đường. Tụi nó đang đứng ngoài cửa giả bộ không quen em.",
    "Chị ơi {n} ly nha. Cả nhóm góp tiền bằng tiền lẻ, em xin lỗi trước vì túi tiền kêu leng keng.",
    "Em gọi {n} ly cho nhóm thuyết trình. Thuyết trình chưa xong mà trà sữa phải xong trước chị ơi.",
    "{n} ly chị ơi, ai gọi gì em ghi trên tay rồi. Mồ hôi làm nhoè chữ một xíu thôi.",
    "Chị ơi cho em {n} ly, đứa nào cũng đòi ít đá mà đứa nào cũng than nóng. #nhomban",
  ],
  "van-phong": [
    "Em ơi {n} ly cho phòng anh, ly đầu {drink} {sugar} đường {ice}. Sếp duyệt ngân sách trà sữa nhanh hơn duyệt đề xuất.",
    "Cho anh {n} ly nha em. Phòng anh vừa xong buổi họp \"năm phút\" dài hai tiếng, cần hồi sức tập thể.",
    "{n} ly em ơi. Anh đặt theo file tổng hợp có cột ghi chú, cột ghi chú dài hơn cột tên.",
    "Em làm giùm anh {n} ly, ly đầu {drink}. Ai uống sai ly thì cả phòng lại mở thêm một cuộc họp.",
    "Anh lấy {n} ly, ghi tên từng ly giùm anh. Trong phòng có hai anh Tuấn, đừng để hai anh tranh nhau.",
  ],
  "khach-quen": [
    "Con ơi cho cô {n} ly, ly đầu {drink} {sugar} đường. Cả nhà về chơi, đứa nào cũng nói \"quán con hẻm mình ngon\".",
    "Cô lấy {n} ly nha con. Ly của ông nhà là ít ngọt, ổng nói vậy chứ ổng hay xin thêm.",
    "Con ơi {n} ly cho mấy đứa cháu cô. Tụi nó ở xa về, cô muốn tụi nó nhớ hẻm mình bằng ly trà này.",
    "{n} ly nghen con. Cô ghi tên từng đứa lên giấy rồi, chữ cô to, con đọc dễ hơn đọc đơn thuốc.",
  ],
  "di-ngang": [
    "Em ơi {n} ly, ly đầu {drink}. Anh mua cho anh em trong đội xe, đứa nào cũng dặn \"đừng quên tao\".",
    "Cho anh {n} ly nha em. Anh chạy xe có cái móc treo được đúng {n} ly, không hơn không kém.",
    "{n} ly em ơi, anh giao hàng xong ghé mua cho nhà. Nhà anh đông, ly nào thiếu là có biến.",
  ],
  reviewer: [
    "Chị chủ ơi cho mình {n} ly, ly đầu {drink}. Mình review theo nhóm, khán giả thích nhìn bàn tay cầm nhiều ly.",
    "Mình lấy {n} ly nha chị, quay một clip \"thử hết menu\". Thật ra là thử {n} món vì ví có hạn.",
    "{n} ly cho team quay phim của mình. Team có ba người: mình, máy quay, và người cầm đèn là em gái mình.",
  ],
  vip: [
    "Em ơi chị lấy {n} ly cho buổi gặp đối tác. Ly đầu {drink} {sugar} đường, đúng từng giọt nha em.",
    "Cho chị {n} ly, mỗi ly một yêu cầu, chị ghi rõ trên phiếu. Đúng hết là chị giới thiệu cả tầng.",
    "Chị đặt {n} ly cho phòng chị. Phòng chị khó tính, chị là người dễ tính nhất phòng đó em.",
  ],
};

/** Kết quả đơn nhiều ly → review. Mỗi nhóm khách gộp default + câu riêng ≥ 8 câu. */
export const MULTI_REVIEW = {
  // đúng hết, 4–5 sao
  allRight: {
    default: [
      "Cả nhóm {n} ly đúng hết, nhóm chat im lặng vì bận uống. #donnhom",
      "{N} ly giao một lượt, không ai bị đổi ly. Hiếm có khó tìm.",
      "Đơn {n} ly mà tiệm ghép đúng từng ly, như người giữ xe nhớ mặt từng chiếc. #dungtungly",
      "{N} ly, {n} người, 0 cuộc cãi nhau. Tiệm này chữa lành tình bạn.",
      "Đi mua giùm cả nhóm mà về được khen. Lần đầu tiên trong đời {self} là người hùng. #nguoidimua",
      "Ly nào cũng đúng tên đúng vị. Đề nghị tiệm mở lớp dạy đọc phiếu.",
    ],
    "hoc-sinh": [
      "Cả nhóm em uống xong không ai đòi đổi ly. Lần đầu nhóm em đồng lòng như vậy. #nhomban",
      "{N} ly đúng hết, em được bầu làm trưởng nhóm đi mua nước vĩnh viễn rồi chị ơi.",
      "Ly nào cũng đúng, đứa kén nhất nhóm cũng gật đầu. Chị chủ là huyền thoại. #10diem",
    ],
    "van-phong": [
      "Phòng anh {n} ly, không ai phải nhắn \"ủa ly của em đâu\". Năng suất buổi chiều tăng rõ. #vanphong",
      "Đơn nhóm đúng hết, sếp hỏi quán nào để đặt tiếp. Anh được cộng điểm thái độ.",
      "Giao một lượt, đủ ly, đúng tên. Gọn như một email không cần trả lời. #KPItrasua",
    ],
    "khach-quen": [
      "Cả nhà cô uống đúng ly của mình, ông nhà khen ít ngọt mà vẫn xin thêm ngụm của cô.",
      "Mấy đứa cháu cô khen quá trời, đứa nào cũng hỏi mai về hẻm uống nữa. #hemnhaminh",
      "{N} ly con làm đúng hết, cô kể nguyên chợ nghe rồi đó nghen.",
    ],
    "di-ngang": [
      "Anh em trong đội ai cũng đúng ly, không ai phải giành. Hiếm lắm luôn. #anhemdoixe",
      "{N} ly treo trên xe về tới nơi vẫn đúng tên. Tiệm làm đơn chuẩn như app định vị.",
      "Mua cho cả nhà, về không ai than. Anh xin năm sao cho sự bình yên.",
    ],
    reviewer: [
      "Thử {n} món một lượt, món nào cũng đúng mô tả. Clip này không cần cắt cảnh. #reviewthat",
      "Team mình {n} người {n} ly, không ai bị nhầm. Khán giả hỏi có tài trợ không, câu trả lời là không. #khongquangcao",
      "Đơn nhiều ly là bài thi khó nhất của một tiệm. Tiệm này qua môn. #daxem",
    ],
    vip: [
      "{N} ly cho đối tác, đúng từng yêu cầu. Chị đặt tiếp tuần sau. #dungchuan",
      "Phòng chị khó tính mà {n} ly không ai góp ý. Chị hơi bất ngờ, theo hướng tốt.",
      "Đúng hết, giao gọn, ly đẹp. Chị giới thiệu nguyên tầng rồi đó em.",
    ],
  },
  // đơn ba ly năm sao
  perfect3: {
    default: [
      "Ba ly, ba yêu cầu khác nhau, ba lần đúng. Tiệm này chơi hat-trick. #hattrickbaly",
      "Đơn ba ly năm sao. {Self} xin đề cử tiệm cho giải \"người đọc phiếu của năm\".",
      "Ba ly ra quầy cùng một lượt, ly nào cũng đúng tên. Cảm giác như xem ảo thuật. #baly5sao",
      "Ba người ba khẩu vị mà không ai phải thoả hiệp. Tiệm này làm được điều mà cuộc họp gia đình chưa từng làm được.",
      "Ba ly hoàn hảo. {Self} chụp hình ba ly xếp hàng như ba anh em ruột. #dongphuc",
      "Ba ly đúng hết từng muỗng đường. {Call} có cái cân trong mắt hả?",
    ],
    "hoc-sinh": [
      "Ba đứa ba vị mà chị làm đúng hết, nhóm em quyết định không đổi quán nữa. #quanquen",
      "Ba ly năm sao, em đăng story kèm câu \"nhóm này có quán ruột rồi\". #quanruot",
      "Đứa ít đá, đứa nhiều đá, đứa không đá, chị đều nhớ. Chị đi thi trí nhớ được không chị?",
    ],
    "van-phong": [
      "Ba ly ba yêu cầu, không ai phải mở lại file ghi chú. Anh xin năm sao và một cái ôm tinh thần. #vanphong",
      "Đơn ba ly đúng hết trước giờ họp. Sếp anh tưởng anh đặt từ hôm qua.",
      "Ba ly năm sao. Báo cáo quý chưa xong nhưng trà sữa thì đã hoàn thành chỉ tiêu. #KPItrasua",
    ],
    "khach-quen": [
      "Ba đứa cháu ba vị, con làm đúng hết. Cô cảm động như coi phim cuối tuần.",
      "Ba ly con pha ngon, đúng, đẹp. Cô dặn mấy đứa nhỏ: quán này là quán của nhà mình. #hemnhaminh",
      "Năm sao nghen con. Ba ly mà như ba món quà gói kỹ.",
    ],
    "di-ngang": [
      "Ba ly treo xe đi ba cây số, về tới nhà đúng tên từng người. Năm sao không bàn cãi. #giaohangchuan",
      "Ba ly ba yêu cầu, anh chỉ đọc một lần mà tiệm làm đúng. Chuyên nghiệp hơn đơn hàng của anh.",
      "Năm sao cho ba ly. Anh em trong đội tưởng anh mua ở chỗ sang.",
    ],
    reviewer: [
      "Thử thách ba ly ba yêu cầu: tiệm qua bài với điểm tuyệt đối. Clip này lên là nổ. #thuthach",
      "Ba ly, ba lớp đá khác nhau, ba mức đường chuẩn từng nấc. Mình đo bằng mắt, mắt mình khó tính. #reviewthat",
      "Đơn ba ly năm sao đầu tiên trong series của mình. Tiệm này vào danh sách đáng ghé. #danhsachdangghe",
    ],
    vip: [
      "Ba ly cho ba đối tác, đúng tuyệt đối. Chị ít khi khen, nên câu này đáng giá. #dungchuan",
      "Ba ly năm sao. Chị sẽ đặt cho buổi họp tháng sau, em giữ đúng phong độ nha.",
      "Đối tác chị hỏi trà mua ở đâu mà đúng ý vậy. Chị nói tên tiệm luôn. #gioithieu",
    ],
  },
  // đúng một ly lệch (đường / đá / topping / nắp)
  oneWrong: {
    default: [
      "{N} ly thì có một ly đi lạc một chút. Người uống ly đó đang nhìn cả nhóm bằng ánh mắt hy sinh. #motlylech",
      "Cả đơn ngon, riêng một ly như bị ai đó bấm nhầm nút. Tiệm làm tốt, chỉ là chưa tốt đều.",
      "Một ly lệch trong đơn {n} ly. Nhóm chat đang bỏ phiếu xem ai phải uống ly đó.",
      "Ly của {self} đúng, ly của bạn {self} thì hơi \"phiên bản thử nghiệm\". #mottrongnhieu",
      "{N} ly mà sai đúng một ly. Tỉ lệ không tệ, chỉ là người trúng ly đó hơi buồn.",
      "Đơn gần như hoàn hảo, chữ \"gần như\" đang ngồi trong một cái ly. #gannhu",
    ],
    "hoc-sinh": [
      "Ly của đứa bạn em bị lệch xíu, nó giận em vì em là người đi mua. Oan quá chị ơi. #nguoidimua",
      "Hai ly đúng, một ly sai, nhóm em quyết định oẳn tù tì xem ai uống. #oantuti",
      "Ly của em ngon, ly bạn em thì như bài kiểm tra quên học bài. Lần sau chị đọc kỹ giùm em nha.",
    ],
    "van-phong": [
      "Đơn nhóm có một ly lệch, người trúng ly đó là sếp. Phòng anh đang rất yên lặng. #vanphong",
      "Một ly sai trong đơn, như file đính kèm gửi nhầm phiên bản. Vẫn mở được, nhưng không đúng ý.",
      "Cả phòng hài lòng trừ một người, người đó đang soạn email phản hồi. #feedback",
    ],
    "khach-quen": [
      "Ly của ông nhà cô bị lệch, ổng nói \"không sao\" mà mặt ổng nói \"có sao\". Lần sau con để ý nghen.",
      "Mấy ly ngon, chỉ có ly của đứa cháu hơi khác phiếu. Nó nhỏ nên nó tưởng vị mới.",
      "Một ly lệch thôi con, cô không trách, cô chỉ ghi nhớ nhẹ nhàng thôi.",
    ],
    "di-ngang": [
      "Ly của thằng em trong đội bị lệch, nó bắt anh chở nó quay lại. Anh xin khất qua mai. #anhemdoixe",
      "Đơn {n} ly sai một ly. Anh giao hàng mà giao thiếu một món cũng bị đánh giá y vậy.",
      "Một ly đi lạc, mấy ly kia ngon. Anh cho điểm khá, vì anh cũng từng giao nhầm.",
    ],
    reviewer: [
      "Đơn nhiều ly: một ly lệch phiếu. Mình vẫn ghi nhận tốc độ, nhưng chấm trừ sự đồng đều. #reviewthat",
      "Khán giả hỏi ly nào sai, mình giơ ly đó lên camera. Tiệm có cơ hội sửa ở tập sau. #tapsau",
      "Một ly lệch trong đơn quay clip. Clip vẫn đăng, kèm phụ đề \"tiệm đang luyện công\". #luyencong",
    ],
    vip: [
      "Một ly trong đơn không đúng yêu cầu, và đó là ly của đối tác. Em hiểu chị khó xử chưa. #dungchuan",
      "Chị đặt nhiều ly vì tin tiệm. Một ly sai là một ly làm chị phải giải thích.",
      "Đơn tốt, trừ một ly. Chị cho thêm một cơ hội, em giữ giùm chị chữ tín.",
    ],
  },
  // hai ly đúng nhưng ghép nhầm người
  swapped: {
    default: [
      "Ly nào cũng ngon, chỉ là ly của ai thì người đó cầm của người khác. Nhóm đổi vòng tròn như chơi trò chơi. #doily",
      "Hai ly đúng hết, chỉ có tên bị hoán đổi. Hôm nay {self} được uống thử cuộc đời của bạn mình.",
      "Ly đúng, người sai. Cả nhóm đứng đổi ly giữa vỉa hè như trao giải. #traoly",
      "Tiệm pha chuẩn, chỉ có khâu ghép ly đi đường vòng. Lần sau ghi tên to như bảng hiệu giùm.",
      "{Self} uống nửa ly mới phát hiện đây là ly ít đá của bạn. Thảo nào nó nhìn {self} như nhìn kẻ trộm. #nhamly",
      "Đổi ly đổi vận, nhóm {self} hôm nay may mắn chéo. #doilydoivan",
    ],
    "hoc-sinh": [
      "Em uống trúng ly 100% đường của bạn, giờ em tỉnh tới mức muốn làm thêm bài tập. #nhamly",
      "Hai đứa tráo ly rồi mới phát hiện, nhóm em gọi đây là trao đổi văn hoá. #trao",
      "Ly đúng nhưng tráo chủ, chị ơi lần sau ghi tên giùm em, tụi em hay giành lắm.",
    ],
    "van-phong": [
      "Ly anh với ly chị kế toán bị đổi chỗ. Giờ chị ấy biết anh uống ngọt, bí mật lớn nhất phòng bị lộ. #bimat",
      "Đúng món sai người, giống mail gửi đúng nội dung mà nhầm người nhận. #nhamnguoinhan",
      "Cả phòng đổi ly theo vòng tròn, mất năm phút, tương đương một cuộc họp nhỏ.",
    ],
    "khach-quen": [
      "Ly ít ngọt của ông lại về tay cô, ly của cô về tay ổng. Ổng khen ngọt quá trời. Thôi cũng vui.",
      "Hai ly đúng mà tráo chỗ, cô với mấy đứa nhỏ đổi lại liền. Con lần sau ghi tên nghen.",
      "Mấy đứa cháu tráo ly cười quá trời. Cô chấm điểm vui, trừ điểm cẩn thận. #hemnhaminh",
    ],
    "di-ngang": [
      "Ly của anh với ly thằng em bị đổi. Nó uống ly nhiều đá của anh xong lạnh run trên xe. #anhemdoixe",
      "Đúng ly mà tráo tên, như hai đơn giao nhầm nhà sát vách. Đổi lại là xong.",
      "Anh đổi ly giữa đường, may mà đèn đỏ lâu. Lần sau ghi tên giùm anh nha em.",
    ],
    reviewer: [
      "Hai ly đúng công thức nhưng tráo người nhận. Khán giả cười nhiều hơn tập review đúng. #loicoduyen",
      "Mình uống nhầm ly của em quay phim, em ấy giận mình nửa clip. Tiệm đúng món, sai địa chỉ. #nhamly",
      "Chấm công thức: đủ điểm. Chấm khâu ghép ly: còn nợ một bài. #reviewthat",
    ],
    vip: [
      "Ly của chị nằm trong tay đối tác. Đối tác lịch sự uống luôn. Chị không biết nói gì hơn. #nhamly",
      "Đúng món nhưng sai người, em cần một hệ thống ghi tên chuyên nghiệp hơn.",
      "Hai ly chuẩn vị mà tráo chỗ. Chị trừ điểm vì chị phải đứng đổi ly trước mặt khách.",
    ],
  },
  // một ly tới trễ hẳn so với ly còn lại
  late: {
    default: [
      "Ly đầu tới thì đá còn nguyên, ly sau tới thì ly đầu đã uống xong. Cả nhóm uống theo ca. #uongtheoca",
      "Ly thứ hai tới trễ tới mức người chờ ly đó kịp kể hết chuyện cuối tuần. #chotly",
      "Đơn nhiều ly mà giao như phim nhiều tập, tập cuối hơi lâu ra.",
      "Một ly tới trước, một ly tới sau. {Self} đứng giữa hai thế hệ trà sữa.",
      "Ly cuối cùng tới, cả nhóm vỗ tay như đón người đi xa về. #vetoi",
      "Ngon đều, nhưng ly sau tới trễ, ly trước đã kịp tan đá và tan luôn sự kiên nhẫn. #doily",
    ],
    "hoc-sinh": [
      "Bạn em nhìn tụi em uống trước mà mặt như bị bỏ rơi trong nhóm chat. Ly nó tới sau cùng. #bobroi",
      "Ly đầu ra lúc em còn vui, ly cuối ra lúc chuông vào học gần reo. Chị nhanh hơn xíu nha.",
      "Đứa có ly cuối được cả nhóm nhường uống thử. Tình bạn được kiểm chứng. #tinhban",
    ],
    "van-phong": [
      "Ly đầu tới lúc còn mười phút họp, ly cuối tới lúc đã họp xong. Phòng anh uống theo múi giờ. #muigio",
      "Một ly tới trễ, người đó đã kịp mở laptop làm việc. Tiệm vô tình tăng năng suất.",
      "Đơn nhóm tới hai đợt, giống báo cáo nộp hai lần vì quên đính kèm.",
    ],
    "khach-quen": [
      "Ly của ông nhà tới sau, ổng ngồi chờ mà kể hết chuyện thời trẻ. Cô nghe lần thứ một trăm.",
      "Mấy đứa nhỏ uống xong rồi ly của cô mới tới. Không sao, cô ngồi chờ quen rồi.",
      "Ly sau tới trễ chút mà vẫn ngon. Con lần sau làm đều tay hơn nghen.",
    ],
    "di-ngang": [
      "Ly đầu anh treo xe, ly sau anh chờ thêm. Anh trễ một đơn giao, nhưng ly vẫn ngon. #chotly",
      "Đơn hai ly mà anh chờ như chờ đèn đỏ ngã tư lớn. Lần sau làm song song giùm anh.",
      "Ly cuối tới, ly đầu đã tan đá. Anh uống ly đầu như uống trà đá vỉa hè.",
    ],
    reviewer: [
      "Đơn nhiều ly: ly cuối tới cách ly đầu khá lâu. Mình trừ điểm nhịp, cộng điểm vị. #reviewthat",
      "Clip có đoạn mình ngồi chờ ly thứ hai, khán giả comment \"tua giùm\". #tuagium",
      "Ly đầu lên hình đá đẹp, ly sau lên hình đá tan. Hai cảnh hai mùa. #haimua",
    ],
    vip: [
      "Đối tác uống xong ly đầu rồi ly của chị mới tới. Thời gian của chị đáng giá, em nhớ nha.",
      "Vị chuẩn, nhịp chưa chuẩn. Đơn nhiều ly thì giao cùng lúc mới chuyên nghiệp.",
      "Chị chờ ly cuối lâu hơn chờ thang máy giờ cao điểm. Lần sau đều tay hơn. #dungchuan",
    ],
  },
  // bàn pha đôi / ba chỗ: các ly hoàn tất gần như cùng lúc
  sync: {
    default: [
      "Hai ly ra cùng một tích tắc, như song kiếm hợp bích. #songkiem",
      "{N} ly hoàn thành cùng lúc, nhân viên tiệm có nhiều tay hơn {self} tưởng. #nhieutay",
      "Bàn pha nhiều chỗ chạy mượt như dàn nhạc, tiếng nắp kêu cạch đồng thanh. #dongthanh",
      "Đơn {n} ly mà không ai phải chờ ai. Nhóm {self} uống cùng một nhịp, cảm giác đoàn kết lạ thường.",
      "{Self} vừa chớp mắt thì {n} ly đã xếp hàng chờ. Đề nghị tiệm đi biểu diễn. #bieudien",
      "Pha đồng loạt mà ly nào cũng đúng. Tay trái tay phải của tiệm hiểu nhau hơn nhiều cặp đôi.",
    ],
    "hoc-sinh": [
      "{N} ly ra cùng lúc, cả nhóm chạm ly cùng lúc, clip nhóm em đẹp như quảng cáo. #nhomban",
      "Chị pha hai ly như chơi game hai tay, em xin làm fan. #fanchuquan",
      "Không đứa nào phải chờ, không đứa nào giành uống trước. Chị chủ vừa cứu tình bạn nhóm em.",
    ],
    "van-phong": [
      "{N} ly cùng lúc, phòng anh về họp kịp giờ. Quy trình gọn như phần mềm mới cập nhật. #quytrinh",
      "Tiệm chạy song song, anh đề xuất phòng anh học theo. Phòng anh hiện đang chạy tuần tự rất chậm.",
      "Nhận đủ {n} ly trong một lần, anh không phải đứng chờ trả lời tin nhắn sếp. #vanphong",
    ],
    "khach-quen": [
      "Con pha một lúc mấy ly mà ly nào cũng đúng, cô coi mà chóng mặt giùm con.",
      "Mấy đứa cháu cô có ly cùng lúc, khỏi đứa nào khóc. Con giỏi quá nghen. #hemnhaminh",
      "Bàn pha mới của con lẹ ghê, cô chưa kịp kể chuyện chợ thì ly đã xong.",
    ],
    "di-ngang": [
      "{N} ly xong cùng lúc, anh treo xe chạy liền, đơn sau không trễ phút nào. #giaohangchuan",
      "Tiệm pha song song nhanh như anh luồn hẻm giờ tan tầm.",
      "Anh chưa kịp tắt máy xe thì ly đã xong. Năm sao cho tốc độ.",
    ],
    reviewer: [
      "Cảnh pha song song quay chậm lại đẹp như phim võ thuật. Mình dùng làm cảnh mở đầu. #canhmodau",
      "Hai chỗ pha, hai ly, một nhịp. Khán giả comment \"chủ tiệm có hai bản sao\". #bansao",
      "Tốc độ ra ly của đơn nhiều ly: điểm tuyệt đối. Tiệm đầu tư bàn pha đúng chỗ. #reviewthat",
    ],
    vip: [
      "{N} ly đến cùng lúc, đối tác không ai phải chờ ai. Đây là thứ chị gọi là chuyên nghiệp. #dungchuan",
      "Pha song song mà vẫn chuẩn. Chị đánh giá cao đầu tư của tiệm.",
      "Nhanh, đều, đúng. Chị đặt định kỳ được rồi đó em.",
    ],
  },
};

/** Câu khách nói ngay khi nhận đơn nhiều ly (bong bóng thoại), theo kết quả. */
export const MULTI_SAY = {
  allRight: {
    default: [
      "Đủ {n} ly, đúng hết! {Self} về nhóm như người chiến thắng.",
      "Ly nào cũng đúng tên luôn {call}. {Self} cảm ơn thay mặt cả nhóm.",
      "{N} ly gọn gàng. {Call} ghép ly còn khéo hơn {self} xếp lịch.",
      "Đúng hết rồi nè, nhóm chat đang thả tim {call} đó.",
    ],
    "hoc-sinh": ["Đúng hết chị ơi, em về khoe là em chọn quán chuẩn!", "Tụi nó hết cãi rồi chị, ly nào cũng đúng."],
    "van-phong": ["Đủ ly đúng tên, anh về họp kịp. Cảm ơn em nhiều!", "Phòng anh sẽ không phải mở thêm cuộc họp về trà sữa nữa."],
    "khach-quen": ["Đủ hết rồi con, cô đem về cho cả nhà liền.", "Con làm đúng hết, cô mừng ghê."],
    "di-ngang": ["Đủ ly, anh treo xe chạy liền nha em!", "Đúng hết, anh em trong đội khỏi giành."],
    reviewer: ["Đủ {n} ly, mình quay cảnh chạm ly luôn nha chị.", "Đúng hết, clip này khỏi cắt."],
    vip: ["Đúng từng ly. Chị hài lòng.", "Tốt, em làm đúng như chị mong."],
  },
  perfect3: {
    default: [
      "Ba ly, ba yêu cầu, ba lần đúng. {Call} là ảo thuật gia hả?",
      "Hoàn hảo cả ba ly! {Self} muốn vỗ tay mà tay đang cầm ba ly.",
      "Ba ly đúng hết, {self} chụp hình làm kỷ niệm liền.",
      "Đơn ba ly đẹp như bộ ba siêu anh hùng. Cảm ơn {call}!",
    ],
    "hoc-sinh": ["Ba đứa ba vị mà đúng hết, chị đỉnh thiệt!", "Em đăng story ba ly liền chị ơi."],
    "van-phong": ["Ba ly chuẩn, sếp anh sẽ hỏi quán này đó em.", "Ba yêu cầu khác nhau mà em làm đúng hết, anh phục."],
    "khach-quen": ["Ba đứa cháu cô có quà rồi. Con giỏi quá!", "Ba ly đều ngon, cô cảm động ghê."],
    "di-ngang": ["Ba ly chuẩn chỉnh, anh treo xe mà tự hào.", "Đơn ba ly đúng hết, hiếm lắm em ơi."],
    reviewer: ["Ba ly năm sao, đây là cảnh kết của clip!", "Thử thách ba ly: hoàn thành!"],
    vip: ["Ba ly cho đối tác đều chuẩn. Chị sẽ quay lại.", "Không có gì để chê. Hiếm đó em."],
  },
  oneWrong: {
    default: [
      "Mấy ly đúng hết, chỉ có một ly hơi lạc đề {call} ơi.",
      "Ủa ly này hình như hơi khác phiếu. Mấy ly kia thì chuẩn.",
      "Một ly đi lạc rồi {call}, người trúng ly đó đang nhìn {self} kìa.",
      "Gần hoàn hảo rồi, chỉ trượt đúng một ly.",
    ],
    "hoc-sinh": ["Chị ơi ly của bạn em hơi lệch, nó đang dỗi em kìa.", "Hai ly đúng, một ly như đề thi trắc nghiệm chị ơi."],
    "van-phong": ["Có một ly lệch, mà đó là ly của sếp anh em ơi.", "Đơn ổn, trừ một ly. Anh về giải trình."],
    "khach-quen": ["Ly của ông nhà hơi khác con ơi, mà thôi cô đem về.", "Một ly lệch xíu, lần sau con để ý nghen."],
    "di-ngang": ["Một ly hơi sai rồi em, thằng em anh kén lắm.", "Đơn gần chuẩn, sai một ly thôi."],
    reviewer: ["Một ly lệch phiếu, mình ghi chú trong clip nha chị.", "Ly này khác mô tả rồi, mấy ly kia ổn."],
    vip: ["Có một ly chưa đúng yêu cầu. Em xem lại giùm chị.", "Một ly sai là chị phải giải thích với đối tác đó em."],
  },
  swapped: {
    default: [
      "Hai ly đều đúng, chỉ có tên bị đổi chỗ cho nhau {call} ơi.",
      "Ủa ly của {self} sao nằm bên này? Thôi để tụi {self} tự đổi.",
      "Ly đúng mà người sai, nhóm {self} đổi vòng tròn nha.",
      "Ly này là của bạn {self}, ly của {self} đang ở tay bạn kia kìa.",
    ],
    "hoc-sinh": ["Em uống nhầm ly của bạn rồi chị, ngọt gấp đôi luôn!", "Tráo ly rồi chị ơi, tụi em đổi lại liền."],
    "van-phong": ["Ly anh với ly chị kế toán bị tráo, bí mật lộ hết rồi em.", "Đúng món sai người, giống mail gửi nhầm vậy."],
    "khach-quen": ["Ly của cô với ly ông bị đổi rồi con, thôi để cô đổi.", "Tráo chỗ rồi con, mà ly nào cũng ngon."],
    "di-ngang": ["Ly của anh với thằng em bị đổi, để anh đổi lại.", "Giao nhầm nhà sát vách rồi em ơi, đổi chút là xong."],
    reviewer: ["Hai ly tráo người nhận rồi chị, mình quay luôn cảnh đổi ly.", "Đúng công thức, sai địa chỉ nha chị."],
    vip: ["Ly của chị đang trong tay đối tác rồi em.", "Em ghi tên kỹ hơn giùm chị."],
  },
  late: {
    default: [
      "Ly cuối cùng cũng tới, cả nhóm tưởng nó lạc đường.",
      "Ly đầu uống gần hết rồi ly sau mới tới {call} ơi.",
      "Cuối cùng đủ ly. {Self} xin vỗ tay cho ly tới sau cùng.",
      "Đủ rồi, mà ly đầu đá tan sạch rồi {call}.",
    ],
    "hoc-sinh": ["Bạn em chờ ly lâu tới mức muốn ra về chị ơi.", "Ly cuối tới rồi, tụi em uống được chung rồi!"],
    "van-phong": ["Ly cuối tới lúc anh đã họp xong em ơi.", "Đơn tới hai đợt, anh chạy hai lần."],
    "khach-quen": ["Ly của ông tới sau mà vẫn ngon, thôi được con.", "Cô chờ chút cũng được, mà lần sau nhanh nghen."],
    "di-ngang": ["Ly cuối tới rồi, anh trễ một đơn rồi em ơi.", "Đủ ly rồi, anh chạy đây!"],
    reviewer: ["Ly thứ hai tới trễ, mình phải quay lại cảnh đá tan.", "Cuối cùng đủ ly, mình cắt đoạn chờ đi nha."],
    vip: ["Đối tác uống xong rồi ly chị mới tới đó em.", "Vị ổn, nhịp chưa ổn."],
  },
  sync: {
    default: [
      "{N} ly ra cùng lúc luôn! {Call} có bao nhiêu cái tay vậy?",
      "Pha đồng loạt mà đúng hết, {self} xem như xem biểu diễn.",
      "Không ai phải chờ ai, {self} thích kiểu này.",
      "Cạch cạch cùng lúc, nghe như nhạc nền phim hành động.",
    ],
    "hoc-sinh": ["Ra cùng lúc luôn chị, tụi em chạm ly cái một!", "Chị pha như chơi game hai tay vậy đó."],
    "van-phong": ["Đủ ly cùng lúc, anh về họp kịp giờ.", "Quy trình song song, anh muốn phòng anh học theo."],
    "khach-quen": ["Con pha lẹ ghê, cô chưa kịp kể chuyện.", "Mấy ly xong cùng lúc, mấy đứa nhỏ khỏi giành."],
    "di-ngang": ["Xong cùng lúc, anh treo xe chạy liền.", "Lẹ như anh luồn hẻm, em giỏi."],
    reviewer: ["Cảnh pha song song này mình lấy làm mở đầu clip!", "Hai chỗ pha một nhịp, đẹp ghê chị."],
    vip: ["Nhanh và đều. Chị thích.", "Đúng giờ, đúng ly. Tốt lắm em."],
  },
};

/** Bàn pha đôi / ba chỗ: câu nhân viên khi rót đồng loạt (thông báo nhỏ). */
export const BARISTA_PARALLEL = [
  "Pha đồng loạt {n} ly. Tay trái tay phải hôm nay hiểu ý nhau ghê.",
  "Hai ly cùng bước, một cú rót. Nhân viên tự thưởng một tràng pháo tay tưởng tượng.",
  "Rót song song {n} ly. Cảm giác như đánh đàn piano bằng ấm trà.",
  "Đồng loạt {n} ly! Bàn pha mới đáng từng đồng.",
  "Hai ly cùng lúc, nhân viên tự nhắc: đọc lại hai phiếu trước khi đóng nắp.",
  "Rót {n} ly một nhịp, nhanh như tin đồn trong nhóm chat.",
];

/** Nhiệm vụ ngày: câu khi xong (theo kind) — gộp default + kind. */
export const MISSION_DONE = {
  default: [
    "Sổ nhiệm vụ gạch thêm một dòng. Tiếng gạch nghe đã tai như tiếng nắp cạch.",
    "Chủ tiệm tự thưởng một cái gật đầu với chính mình trong gương.",
    "Một nhiệm vụ xong. Mẹ mà biết chắc khoe nhóm bạn của mẹ.",
    "Xong! Tiệm nhỏ nhưng kỷ luật như đội tuyển.",
    "Nhiệm vụ hoàn thành, nhân viên xin phép đứng nghiêm ba giây.",
    "Gạch xong một mục, cảm giác như vừa dọn sạch hộp thư.",
  ],
  sugarExact: ["Đường đo chuẩn tới mức con kiến cũng phải xin công thức.", "Muỗng đường hôm nay nghe lời như học trò ngoan."],
  iceExact: ["Đá đúng từng viên. Đá cũng biết xếp hàng.", "Ít đá là ít đá, nhiều đá là nhiều đá. Tiệm sống thật với đá."],
  lowWaste: ["Hao hụt gần bằng không, thùng rác tiệm hôm nay thất nghiệp.", "Không phí một giọt trà. Dì Ba mà biết chắc khen nức nở."],
  regular4: ["Khách quen gật đầu, câu \"như mọi khi\" đã được giữ đúng.", "Khách quen vui là cả hẻm biết."],
  fiveStars: ["Năm sao rơi xuống như mưa đầu mùa.", "Năm sao gom đủ, tiệm xin phép tự hào nhẹ nhàng."],
  noLost: ["Không ai bỏ về. Cửa tiệm hôm nay chỉ mở chiều vào.", "Không một khách nào phải ra về tay không. Kỷ lục đáng in áo."],
  fast: ["Nhanh tới mức khách chưa kịp lấy điện thoại ra lướt.", "Tốc độ ra ly hôm nay ngang tin nhắn được trả lời liền."],
  pearls: ["Trân châu bán đắt như tôm tươi, à không, như trân châu tươi.", "Nồi trân châu hôm nay làm việc chăm chỉ hơn ai hết."],
  cups: ["Ly bán đủ chỉ tiêu, chồng ly nhựa thấp đi trông thấy.", "Bán đủ số ly, cánh tay rót trà xin nghỉ phép nửa ngày."],
  multi: ["Đơn nhiều ly qua trót lọt, nhóm chat bên kia đang gửi sticker cảm ơn.", "Ghép ly gọn như xếp hình. Đơn nhóm không làm khó được tiệm."],
  revenue: ["Doanh thu đạt mốc, két tiền kêu leng keng như nhạc tết.", "Két đầy hơn hôm qua. Chủ tiệm đếm lại hai lần cho chắc."],
  drama: ["Xử lý tình huống xong, chủ tiệm đủ kinh nghiệm viết sách nhỏ.", "Drama đến rồi đi, tiệm vẫn đứng vững và vẫn có nắp."],
};
/** Nhiệm vụ chưa xong lúc chốt ca. */
export const MISSION_MISS = {
  default: [
    "Nhiệm vụ này hẹn gặp lại ngày mai, như bộ phim chưa xem hết.",
    "Chưa xong, nhưng tiệm đã cố. Nỗ lực cũng là một loại doanh thu.",
    "Mục này còn trống. Sổ nhiệm vụ không giận, chỉ chờ.",
    "Hụt một chút. Chủ tiệm ghi chú: mai làm lại, lần này đọc phiếu hai lần.",
    "Chưa đạt, nhưng có bài học. Bài học thì không bán được, mà vẫn quý.",
    "Mục này trượt. Tiệm tự an ủi bằng một ly trà đào miễn phí cho chính mình.",
  ],
  sugarExact: ["Muỗng đường hôm nay hơi tự do. Mai cho nó học lại bảng đo."],
  iceExact: ["Đá hôm nay có ý kiến riêng. Mai nói chuyện lại với đá."],
  lowWaste: ["Hao hụt hơi nhiều, thùng rác tiệm làm việc tăng ca."],
  regular4: ["Khách quen chưa được bốn sao. Mai nhớ \"như mọi khi\" kỹ hơn."],
  fiveStars: ["Năm sao còn ngại ngùng chưa tới. Mai rủ nó ghé."],
  noLost: ["Có người ra về khi chưa có ly. Mai mở cửa bằng cả tốc độ."],
  fast: ["Tốc độ hôm nay giống mạng yếu. Mai khởi động lại tay."],
  pearls: ["Trân châu bán chưa đủ, nồi trân châu hơi buồn."],
  cups: ["Ly bán chưa đủ chỉ tiêu, chồng ly nhựa vẫn cao ngất."],
  multi: ["Đơn nhiều ly chưa trọn vẹn. Mai ghép ly như ghép đôi, cẩn thận từng cặp."],
  revenue: ["Doanh thu chưa chạm mốc. Két tiền im lặng suy tư."],
  drama: ["Hôm nay không có drama để xử lý. Hiếm thấy, hơi tiếc, mà cũng mừng."],
};
/** Xong cả ba nhiệm vụ trong ca. */
export const MISSION_ALL = [
  "Ba nhiệm vụ, ba lần gạch. Chủ tiệm chính thức được phép tự gọi mình là \"sếp\" trong năm phút.",
  "Xong trọn ba mục. Sổ nhiệm vụ sạch như quầy lúc mới lau.",
  "Hat-trick nhiệm vụ! Nhân viên xin một tràng pháo tay, quầy vỗ bằng tiếng nắp cạch.",
  "Cả ba nhiệm vụ hoàn thành. Hôm nay tiệm chạy như phim quảng cáo, chỉ thiếu nhạc nền.",
  "Ba trên ba. Mẹ hỏi con có mệt không, con nói con đang hạnh phúc.",
];

/** Gói ký gửi (Dì Ba): câu khi nhận gói lúc hụt vốn. */
export const CONSIGN_LINES = [
  "Dì Ba ký gửi một gói hàng: \"Bán tới đâu trả tới đó. Hồi xưa dì cũng từng hết tiền mua đường.\"",
  "Dì Ba để lại gói hàng với một câu: \"Ví mỏng không sao, miễn lòng dày.\"",
  "Gói ký gửi tới. Dì Ba dặn: \"Đừng ngại, tiệm nào cũng có mùa ví ngủ đông.\"",
  "Dì Ba khiêng gói hàng vô: \"Dì tin con. Dì chỉ không tin cái máy đóng nắp thôi.\"",
  "Dì Ba ký gửi hàng, ghi sổ bằng bút chì: \"Bút chì để con khỏi áp lực.\"",
  "Gói ký gửi đã vào kho. Dì Ba nói: \"Hết tiền là chuyện tạm, hết tâm mới đáng lo.\"",
  "Dì Ba để gói hàng: \"Bán được ly nào trả ly đó, khỏi cảm ơn, cảm ơn bằng ly ngon là được.\"",
  "Ví tiệm đang tập nhịn ăn. Dì Ba ký gửi một gói, kèm lời khuyên: \"Ăn cơm đủ bữa nghe con.\"",
];
/** Trả xong gói ký gửi (khoảnh khắc Nhật Ký). */
export const CONSIGN_DONE = [
  "Trả xong gói ký gửi cho Dì Ba. Sổ nợ gạch một đường, nghe nhẹ cả vai.",
  "Hết nợ ký gửi! Chủ tiệm đi đứng thẳng lưng hơn hai phân.",
  "Gói ký gửi đã trả đủ. Dì Ba nhắn: \"Giỏi. Mai ghé dì lấy hàng, dì để phần đá ngon.\"",
  "Trả hết ký gửi bằng từng ly bán được. Đây là loại thành tựu không in lên bảng hiệu nhưng đáng tự hào.",
  "Món nợ cuối cùng vừa tan như đá trong ly trà. Ví tiệm thở phào.",
  "Ký gửi trả đủ. Chủ tiệm tự hứa: lần sau hụt vốn thì hụt ít thôi.",
];

/** Review nhắc tới đồ trang trí tiệm đang có. good: 4–5 sao; slow: chờ lâu nhưng có ghế chờ. */
export const REVIEW_DECOR = {
  "waiting-bench": {
    good: [
      "Ghế chờ gỗ êm tới mức {self} muốn chờ thêm một ly nữa. #ghecho",
      "Có ghế ngồi chờ, ly ngon, {self} cho năm sao, sao thứ sáu dành cho cái ghế.",
      "Ngồi ghế chờ nhìn {call} pha, thư giãn như xem kênh nấu ăn. #chilltaitiem",
      "Tiệm có ghế chờ, đứng chờ không còn là môn thể thao sức bền nữa.",
      "Cái ghế gỗ ở góc là nhân viên chăm sóc khách hàng giỏi nhất tiệm. #ghecho",
      "Ngồi ghế chờ, gió quạt, ly tới đúng lúc. Đời đơn giản vậy thôi.",
    ],
    slow: [
      "Chờ hơi lâu, nhưng ghế chờ êm nên {self} tha thứ một nửa. #ghecho",
      "Ly tới trễ, may mà có ghế. {Self} ngồi chờ kịp mơ một giấc ngắn.",
      "Chờ lâu thiệt, nhưng cái ghế gỗ ôm {self} như bà ngoại ôm cháu.",
      "Không có ghế chắc {self} về rồi. Cảm ơn cái ghế đã giữ chân {self}.",
      "Chờ đủ lâu để {self} thuộc vân gỗ của ghế chờ. #chotly",
      "Ghế chờ cứu cả trải nghiệm. Ly thì xin nhanh hơn chút nha {call}.",
    ],
  },
  "room-screen": {
    good: [
      "Góc bình phong mây là góc check-in chính thức của {self} từ hôm nay. #gocsongao",
      "Đứng trước bình phong chụp một tấm, nhìn như đi du lịch mà không tốn vé xe. #checkin",
      "Ly ngon, góc bình phong đẹp, {self} chụp hai mươi tấm chọn được một.",
      "Bình phong mây làm nền ảnh, ly trà làm nhân vật chính. Bộ ảnh hoàn hảo. #gocsongao",
      "Tiệm nhỏ mà có góc sống ảo xịn, ai đi ngang cũng muốn đứng chụp.",
      "Góc bình phong chụp lên da đẹp hơn app chỉnh ảnh. #checkin",
    ],
  },
  "flowering-pot": {
    good: [
      "Chậu hoa tím trước cửa xinh xỉu, {self} chụp hoa trước rồi mới chụp ly. #hoatim",
      "Tiệm có cây có hoa, uống trà mà thấy mình sống xanh. #songxanh",
      "Chậu hoa tím nở đúng lúc ly trà tới. Bố cục ảnh tự sắp xếp.",
      "Ly ngon, hoa xinh, tiệm thơm mùi trà với mùi đất ẩm. Dễ chịu.",
      "Ai tưới chậu hoa trước cửa vậy, cho {self} gửi lời khen. #hoatim",
      "Một chậu hoa nhỏ mà làm tiệm có hồn ghê. Năm sao cho cả hoa lẫn ly.",
    ],
  },
  "premium-lantern": {
    good: [
      "Đèn mây vàng chiếu xuống ly, ly lên hình như ảnh tạp chí. #anhdenvang",
      "Ánh đèn mây làm tiệm ấm như nhà, {self} ngồi lâu hơn dự định.",
      "Chụp ly dưới đèn mây, không cần chỉnh màu. #khongfilter",
      "Đèn mây lớn treo giữa tiệm đẹp tới mức {self} hỏi mua ở đâu.",
      "Đèn vàng, ly lạnh, nhạc nhỏ. Tiệm này biết cách làm người ta ở lại. #chilltaitiem",
      "Đèn mây chiếu bóng lên tường như tranh. {Self} cho năm sao cho bức tranh đó.",
    ],
  },
  "tea-table-set": {
    good: [
      "Bàn ghế tre mát, ngồi uống trà mà tưởng đang ở nhà ông bà. #bantre",
      "Tiệm có bộ bàn tre, nhóm {self} ngồi lại tám chuyện tới chiều.",
      "Ngồi bàn tre nhâm nhi, nghe tiếng nắp cạch, chữa lành tuần mệt mỏi. #chualanh",
      "Bàn ghế tre xinh, ly trà đặt lên là thành bố cục. #gocsongao",
      "Có chỗ ngồi đàng hoàng nên {self} mua thêm ly nữa. Tiệm biết cách bán hàng.",
      "Bộ bàn tre làm tiệm thành chỗ hẹn quen của nhóm {self}.",
    ],
  },
  "lit-signboard": {
    good: [
      "Biển hiệu đèn sáng từ đầu hẻm, {self} đi theo ánh đèn như đi theo tiếng gọi. #biendien",
      "Tối đi ngang thấy biển đèn sáng, ghé liền. Quyết định đúng đắn nhất tuần.",
      "Chụp ly trước biển hiệu đèn, ảnh lung linh như phim. #gocsongao",
      "Biển hiệu đèn nhìn sang ghê, ly trà bên trong cũng xứng tầm.",
      "Nhờ biển đèn mà {self} tìm được tiệm trong mưa. Năm sao cho ánh sáng.",
      "Biển hiệu sáng, tiệm sáng, ly trà làm tâm trạng {self} sáng luôn. #biendien",
    ],
  },
};

/** Review của khách đến nhờ quảng bá (ngày có quảng bá). */
export const PROMO_REVIEW = {
  "to-roi": [
    "Thấy tờ rơi chữ to nên ghé. Chữ to, ly cũng ngon, không lừa. #toroi",
    "Tờ rơi bay vô giỏ xe {self}, {self} coi đó là định mệnh. #dinhmenh",
    "Cầm tờ rơi tới hỏi \"còn mở không\", tiệm nói còn, còn ngon nữa.",
    "Tờ rơi in tay hơi lệch, mà ly trà thì không lệch chút nào.",
    "Nhờ tờ rơi mà {self} biết hẻm mình có tiệm trà xinh. #hemnhaminh",
    "Tờ rơi giữ lại làm đánh dấu sách, tiệm thì giữ lại làm quán ruột. #quanruot",
  ],
  "check-in": [
    "Check-in nhận tiếng nắp cạch, nghe xong thấy vui vô lý. #nghetiengcach",
    "Tới check-in vì tò mò, ở lại vì ly ngon. #checkin",
    "Mini game check-in vui, {self} được tặng tiếng cạch kêu to nhất từng nghe.",
    "Chụp check-in xong mới gọi món, ly lên ảnh đẹp như mẫu. #gocsongao",
    "Tiệm làm mini game dễ thương, không ép mua, chỉ ép cười. #checkin",
    "Check-in một tấm, nghiện một quán. #quanruot",
  ],
  livestream: [
    "Xem livestream thấy chị chủ pha run run, tới uống thì tay chị vững lắm. #livestream",
    "Coi live xong tới liền, ly ngoài đời ngon hơn trên màn hình. #xemlive",
    "Từ khán giả số 12 của buổi live thành khách ruột. #fanchuquan",
    "Live tiệm không có kịch bản mà vui, ly cũng không có kịch bản mà ngon.",
    "Tới tiệm hỏi \"chị có phải người hay live không\", chị đỏ mặt, ly thì đỏ đào. #livestream",
    "Xem live nghe tiếng cạch qua loa điện thoại, giờ nghe tận tai mới đã. #nghetiengcach",
  ],
};

/** Câu chốt ca (Nhật Ký) thêm cho M3. Biến như CAPTIONS. */
export const CAPTIONS_M3 = {
  missions: [
    "Bán {cups} ly, xong trọn ba nhiệm vụ. Hôm nay chủ tiệm là học sinh giỏi của chính mình.",
    "Ba nhiệm vụ, ba dấu gạch, {cups} ly. Sổ tay chưa bao giờ đẹp như vậy.",
    "{cups} ly và một sổ nhiệm vụ sạch bóng. Lời {profit}k, tự hào vô giá.",
  ],
  multi: [
    "{multi} đơn nhóm giao trọn, không ai phải đứng đổi ly giữa vỉa hè.",
    "Hôm nay tiệm làm {multi} đơn nhiều ly. Nhóm chat các nơi đồng loạt thả tim.",
  ],
};
