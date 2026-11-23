// Sự kiện sinh ra từ câu trả lời review (agent C đặt cờ trong s.flags): reply-viral, reply-phot, reply-sale, persona-flip (số lần đổi tính
// cách hôm nay), review-1star-<lý do>. Cùng cấu trúc data/events.js. sayBy / meBy theo tính cách chủ quán (hien | cucsuc | lay | sale),
// không có thì dùng say / me. Cục súc thẳng nhưng không bao giờ chê người. Hài tử tế, không emoji, không thương hiệu hay người thật.
// R01 ảnh chụp câu trả lời lan khắp nhóm chat hẻm · R02 Mai Ăn Đêm quay đáp lại · R03 phốt trên nhóm review · R04 Mẹ đọc câu trả lời
// · R05 khách đọc mã giảm giá dắt bạn tới · R06 Bếp Vũ chép câu chốt đơn · R07 cả hẻm nghi quán bị hack nick · R08 Bông hỏi "hôm nay chị
// là phiên bản nào" · R09 khách 1 sao quay lại cho quán cơ hội · R10 Cô Ba đọc review 1 sao, hỏi han.

export const EVENTS_REPLY = [
  {
    id: "R01", group: "reply", tone: "good", when: "day", priority: 2, cooldown: 4,
    if: { flags: ["reply-viral"] }, npc: "co-lan",
    moment: "Câu trả lời review của quán chạy khắp các nhóm chat trong hẻm, ghim trên cả thông báo đóng tiền rác.",
    nodes: {
      start: {
        mood: "happy",
        line: "Con ơi, ảnh chụp câu con trả lời review đang chạy khắp các nhóm chat trong hẻm. Nhóm tổ dân phố còn ghim lên đầu, trên cả thông báo đóng tiền rác.",
        me: "Ủa… câu nào vậy cô? Con trả lời nhiều quá không nhớ.",
        meBy: { hien: "Dạ… con chỉ trả lời thật lòng thôi mà cô, ngại quá.", cucsuc: "Câu nào cũng thật. Cô nói câu nào?", lay: "Con biết mà cô. Con tập ký tặng từ năm ngoái rồi.", sale: "Vậy là cả hẻm cần một dĩa kỷ niệm rồi cô." },
        choices: [
          { id: "board", label: "Chép câu trả lời lên bảng phấn", hint: "Không tốn gì · +1 danh tiếng, ca tới +2 khách",
            say: "Quán chép câu đó lên bảng phấn. Khách ghé chụp hình, rồi tiện gọi luôn một dĩa.",
            sayBy: { hien: "Quán chép câu đó lên bảng phấn, kèm dòng nhỏ 'cảm ơn cả hẻm đã thương quán'.", cucsuc: "Viết lên bảng, chữ to, không trang trí. Ai đọc thì đọc, đọc xong ăn cơm.", lay: "Viết lên bảng, kèm mũi tên chỉ vào cô chủ: 'người nói câu này đang lật sườn'.", sale: "Viết lên bảng, dưới có dòng: 'đọc to câu này được thêm đồ chua'." },
            fx: { rep: 1, nextGuests: 2, unflag: "reply-viral" } },
          { id: "who", label: "Hỏi Cô Lan ai chụp đầu tiên", hint: "Chuyện còn tiếp…",
            say: "Ai chụp đầu tiên vậy cô? Cô biết mà, cô biết hết.", goto: "who" },
          { id: "humble", label: "Giả vờ không biết, đi ướp sườn", hint: "Không tốn gì · +3 XP",
            say: "Quán nói 'vậy hả cô', rồi quay vô ướp sườn. Nổi thì nổi, mai vẫn phải nướng.", fx: { xp: 3, unflag: "reply-viral" } },
        ],
      },
      who: {
        mood: "happy",
        line: "Cô Út chụp chứ ai! Cô Út không biết gửi hình, đưa điện thoại cho cháu gửi, cháu gửi lộn vô nhóm lớp, rồi lan từ đó.",
        choices: [
          { id: "gift", label: "Hẹn mời Cô Út dĩa như cũ", hint: "Không tốn gì · +1 danh tiếng",
            say: "Mai cô Út ghé, dĩa như cũ quán mời. Người quảng cáo đầu tiên mà không biết mình quảng cáo.", fx: { rep: 1, unflag: "reply-viral" } },
          { id: "sticker", label: "Nhờ cháu Cô Út làm sticker", hint: "Không tốn gì · +15 người theo dõi, quán hot lên",
            say: "Cháu Cô Út làm bộ sticker từ câu trả lời. Nhóm chat nào trong hẻm cũng có một tấm.", fx: { followers: 15, hype: 1, unflag: "reply-viral" } },
        ],
      },
    },
  },
  {
    id: "R02", group: "reply", tone: "good", when: "shift", priority: 2, cooldown: 4,
    if: { flags: ["reply-viral"], minRep: 40 }, npc: "mai-an-dem",
    moment: "Mai Ăn Đêm quay video đáp lại câu trả lời review của quán. Ba mươi giây, một triệu lượt xem trong tưởng tượng.",
    nodes: {
      start: {
        mood: "happy",
        line: "Chị ơi, Mai quay video đáp lại câu trả lời của chị nè. Cho Mai quay chung một cảnh ngay vỉ sườn được không, ba mươi giây thôi.",
        choices: [
          { id: "duet", label: "Diễn chung một cảnh", hint: "Không tốn gì · khách chờ bớt kiên nhẫn 4 giây, +25 người theo dõi, quán hot lên",
            say: "Cô chủ cầm kẹp gắp làm micro, diễn đúng ba mươi giây. Clip lên trước khi miếng sườn kịp lật.",
            sayBy: { hien: "Cô chủ ngại ngùng đứng vào khung hình, cúi chào ba lần. Cư dân mạng khen 'chủ quán hiền như cơm trắng'.", cucsuc: "Cô chủ khoanh tay, nói đúng một câu: 'Ăn đi rồi nói.' Clip nổ.", lay: "Cô chủ diễn hết mình, nhạc nền bằng miệng, cú xoay người cầm vỉ sườn. Clip nổ.", sale: "Diễn xong, cô chủ chìa luôn tấm bảng giá vào ống kính. Clip nổ, bảng giá cũng nổ." },
            fx: { patience: -4000, followers: 25, hype: 1, unflag: "reply-viral" } },
          { id: "plate", label: "Bày một dĩa đặc biệt làm đạo cụ", hint: "−1 sườn ướp · +12 người theo dõi",
            say: "Bày dĩa đặc biệt đẹp nhất làm đạo cụ. Quay xong, Mai ăn luôn đạo cụ.", fx: { stock: { "suon-uop": -1 }, followers: 12, unflag: "reply-viral" } },
          { id: "later", label: "Hẹn quay sau ca", hint: "Không tốn gì · +1 XP",
            say: "Hết khách rồi mình quay nha Mai, giờ sườn đang cần chị.", fx: { xp: 1 } },
        ],
      },
    },
  },
  {
    id: "R03", group: "reply", tone: "bad", when: "day", priority: 3, cooldown: 4,
    if: { flags: ["reply-phot"] }, npc: "cu-dan-mang",
    moment: "Câu trả lời review thành phốt trên nhóm ăn uống. Quán học được rằng thẳng thắn cũng cần đúng lúc.",
    nodes: {
      start: {
        mood: "annoyed",
        line: "Bài đăng trong nhóm review: 'Chủ quán cơm tấm trả lời khách vậy đó mọi người.' Kèm ảnh chụp câu trả lời, ba trăm bình luận và đang tăng.",
        me: "Đọc lại câu mình viết hôm qua, lúc đó thấy hợp lý, hôm nay thấy hơi… thẳng quá.",
        meBy: { cucsuc: "Câu đó thẳng thật. Thẳng nhưng không sai, chỉ là thẳng quá đà.", lay: "Câu đùa hôm qua, hôm nay không ai cười. Hài cũng cần đúng giờ." },
        choices: [
          { id: "sorry", label: "Đăng lời xin lỗi khách", hint: "Không tốn gì · +1 danh tiếng, phốt nguội dần",
            say: "Quán đăng lời xin lỗi khách, ngắn gọn, thật lòng. Bình luận chuyển từ giận sang 'thôi bỏ qua'.", fx: { rep: 1, unflag: "reply-phot" } },
          { id: "invite", label: "Mời khách quay lại, quán mời", hint: "Không tốn gì · hên xui 60% khách quay lại và sửa bài, 40% không trả lời",
            say: "Mời anh chị quay lại một bữa, quán mời và xin lỗi trực tiếp.",
            roll: { p: 0.6,
              win: { say: "Khách quay lại, ăn xong sửa bài: 'Quán xin lỗi đàng hoàng, dĩa cơm ngon.' Phốt thành chuyện vui.", fx: { rep: 2, followers: 20, unflag: "reply-phot" } },
              lose: { say: "Khách không trả lời. Quán vẫn để dành một dĩa, hy vọng một ngày khách ghé.", fx: { xp: 2, unflag: "reply-phot" } } } },
          { id: "silent", label: "Im lặng, nấu cơm tiếp", hint: "Không tốn gì · −1 danh tiếng, phốt tự nguội sau vài ngày",
            say: "Không trả lời thêm, tập trung nấu cơm. Phốt nguội dần, chỉ còn vết nhỏ.", fx: { rep: -1, unflag: "reply-phot" } },
        ],
      },
    },
  },
  {
    id: "R04", group: "reply", tone: "mixed", when: "day", priority: 2, cooldown: 6,
    if: { anyFlags: ["reply-phot", "reply-viral"], minDay: 3 }, npc: "me",
    moment: "Mẹ đọc câu trả lời review của con. Mẹ nói 'mẹ nuôi con lớn để con trả lời khách vậy hả', rồi cười.",
    nodes: {
      start: {
        mood: "surprised",
        line: "Mẹ mới đọc câu con trả lời khách trên mạng. Bà Tám ở chợ đưa mẹ coi. Con viết vậy hả con?",
        me: "Mẹ đọc rồi. Cả chợ huyện chắc cũng đọc rồi.",
        meBy: { hien: "Dạ con viết lễ phép mà mẹ…", cucsuc: "Dạ con viết thật. Thật quá hả mẹ?", lay: "Dạ đó là phong cách mẹ ơi, giới trẻ thích lắm.", sale: "Dạ con viết để kéo khách mà mẹ." },
        choices: [
          { id: "explain", label: "Giải thích cho mẹ nghe", hint: "Không tốn gì · hên xui 60% mẹ hiểu và khen, 40% mẹ dặn 'bớt bớt lại'",
            say: "Con kể mẹ nghe chuyện khách, chuyện review, chuyện mạng xã hội.",
            roll: { p: 0.6,
              win: { say: "Mẹ nghe xong cười: 'Thời con khác thời mẹ. Mà con viết cũng có duyên.'", fx: { rep: 1, xp: 2 } },
              lose: { say: "Mẹ nghe xong: 'Ừ, mà bớt bớt lại nha con. Khách là người nuôi mình.'", fx: { xp: 2 } } } },
          { id: "promise", label: "Hứa viết hiền hơn", hint: "Không tốn gì · +1 danh tiếng",
            say: "Con hứa lần sau viết hiền hơn. Mẹ nói 'hiền thì hiền, nhưng sườn phải ngon'.", fx: { rep: 1 } },
        ],
      },
    },
  },
  {
    id: "R05", group: "reply", tone: "good", when: "shift", priority: 2, cooldown: 4,
    if: { flags: ["reply-sale"] }, npc: "khach-vp",
    moment: "Khách đọc mã giảm giá trong câu trả lời review, dắt theo cả phòng. Câu chốt đơn có tác dụng thật.",
    nodes: {
      start: {
        mood: "happy",
        line: "Chị ơi, em đọc mã 'COMNONG' trong câu chị trả lời review nè. Em dắt theo ba đứa trong phòng, được giảm hông chị?",
        me: "Câu chốt đơn hôm qua, hôm nay mang về bốn khách. Marketing bằng vá cơm.",
        choices: [
          { id: "honor", label: "Giảm đúng như đã hứa", hint: "−10k · thêm 1 nhóm văn phòng, +1 danh tiếng",
            say: "Đã hứa thì giữ lời. Giảm năm ngàn mỗi dĩa, kèm nụ cười không tính tiền.", fx: { money: -10, rep: 1, arch: { arch: "office", n: 1 }, unflag: "reply-sale" } },
          { id: "tea", label: "Không giảm, tặng trà tắc cả nhóm", hint: "Không tốn gì · hên xui 50% khách vui, 50% khách hơi hụt hẫng",
            say: "Mã hết hạn hôm qua rồi em, chị tặng cả nhóm trà tắc bù nha.",
            roll: { p: 0.5,
              win: { say: "Cả nhóm vui vẻ, trà tắc ngon hơn mã giảm giá.", fx: { arch: { arch: "office", n: 1 }, unflag: "reply-sale" } },
              lose: { say: "Một bạn hơi hụt hẫng: 'Tưởng được giảm.' Quán xin lỗi vì viết chưa rõ hạn.", fx: { rep: -1, unflag: "reply-sale" } } } },
        ],
      },
    },
  },
  {
    id: "R06", group: "reply", tone: "good", when: "day", cooldown: 6,
    if: { flags: ["reply-sale", "t01"] }, npc: "bep-vu",
    moment: "Bếp trưởng Vũ chép câu chốt đơn của quán. Dĩa vuông học dĩa tròn.",
    nodes: {
      start: {
        mood: "neutral",
        line: "Chị ơi, tôi thấy câu trả lời review 'rủ cả phòng giảm 5%' của chị hiệu quả quá. Tôi chép được không, ghi nguồn đàng hoàng.",
        me: "Đối thủ xin phép chép câu chốt đơn. Lịch sự tới mức muốn cho chép luôn công thức nước mắm.",
        choices: [
          { id: "ok", label: "Cho chép, ghi nguồn", hint: "Không tốn gì · +1 danh tiếng, thêm người theo dõi",
            say: "Chép đi anh, nhớ ghi 'học từ quán vỉa hè đối diện'. Vũ ghi thật, chữ in nghiêng.", fx: { rep: 1, followers: 20, unflag: "reply-sale" } },
          { id: "trade", label: "Đổi lấy mẹo sườn hun khói", hint: "Không tốn gì · ca tới khách thoải mái hơn",
            say: "Đổi câu chốt đơn lấy mẹo hun khói. Hai bên cùng lời, khách cùng vui.", fx: { mod: { id: "meo-vu", days: 2, patience: 4 }, unflag: "reply-sale" } },
        ],
      },
    },
  },
  {
    id: "R07", group: "reply", tone: "good", when: "day", priority: 2, cooldown: 5,
    if: { flagMin: { "persona-flip": 2 } }, npc: "co-ut",
    moment: "Cả hẻm nghi quán bị hack nick vì câu trả lời review đổi giọng liên tục. Thật ra chỉ là cô chủ nhiều cảm xúc.",
    nodes: {
      start: {
        mood: "surprised",
        line: "Con ơi, cả hẻm đồn trang quán bị hack nick. Sáng trả lời hiền khô, trưa trả lời cục súc, chiều thì làm thơ. Thiệt hông con?",
        me: "Không ai hack hết. Chỉ là một ngày có nhiều tâm trạng, như vỉ sườn có nhiều vùng lửa.",
        choices: [
          { id: "confess", label: "Thú nhận 'quán nhiều cảm xúc'", hint: "Không tốn gì · hên xui 60% cả hẻm cười (quán hot lên), 40% bị trêu cả tuần",
            say: "Không ai hack đâu cô, con chỉ hơi nhiều cảm xúc thôi.",
            roll: { p: 0.6,
              win: { say: "Cả hẻm cười, đặt biệt danh 'quán bốn mùa'. Người tò mò ghé coi hôm nay quán mùa gì.", fx: { hype: 1, followers: 20, unflag: "persona-flip" } },
              lose: { say: "Cả hẻm trêu cả tuần: 'Hôm nay quán là ai?' Cô chủ cười trừ, lật sườn.", fx: { xp: 2, unflag: "persona-flip" } } } },
          { id: "post", label: "Đăng 'quán không bị hack, chỉ đói'", hint: "Không tốn gì · +1 danh tiếng",
            say: "Đăng một dòng: 'Quán không bị hack, chỉ là trả lời lúc đói và lúc no.'", fx: { rep: 1, unflag: "persona-flip" } },
        ],
      },
    },
  },
  {
    id: "R08", group: "reply", tone: "good", when: "shift", cooldown: 5,
    if: { flagMin: { "persona-flip": 3 } }, npc: "bong",
    moment: "Bông hỏi 'hôm nay chị là phiên bản nào'. Cô chủ trả lời: phiên bản đang lật sườn.",
    nodes: {
      start: {
        mood: "happy",
        line: "Chị ơi, hôm nay chị đổi giọng trả lời review ba lần rồi. Giờ chị là phiên bản nào để em còn biết đường nói chuyện?",
        me: "Phiên bản hiện tại: tay cầm kẹp gắp, mặt dính lọ than, tâm trạng tuỳ miếng sườn.",
        choices: [
          { id: "fun", label: "Trả lời 'phiên bản đang lật sườn'", hint: "Không tốn gì · +2 XP",
            say: "Phiên bản đang lật sườn. Cập nhật mới nhất: cháy cạnh đều hơn.", fx: { xp: 2, unflag: "persona-flip" } },
          { id: "pick", label: "Hứa từ mai giữ một giọng", hint: "Không tốn gì · +1 danh tiếng",
            say: "Từ mai chị giữ một giọng. Chọn giọng nào thì… mai tính.", fx: { rep: 1, unflag: "persona-flip" } },
        ],
      },
    },
  },
  {
    id: "R09", group: "reply", tone: "mixed", when: "shift", priority: 2, cooldown: 4,
    if: { anyFlags: ["review-1star-*"] }, npc: "khach-vp",
    moment: "Khách từng chấm một sao quay lại cho quán cơ hội thứ hai. Lần này dĩa cơm đủ lớp.",
    nodes: {
      start: {
        mood: "neutral",
        line: "Chị còn nhớ em không? Bữa trước em chấm một sao. Đọc chị trả lời, em quyết định quay lại thử lần nữa.",
        me: "Khách một sao quay lại. Đây là bài thi lại, và mình muốn đậu.",
        choices: [
          { id: "best", label: "Tự tay làm dĩa kỹ nhất", hint: "Không tốn gì · bàn này chờ thêm 15 giây, ăn xong ≥ 4 sao thì +2 danh tiếng",
            say: "Tự tay làm dĩa kỹ nhất, canh từng mặt sườn, rưới mỡ hành đúng một muỗng rưỡi.", fx: { group: { roles: ["office"], patienceMul: 1.6, okStars: 4, label: "Khách thi lại", flagOk: "r09-ok" }, unflag: "review-1star-*" } },
          { id: "free", label: "Mời dĩa này, xin lỗi lần nữa", hint: "Không tốn gì · +1 danh tiếng",
            say: "Dĩa này quán mời, coi như lời xin lỗi thứ hai, lần này bằng sườn.", fx: { rep: 1, group: { roles: ["office"], patienceMul: 1.5, label: "Khách thi lại" }, unflag: "review-1star-*" } },
        ],
      },
    },
  },
  {
    id: "R10", group: "reply", tone: "good", when: "day", cooldown: 5,
    if: { anyFlags: ["review-1star-*"] }, npc: "co-ba",
    moment: "Cô Ba đọc review một sao, ghé hỏi han. Hoá ra người bán sườn cũng đọc review cơm sườn.",
    nodes: {
      start: {
        mood: "neutral",
        line: "Cô đọc cái review một sao rồi con. Cô không bênh ai, cô chỉ hỏi: sườn cô có lỗi gì không?",
        me: "Cô Ba đọc review. Cả chợ đọc review. Mạng xã hội giờ tới tận sạp thịt.",
        choices: [
          { id: "own", label: "Nhận lỗi về mình", hint: "Không tốn gì · +1 danh tiếng, Cô Ba thân thiết",
            say: "Lỗi của con cô ơi, sườn cô không có lỗi. Con nướng vội.", fx: { rep: 1, flag: "co-ba-than", flagDays: 7, unflag: "review-1star-*" } },
          { id: "tip", label: "Hỏi cô mẹo giữ sườn mềm", hint: "Không tốn gì · ca tới khách thoải mái hơn",
            say: "Cô chỉ con mẹo giữ sườn mềm khi đông khách đi cô.", fx: { mod: { id: "meo-co-ba", days: 2, patience: 4 }, unflag: "review-1star-*" } },
        ],
      },
    },
  },
];
