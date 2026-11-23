// Sự kiện riêng cho cơ chế M3 (docs/quan-com-tam/DRAMA.md §2.7, PLAYBOOK §5): bếp + lật, than + khói, nồi cơm + cơm chiên, bày dĩa,
// phục vụ tại bàn, rửa chén, hộp mang về, ghi sổ, ca trưa / khuya, lên quán, quán nổi tiếng, phụ bàn Bông, ký gửi, hết hàng, mâm cơm,
// nhà cung cấp thứ hai. Điều kiện viết theo cờ hệ khác đặt (s.flags: ghiso-*, catering-*, quan-moved, lunch-today, helper-bong,
// charcoal-low, smoke-high, rain-today) hoặc đọc thẳng trạng thái ca. Cấu trúc: xem chú thích đầu data/events.js. Không emoji.

export const EVENTS_COCHE = [
  // ===== G01 · Lật đúng lúc lần thứ một trăm (bếp + lật) =====
  {
    id: "G01", group: "co-che", tone: "good", when: "shift", cooldown: 7,
    if: { minDay: 3, statMin: { perfectFlips: 8 } }, npc: "me",
    moment: "Lật đúng lúc lần thứ một trăm. Mẹ gọi khen, sườn cũng nghe thấy.",
    nodes: {
      start: {
        mood: "happy",
        line: "Mẹ nghe Cô Út kể con lật sườn đúng lúc hoài, tiếng xèo nghe đều như máy may. Con giỏi giống mẹ hồi đó.",
        me: "Mẹ khen một câu, cả vỉ sườn như sáng lên một độ.",
        choices: [
          { id: "thanks", label: "Cảm ơn mẹ, hỏi mẹo cháy cạnh", hint: "Không tốn gì · khách ca này thoải mái hơn 6 giây",
            say: "Mẹ dặn: 'Cháy cạnh là lúc mỡ vừa reo, đừng chờ nó hát.' Con ghi vô sổ.", fx: { patience: 6000, xp: 3 } },
          { id: "brag", label: "Khoe mẹ con lật trăm miếng không cháy miếng nào", hint: "Không tốn gì · hên xui 60% mẹ khoe cả xóm (ca tới +2 khách), 40% mẹ nhắc 'đừng tự mãn'",
            say: "Trăm miếng không cháy miếng nào đó mẹ!",
            roll: { p: 0.6,
              win: { say: "Mẹ khoe cả xóm chợ. Hôm sau hai bà bạn của mẹ ghé ăn thử.", fx: { nextGuests: 2 } },
              lose: { say: "Mẹ cười: 'Miếng thứ một trăm lẻ một mới khó.' Rồi cúp máy đi tưới cây.", fx: { xp: 2 } } } },
        ],
      },
    },
  },

  // ===== G02 · Khách xem lật sườn như xem xiếc =====
  {
    id: "G02", group: "co-che", tone: "good", when: "shift", cooldown: 4,
    if: { grillMin: 4, waitingMin: 1 }, who: "waiting",
    moment: "Khách đứng xem lật sườn như xem xiếc. Có người vỗ tay sau mỗi lần lật.",
    nodes: {
      start: {
        mood: "surprised",
        line: "Trời, {call} lật sáu miếng một lúc luôn hả? {Self} đứng coi mà quên đói luôn.",
        me: "Khán giả đứng xếp hàng, vỉ sườn thành sân khấu.",
        choices: [
          { id: "show", label: "Lật biểu diễn một vòng", hint: "Không tốn gì · hên xui 60% khách vỗ tay (quán hot), 40% một miếng sém",
            say: "Một, hai, ba, lật! Kẹp gắp xoay một vòng như tay trống.",
            roll: { p: 0.6,
              win: { say: "Sáu miếng lật cùng nhịp, khách vỗ tay rần rần, có người quay clip.", fx: { hype: 1, followers: 15 } },
              lose: { say: "Một miếng sém góc vì mải biểu diễn. Khán giả vẫn vỗ tay, bếp thì hơi buồn.", fx: { smoke: 10 } } } },
          { id: "chair", label: "Mời khách ngồi ghế chờ, xem cho thoải mái", hint: "Không tốn gì · khách chờ thêm 8 giây",
            say: "Ngồi đây xem cho thoải mái nha, sườn chín là có bàn liền.", fx: { patience: 8000 }, goto: "kid" },
        ],
      },
      kid: {
        mood: "happy",
        line: "Một em bé trong nhóm khách chờ hỏi: 'Cô ơi, sao miếng sườn phải lật hai lần vậy cô?'",
        choices: [
          { id: "teach", label: "Giải thích 'mặt nào cũng phải được thương'", hint: "Không tốn gì · +1 danh tiếng",
            say: "Mặt nào cũng phải được nằm lên than một lần, như ai cũng cần được thương.", fx: { rep: 1 } },
          { id: "let", label: "Cho em bé cầm kẹp lật thử (miếng giữ ấm)", hint: "Không tốn gì · hên xui 70% em lật đẹp, 30% miếng sườn lăn",
            say: "Cầm kẹp chắc tay nha con, lật nhẹ thôi.",
            roll: { p: 0.7,
              win: { say: "Em bé lật đẹp, cả nhà vỗ tay. Quán có thêm một đầu bếp tương lai.", fx: { hype: 1 } },
              lose: { say: "Miếng sườn lăn một vòng rồi nằm lại đúng chỗ. Em bé cười, cô chủ cười, sườn không sao.", fx: { xp: 2 } } } },
        ],
      },
    },
  },

  // ===== G03 · Bao than loại tốt của Anh Sáu =====
  {
    id: "G03", group: "co-che", tone: "mixed", when: "day", cooldown: 8,
    if: { minDay: 4 }, npc: "anh-sau",
    moment: "Anh Sáu tặng bao than 'loại tốt'. Than tốt thật, hoặc ướt thật, tuỳ hôm.",
    nodes: {
      start: {
        mood: "happy",
        line: "Em ơi, anh chở cho ông chủ vựa, ổng tặng anh bao than loại tốt. Anh đâu có bếp, tặng em nè!",
        me: "Than miễn phí, kèm một câu chuyện miễn phí dài mười lăm phút.",
        choices: [
          { id: "take", label: "Nhận bao than", hint: "Không tốn gì · hên xui 60% than tốt (+6 rổ), 40% than ướt (+2 rổ dùng được)",
            say: "Cảm ơn anh Sáu, để em nhóm thử.",
            roll: { p: 0.6,
              win: { say: "Than tốt thật, đỏ đều, ít khói. Anh Sáu được mời một dĩa cơm cảm ơn.", fx: { stock: { than: 6 } } },
              lose: { say: "Than ướt sũng, phơi cả buổi chỉ dùng được hai rổ. Anh Sáu gãi đầu: 'Chắc ổng để ngoài mưa.'", fx: { stock: { than: 2 } } } } },
          { id: "pay", label: "Gửi anh tiền xăng", hint: "−10k · +6 rổ than, anh vui",
            say: "Than em nhận, tiền xăng anh cầm. Có qua có lại mới toại lòng nhau.", fx: { money: -10, stock: { than: 6 }, rep: 1 } },
          { id: "no", label: "Từ chối, anh mang về bán", hint: "Không tốn gì · +1 XP",
            say: "Anh mang ra vựa bán lại lấy tiền uống cà phê đi anh.", fx: { xp: 1 } },
        ],
      },
    },
  },

  // ===== G04 · Than sắp hết (cờ charcoal-low) =====
  {
    id: "G04", group: "co-che", tone: "mixed", when: "day", cooldown: 3,
    if: { anyFlags: ["charcoal-low"] }, npc: "chu-hoa",
    moment: "Than sắp hết. Chú Hòa tới lúc bốn giờ sáng, đúng như lời đồn.",
    nodes: {
      start: {
        mood: "neutral",
        line: "Chú đi ngang thấy bao than của con xẹp lép. Lấy một bao không, chú để giá vựa.",
        me: "Bốn giờ sáng có người gõ cửa bán than. Đây là dịch vụ hay là phép màu?",
        choices: [
          { id: "buy", label: "Lấy một bao", hint: "−36k · +10 rổ than (rẻ hơn chợ)",
            say: "Lấy một bao. Chú Hòa vác vô tận bếp, xếp gọn như xếp gạch.", fx: { money: -36, stock: { than: 10 }, unflag: "charcoal-low" } },
          { id: "half", label: "Lấy nửa bao trả sau", hint: "Không tốn tiền hôm nay · +5 rổ, mai trả",
            say: "Nửa bao trả sau nha chú. Chú gật đầu, ghi vô cuốn sổ nhỏ bằng bàn tay.", fx: { stock: { than: 5 }, flag: "no-than-hoa", unflag: "charcoal-low" } },
          { id: "no", label: "Cảm ơn, con mua chợ", hint: "Không tốn gì · không có gì thêm",
            say: "Dạ con ghé chợ mua cho tiện, cảm ơn chú.", fx: { xp: 1 } },
        ],
      },
    },
  },

  // ===== SM1 · Khói mù giữa ca (khói) =====
  {
    id: "SM1", group: "co-che", tone: "bad", when: "shift", cooldown: 3,
    if: { smokeMin: 75 }, npc: "owner",
    moment: "Khói mù cả quán. Khách ho một tiếng, cô chủ quạt mười tiếng.",
    nodes: {
      start: {
        mood: "annoyed",
        line: "Khói trắng xoá, bàn gần bếp ho khụ khụ, có người lấy khăn lạnh che mặt.",
        me: "Quán đang nướng sườn hay đang quay phim ma vậy trời.",
        choices: [
          { id: "fan", label: "Quạt khói ra phía đường", hint: "Không tốn gì · khói −30, cô chủ quạt 4 giây",
            say: "Quạt mo đổi hướng, khói bay ra đường như đoàn xe rước dâu.", fx: { smoke: -30, away: 4000, flag: "khoi-cao", flagDays: 2 }, later: { id: "D03", days: 1 } },
          { id: "towel", label: "Tặng khăn lạnh mọi bàn", hint: "−4 khăn lạnh · khách dễ chịu hơn 8 giây",
            say: "Mỗi bàn một cái khăn lạnh, xin lỗi vì khói.", fx: { stock: { "khan-lanh": -4 }, patience: 8000, smoke: -10 } },
          { id: "joke", label: "Gọi đây là 'phòng xông hơi hương sườn'", hint: "Không tốn gì · hên xui 50% khách cười (+1 danh tiếng), 50% bớt kiên nhẫn",
            say: "Quán tặng kèm dịch vụ xông hơi hương sườn, miễn phí!",
            roll: { p: 0.5,
              win: { say: "Khách cười ra nước mắt, một phần vì vui, một phần vì khói.", fx: { rep: 1, smoke: -10 } },
              lose: { say: "Không ai cười, chỉ có tiếng ho. Cô chủ lặng lẽ quạt khói.", fx: { patience: -5000, smoke: -10 } } } },
        ],
      },
    },
  },

  // ===== C01 · Cơm dư thành cơm chiên (nồi cơm) =====
  {
    id: "C01", group: "co-che", tone: "good", when: "day", cooldown: 4,
    if: { anyFlags: ["com-du"] }, npc: "tho-luc",
    moment: "Cơm dư hôm qua thành cơm chiên. Khách hỏi 'mai có nữa không'.",
    nodes: {
      start: {
        mood: "happy",
        line: "Chị ơi, hôm qua em thấy chị đổ cơm dư tiếc quá. Chị chiên lên bán đi, em mua đầu tiên!",
        me: "Cơm dư hôm qua, nếu chiên với mỡ hành, chắc thành món chính hôm nay.",
        choices: [
          { id: "fry", label: "Chiên cơm dư bán buổi sáng", hint: "Không tốn gì · +30k, khách hỏi mai có nữa không",
            say: "Chiên cơm dư với mỡ hành, trứng, chút sườn vụn. Thợ Lực ăn hai dĩa.", fx: { money: 30, rep: 1, flag: "com-chien" }, goto: "more" },
          { id: "staff", label: "Chiên ăn trưa cho cả nhà", hint: "Không tốn gì · ca tới cô chủ no bụng, làm nhanh hơn",
            say: "Chiên một chảo lớn ăn trưa. Lần đầu cô chủ ăn cơm trước khi bán cơm.", fx: { mod: { id: "an-no", days: 1, patience: 4 } } },
        ],
      },
      more: {
        mood: "surprised",
        line: "Chị ơi mai có cơm chiên nữa không? Em rủ cả đội tới!",
        choices: [
          { id: "yes", label: "Hứa có nếu còn cơm dư", hint: "Không tốn gì · ca tới thêm 2 thợ",
            say: "Có cơm dư thì có cơm chiên. Cơm dư thành món đặc biệt của buổi sáng.", fx: { arch: { arch: "worker2", n: 2 } } },
          { id: "secret", label: "Nói đó là món bí mật, có hôm có hôm không", hint: "Không tốn gì · +1 danh tiếng",
            say: "Món bí mật, ai may mắn mới gặp. Thợ Lực gật gù như được tiết lộ bí kíp.", fx: { rep: 1 } },
        ],
      },
    },
  },

  // ===== C02 · Cơm cháy đáy nồi =====
  {
    id: "C02", group: "co-che", tone: "good", when: "shift", cooldown: 4,
    if: { riceMax: 3, phase: ["cao", "khuya"] }, npc: "co-ut",
    moment: "Khách quen xin cơm cháy đáy nồi. Phần ngon nhất không có trên menu.",
    nodes: {
      start: {
        mood: "happy",
        line: "Nồi gần cạn rồi kìa con. Cho cô xin miếng cơm cháy đáy nồi, cô thèm từ hồi chiều.",
        me: "Miếng cơm cháy giòn rụm, thứ mà người trong nghề giấu cho mình ăn.",
        choices: [
          { id: "give", label: "Cạo cơm cháy tặng cô", hint: "Không tốn gì · +1 danh tiếng",
            say: "Cạo miếng cơm cháy vàng ruộm, rưới chút mỡ hành. Cô Út ăn như ăn bánh.", fx: { rep: 1 } },
          { id: "sell", label: "Bán cơm cháy chấm mỡ hành 5k", hint: "Không tốn gì · +5k, hên xui 50% khách khác cũng đòi",
            say: "Cơm cháy chấm mỡ hành, năm ngàn một miếng, món ẩn của quán.",
            roll: { p: 0.5,
              win: { say: "Khách bàn bên nghe thấy, đòi luôn. Bán hết đáy nồi trong ba phút.", fx: { money: 20, hype: 1 } },
              lose: { say: "Chỉ có Cô Út mua, ăn xong khen 'giòn như hồi xưa'.", fx: { money: 5 } } } },
        ],
      },
    },
  },

  // ===== P01 · Dĩa đặc biệt đẹp như hình =====
  {
    id: "P01", group: "co-che", tone: "good", when: "shift", cooldown: 3,
    if: { lastServe: { clean: true, phone: true, maxAgeMs: 8000 } }, who: "lastServed",
    moment: "Khách chụp dĩa cơm đẹp như hình menu, xin đăng. Hình menu ghen tị.",
    nodes: {
      start: {
        mood: "happy",
        line: "{Call} ơi, dĩa này đẹp y như hình menu luôn! {Self} chụp đăng được không {call}?",
        me: "Dĩa cơm đủ lớp: cơm, mỡ hành, sườn, đồ chua, dưa leo, nước mắm. Đẹp như được chụp trước khi ăn.",
        choices: [
          { id: "pose", label: "Cho chụp, xoay dĩa góc đẹp nhất", hint: "Không tốn gì · +30 người theo dõi",
            say: "Xoay dĩa một góc ba mươi độ, miếng sườn cháy cạnh hướng về ống kính.", fx: { followers: 30 } },
          { id: "tag", label: "Nhờ gắn tên quán", hint: "Không tốn gì · hên xui 60% bài đăng lan (+60 người theo dõi), 40% chỉ bạn bè xem",
            say: "Đăng thì gắn tên quán giùm chị nha!",
            roll: { p: 0.6,
              win: { say: "Bài đăng lan qua ba nhóm ăn uống. Tên quán được nhắc kèm chữ 'đẹp như hình'.", fx: { followers: 60, hype: 1 } },
              lose: { say: "Bài đăng chỉ có bạn bè thả tim. Nhưng thả tim thì vẫn là tim.", fx: { followers: 10 } } } },
        ],
      },
    },
  },

  // ===== B01 · Áo khoác bỏ quên, Bông giữ =====
  {
    id: "B01", group: "co-che", tone: "good", when: "shift", cooldown: 5,
    if: { flags: ["helper-bong"] }, npc: "bong",
    moment: "Khách quên áo khoác, Bông giữ, gấp gọn như ở tiệm may.",
    nodes: {
      start: {
        mood: "surprised",
        line: "Chị ơi, bàn hai để quên cái áo khoác nè. Trong túi có vé xe đò về quê ngày mai!",
        me: "Vé xe đò ngày mai. Cái áo này quan trọng hơn cả cái áo.",
        choices: [
          { id: "run", label: "Cho Bông chạy theo", hint: "Không tốn gì · hên xui 70% kịp trả (+2 danh tiếng)",
            say: "Bông chạy theo, vừa chạy vừa vẫy cái áo như cờ.",
            roll: { p: 0.7,
              win: { say: "Kịp! Anh khách cảm ơn rối rít, hứa về quê mang bánh tét lên tặng quán.", fx: { rep: 2 } },
              lose: { say: "Không kịp, Bông về thở hổn hển. Áo được treo ngay cột, chờ chủ quay lại.", fx: { xp: 2 } } } },
          { id: "hang", label: "Treo áo ở cột, ghi giấy", hint: "Không tốn gì · +1 danh tiếng khi khách quay lại",
            say: "Treo áo ở cột, dán tờ giấy 'Áo của anh bàn hai, quán giữ giùm'.", fx: { rep: 1 }, later: { id: "BO2", days: 2 } },
        ],
      },
    },
  },

  // ===== B02 · Cầu hôn ở bàn hai =====
  {
    id: "B02", group: "co-che", tone: "good", when: "shift", cooldown: 10,
    if: { kind: "toi", phase: "khuya", seatedMin: 1 }, who: "seated",
    moment: "Có người cầu hôn ở quán cơm tấm. Nhẫn để trong chén nước mắm sạch.",
    nodes: {
      start: {
        mood: "surprised",
        line: "{Call} ơi, nhỏ thôi… {self} sắp cầu hôn bạn gái. {Call} tắt đèn dây giùm {self} một phút được không?",
        me: "Cầu hôn ở quán cơm tấm vỉa hè. Lãng mạn tới mức mỡ hành cũng xúc động.",
        choices: [
          { id: "lights", label: "Tắt đèn, cả quán hồi hộp", hint: "Không tốn gì · khách mới chờ 10 giây, hên xui 85% cô ấy đồng ý",
            say: "Tắt đèn dây, cả quán nín thở, chỉ còn tiếng than nổ lách tách.", fx: { pauseGuests: 10000 },
            roll: { p: 0.85,
              win: { say: "Cô ấy gật đầu! Cả quán vỗ tay, cô chủ tặng hai ly trà tắc 'chúc mừng hạnh phúc'.", fx: { rep: 2, hype: 1, followers: 40 } },
              lose: { say: "Cô ấy nói 'để em suy nghĩ'. Cả quán vỗ tay động viên, anh chàng gọi thêm dĩa cơm cho đỡ run.", fx: { rep: 1 } } } },
          { id: "egg", label: "Làm trứng ốp la hình trái tim", hint: "−1 trứng · +2 danh tiếng",
            say: "Trứng ốp la hình trái tim, đặt nhẹ lên dĩa cơm. Ai bảo cơm tấm không biết lãng mạn.", fx: { stock: { trung: -1 }, rep: 2 } },
          { id: "normal", label: "Chúc may mắn, giữ đèn như cũ", hint: "Không tốn gì · +1 XP",
            say: "Chúc em may mắn, đèn quán sáng sẵn cho tương lai sáng sủa.", fx: { xp: 1 } },
        ],
      },
    },
  },

  // ===== B03 · Ghép bàn hai nhóm lạ =====
  {
    id: "B03", group: "co-che", tone: "good", when: "shift", cooldown: 4,
    if: { waitingMin: 2, phase: "cao" }, npc: "owner",
    moment: "Ghép bàn hai nhóm lạ. Ăn xong thành bạn, hẹn tuần sau ăn tiếp.",
    nodes: {
      start: {
        mood: "neutral",
        line: "Hai nhóm khách lạ đứng chờ, bàn thì chỉ còn chỗ ghép. Ai cũng nhìn nhau ngại ngùng.",
        me: "Quán vỉa hè, nhiều khi cái bàn là nơi người lạ thành người quen.",
        choices: [
          { id: "join", label: "Mời hai nhóm ghép bàn, tặng trà", hint: "Không tốn gì · hên xui 60% thành bạn (+1 danh tiếng), 40% ăn im lặng",
            say: "Mời hai nhóm ngồi chung, quán tặng bình trà làm quen.",
            roll: { p: 0.6,
              win: { say: "Hai nhóm ngồi chung, phát hiện cùng quê. Ăn xong trao số điện thoại.", fx: { rep: 1, patience: 6000, teaAll: true } },
              lose: { say: "Hai nhóm ngồi chung, ăn nhanh trong im lặng. Ít nhất không ai phải đứng chờ.", fx: { patience: 3000 } } } },
          { id: "wait", label: "Mời chờ bàn riêng", hint: "Không tốn gì · khách chờ bớt kiên nhẫn 5 giây",
            say: "Mời hai nhóm chờ chút, bàn riêng sắp có.", fx: { patience: -5000 } },
        ],
      },
    },
  },

  // ===== W01 · Dì Năm đòi tăng lương bằng radio (rửa chén) =====
  {
    id: "W01", group: "co-che", tone: "good", when: "day", once: true,
    if: { minLevel: 6, minDay: 6 }, npc: "di-nam",
    moment: "Dì Năm rửa chén đòi tăng lương bằng một cái radio. Thau chén có nhạc.",
    nodes: {
      start: {
        mood: "neutral",
        line: "Dì rửa chén cho con ba tháng rồi. Dì không đòi tăng lương, dì chỉ xin một cái radio để rửa cho vui tay.",
        me: "Lời đề nghị tăng lương dễ thương nhất lịch sử ngành rửa chén.",
        choices: [
          { id: "radio", label: "Mua radio cũ", hint: "−40k · thêm radio, dĩa rửa nhanh hơn, khách khuya thích",
            say: "Mua cái radio cũ ở chợ trời. Dì Năm vừa rửa vừa hát cải lương, dĩa sạch nhanh gấp đôi.", fx: { money: -40, decor: "old-radio", rep: 1, mod: { id: "radio-di-nam", days: 30, patience: 3 } } },
          { id: "phone", label: "Cho dì mượn điện thoại mở nhạc", hint: "Không tốn gì · hên xui 50% dì vui, 50% dì bấm nhầm gọi video cho mẹ",
            say: "Dì mở nhạc bằng điện thoại con nha.",
            roll: { p: 0.5,
              win: { say: "Dì mở bài vọng cổ, rửa chén theo nhịp, vui như đi hội.", fx: { xp: 3 } },
              lose: { say: "Dì bấm nhầm gọi video cho mẹ. Mẹ thấy thau chén, hỏi 'sao con bắt dì rửa nhiều vậy'.", fx: { xp: 2 } } } },
          { id: "sing", label: "Hứa hát cho dì nghe mỗi tối", hint: "Không tốn gì · +1 XP",
            say: "Con hát cho dì nghe. Dì nghe được hai câu, xin chuyển sang mua radio.", fx: { xp: 1 } },
        ],
      },
    },
  },

  // ===== H01 · Shipper đọc nhầm đơn (hộp mang về) =====
  {
    id: "H01", group: "co-che", tone: "mixed", when: "shift", cooldown: 4,
    if: { owns: "takeaway-shelf" }, npc: "shipper",
    moment: "Shipper đọc nhầm đơn: ba hộp thành mười ba. May mà còn kịp hỏi lại.",
    nodes: {
      start: {
        mood: "surprised",
        line: "Chị ơi đơn này mười ba hộp sườn nha… à khoan, em đọc lại… hình như ba hộp, số một là cái vết xước màn hình.",
        me: "Mười ba hay ba, khác nhau đúng một vết xước và mười cái hộp.",
        choices: [
          { id: "ask", label: "Gọi khách xác nhận lại", hint: "Không tốn gì · đúng ba hộp, shipper chờ thêm chút",
            say: "Gọi khách hỏi lại: đúng ba hộp. Shipper lau màn hình bằng vạt áo.", fx: { arch: { arch: "shipper", n: 1 }, xp: 2 } },
          { id: "thirteen", label: "Làm luôn mười ba cho chắc", hint: "−10 hộp · hên xui 30% khách lấy hết thật (+150k), 70% dư mười hộp",
            say: "Làm mười ba hộp, dư thì bán khách sau.", fx: { stock: { hop: -10 } },
            roll: { p: 0.3,
              win: { say: "Khách lấy hết mười ba thật, công ty đang liên hoan. Shipper chở hai chuyến.", fx: { money: 150 } },
              lose: { say: "Khách chỉ đặt ba. Mười hộp dư bán dần cho khách khuya, hơi nguội.", fx: { money: 40 } } } },
        ],
      },
    },
  },

  // ===== H02 · Shipper xin sạc điện thoại =====
  {
    id: "H02", group: "co-che", tone: "good", when: "shift", cooldown: 4,
    if: { owns: "takeaway-shelf" }, npc: "shipper",
    moment: "Shipper xin sạc nhờ điện thoại. Quán có thêm một ổ cắm tình thương.",
    nodes: {
      start: {
        mood: "neutral",
        line: "Chị ơi cho em sạc nhờ cái điện thoại năm phút, còn hai phần trăm, đơn tiếp theo ở tận quận khác.",
        me: "Hai phần trăm pin. Một trong những trạng thái đáng sợ nhất của người chạy đơn.",
        choices: [
          { id: "charge", label: "Cho sạc, mời ly trà", hint: "Không tốn gì · +1 danh tiếng, shipper hay ghé quán",
            say: "Ổ cắm cạnh nồi cơm đó em, uống ly trà đá chờ cho mát.", fx: { rep: 1, mod: { id: "shipper-ghe", days: 5, guests: { shipper: 1 } } }, later: { id: "H01", days: 3 }, goto: "story" },
          { id: "box", label: "Cho sạc, nhờ chở luôn một đơn gần", hint: "Không tốn gì · +15k, shipper vui",
            say: "Sạc đi em, tiện chở giùm chị hộp cơm cho bà cụ đầu hẻm.", fx: { money: 15, xp: 2 } },
        ],
      },
      story: {
        mood: "neutral",
        line: "Chờ sạc, anh giao hàng kể: tối nay chạy ba mươi đơn, có đơn giao tận tầng mười hai không thang máy.",
        choices: [
          { id: "feed", label: "Mời anh dĩa cơm giá vốn", hint: "Không tốn gì · +1 danh tiếng",
            say: "Ăn dĩa cơm cho có sức, quán lấy giá vốn thôi.", fx: { rep: 1, money: 10 } },
          { id: "listen", label: "Nghe hết chuyện, rót thêm trà", hint: "Không tốn gì · +1 XP",
            say: "Nghe hết chuyện tầng mười hai, rót thêm ly trà. Pin đầy, lòng cũng đầy.", fx: { xp: 1 } },
        ],
      },
    },
  },

  // ===== S01 · Bàn bốn đòi chia tiền từng người (tính tiền) =====
  {
    id: "S01", group: "co-che", tone: "mixed", when: "shift", cooldown: 4,
    if: { seatedMin: 1, phase: ["cao", "khuya"] }, who: "seated",
    moment: "Bàn bốn người đòi tính riêng từng người. Máy tính bỏ túi làm việc hết công suất.",
    nodes: {
      start: {
        mood: "neutral",
        line: "{Call} ơi, tính riêng từng người giùm {self} nha. Người này thêm cơm, người kia không trứng, người nọ uống hai ly trà.",
        me: "Một bàn, nhiều hoá đơn, một cô chủ và một cái máy tính bỏ túi đã tróc phím số bảy.",
        choices: [
          { id: "each", label: "Tính riêng từng người", hint: "Không tốn gì · cô chủ đứng tính 5 giây, khách vui",
            say: "Tính riêng từng người, đọc to từng món. Cả bàn gật gù như nghe điểm thi.", fx: { away: 5000, rep: 1 } },
          { id: "round", label: "Đề nghị chia đều làm tròn", hint: "Không tốn gì · hên xui 60% cả bàn đồng ý, 40% người ăn ít phản đối",
            say: "Mình chia đều cho nhanh nha, làm tròn xuống luôn.",
            roll: { p: 0.6,
              win: { say: "Cả bàn đồng ý, người ăn nhiều cười khì, người ăn ít được làm tròn xuống.", fx: { xp: 2 } },
              lose: { say: "Người ăn ít nhất phản đối: 'Em có ăn trứng đâu!' Đành tính lại từng người.", fx: { away: 6000 } } } },
        ],
      },
    },
  },

  // ===== S02 · Sổ nợ chạm hạn mức (ghi sổ) =====
  {
    id: "S02", group: "co-che", tone: "mixed", when: "day", cooldown: 5,
    if: { anyFlags: ["ghiso-open", "ghiso-thang"], debtMin: 50 }, npc: "anh-sau",
    moment: "Sổ nợ chạm hạn mức. Anh Sáu dẫn bạn tới ghi chung, sổ nợ thành sổ bạn bè.",
    nodes: {
      start: {
        mood: "happy",
        line: "Em ơi, đây là thằng Tám, bạn xe ôm của anh. Nó ghi sổ chung với anh được không? Hai đứa trả một lần cho gọn.",
        me: "Sổ nợ đang dài {debt}k, giờ có thêm một người bạn của sổ nợ.",
        choices: [
          { id: "yes", label: "Cho ghi chung", hint: "Không tốn gì hôm nay · ca tới thêm 2 tài xế, sổ nợ dài thêm",
            say: "Ghi chung thì ghi chung, nhưng hai anh phải trả đúng hẹn nha.", fx: { arch: { arch: "driver", n: 2 }, debt: { who: "anh-sau", k: 25 } }, goto: "pay" },
          { id: "no", label: "Từ chối khéo, mời ăn trả liền", hint: "Không tốn gì · hên xui 50% anh Tám trả liền, 50% hai anh đi quán khác",
            say: "Sổ hết trang rồi anh ơi, ăn trả liền thì em làm liền.",
            roll: { p: 0.5,
              win: { say: "Anh Tám móc tiền trả liền, còn khen 'quán rõ ràng'.", fx: { money: 25 } },
              lose: { say: "Hai anh cười trừ, qua quán bên. Mai Anh Sáu vẫn ghé, một mình.", fx: { xp: 1 } } } },
        ],
      },
      pay: {
        mood: "neutral",
        line: "Anh Tám nói nhỏ: 'Thằng Sáu kể quán tử tế lắm. Anh trả trước một nửa phần của anh Sáu luôn nha.'",
        choices: [
          { id: "take", label: "Nhận, gạch sổ một nửa", hint: "Không tốn gì · +nửa nợ về két",
            say: "Gạch sổ một nửa. Anh Sáu đứng sau lưng, mắt rưng rưng như được cứu.", fx: { money: 40, debt: { who: "anh-sau", k: -40 } } },
          { id: "keep", label: "Thôi anh giữ, để anh Sáu tự trả", hint: "Không tốn gì · +1 danh tiếng",
            say: "Anh giữ tiền đi, nợ ai người nấy trả cho có trách nhiệm.", fx: { rep: 1 } },
        ],
      },
    },
  },

  // ===== S03 · Khách nợ quên, trả kèm thư =====
  {
    id: "S03", group: "co-che", tone: "good", when: "day", once: true,
    if: { minDay: 14, anyFlags: ["ghiso-unpaid-*", "ghiso-early-anh-sau"] }, npc: "co-ut",
    moment: "Khách nợ quên luôn, mười bốn ngày sau trả kèm một lá thư viết tay.",
    nodes: {
      start: {
        mood: "happy",
        line: "Con ơi, có người gửi cô đưa con cái phong bì nè. Trong có tiền với lá thư, chữ viết tay nghiêng nghiêng.",
        me: "Lá thư viết: 'Xin lỗi quán, tôi quên. Dĩa cơm hôm đó ngon nên tôi nhớ lại.'",
        choices: [
          { id: "keep", label: "Gạch sổ, giữ lá thư", hint: "Không tốn gì · +30k nợ cũ, +1 danh tiếng",
            say: "Gạch sổ. Lá thư được kẹp vào cuốn sổ nợ, trang đầu tiên.", fx: { money: 30, rep: 1, unflag: "ghiso-early-anh-sau" } },
          { id: "post", label: "Dán lá thư lên tường", hint: "Không tốn gì · +30k, thêm người theo dõi",
            say: "Dán lá thư lên tường cạnh menu. Khách đọc xong ai cũng muốn trả tiền trước.", fx: { money: 30, followers: 25, decor: "la-thu" } },
        ],
      },
    },
  },

  // ===== L01 · Cả văn phòng tới cùng lúc 12:00 (ca trưa) =====
  {
    id: "L01", group: "co-che", tone: "mixed", when: "shift", cooldown: 3,
    if: { kind: "trua", fMin: 0.3 }, npc: "khach-vp",
    moment: "Mười hai giờ đúng, cả văn phòng đổ xuống. Quán thành phòng họp có mùi mỡ hành.",
    nodes: {
      start: {
        mood: "surprised",
        line: "Chị ơi, cả phòng em mười người, xuống cùng lúc nè. Sếp cho nghỉ đúng bốn mươi lăm phút!",
        me: "Mười người, bốn mươi lăm phút, sáu chỗ trên vỉ. Toán học không đứng về phía mình.",
        choices: [
          { id: "all", label: "Nhận hết, xếp ghế đẩu", hint: "Không tốn gì · thêm 3 nhóm văn phòng, khách chờ bớt kiên nhẫn 5 giây",
            say: "Nhận hết, kê thêm ghế đẩu, văn phòng thành quán.", fx: { arch: { arch: "office", n: 3 }, patience: -5000 }, goto: "box" },
          { id: "box", label: "Đề nghị một nửa ăn hộp mang lên", hint: "Không tốn gì · thêm 2 nhóm, đỡ chật",
            say: "Một nửa ngồi đây, một nửa chị gói hộp mang lên văn phòng.", fx: { arch: { arch: "office", n: 2 } } },
        ],
      },
      box: {
        mood: "neutral",
        line: "Mười phút sau, một chị nhìn đồng hồ: 'Còn hai lăm phút thôi chị ơi.'",
        choices: [
          { id: "rush", label: "Bưng dồn, xin lỗi vì chật", hint: "Không tốn gì · bàn đang ngồi chờ thêm 8 giây",
            say: "Bưng dồn từng dĩa, mỗi dĩa kèm một câu 'xin lỗi chật quá nha'.", fx: { patience: 8000 } },
          { id: "tea", label: "Châm trà một vòng cho đỡ sốt ruột", hint: "Không tốn gì · châm trà mọi bàn",
            say: "Châm trà một vòng. Ly trà đầy, lòng bớt hối.", fx: { teaAll: true } },
        ],
      },
    },
  },

  // ===== L02 · Tài xế ngủ gật trên ghế (khuya) =====
  {
    id: "L02", group: "co-che", tone: "good", when: "shift", cooldown: 4,
    if: { kind: "toi", phase: "khuya", archPresent: "driver" }, npc: "owner",
    moment: "Tài xế ngủ gật trên ghế nhựa. Quán để yên, đắp giùm cái khăn.",
    nodes: {
      start: {
        mood: "neutral",
        line: "Anh tài xế ăn xong, ngả lưng vô tường, ngủ gật lúc nào không hay. Tay vẫn cầm đôi đũa.",
        me: "Chạy xe từ sáng tới khuya, giấc ngủ mười phút trên ghế nhựa chắc quý hơn vàng.",
        choices: [
          { id: "let", label: "Để anh ngủ mười phút", hint: "Không tốn gì · +1 danh tiếng, khách chờ bớt kiên nhẫn 4 giây",
            say: "Để anh ngủ. Đắp giùm cái khăn, rót sẵn ly trà để bên cạnh.", fx: { rep: 1, patience: -4000 }, goto: "wake" },
          { id: "wake", label: "Gọi nhẹ, mời ly trà đá cho tỉnh", hint: "Không tốn gì · bàn trống sớm",
            say: "Anh ơi, ly trà đá cho tỉnh nè, chạy xe cẩn thận nha.", fx: { xp: 2 } },
        ],
      },
      wake: {
        mood: "surprised",
        line: "Mười phút sau anh giật mình tỉnh dậy: 'Chết, mấy giờ rồi em? Anh có cuốc đón sân bay!'",
        choices: [
          { id: "box", label: "Gói vội hộp cơm cho anh mang theo", hint: "−1 hộp · +1 danh tiếng",
            say: "Gói vội hộp cơm, nhét thêm chai nước. Anh chạy đi, quay đầu cảm ơn ba lần.", fx: { stock: { hop: -1 }, rep: 1 } },
          { id: "time", label: "Báo giờ, chúc anh chạy cẩn thận", hint: "Không tốn gì · +1 XP",
            say: "Mười giờ bốn lăm anh ơi, chạy cẩn thận, đừng ngủ gật trên xe.", fx: { xp: 1 } },
        ],
      },
    },
  },

  // ===== Q10 · Ngày dọn vào quán (lên quán) =====
  {
    id: "Q10", group: "co-che", tone: "good", when: "day", once: true,
    if: { anyFlags: ["quan-moved"] }, npc: "anh-sau",
    moment: "Dọn từ vỉa hè vào quán có mái. Anh Sáu, Cô Út, Anh Quang tới chúc mừng.",
    nodes: {
      start: {
        mood: "happy",
        line: "Chúc mừng em có quán có mái! Cô Út với Anh Quang cũng tới nè. Anh Quang nói 'giờ khỏi nhắc vạch sơn rồi'.",
        me: "Có mái, có tường, có cửa. Mà sao vẫn nhớ cái vạch sơn một mét hai.",
        choices: [
          { id: "treat", label: "Mời cả ba dĩa khai trương", hint: "−3 sườn ướp · +3 danh tiếng",
            say: "Ba dĩa khai trương cho ba người đầu tiên. Anh Quang ăn xong vẫn quen miệng nhắc 'kéo bàn vô giùm em'.", fx: { stock: { "suon-uop": -3 }, rep: 3 }, goto: "photo" },
          { id: "speech", label: "Nói vài câu cảm ơn", hint: "Không tốn gì · +1 danh tiếng",
            say: "Cảm ơn mọi người đã ăn cơm vỉa hè hai năm. Giờ có mái rồi, mưa cũng không sợ.", fx: { rep: 1 }, goto: "photo" },
        ],
      },
      photo: {
        mood: "happy",
        line: "Cô Út đề nghị: 'Chụp tấm hình kỷ niệm đi con, đứng trước bảng hiệu mới.'",
        choices: [
          { id: "snap", label: "Chụp hình treo tường", hint: "Không tốn gì · thêm ảnh kỷ niệm, +40 người theo dõi",
            say: "Chụp hình kỷ niệm, ai cũng cười, Anh Sáu nhắm mắt.", fx: { decor: "anh-khai-truong", followers: 40, unflag: "quan-moved" } },
          { id: "later", label: "Để mai chụp, giờ bán đã", hint: "Không tốn gì · +1 XP",
            say: "Chụp sau nha, giờ than đỏ rồi, bán cái đã.", fx: { xp: 1, unflag: "quan-moved" } },
        ],
      },
    },
  },

  // ===== Q11 · "Ngồi vỉa hè vui hơn mà" =====
  {
    id: "Q11", group: "co-che", tone: "good", when: "shift", cooldown: 8,
    if: { stage: "quan" }, npc: "co-ut",
    moment: "Khách quen hỏi 'ngồi vỉa hè vui hơn mà'. Quán mở cửa sổ cho gió vào.",
    nodes: {
      start: {
        mood: "neutral",
        line: "Quán đẹp ha con. Mà cô nói thiệt, ngồi vỉa hè vui hơn, có gió, có người qua lại.",
        me: "Có mái thì đỡ mưa, nhưng mất gió. Đời không có gì trọn vẹn, trừ dĩa cơm đủ lớp.",
        choices: [
          { id: "window", label: "Mở cửa sổ, kê một bàn ra ngoài cho khách quen", hint: "Không tốn gì · +1 danh tiếng",
            say: "Kê một bàn nhỏ ngoài cửa cho Cô Út. Cô ngồi đó như ngồi ghế danh dự.", fx: { rep: 1 } },
          { id: "lights", label: "Treo thêm đèn dây cho giống vỉa hè", hint: "Không tốn gì · +1 XP",
            say: "Treo thêm đèn dây, mở nhạc nhỏ. Quán có mái mà vẫn có hồn vỉa hè.", fx: { xp: 2 } },
        ],
      },
    },
  },

  // ===== N01 · Hàng tới đầu hẻm (quán nổi tiếng) =====
  {
    id: "N01", group: "co-che", tone: "mixed", when: "day", cooldown: 6,
    if: { minLevel: 16 }, npc: "co-lan",
    moment: "Khách xếp hàng tới đầu hẻm. Cô Lan than kẹt xe, rồi cũng xếp hàng.",
    nodes: {
      start: {
        mood: "annoyed",
        line: "Con ơi, tối qua khách xếp hàng tới tận đầu hẻm, xe cô không ra được. Vui thì vui, mà kẹt quá.",
        me: "Ngày xưa lo không có khách, giờ lo khách đứng chắn cửa tiệm may.",
        choices: [
          { id: "rope", label: "Kẻ vạch xếp hàng, phát số", hint: "Không tốn gì · ca tới khách chờ thêm 5%, +1 danh tiếng",
            say: "Kẻ vạch, phát số, khách đứng thẳng hàng như xếp hàng mua vé.", fx: { mod: { id: "phat-so", days: 7, patience: 5 }, rep: 1 } },
          { id: "lan", label: "Tặng cô Lan suất ưu tiên không cần xếp hàng", hint: "Không tốn gì · cô Lan vui",
            say: "Cô Lan có suất ưu tiên trọn đời, không cần xếp hàng. Cô cười, hết than.", fx: { rep: 1, xp: 2 } },
        ],
      },
    },
  },

  // ===== N02 · Reviewer xin bàn riêng để quay =====
  {
    id: "N02", group: "co-che", tone: "mixed", when: "shift", cooldown: 5,
    if: { minLevel: 16, freeSeats: 2 }, npc: "be-su",
    moment: "Reviewer xin bàn riêng để quay. Bàn riêng có đèn riêng, dĩa riêng, khách xếp hàng nhìn.",
    nodes: {
      start: {
        mood: "happy",
        line: "Chị ơi, Bé Su xin một bàn riêng để quay nha, ánh sáng bàn góc đẹp lắm. Bé Su quay mười phút thôi.",
        me: "Mười phút của reviewer, bằng ba lượt khách của quán.",
        choices: [
          { id: "yes", label: "Cho bàn riêng", hint: "Không tốn gì · khách chờ bớt kiên nhẫn 6 giây, hên xui 60% clip lan (+120 người theo dõi)",
            say: "Bàn góc dành cho Bé Su, đèn bật sáng, dĩa đặc biệt bày đẹp nhất.", fx: { patience: -6000 },
            roll: { p: 0.6,
              win: { say: "Clip của Bé Su lan khắp nơi, câu chốt: 'quán đông mà vẫn chu đáo'.", fx: { followers: 120, hype: 1 } },
              lose: { say: "Clip đăng muộn, chìm giữa trăm clip khác. Nhưng Bé Su ăn ngon miệng.", fx: { followers: 20 } } } },
          { id: "share", label: "Mời ngồi chung bàn với khách quen", hint: "Không tốn gì · hên xui 50% khách quen thành nhân vật clip (+1 danh tiếng)",
            say: "Quán đông, mời Bé Su ngồi chung với Cô Út, cảnh đời thực luôn.",
            roll: { p: 0.5,
              win: { say: "Cô Út thành ngôi sao clip, kể chuyện xổ số trước ống kính. Cả mạng mê cô.", fx: { rep: 1, followers: 60 } },
              lose: { say: "Bé Su ngại, quay vội vài cảnh rồi ăn. Clip ngắn mà ấm.", fx: { followers: 15 } } } },
        ],
      },
    },
  },

  // ===== BO1 · Bông bưng bốn dĩa một lúc (phụ bàn) =====
  {
    id: "BO1", group: "co-che", tone: "mixed", when: "shift", cooldown: 4,
    if: { flags: ["helper-bong"], seatedMin: 2 }, npc: "bong",
    moment: "Bông bưng bốn dĩa một lúc. Khách vỗ tay, dĩa thì run run.",
    nodes: {
      start: {
        mood: "happy",
        line: "Chị coi em nè, bốn dĩa một lúc! Hai tay, một cánh tay, với… lòng tin!",
        me: "Bốn dĩa trên tay Bông, bốn trái tim trong lồng ngực cô chủ.",
        choices: [
          { id: "go", label: "Cho Bông bưng", hint: "Không tốn gì · hên xui 70% bưng đẹp (quán hot), 30% trượt chân mất một dĩa",
            say: "Đi đi Bông, nhẹ nhàng thôi.",
            roll: { p: 0.7,
              win: { say: "Bốn dĩa xuống bàn êm ru, khách vỗ tay. Bông cúi chào như diễn viên xiếc.", fx: { hype: 1, patience: 4000 } },
              lose: { say: "Bông trượt chân, một dĩa rơi. Ba dĩa còn lại vẫn đứng vững, Bông đứng vững, chỉ dĩa thứ tư nằm xuống.", fx: { plates: -1, patience: -3000 } } } },
          { id: "two", label: "Dặn Bông bưng hai dĩa thôi", hint: "Không tốn gì · chắc ăn, chậm hơn chút",
            say: "Hai dĩa thôi em, nhanh không bằng chắc.", fx: { xp: 2 } },
        ],
      },
    },
  },

  // ===== BO2 · Dĩa Gen Z =====
  {
    id: "BO2", group: "co-che", tone: "good", when: "day", cooldown: 8,
    if: { flags: ["helper-bong"] }, npc: "bong",
    moment: "Bông đề xuất 'dĩa Gen Z' có trứng hình trái tim. Mẹ hỏi 'Gen Z là gì'.",
    nodes: {
      start: {
        mood: "happy",
        line: "Chị ơi, em đề xuất 'dĩa Gen Z': trứng ốp la hình trái tim, dưa leo xếp hình ngôi sao, nước mắm đựng chén nhỏ xíu!",
        me: "Dĩa cơm tấm có trái tim và ngôi sao. Bà ngoại mà thấy chắc đứng tim thiệt.",
        choices: [
          { id: "try", label: "Bán thử ba ngày", hint: "−20k khuôn trứng · khách trẻ tới thêm 3 ngày",
            say: "Bán thử dĩa Gen Z. Sinh viên tới chụp hình trước, ăn sau.", fx: { money: -20, mod: { id: "dia-gen-z", days: 3, guests: { student: 1, student2: 1 } }, hype: 1 } },
          { id: "photo", label: "Chỉ làm để chụp hình quảng cáo", hint: "Không tốn gì · +40 người theo dõi",
            say: "Làm một dĩa chụp hình thôi. Hình lên mạng, người hỏi mua nhiều hơn người mua.", fx: { followers: 40 } },
          { id: "no", label: "Giữ dĩa truyền thống", hint: "Không tốn gì · +1 XP",
            say: "Cơm tấm truyền thống em ơi, trái tim để trong lòng người nấu.", fx: { xp: 1 } },
        ],
      },
    },
  },

  // ===== KG1 · Cô Ba hỏi gói ký gửi =====
  {
    id: "KG1", group: "co-che", tone: "good", when: "day", cooldown: 6,
    if: { minDay: 3, maxMoney: 60 }, npc: "co-ba",
    moment: "Cô Ba ghé hỏi gói ký gửi. Bán tới đâu trả tới đó, như hồi mẹ mới mở sạp.",
    nodes: {
      start: {
        mood: "neutral",
        line: "Cô nghe nói dạo này con kẹt tiền. Cô gửi con gói ký gửi đủ mười dĩa, bán tới đâu trả tới đó, không lấy lời.",
        me: "Cô Ba nói nhỏ như sợ cái két tiền nghe thấy.",
        choices: [
          { id: "take", label: "Nhận, cảm ơn cô", hint: "Không tốn gì hôm nay · nhận gói ký gửi ở bảng Chuẩn bị, vài ngày sau trả đủ",
            say: "Con nhận, cảm ơn cô. Con hứa bán hết, trả đủ.", fx: { flag: "kg-hua", flagDays: 6, xp: 2 }, later: { id: "KG2", days: 3 } },
          { id: "no", label: "Con tự xoay được", hint: "Không tốn gì · +1 danh tiếng",
            say: "Con cảm ơn cô, con tự xoay được. Có gì gấp con nói cô liền.", fx: { rep: 1 } },
        ],
      },
    },
  },

  // ===== KG2 · Ngày trả đủ ký gửi =====
  {
    id: "KG2", group: "co-che", tone: "good", when: "day",
    if: { chain: true }, npc: "co-ba",
    moment: "Trả đủ ký gửi Cô Ba. Cô không đếm tiền, chỉ đếm số lần con cười.",
    nodes: {
      start: {
        mood: "happy",
        line: "Con trả đủ rồi đó, cô biết mà. Lần sau kẹt thì cứ nói, đừng ngại.",
        me: "Khoản nợ nhẹ nhất đời, vì người cho nợ còn vui hơn người trả.",
        choices: [
          { id: "gift", label: "Biếu cô hộp sườn nướng", hint: "−1 sườn ướp · Cô Ba thân thiết, hàng tươi giữ giá",
            say: "Biếu cô hộp sườn cháy cạnh. Cô nhận, nói 'sườn của cô nướng ngon dữ vậy ta'.", fx: { stock: { "suon-uop": -1 }, rep: 1, flag: "co-ba-than", flagDays: 10 } },
          { id: "thanks", label: "Cảm ơn cô thật nhiều", hint: "Không tốn gì · +2 XP",
            say: "Cảm ơn cô đã tin con. Con nhớ hoài.", fx: { xp: 2 } },
        ],
      },
    },
  },

  // ===== KG3 · Mẹ hỏi khi lỗ =====
  {
    id: "KG3", group: "co-che", tone: "mixed", when: "day", cooldown: 6,
    if: { anyFlags: ["lo-hom-qua"], minDay: 4 }, npc: "me",
    moment: "Mẹ hỏi chuyện lỗ. Không la, chỉ hỏi 'ướp sườn mấy giờ'.",
    nodes: {
      start: {
        mood: "neutral",
        line: "Mẹ nghe nói hôm qua quán lỗ. Mẹ không la đâu. Mẹ chỉ hỏi: con ướp sườn mấy giờ?",
        me: "Câu hỏi của mẹ luôn đi thẳng tới gốc vấn đề, như mũi dao lọc sườn.",
        choices: [
          { id: "honest", label: "Kể thật hết", hint: "Không tốn gì · mẹ chỉ mẹo, ca tới khách thoải mái hơn",
            say: "Kể mẹ nghe hết: ướp trễ, than thiếu, khách bỏ về. Mẹ nghe xong chỉ ba mẹo, mẹo nào cũng trúng.", fx: { mod: { id: "meo-me", days: 2, patience: 6 }, xp: 3 }, later: { id: "D01", days: 2 } },
          { id: "fine", label: "Nói 'con ổn mà mẹ'", hint: "Không tốn gì · hên xui 50% mẹ tin, 50% mẹ gửi tiền lên",
            say: "Con ổn mà mẹ, lỗ một bữa thôi.",
            roll: { p: 0.5,
              win: { say: "Mẹ tin, dặn ngủ sớm. Con ngủ sớm thật, lần đầu trong tháng.", fx: { xp: 2 } },
              lose: { say: "Mẹ không tin, chuyển khoản năm chục ngàn, ghi chú 'tiền mua than, không được cãi'.", fx: { money: 50 } } } },
        ],
      },
    },
  },

  // ===== HH1 · Quán bên cạnh đòi trả (hết hàng, mượn) =====
  {
    id: "HH1", group: "co-che", tone: "mixed", when: "day", cooldown: 3,
    if: { anyFlags: ["muon-*"] }, npc: "co-ut",
    moment: "Quán bên cạnh đòi trả đồ mượn. Trả kèm một dĩa cơm, coi như tiền lời.",
    nodes: {
      start: {
        mood: "neutral",
        line: "Con ơi, chị bánh xèo bên cạnh nhờ cô nhắn: hôm qua con mượn đồ, hôm nay chỉ cần trả là được, không gấp đâu.",
        me: "Mượn hôm qua, trả hôm nay. Tình hàng xóm sống nhờ chữ 'trả'.",
        choices: [
          { id: "return", label: "Trả đủ, kèm hộp cơm cảm ơn", hint: "−1 sườn ướp · +2 danh tiếng",
            say: "Trả đủ, kèm một hộp sườn cháy cạnh. Chị bánh xèo trả lễ bằng hai cái bánh xèo.", fx: { stock: { "suon-uop": -1 }, rep: 2, unflag: "muon-*" } },
          { id: "cash", label: "Trả bằng tiền", hint: "−15k · gọn",
            say: "Gửi tiền trả cho gọn. Chị bánh xèo nhận, cười 'khách sáo quá'.", fx: { money: -15, unflag: "muon-*" } },
          { id: "tomorrow", label: "Hẹn mai trả", hint: "Không tốn gì · hên xui 60% chị vui vẻ, 40% chị hơi phiền",
            say: "Dạ cho con khất tới mai nha.",
            roll: { p: 0.6,
              win: { say: "Chị bánh xèo: 'Không sao, mai cũng được.' Hàng xóm tốt như bánh xèo giòn.", fx: { xp: 1, unflag: "muon-*" } },
              lose: { say: "Chị bánh xèo hơi phiền, nhắn ba lần. Hôm sau quán trả kèm lời xin lỗi.", fx: { rep: -1, unflag: "muon-*" } } } },
        ],
      },
    },
  },

  // ===== HH2 · Reviewer đăng "hết sườn lúc 7 giờ tối" (lỗi lên mạng) =====
  {
    id: "HH2", group: "viral", tone: "bad", when: "shift", priority: 3, cooldown: 3,
    if: { stockMax: { "suon-uop": 0 }, phase: ["som", "cao"] }, npc: "ti-map",
    moment: "Lên mạng vì 'quán cơm tấm hết sườn lúc 7 giờ tối'. Mai ướp gấp đôi.",
    nodes: {
      start: {
        mood: "annoyed",
        line: "Mình vừa đăng: 'Quán cơm tấm hết sườn lúc bảy giờ tối'. Chị có muốn nói gì với người xem không?",
        me: "Khay sườn ướp trống trơn, máy quay thì đầy pin.",
        choices: [
          { id: "sorry", label: "Xin lỗi, hứa mai ướp gấp đôi", hint: "Không tốn gì · +1 danh tiếng, ca tới thêm 2 khách tò mò",
            say: "Quán xin lỗi, mai ướp gấp đôi, ai tới sớm có sườn cháy cạnh.", fx: { rep: 1, nextGuests: 2 } },
          { id: "bicha", label: "Mời ăn dĩa bì chả 'bản đặc biệt'", hint: "Không tốn gì · hên xui 50% Tí Mập khen (+50 người theo dõi), 50% vẫn chê hết sườn",
            say: "Hết sườn nhưng còn bì chả, mình ăn thử bản đặc biệt nha.",
            roll: { p: 0.5,
              win: { say: "Tí Mập ăn xong sửa bài: 'Hết sườn mà bì chả cứu cả bữa.'", fx: { followers: 50 } },
              lose: { say: "Tí Mập ăn, gật gù, nhưng bài đăng vẫn để nguyên câu 'hết sườn'.", fx: { rep: -1 } } } },
        ],
      },
    },
  },

  // ===== CT1 · Mâm cơm trễ (cờ catering-late) =====
  {
    id: "CT1", group: "co-che", tone: "bad", when: "shift", priority: 2, cooldown: 2,
    if: { flags: ["catering-late"] }, npc: "chi-thu",
    moment: "Mâm cơm trễ giờ. Chị Thư gọi ba lần, lần nào cũng lịch sự hơn lần trước.",
    nodes: {
      start: {
        mood: "annoyed",
        line: "Chị ơi, xe xưởng đứng chờ mười phút rồi. Em không hối đâu… em chỉ nhắc lần thứ ba thôi.",
        me: "Lần nhắc thứ ba lịch sự nhất là lần đáng sợ nhất.",
        choices: [
          { id: "send", label: "Giao trước phần đã xong", hint: "Không tốn gì · bớt căng, phần còn lại giao sau",
            say: "Giao trước phần đã xong, kèm lời xin lỗi và hứa mười phút nữa đủ.", fx: { xp: 2 }, goto: "rest" },
          { id: "gift", label: "Tặng thêm trà tắc cho cả đoàn", hint: "−20k · Chị Thư dịu lại",
            say: "Xin lỗi bằng hai chục ly trà tắc. Xe xưởng chờ thêm mà không ai cằn nhằn.", fx: { money: -20, rep: 1, unflag: "catering-late" } },
        ],
      },
      rest: {
        mood: "neutral",
        line: "Phần còn lại còn thiếu tám hộp. Chị Thư nhắn: 'Sếp hỏi bao giờ xong ạ.'",
        choices: [
          { id: "fast", label: "Dồn sức làm nốt", hint: "Không tốn gì · khách lẻ chờ thêm 20 giây",
            say: "Dồn hết sức làm nốt tám hộp. Quạt mo chạy như cánh quạt máy bay.", fx: { pauseGuests: 20000, unflag: "catering-late" } },
          { id: "discount", label: "Xin giảm 10% vì trễ", hint: "Không tốn gì · +1 danh tiếng, đơn bớt lãi",
            say: "Quán xin giảm mười phần trăm vì giao trễ. Chị Thư cảm ơn vì quán thẳng thắn.", fx: { rep: 1, unflag: "catering-late" } },
        ],
      },
    },
  },

  // ===== CT2 · Xác nhận lần ba (cờ catering-active) =====
  {
    id: "CT2", group: "co-che", tone: "good", when: "day", cooldown: 4,
    if: { flags: ["catering-active"] }, npc: "chi-thu",
    moment: "Chị Thư gọi xác nhận đơn lần thứ ba. Quán trả lời bằng giọng thuộc lòng.",
    nodes: {
      start: {
        mood: "neutral",
        line: "Chị ơi em xác nhận lần ba nha: mười phần chay, sáu không mỡ hành, giao mười một rưỡi. Đúng không chị?",
        me: "Lần thứ ba nghe y như lần thứ nhất. Đơn này chắc in sâu vô trí nhớ dài hạn.",
        choices: [
          { id: "repeat", label: "Đọc lại đơn không sót chữ", hint: "Không tốn gì · +1 danh tiếng với xưởng",
            say: "Mười chay, sáu không mỡ hành, mười một rưỡi. Chị Thư im lặng một giây vì ấn tượng.", fx: { rep: 1 } },
          { id: "list", label: "Gửi ảnh tờ ghi chú dán trên tường", hint: "Không tốn gì · +2 XP",
            say: "Chụp tờ ghi chú dán ngay bếp gửi qua. Chị Thư thả một chữ 'ok' thật dài.", fx: { xp: 2 } },
        ],
      },
    },
  },

  // ===== SU1 · Chú Hòa giao lúc bốn giờ sáng (nhà cung cấp thứ hai) =====
  {
    id: "SU1", group: "co-che", tone: "mixed", when: "day", cooldown: 6,
    if: { anyFlags: ["chu-hoa", "chu-hoa-than"] }, npc: "chu-hoa",
    moment: "Chú Hòa giao hàng lúc bốn giờ sáng. Quán học cách ngủ với một tai mở.",
    nodes: {
      start: {
        mood: "neutral",
        line: "Cốc cốc. Bốn giờ sáng. 'Hàng tới rồi con. Chú để trước cửa hay con ra nhận?'",
        me: "Bốn giờ sáng, mắt nhắm mắt mở, tay vẫn kịp đếm bao gạo.",
        choices: [
          { id: "get", label: "Dậy ra nhận, đếm hàng", hint: "Không tốn gì · đủ hàng, Chú Hòa tặng thêm 2 rổ than",
            say: "Dậy ra nhận, đếm đủ từng bao. Chú Hòa gật gù, tặng thêm hai rổ than 'cho người dậy sớm'.", fx: { stock: { than: 2 }, xp: 2 } },
          { id: "door", label: "Nhờ chú để trước cửa", hint: "Không tốn gì · hên xui 80% đủ hàng, 20% mất một bao than vì mèo hàng xóm",
            say: "Chú để trước cửa giùm con nha, con ra liền.",
            roll: { p: 0.8,
              win: { say: "Sáng ra hàng đủ, xếp gọn, có cả tờ giấy 'chúc bán đắt' của chú Hòa.", fx: { xp: 1 } },
              lose: { say: "Sáng ra thiếu một bao than nhỏ, có dấu chân mèo. Mèo không ăn than, nhưng mèo có bạn.", fx: { xp: 1 } } } },
        ],
      },
    },
  },
];
