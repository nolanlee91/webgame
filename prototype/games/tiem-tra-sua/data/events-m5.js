// Sự kiện Milestone 5: Hội chợ (FA1–FA3), ca thử thách (CH1–CH2), máy rót hai vòi (DS1–DS2). Cùng cấu trúc data/events.js.
// Cờ do game đặt (ENGINE_FLAG ở core/drama.js): hoi-cho (ngày hội chợ), hoi-cho-xong (sau ca hội chợ), thu-thach (ngày thử thách),
// thu-thach-dat / thu-thach-hut (sau ca thử thách). Hài tử tế, không emoji, không thương hiệu hay người thật.

export const EVENTS_M5 = [
  {
    id: "FA1", group: "dac-biet", tone: "good", when: "shift", priority: 2, cooldown: 3,
    if: { flags: ["hoi-cho"], tMin: 30000 }, npc: { role: "office-worker", name: "MC hội chợ", self: "mình", call: "gian trà sữa" },
    nodes: {
      start: {
        mood: "happy", line: "Xin mời gian trà sữa {shop} lên sân khấu ba mươi giây giới thiệu món nào! Cả hội chợ đang nhìn kìa!",
        me: "Ủa… lên liền hả? Ly đang pha dở mà!",
        choices: [
          { id: "stage", label: "Lên sân khấu, cầm ly làm micro", hint: "Khách đang chờ bớt kiên nhẫn 5 giây, +30 người theo dõi, +2 khách ngay ca này",
            say: "Chủ tiệm cầm ly trà sữa làm micro: \"Ly này 50% đường, 100% tâm huyết.\" Cả hội chợ vỗ tay, có người xếp hàng liền.", fx: { patience: -5000, followers: 30, guests: 2, buzz: 1 } },
          { id: "staff", label: "Nhờ MC đọc giùm câu giới thiệu", hint: "+10 người theo dõi, không bỏ quầy",
            say: "MC đọc to: \"Gian trà sữa nói: tới uống đi rồi biết.\" Ngắn, gọn, cả hội chợ cười.", fx: { followers: 10 } },
          { id: "shy", label: "Vẫy tay từ gian hàng", hint: "Miễn phí, +2 XP",
            say: "Chủ tiệm vẫy tay thật lớn từ gian hàng. MC nói \"chủ tiệm bận pha, vậy là ngon\".", fx: { xp: 2 } },
        ],
      },
    },
  },
  {
    id: "FA2", group: "dac-biet", tone: "mixed", when: "shift", priority: 2, cooldown: 4,
    if: { flags: ["hoi-cho"], waitingMin: 1, tMin: 60000 }, npc: { role: "vip", name: "Chị Lụa Hẻm Bên", self: "chị", call: "em" },
    nodes: {
      start: {
        mood: "happy", line: "Ủa em cũng có gian ở hội chợ hả? Gian chị ngay bên cạnh nè. Mình thi xem bên nào đông khách hơn nha.",
        me: "Dạ… thi thì thi, mà chị nhường em cái quạt được không?",
        choices: [
          { id: "duel", label: "Nhận lời thi, treo bảng \"đơn nhóm giảm 5k\"", hint: "Hên xui: thắng thì đông khách, thua thì mất danh tiếng",
            say: "Tiệm treo bảng giảm giá đơn nhóm, nhìn sang gian chị Lụa.",
            roll: { p: 0.55,
              win: { say: "Hàng khách bên mình dài hơn. Chị Lụa gửi sang một ly của chị, kèm lời \"lần này thôi nha\".", fx: { guests: 2, followers: 15, rep: 1 } },
              lose: { say: "Gian chị Lụa có máy phun sương. Khách bên mình nhìn qua bên đó đầy ước ao.", fx: { rep: -1, patience: -3000 } } } },
          { id: "team", label: "Rủ chị gộp hai gian thành \"phố trà sữa\"", hint: "+20 người theo dõi, ca sau +1 khách",
            say: "Hai gian gộp lại, treo chung tấm bảng \"Phố Trà Sữa Hẻm 7\". Khách đi một vòng, uống hai nơi.", fx: { followers: 20, nextGuests: 1 } },
          { id: "ignore", label: "Cười trừ, lo pha tiếp", hint: "Miễn phí, khách đang chờ +4 giây",
            say: "Tiệm cười trừ rồi lo pha tiếp. Khách đang chờ thấy tiệm bình tĩnh nên cũng bình tĩnh.", fx: { patience: 4000 } },
        ],
      },
    },
  },
  {
    id: "FA3", group: "dac-biet", tone: "good", when: "day", priority: 2, cooldown: 5,
    if: { flags: ["hoi-cho-xong"] }, npc: { role: "office-worker", name: "Ban tổ chức hội chợ", self: "ban tổ chức", call: "tiệm" },
    nodes: {
      start: {
        mood: "happy", line: "Hội chợ vừa rồi khách khen gian {shop} nhiều lắm. Lần tới ban tổ chức mời tiệm vào vị trí gần cổng nha?",
        me: "Gần cổng là chỗ đông nhất, mà cũng nắng nhất…",
        choices: [
          { id: "gate", label: "Nhận vị trí gần cổng", hint: "+2 danh tiếng, +15 người theo dõi",
            say: "Tiệm nhận chỗ gần cổng, hứa mang theo hai cái dù và một thùng đá dư.", fx: { rep: 2, followers: 15, unflag: "hoi-cho-xong" } },
          { id: "sponsor", label: "Tài trợ nước cho ban tổ chức", hint: "Tốn 30k, ca sau +2 khách",
            say: "Tiệm tài trợ hai mươi ly trà đá cho ban tổ chức. Ai cũng nhớ tên tiệm, nhất là người khát.", fx: { money: -30, nextGuests: 2, unflag: "hoi-cho-xong" } },
          { id: "rest", label: "Xin lần sau để tiệm nghỉ chân đã", hint: "Miễn phí, +4 XP",
            say: "Tiệm cảm ơn và xin nghỉ chân một tuần. Ban tổ chức nói \"chân quan trọng nhất\".", fx: { xp: 4, unflag: "hoi-cho-xong" } },
        ],
      },
    },
  },
  {
    id: "CH1", group: "dac-biet", tone: "mixed", when: "shift", priority: 2, cooldown: 3,
    if: { flags: ["thu-thach"], tMin: 25000 }, npc: { role: "reviewer", name: "Mi Review", self: "mình", call: "chị chủ" },
    nodes: {
      start: {
        mood: "happy", line: "Nghe nói hôm nay tiệm có ca thử thách hả chị? Cho mình livestream chấm điểm luôn nha!",
        me: "Đang thử thách mà còn có người chấm nữa hả trời…",
        choices: [
          { id: "live", label: "Cho livestream, nói luôn mục tiêu", hint: "Hên xui: +40 người theo dõi hoặc bị soi lỗi",
            say: "Tiệm đọc to mục tiêu trước ống kính.",
            roll: { p: 0.6,
              win: { say: "Người xem cổ vũ từng ly. Có người bình luận \"chủ tiệm pha như đang thi chung kết\".", fx: { followers: 40, buzz: 1 } },
              lose: { say: "Người xem soi được một ly lệch đá. Bình luận chạy nhanh hơn tay chủ tiệm.", fx: { followers: 10, rep: -1 } } } },
          { id: "after", label: "Hẹn quay sau ca cho đỡ run", hint: "+10 người theo dõi, khách đang chờ +3 giây",
            say: "Tiệm hẹn Mi quay sau ca. Mi ngồi đợi, tiện order luôn một ly.", fx: { followers: 10, patience: 3000 } },
          { id: "no", label: "Từ chối nhẹ nhàng", hint: "Miễn phí",
            say: "Tiệm xin hôm nay tập trung. Mi gật đầu, ghi chú \"hẹn hôm khác, ý chí cao\".", fx: { xp: 2 } },
        ],
      },
    },
  },
  {
    id: "CH2", group: "doi", tone: "good", when: "day", priority: 2, cooldown: 4,
    if: { flags: ["thu-thach-dat"] }, npc: { role: "neighbor", name: "Mẹ", self: "mẹ", call: "con" },
    nodes: {
      start: {
        mood: "happy", line: "Con ơi, mẹ thấy trên nhóm khu phố nói tiệm con vượt thử thách gì đó. Mẹ không hiểu lắm nhưng mẹ tự hào.",
        me: "Dạ, là ca thử thách của tiệm đó mẹ. Con làm được rồi!",
        choices: [
          { id: "frame", label: "Gửi mẹ tấm hình huy hiệu", hint: "+3 XP, mẹ đăng lên nhóm gia đình (+10 người theo dõi)",
            say: "Mẹ in tấm hình huy hiệu ra, dán tủ lạnh, kế bên giấy khen hồi con học lớp ba.", fx: { xp: 3, followers: 10, unflag: "thu-thach-dat" } },
          { id: "treat", label: "Mời mẹ ghé tiệm uống ly mừng", hint: "−1 phần sữa, +1 danh tiếng",
            say: "Mẹ ghé tiệm, uống một ly, khen \"được\", rồi kể với cả hàng xóm là \"ngon nhất phường\".", fx: { stock: { sua: -1 }, rep: 1, unflag: "thu-thach-dat" } },
          { id: "humble", label: "Nói mẹ đừng khoe nhiều", hint: "Miễn phí",
            say: "Con dặn mẹ đừng khoe. Mẹ nói \"ừ\", rồi gọi cho dì Tư.", fx: { xp: 1, unflag: "thu-thach-dat" } },
        ],
      },
    },
  },
  {
    id: "DS1", group: "van-hanh", tone: "mixed", when: "shift", priority: 1, cooldown: 4,
    if: { owns: "dual-spout-brewer", minDay: 2, tMin: 20000 }, npc: { role: "barista", name: "Bạn", self: "mình", call: "máy" },
    nodes: {
      start: {
        mood: "surprised", line: "Máy rót hai vòi kêu \"xì\" một tiếng rồi phun một tia trà lên trần. Khách đang chờ nhìn lên theo.",
        choices: [
          { id: "fix", label: "Vặn lại van, lau trần", hint: "Khách đang chờ bớt kiên nhẫn 4 giây, +3 XP",
            say: "Vặn van, lau trần, máy hết dỗi. Trần nhà giờ thơm mùi ô long.", fx: { patience: -4000, xp: 3 } },
          { id: "show", label: "Nói đây là \"trình diễn hai vòi\"", hint: "Hên xui",
            say: "Chủ tiệm giơ tay: \"Đây là màn trình diễn đặc biệt của tiệm!\"",
            roll: { p: 0.5,
              win: { say: "Khách tưởng thật, vỗ tay, quay video. Trần nhà lên mạng.", fx: { followers: 20, buzz: 1 } },
              lose: { say: "Một giọt trà rơi trúng ly của khách đang chờ. Khách cười, nhưng hơi cứng.", fx: { rep: -1, stock: { "hong-tra": -1 } } } } },
        ],
      },
    },
  },
  {
    id: "DS2", group: "mang", tone: "good", when: "shift", priority: 1, cooldown: 5,
    if: { owns: "dual-spout-brewer", minDay: 3, waitingMin: 1 }, who: "waiting",
    nodes: {
      start: {
        mood: "happy", line: "{Call} ơi cho {self} quay cái máy hai vòi chạy được không? Bạn {self} không tin là có máy rót hai loại trà cùng lúc.",
        choices: [
          { id: "slow", label: "Rót chậm cho quay đẹp", hint: "Khách này chờ thêm 6 giây, +15 người theo dõi",
            say: "Tiệm rót chậm như phim quảng cáo, hai dòng trà chảy song song. Video có nhạc nền tự chế.", fx: { whoPatience: 6000, followers: 15 } },
          { id: "normal", label: "Rót bình thường, mời quay", hint: "+5 người theo dõi",
            say: "Tiệm rót bình thường. Bình thường mà vẫn đẹp, máy hai vòi là vậy.", fx: { followers: 5 } },
        ],
      },
    },
  },
];
