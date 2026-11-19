// Sự kiện Drama cho các cơ chế M3 (cùng cấu trúc với data/events.js, gộp vào EVENTS ở đó).
// Tiền tố: F = đơn nhóm nhiều ly, P = bàn pha đôi / ba chỗ, U = vựa sỉ Anh Út, Q = quảng bá, B = gói ký gửi / hụt vốn.
// Cờ do game tự đặt (core/drama.js ENGINE_FLAG): "si-mua" (vừa nhập vựa sỉ), "promo-<loại>" (quảng bá hôm nay),
// "ky-gui" (đang nợ gói ký gửi), "ky-gui-xong" (vừa trả đủ). lastServe.outcome = kết quả đơn nhiều ly (core/shift.js multiOutcome).
// Nhân vật, tiệm, địa danh đều hư cấu. Hài tử tế, không chê người, không emoji.

const STATIONS = ["double-station", "triple-station"];

export const EVENTS_M3 = [
  // ===== Đơn nhóm nhiều ly =====
  {
    id: "F01", group: "khach", tone: "good", when: "shift", priority: 1, cooldown: 4,
    if: { minDay: 4, minLevel: 3, queueFree: true, tMax: 150000 }, npc: { role: "neighbor", name: "Cô Tư", self: "cô", call: "con" },
    nodes: {
      start: {
        mood: "happy", line: "Con ơi, cả nhà cô về chơi. Ba đứa cháu, ba khẩu vị, ba cái miệng đang hỏi \"chừng nào tới quán\".",
        choices: [
          { id: "family", label: "Nhận đơn gia đình 3 ly", hint: "Đơn 3 ly mỗi ly một vị, khách chờ lâu hơn",
            say: "Dạ con nhận! Cô đọc từng ly, con ghi tên từng đứa lên nắp.",
            fx: { group: { cups: 3, arch: "khach-quen", same: false, name: "Cô Tư (cả nhà)", patienceMul: 1.2, line: "Ba ly cho ba đứa cháu nghen con, ly nào của đứa nào cô ghi trên phiếu rồi." } } },
          { id: "tomorrow", label: "Mời cả nhà ghé sáng mai", hint: "Ca sau thêm 2 khách",
            say: "Sáng mai quán vắng, cả nhà ghé ngồi bàn tre, con pha từ từ cho kỹ.", fx: { nextGuests: 2, rep: 1 } },
        ],
      },
    },
  },
  {
    id: "F02", group: "khach", tone: "mixed", when: "shift", priority: 3, cooldown: 3,
    if: { minDay: 3, lastServe: { cups: 2, outcome: "late" } }, who: "lastServed",
    nodes: {
      start: {
        mood: "sheepish", line: "Ly đầu tan đá hết rồi ly sau mới tới {call} ơi. Bạn {self} uống ly đầu như uống trà đá vỉa hè.",
        choices: [
          { id: "ice", label: "Thêm đá mới cho ly đầu", hint: "Tốn 1 đá, +1 danh tiếng",
            say: "Để em thêm đá mới, ly đầu được hồi sinh như vừa ra lò.", fx: { stock: { da: -1 }, rep: 1 } },
          { id: "explain", label: "Thú thật: một đôi tay, hai cái ly", hint: "+4 người theo dõi, khách cười cho qua",
            say: "Tiệm có một đôi tay mà đơn có hai ly. Em đang để dành tiền mua thêm tay.", fx: { followers: 4 } },
        ],
      },
    },
  },
  {
    id: "F03", group: "khach", tone: "good", when: "shift", priority: 3, cooldown: 4,
    if: { minLevel: 10, lastServe: { cups: 3, outcome: "perfect3" } }, who: "lastServed",
    nodes: {
      start: {
        mood: "happy", line: "Ba ly đúng hết luôn {call}. Phòng {self} muốn đặt mỗi sáng thứ Hai, {call} nhận không?",
        choices: [
          { id: "weekly", label: "Nhận đặt mỗi thứ Hai", hint: "Ca sau có cuộc gọi chốt đơn nhóm",
            say: "Nhận liền! Thứ Hai là ngày khó nhất tuần, tiệm lo phần trà sữa.", fx: { flag: "dat-thu-hai", xp: 3 }, later: { id: "F04", days: 1 } },
          { id: "card", label: "Tặng danh thiếp kèm tiếng cạch", hint: "+8 người theo dõi, +1 danh tiếng",
            say: "Danh thiếp nè, mặt sau ghi: \"Ba ly ba vị, không ai phải đổi ly\".", fx: { followers: 8, rep: 1 } },
        ],
      },
    },
  },
  {
    id: "F04", group: "khach", tone: "good", when: "day", priority: 1, cooldown: 3,
    if: { chain: true }, npc: { role: "office-worker", name: "Anh Khôi phòng thiết kế", self: "anh", call: "em" },
    nodes: {
      start: {
        mood: "waiting", line: "Alo em, phòng anh chốt đơn nhóm mai nha. Danh sách hơi dài vì có người ghi chú \"ít đá nhưng đừng ít quá\".",
        choices: [
          { id: "list", label: "Chốt danh sách 3 ly một lượt", hint: "Ca sau thêm 2 khách, +1 danh tiếng",
            say: "Mình chốt ba ly một lượt trước nha anh, ly nào cũng có tên, có ghi chú, có tâm.", fx: { nextGuests: 2, rep: 1, unflag: "dat-thu-hai" } },
          { id: "self", label: "Đề nghị nhóm tự ghi tên lên phiếu", hint: "+4 XP, +6 người theo dõi",
            say: "Anh gửi danh sách có tên từng người nha, tiệm in phiếu dán nắp, khỏi ai uống nhầm tâm trạng.", fx: { xp: 4, followers: 6, unflag: "dat-thu-hai" } },
        ],
      },
    },
  },
  {
    id: "F05", group: "khach", tone: "mixed", when: "shift", priority: 3, cooldown: 3,
    if: { minDay: 3, lastServe: { cups: 2, outcome: "oneWrong" } }, who: "lastServed",
    nodes: {
      start: {
        mood: "annoyed", line: "Ly của {self} thì đúng, ly của bạn {self} thì… hơi sáng tạo {call} ơi.",
        choices: [
          { id: "remake", label: "Làm lại ly lệch", hint: "Tốn 1 ly, +1 danh tiếng",
            say: "Đưa em ly đó, em làm lại liền. Ly sáng tạo để em tự uống làm bài học.", fx: { stock: { ly: -1 }, rep: 1 } },
          { id: "taste", label: "Mời bạn kia nếm thử rồi quyết", hint: "Hên xui: bạn thích vị mới thì thành chuyện vui",
            say: "Bạn nếm thử xem, biết đâu vị lạc đề lại là vị định mệnh.",
            roll: { p: 0.5, win: { say: "Bạn kia nếm xong: \"Ủa ngon hơn ly mình gọi.\" Cả nhóm cười, tiệm có món mới bất đắc dĩ.", fx: { followers: 10, buzz: 0.5 } },
              lose: { say: "Bạn kia nếm xong im lặng ba giây rồi nói \"vị này giống… thứ Hai\". Tiệm ghi nhận.", fx: { review: { stars: 3, line: "Ly của bạn mình bị lệch, tiệm mời nếm thử chứ không làm lại. Vui mà chưa đã. #motlylech" } } } } },
        ],
      },
    },
  },

  // ===== Bàn pha đôi / ba chỗ =====
  {
    id: "P01", group: "van-hanh", tone: "mixed", when: "shift", priority: 2, cooldown: 3,
    if: { owns: STATIONS, waitingMin: 2, cupsMin: 1 }, npc: { role: "barista", name: "Bạn", self: "mình", call: "quầy" },
    nodes: {
      start: {
        mood: "surprised", line: "Hai chỗ pha cùng bước. Tay trái rót trà đào, tay phải… cũng rót trà đào. Phiếu bên phải ghi ô long.",
        choices: [
          { id: "dump", label: "Đổ ly bên phải, pha lại", hint: "Tốn 1 ly, +1 danh tiếng vì cẩn thận",
            say: "Đổ. Pha lại. Tay phải đi học lại bài \"đọc phiếu trước khi rót\".", fx: { stock: { ly: -1 }, rep: 1 } },
          { id: "pause", label: "Dừng 5 giây đọc lại hai phiếu", hint: "Khách đang chờ mất 5 giây, +4 XP",
            say: "Hít thở. Đọc phiếu trái. Đọc phiếu phải. Hai tay bắt tay giảng hoà.", fx: { patience: -5000, xp: 4 } },
          { id: "match", label: "Đưa ly đó cho khách gọi trà đào", hint: "Hên xui: có khách đúng món thì khớp luôn",
            say: "Khoan, hình như có khách khác gọi trà đào. Ly này không sai, chỉ đi nhầm hàng.",
            roll: { p: 0.6, win: { say: "Trúng phóc! Khách bên cạnh gọi đúng trà đào. Ly đi lạc tìm được chủ.", fx: { followers: 6, xp: 2 } },
              lose: { say: "Không ai gọi trà đào. Ly đứng một mình trên quầy, nhân viên tự uống cho đỡ phí.", fx: { stock: { ly: -1 } } } } },
        ],
      },
    },
  },
  {
    id: "P02", group: "khach", tone: "mixed", when: "shift", priority: 2, cooldown: 3,
    if: { owns: STATIONS, waitingMin: 2 }, who: "waiting",
    nodes: {
      start: {
        mood: "waiting", line: "Hai ly giống y chang nhau, ly nào là của {self} vậy {call}? Bạn kia cũng đang hỏi câu y chang.",
        choices: [
          { id: "label", label: "Viết tên lên nắp từ giờ", hint: "Mỗi ly chậm 1 giây tới hết ca, +1 danh tiếng",
            say: "Từ giờ ly nào cũng có tên trên nắp, viết bằng bút lông, đọc từ đầu hẻm.", fx: { sealMs: 1000, rep: 1 } },
          { id: "pick", label: "Mời hai bạn tự chọn", hint: "Hên xui: ly giống nhau thật thì ai cũng vui",
            say: "Hai ly cùng công thức, bạn chọn ly nào cũng đúng. Đây là kỳ tích của bàn pha đôi.",
            roll: { p: 0.5, win: { say: "Hai ly giống nhau thật, hai bạn chọn đại, ai cũng vừa ý. Bàn pha đôi được tung hô.", fx: { followers: 8 } },
              lose: { say: "Một ly ít đá, một ly nhiều đá. Hai bạn đổi qua đổi lại ba lần mới đúng.", fx: { patience: -3000, review: { stars: 3, line: "Hai ly nhìn y chang mà khác đá, tụi mình đổi ly ba lần. Vui nhưng mỏi tay. #doily" } } } } },
        ],
      },
    },
  },
  {
    id: "P03", group: "doi", tone: "good", when: "day", priority: 1, cooldown: 8,
    if: { owns: STATIONS }, npc: { role: "barista", name: "Bạn", self: "mình", call: "quầy" },
    nodes: {
      start: {
        mood: "sheepish", line: "Tối qua mình mơ thấy hai cái ly cùng gọi tên mình, ly thứ ba thì gọi \"ơi\".",
        choices: [
          { id: "practice", label: "Tập pha hai tay trước gương", hint: "+6 XP",
            say: "Tập rót hai tay trước gương. Người trong gương rót đúng hơn mình.", fx: { xp: 6 } },
          { id: "color", label: "Dán nhãn màu cho từng chỗ pha", hint: "+1 danh tiếng, +4 người theo dõi",
            say: "Chỗ trái màu cam, chỗ phải màu xanh. Từ nay ly nào cũng có nhà.", fx: { rep: 1, followers: 4 } },
        ],
      },
    },
  },
  {
    id: "P04", group: "van-hanh", tone: "mixed", when: "shift", priority: 1, cooldown: 4,
    if: { owns: "triple-station", waitingMin: 2 }, npc: { role: "courier", name: "Anh Tèo shipper", self: "em", call: "chị" },
    nodes: {
      start: {
        mood: "surprised", line: "Ba ly ra cùng lúc, ba người cùng giơ tay. Em không biết đưa ai trước, ai cũng nhìn em như nhìn MC bốc thăm.",
        choices: [
          { id: "names", label: "Gọi tên theo phiếu", hint: "Khách đang chờ mất 3 giây, +1 danh tiếng",
            say: "Gọi tên từng người theo phiếu, chậm mà chắc, như điểm danh đầu giờ.", fx: { patience: -3000, rep: 1 } },
          { id: "quiz", label: "Đố vui: ai nhớ mình gọi gì", hint: "Khách đang chờ mất 6 giây, +10 người theo dõi, tiệm hot nhẹ",
            say: "Ai nói đúng ly mình gọi được nhận trước. Cả quầy biến thành gameshow.", fx: { patience: -6000, followers: 10, buzz: 0.5 } },
        ],
      },
    },
  },

  // ===== Vựa sỉ Anh Út =====
  {
    id: "U01", group: "van-hanh", tone: "bad", when: "shift", priority: 2, cooldown: 4,
    if: { minLevel: 12, flags: ["si-mua"], tMin: 15000 }, npc: { role: "barista", name: "Bạn", self: "mình", call: "bao trà" },
    nodes: {
      start: {
        mood: "surprised", line: "Mở bao hồng trà mới của vựa sỉ. Mùi… giống tủ quần áo của bà ngoại. Rẻ thì rẻ thật.",
        choices: [
          { id: "drop", label: "Bỏ lô này, dùng hàng cũ", hint: "Mất 2 hồng trà, +1 danh tiếng. Anh Út sẽ gọi lại",
            say: "Bỏ. Rẻ mà khách nhăn mặt thì không rẻ chút nào.", fx: { stock: { "hong-tra": -2 }, rep: 1, flag: "si-hang-cu" }, later: { id: "U02", days: 1 } },
          { id: "test", label: "Pha thử một ly rồi chấm", hint: "Hên xui: trà vẫn thơm thì khỏi lo",
            say: "Pha thử một ly, nhắm mắt nếm, để vị giác tự phán xử.",
            roll: { p: 0.5, win: { say: "Nếm xong: vẫn thơm, chỉ có cái bao là cũ. Hú hồn, tiệm tiết kiệm được một mớ.", fx: { xp: 4, money: 6 } },
              lose: { say: "Nếm xong muốn xin lỗi cả ấm trà. Một khách tinh ý đã kịp viết review.", fx: { review: { stars: 2, line: "Trà hôm nay có vị… nhà kho. Mong tiệm kiểm hàng kỹ hơn. #kiemhang", name: "Khách tinh ý" } } } } },
          { id: "call", label: "Gọi Anh Út đổi lô", hint: "Nghe điện thoại, chuyện có thể dài",
            say: "Alo anh Út, bao trà anh giao hình như đi qua nhiều mùa rồi.", goto: "call", fx: {} },
        ],
      },
      call: {
        mood: "happy", line: "Ờ ờ anh đổi liền! Mà em biết hông, bao đó anh để cạnh bao cà phê nên nó học theo mùi. Hồi đó nhà anh có con gà…",
        choices: [
          { id: "listen", label: "Nghe hết chuyện con gà", hint: "Khách đang chờ mất 6 giây, Anh Út gửi bù 4 hồng trà",
            say: "Dạ… con gà rồi sao nữa anh? À dạ, nó nhảy lên bao trà. Em hiểu rồi.", fx: { patience: -6000, stock: { "hong-tra": 4 } } },
          { id: "polite", label: "Xin phép cúp máy lịch sự", hint: "+2 XP. Anh Út hơi dỗi, mai giao có thể trễ",
            say: "Dạ tiệm đang đông, em nghe chuyện con gà vào tối nay nha anh.", fx: { xp: 2, flag: "ut-doi" }, later: { id: "U03", days: 1 } },
        ],
      },
    },
  },
  {
    id: "U02", group: "doi", tone: "good", when: "day", priority: 1, cooldown: 4,
    if: { minLevel: 12, flags: ["si-mua"] }, npc: { role: "courier", name: "Anh Út vựa sỉ", self: "anh", call: "em" },
    nodes: {
      start: {
        mood: "happy", line: "Alo em hả, anh Út nè. Anh gọi báo giá thôi… mà nhân tiện anh kể em nghe vụ hồi sáng ở chợ đầu mối.",
        choices: [
          { id: "listen", label: "Nghe hết (45 phút)", hint: "+5 XP. Anh Út quý tiệm, sẽ có quà",
            say: "Dạ em nghe. Bốn mươi lăm phút sau, em biết thêm giá đường, giá đá và tên ba con chó nhà anh.", fx: { xp: 5, flag: "ut-than" }, later: { id: "U05", days: 2 } },
          { id: "short", label: "Hẹn anh nói ngắn gọn", hint: "+1 danh tiếng vì đúng giờ. Anh Út dỗi nhẹ",
            say: "Dạ anh ơi, mình chốt giá trong hai câu, chuyện chợ để cuối tuần em nghe trọn bộ.", fx: { rep: 1, flag: "ut-doi" }, later: { id: "U03", days: 1 } },
        ],
      },
    },
  },
  {
    id: "U03", group: "van-hanh", tone: "mixed", when: "shift", priority: 2, cooldown: 3,
    if: { chain: true, flags: ["ut-doi"] }, npc: { role: "courier", name: "Bin con Anh Út", self: "em", call: "chị" },
    nodes: {
      start: {
        mood: "sheepish", line: "Chị ơi xe hàng của ba em xẹp bánh ở đầu hẻm. Ba em nói không phải dỗi đâu, là bánh xe dỗi.",
        choices: [
          { id: "carry", label: "Ra đầu hẻm khiêng phụ", hint: "Tạm ngưng nhận khách 12 giây, nhận 2 sữa + 2 đá",
            say: "Đi, chị em mình khiêng. Hàng không tự đi được thì mình đi tới hàng.", fx: { delaySpawn: 12000, stock: { sua: 2, da: 2 }, unflag: "ut-doi" } },
          { id: "fruit", label: "Mời khách món trà trái cây trong lúc chờ", hint: "Khách đang chờ thêm 5 giây, +3 XP",
            say: "Trong lúc chờ sữa, tiệm mời mọi người thử trà trái cây, chua chua như cuộc đời chờ hàng.", fx: { patience: 5000, xp: 3, unflag: "ut-doi" } },
          { id: "diba", label: "Nhập gấp ở Dì Ba (15k)", hint: "−15k, +3 sữa ngay",
            say: "Alo Dì Ba, con xin ba hộp sữa gấp. Dì cười: \"Biết mà, vựa sỉ rẻ mà xa.\"", fx: { money: -15, stock: { sua: 3 }, unflag: "ut-doi" } },
        ],
      },
    },
  },
  {
    id: "U04", group: "van-hanh", tone: "mixed", when: "day", priority: 1, cooldown: 5,
    if: { minLevel: 12, flags: ["si-mua"] }, npc: { role: "neighbor", name: "Dì Ba tạp hoá", self: "dì", call: "con" },
    nodes: {
      start: {
        mood: "sheepish", line: "Dì nghe nói con lấy hàng bên vựa Anh Út. Dì không buồn đâu… dì chỉ giảm giá năm phần trăm thôi.",
        choices: [
          { id: "stay", label: "Hứa vẫn lấy hàng của Dì Ba", hint: "+1 danh tiếng. Anh Út sẽ phản công",
            say: "Con lấy hàng ở dì từ ngày đầu, ly đầu tiên của tiệm là đường của dì mà.", fx: { rep: 1, flag: "di-ba-than" }, later: { id: "U06", days: 2 } },
          { id: "honest", label: "Nói thật: vựa sỉ rẻ hơn", hint: "Dì Ba suy nghĩ…",
            say: "Dạ vựa sỉ rẻ hơn thật dì, mà gói to quá kho con chật.", goto: "war", fx: {} },
        ],
      },
      war: {
        mood: "happy", line: "Rẻ hơn hả? Vậy dì tặng thêm bịch đá mỗi lần con lấy hàng! Đá dì lạnh hơn đá ai hết.",
        choices: [
          { id: "split", label: "Chia đều đơn cho hai nhà", hint: "+3 đá. Anh Út sẽ nghe tin",
            say: "Con chia đều: trà ở vựa, đá với tình cảm ở dì.", fx: { stock: { da: 3 }, flag: "hai-nha" }, later: { id: "U06", days: 2 } },
          { id: "think", label: "Cảm ơn dì, con tính thêm", hint: "+3 XP",
            say: "Dạ con cảm ơn dì, con về tính lại sổ, sổ con dạo này dày như sách giáo khoa.", fx: { xp: 3 } },
        ],
      },
    },
  },
  {
    id: "U05", group: "doi", tone: "good", when: "day", priority: 1, cooldown: 5,
    if: { chain: true, flags: ["ut-than"] }, npc: { role: "courier", name: "Anh Út vựa sỉ", self: "anh", call: "em" },
    nodes: {
      start: {
        mood: "happy", line: "Anh gửi em thùng đào nè, coi như cảm ơn em nghe anh kể chuyện. Ít ai chịu nghe tới đoạn con gà lắm.",
        choices: [
          { id: "accept", label: "Nhận và kể lại cho khách", hint: "+3 đào, +6 người theo dõi",
            say: "Em nhận nha anh. Từ nay trà đào tiệm có tên phụ: \"trà đào con gà\".", fx: { stock: { dao: 3 }, followers: 6, unflag: "ut-than" } },
          { id: "gift", label: "Gửi lại anh một ly trà đào", hint: "Tốn 1 đào, +1 danh tiếng",
            say: "Em gửi anh ly trà đào, mời anh uống trong lúc kể tập tiếp theo.", fx: { stock: { dao: -1 }, rep: 1, unflag: "ut-than" } },
        ],
      },
    },
  },
  {
    id: "U06", group: "van-hanh", tone: "good", when: "day", priority: 1, cooldown: 5,
    if: { chain: true }, npc: { role: "courier", name: "Anh Út vựa sỉ", self: "anh", call: "em" },
    nodes: {
      start: {
        mood: "sheepish", line: "Anh nghe nói Dì Ba tặng đá. Vậy anh tặng em… bốn gói hồng trà với một bài giảng kinh doanh bốn mươi phút.",
        choices: [
          { id: "take", label: "Nhận khuyến mãi của Anh Út", hint: "+4 hồng trà",
            say: "Em nhận trà, còn bài giảng anh gửi ghi âm, em nghe lúc rửa ly.", fx: { stock: { "hong-tra": 4 }, unflag: ["di-ba-than", "hai-nha"] } },
          { id: "peace", label: "Mời hai bên uống trà hoà giải", hint: "+2 danh tiếng, +10 người theo dõi",
            say: "Mời Dì Ba với Anh Út ngồi chung bàn tre. Hẻm mình ký hiệp ước hoà bình trà sữa.", fx: { rep: 2, followers: 10, unflag: ["di-ba-than", "hai-nha"] } },
        ],
      },
    },
  },

  // ===== Quảng bá: tờ rơi =====
  {
    id: "Q01", group: "mang", tone: "good", when: "shift", priority: 2, cooldown: 1,
    if: { flags: ["promo-to-roi"], tMin: 15000 }, npc: { role: "neighbor", name: "Bé Su con nhà bên", self: "em", call: "chị" },
    nodes: {
      start: {
        mood: "happy", line: "Chị ơi tờ rơi của tiệm bị một anh chụp lại, chữ to quá thành meme \"tờ rơi đọc được từ vũ trụ\".",
        choices: [
          { id: "repost", label: "Đăng lại kèm caption tự giễu", hint: "+25 người theo dõi, tiệm hot lên",
            say: "Đăng lại: \"Chữ to để bà con lớn tuổi đọc được, vũ trụ đọc được là quà tặng kèm.\"", fx: { followers: 25, buzz: 1, unflag: "promo-to-roi" } },
          { id: "more", label: "In thêm tờ rơi chữ to hơn (10k)", hint: "−10k, ca sau thêm 2 khách",
            say: "In thêm, chữ to hơn nữa. Lần này đọc được từ sao Hoả.", fx: { money: -10, nextGuests: 2, unflag: "promo-to-roi" } },
        ],
      },
    },
  },
  {
    id: "Q02", group: "mang", tone: "bad", when: "shift", priority: 2, cooldown: 1,
    if: { flags: ["promo-to-roi"], tMin: 15000 }, npc: { role: "courier", name: "Chú Tám bảo vệ khu phố", self: "chú", call: "con" },
    nodes: {
      start: {
        mood: "annoyed", line: "Tờ rơi của con bay đầy hẻm, gió thổi vô cả nồi lẩu nhà bên. Nhà bên giờ biết giá trà sữa thuộc lòng.",
        choices: [
          { id: "clean", label: "Đi nhặt hết, xin lỗi từng nhà", hint: "Tạm ngưng nhận khách 10 giây, +2 danh tiếng",
            say: "Con đi nhặt liền chú, nhà nào có tờ rơi bay vô con xin lỗi tận cửa.", fx: { delaySpawn: 10000, rep: 2, unflag: "promo-to-roi" } },
          { id: "gift", label: "Gửi nhà bên ly trà đào xin lỗi", hint: "Tốn 1 đào + 1 ly, +1 danh tiếng, +5 người theo dõi",
            say: "Gửi nhà bên ly trà đào, ghi lên nắp: \"Xin lỗi vì tờ rơi bay vô nồi lẩu\".", fx: { stock: { dao: -1, ly: -1 }, rep: 1, followers: 5, unflag: "promo-to-roi" } },
        ],
      },
    },
  },
  {
    id: "Q03", group: "khach", tone: "mixed", when: "shift", priority: 2, cooldown: 1,
    if: { flags: ["promo-to-roi"], waitingMin: 1 }, who: "waiting",
    nodes: {
      start: {
        mood: "waiting", line: "{Call} ơi, tờ rơi ghi \"mua một tặng một\" nè… À, tờ đó của tiệm cắt tóc kế bên hả {call}?",
        choices: [
          { id: "topping", label: "Giảm 3k cho vui", hint: "Giá ly −3k, +6 người theo dõi",
            say: "Tờ đó của tiệm cắt tóc, nhưng tiệm trà giảm 3k vì {self} đọc tờ rơi chăm chỉ.", fx: { priceWho: -3, followers: 6, unflag: "promo-to-roi" } },
          { id: "explain", label: "Giải thích nhẹ nhàng, giữ giá", hint: "+1 danh tiếng",
            say: "Tờ rơi tiệm mình chữ to màu cam đó {self}. Tờ kia mua một tặng một… lần cắt tóc.", fx: { rep: 1, unflag: "promo-to-roi" } },
        ],
      },
    },
  },
  // ===== Quảng bá: check-in =====
  {
    id: "Q04", group: "mang", tone: "good", when: "shift", priority: 2, cooldown: 1,
    if: { flags: ["promo-check-in"], tMin: 15000 }, npc: { role: "reviewer", name: "Hến Đi Ăn", self: "mình", call: "chị chủ" },
    nodes: {
      start: {
        mood: "happy", line: "Chị chủ ơi, mini game check-in lên xu hướng nhỏ rồi: ba trăm người bắt chước dáng \"nghe tiếng cạch\".",
        choices: [
          { id: "slots", label: "Mở khung giờ check-in", hint: "Ca sau thêm 3 khách, +20 người theo dõi",
            say: "Mở khung giờ check-in! Mỗi khung có một tiếng cạch bản giới hạn.", fx: { nextGuests: 3, followers: 20, unflag: "promo-check-in" } },
          { id: "thanks", label: "Cảm ơn, giữ nhịp bình thường", hint: "+1 danh tiếng, +10 người theo dõi",
            say: "Cảm ơn mọi người đã tới cạch cùng tiệm. Tiệm nhỏ, cạch từ từ cho kỹ.", fx: { rep: 1, followers: 10, unflag: "promo-check-in" } },
        ],
      },
    },
  },
  {
    id: "Q05", group: "van-hanh", tone: "bad", when: "shift", priority: 2, cooldown: 1,
    if: { flags: ["promo-check-in"], waitingMin: 1 }, npc: { role: "barista", name: "Bạn", self: "mình", call: "góc check-in" },
    nodes: {
      start: {
        mood: "surprised", line: "Hàng người xếp chụp ảnh check-in còn dài hơn hàng người mua trà. Có bạn chụp tới tấm thứ bốn mươi.",
        choices: [
          { id: "move", label: "Dời góc check-in ra cửa", hint: "Tạm ngưng nhận khách 8 giây, khách đang chờ thêm 6 giây, +1 danh tiếng",
            say: "Dời góc chụp ra cửa, người chụp có nắng, người mua có lối đi. Ai cũng vui.", fx: { delaySpawn: 8000, patience: 6000, rep: 1, unflag: "promo-check-in" } },
          { id: "rule", label: "Quy định: mua ly mới chụp", hint: "+1 khách ngay ca này, bớt 5 người theo dõi",
            say: "Quy định mới: một ly một tấm. Tấm thứ hai trở đi tính bằng nụ cười.", fx: { guests: 1, followers: -5, unflag: "promo-check-in" } },
        ],
      },
    },
  },
  {
    id: "Q06", group: "khach", tone: "mixed", when: "shift", priority: 2, cooldown: 1,
    if: { flags: ["promo-check-in"], queueFree: true }, npc: { role: "regular", name: "Nhóm bạn lớp 11A", self: "tụi em", call: "chị" },
    nodes: {
      start: {
        mood: "sheepish", line: "Tụi em sáu đứa check-in nhận sáu tiếng cạch… rồi chia nhau một ly. Chị đừng buồn, tụi em nghèo mà vui.",
        choices: [
          { id: "straws", label: "Cười, tặng thêm ống hút", hint: "+15 người theo dõi",
            say: "Một ly sáu ống hút, tình bạn vậy mới bền. Chị tặng thêm tiếng cạch thứ bảy.", fx: { followers: 15, unflag: "promo-check-in" } },
          { id: "second", label: "Mời mua ly thứ hai chia nhau", hint: "Đơn nhóm 2 ly",
            say: "Thêm một ly nữa đi, ba đứa một ly là vừa đẹp, chị pha hai vị cho đổi gió.",
            fx: { group: { cups: 2, arch: "hoc-sinh", same: false, name: "Nhóm 11A", line: "Hai ly cho sáu đứa tụi em nha chị, mỗi ly một vị để đổi gió." }, unflag: "promo-check-in" } },
        ],
      },
    },
  },
  // ===== Quảng bá: livestream =====
  {
    id: "Q07", group: "mang", tone: "good", when: "shift", priority: 2, cooldown: 1,
    if: { flags: ["promo-livestream"], tMin: 15000 }, npc: { role: "reviewer", name: "Mi Review", self: "mình", call: "chị chủ" },
    nodes: {
      start: {
        mood: "happy", line: "Chị ơi trong live có đoạn chị làm rơi nắp rồi chụp lại được, người ta cắt clip đặt tên \"phản xạ chủ tiệm\".",
        choices: [
          { id: "nightly", label: "Live tiếp mỗi tối", hint: "+40 người theo dõi, tiệm hot lên",
            say: "Mỗi tối tám giờ, tiệm live pha trà, không hứa không rơi nắp.", fx: { followers: 40, buzz: 1, unflag: "promo-livestream" } },
          { id: "mom", label: "Cắt clip gửi mẹ xem", hint: "+1 danh tiếng, +4 XP",
            say: "Gửi mẹ clip. Mẹ xem mười lần rồi gửi cả họ, kèm câu \"con tui đó\".", fx: { rep: 1, xp: 4, unflag: "promo-livestream" } },
        ],
      },
    },
  },
  {
    id: "Q08", group: "mang", tone: "bad", when: "shift", priority: 2, cooldown: 1,
    if: { flags: ["promo-livestream"], tMin: 15000 }, npc: { role: "barista", name: "Bạn", self: "mình", call: "điện thoại" },
    nodes: {
      start: {
        mood: "surprised", line: "Hôm qua live xong quên tắt mic, cả khán giả nghe trọn câu \"ủa ly này của ai\" và mười phút rửa ly.",
        choices: [
          { id: "meme", label: "Nhận lỗi bằng meme", hint: "+15 người theo dõi, tiệm hot nhẹ",
            say: "Đăng meme: \"Livestream phiên bản đầy đủ, có cả phần hậu trường rửa ly.\"", fx: { followers: 15, buzz: 0.5, unflag: "promo-livestream" } },
          { id: "focus", label: "Tạm nghỉ live, tập trung pha", hint: "+1 danh tiếng, khách đang chờ thêm 5 giây",
            say: "Tạm cất điện thoại, hôm nay khán giả duy nhất là khách đang đứng trước quầy.", fx: { rep: 1, patience: 5000, unflag: "promo-livestream" } },
        ],
      },
    },
  },
  {
    id: "Q09", group: "khach", tone: "mixed", when: "shift", priority: 2, cooldown: 1,
    if: { flags: ["promo-livestream"], waitingMin: 1 }, who: "waiting",
    nodes: {
      start: {
        mood: "happy", line: "{Self} xem live nghe {call} hứa \"ai tới nói mật khẩu được tặng ly\". Mật khẩu là \"cạch\" đúng không {call}?",
        choices: [
          { id: "keep", label: "Giữ lời: giảm nửa ly", hint: "Giá ly −10k, +12 người theo dõi, +1 danh tiếng",
            say: "Hứa trên live là hứa thật. Mật khẩu đúng, giảm nửa ly, nửa còn lại là tình cảm.", fx: { priceWho: -10, followers: 12, rep: 1, unflag: "promo-livestream" } },
          { id: "joke", label: "Tặng tiếng cạch thay ly miễn phí", hint: "+6 người theo dõi",
            say: "Mật khẩu đúng! Phần thưởng là một tiếng cạch thật to, đóng riêng cho {self}.", fx: { followers: 6, unflag: "promo-livestream" } },
        ],
      },
    },
  },

  // ===== Gói ký gửi / hụt vốn =====
  {
    id: "B01", group: "doi", tone: "good", when: "shift", priority: 1, cooldown: 3,
    if: { flags: ["ky-gui"], tMin: 20000 }, npc: { role: "neighbor", name: "Dì Ba tạp hoá", self: "dì", call: "con" },
    nodes: {
      start: {
        mood: "happy", line: "Dì ghé coi gói ký gửi bán sao rồi. Đừng lo con, hồi trẻ dì từng ký gửi nguyên một xe dưa hấu, bán ba ngày mới hết.",
        choices: [
          { id: "brag", label: "Khoe ly bán được", hint: "+1 danh tiếng, +4 người theo dõi",
            say: "Dạ bán được mấy ly rồi dì, ly nào cũng có tên dì trong lòng.", fx: { rep: 1, followers: 4 } },
          { id: "treat", label: "Mời Dì Ba ly trà đào", hint: "Tốn 1 đào + 1 ly, +2 danh tiếng",
            say: "Dì uống ly này nha, hàng của dì, công của con, ngọt của cả hai.", fx: { stock: { dao: -1, ly: -1 }, rep: 2 } },
        ],
      },
    },
  },
  {
    id: "B02", group: "doi", tone: "good", when: "day", priority: 2, cooldown: 3,
    if: { flags: ["ky-gui-xong"] }, npc: { role: "neighbor", name: "Dì Ba tạp hoá", self: "dì", call: "con" },
    nodes: {
      start: {
        mood: "happy", line: "Trả đủ rồi đó con. Dì gạch sổ một đường, nghe đã tai như tiếng nắp cạch của con.",
        choices: [
          { id: "treat", label: "Hẹn mời Dì Ba ly đầu ca mai", hint: "+2 danh tiếng, +5 người theo dõi",
            say: "Ly đầu tiên ca mai là của dì, miễn phí trọn đời… à, trọn tuần thôi dì.", fx: { rep: 2, followers: 5, unflag: "ky-gui-xong" } },
          { id: "promise", label: "Hứa không để hụt vốn nữa", hint: "+6 XP",
            say: "Con hứa từ nay ghi sổ kỹ, ví mỏng thì mỏng có kế hoạch.", fx: { xp: 6, unflag: "ky-gui-xong" } },
        ],
      },
    },
  },
  {
    id: "B03", group: "doi", tone: "good", when: "day", priority: 1, cooldown: 5,
    if: { maxMoney: 40, sum: { profitMax: 0 } }, npc: { role: "neighbor", name: "Mẹ", self: "mẹ", call: "con" },
    nodes: {
      start: {
        mood: "waiting", line: "Mẹ nghe nói tháng này ví tiệm hơi mỏng. Mẹ không hỏi nhiều, mẹ chỉ hỏi con ăn cơm chưa.",
        choices: [
          { id: "honest", label: "Nói thật, xin mẹ lời khuyên", hint: "+1 danh tiếng, +4 XP",
            say: "Con lỗ chút mẹ ơi. Mẹ nói: \"Hồi mẹ bán xôi cũng lỗ ba tháng đầu, tháng thứ tư thì hết xôi bán không kịp.\"", fx: { rep: 1, xp: 4 } },
          { id: "spin", label: "Nói tiệm đang \"tái cấu trúc\"", hint: "+8 người theo dõi (mẹ kể nhóm bạn)",
            say: "Tiệm con đang tái cấu trúc mẹ ạ. Mẹ không hiểu nhưng khoe với nhóm bạn liền.", fx: { followers: 8 } },
        ],
      },
    },
  },
];
