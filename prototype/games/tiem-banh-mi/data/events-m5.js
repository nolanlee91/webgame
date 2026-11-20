// Sự kiện cơ chế Milestone 5 (PLAYBOOK §5: mỗi cơ chế có sự kiện riêng): hợp đồng định kỳ (HD1 gia hạn, HD2 mất hợp đồng), hạn dùng (HH1),
// bếp than nướng thịt (NT1), chảo trứng (TR1), bánh mì nướng bơ đường (BD1). Lược đồ ở đầu data/events.js. Cờ do code đặt:
// hop-dong-xong / hop-dong-vo / hop-dong-tre (core/contracts.js), het-han (core/expiry.js qua shift.js), nuong-thit / chao-trung / bo-duong (core/shift.js).
export const EVENTS_M5 = [
  {
    id: "HD1", group: "co-che", tone: "good", when: "day", priority: 2, cooldown: 4,
    if: { flags: ["hop-dong-xong"] }, npc: "chu-tam",
    nodes: {
      start: {
        mood: "happy", line: "Hết hợp đồng rồi mà tụi nhỏ trong đội cứ hỏi sáng mai bánh đâu. {Call} tính sao, ký tiếp không?",
        me: "Hợp đồng xong mà nhớ, chắc là hợp đồng tốt.",
        choices: [
          { id: "renew", label: "Ký tiếp 4 đợt", hint: "Không tốn · 12 ổ chả lụa mỗi 2 ngày, giao đúng giờ là có lời",
            say: "Ký tiếp chú. Tiệm giữ nguyên giờ, nguyên giá, nguyên độ giòn.",
            fx: { contract: { id: "chu-tam", name: "Đội Chú Tám", arch: "worker", recipe: "cha-lua", n: 12, every: 2, deliveries: 4, dueMs: 90000, discount: 0.05, label: "Hợp đồng công trình" }, unflag: "hop-dong-xong", rep: 1 } },
          { id: "bigger", label: "Ký tiếp, xin tăng lên 15 ổ", hint: "Hên xui 50% · được thì đơn to hơn, không thì giữ 12 ổ",
            say: "Chú cho tiệm làm 15 ổ đi, tụi nhỏ ăn một ổ là đói lại liền.",
            fx: { unflag: "hop-dong-xong" },
            roll: { p: 0.5,
              win: { say: "Chú cười lớn: “Mười lăm thì mười lăm, sáng nào cũng no.”", fx: { contract: { id: "chu-tam", name: "Đội Chú Tám", arch: "worker", recipe: "cha-lua", n: 15, every: 2, deliveries: 4, dueMs: 95000, label: "Hợp đồng công trình" } } },
              lose: { say: "“Thôi mười hai thôi con, công trình còn có hai tháng.”", fx: { contract: { id: "chu-tam", name: "Đội Chú Tám", arch: "worker", recipe: "cha-lua", n: 12, every: 2, deliveries: 3, dueMs: 90000, label: "Hợp đồng công trình" } } } } },
          { id: "rest", label: "Tạm nghỉ, hẹn công trình sau", hint: "Không tốn · +4 XP, chú vẫn ghé lẻ",
            say: "Tiệm nghỉ hợp đồng một thời gian cho đỡ cực. Công trình mới chú cứ gọi.", fx: { xp: 4, unflag: "hop-dong-xong" } },
        ],
      },
    },
  },
  {
    id: "HD2", group: "co-che", tone: "bad", when: "day", priority: 3, cooldown: 4,
    if: { flags: ["hop-dong-vo"] }, npc: "chi-thao",
    nodes: {
      start: {
        mood: "annoyed", line: "Em ơi, hai lần bánh tới trễ, bên chị phải ngưng hợp đồng. Chị quý tiệm nhưng sếp thì quý đồng hồ.",
        choices: [
          { id: "sorry", label: "Xin lỗi, tặng một đợt bù", hint: "−40k · +2 danh tiếng, chị kể tốt về tiệm",
            say: "Dạ lỗi tiệm. Đợt bù này tiệm biếu, coi như lời xin lỗi có pate.", fx: { money: -40, rep: 2, unflag: "hop-dong-vo", followers: 5 } },
          { id: "promise", label: "Xin một cơ hội cuối", hint: "Hên xui 40% · được thì ký lại 2 đợt",
            say: "Chị cho tiệm một cơ hội nữa, trễ thêm lần nào tiệm tự rút.",
            fx: { unflag: "hop-dong-vo" },
            roll: { p: 0.4,
              win: { say: "Chị thở dài rồi cười: “Hai đợt nữa thôi nha. Đúng giờ là ký dài.”", fx: { contract: { id: "hoa-sen", name: "Chị Thảo", arch: "office", recipe: "thap-cam", n: 20, every: 7, deliveries: 2, dueMs: 100000, label: "Họp giao ban Hoa Sen Xanh" } } },
              lose: { say: "“Sếp chốt rồi em. Hôm nào em rảnh mình nói chuyện bánh lẻ.”", fx: { rep: -1 } } } },
          { id: "accept", label: "Nhận lỗi, chúc chị may mắn", hint: "Không tốn · +3 XP (bài học)",
            say: "Dạ tiệm hiểu. Lần sau tiệm nhận ít đơn mà giữ đúng giờ.", fx: { xp: 3, unflag: "hop-dong-vo" } },
        ],
      },
    },
  },
  {
    id: "HH1", group: "co-che", tone: "mixed", when: "day", priority: 2, cooldown: 5,
    if: { flags: ["het-han"] }, npc: "ba-tu",
    nodes: {
      start: {
        mood: "neutral", line: "Bà thấy tiệm bỏ rau héo với chả lụa hết hạn nè con. Mua nhiều quá rồi bỏ, tiếc tiền mà tiếc của.",
        me: "Dạ… dự báo khách hôm qua hơi lạc quan.",
        choices: [
          { id: "small", label: "Xin bà bán gói nhỏ vài ngày", hint: "Không tốn · 3 ngày tới giá rau, dưa leo, chả lụa +10% (gói nhỏ)",
            say: "Bà bán giùm con gói nhỏ, mắc chút mà không phải bỏ.", fx: { unflag: "het-han", mod: { id: "goi-nho", days: 3, cost: { rau: 1.1, "dua-leo": 1.1, "cha-lua": 1.1 } }, xp: 3 } },
          { id: "salad", label: "Làm rau trộn tặng khách hẻm", hint: "−5k · +1 danh tiếng, +6 người theo dõi",
            say: "Phần rau còn dùng được con trộn dầu giấm, mời cả hẻm ăn thử.", fx: { money: -5, rep: 1, followers: 6, unflag: "het-han" } },
          { id: "ok", label: "Cảm ơn bà, con sẽ nhập kỹ hơn", hint: "Không tốn · +2 XP",
            say: "Con hứa mai nhìn dự báo kỹ hơn, mua vừa đủ.", fx: { xp: 2, unflag: "het-han" } },
        ],
      },
    },
  },
  {
    id: "NT1", group: "co-che", tone: "mixed", when: "shift", priority: 2, cooldown: 5,
    if: { flags: ["nuong-thit"], owns: "grill", tMin: 20000 }, npc: "co-hai",
    nodes: {
      start: {
        mood: "annoyed", line: "Khói bếp than bay qua nhà cô nè con. Đồ phơi của cô thơm mùi thịt nướng luôn rồi.",
        choices: [
          { id: "fan", label: "Quay quạt hướng khác, tặng cô ổ thịt", hint: "Mất 1 ổ trong tủ · +1 danh tiếng",
            say: "Con quay quạt ra đường, mùi thịt nướng giờ đi mời khách. Cô cầm ổ này ăn sáng nha.", fx: { bread: -1, rep: 1 } },
          { id: "joke", label: "Nói đùa: đồ cô thơm hơn nước xả vải", hint: "Hên xui 60% · cô cười hay cô giận",
            say: "Cô ơi đồ cô thơm thịt nướng, ra đường ai cũng hỏi mua bánh ở đâu đó.",
            roll: { p: 0.6, win: { say: "Cô bật cười: “Cái thằng này. Mai để cô dời sào phơi.”", fx: { xp: 3, followers: 3 } }, lose: { say: "Cô không cười. Cô dời sào phơi và dời luôn cả nụ cười.", fx: { rep: -1 } } } },
          { id: "sorry", label: "Xin lỗi, nướng mẻ nhỏ hơn", hint: "Không tốn · +2 XP",
            say: "Dạ con xin lỗi cô, con nướng mẻ nhỏ thôi, khói ít lại.", fx: { xp: 2 } },
        ],
      },
    },
  },
  {
    id: "TR1", group: "co-che", tone: "good", when: "shift", priority: 2, cooldown: 5,
    if: { flags: ["chao-trung"], owns: "egg-pan", tMin: 20000, waitingMin: 1 }, who: "waiting",
    nodes: {
      start: {
        mood: "happy", line: "{Call} ơi, trứng lòng đào được không? Cái kiểu lòng đỏ chảy xuống pate đó.",
        choices: [
          { id: "yes", label: "Chiều khách, chiên lòng đào", hint: "Khách này chờ thêm 4 giây kiên nhẫn · +1 danh tiếng nếu khách vui",
            say: "Lòng đào nè, chảy xuống pate đúng như {call} tả.", fx: { whoPatience: 4000, rep: 1 } },
          { id: "chef", label: "Gợi ý trứng chín kỹ cho đỡ dính tay", hint: "Hên xui 50% · khách thích hoặc hơi tiếc",
            say: "Lòng đào ăn đứng dễ dính áo lắm, để tiệm chiên chín vừa cho gọn nha.",
            roll: { p: 0.5, win: { say: "“Ờ ha, áo trắng đi làm. Chín vừa đi.”", fx: { xp: 3 } }, lose: { say: "“Thôi cũng được…” Giọng tiếc nguyên một lòng đỏ.", fx: { whoPatience: -2000 } } } },
          { id: "same", label: "Chiên như mọi khi", hint: "Không tốn",
            say: "Tiệm chiên kiểu quen tay nha, vàng viền, lòng vừa.", fx: { xp: 1 } },
        ],
      },
    },
  },
  {
    id: "BD1", group: "co-che", tone: "good", when: "shift", priority: 2, cooldown: 5,
    if: { flags: ["bo-duong"], tMin: 15000 }, npc: "co-giao",
    nodes: {
      start: {
        mood: "happy", line: "Học trò cô cứ đòi bánh bơ đường của tiệm. Mai cô đặt mười ổ cho giờ ra chơi được không em?",
        choices: [
          { id: "yes", label: "Nhận, giữ bánh hôm qua cho lớp", hint: "Không tốn · ca sau có đơn 8 ổ bơ đường",
            say: "Dạ được cô, bánh hôm qua tiệm để dành cho lớp, nướng giòn rồi mới giao.",
            fx: { preorder: { n: 8, recipe: "pate-bo", name: "Cô giáo lớp 4B", arch: "parent", when: "next", dueMs: 70000, label: "Giờ ra chơi lớp 4B" }, xp: 2 } },
          { id: "fresh", label: "Đề nghị bánh mới cho các bé", hint: "+1 danh tiếng · +4 XP",
            say: "Các bé ăn bánh mới nướng cho chắc bụng cô, bơ đường để làm quà thôi.", fx: { rep: 1, xp: 4 } },
          { id: "later", label: "Hẹn khi nào dư bánh sẽ báo cô", hint: "Không tốn",
            say: "Bánh dư không đoán trước được cô ơi, hôm nào dư tiệm nhắn liền.", fx: { xp: 1 } },
        ],
      },
    },
  },
];
export const M5_IDS = EVENTS_M5.map((e) => e.id);
