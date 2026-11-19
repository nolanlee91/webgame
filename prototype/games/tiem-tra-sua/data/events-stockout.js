// Sự kiện sau vụ hết hàng giữa ca (core/stockout.js đặt cờ và hẹn). Cùng cấu trúc data/events.js.
// H01 chị Lụa Hẻm Bên ghé đòi món đã cho mượn (hẹn từ lựa chọn "Mượn đỡ"), H02 mẹ nghe tin tiệm đóng cửa sớm (cờ dong-som),
// H03 reviewer đăng bài "tiệm hết ly" (cờ het-hang). Cờ do game đặt: muon-hb, dong-som, het-hang (ENGINE_FLAG ở core/drama.js).
// Hài tử tế, không chê người, không emoji, không thương hiệu hay người thật.

export const EVENTS_STOCKOUT = [
  {
    id: "H01", group: "doi", tone: "mixed", when: "day", priority: 3, cooldown: 3,
    if: { chain: true }, npc: { role: "vip", name: "Chị Lụa Hẻm Bên", self: "chị", call: "em" },
    nodes: {
      start: {
        mood: "happy", line: "Em ơi, chị ghé lấy lại món hôm qua cho mượn nè. Mà không gấp đâu, chị chỉ tiện đường… đi ngang ba lần.",
        me: "Dạ chị, em nhớ mà. Em định mang qua liền đó.",
        choices: [
          { id: "repay", label: "Trả đủ, kèm hai ly trà đào", hint: "Tốn 20k, +1 danh tiếng, hết nợ",
            say: "Trả đủ, tặng thêm hai ly trà đào. Chị Lụa uống xong khen \"cũng được\", ở Hẻm Bên đó là lời khen cao nhất.", fx: { money: -20, rep: 1, unflag: "muon-hb" } },
          { id: "favor", label: "Trả bằng một lời giới thiệu", hint: "Miễn phí, ca sau −1 khách (chị dắt khách đi), hết nợ",
            say: "Em hứa giới thiệu khách qua chị khi tiệm đông. Chị Lụa ghi âm lại lời hứa. Để chắc.", fx: { nextGuests: -1, unflag: "muon-hb" } },
          { id: "joke", label: "Hỏi chị có nhận trả góp bằng nụ cười không", hint: "Hên xui",
            say: "Em cười thật tươi và hỏi có trả góp bằng nụ cười được không.",
            roll: { p: 0.5,
              win: { say: "Chị Lụa phì cười: \"Thôi lần này chị cho, lần sau nhập hàng sớm giùm.\" Hẻm Bên và tiệm mình thân thêm chút xíu.", fx: { rep: 1, followers: 5, unflag: "muon-hb" } },
              lose: { say: "Chị Lụa không cười. Chị đăng lên nhóm khu phố: \"Cho mượn đồ, được trả bằng nụ cười.\" Cả hẻm cười, trừ tiệm.", fx: { rep: -1, buzz: 1, money: -10, unflag: "muon-hb" } } } },
        ],
      },
    },
  },
  {
    id: "H02", group: "doi", tone: "mixed", when: "day", priority: 2, cooldown: 4,
    if: { flags: ["dong-som"] }, npc: { role: "neighbor", name: "Mẹ", self: "mẹ", call: "con" },
    nodes: {
      start: {
        mood: "annoyed", line: "Con ơi, cô Tư nói tiệm con đóng cửa sớm vì hết hàng hả? Mẹ nghe mà muốn chạy ra phụ con đếm kho.",
        me: "Dạ… con quên kiểm kho thôi mẹ. Mai con nhập đủ.",
        choices: [
          { id: "list", label: "Nhờ mẹ viết giùm danh sách kiểm kho", hint: "+4 XP, ca sau khách kiên nhẫn hơn (+1 khách)",
            say: "Mẹ viết danh sách kiểm kho bằng nét chữ đẹp nhất, dán ngay cửa tủ. Dòng cuối: \"nhớ ăn cơm\".", fx: { xp: 4, nextGuests: 1, unflag: "dong-som" } },
          { id: "brave", label: "Nói mẹ yên tâm, con lo được", hint: "Miễn phí, +2 XP",
            say: "Con nói con lo được. Mẹ nói \"ừ\", rồi gửi thêm ba tin nhắn nhắc nhập ly.", fx: { xp: 2, unflag: "dong-som" } },
          { id: "stock", label: "Nhận bịch ly mẹ mua sẵn", hint: "+10 ly, mẹ dặn thêm 15 phút",
            say: "Mẹ đưa một bịch ly mua ở chợ, dặn đúng mười lăm phút. Ly thì đủ, tai thì hơi ù.", fx: { stock: { ly: 10 }, unflag: "dong-som" } },
        ],
      },
    },
  },
  {
    id: "H03", group: "mang", tone: "bad", when: "day", priority: 2, cooldown: 5,
    if: { flags: ["het-hang"], minDay: 2 }, npc: { role: "reviewer", name: "Bé Ngân Food", self: "em", call: "chị" },
    nodes: {
      start: {
        mood: "surprised", line: "Chị ơi, em lỡ đăng bài \"Tiệm trà sữa hết… ly\" kèm hình cái quầy trống. Bài lên nhanh quá, em nên làm gì đây?",
        me: "Trời… hình đó chụp lúc chị chạy đi mua phải không?",
        choices: [
          { id: "own", label: "Vào bình luận nhận lỗi, hứa nhập đủ", hint: "+1 danh tiếng, +8 người theo dõi",
            say: "Tiệm bình luận: \"Tiệm hết ly thật, hôm nay tiệm có ly rồi, mời cả nhà ghé kiểm tra.\" Cư dân mạng khen thật thà.", fx: { rep: 1, followers: 8, unflag: "het-hang" } },
          { id: "trend", label: "Biến thành trend \"đi tìm ly\"", hint: "Hên xui: lên mạng hoặc bị chê",
            say: "Tiệm đăng clip chủ tiệm cầm đèn pin đi tìm ly khắp tiệm.",
            roll: { p: 0.55,
              win: { say: "Clip \"đi tìm ly\" lên xu hướng khu phố. Ca sau khách tới hỏi \"còn ly không chị\" rồi cười.", fx: { followers: 30, buzz: 1, nextGuests: 2, unflag: "het-hang" } },
              lose: { say: "Có người bình luận \"tìm ly trước khi tìm khách nha\". Bài được nhiều like hơn clip.", fx: { rep: -1, followers: 5, unflag: "het-hang" } } } },
          { id: "ignore", label: "Kệ, lo pha ly cho đàng hoàng", hint: "Miễn phí, review 3 sao trên mạng",
            say: "Tiệm không trả lời, chỉ nhập dư hai chồng ly. Bài tự chìm, còn lại một review 3 sao.",
            fx: { review: { stars: 3, name: "Bé Ngân Food", line: "Hôm trước tiệm hết ly, hôm nay có ly rồi. Trà ổn, mong tiệm giữ phong độ kho hàng. #capnhat" }, unflag: "het-hang" } },
        ],
      },
    },
  },
];
