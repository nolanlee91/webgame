// Vụ 2: "Chiến Kê Mất Tích". Hợp đồng nhân vật + cảnh: docs/tham-tu-hem/DESIGN.md §3.
// Lời giải: Bin (cháu nội ông Bảy, ôn thi lớp 12) bị tiếng gáy 4h sáng hành mất ngủ. Đêm đó Bin đặt báo thức 2h45,
// đặt shipper giao mì + áo mưa tiện lợi lúc 2h50, dụ gà bằng lúa, bỏ vô balo khoét lỗ, tra dầu bản lề cổng cho khỏi kêu,
// mặc áo mưa (lòi ống quần đồ ngủ khủng long) đạp xe lúc 3h07 sang gửi lên sân thượng nhà bạn Nhật ở hẻm 52 (đang đào cống,
// đất đỏ). Không bán, không làm thịt: có thư dặn Nhật cho ăn, thứ Bảy rước về kịp giải.
// Gây nhiễu: ông Tám (đối thủ, lảng vảng 23h04 = lén thu âm tiếng gáy cho gà mình "quen"), cô Mười (cơm gà, giấu chuyện gà
// công nghiệp), Hải shipper (dừng ở cổng 2h50, thấy balo kêu cục cục tưởng ma, bỏ chạy rớt dép).
// Cú lật: "kẻ bắt cóc" là cháu ruột, và chính shipper bị nghi đã vô tình giao cái áo mưa cho kẻ đó.

export default {
  id: "chien-ke", no: 2, title: "Chiến Kê Mất Tích", difficulty: 1,
  tagline: "Ba ngày trước giải gà xóm, gà chọi Chiến Thần của ông Bảy biến mất không một cọng lông. Đêm đó có ít nhất bốn người thức.",
  client: "ongbay",

  intro: [
    ["narr", "Sáng thứ Năm. Một ông cụ râu bạc đứng trước văn phòng, tay ôm cái lồng gà trống trơn."],
    ["ongbay", "Thám tử... Chiến Thần của tui... mất rồi.", "nervous"],
    ["teo", "Dạ con chia buồn với ông. Ông thọ bao nhiêu tuổi ạ? À không, con gà thọ bao nhiêu tuổi ạ?", "nervous"],
    ["ongbay", "Nó chưa chết! Nó MẤT TÍCH! Chủ nhật này là giải gà xóm rồi!", "angry"],
    ["me", "Ông kể từ đầu đi."],
    ["ongbay", "Ba năm nay, đêm nào Chiến Thần cũng gáy đúng [[4h-sang|4 giờ sáng]], chuẩn hơn đồng hồ. Tui dậy theo nó pha trà.", "neutral"],
    ["ongbay", "Sáng nay 4 giờ... im re. Tui tưởng tui điếc. Ra chuồng thì trống trơn. Không một cọng lông.", "shock"],
    ["teo", "Sếp ơi, con gà không gáy là chuyện lớn đó. Mất con gà gáy là mất luôn cái đồng hồ báo thức của cả xóm!", "shock"],
    ["me", "Ông nghi ai?"],
    ["ongbay", "Thằng [[ongtam|Tám]] nhà bên! Nó nói Chủ nhật này Chiến Thần nhà tui 'khỏi gáy'. Mà nó cũng chỉ là nói thôi... tui không biết nữa.", "angry"],
    ["batu", "Thám tử ơi! Nhóm Hẻm 47 Hóng Biến lại có biến nè! Coi đi coi đi!", "happy"],
  ],

  social: {
    group: "Hẻm 47 Hóng Biến",
    posts: [
      {
        by: "batu",
        text: "🐓 CHIẾN THẦN MẤT TÍCH 🐓\nGà chọi vô địch hẻm của ông Bảy biến mất lúc nửa đêm, ba ngày trước giải! Ông Tám nhà bên tuyên bố 'Chủ nhật này nó khỏi gáy'. Cô Mười cơm gà đầu hẻm hôm nay bán ĐẮT BẤT THƯỜNG. Ai hiểu thì hiểu 👀",
        likes: 512,
        comments: [
          { by: "Tám Gà Nòi", text: "Bà Tư nói vậy là tui kiện à nha. Tui chơi gà đàng hoàng!" },
          { by: "Cơm Gà Cô Mười", text: "Cơm gà tui bán đắt vì tui nấu ngon chứ bộ!!! Gà ta thả vườn 100% nha cả nhà 🍗" },
          { by: "Bà Năm Xôi", text: "Hôm nay cơm gà cô Mười ăn thấy... có khí chất chiến binh ghê 🤔" },
          { by: "Cơm Gà Cô Mười", text: "Bà Năm đừng vậy mà 😭" },
          { by: "Hội Phụ Huynh 12A3", text: "Đề nghị xóm giữ yên tĩnh mùa thi giùm. Cảm ơn." },
          { by: "Cửa Hàng Gạo Ông Tư", text: "Lúa cho gà chọi, gạo cho người. Có đủ hết, ghé ủng hộ ạ 🌾" },
          { by: "Hải Ship Siêu Tốc", text: "Đêm qua tui chạy ngang hẻm, không thấy gì đâu nha. Không thấy gì hết. Thật." },
          { by: "teo", text: "Thám tử nhà mình nhận vụ rồi! Chiến Thần ơi chờ tụi anh! 🕵️🐓" },
        ],
      },
    ],
  },

  people: {
    ongbay: { name: "Ông Bảy", role: "Chủ gà, khách nhờ", bio: "Khoảng 70 tuổi, râu bạc, áo bà ba nâu. Nuôi gà chọi bốn chục năm, thương con gà như thương cháu." },
    ongtam: { name: "Ông Tám", role: "Hàng xóm, đối thủ gà chọi", bio: "Mặt hầm hố, nón tai bèo không rời đầu. Gà của ổng tên Bá Vương, đã thua Chiến Thần hai mùa liền.", suspect: true },
    bin: { name: "Bin", role: "Cháu nội ông Bảy, lớp 12", bio: "Kính cận, tai nghe chụp tai màu trắng đeo 24/7. Đang ôn thi đại học. Phòng trên lầu nhìn thẳng xuống chuồng gà.", suspect: true },
    comuoi: { name: "Cô Mười", role: "Bán cơm gà đầu hẻm", bio: "Tạp dề đỏ, dao chặt gà sáng loáng, giọng chào khách vang cả hẻm. Cơm gà 'ta thả vườn' nổi tiếng.", suspect: true },
    hai: { name: "Hải", role: "Shipper", bio: "Áo khoác xanh lá, mũ bảo hiểm không bao giờ tháo. Chạy đơn đêm, rành từng ngõ ngách. Sợ ma, nhưng không nhận.", suspect: true, start: false },
  },

  locations: {
    yard: {
      name: "Sân nhà ông Bảy", scene: "yard", start: true,
      intro: [
        ["narr", "Sân gạch nhà ông Bảy, giàn bông giấy rủ xuống. Chuồng gà trống trơn nằm ngay dưới cửa sổ lầu một."],
        ["teo", "Hiện trường vụ bắt cóc gà! Sếp, em đeo bao tay rồi nè. Bao tay rửa chén, nhưng cũng là bao tay.", "smug"],
      ],
      hotspots: [
        {
          id: "chuong-ga", label: "Chuồng gà", rect: [80, 240, 220, 200],
          lines: [
            ["me", "Chốt chuồng được kéo ra gọn gàng, không gãy, không cạy. Trong chuồng không một cọng lông rơi, không vết giãy giụa."],
            ["ongbay", "Chiến Thần dữ lắm. Người lạ thò tay vô là nó mổ chảy máu. Ông Tám bị mổ ba lần rồi.", "neutral"],
            ["me", "Vậy người bắt nó đi là người nó quen. Quen tới mức nó không thèm kêu."],
            ["teo", "Hoặc là người biết võ! Điểm huyệt con gà!", "shock"],
          ],
          gives: { clues: ["chuong-trong"] },
          again: [["teo", "Trên vách chuồng có dán bằng khen 'Vô địch giải gà xóm 2024, 2025'. Ông Bảy dán bằng khen cho gà mà nhà em không ai dán bằng khen cho em."]],
        },
        {
          id: "bao-lua", label: "Bao lúa", rect: [320, 360, 90, 110],
          lines: [
            ["me", "Bao [[lua|lúa]] mở miệng, vơi mất một vốc. Hột lúa rơi lấm tấm thành vệt, từ bao tới chỗ dựng xe đạp."],
            ["teo", "Có người rải lúa dụ gà! Như phim cổ tích Hansel và Gretel, mà là phiên bản gà.", "happy"],
            ["ongbay", "Lúa đó tui ngâm nước gừng, Chiến Thần mê lắm. Ai cầm nắm lúa đó là nó đi theo liền.", "neutral"],
          ],
          gives: { clues: ["vet-lua"] },
          again: [["teo", "Lúa ngâm gừng thơm ghê sếp. Em ăn thử một hột... Dạ thôi, em không ăn."]],
        },
        {
          id: "cong-sat", label: "Cổng sắt", rect: [700, 80, 240, 380],
          lines: [
            ["me", "Ổ khoá cổng còn nguyên, chốt được mở từ bên trong. Không ai trèo, không ai cạy."],
            ["me", "Bản lề còn nhỏ giọt [[dau-xich|dầu tra xích]] mới tra. Mùi dầu còn nồng."],
            ["ongbay", "Ủa? Cổng nhà tui kêu két két ba năm nay, tui có tra dầu bao giờ đâu.", "shock"],
            ["teo", "Ai đó muốn mở cổng mà không ai nghe! Sếp, kẻ trộm này ở trong nhà đi ra đó!", "shock"],
          ],
          gives: { clues: ["ban-le-dau"], locs: ["alley"] },
          again: [["teo", "Em mở thử... êm ru luôn sếp. Ông Bảy ơi, cổng nhà ông giờ xịn như cổng biệt thự."]],
        },
        {
          id: "xe-dap", label: "Xe đạp", rect: [460, 300, 180, 160],
          lines: [
            ["me", "Xe đạp mini cũ, sơn xanh. Hai bánh còn dính [[bun-do|bùn đất đỏ]] ướt, đóng cục ở vè xe."],
            ["me", "Một cọng lông đỏ tía kẹt trong nan bánh trước. Trong giỏ xe có chai dầu tra xích mới mua, còn nguyên tem."],
            ["ongbay", "Xe của thằng Bin. Nó đạp đi học thêm. Mà hẻm mình tráng bê tông hết, đâu ra bùn đỏ?", "neutral"],
          ],
          gives: { clues: ["bun-xe-dap"] },
          again: [["teo", "Xe này có cái chuông kêu 'kính coong'. Em bấm thử. Kính coong! Dạ em xin lỗi."]],
        },
        {
          id: "ban-tho-to", label: "Bàn thờ Tổ nghề", rect: [340, 80, 140, 140],
          lines: [
            ["me", "Bàn thờ Tổ nghề nuôi gà. Lư hương, dĩa trái cây, và tấm hình Chiến Thần đeo huy chương."],
            ["teo", "Sếp ơi, quả chuối trên dĩa có vết mổ! Chiến Thần hiện hồn về ăn chuối!", "shock"],
            ["ongbay", "Chuối đó nó mổ từ hôm kia. Nó hay lên bàn thờ ăn vụng.", "neutral"],
            ["teo", "...Con gà ăn vụng đồ cúng Tổ. Gà này đúng là chiến thần thiệt.", "smug"],
          ],
          again: [["ongbay", "Tui khấn Tổ ba ngày rồi. Tổ chưa trả lời. Chắc Tổ cũng đang đi tìm.", "nervous"]],
        },
        {
          id: "ga-mai", label: "Gà mái Hoa Hậu", rect: [230, 450, 80, 60],
          lines: [
            ["ongbay", "Con mái đó tên Hoa Hậu. Bồ của Chiến Thần. Từ sáng tới giờ nó không chịu ăn.", "nervous"],
            ["teo", "Tội nghiệp chị Hoa Hậu... Chị có thấy gì không chị? Chị chớp mắt một cái là có, hai cái là không.", "nervous"],
            ["narr", "Hoa Hậu chớp mắt ba cái rồi mổ vô dép Tèo."],
          ],
          again: [["teo", "Chị Hoa Hậu ghét em. Em chưa làm gì chị hết mà."]],
        },
      ],
    },

    alley: {
      name: "Đầu hẻm", scene: "alley",
      intro: [
        ["narr", "Đầu hẻm 47 lúc sáng: xe cơm gà nghi ngút khói, cột điện rối như tơ vò, tiệm vàng vừa kéo cửa."],
        ["teo", "Đầu hẻm là nơi mọi thông tin đi qua. Như cái cổng Wi-Fi của xóm vậy sếp.", "smug"],
      ],
      hotspots: [
        {
          id: "xe-com-ga", label: "Xe cơm gà cô Mười", rect: [80, 220, 260, 220],
          lines: [
            ["me", "Xe cơm gà treo bảng: 'CƠM GÀ TA THẢ VƯỜN – NHÀ NUÔI'. Trong tủ kính là mấy con gà luộc da vàng ươm, lông được nhổ sạch sẽ."],
            ["teo", "Sếp, nhìn kỹ coi có con nào đeo vòng chân số 07 không! Có không sếp?!", "shock"],
            ["me", "Không con nào đeo vòng. Mà con nào cũng mập ú, chân trắng. Gà chọi thì chân vàng, mình thon dài."],
          ],
          again: [["comuoi", "Thám tử ăn một dĩa không? Đùi nha? Đùi gà ta thả vườn đó!", "happy"]],
        },
        {
          id: "cot-dien", label: "Cột điện", rect: [400, 20, 90, 500],
          lines: [
            ["me", "Cột điện dán đủ thứ: 'Khoan cắt bê tông', 'Dạy kèm Toán lớp 12', và tờ 'TÌM GÀ LẠC – thưởng 500 nghìn và một hũ mắm' của ông Bảy."],
            ["me", "Một tờ thông báo của phường: 'Thi công cống thoát nước [[hem-52|hẻm 52]] từ 20 đến 25/11. Đường đất đỏ, bà con đi chậm.'"],
            ["teo", "Hẻm 52 đang đào cống, đất đỏ! Hẻm mình tráng bê tông hết rồi đó sếp.", "neutral"],
          ],
          gives: { clues: ["thong-bao-cong"] },
          again: [["teo", "Tờ 'Dạy kèm Toán lớp 12' có số điện thoại. Chắc Bin cần lắm."]],
        },
        {
          id: "camera-tiem-vang", label: "Camera tiệm vàng", rect: [560, 60, 90, 70],
          lines: [
            ["batu", "Camera tiệm vàng hả? Chủ tiệm là cháu tui! Để tui gọi nó mở cho coi!", "happy"],
            ["narr", "Năm phút sau, bà Tư chìa điện thoại. Đoạn ghi hình đêm qua, ngay trước cổng nhà ông Bảy."],
            ["me", "[[23h04]]: một người đội nón tai bèo đứng sát rào nhà ông Bảy, chĩa điện thoại vô chuồng gà, rọi đèn pin."],
            ["me", "[[2h50]]: một xe máy shipper áo xanh lá dừng trước cổng. 2h53: chiếc xe đó phóng đi như bị ma rượt."],
            ["me", "[[3h07]]: một người mặc [[ao-mua|áo mưa]] tiện lợi trùm kín, dắt xe đạp ra khỏi cổng. Balo sau lưng phồng to, có lúc động đậy. Dưới vạt áo mưa lòi ra ống quần có hình khủng long."],
            ["me", "[[4h30]]: xe tải nhỏ giao hai thùng xốp cho [[xe-com-ga|xe cơm gà]] đầu hẻm."],
            ["teo", "Nón tai bèo là ông Tám! Áo xanh lá là shipper! Còn người áo mưa... là ai ta? Mặc đồ ngủ khủng long đi bắt gà hả?", "shock"],
          ],
          gives: { clues: ["camera-dem"], people: ["hai"] },
          again: [["batu", "Cháu tui nói xem xong nhớ like trang tiệm vàng nha thám tử. Vàng nhẫn đang giảm nè.", "happy"]],
        },
        {
          id: "thung-xop", label: "Thùng xốp", rect: [300, 420, 110, 90],
          lines: [
            ["me", "Hai thùng xốp rỗng sau xe cơm gà. Dán nhãn: '[[ga-cong-nghiep|Gà công nghiệp]] làm sẵn – 20 con – chợ đầu mối – giao 4h30'."],
            ["me", "Đáy thùng còn dính mấy cọng lông trắng. Chiến Thần lông đỏ tía, đuôi xanh đen."],
            ["teo", "Ủa... gà ta thả vườn mà ship bằng xe tải từ chợ đầu mối hả sếp?", "smug"],
          ],
          gives: { clues: ["thung-xop-ga"] },
          again: [["teo", "Thùng xốp này mà bỏ đá vô ướp nước ngọt đi biển là hết sẩy."]],
        },
        {
          id: "xe-may-shipper", label: "Xe máy shipper", rect: [680, 280, 240, 200],
          lines: [
            ["me", "Một xe máy có thùng giao hàng, dựng cạnh xe cơm gà. Chủ xe đang ngồi ăn cơm, mũ bảo hiểm vẫn đội trên đầu."],
            ["teo", "Anh Hải shipper đó sếp! Anh này chạy đêm khắp xóm. Hỏi ảnh đi!", "happy"],
            ["me", "Chân phải mang dép, chân trái... đi đất."],
          ],
          gives: { people: ["hai"] },
          again: [["teo", "Trên thùng xe ghi 'Giao nhanh như gió, an toàn như mẹ bồng'. Câu slogan này em thích."]],
        },
        {
          id: "dep-lac", label: "Chiếc dép lạc", rect: [500, 470, 60, 40],
          lines: [
            ["me", "Một chiếc dép tổ ong chân trái nằm chỏng chơ giữa đường, cách cổng nhà ông Bảy vài bước."],
            ["teo", "Dép giống dép em! Sếp đừng nhìn em vậy, em còn đủ hai chiếc nè!", "nervous"],
          ],
          gives: { clues: ["dep-lac"] },
          again: [["teo", "Ai chạy mà rớt dép không quay lại lượm, chắc là sợ lắm."]],
        },
      ],
    },

    binroom: {
      name: "Phòng của Bin", scene: "binroom",
      intro: [
        ["narr", "Phòng Bin trên lầu: sách chất thành núi, giấy note dán kín tường, mùi mì cay còn vương."],
        ["teo", "Phòng học sinh lớp 12 nè sếp. Em nhìn thôi đã thấy áp lực.", "nervous"],
      ],
      hotspots: [
        {
          id: "ban-hoc", label: "Bàn học", rect: [80, 260, 280, 200],
          lines: [
            ["me", "Bàn học ngập đề thi thử. Một tờ giấy note dán giữa bàn, chữ viết run run:"],
            ["narr", "'4h00: GÀ GÁY. 4h05: tỉnh. 4h10: quên công thức đạo hàm. 4h30: muốn khóc. Lặp lại 87 ngày.'"],
            ["me", "Kế bên là bài thi thử Toán: 5,25 điểm. Có dòng ghi 'Ngủ được thì đã 8 điểm'."],
            ["teo", "87 ngày bị [[gay-4h|tiếng gáy 4 giờ sáng]] đánh thức... Sếp ơi em thấy thương Bin ghê.", "nervous"],
          ],
          gives: { clues: ["nhat-ky-mat-ngu"] },
          again: [["teo", "Dưới gầm bàn có hai ly mì cay rỗng với hai lon nước tăng lực. Thức khuya ghê vậy."]],
        },
        {
          id: "dong-ho-bao-thuc", label: "Đồng hồ báo thức", rect: [300, 200, 60, 60],
          lines: [
            ["me", "Đồng hồ báo thức điện tử. Hẹn giờ đêm qua: [[2h45]]."],
            ["me", "Tên báo thức hiện trên màn hình: 'CHIẾN DỊCH G 🐔'."],
            ["teo", "Báo thức 2 giờ 45? Đi học đâu mà dậy 2 giờ 45 sếp? Mà sao có hình con gà?", "shock"],
          ],
          gives: { clues: ["dong-ho-bao-thuc"] },
          again: [["teo", "Nhạc chuông báo thức là... tiếng gà gáy. Bin ơi là Bin."]],
        },
        {
          id: "balo", label: "Balo", rect: [480, 380, 120, 130],
          lines: [
            ["me", "Balo đi học màu đen. Mặt sau bị khoét ba lỗ tròn đều, cỡ ngón tay, như dùng mũi compa đục."],
            ["me", "Bên trong không có sách. Chỉ có vài hột lúa ngâm gừng và hai cọng lông đỏ tía, đuôi xanh đen."],
            ["teo", "Balo có lỗ thở! Sếp, cái này để đựng... một sinh vật sống!", "shock"],
          ],
          gives: { clues: ["balo-long-ga"] },
          again: [["teo", "Em thử đeo lên... nó còn ấm ấm, còn mùi gà. Em không đeo nữa đâu."]],
        },
        {
          id: "cua-so-phong", label: "Cửa sổ phòng", rect: [620, 60, 240, 200],
          lines: [
            ["me", "Cửa sổ nhìn thẳng xuống [[chuong-ga|chuồng gà]], cách chưa tới ba mét."],
            ["teo", "Ở đây gà gáy là như gáy vô lỗ tai luôn. Có đeo tai nghe chống ồn cũng thua.", "nervous"],
            ["me", "Khung cửa có dán băng keo kín khe hở, nhiều lớp. Ai đó đã cố bịt tiếng ồn rất lâu rồi."],
          ],
          again: [["teo", "Từ đây nhìn ra thấy luôn sân thượng nhà bên kia, hướng hẻm 52. Có cái chuồng bồ câu trên đó."]],
        },
        {
          id: "poster", label: "Poster", rect: [380, 60, 180, 140],
          lines: [
            ["me", "Poster to: 'BÁCH KHOA ĐỢI TAO'. Có chữ ký nguệch ngoạc của mấy đứa bạn: 'Bin cố lên!', 'Nhật đây, cố lên mày!'"],
            ["teo", "Em cũng từng dán poster 'Đại học đợi tao'. Đại học đợi lâu quá nên nó đi trước rồi.", "nervous"],
          ],
          again: [["me", "Góc poster hơi phồng, như có gì kẹp phía sau. Phải có lý do để lật ra coi đã."]],
        },
        {
          id: "giuong", label: "Giường", rect: [640, 300, 300, 220],
          lines: [
            ["me", "Giường bừa bộn. Trên thành giường vắt bộ [[do-ngu|đồ ngủ khủng long]] xanh lá, ống quần còn ẩm, dính bùn đất đỏ."],
            ["teo", "Đồ ngủ khủng long! Y chang ống quần lòi ra dưới áo mưa trong camera!", "shock"],
          ],
          gives: { clues: ["do-ngu-khung-long"] },
          again: [["teo", "Gối của Bin in chữ 'Ngủ là để yếu'. Mà Bin có được ngủ đâu."]],
        },
        {
          id: "thu-nhat", label: "Sau tấm poster", rect: [440, 120, 80, 70], needs: "broke:bin-o-nha",
          lines: [
            ["me", "Lật góc poster. Kẹp phía sau là mấy bản nháp lá thư, gạch xoá tùm lum. Bản cuối cùng:"],
            ["narr", "'Nhật ơi, gửi mày Chiến Thần mấy bữa trên [[san-thuong-nhat|sân thượng nhà mày]]. Cho nó ăn lúa ngâm gừng hai bữa. 4h nó gáy thì kệ nó. Thứ Bảy tao rước về kịp giải. ĐỪNG CHO ÔNG TÁM BIẾT. – Bin'"],
            ["teo", "Không bán! Không làm thịt! Gửi đi 'nghỉ dưỡng'! Sếp ơi, Chiến Thần còn sống!", "happy"],
          ],
          gives: { clues: ["thu-gui-nhat"] },
          again: [["teo", "Bản nháp số 3 ghi: 'Nhật ơi, gà nhà tao bị ma nhập'. Bin gạch bỏ rồi. May."]],
        },
      ],
    },
  },

  clues: {
    "hinh-chien-than": { name: "Hình Chiến Thần", desc: "Gà chọi lông đỏ tía, đuôi xanh đen, chân vàng. Đeo vòng chân nhựa xanh số 07. Mổ người lạ, hiền với người nhà." },
    "chuong-trong": { name: "Chuồng gà trống", desc: "Chốt chuồng kéo ra gọn, không lông rơi, không vết giãy giụa. Người bắt là người Chiến Thần quen, nó không thèm kêu." },
    "vet-lua": { name: "Vệt lúa rơi", desc: "Bao [[lua|lúa]] ngâm gừng vơi một vốc. Hột lúa rơi thành vệt từ bao tới chỗ dựng xe đạp: có người dụ gà bằng lúa." },
    "ban-le-dau": { name: "Bản lề mới tra dầu", desc: "Cổng sắt kêu két ba năm nay, đêm qua có người tra [[dau-xich|dầu tra xích]] vào bản lề cho êm. Chốt mở từ bên trong nhà." },
    "bun-xe-dap": { name: "Xe đạp dính bùn đỏ", desc: "Xe đạp của [[bin|Bin]]: hai bánh dính [[bun-do|bùn đất đỏ]] còn ướt, lông đỏ tía kẹt nan bánh, trong giỏ có chai dầu tra xích mới. Hẻm 47 tráng bê tông, chỉ hẻm 52 đang đào cống mới có đất đỏ." },
    "camera-dem": {
      name: "Camera tiệm vàng đêm qua", desc: "[[23h04]] người đội nón tai bèo chĩa điện thoại vô chuồng gà. [[2h50]] shipper áo xanh lá dừng ở cổng, 2h53 phóng đi. [[3h07]] người mặc [[ao-mua|áo mưa]] tiện lợi dắt xe đạp ra, balo phồng động đậy, lòi ống quần hình khủng long. [[4h30]] xe tải giao thùng xốp cho xe cơm gà.",
      detail: [["teo", "Người áo mưa đi về phía hẻm 52 đó sếp. Mà mưa tạnh từ 3 giờ rồi, mặc áo mưa chắc để... che mặt?", "neutral"]],
    },
    "thung-xop-ga": { name: "Thùng xốp gà công nghiệp", desc: "Nhãn: '[[ga-cong-nghiep|Gà công nghiệp]] làm sẵn – 20 con – chợ đầu mối – giao [[4h30]]'. Lông trắng, không phải lông đỏ tía của Chiến Thần." },
    "thong-bao-cong": { name: "Thông báo đào cống", desc: "Phường thi công cống thoát nước [[hem-52|hẻm 52]] từ 20 đến 25/11, đường đất đỏ. Hẻm 47 đã tráng bê tông." },
    "dep-lac": { name: "Chiếc dép lạc", desc: "Một chiếc dép tổ ong chân trái, rớt giữa đường gần cổng nhà ông Bảy. Ai đó chạy vội tới mức không quay lại lượm." },
    "don-hang-dem": { name: "Đơn hàng 2h50", desc: "Đơn trên app của Hải: khách '[[bin|Bin]] 2k9 ôn thi', giao [[2h50]] tới nhà ông Bảy. Gồm 2 ly mì cay, 2 lon nước tăng lực, 1 [[ao-mua|áo mưa]] tiện lợi. Ghi chú: 'Để ở cổng, đừng bấm chuông, nhà có ông ngủ + gà'." },
    "dong-ho-bao-thuc": { name: "Đồng hồ báo thức", desc: "Đồng hồ trong phòng Bin hẹn [[2h45]] đêm qua, tên báo thức 'CHIẾN DỊCH G 🐔'. Nhạc chuông: tiếng gà gáy." },
    "nhat-ky-mat-ngu": { name: "Giấy note mất ngủ", desc: "'4h00: GÀ GÁY. 4h05: tỉnh. 4h10: quên công thức đạo hàm. Lặp lại 87 ngày.' Bin bị [[gay-4h|tiếng gáy 4 giờ sáng]] hành suốt mùa ôn thi." },
    "balo-long-ga": { name: "Balo khoét lỗ", desc: "[[balo|Balo]] đi học của Bin bị khoét ba lỗ thở, bên trong có hột lúa ngâm gừng và lông đỏ tía, đuôi xanh đen." },
    "do-ngu-khung-long": { name: "Đồ ngủ khủng long", desc: "Bộ [[do-ngu|đồ ngủ khủng long]] xanh lá của Bin, ống quần còn ẩm, dính bùn đất đỏ. Trùng với ống quần lòi dưới áo mưa trong camera lúc 3h07." },
    "thu-gui-nhat": { name: "Thư gửi Nhật", desc: "Bản nháp thư của Bin: gửi Chiến Thần lên [[san-thuong-nhat|sân thượng nhà Nhật]] mấy bữa, dặn cho ăn lúa, thứ Bảy rước về kịp giải. 'Đừng cho ông Tám biết.'" },
    "ghi-am-ga-gay": { name: "File ghi âm của ông Tám", desc: "File 'ChienThan_gay_23h04.m4a' trong điện thoại ông Tám: Chiến Thần gáy rõ mồn một lúc [[23h04]]. Lúc đó gà còn trong chuồng." },
  },

  words: {
    // ai
    ongtam: { text: "ông Tám", kind: "ai" },
    bin: { text: "Bin", kind: "ai" },
    comuoi: { text: "cô Mười", kind: "ai" },
    hai: { text: "Hải", kind: "ai" },
    ongbay: { text: "ông Bảy", kind: "ai" },
    // lúc
    "23h04": { text: "23h04", kind: "luc" },
    "2h45": { text: "2h45", kind: "luc" },
    "2h50": { text: "2h50", kind: "luc" },
    "3h07": { text: "3h07", kind: "luc" },
    "4h-sang": { text: "4h sáng", kind: "luc" },
    "4h30": { text: "4h30", kind: "luc" },
    // ở
    "chuong-ga": { text: "chuồng gà", kind: "o" },
    "san-thuong-nhat": { text: "sân thượng nhà Nhật", kind: "o" },
    "xe-com-ga": { text: "xe cơm gà", kind: "o" },
    "nha-ong-tam": { text: "nhà ông Tám", kind: "o" },
    // vật
    lua: { text: "lúa ngâm gừng", kind: "vat" },
    "dau-xich": { text: "dầu tra xích", kind: "vat" },
    "bun-do": { text: "bùn đất đỏ", kind: "vat" },
    "ao-mua": { text: "áo mưa", kind: "vat" },
    "ga-cong-nghiep": { text: "gà công nghiệp", kind: "vat" },
    balo: { text: "balo", kind: "vat" },
    "do-ngu": { text: "đồ ngủ khủng long", kind: "vat" },
    "tai-nghe": { text: "tai nghe", kind: "vat" },
    "thung-xop": { text: "thùng xốp", kind: "vat" },
    // vì
    "gay-4h": { text: "tiếng gáy 4 giờ sáng", kind: "vi" },
    "so-thua": { text: "sợ thua giải", kind: "vi" },
    "ban-lay-tien": { text: "bán lấy tiền", kind: "vi" },
    "lam-com-ga": { text: "làm cơm gà", kind: "vi" },
    // khác
    "ga-tha-vuon": { text: "gà ta thả vườn", kind: "khac" },
    "o-nha": { text: "ở nhà coi cải lương", kind: "khac" },
    "khong-ghe": { text: "không dừng nhà ai", kind: "khac" },
    "ngu-say": { text: "ngủ say tới sáng", kind: "khac" },
    "hem-52": { text: "hẻm 52", kind: "khac" },
  },

  talks: {
    ongbay: [
      {
        id: "dem-qua", topic: "Đêm qua nhà ông có gì lạ?",
        lines: [
          ["ongbay", "Tui ngủ lúc 10 giờ. Khoảng 2 giờ thì mưa lâm râm, tới 3 giờ tạnh. Tui nghe tiếng mưa thôi, không nghe gì khác.", "neutral"],
          ["ongbay", "Mà lạ cái là cổng nhà tui đêm nào mở cũng kêu két két. Đêm qua không nghe tiếng két nào hết.", "nervous"],
          ["teo", "Ông ngủ say quá thôi ông ơi.", "neutral"],
          ["ongbay", "Tui ngủ say mà cái cổng đó kêu tui còn tỉnh! Bốn chục năm nghe gà, lỗ tai tui thính lắm.", "angry"],
        ],
        gives: { locs: ["alley"] },
      },
      {
        id: "chien-than", topic: "Chiến Thần trông ra sao?",
        lines: [
          ["ongbay", "Lông đỏ tía, đuôi xanh đen óng ánh, chân vàng như nghệ. Chân trái đeo vòng nhựa xanh số 07.", "happy"],
          ["ongbay", "Nó dữ với người lạ mà hiền với người nhà. Thằng Bin hồi nhỏ còn ôm nó ngủ trưa.", "neutral"],
          ["ongbay", "Hình nó nè, thám tử giữ đi. Đẹp trai hông?", "smug"],
          ["teo", "Đẹp trai hơn em ông ơi.", "nervous"],
        ],
        gives: { clues: ["hinh-chien-than"] },
      },
      {
        id: "nghi-ai", topic: "Ông còn nghi ai nữa?",
        lines: [
          ["ongbay", "Thằng Tám thì có thù. [[comuoi|Cô Mười]] cơm gà thì... bán gà mà, ai biết. Còn thằng [[hai|Hải]] shipper đêm nào cũng chạy qua chạy lại.", "angry"],
          ["teo", "Sếp, hay cô Mười đem Chiến Thần đi [[lam-com-ga|làm cơm gà]]? Hay shipper bắt đi [[ban-lay-tien|bán lấy tiền]] trên mạng?", "smug"],
          ["ongbay", "Trời ơi đừng nói vậy! Tui đứng tim!", "shock"],
          ["me", "Tèo. Đoán thì để cuối. Giờ là lúc soi."],
        ],
      },
      {
        id: "chau-bin", topic: "Cháu nội ông dạo này sao?",
        lines: [
          ["ongbay", "Thằng Bin hả? Nó ôn thi đại học, học tới khuya lắc. Phòng nó trên lầu, ngay trên chuồng gà.", "neutral"],
          ["ongbay", "Dạo này nó ít nói lắm. Mắt thâm quầng. Tui hỏi thì nó nói 'tại con gà'. Tui tưởng nó giỡn.", "nervous"],
          ["ongbay", "Thám tử muốn lên phòng nó coi thì cứ lên. Nó đi học thêm tới trưa mới về.", "neutral"],
        ],
        gives: { locs: ["binroom"] },
      },
      {
        id: "ao-mua", topic: "Người mặc áo mưa trong camera", needs: "clue:camera-dem",
        lines: [
          ["ongbay", "Nhà tui có áo mưa cánh dơi màu xanh thôi. Cái áo mưa tiện lợi mỏng dính kia là loại mua ở tiệm tạp hoá.", "neutral"],
          ["ongbay", "Mà... cái ống quần khủng long... tui thấy quen quen...", "nervous"],
        ],
      },
      {
        id: "bin-di", topic: "Ông có biết Bin ra khỏi nhà đêm qua?", needs: "broke:bin-o-nha",
        lines: [
          ["ongbay", "Thằng Bin... đi đâu giờ đó?", "shock"],
          ["ongbay", "Trời đất ơi. Hồi nãy giờ tui đi nghi hết thiên hạ.", "nervous"],
        ],
      },
    ],

    ongtam: [
      {
        id: "dem-qua", topic: "Đêm qua ông ở đâu?",
        lines: [
          ["ongtam", "Tui [[o-nha|ở nhà coi cải lương]] tới sáng. Vở 'Đời Cô Lựu'. Không bước ra khỏi cửa một bước.", "angry"],
          ["ongtam", "Thằng Bảy nghi tui là chuyện của nó. Tui chơi gà đàng hoàng, thắng thua trên sới.", "angry"],
        ],
        gives: { stmts: ["ongtam-o-nha"] },
      },
      {
        id: "giai-ga", topic: "Ông nói Chiến Thần 'khỏi gáy' là sao?",
        lines: [
          ["ongtam", "Thì ý tui là Bá Vương nhà tui sẽ thắng, Chiến Thần thua quê quá khỏi dám gáy! Nói cho oai thôi!", "smug"],
          ["ongtam", "Ai dè thằng Bảy tưởng thiệt. Bà Tư còn đăng lên Zalo. Giờ cả xóm nhìn tui như nhìn tội phạm.", "nervous"],
          ["teo", "Chắc ông [[so-thua|sợ thua giải]] nên ra tay trước!", "smug"],
          ["ongtam", "Mày nói nữa tao cho Bá Vương mổ mày.", "angry"],
        ],
      },
      {
        id: "ong-bay", topic: "Ông với ông Bảy thân không?",
        lines: [
          ["ongtam", "Hồi trẻ tui với [[ongbay|thằng Bảy]] chung đội đá banh. Nó thủ môn, tui tiền đạo. Tui sút nó bắt hết.", "neutral"],
          ["ongtam", "Ba chục năm rồi vẫn vậy. Gà tui đá với gà nó, gà nó cũng thắng hết. Tức chớ.", "angry"],
          ["ongtam", "Mà... nó mất gà thì tui cũng buồn. Không có đối thủ thì chơi với ai.", "nervous"],
        ],
      },
      {
        id: "ghi-am", topic: "Ông thu âm cái gì lúc 23h04?", needs: "broke:ongtam-o-nha",
        lines: [
          ["ongtam", "Đây nè, file ghi âm đây. Tui rọi đèn pin cho nó tưởng trời sáng, nó gáy liền. Gáy hay thiệt.", "nervous"],
          ["ongtam", "Tui về mở cho Bá Vương nghe mỗi đêm, cho nó quen tiếng, Chủ nhật lên sới đỡ run.", "nervous"],
          ["ongtam", "Lúc tui về thì Chiến Thần còn trong chuồng, còn mổ vô rào một phát. Tui thề trên nón tai bèo này.", "angry"],
        ],
        gives: { clues: ["ghi-am-ga-gay"] },
      },
    ],

    bin: [
      {
        id: "dem-qua", topic: "Đêm qua con làm gì?",
        lines: [
          ["bin", "Con học tới 11 giờ rồi [[ngu-say|ngủ say tới sáng]]. Ngủ say như chết luôn chú. Có động đất con cũng không hay.", "nervous"],
          ["bin", "Con đeo [[tai-nghe|tai nghe]] chống ồn ngủ mà.", "neutral"],
        ],
        gives: { stmts: ["bin-ngu-say"] },
      },
      {
        id: "chien-than", topic: "Con thấy Chiến Thần thế nào?",
        lines: [
          ["bin", "Dạ... nó hay. Nó gáy... đúng giờ lắm.", "nervous"],
          ["bin", "Hồi nhỏ con thương nó lắm. Giờ cũng thương. Chỉ là... thôi không có gì.", "nervous"],
          ["teo", "Bin, sao em nói tới con gà mà mắt giật giật vậy?", "neutral"],
          ["bin", "Tại con thiếu ngủ.", "angry"],
        ],
      },
      {
        id: "on-thi", topic: "Ôn thi tới đâu rồi?",
        lines: [
          ["bin", "Thi thử Toán được 5,25. Ba con nói không đậu Bách Khoa thì đi học nghề nuôi gà với ông nội.", "nervous"],
          ["bin", "Con không ghét gà. Con chỉ ghét 4 giờ sáng.", "angry"],
        ],
      },
      {
        id: "chien-dich-g", topic: "Báo thức 'Chiến dịch G' là gì?", needs: "clue:dong-ho-bao-thuc",
        lines: [
          ["bin", "G là... Giải tích! Chiến dịch Giải tích! Con dậy 2h45 học Giải tích!", "nervous"],
          ["me", "Vậy sao có hình con gà?"],
          ["bin", "Tại... tại 'G' là 'Gà'... à không, 'G' là 'Giải tích'... Con buồn ngủ quá chú.", "shock"],
        ],
      },
      {
        id: "don-hang", topic: "Đơn hàng giao lúc 2h50", needs: "broke:bin-ngu-say",
        lines: [
          ["bin", "Dạ thì con có dậy ăn mì. Học khuya đói bụng mà chú.", "nervous"],
          ["bin", "Nhưng con ra cổng lấy đồ xong là đi vô ăn rồi ngủ lại liền. Con không có ra khỏi nhà.", "nervous"],
        ],
        gives: { stmts: ["bin-o-nha"] },
      },
    ],

    comuoi: [
      {
        id: "sang-som", topic: "Sáng nay 4 giờ cô làm gì?",
        lines: [
          ["comuoi", "Tui dậy làm gà! Gà tui là [[ga-tha-vuon|gà ta thả vườn]], tui tự nuôi ở nhà, sáng nào cũng tự làm từ 4 giờ.", "smug"],
          ["comuoi", "Nên mới ngon. Nên mới đắt. Chớ không phải vì có con gà nào mất tích hết nha!", "angry"],
        ],
        gives: { stmts: ["comuoi-tha-vuon"] },
      },
      {
        id: "ga-choi", topic: "Gà chọi nấu cơm gà được không cô?",
        lines: [
          ["comuoi", "Trời đất! Gà chọi thịt dai nhách như dây thun, nấu ba tiếng chưa mềm. Ai mà nấu!", "shock"],
          ["comuoi", "Mà Chiến Thần mổ tui một lần rồi. Tui sợ nó còn hơn sợ thuế.", "nervous"],
          ["teo", "Vậy cô có động cơ trả thù!", "smug"],
          ["comuoi", "Động cơ cái đầu mày. Ăn cơm không? Không ăn thì đi chỗ khác.", "angry"],
        ],
      },
      {
        id: "lo-ban", topic: "Sao hôm nay cô bán đắt vậy?",
        lines: [
          ["comuoi", "Tại bà Tư đăng Zalo đó! Ai cũng tò mò ra mua coi có phải 'cơm gà chiến thần' không.", "angry"],
          ["comuoi", "Hết sạch từ 9 giờ. Nói thiệt, tui chưa bao giờ bán chạy vậy. Cảm ơn bà Tư... à không, tui vẫn giận bà Tư.", "smug"],
        ],
      },
      {
        id: "thay-gi", topic: "Gần 4 giờ sáng cô có thấy ai không?", needs: "broke:comuoi-tha-vuon",
        lines: [
          ["comuoi", "Gần 4 giờ tui ra dọn xe chờ hàng, thấy một đứa đạp xe từ phía hẻm 52 về. Ướt nhẹp, bánh xe lép bép bùn.", "neutral"],
          ["comuoi", "Nó đeo cái tai nghe trắng to bự, mặc đồ ngủ gì xanh xanh có gai trên lưng. Tui tưởng đứa nào đi chơi khuya.", "neutral"],
          ["teo", "Gai trên lưng... Khủng long! Sếp ơi!", "shock"],
        ],
      },
    ],

    hai: [
      {
        id: "dem-qua", topic: "Đêm qua anh chạy đơn ở đâu?",
        lines: [
          ["hai", "Tui chạy ngang hẻm này đúng một lần, [[khong-ghe|không dừng nhà ai]] hết. Chạy thẳng một mạch.", "nervous"],
          ["hai", "Mà sao hỏi tui? Shipper chạy ngang là chuyện bình thường mà.", "angry"],
        ],
        gives: { stmts: ["hai-khong-ghe"] },
      },
      {
        id: "ban-ga", topic: "Nghe nói anh bán gà online?",
        lines: [
          ["hai", "Ai đồn vậy? Tui bán sticker Zalo hình con mèo, mười nghìn một bộ. Không bán gà!", "angry"],
          ["hai", "Mà nếu thám tử muốn mua sticker thì tui giảm còn tám nghìn.", "happy"],
        ],
      },
      {
        id: "mu-bao-hiem", topic: "Sao anh không bao giờ tháo mũ?",
        lines: [
          ["hai", "Tháo ra mất kiểu tóc. Chạy đơn cả ngày, kiểu tóc là thứ duy nhất tui giữ được.", "smug"],
          ["teo", "Anh nói câu này nghe triết lý ghê.", "happy"],
        ],
      },
      {
        id: "chiec-dep", topic: "Chiếc dép tổ ong này của anh hả?", needs: "clue:dep-lac",
        lines: [
          ["hai", "Không phải! ...Mà nếu phải thì sao? Dép tổ ong ai mà chả có!", "nervous"],
          ["teo", "Anh đang đi đất một chân kìa anh.", "smug"],
          ["hai", "Tui đang... thử nghiệm phong cách mới.", "nervous"],
        ],
      },
      {
        id: "nguoi-nhan", topic: "Người nhận đơn lúc 2h50 là ai?", needs: "broke:hai-khong-ghe",
        lines: [
          ["hai", "Đây, app tui còn lưu đơn nè. Khách tên 'Bin 2k9 ôn thi', ghi chú đừng bấm chuông.", "nervous"],
          ["hai", "Một thằng nhỏ đeo tai nghe trắng, mặc đồ ngủ khủng long ra lấy đồ. Nó nói nhỏ 'cảm ơn anh', rồi mặc cái áo mưa vô liền tại chỗ.", "neutral"],
          ["hai", "Rồi cái balo dưới chân cổng nó... động đậy. Nó kêu 'cục... cục...'. Tui tưởng balo bị ma nhập, tui rồ ga chạy, rớt luôn chiếc dép.", "shock"],
          ["hai", "Thám tử đừng nói ai tui sợ ma nha. Tui là shipper chạy đêm, mất uy tín lắm.", "nervous"],
        ],
        gives: { clues: ["don-hang-dem"] },
      },
    ],
  },

  stmts: {
    "ongtam-o-nha": {
      by: "ongtam", text: "Đêm qua tui [[o-nha|ở nhà coi cải lương]] tới sáng, không bước ra khỏi cửa một bước.",
      break: {
        clue: "camera-dem",
        lines: [
          ["me", "23h04, camera tiệm vàng quay được một cái nón tai bèo đứng sát rào nhà ông Bảy, rọi đèn pin vô chuồng gà. Cải lương chiếu ngoài rào hả ông Tám?"],
          ["ongtam", "Nón tai bèo thiếu gì người đội!", "angry"],
          ["teo", "Cả hẻm này có mình ông đội nón tai bèo đi ngủ đó ông.", "smug"],
          ["ongtam", "...Thôi được. Tui có qua. Nhưng tui không bắt gà! Tui qua... thu âm.", "nervous"],
        ],
        gives: { words: ["nha-ong-tam"] },
      },
    },
    "comuoi-tha-vuon": {
      by: "comuoi", text: "Gà tui là [[ga-tha-vuon|gà ta thả vườn]], tui tự nuôi ở nhà, sáng nào cũng tự làm từ 4 giờ.",
      break: {
        clue: "thung-xop-ga",
        lines: [
          ["me", "Thùng xốp sau xe cô ghi 'Gà công nghiệp làm sẵn, 20 con, chợ đầu mối, giao 4h30'. Vườn nhà cô ở chợ đầu mối hả cô Mười?"],
          ["comuoi", "Suỵt! Suỵt! Nói nhỏ thôi thám tử!", "shock"],
          ["comuoi", "Thì... gà ta lên giá quá, tui lấy gà công nghiệp ba năm nay rồi. Nhưng tui luộc bằng nước dừa, chấm muối tiêu chanh tui tự làm! Ngon là được mà!", "nervous"],
          ["comuoi", "Lông trắng hết trơn, không có cọng đỏ nào. Tui không đụng Chiến Thần đâu!", "nervous"],
          ["teo", "Vụ này mà bà Tư biết là cơm gà cô Mười lên xu hướng lần hai đó sếp.", "smug"],
        ],
        gives: { words: ["thung-xop"] },
      },
    },
    "hai-khong-ghe": {
      by: "hai", text: "Đêm qua tui chạy ngang hẻm này đúng một lần, [[khong-ghe|không dừng nhà ai]] hết.",
      break: {
        clue: "camera-dem",
        lines: [
          ["me", "2h50, xe anh dừng trước cổng nhà ông Bảy ba phút. 2h53 anh phóng đi như bị ma rượt. Anh 'chạy thẳng một mạch' kiểu gì vậy?"],
          ["hai", "Tại... tại xe tui chết máy!", "nervous"],
          ["teo", "Chết máy mà lúc chạy đi nhanh vậy anh? Xe anh hồi sinh hả?", "smug"],
          ["hai", "...Thôi được. Tui có giao đơn ở đó. Mà tui không nói vì... vì tui thấy một thứ đáng sợ.", "shock"],
        ],
        gives: { flags: ["hai-khai"] },
      },
    },
    "bin-ngu-say": {
      by: "bin", text: "Con học tới 11 giờ rồi [[ngu-say|ngủ say tới sáng]], có động đất cũng không hay.",
      break: {
        clue: "don-hang-dem",
        lines: [
          ["me", "Đơn hàng giao 2h50 cho khách 'Bin 2k9 ôn thi', ghi chú 'đừng bấm chuông, nhà có ông ngủ'. Người ngủ say như chết đặt đơn lúc 2 giờ sáng hả Bin?"],
          ["bin", "Cái đó... app tự đặt! App bị lỗi!", "shock"],
          ["teo", "App mà biết ghi chú 'nhà có ông ngủ + gà' hả em?", "smug"],
          ["bin", "...Dạ, con có dậy. Con đói.", "nervous"],
        ],
        gives: { flags: ["bin-day"] },
      },
    },
    "bin-o-nha": {
      by: "bin", text: "Con ra cổng lấy đồ ăn xong là đi vô ngủ lại liền, không có ra khỏi nhà.",
      break: {
        clue: "bun-xe-dap",
        lines: [
          ["me", "Xe đạp của con dính bùn đất đỏ còn ướt. Hẻm 47 tráng bê tông hết. Chỉ hẻm 52 đang đào cống mới có đất đỏ."],
          ["me", "Mưa từ 2 giờ tới 3 giờ. Bùn còn ướt, nghĩa là xe chạy qua đó sau khi mưa. Lúc đó con ngủ lại rồi mà?"],
          ["bin", "Con... con đạp xe đi hóng gió. Học căng quá đi hóng gió thôi!", "shock"],
          ["teo", "Hóng gió lúc 3 giờ sáng, mặc áo mưa, đeo balo có lỗ thở hả em?", "smug"],
          ["bin", "...", "nervous"],
        ],
        gives: { flags: ["bin-ra-ngoai"] },
      },
    },
  },

  present: {
    ongtam: {
      "hinh-chien-than": [
        ["ongtam", "Gà gì xấu hoắc. Đuôi dài thòng, chân vàng khè. ...Mà đẹp thiệt. Tui ghét nó vì nó đẹp.", "angry"],
      ],
      "chuong-trong": [
        ["ongtam", "Chiến Thần mổ tui ba lần rồi. Tui mà thò tay vô chuồng là nó kêu inh ỏi cả xóm dậy. Không phải tui!", "angry"],
      ],
      "thung-xop-ga": [
        ["ongtam", "Ha! Gà công nghiệp! Tui biết từ lâu rồi mà không nói. Tui là người có đạo đức.", "smug"],
      ],
      "nhat-ky-mat-ngu": [
        ["ongtam", "4 giờ sáng... Tội thằng nhỏ. Nhà tui cách hai căn còn nghe nữa là.", "nervous"],
      ],
    },
    bin: {
      "hinh-chien-than": [
        ["bin", "...Nó đẹp ha chú. Hồi con lớp 6 nó còn là con gà con, con đặt tên nó đó.", "nervous"],
        ["bin", "Hồi đó nó chưa biết gáy.", "nervous"],
      ],
      "nhat-ky-mat-ngu": [
        ["bin", "Chú đọc cái đó hả? Đừng nói ông nội con nha chú. Ông thương con gà lắm.", "nervous"],
      ],
      "ban-le-dau": [
        ["bin", "Bản lề... chắc ông con tra dầu. Con... con không biết.", "nervous"],
        ["teo", "Ông em nói ba năm nay chưa tra lần nào đó Bin.", "smug"],
      ],
      "dep-lac": [
        ["bin", "Dép đó không phải của con. Con mang dép lào. ...Ủa, sao con lại khai cái đó?", "shock"],
      ],
    },
    comuoi: {
      "hinh-chien-than": [
        ["comuoi", "Con này! Con này mổ tui hồi Tết năm ngoái! Cái mỏ nó sắc như dao tui!", "shock"],
      ],
      "camera-dem": [
        ["comuoi", "Đó, 4h30 xe tải giao hàng cho tui. Mà... thám tử tua tới đoạn đó làm chi? Tua lui đi!", "nervous"],
      ],
      "do-ngu-khung-long": [
        ["comuoi", "Ờ! Đúng bộ đồ đó! Thằng nhỏ đạp xe về lúc gần 4 giờ mặc đúng bộ này!", "shock"],
      ],
    },
    hai: {
      "dep-lac": [
        ["hai", "Dép tui! Trời ơi tìm nãy giờ! Cảm ơn thám tử!", "happy"],
        ["hai", "...Mà thám tử lượm ở đâu vậy? Đừng nói trước cổng nhà ông Bảy nha.", "nervous"],
      ],
      "balo-long-ga": [
        ["hai", "CÁI BALO ĐÓ! Đúng cái balo biết kêu đó! Thám tử cầm xa xa giùm tui!", "shock"],
      ],
      "hinh-chien-than": [
        ["hai", "Gà đẹp vậy mà mất thì tiếc thiệt. Mà tui không có bán gà nha. Tui bán sticker.", "neutral"],
      ],
    },
    ongbay: {
      "nhat-ky-mat-ngu": [
        ["ongbay", "87 ngày... Thằng Bin nó nói 'tại con gà', tui tưởng nó giỡn...", "nervous"],
      ],
      "ghi-am-ga-gay": [
        ["ongbay", "Tiếng Chiến Thần! Đúng tiếng nó! Thằng Tám nó thu âm làm chi vậy trời?", "shock"],
      ],
      "thung-xop-ga": [
        ["ongbay", "Gà công nghiệp hả? Hèn chi tui ăn cơm gà cô Mười thấy mềm quá. Mà ngon thì vẫn ngon.", "neutral"],
      ],
    },
  },

  wrong: {
    ongtam: [
      [["ongtam", "Đưa tui cái này chi? Muốn kiếm chuyện hả?", "angry"]],
      [["ongtam", "Thám tử gì mà soi như gà mổ thóc. Mổ trật hết.", "smug"]],
      [["ongtam", "Không liên quan. Tui đi về coi cải lương tiếp đây.", "angry"]],
    ],
    bin: [
      [["bin", "Con... con không hiểu chú đưa cái này làm gì. Con đang buồn ngủ.", "nervous"]],
      [["bin", "Cái này giống câu trắc nghiệm có bốn đáp án mà chú chọn câu E vậy đó.", "smug"]],
      [["bin", "Chú ơi, cái này không chứng minh được gì hết. Con học logic lớp 10 rồi.", "smug"]],
    ],
    comuoi: [
      [["comuoi", "Cái gì vậy? Đưa tui coi làm chi? Tui đang bán hàng!", "angry"]],
      [["comuoi", "Thám tử ăn dĩa cơm cho tỉnh táo rồi hỏi lại nha.", "smug"]],
      [["comuoi", "Trật lất. Giống khách kêu cơm gà mà đòi thêm lạp xưởng vậy đó.", "neutral"]],
    ],
    hai: [
      [["hai", "Cái này tui không giao. Không phải đơn của tui. Hoàn đơn!", "neutral"]],
      [["hai", "Thám tử đưa sai địa chỉ rồi. Tui chạy đơn mười năm, nhìn là biết sai.", "smug"]],
      [["hai", "Đưa cái này hỏi tui thì tui chịu. Mà tui đang có đơn, tui đi nha?", "nervous"]],
    ],
    ongbay: [
      [["ongbay", "Cái này thì liên quan gì Chiến Thần của tui, thám tử?", "nervous"]],
      [["ongbay", "Tui già rồi, thám tử đưa cái gì rõ ràng chút đi.", "neutral"]],
      [["ongbay", "Coi lại đi thám tử. Chiến Thần đang chờ.", "nervous"]],
    ],
  },

  deduction: [
    {
      id: "moc-gio",
      text: "Lúc {a} ông Tám còn thu âm được tiếng Chiến Thần gáy. Người mặc áo mưa dắt xe đạp ra khỏi cổng lúc {b}, nên sáng đó không có tiếng gáy lúc {c}.",
      blanks: { a: { answer: "23h04", kind: "luc" }, b: { answer: "3h07", kind: "luc" }, c: { answer: "4h-sang", kind: "luc" } },
      explain: [
        ["me", "Chiến Thần còn trong chuồng lúc 23h04. Nó rời nhà lúc 3h07 trong một cái balo, nên 4 giờ sáng không ai nghe nó gáy."],
        ["teo", "Ông Tám có mặt sớm quá nên không phải ông Tám! Sếp, em hiểu rồi! Em hiểu rồi!", "happy"],
      ],
    },
    {
      id: "ai-noi-doi",
      text: "{a} nói dối về chuyện {b}: thùng xốp ghi rõ gà của cô là {c}.",
      blanks: {
        a: { answer: "comuoi", kind: "ai" },
        b: { answer: "ga-tha-vuon", kind: "khac" },
        c: { answer: "ga-cong-nghiep", kind: "vat" },
      },
      explain: [
        ["me", "Cô Mười nói dối, nhưng là nói dối khách hàng chuyện gà, không phải chuyện Chiến Thần. Lông trong thùng toàn màu trắng."],
        ["comuoi", "Thám tử nói nhỏ thôi mà...", "nervous"],
      ],
    },
    {
      id: "nguoi-ao-mua",
      text: "Cái {a} mà người trong camera lúc 3h07 trùm bên ngoài nằm trong đơn giao lúc 2h50 của khách {b}.",
      blanks: { a: { answer: "ao-mua", kind: "vat" }, b: { answer: "bin", kind: "ai" } },
      explain: [
        ["me", "Đơn hàng 2h50 có một cái áo mưa tiện lợi, khách là 'Bin 2k9'. Hải thấy người nhận mặc áo mưa vô tại chỗ. 17 phút sau, người áo mưa dắt xe ra."],
        ["me", "Ống quần khủng long dưới áo mưa trùng với bộ đồ ngủ dính bùn trên giường Bin."],
      ],
    },
    {
      id: "thu-pham",
      text: "{a} bỏ Chiến Thần vào {b}, đạp xe gửi lên {c}, vì không chịu nổi {d}.",
      blanks: {
        a: { answer: "bin", kind: "ai" },
        b: { answer: "balo", kind: "vat" },
        c: { answer: "san-thuong-nhat", kind: "o" },
        d: { answer: "gay-4h", kind: "vi" },
      },
      explain: [
        ["me", "Gà hiền với người nhà, chuồng không vết giãy giụa. Lúa ngâm gừng rải tới xe đạp. Bản lề tra dầu xích, chai dầu nằm trong giỏ xe Bin."],
        ["me", "Balo khoét lỗ thở có lông đỏ tía. Bùn đỏ hẻm 52. Và lá thư gửi Nhật."],
        ["teo", "Không bán, không làm thịt. Chỉ là một học sinh lớp 12 muốn ngủ tới 6 giờ sáng...", "nervous"],
      ],
    },
  ],

  finale: {
    culprit: "bin",
    intro: [
      ["narr", "Trưa. Sân nhà ông Bảy chật kín: ông Tám, cô Mười, Hải shipper, bà Tư cầm điện thoại livestream. Bin vừa đi học thêm về, đứng chết trân ở cổng."],
      ["chuba", "Tui tới rồi! Lần này tui tới sớm! Ủa, mọi người tới hết rồi hả?", "shock"],
      ["me", "Bin. Chiến Thần ở đâu?"],
      ["bin", "Con... con không biết chú nói gì.", "nervous"],
    ],
    steps: [
      {
        claim: [["bin", "Đêm qua con ngủ say tới sáng! Con đeo tai nghe chống ồn mà!", "angry"]],
        answer: "dong-ho-bao-thuc",
        right: [
          ["me", "Đồng hồ trong phòng con hẹn 2h45, tên báo thức 'CHIẾN DỊCH G' với hình con gà. Người ngủ say tới sáng không hẹn giờ dậy lúc 2h45."],
          ["batu", "Chiến dịch G! Cả nhóm Zalo đang gõ 'G là gì' kìa!", "happy"],
          ["bin", "Con... con dậy học bài thôi!", "nervous"],
        ],
        wrong: [["bin", "Cái đó đâu chứng minh con dậy đâu chú.", "smug"]],
      },
      {
        claim: [["bin", "Người mặc áo mưa trong camera trùm kín mít, ai mà biết là ai! Đâu phải con!", "angry"]],
        answer: "do-ngu-khung-long",
        right: [
          ["me", "Dưới vạt áo mưa lòi ra ống quần khủng long. Bộ đồ ngủ khủng long của con đang vắt trên giường, ống quần còn ẩm, dính bùn đỏ."],
          ["comuoi", "Đúng bộ đó! Gần 4 giờ tui thấy nó đạp xe về, lưng có gai xanh xanh!", "shock"],
          ["bin", "...", "shock"],
        ],
        wrong: [["bin", "Thấy chưa, chú không biết người áo mưa là ai mà.", "smug"]],
      },
      {
        claim: [["bin", "Thì con đạp xe đi hóng gió! Balo con đựng sách mà! Đâu có gà gì!", "angry"]],
        answer: "balo-long-ga",
        right: [
          ["me", "Balo đựng sách mà khoét ba lỗ thở, bên trong toàn lúa ngâm gừng và lông đỏ tía đuôi xanh đen?"],
          ["hai", "ĐÚNG CÁI BALO BIẾT KÊU! Tui tưởng ma! Hoá ra là gà!", "shock"],
          ["teo", "Anh Hải sợ ma mà, cả xóm biết rồi anh ơi.", "smug"],
          ["bin", "Dạ... con có chở Chiến Thần đi.", "nervous"],
        ],
        wrong: [["bin", "Cái đó thì liên quan gì cái balo của con?", "smug"]],
      },
      {
        claim: [["bin", "Nhưng con thả nó ra công viên rồi! Giờ nó đi đâu con đâu có biết! Ông đừng tìm nữa!", "shock"]],
        answer: "thu-gui-nhat",
        right: [
          ["me", "Lá thư sau tấm poster: 'Nhật ơi, gửi mày Chiến Thần mấy bữa trên sân thượng nhà mày. Thứ Bảy tao rước về kịp giải.' Con không thả. Con gửi."],
          ["me", "Con nói dối là thả, vì sợ ông nội qua nhà Nhật rước về ngay, phải không?"],
          ["bin", "...Dạ.", "nervous"],
        ],
        wrong: [["bin", "Đó, chú thấy chưa, không ai biết nó ở đâu hết.", "nervous"]],
      },
    ],
    confess: [
      ["bin", "87 ngày rồi ông ơi. Đêm nào con cũng học tới 1 giờ. 4 giờ là nó gáy, ngay dưới cửa sổ.", "nervous"],
      ["bin", "Con dán băng keo cửa sổ, con mua tai nghe chống ồn bằng tiền ăn sáng, mà nó vẫn gáy xuyên qua hết.", "nervous"],
      ["bin", "Con không dám nói với ông. Ông thương nó nhất nhà. Con sợ ông buồn.", "nervous"],
      ["bin", "Nên con gửi nó qua nhà Nhật mấy bữa, để con ôn đợt thi thử cuối. Thứ Bảy con rước về cho ông đi giải. Con không có bán, không có làm gì nó hết.", "shock"],
      ["bin", "Con xin lỗi ông. Con xin lỗi Tổ nữa.", "nervous"],
      ["ongbay", "Thằng quỷ nhỏ...", "angry"],
      ["ongbay", "Sao con không nói với ông? Ông dời chuồng ra sau bếp là xong mà con!", "shock"],
      ["bin", "...Ủa. Dời được hả ông?", "shock"],
    ],
    epilogue: [
      ["ongbay", "Bốn chục năm nuôi gà, tui quên mất là gà gáy thì người ta cũng phải ngủ.", "nervous"],
      ["ongtam", "Thôi, tui phụ ông dời chuồng. Tui còn mấy tấm xốp cách âm.", "neutral"],
      ["comuoi", "Tui góp thùng xốp! Hai thùng! Gà công nghiệp... ờ, thôi đừng nhắc.", "nervous"],
      ["hai", "Tui chở chuồng giùm, miễn phí ship. Miễn là đừng có balo nào kêu cục cục nữa.", "nervous"],
      ["narr", "Chiều đó cả xóm qua sân thượng nhà Nhật rước Chiến Thần. Nó đang đứng trên nóc chuồng bồ câu, mười hai con bồ câu ngoan ngoãn đứng xếp hàng phía dưới."],
      ["teo", "Sếp ơi, mới hai ngày mà nó thành đại ca bồ câu rồi!", "shock"],
      ["narr", "Chủ nhật, ông Bảy và ông Tám thoả thuận đổi giải đá gà thành 'Hội thi gà gáy hay'. Không gà nào bị thương. Chiến Thần thắng, Bá Vương về nhì, mổ nhau đúng một cái cho có."],
      ["narr", "Tháng sau, Bin thi thử Toán được 8 điểm. Chuồng gà giờ nằm sau bếp. Mỗi sáng 4 giờ, ông Bảy dậy pha trà một mình, nghe tiếng gáy vọng lại xa xa."],
      ["bin", "Chú thám tử, cảm ơn chú. Mà chú đừng kể chuyện đồ ngủ khủng long lên Zalo nha chú.", "nervous"],
      ["batu", "Trễ rồi con ơi. Ba ngàn lượt chia sẻ rồi.", "happy"],
    ],
    comments: [
      { by: "batu", text: "Hồ sơ vụ án: kẻ bắt cóc mặc đồ ngủ khủng long. Năm nay Hẻm 47 không thiếu drama 🦖🐓", likes: 3120 },
      { by: "Hội Phụ Huynh 12A3", text: "Ủng hộ Bin. Mùa thi ai mà không muốn bắt cóc một con gà. Mong xóm thông cảm.", likes: 1840 },
      { by: "Tám Gà Nòi", text: "Tui đã nói tui vô tội. Ai xin lỗi tui đây? Bà Tư đâu?", likes: 902 },
      { by: "batu", text: "Ông Tám đi thu âm gà nhà người ta lúc nửa đêm thì cũng đâu có vô tội hoàn toàn 🤨", likes: 1477 },
      { by: "Cơm Gà Cô Mười", text: "Từ mai cơm gà đổi bảng thành 'Cơm gà luộc nước dừa – gà công nghiệp – ngon thiệt'. Thật thà là thượng sách 😭", likes: 2204 },
      { by: "Hải Ship Siêu Tốc", text: "Tui không có sợ ma. Tui chỉ chạy nhanh để giao đơn kế tiếp. Vậy thôi.", likes: 655 },
      { by: "Nhật 12A3", text: "Hai đêm nay nhà tui 4 giờ sáng cả nhà dậy hết. Má tui hỏi 'gà ở đâu ra'. Bin mày nợ tao một chầu.", likes: 2780 },
      { by: "Shop Tai Nghe Chống Ồn Chính Hãng", text: "Tai nghe chống ồn chặn được cả tiếng gà gáy*, giảm 30% mùa thi! (*trừ gà vô địch)", likes: 133 },
      { by: "Ngôn Tình Mỗi Ngày", text: "'Có những sự rời đi không phải vì hết thương, mà vì cần một giấc ngủ.' 🌙🐓", likes: 4021 },
      { by: "Bà Năm Xôi", text: "Tóm lại cơm gà cô Mười có chiến binh không? Tui đọc nãy giờ không hiểu.", likes: 312 },
      { by: "Fan Cứng Chiến Thần", text: "Chiến Thần thu phục mười hai con bồ câu trong hai ngày. Đây mới là drama thật sự. Xin phim tài liệu.", likes: 1966 },
      { by: "Chú Ba Dân Phòng", text: "Lần này dân phòng tới sớm. Sớm hơn kết thúc vụ án có 5 phút thôi.", likes: 488 },
      { by: "Thầy Dạy Kèm Toán 12", text: "Bin ơi, 8 điểm là giỏi rồi. Muốn 9 điểm thì liên hệ thầy, số dán trên cột điện 😎", likes: 97 },
      { by: "teo", text: "Thám tử nhà mình 2 - Bí ẩn 0. Vụ sau là gì đây cả xóm? 🕵️", likes: 1203 },
    ],
  },

  hints: [
    { needs: ["broke:bin-o-nha", "clue:thu-gui-nhat"], text: "Đủ đồ rồi sếp! Mở Bảng suy luận điền đi. Rồi lúc Bin chối, nhớ: đồng hồ, đồ ngủ, balo, lá thư. Mỗi lần một món!" },
    { needs: ["broke:bin-o-nha"], text: "Bin lộ rồi. Sếp nhớ cái poster trong phòng Bin có góc phồng phồng không? Lật ra coi đi!" },
    { needs: ["stmt:bin-o-nha"], text: "Bin nói không ra khỏi nhà. Mà xe đạp của Bin dính bùn đỏ ở đâu ra? Hẻm mình tráng bê tông hết mà sếp." },
    { needs: ["clue:don-hang-dem", "stmt:bin-ngu-say"], text: "Bin nói ngủ say tới sáng. Mà đơn hàng 2h50 tên khách là ai vậy sếp? Đưa ra coi!" },
    { needs: ["broke:hai-khong-ghe"], text: "Anh Hải chịu khai rồi. Hỏi ảnh người nhận đơn lúc 2h50 là ai đi sếp." },
    { needs: ["clue:camera-dem", "stmt:hai-khong-ghe"], text: "Anh Hải nói không dừng nhà ai. Mà camera lúc 2h50 thấy xe ảnh đứng ở đâu?" },
    { needs: ["clue:camera-dem", "stmt:ongtam-o-nha"], text: "Ông Tám khai ở nhà coi cải lương. Camera lúc 23h04 thấy cái nón tai bèo ở đâu ta?" },
    { needs: ["clue:thung-xop-ga", "stmt:comuoi-tha-vuon"], text: "Cô Mười nói gà thả vườn tự nuôi. Thùng xốp sau xe ghi gì vậy sếp?" },
    { needs: ["loc:alley"], text: "Đầu hẻm có camera tiệm vàng. Bà Tư quen chủ tiệm đó, soi camera đi sếp! Rồi hỏi hết bốn người: ông Tám, cô Mười, anh Hải, Bin." },
    { text: "Soi chuồng gà, bao lúa, cổng sắt với xe đạp trước đi sếp. Ai bắt gà mà gà không kêu, cổng không kêu?" },
  ],

  bonus: [
    {
      id: "chien-dich-g", q: "Chữ 'G' trong 'Chiến dịch G' thật ra là gì?",
      choices: ["Giải tích", "Gà", "Gáy", "Gửi"],
      answer: 1, explain: "Bin nói là 'Giải tích', nhưng biểu tượng con gà trên báo thức đã nói hết. Chiến dịch G là chiến dịch Gà.",
    },
    {
      id: "ong-tam-thu-am", q: "Ông Tám lén qua nhà ông Bảy lúc 23h04 để làm gì?",
      choices: ["Bắt cóc Chiến Thần", "Thu âm tiếng gáy cho gà mình nghe quen", "Trả lại cái nón", "Rủ ông Bảy coi cải lương"],
      answer: 1, explain: "Ông rọi đèn pin cho Chiến Thần tưởng trời sáng mà gáy, rồi đem về mở cho Bá Vương nghe để đỡ run trước giải.",
    },
    {
      id: "hai-dep", q: "Vì sao anh Hải rớt một chiếc dép trước cổng nhà ông Bảy?",
      choices: ["Bị chó rượt", "Thấy balo động đậy kêu cục cục, tưởng ma nên bỏ chạy", "Cố tình để lại làm dấu", "Dép đứt quai"],
      answer: 1, explain: "Balo đựng Chiến Thần nằm dưới chân cổng, kêu 'cục... cục...'. Anh Hải rồ ga chạy, rớt dép không dám quay lại.",
    },
  ],
};
