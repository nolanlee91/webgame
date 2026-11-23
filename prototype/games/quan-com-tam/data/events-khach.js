// Sự kiện Khách K01–K14 (docs/quan-com-tam/DRAMA.md §2.1). Cấu trúc + khoá hợp lệ: xem chú thích đầu data/events.js.
// Ca tối 17:30–23:00: phase "som" (tối sớm) · "cao" (cao điểm) · "khuya". Ca trưa: phase "trua".
// Nhân vật, quán, công ty đều hư cấu. Không thương hiệu thật, không người thật, không emoji.

export const EVENTS_KHACH = [
  // ===== K01 · Chú Tư dẫn bốn thợ =====
  {
    id: "K01", group: "khach", tone: "good", when: "shift", priority: 2, cooldown: 4,
    if: { minDay: 3, kind: "toi", phase: "khuya", freeSeats: 2 }, npc: "chu-tu",
    moment: "Bốn thợ, bốn kiểu, một thằng Lực ăn ba vá cơm.",
    nodes: {
      start: {
        mood: "happy",
        line: "Bốn dĩa! Thằng Tèo không bì, thằng Lực thêm cơm, thằng Bin trứng lòng đào, còn tao đặc biệt, cháy cạnh! Nghe rõ chưa {call}?",
        me: "Dạ rõ… cho con hai giây để cái đầu con kịp xếp hàng.",
        choices: [
          { id: "all", label: "Nhận cả bàn", hint: "Bàn 4 thợ tới ngay, chờ lâu gấp rưỡi · đúng hết +15k tip, mai chú quay lại bàn chuyện lớn",
            say: "Bốn dĩa thì bốn dĩa. Than đỏ rồi, tay cũng đỏ rồi.",
            fx: { group: { roles: ["worker", "worker2", "worker2", "worker"], patienceMul: 1.5, tip: 15, label: "Bàn Chú Tư", okStars: 3, flagOk: "k01-ok", laterOk: { id: "K02", days: 1 } } },
            goto: "luc" },
          { id: "two", label: "Nhận, xin làm hai dĩa trước", hint: "Hai thợ ngồi trước, hai thợ tới sau 20 giây · đỡ rối tay",
            say: "Hai dĩa trước cho đội tiên phong, hai dĩa sau cho đội… còn đang rửa tay.",
            fx: { group: { roles: ["worker", "worker2"], patienceMul: 1.4, label: "Bàn Chú Tư (đợt 1)" }, arch: { arch: "worker2", n: 1 } },
            goto: "luc" },
          { id: "share", label: "Mời ghép bàn với khách khác", hint: "Không tốn gì · hên xui 50% vui vẻ (+1 danh tiếng), 50% chú cằn nhằn",
            say: "Quán nhỏ, bàn chung, lòng rộng. Mời chú ngồi ghép cho ấm.",
            roll: { p: 0.5,
              win: { say: "Chú Tư ngồi ghép, năm phút sau đã rủ bàn bên đi làm công trình chung.", fx: { rep: 1, group: { roles: ["worker", "worker2"], patienceMul: 1.3, label: "Bàn Chú Tư" } } },
              lose: { say: "Chú Tư ngồi ghép, cằn nhằn ghế thấp, bàn chật, rồi vẫn gọi đủ bốn dĩa.", fx: { patience: -4000, group: { roles: ["worker", "worker2"], patienceMul: 1, label: "Bàn Chú Tư" } } } } },
        ],
      },
      luc: {
        mood: "surprised",
        line: "Ê {call}! Thằng Lực đòi thêm cơm lần hai, nó nói hôm nay trộn hồ ba tầng!",
        me: "Lần hai… nồi cơm của con đang nhìn con bằng ánh mắt lo lắng.",
        choices: [
          { id: "free", label: "Thêm miễn phí", hint: "−1 phần cơm trong nồi · +2 danh tiếng, ca sau thêm 1 thợ ghé",
            say: "Cơm thêm quán mời. Trộn hồ ba tầng thì phải ăn ba vá.", fx: { rice: -1, rep: 2, nextGuests: 1 } },
          { id: "charge", label: "Tính 4k như thường", hint: "Không tốn gì · không có gì thêm",
            say: "Vá thứ hai bốn ngàn nha chú, giá tình thương công trình.", fx: { xp: 2 } },
        ],
      },
    },
  },

  // ===== K02 · Hợp đồng đội công trình =====
  {
    id: "K02", group: "khach", tone: "good", when: "day", priority: 2, once: true,
    if: { chain: true }, npc: "chu-tu",
    moment: "Có hợp đồng đầu tiên. Ký bằng một cái bắt tay dính mỡ hành.",
    nodes: {
      start: {
        mood: "happy",
        line: "Đội chú làm ca đêm ba tháng bên công trình đầu hẻm. Tối thứ Hai, Tư, Sáu {call} làm mười hai dĩa cho tụi nó được không?",
        me: "Ba tháng… tức là con phải ướp sườn trước cả khi đồng hồ báo thức kịp kêu.",
        choices: [
          { id: "discount", label: "Nhận, giảm 10%", hint: "9 ngày tới mỗi ca thêm 2 nhóm thợ ghé · lãi mỏng hơn chút",
            say: "Có hợp đồng đầu tiên. Ký bằng một cái bắt tay dính mỡ hành.",
            fx: { mod: { id: "hd-chu-tu", days: 9, guests: { worker: 2 } }, flag: "k02-hd", flagDays: 9, rep: 1 }, goto: "giao" },
          { id: "full", label: "Nhận, giữ giá gốc", hint: "Hên xui 50% · chú ký 9 ngày, không thì thử 3 ngày",
            say: "Giá gốc, sườn gốc, tay nghề cũng gốc luôn chú.",
            roll: { p: 0.5,
              win: { say: "Chú vỗ vai cái bốp: 'Giá đó đáng!' Vai còn in năm ngón tay.", fx: { mod: { id: "hd-chu-tu", days: 9, guests: { worker: 2 } }, flag: "k02-hd", flagDays: 9, money: 30 }, goto: "giao" },
              lose: { say: "Chú gãi đầu: 'Thôi thử một tuần coi tụi nó chịu không.' Quán bị thử việc ba ngày.", fx: { mod: { id: "hd-chu-tu", days: 3, guests: { worker: 2 } }, flag: "k02-hd", flagDays: 3 }, goto: "giao" } } },
          { id: "decline", label: "Từ chối khéo", hint: "Không tốn gì · +1 danh tiếng, chú vẫn ghé lẻ",
            say: "Con sợ hứa mà nướng không kịp. Chú cứ ghé, dĩa nào cũng như dĩa đầu.", fx: { rep: 1 } },
        ],
      },
      giao: {
        mood: "neutral",
        line: "À mà {call} giao tận công trình hay để tụi nó qua lấy? Tụi nó mà rời giàn giáo là hồ khô đó.",
        choices: [
          { id: "deliver", label: "Giao tận nơi", hint: "+5k phí giao mỗi đợt · 9 ngày tới khách chờ kém 5% vì cô chủ hay rời quán",
            say: "Giao cơm tận giàn giáo. Lần đầu dĩa cơm của quán lên tới tầng ba.", fx: { money: 15, mod: { id: "giao-cong-trinh", days: 9, patience: -5 } } },
          { id: "pickup", label: "Để thợ qua lấy", hint: "Không tốn gì · đơn tới quầy, không mất giờ",
            say: "Chú cử thằng Lực qua lấy. Thằng Lực tới sớm vì sợ hết cơm.", fx: { xp: 3 } },
        ],
      },
    },
  },

  // ===== K03 · Anh Sáu quên ví =====
  {
    id: "K03", group: "khach", tone: "mixed", when: "shift", cooldown: 4,
    if: { minDay: 3, kind: "toi", phase: ["cao", "khuya"], noFlags: ["ghiso-open", "k03-so"] }, npc: "anh-sau",
    moment: "Sổ nợ có dòng đầu tiên: Anh Sáu, 1 dĩa sườn, 'mai trả'.",
    nodes: {
      start: {
        mood: "surprised",
        line: "Ủa… quên ví ở nhà rồi {call} ơi. Ghi sổ nghen, mai anh trả.",
        me: "Mai của anh là mai thiệt, hay mai… kiểu xe ôm?",
        choices: [
          { id: "credit", label: "Ghi sổ", hint: "Mất giá dĩa hôm nay (ghi nợ 25k) · mở sổ nợ sớm cho riêng Anh Sáu",
            say: "Sổ nợ có dòng đầu tiên: Anh Sáu, 1 dĩa sườn, 'mai trả'.",
            fx: { debt: { who: "anh-sau", k: 25 }, flag: ["k03-so", "ghiso-early-anh-sau"], flagDays: 12 }, later: { id: "K04", days: 2 } },
          { id: "gift", label: "Cho luôn dĩa này", hint: "Không thu dĩa này · +2 danh tiếng, anh quảng cáo quán khắp bến (+1 khách ca sau)",
            say: "Dĩa này quán mời. Anh chở giùm tiếng thơm của quán một vòng bến là được.", fx: { rep: 2, nextGuests: 1 } },
          { id: "transfer", label: "Đề nghị chuyển khoản", hint: "Không tốn gì · hên xui 40% anh trả đủ, 60% anh dỗi (ca sau −1 khách)",
            say: "Anh chuyển khoản cũng được nè, quán có mã dán trên nồi cơm.",
            roll: { p: 0.4,
              win: { say: "Anh Sáu mở app, bấm chậm như đang lái xe qua ổ gà, nhưng trả đủ: 'Thấy chưa, anh cũng công nghệ.'", fx: { money: 25, xp: 2 } },
              lose: { say: "'Điện thoại anh đời cũ, chỉ nghe với gọi.' Anh Sáu đội nón đi, hơi dỗi.", fx: { nextGuests: -1 } } } },
        ],
      },
    },
  },

  // ===== K04 · Ghi sổ cả tháng =====
  {
    id: "K04", group: "khach", tone: "mixed", when: "day", priority: 2,
    if: { chain: true }, npc: "anh-sau",
    moment: "Ký hợp đồng ghi sổ một tháng. Bằng chứng: một cuốn tập học trò.",
    nodes: {
      start: {
        mood: "neutral",
        line: "Nợ cũ anh trả nè, hai lăm ngàn đủ. Mà {call} nè… tháng này cuốc ít, cho anh ghi sổ cả tháng, cuối tháng anh trả một cục.",
        me: "Một cục là cục gì anh? Cục tiền, hay cục… câu chuyện?",
        choices: [
          { id: "limit200", label: "Đồng ý, hạn mức 200k", hint: "Nhận lại 25k nợ cũ · mỗi tối anh ghi một dĩa, 7 ngày sau hẹn trả",
            say: "Hạn mức hai trăm. Anh ghi tới đâu, quán gạch tới đó.",
            fx: { money: 25, debt: { who: "anh-sau", k: 75, clear: false }, flag: "ghiso-thang", flagDays: 9 }, later: { id: "K05", days: 7 }, goto: "cho" },
          { id: "limit75", label: "Chỉ ghi tối đa 5 dĩa", hint: "Nhận lại 25k nợ cũ · hạn mức 75k, 7 ngày sau hẹn trả",
            say: "Năm dĩa thôi nha anh. Quá năm là quán phải ghi sổ lại chính mình.",
            fx: { money: 25, debt: { who: "anh-sau", k: 50 }, flag: "ghiso-thang", flagDays: 9 }, later: { id: "K05", days: 7 }, goto: "cho" },
          { id: "no", label: "Không ghi nữa", hint: "Nhận lại 25k nợ cũ · hên xui 50% anh hiểu (+1 danh tiếng), 50% anh ăn quán khác 3 ngày",
            say: "Quán nhỏ, sổ nhỏ, em không dám ghi dài. Anh thông cảm nha.",
            roll: { p: 0.5,
              win: { say: "Anh Sáu gật gù: 'Đúng, làm ăn phải rõ.' Rồi kể thêm mười phút về hồi anh mở tiệm sửa xe.", fx: { money: 25, rep: 1, debt: { who: "anh-sau", k: -25, clear: true } } },
              lose: { say: "Anh Sáu trả nợ xong, nói 'ờ' dài bằng cả con hẻm, ba ngày không thấy ghé.", fx: { money: 25, debt: { who: "anh-sau", k: -25, clear: true }, mod: { id: "sau-doi", days: 3, guests: -1 } } } } },
        ],
      },
      cho: {
        mood: "happy",
        line: "Vậy anh chở hàng gấp cho em miễn phí cả tháng, coi như lãi nghen. Hết than hết gạo cứ réo anh.",
        choices: [
          { id: "yes", label: "Nhận", hint: "Không tốn gì · 7 ngày tới chạy hàng gấp không mất phí chở",
            say: "Có xe ôm riêng, lương trả bằng dĩa cơm ghi sổ.", fx: { flag: "sau-cho-free", flagDays: 7, xp: 2 } },
          { id: "rest", label: "Thôi, anh giữ sức", hint: "Không tốn gì · +1 danh tiếng",
            say: "Anh chạy cuốc lo cho nhà trước. Hàng quán tự chở được mà.", fx: { rep: 1 } },
        ],
      },
    },
  },

  // ===== K05 · Anh Sáu trả nợ một tháng =====
  {
    id: "K05", group: "khach", tone: "good", when: "shift", priority: 2,
    if: { chain: true, kind: "toi" }, npc: "anh-sau",
    moment: "Anh Sáu trả nợ một tháng: một xấp tiền, một bó hoa giấy và chuyện năm 1999.",
    nodes: {
      start: {
        mood: "neutral",
        line: "Đứng trước quầy, tay sau lưng. Nợ đang có: {debt}k. 'Em ơi… hôm nay anh tới tính sổ nè.'",
        me: "Tay anh giấu cái gì sau lưng vậy, tiền hay tin xấu?",
        choices: [
          { id: "ask", label: "Hỏi thẳng", hint: "Không tốn gì · hên xui 60% anh trả đủ kèm bó hoa giấy, 40% xin trả nửa",
            say: "Anh tính sổ luôn nha, quán đang cần nhập than.",
            roll: { p: 0.6,
              win: { say: "Anh trả đủ, kèm bó hoa giấy 'của vợ anh gửi'. Bó hoa được cắm vô hũ đũa.", fx: { money: 100, debt: { who: "anh-sau", k: -999, clear: true }, decor: "hoa-giay", rep: 1 } },
              lose: { say: "'Trả nửa nghen em, nửa kia anh trả bằng… lời hứa.' Anh đưa một nửa xấp tiền.", fx: { money: 50, debt: { who: "anh-sau", k: -50 } }, goto: "rest" } } },
          { id: "treat", label: "Không hỏi, mời ăn", hint: "Không tốn gì · hên xui 50% anh tự trả đủ + giới thiệu cả bến (3 ngày thêm khách), 50% ăn thêm, ghi tiếp",
            say: "Anh ngồi ăn dĩa cơm đã, chuyện sổ sách để sau.",
            roll: { p: 0.5,
              win: { say: "Ăn xong, anh tự đặt xấp tiền lên quầy: 'Tử tế vậy ai nỡ nợ.' Hôm sau cả bến xe ôm kéo tới.", fx: { money: 100, debt: { who: "anh-sau", k: -999, clear: true }, mod: { id: "ben-xe-om", days: 3, guests: { driver: 1 } } } },
              lose: { say: "Anh ăn thêm một dĩa, cười hiền: 'Ghi luôn dĩa này nghen.' Sổ nợ dài thêm một dòng.", fx: { debt: { who: "anh-sau", k: 25 } }, goto: "rest" } } },
        ],
      },
      rest: {
        mood: "neutral",
        line: "Phần còn lại… em tính sao anh chịu vậy.",
        choices: [
          { id: "clear", label: "Xoá phần còn lại", hint: "Bỏ khoản nợ còn lại · +3 danh tiếng, Anh Sáu thành 'đại sứ quán' 7 ngày",
            say: "Xoá sổ. Từ nay anh là đại sứ của quán, lương trả bằng nụ cười.", fx: { debt: { who: "anh-sau", k: -999, clear: true }, rep: 3, mod: { id: "dai-su-sau", days: 7, guests: { regular: 1 } } } },
          { id: "next", label: "Ghi tiếp, hẹn tháng sau", hint: "Không tốn gì · 7 ngày sau anh quay lại tính sổ",
            say: "Ghi tiếp, tháng sau tính. Sổ nợ này chắc thành tiểu thuyết.", fx: { xp: 2 }, later: { id: "K05", days: 7 } },
        ],
      },
    },
  },

  // ===== K06 · Tèo và Mít đếm tiền lẻ =====
  {
    id: "K06", group: "khach", tone: "good", when: "shift", cooldown: 4,
    if: { minDay: 3, kind: "toi", phase: "som" }, npc: "teo",
    moment: "Hai sinh viên, năm chục ngàn, bốn vá cơm và rất nhiều lời cảm ơn.",
    nodes: {
      start: {
        mood: "neutral",
        line: "Chị ơi… tụi em có năm chục ngàn hai đứa, hai dĩa sườn với xin thêm cơm miễn phí được không chị?",
        me: "Năm chục ngàn, hai cái bụng sinh viên, và một nồi cơm đang thương người.",
        choices: [
          { id: "cheap", label: "Bán 2 dĩa giá 25k, cơm thêm miễn phí", hint: "−14k so với giá thường · +2 danh tiếng, mai tụi nhỏ báo tin vui",
            say: "Hai dĩa hai lăm, cơm thêm thoải mái. Học giỏi rồi quay lại ăn giá thường.", fx: { money: -14, rep: 2, group: { roles: ["student", "student2"], patienceMul: 1.4, label: "Tèo và Mít" } }, later: { id: "K07", days: 4 } },
          { id: "bicha", label: "Bán 2 dĩa bì chả + cơm thêm", hint: "Không tốn gì · đủ tiền, +1 danh tiếng",
            need: { minLevel: 4 },
            say: "Bì chả hai dĩa, cơm thêm đầy, vừa túi tiền vừa đầy bụng.", fx: { rep: 1, group: { roles: ["student", "student2"], patienceMul: 1.3, label: "Tèo và Mít" } }, later: { id: "K07", days: 4 } },
          { id: "no", label: "Nói khéo là không được", hint: "Không tốn gì · hên xui 50% tụi nhỏ mua 1 dĩa chia đôi, 50% đi",
            say: "Giá quán in trên bảng rồi em ơi, chị khó bớt lắm.",
            roll: { p: 0.5,
              win: { say: "Hai đứa mua một dĩa, chia đôi bằng thước kẻ. Chính xác tới từng hạt cơm.", fx: { group: { roles: ["student"], patienceMul: 1.2, label: "Tèo" } } },
              lose: { say: "Hai đứa cảm ơn rồi đi, quay đầu nhìn vỉ sườn ba lần.", fx: { xp: 1 } } } },
        ],
      },
    },
  },

  // ===== K07 · Lớp liên hoan 20 hộp =====
  {
    id: "K07", group: "khach", tone: "good", when: "day", priority: 2,
    if: { chain: true }, npc: "teo",
    moment: "Lớp liên hoan bằng hai mươi hộp cơm của quán. Có ba hộp chay, dán nhãn đỏ.",
    nodes: {
      start: {
        mood: "happy",
        line: "Chị ơi lớp em liên hoan cuối kỳ, đặt hai mươi hộp tối nay, tụi em góp tiền đủ rồi!",
        me: "Hai mươi hộp… lớp em học ngành gì mà ăn khoẻ vậy?",
        choices: [
          { id: "suon", label: "Nhận 20 hộp sườn", hint: "Cọc 30% (+150k) · tối nay lớp tới thành nhiều bàn",
            say: "Hai mươi hộp sườn, cọc trước, tối nay than đỏ sớm.", fx: { money: 150, preorder: { id: "K07", n: 20, arch: "student", days: 0, label: "Lớp liên hoan", okStars: 3 } }, goto: "note" },
          { id: "bicha", label: "Nhận 20 hộp bì chả", hint: "Cọc 30% (+90k) · rẻ, không cần bếp nhiều",
            say: "Bì chả hai mươi hộp, nhẹ bếp, nặng túi đồ chua.", fx: { money: 90, preorder: { id: "K07", n: 20, arch: "student", days: 0, label: "Lớp liên hoan", okStars: 3 } }, goto: "note" },
          { id: "no", label: "Từ chối", hint: "Không tốn gì · không có gì thêm",
            say: "Tối nay quán kín người rồi em ơi. Lần sau đặt sớm, chị nhận liền.", fx: { xp: 1 } },
        ],
      },
      note: {
        mood: "surprised",
        line: "À chị ơi, lớp em có ba bạn ăn chay, một bạn không ăn được mỡ hành nha.",
        choices: [
          { id: "label", label: "Ghi nhãn từng hộp", hint: "Không tốn gì · +1 danh tiếng, không ai ăn nhầm",
            say: "Hộp chay dán nhãn đỏ, hộp không mỡ hành dán nhãn xanh. Bảng màu như cầu vồng.", fx: { rep: 1, xp: 3 } },
          { id: "allveg", label: "Đề nghị làm chay hết cho dễ", hint: "Không tốn gì · hên xui 40% lớp đồng ý, 60% 'không được chị ơi'",
            say: "Hay cả lớp ăn chay một bữa cho đồng lòng?",
            roll: { p: 0.4,
              win: { say: "Lớp biểu quyết, đồng ý. Liên hoan chay, ai cũng thấy mình tốt bụng hơn.", fx: { rep: 1 } },
              lose: { say: "'Không được chị ơi, lớp trưởng ăn sườn mới có sức điểm danh.' Vẫn dán nhãn từng hộp.", fx: { xp: 2 } } } },
        ],
      },
    },
  },

  // ===== K08 · Sáu hộp cho khoa cấp cứu =====
  {
    id: "K08", group: "khach", tone: "mixed", when: "shift",
    if: { minLevel: 4, kind: "toi", phase: "khuya" }, npc: "dd-hanh",
    moment: "Sáu hộp trứng lòng đào cho khoa cấp cứu. Không ai cấp cứu vì trứng.",
    nodes: {
      start: {
        mood: "surprised",
        line: "Cho em sáu hộp mang vô khoa, trứng lòng đào hết nha chị, hai mươi phút nữa em vô ca!",
        me: "Sáu trứng lòng đào trong hai mươi phút. Cái chảo nghe xong muốn xin nghỉ phép.",
        choices: [
          { id: "rush", label: "Nhận, ưu tiên", hint: "Đơn 6 hộp tới ngay, chờ ngắn · đúng hết +10k tip, +1 danh tiếng",
            say: "Ưu tiên khoa cấp cứu. Ai cứu người thì quán cứu bụng.", fx: { rep: 1, group: { roles: ["nurse", "nurse"], patienceMul: 1.1, tip: 10, label: "Đơn khoa cấp cứu", okStars: 4 } }, goto: "sauce" },
          { id: "hard", label: "Nhận, làm trứng chín kỹ cho nhanh", hint: "Không tốn gì · hên xui 60% 'thôi cũng được chị', 40% bớt danh tiếng",
            say: "Trứng chín kỹ cho nhanh nha em, lòng đào thì để lần sau.",
            roll: { p: 0.6,
              win: { say: "'Thôi cũng được chị, miễn nóng.' Hạnh ôm sáu hộp chạy như đang trực.", fx: { group: { roles: ["nurse"], patienceMul: 1.2, label: "Đơn khoa cấp cứu" } } },
              lose: { say: "Sáu hộp tới khoa, sáu người mở ra thấy trứng chín kỹ. Trên nhóm chat khoa có sáu cái mặt buồn.", fx: { rep: -1 } } } },
          { id: "later", label: "Hẹn 30 phút", hint: "Không tốn gì · Hạnh đi, chút nữa quay lại",
            say: "Ba chục phút nữa em ghé, chị làm chậm mà chắc.", fx: { arch: { arch: "nurse", n: 1 } } },
        ],
      },
      sauce: {
        mood: "neutral",
        line: "À chị ơi, nước mắm để riêng bịch giùm em nha, đi xe máy vô khoa mà chan sẵn là thành canh luôn.",
        choices: [
          { id: "bag", label: "Bịch riêng từng hộp, ghi tên", hint: "Không tốn gì · +1 danh tiếng với khoa",
            say: "Sáu bịch nước mắm, sáu cái tên viết bằng bút lông. Cả khoa khen quán chu đáo.", fx: { rep: 1 } },
          { id: "jar", label: "Đưa nguyên hũ nhỏ cho cả khoa", hint: "−3 phần nước mắm · khoa dùng chung, vui",
            say: "Đưa nguyên hũ nhỏ nước mắm, cả khoa chấm chung như đi picnic.", fx: { stock: { "nuoc-mam": -3 }, rep: 1 } },
        ],
      },
    },
  },

  // ===== K09 · Anh Hùng Bass và loa kéo =====
  {
    id: "K09", group: "khach", tone: "mixed", when: "shift", cooldown: 4,
    if: { minDay: 5, kind: "toi", phase: "khuya" }, npc: "anh-hung",
    moment: "Có buổi hoà nhạc miễn phí lúc 22 giờ. Ca sĩ hát sai lời, khán giả ăn đúng món.",
    nodes: {
      start: {
        mood: "happy",
        line: "Bài này tặng chủ quán! 'Đêm nay… em có về…' Bàn bên kia nhăn mặt, cái loa kéo thì không biết ngại là gì.",
        me: "Anh ơi… đêm nay em có về, nhưng khách bàn bên thì muốn về sớm.",
        choices: [
          { id: "lower", label: "Nhờ anh vặn nhỏ", hint: "Không tốn gì · hên xui 60% anh vặn nhỏ, tặng quán 20k xin lỗi; 40% hát nhỏ hơn… một chút",
            say: "Anh hát hay lắm, mà cho em xin nhỏ một nấc, bàn bên đang ăn canh.",
            roll: { p: 0.6,
              win: { say: "Anh Hùng vặn nhỏ, đặt 20k lên bàn: 'Xin lỗi cả quán, bài sau anh hát thầm.'", fx: { money: 20, flag: "k09-hung" }, later: { id: "K10", days: 2 } },
              lose: { say: "Anh vặn nhỏ đúng một nấc, rồi hát to thêm hai nấc cho bù.", fx: { patience: -3000, flag: "k09-lan" }, later: { id: "K10", days: 2 } } } },
          { id: "sing", label: "Kệ, hát chung", hint: "Không tốn gì · quán hot lên, khách trẻ vui, khách văn phòng bớt kiên nhẫn",
            say: "Cô chủ cầm vá cơm làm micro, hát luôn điệp khúc. Sai lời đồng đều với anh Hùng.", fx: { hype: 1, patience: -2000, flag: "k09-lan" }, later: { id: "K10", days: 2 } },
          { id: "last", label: "Mời anh hát bài cuối rồi tính tiền", hint: "Chuyện còn tiếp…",
            say: "Bài cuối nha anh, quán còn phải nghe tiếng sườn xèo.", goto: "song" },
        ],
      },
      song: {
        mood: "happy",
        line: "Hát bài cuối nha, bài này dài tám phút, có đoạn rap!",
        choices: [
          { id: "tea", label: "Đồng ý, tặng cả bàn trà tắc", hint: "−4k · +2 danh tiếng, bàn trả thêm 30k",
            say: "Tám phút có trà tắc thì tám phút cũng thành ngắn.", fx: { money: 26, rep: 2, flag: "k09-hung" }, later: { id: "K10", days: 2 } },
          { id: "short", label: "Xin rút gọn còn điệp khúc", hint: "Không tốn gì · hên xui 50% cả quán vỗ tay (+1 danh tiếng), 50% anh dỗi về sớm",
            say: "Mình hát điệp khúc thôi anh, điệp khúc là phần hay nhất.",
            roll: { p: 0.5,
              win: { say: "Điệp khúc vang lên, cả quán vỗ tay theo nhịp vá cơm gõ nồi.", fx: { rep: 1, flag: "k09-hung" }, later: { id: "K10", days: 2 } },
              lose: { say: "Anh Hùng dỗi, kéo loa về sớm, vừa đi vừa hát nốt đoạn rap cho cả hẻm nghe.", fx: { flag: "k09-lan" }, later: { id: "K10", days: 2 } } } },
        ],
      },
    },
  },

  // ===== K10 · Sau đêm hoà nhạc =====
  {
    id: "K10", group: "khach", tone: "good", when: "day",
    if: { chain: true }, npc: "anh-hung",
    moment: "Anh Hùng đặt sinh nhật không loa. Cả bàn hát chay, vẫn sai lời.",
    nodes: {
      start: {
        mood: "happy",
        line: "Hôm bữa anh hơi quá. Tuần sau sinh nhật anh, đặt tám dĩa đặc biệt, hứa không mang loa!",
        alt: [{ flags: ["k09-lan"], line: "Cô Lan tiệm may ló đầu qua trước: 'Tối bữa ồn quá con ơi.' Anh Hùng đứng sau gãi đầu: 'Anh xin lỗi… sinh nhật anh đặt tám dĩa, không loa, hứa danh dự.'", mood: "neutral" }],
        me: "Sinh nhật không loa… lần đầu anh Hùng tổ chức tiệc ở chế độ im lặng.",
        choices: [
          { id: "party", label: "Nhận tiệc 8 dĩa", hint: "Cọc +60k · tối nay hai bàn khách của anh Hùng",
            say: "Tám dĩa đặc biệt, hai bàn ghép, một ổ bánh kem tự mang.", fx: { money: 60, preorder: { id: "K10", n: 8, arch: "worker", days: 0, label: "Sinh nhật anh Hùng", okStars: 3 } } },
          { id: "cake", label: "Nhận, tặng bánh kem nhỏ", hint: "−20k · +3 danh tiếng, hên xui 50% cả nhóm thành khách quen",
            say: "Bánh kem nhỏ quán tặng, nến cắm hình cái loa.", fx: { money: -20, rep: 3, preorder: { id: "K10", n: 8, arch: "worker", days: 0, label: "Sinh nhật anh Hùng", okStars: 3 } },
            roll: { p: 0.5,
              win: { say: "Cả nhóm thổi nến, hứa thứ Bảy nào cũng ghé. Không mang loa, mang giọng.", fx: { mod: { id: "nhom-hung", days: 7, guests: { worker: 1 } } } },
              lose: { say: "Cả nhóm cảm động, hát chúc mừng sinh nhật ba lần, sai lời cả ba.", fx: { xp: 2 } } } },
          { id: "quiet", label: "Hứa giờ yên lặng sau 22:30", hint: "Không tốn gì · +2 danh tiếng với hẻm, khuya bớt 1 khách",
            say: "Từ nay sau mười giờ rưỡi quán chỉ có tiếng sườn xèo.", fx: { rep: 2, nextGuests: -1 } },
        ],
      },
    },
  },

  // ===== K11 · Lucas hỏi "broken rice" =====
  {
    id: "K11", group: "khach", tone: "good", when: "shift", cooldown: 3,
    if: { minLevel: 8 }, npc: "lucas",
    moment: "Giải thích 'cơm tấm' cho người nước ngoài: gạo bể nhưng lòng không bể.",
    nodes: {
      start: {
        mood: "surprised",
        line: "Excuse me… broken rice? Why broken? Is it… okay?",
        me: "Okay lắm anh ơi. Gạo bể, nhưng ngon nguyên vẹn.",
        choices: [
          { id: "draw", label: "Giải thích bằng tay, vẽ hạt gạo lên giấy", hint: "Không tốn gì · hên xui 60% Lucas gọi dĩa đặc biệt + tip 15k, 40% gọi cơm sườn và chụp 30 tấm",
            say: "Cô chủ vẽ hạt gạo, vẽ cái chày, vẽ luôn cái mặt vui của người ăn.",
            roll: { p: 0.6,
              win: { say: "Lucas gật gù, gọi dĩa đặc biệt, để lại 15k: 'Broken rice, perfect heart.'", fx: { money: 15, rep: 1, group: { roles: ["tourist"], patienceMul: 1.4, label: "Lucas" } } },
              lose: { say: "Lucas gọi cơm sườn, chụp ba mươi tấm, tấm nào cũng có ngón tay cái.", fx: { followers: 10, group: { roles: ["tourist"], patienceMul: 1.4, label: "Lucas" } } } } },
          { id: "board", label: "Đưa bảng hình", hint: "Không tốn gì · Lucas chọn đúng món, mọi khách chờ thêm 10 giây",
            say: "Bảng hình đây anh, chỉ món nào quán làm món đó.", fx: { patience: 10000, group: { roles: ["tourist"], patienceMul: 1.5, label: "Lucas" } } },
          { id: "bong", label: "Gọi Bông ra nói tiếng Anh", hint: "Không tốn gì · hên xui 50% Bông nói trôi chảy (+1 danh tiếng), 50% 'yes yes' cả buổi",
            need: { flags: ["helper-bong"] },
            say: "Bông ơi, ra phiên dịch giùm chị!",
            roll: { p: 0.5,
              win: { say: "Bông nói một tràng trôi chảy, Lucas vỗ tay. Bông đỏ mặt, bưng luôn bốn dĩa.", fx: { rep: 1, group: { roles: ["tourist"], patienceMul: 1.4, label: "Lucas" } } },
              lose: { say: "Bông nói 'yes yes' mười lần, Lucas cũng 'yes yes' lại. Hai bên hiểu nhau bằng nụ cười.", fx: { xp: 3, group: { roles: ["tourist"], patienceMul: 1.4, label: "Lucas" } } } } },
        ],
      },
    },
  },

  // ===== K12 · Hai nhóm giành một bàn =====
  {
    id: "K12", group: "khach", tone: "mixed", when: "shift",
    if: { phase: "cao", waitingMin: 2, freeSeats: 2 }, who: "waiting",
    moment: "Hai nhóm giành một cái bàn. Quán giải quyết bằng sự công bằng và một bình trà đá.",
    nodes: {
      start: {
        mood: "annoyed",
        line: "Bàn đó tụi {self} thấy trước mà {call}! — Ủa, tụi em đứng đây nãy giờ mà!",
        me: "Một cái bàn, hai nhóm khách, và một cô chủ đang ước bàn biết tự nhân đôi.",
        choices: [
          { id: "fair", label: "Bàn cho nhóm đông, mời nhóm nhỏ chờ bàn sắp xong", hint: "Không tốn gì · khách chờ bớt kiên nhẫn 10 giây",
            say: "Bàn rộng cho nhóm đông, bàn nhỏ sắp dọn xong cho nhóm nhỏ. Ai cũng có ghế.", fx: { patience: -10000, xp: 2 }, goto: "after" },
          { id: "first", label: "Ai tới trước ngồi trước", hint: "Không tốn gì · hên xui 50% nhóm kia vui vẻ chờ, 50% bỏ đi",
            say: "Quán tính theo giờ tới, đồng hồ trên tường làm chứng.",
            roll: { p: 0.5,
              win: { say: "Nhóm kia gật đầu, đứng chờ, còn khen quán công bằng.", fx: { rep: 1 } },
              lose: { say: "Nhóm kia lắc đầu, qua quán bên. Bàn thì được, khách thì mất.", fx: { guests: -1, rep: -1 } } }, goto: "after" },
          { id: "together", label: "Mời hai nhóm ngồi chung", hint: "Không tốn gì · hên xui 40% thành bạn (+2 danh tiếng), 60% ngại ngùng",
            say: "Hay ngồi chung luôn, quán tặng bình trà đá làm quen.",
            roll: { p: 0.4,
              win: { say: "Hai nhóm ngồi chung, mười phút sau đã kết bạn, hẹn tuần sau đi ăn tiếp.", fx: { rep: 2, teaAll: true } },
              lose: { say: "Hai nhóm ngồi chung, ăn trong im lặng, chỉ nghe tiếng muỗng chạm dĩa.", fx: { patience: -3000 } } } },
        ],
      },
      after: {
        mood: "neutral",
        line: "Hai nhóm đã yên chỗ, nhưng nhóm đứng chờ vẫn liếc qua bàn kia, bụng kêu rõ to.",
        choices: [
          { id: "tea", label: "Châm trà cho nhóm đang chờ", hint: "Không tốn gì · khách chờ thêm 6 giây",
            say: "Mang ly trà đá ra cho nhóm đang chờ. Bụng vẫn đói, nhưng lòng đã nguội.", fx: { patience: 6000 } },
          { id: "joke", label: "Hứa nhóm chờ miếng sườn cháy cạnh đẹp nhất", hint: "Không tốn gì · +1 XP",
            say: "Chờ chút thôi, miếng đẹp nhất vỉ để dành cho người kiên nhẫn.", fx: { xp: 1 } },
        ],
      },
    },
  },

  // ===== K13 · Khách văn phòng có 12 phút =====
  {
    id: "K13", group: "khach", tone: "mixed", when: "shift",
    if: { kind: "trua", archPresent: "office" }, who: { arch: "office" },
    moment: "Một dĩa cơm trong 11 phút 40 giây. Kịp họp. Không kịp thở.",
    nodes: {
      start: {
        mood: "surprised",
        line: "Chị ơi, {self} có mười hai phút, họp lúc mười hai giờ rưỡi, làm gì nhanh nhất chị?",
        me: "Mười hai phút… vừa đủ để miếng sườn kịp ngại vì bị hối.",
        choices: [
          { id: "warm", label: "Bán sườn đang giữ ấm, bưng trước", hint: "Không tốn gì · bàn này chờ thêm 15 giây",
            say: "Sườn giữ ấm sẵn, bưng liền, em ăn kịp còn dư một phút uống trà.", fx: { whoPatience: 15000, xp: 2 } },
          { id: "bicha", label: "Gợi ý cơm bì chả", hint: "Không tốn gì · không cần bếp, nhanh, mọi khách chờ thêm 5 giây",
            say: "Bì chả không cần nướng, ba mươi giây có dĩa.", fx: { patience: 5000, xp: 1 } },
          { id: "box", label: "Gói mang lên văn phòng", hint: "Không tốn gì · hên xui 70% khách đồng ý, 30% 'em không ăn ở bàn làm việc được'",
            say: "Chị gói hộp, em ăn trong lúc họp đọc slide.",
            roll: { p: 0.7,
              win: { say: "Khách đồng ý, cầm hộp chạy. Phòng họp chiều đó thơm mùi mỡ hành.", fx: { whoPatience: 20000, xp: 2 } },
              lose: { say: "'Em không ăn ở bàn làm việc được chị, sếp em ngồi kế bên.' Đành ăn nhanh tại chỗ.", fx: { whoPatience: 5000 } } } },
        ],
      },
    },
  },

  // ===== K14 · Cô Út ngồi lâu =====
  {
    id: "K14", group: "khach", tone: "good", when: "shift",
    if: { phase: ["cao", "khuya"], waitingMin: 2 }, npc: "co-ut",
    moment: "Cô Út nhường bàn, quán mua một tờ vé số. Không trúng, nhưng có câu chuyện.",
    nodes: {
      start: {
        mood: "happy",
        line: "Con biết hông, tuần trước cô bán trúng cho ông bán chè cái giải khuyến khích, ổng mừng quá trả luôn tiền chè cho cô ba ngày!",
        me: "Cô Út ăn xong từ lâu, câu chuyện thì mới tới đoạn mở bài. Hai nhóm khách vẫn đứng chờ bàn.",
        choices: [
          { id: "stool", label: "Mời cô ly trà, ngồi ghế đẩu cạnh bếp", hint: "Không tốn gì · bàn trống ngay, +1 danh tiếng, cô kể chuyện cho cô chủ nghe",
            say: "Cô ngồi đây kể con nghe, bàn đó để khách mới ngồi cho ấm.", fx: { rep: 1, cleanTables: true, patience: 5000 } },
          { id: "stay", label: "Để cô ngồi", hint: "Không tốn gì · khách chờ bớt kiên nhẫn 8 giây",
            say: "Cô cứ ngồi, chuyện xổ số của cô hay hơn chương trình ti vi.", fx: { patience: -8000 } },
          { id: "ticket", label: "Mua một tờ vé số cho vui", hint: "−10k · hên xui 10% trúng 100k, 90% không trúng nhưng cô vui nhường bàn",
            say: "Cô bán con một tờ, trúng thì con bao cô dĩa cơm.", fx: { money: -10, cleanTables: true },
            roll: { p: 0.1,
              win: { say: "Trúng một trăm ngàn! Cô Út hét lên, cả quán vỗ tay, cô chủ bao cả bàn ly trà đá.", fx: { money: 100, hype: 1, teaAll: true } },
              lose: { say: "Không trúng, nhưng cô Út vui, đứng dậy nhường bàn: 'Mai cô để dành tờ đẹp nhất cho con.'", fx: { rep: 1 } } } },
        ],
      },
    },
  },
];
