// Vụ 4: "Đêm Chung Kết Mất Wifi" (độ khó 2). Hợp đồng nhân vật / cảnh / đồ vật: docs/tham-tu-hem/DESIGN.md §3.
// Lời giải (KHÔNG hiện cho người chơi):
//   Thủ phạm: cô Út. 14:10 nhắn hỏi Lộc "cáp đứt thì mấy tiếng sửa", 15:00 ký phiếu thuê 30 ghế nhựa,
//   chiều may băng rôn bằng chỉ đỏ. 19:12 đội nón lá, đeo tạp dề nâu, đứng lên bánh xe ba gác dưới chân cột
//   (dây võng thấp ~2 m), cắt bó cáp của hẻm một nhát bằng kéo cắt chỉ (còn quấn chỉ đỏ). Quán cô đi cáp riêng
//   từ đường lớn nên vẫn có sóng => cả hẻm kéo vào quán, sổ bán hàng 214 ly (bình thường ~40).
//   Gây nhiễu: ông Năm (bảng "CẮT DÂY cho yên", kéo tỉa kiểng, khai ngủ từ 7 giờ nhưng thật ra là fan bóng đá lén
//   vào quán), Lộc (kỹ thuật nhà mạng, có kìm cắt cáp, có phụ cấp sửa đêm, khai tới 20:15 nhưng thật ra ngồi quán
//   từ 17:40 vì thầm thương cô Út), Tí (ghét bóng đá vì ping cao, có dao rọc giấy; nhưng chính Tí bị rớt mạng giữa trận rank).
//   Kết hợp 2 vật chứng: vết cắt phẳng có sợi chỉ đỏ + kéo cắt chỉ quấn chỉ đỏ, dính vụn nhựa đen (và băng rôn chỉ đỏ may chiều nay).
export default {
  id: "mat-wifi",
  no: 4,
  title: "Đêm Chung Kết Mất Wifi",
  tagline: "Cả hẻm mất sóng đúng đêm chung kết. Chỉ một quán cà phê còn sáng đèn, và đông nghẹt.",
  difficulty: 2,
  client: "chuba",

  intro: [
    ["narr", "Tối thứ Bảy, 7 giờ 40. Hẻm 47 treo cờ đỏ sao vàng từ đầu tới cuối. Đêm nay [[chung-ket|chung kết]] Cúp Đông Nam Á."],
    ["narr", "Văn phòng Thám Tử Lụm tối om. Cái tivi đứng hình ở logo nhà mạng với dòng chữ: \"Mất kết nối\"."],
    ["teo", "SẾP ƠIIII! Mất mạng! Mất truyền hình! Mất luôn ý nghĩa cuộc sống!", "shock"],
    ["me", "Bình tĩnh. Bóng lăn chưa?", "neutral"],
    ["teo", "[[19h30|7 giờ 30]] lăn rồi sếp! Cả hẻm mất sóng từ trước đó luôn! Em đang nghe tường thuật qua... tiếng hét của quán cô Út.", "nervous"],
    ["narr", "Từ đầu hẻm vọng lại tiếng hò reo, tiếng trống, tiếng ghế nhựa kéo rột rẹt."],
    ["chuba", "(thở hồng hộc ở cửa) Thám tử! Chú tới... hơi trễ. Chú đạp xe từ phường về, bị kẹt xe cổ động viên.", "nervous"],
    ["chuba", "Bà con báo phường: cáp mạng nguyên hẻm đứt cái phựt, ngay [[cot-dien|cột điện đầu hẻm]]. Chú ra coi rồi. Không phải đứt. Là bị CẮT.", "shock"],
    ["me", "Cắt?", "neutral"],
    ["chuba", "Ngọt xớt. Cả hẻm năm mươi mấy nhà mất sóng. Nhà mạng nói đêm nay không có đội sửa.", "angry"],
    ["chuba", "Giờ cả hẻm dồn hết vô [[quan-ut|quán cô Út]]. Quán đó còn sóng, đông như trẩy hội, ghế ngồi tràn ra tới giữa hẻm.", "neutral"],
    ["teo", "Sếp, em biết rồi! Là người ngoài hành tinh. Họ không muốn mình vô địch.", "smug"],
    ["me", "Tèo, lấy đèn pin.", "neutral"],
    ["batu", "(gọi video vô điện thoại Tèo) Thám tử ơi! Bà Tư đang ngồi quán cô Út nè, còn đúng một cái ghế, bà giữ cho thám tử! Tỉ số đang 0–0!", "happy"],
    ["chuba", "Phường giao vụ này cho thám tử. Phải tìm ra trước khi trận đấu kết thúc. Không thì cả hẻm kéo nhau đi... đi đâu chú cũng không biết nữa.", "nervous"],
    ["me", "Đi thôi. Bắt đầu từ cái cột điện.", "neutral"],
  ],

  social: {
    group: "Hẻm 47 Hóng Biến",
    posts: [
      {
        by: "Ông Năm (Hẻm 47)",
        text: "THÔNG BÁO. Đứa nào còn mở loa kẹo kéo hát karaoke \"cổ vũ\" tới 11 giờ đêm nữa thì tui CẮT DÂY cho yên. Người già cần ngủ. (đăng 2 ngày trước)",
        likes: 34,
        comments: [
          { by: "ti", text: "đồng ý ông Năm 👍 cả hẻm coi bóng, mạng lag ping 999. ước gì cả hẻm mất mạng trừ nhà con" },
          { by: "Cô Ba Bán Xôi", text: "Ông Năm ơi, năm nay chung kết, ông thông cảm cho tụi nhỏ" },
          { by: "Ông Năm (Hẻm 47)", text: "Không thông cảm. Bóng đá là 22 người chạy theo 1 trái banh. Vô bổ." },
        ],
      },
      {
        by: "batu",
        text: "🚨🚨 KHẨN CẤP 🚨🚨 MẤT MẠNG TOÀN HẺM NGAY TRƯỚC GIỜ BÓNG LĂN!!! Cáp ở cột điện đầu hẻm bị CẮT (chú Ba xác nhận). Ai làm? Ai hưởng lợi? Bà Tư không nói, bà Tư chỉ đăng hình quán cô Út đang chật ních thôi 📸 #ChungKet #Hem47",
        likes: 1680,
        comments: [
          { by: "teo", text: "Thám tử nhà mình đã vào cuộc!!! 🔍" },
          { by: "Hùng Xe Ôm", text: "Ông Năm doạ cắt dây 2 ngày trước rồi đó bà con. Tui nói vậy thôi" },
          { by: "Shop Cục Phát Wifi 4G Giá Rẻ", text: "Mất mạng? Cục phát 4G chỉ 299k, ship hoả tốc 30 phút, kịp coi hiệp 2!!! Inbox ngay 📶" },
          { by: "Tiểu Thư Bánh Bèo 2k5", text: "Mất wifi thì còn ráng được, mất anh thì em không chịu nổi 💔" },
          { by: "Người Hâm Mộ Số 1", text: "Đang 0–0 mà nghe tiếng hét quán cô Út thì tưởng mình thắng 5–0 rồi" },
          { by: "chuba", text: "Đã báo phường. Đã nhờ thám tử. Chú đang trên đường." },
        ],
      },
    ],
  },

  people: {
    ongnam: {
      name: "Ông Năm",
      role: "Hàng xóm khó tính",
      bio: "68 tuổi, áo ngủ sọc, điếu cày không rời tay. Ghét ồn ào, ghét karaoke, ghét \"22 người chạy theo một trái banh\". Hiên nhà nhìn thẳng ra cột điện.",
      suspect: true,
    },
    loc: {
      name: "Lộc",
      role: "Kỹ thuật nhà mạng",
      bio: "27 tuổi, đồng phục cam, giày bảo hộ mũi sắt, cuộn dây trên vai, thắt lưng đồ nghề đủ loại. Hiền, nói chuyện với cô Út thì lắp bắp.",
      suspect: true,
    },
    cout: {
      name: "Cô Út",
      role: "Chủ quán cà phê đầu hẻm",
      bio: "35 tuổi, tóc búi củ hành, tạp dề nâu. Quán của ba để lại, bán hai chục năm. Pha bạc xỉu ngon nhất hẻm, tính toán cũng giỏi nhất hẻm.",
      suspect: true,
    },
    ti: {
      name: "Tí",
      role: "Game thủ 16 tuổi",
      bio: "Tai nghe gaming đèn bảy màu, mắt thâm như gấu trúc, dép quai hậu không rời chân. Đang leo rank. Ghét bóng đá vì đêm nào có bóng là mạng cả hẻm lag.",
      suspect: true,
    },
  },

  locations: {
    cablepole: {
      name: "Cột điện đầu hẻm",
      scene: "cablepole",
      start: true,
      intro: [
        ["narr", "Cột điện đầu hẻm, dây nhợ chằng chịt như tô bún bị đổ. Đất dưới chân cột còn ướt nhẹp từ cơn mưa lúc 6 giờ chiều."],
        ["chuba", "Đây nè. Chú không dám đụng gì. Chú chỉ rọi đèn pin, đứng canh, và nghe tiếng hò reo từ quán Út.", "neutral"],
        ["teo", "Sếp ơi, mỗi lần quán đó hét \"ÁAAA\" là tim em rớt một nhịp.", "nervous"],
      ],
      hotspots: [
        {
          id: "vet-cat",
          label: "Vết cắt",
          rect: [420, 250, 110, 70],
          lines: [
            ["narr", "Bó cáp võng xuống thấp ngang tầm hai mét, ngay chỗ ống nối. Đầu cáp bị tách đôi, lủng lẳng."],
            ["me", "Vết cắt phẳng lì. Một nhát duy nhất, gọn như cắt bánh bông lan.", "neutral"],
            ["me", "Kẹt ở mép vỏ cáp: một sợi [[chi-do|chỉ đỏ]] mảnh, dài cỡ đốt ngón tay. Chỉ may vải.", "neutral"],
            ["teo", "Thủ phạm là thợ may! Hay là... con nhện màu đỏ!", "smug"],
            ["me", "Chỗ này thấp. Đứng dưới đất kiễng chân là gần tới. Không cần thang.", "neutral"],
          ],
          gives: { clues: ["vet-cat"] },
          again: [["me", "Sợi chỉ đỏ đã nằm trong túi vật chứng. Đầu cáp vẫn lủng lẳng buồn bã.", "neutral"]],
        },
        {
          id: "hop-quang",
          label: "Hộp quang",
          rect: [600, 120, 90, 110],
          lines: [
            ["narr", "Hộp quang xám gắn trên cột, dán nhãn nhà mạng. Có danh sách thuê bao viết tay."],
            ["me", "\"Hộp HẺM 47 – 52 thuê bao.\" Nhà số 1 tới số 52, đủ cả: ông Năm số 3, nhà Tí số 7, văn phòng thám tử số 12...", "neutral"],
            ["me", "Dòng cuối, chữ khác: \"Quán Út – KHÔNG thuộc hộp này. Cáp riêng từ [[duong-lon|đường lớn]], tuyến khác.\"", "neutral"],
            ["teo", "Vậy cắt bó cáp này thì nguyên hẻm chết sóng, trừ đúng một quán.", "shock"],
          ],
          gives: { clues: ["nhan-hop-quang"] },
          again: [["teo", "Số 12 là mình. Mình cũng là nạn nhân đó sếp. Nạn nhân có quyền tức.", "angry"]],
        },
        {
          id: "banh-xe",
          label: "Bánh xe ba gác",
          rect: [380, 400, 120, 110],
          lines: [
            ["narr", "Một cái bánh xe ba gác cũ bị bỏ dựa chân cột từ năm nào, nằm ngay bên dưới chỗ dây võng."],
            ["me", "Mặt trên vành bánh xe có dấu đế dép dính bùn. Bùn còn ướt, tức là in sau cơn mưa 6 giờ.", "neutral"],
            ["me", "Hoa văn đế hình bông hoa năm cánh. Cỡ nhỏ. [[dep-bong-mai|Dép hoa bông mai]], loại dép nhựa bán ngoài chợ.", "neutral"],
            ["me", "Có người đã [[dung-len-banh-xe|đứng lên bánh xe ba gác]] để với tới chỗ dây võng.", "neutral"],
            ["teo", "Bánh xe này cao vừa tầm. Đứng lên là ngang tầm cắt luôn.", "neutral"],
          ],
          gives: { clues: ["dau-dep"] },
          again: [["teo", "Em đứng thử nha sếp... Ái, nó lắc! Thủ phạm phải có thăng bằng tốt.", "shock"]],
        },
        {
          id: "thang-nhom",
          label: "Thang nhôm",
          rect: [200, 150, 90, 330],
          lines: [
            ["narr", "Thang nhôm dựng sát cột, dán tem \"LỘC – NHÀ MẠNG\"."],
            ["me", "Chân thang lún vào bùn mới, còn ướt. Dựng sau cơn mưa.", "neutral"],
            ["me", "Nhưng người cắt cáp không cần [[leo-thang|leo thang nhôm]]. Vết cắt ở chỗ dây võng thấp. Thang này là để sửa, không phải để cắt.", "neutral"],
            ["teo", "Hoặc để đánh lạc hướng! Ai mà dựng thang ở hiện trường thì đáng nghi!", "smug"],
          ],
          again: [["me", "Cái thang vẫn đứng đó, kiên nhẫn chờ chủ.", "neutral"]],
        },
        {
          id: "cuon-cap",
          label: "Cuộn cáp",
          rect: [690, 330, 130, 130],
          lines: [
            ["narr", "Một cuộn cáp mới tinh đặt dưới đất, móc trên đó là cái thắt lưng đồ nghề màu cam."],
            ["me", "Trong thắt lưng: tua vít, băng keo điện, và một cây [[kim-cat-cap|kìm cắt cáp]] chuyên dụng, lưỡi mỏ quạ.", "neutral"],
            ["teo", "Kìm cắt cáp! Sếp ơi, đồ nghề của anh nhà mạng ngay hiện trường! Chốt!", "shock"],
            ["me", "Đồ nghề nằm ở đây đâu có nghĩa là nó đã cắt. Phải so vết.", "neutral"],
          ],
          gives: { clues: ["kim-loc"] },
          again: [["teo", "Cuộn cáp tròn như bánh tráng cuốn. Em đói rồi sếp."]],
        },
        {
          id: "meo-tren-day",
          label: "Con mèo trên dây",
          rect: [100, 30, 120, 70],
          lines: [
            ["narr", "Một con mèo mướp nằm vắt vẻo trên bó dây điện, nhìn xuống với vẻ khinh bỉ."],
            ["teo", "Nhân chứng! Mèo ơi, mày thấy ai cắt cáp không? Kêu một tiếng là có, hai tiếng là không.", "happy"],
            ["narr", "Con mèo ngáp một cái thật dài rồi quay mông lại."],
            ["me", "Nhân chứng từ chối hợp tác.", "neutral"],
          ],
          again: [["teo", "Mèo ơi, tao cho mày ăn pate. ...Nó vẫn quay mông."]],
        },
      ],
    },

    cafe: {
      name: "Quán cà phê cô Út",
      scene: "cafe",
      start: true,
      intro: [
        ["narr", "Quán cô Út chật như nêm. Ghế nhựa đỏ xếp tràn ra tận giữa hẻm, người đứng người ngồi, cờ phất phới, trống gõ thùng thùng."],
        ["batu", "(vẫy quạt nan) Thám tử! Ghế nè ghế nè! Bà Tư giữ cả tiếng đồng hồ, suýt đánh nhau với thằng Hùng!", "happy"],
        ["teo", "Sếp ơi em ngồi một chút thôi, coi một pha bóng thôi, rồi em điều tra liền.", "nervous"],
        ["me", "Đứng lên, Tèo.", "neutral"],
      ],
      hotspots: [
        {
          id: "tivi-lon",
          label: "Tivi lớn",
          rect: [380, 40, 220, 140],
          lines: [
            ["narr", "Tivi 65 inch treo giữa quán, hình nét căng. Phía trên treo băng rôn vải đỏ may tay."],
            ["me", "\"QUÁN ÚT – CHIẾU BÓNG ĐÁ – WIFI MẠNH NHẤT HẺM\". Chữ cắt từ vải vàng, may bằng [[chi-do|chỉ đỏ]].", "neutral"],
            ["me", "Mũi chỉ mới tinh, đầu chỉ chưa kịp tỉa hết. Băng rôn này vừa may trong chiều nay.", "neutral"],
            ["teo", "\"Wifi mạnh nhất hẻm\". Tối nay thì đúng là vậy thiệt, vì nó là wifi duy nhất.", "smug"],
          ],
          gives: { clues: ["bang-ron"] },
          again: [["narr", "Trên tivi, cầu thủ mình sút trúng xà ngang. Cả quán ôm đầu."], ["teo", "ÁAAA! Sếp ơi xà ngang!", "shock"]],
        },
        {
          id: "chong-ghe-nhua",
          label: "Chồng ghế nhựa",
          rect: [40, 250, 140, 230],
          lines: [
            ["narr", "Góc quán còn một chồng ghế nhựa đỏ cao quá đầu người, chưa kịp bày ra."],
            ["me", "Lưng ghế dán sticker: \"[[hai-lua|HAI LÚA – cho thuê bàn ghế]]\". Ghế thuê, không phải ghế của quán.", "neutral"],
            ["me", "Kẹp giữa hai cái ghế: phiếu thuê. \"30 ghế nhựa. Ký lúc [[15h00|15:00]]. Giao 16:00 hôm nay. Trả sáng mai. Người thuê: Út.\"", "neutral"],
            ["teo", "Ba giờ chiều?! Lúc đó mạng còn chạy ro ro mà sếp!", "shock"],
          ],
          gives: { clues: ["phieu-thue-ghe"] },
          again: [["teo", "Ba chục cái ghế. Thuê trước bốn tiếng. Cô Út có thần giao cách cảm với khách hả sếp."]],
        },
        {
          id: "quay-thu-ngan",
          label: "Quầy thu ngân",
          rect: [640, 220, 200, 150],
          lines: [
            ["narr", "Quầy gỗ, máy tính tiền cũ, hũ kẹo chanh muối. Dưới quầy, cô Út đứng pha chế, chân mang đôi [[dep-bong-mai|dép nhựa hoa bông mai]]."],
            ["me", "Sổ bán hàng mở sẵn. Tối nay: 214 ly. Dòng cuối trang trước, của tối qua: 38 ly.", "neutral"],
            ["me", "Lật lại đầu ca chiều: \"[[17h40|17:40]] – Lộc nhà mạng – 3 bạc xỉu – GHI SỔ\". Kế bên vẽ một trái tim nhỏ, rồi bị gạch đi.", "neutral"],
            ["me", "Dòng 19:38: \"Ông N. – trà đá – bàn góc khuất – đội nón lá\".", "neutral"],
            ["teo", "214 ly! Gấp năm lần ngày thường! Cô Út trúng số độc đắc bằng... mất mạng.", "shock"],
          ],
          gives: { clues: ["so-ban-hang"] },
          again: [["narr", "Cô Út gõ máy tính tiền liên tục, tiếng \"cạch cạch\" như bắn súng."]],
        },
        {
          id: "ro-kim-chi",
          label: "Rổ kim chỉ",
          rect: [860, 300, 90, 80],
          lines: [
            ["narr", "Trên ghế đẩu sau quầy: một rổ kim chỉ đan bằng mây. Cuộn chỉ đỏ, cuộn chỉ vàng, gối cắm kim, mảnh vải đỏ thừa."],
            ["me", "Một cây [[keo-cat-chi|kéo cắt chỉ]] nhỏ mũi nhọn, sắc lẻm. Khoen kéo còn quấn mấy vòng chỉ đỏ.", "neutral"],
            ["me", "Mép lưỡi kéo dính vài vụn nhựa đen li ti. Không giống vải. Giống vỏ dây cáp.", "neutral"],
            ["teo", "Kéo cắt chỉ mà dính nhựa đen? Cô Út may áo bằng dây điện hả sếp?", "neutral"],
          ],
          gives: { clues: ["keo-cat-chi"] },
          again: [["me", "Rổ kim chỉ đã bị dời ra sau lưng quầy, xa tầm mắt hơn lúc nãy.", "neutral"]],
        },
        {
          id: "bang-menu",
          label: "Bảng menu",
          rect: [180, 40, 160, 160],
          lines: [
            ["narr", "Bảng đen viết phấn: \"MENU ĐÊM CHUNG KẾT\"."],
            ["me", "\"Bạc xỉu Vô Địch: 25k. Cà phê Bàn Thắng: 22k. Trà đá: 5k (đêm thường: miễn phí).\"", "neutral"],
            ["me", "Góc dưới: \"Ghế ngồi: có hạn. Phụ thu ngồi gần tivi: 10k.\"", "neutral"],
            ["teo", "Trà đá mọi ngày miễn phí, đêm nay 5 ngàn. Kinh tế học đường phố!", "shock"],
          ],
          again: [["teo", "Phụ thu ngồi gần tivi. Em ngồi xa xa thôi, coi bằng niềm tin."]],
        },
        {
          id: "goc-o-dien",
          label: "Góc ổ điện",
          rect: [40, 120, 100, 100],
          needs: "stmt:ti-o-nha",
          lines: [
            ["narr", "Ổ điện ở góc tường, chỗ duy nhất trong quán còn trống chân cắm."],
            ["me", "Một cục sạc dự phòng đèn RGB đang nháy bảy màu, dán giấy: \"CỦA TÍ GAMING – ĐỪNG RÚT – RÚT LÀ THUA RANK\".", "neutral"],
            ["teo", "Ơ. Tí nói nãy giờ ở nhà ngủ mà.", "smug"],
          ],
          gives: { clues: ["sac-rgb"] },
          again: [["teo", "Cục sạc vẫn nháy. Như đang cười mình."]],
        },
        {
          id: "ban-goc-khuat",
          label: "Bàn góc khuất",
          rect: [200, 380, 130, 120],
          lines: [
            ["narr", "Cái bàn nhỏ khuất sau cột, ngay chỗ tối nhất quán. Trên bàn: ly trà đá uống dở, một cái nón lá úp ngược."],
            ["me", "Dưới gầm bàn có dấu [[guoc-moc|guốc mộc]] gõ lộp cộp xuống nền gạch, rồi biến mất về phía cửa sau.", "neutral"],
            ["teo", "Ai mà coi bóng đá mà ngồi trốn như đi ăn vụng vậy sếp.", "neutral"],
          ],
          again: [["me", "Ly trà đá đã tan hết đá. Chủ nhân chưa quay lại.", "neutral"]],
        },
      ],
    },

    namhouse: {
      name: "Hiên nhà ông Năm",
      scene: "namhouse",
      intro: [
        ["narr", "Hiên nhà ông Năm, số 3, cách cột điện chưa tới chục bước. Cửa đóng, đèn tắt. Trong nhà im phăng phắc."],
        ["teo", "Sếp, đêm chung kết mà nhà này tắt đèn. Hoặc là ổng ngủ thiệt, hoặc là ổng giấu gì đó.", "smug"],
      ],
      hotspots: [
        {
          id: "bang-cam-on-ao",
          label: "Bảng cấm ồn ào",
          rect: [380, 60, 200, 110],
          lines: [
            ["narr", "Tấm bảng gỗ treo trên cửa, sơn đỏ chữ to: \"CẤM ỒN ÀO\"."],
            ["me", "Dòng nhỏ bên dưới, viết thêm bằng phấn: \"Đứa nào mở loa kẹo kéo nữa, tui CẮT DÂY cho yên!\"", "neutral"],
            ["teo", "\"CẮT DÂY\"! Chữ viết hoa luôn sếp! Đây là lời thú tội trước!", "shock"],
            ["me", "Hoặc là lời doạ của một ông già muốn ngủ. \"Dây\" là dây gì?", "neutral"],
          ],
          gives: { clues: ["bang-cam-on"], words: ["ghet-on"] },
          again: [["teo", "Em đọc lại mà vẫn thấy rợn. CẮT. DÂY."]],
        },
        {
          id: "chau-kieng",
          label: "Chậu kiểng",
          rect: [700, 280, 150, 200],
          lines: [
            ["narr", "Mấy chậu mai chiếu thuỷ, sanh, nguyệt quế, cắt tỉa tròn vo như quả cầu."],
            ["me", "Cắm trong chậu sanh: một cây [[keo-tia-kieng|kéo tỉa kiểng]] lưỡi cong to bản, cán gỗ. Lưỡi dính nhựa cây, mẻ một chỗ.", "neutral"],
            ["teo", "Kéo to tổ bố! Cắt cáp như cắt bún! Ông Năm có hung khí!", "shock"],
            ["me", "Kéo tỉa lưỡi cong. Cắt cái gì cũng để lại vết xéo, dập hai bên.", "neutral"],
          ],
          gives: { clues: ["keo-tia"] },
          again: [["me", "Chậu sanh tỉa đẹp thật. Ông Năm có đôi tay khéo và một cái miệng khó.", "neutral"]],
        },
        {
          id: "loa-keo",
          label: "Loa kẹo kéo",
          rect: [120, 280, 110, 170],
          lines: [
            ["narr", "Cái loa kẹo kéo màu hồng dựng ở góc hiên, dây điện bị quấn băng keo đen kín mít."],
            ["me", "Dán tem: \"TỊCH THU của thằng Tí – 3/11 – trả khi nào nó biết điều\".", "neutral"],
            ["me", "Dây loa thì vẫn nguyên, chỉ bị quấn chặt. Ông Năm doạ cắt, mà rốt cuộc chỉ... quấn băng keo.", "neutral"],
            ["teo", "Ông Năm ngoài lạnh trong... cũng hơi lạnh, mà không ác.", "neutral"],
          ],
          again: [["teo", "Em bấm thử nút loa nha... (\"Em ơi Hà Nội phố...\") Á tắt tắt tắt!", "shock"]],
        },
        {
          id: "ghe-bo",
          label: "Ghế bố",
          rect: [300, 330, 260, 150],
          lines: [
            ["narr", "Cái ghế bố vải xanh kê trước hiên, gối mây đặt ở đầu ghế."],
            ["me", "Gối hơi cộm. Nhét bên dưới: một cái khăn cổ động đỏ sao vàng, một tờ lịch thi đấu cắt từ báo, các trận đã đá đều được ghi tỉ số bằng bút bi.", "neutral"],
            ["me", "Bên lề lịch, chữ run run: \"Chung kết – 19g30 – nhất định thắng!!!\" Ba dấu chấm than.", "neutral"],
            ["teo", "Ông Năm, người ghét \"22 người chạy theo một trái banh\", có khăn cổ động!", "shock"],
          ],
          gives: { clues: ["khan-co-dong"] },
          again: [["teo", "Ba dấu chấm than. Ông Năm yêu bóng đá bằng cả trái tim, mà giấu dưới gối."]],
        },
        {
          id: "cua-so",
          label: "Cửa sổ",
          rect: [620, 60, 120, 140],
          lines: [
            ["narr", "Cửa sổ song sắt hé mở. Đứng sau cửa sổ nhìn ra, thấy thẳng chân cột điện đầu hẻm, rõ mồn một dưới đèn đường."],
            ["me", "Ai đứng ở cửa sổ này lúc cáp bị cắt thì chắc chắn đã thấy thủ phạm.", "neutral"],
            ["teo", "Mà chủ nhà khai ngủ từ 7 giờ. Ngủ thì không thấy. Tiếc ghê.", "neutral"],
          ],
          again: [["me", "Từ đây nhìn ra, cái bánh xe ba gác nằm ngay dưới đèn đường.", "neutral"]],
        },
      ],
    },
  },

  clues: {
    "vet-cat": {
      name: "Vết cắt trên bó cáp",
      desc: "Bó cáp chỗ dây võng thấp (khoảng 2 m) bị cắt đứt. Vết [[cat-mot-nhat|cắt một nhát phẳng]], mép gọn. Kẹt ở mép vỏ cáp một sợi [[chi-do|chỉ đỏ]] may vải.",
      detail: [["me", "Không phải đứt, không phải chuột gặm. Một nhát gọn, bằng thứ gì đó nhỏ và rất sắc.", "neutral"]],
    },
    "nhan-hop-quang": {
      name: "Nhãn hộp quang",
      desc: "Hộp quang Hẻm 47 phục vụ 52 thuê bao. Ghi chú: \"Quán Út – KHÔNG thuộc hộp này. Cáp riêng từ [[duong-lon|đường lớn]].\" Cắt bó cáp này thì cả hẻm mất sóng, trừ [[quan-ut|quán cô Út]].",
    },
    "dau-dep": {
      name: "Dấu dép trên bánh xe",
      desc: "Trên vành bánh xe ba gác dưới chỗ dây võng: dấu [[dep-bong-mai|dép hoa bông mai]] cỡ nhỏ, bùn còn ướt (sau cơn mưa 6 giờ). Có người [[dung-len-banh-xe|đứng lên bánh xe ba gác]] để với tới dây.",
    },
    "kim-loc": {
      name: "Kìm cắt cáp của Lộc",
      desc: "[[kim-cat-cap|Kìm cắt cáp]] chuyên dụng lưỡi mỏ quạ trong thắt lưng đồ nghề của Lộc, móc trên cuộn cáp mới.",
    },
    "phieu-thue-ghe": {
      name: "Phiếu thuê 30 ghế nhựa",
      desc: "[[hai-lua|Hai Lúa cho thuê bàn ghế]]: 30 ghế nhựa, ký lúc [[15h00|15:00]], giao 16:00, trả sáng mai. Người thuê: Út. Thuê trước lúc mất mạng hơn bốn tiếng.",
    },
    "so-ban-hang": {
      name: "Sổ bán hàng quán Út",
      desc: "Tối nay 214 ly (tối qua 38). Đầu ca: \"[[17h40|17:40]] – Lộc nhà mạng – 3 bạc xỉu – ghi sổ\" kèm trái tim bị gạch. \"19:38 – Ông N. – trà đá – bàn góc khuất – đội [[non-la|nón lá]]\".",
      detail: [["teo", "Doanh thu gấp năm lần. Đúng là \"trong cái rủi có cái may\"... mà cái may này hơi bị tính trước.", "smug"]],
    },
    "keo-cat-chi": {
      name: "Kéo cắt chỉ của cô Út",
      desc: "[[keo-cat-chi|Kéo cắt chỉ]] nhỏ mũi nhọn trong rổ kim chỉ sau quầy. Khoen quấn [[chi-do|chỉ đỏ]], mép lưỡi dính vụn nhựa đen giống vỏ cáp.",
      detail: [["me", "Chỉ đỏ ở khoen kéo. Chỉ đỏ ở vết cắt. Chỉ đỏ trên băng rôn may chiều nay. Ba sợi chỉ, một cuộn.", "neutral"]],
    },
    "bang-ron": {
      name: "Băng rôn may tay",
      desc: "\"QUÁN ÚT – CHIẾU BÓNG ĐÁ – WIFI MẠNH NHẤT HẺM\", may bằng [[chi-do|chỉ đỏ]], mũi chỉ mới, đầu chỉ chưa tỉa. Vừa may chiều nay.",
    },
    "bang-cam-on": {
      name: "Bảng \"Cấm ồn ào\"",
      desc: "Bảng trước nhà ông Năm: \"CẤM ỒN ÀO. Đứa nào mở loa kẹo kéo nữa, tui CẮT DÂY cho yên!\"",
    },
    "keo-tia": {
      name: "Kéo tỉa kiểng của ông Năm",
      desc: "[[keo-tia-kieng|Kéo tỉa kiểng]] lưỡi cong to bản, dính nhựa cây, mẻ một chỗ. Cắt gì cũng để lại vết xéo, dập hai bên.",
    },
    "khan-co-dong": {
      name: "Khăn cổ động dưới gối",
      desc: "Khăn đỏ sao vàng và lịch thi đấu ghi tỉ số từng trận, giấu dưới gối ghế bố nhà ông Năm. \"Chung kết – 19g30 – nhất định thắng!!!\"",
    },
    "lich-su-tran": {
      name: "Lịch sử trận rank của Tí",
      desc: "\"THUA – Mất kết nối – [[19h12|19:12:40]] – trừ 25 điểm.\" Mốc giờ chính xác lúc cáp bị cắt.",
      detail: [["teo", "Mười chín giờ mười hai phút bốn mươi giây. Chính xác hơn đồng hồ phường.", "happy"]],
    },
    "sac-rgb": {
      name: "Cục sạc RGB của Tí",
      desc: "Cục sạc dự phòng đèn bảy màu cắm ở góc quán cô Út: \"CỦA TÍ GAMING – ĐỪNG RÚT – RÚT LÀ THUA RANK\".",
    },
    "clip-ti": {
      name: "Clip ghi màn hình của Tí",
      desc: "Tí quay lại trận rank gỡ điểm ở quán cô Út. Phút [[20h05|20:05]] cả quán hét vì bàn thắng; góc khung hình, ông Năm đội [[non-la|nón lá]] kéo sụp, quàng khăn đỏ, đứng bật dậy hét \"VÀOOOO!\".",
    },
    "tin-nhan-loc": {
      name: "Tin nhắn cô Út gửi Lộc",
      desc: "[[14h10|14:10]], cô Út: \"Lộc ơi, cáp mạng mà đứt thì nhà mạng mấy tiếng mới sửa xong vậy? Hỏi chơi thôi 😅\". Lộc: \"Ban đêm thì phải sáng mai mới có đội hàn nha cô 😊\".",
      detail: [["me", "Hai giờ mười hỏi cáp đứt sửa mấy tiếng. Ba giờ thuê ghế. Chiều may băng rôn. Kế hoạch đâu ra đó.", "neutral"]],
    },
  },

  words: {
    ongnam: { text: "ông Năm", kind: "ai" },
    loc: { text: "Lộc", kind: "ai" },
    cout: { text: "cô Út", kind: "ai" },
    ti: { text: "Tí", kind: "ai" },

    "14h10": { text: "14 giờ 10", kind: "luc" },
    "15h00": { text: "15 giờ", kind: "luc" },
    "17h40": { text: "17 giờ 40", kind: "luc" },
    "19h12": { text: "19 giờ 12", kind: "luc" },
    "19h30": { text: "19 giờ 30", kind: "luc" },
    "20h05": { text: "20 giờ 05", kind: "luc" },
    "20h15": { text: "20 giờ 15", kind: "luc" },

    "quan-ut": { text: "quán cô Út", kind: "o" },
    "cot-dien": { text: "cột điện đầu hẻm", kind: "o" },
    "duong-lon": { text: "đường lớn", kind: "o" },
    "hien-nha": { text: "hiên nhà ông Năm", kind: "o" },
    "phong-ti": { text: "phòng của Tí", kind: "o" },

    "chi-do": { text: "chỉ đỏ", kind: "vat" },
    "keo-cat-chi": { text: "kéo cắt chỉ", kind: "vat" },
    "keo-tia-kieng": { text: "kéo tỉa kiểng", kind: "vat" },
    "kim-cat-cap": { text: "kìm cắt cáp", kind: "vat" },
    "dao-roc-giay": { text: "dao rọc giấy", kind: "vat" },
    "dep-bong-mai": { text: "dép hoa bông mai", kind: "vat" },
    "guoc-moc": { text: "guốc mộc", kind: "vat" },
    "non-la": { text: "nón lá", kind: "vat" },

    "dung-len-banh-xe": { text: "đứng lên bánh xe ba gác", kind: "cach" },
    "leo-thang": { text: "leo thang nhôm", kind: "cach" },
    "cat-mot-nhat": { text: "cắt một nhát phẳng", kind: "cach" },
    "cua-nhieu-nhat": { text: "cứa nhiều nhát", kind: "cach" },
    "chuot-gam": { text: "chuột gặm", kind: "cach" },

    "keo-khach": { text: "kéo cả hẻm vào quán", kind: "vi" },
    "ghet-on": { text: "ghét ồn ào", kind: "vi" },
    "ping-cao": { text: "ghét mạng lag ping cao", kind: "vi" },
    "phu-cap-dem": { text: "phụ cấp sửa đêm", kind: "vi" },
    "tham-thuong": { text: "thầm thương trộm nhớ", kind: "vi" },

    "chung-ket": { text: "chung kết", kind: "khac" },
    "hai-lua": { text: "Hai Lúa cho thuê bàn ghế", kind: "khac" },
  },

  talks: {
    ongnam: [
      {
        id: "gioi-thieu",
        topic: "Chào ông Năm",
        lines: [
          ["narr", "Gõ cửa ba lần. Lâu thật lâu, cửa sổ hé ra, một cái đầu tóc bạc, áo ngủ sọc."],
          ["ongnam", "Gì? Khuya rồi! Người ta ngủ!", "angry"],
          ["me", "Mới 8 giờ, thưa ông.", "neutral"],
          ["ongnam", "8 giờ là khuya với người già! Mấy đứa đêm nào cũng trống kèn, loa kẹo kéo, karaoke. Tui [[ghet-on|ghét ồn ào]]!", "angry"],
          ["narr", "Ông Năm mở cửa bước ra hiên, đôi [[guoc-moc|guốc mộc]] gõ lóc cóc."],
          ["teo", "Sếp, ổng mặc áo ngủ mà tóc chải láng mượt. Ngủ gì mà chải tóc.", "smug"],
        ],
        gives: { words: ["ongnam"], locs: ["namhouse"] },
      },
      {
        id: "toi-nay",
        topic: "Tối nay ông ở đâu?",
        lines: [
          ["ongnam", "Ở nhà. Ngủ. Từ 7 giờ. Cửa đóng then cài.", "neutral"],
          ["ongnam", "Bóng banh gì tui không biết. Mất mạng càng tốt, cả hẻm im được một bữa.", "neutral"],
          ["teo", "Ổng nói \"mất mạng càng tốt\"! Sếp ghi vô!", "shock"],
        ],
        gives: { stmts: ["nam-ngu-som"] },
      },
      {
        id: "cat-day",
        topic: "Ông doạ \"cắt dây cho yên\"?",
        needs: "seen:namhouse.bang-cam-on-ao",
        lines: [
          ["ongnam", "Dây LOA! Dây loa kẹo kéo! Ai nói dây mạng?!", "angry"],
          ["ongnam", "Tui tịch thu cái loa của thằng Tí, định cắt dây mà rồi... thôi, quấn băng keo. Cắt rồi nó đâu có xài được nữa.", "nervous"],
          ["me", "Ông có kéo tỉa kiểng.", "neutral"],
          ["ongnam", "Kéo tỉa mai! Kéo đó mà cắt cáp thì cáp nát như bánh canh, chú ba nhìn là biết!", "angry"],
        ],
      },
      {
        id: "cua-so",
        topic: "Từ cửa sổ ông thấy gì?",
        needs: "broke:nam-ngu-som",
        lines: [
          ["ongnam", "Hơn 7 giờ, tui đang quàng khăn, chuẩn bị lẻn ra quán. Nhìn qua cửa sổ coi có ai không.", "nervous"],
          ["ongnam", "Thấy một người đứng chênh vênh trên cái bánh xe ba gác ở chân cột. Đội nón lá, đeo cái tạp dề màu nâu.", "neutral"],
          ["ongnam", "Rồi nghe \"tách\" một cái. Cục mạng trong nhà tui tắt đèn xanh liền.", "shock"],
          ["ongnam", "Tui tưởng thợ nhà mạng sửa gì đó. Mà thợ nhà mạng đâu có đeo tạp dề.", "neutral"],
          ["teo", "Tạp dề nâu... Sếp ơi, ai trong hẻm đeo tạp dề nâu?", "shock"],
        ],
      },
    ],

    loc: [
      {
        id: "toi-nay",
        topic: "Anh tới hẻm lúc mấy giờ?",
        lines: [
          ["loc", "Dạ tui tới lúc [[20h15|8 giờ 15]], sau khi tổng đài báo hỏng. Chạy từ chi nhánh qua liền.", "neutral"],
          ["loc", "Tới nơi thì thấy cáp bị cắt. Tui dựng thang, kiểm tra, rồi... báo về đội.", "nervous"],
        ],
        gives: { stmts: ["loc-toi-tre"], words: ["loc"] },
      },
      {
        id: "vet-cat",
        topic: "Anh xem giùm vết cắt",
        needs: "clue:vet-cat",
        lines: [
          ["loc", "Dạ để tui coi. (rọi đèn) Ồ. Cái này dân chuyên nghiệp không làm.", "neutral"],
          ["loc", "[[kim-cat-cap|Kìm cắt cáp]] của tui lưỡi mỏ quạ, cắt xong hai bên vỏ cáp bị bóp bẹp. Còn vết này phẳng lì.", "neutral"],
          ["loc", "[[keo-tia-kieng|Kéo tỉa kiểng]] lưỡi cong thì cắt xéo, dập. [[dao-roc-giay|Dao rọc giấy]] thì phải [[cua-nhieu-nhat|cứa nhiều nhát]], mép xơ. [[chuot-gam|Chuột gặm]] thì có dấu răng.", "neutral"],
          ["loc", "Vết này là một nhát, gọn, bằng cây kéo nhỏ mà cực sắc. Kiểu [[keo-cat-chi|kéo cắt chỉ]] của thợ may. Má tui thợ may, tui biết.", "neutral"],
          ["teo", "Anh Lộc biết nhiều quá. Biết nhiều là đáng nghi!", "smug"],
          ["loc", "Biết nhiều là do đi học nghề mà em...", "nervous"],
        ],
        gives: { words: ["cat-mot-nhat"] },
      },
      {
        id: "phu-cap",
        topic: "Sửa đêm có thêm tiền không?",
        lines: [
          ["loc", "Dạ có [[phu-cap-dem|phụ cấp sửa đêm]], một ca 150 ngàn.", "neutral"],
          ["loc", "Mà cáp quang đứt thì phải hàn. Ban đêm không có đội hàn, sáng mai mới tới. Tui sửa tạm không được.", "nervous"],
          ["teo", "150 ngàn một ca! Sếp ơi, động cơ tài chính!", "shock"],
          ["loc", "150 ngàn mà mất đêm chung kết. Em đổi không?", "angry"],
        ],
      },
      {
        id: "quan-ut",
        topic: "Sao quán cô Út vẫn còn sóng?",
        lines: [
          ["loc", "Quán cô Út mặt tiền quay ra [[duong-lon|đường lớn]], kéo cáp riêng từ bên đó. Không chung hộp với hẻm.", "neutral"],
          ["loc", "Hồi tháng trước chính tui kéo cáp cho cô. Cô Út... cô pha bạc xỉu cho tui. Ngon lắm.", "nervous"],
          ["teo", "Anh Lộc nhắc tới cô Út là đỏ mặt. Sếp thấy không?", "smug"],
        ],
        gives: { words: ["quan-ut"] },
      },
      {
        id: "tin-nhan",
        topic: "Hôm nay cô Út có nhắn gì anh không?",
        needs: "broke:loc-toi-tre",
        lines: [
          ["loc", "Dạ có! Cô Út nhắn tui buổi trưa. Tui còn chụp lại màn hình vì... vì lần đầu cô nhắn trước.", "nervous"],
          ["loc", "Cô hỏi cáp mạng đứt thì mấy tiếng sửa xong. Tui tưởng cô quan tâm công việc của tui.", "neutral"],
          ["loc", "Ủa... khoan. Sao cô hỏi chuyện đó lúc hai giờ chiều?", "shock"],
          ["teo", "Anh Lộc ơi. Trái tim anh vừa nhận ra điều mà bộ não anh không muốn tin.", "neutral"],
        ],
        gives: { clues: ["tin-nhan-loc"] },
      },
    ],

    cout: [
      {
        id: "quan-dong",
        topic: "Quán đông quá ha cô?",
        lines: [
          ["cout", "Ờ, trời thương người hiền. Cả hẻm mất sóng mà quán tui còn. Chắc ba tui phù hộ.", "neutral"],
          ["cout", "Tui đâu có biết trước! Khách tràn vô bất ngờ, tui chạy đi mượn ghế khắp xóm muốn gãy chân.", "neutral"],
          ["teo", "Cô Út ơi, bạc xỉu cho em một ly được không...", "happy"],
          ["cout", "25 ngàn, ngồi gần tivi phụ thu 10 ngàn nha em.", "neutral"],
        ],
        gives: { stmts: ["cout-muon-ghe"], words: ["cout", "keo-khach"] },
      },
      {
        id: "luc-7-gio",
        topic: "Hơn 7 giờ cô ở đâu?",
        lines: [
          ["cout", "Đứng quầy chứ đâu. Quán đông vậy ai pha? Tui không bước ra khỏi quán nửa bước.", "neutral"],
          ["cout", "Thám tử hỏi bà Tư đi, bả ngồi đây từ chiều.", "neutral"],
          ["batu", "(từ xa) Bà Tư đi toilet hai lần à nha, bà không chứng gì hết!", "smug"],
        ],
        gives: { stmts: ["cout-dung-quay"] },
      },
      {
        id: "may-va",
        topic: "Cô hay may vá hả?",
        needs: { any: ["seen:cafe.ro-kim-chi", "seen:cafe.tivi-lon"] },
        lines: [
          ["cout", "Ờ, rổ kim chỉ của má tui để lại. Chiều nay rảnh tui may cái băng rôn treo tivi.", "neutral"],
          ["cout", "Đẹp không? Chữ \"wifi mạnh nhất hẻm\" tui cắt từng chữ đó.", "neutral"],
          ["me", "Chiều nay rảnh. Lúc đó mạng cả hẻm vẫn còn chạy.", "neutral"],
          ["cout", "Thì... wifi quán tui mạnh thiệt mà. Quảng cáo có gì sai.", "nervous"],
        ],
      },
      {
        id: "ong-nam",
        topic: "Cô nghĩ ai cắt cáp?",
        lines: [
          ["cout", "Còn ai! Ông Năm! Ổng doạ cắt dây trên nhóm Zalo, viết lên bảng trước nhà luôn!", "angry"],
          ["cout", "Mà ổng có cây kéo tỉa kiểng bự chà bá. Tui nói vậy thôi, tui không nói ai hết.", "neutral"],
          ["teo", "Cô Út nói \"tui không nói ai\" sau khi nói tên rồi.", "smug"],
        ],
      },
    ],

    ti: [
      {
        id: "bong-da",
        topic: "Em ghét bóng đá hả?",
        lines: [
          ["ti", "Ghét! Đêm nào có bóng là cả hẻm coi, mạng lag, ping lên 999. Con [[ping-cao|ghét mạng lag ping cao]]!", "angry"],
          ["ti", "Con đăng rồi đó: \"ước gì cả hẻm mất mạng trừ nhà con\". Mà con ước nhà CON có mạng, chứ đâu phải nhà con mất!", "angry"],
          ["teo", "Ước gì được nấy, mà được ngược. Vũ trụ troll em rồi Tí.", "smug"],
          ["me", "Trong túi em có gì?", "neutral"],
          ["ti", "[[dao-roc-giay|Dao rọc giấy]] á. Con lắp mô hình Gundam. Không phải hung khí!", "nervous"],
        ],
        gives: { words: ["ti"] },
      },
      {
        id: "rot-mang",
        topic: "Mạng rớt lúc mấy giờ?",
        lines: [
          ["ti", "Con nhớ chính xác tới từng giây! Đang trận rank, sắp thắng, màn hình đứng cái bụp.", "angry"],
          ["ti", "Đây nè, lịch sử trận. \"Mất kết nối\". Trừ 25 điểm. Hai mươi lăm điểm đó chú! Con cày ba ngày!", "shock"],
          ["teo", "Tí ơi, em vừa đưa cho thám tử mốc thời gian quý nhất vụ án đó.", "happy"],
        ],
        gives: { clues: ["lich-su-tran"] },
      },
      {
        id: "sau-do",
        topic: "Mất mạng rồi em làm gì?",
        lines: [
          ["ti", "Con giận quá đi ngủ luôn. Ở trong [[phong-ti|phòng]], không ra khỏi nhà.", "neutral"],
          ["ti", "Má con cấm con ra đường buổi tối vì điểm toán. Con ngoan lắm.", "nervous"],
          ["teo", "Ngoan mà tai nghe còn nóng hổi kìa sếp.", "smug"],
        ],
        gives: { stmts: ["ti-o-nha"] },
      },
      {
        id: "o-quan",
        topic: "Lúc em tới quán, cô Út đang làm gì?",
        needs: "broke:ti-o-nha",
        lines: [
          ["ti", "Con chạy tới quán khoảng 7 giờ 20, lúc đó còn ít người.", "neutral"],
          ["ti", "Cô Út mới từ ngoài hẻm đi vô, cởi cái nón lá, đang chùi đôi dép dính bùn ở bậc cửa.", "neutral"],
          ["ti", "Rồi cô lật đật bỏ cái gì đó vô rổ kim chỉ sau quầy. Con tưởng cô đi chợ.", "neutral"],
          ["ti", "Mà chợ đâu có mở lúc 7 giờ tối ha chú.", "shock"],
        ],
      },
    ],
  },

  stmts: {
    "nam-ngu-som": {
      by: "ongnam",
      text: "Tối nay tui ngủ từ 7 giờ, cửa đóng then cài, bóng banh gì tui không biết.",
      break: {
        clue: "clip-ti",
        lines: [
          ["me", "Clip của Tí, 20 giờ 05, bàn thắng. Góc quán cô Út: một ông đội nón lá, quàng khăn đỏ, đứng bật dậy hét \"VÀOOOO\".", "neutral"],
          ["ongnam", "...", "shock"],
          ["ongnam", "Đó là... ông già nào đó giống tui.", "nervous"],
          ["teo", "Ông già nào đó mang guốc mộc, áo ngủ sọc, hét \"vào\" bằng giọng y chang ông.", "smug"],
          ["ongnam", "Thôi được! Tui mê bóng đá! Mê từ hồi năm 1998! Cả đời tui chưa bỏ trận nào của đội tuyển!", "angry"],
          ["ongnam", "Nhưng tui đã chửi tụi nhỏ ồn ào cả năm trời, giờ mà ra quán hò hét thì còn mặt mũi gì. Nên tui đội nón lá, ngồi góc khuất.", "nervous"],
          ["ongnam", "Mà khoan, hơn 7 giờ tui có thấy một chuyện ở cột điện. Từ cửa sổ.", "neutral"],
        ],
        gives: { words: ["hien-nha"], flags: ["nam-la-fan"] },
      },
    },
    "loc-toi-tre": {
      by: "loc",
      text: "Tui tới hẻm lúc [[20h15|8 giờ 15]], sau khi tổng đài báo hỏng.",
      break: {
        clue: "so-ban-hang",
        lines: [
          ["me", "Sổ bán hàng quán cô Út: \"17 giờ 40 – Lộc nhà mạng – 3 bạc xỉu – ghi sổ\". Kèm một trái tim bị gạch.", "neutral"],
          ["loc", "Ơ... trái tim bị gạch hả? Sao lại gạch?", "shock"],
          ["me", "Đó không phải điều quan trọng nhất ở đây.", "neutral"],
          ["loc", "Dạ... tui tới từ chiều. Tan ca ghé quán ngồi. Ba ly bạc xỉu. Ngồi tới lúc mất mạng luôn.", "nervous"],
          ["loc", "Tui nói 8 giờ 15 vì... vì sợ đội biết tui ngồi quán gần hiện trường mà không phát hiện gì. Với lại... sợ cô Út biết tui ngồi đó ba tiếng chỉ để ngó cô.", "nervous"],
          ["teo", "Anh Lộc [[tham-thuong|thầm thương trộm nhớ]] cô Út! Ba ly bạc xỉu là ba lần tỏ tình bằng caffeine!", "happy"],
          ["loc", "Lúc 7 giờ hơn tui có thấy cô Út ra ngoài một lát. Tui tưởng cô đi đổ rác...", "neutral"],
        ],
        gives: { flags: ["loc-o-quan"] },
      },
    },
    "ti-o-nha": {
      by: "ti",
      text: "Mất mạng là con đi ngủ, ở trong phòng, không ra khỏi nhà.",
      break: {
        clue: "sac-rgb",
        lines: [
          ["me", "Cục sạc RGB ở góc quán cô Út: \"CỦA TÍ GAMING – ĐỪNG RÚT – RÚT LÀ THUA RANK\".", "neutral"],
          ["ti", "Á! Chú đừng nói má con! Má con mà biết là con mất điện thoại một tháng!", "shock"],
          ["ti", "Con trèo cửa sổ ra quán cô Út xài wifi, gỡ lại 25 điểm. Con còn quay màn hình làm bằng chứng gỡ rank nè.", "nervous"],
          ["ti", "Chú coi đi, ngay lúc có bàn thắng, nguyên quán hét, con bị giật mình chết ngay pha đó. Mà góc màn hình có cái ông này hét to nhất...", "neutral"],
          ["teo", "Tí ơi... ông đội nón lá đó là ông Năm mà!", "shock"],
        ],
        gives: { clues: ["clip-ti"], flags: ["ti-o-quan"] },
      },
    },
    "cout-muon-ghe": {
      by: "cout",
      text: "Tui đâu biết trước! Khách tràn vô bất ngờ, tui mới chạy đi mượn ghế khắp xóm.",
      break: {
        clue: "phieu-thue-ghe",
        lines: [
          ["me", "Phiếu thuê Hai Lúa: 30 ghế nhựa, ký 15 giờ, giao 16 giờ. Không phải mượn. Là thuê. Thuê trước khi mất mạng bốn tiếng.", "neutral"],
          ["cout", "...Thì đêm chung kết, tui đoán đông nên thuê. Buôn bán phải tính trước chứ!", "nervous"],
          ["me", "Năm ngoái bán kết, cô có thuê ghế không?", "neutral"],
          ["cout", "Năm ngoái... năm ngoái khác.", "nervous"],
          ["teo", "Năm ngoái wifi cả hẻm không bị cắt.", "smug"],
        ],
        gives: { flags: ["cout-thue-ghe"] },
      },
    },
    "cout-dung-quay": {
      by: "cout",
      text: "Cả tối tui đứng quầy, không bước ra khỏi quán nửa bước.",
      break: {
        clue: "dau-dep",
        lines: [
          ["me", "Dấu dép hoa bông mai cỡ nhỏ trên bánh xe ba gác ngay dưới chỗ cáp bị cắt. Bùn còn ướt.", "neutral"],
          ["me", "Cô đang mang đúng loại dép đó. Ông Năm mang guốc mộc, Lộc mang giày bảo hộ, Tí mang dép quai hậu.", "neutral"],
          ["cout", "Dép bông mai chợ nào chả bán! Nửa hẻm này mang dép bông mai!", "angry"],
          ["teo", "Nửa hẻm đó có ai đứng trên bánh xe ba gác lúc 7 giờ tối không cô?", "smug"],
          ["cout", "Tui... tui ra đầu hẻm coi trời có mưa nữa không. Một chút thôi!", "nervous"],
        ],
        gives: { flags: ["cout-ra-cot"] },
      },
    },
  },

  present: {
    ongnam: {
      "keo-tia": [
        ["ongnam", "Kéo tỉa mai của tui! Đụng vô là tui la làng!", "angry"],
        ["ongnam", "Cây kéo này tỉa chậu sanh hai chục năm. Nó chưa từng cắt cái gì không có lá!", "angry"],
      ],
      "khan-co-dong": [
        ["ongnam", "Ai cho lục gối tui?! Đó là... khăn lau mặt!", "shock"],
        ["teo", "Khăn lau mặt in sao vàng, ghi \"Việt Nam vô địch\"?", "smug"],
        ["ongnam", "...Lau mặt cho có tinh thần!", "nervous"],
      ],
      "bang-cam-on": [
        ["ongnam", "Thì sao? Tui nói là tui làm! Mà tui chưa làm! Tui chỉ quấn băng keo!", "angry"],
      ],
    },
    loc: {
      "kim-loc": [
        ["loc", "Kìm của tui đó. Mà cắt bằng kìm này là vỏ cáp bẹp dí hai bên, tui chỉ cho coi.", "neutral"],
        ["loc", "Vết ở cột thì phẳng như mặt hồ. Không phải kìm của tui.", "neutral"],
      ],
      "keo-cat-chi": [
        ["loc", "Kéo này... nhỏ, sắc, mũi nhọn. Đúng kiểu tui nói.", "shock"],
        ["loc", "Ủa mà đây là kéo trong rổ kim chỉ của cô Út... Không, không thể nào.", "nervous"],
      ],
      "bang-ron": [
        ["loc", "Băng rôn đẹp ghê. Cô Út khéo tay lắm. Chiều nay tui thấy cô ngồi may đó.", "neutral"],
        ["loc", "Hồi chiều. Lúc mạng còn chạy. ...Khoan, tui vừa nói gì vậy.", "nervous"],
      ],
    },
    cout: {
      "bang-cam-on": [
        ["cout", "Đó! Thấy chưa! \"CẮT DÂY\"! Thám tử còn chờ gì nữa mà không bắt ông Năm!", "angry"],
        ["teo", "Cô Út hăng quá ha sếp.", "smug"],
      ],
      "nhan-hop-quang": [
        ["cout", "Thì quán tui mặt tiền đường lớn, cáp riêng từ hồi nào. Có phải tui xin đâu.", "nervous"],
        ["cout", "Trùng hợp thôi. Ông trời sắp xếp.", "nervous"],
      ],
      "so-ban-hang": [
        ["cout", "Ai cho coi sổ của tui?! Sổ bán hàng là chuyện riêng tư như nhật ký!", "angry"],
        ["cout", "214 ly thì sao. Tui pha muốn gãy tay đây nè.", "neutral"],
      ],
    },
    ti: {
      "keo-tia": [
        ["ti", "Kéo tỉa của ông Năm! Ổng doạ cắt dây loa con bằng cây này nè chú!", "angry"],
        ["ti", "Mà rốt cuộc ổng chỉ quấn băng keo. Ổng dữ ngoài miệng thôi.", "neutral"],
      ],
      "kim-loc": [
        ["ti", "Kìm cắt cáp xịn ghê. Con mượn lắp Gundam được không chú?", "neutral"],
      ],
      "nhan-hop-quang": [
        ["ti", "Nhà con số 7 nè! Cáp nhà con nằm trong bó đó! Ai cắt bó đó là kẻ thù của con!", "angry"],
      ],
    },
  },

  wrong: {
    ongnam: [
      [["ongnam", "Cái gì đây? Mắt tui kém, mà tui thấy rõ là cậu đưa trật rồi!", "angry"]],
      [["ongnam", "Hồi đó tui làm thanh tra phường, tui điều tra còn kỹ hơn cậu!", "angry"]],
      [["ongnam", "Thôi về đi. Ồn ào quá. Ồn ào cả lập luận.", "neutral"]],
      [["ongnam", "(rít điếu cày một hơi dài) ...Sai.", "neutral"], ["teo", "Ổng hút một hơi rồi phán một chữ. Đau hơn chửi.", "nervous"]],
    ],
    loc: [
      [["loc", "Dạ... cái này tui chưa hiểu ý anh lắm. Anh nói lại được không?", "nervous"]],
      [["loc", "Theo chuyên môn của tui thì cái này không có liên quan, anh ạ.", "neutral"]],
      [["loc", "Anh ơi, tui đang lo mất cô Út... à lộn, lo mất sóng, anh đừng làm tui rối thêm.", "nervous"]],
    ],
    cout: [
      [["cout", "Cái này hả? Đưa cái này thì tui tính phí đọc 10 ngàn nha.", "neutral"]],
      [["cout", "Thám tử đi lạc đề rồi. Ra ngồi uống bạc xỉu cho tỉnh đi.", "neutral"]],
      [["cout", "Hỏi lung tung vậy mà cũng làm thám tử. Tui buôn bán còn có logic hơn.", "angry"]],
    ],
    ti: [
      [["ti", "Chú ơi, chú chọn sai rồi. Như con chọn tướng hôm qua, thua sấp mặt.", "neutral"]],
      [["ti", "GG chú ơi. Cái này là miss nha.", "neutral"]],
      [["ti", "Con 16 tuổi mà con còn thấy cái này không liên quan.", "angry"]],
    ],
  },

  deduction: [
    {
      id: "cat-gi",
      text: "Cáp bị cắt lúc {a}, mười tám phút trước giờ bóng lăn. Vết cắt một nhát phẳng, dính {b}, nên dụng cụ là {c}.",
      blanks: {
        a: { answer: "19h12", kind: "luc" },
        b: { answer: "chi-do", kind: "vat" },
        c: { answer: "keo-cat-chi", kind: "vat" },
      },
      explain: [
        ["me", "Lịch sử trận của Tí: mất kết nối 19 giờ 12 phút 40 giây.", "neutral"],
        ["me", "Kìm của Lộc để vết bẹp, kéo tỉa của ông Năm để vết xéo, dao rọc giấy của Tí phải cứa nhiều nhát. Chỉ có kéo cắt chỉ quấn chỉ đỏ mới cắt một nhát gọn và để lại sợi chỉ.", "neutral"],
      ],
    },
    {
      id: "noi-doi",
      text: "{a} khai tới hẻm lúc 8 giờ 15, nhưng sổ bán hàng ghi anh đã ngồi quán từ {b}.",
      blanks: {
        a: { answer: "loc", kind: "ai" },
        b: { answer: "17h40", kind: "luc" },
      },
      explain: [
        ["me", "Lộc nói dối giờ tới, nhưng không phải để cắt cáp. Anh ngồi quán ba tiếng vì cô Út, và chính anh thấy cô ra ngoài lúc hơn 7 giờ.", "neutral"],
        ["teo", "Nói dối vì tình. Tội nhẹ. Đáng thương nặng.", "neutral"],
      ],
    },
    {
      id: "tinh-truoc",
      text: "Cô Út hỏi Lộc cáp đứt bao lâu mới sửa lúc {a}, rồi ký phiếu thuê 30 ghế lúc {b}, khi mạng cả hẻm còn chạy bình thường.",
      blanks: {
        a: { answer: "14h10", kind: "luc" },
        b: { answer: "15h00", kind: "luc" },
      },
      explain: [
        ["me", "Hỏi trước, thuê ghế trước, may băng rôn \"wifi mạnh nhất hẻm\" trước. Ai biết trước mất mạng thì người đó sắp đặt mất mạng.", "neutral"],
      ],
    },
    {
      id: "thu-pham",
      text: "Thủ phạm là {a}. Cô {b} để với tới chỗ dây võng. Động cơ: {c}.",
      blanks: {
        a: { answer: "cout", kind: "ai" },
        b: { answer: "dung-len-banh-xe", kind: "cach" },
        c: { answer: "keo-khach", kind: "vi" },
      },
      explain: [
        ["me", "Dấu dép bông mai trên bánh xe. Ông Năm thấy người đội nón lá, đeo tạp dề nâu. Tí thấy cô Út chùi dép dính bùn rồi giấu đồ vô rổ kim chỉ.", "neutral"],
        ["me", "Quán cô đi cáp riêng từ đường lớn. Cắt cáp hẻm là cả hẻm phải vô quán. 214 ly một đêm.", "neutral"],
      ],
    },
  ],

  finale: {
    culprit: "cout",
    intro: [
      ["narr", "Giờ nghỉ giữa hiệp phụ. Tỉ số 1–1. Cả quán đang nín thở chờ hiệp phụ thứ hai."],
      ["chuba", "(thổi còi) Bà con trật tự! Thám tử có chuyện cần nói!", "neutral"],
      ["batu", "(dựng điện thoại lên ly trà đá) Lên sóng! Lên sóng! Ba ngàn người đang xem nè thám tử!", "happy"],
      ["teo", "Sếp ơi, nói lẹ lẹ nha, sắp đá tiếp rồi.", "nervous"],
      ["me", "Người cắt cáp của Hẻm 47 đang đứng sau quầy pha chế.", "neutral"],
      ["narr", "Cả quán quay đầu. Cô Út đang cầm bình sữa đặc, đứng sững."],
      ["me", "Cô Út. Mời cô.", "neutral"],
    ],
    steps: [
      {
        claim: [
          ["cout", "Tui? Cả tối tui đứng quầy pha chế, cả quán làm chứng!", "angry"],
          ["cout", "Ba chục người ngồi đây, có ai thấy tui ra cột điện đâu?", "angry"],
        ],
        answer: "dau-dep",
        right: [
          ["me", "Dấu dép hoa bông mai cỡ nhỏ trên bánh xe ba gác, ngay dưới chỗ cáp bị cắt. Bùn ướt sau cơn mưa 6 giờ.", "neutral"],
          ["me", "Và người đứng trên bánh xe đó đội nón lá, đeo tạp dề nâu. Ông Năm thấy từ cửa sổ.", "neutral"],
          ["ongnam", "(kéo nón lá xuống) Ờ... tui thấy.", "nervous"],
          ["cout", "...", "shock"],
        ],
        wrong: [["cout", "Cái đó thì nói lên được gì? Tui pha bạc xỉu tiếp đây.", "neutral"], ["batu", "Ơ thám tử ơi, cái đó hơi lạc đề rồi á!", "nervous"]],
      },
      {
        claim: [
          ["cout", "Thì tui ra đầu hẻm coi trời mưa một chút! Mất mạng là xui rủi, ai biết trước được!", "angry"],
        ],
        answer: "tin-nhan-loc",
        right: [
          ["me", "14 giờ 10. Cô nhắn Lộc: \"cáp mạng mà đứt thì mấy tiếng mới sửa xong?\". Lộc trả lời: ban đêm thì phải sáng mai.", "neutral"],
          ["me", "Cô hỏi để chắc rằng đêm nay không ai sửa kịp.", "neutral"],
          ["loc", "Cô Út... tui tưởng cô nhắn vì quan tâm tui.", "nervous"],
          ["cout", "Lộc... tui...", "nervous"],
        ],
        wrong: [["cout", "Không liên quan. Trận đấu sắp tiếp tục rồi đó thám tử.", "neutral"]],
      },
      {
        claim: [
          ["cout", "Hỏi chơi thôi mà! Hỏi một câu cũng thành tội hả?", "angry"],
          ["cout", "Còn ghế là do khách tràn vô bất ngờ, tui mới chạy đi mượn!", "nervous"],
        ],
        answer: "phieu-thue-ghe",
        right: [
          ["me", "Hai Lúa cho thuê bàn ghế. 30 ghế. Ký 15 giờ, giao 16 giờ. Không phải mượn, là thuê. Trước khi mất mạng bốn tiếng.", "neutral"],
          ["teo", "Hai giờ hỏi, ba giờ thuê ghế, chiều may băng rôn, bảy giờ cắt cáp. Lịch trình còn chuẩn hơn lịch tập của đội tuyển!", "shock"],
        ],
        wrong: [["cout", "Thấy chưa, không có gì hết!", "neutral"], ["loc", "Anh ơi, đưa lại cái khác đi anh...", "nervous"]],
      },
      {
        claim: [
          ["cout", "Thì tui tính trước đông khách! Buôn bán phải biết tính!", "angry"],
          ["cout", "Nhưng cắt dây là ông Năm! Bảng ổng ghi \"CẮT DÂY\" sờ sờ, kéo tỉa ổng to tổ bố! Ổng còn đội nón lá kìa!", "angry"],
          ["ongnam", "Tui đội nón lá để trốn coi bóng! Tui không có cắt!", "shock"],
        ],
        answer: "keo-cat-chi",
        right: [
          ["me", "Vết cắt trên cáp phẳng một nhát, có kẹt sợi chỉ đỏ. Kéo tỉa của ông Năm chỉ để lại vết xéo dập.", "neutral"],
          ["me", "Kéo cắt chỉ trong rổ kim chỉ của cô: khoen quấn chỉ đỏ, cùng loại chỉ may băng rôn chiều nay. Mép lưỡi còn dính vụn nhựa đen của vỏ cáp.", "neutral"],
          ["ti", "Đúng rồi! Lúc 7 giờ 20 con thấy cô bỏ cái gì đó vô rổ kim chỉ!", "shock"],
          ["narr", "Bình sữa đặc trên tay cô Út rơi xuống quầy, chảy thành một vệt dài."],
        ],
        wrong: [["cout", "Thấy chưa, chứng cứ đâu? Không có thì bắt ông Năm đi!", "angry"], ["ongnam", "Cậu đưa cái gì vậy! Tui đang bị nghi đó nghe chưa!", "angry"]],
      },
    ],
    confess: [
      ["cout", "Phải. Là tui.", "nervous"],
      ["cout", "Bảy giờ mười hai, tui đội nón lá, đứng lên bánh xe, cắt một nhát. Bằng cây kéo của má tui.", "nervous"],
      ["cout", "Quán này của ba tui để lại. Hai chục năm. Mà ba tháng nay, ngày bán được ba chục ly. Chủ nhà đòi tăng tiền mặt bằng. Cuối tháng này là tui phải dẹp.", "nervous"],
      ["cout", "Tui chỉ muốn... một đêm. Một đêm quán đông như hồi ba còn. Một đêm đủ tiền trả nợ.", "nervous"],
      ["cout", "Mà tui không nghĩ tới cảnh bà con mất sóng, con nít khóc, ông bà ngồi trước cái tivi đen thui.", "shock"],
      ["ongnam", "Sao con không nói với hẻm? Hẻm này không ai để con dẹp quán của ông Út lớn đâu.", "neutral"],
      ["teo", "Sếp ơi... ông Năm vừa nói câu dịu dàng nhất trong đời ổng.", "shock"],
    ],
    epilogue: [
      ["loc", "Cô Út. Tui không có đội hàn. Nhưng tui có cuộn cáp mới với hai mươi phút.", "neutral"],
      ["narr", "Lộc leo thang. Cả hẻm rọi đèn pin điện thoại lên cột điện như một buổi hoà nhạc."],
      ["narr", "Đúng phút thứ 118, đèn mạng trên khắp các nhà trong hẻm bật xanh trở lại."],
      ["chuba", "Có sóng rồi bà con ơi! Về nhà coi được rồi!", "happy"],
      ["narr", "Không ai về. Cả hẻm ngồi lại, kéo thêm ghế nhà mình ra, ghép với 30 cái ghế Hai Lúa."],
      ["batu", "Bà Tư tuyên bố: từ giờ tới hết giải, cả hẻm coi bóng chung ở quán Út! Ai không đồng ý thì... thôi ai cũng đồng ý rồi!", "happy"],
      ["ongnam", "(gỡ nón lá, quàng khăn đỏ đàng hoàng) Lần đầu tiên tui coi bóng không phải trốn.", "neutral"],
      ["ti", "Ông Năm ơi, ông trả loa kẹo kéo cho con nha, con mở cổ vũ.", "neutral"],
      ["ongnam", "Trả. Mà chỉ mở tới 10 giờ.", "neutral"],
      ["cout", "Đêm nay bạc xỉu miễn phí cho cả hẻm. Tiền sửa cáp tui chịu. Lộc, ghi sổ cho anh... không, anh khỏi trả.", "nervous"],
      ["loc", "Cô ghi lại cái trái tim mà cô gạch đi được không?", "nervous"],
      ["cout", "...Để coi đá luân lưu thắng không đã.", "nervous"],
      ["narr", "Loạt luân lưu. Quả cuối cùng. Cả Hẻm 47 nín thở, rồi cùng hét lên một tiếng làm con mèo trên dây điện giật mình rớt xuống... vào đúng cái nón lá của ông Năm."],
      ["teo", "VÔ ĐỊCH! VÔ ĐỊCH! Sếp ơi mình vô địch! Mình phá án! Một đêm hai cúp!", "happy"],
      ["me", "Tèo. Bình tĩnh. ...Ừ. VÔ ĐỊCH.", "happy"],
    ],
    comments: [
      { by: "batu", text: "Đêm chung kết lịch sử của Hẻm 47: mất sóng, phá án, vô địch, ông Năm hét \"VÀO\" 🏆🇻🇳 Bà Tư khóc ba lần", likes: 4210 },
      { by: "Hùng Xe Ôm", text: "Tui xin lỗi ông Năm vì đã nghi ông. Ông là fan cứng nhất hẻm, cứng hơn cả tui", likes: 1876 },
      { by: "Ông Năm (Hẻm 47)", text: "Bóng đá là 22 người chạy theo 1 trái banh. Và tui chạy theo họ 28 năm nay. Hết.", likes: 3502 },
      { by: "Shop Cục Phát Wifi 4G Giá Rẻ", text: "Hẻm có sóng lại rồi thì mua cục phát 4G dự phòng nha bà con, lỡ có ai yêu quán quá 📶 299k thôi", likes: 412 },
      { by: "Tiểu Thư Bánh Bèo 2k5", text: "\"Cô ghi lại cái trái tim mà cô gạch đi được không?\" 😭😭 anh Lộc ơi em xin anh làm nam chính phim em", likes: 2933 },
      { by: "Team Cô Út", text: "Cắt cáp là sai, nhưng hẻm mình để cô Út một mình gánh quán ba tháng cũng sai. Mai tui ra uống bạc xỉu", likes: 2214 },
      { by: "Chị Hai Kế Toán Q3", text: "214 ly x 25k = hơn 5 triệu. Trừ 30 ghế, trừ tiền sửa cáp, trừ bạc xỉu miễn phí... cô Út ơi lỗ rồi cô 😅", likes: 1544 },
      { by: "ti", text: "gỡ được 25 điểm rank + vô địch + được trả loa. đêm đẹp nhất đời con. ai rủ con coi bóng nữa con đi 🎮⚽", likes: 987 },
      { by: "Lộc Nhà Mạng", text: "Nhắc nhở: cắt cáp viễn thông là vi phạm pháp luật nha bà con. Muốn đông khách thì... rủ tui ngồi ba ly bạc xỉu", likes: 1690 },
      { by: "Cô Ba Bán Xôi", text: "Đêm nay xôi tui cũng bán hết sạch nhờ quán Út. Cảm ơn... à không, tui không cảm ơn vụ cắt cáp", likes: 765 },
      { by: "Người Yêu Cũ Của Wifi", text: "Mất wifi ba tiếng mà cả hẻm ngồi chung một quán. Có khi mất sóng mới thấy được nhau 🥲", likes: 2045 },
      { by: "teo", text: "Em đã đoán người ngoài hành tinh. Gần đúng: cô Út cũng ngoài hẻm, đứng trên bánh xe 👽", likes: 301 },
      { by: "chuba", text: "Chú tới trễ trận đấu nhưng kịp loạt luân lưu. Đêm nay phường không phạt ai, chỉ phạt cô Út rửa ly 1 tuần", likes: 1322 },
      { by: "Hai Lúa Cho Thuê Bàn Ghế", text: "30 ghế Hai Lúa đã có mặt trong đêm lịch sử 🪑 Ai cần thuê ghế coi bóng, inbox. (Không hỏi lý do thuê)", likes: 1108 },
    ],
  },

  hints: [
    {
      needs: ["clue:keo-cat-chi", "clue:phieu-thue-ghe", "clue:tin-nhan-loc", "clue:dau-dep"],
      text: "Đủ hết rồi sếp! Kéo, ghế, tin nhắn, dấu dép. Ra bảng suy luận chốt, rồi vạch mặt trước khi đá luân lưu!",
    },
    {
      needs: "broke:loc-toi-tre",
      text: "Anh Lộc ngồi quán từ chiều, lại còn thích cô Út. Hôm nay cô Út có nhắn gì cho ảnh không ta? Hỏi thử đi sếp.",
    },
    {
      needs: "clue:clip-ti",
      text: "Ông nón lá trong clip của Tí là ông Năm! Ổng khai ngủ từ 7 giờ. Mà nhà ổng có cái cửa sổ nhìn thẳng ra cột điện đó sếp.",
    },
    {
      needs: "stmt:ti-o-nha",
      text: "Tí nói ở nhà ngủ, mà tai nghe còn nóng. Quán cô Út có wifi, góc nào có ổ điện trống thì sếp soi thử.",
    },
    {
      needs: "clue:vet-cat",
      text: "Vết cắt phẳng mà dính chỉ đỏ. Nhờ anh Lộc dân chuyên coi giùm đi sếp. Rồi coi trong hẻm ai mới may vá bằng chỉ đỏ.",
    },
    {
      needs: "clue:so-ban-hang",
      text: "Sổ bán hàng có ghi anh Lộc ngồi quán lúc 5 giờ 40 chiều. Mà ảnh khai mấy giờ mới tới vậy sếp?",
    },
    {
      needs: "stmt:cout-muon-ghe",
      text: "Cô Út nói chạy đi mượn ghế. Mà mấy cái ghế trong góc quán có dán sticker gì đó sếp ơi.",
    },
    {
      text: "Em đoán người ngoài hành tinh. Mà thôi, sếp soi cái vết cắt với cái bánh xe dưới chân cột trước đi. Hỏi Tí mạng rớt lúc mấy giờ nữa.",
    },
  ],

  bonus: [
    {
      id: "hop-quang",
      q: "Vì sao quán cô Út vẫn có sóng khi cả hẻm mất mạng?",
      choices: ["Quán đi cáp riêng từ đường lớn, không chung hộp quang với hẻm", "Cô Út xài cục phát 4G", "Lộc sửa riêng cho quán", "Quán có ăng-ten vệ tinh"],
      answer: 0,
      explain: "Nhãn hộp quang: \"Quán Út – KHÔNG thuộc hộp này. Cáp riêng từ đường lớn.\" Cắt bó cáp hẻm thì chỉ có quán là còn sóng.",
    },
    {
      id: "nam-fan",
      q: "Ông Năm mê bóng đá từ năm nào?",
      choices: ["1998", "2008", "2018", "Ông không mê bóng đá"],
      answer: 0,
      explain: "\"Mê từ hồi năm 1998! Cả đời tui chưa bỏ trận nào của đội tuyển!\". Và giấu khăn cổ động dưới gối suốt 28 năm.",
    },
    {
      id: "tim-gach",
      q: "Kế bên dòng \"Lộc nhà mạng – 3 bạc xỉu\" trong sổ bán hàng có gì?",
      choices: ["Một trái tim bị gạch đi", "Chữ \"nợ\" gạch chân", "Một mặt cười", "Số điện thoại của Lộc"],
      answer: 0,
      explain: "Cô Út vẽ một trái tim rồi gạch đi. Cuối vụ Lộc xin cô vẽ lại. Câu trả lời còn chờ sau loạt luân lưu.",
    },
  ],
};
