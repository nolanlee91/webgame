// Sự kiện Drama sinh ra từ câu trả lời review (core/reviews.js đặt cờ "rep-*" và hẹn sự kiện). Cùng cấu trúc data/events.js.
// R01 ảnh chụp câu trả lời lan khắp nhóm chat, R02 khách quay video đáp lại trend, R03 cựu nhân viên vào bình luận, R04 phốt trên nhóm review,
// R05 khách được mời quay lại kéo theo bạn, R06 tiệm Hẻm Bên chép câu chốt đơn, R07 mẹ đọc câu trả lời cục súc, R08 trang meme xin dùng câu trả lời,
// R09 cư dân mạng nghi tiệm bị hack nick (đổi tính nhiều lần), R10 nhân viên thời vụ hỏi "hôm nay chị là phiên bản nào".
// Cờ do game đặt: rep-viral, rep-phot, rep-trend, rep-back, rep-sale, rep-cuc, rep-meme, rep-flip (ENGINE_FLAG ở core/drama.js).
// sayBy / meBy: câu theo tính cách chủ tiệm (hien | cucsuc | lay | sale), không có thì dùng say / me.
// Hài tử tế, không chê người, không emoji, không thương hiệu hay người thật.

export const EVENTS_REPLY = [
  {
    id: "R01", group: "mang", tone: "good", when: "day", priority: 2, cooldown: 4,
    if: { flags: ["rep-viral"] }, npc: { role: "reviewer", name: "Admin nhóm Ăn Vặt Hẻm 7", self: "mình", call: "chủ tiệm" },
    nodes: {
      start: {
        mood: "happy", line: "Chủ tiệm ơi, ảnh chụp câu trả lời review của tiệm đang chạy khắp các nhóm chat. Có nhóm còn đặt làm hình đại diện.",
        me: "Ủa… câu nào vậy? Tiệm trả lời nhiều quá không nhớ.",
        meBy: { hien: "Dạ… tiệm chỉ trả lời thật lòng thôi mà, ngại quá.", cucsuc: "Câu nào? Tiệm nói câu nào cũng thật.", lay: "Tiệm biết mà. Tiệm đã chuẩn bị tinh thần nổi tiếng từ năm ngoái.", sale: "Vậy là nhóm chat cần một combo kỷ niệm rồi." },
        choices: [
          { id: "pin", label: "Ghim câu trả lời lên bảng ở quầy", hint: "+1 danh tiếng, ca sau +2 khách",
            say: "Tiệm chép câu đó lên bảng phấn ở quầy. Khách vào chụp hình, rồi tiện gọi luôn một ly.",
            sayBy: { hien: "Tiệm chép câu đó lên bảng phấn, kèm dòng nhỏ: \"cảm ơn mọi người đã thương tiệm\".", cucsuc: "Tiệm viết lên bảng, chữ to, không trang trí. Ai đọc thì đọc.", lay: "Tiệm viết lên bảng, kèm mũi tên chỉ vào chủ tiệm: \"người nói câu này đây\".", sale: "Tiệm viết lên bảng, dưới có dòng: \"đọc to câu này được giảm 2k\"." },
            fx: { rep: 1, nextGuests: 2 } },
          { id: "sticker", label: "Làm sticker từ câu trả lời", hint: "+15 người theo dõi, tiệm hot lên",
            say: "Tiệm làm bộ sticker từ câu trả lời. Nhóm chat nào cũng có một tấm, gửi cho nhau cả ngày.", fx: { followers: 15, buzz: 1 } },
          { id: "humble", label: "Giả vờ không biết, đi nấu trân châu", hint: "+3 XP",
            say: "Tiệm nói \"vậy hả\", rồi đi nấu trân châu. Nổi tiếng thì nổi, nồi trân châu vẫn phải khuấy.", fx: { xp: 3, unflag: "rep-viral" } },
        ],
      },
    },
  },
  {
    id: "R02", group: "mang", tone: "good", when: "shift", priority: 2, cooldown: 4,
    if: { flags: ["rep-trend"], tMin: 15000 }, npc: { role: "reviewer", name: "Hến Đi Ăn", self: "mình", call: "chủ tiệm" },
    nodes: {
      start: {
        mood: "happy", line: "Chủ tiệm ơi, mình quay video đáp lại trend của tiệm nè. Cho mình quay chung một cảnh ngay quầy được không?",
        choices: [
          { id: "duet", label: "Diễn chung một cảnh", hint: "Khách đang chờ bớt kiên nhẫn 4 giây, +25 người theo dõi, tiệm hot lên",
            say: "Tiệm cầm cái muỗng làm micro, hai bên diễn đúng ba mươi giây. Video lên mạng trước khi ly kịp đóng nắp.",
            sayBy: { hien: "Tiệm ngại ngùng đứng vào khung hình, cúi chào ba lần. Cư dân mạng khen \"chủ tiệm hiền quá trời\".", cucsuc: "Tiệm đứng khoanh tay, nói đúng một câu: \"Uống đi rồi nói.\" Video nổ.", lay: "Tiệm diễn hết mình, có cả nhạc nền miệng và cú xoay người. Video nổ.", sale: "Tiệm diễn xong chìa luôn tấm menu vào ống kính. Video vẫn nổ, menu cũng nổ." },
            fx: { patience: -4000, followers: 25, buzz: 1, unflag: "rep-trend" } },
          { id: "prop", label: "Pha một ly làm đạo cụ", hint: "Tốn 1 ly + 1 hồng trà, +12 người theo dõi",
            say: "Tiệm pha một ly đẹp nhất ca làm đạo cụ. Quay xong, Hến uống luôn đạo cụ.", fx: { stock: { ly: -1, "hong-tra": -1 }, followers: 12, unflag: "rep-trend" } },
          { id: "later", label: "Hẹn quay sau giờ đông khách", hint: "+3 XP, khách đang chờ thêm 3 giây",
            say: "Đang đông khách nha, hẹn quay lúc vắng. Hến gật đầu, ngồi chờ, uống thêm một ly.", fx: { xp: 3, patience: 3000 } },
        ],
      },
    },
  },
  {
    id: "R03", group: "mang", tone: "mixed", when: "day", priority: 1, cooldown: 5,
    if: { flags: ["rep-phot"] }, npc: { role: "barista", name: "Bé Na (từng làm thời vụ)", self: "em", call: "chị" },
    nodes: {
      start: {
        mood: "sheepish", line: "Chị chủ ơi, em là Na làm thời vụ hồi trước nè. Em thấy bài phốt nên em vô bình luận bênh chị… mà em lỡ kể luôn vụ chị khóc khi nồi trân châu bị khét.",
        choices: [
          { id: "thank", label: "Cảm ơn Na, nhận luôn vụ trân châu", hint: "+1 danh tiếng, +6 người theo dõi, phốt dịu đi",
            say: "Ừ, nồi đó khét thật, chị khóc thật. Cảm ơn em đã kể, giờ ai cũng biết tiệm có trái tim.",
            sayBy: { hien: "Dạ đúng rồi, nồi đó khét chị buồn lắm. Cảm ơn Na đã nói giùm chị nha.", cucsuc: "Khét thì khóc. Bình thường. Cảm ơn em bênh.", lay: "Đúng, nồi đó là mối tình đầu của chị. Cảm ơn em đã kể chuyện tình buồn.", sale: "Cảm ơn em. Nhân tiện, nồi trân châu mới không khét, mời mọi người ghé thử." },
            fx: { rep: 1, followers: 6, unflag: "rep-phot" } },
          { id: "edit", label: "Nhờ Na sửa bớt bình luận", hint: "+2 XP",
            say: "Na sửa bình luận, chỉ giữ lại câu \"chị chủ ngoài đời dễ thương lắm\". Vụ trân châu là bí mật nội bộ.", fx: { xp: 2 } },
          { id: "live", label: "Mời Na về pha chung một buổi phát trực tiếp", hint: "Tiệm hot lên, +12 người theo dõi",
            say: "Hai chị em pha trà trực tiếp, kể lại vụ trân châu khét. Người xem cười, phốt chìm luôn.", fx: { buzz: 1, followers: 12, unflag: "rep-phot" } },
        ],
      },
    },
  },
  {
    id: "R04", group: "mang", tone: "bad", when: "day", priority: 3, cooldown: 4,
    if: { flags: ["rep-phot"] }, npc: { role: "reviewer", name: "Admin nhóm Review Ăn Uống Quận", self: "mình", call: "tiệm" },
    nodes: {
      start: {
        mood: "annoyed", line: "Bài \"Tiệm trà sữa trả lời khách như đi tranh luận\" đã có ba trăm bình luận. Tiệm có muốn lên tiếng không?",
        meBy: { hien: "Dạ… tiệm không cố ý làm ai buồn hết.", cucsuc: "Tiệm nói thật thôi mà. Thật hơi cay.", lay: "Ba trăm bình luận, tiệm chưa bao giờ nổi tới vậy.", sale: "Ba trăm người đang nhắc tên tiệm… về mặt quảng cáo thì cũng là ba trăm." },
        choices: [
          { id: "sorry", label: "Đăng bài đính chính và xin lỗi", hint: "+1 danh tiếng, bớt hot",
            say: "Tiệm đăng bài: \"Tiệm nói hơi gắt, tiệm xin lỗi. Ly trà vẫn pha bằng cái tâm, câu chữ sẽ pha lại cho ngọt.\"",
            sayBy: { hien: "Tiệm viết bài xin lỗi dài ba đoạn, đoạn nào cũng có chữ \"dạ\".", cucsuc: "Tiệm viết đúng hai dòng: \"Tiệm nói gắt. Tiệm xin lỗi.\" Dân mạng bất ngờ vì sự gọn gàng.", lay: "Tiệm xin lỗi bằng một tấm hình cái nồi trân châu cúi đầu. Lần này nghiêm túc thật.", sale: "Tiệm xin lỗi, và lần này không chèn combo. Dân mạng cảm động." },
            fx: { rep: 1, buzz: -1, unflag: "rep-phot" } },
          { id: "live", label: "Phát trực tiếp giải thích", hint: "Chuyện còn tiếp…", say: "Tiệm bật máy, chỉnh đèn, hít một hơi thật sâu.", goto: "live", fx: {} },
          { id: "quiet", label: "Im lặng chờ bão qua", hint: "+2 XP, chuyện tự nguội",
            say: "Tiệm không trả lời thêm. Ba ngày sau người ta chuyển sang hóng chuyện tiệm bánh đầu hẻm.", fx: { xp: 2 } },
        ],
      },
      live: {
        mood: "waiting", line: "Buổi phát có bốn mươi người xem, mười hai người hỏi giá, một người hỏi \"chủ tiệm có người yêu chưa\".",
        choices: [
          { id: "brew", label: "Pha một ly trực tiếp cho mọi người xem", hint: "Hên xui: tay vững thì được lòng lại",
            say: "Tiệm vừa pha vừa kể đầu đuôi câu chuyện, không giấu chữ nào.",
            roll: { p: 0.6, win: { say: "Ly ra đẹp, giọng kể thật. Bình luận đổi chiều: \"thẳng mà có tâm\".", fx: { followers: 25, rep: 1, unflag: "rep-phot" } },
              lose: { say: "Run tay đổ nửa ly sữa lên bàn. Người xem cười, nhưng phốt vẫn còn đó.", fx: { followers: 5, rep: -1 } } } },
          { id: "thanks", label: "Cảm ơn mọi người rồi tắt máy", hint: "+3 XP, bớt hot",
            say: "Cảm ơn mọi người đã xem. Tiệm xin phép đi rửa ly, chuyện này tiệm ghi nhớ.", fx: { xp: 3, buzz: -0.5, unflag: "rep-phot" } },
        ],
      },
    },
  },
  {
    id: "R05", group: "khach", tone: "good", when: "shift", priority: 2, cooldown: 3,
    if: { flags: ["rep-back"], queueFree: true, tMax: 150000 }, npc: { role: "regular", name: "Khách viết review hôm trước", self: "mình", call: "chủ tiệm" },
    nodes: {
      start: {
        mood: "happy", line: "Chủ tiệm nhớ mình không? Tiệm trả lời review mời mình quay lại đó. Mình quay lại thật, mà dắt theo hai đứa bạn nữa nè.",
        choices: [
          { id: "group", label: "Nhận thêm đơn nhóm 2 ly", hint: "Đơn 2 ly tới ngay, thưởng 6k nếu kịp",
            say: "Mời cả ba vào! Tiệm làm đúng như đã hứa trong câu trả lời.",
            sayBy: { hien: "Dạ mời cả nhà vào ạ, tiệm cảm ơn đã giữ lời quay lại.", cucsuc: "Vào đi. Lần này đúng từng ly. Chấm đi.", lay: "Nhân vật chính của review đã quay lại, kèm hai diễn viên phụ. Mời vào!", sale: "Ba người là đủ combo nhóm rồi, mời vào!" },
            fx: { group: { cups: 2, arch: "hoc-sinh", same: false, name: "Khách cũ và bạn", tip: 6, line: "Hai ly cho hai đứa bạn mình nha, tụi nó đọc câu trả lời của tiệm rồi." }, unflag: "rep-back" } },
          { id: "photo", label: "Chụp hình chung ở quầy", hint: "+8 người theo dõi",
            say: "Ba người một chủ tiệm, tấm hình có chú thích: \"quay lại vì một câu trả lời\".", fx: { followers: 8, unflag: "rep-back" } },
        ],
      },
    },
  },
  {
    id: "R06", group: "khach", tone: "mixed", when: "day", priority: 2, cooldown: 4,
    if: { flags: ["rep-sale"] }, npc: { role: "vip", name: "Chị Lụa Hẻm Bên", self: "chị", call: "em" },
    nodes: {
      start: {
        mood: "sheepish", line: "Em ơi, chị đọc mấy câu chốt đơn dưới review của em… chị lỡ chép y chang cho tiệm chị. Chị qua nói trước cho đàng hoàng.",
        choices: [
          { id: "praise", label: "Khen chị chép khéo", hint: "+1 danh tiếng, chị Lụa quý tiệm",
            say: "Chị chép là em vui, vậy là câu đó hay thật. Mình cùng bán, khách được lợi.",
            sayBy: { hien: "Dạ không sao đâu chị, chị dùng thoải mái ạ.", cucsuc: "Chép thì chép. Câu đó em nghĩ mất cả buổi đó nha.", lay: "Chị chép rồi thì chị phải ghi nguồn: \"lấy cảm hứng từ một chủ tiệm lầy\".", sale: "Chị chép câu chốt đơn thì em chốt chị: lấy trân châu bên em không chị?" },
            fx: { rep: 1, unflag: "rep-sale" } },
          { id: "combo", label: "Ra combo mới đè lại", hint: "−10k in bảng combo, ca sau +2 khách",
            say: "Tiệm in bảng combo mới, chữ to hơn, giá mềm hơn, đứng từ đầu hẻm cũng đọc được.", fx: { money: -10, nextGuests: 2, unflag: "rep-sale" } },
          { id: "team", label: "Rủ chị làm chung ngày hội hẻm", hint: "+5 XP, +10 người theo dõi",
            say: "Hai tiệm làm chung ngày hội hẻm: bên kia bán bánh, bên này bán trà, khách đi một vòng đủ món.", fx: { xp: 5, followers: 10, unflag: "rep-sale" } },
        ],
      },
    },
  },
  {
    id: "R07", group: "doi", tone: "good", when: "day", priority: 1, cooldown: 6,
    if: { flags: ["rep-cuc"] }, npc: { role: "neighbor", name: "Mẹ", self: "mẹ", call: "con" },
    nodes: {
      start: {
        mood: "waiting", line: "Mẹ mới đọc câu con trả lời khách trên mạng. Mẹ không la đâu, mẹ chỉ hỏi: con học ăn nói ở ai vậy?",
        me: "Dạ… chắc ở ba.",
        meBy: { hien: "Dạ… con trả lời vậy là hiền nhất rồi mẹ.", cucsuc: "Dạ… chắc ở ba. Ba cũng nói vậy mà.", lay: "Dạ con học ở mấy trang meme mẹ ơi.", sale: "Dạ con học ở mấy cô bán hàng ngoài chợ, chốt đơn giỏi lắm mẹ." },
        choices: [
          { id: "soft", label: "Hứa nói chuyện nhẹ lại", hint: "+1 danh tiếng",
            say: "Dạ con hứa nói nhẹ lại. Mẹ gật đầu: \"Nói nhẹ thôi, chứ trà con pha ngon mà.\"", fx: { rep: 1, unflag: "rep-cuc" } },
          { id: "explain", label: "Giải thích: thẳng mà vui", hint: "+5 người theo dõi",
            say: "Con thẳng chứ không ác đâu mẹ. Mẹ đọc lại lần nữa, rồi bật cười, rồi chia sẻ cho nhóm bạn.", fx: { followers: 5 } },
          { id: "mom", label: "Nhờ mẹ viết hộ một câu trả lời", hint: "+20 người theo dõi, tiệm hot lên, +3 XP",
            say: "Mẹ viết: \"Con tôi nói hơi thẳng, nhưng ly trà nó pha thì mềm như tấm lòng. Ghé đi các con.\" Câu đó nổi hơn mọi câu con từng viết.",
            fx: { followers: 20, buzz: 1, xp: 3, unflag: "rep-cuc" } },
        ],
      },
    },
  },
  {
    id: "R08", group: "mang", tone: "good", when: "day", priority: 2, cooldown: 4,
    if: { flags: ["rep-meme"] }, npc: { role: "reviewer", name: "Admin trang Meme Hẻm Nhỏ", self: "mình", call: "tiệm" },
    nodes: {
      start: {
        mood: "happy", line: "Chào tiệm, trang mình muốn dùng meme trả lời review của tiệm cho bài tuần này. Tiệm cho phép không?",
        choices: [
          { id: "yes", label: "Cho dùng, ghi tên tiệm", hint: "+20 người theo dõi, tiệm hot lên",
            say: "Dùng thoải mái, nhớ ghi tên tiệm. Bài lên, tên tiệm chạy khắp trang.", fx: { followers: 20, buzz: 1, unflag: "rep-meme" } },
          { id: "trade", label: "Đổi bản quyền lấy một đơn 5 ly", hint: "+20k (trang mua 5 ly cho cả nhóm admin)",
            say: "Bản quyền meme của tiệm giá đúng năm ly trà. Admin đồng ý, cả nhóm admin ghé lấy.", fx: { money: 20, xp: 2, unflag: "rep-meme" } },
          { id: "keep", label: "Giữ meme cho riêng tiệm", hint: "+1 danh tiếng",
            say: "Meme này là kỷ niệm của tiệm với khách, xin phép giữ lại. Admin hiểu và thả tim.", fx: { rep: 1, unflag: "rep-meme" } },
        ],
      },
    },
  },
  {
    id: "R09", group: "mang", tone: "mixed", when: "day", priority: 2, cooldown: 4,
    if: { flags: ["rep-flip"] }, npc: { role: "reviewer", name: "Cư dân Hẻm 7", self: "mình", call: "tiệm" },
    nodes: {
      start: {
        mood: "surprised", line: "Tiệm ơi, cả nhóm đang bàn: hôm qua chủ tiệm hiền như cục bột, hôm nay cục súc như bị hack nick. Tiệm có mấy admin vậy?",
        meBy: { hien: "Dạ… một người thôi ạ, chỉ là hôm nay tiệm hiền lại rồi.", cucsuc: "Một admin. Nhiều tâm trạng. Hết.", lay: "Tiệm có một admin và năm phiên bản cập nhật.", sale: "Một admin thôi, nhưng mỗi phiên bản đều có combo riêng." },
        choices: [
          { id: "truth", label: "Nhận: một người, nhiều tâm trạng", hint: "+12 người theo dõi, tiệm hot lên",
            say: "Một chủ tiệm thôi, mỗi ngày một tâm trạng, ly trà thì lúc nào cũng một vị. Cả nhóm cười, theo dõi thêm.", fx: { followers: 12, buzz: 0.5, unflag: "rep-flip" } },
          { id: "game", label: "Biến thành trò đoán \"hôm nay chủ tiệm là ai\"", hint: "+5 XP, ca sau +1 khách",
            say: "Tiệm mở trò đoán: sáng mỗi ngày đăng một câu, ai đoán đúng tính cách hôm nay được thêm topping.", fx: { xp: 5, nextGuests: 1, unflag: "rep-flip" } },
          { id: "steady", label: "Hứa giữ một giọng cho ổn định", hint: "+1 danh tiếng",
            say: "Tiệm hứa từ nay giữ một giọng. Ít nhất là tới khi gặp một review quá hay.", fx: { rep: 1, unflag: "rep-flip" } },
        ],
      },
    },
  },
  {
    id: "R10", group: "doi", tone: "good", when: "shift", priority: 1, cooldown: 5,
    if: { flags: ["rep-flip"], tMin: 10000 }, npc: { role: "barista", name: "Bé Na (phụ ca)", self: "em", call: "chị" },
    nodes: {
      start: {
        mood: "surprised", line: "Chị ơi, cho em hỏi trước khi khách hỏi: hôm nay chị là phiên bản hiền, cục, lầy hay chốt đơn? Em còn biết đường mà cười theo.",
        meBy: { hien: "Hôm nay chị hiền, em cứ cười tươi là được.", cucsuc: "Hôm nay chị cục. Em cười ít thôi.", lay: "Hôm nay chị lầy. Em chuẩn bị điện thoại quay.", sale: "Hôm nay chị chốt đơn. Em cầm sẵn tờ menu." },
        choices: [
          { id: "sign", label: "Treo bảng \"Tâm trạng chủ tiệm hôm nay\"", hint: "Khách đang chờ thêm 4 giây (đọc bảng cho vui)",
            say: "Tiệm treo tấm bảng nhỏ ở quầy ghi tâm trạng hôm nay. Khách đứng chờ đọc, cười, quên luôn chuyện chờ.", fx: { patience: 4000, unflag: "rep-flip" } },
          { id: "same", label: "Nói Na cứ làm như mọi ngày", hint: "+3 XP",
            say: "Phiên bản nào thì trà vẫn pha đúng phiếu. Em cứ làm như mọi ngày là được.", fx: { xp: 3 } },
        ],
      },
    },
  },
];
