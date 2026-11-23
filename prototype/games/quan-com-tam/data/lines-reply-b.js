// Câu trả lời review của chủ quán, phần hai: tính cách Lầy lội (lay) và Sale-man (sale). Gộp với data/lines-reply.js trong core/reviews.js.
// Biến: {name} người viết review, {dish} tên món (chữ thường), {mistake} lỗi (đọc trơn sau "vụ" / "lỗi"), {shop} tên quán, {stars} số sao.
// Khoá: up = khen dĩa ăn tại chỗ · takeaway = khen hộp mang về · mistake = review về một trong 13 kiểu lỗi · down = review ≤ 3 sao bất kỳ
// · biAnyway / hardEgg / burnt / noMoHanh / sauceMixed / noTea = meme riêng theo lỗi · serious = sườn chưa chín hoặc dĩa chay dính mặn:
// xin lỗi nghiêm túc, không đùa, không khuyến mãi. Giọng hài tử tế, không emoji, không thương hiệu thật, không chê người.

export const REPLY_LINES_B = {
  // ===== Lầy lội =====
  "lay-thanks": {
    up: [
      "Kính gửi {name}, quán xin cảm ơn từ miếng sườn đầu tiên trên vỉ tới hạt cơm cuối cùng trong nồi, kèm lời chào của cái quạt mo. #cảmơndàinhưsớ",
      "Cảm ơn {name}. Bài cảm ơn này dài ba trang, nhưng quán rút gọn còn một câu để {name} kịp ăn dĩa {dish} tiếp theo. #rútgọn",
      "Quán đọc review của {name} to lên cho cả vỉ sườn nghe. Sườn xèo xèo vỗ tay, than đỏ thêm một nấc. #sườncócảmxúc",
      "Thay mặt nồi cơm, hũ mỡ hành, chén nước mắm và mấy cái ghế nhựa, quán cảm ơn {name} vì {stars} sao lấp lánh. #cảdànđồnghềcảmơn",
      "Cảm ơn {name}. Quán đã in review này dán lên nồi cơm để nồi có động lực nấu chín đều mỗi tối. #nồicơmđượckhen",
      "Phần một: cảm ơn {name}. Phần hai: cảm ơn {name} lần nữa. Phần ba: hẹn {name} ghé ăn dĩa {dish} để có phần bốn. #phimdàitập",
      "Miếng sườn đọc review của {name} xong cháy cạnh thêm hai mươi phần trăm vì ngại. Cảm ơn nha. #sườnngại",
      "Cảm ơn {name}. Đây là bài phát biểu nhận giải 'Dĩa cơm của năm', quán xin cảm ơn ba mẹ, Cô Ba sạp thịt và than. #nhậngiải",
    ],
    takeaway: [
      "Hộp {dish} của {name} đã về nhà an toàn, nước mắm không đổ, quán xin cảm ơn anh shipper và luật vật lý. #hộpvềbờ",
      "Cảm ơn {name}. Hộp cơm đi xa mà vẫn ấm, quán cho hộp lên bảng vàng 'nhân viên vận chuyển của tháng'. #hộpchămchỉ",
      "Quán đọc review mà tưởng tượng cảnh {name} mở hộp ra, khói bay lên như phim. Cảm ơn đã đóng vai chính. #mởhộp",
      "Bịch nước mắm nhờ quán gửi lời: cảm ơn {name} đã không để nó lẻ loi trong túi. #bịchnướcmắmcảmơn",
      "Cảm ơn {name}. Hộp mang về mà được khen, quán mừng như hộp vừa thi đậu đại học. #hộpđậu",
      "Hộp {dish} đi một vòng thành phố rồi tới tay {name} vẫn thơm mùi than. Quán cảm ơn, hộp cũng cảm ơn. #hộpdulịch",
    ],
  },
  "lay-sorry": {
    mistake: [
      "Quán xin lỗi {name} vụ {mistake}. Lục bát tạ lỗi: 'Hôm qua quán vội quán sai, mai {name} ghé quán làm hai lần đúng.' #thơxinlỗi",
      "Lỗi {mistake} là lỗi của quán, không phải của vỉ, cũng không phải của than. Quán xin lỗi {name}, mai làm lại chuẩn. #nhậnlỗi",
      "Xin lỗi {name} nha. Vụ {mistake} đã được quán ghi lên bảng đen cạnh bếp, chữ to cỡ tên quán. #bảngđenghinhớ",
      "Thơ tạ lỗi gửi {name}: 'Dĩa cơm lỡ một chút thôi, quán xin sửa lại cho người vui lên.' Vụ {mistake} sẽ không có tập hai. #lụcbát",
      "Quán đọc review, ngồi im ba giây, rồi họp khẩn với cái quạt mo. Kết luận: xin lỗi {name} vụ {mistake}, mai đúng phiếu. #họpkhẩn",
      "Vụ {mistake} làm quán buồn hơn {name} luôn. Xin lỗi thật lòng, lần sau dĩa {dish} sẽ ngoan như học sinh đầu năm. #xinlỗithật",
      "Quán xin lỗi {name}. Phiếu order từ nay được phóng to gấp đôi, để vụ {mistake} không còn chỗ trốn. #phiếutođùng",
      "Quán quỳ gối trước nồi cơm xin lỗi {name} vụ {mistake}. Nồi cơm tha rồi, giờ chờ {name} tha nữa thôi. #mongđượctha",
    ],
    down: [
      "Quán xin lỗi {name}. Thơ ngắn: 'Hôm nay quán chưa tròn vai, hẹn {name} bữa khác dĩa ngon hơn nhiều.' #lụcbátxinlỗi",
      "Xin lỗi {name} vụ {mistake}. Quán đã kể chuyện này cho cả vỉ sườn nghe, cả vỉ đều hứa cố gắng. #vỉsườnhứa",
      "Quán nhận {stars} sao với tinh thần cầu tiến, xin lỗi {name}, mai than đỏ hơn, tay nhanh hơn. #cầutiến",
      "Xin lỗi {name} nha. Quán đã treo review này cạnh bếp làm động lực, kế bên tấm lịch và cây quạt mo. #độnglực",
      "Quán xin lỗi vì {mistake}. Tập này kết thúc buồn, nhưng tập sau quán hứa cái kết có hậu cho {name}. #tậpsau",
      "Quán đọc xong review, gật đầu, rót ly trà đá, rồi xin lỗi {name}. Mai quán làm tốt hơn, nói thật đó. #xinlỗinghiêmtúcmộtnửa",
    ],
  },
  "lay-meme": {
    up: [
      "Ảnh minh hoạ: cô chủ đọc review của {name}, tay cầm kẹp gắp sườn, cười như trúng vé số cô Út bán. #vuinhưtrúngsố",
      "Tình trạng quán sau review này: than đỏ, sườn thơm, chủ quán bay lên trời một chút rồi đáp xuống lật sườn tiếp. #bayxíuthôi",
      "Cập nhật: dĩa {dish} của {name} được đề cử 'Dĩa ăn sạch nhất tối nay'. Hạt cơm cuối cùng xin không bình luận. #sạchdĩa",
      "Mấy cái ghế nhựa nghe {name} khen xong tự xếp hàng thẳng tắp. Quán chưa từng thấy chúng ngoan vậy. #ghếngoan",
      "POV: {name} chấm {stars} sao, cô chủ lén quạt than mạnh thêm cho sườn nghe được tin vui. #POVquáncơm",
      "Miếng sườn cháy cạnh đã đọc review này và xin được đóng khung treo tường. Quán đang cân nhắc. #sườnmuốnnổi",
      "Quán xin trân trọng thông báo: chén nước mắm hôm nay có fan, tên là {name}. #nướcmắmcófan",
      "Bảng xếp hạng tối nay: một, {name}; hai, mỡ hành; ba, cái quạt mo đã làm việc hết sức. #bảngxếphạng",
    ],
    down: [
      "Ảnh: cô chủ ôm hũ đồ chua ngồi suy nghĩ về cuộc đời và vụ {mistake}. Xin lỗi {name}, mai quán tỉnh lại liền. #suytư",
      "Dĩa {dish} hôm đó đã bị mời lên văn phòng nói chuyện riêng. Nó hứa không tái phạm vụ {mistake}. #dĩabịnhắc",
      "Cập nhật: vụ {mistake} đã được đưa vào sách giáo khoa nội bộ của quán, chương 'Điều không nên làm'. Xin lỗi {name}. #sáchgiáokhoa",
      "Cái vỉ nướng đang đứng góc tường suy ngẫm vì {stars} sao của {name}. Mai vỉ sẽ làm lại cuộc đời. #vỉbịphạt",
      "Quán vừa thành lập 'Ban chống {mistake}' gồm cô chủ, quạt mo và nồi cơm. Xin lỗi {name} nha. #banchuyêntrách",
      "Biểu cảm của quán khi đọc review: mắt rưng rưng, tay vẫn lật sườn đều. Xin lỗi {name}, ca sau quán ổn hơn. #vừabuồnvừalật",
      "Thông báo khẩn: quán đã tịch thu điện thoại của chính mình trong giờ bán để không còn vụ {mistake}. #tịchthu",
      "Ngày đen tối của quán đã được ghi lại trong review của {name}. Ngày mai quán đổi bóng đèn sáng hơn, làm cũng sáng hơn. #đổibóngđèn",
    ],
    biAnyway: [
      "Bì tự leo lên dĩa của {name} lúc quán không để ý. Quán đã khiển trách bì, mai bì bị cấm cửa phiếu 'không bì'. #khôngbì",
      "Bì nhờ quán nhắn {name}: nó chỉ muốn làm quen thôi, không có ý gì. Quán vẫn xin lỗi và dán phiếu đỏ. #bìmuốnlàmquen",
      "Từ nay phiếu 'không bì' có vệ sĩ riêng đứng canh. Xin lỗi {name} vì trận bão tuyết bì hôm đó. #bãotuyếtbì",
    ],
    hardEgg: [
      "Trứng lòng đào của {name} đã nhận lỗi và đang tự kiểm điểm trong chảo. Lần sau trứng hứa chảy đúng giờ. #trứnghốilỗi",
      "Quả trứng hôm đó sống một cuộc đời quá đầy đủ trên chảo. Quán xin lỗi {name}, mai bấm giờ từng giây. #trứngchínquá",
      "Chảo đã được giao nhiệm vụ mới: canh lòng đào như canh nồi cơm. Xin lỗi {name} vì quả trứng 'đào xong lấp lại'. #chảođổinghề",
    ],
    burnt: [
      "Miếng sườn hôm đó lỡ đi tắm nắng quá lâu trên than. Quán xin lỗi {name}, vỉ đã bị nhắc nhở. #sườnrámnắng",
      "Sườn nướng than chứ không phải sườn thành than, quán ghi nhớ rồi. Xin lỗi {name} nha. #khôngphảithan",
      "Quán xin lỗi {name}. Miếng sườn đó muốn thử phong cách cà phê đen, nhưng quán đã cấm nó tự ý đổi phong cách. #sườnđổistyle",
    ],
    noMoHanh: [
      "Mỡ hành hôm đó xin nghỉ phép không báo trước. Quán đã gọi nó về, mai rưới bù cho {name} gấp đôi. #mỡhànhnghỉphép",
      "Cơm tấm không mỡ hành là cơm tấm đang buồn, quán biết. Xin lỗi {name}, hũ mỡ hành giờ đặt ngay trước mặt cô chủ. #cơmbuồn",
      "Quán xin lỗi {name}. Hũ mỡ hành đã được gắn chuông, quên rưới là chuông kêu. #mỡhànhgắnchuông",
    ],
    sauceMixed: [
      "Dặn để riêng mà cơm của {name} lại đi bơi. Quán xin lỗi, từ nay chén nước mắm có ghế riêng. #cơmđibơi",
      "Nước mắm hôm đó quá nhiệt tình, nhảy thẳng vào dĩa. Quán đã dặn nó đứng chờ trong chén. Xin lỗi {name}. #nướcmắmnhiệttình",
      "Quán xin lỗi {name} vì hồ bơi nước mắm ngoài ý muốn. Mai chén riêng, bịch riêng, lòng quán cũng riêng một góc ăn năn. #hồbơinướcmắm",
    ],
    noTea: [
      "Ly trà của {name} cạn lâu tới mức đá cũng đi về. Quán xin lỗi, bình trà giờ đi tuần mỗi phút. #tràđáđituần",
      "Quán xin lỗi {name}. Trà đá là quyền con người, quán đã in câu này dán lên bình trà. #quyềntràđá",
      "Bình trà đá hôm đó bị lạc giữa quán đông. Đã tìm thấy, đã nhắc nhở, xin lỗi {name} nha. #bìnhtràlạc",
    ],
  },
  "lay-trend": {
    up: [
      "Quán mở thử thách #DĩaSạchNhưReviewCủa{name}: ăn sạch dĩa {dish}, chụp hình, được cô chủ khen một câu thật to. #thửtháchdĩasạch",
      "Trend mới: chấm {stars} sao bằng cách xếp hạt cơm thành ngôi sao. Người mở màn là {name}, quán chỉ là người chứng kiến. #trendhạtcơm",
      "Quán phát động phong trào 'Ngửi mùi than đoán món', lấy cảm hứng từ review của {name}. Ai đoán đúng, cô chủ cười thêm. #ngửithan",
      "Từ review của {name}, quán ra mắt điệu nhảy 'Lật sườn đúng lúc'. Động tác chính: xoay cổ tay, hô xèo. #điệunhảylậtsườn",
      "Thử thách tối nay: ăn {dish} mà không chấm thêm nước mắm. {name} đã làm được, quán chưa ai làm được. #thửtháchkhóthật",
      "Quán đề nghị biến câu khen của {name} thành nhạc chuông quán. Bông đang tập hát, chưa đúng tông lắm. #nhạcchuôngquán",
    ],
    down: [
      "Quán biến review của {name} thành thử thách nội bộ: một tuần không có vụ {mistake}. Ngày thứ nhất, đang cố. #thửthách7ngày",
      "Trend tuần này của quán: #ĐọcPhiếuHaiLần, lấy cảm hứng từ góp ý của {name}. Ai thấy cô chủ đọc một lần thì nhắc giùm. #đọcphiếu",
      "Quán mở bộ đếm 'số ngày không {mistake}' treo cạnh bếp. Hiện tại: một ngày. Cảm ơn {name} đã cho quán động lực. #bộđếmngày",
      "Thử thách cho chính quán: lấy {stars} sao của {name} làm điểm xuất phát, mỗi tối cố thêm nửa sao. #leosao",
      "Quán đề xuất trend #QuánSửaSai: ai từng góp ý như {name}, lần sau ghé kể quán nghe quán đã sửa tới đâu. #quánsửasai",
      "Từ review của {name}, quán quay clip 'Một ngày học làm cho đúng'. Clip chưa hay, nhưng quán đang học thật. #họclàmđúng",
    ],
  },
  "lay-serious": {
    serious: [
      "Chuyện này quán không đùa. Quán thành thật xin lỗi {name} vì {mistake}. Đây là lỗi nghiêm trọng, quán đã đổi cách làm ngay trong tối đó.",
      "Hôm nay quán cất hết meme. Xin lỗi {name} vì {mistake}, quán hiểu điều này ảnh hưởng tới bữa ăn và sự tin tưởng của {name}.",
      "Quán xin lỗi {name} một cách nghiêm túc vì {mistake}. Từ nay quán kiểm từng dĩa trước khi bưng ra, không vội nữa.",
      "Không có hashtag nào cho chuyện này. Quán sai vì {mistake}, quán xin lỗi {name} và đã nhắc cả quán rút kinh nghiệm.",
      "Quán xin lỗi {name}. Vụ {mistake} là điều không được phép xảy ra ở quán, quán đã sắp xếp lại bếp để không lặp lại.",
      "Lần này quán nói thẳng, không đùa: xin lỗi {name} vì {mistake}. Cảm ơn {name} đã nói ra để quán sửa kịp.",
      "Quán thật lòng xin lỗi {name}. Với {mistake}, quán không tìm lý do, chỉ nhận lỗi và thay đổi cách làm từ hôm nay.",
      "Quán đã đọc kỹ review của {name}. Xin lỗi vì {mistake}. Quán tách riêng dụng cụ và nướng kỹ lại từng miếng, kiểm hai lần.",
    ],
  },
  "lay-refund": {
    serious: [
      "Quán xin lỗi {name} vì {mistake} và xin hoàn lại tiền dĩa hôm đó. Chuyện này quán không đùa, quán sẽ cẩn thận hơn.",
      "Quán hoàn tiền dĩa {dish} cho {name} và xin lỗi nghiêm túc vì {mistake}. Lần sau quán xin được làm lại thật chu đáo.",
      "Xin lỗi {name}. Vì {mistake}, quán xin trả lại tiền và mời {name} một bữa khác, quán sẽ tự tay kiểm từng thứ.",
      "Quán không đùa trong chuyện này. Quán hoàn tiền cho {name} vì {mistake} và đã đổi cách làm ở bếp ngay tối đó.",
      "Quán xin lỗi và hoàn tiền dĩa cho {name}. {Mistake} là lỗi của quán, quán xin nhận trọn và sửa đến nơi đến chốn.",
      "Quán thành thật xin lỗi {name} vì {mistake}. Tiền dĩa quán gửi lại, lần sau {name} ghé, quán làm riêng và kiểm kỹ.",
    ],
  },

  // ===== Sale-man =====
  "sale-thanks": {
    up: [
      "Cảm ơn {name} nhiều nha! Lần sau dẫn thêm ba người bạn, quán tặng nguyên bình trà tắc cho cả bàn.",
      "Quán cảm ơn {name}! Văn phòng của {name} có đặt mâm cơm trưa thì quán giảm 5%, rủ cả phòng luôn nha.",
      "Cảm ơn {name} đã khen dĩa {dish}! Tuần này gọi dĩa đặc biệt, quán tặng thêm trứng ốp la, nhớ ghé nha.",
      "Cảm ơn {name}! {Stars} sao này quán xin đổi thành lời mời: tối thứ Sáu ghé cùng nhóm, quán giữ sẵn bàn bốn.",
      "Quán cảm ơn {name} rất nhiều! Ai đọc review này rồi ghé, nói tên {name} là quán tặng chén canh nóng.",
      "Cảm ơn {name}! Ăn đủ năm dĩa có dấu mộc của quán là dĩa thứ sáu quán mời, sổ tích điểm đang chờ {name}.",
      "Cảm ơn {name} đã ủng hộ! Sinh nhật bạn bè cứ đặt ở quán, quán bày bàn dài trên vỉa hè, giá mềm như cơm.",
      "Quán cảm ơn {name}! Khuya đói cứ ghé, quán mở tới khuya, có combo sườn cháy cạnh với trà đá cho người thức đêm.",
    ],
    takeaway: [
      "Cảm ơn {name} đã đặt hộp mang về! Đặt từ ba hộp trở lên, quán tặng thêm bịch nước mắm và đồ chua.",
      "Quán cảm ơn {name}! Hộp {dish} được khen thì lần sau đặt cho cả phòng nha, mười hộp quán giảm 5%.",
      "Cảm ơn {name}! Nhắn trước giờ ghé, quán gói sẵn hộp nóng, tới lấy là đi liền không cần chờ.",
      "Cảm ơn {name} nha! Hộp cơm trưa văn phòng của quán có giá riêng cho đơn định kỳ, hỏi cô chủ là có.",
      "Quán cảm ơn {name}! Lần sau đặt hộp, ghi chú 'khen quán' là được tặng thêm ly trà tắc mang về.",
      "Cảm ơn {name}! Hộp mang về của quán đi được xa lắm, rủ hàng xóm cùng đặt cho đỡ phí giao nha.",
    ],
  },
  "sale-sorry": {
    mistake: [
      "Xin lỗi {name} vì {mistake}! Lần sau ghé đọc mã 'COMNONG' giảm 5k dĩa bất kỳ, quán làm lại chuẩn trăm phần trăm.",
      "Quán xin lỗi {name} vụ {mistake}! Tặng {name} một chén canh và trứng ốp la lần sau, nhớ ghé nha.",
      "Xin lỗi {name} vì {mistake}. Quán gửi mã 'SUADAI' giảm 10%, lần này quán đọc phiếu hai lần rồi mới làm.",
      "Quán xin lỗi {name}! Vụ {mistake} quán đã sửa, mời {name} ghé thử lại dĩa {dish}, ly trà tắc quán mời.",
      "Xin lỗi {name} nha. Vì {mistake}, lần sau {name} ghé quán tặng phần chả trứng, coi như quán chuộc lỗi.",
      "Quán xin lỗi {name} vụ {mistake}! Mã 'XINLOI5K' dùng được cả tuần, quán hứa dĩa sau đúng phiếu từng dòng.",
      "Xin lỗi {name} vì {mistake}. Quán ghi tên {name} vào sổ khách ưu tiên, lần tới bưng ra trước, có quà nhỏ kèm.",
      "Quán xin lỗi {name}! {Mistake} là lỗi của quán, lần sau ghé báo tên, quán giảm nửa giá dĩa {dish}.",
    ],
    down: [
      "Xin lỗi {name} vì trải nghiệm chưa vui! Ghé lại đọc mã 'COMNONG' giảm 5k, quán muốn được gỡ điểm.",
      "Quán xin lỗi {name}! {Stars} sao là lời nhắc cho quán. Lần sau ghé, quán tặng ly trà tắc và một nụ cười thật to.",
      "Xin lỗi {name} vì {mistake}. Quán mời {name} ghé ca sau, chén canh nóng quán mời, khỏi trả tiền.",
      "Quán xin lỗi {name} nha! Tuần này có khuyến mãi dĩa sườn trứng, ghé thử lại để quán làm {name} đổi ý.",
      "Xin lỗi {name}! Quán gửi mã giảm 10% cho lần sau, quán đang sắp lại bếp để phục vụ nhanh và đúng hơn.",
      "Quán xin lỗi {name}. Lần sau ghé, nói 'cho cơ hội' là quán tặng phần đồ chua thêm và châm trà liên tục.",
    ],
  },
  "sale-voucher": {
    up: [
      "Cảm ơn {name}! Quán tặng mã 'KHACQUEN' giảm 5k cho lần sau, dùng được cho cả dĩa {dish} yêu thích.",
      "Quán gửi {name} phiếu mời một ly trà tắc, lần sau ghé đưa cô chủ coi là có liền nha.",
      "Cảm ơn {name}! Khách khen được quà: mã giảm 10% dĩa đặc biệt, hạn một tuần, ghé sớm kẻo quên.",
      "Quán tặng {name} mã 'SAONAM' giảm 5k mỗi dĩa cho cả bàn, rủ bạn bè ghé cho vui.",
      "Cảm ơn {name}! Lần sau ghé, đọc tên {name} là quán tặng trứng ốp la, mã không hết hạn đâu.",
      "Quán gửi {name} một voucher chén canh miễn phí, kèm lời mời ghé lại thử món sườn non mới.",
    ],
    down: [
      "Quán xin lỗi {name} và gửi mã 'GOLAI' giảm 10%, mời {name} ghé lại cho quán làm lại một dĩa thật ngon.",
      "Xin lỗi {name} vì {mistake}. Tặng {name} phiếu dĩa {dish} giảm nửa giá, quán hứa lần này khác hẳn.",
      "Quán gửi {name} mã giảm 5k kèm ly trà tắc, mong {name} cho quán thêm một cơ hội.",
      "Xin lỗi {name}! Mã 'CHUOCLOI' giảm 10k cho lần ghé tới, quán sẽ đích thân bưng ra.",
      "Quán tặng {name} voucher chén canh và trứng ốp la, xin lỗi vì {mistake}, ghé lại nha.",
      "Xin lỗi {name}. Quán gửi phiếu mời một dĩa bì chả, ghé thử để thấy quán đã sửa tới đâu.",
    ],
  },
  "sale-combo": {
    up: [
      "Cảm ơn {name}! Nhân tiện, combo cơm sườn cộng trà tắc chỉ thêm 3k, ăn xong mát cả người, thử liền nha.",
      "Quán cảm ơn {name}! Đã thích dĩa {dish} thì thử combo đặc biệt sườn bì chả trứng, đáng đồng tiền lắm.",
      "Cảm ơn {name}! Văn phòng nào cần mâm cơm trưa, quán có combo mười phần kèm canh, giao tận nơi.",
      "Cảm ơn {name}! Khuya ghé có combo 'cú đêm': cơm sườn cháy cạnh, chén canh, trà đá đầy, giá mềm.",
      "Quán cảm ơn {name}! Tuần này có combo hai dĩa sườn trứng tặng một dĩa bì chả, rủ người thương ghé.",
      "Cảm ơn {name}! Thêm 5k là có combo sườn kèm lạp xưởng, thợ ăn khen no tới sáng.",
    ],
    down: [
      "Xin lỗi {name} vì {mistake}. Lần sau thử combo cơm sườn trà tắc, quán làm kỹ hơn và châm trà liên tục.",
      "Quán xin lỗi {name}! Để bù, quán giới thiệu combo đặc biệt giá ưu đãi, ăn một lần là quên chuyện cũ.",
      "Xin lỗi {name} nha. Quán vừa ra combo 'gỡ điểm': dĩa {dish} kèm canh và trà tắc, giá như dĩa thường.",
      "Quán xin lỗi {name}. Ghé lại thử combo mâm cơm hai người, quán tự tay bày, không để sót lớp nào.",
      "Xin lỗi {name} vì {stars} sao chưa tròn. Combo sườn trứng tuần này giảm 5k, quán mong được làm lại.",
      "Quán xin lỗi {name}! Tối thứ Bảy có combo bàn bốn kèm bình trà tắc, ghé để quán chứng minh đã sửa.",
    ],
  },
  "sale-serious": {
    serious: [
      "Quán thành thật xin lỗi {name} vì {mistake}. Đây là lỗi nghiêm trọng, quán đã đổi cách làm ở bếp ngay lập tức.",
      "Quán xin lỗi {name}. Với {mistake}, quán không nói gì thêm ngoài nhận lỗi và kiểm từng dĩa trước khi bưng ra.",
      "Xin lỗi {name} một cách nghiêm túc vì {mistake}. Quán hiểu điều này quan trọng với {name} thế nào.",
      "Quán xin lỗi {name}. Vụ {mistake} không được phép xảy ra, quán đã tách riêng dụng cụ và nướng kỹ lại từng miếng.",
      "Quán nhận lỗi về {mistake} và xin lỗi {name}. Cảm ơn {name} đã nói ra để quán sửa cho đến nơi.",
      "Quán thật lòng xin lỗi {name}. Quán đã nhắc cả quán rút kinh nghiệm về {mistake}, kiểm hai lần mọi dĩa.",
      "Xin lỗi {name}. Quán không tìm lý do cho {mistake}, chỉ xin nhận lỗi và thay đổi từ tối nay.",
      "Quán xin lỗi {name} vì {mistake}. Từ hôm nay dĩa chay làm riêng khu riêng, thịt nướng kiểm chín kỹ trước khi gắp.",
    ],
  },
  "sale-refund": {
    serious: [
      "Quán xin lỗi {name} vì {mistake} và xin hoàn lại toàn bộ tiền dĩa hôm đó. Quán sẽ cẩn thận hơn.",
      "Quán hoàn tiền dĩa {dish} cho {name} và thành thật xin lỗi vì {mistake}. Lần sau quán xin làm lại thật chu đáo.",
      "Xin lỗi {name}. Vì {mistake}, quán gửi lại tiền và xin mời {name} một bữa khác, quán tự tay kiểm.",
      "Quán xin lỗi và hoàn tiền cho {name}. {Mistake} là lỗi của quán, quán đã sửa cách làm ngay tối đó.",
      "Quán thành thật xin lỗi {name} vì {mistake}. Tiền dĩa quán xin trả lại, quán không để chuyện này lặp lại.",
      "Quán xin lỗi {name}. Quán hoàn tiền dĩa hôm đó và đã sắp xếp lại bếp để tránh {mistake}.",
    ],
  },
};
