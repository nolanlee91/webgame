// Vụ 6: "Chiếc Nhẫn Trong Đám Hỏi" (độ khó 3, vụ cuối). Hai lớp.
// Lớp 1: nhẫn gia truyền mất khỏi khay trầu cau lúc 9h15 (Bé Ti xịt súng nước, nhốn nháo). Vết kem xanh dẫn tới
//   bánh kem, cắt bánh thì "tìm thấy nhẫn!" (flag tim-thay-nhan). Anh Hùng đổ cho Bé Ti nghịch.
// Cú lật: dì Ba thẩm định thì nhẫn là NHẪN GIẢ, dấu Mỹ Ký 247 (flag nhan-gia). Mở hộp đồng hồ quả lắc thấy biên nhận
//   cầm đồ, mở tiệm cầm đồ (gives.locs pawnshop).
// Lời giải: anh Hùng mượn chìa khoá tủ thờ Thứ Ba tuần trước, đem nhẫn thật đi cầm 80 triệu gỡ lỗ tiền ảo MoonDoge,
//   đặt Mỹ Ký 247 làm nhẫn giả 350 nghìn bỏ vô hộp. Hôm nay dì Ba đòi "lát coi kỹ tuổi vàng", Hùng hoảng, giật nhẫn giả
//   lúc 9h15, 9h25 nhét vô bánh kem lúc bếp vắng (chị Loan đi mua kem tươi), để màn "tìm thấy" làm cả nhà quên soi,
//   lỡ lộ giả thì đổ cho người làm bánh hoặc Bé Ti. Vết xanh trên bánh là màu áo "GUCCl" phai khi bị Bé Ti xịt nước.
// Gây nhiễu: dì Ba (hỏi giá nhẫn, rành nhẫn giả vì vàng mình đeo toàn mỹ ký), chị Loan (bánh mua siêu thị, rời bếp),
//   ông nội (giấu chuyện đưa chìa khoá vì sợ bị nói lẩm cẩm), Bé Ti (nước súng xanh, nhưng là siro bạc hà).
export default {
  id: "nhan-dam-hoi",
  no: 6,
  title: "Chiếc Nhẫn Trong Đám Hỏi",
  tagline: "Nhẫn gia truyền trăm năm biến mất giữa đám hỏi. Tìm thấy rồi! …Khoan, cái nhẫn này hơi nhẹ.",
  difficulty: 3,
  client: "khang",

  intro: [
    ["narr", "Sáng thứ Bảy. Văn phòng thám tử đóng cửa, vì cả hẻm 47 đều đi đám hỏi ở căn nhà lớn đầu hẻm."],
    ["teo", "Sếp ơi, em ủi áo sơ mi từ tối qua. Hôm nay mình đi ăn, không phá án. Sếp hứa rồi nha.", "happy"],
    ["me", "Tui hứa đi ăn. Tui không hứa là không có án.", "neutral"],
    ["narr", "Nhà ông nội chú rể treo đèn lồng đỏ, bảy mâm quả xếp hàng. Hai họ ngồi kín phòng khách. Mới 9h20 mà bà Tư đã đứng ở cổng, mặt tái mét."],
    ["batu", "Thám tử! Tới đúng lúc! Mất nhẫn rồi! Nhẫn gia truyền trăm năm của nhà ông Cả mất ngay giữa lễ!", "shock"],
    ["khang", "Anh thám tử, em là Khang, chú rể. Nhẫn của bà cố em để lại từ năm 1925, vàng chạm rồng, mặt ngọc bích. Ông nội em lấy ra đặt trên khay trầu cau lúc 8h30 cho hai họ coi.", "nervous"],
    ["khang", "Tới 9h15 đồng hồ quả lắc đổ chuông, bé Ti bắn súng nước loạn xạ, mọi người nhốn nháo một hồi. Xong quay lại thì hộp nhẫn trống trơn.", "shock"],
    ["ngoc", "Em là Ngọc, cô dâu. Bên nhà em… dì Ba em hồi sáng có hỏi cái nhẫn bán được bao nhiêu. Giờ bên nội anh Khang nhìn dì em kiểu khác lắm.", "nervous"],
    ["ongnoi", "Nhẫn đó bà cố đeo qua hai thời chiến tranh, qua mấy năm đói, không bán. Tới đời tui mà mất…", "nervous"],
    ["teo", "Sếp! Em biết rồi! Bé Ti! Con nít cầm súng nước là có âm mưu! Chốt!", "smug"],
    ["beti", "Hông phải con! Chú Tèo xấu xa!", "angry"],
    ["me", "Không ai ra khỏi nhà. Tui soi phòng khách với nhà bếp trước.", "neutral"],
    ["narr", "Trong đám khách có nhiều gương mặt quen: cô Hai với nồi thịt kho, Linh với vòng đèn, ông Bảy với Bin, chị Vy, cô Út, và cả Bé Mít đang live, lần này bật tiêu đề ‘Live thật, không kịch bản’."],
    ["bemit", "Thám tử ơi, Mít live từ 8h tới giờ nè. Có gì cần coi lại thì nói Mít nha. Lần này Mít không dàn dựng gì hết, thề!", "nervous"],
  ],

  social: {
    group: "Hẻm 47 Hóng Biến",
    posts: [
      {
        by: "batu",
        text: "🚨🚨 KHẨN CẤP 🚨🚨 Nhẫn gia truyền TRĂM NĂM của nhà ông Cả đầu hẻm BIẾN MẤT ngay giữa đám hỏi cháu đích tôn! Hai họ đang nhìn nhau bằng ánh mắt nghi ngờ. Thám tử hẻm mình có mặt tại hiện trường. Bà con giữ bình tĩnh, ĐỪNG AI VỀ!!",
        likes: 6304,
        comments: [
          { by: "Cô Hai Thịt Kho", text: "Tui đang ngồi đây nè. Tui ôm nồi thịt kho chặt cứng, lần này không ai lấy được của tui nữa." },
          { by: "Linh Ăn Uống", text: "Em có quay món ăn, không quay nhẫn. Lần này em vô tội 100% nha mọi người 😅" },
          { by: "Ông Bảy Gà Chọi", text: "Tui đem Chiến Thần theo. Nó gáy thì tức là có kẻ gian." },
          { by: "Bin", text: "Ông nội con nói vậy chứ Chiến Thần gáy là tại nó đói thôi ạ." },
          { by: "Vy Trưởng Phòng", text: "Tui đem ly trà sữa có ghi tên. Đứa nào uống là biết tay." },
          { by: "Út Cà Phê", text: "Quán tui hôm nay đóng cửa đi đám hỏi. Wifi vẫn mở cho cả hẻm nha, khỏi cắt." },
          { by: "teo", text: "Em đoán rồi: Bé Ti. Lần này em chắc 99%." },
          { by: "Bé Mít Review", text: "Mít đang live ở hiện trường, không kịch bản, không dàn dựng. Ai cần clip làm bằng chứng thì nhắn Mít 🙏" },
          { by: "Chú Ba Dân Phòng", text: "Tui đang trên đường tới. Kẹt xe ở đầu hẻm. Đầu hẻm chính là chỗ đám hỏi. Tui đang kẹt trong đám hỏi." },
        ],
      },
    ],
  },

  people: {
    ongnoi: {
      name: "Ông Cả",
      role: "Ông nội chú rể, chủ nhà",
      bio: "80 tuổi, gậy trúc, tóc bạc trắng. Giữ chìa khoá tủ thờ, nơi cất hộp nhẫn. Dạo này hay quên, hay dán giấy nhắc khắp nhà nhưng không chịu nhận là mình quên.",
      suspect: true,
      start: true,
    },
    diba: {
      name: "Dì Ba",
      role: "Dì của cô dâu",
      bio: "Hai tay đeo kín vòng vàng, nói không ngừng. Khoe ‘ba chục năm đeo vàng, nhìn là biết tuổi vàng’. Sáng nay hỏi giá cái nhẫn gia truyền trước mặt hai họ.",
      suspect: true,
      start: true,
    },
    anhhung: {
      name: "Anh Hùng",
      role: "Anh họ chú rể",
      bio: "32 tuổi, áo khoác ‘hàng hiệu’, đeo kính đen trong nhà. Hay nói về tiền ảo và ‘lên thuyền sớm’. Sống chung nhà với ông nội.",
      suspect: true,
      start: true,
    },
    chiloan: {
      name: "Chị Loan",
      role: "Bếp trưởng thuê ngoài",
      bio: "Nón đầu bếp cao ngất, nhận nấu cỗ và làm bánh kem cho đám hỏi. Tự hào ‘bánh nhà làm, không bao giờ mua sẵn’.",
      suspect: true,
      start: true,
    },
    beti: {
      name: "Bé Ti",
      role: "Cháu họ, 7 tuổi",
      bio: "Cầm súng nước không rời tay, nước pha [[nuoc-bac-ha|siro bạc hà]] xanh lá cho ‘đẹp’. Nghịch có tiếng trong họ.",
      suspect: true,
      start: true,
    },
    khang: { name: "Khang", role: "Chú rể", bio: "Cháu đích tôn nhà ông Cả. Hiền, lo lắng, thương ông nội." },
    ngoc: { name: "Ngọc", role: "Cô dâu", bio: "Cháu dì Ba. Sợ hai họ mất lòng nhau vì cái nhẫn." },
    cohai: { name: "Cô Hai", role: "Khách dự tiệc (vụ Nồi Thịt Kho)", bio: "Đem nồi thịt kho trứng làm quà. Quai nồi vẫn buộc dây thun đỏ." },
    linh: { name: "Linh", role: "Khách dự tiệc (vụ Nồi Thịt Kho)", bio: "Streamer ăn uống, giờ chỉ nấu món của chính mình." },
    ongbay: { name: "Ông Bảy", role: "Khách dự tiệc (vụ Chiến Kê)", bio: "Đem theo gà Chiến Thần trong lồng. Không ai hiểu vì sao." },
    bin: { name: "Bin", role: "Khách dự tiệc (vụ Chiến Kê)", bio: "Mới đậu đại học, hết bị gà gáy làm phiền." },
    vy: { name: "Chị Vy", role: "Khách dự tiệc (vụ Trà Sữa)", bio: "Trưởng phòng Cà Khịa Media. Ly trà sữa ghi tên to đùng." },
    cout: { name: "Cô Út", role: "Khách dự tiệc (vụ Mất Wifi)", bio: "Chủ quán cà phê. Quán ở ngay đầu chợ, đối diện tiệm cầm đồ." },
    bemit: { name: "Bé Mít", role: "Khách dự tiệc (vụ Đám Cưới Toang)", bio: "Đang live đám hỏi, tiêu đề ‘Live thật, không kịch bản’." },
    chusau: {
      name: "Chú Sáu Cầm Đồ",
      role: "Chủ tiệm cầm đồ đầu chợ",
      bio: "Kính lão trễ mũi, bàn tính cạnh máy tính. Nhớ món đồ giỏi hơn nhớ mặt người.",
      start: false,
    },
  },

  locations: {
    livingroom: {
      name: "Phòng khách nhà ông Cả",
      scene: "livingroom",
      start: true,
      intro: [
        ["narr", "Phòng khách rộng, gạch bông cũ, bàn thờ gỗ cẩm lai. Bảy mâm quả phủ khăn đỏ. Hai họ ngồi hai bên, không ai nói với ai."],
        ["teo", "Sếp ơi, em ngửi thấy mùi xôi gấc. Phá án nhanh nha sếp, xôi nguội là mất ngon.", "nervous"],
      ],
      hotspots: [
        {
          id: "ban-tho",
          label: "Bàn thờ",
          rect: [360, 60, 240, 200],
          lines: [
            ["narr", "Bàn thờ gia tiên. Ở giữa là di ảnh bà cố chụp năm 1960, tay đặt trên gối, ngón áp út đeo chiếc nhẫn chạm rồng."],
            ["me", "Ảnh rõ lắm. Nhẫn vàng mặt ngọc, chạm rồng. Bốn [[mau-chau|mấu chấu]] giữ viên ngọc, mà mấu thứ ba bị mẻ một góc."],
            ["ongnoi", "Mấu đó mẻ từ năm 1968. Bà cố đang giã gạo thì rớt nhẫn vô cối. Bà nói giữ nguyên, cái mẻ đó là kỷ niệm.", "neutral"],
            ["teo", "Bà cố giã gạo mà đeo nhẫn vàng! Sang dữ vậy sếp.", "shock"],
          ],
          gives: { clues: ["anh-ba-co"] },
          again: [["me", "Nhẫn thật có mấu chấu thứ ba bị mẻ. Nhớ kỹ."]],
        },
        {
          id: "khay-trau-cau",
          label: "Khay trầu cau",
          rect: [380, 300, 200, 90],
          lines: [
            ["narr", "Khay trầu cau sơn mài đỏ, chính giữa bàn lễ. Chỗ đặt hộp nhẫn còn để lại một vòng ướt. Lá trầu lấm tấm nước xanh lá."],
            ["me", "Nước xanh lá, thơm mùi [[nuoc-bac-ha|siro bạc hà]]. Là đạn súng nước của Bé Ti. Bé Ti bắn trúng ngay khay nhẫn."],
            ["teo", "Thấy chưa sếp! Bé Ti bắn khay, nhân lúc loạn thì chụp nhẫn! Kế hoạch của một thiên tài bảy tuổi!", "smug"],
            ["me", "Hoặc ai đó đứng sát khay bị bắn trúng. Nước văng ra quanh đó."],
          ],
          gives: { clues: ["nuoc-bac-ha"] },
          again: [["teo", "Em liếm thử một giọt… Dạ, bạc hà thiệt. Ngọt.", "happy"]],
        },
        {
          id: "hop-nhan",
          label: "Hộp nhẫn",
          rect: [440, 270, 70, 50],
          lines: [
            ["narr", "Hộp nhẫn nhung đỏ, nắp mở, nằm cạnh khay trầu cau. Bên trong trống trơn, nệm nhung còn lõm hình chiếc nhẫn."],
            ["me", "Soi dưới đèn: trong khe nệm có mấy vụn [[vun-ma|nhũ vàng]] li ti, bong ra như sơn."],
            ["me", "Vàng thật không bong vụn. Thứ bong ra như vầy là lớp mạ. Lạ."],
            ["teo", "Chắc nhẫn trăm năm nên nó… rụng lông?", "neutral"],
            ["ongnoi", "Hộp này tui khoá trong [[tu-tho|tủ thờ]] suốt. Sáng nay tui mới mở ra, lấy hộp đặt lên khay.", "neutral"],
          ],
          gives: { clues: ["vun-ma-vang"] },
          again: [["me", "Vụn mạ nằm sâu trong khe nệm, chỗ nhẫn nằm lâu ngày mới chà ra được. Không phải văng vô sáng nay."]],
        },
        {
          id: "bo-sofa",
          label: "Bộ sofa",
          rect: [40, 300, 300, 200],
          lines: [
            ["narr", "Bộ sofa da. Trên thành ghế vắt một chiếc áo khoác in chữ to tướng ‘GUCCl’, chữ cuối là chữ L thường. Áo ướt sũng."],
            ["me", "Áo ướt chỗ tay áo và vạt trước. Chỗ ướt phai ra một màu [[mau-ao|xanh lam]], loang cả xuống nệm ghế."],
            ["teo", "GUCCl! Hàng hiệu xịn đó sếp! …Ủa sao chữ cuối là chữ L?", "shock"],
            ["me", "Vì hàng xịn thì chữ cuối là chữ I. Còn hàng này gặp nước là phai."],
          ],
          gives: { clues: ["ao-guci"] },
          again: [["teo", "Áo này giặt chung với đồ trắng chắc cả nhà mặc đồ xanh luôn.", "smug"]],
        },
        {
          id: "dong-ho-qua-lac",
          label: "Đồng hồ quả lắc",
          rect: [800, 40, 120, 400],
          lines: [
            ["narr", "Đồng hồ quả lắc cao quá đầu người, mặt số La Mã. Cứ mười lăm phút đổ một hồi chuông."],
            ["me", "Ai cũng nói nhẫn mất ngay sau hồi chuông [[9h15]]. Mốc giờ chắc nhất trong vụ này."],
            ["narr", "BOONG… BOONG… Đồng hồ đổ chuông 9h30. Cả phòng khách giật mình, Bé Ti giơ súng nước lên theo phản xạ."],
            ["teo", "Á! Đừng bắn! Em mặc sơ mi ủi rồi!", "shock"],
          ],
          again: [["ongnoi", "Đồng hồ này của ba tui. Nó chạy đúng hơn tui nhớ.", "neutral"]],
        },
        {
          id: "mam-qua",
          label: "Bảy mâm quả",
          rect: [600, 330, 190, 180],
          lines: [
            ["narr", "Bảy mâm quả phủ khăn đỏ: trầu cau, rượu trà, bánh pía, trái cây, heo quay, xôi gấc, bánh phu thê."],
            ["teo", "Sếp! Mâm bánh pía thiếu hai cái! Có kẻ trộm thứ hai!", "shock"],
            ["beti", "Con ăn đó. Con đói.", "neutral"],
            ["me", "Vụ bánh pía phá xong. Tèo, đừng ghi vô sổ."],
          ],
          again: [["teo", "Em ghi rồi: ‘Vụ bánh pía: Bé Ti nhận tội trong 3 giây’. Kỷ lục.", "smug"]],
        },
        {
          id: "canh-tu-tho",
          label: "Mặt trong cánh tủ thờ",
          rect: [400, 200, 160, 60],
          needs: "flag:nhan-gia",
          lines: [
            ["narr", "Nhẫn trong hộp là đồ giả. Vậy hộp nhẫn đã bị đụng tới trước hôm nay. Nhờ ông Cả mở tủ thờ, soi lại lần nữa."],
            ["narr", "Mặt trong cánh tủ dán chi chít giấy nhắc chữ run run: ‘Uống thuốc huyết áp’, ‘Mua nhang’, ‘Gọi thằng Khang’…"],
            ["me", "Tờ mới nhất: ‘[[thu-ba|Thứ Ba]]: đưa [[chia-khoa|chìa khoá]] tủ thờ cho thằng Hùng lau bàn thờ. NHỚ LẤY LẠI’. Chữ ‘NHỚ LẤY LẠI’ gạch dưới hai lần."],
            ["teo", "Ông nội ghi nhớ lấy lại… mà ông có nhớ lấy lại không ta?", "nervous"],
          ],
          gives: { clues: ["giay-nhac-ong-noi"] },
          again: [["me", "Thứ Ba tuần trước, chìa khoá tủ thờ nằm trong tay anh Hùng."]],
        },
        {
          id: "gam-sofa",
          label: "Gầm sofa",
          rect: [60, 470, 260, 60],
          needs: "flag:nhan-gia",
          lines: [
            ["narr", "Cúi xuống gầm sofa. Lăn lóc giữa bụi là một chiếc vòng vàng to bản, móc khoá bị bung."],
            ["me", "Mặt trong vòng có dấu dập nhỏ: ‘MK-247’. Cùng dấu với nhẫn giả trong bánh kem."],
            ["teo", "Vòng của ai rớt vậy sếp? Nhà này ai đeo vàng nhiều nhất ta…", "smug"],
          ],
          gives: { clues: ["vong-tay-diba"] },
          again: [["me", "Vòng ‘vàng’ to bản mà nhẹ hều. Dấu MK-247."]],
        },
        {
          id: "hop-qua-lac",
          label: "Hộp quả lắc",
          rect: [820, 260, 80, 160],
          needs: "flag:nhan-gia",
          lines: [
            ["narr", "Nhẫn thật đã bị tráo. Người tráo phải là người trong nhà, biết chỗ giấu đồ. Mở cánh kính hộp quả lắc ra coi."],
            ["narr", "Dưới đáy hộp, sau quả lắc, có một tờ giấy gấp nhỏ bị xé mất nửa."],
            ["me", "[[bien-nhan|Biên nhận cầm đồ]] số 0473, ‘[[tiem-cam-do|Tiệm Cầm Đồ Phát Tài – đầu chợ]]’. Món hàng: ‘nhẫn vàng mặt ngọc’. Nửa có tên người cầm bị xé mất."],
            ["teo", "Tiệm cầm đồ! Nhẫn thật đang ở tiệm cầm đồ! Sếp, đi liền!", "shock"],
            ["ongnoi", "Hộp quả lắc… Hồi nhỏ thằng Hùng hay giấu kẹo trong đó. Tui tưởng nó lớn rồi…", "nervous"],
          ],
          gives: { clues: ["bien-nhan-cam-do"], locs: ["pawnshop"], people: ["chusau"] },
          again: [["me", "Biên nhận 0473. Tiệm Cầm Đồ Phát Tài, đầu chợ."]],
        },
      ],
    },

    kitchen2: {
      name: "Bếp nhà lớn",
      scene: "kitchen2",
      start: true,
      intro: [
        ["narr", "Bếp rộng, nồi niêu chất đầy. Chính giữa bàn inox là cái bánh kem ba tầng trắng muốt, chờ cắt sau lễ."],
        ["chiloan", "Ai cho vô bếp? Bếp là lãnh thổ của tui! …À thám tử hả. Vô đi, mà đừng đụng bánh.", "angry"],
      ],
      hotspots: [
        {
          id: "banh-kem",
          label: "Bánh kem ba tầng",
          rect: [380, 180, 200, 220],
          lines: [
            ["narr", "Bánh kem ba tầng phủ kem trắng, trên đỉnh có đôi chim bồ câu bằng đường."],
            ["me", "Tầng hai, mặt sau: có một lỗ nhỏ như ai chọc ngón tay vô, rồi trét kem lại vội vàng. Quanh lỗ có vệt [[mau-ao|xanh lam]] lem nhem."],
            ["teo", "Xanh! Nước súng của Bé Ti! Bé Ti chọc bánh! Em nói rồi mà!", "smug"],
            ["me", "Nước súng Bé Ti là xanh lá, mùi bạc hà. Vệt này xanh lam, không có mùi gì. Mà kẹt trong kem có một sợi vải nhỏ."],
          ],
          gives: { clues: ["vet-xanh-banh"] },
          again: [["teo", "Bánh đẹp quá sếp. Em nhìn mà nuốt nước miếng ba lần.", "happy"]],
        },
        {
          id: "cat-banh",
          label: "Cắt bánh chỗ vết xanh",
          rect: [470, 250, 60, 60],
          needs: ["clue:vet-xanh-banh", "broke:chiloan-khong-roi-bep"],
          lines: [
            ["narr", "Bếp vắng từ 9h20 tới 9h35. Vết xanh ở ngay lỗ chọc. Thám tử xin cắt một lát bánh đúng chỗ đó."],
            ["chiloan", "Cắt bánh trước giờ lễ hả? Trời ơi tui… Thôi cắt đi.", "nervous"],
            ["narr", "Dao vừa đi xuống thì nghe ‘cạch’. Một chiếc nhẫn vàng mặt ngọc lăn ra giữa lớp kem dâu."],
            ["teo", "NHẪN!!! TÌM THẤY NHẪN RỒI!!! Bà con ơi, sếp em tìm thấy nhẫn trong [[banh-kem|bánh kem]]!!!", "happy"],
            ["batu", "Bà Tư đăng liền! ‘THÁM TỬ HẺM 47 TÌM THẤY NHẪN GIA TRUYỀN TRONG BÁNH KEM’!", "happy"],
            ["anhhung", "Trời ơi may quá! Chắc chắn là Bé Ti nghịch rồi, lúc nãy tui thấy nó chạy vô bếp mà. Thôi, tìm thấy là được, rửa sạch cất vô tủ liền đi ông nội!", "happy"],
            ["ongnoi", "Tạ ơn ông bà… Đưa đây tui coi.", "happy"],
          ],
          gives: { clues: ["nhan-trong-banh"], flags: ["tim-thay-nhan"] },
          again: [["teo", "Phá án xong! Giờ ăn bánh được chưa sếp? Lát bánh có nhẫn em xin nha.", "happy"]],
        },
        {
          id: "soi-vet-kem",
          label: "Soi lại vết xanh",
          rect: [400, 410, 120, 50],
          needs: ["flag:nhan-gia", "clue:vet-xanh-banh", "clue:ao-guci", "clue:nuoc-bac-ha"],
          lines: [
            ["narr", "Đặt ba thứ cạnh nhau trên bàn inox: lát bánh có vệt xanh, nước súng Bé Ti thấm khăn giấy, và một góc khăn giấy chấm vô vết phai trên áo ‘GUCCl’."],
            ["me", "Nước súng Bé Ti: xanh lá, thơm bạc hà, khô thì dính tay. Vệt trên bánh: xanh lam, không mùi, có sợi vải. Vết phai áo GUCCl: xanh lam, không mùi, sợi vải y hệt."],
            ["teo", "Khoan… sếp… em ngửi rồi nè. Kem chỗ vệt xanh không có mùi bạc hà. Em là chuyên gia ngửi đồ ăn, em xác nhận!", "shock"],
            ["me", "Lần đầu tiên cái mũi của Tèo phá án. Người chọc nhẫn vô bánh có bàn tay dính [[mau-ao|màu áo GUCCl phai]], tức là người mặc áo đó, bị Bé Ti xịt ướt lúc 9h15."],
          ],
          gives: { clues: ["soi-mau-xanh"] },
          again: [["teo", "Mũi em xứng đáng một cái huy hiệu, sếp ha?", "smug"]],
        },
        {
          id: "lo-nuong",
          label: "Lò nướng",
          rect: [60, 160, 200, 200],
          lines: [
            ["narr", "Lò nướng to đùng. Sờ vô: lạnh tanh. Khay nướng sạch bong, còn dán nguyên miếng nilon bảo vệ của nhà sản xuất."],
            ["me", "Lò này chưa bao giờ được bật. Không có cái bánh nào được nướng ở đây sáng nay."],
            ["teo", "Lò mới cứng! Vậy bánh kem từ đâu ra? Bánh tự mọc hả sếp?", "shock"],
          ],
          gives: { clues: ["lo-nuong-lanh"] },
          again: [["me", "Nilon bảo vệ còn nguyên. Không ai nướng gì cả."]],
        },
        {
          id: "tu-lanh-lon",
          label: "Tủ lạnh lớn",
          rect: [780, 80, 160, 380],
          lines: [
            ["narr", "Tủ lạnh hai cánh. Ngăn trên có hai hộp [[kem-tuoi|kem tươi]] mới mua, còn lạnh ngắt. Kẹp dưới hộp là tờ biên lai tạp hoá."],
            ["me", "‘Tạp hoá Cô Năm – 2 hộp kem tươi – 9h22’. Tạp hoá cô Năm ở cuối hẻm, đi bộ năm phút. Ai đó rời bếp lúc khoảng [[9h20]]."],
            ["teo", "Tủ lạnh còn có nồi chè, sương sáo, với… ly trà sữa ghi ‘VY – ĐỪNG UỐNG’. Em không uống đâu chị Vy ơi!", "nervous"],
          ],
          gives: { clues: ["bien-lai-kem"] },
          again: [["teo", "Ly trà sữa chị Vy dán tới ba lớp băng keo. Chị bị ám ảnh vụ cũ ghê.", "smug"]],
        },
        {
          id: "thot-go",
          label: "Thớt gỗ",
          rect: [600, 330, 160, 90],
          lines: [
            ["narr", "Thớt gỗ to, kê bên dưới là một miếng bìa carton gấp đôi cho khỏi trượt. Mở ra: là vỏ hộp giao hàng."],
            ["me", "Nhãn giao hàng: ‘Shop [[my-ky-247|Mỹ Ký 247]] – Hàng: nhẫn làm theo ảnh – Thu hộ: [[350k|350.000đ]] – Người nhận: Anh Hùng – SĐT …729 – Giao [[thu-nam|Thứ Năm]]’."],
            ["chiloan", "Bìa đó tui lượm trong sọt rác nhà này kê thớt. Đừng nhìn tui!", "nervous"],
            ["teo", "Nhẫn làm theo ảnh? Anh Hùng đặt nhẫn cầu hôn ai hả ta? Lãng mạn ghê!", "happy"],
          ],
          gives: { clues: ["bia-my-ky"] },
          again: [["me", "Mỹ Ký 247. Nhẫn làm theo ảnh. Người nhận: Hùng, SĐT đuôi 729."]],
        },
        {
          id: "hop-dung-cu",
          label: "Hộp dụng cụ làm bánh",
          rect: [270, 380, 120, 100],
          lines: [
            ["narr", "Hộp dụng cụ làm bánh của chị Loan: bao bắt kem, đui bắt bông, dao chà láng. Lót dưới đáy hộp là miếng tem dán đã bóc."],
            ["me", "Tem siêu thị: ‘Bánh kem 3 tầng trắng – 450.000đ – In lúc 6h10 sáng nay’. Bánh mua sẵn, về nhà bắt thêm bông kem với gắn chim bồ câu."],
            ["teo", "Ơ… ‘bánh nhà làm, không bao giờ mua sẵn’ đâu rồi chị Loan?", "smug"],
          ],
          gives: { clues: ["tem-sieu-thi"] },
          again: [["teo", "Mà bánh siêu thị cũng ngon mà chị. Em ăn bánh siêu thị lớn lên nè.", "happy"]],
        },
        {
          id: "noi-thit-kho",
          label: "Nồi thịt kho của cô Hai",
          rect: [100, 400, 140, 110],
          lines: [
            ["narr", "Một nồi thịt kho trứng, quai nồi buộc dây thun đỏ. Bên cạnh là tờ giấy: ‘Của cô Hai. Cấm livestream’."],
            ["teo", "Nồi thịt kho huyền thoại! Sếp, vụ đầu tiên của mình đó! Em xúc động quá!", "happy"],
            ["me", "Đừng ăn vụng. Vụ đầu tiên của mình bắt đầu từ đúng chuyện đó."],
          ],
          again: [["teo", "Em chỉ hít thôi. Hít thì không tính là ăn vụng.", "nervous"]],
        },
      ],
    },

    pawnshop: {
      name: "Tiệm cầm đồ đầu chợ",
      scene: "pawnshop",
      start: false,
      intro: [
        ["narr", "Tiệm Cầm Đồ Phát Tài, đầu chợ. Song sắt, tủ kính sáng đèn, con mèo thần tài vẫy tay đều đều. Đối diện bên kia đường là quán cà phê cô Út."],
        ["chusau", "Cầm hay chuộc? …À, thám tử hả. Nghe tiếng rồi. Muốn hỏi gì thì hỏi, mà tiệm tui làm ăn đàng hoàng nha.", "neutral"],
        ["teo", "Sếp ơi, em lần đầu vô tiệm cầm đồ. Em cầm cái điện thoại được bao nhiêu chú?", "happy"],
        ["chusau", "Màn hình bể vậy hả? Hai chục nghìn.", "neutral"],
      ],
      hotspots: [
        {
          id: "quay-cam-do",
          label: "Quầy cầm đồ",
          rect: [280, 260, 400, 160],
          lines: [
            ["narr", "Quầy gỗ có song sắt. Trên quầy là cái cân tiểu ly, kính lúp, bàn tính, và một hũ kẹo me."],
            ["me", "Đưa biên nhận 0473 ra. Chú Sáu đẩy kính lão lên, nheo mắt nhìn."],
            ["chusau", "0473… Cái này tui nhớ. Nhẫn đẹp vậy cả năm mới gặp một lần. Mấu chấu có một cái mẻ, tui còn hỏi ‘sao không đi sửa’. Người cầm nói ‘đồ gia truyền, để vậy’.", "neutral"],
            ["teo", "Chú nhớ đồ giỏi vậy, chú có nhớ mặt người cầm không?", "neutral"],
            ["chusau", "Mặt thì không. Người đó đeo kính đen trong tiệm. Mà cái áo thì tui nhớ, áo hàng hiệu ghi sai chính tả.", "smug"],
          ],
          again: [["chusau", "Ăn kẹo me không? Khách cầm đồ hay buồn, tui để kẹo cho ngọt miệng.", "neutral"]],
        },
        {
          id: "so-cam-do",
          label: "Sổ cầm đồ",
          rect: [430, 300, 120, 60],
          lines: [
            ["narr", "Chú Sáu lật sổ cầm đồ bìa xanh, dò tới số 0473."],
            ["me", "‘0473 – [[thu-ba|Thứ Ba]] tuần trước, 14h05 – Nhẫn vàng chạm rồng mặt ngọc, khắc tay chữ Phúc 1925, mấu chấu thứ ba mẻ – Cầm [[80-trieu|80 triệu]] – Lãi 3%/tháng – SĐT liên hệ …729 – Ký: H.’"],
            ["teo", "SĐT đuôi 729! Sếp, cái bìa hộp Mỹ Ký dưới thớt cũng đuôi 729!", "shock"],
            ["me", "Cùng một người cầm nhẫn thật và đặt làm nhẫn giả."],
          ],
          gives: { clues: ["so-cam-do"] },
          again: [["me", "0473. Thứ Ba, 14h05. 80 triệu. SĐT …729. Ký: H."]],
        },
        {
          id: "tu-kinh",
          label: "Tủ kính",
          rect: [40, 80, 220, 330],
          lines: [
            ["narr", "Tủ kính hàng cầm chờ chuộc. Ngăn giữa, trên miếng nhung đen, có một chiếc nhẫn vàng chạm rồng, mặt ngọc bích xanh thẳm."],
            ["me", "Mấu chấu thứ ba bị mẻ một góc. Y hệt di ảnh bà cố. Bên trong khắc tay chữ ‘Phúc 1925’, nét run run của thợ thời trước."],
            ["teo", "Nhẫn thật đây rồi sếp! Đẹp quá! Nặng trịch, nhìn là thấy khác cái nhẫn trong bánh!", "happy"],
            ["chusau", "Hàng cầm còn hạn chuộc tới cuối tháng. Ai có biên nhận với tiền gốc lãi thì chuộc được.", "neutral"],
          ],
          gives: { clues: ["nhan-that"] },
          again: [["teo", "Em nhìn nhẫn thật xong nhìn lại nhẫn giả, như nhìn ông Bảy với con gà bằng nhựa.", "smug"]],
        },
        {
          id: "camera-tiem",
          label: "Camera tiệm",
          rect: [760, 30, 150, 110],
          lines: [
            ["narr", "Camera gắn góc trần, màn hình nhỏ dưới quầy. Chú Sáu tua lại Thứ Ba tuần trước, 14h03."],
            ["me", "Một người đàn ông bước vô, đeo kính đen, áo khoác in chữ ‘GUCCl’, chữ cuối là chữ L thường. Đặt lên quầy một chiếc nhẫn."],
            ["me", "Lúc ký sổ, anh ta để điện thoại trên quầy. Ốp lưng dán sticker con chó đội mũ phi hành gia, chữ ‘[[moondoge|MoonDoge]] TO THE MOON’."],
            ["teo", "MoonDoge! Đồng tiền ảo anh Hùng suốt ngày rủ cả họ mua đó sếp!", "shock"],
          ],
          gives: { clues: ["camera-tiem-cam-do"] },
          again: [["me", "Thứ Ba, 14h05. Áo GUCCl chữ L thường. Ốp điện thoại MoonDoge."]],
        },
        {
          id: "meo-than-tai",
          label: "Mèo thần tài",
          rect: [700, 200, 80, 100],
          lines: [
            ["narr", "Con mèo thần tài vẫy tay, pin sắp hết nên vẫy chậm như đang chào tạm biệt."],
            ["teo", "Mèo ơi, phù hộ cho anh Hùng chuộc được nhẫn. À mà khoan, chưa chắc là anh Hùng.", "nervous"],
            ["me", "Đang tiến bộ đó Tèo. Không kết luận trước bằng chứng."],
          ],
          again: [["teo", "Nó vẫy chậm quá. Em thay pin giùm nha chú Sáu?", "happy"]],
        },
        {
          id: "bang-lai-suat",
          label: "Bảng lãi suất",
          rect: [700, 320, 200, 120],
          lines: [
            ["narr", "Bảng lãi suất viết phấn: ‘Vàng 3%/tháng. Điện thoại 5%/tháng. Xe máy 4%/tháng. Không nhận: tình cảm, lời hứa, tiền ảo’."],
            ["teo", "‘Không nhận tiền ảo’… Chú Sáu biết trước hết rồi.", "smug"],
          ],
          again: [["chusau", "Tuần nào cũng có người đem ví tiền ảo tới đòi cầm. Tui nói đem vàng thiệt tới đây.", "neutral"]],
        },
      ],
    },
  },

  clues: {
    "anh-ba-co": {
      name: "Di ảnh bà cố đeo nhẫn",
      desc: "Ảnh chụp năm 1960: nhẫn vàng chạm rồng, mặt ngọc bích, [[mau-chau|mấu chấu]] thứ ba bị mẻ một góc từ năm 1968.",
    },
    "nuoc-bac-ha": {
      name: "Nước súng Bé Ti",
      desc: "Nước văng trên khay trầu cau: xanh lá, thơm [[nuoc-bac-ha|siro bạc hà]], khô thì dính tay. Bé Ti bắn trúng khay nhẫn lúc [[9h15]].",
    },
    "vun-ma-vang": {
      name: "Vụn mạ trong hộp nhẫn",
      desc: "Vụn [[vun-ma|nhũ vàng]] bong ra như sơn, nằm sâu trong khe nệm [[hop-nhan|hộp nhẫn]]. Vàng thật không bong. Chiếc nhẫn nằm trong hộp những ngày qua là đồ mạ.",
    },
    "ao-guci": {
      name: "Áo khoác ‘GUCCl’ ướt",
      desc: "Áo khoác ghi ‘GUCCl’ (chữ L thường) vắt trên sofa, ướt tay áo và vạt trước, phai [[mau-ao|màu xanh lam]] ra nệm. Áo của [[anhhung|anh Hùng]].",
    },
    "vet-xanh-banh": {
      name: "Vết xanh trên bánh kem",
      desc: "Lỗ chọc ở tầng hai [[banh-kem|bánh kem]], trét kem lại vội. Quanh lỗ có vệt xanh lam, không mùi, kẹt một sợi vải.",
    },
    "nhan-trong-banh": {
      name: "Nhẫn tìm thấy trong bánh kem",
      desc: "Nhẫn vàng mặt ngọc lăn ra khi cắt [[banh-kem|bánh kem]] ngay chỗ vết xanh. Cầm lên thấy hơi nhẹ tay.",
      detail: [["teo", "Nhẫn nhẹ ghê sếp. Chắc tại em quen cầm cục sạc dự phòng."]],
    },
    "nhan-gia": {
      name: "Kết quả thẩm định: nhẫn giả",
      desc: "Dì Ba soi: vàng mạ, ngọc thuỷ tinh, chữ ‘PHUC 1925’ khắc máy. Bốn [[mau-chau|mấu chấu]] nguyên vẹn, không mẻ. Mặt trong có dấu dập ‘[[my-ky-247|MK-247]]’.",
    },
    "bien-lai-kem": {
      name: "Biên lai mua kem tươi",
      desc: "‘Tạp hoá Cô Năm – 2 hộp [[kem-tuoi|kem tươi]] – 9h22’. Tạp hoá ở cuối hẻm, người mua rời bếp khoảng [[9h20]].",
    },
    "lo-nuong-lanh": {
      name: "Lò nướng chưa từng bật",
      desc: "Lò nướng lạnh tanh, khay còn dán nilon bảo vệ. Sáng nay không có bánh nào được nướng trong bếp này.",
    },
    "tem-sieu-thi": {
      name: "Tem bánh siêu thị",
      desc: "Tem đã bóc trong hộp dụng cụ của chị Loan: ‘Bánh kem 3 tầng trắng – 450.000đ – 6h10 sáng nay’.",
    },
    "bia-my-ky": {
      name: "Vỏ hộp giao hàng Mỹ Ký 247",
      desc: "Kê dưới thớt: ‘Shop [[my-ky-247|Mỹ Ký 247]] – nhẫn làm theo ảnh – [[350k|350.000đ]] – Người nhận: Anh Hùng – SĐT …729 – giao [[thu-nam|Thứ Năm]]’.",
    },
    "clip-mit-dam-hoi": {
      name: "Clip live của Bé Mít lúc 9h15",
      desc: "Live ‘không kịch bản’ của Bé Mít: [[9h15]] đồng hồ đổ chuông, Bé Ti bắn súng nước. Người bị bắn ướt nhẹp đứng sát khay trầu cau là [[anhhung|anh Hùng]], áo GUCCl. Không phải ở cửa.",
    },
    "soi-mau-xanh": {
      name: "So ba vệt xanh",
      desc: "Vệt trên bánh khớp với [[mau-ao|màu áo GUCCl phai]]: xanh lam, không mùi, cùng sợi vải. Không khớp nước bạc hà của Bé Ti. Người chọc nhẫn vô bánh có tay dính màu áo của [[anhhung|anh Hùng]].",
    },
    "giay-nhac-ong-noi": {
      name: "Giấy nhắc trong tủ thờ",
      desc: "Chữ ông Cả: ‘[[thu-ba|Thứ Ba]]: đưa [[chia-khoa|chìa khoá]] tủ thờ cho thằng Hùng lau bàn thờ. NHỚ LẤY LẠI’.",
    },
    "vong-tay-diba": {
      name: "Vòng tay dưới gầm sofa",
      desc: "Vòng ‘vàng’ to bản, nhẹ hều, mặt trong dập dấu ‘[[my-ky-247|MK-247]]’, cùng dấu với nhẫn giả. Móc khoá bung.",
    },
    "bien-nhan-cam-do": {
      name: "Biên nhận cầm đồ 0473",
      desc: "Giấu dưới đáy hộp quả lắc: [[bien-nhan|biên nhận]] số 0473, [[tiem-cam-do|Tiệm Cầm Đồ Phát Tài]], món hàng ‘nhẫn vàng mặt ngọc’. Nửa có tên bị xé.",
    },
    "so-cam-do": {
      name: "Sổ cầm đồ số 0473",
      desc: "[[thu-ba|Thứ Ba]] 14h05: nhẫn chạm rồng mặt ngọc, khắc tay Phúc 1925, mấu chấu thứ ba mẻ. Cầm [[80-trieu|80 triệu]]. SĐT …729. Ký: H.",
    },
    "nhan-that": {
      name: "Nhẫn thật trong tủ kính",
      desc: "Nhẫn chạm rồng, mặt ngọc bích, [[mau-chau|mấu chấu]] thứ ba mẻ y hệt di ảnh bà cố, khắc tay ‘Phúc 1925’. Đang nằm ở [[tiem-cam-do|tiệm cầm đồ]].",
    },
    "camera-tiem-cam-do": {
      name: "Camera tiệm cầm đồ",
      desc: "[[thu-ba|Thứ Ba]] 14h05: người đeo kính đen, áo ‘GUCCl’ chữ L thường, ốp điện thoại dán sticker [[moondoge|MoonDoge]], đặt nhẫn lên quầy.",
    },
  },

  words: {
    // ai
    ongnoi: { text: "ông Cả", kind: "ai" },
    diba: { text: "dì Ba", kind: "ai" },
    anhhung: { text: "anh Hùng", kind: "ai" },
    chiloan: { text: "chị Loan", kind: "ai" },
    beti: { text: "Bé Ti", kind: "ai" },
    // lúc
    "8h30": { text: "8h30", kind: "luc" },
    "9h15": { text: "9h15", kind: "luc" },
    "9h20": { text: "9h20", kind: "luc" },
    "9h25": { text: "9h25", kind: "luc" },
    "thu-ba": { text: "Thứ Ba tuần trước", kind: "luc" },
    "thu-nam": { text: "Thứ Năm tuần trước", kind: "luc" },
    // vật
    "banh-kem": { text: "bánh kem", kind: "vat" },
    "nuoc-bac-ha": { text: "nước siro bạc hà", kind: "vat" },
    "mau-ao": { text: "màu áo GUCCl phai", kind: "vat" },
    "kem-tuoi": { text: "kem tươi", kind: "vat" },
    "chia-khoa": { text: "chìa khoá tủ thờ", kind: "vat" },
    "hop-nhan": { text: "hộp nhẫn", kind: "vat" },
    "vun-ma": { text: "vụn mạ vàng", kind: "vat" },
    "mau-chau": { text: "mấu chấu", kind: "vat" },
    "bien-nhan": { text: "biên nhận cầm đồ", kind: "vat" },
    // nơi
    "tiem-cam-do": { text: "tiệm cầm đồ đầu chợ", kind: "o" },
    "tu-tho": { text: "tủ thờ", kind: "o" },
    "khay-trau": { text: "khay trầu cau", kind: "o" },
    "hop-qua-lac": { text: "hộp quả lắc", kind: "o" },
    // khác
    "80-trieu": { text: "80 triệu", kind: "khac" },
    "my-ky-247": { text: "Mỹ Ký 247", kind: "khac" },
    "350k": { text: "350 nghìn", kind: "khac" },
    moondoge: { text: "MoonDoge", kind: "khac" },
    // vì
    "go-lo": { text: "gỡ lỗ tiền ảo", kind: "vi" },
    "tham-vang": { text: "tham vàng", kind: "vi" },
    "nghich-pha": { text: "nghịch phá", kind: "vi" },
    "so-mat-mat": { text: "sợ mất mặt", kind: "vi" },
    "so-bi-che-gia": { text: "sợ bị chê lẩm cẩm", kind: "vi" },
  },

  talks: {
    ongnoi: [
      {
        id: "nhan",
        topic: "Ông kể về chiếc nhẫn",
        lines: [
          ["ongnoi", "Nhẫn của má tui. Má tui đeo từ hồi về làm dâu năm 1925. Đói mấy cũng không bán. Má dặn: nhẫn này truyền cho dâu trưởng của cháu đích tôn.", "neutral"],
          ["ongnoi", "Sáng nay [[8h30]] tui mở tủ thờ, lấy hộp nhẫn đặt lên [[khay-trau|khay trầu cau]] cho hai họ coi. Tui nhìn thấy nó sáng lấp lánh trong hộp, tui mừng muốn khóc.", "happy"],
          ["teo", "Ông có cầm lên coi kỹ không ông?", "neutral"],
          ["ongnoi", "Mắt tui kém rồi con. Thấy nó vàng vàng, có cục xanh xanh là mừng rồi.", "neutral"],
        ],
        gives: { words: ["ongnoi"] },
      },
      {
        id: "chia-khoa",
        topic: "Chìa khoá tủ thờ ai giữ?",
        lines: [
          ["ongnoi", "Tui giữ. Đeo ở thắt lưng, ngủ cũng đeo. Mấy chục năm nay chưa đưa ai bao giờ.", "smug"],
          ["ongnoi", "Đừng nghĩ tui già mà lẩm cẩm nha. Tui nhớ hết. Tui nhớ cả năm sinh của từng đứa cháu.", "angry"],
          ["teo", "Vậy năm sinh của con là năm nào ông?", "neutral"],
          ["ongnoi", "Mày là… thằng cháu nhà ai?", "neutral"],
        ],
        gives: { stmts: ["ongnoi-giu-chia"] },
      },
      {
        id: "dang-nghi",
        topic: "Ông nghi ai?",
        lines: [
          ["ongnoi", "Tui không muốn nghi ai. Nhưng bà dì bên đàng gái hỏi giá cái nhẫn trước mặt cả họ. Đám hỏi mà hỏi giá nhẫn, tui nghe không lọt tai.", "angry"],
          ["ongnoi", "Còn thằng Hùng cháu tui, nó sống chung nhà, nó lo cho tui lắm. Nó không làm gì đâu.", "neutral"],
        ],
      },
      {
        id: "co-tuong",
        topic: "Ông hay làm gì buổi tối?",
        lines: [
          ["ongnoi", "Đánh cờ tướng trên mạng. Nick ‘Lão Tướng 1945’. Tuần rồi thua thằng nhỏ mười tuổi bảy ván liền.", "nervous"],
          ["ongnoi", "Đừng nói với tụi nhỏ trong nhà nha. Tụi nó tưởng tui là kỳ thủ vô địch phường.", "nervous"],
          ["teo", "Ông ơi, con cũng thua thằng nhỏ đó! Nick nó là ‘Bin Không Ngủ’ phải không?", "shock"],
        ],
      },
      {
        id: "thu-ba",
        topic: "Thứ Ba tuần trước, anh Hùng lau bàn thờ thế nào?",
        needs: "broke:ongnoi-giu-chia",
        lines: [
          ["ongnoi", "Nó lau kỹ lắm. Lau từ trưa tới gần một giờ. Rồi nó nói ra chợ mua nhang, đi tới chiều mới về.", "neutral"],
          ["ongnoi", "Chìa khoá thì tối đó tui thấy nằm trên bàn nước. Tui tưởng tui để quên. Tui đeo lại vô thắt lưng, không nói ai.", "nervous"],
          ["teo", "Đi mua nhang từ trưa tới chiều… nhang ở chợ chắc phải xếp hàng dữ lắm.", "neutral"],
        ],
      },
    ],

    diba: [
      {
        id: "hoi-gia",
        topic: "Sao dì hỏi giá cái nhẫn?",
        lines: [
          ["diba", "Trời ơi, hỏi chơi thôi mà! Nhẫn đẹp vậy, ai không hỏi? Dì đeo vàng ba chục năm, dì mê vàng chớ đâu có tham vàng!", "angry"],
          ["diba", "Dì còn nói với ông Cả là lát làm lễ xong dì coi kỹ cho, dì nhìn là biết tuổi vàng liền. Vậy mà giờ cả họ nhìn dì như ăn trộm.", "angry"],
          ["me", "Dì nói câu ‘lát coi kỹ’ lúc mấy giờ, trước mặt ai?"],
          ["diba", "Chừng 8h45. Nói lớn lắm, cả phòng khách nghe. Thằng Hùng còn đứng kế bên, nó cười cười.", "neutral"],
        ],
        gives: { words: ["diba", "tham-vang"] },
      },
      {
        id: "vang-tay",
        topic: "Vàng trên tay dì",
        lines: [
          ["diba", "Thấy chưa? Hai tay mười hai chiếc, vàng 24k hết! Dì đeo đi chợ, đeo đi đám, đeo đi ngủ!", "smug"],
          ["diba", "Người ta nói dì đeo vàng nhiều vậy thì cần gì ăn trộm cái nhẫn. Đúng không?", "smug"],
          ["teo", "Dì đeo nhiều vậy không mỏi tay hả dì?", "neutral"],
          ["diba", "Nhẹ hều à con. Ờ… ý dì là quen rồi.", "nervous"],
        ],
        gives: { stmts: ["diba-vang-that"] },
      },
      {
        id: "tham-dinh",
        topic: "Nhờ dì Ba thẩm định chiếc nhẫn tìm thấy",
        needs: "flag:tim-thay-nhan",
        lines: [
          ["diba", "Đưa dì coi. Dì coi kỹ cho cả họ an tâm.", "smug"],
          ["narr", "Dì Ba đeo kính, lật chiếc nhẫn dưới đèn. Ba giây. Năm giây. Mặt dì đổi màu."],
          ["diba", "…Nhẹ quá. Cạ nhẹ vô răng thì trầy, lộ màu đồng. Ngọc này là thuỷ tinh, soi đèn thấy bọt khí.", "shock"],
          ["diba", "Bên trong khắc ‘PHUC 1925’ bằng máy, nét đều tăm tắp. Bốn mấu chấu nguyên, không có cái nào mẻ. Còn đây, dấu dập ‘MK-247’.", "shock"],
          ["diba", "ĐÂY LÀ NHẪN GIẢ! Mạ vàng! Hàng mỹ ký ba trăm mấy nghìn!", "shock"],
          ["narr", "Cả phòng khách im phăng phắc. Bà Tư đang gõ dở bài đăng ‘ĐÃ TÌM THẤY NHẪN’, ngón tay khựng lại giữa không trung."],
          ["teo", "Ủa… vậy là… phá án chưa xong hả sếp?", "shock"],
          ["me", "Chưa. Bây giờ mới bắt đầu. Có người tráo nhẫn thật từ trước, và cái màn ‘tìm thấy trong bánh kem’ là để cả nhà mừng quá mà quên soi."],
          ["me", "Mà dì Ba, sao dì nhận ra dấu MK-247 nhanh vậy?"],
          ["diba", "Thì… thì dì coi trên mạng! Dì rành mà!", "nervous"],
        ],
        gives: { clues: ["nhan-gia"], flags: ["nhan-gia"] },
      },
      {
        id: "my-ky",
        topic: "Shop Mỹ Ký 247 làm gì?",
        needs: "broke:diba-vang-that",
        lines: [
          ["diba", "Shop 247 bán online, dì mua mười mấy năm rồi. Đồ y như thật, đeo không ai biết. Có dịch vụ ‘làm theo ảnh’: gửi hình món vàng nào, ba ngày sau có bản mạ y chang, ba trăm rưỡi nghìn.", "nervous"],
          ["diba", "Ai mà gửi ảnh chiếc nhẫn này cho shop, thì người đó phải có ảnh chụp cận cảnh, chụp kỹ từng mấu chấu. Mà nhẫn khoá trong tủ thờ, người ngoài đâu có chụp được.", "neutral"],
          ["me", "Chỉ người mở được tủ thờ mới chụp được. Hay lắm, dì Ba."],
        ],
      },
    ],

    anhhung: [
      {
        id: "luc-mat",
        topic: "Lúc nhẫn mất anh ở đâu?",
        lines: [
          ["anhhung", "Lúc 9h15 hả? Tui đứng ở cửa đón khách. Cách khay trầu cau cả chục mét. Đồng hồ đổ chuông là tui đang bắt tay ông Bảy.", "smug"],
          ["anhhung", "Thằng Ti nó bắn nước loạn xạ, may mà tui đứng xa, không dính giọt nào.", "smug"],
          ["teo", "Anh mặc áo thun trắng đẹp ghê. Hồi sáng em thấy anh mặc áo khoác mà?", "neutral"],
          ["anhhung", "Nóng quá nên cởi. Hỏi chi vậy?", "nervous"],
        ],
        gives: { stmts: ["hung-o-cua"], words: ["anhhung"] },
      },
      {
        id: "tien-ao",
        topic: "Dạo này anh làm ăn sao?",
        lines: [
          ["anhhung", "Tui đầu tư coin. [[moondoge|MoonDoge]]. Đang ‘tích luỹ’, sắp ‘to the moon’ rồi. Ai lên thuyền bây giờ là đổi đời.", "smug"],
          ["anhhung", "Hiện tại thì nó đang… điều chỉnh. Giảm 94%. Nhưng mà điều chỉnh lành mạnh!", "nervous"],
          ["teo", "Giảm 94% mà lành mạnh hả anh? Vậy chắc nó khoẻ lắm.", "neutral"],
          ["anhhung", "Mày không hiểu đâu. Người giàu là người dám gồng lỗ.", "angry"],
        ],
      },
      {
        id: "sau-tim-thay",
        topic: "Nhẫn tìm thấy trong bánh, anh nghĩ sao?",
        needs: "flag:tim-thay-nhan",
        lines: [
          ["anhhung", "Thì Bé Ti nghịch chứ sao! Tui thấy nó chạy vô bếp mà. Con nít, thấy đồ sáng sáng là chụp, rồi giấu vô bánh cho vui.", "smug"],
          ["anhhung", "Thôi tìm thấy rồi, bỏ qua đi. Đám hỏi mà, vui là chính. Cất nhẫn vô tủ đi ông nội, khỏi coi tới coi lui.", "nervous"],
        ],
        gives: { stmts: ["hung-thay-beti"], words: ["nghich-pha"] },
      },
      {
        id: "cam-do",
        topic: "Anh có từng vô tiệm cầm đồ đầu chợ không?",
        needs: "loc:pawnshop",
        lines: [
          ["anhhung", "Tiệm cầm đồ? Tui? Tui là nhà đầu tư, đâu có cần cầm đồ. Cả đời tui chưa bước chân vô tiệm cầm đồ nào hết.", "angry"],
          ["anhhung", "Biên nhận gì? Ai làm rớt trong nhà thì biết đâu. Nhà này khách ra vô suốt.", "nervous"],
        ],
        gives: { stmts: ["hung-chua-cam-do"] },
      },
      {
        id: "ao-khoac",
        topic: "Cái áo khoác GUCCl",
        needs: "seen:livingroom.bo-sofa",
        lines: [
          ["anhhung", "Hàng hiệu đó. Mua bên Ý. Ý… Ý Lan, chợ đêm Ý Lan. Mà hàng hiệu thật nha!", "nervous"],
          ["teo", "Hàng hiệu thật mà chữ L hả anh?", "smug"],
          ["anhhung", "Đó là bản giới hạn! Chữ L là ‘Limited’!", "angry"],
        ],
      },
    ],

    chiloan: [
      {
        id: "banh",
        topic: "Bánh kem chị làm sao?",
        lines: [
          ["chiloan", "Bánh nhà làm một trăm phần trăm! Tui dậy từ 5h sáng, nướng từng tầng, đánh từng chén kem. Tui không bao giờ mua bánh sẵn!", "smug"],
          ["teo", "Chị giỏi ghê! Lò nướng nhà ông Cả xài ngon không chị?", "happy"],
          ["chiloan", "Ngon! Ngon lắm! Nóng đều!", "nervous"],
        ],
        gives: { stmts: ["chiloan-tu-nuong"], words: ["chiloan"] },
      },
      {
        id: "roi-bep",
        topic: "Sáng nay chị có rời bếp không?",
        lines: [
          ["chiloan", "Không! Tui canh bếp như canh vàng. Từ sáng tới giờ không rời nửa bước. Không ai vô được bếp của tui.", "angry"],
          ["chiloan", "Mà có ai vô thì tui cũng thấy liền. Tui có mắt sau gáy.", "smug"],
        ],
        gives: { stmts: ["chiloan-khong-roi-bep"] },
      },
      {
        id: "nghe-bep",
        topic: "Chị nấu cỗ lâu chưa?",
        lines: [
          ["chiloan", "Hai mươi năm. Nấu cỗ cưới, cỗ hỏi, cỗ giỗ. Món nào cũng làm được, trừ… trừ bánh kem. Ý tui là làm được hết!", "nervous"],
          ["chiloan", "Đám nào cũng có người đòi bánh kem ba tầng. Mà nướng bánh ba tầng thì cực lắm. Thôi không nói nữa.", "nervous"],
        ],
      },
      {
        id: "ai-biet",
        topic: "Ai biết chị đi mua kem tươi?",
        needs: "broke:chiloan-khong-roi-bep",
        lines: [
          ["chiloan", "Lúc 9h18 tui đứng cửa bếp than ‘thiếu kem tươi rồi’. Có thằng cha áo khoác chữ to to đi ngang, còn chỉ đường: ‘Tạp hoá cô Năm cuối hẻm đó chị, đi lẹ đi, tui coi bếp cho’.", "nervous"],
          ["chiloan", "Mà áo nó ướt nhẹp, tay nó cứ giấu trong túi áo. Tui tưởng nó lạnh.", "neutral"],
          ["teo", "Người đó ‘coi bếp’ giùm chị… coi kỹ quá luôn.", "smug"],
        ],
      },
    ],

    beti: [
      {
        id: "sung-nuoc",
        topic: "Lúc 9h15 con bắn súng nước ai?",
        lines: [
          ["beti", "Con hông có bắn ai hết! Con bắn cây kiểng! Cây kiểng khát nước!", "angry"],
          ["beti", "Má con nói bắn người là hư. Con không hư.", "nervous"],
        ],
        gives: { stmts: ["beti-ban-cay"], words: ["beti"] },
      },
      {
        id: "nhan",
        topic: "Con có lấy nhẫn không?",
        lines: [
          ["beti", "Hông! Nhẫn đó của ông cố. Ông cố nói ai lấy nhẫn thì tối ông cố về nhéo tai.", "shock"],
          ["teo", "Ông cố là ông nội của ông nội hả bé?", "neutral"],
          ["beti", "Hông biết. Mà ổng nhéo đau lắm.", "nervous"],
        ],
      },
      {
        id: "dien-thoai-chu",
        topic: "Con có hay chơi điện thoại của ai không?",
        lines: [
          ["beti", "Điện thoại chú Hùng! Chú cho con chơi game bắn gà. Mà tuần trước con mở ra thấy toàn hình cái nhẫn của ông cố, chụp gần xịt, chụp cả chục tấm.", "happy"],
          ["beti", "Con hỏi chú chụp chi, chú giựt lại điện thoại, nói ‘con nít biết gì’. Từ đó chú hổng cho con chơi nữa.", "angry"],
          ["teo", "Sếp… chụp cận cảnh cái nhẫn cả chục tấm… để làm gì ta?", "nervous"],
        ],
      },
      {
        id: "tay-chu",
        topic: "Lúc con bắn, tay chú Hùng đang làm gì?",
        needs: "broke:beti-ban-cay",
        lines: [
          ["beti", "Tay chú thò vô hộp nhẫn. Con bắn trúng, chú rụt tay lại, nắm chặt cái gì trong tay rồi chạy.", "neutral"],
          ["beti", "Con tưởng chú lấy kẹo. Hồi đó chú hay giấu kẹo, chú còn chỉ con chỗ giấu trong cái đồng hồ to to.", "happy"],
          ["teo", "Cái đồng hồ to to… sếp ơi, đồng hồ quả lắc!", "shock"],
        ],
      },
    ],

    khang: [
      {
        id: "ke-lai",
        topic: "Kể lại buổi lễ",
        lines: [
          ["khang", "8h30 ông nội lấy hộp nhẫn đặt lên khay. 8h45 dì Ba nói lớn là lát dì coi kỹ tuổi vàng. Em thấy anh Hùng tái mặt, em tưởng ảnh lo dì Ba làm ông nội phật lòng.", "nervous"],
          ["khang", "9h15 đồng hồ đổ chuông, bé Ti bắn súng nước. Có ai la oai oái, mọi người xúm lại lau. Chừng một phút sau quay lại thì hộp trống.", "nervous"],
        ],
      },
      {
        id: "anh-hung",
        topic: "Anh Hùng là người thế nào?",
        lines: [
          ["khang", "Anh Hùng sống với ông nội từ nhỏ. Hồi nhỏ ảnh hay giấu kẹo trong [[hop-qua-lac|hộp quả lắc]] của cái đồng hồ, ông nội biết mà làm lơ.", "happy"],
          ["khang", "Hai năm nay ảnh mê tiền ảo, rủ cả họ mua. Em không mua. Ảnh giận em ba tháng.", "nervous"],
        ],
      },
    ],

    ngoc: [
      {
        id: "di-ba",
        topic: "Dì Ba của em",
        lines: [
          ["ngoc", "Dì em nói nhiều chứ không có ý xấu. Dì thương em nhất nhà. Mà dì… hơi sĩ diện chuyện vàng bạc.", "nervous"],
          ["ngoc", "Hồi nhỏ em hỏi sao dì đeo vàng nhiều mà không sợ cướp, dì nói ‘cướp lấy thì dì mừng’. Em không hiểu.", "neutral"],
        ],
      },
      {
        id: "nhan",
        topic: "Em nghĩ sao về chiếc nhẫn?",
        lines: [
          ["ngoc", "Em không cần nhẫn vàng gì hết. Em chỉ sợ ông nội buồn. Ông nói tới cái nhẫn là ông khóc.", "nervous"],
        ],
      },
    ],

    cohai: [
      {
        id: "thay-gi",
        topic: "Cô Hai thấy gì lúc 9h15?",
        lines: [
          ["cohai", "Tui ngồi gần khay trầu cau nhất. Đồng hồ đổ chuông [[9h15]], thằng Ti bắn súng nước. Tui lo ôm nồi thịt kho. Lần trước mất nồi một lần rồi, lần này tui ôm chặt.", "nervous"],
          ["cohai", "Có một thằng mặc áo khoác chữ to to bị bắn trúng, đứng sát khay luôn. Nó la ‘áo hiệu của tao!’ rồi chạy tuốt vô bếp.", "neutral"],
          ["teo", "Cô Hai ơi, nồi thịt kho có ai đụng không cô?", "neutral"],
          ["cohai", "Thằng Tèo mà đụng là cô biết liền.", "angry"],
        ],
      },
    ],

    linh: [
      {
        id: "quay-bep",
        topic: "Linh có quay gì trong bếp không?",
        lines: [
          ["linh", "Em quay món ăn đám hỏi, toàn món của bếp, em xin phép đàng hoàng rồi. Lần này em không mượn nồi của ai hết nha.", "nervous"],
          ["linh", "Khoảng [[9h20]] em thấy chị Loan cầm ví chạy ra cửa sau, mặt hớt hải. Bếp vắng tanh luôn.", "neutral"],
          ["linh", "Rồi chừng [[9h25]] em thấy anh mặc áo thun trắng đi vô bếp, tay xanh lè như mới nhúng mực. Em tưởng ảnh rửa tay.", "neutral"],
        ],
      },
    ],

    ongbay: [
      {
        id: "chien-than",
        topic: "Ông Bảy đem gà tới đám hỏi làm chi?",
        lines: [
          ["ongbay", "Chiến Thần là bùa may của tui. Đi đâu cũng đem. Hồi nãy nó gáy một tiếng ngay lúc thằng Hùng đi ngang qua lồng.", "smug"],
          ["ongbay", "Gà chọi nó biết người gian đó thám tử. Hồi đó tui nghi oan thằng Tám, Chiến Thần không gáy. Giờ nó gáy.", "smug"],
          ["teo", "Ông ơi, gà gáy là bằng chứng hả ông?", "neutral"],
          ["me", "Không, Tèo."],
        ],
      },
    ],

    bin: [
      {
        id: "dau-dai-hoc",
        topic: "Bin đậu đại học rồi hả?",
        lines: [
          ["bin", "Dạ, con đậu Bách Khoa rồi chú. Nhờ hết gà gáy. Mà giờ con lại nhớ tiếng gà gáy, ông nội con cười quá trời.", "happy"],
          ["bin", "Hồi nãy con thấy anh Hùng lấy khăn giấy chùi tay trong nhà vệ sinh, tay ảnh xanh lè. Khăn giấy trong sọt cũng xanh luôn.", "neutral"],
        ],
      },
    ],

    vy: [
      {
        id: "tien-ao",
        topic: "Chị Vy có quen anh Hùng không?",
        lines: [
          ["vy", "Quen sơ sơ. Tháng trước ảnh nhắn tin rủ tui đầu tư MoonDoge, hứa lời 300% một tháng. Tui là trưởng phòng, tui đọc báo cáo tài chính, tui block luôn.", "smug"],
          ["vy", "Tuần trước nghe nói ảnh nợ tới tám chục triệu, bị đòi ráo riết. Ảnh còn hỏi mượn tui. Tui nói tui chỉ cho mượn trà sữa, mà trà sữa cũng phải ghi tên.", "neutral"],
        ],
        gives: { words: ["go-lo"] },
      },
    ],

    cout: [
      {
        id: "quan-dau-cho",
        topic: "Quán cô Út ở đối diện tiệm cầm đồ?",
        needs: "loc:pawnshop",
        lines: [
          ["cout", "Ừ, quán tui ngó qua là thấy tiệm chú Sáu. Ngồi bán cà phê, ai ra vô tiệm cầm đồ tui biết hết. Mà tui không nói đâu, kinh doanh phải giữ chữ tín.", "smug"],
          ["cout", "…Thôi nói nhỏ. Thứ Ba tuần trước, chừng 2 giờ chiều, có một người đeo kính đen mặc áo GUCCl chữ L ghé quán tui trước, gọi ly bạc xỉu, ngồi run run mười phút rồi mới qua tiệm chú Sáu.", "neutral"],
          ["cout", "Áo đó chợ đêm 120 nghìn, tui cũng có một cái. Nhưng tui không đeo kính đen trong nhà.", "smug"],
        ],
      },
      {
        id: "wifi",
        topic: "Dạo này quán sao rồi cô Út?",
        lines: [
          ["cout", "Đàng hoàng rồi. Không cắt cáp ai nữa. Cả hẻm xài wifi quán tui miễn phí, coi như trả nợ cái đêm chung kết.", "happy"],
          ["teo", "Wifi tên gì vậy cô?", "neutral"],
          ["cout", "‘UtXinLoiCaHem’. Mật khẩu ‘khongcatnua’.", "nervous"],
        ],
      },
    ],

    bemit: [
      {
        id: "clip",
        topic: "Cho coi lại live lúc 9h15",
        lines: [
          ["bemit", "Dạ đây, Mít tua lại liền. Live thật, không cắt ghép, không kịch bản, Mít thề trên cây gậy selfie.", "nervous"],
          ["narr", "Trên màn hình: 9h15, đồng hồ đổ chuông. Bé Ti giơ súng bắn một tràng. Người lãnh trọn tia nước là một anh mặc áo khoác ‘GUCCl’, đứng sát ngay khay trầu cau, tay còn đang chống lên mép khay."],
          ["bemit", "Đó là anh Hùng đó anh. Ảnh la ‘áo hiệu của tao’ quá trời, Mít còn tưởng ảnh muốn lên hình.", "neutral"],
          ["teo", "Chị Mít lần này có ích ghê! Em follow chị lại nha!", "happy"],
        ],
        gives: { clues: ["clip-mit-dam-hoi"] },
      },
      {
        id: "song-that",
        topic: "Kênh của Mít dạo này sao rồi?",
        lines: [
          ["bemit", "Từ hồi xin lỗi, Mít live thật hết. Lượt xem ít hơn nhưng bình luận dễ thương hơn. Nhãn hàng còn tăng hợp đồng.", "happy"],
          ["bemit", "Thảo với Quân cũng tới đó anh, ngồi bàn trong. Tụi nó dặn Mít lần này mà dàn dựng là tuyệt giao.", "nervous"],
        ],
      },
    ],

    chusau: [
      {
        id: "khach",
        topic: "Chú có nhớ người cầm nhẫn 0473?",
        lines: [
          ["chusau", "Tui nhớ món đồ, không nhớ mặt. Người đó đeo kính đen, nói nhỏ, ký sổ có một chữ ‘H’. Tui hỏi tên đầy đủ, nói ‘ghi H được rồi chú’.", "neutral"],
          ["chusau", "Mà ổng dặn kỹ lắm: ‘Cuối tháng tui chuộc, đừng bán nha chú, đồ gia truyền’. Mặt ổng lúc đó buồn thiệt.", "nervous"],
        ],
      },
      {
        id: "chuoc",
        topic: "Muốn chuộc thì sao?",
        lines: [
          ["chusau", "Có biên nhận, đóng gốc tám chục triệu với lãi là chuộc được. Tui làm ăn có chữ tín, đồ gia truyền tui giữ kỹ lắm.", "neutral"],
          ["chusau", "Mà nói thiệt, tui mong người ta chuộc. Nhẫn có cái mẻ là có câu chuyện. Đồ có câu chuyện thì không nên nằm trong tủ kính tiệm tui.", "neutral"],
        ],
      },
    ],
  },

  stmts: {
    "hung-o-cua": {
      by: "anhhung",
      text: "Lúc 9h15 tui đứng ở cửa đón khách, cách khay trầu cau cả chục mét, không dính giọt nước nào.",
      break: {
        clue: "clip-mit-dam-hoi",
        lines: [
          ["me", "Live của Bé Mít lúc 9h15: người lãnh trọn tia nước của Bé Ti là anh, áo GUCCl, tay chống lên mép khay trầu cau. Không phải ở cửa."],
          ["anhhung", "…Ờ thì… tui có đi vô trong chút xíu. Để coi nhẫn cho kỹ. Ai mà chẳng muốn coi nhẫn gia truyền!", "shock"],
          ["anhhung", "Rồi bị thằng Ti bắn ướt nhẹp, tui chạy vô bếp lau áo. Vậy thôi. Ướt áo là có tội hả?", "angry"],
          ["teo", "Áo ướt mà cởi ra vắt sofa, giờ anh mặc áo thun trắng. Vậy là anh nói dối vụ đứng cửa rồi đó anh.", "smug"],
        ],
      },
    },
    "hung-thay-beti": {
      by: "anhhung",
      text: "Bé Ti nghịch chụp nhẫn chạy vô bếp giấu vô bánh kem. Chính mắt tui thấy.",
      break: {
        clue: "soi-mau-xanh",
        lines: [
          ["me", "Vệt trên bánh là xanh lam, không mùi, có sợi vải. Y hệt vết phai trên áo GUCCl của anh. Nước súng Bé Ti là xanh lá, thơm bạc hà. Người chọc nhẫn vô bánh có bàn tay dính màu áo của anh."],
          ["anhhung", "Tay tui… tay tui dính màu là tại lau áo!", "shock"],
          ["me", "Lau áo xong thì đi chọc bánh kem? Linh thấy anh vô bếp lúc 9h25, tay xanh lè. Bin thấy anh chùi tay trong nhà vệ sinh."],
          ["beti", "Chú Hùng đổ thừa con! Chú xấu xa! Con mách ông cố!", "angry"],
          ["anhhung", "…", "nervous"],
        ],
      },
    },
    "hung-chua-cam-do": {
      by: "anhhung",
      text: "Cả đời tui chưa bước chân vô tiệm cầm đồ nào hết.",
      break: {
        clue: "camera-tiem-cam-do",
        lines: [
          ["me", "Camera tiệm Phát Tài, Thứ Ba tuần trước 14h05: kính đen, áo GUCCl chữ L thường, ốp điện thoại dán sticker MoonDoge. Ký sổ một chữ ‘H’."],
          ["anhhung", "Thiếu gì người mặc áo GUCCl! Chợ đêm bán cả ngàn cái!", "angry"],
          ["teo", "Nhưng người mặc áo GUCCl mà còn dán sticker MoonDoge thì cả hẻm này chỉ có anh thôi anh ơi.", "smug"],
          ["anhhung", "…Tui… tui đi ngang qua thôi.", "nervous"],
        ],
      },
    },
    "ongnoi-giu-chia": {
      by: "ongnoi",
      text: "Chìa khoá tủ thờ tui đeo ở thắt lưng, mấy chục năm chưa đưa ai bao giờ.",
      break: {
        clue: "giay-nhac-ong-noi",
        lines: [
          ["me", "Giấy nhắc trong cánh tủ thờ, chữ ông: ‘Thứ Ba: đưa chìa khoá tủ thờ cho thằng Hùng lau bàn thờ. NHỚ LẤY LẠI’."],
          ["ongnoi", "…Tui… tui quên.", "nervous"],
          ["ongnoi", "Tuần trước thằng Hùng xin lau bàn thờ cho sạch trước đám hỏi. Tui đưa chìa. Tối đó nó trả, mà tui không nhớ nó trả lúc nào. Tui [[so-bi-che-gia|sợ nói ra con cháu chê tui lẩm cẩm]], rồi tụi nó không cho tui giữ chìa khoá nữa.", "nervous"],
          ["ongnoi", "Tui già rồi, thám tử. Cái chìa khoá đó là thứ duy nhất làm tui thấy mình còn là chủ cái nhà này.", "nervous"],
          ["teo", "Ông ơi… con cũng hay quên. Con quên sạc điện thoại hoài. Không sao đâu ông.", "nervous"],
        ],
      },
    },
    "diba-vang-that": {
      by: "diba",
      text: "Mười hai chiếc vòng trên tay dì toàn vàng 24k thật.",
      break: {
        clue: "vong-tay-diba",
        lines: [
          ["me", "Chiếc vòng rớt dưới gầm sofa, móc khoá bung. Mặt trong dập ‘MK-247’, cùng dấu với nhẫn giả. Tay trái dì đang thiếu một chiếc."],
          ["diba", "…Trời ơi. Đưa đây. Đưa đây coi!", "shock"],
          ["diba", "Thôi được! Vàng của dì toàn mỹ ký! Vàng thật dì gửi ngân hàng hết rồi, đeo đồ thật ra đường sợ bị giựt. Ba chục năm nay dì đeo đồ giả cho sang!", "nervous"],
          ["diba", "Nên dì mới nhận ra dấu MK-247 trong một giây. Dì mua shop đó mười mấy năm. Dì không có tráo nhẫn! Dì chỉ [[so-mat-mat|sợ mất mặt]] thôi!", "nervous"],
          ["ngoc", "Dì ơi… thì ra ‘cướp lấy thì dì mừng’ là vậy.", "shock"],
        ],
      },
    },
    "chiloan-tu-nuong": {
      by: "chiloan",
      text: "Bánh nhà làm một trăm phần trăm, tui tự nướng từng tầng từ 5h sáng.",
      break: {
        clue: "tem-sieu-thi",
        lines: [
          ["me", "Tem siêu thị trong hộp dụng cụ của chị: ‘Bánh kem 3 tầng trắng – 450.000đ – 6h10 sáng nay’. Mà lò nướng còn dán nilon."],
          ["chiloan", "…Suỵt! Nói nhỏ thôi! Tui mua bánh siêu thị về bắt bông lại, gắn chim bồ câu. Hai mươi năm nay đám nào cũng vậy!", "shock"],
          ["chiloan", "Nướng bánh ba tầng cực lắm, mà khách đâu có phân biệt được. Tui chỉ giỏi bắt bông kem thôi. Bắt bông thì tui số một!", "nervous"],
          ["teo", "Công nhận bông kem đẹp thiệt chị. Hai con chim bồ câu nhìn như sắp bay.", "happy"],
        ],
      },
    },
    "chiloan-khong-roi-bep": {
      by: "chiloan",
      text: "Từ sáng tới giờ tui không rời bếp nửa bước, không ai vô được bếp.",
      break: {
        clue: "bien-lai-kem",
        lines: [
          ["me", "Biên lai tạp hoá Cô Năm cuối hẻm: hai hộp kem tươi, 9h22. Đi bộ năm phút mỗi chiều. Chị rời bếp khoảng 9h20 tới 9h35."],
          ["chiloan", "Ơ… tại thiếu kem tươi bắt bông! Bánh siêu thị kem mỏng quá… Á, tui lỡ miệng!", "shock"],
          ["chiloan", "Mười lăm phút thôi mà! Ai mà biết có người lẻn vô bếp trong mười lăm phút!", "nervous"],
          ["me", "Người biết chị đi vắng. Hoặc người canh đúng lúc đó."],
        ],
      },
    },
    "beti-ban-cay": {
      by: "beti",
      text: "Con không bắn ai hết, con chỉ bắn cây kiểng.",
      break: {
        clue: "nuoc-bac-ha",
        lines: [
          ["me", "Nước bạc hà văng đầy khay trầu cau, ngay giữa phòng khách. Cây kiểng nằm ở góc sân lận."],
          ["beti", "…Con bắn chú Hùng. Tại chú Hùng không cho con chơi điện thoại nữa!", "nervous"],
          ["beti", "Chú đứng sát cái khay, tay đang thò vô hộp nhẫn đó. Con bắn ‘chíu chíu’, chú la oai oái rồi chạy vô bếp. Con không có lấy nhẫn!", "angry"],
          ["teo", "Bé Ti… vô tội hả? Em đoán sai nữa rồi sếp.", "nervous"],
        ],
      },
    },
  },

  present: {
    anhhung: {
      "nhan-gia": [["anhhung", "Nhẫn giả hả? Trời ơi, vậy chắc có đứa tráo lúc nó nằm trong bánh! Bà làm bánh đó! Hoặc dì Ba, dì Ba rành vàng mà!", "nervous"]],
      "vun-ma-vang": [["anhhung", "Vụn gì đâu, bụi thôi. Hộp cũ trăm năm mà. Hút bụi đi là hết.", "nervous"]],
      "bia-my-ky": [["anhhung", "Đó là… quà! Tui đặt nhẫn mỹ ký tặng bạn gái. Ờ, bạn gái. Tui có bạn gái mà!", "nervous"]],
      "tem-sieu-thi": [["anhhung", "Đó! Bà Loan nói dối chuyện bánh! Người nói dối một chuyện là nói dối mười chuyện! Bắt bả đi!", "smug"]],
      "nhan-that": [["anhhung", "Nhẫn… nhẫn này… còn nguyên hả? Chưa bị bán hả?", "shock"]],
    },
    diba: {
      "vun-ma-vang": [["diba", "Vụn mạ! Đúng, mạ bong ra như vầy là hàng mạ dỏm. Dì biết… dì đọc trên mạng.", "nervous"]],
      "anh-ba-co": [["diba", "Mấu chấu mẻ đó là đồ thật nha. Đồ giả người ta làm nguyên hết, không ai làm mẻ.", "smug"]],
      "bia-my-ky": [["diba", "Shop 247! Thằng Hùng đặt shop 247! Vậy mà nãy giờ cả họ nhìn dì!", "angry"]],
    },
    chiloan: {
      "vet-xanh-banh": [["chiloan", "Ai chọc bánh tui vậy? Trét lại xấu hoắc! Bắt bông kiểu đó tui cho rớt nghề!", "angry"]],
      "ao-guci": [["chiloan", "Áo đó hồi nãy có thằng cha mặc chạy vô bếp kiếm khăn lau, tui có thấy đâu. Tui đi… tui ở bếp mà. Ờ.", "nervous"]],
      "nhan-gia": [["chiloan", "Tui làm bánh, không làm nhẫn! Nhẫn giả thì liên quan gì bánh siêu thị… Á, lỡ miệng nữa!", "shock"]],
    },
    beti: {
      "ao-guci": [["beti", "Áo của chú Hùng! Con bắn trúng nó đó. Nó chảy nước xanh xanh, chú la quá trời.", "happy"]],
      "nhan-trong-banh": [["beti", "Con hông có bỏ vô bánh! Con chỉ ăn bánh pía thôi!", "angry"]],
    },
    ongnoi: {
      "nhan-gia": [["ongnoi", "Giả… Vậy là cái tui nhìn thấy sáng nay, cái tui mừng muốn khóc… là đồ giả…", "shock"]],
      "nhan-that": [["ongnoi", "Đúng rồi… cái mẻ đó… má ơi…", "nervous"]],
      "bien-nhan-cam-do": [["ongnoi", "Tiệm cầm đồ… Ai trong nhà này lại đem đồ của má tui đi cầm…", "angry"]],
    },
    chusau: {
      "nhan-gia": [["chusau", "Cái này mỹ ký. Tui cầm lên là biết, nhẹ như cục kẹo me. Tiệm tui không nhận.", "smug"]],
      "anh-ba-co": [["chusau", "Đúng nó! Mấu thứ ba mẻ. Bà cụ trong ảnh đẹp lão ghê.", "neutral"]],
    },
  },

  wrong: {
    ongnoi: [
      [["ongnoi", "Cái này là cái gì? Mắt tui kém, mà tui thấy nó không liên quan.", "neutral"]],
      [["ongnoi", "Thám tử đưa tui coi đồ gì vậy? Tui tưởng thằng cháu đưa thuốc huyết áp.", "nervous"]],
      [["ongnoi", "Hồi xưa tui đi lính, tui biết bằng chứng là gì. Cái này không phải.", "angry"]],
    ],
    diba: [
      [["diba", "Ủa cái gì đây? Dì nói cho nghe nè, cái này không chứng minh được gì hết, mà dì nói cho nghe luôn chuyện con gái bà Năm…", "smug"]],
      [["diba", "Con đưa dì cái này làm chi? Dì có phải tiệm thu mua phế liệu đâu!", "angry"]],
      [["diba", "Trời ơi, thám tử gì mà đưa đồ trật lất. Hồi đó dì mà đoán vàng trật vậy là dì sập tiệm rồi!", "angry"]],
    ],
    anhhung: [
      [["anhhung", "Cái này hả? Không liên quan. Giống như MoonDoge giảm giá, không liên quan tới giá trị thật.", "smug"]],
      [["anhhung", "Anh thám tử ‘FUD’ tui hả? Tin giả! Tui không bị lung lay đâu!", "angry"]],
      [["anhhung", "Đưa trật rồi anh ơi. Mà anh có muốn đầu tư MoonDoge không? Đang đáy đó.", "nervous"]],
    ],
    chiloan: [
      [["chiloan", "Cái này đâu phải đồ bếp! Đem ra khỏi lãnh thổ của tui!", "angry"]],
      [["chiloan", "Thám tử ơi, hai mươi năm nấu cỗ, tui chưa thấy ai đưa bằng chứng trật như đưa muối thay đường.", "smug"]],
      [["chiloan", "Đưa cái này cho tui làm chi? Tui đang bận bắt bông… ờ, bắt bông bánh tui tự nướng.", "nervous"]],
    ],
    beti: [
      [["beti", "Cái gì vậy? Con hông biết! Chú thám tử chơi trò gì vậy, cho con chơi với!", "happy"]],
      [["beti", "Hông phải! Chú bị hư rồi. Con bắn chú nha!", "angry"]],
      [["beti", "Cái này hổng có vui. Con đi ăn bánh pía đây.", "neutral"]],
    ],
  },

  deduction: [
    {
      id: "lop-1",
      text: "Nhẫn biến mất khỏi khay trầu cau lúc {a}, rồi bị nhét vào {b} khi bếp vắng người lúc {c}.",
      blanks: {
        a: { answer: "9h15", kind: "luc" },
        b: { answer: "banh-kem", kind: "vat" },
        c: { answer: "9h25", kind: "luc" },
      },
      explain: [
        ["me", "9h15 đồng hồ đổ chuông, Bé Ti bắn súng nước, nhẫn mất. Chị Loan đi mua kem tươi từ 9h20, và 9h25 Linh thấy một người tay xanh lè đi vô bếp. Nhẫn nằm trong bánh kem."],
      ],
    },
    {
      id: "vet-xanh",
      text: "Vệt xanh trên bánh không phải {a} của Bé Ti, mà là {b} của {c}.",
      blanks: {
        a: { answer: "nuoc-bac-ha", kind: "vat" },
        b: { answer: "mau-ao", kind: "vat" },
        c: { answer: "anhhung", kind: "ai" },
      },
      explain: [
        ["me", "Nước súng Bé Ti xanh lá, thơm bạc hà. Vệt trên bánh xanh lam, không mùi, có sợi vải, khớp với áo GUCCl phai màu khi bị bắn ướt. Người chọc nhẫn vô bánh là anh Hùng."],
      ],
    },
    {
      id: "trao",
      text: "Nhẫn thật đã bị tráo từ {a}, khi người giữ {b} là {c}.",
      blanks: {
        a: { answer: "thu-ba", kind: "luc" },
        b: { answer: "chia-khoa", kind: "vat" },
        c: { answer: "anhhung", kind: "ai" },
      },
      explain: [
        ["me", "Vụn mạ nằm sâu trong khe nệm hộp nhẫn: nhẫn giả nằm trong hộp nhiều ngày rồi. Thứ Ba tuần trước ông Cả đưa chìa khoá tủ thờ cho anh Hùng, đúng chiều hôm đó nhẫn thật vô tiệm cầm đồ."],
      ],
    },
    {
      id: "nhan-o-dau",
      text: "Nhẫn thật nằm ở {a}, cầm được {b}; còn nhẫn giả đặt làm ở shop {c}.",
      blanks: {
        a: { answer: "tiem-cam-do", kind: "o" },
        b: { answer: "80-trieu", kind: "khac" },
        c: { answer: "my-ky-247", kind: "khac" },
      },
      explain: [
        ["me", "Sổ cầm đồ 0473: 80 triệu, SĐT đuôi 729. Hộp giao hàng Mỹ Ký 247 gửi anh Hùng, cũng SĐT đuôi 729. Một người, hai giao dịch."],
      ],
    },
    {
      id: "dong-co",
      text: "Anh Hùng làm tất cả để {a}; còn {b} nói dối về vàng trên tay vì {c}.",
      blanks: {
        a: { answer: "go-lo", kind: "vi" },
        b: { answer: "diba", kind: "ai" },
        c: { answer: "so-mat-mat", kind: "vi" },
      },
      explain: [
        ["me", "MoonDoge giảm 94%, anh Hùng nợ tám chục triệu. Dì Ba nhận ra nhẫn giả trong một giây không phải vì dì tráo, mà vì ba chục năm dì đeo đồ mỹ ký cho đỡ mất mặt."],
      ],
    },
  ],

  finale: {
    culprit: "anhhung",
    intro: [
      ["narr", "Trưa. Hai họ ngồi lại phòng khách. Mâm cỗ để nguội. Cả hẻm 47 đứng kín ngoài cửa: cô Hai, Linh, ông Bảy với Bin, chị Vy, cô Út, Bé Mít. Chú Ba dân phòng lần đầu tiên tới đúng giờ."],
      ["chuba", "Tui có mặt! Đúng giờ! Ghi nhận lịch sử!", "happy"],
      ["batu", "Bà Tư không live nữa. Lần này bà nghe cho kỹ đã.", "neutral"],
      ["teo", "Sếp… lần này em không đoán. Em chỉ đứng sau sếp thôi.", "nervous"],
      ["me", "Có hai chiếc nhẫn trong vụ này. Một chiếc trong bánh kem, nhẹ hều, giá ba trăm rưỡi nghìn. Một chiếc trong tủ kính tiệm cầm đồ đầu chợ, mấu chấu thứ ba mẻ từ năm 1968."],
      ["me", "Người đổi chiếc này lấy chiếc kia đang ngồi trong phòng khách. Anh Hùng."],
      ["anhhung", "Tui?! Tui là người lo cho ông nội nhất nhà này! Anh nói có bằng chứng không?", "angry"],
    ],
    steps: [
      {
        claim: [
          ["anhhung", "Nhẫn trong bánh là Bé Ti bỏ vô! Con nít nghịch! Tui thấy tận mắt nó chạy vô bếp!", "angry"],
        ],
        answer: "soi-mau-xanh",
        right: [
          ["me", "Vệt xanh quanh lỗ chọc trên bánh: xanh lam, không mùi, có sợi vải. Khớp vết phai trên áo GUCCl của anh. Nước súng Bé Ti xanh lá, thơm bạc hà, không khớp."],
          ["teo", "Em ngửi rồi! Không có mùi bạc hà! Mũi em xác nhận!", "smug"],
          ["beti", "Thấy chưa! Con nói con hông có mà!", "angry"],
        ],
        wrong: [["anhhung", "Đó, không chứng minh được! Bé Ti, con nhận đi cho chú!", "smug"]],
      },
      {
        claim: [
          ["anhhung", "Thì… thì tui có nhét vô bánh! Để tạo bất ngờ cho vui! Nhưng nhẫn giả là do có đứa tráo lúc nó nằm trong bếp! Bà Loan! Hoặc dì Ba rành vàng!", "nervous"],
        ],
        answer: "vun-ma-vang",
        right: [
          ["me", "Vụn mạ vàng nằm sâu trong khe nệm hộp nhẫn. Lớp mạ chỉ chà ra được khi chiếc nhẫn giả nằm trong hộp nhiều ngày, bị đóng mở nhiều lần. Sáng nay lúc 8h30, trong hộp đã là nhẫn giả."],
          ["me", "Không ai tráo nhẫn trong bếp. Nhẫn bị tráo từ trước khi đám hỏi bắt đầu."],
          ["chiloan", "Đó! Tui chỉ nói dối vụ bánh siêu thị thôi! Tui không tráo nhẫn!", "angry"],
          ["diba", "Dì cũng chỉ nói dối vụ vòng mỹ ký thôi nha!", "angry"],
        ],
        wrong: [["anhhung", "Thấy chưa, ai cũng có thể tráo! Bếp lúc đó vắng mà!", "smug"]],
      },
      {
        claim: [
          ["anhhung", "Hộp nhẫn khoá trong tủ thờ! Chìa khoá ông nội đeo ở thắt lưng! Tui làm sao mở được?", "angry"],
        ],
        answer: "giay-nhac-ong-noi",
        right: [
          ["me", "Giấy nhắc trong cánh tủ thờ, chữ ông Cả: ‘Thứ Ba: đưa chìa khoá tủ thờ cho thằng Hùng lau bàn thờ. NHỚ LẤY LẠI’."],
          ["ongnoi", "Hùng… con xin lau bàn thờ cho ông. Ông mừng lắm. Ông còn khoe với hàng xóm là cháu ông hiếu thảo…", "nervous"],
          ["anhhung", "Nội…", "nervous"],
        ],
        wrong: [["anhhung", "Đó! Không có chìa khoá thì không ai mở được tủ thờ!", "smug"]],
      },
      {
        claim: [
          ["anhhung", "Nhẫn giả thì thiếu gì tiệm làm! Cả thành phố này ai cũng đặt được! Sao biết là tui?", "nervous"],
        ],
        answer: "bia-my-ky",
        right: [
          ["me", "Vỏ hộp giao hàng kê dưới thớt: ‘Shop Mỹ Ký 247 – nhẫn làm theo ảnh – 350.000đ – Người nhận: Anh Hùng – SĐT …729 – giao Thứ Năm’."],
          ["beti", "Thì ra chú chụp hình cái nhẫn cả chục tấm là để gửi cho tiệm làm đồ giả!", "angry"],
          ["diba", "Dấu MK-247 trên nhẫn giả, y như shop dì mua. Thằng Hùng đặt đúng shop đó!", "shock"],
        ],
        wrong: [["anhhung", "Đó, ai cũng đặt được! Không có tên tui!", "smug"]],
      },
      {
        claim: [
          ["anhhung", "Còn tiệm cầm đồ, cả đời tui chưa bước chân vô! Biên nhận đó ai làm rớt trong nhà thì có trời biết!", "angry"],
          ["anhhung", "Áo GUCCl thì chợ đêm bán cả ngàn cái!", "nervous"],
        ],
        answer: "camera-tiem-cam-do",
        right: [
          ["me", "Camera tiệm Phát Tài, Thứ Ba 14h05, đúng chiều anh giữ chìa khoá tủ thờ: kính đen, áo GUCCl chữ L thường, ốp điện thoại dán sticker MoonDoge. Ký sổ chữ ‘H’, SĐT đuôi 729."],
          ["cout", "Người đó ngồi quán tui mười phút trước khi qua tiệm. Gọi bạc xỉu. Run như cầy sấy.", "neutral"],
          ["narr", "Anh Hùng gỡ cặp kính đen xuống. Mắt đỏ hoe."],
        ],
        wrong: [["anhhung", "Thấy chưa, cái đó không chứng minh được ai cầm!", "smug"]],
      },
    ],
    confess: [
      ["anhhung", "…Hai năm trước con bỏ hết tiền vô MoonDoge. Rồi vay thêm. Rồi vay để trả lãi chỗ vay. Tới tháng trước thì nợ tám chục triệu, chủ nợ gọi ngày ba chục cuộc.", "nervous"],
      ["anhhung", "Con không dám nói với nội. Nội nuôi con từ nhỏ. Con muốn nội nghĩ con là đứa cháu giỏi.", "nervous"],
      ["anhhung", "Thứ Ba con xin chìa khoá lau bàn thờ. Con chụp hình cái nhẫn, đặt làm cái giả, rồi đem cái thật đi cầm. Con tính đợi coin lên lại thì chuộc về. Coin không lên.", "nervous"],
      ["anhhung", "Sáng nay dì Ba nói ‘lát coi kỹ tuổi vàng’, con hoảng. Con giựt cái nhẫn giả lúc Bé Ti bắn nước, nhét vô bánh kem, tính để cả nhà ‘tìm thấy’ mừng quá cất vô tủ liền, không ai soi. Lỡ có ai phát hiện thì… thì đổ là bị tráo trong bếp.", "nervous"],
      ["anhhung", "Con đổ cho Bé Ti. Con đổ cho chị Loan, cho dì Ba. Con xin lỗi. Nội ơi, con xin lỗi.", "nervous"],
      ["narr", "Ông Cả chống gậy trúc đứng dậy. Cả phòng nín thở."],
      ["ongnoi", "Hùng. Má của nội đeo chiếc nhẫn đó qua những năm đói nhất, không bán. Con biết vì sao không?", "neutral"],
      ["ongnoi", "Không phải vì nó đáng giá. Mà vì bà nói: còn chiếc nhẫn là còn nhớ mình từ đâu tới. Con quên mất mình từ đâu tới, chớ con không phải đứa xấu.", "nervous"],
      ["ongnoi", "Con nợ thì nói với nội. Nhà mình có nghèo cũng ngồi chung một mâm. Đừng bao giờ ngồi một mình với cái nợ nữa, nghe chưa.", "nervous"],
      ["anhhung", "Dạ… con nghe rồi nội.", "nervous"],
    ],
    epilogue: [
      ["narr", "Chiều hôm đó."],
      ["narr", "Anh Hùng bán chiếc xe máy, bán luôn mớ áo ‘hàng hiệu’ (được có ba trăm nghìn), đem tiền ra tiệm chú Sáu. Ông Cả bù phần còn lại, ghi giấy cho anh Hùng trả dần mỗi tháng. Cô Út nhận anh Hùng vô quán phụ pha cà phê, lương trả thẳng vô tiền nợ."],
      ["chusau", "Đồ có câu chuyện thì phải về nhà. Tui bớt cho tiền lãi, coi như mừng đám hỏi.", "happy"],
      ["narr", "Bốn giờ chiều, đám hỏi làm lại. Ông Cả run run đeo chiếc nhẫn có cái mấu chấu mẻ vào tay Ngọc."],
      ["ngoc", "Con cảm ơn ông. Con sẽ giữ cái mẻ này, y như bà cố.", "happy"],
      ["khang", "Anh thám tử ơi, cảm ơn anh. Nhà em vẫn còn đủ mâm.", "happy"],
      ["diba", "Từ nay dì đeo đồ mỹ ký công khai! Đẹp là được! Mà ai muốn link shop thì nhắn dì.", "happy"],
      ["chiloan", "Còn tui, tui đi học làm bánh thật. Lò nướng nhà ông Cả tui xin khui nilon luôn.", "happy"],
      ["beti", "Chú Hùng ơi, giờ cho con chơi điện thoại lại nha. Con hứa không bắn chú nữa. Một tuần.", "happy"],
      ["narr", "Mâm cỗ dọn ra. Cô Hai múc thịt kho cho cả hẻm, Linh ngồi kế cô Hai, lần này không bật đèn ring. Ông Bảy để Chiến Thần gáy một tiếng chúc mừng, Bin quay video gửi bạn đại học."],
      ["narr", "Chị Vy chia ly trà sữa ghi tên cho Bé Ti. Bé Mít live mà không quay mặt mình một lần nào, chỉ quay mâm cỗ với nụ cười của người ta. Cô Út phát wifi tên ‘MungDamHoiHem47’."],
      ["batu", "Thám tử ơi. Sáu vụ rồi đó. Bà Tư admin nhóm Hóng Biến mười năm, chưa thấy ai phá án mà cả hẻm còn thương nhau hơn trước.", "happy"],
      ["teo", "Sếp ơi… vụ này em không đoán bậy câu nào. Em ngửi được cái vệt kem. Em có tiến bộ không sếp?", "nervous"],
      ["me", "Có, Tèo. Cậu đã học được điều khó nhất của nghề này: nhìn trước, nói sau.", "smug"],
      ["teo", "Vậy em được tăng lương không sếp?", "happy"],
      ["me", "Nhìn trước, nói sau, Tèo.", "neutral"],
      ["narr", "Đèn lồng đỏ sáng lên dọc hẻm 47. Trên nhóm ‘Hẻm 47 Hóng Biến’, bà Tư đổi ảnh bìa thành tấm hình cả hẻm chụp chung trước nhà ông Cả, ở giữa là thám tử với Tèo."],
      ["batu", "Từ hôm nay nhóm đổi tên: ‘Hẻm 47 Hóng Biến… và Thương Nhau’. Ai phản đối thì bà Tư kick.", "smug"],
      ["chuba", "Tui đồng ý. Ghi nhận: hẻm 47 bình yên.", "happy"],
    ],
    comments: [
      { by: "batu", text: "Sáu vụ, sáu cái kết có hậu. Thám tử hẻm 47 là huyền thoại, bà Tư tuyên bố vậy, ai cãi bà kick.", likes: 8820 },
      { by: "teo", text: "Hôm nay em không đoán sai câu nào vì em không đoán câu nào. Sếp nói đó là tiến bộ. Em tin sếp.", likes: 6410 },
      { by: "Ông Cả", text: "Cảm ơn thám tử. Cảm ơn cả hẻm. Nhẫn về nhà, cháu về nhà. Ông không xin gì hơn.", likes: 9950 },
      { by: "Anh Hùng (đang trả nợ)", text: "Tui xin lỗi cả họ, cả hẻm. Ai cần pha bạc xỉu ghé quán cô Út, tui pha, tiền vô thẳng sổ nợ. Không bán coin nữa.", likes: 5230 },
      { by: "Dì Ba Mỹ Ký Công Khai", text: "Vòng dì giả, nhưng thương cháu dì là thật. Ai cần link shop 247 nhắn dì, dì không lấy hoa hồng.", likes: 4870 },
      { by: "Chị Loan Học Làm Bánh", text: "Ngày đầu đi học làm bánh: cháy hai khay. Nhưng là bánh tui tự nướng! Thật 100%!", likes: 3310 },
      { by: "Bé Ti", text: "con hông có tội. con ăn hai cái bánh pía. hết.", likes: 7120 },
      { by: "Cô Hai Thịt Kho", text: "Nồi thịt kho hôm nay không ai lấy, mà tui múc cho cả hẻm. Cho thì vui hơn mất.", likes: 3980 },
      { by: "Linh Ăn Uống", text: "Hôm nay em không quay gì, chỉ ngồi ăn với cô Hai. Clip không có mà bụng thì no.", likes: 2760 },
      { by: "Ông Bảy Gà Chọi", text: "Chiến Thần gáy đúng người. Tui nói rồi mà không ai tin.", likes: 2940 },
      { by: "Bin", text: "Ông nội con lại nói gà phá án. Thám tử phá án, gà chỉ gáy thôi ông ơi.", likes: 3150 },
      { by: "Vy Trưởng Phòng", text: "Lần đầu tiên tui chia trà sữa ghi tên cho người khác. Bé Ti uống hết trong 40 giây. Tui tự hào.", likes: 2580 },
      { by: "Út Cà Phê", text: "Nhân viên mới pha bạc xỉu hơi ngọt, nhưng chăm. Wifi quán vẫn miễn phí cho cả hẻm nha.", likes: 2210 },
      { by: "Bé Mít Review", text: "Clip đám hỏi hôm nay không có một sự cố nào được dàn dựng. Mít quay mâm cỗ, thấy vui hơn quay mặt mình.", likes: 6050 },
      { by: "Chú Sáu Cầm Đồ", text: "Hôm nay tiệm có một món đồ được chuộc về nhà. Tui ăn mừng bằng một hũ kẹo me.", likes: 3470 },
      { by: "Chú Ba Dân Phòng", text: "Tui tới đúng giờ. Lần đầu tiên. Thám tử chứng kiến. Ghi nhận lịch sử hẻm 47.", likes: 4410 },
      { by: "Ngọc (cô dâu)", text: "Con sẽ giữ cái mấu chấu mẻ như bà cố. Và giữ luôn cái hẻm này.", likes: 7790 },
      { by: "Khang (chú rể)", text: "Anh Hùng ơi, tối nay về ăn cơm với nội nha. Đủ mâm mới vui.", likes: 6630 },
    ],
  },

  hints: [
    { needs: "clue:camera-tiem-cam-do", text: "Sếp ơi, đủ bằng chứng rồi đó! Ra bảng suy luận chốt đi. Em không đoán đâu, em chỉ nhắc thôi." },
    { needs: "loc:pawnshop", text: "Tới tiệm cầm đồ rồi! Mình soi sổ cầm đồ, tủ kính, camera tiệm đi sếp. Hỏi cô Út nữa, quán cô ở ngay đối diện." },
    { needs: "flag:nhan-gia", text: "Nhẫn giả! Vậy nhẫn thật bị tráo từ trước. Sếp soi lại tủ thờ, gầm sofa, hộp quả lắc. Người trong nhà hay giấu đồ ở đâu ta?" },
    { needs: "flag:tim-thay-nhan", text: "Tìm thấy nhẫn rồi! …Mà em cầm thấy nhẹ nhẹ. Dì Ba nói rành vàng, nhờ dì Ba coi thử đi sếp." },
    { needs: "broke:chiloan-khong-roi-bep", text: "Bếp vắng lúc 9h20 tới 9h35. Mà bánh kem có cái lỗ chọc với vệt xanh. Mình cắt chỗ đó coi thử đi sếp?" },
    { needs: "stmt:chiloan-khong-roi-bep", text: "Chị Loan nói không rời bếp. Mà trong tủ lạnh có kem tươi mới mua, kèm biên lai gì đó." },
    { needs: "stmt:hung-o-cua", text: "Anh Hùng nói đứng ở cửa. Chị Mít live từ 8h, nhờ chị cho coi lại đoạn 9h15 đi sếp." },
    { needs: "stmt:beti-ban-cay", text: "Bé Ti nói bắn cây kiểng. Mà nước bạc hà văng đầy khay trầu cau kìa." },
    { needs: "stmt:ongnoi-giu-chia", text: "Ông Cả nói không bao giờ đưa chìa khoá cho ai. Mà ông hay dán giấy nhắc khắp nhà lắm đó sếp." },
    { text: "Bé Ti! Chắc chắn Bé Ti! …Dạ thôi, em không đoán. Mình soi phòng khách với nhà bếp, hỏi hết mọi người đi sếp." },
  ],

  bonus: [
    {
      id: "mau-chau",
      q: "Mấu chấu thứ mấy của nhẫn thật bị mẻ, và vì sao?",
      choices: ["Mấu thứ nhất, Bé Ti cắn", "Mấu thứ ba, bà cố làm rớt vô cối giã gạo", "Mấu thứ hai, rớt trong bánh kem", "Không mấu nào mẻ"],
      answer: 1,
      explain: "Mấu thứ ba mẻ từ năm 1968, khi bà cố đang giã gạo thì rớt nhẫn vô cối.",
    },
    {
      id: "chu-l",
      q: "Theo anh Hùng, chữ L thường trên áo ‘GUCCl’ là viết tắt của gì?",
      choices: ["Lỗi in", "Limited", "Lụm Kèo", "Lan (chợ đêm Ý Lan)"],
      answer: 1,
      explain: "Anh Hùng cãi là ‘Limited’. Thật ra là áo chợ đêm 120 nghìn.",
    },
    {
      id: "wifi",
      q: "Wifi quán cô Út ở đám hỏi đổi tên thành gì?",
      choices: ["UtXinLoiCaHem", "MungDamHoiHem47", "KhongCatNua", "MoonDoge"],
      answer: 1,
      explain: "Buổi tối cô Út đổi wifi thành ‘MungDamHoiHem47’. Tên cũ là ‘UtXinLoiCaHem’, mật khẩu ‘khongcatnua’.",
    },
  ],
};
