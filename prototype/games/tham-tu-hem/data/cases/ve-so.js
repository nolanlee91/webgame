// Vụ 7: "Tờ Vé Số Bốc Hơi" (độ khó 2, mùa 2). Hợp đồng nhân vật / cảnh / đồ vật: docs/tham-tu-hem/DESIGN.md §3b.
// Cơ chế mới: DỰNG LẠI LỘ TRÌNH buổi sáng. Sáu điểm ghé, mỗi điểm một mốc giờ; vé mất giữa hai điểm nào.
// Lời giải (KHÔNG hiện cho người chơi):
//   Ông Chín mua vé số 230479 (ngày cưới 23/04/79) đài TP.HCM, xổ chiều qua. Thói quen: GÓI TIỀN TRONG TỜ VÉ cho hên,
//   nhét túi áo ngực. 06:50 rời nhà. 07:15 Cub bể bánh, gửi tiệm chú Tư (lúc trả tiền 07:36 chú Tư thấy số, chép bên lề
//   lịch hẹn để "mai mua ké"); 07:18 chú Tư chụp ảnh nhận xe: góc vé xanh ló khỏi túi áo. 07:25 ông Chín làm đổ ly trà
//   đá lên ngực áo => vé ướt sũng. 07:36 trả chú Tư 30k (mở vé ướt ra lấy tiền, chú Tư liếc thấy số). 07:38 Lực (xe ôm app) đón, 07:49 tới cổng chợ, khách trả tiền mặt 15k: ông Chín đặt
//   cục tiền ướt lên yên da beo để gỡ tiền, tờ vé ướt DÍNH vào yên, ông giật xấp tiền => vé rách: GÓC CÓ SERI theo xấp
//   tiền vô lại túi áo, phần thân dính lại trên yên. 07:58 trả tiền cá cho chị Lan bằng tiền rời ướt, không còn gói vé.
//   08:00 Lực thấy tờ vé trên yên, gỡ ra (sót mảnh giấy trong đường may), 08:11 tới đại lý chị Hên, 08:12 dò máy: TRÚNG
//   ĐẶC BIỆT nhưng "không đọc được seri". Chị Hên nói vé mất góc seri thì không lãnh được. 08:20 Lực mượn kéo, lục thùng
//   vé ế cắt một góc vé đài Bến Tre định ghép giả. 08:25 hỏi Mai cách lãnh vé rách. 08:30 ông Chín mua rau, gặp Mai, vỗ
//   túi thấy cộm (xấp tiền) tưởng vé còn. 08:40 Lực đem xe tới chú Tư "thay bọc yên gấp". 09:05 bà Chín lén vô đại lý dò
//   vé bí mật của bả (120861, ngày sinh ông Chín). 09:40 ông Chín tới đại lý, thấy trúng, mở xấp tiền: mất vé.
//   Thủ phạm: Lực. Động cơ: nợ góp xe 3 kỳ, sắp bị thu xe. Cú lật: Lực chưa lãnh được vì góc seri NẰM TRONG TÚI ÁO ÔNG CHÍN.
//   Gây nhiễu: bà Chín (ghét ông mê số, doạ đốt vé; có mặt ở đại lý 09:05 vì lén mua vé số ngày sinh ông),
//   Mai (bán vé, biết số, gặp ông 08:30; giữ cả bộ sưu tập vé 230479 mọi đài để "hên chung" với khách mở hàng),
//   chú Tư (thấy vé, biết số; chép số để mua ké mà xấu hổ vì chê ông Chín mê số 20 năm).
//   Kết hợp 2 vật chứng: lịch hẹn 07:36 (vé còn, mở ra trả tiền) + tờ tiền ướt 07:58 (vé hết) => chỉ còn chuyến xe ôm;
//   ly trà đá (vé ướt) + mảnh vé ố trà trên yên + góc vé ố trà trong túi áo => vé dính yên rồi rách.
export default {
  id: "ve-so",
  no: 7,
  title: "Tờ Vé Số Bốc Hơi",
  tagline: "Trúng độc đắc 2 tỉ. Chỉ thiếu đúng một thứ: tờ vé.",
  difficulty: 2,
  client: "ongchin",

  intro: [
    ["narr", "Văn phòng Thám Tử Lụm, 10 giờ 30 sáng Chủ nhật. Ngoài chợ Hẻm 47 người ta trả giá cá lóc ồn như họp Quốc hội."],
    ["teo", "Sếp ơi! Nhóm Hẻm 47 Hóng Biến nổ tung rồi! Có ông trúng độc đắc 2 tỉ mà mất vé!", "shock"],
    ["me", "Trúng số mà lên nhóm hóng biến thì chắc không phải tin vui.", "neutral"],
    ["teo", "Bài của bà Tư 1.400 like trong 40 phút. Kỷ lục mùa mới luôn sếp.", "happy"],
    ["narr", "Cửa bật mở. Một ông già nón kết, kính lão trễ xuống mũi, áo sơ mi cũ ướt loang một mảng trước ngực, lao vào như bị cá lóc rượt."],
    ["ongchin", "Thám tử! Cứu tui! Tui trúng rồi! Hai tỉ! Mà tờ vé bay mất rồi!", "shock"],
    ["narr", "Theo sau là một bà đeo túi vải đi chợ, mặt lạnh như tủ đá bán kem."],
    ["bachin", "Trúng cái gì mà trúng. Ba chục năm nay ổng trúng có hai lần: trúng gió với trúng mánh của mấy đứa bán vé.", "angry"],
    ["ongchin", "Lần này trúng thiệt! Số [[230479]], đài TP.HCM xổ chiều qua. Là [[ngay-cuoi|ngày cưới]] của tui với bà đó! 23 tháng 4 năm 79!", "angry"],
    ["bachin", "Ngày cưới mà ông đem đi đánh số. Ông coi bà nhà như cái máy in tiền.", "angry"],
    ["me", "Ông bình tĩnh. Ông phát hiện mất vé lúc nào?", "neutral"],
    ["ongchin", "[[09h40|9 giờ 40]], ở [[dai-ly|đại lý vé số]] chị Hên đầu chợ. Tui nhìn bảng kết quả, thấy giải đặc biệt 230479, tim tui ngừng đập ba giây.", "shock"],
    ["ongchin", "Rồi tui móc túi áo ra. Tiền thì còn. Mà tờ vé... không còn.", "nervous"],
    ["teo", "Sếp, em đoán liền: con cá lóc! Ổng đi chợ mua cá lóc, cá lóc đớp vé! Cá lóc mùa này dữ lắm!", "smug"],
    ["me", "Tèo, ghi sổ. Cá lóc tạm thời chưa có quyền im lặng.", "neutral"],
    ["ongchin", "Mà tui biết ai rồi. Bả! Bả nói hoài: \"có ngày tui đốt hết vé số của ông\"!", "angry"],
    ["bachin", "Tui nói vậy ba chục năm rồi, có đốt tờ nào chưa? Tui mà đốt thì ông đâu có cái để mất.", "angry"],
    ["batu", "(ló đầu vô cửa, điện thoại giơ cao) Thám tử nhận vụ chưa? Cả chợ đang chờ đó! Bà Tư đã nhờ ban quản lý chợ đọc loa luôn rồi!", "happy"],
    ["me", "Ông Chín, sáng nay ông đi những đâu, mấy giờ, ông nhớ được bao nhiêu kể bấy nhiêu. Tờ vé mất ở đâu đó trên đường đi.", "neutral"],
  ],

  social: {
    group: "Hẻm 47 Hóng Biến",
    posts: [
      {
        by: "batu",
        text: "🚨 BIẾN CĂNG CHỢ HẺM 47 🚨 Ông Chín (nhà đầu hẻm, mua vé số 30 năm) TRÚNG ĐỘC ĐẮC 2 TỈ đài TP.HCM, mà tới đại lý dò xong thì... TỜ VÉ BỐC HƠI!!! Ông xỉu tại chỗ, chị Hên đại lý quạt muốn gãy tay. Ai nhặt được tờ vé xanh số 230479 thì trả lại cho ông nha, hai tỉ là mồ hôi... à không, là hên của người ta 🙏🙏",
        likes: 1408,
        comments: [
          { by: "teo", text: "Em đoán con cá lóc. Đã báo sếp em. Sếp em chưa tin 🐟" },
          { by: "Hùng Xe Ôm", text: "Anh em xe ôm chợ Hẻm 47 ai thấy tờ vé nào trên yên thì báo nha. Tui chạy từ 5 giờ, yên tui chỉ có mồ hôi" },
          { by: "Cô Ba Bán Xôi", text: "Ổng mua vé 30 năm, mỗi ngày 10 tờ. Tui tính rồi, ổng xài hết hơn một tỉ tiền vé. Trúng 2 tỉ là mới gỡ được chút đỉnh" },
          { by: "Tiểu Thư Bánh Bèo 2k5", text: "Số ngày cưới 😭 30 năm vẫn nhớ ngày cưới, đàn ông bây giờ còn không nhớ ngày nhắn tin đầu tiên" },
          { by: "Shop Ví Da Chống Mất Đồ", text: "Ví da có ngăn bấm nút, giữ vé số an toàn tuyệt đối, ib em ạ 👛" },
          { by: "chuba", text: "Đã báo công an phường. Chú đang ăn hủ tiếu, ăn xong chú tới" },
        ],
      },
    ],
  },

  people: {
    ongchin: {
      name: "Ông Chín",
      role: "Người mất vé · người tới nhờ",
      bio: "65 tuổi, áo sơ mi cũ, kính lão, nón kết. Mua vé số 30 năm, mỗi ngày đúng một số: [[ngay-cuoi|ngày cưới]] của ổng. Có thói quen gói tiền trong tờ vé \"cho tiền đẻ ra tiền\".",
    },
    bachin: {
      name: "Bà Chín",
      role: "Vợ ông Chín",
      bio: "62 tuổi, túi vải đi chợ không rời vai, càm ràm như radio bật sẵn. Ghét ông mê số tới mức câu cửa miệng là \"có ngày tui đốt hết\".",
      suspect: true,
    },
    mai: {
      name: "Cô Mai",
      role: "Bán vé số dạo",
      bio: "35 tuổi, nón lá, xấp vé kẹp trên tấm bảng gỗ. Bán dạo khắp chợ từ 6 giờ sáng. Ông Chín là khách mở hàng của cô mỗi ngày suốt 5 năm.",
      suspect: true,
      start: false,
    },
    luc: {
      name: "Anh Lực",
      role: "Xe ôm công nghệ",
      bio: "31 tuổi, áo khoác xanh lá, nón bảo hiểm xanh, chạy chiếc Wave bọc [[yen-da-beo|yên da beo]] cả chợ nhận ra. Hiền, nói nhiều, sợ nhất trên đời là bị đánh giá 1 sao.",
      suspect: true,
      start: false,
    },
    chutu: {
      name: "Chú Tư",
      role: "Thợ sửa xe",
      bio: "58 tuổi, tay đen dầu nhớt, cờ lê giắt lưng quần. Tiệm sửa xe đối diện cổng chợ. Hai chục năm nay chọc ông Chín \"mê số tới mất nết\".",
      suspect: true,
      start: false,
    },
    chilan: {
      name: "Chị Lan",
      role: "Bán cá ở chợ",
      bio: "40 tuổi, ủng cao su, tạp dề nhựa, giọng to hơn loa chợ. Nhớ mặt từng khách, nhớ luôn khách nào trả tiền lẻ.",
      start: false,
    },
    chihen: {
      name: "Chị Hên",
      role: "Chủ đại lý vé số",
      bio: "50 tuổi, đeo vòng cẩm thạch, chủ \"Đại Lý Vé Số Hên\" đầu chợ. Nói câu nào cũng chêm chữ \"hên\".",
      start: false,
    },
  },

  locations: {
    market: {
      name: "Sạp chợ",
      scene: "market",
      start: true,
      intro: [
        ["narr", "Chợ Hẻm 47 lúc gần trưa. Mùi cá, mùi rau thơm, mùi dầu chiên và tiếng loa phường đọc tên ông Chín."],
        ["ongchin", "Tui mua cá ở sạp chị Lan, mua rau ở cái rổ đằng kia. Tui đi y như mọi ngày.", "neutral"],
        ["teo", "Sếp, chợ đông vầy mà tìm một tờ vé... như mò kim đáy biển. Mà biển có cá lóc.", "nervous"],
      ],
      hotspots: [
        {
          id: "sap-ca",
          label: "Sạp cá",
          rect: [40, 250, 250, 200],
          lines: [
            ["narr", "Sạp cá chị Lan: thau cá lóc quẫy nước tung toé, rổ cá rô, một con cá trê nhìn đời bằng ánh mắt tuyệt vọng."],
            ["chilan", "Thám tử hả? Hỏi vụ ông Chín đúng không? Cả chợ hỏi tui từ 10 giờ tới giờ rồi.", "neutral"],
            ["teo", "Chị ơi, cá lóc của chị có con nào bụng to bất thường không chị? Kiểu... nuốt cả tờ vé?", "smug"],
            ["chilan", "Cá tui con nào cũng bụng to. Vì cá tui tươi. Em mua không?", "angry"],
          ],
          gives: { people: ["chilan"], words: ["sap-ca"] },
          again: [["teo", "Con cá trê vẫn nhìn em. Em thấy nó biết gì đó.", "nervous"]],
        },
        {
          id: "can-dia",
          label: "Cân đĩa",
          rect: [300, 300, 130, 130],
          lines: [
            ["narr", "Cái cân đĩa đồng cũ. Trên đĩa cân, một tờ 50 ngàn đang được phơi, đè bằng quả cân 1 ký cho khỏi bay."],
            ["me", "Tờ tiền còn ẩm, nhăn nhúm, mép ố vàng. Ngửi thử... mùi [[tra-da|trà đá]]. Không phải mùi cá.", "neutral"],
            ["teo", "Tiền mà cũng phải phơi. Tiền nhà chị Lan được chăm hơn em.", "smug"],
            ["me", "Ai đó đưa chị Lan tiền ướt nhẹp. Mà ướt trà đá chứ không phải nước cá.", "neutral"],
          ],
          gives: { clues: ["tien-uot"] },
          again: [["me", "Quả cân 1 ký vẫn đè lên tờ 50 ngàn, như canh giữ nhân chứng.", "neutral"]],
        },
        {
          id: "ro-rau",
          label: "Rổ rau",
          rect: [470, 320, 170, 120],
          lines: [
            ["narr", "Rổ rau muống, rau dền, bó hành lá. Bà bán rau đang ngủ gật, tay vẫn cầm chắc cái quạt."],
            ["ongchin", "Tui mua rau muống ở đây, chừng [[08h30|8 giờ 30]]. Con Mai đi ngang mời mua vé ngày mai.", "neutral"],
            ["ongchin", "Tui nói để dò tờ hôm qua đã. Tui còn vỗ vỗ túi áo, thấy cộm cộm, tưởng vé còn.", "nervous"],
            ["teo", "Vỗ túi thấy cộm là còn chứ sao sếp? Hay là cộm... tiền?", "neutral"],
            ["me", "Ông gói tiền trong vé. Mất vé thì xấp tiền vẫn cộm y như cũ.", "neutral"],
          ],
          gives: { words: ["08h30"] },
          again: [["teo", "Bà bán rau vẫn ngủ. Em mà ngủ ngon vậy chắc em giàu rồi.", "neutral"]],
        },
        {
          id: "xe-day-hang",
          label: "Xe đẩy hàng",
          rect: [660, 280, 200, 170],
          lines: [
            ["narr", "Chiếc xe đẩy hàng của chú khuân vác, chất đầy thùng xốp. Dưới gầm xe có một tờ giấy xanh vo tròn."],
            ["teo", "VÉ SỐ! Sếp ơi vé số xanh! Số... 2... 3... 0... 4... 7... 9! TÌM THẤY RỒI! Em phá án rồi!", "shock"],
            ["me", "Đọc dòng trên cùng đi Tèo.", "neutral"],
            ["teo", "\"Xổ số kiến thiết [[ve-vinh-long|Vĩnh Long]]\"... xổ thứ Sáu tuần trước. Dạ. Em xin rút lại chữ phá án.", "nervous"],
            ["me", "Cùng số 230479 nhưng khác đài, hết hạn từ tuần trước. Ai lại có vé đúng số ngày cưới ông Chín mà không phải ông Chín?", "neutral"],
          ],
          gives: { clues: ["ve-vinh-long"] },
          again: [["teo", "Em vẫn còn run. Hai tỉ cầm trên tay ba giây rồi bay.", "nervous"]],
        },
        {
          id: "bang-gia",
          label: "Bảng giá",
          rect: [330, 40, 230, 140],
          lines: [
            ["narr", "Bảng đen viết phấn của ban quản lý chợ: \"Cá lóc 80k/kg. Rau muống 10k/bó. Trứng vịt 4k/trứng.\""],
            ["narr", "Dòng cuối viết tay, chữ to: \"VÉ SỐ KHÔNG BÁN THIẾU. MUA THIẾU HÊN KHÔNG TỚI. – Mai\"."],
            ["teo", "Câu slogan này hay hơn của mấy công ty quảng cáo em biết.", "smug"],
            ["me", "Cô Mai bán dạo trong chợ này. Ghi nhớ.", "neutral"],
          ],
          again: [["teo", "Trứng vịt 4 ngàn. Em tính ra 2 tỉ mua được năm trăm ngàn trứng vịt.", "happy"]],
        },
        {
          id: "loa-cho",
          label: "Loa chợ",
          rect: [800, 30, 120, 100],
          lines: [
            ["narr", "Cái loa phường gắn trên cột, rè rè đọc bản tin do bà Tư soạn:"],
            ["narr", "\"Alô alô. Ai lượm được tờ vé số đài TP.HCM số 230479, vui lòng trả cho ông Chín. Ông Chín đang rất buồn. Bà Chín thì... không rõ.\""],
            ["teo", "Bà Tư lên loa phường luôn. Bả quyền lực thiệt.", "shock"],
          ],
          again: [["narr", "\"...Ngoài ra, cá lóc sạp chị Lan hôm nay giảm 5 ngàn. Hết tin.\""]],
        },
      ],
    },

    garage: {
      name: "Tiệm sửa xe chú Tư",
      scene: "garage",
      needs: "talk:ongchin.lo-trinh",
      intro: [
        ["narr", "Tiệm sửa xe đối diện cổng chợ. Mùi nhớt, mùi cao su cháy, cái radio cũ đang phát cải lương."],
        ["chutu", "Ủa ông Chín. Ông chưa lấy xe hả? Xe vá xong từ 8 giờ rồi. À mà nghe nói ông trúng... rồi mất hả?", "smug"],
        ["ongchin", "Ông đừng có cười. Ông cười là tui đếm từng cái răng.", "angry"],
      ],
      hotspots: [
        {
          id: "xe-dang-sua",
          label: "Xe đang sửa",
          rect: [300, 220, 330, 230],
          lines: [
            ["narr", "Giữa tiệm là chiếc Wave xanh, bọc yên da beo vàng chấm đen. Bọc yên bị rạch một đường dài, như ai cố gỡ cái gì đó."],
            ["narr", "Treo trên tay lái là tấm thẻ giấy: \"Thay bọc yên – GẤP – khách chờ\". Cốp xe mở hé."],
            ["me", "Trong cốp: một tờ giấy báo của công ty tài chính. \"Anh Nguyễn Văn Lực, hợp đồng góp xe quá hạn 3 kỳ. Chúng tôi sẽ thu hồi xe vào ngày 30.\"", "neutral"],
            ["teo", "Yên da beo! Xe anh Lực xe ôm! Ủa sao xe chở khách lại nằm đây giữa giờ chạy cuốc?", "neutral"],
            ["me", "Và sao cái bọc yên đang lành lại phải thay \"gấp\"?", "neutral"],
          ],
          gives: { clues: ["giay-bao-no"], words: ["yen-da-beo", "no-gop-xe"] },
          again: [["teo", "Bọc da beo này mà thay thì tiếc ghê. Nó là thương hiệu cá nhân của ảnh đó sếp.", "neutral"]],
        },
        {
          id: "yen-xe-wave",
          label: "Đường may yên xe (soi kỹ)",
          rect: [400, 240, 150, 50],
          needs: "stmt:luc-khong-thay",
          lines: [
            ["narr", "Soi đèn pin dọc đường rạch trên bọc yên da beo."],
            ["me", "Kẹt trong đường may: một mảnh giấy xanh nhỏ bằng móng tay, in nửa chữ \"...KIẾN THIẾT TP.H...\".", "neutral"],
            ["me", "Mảnh giấy cứng queo, loang một vệt nâu nhạt. Ngửi thử: [[tra-da|trà đá]].", "neutral"],
            ["teo", "Vé số dính trên yên! Mà yên da beo này của anh Lực, người nói trên yên không có gì!", "shock"],
            ["me", "Một tờ vé ướt đặt lên yên nhựa thì dính chặt như tem. Muốn gỡ thì phải cạy. Cạy thì sót lại.", "neutral"],
          ],
          gives: { clues: ["manh-ve-yen"], words: ["dinh-yen"] },
          again: [["me", "Đường rạch trên yên giờ trống trơn. Mảnh vé đã vào túi vật chứng.", "neutral"]],
        },
        {
          id: "thung-do-nghe",
          label: "Thùng đồ nghề",
          rect: [40, 330, 200, 150],
          lines: [
            ["narr", "Thùng đồ nghề sắt, cờ lê, mỏ lết, tuốc nơ vít, một hộp ruột xe mới và một cuốn sách \"Tử vi trọn đời tuổi Mậu Tuất\"."],
            ["teo", "Chú Tư chê ông Chín mê số mà chú coi tử vi trọn đời luôn nè sếp.", "smug"],
            ["me", "Trang đang gấp: \"Năm nay tuổi Mậu Tuất có lộc bất ngờ, nên đi theo người có số đỏ\".", "neutral"],
          ],
          again: [["teo", "Em tuổi Đinh Sửu. Em lật thử coi em có lộc không... Trang của em bị rách. Đúng là số em.", "nervous"]],
        },
        {
          id: "binh-hoi",
          label: "Bình hơi",
          rect: [660, 260, 120, 200],
          lines: [
            ["narr", "Bình hơi đỏ cao ngang ngực, đồng hồ áp suất chỉ đỏ. Dán giấy: \"Bơm bánh 2k. Bơm tinh thần miễn phí\"."],
            ["teo", "Cho em bơm tinh thần đi chú. Em mới mất hai tỉ ba giây hồi nãy.", "nervous"],
            ["chutu", "Đó là tờ vé Vĩnh Long, mày mất cái gì mà mất.", "smug"],
          ],
          again: [["narr", "Bình hơi xì một tiếng dài, như thở dài thay cho ông Chín."]],
        },
        {
          id: "ghe-cho",
          label: "Ghế chờ",
          rect: [800, 300, 140, 170],
          lines: [
            ["narr", "Băng ghế gỗ cho khách chờ. Dưới chân ghế, một ly nhựa đổ nghiêng, đá tan thành vũng, một cái khăn lau đen nhẻm vắt trên tay vịn."],
            ["chutu", "Ly [[tra-da|trà đá]] của ông Chín đó. Ổng ngồi đó chừng 7 giờ 25, lo coi điện thoại, đá văng nguyên ly lên ngực áo.", "neutral"],
            ["chutu", "Ổng lấy khăn chậm chậm cái túi áo, miệng còn nói: \"tiền ướt thì phơi, hên ướt thì thôi\".", "neutral"],
            ["me", "Đổ ngay ngực áo. Đúng cái túi ông gói tiền trong vé.", "neutral"],
            ["teo", "Vậy là từ 7 giờ 25, tờ vé ướt sũng như cái khăn này.", "neutral"],
          ],
          gives: { clues: ["ly-tra-da"] },
          again: [["teo", "Cái khăn này lau xe, lau tay, lau vé số. Một cái khăn đa năng.", "smug"]],
        },
        {
          id: "lich-hen",
          label: "Lịch hẹn",
          rect: [560, 40, 180, 160],
          lines: [
            ["narr", "Tấm bảng trắng treo tường, chữ bút lông xanh: lịch nhận xe hôm nay."],
            ["me", "\"07:15 – Ông Chín – Cub 81 – vá ruột. [[07h36|07:36]] thu 30k, khách đi trước, lấy xe sau\".", "neutral"],
            ["me", "\"08:40 – Lực – Wave xanh – thay bọc yên – GẤP\".", "neutral"],
            ["me", "Và sát lề, chữ nhỏ xíu, bút khác màu: \"230479 – mai mua ké\".", "neutral"],
            ["teo", "Chú Tư ghi số vé ông Chín lên bảng! Chú Tư biết số!", "shock"],
          ],
          gives: { clues: ["lich-hen"], words: ["ke-so"] },
          again: [["me", "\"Mai mua ké\". Chữ \"mai\" viết thường. Là ngày mai, không phải cô Mai.", "neutral"]],
        },
        {
          id: "radio-cu",
          label: "Radio cũ",
          rect: [40, 60, 150, 90],
          lines: [
            ["narr", "Cái radio cassette dán băng keo đen ba chỗ. Đang phát cải lương \"Tô Ánh Nguyệt\", rè như chiên mỡ."],
            ["chutu", "Đừng đụng. Cái radio đó bắt được đúng một đài. Mà đài đó tui thích.", "angry"],
            ["teo", "Radio này mà dò số được thì chú Tư đâu cần chép bảng.", "smug"],
          ],
          again: [["narr", "Radio rè rè: \"...con ơi, con có biết...\". Không ai biết."]],
        },
      ],
    },

    lottery: {
      name: "Đại lý vé số",
      scene: "lottery",
      start: true,
      intro: [
        ["narr", "Đại Lý Vé Số Hên đầu chợ. Bàn thờ Thần Tài đỏ rực, bảng kết quả viết tay, cái máy dò số kêu bíp bíp."],
        ["ongchin", "Đây. Chỗ tui đứng lúc 9 giờ 40. Chỗ tui xỉu đây nè. Còn dấu mông trên nền gạch nè.", "nervous"],
        ["teo", "Sếp ơi, chỗ ông xỉu có vòng phấn bà Tư vẽ lại luôn. Ghê chưa.", "shock"],
      ],
      hotspots: [
        {
          id: "quay-ve-so",
          label: "Quầy vé số",
          rect: [40, 240, 300, 220],
          lines: [
            ["narr", "Quầy kính, bên trong xếp vé từng xấp theo đài. Một bà đeo vòng cẩm thạch đứng sau quầy, tay cầm cuốn sổ."],
            ["chihen", "Thám tử hả? Hên quá, tui đang chờ. Tui là Hên, chủ đại lý. Ông Chín xỉu ở đây làm tui sợ muốn xỉu theo.", "nervous"],
            ["me", "Cuốn sổ đó là gì?", "neutral"],
            ["chihen", "Sổ phát vé cho người bán dạo. Ai lấy vé số nào, đài nào, tui ghi hết.", "neutral"],
            ["me", "Trang của Mai hôm qua: \"230479 – TP.HCM – 1 tờ – đã bán (Ô. Chín)\". Bên dưới: \"230479 – Long An – 1. Bến Tre – 1. Vĩnh Long – 1. Đồng Nai – 1...\"", "neutral"],
            ["teo", "Một số mà lấy đủ mười mấy đài! Cô Mai gom số ngày cưới ông Chín như gom thẻ Pokémon!", "shock"],
          ],
          gives: { clues: ["so-phat-ve"], people: ["chihen"], words: ["chihen"] },
          again: [["chihen", "Hên là tui ghi sổ kỹ. Không ghi thì giờ ai biết ai.", "neutral"]],
        },
        {
          id: "bang-ket-qua",
          label: "Bảng kết quả",
          rect: [380, 40, 260, 200],
          lines: [
            ["narr", "Bảng kết quả viết tay bằng phấn màu. Dòng trên cùng in đậm: \"[[xs-hcm|XỔ SỐ TP.HCM]] – Giải đặc biệt: 230479 – 2 tỉ đồng\"."],
            ["ongchin", "Đó! Thấy chưa! Hai ba không bốn bảy chín! Tui đọc đi đọc lại mười lần!", "happy"],
            ["teo", "Ông Chín ơi bình tĩnh, ông xỉu nữa là bà Tư vẽ thêm vòng phấn.", "nervous"],
            ["me", "Độc đắc là thật. Vậy ai đó đang cầm một tờ giấy đáng giá 2 tỉ trong túi.", "neutral"],
          ],
          gives: { clues: ["ket-qua-xs"], words: ["doc-dac"] },
          again: [["teo", "Em đọc lại lần thứ mười một. Vẫn là 230479. Vẫn không phải số em.", "nervous"]],
        },
        {
          id: "may-do-so",
          label: "Máy dò số",
          rect: [380, 290, 160, 150],
          lines: [
            ["narr", "Máy dò số tự động: đặt vé vào khay, máy đọc dãy số và kêu bíp. Có nút \"Lịch sử\" cho đại lý kiểm tra."],
            ["me", "Mở lịch sử sáng nay...", "neutral"],
            ["me", "\"[[08h12|08:12]] – Vé 230479 – XS TP.HCM – TRÚNG ĐẶC BIỆT. Cảnh báo: KHÔNG ĐỌC ĐƯỢC SERI (vé mất góc)\".", "neutral"],
            ["me", "\"[[09h05|09:05]] – Vé 120861 – XS TP.HCM – Không trúng\".", "neutral"],
            ["teo", "8 giờ 12! Có người dò tờ vé 230479 trước ông Chín một tiếng rưỡi! Mà vé mất góc là sao sếp?", "shock"],
            ["me", "Nghĩa là tờ vé đó bị rách. Đúng cái góc in [[goc-seri|góc số seri]]. Không có seri thì máy biết trúng, mà công ty xổ số không biết trả cho ai.", "neutral"],
          ],
          gives: { clues: ["log-may-do"], words: ["goc-seri"] },
          again: [["narr", "Máy dò số kêu \"bíp\". Ai đó vừa dò một tờ không trúng. Như mọi ngày."]],
        },
        {
          id: "camera-dai-ly",
          label: "Camera đại lý",
          rect: [700, 40, 120, 90],
          needs: "seen:lottery.may-do-so",
          lines: [
            ["narr", "Camera gắn trần, màn hình nhỏ đặt sau quầy. Chị Hên tua lại cho thám tử."],
            ["me", "08:11. Một người áo khoác xanh lá, nón bảo hiểm xanh, kính chắn gió kéo xuống. Đậu xe Wave ngay cửa. Cái yên xe: da beo, vàng chấm đen.", "neutral"],
            ["me", "Người đó đặt vé vào máy dò, đứng sững ba giây, rồi cúi xuống hỏi chị Hên gì đó.", "neutral"],
            ["me", "09:05. Một bà mặc đồ bộ, kéo nón lá sụp xuống tận cằm, đeo túi vải. Bà dò một tờ, lắc đầu, rồi đi rất nhanh.", "neutral"],
            ["teo", "Túi vải... nón sụp... Sếp ơi em thấy dáng quen quen. Quen như người mới đứng trong văn phòng mình sáng nay.", "shock"],
          ],
          gives: { clues: ["clip-0811", "clip-0905"] },
          again: [["teo", "Em tua đi tua lại. Yên da beo nhìn trên camera còn nổi hơn ngoài đời.", "neutral"]],
        },
        {
          id: "thung-ve-cu",
          label: "Thùng vé cũ",
          rect: [580, 330, 160, 160],
          lines: [
            ["narr", "Thùng các-tông đựng vé ế người bán dạo trả lại, chờ gửi về công ty. Nắp thùng mở toang, vé xáo lộn."],
            ["me", "Trên cùng: một tờ vé ế đài Bến Tre, bị cắt mất góc dưới bên phải. Đường cắt thẳng tắp, bằng kéo.", "neutral"],
            ["chihen", "Ủa ai lục thùng tui vậy? Sáng nay tui mới xếp lại mà.", "angry"],
            ["teo", "Cắt đúng cái góc in seri. Ai cắt góc vé ế làm chi vậy sếp? Đem về dán album hả?", "neutral"],
            ["me", "Hoặc đem đi dán vào một tờ vé khác đang thiếu góc. Gọi là [[ghep-goc|ghép góc giả]].", "neutral"],
          ],
          gives: { clues: ["ve-e-cat-goc"] },
          again: [["chihen", "Tui xếp lại rồi đó. Hên là không ai lấy mất tờ nào.", "neutral"]],
        },
        {
          id: "ban-tho-than-tai",
          label: "Bàn thờ Thần Tài",
          rect: [820, 160, 120, 140],
          lines: [
            ["narr", "Bàn thờ Thần Tài Thổ Địa, đèn đỏ, trái thơm, lon bia, xấp tiền âm phủ. Có cả một tờ vé số dựng trước tượng."],
            ["chihen", "Sáng nào tui cũng cúng một tờ cho Thần Tài. Ổng chưa trúng lần nào, mà ổng không than.", "neutral"],
            ["teo", "Thần Tài mà cũng đen số. Vậy em yên tâm rồi.", "happy"],
          ],
          again: [["teo", "Lon bia trên bàn thờ còn lạnh. Thần Tài sướng hơn em.", "neutral"]],
        },
      ],
    },
  },

  clues: {
    "danh-sach-cho": {
      name: "Danh sách đi chợ của bà Chín",
      desc: "Giấy tập học trò, chữ bà Chín: \"Cá lóc 1 con. Rau muống 2 bó. Sửa xe (bánh xì). KHÔNG MUA VÉ SỐ.\" Chữ cuối gạch chân ba lần, lủng cả giấy.",
      detail: [["teo", "Gạch chân ba lần mà ông Chín vẫn mua. Đây là tình yêu, hoặc là bệnh.", "smug"]],
    },
    "chuyen-xe-app": {
      name: "Chuyến xe ôm trên app",
      desc: "Lịch sử chuyến trên điện thoại ông Chín: tài xế Lực, Wave xanh. Đón [[07h38|07:38]] ở [[tiem-chu-tu|tiệm chú Tư]], trả [[07h49|07:49]] ở [[cong-cho|cổng chợ]]. Thanh toán tiền mặt 15.000đ. Ông Chín chưa đánh giá chuyến.",
      detail: [["me", "Mười một phút trên [[xe-om|xe ôm]]. Mười một phút duy nhất sáng nay ông Chín không đứng trên đất.", "neutral"]],
    },
    "anh-nhan-xe": {
      name: "Ảnh nhận xe 07:18",
      desc: "Ảnh chú Tư chụp lúc nhận xe Cub của ông Chín, giờ trên máy [[07h18|07:18]]. Ông Chín đứng cạnh xe, trong túi áo ngực ló ra một góc giấy xanh có chữ \"...SỐ KIẾN THIẾT\".",
      detail: [["me", "7 giờ 18, tờ vé còn nằm trong túi áo. Có hình làm chứng.", "neutral"]],
    },
    "ly-tra-da": {
      name: "Ly trà đá đổ",
      desc: "Ly nhựa đổ dưới ghế chờ tiệm chú Tư, khăn lau còn ướt. Chừng 7 giờ 25 ông Chín làm đổ nguyên ly [[tra-da|trà đá]] lên ngực áo, đúng túi đựng vé.",
      detail: [["me", "Từ lúc đó, tờ vé ướt sũng. Giấy vé ướt thì mềm, dễ rách, và dính vào bất cứ thứ gì trơn láng.", "neutral"]],
    },
    "tien-uot": {
      name: "Tờ 50 ngàn ướt trà",
      desc: "Tờ tiền ông Chín trả chị Lan lúc [[07h58|07:58]] ở [[sap-ca|sạp cá]], còn ẩm, mùi trà đá. Chị Lan nói ông móc tiền rời ra trả, không có tờ vé gói ngoài như mọi ngày.",
      detail: [["me", "Lúc 7 giờ 58, tiền vẫn còn, ướt trà. Nhưng cái vỏ bọc bằng vé số thì đã không còn.", "neutral"]],
    },
    "lich-hen": {
      name: "Lịch hẹn tiệm chú Tư",
      desc: "\"07:15 – Ông Chín – Cub – vá ruột. [[07h36|07:36]] thu 30k, khách đi trước.\" \"08:40 – Lực – Wave xanh – thay bọc yên – GẤP.\" Sát lề, chữ nhỏ: \"230479 – mai mua ké\".",
      detail: [["teo", "Một tấm bảng mà tố hai người. Bảng này nên làm thám tử.", "smug"]],
    },
    "giay-bao-no": {
      name: "Giấy báo nợ góp xe",
      desc: "Trong cốp xe Wave yên da beo: công ty tài chính báo anh Nguyễn Văn Lực quá hạn 3 kỳ góp xe, sẽ thu hồi xe ngày 30. Bên lề có ai bấm máy tính ghi: \"còn thiếu 7.450.000\". Đó là [[no-gop-xe|nợ góp xe]].",
      detail: [["me", "Với một người chạy xe ôm, mất xe là mất cần câu cơm.", "neutral"]],
    },
    "manh-ve-yen": {
      name: "Mảnh vé kẹt trên yên da beo",
      desc: "Mảnh giấy xanh bằng móng tay, in nửa chữ \"...KIẾN THIẾT TP.H...\", kẹt trong đường rạch bọc [[yen-da-beo|yên da beo]] xe Lực. Loang vệt [[tra-da|trà đá]] khô.",
      detail: [["me", "Giấy vé ướt đặt lên yên nhựa thì [[dinh-yen|dính lên yên xe]]. Ai đó đã cạy nó ra, và sót lại mảnh này.", "neutral"]],
    },
    "ket-qua-xs": {
      name: "Bảng kết quả xổ số",
      desc: "Đại lý chị Hên: [[xs-hcm|Xổ số TP.HCM]] xổ chiều qua, giải [[doc-dac|độc đắc]]: 230479, trị giá 2 tỉ đồng.",
    },
    "log-may-do": {
      name: "Lịch sử máy dò số",
      desc: "[[08h12|08:12]]: vé 230479 TP.HCM – TRÚNG ĐẶC BIỆT – cảnh báo \"không đọc được seri, vé mất góc\". [[09h05|09:05]]: vé 120861 TP.HCM – không trúng. Không có lượt dò nào lúc 9 giờ 40.",
      detail: [["me", "Có người cầm tờ vé trúng tới đây trước ông Chín. Và tờ vé đó đã mất [[goc-seri|góc số seri]].", "neutral"]],
    },
    "clip-0811": {
      name: "Camera đại lý 08:11",
      desc: "Người áo khoác xanh lá, nón bảo hiểm xanh, đậu xe Wave [[yen-da-beo|yên da beo]] trước cửa [[dai-ly|đại lý]], dò vé lúc 08:12 rồi hỏi chị Hên gì đó.",
    },
    "clip-0905": {
      name: "Camera đại lý 09:05",
      desc: "Một bà mặc đồ bộ, nón lá kéo sụp tới cằm, đeo [[tui-vai|túi vải]] đi chợ, dò một tờ vé lúc [[09h05|09:05]], lắc đầu rồi đi thật nhanh.",
    },
    "ve-e-cat-goc": {
      name: "Vé ế bị cắt góc",
      desc: "Tờ vé ế đài Bến Tre trong thùng vé cũ của đại lý, bị cắt mất đúng góc in seri bằng kéo. Chị Hên nói thùng bị ai lục sáng nay. Dấu hiệu của [[ghep-goc|ghép góc giả]].",
    },
    "so-phat-ve": {
      name: "Sổ phát vé của đại lý",
      desc: "Trang của Mai hôm qua: \"230479 – TP.HCM – 1 tờ – đã bán (Ô. Chín)\". Kế đó: 230479 các đài Long An, Bến Tre, Vĩnh Long, Đồng Nai... mỗi đài 1 tờ. Ghi chú của chị Hên: \"Mai lấy số này mỗi ngày, 5 năm rồi\".",
    },
    "ve-vinh-long": {
      name: "Vé Vĩnh Long vo tròn",
      desc: "Vé số đài [[ve-vinh-long|Vĩnh Long]] số 230479, xổ thứ Sáu tuần trước, vo tròn dưới gầm xe đẩy hàng ở chợ. Cùng số ngày cưới ông Chín, khác đài, đã hết hạn.",
      detail: [["teo", "Nhìn thôi đã đau tim. Cầm lên là mất hai tỉ trong ba giây.", "nervous"]],
    },
    "goc-ve-rach": {
      name: "Góc vé trong túi áo ông Chín",
      desc: "Mảnh giấy xanh hình tam giác, bằng hai đốt ngón tay, quấn lẫn trong xấp tiền ướt ở túi áo ông Chín. In \"Ký hiệu 6K7 – Seri 0423\". Mép rách răng cưa, ố [[tra-da|trà đá]]. Chính là [[goc-seri|góc số seri]] của tờ vé.",
      detail: [["me", "Tờ vé rách làm hai. Phần thân bay đi, cái góc quý nhất thì ở lại với chủ.", "neutral"]],
    },
    "ve-ba-chin": {
      name: "Vé số bí mật của bà Chín",
      desc: "Tờ vé 120861 đài TP.HCM giấu trong ngăn kéo khoá của [[tui-vai|túi vải]] bà Chín. 120861 là ngày sinh ông Chín: 12/08/61.",
    },
  },

  words: {
    ongchin: { text: "ông Chín", kind: "ai" },
    bachin: { text: "bà Chín", kind: "ai" },
    mai: { text: "cô Mai", kind: "ai" },
    luc: { text: "anh Lực", kind: "ai" },
    chutu: { text: "chú Tư", kind: "ai" },
    chihen: { text: "chị Hên", kind: "ai" },

    "06h50": { text: "6 giờ 50", kind: "luc" },
    "07h18": { text: "7 giờ 18", kind: "luc" },
    "07h36": { text: "7 giờ 36", kind: "luc" },
    "07h38": { text: "7 giờ 38", kind: "luc" },
    "07h49": { text: "7 giờ 49", kind: "luc" },
    "07h58": { text: "7 giờ 58", kind: "luc" },
    "08h12": { text: "8 giờ 12", kind: "luc" },
    "08h30": { text: "8 giờ 30", kind: "luc" },
    "09h05": { text: "9 giờ 05", kind: "luc" },
    "09h40": { text: "9 giờ 40", kind: "luc" },

    nha: { text: "nhà ông Chín", kind: "o" },
    "tiem-chu-tu": { text: "tiệm chú Tư", kind: "o" },
    "xe-om": { text: "xe ôm của Lực", kind: "o" },
    "cong-cho": { text: "cổng chợ", kind: "o" },
    "sap-ca": { text: "sạp cá chị Lan", kind: "o" },
    "dai-ly": { text: "đại lý vé số", kind: "o" },
    "tui-ao": { text: "túi áo ông Chín", kind: "o" },

    "tra-da": { text: "trà đá", kind: "vat" },
    "goc-seri": { text: "góc số seri", kind: "vat" },
    "yen-da-beo": { text: "yên da beo", kind: "vat" },
    "ve-vinh-long": { text: "vé Vĩnh Long", kind: "vat" },
    "tui-vai": { text: "túi vải đi chợ", kind: "vat" },
    "ca-loc": { text: "con cá lóc", kind: "vat" },

    "dinh-yen": { text: "dính lên yên xe", kind: "cach" },
    "moc-tui": { text: "móc túi giữa chợ", kind: "cach" },
    "danh-trao": { text: "đánh tráo vé khác đài", kind: "cach" },
    "ghep-goc": { text: "ghép góc giả", kind: "cach" },
    "dot-ve": { text: "đốt vé", kind: "cach" },

    "no-gop-xe": { text: "nợ góp xe sắp bị thu xe", kind: "vi" },
    "ghet-me-so": { text: "ghét chồng mê số", kind: "vi" },
    "ke-so": { text: "mua ké số hên", kind: "vi" },
    "hen-chung": { text: "giữ số để hên chung", kind: "vi" },

    "230479": { text: "230479", kind: "khac" },
    "ngay-cuoi": { text: "ngày cưới", kind: "khac" },
    "xs-hcm": { text: "Xổ số TP.HCM", kind: "khac" },
    "doc-dac": { text: "giải độc đắc", kind: "khac" },
  },

  talks: {
    ongchin: [
      {
        id: "chuyen-ve",
        topic: "Kể về tờ vé số",
        lines: [
          ["ongchin", "Sáng qua tui mua của con [[mai|Mai]] bán dạo. Ngày nào tui cũng mở hàng cho nó, một tờ, đúng số ngày cưới.", "neutral"],
          ["ongchin", "Tối qua tui không dò. Tui có nguyên tắc: dò sáng hôm sau, ở đại lý chị Hên, cho hên.", "neutral"],
          ["me", "Ông cất vé ở đâu?", "neutral"],
          ["ongchin", "Túi áo ngực. Tui gói tiền đi chợ ở trong tờ vé, gấp làm tư. Tiền nằm trong vé thì tiền đẻ ra tiền.", "happy"],
          ["bachin", "Ba chục năm, tiền chưa đẻ được đồng nào. Chỉ có ổng đẻ ra cái tật.", "angry"],
          ["teo", "Vậy muốn trả tiền là phải mở tờ vé ra? Ông mở vé ra mười lần một buổi chợ luôn hả ông?", "shock"],
          ["ongchin", "Thì sao? Mỗi lần mở là một lần ngắm số. Hên gấp mười.", "smug"],
        ],
        gives: { people: ["mai"], words: ["ongchin"] },
      },
      {
        id: "lo-trinh",
        topic: "Sáng nay ông đi những đâu, mấy giờ?",
        lines: [
          ["ongchin", "[[06h50|6 giờ 50]] tui ra khỏi [[nha|nhà]]. Bả đưa cái danh sách đi chợ, tui bỏ túi quần.", "neutral"],
          ["ongchin", "Chạy Cub tới đầu chợ thì bể bánh. Tui dắt vô [[tiem-chu-tu|tiệm chú Tư]], chừng 7 giờ 15. Ngồi chờ một hồi, chú Tư nói phải thay ruột, lâu.", "neutral"],
          ["ongchin", "Tui kêu xe ôm trên app ra cổng chợ. Rồi mua cá ở sạp chị Lan, mua rau, gặp con Mai, rồi mới tới đại lý lúc 9 giờ 40.", "neutral"],
          ["me", "Cho tôi coi lịch sử chuyến xe.", "neutral"],
          ["ongchin", "Đây. Cái app này con tui cài. Nó nói \"tài xế 4,98 sao\". Tui không hiểu sao, mà nghe sang.", "neutral"],
          ["teo", "Anh tài xế tên [[luc|Lực]] nè sếp. Xe Wave xanh. Chưa được ông đánh giá luôn.", "neutral"],
          ["me", "Tèo, vẽ cho tôi cái lộ trình. Mỗi điểm một mốc giờ. Tờ vé rớt giữa hai điểm nào, ta sẽ biết.", "neutral"],
        ],
        gives: { clues: ["danh-sach-cho", "chuyen-xe-app"], people: ["luc", "chutu"], words: ["chutu", "xe-om"] },
      },
      {
        id: "nghi-ba",
        topic: "Sao ông nghi bà Chín?",
        lines: [
          ["ongchin", "Bả ghét tui mua số. Ba chục năm bả nói câu \"có ngày tui [[dot-ve|đốt vé]] của ông\".", "angry"],
          ["ongchin", "Sáng nay lúc tui gói tiền vô vé, bả đứng nhìn, bả lắc đầu, bả thở dài ba cái. Ba cái đó nghe như ba lời nguyền.", "nervous"],
          ["teo", "Bà Chín thở dài mà ông Chín đếm được. Thương nhau ghê.", "smug"],
          ["me", "Nhưng bà Chín không đi chợ cùng ông.", "neutral"],
          ["ongchin", "Thì... bả có phép. Bả là vợ tui. Vợ là có phép.", "nervous"],
        ],
        gives: { words: ["bachin", "ghet-me-so"] },
      },
      {
        id: "tui-ao",
        topic: "Cho tôi coi túi áo ông",
        needs: "clue:log-may-do",
        lines: [
          ["me", "Ông Chín, móc hết túi áo ngực ra. Từng thứ một. Đặt lên đây.", "neutral"],
          ["ongchin", "Có gì đâu. Kính lão nè. Xấp tiền ướt nè. Tờ 20, tờ 10, tờ 5 ngàn...", "neutral"],
          ["me", "Gỡ từng tờ tiền ra.", "neutral"],
          ["narr", "Giữa hai tờ 10 ngàn dính bết vào nhau, có một mảnh giấy xanh hình tam giác, nhỏ bằng hai đốt ngón tay."],
          ["me", "\"Ký hiệu 6K7 – Seri 0423\". Mép rách răng cưa, ố màu trà.", "neutral"],
          ["ongchin", "Ủa... tui tưởng giấy gói kẹo! Tui định vứt rồi đó!", "shock"],
          ["teo", "SẾP ƠI! Cái góc seri của tờ vé ở trong túi ông Chín từ đầu tới giờ! Người lượm được tờ vé đang cầm một tờ giấy không có góc!", "shock"],
          ["me", "Vé rách làm hai. Phần thân bay đi với người khác. Phần quý nhất ở lại với chủ. Ông Chín, đừng vứt bất cứ thứ gì nữa.", "neutral"],
        ],
        gives: { clues: ["goc-ve-rach"], words: ["tui-ao"] },
      },
      {
        id: "so-tien",
        topic: "Ông mua vé bao lâu rồi?",
        lines: [
          ["ongchin", "Ba chục năm. Từ hồi cưới bả. Mỗi ngày mười tờ, có ngày hai chục.", "neutral"],
          ["bachin", "Tui có ghi sổ. Tới tháng trước là một tỉ một trăm hai chục triệu. Tiền vé.", "angry"],
          ["ongchin", "Thì giờ trúng hai tỉ, lời gần gấp đôi!", "happy"],
          ["bachin", "Trúng thì đóng thuế mười phần trăm, còn một tỉ tám. Trừ một tỉ một tiền vé, còn bảy trăm triệu. Chia ba chục năm, mỗi năm lời hai chục triệu. Bằng tui bán xôi.", "angry"],
          ["teo", "Bà Chín tính nhẩm còn nhanh hơn máy dò số.", "shock"],
          ["ongchin", "...Mà đó là tui còn trúng. Còn chưa tìm ra vé.", "nervous"],
        ],
      },
    ],

    bachin: [
      {
        id: "sang-nay",
        topic: "Sáng nay bà thấy gì?",
        lines: [
          ["bachin", "Thấy ổng gói tiền vô tờ vé như gói bánh tét. Gấp làm tư, nhét túi áo ngực, vỗ vỗ hai cái.", "angry"],
          ["bachin", "Tui đưa danh sách đi chợ, ghi rõ \"KHÔNG MUA VÉ SỐ\". Ổng gật đầu. Ổng gật đầu ba chục năm rồi.", "angry"],
          ["me", "Sau đó bà ở đâu?", "neutral"],
          ["bachin", "Ở nhà. Lau nhà, nấu cơm, chờ con cá lóc ổng mua về. Tới giờ con cá còn chưa về.", "neutral"],
        ],
        gives: { words: ["bachin"] },
      },
      {
        id: "dai-ly",
        topic: "Sáng nay bà có ra chợ không?",
        lines: [
          ["bachin", "Ra chợ thì có, ghé mua bịch muối. Mà đại lý vé số thì không.", "neutral"],
          ["bachin", "Cả đời tui chưa bước chân vô [[dai-ly|đại lý vé số]] lần nào. Đó là cái hang hút tiền nhà tui.", "angry"],
          ["teo", "Bà Chín nói chắc như đinh đóng cột sếp.", "neutral"],
        ],
        gives: { stmts: ["bachin-khong-dai-ly"] },
      },
      {
        id: "dot-ve",
        topic: "Bà từng doạ đốt vé của ông?",
        lines: [
          ["bachin", "Doạ thì có. Đốt thì chưa. Đốt vé là đốt tiền, tiền nhà tui chứ bộ.", "angry"],
          ["bachin", "Mà nếu tui muốn lấy vé ổng, tui lấy lúc ổng ngủ, chứ đâu cần chạy theo ổng ra chợ cho mệt.", "smug"],
          ["teo", "Lập luận này... chặt thiệt.", "nervous"],
          ["me", "Bà có biết hôm nay ông trúng không?", "neutral"],
          ["bachin", "Tui biết lúc cả chợ biết. Lúc loa phường đọc tên ổng. Tui đang lựa muối, tui đứng hình luôn.", "shock"],
        ],
      },
      {
        id: "ve-bi-mat",
        topic: "Tờ vé 120861 của bà",
        needs: "broke:bachin-khong-dai-ly",
        lines: [
          ["bachin", "Thôi được. Tui mua. Mỗi tuần một tờ. Số ngày sinh ổng, 12 tháng 8 năm 61.", "nervous"],
          ["bachin", "Ổng mua số ngày cưới, tui mua số ngày sinh ổng. Lỡ ổng trúng thì tui cũng trúng, khỏi để ổng vênh mặt với tui.", "nervous"],
          ["bachin", "Ba năm nay. Chưa trúng đồng nào. Đừng nói với ổng nha. Tui mà bị ổng biết, ổng nhắc tới chết.", "nervous"],
          ["teo", "Ghét chồng mê số mà mua số ngày sinh chồng. Sếp ơi đây là phim tình cảm chứ đâu phải phim hình sự.", "shock"],
          ["bachin", "Mà tui thề, 9 giờ 05 tui dò xong là về liền. Tui không thấy tờ vé của ổng, không thấy ai hết.", "neutral"],
        ],
        gives: { clues: ["ve-ba-chin"], words: ["tui-vai"] },
      },
    ],

    mai: [
      {
        id: "hom-qua",
        topic: "Hôm qua cô bán vé cho ông Chín?",
        lines: [
          ["mai", "Dạ. Sáng nào ông cũng mở hàng cho em một tờ, đúng số [[230479]]. Năm năm rồi, chưa sót ngày nào.", "neutral"],
          ["mai", "Hôm qua ông trả tiền xong còn nói \"mai mà trúng tao bao cả chợ ăn hủ tiếu\".", "happy"],
          ["mai", "Giờ ông trúng thiệt mà mất vé. Em nghe loa mà em run luôn.", "nervous"],
          ["teo", "Cô bán đúng tờ trúng độc đắc! Cô được thưởng không cô?", "happy"],
          ["mai", "Được đại lý thưởng chút đỉnh, nếu có người lãnh. Mà không có vé thì không ai lãnh hết em ơi.", "nervous"],
        ],
        gives: { words: ["mai"] },
      },
      {
        id: "gap-ong-chin",
        topic: "Sáng nay cô có gặp ông Chín không?",
        lines: [
          ["mai", "Có. Chừng 8 giờ 30, ở rổ rau. Em mời ông mua vé ngày mai.", "neutral"],
          ["mai", "Ông vỗ túi áo nói \"để dò tờ hôm qua đã\". Em thấy túi ông cộm cộm, em tưởng vé còn.", "neutral"],
          ["teo", "Sếp! Cô Mai đứng sát ông Chín lúc 8 giờ 30! Cô Mai có tay nghề! Cô [[moc-tui|móc túi giữa chợ]]!", "shock"],
          ["mai", "Em bán vé số chứ em đâu có làm ảo thuật, em trai!", "angry"],
        ],
        gives: { words: ["moc-tui"] },
      },
      {
        id: "xap-ve",
        topic: "Cô còn giữ tờ nào số 230479 không?",
        lines: [
          ["mai", "Dạ không. Số đó em chỉ lấy đúng một tờ, bán cho ông Chín rồi. Em giữ làm gì.", "nervous"],
          ["mai", "Anh coi xấp vé em nè, toàn số khác. Không có tờ nào số đó hết.", "nervous"],
          ["teo", "Cô Mai trả lời nhanh quá sếp. Nhanh như người tập trước.", "smug"],
        ],
        gives: { stmts: ["mai-mot-to"] },
      },
      {
        id: "anh-xe-om",
        topic: "Sáng nay có ai hỏi cô chuyện gì lạ không?",
        needs: "talk:mai.gap-ong-chin",
        lines: [
          ["mai", "Lạ thì có một vụ. Chừng 8 giờ 25, trước khi em gặp ông Chín, có anh xe ôm áo xanh chạy tới hỏi.", "neutral"],
          ["mai", "Ảnh hỏi: \"Chị ơi, vé số rách mất cái góc thì đem đi lãnh được không chị?\"", "neutral"],
          ["mai", "Em nói không được, mất seri là công ty không trả. Ảnh đứng im một hồi, mặt xanh lè như cái áo.", "nervous"],
          ["me", "Cô có thấy mặt anh ta không?", "neutral"],
          ["mai", "Ảnh đội nón bảo hiểm, kéo kính xuống. Mà em nhớ cái yên xe: da beo. Cả chợ có đúng một chiếc da beo.", "neutral"],
          ["teo", "Yên da beo! Sếp ơi em nghe mà nổi da... beo!", "shock"],
        ],
        gives: { words: ["yen-da-beo"] },
      },
      {
        id: "bo-suu-tap",
        topic: "Bộ sưu tập vé 230479",
        needs: "broke:mai-mot-to",
        lines: [
          ["mai", "Em xin lỗi. Em sợ nói ra người ta nghi em đánh tráo vé của ông.", "nervous"],
          ["mai", "Ông Chín là khách mở hàng của em năm năm. Có ông là ngày đó em bán đắt. Nên ngày nào em cũng giữ một tờ số của ông, ở đài khác, để [[hen-chung|giữ số để hên chung]].", "nervous"],
          ["mai", "Em chưa trúng tờ nào. Tờ Vĩnh Long tuần trước em vo lại quăng đi, chắc lăn xuống gầm xe đẩy.", "nervous"],
          ["teo", "Năm năm giữ số của khách. Ông Chín ơi ông có fan cứng mà ông không biết.", "shock"],
          ["mai", "Đừng nói ông nha anh. Ông biết ông cười em.", "nervous"],
        ],
        gives: { words: ["hen-chung"] },
      },
    ],

    luc: [
      {
        id: "chuyen-xe",
        topic: "Chuyến xe chở ông Chín",
        lines: [
          ["luc", "Dạ em chở ông từ tiệm chú Tư ra cổng chợ. Mười một phút, đường đẹp, em chạy êm như ru.", "happy"],
          ["luc", "Ông xuống xe, trả tiền mặt, em chạy liền. Trên yên em không có gì hết, anh. Không có tờ giấy nào hết.", "neutral"],
          ["luc", "Mà anh ơi, anh nói ông Chín đánh giá em năm sao giùm em nha. Em đang 4,98, rớt xuống 4,97 là em mất thưởng tuần.", "nervous"],
          ["teo", "Ảnh lo cho cái sao hơn lo cho hai tỉ.", "smug"],
        ],
        gives: { stmts: ["luc-khong-thay"], words: ["luc"] },
      },
      {
        id: "sau-do",
        topic: "Thả ông Chín xong anh đi đâu?",
        lines: [
          ["luc", "Em nhận cuốc đi Quận 1 liền, chở một chị đi làm nail. Tới gần 9 giờ em mới về chợ.", "neutral"],
          ["luc", "Em không ghé đâu hết. Em không chơi vé số. Vé số là thuế của người nghèo, em đọc trên mạng.", "neutral"],
          ["teo", "Ảnh đọc trên mạng. Câu nói nguy hiểm nhất thế kỷ.", "smug"],
        ],
        gives: { stmts: ["luc-chay-q1"] },
      },
      {
        id: "yen-xe",
        topic: "Sao anh thay bọc yên gấp?",
        needs: "seen:garage.xe-dang-sua",
        lines: [
          ["luc", "Bọc yên rách, khách ngồi bị cấn. Bị khách chê là mất sao, anh.", "nervous"],
          ["me", "Rách một đường thẳng, như dao rọc. Tự rách thì không thẳng vậy.", "neutral"],
          ["luc", "Thì... em lỡ tay. Em gỡ cục kẹo cao su có ai dán lên. Khách bây giờ ghê lắm anh.", "nervous"],
          ["teo", "Kẹo cao su gì mà phải rạch nguyên một đường dài vậy anh? Kẹo cao su khủng long hả?", "smug"],
          ["luc", "Em... em bận chạy cuốc. Em đi được chưa anh?", "nervous"],
        ],
      },
      {
        id: "no-xe",
        topic: "Giấy báo nợ góp xe",
        needs: "clue:giay-bao-no",
        lines: [
          ["luc", "Anh lục cốp xe em hả?", "angry"],
          ["luc", "Ừ. Em nợ ba kỳ. Mẹ em nằm viện hồi tháng 8, em đóng viện phí, hết tiền góp. Ngày 30 người ta kéo xe.", "nervous"],
          ["luc", "Không có xe thì em chạy bằng gì? Bằng chân? App đâu có chở khách bằng chân, anh.", "angry"],
          ["teo", "Sếp... em thấy tội ảnh.", "nervous"],
          ["me", "Tội thì tội. Nhưng tờ vé không phải của anh ấy.", "neutral"],
        ],
      },
    ],

    chutu: [
      {
        id: "sang-nay",
        topic: "Sáng nay ông Chín tới lúc mấy giờ?",
        lines: [
          ["chutu", "Chừng 7 giờ 15. Dắt cái Cub bể bánh, mặt mày như mất sổ đỏ.", "neutral"],
          ["chutu", "Tui nhận xe thì chụp hình xe trước, để khách khỏi nói tui làm trầy. Nghề mà.", "neutral"],
          ["me", "Cho tôi coi tấm hình.", "neutral"],
          ["chutu", "Đây. [[07h18|7 giờ 18]]. Ông Chín đứng kế xe. Thấy cái túi áo không? Tờ vé ló ra cái góc xanh lè.", "neutral"],
          ["teo", "Ảnh chụp có giờ! Tờ vé còn trong túi lúc 7 giờ 18!", "happy"],
        ],
        gives: { clues: ["anh-nhan-xe"], words: ["chutu"] },
      },
      {
        id: "so-ve",
        topic: "Chú có biết số vé ông Chín không?",
        lines: [
          ["chutu", "Biết làm gì? Hai chục năm tui chửi ổng mê số. Số ổng tui không thèm biết.", "angry"],
          ["chutu", "Ổng trả tiền thì mở tờ vé ra móc tiền, tui quay mặt chỗ khác. Tui không coi.", "neutral"],
          ["teo", "Chú Tư quay mặt đi mà chú biết ông Chín mở vé ra. Quay mặt kiểu gì hay vậy chú.", "smug"],
        ],
        gives: { stmts: ["chutu-khong-biet-so"] },
      },
      {
        id: "xe-luc",
        topic: "Anh Lực đem xe tới lúc nào?",
        needs: "seen:garage.xe-dang-sua",
        lines: [
          ["chutu", "8 giờ 40. Thằng Lực chạy tới thở hồng hộc, nói \"chú thay bọc yên giùm con, gấp, con chờ\".", "neutral"],
          ["chutu", "Tui nói bọc da beo hết hàng, phải đặt, chiều mới có. Nó đứng gãi đầu một hồi rồi gửi xe, đi bộ ra chợ.", "neutral"],
          ["chutu", "Bình thường thằng đó cưng cái yên da beo như cưng bồ. Hôm nay đòi thay. Lạ.", "neutral"],
          ["me", "Lực bỏ xe lại, tức là hôm nay không chạy cuốc nữa.", "neutral"],
        ],
      },
      {
        id: "ke-so",
        topic: "Dòng \"230479 – mai mua ké\" trên bảng",
        needs: "broke:chutu-khong-biet-so",
        lines: [
          ["chutu", "Thì... tử vi nói năm nay tui nên \"đi theo người có số đỏ\".", "nervous"],
          ["chutu", "Hai chục năm ông Chín mua đúng một số. Tui nghĩ, số đó lì vậy chắc có ngày nổ. Tui tính mai mua ké một tờ. Đúng một tờ thôi.", "nervous"],
          ["chutu", "Ai dè nó nổ ngay hôm qua. Tui chậm đúng một ngày. Hai chục năm chê người ta, chậm một ngày.", "shock"],
          ["teo", "Chú Tư ơi, chú mới là người đau nhất vụ này.", "nervous"],
          ["chutu", "Đừng nói với ông Chín. Ổng biết thì ổng đem chuyện này ra cười tới đám giỗ tui.", "nervous"],
        ],
      },
    ],

    chilan: [
      {
        id: "sang-nay",
        topic: "Ông Chín mua cá lúc mấy giờ?",
        lines: [
          ["chilan", "[[07h58|7 giờ 58]]. Tui nhớ vì loa chợ vừa phát bài \"Tám giờ kém hai, mời bà con...\". Ông mua con cá lóc 1 ký 2.", "neutral"],
          ["chilan", "Ông móc túi áo ra trả, tiền ướt nhẹp, mùi trà. Tui còn hỏi \"ông tắm trà đá hả ông\".", "neutral"],
          ["me", "Ông ấy có mở tờ vé ra để lấy tiền như mọi ngày không?", "neutral"],
          ["chilan", "Không. Lạ ở chỗ đó. Bình thường ổng mở tờ vé ra khoe số rồi mới móc tiền. Hôm nay tiền rời, không có vé gói ngoài.", "neutral"],
          ["teo", "Vậy là tới 7 giờ 58 tờ vé đã bay rồi!", "shock"],
        ],
        gives: { words: ["07h58"] },
      },
      {
        id: "ca-loc",
        topic: "Cá lóc có ăn được giấy không?",
        lines: [
          ["chilan", "Ai hỏi câu này? À, thằng nhỏ áo vàng.", "angry"],
          ["chilan", "Cá lóc ăn cá, ăn ếch, ăn nhái. Không ăn giấy. Cá tui có học thức.", "angry"],
          ["teo", "Em xin rút lại giả thuyết [[ca-loc|con cá lóc]]. Em xin lỗi giới cá lóc.", "nervous"],
        ],
      },
      {
        id: "con-ca",
        topic: "Con cá của ông Chín đâu?",
        lines: [
          ["chilan", "Ổng mua xong gửi tui giữ, nói đi mua rau rồi quay lại lấy. Rồi ổng mất vé, xỉu, quên luôn con cá.", "neutral"],
          ["chilan", "Con cá vẫn ở trong thau nè. Nó sống khoẻ hơn ông Chín bây giờ.", "smug"],
          ["teo", "Bà Chín ở nhà chờ con cá từ sáng. Con cá thì ở đây chờ ông Chín. Ông Chín thì đi tìm vé. Một vòng luẩn quẩn.", "neutral"],
        ],
      },
    ],

    chihen: [
      {
        id: "sang-nay",
        topic: "Sáng nay ở đại lý có gì lạ?",
        lines: [
          ["chihen", "9 giờ 40 ông Chín tới, nhìn bảng, la một tiếng \"TRÚNG RỒI\" làm con mèo nhà bên rớt khỏi mái tôn.", "shock"],
          ["chihen", "Rồi ổng móc túi, mở xấp tiền, lục tới lục lui. Mặt ổng từ đỏ chuyển trắng chuyển xanh. Rồi ổng xỉu.", "nervous"],
          ["chihen", "Tui quạt cho ổng, bà Tư thì quay clip. Hên là ổng tỉnh.", "neutral"],
        ],
        gives: { words: ["09h40"] },
      },
      {
        id: "may-do",
        topic: "Người dò vé lúc 8 giờ 12",
        needs: "clue:log-may-do",
        lines: [
          ["chihen", "À, anh áo khoác xanh đó. Ảnh đặt tờ vé vô máy, máy hiện TRÚNG ĐẶC BIỆT, ảnh đứng chết trân.", "neutral"],
          ["chihen", "Tờ vé ảnh bị rách mất góc dưới, giấy nhăn nhúm như mới phơi. Ảnh hỏi tui có lãnh được không.", "neutral"],
          ["chihen", "Tui nói thiệt: mất góc seri thì công ty xổ số không trả, ai đem tới cũng vậy. Hên xui gì cũng phải có seri.", "neutral"],
          ["chihen", "Chừng 8 giờ 20 ảnh quay lại mượn cây kéo, nói cắt chỉ áo. Tui đưa. Lát sau thấy thùng vé ế của tui bị lục tung.", "angry"],
          ["teo", "Mượn kéo rồi thùng vé ế bị lục... Sếp ơi soi lại cái thùng vé cũ coi! Ảnh định làm gì với vé ế?", "shock"],
        ],
      },
      {
        id: "ve-ba",
        topic: "Bà dò vé lúc 9 giờ 05",
        needs: "clue:clip-0905",
        lines: [
          ["chihen", "Bà đó hả? Tuần nào cũng tới, sáng Chủ nhật, nón lá sụp tới cằm. Dò đúng một tờ, không trúng, đi.", "neutral"],
          ["chihen", "Tui không biết bả tên gì. Bả không bao giờ nói chuyện. Bả chỉ nói đúng một câu: \"đừng nói với ai\".", "neutral"],
          ["teo", "Nói với ai là nói với ai ta. Em đoán là nói với một ông nón kết.", "smug"],
        ],
      },
    ],
  },

  stmts: {
    "luc-khong-thay": {
      by: "luc",
      text: "Ông Chín xuống xe là em chạy liền. Trên [[yen-da-beo|yên xe]] em không có gì hết, không có tờ giấy nào.",
      break: {
        clue: "manh-ve-yen",
        lines: [
          ["me", "Mảnh giấy này kẹt trong đường rạch trên yên da beo của anh. In chữ \"KIẾN THIẾT TP.H\". Ố màu trà đá, đúng ly trà ông Chín làm đổ ở tiệm chú Tư.", "neutral"],
          ["luc", "...", "shock"],
          ["luc", "Thì... yên xe em chở cả chục người một ngày. Ai làm rớt giấy gì em đâu có biết!", "nervous"],
          ["me", "Rồi anh đem xe đi rạch yên, thay bọc gấp, ngay sau chuyến chở ông Chín.", "neutral"],
          ["luc", "Em... yên rách thì em thay. Vậy thôi mà anh.", "nervous"],
          ["teo", "Yên rách đúng chỗ có dính vé số. Cái yên này xui ghê.", "smug"],
        ],
        gives: { words: ["dinh-yen"], flags: ["ve-tren-yen"] },
      },
    },
    "luc-chay-q1": {
      by: "luc",
      text: "Thả ông Chín xong em chạy cuốc đi Quận 1 tới gần 9 giờ. Em không ghé đâu hết, em không chơi vé số.",
      break: {
        clue: "clip-0811",
        lines: [
          ["me", "Camera đại lý chị Hên, 8 giờ 11. Áo khoác xanh, nón xanh, và một chiếc Wave yên da beo, cả chợ có đúng một chiếc.", "neutral"],
          ["me", "8 giờ 12, máy dò ghi: vé 230479, trúng đặc biệt, mất góc seri. Quận 1 của anh nằm ngay đầu chợ hả?", "neutral"],
          ["luc", "...", "shock"],
          ["luc", "Em... em ghé dò dùm bạn. Bạn em nhờ.", "nervous"],
          ["teo", "Bạn anh tên gì? Có phải tên là \"Hai Tỉ\" không?", "smug"],
          ["luc", "Em... không nói nữa. Em có quyền im lặng không anh? Phim nói có.", "nervous"],
        ],
        gives: { words: ["08h12", "dai-ly"], flags: ["luc-o-dai-ly"] },
      },
    },
    "bachin-khong-dai-ly": {
      by: "bachin",
      text: "Cả đời tui chưa bước chân vô [[dai-ly|đại lý vé số]] lần nào.",
      break: {
        clue: "clip-0905",
        lines: [
          ["me", "Camera đại lý, 9 giờ 05. Đồ bộ, nón lá kéo sụp tới cằm, và cái túi vải này. Cái túi vải bà đang đeo.", "neutral"],
          ["bachin", "...Nón lá ai đội cũng giống nhau!", "angry"],
          ["me", "Máy dò ghi cùng giờ: vé 120861. Mười hai tháng tám năm sáu mốt.", "neutral"],
          ["bachin", "...", "shock"],
          ["ongchin", "Ủa... ngày sinh tui mà?", "shock"],
          ["bachin", "Ông im! Ông đi chỗ khác! Thám tử, cho tui nói riêng.", "nervous"],
        ],
        gives: { words: ["09h05"], flags: ["ba-chin-mua-so"] },
      },
    },
    "chutu-khong-biet-so": {
      by: "chutu",
      text: "Tui không thèm biết số vé của ông Chín. Ổng mở vé là tui quay mặt chỗ khác.",
      break: {
        clue: "lich-hen",
        lines: [
          ["me", "Bảng lịch hẹn của chú. Sát lề, chữ nhỏ: \"230479 – mai mua ké\". Không biết số mà chép đúng sáu chữ số.", "neutral"],
          ["chutu", "...Cái bảng đó ai viết vậy ta. Chắc thằng học việc.", "nervous"],
          ["me", "Tiệm chú không có học việc. Chú đi một mình hai chục năm.", "neutral"],
          ["chutu", "Thôi được! Tui chép! Mà tui chép để mua ké, chứ tui đâu có lấy vé ổng!", "angry"],
          ["chutu", "[[07h36|7 giờ 36]] ổng mở tờ vé ướt nhẹp ra móc 30 ngàn trả tui. Tui liếc thấy số, tui chép. Rồi ổng gói lại, nhét túi áo, ra lề đường lên xe ôm. Vé còn nguyên trong túi ổng!", "angry"],
          ["teo", "Vậy 7 giờ 36 vé còn. 7 giờ 38 ông Chín lên xe ôm. Khít rịt luôn sếp!", "shock"],
        ],
        gives: { words: ["ke-so", "07h36"], flags: ["chu-tu-ke"] },
      },
    },
    "mai-mot-to": {
      by: "mai",
      text: "Số 230479 em chỉ lấy đúng một tờ, bán cho ông Chín rồi. Em không giữ tờ nào số đó.",
      break: {
        clue: "so-phat-ve",
        lines: [
          ["me", "Sổ phát vé của chị Hên, trang của cô: số 230479, đài TP.HCM một tờ bán ông Chín. Còn Long An, Bến Tre, Vĩnh Long, Đồng Nai... mỗi đài một tờ.", "neutral"],
          ["me", "Cô lấy số này ở cả chục đài, mỗi ngày, năm năm nay. Chị Hên có ghi chú hẳn hoi.", "neutral"],
          ["mai", "...", "shock"],
          ["teo", "Á à! Cô [[danh-trao|đánh tráo vé khác đài]]! Đưa ông Chín tờ Vĩnh Long, giữ tờ TP.HCM!", "shock"],
          ["mai", "Không có! Tờ TP.HCM em bán cho ông thiệt, hôm qua, ông còn cầm lên đọc số! Mấy tờ kia là của em, em giữ chơi!", "nervous"],
        ],
        gives: { words: ["danh-trao"], flags: ["mai-giu-so"] },
      },
    },
  },

  present: {
    ongchin: {
      "goc-ve-rach": [
        ["ongchin", "Cái góc này mà tui vứt đi là mất hai tỉ hả? Trời đất ơi. Tui suýt lấy nó xỉa răng.", "shock"],
      ],
      "ve-ba-chin": [
        ["ongchin", "Ngày sinh tui... Bả mua ngày sinh tui ba năm nay mà không nói...", "shock"],
        ["ongchin", "Thôi tui không nói gì hết. Tui đi lau kính.", "nervous"],
      ],
      "danh-sach-cho": [
        ["ongchin", "\"Không mua vé số\" gạch chân ba lần. Hôm nay tui đâu có mua. Tui chỉ... mất.", "nervous"],
      ],
      "giay-bao-no": [
        ["ongchin", "Thằng nhỏ xe ôm đó hả... Mẹ nó nằm viện. Tội nghiệp.", "nervous"],
        ["ongchin", "Mà tội nghiệp thì nói tui một tiếng, chứ sao...", "angry"],
      ],
    },
    bachin: {
      "danh-sach-cho": [
        ["bachin", "Thấy chưa? Ghi rõ rành rành. Mà ổng có nghe đâu.", "angry"],
        ["bachin", "Mà thôi... cá lóc ổng cũng chưa mua về. Cái gì ổng cũng không về.", "nervous"],
      ],
      "ket-qua-xs": [
        ["bachin", "Hai ba không bốn bảy chín. Ngày cưới tui.", "nervous"],
        ["bachin", "Ba chục năm đem ngày cưới đi đánh số... rồi nó trúng thiệt. Không biết nên mừng hay nên giận.", "shock"],
      ],
      "clip-0811": [
        ["bachin", "Thằng nhỏ yên da beo đó. Nó chở tui đi chợ hoài, lễ phép lắm. Đừng nói là nó nha.", "shock"],
      ],
    },
    mai: {
      "ket-qua-xs": [
        ["mai", "Em bán năm năm, lần đầu bán trúng độc đắc. Mà lại là tờ của ông Chín. Em không biết nên khóc hay nên cười.", "nervous"],
      ],
      "ve-e-cat-goc": [
        ["mai", "Cắt góc vé ế để dán vô vé trúng hả? Trời ơi, seri mỗi tờ mỗi khác, dán vô là đại lý biết liền.", "shock"],
        ["mai", "Ai mà làm vậy chắc là người... chưa từng chơi vé số.", "neutral"],
      ],
      "clip-0811": [
        ["mai", "Yên da beo! Đúng anh này hỏi em vé rách góc!", "shock"],
      ],
    },
    luc: {
      "ket-qua-xs": [
        ["luc", "230479... Em... em không có nhìn bảng kết quả. Em không chơi vé số.", "nervous"],
        ["teo", "Ảnh không nhìn mà ảnh nhớ số. Thần đồng.", "smug"],
      ],
      "goc-ve-rach": [
        ["luc", "...Cái góc này ở đâu ra?", "shock"],
        ["luc", "Trong túi ông Chín hả? Từ sáng tới giờ?", "shock"],
        ["luc", "Vậy mà em...", "nervous"],
      ],
      "ly-tra-da": [
        ["luc", "Trà đá hả anh? Em thích trà đá. Ai mà không thích trà đá. Trà đá đâu có tội.", "nervous"],
      ],
      "chuyen-xe-app": [
        ["luc", "Đúng chuyến em. Mười một phút. Ông Chín ơi, ông đánh giá giùm em năm sao nha ông.", "nervous"],
        ["ongchin", "Để tìm ra vé đã rồi tính.", "angry"],
      ],
    },
    chutu: {
      "anh-nhan-xe": [
        ["chutu", "Hình tui chụp đó. Đẹp không? Tui chụp xe mà ông Chín cứ chen vô khung hình.", "smug"],
      ],
      "giay-bao-no": [
        ["chutu", "Thằng Lực nợ góp hả... Hèn chi tháng rồi nó xin tui ghi sổ tiền vá xe.", "nervous"],
        ["chutu", "Nó hiền mà. Nó không làm bậy đâu. ...Mà nó đòi thay yên gấp thì cũng lạ thiệt.", "neutral"],
      ],
      "ve-vinh-long": [
        ["chutu", "Số ông Chín, đài Vĩnh Long. Cái số đó đi đâu cũng gặp. Như cái nợ.", "neutral"],
      ],
    },
    chihen: {
      "goc-ve-rach": [
        ["chihen", "Ký hiệu 6K7, seri 0423! Để tui coi sổ nhận vé từ công ty... Đúng rồi! Lô này tui giao cho Mai hôm qua!", "shock"],
        ["chihen", "Có cái góc này với phần thân ghép lại khớp mép rách là lãnh được. Hên quá trời hên!", "happy"],
      ],
      "ve-e-cat-goc": [
        ["chihen", "Tờ vé ế của tui! Cắt góc là hết trả về công ty được. Ai đền tui đây?", "angry"],
      ],
    },
  },

  wrong: {
    bachin: [
      [["bachin", "Cái gì đây? Ông thám tử này cũng mê tín giống ông nhà tui hả?", "angry"]],
      [["bachin", "Đưa sai rồi. Ba chục năm tui coi ổng dò số, tui biết thế nào là trật.", "neutral"]],
      [["bachin", "Thôi đi về nấu cơm đi. Cá lóc còn chưa thấy đâu mà ông bày đặt.", "angry"], ["teo", "Bà Chín đuổi luôn thám tử. Bả mạnh thiệt.", "nervous"]],
    ],
    mai: [
      [["mai", "Anh ơi cái này em không hiểu. Em chỉ hiểu số với tiền thối thôi.", "nervous"]],
      [["mai", "Trật rồi anh. Mà trật thì mua thêm tờ nữa, biết đâu trúng.", "neutral"], ["teo", "Cô Mai bán hàng cả lúc bị thẩm vấn.", "smug"]],
      [["mai", "Anh đưa vậy là \"trật lất\" rồi. Giống vé tháng trước của ông Chín.", "neutral"]],
    ],
    luc: [
      [["luc", "Cái này đâu liên quan em. Anh đánh giá em một sao vì cái này hả?", "nervous"]],
      [["luc", "Anh ơi anh đi lạc đường rồi. Để em mở app chỉ đường cho anh.", "neutral"]],
      [["luc", "Em chạy xe chứ em đâu có chạy tội. Anh đưa cái khác đi.", "angry"]],
      [["luc", "(nhìn đồng hồ) Em lỡ ba cuốc rồi đó anh.", "nervous"], ["teo", "Xe ảnh nằm tiệm chú Tư mà ảnh lỡ cuốc gì.", "smug"]],
    ],
    chutu: [
      [["chutu", "Đưa cái gì vậy? Bể bánh thì tui vá, bể lập luận thì tui chịu.", "smug"]],
      [["chutu", "Sai bét. Như vặn ốc ngược chiều. Càng vặn càng lỏng.", "neutral"]],
      [["chutu", "Thám tử mà vậy hả? Thôi để tui coi tử vi cho, có khi lẹ hơn.", "angry"]],
    ],
  },

  deduction: [
    {
      id: "lo-trinh",
      text: "Lúc {a}, ông Chín còn mở tờ vé ra trả tiền chú Tư. Lúc {b} trả tiền cá, tiền đã không còn gói trong vé. Giữa hai mốc đó, ông chỉ ngồi trên {c}.",
      blanks: {
        a: { answer: "07h36", kind: "luc" },
        b: { answer: "07h58", kind: "luc" },
        c: { answer: "xe-om", kind: "o" },
      },
      explain: [
        ["me", "6 giờ 50 rời nhà. 7 giờ 18 tiệm chú Tư, vé còn trong túi, có hình. 7 giờ 36 ông còn mở vé ra trả tiền vá xe.", "neutral"],
        ["me", "7 giờ 38 tới 7 giờ 49 trên xe ôm. 7 giờ 58 ở sạp cá, tiền còn mà vé đã mất.", "neutral"],
        ["me", "Ai gặp ông sau 7 giờ 58, như cô Mai lúc 8 giờ 30 ở rổ rau, đều tới trễ. Khả nghi cỡ nào cũng không thể là người lấy.", "neutral"],
        ["teo", "Lộ trình sáu điểm mà thủ phạm nằm gọn trong mười một phút. Sếp vẽ bản đồ còn đẹp hơn app!", "happy"],
      ],
    },
    {
      id: "cach-roi",
      text: "Ly {a} đổ làm vé ướt sũng. Lúc ông Chín đếm tiền trả xe, tờ vé {b}, bị giật rách và mất {c}.",
      blanks: {
        a: { answer: "tra-da", kind: "vat" },
        b: { answer: "dinh-yen", kind: "cach" },
        c: { answer: "goc-seri", kind: "vat" },
      },
      explain: [
        ["me", "Ông Chín đặt cục tiền ướt lên yên để gỡ tờ 15 ngàn. Giấy vé ướt dính chặt vào yên nhựa.", "neutral"],
        ["me", "Ông giật xấp tiền lên. Góc vé dính theo xấp tiền vào lại túi áo. Phần thân ở lại trên yên da beo.", "neutral"],
        ["me", "Mảnh vé trên yên và góc vé trong túi áo cùng ố một màu trà đá, cùng một tờ.", "neutral"],
      ],
    },
    {
      id: "noi-doi",
      text: "{a} khai trên yên không có gì và sáng nay chạy đi Quận 1. Thật ra lúc {b}, anh đem tờ vé tới {c} để dò.",
      blanks: {
        a: { answer: "luc", kind: "ai" },
        b: { answer: "08h12", kind: "luc" },
        c: { answer: "dai-ly", kind: "o" },
      },
      explain: [
        ["me", "Camera đại lý thấy yên da beo lúc 8 giờ 11. Máy dò ghi tờ 230479 trúng đặc biệt lúc 8 giờ 12, cảnh báo mất góc seri.", "neutral"],
        ["me", "Không có cuốc Quận 1 nào cả. Chỉ có một tờ vé dính trên yên, và một người biết nó đáng giá hai tỉ.", "neutral"],
      ],
    },
    {
      id: "dong-co",
      text: "Thủ phạm là {a}. Anh giữ tờ vé vì {b}, nhưng không lãnh được vì góc seri vẫn nằm trong {c}.",
      blanks: {
        a: { answer: "luc", kind: "ai" },
        b: { answer: "no-gop-xe", kind: "vi" },
        c: { answer: "tui-ao", kind: "o" },
      },
      explain: [
        ["me", "Ba kỳ góp xe, ngày 30 bị kéo xe. Một tờ vé 2 tỉ rơi xuống yên, đúng lúc người ta tuyệt vọng nhất.", "neutral"],
        ["me", "Nhưng không có góc seri thì tờ vé không lãnh được. Mà cái góc thật đã theo xấp tiền ướt nằm trong túi áo ông Chín từ 7 giờ 49.", "neutral"],
        ["teo", "Người cầm vé không có góc. Người có góc không biết mình có. Hai tỉ bị xé làm hai.", "shock"],
      ],
    },
  ],

  finale: {
    culprit: "luc",
    intro: [
      ["narr", "12 giờ trưa. Trước Đại Lý Vé Số Hên, cả chợ bu đen. Bà Tư đứng trên ghế nhựa livestream, chú Ba dân phòng vừa tới, miệng còn dính hành lá."],
      ["chuba", "Chú tới rồi! Hủ tiếu ngon nên chú tới hơi trễ!", "happy"],
      ["me", "Sáng nay tờ vé đi một vòng chợ. Từ túi áo ông Chín, qua ly trà đá, lên một cái yên xe. Rồi tới đây, lúc 8 giờ 12.", "neutral"],
      ["teo", "Em biết rồi! Thủ phạm là người... có yên xe!", "smug"],
      ["me", "Cả chợ ai cũng có yên xe, Tèo.", "neutral"],
      ["me", "Anh Lực. Tờ vé đang ở đâu?", "neutral"],
    ],
    steps: [
      {
        claim: [
          ["luc", "Em chở ông Chín mười một phút, ông xuống, em chạy. Trên yên em không có gì hết!", "angry"],
          ["luc", "Anh lấy gì nói em lấy vé?", "nervous"],
        ],
        answer: "manh-ve-yen",
        right: [
          ["me", "Mảnh giấy xanh in chữ \"KIẾN THIẾT TP.H\", kẹt trong đường rạch trên yên da beo của anh. Ố trà đá, đúng ly trà ông Chín làm đổ.", "neutral"],
          ["me", "Vé ướt dính lên yên. Anh cạy nó ra, rồi rạch luôn bọc yên cho mất dấu.", "neutral"],
          ["luc", "...", "nervous"],
        ],
        wrong: [["luc", "Cái đó thì nói lên được gì? Anh đánh giá em một sao vì cảm tính hả?", "angry"]],
        hint: "Sếp ơi, ảnh nói yên xe sạch trơn. Mà mình soi đường may yên da beo ở tiệm chú Tư thấy cái gì ta?",
      },
      {
        claim: [
          ["luc", "Mảnh giấy đó dính từ hồi nào ai biết! Sáng nay em chạy cuốc Quận 1, em không ghé đại lý nào hết!", "angry"],
          ["luc", "Em không chơi vé số. Em đâu có biết dò!", "nervous"],
        ],
        answer: "clip-0811",
        right: [
          ["me", "Camera đại lý, 8 giờ 11. Áo xanh, nón xanh, chiếc Wave yên da beo đậu ngay cửa. Một phút sau, máy dò ghi tờ 230479 trúng đặc biệt.", "neutral"],
          ["chihen", "Đúng ảnh! Ảnh còn mượn cây kéo của tui!", "angry"],
          ["luc", "...", "shock"],
        ],
        wrong: [["luc", "Thấy chưa, anh có gì đâu. Em về chạy cuốc đây.", "neutral"], ["teo", "Xe ảnh nằm tiệm chú Tư mà ảnh về chạy cuốc gì sếp.", "smug"]],
        hint: "Ảnh nói không ghé đại lý. Mà camera đại lý thấy cái yên gì đậu trước cửa lúc 8 giờ 11?",
      },
      {
        claim: [
          ["luc", "Thì em có ghé dò! Nhưng đó là vé em! Em mua ở chỗ khác, trùng số thôi!", "angry"],
          ["luc", "Ông Chín lấy gì chứng minh tờ vé đó của ổng? Trên vé đâu có ghi tên ổng!", "nervous"],
        ],
        answer: "goc-ve-rach",
        right: [
          ["me", "Trên vé không ghi tên. Nhưng có ghi seri. Và cái góc có seri đang ở đây: \"6K7 – 0423\", tìm thấy trong túi áo ông Chín, quấn giữa xấp tiền ướt.", "neutral"],
          ["chihen", "Lô 6K7 tui giao cho Mai hôm qua, Mai bán cho ông Chín. Sổ tui ghi rõ!", "neutral"],
          ["me", "Đem phần thân tờ vé của anh ra đây, ghép thử. Nếu mép rách khớp, thì không có chuyện trùng số.", "neutral"],
          ["luc", "Cái góc... ở trong túi ổng... từ đầu tới giờ?", "shock"],
        ],
        wrong: [["luc", "Đó! Không có gì chứng minh hết! Vé trùng số là chuyện thường!", "angry"], ["mai", "Anh ơi số này em biết ai mua mà...", "nervous"]],
        hint: "Vé không có tên chủ, nhưng có seri. Mà cái góc seri đang nằm ở đâu ta? Ông Chín móc túi ra thấy gì?",
      },
      {
        claim: [
          ["luc", "Ừ thì... em lượm được. Lượm được đồ rớt đâu phải ăn cắp!", "angry"],
          ["luc", "Mà vé mất góc là giấy lộn. Em giữ giấy lộn thì có tội gì? Em định trả mà chưa kịp!", "nervous"],
        ],
        answer: "ve-e-cat-goc",
        right: [
          ["me", "Người định trả thì không mượn kéo lục thùng vé ế, cắt góc seri của một tờ vé Bến Tre.", "neutral"],
          ["me", "Anh định ghép góc giả để lãnh hai tỉ. Không phải giữ giấy lộn. Là chuẩn bị lãnh tiền của người khác.", "neutral"],
          ["chihen", "Vé ế của tui bị cắt mất góc, giờ trả công ty không được nữa!", "angry"],
          ["narr", "Lực tháo nón bảo hiểm. Lần đầu tiên trong ngày, người ta thấy rõ mặt anh."],
        ],
        wrong: [["luc", "Đó, giấy lộn mà. Ai bắt người giữ giấy lộn?", "nervous"], ["chutu", "Thám tử ơi đưa cái khác đi, tui thấy thằng nhỏ sắp thoát kìa!", "nervous"]],
        hint: "Ảnh nói định trả. Người định trả thì đâu cần mượn kéo, lục thùng vé ế ở đại lý làm gì?",
      },
    ],
    confess: [
      ["luc", "Dạ. Em xin lỗi.", "nervous"],
      ["luc", "Tám giờ, em đậu chờ cuốc ở cổng chợ, thấy tờ giấy xanh dính trên yên. Em cạy ra, thấy vé số hôm qua. Em tính quăng.", "nervous"],
      ["luc", "Mà em nhìn số. Em chạy qua đại lý dò thử cho vui. Máy kêu trúng đặc biệt. Em đứng không nổi.", "shock"],
      ["luc", "Em nhớ tới tờ giấy báo nợ. Nhớ tới mẹ em còn uống thuốc. Ngày 30 người ta kéo xe. Hai tỉ nằm trong tay em.", "nervous"],
      ["luc", "Chị Hên nói mất góc thì không lãnh được. Em mượn kéo, cắt góc vé ế, tính dán vô. Em ngu tới mức không biết mỗi tờ một seri.", "nervous"],
      ["luc", "Rồi em sợ. Em đi rạch yên, thay bọc. Em nói dối anh. Em nói dối ông Chín, người mà mỗi lần đi xe em đều cho em thêm năm ngàn.", "nervous"],
      ["narr", "Lực mở lớp lót nón bảo hiểm. Bên trong là tờ vé xanh nhăn nhúm, ố trà, thiếu một góc."],
      ["me", "Ghép thử đi, chị Hên.", "neutral"],
      ["chihen", "Khớp! Khớp từng răng cưa! Hên quá trời hên!", "happy"],
      ["ongchin", "...", "shock"],
    ],
    epilogue: [
      ["ongchin", "Hai tỉ. Ba chục năm. Cuối cùng cũng trúng.", "happy"],
      ["bachin", "Trừ thuế còn một tỉ tám. Trừ một tỉ một tiền vé ba chục năm. Còn bảy trăm triệu. Ông tính lời không?", "neutral"],
      ["ongchin", "...Bà đừng tính nữa. Tui biết rồi. Cả chợ này mua số mỗi ngày, ba chục năm mới có một người trúng. Là tui. Còn mấy chục ngàn người kia thì sao?", "nervous"],
      ["ongchin", "Tui nghỉ. Trúng rồi thì nghỉ. Hên một lần là đủ, mê thêm là xui cả đời.", "neutral"],
      ["bachin", "Ông nói thì nhớ đó. Tui có ghi âm.", "neutral"],
      ["ongchin", "Còn bà... sáng Chủ nhật nào cũng đội nón lá sụp tới cằm ra đại lý dò số ngày sinh tui. Bà tưởng tui không biết hả? Ba chục năm, tui nhận ra bà bằng cái dáng đi.", "smug"],
      ["bachin", "...Ông biết mà ông im?!", "shock"],
      ["ongchin", "Thì tui chờ coi bà trúng trước hay tui trúng trước. Giờ tui trúng rồi, bà nghỉ luôn nha.", "happy"],
      ["teo", "Sếp ơi... hai ông bà chơi trò trốn tìm ba năm bằng vé số.", "shock"],
      ["ongchin", "Lực. Bảy triệu tư tiền góp xe, tui trả. Không phải thưởng vì lượm được. Là vì cái vé đó tui làm rớt, mà mẹ con thì cần con chạy xe.", "neutral"],
      ["luc", "Ông ơi... con không dám nhận...", "shock"],
      ["ongchin", "Nhận. Rồi xin lỗi chị Hên vụ tờ vé ế. Lần sau lượm được gì thì đem tới phường, đừng đem tới đại lý.", "neutral"],
      ["chuba", "Đúng rồi. Phường mở cửa tới 5 giờ. Chú trực tới 4 giờ rưỡi.", "neutral"],
      ["ongchin", "Mai. Từ mai tui không mua số nữa. Mà sáng nào tui cũng ghé, mua giùm con ly cà phê, cho con mở hàng kiểu khác.", "neutral"],
      ["mai", "Ông ơi... em còn mười mấy tờ số của ông đài khác chưa xổ...", "nervous"],
      ["ongchin", "Thì trả lại đại lý. Hên của tui đủ rồi, hên của con để dành mở cái xe cà phê.", "happy"],
      ["chutu", "(xoá dòng \"230479 – mai mua ké\" trên bảng) ...Tui không có chép gì hết nha.", "nervous"],
      ["chilan", "Ông Chín ơi! Con cá lóc của ông! Nó còn sống!", "happy"],
      ["bachin", "Cuối cùng cũng có thứ ông mang về nhà được.", "smug"],
      ["batu", "Bà Tư đã đăng: \"TỜ VÉ BỐC HƠI: hai tỉ, một ly trà đá và một cái yên da beo\". Ba ngàn like rồi!", "happy"],
    ],
    comments: [
      { by: "batu", text: "Kết luận vụ án: ly trà đá 3 ngàn suýt làm mất 2 tỉ. Bà con uống trà đá nhớ cầm chắc tay 🧊😱", likes: 3812 },
      { by: "Hùng Xe Ôm", text: "Anh em xe ôm ơi, lượm được gì trên yên thì trả khách nha. Một sao không đáng sợ bằng mất lương tâm 🛵", likes: 2234 },
      { by: "Cô Ba Bán Xôi", text: "Tui đã nói mà: 30 năm tiền vé hơn 1 tỉ. Trúng xong lời 700 triệu. Mà cả chợ này còn mấy ngàn người chưa trúng lần nào 😶", likes: 2987 },
      { by: "Tiểu Thư Bánh Bèo 2k5", text: "Ông mua số ngày cưới, bà mua số ngày sinh ông 😭 ghét nhau kiểu gì mà thương dữ vậy", likes: 4120 },
      { by: "Chị Hai Kế Toán Q3", text: "Trúng số trên 10 triệu đóng thuế 10% nha mọi người. Ông Chín tỉnh táo hơn nhiều người trẻ: trúng rồi thì NGHỈ 👏", likes: 1876 },
      { by: "Đại Lý Vé Số Hên (Official)", text: "Đại lý xin nhắc: vé rách mất seri thì không lãnh được. Mà cắt góc vé ế ghép vô thì càng không. Đừng ai thử nữa nha 🙏", likes: 1450 },
      { by: "Shop Ví Da Chống Mất Đồ", text: "Ví da ngăn bấm nút, chống trà đá, chống dính yên. Ông Chín mua đi ông 👛", likes: 612 },
      { by: "Chú Tư Sửa Xe", text: "Tui không có chép số ai hết. Tấm bảng lịch hẹn đã lau sạch. Ai chụp màn hình thì xoá giùm 🔧", likes: 2310 },
      { by: "Fan Cứng Bọc Yên Da Beo", text: "Bọc yên da beo vừa là thương hiệu vừa là bằng chứng. Ai chạy xe ôm muốn ẩn danh thì đừng bọc da beo 🐆", likes: 1543 },
      { by: "Người Từng Mê Số 20 Năm", text: "Tui mua 20 năm chưa trúng giải nào hơn 100 ngàn. Đọc vụ này xong tui nghỉ luôn. Tiền đó để đi du lịch với vợ còn hơn 🥲", likes: 3266 },
      { by: "Cá Lóc Sạp Chị Lan", text: "Tui bị nghi oan một buổi sáng. Tui không ăn giấy. Tui có học thức 🐟", likes: 2788 },
      { by: "teo", text: "Em đoán cá lóc. Sai. Nhưng em đúng ở chỗ: con cá lóc là thứ duy nhất ông Chín mang về được 😤", likes: 977 },
      { by: "chuba", text: "Nhắc bà con: lượm được của rơi thì nộp phường, có biên nhận đàng hoàng. Chú trực tới 4 giờ rưỡi (trừ giờ ăn hủ tiếu)", likes: 1198 },
    ],
  },

  hints: [
    {
      needs: ["clue:goc-ve-rach", "clue:clip-0811", "clue:manh-ve-yen", "clue:giay-bao-no"],
      text: "Sếp ơi đủ đồ rồi! Mốc giờ, mảnh vé trên yên, camera 8 giờ 11, cái góc seri trong túi ông Chín. Ra bảng suy luận xếp lại lộ trình rồi chốt đi sếp!",
    },
    {
      needs: "clue:log-may-do",
      done: "clue:goc-ve-rach",
      text: "Máy dò nói tờ vé trúng bị mất góc seri. Góc đó rách ra thì đi đâu ta? Hay là... sếp bảo ông Chín móc hết túi áo ra coi thử?",
    },
    {
      needs: ["stmt:luc-khong-thay", "seen:garage.xe-dang-sua"],
      done: "clue:manh-ve-yen",
      text: "Anh Lực nói trên yên không có gì. Mà cái yên da beo đang nằm tiệm chú Tư, bị rạch một đường. Sếp soi kỹ đường rạch đó đi!",
    },
    {
      needs: "stmt:luc-chay-q1",
      done: "clue:clip-0811",
      text: "Anh Lực nói chạy Quận 1. Mà đại lý chị Hên có máy dò số với camera đó sếp. Coi lịch sử máy dò trước rồi tua camera.",
    },
    {
      needs: ["clue:anh-nhan-xe", "clue:tien-uot"],
      done: "talk:luc.chuyen-xe",
      text: "7 giờ 18 vé còn, 7 giờ 58 vé mất. Ở giữa có tiệm chú Tư với chuyến xe ôm. Coi lịch hẹn tiệm chú Tư ghi ông Chín đi lúc mấy giờ, rồi hỏi anh tài xế Lực coi chuyến xe đó có gì.",
    },
    {
      needs: "talk:ongchin.lo-trinh",
      done: { all: ["clue:anh-nhan-xe", "clue:tien-uot"] },
      text: "Lộ trình có sáu điểm. Sếp tìm coi điểm nào chắc chắn vé còn, điểm nào chắc chắn mất. Chú Tư có chụp hình xe, chị Lan bán cá có nhận tiền.",
    },
    {
      needs: "stmt:bachin-khong-dai-ly",
      done: "broke:bachin-khong-dai-ly",
      text: "Bà Chín thề chưa từng vô đại lý. Mà camera đại lý quay hết sáng nay đó sếp. Nhớ coi tới đoạn 9 giờ.",
    },
    {
      text: "Em đoán là con cá lóc. Đùa thôi... một nửa. Sếp hỏi ông Chín sáng nay đi những đâu, mấy giờ. Vé mất ở giữa hai điểm nào là ra.",
    },
  ],

  bonus: [
    {
      id: "so-ve",
      q: "Số 230479 của ông Chín có ý nghĩa gì?",
      choices: ["Ngày cưới của ông bà Chín", "Ngày sinh của ông Chín", "Biển số xe Cub", "Số nhà của cô Mai"],
      answer: 0,
      explain: "23 tháng 4 năm 79, ngày cưới. Còn số 120861 là ngày sinh ông Chín, số bà Chín lén mua mỗi tuần.",
    },
    {
      id: "tra-da",
      q: "Vì sao tờ vé dính lại trên yên xe ôm?",
      choices: ["Vé bị ướt trà đá ở tiệm chú Tư", "Lực bôi keo lên yên", "Trời mưa", "Kẹo cao su của khách trước"],
      answer: 0,
      explain: "7 giờ 25 ông Chín làm đổ ly trà đá lên ngực áo. Giấy vé ướt đặt lên yên nhựa thì dính chặt, giật xấp tiền là rách.",
    },
    {
      id: "lai-lo",
      q: "Theo sổ bà Chín, trúng 2 tỉ xong ông Chín thật sự \"lời\" khoảng bao nhiêu sau 30 năm mua vé?",
      choices: ["Khoảng 700 triệu", "2 tỉ", "1 tỉ 8", "Lỗ 1 tỉ 1"],
      answer: 0,
      explain: "2 tỉ trừ 10% thuế còn 1 tỉ 8, trừ 1 tỉ 1 tiền vé 30 năm, còn khoảng 700 triệu. Và đó là khi trúng. Hầu hết người mua vé cả đời không trúng.",
    },
  ],
};
