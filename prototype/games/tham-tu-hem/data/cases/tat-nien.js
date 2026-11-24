// Vụ 10: "Phong Bì Tất Niên" (độ khó 3, mùa 2). Hợp đồng nhân vật / cảnh / đồ vật: docs/tham-tu-hem/DESIGN.md §3b.
// Dàn nhân vật Vụ 3 quay lại (sheet "tra-sua-van-phong"): vy, khoa, phong, hang, dat. Người mới duy nhất: quanly (anh Lâm).
// Cơ chế mới: SƠ ĐỒ CHỖ NGỒI. Xếp lại ai ngồi đâu (sơ đồ dán cửa, thẻ tên, ảnh check-in 18:55, ảnh nâng ly 20:02),
//   ai rời ghế lúc nào (clip TikTok của Khoa trước cây mai, selfie 20:10 của chị Vy, bảng order có giờ đặt / giờ mang ra).
// Lời giải (KHÔNG hiện cho người chơi):
//   Thủ phạm: Hằng (kế toán). 18:30 chị cùng anh Lâm đếm 50 triệu vào 12 phong bì, khoá két (sếp Đạt đọc mã 1202 cho cài).
//   18:50 Hằng đổi thẻ tên với Phong để ngồi ghế 1 bàn team, sát cây mai và cửa hành lang (sơ đồ ghi ghế 1 là Phong).
//   19:00 sếp Đạt phát biểu, khoe trên micro "mã két là sinh nhật sếp, 1202" => cả sảnh biết mã.
//   19:45 Khoa nhờ dời cây mai làm nền TikTok, vô tình che camera hành lang. 19:50 Hằng mượn khăn lông trắng của chị Vy
//   (chị Vy say nhẹ, không nhớ ai mượn). 19:55 Hằng đặt dĩa gỏi ngó sen, dặn 20:06 mới mang ra (chứng cứ ngoại phạm giả).
//   20:02 ảnh nâng ly: Hằng quàng khăn lông. 20:04 lẻn qua cửa hành lang (clip Khoa), 20:06 mở két, 20:07 đóng,
//   20:09 giấu 12 phong bì trong tủ đông bếp, túi zip "SALAD – BÀN 2 – ĐỪNG ĐỤNG", lỡ bỏ quên cái nĩa hồng "Ngày 1/30".
//   Đồng hồ báo "8.000 bước" ngay lúc đó (Phong đang viết chữ lên bánh trong bếp nghe thấy). 20:12 về ghế. 20:31 anh Lâm mở két: trống.
//   Động cơ / cú lật: sếp Đạt gian lận bốc thăm. Thùng bốc thăm hai đáy, ngăn dưới toàn phiếu hồng "Nguyễn Đăng Khoa":
//   Khoa là cháu ruột sếp, hai năm liền trúng giải đặc biệt ("cộng tác viên", "khách mời"). Hằng muốn chặn buổi bốc thăm
//   rồi vạch trần trước mọi người. Đúng chuyện, sai cách.
//   Gây nhiễu: Phong (rời bàn 20:03–20:14: lén làm bánh kem cảm ơn chị Vy), Khoa (dời cây mai che camera; giấu chuyện là cháu sếp),
//   anh Lâm (khai ngồi trong phòng quản lý, thật ra ra sảnh xin chụp hình với Khoa vì là fan TikTok), sếp Đạt (khai mã két chỉ 2 người biết).
//   Ghép vật chứng: ảnh nâng ly 20:02 (Hằng quàng khăn) + clip Khoa (người quàng khăn lẻn qua cửa) + selfie chị Vy 20:10 (chị Vy ngồi ghế, không khăn);
//   túi phong bì có nĩa hồng + hộp salad của Hằng thiếu nĩa; bước chân 8.000 lúc 20:09 + lời Phong nghe "tít tít" cạnh tủ đông.
export default {
  id: "tat-nien",
  no: 10,
  title: "Phong Bì Tất Niên",
  tagline: "Quỹ bốc thăm 50 triệu biến khỏi két 30 phút trước giờ bốc. Cả công ty ngồi một sảnh, mà không ai ngồi yên một chỗ.",
  difficulty: 3,
  client: "vy",

  intro: [
    ["narr", "Tối thứ Sáu cuối năm. Nhà hàng Lẩu Phát Tài đầu chợ treo đèn lồng đỏ, loa mở nhạc Tết từ sáu giờ chiều."],
    ["teo", "Sếp ơi, lần đầu tiên trong đời em được mời đi tất niên công ty. Mà công ty người ta, không phải công ty mình.", "happy"],
    ["me", "Chị Vy mời, cảm ơn vụ ly trà sữa. Ăn từ tốn thôi, Tèo. Mình là khách.", "neutral"],
    ["narr", "Cà Khịa Media giờ có mười một người. Từ sau vụ ly trà sữa, clip của Khoa nổi, công ty nhận thêm hợp đồng. Sảnh tiệc kê hai bàn: bàn sếp và bàn team."],
    ["narr", "Tám giờ ba mươi mốt phút. Thám tử với Tèo đang thi ăn lẩu với ông đối tác ngồi cạnh, thì một anh vest đen, tay cầm bộ đàm, chạy vô sảnh mặt trắng bệch."],
    ["quanly", "Dạ xin lỗi quý khách! Dạ cho em gặp anh Đạt gấp! Két sắt... két sắt phòng quản lý... trống rồi anh ơi!", "shock"],
    ["dat", "Trống là sao? 50 triệu tiền bốc thăm của anh đó! Mười hai cái phong bì!", "shock"],
    ["vy", "Chín giờ bốc thăm. Còn đúng [[21h|30 phút]].", "angry"],
    ["vy", "Anh thám tử. Tôi biết anh đang ăn lẩu. Tôi cũng biết anh nợ tôi một lời cảm ơn vì bữa lẩu đó. Anh có 30 phút.", "neutral"],
    ["teo", "Sếp ơi, em đoán liền: anh quản lý! Người giữ két là người dễ lấy két nhất! Cuối năm ai chẳng [[can-tien|cần tiền ăn Tết]]!", "smug"],
    ["quanly", "Dạ em giữ két 7 năm chưa mất một đồng, quý khách đừng nói vậy em tổn thương.", "nervous"],
    ["dat", "Không ai được rời sảnh! Công ty là gia đình! Gia đình... không ai được về!", "angry"],
    ["batu", "(gọi video vô điện thoại Tèo) Tèo! Đứa cháu bà làm phục vụ nhà hàng đó kể hết rồi! Bà đăng nhóm rồi nha!", "happy"],
    ["me", "Chị Vy, bắt đầu từ sơ đồ chỗ ngồi. Tôi cần biết ai ngồi đâu, và ai đã rời ghế.", "neutral"],
  ],

  social: {
    group: "Hẻm 47 Hóng Biến",
    posts: [
      {
        by: "batu",
        text: "🧧 BIẾN TẤT NIÊN 🧧 Công ty truyền thông đầu hẻm (vụ ly trà sữa năm ngoái đó bà con) đi tất niên ở Lẩu Phát Tài, MẤT SẠCH 50 TRIỆU tiền bốc thăm trong két, 30 phút trước giờ bốc!!! Mười một người ngồi chung một sảnh. Thám tử Lụm đang ăn lẩu ở đó luôn. Bà con vô đoán 👇",
        likes: 2140,
        comments: [
          { by: "teo", text: "Em có mặt tại hiện trường!! Em đang ăn lẩu!! Em đoán anh quản lý 🕵️" },
          { by: "Cô Ba Bán Xôi", text: "50 triệu bốc thăm. Tất niên chợ mình bốc thăm trúng nồi cơm điện là mừng rơi nước mắt rồi" },
          { by: "Hùng Xe Ôm", text: "Năm ngoái công ty này ai trúng giải đặc biệt vậy? Tui hỏi vậy thôi chứ không có ý gì" },
          { by: "Tiểu Thư Bánh Bèo 2k5", text: "Chị Vy với anh Phong làm lành chưa vậy mọi người? Em hóng từ vụ trà sữa tới giờ 🥺" },
          { by: "Dân IT Hẻm Bên", text: "Két điện tử là có log. Ai rảnh thì coi log trước khi đoán bậy nha" },
          { by: "chuba", text: "Chú đang trực, nhà hàng đó xa quá, mai chú ghé" },
        ],
      },
    ],
  },

  people: {
    vy: {
      name: "Chị Vy",
      role: "Trưởng phòng Content · người tới nhờ",
      bio: "Vẫn vest... à không, hôm nay áo dài đỏ theo dress code, khoác thêm khăn lông vũ trắng. Người xếp sơ đồ chỗ ngồi. Đã trả đủ bốn ly trà sữa nợ Phong.",
      sheet: "tra-sua-van-phong",
    },
    khoa: {
      name: "Khoa",
      role: "Nhân viên chính thức (tháng thứ 2)",
      bio: "Hết thực tập, lên chính thức, vẫn gặm nắp bút. Series TikTok đổi tên thành \"1 năm làm nhân viên văn phòng\", 80 nghìn follow. Năm ngoái trúng giải đặc biệt tất niên.",
      suspect: true,
      sheet: "tra-sua-van-phong",
    },
    phong: {
      name: "Phong",
      role: "Dân IT",
      bio: "Hoodie xám mặc ngoài sơ mi đỏ cho \"đúng dress code\". Vẫn cắn ống hút. Đã đổi pass it_admin, không còn dán giấy.",
      suspect: true,
      sheet: "tra-sua-van-phong",
    },
    hang: {
      name: "Hằng",
      role: "Kế toán",
      bio: "Đang ở \"Ngày 1/30\" của thử thách ăn kiêng, lần thứ bảy. Thêm đồng hồ thông minh đếm bước, app tự đăng thành tích lên group chat. Người đếm tiền phong bì.",
      suspect: true,
      sheet: "tra-sua-van-phong",
    },
    dat: {
      name: "Sếp Đạt",
      role: "Giám đốc",
      bio: "Áo polo đỏ, cốc \"Best Boss\" mang theo đựng rượu nếp. Vẫn ngủ trưa trên gối đám mây nhân viên tặng. Câu cửa miệng không đổi: \"Công ty là gia đình\".",
      suspect: true,
      sheet: "tra-sua-van-phong",
    },
    quanly: {
      name: "Anh Lâm",
      role: "Quản lý nhà hàng",
      bio: "Vest đen, bộ đàm kẹp hông, câu nào cũng mở đầu bằng \"dạ quý khách\". Giữ két nhà hàng 7 năm, nhân viên xuất sắc 12 tháng liền.",
      suspect: true,
    },
  },

  locations: {
    banquet: {
      name: "Sảnh tiệc",
      scene: "banquet",
      start: true,
      intro: [
        ["narr", "Sảnh tiệc trải thảm đỏ. Băng rôn \"TẤT NIÊN CÀ KHỊA MEDIA – CÔNG TY LÀ GIA ĐÌNH\". Hai bàn tròn, một sân khấu, một cây mai to như cây cổ thụ."],
        ["vy", "Không ai được đụng gì từ 8 giờ 31 tới giờ. Tôi đứng canh. Tôi có ghi âm.", "neutral"],
        ["teo", "Nồi lẩu bàn sếp còn sôi kìa sếp. Tụi mình đang ăn dở mà...", "nervous"],
      ],
      hotspots: [
        {
          id: "so-do-cho-ngoi",
          label: "Sơ đồ chỗ ngồi",
          rect: [20, 60, 120, 170],
          lines: [
            ["narr", "Tấm bảng dán ở cửa sảnh, chữ chị Vy in đậm: \"SƠ ĐỒ CHỖ NGỒI – VUI LÒNG NGỒI ĐÚNG CHỖ\"."],
            ["me", "Bàn sếp: ghế 1 sếp Đạt, ghế 2 chị Vy, ghế 3 Khoa, ghế 4 ông Kim đối tác, ghế 5 thám tử, ghế 6 Tèo.", "neutral"],
            ["me", "Bàn team: [[ghe-1|ghế 1]], sát cây mai và cửa hành lang, là Phong. Ghế 2 là Hằng. Ghế 3 tới 8 là sáu bạn mới.", "neutral"],
            ["teo", "Ghế 6 ghi \"Tèo (ăn ít thôi)\". Ai ghi vậy sếp? Em bị xúc phạm.", "angry"],
            ["vy", "Tôi ghi. Tôi đã thấy em ăn ở văn phòng anh thám tử.", "neutral"],
          ],
          gives: { clues: ["so-do-ghe"] },
          again: [["me", "\"Vui lòng ngồi đúng chỗ.\" Tôi nghi có người không đọc dòng này.", "neutral"]],
        },
        {
          id: "san-khau-tiec",
          label: "Sân khấu tiệc",
          rect: [330, 40, 300, 190],
          lines: [
            ["narr", "Sân khấu nhỏ, phông đỏ, cái micro dựng đứng. Bảng chương trình dán bên hông."],
            ["me", "\"19:00 Sếp phát biểu · 19:30 Văn nghệ · 20:00 Nâng ly · [[21h|21:00]] BỐC THĂM 50 TRIỆU\".", "neutral"],
            ["me", "Dưới chân micro có tờ giấy viết tay: \"Tiết mục 2: Phong & chị Vy song ca 'Ly Trà Sữa Đã Nguội'\".", "neutral"],
            ["teo", "Hai người từng tuyên chiến vì một ly trà sữa giờ song ca bài trà sữa. Tình đồng nghiệp đẹp quá sếp ơi.", "happy"],
          ],
          again: [["teo", "Em lên hát một bài được không sếp? Năm phút thôi.", "smug"], ["me", "Không.", "neutral"]],
        },
        {
          id: "thung-boc-tham",
          label: "Thùng bốc thăm",
          rect: [520, 240, 120, 130],
          lines: [
            ["narr", "Cái thùng gỗ sơn đỏ, nắp khoét lỗ tròn, dán chữ vàng \"LỘC\". Sếp Đạt đứng cạnh như vệ sĩ."],
            ["dat", "Thùng này anh tự đem từ công ty. Năm nào cũng xài. Thùng linh thiêng, đừng đụng.", "neutral"],
            ["me", "Bên ngoài cao cỡ nửa mét. Nhưng nhìn qua lỗ, đống phiếu thăm nằm khá nông, như đáy chỉ sâu hơn hai gang tay.", "neutral"],
            ["teo", "Thùng linh thiêng mà nông. Như tình cảm sếp dành cho nhân viên.", "smug"],
            ["dat", "Em nói gì đó?", "angry"],
          ],
          gives: { clues: ["thung-nong"] },
          again: [["me", "Cao nửa mét, sâu hai gang tay. Phần còn lại của cái thùng đi đâu?", "neutral"]],
        },
        {
          id: "ban-sep",
          label: "Bàn sếp",
          rect: [80, 280, 260, 180],
          lines: [
            ["narr", "Bàn tròn sát sân khấu. Nồi lẩu còn sôi lục bục, cái cốc \"Best Boss\" đựng rượu nếp đặt ngay ghế 1."],
            ["me", "Ghế 2 của chị Vy: vắt trên lưng ghế là một cái [[khan-long|khăn lông vũ trắng]], rụng lông lả tả.", "neutral"],
            ["me", "Ghế 3, sát sếp Đạt, thẻ tên ghi \"Khoa\". Thực tập sinh năm ngoái, giờ ngồi bàn sếp, ngay cạnh sếp.", "neutral"],
            ["teo", "Ghế 5 của sếp với ghế 6 của em còn nguyên chén lẩu. Ai đền em chén lẩu đang ăn dở đây.", "nervous"],
          ],
          again: [["me", "Cái khăn lông trắng vẫn vắt trên ghế chị Vy, run run theo gió máy lạnh.", "neutral"]],
        },
        {
          id: "ban-team",
          label: "Bàn team",
          rect: [440, 360, 300, 170],
          lines: [
            ["narr", "Bàn tròn tám ghế, gần cây mai. Sáu bạn mới ngồi co ro, mắt tròn xoe như chưa từng thấy công ty có biến."],
            ["me", "Thẻ tên ghế 1, sát cây mai: \"HẰNG\". Ghế 2: \"PHONG\". Mép thẻ có vết bút xoá, chữ cũ in hằn ngược lại.", "neutral"],
            ["me", "Trước ghế 1: một hộp salad nắp in \"Ngày 1/30\", ngăn để nĩa trống trơn. Kế bên là dĩa gỏi ngó sen ăn dở.", "neutral"],
            ["me", "Trước ghế 2: ly trà đá với một cái ống hút bị cắn dẹt lép, răng cưa đều tăm tắp.", "neutral"],
            ["teo", "Ống hút cắn dẹt! Sếp ơi em nhận ra chữ ký này. Hội ngộ quá!", "happy"],
          ],
          gives: { clues: ["the-ten", "hop-salad-thieu-nia"], words: ["doi-cho"] },
          again: [["me", "Hai cái thẻ tên, một vết bút xoá. Ai đó muốn ngồi gần cửa hơn sơ đồ cho phép.", "neutral"]],
        },
        {
          id: "cay-mai",
          label: "Cây mai",
          rect: [770, 120, 180, 340],
          lines: [
            ["narr", "Cây mai vàng cao quá đầu người, nở rộ. Treo đầy bao lì xì giả."],
            ["me", "Gốc mai có thẻ của nhà hàng: \"Dời theo yêu cầu khách bàn sếp – 19:45\". Chỗ đặt cũ còn in vòng nước dưới sàn, cách đây ba mét.", "neutral"],
            ["me", "Giờ cây mai đứng ngay trước [[cua-hanh-lang|cửa hành lang]], cánh cửa dẫn ra bếp và phòng quản lý. Cành mai xoè che luôn cái camera gắn trên khung cửa.", "neutral"],
            ["teo", "Cây mai che camera! Người dời cây mai là thủ phạm! Ai ở bàn sếp ta... (nhìn Khoa)", "shock"],
            ["khoa", "Dạ? Dạ... dạ em... em đi lấy nước!", "nervous"],
          ],
          gives: { words: ["cay-mai"] },
          again: [["teo", "Bao lì xì trên cây mai là giấy trắng hết sếp. Em mở ba cái rồi.", "nervous"]],
        },
        {
          id: "day-thung",
          label: "Đáy thùng bốc thăm",
          rect: [530, 330, 100, 40],
          needs: "flag:lam-thung-2-lop",
          lines: [
            ["narr", "Thám tử nghiêng cái thùng. Sếp Đạt nhào tới nhưng chậm một nhịp. Đáy thùng có một cái núm gỗ nhỏ."],
            ["me", "Xoay núm. Một ngăn bí mật trượt ra từ đáy, nằm dưới lớp phiếu thường.", "neutral"],
            ["me", "Trong ngăn: hai mươi phiếu thăm màu hồng nhạt, gấp sẵn. Mở từng tờ. Tờ nào cũng ghi: \"Nguyễn Đăng Khoa\".", "neutral"],
            ["teo", "Hai mươi tờ một cái tên! Đây không phải bốc thăm, đây là bốc... chỉ định!", "shock"],
            ["dat", "Cái đó... cái đó là phiếu dự phòng!", "nervous"],
          ],
          gives: { clues: ["day-doi"], words: ["day-doi"] },
          again: [["me", "Hai mươi phiếu hồng, một cái tên. Thùng \"LỘC\" lộc cho đúng một người.", "neutral"]],
        },
      ],
    },

    office2: {
      name: "Phòng quản lý nhà hàng",
      scene: "office2",
      start: true,
      intro: [
        ["narr", "Phòng quản lý nhỏ sau bếp, cuối hành lang. Két sắt điện tử ở góc, màn hình camera trên bàn, mùi lẩu bay vào theo khe cửa."],
        ["quanly", "Dạ đây là phòng em. Dạ quý khách xem gì em xin phép đứng kế bên, nội quy nhà hàng ạ.", "nervous"],
        ["teo", "Phòng quản lý mà nhỏ hơn phòng trọ em. Mà có két. Phòng trọ em không có két.", "neutral"],
      ],
      hotspots: [
        {
          id: "ket-sat",
          label: "Két sắt",
          rect: [60, 220, 200, 260],
          lines: [
            ["narr", "Két sắt điện tử cao ngang hông, cửa còn hé. Bên trong trống trơn, chỉ còn sợi dây thun đỏ buộc phong bì rớt lại."],
            ["me", "Màn hình két lưu nhật ký. \"18:32 – ĐÓNG – cài mã mới\". \"[[20h06|20:06]] – MỞ – mã đúng\". \"20:07 – ĐÓNG\". \"20:31 – MỞ – mã đúng\".", "neutral"],
            ["quanly", "20:31 là em mở để lấy phong bì ra sân khấu. Còn 20:06... em thề không phải em.", "shock"],
            ["me", "Mở bằng mã, không cạy, không phá. Người mở biết mã. Một phút là xong.", "neutral"],
          ],
          gives: { clues: ["log-ket"] },
          again: [["me", "Sợi dây thun đỏ vẫn nằm trong két. Một phút, mười hai phong bì.", "neutral"]],
        },
        {
          id: "man-hinh-camera-2",
          label: "Màn hình camera",
          rect: [330, 170, 240, 160],
          lines: [
            ["narr", "Màn hình chia bốn ô: cổng, bãi xe, sân khấu, hành lang."],
            ["me", "Ô hành lang: từ 19:46 trở đi chỉ thấy hoa mai vàng rực, kín khung hình. [[cay-mai|Cây mai]] che camera hoàn toàn.", "neutral"],
            ["me", "Ô sân khấu thì rõ. Tua lại 19:00, sếp Đạt phát biểu, có tiếng.", "neutral"],
            ["narr", "Trên màn hình, sếp Đạt cầm micro: \"Công ty là gia đình! Sếp không giấu anh em gì hết! Mã két tiền thưởng là sinh nhật sếp: một-hai-không-hai! Ai cũng biết, ai cũng tin nhau!\""],
            ["teo", "Ổng đọc mã két trên micro. Cả sảnh vỗ tay. Em cũng vỗ tay, lúc đó em đang ăn.", "shock"],
          ],
          gives: { clues: ["camera-mai", "video-phat-bieu"], words: ["ma-sinh-nhat"] },
          again: [["me", "Ô hành lang vẫn chỉ toàn hoa mai. Đẹp. Vô dụng.", "neutral"]],
        },
        {
          id: "so-dat-ban",
          label: "Sổ đặt bàn",
          rect: [600, 300, 150, 90],
          lines: [
            ["narr", "Cuốn sổ đặt bàn bìa đỏ, mở đúng trang hôm nay."],
            ["me", "\"Tiệc tất niên Cà Khịa Media. Người đặt: Đạt. 2 bàn, 1 sân khấu, 1 cây mai.\"", "neutral"],
            ["me", "Ghi chú khách, chữ sếp Đạt: \"Xếp cháu Khoa ngồi cạnh tôi. Phong bì đặc biệt (dày nhất, đỏ nhất) để trên cùng, tôi tự bốc sau cùng.\"", "neutral"],
            ["teo", "\"Cháu Khoa\"?! Khoa là cháu sếp hả? Vậy mà năm ngoái nó bị chửi như người dưng!", "shock"],
          ],
          gives: { clues: ["so-dat-ban"], words: ["khoa"] },
          again: [["me", "\"Tôi tự bốc sau cùng.\" Một câu ghi chú rất tự tin.", "neutral"]],
        },
        {
          id: "moc-chia-khoa",
          label: "Móc chìa khoá",
          rect: [800, 80, 120, 160],
          lines: [
            ["narr", "Bảng móc chìa khoá treo tường, mỗi móc một số. Móc số 7 ghi \"KÉT – DỰ PHÒNG\"."],
            ["me", "Chìa dự phòng còn treo, phủ một lớp bụi mịn nguyên vẹn. Không ai đụng tới nó cả tháng nay.", "neutral"],
            ["quanly", "Dạ chìa đó em còn quên là mình có.", "nervous"],
            ["me", "Vậy két được mở bằng mã, không phải bằng [[chia-du-phong|chìa dự phòng]].", "neutral"],
          ],
          again: [["teo", "Móc số 13 ghi \"CHÌA NHÀ VỆ SINH NỮ – ĐỪNG MƯỢN\". Ai mượn rồi mới ghi vậy chắc.", "smug"]],
        },
        {
          id: "bang-nhan-vien",
          label: "Bảng nhân viên",
          rect: [580, 40, 180, 130],
          lines: [
            ["narr", "Bảng khen: \"NHÂN VIÊN XUẤT SẮC THÁNG\". Mười hai tháng liền, mười hai tấm hình anh Lâm cười y chang nhau."],
            ["me", "Dưới bảng là nội quy in đậm: \"Quản lý KHÔNG được rời phòng khi có tiệc lớn. Vi phạm: mất danh hiệu.\"", "neutral"],
            ["teo", "Mười hai tháng liền xuất sắc. Ảnh mà mất danh hiệu chắc ảnh xỉu.", "shock"],
          ],
          again: [["me", "Mười hai nụ cười giống hệt nhau. Có người rất sợ mất cái bảng này.", "neutral"]],
        },
      ],
    },

    kitchen3: {
      name: "Bếp nhà hàng",
      scene: "kitchen3",
      needs: { any: ["seen:banquet.cay-mai", "seen:office2.ket-sat"] },
      intro: [
        ["narr", "Bếp nhà hàng nằm giữa hành lang, nóng hầm hập, khói lẩu mù mịt. Ai đi từ sảnh qua phòng quản lý cũng phải ngang cửa bếp."],
        ["teo", "Sếp ơi, mùi sả ớt làm em quên mất mình đang phá án.", "happy"],
      ],
      hotspots: [
        {
          id: "noi-lau",
          label: "Nồi lẩu",
          rect: [80, 180, 200, 170],
          lines: [
            ["narr", "Nồi lẩu to bằng cái lu, sôi sùng sục. Ông đầu bếp đứng khuấy bằng cái vá dài như mái chèo."],
            ["me", "Đầu bếp nói tối nay ổng đứng đây suốt, lưng quay ra cửa. Ồn quá, không nghe gì ngoài tiếng lẩu sôi.", "neutral"],
            ["teo", "Cho em xin một chén nước lèo làm chứng cứ được không chú?", "smug"],
          ],
          again: [["teo", "Nồi lẩu vẫn sôi. Em vẫn đói.", "nervous"]],
        },
        {
          id: "xe-day-mon",
          label: "Xe đẩy món",
          rect: [320, 300, 180, 160],
          lines: [
            ["narr", "Xe đẩy inox chở một cái bánh kem phủ kem trà sữa, rắc trân châu, chưa mang ra."],
            ["me", "Chữ trên bánh, nét cẩn thận như gõ code: \"Cảm ơn chị Vy. Nợ trà sữa đã trả xong (4/4).\"", "neutral"],
            ["me", "Phiếu dán xe: \"Khách bàn 2, áo hoodie xám. Vào bếp tự viết chữ lên bánh từ 20:03 tới 20:14. Dặn: mang ra sau bốc thăm, ĐỪNG nói ai đặt.\"", "neutral"],
            ["teo", "Áo hoodie xám! Bánh trà sữa! Không ai khác ngoài ảnh!", "happy"],
          ],
          gives: { clues: ["banh-kem-phong"] },
          again: [["teo", "Trân châu trên bánh xếp thành hình trái tim. Sếp, em cảm động mà em không liên quan.", "neutral"]],
        },
        {
          id: "thung-rac-bep",
          label: "Thùng rác bếp",
          rect: [540, 400, 110, 120],
          lines: [
            ["narr", "Thùng rác inox đầy vỏ sả, vỏ tôm. Trên cùng là một tờ giấy A4 bị vò nát, dính dầu."],
            ["me", "Bản nháp bài phát biểu của sếp Đạt. Gạch xoá chi chít.", "neutral"],
            ["me", "\"Ý 3: Nói mã két = sinh nhật sếp → nhân viên thấy sếp minh bạch.\" \"Ý 5: Giải đặc biệt năm nay, ai hên người đó (nháy mắt Khoa).\"", "neutral"],
            ["teo", "\"Nháy mắt Khoa\". Có ghi trong kịch bản luôn sếp ơi.", "shock"],
          ],
          gives: { clues: ["nhap-phat-bieu"] },
          again: [["teo", "Em không lục nữa đâu. Vỏ tôm đâm vô tay em rồi.", "nervous"]],
        },
        {
          id: "tu-dong",
          label: "Tủ đông",
          rect: [690, 120, 220, 300],
          lines: [
            ["narr", "Tủ đông inox ba cánh, mở ra là hơi lạnh phả trắng xoá. Bên trong chất đầy hải sản, thịt bò, hộp kem."],
            ["me", "Tủ đông to thế này, giấu một con voi con cũng được. Muốn mò thì phải biết đang tìm cái gì, ở ngăn nào.", "neutral"],
            ["teo", "Lạnh quá sếp. Ở đây giấu tiền thì tiền cũng đông đá.", "nervous"],
          ],
          again: [["teo", "Em không chui vô tủ đông đâu. Em có giới hạn.", "nervous"]],
        },
        {
          id: "bang-order",
          label: "Bảng order",
          rect: [500, 40, 170, 140],
          lines: [
            ["narr", "Máy in order dán phiếu lên bảng theo giờ. Mỗi phiếu ghi bàn, ghế, món, giờ đặt và giờ mang ra."],
            ["me", "Phiếu của bàn 2, ghế 1: \"Gỏi ngó sen – không đường, không dầu, không cảm xúc\".", "neutral"],
            ["me", "Giờ đặt: [[19h55|19:55]]. Giờ mang ra: [[20h06|20:06]]. Ghi chú khách: \"20:06 MỚI MANG RA, đừng mang sớm\".", "neutral"],
            ["teo", "\"Không cảm xúc\". Sếp, em biết ai hay ghi chữ này trên giấy dán bàn.", "smug"],
            ["me", "Một dĩa gỏi được [[dat-truoc|đặt trước, hẹn giờ mang ra]]. Ai lại hẹn giờ cho một dĩa gỏi?", "neutral"],
          ],
          gives: { clues: ["order-goi"] },
          again: [["me", "Đặt lúc 19:55, mang ra lúc 20:06. Mười một phút chờ một dĩa gỏi đã làm sẵn.", "neutral"]],
        },
        {
          id: "ngan-duoi-tu-dong",
          label: "Ngăn dưới tủ đông",
          rect: [700, 340, 200, 80],
          needs: "flag:phong-nghe-tit",
          lines: [
            ["narr", "Phong nghe tiếng \"tít tít\" ngay tủ đông. Thám tử mở ngăn dưới cùng, lật từng túi thịt đông."],
            ["me", "Kẹt dưới cùng: một túi zip, dán giấy \"SALAD – BÀN 2 – ĐỪNG ĐỤNG\". Bên trong không có rau.", "neutral"],
            ["me", "Mười hai [[phong-bi|phong bì]] đỏ, niêm phong còn nguyên. Và một cái [[nia-hong|nĩa nhựa hồng]], cán in chữ \"Ngày 1/30\".", "neutral"],
            ["teo", "TÌM THẤY RỒI! 50 triệu đông đá! Sếp ơi em sờ thử được không, em chưa từng sờ 50 triệu!", "shock"],
          ],
          gives: { clues: ["tui-phong-bi"], words: ["tu-dong"] },
          again: [["me", "Ngăn dưới giờ chỉ còn thịt bò đông đá. Phong bì đã về tay chị Vy.", "neutral"]],
        },
      ],
    },
  },

  clues: {
    "so-do-ghe": {
      name: "Sơ đồ chỗ ngồi",
      desc: "Chị Vy xếp, dán cửa sảnh. Bàn sếp: ghế 1 Đạt, ghế 2 Vy, ghế 3 Khoa, ghế 4 ông Kim, ghế 5 thám tử, ghế 6 Tèo. Bàn team: [[ghe-1|ghế 1]] (sát cây mai, gần cửa hành lang) là Phong, ghế 2 là Hằng, ghế 3–8 là sáu bạn mới.",
      detail: [["me", "Sơ đồ là kế hoạch. Còn người ta thật sự ngồi đâu thì phải nhìn ảnh.", "neutral"]],
    },
    "the-ten": {
      name: "Thẻ tên bị đổi",
      desc: "Bàn team: thẻ ghế 1 (sát cây mai) ghi \"HẰNG\", ghế 2 ghi \"PHONG\", ngược với sơ đồ. Mép thẻ có vết bút xoá, chữ cũ in hằn. Có người đã [[doi-cho|đổi chỗ ngồi]].",
    },
    "hop-salad-thieu-nia": {
      name: "Hộp salad thiếu nĩa",
      desc: "Trước ghế 1 bàn team: hộp salad nắp in \"Ngày 1/30\", hộp quen của Hằng. Ngăn đựng nĩa trống trơn.",
    },
    "thung-nong": {
      name: "Thùng bốc thăm nông bất thường",
      desc: "Thùng gỗ đỏ chữ \"LỘC\", sếp Đạt tự đem từ công ty. Bên ngoài cao nửa mét, mà phiếu thăm bên trong nằm rất nông, như đáy chỉ sâu hai gang tay.",
    },
    "log-ket": {
      name: "Nhật ký két sắt",
      desc: "18:32 ĐÓNG, cài mã mới. [[20h06|20:06]] MỞ bằng mã đúng. 20:07 ĐÓNG. 20:31 MỞ (anh Lâm, phát hiện trống). Không cạy, không phá.",
      detail: [["me", "Người mở két lúc 20:06 biết mã. Câu hỏi là: ai biết mã?", "neutral"]],
    },
    "camera-mai": {
      name: "Camera hành lang bị che",
      desc: "Từ 19:46, ô camera hành lang chỉ còn hoa mai. [[cay-mai|Cây mai]] bị dời tới trước [[cua-hanh-lang|cửa hành lang]], che kín ống kính.",
    },
    "video-phat-bieu": {
      name: "Video sếp Đạt phát biểu",
      desc: "Camera sân khấu, 19:00. Sếp Đạt cầm micro: \"Mã két tiền thưởng là sinh nhật sếp: một-hai-không-hai! Ai cũng biết, ai cũng tin nhau!\". Cả sảnh vỗ tay.",
      detail: [["me", "Từ 19 giờ, ai ngồi trong sảnh cũng biết [[ma-sinh-nhat|mã két là sinh nhật sếp]].", "neutral"]],
    },
    "so-dat-ban": {
      name: "Sổ đặt bàn",
      desc: "Người đặt: Đạt. Ghi chú chữ sếp: \"Xếp cháu Khoa ngồi cạnh tôi. Phong bì đặc biệt (dày nhất, đỏ nhất) để trên cùng, tôi tự bốc sau cùng.\"",
    },
    "nhap-phat-bieu": {
      name: "Bản nháp bài phát biểu",
      desc: "Vò nát trong thùng rác bếp. \"Ý 3: Nói mã két = sinh nhật sếp → nhân viên thấy sếp minh bạch.\" \"Ý 5: Giải đặc biệt năm nay, ai hên người đó (nháy mắt Khoa).\"",
    },
    "banh-kem-phong": {
      name: "Bánh kem trà sữa",
      desc: "Trên xe đẩy món. Chữ: \"Cảm ơn chị Vy. Nợ trà sữa đã trả xong (4/4).\" Phiếu: khách bàn 2 áo hoodie xám, tự viết chữ trong bếp từ 20:03 tới 20:14, dặn đừng nói ai đặt.",
    },
    "order-goi": {
      name: "Phiếu order dĩa gỏi",
      desc: "Bàn 2, ghế 1: gỏi ngó sen \"không đường, không dầu, không cảm xúc\". Đặt lúc [[19h55|19:55]], khách dặn \"[[20h06|20:06]] MỚI MANG RA\". Dĩa gỏi được [[dat-truoc|đặt trước, hẹn giờ mang ra]].",
      detail: [["me", "Ai đó muốn có một dĩa gỏi xuất hiện đúng lúc 20:06, như thể mình đang ngồi đó gọi món.", "neutral"]],
    },
    "anh-checkin": {
      name: "Ảnh check-in 18:55",
      desc: "Khoa chụp cả công ty lúc [[18h55|18:55]], gắn thẻ từng người theo chỗ. Bàn team: ghế sát cây mai gắn thẻ \"Hằng Kế Toán\", ghế kế bên \"Phong IT\". Bàn sếp: Đạt, Vy, Khoa sát sếp.",
      detail: [["me", "Hằng ngồi ghế 1, sát cây mai, gần cửa hành lang. Không phải ghế 2 như sơ đồ.", "neutral"]],
    },
    "anh-nang-ly": {
      name: "Ảnh nâng ly 20:02",
      desc: "Sếp Đạt đăng Facebook [[20h02|20:02]]: \"Nâng ly cùng anh em bàn team 🍻\". Sếp đứng giữa, cốc Best Boss đựng rượu nếp. Ghế sát cây mai: Hằng, áo dài đỏ, quàng một cái [[khan-long|khăn lông vũ trắng]], tay cầm ly nước detox. Ghế kế bên: Phong.",
    },
    "clip-khoa": {
      name: "Clip TikTok của Khoa",
      desc: "Quay trước cây mai từ 20:03 tới 20:15. Góc trái khung hình là [[cua-hanh-lang|cửa hành lang]]. 20:03: người áo hoodie xám đi vào. [[20h04|20:04]]: người áo dài đỏ quàng [[khan-long|khăn lông trắng]] lướt vào, quay lưng. 20:06: anh Lâm nhảy vào khung hình xin chụp chung. [[20h12|20:12]]: người quàng khăn lông trắng lướt ra. 20:14: người áo hoodie đi ra.",
      detail: [["me", "Dress code là áo dài đỏ, nửa sảnh mặc áo dài đỏ. Nhưng khăn lông trắng thì chỉ có một cái.", "neutral"]],
    },
    "selfie-vy": {
      name: "Selfie của chị Vy 20:10",
      desc: "Chị Vy đăng lúc [[20h10|20:10]]: \"#lanhmuonxiu ai mượn khăn trả chị 🥶\". Chị Vy ngồi ghế 2 bàn sếp, áo dài đỏ, vai trần, không khăn. Phía sau: bàn team, ghế sát cây mai trống trơn, dĩa gỏi ngó sen còn nguyên chưa ai đụng đũa. Ghế bên cạnh bị mặt chị Vy che mất.",
      detail: [["me", "20 giờ 10: chị Vy ngồi yên ở bàn sếp, không có khăn. Ghế 1 bàn team trống.", "neutral"]],
    },
    "buoc-chan": {
      name: "Thành tích bước chân của Hằng",
      desc: "App đồng hồ của Hằng tự đăng vào group chat \"Cà Khịa Fam\" lúc 20:15: \"🎉 Hằng đã đạt 8.000 bước lúc [[20h09|20:09]]!\". Biểu đồ: 19:00–20:03 gần như đứng yên, 20:04–20:12 vọt lên 900 bước, sau đó đứng yên.",
      detail: [["me", "Ngồi yên tại bàn mà đi 900 bước trong tám phút. Chiếc [[dong-ho-buoc|đồng hồ đếm bước]] không biết nói dối.", "neutral"]],
    },
    "lich-su-giai": {
      name: "Lịch sử giải đặc biệt",
      desc: "Theo chị Vy: năm kia giải đặc biệt thuộc về \"Nguyễn Đăng Khoa – khách mời\". Năm ngoái: \"Nguyễn Đăng Khoa – cộng tác viên\", trúng xe máy. Cả hai lần sếp Đạt tự tay bốc.",
    },
    "day-doi": {
      name: "Thùng bốc thăm hai đáy",
      desc: "Xoay núm gỗ dưới đáy, một ngăn bí mật trượt ra: hai mươi phiếu thăm hồng nhạt gấp sẵn, tờ nào cũng ghi \"Nguyễn Đăng Khoa\". Phiếu thường màu trắng nằm ở lớp trên. Một cái [[day-doi|thùng hai đáy]].",
    },
    "tui-phong-bi": {
      name: "Túi phong bì trong tủ đông",
      desc: "Ngăn dưới cùng [[tu-dong|tủ đông]] bếp: túi zip dán \"SALAD – BÀN 2 – ĐỪNG ĐỤNG\". Bên trong: mười hai [[phong-bi|phong bì]] đỏ còn niêm phong, và một [[nia-hong|nĩa nhựa hồng]] cán in \"Ngày 1/30\".",
      detail: [["me", "Nĩa hồng \"Ngày 1/30\". Hộp salad trên bàn team, nắp \"Ngày 1/30\", đang thiếu đúng một cái nĩa.", "neutral"]],
    },
  },

  words: {
    hang: { text: "Hằng", kind: "ai" },
    phong: { text: "Phong", kind: "ai" },
    khoa: { text: "Khoa", kind: "ai" },
    dat: { text: "sếp Đạt", kind: "ai" },
    lam: { text: "anh Lâm", kind: "ai" },
    vy: { text: "chị Vy", kind: "ai" },

    "18h55": { text: "18 giờ 55", kind: "luc" },
    "19h55": { text: "19 giờ 55", kind: "luc" },
    "20h02": { text: "20 giờ 02", kind: "luc" },
    "20h04": { text: "20 giờ 04", kind: "luc" },
    "20h06": { text: "20 giờ 06", kind: "luc" },
    "20h09": { text: "20 giờ 09", kind: "luc" },
    "20h10": { text: "20 giờ 10", kind: "luc" },
    "20h12": { text: "20 giờ 12", kind: "luc" },
    "21h": { text: "21 giờ (giờ bốc thăm)", kind: "luc" },

    "cay-mai": { text: "cây mai", kind: "o" },
    "cua-hanh-lang": { text: "cửa hành lang", kind: "o" },
    "tu-dong": { text: "tủ đông bếp", kind: "o" },
    "ghe-1": { text: "ghế 1 bàn team", kind: "o" },
    "phong-quan-ly": { text: "phòng quản lý", kind: "o" },
    toilet: { text: "nhà vệ sinh", kind: "o" },

    "khan-long": { text: "khăn lông vũ trắng", kind: "vat" },
    "nia-hong": { text: "nĩa nhựa hồng", kind: "vat" },
    "phong-bi": { text: "phong bì đỏ", kind: "vat" },
    "banh-kem": { text: "bánh kem trà sữa", kind: "vat" },
    "dong-ho-buoc": { text: "đồng hồ đếm bước", kind: "vat" },

    "ma-sinh-nhat": { text: "mã két là sinh nhật sếp", kind: "cach" },
    "chia-du-phong": { text: "chìa dự phòng", kind: "cach" },
    "dat-truoc": { text: "đặt món trước, hẹn giờ mang ra", kind: "cach" },
    "doi-cho": { text: "đổi chỗ ngồi", kind: "cach" },
    "day-doi": { text: "thùng hai đáy", kind: "cach" },
    "muon-khan": { text: "mượn khăn choàng", kind: "cach" },

    "vach-tran": { text: "vạch trần bốc thăm gian lận", kind: "vi" },
    "can-tien": { text: "cần tiền ăn Tết", kind: "vi" },
    "tra-on": { text: "trả ơn đồng nghiệp", kind: "vi" },
    "giau-ho-hang": { text: "giấu chuyện là cháu sếp", kind: "vi" },
    "ghen-giai": { text: "ghen tị vì không trúng giải", kind: "vi" },
  },

  talks: {
    vy: [
      {
        id: "ke-lai",
        topic: "Kể lại chuyện phong bì",
        lines: [
          ["vy", "6 giờ rưỡi, Hằng với anh Lâm đếm tiền trong phòng quản lý. 50 triệu, mười hai phong bì, cột dây thun đỏ. Bỏ vô két.", "neutral"],
          ["vy", "Bảy giờ anh Đạt phát biểu. Bảy rưỡi văn nghệ. Tám giờ nâng ly. Chín giờ bốc thăm.", "neutral"],
          ["vy", "8 giờ 31 anh Lâm chạy vô, két trống. Từ lúc đó tôi khoá cửa sảnh. Ai đi vệ sinh tôi đi theo tới cửa.", "angry"],
          ["teo", "Chị Vy làm trưởng phòng mà như trưởng trại giam.", "nervous"],
          ["vy", "Cảm ơn em. Tôi coi đó là lời khen.", "neutral"],
        ],
        gives: { words: ["vy", "phong-quan-ly"] },
      },
      {
        id: "selfie",
        topic: "Tối nay chị có chụp hình không?",
        lines: [
          ["vy", "Tôi là trưởng phòng Content. Tôi chụp mọi thứ. Tấm gần nhất là 8 giờ 10, ngồi ở bàn sếp.", "neutral"],
          ["vy", "Đây. Máy lạnh 18 độ, tôi lạnh tới mức phải đăng hashtag.", "neutral"],
          ["me", "Phía sau chị, bàn team. Ghế sát cây mai đang trống.", "neutral"],
          ["vy", "Tôi chụp mặt tôi. Tôi không chụp ghế của người khác.", "neutral"],
        ],
        gives: { clues: ["selfie-vy"] },
      },
      {
        id: "khan",
        topic: "Cái khăn lông trắng của chị",
        needs: { any: ["clue:clip-khoa", "clue:selfie-vy"] },
        lines: [
          ["vy", "Khăn của tôi. Hàng Ý. Đừng hỏi giá.", "neutral"],
          ["vy", "Khoảng 7 giờ 50 có người than lạnh, [[muon-khan|mượn khăn choàng]] của tôi. 8 giờ 20 trả lại, vắt lên ghế.", "neutral"],
          ["me", "Ai mượn?", "neutral"],
          ["vy", "Lúc đó tôi vừa uống hai ly rượu nếp với anh Đạt... Tôi chỉ nhớ người đó mặc áo dài đỏ.", "nervous"],
          ["teo", "Nửa sảnh mặc áo dài đỏ đó chị.", "nervous"],
          ["vy", "Thì đó là lý do tôi thuê thám tử.", "angry"],
        ],
      },
      {
        id: "lich-su",
        topic: "Mấy năm trước ai trúng giải đặc biệt?",
        needs: "seen:banquet.thung-boc-tham",
        lines: [
          ["vy", "Năm kia, giải đặc biệt: \"Nguyễn Đăng Khoa – khách mời\". Không ai biết khách mời của ai.", "neutral"],
          ["vy", "Năm ngoái: \"Nguyễn Đăng Khoa – cộng tác viên\". Trúng xe máy. Hai tháng sau Khoa vô thực tập.", "neutral"],
          ["vy", "Anh Đạt nói \"thằng nhỏ hên\". Tôi ghi lại câu đó. Tôi ghi lại mọi câu của anh Đạt.", "neutral"],
          ["teo", "Hai năm liền, một cái tên. Hên dữ vậy chắc đi mua vé số luôn chị. Có ai trong công ty [[ghen-giai|ghen tị vì không trúng giải]] không ta?", "shock"],
        ],
        gives: { clues: ["lich-su-giai"] },
      },
      {
        id: "group-chat",
        topic: "Group chat \"Cà Khịa Fam\" tối nay",
        needs: "flag:phong-nghe-tit",
        lines: [
          ["me", "Phong nghe tiếng đồng hồ báo 8.000 bước. Group chat công ty tối nay có ai đăng bước chân không?", "neutral"],
          ["vy", "Có. App của Hằng tự đăng, ngày nào cũng đăng, cả công ty tắt thông báo hết rồi.", "neutral"],
          ["vy", "Đây. 20 giờ 15: \"Hằng đã đạt 8.000 bước lúc 20:09\". Có cả biểu đồ.", "neutral"],
          ["vy", "...Ủa. Từ 8 giờ 04 tới 8 giờ 12, vọt lên 900 bước. Ngồi ăn gỏi mà đi 900 bước?", "shock"],
        ],
        gives: { clues: ["buoc-chan"] },
      },
      {
        id: "phong",
        topic: "Chị với Phong giờ sao rồi?",
        lines: [
          ["vy", "Bình thường. Tôi trả đủ bốn ly. Tôi điền tên mình vào lịch trực thứ Tư. Tôi không còn quên.", "neutral"],
          ["vy", "Tối nay tụi tôi song ca \"Ly Trà Sữa Đã Nguội\". Ảnh hát lệch tông, tôi cũng không chê.", "neutral"],
          ["teo", "Từ tuyên chiến thành song ca. Em muốn khóc mà miệng đang nhai.", "happy"],
        ],
      },
    ],

    khoa: [
      {
        id: "cho-ngoi",
        topic: "Sao em ngồi bàn sếp?",
        lines: [
          ["khoa", "Dạ em cũng không biết. Chị Vy xếp. Chị nói anh Đạt dặn \"cho thằng nhỏ ngồi gần, học hỏi\".", "nervous"],
          ["khoa", "Em ngồi kế sếp suốt buổi, sếp gắp cho em ba miếng sườn. Em sợ quá em ăn hết.", "nervous"],
          ["me", "Em với sếp Đạt có quan hệ gì không?", "neutral"],
          ["khoa", "Dạ không! Không có gì hết! Em được nhận là nhờ CV! CV của em có... có kỹ năng Word!", "shock"],
        ],
        gives: { stmts: ["khoa-khong-ho-hang"] },
      },
      {
        id: "checkin",
        topic: "Ảnh check-in đầu tiệc",
        lines: [
          ["khoa", "Dạ em chụp lúc 6 giờ 55, cả công ty, có gắn thẻ từng người cho chị Vy đăng fanpage.", "happy"],
          ["khoa", "Anh coi nè, em gắn đúng chỗ từng người ngồi. Em làm content mà anh.", "neutral"],
          ["teo", "Em ghi \"Tèo (khách)\" mà sao thẻ em nằm ngay nồi lẩu vậy Khoa?", "nervous"],
          ["khoa", "Dạ tại anh ngồi đó... ăn.", "nervous"],
        ],
        gives: { clues: ["anh-checkin"] },
      },
      {
        id: "cay-mai",
        topic: "Ai dời cây mai?",
        needs: "seen:banquet.cay-mai",
        lines: [
          ["khoa", "Dạ... em. Em nhờ anh phục vụ dời lúc 7 giờ 45. Làm nền TikTok. Cây mai đẹp, đèn đẹp.", "nervous"],
          ["khoa", "Em đâu biết sau cành mai có camera! Em thề! Em không phải thủ phạm! Em còn chưa nhận lương tháng này!", "shock"],
          ["teo", "Em run như cây mai gặp gió đó Khoa.", "smug"],
        ],
      },
      {
        id: "tiktok",
        topic: "Clip TikTok lúc 8 giờ",
        needs: "seen:banquet.cay-mai",
        lines: [
          ["khoa", "Dạ em quay từ 8 giờ 03 tới 8 giờ 15, trước cây mai. Tập 7: \"Tất niên của nhân viên chính thức\".", "neutral"],
          ["khoa", "Anh Lâm còn nhảy vô xin chụp chung. Anh coi đi, góc trái có cái cửa hành lang á.", "neutral"],
          ["me", "Dừng. Tua lại 20 giờ 04. Người quàng khăn lông trắng, đi vào cửa hành lang.", "neutral"],
          ["khoa", "Dạ? Em không để ý. Em đang nhìn mặt em.", "nervous"],
        ],
        gives: { clues: ["clip-khoa"], words: ["20h04"] },
      },
      {
        id: "giai-dac-biet",
        topic: "Giải đặc biệt hai năm trước",
        needs: "broke:khoa-khong-ho-hang",
        lines: [
          ["khoa", "Năm kia mẹ em dẫn em đi ké, cậu Đạt nói ghi tên \"khách mời\" bốc cho vui. Em trúng.", "nervous"],
          ["khoa", "Năm ngoái cậu nói ghi \"cộng tác viên\". Em lại trúng. Em tưởng em hên thiệt. Em còn khoe trên TikTok.", "nervous"],
          ["khoa", "Mẹ em nói em hên giống cậu. Cậu nói em hên giống mẹ. Không ai nói em hên giống... cái thùng.", "shock"],
        ],
      },
    ],

    phong: [
      {
        id: "tam-gio",
        topic: "Lúc 8 giờ anh ở đâu?",
        lines: [
          ["phong", "Ở bàn. Ghế 2. Cắn ống hút.", "neutral"],
          ["me", "Từ 8 giờ tới 8 rưỡi?", "neutral"],
          ["phong", "Không đi đâu. Lẩu ngon. Không có lý do đứng dậy.", "neutral"],
          ["teo", "Ảnh trả lời ngắn như log hệ thống.", "smug"],
        ],
        gives: { stmts: ["phong-o-ban"], words: ["phong"] },
      },
      {
        id: "van-nghe",
        topic: "Tiết mục song ca với chị Vy",
        lines: [
          ["phong", "Chị Vy rủ. Tôi tưởng chị giỡn. Chị in lời bài hát, bọc nhựa, đưa tôi tập ba tuần.", "neutral"],
          ["phong", "Tôi hát lệch tông câu điệp khúc. \"Ly trà sữa đã nguội, như lời hứa năm nào\". Chị Vy không chê.", "neutral"],
          ["phong", "Lần đầu chị không chê cái gì của tôi.", "nervous"],
        ],
      },
      {
        id: "ma-ket",
        topic: "Anh có biết mã két không?",
        lines: [
          ["phong", "Cả sảnh biết. Sếp đọc trên micro. Một-hai-không-hai.", "neutral"],
          ["phong", "Tôi IT. Nghe xong tôi muốn chết. Mã là sinh nhật, đọc công khai, có ghi hình. Ba lỗi bảo mật trong một câu.", "angry"],
          ["teo", "Năm ngoái pass dán tủ server, năm nay mã két đọc trên micro. Công ty này đều đặn ghê.", "smug"],
        ],
      },
      {
        id: "trong-bep",
        topic: "Trong bếp anh nghe thấy gì?",
        needs: "broke:phong-o-ban",
        lines: [
          ["phong", "Tôi đứng góc làm bánh, quay lưng ra cửa, đeo một bên tai nghe. Viết chữ lên kem khó lắm, không được run.", "neutral"],
          ["phong", "Khoảng 8 giờ 09, ngay phía tủ đông, có giọng robot: \"Chúc mừng! Bạn đã đạt 8.000 bước!\". Rồi tiếng tủ đông đóng cái rầm.", "neutral"],
          ["phong", "Tôi tưởng điện thoại ai. Không quay lại. Chữ \"Vy\" đang viết dở, quay lại là méo.", "nervous"],
          ["me", "8.000 bước. Một cái [[dong-ho-buoc|đồng hồ đếm bước]]. Ngay [[tu-dong|tủ đông bếp]].", "neutral"],
        ],
        gives: { flags: ["phong-nghe-tit"], words: ["20h09"] },
      },
    ],

    hang: [
      {
        id: "tam-gio",
        topic: "Lúc 8 giờ chị ở đâu?",
        lines: [
          ["hang", "Ở bàn. Từ 8 giờ tới 8 rưỡi chị ngồi yên, không nhúc nhích.", "neutral"],
          ["hang", "8 giờ 06 chị còn gọi dĩa gỏi ngó sen. Em ra bếp hỏi đi, hoá đơn có giờ hẳn hoi. Kế toán là phải có chứng từ.", "neutral"],
          ["teo", "Chị nói chuyện như nộp báo cáo thuế.", "nervous"],
        ],
        gives: { stmts: ["hang-goi-mon"], words: ["hang"] },
      },
      {
        id: "an-kieng",
        topic: "Thử thách ăn kiêng năm nay",
        lines: [
          ["hang", "Ngày 1 trên 30. Lần thứ bảy. Lần này chị nghiêm túc.", "neutral"],
          ["hang", "Năm nay chị thêm đồng hồ đếm bước, mỗi ngày 8.000 bước. App tự đăng lên group chat, cả công ty làm chứng.", "neutral"],
          ["hang", "Tiệc tất niên là thử thách lớn nhất. Chị mang hộp salad riêng, nĩa riêng. Không ai được đụng.", "neutral"],
          ["teo", "Chị đi tất niên mang salad như đi đám cưới mang nồi cơm nhà.", "smug"],
        ],
        gives: { words: ["dong-ho-buoc"] },
      },
      {
        id: "dem-tien",
        topic: "Chị đếm tiền với anh Lâm lúc 6 giờ rưỡi",
        lines: [
          ["hang", "50 triệu. Một phong bì 20 triệu giải đặc biệt, hai phong bì 5 triệu, bốn phong bì 2 triệu rưỡi, năm phong bì 2 triệu. Mười hai phong bì.", "neutral"],
          ["hang", "Chị đếm hai lần, anh Lâm đếm một lần. Sếp Đạt đứng ngoài cửa đọc mã cho anh Lâm cài.", "neutral"],
          ["hang", "Tiền công ty, đúng từng đồng. Chị chưa bao giờ sai một đồng nào.", "neutral"],
          ["me", "Chị biết mã?", "neutral"],
          ["hang", "...Lúc đó chị quay mặt đi. Kế toán không được nhìn mã két. Nguyên tắc.", "nervous"],
        ],
      },
      {
        id: "ghe-trong",
        topic: "Ghế trống trong ảnh chị Vy",
        needs: ["broke:hang-goi-mon", "clue:selfie-vy"],
        lines: [
          ["me", "Selfie chị Vy lúc 8 giờ 10: ghế sát cây mai bàn team trống, dĩa gỏi còn nguyên.", "neutral"],
          ["hang", "Ghế sát cây mai là ghế 1. Sơ đồ chị Vy dán ở cửa kìa: ghế 1 là của Phong.", "neutral"],
          ["hang", "Chị ngồi ghế 2. Ghế của chị bị mặt chị Vy che mất trong hình thôi.", "smug"],
          ["teo", "Ủa, vậy dĩa gỏi của chị nằm ở ghế Phong hả?", "nervous"],
          ["hang", "Phục vụ đặt nhầm. Nhà hàng đông mà em.", "neutral"],
        ],
        gives: { stmts: ["hang-ghe-2"] },
      },
      {
        id: "boc-tham",
        topic: "Chị nghĩ sao về chuyện bốc thăm?",
        needs: "clue:lich-su-giai",
        lines: [
          ["hang", "Chị là kế toán. Chị chỉ biết chi. Chi xe máy, chi phong bì, chi tiền in phiếu.", "neutral"],
          ["hang", "Năm nào cũng có một hoá đơn in phiếu thăm hơi lạ. Chị hỏi, sếp nói \"công ty là gia đình\".", "angry"],
          ["hang", "Em đi hỏi sếp Đạt đi. Hỏi kỹ cái thùng ấy.", "angry"],
        ],
      },
    ],

    dat: [
      {
        id: "tam-gio",
        topic: "Lúc 8 giờ anh ở đâu?",
        lines: [
          ["dat", "Đi từng bàn nâng ly! Sếp mà không đi nâng ly là mất lòng anh em.", "happy"],
          ["dat", "Đây, anh đăng Facebook lúc 8 giờ 02, nâng ly với bàn team. Ba mươi like rồi. Toàn đối tác.", "smug"],
          ["teo", "Sếp nâng cốc \"Best Boss\" đựng rượu nếp. Sếp không uống được sữa mà uống rượu nếp được hả sếp?", "neutral"],
          ["dat", "Rượu nếp là nếp, không phải sữa! Em học sinh học lại đi!", "angry"],
        ],
        gives: { clues: ["anh-nang-ly"], words: ["dat"] },
      },
      {
        id: "ma-ket",
        topic: "Ai biết mã két?",
        lines: [
          ["dat", "Chỉ anh với anh Lâm. Anh đọc cho ảnh cài, đứng ngoài cửa, không ai nghe.", "neutral"],
          ["dat", "Bảo mật tuyệt đối. Anh làm sếp hai mươi năm, anh hiểu bảo mật.", "smug"],
          ["teo", "Sếp ơi, em nghe câu này mà tai em nóng lên.", "nervous"],
        ],
        gives: { stmts: ["dat-ma-ket"] },
      },
      {
        id: "boc-tham",
        topic: "Bốc thăm tổ chức thế nào?",
        lines: [
          ["dat", "Phiếu ghi tên mọi người bỏ vô thùng \"LỘC\". Giải nhỏ cho anh em lên bốc. Giải đặc biệt sếp tự tay bốc, trước mặt mọi người.", "neutral"],
          ["dat", "Công bằng tuyệt đối. Năm nào cũng vậy. Ai hên người đó.", "smug"],
          ["teo", "Sếp nói \"ai hên người đó\" mà sao em nghe như \"ai hên thì sếp biết\".", "smug"],
        ],
        gives: { stmts: ["dat-cong-bang"] },
      },
      {
        id: "phat-bieu",
        topic: "Sao anh đọc mã két trên micro?",
        needs: "broke:dat-ma-ket",
        lines: [
          ["dat", "Minh bạch! Năm ngoái có đứa nói sau lưng là bốc thăm có mờ ám. Anh muốn cho cả công ty thấy sếp không giấu gì!", "angry"],
          ["dat", "Anh tưởng đọc mã két thì ai cũng tin anh hơn. Ai ngờ ai cũng... biết mã.", "nervous"],
          ["teo", "Sếp minh bạch nhầm chỗ rồi sếp.", "smug"],
        ],
      },
    ],

    quanly: [
      {
        id: "ket",
        topic: "Anh giữ két thế nào?",
        lines: [
          ["quanly", "Dạ quý khách, két điện tử, mã bốn số, có nhật ký. 6 giờ 32 em cài mã mới theo anh Đạt đọc.", "neutral"],
          ["quanly", "Chị Hằng đếm tiền, em ký biên bản. Mười hai phong bì, cột dây thun đỏ. Dạ em giữ két 7 năm chưa mất một đồng.", "neutral"],
          ["teo", "Bảy năm chưa mất. Năm thứ tám mất 50 triệu. Thống kê buồn quá anh.", "nervous"],
        ],
        gives: { words: ["lam"] },
      },
      {
        id: "tam-gio",
        topic: "Từ 8 giờ tới 8 rưỡi anh ở đâu?",
        lines: [
          ["quanly", "Dạ em ngồi trong phòng quản lý, không rời nửa bước. Nội quy nhà hàng ạ.", "neutral"],
          ["quanly", "Em ngồi ngay đó, không ai vô được. Dạ em canh két như canh con.", "neutral"],
          ["me", "Vậy nếu có ai mở két, anh phải thấy?", "neutral"],
          ["quanly", "Dạ... dạ chắc vậy. Trừ lúc em... chớp mắt hơi lâu.", "nervous"],
        ],
        gives: { stmts: ["lam-o-phong"] },
      },
      {
        id: "thung",
        topic: "Thùng bốc thăm ai đem tới?",
        needs: "seen:banquet.thung-boc-tham",
        lines: [
          ["quanly", "Dạ anh Đạt tự ôm từ công ty tới, dặn nhân viên em không ai được đụng.", "neutral"],
          ["quanly", "Mà chiều nay em dời nó lên sân khấu, lỡ tay làm nghiêng. Nghe bên trong lục cục như có hai lớp, lớp dưới trượt qua trượt lại.", "neutral"],
          ["quanly", "Em tưởng thùng hư. Dạ em không dám hỏi khách.", "nervous"],
          ["teo", "Hai lớp! Thùng hai lớp như bánh kem hai tầng!", "shock"],
        ],
        gives: { flags: ["lam-thung-2-lop"] },
      },
      {
        id: "cay-mai",
        topic: "Ai dời cây mai?",
        needs: "seen:banquet.cay-mai",
        lines: [
          ["quanly", "Dạ cậu trẻ ngồi bàn sếp nhờ, lúc 7 giờ 45. Cậu nói làm nền TikTok, có tag nhà hàng.", "neutral"],
          ["quanly", "Em đồng ý liền. Có tag nhà hàng là em đồng ý hết.", "happy"],
          ["me", "Và cây mai che mất camera hành lang.", "neutral"],
          ["quanly", "Dạ... dạ đó là hậu quả em chưa tính tới.", "nervous"],
        ],
      },
      {
        id: "truoc-cay-mai",
        topic: "Anh làm gì trước cây mai lúc 8 giờ 06?",
        needs: "broke:lam-o-phong",
        lines: [
          ["quanly", "Dạ lúc em đứng trước cây mai chụp hình, có người lướt qua sau lưng em vô cửa hành lang.", "neutral"],
          ["quanly", "Khăn lông bay trúng gáy em, nhột lắm. Em tưởng con mèo. Em không quay lại vì đang cười cho đẹp.", "nervous"],
          ["quanly", "Mùi nước hoa thì không có. Chỉ có mùi... gỏi ngó sen.", "neutral"],
          ["teo", "Mùi gỏi ngó sen! Anh Lâm có cái mũi của nhân viên xuất sắc!", "shock"],
        ],
      },
    ],
  },

  stmts: {
    "hang-goi-mon": {
      by: "hang",
      text: "Từ 8 giờ tới 8 rưỡi chị ngồi yên tại bàn. 8 giờ 06 chị còn gọi dĩa gỏi ngó sen, hoá đơn có giờ.",
      break: {
        clue: "order-goi",
        lines: [
          ["me", "Phiếu order: dĩa gỏi đặt lúc 19 giờ 55, khách dặn \"20:06 mới mang ra\". Chị không gọi lúc 8 giờ 06. Chị hẹn giờ cho nó tới.", "neutral"],
          ["hang", "...Thì chị đặt trước cho tiện. Đông khách, sợ chờ lâu.", "nervous"],
          ["me", "Đặt trước mười một phút, cho một dĩa gỏi làm sẵn. Để lúc 8 giờ 06 có người thấy gỏi tới bàn chị.", "neutral"],
          ["hang", "Chị vẫn ngồi đó. Hoá đơn không chứng minh chị đứng dậy.", "angry"],
          ["teo", "Chị Hằng cãi bằng giọng kế toán, nghe như sắp bị phạt thuế.", "nervous"],
        ],
        gives: { words: ["dat-truoc", "19h55"], flags: ["goi-hen-gio"] },
      },
    },
    "hang-ghe-2": {
      by: "hang",
      text: "Chị ngồi ghế 2 theo sơ đồ. Ghế trống sát cây mai trong ảnh là ghế 1, ghế của Phong.",
      break: {
        clue: "anh-checkin",
        lines: [
          ["me", "Ảnh check-in 18 giờ 55, Khoa gắn thẻ: ghế sát cây mai là \"Hằng Kế Toán\", ghế kế bên là \"Phong IT\".", "neutral"],
          ["me", "Chị đổi chỗ với Phong từ trước khi tiệc bắt đầu. Ghế trống lúc 8 giờ 10 là ghế của chị.", "neutral"],
          ["hang", "...Chị đổi chỗ cho gần cửa. Chị uống nước detox nhiều, đi vệ sinh hoài.", "nervous"],
          ["hang", "Ừ thì chị đi vệ sinh. Năm phút. Đi vệ sinh cũng phải khai báo hả em?", "angry"],
          ["teo", "Câu này năm ngoái anh Phong cũng nói y chang. Công ty này có bài văn mẫu.", "smug"],
        ],
        gives: { words: ["ghe-1", "toilet"], flags: ["hang-roi-ghe"] },
      },
    },
    "phong-o-ban": {
      by: "phong",
      text: "Từ 8 giờ tới 8 rưỡi tôi ngồi ở bàn, ghế 2. Không đi đâu.",
      break: {
        clue: "banh-kem-phong",
        lines: [
          ["me", "Bánh kem trà sữa trên xe đẩy. \"Cảm ơn chị Vy. Nợ trà sữa đã trả xong (4/4).\" Khách áo hoodie xám tự viết chữ trong bếp, 20 giờ 03 tới 20 giờ 14.", "neutral"],
          ["phong", "...", "shock"],
          ["phong", "Đừng nói với chị Vy. Bánh để sau bốc thăm mới mang ra. Bất ngờ mà lộ thì hết bất ngờ.", "nervous"],
          ["phong", "Chị trả đủ bốn ly. Tôi muốn trả lại một cái bánh. [[tra-on|Trả ơn đồng nghiệp]], vậy thôi.", "nervous"],
          ["teo", "Anh Phong năm ngoái uống trộm, năm nay làm bánh lén. Anh tiến bộ thần tốc!", "happy"],
        ],
        gives: { words: ["banh-kem"], flags: ["phong-trong-bep"] },
      },
    },
    "lam-o-phong": {
      by: "quanly",
      text: "Từ 8 giờ tới 8 rưỡi tôi ngồi trong phòng quản lý, không rời nửa bước, không ai vô được.",
      break: {
        clue: "clip-khoa",
        lines: [
          ["me", "Clip TikTok của Khoa, 20 giờ 06. Anh đứng trước cây mai, giơ hai ngón tay, xin chụp chung. Cách phòng quản lý cả cái hành lang.", "neutral"],
          ["quanly", "...", "shock"],
          ["quanly", "Dạ em là fan của Khoa. Series \"1 ngày làm thực tập sinh\", em coi hết 47 tập. Em muốn có một tấm hình chung.", "nervous"],
          ["quanly", "Nội quy cấm rời phòng khi có tiệc lớn. Em sợ mất danh hiệu nhân viên xuất sắc tháng thứ mười ba. Nên em nói dối.", "nervous"],
          ["teo", "Anh Lâm đổi danh hiệu lấy một tấm selfie. Fan cứng có khác.", "smug"],
        ],
        gives: { words: ["20h12"], flags: ["phong-ql-trong"] },
      },
    },
    "khoa-khong-ho-hang": {
      by: "khoa",
      text: "Em với sếp Đạt không có họ hàng gì hết. Em được nhận nhờ CV.",
      break: {
        clue: "so-dat-ban",
        lines: [
          ["me", "Sổ đặt bàn, chữ sếp Đạt: \"Xếp cháu Khoa ngồi cạnh tôi.\"", "neutral"],
          ["khoa", "...Dạ. Cậu Đạt là cậu ruột em. Em là con chị Hai của cậu.", "nervous"],
          ["khoa", "Em [[giau-ho-hang|giấu chuyện là cháu sếp]] vì sợ mọi người nói em con ông cháu cha. Em muốn tự làm.", "nervous"],
          ["khoa", "Mà cậu khó với em nhất công ty. Lương thực tập ba triệu. Cậu nói \"cháu thì càng phải khổ\".", "nervous"],
          ["teo", "Khổ mà năm nào cũng trúng giải đặc biệt. Khổ có chọn lọc.", "smug"],
        ],
        gives: { flags: ["khoa-la-chau"] },
      },
    },
    "dat-ma-ket": {
      by: "dat",
      text: "Mã két chỉ có anh với anh Lâm biết. Bảo mật tuyệt đối.",
      break: {
        clue: "video-phat-bieu",
        lines: [
          ["me", "Camera sân khấu, 19 giờ: \"Mã két tiền thưởng là sinh nhật sếp: một-hai-không-hai! Ai cũng biết!\". Cả sảnh vỗ tay.", "neutral"],
          ["dat", "...Ơ. Anh có nói vậy hả. Lúc đó anh hơi xúc động.", "nervous"],
          ["me", "Anh vừa nói chỉ hai người biết mã. Trên micro, anh nói \"ai cũng biết\".", "neutral"],
          ["dat", "Thì... minh bạch! Anh muốn anh em tin anh! Ai ngờ tụi nó nhớ thiệt.", "angry"],
          ["teo", "Vậy là cả sảnh biết mã két. Kể cả em. Em đang ăn mà em vẫn nhớ.", "nervous"],
        ],
        gives: { flags: ["ai-cung-biet-ma"] },
      },
    },
    "dat-cong-bang": {
      by: "dat",
      text: "Bốc thăm năm nào cũng công bằng tuyệt đối. Giải đặc biệt anh tự tay bốc, ai hên người đó.",
      break: {
        clue: "day-doi",
        lines: [
          ["me", "Đáy thùng \"LỘC\" có ngăn bí mật. Hai mươi phiếu hồng gấp sẵn, tờ nào cũng ghi \"Nguyễn Đăng Khoa\".", "neutral"],
          ["dat", "...", "shock"],
          ["dat", "Thằng Khoa là cháu anh. Chị Hai anh than nó học xong không ai nhận. Anh nhận vô, mà không dám trả lương cao, sợ người ta nói.", "nervous"],
          ["dat", "Nên anh... bù cho nó bằng giải đặc biệt. Năm kia, năm ngoái. Anh tự bốc, tay anh thò xuống ngăn dưới. Không ai biết.", "nervous"],
          ["khoa", "Cậu... cậu nói em hên mà cậu...", "shock"],
          ["teo", "Vậy người lấy phong bì là muốn [[vach-tran|vạch trần bốc thăm gian lận]]! Không có phong bì thì không có bốc thăm, không có bốc thăm thì sếp khỏi thò tay!", "shock"],
        ],
        gives: { flags: ["sep-gian-lan"] },
      },
    },
  },

  present: {
    vy: {
      "anh-nang-ly": [
        ["vy", "Cái khăn đó... của tôi. Hằng quàng cái khăn của tôi.", "shock"],
        ["vy", "Vậy người mượn khăn lúc 7 giờ 50 là Hằng. Tôi chỉ nhớ người đó nói \"lạnh quá chị ơi\" bằng giọng... đọc số liệu.", "nervous"],
      ],
      "banh-kem-phong": [
        ["vy", "...Bánh trà sữa? Ghi tên tôi?", "shock"],
        ["vy", "Đừng nhìn tôi. Máy lạnh làm mắt tôi cay.", "nervous"],
        ["teo", "Máy lạnh 18 độ mà mắt cay. Chị Vy cảm động rồi.", "smug"],
      ],
      "day-doi": [
        ["vy", "Hai năm. Tôi đứng dưới sân khấu vỗ tay hai năm.", "angry"],
        ["vy", "Tôi ghi âm hết. Anh Đạt sẽ nghe lại giọng mình nói \"thằng nhỏ hên\" mỗi sáng thứ Hai.", "angry"],
      ],
    },
    khoa: {
      "camera-mai": [
        ["khoa", "Dạ em không cố ý che camera! Em chỉ muốn có background đẹp! Background đẹp thì clip mới nổi anh!", "shock"],
        ["khoa", "Giờ clip em nổi thiệt. Vì là clip hiện trường vụ án.", "nervous"],
      ],
      "lich-su-giai": [
        ["khoa", "Dạ hai lần đó em trúng thiệt mà. Em còn đăng TikTok \"thực tập sinh hên nhất Sài Gòn\".", "nervous"],
        ["khoa", "Giờ nghĩ lại em thấy... em không hên. Em được xếp.", "nervous"],
      ],
      "anh-checkin": [
        ["khoa", "Ảnh đẹp không anh? Em canh góc mười phút. Chị Vy duyệt rồi.", "happy"],
      ],
    },
    phong: {
      "video-phat-bieu": [
        ["phong", "Một-hai-không-hai. Có ghi hình. Có tiếng. Có vỗ tay.", "angry"],
        ["phong", "Mai tôi gửi sếp bài giảng bảo mật. Ba mươi slide.", "neutral"],
      ],
      "selfie-vy": [
        ["phong", "Góc trái là tôi... à không, góc trái bị mặt chị Vy che. Chị Vy luôn che phần tôi trong hình.", "neutral"],
      ],
      "log-ket": [
        ["phong", "Mở 20:06, đóng 20:07. Biết mã, biết đường, không lóng ngóng. Người này có tính toán.", "neutral"],
        ["phong", "Tính toán kỹ vậy... không phải kiểu của tôi. Tôi tính bằng cảm xúc. Năm ngoái tôi tính sai.", "nervous"],
      ],
    },
    hang: {
      "hop-salad-thieu-nia": [
        ["hang", "Nĩa của chị... chắc rớt dưới gầm bàn. Đông người mà.", "nervous"],
        ["teo", "Chị đi tất niên mang nĩa riêng mà để rớt. Kế toán mà mất đồ, lạ ghê.", "smug"],
      ],
      "lich-su-giai": [
        ["hang", "Thấy chưa. Chị nói rồi. Kế toán chỉ biết chi.", "angry"],
        ["hang", "Mà chi kiểu này thì chị không ký nổi nữa.", "angry"],
      ],
      "day-doi": [
        ["hang", "(nhìn hai mươi phiếu hồng, im lặng rất lâu)", "nervous"],
        ["hang", "Hoá đơn in phiếu năm nào cũng có hai mươi tờ \"in riêng, giấy hồng\". Chị hỏi ba lần.", "angry"],
      ],
      "selfie-vy": [
        ["hang", "Chị Vy chụp hình đẹp ghê. Ghế trống phía sau thì... chị đâu có để ý.", "nervous"],
      ],
    },
    dat: {
      "so-dat-ban": [
        ["dat", "Thì... cháu anh, anh cho ngồi gần. Gia đình mà. Công ty là gia đình, gia đình là... công ty.", "nervous"],
        ["teo", "Sếp nói vòng vòng như nồi lẩu đang sôi.", "smug"],
      ],
      "camera-mai": [
        ["dat", "Cây mai che camera? Ai cho dời cây mai? Cây mai đó anh đặt, phong thuỷ đó!", "angry"],
      ],
      "thung-nong": [
        ["dat", "Thùng... thùng gỗ thì nó dày. Gỗ quý. Gỗ dày nên bên trong nông. Đúng không?", "nervous"],
        ["me", "Gỗ dày hai mươi phân?", "neutral"],
        ["dat", "Gỗ... rất quý.", "nervous"],
      ],
    },
    quanly: {
      "log-ket": [
        ["quanly", "Dạ 20:06 không phải em. Dạ em thề trên danh hiệu nhân viên xuất sắc.", "nervous"],
      ],
      "clip-khoa": [
        ["quanly", "Dạ... dạ trong clip em cười đẹp không quý khách? Cho em xin một bản.", "nervous"],
      ],
      "tui-phong-bi": [
        ["quanly", "Tủ đông nhà hàng em! Giấu tiền trong tủ đông nhà hàng em! Dạ em sẽ ghi vào biên bản sự cố!", "shock"],
        ["quanly", "Mà túi zip dán chữ \"SALAD\"... nhà hàng em không bán salad.", "neutral"],
      ],
    },
  },

  wrong: {
    khoa: [
      [["khoa", "Dạ em xin lỗi! ...Mà em xin lỗi vì cái gì vậy anh? Em quen miệng rồi.", "nervous"]],
      [["khoa", "Anh ơi em gặm nắp bút được không anh? Em run quá.", "nervous"], ["teo", "Ở đây không có bút đâu Khoa. Gặm đũa đỡ đi.", "neutral"]],
      [["khoa", "Cái này em không biết. Em quay clip cái này được không anh? \"Tập 8: bị hỏi khó\".", "neutral"]],
    ],
    phong: [
      [["phong", "Sai input.", "neutral"]],
      [["phong", "Không liên quan. Tôi đeo tai nghe lại đây.", "neutral"]],
      [["phong", "Cái này giống bug: nhìn tưởng lỗi của tôi, thật ra là lỗi người dùng.", "angry"]],
      [["phong", "Anh thử restart lại suy luận đi.", "neutral"]],
    ],
    hang: [
      [["hang", "Chứng từ sai. Không hợp lệ. Trả về.", "angry"]],
      [["hang", "Em ơi chị làm sổ sách mười năm. Em đưa chị cái này là chị gạch đỏ.", "angry"]],
      [["hang", "Đừng làm chị stress. Stress là chị ăn. Chị đang ngày 1.", "nervous"]],
    ],
    dat: [
      [["dat", "Em à, cái này không liên quan. Em nên \"think big\" hơn.", "neutral"], ["teo", "Sếp lại nói tiếng Anh để thoát.", "smug"]],
      [["dat", "Công ty là gia đình. Gia đình không nghi nhau vì mấy thứ lặt vặt vậy.", "neutral"]],
      [["dat", "Anh làm sếp hai mươi năm, chưa thấy ai lập luận kiểu này. À, có. Năm ngoái. Cũng là em.", "angry"]],
    ],
    quanly: [
      [["quanly", "Dạ quý khách đưa nhầm rồi ạ. Dạ để em lấy cho quý khách cái khác.", "nervous"]],
      [["quanly", "Dạ cái này không có trong biên bản sự cố ạ.", "neutral"]],
      [["quanly", "Dạ em xin phép không bình luận để giữ danh hiệu ạ.", "nervous"]],
    ],
    vy: [
      [["vy", "Anh thám tử. Còn hai mươi phút. Đừng phí thời gian của tôi.", "angry"]],
      [["vy", "Cái này không phải bằng chứng. Cái này là cảm tính. Tôi ghét cảm tính.", "angry"]],
      [["vy", "Tôi sẽ ghi âm lại câu vừa rồi của anh. Để anh nghe lại cho tỉnh.", "neutral"]],
    ],
  },

  deduction: [
    {
      id: "cho-ngoi",
      text: "Theo sơ đồ, ghế sát cây mai là của {a}. Nhưng Hằng đã {b}, ngồi ghế 1 sát {c}, ngay cửa hành lang.",
      blanks: {
        a: { answer: "phong", kind: "ai" },
        b: { answer: "doi-cho", kind: "cach" },
        c: { answer: "cay-mai", kind: "o" },
      },
      explain: [
        ["me", "Sơ đồ chị Vy: ghế 1 Phong, ghế 2 Hằng. Ảnh check-in 18 giờ 55 và thẻ tên bút xoá: Hằng ngồi ghế 1, Phong ghế 2.", "neutral"],
        ["me", "Ai nhìn sơ đồ mà không nhìn ảnh sẽ nghĩ ghế trống lúc 8 giờ 10 là ghế của Phong.", "neutral"],
        ["teo", "Đổi chỗ trước khi gây án. Kế toán lên kế hoạch như lập ngân sách.", "shock"],
      ],
    },
    {
      id: "vang-mat",
      text: "Ghế 1 trống từ {a} tới {b}. Dĩa gỏi lúc 20 giờ 06 là {c}, để ai cũng tưởng chị vẫn ngồi đó.",
      blanks: {
        a: { answer: "20h04", kind: "luc" },
        b: { answer: "20h12", kind: "luc" },
        c: { answer: "dat-truoc", kind: "cach" },
      },
      explain: [
        ["me", "20 giờ 02 Hằng còn trong ảnh nâng ly. 20 giờ 04 người quàng khăn lông lẻn vào cửa hành lang. 20 giờ 10 selfie chị Vy: ghế 1 trống. 20 giờ 12 người quàng khăn lông quay ra.", "neutral"],
        ["me", "Gỏi đặt lúc 19 giờ 55, hẹn 20 giờ 06 mới mang ra. Chứng từ giả, đúng nghề kế toán.", "neutral"],
      ],
    },
    {
      id: "khan",
      text: "Người quàng {a} lẻn qua cửa hành lang trong clip là {b}.",
      blanks: {
        a: { answer: "khan-long", kind: "vat" },
        b: { answer: "hang", kind: "ai" },
      },
      explain: [
        ["me", "Nửa sảnh mặc áo dài đỏ. Khăn lông trắng thì chỉ có một cái, của chị Vy, cho mượn lúc 7 giờ 50.", "neutral"],
        ["me", "Ba tấm hình ghép lại: người mượn khăn, người lẻn qua cửa, người vắng ghế là một.", "neutral"],
      ],
    },
    {
      id: "cach",
      text: "Két mở lúc {a} bằng {b}. Mười hai phong bì được giấu trong {c} lúc {d}.",
      blanks: {
        a: { answer: "20h06", kind: "luc" },
        b: { answer: "ma-sinh-nhat", kind: "cach" },
        c: { answer: "tu-dong", kind: "o" },
        d: { answer: "20h09", kind: "luc" },
      },
      explain: [
        ["me", "Sếp Đạt đọc mã trên micro, cả sảnh đều biết. Chìa dự phòng còn phủ bụi. Một phút mở két, ba phút sau tới tủ đông.", "neutral"],
        ["me", "Phong đứng trong bếp nghe giọng robot \"8.000 bước\" ngay tủ đông. Túi zip \"SALAD\" có cái nĩa hồng của hộp salad thiếu nĩa.", "neutral"],
      ],
    },
    {
      id: "cu-lat",
      text: "Hai năm liền, giải đặc biệt về tay {a}. Bí mật nằm ở {b}.",
      blanks: {
        a: { answer: "khoa", kind: "ai" },
        b: { answer: "day-doi", kind: "cach" },
      },
      explain: [
        ["me", "Khoa là cháu ruột sếp Đạt. Ngăn dưới thùng \"LỘC\" toàn phiếu hồng ghi tên Khoa. Giải đặc biệt sếp tự bốc, tay thò xuống ngăn dưới.", "neutral"],
        ["teo", "Bốc thăm mà có đáp án sẵn. Như thi mà biết đề.", "shock"],
      ],
    },
    {
      id: "dong-co",
      text: "Thủ phạm là {a}. Động cơ: {b}.",
      blanks: {
        a: { answer: "hang", kind: "ai" },
        b: { answer: "vach-tran", kind: "vi" },
      },
      explain: [
        ["me", "Kế toán thấy hoá đơn in hai mươi phiếu hồng năm nào cũng có. Hai năm liền một cái tên trúng giải đặc biệt.", "neutral"],
        ["me", "Chị không lấy tiền. Chị giấu phong bì để buổi bốc thăm gian lận không diễn ra.", "neutral"],
        ["teo", "Kẻ trộm lần này muốn công bằng. Mà muốn công bằng kiểu trộm thì vẫn là trộm nha sếp.", "neutral"],
      ],
    },
  ],

  finale: {
    culprit: "hang",
    intro: [
      ["narr", "8 giờ 58. Mười hai phong bì đỏ nằm giữa sân khấu, còn đọng hơi lạnh tủ đông. Cả công ty đứng vòng quanh. Anh Lâm cầm bộ đàm như cầm micro."],
      ["batu", "(gọi video, màn hình điện thoại Tèo giơ cao) Bà con ơi, thám tử sắp chỉ mặt rồi! Hai ngàn người đang coi!", "happy"],
      ["me", "Phong bì đã tìm thấy. Nhưng người giấu nó đang đứng trong sảnh này.", "neutral"],
      ["teo", "Em đoán... anh quản lý! Dạ thôi, em rút lại. Em đoán ai cũng sai.", "nervous"],
      ["me", "Chị Hằng. Chị có muốn nói trước không?", "neutral"],
      ["hang", "Chị không có gì để nói. Chị đi vệ sinh năm phút. Hết.", "angry"],
    ],
    steps: [
      {
        claim: [
          ["hang", "Người trong clip của Khoa quàng khăn lông trắng. Khăn của chị Vy. Sao không hỏi chị Vy?", "angry"],
          ["vy", "Tôi?!", "shock"],
        ],
        answer: "anh-nang-ly",
        hint: "Người quàng khăn lông là ai? Lúc 8 giờ 02, sếp Đạt có đăng một tấm hình nâng ly với bàn team đó sếp.",
        right: [
          ["me", "Ảnh nâng ly sếp Đạt đăng lúc 20 giờ 02. Ghế sát cây mai: chị, áo dài đỏ, quàng đúng cái khăn lông trắng đó.", "neutral"],
          ["me", "Hai phút sau, cái khăn đó lướt qua cửa hành lang. Còn chị Vy lúc 20 giờ 10 ngồi ở bàn sếp, vai trần, đăng hashtag than lạnh.", "neutral"],
          ["vy", "Tôi lạnh muốn xỉu vì cho chị mượn khăn đó, chị Hằng.", "angry"],
        ],
        wrong: [["hang", "Cái đó thì nói lên được gì? Chị Vy vẫn là chủ cái khăn.", "smug"], ["vy", "Anh thám tử, đưa cái gì có mặt người quàng khăn!", "angry"]],
      },
      {
        claim: [
          ["hang", "Thì chị mượn khăn, chị đi qua hành lang. Hành lang dẫn ra nhà vệ sinh mà.", "angry"],
          ["hang", "Còn két thì chị đâu biết mã. Lúc anh Lâm cài, chị quay mặt đi.", "neutral"],
        ],
        answer: "video-phat-bieu",
        hint: "Mã két ai biết? Bảy giờ tối có người cầm micro nói gì đó trên sân khấu, camera có ghi lại.",
        right: [
          ["me", "Chị không cần nhìn lúc cài. Bảy giờ tối, sếp Đạt đọc mã trên micro, cả sảnh vỗ tay. Một-hai-không-hai.", "neutral"],
          ["dat", "Anh... anh minh bạch hơi quá tay.", "nervous"],
          ["phong", "Ba lỗi bảo mật trong một câu.", "neutral"],
        ],
        wrong: [["hang", "Đó, chị nói rồi. Chị không biết mã.", "smug"], ["phong", "Anh thám tử, xem lại camera sân khấu đi.", "neutral"]],
      },
      {
        claim: [
          ["hang", "Ai mà không biết mã! Cả sảnh biết! Vậy sao lại là chị? Chị đi vệ sinh, chị không vô bếp!", "angry"],
        ],
        answer: "buoc-chan",
        hint: "Chị Hằng có đồng hồ đếm bước, app tự đăng group chat. Phong nghe giọng robot ở đâu?",
        right: [
          ["me", "Đồng hồ của chị tự đăng vào group chat: 8.000 bước lúc 20 giờ 09. Từ 20 giờ 04 tới 20 giờ 12, chị đi 900 bước.", "neutral"],
          ["me", "Đúng 20 giờ 09, Phong đang viết chữ lên bánh trong bếp, nghe giọng robot \"Chúc mừng 8.000 bước\" ngay tủ đông. Nhà vệ sinh ở hướng ngược lại.", "neutral"],
          ["phong", "Tôi không quay lại. Nhưng tôi nghe rõ. Giọng robot đó, ngày nào group chat cũng báo.", "neutral"],
          ["hang", "...", "shock"],
        ],
        wrong: [["hang", "Thấy chưa, không ai thấy chị trong bếp.", "smug"], ["teo", "Sếp ơi, cái đồng hồ! Đồng hồ biết đếm!", "nervous"]],
      },
      {
        claim: [
          ["hang", "Chị có vô bếp thì sao? Bếp đông người. Phong bì trong tủ đông, ai bỏ vô chẳng được.", "angry"],
          ["hang", "Túi zip dán chữ thì ai dán chẳng được.", "nervous"],
        ],
        answer: "hop-salad-thieu-nia",
        hint: "Trong túi phong bì có một cái nĩa hồng \"Ngày 1/30\". Trên bàn team có hộp salad nào đang thiếu nĩa không ta?",
        right: [
          ["me", "Trong túi \"SALAD – BÀN 2\" có cái nĩa hồng, cán in \"Ngày 1/30\".", "neutral"],
          ["me", "Trên bàn team, trước ghế 1 của chị: hộp salad nắp in \"Ngày 1/30\", ngăn đựng nĩa trống trơn.", "neutral"],
          ["me", "Chị mang salad riêng, nĩa riêng, không cho ai đụng. Chỉ chị mới bỏ quên được cái nĩa đó.", "neutral"],
          ["narr", "Chị Hằng nhìn cái nĩa hồng. Lần đầu tiên trong tối nay, chị không cãi."],
        ],
        wrong: [["hang", "Không liên quan. Trả về.", "angry"], ["khoa", "Anh ơi, cái nĩa! Chị Hằng không cho ai đụng nĩa của chị!", "nervous"]],
      },
    ],
    confess: [
      ["hang", "Ừ. Chị lấy.", "nervous"],
      ["hang", "Không phải vì tiền. Chị không lấy một đồng. Em đếm đi, đủ 50 triệu, mười hai phong bì, niêm phong nguyên.", "angry"],
      ["hang", "Năm nào cũng có hoá đơn in hai mươi phiếu thăm \"in riêng, giấy hồng\". Năm nào giải đặc biệt cũng về một người.", "angry"],
      ["hang", "Chị hỏi sếp ba lần. Sếp nói \"công ty là gia đình\". Gia đình gì mà giải đặc biệt chỉ có một đứa cháu được trúng?", "angry"],
      ["hang", "Sáu bạn mới năm nay, lương thấp hơn chị hồi mới vô. Tụi nhỏ chờ bốc thăm từ đầu tháng. Chị không chịu được cảnh tụi nhỏ vỗ tay cho cái thùng hai đáy.", "nervous"],
      ["hang", "Chị tính giấu phong bì cho buổi bốc thăm hoãn. Rồi chị đem cái hộp nhựa trong suốt ra, đề nghị bốc lại trước mặt mọi người. Đổ cái thùng ra cho ai cũng thấy.", "nervous"],
      ["dat", "Sao em không nói thẳng trước cả công ty?", "nervous"],
      ["hang", "Em nói với anh ba lần rồi, sếp. Ở công ty này, kế toán nói thì không ai nghe. Phải có biến thì mới nghe.", "angry"],
      ["vy", "Đúng chuyện. Sai cách. Tiền công ty mà chị tự ý lấy, lỡ mất thì sao? Lỡ người ta đổ cho anh Lâm, cho Phong, cho Khoa thì sao?", "angry"],
      ["hang", "...Chị biết. Chị xin lỗi anh Lâm. Xin lỗi Phong. Xin lỗi Khoa. Chị muốn công bằng mà chị làm cho người khác bị nghi oan.", "nervous"],
      ["teo", "Sếp ơi, em muốn đứng về phía chị Hằng mà em không đứng được. Khó quá.", "nervous"],
    ],
    epilogue: [
      ["narr", "9 giờ 20. Thùng \"LỘC\" bị đổ ngược giữa sân khấu. Hai mươi phiếu hồng nằm phơi dưới đèn. Sáu bạn mới im phăng phắc."],
      ["dat", "(cầm micro, giọng lạc đi) Anh xin lỗi. Hai năm qua anh gài giải đặc biệt cho cháu anh. Anh tưởng đó là thương cháu. Đó là bất công với anh em.", "nervous"],
      ["dat", "Năm nay anh không bốc. Phần thưởng Tết của anh, anh bỏ vô quỹ, chia đều cho sáu bạn mới.", "nervous"],
      ["khoa", "Cậu... à, sếp. Em trả lại chiếc xe máy năm ngoái cho công ty bốc lại. Em muốn trúng thì trúng thiệt, không muốn được xếp.", "nervous"],
      ["khoa", "Và mai em đăng TikTok: \"Tập 9: Tôi là cháu sếp\". Không giấu nữa.", "neutral"],
      ["vy", "Bốc lại. Hộp nhựa trong suốt của chị Hằng. Phiếu trắng, ai cũng có một tờ, kể cả anh Lâm, kể cả đầu bếp.", "neutral"],
      ["vy", "Người bốc là... Tèo. Vì Tèo là người duy nhất ở đây không có tên trong thùng, và đoán gì cũng sai.", "neutral"],
      ["teo", "Em được bốc 50 triệu! Em run quá sếp ơi! ...Giải đặc biệt: chú Sáu bảo vệ toà nhà!", "shock"],
      ["narr", "Chú Sáu bảo vệ, người từng nợ chị Vy một cục sạc, đứng dậy từ góc bàn team, tay còn cầm cái đùi gà."],
      ["quanly", "Dạ cho em xin chụp hình chung với người trúng giải ạ! Dạ em ra khỏi phòng quản lý lần thứ hai trong đêm!", "happy"],
      ["hang", "Chị nhận kỷ luật. Chị xin thôi giữ quỹ bốc thăm năm sau.", "nervous"],
      ["vy", "Không. Năm sau chị làm trưởng ban bốc thăm. Mọi phiếu đi qua tay chị, mọi hoá đơn đi qua mắt chị. Công khai. Có tôi ghi âm.", "neutral"],
      ["narr", "Mười giờ. Anh phục vụ đẩy xe ra cái bánh kem trà sữa: \"Cảm ơn chị Vy. Nợ trà sữa đã trả xong (4/4).\""],
      ["vy", "...Phong.", "shock"],
      ["phong", "Bất ngờ bị lộ rồi. Nhưng bánh vẫn ngon.", "nervous"],
      ["dat", "Cắt bánh đi! Công ty là... thôi, anh không nói câu đó nữa. Năm sau anh nói câu khác.", "nervous"],
      ["batu", "Bà Tư đã đăng: \"PHONG BÌ TRONG TỦ ĐÔNG: kẻ trộm muốn công bằng, sếp gài thăm bị lật\". Bốn ngàn like rồi!", "happy"],
    ],
    comments: [
      { by: "batu", text: "Kết luận: công bằng là phải công khai, giấu phong bì trong tủ đông thì vẫn là sai nha bà con 🧧", likes: 4210 },
      { by: "Hùng Xe Ôm", text: "Tui hỏi ai trúng giải đặc biệt năm ngoái là có lý do đó. Bây giờ bà con tin tui chưa", likes: 2876 },
      { by: "Tiểu Thư Bánh Bèo 2k5", text: "Bánh kem \"nợ trà sữa đã trả xong 4/4\"... anh Phong ơi em xin chồng như anh 😭", likes: 3102 },
      { by: "Chị Hai Kế Toán Q3", text: "Đồng nghiệp kế toán xin nói: hoá đơn lạ mà sếp không giải thích thì cứ hỏi tới cùng, nhưng hỏi đàng hoàng, đừng lấy tiền 🧾", likes: 1987 },
      { by: "Dân IT Hẻm Bên", text: "Đọc mã két trên micro. Mã là sinh nhật. Có ghi hình. Tôi IT 10 năm chưa thấy combo nào đẹp vậy 💀", likes: 2654 },
      { by: "Khoa 1 Năm Làm Văn Phòng", text: "Tập 9 \"Tôi là cháu sếp\" lên sóng rồi ạ. Em trả xe rồi. Từ giờ em hên thì hên thiệt, xui thì xui thiệt 🙏", likes: 3540 },
      { by: "Nhân Viên Mới Cà Khịa", text: "Lần đầu đi tất niên công ty, chứng kiến cả vụ án, được chia thưởng Tết của sếp. Năm nay đáng nhớ nhất đời 🥹", likes: 1876 },
      { by: "Cô Ba Bán Xôi", text: "Chú Sáu bảo vệ trúng 20 triệu. Mai chú ra mua xôi tui bao, chú nhớ ghé nha", likes: 1243 },
      { by: "Lẩu Phát Tài (Official)", text: "Nhà hàng xin cam kết: tủ đông chỉ đựng thịt, không đựng phong bì. Anh Lâm vẫn là nhân viên xuất sắc tháng 13 nha mọi người 🍲", likes: 2098 },
      { by: "Fan Cứng Anh Lâm", text: "Anh quản lý bỏ phòng đi xin selfie fan TikTok. Cưng quá trời, giữ danh hiệu cho anh đi nhà hàng ơi", likes: 1432 },
      { by: "Team Chị Hằng", text: "Chị Hằng sai cách nhưng đúng chuyện. Không có chị thì năm nay sáu bạn mới lại vỗ tay cho cái thùng hai đáy", likes: 2765 },
      { by: "Sếp Cũng Là Người", text: "Thương cháu thì tăng lương cho cháu đàng hoàng, gài thăm làm chi cho mất lòng cả công ty 🤦", likes: 2311 },
      { by: "Người Yêu Cũ Của Deadline", text: "Công ty là gia đình. Gia đình mà có thùng hai đáy thì tôi xin ra ở riêng 😭", likes: 1998 },
      { by: "Bác Bảy Hưu Trí", text: "Thời tôi tất niên bốc thăm bằng nón lá, ai cũng thấy tay người bốc. Đơn giản mà công bằng", likes: 876 },
      { by: "teo", text: "Em là người bốc giải đặc biệt 50 triệu tối qua. Run muốn rớt cái hộp. Em đoán sai hết mà bốc thì công bằng tuyệt đối 😤", likes: 1105 },
      { by: "chuba", text: "Chú tới trễ, vụ xong rồi. Mà nghe nói chú Sáu bảo vệ trúng giải hả? Chú Sáu ơi, chú Ba dân phòng nè, nhớ nhau không", likes: 954 },
    ],
  },

  hints: [
    {
      needs: ["clue:tui-phong-bi", "clue:hop-salad-thieu-nia", "clue:anh-nang-ly", "clue:buoc-chan", "clue:day-doi"],
      text: "Sếp ơi đủ đồ rồi! Ghế ngồi, cái khăn, bước chân, cái nĩa, cái thùng hai đáy. Ra bảng suy luận chốt đi sếp, em không đoán nữa đâu.",
    },
    {
      needs: "flag:phong-nghe-tit",
      done: ["seen:kitchen3.ngan-duoi-tu-dong", "clue:buoc-chan"],
      text: "Anh Phong nghe tiếng \"8.000 bước\" ngay tủ đông! Sếp lục lại ngăn dưới tủ đông đi. Mà ai có đồng hồ đếm bước tự đăng lên group chat ta? Hỏi chị Vy coi group chat.",
    },
    {
      needs: "flag:lam-thung-2-lop",
      done: "seen:banquet.day-thung",
      text: "Thùng bốc thăm có hai lớp! Sếp ra sân khấu soi lại đáy thùng đi. Sếp Đạt mà nhào tới thì em cản cho.",
    },
    {
      needs: "stmt:hang-ghe-2",
      done: "broke:hang-ghe-2",
      text: "Chị Hằng nói chị ngồi ghế 2 theo sơ đồ. Mà sơ đồ là kế hoạch, ảnh mới là sự thật. Ảnh check-in Khoa chụp có gắn thẻ ai ngồi đâu đó sếp.",
    },
    {
      needs: "stmt:hang-goi-mon",
      done: "broke:hang-goi-mon",
      text: "Chị Hằng nói 8 giờ 06 chị gọi gỏi. Bảng order trong bếp ghi giờ đặt với giờ mang ra đó sếp. Hai cái giờ có giống nhau không ta?",
    },
    {
      needs: "clue:clip-khoa",
      done: "clue:anh-nang-ly",
      text: "Người quàng khăn lông trắng lẻn vô cửa hành lang lúc 8 giờ 04. Khăn của chị Vy, mà ai mượn? Sếp Đạt đi nâng ly từng bàn lúc 8 giờ, hỏi sếp coi có chụp hình không.",
    },
    {
      needs: "stmt:phong-o-ban",
      done: "broke:phong-o-ban",
      text: "Anh Phong nói ngồi ở bàn suốt. Mà trong bếp có cái xe đẩy chở món gì lạ lắm, có chữ hẳn hoi. Soi bếp đi sếp.",
    },
    {
      needs: "stmt:lam-o-phong",
      done: "broke:lam-o-phong",
      text: "Anh Lâm nói ngồi trong phòng quản lý suốt. Mà 8 giờ Khoa đang quay TikTok ngoài sảnh. Coi clip Khoa thử, biết đâu có ai lọt vô khung hình.",
    },
    {
      needs: "stmt:dat-ma-ket",
      done: "broke:dat-ma-ket",
      text: "Sếp Đạt nói mã két chỉ hai người biết. Mà lúc 7 giờ sếp Đạt phát biểu trên sân khấu, camera sân khấu có ghi lại. Coi màn hình camera trong phòng quản lý đi sếp.",
    },
    {
      needs: "stmt:khoa-khong-ho-hang",
      done: "broke:khoa-khong-ho-hang",
      text: "Khoa thề không họ hàng gì với sếp. Mà tiệc này ai đặt bàn, ghi chú gì trong sổ đặt bàn ta?",
    },
    {
      text: "Em đoán anh quản lý! ...Dạ thôi đoán bậy trừ sao. Sếp xem sơ đồ chỗ ngồi ở cửa sảnh, soi két sắt trong phòng quản lý, rồi hỏi mọi người lúc 8 giờ ở đâu đi sếp.",
    },
  ],

  bonus: [
    {
      id: "ma-ket",
      q: "Mã két sắt sếp Đạt đọc trên micro là gì?",
      choices: ["1202, sinh nhật sếp", "0000, mã mặc định", "1234, dễ nhớ", "4747, số hẻm"],
      answer: 0,
      explain: "\"Mã két tiền thưởng là sinh nhật sếp: một-hai-không-hai!\" Bản nháp còn ghi đó là ý số 3 để \"nhân viên thấy sếp minh bạch\".",
    },
    {
      id: "banh-kem",
      q: "Chữ trên bánh kem trà sữa Phong lén làm là gì?",
      choices: ["\"Cảm ơn chị Vy. Nợ trà sữa đã trả xong (4/4).\"", "\"Chúc mừng năm mới Cà Khịa Media\"", "\"Xin lỗi vì ly trà sữa năm ngoái\"", "\"Best Boss\""],
      answer: 0,
      explain: "Chị Vy trả đủ bốn ly trà sữa nợ từ vụ trước. Phong trả lại bằng một cái bánh, dặn mang ra sau bốc thăm.",
    },
    {
      id: "ngay",
      q: "Thử thách ăn kiêng của Hằng năm nay đang ở ngày mấy?",
      choices: ["Ngày 1/30, lần thứ bảy", "Ngày 12/30", "Ngày 30/30, sắp xong", "Chị bỏ ăn kiêng rồi"],
      answer: 0,
      explain: "Nắp hộp salad và cán nĩa hồng đều in \"Ngày 1/30\". Lần thứ bảy. Và chính cái nĩa đó làm chị lộ.",
    },
  ],
};
