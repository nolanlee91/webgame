// Sự kiện Mạng M01–M04 và Lỗi lên mạng V01–V10 (docs/quan-com-tam/DRAMA.md §2.4; V08–V10 thêm cho các lỗi còn lại có thể đùa được).
// Lỗi lên mạng: dĩa vừa xuống bàn có lỗi, bàn có người cầm điện thoại ⇒ ưu tiên 3 (do người chơi gây ra). Lỗi nghiêm trọng (sườn sống,
// chay dính mặn) KHÔNG có sự kiện đùa: luôn mở hội thoại xin lỗi nghiêm túc ở core/tables.js. Người, kênh, quán đều hư cấu, không emoji.

const VIRAL = (mistake, extra = {}) => ({ lastServe: { mistake, phone: true, maxAgeMs: 15000 }, minDay: 2, ...extra });

export const EVENTS_MANG = [
  // ===== M01 · Mai Ăn Đêm quay clip =====
  {
    id: "M01", group: "mang", tone: "good", when: "shift", once: false, cooldown: 6, priority: 2,
    if: { minRep: 55, kind: "toi", phase: "khuya", noFlags: ["m01-tot", "m01-xau"] }, npc: "mai-an-dem",
    moment: "Mai Ăn Đêm nhắm mắt ăn miếng đầu. Mở mắt ra thì gọi thêm dĩa nữa.",
    nodes: {
      start: {
        mood: "happy",
        line: "Xin chào cả nhà, hôm nay Mai ghé một quán vỉa hè được đồn là sườn cháy cạnh ngon nhất quận! Chị chủ cho Mai quay chút nha?",
        me: "Đèn quay rọi vô mặt. Cô chủ vuốt tóc bằng bàn tay còn dính mỡ hành.",
        choices: [
          { id: "film", label: "Cho quay, làm dĩa đặc biệt", hint: "Chuyện còn tiếp…",
            say: "Quay đi em, chị làm dĩa đặc biệt, cháy cạnh đúng chuẩn.", goto: "close" },
          { id: "after", label: "Xin quay sau ca", hint: "Không tốn gì · không ảnh hưởng nhịp, +20 người theo dõi",
            say: "Mai ngồi ăn trước, hết khách chị ra quay chung.", fx: { followers: 20 } },
          { id: "no", label: "Từ chối nhẹ", hint: "Không tốn gì · không có gì thêm",
            say: "Hôm nay quán đông quá, Mai ăn ngon miệng là chị vui rồi.", fx: { xp: 1 } },
        ],
      },
      close: {
        mood: "surprised",
        line: "Mai muốn quay cảnh lật sườn cận cảnh, ba lần lật liên tiếp, máy quay không chớp nha chị!",
        choices: [
          { id: "flip", label: "Cho quay cận (thử thách 3 lần lật đúng lúc)", hint: "Không tốn gì · hên xui 55%: đạt +250 người theo dõi, quán hot; trượt thì clip 'sườn hơi khét'",
            say: "Ba lần lật, ba nhịp thở, một máy quay không chớp.",
            roll: { p: 0.55,
              win: { say: "Ba lần lật đúng lúc, tiếng xèo vang như vỗ tay. Mai nhắm mắt ăn rồi mở mắt gọi thêm dĩa nữa.", fx: { followers: 250, hype: 2, flag: "m01-tot" }, later: { id: "M02", days: 1 } },
              lose: { say: "Lần thứ ba trễ nửa nhịp, miếng sườn sém một góc. Mai vẫn ăn hết, nhưng clip tên 'sườn hơi khét'.", fx: { followers: 40, flag: "m01-xau" }, later: { id: "M02", days: 1 } } } },
          { id: "wide", label: "Quay toàn cảnh quán", hint: "Không tốn gì · +80 người theo dõi chắc chắn",
            say: "Quay toàn cảnh đi Mai, có ghế nhựa, có đèn dây, có mùi than.", fx: { followers: 80, hype: 1 } },
        ],
      },
    },
  },

  // ===== M02 · Clip lên =====
  {
    id: "M02", group: "mang", tone: "good", when: "day",
    if: { chain: true }, npc: "mai-an-dem",
    moment: "Lên clip của Mai Ăn Đêm. Tối hôm sau hẻm kẹt xe.",
    nodes: {
      start: {
        mood: "happy",
        line: "Clip lên rồi chị ơi! Mới mười tiếng mà bình luận dài hơn thực đơn của quán.",
        alt: [{ flags: ["m01-xau"], line: "Clip lên rồi chị… có điều tiêu đề là 'sườn hơi khét'. Bình luận chia hai phe, phe khen than, phe chê lửa.", mood: "annoyed" }],
        me: "Một clip, cả quận biết mặt. Mặt lúc đó còn dính lọ than.",
        choices: [
          { id: "share", label: "Đăng lại kèm cảm ơn", hint: "Không tốn gì · +150 người theo dõi, ca tới đông thêm 5 khách (chuẩn bị đủ hàng!)",
            need: { flags: ["m01-tot"] },
            say: "Đăng lại clip, cảm ơn Mai, cảm ơn cả hẻm. Tối đó hẻm kẹt xe.", fx: { followers: 150, nextGuests: 5, unflag: "m01-tot" } },
          { id: "frame", label: "Treo ảnh Mai lên tường", hint: "Không tốn gì · thêm đồ trang trí",
            need: { flags: ["m01-tot"] },
            say: "Treo tấm ảnh Mai nhắm mắt ăn sườn lên tường. Khách mới tới ai cũng nhắm mắt thử.", fx: { decor: "anh-mai", unflag: "m01-tot", rep: 1 } },
          { id: "own", label: "Nhận góp ý công khai", hint: "Không tốn gì · +1 danh tiếng, +40 người theo dõi",
            need: { flags: ["m01-xau"] },
            say: "Quán nhận góp ý: lần sau canh lửa kỹ hơn. Cư dân mạng khen 'chủ quán biết nghe'.", fx: { rep: 1, followers: 40, unflag: "m01-xau" } },
          { id: "again", label: "Mời Mai quay lại", hint: "Không tốn gì · hên xui 50% Mai quay lại, clip sửa sai (+120 người theo dõi)",
            need: { flags: ["m01-xau"] },
            say: "Mai ơi quay lại đi, lần này chị lật cho coi.",
            roll: { p: 0.5,
              win: { say: "Mai quay lại, lần này ba lần lật đều đẹp. Clip mới tên 'sườn đã hết khét'.", fx: { followers: 120, unflag: "m01-xau" } },
              lose: { say: "Mai bận lịch quay quán khác, hẹn tháng sau. Quán vẫn luyện lật mỗi tối.", fx: { xp: 3, unflag: "m01-xau" } } } },
          { id: "quiet", label: "Đọc bình luận rồi đi ướp sườn", hint: "Không tốn gì · +2 XP",
            say: "Đọc hết bình luận, cười một mình, rồi đi ướp sườn. Nổi thì nổi, mai vẫn phải nướng.", fx: { xp: 2, unflag: ["m01-tot", "m01-xau"] } },
        ],
      },
    },
  },

  // ===== M03 · Trend sườn phô mai =====
  {
    id: "M03", group: "mang", tone: "good", when: "day", cooldown: 10,
    if: { minDay: 9 }, npc: "bong",
    moment: "Theo trend sườn phô mai. Phô mai kéo sợi, khách kéo ghế.",
    nodes: {
      start: {
        mood: "surprised",
        line: "Chị ơi trên mạng đang trend cơm tấm sườn phô mai kéo sợi! Quán mình làm thử không chị?",
        me: "Sườn phô mai… mẹ mà biết chắc gọi điện hỏi thăm sức khoẻ tinh thần.",
        choices: [
          { id: "cheese", label: "Nhập phô mai, bán 3 ngày", hint: "−40k · món trend, khách trẻ tới thêm 3 ngày",
            say: "Nhập phô mai. Ba ngày tới quán thơm mùi sữa lẫn mùi than.", fx: { money: -40, hype: 1, mod: { id: "trend-pho-mai", days: 3, guests: { student: 1, student2: 1 } }, flag: "pho-mai", flagDays: 5 }, goto: "clip" },
          { id: "me", label: "Làm phiên bản của quán: sườn sốt me", hint: "−25k · hên xui 60% khen 'biết biến tấu', 40% chê 'không giống trend'",
            say: "Không phô mai, quán làm sườn sốt me. Chua chua ngọt ngọt, đúng vị Sài Gòn.", fx: { money: -25 },
            roll: { p: 0.6,
              win: { say: "Cư dân mạng khen 'quán biết biến tấu'. Sườn sốt me thành món riêng.", fx: { followers: 60, rep: 1 }, goto: "clip" },
              lose: { say: "Có người chê 'không giống trend'. Có người khen 'không giống trend mới hay'.", fx: { followers: 15 }, goto: "clip" } } },
          { id: "no", label: "Không chạy theo", hint: "Không tốn gì · +1 danh tiếng với khách quen",
            say: "Cơm tấm là cơm tấm. Trend tới rồi đi, sườn cháy cạnh vẫn ở lại.", fx: { rep: 1 } },
        ],
      },
      clip: {
        mood: "happy",
        line: "Chị cho em quay clip kéo sợi nha, em tập kéo cả buổi chiều rồi!",
        choices: [
          { id: "film", label: "Cho quay", hint: "Không tốn gì · hên xui 50% +120 người theo dõi, 50% phô mai không kéo sợi, clip thành meme",
            say: "Ba, hai, một, kéo!",
            roll: { p: 0.5,
              win: { say: "Sợi phô mai dài tới đầu hẻm. Clip lên xu hướng, Bông được gọi là 'thánh kéo'.", fx: { followers: 120, hype: 1 }, later: { id: "M04", days: 3 } },
              lose: { say: "Phô mai nguội, không kéo nổi một sợi. Clip thành meme 'phô mai đình công', quán vẫn nổi theo kiểu khác.", fx: { hype: 1, rep: -1 }, later: { id: "M04", days: 3 } } } },
          { id: "sell", label: "Bán trước, quay sau", hint: "Không tốn gì · +2 XP",
            say: "Bán cho khách trước, hết khách rồi quay. Clip ra trễ nhưng phô mai vẫn nóng trong lòng.", fx: { xp: 2 }, later: { id: "M04", days: 3 } },
        ],
      },
    },
  },

  // ===== M04 · Trend tàn =====
  {
    id: "M04", group: "mang", tone: "good", when: "shift",
    if: { chain: true }, who: "waiting",
    moment: "Trend tàn, phô mai còn. Đặt tên 'bản hoài niệm'.",
    nodes: {
      start: {
        mood: "surprised",
        line: "Ủa quán còn bán cái sườn phô mai đó hả {call}? Hết trend rồi mà.",
        me: "Trend tàn, phô mai còn nửa hộp trong tủ, nhìn mình như người yêu cũ.",
        choices: [
          { id: "sale", label: "Giảm còn 35k, bán nốt", hint: "Không tốn gì · bán hết phần còn lại (+30k)",
            say: "Giảm còn ba lăm, bán nốt. Phô mai ra đi thanh thản.", fx: { money: 30, unflag: "pho-mai" } },
          { id: "gift", label: "Tặng kèm dĩa thường", hint: "Không tốn gì · +1 danh tiếng",
            say: "Ai gọi dĩa thường được tặng một muỗng phô mai. Khách bất ngờ, phô mai được giải thoát.", fx: { rep: 1, unflag: "pho-mai" } },
          { id: "rename", label: "Đổi tên 'sườn phô mai bản hoài niệm'", hint: "Không tốn gì · hên xui 40% thành trend nhỏ thứ hai",
            say: "Từ nay món này tên 'sườn phô mai bản hoài niệm', ăn để nhớ một thời trend.",
            roll: { p: 0.4,
              win: { say: "Cái tên lên mạng, ai cũng tới ăn để 'hoài niệm'. Trend nhỏ thứ hai ra đời.", fx: { followers: 50, hype: 1, unflag: "pho-mai" } },
              lose: { say: "Không ai để ý cái tên, nhưng một chú khách quen gọi thử, khen 'lạ miệng'.", fx: { xp: 2, unflag: "pho-mai" } } } },
        ],
      },
    },
  },

  // ===== V01 · "Không bì" mà bì như tuyết =====
  {
    id: "V01", group: "viral", tone: "bad", when: "shift", priority: 3, cooldown: 3,
    if: VIRAL("biAnyway"), who: "lastServed",
    moment: "Lên mạng vì 'không bì' mà bì như tuyết. Từ nay phiếu 'không bì' dán đỏ.",
    nodes: {
      start: {
        mood: "annoyed",
        line: "Mọi người coi nè, 'không bì' mà bì phủ kín như tuyết. Quay lại cho cả nhà làm chứng nha {call}.",
        me: "Máy quay đang chĩa vô dĩa cơm, dĩa cơm đang chĩa vô lương tâm mình.",
        choices: [
          { id: "remake", label: "Xin lỗi, làm dĩa mới", hint: "−1 sườn ướp · clip thành 'quán sửa sai nhanh', +1 danh tiếng",
            say: "Quán xin lỗi, làm dĩa mới liền, không một sợi bì nào lọt vào.", fx: { stock: { "suon-uop": -1 }, rep: 1, followers: 20 } },
          { id: "trend", label: "Biến thành trend 'dĩa bì bão tuyết'", hint: "Không tốn gì · hên xui 50% quán hot +80 người theo dõi, 50% bị chê 'chủ quán cãi'",
            say: "Đây là dĩa bì bão tuyết, phiên bản giới hạn, chỉ dành cho người may mắn!",
            roll: { p: 0.5,
              win: { say: "Cư dân mạng cười ngất, 'dĩa bì bão tuyết' thành câu cửa miệng cả quận.", fx: { hype: 1, followers: 80 } },
              lose: { say: "Bình luận: 'Sai rồi còn cãi.' Quán mất hai điểm danh tiếng và một buổi tối vui.", fx: { rep: -2 } } } },
          { id: "extra", label: "Tặng thêm phần sườn", hint: "−1 sườn ướp · +2 danh tiếng",
            say: "Xin lỗi bằng một miếng sườn cháy cạnh. Bì thì gạt ra, sườn thì giữ lại.", fx: { stock: { "suon-uop": -1 }, rep: 2, freeWho: true } },
          { id: "sorry", label: "Xin lỗi, gạt bì giùm", hint: "Không tốn gì · không có gì thêm",
            say: "Quán xin lỗi, gạt bì ra giùm khách, hứa lần sau dán phiếu đỏ.", fx: { xp: 1 } },
        ],
      },
    },
  },

  // ===== V02 · Sườn than hoạt tính =====
  {
    id: "V02", group: "viral", tone: "bad", when: "shift", priority: 3, cooldown: 3,
    if: VIRAL("burnt"), who: "lastServed",
    moment: "Miếng sườn lên mạng với tên 'than hoạt tính'. Bếp than bị đặt biệt danh.",
    nodes: {
      start: {
        mood: "annoyed",
        line: "Sườn nướng than hay sườn LÀ than vậy mọi người? {Self} đang quay trực tiếp nè {call}.",
        me: "Miếng sườn đen tới mức máy quay phải tăng độ sáng.",
        choices: [
          { id: "swap", label: "Đổi miếng mới + xin lỗi", hint: "−1 sườn ướp · +1 danh tiếng",
            say: "Đổi miếng mới, cháy cạnh đúng chuẩn, kèm lời xin lỗi thật lòng.", fx: { stock: { "suon-uop": -1 }, rep: 1 } },
          { id: "brand", label: "Đặt tên 'sườn than hoạt tính', giảm 5k", hint: "Không tốn gì · hên xui 45% trend vui (quán hot, ca sau +3 khách), 55% bị chê 'không biết nướng'",
            say: "Món mới: sườn than hoạt tính, tốt cho… tinh thần, giảm năm ngàn hôm nay!",
            roll: { p: 0.45,
              win: { say: "Trend 'than hoạt tính' lan khắp nhóm ăn đêm. Ai cũng tới xin một miếng 'cháy vừa thôi'.", fx: { hype: 1, nextGuests: 3, followers: 40 } },
              lose: { say: "Review: 'Quán không biết nướng.' Bếp than buồn, cô chủ buồn hơn.", fx: { rep: -2 } } } },
          { id: "explain", label: "Giải thích 'do lửa bùng'", hint: "Không tốn gì · không có gì thêm",
            say: "Do lửa bùng thôi, chứ quán nướng cẩn thận lắm.", fx: { xp: 1 } },
        ],
      },
    },
  },

  // ===== V03 · Trứng đào xong lấp lại =====
  {
    id: "V03", group: "viral", tone: "bad", when: "shift", priority: 3, cooldown: 3,
    if: VIRAL("hardEgg"), who: "lastServed",
    moment: "Trứng lòng đào bị chê 'đào xong lấp lại'. Chảo được giao nhiệm vụ mới.",
    nodes: {
      start: {
        mood: "annoyed",
        line: "Trứng lòng đào của quán: đào xong lấp lại luôn rồi mọi người ơi.",
        me: "Quả trứng đã sống một cuộc đời quá đầy đủ trên chảo.",
        choices: [
          { id: "new", label: "Chiên trứng mới tặng", hint: "−1 trứng · +1 danh tiếng",
            say: "Chiên trứng mới, lòng đỏ chảy đúng lúc máy quay còn bật.", fx: { stock: { trung: -1 }, rep: 1 } },
          { id: "guess", label: "Thách khách 'đoán giờ chiên'", hint: "Không tốn gì · hên xui 50% vui (+60 người theo dõi), 50% bị chê 'lạc đề'",
            say: "Ai đoán đúng quả trứng này chiên mấy giây, quán tặng ly trà tắc!",
            roll: { p: 0.5,
              win: { say: "Bình luận đoán rần rần, có người đoán 'từ hôm qua'. Clip vui, quán vui.", fx: { followers: 60 } },
              lose: { say: "'Khách muốn trứng lòng đào, không muốn đố vui.' Quán mất một điểm danh tiếng.", fx: { rep: -1 } } } },
          { id: "discount", label: "Xin lỗi, giảm 6k", hint: "Không tốn gì · không có gì thêm",
            say: "Quán xin lỗi, bớt sáu ngàn, lần sau canh chảo kỹ hơn.", fx: { xp: 1 } },
        ],
      },
    },
  },

  // ===== V04 · Cơm tấm đi bơi =====
  {
    id: "V04", group: "viral", tone: "bad", when: "shift", priority: 3, cooldown: 3,
    if: VIRAL("sauceMixed"), who: "lastServed",
    moment: "Cơm tấm đi bơi. Từ nay chén nước mắm có ghế riêng.",
    nodes: {
      start: {
        mood: "annoyed",
        line: "Dặn để riêng. Cơm tấm của {self} đang đi bơi nè mọi người.",
        me: "Hạt cơm đang bơi ngửa trong hồ nước mắm.",
        choices: [
          { id: "remake", label: "Làm dĩa mới, chén riêng", hint: "−1 sườn ướp · +1 danh tiếng",
            say: "Dĩa mới, nước mắm ngồi chén riêng, không ai được bơi nữa.", fx: { stock: { "suon-uop": -1 }, rep: 1 } },
          { id: "pool", label: "Biến thành 'cơm tấm hồ bơi' có công thức", hint: "Không tốn gì · hên xui 40% thành trend nhỏ, 60% bớt danh tiếng",
            say: "Đây là món mới: cơm tấm hồ bơi, công thức bí mật là… lỡ tay.",
            roll: { p: 0.4,
              win: { say: "Trend nhỏ 'cơm tấm hồ bơi' ra đời, có người xin 'cho em một hồ bơi'.", fx: { hype: 1, followers: 40 } },
              lose: { say: "'Không vui đâu quán.' Khách văn phòng nghiêm túc, quán nghiêm túc xin lỗi.", fx: { rep: -1 } } } },
          { id: "tea", label: "Tặng ly trà tắc, xin lỗi", hint: "−2k · +1 danh tiếng",
            say: "Ly trà tắc kèm lời xin lỗi. Mặn quá thì uống trà cho cân bằng.", fx: { money: -2, rep: 1 } },
          { id: "sorry", label: "Xin lỗi, chắt bớt nước mắm", hint: "Không tốn gì · không có gì thêm",
            say: "Quán xin lỗi, chắt bớt nước mắm, lần sau nhớ chén riêng.", fx: { xp: 1 } },
        ],
      },
    },
  },

  // ===== V05 · Bưng nhầm bàn =====
  {
    id: "V05", group: "viral", tone: "bad", when: "shift", priority: 3, cooldown: 3,
    if: VIRAL("wrongTable"), who: "lastServed",
    moment: "Bưng nhầm bàn. Hai bàn thành bạn, một dĩa cơm thành câu chuyện.",
    nodes: {
      start: {
        mood: "annoyed",
        line: "Dĩa của mình đang được bàn bên ăn rất ngon miệng. Mọi người coi nè.",
        me: "Dĩa đi lạc, bàn bên đã ăn được một nửa, còn khen ngon.",
        choices: [
          { id: "remake", label: "Làm dĩa mới gấp cho bàn đúng", hint: "−1 sườn ướp · chuyện còn tiếp…",
            say: "Quán xin lỗi, làm dĩa mới gấp, ưu tiên số một.", fx: { stock: { "suon-uop": -1 } }, goto: "pay" },
          { id: "share", label: "Cười trừ 'chia sẻ là hạnh phúc'", hint: "Không tốn gì · hên xui 40% hai bàn cười, cụng ly trà (quán hot), 60% −2 danh tiếng",
            say: "Chia sẻ là hạnh phúc mà, hai bàn làm quen nhau luôn đi!",
            roll: { p: 0.4,
              win: { say: "Hai bàn cười to, cụng ly trà đá. Clip tên 'quán mai mối bằng dĩa cơm'.", fx: { hype: 1, followers: 30 } },
              lose: { say: "'Không buồn cười đâu.' Bàn đúng vẫn đói, quán mất hai điểm danh tiếng.", fx: { rep: -2 } } } },
        ],
      },
      pay: {
        mood: "neutral",
        line: "Bàn ăn nhầm quay qua hỏi: 'Vậy giờ tụi anh trả dĩa đó không chị?'",
        choices: [
          { id: "free", label: "Không tính, coi như quán mời", hint: "Không tốn gì · +2 danh tiếng cả hai bàn",
            say: "Dĩa đó quán mời. Ăn ngon là quán vui rồi.", fx: { rep: 2 } },
          { id: "charge", label: "Tính như thường, họ đã ăn mà", hint: "Không tốn gì · hên xui 70% họ trả vui vẻ (+25k)",
            say: "Dạ anh ăn rồi thì anh trả giúp quán nha, quán cảm ơn.",
            roll: { p: 0.7,
              win: { say: "Bàn đó trả tiền vui vẻ: 'Dĩa đi lạc mà ngon thì đáng tiền.'", fx: { money: 25 } },
              lose: { say: "Bàn đó cằn nhằn 'tại quán bưng nhầm', rồi vẫn trả, mặt hơi nhăn.", fx: { money: 25, rep: -1 } } } },
        ],
      },
    },
  },

  // ===== V06 · Phiếu tính tiền 450 ngàn =====
  {
    id: "V06", group: "viral", tone: "bad", when: "day", priority: 3, cooldown: 4,
    if: { sum: { mistake: "wrongBill" } }, npc: "cu-dan-mang",
    moment: "Phiếu tính tiền lên mạng. Hoá ra cộng nhầm một khăn lạnh thành 200 ngàn.",
    nodes: {
      start: {
        mood: "surprised",
        line: "Bài đăng trong nhóm ăn uống: 'Dĩa cơm tấm vỉa hè 450 ngàn??? (ảnh phiếu tính tiền)'. Đã có hai trăm bình luận.",
        me: "Nhìn kỹ ảnh: con số khăn lạnh hôm qua có thêm hai số không bị lạc.",
        choices: [
          { id: "refund", label: "Xin lỗi, đăng ảnh phiếu đúng + hoàn tiền", hint: "−30k · +1 danh tiếng, từ nay phiếu hiện tổng to hơn",
            say: "Quán xin lỗi công khai, đăng ảnh phiếu đúng, hoàn tiền dư. Bình luận dịu xuống.", fx: { money: -30, rep: 1, flag: "phieu-to", flagDays: 30 } },
          { id: "invite", label: "Mời khách quay lại ăn miễn phí", hint: "Không tốn gì hôm nay · ca tới giữ ≥ 4 sao thì +2 danh tiếng",
            say: "Mời anh chị quay lại, dĩa này quán mời, hứa tính tiền bằng máy.", fx: { group: { roles: ["office", "office"], okStars: 4, label: "Khách phiếu 450 ngàn", flagOk: "v06-ok" }, rep: 1 } },
          { id: "joke", label: "Giải thích 'do khăn lạnh'", hint: "Không tốn gì · hên xui 30% cư dân mạng bật cười, 70% −2 danh tiếng",
            say: "Dạ do cái khăn lạnh, nó được cộng nhầm thành hai trăm ngàn.",
            roll: { p: 0.3,
              win: { say: "Cư dân mạng cười: 'Khăn lạnh hạng thương gia.' Câu chuyện thành vui.", fx: { followers: 40 } },
              lose: { say: "'Đổ lỗi cho khăn lạnh à?' Bài đăng nóng thêm một ngày.", fx: { rep: -2 } } } },
        ],
      },
    },
  },

  // ===== V07 · Khách tự lau bàn =====
  {
    id: "V07", group: "viral", tone: "bad", when: "shift", priority: 3, cooldown: 3,
    if: VIRAL("dirtyTable"), who: "lastServed",
    moment: "Khách tự lau bàn và quay clip. Được mời làm nhân viên danh dự.",
    nodes: {
      start: {
        mood: "annoyed",
        line: "Quán này phục vụ kiểu mới: khách tự lau bàn. {Self} quay lại làm kỷ niệm nha {call}.",
        me: "Khăn lau bàn đang nằm trong tay khách. Tay khách đang cầm luôn điện thoại.",
        choices: [
          { id: "wipe", label: "Chạy ra lau ngay + tặng trà tắc", hint: "−2k · +1 danh tiếng",
            say: "Chạy ra lau bàn, tặng ly trà tắc, cúi đầu xin lỗi.", fx: { money: -2, rep: 1, cleanTables: true } },
          { id: "staff", label: "Cảm ơn khách 'nhân viên tháng này'", hint: "Không tốn gì · hên xui 50% khách cười +60 người theo dõi, 50% −2 danh tiếng",
            say: "Xin trân trọng giới thiệu nhân viên xuất sắc tháng này!",
            roll: { p: 0.5,
              win: { say: "Khách cười, đăng clip 'tôi được phong nhân viên tháng'. Quán nổi một cách dễ thương.", fx: { followers: 60 } },
              lose: { say: "'Đùa vậy không vui.' Bàn kế bên gật gù đồng ý. Quán mất hai điểm.", fx: { rep: -2 } } } },
          { id: "sorry", label: "Xin lỗi, giảm 5k", hint: "Không tốn gì · không có gì thêm",
            say: "Quán xin lỗi, bớt năm ngàn, hứa lau bàn trước khi mời ngồi.", fx: { xp: 1 } },
        ],
      },
    },
  },

  // ===== V08 · Mỡ hành nghỉ phép =====
  {
    id: "V08", group: "viral", tone: "bad", when: "shift", priority: 3, cooldown: 3,
    if: VIRAL("noMoHanh"), who: "lastServed",
    moment: "Mỡ hành nghỉ phép không báo trước. Cả mạng xã hội hỏi thăm mỡ hành.",
    nodes: {
      start: {
        mood: "annoyed",
        line: "Cơm tấm không mỡ hành là cơm tấm đang buồn. Mọi người nhìn hạt cơm khô chưa nè.",
        me: "Hũ mỡ hành ở ngay đó, chỉ là tay mình quên mất nó.",
        choices: [
          { id: "add", label: "Rưới mỡ hành gấp đôi", hint: "Không tốn gì · +1 danh tiếng",
            say: "Rưới mỡ hành gấp đôi, xin lỗi gấp ba.", fx: { rep: 1 } },
          { id: "letter", label: "Đăng 'thư xin lỗi của mỡ hành'", hint: "Không tốn gì · hên xui 50% quán hot +70 người theo dõi, 50% bị chê làm màu",
            say: "Mỡ hành xin lỗi quý khách, hôm nay mỡ hành ngủ quên trong hũ.",
            roll: { p: 0.5,
              win: { say: "'Thư xin lỗi của mỡ hành' được chia sẻ khắp nơi. Ai cũng thương hũ mỡ hành.", fx: { hype: 1, followers: 70 } },
              lose: { say: "'Làm màu.' Có người nói vậy. Quán im lặng rưới mỡ hành đầy đủ.", fx: { rep: -1 } } } },
        ],
      },
    },
  },

  // ===== V09 · Bốn dĩa đúng, đúng của người khác =====
  {
    id: "V09", group: "viral", tone: "bad", when: "shift", priority: 3, cooldown: 3,
    if: VIRAL("swapped"), who: "lastServed",
    moment: "Bàn bốn người, bốn dĩa đúng, sai bốn chỗ. Cả bàn chơi trò đổi dĩa.",
    nodes: {
      start: {
        mood: "surprised",
        line: "Dĩa của {self} nằm trước mặt người khác nè. Cả bàn đang chơi trò đổi dĩa, quay lại cho vui.",
        me: "Dĩa đúng bàn, sai người. Như thư gửi đúng nhà, sai phòng.",
        choices: [
          { id: "swap", label: "Chạy ra đổi dĩa giùm", hint: "Không tốn gì · +1 danh tiếng",
            say: "Chạy ra đổi dĩa, gọi đúng tên từng người, xin lỗi từng người.", fx: { rep: 1, away: 3000 } },
          { id: "game", label: "Tuyên bố 'trò chơi đổi dĩa' có thưởng", hint: "Không tốn gì · hên xui 50% vui +50 người theo dõi, 50% bị chê",
            say: "Bàn nào đổi dĩa nhanh nhất được tặng trà tắc!",
            roll: { p: 0.5,
              win: { say: "Cả bàn đổi dĩa như chơi trò ghế âm nhạc. Clip vui, quán vui.", fx: { followers: 50, teaAll: true } },
              lose: { say: "'Tự làm sai rồi bắt khách chơi?' Quán xin lỗi, đổi dĩa nghiêm túc.", fx: { rep: -1 } } } },
        ],
      },
    },
  },

  // ===== V10 · Trà đá trong trí tưởng tượng =====
  {
    id: "V10", group: "viral", tone: "bad", when: "shift", priority: 3, cooldown: 3,
    if: VIRAL("noTea"), who: "lastServed",
    moment: "Ly trà rỗng lên mạng. Từ nay bình trà đá được đặt giữa mọi bàn.",
    nodes: {
      start: {
        mood: "annoyed",
        line: "Ly trà đá của {self} rỗng từ đầu bữa, như ví cuối tháng. Mọi người coi nè {call}.",
        me: "Ly trà rỗng được quay cận cảnh, đá tan hết từ lâu.",
        choices: [
          { id: "pour", label: "Châm trà mọi bàn ngay", hint: "Không tốn gì · +1 danh tiếng",
            say: "Châm trà một vòng mọi bàn, ly nào cũng đầy tới miệng.", fx: { teaAll: true, rep: 1 } },
          { id: "jug", label: "Đặt nguyên bình trà lên bàn 'tự phục vụ hạng sang'", hint: "Không tốn gì · hên xui 60% khách thích, 40% bị chê lười",
            say: "Bình trà riêng cho bàn, uống bao nhiêu tuỳ thích.",
            roll: { p: 0.6,
              win: { say: "Khách thích quá: 'Quán chu đáo!' Clip đổi tên thành 'bình trà vô tận'.", fx: { followers: 40, teaAll: true } },
              lose: { say: "'Lười châm thì nói lười.' Quán cười trừ, vẫn châm trà tận tay.", fx: { rep: -1, teaAll: true } } } },
        ],
      },
    },
  },
];
