// Vụ 1: "Nồi Thịt Kho Bốc Hơi" (vụ hướng dẫn). Hợp đồng nhân vật + cảnh: docs/tham-tu-hem/DESIGN.md §3.
// Lời giải: Linh lấy nồi lúc khoảng 23h, livestream "thịt kho mẹ nấu" trên sân thượng (23h30), ăn xong rửa nồi
// ở vòi bồn nước sân thượng (vì bồn rửa dưới bếp bị Tuấn làm nghẹt bằng nước mì sa tế) rồi úp phơi luôn trên đó.
// Gây nhiễu: Tuấn (áo dính "nước màu" = sa tế, nói dối không xuống bếp), ông Sáu (xách nồi lúc 5h = đi mua cháo lòng,
// nói dối ngủ sớm vì ngại bị biết là fan cứng tặng hoa trong live của Linh).
// Cú lật: nồi không mất, nó được rửa sạch bong và đang úp phơi trên sân thượng.

export default {
  id: "noi-thit-kho", no: 1, title: "Nồi Thịt Kho Bốc Hơi", difficulty: 1,
  tagline: "Sát Tết, nồi thịt kho trứng của cô Hai biến mất khỏi bếp chung. Cả xóm trọ ai cũng đáng nghi, kể cả cái nồi.",
  client: "cohai",

  intro: [
    ["narr", "Sáng 28 Tết. Văn phòng thám tử nằm trên lầu tiệm sửa xe, mùi nhớt hoà mùi mai vàng."],
    ["teo", "Sếp ơi sếp! Có khách! Mặt khách nhìn như vừa mất sổ đỏ!", "shock"],
    ["cohai", "Thám tử ơi, cứu tui! Nồi [[thit-kho|thịt kho trứng]] của tui... bốc hơi rồi!", "shock"],
    ["me", "Bình tĩnh cô. Thịt kho thì bốc hơi là chuyện bình thường, kho lâu nó cạn.", "neutral"],
    ["cohai", "Không phải cạn! Mất NGUYÊN CÁI NỒI! Tui kho xong lúc [[9h-toi|9 giờ tối]] qua, để trên bếp chung cho thấm. Sáng ra chỉ còn cái bếp ga trơ trọi!", "angry"],
    ["cohai", "Nồi đó tui để dành cúng ông bà ba ngày Tết. Hai chục trứng vịt, ba ký ba rọi, nước dừa xiêm...", "nervous"],
    ["teo", "Hai chục trứng... Sếp, vụ này nghiêm trọng. Đây là án ăn uống cấp quận.", "neutral"],
    ["me", "Cô ở đâu?"],
    ["cohai", "Xóm trọ ông Sáu, Hẻm 47. Bếp chung ở tầng trệt, phòng ở trên lầu, trên cùng là sân thượng.", "neutral"],
    ["teo", "Sếp! Vụ đầu năm mình nhận nè! Để em chỉ sếp quy trình nha: tới hiện trường, [[soi|soi]] mấy chỗ đáng nghi, nhặt vật chứng, hỏi chuyện từng người.", "happy"],
    ["teo", "Mấy chữ có khung như [[thit-kho]] là [[tu-khoa|từ khoá]]. Đọc tới là tự vô sổ, cuối vụ mình xài để điền bảng suy luận đó sếp.", "smug"],
    ["me", "Sao em rành vậy?"],
    ["teo", "Em coi phim trinh thám Hàn hết ba mùa rồi sếp.", "smug"],
    ["batu", "Khoan khoan! Nhóm Zalo Hẻm 47 Hóng Biến đang nổ tung vụ này nè! Thám tử coi đi!", "happy"],
  ],

  social: {
    group: "Hẻm 47 Hóng Biến",
    posts: [
      {
        by: "batu",
        text: "🚨 NÓNG: NỒI THỊT KHO CÔ HAI BỐC HƠI GIỮA ĐÊM 🚨\nTui không nói ai nha, nhưng sáng nay tui thấy thằng Tuấn sinh viên phòng 3 mặc áo DÍNH NƯỚC MÀU đỏ lè. Còn ông Sáu chủ trọ 5h sáng XÁCH NỒI đi ra đầu hẻm. Ai hiểu thì hiểu. 👀🍿",
        likes: 247,
        comments: [
          { by: "Út Bán Vé Số", text: "Thằng Tuấn nợ tiền trọ ba tháng, đói quá làm liều chứ gì" },
          { by: "Tuấn Deadline", text: "Cô Tư ơi con xin cô 😭 cái đó là sa tế!!!" },
          { by: "batu", text: "Sa tế mà đỏ như nước màu? Con nói cô nghe coi 🤨" },
          { by: "Thím Bảy Bánh Bò", text: "Ông Sáu xách nồi 5h sáng là đi mua cháo lòng, ổng mua hoài mà" },
          { by: "Linh Hồng Ăn Đêm", text: "Trời ơi tội cô Hai quá 🥺 ai làm vậy thất đức ghê" },
          { by: "Shop Mỹ Phẩm Hàng Auth Chị Na", text: "Mất nồi thì buồn, mất da đẹp còn buồn hơn. Kem trộn trắng da sau 7 ngày, inbox em 💕" },
          { by: "teo", text: "Thám tử nhà mình vào cuộc rồi nha cả xóm. Hóng!!! 🕵️" },
          { by: "Chú Ba Dân Phòng", text: "Tui tới liền. (Đang ăn sáng, ăn xong tới)" },
        ],
      },
    ],
  },

  people: {
    cohai: { name: "Cô Hai", role: "Nạn nhân, bán xôi sáng", bio: "Khoảng 50 tuổi, tạp dề, tay lúc nào cũng cầm cái vá. Nấu ăn ngon nhất xóm trọ, mắng cũng hay nhất xóm trọ." },
    tuan: { name: "Tuấn", role: "Sinh viên năm 3, phòng 3", bio: "Gầy nhom, áo thun in chữ 'Deadline là bạn'. Nợ tiền trọ ba tháng, thấy ông Sáu là đi né.", suspect: true },
    linh: { name: "Linh", role: "Streamer ăn uống, phòng 4", bio: "Tóc nhuộm hồng, kênh 'Linh Hồng Ăn Đêm' 12 nghìn người theo dõi. Hay [[livestream|livestream]] lúc nửa đêm với vòng đèn ring light.", suspect: true },
    ongsau: { name: "Ông Sáu", role: "Chủ trọ", bio: "65 tuổi, áo may ô, xâu chìa khoá kêu leng keng từ đầu hẻm. Khó tính với tiền trọ, dễ tính với mọi thứ khác.", suspect: true },
  },

  locations: {
    kitchen: {
      name: "Bếp chung", scene: "kitchen", start: true,
      intro: [
        ["narr", "Bếp chung tầng trệt. Mùi thịt kho vẫn còn lảng vảng như hồn ma của nồi thịt."],
        ["teo", "Sếp thấy mấy chỗ sáng sáng không? Bấm vào là soi. Có chỗ ra vật chứng, có chỗ ra... em nói nhảm. Soi hết cho chắc!", "happy"],
      ],
      hotspots: [
        {
          id: "bep-ga", label: "Bếp ga", rect: [380, 250, 180, 110],
          lines: [
            ["me", "Trên mặt bếp còn một [[vet-nuoc-mau|vòng nước màu]] khô, tròn đúng cỡ đáy nồi."],
            ["me", "Không có giọt nào rớt ra ngoài. Ai nhấc nồi cũng nhẹ tay, cẩn thận lắm."],
            ["teo", "Vật chứng đầu tiên vô sổ rồi sếp! Bấm Sổ tay là coi lại được. Giờ mình ra hành lang coi phòng mấy nghi phạm nha!", "happy"],
          ],
          gives: { clues: ["vet-nuoc-mau"], locs: ["hallway"] },
          again: [["teo", "Bếp này giờ chỉ còn mùi. Sếp đừng hít nữa, em đói."]],
        },
        {
          id: "tu-chen", label: "Tủ chén", rect: [80, 120, 180, 220],
          lines: [
            ["me", "Tủ chén chung. Chén dĩa của ai nấy dán tên. Có một chồng tô dán chữ 'LINH – ĐỒ QUAY HÌNH, ĐỪNG XÀI'."],
            ["teo", "Tô của chị Linh đẹp ghê, toàn tô gốm vẽ hoa. Lên hình chắc sang lắm.", "happy"],
            ["me", "Ngăn dưới có một chỗ trống, vòng bụi hình tròn. Chỗ cô Hai cất nồi thịt kho thường ngày."],
          ],
          again: [["teo", "Sếp ơi trong này có hũ [[nuoc-mau|nước màu]] của cô Hai, màu nâu cánh gián. Nhớ màu này nha sếp, hồi nữa có khi cần."]],
        },
        {
          id: "thung-rac", label: "Thùng rác", rect: [640, 380, 80, 110],
          lines: [
            ["teo", "Sếp! Soi thùng rác là nghề của thám tử! Phim nào cũng có cảnh này!", "smug"],
            ["me", "Một [[vo-mi|vỏ gói mì]] 'Tôm Chua Cay Sa Tế Cấp Độ 7'. Gói xé vội, còn dính dầu [[sa-te|sa tế]] đỏ cam."],
            ["teo", "Cấp độ 7! Ai ăn nổi cái này là người có nội công thâm hậu.", "shock"],
          ],
          gives: { clues: ["vo-mi-sa-te"] },
          again: [["me", "Ngoài vỏ mì ra chỉ có vỏ trứng... của hôm kia. Tèo, đừng lục nữa."]],
        },
        {
          id: "cua-so", label: "Cửa sổ", rect: [560, 70, 200, 150],
          lines: [
            ["me", "Cửa sổ nhìn ra giếng trời. Thấy được cầu thang sắt dẫn lên [[san-thuong|sân thượng]]."],
            ["me", "Mấy bậc thang có vệt dấu dép đã khô, đi một chiều lên rồi xuống."],
            ["teo", "Có khi nào là dấu chân của... ăn trộm có cánh không sếp?", "shock"],
            ["me", "Ăn trộm có cánh thì cần gì cầu thang, Tèo."],
          ],
          again: [["teo", "Gió từ giếng trời thổi vô, nghe mùi bông mai. Tết tới nơi rồi mà mình đi tìm nồi thịt kho..."]],
        },
        {
          id: "lich-treo", label: "Lịch treo tường", rect: [300, 80, 80, 110],
          lines: [
            ["me", "Lịch bloc tờ hôm nay: 28 Tết. Có tờ giấy note của cô Hai dán đè lên:"],
            ["narr", "'Thịt kho xong [[9h-toi|9h tối]]. ĐỂ NGUYÊN TRÊN BẾP CHO THẤM. ĐỨA NÀO ĐỤNG LÀ BIẾT TAY. — Hai'"],
            ["teo", "Ghi rõ vậy mà còn dám đụng. Kẻ trộm này gan cùng mình luôn sếp.", "shock"],
            ["me", "Hoặc kẻ trộm không đọc được tờ giấy vì... bếp tắt đèn."],
          ],
          again: [["teo", "Sếp coi nè, tờ lịch còn câu danh ngôn: 'Ăn quả nhớ kẻ trồng cây'. Ăn thịt kho chắc phải nhớ cô Hai."]],
        },
        {
          id: "bon-rua", label: "Bồn rửa", rect: [700, 230, 200, 120],
          lines: [
            ["me", "Bồn rửa nghẹt cứng. Nước đọng màu đỏ cam, nổi váng dầu và mấy cọng mì."],
            ["me", "Ngâm trong đó là một [[noi-mi|nồi nhôm mini]], quai dán băng keo ghi 'TUẤN – CẤM XÀI'."],
            ["teo", "Ủa, nồi của anh Tuấn. Ảnh nói sao với mình ta? Sếp hỏi ảnh thử coi!", "smug"],
          ],
          gives: { clues: ["noi-mi-tuan"] },
          again: [["teo", "Nghẹt vầy thì đêm qua ai muốn rửa gì ở đây cũng chịu chết, sếp ha."]],
        },
        {
          id: "meo-mun", label: "Con mèo mướp", rect: [200, 430, 90, 70],
          lines: [
            ["teo", "SẾP! THỦ PHẠM ĐÂY RỒI! Mèo ăn vụng! Bắt nó!", "shock"],
            ["me", "Con mèo nặng ba ký. Nồi thịt kho nặng năm ký."],
            ["teo", "...Nó có đồng bọn thì sao?", "nervous"],
            ["narr", "Con mèo ngáp một cái, quay đít bỏ đi."],
          ],
          again: [["teo", "Nó nhìn em khinh bỉ quá sếp. Em rút lại cáo buộc."]],
        },
      ],
    },

    hallway: {
      name: "Hành lang phòng trọ", scene: "hallway",
      intro: [
        ["narr", "Hành lang lầu một. Bốn cửa phòng sơn xanh, đèn tuýp chớp chớp như phim kinh dị kinh phí thấp."],
        ["teo", "Sếp, ở đây có phòng anh Tuấn với phòng chị Linh. Soi kỹ nha, rồi qua mục Thẩm vấn hỏi từng người.", "neutral"],
      ],
      hotspots: [
        {
          id: "cua-phong-tuan", label: "Cửa phòng Tuấn", rect: [100, 100, 160, 330],
          lines: [
            ["me", "Cửa phòng 3. Treo trên móc là cái [[ao-thun|áo thun]] 'Deadline là bạn', ngực áo có vệt đỏ."],
            ["me", "Vệt màu đỏ cam, lấm tấm hột ớt, còn thơm mùi tỏi phi."],
            ["teo", "Nước màu thịt kho đó sếp! Bà Tư nói đúng rồi! Bắt ảnh!", "shock"],
            ["me", "Tèo, nước màu thịt kho có hột ớt không?"],
            ["teo", "...Em không có biết nấu ăn sếp.", "nervous"],
          ],
          gives: { clues: ["ao-tuan"] },
          again: [["narr", "Sau cửa vọng ra tiếng: 'Không có ai ở nhà! Chủ trọ đừng gõ!'"]],
        },
        {
          id: "cua-phong-linh", label: "Cửa phòng Linh", rect: [520, 100, 160, 330],
          lines: [
            ["me", "Cửa phòng 4 dán đầy sticker hồng. Một tấm bảng nhỏ: 'ĐANG LIVE, GÕ CỬA LÀ LÊN SÓNG'."],
            ["teo", "Chị Linh đó sếp! Linh Hồng Ăn Đêm! Em follow chỉ từ hồi chỉ có 300 người xem!", "happy"],
            ["me", "Cửa không có mùi gì lạ. Sạch quá, còn thơm mùi nước rửa chén hương chanh."],
          ],
          again: [["teo", "Em xin chữ ký chỉ được không sếp? Không? Dạ."]],
        },
        {
          id: "dep-truoc-cua", label: "Dép trước cửa", rect: [560, 440, 110, 60],
          lines: [
            ["me", "Trước phòng Linh có đôi [[dep-long|dép lông hồng]]. Ướt nhẹp, đế dính bọt xà phòng khô và vệt nâu lợt."],
            ["me", "Dấu dép ướt đã khô thành vệt, nối từ cửa phòng ra phía cầu thang lên sân thượng."],
            ["teo", "Dép lông mà lội nước... chị Linh đi đâu giữa đêm vậy ta?", "neutral"],
          ],
          gives: { clues: ["dep-long-hong"] },
          again: [["teo", "Dép lông giặt máy là xẹp lông đó sếp. Em biết vì em từng làm vậy rồi."]],
        },
        {
          id: "bang-tin", label: "Bảng tin xóm trọ", rect: [320, 120, 140, 120],
          lines: [
            ["me", "Bảng tin dán đủ thứ. Tờ to nhất của ông Sáu: 'PHÒNG 3 ĐÓNG TIỀN TRỌ!!! (3 tháng rồi đó Tuấn)'."],
            ["me", "Kế bên là tờ poster in màu: 'LỊCH LIVE LINH HỒNG ĂN ĐÊM — Tối 27 Tết, [[23h30]]: ĂN ĐÊM MÓN MẸ NẤU 🥺 Mục tiêu 10K mắt xem!'"],
            ["teo", "Mục tiêu 10 nghìn người xem! Chị Linh muốn [[cau-view|câu view]] dịp Tết dữ lắm nha.", "happy"],
          ],
          gives: { clues: ["lich-live"] },
          again: [["me", "Góc bảng còn tờ 'Mất chìa khoá xe, ai lượm được xin trả, có hậu tạ một bịch xoài'. Không liên quan. Nhưng xoài ngon."]],
        },
        {
          id: "dong-ho", label: "Đồng hồ treo tường", rect: [330, 30, 70, 70],
          lines: [
            ["me", "Đồng hồ chỉ 3 giờ 15."],
            ["teo", "Sếp ơi bây giờ 8 giờ sáng mà.", "neutral"],
            ["me", "Nó hết pin. Lớp bụi trên mặt kính nói nó đứng từ... Tết năm ngoái."],
            ["teo", "Vậy đồng hồ này là nhân chứng duy nhất không bao giờ nói dối. Vì nó không nói gì hết.", "smug"],
          ],
          again: [["teo", "Ông Sáu nói để vậy cho 'thời gian ngừng trôi, khỏi già'. Ổng triết lý ghê."]],
        },
        {
          id: "cau-thang", label: "Cầu thang lên sân thượng", rect: [790, 80, 160, 400],
          lines: [
            ["me", "Cầu thang sắt lên sân thượng. Không có khoá, chỉ có cái chốt gài."],
            ["teo", "Đi lên coi sếp! Biết đâu nồi thịt kho lên trời làm tiên rồi!", "happy"],
          ],
          gives: { locs: ["rooftop"] },
          again: [["teo", "Bậc thứ bảy kêu cót két. Đêm khuya ai đi lên là cả xóm nghe... nếu cả xóm chưa ngủ."]],
        },
      ],
    },

    rooftop: {
      name: "Sân thượng", scene: "rooftop",
      intro: [
        ["narr", "Sân thượng nhìn ra cả hẻm. Dây phơi đồ, bồn nước inox, mấy chậu kiểng. Gió sớm thổi mát rượi."],
        ["teo", "View đẹp ghê sếp! Chỗ này mà livestream là đẹp số một xóm.", "happy"],
      ],
      hotspots: [
        {
          id: "day-phoi", label: "Dây phơi đồ", rect: [80, 60, 500, 160],
          lines: [
            ["me", "Dây phơi có đồ của cả xóm. Áo may ô của ông Sáu, tạp dề cô Hai, áo khoác hồng có chữ 'Linh Hồng'."],
            ["teo", "Có mấy cái quần đùi in hình con vịt. Em không nói của ai đâu.", "smug"],
          ],
          again: [["teo", "Cái quần đùi con vịt là của anh Tuấn đó sếp. Em nói rồi đó. Em không giữ được bí mật."]],
        },
        {
          id: "noi-up", label: "Cái nồi úp", rect: [420, 330, 110, 80],
          lines: [
            ["me", "Một cái nồi nhôm đang úp phơi trên bậc xi măng."],
            ["me", "Sạch bong, sáng loáng. Nắp móp một góc. Quai trái buộc [[day-thun-do|sợi dây thun đỏ]]."],
            ["teo", "Ủa... ỦA? Đây là nồi của cô Hai mà! Nồi không có mất! Nồi còn được RỬA SẠCH!", "shock"],
            ["me", "Kẻ trộm ăn hết thịt kho, rồi rửa nồi, rồi đem phơi. Tèo, em từng nghe vụ trộm nào lịch sự vậy chưa?"],
            ["teo", "Chưa sếp. Kẻ trộm này có giáo dục ghê.", "shock"],
          ],
          gives: { clues: ["noi-sach"] },
          again: [["teo", "Sạch tới nỗi soi thấy mặt em trong đó. Đẹp trai quá sếp."]],
        },
        {
          id: "chau-cay", label: "Chậu cây", rect: [80, 330, 120, 170],
          lines: [
            ["me", "Ba chậu kiểng xanh mướt. Đất khô nứt."],
            ["me", "Lá cây... bằng nhựa. Dưới chậu còn dán tem giá '35k/chậu'. Đây là [[cay-nhua|cây nhựa]]."],
            ["teo", "Cây nhựa thì khỏi tưới. Ông Sáu lười mà khôn ghê!", "happy"],
          ],
          gives: { clues: ["cay-nhua"] },
          again: [["teo", "Em tưới thử một xíu coi nó có lớn không. ...Không lớn sếp."]],
        },
        {
          id: "ring-light", label: "Đèn ring light", rect: [620, 200, 120, 260],
          lines: [
            ["me", "Một vòng đèn ring light để quên, kẹp sẵn giá điện thoại, hướng ra phía bồn nước."],
            ["teo", "Đèn của chị Linh nè sếp! Khoan, để em mở kênh chỉ coi lại live tối qua... Có rồi! Chỉ lưu bản phát lại!", "happy"],
            ["narr", "Tèo chìa điện thoại. Tiêu đề: 'THỊT KHO MẸ NẤU 🥺 ĂN ĐÊM CÙNG LINH'. Bắt đầu lúc 23h30."],
            ["me", "Phía sau lưng Linh là cái bồn nước này, và dây phơi đồ này. Cô ta live trên sân thượng, không phải trong phòng."],
            ["me", "Cận cảnh cái nồi trên bàn: quai trái buộc [[day-thun-do|dây thun đỏ]]."],
            ["teo", "Sếp coi khung bình luận! Lúc [[23h52]] có tài khoản 'Sáu Chìa Khoá' tặng 10 bông hồng, ghi 'con nấu giống bà Hai ghê'.", "shock"],
          ],
          gives: { clues: ["clip-live"] },
          again: [["teo", "Trong clip chị Linh vừa ăn vừa khóc. Bình luận toàn 'thương quá', 'nhớ mẹ quá'. Em cũng muốn khóc theo sếp."]],
        },
        {
          id: "bon-nuoc", label: "Bồn nước", rect: [760, 60, 180, 300],
          lines: [
            ["me", "Bồn nước inox có dán sticker 'Hẻm 47 – Đừng leo'. Dưới chân có cái vòi xả."],
            ["me", "Ngay dưới vòi là vũng nước chưa khô, ánh nâu lợt, có cọng [[hanh-la|hành lá]] và mấy vụn bọt rửa chén."],
            ["teo", "Có người rửa đồ ở đây! Mà bồn rửa dưới bếp nghẹt, nên phải lên tận đây rửa đó sếp!", "shock"],
          ],
          gives: { clues: ["vet-nuoc-bon"] },
          again: [["teo", "Sticker 'Đừng leo' mà ai đó vẽ thêm mặt cười. Chắc là em hồi tháng trước. Sếp đừng nói ông Sáu."]],
        },
        {
          id: "ang-ten", label: "Ăng-ten cũ", rect: [600, 20, 80, 120],
          lines: [
            ["teo", "Ăng-ten tivi đời ông cố! Sếp, em leo lên bắt sóng 4G mạnh hơn nha!", "happy"],
            ["me", "Xuống."],
          ],
          again: [["teo", "Từ đây nhìn thấy tận nhà bà Tư. Bà Tư cũng đang nhìn mình. Bả cầm điện thoại quay kìa sếp."]],
        },
      ],
    },
  },

  clues: {
    "vet-nuoc-mau": { name: "Vòng nước màu trên bếp", desc: "Vòng nước màu khô tròn cỡ đáy nồi. Không giọt nào rớt ra ngoài: người lấy nồi nhấc nhẹ tay, không vội vàng." },
    "vo-mi-sa-te": { name: "Vỏ gói mì sa tế", desc: "Vỏ mì 'Tôm Chua Cay Sa Tế Cấp Độ 7' trong thùng rác bếp chung, dính dầu [[sa-te|sa tế]] đỏ cam, lấm tấm hột ớt." },
    "noi-mi-tuan": { name: "Nồi mì của Tuấn", desc: "Nồi nhôm mini 'TUẤN – CẤM XÀI' ngâm trong bồn rửa nghẹt, đáy còn cặn [[sa-te|sa tế]]. Ai đó đã xuống bếp nấu mì tối qua và làm nghẹt luôn bồn rửa." },
    "ao-tuan": { name: "Áo thun của Tuấn", desc: "Áo 'Deadline là bạn' có vệt đỏ cam lấm tấm hột ớt, thơm mùi tỏi phi. Nước màu thịt kho thì nâu cánh gián và không có hột ớt." },
    "lich-live": { name: "Poster lịch live", desc: "Poster trên bảng tin: 'Tối 27 Tết, [[23h30]]: ĂN ĐÊM MÓN MẸ NẤU 🥺 Mục tiêu 10K mắt xem!' của kênh Linh Hồng Ăn Đêm. Đặt mục tiêu [[cau-view|câu view]] Tết." },
    "clip-live": {
      name: "Bản phát lại livestream", desc: "Live 'THỊT KHO MẸ NẤU 🥺' của [[linh|Linh]], bắt đầu [[23h30]]. Phông nền là bồn nước và dây phơi trên [[san-thuong|sân thượng]]. Nồi trên bàn có quai buộc [[day-thun-do|dây thun đỏ]]. Lúc [[23h52]] tài khoản 'Sáu Chìa Khoá' tặng 10 bông hồng.",
      detail: [
        ["linh", "(trong clip) Hôm nay Linh ăn món mẹ nấu nè cả nhà... Ủa sao Linh khóc vậy ta... Tại cay thôi, tại cay...", "nervous"],
        ["teo", "Thịt kho đâu có cay đâu sếp...", "nervous"],
      ],
    },
    "noi-sach": { name: "Nồi úp trên sân thượng", desc: "Nồi nhôm sạch bong úp phơi trên sân thượng: nắp móp một góc, quai trái buộc [[day-thun-do|dây thun đỏ]]. Chính là nồi của [[cohai|cô Hai]]." },
    "cay-nhua": { name: "Chậu cây nhựa", desc: "Mấy chậu kiểng trên sân thượng là [[cay-nhua|cây nhựa]] 35k, đất khô nứt. Không ai cần (và không ai) tưới." },
    "vet-nuoc-bon": { name: "Vũng nước dưới bồn nước", desc: "Dưới vòi bồn nước sân thượng: vũng nước ánh nâu, cọng [[hanh-la|hành lá]], bọt rửa chén. Có người đã rửa một cái nồi thịt kho ở đây." },
    "dep-long-hong": { name: "Dép lông hồng ướt", desc: "Dép lông hồng trước phòng Linh ướt nhẹp, dính bọt xà phòng và vệt nâu lợt. Dấu dép nối từ cầu thang [[san-thuong|sân thượng]] về phòng 4." },
    "hinh-noi": { name: "Hình nồi thịt kho cô Hai khoe", desc: "Hình cô Hai đăng Zalo lúc 9h tối: nồi nhôm đầy [[thit-kho|thịt kho trứng]], nắp móp một góc, quai trái lỏng nên buộc [[day-thun-do|sợi dây thun đỏ]]." },
    "hoa-don-chao": { name: "Phiếu tính tiền quán cháo", desc: "Phiếu quán cháo Dì Chín lúc [[5h-sang|5h12 sáng]]: '[[chao-long|Cháo lòng]] x2, khách mang nồi'. Cái nồi ông Sáu xách là nồi đựng cháo." },
  },

  words: {
    // ai
    tuan: { text: "Tuấn", kind: "ai" },
    linh: { text: "Linh", kind: "ai" },
    ongsau: { text: "ông Sáu", kind: "ai" },
    cohai: { text: "cô Hai", kind: "ai" },
    // lúc
    "9h-toi": { text: "9h tối", kind: "luc" },
    "22h30": { text: "22h30", kind: "luc" },
    "23h30": { text: "23h30", kind: "luc" },
    "23h52": { text: "23h52", kind: "luc" },
    "5h-sang": { text: "5h sáng", kind: "luc" },
    // ở
    "bep-chung": { text: "bếp chung", kind: "o" },
    "san-thuong": { text: "sân thượng", kind: "o" },
    "phong-linh": { text: "phòng của Linh", kind: "o" },
    "dau-hem": { text: "đầu hẻm", kind: "o" },
    // vật
    "thit-kho": { text: "thịt kho trứng", kind: "vat" },
    "sa-te": { text: "sa tế", kind: "vat" },
    "nuoc-mau": { text: "nước màu", kind: "vat" },
    "day-thun-do": { text: "dây thun đỏ", kind: "vat" },
    "hanh-la": { text: "hành lá", kind: "vat" },
    "chao-long": { text: "cháo lòng", kind: "vat" },
    "vet-nuoc-mau": { text: "vòng nước màu", kind: "vat" },
    "vo-mi": { text: "vỏ gói mì", kind: "vat" },
    "noi-mi": { text: "nồi nhôm mini", kind: "vat" },
    "ao-thun": { text: "áo thun", kind: "vat" },
    "dep-long": { text: "dép lông hồng", kind: "vat" },
    "cay-nhua": { text: "cây nhựa", kind: "vat" },
    // cách
    livestream: { text: "livestream", kind: "khac" },
    "quay-live": { text: "quay live ăn đêm", kind: "cach" },
    "an-vung": { text: "ăn vụng trong phòng", kind: "cach" },
    "dem-ban": { text: "đem bán", kind: "cach" },
    "nau-mi": { text: "nấu mì", kind: "cach" },
    // vì
    "cau-view": { text: "câu view", kind: "vi" },
    "doi-bung": { text: "đói bụng", kind: "vi" },
    "tra-thu": { text: "trả thù vụ tiền trọ", kind: "vi" },
    // khác
    "ngu-som": { text: "ngủ sớm", kind: "khac" },
    "khong-xuong-bep": { text: "không xuống bếp", kind: "khac" },
    "o-trong-phong": { text: "live trong phòng", kind: "khac" },
    "tuoi-cay": { text: "tưới cây", kind: "khac" },
    "noi-rieng": { text: "nồi riêng mẹ gửi", kind: "khac" },
    soi: { text: "soi", kind: "khac" },
    "tu-khoa": { text: "từ khoá", kind: "khac" },
  },

  talks: {
    cohai: [
      {
        id: "toi-qua", topic: "Kể lại tối qua đi cô",
        lines: [
          ["cohai", "Tui kho tới [[9h-toi|9 giờ tối]] thì tắt bếp, đậy nắp, để nguyên trên [[bep-chung|bếp chung]] cho thấm. Sáng 5 giờ rưỡi xuống thì mất.", "nervous"],
          ["cohai", "Tui ngủ say lắm, đêm qua không nghe gì hết. Chỉ nhớ có tiếng ai cười rần rần trên cao, tưởng nhà bên coi hài.", "neutral"],
          ["teo", "Sếp thấy chưa? Hỏi xong là chữ quan trọng tự vô sổ. Mấy chủ đề khác sẽ mở thêm khi mình có vật chứng mới.", "happy"],
        ],
        gives: { locs: ["hallway"] },
      },
      {
        id: "cai-noi", topic: "Cái nồi trông ra sao?",
        lines: [
          ["cohai", "Nồi nhôm, xài hai chục năm rồi. Nắp móp một góc vì hồi xưa thằng chồng tui làm rớt.", "neutral"],
          ["cohai", "Quai bên trái lỏng nên tui buộc [[day-thun-do|sợi dây thun đỏ]]. Cả xóm ai cũng biết nồi đó của tui.", "neutral"],
          ["cohai", "Nè, hình tui chụp khoe Zalo tối qua nè. Thám tử giữ đi.", "nervous"],
          ["teo", "Vật chứng từ lời kể cũng vô sổ luôn sếp! Nhớ cái dây thun đỏ nha, nhìn là nhận ra liền.", "happy"],
        ],
        gives: { clues: ["hinh-noi"] },
      },
      {
        id: "nghi-ai", topic: "Cô nghi ai không?",
        lines: [
          ["cohai", "Thằng [[tuan|Tuấn]] nợ tiền trọ, đói hoài, sáng nay áo nó dính đỏ lè. Ông [[ongsau|Sáu]] thì 5 giờ sáng xách nồi đi đâu không biết.", "angry"],
          ["teo", "Hay anh Tuấn [[an-vung|ăn vụng trong phòng]]? Hay có ai [[dem-ban|đem bán]] ve chai cái nồi?", "smug"],
          ["cohai", "Con [[linh|Linh]] thì... nó ngoan, hay phụ tui lặt rau. Tết này nó không về quê được, tội nó.", "neutral"],
          ["teo", "Sếp, nghe khách nghi ai thì ghi nhận thôi, đừng tin liền. Mình xài vật chứng mà nói chuyện!", "smug"],
        ],
      },
      {
        id: "tim-thay-noi", topic: "Nồi của cô tìm thấy rồi", needs: "clue:noi-sach",
        lines: [
          ["cohai", "Trời đất! Nồi tui đây mà! Ai rửa còn sạch hơn tui rửa nữa...", "shock"],
          ["cohai", "Mà thịt kho đâu? Hai chục trứng vịt của tui đâu?!", "angry"],
          ["me", "Đó là câu hỏi đáng giá nhất sáng nay, cô Hai."],
        ],
      },
      {
        id: "xem-clip", topic: "Cô coi đoạn live này", needs: "clue:clip-live",
        lines: [
          ["cohai", "Cái nồi trên bàn con Linh... quai buộc dây thun đỏ... nắp móp...", "shock"],
          ["cohai", "Mà nó vừa ăn vừa khóc kìa. Con nhỏ này...", "nervous"],
        ],
      },
    ],

    tuan: [
      {
        id: "toi-qua", topic: "Tối qua em ở đâu?",
        lines: [
          ["tuan", "Em ở lì trong phòng chạy deadline anh ơi. Em [[khong-xuong-bep|không xuống bếp]] một bước nào hết.", "nervous"],
          ["tuan", "Em mà ra khỏi phòng là gặp ông Sáu đòi tiền trọ. Em sống kiểu ẩn dật.", "nervous"],
          ["teo", "Sếp! Lời khai vô sổ rồi! Thấy chỗ nào cấn với vật chứng thì mở Sổ tay, chọn lời khai, bấm 'Vạch mâu thuẫn' rồi đưa món đồ ra.", "happy"],
          ["teo", "Đưa trật là mất một kính lúp uy tín đó sếp. Cân nhắc nha!", "nervous"],
        ],
        gives: { stmts: ["tuan-khong-xuong-bep"] },
      },
      {
        id: "vet-do", topic: "Vết đỏ trên áo em là gì?",
        lines: [
          ["tuan", "Dạ... là... mực! Mực bút đỏ chấm bài! Em làm trợ giảng!", "nervous"],
          ["me", "Mực bút đỏ có hột ớt hả?"],
          ["tuan", "...Mực cao cấp anh.", "nervous"],
        ],
      },
      {
        id: "tien-tro", topic: "Nghe nói em nợ tiền trọ?",
        lines: [
          ["tuan", "Ba tháng thôi anh! Em đang chờ tiền làm thêm. Mà em nghèo chứ em không có ăn trộm nha!", "angry"],
          ["teo", "Sếp, hay ảnh [[tra-thu|trả thù vụ tiền trọ]]? Bị đòi tiền nên ăn nồi thịt kho cho bõ tức!", "smug"],
          ["me", "Người đòi tiền là ông Sáu, nồi là của cô Hai. Trả thù trật địa chỉ rồi, Tèo."],
          ["tuan", "Em [[doi-bung|đói bụng]] thiệt, nhưng ăn nồi thịt kho của cô Hai hả? Cô Hai mà biết thì em khỏi sống tới mùng 1.", "shock"],
        ],
      },
      {
        id: "luc-do-thay-gi", topic: "Lúc xuống bếp em thấy gì?", needs: "broke:tuan-khong-xuong-bep",
        lines: [
          ["tuan", "Lúc em xuống nấu mì là [[22h30]]. Nồi thịt kho còn nguyên trên bếp, em còn hít một hơi cho đỡ thèm.", "nervous"],
          ["tuan", "Em đổ nước mì vô bồn rửa thì nó nghẹt luôn. Em tính sáng thông, ai dè sáng nay cả xóm đồn em ăn thịt kho.", "nervous"],
          ["tuan", "À, gần 12 giờ em nghe tiếng dép loẹt quẹt lên cầu thang sân thượng, rồi có mùi thịt kho bay theo. Em tưởng em đói quá nên ảo giác.", "neutral"],
          ["teo", "Sếp, có mốc giờ rồi đó! Mấy chữ giờ giấc, chỗ chốn, đồ vật mình nhặt được là để điền Bảng suy luận. Bấm 'Chốt' thì nó chỉ nói sai mấy chỗ, không nói chỗ nào, nên điền cho chắc nha.", "happy"],
        ],
        gives: { stmts: ["tuan-thay-noi"] },
      },
    ],

    linh: [
      {
        id: "toi-qua", topic: "Tối qua em làm gì?",
        lines: [
          ["linh", "Em [[o-trong-phong|live trong phòng]] tới khuya anh ơi. Em live món mì trộn thôi, đơn giản lắm.", "happy"],
          ["linh", "Cả đêm em không bước ra khỏi phòng luôn. Live xong em ngủ liền.", "neutral"],
        ],
        gives: { stmts: ["linh-o-phong"] },
      },
      {
        id: "thit-kho", topic: "Em biết gì về nồi thịt kho?",
        lines: [
          ["linh", "Thịt kho hả anh? Tội cô Hai ghê. Ai làm vậy thất đức thiệt.", "nervous"],
          ["linh", "Em không biết gì đâu. Em... em đang ăn kiêng mà, hihi.", "nervous"],
          ["teo", "Chị Linh ăn kiêng mà kênh tên là 'Ăn Đêm' hả sếp?", "neutral"],
        ],
      },
      {
        id: "kenh", topic: "Kênh của em dạo này sao?",
        lines: [
          ["linh", "Dạo này view xuống anh. Ai cũng về quê ăn Tết, ai còn coi live đâu.", "nervous"],
          ["linh", "Em phải nghĩ nội dung gì 'chạm' tới người xem. Mà thôi, chuyện nghề, anh không hiểu đâu.", "smug"],
          ["teo", "Em hiểu chị! Em là fan cứng của chị!", "happy"],
          ["linh", "Cảm ơn em... (nhìn đi chỗ khác)", "nervous"],
        ],
      },
      {
        id: "ring-light", topic: "Sao đèn ring light của em ở sân thượng?", needs: "seen:rooftop.ring-light",
        lines: [
          ["linh", "À... chiều qua em lên sân thượng quay outfit Tết. Em để quên thôi.", "nervous"],
          ["me", "Quay outfit mà kẹp sẵn giá điện thoại chĩa về phía bồn nước?"],
          ["linh", "Bồn nước... ăn ảnh mà anh.", "nervous"],
        ],
      },
      {
        id: "mon-live", topic: "Món ăn trong live tối qua", needs: "broke:linh-o-phong",
        lines: [
          ["linh", "Thì... đúng là em live thịt kho. Nhưng đó là [[noi-rieng|nồi riêng mẹ em gửi]] lên từ quê!", "angry"],
          ["linh", "Cái nồi đó em cất trong phòng em nè. Không tin anh hỏi mẹ em!", "angry"],
        ],
        gives: { stmts: ["linh-noi-rieng"] },
      },
      {
        id: "dep-uot", topic: "Sao dép em ướt nhẹp vậy?", needs: "seen:hallway.dep-truoc-cua",
        lines: [
          ["linh", "Dép hả? À, sáng sớm em lên sân thượng [[tuoi-cay|tưới cây]] cho ông Sáu. Em siêng lắm.", "smug"],
          ["linh", "Tưới cây là phải ướt chứ anh. Có gì đâu.", "neutral"],
        ],
        gives: { stmts: ["linh-tuoi-cay"] },
      },
    ],

    ongsau: [
      {
        id: "toi-qua", topic: "Tối qua ông làm gì?",
        lines: [
          ["ongsau", "Tui già rồi, [[ngu-som|ngủ sớm]] từ 9 giờ. Có động đất tui cũng không hay.", "neutral"],
          ["ongsau", "Tui đâu có như tụi nhỏ, nửa đêm còn bấm điện thoại.", "smug"],
        ],
        gives: { stmts: ["ongsau-ngu-som"] },
      },
      {
        id: "xach-noi", topic: "Sáng nay ông xách nồi đi đâu?",
        lines: [
          ["ongsau", "Bà Tư lại đăng Zalo phải không? Cái bà đó!", "angry"],
          ["ongsau", "Tui xách nồi ra [[dau-hem|đầu hẻm]] mua [[chao-long|cháo lòng]] Dì Chín lúc [[5h-sang|5 giờ sáng]], ngày nào chả vậy. Nè, phiếu tính tiền còn trong túi nè!", "angry"],
          ["teo", "Có phiếu tính tiền luôn! Ông Sáu sạch nghi vụ cái nồi rồi sếp.", "neutral"],
        ],
        gives: { clues: ["hoa-don-chao"] },
      },
      {
        id: "san-thuong", topic: "Sân thượng có khoá không ông?",
        lines: [
          ["ongsau", "Không khoá. Gài chốt thôi. Ai cũng lên phơi đồ được.", "neutral"],
          ["ongsau", "Mấy chậu kiểng trên đó là cây nhựa, tui mua ngoài chợ. Khỏi tưới, khỏi chết, khỏi tốn nước.", "smug"],
          ["teo", "Ông Sáu khôn thiệt. Tiết kiệm từ cái cây.", "happy"],
        ],
        gives: { locs: ["rooftop"] },
      },
      {
        id: "tien-tro-tuan", topic: "Ông nghĩ sao về Tuấn?",
        lines: [
          ["ongsau", "Thằng đó nợ tiền trọ chứ không có xấu. Tháng trước nó còn sửa wifi miễn phí cho cả xóm.", "neutral"],
          ["ongsau", "Mà tiền trọ thì vẫn phải đóng nha. Thám tử gặp nó thì nhắc giùm tui.", "angry"],
        ],
      },
      {
        id: "trong-live", topic: "Trong live ông thấy gì?", needs: "broke:ongsau-ngu-som",
        lines: [
          ["ongsau", "Con Linh nó live... bưng cái nồi quai buộc dây thun đỏ. Tui thấy quen quen mà tưởng nồi nào cũng vậy.", "nervous"],
          ["ongsau", "Nó vừa ăn vừa khóc, nói năm nay không về quê được, nhớ mẹ. Tui thương quá nên tặng hoa. Mười bông, năm chục ngàn đó!", "nervous"],
          ["ongsau", "Thám tử đừng nói tụi trong xóm nha. Tui là chủ trọ, phải giữ hình tượng khó tính.", "nervous"],
        ],
      },
    ],
  },

  stmts: {
    "tuan-khong-xuong-bep": {
      by: "tuan", text: "Tối qua em ở lì trong phòng, [[khong-xuong-bep|không xuống bếp]] một bước nào hết.",
      break: {
        clue: "noi-mi-tuan",
        lines: [
          ["me", "Nồi nhôm mini ghi 'TUẤN – CẤM XÀI', ngâm trong bồn rửa với cặn sa tế. Nồi tự đi xuống bếp hả?"],
          ["tuan", "...Dạ. Em có xuống. Em nấu gói mì sa tế cấp độ 7.", "shock"],
          ["tuan", "Em giấu vì em ngại! Hai mươi mấy tuổi mà Tết ăn mì gói, em sợ bà Tư đăng Zalo!", "nervous"],
          ["tuan", "Vết trên áo em cũng là sa tế văng ra đó anh. Không phải nước màu!", "nervous"],
          ["teo", "Bể rồi sếp! Thấy chưa, lời khai cấn vật chứng là bể liền. Giờ hỏi ảnh lúc xuống bếp thấy gì đi!", "happy"],
        ],
        gives: { words: ["nau-mi"] },
      },
    },
    "tuan-thay-noi": {
      by: "tuan", text: "Lúc [[22h30]] em xuống nấu mì, nồi thịt kho vẫn còn nguyên trên bếp. Gần 12 giờ em nghe tiếng dép lên cầu thang [[san-thuong|sân thượng]], có mùi thịt kho bay theo.",
    },
    "linh-o-phong": {
      by: "linh", text: "Tối qua em [[o-trong-phong|live trong phòng]] món mì trộn, cả đêm không bước ra ngoài.",
      break: {
        clue: "clip-live",
        lines: [
          ["me", "Phông nền live của em là bồn nước inox và dây phơi đồ. Phòng em có bồn nước hả, Linh?"],
          ["linh", "Đó là... phông xanh! Em ghép hình!", "shock"],
          ["teo", "Phông xanh mà gió thổi tóc chị bay phần phật? Còn có tiếng chó nhà bà Tư sủa nữa?", "smug"],
          ["linh", "...Thôi được. Em live trên sân thượng. Nhưng em đâu có nói món gì đâu!", "angry"],
        ],
        gives: { words: ["quay-live", "phong-linh"] },
      },
    },
    "linh-noi-rieng": {
      by: "linh", text: "Thịt kho trong live là [[noi-rieng|nồi riêng mẹ gửi]] từ quê lên. Cái nồi đó em cất trong phòng.",
      break: {
        clue: "noi-sach",
        lines: [
          ["me", "Cái nồi trong live có quai buộc dây thun đỏ. Cái nồi đó giờ đang úp trên sân thượng, nắp móp một góc. Y chang nồi cô Hai."],
          ["linh", "Nồi... nồi nhôm nhà nào chả giống nhau! Dây thun thì ai mà không có!", "angry"],
          ["me", "Vậy sao 'nồi riêng trong phòng em' lại nằm trên sân thượng?"],
          ["linh", "...", "shock"],
        ],
        gives: { flags: ["linh-lung-tung"] },
      },
    },
    "linh-tuoi-cay": {
      by: "linh", text: "Dép em ướt là do sáng sớm em lên sân thượng [[tuoi-cay|tưới cây]] cho ông Sáu.",
      break: {
        clue: "cay-nhua",
        lines: [
          ["me", "Mấy chậu trên sân thượng là cây nhựa 35 nghìn, đất khô nứt. Em tưới cây nhựa hả Linh?"],
          ["linh", "Em... em tưới cho nó... bóng lá!", "shock"],
          ["teo", "Chị ơi, cây nhựa không cần nước, nó cần lau bụi thôi chị.", "smug"],
          ["linh", "Thôi được rồi! Em có rửa cái nồi ở vòi bồn nước. Nhưng là rửa nồi của em!", "angry"],
        ],
        gives: { flags: ["linh-rua-noi"] },
      },
    },
    "ongsau-ngu-som": {
      by: "ongsau", text: "Tui già rồi, [[ngu-som|ngủ sớm]] từ 9 giờ tối, cả đêm không biết gì hết.",
      break: {
        clue: "clip-live",
        lines: [
          ["me", "Lúc 23h52, tài khoản 'Sáu Chìa Khoá' tặng 10 bông hồng trong live của Linh. Ông ngủ mà tay ông tặng hoa hả?"],
          ["ongsau", "Cái... đó là... con mèo đạp trúng điện thoại!", "shock"],
          ["teo", "Mèo mà gõ được chữ 'con nấu giống bà Hai ghê' hả ông?", "smug"],
          ["ongsau", "...Thôi được. Tui là fan của con Linh. Đêm nào tui cũng coi nó live. Mấy đứa đừng cười!", "nervous"],
        ],
        gives: { flags: ["ongsau-fan"] },
      },
    },
  },

  present: {
    tuan: {
      "ao-tuan": [
        ["tuan", "Anh ngửi đi anh! Mùi tỏi phi sa tế! Thịt kho đâu có mùi tỏi phi!", "angry"],
        ["tuan", "...Mà anh đừng ngửi lâu quá, cái áo đó em mặc ba ngày rồi.", "nervous"],
      ],
      "vo-mi-sa-te": [
        ["tuan", "Gói mì đó... ai cũng ăn được mà. Mì quốc dân mà anh.", "nervous"],
        ["teo", "Cấp độ 7 không phải quốc dân đâu anh, đó là cảm tử.", "smug"],
      ],
      "clip-live": [
        ["tuan", "Trời, chị Linh live trên sân thượng hả? Hèn chi gần 12 giờ em nghe tiếng dép với mùi thịt kho...", "shock"],
        ["tuan", "Vậy là em không có ảo giác. Em mừng quá anh.", "happy"],
      ],
      "hinh-noi": [["tuan", "Đẹp quá... ngon quá... Anh cất đi, em đói.", "nervous"]],
    },
    linh: {
      "hinh-noi": [
        ["linh", "Nồi của cô Hai đẹp ghê... À không, bình thường. Nồi bình thường thôi anh.", "nervous"],
      ],
      "lich-live": [
        ["linh", "Thì lịch live thôi mà anh. 'Món mẹ nấu' là... chủ đề chung chung. Ai cũng có mẹ mà!", "nervous"],
        ["teo", "Mục tiêu 10K mắt luôn chị ơi...", "neutral"],
      ],
      "ao-tuan": [["linh", "Anh Tuấn hả? Ảnh hiền lắm, chắc không phải đâu anh.", "nervous"]],
      "vet-nuoc-bon": [
        ["linh", "Vũng nước đó... chắc mưa. Đêm qua mưa nhỏ mà.", "nervous"],
        ["me", "Mưa có cọng hành lá hả?"],
      ],
    },
    ongsau: {
      "hoa-don-chao": [["ongsau", "Đó! Thấy chưa! Cháo lòng Dì Chín, ngon nhất hẻm. Bà Tư toàn đăng bậy.", "smug"]],
      "cay-nhua": [["ongsau", "Cây nhựa đó tui mua 35 nghìn một chậu, ba năm chưa chết cây nào. Đầu tư sinh lời đó thám tử.", "smug"]],
      "lich-live": [
        ["ongsau", "Tui... tui đâu có biết lịch live của con nhỏ đó. Tui đâu có bật chuông thông báo.", "nervous"],
        ["teo", "Ông chưa hỏi mà đã khai có bật chuông...", "smug"],
      ],
      "ao-tuan": [["ongsau", "Áo đó nó mặc ba ngày rồi. Mà kệ áo, thám tử nhắc nó đóng tiền trọ giùm tui.", "angry"]],
    },
    cohai: {
      "ao-tuan": [["cohai", "Ủa, cái này đâu phải nước màu. Nước màu tui thắng nâu cánh gián, đâu có hột ớt.", "neutral"]],
      "noi-sach": [["cohai", "Nồi tui! Ai rửa sạch vậy trời? Tui rửa còn không sạch bằng.", "shock"]],
      "vet-nuoc-mau": [["cohai", "Đó, nồi tui để đúng chỗ đó. Tui đậy nắp kỹ lắm.", "nervous"]],
    },
  },

  wrong: {
    tuan: [
      [["tuan", "Anh ơi cái này liên quan gì em? Em chỉ là sinh viên nghèo vô tội thôi.", "nervous"]],
      [["tuan", "Anh đưa em coi cái này làm em hoang mang hơn deadline nữa.", "shock"]],
      [["tuan", "Em không hiểu anh muốn nói gì. Nhưng em cũng không hiểu môn Giải tích, nên chắc tại em.", "nervous"]],
      [["teo", "Sếp ơi, đưa trật rồi. Mất một kính lúp. Đọc lại lời khai coi chỗ nào cấn đi sếp."]],
    ],
    linh: [
      [["linh", "Anh đang làm content hả? Không có logic gì hết trơn á.", "smug"]],
      [["linh", "Cái này mà là bằng chứng hả anh? Lên live người ta cười anh đó.", "smug"]],
      [["linh", "Anh ơi, em đang bận trả lời bình luận. Anh cho em xin cái vật chứng khác đi.", "neutral"]],
      [["teo", "Sếp, chị Linh không bể. Mình đưa trật món rồi. Coi lại thời gian với chỗ chỉ khai đi sếp."]],
    ],
    ongsau: [
      [["ongsau", "Thám tử đưa tui cái này chi? Tui là chủ trọ, không phải bãi rác.", "angry"]],
      [["ongsau", "Hồi tui còn trẻ, thám tử đâu có ẩu vậy. Hồi đó người ta còn soi bằng đèn dầu.", "smug"]],
      [["ongsau", "Không liên quan. Mà nhân tiện, ai trong xóm còn nợ tiền trọ thì nhắc giùm tui nha.", "neutral"]],
    ],
    cohai: [
      [["cohai", "Thám tử đưa tui coi cái này làm gì? Tui cần cái nồi!", "angry"]],
      [["cohai", "Tui không hiểu. Mà tui đang ức, tui không muốn hiểu.", "nervous"]],
      [["cohai", "Thôi thôi, coi lại đi thám tử. Tui còn phải đi chợ.", "neutral"]],
    ],
  },

  deduction: [
    {
      id: "moc-gio",
      text: "Lúc {a} Tuấn còn thấy nồi thịt kho trên bếp. Buổi live 'thịt kho mẹ nấu' bắt đầu lúc {b}.",
      blanks: { a: { answer: "22h30", kind: "luc" }, b: { answer: "23h30", kind: "luc" } },
      explain: [
        ["me", "Nồi biến mất trong khoảng một tiếng: sau khi Tuấn nấu mì, trước khi buổi live lên sóng."],
        ["teo", "Vậy ai lên live đúng lúc đó, người đó đáng nghi nhất! Sếp ơi em thông minh ra rồi!", "happy"],
      ],
    },
    {
      id: "tuan-noi-doi",
      text: "Tuấn nói dối là {a}: cậu xuống bếp nấu mì, và vết đỏ trên áo là {b}.",
      blanks: { a: { answer: "khong-xuong-bep", kind: "khac" }, b: { answer: "sa-te", kind: "vat" } },
      explain: [
        ["me", "Nồi mì trong bồn rửa, vỏ gói mì cấp độ 7, và hột ớt trên áo. Tuấn nói dối vì ngại, không phải vì ăn trộm."],
        ["tuan", "Em xin lỗi cả xóm. Em sẽ ăn mì gói một cách công khai từ nay về sau.", "nervous"],
      ],
    },
    {
      id: "ai-noi-doi",
      text: "{a} khai là {b}, nhưng tài khoản của ông tặng hoa trong live lúc {c}.",
      blanks: { a: { answer: "ongsau", kind: "ai" }, b: { answer: "ngu-som", kind: "khac" }, c: { answer: "23h52", kind: "luc" } },
      explain: [
        ["me", "Ông Sáu nói dối, nhưng chỉ để giấu chuyện mình là fan cứng của Linh. Còn cái nồi ông xách lúc 5h là nồi cháo lòng."],
        ["teo", "Chủ trọ khó tính mà tặng hoa cho streamer. Tết này xóm mình nhiều drama ghê sếp.", "smug"],
      ],
    },
    {
      id: "thu-pham",
      text: "Thủ phạm là {a}. Cô bưng nồi lên {b} để {c}, nhằm {d}.",
      blanks: {
        a: { answer: "linh", kind: "ai" },
        b: { answer: "san-thuong", kind: "o" },
        c: { answer: "quay-live", kind: "cach" },
        d: { answer: "cau-view", kind: "vi" },
      },
      explain: [
        ["me", "Poster đặt mục tiêu 10K mắt. Phông nền là bồn nước sân thượng. Nồi trong live buộc dây thun đỏ, giờ đang úp trên sân thượng."],
        ["me", "Bồn rửa dưới bếp bị Tuấn làm nghẹt, nên cô rửa nồi ở vòi bồn nước. Dép lông hồng còn ướt."],
        ["teo", "Chị Linh ơi... em là fan chị mà...", "shock"],
      ],
    },
  ],

  finale: {
    culprit: "linh",
    intro: [
      ["narr", "Cả xóm trọ tụ tập trong bếp chung. Bà Tư đã bấm nút live. Chú Ba dân phòng vừa tới, miệng còn dính tương ớt."],
      ["chuba", "Tui tới rồi! Ai bắt? Bắt ai? Tui có còi nè!", "shock"],
      ["me", "Linh. Nồi thịt kho của cô Hai, em là người cuối cùng cầm nó."],
      ["teo", "Sếp ơi tới màn vạch mặt rồi! Chị ấy chối câu nào, sếp đưa đúng vật chứng phá câu đó. Mỗi câu một món khác nhau nha!", "nervous"],
    ],
    steps: [
      {
        claim: [["linh", "Anh nói gì vậy? Tối qua em live ở trong phòng, đâu có lên sân thượng!", "angry"]],
        answer: "clip-live",
        right: [
          ["me", "Bồn nước inox, dây phơi đồ, tiếng chó nhà bà Tư. Phông nền của em là sân thượng."],
          ["batu", "Chó nhà tui sủa hay quá trời, lên sóng luôn kìa!", "happy"],
          ["linh", "Thì... em lên sân thượng live cho đẹp. Vậy thôi!", "nervous"],
        ],
        wrong: [["linh", "Cái đó chứng minh được gì? Anh có thấy em lên sân thượng đâu.", "smug"]],
      },
      {
        claim: [["linh", "Thịt kho đó mẹ em gửi lên! Nồi nhôm nhà nào chả giống nồi nào!", "angry"]],
        answer: "hinh-noi",
        right: [
          ["me", "Hình cô Hai chụp lúc 9 giờ tối: nắp móp một góc, quai trái buộc dây thun đỏ. Cái nồi trong live của em cũng y như vậy."],
          ["cohai", "Nồi tui đó! Cái góc móp đó do chồng tui làm rớt năm 2006!", "angry"],
          ["linh", "...", "shock"],
        ],
        wrong: [["linh", "Không đủ đâu anh. Nồi em với nồi cô Hai khác nhau mà, khác... cái gì đó.", "smug"]],
      },
      {
        claim: [["linh", "Mà nếu em lấy thì em rửa nồi ở đâu? Bồn rửa dưới bếp nghẹt đặc mì sa tế, ai rửa được!", "smug"]],
        answer: "vet-nuoc-bon",
        right: [
          ["me", "Đúng. Nên em rửa ở vòi bồn nước trên sân thượng. Vũng nước còn ánh nâu, còn cọng hành lá của nồi thịt kho."],
          ["tuan", "Vậy là nhờ em làm nghẹt bồn mà lộ ra hả anh? Em có công phá án không?", "happy"],
          ["teo", "Không anh.", "neutral"],
        ],
        wrong: [["linh", "Đó, anh bí rồi đó. Không có chỗ rửa thì em lấy làm sao?", "smug"]],
      },
      {
        claim: [["linh", "Sân thượng ai lên chẳng được! Ông Sáu, anh Tuấn, con mèo! Sao biết người rửa là em?", "angry"]],
        answer: "dep-long-hong",
        right: [
          ["me", "Dép lông hồng của em, ướt nhẹp, dính bọt xà phòng và vệt nước màu. Dấu dép nối từ cầu thang sân thượng về đúng phòng 4."],
          ["teo", "Mà cây trên sân thượng là cây nhựa, chị khỏi nói tưới cây nha chị.", "smug"],
          ["linh", "...Dạ. Là em.", "shock"],
        ],
        wrong: [["linh", "Anh thấy chưa, anh đâu có bằng chứng em là người lên đó.", "smug"]],
      },
    ],
    confess: [
      ["linh", "Tối qua em định live mì trộn. Mà view thấp quá, có ba chục người coi.", "nervous"],
      ["linh", "Em xuống bếp thì thấy nồi thịt kho của cô Hai. Mùi y chang mùi nhà em ở quê.", "nervous"],
      ["linh", "Em nghĩ: mượn quay một xíu, đặt tên 'thịt kho mẹ nấu', chắc nhiều người coi. Rồi em trả lại.", "nervous"],
      ["linh", "Mà lên sóng em nếm một miếng... rồi em khóc. Năm nay em không đủ tiền về quê. Mẹ em cũng kho thịt kiểu này, cũng bỏ nước dừa xiêm.", "nervous"],
      ["linh", "Người xem vô đông quá, ai cũng nói 'ăn đi em, ăn cho mẹ vui'. Em ăn... ăn hết lúc nào không hay.", "shock"],
      ["linh", "Em rửa nồi thật sạch, định sáng nay xin lỗi cô Hai. Mà em sợ quá, em trốn luôn. Em xin lỗi cô.", "nervous"],
      ["cohai", "Con nhỏ này...", "angry"],
      ["cohai", "Ăn hết hai chục trứng vịt luôn hả con?", "shock"],
      ["linh", "Dạ... mười tám trứng. Còn hai trứng em chia cho người xem... qua màn hình... không chia được nên em ăn luôn.", "nervous"],
    ],
    epilogue: [
      ["cohai", "Thôi. Tết nhứt ai mà nỡ. Chiều nay con xuống phụ cô kho nồi khác. Học cho biết, mai mốt tự kho mà ăn.", "neutral"],
      ["linh", "Dạ! Con sẽ live cảnh cô dạy con kho thịt, tiền quà tặng con đưa cô hết!", "happy"],
      ["cohai", "Live thì live, nhưng quay cái mặt tui đẹp đẹp đó nghe.", "smug"],
      ["ongsau", "Tui... tui tặng thêm hai chục bông hồng.", "nervous"],
      ["tuan", "Cô Hai ơi, còn em... em có được ăn ké không?", "nervous"],
      ["cohai", "Đóng tiền trọ cho ông Sáu đi rồi ăn.", "angry"],
      ["ongsau", "Đúng rồi!", "happy"],
      ["narr", "Tối 29 Tết, livestream 'KHO THỊT CÙNG CÔ HAI 🥺' đạt 11 nghìn người xem. Cả xóm trọ ngồi ăn chung trên sân thượng, dưới cái ring light hồng."],
      ["teo", "Sếp ơi, vụ đầu tiên phá xong mà em đói quá. Mình xuống ăn ké được không sếp?", "happy"],
      ["me", "Đi. Nhưng đừng đụng nồi của ai không dán tên mình."],
    ],
    comments: [
      { by: "batu", text: "Tui đã nói rồi mà, tui nghi ngay từ đầu! (Tui nghi thằng Tuấn, nhưng mà cũng là nghi) 🕵️‍♀️", likes: 412 },
      { by: "Tuấn Deadline", text: "Cả xóm nợ em một lời xin lỗi. Và em nợ ông Sáu ba tháng tiền trọ. Hoà nhé.", likes: 988 },
      { by: "Fan Cứng Linh Hồng", text: "Dù sao chị vẫn là idol của em. Lần sau chị live thì nấu nồi mới nha chị 🥺", likes: 301 },
      { by: "Anh Hùng Bàn Phím 2k1", text: "Ăn trộm là sai! Không có lý do gì hết! Mà nói vậy chứ coi tới đoạn khóc tui cũng khóc 😭", likes: 655 },
      { by: "Thím Bảy Bánh Bò", text: "Ông Sáu tặng hoa cho streamer hả? Tối nay tui qua nói chuyện với bà Sáu.", likes: 723 },
      { by: "Sáu Chìa Khoá", text: "Thím Bảy đừng nha thím.", likes: 1204 },
      { by: "Shop Nồi Inox Giá Xưởng", text: "Mất nồi đừng lo! Nồi inox 3 đáy chỉ 199k, quai chắc khỏi buộc dây thun. Ship toàn quốc 📦", likes: 12 },
      { by: "Ngôn Tình Mỗi Ngày", text: "'Có những nồi thịt kho, ăn rồi mới biết mình nhớ nhà đến nhường nào.' 🍂", likes: 2031 },
      { by: "Út Bán Vé Số", text: "Vậy rốt cuộc ai ăn con mèo? À không, con mèo ăn ai? À tui đọc lộn.", likes: 88 },
      { by: "Chú Ba Dân Phòng", text: "Vụ này dân phòng có tham gia hỗ trợ. (Tới trễ nhưng có còi)", likes: 157 },
      { by: "Mẹ Linh Ở Quê", text: "Con ơi, mẹ coi clip rồi. Ra Giêng mẹ gửi lên con một nồi. Nhớ trả nồi cho người ta nghe chưa.", likes: 5320 },
      { by: "Hội Những Người Ghét Hành Lá", text: "Vụ án được phá nhờ cọng hành lá. Hôm nay hội chúng tôi xin im lặng.", likes: 477 },
      { by: "Trà Sữa Lụm Kèo", text: "Ăn thịt kho xong nhớ làm ly trà sữa cho đỡ ngán nha cả nhà 🧋", likes: 64 },
      { by: "teo", text: "Thám tử nhà mình 1 - Nồi thịt kho 0. Hẹn cả xóm vụ sau! 🕵️", likes: 890 },
    ],
  },

  hints: [
    { needs: ["broke:linh-o-phong", "broke:linh-noi-rieng", "broke:linh-tuoi-cay"], text: "Sếp ơi chị Linh bể hết lời khai rồi! Mở Bảng suy luận điền đi, rồi qua màn vạch mặt. Nhớ cái dép lông hồng nha!" },
    { needs: ["stmt:linh-tuoi-cay"], text: "Chị Linh nói lên sân thượng tưới cây... mà mấy chậu trên đó cây gì vậy sếp? Soi lại chậu cây coi." },
    { needs: ["stmt:linh-noi-rieng"], text: "Chị Linh nói nồi riêng cất trong phòng. Mà cái nồi buộc dây thun đỏ đang nằm chỗ khác đó sếp. Đưa ra coi!" },
    { needs: ["clue:clip-live", "stmt:ongsau-ngu-som"], text: "Ông Sáu nói ngủ từ 9 giờ. Mà trong clip live, tài khoản 'Sáu Chìa Khoá' tặng hoa lúc mấy giờ ta?" },
    { needs: ["clue:clip-live", "stmt:linh-o-phong"], text: "Chị Linh khai live trong phòng. Sếp coi phông nền trong clip live coi, phòng ai có bồn nước inox?" },
    { needs: ["loc:rooftop"], text: "Sân thượng có đèn ring light của chị Linh. Soi nó đi sếp, em mở lại live tối qua cho." },
    { needs: ["broke:tuan-khong-xuong-bep"], text: "Anh Tuấn đã khai thật. Hỏi ảnh lúc xuống bếp thấy gì đi sếp, giờ giấc quan trọng lắm." },
    { needs: ["stmt:tuan-khong-xuong-bep", "clue:noi-mi-tuan"], text: "Anh Tuấn nói không xuống bếp. Mà cái nồi mini ghi tên ảnh nằm ở đâu? Mở Sổ tay, chọn lời khai đó, đưa cái nồi ra!" },
    { needs: ["loc:hallway"], text: "Hành lang có cầu thang lên sân thượng đó sếp. Mà nhớ hỏi chuyện cả ba người: anh Tuấn, chị Linh, ông Sáu." },
    { text: "Sếp bấm vào bếp ga trước đi, rồi hỏi cô Hai cái nồi trông ra sao. Soi hết mấy chỗ sáng sáng trong bếp luôn!" },
  ],

  bonus: [
    {
      id: "vet-ao", q: "Vết đỏ trên áo Tuấn thật ra là gì?",
      choices: ["Nước màu thịt kho", "Sa tế mì gói", "Mực bút đỏ chấm bài", "Son của bà Tư"],
      answer: 1, explain: "Vệt đỏ cam có hột ớt, thơm tỏi phi, đúng gói mì Sa Tế Cấp Độ 7. Nước màu của cô Hai thì nâu cánh gián.",
    },
    {
      id: "noi-ong-sau", q: "5 giờ sáng ông Sáu xách nồi đi đâu?",
      choices: ["Đem nồi thịt kho đi giấu", "Đi mua cháo lòng Dì Chín", "Đi tập dưỡng sinh", "Đi đòi tiền trọ"],
      answer: 1, explain: "Phiếu tính tiền quán Dì Chín 5h12: cháo lòng x2, khách mang nồi.",
    },
    {
      id: "trung", q: "Linh đã ăn bao nhiêu trứng vịt trong nồi thịt kho?",
      choices: ["Hai chục", "Mười tám", "Mười", "Không trứng nào, cô ăn kiêng"],
      answer: 0, explain: "Mười tám trứng trong live, cộng hai trứng 'chia cho người xem' mà không chia qua màn hình được... nên ăn luôn. Tổng hai chục.",
    },
  ],
};
