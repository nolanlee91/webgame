// Milestone 5: câu cho Hội chợ (cấp 18), ca thử thách + huy hiệu (cấp 20), máy rót hai vòi, hạng tiệm.
// Mọi bảng chọn bằng freshLine (core/shift.js). Biến: {name} {self} {call} {Call} {drink} {shop} {n} {badge}.
// Giọng mạng xã hội có hashtag cho review, không emoji, không thương hiệu hay người thật.

// ---------- Hội chợ ----------
/** Câu gọi món ở gian hàng hội chợ (đơn nhóm kết hợp: mỗi người một món). */
export const FAIR_ORDER = [
  "Cho {self} {n} ly, mỗi đứa một món khác nhau nha {call}, hội chợ mà!",
  "Gian hàng {shop} đây rồi! {N} ly, đứa {drink}, đứa món khác, {call} ghi giùm.",
  "{Self} xếp hàng nãy giờ, cho {n} ly luôn kẻo lát hết.",
  "Hội chợ đông quá, {call} làm {n} ly mang đi nha, {self} cầm cho cả nhóm.",
  "{N} ly nha {call}: {drink} trước, mấy ly kia tuỳ {call} chọn mức đá.",
  "Nghe đồn gian hàng {shop} pha ngon nhất hội chợ, {self} lấy {n} ly kiểm chứng.",
  "{Call} ơi {n} ly, nhóm {self} đứng ở sân khấu, mang ra được không?",
  "Hội chợ mà không có trà sữa là không trọn vẹn. {N} ly nha {call}.",
];
/** Review của khách hội chợ theo kết quả ly / đơn: great (4–5 sao), ok (3 sao), bad (1–2 sao). */
export const FAIR_REVIEW = {
  great: [
    "Đi hội chợ khu phố, ghé gian {shop}: đông mà ra ly nhanh, đúng ý từng người. #hoichokhupho",
    "Gian trà sữa ngon nhất hội chợ, không cần bàn cãi. #hoicho #tiemnho",
    "Nhóm mình gọi bốn món khác nhau, gian hàng nhớ đúng hết. Phục. #donnhom",
    "Hội chợ nóng như lò, ly {drink} cứu cả buổi chiều. #giaixiet",
    "Xếp hàng mười phút mà đáng. Lần sau ra tiệm uống tiếp. #reviewthat",
    "Gian {shop} có không khí như tiệm thật, chủ tiệm vừa pha vừa nói chuyện duyên. #hoicho",
    "Mua ly ở hội chợ xong phải xin địa chỉ tiệm. #timduocchanai",
    "Ly đầy, đá đúng mức, topping không keo kiệt. Hội chợ hiếm có. #hoichomacduoc",
    "Đứng gần sân khấu mà nghe tiếng nắp kêu cạch cạch từ gian {shop}. Vui tai. #hoicho",
    "Gian hàng nhỏ mà chạy như máy, mình đếm được 3 ly trong một phút. #nangsuat",
  ],
  ok: [
    "Gian {shop} ở hội chợ ổn, hơi đông nên chờ lâu. #hoicho",
    "Trà được, nhưng hội chợ ồn quá nên gọi lộn mức đường. Lỗi một nửa của mình. #hoicho",
    "Uống tạm ổn, không bằng lúc ra tiệm. #binhthuong",
    "Ly {drink} ở hội chợ ngọt hơn mình nhớ, chắc do nắng. #reviewthat",
    "Gian hàng dễ thương, mỗi tội hết món mình thích. #henlansau",
    "Hội chợ đông, ly ra từ từ. Bù lại chủ tiệm cười suốt. #okela",
    "Được, không có gì để chê nhiều, không có gì để khen nhiều. #hoicho",
    "Trà ngon, đá hơi ít, mà trời hội chợ thì đá nào cũng ít. #nangnong",
    "Gọi bốn ly, ba ly đúng ý. Tỷ lệ hội chợ chấp nhận được. #donnhom",
  ],
  bad: [
    "Gian {shop} ở hội chợ đông quá nên pha vội, ly mình sai bét. #hoicho",
    "Chờ mãi ở hội chợ, nhận ly thì nhầm món. Hội chợ cũng là thử thách. #trasuaao",
    "Hội chợ không cứu được ly {drink} này. #thatvong",
    "Gian hàng xinh mà ly chưa xinh. Mong lần sau ra tiệm uống được ngon hơn. #gopy",
    "Mình đứng chờ hết một bài hát trên sân khấu, ly vẫn chưa ra. #lau",
    "Hội chợ làm tiệm rối, mình hiểu, nhưng ly sai thì vẫn sai. #thatlong",
    "Nhóm mình gọi đơn kết hợp, nhận về một đơn kết hợp lỗi. #donnhom",
    "Gian trà sữa ồn ào hơn sân khấu, ly thì yên lặng không ngon. #reviewthat",
  ],
};
/** Câu chốt ca Nhật Ký cho ngày hội chợ. */
export const CAPTIONS_FAIR = [
  "Hội chợ khu phố: bán {cups} ly, mất giọng vì hét \"ly của ai đây\".",
  "Ngày hội chợ: {cups} ly, {multi} đơn nhóm, một chủ tiệm cần ngồi xuống.",
  "Gian hàng {shop} ở hội chợ: không đẹp nhất nhưng ồn nhất.",
  "Bài học hội chợ: mang dư ly, mang dư đá, mang dư kiên nhẫn.",
  "Hội chợ xong, {cups} ly đã ra đi, tiền về {profit}k, chân về gần hết.",
];

// ---------- Ca thử thách (cấp 20) ----------
/** Câu kết quả ca thử thách (toast + Nhật Ký). */
export const CHALLENGE_WIN = [
  "Xong thử thách! Tiệm làm được chuyện mà sáng nay còn nghĩ là không thể.",
  "Thử thách hôm nay: đạt. Nhân viên đề nghị in ra dán tường.",
  "Đạt mục tiêu ca thử thách. Dì Ba gật gù, mẹ nhắn \"giỏi\".",
  "Thử thách hoàn thành, chủ tiệm tự thưởng một ly không đường… à không, 50%.",
  "Ca thử thách xong xuôi. Tiệm nhỏ mà có võ.",
  "Đạt rồi! Cư dân mạng chưa biết, nhưng cái sổ biết.",
  "Thử thách? Tiệm này ăn thử thách thay cơm.",
  "Mục tiêu đạt. Hôm nay tiệm chạy như phim tua nhanh.",
];
export const CHALLENGE_FAIL = [
  "Hụt thử thách một chút. Ngày mai lịch có thử thách khác, tiệm có tinh thần khác.",
  "Chưa đạt. Nhưng ít ra tiệm biết giới hạn hôm nay nằm ở đâu.",
  "Thử thách thắng tiệm một ván. Ván sau tính tiếp.",
  "Không đạt, nhưng khách vẫn có trà. Vậy là chưa thua hẳn.",
  "Hụt mục tiêu. Nhân viên an ủi: \"Ít ra mình không đóng cửa sớm.\"",
  "Thử thách khó thật. Tiệm ghi vào sổ: lần sau khởi động kỹ hơn.",
  "Chưa đạt. Mẹ nhắn: \"Không sao, nghỉ sớm đi con.\"",
  "Hụt thử thách. Cái lịch treo tường nhìn tiệm như muốn nói \"tuần sau nha\".",
];
/** Review khách trong ca thử thách: win (khách thấy tiệm đang \"gồng\" tốt), lose. */
export const CHALLENGE_REVIEW = {
  win: [
    "Hôm nay tiệm có vẻ đang thi gì đó, ly ra nhanh và chuẩn lạ thường. #thuthach",
    "Chủ tiệm tập trung như thi đại học, ly ngon xứng đáng. #reviewthat",
    "Vô tiệm đúng ngày tiệm \"gồng\", được phục vụ như VIP. #may",
    "Bảng ghi \"Ca thử thách\" ngay quầy, mình ủng hộ bằng một review năm sao. #ungho",
    "Tiệm đang tự thách mình, còn mình thì được uống ngon. Đôi bên cùng có lợi. #winwin",
    "Không biết thử thách gì, chỉ biết ly {drink} hôm nay hoàn hảo. #hoanhao",
    "Ca hôm nay tiệm chạy như đội đua, ly vẫn đẹp như tranh. #nangsuat",
    "Lần đầu thấy chủ tiệm đếm giờ bằng đồng hồ bấm giây. Kết quả ngon. #thuthach",
  ],
  lose: [
    "Tiệm hôm nay có vẻ đang thử thách gì đó, và thử thách đang thắng. #thuthach",
    "Ly ổn, nhưng thấy chủ tiệm căng như dây đàn. Thư giãn đi chủ tiệm. #gopy",
    "Ghé đúng ca thử thách, ly hơi vội. Lần sau mình ghé ngày thường. #henlansau",
    "Tiệm tự đặt mục tiêu cao quá, khách thấy được độ gồng. #reviewthat",
    "Bảng \"Ca thử thách\" ở quầy, mình thấy tiệm cố lắm. Cố thêm chút nữa nha. #covu",
    "Ly {drink} hôm nay chưa tới, chắc tại thử thách. #thatlong",
    "Chủ tiệm chạy qua chạy lại như thi chạy tiếp sức, ly thì chưa về đích. #lau",
    "Mình không hiểu luật thử thách, nhưng mình hiểu ly này hơi lệch. #reviewthat",
  ],
};
/** Câu nhân viên khi có huy hiệu mới. */
export const BADGE_LINES = [
  "Tiệm vừa có huy hiệu “{badge}”! Em đề nghị treo ngay quầy.",
  "Huy hiệu mới: “{badge}”. Mẹ chắc chắn sẽ khoe với cả xóm.",
  "Chúc mừng chủ tiệm: “{badge}”. Em in ra giấy A4 dán tường nha.",
  "“{badge}” đã về tay. Dì Ba nói hồi xưa dì cũng có… nhưng không ai tin.",
  "Huy hiệu “{badge}” mở khoá. Tiệm Hẻm Bên chắc đang nhìn sang.",
  "Tiệm thêm một huy hiệu: “{badge}”. Bức tường danh dự bắt đầu chật.",
  "“{badge}”! Em đề nghị tối nay ăn mừng bằng một mẻ trân châu.",
  "Huy hiệu mới “{badge}”. Cư dân mạng chưa biết, nhưng sắp biết.",
];
export const CAPTIONS_CHALLENGE = {
  win: [
    "Ca thử thách “{challenge}”: đạt. Tiệm nhỏ, tham vọng không nhỏ.",
    "Hôm nay tiệm chọn khó, và khó thua.",
    "Thử thách “{challenge}” xong. Huy hiệu về, chân rã.",
  ],
  lose: [
    "Ca thử thách “{challenge}”: hụt. Mai tính lại.",
    "Thử thách hôm nay thắng tiệm. Ván sau mới là ván chính.",
    "Hụt “{challenge}”, nhưng {cups} ly vẫn ra đi trong vinh quang.",
  ],
};

// ---------- Máy rót hai vòi ----------
/** Nhân viên khi máy rót hai loại trà nền cùng lúc cho hai chỗ pha. */
export const DUAL_SPOUT_LINES = [
  "Hai vòi chảy cùng lúc, mỗi vòi một loại trà. Em thấy mình như nhạc trưởng.",
  "Máy hai vòi lên tiếng: rột rột cho ly này, rột rột cho ly kia.",
  "Rót hai trà cùng lúc! Ly bên trái ô long, ly bên phải hồng trà, không ai giành ai.",
  "Hai vòi, hai ly, một cái bấm. Đầu tư đúng chỗ.",
  "Vòi trái, vòi phải, ly nào trà nấy. Em xin phép tự hào ba giây.",
  "Máy hai vòi làm việc của hai người. Người còn lại là em, đang đứng ngắm.",
  "Hai dòng trà chảy song song như hai làn xe đúng luật.",
  "Bấm một lần, hai ly có trà nền. Thời gian tiết kiệm được em dùng để thở.",
];
/** Review khách nhận ly từ máy rót hai vòi (thấy máy chạy): good (4–5 sao), meh (≤ 3 sao). */
export const DUAL_SPOUT_REVIEW = {
  good: [
    "Tiệm có cái máy rót hai vòi, nhìn hai dòng trà chảy cùng lúc mà mê. Ly ngon. #maymoc",
    "Mình với bạn gọi hai món trà khác nhau mà ra cùng lúc. Máy hai vòi là chân ái. #donnhom",
    "Đứng xem máy hai vòi rót còn vui hơn xem phim. Trà chuẩn vị. #reviewthat",
    "Tiệm nhỏ mà đầu tư máy xịn, ly ra nhanh, đúng ý. #dautu",
    "Hai vòi, hai loại trà, không lẫn mùi. Ấn tượng. #tiemnho",
    "Máy hai vòi rót đều tay hơn mình rót nước mắm. Ly {drink} thơm. #khen",
    "Chưa kịp lấy điện thoại ra quay thì ly đã xong. #nhanh",
    "Cái máy hai vòi làm tiệm như quán lớn, mà giá vẫn tiệm nhỏ. #dangtien",
    "Thấy chủ tiệm bấm một nút mà hai ly có trà, mình muốn mua một cái về nhà. #maymoc",
    "Ra cùng lúc với ly của bạn mình, không ai phải chờ ai. Tình bạn được cứu. #donnhom",
  ],
  meh: [
    "Máy rót hai vòi xịn đó, nhưng phần sau của ly thì chưa xịn bằng. #gopy",
    "Trà nền chuẩn nhờ máy, mấy bước sau thì nhờ hên. #reviewthat",
    "Máy hai vòi nhanh quá, chủ tiệm theo không kịp. #lech",
    "Ly có trà nền đẹp như quảng cáo, đá với đường thì như đời thật. #thatlong",
    "Đầu tư máy rồi thì đầu tư thêm chút tập trung nha tiệm. #gopy",
    "Hai vòi rót hai ly, một ly đúng ý, một ly đúng ý người khác. #nhamly",
    "Máy làm tốt phần của máy. Người làm chưa tốt phần của người. #reviewthat",
    "Xem máy rót thì vui, uống thì bình thường. #binhthuong",
  ],
};

// ---------- Hạng tiệm (chỗ tiêu tiền cuối game) ----------
export const TIER_LINES = [
  "Tiệm lên hạng “{tier}”! Bảng hiệu mới sáng hơn, chủ tiệm cũng sáng hơn.",
  "Hạng “{tier}” mở. Khách đi ngang nói \"ủa tiệm này đổi mới hả\".",
  "Nâng hạng “{tier}”. Dì Ba ghé xem, gật đầu đúng hai lần.",
  "“{tier}”: tiệm nhỏ ngày nào giờ đã có chút tên tuổi trong hẻm.",
  "Lên hạng “{tier}”. Mẹ chụp hình gửi nhóm gia đình, kèm mười cái like.",
  "Tiệm đạt “{tier}”. Chị Lụa Hẻm Bên tình cờ đi ngang… ba lần.",
];
