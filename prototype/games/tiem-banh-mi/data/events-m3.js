// Sự kiện cơ chế M3 Tiệm Bánh Mì (docs/tiem-banh-mi/DRAMA.md §2.7). Cùng cấu trúc data/events.js (xem chú thích đầu file đó).
// L01 mẻ đầu ngày vàng đều · Q01–Q09 quảng bá (tờ rơi / check-in tặng trà đá / livestream lúc ráp) · B01–B03 gói ký gửi Bà Tư và ngày lỗ
// H01–H03 hết hàng giữa ca · S01–S04 lên tiệm và tiệm nổi tiếng · E01 lò điện · N01–N02 Bé Na phụ việc · F02–F03 hội chợ · CH1–CH2 thử thách.
// Cờ do game tự đặt: me-vang, promo-to-roi, promo-check-in, promo-livestream, ky-gui, ky-gui-xong, lo-ngay, muon-hung, dong-som, het-hang,
// len-tiem, noi-tieng, lo-dien, be-na, hoi-cho, thu-thach, thu-thach-dat.
// Nhân vật, tiệm, địa danh đều hư cấu. Hài tử tế, không chê người, không emoji, không thương hiệu hay người thật.

export const EVENTS_M3 = [
  // ===== Lò + độ giòn =====
  {
    id: "L01", group: "co-che", tone: "good", when: "shift", priority: 2, cooldown: 3,
    if: { flags: ["me-vang"], tMax: 40000, lastServe: { minStars: 4 } }, who: "lastServed",
    nodes: {
      start: {
        mood: "happy", line: "Trời ơi ổ này giòn tới mức {self} cắn một cái cả hẻm quay lại nhìn. Mẻ đầu mà vàng đều vậy hả {call}?",
        me: "Dạ mẻ đầu hôm nay lò nghe lời.",
        choices: [
          { id: "thanks", label: "Cảm ơn, mời ghé mỗi sáng", hint: "+1 danh tiếng · ghi vào Sổ khách quen",
            say: "Mai {call} ghé sớm, mẻ đầu là mẻ có tâm nhất, lò còn đang vui.", fx: { rep: 1, regular: true } },
          { id: "secret", label: "Khách hỏi bí quyết, kể thử", hint: "Chuyện còn tiếp…",
            say: "Bí quyết hả? Để em kể, mà nghe xong đừng nói lại cho xe đối diện nha.", goto: "secret" },
          { id: "photo", label: "Xin chụp ổ trên tay khách", hint: "Khách đang chờ mất 2 giây · +8 người theo dõi",
            say: "Cho em chụp ổ này một tấm. Ổ vàng đều như vầy một năm được vài lần, phải có hình làm bằng.", fx: { patience: -2000, followers: 8 } },
        ],
      },
      secret: {
        mood: "surprised", line: "Kể đi {call}, {self} hứa giữ bí mật. Cùng lắm {self} chỉ kể cho nhóm chat cơ quan thôi.",
        choices: [
          { id: "truth", label: "Nói thật: canh đồng hồ, không bấm điện thoại", hint: "+4 XP",
            say: "Bí quyết là đứng canh lò, mắt không rời, tay không cầm điện thoại. Nghe đơn giản mà khó nhất đời.", fx: { xp: 4 } },
          { id: "mom", label: "Nói đó là bí quyết của mẹ", hint: "Hên xui: khách kể lại cho cả cơ quan",
            say: "Bí quyết của mẹ em: nướng bánh như nấu xôi, nghe mùi mà rút, không nhìn đồng hồ.",
            roll: { p: 0.6, win: { say: "Khách kể lại cho cả cơ quan. Chiều đó có ba người tới hỏi “mẹ của tiệm có bán xôi không”.", fx: { nextGuests: 2, followers: 6 } },
              lose: { say: "Khách nghe xong gật gù, về nhà thử nướng theo mùi, cháy luôn cái lò nướng bánh mì của cơ quan.", fx: { xp: 2 } } } },
        ],
      },
    },
  },

  // ===== Quảng bá: tờ rơi cổng trường =====
  {
    id: "Q01", group: "co-che", tone: "good", when: "shift", priority: 2, cooldown: 2,
    if: { flags: ["promo-to-roi"], phase: "sang" }, who: { arch: "student" },
    nodes: {
      start: {
        mood: "happy", line: "{Call} ơi, cả lớp {self} cầm tờ rơi chạy ra đây trước giờ chuông. Tờ rơi ghi “giòn từ cổng trường nghe được” là thật không {call}?",
        choices: [
          { id: "group", label: "Nhận đơn cả nhóm 4 ổ pate bơ", hint: "Đơn 4 ổ tới ngay · giao kịp +4k tip",
            say: "Thật! Đứng xếp hàng đi các em, ổ nào cũng giòn kịp giờ chuông.",
            fx: { group: { n: 4, recipe: "pate-bo", arch: "student", name: "Nhóm học sinh cầm tờ rơi", tip: 4, line: "Bốn ổ pate bơ nha anh, tụi em còn đúng tám phút trước giờ chuông." } } },
          { id: "pate", label: "Phết thêm pate cho ai cầm tờ rơi", hint: "−2 pate · +1 danh tiếng · +6 người theo dõi",
            say: "Ai cầm tờ rơi được thêm một lớp pate. Tờ rơi hôm nay có giá hơn giấy khen.", fx: { stock: { pate: -2 }, rep: 1, followers: 6 } },
          { id: "line", label: "Nhờ lớp trưởng xếp hàng giùm", hint: "Khách đang chờ thêm 4 giây kiên nhẫn · +3 XP",
            say: "Lớp trưởng ơi, em xếp hàng giùm anh, theo thứ tự ai tới trước. Lớp trưởng làm việc nghiêm hơn bảo vệ.", fx: { patience: 4000, xp: 3 } },
        ],
      },
    },
  },
  {
    id: "Q02", group: "co-che", tone: "bad", when: "shift", priority: 2, cooldown: 3,
    if: { flags: ["promo-to-roi"] }, npc: "co-giao",
    nodes: {
      start: {
        mood: "annoyed", line: "Em chủ tiệm, sáng nay lớp cô có ba mươi chiếc máy bay giấy in giá bánh mì. Một chiếc đáp trúng bàn giáo viên lúc cô đang điểm danh.",
        choices: [
          { id: "sorry", label: "Xin lỗi cô, mời cô ổ chả lụa", hint: "−1 ổ trong tủ · +1 danh tiếng",
            say: "Em xin lỗi cô. Lần sau em in tờ rơi bằng giấy mềm, gấp máy bay không nổi.", fx: { bread: -1, rep: 1 } },
          { id: "lesson", label: "Đề nghị cô dùng tờ rơi làm bài toán", hint: "Chuyện còn tiếp…",
            say: "Hay cô cho các em tính: một ổ mười sáu nghìn, ba mươi tờ rơi, bao nhiêu ổ thì hết tiền tiêu vặt?", goto: "class" },
          { id: "promise", label: "Hứa lần sau phát ở cổng sau giờ học", hint: "+3 XP",
            say: "Dạ lần sau em phát lúc tan trường. Máy bay có bay thì bay ra đường, không bay vô lớp.", fx: { xp: 3 } },
        ],
      },
      class: {
        mood: "surprised", line: "Ý hay đó em. Mà học sinh hỏi: giải đúng bài toán thì tờ rơi có đổi được ổ bánh không?",
        choices: [
          { id: "yes", label: "Đổi được: ai giải đúng ghé lấy ổ", hint: "+3 học sinh ghé ca này · +1 danh tiếng",
            say: "Giải đúng thì ghé, anh nướng sẵn. Bánh mì là phần thưởng hợp lý nhất cho môn toán.", fx: { arch: { arch: "student", n: 3 }, rep: 1 } },
          { id: "best", label: "Chỉ tặng bạn gấp máy bay đẹp nhất", hint: "Hên xui: tấm hình máy bay lên mạng",
            say: "Mỗi lớp chọn một chiếc máy bay đẹp nhất, anh tặng một ổ và treo máy bay lên xe.",
            roll: { p: 0.5, win: { say: "Chiếc máy bay thắng giải được chụp hình treo trên xe. Phụ huynh chia sẻ khắp nhóm lớp.", fx: { followers: 12, buzz: 0.5 } },
              lose: { say: "Cả lớp cãi nhau chiếc nào đẹp nhất tới hết giờ ra chơi. Cô giáo nhìn em bằng ánh mắt của người phải dạy tiết sau.", fx: { xp: 2 } } } },
        ],
      },
    },
  },
  {
    id: "Q03", group: "co-che", tone: "mixed", when: "shift", priority: 2, cooldown: 3,
    if: { flags: ["promo-to-roi"] }, who: { arch: "parent" },
    nodes: {
      start: {
        mood: "surprised", line: "Con {self} cầm tờ rơi về, bắt {self} chở ra đây trước giờ học. {Self} chưa kịp ăn sáng mà nó chọn món cho {self} rồi: “mẹ ăn ổ giòn nhất”.",
        choices: [
          { id: "half", label: "Làm hai ổ, ổ của bé cắt đôi", hint: "Phiếu thêm “cắt đôi” · người nói chờ thêm 8 giây",
            say: "Ổ của mẹ giòn nhất, ổ của bé cắt đôi cho vừa miệng. Tờ rơi phát hôm qua, hôm nay đủ cả nhà.", fx: { quirk: "cat-doi", whoPatience: 8000 } },
          { id: "gift", label: "Tặng bé một ổ nhỏ vì đã đọc tờ rơi", hint: "−1 ổ trong tủ · +1 danh tiếng · ghi Sổ khách quen",
            say: "Bé là người đầu tiên đọc tờ rơi mà dắt cả mẹ theo. Ổ này anh tặng, làm phí giới thiệu.", fx: { bread: -1, rep: 1, regular: true } },
          { id: "egg", label: "Gợi ý thêm trứng cho mẹ", hint: "Hên xui: mẹ đồng ý thì đơn đắt hơn",
            say: "Mẹ chưa ăn sáng thì thêm trứng cho chắc bụng, bé chọn ổ, anh chọn nhân.",
            roll: { p: 0.6, win: { say: "Mẹ gật đầu, bé vỗ tay. Ổ thêm trứng, mẹ no tới trưa.", fx: { quirk: "them-trung" } },
              lose: { say: "Mẹ nói đang giảm cân. Bé nói “mẹ nói vậy hoài”. Anh giữ im lặng như một người bán hàng có kinh nghiệm.", fx: { xp: 2 } } } },
        ],
      },
    },
  },

  // ===== Quảng bá: check-in tặng trà đá =====
  {
    id: "Q04", group: "co-che", tone: "good", when: "shift", priority: 2, cooldown: 2,
    if: { flags: ["promo-check-in"] }, npc: "ti-map",
    nodes: {
      start: {
        mood: "happy", line: "Anh ơi, tấm check-in “ổ bánh mì và ly trà đá đổ mồ hôi” của tiệm đang lên xu hướng nhỏ. Ba trăm người bắt chước tạo dáng cầm ly trà đá áp má.",
        choices: [
          { id: "corner", label: "Dựng góc check-in có bảng tên tiệm", hint: "+15 người theo dõi · tiệm hot lên",
            say: "Tiệm dựng một góc nhỏ: cái ghế nhựa, ly trà đá, tấm bảng phấn ghi tên tiệm. Người ta xếp hàng chụp như chụp ảnh cưới.", fx: { followers: 15, buzz: 1 } },
          { id: "combo", label: "Mời khách check-in mua thêm một ổ", hint: "+2 khách ca này",
            say: "Chụp ảnh với ly trà đá thì cầm thêm ổ bánh mì cho cân khung hình nha.", fx: { guests: 2 } },
          { id: "thanks", label: "Cảm ơn Tí Mập, mời ly trà đá", hint: "+1 danh tiếng",
            say: "Cảm ơn em. Ly trà đá này không tính tiền, mà cũng không tính là quảng cáo.", fx: { rep: 1 } },
        ],
      },
    },
  },
  {
    id: "Q05", group: "co-che", tone: "bad", when: "shift", priority: 2, cooldown: 3,
    if: { flags: ["promo-check-in"], waitingMin: 2 }, npc: "co-hai",
    nodes: {
      start: {
        mood: "annoyed", line: "Con ơi, hàng người đứng chụp hình với ly trà đá dài hơn hàng người mua bánh mì. Có đứa đứng dưới ban công cô chụp tới tấm thứ ba mươi, đồ cô phơi lọt vô hình hết.",
        choices: [
          { id: "rule", label: "Đổi luật: mua bánh mới tặng trà đá", hint: "+3 XP · khách đang chờ thêm 3 giây kiên nhẫn",
            say: "Từ giờ mua một ổ tặng một ly trà đá. Ai chỉ chụp hình thì chụp với cái bình, cái bình không tính tiền.", fx: { xp: 3, patience: 3000 } },
          { id: "jug", label: "Pha thêm bình trà đá cho nhanh", hint: "−5k · khách đang chờ thêm 5 giây kiên nhẫn · +1 danh tiếng",
            say: "Pha thêm một bình, hai tay rót hai ly. Hàng chụp hình tan nhanh như cục đá giữa trưa.", fx: { money: -5, patience: 5000, rep: 1 } },
          { id: "coHai", label: "Mời Cô Hai ổ chả lụa nhiều đồ chua", hint: "−1 ổ trong tủ · Cô Hai dịu lại",
            say: "Ổ chả lụa nhiều đồ chua nè cô. Cô ăn đi, để con dời hàng ra xa ban công.",
            roll: { p: 0.7, win: { say: "Cô Hai cầm ổ, im lặng một giây, rồi nói nhỏ: “Đồ chua nhiều vầy là được.” Bí mật của Cô Hai lộ một nửa.", fx: { bread: -1, rep: 1 } },
              lose: { say: "Cô Hai nhận ổ, rồi vẫn than tiếp, nhưng giọng nhẹ hơn hẳn vì miệng đang nhai.", fx: { bread: -1 } } } },
        ],
      },
    },
  },
  {
    id: "Q06", group: "co-che", tone: "mixed", when: "shift", priority: 2, cooldown: 3,
    if: { flags: ["promo-check-in"] }, who: { arch: "worker" },
    nodes: {
      start: {
        mood: "neutral", line: "Đội {self} sáu người check-in sáu lần, nhận sáu ly trà đá… rồi mua chung một ổ bánh mì chia sáu. Em đừng buồn nha, cuối tháng anh em nghèo mà vui.",
        choices: [
          { id: "cut", label: "Cắt ổ làm sáu khúc đều", hint: "Phiếu thêm “cắt đôi” · +1 danh tiếng",
            say: "Một ổ sáu khúc, khúc nào cũng có pate. Đây là bài toán chia đều khó nhất từ lúc mở xe.", fx: { quirk: "cat-doi", rep: 1 } },
          { id: "offer", label: "Rủ cả đội lấy ổ ba chục chia nhau", hint: "Chuyện còn tiếp…",
            say: "Hay vầy anh, em làm một ổ ba chục, nhiều nhân, cắt ra chia sáu mới đáng mặt thợ hồ.", goto: "deal" },
          { id: "laugh", label: "Cười, ghi lại cho Nhật Ký", hint: "+5 người theo dõi",
            say: "Sáu ly trà đá, một ổ bánh mì, sáu nụ cười. Lợi nhuận hôm nay tính bằng tiếng cười.", fx: { followers: 5 } },
        ],
      },
      deal: {
        mood: "surprised", line: "Ổ ba chục hả? Anh em tính coi… ba chục chia sáu là năm nghìn một người. Ờ, nghe hợp lý ghê.",
        choices: [
          { id: "group", label: "Làm luôn đơn 3 ổ chả lụa cho cả đội", hint: "Đơn 3 ổ tới ngay · giao kịp +5k tip",
            say: "Thôi em làm ba ổ chả lụa, hai người một ổ, khỏi ai phải đếm khúc.",
            fx: { group: { n: 3, recipe: "cha-lua", arch: "worker", name: "Đội thợ check-in", tip: 5, quirks: ["nhieu-ot"], line: "Ba ổ chả lụa, ổ nào cũng nhiều ớt nha em, đội anh ăn cay để tỉnh." } } },
          { id: "tomorrow", label: "Hẹn cả đội ngày mai lãnh lương", hint: "Ca sau +3 khách",
            say: "Mai lãnh lương anh dắt cả đội ghé, mỗi người một ổ nguyên, không chia.", fx: { nextGuests: 3 } },
        ],
      },
    },
  },

  // ===== Quảng bá: livestream lúc ráp =====
  {
    id: "Q07", group: "co-che", tone: "good", when: "shift", priority: 2, cooldown: 2,
    if: { flags: ["promo-livestream"], tMin: 20000 }, npc: "cu-dan-mang",
    nodes: {
      start: {
        mood: "happy", line: "Chủ tiệm ơi, đoạn trong live anh rạch bánh một phát thẳng băng rồi phết pate không lem được cắt ra, đặt tên “tay rạch bánh không cần thước”.",
        choices: [
          { id: "again", label: "Diễn lại cú rạch trên sóng", hint: "Khách đang chờ mất 3 giây · +20 người theo dõi · tiệm hot lên",
            say: "Theo yêu cầu khán giả: một phát rạch, không thước, không run. Bình luận chạy nhanh hơn dao.", fx: { patience: -3000, followers: 20, buzz: 1 } },
          { id: "humble", label: "Nói thật: rạch lệch mười ổ mới được một ổ vậy", hint: "+1 danh tiếng · +6 người theo dõi",
            say: "Clip đẹp vậy chứ trước đó em rạch lệch mười ổ. Mười ổ đó em ăn sáng, ăn trưa, ăn tối.", fx: { rep: 1, followers: 6 } },
          { id: "back", label: "Tắt điện thoại, quay lại thớt", hint: "+3 XP",
            say: "Nổi thì nổi, khách đang chờ thì vẫn phải ráp. Cái thớt không đọc bình luận.", fx: { xp: 3 } },
        ],
      },
    },
  },
  {
    id: "Q08", group: "co-che", tone: "bad", when: "shift", priority: 3, cooldown: 3,
    if: { flags: ["promo-livestream"], lastServe: { mistake: "any" } }, who: "lastServed",
    nodes: {
      start: {
        mood: "annoyed", line: "{Call} ơi, ổ {loaf} này lệch phiếu rồi. Mà khoan… {call} đang livestream hả? Vậy là cả mạng vừa thấy luôn.",
        me: "Dạ… ba trăm người vừa thấy.",
        choices: [
          { id: "remake", label: "Làm lại ngay trên sóng", hint: "−1 ổ trong tủ · +1 danh tiếng · +8 người theo dõi",
            say: "Làm lại trước ba trăm nhân chứng. Ổ thứ hai được kiểm kỹ hơn hồ sơ xin việc.", fx: { bread: -1, rep: 1, followers: 8 } },
          { id: "own", label: "Nhận lỗi, đọc bình luận cho khách nghe", hint: "Chuyện còn tiếp…",
            say: "Dạ lỗi em, để em đọc xem bình luận nói gì… à, có người bảo “chủ tiệm cũng là người”.", goto: "comments" },
          { id: "off", label: "Tắt live, xử lý riêng", hint: "+2 XP · −5 người theo dõi",
            say: "Em xin phép tắt live, chuyện ổ bánh để hai bên giải quyết riêng, không cần khán giả.", fx: { xp: 2, followers: -5 } },
        ],
      },
      comments: {
        mood: "surprised", line: "Bình luận chia hai phe: một phe đòi làm lại, một phe đòi chủ tiệm tự ăn ổ lệch trên sóng.",
        choices: [
          { id: "eat", label: "Tự ăn ổ lệch, làm ổ mới cho khách", hint: "−1 ổ trong tủ · Hên xui: khán giả thích thì tiệm nổi",
            say: "Em ăn ổ lệch trước ống kính, vừa nhai vừa xin lỗi. Ổ mới ra đúng từng cọng hành.",
            roll: { p: 0.6, win: { say: "Khán giả thích màn ăn ổ lệch. Clip “chủ tiệm tự phạt” được chia sẻ, khách tới hỏi “ổ lệch còn không”.", fx: { bread: -1, followers: 18, buzz: 1 } },
              lose: { say: "Khán giả chỉ nhớ đoạn ổ lệch. Một người viết review từ chỗ xem live.", fx: { bread: -1, review: { stars: 2, line: "Xem live thấy tiệm làm sai phiếu khách, làm lại thì được nhưng hơi run. #livestream", name: "Người xem live" } } } } },
          { id: "discount", label: "Giảm giá ổ này, cảm ơn khách đã kiên nhẫn", hint: "Ổ người nói rẻ hơn 5k · +1 danh tiếng",
            say: "Ổ này em giảm năm nghìn, cảm ơn {call} đã kiên nhẫn đứng trong khung hình.", fx: { priceWho: -5, rep: 1 } },
        ],
      },
    },
  },
  {
    id: "Q09", group: "co-che", tone: "mixed", when: "shift", priority: 2, cooldown: 3,
    if: { flags: ["promo-livestream"] }, who: "waiting",
    nodes: {
      start: {
        mood: "happy", line: "{Self} xem live nghe {call} nói đùa “ai tới nói đúng mật khẩu giòn rụm thì được ổ miễn phí”. Giòn rụm! {Self} tới đúng giờ nè.",
        me: "Ủa… em có nói vậy hả?",
        choices: [
          { id: "honor", label: "Giữ lời, tặng ổ của khách", hint: "Đơn người nói miễn phí · +1 danh tiếng · +10 người theo dõi",
            say: "Nói đùa trên sóng cũng là nói. Giòn rụm đúng mật khẩu, ổ này tiệm mời.", fx: { freeWho: true, rep: 1, followers: 10 } },
          { id: "tea", label: "Nói khéo: mật khẩu chỉ đổi được ly trà đá", hint: "Hên xui: khách vui hay khách dỗi",
            say: "Mật khẩu đúng rồi, mà phần thưởng là ly trà đá mát lạnh. Bánh mì thì vẫn tính tiền nha.",
            roll: { p: 0.55, win: { say: "Khách cười, cầm ly trà đá, gọi luôn ổ thập cẩm. Mật khẩu đổi được một khách quen.", fx: { regular: true, xp: 2 } },
              lose: { say: "Khách nói “vậy mật khẩu này là của ly trà đá chứ đâu phải giòn rụm”. Rồi để lại một review đúng giọng người bị lừa nhẹ.", fx: { review: { stars: 3, line: "Xem live tưởng được ổ miễn phí, tới thì chỉ được trà đá. Bánh ngon nên tha. #giongrum" } } } } },
          { id: "half", label: "Giảm nửa giá, hẹn lần sau nói rõ", hint: "Ổ người nói rẻ hơn 8k · +3 XP",
            say: "Em đùa mà khách tin, vậy mình chia đôi: em giảm nửa giá, lần sau em đùa có phụ đề.", fx: { priceWho: -8, xp: 3 } },
        ],
      },
    },
  },

  // ===== Gói ký gửi Bà Tư =====
  {
    id: "B01", group: "co-che", tone: "good", when: "shift", priority: 1, cooldown: 3,
    if: { flags: ["ky-gui"], tMin: 20000 }, npc: "ba-tu",
    nodes: {
      start: {
        mood: "happy", line: "Bà ghé coi gói ký gửi dưới gầm xe bán sao rồi. Đừng lo con, hồi trẻ bà từng ký gửi nguyên một mâm chả lụa, bán ba ngày mới hết.",
        choices: [
          { id: "taste", label: "Mời bà ổ pate của chính bà", hint: "−1 ổ trong tủ · +1 danh tiếng · Bà Tư hẹn ngày gạch sổ",
            say: "Bà ăn thử ổ pate bơ, pate của bà mà lò của con. Bà nhai chậm, gật đầu nhanh.", fx: { bread: -1, rep: 1 }, later: { id: "B02", days: 2 } },
          { id: "report", label: "Báo cáo: bán được mấy ổ rồi", hint: "+3 XP",
            say: "Dạ được bảy ổ rồi bà, còn ba ổ nữa là con trả đủ. Con đếm từng ổ như đếm ngày nghỉ.", fx: { xp: 3 } },
          { id: "story", label: "Hỏi chuyện mâm chả lụa hồi xưa", hint: "Chuyện còn tiếp…",
            say: "Mâm chả lụa ba ngày đó bán cho ai vậy bà?", goto: "story" },
        ],
      },
      story: {
        mood: "happy", line: "Bán cho cả cái chợ chớ ai! Ngày thứ ba bà hết tiền lẻ, phải thối bằng chả lụa. Người ta khen tiền thối ngon nhất chợ.",
        choices: [
          { id: "listen", label: "Nghe hết chuyện, cười với bà", hint: "Khách đang chờ mất 4 giây · +1 danh tiếng · +4 XP",
            say: "Con nghe hết chuyện thối tiền bằng chả lụa. Khách đứng chờ cũng nghe, cũng cười.", fx: { patience: -4000, rep: 1, xp: 4 } },
          { id: "back", label: "Xin phép bà quay lại thớt", hint: "+2 XP",
            say: "Dạ con ráp xong mẻ này rồi nghe bà kể tiếp đoạn thối tiền nha.", fx: { xp: 2 } },
        ],
      },
    },
  },
  {
    id: "B02", group: "co-che", tone: "good", when: "day", priority: 2, cooldown: 3,
    if: { flags: ["ky-gui-xong"] }, npc: "ba-tu",
    nodes: {
      start: {
        mood: "happy", line: "Trả đủ rồi đó con. Bà gạch sổ một đường, nghe đã tai như tiếng con rạch bánh giòn.",
        choices: [
          { id: "order", label: "Đặt bà thêm 6 phần pate", hint: "−18k · +6 pate · Bà Tư quý tiệm",
            say: "Trả xong thì đặt tiếp bà ơi, pate của bà là cái nền của tiệm con.", fx: { money: -18, stock: { pate: 6 }, rep: 1 } },
          { id: "thanks", label: "Cảm ơn bà đã tin con", hint: "+1 danh tiếng · +3 XP",
            say: "Hồi con hết vốn, bà là người đưa đồ trước rồi mới hỏi tiền. Con nhớ cái gạch sổ này lâu lắm.", fx: { rep: 1, xp: 3 } },
          { id: "joke", label: "Hỏi bà có gói ký gửi hạng vàng không", hint: "+5 người theo dõi",
            say: "Bà ơi lần sau có gói ký gửi hạng vàng không, kèm chả lụa? Bà cười: “Hạng vàng là trả đúng hẹn như con đó.”", fx: { followers: 5 } },
        ],
      },
    },
  },
  {
    id: "B03", group: "co-che", tone: "good", when: "day", priority: 1, cooldown: 5,
    if: { flags: ["lo-ngay"] }, npc: "me",
    nodes: {
      start: {
        mood: "neutral", line: "Mẹ nghe Cô Sáu nói hôm nay xe con bán hơi ế. Mẹ không hỏi nhiều đâu, mẹ chỉ hỏi con ăn cơm chưa.",
        me: "Dạ… con ăn nửa ổ rạch lệch.",
        choices: [
          { id: "honest", label: "Kể thật hôm nay lỗ", hint: "Chuyện còn tiếp…",
            say: "Dạ hôm nay con lỗ mẹ ơi. Bánh còn dư, khách thì đi đâu hết.", goto: "advice" },
          { id: "fine", label: "Nói con ổn, mai bán bù", hint: "+3 XP",
            say: "Con ổn mà mẹ. Bán bánh mì như nướng bánh, có mẻ vàng có mẻ xém.", fx: { xp: 3 } },
        ],
      },
      advice: {
        mood: "happy", line: "Mẹ bán xôi ba chục năm, có bữa về còn nguyên nồi. Mẹ gửi lên con chục trứng gà nhà, mai con bán ổ trứng, khỏi ai chê.",
        choices: [
          { id: "eggs", label: "Nhận chục trứng của mẹ", hint: "+10 trứng · +1 danh tiếng",
            say: "Con cảm ơn mẹ. Chục trứng gà nhà, trứng nào cũng có lời dặn “ráng lên con”.", fx: { stock: { trung: 10 }, rep: 1 } },
          { id: "keep", label: "Nói mẹ giữ trứng mà ăn", hint: "+4 XP",
            say: "Mẹ giữ mà ăn, con tự lo được. Mẹ nói: “Ừ, nhưng mai mẹ vẫn gửi.”", fx: { xp: 4 } },
          { id: "tip", label: "Hỏi mẹ mẹo bán ngày ế", hint: "Ca sau +2 khách",
            say: "Mẹ dặn: ngày ế thì mời người đi ngang một câu thật lòng, đừng mời bằng giảm giá. Mai con thử.", fx: { nextGuests: 2 } },
        ],
      },
    },
  },

  // ===== Hết hàng giữa ca =====
  {
    id: "H01", group: "co-che", tone: "mixed", when: "shift", priority: 2, cooldown: 3,
    if: { flags: ["muon-hung"], tMin: 10000 }, npc: "cau-hung",
    nodes: {
      start: {
        mood: "neutral", line: "Anh ơi, bốn phần hôm qua em cho mượn… em không đòi đâu, em chỉ ghé hỏi thăm bốn phần đó có khoẻ không.",
        choices: [
          { id: "goods", label: "Trả đủ 4 phần pate, chả lụa", hint: "−2 pate, −2 chả lụa · +1 danh tiếng",
            say: "Trả đủ nè em, bốn phần khoẻ mạnh, đi về nhà bên kia đường.", fx: { stock: { pate: -2, "cha-lua": -2 }, rep: 1 } },
          { id: "cash", label: "Trả bằng tiền cho gọn", hint: "−24k · Cậu Hưng gật gù",
            say: "Anh gửi em tiền cho gọn, khỏi khiêng qua khiêng lại giữa đường.", fx: { money: -24, xp: 2 } },
          { id: "trade", label: "Xin khất tới trưa, kể chuyện bù", hint: "Chuyện còn tiếp…",
            say: "Em cho anh khất tới trưa nha. Bù lại anh kể em nghe vụ hồi sáng có khách đòi ổ không bánh.", goto: "trade" },
        ],
      },
      trade: {
        mood: "surprised", line: "Khất thì được… mà hay vầy đi anh: anh chỉ em canh lò sao mẻ đầu vàng đều, coi như huề bốn phần.",
        choices: [
          { id: "teach", label: "Chỉ Cậu Hưng canh lò", hint: "+1 danh tiếng · +4 XP · đối thủ giỏi lên một chút",
            say: "Nghe mùi, đừng nhìn điện thoại, rút khi vỏ kêu tách tách. Em học lỏm giỏi vậy, giờ học thẳng luôn đi.", fx: { rep: 1, xp: 4, unflag: "muon-hung" } },
          { id: "secret", label: "Từ chối khéo, giữ nghề", hint: "Hên xui: Hưng cười cho qua hay đi kể khắp chợ",
            say: "Canh lò là nghề gia truyền của mẹ anh, anh không dám dạy. Trưa anh trả đủ.",
            roll: { p: 0.6, win: { say: "Cậu Hưng cười: “Vậy em học lỏm tiếp.” Trưa nhận đủ bốn phần, hai bên vẫn chào nhau qua đường.", fx: { xp: 2, unflag: "muon-hung" } },
              lose: { say: "Cậu Hưng kể khắp chợ là xe bên này “mượn thì nhanh, trả thì kể chuyện”. Chợ nghe, chợ cười.", fx: { rep: -1 } } } },
        ],
      },
    },
  },
  {
    id: "H02", group: "co-che", tone: "mixed", when: "day", priority: 2, cooldown: 4,
    if: { flags: ["dong-som"] }, npc: "me",
    nodes: {
      start: {
        mood: "surprised", line: "Cô Sáu gọi mẹ nói xe con đóng lúc chín giờ sáng. Con bệnh hả? Hay con bị ai bắt nạt?",
        choices: [
          { id: "explain", label: "Giải thích: bán hết hàng sớm", hint: "Chuyện còn tiếp…",
            say: "Dạ không mẹ, con hết hàng. Khách đông quá, con nhập ít quá.", goto: "advice" },
          { id: "joke", label: "Nói đùa: con nghỉ đi uống cà phê", hint: "Hên xui: mẹ cười hay mẹ lo",
            say: "Dạ con đóng sớm đi uống cà phê như doanh nhân mẹ ơi.",
            roll: { p: 0.5, win: { say: "Mẹ cười: “Doanh nhân gì mà ăn sáng bằng nửa ổ lệch.” Rồi mẹ đi kể cả xóm là con mẹ thành doanh nhân.", fx: { followers: 4, xp: 2 } },
              lose: { say: "Mẹ không cười. Mẹ gọi Cô Sáu hỏi lại, Cô Sáu kể hết vụ khách đứng chờ trước xe đóng cửa.", fx: { rep: -1 } } } },
        ],
      },
      advice: {
        mood: "happy", line: "Hết hàng là bán được, mẹ mừng. Mà mẹ bán xôi ba chục năm, nồi xôi lúc nào cũng nấu dư một chén cho người tới trễ.",
        choices: [
          { id: "more", label: "Nghe mẹ: mai nhập dư 6 phôi", hint: "−9k · +6 phôi",
            say: "Mai con nhập dư sáu phôi, để dành cho người tới trễ, như chén xôi của mẹ.", fx: { money: -9, stock: { phoi: 6 } } },
          { id: "early", label: "Hứa mai nướng thêm mẻ đầu ngày", hint: "+1 mẻ đầu ngày ngày mai · +2 XP",
            say: "Mai con nướng thêm một mẻ từ sớm. Mẹ dặn: “Nướng thêm chứ đừng thức thêm.”", fx: { mod: { id: "nghe-me-nuong-som", days: 1, prepMax: 1 }, xp: 2 } },
          { id: "eat", label: "Hứa ăn uống đầy đủ", hint: "+1 danh tiếng",
            say: "Con hứa ăn cơm đầy đủ. Mẹ nói: “Ừ, hết hàng thì đóng cửa đi ăn, chứ đừng đóng cửa đi ngủ đói.”", fx: { rep: 1 } },
        ],
      },
    },
  },
  {
    id: "H03", group: "co-che", tone: "bad", when: "day", priority: 3, cooldown: 4,
    if: { flags: ["het-hang"] }, npc: "ti-map",
    nodes: {
      start: {
        mood: "annoyed", line: "Anh ơi, bài “Tiệm bánh mì hết bánh mì lúc tám giờ sáng” của mình có hai trăm lượt chia sẻ. Mình chỉ kể thật thôi, mình đứng chờ mà hết ổ.",
        choices: [
          { id: "sorry", label: "Xin lỗi, mời Tí Mập ổ đầu mẻ mai", hint: "+1 danh tiếng · bớt hot",
            say: "Anh xin lỗi em. Mai mẻ đầu ra lò, ổ đầu tiên có tên em, nóng tới mức cầm không nổi.", fx: { rep: 1, buzz: -0.5, unflag: "het-hang" } },
          { id: "meme", label: "Trả lời bằng ảnh tủ kính trống trơn", hint: "Chuyện còn tiếp…",
            say: "Anh đăng ảnh tủ kính trống trơn, chú thích: “Đây là bằng chứng. Tủ cũng buồn.”", goto: "meme" },
          { id: "quiet", label: "Im lặng, lo nhập hàng", hint: "+3 XP · chuyện tự nguội",
            say: "Không trả lời, đi nhập hàng. Hai ngày sau dân mạng chuyển qua hóng chuyện quán cơm tấm.", fx: { xp: 3 } },
        ],
      },
      meme: {
        mood: "surprised", line: "Ảnh tủ trống của anh đang có người chế thành “tủ kính thất tình”. Bình luận hỏi mai mấy giờ tiệm mở.",
        choices: [
          { id: "time", label: "Ghim giờ mở cửa và số mẻ mỗi sáng", hint: "Hên xui: khách đổ tới hay dân mạng chê làm màu",
            say: "Anh ghim: mở cửa năm giờ rưỡi, ba mẻ đầu ngày, ai tới trễ có ổ que.",
            roll: { p: 0.6, win: { say: "Sáng hôm sau hàng người tới từ năm giờ rưỡi. “Tiệm bánh mì hết bánh mì” thành câu quảng cáo không tốn tiền.", fx: { nextGuests: 3, followers: 15, buzz: 1, unflag: "het-hang" } },
              lose: { say: "Có người bình luận “hết hàng mà còn làm màu”. Một review nhỏ lên sổ.", fx: { review: { stars: 2, line: "Tám giờ tới đã hết bánh, tiệm còn đăng ảnh tủ trống làm meme. Mong tiệm nhập thêm. #hethang", name: "Tí Mập Ăn Sáng" } } } } },
          { id: "thanks", label: "Cảm ơn mọi người, hứa nướng đủ", hint: "+1 danh tiếng",
            say: "Cảm ơn mọi người đã chế ảnh tủ. Mai tủ có bánh, tủ hết thất tình.", fx: { rep: 1, unflag: "het-hang" } },
        ],
      },
    },
  },

  // ===== Lên tiệm (cấp 7) và tiệm nổi tiếng (cấp 16) =====
  {
    id: "S01", group: "co-che", tone: "good", when: "day", priority: 3, cooldown: 5, once: true,
    if: { flags: ["len-tiem"] }, npc: "co-sau",
    nodes: {
      start: {
        mood: "happy", line: "Dọn vô tiệm rồi hả con! Cô dẫn Anh Bảy với Cụ Năm qua chúc. Cô biết trước hôm nay con dọn từ tuần rồi, cô còn biết luôn con quên mua chổi.",
        me: "Dạ… con quên mua chổi thật.",
        choices: [
          { id: "treat", label: "Mời mọi người ổ đầu tiên ở tiệm mới", hint: "−3 phôi, −3 chả lụa · +2 danh tiếng · ca sau +2 khách",
            say: "Ổ đầu tiên trong tiệm mới, mời ba người đứng chờ xe đẩy của con lâu nhất.", fx: { stock: { phoi: -3, "cha-lua": -3 }, rep: 2, nextGuests: 2 } },
          { id: "sign", label: "Nhờ Anh Bảy treo bảng hiệu", hint: "Chuyện còn tiếp…",
            say: "Anh Bảy ơi, anh cao nhất ở đây, treo giùm em tấm bảng hiệu.", goto: "sign" },
          { id: "change", label: "Nhận bọc tiền lẻ Cô Sáu mừng", hint: "+20k · +2 XP",
            say: "Cô Sáu mừng một bọc tiền lẻ, tờ nào cũng thẳng. Cô nói: “Tiệm mới thì đừng để khách chờ thối.”", fx: { money: 20, xp: 2 } },
        ],
      },
      sign: {
        mood: "happy", line: "Treo thì anh treo. Mà hồi xưa anh ghi sổ ở xe đẩy, giờ lên tiệm rồi cái sổ có theo lên không em?",
        choices: [
          { id: "book", label: "Cái sổ theo lên, trang mới tinh", hint: "+1 danh tiếng · +6 người theo dõi",
            say: "Sổ theo lên chứ anh. Tiệm mới, sổ cũ, trang mới, nợ cũ… em gạch luôn coi như mừng tân gia.", fx: { rep: 1, followers: 6 } },
          { id: "ribbon", label: "Mời Cụ Năm cắt băng khai trương", hint: "+4 XP · hẹn khách quen ghé tiệm mới",
            say: "Cụ Năm cắt băng bằng cây kéo cắt chỉ, trả công bằng ba đồng xu như mọi sáng. Tiệm mới chính thức mở.",
            fx: { xp: 4 }, later: { id: "S02", days: 1 } },
        ],
      },
    },
  },
  {
    id: "S02", group: "co-che", tone: "good", when: "shift", priority: 2, cooldown: 3, once: true,
    if: { shop: true, tMax: 120000 }, who: { arch: "regular" },
    nodes: {
      start: {
        mood: "surprised", line: "Xe đẩy đâu rồi con? {Self} đứng chỗ cũ ở góc đường chờ mười phút, tưởng con nghỉ bán, đi một vòng mới thấy cái bảng hiệu.",
        choices: [
          { id: "tour", label: "Dẫn đi xem chỗ để xe đẩy trong tiệm", hint: "Khách đang chờ mất 3 giây · +1 danh tiếng · ghi Sổ khách quen",
            say: "Xe đẩy ở trong góc nè, con lau sạch, để làm kỷ niệm. Nó nghỉ hưu, nhưng vẫn nghe tiếng rạch bánh mỗi sáng.", fx: { patience: -3000, rep: 1, regular: true } },
          { id: "sign", label: "Hứa dựng bảng chỉ đường ở góc cũ", hint: "+3 XP · ca sau +1 khách",
            say: "Mai con dựng tấm bảng ở góc cũ: “Xe đẩy đã lên tiệm, đi thẳng ba chục bước.”", fx: { xp: 3, nextGuests: 1 } },
          { id: "same", label: "Làm “như cũ”, giảm 2k vì chờ lâu", hint: "Ổ người nói rẻ hơn 2k · người nói chờ thêm 6 giây",
            say: "Vẫn ổ như cũ, vẫn giòn như cũ, chỉ có mái nhà là mới. Hôm nay con bớt hai nghìn tiền đi lạc.", fx: { priceWho: -2, whoPatience: 6000 } },
        ],
      },
    },
  },
  {
    id: "S03", group: "co-che", tone: "mixed", when: "shift", priority: 2, cooldown: 4,
    if: { flags: ["noi-tieng"], waitingMin: 3 }, npc: "co-hai",
    nodes: {
      start: {
        mood: "annoyed", line: "Con ơi, hàng chờ của con dài ra tới đầu hẻm rồi. Xe rác không vô được, ông lao công đứng xếp hàng luôn cho đỡ buồn.",
        choices: [
          { id: "tickets", label: "Phát số thứ tự, mời khách đứng nép vào", hint: "Khách đang chờ mất 3 giây · +1 danh tiếng · +3 XP",
            say: "Phát số từng người, mời đứng nép sát tường. Hàng chờ gọn lại như hàng chờ khám bệnh, chỉ thơm hơn.", fx: { patience: -3000, rep: 1, xp: 3 } },
          { id: "na", label: "Nhờ Bé Na ra đầu hẻm điều phối", hint: "Bé Na gói giùm 20 giây · +1 danh tiếng",
            need: { flags: ["be-na"] },
            say: "Na ơi ra đầu hẻm điều phối giùm chú. Na cầm loa giấy, nói câu nào cũng có vần.", fx: { helper: 20000, rep: 1 } },
          { id: "coHai", label: "Mời Cô Hai ổ chả lụa nhiều đồ chua", hint: "−1 ổ trong tủ · Cô Hai dịu lại",
            say: "Cô ăn ổ này trước, con dời hàng vô sát mái hiên liền.",
            roll: { p: 0.65, win: { say: "Cô Hai nhận ổ, nói “hàng dài vậy là con làm ngon”, rồi đi phơi đồ tiếp. Lần đầu Cô Hai khen trước khi than.", fx: { bread: -1, rep: 1 } },
              lose: { say: "Cô Hai nhận ổ, vẫn than kẹt xe, nhưng than với giọng của người vừa ăn được ổ ngon.", fx: { bread: -1 } } } },
        ],
      },
    },
  },
  {
    id: "S04", group: "co-che", tone: "mixed", when: "shift", priority: 2, cooldown: 4,
    if: { flags: ["noi-tieng"], waitingMin: 2 }, who: { arch: "reviewer" },
    nodes: {
      start: {
        mood: "neutral", line: "Anh ơi, cho {self} xếp hàng riêng được không? {Self} quay nhanh thôi, ba mươi giây, có nhạc nền rồi.",
        choices: [
          { id: "fair", label: "Từ chối: ai cũng xếp chung một hàng", hint: "+1 danh tiếng · người nói chờ thêm 6 giây",
            say: "Hàng chờ ở đây chỉ có một làn, cụ Năm cũng xếp, chú Tám cũng xếp. Bánh mì không có hạng thương gia.", fx: { rep: 1, whoPatience: 6000 } },
          { id: "vip", label: "Cho quay nhanh ở đầu quầy", hint: "Khách đang chờ mất 6 giây · Hên xui: lên mạng hay bị hàng chờ phàn nàn",
            say: "Thôi được, em quay ở đầu quầy, nhanh gọn, đừng che bảng giá.",
            roll: { p: 0.5, win: { say: "Clip lên mạng ngay trong ngày, hàng chờ được quay vào làm cảnh nền hoành tráng.", fx: { patience: -6000, followers: 20, buzz: 1 } },
              lose: { say: "Hàng chờ thấy người chen lên, xì xào. Một review nhỏ lên sổ trước cả clip.", fx: { patience: -6000, review: { stars: 3, line: "Đứng chờ mười phút thì có người quay clip được lên trước. Bánh ngon, hàng chờ chưa công bằng. #xephang" } } } } },
          { id: "queue", label: "Rủ quay luôn cảnh hàng chờ", hint: "Chuyện còn tiếp…",
            say: "Hay em quay hàng chờ đi, hàng dài vậy là nội dung rồi đó.", goto: "queue" },
        ],
      },
      queue: {
        mood: "happy", line: "Ý hay! {Self} phỏng vấn từng người trong hàng: “Bạn chờ bao lâu rồi, bạn có hối hận không?”",
        choices: [
          { id: "ok", label: "Cho phỏng vấn, mời trà đá cả hàng", hint: "Khách đang chờ thêm 5 giây kiên nhẫn · +12 người theo dõi",
            say: "Mỗi người trong hàng được một ly trà đá và ba giây lên hình. Không ai hối hận.", fx: { patience: 5000, followers: 12 } },
          { id: "quick", label: "Nhắc phỏng vấn ngắn thôi", hint: "+3 XP",
            say: "Mỗi người một câu thôi em, hỏi dài quá bánh nguội mất.", fx: { xp: 3 } },
        ],
      },
    },
  },

  // ===== Lò điện =====
  {
    id: "E01", group: "co-che", tone: "good", when: "day", priority: 1, cooldown: 5,
    if: { owns: "electric-oven" }, npc: "me",
    nodes: {
      start: {
        mood: "surprised", line: "Con gửi hình ổ bánh lên nhóm nhà, ổ nào cũng vàng y chang ổ nào, như in bằng máy. Con nói thật với mẹ, con mua bánh công nghiệp về hâm hả?",
        choices: [
          { id: "video", label: "Gọi video cho mẹ xem lò điện", hint: "Chuyện còn tiếp…",
            say: "Mẹ coi nè, cái lò ba ngăn, con tự nhồi, tự nướng, nó chỉ nóng đều thôi.", goto: "video" },
          { id: "skill", label: "Nói: vàng đều mới là tay nghề", hint: "+3 XP",
            say: "Vàng đều là tay nghề mẹ ơi. Lò điện nóng đều, mà người canh vẫn là con.", fx: { xp: 3 } },
          { id: "burn", label: "Cố ý nướng một ổ xém gửi mẹ coi", hint: "−1 phôi · +6 người theo dõi",
            say: "Con nướng riêng một ổ xém cạnh, chụp gửi mẹ. Mẹ nhắn lại: “Ừ, giờ mới giống con mẹ.”", fx: { stock: { phoi: -1 }, followers: 6 } },
        ],
      },
      video: {
        mood: "neutral", line: "Lò gì không có lửa mà bánh vẫn chín? Hồi xưa mẹ nấu xôi phải nhóm bếp từ ba giờ sáng đó.",
        choices: [
          { id: "teach", label: "Chỉ mẹ cách hẹn giờ lò", hint: "Hên xui: mẹ thích công nghệ hay mẹ nhớ bếp than",
            say: "Mẹ bấm chỗ này là hẹn giờ, tới giờ nó kêu tít tít. Mẹ khỏi canh.",
            roll: { p: 0.5, win: { say: "Mẹ thích tiếng tít tít, nói muốn mua một cái nồi hấp xôi biết kêu. Cả nhà bàn chuyện đó tới tối.", fx: { followers: 5, xp: 3 } },
              lose: { say: "Mẹ nghe xong nói: “Bánh mà không nghe mùi thì sao biết nó vui hay buồn.” Con không cãi được.", fx: { xp: 2 } } } },
          { id: "charcoal", label: "Hứa giữ lò than nướng lại cho có mùi", hint: "+1 danh tiếng",
            say: "Con vẫn giữ lò than nướng lại mẹ ơi. Lò điện nướng cho đều, than nướng cho thơm, mẹ yên tâm.", fx: { rep: 1 } },
        ],
      },
    },
  },

  // ===== Phụ việc Bé Na =====
  {
    id: "N01", group: "co-che", tone: "mixed", when: "shift", priority: 2, cooldown: 4,
    if: { flags: ["be-na"], tMin: 15000 }, npc: "be-na",
    nodes: {
      start: {
        mood: "surprised", line: "Chú ơi… con đang quay clip “một ngày phụ tiệm bánh mì” mà con thối cho chị áo xanh dư hai chục nghìn. Clip quay rõ lắm luôn.",
        choices: [
          { id: "run", label: "Chạy theo chị áo xanh", hint: "Quầy bỏ trống 8 giây · Hên xui: kịp hay không",
            say: "Na coi quầy, chú chạy ra đầu hẻm. Áo xanh, áo xanh…",
            roll: { p: 0.6, win: { say: "Chị áo xanh đang đếm tiền, thấy dư, đang tính quay lại. Hai bên gặp nhau giữa hẻm, cười như phim.", fx: { away: 8000, rep: 1 } },
              lose: { say: "Đầu hẻm có bốn người mặc áo xanh. Không ai là chị đó. Chú đi về, mua học phí hai chục.", fx: { away: 8000, money: -20 } } } },
          { id: "post", label: "Đăng clip nhờ chị áo xanh quay lại", hint: "+8 người theo dõi · Hên xui: chị quay lại trả",
            say: "Đăng clip: “Chị áo xanh ơi, tiệm thối dư, chị ghé lấy thêm ổ que nha.”",
            roll: { p: 0.5, win: { say: "Chị áo xanh xem clip, chiều ghé trả hai chục, lấy thêm một ổ. Clip có phần hai.", fx: { followers: 14, buzz: 0.5 } },
              lose: { say: "Chị áo xanh không thấy clip, nhưng ba trăm người khác thấy. Bình luận: “bé Na dễ thương mà thối hào phóng quá”.", fx: { followers: 8 } } } },
          { id: "talk", label: "Nói chuyện với Na sau khi khách vãn", hint: "Chuyện còn tiếp…",
            say: "Không sao, để khách vãn chú cháu mình nói chuyện.", goto: "talk" },
        ],
      },
      talk: {
        mood: "neutral", line: "Con có bị đuổi không chú? Con hứa từ giờ chỉ quay lúc rảnh, mà lúc rảnh thì đâu có gì để quay.",
        choices: [
          { id: "rule", label: "Luật mới: quay ở bếp, không quay ở quầy tiền", hint: "Bé Na gói giùm 15 giây · +3 XP",
            say: "Quay thì quay ở lò, ở thớt. Tới quầy tiền thì cất điện thoại, mắt nhìn tờ tiền. Na gật đầu, đi gói liền.", fx: { helper: 15000, xp: 3 } },
          { id: "funny", label: "Cho Na đăng clip làm bài học", hint: "+10 người theo dõi · hẹn Na trình bày ý tưởng mới",
            say: "Đăng đi, đặt tên “bài học hai chục nghìn”. Ai xem cũng nhớ đếm tiền hai lần.", fx: { followers: 10 }, later: { id: "N02", days: 1 } },
        ],
      },
    },
  },
  {
    id: "N02", group: "co-che", tone: "good", when: "day", priority: 1, cooldown: 5,
    if: { flags: ["be-na"] }, npc: "be-na",
    nodes: {
      start: {
        mood: "happy", line: "Chú ơi, con nghĩ ra “ổ Gen Z”: bánh mì que nhúng sốt phô mai, rắc chà bông, gói giấy màu hồng, tên là “Giòn Tới Nóc”. Bạn con chắc chắn xếp hàng.",
        me: "Giòn… tới cái nóc nào?",
        choices: [
          { id: "try", label: "Bán thử một ngày", hint: "−10k giấy màu · ngày mai +3 học sinh",
            say: "Thử một ngày. Nếu bán được thì Na đặt tên tiếp, nếu ế thì chú ăn.", fx: { money: -10, mod: { id: "o-gen-z", days: 1, guests: { student: 3 } }, xp: 2 } },
          { id: "taste", label: "Làm thử cho cả nhà nếm trước", hint: "Chuyện còn tiếp…",
            say: "Làm thử một ổ, cả nhà nếm trước rồi tính.", goto: "taste" },
          { id: "later", label: "Hẹn để dành ý tưởng tới hè", hint: "+3 XP",
            say: "Ý hay, mà để hè đông học sinh rồi ra mắt. Na ghi vô sổ ý tưởng, trang thứ mười bảy.", fx: { xp: 3 } },
        ],
      },
      taste: {
        mood: "surprised", line: "Mẹ của chú nếm xong im lặng ba giây. Bé Na nín thở. Chú cũng nín thở.",
        choices: [
          { id: "wait", label: "Chờ Mẹ phán", hint: "Hên xui: Mẹ khen hay Mẹ lắc đầu",
            say: "Cả nhà chờ Mẹ phán như chờ công bố điểm thi.",
            roll: { p: 0.5, win: { say: "Mẹ nói: “Lạ mà được.” Bé Na quay clip câu đó, ổ Gen Z có câu quảng cáo chính thức.", fx: { followers: 15, buzz: 0.5, xp: 3 } },
              lose: { say: "Mẹ nói: “Ngon, mà ăn một lần thôi.” Bé Na ghi vào sổ: “Ổ Gen Z — phiên bản dành cho Mẹ: bớt phô mai.”", fx: { xp: 3 } } } },
          { id: "praise", label: "Khen Na sáng tạo trước khi Mẹ nói", hint: "+1 danh tiếng",
            say: "Chú khen trước: Na sáng tạo lắm. Mẹ cười, nuốt luôn câu chê vào cùng miếng bánh.", fx: { rep: 1 } },
        ],
      },
    },
  },

  // ===== Hội chợ =====
  {
    id: "F02", group: "co-che", tone: "good", when: "shift", priority: 2, cooldown: 4,
    if: { flags: ["hoi-cho"], tMin: 20000 }, npc: "cau-hung",
    nodes: {
      start: {
        mood: "happy", line: "Anh ơi, ban tổ chức xếp gian em sát gian anh nè! Bên kia đường thành bên kia vách. Mình thi coi ai bán nhanh hơn không?",
        choices: [
          { id: "race", label: "Nhận lời thi bán nhanh", hint: "Hên xui: thắng thì cả hội chợ biết tên tiệm",
            say: "Thi thì thi. Ai bán hết hai mươi ổ trước, người kia phải đứng vỗ tay.",
            roll: { p: 0.55, win: { say: "Tiệm bán hết trước. Cậu Hưng đứng vỗ tay thật, MC hội chợ còn đọc tên tiệm lên loa.", fx: { followers: 15, buzz: 1 }, later: { id: "F03", days: 1 } },
              lose: { say: "Cậu Hưng giảm giá liều, bán hết trước. Anh vỗ tay, khán giả tưởng hai tiệm là anh em.", fx: { xp: 4, followers: 5 } } } },
          { id: "share", label: "Rủ chia nhau tiền lẻ và giấy gói", hint: "+1 danh tiếng · hạn mức đổi lẻ +50k hôm nay",
            say: "Hội chợ đông, mình chia nhau tiền lẻ với giấy gói. Bán ở hai gian, lo chung một kho.", fx: { rep: 1, mod: { id: "hung-chia-le", days: 1, exchange: 50 } } },
          { id: "joint", label: "Rủ làm bảng chung “Hai xe một hẻm”", hint: "+5 XP · +8 người theo dõi · ban tổ chức để ý",
            say: "Hai gian treo chung tấm bảng: “Hai xe một hẻm, bánh nào cũng giòn.” Khách ghé gian này rồi qua gian kia.",
            fx: { xp: 5, followers: 8 }, later: { id: "F03", days: 1 } },
        ],
      },
    },
  },
  {
    id: "F03", group: "co-che", tone: "good", when: "day", priority: 2, cooldown: 5, once: true,
    if: { flags: ["hoi-cho"] }, npc: "mc",
    nodes: {
      start: {
        mood: "happy", line: "Chào anh chủ tiệm, ban tổ chức thấy gian bánh mì của anh đông nhất khu ăn uống. Năm sau mời anh quay lại, mình giữ chỗ trước cho anh luôn.",
        choices: [
          { id: "yes", label: "Nhận lời, cảm ơn ban tổ chức", hint: "+2 danh tiếng · +4 XP",
            say: "Dạ năm sau tiệm quay lại, mang theo lò, mang theo mẹ, mang theo cả cái bảng phấn.", fx: { rep: 2, xp: 4 } },
          { id: "gate", label: "Xin gian sát cổng vào", hint: "−20k giữ chỗ · hội chợ sau +2 khách mỗi ca",
            say: "Cho tiệm gian sát cổng nha, khách vừa bước vô là ngửi thấy mùi bánh.", fx: { money: -20, mod: { id: "gian-cong", days: 4, guests: 2 } } },
          { id: "hung", label: "Xin cho Cậu Hưng gian bên cạnh nữa", hint: "+1 danh tiếng · +10 người theo dõi",
            say: "Xin cho xe Hưng Phát gian kế bên. Hai đứa thi bán, khách được ăn no.", fx: { rep: 1, followers: 10 } },
        ],
      },
    },
  },

  // ===== Thử thách =====
  {
    id: "CH1", group: "co-che", tone: "mixed", when: "shift", priority: 2, cooldown: 4,
    if: { flags: ["thu-thach"], tMin: 15000 }, npc: "ti-map",
    nodes: {
      start: {
        mood: "happy", line: "Anh ơi, mình đang livestream chấm ngày thử thách của tiệm nè. Năm trăm người xem, ai cũng đang đếm giây giùm anh.",
        choices: [
          { id: "wave", label: "Chào khán giả một câu rồi làm tiếp", hint: "Khách đang chờ mất 2 giây · +12 người theo dõi",
            say: "Chào mọi người, đếm giây giùm tiệm nha, tiệm bận đếm tiền thối.", fx: { patience: -2000, followers: 12 } },
          { id: "explain", label: "Vừa ráp vừa giải thích từng bước", hint: "Chuyện còn tiếp…",
            say: "Bước một: rạch. Bước hai: phết pate. Bước ba: cầu trời không ai đổi ý.", goto: "explain" },
          { id: "focus", label: "Xin Tí Mập đứng xa một chút", hint: "+3 XP · khách đang chờ thêm 3 giây kiên nhẫn",
            say: "Em đứng xa xa giùm anh, ống kính gần quá anh run tay rạch lệch.", fx: { xp: 3, patience: 3000 } },
        ],
      },
      explain: {
        mood: "surprised", line: "Khán giả hỏi: “Chủ tiệm vừa nói vừa làm vậy có kịp không?” Tí Mập chĩa máy vô cái tủ kính.",
        choices: [
          { id: "show", label: "Rút một mẻ trên sóng", hint: "Hên xui: mẻ vàng đều hay mẻ có cá tính",
            say: "Mời mọi người xem: mẻ này rút ngay trên sóng, không cắt ghép.",
            roll: { p: 0.6, win: { say: "Mẻ vàng đều, vỏ kêu tách tách qua micro. Bình luận đồng loạt gõ “giòn”. Tí Mập chấm điểm trước khi ăn.", fx: { followers: 20, buzz: 1, rep: 1 }, later: { id: "CH2", days: 1 } },
              lose: { say: "Mẻ có một ổ xém cạnh. Tí Mập nói “ổ này có cá tính” và ăn luôn ổ đó trên sóng.", fx: { followers: 6, xp: 3 } } } },
          { id: "stop", label: "Xin tạm ngừng giải thích để chạy đơn", hint: "+2 XP",
            say: "Phần giải thích để sau thử thách, giờ tiệm phải chạy. Khán giả gõ “cố lên”.", fx: { xp: 2 } },
        ],
      },
    },
  },
  {
    id: "CH2", group: "co-che", tone: "good", when: "day", priority: 2, cooldown: 5, once: true,
    if: { flags: ["thu-thach-dat"] }, npc: "me",
    nodes: {
      start: {
        mood: "happy", line: "Mẹ in hình cái huy hiệu của con ra giấy, đem ra chợ khoe. Giờ cả chợ biết con mẹ đạt thử thách, có bà còn hỏi “thử thách gì mà khó vậy, có thi lại không”.",
        me: "Dạ… mẹ in to cỡ nào vậy mẹ?",
        choices: [
          { id: "frame", label: "Gửi mẹ khung giấy khen treo tiệm", hint: "+1 danh tiếng · có Khung giấy khen trên tường",
            say: "Con đóng khung một tấm treo tiệm, một tấm mẹ treo sạp xôi. Hai cái khung, một niềm tự hào.", fx: { rep: 1, own: "award-frame" } },
          { id: "post", label: "Nhờ mẹ đăng lên nhóm chợ", hint: "+15 người theo dõi · tiệm hot lên",
            say: "Mẹ đăng lên nhóm chợ, chú thích: “Con tôi đó. Bánh giòn, người hiền, chưa có người yêu.”", fx: { followers: 15, buzz: 1 } },
          { id: "thanks", label: "Cảm ơn mẹ đã dạy canh lửa", hint: "+5 XP",
            say: "Huy hiệu này một nửa là của mẹ. Mẹ dạy con nghe mùi mà rút, chứ đồng hồ không dạy được.", fx: { xp: 5 } },
        ],
      },
    },
  },
];
