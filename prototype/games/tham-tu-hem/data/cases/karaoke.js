// Vụ 8: "Đêm Karaoke Cúp Điện" (độ khó 2, mùa 2). Hợp đồng nhân vật / cảnh / đồ vật: docs/tham-tu-hem/DESIGN.md §3b.
// Cơ chế mới: BẢNG ĐIỆN VÀ ÂM THANH. Đối chiếu cầu dao (gạt tay hay nhảy), nhật ký laptop + danh sách bài (giờ, phút
// trong bài), file ghi âm từng kênh micro và clip livestream để biết ai đứng ở tủ điện lúc 21:14.
// Lời giải (KHÔNG hiện cho người chơi):
//   Chung kết "Giọng Ca Vàng Hẻm 47". Cô Thu (quán quân năm ngoái) HÁT NHÉP: micro kim sa bluetooth của cô phát giọng
//   thu sẵn qua ngõ bluetooth của dàn. 21:00 cô xin anh Tùng mượn MIC 2 "check giọng" (anh Tùng tắt kênh ra loa, nhưng
//   laptop vẫn GHI ÂM TỪNG KÊNH). Cùng lúc micro kim sa rớt bể ở bàn trang điểm, nắp pin văng, không phát được nữa.
//   21:05 cô thử hát thật vào MIC 2: phô, lạc tông (ghi âm). Tiết mục #7 của cô dự kiến 21:20 => sắp phải hát live.
//   21:08 ông Năm (Ca Sĩ Nón Lá, tiết mục #4 lúc 20:56) chui ra từ góc sau tủ điện sau khi thay đồ, đụng cô Thu áo vàng
//   đi vô, tay cầm micro. 21:12:15 Béo hát bài tự sáng tác (#6). 21:13:51 MIC 2 ghi tiếng bước chân, bản lề tủ điện kêu
//   "két", 21:14:07 tiếng "tách": cô Thu GẠT TAY cầu dao tổng (cần gạt tận đáy, không lưng chừng như nhảy quá tải).
//   Vạt áo kim sa vàng mắc chốt cửa tủ, rách một mảng. Cô nhét MIC 2 xuống thùng bia, cuộn áo vàng dưới bạt xe ba gác,
//   thay áo bạc dự phòng. Rồi đổ cho "quá tải tại đèn LED của Béo".
//   Thủ phạm: cô Thu. Động cơ: sợ lộ hát nhép (chung kết hoãn thì cô giữ danh hiệu thêm một năm).
//   Gây nhiễu: ông Năm (ghét ồn, từng doạ "cúp cầu dao cho yên", đèn pin + nón lá kim tuyến ở góc tủ điện; thật ra là
//   Ca Sĩ Nón Lá ẩn danh, lúc 21:13 ngồi hàng ghế cuối khóc theo bài của Béo), cô Sáu (rời ghế giám khảo, la sau sân khấu
//   "tui chưa rút mà!": định rút điện bảng LED "NGỌC ƠI" của Béo vì Ngọc là con gái cổ, tưởng mình làm cúp điện),
//   Béo (lén cắm bảng LED 5W tỏ tình, bị đổ là gây quá tải), anh Tùng (giữ dàn, tủ điện không khoá; giấu chuyện tủ lạnh
//   giải thưởng là tủ cũ của má sơn lại).
//   Kết hợp 2 vật chứng: sổ mượn micro (MIC 2 ở cô Thu) + ghi âm kênh MIC 2 (tiếng két + tách ở tủ điện);
//   mảng kim sa ở chốt tủ + áo vàng rách trong xe ba gác (và móc áo bạc dự phòng trống).
export default {
  id: "karaoke",
  no: 8,
  title: "Đêm Karaoke Cúp Điện",
  tagline: "Giải nhất là cái tủ lạnh. Giải bất ngờ là một màn hát nhép.",
  difficulty: 2,
  client: "anhtung",

  intro: [
    ["narr", "Văn phòng Thám Tử Lụm, 9 giờ 20 tối thứ Bảy. Tèo nằm trên ghế bố coi livestream \"Chung Kết Giọng Ca Vàng Hẻm 47\" của bà Tư."],
    ["teo", "Sếp ơi, thằng Béo đang hát bài nó tự sáng tác, hay muốn rớt nước mắt. Tủ lạnh giải nhất chắc chắn là của nó rồi!", "happy"],
    ["teo", "\"Hẻm nhỏ mùa mưa, em đứng dưới hiên nhà...\" ủa? Ủa? Màn hình đen thui rồi sếp! Bà Tư la \"cúp điện bà con ơi\"!", "shock"],
    ["me", "Cúp điện thì chờ có điện lại.", "neutral"],
    ["teo", "Mà chỉ cúp đúng cái sân khấu thôi sếp. Đèn nhà em vẫn sáng. Đèn quán cô Út vẫn sáng!", "shock"],
    ["narr", "Mười lăm phút sau, cửa văn phòng bật mở. Một anh áo sơ mi hoa, dây chuyền to bản, mồ hôi nhễ nhại, tay còn cầm micro."],
    ["anhtung", "Thám tử! Tui là Tùng, chủ dàn karaoke kiêm MC đêm chung kết. Có người phá! Có người phá chung kết của tui!", "angry"],
    ["anhtung", "Đúng [[21h14|9 giờ 14]], giữa phần thi thằng Béo, toàn bộ sân khấu tối thui. Chú Ba bật lại cầu dao lúc 9 giờ 31 thì cả hẻm đã nhao nhao.", "nervous"],
    ["anhtung", "Cô Thu, [[quan-quan|quán quân]] năm ngoái, nói chắc là [[qua-tai|quá tải]]. Mà dàn tui chạy năm năm chưa nhảy lần nào.", "neutral"],
    ["anhtung", "Giờ ban giám khảo hoãn chung kết. Cô Sáu đòi huỷ luôn. Cả hẻm đòi tìm ra người cúp điện mới thi tiếp. Còn cái tủ lạnh đứng giữa sân khấu, không ai dám ôm về.", "nervous"],
    ["teo", "Sếp, em đoán liền: ông Năm! Lần trước ổng doạ cắt dây mạng, lần này ổng cúp điện! Ổng ghét ồn mà!", "smug"],
    ["me", "Lần trước ông Năm vô tội, Tèo.", "neutral"],
    ["teo", "Thì lần này tới lượt ổng có tội. Cho công bằng.", "smug"],
    ["me", "Anh Tùng, dẫn tôi ra sân khấu. Đừng ai đụng vô cái tủ điện.", "neutral"],
    ["anhtung", "Dạ... chú Ba đụng rồi. Chú Ba bật lại mà.", "nervous"],
  ],

  social: {
    group: "Hẻm 47 Hóng Biến",
    posts: [
      {
        by: "batu",
        text: "⚡ CÚP ĐIỆN NGAY CHUNG KẾT ⚡ Đang livestream \"Giọng Ca Vàng Hẻm 47\", thằng Béo vừa hát tới điệp khúc thì PHỤT, tối thui cả sân khấu! Cả hẻm còn điện, chỉ sân khấu cúp!!! Có người cố tình rồi bà con ơi. Ban giám khảo hoãn thi, tủ lạnh giải nhất mồ côi giữa hẻm 😭 Ai thấy gì báo bà Tư nha",
        likes: 1736,
        comments: [
          { by: "teo", text: "Em đoán ông Năm. Lý do: ông Năm 🙂" },
          { by: "Ông Năm (Hẻm 47)", text: "Tui ở nhà ngủ. Mà cúp điện được thì cũng tốt. Im." },
          { by: "Cô Út Cà Phê", text: "Quán Út còn điện nè, ai muốn hát tiếp ra quán, Út mở karaoke miễn phí tới 10 giờ 🎤" },
          { by: "Tiểu Thư Bánh Bèo 2k5", text: "Anh Béo hát tới câu \"em ơi\" thì cúp. Em ơi ai vậy anh Béo ơi 😭" },
          { by: "Shop Đèn Sạc Tích Điện", text: "Đèn sạc 12 tiếng, cúp điện vẫn hát được, ib shop nha 🔦" },
          { by: "chuba", text: "Chú bật lại cầu dao rồi. Chú tới trễ nhưng chú bật lẹ" },
        ],
      },
    ],
  },

  people: {
    anhtung: {
      name: "Anh Tùng",
      role: "Chủ dàn karaoke kiêm MC · người tới nhờ",
      bio: "40 tuổi, sơ mi hoa, dây chuyền to bản. Cho thuê dàn karaoke đám tiệc khắp quận, năm nay tự đứng ra tổ chức \"Giọng Ca Vàng Hẻm 47\" kèm giải nhất là một cái [[tu-lanh|tủ lạnh]].",
      suspect: true,
    },
    cothu: {
      name: "Cô Thu",
      role: "Quán quân năm ngoái",
      bio: "45 tuổi, áo kim sa lấp lánh, tóc uốn bồng. Quán quân \"Giọng Ca Vàng\" năm ngoái với bài \"Bông Điên Điển\". Luôn cầm một chiếc micro kim sa riêng, không cho ai đụng.",
      suspect: true,
    },
    beo: {
      name: "Béo",
      role: "Thí sinh hát hay nhất",
      bio: "21 tuổi, sinh viên năm 3, áo thun ban nhạc rock. Giọng khỏe, tự sáng tác bài \"Hẻm Nhỏ Mùa Mưa\" để thi chung kết. Ai cũng gọi \"thằng Béo\" từ hồi lớp 1, giờ thành nghệ danh.",
      suspect: true,
    },
    cosau: {
      name: "Cô Sáu",
      role: "Trưởng ban giám khảo (tự phong)",
      bio: "55 tuổi, quạt xếp không rời tay, giọng sang sảng. Tự nhận là trưởng ban giám khảo vì \"hồi xưa có đi hát đám cưới\". Có cô con gái tên Ngọc đang học đại học.",
      suspect: true,
    },
    ongnam: {
      name: "Ông Năm",
      role: "Hàng xóm khó tính",
      bio: "68 tuổi, áo ngủ sọc, điếu cày. Ghét ồn, ghét karaoke, từng làm thanh tra phường. Mùa trước bị nghi cắt cáp mạng đêm chung kết bóng đá, hoá ra là fan bóng đá trốn đi coi. Nhà có cửa sau mở ra đúng hẻm sau sân khấu.",
      suspect: true,
      sheet: "mat-wifi",
    },
  },

  locations: {
    stage: {
      name: "Sân khấu giữa hẻm",
      scene: "stage",
      start: true,
      intro: [
        ["narr", "Sân khấu dựng bằng giàn giáo giữa hẻm, phông bạt in chữ vàng \"GIỌNG CA VÀNG HẺM 47 – CHUNG KẾT\". Hai trăm cái ghế nhựa, một trăm cái đang có người ngồi bàn tán."],
        ["anhtung", "Đây. 9 giờ 14, thằng Béo đứng đó, tui ngồi bàn dàn loa đằng kia, tự nhiên phụt một cái.", "nervous"],
        ["teo", "Sếp, cái tủ lạnh đứng giữa sân khấu như một bức tượng. Em muốn ôm nó.", "happy"],
      ],
      hotspots: [
        {
          id: "man-hinh-loi",
          label: "Màn hình lời",
          rect: [330, 40, 300, 170],
          lines: [
            ["narr", "Tivi 65 inch treo trên giàn giáo. Có điện lại, nó vẫn đứng hình ở đúng câu hát đang dở:"],
            ["narr", "\"Hẻm nhỏ mùa mưa, em đứng dưới hiên nhà. Anh muốn nói một câu đã giữ ba năm qua... em ơi, [[ngoc|Ngọc]] ơi...\""],
            ["teo", "Ngọc ơi! Thằng Béo hát tên ai trong bài vậy sếp? Bài tự sáng tác mà có tên người thật là có biến!", "shock"],
            ["me", "Lời bài hát dừng đúng chữ \"Ngọc ơi\". Có người không muốn câu đó được hát hết. Hoặc chỉ là trùng hợp.", "neutral"],
          ],
          gives: { words: ["ngoc"] },
          again: [["teo", "\"Em ơi, Ngọc ơi\". Em đọc mà em nổi da gà. Thằng Béo này lãng mạn ghê.", "happy"]],
        },
        {
          id: "micro-cay",
          label: "Micro cây",
          rect: [440, 260, 80, 220],
          lines: [
            ["narr", "Chân micro sắt giữa sân khấu, gắn MIC 1, micro có dây. Dây cắm thẳng về bàn dàn loa."],
            ["me", "MIC 1 dành cho thí sinh đang thi. Lúc cúp điện, Béo đứng đúng ở đây.", "neutral"],
            ["teo", "Chân micro còn dán băng keo ghi \"KHÔNG ĐƯỢC ÔM MICRO KHÓC – BTC\". Chắc năm ngoái có ai ôm khóc.", "smug"],
          ],
          gives: { words: ["san-khau"] },
          again: [["teo", "Em thử nói \"alo\" vô micro... dạ nó chưa bật. Em xin lỗi.", "nervous"]],
        },
        {
          id: "dan-loa",
          label: "Dàn loa",
          rect: [40, 230, 260, 250],
          lines: [
            ["narr", "Bàn dàn loa của anh Tùng: hai thùng loa to bằng tủ áo, bàn mixer đèn nhấp nháy, một cái laptop đời cũ chạy pin."],
            ["me", "Laptop còn sáng. Nhật ký phần mềm karaoke: \"[[21h12|21:12:15]] – Bắt đầu tiết mục #6: Béo – Hẻm Nhỏ Mùa Mưa\".", "neutral"],
            ["me", "\"21:14:07 – Mất tín hiệu ra loa – vị trí bài 1:52/4:10\". Góc màn hình: \"Ghi âm đa kênh: ĐANG BẬT\".", "neutral"],
            ["me", "Dán trên mixer là tờ giấy kẻ ô: \"Sổ mượn micro. MIC 1: thí sinh trên sân khấu. MIC 2: cô Thu – [[21h00|21:00]] – check giọng (xin riêng). Trả: ...\" Ô \"trả\" bỏ trống.", "neutral"],
            ["teo", "Laptop chạy pin nên cúp điện nó vẫn ghi! Laptop này làm nhân chứng được nè sếp!", "shock"],
          ],
          gives: { clues: ["log-laptop", "so-muon-mic"], words: ["mic-2", "ban-dan-loa"] },
          again: [["me", "Kênh MIC 2 trên mixer đã bị kéo xuống đáy: tắt tiếng ra loa. Nhưng đèn \"REC\" của kênh vẫn đỏ.", "neutral"]],
        },
        {
          id: "bang-ten-thi-sinh",
          label: "Bảng tên thí sinh",
          rect: [680, 60, 240, 180],
          lines: [
            ["narr", "Bảng xốp dán tên thí sinh và giờ dự kiến, chữ decal vàng:"],
            ["me", "\"#4 – 20:56 – Ca Sĩ Nón Lá (bí ẩn) – Đêm Buồn Tỉnh Lẻ. #5 – 21:04 – Hai Lúa – Lý Cây Bông.\"", "neutral"],
            ["me", "\"#6 – 21:12 – Béo – Hẻm Nhỏ Mùa Mưa (tự sáng tác). #7 – [[21h20|21:20]] – Cô Thu, quán quân năm ngoái – Bông Điên Điển.\"", "neutral"],
            ["teo", "Ca Sĩ Nón Lá bí ẩn! Hát bolero mà che mặt bằng nón lá! Em nghe bà Tư nói ổng hát hay muốn xỉu.", "shock"],
            ["me", "Cô Thu diễn cuối, sau Béo tám phút. Lúc cúp điện, đúng ra cô đang chuẩn bị ở hậu trường.", "neutral"],
          ],
          gives: { clues: ["danh-sach-bai"], words: ["ca-si-non-la"] },
          again: [["teo", "Hai Lúa hát \"Lý Cây Bông\". Ông Hai Lúa cho thuê bàn ghế mà hát cũng có nghề ghê.", "neutral"]],
        },
        {
          id: "tu-lanh-giai-thuong",
          label: "Tủ lạnh giải thưởng",
          rect: [700, 260, 140, 230],
          lines: [
            ["narr", "Cái tủ lạnh hai cửa thắt nơ đỏ, dán giấy to: \"GIẢI NHẤT – MỚI 100% – NHÀ TÀI TRỢ TẶNG\"."],
            ["me", "Mép tờ giấy \"MỚI 100%\" bị bong. Bên dưới là tem bảo hành ghi \"2009\". Mặt hông tủ còn vết nam châm hình trái tim, chữ viết tay mờ mờ: \"Tùng ăn vụng là chết với má\".", "neutral"],
            ["teo", "Tủ lạnh 17 năm tuổi! Lớn hơn em! Sếp ơi, giải nhất là tủ lạnh của má anh Tùng!", "shock"],
          ],
          gives: { clues: ["tem-tu-lanh"], words: ["tu-lanh-cu"] },
          again: [["teo", "Em mở thử... bên trong còn mùi mắm ruốc. Đúng tủ của má thiệt rồi.", "smug"]],
        },
        {
          id: "livestream",
          label: "Điện thoại livestream của bà Tư",
          rect: [330, 400, 90, 110],
          lines: [
            ["narr", "Điện thoại bà Tư gắn trên chân ba càng ngay mép sân khấu, chạy pin sạc dự phòng. Bà Tư hào phóng tua lại cho thám tử."],
            ["batu", "Coi đi! Bà quay từ đầu tới cuối, không sót một giây. Bà là nhà báo của hẻm mà.", "smug"],
            ["me", "21:13. Béo hát trên sân khấu. Anh Tùng ngồi bàn dàn loa, mặt sáng màu đèn laptop. Ghế giám khảo của cô Sáu: trống trơn.", "neutral"],
            ["me", "Hàng ghế cuối: một ông áo ngủ sọc, nón lá kéo thấp, đang lấy khăn lau nước mắt.", "neutral"],
            ["me", "21:14. Tối thui. Anh Tùng la \"Ai cúp điện vậy?!\" ngay chỗ bàn dàn. Rồi từ phía sau sân khấu, một giọng đàn bà thét: \"Trời đất ơi tui chưa rút mà!\"", "neutral"],
            ["teo", "Giọng đó... giọng cô Sáu! Mà \"chưa rút\" là rút cái gì sếp?", "shock"],
          ],
          gives: { clues: ["clip-livestream"], words: ["hang-ghe-cuoi", "sau-san-khau"] },
          again: [["batu", "Bà có thêm góc quay thứ hai bằng máy tính bảng nữa nè. À không, cái đó quay nồi chè.", "smug"]],
        },
        {
          id: "ban-giam-khao",
          label: "Bàn giám khảo",
          rect: [520, 420, 180, 100],
          lines: [
            ["narr", "Bàn nhựa phủ khăn đỏ, ba ghế. Ghế giữa có gối tựa in chữ \"TRƯỞNG BAN\"."],
            ["me", "Phiếu chấm của cô Sáu. Cột tiêu chí: \"Giọng: /3. Áo: /3. Thần thái: /3. Có lễ phép với giám khảo: /1\".", "neutral"],
            ["teo", "Áo được ba điểm, bằng giọng! Vậy em mặc áo kim tuyến lên hát là được ba điểm sẵn hả sếp?", "happy"],
            ["me", "Cột của Béo có ghi chú bút đỏ: \"Bài có tên con gái người ta. Trừ 2 điểm lễ phép\".", "neutral"],
          ],
          again: [["teo", "Gối \"TRƯỞNG BAN\" êm ghê. Em ngồi thử... dạ em đứng dậy rồi.", "nervous"]],
        },
      ],
    },

    fusebox: {
      name: "Góc tủ điện",
      scene: "fusebox",
      start: true,
      intro: [
        ["narr", "Cuối hẻm sau, nơi đường dây sân khấu nối vào điện. Tủ điện sắt sơn xám dựng sát tường, dưới cái bóng đèn vàng chập chờn. Từ đây ra tới sân khấu ba chục mét."],
        ["chuba", "Chú tới lúc 9 giờ 30, thấy cầu dao tổng nằm dưới, chú gạt lên liền. Chú là dân phòng mà, thấy cầu dao xuống là phải gạt.", "neutral"],
        ["me", "Chú Ba có nhớ lúc chú tới, cái cần gạt nằm ở đâu không?", "neutral"],
        ["chuba", "Nằm dưới. Dưới tận đáy luôn. Chú gạt lên mỏi tay.", "neutral"],
      ],
      hotspots: [
        {
          id: "tu-dien",
          label: "Tủ điện",
          rect: [330, 80, 240, 340],
          lines: [
            ["narr", "Tủ điện sắt hai cánh. Ổ khoá treo hờ trên khoen, không bấm. Mở cánh tủ ra, bản lề rỉ kêu một tiếng \"KÉÉÉT\" dài, chói tai."],
            ["teo", "Ui! Tiếng này mà nửa đêm nghe là em đi luôn khỏi về.", "shock"],
            ["me", "Ghi nhớ cái tiếng này. Không cánh cửa nào trong hẻm kêu giống vậy.", "neutral"],
            ["me", "Chốt cửa tủ là một miếng sắt gỉ, mép bén như dao. Mắc vào đó: một mảng vải lưới nhỏ bằng bao diêm, đính kín những hạt [[kim-sa-vang|kim sa vàng]] tròn, lấp lánh.", "neutral"],
            ["teo", "Kim sa! Áo kim sa! Cả hẻm ai mặc áo kim sa tối nay?!", "shock"],
          ],
          gives: { clues: ["kim-sa-chot"], words: ["tu-dien", "kim-sa-vang"] },
          again: [["narr", "Cánh tủ lại kêu \"KÉÉÉT\". Tèo bịt tai."]],
        },
        {
          id: "cau-dao",
          label: "Cầu dao",
          rect: [400, 160, 100, 120],
          lines: [
            ["narr", "Cầu dao tổng 40A của đường điện sân khấu. Giờ đang ở vị trí bật, chú Ba vừa gạt lên."],
            ["me", "Loại này khi [[qua-tai|quá tải]] thì tự nhảy, cần gạt bật về lưng chừng, nằm ở giữa. Muốn bật lại phải gạt xuống hết rồi mới gạt lên.", "neutral"],
            ["me", "Chú Ba nói lúc chú tới, cần gạt nằm dưới tận đáy. Không phải lưng chừng.", "neutral"],
            ["teo", "Vậy là không phải nó nhảy. Là có người [[gat-tay|gạt tay]] xuống!", "shock"],
            ["me", "Một cái cầu dao không biết nói dối. Nó chỉ nằm đúng chỗ người ta để nó.", "neutral"],
          ],
          gives: { clues: ["cau-dao-gat-tay"], words: ["gat-tay"] },
          again: [["chuba", "Chú gạt lên mỏi tay thiệt đó. Chú khai thiệt.", "neutral"]],
        },
        {
          id: "so-dien",
          label: "Sổ điện",
          rect: [600, 140, 130, 160],
          lines: [
            ["narr", "Tấm bìa kẹp giấy treo bên hông tủ, chữ anh Tùng: \"Sổ điện chung kết\"."],
            ["me", "\"Dây nối 1: dàn loa 2.000W. Dây nối 2: đèn sân khấu 800W. Tủ lạnh giải thưởng: KHÔNG cắm (chỉ trưng). Tổng: 2,8kW. Cầu dao 40A chịu được khoảng 8kW.\"", "neutral"],
            ["me", "\"20:15 – bật tổng – Tùng. 21:14 – ??? – mất điện. 21:31 – bật lại – chú Ba (tới trễ).\"", "neutral"],
            ["teo", "Chú Ba được ghi tên vô sổ luôn, kèm chú thích \"tới trễ\". Lịch sử ghi nhận.", "smug"],
            ["me", "2,8 trên 8. Thêm cái gì cỡ bóng đèn nữa cũng không quá tải nổi.", "neutral"],
          ],
          gives: { clues: ["so-dien"] },
          again: [["teo", "Trong sổ không có dòng nào về cái tủ lạnh của má anh Tùng. Tủ lạnh chỉ đứng làm đẹp.", "neutral"]],
        },
        {
          id: "den-pin-rot",
          label: "Đèn pin rớt",
          rect: [120, 400, 120, 70],
          lines: [
            ["narr", "Dưới chân tường, một cây đèn pin sắt cũ nằm lăn lóc, tắt ngúm."],
            ["me", "Thân đèn khắc chữ: \"Thanh tra phường – Năm – 1998\".", "neutral"],
            ["teo", "ÔNG NĂM! Em biết mà! Em đã nói từ đầu! Sếp ghi công em đi!", "shock"],
            ["me", "Một cây đèn pin cho biết ông Năm từng ở đây. Không cho biết lúc mấy giờ.", "neutral"],
          ],
          gives: { clues: ["den-pin-ong-nam"], words: ["ongnam"] },
          again: [["teo", "Đèn pin thanh tra. Ông Năm vẫn còn giữ đồ nghề hồi xưa. Ổng nhớ nghề.", "neutral"]],
        },
        {
          id: "day-dien-noi",
          label: "Dây điện nối",
          rect: [580, 360, 300, 120],
          lines: [
            ["narr", "Một rổ ổ cắm nối, dây chạy dọc hẻm sau ra sân khấu. Hai ổ dán băng keo \"LOA\", \"ĐÈN\"."],
            ["me", "Ổ thứ ba không dán tên. Cắm vào đó là một sợi dây trắng mảnh, dài cả chục mét, quấn băng keo xanh từng khúc chạy ra phía sau sân khấu.", "neutral"],
            ["me", "Đầu phích có tờ giấy nhỏ: \"CỦA BÉO – ĐỪNG RÚT – ĐÈN [[den-led|ĐÈN LED]] 5W\". Lần theo dây ra sau phông sân khấu: một bảng đèn LED chữ \"NGỌC ƠI\" hình trái tim.", "neutral"],
            ["teo", "Ngọc ơi bằng đèn LED! Thằng Béo định hát tới điệp khúc là bật đèn tỏ tình!", "shock"],
            ["me", "5 oát. Bằng cái đèn ngủ. Không làm nhảy nổi một cầu dao 40A.", "neutral"],
          ],
          gives: { clues: ["den-led-ngoc"], words: ["den-led"] },
          again: [["teo", "Bảng đèn \"NGỌC ƠI\" mà chưa kịp sáng. Tội thằng Béo.", "nervous"]],
        },
        {
          id: "goc-sau-tu",
          label: "Góc khuất sau tủ",
          rect: [600, 40, 120, 90],
          lines: [
            ["narr", "Khe hẹp giữa tủ điện và bức tường, vừa một người lách vô. Có ai đó đã dùng chỗ này làm phòng thay đồ."],
            ["me", "Một cái nón lá dán [[kim-tuyen|kim tuyến]] bạc lấp lánh, vành nón có khoét hai lỗ nhìn. Kế bên: một bộ áo bà ba sân khấu gấp vội.", "neutral"],
            ["teo", "Ca Sĩ Nón Lá! Đồ diễn của Ca Sĩ Nón Lá! Sau tủ điện! Sếp, Ca Sĩ Nón Lá cúp điện!", "shock"],
            ["me", "Kim tuyến là bột lấp lánh, dính đầy tay. Kim sa là hạt tròn may lên vải. Hai thứ khác nhau.", "neutral"],
          ],
          gives: { clues: ["non-la-kim-tuyen"], words: ["kim-tuyen"] },
          again: [["teo", "Tay em dính kim tuyến rồi. Rửa ba lần không sạch. Giờ em lấp lánh.", "nervous"]],
        },
      ],
    },

    backalley: {
      name: "Hậu trường sau rạp",
      scene: "backalley",
      needs: { any: ["talk:anhtung.hau-truong", "seen:fusebox.tu-dien"] },
      intro: [
        ["narr", "Hẻm sau, phía sau phông sân khấu. Bàn trang điểm kê tạm, thùng bia ướp đá, chiếc xe ba gác chở dàn loa, móc treo đồ diễn trên dây phơi."],
        ["anhtung", "Thí sinh chờ tới lượt thì ngồi đây. Tối nay chỉ có cô Thu chiếm bàn trang điểm. Cô nói quán quân cần không gian riêng.", "neutral"],
        ["teo", "Sếp, em nghe mùi keo xịt tóc nồng muốn xỉu. Hiện trường này có mùi... quán quân.", "smug"],
      ],
      hotspots: [
        {
          id: "ban-trang-diem",
          label: "Bàn trang điểm",
          rect: [40, 200, 250, 270],
          lines: [
            ["narr", "Bàn trang điểm gỗ, gương có viền bóng đèn. Phấn, son, keo xịt tóc, lô cuốn, và một hộp đựng micro lót nhung đỏ."],
            ["me", "Trong hộp nhung: một chiếc [[micro-kim-sa|micro kim sa]] dát hạt lấp lánh. Vỏ nứt một đường, nắp pin văng mất, một viên pin lăn dưới gầm bàn.", "neutral"],
            ["me", "Micro này không có dây. Bên hông có nút bluetooth và khe thẻ nhớ. Thẻ nhớ còn cắm: một file duy nhất, \"BONG_DIEN_DIEN_GIONG_THU_FULL.mp3\".", "neutral"],
            ["teo", "Micro mà có thẻ nhớ chứa sẵn bài hát có giọng... Sếp ơi micro này hát giùm chủ hả?", "shock"],
            ["me", "Một micro phát nhạc qua bluetooth thì chỉ cần cầm lên và nhép miệng.", "neutral"],
          ],
          gives: { clues: ["micro-kim-sa"], words: ["ban-trang-diem", "micro-kim-sa", "hat-nhep"] },
          again: [["teo", "Em bấm thử nút... nó không kêu. Micro này chết thiệt rồi.", "nervous"]],
        },
        {
          id: "thung-bia",
          label: "Thùng bia",
          rect: [320, 330, 170, 150],
          lines: [
            ["narr", "Thùng đá ướp bia của ban tổ chức. Đá tan gần hết, lon bia nổi lềnh bềnh."],
            ["me", "Thò tay xuống đáy... đụng một vật cứng, dài. Một chiếc micro không dây màu đen, quấn băng keo đỏ, chữ trắng: \"MIC 2\".", "neutral"],
            ["me", "Lưới micro còn kẹt hai hạt [[kim-sa-vang|kim sa vàng]].", "neutral"],
            ["teo", "Mic 2 đi tắm bia! Ai giấu nó dưới đáy thùng đá vậy sếp?", "shock"],
            ["me", "Một người muốn nó im lặng mãi mãi. Mà micro im rồi đâu có nghĩa là nó chưa từng nghe thấy gì.", "neutral"],
          ],
          gives: { clues: ["mic-2-thung-bia"] },
          again: [["teo", "Em lấy một lon bia... dạ em để lại. Bia của ban tổ chức.", "nervous"]],
        },
        {
          id: "ao-kim-sa-du-phong",
          label: "Áo kim sa dự phòng",
          rect: [520, 60, 200, 230],
          lines: [
            ["narr", "Dây phơi căng ngang hẻm, treo ba cái móc áo. Mỗi móc dán băng keo ghi tên."],
            ["me", "Móc 1: \"Béo – áo thun dự phòng\". Móc 2: \"Hai Lúa – khăn rằn\". Móc 3: \"Cô Thu – áo kim sa DỰ PHÒNG (bạc)\". Móc 3 trống trơn.", "neutral"],
            ["teo", "Cô Thu đang mặc áo bạc mà! Vậy là cô [[thay-ao|thay áo]] rồi. Mà trên livestream hồi đầu tối, em nhớ cô mặc áo vàng chói lọi.", "neutral"],
            ["me", "Một quán quân thay áo dự phòng trước giờ diễn tám phút. Áo chính đâu?", "neutral"],
          ],
          gives: { clues: ["moc-du-phong"], words: ["thay-ao"] },
          again: [["teo", "Móc áo của Béo có cái áo thun in chữ \"ROCK KHÔNG CHẾT\". Mà Béo hát ballad mà.", "smug"]],
        },
        {
          id: "xe-ba-gac",
          label: "Xe ba gác",
          rect: [700, 280, 240, 200],
          needs: "clue:kim-sa-chot",
          lines: [
            ["narr", "Chiếc xe ba gác chở thùng loa, phủ tấm bạt xanh. Một góc bạt có cái gì lấp lánh ló ra."],
            ["me", "Lật bạt lên: một chiếc áo kim sa vàng cuộn tròn, nhét giữa hai thùng loa.", "neutral"],
            ["me", "Vạt áo bên phải rách toạc một lỗ cỡ bao diêm. Mép rách còn tua lưới, hạt kim sa vàng rơi lả tả.", "neutral"],
            ["teo", "Áo vàng của cô Thu! Rách một mảng! Bằng đúng cái mảng mắc ở chốt tủ điện!", "shock"],
          ],
          gives: { clues: ["ao-vang-rach"] },
          again: [["teo", "Áo này đẹp vậy mà bị cuộn như cuộn chả giò. Uổng ghê.", "nervous"]],
        },
        {
          id: "cua-sau-nha-nam",
          label: "Cửa sau nhà ông Năm",
          rect: [40, 40, 140, 140],
          lines: [
            ["narr", "Cánh cửa gỗ sau nhà ông Năm mở hé, ngay sát hậu trường. Trên cửa dán giấy: \"ỒN QUÁ. NGƯỜI GIÀ CẦN NGỦ. – NĂM\"."],
            ["me", "Qua khe cửa: trên tường nhà là cái kệ, trên kệ là một chồng đĩa bolero, một cái micro cũ bọc khăn nhung, và tấm giấy khen \"Giải Ba Tiếng Hát Phường – 1985\".", "neutral"],
            ["teo", "Ông Năm ghét karaoke mà có giấy khen ca hát! Sếp, nhà này có nhiều bí mật hơn nhà ma.", "shock"],
          ],
          gives: { words: ["nha-ong-nam"] },
          again: [["teo", "Cửa sau vẫn hé. Ông Năm đi ra đi vô bằng cửa này hoài.", "neutral"]],
        },
        {
          id: "noi-che",
          label: "Nồi chè",
          rect: [520, 330, 150, 140],
          lines: [
            ["narr", "Nồi chè đậu đen của bà Tư, bán ủng hộ quỹ cuộc thi, năm ngàn một ly. Cái muôi còn cắm giữa nồi."],
            ["batu", "Chè bà nấu đó, ăn đi rồi phá án. Tiền chè để mua cúp cho năm sau.", "happy"],
            ["teo", "Bà Tư vừa quay livestream vừa nấu chè vừa bán chè. Bà Tư có ba cái tay hả sếp?", "shock"],
          ],
          again: [["teo", "Em ăn ly thứ hai rồi. Em ghi nợ quỹ cuộc thi.", "happy"]],
        },
      ],
    },
  },

  clues: {
    "log-laptop": {
      name: "Nhật ký laptop dàn karaoke",
      desc: "Laptop chạy pin: tiết mục #6 Béo \"Hẻm Nhỏ Mùa Mưa\" bắt đầu [[21h12|21:12:15]]. Mất tín hiệu ra loa [[21h14|21:14:07]], bài đang ở 1:52/4:10. Phần mềm báo \"Ghi âm đa kênh: ĐANG BẬT\".",
      detail: [["me", "Laptop ghi riêng từng kênh micro, kể cả kênh đã tắt tiếng ra loa.", "neutral"]],
    },
    "so-muon-mic": {
      name: "Sổ mượn micro",
      desc: "Tờ giấy dán trên mixer: \"MIC 1: thí sinh trên [[san-khau|sân khấu]]. [[mic-2|MIC 2]]: cô Thu – [[21h00|21:00]] – check giọng (xin riêng). Trả: (bỏ trống).\"",
      detail: [["teo", "Mượn lúc 9 giờ mà tới giờ chưa trả. Cô Thu mượn mic như mượn tiền.", "smug"]],
    },
    "danh-sach-bai": {
      name: "Danh sách tiết mục chung kết",
      desc: "#4 20:56 [[ca-si-non-la|Ca Sĩ Nón Lá]] (bí ẩn). #5 21:04 Hai Lúa. #6 21:12 Béo – \"Hẻm Nhỏ Mùa Mưa\". #7 [[21h20|21:20]] Cô Thu, quán quân năm ngoái – \"Bông Điên Điển\".",
      detail: [["me", "Lúc 21:14, người kế tiếp lên sân khấu là cô Thu. Đúng ra cô phải ngồi chờ ở hậu trường.", "neutral"]],
    },
    "cau-dao-gat-tay": {
      name: "Cần gạt cầu dao tận đáy",
      desc: "Cầu dao 40A nhảy vì [[qua-tai|quá tải]] thì cần gạt về lưng chừng. Chú Ba tới lúc 21:30 thấy cần gạt nằm dưới tận đáy: cầu dao bị [[gat-tay|gạt tay]].",
    },
    "so-dien": {
      name: "Sổ điện chung kết",
      desc: "Tổng tải sân khấu 2,8kW (dàn loa 2.000W, đèn 800W, tủ lạnh không cắm). Cầu dao 40A chịu khoảng 8kW. \"21:14 – ??? – mất điện. 21:31 – bật lại – chú Ba (tới trễ).\"",
      detail: [["me", "Muốn quá tải phải cắm thêm gấp đôi cả dàn loa lẫn đèn. Không ai làm vậy được mà không ai thấy.", "neutral"]],
    },
    "kenh-mic-2": {
      name: "File ghi âm kênh MIC 2",
      desc: "[[21h05|21:05]]: giọng nữ hát thử \"Bông Điên Điển\", phô, lạc tông, hụt hơi, rồi lẩm bẩm \"trời ơi không có nó thì chết\". 21:13:51: tiếng bước chân nhanh, bản lề sắt kêu \"KÉÉÉT\" dài. 21:14:07: \"TÁCH\". Rồi im.",
      detail: [["me", "Tiếng \"két\" đó chỉ có một cánh cửa trong hẻm: cánh [[tu-dien|tủ điện]]. Người cầm MIC 2 đứng ngay tủ điện đúng giây cúp điện.", "neutral"]],
    },
    "kim-sa-chot": {
      name: "Mảng kim sa ở chốt tủ điện",
      desc: "Mảng vải lưới cỡ bao diêm, đính kín hạt [[kim-sa-vang|kim sa vàng]] tròn, mắc vào chốt sắt gỉ của cửa tủ điện.",
    },
    "ao-vang-rach": {
      name: "Áo kim sa vàng bị rách",
      desc: "Áo kim sa vàng của cô Thu, cuộn giấu giữa hai thùng loa trên xe ba gác. Vạt phải rách một lỗ cỡ bao diêm, mép tua lưới, rơi hạt [[kim-sa-vang|kim sa vàng]].",
      detail: [["me", "Lỗ rách trên áo và mảng vải ở chốt tủ điện: một mảnh, một lỗ. Ghép vô là khớp.", "neutral"]],
    },
    "moc-du-phong": {
      name: "Móc áo dự phòng trống",
      desc: "Móc \"Cô Thu – áo kim sa DỰ PHÒNG (bạc)\" ở hậu trường trống trơn. Cô Thu đang mặc áo bạc, trong khi đầu tối cô mặc áo vàng. Cô đã [[thay-ao|thay áo]].",
    },
    "mic-2-thung-bia": {
      name: "MIC 2 dưới đáy thùng bia",
      desc: "Micro không dây \"MIC 2\" giấu dưới đáy thùng đá ướp bia ở hậu trường, cách bàn trang điểm ba bước. Lưới micro kẹt hai hạt [[kim-sa-vang|kim sa vàng]].",
    },
    "micro-kim-sa": {
      name: "Micro kim sa bị bể",
      desc: "[[micro-kim-sa|Micro kim sa]] riêng của cô Thu: không dây, có bluetooth và thẻ nhớ chứa đúng một file \"BONG_DIEN_DIEN_GIONG_THU_FULL.mp3\". Vỏ nứt, nắp pin văng mất. Không phát được nữa.",
      detail: [["me", "Micro không thu giọng. Micro phát giọng. Đó là cách [[hat-nhep|hát nhép]] trên sân khấu karaoke.", "neutral"]],
    },
    "den-led-ngoc": {
      name: "Bảng đèn LED \"NGỌC ƠI\"",
      desc: "[[den-led|Đèn LED]] 5W hình trái tim chữ \"NGỌC ƠI\" sau phông sân khấu, dây cắm về ổ nối ở tủ điện, đầu phích ghi \"CỦA BÉO – ĐỪNG RÚT\".",
      detail: [["me", "5 oát. Cái cầu dao 40A còn không biết nó tồn tại.", "neutral"]],
    },
    "den-pin-ong-nam": {
      name: "Đèn pin của ông Năm",
      desc: "Đèn pin sắt cũ khắc \"Thanh tra phường – Năm – 1998\", rớt dưới chân tường góc tủ điện.",
    },
    "non-la-kim-tuyen": {
      name: "Nón lá kim tuyến",
      desc: "Nón lá dán [[kim-tuyen|kim tuyến]] bạc, khoét hai lỗ nhìn, kèm bộ áo bà ba sân khấu, giấu trong khe sau tủ điện. Đồ diễn của [[ca-si-non-la|Ca Sĩ Nón Lá]].",
    },
    "clip-livestream": {
      name: "Clip livestream của bà Tư",
      desc: "21:13: Béo hát trên sân khấu; anh Tùng ngồi [[ban-dan-loa|bàn dàn loa]]; ghế cô Sáu trống; [[hang-ghe-cuoi|hàng ghế cuối]] có ông áo ngủ sọc, nón lá, lau nước mắt. 21:14: tối thui, anh Tùng la \"Ai cúp điện vậy?!\" tại bàn dàn; từ [[sau-san-khau|sau sân khấu]] có giọng cô Sáu thét \"Trời đất ơi tui chưa rút mà!\".",
      detail: [["me", "Bốn người, bốn chỗ đứng lúc 21:14. Không ai trong bốn người đó ở tủ điện.", "neutral"]],
    },
    "clip-nam-ngoai": {
      name: "Clip chung kết năm ngoái",
      desc: "Béo quay ở hàng ghế đầu năm ngoái: phút 3:12 bài \"Bông Điên Điển\", cô Thu chìa micro kim sa xuống cho khán giả hát theo, nhưng tiếng hát của cô vẫn vang đều đều trên loa, không hụt một chữ.",
      detail: [["teo", "Micro chĩa xuống đất mà giọng vẫn lên. Giọng cô Thu phát ra từ... đâu vậy sếp?", "shock"]],
    },
    "tem-tu-lanh": {
      name: "Tem tủ lạnh giải thưởng",
      desc: "Dưới tờ giấy \"MỚI 100%\" là tem bảo hành năm 2009. Hông tủ còn vết nam châm trái tim, chữ \"Tùng ăn vụng là chết với má\". Một cái [[tu-lanh-cu|tủ lạnh cũ sơn lại]].",
    },
  },

  words: {
    cothu: { text: "cô Thu", kind: "ai" },
    anhtung: { text: "anh Tùng", kind: "ai" },
    beo: { text: "Béo", kind: "ai" },
    cosau: { text: "cô Sáu", kind: "ai" },
    ongnam: { text: "ông Năm", kind: "ai" },

    "20h56": { text: "20 giờ 56", kind: "luc" },
    "21h00": { text: "21 giờ 00", kind: "luc" },
    "21h05": { text: "21 giờ 05", kind: "luc" },
    "21h08": { text: "21 giờ 08", kind: "luc" },
    "21h12": { text: "21 giờ 12", kind: "luc" },
    "21h14": { text: "21 giờ 14", kind: "luc" },
    "21h20": { text: "21 giờ 20", kind: "luc" },

    "san-khau": { text: "sân khấu", kind: "o" },
    "tu-dien": { text: "tủ điện", kind: "o" },
    "ban-trang-diem": { text: "bàn trang điểm", kind: "o" },
    "ban-dan-loa": { text: "bàn dàn loa", kind: "o" },
    "sau-san-khau": { text: "sau phông sân khấu", kind: "o" },
    "hang-ghe-cuoi": { text: "hàng ghế cuối", kind: "o" },
    "nha-ong-nam": { text: "nhà ông Năm", kind: "o" },

    "mic-2": { text: "MIC 2", kind: "vat" },
    "kim-sa-vang": { text: "kim sa vàng", kind: "vat" },
    "kim-tuyen": { text: "kim tuyến bạc", kind: "vat" },
    "den-led": { text: "đèn LED", kind: "vat" },
    "micro-kim-sa": { text: "micro kim sa", kind: "vat" },
    "tu-lanh-cu": { text: "tủ lạnh cũ sơn lại", kind: "vat" },

    "gat-tay": { text: "gạt tay", kind: "cach" },
    "qua-tai": { text: "quá tải", kind: "cach" },
    "rut-dien": { text: "rút điện bảng đèn", kind: "cach" },
    "hat-nhep": { text: "hát nhép", kind: "cach" },
    "thay-ao": { text: "thay áo", kind: "cach" },

    "so-lo-nhep": { text: "sợ lộ chuyện hát nhép", kind: "vi" },
    "ghet-on": { text: "ghét ồn ào", kind: "vi" },
    "can-to-tinh": { text: "cản Béo tỏ tình con gái", kind: "vi" },
    "ghen-giong-beo": { text: "ghen giọng hát của Béo", kind: "vi" },

    ngoc: { text: "Ngọc", kind: "khac" },
    "quan-quan": { text: "quán quân năm ngoái", kind: "khac" },
    "ca-si-non-la": { text: "Ca Sĩ Nón Lá", kind: "khac" },
    "tu-lanh": { text: "tủ lạnh giải nhất", kind: "khac" },
  },

  talks: {
    anhtung: [
      {
        id: "dem-nay",
        topic: "Kể lại lúc cúp điện",
        lines: [
          ["anhtung", "Thằng Béo hát được gần hai phút, đang lên điệp khúc. Cả hẻm nín thở. Bà Tư khóc. Tui nổi da gà.", "neutral"],
          ["anhtung", "Rồi phụt. Tối thui. Tui la \"ai cúp điện vậy\" mà không ai trả lời, chỉ nghe con nít khóc với tiếng ghế nhựa đổ.", "nervous"],
          ["anhtung", "Chừng năm phút sau, cô Thu chạy ra từ hậu trường, mặc áo bạc, la lên \"quá tải rồi, chắc thằng Béo cắm đồ bậy\". Cả hẻm quay qua nhìn thằng Béo.", "neutral"],
          ["teo", "Cô Thu chẩn đoán lẹ ghê. Chưa coi cầu dao mà biết quá tải.", "smug"],
        ],
        gives: { words: ["anhtung", "cothu"] },
      },
      {
        id: "hau-truong",
        topic: "Trước giờ thi, ai ở hậu trường?",
        lines: [
          ["anhtung", "Hậu trường là hẻm sau, ngay sau phông. Bàn trang điểm cô Thu chiếm, ai tới gần cổ đuổi.", "neutral"],
          ["anhtung", "Thí sinh xong tiết mục thì ra hàng ghế ngồi. Ca Sĩ Nón Lá hát xong là biến mất, như mọi lần. Không ai biết ổng là ai.", "neutral"],
          ["anhtung", "Hẻm sau thông ra tới góc tủ điện. Ai ở hậu trường đi thêm vài chục bước là tới.", "neutral"],
        ],
        gives: { words: ["ban-trang-diem"] },
      },
      {
        id: "tu-khoa",
        topic: "Tủ điện có khoá không?",
        needs: "seen:fusebox.tu-dien",
        lines: [
          ["anhtung", "Có ổ khoá... mà tui treo hờ. Tối nay tui chạy qua chạy lại bật tắt hoài, khoá vô mở ra mất công.", "nervous"],
          ["me", "Vậy ai trong hẻm cũng mở được tủ điện.", "neutral"],
          ["anhtung", "Dạ... ai biết đường thì mở được. Mà ai biết đường? Cả hẻm biết đường.", "nervous"],
          ["teo", "Anh Tùng làm an ninh kiểu \"tin tưởng cộng đồng\".", "smug"],
        ],
      },
      {
        id: "ghi-am",
        topic: "Laptop có ghi âm từng kênh?",
        needs: ["clue:log-laptop", "clue:so-muon-mic"],
        lines: [
          ["anhtung", "Có! Phần mềm ghi riêng từng micro để mai tui dựng clip đăng page. Kể cả kênh tắt tiếng ra loa nó cũng ghi.", "happy"],
          ["anhtung", "MIC 2 tui cho cô Thu mượn lúc 9 giờ để check giọng. Cổ nói check riêng, đừng mở ra loa. Tui kéo kênh xuống, mà ghi âm thì vẫn chạy.", "neutral"],
          ["me", "Mở file kênh MIC 2.", "neutral"],
          ["narr", "21:05: một giọng nữ hát \"Bông Điên Điển\". Phô. Lạc tông. Hụt hơi ở chữ thứ ba. Rồi tiếng lẩm bẩm: \"trời ơi, không có nó thì chết\"."],
          ["teo", "Ai hát vậy sếp... Em nghe mà muốn đi mua tai nghe chống ồn.", "shock"],
          ["narr", "21:13:51: tiếng bước chân nhanh, tiếng thở gấp. Một tiếng \"KÉÉÉT\" dài, chói tai. 21:14:07: \"TÁCH\". Rồi im lặng hoàn toàn."],
          ["teo", "KÉÉÉT! Tiếng cánh tủ điện! Em nhớ, em bịt tai hồi nãy!", "shock"],
          ["me", "Người cầm MIC 2 đứng ngay tủ điện, đúng giây cúp điện.", "neutral"],
        ],
        gives: { clues: ["kenh-mic-2"], words: ["21h05"] },
      },
      {
        id: "tu-lanh",
        topic: "Tủ lạnh giải thưởng ở đâu ra?",
        lines: [
          ["anhtung", "Nhà tài trợ tặng. Mới một trăm phần trăm. Còn nguyên thùng... à, tui gỡ thùng rồi cho đẹp.", "neutral"],
          ["anhtung", "Thắt nơ đỏ, dán chữ vàng. Giải nhất mà, phải hoành tráng.", "smug"],
        ],
        gives: { stmts: ["anhtung-tu-moi"], words: ["tu-lanh"] },
      },
      {
        id: "tu-cua-ma",
        topic: "Tủ lạnh của má anh",
        needs: "broke:anhtung-tu-moi",
        lines: [
          ["anhtung", "Nhà tài trợ là cửa hàng điện máy đầu chợ. Tuần trước họ rút, nói \"kinh tế khó khăn\". Tui in băng rôn rồi, hẹn cả hẻm rồi.", "nervous"],
          ["anhtung", "Tui về nhà, nhìn cái tủ của má. Chạy êm, lạnh tốt. Tui sơn lại, dán chữ. Má tui tưởng tui đem đi sửa.", "nervous"],
          ["anhtung", "Đừng nói với má tui. Mà cũng đừng nói với cả hẻm. Tui mất mặt, má tui mất tủ.", "nervous"],
          ["teo", "Vậy ai thắng là ôm tủ lạnh của má anh Tùng về. Kèm mùi mắm ruốc.", "smug"],
        ],
      },
    ],

    cothu: [
      {
        id: "luc-cup",
        topic: "Lúc cúp điện cô ở đâu?",
        lines: [
          ["cothu", "Ở [[ban-trang-diem|bàn trang điểm]] chứ đâu. Từ 9 giờ tới lúc cúp điện tui ngồi dặm phấn, ôn bài. Không đi đâu nửa bước.", "neutral"],
          ["cothu", "Quán quân diễn cuối mà. Phải chuẩn bị chu đáo. Người ta chờ tui cả năm.", "smug"],
        ],
        gives: { stmts: ["cothu-trang-diem"] },
      },
      {
        id: "qua-tai",
        topic: "Cô nghĩ vì sao cúp điện?",
        lines: [
          ["cothu", "Quá tải chứ gì nữa. Thằng Béo cắm đèn đóm gì đó sau sân khấu, tui thấy nó lấp ló hồi chiều.", "angry"],
          ["cothu", "Dàn loa, đèn, rồi cộng đồ của nó. Cầu dao chịu không nổi thì nhảy. Lỗi của nó, nó phải chịu.", "angry"],
          ["teo", "Cô Thu nói chuyện điện như thợ điện. Mà thợ điện còn chưa nói chắc vậy.", "smug"],
          ["teo", "Sếp, hay là cô Thu [[ghen-giong-beo|ghen giọng hát của Béo]], nên đổ hết cho nó?", "smug"],
          ["cothu", "Ghen? Tui là quán quân. Quán quân không ghen. Quán quân chỉ... nhắc nhở.", "angry"],
        ],
        gives: { stmts: ["cothu-qua-tai"], words: ["beo"] },
      },
      {
        id: "nam-ngoai",
        topic: "Năm ngoái cô thắng thế nào?",
        lines: [
          ["cothu", "Bông Điên Điển. Mười trên mười. Cả hẻm đứng dậy vỗ tay.", "smug"],
          ["cothu", "Tui hát live một trăm phần trăm. Giọng thật, hơi thật, nước mắt thật. Ai nói gì thì nói.", "neutral"],
          ["teo", "Ủa có ai nói gì đâu cô?", "neutral"],
          ["cothu", "Thì... phòng trước.", "nervous"],
        ],
        gives: { stmts: ["cothu-hat-live"], words: ["quan-quan"] },
      },
      {
        id: "mic-2",
        topic: "Cô mượn MIC 2 làm gì?",
        needs: "clue:so-muon-mic",
        lines: [
          ["cothu", "Check giọng. Quán quân thì phải check giọng. Micro của tui... ờ, micro của tui đang sạc.", "nervous"],
          ["cothu", "Tui trả MIC 2 lúc 9 giờ 10 rồi. Để trên bàn dàn loa. Anh Tùng không thấy thì tại anh Tùng.", "angry"],
          ["anhtung", "Tui ngồi bàn dàn suốt tối, đâu có ai trả gì.", "neutral"],
        ],
      },
      {
        id: "doi-ao",
        topic: "Sao cô đổi áo bạc?",
        needs: "seen:backalley.ao-kim-sa-du-phong",
        lines: [
          ["cothu", "Áo vàng... chật. Tui ăn ly chè bà Tư xong thì chật.", "nervous"],
          ["cothu", "Với lại bạc hợp đèn sân khấu hơn. Thám tử không hiểu thời trang đâu.", "smug"],
          ["teo", "Ly chè đậu đen làm chật áo kim sa. Chè bà Tư có công lực ghê.", "smug"],
        ],
      },
    ],

    beo: [
      {
        id: "phan-thi",
        topic: "Phần thi của em",
        lines: [
          ["beo", "Em hát bài em tự viết, \"Hẻm Nhỏ Mùa Mưa\". Em viết ba năm mới xong. Tới câu quan trọng nhất thì tối thui.", "nervous"],
          ["beo", "Em đứng trên sân khấu, cầm MIC 1, không thấy đường. Em nghĩ: chắc ông trời không cho em nói câu đó.", "nervous"],
          ["teo", "Câu \"Ngọc ơi\" hả?", "smug"],
          ["beo", "Dạ... anh đừng nói lớn.", "nervous"],
        ],
        gives: { words: ["beo"] },
      },
      {
        id: "cam-do",
        topic: "Em có cắm gì thêm vô điện không?",
        lines: [
          ["beo", "Dạ không. Em có đàn guitar thùng, không cần điện. Em chỉ cần micro.", "nervous"],
          ["beo", "Cô Thu nói em làm quá tải là oan cho em. Em không cắm gì hết, em thề trên cây đàn.", "nervous"],
          ["teo", "Thề trên cây đàn không cắm điện. Lời thề an toàn ghê.", "smug"],
        ],
        gives: { stmts: ["beo-khong-cam"] },
      },
      {
        id: "nam-ngoai",
        topic: "Năm ngoái cô Thu hát thế nào?",
        lines: [
          ["beo", "Năm ngoái em ngồi hàng đầu, quay cả bài để học. Mà em coi đi coi lại có một chỗ em không hiểu.", "neutral"],
          ["beo", "Phút 3 phút 12, cô chìa micro xuống cho khán giả hát theo. Mà giọng cô vẫn vang trên loa, không hụt một chữ.", "neutral"],
          ["beo", "Em nghĩ chắc tai em có vấn đề. Em không dám nói ai. Em gửi anh coi.", "nervous"],
          ["teo", "Micro chĩa xuống đất mà giọng vẫn lên loa. Phép thuật hả?", "shock"],
        ],
        gives: { clues: ["clip-nam-ngoai"] },
      },
      {
        id: "ngoc",
        topic: "Ngọc là ai?",
        needs: "broke:beo-khong-cam",
        lines: [
          ["beo", "Ngọc học chung với em từ lớp 10. Giờ Ngọc học Bách Khoa, em học Nhạc. Ba năm em chưa dám nói.", "nervous"],
          ["beo", "Em tính tới điệp khúc thì bảng đèn sáng, em hát \"Ngọc ơi\", Ngọc ngồi hàng thứ ba sẽ hiểu.", "nervous"],
          ["beo", "Mà... Ngọc là con gái cô Sáu. Trưởng ban giám khảo.", "shock"],
          ["teo", "Tỏ tình con gái giám khảo ngay trong lúc giám khảo chấm điểm. Thằng Béo gan hơn em tưởng.", "shock"],
          ["beo", "Em đâu có cắm đèn để phá điện. 5 oát thôi anh. Đèn ngủ nhà em còn tốn điện hơn.", "nervous"],
        ],
        gives: { words: ["can-to-tinh"] },
      },
    ],

    cosau: [
      {
        id: "cham-thi",
        topic: "Cô chấm thi thế nào?",
        lines: [
          ["cosau", "Công bằng. Tuyệt đối công bằng. Giọng, áo, thần thái, lễ phép. Tui hát đám cưới hai chục năm, tui nghe là biết.", "smug"],
          ["cosau", "Năm ngoái cô Thu mười điểm. Giọng ngọt, áo đẹp, thần thái quán quân. Năm nay tui thấy cũng chắc vậy.", "neutral"],
          ["teo", "Cô chấm trước khi người ta hát luôn hả cô?", "smug"],
          ["cosau", "Thám tử ơi, trợ lý của anh thiếu lễ phép. Trừ một điểm.", "angry"],
        ],
        gives: { words: ["cosau"] },
      },
      {
        id: "luc-cup",
        topic: "Lúc cúp điện cô ở đâu?",
        lines: [
          ["cosau", "Ngồi ghế trưởng ban chứ đâu. Từ đầu tới cuối tui không rời nửa bước. Trưởng ban mà rời ghế là mất uy.", "neutral"],
          ["cosau", "Điện cúp cái tui ngồi im, giữ trật tự cho bà con. Tui bình tĩnh nhất hẻm.", "smug"],
        ],
        gives: { stmts: ["cosau-ngoi-ghe"] },
      },
      {
        id: "beo",
        topic: "Cô thấy Béo hát sao?",
        lines: [
          ["cosau", "Giọng được. Mà bài tự sáng tác thì... tui không thích bài có tên con gái người ta trong đó.", "angry"],
          ["cosau", "Hát thì hát, nhắc tên con gái nhà người ta là thiếu lễ phép. Trừ hai điểm.", "angry"],
          ["teo", "Cô Sáu biết trước lời bài hát luôn hả cô?", "neutral"],
          ["cosau", "Thì... nó tập hồi chiều, cả hẻm nghe. Tui có tai mà.", "nervous"],
        ],
        gives: { words: ["ngoc"] },
      },
      {
        id: "chua-rut",
        topic: "\"Tui chưa rút mà\" là sao?",
        needs: "broke:cosau-ngoi-ghe",
        lines: [
          ["cosau", "Thôi được. Tui khai. Ngọc là con gái tui. Hồi chiều tui thấy thằng Béo lén giăng cái bảng đèn chữ \"NGỌC ƠI\" sau phông.", "nervous"],
          ["cosau", "Lúc nó lên hát, tui lén ra sau sân khấu, lần theo sợi dây trắng để [[rut-dien|rút điện bảng đèn]]. Con gái tui đang học, chưa được yêu đương!", "angry"],
          ["cosau", "Tui mới nắm sợi dây, chưa kịp lần tới phích, thì phụt, tối thui. Tui tưởng... tui tưởng tui giật trúng cái gì làm cúp điện cả sân khấu!", "shock"],
          ["cosau", "Nên tui chạy về ghế ngồi im, nói là không đi đâu. Tui sợ cả hẻm bắt tui đền.", "nervous"],
          ["teo", "Cô Sáu tưởng mình là thủ phạm! Cô Sáu tự thú một vụ cô không làm!", "shock"],
          ["me", "Giật một sợi dây đèn trang trí thì không làm cầu dao tổng nhúc nhích đâu cô. Cô chỉ có tội lãng mạn... ngược.", "neutral"],
        ],
      },
    ],

    ongnam: [
      {
        id: "dem-nay",
        topic: "Tối nay ông ở đâu?",
        lines: [
          ["ongnam", "Ở [[nha-ong-nam|nhà]]. Đóng cửa. Ngủ từ 8 giờ. Nhét bông gòn hai lỗ tai.", "angry"],
          ["ongnam", "Ồn muốn chết. Loa kẹo kéo, loa thùng, giờ còn sân khấu giữa hẻm. Người già cần ngủ!", "angry"],
          ["teo", "Ông Năm ơi, nhét bông gòn mà ông nghe tụi con gõ cửa liền vậy ông?", "smug"],
          ["ongnam", "Tại cậu gõ to!", "angry"],
        ],
        gives: { stmts: ["ongnam-o-nha"], words: ["ghet-on"] },
      },
      {
        id: "doa-cup",
        topic: "Ông từng doạ cúp điện?",
        lines: [
          ["ongnam", "Doạ thì có. Tuần trước tui đăng nhóm: \"Đứa nào hát quá 10 giờ tui cúp cầu dao cho yên\".", "angry"],
          ["ongnam", "Mà mới 9 giờ 14. Tui doạ quá 10 giờ. Tui nói là giữ lời, sớm hay trễ đều không làm.", "neutral"],
          ["teo", "Lần trước ông doạ cắt dây, lần này doạ cúp điện. Năm sau ông doạ gì để em chuẩn bị tinh thần?", "smug"],
          ["ongnam", "Doạ cậu.", "angry"],
        ],
        gives: { words: ["ongnam"] },
      },
      {
        id: "ve-nghe",
        topic: "Ông có nghe được bài thằng Béo không?",
        lines: [
          ["ongnam", "Nghe làm gì. Bông gòn mà.", "neutral"],
          ["ongnam", "...Mà bài đó có câu \"hẻm nhỏ mùa mưa\" nghe cũng... được. Đủ vần.", "nervous"],
          ["teo", "Ông nhét bông gòn mà nghe được vần luôn. Bông gòn của ông xịn ghê.", "smug"],
        ],
      },
      {
        id: "non-la",
        topic: "Ca Sĩ Nón Lá",
        needs: "broke:ongnam-o-nha",
        lines: [
          ["ongnam", "Thôi được! Tui là Ca Sĩ Nón Lá! Từ vòng loại tới giờ!", "angry"],
          ["ongnam", "Hồi trẻ tui giải ba tiếng hát phường. Rồi đi làm thanh tra, bỏ hát. Bốn chục năm tui chửi karaoke, mà đêm nào nằm cũng nghe bolero.", "nervous"],
          ["ongnam", "Chửi người ta ồn cả năm rồi giờ đứng lên hát, còn mặt mũi gì. Nên tui đội nón lá, khoét hai lỗ.", "nervous"],
          ["ongnam", "Hát xong 9 giờ 2, tui lủi ra sau tủ điện thay đồ, rớt cây đèn pin. 9 giờ 8 tui lách ra, quay lại hàng ghế cuối ngồi nghe thằng Béo.", "neutral"],
          ["ongnam", "Lúc lách ra, tui đụng cô Thu đi ngược vô, áo vàng chói lọi, tay cầm cái micro đen, miệng lẩm bẩm gì đó. Tui tưởng cổ tìm chỗ tập hát.", "neutral"],
          ["teo", "Sếp ơi! Lần trước ông Năm trốn coi bóng đá, lần này trốn đi hát. Ông Năm sống hai mặt mà mặt nào cũng dễ thương!", "shock"],
        ],
        gives: { words: ["21h08", "20h56"] },
      },
    ],
  },

  stmts: {
    "cothu-qua-tai": {
      by: "cothu",
      text: "Cầu dao nhảy vì [[qua-tai|quá tải]]. Thằng Béo cắm đồ bậy sau sân khấu.",
      break: {
        clue: "cau-dao-gat-tay",
        lines: [
          ["me", "Cầu dao nhảy vì quá tải thì cần gạt nằm lưng chừng. Chú Ba tới thấy nó nằm dưới tận đáy. Nó không nhảy. Có người gạt tay.", "neutral"],
          ["me", "Mà cái cầu dao 40A đó chịu được gần gấp ba cả sân khấu cộng lại.", "neutral"],
          ["cothu", "...Tui đâu có rành điện. Tui nghe người ta nói vậy thì tui nói vậy.", "nervous"],
          ["teo", "Hồi nãy cô nói chắc như thợ điện mà cô.", "smug"],
          ["cothu", "Thì giờ tui nói như ca sĩ. Ca sĩ không rành điện.", "angry"],
        ],
        gives: { words: ["gat-tay"], flags: ["khong-qua-tai"] },
      },
    },
    "cothu-trang-diem": {
      by: "cothu",
      text: "Từ 9 giờ tới lúc cúp điện tui ngồi [[ban-trang-diem|bàn trang điểm]], không đi đâu nửa bước.",
      break: {
        clue: "kenh-mic-2",
        lines: [
          ["me", "Sổ mượn micro: MIC 2, cô Thu, 9 giờ, chưa trả. Laptop ghi riêng kênh MIC 2.", "neutral"],
          ["me", "21 giờ 13 phút 51: tiếng bước chân, rồi tiếng \"két\" của cánh tủ điện. 21 giờ 14 phút 07: \"tách\". Đúng giây sân khấu tối thui.", "neutral"],
          ["cothu", "...", "shock"],
          ["cothu", "Tui... tui trả MIC 2 rồi! 9 giờ 10! Ai cầm sau đó thì người đó ra tủ điện!", "angry"],
          ["anhtung", "Cô Thu, tui ngồi bàn dàn từ đầu tới cuối. Không ai trả cái gì.", "neutral"],
        ],
        gives: { words: ["tu-dien"], flags: ["mic2-o-tu-dien"] },
      },
    },
    "cothu-hat-live": {
      by: "cothu",
      text: "Năm ngoái tui hát live một trăm phần trăm. Giọng thật, hơi thật.",
      break: {
        clue: "micro-kim-sa",
        lines: [
          ["me", "Micro kim sa của cô không thu âm. Nó có bluetooth, có thẻ nhớ, và trong thẻ nhớ có đúng một file: \"Bông Điên Điển, giọng Thu, bản full\".", "neutral"],
          ["me", "Clip năm ngoái, phút 3:12, cô chìa micro xuống khán giả, giọng cô vẫn vang đều trên loa.", "neutral"],
          ["cothu", "...", "shock"],
          ["cothu", "Đó là... đó là micro đời mới! Nó có chức năng... hỗ trợ!", "nervous"],
          ["teo", "Chức năng hỗ trợ hát giùm luôn. Micro này nên đi thi thay cô.", "smug"],
        ],
        gives: { words: ["hat-nhep", "so-lo-nhep"], flags: ["lo-hat-nhep"] },
      },
    },
    "beo-khong-cam": {
      by: "beo",
      text: "Em không cắm thêm gì vô điện hết. Đàn em là guitar thùng.",
      break: {
        clue: "den-led-ngoc",
        lines: [
          ["me", "Ổ nối thứ ba ở góc tủ điện. Phích ghi \"CỦA BÉO – ĐỪNG RÚT\". Dây chạy ra sau phông, nối vào bảng đèn LED \"NGỌC ƠI\".", "neutral"],
          ["beo", "...", "shock"],
          ["beo", "Dạ... em có cắm. Mà cái đó 5 oát! Em cắm từ 8 giờ, trước giờ thi, có làm cúp gì đâu!", "nervous"],
          ["beo", "Em giấu tại... em không muốn ai biết trước chữ trên bảng. Nhất là cô Sáu.", "nervous"],
          ["teo", "Bảng đèn tỏ tình bị phát hiện trước khi sáng. Đau hơn bị cúp điện.", "nervous"],
        ],
        gives: { words: ["den-led"], flags: ["beo-den-led"] },
      },
    },
    "ongnam-o-nha": {
      by: "ongnam",
      text: "Tối nay tui ở [[nha-ong-nam|nhà]] ngủ từ 8 giờ, cửa đóng then cài, không ra ngoài.",
      break: {
        clue: "den-pin-ong-nam",
        lines: [
          ["me", "Đèn pin \"Thanh tra phường – Năm – 1998\", rớt ngay góc tủ điện. Và cửa sau nhà ông mở ra đúng hẻm sau sân khấu.", "neutral"],
          ["ongnam", "...", "shock"],
          ["ongnam", "Đó là... ông già nào đó cũng làm thanh tra năm 98, tên Năm.", "nervous"],
          ["teo", "Ông Năm ơi, câu này ông xài mùa trước rồi. Ông ra câu mới đi ông.", "smug"],
          ["ongnam", "...Cậu nhớ dai quá.", "angry"],
        ],
        gives: { words: ["21h08"], flags: ["ongnam-ra-ngoai"] },
      },
    },
    "cosau-ngoi-ghe": {
      by: "cosau",
      text: "Từ đầu tới cuối tui ngồi ghế trưởng ban, không rời nửa bước.",
      break: {
        clue: "clip-livestream",
        lines: [
          ["me", "Livestream của bà Tư, 21 giờ 13: ghế trưởng ban trống trơn. 21 giờ 14, ngay khi tối thui, từ sau phông sân khấu có tiếng cô thét: \"Trời đất ơi tui chưa rút mà!\"", "neutral"],
          ["cosau", "...", "shock"],
          ["batu", "Giọng chị Sáu đó, cả hẻm nghe là biết. Bà quay rõ mồn một.", "smug"],
          ["cosau", "Bà Tư! Bà quay gì quay hết vậy!", "angry"],
        ],
        gives: { words: ["sau-san-khau"], flags: ["cosau-roi-ghe"] },
      },
    },
    "anhtung-tu-moi": {
      by: "anhtung",
      text: "Tủ lạnh giải nhất mới một trăm phần trăm, nhà tài trợ tặng.",
      break: {
        clue: "tem-tu-lanh",
        lines: [
          ["me", "Dưới tờ giấy \"MỚI 100%\" là tem bảo hành năm 2009. Hông tủ còn vết nam châm: \"Tùng ăn vụng là chết với má\".", "neutral"],
          ["anhtung", "...", "shock"],
          ["anhtung", "Sao anh đọc được chữ đó! Tui chà ba lần rồi!", "nervous"],
          ["teo", "Chà ba lần mà chữ má viết vẫn còn. Chữ má viết là chữ vĩnh cửu.", "smug"],
        ],
        gives: { words: ["tu-lanh-cu"], flags: ["tu-cua-ma"] },
      },
    },
  },

  present: {
    anhtung: {
      "micro-kim-sa": [
        ["anhtung", "Micro riêng của cô Thu. Năm ngoái cổ xin cắm bluetooth vô dàn tui, nói micro này \"âm thanh đặc biệt\". Tui đâu có nghĩ gì.", "shock"],
        ["anhtung", "Trời đất. Vậy năm ngoái dàn tui phát giọng thu sẵn cả bài mà tui không biết?", "shock"],
      ],
      "den-led-ngoc": [
        ["anhtung", "Thằng Béo cắm đèn mà không hỏi tui! ...Mà 5 oát thì thôi, kệ nó. Lãng mạn mà.", "neutral"],
      ],
      "clip-livestream": [
        ["anhtung", "Thấy chưa, tui ngồi bàn dàn từ đầu tới cuối. Tui la \"ai cúp điện\" rõ to luôn.", "smug"],
      ],
    },
    cothu: {
      "kim-sa-chot": [
        ["cothu", "Kim sa thì ai mặc chẳng có! Cả hẻm này áo kim sa đầy ra!", "angry"],
        ["teo", "Tối nay cả hẻm có đúng một người mặc kim sa vàng, cô ơi.", "smug"],
      ],
      "den-pin-ong-nam": [
        ["cothu", "Đó! Ông Năm! Đèn pin ông Năm ở tủ điện! Ổng ghét ồn, ổng doạ cúp điện cả tuần nay!", "angry"],
      ],
      "clip-nam-ngoai": [
        ["cothu", "Clip quay bằng điện thoại thì tiếng nó trễ! Ai cũng biết!", "nervous"],
        ["me", "Trễ ba mươi giây?", "neutral"],
        ["cothu", "...Điện thoại cũ.", "nervous"],
      ],
      "tem-tu-lanh": [
        ["cothu", "Tủ lạnh cũ hả? Vậy hoãn thi cũng đâu có mất gì. Tui nói rồi, hoãn là hay nhất.", "neutral"],
      ],
    },
    beo: {
      "clip-livestream": [
        ["beo", "Lúc đó em đang hát... đúng câu đó. Em còn chưa kịp nói chữ \"ơi\" cho tròn.", "nervous"],
      ],
      "micro-kim-sa": [
        ["beo", "Micro có thẻ nhớ... Vậy là tai em không có vấn đề. Năm ngoái em không nghe lộn.", "shock"],
        ["beo", "Em tập hát một năm để thi với một cái thẻ nhớ.", "nervous"],
      ],
      "tem-tu-lanh": [
        ["beo", "Tủ lạnh cũ cũng được anh. Em ở trọ, có tủ lạnh là sang rồi. Mà... có mùi mắm ruốc thiệt hả anh?", "neutral"],
      ],
    },
    cosau: {
      "den-led-ngoc": [
        ["cosau", "Đó! Cái bảng đèn đó! \"NGỌC ƠI\"! Nó tính tỏ tình con gái tui trước mặt cả hẻm!", "angry"],
        ["cosau", "Mà sao nó làm cái trái tim đẹp vậy... Không, không được khen.", "nervous"],
      ],
      "micro-kim-sa": [
        ["cosau", "Thẻ nhớ? Giọng thu sẵn? Vậy năm ngoái tui chấm mười điểm cho... cái thẻ nhớ?!", "shock"],
        ["cosau", "Hai chục năm hát đám cưới, tui bị một cái micro lừa. Tui tự trừ tui năm điểm.", "nervous"],
      ],
      "clip-nam-ngoai": [
        ["cosau", "Phút 3:12... Năm ngoái tui đang lau nước mắt đúng đoạn này. Tui không thấy gì.", "nervous"],
      ],
    },
    ongnam: {
      "non-la-kim-tuyen": [
        ["ongnam", "Cái nón đó... của ai bỏ quên. Đừng đụng vô, kim tuyến dính tay, rửa không sạch đâu.", "nervous"],
        ["teo", "Sao ông biết rửa không sạch vậy ông?", "smug"],
        ["ongnam", "...Đoán.", "angry"],
      ],
      "danh-sach-bai": [
        ["ongnam", "Ca Sĩ Nón Lá hát \"Đêm Buồn Tỉnh Lẻ\" hả? Bài đó khó. Người nào hát được bài đó chắc... luyện lâu.", "neutral"],
      ],
      "clip-livestream": [
        ["ongnam", "Ông áo ngủ sọc nào đó lau nước mắt. Bụi bay vô mắt. Hẻm này bụi.", "nervous"],
      ],
    },
  },

  wrong: {
    anhtung: [
      [["anhtung", "Cái này hả? Không liên quan nha anh. Mà anh đọc lên micro đi, tui thu âm làm clip.", "neutral"]],
      [["anhtung", "Trật nhịp rồi anh ơi. Như thí sinh vô sai tông.", "neutral"]],
      [["anhtung", "Anh làm vậy là tui trừ điểm thần thái đó. À tui đâu phải giám khảo.", "nervous"]],
    ],
    cothu: [
      [["cothu", "Đưa cái gì vậy? Tui là quán quân, tui không có thời gian cho mấy thứ lặt vặt.", "smug"]],
      [["cothu", "Lạc đề. Như hát Bolero mà vô nhịp Rap.", "angry"]],
      [["cothu", "(chỉnh lại tóc) Thám tử ơi, tui còn phải ôn bài. Đưa đúng rồi hẵng gọi.", "neutral"]],
    ],
    beo: [
      [["beo", "Dạ... cái này em không hiểu. Em chỉ hiểu nốt nhạc thôi anh.", "nervous"]],
      [["beo", "Anh ơi lạc tông rồi. Mà em không dám nói lớn.", "nervous"]],
      [["beo", "Cái này mà viết thành bài hát chắc tên là \"Thám Tử Đưa Nhầm\".", "neutral"], ["teo", "Nghe bắt tai ghê. Thằng Béo có khiếu thiệt.", "happy"]],
    ],
    cosau: [
      [["cosau", "Sai! Trừ hai điểm! Không, trừ ba điểm, tội đưa sai trước mặt trưởng ban!", "angry"]],
      [["cosau", "Thám tử mà vầy thì năm sau đừng đăng ký làm giám khảo nha.", "smug"]],
      [["cosau", "(phe phẩy quạt) Lập luận này không có thần thái. Không có lễ phép. Không có điểm.", "neutral"]],
    ],
    ongnam: [
      [["ongnam", "Cái gì đây? Cậu đưa cái này cho tui coi thì tui coi. Coi xong thì: trật.", "angry"]],
      [["ongnam", "Hồi xưa tui làm thanh tra, đưa chứng cứ kiểu này là bị đuổi về viết bản kiểm điểm.", "angry"]],
      [["ongnam", "Ồn ào. Lập luận cũng ồn ào. Về đi.", "neutral"]],
      [["ongnam", "(rít điếu cày) ...Lại sai. Năm ngoái sai, năm nay sai.", "neutral"], ["teo", "Ổng nhắc lại mùa trước. Ổng nhớ dai hơn em.", "nervous"]],
    ],
  },

  deduction: [
    {
      id: "dien",
      text: "Laptop ghi bài của Béo bắt đầu lúc {a} và mất tín hiệu lúc {b}, ở phút 1:52. Cần gạt cầu dao nằm tận đáy: nó bị {c}, không phải nhảy vì quá tải.",
      blanks: {
        a: { answer: "21h12", kind: "luc" },
        b: { answer: "21h14", kind: "luc" },
        c: { answer: "gat-tay", kind: "cach" },
      },
      explain: [
        ["me", "Cầu dao nhảy thì nằm lưng chừng. Chú Ba thấy nó dưới đáy. Tổng tải 2,8 kí lô oát trên 8. Không có quá tải. Có một bàn tay.", "neutral"],
        ["teo", "Vậy là đổ cho đèn LED của thằng Béo là oan. 5 oát mà gánh tội 40 ampe.", "nervous"],
      ],
    },
    {
      id: "vi-tri",
      text: "Lúc 21 giờ 14, Béo hát trên {a}, ông Năm ngồi {b}, anh Tùng ở bàn dàn loa, cô Sáu la lên sau phông. Chỉ người cầm {c} là đứng ngay tủ điện.",
      blanks: {
        a: { answer: "san-khau", kind: "o" },
        b: { answer: "hang-ghe-cuoi", kind: "o" },
        c: { answer: "mic-2", kind: "vat" },
      },
      explain: [
        ["me", "Livestream của bà Tư chỉ ra bốn chỗ đứng: sân khấu, bàn dàn loa, hàng ghế cuối, sau phông. Không chỗ nào là tủ điện.", "neutral"],
        ["me", "Laptop nghe được cái mà camera không thấy: MIC 2 ghi tiếng \"két\" của cánh tủ điện rồi tiếng \"tách\", đúng 21 giờ 14 phút 07.", "neutral"],
        ["teo", "Camera thấy bốn người vô tội. Micro nghe ra người thứ năm. Sếp ơi vụ này phá bằng tai!", "shock"],
      ],
    },
    {
      id: "noi-doi",
      text: "{a} nói dối là ngồi {b} suốt. Thật ra cô ra tủ điện, vạt áo mắc vào chốt tủ để lại mảng {c}, rồi quay về thay áo bạc dự phòng.",
      blanks: {
        a: { answer: "cothu", kind: "ai" },
        b: { answer: "ban-trang-diem", kind: "o" },
        c: { answer: "kim-sa-vang", kind: "vat" },
      },
      explain: [
        ["me", "Sổ mượn micro: MIC 2 ở cô Thu từ 9 giờ, không trả. Người cầm MIC 2 đứng ở tủ điện lúc 21 giờ 14.", "neutral"],
        ["me", "Mảng kim sa vàng mắc ở chốt tủ. Tối nay cả hẻm chỉ một người mặc áo kim sa vàng, và giờ cô ấy đang mặc áo bạc.", "neutral"],
      ],
    },
    {
      id: "dong-co",
      text: "Thủ phạm cúp điện vì {a}: chiếc {b} phát giọng thu sẵn đã bể, chung kết sắp bắt cô phải hát bằng giọng thật.",
      blanks: {
        a: { answer: "so-lo-nhep", kind: "vi" },
        b: { answer: "micro-kim-sa", kind: "vat" },
      },
      explain: [
        ["me", "Năm ngoái micro kim sa phát giọng thu sẵn qua bluetooth. Tối nay nó rớt bể. 9 giờ 05, cô thử hát thật vào MIC 2, và chính cô nghe ra mình không hát nổi.", "neutral"],
        ["me", "Tiết mục của cô lúc 9 giờ 20. Cúp điện thì chung kết hoãn, danh hiệu quán quân giữ thêm một năm.", "neutral"],
        ["teo", "Không phải ghét Béo, không phải ghét ồn. Là sợ chính giọng mình.", "nervous"],
      ],
    },
  ],

  finale: {
    culprit: "cothu",
    intro: [
      ["narr", "10 giờ 30 tối. Đèn sân khấu sáng trở lại. Hai trăm cái ghế nhựa kín người, có người ôm nồi chè, có người ôm con."],
      ["batu", "(giơ điện thoại lên cao) Bà con ơi, phần thi đặc biệt: thám tử vạch mặt! Lên sóng nè!", "happy"],
      ["anhtung", "(cầm micro) Xin mời... thám tử!", "nervous"],
      ["teo", "Em biết rồi! Người cúp điện là... (nhìn quanh) ...là người có đèn pin!", "smug"],
      ["ongnam", "Cậu nói ai?!", "angry"],
      ["me", "Không phải ông Năm. Cô Thu, mời cô lên sân khấu. Lần này không cần micro riêng.", "neutral"],
    ],
    steps: [
      {
        claim: [
          ["cothu", "Tui nói rồi, quá tải! Thằng Béo cắm đèn bậy, cầu dao chịu không nổi thì nhảy!", "angry"],
          ["cothu", "Chuyện điện đóm mắc gì tới tui?", "smug"],
        ],
        answer: "cau-dao-gat-tay",
        right: [
          ["me", "Cầu dao nhảy vì quá tải thì cần gạt nằm lưng chừng. Chú Ba tới, cần gạt nằm dưới tận đáy. Nó bị gạt tay.", "neutral"],
          ["chuba", "Đúng! Chú gạt lên mỏi tay!", "neutral"],
          ["beo", "Đèn em 5 oát mà! Em nói hoài!", "nervous"],
        ],
        wrong: [["cothu", "Thấy chưa, đâu có gì. Quá tải là quá tải.", "smug"], ["beo", "Anh ơi cứu em, em đang bị nghi kìa...", "nervous"]],
        hint: "Cô Thu nói cầu dao nhảy. Mà chú Ba nói cái cần gạt nằm ở đâu lúc chú tới? Cầu dao nhảy thì nằm chỗ nào?",
      },
      {
        claim: [
          ["cothu", "Ai gạt thì gạt. Tui ngồi bàn trang điểm suốt, có ai thấy tui ở tủ điện đâu?", "angry"],
          ["cothu", "Livestream bà Tư quay hết mà, có tui trong đó không?", "smug"],
        ],
        answer: "kenh-mic-2",
        right: [
          ["me", "Không ai thấy. Nhưng có một thứ nghe thấy. MIC 2 cô mượn lúc 9 giờ, kênh tắt tiếng ra loa nhưng laptop vẫn ghi.", "neutral"],
          ["anhtung", "(bấm laptop, mở loa) Mời bà con nghe.", "neutral"],
          ["narr", "Tiếng bước chân. Tiếng \"KÉÉÉT\" chói tai. Tiếng \"TÁCH\". Cả hẻm im phăng phắc, rồi ai đó thì thào: \"tiếng cửa tủ điện\"."],
          ["cothu", "...", "shock"],
        ],
        wrong: [["cothu", "Đó, không có gì hết. Livestream không có tui.", "smug"], ["batu", "Bà quay hết mà, đúng là không thấy cổ thiệt...", "nervous"]],
        hint: "Camera không thấy, thì có cái gì nghe được không sếp? Laptop anh Tùng ghi âm từng kênh micro đó!",
      },
      {
        claim: [
          ["cothu", "MIC 2 tui trả lúc 9 giờ 10 rồi! Ai cầm sau đó thì người đó ra tủ điện!", "angry"],
          ["cothu", "Ông Năm rớt đèn pin ở đó kìa! Nón lá kim tuyến cũng ở đó! Sao không hỏi ổng?", "angry"],
          ["ongnam", "Kim tuyến của tui là bột! Tui đâu có rớt hạt!", "angry"],
        ],
        answer: "ao-vang-rach",
        right: [
          ["me", "Ông Năm nói đúng. Kim tuyến là bột. Thứ mắc ở chốt tủ điện là một mảng kim sa vàng, hạt tròn may trên lưới.", "neutral"],
          ["me", "Và đây là cái áo kim sa vàng của cô, cuộn giấu giữa hai thùng loa trên xe ba gác. Lỗ rách ở vạt phải. Ghép mảng ở chốt tủ vô: khớp từng hạt.", "neutral"],
          ["me", "Cô thay áo bạc dự phòng sau khi cúp điện, rồi mới chạy ra la \"quá tải\".", "neutral"],
          ["cothu", "...", "shock"],
        ],
        wrong: [["cothu", "Đó! Hỏi ông Năm đi! Đèn pin ổng ở đó mà!", "angry"], ["ongnam", "Cậu đưa cái gì vậy! Tui đang bị chỉ mặt nè!", "angry"]],
        hint: "Ở chốt tủ điện mắc cái gì? Kim tuyến của ông Năm là bột, còn cái mắc ở chốt là hạt. Áo của ai bị rách?",
      },
      {
        claim: [
          ["cothu", "Tui là quán quân! Tui hát hay nhất hẻm này! Tui cần gì phải phá chung kết?", "angry"],
          ["cothu", "Có phá thì người phá phải là người sợ thua. Tui đâu có sợ thua ai!", "smug"],
        ],
        answer: "micro-kim-sa",
        right: [
          ["me", "Cô không sợ thua. Cô sợ phải hát. Micro kim sa của cô có bluetooth và một thẻ nhớ chứa đúng một file: \"Bông Điên Điển, giọng Thu, bản full\".", "neutral"],
          ["me", "Tối nay nó rớt bể. 9 giờ 05, cô thử hát thật vào MIC 2. File ghi âm còn đó.", "neutral"],
          ["anhtung", "(bấm laptop) ...", "nervous"],
          ["narr", "Loa vang lên một đoạn \"Bông Điên Điển\" phô, lạc tông, hụt hơi ở chữ thứ ba. Cả hẻm nín thở. Rồi cả hẻm... nín cười."],
          ["cosau", "Năm ngoái tui chấm mười điểm cho cái thẻ nhớ...", "shock"],
        ],
        wrong: [["cothu", "Thấy chưa? Quán quân là quán quân!", "smug"], ["cosau", "Thám tử ơi, đưa cái này thì tui chưa trừ điểm cổ được đâu.", "neutral"]],
        hint: "Cô Thu nói mình hát hay nhất. Mà cái micro riêng của cô trên bàn trang điểm có gì bên trong ta?",
      },
    ],
    confess: [
      ["cothu", "...Phải. Tui gạt cầu dao.", "nervous"],
      ["cothu", "Năm ngoái tui đăng ký cho vui. Tới vòng chung kết thì run quá, giọng tắt luôn. Tui nhờ thằng cháu thu âm sẵn một bản, chỉnh cho ngọt, chép vô cái micro bluetooth.", "nervous"],
      ["cothu", "Tui tính hát nhép một lần rồi thôi. Ai dè thắng. Cả hẻm gọi tui là quán quân. Đi chợ người ta bớt tiền rau. Tui không dám nói ra.", "nervous"],
      ["cothu", "Tối nay 9 giờ, tui làm rớt cái micro. Nắp pin văng mất, kiếm không ra. Tui mượn MIC 2, ra sau tập thử... Bà con nghe rồi đó.", "shock"],
      ["cothu", "9 giờ 20 là tới lượt tui. Tui nghĩ: cúp điện thì hoãn. Hoãn thì không ai phải nghe tui hát thật.", "nervous"],
      ["cothu", "Tui ra tủ điện, mở cửa, gạt. Áo móc vô cái chốt, rách. Tui quýnh lên, giấu micro, giấu áo, thay áo. Rồi đổ cho thằng Béo.", "nervous"],
      ["cothu", "Béo... cô xin lỗi con. Con hát hay thiệt. Đó là lý do cô sợ.", "nervous"],
      ["beo", "...", "shock"],
    ],
    epilogue: [
      ["anhtung", "Bà con ơi! Đã gần 11 giờ, mà chung kết chưa xong. Cho tui xin mười lăm phút nữa!", "nervous"],
      ["ongnam", "(đứng dậy ở hàng ghế cuối) Cho. Hôm nay cho hát tới 11 giờ rưỡi.", "neutral"],
      ["teo", "Sếp ơi! Ông Năm cho phép ồn! Lịch sử Hẻm 47!", "shock"],
      ["ongnam", "Và tui có một chuyện phải nói.", "neutral"],
      ["narr", "Ông Năm lấy ra từ sau lưng một cái nón lá dán kim tuyến, đội lên đầu. Cả hẻm ồ lên."],
      ["ongnam", "Ca Sĩ Nón Lá là tui. Bốn chục năm chửi karaoke. Từ nay tui bớt chửi.", "nervous"],
      ["batu", "TRỜI ƠI! Bà livestream được cảnh này là bà mãn nguyện rồi!", "happy"],
      ["beo", "Thưa ban giám khảo. Cho em hát lại. Không cần điện. Em có đàn guitar thùng.", "neutral"],
      ["narr", "Béo ngồi mép sân khấu, đánh đàn mộc. Cả hẻm bật đèn pin điện thoại. Tới điệp khúc, bảng đèn \"NGỌC ƠI\" sáng lên."],
      ["cosau", "...Thôi. Bài hay. Lễ phép được. Tui trả lại hai điểm.", "nervous"],
      ["teo", "Sếp ơi, hàng thứ ba có một bạn nữ đang khóc! Chắc là Ngọc!", "happy"],
      ["cothu", "(cầm MIC 1, run run) Cho tui hát một lần. Giọng thật. Không chấm điểm.", "nervous"],
      ["narr", "Cô Thu hát \"Bông Điên Điển\". Phô. Lạc tông. Hụt hơi chữ thứ ba. Nhưng hát hết bài. Hẻm vỗ tay lâu hơn năm ngoái."],
      ["anhtung", "Kết quả! Giải nhất \"Giọng Ca Vàng Hẻm 47\": Béo! Giải đặc biệt: Ca Sĩ Nón Lá! Giải can đảm: cô Thu!", "happy"],
      ["anhtung", "Và... tủ lạnh giải nhất là tủ của má tui. Má ơi con xin lỗi. Bà con ai góp được đồng nào mua tủ mới cho má tui thì góp.", "nervous"],
      ["beo", "Anh Tùng ơi, em nhận tiền mặt giải nhất thôi, tủ trả lại cho bác gái. Em ở trọ, phòng không đủ chỗ.", "happy"],
      ["chuba", "Chú báo trước: 11 giờ rưỡi chú gạt cầu dao đó nha. Lần này là chú gạt, có ghi sổ đàng hoàng.", "neutral"],
      ["batu", "Bà Tư đã đăng: \"ĐÊM KARAOKE CÚP ĐIỆN: cầu dao, micro biết hát và ông Năm đội nón lá\". Bốn ngàn like rồi!", "happy"],
    ],
    comments: [
      { by: "batu", text: "Đêm chung kết lịch sử: cúp điện, phá án, lộ hát nhép, ông Năm là Ca Sĩ Nón Lá, Béo tỏ tình thành công 🎤💡 Bà Tư hết pin điện thoại 3 lần", likes: 4512 },
      { by: "Ông Năm (Hẻm 47)", text: "Hát tới 11 giờ rưỡi là ngoại lệ. Từ mai lại 10 giờ. Mà ai muốn học bolero thì gõ cửa sau nhà tui. Gõ nhỏ thôi.", likes: 3870 },
      { by: "Tiểu Thư Bánh Bèo 2k5", text: "Bảng đèn NGỌC ƠI sáng lên giữa hẻm, cả trăm đèn pin điện thoại... em khóc như mưa mùa hẻm nhỏ 😭😭", likes: 4033 },
      { by: "Dân Âm Thanh Hẻm Bên", text: "Bài học: tắt tiếng ra loa KHÁC với tắt ghi âm. Ai làm âm thanh đều biết. Cô Thu thì không 🎚️", likes: 2210 },
      { by: "Hai Lúa Cho Thuê Bàn Ghế", text: "Tui hát Lý Cây Bông không ai nhắc. Thôi kệ, ghế của tui có mặt đủ 200 cái 🪑", likes: 1544 },
      { by: "Chị Hai Kế Toán Q3", text: "Cầu dao 40A chịu 8kW, sân khấu 2,8kW. Ai đổ cho đèn LED 5W là chưa học vật lý lớp 9 nha", likes: 1980 },
      { by: "Cô Út Cà Phê", text: "Ông Năm ơi, quán Út có góc bolero tối thứ Bảy, mời ông Nón Lá ghé hát, Út bao bạc xỉu 🎶", likes: 2387 },
      { by: "Lộc Nhà Mạng", text: "Mùa trước ông Năm bị nghi cắt cáp, mùa này bị nghi cúp điện. Ông Năm là nghi phạm quốc dân nhưng chưa từng có tội 😂", likes: 2675 },
      { by: "Team Cô Thu", text: "Hát nhép là sai, gạt cầu dao càng sai. Nhưng dám đứng lên hát giọng thật trước cả hẻm là can đảm thiệt. Giải can đảm xứng đáng 👏", likes: 2901 },
      { by: "Shop Micro Bluetooth Giá Rẻ", text: "Micro bluetooth có thẻ nhớ, chống bể... à thôi shop xin rút quảng cáo hôm nay 🙏", likes: 1322 },
      { by: "Ngọc (Bách Khoa)", text: "Ba năm mới chịu nói. Béo ơi lần sau đừng cắm đèn lén nữa, mẹ em là trưởng ban đó 😳💛", likes: 5120 },
      { by: "teo", text: "Em đoán ông Năm. Gần đúng: ổng có mặt ở tủ điện, chỉ sai giờ với sai tội 😤", likes: 1011 },
      { by: "Má Anh Tùng", text: "Thằng Tùng! Tủ lạnh của má đâu?! Về nhà nói chuyện! (Mà bài thằng Béo hay, má thích)", likes: 3456 },
      { by: "chuba", text: "11 giờ 30 chú đã gạt cầu dao đúng giờ, có ghi sổ. Đây là lần đầu tiên chú không tới trễ", likes: 1789 },
    ],
  },

  hints: [
    {
      needs: ["clue:kenh-mic-2", "clue:ao-vang-rach", "clue:micro-kim-sa", "clue:clip-livestream"],
      text: "Sếp ơi đủ đồ rồi! Cầu dao, laptop, MIC 2, áo vàng rách, micro kim sa. Ra bảng suy luận xếp lại ai đứng đâu lúc 9 giờ 14 rồi chốt đi sếp!",
    },
    {
      needs: "clue:kim-sa-chot",
      done: "clue:ao-vang-rach",
      text: "Mảng kim sa vàng mắc ở chốt tủ điện. Áo kim sa vàng đâu rồi ta? Cô Thu đang mặc áo bạc mà. Sếp lục hậu trường coi, cả mấy chỗ có bạt che.",
    },
    {
      needs: ["clue:log-laptop", "clue:so-muon-mic"],
      done: "clue:kenh-mic-2",
      text: "Laptop ghi âm từng kênh, mà MIC 2 đang ở chỗ cô Thu. Sếp hỏi anh Tùng mở file ghi âm kênh MIC 2 coi!",
    },
    {
      needs: "stmt:cothu-hat-live",
      done: "broke:cothu-hat-live",
      text: "Cô Thu nói năm ngoái hát live. Thằng Béo có quay clip năm ngoái đó sếp. Mà cái micro riêng của cô Thu nằm ở bàn trang điểm, soi thử coi.",
    },
    {
      needs: "stmt:cothu-qua-tai",
      done: "broke:cothu-qua-tai",
      text: "Cô Thu nói quá tải. Mà chú Ba nói cần gạt nằm tận đáy. Sếp ra tủ điện coi cái cầu dao với cái sổ điện đi.",
    },
    {
      needs: "stmt:cosau-ngoi-ghe",
      done: "broke:cosau-ngoi-ghe",
      text: "Cô Sáu thề không rời ghế. Bà Tư livestream không sót giây nào. Sếp coi lại điện thoại bà Tư ở mép sân khấu đi.",
    },
    {
      needs: "stmt:ongnam-o-nha",
      done: "broke:ongnam-o-nha",
      text: "Ông Năm nói ở nhà ngủ. Mà góc tủ điện có cây đèn pin khắc tên ai đó sếp. Em đã nói rồi mà!",
    },
    {
      text: "Em đoán ông Năm. Lần này chắc chắn. Mà sếp cứ soi cái cầu dao với cái laptop dàn loa trước đi, cho chắc.",
    },
  ],

  bonus: [
    {
      id: "cau-dao",
      q: "Vì sao biết cầu dao bị gạt tay chứ không phải nhảy vì quá tải?",
      choices: ["Cần gạt nằm tận đáy, không lưng chừng", "Cầu dao còn ấm", "Có dấu vân tay chú Ba", "Đèn LED bị cháy"],
      answer: 0,
      explain: "Cầu dao nhảy vì quá tải thì cần gạt về lưng chừng. Chú Ba tới thấy nó nằm dưới tận đáy. Tổng tải 2,8kW cũng không đủ làm nhảy cầu dao 40A.",
    },
    {
      id: "kim-sa",
      q: "Thứ mắc ở chốt tủ điện khác đồ của Ca Sĩ Nón Lá ở chỗ nào?",
      choices: ["Kim sa là hạt tròn may trên vải, kim tuyến là bột", "Kim sa màu bạc, kim tuyến màu vàng", "Kim tuyến to hơn kim sa", "Không khác gì"],
      answer: 0,
      explain: "Nón lá của ông Năm dán kim tuyến bạc dạng bột. Chốt tủ mắc một mảng lưới đính hạt kim sa vàng, khớp lỗ rách trên áo vàng của cô Thu.",
    },
    {
      id: "ca-si",
      q: "Ca Sĩ Nón Lá là ai?",
      choices: ["Ông Năm", "Anh Tùng", "Chú Ba dân phòng", "Hai Lúa"],
      answer: 0,
      explain: "Ông Năm, giải ba tiếng hát phường năm 1985. Bốn chục năm chửi karaoke, lén đội nón lá đi hát. Mùa trước trốn coi bóng đá, mùa này trốn đi hát.",
    },
  ],
};
