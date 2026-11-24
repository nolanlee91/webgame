// Vụ 9: "Hoàng Thượng Mất Tích" (độ khó 2, mùa 2). Hợp đồng nhân vật / cảnh / đồ vật: docs/tham-tu-hem/DESIGN.md §3b.
// Cơ chế mới: PHÂN TÍCH TIN NHẮN. So lỗi chính tả, emoji và giờ gửi của tin đòi chuộc với tin nhắn mẫu của từng người.
// Lời giải (KHÔNG hiện cho người chơi):
//   Thủ phạm: Tôm (12 tuổi, cháu bà Sáu nhà sát vách). Hai tuần nay, đêm nào mèo Bơ cũng tự leo qua ô thông gió sân thượng
//   nhà chị Na, men theo ống nước sang sân thượng nhà bà Sáu để thăm mèo mướp "Mướp" (cú lật: Bơ tự bỏ đi vì mê mèo cái).
//   Tôm biết, nên thứ Tư lấy heo đất mua 3 lon pate Hoàng Gia (trả 174 đồng xu ở chính shop chị Na), ghi T4, T5, T6.
//   Thứ Sáu chị Na bắt Bơ quay 10 clip, Bơ rụng lông, thâm mắt. 19:30 anh Đen giao pate, Bơ nhảy vô thùng hàng như mọi bữa,
//   19:32 Đen bế ra, Bơ chạy tót lên lầu. Khoảng 20:00 Bơ qua nhà Tôm. Tôm làm chuồng tự chế, "cho Bơ nghỉ diễn",
//   rồi dùng máy tính bảng tạo nick Zalo "Băng Mèo Đen" nhắn đòi chuộc cho giống thật: 20:52, 20:57, 20:59 (đứt ngang vì
//   21:00 bà nội thu máy), 6:31 sáng nay (lấy máy lại lúc 6:30) nhắn tiếp. Tin chuộc viết "ko", "fải", ký 🐾🐾🐾:
//   y như 482 bình luận TikTok của nick "Tôm Siêu Nhân 2014" (không bình luận nào trong khoảng 21:00–6:30).
//   Không ai làm hại con mèo.
//   Gây nhiễu: cô Hồng (shop đối thủ, từng bình luận "coi chừng mất mèo"; thật ra là fan ngầm, lén đặt áo "TEAM BƠ"),
//   bác sĩ Khôi (lồng nhốt có lông xám, hộp "AN THẦN" trống, cũng ký 🐾; thật ra bác sĩ thú y SỢ mèo, hộp đó là trà hoa cúc),
//   anh Đen (lông xám đầy thùng hàng, cũng viết "ko"; thật ra ngày nào cũng cho Bơ ngồi thùng chụp hình gửi con gái).
//   Kết hợp vật chứng: dấu chân to trong thùng cát + cân nặng trong sổ khám (Bơ 5,2 kg, Mướp 2,8 kg) => trong chuồng có Bơ.
export default {
  id: "meo-mat-tich",
  no: 9,
  title: "Hoàng Thượng Mất Tích",
  tagline: "Hoàng thượng 300 nghìn follow biến mất. Băng đảng đòi 5 triệu, ký tên bằng ba dấu chân mèo.",
  difficulty: 2,
  client: "china",

  intro: [
    ["narr", "Sáng thứ Bảy, 8 giờ. Văn phòng Thám Tử Lụm vừa mở cửa, Tèo đã ngồi chồm hổm trên ghế, mặt dí sát điện thoại."],
    ["teo", "Sếp ơi! Biến lớn khu chợ! Hoàng thượng mất tích rồi!", "shock"],
    ["me", "Hoàng thượng nào? Hẻm mình làm gì có vua.", "neutral"],
    ["teo", "Bơ đó sếp! Mèo Anh lông ngắn 300 nghìn follow, clip nào cũng triệu view. Em coi Bơ mỗi tối trước khi ngủ, như uống thuốc.", "happy"],
    ["narr", "Cửa bật mở. Một cô gái váy hoa lao vào, tay cầm cái [[dien-thoai-3-cam|điện thoại ba camera]] to bằng cục gạch, mắt đỏ hoe."],
    ["china", "Anh thám tử! Tui là Na, chủ shop Na Ní, bán đồ ngủ đôi cho người với mèo. Bơ nhà tui mất rồi anh ơi!", "shock"],
    ["china", "Tối qua tui live bán hàng trên lầu. [[20h40|8 giờ 40]] xuống thì nhà cây trống trơn, chén ăn còn nguyên. Kêu \"Bơ ơi\" mỏi miệng không thấy.", "nervous"],
    ["china", "Rồi [[20h52|8 giờ 52]], có nick Zalo lạ nhắn tới: \"Bơ đang trong tay tụi tui\". Đòi 5 triệu!", "shock"],
    ["teo", "Bắt cóc hoàng thượng! Đây là âm mưu soán ngôi!", "shock"],
    ["me", "Chị báo công an chưa?", "neutral"],
    ["china", "Tụi nó dặn không được báo. Nên tui báo thám tử. Thám tử đâu phải công an đâu đúng không?", "nervous"],
    ["me", "Tối qua những ai lui tới gần Bơ?", "neutral"],
    ["china", "Thằng [[tom|Tôm]] nhà kế bên, ngày nào cũng qua ngó Bơ. [[khoi|Bác sĩ Khôi]] phòng khám thú y đầu chợ, chiều qua mới khám cho Bơ.", "neutral"],
    ["china", "[[hong|Cô Hồng]] shop đối diện, cũng nuôi mèo làm mẫu, ghét tui ra mặt. Với [[den|anh Đen]] shipper, tối qua mới giao thùng pate.", "neutral"],
    ["teo", "Em chốt luôn: cô Hồng. Shop đối thủ, ganh follow, kính râm. Đeo kính râm buổi tối là có tật.", "smug"],
    ["me", "Tèo, sáng nay cô ấy còn chưa xuất hiện.", "neutral"],
    ["batu", "(ló đầu vô cửa, quạt phành phạch) Na ơi bà Tư đăng bài rồi nha, cả chợ đang đi tìm! Thám tử nhận vụ chưa?", "happy"],
    ["me", "Nhận. Chị Na, dẫn tôi về shop.", "neutral"],
  ],

  social: {
    group: "Hẻm 47 Hóng Biến",
    posts: [
      {
        by: "batu",
        text: "🚨 HOÀNG THƯỢNG MẤT TÍCH 🚨 Mèo Bơ 300 nghìn follow của shop Na Ní biến mất tối nay, chén pate còn nguyên! Mới đó đã có tin nhắn ĐÒI CHUỘC 5 TRIỆU!!! Bà con khu chợ ai thấy một bé mèo xám, mặt tròn, mập mạp, đi đứng như vua thì báo bà Tư liền 🙏🐈",
        likes: 1580,
        comments: [
          { by: "teo", text: "Em đoán cô shop đối diện, ganh follow 😼 Thám tử Lụm sẽ vào cuộc!!" },
          { by: "Hồng Hot Shop", text: "Hôm bữa tui có nói rồi đó, mèo nổi quá coi chừng mất 😎💅" },
          { by: "Hùng Xe Ôm", text: "5 triệu? Con mèo nhà tui nuôi 10 năm chưa ai thèm bắt, buồn ghê" },
          { by: "Tôm Siêu Nhân 2014", text: "Bơ sẽ ko sao đâu ạ 🐾🐾🐾" },
          { by: "Cô Ba Bán Xôi", text: "Mèo ăn pate 58 ngàn một lon. Tui ăn xôi 15 ngàn. Ai mới là hoàng thượng" },
          { by: "chuba", text: "Chú đang trực, để chú đi soi gầm xe từng nhà. Mai chú báo" },
        ],
      },
    ],
  },

  people: {
    china: {
      name: "Chị Na",
      role: "Chủ shop Na Ní · người tới nhờ",
      bio: "29 tuổi, váy hoa, điện thoại ba camera không rời tay. Bán đồ ngủ đôi \"Sen & Hoàng Thượng\". Kênh TikTok của mèo Bơ nuôi cả cái shop.",
    },
    tom: {
      name: "Tôm",
      role: "Cháu bà Sáu nhà sát vách",
      bio: "12 tuổi, áo siêu nhân bạc màu, tự xưng \"Siêu Nhân Mèo\". Mê mèo hơn mê bánh tráng trộn. Ở với bà nội, nhà có mèo mướp tên Mướp.",
      suspect: true,
    },
    khoi: {
      name: "Bác sĩ Khôi",
      role: "Bác sĩ thú y",
      bio: "33 tuổi, áo blouse xanh, nói năng từ tốn như đọc đơn thuốc. Phòng khám nhỏ đầu chợ, khách quen nhất là mèo Bơ.",
      suspect: true,
    },
    hong: {
      name: "Cô Hồng",
      role: "Chủ Hồng Hot Shop (đối thủ)",
      bio: "35 tuổi, kính râm cả trong nhà, móng tay đính đá. Shop đối diện, cũng bán đồ cho thú cưng, có mèo Ba Tư trắng \"Công Chúa Miu\" làm mẫu. Follow thua Bơ một con số không.",
      suspect: true,
    },
    anhship: {
      name: "Anh Đen",
      role: "Shipper khu chợ",
      bio: "38 tuổi, áo khoác xanh, thùng hàng to đùng sau xe. Giao hàng cho cả dãy chợ, nói chuyện cộc lốc, mặt lúc nào cũng như đang kẹt xe.",
      suspect: true,
    },
    basau: {
      name: "Bà Sáu",
      role: "Bà nội của Tôm",
      bio: "70 tuổi, cầm cây chổi lông gà như cầm lệnh bài. Nội quy nhà bà dán khắp cửa.",
      start: false,
    },
  },

  locations: {
    shop: {
      name: "Shop Na Ní (phòng quay)",
      scene: "shop",
      start: true,
      intro: [
        ["narr", "Shop Na Ní: nửa là kho hàng, nửa là phòng quay. Đèn, phông, giá đỡ điện thoại dựng khắp nơi. Chỗ nào cũng có ảnh Bơ."],
        ["china", "Đây là cung điện của Bơ. Tui chưa dọn gì hết, để nguyên cho anh soi.", "nervous"],
        ["teo", "Sếp ơi, cái nhà cây mèo còn cao hơn em. Em sống không bằng con mèo.", "shock"],
      ],
      hotspots: [
        {
          id: "den-quay",
          label: "Đèn quay",
          rect: [70, 60, 160, 270],
          lines: [
            ["narr", "Hai cây đèn softbox to như hai cái tủ, chĩa vào một cái đệm nhung nhỏ. Đèn còn ấm."],
            ["me", "Chân đèn dán tờ giấy: \"Tổng giờ chiếu tháng này: 290 giờ\". Hai trăm chín mươi giờ [[den-quay|đèn quay]], cho một con mèo.", "neutral"],
            ["me", "Cái đệm lõm sâu, phủ một lớp lông xám rụng dày cộm.", "neutral"],
            ["teo", "Hoàng thượng làm việc chăm hơn em. Em mà bị chiếu đèn 290 giờ chắc em thành khô mực.", "shock"],
          ],
          again: [["teo", "Đèn tắt rồi mà em vẫn thấy chói. Bơ chịu sao nổi ta."]],
        },
        {
          id: "nha-cay-meo",
          label: "Nhà cây mèo",
          rect: [290, 110, 160, 340],
          lines: [
            ["narr", "Nhà cây mèo năm tầng, tầng cao nhất là cái đệm nhung đỏ thêu chữ vàng \"HOÀNG THƯỢNG\". Trống trơn."],
            ["china", "Ngai vàng của Bơ đó anh. Bơ chỉ ngủ trên đó. Ai đặt Bơ xuống chỗ khác là Bơ nhìn người đó bằng ánh mắt khinh bỉ.", "nervous"],
            ["me", "Cửa sổ ngay cạnh đóng chốt từ bên trong, chốt còn bám bụi. Bơ không đi đường cửa sổ.", "neutral"],
            ["teo", "Có con chuột đồ chơi bị cắn nát nè sếp. Hung khí!", "shock"],
            ["me", "Tèo, đó là đồ chơi.", "neutral"],
          ],
          again: [["me", "Ngai vàng vẫn trống. Đệm nhung còn hằn hình một cái bụng tròn.", "neutral"]],
        },
        {
          id: "chen-an",
          label: "Chén ăn",
          rect: [470, 430, 120, 80],
          lines: [
            ["narr", "Cái chén sứ khắc chữ \"BƠ\" mạ vàng. Pate trong chén còn đầy, mặt đã khô cong."],
            ["china", "Bảy giờ tối tui đổ pate. Bơ không thèm đụng. Mấy tối nay đều vậy hết, mà sáng ra Bơ lại nằm trên ngai, bụng no căng.", "nervous"],
            ["me", "Một con mèo bỏ bữa tối mà sáng nào cũng no. Nó ăn ở đâu đó khác.", "neutral"],
            ["teo", "Hoàng thượng đi ăn nhà hàng. Có khi có cả thẻ thành viên.", "smug"],
          ],
          gives: { clues: ["chen-day"] },
          again: [["teo", "Pate 58 ngàn khô queo. Em xin được không chị... dạ thôi em giỡn.", "nervous"]],
        },
        {
          id: "ke-hang",
          label: "Kệ hàng",
          rect: [690, 70, 230, 300],
          lines: [
            ["narr", "Kệ hàng chất đầy đồ ngủ đôi in chữ \"Sen & Hoàng Thượng\", và mấy thùng [[pate-hoang-gia|pate Hoàng Gia]] nắp vàng in vương miện."],
            ["china", "Pate Hoàng Gia, 58 ngàn một lon. Bơ chỉ ăn đúng loại này, đổi loại khác là Bơ úp chén.", "neutral"],
            ["me", "Kẹp trên kệ có cuốn sổ bán lẻ. Dòng thứ Tư: \"3 lon pate Hoàng Gia – khách: bé Tôm – trả 174 đồng xu 1.000đ\".", "neutral"],
            ["china", "À, thằng Tôm ôm cái heo đất qua, đếm xu muốn xỉu luôn. Tui tưởng nó mua cho con Mướp nhà nó.", "neutral"],
            ["teo", "174 đồng xu! Sếp, đây là tình yêu đích thực.", "happy"],
          ],
          gives: { clues: ["so-ban-le"] },
          again: [["me", "Thùng pate Hoàng Gia vơi một góc. Ba lon đã về tay một cậu bé 12 tuổi.", "neutral"]],
        },
        {
          id: "thung-carton",
          label: "Thùng carton",
          rect: [590, 380, 160, 130],
          lines: [
            ["narr", "Một thùng carton đã gói sẵn, chờ giao. Băng keo quấn kín mít ba vòng."],
            ["me", "Phiếu dán ngoài: người nhận \"H. Hồng\". Số điện thoại... trùng số trên biển hiệu Hồng Hot Shop đối diện.", "neutral"],
            ["me", "Hàng: 2 áo mèo in chữ \"TEAM BƠ\" size S, 1 móc khoá hình Bơ. Kèm ghi chú khách gõ.", "neutral"],
            ["china", "Ủa?! Bà Hồng đặt hàng tui? Đặt áo TEAM BƠ? Bà đó mỗi lần đi ngang shop tui là hất mặt lên trời mà!", "shock"],
            ["teo", "Hất mặt lên trời là để giấu nụ cười đó chị.", "smug"],
          ],
          gives: { clues: ["don-hang-hong"] },
          again: [["teo", "Áo TEAM BƠ size S. Size S là cho Công Chúa Miu mặc. Trời ơi drama.", "happy"]],
        },
        {
          id: "lich-quay",
          label: "Bảng lịch quay",
          rect: [470, 60, 170, 130],
          lines: [
            ["narr", "Bảng trắng \"LỊCH QUAY CỦA BƠ\", kẻ ô kín mít bằng ba màu bút."],
            ["me", "Thứ Hai tới Chủ Nhật, 7 giờ sáng tới 10 giờ đêm. Ngày nào cũng 10 clip. Thứ Sáu tô đỏ: \"Clip quảng cáo pate Hoàng Gia – 5 triệu\".", "neutral"],
            ["china", "Hợp đồng quảng cáo đó anh. Một clip 5 triệu. Bơ nuôi cả shop, nuôi cả tui.", "nervous"],
            ["teo", "Hoàng thượng đi làm 15 tiếng một ngày. Cái này là bóc lột hoàng gia đó chị.", "shock"],
          ],
          gives: { clues: ["lich-quay"] },
          again: [["me", "Không có ô nào ghi chữ \"nghỉ\".", "neutral"]],
        },
        {
          id: "cau-thang",
          label: "Cầu thang sân thượng",
          rect: [790, 390, 160, 140],
          lines: [
            ["narr", "Cầu thang sắt lên sân thượng nhà chị Na. Cửa sân thượng khép, ô thông gió phía dưới gãy mất hai nan."],
            ["me", "Lỗ hổng vừa đủ cho một con mèo mập chui qua. Mép nan gãy mắc mấy sợi lông xám, cái cũ cái mới.", "neutral"],
            ["me", "Nhìn qua: sân thượng nhà chị trống trơn. Sát vách là sân thượng nhà bên, nối với nhau bằng một [[ong-nuoc|ống nước]] to.", "neutral"],
            ["china", "Bên đó là nhà bà Sáu, nội thằng Tôm. Bơ mập vậy, leo trèo gì nổi anh.", "neutral"],
            ["teo", "Lại sân thượng. Sếp có để ý không, hẻm mình con gì mất cũng lên sân thượng kiếm.", "smug"],
          ],
          gives: { clues: ["o-thong-gio"], words: ["cau-thang"] },
          again: [["me", "Ô thông gió gãy nan vẫn ở đó, như một cánh cửa chỉ dành cho hoàng thượng.", "neutral"]],
        },
      ],
    },

    vetclinic: {
      name: "Phòng khám thú y Khôi",
      scene: "vetclinic",
      start: true,
      intro: [
        ["narr", "Phòng khám nhỏ đầu chợ, mùi thuốc sát trùng trộn mùi pate. Một con chó cỏ nằm ngủ ngay cửa, không thèm ngẩng lên."],
        ["khoi", "Chào anh. Tôi nghe chuyện của Bơ rồi. Anh cứ xem, phòng khám không có gì phải giấu.", "neutral"],
        ["teo", "Người nói \"không có gì phải giấu\" là người có cả kho để giấu. Em coi phim nhiều rồi.", "smug"],
      ],
      hotspots: [
        {
          id: "ban-kham",
          label: "Bàn khám",
          rect: [330, 280, 300, 160],
          lines: [
            ["narr", "Bàn khám inox sáng bóng, cái cân điện tử, ống nghe, hộp bông gòn."],
            ["me", "Cạnh cân là một đôi găng tay da dày cộm, dày như găng thợ hàn. Kẹp kèm tờ giấy: \"Bơ: cào 3 lần/1 ca\".", "neutral"],
            ["teo", "Găng tay này đi đánh bốc được luôn sếp.", "shock"],
            ["me", "Bác sĩ thú y mà khám mèo phải mặc giáp. Ghi nhớ.", "neutral"],
          ],
          again: [["teo", "Em thử đeo găng nè. Ủa sao bên trong có mồ hôi lạnh."]],
        },
        {
          id: "so-kham-benh",
          label: "Sổ khám bệnh",
          rect: [660, 300, 130, 90],
          lines: [
            ["narr", "Cuốn sổ bìa xanh, chữ bác sĩ nắn nót như chữ học trò."],
            ["me", "Chiều qua, [[15h|15:00]]: \"Bơ – mèo Anh lông ngắn – 5,2 kg. Rụng lông, thâm quầng mắt, ngủ ít. Chẩn đoán: stress do làm việc quá sức.\"", "neutral"],
            ["me", "\"Dặn chủ: giảm đèn quay, cho ngủ đủ. Ghi chú: dụ bé vào lồng bằng pate, khám qua song lồng.\"", "neutral"],
            ["me", "Lật lại trang 15/11: \"Mướp – mèo ta – 2,8 kg – chủ: bé Tôm (nhà bà Sáu). Bé trả bằng tiền xu.\"", "neutral"],
            ["me", "Bên lề có dòng chữ con nít, viết bút chì: \"Bác sĩ ơi Mướp có fải bị tương tư ko ạ 🐾🐾🐾\".", "neutral"],
            ["teo", "Mèo tương tư! Hẻm mình tới mèo cũng có chuyện tình.", "happy"],
          ],
          gives: { clues: ["so-kham"] },
          again: [["me", "Bơ 5,2 kg. Mướp 2,8 kg. Hai con số đáng nhớ.", "neutral"]],
        },
        {
          id: "long-nhot",
          label: "Lồng nhốt",
          rect: [40, 230, 240, 250],
          lines: [
            ["narr", "Dãy lồng inox xếp hai tầng. Lồng nào cũng trống, trừ một con hamster đang chạy bánh xe như chạy deadline."],
            ["me", "Lồng góc dưới: song sắt mắc đầy lông xám ngắn, dày, mềm. Kiểu lông mèo Anh. Dưới sàn còn một vệt pate khô.", "neutral"],
            ["teo", "Lông xám! Bác sĩ nhốt hoàng thượng! Sếp còng tay ổng đi!", "shock"],
            ["me", "Lông thì ở đây. Mèo thì không. Chưa vội.", "neutral"],
          ],
          gives: { clues: ["long-xam-long"] },
          again: [["teo", "Con hamster vẫn chạy. Nó chạy từ lúc mình vô tới giờ, chưa tới đâu hết.", "neutral"]],
        },
        {
          id: "tu-thuoc",
          label: "Tủ thuốc",
          rect: [700, 50, 210, 220],
          lines: [
            ["narr", "Tủ thuốc kính, dán nhãn ngay hàng thẳng lối: kháng sinh, tẩy giun, vitamin, nhỏ mắt..."],
            ["me", "Ngăn trên cùng có chỗ trống. Nhãn dán: \"AN THẦN\". Hộp thì không thấy.", "neutral"],
            ["teo", "Thuốc an thần biến mất cùng ngày hoàng thượng biến mất! Sếp ơi trùng hợp quá sức!", "shock"],
            ["me", "Một hộp an thần là đủ cho một con mèo ngủ ngoan trong thùng. Nếu có người muốn vậy.", "neutral"],
          ],
          gives: { clues: ["hop-an-than"] },
          again: [["me", "Ngăn \"AN THẦN\" vẫn trống. Bụi chung quanh còn in hình cái hộp.", "neutral"]],
        },
        {
          id: "poster-meo",
          label: "Poster chăm mèo",
          rect: [340, 50, 170, 170],
          lines: [
            ["narr", "Poster vàng ố: \"MÈO TRƯỞNG THÀNH CẦN NGỦ 12–16 TIẾNG MỖI NGÀY\". Hình con mèo ngủ ngửa bụng, chân giơ lên trời."],
            ["teo", "16 tiếng! Mèo là sinh vật lý tưởng. Em muốn đầu thai làm mèo.", "happy"],
            ["me", "Mèo ngủ 16 tiếng. Lịch quay của Bơ là 15 tiếng. Phép trừ không đẹp lắm.", "neutral"],
          ],
          again: [["teo", "Con mèo trong poster ngủ ngon ghê. Em ngáp lây rồi sếp."]],
        },
      ],
    },

    rooftop2: {
      name: "Sân thượng nhà Tôm",
      scene: "rooftop2",
      needs: { any: ["seen:shop.cau-thang", "talk:tom.muop"] },
      intro: [
        ["narr", "Sân thượng nhà bà Sáu: dây phơi, chậu ớt, mái tôn nóng hầm. Tôm đứng ngay giữa, dang hai tay chắn trước một cái chuồng phủ chăn."],
        ["tom", "Anh coi gì thì coi, đừng đụng cái chuồng nha anh. Mướp đang ngủ. Mướp ngủ mà bị đánh thức là Mướp cào.", "nervous"],
        ["teo", "Sếp, thằng nhỏ đứng tấn luôn kìa. Nó luyện võ hay sao.", "smug"],
      ],
      hotspots: [
        {
          id: "chuong-meo-tu-che",
          label: "Chuồng mèo tự chế",
          rect: [360, 250, 250, 210],
          lines: [
            ["narr", "Một cái chuồng ghép từ ba thùng carton và hai cái rổ nhựa, to cỡ cái tủ lạnh mini. Phủ chăn hoa kín mít."],
            ["me", "Cửa chuồng dán giấy: \"MƯỚP – CẤM MỞ – CẤM CHỤP HÌNH – CẤM QUAY CLIP\". Bên trong có hai cái chén.", "neutral"],
            ["narr", "Từ trong chuồng vọng ra một tiếng \"meo\" nhỏ, rồi một tiếng \"mèooo\" trầm, khàn, rất... uy nghi."],
            ["teo", "Mướp meo hai giọng! Mướp song ca một mình!", "shock"],
            ["tom", "Mướp... Mướp đang tập luyện thanh!", "nervous"],
            ["me", "Cấm quay clip. Một cái chuồng cho mèo ta mà sợ bị quay clip.", "neutral"],
          ],
          gives: { clues: ["chuong-to"] },
          again: [["narr", "Trong chuồng: \"mèooo\". Trầm, chậm, như một ông vua đang ra lệnh dọn bữa."]],
        },
        {
          id: "bon-cat",
          label: "Bồn cát",
          rect: [640, 400, 150, 100],
          lines: [
            ["narr", "Bồn cát vệ sinh của mèo, đặt sát chuồng. Cát mới đổ, vết cào lổn nhổn."],
            ["me", "Trên mặt cát có hai cỡ dấu chân. Một loại nhỏ, thon. Một loại to tròn, lún sâu, rộng gấp rưỡi.", "neutral"],
            ["me", "Một con mèo nhẹ ký không lún sâu cỡ đó. Dấu to này là của một con mèo mập gấp đôi.", "neutral"],
            ["teo", "Mướp ban ngày nhỏ, ban đêm to. Mướp biến hình!", "smug"],
          ],
          gives: { clues: ["dau-chan-to"] },
          again: [["teo", "Em không đứng gần cái bồn này nữa đâu sếp. Mùi hoàng gia nồng quá."]],
        },
        {
          id: "hop-pate-rong",
          label: "Hộp pate rỗng",
          rect: [250, 430, 100, 80],
          lines: [
            ["narr", "Ba cái lon rỗng xếp ngay hàng cạnh chuồng, liếm sạch bóng. Nắp vàng in vương miện."],
            ["me", "Pate Hoàng Gia. Trên mỗi nắp có chữ bút lông nguệch ngoạc: \"T4\", \"T5\", \"T6\".", "neutral"],
            ["me", "Thứ Tư, thứ Năm, thứ Sáu. Ba đêm. Mà Bơ chỉ mới mất tích tối qua.", "neutral"],
            ["teo", "Có khi Mướp đổi khẩu vị, thích ăn sang. Mèo ta giờ cũng sống ảo.", "smug"],
          ],
          gives: { clues: ["lon-pate"] },
          again: [["me", "Ba cái lon, ba đêm. Cái lon T6 còn thơm mùi pate mới.", "neutral"]],
        },
        {
          id: "day-phoi-do",
          label: "Dây phơi đồ",
          rect: [90, 40, 580, 150],
          lines: [
            ["narr", "Dây phơi căng ngang sân thượng: áo bà ba của bà Sáu, ba cái áo siêu nhân y chang nhau, và một cái áo choàng đen."],
            ["me", "Áo choàng đen may từ bao gối cũ, vẽ ba chữ to bằng sơn trắng: \"BMĐ\". Sơn còn mới, dính tay.", "neutral"],
            ["me", "Kẹp kế bên là cái mặt nạ bìa cứng cắt hình đầu mèo, tô đen thui.", "neutral"],
            ["teo", "BMĐ! Bánh Mì Đặc biệt! Thằng nhỏ mê bánh mì tới mức in lên áo!", "happy"],
          ],
          gives: { clues: ["ao-choang-bmd"], words: ["ao-choang"] },
          again: [["teo", "Em vẫn nghĩ là Bánh Mì Đặc biệt. Em đói rồi sếp."]],
        },
        {
          id: "ong-nuoc",
          label: "Ống nước",
          rect: [850, 40, 80, 460],
          lines: [
            ["narr", "Ống nước to bắc ngang từ sân thượng nhà chị Na sang, chạy sát mép tường như một cây cầu tí hon."],
            ["me", "Thân ống chi chít vết cào. Vết mới còn trắng, vết cũ đã bạc màu, đóng bụi. Ít nhất hai tuần.", "neutral"],
            ["me", "Khớp nối mắc một nhúm lông xám ngắn, dày. Có một vị khách đi cây cầu này mỗi đêm, đi lâu rồi.", "neutral"],
            ["me", "Đi đều đặn, đêm nào cũng qua, ăn no rồi về. Tôi chỉ nghĩ ra một lý do: [[me-meo-cai|mê mèo cái]].", "neutral"],
            ["teo", "Hoàng thượng vi hành tuyển phi! Mà đi đường ống nước, không có kiệu luôn!", "shock"],
          ],
          gives: { clues: ["vet-cao-ong-nuoc"], words: ["ong-nuoc"] },
          again: [["me", "Cây cầu hoàng gia. Lông xám vẫn mắc ở khớp nối.", "neutral"]],
        },
        {
          id: "noi-quy",
          label: "Nội quy của bà nội",
          rect: [50, 230, 130, 140],
          lines: [
            ["narr", "Cửa cầu thang sân thượng dán tờ giấy chữ to, nét run run nhưng dứt khoát."],
            ["me", "\"NỘI QUY [[may-tinh-bang|MÁY TÍNH BẢNG]] CỦA TÔM. Lấy lúc 6 giờ 30 sáng. Nộp cho nội lúc [[21h|9 giờ tối]]. Trễ 1 phút, mất 1 ngày. Nội ký.\"", "neutral"],
            ["me", "Bên dưới, chữ con nít: \"Dạ con fải nộp đúng giờ ạ 🐾🐾🐾\".", "neutral"],
            ["teo", "Nội quy nghiêm hơn công ty em từng thực tập. Mà em chưa từng thực tập.", "smug"],
          ],
          gives: { clues: ["noi-quy"] },
          again: [["me", "6 giờ 30 tới 9 giờ tối. Ngoài giờ đó, máy nằm trong tay bà nội.", "neutral"]],
        },
      ],
    },
  },

  clues: {
    "tin-chuoc": {
      name: "Tin nhắn đòi chuộc",
      desc: "Từ nick Zalo \"Băng Mèo Đen\", tạo tối qua. [[20h52|20:52]]: \"Chị Na. Bơ đang trong tay tụi tui. Muốn Bơ về thì chuẩn bị 5 triệu. Ko đc báo công an 🐾🐾🐾\". 20:57: \"Tụi tui là băng đảng chuyên nghiệp. Tụi tui fải ra tay vì chị bắt Bơ quay clip quá trời 🐾🐾🐾\". [[20h59|20:59]]: \"Nếu chị ko nghe lời thì\" (đứt ngang). [[6h31|6:31]] sáng nay: \"...thì tụi tui giữ Bơ thêm 1 tuần. Bơ ko fải cái máy quay clip 🐾🐾🐾\".",
      detail: [
        ["me", "Gõ có dấu đầy đủ. Viết \"ko\", và [[viet-f|viết \"fải\" thay \"phải\"]]. Cuối tin nào cũng [[ba-dau-chan|ký ba dấu chân 🐾🐾🐾]].", "neutral"],
        ["me", "Câu dọa bỏ dở lúc 20:59, gần mười tiếng sau mới nói tiếp. Kẻ bắt cóc nào lại đi ngủ giữa câu dọa?", "neutral"],
      ],
    },
    "chen-day": {
      name: "Chén pate còn đầy",
      desc: "Chén sứ khắc \"BƠ\", pate Hoàng Gia đổ lúc 7 giờ tối còn nguyên. Mấy tối nay Bơ đều bỏ bữa tối, sáng ra lại no căng.",
      detail: [["me", "Có nơi khác cho Bơ ăn tối. Đều đặn.", "neutral"]],
    },
    "so-ban-le": {
      name: "Sổ bán lẻ của shop",
      desc: "Dòng thứ Tư: \"3 lon [[pate-hoang-gia|pate Hoàng Gia]] – khách: bé Tôm – trả 174 đồng xu 1.000đ\". Loại pate duy nhất Bơ chịu ăn.",
    },
    "don-hang-hong": {
      name: "Đơn hàng của cô Hồng",
      desc: "Người nhận \"H. Hồng\", số máy của Hồng Hot Shop. 2 áo mèo \"TEAM BƠ\" size S, 1 móc khoá Bơ. Ghi chú gõ lúc 23:14: \"Shop gói kín giùm nha, KHÔNG ghi tên shop bên ngoài. Giao sau 10 giờ tối giùm. Cảm ơn bà Na 💅😎\".",
      detail: [["me", "Chính tả chuẩn chỉnh, \"không\" viết đủ chữ. [[goi-ba|Gọi chị Na là \"bà\"]], ký [[mong-tay|💅😎]]. Tin chuộc thì gọi \"chị Na\".", "neutral"]],
    },
    "lich-quay": {
      name: "Bảng lịch quay của Bơ",
      desc: "Thứ Hai tới Chủ Nhật, 7 giờ sáng tới 10 giờ đêm, mỗi ngày 10 clip, không có ngày nghỉ. Thứ Sáu: \"Clip quảng cáo pate Hoàng Gia – 5 triệu\".",
      detail: [
        ["me", "5 triệu. Đúng số tiền đòi chuộc. Và tin chuộc trách \"chị bắt Bơ quay clip quá trời\".", "neutral"],
        ["me", "Kẻ viết câu đó không cần tiền. Họ muốn [[cho-bo-nghi|cho Bơ nghỉ diễn]].", "neutral"],
      ],
    },
    "o-thong-gio": {
      name: "Ô thông gió gãy nan",
      desc: "Ô thông gió cửa sân thượng nhà chị Na gãy hai nan, vừa một con mèo mập. Mép nan mắc lông xám, sợi cũ sợi mới. Sân thượng nối sang nhà bà Sáu bằng một [[ong-nuoc|ống nước]].",
    },
    "so-kham": {
      name: "Sổ khám bệnh",
      desc: "Chiều qua [[15h|15:00]]: Bơ 5,2 kg, stress do làm việc quá sức, dặn giảm đèn quay. Ghi chú: \"dụ bé vào lồng bằng pate, khám qua song lồng\". Trang 15/11: Mướp, mèo ta, 2,8 kg, chủ là bé Tôm. Bên lề, chữ bút chì: \"Bác sĩ ơi Mướp có fải bị tương tư ko ạ 🐾🐾🐾\".",
      detail: [["me", "Chữ viết tay của Tôm: \"fải\", \"ko\", ba dấu chân. Quen quen.", "neutral"]],
    },
    "long-xam-long": {
      name: "Lông xám trong lồng nhốt",
      desc: "Lồng inox góc dưới ở [[phong-kham|phòng khám]] mắc đầy lông xám ngắn, dày, kiểu mèo Anh. Sàn lồng có vệt pate khô.",
    },
    "hop-an-than": {
      name: "Ngăn thuốc an thần trống",
      desc: "Ngăn trên cùng tủ thuốc, nhãn \"AN THẦN\", hộp đã biến mất. Bụi còn in hình cái hộp.",
    },
    "tin-khoi": {
      name: "Tin nhắn của bác sĩ Khôi",
      desc: "Gửi chị Na lúc [[21h34|21:34]] tối qua: \"Chào chị Na. Tôi vừa đọc tin trong nhóm Hẻm 47. Chị bình tĩnh. Mèo Anh lông ngắn hay trốn chỗ cao và kín. Chị tìm kỹ trên cao. Trân trọng. 🐾 BS. Khôi\".",
      detail: [["me", "Đủ dấu chấm dấu phẩy, [[ky-tran-trong|ký \"Trân trọng\"]], và [[mot-dau-chan|một dấu chân 🐾 trong chữ ký]]. Gửi sau 9 giờ tối.", "neutral"]],
    },
    "tin-den": {
      name: "Tin nhắn của anh Đen",
      desc: "Gửi chị Na. 19:28: \"c Na oi e toi r, c ra lay hang nha 👍\". 22:05: \"c oi Bo ve chua, e chay 2 vong hem ko thay 👍\".",
      detail: [["me", "Cũng viết \"ko\". Nhưng [[khong-dau|viết không dấu]] từ đầu tới cuối, gọi \"c\", ký [[ngon-cai|👍]]. Tin chuộc thì dấu nào ra dấu nấy.", "neutral"]],
    },
    "long-thung-hang": {
      name: "Lông xám trong thùng hàng",
      desc: "[[thung-hang|Thùng hàng]] sau xe anh Đen lót một tấm khăn, phủ đầy lông xám ngắn. Góc thùng có một cái gối nhỏ in hình vương miện.",
    },
    "anh-giao-hang": {
      name: "Ảnh xác nhận giao hàng",
      desc: "App giao hàng của shop, đơn giao lúc [[19h30|19:30]] tối qua. Ảnh anh Đen chụp: thùng pate đặt trước [[cua-truoc|cửa trước]], và ngồi chễm chệ trong thùng hàng sau xe là... Bơ, mặt khinh khỉnh. Anh Đen giơ hai ngón tay chữ V, cười tươi rói.",
    },
    "binh-luan-tom": {
      name: "Bình luận TikTok của Tôm",
      desc: "Nick \"Tôm Siêu Nhân 2014\", 482 bình luận dưới clip của Bơ trong tháng. \"Bơ đẹp trai nhất hẻm 47 luôn ạ 🐾🐾🐾\" (6:34). \"Chị Na ơi Bơ ngáp kìa, Bơ fải ngủ chứ 🐾🐾🐾\" (20:58 thứ Năm). \"Clip thứ 10 rồi á, Bơ ko mệt hả 🐾🐾🐾\" (20:59 thứ Sáu). Bình luận sớm nhất 6:30, trễ nhất 20:59. Không có cái nào từ 21:00 tới 6:30.",
      detail: [["me", "\"Fải\". \"Ko\". Ba dấu chân. Có dấu đầy đủ. Và một cái giờ giới nghiêm.", "neutral"]],
    },
    "noi-quy": {
      name: "Nội quy máy tính bảng",
      desc: "Chữ bà Sáu: \"[[may-tinh-bang|Máy tính bảng]] của Tôm: lấy lúc 6 giờ 30 sáng, nộp lúc [[21h|9 giờ tối]]. Trễ 1 phút mất 1 ngày.\" Bên dưới chữ con nít: \"Dạ con fải nộp đúng giờ ạ 🐾🐾🐾\".",
      detail: [["me", "Tin chuộc đứt ngang lúc 20:59, nối tiếp lúc 6:31. Khớp từng phút với giờ nộp máy và giờ lấy máy.", "neutral"]],
    },
    "chuong-to": {
      name: "Chuồng mèo tự chế",
      desc: "Ghép từ ba thùng carton và hai rổ nhựa, to cỡ tủ lạnh mini, phủ chăn hoa. Hai cái chén. Dán giấy: \"MƯỚP – CẤM MỞ – CẤM CHỤP HÌNH – CẤM QUAY CLIP\". Bên trong có hai giọng meo: một nhỏ, một trầm.",
    },
    "dau-chan-to": {
      name: "Dấu chân trong bồn cát",
      desc: "Hai cỡ dấu chân mèo trên bồn cát sân thượng nhà Tôm. Một nhỏ, thon. Một to tròn, lún sâu, rộng gấp rưỡi: của một con mèo nặng gần gấp đôi.",
      detail: [["me", "Sổ khám ghi Mướp 2,8 kg, Bơ 5,2 kg. Gần gấp đôi.", "neutral"]],
    },
    "lon-pate": {
      name: "Ba lon pate rỗng",
      desc: "Ba lon [[pate-hoang-gia|pate Hoàng Gia]] nắp vàng, liếm sạch, nắp ghi bút lông \"T4\", \"T5\", \"T6\". Nằm cạnh chuồng mèo trên sân thượng nhà Tôm.",
      detail: [["me", "Ba lon Tôm mua bằng 174 đồng xu ở shop chị Na. Ba đêm liền có khách hoàng gia ghé ăn tối.", "neutral"]],
    },
    "vet-cao-ong-nuoc": {
      name: "Vết cào trên ống nước",
      desc: "Ống nước nối sân thượng nhà chị Na với nhà bà Sáu chi chít vết cào: vết mới còn trắng, vết cũ bạc màu đã hai tuần. Khớp nối mắc lông xám ngắn, dày.",
      detail: [["me", "Không ai khiêng Bơ qua đây. Bơ tự đi. Đi suốt hai tuần rồi.", "neutral"]],
    },
    "ao-choang-bmd": {
      name: "Áo choàng \"BMĐ\"",
      desc: "[[ao-choang|Áo choàng]] đen may từ bao gối cũ, sơn trắng ba chữ \"BMĐ\", sơn còn mới. Kèm mặt nạ bìa cứng hình đầu mèo đen. Phơi trên sân thượng nhà Tôm.",
      detail: [["me", "B. M. Đ. Nick Zalo đòi chuộc là \"Băng Mèo Đen\".", "neutral"]],
    },
  },

  words: {
    tom: { text: "Tôm", kind: "ai" },
    khoi: { text: "bác sĩ Khôi", kind: "ai" },
    hong: { text: "cô Hồng", kind: "ai" },
    den: { text: "anh Đen", kind: "ai" },
    china: { text: "chị Na", kind: "ai" },

    "15h": { text: "15 giờ chiều qua", kind: "luc" },
    "19h30": { text: "19 giờ 30", kind: "luc" },
    "20h40": { text: "20 giờ 40", kind: "luc" },
    "20h52": { text: "20 giờ 52", kind: "luc" },
    "20h59": { text: "20 giờ 59", kind: "luc" },
    "21h": { text: "9 giờ tối", kind: "luc" },
    "21h34": { text: "21 giờ 34", kind: "luc" },
    "6h31": { text: "6 giờ 31 sáng", kind: "luc" },

    "ong-nuoc": { text: "ống nước sân thượng", kind: "o" },
    "cau-thang": { text: "cầu thang lên sân thượng", kind: "o" },
    "thung-hang": { text: "thùng hàng xe ship", kind: "o" },
    "cua-truoc": { text: "cửa trước shop", kind: "o" },
    "phong-kham": { text: "lồng nhốt phòng khám", kind: "o" },

    "may-tinh-bang": { text: "máy tính bảng của bà nội", kind: "vat" },
    "pate-hoang-gia": { text: "pate Hoàng Gia", kind: "vat" },
    "ao-choang": { text: "áo choàng BMĐ", kind: "vat" },
    "den-quay": { text: "đèn quay", kind: "vat" },
    "dien-thoai-3-cam": { text: "điện thoại ba camera", kind: "vat" },

    "viet-f": { text: "viết \"fải\" thay \"phải\"", kind: "khac" },
    "khong-dau": { text: "viết không dấu", kind: "khac" },
    "ky-tran-trong": { text: "ký \"Trân trọng\"", kind: "khac" },
    "goi-ba": { text: "gọi người nhận là \"bà\"", kind: "khac" },
    "ba-dau-chan": { text: "ba dấu chân 🐾🐾🐾", kind: "khac" },
    "mot-dau-chan": { text: "một dấu chân 🐾", kind: "khac" },
    "mong-tay": { text: "💅😎", kind: "khac" },
    "ngon-cai": { text: "👍", kind: "khac" },

    "cho-bo-nghi": { text: "cho Bơ nghỉ diễn", kind: "vi" },
    "me-meo-cai": { text: "mê mèo cái nhà bên", kind: "vi" },
    "ganh-follow": { text: "ganh tị lượt follow", kind: "vi" },
    "can-tien": { text: "cần tiền gấp", kind: "vi" },
    "fan-bi-mat": { text: "làm fan bí mật", kind: "vi" },
  },

  talks: {
    china: [
      {
        id: "toi-qua",
        topic: "Kể lại tối qua",
        lines: [
          ["china", "Chiều qua 3 giờ tui đưa Bơ đi tái khám. Về là quay liền clip thứ 8, thứ 9, thứ 10. Bơ hơi cáu, cào cái micro.", "nervous"],
          ["china", "7 giờ tui đổ pate. Bảy rưỡi anh Đen giao thùng pate. Rồi tui lên lầu live bán đồ ngủ tới [[20h40|8 giờ 40]].", "neutral"],
          ["china", "Xuống là không thấy Bơ đâu. Cửa trước tui khoá rồi, cửa sổ chốt. Bơ như bốc hơi khỏi cung điện.", "shock"],
          ["teo", "Hoàng thượng bốc hơi. Có khi thăng thiên rồi chị ơi.", "nervous"],
          ["china", "Em nói xui nữa là chị khóc cho em coi.", "angry"],
        ],
        gives: { words: ["china"] },
      },
      {
        id: "tin-chuoc",
        topic: "Cho tôi xem tin nhắn đòi chuộc",
        lines: [
          ["china", "Đây anh. Nick tên \"Băng Mèo Đen\", hình đại diện là con mèo đen đeo kính râm.", "nervous"],
          ["china", "Ba tin liền một lúc tối qua, xong im re. Sáng nay 6 giờ 31 nó nhắn tiếp. Tui đọc mà run.", "shock"],
          ["me", "Chị có trả lời không?", "neutral"],
          ["china", "Tui hỏi \"Bơ có khoẻ không\". Nó không trả lời. Tui hỏi \"Bơ ăn uống gì chưa\". Cũng không.", "nervous"],
          ["teo", "Băng đảng này lạnh lùng ghê. Seen không rep luôn.", "shock"],
        ],
        gives: { clues: ["tin-chuoc"] },
      },
      {
        id: "binh-luan",
        topic: "Ai hay bình luận clip của Bơ?",
        needs: "clue:tin-chuoc",
        lines: [
          ["me", "Tôi cần tin nhắn mẫu của những người quanh Bơ, để so với tin chuộc. Ai bình luận clip của Bơ nhiều nhất?", "neutral"],
          ["china", "Để tui lọc... Đứng đầu là nick \"Tôm Siêu Nhân 2014\". 482 bình luận trong tháng. Thằng Tôm nhà kế bên đó.", "neutral"],
          ["china", "Nó bình luận đều như vắt chanh, sáng sớm với buổi tối. Bà Hồng thì chưa từng bình luận cái nào. Bác sĩ Khôi với anh Đen cũng không.", "neutral"],
          ["teo", "482 cái! Em follow crush hai năm còn chưa bình luận nổi 10 cái.", "shock"],
        ],
        gives: { clues: ["binh-luan-tom"] },
      },
      {
        id: "anh-giao",
        topic: "Ảnh giao hàng tối qua",
        needs: "stmt:den-khong-dung-meo",
        lines: [
          ["me", "App giao hàng bắt shipper chụp ảnh xác nhận. Chị mở đơn tối qua cho tôi xem.", "neutral"],
          ["china", "Đây, đơn 7 giờ rưỡi... Ủa. Ủa ủa ủa?", "shock"],
          ["china", "Bơ đang ngồi trong thùng hàng của ảnh! Còn ảnh thì giơ tay chữ V!", "shock"],
          ["teo", "Bằng chứng tươi rói! Ảnh còn tạo dáng!", "shock"],
        ],
        gives: { clues: ["anh-giao-hang"] },
      },
      {
        id: "bo-hay-di",
        topic: "Mấy tối nay Bơ có hay đi đâu không?",
        needs: "clue:chen-day",
        lines: [
          ["china", "Giờ anh hỏi tui mới để ý. Cỡ hai tuần nay, tối nào quay xong Bơ cũng biến đâu mất một hai tiếng.", "nervous"],
          ["china", "Tui tưởng Bơ trốn dưới gầm tủ ngủ. Sáng ra thấy nằm trên ngai, bụng no căng, mặt mãn nguyện như mới đi spa về.", "neutral"],
          ["me", "Và chị không bao giờ thắc mắc?", "neutral"],
          ["china", "Tui bận quay clip mà anh.", "nervous"],
        ],
      },
      {
        id: "lich-quay",
        topic: "Mười clip một ngày?",
        needs: "clue:lich-quay",
        lines: [
          ["china", "Anh nhìn tui kiểu đó là sao? Bơ là ngôi sao. Ngôi sao thì phải làm việc.", "angry"],
          ["china", "Tháng trước tui nghỉ quay ba ngày, tụt hai nghìn follow. Nhãn hàng hỏi thăm liền. Tui sợ lắm.", "nervous"],
          ["me", "Bác sĩ dặn chị giảm đèn quay chưa?", "neutral"],
          ["china", "...Dặn rồi. Ba lần. Tui tính qua Tết mới giảm.", "nervous"],
          ["teo", "Qua Tết là tới Tết năm sau hả chị.", "smug"],
        ],
      },
    ],

    tom: [
      {
        id: "gioi-thieu",
        topic: "Em là ai?",
        lines: [
          ["tom", "Dạ em là Tôm, 12 tuổi, Siêu Nhân Mèo của hẻm 47! Nhà em sát vách nhà chị Na.", "happy"],
          ["tom", "Ngày nào em cũng qua ngó Bơ. Bơ là thần tượng của em. Bơ biết em, Bơ nháy mắt với em hoài.", "happy"],
          ["teo", "Mèo nào chả nháy mắt. Nó buồn ngủ đó em.", "smug"],
          ["tom", "Anh hổng hiểu Bơ đâu.", "angry"],
        ],
        gives: { words: ["tom"] },
      },
      {
        id: "nhan-tin",
        topic: "Em có Zalo, có nhắn tin cho ai không?",
        lines: [
          ["tom", "Dạ hông. Em hổng có điện thoại. Bà nội nói con nít xài điện thoại hư mắt.", "nervous"],
          ["tom", "Em hổng biết Zalo là gì luôn á anh. Zalo là... món ăn hả anh?", "nervous"],
          ["teo", "Sếp, nó giả nai mà nai không chịu nổi.", "smug"],
        ],
        gives: { stmts: ["tom-khong-dien-thoai"] },
      },
      {
        id: "muop",
        topic: "Nhà em nuôi mèo hả?",
        lines: [
          ["tom", "Dạ có! Mướp! Mèo mướp, 2 tuổi, đẹp nhất hẻm sau Bơ.", "happy"],
          ["tom", "Mướp ở trên sân thượng nhà em. Anh lên coi cũng được, mà đừng đụng chuồng nha. Mướp nhát lắm.", "nervous"],
          ["me", "Mướp ở sân thượng. Sân thượng sát vách nhà chị Na.", "neutral"],
          ["tom", "Dạ... sát vách thì sao anh?", "nervous"],
        ],
      },
      {
        id: "chuong",
        topic: "Trong cái chuồng có gì?",
        needs: "seen:rooftop2.chuong-meo-tu-che",
        lines: [
          ["tom", "Có Mướp thôi! Chỉ có mình Mướp! Mướp ở một mình, Mướp cô đơn lắm!", "nervous"],
          ["me", "Vậy tiếng meo trầm trầm lúc nãy?", "neutral"],
          ["tom", "Mướp... Mướp bị khàn tiếng. Mướp hát karaoke hôm qua.", "nervous"],
          ["teo", "Cả hẻm đi karaoke mà không rủ mình.", "neutral"],
        ],
        gives: { stmts: ["tom-chi-co-muop"] },
      },
      {
        id: "lon-pate",
        topic: "Ba lon pate Hoàng Gia",
        needs: "clue:lon-pate",
        lines: [
          ["tom", "Em mua cho Mướp. Bằng tiền heo đất của em. Đếm xu muốn gãy tay.", "nervous"],
          ["me", "Bình thường Mướp ăn gì?", "neutral"],
          ["tom", "Dạ... cơm trộn cá. Mà Mướp cũng muốn ăn sang một bữa chớ bộ. Ba bữa.", "nervous"],
          ["tom", "Thứ Tư, thứ Năm, thứ Sáu. Mướp thèm.", "nervous"],
        ],
      },
      {
        id: "quay-clip",
        topic: "Em nghĩ sao về chuyện Bơ quay clip?",
        needs: "clue:lich-quay",
        lines: [
          ["tom", "Bơ giỏi lắm. Mà... anh có biết mèo phải ngủ 16 tiếng một ngày hông?", "neutral"],
          ["tom", "Bơ quay từ 7 giờ sáng tới 10 giờ tối. Vậy Bơ ngủ lúc nào? Bơ ngủ trong lúc quay hả?", "angry"],
          ["tom", "Clip hôm qua Bơ ngáp 14 cái. Em đếm. Chị Na cắt hết, chỉ để cảnh Bơ cười.", "angry"],
          ["teo", "Mèo cười được hả em?", "neutral"],
          ["tom", "Được. Khi được ngủ.", "nervous"],
        ],
      },
    ],

    khoi: [
      {
        id: "gioi-thieu",
        topic: "Anh khám cho Bơ lâu chưa?",
        lines: [
          ["khoi", "Từ lúc Bơ ba tháng tuổi. Giờ Bơ ba tuổi, 300 nghìn người theo dõi, và vẫn ghét tôi như ngày đầu.", "neutral"],
          ["khoi", "Tôi đã nhiều lần khuyên chị Na: mèo không phải người mẫu. Mèo cần ngủ.", "neutral"],
          ["teo", "Bác sĩ nói chuyện như đọc toa thuốc. Em nghe xong muốn đi ngủ liền.", "smug"],
        ],
        gives: { words: ["khoi"] },
      },
      {
        id: "chieu-qua",
        topic: "Lông xám trong lồng nhốt",
        needs: "seen:vetclinic.long-nhot",
        lines: [
          ["khoi", "Không. Cả tuần nay Bơ không tới phòng khám.", "neutral"],
          ["khoi", "Và cái lồng anh vừa soi, cả tuần nay không nhốt con mèo nào. Lông đó là... lông cũ.", "nervous"],
          ["teo", "Lông cũ mà còn mềm mượt, bác sĩ xài dầu xả gì cho lông vậy?", "smug"],
        ],
        gives: { stmts: ["khoi-khong-gap"] },
      },
      {
        id: "nhan-tin",
        topic: "Anh có nhắn tin cho chị Na không?",
        lines: [
          ["khoi", "Có. Tối qua đọc bài của bà Tư, tôi nhắn hỏi thăm. Anh cứ xem.", "neutral"],
          ["khoi", "Tôi viết tin nhắn như viết đơn thuốc. Đủ dấu chấm. Đủ dấu phẩy. Thiếu dấu là sai liều.", "neutral"],
        ],
        gives: { clues: ["tin-khoi"] },
      },
      {
        id: "an-than",
        topic: "Hộp thuốc an thần biến mất",
        needs: "seen:vetclinic.tu-thuoc",
        lines: [
          ["khoi", "Hộp đó... không phải thuốc của mèo.", "nervous"],
          ["khoi", "Là trà hoa cúc. Của tôi. Tôi dán nhãn \"AN THẦN\" để nhân viên khỏi pha uống.", "nervous"],
          ["khoi", "Sáng nay hết nên tôi bỏ vỏ hộp rồi. Mua lại thì phải chiều.", "neutral"],
          ["teo", "Bác sĩ uống trà an thần trước ca khám. Ca nào mà căng dữ vậy ta.", "smug"],
        ],
      },
      {
        id: "suc-khoe",
        topic: "Sức khoẻ của Bơ",
        needs: "broke:khoi-khong-gap",
        lines: [
          ["khoi", "Bơ không bệnh. Bơ mệt. Rụng lông vì stress, thâm mắt vì ngủ ít. Tôi dặn chị Na ba lần rồi.", "neutral"],
          ["khoi", "Mà Bơ là mèo đực ba tuổi, chưa triệt sản. Tuổi này mèo đực hay đi xa, nhất là khi gần nhà có mèo cái.", "neutral"],
          ["khoi", "Mèo Anh lông ngắn nhìn lười vậy chứ leo trèo giỏi lắm. Muốn đi đâu là đi tới.", "neutral"],
        ],
      },
      {
        id: "muop",
        topic: "Mướp nhà bé Tôm",
        needs: "clue:so-kham",
        lines: [
          ["khoi", "Bé Tôm ôm Mướp tới, đổ cả heo đất ra bàn đếm xu. Bé hỏi Mướp có bị tương tư không.", "neutral"],
          ["khoi", "Tôi nói Mướp khoẻ. Mùa này mèo cái hay ngồi đợi, có anh mèo nào qua thăm là chuyện thường.", "neutral"],
          ["khoi", "Bé hỏi tiếp: \"Nếu anh mèo đó là mèo nổi tiếng thì sao ạ?\". Tôi tưởng bé đọc truyện tranh.", "neutral"],
          ["teo", "Mèo nổi tiếng yêu mèo hẻm. Phim truyền hình tám giờ tối là đây.", "happy"],
        ],
      },
    ],

    hong: [
      {
        id: "gioi-thieu",
        topic: "Chị là ai?",
        lines: [
          ["hong", "Hồng. Hồng Hot Shop. Đồ thú cưng cao cấp, hàng tuyển, không bán đại trà như ai kia.", "smug"],
          ["hong", "Mèo của tui là Công Chúa Miu, Ba Tư trắng thuần chủng. 30 nghìn follow, toàn follow chất lượng.", "smug"],
          ["teo", "30 nghìn so với 300 nghìn. Thiếu một con số không thôi mà chị.", "smug"],
          ["hong", "Em đếm follow hay đếm tiền vậy?", "angry"],
        ],
        gives: { words: ["hong"] },
      },
      {
        id: "ve-bo",
        topic: "Chị nghĩ sao về Bơ?",
        lines: [
          ["hong", "Nghĩ gì? Tui không thèm nghĩ. Tui chưa từng coi clip con mèo đó.", "smug"],
          ["hong", "Mèo mập, mặt tròn, suốt ngày ngồi như cục bột. Có gì đâu mà coi.", "smug"],
          ["teo", "Chưa từng coi mà tả kỹ ghê.", "smug"],
        ],
        gives: { stmts: ["hong-khong-quan-tam"] },
      },
      {
        id: "binh-luan",
        topic: "Bình luận \"coi chừng mất mèo\"",
        lines: [
          ["hong", "Tui nói vậy là có ý tốt. Mèo nổi quá thì người ta để ý. Tui cũng dặn mình y vậy.", "neutral"],
          ["hong", "Sao? Tui viết bình luận là tui bắt cóc hả? Vậy bà Tư đăng bài là bà Tư bắt hả?", "angry"],
          ["teo", "Hay chị [[ganh-follow|ganh tị lượt follow]]? Ánh mắt sau kính râm của chị nói lên tất cả.", "smug"],
          ["hong", "Kính râm che ánh mắt mà em. Đó là lý do người ta đeo.", "angry"],
        ],
      },
      {
        id: "toi-qua",
        topic: "Tối qua chị ở đâu?",
        lines: [
          ["hong", "Live bán hàng từ 8 giờ tới 10 giờ, trong shop, trước mặt hai nghìn người. Muốn coi lại thì vô kênh tui.", "neutral"],
          ["hong", "Tay tui cầm hàng, miệng tui chốt đơn. Tay đâu mà bắt mèo, tay đâu mà nhắn tin đòi chuộc.", "smug"],
        ],
      },
      {
        id: "team-bo",
        topic: "Hai cái áo TEAM BƠ",
        needs: "broke:hong-khong-quan-tam",
        lines: [
          ["hong", "Thì... Công Chúa Miu thích. Không phải tui.", "nervous"],
          ["hong", "Thôi được. Tui coi hết clip của Bơ. Coi lúc 11 giờ đêm, sau khi live xong, coi tới ngủ quên.", "nervous"],
          ["hong", "Tui có nick phụ tên \"Mèo Mập Là Chân Ái\" để thả tim. Không bình luận, sợ lộ.", "nervous"],
          ["teo", "Đối thủ ban ngày, [[fan-bi-mat|fan bí mật]] ban đêm. Chị sống hai mặt ghê.", "shock"],
          ["hong", "Mà Bơ mất thiệt tui cũng lo. Không có Bơ, tui đâu có ai để ganh.", "nervous"],
        ],
      },
    ],

    anhship: [
      {
        id: "toi-qua",
        topic: "Tối qua anh giao gì cho chị Na?",
        lines: [
          ["anhship", "Thùng pate. 7 giờ rưỡi. Bỏ trước cửa, chụp hình, đi.", "neutral"],
          ["anhship", "Con mèo đó tui không đụng. Tui ghét mèo. Mèo nhìn tui như nhìn đơn hoàn hàng.", "angry"],
          ["teo", "Anh nói ngắn gọn ghê. Như tin nhắn \"đã giao\".", "neutral"],
        ],
        gives: { stmts: ["den-khong-dung-meo"], words: ["den"] },
      },
      {
        id: "nhan-tin",
        topic: "Anh có nhắn tin cho chị Na không?",
        lines: [
          ["anhship", "Có. Nhắn ra lấy hàng. Rồi tối nhắn hỏi thăm. Coi đi.", "neutral"],
          ["anhship", "Tui chạy xe, gõ một tay. Dấu má gì, đọc hiểu là được.", "neutral"],
        ],
        gives: { clues: ["tin-den"] },
      },
      {
        id: "thung-hang",
        topic: "Cho tôi xem thùng hàng sau xe",
        needs: "clue:tin-chuoc",
        lines: [
          ["anhship", "Coi thì coi. Hàng của khách, cấm lục.", "angry"],
          ["narr", "Anh Đen mở nắp thùng. Bên trong lót một tấm khăn, phủ kín một lớp lông xám dày cộm. Góc thùng có cái gối nhỏ in vương miện."],
          ["teo", "LÔNG XÁM! Sếp ơi, thùng này chở hoàng thượng! Anh Đen chính là Băng Mèo Đen! Đen! Mèo Đen!", "shock"],
          ["anhship", "Tui tên Đen từ hồi cha sanh mẹ đẻ. Không phải tên băng đảng.", "angry"],
          ["teo", "Anh còn [[can-tien|cần tiền gấp]] không? Shipper cuối năm ai cũng cần tiền!", "smug"],
          ["anhship", "Ai mà không cần tiền. Nhưng cần tiền thì tui chạy thêm cuốc, không đi bắt mèo.", "angry"],
        ],
        gives: { clues: ["long-thung-hang"] },
      },
      {
        id: "bo-chay",
        topic: "Lúc anh bế Bơ ra, Bơ chạy đi đâu?",
        needs: "broke:den-khong-dung-meo",
        lines: [
          ["anhship", "7 giờ rưỡi tui chụp hình xong, 7 giờ 32 bế nó ra đặt xuống. Nó không ra đường đâu.", "neutral"],
          ["anhship", "Nó chạy tót vô nhà, lên thẳng [[cau-thang|cầu thang lên sân thượng]]. Đi lẹ như có hẹn.", "neutral"],
          ["anhship", "Tối nào cũng vậy. Tui còn tưởng nó lên trển hóng gió.", "neutral"],
          ["me", "Lên lầu, không ra cửa. Lúc 7 giờ 30, Bơ vẫn còn ở shop.", "neutral"],
        ],
      },
    ],
  },

  stmts: {
    "tom-khong-dien-thoai": {
      by: "tom",
      text: "Em hổng có điện thoại, hổng biết Zalo, hổng nhắn tin cho ai bao giờ.",
      break: {
        clue: "binh-luan-tom",
        also: ["noi-quy"],
        lines: [
          ["me", "\"Tôm Siêu Nhân 2014\". 482 bình luận dưới clip của Bơ. Không có điện thoại thì em gõ bằng gì?", "neutral"],
          ["tom", "...Dạ, máy tính bảng của nội. Nội cho mượn, sáng lấy, tối nộp.", "nervous"],
          ["tom", "Máy tính bảng đâu phải điện thoại! Em đâu có nói dối! Em chỉ... nói thiếu.", "angry"],
          ["teo", "Nói thiếu là nói dối bản tiết kiệm đó em.", "smug"],
        ],
        gives: { words: ["may-tinh-bang"], flags: ["tom-co-may"] },
      },
    },
    "tom-chi-co-muop": {
      by: "tom",
      text: "Trong chuồng chỉ có Mướp. Mướp ở một mình.",
      break: {
        clue: "dau-chan-to",
        lines: [
          ["me", "Bồn cát có hai cỡ dấu chân. Dấu to lún sâu, của một con mèo nặng gần gấp đôi. Mướp 2,8 kg. Một mình Mướp không để lại hai cỡ chân.", "neutral"],
          ["tom", "Thì... thì có con mèo lạ hay qua chơi với Mướp. Mèo hoang. Em hổng biết mèo ai hết.", "nervous"],
          ["narr", "Trong chuồng: \"mèooo\". Trầm, khàn, rất không hoang."],
          ["teo", "Mèo hoang gì mà kêu như đọc chiếu chỉ vậy em.", "smug"],
        ],
        gives: { flags: ["co-meo-thu-hai"] },
      },
    },
    "hong-khong-quan-tam": {
      by: "hong",
      text: "Tui chưa từng coi clip con mèo đó. Không thèm quan tâm.",
      break: {
        clue: "don-hang-hong",
        lines: [
          ["me", "Đơn hàng ở shop chị Na: người nhận H. Hồng, số máy Hồng Hot Shop. Hai áo \"TEAM BƠ\" size S, một móc khoá Bơ. Ghi chú \"gói kín, đừng ghi tên shop\".", "neutral"],
          ["hong", "...Trời ơi. Tui dặn gói kín rồi mà!", "shock"],
          ["hong", "Đừng nói với ai nha. Nói ra tui mất hết uy tín đối thủ.", "nervous"],
          ["teo", "Uy tín đối thủ là cái gì vậy chị?", "neutral"],
          ["hong", "Là cái tui xây ba năm, em vừa đạp sập trong ba giây đó.", "angry"],
        ],
        gives: { flags: ["hong-fan-ngam"] },
      },
    },
    "khoi-khong-gap": {
      by: "khoi",
      text: "Cả tuần nay tôi không gặp Bơ. Cái lồng đó không nhốt con mèo nào.",
      break: {
        clue: "so-kham",
        lines: [
          ["me", "Sổ khám của anh: chiều qua 15 giờ, Bơ tái khám. \"Dụ bé vào lồng bằng pate, khám qua song lồng\". Chữ anh viết.", "neutral"],
          ["khoi", "...", "shock"],
          ["khoi", "Được rồi. Tôi sợ mèo.", "nervous"],
          ["khoi", "Hồi lớp ba bị mèo nhà nội cào. Tôi học thú y để vượt qua nỗi sợ. Mười năm rồi, chưa vượt qua.", "nervous"],
          ["khoi", "Chó, heo, thỏ, rùa, tôi khám hết. Mèo thì tôi dụ vô lồng, đeo găng, khám qua song sắt. Tôi giấu vì sợ mất khách.", "nervous"],
          ["teo", "Bác sĩ thú y sợ mèo. Giống thợ lặn sợ nước. Em thương bác sĩ.", "neutral"],
        ],
        gives: { words: ["15h"], flags: ["khoi-so-meo"] },
      },
    },
    "den-khong-dung-meo": {
      by: "anhship",
      text: "Tui bỏ hàng trước cửa rồi đi liền. Tui ghét mèo, không đụng tới con mèo đó.",
      break: {
        clue: "anh-giao-hang",
        lines: [
          ["me", "Ảnh xác nhận giao hàng, 19 giờ 30. Bơ ngồi trong thùng hàng của anh. Anh giơ tay chữ V.", "neutral"],
          ["anhship", "...", "shock"],
          ["anhship", "Thì nó tự nhảy vô! Bữa nào tui ghé nó cũng nhảy vô thùng ngồi. Thùng tui có khăn êm.", "nervous"],
          ["anhship", "Con gái tui sáu tuổi, mê Bơ lắm. Bữa nào tui cũng chụp một tấm gửi về. Cái gối vương miện là con bé may cho Bơ.", "nervous"],
          ["anhship", "Shipper mà cưng mèo thì mất uy. Nên tui nói tui ghét.", "nervous"],
          ["teo", "Ảnh cộc lốc bên ngoài, mềm như pate bên trong.", "happy"],
        ],
        gives: { words: ["19h30"], flags: ["den-thuong-meo"] },
      },
    },
  },

  present: {
    tom: {
      "tin-chuoc": [
        ["tom", "\"Băng Mèo Đen\"... nghe ngầu ghê ha anh.", "nervous"],
        ["tom", "Ý em là nghe ghê. Ghê quá. Tụi xấu xa.", "nervous"],
        ["teo", "Sao em đọc tin chuộc mà mắt sáng rỡ vậy?", "smug"],
      ],
      "lich-quay": [
        ["tom", "Mười clip. Một ngày. Không có ngày nghỉ.", "angry"],
        ["tom", "Em đi học còn được nghỉ Chủ Nhật mà anh.", "angry"],
      ],
      "so-ban-le": [
        ["tom", "174 đồng xu. Heo đất của em nuôi từ hồi lớp 4. Giờ nó rỗng ruột rồi.", "nervous"],
        ["tom", "Mà xứng đáng. À không, ý em là, Mướp xứng đáng.", "nervous"],
      ],
      "long-thung-hang": [
        ["tom", "Thùng anh Đen hả? Bơ thích ngồi trong đó lắm. Cái gối vương miện là của Bơ.", "happy"],
        ["me", "Sao em biết?", "neutral"],
        ["tom", "Thì... em hay ngó qua mà.", "nervous"],
      ],
    },
    khoi: {
      "long-xam-long": [
        ["khoi", "Lông đó... rụng nhiều thật. Rụng vì stress. Tôi đã nói với chị Na rồi.", "nervous"],
        ["teo", "Bác sĩ chưa trả lời câu hỏi mà đã trả lời câu khác.", "smug"],
      ],
      "lich-quay": [
        ["khoi", "Mười clip một ngày, mười lăm tiếng dưới đèn. Tôi khuyên ba lần, chị Na gật ba lần, rồi quay tiếp.", "angry"],
        ["khoi", "Nếu tôi là Bơ, tôi cũng bỏ nhà đi.", "neutral"],
      ],
      "tin-chuoc": [
        ["khoi", "\"Fải\". \"Ko\". Người viết hoặc còn nhỏ, hoặc gõ vội. Kẻ bắt cóc thật thì ít ai ký tên bằng dấu chân.", "neutral"],
        ["khoi", "Và người lớn ai lại dừng nhắn đúng 9 giờ tối.", "neutral"],
      ],
    },
    hong: {
      "binh-luan-tom": [
        ["hong", "482 bình luận. Thằng nhỏ này chung thuỷ hơn mấy khách sỉ của tui.", "neutral"],
      ],
      "lich-quay": [
        ["hong", "Mười clip một ngày? Tui cho Miu quay ba clip một tuần mà Miu còn giận tui.", "shock"],
        ["hong", "Thôi, bà Na này hết thuốc chữa.", "smug"],
      ],
      "tin-chuoc": [
        ["hong", "\"Fải\"? \"Ko\"? Tui bán hàng online mười năm, gõ sai chính tả là mất khách. Tui viết như vậy chắc tui đóng shop.", "angry"],
      ],
    },
    anhship: {
      "tin-chuoc": [
        ["anhship", "Có dấu đầy đủ. Không phải tui. Tui gõ có dấu là xe tông cột điện.", "neutral"],
      ],
      "chen-day": [
        ["anhship", "Con mèo đó tối đâu có ăn ở nhà. Tối tui đi ngang, thấy nó trên mái tôn đi qua bển hoài.", "neutral"],
        ["me", "Qua bển là qua đâu?", "neutral"],
        ["anhship", "Thì phía nhà bà Sáu. Tui chạy xe, tui đâu có rảnh mà ngó kỹ.", "neutral"],
      ],
      "so-ban-le": [
        ["anhship", "Thằng Tôm trả bằng xu hả. Hèn chi tuần trước thấy nó ôm heo đất chạy ngang, mặt quyết tâm như đi thi.", "neutral"],
      ],
    },
    china: {
      "binh-luan-tom": [
        ["china", "Thằng Tôm bình luận dữ vậy mà tui không để ý. Tui chỉ đếm số, không đọc chữ.", "nervous"],
      ],
      "chuong-to": [
        ["china", "Cấm quay clip? Cái chuồng mèo mà dán bảng cấm quay clip? Nhắm vô ai đây?", "angry"],
        ["teo", "Dạ chắc nhắm vô chị đó chị.", "nervous"],
      ],
    },
  },

  wrong: {
    tom: [
      [["tom", "Anh đưa cái này em hổng hiểu. Em mới lớp 6 mà anh.", "nervous"]],
      [["tom", "Siêu Nhân Mèo hổng sợ cái này đâu! Anh đưa cái khác đi!", "angry"]],
      [["tom", "Cái này đâu có liên quan. Anh làm thám tử bao lâu rồi anh?", "smug"], ["teo", "Bị con nít hỏi xoáy rồi sếp.", "nervous"]],
      [["tom", "(nhìn lên trời huýt sáo) ...Em hổng biết gì hết trơn.", "nervous"]],
    ],
    khoi: [
      [["khoi", "Chẩn đoán sai rồi anh. Triệu chứng không khớp bệnh.", "neutral"]],
      [["khoi", "Cái này không chứng minh được gì. Giống như đo nhiệt độ bằng tay, cảm tính lắm.", "neutral"]],
      [["khoi", "Anh để tôi uống miếng trà hoa cúc... à, hết rồi.", "nervous"]],
    ],
    hong: [
      [["hong", "Em đưa cái gì vậy? Hàng lỗi thì tui không nhận, hoàn hàng đi.", "angry"]],
      [["hong", "Sai. Tui chốt đơn mười năm, tui nhìn là biết khách bom hàng.", "smug"]],
      [["hong", "Thám tử gì mà đưa chứng cứ như livestream xả kho, cái gì cũng đưa ra.", "angry"], ["teo", "Sếp bị cà khịa rồi.", "nervous"]],
    ],
    anhship: [
      [["anhship", "Không liên quan. Tui còn mười hai đơn chưa giao.", "angry"]],
      [["anhship", "Sai địa chỉ rồi anh. Hoàn đơn.", "neutral"]],
      [["anhship", "Anh hỏi kiểu này tui bị trễ đơn, khách đánh giá một sao, anh đền hông?", "angry"]],
    ],
    china: [
      [["china", "Anh ơi cái này liên quan gì tới Bơ? Anh tập trung giùm tui!", "angry"]],
      [["china", "Tui trả tiền thám tử chứ đâu phải trả tiền đoán bậy. Đoán bậy thì có Tèo rồi.", "angry"], ["teo", "Ủa sao kéo em vô.", "shock"]],
      [["china", "Không đúng. Tui đi quay clip đây, chừng nào anh có gì thì gọi.", "neutral"]],
    ],
  },

  deduction: [
    {
      id: "tin-nhan",
      text: "Tin chuộc có ba dấu vết riêng: {a}, ký {b}, và đứt ngang lúc {c}.",
      blanks: {
        a: { answer: "viet-f", kind: "khac" },
        b: { answer: "ba-dau-chan", kind: "khac" },
        c: { answer: "20h59", kind: "luc" },
      },
      explain: [
        ["me", "Cô Hồng chính tả chuẩn, ký 💅😎, gọi \"bà\". Anh Đen viết \"ko\" nhưng không dấu, ký 👍. Bác sĩ Khôi ký một dấu chân, nhắn sau 9 giờ tối.", "neutral"],
        ["me", "Chỉ một người viết \"fải\", ký ba dấu chân, và chưa từng gõ chữ nào từ 9 giờ tối tới 6 giờ rưỡi sáng.", "neutral"],
        ["teo", "So tin nhắn như so vân tay. Sếp ơi em muốn đi học ngành này.", "happy"],
      ],
    },
    {
      id: "noi-doi",
      text: "{a} nói dối là không có máy để nhắn tin. Thật ra tin chuộc gửi từ {b}.",
      blanks: {
        a: { answer: "tom", kind: "ai" },
        b: { answer: "may-tinh-bang", kind: "vat" },
      },
      explain: [
        ["me", "20 giờ 59 câu dọa đứt ngang. 21 giờ bà nội thu máy. 6 giờ 30 trả máy, 6 giờ 31 câu dọa nói tiếp.", "neutral"],
        ["me", "Băng đảng chuyên nghiệp gì mà có giờ giới nghiêm.", "neutral"],
      ],
    },
    {
      id: "cu-lat",
      text: "Lần cuối thấy Bơ ở shop là {a}, Bơ chạy lên sân thượng. Không ai bắt Bơ: Bơ tự leo qua {b} sang nhà Tôm, vì {c}.",
      blanks: {
        a: { answer: "19h30", kind: "luc" },
        b: { answer: "ong-nuoc", kind: "o" },
        c: { answer: "me-meo-cai", kind: "vi" },
      },
      explain: [
        ["me", "Vết cào trên ống nước có từ hai tuần trước. Chén ăn tối bỏ dở, ba lon pate ghi T4, T5, T6. Bơ qua bển mỗi đêm từ lâu rồi.", "neutral"],
        ["me", "Hoàng thượng không bị bắt cóc. Hoàng thượng đi tìm Mướp.", "neutral"],
        ["teo", "Bỏ ngai vàng vì thôn nữ. Chuyện tình này phải dựng phim.", "happy"],
      ],
    },
    {
      id: "dong-co",
      text: "Người giấu Bơ và viết tin chuộc là {a}. Động cơ: {b}.",
      blanks: {
        a: { answer: "tom", kind: "ai" },
        b: { answer: "cho-bo-nghi", kind: "vi" },
      },
      explain: [
        ["me", "Đòi 5 triệu, đúng giá một clip quảng cáo. Trách chị Na bắt quay quá trời. Chuồng dán \"cấm quay clip\".", "neutral"],
        ["me", "Tôm không cần tiền. Tôm muốn Bơ được ngủ.", "neutral"],
      ],
    },
  ],

  finale: {
    culprit: "tom",
    intro: [
      ["narr", "Mười giờ sáng. Sân thượng nhà bà Sáu chật cứng: chị Na, bác sĩ Khôi, cô Hồng, anh Đen, và bà Tư đứng trên ghế nhựa giơ điện thoại."],
      ["batu", "Bà con ơi, thám tử sắp mở màn rồi! Hoàng thượng ở đâu, lát nữa biết liền!", "happy"],
      ["chuba", "Chú tới rồi! Chú đã soi gầm xe 47 nhà! Không thấy mèo, thấy 3 con chuột với 1 chiếc dép!", "neutral"],
      ["me", "Không cần soi gầm xe nữa, chú Ba. Băng Mèo Đen đang đứng trước cái chuồng kia.", "neutral"],
      ["tom", "(dang tay chắn chuồng) Em... em hổng biết anh nói gì!", "nervous"],
      ["teo", "Sếp ơi, em đoán sai cô Hồng, sai anh Đen, sai bác sĩ. Em hết người để đoán rồi.", "nervous"],
    ],
    steps: [
      {
        claim: [
          ["tom", "Em là con nít! Con nít đâu biết nhắn tin đòi tiền! Người lớn làm đó!", "angry"],
          ["tom", "Băng đảng chuyên nghiệp mà anh. Tin nhắn ghi vậy mà.", "nervous"],
        ],
        answer: "binh-luan-tom",
        hint: "Sếp ơi, tin chuộc viết \"fải\", \"ko\", ký ba dấu chân. Có ai viết y chang vậy dưới clip của Bơ không ta?",
        right: [
          ["me", "482 bình luận của \"Tôm Siêu Nhân 2014\". \"Bơ fải ngủ chứ 🐾🐾🐾\". \"Bơ ko mệt hả 🐾🐾🐾\".", "neutral"],
          ["me", "Tin chuộc: \"Tụi tui fải ra tay 🐾🐾🐾\". \"Bơ ko fải cái máy quay clip 🐾🐾🐾\". Cùng một bàn tay gõ.", "neutral"],
          ["tom", "...", "shock"],
        ],
        wrong: [["tom", "Cái đó đâu có giống gì đâu anh!", "angry"], ["teo", "Sếp ơi, so chữ viết đi sếp. Chữ!", "nervous"]],
      },
      {
        claim: [
          ["tom", "Ai mà chẳng viết \"ko\"! Anh Đen cũng viết \"ko\"! Bác sĩ Khôi cũng ký dấu chân!", "angry"],
          ["anhship", "Ê, tui viết không dấu nha!", "angry"],
          ["tom", "Mà tin đó gửi gần 9 giờ tối, giờ đó em đi ngủ rồi!", "nervous"],
        ],
        answer: "noi-quy",
        hint: "Tin chuộc đứt ngang lúc 20:59, rồi 6:31 mới nói tiếp. Nhà ai có giờ giới nghiêm y chang vậy?",
        right: [
          ["me", "Tin chuộc đứt ngang lúc 20 giờ 59, giữa câu \"Nếu chị ko nghe lời thì\". Sáng nay 6 giờ 31 mới nói tiếp.", "neutral"],
          ["me", "Nội quy của bà nội: 6 giờ 30 lấy máy tính bảng, 9 giờ tối nộp, trễ một phút mất một ngày.", "neutral"],
          ["me", "Em không đi ngủ. Em nộp máy. Câu dọa bỏ dở vì Siêu Nhân Mèo sợ mất một ngày máy tính bảng.", "neutral"],
          ["teo", "Băng đảng khét tiếng nhất hẻm, bị bà nội giới nghiêm!", "shock"],
        ],
        wrong: [["tom", "Hì. Anh đoán hổng ra đâu.", "smug"], ["khoi", "Anh để ý giờ gửi tin xem.", "neutral"]],
      },
      {
        claim: [
          ["tom", "Thì em nhắn đó! Nhắn chọc chị Na chơi thôi! Mà Bơ đâu có ở nhà em!", "angry"],
          ["tom", "Trong chuồng chỉ có Mướp! Mướp khàn tiếng!", "nervous"],
        ],
        answer: "dau-chan-to",
        hint: "Mướp 2,8 kg, Bơ 5,2 kg. Bồn cát cạnh chuồng có mấy cỡ dấu chân?",
        right: [
          ["me", "Bồn cát cạnh chuồng: hai cỡ dấu chân. Một cỡ lún sâu, rộng gấp rưỡi. Của một con mèo 5,2 kg.", "neutral"],
          ["khoi", "Mướp 2,8 kg. Tôi cân bằng tay của tôi... qua song lồng.", "neutral"],
          ["narr", "Trong chuồng: \"mèooo\". Chị Na đứng sững lại."],
          ["china", "Giọng đó... Bơ! Là giọng Bơ đòi ăn!", "shock"],
        ],
        wrong: [["tom", "Đó! Hổng có gì hết!", "smug"], ["china", "Anh ơi, Bơ nặng 5 ký 2, anh nhớ giùm tui!", "nervous"]],
      },
      {
        claim: [
          ["tom", "Ờ thì Bơ ở đây! Nhưng em chỉ cho Bơ ở nhờ! Bơ tự qua mà!", "angry"],
          ["tom", "Còn tin đòi tiền là của băng đảng khác! Băng Mèo Đen là ai em hổng biết!", "nervous"],
        ],
        answer: "ao-choang-bmd",
        hint: "Trên dây phơi có cái áo choàng sơn ba chữ gì đó. Ba chữ cái đầu của nick đòi chuộc là gì ta?",
        right: [
          ["me", "Áo choàng đen trên dây phơi, sơn trắng còn mới: B, M, Đ. Mặt nạ đầu mèo đen kẹp bên cạnh.", "neutral"],
          ["me", "Băng. Mèo. Đen. Em may đồng phục cho băng đảng một người của em.", "neutral"],
          ["teo", "Không phải Bánh Mì Đặc biệt hả sếp? Em đoán sai luôn cả cái áo.", "shock"],
          ["tom", "...", "nervous"],
          ["narr", "Tôm buông hai tay xuống. Cái mặt nạ bìa cứng trên dây phơi lắc lư trong gió."],
        ],
        wrong: [["tom", "Đó, anh hết bằng chứng rồi!", "smug"], ["hong", "Thám tử ơi, đưa cái gì có chữ ấy!", "neutral"]],
      },
    ],
    confess: [
      ["tom", "Dạ... là em. Em là Băng Mèo Đen. Băng có một mình em.", "nervous"],
      ["tom", "Mà em hổng có bắt Bơ! Hai tuần nay tối nào Bơ cũng tự leo ống nước qua đây. Bơ qua thăm Mướp.", "nervous"],
      ["tom", "Bơ nằm sát Mướp, ngủ một giấc ngon lành tới khuya, rồi mới leo về. Em thấy Bơ ngủ ngon, nên em mua pate cho Bơ ăn.", "neutral"],
      ["china", "Hèn chi tối nào Bơ cũng bỏ bữa...", "shock"],
      ["tom", "Tối qua Bơ qua, lông rụng quá trời, mắt thâm sì. Em đếm clip hôm qua, Bơ ngáp 14 cái. Em thương Bơ quá.", "nervous"],
      ["tom", "Em làm cái chuồng, giữ Bơ lại. Mà sợ chị Na qua tìm rồi đem Bơ về quay tiếp, nên em nhắn tin đòi chuộc cho chị sợ.", "nervous"],
      ["tom", "Em đòi 5 triệu vì đó là tiền một clip. Em muốn chị biết Bơ đáng giá hơn một clip. Em hổng có lấy tiền đâu.", "angry"],
      ["tom", "Đang nhắn câu dọa thì tới 9 giờ, nội thu máy. Em năn nỉ nội cho gõ nốt một chữ, nội nói \"trễ một phút mất một ngày\".", "nervous"],
      ["teo", "Băng đảng bị giới nghiêm giữa câu dọa. Lịch sử tội phạm thế giới chưa từng có.", "shock"],
      ["tom", "Em xin lỗi chị Na. Nhắn tin dọa vậy là sai. Chị khóc, em thấy hết. Em sai thiệt.", "nervous"],
    ],
    epilogue: [
      ["narr", "Chăn được kéo ra. Trong chuồng, một con mèo xám mập nằm ngửa bụng ngủ khò, bên cạnh là một cô mèo mướp nhỏ xíu đang liếm lông cho nó."],
      ["china", "Bơ ơi! ...Ủa, Bơ ngủ ngáy kìa. Hai năm nay tui chưa từng nghe Bơ ngáy.", "shock"],
      ["khoi", "Vì hai năm nay chị chưa từng để Bơ ngủ đủ.", "neutral"],
      ["china", "...", "nervous"],
      ["china", "Từ tuần sau, lịch quay của Bơ: ba clip một tuần. Chủ Nhật nghỉ. Không đèn sau 6 giờ tối.", "nervous"],
      ["china", "Và mỗi tối Bơ được qua thăm Mướp. Tui đi sửa ô thông gió cho đàng hoàng, gắn thêm cái cầu thang mèo.", "neutral"],
      ["basau", "(cầm chổi lông gà) Còn ông Băng Mèo Đen này, nhắn tin dọa người ta khóc. Một tháng nộp máy lúc 8 giờ tối.", "angry"],
      ["tom", "Dạ... nội ơi 8 giờ rưỡi được hông nội?", "nervous"],
      ["basau", "Trễ một phút mất một ngày.", "angry"],
      ["china", "Mà Tôm nè. Chị thuê em làm trợ lý chăm Bơ. Trả lương bằng pate. Cho Bơ với Mướp.", "neutral"],
      ["tom", "Thiệt hả chị?! Siêu Nhân Mèo nhận việc!", "happy"],
      ["hong", "Thôi tui về. Mà... bà Na, cái đơn áo TEAM BƠ, giao luôn giùm tui. Gói kín.", "nervous"],
      ["anhship", "Để tui giao. Miễn phí. Cho tui chụp một tấm với Bơ gửi con gái.", "neutral"],
      ["khoi", "Tiện đây tôi khám luôn cho Mướp... qua song lồng.", "neutral"],
      ["narr", "Một tuần sau, bác sĩ Khôi gọi điện, giọng run run vì vừa khám xong một con mèo mà không bị cào."],
      ["khoi", "Chị Na. Mướp có bầu. Ba tuần. Hoàng thượng sắp có hoàng tử.", "shock"],
      ["teo", "Sếp ơi! Clip \"Hoàng thượng sắp làm cha\" lên xu hướng rồi! Chị Na đăng một clip duy nhất trong tuần mà hai triệu view!", "happy"],
      ["batu", "Bà Tư đã đăng: \"VỤ BẮT CÓC CÓ GIỜ GIỚI NGHIÊM: hoàng thượng đi tìm tình yêu\". Ba ngàn like rồi!", "happy"],
    ],
    comments: [
      { by: "batu", text: "Kết luận: mèo cũng cần ngủ, người cũng cần ngủ, chỉ có bà Tư là không cần ngủ vì còn hóng 🐾", likes: 3120 },
      { by: "Tiểu Thư Bánh Bèo 2k5", text: "Hoàng thượng bỏ ngai vàng vì thôn nữ mèo mướp... tình yêu không phân biệt giống mèo 😭💕", likes: 2210 },
      { by: "Team Siêu Nhân Mèo", text: "Tôm 12 tuổi mà hiểu mèo hơn người lớn. Nhắn tin dọa là sai, nhưng cái tâm thì đúng 🦸", likes: 1876 },
      { by: "Chị Hai Kế Toán Q3", text: "Thương thì nói thẳng với chị Na, đừng đòi chuộc nha mấy đứa. Người ta khóc thiệt đó", likes: 1043 },
      { by: "Hội Con Sen Sài Gòn", text: "Mèo trưởng thành cần ngủ 12–16 tiếng. Ai quay clip mèo nhớ cho hoàng thượng nghỉ nha các sen 🙏", likes: 2654 },
      { by: "Hùng Xe Ôm", text: "Băng đảng bị bà nội thu máy lúc 9 giờ. Tui cười xỉu ngay giữa cuốc xe", likes: 1588 },
      { by: "Mèo Mập Là Chân Ái", text: "Mừng hoàng thượng bình an 🥹🐾 (nick này không phải của ai bán đồ thú cưng đối diện đâu nha)", likes: 932 },
      { by: "Cô Ba Bán Xôi", text: "Pate 58 ngàn, 3 lon 174 ngàn, trả bằng xu. Thằng nhỏ có tương lai làm kế toán", likes: 711 },
      { by: "Shipper Hẻm Bên", text: "Anh Đen cưng mèo mà giấu. Dân ship tụi tui ai cũng có một con mèo trong tim 📦🐱", likes: 845 },
      { by: "Phòng khám Thú y Khôi", text: "Phòng khám nhận khám mèo như thường. Bác sĩ đang tập bế mèo không găng. Đang tập 🐾", likes: 1290 },
      { by: "Pate Hoàng Gia (Official)", text: "Chúc mừng Bơ và Mướp! Nhãn hàng xin gửi tặng bé hoàng tử sắp chào đời một năm pate miễn phí 👑", likes: 1764 },
      { by: "teo", text: "Em đoán sai 3 người, mà em đoán đúng cái áo là đồ tự may. Tính là trúng một nửa 😤", likes: 503 },
      { by: "Mẹ Bỉm Hẻm 52", text: "Con tui đọc vụ này xong đòi máy tính bảng tới 10 giờ. Tui in nội quy bà Sáu dán cửa luôn rồi", likes: 1120 },
      { by: "chuba", text: "Chú soi 47 gầm xe, thấy 3 con chuột. Mấy con chuột đó giờ ai lo? Thôi chú đi trực tiếp", likes: 678 },
    ],
  },

  hints: [
    {
      needs: ["clue:binh-luan-tom", "clue:noi-quy", "clue:dau-chan-to", "clue:ao-choang-bmd"],
      text: "Sếp ơi đủ đồ rồi! Chữ viết, giờ giới nghiêm, dấu chân, cái áo choàng. Ra bảng suy luận chốt đi sếp, em hứa không đoán bậy.",
    },
    {
      needs: "loc:rooftop2",
      done: ["seen:rooftop2.bon-cat", "seen:rooftop2.day-phoi-do", "seen:rooftop2.ong-nuoc", "seen:rooftop2.noi-quy"],
      text: "Sân thượng nhà Tôm nhiều đồ lạ quá sếp. Bồn cát, dây phơi, ống nước, tờ giấy dán cửa cầu thang. Soi hết đi sếp!",
    },
    {
      needs: "stmt:tom-chi-co-muop",
      done: "broke:tom-chi-co-muop",
      text: "Tôm nói trong chuồng chỉ có Mướp. Mà sổ khám bên phòng khám có ghi cân nặng từng con đó. Mèo nặng thì dấu chân lún sâu, ở bồn cát chắc thấy.",
    },
    {
      needs: "clue:binh-luan-tom",
      done: "loc:rooftop2",
      text: "Bình luận của Tôm giống tin chuộc ghê sếp. Nhà Tôm nuôi mèo Mướp trên sân thượng, sát vách nhà chị Na. Hỏi Tôm về Mướp, hoặc soi cầu thang ở shop coi.",
    },
    {
      needs: "clue:tin-chuoc",
      done: "clue:binh-luan-tom",
      text: "Tin chuộc có kiểu viết riêng: \"ko\", \"fải\", ba dấu chân. Mình cần tin nhắn mẫu của từng người để so. Hỏi chị Na ai hay bình luận clip của Bơ đi sếp.",
    },
    {
      needs: "stmt:den-khong-dung-meo",
      done: "broke:den-khong-dung-meo",
      text: "Anh Đen nói bỏ hàng rồi đi liền. Mà app giao hàng bắt shipper chụp ảnh xác nhận đó sếp. Hỏi chị Na coi ảnh giao hàng.",
    },
    {
      needs: "stmt:khoi-khong-gap",
      done: "broke:khoi-khong-gap",
      text: "Bác sĩ nói cả tuần không gặp Bơ, lồng không nhốt con nào. Mà sổ khám bệnh ở phòng khám ghi gì ta? Bác sĩ viết chữ đẹp lắm, đọc thử đi sếp.",
    },
    {
      needs: "stmt:hong-khong-quan-tam",
      done: "broke:hong-khong-quan-tam",
      text: "Cô Hồng nói không thèm quan tâm Bơ. Mà ở shop có thùng carton gói kín mít chờ giao. Người nhận là ai ta?",
    },
    {
      text: "Em đoán cô Hồng! ...Dạ thôi, đoán bậy trừ sao. Sếp hỏi chị Na tin nhắn đòi chuộc trước, rồi soi shop với phòng khám đi sếp.",
    },
  ],

  bonus: [
    {
      id: "xu",
      q: "Tôm trả tiền 3 lon pate Hoàng Gia bằng gì?",
      choices: ["174 đồng xu 1.000đ đập từ heo đất", "Chuyển khoản qua máy tính bảng của nội", "Ghi nợ, hứa trả bằng bình luận", "Đổi bằng 3 cái áo siêu nhân"],
      answer: 0,
      explain: "Sổ bán lẻ của shop ghi rõ: \"trả 174 đồng xu 1.000đ\". Heo đất nuôi từ hồi lớp 4, rỗng ruột vì hoàng thượng.",
    },
    {
      id: "an-than",
      q: "Hộp dán nhãn \"AN THẦN\" trong tủ thuốc của bác sĩ Khôi thật ra là gì?",
      choices: ["Trà hoa cúc bác sĩ uống trước ca khám mèo", "Thuốc ngủ cho mèo Bơ", "Kẹo bạc hà", "Thuốc tẩy giun"],
      answer: 0,
      explain: "Bác sĩ thú y sợ mèo, uống trà hoa cúc trước mỗi ca khám mèo. Dán nhãn \"AN THẦN\" để nhân viên khỏi pha uống.",
    },
    {
      id: "bmd",
      q: "Ba chữ \"BMĐ\" trên áo choàng phơi trên sân thượng là viết tắt của gì?",
      choices: ["Bánh Mì Đặc biệt", "Băng Mèo Đen", "Bơ Mướp Đôi", "Bà Mắng Đó"],
      answer: 1,
      explain: "Băng Mèo Đen, tên nick Zalo đòi chuộc. Tèo đoán \"Bánh Mì Đặc biệt\" vì Tèo đói.",
    },
  ],
};
