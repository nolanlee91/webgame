// Sự kiện Khách K01–K16 (docs/tiem-banh-mi/DRAMA.md §2.1). Cấu trúc + khoá hợp lệ: xem chú thích đầu data/events.js.
// Giờ ca: buổi sáng 0–105000 ms ứng với 05:30–08:00 (700 ms mỗi phút đồng hồ) ⇒ 06:00 = 21000, 06:40 = 49000, 07:20 = 77000, 07:30 = 84000.
// Nhân vật, tiệm, công ty đều hư cấu. Không thương hiệu thật, không người thật, không emoji.

export const EVENTS_KHACH = [
  // ===== K01 · Chú Tám đặt 12 ổ cho đội thợ =====
  {
    id: "K01", group: "khach", tone: "good", when: "shift", priority: 2, cooldown: 4,
    if: { minDay: 3, phase: "sang", tMin: 21000, tMax: 49000, queueFree: true }, npc: "chu-tam",
    nodes: {
      start: {
        mood: "happy",
        line: "Mười hai ổ! Đứa nào cũng thêm trứng, trừ thằng Hải không ăn hành, thằng Lộc không ăn ớt! Nghe rõ chưa {call}?",
        me: "Dạ rõ… để con ghi ra giấy kẻo trí nhớ con không chịu nổi.",
        choices: [
          { id: "all", label: "Nhận hết 12 ổ", hint: "Đơn 12 ổ tới ngay · giao đúng hết +15k tip, mai chú quay lại bàn chuyện lớn",
            say: "Mười hai ổ thì mười hai ổ. Lò nóng rồi, tay cũng nóng rồi.",
            sayBy: {
              hien: "Dạ con nhận hết, chú cho con xin đúng tên từng anh để con khỏi lộn nha.",
              cucsuc: "Nhận. Nhưng ai đổi món giữa chừng là xếp hàng lại từ đầu.",
              lay: "Mười hai ổ, combo đội hình xuất phát. Thằng Hải với thằng Lộc là cầu thủ dự bị.",
              sale: "Nhận liền chú! Đội đông vậy lấy thêm bình trà đá cho đủ bộ không chú?",
            },
            fx: { group: { n: 12, recipe: "cha-lua", arch: "worker", name: "Đội Chú Tám", tip: 15, line: "Ổ nào của thằng Hải? Ổ nào không ớt? Ghi tên lên giấy gói giùm chú!",
              flagOk: "k01-ok", laterOk: { id: "K02", days: 1 }, okStars: 3 } },
            goto: "hai" },
          { id: "later10", label: "Nhận, hẹn 10 phút", hint: "Đơn đặt trước 12 ổ, giao trong ca · không dồn hàng chờ ngay",
            say: "Chú cho con mười phút. Mười phút bánh mì, không phải mười phút của Anh Lâm.",
            fx: { preorder: { n: 12, mix: [{ recipe: "cha-lua", n: 10 }, { recipe: "cha-lua", n: 1, quirks: ["khong-hanh"] }, { recipe: "cha-lua", n: 1, quirks: ["khong-ot"] }],
              name: "Đội Chú Tám", arch: "worker", when: "now", dueMs: 35000, label: "12 ổ đội thợ", flagOk: "k01-ok", laterOk: { id: "K02", days: 1 }, okStars: 3 } },
            goto: "hai" },
          { id: "split", label: "Xin chia hai đợt", hint: "6 ổ tới ngay, 6 ổ đặt trước giao sau · đỡ rối tay",
            say: "Sáu ổ trước cho đội tiên phong, sáu ổ sau cho đội… tới trễ.",
            fx: { group: { n: 6, recipe: "cha-lua", arch: "worker", name: "Đội Chú Tám (đợt 1)" },
              preorder: { n: 6, mix: [{ recipe: "cha-lua", n: 4 }, { recipe: "cha-lua", n: 1, quirks: ["khong-hanh"] }, { recipe: "cha-lua", n: 1, quirks: ["khong-ot"] }],
                name: "Đội Chú Tám (đợt 2)", arch: "worker", when: "now", dueMs: 45000, label: "6 ổ đợt 2", flagOk: "k01-ok", laterOk: { id: "K02", days: 1 }, okStars: 3 } },
            goto: "hai" },
        ],
      },
      hai: {
        mood: "surprised",
        line: "Ủa thằng Hải đâu… à nó mới vô kìa! Mười ba ổ nha {call}!",
        me: "Mười ba… con mới ghi xong chữ mười hai.",
        choices: [
          { id: "plus1", label: "Làm thêm 1 ổ cho Hải", hint: "Cần còn bánh trong tủ · thêm 1 khách thợ hồ, +1 danh tiếng",
            say: "Mười hai ổ, hai cái không hành, một cái không ớt, và một thằng Hải tới trễ.",
            need: { caseMin: 1 }, fx: { arch: { arch: "worker", n: 1 }, rep: 1 } },
          { id: "tomorrow", label: "Hẹn mai bù ổ thứ 13", hint: "Không tốn gì · mai chú ghé lại, nhắc món nợ một ổ",
            say: "Ổ thứ mười ba con nợ chú, mai trả kèm lãi là một cái trứng ốp la.",
            fx: { flag: "k01-no-hai", flagDays: 2 }, later: { id: "K02", days: 1 } },
          { id: "share", label: "Mời Hải ăn chung ổ của Lộc", hint: "Không tốn gì · cả đội cười, Lộc hơi buồn",
            say: "Hai thằng một ổ, một đứa không ăn ớt, một đứa không ăn hành. Hợp nhau tuyệt đối.",
            fx: { xp: 2 } },
        ],
      },
    },
  },

  // ===== K02 · Hợp đồng đầu tiên =====
  {
    id: "K02", group: "khach", tone: "good", when: "day", priority: 2, cooldown: 4, once: true,
    if: { chain: true }, npc: "chu-tam",
    nodes: {
      start: {
        mood: "happy",
        line: "Đội chú làm công trình bên kia ba tháng. Mỗi sáng thứ Hai, Tư, Sáu {call} làm mười hai ổ được không?",
        alt: [{ flags: ["k01-no-hai"], line: "Ổ thằng Hải hôm qua {call} còn nợ chú đó nha. Mà thôi, chú tính chuyện lớn hơn: đội chú làm công trình bên kia ba tháng, sáng Hai, Tư, Sáu {call} làm mười hai ổ được không?", mood: "happy" }],
        me: "Ba tháng… tức là con phải dậy sớm hơn đồng hồ báo thức.",
        choices: [
          { id: "discount", label: "Nhận, giảm 10%", hint: "Đơn 12 ổ sáng mai giảm 10% · 9 ngày tới mỗi ca thêm thợ hồ ghé",
            say: "Có hợp đồng đầu tiên. Ký bằng một cái bắt tay dính bột.",
            fx: { preorder: { n: 12, recipe: "cha-lua", name: "Đội Chú Tám", arch: "worker", when: "next", dueMs: 30000, discount: 0.1, label: "Hợp đồng công trình" },
              mod: { id: "hop-dong-chu-tam", days: 9, guests: { worker: 1 } }, flag: "k02-hd", flagDays: 9 },
            goto: "giao" },
          { id: "full", label: "Nhận, giữ giá gốc", hint: "Hên xui 50% · chú chịu ký 9 ngày, không thì lấy thử 3 ngày",
            say: "Giá gốc, bánh gốc, tay nghề cũng gốc luôn chú.",
            roll: { p: 0.5,
              win: { say: "Chú vỗ vai cái bốp: 'Giá đó đáng!' Vai con còn in năm ngón tay.", fx: { preorder: { n: 12, recipe: "cha-lua", name: "Đội Chú Tám", arch: "worker", when: "next", dueMs: 30000, label: "Hợp đồng công trình" },
                mod: { id: "hop-dong-chu-tam", days: 9, guests: { worker: 1 } }, flag: "k02-hd", flagDays: 9 }, goto: "giao" },
              lose: { say: "Chú gãi đầu: 'Thôi lấy thử một tuần coi tụi nó chịu không.' Một tuần thử việc cho tiệm.", fx: { preorder: { n: 12, recipe: "cha-lua", name: "Đội Chú Tám", arch: "worker", when: "next", dueMs: 30000, label: "Tuần thử" },
                mod: { id: "hop-dong-chu-tam", days: 3, guests: { worker: 1 } }, flag: "k02-hd", flagDays: 3 }, goto: "giao" } } },
          { id: "decline", label: "Từ chối khéo", hint: "Không tốn gì · +1 danh tiếng, chú vẫn ghé lẻ",
            say: "Con sợ hứa mà nướng không kịp. Chú cứ ghé, ổ nào cũng như ổ đầu.",
            fx: { rep: 1 } },
        ],
      },
      giao: {
        mood: "neutral",
        line: "À mà {call} giao tận công trình được không? Tụi nó trộn hồ dở tay, chạy qua là hồ khô.",
        choices: [
          { id: "deliver", label: "Giao tận nơi", hint: "+5k phí giao · 9 ngày tới khách chờ kém 5% vì quầy hay trống",
            say: "Giao bánh tận giàn giáo. Lần đầu bánh mì của tiệm lên tới tầng ba.",
            fx: { money: 5, rep: 1, mod: { id: "giao-cong-trinh", days: 9, patience: -5 } } },
          { id: "pickup", label: "Để chú cho thợ qua lấy", hint: "Không tốn gì · đơn tới quầy, không mất giờ",
            say: "Chú cử thằng Hải qua lấy. Thằng Hải tới trễ, nhưng lần này có lý do.",
            fx: { xp: 2 } },
        ],
      },
    },
  },

  // ===== K03 · Anh Bảy xin ghi sổ =====
  {
    id: "K03", group: "khach", tone: "mixed", when: "shift", priority: 1, cooldown: 4,
    if: { minDay: 4, noFlags: ["k03-no"] }, npc: "anh-bay",
    nodes: {
      start: {
        mood: "neutral",
        line: "Hôm nay khách ít quá {call} ơi. Cho anh ổ thịt nướng, ghi sổ nghen, mai anh trả.",
        me: "Mai của anh là mai thiệt hay mai… kiểu xe ôm?",
        choices: [
          { id: "credit", label: "Ghi sổ", hint: "Hao 1 ổ trong tủ · ghi nợ 26k, anh hẹn trả",
            say: "Sổ nợ có dòng đầu tiên: Anh Bảy, 1 ổ thịt nướng, 'mai trả'.",
            need: { caseMin: 1 }, fx: { bread: -1, debt: { name: "Anh Bảy", k: 26 }, flag: "k03-no", flagDays: 6 }, later: { id: "K04", days: 3 } },
          { id: "gift", label: "Cho luôn ổ này", hint: "Hao 1 ổ trong tủ · +2 danh tiếng, anh đi kể khắp bến (+1 khách ca sau)",
            say: "Ổ này tiệm mời. Anh chở giùm tiếng thơm của tiệm đi một vòng hẻm là được.",
            need: { caseMin: 1 }, fx: { bread: -1, rep: 2, nextGuests: 1 } },
          { id: "tea", label: "Từ chối khéo, mời trà đá", hint: "Không tốn gì · hên xui 30% anh dỗi, ca sau −1 khách",
            say: "Tiệm chưa có sổ nợ anh ơi, có mỗi bình trà đá. Anh uống ly cho mát.",
            sayBy: {
              hien: "Dạ tiệm nhỏ chưa dám ghi sổ, anh uống ly trà đá giùm em cho vui nha.",
              cucsuc: "Không ghi sổ. Trà đá thì miễn phí, uống bao nhiêu cũng được.",
              lay: "Sổ nợ của tiệm đang bảo trì. Tạm thời chỉ phục vụ trà đá không giới hạn.",
              sale: "Ghi sổ thì không, nhưng mai anh ghé sớm em để ổ giòn nhất cho anh, chịu không?",
            },
            roll: { p: 0.7,
              win: { say: "Anh Bảy nốc ly trà đá, cười khà: 'Được, mai anh có tiền anh mua hai ổ.'", fx: { xp: 2 } },
              lose: { say: "Anh Bảy uống xong, nói 'ờ' một tiếng dài bằng cả con hẻm rồi nổ máy đi.", fx: { nextGuests: -1 } } } },
        ],
      },
    },
  },

  // ===== K04 · Anh Bảy trả nợ =====
  {
    id: "K04", group: "khach", tone: "mixed", when: "day", priority: 2, cooldown: 2,
    if: { chain: true }, npc: "anh-bay",
    nodes: {
      start: {
        mood: "neutral",
        line: "{Call}! Anh nè. Bữa anh nợ ổ thịt nướng đúng không? Để anh coi…",
        me: "Anh móc túi lâu vậy chắc túi sâu lắm.",
        choices: [
          { id: "remind", label: "Nhắc nhẹ", hint: "Không tốn gì · hên xui 70% anh trả đủ + tip 5k, không thì trả nửa",
            say: "Dạ ổ thịt nướng hai mươi sáu ngàn, em nhớ giùm anh rồi đó.",
            roll: { p: 0.7,
              win: { say: "Anh Bảy đập tờ tiền lên quầy: 'Dư năm ngàn, coi như tiền lãi tình cảm.'", fx: { money: 31, debt: { name: "Anh Bảy", k: -26 }, unflag: "k03-no" } },
              lose: { say: "Anh Bảy trả nợ bằng 12k và một câu chuyện năm 1998.", fx: { money: 12, debt: { name: "Anh Bảy", k: -12 } }, goto: "nua" } } },
          { id: "silent", label: "Không nhắc", hint: "Không tốn gì · hên xui 50% anh tự trả và rủ cả bến xe ôm (+3 khách ca sau)",
            say: "Em không nhắc, để lòng tự trọng của anh nhắc.",
            roll: { p: 0.5,
              win: { say: "Anh Bảy trả đủ, còn dẫn cả bến xe ôm: 'Tiệm này cho anh nợ mà không nhắc, ăn đi tụi bây!'", fx: { money: 26, debt: { name: "Anh Bảy", k: -26 }, nextGuests: 3, unflag: "k03-no" } },
              lose: { say: "Anh Bảy kể hết chuyện xe số đời đầu, quên luôn lý do mình tới. Hẹn bữa khác.", fx: { xp: 2 }, later: { id: "K04", days: 3 } } } },
        ],
      },
      nua: {
        mood: "happy",
        line: "Còn mười bốn ngàn nữa… mai anh trả nốt nghen. Lần này mai thiệt.",
        choices: [
          { id: "forgive", label: "Xoá nợ phần còn lại", hint: "Không tốn gì · xoá 14k nợ, +2 danh tiếng",
            say: "Mười bốn ngàn còn lại em đổi lấy câu chuyện năm 1998. Huề.",
            fx: { debt: { name: "Anh Bảy", k: -14 }, rep: 2, unflag: "k03-no" } },
          { id: "keep", label: "Ghi tiếp vào sổ", hint: "Không tốn gì · hẹn anh trả nốt sau 3 ngày",
            say: "Sổ nợ thêm dòng thứ hai: Anh Bảy, 14k, 'mai thiệt'.",
            fx: { xp: 1 }, later: { id: "K04", days: 3 } },
        ],
      },
    },
  },

  // ===== K05 · Khách Tây hỏi phở =====
  {
    id: "K05", group: "khach", tone: "good", when: "shift", priority: 1, cooldown: 3,
    if: { minLevel: 6, archWaiting: "tourist" }, who: { arch: "tourist" },
    nodes: {
      start: {
        mood: "surprised",
        line: "Excuse me… phở? Có phở không?",
        me: "Phở… thì đầu hẻm. Ở đây là bánh mì, cũng là bột mà khác số phận.",
        choices: [
          { id: "pho", label: "Chỉ đường quán phở đầu hẻm", hint: "Mất khách này · +2 danh tiếng, người quen của khách có thể ghé lại",
            say: "Chỉ đường tận tình tới mức khách suýt mời mình đi ăn phở chung.",
            fx: { leaveWho: true, rep: 2, flag: "k05-pho", flagDays: 4 }, later: { id: "K06", days: 2 } },
          { id: "hands", label: "Diễn tả bánh mì bằng tay", hint: "Không tốn gì · hên xui 60% khách mua thêm 1 ổ + tip 10k",
            say: "Bị hỏi phở ở tiệm bánh mì. Trả lời bằng tay, chân và một ổ thịt nướng.",
            roll: { p: 0.6,
              win: { say: "Khách gật gù 'crispy!', mua thêm một ổ cho bạn và nhét tip vào hũ.", fx: { sell: { n: 1, price: 26 }, money: 10, followers: 5 } },
              lose: { say: "Khách mua ổ, rồi lịch sự hỏi xin thêm… nước dùng. Tiệm cho ly trà đá thay.", fx: { followers: 3, xp: 2 } } } },
          { id: "board", label: "Đưa bảng hình món", hint: "Không tốn gì · khách chọn bằng ngón tay, chờ thêm 10 giây",
            say: "Bảng hình món: ngôn ngữ chung của nhân loại, sau nụ cười và tiền chuyển khoản.",
            fx: { whoPatience: 10000 } },
        ],
      },
    },
  },

  // ===== K06 · Ollie quay clip =====
  {
    id: "K06", group: "khach", tone: "good", when: "shift", priority: 2, cooldown: 4, once: true,
    if: { minLevel: 6, minDay: 6 }, npc: "ollie",
    nodes: {
      start: {
        mood: "happy",
        line: "Xin chào! Cảm ơn! Ngon quá! … Một bánh mì, quay được không?",
        alt: [{ flags: ["k05-pho"], line: "Xin chào! Bạn tôi nói anh chỉ đường phở rất giỏi. Hôm nay tôi muốn bánh mì! Quay được không?", mood: "happy" }],
        me: "Anh nói tiếng Việt giỏi quá, sáu câu mà dùng hết năm câu trong một hơi.",
        choices: [
          { id: "film", label: "Cho quay luôn", hint: "Không tốn gì · sang bước quay clip",
            say: "Cho quay. Tóc tai chưa kịp chải, nhưng bánh thì đã giòn.",
            goto: "quay" },
          { id: "afterShift", label: "Xin quay sau ca", hint: "Không tốn gì · giữ nhịp quầy, +5 người theo dõi",
            say: "Đợi tan ca nha anh. Giờ này hàng chờ còn dài hơn clip của anh.",
            fx: { followers: 5 } },
        ],
      },
      quay: {
        mood: "happy",
        line: "Máy quay chạy rồi! Anh làm gì đặc biệt không? Người xem của tôi thích… crispy!",
        choices: [
          { id: "special", label: "Làm ổ đặc biệt tặng", hint: "−1 phần thịt nướng, −1 trứng · hên xui 65% clip lên mạng lớn (+200 người theo dõi)",
            say: "Ổ đặc biệt: thịt nướng, trứng, và toàn bộ sự hồi hộp của chủ tiệm.",
            fx: { stock: { "thit-nuong": -1, trung: -1 } },
            roll: { p: 0.65,
              win: { say: "Ollie cắn một miếng, nhắm mắt, nói 'ngon quá' lần thứ bảy. Clip bay khắp mạng.", fx: { followers: 200, buzz: 1, flag: "k06-clip", flagDays: 3 }, later: { id: "K07", days: 1 } },
              lose: { say: "Clip lên, nhưng ống kính chỉ quay mặt Ollie. Ổ bánh xuất hiện đúng nửa giây.", fx: { followers: 20 } } } },
          { id: "teach", label: "Ráp bình thường, dạy nói 'giòn quá'", hint: "Không tốn gì · chắc chắn +60 người theo dõi",
            say: "Dạy một người nước ngoài nói 'giòn quá'. Anh nói thành 'dòn quá' và cả mạng sửa giùm.",
            sayBy: {
              hien: "Anh nói theo em nha: giòn… quá. Dạ đúng rồi, gần đúng rồi, đúng một nửa rồi.",
              cucsuc: "Giòn. Không phải dòn. Lại lần nữa. Ổ chưa nguội thì chưa xong bài.",
              lay: "Bài học hôm nay: 'giòn quá'. Bài tập về nhà: ăn thêm ổ nữa rồi nói lại.",
              sale: "Nói đúng 'giòn quá' em giảm 2k! Sai thì… mua thêm ổ tập tiếp nha anh.",
            },
            fx: { followers: 60 } },
        ],
      },
    },
  },

  // ===== K07 · Clip Ollie lên mạng =====
  {
    id: "K07", group: "khach", tone: "good", when: "day", priority: 2, cooldown: 3, once: true,
    if: { chain: true }, npc: "co-sau",
    nodes: {
      start: {
        mood: "surprised",
        line: "{Call} ơi, có ông Tây quay tiệm {call}, cả hẻm coi rồi. Cô coi ba lần, lần nào cũng thấy {call} cười méo.",
        me: "Méo vì hồi hộp đó cô, không phải vì bánh.",
        choices: [
          { id: "menu", label: "Làm bảng menu song ngữ", hint: "−25k · 5 ngày tới mỗi ca +2 khách Tây",
            say: "Bảng menu hai thứ tiếng. Chữ 'crispy' viết to nhất.",
            fx: { money: -25, mod: { id: "menu-song-ngu", days: 5, guests: { tourist: 2 } } } },
          { id: "repost", label: "Đăng lại clip", hint: "Không tốn gì · +80 người theo dõi, tiệm nóng lên",
            say: "Đăng lại clip kèm chú thích: 'tiệm tụi mình nói được tiếng giòn'.",
            fx: { followers: 80, buzz: 0.5 } },
          { id: "ignore", label: "Kệ, bán như thường", hint: "Không tốn gì · +1 danh tiếng",
            say: "Lên mạng nước ngoài. Mẹ hỏi 'cái ông đó nói gì vậy con'.",
            fx: { rep: 1 } },
        ],
      },
    },
  },

  // ===== K08 · Học sinh còn 12 ngàn =====
  {
    id: "K08", group: "khach", tone: "good", when: "shift", priority: 1, cooldown: 3,
    if: { minDay: 3, phase: "sang", tMin: 49000, tMax: 77000, archWaiting: "student" }, who: { arch: "student" },
    nodes: {
      start: {
        mood: "neutral",
        line: "{Call} ơi… {self} còn mười hai ngàn, ổ mười hai ngàn được không {call}?",
        me: "Mười hai ngàn… để anh coi cái lò có đồng ý không.",
        choices: [
          { id: "noButter", label: "Bán ổ pate không bơ, tính 12k", hint: "Giá ổ còn 12k, lãi 2k · +1 danh tiếng",
            say: "Ổ mười hai ngàn. Lãi hai ngàn và một lời cảm ơn ngọng líu.",
            sayBy: {
              hien: "Được em, ổ pate không bơ mười hai ngàn, ăn no rồi học giỏi nha.",
              cucsuc: "Mười hai ngàn thì ổ pate, không bơ. Ăn đi, đừng nhịn đói đi học.",
              lay: "Gói ưu đãi học đường: pate full, bơ đi nghỉ phép. Mười hai ngàn chẵn.",
              sale: "Mười hai ngàn có ổ pate liền! Mai có mười sáu ngàn ghé lấy bản đủ bơ nha em.",
            },
            fx: { priceWho: -4, rep: 1, flag: "k08-giup", flagDays: 6 }, later: { id: "K09", days: 5 } },
          { id: "full", label: "Bán ổ pate bơ, vẫn tính 12k", hint: "−1 phần bơ, giá ổ còn 12k · +2 danh tiếng",
            say: "Ổ đủ bơ đủ pate, giá học sinh. Lò hơi tiếc, chủ tiệm thì không.",
            fx: { priceWho: -4, stock: { bo: -1 }, rep: 2, flag: "k08-giup", flagDays: 6 }, later: { id: "K09", days: 5 } },
          { id: "sorry", label: "Nói khéo là không được", hint: "Không tốn gì · em đi tìm món vừa túi",
            say: "Ổ nhỏ nhất tiệm mười sáu ngàn em ơi. Mai đủ tiền ghé, anh nướng giòn hơn hôm nay.",
            fx: { leaveWho: true } },
        ],
      },
    },
  },

  // ===== K09 · Lớp 11A2 đi dã ngoại =====
  {
    id: "K09", group: "khach", tone: "good", when: "day", priority: 2, cooldown: 4, once: true,
    if: { chain: true }, npc: "co-giao",
    nodes: {
      start: {
        mood: "happy",
        line: "Alo, {shop} phải không em? Lớp cô đi dã ngoại, đặt ba lăm cây que với mười ổ pate, sáu giờ rưỡi sáng mai. Có em học sinh giới thiệu, nói tiệm em tốt bụng lắm.",
        me: "Dạ… em học sinh đó chắc là em mười hai ngàn.",
        choices: [
          { id: "all", label: "Nhận hết", hint: "Đơn đặt trước 7 bịch que + 10 ổ pate sáng mai, cọc 30% ngay",
            say: "Lớp 11A2 đi dã ngoại bằng 35 que bánh mì của tiệm.",
            fx: { preorder: { n: 17, mix: [{ recipe: "que", n: 7 }, { recipe: "pate-bo", n: 10 }], name: "Lớp 11A2", arch: "parent", when: "next", dueMs: 42000, label: "Dã ngoại 11A2" },
              flag: "k09-full", flagDays: 2 },
            goto: "bot" },
          { id: "half", label: "Nhận một nửa", hint: "Đơn đặt trước 4 bịch que + 5 ổ pate sáng mai · nhẹ tay hơn",
            say: "Nhận nửa đơn. Nửa lớp ăn bánh mì, nửa lớp ăn… kế hoạch B của cô.",
            fx: { preorder: { n: 9, mix: [{ recipe: "que", n: 4 }, { recipe: "pate-bo", n: 5 }], name: "Lớp 11A2", arch: "parent", when: "next", dueMs: 42000, label: "Dã ngoại 11A2" },
              flag: "k09-half", flagDays: 2 },
            goto: "bot" },
          { id: "decline", label: "Từ chối", hint: "Không tốn gì · không có đơn",
            say: "Sáu giờ rưỡi mà bốn mươi lăm phần, lò của em xin hàng trước. Hẹn cô dịp khác.",
            fx: { xp: 1 } },
        ],
      },
      bot: {
        mood: "neutral",
        line: "Mà em ơi, cô xin bớt chút cho tụi nhỏ nha. Quỹ lớp toàn tiền lẻ góp từng tuần.",
        choices: [
          { id: "disc", label: "Giảm 10%", hint: "−26k · +2 danh tiếng",
            say: "Giảm mười phần trăm. Tiền bớt đó cô mua thêm nước cho tụi nhỏ.",
            need: { flags: ["k09-full"] }, fx: { money: -26, rep: 2 } },
          { id: "discHalf", label: "Giảm 10%", hint: "−14k · +2 danh tiếng",
            say: "Giảm mười phần trăm. Tiền bớt đó cô mua thêm nước cho tụi nhỏ.",
            need: { flags: ["k09-half"] }, fx: { money: -14, rep: 2 } },
          { id: "tea", label: "Tặng bình trà đá", hint: "−5k · +3 danh tiếng",
            say: "Tặng nguyên bình trà đá. Cả lớp gọi tiệm là 'nhà tài trợ kim cương'.",
            fx: { money: -5, rep: 3 } },
          { id: "keep", label: "Giữ giá", hint: "Không tốn gì · đơn giữ nguyên",
            say: "Giá đã là giá học trò rồi cô, em bù lại bằng ổ giòn nhất mẻ.",
            fx: { xp: 1 } },
        ],
      },
    },
  },

  // ===== K10 · Ổ trơn cắt tư cho bé =====
  {
    id: "K10", group: "khach", tone: "good", when: "shift", priority: 1, cooldown: 3,
    if: { minDay: 2, archWaiting: "parent" }, who: { arch: "parent" },
    nodes: {
      start: {
        mood: "neutral",
        line: "Cắt làm tư cho bé nha {call}. Không ớt, không hành, không rau, không đồ chua, không dưa leo… chỉ bánh với pate thôi.",
        me: "Dạ, ổ bánh mì phiên bản thiền định.",
        choices: [
          { id: "plain", label: "Làm ổ trơn, tính giá pate bơ", hint: "Không tốn gì · khách vui, +1 danh tiếng",
            say: "Một ổ bánh mì cắt tư, không gì cả. Bé ăn hết, mẹ bé ăn phần ớt tưởng tượng.",
            fx: { quirk: "khong-rau", rep: 1 } },
          { id: "cheap", label: "Tính rẻ 3k", hint: "Giá ổ −3k · +2 danh tiếng, phụ huynh thành khách quen",
            say: "Ổ không có gì thì bớt ba ngàn. Công bằng với bé, tử tế với mẹ.",
            fx: { quirk: "khong-rau", priceWho: -3, rep: 2, regular: true } },
          { id: "que", label: "Gợi ý bánh mì que", hint: "Cần khay que · hao 2 phôi que, bán 2 bịch 30k (bé đòi thêm)",
            say: "Gợi ý bánh mì que. Bé ăn một bịch, ôm một bịch, đòi bịch thứ ba cho con gấu.",
            need: { owns: "que-tray" }, fx: { leaveWho: true, money: 30, stock: { "phoi-que": -2 }, xp: 4 } },
        ],
      },
    },
  },

  // ===== K11 · Khách mới nói "như cũ" =====
  {
    id: "K11", group: "khach", tone: "good", when: "shift", priority: 1, cooldown: 3,
    if: { minDay: 4, waitingMin: 1 }, who: "waiting",
    nodes: {
      start: {
        mood: "happy",
        line: "Như cũ nha {call}!",
        me: "(Mình chưa gặp người này bao giờ. Hay là gặp rồi mà quên?)",
        choices: [
          { id: "guess", label: "Đoán: thập cẩm", hint: "Không tốn gì · hên xui 40% trúng gu, khách tưởng tiệm nhớ thật",
            say: "Thập cẩm như cũ ha! Tiệm nhớ hết, nhớ cả những thứ chưa xảy ra.",
            roll: { p: 0.4,
              win: { say: "Khách mới nói 'như cũ'. Tiệm đoán trúng. Giờ phải nhớ thật.", fx: { rep: 1, regular: true } },
              lose: { say: "'Ủa, {self} tưởng {call} nhớ.' Khách vẫn mua, nhưng nhìn tiệm như nhìn một ảo thuật gia hụt.", fx: { xp: 2 } } } },
          { id: "ask", label: "Hỏi khéo 'cũ là ổ nào ta?'", hint: "Không tốn gì · khách cười gọi lại, chờ thêm 5 giây",
            say: "Cũ là ổ nào ta? Tiệm nhiều khách quen quá nên trí nhớ xin nghỉ phép.",
            sayBy: {
              hien: "Dạ cho em xin lỗi, {call} nhắc giúp em món cũ là món nào để em làm cho chuẩn nha.",
              cucsuc: "Cũ là cái nào? Nói rõ ra, làm sai là tốn bánh của cả hai.",
              lay: "Như cũ là như hồi nào? Trước hay sau khi tiệm đổi lò? Gợi ý một chữ cái đi.",
              sale: "Như cũ thì dễ, mà hôm nay có ổ mới ngon hơn ổ cũ, thử một lần không {call}?",
            },
            fx: { whoPatience: -5000 } },
          { id: "book", label: "Ghi vào Sổ khách quen ngay", hint: "Không tốn gì · lần sau 'như cũ' là có thật",
            say: "Mở Sổ khách quen ghi tên trước khi khách kịp quen. Tiệm đi trước thời đại.",
            fx: { regular: true } },
        ],
      },
    },
  },

  // ===== K12 · Cụ Năm trả tiền lẻ =====
  {
    id: "K12", group: "khach", tone: "good", when: "shift", priority: 1, cooldown: 3,
    if: { phase: "sang", tMin: 21000, tMax: 84000, waitingMin: 2 }, npc: "cu-nam",
    nodes: {
      start: {
        mood: "happy",
        line: "Một ngàn… hai ngàn… ba ngàn… khoan, để cụ đếm lại từ đầu.",
        me: "Dạ cụ cứ thong thả, tiền lẻ là thứ tiệm thiếu nhất.",
        choices: [
          { id: "count", label: "Đếm cùng cụ", hint: "Không tốn gì · hàng chờ mất 8 giây, +2 danh tiếng, cụ lì xì 1k xu",
            say: "Nhận tiền bằng 14 tờ và một đồng xu. Quỹ tiền lẻ chưa bao giờ giàu vậy.",
            fx: { patience: -8000, rep: 2, money: 1 } },
          { id: "trust", label: "Tin cụ, nhận luôn", hint: "Không tốn gì · hên xui 80% đủ, không thì thiếu 2k (cụ mai bù)",
            say: "Cụ đưa bao nhiêu con nhận bấy nhiêu. Cụ đếm từ hồi con chưa sinh mà.",
            roll: { p: 0.8,
              win: { say: "Đếm lại sau ca: đủ từng đồng. Cụ Năm chưa bao giờ sai, chỉ chậm.", fx: { xp: 2 } },
              lose: { say: "Thiếu đúng hai ngàn. Cụ quay lại dặn 'mai cụ đem qua', giọng như ký hợp đồng.", fx: { money: -2, debt: { name: "Cụ Năm", k: 2 } } } } },
          { id: "helper", label: "Nhờ khách sau đếm giùm", hint: "Không tốn gì · hên xui 50% khách vui vẻ (+2 danh tiếng), không thì khách kêu trễ giờ",
            say: "Anh ơi đếm giùm cụ với, tiệm mình làm việc theo nhóm.",
            roll: { p: 0.5,
              win: { say: "Khách sau đếm giùm, cụ cho viên kẹo. Hai người thành bạn đếm tiền.", fx: { rep: 2 } },
              lose: { say: "Khách sau thở dài: 'Em trễ giờ làm rồi anh ơi.' Cả hàng cùng nhìn đồng hồ.", fx: { patience: -10000, rep: -1 } } } },
        ],
      },
    },
  },

  // ===== K13 · Chị Hạnh shipper bảy đơn =====
  {
    id: "K13", group: "khach", tone: "mixed", when: "shift", priority: 1, cooldown: 4,
    if: { minDay: 5, queueFree: true }, npc: "chi-hanh",
    nodes: {
      start: {
        mood: "annoyed",
        line: "{Call} ơi! Bảy đơn, hai mươi ổ, {self} ghi tay trong điện thoại, năm phút nữa app phạt {self}!",
        me: "Hai mươi ổ… để anh xắn tay áo, xắn luôn cả tay kia.",
        choices: [
          { id: "all", label: "Nhận, đọc từng đơn", hint: "Đơn 20 ổ tới ngay · giao từ 3 sao thì chị dẫn bạn tới",
            say: "Hai mươi ổ, bảy khách, một shipper và một danh sách viết bằng ngón cái.",
            fx: { group: { n: 20, recipe: "pate-bo", arch: "shipper", name: "Chị Hạnh (7 đơn)", line: "Đơn một không hành, đơn hai ít ớt, đơn ba… để em lướt lên.",
              flagOk: "k13-ok", laterOk: { id: "K14", days: 2 }, okStars: 3 } },
            goto: "doi" },
          { id: "three", label: "Nhận 3 đơn trước", hint: "Đơn 8 ổ tới ngay, 12 ổ còn lại đặt trước trong ca",
            say: "Ba đơn trước, bốn đơn sau. App phạt thì phạt từ từ thôi.",
            fx: { group: { n: 8, recipe: "pate-bo", arch: "shipper", name: "Chị Hạnh (3 đơn đầu)" },
              preorder: { n: 12, recipe: "pate-bo", name: "Chị Hạnh (4 đơn sau)", arch: "shipper", when: "now", dueMs: 60000, label: "4 đơn shipper", flagOk: "k13-ok", laterOk: { id: "K14", days: 2 }, okStars: 3 } },
            goto: "doi" },
        ],
      },
      doi: {
        mood: "surprised",
        line: "Đơn số bốn khách huỷ… à không, khách đổi sang không hành! {Call} sửa kịp không?",
        choices: [
          { id: "fix", label: "Sửa ngay ổ đang ráp", hint: "Hao 1 phần rau hành · ổ số bốn đúng ý",
            say: "Gỡ hành ra khỏi ổ số bốn bằng sự tỉ mỉ của người gỡ bom.",
            fx: { stock: { rau: -1 }, rep: 1 } },
          { id: "note", label: "Ghi chú, sửa ổ sau", hint: "Không tốn gì · hên xui 70% nhớ kịp, không thì một khách nhận ổ có hành",
            say: "Dán giấy 'SỐ 4 KHÔNG HÀNH' lên thớt, lên lò, lên trán.",
            roll: { p: 0.7,
              win: { say: "Ổ số bốn ra lò không một cọng hành. Tờ giấy dán trán đã làm tròn nhiệm vụ.", fx: { xp: 3 } },
              lose: { say: "Ổ số bốn có hành, ổ số năm thì không. Hai khách đổi ổ cho nhau giữa đường.", fx: { rep: -1, review: { stars: 2, line: "Đặt không hành mà ổ xanh như vườn rau. Shipper dễ thương nên tha.", name: "Khách đơn số 4" } } } } },
        ],
      },
    },
  },

  // ===== K14 · Cả nhóm shipper =====
  {
    id: "K14", group: "khach", tone: "good", when: "shift", priority: 2, cooldown: 4, once: true,
    if: { chain: true }, npc: "chi-hanh",
    nodes: {
      start: {
        mood: "happy",
        line: "{Self} giới thiệu cả nhóm nè {call}! Bốn đứa, đứa nào cũng đói, đứa nào cũng gấp.",
        me: "Tiệm vừa thành trạm dừng chân chính thức của ngành giao hàng.",
        choices: [
          { id: "all4", label: "Nhận cả bốn cùng lúc", hint: "Đơn 12 ổ tới ngay · 3 ngày tới mỗi ca +2 shipper ghé",
            say: "Được cả nhóm shipper đặt tên tiệm là 'trạm tiếp tế'.",
            fx: { group: { n: 12, recipe: "pate-bo", arch: "shipper", name: "Nhóm chị Hạnh", tip: 8, flagOk: "tram-tiep-te", okStars: 3 },
              mod: { id: "tram-tiep-te", days: 3, guests: { shipper: 2 } } } },
          { id: "oneByOne", label: "Nhận lần lượt từng người", hint: "Đơn 12 ổ tới ngay · khách chờ mất 7 giây",
            say: "Từng người một nha mấy em. Bánh mì không chạy được, nhưng chủ tiệm thì đang chạy.",
            fx: { group: { n: 12, recipe: "pate-bo", arch: "shipper", name: "Nhóm chị Hạnh" }, patience: -7000 } },
          { id: "preorder", label: "Mời đặt trước qua tin nhắn", hint: "Không tốn gì · đơn đặt trước 8 ổ sáng mai",
            say: "Nhắn tin đặt trước, sáng mai tới là có. Nhóm shipper lần đầu được người khác giao hàng.",
            fx: { preorder: { n: 8, recipe: "pate-bo", name: "Nhóm chị Hạnh", arch: "shipper", when: "next", dueMs: 30000, label: "Nhóm shipper" } } },
        ],
      },
    },
  },

  // ===== K15 · Hai khách giành ổ giòn cuối =====
  {
    id: "K15", group: "khach", tone: "mixed", when: "shift", priority: 1, cooldown: 3,
    if: { caseCrispOne: true }, who: "waiting",
    nodes: {
      start: {
        mood: "annoyed",
        line: "Ổ đó của {self}! — Anh tới trước mà!",
        me: "Hai người, một ổ, một chủ tiệm cầm dao. Bình tĩnh.",
        choices: [
          { id: "first", label: "Ổ giòn cho người tới trước", hint: "Không tốn gì · hàng chờ mất 4 giây, nướng lại ổ khác cho người sau",
            say: "Ai tới trước ăn ổ giòn trước. Người sau được ổ nướng lại, giòn không kém, chỉ trễ hơn.",
            fx: { patience: -4000 } },
          { id: "split", label: "Bẻ đôi chia mỗi người nửa", hint: "Không tốn gì · hên xui 50% cả hai cười (+2 danh tiếng), không thì một review 3 sao",
            say: "Hai người giành một ổ bánh. Tiệm giải quyết bằng một con dao và sự công bằng.",
            sayBy: {
              hien: "Dạ cho em chia đôi nha, mỗi người nửa ổ giòn với nửa ổ thường, em xin lỗi cả hai.",
              cucsuc: "Chia đôi. Mỗi người một nửa. Không ai thắng, cũng không ai thua.",
              lay: "Phán quyết của tòa án bánh mì: chia đôi. Bên nào không phục được kháng cáo bằng ổ thứ hai.",
              sale: "Chia đôi nha! Mà ai thích giòn thì mua thêm nửa ổ, em tính rẻ cho.",
            },
            roll: { p: 0.5,
              win: { say: "Hai người cầm hai nửa ổ, cụng như cụng ly. Hàng chờ vỗ tay.", fx: { rep: 2 } },
              lose: { say: "Cả hai nhìn nửa ổ của mình rồi nhìn nửa ổ người kia. Không ai vui, nhưng cũng không ai thắng.", fx: { review: { stars: 3, line: "Nửa ổ giòn, nửa ổ… suy nghĩ. Công bằng mà không no." } } } } },
          { id: "newBatch", label: "Nướng mẻ mới, mời cả hai chờ", hint: "Không tốn gì · mọi khách chờ mất 15 giây",
            say: "Không ai lấy ổ này hết. Mẻ mới ra là mỗi người một ổ giòn nguyên con.",
            fx: { patience: -15000 } },
        ],
      },
    },
  },

  // ===== K16 · Đổi ý giữa chừng sang ổ chay =====
  {
    id: "K16", group: "khach", tone: "mixed", when: "shift", priority: 1, cooldown: 3,
    if: { minLevel: 6, boardStep: "spread", archWaiting: "office" }, who: { arch: "office" },
    nodes: {
      start: {
        mood: "surprised",
        line: "À… {self} đổi ý, cho {self} ổ chay nha {call}.",
        me: "(Nhìn xuống con dao còn dính pate.) Dạ… ổ chay hả {call}?",
        choices: [
          { id: "remake", label: "Làm lại ổ chay", hint: "Hao 1 phôi + 1 phần pate · khách 5 sao",
            say: "Đổi ý giữa chừng: ổ pate thành ổ chay, nửa hũ pate thành bài học.",
            fx: { stock: { phoi: -1, pate: -1 }, rep: 1, review: { stars: 5, line: "Đổi ý giữa chừng mà tiệm làm lại liền, không nhăn mặt. Ổ chay ngon." } } },
          { id: "resell", label: "Bán ổ này giảm 5k cho khách sau", hint: "−5k · giữ ổ, khách hiện tại chờ thêm 8 giây",
            say: "Ổ pate lỡ tay này dành cho người may mắn tiếp theo, giảm năm ngàn.",
            fx: { money: -5, whoPatience: -8000 } },
          { id: "explain", label: "Giải thích đã phết pate", hint: "Không tốn gì · khách lấy ổ này, một review 3 sao",
            say: "Pate lên rồi, không xuống được nữa {call} ơi. Hẹn ổ chay ngày mai.",
            fx: { review: { stars: 3, line: "Thôi mai em chay." } } },
        ],
      },
    },
  },
];
