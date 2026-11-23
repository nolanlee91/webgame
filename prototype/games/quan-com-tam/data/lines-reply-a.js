// Câu trả lời review của cô chủ quán — phần A: tính cách Hiền lành (hien-*) và Cục súc (cuc-*). Gộp vào REPLY_LINES ở data/lines-reply.js.
// Chủ đề: up = khen dĩa ăn tại quán · takeaway = khen hộp mang về · mistake = một trong 13 kiểu lỗi · slow = chờ lâu / bỏ về
// · down = review ≤ 3 sao chung (đọc trơn với mọi {mistake}) · serious = sườn chưa chín / dĩa chay dính mặn: xin lỗi nghiêm túc, không đùa, không khuyến mãi.
// Biến: {name} người viết review, {dish} tên món (chữ thường), {mistake} lỗi (đọc trơn sau "vụ" / "lỗi"), {shop} tên quán, {stars} số sao.
// Cục súc thẳng và cộc nhưng KHÔNG chê người: chỉ nói về tình huống và về chính quán. Không emoji, không thương hiệu thật, không người thật.

export const REPLY_LINES_A = {
  // ===== Hiền lành =====
  "hien-thanks": {
    up: [
      "Dạ quán cảm ơn {name} nhiều lắm. Lần sau {name} ghé, quán để dành miếng sườn cháy cạnh đẹp nhất ạ.",
      "Dạ được {name} khen là cả quán vui cả tối. Mong {name} ghé hoài nha.",
      "Quán cảm ơn {name} đã thương dĩa {dish} của quán. Than còn đỏ là quán còn nướng cho {name} ăn ạ.",
      "Dạ quán đọc review mà cười tới lúc dọn hàng. Cảm ơn {name} đã ngồi ghế nhựa vỉa hè với quán ạ.",
      "Cảm ơn {name} ạ. Quán sẽ giữ nước mắm đúng vị, mỡ hành đúng béo như hôm {name} ghé.",
      "Dạ {stars} sao này quán xin cất kỹ, mỗi tối nhóm bếp nhìn một lần cho có sức quạt than ạ.",
      "Quán cảm ơn {name} nha. Chúc {name} đêm nào cũng có một dĩa cơm nóng và ly trà đá đầy.",
      "Dạ, quán nhỏ vỉa hè mà được {name} viết dài vậy, cô chủ cảm động muốn nướng thêm một vỉ ạ.",
    ],
    takeaway: [
      "Dạ cảm ơn {name} đã đặt hộp mang về. Quán mừng là hộp {dish} tới nơi vẫn còn nóng ạ.",
      "Quán cảm ơn {name} ạ. Bịch nước mắm quán buộc hai lần, mừng là không bịch nào đi lạc.",
      "Dạ cảm ơn {name} và anh chị giao hàng đã chạy nhanh giùm quán. Lần sau quán vẫn gói kỹ vậy ạ.",
      "Quán cảm ơn {name}. Hộp cơm đi xa mà vẫn đủ đồ chua, dưa leo, quán thấy yên tâm lắm ạ.",
      "Dạ, quán xếp sườn nằm trên cơm cho khỏi ướt, được {name} khen là quán vui cả ca ạ.",
      "Cảm ơn {name} nha. Ăn ở nhà mà vẫn thấy mùi than vỉa hè là quán mãn nguyện rồi ạ.",
    ],
  },
  "hien-sorry": {
    mistake: [
      "Dạ quán xin lỗi vì {mistake}. Lần sau {name} ghé, quán làm lại dĩa khác và dán phiếu đỏ để không quên nữa ạ.",
      "Dạ lỗi của quán, quán đã nhắc cả nhà rút kinh nghiệm vụ {mistake}. Mong {name} cho quán cơ hội sửa sai ạ.",
      "Quán xin lỗi {name} nhiều ạ. Vụ {mistake} là do quán vội, từ ca sau quán đọc phiếu hai lần rồi mới bưng.",
      "Dạ quán biết lỗi rồi ạ. Dĩa {dish} hôm đó dính vụ {mistake}, quán đã ghi vào sổ treo cạnh bếp.",
      "Dạ cảm ơn {name} đã nói thẳng. Quán xin lỗi vì {mistake} và sẽ sửa bằng việc làm chứ không chỉ bằng lời ạ.",
      "Quán xin lỗi {name} ạ. Một bữa tối đáng lẽ vui mà gặp vụ {mistake}, cô chủ thấy áy náy lắm.",
      "Dạ, vụ {mistake} quán đã họp với chính mình và cái quạt mo, kết luận: ca sau phải đúng ạ.",
      "Quán thành thật xin lỗi {name}. Quán sẽ sắp lại quầy cho gọn để không còn vụ {mistake} nữa ạ.",
    ],
    slow: [
      "Dạ quán xin lỗi đã để {name} chờ lâu. Quán đang tập nướng sẵn đúng lúc để khách khỏi đợi ạ.",
      "Quán xin lỗi {name} vì phải chờ. Tối hôm đó đông, nhưng đó không phải lý do để {name} đói bụng ạ.",
      "Dạ quán xin lỗi ạ. Từ ca sau quán nấu nồi cơm sớm hơn và nhóm than trước giờ mở quán.",
      "Quán xin lỗi vì cái sự chậm ạ. Quán đã dời chồng dĩa sạch sát bếp để bày nhanh hơn.",
      "Dạ, để {name} ngồi nhìn vỉ sườn mà chưa được ăn, quán thấy có lỗi lắm ạ.",
      "Quán xin lỗi {name}. Quán đang sắp xếp lại bàn ghế để khách tới là có chỗ ngồi liền ạ.",
    ],
    down: [
      "Dạ quán cảm ơn {name} đã góp ý. Quán xin lỗi vì {mistake}, quán sẽ làm tốt hơn ạ.",
      "Quán xin lỗi vì bữa ăn chưa trọn vẹn ạ. Mong {name} cho quán thêm một lần để sửa.",
      "Dạ, {stars} sao là lời nhắc quý của {name}. Quán xin nhận và sẽ cố gắng hơn ạ.",
      "Quán xin lỗi {name} ạ. Quán ghi góp ý này vào sổ, tối nào cũng đọc trước khi mở hàng.",
      "Dạ quán xin lỗi vì {mistake}. Cô chủ hứa ca sau chăm từng dĩa hơn nữa ạ.",
      "Quán cảm ơn {name} đã viết thật lòng. Quán xin lỗi và mong được gặp lại {name} ạ.",
    ],
  },
  "hien-explain": {
    down: [
      "Dạ cảm ơn {name} đã góp ý. Nước mắm của quán pha hơi ngọt kiểu Sài Gòn, {name} thích mặn hơn cứ dặn quán nha.",
      "Dạ, quán xin giải thích nhẹ: tối hôm đó than ướt nên lửa yếu, quán đã đổi bao than mới rồi ạ.",
      "Quán hiểu cảm giác của {name} ạ. Lần sau {name} cứ nói nhỏ muốn cháy cạnh hay mềm, quán chỉnh liền.",
      "Dạ quán cảm ơn {name}. {stars} sao cũng là {stars} ngôi sao, quán sẽ cố để lần sau có thêm sao ạ.",
      "Dạ, sườn quán ướp từ chiều, ghé sớm thì thấm và mềm nhất. Quán sẽ cố giữ ngon tới khuya cho {name}.",
      "Quán cảm ơn góp ý của {name}. Chuyện kể trên mạng có khi chưa đủ, mời {name} ghé quán nghe cô chủ kể đầu đuôi ạ.",
      "Dạ, quán vỉa hè ít bàn nên giờ cao điểm hơi chật. Quán đang tính thêm ghế cho {name} ngồi thoải mái ạ.",
      "Dạ quán xin nghe hết ạ. Mỗi góp ý là một bài học, sổ của quán dày dần như sách giáo khoa.",
    ],
  },
  "hien-invite": {
    up: [
      "Cảm ơn {name} nha. Lần sau ghé, dĩa {dish} đầu tiên quán mời, coi như quà cảm ơn review dễ thương ạ.",
      "Dạ quán muốn mời {name} một dĩa lần tới, để được nghe {name} khen trực tiếp thêm lần nữa.",
      "Quán cảm ơn {name}. Hẹn {name} ghé lại, quán mời dĩa đầu, ly trà đá thì châm tới khi no ạ.",
      "Dạ, quán để sẵn một dĩa mời ghi tên {name}. Ghé lúc nào cũng được, dĩa mời không hết hạn ạ.",
      "Quán cảm ơn {name} nhiều. Ca sau {name} ghé, quán mời một dĩa nóng và xin một lời góp ý thật lòng.",
      "Review dễ thương quá, quán xin mời {name} dĩa kế tiếp. Không cần review lại đâu, ghé chơi là vui rồi ạ.",
    ],
    down: [
      "Dạ quán xin lỗi {name}. Ca sau {name} ghé, quán xin mời lại một dĩa {dish} làm thật đúng ạ.",
      "Quán biết dĩa hôm đó chưa tròn vị. {name} ghé lại cho quán mời một dĩa bù nha, quán muốn sửa sai tận tay.",
      "Dạ, quán xin {name} một cơ hội: ghé lại, quán mời dĩa {dish}, đúng phiếu từng lớp ạ.",
      "Quán xin lỗi và xin mời {name} quay lại. Miếng sườn bù cô chủ đứng canh vỉ từ đầu tới cuối ạ.",
      "Dạ {name} ơi, quán giữ một dĩa mời cho {name}. Lần này quán hứa không để vụ {mistake} nữa.",
      "Quán thấy có lỗi lắm. Mời {name} ghé ca sau, dĩa đó quán mời, chén canh với trà đá quán cũng mời luôn ạ.",
    ],
  },
  "hien-meme": {
    up: [
      "Cô chủ đọc review xong ôm cây quạt mo xoay ba vòng. Cảm ơn {name} nha.",
      "Tình trạng của quán sau review này: vui, hơi ngại, và muốn nướng thêm một vỉ ăn mừng ạ.",
      "Miếng sườn trên vỉ nghe {name} khen nên tự cháy cạnh thêm chút vì ngại. Cảm ơn {name} ạ.",
      "Quán đã đọc review này cho cả nồi cơm nghe. Nồi cơm cũng nói cảm ơn {name}.",
      "Ảnh minh hoạ: hũ mỡ hành bóng loáng vì được {name} khen. Quán cảm ơn ạ. #mỡhànhđượckhen",
      "Cái bếp than nhờ quán nhắn: cảm ơn {name}, tối nay nó sẽ đỏ hết công suất ạ.",
    ],
    down: [
      "Dĩa {dish} hôm đó đã được quán mời lên nói chuyện riêng. Nó hứa không tái phạm vụ {mistake}. Quán xin lỗi {name} ạ.",
      "Cô chủ đọc review xong ngồi ôm hũ đồ chua suy nghĩ về cuộc đời và về vụ {mistake}. Quán xin lỗi ạ.",
      "Cập nhật: cây kẹp gắp sườn đang bị phạt đứng góc vì vụ {mistake}. Quán sửa liền ạ.",
      "Quán đã dán phiếu to gấp đôi lên tường để không còn vụ {mistake}. Xin lỗi {name} nha.",
      "Quán vừa dặn cái vỉ: lần sau gặp {name} phải ngoan, nướng đều, không làm quán buồn ạ.",
      "Ảnh cô chủ lúc đọc review: mắt rưng rưng, tay vẫn quạt than. Quán hứa ca sau tốt hơn ạ.",
    ],
  },
  "hien-serious": {
    serious: [
      "Dạ quán thành thật xin lỗi {name} vì {mistake}. Đây là lỗi nghiêm trọng, quán nhận hoàn toàn trách nhiệm ạ.",
      "Quán xin lỗi {name} ạ. Vụ {mistake} không được phép xảy ra, quán đã thay cách làm ngay từ tối nay.",
      "Dạ quán rất xin lỗi. Quán hiểu {name} đã tin quán, và quán đã để {name} thất vọng vì {mistake}.",
      "Quán xin lỗi {name} một cách nghiêm túc ạ. Từ nay mỗi miếng sườn quán kiểm chín kỹ, mỗi dĩa chay làm riêng khay riêng.",
      "Dạ, quán không có lời biện hộ nào cho {mistake}. Quán xin lỗi và đã sắp lại quầy để tách hẳn đồ chay ạ.",
      "Quán xin lỗi {name}. Cô chủ đã tự kiểm lại từng bước để chuyện {mistake} không lặp lại với bất kỳ ai ạ.",
      "Dạ quán cảm ơn {name} đã báo cho quán biết. Quán xin lỗi vì {mistake} và sẽ cẩn thận hơn rất nhiều ạ.",
      "Quán thành thật xin lỗi ạ. Sức khoẻ và sự tin tưởng của {name} quan trọng hơn mọi thứ ở quán.",
    ],
  },
  "hien-refund": {
    serious: [
      "Dạ quán xin lỗi {name} vì {mistake}. Quán xin hoàn lại tiền dĩa đó, và mong {name} cho quán sửa sai ạ.",
      "Quán thành thật xin lỗi ạ. Quán gửi lại tiền dĩa {dish} cho {name} và đã đổi cách làm từ tối nay.",
      "Dạ, quán xin hoàn tiền và xin lỗi {name}. Nếu {name} còn tin quán, bữa sau quán xin được mời ạ.",
      "Quán xin lỗi {name} vì {mistake}. Tiền dĩa quán hoàn lại đủ, lời hứa cẩn thận quán giữ lâu dài ạ.",
      "Dạ quán xin nhận lỗi và hoàn tiền cho {name}. Bữa sau, nếu {name} ghé, quán xin được mời và tự tay làm ạ.",
      "Quán xin lỗi {name}. Quán hoàn tiền dĩa đó và mời {name} một bữa khác, làm đúng và an toàn ạ.",
    ],
  },

  // ===== Cục súc =====
  "cuc-thanks": {
    up: [
      "Sườn ngon là chuyện bình thường. Mai tới sớm, còn chỗ ngồi.",
      "Cảm ơn. Than đỏ, sườn thơm, vậy thôi.",
      "{stars} sao là đúng bài. Cảm ơn {name}. Đừng khen nữa, quán ngại.",
      "Cảm ơn {name}. Quán không giỏi nói, quán giỏi quạt than.",
      "Ừ, cảm ơn. Khuya tới thì nhớ gọi trước, hết sườn là hết.",
      "Khen vậy là quán nhận. Cảm ơn {name}, nói ít hiểu nhiều.",
      "Đọc rồi, cười rồi, đi lật sườn tiếp. Cảm ơn {name}.",
      "Dĩa {dish} ngon là nhờ than với tay. Cảm ơn đã ăn sạch dĩa.",
    ],
    takeaway: [
      "Hộp tới nóng là đúng. Quán gói chặt tay. Cảm ơn {name}.",
      "Bịch nước mắm không xì. Quán buộc hai vòng. Cảm ơn.",
      "Cảm ơn {name}. Anh giao hàng chạy nhanh, quán nướng nhanh, vậy là xong.",
      "Hộp đủ đồ chua, đủ dưa leo. Bình thường. Cảm ơn.",
      "Mang về mà vẫn thơm khói là phải. Cảm ơn {name}.",
      "Đặt hộp nữa thì đặt sớm. Cảm ơn.",
    ],
  },
  "cuc-brag": {
    up: [
      "Biết mà. Quán quạt vỉ này mỗi tối, sườn không ngon mới lạ.",
      "{stars} sao hả? Quán tưởng sáu. Thôi, nhận {stars} cũng được.",
      "Không bất ngờ. Quán canh than nhiều tới mức nằm mơ cũng nghe tiếng xèo.",
      "Khen chuẩn. Nhưng {name} thử dĩa có trứng lòng đào đi, còn ngon nữa.",
      "Đọc review mà gật gù: người này biết ăn cơm tấm.",
      "Ừ. Ngon. Quán biết. Cảm ơn đã xác nhận giùm.",
      "Miếng cháy cạnh đó canh từng giây. Ngon là xứng đáng, không phải hên.",
      "Biết mà. Hẻm này mùi than quán bay xa nhất, {name} theo mùi tới là đúng.",
    ],
  },
  "cuc-sorry": {
    mistake: [
      "Vụ {mistake}. Lỗi quán. Mai tới, quán làm lại. Hết.",
      "Quán sai. Quán sửa. Không hứa hươu hứa vượn.",
      "Ừ, dĩa {dish} hôm đó dính vụ {mistake}. Quán nhận. Ca sau đúng.",
      "Xin lỗi {name}. Một câu thôi, còn lại để dĩa sau nói thay.",
      "Sai thì nhận. Vụ {mistake} là lỗi tay quán, không phải lỗi của {name}.",
      "Không vòng vo: quán làm sai vụ {mistake}. Mai dán phiếu ngay trước vỉ mà làm.",
      "Nhận lỗi vụ {mistake}. Không đổ cho than, không đổ cho đông. Sửa.",
      "Xin lỗi. Vụ {mistake} quán ghi lên bảng cạnh bếp, tối nào cũng đọc trước khi nhóm lửa.",
    ],
    slow: [
      "Chậm. Lỗi quán. Mai nhóm than sớm hơn.",
      "Để {name} chờ là không được. Quán xin lỗi, ca sau gọn tay hơn.",
      "Đông không phải lý do. Quán chậm, quán nhận.",
      "Xin lỗi vụ {mistake}. Nồi cơm sẽ nấu sớm, vỉ sẽ nướng sẵn.",
      "Quán sai vì để khách đói. Sửa liền.",
      "Một câu: xin lỗi {name}. Lần sau ngồi xuống là có dĩa.",
    ],
  },
  "cuc-truth": {
    down: [
      "Nói thẳng: tối đó than ướt, quán xoay hết sức rồi. Nhưng {name} nói đúng, chưa ngon thì chưa ngon.",
      "{stars} sao thì quán nhận. Còn sườn quán ướp từ chiều, không phải đồ nướng sẵn đâu nha.",
      "Quán vỉa hè, bốn cái bàn, một cô chủ. Chậm là có thật, lười thì không.",
      "Góp ý quán đọc hết. Có chỗ đúng, có chỗ quán thấy khác. Mời ghé lại coi tận mắt.",
      "Nói thật: nước mắm quán vị vậy từ hồi mở quán. Thích mặn hơn thì dặn, quán chỉnh.",
      "Quán không cãi chuyện ngon dở, khẩu vị mỗi người mỗi khác. Còn chuyện {mistake} thì quán nhận phần mình.",
      "Thẳng thắn: tối đó đông gấp đôi. Quán chạy không kịp. Lần sau quán chạy nhanh hơn.",
      "Cảm ơn đã viết. Quán không giận, quán chỉ hơi buồn, rồi đi quạt than tiếp.",
    ],
  },
  "cuc-dare": {
    down: [
      "Vậy mai ghé lại. Quán nướng trước mặt, ăn xong rồi chấm lại.",
      "{name} tới lần nữa đi. Không ngon thì quán không lấy tiền dĩa đó.",
      "Thách {name} quay lại ăn thử dĩa {dish}. Quán đứng canh vỉ từ đầu tới cuối.",
      "Ghé lại đi {name}. Lần này quán làm, {name} chấm, công bằng.",
      "Mai khuya ghé. Quán để sẵn một ghế cạnh bếp cho {name} coi nướng.",
      "Một lần nữa thôi {name}. Nếu vẫn {stars} sao, quán nhận luôn.",
    ],
  },
  "cuc-meme": {
    up: [
      "Đã in review này dán lên nồi cơm cho nồi có động lực. #nồicơmđượckhen",
      "Sườn nghe khen xong đòi tăng lương. Quán từ chối.",
      "Cái quạt mo đọc review xong quạt mạnh gấp đôi. Cảm ơn {name}.",
      "Quán ít nói. Quán đăng tấm ảnh vỉ sườn thay lời cảm ơn.",
      "Review này quán giữ lại, buồn thì đọc. Hết buồn thì nướng.",
      "Hũ mỡ hành nói cảm ơn. Quán thì gật đầu.",
    ],
    down: [
      "Vụ {mistake}: quán đã khiển trách cái vỉ. Vỉ im lặng. Quán sửa.",
      "Dĩa {dish} hôm đó đang bị phạt đứng góc. Lần sau nó ngoan.",
      "Cây kẹp gắp nhận lỗi vụ {mistake}. Quán cũng nhận. Hết chuyện.",
      "Quán đã dán chữ ĐỌC KỸ PHIẾU lên tường, to bằng cái bàn.",
      "Quán đã họp khẩn với cái vỉ và nồi cơm. Kết luận: lỗi quán, mai sửa.",
      "Cập nhật: trà đá được giao thêm nhiệm vụ canh chừng cô chủ. #quánsửa",
    ],
  },
  "cuc-serious": {
    serious: [
      "Quán xin lỗi {name}. Vụ {mistake} là lỗi nghiêm trọng, quán nhận hết trách nhiệm.",
      "Không có lý do nào cho {mistake}. Quán sai. Quán đã đổi cách làm từ tối nay.",
      "Xin lỗi {name}. Từ nay mỗi miếng sườn quán cắt thử kiểm chín rồi mới bưng.",
      "Quán nhận lỗi {mistake}. Đồ chay giờ có khay riêng, kẹp riêng, chén riêng.",
      "Xin lỗi thật lòng. Quán làm vậy là không được, và quán sẽ không để lặp lại.",
      "{name} tin quán mà quán để xảy ra {mistake}. Quán xin lỗi, không vòng vo.",
      "Lỗi của quán, không của ai khác. Quán xin lỗi {name} và đã sửa quy trình.",
      "Quán xin lỗi. Chuyện an toàn không được ẩu, quán nhớ bài học này.",
    ],
  },
  "cuc-refund": {
    serious: [
      "Quán xin lỗi {name} vì {mistake}. Hoàn tiền dĩa đó. Đã sửa cách làm.",
      "Lỗi quán. Quán trả lại tiền dĩa {dish}, và xin lỗi {name}.",
      "Xin lỗi {name}. Tiền dĩa hoàn đủ. Bữa sau nếu ghé, quán mời, làm đúng.",
      "Quán sai vụ {mistake}. Hoàn tiền, xin lỗi, và không để lặp lại.",
      "Không biện hộ. Quán hoàn tiền cho {name} và mời một bữa khác, an toàn.",
      "Xin lỗi {name}. Quán trả tiền dĩa đó và tự tay làm lại bữa sau.",
    ],
  },
};
