// Vụ 11: "Con Ma Nhà Số 13" (độ khó 3, mùa 2). Cơ chế mới: THÍ NGHIỆM TẠI CHỖ.
// Chuỗi điểm soi có needs theo thứ tự, người chơi tự tái hiện "hiện tượng ma":
//   1) hop-cau-dao: cầu dao tắt, công tơ niêm phong từ 2023 ⇒ nhà không có điện.
//   2) cho-nua-dem (cần 1 + den-chap-chon): ngồi canh tới 23h00, đèn vẫn chớp, tường vẫn khóc, đúng 13 phút ⇒ có nguồn riêng + hẹn giờ.
//   3) gác xép mở khi đã soi đèn (lần theo dây mới). thi-nghiem-hen-gio (cần o-cam-hen-gio + ruong-go + đã canh 23h):
//      gạt ổ hẹn giờ sang ON giữa lúc cầu dao vẫn tắt ⇒ đèn chớp + tiếng khóc y hệt. Gạt về AUTO ⇒ hết.
//   4) thi-nghiem-cua-so (cần cua-so-gac + ghe-dua + bước 3): rút chèn, đóng cửa sổ gác ⇒ ghế đưa đứng im. Mở ⇒ ghế đưa lại.
// Lời giải: anh Quân (môi giới) biết dự thảo mở rộng đường, cuối hẻm 47 sắp thành mặt tiền. Giữ chìa nhà 13 từ hợp đồng
//   môi giới 15/9, 02/10 mua ắc quy + kích điện giao tới nhà 13 (SĐT …313), gắn ổ hẹn giờ 23:00–23:13 cho bóng đèn và
//   loa quà tặng của công ty mình (giấu trên gác, áp miệng ống tôn trong tường). Mỗi thứ Hai, thứ Năm 6h sáng "dẫn khách xem nhà"
//   để thay ắc quy. Chèn cửa sổ gác bằng xấp tờ rơi cho kích điện khỏi nóng ⇒ gió lùa làm ghế đưa tự đưa.
//   Mua rẻ nhà 9, 15 qua Cty Lạc Nghiệp (Quân làm giám đốc), sắp tới nhà 11 của chị Thơ.
// Cú lật: Đạt "Săn Ma TV" biết từ đầu: clip "ĐÊM ĐẦU TIÊN" đăng 23h41 ngày 5/10, trước khi cả hẻm biết có ma.
//   Được Lạc Nghiệp chuyển khoản 5 triệu.
// Gây nhiễu: bà Diệu (21h tối nào cũng lén vô thắp nhang, ca vọng cổ cho bà Hai theo lời nhờ của ông Hai),
//   ông Hai (lén lên Sài Gòn 14/10 ngồi ghế đưa chờ "bả về"), Bé Ti (giấu ổ mèo con, bắn súng nước vô gương vì tưởng ma).
export default {
  id: "ma-nha-13",
  no: 11,
  title: "Con Ma Nhà Số 13",
  tagline: "Đêm nào cũng 23h, đèn chớp, tường khóc, ghế tự đưa. Ba nhà rao bán. Ma này đúng giờ hơn chú Ba dân phòng.",
  difficulty: 3,
  client: "chitho",

  intro: [
    ["narr", "Tối thứ Sáu, 22h. Văn phòng thám tử chuẩn bị đóng cửa thì có tiếng gõ. Ba tiếng. Ngừng. Ba tiếng nữa."],
    ["teo", "Sếp… gõ cửa kiểu đó là trong phim ma đó sếp. Em không mở đâu.", "nervous"],
    ["batu", "Mở cửa! Bà Tư nè! Gõ ba tiếng tại tay bà đang cầm điện thoại, gõ bằng một ngón!", "angry"],
    ["narr", "Bà Tư bước vô, kéo theo một chị đội nón lá, tay còn cầm cái vá múc chè."],
    ["chitho", "Dạ em là Thơ, bán chè, ở nhà số 11, sát vách nhà số 13 cuối hẻm. Anh thám tử ơi, nhà 13 có ma. Đêm nào cũng có.", "nervous"],
    ["chitho", "Đúng 11 giờ đêm, đèn trong nhà đó chớp chớp, rồi có tiếng đàn bà khóc rấm rứt trong tường. Mà nhà đó bỏ hoang ba năm, cắt điện từ lâu rồi.", "shock"],
    ["batu", "Từ hồi có ma, nhà số 9 với nhà số 15 bán tháo hết rồi. Giá rớt gần một nửa. Con Thơ đây cũng sắp ký bán, sáng thứ Hai này.", "nervous"],
    ["chitho", "Em không muốn bán đâu anh. Nhà của ba má em để lại. Mà đêm nào nghe khóc, con em nó sợ không ngủ được. Anh Quân môi giới nói bán sớm còn được giá, để lâu nhà ma không ai mua.", "nervous"],
    ["teo", "Sếp! Em biết rồi! Ma thiệt! Ba năm bỏ hoang, cắt điện mà đèn vẫn chớp! Mình về ngủ đi sếp, vụ này nhờ thầy cúng!", "shock"],
    ["me", "Ma mà đúng giờ từng phút thì tui muốn gặp nó. Còn 50 phút nữa là 11 giờ. Đi.", "smug"],
    ["teo", "Sếp… em đem theo đèn pin, bánh tráng, với một nhánh tỏi. Tỏi là trị ma cà rồng hả sếp? Thôi kệ, đem cho chắc.", "nervous"],
    ["narr", "Cuối hẻm 47, nhà số 13 nằm im lìm dưới cây bàng. Cửa sắt hoen gỉ, khoá đã bị ai đó bẻ từ lâu, chỉ còn quấn sợi dây kẽm. Trước cửa đã có sẵn vài người."],
    ["narr", "Anh Quân môi giới sơ mi trắng phẳng phiu. Bà Diệu thầy cúng lần chuỗi hạt. Một cậu trai đội đèn đầu đang dựng gậy selfie. Ông Hai chủ nhà chống nón lá, vừa xuống xe đò chiều nay. Và Bé Ti, bảy tuổi, cầm súng nước."],
    ["quan", "Ủa thám tử! Hân hạnh hân hạnh! Tui là Quân, An Cư Land. Thám tử tới bắt ma hả? Cẩn thận nha, ma này dữ lắm, tui nói thiệt lòng!", "happy"],
    ["beti", "Chú thám tử! Con nhớ chú! Lần này con không có làm gì hết! Con chỉ đi ngang!", "happy"],
  ],

  social: {
    group: "Hẻm 47 Hóng Biến",
    posts: [
      {
        by: "batu",
        text: "👻👻 NHÀ SỐ 13 CUỐI HẺM: ĐÊM THỨ 48 LIÊN TIẾP CÓ MA 👻👻 Đúng 23h đèn chớp, tường khóc, ghế tự đưa. Nhà 9 với nhà 15 đã bán, nhà 11 sắp ký. Bà Tư đã mời thám tử hẻm mình tới canh đêm nay. Ai yếu tim thì đừng coi live, ai mạnh tim thì coi giùm bà, bà không dám coi.",
        likes: 7313,
        comments: [
          { by: "Chị Thơ Chè", text: "Đêm qua em nghe khóc tới 11 giờ 13 thì ngưng. Mười ba phút. Đêm nào cũng mười ba phút." },
          { by: "Anh Quân An Cư Land", text: "Bà con cần bán nhà cuối hẻm thì inbox Quân nha. Giá tốt, thủ tục nhanh, Quân lo hết. Nhà ma để lâu khó bán lắm 🙏" },
          { by: "Săn Ma TV - Đạt", text: "Kênh Săn Ma TV đã quay nhà 13 từ những đêm đầu tiên! Tập 7 lên sóng tối nay, nhớ bấm chuông 🔔👻" },
          { by: "Cô Hai Thịt Kho", text: "Tui ở đầu hẻm mà đêm nào cũng nghe thằng Đạt la ‘Á Á Á’ còn to hơn con ma." },
          { by: "teo", text: "Em đi theo sếp. Em có tỏi. Mọi người cầu nguyện cho em." },
          { by: "Chú Ba Dân Phòng", text: "Tui sẽ có mặt lúc 23h. Có thể là 23h30. Ma đợi tui chút." },
          { by: "Ông Bảy Gà Chọi", text: "Đem Chiến Thần qua đó. Gà gáy là ma chạy. Ông bà mình nói vậy." },
        ],
      },
    ],
  },

  people: {
    quan: {
      name: "Anh Quân",
      role: "Môi giới nhà đất, An Cư Land",
      bio: "Khoảng 35 tuổi, sơ mi trắng, cặp da, giày tây mũi nhọn bóng loáng. Cười nhiều, nói ngọt, đi đâu cũng phát danh thiếp. Đang lo bán giùm ‘nhà ma giá rẻ’ cho cả dãy cuối hẻm.",
      suspect: true,
      start: true,
    },
    bado: {
      name: "Bà Diệu",
      role: "Thầy cúng trong hẻm",
      bio: "Khoảng 65 tuổi, áo dài nâu, chuỗi hạt. Tự se nhang trầm, chân nhang sơn đỏ, cả hẻm chỉ bà làm kiểu này. Đã được mời cúng nhà 13 ba lần mà ‘ma không chịu đi’.",
      suspect: true,
      start: true,
    },
    nhomyt: {
      name: "Đạt Săn Ma",
      role: "YouTuber kênh ‘Săn Ma TV’",
      bio: "24 tuổi, đèn đội đầu, gậy selfie, áo thun in chữ ‘I SEE GHOSTS’. Kênh 80 nghìn người theo dõi. Chuyên quay nhà hoang lúc nửa đêm và la thất thanh.",
      suspect: true,
      start: true,
    },
    onghai: {
      name: "Ông Hai",
      role: "Chủ nhà số 13",
      bio: "Khoảng 75 tuổi, nón lá, áo bà ba sờn vai. Vợ mất ba năm, ông về quê sống với con gái. Con trai ông đã ký hợp đồng môi giới bán nhà với anh Quân.",
      suspect: true,
      start: true,
    },
    beti: {
      name: "Bé Ti",
      role: "Con nít trong hẻm, 7 tuổi",
      sheet: "nhan-dam-hoi",
      bio: "Vẫn cầm súng nước pha siro bạc hà xanh lá. Vẫn nghịch có tiếng. Từ vụ đám hỏi, tuyên bố ‘con không bao giờ nói dối nữa’, đã giữ lời được bốn ngày.",
      suspect: true,
      start: true,
    },
    chitho: {
      name: "Chị Thơ",
      role: "Bán chè, nhà số 11 (sát vách nhà 13)",
      bio: "Bán chè ba màu đầu hẻm mười năm. Hẹn ký bán nhà sáng thứ Hai cho một công ty anh Quân giới thiệu.",
    },
  },

  locations: {
    hauntedhouse: {
      name: "Phòng khách nhà số 13",
      scene: "hauntedhouse",
      start: true,
      intro: [
        ["narr", "Bên trong nhà 13 tối om, mùi ẩm mốc. Ánh đèn pin quét qua bàn thờ cũ phủ bụi, tấm gương nứt, chiếc ghế đưa mây đứng giữa phòng. Bức tường bên phải loang lổ vết ẩm như bản đồ."],
        ["teo", "Sếp ơi, sếp đi trước nha. Em đi sau… để bảo vệ phía sau.", "nervous"],
        ["nhomyt", "Hello anh em Săn Ma TV! Tập 7: lần đầu có thám tử thật đi cùng! Còn 40 phút nữa là tới giờ ma!", "happy"],
      ],
      hotspots: [
        {
          id: "den-chap-chon",
          label: "Bóng đèn treo",
          rect: [430, 20, 100, 150],
          lines: [
            ["narr", "Một bóng đèn treo lủng lẳng giữa trần. Đui đèn cũ đen sì, dây điện cũ bọc vải mục, đứt ngang một khúc."],
            ["me", "Dây cũ đứt rồi. Nhưng có một sợi dây khác, vỏ trắng tinh, cột vô đui đèn bằng băng keo đen, chạy thẳng lên một cái lỗ trên trần. Lên [[gac-xep|gác xép]]."],
            ["me", "Bóng đèn cũng mới. Còn dính tem giá ‘35.000đ’. Ba năm bỏ hoang mà bóng đèn mới tinh."],
            ["teo", "Ma… ma đi chợ mua bóng đèn hả sếp?", "shock"],
          ],
          gives: { clues: ["bong-den-moi"] },
          again: [["me", "Dây trắng mới chạy lên gác xép. Bóng còn dính tem giá."]],
        },
        {
          id: "hop-cau-dao",
          label: "Hộp cầu dao",
          rect: [30, 110, 90, 120],
          lines: [
            ["narr", "Hộp cầu dao gỉ sét sau cánh cửa. Cầu dao đang gạt xuống, nấc OFF. Kế bên là công tơ điện, dán tờ niêm phong đã ngả vàng."],
            ["me", "‘Ngưng cấp điện do chấm dứt hợp đồng – 03/2023’. Thử gạt cầu dao lên…"],
            ["narr", "Cạch. Không có gì. Không đèn, không tiếng. Gạt xuống lại. Cạch."],
            ["me", "Nhà này [[cong-to|cắt điện]] từ ngoài cột. Không có một giọt điện nào chạy vô đây."],
            ["teo", "Vậy lát nữa đèn mà chớp là… là ma xài điện ở đâu? Điện âm phủ hả sếp?", "nervous"],
          ],
          gives: { clues: ["cong-to-cat"] },
          again: [["teo", "Em gạt thử thêm lần nữa nha… Cạch. Dạ, vẫn không có điện. Em yên tâm hơn chút. Mà cũng sợ hơn chút.", "nervous"]],
        },
        {
          id: "cho-nua-dem",
          label: "Ngồi canh tới 23h",
          rect: [380, 420, 200, 100],
          needs: ["seen:hauntedhouse.hop-cau-dao", "seen:hauntedhouse.den-chap-chon"],
          lines: [
            ["narr", "Cầu dao đã tắt. Công tơ niêm phong. Bóng đèn treo trên dây mới. Thám tử tắt đèn pin, ngồi xuống bậc cửa, bấm đồng hồ."],
            ["narr", "22h58. Ngoài cửa sổ, đèn đội đầu của Đạt Săn Ma đã bật sẵn, gậy selfie chĩa đúng vô bóng đèn."],
            ["narr", "23h00. Tách. Bóng đèn bật sáng. Tắt. Sáng. Tắt. Chớp chớp đều đặn."],
            ["narr", "Rồi từ trong bức tường ẩm vọng ra tiếng đàn bà khóc. ‘Hu hu… hức… hu hu…’ Rấm rứt, kéo dài, lạnh sống lưng."],
            ["nhomyt", "Á Á Á Á! Anh em thấy không! THẤY KHÔNG! MA! MA THẬT!", "shock"],
            ["teo", "Á Á Á! Sếp! Em cầm tỏi rồi! Tỏi không có tác dụng sếp ơi!", "shock"],
            ["me", "Nghe kỹ, Tèo. Khóc ‘hu hu, hức, hu hu’, rồi hít mũi một cái, rồi lại ‘hu hu, hức’. Y chang. Lặp lại."],
            ["narr", "23h13. Tách. Đèn tắt. Tiếng khóc tắt cùng lúc, gọn như ai bấm nút."],
            ["me", "Cầu dao tắt mà đèn vẫn chớp: có nguồn điện riêng. Bật đúng [[23h]], tắt đúng 13 phút sau: có cái gì đó hẹn giờ. Ma này đeo đồng hồ."],
          ],
          gives: { clues: ["hien-tuong-23h"], flags: ["da-canh-ma"] },
          again: [["teo", "Em vẫn còn run. Mà sếp nói đúng, tiếng khóc lặp y chang như nhạc chờ điện thoại.", "nervous"]],
        },
        {
          id: "tuong-am",
          label: "Bức tường ẩm",
          rect: [700, 100, 220, 300],
          lines: [
            ["narr", "Bức tường loang vết ẩm, rêu xanh bám chân tường. Có một đường nứt dọc từ trần xuống ngang hông."],
            ["me", "Gõ thử: chỗ này kêu bộp bộp, rỗng. Soi đèn vô khe nứt thấy một [[ong-tuong|ống tôn cũ]] chạy trong tường, thẳng đứng, đầu trên lên gác xép."],
            ["me", "Ống thoát nước mưa đời cũ, bị xây lấp trong tường. Âm thanh trên gác mà thả xuống ống này thì vọng ra cả bức tường. Một cái loa sắt khổng lồ."],
            ["teo", "Tường khóc là tại ống nước hả sếp? Em tưởng tường buồn.", "neutral"],
          ],
          gives: { clues: ["ong-tuong"] },
          again: [["teo", "Em áp tai vô thử… Dạ, nghe tiếng ếch kêu ngoài cống. Không phải ma.", "neutral"]],
        },
        {
          id: "ghe-dua",
          label: "Ghế đưa mây",
          rect: [330, 230, 160, 190],
          lines: [
            ["narr", "Chiếc ghế đưa bằng mây đứng giữa phòng. Không ai ngồi, mà nó cứ đưa nhè nhẹ. Kẽo kẹt. Kẽo kẹt."],
            ["teo", "Sếp! Ghế tự đưa! Có [[ma-ngoi|ai đang ngồi đó mà mình không thấy]]! Bà con ơi!", "shock"],
            ["me", "Dưới gối ghế có gì cộm cộm. Một tờ [[ve-xe|vé xe khách]]: ‘Bến Tre – Sài Gòn, 21h00, ngày 14/10’. Giấy còn mới."],
            ["narr", "Dưới gầm ghế là một thùng các-tông lót khăn cũ. Bên trong, một con mèo mướp nằm cho ba con mèo con bú. Kế bên là cái chén nhựa ghi nguệch ngoạc bằng bút lông: ‘TI’."],
            ["teo", "Mèo con! Dễ thương quá! Ủa, cái chén ghi tên Ti… Ti nào ta?", "happy"],
          ],
          gives: { clues: ["ve-xe-onghai", "o-meo-con"] },
          again: [["teo", "Ghế vẫn đưa. Mèo vẫn bú. Chỉ có em là không yên.", "nervous"]],
        },
        {
          id: "guong-vo",
          label: "Tấm gương nứt",
          rect: [150, 80, 140, 220],
          lines: [
            ["narr", "Tấm gương đứng cao bằng người, nứt một đường chéo từ lâu. Soi vô thì thấy mặt mình bị tách làm hai."],
            ["me", "Mặt gương lấm tấm những giọt khô màu [[bac-ha|xanh lá]], dính tay, thơm mùi bạc hà. Toàn ở ngang tầm… một mét."],
            ["teo", "Ma ăn kẹo bạc hà rồi khạc lên gương! Ghê quá sếp!", "shock"],
            ["me", "Ma cao một mét, có súng nước. Tui nghĩ tui biết con ma này."],
          ],
          gives: { clues: ["vet-bac-ha-guong"] },
          again: [["teo", "Em soi gương thấy mặt em bị nứt làm hai. Nửa nào cũng sợ.", "nervous"]],
        },
        {
          id: "ban-tho-cu",
          label: "Bàn thờ cũ",
          rect: [520, 120, 170, 160],
          lines: [
            ["narr", "[[ban-tho|Bàn thờ gỗ cũ]], trên có tấm di ảnh một bà cụ cười tươi, tóc búi, cài bông. Bụi phủ khắp nơi, trừ chính giữa: lư hương sạch, bình bông có bông cúc còn tươi."],
            ["me", "Lư hương đầy tàn. Ít nhất ba bốn chục chân nhang. Nhang trầm se tay, [[nhang|chân nhang sơn đỏ]]. Cây mới nhất còn thơm, mới cháy tối nay."],
            ["me", "Kẹp dưới lư hương là một tờ giấy chép tay: lời bài vọng cổ ‘Tình Anh Bán Chiếu’. Góc giấy ghi: ‘Ca cho bà Hai nghe, tối nào cũng [[21h]]’."],
            ["teo", "Có người tối nào cũng vô đây thắp nhang… với ca vọng cổ? Trong nhà ma? Người này can đảm hơn em nhiều.", "shock"],
          ],
          gives: { clues: ["nhang-tu-se"] },
          again: [["me", "Nhang se tay, chân sơn đỏ. Tối nào cũng có người thắp, lúc 21h. Không phải lúc 23h."]],
        },
      ],
    },

    attic: {
      name: "Gác xép nhà số 13",
      scene: "attic",
      needs: "seen:hauntedhouse.den-chap-chon",
      intro: [
        ["narr", "Lần theo sợi dây trắng, leo cầu thang gỗ ọp ẹp lên gác xép. Mái tôn thấp, nóng hầm hập dù đã nửa đêm. Một cửa sổ nhỏ đang mở hé, gió lùa vô."],
        ["teo", "Sếp ơi, gác xép là chỗ ma ở trong mọi bộ phim. Em xin phép đứng ở bậc thang thứ hai.", "nervous"],
        ["me", "Bậc thứ hai là bậc gãy, Tèo."],
        ["teo", "Á!", "shock"],
      ],
      hotspots: [
        {
          id: "day-dien-moi",
          label: "Dây điện mới",
          rect: [200, 380, 400, 60],
          lines: [
            ["narr", "Sợi dây trắng từ lỗ sàn chui lên, chạy men theo xà gỗ. Dây mới, đóng đinh kẹp cẩn thận từng đoạn, kiểu người làm có nghề."],
            ["me", "Dây chia hai nhánh: một nhánh xuống lỗ sàn tới bóng đèn, một nhánh vòng ra sau tấm ván ở góc tường. Hai nhánh gặp nhau ở một cái ổ cắm."],
            ["teo", "Ma biết đóng đinh kẹp dây! Ma có tay nghề!", "shock"],
          ],
          gives: { clues: ["day-dien-moi"] },
          again: [["me", "Một nhánh xuống đèn, một nhánh ra sau tấm ván góc tường. Cả hai cùng cắm chung một ổ."]],
        },
        {
          id: "o-cam-hen-gio",
          label: "Ổ cắm hẹn giờ",
          rect: [560, 300, 90, 70],
          lines: [
            ["narr", "Một cái [[o-cam|ổ cắm hẹn giờ]] loại cơ, mặt tròn có vòng răng cưa 24 tiếng. Đèn và nhánh dây sau tấm ván đều cắm vô đây."],
            ["me", "Trên vòng răng cưa chỉ có một cụm chốt gạt xuống: từ 23:00 tới 23:15, nhưng chốt cuối được bẻ cong để ngắt sớm. Đúng 13 phút."],
            ["me", "Bên hông có công tắc nhỏ hai nấc: ‘AUTO’ và ‘ON’. Đang để AUTO."],
            ["teo", "Ma xài ổ hẹn giờ của Điện Quang… Ma hiện đại ghê.", "neutral"],
          ],
          gives: { clues: ["o-cam-hen-gio"] },
          again: [["me", "Chốt 23:00 tới 23:13. Công tắc AUTO / ON."]],
        },
        {
          id: "ruong-go",
          label: "Rương gỗ",
          rect: [60, 280, 200, 140],
          lines: [
            ["narr", "Cái rương gỗ cũ, nắp nặng. Bên trong không có vàng bạc, không có xương cốt. Có một bình [[ac-quy|ắc quy]] 12V và một hộp kích điện nối dây ra ổ cắm hẹn giờ."],
            ["me", "Kích điện đổi 12V ra 220V. Ắc quy cấp điện cho cả nhà ma. Bình này đầy thì chạy được chừng ba, bốn đêm."],
            ["me", "Trên bình dán tem giao hàng: ‘Điện máy Bảy Phát – Ắc quy 12V + kích điện 500W – 1.850.000đ – Ngày giao: [[02-10|02/10]] – Giao tới: Nhà số 13 hẻm 47 – SĐT người nhận: 0909 456 [[313]]’."],
            ["teo", "Giao tới nhà ma! Shipper giao hàng cho ma! Ổng có xin chữ ký ma không ta?", "shock"],
          ],
          gives: { clues: ["ac-quy-kich-dien"] },
          again: [["me", "Ắc quy giao ngày 02/10, ba ngày trước đêm ma đầu tiên. SĐT người nhận đuôi 313."]],
        },
        {
          id: "loa-giau",
          label: "Loa giấu sau tấm ván",
          rect: [700, 260, 120, 110],
          lines: [
            ["narr", "Kéo tấm ván ở góc tường ra. Sau tấm ván là miệng ống tôn cũ, và kẹp ngay trên miệng ống là một cái [[loa|loa bluetooth]] chống nước, dây cắm về ổ hẹn giờ."],
            ["me", "Loa có khe thẻ nhớ. Trong thẻ chỉ có một tập tin: ‘khoc_ban3_ronhon.mp3’. Dài 40 giây, phát lặp lại."],
            ["me", "Đáy loa dán tem bạc: ‘QUÀ TẶNG KHÁCH HÀNG – [[an-cu-land|AN CƯ LAND]] – Lô 2026’."],
            ["teo", "‘Khóc bản 3, rợn hơn’… Ma còn sửa tới bản 3! Ma cầu toàn quá!", "shock"],
          ],
          gives: { clues: ["loa-qua-tang"] },
          again: [["teo", "Bản 1 với bản 2 chắc không đủ rợn. Em tò mò bản 1 nghe sao.", "neutral"]],
        },
        {
          id: "cua-so-gac",
          label: "Cửa sổ gác",
          rect: [700, 60, 160, 130],
          lines: [
            ["narr", "Cửa sổ gác nhỏ, bản lề rít. Cánh cửa được chèn mở hé bằng một xấp giấy gấp tư nhét dưới chân."],
            ["me", "Mở xấp giấy ra: toàn [[to-roi|tờ rơi]] in màu, ‘AN CƯ LAND – THU MUA NHÀ NHANH – GIÁ TỐT – Liên hệ anh Quân’. Giấy còn thơm mùi mực."],
            ["me", "Gió từ cửa sổ lùa thẳng xuống lỗ cầu thang. Mái tôn này mà đóng kín thì cái hộp kích điện trong rương nóng tới chảy keo."],
            ["teo", "Ma sợ nóng nên mở cửa sổ… Ma giống em, ngủ phải có quạt.", "neutral"],
          ],
          gives: { clues: ["chen-to-roi"] },
          again: [["me", "Xấp tờ rơi An Cư Land chèn cửa sổ gác, giữ cho gió lùa vô."]],
        },
        {
          id: "thi-nghiem-hen-gio",
          label: "Thí nghiệm: gạt ổ hẹn giờ sang ON",
          rect: [540, 380, 140, 60],
          needs: ["seen:attic.o-cam-hen-gio", "seen:attic.ruong-go", "flag:da-canh-ma"],
          lines: [
            ["narr", "Bây giờ là 0h20. Cầu dao dưới nhà vẫn tắt, công tơ vẫn niêm phong. Thám tử kêu mọi người xuống phòng khách đứng chờ, rồi đặt ngón tay lên công tắc ổ hẹn giờ."],
            ["me", "Tèo, xuống dưới coi đèn. Tui đếm tới ba. Một… hai… ba."],
            ["narr", "Gạt sang ON. Dưới nhà, bóng đèn bật sáng, chớp chớp. Tiếng khóc rấm rứt vọng ra từ bức tường. ‘Hu hu… hức… hu hu…’"],
            ["teo", "Á Á! Sếp gọi ma về được! Sếp là thầy pháp!", "shock"],
            ["narr", "Gạt về AUTO. Tách. Đèn tắt, tiếng khóc tắt. Gạt ON. Sáng, khóc. Gạt AUTO. Tắt."],
            ["nhomyt", "Ủa… ủa khoan… vậy là… Anh em ơi, mình tạm dừng live chút nha…", "nervous"],
            ["me", "Không cần cầu dao, không cần điện ngoài. Ổ hẹn giờ, bình ắc quy, một bóng đèn, một cái loa. Con ma nhà 13 tốn tổng cộng chừng hai triệu đồng."],
          ],
          gives: { clues: ["tai-hien-ma"] },
          again: [["teo", "Sếp cho em gạt một lần được không? Em muốn làm thầy pháp một lần trong đời.", "happy"]],
        },
        {
          id: "thi-nghiem-cua-so",
          label: "Thí nghiệm: đóng cửa sổ gác",
          rect: [700, 190, 160, 50],
          needs: ["seen:attic.cua-so-gac", "seen:hauntedhouse.ghe-dua", "seen:attic.thi-nghiem-hen-gio"],
          lines: [
            ["narr", "Còn một hiện tượng nữa: chiếc ghế đưa tự đưa. Thám tử rút xấp tờ rơi ra, đóng cửa sổ gác lại, rồi đi xuống phòng khách."],
            ["narr", "Một phút. Hai phút. Chiếc ghế đưa chậm dần… chậm dần… rồi đứng im."],
            ["me", "Tèo, lên mở cửa sổ ra."],
            ["narr", "Cửa sổ vừa mở, luồng gió từ mái tôn lùa thẳng xuống lỗ cầu thang. Chiếc ghế mây nhẹ hều lại bắt đầu đưa. Kẽo kẹt. Kẽo kẹt."],
            ["teo", "Ghế đưa vì [[gio-lua|gió lùa]]! Không phải có người vô hình ngồi! Em tưởng bà Hai ngồi đó, em còn định xin phép bả!", "shock"],
            ["me", "Người chèn cửa sổ để giải nhiệt cho bình ắc quy, đã vô tình tạo thêm con ma thứ ba."],
          ],
          gives: { clues: ["gio-lua-ghe"] },
          again: [["teo", "Đóng thì im, mở thì đưa. Em thí nghiệm năm lần rồi, lần nào cũng vậy. Em là nhà khoa học.", "smug"]],
        },
      ],
    },

    realestate: {
      name: "Văn phòng An Cư Land",
      scene: "realestate",
      start: true,
      intro: [
        ["narr", "Văn phòng nhà đất An Cư Land ở đầu chợ, còn sáng đèn dù đã khuya. Tường dán đầy ảnh anh Quân bắt tay khách, ai cũng cầm chìa khoá cười tươi. Máy lạnh chạy vù vù."],
        ["quan", "Mời thám tử vô! Văn phòng tui làm ăn minh bạch, cái gì cũng để công khai. Coi thoải mái! Tui ra ngoài nghe điện thoại chút nha.", "happy"],
        ["teo", "Văn phòng mát quá sếp. Em xin ở đây, khỏi về nhà ma nữa.", "happy"],
      ],
      hotspots: [
        {
          id: "bang-rao-ban",
          label: "Bảng rao bán",
          rect: [600, 60, 300, 200],
          lines: [
            ["narr", "Bảng rao bán to đùng, chữ đỏ: ‘NHÀ CUỐI HẺM 47 – GIÁ SỐC – BÁN GẤP’. Bên dưới là ảnh bốn căn: số 9, số 11, số 13, số 15."],
            ["me", "Nhà 9 và 15 dán chữ ‘ĐÃ BÁN’. Nhà 11 của chị Thơ: ‘Sắp ký’. Nhà 13: ‘Đang thương lượng’. Giá ghi 1,9 tỷ một căn, thấp hơn giá cũ gần một nửa."],
            ["me", "Góc bảng: ‘Liên hệ anh Quân: 0909 456 [[313]]’."],
            ["teo", "Số điện thoại đẹp ghê. 313. Giống số nhà ma… ủa?", "neutral"],
          ],
          gives: { clues: ["bang-rao-ban"] },
          again: [["me", "Bốn căn cuối hẻm. Liên hệ anh Quân, 0909 456 313."]],
        },
        {
          id: "ban-do-quy-hoach",
          label: "Bản đồ quy hoạch",
          rect: [80, 60, 300, 220],
          lines: [
            ["narr", "Bản đồ quy hoạch khổ lớn trải trên giá, đè bằng cái chặn giấy hình con cóc ngậm tiền."],
            ["me", "Góc bản đồ ghi ‘DỰ THẢO – Mở rộng đường Chợ Lớn lên 30m – dự kiến công bố tháng 12’. Theo dự thảo, [[cuoi-hem|cuối hẻm 47]] sẽ thành mặt tiền đường lớn."],
            ["me", "Bốn ô nhà số 9, 11, 13, 15 được khoanh bút đỏ. Bên cạnh ghi tay: ‘Gom đủ 4 căn trước tháng 12. Mua dưới 2 tỷ. Bán lại sau quy hoạch: 8–10 tỷ/căn’."],
            ["teo", "Mua hai tỷ, bán mười tỷ! Sếp, nghề này lời hơn bán chè nhiều!", "shock"],
          ],
          gives: { clues: ["ban-do-khoanh"] },
          again: [["me", "Cuối hẻm 47 sắp thành mặt tiền. Bốn căn khoanh đỏ: ‘mua dưới 2 tỷ’."]],
        },
        {
          id: "tu-ho-so",
          label: "Tủ hồ sơ",
          rect: [420, 180, 160, 260],
          lines: [
            ["narr", "Tủ hồ sơ sắt, ngăn trên không khoá, nhãn ghi ‘HẺM 47 – CUỐI’. Bên trong là mấy bản hợp đồng đặt cọc."],
            ["me", "Nhà số 9: ký 10/10, giá 1,9 tỷ. Nhà số 15: ký 20/10, giá 1,85 tỷ. Nhà số 11: để trống, hẹn ký thứ Hai. Bên mua cả ba bản đều là ‘Công ty TNHH [[lac-nghiep|Lạc Nghiệp]]’."],
            ["me", "Ô người đại diện bên mua: ‘Giám đốc: Trần Minh Quân’. Chữ ký y như chữ ký trên danh thiếp anh Quân."],
            ["teo", "Ủa, anh Quân vừa môi giới bán, vừa là người mua? Ảnh tự bán cho ảnh hả sếp?", "shock"],
          ],
          gives: { clues: ["hop-dong-dat-coc"] },
          again: [["me", "Bên mua cả ba căn: Cty Lạc Nghiệp, giám đốc Trần Minh Quân."]],
        },
        {
          id: "ban-moi-gioi",
          label: "Bàn môi giới",
          rect: [300, 300, 260, 140],
          lines: [
            ["narr", "Bàn làm việc của anh Quân: laptop, hộp danh thiếp, ly cà phê nguội, và một cuốn sổ lịch bìa da."],
            ["me", "Lật sổ lịch: từ 06/10, cứ mỗi thứ Hai và thứ Năm đều ghi cùng một dòng: ‘[[6h-sang|6h sáng]]: dẫn khách xem nhà 13’."],
            ["me", "Ô ngày 02/10 ghi: ‘Điện máy Bảy Phát – lấy hàng – giao thẳng nhà 13’."],
            ["teo", "Dẫn khách xem nhà ma lúc 6 giờ sáng, tuần hai lần, bảy tuần liền. Khách nào mà siêng vậy sếp?", "neutral"],
          ],
          gives: { clues: ["lich-hen-quan"] },
          again: [["me", "Thứ Hai, thứ Năm, 6h sáng: ‘dẫn khách xem nhà 13’. Đều như vắt chanh."]],
        },
        {
          id: "thung-qua-tang",
          label: "Thùng quà tặng",
          rect: [40, 360, 180, 140],
          needs: "clue:loa-qua-tang",
          lines: [
            ["narr", "Góc phòng có một thùng các-tông dán nhãn ‘QUÀ TẶNG KHÁCH HÀNG – AN CƯ LAND’. Bên trong xếp loa bluetooth chống nước, mỗi cái nằm trong một ô mút."],
            ["me", "Thùng mười hai ô. Mười một cái loa. Một ô trống. Đáy mỗi cái loa đều dán tem bạc ‘QUÀ TẶNG KHÁCH HÀNG – AN CƯ LAND – Lô 2026’."],
            ["me", "Y hệt cái loa giấu trên gác nhà 13."],
            ["teo", "Ô trống… cái loa đó đi lạc lên gác nhà ma, rồi ở lại khóc mỗi đêm…", "nervous"],
          ],
          gives: { clues: ["thung-qua-tang"] },
          again: [["me", "Mười hai ô, mười một loa. Cái thứ mười hai đang ở trên gác nhà 13."]],
        },
        {
          id: "moc-chia",
          label: "Móc chìa khoá",
          rect: [820, 300, 110, 130],
          needs: "stmt:quan-tra-chia",
          lines: [
            ["narr", "Sau quầy có cái bảng gỗ treo chìa khoá các căn đang môi giới, mỗi chùm một thẻ nhựa."],
            ["me", "Chùm thứ ba, thẻ ghi ‘[[chia-khoa|NHÀ 13 – bản chính]]’. Chìa còn dính một vệt bột trắng xanh, loại bột đóng ở cọc bình ắc quy."],
            ["teo", "Anh Quân nói trả chìa cho ông Hai rồi mà? Chìa nhà 13 tự bay về đây hả?", "shock"],
          ],
          gives: { clues: ["chia-khoa-13"] },
          again: [["me", "Chìa nhà 13, bản chính, dính bột cọc ắc quy. Vẫn nằm trong văn phòng anh Quân."]],
        },
      ],
    },
  },

  clues: {
    "bong-den-moi": {
      name: "Bóng đèn mới, dây trắng mới",
      desc: "Bóng đèn còn dán tem giá 35.000đ, nối bằng một sợi dây trắng mới chạy lên lỗ trần, lên [[gac-xep|gác xép]]. Dây điện cũ của nhà đã đứt.",
    },
    "cong-to-cat": {
      name: "Công tơ niêm phong",
      desc: "Cầu dao ở nấc OFF, gạt lên cũng không có gì. Công tơ dán niêm phong ‘Ngưng cấp điện – 03/2023’. Nhà số 13 [[cong-to|cắt điện]] từ ngoài cột.",
    },
    "hien-tuong-23h": {
      name: "Biên bản canh ma",
      desc: "Cầu dao vẫn tắt. [[23h]] đúng: đèn chớp, tường khóc. Tiếng khóc 40 giây lặp lại y chang. 23h13 tắt cùng lúc. Đạt Săn Ma đã đứng chờ quay từ 22h58.",
    },
    "ong-tuong": {
      name: "Ống tôn trong tường",
      desc: "[[ong-tuong|Ống tôn thoát nước mưa]] đời cũ bị xây lấp trong bức tường ẩm, thẳng đứng, đầu trên ở gác xép. Tiếng trên gác thả xuống ống thì cả bức tường vọng ra.",
    },
    "ve-xe-onghai": {
      name: "Vé xe dưới gối ghế đưa",
      desc: "Vé xe khách ‘Bến Tre – Sài Gòn, 21h00, ngày 14/10’, giấy còn mới, nhét dưới gối ghế đưa mây.",
    },
    "o-meo-con": {
      name: "Ổ mèo con dưới gầm ghế",
      desc: "Thùng các-tông lót khăn, một mèo mẹ với ba mèo con. Chén nhựa ghi bút lông ‘TI’. Mèo con kêu ban ngày nghe như con nít khóc.",
    },
    "vet-bac-ha-guong": {
      name: "Vết xanh trên gương",
      desc: "Giọt khô màu xanh lá, dính tay, thơm [[bac-ha|siro bạc hà]], lấm tấm trên tấm gương nứt, toàn ở ngang tầm một mét.",
    },
    "nhang-tu-se": {
      name: "Nhang trầm se tay trên bàn thờ",
      desc: "Ba bốn chục chân [[nhang|nhang trầm se tay, chân sơn đỏ]], cây mới nhất cháy tối nay. Kèm lời vọng cổ ‘Tình Anh Bán Chiếu’ chép tay: ‘Ca cho bà Hai nghe, tối nào cũng [[21h]]’.",
    },
    "day-dien-moi": {
      name: "Dây điện mới trên gác",
      desc: "Dây trắng đóng đinh kẹp cẩn thận theo xà gỗ. Một nhánh xuống bóng đèn, một nhánh ra sau tấm ván góc tường. Cả hai cắm chung một [[o-cam|ổ cắm]].",
    },
    "o-cam-hen-gio": {
      name: "Ổ cắm hẹn giờ",
      desc: "[[o-cam|Ổ cắm hẹn giờ]] loại cơ. Chốt bật 23:00, chốt cuối bẻ cong để ngắt lúc 23:13. Công tắc AUTO / ON.",
    },
    "ac-quy-kich-dien": {
      name: "Ắc quy và kích điện trong rương",
      desc: "Bình [[ac-quy|ắc quy]] 12V nối kích điện ra ổ hẹn giờ, chạy được ba bốn đêm thì phải sạc. Tem: ‘Điện máy Bảy Phát – giao [[02-10|02/10]] – tới Nhà số 13 hẻm 47 – SĐT người nhận 0909 456 [[313]]’.",
    },
    "loa-qua-tang": {
      name: "Loa giấu trên miệng ống tôn",
      desc: "[[loa|Loa bluetooth]] chống nước, cắm ổ hẹn giờ, áp ngay miệng ống tôn. Thẻ nhớ có một file ‘khoc_ban3_ronhon.mp3’ dài 40 giây. Đáy dán tem ‘Quà tặng khách hàng – [[an-cu-land|An Cư Land]] – Lô 2026’.",
    },
    "chen-to-roi": {
      name: "Xấp tờ rơi chèn cửa sổ gác",
      desc: "Cửa sổ gác được chèn mở bằng xấp [[to-roi|tờ rơi]] mới in ‘An Cư Land – thu mua nhà nhanh – liên hệ anh Quân’. Gió lùa giữ cho kích điện khỏi nóng.",
    },
    "tai-hien-ma": {
      name: "Thí nghiệm: gọi ma bằng một ngón tay",
      desc: "Cầu dao vẫn tắt, gạt [[o-cam|ổ hẹn giờ]] sang ON: đèn chớp, tường khóc y hệt lúc [[23h]]. Gạt về AUTO: tắt hết. Ma chạy bằng [[ac-quy|ắc quy]] và hẹn giờ, không cần ai có mặt.",
    },
    "gio-lua-ghe": {
      name: "Thí nghiệm: ghế đưa và cửa sổ",
      desc: "Rút xấp tờ rơi, đóng cửa sổ gác: ghế đưa đứng im. Mở ra: ghế đưa lại. Ghế tự đưa là do [[gio-lua|gió lùa]] từ cửa sổ gác xuống lỗ cầu thang.",
    },
    "bang-rao-ban": {
      name: "Bảng rao bán nhà cuối hẻm",
      desc: "Bốn căn số 9, 11, 13, 15 giá ‘sốc’ 1,9 tỷ. Nhà 9 và 15 đã bán, nhà 11 sắp ký. ‘Liên hệ anh Quân: 0909 456 [[313]]’.",
    },
    "ban-do-khoanh": {
      name: "Bản đồ quy hoạch khoanh đỏ",
      desc: "Dự thảo mở rộng đường, công bố dự kiến tháng 12: [[cuoi-hem|cuối hẻm 47]] thành mặt tiền. Nhà 9, 11, 13, 15 khoanh đỏ: ‘Gom đủ 4 căn trước tháng 12. Mua dưới 2 tỷ. Bán lại 8–10 tỷ’.",
    },
    "hop-dong-dat-coc": {
      name: "Hợp đồng đặt cọc nhà cuối hẻm",
      desc: "Nhà 9 (10/10) và 15 (20/10) đã ký, nhà 11 chờ thứ Hai. Bên mua: Công ty TNHH [[lac-nghiep|Lạc Nghiệp]], giám đốc Trần Minh Quân.",
    },
    "lich-hen-quan": {
      name: "Sổ lịch của anh Quân",
      desc: "Từ 06/10, mỗi thứ Hai và thứ Năm: ‘[[6h-sang|6h sáng]]: dẫn khách xem nhà 13’. Ô ngày [[02-10|02/10]]: ‘Điện máy Bảy Phát – lấy hàng – giao thẳng nhà 13’.",
    },
    "thung-qua-tang": {
      name: "Thùng loa quà tặng An Cư Land",
      desc: "Thùng mười hai ô, còn mười một [[loa|loa]], trống một ô. Loa nào cũng dán tem bạc ‘Quà tặng khách hàng – [[an-cu-land|An Cư Land]] – Lô 2026’, y hệt loa trên gác nhà 13.",
    },
    "chia-khoa-13": {
      name: "Chìa khoá nhà 13 ở văn phòng",
      desc: "Trên bảng chìa khoá của An Cư Land: thẻ ‘[[chia-khoa|NHÀ 13 – bản chính]]’. Chìa dính vệt bột trắng xanh của cọc bình ắc quy.",
    },
    "clip-san-ma": {
      name: "Clip đầu tiên của Săn Ma TV",
      desc: "Clip ‘ĐÊM ĐẦU TIÊN NHÀ 13 CÓ MA!!!’ đăng lúc 23h41 ngày [[05-10|05/10]], quay từ 22h55, máy đã dựng sẵn chĩa vô bóng đèn.",
    },
    "chuyen-khoan-dat": {
      name: "Chuyển khoản cho Săn Ma TV",
      desc: "Ứng dụng ngân hàng của Đạt: ‘04/10 – Nhận 5.000.000đ từ CTY TNHH [[lac-nghiep|LAC NGHIEP]] – ND: hop tac truyen thong nha 13 – quay dung 23h’.",
    },
  },

  words: {
    // ai
    quan: { text: "anh Quân", kind: "ai" },
    bado: { text: "bà Diệu", kind: "ai" },
    nhomyt: { text: "Đạt Săn Ma", kind: "ai" },
    onghai: { text: "ông Hai", kind: "ai" },
    beti: { text: "Bé Ti", kind: "ai" },
    // lúc
    "23h": { text: "23h", kind: "luc" },
    "21h": { text: "21h", kind: "luc" },
    "6h-sang": { text: "6h sáng thứ Hai, thứ Năm", kind: "luc" },
    "05-10": { text: "đêm 05/10", kind: "luc" },
    "02-10": { text: "ngày 02/10", kind: "luc" },
    // vật
    "o-cam": { text: "ổ cắm hẹn giờ", kind: "vat" },
    "ac-quy": { text: "bình ắc quy", kind: "vat" },
    loa: { text: "loa bluetooth", kind: "vat" },
    nhang: { text: "nhang trầm se tay", kind: "vat" },
    "to-roi": { text: "tờ rơi An Cư Land", kind: "vat" },
    "chia-khoa": { text: "chìa khoá nhà 13", kind: "vat" },
    "bac-ha": { text: "siro bạc hà", kind: "vat" },
    "ve-xe": { text: "vé xe khách", kind: "vat" },
    "cong-to": { text: "công tơ cắt điện", kind: "vat" },
    // nơi
    "gac-xep": { text: "gác xép", kind: "o" },
    "ong-tuong": { text: "ống tôn trong tường", kind: "o" },
    "cuoi-hem": { text: "cuối hẻm 47", kind: "o" },
    "ban-tho": { text: "bàn thờ cũ", kind: "o" },
    // cách
    "gio-lua": { text: "gió lùa từ cửa sổ gác", kind: "cach" },
    "ma-ngoi": { text: "có người vô hình ngồi", kind: "cach" },
    "be-ti-dua": { text: "Bé Ti đẩy ghế", kind: "cach" },
    // vì
    "ep-gia": { text: "ép giá mua rẻ", kind: "vi" },
    "kiem-tien-cung": { text: "kiếm tiền cúng", kind: "vi" },
    "giu-nha": { text: "giữ nhà khỏi bị bán", kind: "vi" },
    "giau-meo": { text: "giấu ổ mèo con", kind: "vi" },
    "quay-clip": { text: "nhận tiền quay clip", kind: "vi" },
    "nho-vo": { text: "nhớ bà Hai", kind: "vi" },
    // khác
    "313": { text: "SĐT đuôi 313", kind: "khac" },
    "an-cu-land": { text: "An Cư Land", kind: "khac" },
    "lac-nghiep": { text: "Cty Lạc Nghiệp", kind: "khac" },
    "san-ma-tv": { text: "Săn Ma TV", kind: "khac" },
  },

  talks: {
    quan: [
      {
        id: "gioi-thieu",
        topic: "Anh làm gì ở cuối hẻm này?",
        lines: [
          ["quan", "Tui giúp bà con thôi thám tử! Nhà ma thì ai dám ở? Mà để lâu càng mất giá. Tui tìm được người mua, bà con thoát nạn, ai cũng vui. Tui là người tốt mà, cười nhiều là người tốt!", "happy"],
          ["quan", "Tui làm cho [[an-cu-land|An Cư Land]] tám năm rồi. ‘An cư thì lạc nghiệp’. Câu đó tui in trên danh thiếp nè, thám tử cầm một cái. Tèo cầm một cái. Thôi cầm hai cái.", "happy"],
          ["teo", "Danh thiếp thơm ghê sếp. Có mùi nước hoa.", "happy"],
        ],
        gives: { words: ["quan"] },
      },
      {
        id: "chia-khoa",
        topic: "Chìa khoá nhà 13 ai giữ?",
        lines: [
          ["quan", "Hồi tháng 9 con trai ông Hai ký hợp đồng môi giới, có đưa tui chìa. Mà từ hồi có ma, đầu tháng 10 tui trả chìa cho ông Hai liền. Tui sợ ma lắm thám tử ơi!", "nervous"],
          ["quan", "Từ đó tới giờ tui không bước vô cái nhà đó nửa bước. Có dẫn khách thì đứng ngoài cổng chỉ chỉ thôi.", "smug"],
        ],
        gives: { stmts: ["quan-tra-chia"] },
      },
      {
        id: "dat",
        topic: "Anh có quen Đạt Săn Ma TV không?",
        lines: [
          ["quan", "Cậu đội đèn đó hả? Không quen. Tui cũng coi clip như bà con thôi. Mà công nhận cậu đó quay rợn thiệt, coi xong tui ba đêm không dám tắt đèn.", "smug"],
          ["quan", "Mà nói thiệt, nhờ cậu đó mà bà con mới biết có ma, mới chịu bán sớm. Ờ, ý tui là… mới được an toàn sớm.", "nervous"],
        ],
        gives: { stmts: ["quan-khong-quen-dat"] },
      },
      {
        id: "nghi-ai",
        topic: "Theo anh, ai dựng ra con ma này?",
        lines: [
          ["quan", "Tui nói nhỏ nha thám tử. Ông Hai đó. Ổng không muốn bán, mà con trai ổng ký rồi. Ổng làm ma để [[giu-nha|giữ nhà khỏi bị bán]], khách sợ không ai dám mua!", "smug"],
          ["teo", "Mà nhà có ma thì con ổng càng muốn bán lẹ chớ anh?", "neutral"],
          ["quan", "Ờ… thì… Vậy là bà Diệu! Bả cúng ba lần mà ma không đi, kỳ không? Ma còn thì bả còn mối cúng!", "nervous"],
          ["me", "Anh đổi nghi phạm nhanh hơn đổi giá nhà."],
        ],
      },
      {
        id: "dien",
        topic: "Anh có rành điện đóm không?",
        needs: "clue:o-cam-hen-gio",
        lines: [
          ["quan", "Điện hả? Trời, tui dân kinh doanh, cầm cái tua vít còn cầm ngược. Bóng đèn nhà tui cháy là tui gọi thợ. Ổ cắm hẹn giờ là cái gì tui còn không biết!", "happy"],
          ["teo", "Anh cười nhiều quá, em thấy hơi sợ.", "nervous"],
        ],
        gives: { stmts: ["quan-mu-dien"] },
      },
      {
        id: "quy-hoach",
        topic: "Bản đồ quy hoạch khoanh đỏ trong văn phòng anh",
        needs: "clue:ban-do-khoanh",
        lines: [
          ["quan", "À, cái đó dự thảo thôi! Dự thảo thì mười cái chín cái không thành. Tui khoanh chơi cho vui, nghề tui phải coi bản đồ mà.", "nervous"],
          ["quan", "Mà nếu có thành thật, thì bà con bán cho tui… ờ, cho bên mua, cũng là bán được giá lúc đó rồi. Đâu ai biết trước tương lai, đúng không thám tử?", "smug"],
          ["me", "Có người biết trước. Người đó khoanh bút đỏ."],
        ],
      },
      {
        id: "thu-hai-nam",
        topic: "6 giờ sáng thứ Hai, thứ Năm anh làm gì ở nhà 13?",
        needs: ["broke:quan-tra-chia", "clue:lich-hen-quan"],
        lines: [
          ["quan", "Thì… dẫn khách! Khách mua nhà hay đi sớm, tránh kẹt xe. Khách người ta… người ta tập thể dục buổi sáng rồi ghé coi nhà.", "nervous"],
          ["me", "Bảy tuần, mười bốn buổi, đúng 6 giờ sáng, xem một căn nhà ma không ai mua. Khách đó tên gì?"],
          ["quan", "Khách… khách bí mật. Bảo mật thông tin khách hàng! Nghề tui phải vậy!", "angry"],
        ],
      },
    ],

    bado: [
      {
        id: "cung",
        topic: "Bà đã cúng nhà 13 chưa?",
        lines: [
          ["bado", "Cúng một lần, ban ngày, hồi đầu tháng 10. Anh Quân nhờ, nói cho bà con yên tâm. Cúng xong là tui về, không quay lại nữa.", "neutral"],
          ["bado", "Nhà người ta có người mất, mình tới cúng là phải lễ. Còn tối khuya thì tui ở nhà tụng kinh, đi đâu nữa.", "neutral"],
          ["teo", "Bà ơi, bà có sợ ma không bà?", "nervous"],
          ["bado", "Con ơi, người sống còn làm bà sợ hơn.", "smug"],
        ],
        gives: { stmts: ["bado-mot-lan"], words: ["bado"] },
      },
      {
        id: "ma-la",
        topic: "Bà thấy con ma này thế nào?",
        lines: [
          ["bado", "Lạ lắm. Bà con mời tui cúng nhà 9, nhà 15, rồi nhà 13. Ba lần. Mà ma không đi.", "nervous"],
          ["bado", "Bốn chục năm làm nghề, tui chưa thấy ‘ma’ nào khóc đúng giờ, tắt đúng phút. Người khuất không có xem đồng hồ đâu thám tử. Người sống mới xem đồng hồ.", "neutral"],
          ["me", "Bà nói câu hay nhất tối nay."],
        ],
      },
      {
        id: "tien-cung",
        topic: "Có người nói bà với anh Quân chia nhau tiền cúng?",
        lines: [
          ["bado", "Ai nói vậy? Anh Quân giới thiệu khách cho tui thiệt, ba nhà. Người ta đưa phong bì [[kiem-tien-cung|tiền cúng]], tui nhận.", "angry"],
          ["bado", "Mà cúng xong ma không đi, tui đem trả lại hết. Cúng không được việc thì lấy tiền người ta làm gì? Tui làm nghề chớ không làm ăn.", "angry"],
          ["teo", "Bà trả lại tiền… Bà là thầy cúng có chính sách hoàn tiền đầu tiên em gặp.", "shock"],
        ],
      },
      {
        id: "ba-hai",
        topic: "Bà Hai là người thế nào?",
        needs: "broke:bado-mot-lan",
        lines: [
          ["bado", "Bả với tui hồi trẻ hát chung gánh hát. Bả ca đào chánh, tui ca đào phụ. Bả cười nhiều lắm, ca vọng cổ mà cả rạp cười theo.", "happy"],
          ["bado", "Tối nào tui ca xong bài, đi về chừng 21h30. Có bữa tui đi trễ, nghe tới cái tiếng ‘khóc’ lúc 23h đó. Tui nghe là biết liền: không phải bả. Bả không bao giờ khóc lặp đi lặp lại một câu như cái máy.", "neutral"],
          ["bado", "Có một bữa sáng sớm tui đi chùa ngang qua, thấy anh Quân ôm cái hộp nặng trịch từ trong nhà 13 bước ra. Tui tưởng ảnh dọn đồ cho khách.", "nervous"],
        ],
      },
    ],

    nhomyt: [
      {
        id: "kenh",
        topic: "Kênh Săn Ma TV của anh",
        lines: [
          ["nhomyt", "Kênh [[san-ma-tv|Săn Ma TV]], 80 nghìn anh em! Tui đi săn ma ba năm rồi. Nhà hoang, bệnh viện bỏ, nghĩa địa… à không, nghĩa địa thì không, tui tôn trọng.", "smug"],
          ["teo", "Anh săn ma ba năm, anh gặp ma bao nhiêu con rồi?", "neutral"],
          ["nhomyt", "Nói nhỏ nha… chưa con nào. Mà tui sợ ma lắm. Mỗi lần la ‘Á Á Á’ là la thật đó. Anh em thích coi tui sợ.", "nervous"],
        ],
        gives: { words: ["nhomyt"] },
      },
      {
        id: "dem-dau",
        topic: "Anh tới quay nhà 13 từ khi nào?",
        lines: [
          ["nhomyt", "Tui đọc nhóm Hẻm 47 Hóng Biến thấy bà con đồn có ma, mới mò tới quay. Hoàn toàn tình cờ, tự phát, không ai nhờ!", "smug"],
          ["nhomyt", "Từ đó tối nào tui cũng ra canh. Mà lạ ghê, tối nào ma cũng 23h đúng, tui đỡ phải chờ.", "happy"],
        ],
        gives: { stmts: ["dat-tinh-co"] },
      },
      {
        id: "clip",
        topic: "Cho coi clip nhà 13 đầu tiên",
        lines: [
          ["nhomyt", "Đây nè, tập 1, clip gốc! Một triệu hai view! Coi đi coi đi!", "happy"],
          ["narr", "Tiêu đề: ‘ĐÊM ĐẦU TIÊN NHÀ 13 CÓ MA!!! (KHÔNG CHE)’. Đăng 23h41, ngày 05/10. Góc hình hiện giờ quay: 22h55. Máy dựng trên chân, chĩa sẵn vô bóng đèn."],
          ["teo", "Đêm đầu tiên… mà anh đã ra canh từ 22h55?", "neutral"],
          ["nhomyt", "Ờ… thì… linh cảm nghề nghiệp! Thợ săn ma phải có giác quan thứ sáu!", "nervous"],
        ],
        gives: { clues: ["clip-san-ma"] },
      },
      {
        id: "ai-tra",
        topic: "Ai trả tiền cho anh quay nhà 13?",
        needs: "broke:dat-tinh-co",
        lines: [
          ["nhomyt", "Ổng nhắn tui ngày 3/10: ‘Có căn nhà ma xịn, đêm 5/10 tầm 23h ra quay, đảm bảo có hiện tượng’. Hôm sau chuyển cọc năm triệu, ghi tên công ty.", "nervous"],
          ["nhomyt", "Tui tưởng ổng là chủ nhà muốn quảng bá… nhà ma? Tui không hỏi kỹ. Năm triệu, anh hiểu không, kênh tui một tháng kiếm có ba triệu…", "nervous"],
          ["nhomyt", "Ổng còn dặn: ‘Quay xong nhớ tag nhóm Hẻm 47, để bà con cuối hẻm coi’.", "nervous"],
        ],
      },
    ],

    onghai: [
      {
        id: "nha",
        topic: "Ông kể về căn nhà số 13",
        lines: [
          ["onghai", "Nhà này tui với bả cất năm 1985. Bả trồng cây bàng trước cửa. Bả mất ba năm rồi. Tui ở một mình buồn quá, con gái rước về quê.", "nervous"],
          ["onghai", "Bả ca vọng cổ hay lắm. Tối nào cũng ngồi cái ghế đưa đó ca. Giờ người ta nói nhà tui có ma khóc. Bả mà nghe chắc bả cười.", "neutral"],
          ["teo", "Ông ơi… con xin lỗi vì nãy con la ‘ma’ to quá.", "nervous"],
        ],
        gives: { words: ["onghai"] },
      },
      {
        id: "o-que",
        topic: "Dạo này ông ở đâu?",
        lines: [
          ["onghai", "Tui ở Bến Tre với con gái. Cả năm nay không lên Sài Gòn lần nào. Lên làm chi, nhà cửa đóng cửa, bạn bè đi hết.", "neutral"],
          ["onghai", "Bữa nay thằng con trai gọi lên ký giấy bán nhà, tui mới lên. Ngồi xe đò năm tiếng, lưng muốn gãy.", "nervous"],
        ],
        gives: { stmts: ["onghai-o-que"] },
      },
      {
        id: "ban-nha",
        topic: "Ông có muốn bán nhà không?",
        lines: [
          ["onghai", "Không. Thằng con tui nói nhà ma rồi, bán lẹ còn được đồng nào hay đồng đó. Nó ký với cậu Quân hồi tháng 9. Tui không cãi được con.", "nervous"],
          ["onghai", "Chìa khoá thì cậu Quân giữ. Tui còn một chìa cũ, móc ở dây lưng mười mấy năm.", "neutral"],
          ["me", "Ông có nhận lại chìa nào từ anh Quân không?"],
          ["onghai", "Chìa nào? Cậu Quân đâu có trả gì tui.", "neutral"],
        ],
      },
      {
        id: "dem-14",
        topic: "Đêm 14/10 ông ngồi ghế đưa thấy gì?",
        needs: "broke:onghai-o-que",
        lines: [
          ["onghai", "Tui ngồi từ 22h tới gần sáng. Tới 23h đèn chớp, tường khóc. Tui mừng muốn khóc theo, tưởng bả về thăm.", "nervous"],
          ["onghai", "Mà nghe một hồi tui biết không phải bả. Cái tiếng đó khóc y một câu, hít mũi y một chỗ, lặp hoài. Bả mà về thì bả ca, không có khóc kiểu đó.", "neutral"],
          ["onghai", "Tui [[nho-vo|nhớ bả]] quá, ngồi luôn tới sáng. Gần 6 giờ có tiếng mở khoá cửa, tui hoảng, chui ra cửa sau về bến xe. Quên luôn tấm vé dưới gối.", "nervous"],
        ],
      },
    ],

    beti: [
      {
        id: "thay-ma",
        topic: "Con có thấy ma không?",
        lines: [
          ["beti", "Có! Ma ngồi ghế đưa! Con thấy cái ghế nó đưa, mà không có ai! Con nói cho cả xóm biết rồi, đứa nào cũng sợ, không đứa nào dám tới gần!", "shock"],
          ["beti", "Mà con thì không có vô cái nhà đó đâu nha. Con sợ ma lắm. Con chỉ đứng ngoài cổng thôi.", "nervous"],
        ],
        gives: { stmts: ["beti-khong-vo"], words: ["beti"] },
      },
      {
        id: "sung-nuoc",
        topic: "Súng nước của con dạo này bắn gì?",
        lines: [
          ["beti", "Bắn ma! Ủa không, bắn cây! Cây kiểng! Con tưới cây!", "nervous"],
          ["beti", "Nước con pha bạc hà cho thơm. Má nói xài siro hết sạch trong tủ lạnh rồi. Con không biết ai uống.", "nervous"],
          ["teo", "Bé Ti, chú biết con không có tưới cây.", "smug"],
        ],
      },
      {
        id: "tieng-khoc",
        topic: "Con có nghe tiếng khóc không?",
        lines: [
          ["beti", "Có. Đêm con nghe ‘hu hu, hức, hu hu’, xong hít mũi, xong lại ‘hu hu, hức’. Y chang như nhạc chuông điện thoại má con. Con nghe riết con thuộc luôn.", "neutral"],
          ["beti", "Còn ban ngày thì có tiếng khóc nhỏ nhỏ, ‘ngheo ngheo’. Cái đó… cái đó không phải ma. Mà con không nói đâu.", "nervous"],
        ],
      },
      {
        id: "meo-con",
        topic: "Mấy con mèo con dưới ghế đưa là của ai?",
        needs: "broke:beti-khong-vo",
        lines: [
          ["beti", "Của con… Mèo mẹ đẻ trong nhà ma. Má con không cho nuôi mèo, nói dị ứng. Nên con đem cơm qua cho nó mỗi chiều.", "nervous"],
          ["beti", "Con nói với tụi bạn là có ma ngồi ghế đưa, để tụi nó sợ, không đứa nào vô bắt mèo con của con. Con chỉ muốn [[giau-meo|giấu ổ mèo con]] thôi. Con xin lỗi…", "nervous"],
          ["beti", "Mà ghế đưa thiệt đó chú! [[be-ti-dua|Con không có đẩy ghế]]! Từ đầu tháng 10 tự nhiên nó đưa hoài.", "angry"],
        ],
      },
    ],

    chitho: [
      {
        id: "dem-dau",
        topic: "Đêm đầu tiên có ma là khi nào?",
        lines: [
          ["chitho", "Đêm [[05-10|5/10]] đó anh. Em đang nấu chè cho sáng mai bán, đúng 11 giờ thì nghe tiếng khóc bên vách. Em đánh rớt nguyên nồi đậu đỏ.", "shock"],
          ["chitho", "Sáng 6/10 em kể cho bà Tư, bà Tư đăng nhóm liền. Đó là lần đầu tiên cả hẻm biết.", "nervous"],
          ["batu", "Đúng! Bài đầu tiên của bà là 7 giờ sáng 6/10! Bà nhớ vì bài đó lên tới bốn ngàn like!", "smug"],
        ],
      },
      {
        id: "ban-nha",
        topic: "Sao chị định bán nhà?",
        lines: [
          ["chitho", "Anh Quân tới nhà ba lần, đem theo trà sữa cho con em. Ảnh nói có công ty muốn mua 1,9 tỷ, để qua Tết thì nhà ma không ai thèm.", "nervous"],
          ["chitho", "Nhà 9 với nhà 15 bán rồi. Em sợ ở lại một mình giữa hai nhà trống với một nhà ma.", "nervous"],
          ["chitho", "Mà giờ nghĩ lại, mỗi lần tới ảnh đều nói ‘để lâu mất giá’, ‘tuần sau còn rớt nữa’. Nghe giống [[ep-gia|ép giá]] em hơn là giúp em.", "neutral"],
        ],
      },
      {
        id: "ba-dieu",
        topic: "Chị có thấy ai ra vô nhà 13 ban đêm không?",
        lines: [
          ["chitho", "Tối nào chừng 9 giờ em cũng nghe tiếng ai ca vọng cổ bên đó, buồn buồn, hay lắm. Em không dám nói ai, sợ người ta nói em nghe ma ca.", "nervous"],
          ["chitho", "Mà tiếng ca 9 giờ khác hẳn tiếng khóc 11 giờ nha anh. Tiếng ca thì có hồn. Tiếng khóc thì… nghe như cái máy.", "neutral"],
        ],
      },
    ],
  },

  stmts: {
    "quan-tra-chia": {
      by: "quan",
      text: "Đầu tháng 10 tui trả chìa khoá nhà 13 cho ông Hai rồi, từ đó tui không bước vô nửa bước.",
      break: {
        clue: "chia-khoa-13",
        lines: [
          ["me", "Bảng chìa khoá trong văn phòng anh: ‘NHÀ 13 – bản chính’. Còn ông Hai nói anh chưa trả gì hết. Mà cái chìa này dính bột cọc ắc quy."],
          ["quan", "À… à! Đó là… bản sao! Tui làm bản sao để… để kỷ niệm!", "nervous"],
          ["me", "Thẻ ghi ‘bản chính’, anh Quân."],
          ["quan", "Thì… tui quên trả! Bận quá quên! Người bận rộn hay quên mà!", "angry"],
          ["teo", "Quên trả chìa mà nhớ chà bột ắc quy lên chìa. Anh bận kiểu gì kỳ vậy?", "smug"],
        ],
      },
    },
    "quan-mu-dien": {
      by: "quan",
      text: "Tui mù điện đóm, cầm tua vít còn cầm ngược, ổ cắm hẹn giờ là gì tui không biết.",
      break: {
        clue: "ac-quy-kich-dien",
        lines: [
          ["me", "Tem giao hàng trên bình ắc quy trong rương gỗ: ‘Ắc quy 12V + kích điện 500W – giao ngày 02/10 tới Nhà số 13 – SĐT người nhận 0909 456 313’. Số đó ghi trên bảng rao bán của anh."],
          ["quan", "Số… số tui đó, nhưng… nhưng người ta mượn số tui! Khách mượn số tui đặt hàng!", "shock"],
          ["me", "Khách mượn số anh, đặt ắc quy, giao tới đúng căn nhà anh đang giữ chìa, ba ngày trước đêm ma đầu tiên."],
          ["quan", "…Trùng hợp. Đời có nhiều trùng hợp lắm thám tử. Hehe.", "nervous"],
        ],
      },
    },
    "quan-khong-quen-dat": {
      by: "quan",
      text: "Tui không quen cậu Đạt Săn Ma, chỉ coi clip như bà con.",
      break: {
        clue: "chuyen-khoan-dat",
        lines: [
          ["me", "Ngày 04/10, Công ty Lạc Nghiệp chuyển cho Đạt năm triệu, nội dung ‘hợp tác truyền thông nhà 13 – quay đúng 23h’. Giám đốc Lạc Nghiệp, theo hợp đồng đặt cọc, là Trần Minh Quân."],
          ["quan", "Lạc Nghiệp… là công ty của… của tui. Nhưng chuyển khoản đó là… tài trợ! Tài trợ nghệ thuật! Tui ủng hộ người trẻ làm nội dung!", "shock"],
          ["nhomyt", "Anh Quân ơi, anh dặn em quay đúng 23h đó. Em còn giữ tin nhắn.", "nervous"],
          ["quan", "…", "nervous"],
        ],
      },
    },
    "dat-tinh-co": {
      by: "nhomyt",
      text: "Tui đọc nhóm Hóng Biến thấy bà con đồn có ma mới tới quay, hoàn toàn tình cờ, không ai nhờ.",
      break: {
        clue: "clip-san-ma",
        lines: [
          ["me", "Clip ‘ĐÊM ĐẦU TIÊN’ của anh đăng 23h41 ngày 5/10, máy dựng sẵn từ 22h55. Còn bài đầu tiên của bà Tư về ma nhà 13 là 7 giờ sáng 6/10. Anh ra canh ma trước khi có ai đồn."],
          ["me", "Và anh biết đó là ‘đêm đầu tiên’. Ma chưa từng xuất hiện, sao anh biết nó sắp xuất hiện lần đầu?"],
          ["nhomyt", "…Tui… tui không biết là giả! Tui thề! Có người nhắn tui đêm đó ra quay, hứa ‘đảm bảo có hiện tượng’, chuyển trước năm triệu!", "shock"],
          ["nhomyt", "Đây, anh coi giùm, ứng dụng ngân hàng của tui…", "nervous"],
          ["teo", "Săn Ma TV… hoá ra là Được Thuê Săn Ma TV.", "smug"],
        ],
        gives: { clues: ["chuyen-khoan-dat"], words: ["quay-clip"] },
      },
    },
    "bado-mot-lan": {
      by: "bado",
      text: "Tui cúng nhà 13 đúng một lần ban ngày, rồi không quay lại nữa.",
      break: {
        clue: "nhang-tu-se",
        lines: [
          ["me", "Lư hương trên bàn thờ cũ có ba bốn chục chân nhang trầm se tay, chân sơn đỏ. Cả hẻm chỉ bà se nhang kiểu này. Cây mới nhất cháy tối nay. Kèm tờ vọng cổ: ‘Ca cho bà Hai nghe, tối nào cũng 21h’."],
          ["bado", "…Thôi được. Tối nào tui cũng vô. 9 giờ tối, thắp cây nhang, ca một bài cho bả nghe.", "nervous"],
          ["bado", "Ông Hai trước khi về quê có dặn: ‘Bà Diệu ơi, bả thích nghe ca, bà ghé ca cho bả nghe giùm tui’. Tui hứa rồi. Ba năm nay, tối nào cũng vậy.", "nervous"],
          ["bado", "Tui giấu là vì… thầy cúng gì mà nửa đêm ngồi ca vọng cổ trong nhà hoang, người ta cười. Rồi người ta nói tui nuôi ma kiếm mối.", "nervous"],
          ["teo", "Bà ơi… tiếng ca lúc 9 giờ mà chị Thơ nghe là bà đó hả? Chị Thơ nói hay lắm.", "happy"],
        ],
      },
    },
    "onghai-o-que": {
      by: "onghai",
      text: "Cả năm nay tui ở Bến Tre, không lên Sài Gòn lần nào.",
      break: {
        clue: "ve-xe-onghai",
        lines: [
          ["me", "Vé xe khách Bến Tre – Sài Gòn, 21h ngày 14/10, nằm dưới gối ghế đưa. Giấy còn mới."],
          ["onghai", "…Tui có lên. Một lần. Nghe người ta nói nhà có ma khóc, tui… tui tưởng bả về.", "nervous"],
          ["onghai", "Tui không nói với tụi nhỏ. Tụi nó mà biết ông già bảy mươi lăm tuổi đi xe đò đêm lên ngồi chờ ma, tụi nó nói tui lẩm cẩm, đem tui đi khám.", "nervous"],
          ["teo", "Ông ơi… con không thấy ông lẩm cẩm. Con thấy ông thương bà.", "nervous"],
        ],
      },
    },
    "beti-khong-vo": {
      by: "beti",
      text: "Con sợ ma, con không bao giờ vô nhà đó, chỉ đứng ngoài cổng.",
      break: {
        clue: "vet-bac-ha-guong",
        lines: [
          ["me", "Trên tấm gương nứt trong phòng khách có giọt siro bạc hà xanh lá, ngang tầm một mét. Đạn súng nước của con."],
          ["beti", "…Tại con vô thấy trong gương có con ma! Con bắn nó ‘chíu chíu’! Xong con thấy… nó mặc áo giống con.", "nervous"],
          ["teo", "Bé Ti bắn cái bóng của chính mình trong gương. Lần đầu tiên chú thấy có người đấu súng với chính mình.", "smug"],
          ["beti", "Chú Tèo đừng kể ai! Con ngại!", "angry"],
        ],
      },
    },
  },

  present: {
    quan: {
      "tai-hien-ma": [["quan", "Trời, thám tử giỏi ghê! Ma giả hả? Vậy… vậy là tốt quá rồi! Bà con yên tâm! Mà… nhà thì cũng đã lỡ mất giá rồi, hehe.", "nervous"]],
      "ban-do-khoanh": [["quan", "Dự thảo thôi mà! Khoanh chơi! Tui hay khoanh bản đồ lúc rảnh, giống người ta tô màu xả stress.", "nervous"]],
      "hop-dong-dat-coc": [["quan", "Công ty Lạc Nghiệp làm ăn đàng hoàng! Mua bán thuận mua vừa bán! Ai ép ai đâu!", "angry"]],
      "loa-qua-tang": [["quan", "Loa quà tặng công ty tui phát cả ngàn cái! Khách nào cũng có! Ai đem lên gác thì tui biết sao được!", "nervous"]],
      "chen-to-roi": [["quan", "Tờ rơi tui phát khắp quận! Gió bay vô cửa sổ, tự gấp tư, tự nhét dưới chân cửa. Gió… gió thời nay khéo tay.", "nervous"]],
      "o-meo-con": [["quan", "Mèo con dễ thương ghê. Mà nhà có mèo khó bán lắm, khách kỵ. Ờ, tui nói chung chung thôi.", "smug"]],
    },
    bado: {
      "hien-tuong-23h": [["bado", "Khóc lặp đi lặp lại y một câu… Đó không phải người khuất. Người khuất không có thâu băng.", "neutral"]],
      "tai-hien-ma": [["bado", "Mô Phật. Ba lần tui cúng, hoá ra tui cúng cái ổ cắm. Thôi, ổ cắm cũng là chúng sanh.", "smug"]],
      "o-meo-con": [["bado", "Mèo mẹ đó tui thấy hoài. Tối nào tui ca, nó cũng nằm nghe. Nó là khán giả duy nhất của tui.", "happy"]],
    },
    nhomyt: {
      "tai-hien-ma": [["nhomyt", "Ổ cắm hẹn giờ… Vậy ba tháng nay tui la thất thanh với một cái ổ cắm… Anh em đừng coi lại các tập cũ nha.", "nervous"]],
      "loa-qua-tang": [["nhomyt", "Bản 3, rợn hơn… Bản 1 với bản 2 tui có nghe trong tin nhắn. Ổng hỏi tui bản nào rợn nhất. Á, tui lỡ miệng!", "shock"]],
      "hien-tuong-23h": [["nhomyt", "Tui đứng sẵn từ 22h58 là tại… tại tui đúng giờ! Thợ săn ma chuyên nghiệp phải đúng giờ!", "nervous"]],
    },
    onghai: {
      "nhang-tu-se": [["onghai", "Bà Diệu vẫn ca cho bả nghe… Ba năm rồi… Bà Diệu giữ lời hơn con tui.", "nervous"]],
      "ban-do-khoanh": [["onghai", "Đường mở rộng? Vậy nhà tui mai mốt là mặt tiền? Mà cậu Quân nói nhà ma, đáng có hai tỷ…", "shock"]],
      "chia-khoa-13": [["onghai", "Chìa này của nhà tui. Cậu Quân nói trả tui hồi nào? Tui đâu có nhận.", "angry"]],
    },
    beti: {
      "o-meo-con": [["beti", "Đừng bắt mèo con của con! Tụi nó tên Ma Một, Ma Hai, Ma Ba! Con đặt tên vậy cho tụi bạn sợ!", "angry"]],
      "gio-lua-ghe": [["beti", "Vậy ghế đưa là tại gió hả? Không phải ma hả? Vậy con nói xạo với tụi bạn rồi… mà con cũng tưởng thiệt!", "shock"]],
      "hien-tuong-23h": [["beti", "Hu hu, hức, hu hu. Con nói rồi mà, y chang nhạc chuông. Con hát được luôn nè.", "smug"]],
    },
  },

  wrong: {
    quan: [
      [["quan", "Hehe, cái này hả thám tử? Không liên quan đâu. Mà thám tử có muốn mua nhà không? Đang có căn giá tốt lắm.", "happy"]],
      [["quan", "Thám tử ơi, nghề tui gặp khách ‘ép giá’ hoài. Bằng chứng kiểu này là ép giá tui đó nha!", "smug"]],
      [["quan", "Cái này đưa tui chi? Không có trong hợp đồng. Mà cái gì không có trong hợp đồng là không tính!", "angry"]],
    ],
    bado: [
      [["bado", "Mô Phật. Thám tử đưa nhầm rồi. Nhầm thì sửa, không sao. Người sống ai cũng nhầm.", "neutral"]],
      [["bado", "Cái này tui coi không ra quẻ gì hết. Thám tử coi lại đi.", "smug"]],
      [["bado", "Bốn chục năm tui thấy nhiều thứ lạ. Mà cái lý lẽ này thì lạ nhất.", "angry"]],
    ],
    nhomyt: [
      [["nhomyt", "Á Á Á! …À không, cái này không đáng sợ. Tui la theo phản xạ. Mà cũng không liên quan.", "shock"]],
      [["nhomyt", "Anh em ơi, thám tử đưa sai bằng chứng rồi nè! Bấm like nếu muốn coi tập sau!", "smug"]],
      [["nhomyt", "Cái này không chứng minh được gì. Giống như clip tui, nhìn thì rợn mà không chứng minh được gì.", "nervous"]],
    ],
    onghai: [
      [["onghai", "Cái gì đây? Mắt tui kém, mà tui thấy nó không dính gì tới tui.", "neutral"]],
      [["onghai", "Hồi bả còn sống, bả mà thấy người ta đưa đồ trật vầy, bả cười cả buổi.", "neutral"]],
      [["onghai", "Thám tử ơi, tui già rồi, đừng làm tui rối. Cái này không phải.", "nervous"]],
    ],
    beti: [
      [["beti", "Cái gì vậy? Con hông biết! Cho con cầm chơi được hông?", "happy"]],
      [["beti", "Sai rồi! Chú thám tử sai! Con bắn chú ‘chíu’ một cái nha!", "angry"]],
      [["beti", "Cái này hổng liên quan. Con đi cho mèo ăn đây. Ủa, con lỡ nói mèo.", "nervous"]],
    ],
  },

  deduction: [
    {
      id: "co-che",
      text: "Đèn chớp và tiếng khóc lúc {a} là do {b} tự bật, chạy bằng {c} vì nhà đã cắt điện.",
      blanks: {
        a: { answer: "23h", kind: "luc" },
        b: { answer: "o-cam", kind: "vat" },
        c: { answer: "ac-quy", kind: "vat" },
      },
      explain: [
        ["me", "Cầu dao tắt, công tơ niêm phong, mà 23h đèn vẫn chớp. Ổ cắm hẹn giờ chốt 23:00 tới 23:13, nối bình ắc quy qua kích điện. Thí nghiệm gạt ON giữa đêm: ma hiện ra theo lệnh."],
      ],
    },
    {
      id: "am-thanh",
      text: "Tiếng khóc phát từ {a} giấu trên gác, vọng xuống qua {b}; còn ghế đưa tự đưa là do {c}.",
      blanks: {
        a: { answer: "loa", kind: "vat" },
        b: { answer: "ong-tuong", kind: "o" },
        c: { answer: "gio-lua", kind: "cach" },
      },
      explain: [
        ["me", "Loa bluetooth phát một file 40 giây lặp lại, kẹp ngay miệng ống tôn cũ trong tường, nên cả bức tường ‘khóc’. Đóng cửa sổ gác thì ghế đứng im, mở ra thì ghế đưa: gió lùa xuống lỗ cầu thang."],
      ],
    },
    {
      id: "noi-doi",
      text: "{a} nói dối là đã trả chìa khoá, thật ra vẫn vô nhà 13 lúc {b} để thay {c}.",
      blanks: {
        a: { answer: "quan", kind: "ai" },
        b: { answer: "6h-sang", kind: "luc" },
        c: { answer: "ac-quy", kind: "vat" },
      },
      explain: [
        ["me", "Chìa ‘NHÀ 13 – bản chính’ vẫn treo trong văn phòng anh Quân, dính bột cọc ắc quy. Bình ắc quy chạy ba bốn đêm là cạn, nên thứ Hai, thứ Năm, 6h sáng, anh Quân ‘dẫn khách xem nhà 13’."],
      ],
    },
    {
      id: "dong-co",
      text: "Anh Quân dựng ma để {a} các nhà ở {b} trước khi quy hoạch công bố; còn {c} nhận tiền của {d} để quay clip.",
      blanks: {
        a: { answer: "ep-gia", kind: "vi" },
        b: { answer: "cuoi-hem", kind: "o" },
        c: { answer: "nhomyt", kind: "ai" },
        d: { answer: "lac-nghiep", kind: "khac" },
      },
      explain: [
        ["me", "Dự thảo mở rộng đường biến cuối hẻm 47 thành mặt tiền. Mua dưới 2 tỷ, bán lại 8 tới 10 tỷ. Bên mua là Cty Lạc Nghiệp của anh Quân. Cũng Lạc Nghiệp chuyển năm triệu cho Đạt, ngày 4/10, một ngày trước đêm ma đầu tiên."],
      ],
    },
  ],

  finale: {
    culprit: "quan",
    intro: [
      ["narr", "Tối thứ Bảy, 22h50. Phòng khách nhà số 13. Thám tử mời mọi người tới: chị Thơ, bà Diệu, ông Hai, Đạt, Bé Ti, anh Quân. Ngoài cổng, nửa hẻm 47 đứng chen nhau, đèn điện thoại sáng như hội hoa đăng."],
      ["batu", "Bà Tư live nha! Đêm thứ 49: thám tử bắt ma! Tim bà đập như trống trường!", "happy"],
      ["chuba", "Tui có mặt! Hôm nay tui tới sớm… để coi… 23h15. Trễ có mười lăm phút. Tiến bộ!", "happy"],
      ["me", "Chưa tới 23h. Nhưng con ma nhà 13 sẽ ra sớm, vì tui gọi nó."],
      ["narr", "Thám tử giơ tay lên. Trên gác, Tèo gạt công tắc. Tách. Bóng đèn chớp chớp. Bức tường bắt đầu khóc ‘hu hu, hức, hu hu’. Ngoài cổng, cả hẻm la một tiếng."],
      ["me", "Không có ma. Có một cái ổ cắm, một bình ắc quy, một cái loa, và một người cần cả hẻm sợ. Anh Quân."],
      ["quan", "Tui?! Thám tử giỡn hoài! Tui là người giúp bà con mà! Mọi người coi nè, tui đang cười nè, người cười nhiều sao làm chuyện xấu được!", "happy"],
    ],
    steps: [
      {
        claim: [
          ["quan", "Nếu có ai dựng ma thì là bà Diệu! Tối nào bả cũng lén vô cái nhà này, chị Thơ nghe tiếng bả hoài! Dựng ma để kiếm mối cúng chứ gì!", "angry"],
        ],
        answer: "tai-hien-ma",
        right: [
          ["me", "Bà Diệu vô lúc 21h, thắp nhang và ca cho bà Hai nghe, theo lời ông Hai nhờ. Còn ma thì bật lúc 23h, khi bà đã về."],
          ["me", "Mà con ma này không cần ai có mặt. Cầu dao tắt, gạt ổ hẹn giờ sang ON là đèn chớp, tường khóc. Câu hỏi không phải ai ở đây ban đêm. Câu hỏi là ai đã gắn, và ai giữ cho nó chạy."],
          ["bado", "Tui cúng ba lần, trả tiền ba lần. Giờ còn bị nói kiếm mối. Mô Phật, anh Quân cười ít lại giùm tui.", "angry"],
        ],
        wrong: [["quan", "Đó! Không chứng minh được! Bà Diệu tối nào cũng ở đây mà!", "smug"]],
        hint: "Anh Quân đổ cho người có mặt ban đêm. Mà sếp đã chứng minh con ma chạy một mình, không cần ai có mặt, đúng không sếp?",
      },
      {
        claim: [
          ["quan", "Vậy ai gắn mà chẳng được! Tui dân kinh doanh, ắc quy kích điện tui mù tịt! Tui còn không biết thay bóng đèn!", "nervous"],
        ],
        answer: "ac-quy-kich-dien",
        right: [
          ["me", "Tem giao hàng trên bình ắc quy: giao ngày 02/10, tới Nhà số 13 hẻm 47, SĐT người nhận 0909 456 313. Số trên bảng rao bán của anh. Ba ngày trước đêm ma đầu tiên."],
          ["chitho", "Số đó… là số anh Quân gọi em ba lần mời bán nhà…", "shock"],
        ],
        wrong: [["quan", "Thấy chưa, không có tên tui! Ai làm cũng được!", "smug"]],
      },
      {
        claim: [
          ["quan", "Số điện thoại thì khách mượn! Tui trả chìa khoá từ đầu tháng 10 rồi! Không có chìa thì tui vô kiểu gì mà thay với gắn?", "angry"],
        ],
        answer: "lich-hen-quan",
        right: [
          ["me", "Ắc quy chạy ba bốn đêm là cạn. Sổ lịch của anh: từ 06/10, mỗi thứ Hai và thứ Năm, 6h sáng, ‘dẫn khách xem nhà 13’. Mười bốn buổi. Không có hợp đồng nào được ký sau mấy buổi đó."],
          ["chuba", "À! Tui nhớ rồi! Có bữa tui đi tuần sáng… trễ, 6h15 mới tới cuối hẻm, thấy cậu Quân ôm cái hộp nặng trịch từ nhà 13 ra. Tui còn chào ‘Siêng quá ha’!", "shock"],
          ["onghai", "Đêm 14/10 tui ngồi ghế đưa tới sáng. Gần 6 giờ có người mở khoá cửa trước. Tui có một chìa, cậu Quân có một chìa.", "angry"],
        ],
        wrong: [["quan", "Thấy chưa! Tui đâu có vô được nhà này!", "smug"]],
      },
      {
        claim: [
          ["quan", "Còn cái loa! Loa bluetooth đầy chợ! Ai đem lên gác thì có trời biết!", "nervous"],
        ],
        answer: "thung-qua-tang",
        right: [
          ["me", "Thùng quà tặng trong văn phòng anh: mười hai ô, còn mười một cái loa, trống một ô. Tem bạc ‘Quà tặng khách hàng – An Cư Land – Lô 2026’, y hệt cái loa trên gác, trong đó có file ‘khoc_ban3_ronhon’."],
          ["teo", "Loa quà tặng khách hàng… mà đem tặng cho con ma. Ma là khách hàng VIP hả anh?", "smug"],
          ["nhomyt", "Ổng còn gửi tui bản 1 với bản 2 hỏi bản nào rợn hơn. Tui chọn bản 3. Tui xin lỗi…", "nervous"],
        ],
        wrong: [["quan", "Đó! Loa thì ai chẳng có!", "smug"]],
      },
      {
        claim: [
          ["quan", "Tui làm vậy được gì chứ? Tui còn giúp bà con bán nhà chạy ma, bị nói này nói kia, lương môi giới có mấy đồng!", "angry"],
        ],
        answer: "ban-do-khoanh",
        right: [
          ["me", "Dự thảo mở rộng đường: cuối hẻm 47 sắp thành mặt tiền. Bốn căn khoanh đỏ, ghi tay ‘Gom đủ 4 căn trước tháng 12. Mua dưới 2 tỷ. Bán lại 8–10 tỷ’. Bên mua là Cty Lạc Nghiệp, giám đốc Trần Minh Quân."],
          ["narr", "Cả hẻm ngoài cổng ồ lên. Chị Thơ bỏ nón lá xuống, nhìn anh Quân như nhìn một nồi chè bị thiu."],
          ["chitho", "Anh đem trà sữa cho con em… để mua nhà em với giá một phần năm…", "angry"],
        ],
        wrong: [["quan", "Đó, tui chỉ là môi giới! Hoa hồng có hai phần trăm!", "smug"]],
      },
      {
        claim: [
          ["quan", "Còn clip ma là cậu Đạt tự quay! Tự câu view! Tui không quen cậu đó, tui thề!", "nervous"],
        ],
        answer: "chuyen-khoan-dat",
        right: [
          ["me", "Ngày 04/10, Lạc Nghiệp chuyển cho Đạt năm triệu: ‘hợp tác truyền thông nhà 13 – quay đúng 23h’. Một ngày trước đêm ma đầu tiên. Ma chưa có, mà người quay ma đã được trả tiền."],
          ["nhomyt", "Anh Quân… em xin lỗi anh em Săn Ma TV. Em xin lỗi cả hẻm. Em tưởng làm nội dung thôi, em không biết là để ép người ta bán nhà.", "nervous"],
          ["narr", "Anh Quân nhìn quanh. Không ai cười theo anh nữa. Lần đầu tiên tối nay, anh Quân không cười."],
        ],
        wrong: [["quan", "Thấy chưa! Không ai chứng minh được tui quen cậu đó!", "smug"]],
      },
    ],
    confess: [
      ["quan", "…Tháng 9 tui đọc được dự thảo. Tui biết cuối hẻm này mai mốt là mặt tiền. Bốn căn, mỗi căn lời sáu bảy tỷ. Cả đời môi giới tui chưa thấy cơ hội nào vậy.", "nervous"],
      ["quan", "Mà không ai chịu bán. Nhà ông bà để lại, ai cũng nói ‘không bán’. Rồi tui nhìn căn nhà bỏ hoang, cái cây bàng, cái ghế đưa… Tui nghĩ: nhà ma thì ai cũng muốn bán.", "nervous"],
      ["quan", "Ắc quy, ổ hẹn giờ, cái loa quà tặng công ty. Tui thâu tiếng khóc ba lần mới được bản đủ rợn. Rồi thuê cậu Đạt quay cho lan nhanh. Thứ Hai thứ Năm tui dậy 5 giờ thay ắc quy, bảy tuần liền.", "nervous"],
      ["quan", "Cái ghế đưa là tui không có làm. Tui chèn cửa sổ cho kích điện khỏi nóng. Tự nó đưa. Bữa đầu thấy nó đưa, tui cũng sợ muốn xỉu.", "shock"],
      ["quan", "Tui xin lỗi chị Thơ. Xin lỗi nhà số 9, số 15. Xin lỗi ông Hai, tui đem nhà của ông với bà ra làm nhà ma.", "nervous"],
      ["onghai", "Cậu Quân. Nhà tui không có ma. Nhà tui có một bà già ca vọng cổ hay nhất xóm, với một ông già ngồi nghe. Cậu làm cho cả hẻm sợ cái nhà đó, chớ cái nhà đó chưa từng làm ai sợ.", "neutral"],
    ],
    epilogue: [
      ["narr", "Sáng thứ Hai, chị Thơ không ký giấy. Chú Ba dân phòng dẫn anh Quân lên phường làm việc. Hai hợp đồng đặt cọc nhà 9 và nhà 15 bị huỷ vì ký dựa trên ‘thông tin sai sự thật’. Công ty Lạc Nghiệp phải trả lại giấy tờ và bồi thường tiền cọc."],
      ["narr", "Bà Tư đăng bản dự thảo quy hoạch lên nhóm, in ra dán ở đầu hẻm. Cả dãy cuối hẻm 47 rủ nhau: không ai bán dưới giá."],
      ["nhomyt", "Anh em ơi, tập 8 của kênh: ‘Tui đã bị thuê để quay ma giả. Xin lỗi’. Từ nay kênh đổi tên thành Săn Sự Thật TV. Vẫn la ‘Á Á Á’, nhưng la thật.", "nervous"],
      ["beti", "Chị Thơ nhận nuôi mèo mẹ, con được qua chơi mỗi chiều! Ma Một, Ma Hai, Ma Ba giờ đổi tên thành Chè Đậu, Chè Bưởi, Chè Ba Màu!", "happy"],
      ["chitho", "Chè ba màu là con nhỏ nhất. Nó ăn nhiều nhất.", "happy"],
      ["narr", "Tối thứ Bảy, 9 giờ, nhà số 13 sáng đèn. Đèn thật, điện thật, ông Hai đã đóng tiền mở lại công tơ. Bà Diệu đứng giữa phòng khách, ca ‘Tình Anh Bán Chiếu’. Ông Hai ngồi ghế đưa. Lần này cửa mở toang."],
      ["bado", "Bà Hai ơi, bữa nay có đông người nghe nha. Bà khỏi ngồi một mình nữa.", "happy"],
      ["narr", "Cô Hai đem nồi thịt kho qua. Linh đứng cầm ring light, lần đầu tiên chiếu vô người khác. Ông Bảy đem Chiến Thần qua, nó ngủ gục trên lưng ghế đưa. Đạt quay, không la lần nào."],
      ["teo", "Sếp ơi, vụ này em sợ muốn xỉu ba lần. Mà em cũng gạt ổ hẹn giờ một lần. Em được ghi là ‘thầy pháp tập sự’ không sếp?", "happy"],
      ["me", "Ghi là ‘người gạt công tắc’, Tèo.", "smug"],
      ["teo", "Nghe không oai bằng.", "nervous"],
      ["onghai", "Thám tử ơi, tui không bán nhà nữa. Tui lên đây ở. Có hàng xóm, có bà Diệu ca, có mèo. Bả mà biết chắc bả vui.", "happy"],
      ["batu", "Từ nay nhà số 13 có tên mới trong nhóm: ‘Nhà Vọng Cổ Cuối Hẻm’. Tối thứ Bảy nào cũng mở cửa. Ai mạnh tim yếu tim gì cũng tới được!", "happy"],
    ],
    comments: [
      { by: "batu", text: "Đêm thứ 49: bắt được ma. Ma là cái ổ cắm. Thủ phạm là người cười nhiều nhất hẻm. Bà Tư rút ra bài học: ai cười nhiều quá thì coi chừng.", likes: 9131 },
      { by: "teo", text: "Em xin xác nhận: tỏi không trị được ổ cắm hẹn giờ. Lần sau em đem tua vít.", likes: 6213 },
      { by: "Chị Thơ Chè", text: "Không bán nhà nữa! Tuần này chè ba màu giảm giá mừng hết ma. Ai tới ăn thì ghé nhà 13 nghe vọng cổ luôn.", likes: 5402 },
      { by: "Săn Sự Thật TV - Đạt", text: "Tập 8 đã lên. Tui xin lỗi. Trả lại năm triệu cho Lạc Nghiệp rồi, lấy tiền đó… à không, đưa luôn cho phường làm bằng chứng. Kênh tụt hai chục nghìn follow. Đáng.", likes: 4811 },
      { by: "Bà Diệu", text: "Ba năm ca cho bà Hai nghe, giờ ca cho cả hẻm nghe. Ai muốn học vọng cổ thì tối thứ Bảy ghé nhà 13. Miễn phí. Không cúng.", likes: 7720 },
      { by: "Ông Hai", text: "Tui lên Sài Gòn ở luôn rồi. Ghế đưa vẫn đưa, mà giờ tui ngồi. Cảm ơn thám tử, cảm ơn cả hẻm.", likes: 8890 },
      { by: "Bé Ti", text: "con có 3 con mèo. tụi nó hông phải ma. con bắn cái gương 1 lần thôi. hết.", likes: 6602 },
      { by: "Chú Ba Dân Phòng", text: "Tui là nhân chứng 6h15 sáng. Lần đầu tiên đi trễ mà có ích. Ghi nhận.", likes: 5170 },
      { by: "Cô Hai Thịt Kho", text: "Hôm qua tui đem thịt kho qua nhà 13, ông Hai ăn ba chén. Nhà có người ăn cơm thì hết ma liền.", likes: 3390 },
      { by: "Linh Ăn Uống", text: "Lần đầu em chiếu ring light vô người khác: bà Diệu ca vọng cổ. Clip không có mặt em mà triệu view.", likes: 4120 },
      { by: "Ông Bảy Gà Chọi", text: "Tui nói rồi, Chiến Thần tới là ma chạy. Nó ngủ trên ghế đưa, ma không dám về.", likes: 2280 },
      { by: "Bin", text: "Ông nội ơi, ma là cái ổ cắm. Gà không làm gì ổ cắm được đâu ông.", likes: 3010 },
      { by: "Chủ nhà số 9", text: "Tui được huỷ hợp đồng, nhận lại nhà. Suýt bán nhà mười tỷ với giá hai tỷ vì một cái loa quà tặng.", likes: 5560 },
      { by: "Điện máy Bảy Phát", text: "Tiệm tui bán ắc quy cho xe máy, xe điện, đèn câu mực. Không bán cho ma. Từ nay khách giao hàng tới nhà hoang tui hỏi kỹ.", likes: 3870 },
      { by: "Út Cà Phê", text: "Wifi quán tui đổi tên thành ‘NhaVongCoCuoiHem’. Pass: ‘huhuhuc’. Đùa thôi, pass là ‘khongcoma’.", likes: 2650 },
      { by: "Anh Quân (đang làm việc với phường)", text: "Tui xin lỗi cả hẻm 47. Tui sẽ đi học lại nghề môi giới cho đàng hoàng. Lần này tui cười ít thôi.", likes: 1980 },
      { by: "Vy Trưởng Phòng", text: "Bài học quản trị rủi ro: không bao giờ tin người cười quá nhiều trong một cuộc đàm phán. Ghi chú vào báo cáo quý.", likes: 2470 },
    ],
  },

  hints: [
    {
      needs: ["clue:chuyen-khoan-dat", "clue:thung-qua-tang", "clue:ban-do-khoanh", "clue:lich-hen-quan"],
      text: "Sếp ơi, đủ hết rồi: ổ hẹn giờ, ắc quy, loa, lịch 6 giờ sáng, bản đồ, chuyển khoản. Ra bảng suy luận chốt đi sếp!",
    },
    {
      needs: "clue:loa-qua-tang",
      done: "clue:thung-qua-tang",
      text: "Cái loa trên gác dán tem quà tặng An Cư Land. Văn phòng An Cư Land có để quà tặng ở đâu không sếp? Mình qua đếm thử.",
    },
    {
      needs: "flag:da-canh-ma",
      done: "seen:attic.thi-nghiem-hen-gio",
      text: "Ma bật đúng 23h, tắt đúng 13 phút. Sếp lên gác xép coi cái ổ cắm với cái rương, rồi mình thử gạt cho nó ‘hiện hồn’ lúc chưa tới giờ đi!",
    },
    {
      needs: ["seen:attic.thi-nghiem-hen-gio", "seen:attic.cua-so-gac", "seen:hauntedhouse.ghe-dua"],
      done: "seen:attic.thi-nghiem-cua-so",
      text: "Còn cái ghế đưa tự đưa. Cửa sổ gác đang chèn mở hé… Sếp thử đóng cửa sổ lại rồi xuống coi ghế coi?",
    },
    {
      needs: "stmt:dat-tinh-co",
      done: "broke:dat-tinh-co",
      text: "Anh Đạt nói đọc nhóm mới tới quay. Mình coi clip đầu tiên của ảnh đăng lúc mấy giờ, ngày nào. Rồi hỏi chị Thơ với bà Tư coi cả hẻm biết có ma từ khi nào.",
    },
    {
      needs: "stmt:quan-tra-chia",
      done: "broke:quan-tra-chia",
      text: "Anh Quân nói trả chìa cho ông Hai rồi. Mình hỏi ông Hai coi có nhận không. Mà văn phòng An Cư Land có treo chìa khoá mấy căn đang bán đó sếp.",
    },
    {
      needs: "stmt:quan-mu-dien",
      done: "broke:quan-mu-dien",
      text: "Anh Quân nói mù điện. Mà cái bình ắc quy trong rương có tem giao hàng, có số điện thoại. Số đó em thấy quen quen trên bảng rao bán…",
    },
    {
      needs: "stmt:bado-mot-lan",
      done: "broke:bado-mot-lan",
      text: "Bà Diệu nói cúng một lần rồi thôi. Mà trên bàn thờ cũ có nhiều chân nhang lắm sếp, cây mới nhất còn thơm.",
    },
    {
      needs: "stmt:beti-khong-vo",
      done: "broke:beti-khong-vo",
      text: "Bé Ti nói không bao giờ vô nhà đó. Mà Bé Ti đi đâu cũng cầm súng nước bạc hà. Có chỗ nào trong nhà dính màu xanh lá không ta?",
    },
    {
      needs: "stmt:onghai-o-que",
      done: "broke:onghai-o-que",
      text: "Ông Hai nói cả năm không lên Sài Gòn. Sếp soi kỹ cái ghế đưa coi, dưới gối có gì cộm cộm.",
    },
    {
      needs: "seen:hauntedhouse.den-chap-chon",
      done: "flag:da-canh-ma",
      text: "Sắp 23h rồi sếp! Mình coi cầu dao có tắt thiệt không, rồi ngồi canh coi ma ra kiểu gì. Em… em ngồi sau lưng sếp.",
    },
    {
      text: "Sếp ơi, ma thiệt đó sếp! …Dạ thôi em không đoán. Mình soi cái bóng đèn với hộp cầu dao trước, rồi qua văn phòng anh Quân coi sao.",
    },
  ],

  bonus: [
    {
      id: "file-khoc",
      q: "Tập tin tiếng khóc trong loa giấu trên gác tên là gì?",
      choices: ["ma_that.mp3", "khoc_ban3_ronhon.mp3", "tinh_anh_ban_chieu.mp3", "hu_hu_huc.mp3"],
      answer: 1,
      explain: "‘khoc_ban3_ronhon.mp3’: anh Quân thâu ba lần mới được bản đủ rợn, còn nhờ Đạt chọn giùm.",
    },
    {
      id: "ten-meo",
      q: "Bé Ti đặt tên ba con mèo con là gì (trước khi đổi)?",
      choices: ["Chè Đậu, Chè Bưởi, Chè Ba Màu", "Ma Một, Ma Hai, Ma Ba", "Hu, Hu, Hức", "Ti Một, Ti Hai, Ti Ba"],
      answer: 1,
      explain: "Ma Một, Ma Hai, Ma Ba, cho tụi bạn sợ. Về nhà chị Thơ thì đổi thành Chè Đậu, Chè Bưởi, Chè Ba Màu.",
    },
    {
      id: "vong-co",
      q: "Bà Diệu ca bài vọng cổ nào cho bà Hai nghe mỗi tối?",
      choices: ["Tình Anh Bán Chiếu", "Đắp Mộ Cuộc Tình", "Dạ Cổ Hoài Lang", "Lan và Điệp"],
      answer: 0,
      explain: "‘Tình Anh Bán Chiếu’, ca lúc 21h mỗi tối, theo lời ông Hai nhờ trước khi về quê.",
    },
  ],
};
