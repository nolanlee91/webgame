// Vụ 3: "Ly Trà Sữa Văn Phòng" (độ khó 2). Hợp đồng nhân vật / cảnh / đồ vật: docs/tham-tu-hem/DESIGN.md §3.
// Lời giải (KHÔNG hiện cho người chơi):
//   Thủ phạm: Phong (IT). 13:01 vào phòng server bằng chìa khoá cơ (không quẹt thẻ, log không có tên),
//   13:02 tắt camera pantry thủ công bằng it_admin, 13:04 lấy ly ở pantry, về phòng server uống,
//   giật mình vì tiếng ngáy của sếp Đạt (đang ngủ lén sau tủ server) nên làm rớt ống hút vào khe dây cáp,
//   13:15 trả ly rỗng vào tủ (để chị Vy "thấy cảm giác mở ra mà trống rỗng, như lời hứa"), 13:17 bật lại camera.
//   Động cơ: chị Vy hứa bao trà sữa full topping 3 lần sau 3 đêm Phong thức sửa server, quên cả 3.
//   Gây nhiễu: Hằng (ăn kiêng mà giấu ly trà sữa trong bàn, trưa lén xuống sảnh nhận ly), sếp Đạt (log thẻ từ
//   cho thấy ổng nằm trong phòng server đúng lúc camera tắt: thật ra là ngủ trưa lén), Khoa (thứ Sáu trực dọn tủ lạnh).
//   Kết hợp 2 vật chứng: ống hút trong dây cáp + ly rỗng bị mất ống hút (và ly của Hằng còn nguyên ống hút) => ống hút của ly chị Vy.
export default {
  id: "tra-sua-van-phong",
  no: 3,
  title: "Ly Trà Sữa Văn Phòng",
  tagline: "Uống trộm thì thôi, còn trả lại cái ly rỗng. Đây là tuyên chiến.",
  difficulty: 2,
  client: "vy",

  intro: [
    ["narr", "Văn phòng Thám Tử Lụm, 3 giờ chiều thứ Sáu. Quạt trần kêu cót két, Tèo nằm dài lướt điện thoại."],
    ["teo", "Sếp ơi sếp! Nhóm Hẻm 47 Hóng Biến lại nổ rồi. Toà nhà đầu hẻm có biến: trưởng phòng mất ly trà sữa, cả công ty bị nghi!", "happy"],
    ["me", "Một ly trà sữa mà lên nhóm hóng biến?", "neutral"],
    ["teo", "Bài đăng 900 like rồi sếp. Còn nhiều hơn vụ con chó nhà ông Sáu đi lạc.", "smug"],
    ["narr", "Cửa bật mở. Mùi nước hoa đắt tiền tràn vào trước, rồi tới một đôi giày cao gót, rồi tới chủ nhân của đôi giày."],
    ["vy", "Chào anh. Tôi là Vy, trưởng phòng Content công ty Cà Khịa Media, tầng 3 toà nhà đầu hẻm.", "neutral"],
    ["vy", "Tôi cần anh tìm ra kẻ đã uống ly trà sữa của tôi. Hôm nay. Trước 6 giờ.", "angry"],
    ["me", "Một ly trà sữa?", "neutral"],
    ["vy", "Không phải \"một ly trà sữa\". Là ly [[tiem-tra-sua|Tiệm Trà Sữa]] full topping size L, sáu loại topping, 68 ngàn, chờ ship 25 phút giữa trưa nắng.", "angry"],
    ["vy", "Tôi để trong tủ lạnh pantry lúc [[12h10|12 giờ 10]], trên ly ghi to đùng: CỦA VY, ĐỤNG VÀO LÀ [[kpi|KPI]] = 0.", "neutral"],
    ["vy", "Tôi họp khách tới 2 giờ. [[14h05|2 giờ 05]] mở tủ ra thì sao anh biết không?", "neutral"],
    ["teo", "Thấy cái ly đi đâu mất?", "neutral"],
    ["vy", "Thấy cái ly VẪN CÒN ĐÓ. Đứng ngay ngắn. Rỗng tuếch. Chỉ còn hai hạt trân châu nằm dưới đáy như hai con mắt nhìn tôi.", "shock"],
    ["teo", "Uống xong còn trả vỏ về chỗ cũ, lịch sự ghê ta.", "smug"],
    ["vy", "Đó là sỉ nhục, em trai. Uống trộm là một chuyện. Trả lại cái ly rỗng là tuyên chiến.", "angry"],
    ["me", "Trưa nay văn phòng có những ai?", "neutral"],
    ["vy", "Công ty có năm người tính cả tôi. Khoa thực tập sinh, Phong bên IT, Hằng kế toán, và anh Đạt, sếp tổng.", "neutral"],
    ["vy", "Tôi đã hỏi trong [[group-chat|group chat \"Cà Khịa Fam\"]]. Ai cũng thả icon ngạc nhiên. Không ai nhận.", "neutral"],
    ["teo", "Sếp, em đoán rồi: thủ phạm là cái tủ lạnh. Tủ lạnh đời mới có AI, nó khát.", "smug"],
    ["me", "Tèo, lấy sổ tay ra.", "neutral"],
    ["batu", "(ló đầu vô cửa) Thám tử nhận vụ này hả? Cho bà Tư livestream ké nha, cả hẻm đang hóng!", "happy"],
    ["me", "Không livestream. Chị Vy, dẫn tôi tới hiện trường.", "neutral"],
  ],

  social: {
    group: "Hẻm 47 Hóng Biến",
    posts: [
      {
        by: "batu",
        text: "🔥 BIẾN CĂNG TOÀ NHÀ ĐẦU HẺM 🔥 Trưởng phòng công ty truyền thông mất ly trà sữa full topping trong tủ lạnh. Kẻ gian uống sạch còn TRẢ LẠI LY RỖNG vào tủ!!! Văn phòng 5 người, ai cũng chối. Bà con vô đoán thủ phạm, đoán trúng bà Tư tặng 1 ly sâm bổ lượng 🧐",
        likes: 912,
        comments: [
          { by: "teo", text: "Em đoán thực tập sinh. Thực tập sinh thì lúc nào cũng đói 🍿" },
          { by: "Cô Ba Bán Xôi", text: "Thời buổi gì mà ly trà sữa 68 ngàn, bằng 4 gói xôi của tui" },
          { by: "Hùng Xe Ôm", text: "Trả lại ly rỗng là có tâm đó, đỡ phải đi đổ rác" },
          { by: "Shop Ống Hút Tre Mỹ Tho", text: "Ống hút tre sạch, cắn không dẹt, inbox em nha cả nhà 🎋" },
          { by: "Tiểu Thư Bánh Bèo 2k5", text: "Người ta lấy đi ly trà sữa, nhưng không lấy được niềm tin của chị 💔" },
          { by: "chuba", text: "Toà nhà có camera mà, hỏi bảo vệ chưa? Chú đang trực, tối chú ghé" },
        ],
      },
    ],
  },

  people: {
    vy: {
      name: "Chị Vy",
      role: "Trưởng phòng Content · người tới nhờ",
      bio: "32 tuổi, vest kem, nói câu nào cũng có chữ \"deadline\". Đặt [[tiem-tra-sua|Tiệm Trà Sữa]] mỗi ngày, ly nào cũng ghi tên.",
    },
    khoa: {
      name: "Khoa",
      role: "Thực tập sinh",
      bio: "21 tuổi, sơ mi rộng hai size, thẻ nhân viên đeo lủng lẳng. Sợ sếp, sợ chị Vy, sợ cả máy in. Đang làm series TikTok \"1 ngày làm thực tập sinh\".",
      suspect: true,
    },
    phong: {
      name: "Phong",
      role: "Dân IT",
      bio: "28 tuổi, hoodie xám, tai nghe chụp. Một mình lo cả hệ thống công ty. Ít nói, gõ phím rất to.",
      suspect: true,
    },
    hang: {
      name: "Hằng",
      role: "Kế toán",
      bio: "30 tuổi, đang làm [[an-kieng|thử thách ăn kiêng 30 ngày]] và cập nhật tiến độ lên group chat mỗi sáng. Hộp salad không rời tay.",
      suspect: true,
    },
    dat: {
      name: "Sếp Đạt",
      role: "Giám đốc",
      bio: "45 tuổi, áo polo, bụng bia, cốc sứ \"Best Boss\" không rời tay. Câu cửa miệng: \"Công ty là gia đình\".",
      suspect: true,
    },
  },

  locations: {
    pantry: {
      name: "Phòng pantry",
      scene: "pantry",
      start: true,
      intro: [
        ["narr", "[[pantry|Phòng pantry]] nhỏ xíu, máy lạnh rè rè. Mùi cà phê, mùi lò vi sóng và mùi drama công sở."],
        ["vy", "Hiện trường đây. Tôi chưa cho ai đụng vào cái tủ lạnh từ 2 giờ tới giờ.", "neutral"],
        ["teo", "Có cần giăng dây vàng không sếp? Em có cuộn băng keo vàng nè.", "smug"],
      ],
      hotspots: [
        {
          id: "tu-lanh",
          label: "Tủ lạnh",
          rect: [60, 110, 170, 330],
          lines: [
            ["narr", "Tủ lạnh hai cánh dán đầy giấy nhớ: \"Sữa chua của Hằng (đã đếm)\", \"Đừng đụng hộp cơm sườn – Đạt\"."],
            ["me", "Ngăn giữa: một ly nhựa size L, nắp màng dán bị chọc một lỗ to tròn. Không có ống hút.", "neutral"],
            ["me", "Đáy ly còn hai hạt trân châu và một vệt [[kem-cheese|kem cheese]] khô. Bên hông ghi bút lông: CỦA VY – ĐỤNG VÀO LÀ KPI = 0.", "neutral"],
            ["teo", "Ly mà biết nói chắc nó khóc.", "neutral"],
            ["me", "Lỗ chọc to vầy là ống hút trân châu to bản. Vậy ống hút đi đâu? Kẻ uống mang nó theo.", "neutral"],
          ],
          gives: { clues: ["ly-rong"], words: ["ong-hut-to"] },
          again: [["teo", "Hai hạt trân châu vẫn nhìn mình kìa sếp. Ghê quá."]],
        },
        {
          id: "may-pha-ca-phe",
          label: "Máy pha cà phê",
          rect: [270, 190, 110, 110],
          lines: [
            ["narr", "Máy pha cà phê viên nén. Trên máy dán: \"Viên nén là của SẾP. Nhân viên uống cà phê gói.\""],
            ["teo", "Công ty là gia đình mà cà phê chia hai giai cấp.", "smug"],
            ["me", "Khay hứng còn ấm, cốc kế bên đọng [[ca-phe-den|cà phê đen]] không đường. Có người vừa pha một cốc.", "neutral"],
          ],
          again: [["me", "Máy kêu \"bíp\" một tiếng, như đồng tình.", "neutral"]],
        },
        {
          id: "lo-vi-song",
          label: "Lò vi sóng",
          rect: [400, 170, 130, 80],
          lines: [
            ["narr", "Lò vi sóng có tờ giấy dán: \"CẤM HÂM CÁ KHÔ. Lần thứ 3 rồi đó. – Ban giám đốc\"."],
            ["teo", "Lần thứ 3 thì ai hâm vậy sếp?", "neutral"],
            ["me", "Không liên quan vụ này. Nhưng tôi sẽ nhớ.", "neutral"],
          ],
          again: [["teo", "Em ngửi thấy mùi cá khô thoang thoảng. Hay là tưởng tượng ta."]],
        },
        {
          id: "bang-phan-cong",
          label: "Bảng phân công",
          rect: [570, 90, 160, 130],
          lines: [
            ["narr", "Bảng trắng \"Lịch trực pantry\". Mỗi ngày một người, có cột đánh dấu đã làm."],
            ["me", "Thứ Hai: Hằng rửa ly. Thứ Ba: Phong đổ rác. Thứ Tư: Vy... bỏ trống. Thứ Năm: Đạt \"giám sát\".", "neutral"],
            ["me", "Thứ Sáu: Khoa dọn tủ lạnh. Cột bên cạnh có dấu tick, chữ nhỏ: \"✔ 12h50\".", "neutral"],
            ["teo", "Thứ Năm sếp Đạt \"giám sát\". Em cũng muốn làm công việc đó.", "smug"],
          ],
          gives: { clues: ["lich-truc"] },
          again: [["me", "Thứ Tư của chị Vy vẫn bỏ trống. Thú vị.", "neutral"]],
        },
        {
          id: "thung-rac-pantry",
          label: "Thùng rác",
          rect: [780, 360, 100, 130],
          lines: [
            ["narr", "Thùng rác đạp chân. Nắp vừa mở ra là một luồng mùi xộc thẳng lên não."],
            ["teo", "Ọe. Sếp ơi, em xin nghỉ phép năm.", "shock"],
            ["me", "Một hộp cơm nhựa, nắp dán băng keo ghi \"ĐẠT – 02/11\". Bên trong mốc xanh, mốc trắng, mốc... tím.", "neutral"],
            ["me", "[[hop-com-moc|Hộp cơm mốc]] ba tuần tuổi. Ai đó vừa dọn nó hôm nay, vì nó nằm trên cùng.", "neutral"],
            ["me", "Không có ống hút nào trong thùng. Không có ly trà sữa thứ hai.", "neutral"],
          ],
          gives: { clues: ["hop-com-dat"] },
          again: [["teo", "Em không mở lại cái thùng đó đâu. Lần này em nói thiệt."]],
        },
        {
          id: "ke-ly",
          label: "Kệ cốc",
          rect: [570, 250, 170, 60],
          lines: [
            ["narr", "Kệ cốc của nhân viên. Cốc \"Hôm nay lại deadline\", cốc \"Tôi ổn\" bị mẻ, cốc in mặt con mèo."],
            ["me", "Chỗ trống giữa kệ có vòng tròn sạch bụi. Cốc của sếp Đạt chắc thường đặt ở đây.", "neutral"],
            ["teo", "Cốc \"Tôi ổn\" mà mẻ miệng. Đúng tinh thần văn phòng.", "smug"],
          ],
        },
      ],
    },

    openoffice: {
      name: "Khu làm việc",
      scene: "openoffice",
      start: true,
      intro: [
        ["narr", "Khu làm việc chung. Bốn cái bàn, một cây kiểng, một máy in, một bầu không khí ai cũng nhìn ai."],
        ["teo", "Sếp, cả phòng đang giả vờ làm việc kìa. Gõ phím mà màn hình là Shopee.", "smug"],
      ],
      hotspots: [
        {
          id: "ban-khoa",
          label: "Bàn Khoa",
          rect: [40, 300, 200, 160],
          lines: [
            ["narr", "Bàn của thực tập sinh: chồng hồ sơ cao tới cằm, cái giá đỡ điện thoại mini kèm đèn ring light bé xíu."],
            ["me", "Ống bút toàn bút bi bị gặm [[nap-but|nắp bút]] nham nhở. Cậu này lo âu là gặm.", "neutral"],
            ["me", "Giấy note dán màn hình: \"Tập 14: Trưa thứ Sáu – quay cảnh văn phòng vắng\".", "neutral"],
            ["teo", "Ring light mini! Em cũng muốn làm TikToker.", "happy"],
          ],
          again: [["me", "Cái giá đỡ điện thoại vẫn chĩa về phía khu làm việc.", "neutral"]],
        },
        {
          id: "ban-phong",
          label: "Bàn Phong",
          rect: [260, 280, 220, 170],
          lines: [
            ["narr", "Ba màn hình, bàn phím cơ đèn bảy màu, một tượng con vịt cao su đặt cạnh chuột."],
            ["me", "Ống cắm bút không có bút. Chỉ có ống hút. Mười mấy cái. Cái nào cũng bị cắn dẹt lép, mép răng cưa đều tăm tắp.", "neutral"],
            ["teo", "Bảo tàng ống hút! Ảnh sưu tầm hả sếp?", "shock"],
            ["me", "[[can-det|Cắn dẹt kiểu răng cưa]]. Một thói quen. Giống chữ ký.", "neutral"],
            ["me", "Dưới gầm bàn có đôi sneaker nằm trống. Chủ nhân đang đi [[dep-con-vit|dép con vịt]] vàng lòng vòng văn phòng.", "neutral"],
            ["me", "Góc màn hình phụ có một widget đếm ngày: \"Lời hứa: 47 ngày\". Không ghi hứa gì.", "neutral"],
          ],
          gives: { clues: ["coc-ong-hut"] },
          again: [["teo", "Con vịt cao su nhìn em như biết gì đó."]],
        },
        {
          id: "ban-hang",
          label: "Bàn Hằng",
          rect: [500, 290, 200, 160],
          lines: [
            ["narr", "Bàn gọn gàng nhất phòng. Hộp salad rau xà lách còn nguyên, cái nĩa nằm chéo chưa dùng."],
            ["me", "Giấy dán: \"Ngày 12/30 – Không đường, không tinh bột, không cảm xúc\".", "neutral"],
            ["me", "Sau màn hình, giấu kỹ: một ly [[tiem-tra-sua|Tiệm Trà Sữa]] rỗng. Ống hút còn cắm nguyên, tròn vo, đầu ống dính son môi hồng.", "neutral"],
            ["teo", "Á à! Ăn kiêng mà giấu ly trà sữa! Bắt quả tang!", "shock"],
            ["me", "Khoan. Ly này là [[kem-muoi|kem muối]], không phải full topping. Và ống hút của nó vẫn còn đây.", "neutral"],
          ],
          gives: { clues: ["ly-hang"] },
          again: [["me", "Hộp salad vẫn nguyên. Rau xà lách bắt đầu héo vì cô đơn.", "neutral"]],
        },
        {
          id: "thung-rac-hang",
          label: "Thùng rác dưới bàn Hằng",
          rect: [620, 450, 70, 70],
          needs: "stmt:hang-o-ban",
          lines: [
            ["narr", "Thùng rác nhỏ dưới bàn kế toán, bên trên phủ một lớp giấy nháp bảng lương."],
            ["me", "Dưới lớp giấy nháp: một tờ hoá đơn [[tiem-tra-sua|Tiệm Trà Sữa]] nhăn nhúm, bị vò rất kỹ.", "neutral"],
            ["teo", "Vò kỹ vậy là có tật giật mình rồi sếp.", "smug"],
          ],
          gives: { clues: ["hoa-don-hang"] },
          again: [["teo", "Bảng lương nháp nè sếp... Ủa sao lương Khoa có ba triệu."]],
        },
        {
          id: "may-in",
          label: "Máy in",
          rect: [740, 250, 120, 120],
          lines: [
            ["narr", "Máy in đời cũ, kêu như máy cày. Khay giấy ra còn kẹt một tờ in dở."],
            ["me", "Xác nhận đơn hàng online: \"Cốc sứ in chữ BEST BOSS – 1 cái – người mua: Đạt\".", "neutral"],
            ["me", "Ghi chú cho shop: \"Gói giấy hoa, kèm thiệp ghi 'Từ cả team, yêu sếp'\".", "neutral"],
            ["teo", "Sếp tự mua cốc Best Boss rồi tự viết thiệp nhân viên tặng mình?! Đỉnh của chóp!", "shock"],
          ],
          gives: { clues: ["don-coc"] },
          again: [["teo", "Máy in đang in tiếp... à không, nó kẹt giấy. Như mọi khi."]],
        },
        {
          id: "cay-canh",
          label: "Cây kiểng",
          rect: [880, 250, 70, 200],
          lines: [
            ["narr", "Cây kim tiền cao ngang vai, lá vàng vài chiếc. Treo thẻ: \"Cây phong thuỷ – Đạt mua – Đừng tưới cà phê\"."],
            ["me", "Đất trong chậu ướt nhẹp, mùi... trà chanh. Có người tưới cây bằng đồ uống thừa.", "neutral"],
            ["teo", "Cây kim tiền uống trà chanh. Cây cũng có KPI riêng.", "smug"],
          ],
          again: [["me", "Cây vẫn sống. Mạnh mẽ hơn nhiều người ở đây.", "neutral"]],
        },
        {
          id: "cua-phong-sep",
          label: "Cửa phòng sếp",
          rect: [700, 40, 120, 190],
          lines: [
            ["narr", "Cửa kính mờ, bảng tên \"GIÁM ĐỐC\". Bên trong tối, máy lạnh không chạy."],
            ["me", "Tờ giấy dán trên công tắc máy lạnh: \"Hư – đã gọi thợ – thợ hẹn tuần sau (lần 3)\".", "neutral"],
            ["teo", "Máy lạnh hư mà sếp vẫn ngồi trong đó nguyên buổi trưa à? Nóng chảy mỡ luôn.", "neutral"],
            ["me", "Ghi nhớ: [[phong-sep|phòng riêng của sếp]] trưa nay nóng như lò.", "neutral"],
          ],
          again: [["me", "Cửa phòng sếp vẫn đóng. Bên trong nóng hầm hập.", "neutral"]],
        },
      ],
    },

    serverroom: {
      name: "Phòng server",
      scene: "serverroom",
      intro: [
        ["narr", "Phòng server cuối hành lang, cửa quẹt thẻ từ. Lạnh buốt. Đèn xanh đèn đỏ nhấp nháy như vũ trường."],
        ["vy", "Phòng này chỉ Phong với anh Đạt có thẻ. Màn hình camera của cả công ty ở đây.", "neutral"],
        ["teo", "Lạnh quá sếp. Ở đây ngủ trưa chắc sướng lắm.", "neutral"],
      ],
      hotspots: [
        {
          id: "man-hinh-camera",
          label: "Màn hình camera",
          rect: [80, 140, 220, 150],
          lines: [
            ["narr", "Màn hình chia bốn ô: sảnh, khu làm việc, hành lang, pantry. Góc dưới có nút \"Nhật ký\"."],
            ["me", "Mở nhật ký camera pantry hôm nay...", "neutral"],
            ["me", "\"[[13h02|13:02]] – CAM PANTRY – TẮT – thao tác thủ công – tài khoản: [[it-admin|it_admin]] – tại: SERVER-CONSOLE.\"", "neutral"],
            ["me", "\"[[13h17|13:17]] – CAM PANTRY – BẬT – thao tác thủ công – it_admin – SERVER-CONSOLE.\"", "neutral"],
            ["teo", "Tắt đúng 15 phút! Ủa \"thủ công\" nghĩa là sao sếp?", "shock"],
            ["me", "Nghĩa là có người ngồi đúng cái máy này, bấm tắt bằng tay. Không phải lỗi. Là [[tat-camera|tắt camera thủ công]].", "neutral"],
          ],
          gives: { clues: ["log-camera"] },
          again: [["me", "Ô camera pantry đang chiếu cái tủ lạnh. Nó im lặng như một nhân chứng sợ hãi.", "neutral"]],
        },
        {
          id: "tu-server",
          label: "Tủ server",
          rect: [380, 60, 200, 380],
          lines: [
            ["narr", "Tủ rack cao hai mét, quạt rít ù ù. Phía sau tủ là một khoảng trống tối om sát tường."],
            ["me", "Cánh tủ dán [[giay-pass|tờ giấy dán mật khẩu]]: \"it_admin / CaKhia@123 – ĐỪNG AI ĐỌC\".", "neutral"],
            ["teo", "Ghi \"đừng ai đọc\" là ai cũng đọc. Đây là tâm lý học sếp ơi.", "smug"],
            ["me", "Vậy ai vô được phòng này đều có thể tắt camera. Danh sách nghi phạm phải tính theo người vô phòng.", "neutral"],
          ],
          gives: { clues: ["giay-pass"] },
          again: [["teo", "CaKhia@123. Em thuộc rồi. Em không muốn thuộc mà nó tự vô đầu."]],
        },
        {
          id: "ghe-xoay",
          label: "Ghế xoay",
          rect: [620, 300, 140, 180],
          lines: [
            ["narr", "Hai cái ghế xoay đẩy sát nhau thành cái giường tạm, kê sau lưng tủ server, chỗ khuất camera."],
            ["me", "Trên ghế: một cái [[bit-mat|bịt mắt ngủ]] in chữ BOSS bằng kim tuyến, và hai cục nút tai màu cam.", "neutral"],
            ["teo", "BOSS! Bịt mắt của sếp Đạt! Ổng ngủ ở đây hả?", "shock"],
            ["me", "Ai đó ngủ trưa ở đây thường xuyên. Mặt ghế còn lõm hình... một cái bụng.", "neutral"],
          ],
          gives: { clues: ["bit-mat-ngu"] },
          again: [["teo", "Em nằm thử chút được không sếp? Năm phút thôi.", "smug"], ["me", "Không.", "neutral"]],
        },
        {
          id: "day-cap",
          label: "Dây cáp",
          rect: [300, 400, 360, 120],
          lines: [
            ["narr", "Một bó dây cáp mạng xanh đỏ vàng rối như tơ vò dưới chân tủ server."],
            ["teo", "Rối như mối tình đầu của em.", "neutral"],
            ["me", "Khe giữa các bó dây tối và sâu. Muốn mò thì phải biết đang tìm cái gì.", "neutral"],
          ],
          again: [["teo", "Em không mò đâu. Lỡ có chuột.", "nervous"]],
        },
        {
          id: "khe-day-cap",
          label: "Khe dây cáp (soi đèn pin)",
          rect: [420, 450, 140, 60],
          needs: "broke:dat-hop-online",
          lines: [
            ["narr", "Soi đèn pin vào đúng chỗ sếp Đạt nghe tiếng \"rột rột\"."],
            ["me", "Có rồi. Kẹt giữa hai bó cáp: một [[ong-hut-to|ống hút to bản màu hồng]] in logo Tiệm Trà Sữa.", "neutral"],
            ["me", "Đầu ống bị cắn dẹt lép, mép răng cưa đều tăm tắp. Trong lòng ống còn dính [[kem-cheese|kem cheese]] vàng nhạt.", "neutral"],
            ["teo", "Chuột của sếp Đạt biết uống trà sữa full topping luôn!", "shock"],
            ["me", "Chuột không cắn ống hút đều như vậy. Người thì có.", "neutral"],
          ],
          gives: { clues: ["ong-hut-det"] },
          again: [["me", "Khe dây giờ trống trơn. Ống hút đã nằm trong túi vật chứng.", "neutral"]],
        },
        {
          id: "may-lanh",
          label: "Máy lạnh",
          rect: [700, 40, 200, 70],
          lines: [
            ["narr", "Máy lạnh chỉnh 16 độ. Tem: \"Chỉ dành cho máy chủ. Con người vui lòng ra ngoài.\""],
            ["teo", "16 độ. Lạnh như tin nhắn \"ok\" của crush.", "smug"],
            ["me", "Phòng mát nhất công ty. Nhớ điều đó.", "neutral"],
          ],
          again: [["teo", "Hắt xì! Sếp ơi em bị cảm rồi."]],
        },
      ],
    },
  },

  clues: {
    "ly-rong": {
      name: "Ly rỗng của chị Vy",
      desc: "Ly size L, nắp màng có lỗ chọc to vừa [[ong-hut-to|ống hút to bản]], nhưng KHÔNG có ống hút. Còn hai hạt trân châu và vệt [[kem-cheese|kem cheese]]. Ghi \"CỦA VY – ĐỤNG VÀO LÀ KPI = 0\".",
      detail: [["me", "Kẻ uống rút ống hút ra và không trả lại. Tìm được ống hút là tìm được cái miệng đã uống.", "neutral"]],
    },
    "hoa-don-vy": {
      name: "Hoá đơn của chị Vy",
      desc: "[[tiem-tra-sua|Tiệm Trà Sữa]], giao [[12h05|12:05]]. Ô Long Full Topping size L, 30% đường, ít đá: trân châu đen, trân châu trắng, thạch phô mai, pudding trứng, [[kem-cheese|kem cheese \"Mây Trôi Lững Lờ\"]], thạch \"Drama Queen\". Kèm 1 [[ong-hut-to|ống hút to bản hồng]]. 68.000đ.",
      detail: [["teo", "Thạch \"Drama Queen\"! Tiệm Trà Sữa đặt tên topping mặn mòi ghê.", "happy"]],
    },
    "lich-truc": {
      name: "Lịch trực pantry",
      desc: "Thứ Sáu: Khoa dọn tủ lạnh. Cột đã làm có tick \"✔ 12h50\".",
    },
    "hop-com-dat": {
      name: "Hộp cơm mốc của sếp Đạt",
      desc: "Hộp cơm sườn ghi \"ĐẠT – 02/11\", mốc ba màu, vừa bị dọn khỏi tủ lạnh hôm nay. Một [[hop-com-moc|hộp cơm mốc]] đúng nghĩa đen.",
    },
    "log-camera": {
      name: "Nhật ký camera pantry",
      desc: "Camera pantry TẮT lúc [[13h02|13:02]], BẬT lại [[13h17|13:17]]. Cả hai lần đều \"thao tác thủ công\", tài khoản [[it-admin|it_admin]], tại SERVER-CONSOLE trong [[phong-server|phòng server]].",
      detail: [["me", "Không phải lỗi hệ thống. Có người ngồi trong phòng server và tự tay tắt.", "neutral"]],
    },
    "giay-pass": {
      name: "Giấy dán mật khẩu",
      desc: "Dán trên tủ server: \"it_admin / CaKhia@123 – ĐỪNG AI ĐỌC\". Ai vô được [[phong-server|phòng server]] cũng tắt được camera.",
    },
    "log-the-tu": {
      name: "Log thẻ từ phòng server",
      desc: "Bảo vệ toà nhà gửi: hôm nay cửa phòng server chỉ ghi nhận \"12:41 – thẻ ĐẠT – VÀO\" và \"13:42 – thẻ ĐẠT – RA\". Không còn ai [[the-tu|quẹt thẻ từ]] trong buổi trưa.",
      detail: [["teo", "Sếp Đạt ở trong phòng server suốt lúc camera tắt! Chốt đơn sếp ơi!", "shock"]],
    },
    "bit-mat-ngu": {
      name: "Bịt mắt ngủ BOSS",
      desc: "[[bit-mat|Bịt mắt ngủ]] kim tuyến chữ BOSS và nút tai cam, nằm trên hai ghế xoay ghép thành giường sau tủ server.",
    },
    "ly-hang": {
      name: "Ly trà sữa của Hằng",
      desc: "Ly [[tiem-tra-sua|Tiệm Trà Sữa]] rỗng giấu sau màn hình Hằng. Hồng trà [[kem-muoi|kem muối]]. Ống hút còn cắm nguyên, tròn vo, dính son môi hồng.",
      detail: [["me", "Ống hút của ly này còn ở đây, không cắn. Vậy ống hút lạc ở nơi khác không phải của Hằng.", "neutral"]],
    },
    "hoa-don-hang": {
      name: "Hoá đơn của Hằng",
      desc: "[[tiem-tra-sua|Tiệm Trà Sữa]], giao [[13h09|13:09]]: Hồng trà [[kem-muoi|kem muối]], 100% đường, size L. Ghi chú: \"GIAO TẬN [[sanh|SẢNH TẦNG TRỆT]], ĐỪNG GỌI TÊN, ĐỪNG LÊN LẦU\". Người nhận ký: Hằng.",
      detail: [["teo", "\"Đừng gọi tên.\" Chị Hằng tổ chức chiến dịch bí mật luôn.", "smug"]],
    },
    "video-khoa": {
      name: "Video TikTok của Khoa",
      desc: "Tập 14 \"1 ngày làm thực tập sinh\", quay lúc 13:06. Góc sau khung hình: bàn của Phong trống trơn, ghế xoay còn quay lừ đừ, đôi sneaker nằm dưới gầm.",
      detail: [["me", "13 giờ 06. Camera pantry đang tắt. Và Phong không ngồi ở [[ban-lam-viec|bàn làm việc]].", "neutral"]],
    },
    "coc-ong-hut": {
      name: "Bảo tàng ống hút của Phong",
      desc: "Ống cắm bút trên bàn Phong toàn ống hút, cái nào cũng [[can-det|cắn dẹt kiểu răng cưa]], mép răng đều như in.",
    },
    "ong-hut-det": {
      name: "Ống hút trong khe dây cáp",
      desc: "[[ong-hut-to|Ống hút to bản hồng]] logo Tiệm Trà Sữa, kẹt trong dây cáp phòng server. Đầu ống [[can-det|cắn dẹt răng cưa]], trong lòng dính [[kem-cheese|kem cheese]].",
      detail: [["me", "Kem cheese chỉ có trong ly của chị Vy. Ly của Hằng là kem muối, và ống hút của Hằng vẫn còn cắm trong ly.", "neutral"]],
    },
    "don-coc": {
      name: "Đơn hàng cốc Best Boss",
      desc: "Tờ in kẹt máy in: sếp Đạt tự đặt mua cốc \"BEST BOSS\", dặn shop gói giấy hoa kèm thiệp \"Từ cả team, yêu sếp\".",
    },
    "tin-nhan-hua": {
      name: "Tin nhắn hứa của chị Vy",
      desc: "Ba tin nhắn chị Vy gửi Phong sau ba đêm Phong thức sửa server: \"Xong vụ này chị bao full topping nha 😘\" (7/10), \"Tuần sau chị bao, hứa luôn\" (21/10), \"Chị nhớ mà, mai nha\" (8/11). Không ly nào tới. Đó là [[hua-tra-sua|lời hứa bao trà sữa bị quên]].",
    },
  },

  words: {
    vy: { text: "chị Vy", kind: "ai" },
    khoa: { text: "Khoa", kind: "ai" },
    phong: { text: "Phong", kind: "ai" },
    hang: { text: "Hằng", kind: "ai" },
    dat: { text: "sếp Đạt", kind: "ai" },

    "12h05": { text: "12 giờ 05", kind: "luc" },
    "12h10": { text: "12 giờ 10", kind: "luc" },
    "12h55": { text: "12 giờ 55", kind: "luc" },
    "13h02": { text: "13 giờ 02", kind: "luc" },
    "13h09": { text: "13 giờ 09", kind: "luc" },
    "13h17": { text: "13 giờ 17", kind: "luc" },
    "13h20": { text: "13 giờ 20", kind: "luc" },
    "14h05": { text: "14 giờ 05", kind: "luc" },

    pantry: { text: "phòng pantry", kind: "o" },
    "phong-server": { text: "phòng server", kind: "o" },
    sanh: { text: "sảnh tầng trệt", kind: "o" },
    "phong-sep": { text: "phòng riêng của sếp", kind: "o" },
    "ban-lam-viec": { text: "bàn làm việc", kind: "o" },

    "kem-cheese": { text: "kem cheese", kind: "vat" },
    "kem-muoi": { text: "kem muối", kind: "vat" },
    "ong-hut-to": { text: "ống hút to bản", kind: "vat" },
    "nap-but": { text: "nắp bút", kind: "vat" },
    "hop-com-moc": { text: "hộp cơm mốc", kind: "vat" },
    "bit-mat": { text: "bịt mắt ngủ", kind: "vat" },
    "dep-con-vit": { text: "dép con vịt", kind: "vat" },
    "giay-pass": { text: "giấy dán mật khẩu", kind: "vat" },
    "ca-phe-den": { text: "cà phê đen", kind: "vat" },

    "tat-camera": { text: "tắt camera thủ công", kind: "cach" },
    "tu-khoi-dong": { text: "camera tự khởi động lại", kind: "cach" },
    "can-det": { text: "cắn dẹt kiểu răng cưa", kind: "cach" },
    "chia-khoa-co": { text: "chìa khoá cơ của IT", kind: "cach" },
    "the-tu": { text: "quẹt thẻ từ", kind: "cach" },

    "hua-tra-sua": { text: "lời hứa bao trà sữa bị quên", kind: "vi" },
    "an-kieng": { text: "thử thách ăn kiêng", kind: "vi" },
    "doi-bung": { text: "đói bụng giữa trưa", kind: "vi" },
    "ghen-kpi": { text: "ghen tị vì KPI", kind: "vi" },
    "ngu-trua": { text: "ngủ trưa lén", kind: "vi" },

    kpi: { text: "KPI", kind: "khac" },
    "tiem-tra-sua": { text: "Tiệm Trà Sữa", kind: "khac" },
    "it-admin": { text: "tài khoản it_admin", kind: "khac" },
    "group-chat": { text: "group chat Cà Khịa Fam", kind: "khac" },
  },

  talks: {
    vy: [
      {
        id: "ly-tra-sua",
        topic: "Kể lại chuyện ly trà sữa",
        lines: [
          ["vy", "11 giờ 40 tôi đặt qua app. [[12h05|12 giờ 05]] shipper giao tới quầy lễ tân, tôi xuống lấy.", "neutral"],
          ["vy", "12 giờ 10 tôi bỏ vô tủ lạnh vì khách tới sớm. Định họp xong mới uống, cho nó lạnh.", "neutral"],
          ["vy", "Đây, hoá đơn tôi còn giữ. Tôi giữ hoá đơn của mọi thứ. Kể cả người yêu cũ.", "angry"],
          ["teo", "Topping \"Mây Trôi Lững Lờ\"! Nghe tên thôi đã thấy thèm.", "happy"],
          ["vy", "Em đặt đi. Không có ai uống trộm của em đâu. Em đâu có ghi tên.", "neutral"],
        ],
        gives: { clues: ["hoa-don-vy"], words: ["vy"] },
      },
      {
        id: "camera",
        topic: "Văn phòng có camera không?",
        lines: [
          ["vy", "Có. Camera pantry, hành lang, khu làm việc. Màn hình xem nằm trong phòng server.", "neutral"],
          ["vy", "Phòng server phải quẹt thẻ. Để tôi gọi bảo vệ mở cho anh. Tôi là trưởng phòng mà.", "neutral"],
          ["me", "Chị không có thẻ phòng server?", "neutral"],
          ["vy", "Không. Anh Đạt nói \"phòng server là chuyện của đàn ông và máy móc\". Tôi đã ghi âm câu đó.", "angry"],
        ],
        gives: { locs: ["serverroom"] },
      },
      {
        id: "the-tu",
        topic: "Xin log thẻ từ phòng server",
        needs: { any: ["clue:log-camera", "clue:giay-pass"] },
        lines: [
          ["me", "Camera bị tắt từ máy trong phòng server. Tôi cần biết trưa nay ai vô phòng đó.", "neutral"],
          ["vy", "Để tôi nhắn bảo vệ toà nhà. Chú Sáu bảo vệ nợ tôi một lần, tôi từng cho chú mượn sạc.", "neutral"],
          ["narr", "Năm phút sau, điện thoại chị Vy rung. Một tấm ảnh chụp màn hình log cửa."],
          ["vy", "Đây. Trưa nay chỉ có một người quẹt thẻ.", "shock"],
          ["vy", "...Anh Đạt?!", "shock"],
          ["teo", "Sếp tổng! Plot twist! Em đã nói rồi mà, người có cốc Best Boss là người đáng nghi nhất!", "shock"],
          ["me", "Em chưa từng nói câu đó.", "neutral"],
        ],
        gives: { clues: ["log-the-tu"], words: ["dat"] },
      },
      {
        id: "hua-phong",
        topic: "Chị có hứa gì với Phong không?",
        needs: { any: ["broke:phong-o-ban", "clue:ong-hut-det"] },
        lines: [
          ["vy", "Hứa? Tôi hứa với cả công ty nhiều thứ lắm. Teambuilding Đà Lạt, thưởng Tết, giảm deadline...", "neutral"],
          ["me", "Widget trên màn hình Phong ghi \"Lời hứa: 47 ngày\".", "neutral"],
          ["vy", "...", "nervous"],
          ["vy", "Để tôi coi lại tin nhắn.", "nervous"],
          ["narr", "Chị Vy kéo tin nhắn lên. Kéo. Kéo nữa. Mặt chị đổi màu theo từng tin."],
          ["vy", "Ba lần. Tôi hứa bao ảnh trà sữa full topping ba lần, sau ba đêm ảnh thức sửa server cho chiến dịch của tôi.", "shock"],
          ["vy", "Và tôi quên cả ba. Trong khi ngày nào tôi cũng đặt cho mình một ly. Có ghi tên.", "nervous"],
          ["teo", "Ui. Cái này gọi là \"tự tay ghi tên lên nỗi đau người khác\".", "neutral"],
        ],
        gives: { clues: ["tin-nhan-hua"], words: ["phong"] },
      },
    ],

    khoa: [
      {
        id: "gioi-thieu",
        topic: "Em làm gì ở công ty?",
        lines: [
          ["khoa", "Dạ em là thực tập sinh tháng thứ hai. Em photo, em pha cà phê gói, em ôm hồ sơ, em... bị chửi.", "nervous"],
          ["khoa", "Em đang làm series TikTok \"1 ngày làm thực tập sinh\", được 300 follow rồi anh.", "nervous"],
          ["teo", "300 follow! Gấp ba em.", "shock"],
          ["me", "Em gặm nắp bút hả?", "neutral"],
          ["khoa", "Dạ em lo là em gặm. Gặm [[nap-but|nắp bút]] thôi anh, em không gặm gì khác đâu anh, em thề.", "nervous"],
        ],
        gives: { words: ["khoa"] },
      },
      {
        id: "tu-lanh",
        topic: "Hôm nay em có mở tủ lạnh không?",
        lines: [
          ["khoa", "Dạ... không. Em không có mở. Hôm nay em chưa đụng vô tủ lạnh lần nào hết á anh.", "nervous"],
          ["khoa", "Em uống nước lọc ở bình mà. Nước lọc không cần tủ lạnh.", "nervous"],
          ["teo", "Sếp ơi, cậu này mồ hôi chảy như vòi sen.", "smug"],
        ],
        gives: { stmts: ["khoa-khong-mo-tu"] },
      },
      {
        id: "tiktok",
        topic: "Trưa nay em có quay TikTok không?",
        needs: "seen:openoffice.ban-khoa",
        lines: [
          ["khoa", "Dạ có! Tập 14, \"Trưa thứ Sáu văn phòng vắng tanh\". Em quay lúc mọi người đi ăn.", "neutral"],
          ["khoa", "Anh coi nè, có nhạc lofi, có cảnh em ăn mì ly, có cảnh em thở dài nhìn ra cửa sổ...", "neutral"],
          ["me", "Dừng. Tua lại. Góc sau khung hình, 13 giờ 06.", "neutral"],
          ["khoa", "Dạ? Đó là bàn anh Phong. Trống mà anh.", "neutral"],
          ["me", "Gửi tôi video này.", "neutral"],
          ["khoa", "Dạ anh follow em luôn được không anh?", "nervous"],
        ],
        gives: { clues: ["video-khoa"], words: ["ban-lam-viec"] },
      },
      {
        id: "hop-com",
        topic: "Hộp cơm của sếp Đạt",
        needs: "broke:khoa-khong-mo-tu",
        lines: [
          ["khoa", "Anh ơi anh đừng nói với sếp Đạt nha anh. Hộp cơm đó nằm trong tủ ba tuần, nó... nó có hệ sinh thái riêng rồi.", "nervous"],
          ["khoa", "Em hỏi trong group chat \"hộp cơm ai vậy ạ\", sếp seen không rep. Em đành bỏ.", "nervous"],
          ["teo", "Seen không rep là đồng ý ngầm. Luật bất thành văn.", "smug"],
          ["khoa", "Mà em nhớ rõ lúc [[12h55|12 giờ 55]], ly của chị Vy còn đầy nguyên. Em còn đẩy nó vô trong cho khỏi đổ. Em thề!", "nervous"],
        ],
        gives: { words: ["12h55"] },
      },
      {
        id: "dong-nghiep",
        topic: "Mọi người trong công ty thế nào?",
        lines: [
          ["khoa", "Chị Vy giỏi lắm mà dữ lắm. Chị Hằng hiền, mà dạo này ăn kiêng nên hay cáu.", "neutral"],
          ["khoa", "Anh Phong ít nói, nhưng hôm em làm sập máy in anh sửa giùm không mách ai. Anh hay cắn ống hút lắm, uống nước suối cũng cắm ống hút để cắn.", "neutral"],
          ["khoa", "Sếp Đạt thì... trưa nào cũng biến mất một tiếng. Ai hỏi thì sếp nói \"anh họp online với đối tác\".", "neutral"],
          ["teo", "Đối tác tên Chu Công hả.", "smug"],
        ],
      },
    ],

    phong: [
      {
        id: "trua-nay",
        topic: "Trưa nay anh ở đâu?",
        lines: [
          ["phong", "(tháo một bên tai nghe) Ở bàn. Fix bug.", "neutral"],
          ["me", "Cả buổi trưa?", "neutral"],
          ["phong", "Từ 12 giờ tới 2 giờ. Không nhúc nhích. Bug này dí tôi ba ngày rồi.", "neutral"],
          ["teo", "Sếp, ảnh đang mang dép con vịt. Dép con vịt thì làm sao là người xấu.", "happy"],
        ],
        gives: { stmts: ["phong-o-ban"] },
      },
      {
        id: "camera",
        topic: "Camera pantry trưa nay có chạy không?",
        needs: "loc:serverroom",
        lines: [
          ["phong", "Camera đó cũ rồi. Hay [[tu-khoi-dong|tự khởi động lại]] lắm, mất hình mười mấy phút là chuyện thường.", "neutral"],
          ["phong", "Tôi xin công ty thay ba lần rồi. Sếp Đạt nói \"còn chạy được thì ráng\".", "neutral"],
          ["me", "Vậy hôm nay nếu nó tắt thì là do lỗi?", "neutral"],
          ["phong", "Lỗi hệ thống. Chắc chắn.", "neutral"],
        ],
        gives: { stmts: ["phong-camera-loi"] },
      },
      {
        id: "chia-khoa",
        topic: "Anh vô phòng server bằng gì?",
        needs: "clue:log-the-tu",
        lines: [
          ["phong", "Thẻ từ hay hư lắm, quẹt ba lần mới ăn. Tôi xài [[chia-khoa-co|chìa khoá cơ của IT]] cho lẹ.", "neutral"],
          ["phong", "Chìa cơ thì không ghi log. Nhưng tôi vô phòng đó là đi làm, đâu phải đi chơi.", "neutral"],
          ["me", "Vậy log thẻ từ chỉ có tên sếp Đạt, không có nghĩa là chỉ mình sếp vô phòng.", "neutral"],
          ["phong", "...Anh hỏi kỹ quá ha.", "nervous"],
        ],
      },
      {
        id: "ong-hut",
        topic: "Anh hay cắn ống hút?",
        needs: "seen:openoffice.ban-phong",
        lines: [
          ["phong", "Ừ. Cắn cho đỡ căng thẳng. Có người hút thuốc, có người cắn móng tay, tôi cắn ống hút.", "neutral"],
          ["phong", "Ống hút nhựa, ống hút giấy, ống hút tre, cắn hết. Ống hút inox thì... không nhắc tới chuyện đó.", "nervous"],
          ["teo", "Ống hút inox! Răng anh có sao không!", "shock"],
        ],
      },
      {
        id: "ong-hut-cap",
        topic: "Cái ống hút trong khe dây cáp",
        needs: "clue:ong-hut-det",
        lines: [
          ["phong", "Phòng server bụi bặm, rác đâu cũng có. Chắc ống hút từ hồi nào.", "nervous"],
          ["me", "Trong lòng ống còn ướt kem cheese. Từ hồi nào là từ trưa nay.", "neutral"],
          ["phong", "(đeo lại tai nghe) Tôi bận fix bug.", "angry"],
        ],
      },
    ],

    hang: [
      {
        id: "trua-nay",
        topic: "Trưa nay chị ở đâu?",
        lines: [
          ["hang", "Ở bàn chứ đâu. Từ 12 giờ tới 2 giờ chị ngồi ăn salad, không rời ghế nửa bước.", "neutral"],
          ["hang", "Ăn kiêng là phải kỷ luật em ạ. Đi lung tung là gặp đồ ăn.", "neutral"],
        ],
        gives: { stmts: ["hang-o-ban"], words: ["hang"] },
      },
      {
        id: "an-kieng",
        topic: "Chị đang ăn kiêng?",
        lines: [
          ["hang", "Ngày 12 trên 30. Chị đăng tiến độ lên group chat mỗi sáng, cả công ty làm chứng.", "neutral"],
          ["hang", "Không đường, không tinh bột. Ly trà sữa 68 ngàn của Vy là 600 calo, bằng chị ăn salad năm ngày.", "neutral"],
          ["hang", "Chị nhìn nó trong tủ lạnh mà chị thấy thương cho cái gan của Vy.", "angry"],
          ["teo", "Nghe có mùi ghen tị nhẹ đó sếp. Hay chị Hằng [[ghen-kpi|ghen tị vì KPI]] của chị Vy?", "smug"],
          ["hang", "KPI gì? Chị là kế toán, KPI của chị là không ai hỏi chị tiền.", "angry"],
        ],
        gives: { words: ["an-kieng"] },
      },
      {
        id: "nghi-ai",
        topic: "Chị nghi ai?",
        lines: [
          ["hang", "Khoa. Thực tập sinh lúc nào cũng [[doi-bung|đói bụng giữa trưa]]. Thứ Sáu lại trực dọn tủ lạnh.", "neutral"],
          ["hang", "Hoặc là anh Đạt. Anh Đạt trưa nào cũng mất tích, về thì mặt phè phỡn như vừa đi spa.", "neutral"],
          ["hang", "Còn Phong thì không đâu. Phong mà đi uống trộm, chắc trời sập.", "neutral"],
        ],
      },
      {
        id: "quay-len",
        topic: "Lúc chị quay lên lầu, chị thấy gì?",
        needs: "broke:hang-o-ban",
        lines: [
          ["hang", "Chị uống xong ở cầu thang bộ, đi lên tầng 3 khoảng [[13h20|1 giờ 20]].", "nervous"],
          ["hang", "Phong vừa ngồi xuống bàn, thở hổn hển như mới chạy bộ. Khoé miệng dính bọt gì vàng vàng.", "neutral"],
          ["hang", "Chị tưởng nó đánh răng. Ai dè... Ủa, mà bọt vàng vàng là [[kem-cheese|kem cheese]] hả em?", "shock"],
          ["teo", "Kem cheese \"Mây Trôi Lững Lờ\"! Trôi tới tận khoé miệng!", "shock"],
        ],
      },
    ],

    dat: [
      {
        id: "trua-nay",
        topic: "Trưa nay anh ở đâu?",
        lines: [
          ["dat", "Anh họp online với đối tác Singapore trong phòng riêng, 12 giờ rưỡi tới 2 giờ.", "neutral"],
          ["dat", "Làm sếp là vậy đó em. Người ta ăn trưa, mình ăn deadline.", "neutral"],
          ["teo", "Nghe quen quen như câu của chị Vy.", "neutral"],
        ],
        gives: { stmts: ["dat-hop-online"] },
      },
      {
        id: "coc",
        topic: "Cốc \"Best Boss\" đẹp quá",
        lines: [
          ["dat", "À cái này hả. Nhân viên tặng anh đó. Tụi nhỏ góp tiền, gói giấy hoa, có cả thiệp.", "neutral"],
          ["dat", "Anh cảm động lắm. Từ đó anh dùng nó mỗi ngày. Công ty là gia đình mà.", "neutral"],
        ],
        gives: { stmts: ["dat-coc-qua"] },
      },
      {
        id: "tra-sua",
        topic: "Anh có uống trà sữa không?",
        lines: [
          ["dat", "Anh chỉ uống [[ca-phe-den|cà phê đen]] không đường. Sữa vô bụng anh là anh phải họp khẩn trong toilet ba lần.", "neutral"],
          ["dat", "Bác sĩ nói anh bất dung nạp lactose. Anh nói bác sĩ, anh bất dung nạp luôn cả KPI.", "neutral"],
          ["teo", "Sếp nói chuyện hài ghê, mà không ai cười.", "smug"],
        ],
      },
      {
        id: "nghe-thay",
        topic: "Trong phòng server anh nghe thấy gì?",
        needs: "broke:dat-hop-online",
        lines: [
          ["dat", "Khoảng 1 giờ, anh đang ngủ ngon thì nghe cửa mở. Rồi tiếng ai ngồi xuống ghế, gõ phím lạch cạch.", "neutral"],
          ["dat", "Rồi im. Rồi một lát có tiếng \"rột... rột... rột\" như chuột gặm, kèm mùi phô mai thơm phức.", "neutral"],
          ["dat", "Anh tưởng nằm mơ thấy chuột ăn trân châu. Anh hé bịt mắt, nằm thấp nên chỉ thấy được dưới gầm tủ.", "nervous"],
          ["dat", "Thấy một đôi [[dep-con-vit|dép con vịt]] vàng. Rồi \"bộp\" một tiếng, có cái gì rớt vô đống dây cáp. Người đó mò mò một hồi rồi đi.", "shock"],
          ["me", "Đống dây cáp dưới chân tủ.", "neutral"],
          ["dat", "Ừ. Mà khoan, em hỏi kỹ vậy chi?", "nervous"],
        ],
      },
    ],
  },

  stmts: {
    "khoa-khong-mo-tu": {
      by: "khoa",
      text: "Hôm nay em chưa mở tủ lạnh lần nào hết.",
      break: {
        clue: "lich-truc",
        lines: [
          ["me", "Thứ Sáu, Khoa dọn tủ lạnh. Đã làm, tick lúc 12 giờ 50. Chữ của em.", "neutral"],
          ["khoa", "Dạ... dạ em có mở. Em dọn tủ. Mà em sợ quá nên em chối.", "shock"],
          ["khoa", "Em lỡ bỏ cái hộp cơm của sếp Đạt. Nó mốc tới mức em sợ nó bò ra ngoài, anh ơi.", "nervous"],
          ["khoa", "Nhưng em không đụng ly trà sữa. Lúc [[12h55|12 giờ 55]] em đóng tủ, ly của chị Vy còn đầy nguyên!", "nervous"],
          ["teo", "Vậy là ly còn nguyên tới 12 giờ 55. Thời gian gây án thu hẹp rồi sếp!", "happy"],
        ],
        gives: { words: ["12h55"], flags: ["khoa-thu-nhan"] },
      },
    },
    "phong-o-ban": {
      by: "phong",
      text: "Từ 12 giờ tới 2 giờ tôi ngồi ở [[ban-lam-viec|bàn làm việc]] fix bug, không nhúc nhích.",
      break: {
        clue: "video-khoa",
        lines: [
          ["me", "Video của Khoa, 13 giờ 06. Bàn anh trống. Ghế còn đang quay. Đúng lúc camera pantry tắt.", "neutral"],
          ["phong", "...", "shock"],
          ["phong", "Đi vệ sinh. Đi vệ sinh cũng phải báo cáo hả? Hay giờ toilet cũng tính KPI?", "angry"],
          ["teo", "Ảnh bắt đầu nói nhiều hơn ba chữ rồi sếp. Có biến.", "smug"],
        ],
        gives: { flags: ["phong-roi-ban"] },
      },
    },
    "phong-camera-loi": {
      by: "phong",
      text: "Camera pantry hay [[tu-khoi-dong|tự khởi động lại]]. Hôm nay mất hình là do lỗi hệ thống.",
      break: {
        clue: "log-camera",
        lines: [
          ["me", "Nhật ký ghi rõ: \"thao tác thủ công\", tài khoản it_admin, tại SERVER-CONSOLE. Lỗi hệ thống không biết bấm nút.", "neutral"],
          ["phong", "Ờ thì... tắt thủ công. Nhưng pass it_admin dán ngay trên tủ server, ai vô phòng cũng bấm được.", "nervous"],
          ["phong", "Trưa nay ai ở trong phòng server lâu nhất thì anh đi mà hỏi người đó.", "angry"],
        ],
        gives: { words: ["tat-camera"], flags: ["camera-thu-cong"] },
      },
    },
    "hang-o-ban": {
      by: "hang",
      text: "Từ 12 giờ tới 2 giờ chị ngồi ở bàn ăn salad, không rời ghế nửa bước.",
      break: {
        clue: "hoa-don-hang",
        lines: [
          ["me", "Hoá đơn Tiệm Trà Sữa, 13 giờ 09, giao tận sảnh tầng trệt, người nhận ký tên Hằng. Kèm ghi chú \"đừng gọi tên\".", "neutral"],
          ["hang", "...Em lục thùng rác của chị hả?!", "shock"],
          ["hang", "Thôi được rồi! Chị lén đặt một ly. Hồng trà kem muối, 100% đường. Ngày 12 khó nhất em biết không!", "angry"],
          ["hang", "Chị xuống sảnh nhận lúc 1 giờ 09, uống ở cầu thang bộ cho không ai thấy. Đừng nói lên group chat, chị lạy em.", "nervous"],
          ["teo", "Ăn kiêng ngày 12, đường 100%. Tinh thần thép, ý chí... bún.", "smug"],
        ],
        gives: { words: ["sanh", "13h09"], flags: ["hang-ngoai-van-phong"] },
      },
    },
    "dat-hop-online": {
      by: "dat",
      text: "Trưa nay anh họp online với đối tác trong [[phong-sep|phòng riêng]], 12 giờ rưỡi tới 2 giờ.",
      break: {
        clue: "log-the-tu",
        lines: [
          ["me", "Log thẻ từ: 12 giờ 41 thẻ của anh vô phòng server, 13 giờ 42 mới ra. Phòng riêng của anh máy lạnh hư từ tuần trước.", "neutral"],
          ["dat", "Ơ... cái đó... đối tác Singapore họp trong phòng server... cho bảo mật.", "nervous"],
          ["me", "Bịt mắt ngủ chữ BOSS trên hai cái ghế xoay ghép lại.", "neutral"],
          ["dat", "Thôi được! Anh ngủ trưa! Phòng anh máy lạnh hư, nóng như lò bánh mì, phòng server 16 độ!", "angry"],
          ["dat", "Sếp mà ngủ trưa thì mất uy. Nên anh nói là họp với đối tác. Đối tác Singapore là anh bịa. Anh chưa đi Singapore bao giờ.", "nervous"],
          ["dat", "Anh ngủ thật, có nút tai, có bịt mắt! Anh không tắt camera, anh còn không biết tắt sao!", "shock"],
          ["teo", "Sếp ơi, ổng ở trong đó lúc camera tắt. Ổng có nghe thấy gì không?", "neutral"],
        ],
        gives: { words: ["ngu-trua", "phong-server"], flags: ["dat-ngu-trua"] },
      },
    },
    "dat-coc-qua": {
      by: "dat",
      text: "Cốc Best Boss là nhân viên góp tiền tặng anh.",
      break: {
        clue: "don-coc",
        lines: [
          ["me", "Đơn hàng kẹt trong máy in: người mua là anh. Ghi chú: \"kèm thiệp 'Từ cả team, yêu sếp'\".", "neutral"],
          ["dat", "...Năm nào anh cũng chờ tụi nhỏ tặng quà ngày Doanh nhân. Năm nay anh chờ không nổi nữa.", "nervous"],
          ["dat", "Đừng nói với tụi nó nha. Để anh còn chút hình tượng.", "nervous"],
          ["teo", "Sếp ơi, em tự nhiên thấy thương ổng.", "neutral"],
        ],
        gives: { flags: ["dat-tu-mua-coc"] },
      },
    },
  },

  present: {
    khoa: {
      "hop-com-dat": [
        ["khoa", "Á anh cất nó đi anh! Em mơ thấy nó ba đêm nay rồi!", "shock"],
        ["teo", "Khoa à, nó chỉ là hộp cơm thôi mà.", "neutral"],
        ["khoa", "Nó có ba màu mốc anh ơi. Ba màu!", "nervous"],
      ],
      "coc-ong-hut": [
        ["khoa", "Bảo tàng của anh Phong đó anh. Ảnh nói mỗi cái ống hút là một cái bug đã fix.", "neutral"],
        ["khoa", "Em cũng có bảo tàng nắp bút. Mà em không dám trưng.", "nervous"],
      ],
      "don-coc": [
        ["khoa", "Ủa... không phải tụi em tặng hả anh? Hèn chi em không nhớ có góp tiền.", "shock"],
        ["khoa", "Mà thôi, em giả bộ là có góp. Sếp vui là được.", "nervous"],
      ],
    },
    phong: {
      "giay-pass": [
        ["phong", "Ai dán cái này? ...À. Tôi dán. Để nhớ.", "nervous"],
        ["phong", "Pass dài quá. CaKhia@123 là dài với tôi lúc 3 giờ sáng.", "neutral"],
      ],
      "bit-mat-ngu": [
        ["phong", "Sếp Đạt ngủ trong phòng server hả? Tôi... không để ý. Phía sau tủ tối mà.", "nervous"],
        ["teo", "Ảnh nói \"tối mà\" nghe như ảnh từng ở trong đó lúc tối lắm.", "smug"],
      ],
      "hoa-don-vy": [
        ["phong", "Full topping. Sáu loại. 68 ngàn.", "neutral"],
        ["phong", "(nhìn tờ hoá đơn lâu hơn bình thường) ...Thạch Drama Queen.", "nervous"],
      ],
      "tin-nhan-hua": [
        ["phong", "Ba lần. Chị ấy nhớ ra rồi hả?", "angry"],
        ["phong", "Không cần nữa. Tôi không cần trà sữa. Tôi cần... thôi.", "nervous"],
      ],
    },
    hang: {
      "ly-hang": [
        ["hang", "Ly đó... không phải của chị! Của... con mèo!", "shock"],
        ["me", "Văn phòng không nuôi mèo.", "neutral"],
        ["hang", "Thì con mèo đi lạc! Nó uống xong bỏ lại!", "nervous"],
        ["teo", "Mèo đi lạc mà biết đặt kem muối 100% đường, mèo này có gu.", "smug"],
      ],
      "hop-com-dat": [
        ["hang", "Trời ơi hộp cơm sườn anh Đạt! Chị nhìn nó lên mốc từng ngày, như xem phim tài liệu.", "shock"],
        ["hang", "Ít ra nó giúp chị ăn kiêng. Mở tủ lạnh ra là hết đói.", "neutral"],
      ],
      "bit-mat-ngu": [
        ["hang", "Trời, chị biết lâu rồi. Trưa nào cũng nghe tiếng ngáy vọng qua ống thông gió. Cả phòng biết, chỉ là không ai nói.", "neutral"],
      ],
    },
    dat: {
      "hop-com-dat": [
        ["dat", "Hộp cơm sườn của anh! Anh để dành từ đợt... ủa mốc vầy là lên men rồi.", "shock"],
        ["dat", "Đứa nào dọn? Anh định... để nó đó làm kỷ niệm.", "angry"],
      ],
      "bit-mat-ngu": [
        ["dat", "Bịt mắt đó... của đối tác Singapore để quên.", "nervous"],
        ["teo", "Đối tác Singapore tên BOSS hả sếp.", "smug"],
      ],
      "ly-rong": [
        ["dat", "Trời đất, uống sạch luôn. Đứa nào mà gan vậy. Ly của Vy đó, KPI = 0 đó.", "shock"],
        ["dat", "Anh mà là thủ phạm, anh đã... à không, anh không uống được sữa. Anh vô can.", "neutral"],
      ],
    },
  },

  wrong: {
    khoa: [
      [["khoa", "Dạ... em xin lỗi! Mà em xin lỗi vì cái gì vậy anh?", "nervous"]],
      [["khoa", "Anh ơi cái này em không hiểu, em là thực tập sinh mà anh.", "nervous"], ["teo", "Sếp, mình làm khó con nít rồi.", "neutral"]],
      [["khoa", "Em có nên quay cái này lên TikTok không anh? \"Tập 15: bị thám tử thẩm vấn nhầm\".", "neutral"]],
      [["khoa", "(gặm nắp bút) ...Em không biết gì hết, mà nghe anh nói em cũng thấy mình có tội.", "nervous"]],
    ],
    phong: [
      [["phong", "Không liên quan.", "neutral"], ["phong", "(đeo lại tai nghe)", "neutral"]],
      [["phong", "Anh đưa nhầm file rồi. Ctrl+Z đi.", "neutral"]],
      [["phong", "Cái này giống bug: nhìn tưởng có vấn đề, thật ra là do người dùng.", "angry"]],
      [["phong", "Tôi bận. Bug không tự fix.", "angry"]],
    ],
    hang: [
      [["hang", "Em đưa chị coi cái này làm gì? Chị đang ăn kiêng, đừng làm chị stress, stress là chị ăn.", "angry"]],
      [["hang", "Sai. Chị là kế toán, chị nhìn ra số sai từ xa một cây số.", "neutral"]],
      [["hang", "Thôi em ơi. Chị làm sổ sách mười năm, chưa thấy ai lập luận lệch như em.", "angry"]],
    ],
    dat: [
      [["dat", "Em à, em làm việc kiểu này là anh trừ KPI đó. À mà em không phải nhân viên anh.", "angry"]],
      [["dat", "Hay đó, nhưng anh nghĩ em nên \"think outside the box\" hơn.", "neutral"], ["teo", "Sếp ơi, ổng vừa nói tiếng Anh để thoát.", "smug"]],
      [["dat", "Công ty là gia đình. Gia đình không nghi ngờ nhau vô cớ như vậy.", "neutral"]],
    ],
  },

  deduction: [
    {
      id: "thoi-gian",
      text: "Lúc {a}, Khoa còn thấy ly trà sữa nguyên vẹn. Sau đó camera pantry bị {b} từ {c} tới 13 giờ 17.",
      blanks: {
        a: { answer: "12h55", kind: "luc" },
        b: { answer: "tat-camera", kind: "cach" },
        c: { answer: "13h02", kind: "luc" },
      },
      explain: [
        ["me", "12 giờ 55 ly còn đầy. 13 giờ 02 tới 13 giờ 17 camera tắt thủ công. Ly bị lấy trong 15 phút đó.", "neutral"],
        ["teo", "Mười lăm phút uống hết ly full topping size L. Thủ phạm có dung tích phổi đáng nể.", "shock"],
      ],
    },
    {
      id: "noi-doi",
      text: "{a} nói dối là ngồi ở bàn suốt buổi trưa. Thật ra lúc camera tắt, anh ở {b}, vô bằng {c} nên log thẻ từ không có tên.",
      blanks: {
        a: { answer: "phong", kind: "ai" },
        b: { answer: "phong-server", kind: "o" },
        c: { answer: "chia-khoa-co", kind: "cach" },
      },
      explain: [
        ["me", "Log thẻ từ chỉ có tên sếp Đạt, nên ai cũng nhìn sếp. Nhưng Phong có chìa cơ, vô phòng không để lại dấu.", "neutral"],
        ["me", "Sếp Đạt ngủ sau tủ server. Người ngồi ở console, đi dép con vịt, tắt camera, là Phong.", "neutral"],
      ],
    },
    {
      id: "ong-hut",
      text: "Ống hút trong khe dây cáp dính {a}, đúng topping ly chị Vy. Vết {b} trên ống khớp thói quen của người đi {c}.",
      blanks: {
        a: { answer: "kem-cheese", kind: "vat" },
        b: { answer: "can-det", kind: "cach" },
        c: { answer: "dep-con-vit", kind: "vat" },
      },
      explain: [
        ["me", "Ly chị Vy bị mất ống hút. Ly của Hằng là kem muối và còn nguyên ống hút. Nên ống hút trong dây cáp chỉ có thể là của ly chị Vy.", "neutral"],
        ["me", "Vết cắn răng cưa giống hệt bảo tàng ống hút trên bàn Phong. Còn dép con vịt thì sếp Đạt thấy tận mắt, dưới gầm tủ.", "neutral"],
      ],
    },
    {
      id: "dong-co",
      text: "Thủ phạm là {a}. Động cơ: {b}.",
      blanks: {
        a: { answer: "phong", kind: "ai" },
        b: { answer: "hua-tra-sua", kind: "vi" },
      },
      explain: [
        ["me", "Ba đêm thức sửa server, ba lời hứa \"chị bao full topping\", không ly nào tới. Mỗi ngày nhìn ly ghi tên chị Vy trong tủ lạnh.", "neutral"],
        ["teo", "Không phải ăn trộm. Là tự đòi nợ. Mà đòi nợ kiểu này vẫn sai nha sếp.", "neutral"],
      ],
    },
  ],

  finale: {
    culprit: "phong",
    intro: [
      ["narr", "5 giờ 30 chiều. Cả công ty bị gọi vào pantry. Ly rỗng được đặt giữa bàn như một chiếc cúp."],
      ["batu", "(đứng ngoài cửa kính, giơ điện thoại) Bà con ơi, thám tử sắp vạch mặt rồi! Lên sóng nè!", "happy"],
      ["me", "Kẻ uống ly trà sữa của chị Vy đang ở trong phòng này.", "neutral"],
      ["teo", "Em biết! Là... (nhìn quanh) ...là người có dép con vịt!", "smug"],
      ["me", "Tèo, lần đầu tiên em đoán đúng mà nói ra sớm quá.", "neutral"],
      ["me", "Phong. Anh có gì muốn nói không?", "neutral"],
    ],
    steps: [
      {
        claim: [
          ["phong", "Camera hư là chuyện thường. Nó tự khởi động lại, tôi nói rồi.", "angry"],
          ["phong", "Anh không có bằng chứng tôi đụng vào camera.", "neutral"],
        ],
        answer: "log-camera",
        right: [
          ["me", "Camera không tự khởi động lại bằng tay. Nhật ký: \"thao tác thủ công\", it_admin, SERVER-CONSOLE, tắt 13 giờ 02, bật 13 giờ 17.", "neutral"],
          ["phong", "...", "nervous"],
        ],
        wrong: [["phong", "Cái đó thì nói được gì? Anh đang debug bằng cảm tính.", "neutral"]],
      },
      {
        claim: [
          ["phong", "Tắt thủ công thì sao? Pass dán trên tủ server, ai vô cũng tắt được.", "angry"],
          ["phong", "Log thẻ từ chỉ có mỗi sếp Đạt. Sếp nằm trong đó cả tiếng, sao không nghi sếp?", "angry"],
          ["dat", "Ơ kìa! Anh ngủ mà!", "shock"],
        ],
        answer: "ong-hut-det",
        right: [
          ["me", "Người ngồi console để lại thứ này trong khe dây cáp: ống hút to bản, cắn dẹt răng cưa, còn ướt kem cheese.", "neutral"],
          ["me", "Sếp Đạt không uống được sữa, chỉ uống cà phê đen bằng cốc. Sếp không cần ống hút.", "neutral"],
          ["dat", "Đúng! Sữa vô là anh họp khẩn liền! Cả công ty biết!", "neutral"],
          ["phong", "(nhìn ống hút, nuốt nước bọt)", "nervous"],
        ],
        wrong: [["phong", "Cái đó chứng minh được sếp vô tội hả? Không.", "angry"], ["dat", "Em ơi đưa cái khác đi em, anh đang bị nghi đó!", "nervous"]],
      },
      {
        claim: [
          ["phong", "Ống hút cắn dẹt thì ai cắn chẳng được. Thằng Khoa còn gặm nắp bút kìa.", "angry"],
          ["khoa", "Dạ em gặm nắp bút thôi! Nắp bút khác ống hút mà anh!", "shock"],
        ],
        answer: "coc-ong-hut",
        right: [
          ["me", "Mười bốn cái ống hút trên bàn anh. Cái nào cũng dẹt lép, răng cưa đều như in. Giống hệt cái trong dây cáp.", "neutral"],
          ["me", "Mỗi người cắn một kiểu. Anh tự tay trưng bày chữ ký của mình.", "neutral"],
          ["teo", "Bảo tàng tự tố cáo chủ nhân. Nghệ thuật đương đại!", "shock"],
        ],
        wrong: [["phong", "Không liên quan. Anh thử lại.", "neutral"], ["khoa", "Anh ơi đừng đưa đồ của em ra nha anh!", "nervous"]],
      },
      {
        claim: [
          ["phong", "Thì đúng, ống hút đó tôi cắn. Nhưng là ống hút ly của tôi hôm qua. Tôi làm rớt trong phòng server.", "angry"],
          ["phong", "Có ai thấy tôi cầm ly của chị Vy đâu?", "nervous"],
        ],
        answer: "ly-rong",
        right: [
          ["me", "Trong lòng ống hút còn ướt kem cheese. Hôm nay chỉ có hai ly Tiệm Trà Sữa lên tầng 3.", "neutral"],
          ["me", "Ly của Hằng là kem muối, ống hút còn cắm nguyên trong ly. Ly của chị Vy thì bị chọc lỗ to bản, mà mất ống hút.", "neutral"],
          ["me", "Ống hút anh cắn là ống hút còn thiếu của cái ly này.", "neutral"],
          ["phong", "...", "shock"],
          ["narr", "Phong tháo tai nghe. Lần đầu tiên trong ngày, anh tháo cả hai bên."],
        ],
        wrong: [["phong", "Thấy chưa, anh không có gì cả.", "neutral"], ["hang", "Em ơi, chị kế toán, chị thấy em đưa sai chứng từ rồi đó.", "neutral"]],
      },
    ],
    confess: [
      ["phong", "Đúng. Tôi uống.", "nervous"],
      ["phong", "Một giờ, tôi vô phòng server bằng chìa cơ, tắt camera. Lấy ly. Vô lại phòng server ngồi uống cho mát.", "neutral"],
      ["phong", "Đang uống thì sau tủ có tiếng ngáy. Tôi giật mình, ống hút rớt vô đống dây. Mò không ra.", "nervous"],
      ["dat", "Anh ngáy hả? Anh tưởng anh ngủ êm như em bé.", "shock"],
      ["vy", "Tại sao lại trả cái ly rỗng vô tủ? Sao không vứt đi?", "angry"],
      ["phong", "Vì tôi muốn chị mở tủ ra, thấy cái ly có ghi tên mình, mà bên trong trống rỗng.", "angry"],
      ["phong", "Giống cảm giác của tôi, ba lần, sau ba đêm không ngủ. \"Xong vụ này chị bao full topping nha.\"", "nervous"],
      ["phong", "Ngày nào tôi cũng thấy ly của chị trong tủ. Có ghi tên. Bốn mươi bảy ngày.", "nervous"],
      ["vy", "...", "shock"],
      ["vy", "Tôi... tôi quên thiệt. Không phải vì không trân trọng. Là vì tôi chỉ nhớ deadline, không nhớ người làm ra deadline.", "nervous"],
      ["teo", "Sếp ơi em muốn khóc mà em đang hóng.", "neutral"],
    ],
    epilogue: [
      ["narr", "Sáu giờ chiều, shipper Tiệm Trà Sữa leo ba tầng lầu với hai túi lớn."],
      ["vy", "Năm ly full topping. Cho cả công ty. Và đây là của Phong: bốn ly. Một ly hôm nay, ba ly nợ cũ.", "nervous"],
      ["phong", "Bốn ly... tôi uống không nổi.", "shock"],
      ["vy", "Thì để trong tủ. Ghi tên anh. Không ai dám đụng đâu, cả công ty vừa thấy hậu quả rồi.", "neutral"],
      ["hang", "Cho chị một ly... 30% đường thôi. Ngày 12 coi như reset về ngày 1.", "nervous"],
      ["dat", "Còn anh? Anh có cốc Best Boss mà... không ai tặng thiệt.", "nervous"],
      ["khoa", "Sếp ơi! Tụi em vừa góp tiền mua cho sếp cái này!", "neutral"],
      ["narr", "Khoa giơ lên một cái gối ngủ hình đám mây, thêu chữ: \"Sếp ngủ trưa đi, tụi em giữ bí mật\"."],
      ["dat", "...Công ty là gia đình thiệt.", "shock"],
      ["phong", "Chị Vy. Tôi xin lỗi vụ cái ly rỗng. Mai tôi đổi pass it_admin.", "neutral"],
      ["vy", "Đổi luôn cái giấy dán đi. Và thứ Tư lịch trực pantry tôi sẽ điền tên mình.", "neutral"],
      ["teo", "Sếp ơi, video Khoa \"Tập 14\" lên xu hướng rồi! Ba trăm ngàn view! \"Thực tập sinh vô tình phá án\"!", "happy"],
      ["me", "Còn thám tử thì sao?", "neutral"],
      ["teo", "Thám tử được nhắc tên trong bình luận thứ 47, sếp ơi.", "smug"],
      ["batu", "Bà Tư đã đăng: \"VỤ ÁN ỐNG HÚT CẮN DẸT: lời hứa trà sữa và bài học văn phòng\". Hai ngàn like rồi!", "happy"],
    ],
    comments: [
      { by: "batu", text: "Kết luận: lời hứa trà sữa còn nặng hơn lời hứa yêu đương 🧋💔 Bà con nhớ trả nợ trà sữa đi nha", likes: 2310 },
      { by: "Tiểu Thư Bánh Bèo 2k5", text: "\"Tôi muốn chị mở tủ ra mà bên trong trống rỗng\"... câu này đỉnh hơn phim Hàn 😭", likes: 1543 },
      { by: "Team Anh Phong", text: "Ba đêm thức sửa server mà không được ly trà sữa? Anh Phong không có lỗi, anh chỉ đói 😤", likes: 982 },
      { by: "Chị Hai Kế Toán Q3", text: "Uống trộm vẫn là sai nha mấy đứa. Muốn đòi thì nói thẳng, đừng có tắt camera", likes: 876 },
      { by: "Shop Ống Hút Tre Mỹ Tho", text: "Ống hút tre của shop cắn không dẹt, khỏi để lại bằng chứng 🎋 (đùa thôi, uống của mình thôi nha)", likes: 654 },
      { by: "Hùng Xe Ôm", text: "Sếp ngủ trưa trong phòng server 16 độ. Ước mơ của tôi đó", likes: 1201 },
      { by: "Dân IT Hẻm Bên", text: "Dán pass lên tủ server là tội nặng hơn uống trà sữa. Ai làm IT đều hiểu 💀", likes: 1888 },
      { by: "Cô Ba Bán Xôi", text: "68 ngàn một ly. Năm ly cộng bốn ly là 612 ngàn. Bằng 40 gói xôi. Tui nói vậy thôi", likes: 743 },
      { by: "Tiệm Trà Sữa (Official)", text: "Cảm ơn cả nhà đã tin tưởng Full Topping! Thạch Drama Queen xin hứa: drama trong ly, không drama ngoài ly 🧋", likes: 1320 },
      { by: "Khoa Thực Tập 1 Ngày", text: "Cảm ơn mọi người đã follow 🥹 Tập 15: \"Thực tập sinh đi làm chứng\" lên sóng tối nay", likes: 967 },
      { by: "teo", text: "Em là trợ lý thám tử, em đoán dép con vịt từ đầu. Sếp em không tin 😤", likes: 412 },
      { by: "Người Yêu Cũ Của Deadline", text: "Sếp tự mua cốc Best Boss tự viết thiệp... trời ơi tôi thấy chính tôi tự chúc mừng sinh nhật mình trên Facebook 😭", likes: 1455 },
      { by: "Bác Bảy Hưu Trí", text: "Thời tôi đi làm, ai uống trộm trà đá là bị phạt rửa ấm cả tuần. Giờ thì lên mạng. Thời thế đổi thay", likes: 389 },
      { by: "chuba", text: "Chú tới trễ, vụ xong rồi hả. Ai còn dư ly trà sữa cho chú xin nha", likes: 721 },
    ],
  },

  hints: [
    {
      needs: ["clue:ong-hut-det", "clue:coc-ong-hut", "clue:tin-nhan-hua"],
      text: "Sếp ơi đủ đồ rồi đó! Ống hút trong dây cáp, bảo tàng ống hút, lời hứa ba lần. Ra bảng suy luận chốt đi sếp!",
    },
    {
      needs: "clue:ong-hut-det",
      text: "Ống hút này dính kem cheese, cắn dẹt răng cưa. Ly nào bị mất ống hút? Bàn ai có cả rổ ống hút cắn dẹt? Mà sao chị Vy chưa nói gì với anh Phong ta, hỏi chị Vy coi.",
    },
    {
      needs: "broke:dat-hop-online",
      text: "Sếp Đạt nghe tiếng \"rột rột\" và thấy cái gì rớt vô đống dây cáp. Sếp vô phòng server soi lại khe dây cáp đi!",
    },
    {
      needs: "clue:log-the-tu",
      text: "Log chỉ có tên sếp Đạt, mà sếp Đạt khai họp online trong phòng riêng. Ủa, ai nói xạo đây? Mà sếp hỏi anh Phong coi IT vô phòng server bằng gì.",
    },
    {
      needs: "clue:log-camera",
      text: "Camera bị tắt bằng tay ở phòng server. Pass thì ai cũng đọc được. Phải biết ai vô phòng server! Chị Vy là trưởng phòng, nhờ chỉ xin log thẻ từ.",
    },
    {
      needs: "stmt:phong-o-ban",
      text: "Anh Phong nói ngồi ở bàn suốt trưa. Mà thằng Khoa có quay TikTok văn phòng trưa nay đó sếp, xem bàn Khoa rồi hỏi nó thử.",
    },
    {
      needs: "stmt:khoa-khong-mo-tu",
      text: "Khoa thề không mở tủ lạnh. Mà em nhớ bảng phân công ở pantry có ghi thứ Sáu ai dọn tủ lạnh á sếp.",
    },
    {
      text: "Em đoán là cái tủ lạnh tự uống. Đùa thôi. Sếp soi tủ lạnh, rồi hỏi chị Vy văn phòng có camera không.",
    },
  ],

  bonus: [
    {
      id: "topping",
      q: "Topping \"Mây Trôi Lững Lờ\" trong ly của chị Vy là gì?",
      choices: ["Kem cheese", "Kem muối", "Thạch phô mai", "Pudding trứng"],
      answer: 0,
      explain: "Hoá đơn ghi: kem cheese \"Mây Trôi Lững Lờ\". Chính vệt kem cheese trong lòng ống hút đã nối nó với ly của chị Vy.",
    },
    {
      id: "sep-ngu",
      q: "Vì sao sếp Đạt ngủ trưa trong phòng server?",
      choices: ["Vì phòng riêng máy lạnh hư, phòng server 16 độ", "Vì canh camera", "Vì họp với đối tác Singapore", "Vì trốn chị Vy"],
      answer: 0,
      explain: "Tờ giấy trên công tắc máy lạnh phòng sếp: \"Hư – thợ hẹn tuần sau (lần 3)\". Đối tác Singapore là sếp bịa.",
    },
    {
      id: "thu-tu",
      q: "Trên lịch trực pantry, ngày nào bị bỏ trống?",
      choices: ["Thứ Tư, ngày của chị Vy", "Thứ Năm, ngày của sếp Đạt", "Thứ Sáu, ngày của Khoa", "Thứ Hai, ngày của Hằng"],
      answer: 0,
      explain: "Thứ Tư của chị Vy để trống. Cuối vụ chị hứa sẽ tự điền tên mình. Lần này mong là chị nhớ.",
    },
  ],
};
