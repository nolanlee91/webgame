// Sự kiện Vận hành O01–O12 (docs/quan-com-tam/DRAMA.md §2.2). Cấu trúc: xem chú thích đầu data/events.js.
// Bếp than không sợ cúp điện; nồi cơm thì sợ. Không thương hiệu, không người thật, không emoji.

export const EVENTS_VANHANH = [
  // ===== O01 · Hết than giữa cao điểm =====
  {
    id: "O01", group: "van-hanh", tone: "bad", when: "shift", priority: 2, cooldown: 3,
    if: { phase: "cao", coalMax: 15, stockMax: { than: 0 } }, npc: "owner",
    moment: "Hết than lúc 19 giờ. Quạt mo cứu cả buổi tối.",
    nodes: {
      start: {
        mood: "surprised",
        line: "Than chuyển màu xám. Kho không còn rổ nào, bao dự phòng cũng không. 'Ủa… lửa đâu rồi?'",
        me: "Cao điểm, sáu miếng sườn đang nhìn mình, còn than thì đang nghỉ hưu.",
        choices: [
          { id: "hoa", label: "Gọi Chú Hòa giao gấp", hint: "−50k · 5 rổ than tới liền, bếp yếu một lúc",
            need: { minLevel: 9 },
            say: "Chú Hòa chạy ba gác tới, đổ than xong còn đứng quạt giùm hai phút.", fx: { money: -50, stock: { than: 5 }, coal: 30 }, goto: "do" },
          { id: "sau", label: "Nhờ Anh Sáu chạy mua", hint: "−50k (45k than + 5k công) · 5 rổ, cô chủ ở lại bếp",
            say: "Anh Sáu phóng xe đi, mười phút sau về với năm rổ than và một câu chuyện kẹt xe.", fx: { money: -50, stock: { than: 5 }, coal: 20 }, goto: "do" },
          { id: "borrow", label: "Mượn quán bánh xèo bên cạnh 2 rổ", hint: "Không tốn tiền · cô chủ chạy qua 8 giây, mai trả",
            say: "Quán bánh xèo cho mượn hai rổ: 'Mai trả, nhớ trả than chứ đừng trả bằng cơm nha.'", fx: { stock: { than: 2 }, coal: 15, away: 8000, flag: "muon-than" }, goto: "do" },
          { id: "bicha", label: "Bán bì chả, không nướng nữa", hint: "Không tốn gì · tạm dừng nướng, khách chờ bớt kiên nhẫn 6 giây",
            say: "Treo bảng 'tạm hết sườn, còn bì chả'. Khách gật gù, ai cũng hiểu than cũng có lúc mệt.", fx: { patience: -6000 } },
        ],
      },
      do: {
        mood: "neutral",
        line: "Than mới đổ vô, nhưng miếng sườn đang dở trên vỉ thì vẫn còn nhợt nhạt.",
        choices: [
          { id: "fan", label: "Quạt cho đỏ lại", hint: "Không tốn gì · khói +30, miếng dở chín kịp",
            say: "Cô chủ quạt mo như đang chèo thuyền đua. Than đỏ lại, khói bay qua tận tiệm may.", fx: { coal: 10, smoke: 30 } },
          { id: "redo", label: "Gắp ra, nướng lại sau", hint: "Không tốn gì · khách chờ bớt kiên nhẫn 5 giây",
            say: "Gắp miếng dở ra, đợi than ổn mới nướng lại. Chậm mà chắc, sườn không có lỗi.", fx: { patience: -5000 } },
        ],
      },
    },
  },

  // ===== O02 · Cúp điện =====
  {
    id: "O02", group: "van-hanh", tone: "mixed", when: "shift", cooldown: 4,
    if: { minDay: 3, kind: "toi", phase: ["cao", "khuya"] }, npc: "owner",
    moment: "Cúp điện. Nồi cơm nghỉ, bếp than vẫn làm việc. Than: 1, điện: 0.",
    nodes: {
      start: {
        mood: "surprised",
        line: "Đèn tắt cả dãy. Cả hẻm 'ồ' lên một tiếng. 'Cúp điện! Nồi cơm tắt rồi!'",
        me: "Bếp than thì vẫn đỏ, coi như than thắng điện một bàn.",
        choices: [
          { id: "lamp", label: "Thắp đèn bình, nướng tiếp", hint: "Không tốn gì · bếp than chạy tiếp, nồi cơm đang nấu chậm lại, khách chờ bớt kiên nhẫn 4 giây",
            say: "Thắp đèn bình, quán sáng vàng như phim xưa. Sườn vẫn xèo xèo đều.", fx: { patience: -4000, xp: 2 }, goto: "rice" },
          { id: "phone", label: "Bật đèn điện thoại, mời khách ngồi tiếp", hint: "Không tốn gì · hên xui 60% khách khuya thích không khí (quán hot lên), 40% khách văn phòng chê",
            say: "Cả quán bật đèn điện thoại, như đêm nhạc acoustic có mùi mỡ hành.",
            roll: { p: 0.6,
              win: { say: "Khách khuya thích mê, chụp hình 'cơm tấm dưới ánh đèn điện thoại' đăng lên mạng.", fx: { hype: 1, followers: 12 } },
              lose: { say: "Một chị văn phòng than không thấy đường gắp đồ chua, chấm quán bớt một sao trong lòng.", fx: { rep: -1 } } } },
          { id: "close", label: "Đóng tạm 15 giây", hint: "Không tốn gì · giữ khách đang ngồi, khách mới chờ 15 giây",
            say: "Kéo tạm tấm bạt, mời khách đang ngồi ăn tiếp. Điện về thì mở lại.", fx: { pauseGuests: 15000 } },
        ],
      },
      rice: {
        mood: "annoyed",
        line: "Đèn bình sáng rồi, nhưng nồi cơm vẫn tắt ngóm. Trong nồi còn nửa mẻ cơm đang dở sống dở chín.",
        choices: [
          { id: "coal", label: "Đặt nồi lên bếp than ủ tiếp", hint: "Không tốn gì · than −10, cơm chín kịp",
            say: "Đặt nồi lên góc bếp than, ủ thêm. Cơm chín thơm mùi khói, như cơm nhà quê.", fx: { coal: -10, rice: 4 } },
          { id: "wait", label: "Chờ điện về", hint: "Không tốn gì · khách mới chờ 10 giây",
            say: "Chờ điện về. Năm phút sau đèn sáng, cả hẻm vỗ tay như đón giao thừa.", fx: { pauseGuests: 10000 } },
        ],
      },
    },
  },

  // ===== O03 · Nồi cơm đình công =====
  {
    id: "O03", group: "van-hanh", tone: "bad", when: "shift", cooldown: 4,
    if: { minDay: 4, riceCooking: true }, npc: "owner",
    moment: "Nồi cơm đình công lúc 18 giờ 45. Đập nhẹ một cái, không ăn thua.",
    nodes: {
      start: {
        mood: "surprised",
        line: "'Tạch.' Nồi cơm tắt, đèn đỏ nhấp nháy như đang gửi tín hiệu cầu cứu.",
        me: "Nồi cơm… đình công rồi. Chắc đòi tăng lương bằng điện.",
        choices: [
          { id: "tap", label: "Đập nhẹ vào hông nồi", hint: "Không tốn gì · hên xui 40% nồi chạy lại, 60% không",
            say: "Cô chủ vỗ nhẹ vào hông nồi như vỗ vai đồng nghiệp.",
            roll: { p: 0.4,
              win: { say: "Nồi kêu 'tạch' lần nữa rồi chạy lại. Có khi nồi chỉ cần được quan tâm.", fx: { xp: 3 } },
              lose: { say: "Nồi im re. Đèn đỏ nhấp nháy nhanh hơn, như đang cười.", fx: { rice: -2 }, goto: "broke" } } },
          { id: "lan", label: "Mượn nồi Cô Lan", hint: "Không tốn tiền · cô chủ chạy qua 10 giây, mai trả",
            say: "Cô Lan đưa nồi qua: 'Nấu xong rửa sạch nha, nồi này cô nấu chè.'", fx: { away: 10000, rice: 6, flag: "muon-noi" } },
          { id: "pot", label: "Nấu bằng nồi gang trên bếp phụ", hint: "−4k gas · cơm chậm hơn, khách chờ bớt kiên nhẫn 6 giây",
            say: "Lôi nồi gang của bà ngoại ra. Cơm hơi cháy đáy, khách quen xin luôn cơm cháy.", fx: { money: -4, rice: 8, patience: -6000 } },
          { id: "wait", label: "Chờ nồi nguội rồi thử lại", hint: "Không tốn gì · khách mới chờ 10 giây",
            say: "Rút điện, chờ nồi nguội, cắm lại. Nồi chạy, chậm nhưng vẫn chạy.", fx: { pauseGuests: 10000 } },
        ],
      },
      broke: {
        mood: "annoyed",
        line: "Nồi hỏng thật rồi. Nồi cơm cháy mùi khét nhẹ, như mùi tiền sắp bay.",
        choices: [
          { id: "new", label: "Mua nồi mới ngay", hint: "−150k · Anh Sáu chở tới, hết sự cố",
            say: "Anh Sáu chở nồi mới tới, còn nguyên tem. Nồi cũ được đặt lên kệ như huân chương.", fx: { money: -150, rice: 10 } },
          { id: "fix", label: "Sửa ngày mai", hint: "−40k tiền sửa · ca này chỉ còn cơm đang có",
            say: "Ca này bán hết cơm trong nồi là nghỉ. Mai chú thợ ghé sửa.", fx: { money: -40 } },
          { id: "make-do", label: "Bán cơm đang có rồi treo bảng", hint: "Không tốn gì · không nhận thêm khách",
            say: "Còn bao nhiêu cơm bán bấy nhiêu, treo bảng 'hết cơm' lúc chín giờ tối.", fx: { closeEarly: true } },
        ],
      },
    },
  },

  // ===== O04 · Mưa ngập vỉa hè =====
  {
    id: "O04", group: "van-hanh", tone: "mixed", when: "shift", cooldown: 3,
    if: { minDay: 4, stage: "street", flags: ["rain-today"] }, npc: "owner",
    moment: "Mưa ngập vỉa hè. Quán bán cơm dưới bốn cái dù và một tấm bạt.",
    nodes: {
      start: {
        mood: "surprised",
        line: "Mưa lớn quá, nước tràn lên vỉa hè rồi! Bàn ngoài ướt hết, ghế nhựa nổi lềnh bềnh như thuyền.",
        me: "Quán vỉa hè ngày mưa: nửa bán cơm, nửa chống lụt.",
        choices: [
          { id: "pull", label: "Dồn bàn sát mái", hint: "Không tốn gì · khách đang ngồi chuyển chỗ, bớt kiên nhẫn 6 giây, khách mới chờ 10 giây",
            say: "Dồn hết bàn vô sát mái, khách ngồi khít nhau, ai cũng thành người quen.", fx: { patience: -6000, pauseGuests: 10000 }, goto: "ut" },
          { id: "umbrella", label: "Mở dù che từng bàn", hint: "−20k · giữ đủ bàn, hên xui 30% gió lật dù",
            say: "Bốn cây dù bung ra, quán thành cánh đồng nấm.", fx: { money: -20 },
            roll: { p: 0.7,
              win: { say: "Dù đứng vững, khách ăn khô ráo, còn khen quán chu đáo.", fx: { rep: 1 }, goto: "ut" },
              lose: { say: "Một cơn gió lật ngửa cây dù, nước đổ xuống đúng chén nước mắm. Cả quán cười rần.", fx: { hype: 1 }, goto: "ut" } } },
          { id: "box", label: "Chuyển sang bán hộp mang về", hint: "Không tốn gì · thêm 3 shipper, không nhận khách ngồi mới",
            say: "Treo bảng 'mưa quá, quán bán hộp'. Shipper trùm áo mưa đứng xếp hàng.", fx: { arch: { arch: "shipper", n: 3 }, pauseGuests: 30000 }, goto: "ut" },
        ],
      },
      ut: {
        mood: "neutral",
        line: "Cô Út bán vé số đứng trú mưa dưới mái, ôm xấp vé số gói ni lông.",
        choices: [
          { id: "tea", label: "Mời cô ngồi uống trà", hint: "Không tốn gì · +1 danh tiếng",
            say: "Cô ngồi đây uống ly trà cho ấm, mưa tạnh rồi đi.", fx: { rep: 1 }, later: { id: "O05", days: 1 } },
          { id: "soup", label: "Mời một chén canh nóng", hint: "−1 phần cơm (chén canh kèm cơm) · +2 danh tiếng",
            say: "Chén canh nóng giữa trời mưa. Cô Út cầm chén, nói 'quán này sẽ trúng số'.", fx: { rice: -1, rep: 2 }, later: { id: "O05", days: 1 } },
        ],
      },
    },
  },

  // ===== O05 · Làm mái bạt =====
  {
    id: "O05", group: "van-hanh", tone: "good", when: "day",
    if: { chain: true }, npc: "co-lan",
    moment: "Mua mái bạt qua người quen của người quen. Giá tốt, màu xanh lá.",
    nodes: {
      start: {
        mood: "neutral",
        line: "Mưa hoài vầy, con làm cái mái bạt đi. Cô biết chỗ may bạt rẻ, Anh Sáu chở về cho.",
        me: "Mái bạt… nghe như bước đầu tiên của sự nghiệp có mái.",
        choices: [
          { id: "tarp", label: "Làm mái bạt ngay", hint: "−80k (giảm 10% nhờ Cô Lan) · ngày mưa bớt mất khách",
            say: "Mái bạt màu xanh lá dựng lên, cả hẻm khen quán như có mái nhà riêng.", fx: { money: -80, decor: "mai-bat", rep: 1, flag: "mai-bat", flagDays: 60 } },
          { id: "chairs", label: "Mua 4 ghế nhựa cao", hint: "−30k · bàn ngoài khỏi ngập, mưa vẫn vắng khách",
            say: "Bốn ghế nhựa cao, khách ngồi như trên đảo nhỏ giữa dòng nước.", fx: { money: -30, decor: "ghe-cao" } },
          { id: "later", label: "Để sau", hint: "Không tốn gì · không có gì thêm",
            say: "Để dành tiền thêm chút nữa, mưa thì mình chạy dù trước.", fx: { xp: 1 } },
        ],
      },
    },
  },

  // ===== O06 · Mất nước =====
  {
    id: "O06", group: "van-hanh", tone: "bad", when: "shift", cooldown: 4,
    if: { minDay: 5, kind: "toi", noFlags: ["bon-nuoc"] }, npc: "owner",
    moment: "Mất nước giữa ca. Rửa chén bằng can nước của tiệm may.",
    nodes: {
      start: {
        mood: "surprised",
        line: "Vòi nước kêu khè khè rồi im. Thau chén còn đầy, vòi thì khô như sa mạc.",
        me: "Mất nước! Dĩa dơ thì đầy, dĩa sạch thì đang đếm ngược.",
        choices: [
          { id: "can", label: "Dùng can nước dự trữ", hint: "Không tốn tiền · rửa liền 6 dĩa",
            say: "Can nước dự trữ cuối cùng cũng có ngày được ra trận.", fx: { wash: 6 }, goto: "plates", later: { id: "O07", days: 2 } },
          { id: "lan", label: "Chạy xin nước Cô Lan", hint: "Không tốn tiền · cô chủ rời quán 8 giây, rửa được 6 dĩa",
            say: "Cô Lan cho xin hai xô: 'Rửa nhẹ tay nha, nước này cô định tưới cây.'", fx: { away: 8000, wash: 6 }, goto: "plates", later: { id: "O07", days: 2 } },
          { id: "box", label: "Chuyển sang hộp ăn tại chỗ", hint: "Không tốn gì · khách ăn hộp, bớt hào hứng một chút",
            say: "Dĩa nghỉ, hộp lên thay. Khách ăn hộp tại bàn, như đi picnic trong hẻm.", fx: { patience: -3000 }, goto: "plates", later: { id: "O07", days: 2 } },
        ],
      },
      plates: {
        mood: "annoyed",
        line: "Dĩa sạch còn đúng ba cái, nước vẫn chưa về.",
        choices: [
          { id: "plastic", label: "Mua 20 dĩa nhựa dùng một lần", hint: "−20k · có dĩa ngay, khách văn phòng chê không bảo vệ môi trường",
            say: "Dĩa nhựa tạm thời. Một chị văn phòng nhắc 'quán nên dùng dĩa thật', quán xin lỗi và ghi nhớ.", fx: { money: -20, plates: 4, rep: -1 } },
          { id: "takeaway", label: "Treo bảng chỉ bán mang về", hint: "Không tốn gì · không nhận khách ngồi mới tới hết ca",
            say: "Treo bảng 'mất nước, chỉ bán mang về'. Ai đi ngang cũng chia buồn với thau chén.", fx: { closeEarly: true } },
        ],
      },
    },
  },

  // ===== O07 · Bồn nước chung =====
  {
    id: "O07", group: "van-hanh", tone: "good", when: "day",
    if: { chain: true }, npc: "to-dan-pho",
    moment: "Góp mười dĩa cơm cho buổi họp tổ dân phố. Họp xong sớm vì ai cũng no.",
    nodes: {
      start: {
        mood: "neutral",
        line: "Mấy nhà trong hẻm góp tiền đặt bồn nước chung, lỡ mất nước còn có cái xài. Quán góp không cô chủ?",
        me: "Bồn nước chung… vậy lần sau thau chén có chỗ nương tựa.",
        choices: [
          { id: "money", label: "Góp 100k", hint: "−100k · mất nước sau này khỏi lo, +2 danh tiếng",
            say: "Góp một trăm. Tên quán được ghi trên bồn nước, chữ nhỏ nhưng mực đậm.", fx: { money: -100, rep: 2, flag: "bon-nuoc", flagDays: 60 } },
          { id: "food", label: "Góp một mâm cơm cho buổi họp", hint: "−10 sườn ướp · +3 danh tiếng",
            say: "Mười dĩa cơm cho buổi họp tổ. Họp xong sớm vì ai cũng no, không ai muốn cãi.", fx: { stock: { "suon-uop": -10 }, rep: 3, flag: "bon-nuoc", flagDays: 60 } },
          { id: "later", label: "Để sau", hint: "Không tốn gì · hên xui 50% tuần sau bị nhắc lại",
            say: "Dạ để quán tính lại tuần sau nha chú.",
            roll: { p: 0.5,
              win: { say: "Chú tổ trưởng gật đầu: 'Không sao, khi nào tiện thì góp.'", fx: { xp: 1 } },
              lose: { say: "Chú tổ trưởng ghi tên quán vào sổ 'hẹn góp', gạch chân hai lần.", fx: { xp: 1 }, later: { id: "O07", days: 7 } } } },
        ],
      },
    },
  },

  // ===== O08 · Hết dĩa sạch =====
  {
    id: "O08", group: "van-hanh", tone: "mixed", when: "shift",
    if: { cleanPlatesMax: 0, seatedMin: 1, noFlags: ["helper-bong"] }, who: "seated",
    moment: "Hết dĩa lúc cao điểm. Cô Út rửa giùm sáu cái, kể giùm sáu câu chuyện.",
    nodes: {
      start: {
        mood: "surprised",
        line: "{Call} ơi, dĩa đâu {call}? {Self} thấy nồi cơm, thấy vỉ sườn, mà không thấy dĩa.",
        me: "Dĩa sạch: không. Thau dĩa dơ: đầy. Cô chủ: một.",
        choices: [
          { id: "wash", label: "Rửa ngay 6 dĩa", hint: "Không tốn gì · cô chủ đứng thau 6 giây, bếp vẫn chạy",
            say: "Xắn tay áo, sáu dĩa sạch bong trong sáu giây. Bếp vẫn xèo phía sau lưng.", fx: { wash: 6, away: 6000 } },
          { id: "box", label: "Dùng hộp ăn tại chỗ cho bàn này", hint: "−2k hộp · bàn này ăn hộp, khách chờ thêm 5 giây",
            say: "Hộp ăn tại chỗ, như đi dã ngoại. Khách cười: 'Hộp cũng ngon.'", fx: { money: -2, whoPatience: 5000 } },
          { id: "help", label: "Nhờ khách quen phụ rửa", hint: "Không tốn gì · hên xui 50% Cô Út rửa giùm, 50% cô kể chuyện thay vì rửa",
            say: "Cô Út ơi, phụ con rửa mấy cái dĩa được hông?",
            roll: { p: 0.5,
              win: { say: "Cô Út xắn tay áo, rửa sáu cái dĩa bóng loáng, vừa rửa vừa hát cải lương.", fx: { wash: 6, rep: 1 } },
              lose: { say: "Cô Út cầm miếng rửa chén, kể xong chuyện xổ số tuần trước thì dĩa vẫn dơ.", fx: { wash: 2, patience: -3000 } } } },
        ],
      },
    },
  },

  // ===== O09 · Lửa bùng =====
  {
    id: "O09", group: "van-hanh", tone: "mixed", when: "shift",
    if: { coalMin: 60, hotMin: 2 }, npc: "owner",
    moment: "Lửa bùng cao bằng nửa người. Sườn thơm, lông mày còn nguyên.",
    nodes: {
      start: {
        mood: "surprised",
        line: "Mỡ nhỏ xuống than, lửa bùng cao lên bằng nửa người. 'Ối, lửa!'",
        me: "Sườn đang được nướng bằng… pháo hoa.",
        choices: [
          { id: "water", label: "Rưới nước", hint: "Không tốn gì · lửa tắt, than −20, khói +20",
            say: "Rưới một vá nước, lửa tắt cái xèo. Khói bốc lên trắng như sương sớm.", fx: { coal: -20, smoke: 20 }, goto: "smoke" },
          { id: "move", label: "Gắp hết sang vùng giữ ấm", hint: "Không tốn gì · không miếng nào cháy, khách chờ bớt kiên nhẫn 4 giây",
            say: "Gắp lia lịa sang vùng giữ ấm. Không miếng nào cháy, tay hơi rát.", fx: { patience: -4000 } },
          { id: "lick", label: "Để lửa liếm cho thơm", hint: "Không tốn gì · hên xui 50% sườn thơm khói (+1 danh tiếng), 50% khói mù",
            say: "Để lửa liếm một chút, sườn sẽ thơm mùi khói.",
            roll: { p: 0.5,
              win: { say: "Sườn thơm khói, bàn gần nhất hít hà xin thêm một miếng.", fx: { rep: 1, hype: 1 } },
              lose: { say: "Khói mù mịt, hai miếng sém đen một góc. Cô chủ cạo khéo, khách không biết.", fx: { smoke: 30, coal: -10 } } } },
        ],
      },
      smoke: {
        mood: "surprised",
        line: "Khói trắng bốc lên cuồn cuộn, bàn gần bếp bắt đầu ho, có người lấy tay quạt.",
        choices: [
          { id: "fan", label: "Quạt khói ra đường", hint: "Không tốn gì · khói −20",
            say: "Quạt mo đổi hướng, khói bay ra đường. Bàn gần bếp thở phào.", fx: { smoke: -20 } },
          { id: "sorry", label: "Xin lỗi bàn gần bếp, tặng khăn lạnh", hint: "−2 khăn lạnh · khách dễ chịu hơn",
            say: "Xin lỗi, tặng hai cái khăn lạnh. Khách lau mặt, cười xí xoá.", fx: { stock: { "khan-lanh": -2 }, patience: 5000 } },
        ],
      },
    },
  },

  // ===== O10 · Hết gạo tấm =====
  {
    id: "O10", group: "van-hanh", tone: "bad", when: "shift", cooldown: 3,
    if: { minLevel: 3, stockMax: { "gao-tam": 0 }, riceMax: 4 }, npc: "owner",
    moment: "Quán cơm tấm hết tấm. Bán bánh mì sườn, khách khen 'sáng tạo'.",
    nodes: {
      start: {
        mood: "surprised",
        line: "Bao gạo tấm… hết rồi. Nồi cơm còn đúng mấy vá, bao gạo thì xẹp lép.",
        me: "Quán cơm tấm hết tấm. Câu này nghe như câu đố.",
        choices: [
          { id: "normal", label: "Nấu gạo thường", hint: "−8k · có cơm ngay, khách sành ăn chê 'đâu phải cơm tấm'",
            say: "Nấu gạo thường tạm. Một chú khách quen nhai một miếng, nhìn cô chủ đầy thông cảm.", fx: { money: -8, rice: 8, rep: -1 } },
          { id: "borrow", label: "Mượn quán bên cạnh 6 phần", hint: "Không tốn tiền · mai trả",
            say: "Quán bên cạnh cho mượn sáu phần gạo tấm. Tình hàng xóm đo bằng lon sữa bò.", fx: { stock: { "gao-tam": 6 }, flag: "muon-gao" }, later: { id: "U03", days: 1 } },
          { id: "sau", label: "Nhờ Anh Sáu chạy mua", hint: "−35k (giá +15%) · 20 phần gạo tấm về sau một lúc",
            say: "Anh Sáu chở bao gạo tấm về, đặt xuống như đặt bao vàng.", fx: { money: -35, stock: { "gao-tam": 20 }, patience: -4000 } },
          { id: "bread", label: "Bán bánh mì sườn", hint: "Không tốn gì · tối đa vài ổ, khách chờ bớt kiên nhẫn 5 giây",
            say: "Kẹp sườn vô bánh mì. Khách khen 'quán sáng tạo', quán cười như mình cố ý.", fx: { patience: -5000, hype: 1 } },
        ],
      },
    },
  },

  // ===== O11 · Bể dĩa =====
  {
    id: "O11", group: "van-hanh", tone: "good", when: "shift",
    if: { minDay: 6 }, npc: "owner",
    moment: "Bể hai cái dĩa. Cả quán hô 'mừng quán làm ăn phát đạt'.",
    nodes: {
      start: {
        mood: "surprised",
        line: "'Xoảng!' Chồng dĩa trượt khỏi tay, hai cái dĩa hy sinh trên nền gạch.",
        me: "Của đi thay người… mà của là dĩa, mười sáu ngàn.",
        choices: [
          { id: "clean", label: "Dọn ngay", hint: "Mất 2 dĩa · cô chủ dọn 4 giây",
            say: "Quét sạch mảnh dĩa, gói giấy báo cẩn thận cho chú ve chai khỏi đứt tay.", fx: { plates: -2, away: 4000 } },
          { id: "laugh", label: "Cười trừ 'của đi thay người'", hint: "Mất 2 dĩa · hên xui 60% khách vỗ tay (quán hot lên), 40% xin lỗi bàn gần nhất",
            say: "Của đi thay người, cả quán ơi!", fx: { plates: -2 },
            roll: { p: 0.6,
              win: { say: "Cả quán hô 'phát tài, phát tài'. Hai cái dĩa bể thành tiết mục khai trương.", fx: { hype: 1 } },
              lose: { say: "Một mảnh nhỏ văng gần chân khách. Quán xin lỗi, tặng ly trà, khách cười xí xoá.", fx: { teaAll: true } } } },
          { id: "bong", label: "Gọi Bông dọn", hint: "Mất 2 dĩa · Bông dọn, cô chủ ở lại bếp",
            need: { flags: ["helper-bong"] },
            say: "Bông cầm chổi, vừa quét vừa hát 'xoảng xoảng', nghe như bài mới của Anh Hùng Bass.", fx: { plates: -2, xp: 2 } },
        ],
      },
    },
  },

  // ===== O12 · Con mèo vàng =====
  {
    id: "O12", group: "van-hanh", tone: "good", when: "shift", cooldown: 3,
    if: { kind: "toi", warmMin: 2, noFlags: ["meo-nuoi"] }, npc: "owner",
    moment: "Có một nhân viên mới không lương: một con mèo vàng canh vỉ sườn.",
    nodes: {
      start: {
        mood: "happy",
        line: "Một con mèo vàng ngồi cạnh bếp, nhìn chằm chằm vỉ sườn như thanh tra vệ sinh.",
        me: "Ánh mắt đó… ánh mắt của người hiểu sườn.",
        choices: [
          { id: "feed", label: "Cho mèo một miếng vụn", hint: "Không tốn gì · mèo ở lại, khách chụp hình (+người theo dõi)",
            say: "Cho mèo một miếng vụn. Mèo ăn xong ngồi lại, rửa mặt, như đã ký hợp đồng.", fx: { followers: 10, flag: "meo-an" }, later: { id: "D08", days: 2 } },
          { id: "shoo", label: "Đuổi nhẹ", hint: "Không tốn gì · mèo đi, mai quay lại",
            say: "Đuổi nhẹ. Mèo đi ba bước, quay lại nhìn như muốn nói 'mai gặp'.", fx: { xp: 1 } },
          { id: "water", label: "Đặt chén nước, mặc kệ", hint: "Không tốn gì · hên xui 50% mèo ngủ cạnh ghế khách (+1 danh tiếng), 50% mèo nhảy lên bàn",
            say: "Đặt chén nước rồi để mèo tự quyết định cuộc đời.",
            roll: { p: 0.5,
              win: { say: "Mèo uống nước, nằm cuộn tròn dưới ghế khách. Khách khen quán 'có không khí'.", fx: { rep: 1, flag: "meo-an" }, later: { id: "D08", days: 2 } },
              lose: { say: "Mèo nhảy lên bàn, một chị hét lên, dĩa cơm suýt bay. Mèo bình thản bỏ đi.", fx: { patience: -4000 } } } },
        ],
      },
    },
  },
];
