// Sự kiện Đời thường D01–D08 và Đặc biệt X01–X05, F01 (docs/quan-com-tam/DRAMA.md §2.5). Cấu trúc: xem chú thích đầu data/events.js.
// "Đội trật tự khu phố", "tổ dân phố" là vai chung, hiền và vui, không gắn tên cơ quan nào. Công ty, người đều hư cấu, không emoji.

export const EVENTS_DOI = [
  // ===== D01 · Mẹ gọi =====
  {
    id: "D01", group: "doi", tone: "good", when: "day", w: 1.5, cooldown: 4,
    if: { minDay: 2 }, npc: "me",
    moment: "Mẹ hỏi ăn cơm chưa. Bán bốn chục dĩa, ăn được ba miếng cơm cháy đáy nồi.",
    nodes: {
      start: {
        mood: "neutral",
        line: "Alo, mẹ nè. Bán cơm cả ngày mà con ăn cơm chưa?",
        alt: [{ flags: ["lo-hom-qua"], line: "Alo, mẹ nè. Nghe giọng là biết hôm qua bán ế. Mà con ăn cơm chưa đã?", mood: "neutral" }],
        me: "Câu hỏi khó nhất trong ngày, khó hơn tính tiền bàn bốn người.",
        choices: [
          { id: "truth", label: "Nói thật: chưa", hint: "Không tốn gì · mẹ gửi hũ mắm ruốc, ca tới khách thoải mái hơn",
            say: "Dạ chưa mẹ. Mẹ im một giây, rồi nói 'mai mẹ gửi hũ mắm ruốc lên'.", fx: { mod: { id: "mam-ruoc-me", days: 1, patience: 5 }, xp: 2 } },
          { id: "lie", label: "Nói ăn rồi", hint: "Không tốn gì · mẹ không tin, gọi lại hai lần",
            say: "Dạ con ăn rồi mẹ. Mẹ hỏi 'ăn gì', con nói 'cơm', mẹ hỏi 'cơm gì'. Mẹ gọi lại hai lần nữa.", fx: { xp: 1 } },
          { id: "tell", label: "Kể chuyện quán", hint: "Không tốn gì · +1 danh tiếng, mẹ khoe xóm, ca tới +1 khách",
            say: "Kể mẹ nghe chuyện Chú Tư, chuyện Anh Sáu, chuyện con mèo. Mẹ cười, đi khoe cả xóm.", fx: { rep: 1, nextGuests: 1 } },
        ],
      },
    },
  },

  // ===== D02 · Mẹ ghé dọn bàn =====
  {
    id: "D02", group: "doi", tone: "good", when: "shift", cooldown: 5,
    if: { minDay: 6, phase: "cao", dirtyMin: 2 }, npc: "me",
    moment: "Mẹ ghé dọn bàn. Dọn nhanh hơn con, và nói ra điều đó ba lần.",
    nodes: {
      start: {
        mood: "happy",
        line: "Mẹ ghé chơi thôi… mà bàn dơ vầy sao được. Để mẹ dọn bàn cho!",
        me: "Mẹ xắn tay áo, nhanh hơn cả lúc mình kịp nói 'mẹ ngồi nghỉ đi'.",
        choices: [
          { id: "help", label: "Cho mẹ phụ", hint: "Không tốn gì · 60 giây mẹ tự dọn bàn, rửa dĩa",
            say: "Mẹ phụ con một lát nha. Mẹ dọn nhanh hơn con, và nói ra điều đó ba lần.", fx: { helper: 60000, cleanTables: true }, goto: "mam" },
          { id: "sit", label: "Mời mẹ ngồi ăn", hint: "Không tốn gì · mẹ ngồi coi và bình luận",
            say: "Mẹ ngồi ăn dĩa cơm con nướng. Mẹ nhai chậm, gật đầu đúng một lần.", fx: { xp: 2 } },
        ],
      },
      mam: {
        mood: "annoyed",
        line: "Mẹ nếm chén nước mắm, nhăn mặt: 'Nước mắm con pha hơi ngọt.'",
        choices: [
          { id: "fix", label: "Để mẹ pha lại", hint: "Không tốn gì · nước mắm hôm nay ngon hơn, khách quen khen",
            say: "Mẹ pha lại, nêm bằng mắt, không bao giờ sai. Khách quen hỏi 'hôm nay đổi nước mắm hả'.", fx: { rep: 1, patience: 4000 } },
          { id: "mine", label: "Cảm ơn, giữ công thức của con", hint: "Không tốn gì · hên xui 50% mẹ khen 'cũng được', 50% mẹ im lặng đầy ý nghĩa",
            say: "Con giữ công thức của con nha mẹ, khách quen rồi.",
            roll: { p: 0.5,
              win: { say: "Mẹ nếm lần nữa: 'Ờ… cũng được.' Đó là lời khen cao nhất của mẹ.", fx: { xp: 3 } },
              lose: { say: "Mẹ không nói gì, chỉ đặt chén nước mắm xuống thật nhẹ. Im lặng nặng hơn lời chê.", fx: { xp: 1 } } } },
        ],
      },
    },
  },

  // ===== D03 · Khói bay qua tiệm may =====
  {
    id: "D03", group: "doi", tone: "mixed", when: "day", cooldown: 5,
    if: { minDay: 4, anyFlags: ["smoke-high", "khoi-cao"], notOwns: "hut-khoi" }, npc: "co-lan",
    moment: "Hàng xóm kêu khói. Quán xin lỗi bằng một hộp sườn cháy cạnh.",
    nodes: {
      start: {
        mood: "annoyed",
        line: "Khói bếp con bay qua ám hết áo dài khách cô gửi may! Cô giặt lại ba bộ rồi đó con.",
        me: "Áo dài thơm mùi sườn nướng… nghe cũng không tệ, nhưng chắc khách cô không nghĩ vậy.",
        choices: [
          { id: "hood", label: "Mua quạt hút khói nhỏ", hint: "−80k · khói ít hẳn, hết phàn nàn, +2 danh tiếng",
            say: "Lắp quạt hút khói. Khói bay lên trời thay vì bay qua tiệm may.", fx: { money: -80, decor: "hut-khoi", rep: 2, flag: "lan-vui", flagDays: 6 }, later: { id: "D04", days: 3 } },
          { id: "box", label: "Tặng cô hộp cơm mỗi tối 5 ngày", hint: "−5 sườn ướp · hên xui 70% cô vui, 30% cô vẫn ngửi khói",
            say: "Mỗi tối quán gửi cô một hộp sườn cháy cạnh.", fx: { stock: { "suon-uop": -5 } },
            roll: { p: 0.7,
              win: { say: "Cô Lan nhận hộp cơm, mắt sáng lên. Hoá ra cô thích nhất là sườn cháy cạnh.", fx: { flag: "lan-vui", flagDays: 6 }, later: { id: "D04", days: 3 } },
              lose: { say: "Cô Lan nhận hộp cơm, cảm ơn, nhưng vẫn đóng cửa sổ thật mạnh mỗi tối.", fx: { flag: "lan-gian", flagDays: 6 }, later: { id: "D04", days: 3 } } } },
          { id: "move", label: "Dời bếp sang đầu kia vỉa hè", hint: "Không tốn gì · khói không qua tiệm may, 3 ngày tới khách chờ kém 5% vì cô chủ đi xa hơn",
            say: "Dời bếp sang đầu kia. Khói đi đường khác, cô chủ thì đi đường xa hơn.", fx: { mod: { id: "doi-bep", days: 3, patience: -5 }, flag: "lan-vui", flagDays: 6 }, later: { id: "D04", days: 3 } },
        ],
      },
    },
  },

  // ===== D04 · Cô Lan quay lại =====
  {
    id: "D04", group: "doi", tone: "good", when: "day",
    if: { chain: true }, npc: "co-lan",
    moment: "Cô Lan từ người kêu khói thành người chấm món. Bí mật: cô thích sườn cháy cạnh.",
    nodes: {
      start: {
        mood: "happy",
        line: "Mấy bữa nay đỡ khói rồi con. Mà… hộp sườn cháy cạnh bữa trước ngon quá, cô hỏi nhỏ thôi.",
        alt: [{ flags: ["lan-gian"], line: "Cô nói thiệt, khói vẫn còn đó con. Cô không muốn làm lớn chuyện, nhưng khách cô than hoài.", mood: "annoyed" }],
        me: "Cô Lan đứng ngay cửa, nửa giận nửa đói.",
        choices: [
          { id: "taster", label: "Mời cô làm 'khách nếm món mới'", hint: "Không tốn gì · món mới nào cũng có lời khen đầu tiên từ cô",
            need: { noFlags: ["lan-gian"] },
            say: "Từ nay cô là khách nếm món chính thức của quán. Lương trả bằng sườn cháy cạnh.", fx: { rep: 2, flag: "lan-nem", flagDays: 30, unflag: "lan-vui" } },
          { id: "look", label: "Mời cô qua coi bếp", hint: "Chuyện còn tiếp…",
            say: "Cô qua coi con nướng một lần, coi khói đi đâu, rồi mình tính tiếp.", goto: "see" },
          { id: "hood", label: "Mua quạt hút khói ngay", hint: "−80k · hết phàn nàn",
            need: { flags: ["lan-gian"] },
            say: "Lắp quạt hút khói liền trong ngày. Cô Lan đứng coi thợ lắp, gật gù.", fx: { money: -80, decor: "hut-khoi", rep: 1, unflag: "lan-gian" } },
        ],
      },
      see: {
        mood: "neutral",
        line: "Cô Lan đứng sau bếp, coi cô chủ quạt than, lật sườn, gom khói. Cô im lặng một hồi lâu.",
        choices: [
          { id: "explain", label: "Chỉ cô cách quạt khói bay lên", hint: "Không tốn gì · hên xui 60% cô hiểu thành khách quen, 40% cô báo tổ dân phố",
            say: "Quạt nghiêng một chút, khói đi lên trời, không đi qua tiệm may.",
            roll: { p: 0.6,
              win: { say: "Cô Lan gật gù: 'Vất vả vậy hả con.' Từ đó tối nào cô cũng ghé mua một hộp.", fx: { rep: 1, mod: { id: "lan-khach-quen", days: 10, guests: { office: 1 } }, unflag: ["lan-gian", "lan-vui"] } },
              lose: { say: "Cô Lan vẫn thấy khói, nhắn tổ dân phố nhờ nói giùm. Không ai giận ai, chỉ là khói hơi nhiều.", fx: { unflag: ["lan-gian", "lan-vui"], flag: "nhac-via-he", flagDays: 4 } } } },
          { id: "thanks", label: "Cảm ơn cô đã qua", hint: "Không tốn gì · +1 XP",
            say: "Cảm ơn cô đã qua coi. Con sẽ cố gắng gom khói gọn hơn.", fx: { xp: 1, unflag: ["lan-gian", "lan-vui"] } },
        ],
      },
    },
  },

  // ===== D05 · Ví bỏ quên =====
  {
    id: "D05", group: "doi", tone: "good", when: "shift", cooldown: 6,
    if: { minDay: 3 }, npc: "owner",
    moment: "Giữ ví cho khách. Trong ví có ảnh em bé và phiếu ăn cơm tấm của quán.",
    nodes: {
      start: {
        mood: "surprised",
        line: "Khách vừa đi, để quên cái ví trên ghế. Ví dày, có ảnh một em bé cười móm.",
        me: "Ví này chắc nặng tiền, nhưng chắc nặng nhất là cái ảnh.",
        choices: [
          { id: "keep", label: "Cất vào hộp tiền, ghi giờ", hint: "Không tốn gì · chờ chủ ví quay lại",
            say: "Cất ví vô hộp tiền, ghi giờ, ghi cả màu áo người khách.", goto: "claim" },
          { id: "run", label: "Chạy theo ra đầu hẻm", hint: "Không tốn gì · cô chủ rời quán 10 giây (bếp vẫn chạy!), hên xui 50% kịp trả",
            say: "Cô chủ chạy ra đầu hẻm, vừa chạy vừa gọi 'anh ơi, cái ví!'", fx: { away: 10000 },
            roll: { p: 0.5,
              win: { say: "Kịp! Anh khách quay lại, cảm ơn rối rít: 'Mai anh dắt cả xưởng tới ăn.'", fx: { rep: 2 }, later: { id: "D06", days: 1 } },
              lose: { say: "Không kịp, xe đã rẽ. Đành cất ví vào hộp tiền, chờ người tới nhận.", goto: "claim" } } },
          { id: "quang", label: "Nhờ Anh Quang giữ giùm", hint: "Không tốn gì · an toàn, không có gì thêm",
            say: "Nhờ Anh Quang giữ giùm. Anh nhận ví hai tay, như nhận giấy khen.", fx: { xp: 2 } },
        ],
      },
      claim: {
        mood: "surprised",
        line: "Chút sau có hai người cùng tới nhận cái ví, ai cũng nói 'ví của tôi'.",
        choices: [
          { id: "photo", label: "Hỏi ảnh trong ví là ai", hint: "Không tốn gì · đúng chủ, chủ ví hẹn quay lại",
            say: "Ảnh trong ví là ai vậy anh? Người thật mắt rưng rưng: 'Con gái tôi, ba tuổi.'", fx: { rep: 1 }, later: { id: "D06", days: 1 } },
          { id: "first", label: "Đưa người tới trước", hint: "Không tốn gì · hên xui 50% đúng, 50% sai và phải nhờ Anh Quang",
            say: "Ai tới trước thì nhận trước.",
            roll: { p: 0.5,
              win: { say: "Đúng chủ. Anh khách cảm ơn rồi hẹn mai quay lại.", fx: { xp: 2 }, later: { id: "D06", days: 1 } },
              lose: { say: "Sai người. Người thật tới sau, phải nhờ Anh Quang tìm lại. Một buổi tối hơi rối.", fx: { rep: -2 } } } },
        ],
      },
    },
  },

  // ===== D06 · Chủ ví quay lại =====
  {
    id: "D06", group: "doi", tone: "good", when: "shift",
    if: { chain: true }, npc: "chu-vi",
    moment: "Trả ví hôm qua, hôm nay có đơn mười lăm phần. Lòng tốt có lãi.",
    nodes: {
      start: {
        mood: "happy",
        line: "Hôm qua anh tưởng mất hết giấy tờ. Xưởng anh đặt mười lăm phần ca tới, không mặc cả!",
        me: "Lòng tốt quay về dưới dạng mười lăm dĩa cơm. Hiếm có khoản đầu tư nào lãi vậy.",
        choices: [
          { id: "order", label: "Nhận 15 phần", hint: "Cọc +70k · ca tới thợ xưởng tới thành nhiều bàn, +1 danh tiếng",
            say: "Nhận mười lăm phần, cọc trước, mai than đỏ sớm.", fx: { money: 70, rep: 1, preorder: { id: "D06", n: 15, arch: "worker", days: 1, label: "Xưởng anh Tâm", okStars: 3 } } },
          { id: "gift", label: "Tặng dĩa, cảm ơn lại", hint: "Không tốn gì · +2 danh tiếng",
            say: "Dĩa hôm nay quán mời anh. Cảm ơn anh đã tin quán.", fx: { rep: 2 } },
          { id: "review", label: "Nhận, mời đánh giá quán", hint: "Cọc +70k · thêm người theo dõi",
            say: "Anh đánh giá giúp quán vài chữ nha, quán cảm ơn nhiều.", fx: { money: 70, followers: 30, preorder: { id: "D06", n: 15, arch: "worker", days: 1, label: "Xưởng anh Tâm", okStars: 3 } } },
        ],
      },
    },
  },

  // ===== D07 · Đêm bóng đá =====
  {
    id: "D07", group: "doi", tone: "good", when: "shift", cooldown: 7,
    if: { kind: "toi", phase: "khuya" }, w: 0.7, who: "waiting",
    moment: "Đêm bóng đá. Đội nhà thắng, quán hết sạch trà đá.",
    nodes: {
      start: {
        mood: "happy",
        line: "Tối nay có trận! Quán có ti vi không {call}? Cả hẻm đang đi tìm chỗ coi nè.",
        me: "Ti vi thì không, nhưng có ghế nhựa, có sườn, có trà đá. Còn thiếu đúng trái bóng.",
        choices: [
          { id: "tv", label: "Mở ti vi cũ, kê thêm ghế", hint: "Không tốn gì · thêm 4 khách khuya, khói +10, hên xui 50% đội nhà thắng (cả quán gọi thêm)",
            need: { owns: "old-tv" },
            say: "Mở ti vi cũ, kê thêm ghế, cả hẻm ngồi nín thở.", fx: { guests: 4, smoke: 10 },
            roll: { p: 0.5,
              win: { say: "Đội nhà thắng! Cả quán hét to, gọi thêm trà đá, thêm cơm, thêm sườn.", fx: { money: 40, hype: 1 } },
              lose: { say: "Đội nhà thua. Cả quán ăn lặng lẽ, chỉ nghe tiếng muỗng và tiếng thở dài.", fx: { xp: 2 } } } },
          { id: "radio", label: "Mở radio", hint: "Không tốn gì · thêm 2 khách",
            say: "Mở radio tường thuật, giọng bình luận viên át cả tiếng sườn xèo.", fx: { guests: 2 }, goto: "score" },
          { id: "borrow", label: "Mượn ti vi nhà Cô Lan", hint: "Không tốn gì · hên xui 60% cô cho mượn (+1 danh tiếng, thêm khách)",
            say: "Cô Lan ơi, cho con mượn cái ti vi một tối nha cô.",
            roll: { p: 0.6,
              win: { say: "Cô Lan cho mượn, còn ngồi coi chung. Đội nhà ghi bàn, cô Lan hét to nhất.", fx: { rep: 1, guests: 3 } },
              lose: { say: "Cô Lan đang coi cải lương, không cho mượn. Quán bán bình thường, nghe hẻm hét theo từng pha bóng.", fx: { xp: 1 } } } },
          { id: "normal", label: "Bán bình thường", hint: "Không tốn gì · không có gì thêm",
            say: "Quán bán bình thường. Ai coi bóng thì coi, ai ăn cơm thì ăn.", fx: { xp: 1 }, goto: "score" },
        ],
      },
      score: {
        mood: "happy",
        line: "Hiệp hai, đội nhà ghi bàn! Cả hẻm hét lên, một chú đập bàn làm nảy cả chén nước mắm.",
        choices: [
          { id: "cheer", label: "Hét theo, tặng trà đá mừng bàn thắng", hint: "Không tốn gì · châm trà mọi bàn, quán hot lên",
            say: "Mừng bàn thắng, trà đá miễn phí một vòng!", fx: { teaAll: true, hype: 1 } },
          { id: "calm", label: "Nhắc nhẹ giữ chén nước mắm", hint: "Không tốn gì · +1 XP",
            say: "Mừng thì mừng, nhưng thương chén nước mắm giùm quán nha.", fx: { xp: 1 } },
        ],
      },
    },
  },

  // ===== D08 · Nhận nuôi mèo =====
  {
    id: "D08", group: "doi", tone: "good", when: "day", once: true,
    if: { chain: true }, npc: "co-ut",
    moment: "Quán có mèo. Mèo có tên. Tên là {catName}.",
    nodes: {
      start: {
        mood: "happy",
        line: "Con mèo vàng nằm trên ghế đẩu cạnh bếp từ sáng tới giờ đó con. Nó chọn quán mình rồi.",
        me: "Nó nằm đúng chỗ ấm nhất, như đã thuộc bản đồ quán.",
        choices: [
          { id: "adopt", label: "Nhận nuôi, đặt tên", hint: "−15k mua chén · mèo ngồi cạnh bếp mỗi ca, khách thích",
            say: "Nhận nuôi. Mua cái chén nhỏ, đặt tên, mèo nhận tên bằng một cái ngáp.", fx: { money: -15, catName: true, decor: "meo-vang", flag: "meo-nuoi", flagDays: 365, mod: { id: "meo-quan", days: 30, guests: 1 } } },
          { id: "feed", label: "Cho ăn nhưng không nuôi", hint: "Không tốn gì · mèo ghé thỉnh thoảng",
            say: "Cho ăn khi nó ghé. Mèo tự do, quán cũng tự do.", fx: { xp: 2 } },
          { id: "lan", label: "Gửi Cô Lan nuôi", hint: "Không tốn gì · hên xui 50% cô nhận",
            say: "Gửi Cô Lan nuôi giùm, tiệm may có chỗ ấm.",
            roll: { p: 0.5,
              win: { say: "Cô Lan nhận nuôi, đặt tên theo một loại vải. Mèo ghé quán mỗi tối như thăm nhà ngoại.", fx: { rep: 1 } },
              lose: { say: "Cô Lan dị ứng lông mèo. Mèo vẫn chọn nằm cạnh bếp quán.", fx: { xp: 1 } } } },
        ],
      },
    },
  },

  // ===== X01 · Nhắc vỉa hè gọn =====
  {
    id: "X01", group: "dac-biet", tone: "good", when: "shift", cooldown: 5,
    if: { minLevel: 3, stage: "street", kind: "toi", phase: "khuya", noFlags: ["vach-son"] }, npc: "anh-quang",
    moment: "Được nhắc vỉa hè gọn. Người nhắc ăn hết dĩa cơm rồi mới dám nhắc.",
    nodes: {
      start: {
        mood: "neutral",
        line: "Chị ơi… mai có đợt nhắc vỉa hè gọn. Chị kéo bàn vô trong vạch sơn giùm em nha. Em nhắc vậy thôi, em ăn xong rồi mới nói.",
        alt: [{ flags: ["nhac-via-he"], line: "Chị ơi… Cô Lan bên tiệm may nhờ em nói giùm chuyện khói với bàn ghế. Em ăn xong rồi mới dám nói, chị đừng buồn nha.", mood: "neutral" }],
        me: "Anh Quang lau miệng, ngại ngùng như học trò nộp bài trễ.",
        choices: [
          { id: "pull", label: "Kéo bàn vô ngay", hint: "Không tốn gì · khách mới chờ thêm chút, +2 danh tiếng",
            say: "Kéo bàn vô ngay. Anh Quang phụ khiêng, còn xin lỗi cái ghế vì làm nó trầy.", fx: { rep: 2, pauseGuests: 8000, flag: "vach-son", flagDays: 4 }, later: { id: "X02", days: 3 } },
          { id: "tea", label: "Mời anh ly trà, hứa mai kéo", hint: "Không tốn gì · hên xui 70% anh vui, 30% mai anh nhắc lại",
            say: "Anh uống ly trà đã, mai chị kéo vô sớm.",
            roll: { p: 0.7,
              win: { say: "Anh Quang uống trà, gật đầu, đi tuần tiếp với cái bụng no.", fx: { xp: 2 } },
              lose: { say: "Mai Anh Quang ghé lại, ăn thêm dĩa cơm, rồi nhắc lại y câu cũ.", fx: { xp: 1 }, later: { id: "X01", days: 1 } } } },
          { id: "where", label: "Hỏi 'vạch sơn ở đâu em?'", hint: "Chuyện còn tiếp…",
            say: "Vạch sơn ở đâu vậy em? Chị bán ở đây hai năm chưa thấy.", goto: "line" },
        ],
      },
      line: {
        mood: "happy",
        line: "Anh Quang lấy cục phấn trong túi, vẽ một đường thẳng tắp: 'Đây nè chị, một mét hai.'",
        choices: [
          { id: "tape", label: "Vẽ theo, dán băng keo đỏ", hint: "Không tốn gì · từ nay bàn ngoài luôn trong vạch, +1 danh tiếng",
            say: "Dán băng keo đỏ theo vạch phấn. Từ nay bàn ghế đứng thẳng hàng như lớp học.", fx: { rep: 1, flag: "vach-son", flagDays: 30 }, later: { id: "X02", days: 3 } },
          { id: "wider", label: "Xin vạch rộng thêm", hint: "Không tốn gì · hên xui 20% anh 'để em hỏi', 80% anh cười trừ",
            say: "Em ơi, cho chị xin thêm hai tấc được không?",
            roll: { p: 0.2,
              win: { say: "Anh Quang gãi đầu: 'Để em hỏi thử.' Tuần sau vạch dịch ra đúng hai tấc.", fx: { rep: 1, flag: "vach-son", flagDays: 30 }, later: { id: "X02", days: 3 } },
              lose: { say: "Anh Quang cười trừ, cái cười hiền nhất hẻm. Vạch vẫn một mét hai.", fx: { xp: 1 } } } },
        ],
      },
    },
  },

  // ===== X02 · Giấy khen vỉa hè gọn =====
  {
    id: "X02", group: "dac-biet", tone: "good", when: "day", once: true,
    if: { chain: true }, npc: "to-dan-pho",
    moment: "Có giấy khen vỉa hè gọn. Mẹ đóng khung trước cả quán.",
    nodes: {
      start: {
        mood: "happy",
        line: "Tổ dân phố gửi cô chủ tấm giấy khen 'Hộ kinh doanh vỉa hè gọn đẹp'. Chữ ký hơi run vì viết lúc trời mưa.",
        me: "Giấy khen đầu tiên từ hồi tốt nghiệp. Lần này khen vì bàn ghế thẳng hàng.",
        choices: [
          { id: "hang", label: "Treo giấy khen", hint: "Không tốn gì · thêm khung giấy khen, khách thấy quán đàng hoàng",
            say: "Treo giấy khen ngay trên nồi cơm. Nồi cơm có vẻ tự hào.", fx: { decor: "award-frame", rep: 1 } },
          { id: "post", label: "Chụp đăng", hint: "Không tốn gì · +80 người theo dõi",
            say: "Chụp hình giấy khen đăng lên trang quán. Bình luận: 'Gọn đẹp mà ngon nữa.'", fx: { followers: 80 } },
          { id: "mom", label: "Gửi mẹ một tấm", hint: "Không tốn gì · mẹ gọi khoe, +1 danh tiếng",
            say: "Gửi mẹ một tấm. Mẹ gọi liền: 'Mẹ đóng khung rồi, treo giữa nhà.'", fx: { rep: 1, xp: 2 } },
        ],
      },
    },
  },

  // ===== X03 · Đơn 40 phần của Chị Thư =====
  {
    id: "X03", group: "dac-biet", tone: "mixed", when: "day", cooldown: 6,
    if: { minLevel: 10, noFlags: ["catering-active"] }, npc: "chi-thu",
    moment: "Nhận đơn 40 phần. Đọc file ghi chú ba trang, đặt báo thức ba cái.",
    nodes: {
      start: {
        mood: "neutral",
        line: "Mai xưởng em có đoàn khách, đặt bốn mươi phần, giao mười một giờ rưỡi, mười phần chay, sáu phần không mỡ hành. Em gửi file ghi chú ba trang nha chị.",
        me: "Ba trang ghi chú cho bốn mươi dĩa cơm. Đây là hợp đồng hay luận văn?",
        choices: [
          { id: "forty", label: "Nhận 40", hint: "Cọc 30% (+300k) · mai ca trưa có mâm cơm",
            say: "Nhận bốn mươi phần, cọc trước. Đặt báo thức ba cái, cái nào cũng tên 'Chị Thư'.", fx: { money: 300, preorder: { id: "X03", n: 40, arch: "office", days: 1, kind: "trua", label: "Mâm cơm xưởng Bình Minh", flag: "x03-mam" } }, goto: "vip" },
          { id: "twentyfive", label: "Nhận 25, giới thiệu quán bạn phần còn lại", hint: "Cọc +190k · vừa sức hơn",
            say: "Quán nhận hai lăm, còn mười lăm em đặt quán bạn của chị, ngon không kém.", fx: { money: 190, preorder: { id: "X03", n: 25, arch: "office", days: 1, kind: "trua", label: "Mâm cơm xưởng Bình Minh", flag: "x03-mam" } }, goto: "vip" },
          { id: "no", label: "Từ chối", hint: "Không tốn gì · không có gì thêm",
            say: "Mai quán kín lịch rồi em, lần sau đặt sớm chị nhận liền.", fx: { xp: 1 } },
        ],
      },
      vip: {
        mood: "surprised",
        line: "À chị ơi, sếp em muốn thêm 'dĩa đặc biệt' cho bàn khách quý, bốn phần nha.",
        choices: [
          { id: "add", label: "Thêm 4 đặc biệt", hint: "Không tốn gì hôm nay · mâm thành 44 phần (+40k khi giao)",
            say: "Thêm bốn dĩa đặc biệt, trứng ốp la xếp hình bông hoa.", fx: { flag: "x03-vip", flagDays: 3, money: 40 }, later: { id: "X04", days: 1 } },
          { id: "same", label: "Đề nghị đồng loạt sườn trứng, giảm 5%", hint: "Không tốn gì · hên xui 50% chị đồng ý (dễ làm hơn)",
            say: "Mình làm đồng loạt sườn trứng cho đều tay nha em, chị giảm năm phần trăm.",
            roll: { p: 0.5,
              win: { say: "Chị Thư gọi xác nhận lần ba: 'Sếp đồng ý.' Mâm cơm gọn gàng như file ghi chú.", fx: { xp: 3 }, later: { id: "X04", days: 1 } },
              lose: { say: "'Sếp em muốn có đặc biệt chị ơi.' Đành thêm bốn dĩa, thêm một cái báo thức.", fx: { flag: "x03-vip", flagDays: 3, money: 40 }, later: { id: "X04", days: 1 } } } },
        ],
      },
    },
  },

  // ===== X04 · Ngày giao 40 phần =====
  {
    id: "X04", group: "dac-biet", tone: "mixed", when: "shift", priority: 2,
    if: { chain: true }, npc: "chi-thu",
    moment: "Bốn mươi phần, xe tới sớm 10 phút, một chủ quán chạy bằng hai chân và một cái quạt mo.",
    nodes: {
      start: {
        mood: "surprised",
        line: "Chị ơi, xe xưởng tới sớm mười phút nha chị! Em xin lỗi, sếp em đi nhanh quá.",
        me: "Mười phút. Đủ để nướng thêm bốn miếng, hoặc hoảng loạn bốn lần.",
        choices: [
          { id: "focus", label: "Ưu tiên mâm, đóng nhận khách ngồi 60 giây", hint: "Không tốn gì · khách lẻ mới chờ 60 giây, mâm kịp giờ",
            say: "Treo bảng 'chờ chút', dồn hết sức cho mâm cơm.", fx: { pauseGuests: 60000 }, goto: "check" },
          { id: "mix", label: "Xen khách lẻ", hint: "Không tốn gì · mọi khách bớt kiên nhẫn 6 giây, nguy cơ trễ",
            say: "Vừa làm mâm vừa bán khách lẻ, hai tay hai việc.", fx: { patience: -6000 }, goto: "check" },
        ],
      },
      check: {
        mood: "neutral",
        line: "Bốn mươi hộp xếp chồng trên bàn. Xe xưởng đã đỗ đầu hẻm, tài xế bấm còi hai tiếng.",
        choices: [
          { id: "label", label: "Kiểm từng hộp theo nhãn", hint: "Không tốn gì · cô chủ đứng kiểm 8 giây, không tráo hộp",
            say: "Kiểm từng hộp: chay dán đỏ, không mỡ hành dán xanh, đặc biệt dán vàng. Không sót hộp nào.", fx: { away: 8000, rep: 2, money: 120, flag: "x04-ok", flagDays: 4 }, later: { id: "X05", days: 2 } },
          { id: "go", label: "Giao luôn", hint: "Không tốn gì · hên xui 80% đúng hết, 20% một hộp chay bị tráo",
            say: "Giao luôn, tin vào trí nhớ của đôi tay.",
            roll: { p: 0.8,
              win: { say: "Đúng hết. Chị Thư nhắn: 'Sếp khen.' Kèm ba cái icon chữ… à không, ba chữ cảm ơn.", fx: { rep: 1, money: 120, flag: "x04-ok", flagDays: 4 }, later: { id: "X05", days: 2 } },
              lose: { say: "Một hộp chay bị tráo với hộp mặn. Quán gọi xin lỗi nghiêm túc, hoàn tiền hộp đó, chạy giao hộp chay mới.", fx: { rep: -2, money: 100 } } } },
        ],
      },
    },
  },

  // ===== X05 · Hợp đồng cơm trưa xưởng =====
  {
    id: "X05", group: "dac-biet", tone: "good", when: "day", once: true,
    if: { chain: true, flags: ["x04-ok"] }, npc: "chi-thu",
    moment: "Có khách hàng doanh nghiệp. Giờ cơm trưa của cả xưởng có mùi mỡ hành.",
    nodes: {
      start: {
        mood: "happy",
        line: "Sếp khen chị ơi. Xưởng muốn đặt cơm trưa mỗi thứ Hai và thứ Năm, ba chục phần.",
        me: "Khách hàng doanh nghiệp. Nghe sang như có thêm cái cà vạt.",
        choices: [
          { id: "four", label: "Ký 4 tuần, giảm 8%", hint: "Không tốn gì · 4 tuần tới ca trưa thêm khách văn phòng đều đặn",
            say: "Ký bốn tuần. Hợp đồng in ba bản, bản nào cũng thơm mùi sườn.", fx: { mod: { id: "hd-xuong", days: 28, guests: { office: 2 } }, flag: "hd-xuong", flagDays: 28 }, goto: "box" },
          { id: "two", label: "Ký 2 tuần giá gốc", hint: "Không tốn gì · hên xui 60% chị đồng ý",
            say: "Ký thử hai tuần giá gốc, ưng thì mình ký tiếp.",
            roll: { p: 0.6,
              win: { say: "Chị Thư gọi xác nhận đúng ba lần: 'Đồng ý.' Hợp đồng hai tuần bắt đầu.", fx: { mod: { id: "hd-xuong", days: 14, guests: { office: 2 } }, flag: "hd-xuong", flagDays: 14 }, goto: "box" },
              lose: { say: "'Sếp em muốn giá tốt hơn chị ơi.' Hẹn khi nào quán rảnh thì bàn lại.", fx: { xp: 2 } } } },
          { id: "free", label: "Cảm ơn, nhận khi rảnh", hint: "Không tốn gì · +1 danh tiếng",
            say: "Chị cảm ơn xưởng, khi nào quán rảnh chị nhận liền.", fx: { rep: 1 } },
        ],
      },
      box: {
        mood: "neutral",
        line: "À xưởng cần hộp có in tên quán, cho đẹp mắt khách đối tác.",
        choices: [
          { id: "print", label: "Đặt in hộp", hint: "−80k · quán đẹp mắt hơn, đơn xưởng thêm tiền",
            say: "In hộp có tên quán, chữ đỏ trên nền giấy kraft. Ai cầm cũng thấy sang.", fx: { money: -80, decor: "hop-in", rep: 1 } },
          { id: "plain", label: "Dùng hộp thường", hint: "Không tốn gì · hên xui 70% không sao",
            say: "Hộp thường thôi em, quan trọng là cơm bên trong.",
            roll: { p: 0.7,
              win: { say: "Không ai để ý hộp, ai cũng để ý miếng sườn.", fx: { xp: 2 } },
              lose: { say: "Sếp xưởng hỏi 'quán tên gì ta?', không ai trả lời được. Lần sau chắc phải in.", fx: { xp: 1 } } } },
        ],
      },
    },
  },

  // ===== F01 · Thi nướng trên sân khấu hội chợ =====
  {
    id: "F01", group: "dac-biet", tone: "good", when: "shift", cooldown: 4,
    if: { minLevel: 18, flags: ["hoi-cho"] }, npc: "mc",
    moment: "Thi nướng sườn trên sân khấu. Bốn miếng chín, một miếng bay xuống khán giả.",
    nodes: {
      start: {
        mood: "happy",
        line: "Mời quán cơm tấm lên sân khấu thi nướng sườn nhanh và đẹp nhất đêm hội nào!",
        alt: [{ flags: ["vu-hoi-cho"], line: "Mời quán cơm tấm lên sân khấu! Đối thủ đêm nay: Bếp trưởng Vũ của Cơm Tấm Vũ Kim, người mang theo cả quạt mo lẫn máy tính bảng!", mood: "happy" }],
        me: "Sân khấu, đèn rọi, bốn miếng sườn và bốn mươi giây. Tim đập như than nổ.",
        choices: [
          { id: "compete", label: "Lên thi (bốn miếng chín hai mặt trong 40 giây)", hint: "Không tốn gì · hên xui 55%: đạt +250 người theo dõi, +150k; trượt thua vui +60 người theo dõi",
            say: "Lên sân khấu, xắn tay áo, quạt mo trong tay.",
            roll: { p: 0.55,
              win: { say: "Bốn miếng chín đều, không miếng nào cháy. MC hô tên quán ba lần, khán giả vỗ tay rần rần.", fx: { followers: 250, money: 150, hype: 2 } },
              lose: { say: "Ba miếng chín, một miếng bay xuống khán giả. Thua vui, cả hội chợ nhớ mặt quán.", fx: { followers: 60, hype: 1 } } } },
          { id: "menu", label: "Nhờ MC đọc menu", hint: "Không tốn gì · thêm 4 khách hội chợ",
            say: "Nhờ MC đọc menu giùm. MC đọc 'sườn cháy cạnh' bằng giọng truyền cảm nhất đêm.", fx: { guests: 4 } },
          { id: "wave", label: "Vẫy tay", hint: "Không tốn gì · không có gì thêm",
            say: "Cô chủ vẫy tay chào khán giả, rồi quay về vỉ sườn. Sân khấu để người khác.", fx: { xp: 1 } },
        ],
      },
    },
  },
];
