// Sự kiện Nhà cung cấp U01–U04 và Đối thủ T01–T03 (docs/quan-com-tam/DRAMA.md §2.3). Cấu trúc: xem chú thích đầu data/events.js.
// Cô Ba (sạp thịt), Chú Hòa (vựa gạo + than, cấp 9), Bếp trưởng Vũ ("Cơm Tấm Vũ Kim") đều hư cấu. Đối thủ chứ không phải người xấu.

export const EVENTS_CUNGCAP = [
  // ===== U01 · Heo lên giá =====
  {
    id: "U01", group: "cung-cap", tone: "mixed", when: "day", cooldown: 6,
    if: { minDay: 6 }, npc: "co-ba",
    moment: "Mặc cả giá sườn với Cô Ba. Thắng 500 đồng, thua một bài giảng về giá cám.",
    nodes: {
      start: {
        mood: "neutral",
        line: "Heo lên giá rồi con. Sườn cô phải tăng một ngàn một miếng, con thông cảm.",
        me: "Một ngàn một miếng… nhân ba chục miếng một ngày là nguyên cái quạt mo mới.",
        choices: [
          { id: "ok", label: "Đồng ý", hint: "Không tốn gì hôm nay · +1 thân thiết Cô Ba, hai ngày tới hàng tươi giao đúng hẹn",
            say: "Dạ con hiểu, cô cũng phải sống. Sườn cô ngon thì con không đổi.", fx: { rep: 1, flag: "co-ba-than", flagDays: 7 } },
          { id: "bargain", label: "Mặc cả", hint: "Chuyện còn tiếp…",
            say: "Cô ơi, con lấy đều mỗi ngày mà, cô bớt cho con chút xíu.", goto: "deal" },
          { id: "shop", label: "Nói sẽ tìm chỗ khác", hint: "Không tốn gì · vài ngày sau Cô Ba hỏi chuyện",
            say: "Con coi thử chỗ khác rồi tính nha cô.", fx: { flag: "co-ba-doi" }, later: { id: "U04", days: 5 } },
        ],
      },
      deal: {
        mood: "annoyed",
        line: "Vậy con lấy hai chục miếng một lần, cô giữ giá cũ. Chứ giá cám bây giờ…",
        choices: [
          { id: "twenty", label: "Lấy 20 miếng ngay", hint: "−200k · +20 sườn sống, giữ giá cũ 7 ngày",
            say: "Hai chục miếng một lần. Tủ lạnh đầy, lòng nhẹ.", fx: { money: -200, stock: { suon: 20 }, flag: "gia-cu", flagDays: 7 }, later: { id: "U04", days: 5 } },
          { id: "half", label: "Tăng nửa thôi cô", hint: "Không tốn gì · hên xui 60% cô chịu, 40% cô giảng thêm về giá cám",
            say: "Mình chia đôi, cô tăng năm trăm thôi nha.",
            roll: { p: 0.6,
              win: { say: "Cô Ba thở dài: 'Thôi được, năm trăm. Con mặc cả giống mẹ con y chang.'", fx: { xp: 3 }, later: { id: "U04", days: 5 } },
              lose: { say: "Cô Ba giảng mười phút về giá cám, giá điện, giá con heo. Cuối cùng vẫn tăng một ngàn.", fx: { xp: 1 }, later: { id: "U04", days: 5 } } } },
        ],
      },
    },
  },

  // ===== U02 · Lô sườn mỏng =====
  {
    id: "U02", group: "cung-cap", tone: "mixed", when: "shift", cooldown: 5,
    if: { minDay: 5, fMax: 0.5 }, npc: "owner",
    moment: "Một lô sườn mỏng. Quán chọn không bán sự thất vọng.",
    nodes: {
      start: {
        mood: "annoyed",
        line: "Mở bao sườn mới nhập của Cô Ba: miếng mỏng dính, nhiều mỡ. 'Lô này… mỏng như lời hứa.'",
        me: "Sườn mà soi được đèn là có vấn đề rồi.",
        choices: [
          { id: "swap", label: "Gọi Cô Ba đổi", hint: "Không tốn gì · chút nữa có lô mới, khách chờ bớt kiên nhẫn 4 giây",
            say: "Gọi Cô Ba. Cô xin lỗi rối rít, Anh Sáu chở lô mới tới, miếng nào cũng dày.", fx: { patience: -4000, flag: "co-ba-doi" }, later: { id: "U04", days: 2 } },
          { id: "use", label: "Dùng tiếp, nướng kỹ", hint: "Không tốn gì · hên xui 60% không ai để ý, 40% bớt danh tiếng",
            say: "Nướng kỹ, quét thêm mỡ hành. Hy vọng lớp mỡ hành che được lớp thất vọng.",
            roll: { p: 0.6,
              win: { say: "Không ai để ý. Mỡ hành đúng là anh hùng thầm lặng.", fx: { xp: 2 } },
              lose: { say: "Hai bàn nhận xét 'sườn hôm nay mỏng ghê'. Quán xin lỗi, hứa mai dày lại.", fx: { rep: -1 } } } },
          { id: "double", label: "Ghép 2 miếng làm dĩa đặc biệt", hint: "−4 sườn ướp · dĩa nào cũng đầy đặn",
            say: "Hai miếng mỏng ghép lại thành một dĩa đặc biệt. Khách tưởng được tặng thêm.", fx: { stock: { "suon-uop": -4 }, rep: 1 } },
        ],
      },
    },
  },

  // ===== U03 · Chú Hòa vựa gạo + than =====
  {
    id: "U03", group: "cung-cap", tone: "good", when: "day", once: true,
    if: { minLevel: 9 }, npc: "chu-hoa",
    moment: "Có nhà cung cấp thứ hai. Gặp nhau lần đầu lúc 4 giờ sáng.",
    nodes: {
      start: {
        mood: "neutral",
        line: "Gạo tấm, than, hộp, dĩa, chú giao sỉ hết. Rẻ hơn mười phần trăm, mà giao lúc bốn giờ sáng nghen.",
        me: "Bốn giờ sáng… giờ đó con còn đang mơ thấy vỉ sườn.",
        choices: [
          { id: "try", label: "Lấy thử gạo + than", hint: "Không tốn gì hôm nay · mở Chú Hòa, mai có hàng",
            say: "Lấy thử. Bốn giờ sáng, tiếng ba gác dừng trước cửa nhẹ như mèo.", fx: { flag: ["chu-hoa", "hoa-mua"], flagDays: 30, stock: { "gao-tam": 10, than: 3 } }, later: { id: "U04", days: 2 } },
          { id: "coal", label: "Chỉ lấy than", hint: "Không tốn gì hôm nay · than rẻ 10%",
            say: "Than thì lấy của chú, gạo con vẫn mua chợ cho quen tay.", fx: { flag: ["chu-hoa-than", "hoa-mua"], flagDays: 30, stock: { than: 3 } }, later: { id: "U04", days: 2 } },
          { id: "no", label: "Cảm ơn, mua chợ thôi", hint: "Không tốn gì · +1 thân thiết Cô Ba",
            say: "Con quen mua chợ rồi chú, có gì gấp con gọi.", fx: { flag: "co-ba-than", flagDays: 7, rep: 1 } },
        ],
      },
    },
  },

  // ===== U04 · Cô Ba hỏi chuyện =====
  {
    id: "U04", group: "cung-cap", tone: "mixed", when: "day", cooldown: 6,
    if: { anyFlags: ["co-ba-doi", "hoa-mua"], noFlags: ["co-ba-than"] }, npc: "co-ba",
    moment: "Bị nhà cung cấp hỏi 'con mua của ai'. Trả lời bằng một dĩa cơm sườn.",
    nodes: {
      start: {
        mood: "annoyed",
        line: "Cô nghe nói con lấy gạo ông Hòa. Sườn thì sao, cũng lấy chỗ khác hả?",
        alt: [{ flags: ["co-ba-doi"], line: "Cô nghe Anh Sáu nói con đang đi coi sườn chỗ khác. Thiệt hông con?", mood: "annoyed" }],
        me: "Câu hỏi này còn khó hơn tính tiền bàn bốn người.",
        choices: [
          { id: "truth", label: "Nói thật: gạo chỗ khác, thịt vẫn của cô", hint: "Chuyện còn tiếp…",
            say: "Dạ gạo con lấy chỗ khác cho rẻ, còn sườn thì chỉ có của cô mới đúng vị.", goto: "after" },
          { id: "deny", label: "Chối", hint: "Không tốn gì · hên xui 40% cô tin, 60% cô biết và giận vài ngày",
            say: "Đâu có cô, ai nói vậy?",
            roll: { p: 0.4,
              win: { say: "Cô Ba nhìn một hồi, rồi gật: 'Ờ, cô tin con.' Lòng cô chủ hơi nặng.", fx: { unflag: ["co-ba-doi"] } },
              lose: { say: "'Anh Sáu kể hết rồi con.' Cô Ba dỗi, mấy ngày tới giao hàng chậm hơn.", fx: { rep: -1, unflag: ["co-ba-doi"], mod: { id: "co-ba-doi", days: 4, patience: -5 } } } } },
        ],
      },
      after: {
        mood: "neutral",
        line: "Vậy con hứa sườn chỉ lấy của cô nghen?",
        choices: [
          { id: "promise", label: "Hứa chỉ lấy thịt của cô", hint: "Không tốn gì · +1 danh tiếng, Cô Ba thân thiết lâu dài",
            say: "Con hứa. Sườn quán là sườn Cô Ba, in lên menu luôn cũng được.", fx: { rep: 1, flag: "co-ba-than", flagDays: 30, unflag: ["co-ba-doi"] } },
          { id: "treat", label: "Mời cô ăn dĩa cơm", hint: "−1 sườn ướp · cô chỉ bí quyết ướp sả, khách 5 ngày tới hài lòng hơn",
            say: "Cô ăn dĩa cơm con nướng đi. Ăn xong cô chỉ con thêm một mẹo ướp sả.", fx: { stock: { "suon-uop": -1 }, rep: 2, mod: { id: "uop-sa", days: 5, patience: 5 }, unflag: ["co-ba-doi"] } },
        ],
      },
    },
  },

  // ===== T01 · Quán mới bên kia đường =====
  {
    id: "T01", group: "doi-thu", tone: "mixed", when: "day", once: true,
    if: { minDay: 8 }, npc: "anh-sau",
    moment: "Đối thủ có dĩa vuông. Quán có dĩa tròn và mùi than.",
    nodes: {
      start: {
        mood: "surprised",
        line: "Em ơi, bên kia đường mới mở 'Cơm Tấm Vũ Kim', dĩa vuông, tám chín ngàn một dĩa, có nhạc piano!",
        me: "Tám chín ngàn… dĩa vuông chắc đựng được nhiều hạt cơm hơn ở góc.",
        choices: [
          { id: "cut", label: "Giảm 3k mọi món 3 ngày", hint: "Không tốn tiền hôm nay · giữ khách, lãi mỏng hơn 3 ngày",
            say: "Giảm ba ngàn ba ngày. Khách quen nói 'giảm làm gì, tụi tui vẫn ăn mà'.", fx: { mod: { id: "giam-gia", days: 3, guests: 1 }, money: -15, flag: "t01" }, later: { id: "T02", days: 1 } },
          { id: "soup", label: "Tặng chén canh + trà tắc mọi bàn", hint: "−20k · hên xui 60% khách ở lại, 40% không ai để ý",
            say: "Mỗi bàn một chén canh, một ly trà tắc. Quán vỉa hè đáp lễ bằng sự ấm áp.", fx: { money: -20, flag: "t01" },
            roll: { p: 0.6,
              win: { say: "Khách ở lại, còn rủ thêm bạn: 'Bên kia có piano, bên này có canh.'", fx: { nextGuests: 2 }, later: { id: "T02", days: 1 } },
              lose: { say: "Không ai để ý chén canh, ai cũng đang bàn về cái dĩa vuông.", fx: { xp: 1 }, later: { id: "T02", days: 1 } } } },
          { id: "focus", label: "Giữ giá, tập trung sườn cháy cạnh", hint: "Không tốn gì · 3 ngày bớt 1 khách, sau đó giữ chân khách quen",
            say: "Giữ giá, giữ lửa. Sườn cháy cạnh thì dĩa vuông hay dĩa tròn cũng phải chịu.", fx: { mod: { id: "vu-kim-mo", days: 3, guests: -1 }, flag: "t01" }, later: { id: "T03", days: 5 } },
          { id: "visit", label: "Qua chào hỏi", hint: "Không tốn gì · làm quen sớm với bếp trưởng bên kia",
            say: "Mang một hộp sườn qua chào hàng xóm mới. Lễ nghĩa trước, cạnh tranh sau.", fx: { rep: 1, flag: "t01" }, later: { id: "T03", days: 2 } },
        ],
      },
    },
  },

  // ===== T02 · Người của quán bên kia =====
  {
    id: "T02", group: "doi-thu", tone: "good", when: "shift",
    if: { chain: true }, npc: "bong",
    moment: "Bị đối thủ chụp lén vỉ sườn. Tặng luôn một miếng để họ chụp cho rõ.",
    nodes: {
      start: {
        mood: "surprised",
        line: "Chị ơi, cái người đội nón kín đang chụp lén vỉ sườn kìa. Người của quán bên kia đó chị!",
        me: "Chụp lén vỉ sườn… vỉ sườn nhà mình nổi tiếng tới mức có paparazzi.",
        choices: [
          { id: "gift", label: "Mời ngồi, tặng một miếng cháy cạnh", hint: "−1 sườn ướp · hên xui 60% người đó gọi luôn 2 dĩa và khen thật",
            say: "Mời ngồi, tặng một miếng cháy cạnh. Chụp thì chụp cho rõ, ăn thì ăn cho biết.", fx: { stock: { "suon-uop": -1 } },
            roll: { p: 0.6,
              win: { say: "Người đó ăn xong gọi thêm hai dĩa, nói nhỏ 'ngon hơn bên tui'. Rồi đỏ mặt bỏ đi.", fx: { money: 50, rep: 1 }, later: { id: "T03", days: 2 } },
              lose: { say: "Người đó ăn xong, gật đầu, đi luôn không nói gì. Miếng sườn chắc đã nói thay.", fx: { xp: 2 }, later: { id: "T03", days: 3 } } } },
          { id: "cover", label: "Che vỉ lại", hint: "Không tốn gì · không có gì thêm",
            say: "Che vỉ lại bằng cái nắp nồi. Bí quyết ở trong tay, không phải trên vỉ.", fx: { xp: 1 } },
          { id: "ask", label: "Hỏi thẳng 'em học nướng hả?'", hint: "Không tốn gì · hên xui 50% người đó cười thú nhận là phụ bếp bên kia",
            say: "Em học nướng hả? Muốn học thì đứng đây chị chỉ.",
            roll: { p: 0.5,
              win: { say: "Người đó gỡ nón, cười: 'Dạ em phụ bếp bên Vũ Kim. Anh Vũ sai em qua coi.' Hai bên cười xoà.", fx: { rep: 1 }, later: { id: "T03", days: 1 } },
              lose: { say: "Người đó lắc đầu nguầy nguậy rồi đi mất. Chụp được tấm cuối là tấm cô chủ vẫy tay chào.", fx: { xp: 1 } } } },
        ],
      },
    },
  },

  // ===== T03 · Bếp trưởng Vũ nửa đêm =====
  {
    id: "T03", group: "doi-thu", tone: "good", when: "day", once: true,
    if: { chain: true }, npc: "bep-vu",
    moment: "Dạy bếp trưởng nước ngoài về canh than. Anh ấy ghi chép bằng máy tính bảng, quạt bằng quạt mo.",
    nodes: {
      start: {
        mood: "neutral",
        line: "Tôi bán dĩa tám chín ngàn mà khách vẫn qua bên chị. Chị nướng sao vậy? Tôi hỏi thật, không phải đi do thám.",
        me: "Bếp trưởng đi học nước ngoài về, nửa đêm ngồi ghế nhựa hỏi bí quyết. Cảnh này nên đóng khung.",
        choices: [
          { id: "teach", label: "Chỉ cách canh than", hint: "Chuyện còn tiếp…",
            say: "Than phải đỏ mà không bùng, tay phải nhanh mà không vội. Ngồi đây coi nè anh.", goto: "how" },
          { id: "contest", label: "Rủ thi nướng ở hội chợ", hint: "Không tốn gì · hội chợ có thêm đối thủ Vũ (thắng thêm người theo dõi)",
            say: "Muốn biết ai nướng ngon, mình gặp nhau ở hội chợ bờ sông.", fx: { flag: "vu-hoi-cho", flagDays: 60, hype: 1 } },
          { id: "feed", label: "Mời ăn, không nói gì", hint: "−2 sườn ướp · +1 danh tiếng, Vũ ăn hai dĩa",
            say: "Mời anh ăn. Ăn xong tự hiểu, nói ra thì mất vị.", fx: { stock: { "suon-uop": -2 }, rep: 1 } },
        ],
      },
      how: {
        mood: "happy",
        line: "Vũ ghi chép lia lịa, rồi hỏi: 'Còn cái mẹo cháy cạnh mà không khét thì sao chị?'",
        choices: [
          { id: "all", label: "Chỉ hết", hint: "Không tốn gì · +3 danh tiếng, Vũ đổi menu, không còn tranh khách ca tối",
            say: "Chỉ hết. Vũ đổi sang 'cơm tấm sườn hun khói' giá năm chín ngàn, không còn tranh khách ca tối.", fx: { rep: 3, unflag: ["t01"], mod: { id: "vu-ban-be", days: 14, guests: 1 } } },
          { id: "half", label: "Chỉ một nửa", hint: "Không tốn gì · Vũ bỏ ca trưa, chỉ cạnh tranh ca tối",
            say: "Chỉ một nửa. Nửa kia là bí mật nghề, mẹ dặn không được nói.", fx: { xp: 4, flag: "vu-toi", flagDays: 14 } },
        ],
      },
    },
  },
];
