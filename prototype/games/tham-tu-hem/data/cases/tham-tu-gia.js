// Vụ 12: "Thám Tử Giả Mạo" (độ khó 3, cuối mùa 2). Cơ chế mới: THÁM TỬ ĐỐI ĐẦU.
// Trong finale.steps, Hiếu "Thám Tử Pro" vừa live vừa buộc tội lần lượt Bảo, bà Cúc, chị Ly, rồi Tèo (claim là lời Hiếu).
//   Người chơi phản bác từng kết luận sai bằng vật chứng. Tới lượt Tèo thì vật chứng gỡ tội Tèo lại chính là thứ lật tẩy
//   buổi live của Hiếu, rồi 3 bước cuối Hiếu tự bào chữa và bị vạch mặt.
// Dòng thời gian:
//   Thứ Hai 17h05: Tèo để chìa gốc văn phòng ở sạp Bảo nhờ in dự phòng, thẻ treo "TÈO – VP THÁM TỬ – 8h tối lấy".
//     Hiếu ngồi ghế nhựa sạp quay vlog, thu luôn tiếng Tèo (cú lật: Hiếu nghe lén).
//   Thứ Hai 19h50: người mặc măng tô, kính râm tự xưng "bên văn phòng" nhờ in thêm 1 chìa 47B. Bảo in, tip 200k (bộ đếm máy: 2 lần).
//   Thứ Năm 22h03–22h58: bà Cúc lấy chìa tổng vô văn phòng xem phim Hàn ké máy lạnh (tài khoản CucXinhDep1958).
//   23h05–23h40: live của Hiếu là một đoạn 3 phút phát lặp. 23h12–23h38 Tèo ở nhà bình luận "anh Pro đứng im vậy, lag hả".
//   23h17: chị Ly (rình trong xe trước văn phòng) chụp người măng tô kính râm mở cửa kính bằng chìa.
//   23h21–23h33: máy tính văn phòng bật lại, chép "Ảnh hiện trường vụ 1–6" ra USB "TTP_BACKUP". Mèo văn phòng cào rách vạt măng tô.
//   00h52: tài khoản "Sự Thật Hẻm 47" đăng ảnh hồ sơ, bìa nhựa nào cũng phản chiếu vòng sáng ring light.
// Thủ phạm: pro. Gây nhiễu: Bảo (in thêm chìa, tẩy sổ vì sợ mất tiếng), bà Cúc (xem phim ké, đòi tăng giá thuê),
//   chị Ly (giật tít bôi nhọ nhưng là fan cứng, rình 3 đêm không dám gõ cửa), Tèo (lén in chìa vì sợ bị la).
export default {
  id: "tham-tu-gia",
  no: 12,
  title: "Thám Tử Giả Mạo",
  tagline: "Văn phòng bị đột nhập, hồ sơ sáu vụ cũ biến mất, và trên mạng có một ‘thám tử’ phá án trong 60 giây. Lần nào cũng sai.",
  difficulty: 3,
  client: "teo",

  intro: [
    ["narr", "7 giờ sáng thứ Sáu. Thám tử tới văn phòng với hai ổ bánh mì. Cửa kính khép hờ. Bên trong như vừa có bão."],
    ["narr", "Tủ hồ sơ mở toang, giấy tờ rơi đầy sàn. Con mèo văn phòng ngồi trên nóc tủ, lông dựng đứng. Tèo đứng giữa phòng, mặt trắng bệch, tay cầm điện thoại."],
    ["teo", "Sếp ơi… văn phòng mình bị trộm. Mất hồ sơ. Mất sáu vụ luôn sếp. Nồi Thịt Kho, Chiến Kê, Trà Sữa, Mất Wifi, Đám Cưới, Đám Hỏi. Mất hết.", "shock"],
    ["teo", "Mà chưa hết… sếp coi nè. Trên mạng.", "nervous"],
    ["narr", "Trên màn hình là một clip TikTok đăng lúc [[6h-sang|6 giờ sáng]]. Một anh mặc măng tô, kính râm, ring light chói loá sau lưng."],
    ["pro", "Xin chào một triệu hai anh em! Thám Tử Pro đây! Hôm nay Pro sẽ PHÁ LẠI vụ ‘Nồi Thịt Kho’ của cái gọi là ‘Thám Tử Hẻm’. Thủ phạm thật là cậu sinh viên Tuấn! Áo dính nước màu! Sáu mươi giây, xong! Bấm theo dõi!", "smug"],
    ["me", "Thủ phạm vụ đó là Linh. Áo Tuấn dính sa tế mì gói. Cả hẻm biết.", "neutral"],
    ["teo", "Ảnh còn chiếu hình hồ sơ của mình nữa sếp! Có con dấu ‘Thám Tử Hẻm – Lưu’, có hình con gà em vẽ bậy ở góc!", "angry"],
    ["batu", "Thám tử ơi! Bà Tư đây! Nhóm Hóng Biến loạn rồi! Có cái nick ‘Sự Thật Hẻm 47’ đăng bài từ nửa đêm, nói thám tử hẻm mình sáu vụ bắt nhầm sáu! Bà xoá không kịp!", "shock"],
    ["me", "Không ai [[pha-khoa|phá khoá]]. Tủ không bị cạy. Người vô đây có chìa."],
    ["teo", "Chìa… văn phòng có hai chìa thôi. Sếp một cái. Em một cái…", "nervous"],
    ["me", "Tèo. Cậu có gì muốn nói với tui không?", "neutral"],
    ["teo", "Dạ… dạ không sếp. Không có gì. Em đi pha cà phê.", "nervous"],
  ],

  social: {
    group: "Hẻm 47 Hóng Biến",
    posts: [
      {
        by: "batu",
        text: "⚠️⚠️ BÀ CON ĐỪNG TIN NICK ‘SỰ THẬT HẺM 47’ ⚠️⚠️ Văn phòng thám tử hẻm mình bị đột nhập đêm qua, mất hồ sơ sáu vụ. Sáng ra trên TikTok có ông ‘Thám Tử Pro’ đem hồ sơ đi ‘phá lại’, nói ai cũng bị bắt nhầm. Bà Tư admin mười năm, bà nói cho mà nghe: thám tử hẻm mình chưa bắt nhầm ai hết!",
        likes: 12047,
        comments: [
          { by: "Tuấn (vụ Nồi Thịt Kho)", text: "Tui bị buộc tội lần thứ hai trong đời. Lần này bởi người tui không quen. Áo tui dính sa tế! SA TẾ!" },
          { by: "Cô Mười Cơm Gà", text: "Ông Pro đó nói tui bắt con Chiến Thần. Tui bán cơm gà công nghiệp nha, gà chọi dai lắm, ai mà ăn!" },
          { by: "Hằng Kế Toán", text: "Pro nói tui ăn kiêng nên lén uống trà sữa chị Vy. Tui ăn kiêng thật. Cũng vì vậy mà tui KHÔNG uống." },
          { by: "Ông Năm (vụ Mất Wifi)", text: "Nó nói tui cắt cáp. Tui ghét ồn, chớ tui không cắt cáp. Ai rảnh đi cắt cáp lúc nửa đêm." },
          { by: "Bé Ti", text: "ông pro nói con lấy nhẫn. con 7 tuổi. con hông có. con mách ông cố." },
          { by: "Thám Tử Pro", text: "Sự thật thì luôn mất lòng 😎 Theo dõi Pro để biết thêm sự thật #thamtupro #phaan60giay" },
          { by: "teo", text: "…" },
        ],
      },
    ],
  },

  people: {
    pro: {
      name: "Hiếu ‘Thám Tử Pro’",
      role: "TikToker phá án, 1,2 triệu theo dõi",
      bio: "26 tuổi, áo măng tô màu be, kính râm cả ban đêm, ring light kẹp điện thoại. Slogan: ‘Phá án 60 giây’. Đã ‘phá’ hơn trăm vụ trên mạng, chưa vụ nào đúng.",
      suspect: true,
      start: true,
    },
    ly: {
      name: "Chị Ly",
      role: "Phóng viên trang ‘Hóng 24h’",
      bio: "Khoảng 30 tuổi, micro cầm tay, son đỏ, sổ tay kẹp bút. Tác giả bài ‘Thám Tử Hẻm: 6 vụ, 6 lần bắt nhầm?’ đăng sáng nay.",
      suspect: true,
      start: true,
    },
    bao: {
      name: "Anh Bảo",
      role: "Thợ khoá đầu hẻm",
      bio: "Khoảng 45 tuổi, chùm chìa khoá đeo hông kêu leng keng. Hai mươi năm in chìa, mở khoá. Hay nói chuyện với ổ khoá như nói với người.",
      suspect: true,
      start: true,
    },
    bacuc: {
      name: "Bà Cúc",
      role: "Chủ nhà cho thuê văn phòng",
      bio: "Khoảng 68 tuổi, uốn tóc xoăn, quạt nhựa, giữ chìa tổng mọi phòng trong dãy. Vừa gửi thông báo tăng giá thuê 30% từ tháng sau.",
      suspect: true,
      start: true,
    },
    teo: {
      name: "Tèo",
      role: "Trợ lý văn phòng (nghi phạm?!)",
      bio: "19 tuổi, áo thun vàng, dép tổ ong. Giữ chiếc chìa thứ hai của văn phòng. Sáng nay né ánh mắt sếp ba lần.",
      suspect: true,
      start: true,
    },
  },

  locations: {
    "office-night": {
      name: "Văn phòng thám tử (bị lục tung)",
      scene: "office-night",
      start: true,
      intro: [
        ["narr", "Văn phòng thám tử. Ánh đèn bàn còn bật từ đêm qua. Giấy tờ vương vãi, ghế đổ, cửa tủ hồ sơ há hốc. Trên tường, sáu khung ảnh sáu vụ án, một khung bị lệch."],
        ["teo", "Sếp… em xin lỗi trước. Em chưa biết em xin lỗi vì cái gì, mà em thấy em nên xin lỗi.", "nervous"],
      ],
      hotspots: [
        {
          id: "tu-ho-so-mo",
          label: "Tủ hồ sơ bị mở",
          rect: [60, 120, 200, 320],
          lines: [
            ["narr", "Tủ hồ sơ sắt bốn ngăn. Ngăn thứ hai mở toang, sáu bìa [[ho-so|hồ sơ vụ 1–6]] biến mất. Ổ khoá tủ không trầy một vết."],
            ["me", "Chìa tủ vẫn cắm trên ổ. Bình thường chìa tủ nằm trong ống bút con mèo trên bàn. Kẻ trộm biết chỗ."],
            ["me", "Chỉ lấy sáu bìa vụ cũ. Ngăn tiền lẻ ngay dưới không đụng. Đây không phải trộm tiền. Đây là trộm chuyện."],
            ["teo", "Ngăn tiền lẻ có ba chục nghìn với cái phiếu giảm giá trà sữa. Ăn trộm mà không lấy phiếu giảm giá… người này giàu.", "neutral"],
          ],
          gives: { clues: ["ho-so-mat"] },
          again: [["me", "Sáu bìa vụ cũ. Không lấy tiền. Chìa tủ cắm sẵn trên ổ."]],
        },
        {
          id: "cua-kinh",
          label: "Cửa kính",
          rect: [400, 40, 160, 400],
          lines: [
            ["narr", "Cửa kính văn phòng, ổ khoá tay nắm. Không vết cạy, không vết nứt. Xoay chìa của thám tử: êm ru."],
            ["me", "Soi đèn pin vô lỗ khoá: có mạt đồng li ti, sáng bóng. Chìa mới in, răng còn ba-via, tra vô lần đầu thì để lại mạt đồng như vầy. Đêm qua có một [[chia-47b|chìa 47B]] mới in đã mở cánh cửa này."],
            ["narr", "Mặt ngoài tấm kính, ngang tầm mắt người, có một vết son đỏ hình đôi môi, kế bên là một vệt mờ hình trán và chóp mũi. Như ai đó áp mặt vô kính nhìn trộm."],
            ["me", "Vết son ở mặt NGOÀI. Người này đứng ngoài nhìn vô, chưa từng ở bên trong. Màu [[son-moi|son đỏ]] rất đậm."],
            ["teo", "Ai hôn cửa văn phòng mình vậy sếp? Fan hả? Mình có fan hả sếp?", "happy"],
          ],
          gives: { clues: ["cua-khong-pha", "dau-son-kinh"] },
          again: [["teo", "Em lau thử… dạ, son lì. Lì như người đánh nó.", "neutral"]],
        },
        {
          id: "ban-lam-viec",
          label: "Bàn làm việc",
          rect: [560, 280, 260, 160],
          lines: [
            ["narr", "Bàn làm việc của thám tử. Ống bút hình con mèo bị lật. Ly cà phê sữa đá của Tèo còn nguyên từ chiều qua, đá tan hết."],
            ["me", "Dán ngay mép màn hình là một tờ giấy nhớ chữ Tèo: ‘Hồ sơ vụ 1–6: tủ sắt ngăn 2. Chìa tủ: trong ống bút con mèo. ĐỪNG QUÊN!!!’"],
            ["teo", "Dạ… em ghi để em nhớ. Em hay quên chìa tủ. Ai ngờ… kẻ trộm cũng đọc được.", "nervous"],
            ["me", "Cậu viết bản đồ kho báu rồi dán ngay giữa phòng, Tèo."],
          ],
          gives: { clues: ["giay-nho-teo"] },
          again: [["teo", "Em gỡ tờ giấy xuống rồi sếp. Giờ em ghi lên tay.", "nervous"]],
        },
        {
          id: "may-tinh",
          label: "Máy tính văn phòng",
          rect: [620, 140, 180, 140],
          lines: [
            ["narr", "Máy tính văn phòng. Thám tử mở nhật ký hệ thống, coi ai đã đăng nhập đêm qua."],
            ["me", "Phiên một: 22h03 tới [[22h58]]. Tài khoản khách tên ‘[[cucxinhdep|CucXinhDep1958]]’. Trình duyệt mở phim Hàn ‘Hẻm Nhỏ Tình To’, tập 13 với tập 14. Đăng xuất 22h58."],
            ["me", "Phiên hai: 23h21 tới 23h33. Không đăng nhập tài khoản, chỉ bấm màn hình chờ. Một ổ [[usb|USB]] tên ‘[[ttp-backup|TTP_BACKUP]]’ được cắm vô, chép thư mục ‘Ảnh hiện trường vụ 1–6’. Rút USB lúc 23h33."],
            ["teo", "Hai phiên! Một người xem phim, một người ăn trộm. Đêm qua văn phòng mình đông hơn ban ngày!", "shock"],
          ],
          gives: { clues: ["lich-su-may-tinh"] },
          again: [["me", "22h03–22h58: CucXinhDep1958 xem phim. 23h21–23h33: USB TTP_BACKUP chép ảnh hồ sơ."]],
        },
        {
          id: "meo-van-phong",
          label: "Mèo văn phòng",
          rect: [80, 30, 140, 90],
          lines: [
            ["narr", "Con mèo mướp văn phòng tên Kính Lúp, ở với văn phòng từ hồi vụ Nồi Thịt Kho. Nó ngồi trên nóc tủ, đuôi xù như cây chổi lông gà."],
            ["me", "Đưa tay cho nó ngửi. Kẹt trong móng chân trước của Kính Lúp là mấy sợi chỉ màu be, loại vải dày dệt chéo. Nó đã cào ai đó."],
            ["teo", "Kính Lúp giỏi quá! Mèo của văn phòng thám tử có khác! Tối nay em thưởng cho con một hộp pate!", "happy"],
            ["narr", "Kính Lúp nhìn Tèo một cái lạnh tanh, rồi quay mặt đi."],
            ["teo", "…Nó giận em. Nó biết gì đó.", "nervous"],
          ],
          gives: { clues: ["soi-chi-be"] },
          again: [["teo", "Kính Lúp vẫn chưa thèm nhìn em. Mèo mà giận dai hơn sếp.", "nervous"]],
        },
        {
          id: "gam-tu",
          label: "Gầm tủ hồ sơ",
          rect: [60, 440, 200, 70],
          lines: [
            ["narr", "Soi đèn xuống gầm tủ hồ sơ. Giữa bụi và một cây bút bi mất nắp, có một mảnh vải nhỏ hình tam giác."],
            ["me", "Vải dày màu be, dệt chéo, một cạnh còn đường may viền. Mảnh vạt áo [[mang-to|măng tô]] bị móng mèo xé ra. Dính hai sợi lông mèo mướp."],
            ["teo", "Kẻ trộm mặc măng tô… giống sếp! Sếp ơi, sếp có alibi không sếp?", "shock"],
            ["me", "Áo tui là áo khoác kaki nâu, Tèo. Cậu nhìn tui mỗi ngày mà."],
          ],
          gives: { clues: ["manh-vai-be"] },
          again: [["me", "Mảnh vạt măng tô màu be, đường may viền, dính lông mèo mướp."]],
        },
        {
          id: "khung-anh",
          label: "Sáu khung ảnh vụ án",
          rect: [280, 30, 100, 220],
          lines: [
            ["narr", "Sáu khung ảnh treo dọc tường: cô Hai ôm nồi thịt kho, ông Bảy với Chiến Thần, chị Vy giơ ly trà sữa, cô Út trước tivi, cô dâu chú rể đám cưới, ông Cả đeo nhẫn cho Ngọc."],
            ["teo", "Khung đám hỏi bị lệch. Chắc kẻ trộm đụng trúng. Em sửa lại nha.", "nervous"],
            ["teo", "Sếp… sáu vụ đó em đều có mặt. Em đoán sai hết sáu. Mà em vẫn nhớ từng vụ.", "nervous"],
            ["me", "Đoán sai sáu vụ, mà vẫn ở lại tới vụ thứ mười hai. Ở lại cũng là một cái tài, Tèo."],
          ],
          again: [["teo", "Em thẳng lại khung rồi. Giờ nhìn ông Cả cười đẹp hơn.", "happy"]],
        },
      ],
    },

    locksmith: {
      name: "Sạp thợ khoá đầu hẻm",
      scene: "locksmith",
      start: true,
      intro: [
        ["narr", "Sạp thợ khoá của anh Bảo, dựng dưới mái hiên tiệm tạp hoá đầu hẻm. Tiếng máy cắt chìa rè rè, mùi dầu máy với mạt đồng."],
        ["bao", "Thám tử hả? Nghe nói văn phòng bị vô trộm. Cửa không bị phá đúng không? Vậy là chìa rồi. Tui làm nghề hai mươi năm, nghe là biết.", "nervous"],
        ["teo", "Anh Bảo… à… chào anh. Lâu quá không gặp. Em chưa bao giờ tới đây hết. Ờ.", "nervous"],
        ["bao", "Hả? Mới thứ Hai…", "neutral"],
        ["teo", "Anh Bảo ơi, cái ổ khoá kia đẹp ghê! Sếp coi ổ khoá kìa sếp!", "nervous"],
      ],
      hotspots: [
        {
          id: "may-cat-khoa",
          label: "Máy cắt chìa",
          rect: [360, 200, 220, 160],
          lines: [
            ["narr", "Máy cắt chìa đời cũ, sơn xanh tróc. Bên hông gắn một bộ đếm cơ, mỗi khuôn phôi một hàng số, có dòng ghi theo ngày."],
            ["me", "Hàng phôi 47B, ngày thứ Hai: số đếm là 2. Hai lần cắt. Lần một 17h10, lần hai [[19h50]]."],
            ["me", "Ổ khoá cửa kính văn phòng thám tử là loại 47B. Thứ Hai có hai cái chìa 47B ra đời ở đây."],
            ["teo", "Hai cái… Em… em chỉ nhờ… à không, em có nhờ gì đâu.", "nervous"],
          ],
          gives: { clues: ["bo-dem-may"] },
          again: [["me", "Phôi 47B, thứ Hai: 17h10 và 19h50. Hai chìa."]],
        },
        {
          id: "bang-chia-phoi",
          label: "Bảng chìa phôi",
          rect: [80, 60, 240, 220],
          lines: [
            ["narr", "Tấm bảng gỗ cắm đầy móc, mỗi móc treo phôi chìa và chìa khách gửi chờ in. Mỗi chìa gửi có một thẻ giấy buộc dây."],
            ["me", "Móc cuối còn sót một thẻ giấy cũ, chữ anh Bảo: ‘[[teo|TÈO]] – VP THÁM TỬ – chìa gốc, in 1 – 8h tối lấy’. Thẻ treo ngay mép sạp, ai ngồi ghế chờ cũng đọc được."],
            ["teo", "…", "nervous"],
            ["me", "Tèo?", "neutral"],
            ["teo", "Sếp… cho em… cho em một phút.", "nervous"],
          ],
          gives: { clues: ["the-treo-chia"] },
          again: [["me", "‘TÈO – VP THÁM TỬ – chìa gốc, in 1 – 8h tối lấy’. Treo ngay mép sạp, ghế chờ nhìn thẳng vô."]],
        },
        {
          id: "so-in-khoa",
          label: "Sổ in khoá",
          rect: [600, 260, 140, 90],
          lines: [
            ["narr", "Cuốn sổ in khoá bìa xanh, ghi tay từng đơn. Lật tới thứ Hai."],
            ["me", "‘17h05 – Tèo, VP thám tử – in 1 chìa 47B – để chìa gốc, 20h lấy – 30k’. Dòng dưới bị tẩy gôm sạch, giấy còn xơ."],
            ["me", "Nghiêng sổ dưới đèn, vết bút còn hằn: ‘19h50 – người bên VP thám tử – in thêm 1 chìa 47B theo mẫu – áo măng tô, kính râm – 30k + bo 200k’."],
            ["teo", "Người bên văn phòng thám tử? Văn phòng mình có hai người thôi! Sếp với em! Mà em không có bo ai 200 nghìn, em còn không có 200 nghìn!", "shock"],
          ],
          gives: { clues: ["so-in-khoa"] },
          again: [["me", "Dòng bị tẩy: 19h50, ‘người bên VP thám tử’, măng tô, kính râm, bo 200 nghìn."]],
        },
        {
          id: "ghe-nhua-sap",
          label: "Ghế nhựa chờ",
          rect: [620, 380, 120, 130],
          lines: [
            ["narr", "Cái ghế nhựa đỏ cho khách ngồi chờ, kê sát mép sạp, nhìn thẳng vô bảng chìa phôi."],
            ["me", "Kẹt giữa khe ghế là một tấm danh thiếp nhũ vàng: ‘HIẾU – [[thamtupro|THÁM TỬ PRO]] – Phá án 60 giây – TikTok @thamtupro’. Góc danh thiếp dính một vệt trà sữa đã khô."],
            ["bao", "Khách thứ Hai đó. Ngồi đây gần tiếng đồng hồ, cầm điện thoại quay quay, nói một mình. Tui tưởng diễn viên.", "neutral"],
          ],
          gives: { clues: ["danh-thiep-pro"] },
          again: [["teo", "Ghế này ngồi thấy hết cả sạp. Thấy luôn cái thẻ tên em…", "nervous"]],
        },
        {
          id: "hu-chia-cu",
          label: "Hũ chìa khoá cũ",
          rect: [780, 300, 120, 140],
          lines: [
            ["narr", "Một hũ thuỷ tinh to đựng đầy chìa khoá cũ không ai nhận. Dán nhãn: ‘Chìa mồ côi – ai nhận ra chìa nhà mình thì lấy, miễn phí’."],
            ["bao", "Hai mươi năm, mấy trăm cái chìa khách gửi rồi quên. Tui không nỡ bỏ. Chìa nào cũng từng mở một cánh cửa của ai đó.", "neutral"],
            ["teo", "Anh Bảo nói chuyện với chìa khoá như thơ vậy. Em cảm động.", "happy"],
          ],
          again: [["bao", "Cái chìa có móc hình con vịt đó, chủ nó gửi từ năm 2009. Tui vẫn chờ.", "neutral"]],
        },
        {
          id: "bang-gia-sap",
          label: "Bảng giá",
          rect: [780, 40, 140, 160],
          lines: [
            ["narr", "Bảng giá viết phấn: ‘In chìa: 30k. Mở khoá nhà: 100k. Mở khoá xe: 80k. Mở khoá trái tim: không nhận. In chìa nhà người khác: KHÔNG NHẬN’."],
            ["me", "Dòng cuối gạch dưới hai lần. Anh Bảo có luật nghề."],
            ["teo", "Vậy mà… dòng tẩy trong sổ…", "nervous"],
          ],
          again: [["teo", "‘Mở khoá trái tim: không nhận’. Anh Bảo từng bị từ chối hả anh?", "neutral"]],
        },
      ],
    },

    studio: {
      name: "Studio của Thám Tử Pro",
      scene: "studio",
      needs: "talk:pro.thach-dau",
      intro: [
        ["narr", "Studio của Thám Tử Pro: căn phòng thuê trên lầu hai tiệm điện thoại đầu chợ. Ring light to bằng cái mâm, tường dán giấy cách âm hình trứng, máy lạnh chạy hết công suất."],
        ["pro", "Chào mừng tới đại bản doanh! Ở đây Pro phá án bằng công nghệ! Không lết đi hiện trường mỏi chân như mấy người đâu!", "smug"],
        ["teo", "Sếp ơi, ring light to quá. Em đứng gần mà thấy mình đẹp trai lên.", "happy"],
      ],
      hotspots: [
        {
          id: "ring-light-pro",
          label: "Ring light",
          rect: [380, 40, 200, 200],
          lines: [
            ["narr", "Ring light đường kính gần nửa mét, chân ba càng. Bật lên thì cả phòng trắng xoá, không còn cái bóng nào."],
            ["me", "Đèn tròn, sáng trắng. Rọi vô bất cứ bề mặt bóng nào cũng in lại một vòng sáng tròn vành vạnh."],
            ["pro", "Ánh sáng là sự thật! Pro không có góc tối!", "smug"],
            ["teo", "Anh Pro ơi, mắt em thấy một vòng tròn trắng rồi. Em nhìn đâu cũng thấy vòng tròn.", "nervous"],
          ],
          again: [["teo", "Em vẫn còn thấy vòng tròn. Đây là hậu quả của sự thật hả anh Pro?", "nervous"]],
        },
        {
          id: "bang-ghim-gia",
          label: "Bảng ghim ‘phá lại’",
          rect: [620, 60, 280, 220],
          lines: [
            ["narr", "Bảng ghim chỉ đỏ, kiểu phim trinh thám. Sáu cột, mỗi cột một vụ của văn phòng thám tử, ghim ảnh chụp từng trang hồ sơ."],
            ["me", "‘Nồi Thịt Kho: thủ phạm thật là TUẤN’. ‘Chiến Kê: CÔ MƯỜI’. ‘Trà Sữa: HẰNG’. ‘Mất Wifi: ÔNG NĂM’. ‘Đám Cưới: NGƯỜI YÊU CŨ’. ‘Đám Hỏi: BÉ TI’."],
            ["me", "Vụ nào anh ta cũng chọn đúng người gây nhiễu, cái người mà thủ phạm thật muốn mọi người nghi. Ảnh ghim trên bảng có con dấu ‘Thám Tử Hẻm – Lưu’ và hình con gà Tèo vẽ."],
            ["teo", "Con gà em vẽ! Ảnh còn ghi chú dưới con gà: ‘manh mối quan trọng: biểu tượng tổ chức bí mật?’ Đó là con gà em vẽ lúc buồn ngủ!", "angry"],
            ["pro", "Đó gọi là [[pha-lai-vu|phá lại vụ cũ]], tìm sự thật bị che giấu! Một triệu hai người tin Pro!", "smug"],
          ],
          gives: { clues: ["bang-ghim-gia"] },
          again: [["me", "Sáu vụ, sáu lần chọn đúng người gây nhiễu. Đó là kỷ lục, theo một nghĩa nào đó."]],
        },
        {
          id: "dien-thoai-livestream",
          label: "Điện thoại livestream",
          rect: [440, 250, 90, 140],
          lines: [
            ["narr", "Điện thoại kẹp trên ring light, mở sẵn trang quản lý kênh. Buổi live đêm qua: ‘PRO PHÁ ÁN XUYÊN ĐÊM – 22h tới 1h’, ba nghìn người xem."],
            ["me", "Tua bản lưu. 23h05: Pro nói ‘Khoan, để Pro suy nghĩ…’, chống cằm, một con thiêu thân đậu lên vành ring light. 23h08: lại ‘Khoan, để Pro suy nghĩ…’, chống cằm, con thiêu thân đậu đúng chỗ cũ."],
            ["me", "Đúng 3 phút một lần, mười hai lần liên tục, tới 23h40. Một [[video-lap|đoạn video 3 phút phát lặp]]. 23h40, Pro thật quay lại: thở hổn hển, tóc bết mồ hôi, măng tô xộc xệch."],
            ["teo", "Con thiêu thân đậu mười hai lần đúng một chỗ… con thiêu thân này chắc cũng bị phát lặp.", "shock"],
          ],
          gives: { clues: ["live-lap"] },
          again: [["me", "23h05 tới 23h40: cùng một câu ‘để Pro suy nghĩ’, cùng con thiêu thân, mười hai lần."]],
        },
        {
          id: "tu-quan-ao",
          label: "Tủ quần áo",
          rect: [40, 80, 200, 360],
          lines: [
            ["narr", "Tủ quần áo mở cửa. Treo thẳng hàng ba cái măng tô màu be y chang nhau, ba cặp kính râm, ba cái mũ phớt. Đồng phục thám tử."],
            ["me", "Cái măng tô thứ ba: vạt sau rách mất một mảnh hình tam giác, chỗ rách bám lông mèo mướp."],
            ["me", "Thò tay vô túi áo: một [[chia-47b|chìa khoá 47B]] mới tinh, răng chìa còn ba-via sắc, đầu chìa khắc số 47B."],
            ["pro", "Ơ, ai cho lục đồ Pro? Măng tô thì rách là chuyện thường! Pro hay đi… đi hiện trường!", "nervous"],
            ["teo", "Anh mới nói anh không lết đi hiện trường mỏi chân mà?", "smug"],
          ],
          gives: { clues: ["mang-to-rach", "chia-47b-moi"] },
          again: [["me", "Măng tô rách vạt sau, lông mèo mướp. Trong túi: chìa 47B mới in."]],
        },
        {
          id: "ho-so-danh-cap",
          label: "Chồng hồ sơ",
          rect: [600, 330, 220, 130],
          lines: [
            ["narr", "Trên bàn dựng clip, chất ngay ngắn sáu bìa hồ sơ giấy nâu. Gáy bìa đóng dấu đỏ ‘THÁM TỬ HẺM – LƯU’."],
            ["me", "Bìa vụ Nồi Thịt Kho có vệt nước thịt kho mà Tèo làm đổ hồi đó. Bìa vụ Chiến Kê có vết mổ của con Chiến Thần. Hồ sơ của văn phòng, không lệch một trang."],
            ["pro", "Fan gửi Pro đó! Fan tin Pro hơn tin mấy người!", "smug"],
            ["teo", "Bìa vụ Đám Hỏi còn dính kem bánh! Em cất kỹ lắm mà…", "nervous"],
          ],
          gives: { clues: ["ho-so-goc"] },
          again: [["teo", "Sáu bìa hồ sơ của mình… nằm ở studio người ta. Em thấy như con đi lạc.", "nervous"]],
        },
        {
          id: "laptop-dung-clip",
          label: "Laptop dựng clip",
          rect: [820, 320, 120, 110],
          lines: [
            ["narr", "Laptop dựng clip mở sẵn thư mục ‘Vlog tuần này’. Tập tin mới nhất: ‘T2_17h06_di_in_chia_studio.mp4’."],
            ["me", "Bấm phát. Hiếu tự quay mình ngồi trên ghế nhựa đỏ ở sạp anh Bảo: ‘Hôm nay Pro đi in chìa cho studio mới nha anh em’. Máy cắt rè rè phía sau."],
            ["narr", "Rồi trong clip vang lên giọng Tèo, to rõ: ‘Anh Bảo ơi, chìa văn phòng thám tử đó, in giùm em một cái dự phòng. Em để chìa gốc đây, 8 giờ tối em lấy nha!’"],
            ["narr", "Hiếu trong clip quay đầu nhìn theo, rồi ghé sát ống kính, thì thầm: ‘…Văn phòng thám tử. Thú vị đây’. Hết clip."],
            ["me", "Anh ta không cần phá khoá. Anh ta chỉ cần [[nghe-len|nghe lén]] một câu nói to ở sạp khoá."],
            ["teo", "Em… em nói to vậy hả sếp…", "nervous"],
          ],
          gives: { clues: ["vlog-sap-khoa"] },
          again: [["teo", "Em nghe lại giọng mình trong clip, em muốn chui xuống đất.", "nervous"]],
        },
      ],
    },
  },

  clues: {
    "ho-so-mat": {
      name: "Tủ hồ sơ mất sáu bìa",
      desc: "Ngăn hai tủ sắt mất sáu bìa [[ho-so|hồ sơ vụ 1–6]]. Ổ khoá tủ không trầy, chìa tủ cắm sẵn trên ổ. Ngăn tiền lẻ không bị đụng.",
    },
    "cua-khong-pha": {
      name: "Cửa kính không bị phá",
      desc: "Không vết cạy. Trong lỗ khoá có mạt đồng mới, dấu của một [[chia-47b|chìa 47B]] mới in còn ba-via, tra vô lần đầu.",
    },
    "dau-son-kinh": {
      name: "Vết son trên mặt ngoài cửa kính",
      desc: "Mặt NGOÀI kính, ngang tầm mắt: vết [[son-moi|son đỏ]] đậm hình đôi môi, vệt trán và chóp mũi. Người áp mặt nhìn trộm từ ngoài vô.",
    },
    "giay-nho-teo": {
      name: "Giấy nhớ của Tèo",
      desc: "Dán mép màn hình, chữ Tèo: ‘Hồ sơ vụ 1–6: tủ sắt ngăn 2. Chìa tủ: trong ống bút con mèo. ĐỪNG QUÊN!!!’",
    },
    "lich-su-may-tinh": {
      name: "Nhật ký máy tính văn phòng",
      desc: "Phiên 1: 22h03–[[22h58]], tài khoản ‘[[cucxinhdep|CucXinhDep1958]]’ xem phim Hàn tập 13–14. Phiên 2: 23h21–23h33, cắm [[usb|USB]] ‘[[ttp-backup|TTP_BACKUP]]’, chép thư mục ‘Ảnh hiện trường vụ 1–6’.",
    },
    "soi-chi-be": {
      name: "Sợi chỉ be trong móng mèo",
      desc: "Mèo văn phòng Kính Lúp có mấy sợi chỉ màu be, vải dày dệt chéo, kẹt trong móng chân trước. Nó đã cào kẻ đột nhập.",
    },
    "manh-vai-be": {
      name: "Mảnh vạt măng tô dưới gầm tủ",
      desc: "Mảnh vải be dệt chéo hình tam giác, một cạnh có đường may viền, dính lông mèo mướp. Vạt [[mang-to|măng tô]] bị móng mèo xé.",
    },
    "bo-dem-may": {
      name: "Bộ đếm máy cắt chìa",
      desc: "Phôi 47B, thứ Hai: 2 lần cắt, lúc 17h10 và [[19h50]]. Ổ cửa kính văn phòng thám tử là loại 47B.",
    },
    "the-treo-chia": {
      name: "Thẻ treo chìa ở sạp khoá",
      desc: "Chữ anh Bảo: ‘[[teo|TÈO]] – VP THÁM TỬ – chìa gốc, in 1 – 8h tối lấy’. Treo mép sạp, ai ngồi ghế chờ cũng đọc được.",
    },
    "so-in-khoa": {
      name: "Sổ in khoá thứ Hai",
      desc: "‘17h05 – Tèo, VP thám tử – in 1 chìa 47B – để chìa gốc, 20h lấy’. Dòng bị tẩy, soi nghiêng còn hằn: ‘[[19h50]] – người bên VP thám tử – in thêm 1 [[chia-47b|chìa 47B]] theo mẫu – măng tô, kính râm – bo 200k’.",
    },
    "danh-thiep-pro": {
      name: "Danh thiếp kẹt ghế chờ",
      desc: "Danh thiếp nhũ vàng ‘HIẾU – [[thamtupro|THÁM TỬ PRO]] – Phá án 60 giây’, kẹt khe ghế nhựa chờ ở sạp khoá, dính trà sữa khô. Anh Bảo: khách thứ Hai ngồi đó gần tiếng đồng hồ.",
    },
    "bang-ghim-gia": {
      name: "Bảng ghim ‘phá lại’ sáu vụ",
      desc: "Sáu vụ của văn phòng bị [[pha-lai-vu|‘phá lại’]]: Tuấn, cô Mười, Hằng, ông Năm, người yêu cũ, Bé Ti. Toàn người gây nhiễu. Ảnh ghim có dấu ‘Thám Tử Hẻm – Lưu’ và con gà Tèo vẽ.",
    },
    "live-lap": {
      name: "Bản lưu buổi live đêm qua",
      desc: "Live ‘22h tới 1h’ của Pro: từ 23h05 tới 23h40 là [[video-lap|một đoạn 3 phút phát lặp]] mười hai lần, cùng câu ‘để Pro suy nghĩ’, cùng con thiêu thân. 23h40 Pro thật quay lại, thở dốc, măng tô xộc xệch.",
    },
    "mang-to-rach": {
      name: "Măng tô rách trong tủ đồ Pro",
      desc: "Một trong ba cái [[mang-to|măng tô]] màu be của Pro rách mất mảnh tam giác ở vạt sau, chỗ rách bám lông mèo mướp.",
    },
    "chia-47b-moi": {
      name: "Chìa 47B trong túi măng tô",
      desc: "[[chia-47b|Chìa 47B]] mới tinh, răng còn ba-via sắc, nằm trong túi cái măng tô bị rách.",
    },
    "ho-so-goc": {
      name: "Sáu bìa hồ sơ ở studio",
      desc: "Sáu bìa [[ho-so|hồ sơ]] gáy đóng dấu ‘THÁM TỬ HẺM – LƯU’, vệt thịt kho, vết gà mổ, kem bánh đám hỏi. Hồ sơ gốc của văn phòng, nằm trên bàn dựng clip của Pro.",
    },
    "vlog-sap-khoa": {
      name: "Vlog thứ Hai của Pro",
      desc: "‘T2_17h06_di_in_chia_studio’: Pro ngồi ghế chờ sạp anh Bảo. Tiếng Tèo: ‘chìa văn phòng thám tử… em để chìa gốc đây, 8 giờ tối em lấy’. Pro thì thầm: ‘Văn phòng thám tử. Thú vị đây’. Pro [[nghe-len|nghe lén]] được.",
    },
    "anh-ly-23h17": {
      name: "Ảnh chị Ly chụp lúc 23h17",
      desc: "Chụp từ xe đậu bên kia đường lúc [[23h17]]: một người mặc [[mang-to|măng tô]], đeo kính râm giữa đêm, tra chìa mở cửa kính văn phòng. Điện thoại kẹp ring light mini trên tay.",
    },
    "bai-boi-nho": {
      name: "Ảnh hồ sơ trên nick ‘Sự Thật Hẻm 47’",
      desc: "Nick lập lúc 00h47, đăng ảnh trang hồ sơ từ [[00h52]] đêm qua. Bìa nhựa trong ảnh nào cũng in một vòng sáng tròn trắng phản chiếu, kiểu đèn ring light.",
    },
    "binh-luan-teo": {
      name: "Bình luận của Tèo đêm qua",
      desc: "Từ 23h12 tới 23h38, Tèo ở nhà bình luận vô live của Pro: ‘anh Pro ơi sao đứng im vậy’, ‘câu này anh nói lần thứ 5 rồi’, ‘lag hả anh’, ‘con thiêu thân lại đậu kìa’. Định vị: nhà Tèo.",
    },
  },

  words: {
    // ai
    pro: { text: "Hiếu ‘Thám Tử Pro’", kind: "ai" },
    ly: { text: "chị Ly", kind: "ai" },
    bao: { text: "anh Bảo", kind: "ai" },
    bacuc: { text: "bà Cúc", kind: "ai" },
    teo: { text: "Tèo", kind: "ai" },
    // lúc
    "22h58": { text: "22h58", kind: "luc" },
    "23h17": { text: "23h17", kind: "luc" },
    "19h50": { text: "19h50 thứ Hai", kind: "luc" },
    "00h52": { text: "00h52", kind: "luc" },
    "6h-sang": { text: "6h sáng thứ Sáu", kind: "luc" },
    // vật
    "chia-47b": { text: "chìa 47B in lén", kind: "vat" },
    usb: { text: "USB", kind: "vat" },
    "mang-to": { text: "măng tô màu be", kind: "vat" },
    "son-moi": { text: "son đỏ", kind: "vat" },
    "ho-so": { text: "hồ sơ vụ 1–6", kind: "vat" },
    "chia-tong": { text: "chìa tổng", kind: "vat" },
    // cách
    "video-lap": { text: "đoạn video phát lặp", kind: "cach" },
    "nghe-len": { text: "nghe lén ở sạp khoá", kind: "cach" },
    "pha-khoa": { text: "phá khoá", kind: "cach" },
    "trong-xe": { text: "rình trong xe", kind: "cach" },
    // vì
    "pha-lai-vu": { text: "‘phá lại’ vụ cũ câu view", kind: "vi" },
    "xem-phim": { text: "lén xem phim ké máy lạnh", kind: "vi" },
    "tang-gia": { text: "ép tăng giá thuê", kind: "vi" },
    "tin-doc-quyen": { text: "giật tin độc quyền", kind: "vi" },
    "so-bi-la": { text: "sợ bị sếp la", kind: "vi" },
    "giu-tieng": { text: "giữ tiếng nghề", kind: "vi" },
    // khác
    "ttp-backup": { text: "TTP_BACKUP", kind: "khac" },
    cucxinhdep: { text: "CucXinhDep1958", kind: "khac" },
    thamtupro: { text: "@thamtupro", kind: "khac" },
    "hong-24h": { text: "Hóng 24h", kind: "khac" },
  },

  talks: {
    pro: [
      {
        id: "gioi-thieu",
        topic: "Anh là ai mà ‘phá lại’ vụ của văn phòng?",
        lines: [
          ["pro", "Hiếu. Thám Tử Pro. Một triệu hai người theo dõi. Pro phá án 60 giây, không cần lết đi hiện trường, không cần thẩm vấn. Chỉ cần nhìn hồ sơ là thấy sự thật.", "smug"],
          ["pro", "Còn mấy người mất cả tuần cho một nồi thịt kho. Thời đại số rồi anh ơi! Ai cũng muốn kết luận nhanh!", "smug"],
          ["teo", "Anh phá hơn trăm vụ rồi hả anh? Đúng được mấy vụ?", "neutral"],
          ["pro", "Đúng hay sai không quan trọng bằng view! À không, ý Pro là… sự thật nằm trong lòng người xem!", "nervous"],
        ],
        gives: { words: ["pro"] },
      },
      {
        id: "dem-qua",
        topic: "Đêm qua anh ở đâu?",
        lines: [
          ["pro", "Live! Live xuyên đêm từ 22h tới 1h sáng ở studio. Ba nghìn người coi. Ba nghìn nhân chứng! Thám tử có alibi nào mạnh hơn không?", "smug"],
          ["pro", "Pro chưa rời ghế một giây. Coi lại bản lưu thì biết.", "smug"],
        ],
        gives: { stmts: ["pro-live-lien-tuc"] },
      },
      {
        id: "thach-dau",
        topic: "Hồ sơ của văn phòng sao lại ở chỗ anh?",
        lines: [
          ["pro", "Ồ, thám tử muốn coi hả? Ghé studio của Pro đi! Coi người chuyên nghiệp làm việc. Pro còn cho thám tử lên live chung, ké chút view.", "smug"],
          ["pro", "Hồ sơ đó là fan gửi ẩn danh vô hộp thư studio, sáng nay Pro mới nhận. Pro không biết ai gửi. Fan Pro đông lắm.", "smug"],
          ["teo", "Sếp, ảnh thách mình kìa. Mình đi không sếp?", "angry"],
          ["me", "Đi. Người ta mời thì mình tới. Để coi ‘chuyên nghiệp’ trông ra sao."],
        ],
        gives: { stmts: ["pro-fan-gui"] },
      },
      {
        id: "sap-khoa",
        topic: "Anh có từng tới sạp khoá anh Bảo không?",
        lines: [
          ["pro", "Sạp khoá? Ông Bảo là ai? Pro không biết. Pro không tới mấy cái sạp lề đường. Studio Pro xài khoá vân tay.", "smug"],
          ["teo", "Khoá vân tay mà cửa studio anh có ổ chìa kìa anh.", "neutral"],
          ["pro", "Đó là… dự phòng! Hỏi nhiều quá!", "angry"],
        ],
        gives: { stmts: ["pro-chua-toi-sap"] },
      },
      {
        id: "nguoi-gay-nhieu",
        topic: "Sao vụ nào anh cũng chọn người gây nhiễu làm thủ phạm?",
        needs: "clue:bang-ghim-gia",
        lines: [
          ["pro", "Gây nhiễu gì? Pro chọn người đáng nghi nhất! Áo dính nước màu thì nghi! Bán cơm gà thì nghi! Ăn kiêng thì nghi! Logic đơn giản!", "angry"],
          ["me", "Thủ phạm thật thì luôn muốn anh nghi đúng những người đó. Anh nhìn thấy cái người ta bày ra cho anh thấy, rồi ngừng nhìn."],
          ["pro", "…Nhưng… sáu mươi giây thì làm sao nhìn kỹ được…", "nervous"],
        ],
      },
      {
        id: "thue-van-phong",
        topic: "Bà Cúc nói anh hỏi thuê văn phòng?",
        needs: "talk:bacuc.nguoi-thue",
        lines: [
          ["pro", "Thì sao? Văn phòng góc hẻm, mặt tiền, ánh sáng đẹp. Studio Pro mà mở ở đó thì cả hẻm tới coi.", "smug"],
          ["pro", "Mấy người làm thám tử mà toàn đi bộ, tiền thuê còn trả trễ. Nhường chỗ cho người làm nội dung đi chứ!", "smug"],
          ["teo", "Văn phòng mình trả tiền thuê đúng ngày hết! …Trừ tháng Tư. Với tháng Bảy.", "nervous"],
        ],
      },
    ],

    ly: [
      {
        id: "bai-bao",
        topic: "Sao chị viết bài ‘6 vụ, 6 lần bắt nhầm’?",
        lines: [
          ["ly", "Tít có dấu chấm hỏi mà anh. ‘6 vụ, 6 lần bắt nhầm?’. Dấu hỏi là câu hỏi, đâu phải khẳng định. Báo [[hong-24h|Hóng 24h]] làm báo có đạo đức.", "smug"],
          ["ly", "Tổng biên tập bắt tít phải có chữ ‘bắt nhầm’, ‘sốc’, hoặc ‘toang’. Không có thì không lên trang nhất. Mà báo nào cũng đang muốn [[tin-doc-quyen|giật tin độc quyền]] về văn phòng anh.", "nervous"],
          ["teo", "Chị ơi, chị có thấy hơi ác không chị?", "neutral"],
          ["ly", "…Có. Tối qua tui viết xong tui khóc. Mà sáng ra nó được hai trăm nghìn lượt đọc.", "nervous"],
        ],
        gives: { words: ["ly"] },
      },
      {
        id: "dem-qua",
        topic: "Đêm qua chị ở đâu?",
        lines: [
          ["ly", "Ở toà soạn tới sáng. Chạy bài. Tui không có tới hẻm 47, tui không quen ai ở đây, tui không có lý do gì để ở đây.", "nervous"],
          ["ly", "Nói ba lần cho chắc: tui không có ở đây.", "nervous"],
        ],
        gives: { stmts: ["ly-o-toa-soan"] },
      },
      {
        id: "boi-nho",
        topic: "Chị thấy mấy bài của nick ‘Sự Thật Hẻm 47’ sao?",
        lines: [
          ["ly", "Tui là phóng viên, tui coi kỹ rồi. Nick lập lúc 00h47 đêm qua, bài đầu tiên đăng 00h52, kèm ảnh chụp từng trang hồ sơ của văn phòng.", "neutral"],
          ["ly", "Mà anh để ý không: ảnh nào cũng chụp bìa hồ sơ có bọc nhựa, và trên lớp nhựa có một vòng sáng tròn trắng phản chiếu. Đèn bàn thường không in vòng tròn kiểu đó.", "neutral"],
          ["teo", "Vòng tròn trắng… em thấy ở đâu rồi ta…", "neutral"],
        ],
        gives: { clues: ["bai-boi-nho"] },
      },
      {
        id: "phong-van",
        topic: "Chị thật sự muốn gì ở văn phòng?",
        needs: "broke:ly-o-toa-soan",
        lines: [
          ["ly", "Tui… tui muốn phỏng vấn anh. Từ vụ Nồi Thịt Kho. Tui có một cuốn sổ dán hết bài viết về sáu vụ của anh, có cả ảnh Tèo cầm tỏi.", "nervous"],
          ["ly", "Tui rình ba đêm liền, ngồi trong xe đậu bên kia đường, mà không dám gõ cửa. Đêm qua tui áp mặt vô kính coi anh có trong đó không. Rồi tui thấy cái người đó…", "nervous"],
          ["teo", "Chị là fan! Mình có fan thiệt sếp ơi! Mà fan viết bài chửi mình…", "shock"],
          ["ly", "Tui viết bài chửi vì tổng biên tập bắt. Tui đặt dấu chấm hỏi là vì tui không tin. Dấu chấm hỏi đó là tất cả những gì tui dám làm.", "nervous"],
        ],
      },
    ],

    bao: [
      {
        id: "nghe",
        topic: "Anh làm nghề khoá lâu chưa?",
        lines: [
          ["bao", "Hai mươi năm. Ổ khoá nào tui cũng đặt tên. Ổ cửa kính văn phòng thám tử là con 47B, tui gọi nó là ‘Cô Kính’. Cô Kính hiền, xoay êm.", "happy"],
          ["bao", "Nghề tui có luật: in chìa nhà ai thì phải là người nhà đó tới. Tui chưa phá luật đó bao giờ.", "smug"],
          ["teo", "Anh Bảo ơi, anh có đặt tên cho ổ khoá nhà em không?", "neutral"],
          ["bao", "Có. ‘Ổ Hay Bị Mất Chìa’.", "neutral"],
        ],
        gives: { words: ["bao"] },
      },
      {
        id: "in-chia",
        topic: "Thứ Hai anh in chìa 47B cho ai?",
        lines: [
          ["bao", "Có thằng nhỏ áo vàng tới nhờ in một cái dự phòng. Tui in đúng một cái. Không in thêm cho ai hết.", "nervous"],
          ["bao", "Một chìa, một khách, một dòng sổ. Đó là luật.", "nervous"],
        ],
        gives: { stmts: ["bao-mot-chia"] },
      },
      {
        id: "khach-thu-hai",
        topic: "Thứ Hai có khách nào lạ ngồi ở sạp không?",
        lines: [
          ["bao", "Có một cậu áo măng tô, kính râm, ngồi ghế chờ gần tiếng đồng hồ. Cầm điện thoại nói chuyện một mình, ‘anh em ơi’ này ‘anh em ơi’ nọ.", "neutral"],
          ["bao", "Cậu đó nói đi in chìa studio, mà ngồi hoài không đưa chìa nào. Tới khi thằng nhỏ áo vàng để chìa lại rồi đi, cậu đó cũng đứng dậy đi luôn.", "neutral"],
        ],
      },
      {
        id: "dong-tay",
        topic: "Dòng bị tẩy trong sổ là sao?",
        needs: "broke:bao-mot-chia",
        lines: [
          ["bao", "Sáng nay nghe văn phòng bị trộm, tui tẩy liền. Tui sợ. Hai mươi năm làm nghề, lần đầu tui in chìa cho người không phải chủ.", "nervous"],
          ["bao", "Mà người đó mặc măng tô, kính râm, đứng ngay chỗ thằng nhỏ vừa đứng, nói ‘bên văn phòng thám tử, sếp dặn in thêm một cái’. Tui tưởng là ông thám tử luôn đó!", "nervous"],
          ["me", "Áo tui là áo kaki nâu, anh Bảo."],
          ["bao", "Trời tối, măng tô với kaki tui nhìn y chang… Tui nhìn chìa giỏi, nhìn áo dở.", "nervous"],
        ],
      },
    ],

    bacuc: [
      {
        id: "tang-gia",
        topic: "Sao bà đòi tăng giá thuê?",
        lines: [
          ["bacuc", "Giá điện tăng! Tháng rồi đồng hồ điện văn phòng nhảy gấp đôi! Mấy người xài cái gì mà tốn điện dữ vậy? Mở máy lạnh suốt đêm hả?", "angry"],
          ["teo", "Dạ đâu có bà, tụi con về là tắt hết. Tụi con nghèo mà.", "nervous"],
          ["bacuc", "Vậy chắc tại ma! Ờ, ma!", "nervous"],
        ],
        gives: { words: ["bacuc"] },
      },
      {
        id: "vo-van-phong",
        topic: "Bà có vô văn phòng gần đây không?",
        lines: [
          ["bacuc", "Không! Cả tháng nay tui không bước vô cái văn phòng đó lần nào. Tối tui ở nhà, mười giờ là tui ngủ. Người già phải ngủ sớm.", "angry"],
          ["bacuc", "[[chia-tong|Chìa tổng]] tui cất trong két, có ai đụng đâu.", "nervous"],
        ],
        gives: { stmts: ["cuc-khong-vo"] },
      },
      {
        id: "nguoi-thue",
        topic: "Có ai hỏi thuê lại văn phòng không?",
        lines: [
          ["bacuc", "Có! Cậu Hiếu Thám Tử Pro đó. Tháng rồi tới hỏi: ‘Nếu văn phòng thám tử dọn đi, con thuê giá gấp đôi’. Gấp đôi đó!", "smug"],
          ["bacuc", "Tui nói để coi. Tui tính nói cho mấy người biết, rồi thấy… thôi [[tang-gia|tăng giá thuê]] ba mươi phần trăm coi mấy người phản ứng sao.", "nervous"],
          ["teo", "Bà ơi, bà đem tụi con ra đấu giá hả bà?", "shock"],
        ],
      },
      {
        id: "phim-han",
        topic: "Bà có coi phim ‘Hẻm Nhỏ Tình To’ không?",
        needs: "broke:cuc-khong-vo",
        lines: [
          ["bacuc", "Coi! Coi tới tập 14 rồi! Tập 14 thằng nam chính nó… thôi không spoil.", "happy"],
          ["bacuc", "Lúc tui ra về 22h58, tui khoá cửa đàng hoàng. Đèn hẻm còn sáng. Tui có thấy một cái xe hơi đậu bên kia đường, có bà nào ngồi trong xe, son đỏ chót. Tui tưởng người ta hẹn hò.", "neutral"],
          ["bacuc", "Lúc đó cửa văn phòng còn nguyên, tủ hồ sơ còn đóng. Tui thề trên tập 15.", "neutral"],
        ],
      },
    ],

    teo: [
      {
        id: "chia-khoa",
        topic: "Chìa khoá văn phòng của cậu đâu?",
        lines: [
          ["teo", "Dạ đây sếp. Trong túi em. Lúc nào cũng trong túi em. Em chưa bao giờ đưa chìa văn phòng cho ai hết.", "nervous"],
          ["teo", "Em thề trên… trên cái điện thoại của em. Cái quý nhất của em.", "nervous"],
        ],
        gives: { stmts: ["teo-khong-dua-chia"], words: ["teo"] },
      },
      {
        id: "dem-qua",
        topic: "Đêm qua cậu làm gì?",
        lines: [
          ["teo", "Em ở nhà ăn mì, nằm coi điện thoại. Tới hơn 11 giờ em coi live… ờ… live của một người.", "nervous"],
          ["me", "Live của ai, Tèo?"],
          ["teo", "…Của Thám Tử Pro. Em coi để biết địch biết ta thôi sếp! Em không có theo dõi ảnh! Em chỉ… bấm theo dõi để coi cho tiện!", "nervous"],
          ["teo", "Mà đêm qua live ảnh kỳ lắm. Em còn vô bình luận chọc ảnh. Đây sếp coi nè.", "neutral"],
        ],
        gives: { clues: ["binh-luan-teo"] },
      },
      {
        id: "bai-boi-nho",
        topic: "Cậu thấy mấy bài bôi nhọ văn phòng thế nào?",
        lines: [
          ["teo", "Em đọc hết rồi sếp. Người ta nói sếp bắt nhầm. Người ta nói em ‘trợ lý vô dụng’. Câu đó em không cãi được.", "nervous"],
          ["teo", "Mà câu nói sếp bắt nhầm thì sai. Em ở đó cả sáu vụ. Sếp chưa bắt nhầm ai. Chỉ có em đoán nhầm thôi.", "angry"],
        ],
      },
      {
        id: "nhan-loi",
        topic: "Tèo, nói thật đi: chìa gốc ở sạp anh Bảo là sao?",
        needs: "broke:teo-khong-dua-chia",
        lines: [
          ["teo", "Sếp… năm nay em làm mất chìa hai lần. Lần nào sếp cũng phải gọi anh Bảo tới mở cửa. Lần thứ hai sếp nói ‘Tèo, lần thứ ba là tui đổi ổ khoá’.", "nervous"],
          ["teo", "Em sợ. Em sợ lần thứ ba sếp không nói đổi ổ khoá nữa, mà nói đổi trợ lý. Nên em lén đi in một cái dự phòng. Em để chìa gốc ở sạp, rồi đứng đó nói to như cái loa.", "nervous"],
          ["teo", "Em làm mất hồ sơ sáu vụ. Sáu vụ mình làm chung. Em xin lỗi sếp.", "nervous"],
          ["me", "Chưa ai nói mất là do cậu, Tèo. Mình còn phải tìm ra người đã nghe được câu đó."],
        ],
      },
    ],
  },

  stmts: {
    "pro-live-lien-tuc": {
      by: "pro",
      text: "Đêm qua tui live liên tục từ 22h tới 1h sáng ở studio, ba nghìn người làm chứng, không rời ghế một giây.",
      break: {
        clue: "live-lap",
        also: ["binh-luan-teo"],
        lines: [
          ["me", "Bản lưu buổi live: 23h05 tới 23h40, cùng câu ‘Khoan, để Pro suy nghĩ’, cùng cái chống cằm, cùng con thiêu thân đậu cùng một chỗ, mười hai lần. Ba nghìn người coi một đoạn video lặp."],
          ["pro", "Đó là… hiệu ứng nghệ thuật! Lặp để nhấn mạnh! Kiểu phim cắt cảnh!", "shock"],
          ["me", "23h40 anh quay lại, thở dốc, tóc bết, măng tô xộc xệch. Ba mươi lăm phút đó anh đi đâu?"],
          ["pro", "Pro… Pro đi vệ sinh! Ba mươi lăm phút! Hôm qua Pro ăn ốc!", "nervous"],
          ["teo", "Anh đi vệ sinh mặc măng tô hả anh?", "smug"],
        ],
      },
    },
    "pro-fan-gui": {
      by: "pro",
      text: "Hồ sơ là fan gửi ẩn danh vô hộp thư studio, sáng nay tui mới nhận.",
      break: {
        clue: "bai-boi-nho",
        lines: [
          ["me", "Nick ‘Sự Thật Hẻm 47’ đăng ảnh trang hồ sơ từ 00h52 đêm qua. Bìa nhựa trong ảnh nào cũng in một vòng sáng tròn trắng: đèn ring light. Hồ sơ đã nằm dưới ring light từ nửa đêm, trước cái ‘sáng nay’ của anh."],
          ["pro", "Ring light thì… ai mà chẳng có! Cả triệu TikToker có!", "nervous"],
          ["teo", "Mà cả triệu TikToker đó đâu có ai cầm hồ sơ của văn phòng em lúc 00h52.", "smug"],
          ["pro", "…Ờ thì… fan gửi lúc nửa đêm! Fan Pro thức khuya!", "nervous"],
        ],
      },
    },
    "pro-chua-toi-sap": {
      by: "pro",
      text: "Tui chưa từng tới sạp khoá ông Bảo, không biết ổng là ai.",
      break: {
        clue: "vlog-sap-khoa",
        also: ["danh-thiep-pro"],
        lines: [
          ["me", "Vlog của chính anh, thứ Hai 17h06: ‘Hôm nay Pro đi in chìa cho studio mới nha anh em’. Anh ngồi đúng cái ghế nhựa đỏ ở sạp anh Bảo. Danh thiếp nhũ vàng của anh còn kẹt trong khe ghế."],
          ["pro", "Ờ… ờ, tui có ghé! Ghé in chìa studio! Rồi đổi ý không in! Ghé thôi mà, đâu có tội!", "shock"],
          ["me", "Trong clip có tiếng Tèo nói: ‘chìa văn phòng thám tử… em để chìa gốc đây, 8 giờ tối em lấy’. Và anh thì thầm: ‘Văn phòng thám tử. Thú vị đây’."],
          ["pro", "…Pro thì thầm vậy là… là thói quen! Pro thấy cái gì cũng thú vị!", "nervous"],
        ],
      },
    },
    "teo-khong-dua-chia": {
      by: "teo",
      text: "Chìa văn phòng lúc nào cũng nằm trong túi em, em chưa bao giờ đưa cho ai.",
      break: {
        clue: "the-treo-chia",
        also: ["so-in-khoa"],
        lines: [
          ["me", "Thẻ treo ở sạp anh Bảo, chữ anh Bảo: ‘TÈO – VP THÁM TỬ – chìa gốc, in 1 – 8h tối lấy’. Tèo, chiều thứ Hai chìa gốc của văn phòng nằm trên bảng chìa phôi ba tiếng đồng hồ."],
          ["teo", "…Dạ. Em có đưa. Em để chìa gốc ở sạp anh Bảo, nhờ in một cái dự phòng.", "nervous"],
          ["teo", "Em không dám nói với sếp, vì [[so-bi-la|em sợ bị sếp la]]. Em mất chìa hai lần rồi. Em sợ lần này sếp cho em nghỉ.", "nervous"],
          ["teo", "Sếp ơi… vậy là tại em hả sếp? Tại em mà văn phòng bị trộm hả sếp?", "shock"],
          ["me", "Cậu vừa nói thật một chuyện khó nói, Tèo. Giữ cái đó. Mình còn chưa xong."],
        ],
      },
    },
    "bao-mot-chia": {
      by: "bao",
      text: "Thứ Hai tui in đúng một chìa 47B cho Tèo, không in thêm cho ai hết.",
      break: {
        clue: "bo-dem-may",
        lines: [
          ["me", "Bộ đếm máy cắt chìa của anh: phôi 47B, thứ Hai, hai lần cắt. 17h10 và 19h50. Tèo lấy một cái. Cái thứ hai đi đâu?"],
          ["bao", "…Cái máy này hai mươi năm chưa đếm sai một lần.", "nervous"],
          ["bao", "Thôi được. Tui in hai cái. Cái thứ hai cho một người tự xưng bên văn phòng thám tử. Tui tẩy sổ sáng nay vì [[giu-tieng|sợ mất tiếng nghề]]. Hai mươi năm, tui chỉ có cái tiếng đó.", "nervous"],
          ["teo", "Anh Bảo… em cũng giấu sếp. Mình giống nhau ghê.", "nervous"],
        ],
      },
    },
    "cuc-khong-vo": {
      by: "bacuc",
      text: "Cả tháng nay tui không bước vô văn phòng lần nào, tối mười giờ là tui ngủ.",
      break: {
        clue: "lich-su-may-tinh",
        lines: [
          ["me", "Máy tính văn phòng, đêm qua 22h03 tới 22h58: tài khoản ‘CucXinhDep1958’ xem phim Hàn ‘Hẻm Nhỏ Tình To’, tập 13 với tập 14."],
          ["bacuc", "…Máy lạnh nhà tui hư! Hư từ tháng trước! Thợ hẹn hoài không tới!", "shock"],
          ["bacuc", "Văn phòng có máy lạnh với cái màn hình to. Tối nào tui cũng lấy chìa tổng vô [[xem-phim|coi phim ké]]. Mười giờ mấy người về hết, tui vô coi hai tập rồi về. Tui có tắt máy lạnh! Có khi quên!", "nervous"],
          ["teo", "Vậy tiền điện tăng gấp đôi là tại… phim Hàn hả bà?", "smug"],
          ["bacuc", "Thôi khỏi tăng giá thuê. Coi như huề.", "nervous"],
        ],
      },
    },
    "ly-o-toa-soan": {
      by: "ly",
      text: "Đêm qua tui ở toà soạn tới sáng, không có tới hẻm 47.",
      break: {
        clue: "dau-son-kinh",
        lines: [
          ["me", "Mặt ngoài cửa kính văn phòng có vết son đỏ đậm hình đôi môi, vệt trán, chóp mũi. Đúng màu son chị đang đánh. Đúng tầm cao của chị."],
          ["ly", "…Son lì mười hai tiếng. Quảng cáo không nói dối.", "nervous"],
          ["ly", "Tui có ở đây. Tui ngồi trong xe bên kia đường [[trong-xe|rình]] ba đêm rồi. Tui muốn phỏng vấn độc quyền. Đêm qua tui chụp được cái này.", "nervous"],
          ["narr", "Chị Ly đưa điện thoại. Ảnh chụp lúc 23h17."],
        ],
        gives: { clues: ["anh-ly-23h17"] },
      },
    },
  },

  present: {
    pro: {
      "ho-so-goc": [["pro", "Hồ sơ fan gửi mà! Fan đóng dấu ‘Thám Tử Hẻm – Lưu’ cho đẹp! Fan Pro khéo tay!", "nervous"]],
      "bang-ghim-gia": [["pro", "Bảng ghim là phương pháp! Phim nào thám tử giỏi cũng có bảng ghim chỉ đỏ!", "smug"]],
      "giay-nho-teo": [["pro", "Ai mà dán chỗ để chìa tủ lên màn hình? Trợ lý này nên bị đuổi việc! Ơ… Pro chưa đọc tờ đó bao giờ nha.", "nervous"]],
      "manh-vai-be": [["pro", "Vải be thì thiếu gì! Rèm cửa cũng màu be! Ghế sofa cũng màu be!", "nervous"]],
      "soi-chi-be": [["pro", "Mèo cào ai thì cào! Pro dị ứng mèo, Pro không tới gần mèo… hắt xì!", "nervous"]],
      "anh-ly-23h17": [["pro", "Ảnh mờ quá, ai mà biết là ai! Đeo kính râm ban đêm thì… thì nhiều người lắm!", "nervous"]],
    },
    ly: {
      "bai-boi-nho": [["ly", "Tui đã định viết bài về cái vòng sáng đó. Tổng biên tập nói ‘không ai đọc bài về ánh đèn đâu’.", "nervous"]],
      "live-lap": [["ly", "Ba nghìn người coi một đoạn lặp ba mươi lăm phút mà không ai thấy. Đây mới là tin sốc nè!", "shock"]],
      "ho-so-goc": [["ly", "Hồ sơ gốc… Tui ước gì tui được đọc bằng cách đàng hoàng. Phỏng vấn đàng hoàng.", "nervous"]],
    },
    bao: {
      "chia-47b-moi": [["bao", "Đây! Đây là chìa tui in tối thứ Hai! Ba-via đó là tại tui làm vội, cậu kia hối quá. Tui nhận ra nét dũa của tui!", "shock"]],
      "danh-thiep-pro": [["bao", "Cậu ngồi ghế chờ thứ Hai đó! Hôm đó cậu phát cho tui một tấm, tui để trên kệ, chắc rớt vô khe ghế.", "neutral"]],
      "cua-khong-pha": [["bao", "Mạt đồng mới trong ổ Cô Kính… Chìa mới in tra lần đầu. Trời ơi, chìa tui in.", "nervous"]],
    },
    bacuc: {
      "dau-son-kinh": [["bacuc", "Son đỏ chót! Bà ngồi trong xe hôm qua đánh son màu này! Tui nhớ!", "shock"]],
      "mang-to-rach": [["bacuc", "Măng tô của cậu Hiếu! Tháng rồi cậu tới hỏi thuê văn phòng cũng mặc cái này. Giữa trưa nắng!", "smug"]],
      "lich-su-may-tinh": [["bacuc", "Tập 13 hay lắm nha. Mấy người coi chưa? …Ờ, không phải lúc.", "nervous"]],
    },
    teo: {
      "live-lap": [["teo", "Em biết mà! Em bình luận ‘lag hả anh’ năm lần! Không ai trả lời em! Tại người ta không có ở đó!", "shock"]],
      "ho-so-goc": [["teo", "Bìa vụ Nồi Thịt Kho có vệt nước thịt kho em làm đổ. Em nhận ra từ xa. Hồ sơ của mình…", "nervous"]],
      "vlog-sap-khoa": [["teo", "Giọng em… to như loa phường… Sếp ơi, em xin lỗi.", "nervous"]],
    },
  },

  wrong: {
    pro: [
      [["pro", "Sai rồi! Sáu mươi giây là Pro biết sai! Anh em ơi, thám tử hẻm lại sai nữa nè!", "smug"]],
      [["pro", "Cái này chứng minh được gì? Pro có một triệu hai người theo dõi, anh có gì?", "angry"]],
      [["pro", "Logic yếu quá! Pro cho thám tử 2 điểm trên 10. Bấm theo dõi để học thêm!", "smug"]],
    ],
    ly: [
      [["ly", "Cái này lên tít được không? ‘Thám tử đưa nhầm bằng chứng?’ Có dấu chấm hỏi nha.", "smug"]],
      [["ly", "Tui ghi chú rồi: bằng chứng không liên quan. Tui là phóng viên, tui ghi hết.", "neutral"]],
      [["ly", "Anh ơi… anh không phải như vầy đâu. Trong sổ dán của tui, anh không bao giờ đưa nhầm.", "nervous"]],
    ],
    bao: [
      [["bao", "Cái này không khớp. Giống chìa 47B tra vô ổ 52A. Xoay không được.", "neutral"]],
      [["bao", "Thám tử ơi, cái này lệch răng rồi. Dũa lại đi.", "smug"]],
      [["bao", "Hai mươi năm nghề, tui biết cái gì vừa ổ cái gì không. Cái này không vừa.", "angry"]],
    ],
    bacuc: [
      [["bacuc", "Cái gì đây? Tui không coi, tui đang coi phim… à không, tui không coi gì hết.", "nervous"]],
      [["bacuc", "Đưa trật rồi. Đưa trật vầy là tui tăng giá thuê thiệt đó!", "angry"]],
      [["bacuc", "Thám tử mà đưa đồ trật, giống phim Hàn mà nam chính quên thoại.", "smug"]],
    ],
    teo: [
      [["teo", "Sếp… sếp đưa em cái này làm chi? Em đang buồn mà sếp đưa trật nữa…", "nervous"]],
      [["teo", "Cái này không phải sếp ơi. Em biết em hay đoán sai, mà cái này sai thiệt.", "neutral"]],
      [["teo", "Sếp đưa trật! Lần đầu tiên em được nói câu này! …Em không vui như em tưởng.", "nervous"]],
    ],
  },

  deduction: [
    {
      id: "doi-dau",
      text: "{a} nói dối là live liên tục: từ 23h05 tới 23h40 chỉ là {b}, trong lúc hắn mở cửa văn phòng bằng {c}.",
      blanks: {
        a: { answer: "pro", kind: "ai" },
        b: { answer: "video-lap", kind: "cach" },
        c: { answer: "chia-47b", kind: "vat" },
      },
      explain: [
        ["me", "Ba mươi lăm phút live là một đoạn 3 phút phát lặp mười hai lần, Tèo còn bình luận ‘lag hả anh’. Trong túi măng tô của Hiếu có chìa 47B mới in, răng còn ba-via, khớp mạt đồng trong ổ cửa kính."],
      ],
    },
    {
      id: "moc-gio",
      text: "Bà Cúc xem phim ké rồi về lúc {a}; kẻ trộm mở cửa lúc {b}, rồi chép ảnh hồ sơ ra {c}.",
      blanks: {
        a: { answer: "22h58", kind: "luc" },
        b: { answer: "23h17", kind: "luc" },
        c: { answer: "usb", kind: "vat" },
      },
      explain: [
        ["me", "Bà Cúc đăng xuất 22h58, cửa và tủ còn nguyên. 23h17 chị Ly chụp được người măng tô kính râm mở cửa bằng chìa. 23h21 máy tính bật lại, chép ảnh hồ sơ ra USB ‘TTP_BACKUP’."],
      ],
    },
    {
      id: "duong-chia",
      text: "Chìa thứ hai do {a} in theo chìa gốc của {b} để lại ở sạp; Hiếu biết chuyện nhờ {c}.",
      blanks: {
        a: { answer: "bao", kind: "ai" },
        b: { answer: "teo", kind: "ai" },
        c: { answer: "nghe-len", kind: "cach" },
      },
      explain: [
        ["me", "Bộ đếm máy cắt: hai chìa 47B thứ Hai. Thẻ treo ‘TÈO – VP THÁM TỬ’ ngay trước ghế chờ. Vlog của chính Hiếu thu được tiếng Tèo nói to ‘chìa văn phòng thám tử, 8 giờ tối em lấy’. 19h50 Hiếu quay lại, giả làm người của văn phòng."],
      ],
    },
    {
      id: "dong-co",
      text: "Hiếu lấy hồ sơ để {a}; còn {b} nói dối chuyện không vô văn phòng vì {c}.",
      blanks: {
        a: { answer: "pha-lai-vu", kind: "vi" },
        b: { answer: "bacuc", kind: "ai" },
        c: { answer: "xem-phim", kind: "vi" },
      },
      explain: [
        ["me", "Sáu vụ ‘phá lại’ trên bảng ghim, mỗi vụ một clip câu view, kèm nick bôi nhọ, để cả hẻm bỏ văn phòng mà tin Thám Tử Pro. Còn bà Cúc giấu chuyện tối nào cũng vô coi phim Hàn ké máy lạnh."],
      ],
    },
  ],

  finale: {
    culprit: "pro",
    intro: [
      ["narr", "Chiều thứ Sáu. Văn phòng thám tử đã dọn lại, sáu khung ảnh thẳng hàng. Bà Cúc, chị Ly, anh Bảo, Tèo đứng trong phòng. Ngoài cửa kính, cả hẻm 47 chen chúc."],
      ["batu", "Bà Tư live nha bà con! Văn phòng thám tử tự phá vụ của chính mình! Hồi hộp còn hơn coi phim Hàn!", "happy"],
      ["chuba", "Tui có mặt! Đúng giờ! Lần thứ hai trong đời! Lần trước là đám hỏi!", "happy"],
      ["narr", "Cửa kính bật mở. Ring light chói loá. Hiếu ‘Thám Tử Pro’ sải bước vô, măng tô tung bay, điện thoại giơ cao."],
      ["pro", "Khoan đã! Xin chào một triệu hai anh em! Thám Tử Pro có mặt để phá vụ này TRƯỚC thám tử hẻm! Sáu mươi giây! Bắt đầu!", "smug"],
      ["me", "Mời anh. Anh nói, tui nghe. Anh sai chỗ nào, tui chỉ chỗ đó."],
      ["teo", "Sếp… sếp cho ảnh nói thiệt hả sếp?", "nervous"],
      ["me", "Người chưa bao giờ bị cãi lại thì nên được cãi lại một lần, trước mặt người coi của mình.", "smug"],
    ],
    steps: [
      {
        claim: [
          ["pro", "Giây thứ 10: thủ phạm là thợ khoá Bảo! Chỉ có ổng in được chìa! Ổng in thêm một cái, tự vô lấy hồ sơ đem bán cho báo! Giải quyết!", "smug"],
          ["bao", "Tui?!", "shock"],
        ],
        answer: "so-in-khoa",
        right: [
          ["me", "Sổ in khoá: dòng 19h50, tẩy rồi mà còn hằn. ‘Người bên VP thám tử – in thêm 1 chìa – áo măng tô, kính râm – bo 200k’. Anh Bảo tự tay ghi người lấy chìa thứ hai, ghi cả cái áo."],
          ["me", "Kẻ trộm không ngồi ghi tả chính mình vô sổ. Anh Bảo là người bị lừa. Và người lừa anh ấy mặc măng tô, đeo kính râm."],
          ["bao", "Măng tô… kính râm… Cậu ngồi ghế chờ hôm thứ Hai…", "shock"],
        ],
        wrong: [["pro", "Thấy chưa anh em! Thám tử hẻm không cãi được! Thợ khoá là thủ phạm!", "smug"]],
        hint: "Anh Pro buộc tội anh Bảo. Mà anh Bảo có ghi lại người lấy chìa thứ hai, dù đã tẩy. Sếp đưa cái sổ ra đi!",
      },
      {
        claim: [
          ["pro", "Ờ… ờ thì bà Cúc! Bà chủ nhà có chìa tổng! Vô văn phòng ban đêm, phá cho mấy người mất uy tín, dọn đi, rồi tăng giá cho người khác thuê! Động cơ rõ ràng!", "smug"],
          ["bacuc", "Tui vô coi phim thôi mà!", "shock"],
        ],
        answer: "lich-su-may-tinh",
        right: [
          ["me", "Nhật ký máy tính: bà Cúc xem phim từ 22h03, đăng xuất 22h58. Phiên thứ hai, 23h21 tới 23h33, không có tài khoản nào, chỉ có một cái USB tên ‘TTP_BACKUP’ chép ảnh hồ sơ vụ 1 tới 6."],
          ["me", "Bà Cúc không cần USB để coi phim Hàn. Và ‘TTP’ không phải viết tắt của ‘Tập Tiếp Phim’."],
          ["teo", "TTP… Thám… Tử… Pro…", "shock"],
          ["bacuc", "Người cho thuê gấp đôi là cậu đó! Cậu muốn văn phòng này mà!", "angry"],
        ],
        wrong: [["pro", "Đó, chìa tổng! Bà Cúc mở được mọi cửa! Anh em thấy chưa!", "smug"]],
        hint: "Bà Cúc vô xem phim, rồi về lúc mấy giờ? Cái máy tính có ghi hết. Có cả phiên thứ hai nữa đó sếp.",
      },
      {
        claim: [
          ["pro", "Vậy là chị Ly! Phóng viên rình ngoài cửa cả đêm! Sáng ra đăng bài ‘6 vụ, 6 lần bắt nhầm’! Chị ta lấy hồ sơ để giật tin độc quyền!", "angry"],
          ["ly", "Tui… tui đâu có…", "nervous"],
        ],
        answer: "dau-son-kinh",
        right: [
          ["me", "Vết son của chị Ly nằm ở mặt NGOÀI cửa kính. Chị áp mặt vô kính để nhìn vô. Người có chìa thì đâu cần áp mặt nhìn trộm."],
          ["ly", "Tui rình ba đêm, không dám gõ cửa. Tui còn chụp được người mở cửa lúc 23h17. Măng tô, kính râm, ring light mini trên tay.", "angry"],
          ["ly", "Tui viết bài sai. Tui sẽ đính chính. Nhưng tui không ăn trộm. Tui chỉ là fan nhát gan.", "nervous"],
        ],
        wrong: [["pro", "Thấy chưa! Phóng viên là thủ phạm! Pro biết ngay từ giây đầu!", "smug"]],
        hint: "Chị Ly có ở đây đêm qua thật. Nhưng chị đứng phía nào của tấm kính? Vết son nói lên điều đó.",
      },
      {
        claim: [
          ["pro", "Được! Vậy thì là nội gián! TÈO! Chính nó đem chìa văn phòng đi in! Chính nó biết chìa tủ để đâu! Trợ lý phản bội! Kết luận cuối cùng!", "angry"],
          ["teo", "…", "nervous"],
          ["narr", "Cả phòng im lặng. Tèo cúi đầu. Ngoài cửa kính, cả hẻm nín thở."],
        ],
        answer: "binh-luan-teo",
        right: [
          ["me", "Đúng, Tèo đem chìa đi in. Tèo dán giấy nhớ chỗ để chìa tủ. Tèo bất cẩn. Nhưng bất cẩn không phải ăn trộm."],
          ["me", "Còn đêm qua, từ 23h12 tới 23h38, Tèo nằm ở nhà bình luận vô live của anh: ‘anh Pro ơi sao đứng im vậy’, ‘câu này anh nói lần thứ 5 rồi’, ‘lag hả anh’. Đúng lúc USB đang chép hồ sơ trong văn phòng này."],
          ["me", "Tèo không có ở đây. Và Tèo là người duy nhất trong ba nghìn người coi nhận ra: anh cũng không có ở đó."],
          ["teo", "Em… em chỉ thấy con thiêu thân đậu hoài một chỗ…", "nervous"],
        ],
        wrong: [["pro", "Đó! Thám tử bao che cho trợ lý! Anh em thấy chưa!", "smug"]],
        hint: "Đêm qua Tèo đang làm gì lúc kẻ trộm ở trong văn phòng? Tèo có để lại dấu vết ở đâu đó trên mạng…",
      },
      {
        claim: [
          ["pro", "Thì… thì là một tên trộm bí ẩn nào đó! Không phải Pro! Đêm qua Pro live liên tục, ba nghìn nhân chứng! Bằng chứng ngoại phạm hoàn hảo!", "nervous"],
        ],
        answer: "live-lap",
        right: [
          ["me", "Bản lưu buổi live của anh: 23h05 tới 23h40, cùng một câu ‘Khoan, để Pro suy nghĩ’, cùng con thiêu thân đậu cùng một chỗ, mười hai lần. Ba nghìn nhân chứng coi một đoạn video lặp."],
          ["me", "23h40 anh quay lại màn hình, thở dốc, tóc bết, măng tô xộc xệch. Từ studio tới văn phòng này chạy bộ mất mười hai phút."],
          ["narr", "Trên màn hình điện thoại của Hiếu, bình luận bắt đầu đổi chiều: ‘ủa lặp thiệt kìa’, ‘con thiêu thân!!!’, ‘ông Tèo nói đúng’."],
        ],
        wrong: [["pro", "Ba nghìn người làm chứng đó! Thám tử cãi ba nghìn người hả?", "smug"]],
        hint: "Giờ tới lượt anh Pro tự bào chữa. Ba nghìn nhân chứng coi cái gì? Sếp tua lại buổi live rồi đó.",
      },
      {
        claim: [
          ["pro", "Ra ngoài một chút thì sao! Măng tô kính râm thì cả thành phố mặc! Ai chứng minh người mở cửa là Pro?", "angry"],
        ],
        answer: "mang-to-rach",
        right: [
          ["me", "Đêm qua mèo văn phòng cào kẻ đột nhập. Sợi chỉ be còn kẹt trong móng nó. Một mảnh vạt măng tô hình tam giác nằm dưới gầm tủ, dính lông mèo mướp."],
          ["me", "Trong tủ đồ của anh, cái măng tô thứ ba rách đúng một mảnh tam giác ở vạt sau, chỗ rách bám lông mèo. Trong túi nó có chìa 47B mới in."],
          ["bao", "Chìa đó tui in! Ba-via đó là tui dũa vội! Tui nhận ra!", "angry"],
          ["narr", "Kính Lúp nhảy lên bàn, nhìn thẳng vô Hiếu, xù đuôi. Hiếu lùi một bước."],
        ],
        wrong: [["pro", "Đó! Măng tô thì ai chẳng có! Pro thắng!", "smug"]],
        hint: "Mèo văn phòng đã cào ai đó đêm qua, và để lại một mảnh vải. Trong tủ đồ anh Pro có cái áo nào thiếu mảnh không?",
      },
      {
        claim: [
          ["pro", "Nhưng… nhưng Pro làm sao biết chìa văn phòng nằm ở sạp khoá? Pro đâu có phép thần thông! Cái đó chứng minh không được!", "nervous"],
        ],
        answer: "vlog-sap-khoa",
        right: [
          ["me", "Vlog của chính anh, thứ Hai 17h06, ngồi ghế chờ sạp anh Bảo. Trong clip có tiếng Tèo: ‘chìa văn phòng thám tử… em để chìa gốc đây, 8 giờ tối em lấy’. Rồi anh ghé sát ống kính: ‘Văn phòng thám tử. Thú vị đây’."],
          ["me", "Anh không phá khoá. Anh nghe lén. 19h50 anh quay lại, mặc măng tô kính râm, nói ‘bên văn phòng thám tử, sếp dặn in thêm một cái’."],
          ["teo", "Anh… anh đứng đó nghe em nói. Rồi anh mặc đồ giống sếp em để lừa anh Bảo…", "angry"],
          ["narr", "Hiếu tháo kính râm. Lần đầu tiên, anh tắt ring light."],
        ],
        wrong: [["pro", "Đó! Không ai biết được chìa ở đâu! Trừ thằng Tèo!", "smug"]],
        hint: "Anh Pro hỏi làm sao ảnh biết chìa ở sạp khoá. Anh Pro có thói quen quay vlog mọi lúc mọi nơi đó sếp…",
      },
    ],
    confess: [
      ["pro", "…Năm ngoái tui coi clip vụ Nồi Thịt Kho. Tui mê lắm. Tui mua áo măng tô, mua kính râm, tập nói giống thám tử. Tui muốn được như anh.", "nervous"],
      ["pro", "Mà tui không có kiên nhẫn. Tui làm clip ‘phá án 60 giây’. Một triệu hai người theo dõi. Vụ nào tui cũng sai, người ta chửi, mà càng chửi càng lắm view.", "nervous"],
      ["pro", "Rồi tui nghe Tèo nói ở sạp khoá. Tui nghĩ: nếu tui có hồ sơ gốc, ‘phá lại’ sáu vụ của anh, chứng minh anh sai, thì tui là thám tử giỏi nhất hẻm. Bà Cúc còn nói nếu văn phòng dọn đi thì cho tui thuê.", "nervous"],
      ["pro", "Đêm qua tui đặt video lặp, chạy bộ qua đây, mở cửa, lục tủ. Con mèo cào tui. Tui chụp hồ sơ dưới ring light, lập nick bôi nhọ. Sáng ra đăng clip ‘phá lại’.", "nervous"],
      ["pro", "Mà… tui đọc hết sáu bìa hồ sơ rồi. Đọc kỹ, lần đầu tiên tui đọc một cái gì đó kỹ. Anh đúng hết. Sáu vụ. Tui mới là người sai sáu lần.", "nervous"],
      ["pro", "Tui xin lỗi anh. Xin lỗi Tèo. Xin lỗi anh Bảo, tui mặc đồ giả anh thám tử để lừa anh. Xin lỗi anh Tuấn, cô Mười, chị Hằng, ông Năm, Bé Ti…", "nervous"],
      ["teo", "Sếp… em cũng xin lỗi. Trước mặt cả hẻm luôn. Tại em in chìa lén, tại em nói to, tại em dán giấy nhớ. Em sẵn sàng nghỉ việc.", "nervous"],
      ["me", "Tèo. Cậu nhận lỗi trước khi bị ai bắt lỗi. Ngay cả khi người ta vừa chỉ tay vô mặt cậu trước cả hẻm, cậu vẫn không đổ cho ai. Đó là thứ mà một triệu hai người theo dõi cũng không mua được.", "neutral"],
      ["me", "Lần sau mất chìa thì nói với tui. Tui la, rồi tui đi in chìa với cậu.", "smug"],
      ["teo", "Dạ… dạ sếp…", "happy"],
    ],
    epilogue: [
      ["narr", "Tối hôm đó, Hiếu live lần cuối dưới tên ‘Thám Tử Pro’. Không ring light, không măng tô. Chỉ ngồi đọc từng dòng xin lỗi, gỡ hết sáu clip ‘phá lại’. Kênh mất bốn trăm nghìn người theo dõi trong một giờ."],
      ["narr", "Cả hẻm 47 kéo tới trước văn phòng. Cô Hai ôm nồi thịt kho. Tuấn mặc áo dính sa tế, cố tình. Ông Bảy với Chiến Thần. Chị Vy dán tên lên ly trà sữa ghi ‘TÈO’. Cô Út kéo dây wifi miễn phí ra tận cửa. Bé Mít live mà để camera quay về văn phòng."],
      ["batu", "Nhóm ‘Hẻm 47 Hóng Biến… và Thương Nhau’ đã xoá sạch nick ‘Sự Thật Hẻm 47’. Bà Tư ghim bài mới: ‘Văn phòng thám tử hẻm 47: mười hai vụ, không bắt nhầm ai’.", "happy"],
      ["ly", "Bài đính chính của tui lên trang nhất rồi: ‘Thám Tử Hẻm: 12 vụ, 12 lần đúng’. Không có dấu chấm hỏi. Tổng biên tập không chịu, tui nói ‘đăng hay tui nghỉ’. Ổng đăng.", "happy"],
      ["bacuc", "Giá thuê giữ nguyên. Mà tối thứ Năm tui vẫn qua coi phim, mấy người coi chung thì tui đem chè. Tập 15 nha!", "happy"],
      ["bao", "Từ nay sạp tui có luật mới: in chìa phải có chủ nhà đứng kế bên, và ai nói to thì tui nhắc nói nhỏ.", "smug"],
      ["narr", "Gần khuya, Hiếu đứng ngoài cửa kính, không măng tô, không kính râm, tay cầm sáu bìa hồ sơ đã sắp lại ngay ngắn."],
      ["pro", "Anh thám tử… tui trả hồ sơ. Và… nếu được… tui xin học việc. Tui không xin lương. Tui xin học cách nhìn kỹ.", "nervous"],
      ["me", "Học việc ở đây thì bắt đầu từ đâu, Tèo?", "neutral"],
      ["teo", "Từ rửa ly cà phê, sếp! Như em hồi đó! Mà em là đàn anh nha, em vô trước!", "smug"],
      ["pro", "Dạ… đàn anh Tèo.", "nervous"],
      ["teo", "Sếp ơi! Có người gọi em là đàn anh! Mười hai vụ, lần đầu tiên!", "happy"],
      ["narr", "Kính Lúp nhảy lên đùi Hiếu, nằm xuống, kêu rừ rừ. Mèo tha thứ nhanh hơn người. Nhưng người hẻm 47 cũng không chậm lắm."],
      ["chuba", "Ghi nhận: hết mùa thứ hai. Hẻm 47 bình yên. Tui về ngủ đây.", "happy"],
      ["batu", "Khoan! Mùa ba có không thám tử?", "happy"],
      ["me", "Hẻm này còn người là còn chuyện, bà Tư.", "smug"],
    ],
    comments: [
      { by: "batu", text: "Mười hai vụ, mười hai cái kết có hậu. Ai bôi nhọ văn phòng thám tử hẻm mình là bà Tư kick, không cần chờ sáu mươi giây.", likes: 15012 },
      { by: "teo", text: "Hôm nay em làm mất chìa, làm mất hồ sơ, bị buộc tội trước cả hẻm. Mà tối về em có đàn em. Đời vui ghê.", likes: 11204 },
      { by: "Hiếu (học việc)", text: "Ngày đầu học việc: rửa mười hai cái ly, nghe đàn anh Tèo giảng ba tiếng về cách ngửi kem bánh. Tui học được: nhìn trước, nói sau.", likes: 8890 },
      { by: "Cô Hai Thịt Kho", text: "Tui nấu nồi thịt kho mừng văn phòng. Lần này để ngay cửa, ai lấy cũng được. Mà nhớ trả nồi.", likes: 6120 },
      { by: "Tuấn (vụ Nồi Thịt Kho)", text: "Hai lần bị buộc tội, một lần được minh oan trước một triệu hai người. Tui đóng khung cái áo sa tế.", likes: 7340 },
      { by: "Linh Ăn Uống", text: "Hồi đó em là thủ phạm thật mà bị ông Pro ‘minh oan’. Cảm giác còn kỳ hơn bị bắt. Cảm ơn thám tử đã đúng.", likes: 5280 },
      { by: "Ông Bảy Gà Chọi", text: "Chiến Thần gáy ba tiếng trước văn phòng. Tui nói rồi, gà nó biết ai ngay ai gian.", likes: 3410 },
      { by: "Bin", text: "Ông nội con lại nói gà phá án. Lần này con không cãi, con mệt rồi.", likes: 3960 },
      { by: "Vy Trưởng Phòng", text: "Lần đầu tui dán tên người khác lên ly trà sữa: ‘TÈO’. Ai uống là biết tay tui.", likes: 4470 },
      { by: "Cô Mười Cơm Gà", text: "Ông Pro tới xin lỗi, tui cho một dĩa cơm gà. Gà công nghiệp nha. Không phải gà chọi.", likes: 3120 },
      { by: "Út Cà Phê", text: "Wifi quán tui đổi tên: ‘VanPhongThamTuMuonNam’. Pass là ‘nhintruocnoisau’.", likes: 4850 },
      { by: "Bé Mít Review", text: "Mít live trước văn phòng mà không quay mặt mình. Lần thứ hai trong đời. Thấy mình trưởng thành ghê.", likes: 5630 },
      { by: "Ông Cả", text: "Thám tử đã giữ nhẫn cho nhà tui. Giờ cả hẻm giữ văn phòng cho thám tử. Có qua có lại mới toại lòng nhau.", likes: 9020 },
      { by: "Bé Ti", text: "ông pro xin lỗi con rồi. con tha. mà con vẫn bắn ổng một cái. cho chắc.", likes: 8760 },
      { by: "Chị Ly (Hóng 24h)", text: "Bài phỏng vấn độc quyền đã lên. Thám tử trả lời đúng một câu: ‘Nhờ có Tèo’. Tui khóc lần hai trong tuần.", likes: 6990 },
      { by: "Bà Cúc", text: "Tối thứ Năm này coi ‘Hẻm Nhỏ Tình To’ tập 15 tại văn phòng thám tử. Có chè. Có máy lạnh. Tiền điện tui chịu.", likes: 5510 },
      { by: "Anh Bảo Thợ Khoá", text: "Hôm nay tui đặt tên cho ổ khoá mới của văn phòng: ‘Cô Kính Hai’. Chìa in đúng hai cái. Một cho thám tử, một cho Tèo. Hết.", likes: 4300 },
      { by: "Chú Ba Dân Phòng", text: "Hết mùa hai. Tui đi đúng giờ hai lần. Mùa ba tui phấn đấu ba lần.", likes: 6080 },
    ],
  },

  hints: [
    {
      needs: ["clue:vlog-sap-khoa", "clue:live-lap", "clue:mang-to-rach", "clue:anh-ly-23h17", "clue:lich-su-may-tinh"],
      text: "Sếp ơi, đủ hết rồi: video lặp, măng tô rách, chìa 47B, ảnh 23h17, vlog sạp khoá. Ra bảng suy luận chốt đi sếp. Em… em sẵn sàng rồi.",
    },
    {
      needs: "loc:studio",
      done: ["seen:studio.dien-thoai-livestream", "seen:studio.tu-quan-ao", "seen:studio.laptop-dung-clip"],
      text: "Studio anh Pro nhiều đồ quá sếp. Mình coi lại bản lưu buổi live, lục tủ đồ, với coi cái laptop dựng clip đi. Ảnh quay vlog mọi lúc mà.",
    },
    {
      needs: "stmt:pro-fan-gui",
      done: { any: ["broke:pro-fan-gui", "loc:studio"] },
      text: "Anh Pro mời mình tới studio. Đi thôi sếp! Mà trước đó hỏi chị Ly coi mấy bài bôi nhọ được đăng lúc mấy giờ.",
    },
    {
      needs: "stmt:pro-live-lien-tuc",
      done: "broke:pro-live-lien-tuc",
      text: "Anh Pro nói live liên tục, ba nghìn nhân chứng. Mà đêm qua… em có coi live đó. Sếp hỏi em làm gì đêm qua đi.",
    },
    {
      needs: "stmt:pro-chua-toi-sap",
      done: "broke:pro-chua-toi-sap",
      text: "Anh Pro nói chưa tới sạp khoá bao giờ. Ghế chờ ở sạp anh Bảo có gì kẹt trong khe không ta? Hay ảnh có quay clip gì không?",
    },
    {
      needs: "stmt:ly-o-toa-soan",
      done: "broke:ly-o-toa-soan",
      text: "Chị Ly nói ở toà soạn cả đêm. Mà cửa kính văn phòng mình có vết son đỏ ở mặt ngoài… màu giống son chị Ly ghê.",
    },
    {
      needs: "stmt:cuc-khong-vo",
      done: "broke:cuc-khong-vo",
      text: "Bà Cúc nói cả tháng không vô văn phòng. Máy tính văn phòng có ghi ai đăng nhập đêm qua không sếp?",
    },
    {
      needs: "stmt:bao-mot-chia",
      done: "broke:bao-mot-chia",
      text: "Anh Bảo nói in đúng một chìa. Cái máy cắt chìa có bộ đếm đó sếp. Máy không biết nói dối.",
    },
    {
      needs: "stmt:teo-khong-dua-chia",
      done: "broke:teo-khong-dua-chia",
      text: "Sếp… em… thôi. Sếp ra sạp anh Bảo coi bảng chìa phôi đi. Em không dám nói. Em đi pha cà phê.",
    },
    {
      text: "Sếp ơi, văn phòng mình bị lục tung. Mình soi tủ hồ sơ, cửa kính, máy tính, với con Kính Lúp trước đi sếp. Rồi ra sạp anh Bảo.",
    },
  ],

  bonus: [
    {
      id: "ten-meo",
      q: "Mèo văn phòng thám tử tên là gì?",
      choices: ["Thịt Kho", "Kính Lúp", "Chiến Thần", "Cô Kính"],
      answer: 1,
      explain: "Kính Lúp, mèo mướp ở với văn phòng từ hồi vụ Nồi Thịt Kho. Còn ‘Cô Kính’ là tên anh Bảo đặt cho ổ khoá cửa kính.",
    },
    {
      id: "tai-khoan-cuc",
      q: "Tài khoản bà Cúc dùng để xem phim Hàn ké trong văn phòng tên gì?",
      choices: ["TTP_BACKUP", "CucXinhDep1958", "HemNhoTinhTo", "BaCucChuNha"],
      answer: 1,
      explain: "‘CucXinhDep1958’, xem ‘Hẻm Nhỏ Tình To’ tập 13 và 14, đăng xuất lúc 22h58.",
    },
    {
      id: "pha-lai-vu-1",
      q: "Thám Tử Pro ‘phá lại’ vụ Nồi Thịt Kho và kết luận thủ phạm là ai?",
      choices: ["Linh", "Tuấn", "Ông Sáu chủ trọ", "Con mèo"],
      answer: 1,
      explain: "Pro chọn Tuấn vì áo dính nước màu, đúng người gây nhiễu. Thủ phạm thật là Linh, áo Tuấn dính sa tế mì gói.",
    },
  ],
};
