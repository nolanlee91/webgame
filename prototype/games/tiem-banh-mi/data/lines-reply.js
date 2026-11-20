// Trả lời review theo tính cách chủ tiệm (core/reviews.js). Giọng mạng xã hội Việt, hài tử tế.
// Cục súc là thẳng và cộc, KHÔNG chê ngoại hình, giới tính, vùng miền hay ai cả: chỉ châm chọc tình huống và chính tiệm.
// Không emoji, không thương hiệu thật, không người thật. Hashtag được.
//
// Biến trong câu trả lời: {name} người viết review, {loaf} tên món, {mistake} lỗi (MISTAKE_TEXT), {shop} tên tiệm, {stars} số sao.
// Biến trong câu khách quay lại (RETURN_LINES): {self} {Self} {call} {Call} {loaf} (theo nhóm khách, core/shift.js lineCtx).
// Biến trong câu cư dân mạng "đổi tính" (FLIP_LINES): {from} {to} (tên ngắn tính cách cũ / mới).
// Biến trong câu chốt ca (CAPTIONS_*): {loaves} {stars} {followers} {flips}.
//
// REPLY_LINES[option] = { up, down, decor?, multi?, slow? }: chọn [...bảng riêng theo chủ đề, ...bảng chung theo nhóm].
//   up = review ≥ 4 sao (decor: khen tiệm / góc ngồi, multi: đơn nhiều ổ); down = ≤ 3 sao (slow: chờ lâu / bỏ về / ổ tới trễ).

export const PERSONAS = {
  hien: { name: "Hiền lành, lễ phép", short: "Hiền lành", desc: "Dạ vâng, cảm ơn, xin lỗi đủ cả. Trả lời an toàn: tăng ít mà chắc, hiếm khi có chuyện." },
  cucsuc: { name: "Cục súc, thẳng như ruột ngựa", short: "Cục súc", desc: "Nói ít, nói thẳng, không vòng vo (mà không bao giờ chê người). Đánh cược: có khi lên mạng, có khi dính phốt." },
  lay: { name: "Lầy lội, meme lord", short: "Lầy lội", desc: "Câu nào cũng thành meme. Độ hot lên xuống thất thường, đôi khi thành trend." },
  sale: { name: "Sale-man chốt đơn", short: "Sale-man", desc: "Review nào cũng thành khuyến mãi. Ra đơn, khách quay lại, nhưng có người thấy phiền." },
};
export const PERSONA_IDS = Object.keys(PERSONAS);

/** Lỗi theo lý do review (biến {mistake}). Viết để đọc trơn sau "vụ", "lỗi", "không". */
export const MISTAKE_TEXT = {
  wrongFilling: "sai nhân", noPate: "quên pate", onionAnyway: "lọt hành dù dặn không hành", tooSpicy: "ớt quá tay",
  burnt: "cháy cạnh", soggy: "bánh ỉu", notToasted: "quên nướng lại cho giòn", wrongWrap: "gói sai", wrongChange: "thối nhầm tiền",
  swapped: "tráo ổ trong đơn", veganMeat: "để ổ chay dính đồ mặn", timeout: "chậm tới mức khách bỏ về", slow: "chậm",
  multiLate: "trễ một ổ", multiWrong: "lệch một ổ trong đơn", preLate: "giao đơn đặt trước trễ", preShort: "giao thiếu ổ đơn đặt trước",
  stale: "bánh để lâu hết giòn", mang: "chuyện trên mạng", phot: "câu trả lời hơi gắt", ok: "chưa tròn vị",
};

/** Kết quả một câu trả lời (hiện ngay dưới review). */
export const OUTCOME_LABEL = {
  warm: "Khách vui", promise: "Đã hứa sửa", viral: "Lên mạng", phot: "Dính phốt", flop: "Meme xịt", annoyed: "Có người thấy phiền", sold: "Chốt đơn", back: "Khách sẽ quay lại", legacy: "Đã trả lời",
};

/** Lựa chọn trả lời theo tính cách. on: up | down | praise | decor | multi | mistake | slow | meh | net | all. out: { kind, fx } hoặc roll { p, win, lose }.
 *  fx: followers buzz rep netReview(sao của review cư dân mạng) guests(ca sau) back(khách quay lại) demand(món được gọi) event{id,days} flag.
 *  cost = tiền trả ngay (k). promise = xin lỗi tạo lời hứa (chỉ khi review có lỗi thật). */
export const REPLY_OPTIONS = {
  hien: [
    { id: "hien-thanks", on: ["up"], label: "Cảm ơn thật lòng", hint: "+5 người theo dõi. Hên thì khách ghé lại ca sau",
      out: { roll: { p: 0.35, win: { kind: "back", fx: { followers: 5, back: true } }, lose: { kind: "warm", fx: { followers: 5 } } } } },
    { id: "hien-sorry", on: ["down"], promise: true, label: "Xin lỗi, hứa sửa", hint: "+3 người theo dõi, an toàn",
      out: { kind: "promise", fx: { followers: 3 } } },
    { id: "hien-explain", on: ["meh", "net"], label: "Giải thích nhẹ nhàng", hint: "Khách hiểu thì +1 danh tiếng",
      out: { roll: { p: 0.7, win: { kind: "warm", fx: { rep: 1, followers: 3 } }, lose: { kind: "flop", fx: { followers: 1 } } } } },
    { id: "hien-invite", on: ["all"], cost: 10, label: "Mời ghé lại, ổ sau tiệm mời", hint: "Tiền ổ mời. Khách quay lại ca sau, +2 người theo dõi",
      out: { kind: "back", fx: { back: true, followers: 2, flag: "rep-back" } } },
    { id: "hien-meme", on: ["all"], label: "Meme dễ thương", hint: "Hên xui nhẹ: +8 người theo dõi, tiệm hot nhẹ",
      out: { roll: { p: 0.6, win: { kind: "warm", fx: { followers: 8, buzz: 0.4 } }, lose: { kind: "flop", fx: { followers: 2 } } } } },
  ],
  cucsuc: [
    { id: "cuc-thanks", on: ["up"], label: "Cảm ơn kiểu cộc lốc", hint: "Hên xui: dân mạng mê sự cộc (+18) hoặc thấy kỳ kỳ",
      out: { roll: { p: 0.55, win: { kind: "viral", fx: { followers: 18, buzz: 0.8 } }, lose: { kind: "flop", fx: { followers: 2 } } } } },
    { id: "cuc-brag", on: ["up"], label: "Khoe ngược: \"Biết mà\"", hint: "Hên xui: +14 người theo dõi, có khi bị chê tự tin quá",
      out: { roll: { p: 0.6, win: { kind: "viral", fx: { followers: 14, buzz: 0.6 } }, lose: { kind: "annoyed", fx: { followers: -2, buzz: 0.4 } } } } },
    { id: "cuc-sorry", on: ["mistake", "slow"], promise: true, label: "Nhận lỗi một câu, không vòng vo", hint: "+6 người theo dõi (dân mạng thích sự gọn)",
      out: { kind: "promise", fx: { followers: 6 } } },
    { id: "cuc-truth", on: ["down"], label: "Nói thẳng, cãi tay đôi", hint: "Đánh cược: lên mạng (+30, đánh giá lên) hoặc dính phốt (hot lên, đánh giá xuống, chuyện còn tiếp)",
      out: { roll: { p: 0.45,
        win: { kind: "viral", fx: { followers: 30, buzz: 1, rep: 1, netReview: 5, flag: "rep-viral", event: { id: "R01", days: 1 } } },
        lose: { kind: "phot", fx: { followers: 6, buzz: 1.5, rep: -2, netReview: 2, flag: "rep-phot", event: { id: "R04", days: 2 } } } } } },
    { id: "cuc-dare", on: ["down"], label: "Thách ghé lại ăn thử", hint: "Khách quay lại ca sau để \"phục thù\", +4 người theo dõi",
      out: { kind: "back", fx: { back: true, followers: 4, flag: "rep-back" } } },
    { id: "cuc-meme", on: ["all"], label: "Meme cà khịa nhẹ", hint: "50/50: lên mạng (+16) hoặc bị chê vô duyên (−4)",
      out: { roll: { p: 0.5, win: { kind: "viral", fx: { followers: 16, buzz: 1 } }, lose: { kind: "annoyed", fx: { followers: -4, buzz: 0.5 } } } } },
  ],
  lay: [
    { id: "lay-thanks", on: ["up"], label: "Cảm ơn bằng caption dài như sớ", hint: "+7 người theo dõi, tiệm hot nhẹ",
      out: { kind: "warm", fx: { followers: 7, buzz: 0.3 } } },
    { id: "lay-sorry", on: ["down"], promise: true, label: "Xin lỗi bằng thơ lục bát", hint: "+8 người theo dõi, tiệm hot nhẹ",
      out: { kind: "promise", fx: { followers: 8, buzz: 0.3 } } },
    { id: "lay-meme", on: ["all"], label: "Đăng meme", hint: "Độ hot lên xuống: lên mạng (+22) hoặc meme xịt (+2)",
      out: { roll: { p: 0.55, win: { kind: "viral", fx: { followers: 22, buzz: 1.5, flag: "rep-meme", event: { id: "R08", days: 1 } } }, lose: { kind: "flop", fx: { followers: 2, buzz: 0.3 } } } } },
    { id: "lay-trend", on: ["all"], label: "Biến review thành trend", hint: "Đánh cược lớn: trend nổ (+40, có người quay video đáp lại) hoặc không ai theo",
      out: { roll: { p: 0.4, win: { kind: "viral", fx: { followers: 40, buzz: 2, flag: "rep-trend", event: { id: "R02", days: 1 } } }, lose: { kind: "flop", fx: { followers: 3, buzz: 0.5 } } } } },
  ],
  sale: [
    { id: "sale-thanks", on: ["up"], label: "Cảm ơn, rủ khách mang cả phòng tới", hint: "Ca sau +2 khách. Có người thấy hơi lộ",
      out: { roll: { p: 0.8, win: { kind: "sold", fx: { guests: 2, followers: 3 } }, lose: { kind: "annoyed", fx: { guests: 1, followers: -2 } } } } },
    { id: "sale-sorry", on: ["down"], promise: true, cost: 5, label: "Xin lỗi kèm mã giảm", hint: "Mã giảm 5k. Khách quay lại ca sau, +3 người theo dõi",
      out: { kind: "promise", fx: { back: true, followers: 3, flag: "rep-back" } } },
    { id: "sale-voucher", on: ["all"], cost: 5, label: "Tặng mã giảm, mời quay lại", hint: "Khách quay lại ca sau. 1/4 thấy quảng cáo lộ",
      out: { roll: { p: 0.75, win: { kind: "sold", fx: { back: true, followers: 3, flag: "rep-back" } }, lose: { kind: "annoyed", fx: { back: true, followers: -3 } } } } },
    { id: "sale-combo", on: ["all"], label: "Chèn quảng cáo combo", hint: "Ca sau +1 khách, nhiều người gọi món này. 1/3 bị chê lộ liễu (danh tiếng −1)",
      out: { roll: { p: 0.65, win: { kind: "sold", fx: { guests: 1, demand: true } }, lose: { kind: "annoyed", fx: { guests: 1, demand: true, rep: -1, flag: "rep-sale", event: { id: "R06", days: 2 } } } } } },
  ],
};

export const REPLY_LINES = {
  // ===== Hiền lành =====
  "hien-thanks": {
    up: [
      "Dạ tiệm cảm ơn {name} nhiều lắm. Mai tiệm nướng mẻ đầu sớm hơn để {name} có ổ giòn nhất ạ.",
      "Cảm ơn {name} đã thương ổ {loaf} của tiệm. Lần sau ghé, tiệm vẫn phết pate bằng cả tấm lòng.",
      "Dạ tiệm xin cảm ơn ạ. {name} khen một câu mà cả tiệm có sức nhóm lò tới cuối tháng.",
      "Cảm ơn {name} nha. Tiệm chép review này ra giấy, dán cạnh lò, mỗi sáng nhìn một lần cho tỉnh ngủ.",
      "Tiệm cảm ơn {name} rất nhiều. Hẹn {name} một buổi sáng đẹp trời, ổ {loaf} vẫn giòn y như hôm nay.",
      "Dạ, tiệm đọc review mà rưng rưng. Cảm ơn {name} đã dành thời gian viết cho một tiệm nhỏ đầu hẻm.",
      "Cảm ơn {name} ạ. Tiệm hứa giữ đúng công thức pate, không tự ý đổi vị như đổi hình đại diện.",
      "Tiệm cảm ơn {name}, chúc {name} một ngày giòn rụm và vừa đủ chua cay, như ổ {loaf} hôm nay.",
    ],
    decor: [
      "Dạ cảm ơn {name} đã để ý góc nhỏ của tiệm. Mấy cái ghế nhựa nghe khen chắc cũng vui lắm.",
      "Tiệm cảm ơn {name}. Góc đứng chờ đó tiệm tự tay sắp, được khen là tiệm có động lực mua thêm chậu cây.",
      "Dạ, tiệm sẽ giữ quầy luôn sạch, tủ kính luôn sáng để {name} ghé lại đứng chờ cũng thấy vui ạ.",
      "Cảm ơn {name} ạ. Cái bảng giá viết tay đó tiệm viết lại ba lần mới thẳng hàng, được khen là đáng công.",
      "Dạ tiệm vui lắm. Tiệm sẽ lau tủ kính mỗi sáng để ổ bánh lúc nào cũng lên hình đẹp như {name} thấy.",
      "Tiệm cảm ơn {name}. Tiệm nhỏ nên chăm từng góc, được {name} để ý là tiệm thấy đáng lắm rồi.",
    ],
    multi: [
      "Cảm ơn {name} và cả phòng nha. Ráp đủ ổ cho cả nhóm mà không ai cầm nhầm, tiệm tự hào lắm.",
      "Dạ tiệm cảm ơn cả nhóm của {name}. Lần sau cả nhóm ghé, tiệm vẫn ghi tên từng người lên giấy gói.",
      "Tiệm cảm ơn {name}. Đơn nhiều ổ là bài kiểm tra lớn của tiệm, được cả nhóm khen là tiệm qua môn rồi.",
      "Dạ, ổ không hành, ổ ít ớt, ổ thêm trứng, tiệm nhớ từng cái. Cảm ơn {name} đã tin tiệm.",
      "Cảm ơn {name} ạ. Túi bánh của cả nhóm tiệm gói kỹ lắm, mừng là tới tay ai cũng còn giòn.",
      "Tiệm cảm ơn cả phòng của {name}. Hẹn cả nhóm sáng mai, tiệm để sẵn giấy gói và trí nhớ.",
    ],
  },
  "hien-sorry": {
    down: [
      "Dạ tiệm xin lỗi vì {mistake}. Lần sau {name} ghé, tiệm làm lại ổ khác và dán phiếu đỏ để không quên nữa ạ.",
      "Tiệm xin lỗi {name} nhiều. Vụ {mistake} là lỗi của tiệm, tiệm đã ghi vào sổ và dán ngay cạnh thớt.",
      "Dạ tiệm xin lỗi ạ. {name} bỏ tiền mua một bữa sáng vui mà gặp vụ {mistake}, tiệm thấy có lỗi lắm.",
      "Tiệm cúi đầu xin lỗi {name}. Từ ca sau, mỗi ổ {loaf} tiệm đọc phiếu hai lần rồi mới gói.",
      "Dạ cảm ơn {name} đã nói thẳng. Tiệm xin lỗi vì {mistake}, và hứa sửa bằng hành động chứ không chỉ bằng chữ.",
      "Tiệm xin lỗi {name}. Tiệm đã họp khẩn với chính mình và cái lò, kết luận: ca sau phải đúng.",
      "Dạ tiệm biết lỗi rồi ạ. Ổ {loaf} hôm đó dính vụ {mistake}, tiệm sẽ không để chuyện này lặp lại.",
      "Tiệm xin lỗi {name} nha. Nếu {name} cho tiệm thêm một cơ hội, tiệm sẽ làm lại một ổ thật đúng phiếu.",
    ],
    slow: [
      "Dạ tiệm xin lỗi đã để {name} chờ lâu. Tiệm đang tập tay ráp nhanh hơn mà vẫn giữ đúng công thức.",
      "Tiệm xin lỗi {name} vì phải chờ. Buổi sáng của {name} quý lắm, tiệm hứa ca sau gọn hơn.",
      "Dạ, tiệm xin lỗi. Hôm đó đông khách quá, nhưng đó không phải lý do để {name} phải đứng chờ.",
      "Tiệm xin lỗi vì cái sự chậm. Tiệm đã sắp lại quầy, pate với đồ chua để sát tay hơn rồi ạ.",
      "Dạ tiệm xin lỗi {name}. Ca sau tiệm nướng sẵn mẻ đầu sớm hơn mười phút để khỏi ai phải chờ.",
      "Tiệm xin lỗi ạ. Để {name} đói bụng đứng chờ là tiệm thấy áy náy cả buổi sáng.",
    ],
  },
  "hien-explain": {
    down: [
      "Dạ cảm ơn {name} đã góp ý. Ổ {loaf} của tiệm vị hơi thanh, nếu {name} thích đậm hơn cứ dặn thêm pate nha.",
      "Tiệm cảm ơn {name}. Tiệm xin phép giải thích nhẹ: công thức của tiệm là vậy, nhưng tiệm luôn sẵn lòng chỉnh theo khẩu vị ạ.",
      "Dạ, tiệm hiểu cảm giác của {name}. Lần sau {name} cứ nói nhỏ với tiệm muốn giòn hơn hay nhiều đồ chua, tiệm chỉnh liền.",
      "Tiệm cảm ơn {name}. {stars} sao cũng là {stars} ngôi sao, tiệm sẽ cố để lần sau có thêm sao nữa.",
      "Dạ, tiệm đọc kỹ rồi ạ. Tiệm sẽ thử lại mẻ bánh và công thức đồ chua thêm mấy lần cho tròn vị hơn.",
      "Tiệm cảm ơn góp ý của {name}. Chuyện trên mạng có khi chưa đủ, mời {name} ghé tiệm để tiệm kể đầu đuôi nha.",
      "Dạ, tiệm xin nghe hết. Mỗi góp ý là một bài học, tiệm ghi vào sổ, sổ dày dần như sách giáo khoa.",
      "Dạ, bánh của tiệm ra lò lúc năm giờ sáng, ghé sớm thì giòn nhất. Tiệm sẽ cố giữ giòn lâu hơn cho {name} ạ.",
    ],
  },
  "hien-invite": {
    up: [
      "Cảm ơn {name} nha. Lần sau ghé, ổ {loaf} đầu tiên tiệm mời, coi như quà cảm ơn bài review dễ thương.",
      "Dạ tiệm muốn mời {name} một ổ vào lần tới, để tiệm được nghe {name} khen trực tiếp lần nữa.",
      "Tiệm cảm ơn {name}. Hẹn {name} ghé lại, tiệm mời ổ đầu, ổ sau thì {name} tự chọn nhân.",
      "Dạ, tiệm để sẵn một ổ mời tên {name}. Ghé lúc nào cũng được, ổ mời không hết hạn đâu ạ.",
      "Tiệm cảm ơn {name} nhiều. Ca sau {name} ghé, tiệm mời một ổ nóng và xin một lời góp ý thật lòng.",
      "Review dễ thương quá, tiệm xin mời {name} ổ kế tiếp. Không cần review lại đâu, ghé chơi là vui rồi.",
    ],
    down: [
      "Dạ tiệm xin lỗi {name}. Ca sau {name} ghé, tiệm xin mời lại một ổ {loaf} làm thật đúng, coi như làm lại từ đầu.",
      "Tiệm biết ổ hôm đó chưa tròn vị. {name} ghé lại cho tiệm mời một ổ bù nha, tiệm muốn sửa sai tận tay.",
      "Dạ, tiệm xin {name} một cơ hội: ghé lại, tiệm mời ổ {loaf}, đúng phiếu từng dòng.",
      "Tiệm xin lỗi và xin mời {name} quay lại. Ổ bù tiệm nướng lại tận lò, tiệm đứng nghe {name} cắn tiếng rộp đầu luôn.",
      "Dạ {name} ơi, tiệm giữ một ổ mời cho {name}. Lần này tiệm hứa không để vụ {mistake} nữa.",
      "Tiệm thấy có lỗi lắm. Mời {name} ghé ca sau, ổ đó tiệm mời, ly trà đá tiệm cũng mời luôn.",
    ],
  },
  "hien-meme": {
    up: [
      "Tiệm đọc review xong ôm cái kẹp gắp bánh xoay ba vòng. Cảm ơn {name} nha.",
      "Chủ tiệm lúc đọc review của {name}: cười như được khen học giỏi trước cả họ.",
      "Ảnh minh hoạ: ổ {loaf} nằm trong tủ kính, tự hào vì được {name} khen. Cảm ơn {name} ạ.",
      "Tình trạng của tiệm sau review này: vui, hơi ngại, và muốn nướng thêm một mẻ ăn mừng.",
      "Cái lò trong tiệm nhờ tiệm nhắn: cảm ơn {name}, nó làm việc chăm chỉ lắm, nóng cả sáng.",
      "Tiệm đã đọc review này cho cả hũ pate nghe. Hũ pate cũng nói cảm ơn {name}.",
    ],
    down: [
      "Ổ {loaf} hôm đó đã được tiệm mời lên nói chuyện riêng. Nó hứa không tái phạm vụ {mistake}. Tiệm xin lỗi {name} nha.",
      "Chủ tiệm đọc review xong ngồi ôm hũ đồ chua, suy nghĩ về cuộc đời và về vụ {mistake}. Tiệm xin lỗi ạ.",
      "Tiệm xin phép đăng hình cái dao rạch bánh đang bị phạt đứng góc vì vụ {mistake}. Tiệm sửa liền ạ.",
      "Cập nhật: cái phiếu order đã được dán to gấp đôi để tiệm không còn vụ {mistake}. Xin lỗi {name} nha.",
      "Tiệm xin lỗi {name}. Tiệm vừa dặn ổ {loaf}: lần sau gặp {name} phải ngoan, đúng phiếu, giòn đàng hoàng.",
      "Ảnh tiệm lúc đọc review: mắt rưng rưng, tay vẫn phết pate. Tiệm hứa ca sau tốt hơn ạ.",
    ],
  },

  // ===== Cục súc =====
  "cuc-thanks": {
    up: [
      "Giòn là chuyện bình thường. Mai tới sớm, còn giòn hơn.",
      "Biết rồi, ổ {loaf} của tiệm ngon. Cảm ơn {name} đã nói ra sự thật.",
      "{stars} sao là đúng bài. Cảm ơn {name}. Đừng khen nữa, tiệm ngại.",
      "Cảm ơn. Tiệm không giỏi nói, tiệm giỏi nướng. {name} ghé là biết.",
      "Ừ, cảm ơn {name}. Lần sau tới sớm, trễ là hết mẻ đầu, khỏi trách.",
      "Khen vậy là tiệm nhận. Cảm ơn {name}, nói ít hiểu nhiều.",
      "Tiệm đọc rồi, tiệm cười rồi, tiệm đi canh lò tiếp. Cảm ơn {name}.",
      "Cảm ơn {name}. Ổ giòn là chuyện bình thường ở đây, nhưng được khen thì vẫn vui.",
    ],
    decor: [
      "Mấy cái ghế đó tiệm tự khiêng về. Ngồi được là đúng rồi. Cảm ơn.",
      "Tủ kính tiệm lau mỗi sáng. Sáng là phải. Cảm ơn {name}.",
      "Cái bảng giá tiệm viết tay. Chữ xấu nhưng giá thật. Cảm ơn đã khen.",
      "Góc đó tiệm sắp mất nguyên buổi chiều. Khen là đúng. Cảm ơn.",
      "Chậu cây nghe khen chắc mọc thêm lá. Tiệm thì không mọc, tiệm cảm ơn.",
      "Tiệm nhỏ, nhưng gọn. Vậy thôi. Cảm ơn {name}.",
    ],
    multi: [
      "Cả phòng ổ nào đúng ổ nấy. Tiệm làm nghề mà. Cảm ơn cả nhóm.",
      "Mười ổ ráp cùng lúc mà không lộn. Không phải may đâu, là luyện tay. Cảm ơn {name}.",
      "Đơn nhóm là sở trường. Lần sau rủ đông hơn, tiệm chịu được.",
      "Không hành, ít ớt, thêm trứng. Tiệm nhớ hết. Cảm ơn.",
      "Túi bánh tới nơi còn giòn là đúng. Tiệm gói chặt tay. Cảm ơn {name}.",
      "Cả nhóm khen thì tiệm nhận một lần cho cả nhóm. Cảm ơn.",
    ],
  },
  "cuc-brag": {
    up: [
      "Biết mà. Tiệm nướng ổ {loaf} này từ hồi {name} còn đi học ăn sáng bằng tiền mẹ cho.",
      "{stars} sao hả? Tiệm tưởng sáu sao. Thôi, nhận {stars} sao cũng được.",
      "Giòn là đúng. Tiệm nói thẳng: hẻm này khó kiếm ổ {loaf} nào chịu khó hơn.",
      "Không có gì bất ngờ. Tiệm canh lò nhiều tới mức nằm mơ cũng nghe tiếng rộp.",
      "Khen chuẩn. Nhưng {name} ăn thử nhân khác đi, còn ngon nữa.",
      "Tiệm đọc review mà gật gù: người này biết ăn bánh mì.",
      "Ừ. Ngon. Tiệm biết. Cảm ơn đã xác nhận giùm.",
      "Ổ đó tiệm canh từng giây trong lò. Giòn là xứng đáng, không phải may.",
    ],
  },
  "cuc-sorry": {
    down: [
      "Vụ {mistake}. Lỗi tiệm. Mai tới, tiệm làm lại. Hết.",
      "Ừ, ổ {loaf} hôm đó dính vụ {mistake}. Tiệm sai. Sửa liền, hứa.",
      "Tiệm đọc rồi, tiệm tức chính mình. Vụ {mistake} là không được. Ca sau đúng, không đúng thì tiệm tự phạt chà lò.",
      "Xin lỗi {name}. Một câu thôi, còn lại để ổ sau nói thay.",
      "Sai thì nhận. Vụ {mistake} là lỗi tay tiệm, không phải lỗi của {name}.",
      "Không vòng vo: tiệm làm sai. Mai tiệm dán cái phiếu ngay trước thớt mà ráp.",
      "Tiệm nhận lỗi vụ {mistake}. Không giải thích, không đổ cho cái lò. Sửa.",
      "Xin lỗi. Tiệm ghi lỗi này lên tấm bảng trong quầy, sáng nào cũng đọc trước khi nhóm lò.",
    ],
    slow: [
      "Chậm là chậm. Tiệm nhận. Ca sau nhanh, không thì tiệm tự chạy ra mời ổ.",
      "Để {name} chờ là tiệm sai. Không có lý do nào ngon hơn ổ bánh mì cả.",
      "Ừ, hôm đó tiệm chậm như rùa. Mai tiệm luyện tay như luyện thi.",
      "Chờ lâu, bánh nguội, khách đói. Ba cái sai. Tiệm sửa cả ba.",
      "Không bào chữa. Mai tiệm nướng sẵn mẻ đầu, ráp nhanh hơn.",
      "Tiệm chậm, tiệm biết. Mai tới, đếm giờ đi, tiệm chịu.",
    ],
  },
  "cuc-truth": {
    down: [
      "Nói thẳng nha {name}: phiếu ghi đúng, tiệm ráp… lệch. Tiệm nhận, nhưng {stars} sao là hơi ác đó.",
      "Tiệm thẳng tính: ổ {loaf} hôm đó dính vụ {mistake} thật, nhưng {name} ăn hết sạch tới mẩu cuối rồi mới chê thì tiệm hơi buồn.",
      "Chuyện là vậy: hôm đó mười khách một lượt, tiệm có hai tay. Tiệm sai, nhưng tiệm không phải bạch tuộc.",
      "Tiệm đọc kỹ. Tiệm thấy {name} nói đúng một nửa. Nửa còn lại mời ghé tiệm cãi trực tiếp, tiệm mời trà đá.",
      "{name} chê thì tiệm nghe. Nhưng tiệm nói luôn: ổ này nhiều người khen, chắc hôm đó tiệm với {name} chưa hợp nhau.",
      "Tiệm không giỏi xin lỗi vòng vo. Vụ {mistake} thì sửa. Còn chê luôn cả cái hẻm thì tiệm xin phép không nhận.",
      "Nói thật lòng: đọc review này tiệm muốn cãi, rồi đi nướng thử lại, thấy {name} nói cũng có lý. Cay hơn ớt.",
      "Tiệm thẳng nha: lần sau {name} dặn rõ hơn một chút, tiệm cũng đọc phiếu kỹ hơn một chút. Hai bên cùng tiến bộ.",
    ],
    slow: [
      "Chờ lâu thật. Nhưng hôm đó cả đội thợ hồ kéo tới một lúc, tiệm ráp muốn bốc khói. Thông cảm một chút được không?",
      "Tiệm nói thẳng: muốn nhanh thì tới lúc vắng, muốn giòn thì chờ bánh ra lò. Hôm đó tiệm chọn giòn.",
      "Ừ chậm. Nhưng bánh nướng thì phải có thời gian. Mì gói mới ba phút.",
      "Tiệm nhận chậm, không nhận chuyện tiệm làm biếng. Hôm đó tiệm chạy như thi chạy tiếp sức.",
      "Hôm đó lò mới nhóm, bánh chưa kịp vàng. Đưa ổ sống thì {name} còn chê hơn.",
      "Chậm năm phút, giòn cả buổi sáng. Tiệm chọn vậy. Lần sau tiệm cố được cả hai.",
    ],
  },
  "cuc-dare": {
    down: [
      "Chê hả? Ghé lại. Tiệm ráp ổ khác trước mặt. Chê nữa thì tiệm ráp nữa.",
      "Mai ghé đi {name}. Tiệm làm lại ổ {loaf}, {name} cắn, rồi mình nói chuyện tiếp.",
      "Tiệm không cãi trên mạng. Tiệm thách {name} ghé lại ăn thử một ổ đúng bài.",
      "Lời nói gió bay, tiếng rộp thì không. Ghé lại, tiệm chứng minh bằng ổ bánh.",
      "Thách {name} ghé ca sau. Nếu vẫn dính vụ {mistake}, tiệm tự viết review một sao cho mình.",
      "Hẹn {name} ca sau. Tiệm ráp, {name} chấm. Công bằng, sòng phẳng.",
      "Ghé lại đi. Tiệm không hứa nói ngọt, tiệm hứa bánh giòn và đúng phiếu.",
    ],
  },
  "cuc-meme": {
    up: [
      "Ảnh chụp chủ tiệm đọc review {stars} sao: mặt vẫn lạnh, trong lòng đang nhảy múa.",
      "Khen nữa đi, tiệm đang giả vờ không quan tâm mà quan tâm lắm.",
      "Meme hôm nay: \"Khi khách khen mà mình phải giữ hình tượng cục súc\".",
      "Tiệm vừa lấy review của {name} làm hình nền điện thoại. Không phải vì cảm động. Chắc vậy.",
      "Biểu cảm của tiệm khi được khen: gật đầu một cái, rồi đi ra sau lò cười một mình.",
      "Ổ {loaf} sau khi được {name} khen: đòi tăng giá. Không có đâu nha, vẫn ổ ba chục.",
    ],
    down: [
      "Ảnh minh hoạ: cái hũ ớt sau khi đọc review. Nó biết nó sai rồi.",
      "Meme hôm nay: \"Khi review nói {mistake} và mình biết là đúng\".",
      "Tiệm đọc review xong nhìn cái lò. Cái lò nhìn lại tiệm. Không ai nói gì.",
      "Tiệm đăng hình con cá vàng để tưởng nhớ trí nhớ của tiệm hôm ráp ổ {loaf} đó.",
      "Phút im lặng dành cho ổ {loaf} hôm đó. Nó đã cố gắng, chỉ là cố sai hướng.",
      "Cập nhật: ổ dính vụ {mistake} đã bị tiệm cho nghỉ việc. Ổ mới ngoan hơn, mời ghé thử.",
    ],
  },

  // ===== Lầy lội =====
  "lay-thanks": {
    up: [
      "Ổ bánh đọc review xong giòn thêm 20%. Cảm ơn {name}. #bánhmìcócảmxúc",
      "Diễn văn nhận giải: tiệm xin cảm ơn {name}, cảm ơn pate, cảm ơn đồ chua, cảm ơn cái lò đã không tắt giữa chừng. #nămsao",
      "Cảm ơn {name} nha. Tiệm đã đóng khung review này, treo cạnh giấy phép kinh doanh.",
      "Review này được tiệm đọc ba lần, chụp màn hình bốn lần, gửi mẹ một lần. Mẹ hỏi: lửa có non không.",
      "Tiệm cảm ơn {name} bằng một điệu nhảy, nhưng vì là chữ nên bạn tự tưởng tượng giùm nha.",
      "Cảm ơn {name}. Tiệm hứa ổ sau vẫn giòn, nếu không giòn thì tiệm làm meme tự giễu.",
      "Lời cảm ơn này được tài trợ bởi: hũ pate, rổ đồ chua, và tấm lòng của {shop}.",
      "{name} khen một câu, tiệm vui một tuần. Tỷ giá rất có lợi cho tiệm. Cảm ơn nha.",
    ],
    decor: [
      "Cảm ơn {name}. Cái ghế nhựa nghe khen đã xin được lên ảnh bìa trang của tiệm.",
      "Tủ kính cảm ơn {name}. Nó nói nó cũng cố gắng sáng lắm, chỉ là không biết nói.",
      "Bảng giá viết tay của tiệm vừa được khen lần đầu trong đời. Nó đang xúc động, xin phép nghỉ một ngày.",
      "Chậu cây trước tiệm cảm ơn {name}. Mai nó sẽ cố quang hợp đẹp hơn.",
      "Góc đứng chờ được khen, tiệm xin đặt tên chính thức: \"Góc Chờ Giòn\". Cảm ơn {name}.",
      "Cảm ơn {name}. Cả tiệm đã họp và thống nhất: không ai được dọn chậu cây đi nữa.",
    ],
    multi: [
      "Cảm ơn cả phòng của {name}. Đơn nhiều ổ không lộn ổ nào, tiệm xin tự thưởng một điệu nhảy.",
      "Nhóm {name} khen thì tiệm xin nhận. Cả nhóm là nhân chứng tiệm không quên ổ không hành nào.",
      "Mười ổ, mười yêu cầu, không một sai sót. Tiệm xin cảm ơn {name} và cảm ơn trí nhớ hôm nay của tiệm.",
      "Cả nhóm của {name} ăn đúng ổ của mình. Hiếm có, đáng ghi vào sử sách của hẻm. #đơnnhóm",
      "Cảm ơn {name}. Túi bánh của cả phòng đã về tới nơi an toàn, giòn nguyên, không ai mất ổ nào.",
      "Tiệm vừa tự trao huy chương \"Ráp Đơn Nhóm Không Nhầm\". Người trao: tiệm. Người nhận: cũng tiệm. Cảm ơn {name}.",
    ],
  },
  "lay-sorry": {
    down: [
      "Tiệm xin lỗi bằng thơ: \"Ổ {loaf} hôm ấy lỡ tay / {mistake} một bữa, hứa rày sửa ngay.\"",
      "Lục bát xin lỗi: \"{name} ơi đừng giận tiệm chi / ca sau ổ mới đúng y phiếu ghi.\"",
      "Xin lỗi phiên bản rap: lỗi là của tiệm, ổ là của bạn, ca sau tiệm sửa, không có lần hai. Yo.",
      "Tiệm viết thư tay, chụp lại, đăng lên: \"Gửi {name}, tiệm sai rồi, tiệm thương, tiệm sửa.\"",
      "Bản tin xin lỗi: phóng viên tiệm đưa tin, nghi phạm \"{mistake}\" đã bị bắt giữ, ca sau xét xử.",
      "\"Một ổ lỡ dở bao lời / ca sau nướng lại cho đời giòn hơn.\" Tiệm xin lỗi {name} nha.",
      "Tiệm xin lỗi bằng cả trái tim và một câu vè: \"{mistake} là dở, tiệm sửa liền tay.\"",
      "Xin lỗi kiểu tiệm: cúi đầu ba giây, đứng dậy làm lại, đăng hình làm bằng chứng.",
    ],
    slow: [
      "Thơ xin lỗi: \"{name} đứng đợi đã lâu / bánh mì chưa tới, bụng sầu ai hay.\" Tiệm sửa liền ạ.",
      "Bản tin thời sự: chủ tiệm bị phát hiện chậm hơn ổ bánh trong lò. Đã luyện tay, ca sau báo cáo.",
      "Tiệm xin lỗi {name}. Cái đồng hồ trong tiệm đã được thay pin, chủ tiệm thì đang được thay tốc độ.",
      "Lục bát hối lỗi: \"Sáng nay khách đợi mỏi chân / mai tiệm nướng sớm thêm phần mười giây.\"",
      "POV: bạn đứng chờ ổ bánh lâu tới mức kịp đọc hết tin tức buổi sáng. Tiệm xin lỗi, đã sửa.",
      "Tiệm xin lỗi bằng một bài vè chạy deadline: nhóm lò sớm, ráp nhanh tay, không ai chờ nữa.",
    ],
  },
  "lay-meme": {
    up: [
      "POV: bạn là ổ {loaf} vừa được {name} cho {stars} sao. #giònrụm",
      "Tiệm đọc review xong mở nhạc ăn mừng, cái kẹp gắp bánh tự nhảy theo nhịp. #nămsao",
      "Tin nóng: ổ {loaf} được khen, toàn bộ mẻ bánh trong lò đứng dậy vỗ tay.",
      "Khi khách khen mà tiệm phải tỏ ra bình tĩnh: bên ngoài gật đầu, bên trong bắn pháo hoa.",
      "Đây là tấm hình hũ pate khi biết mình được nhắc gián tiếp trong review {stars} sao.",
      "Tiệm xin phép in review này lên tạp dề. Chữ to, dính bột cũng được.",
      "Mẹ ơi con được khen rồi. Mẹ: ừ, nhớ canh lửa. #tiệmnhàmình",
    ],
    down: [
      "Hành tự leo vô ổ, tiệm đã khiển trách hành. Mai hành bị cấm cửa. #khônghành",
      "POV: bạn là ổ {loaf} dính vụ {mistake} và giờ cả hẻm đều biết. #tiệmsai",
      "Tiệm đọc review xong: hình mờ dần, nhạc buồn nổi lên, chữ chạy \"còn tiếp\".",
      "Cái hũ ớt hôm đó đã được tiệm đưa đi tâm sự. Nó hứa sẽ đếm lại từng muỗng.",
      "Giả thuyết: ổ {loaf} hôm đó dính vụ {mistake} vì nó đang yêu. Tiệm đã nói chuyện với nó.",
      "Đây là ảnh tiệm đọc review: một chú mèo nhìn ra cửa sổ, nghĩ về vụ {mistake}.",
      "Tiệm đã thêm \"{mistake}\" vào danh sách những điều không bao giờ được lặp lại, ngay dưới \"quên tắt lò\".",
    ],
  },
  "lay-trend": {
    up: [
      "Trend mới: quay tiếng rộp khi cắn ổ {loaf} của tiệm, ghi caption như {name}, tiệm tặng sticker. #thửtháchrộp",
      "Tiệm phát động thử thách: ai khen tiệm hay hơn {name} thì được… tiệm khen lại. #khenquaylại",
      "Biến review này thành bài hát: \"Ổ {loaf} ơi, sao em giòn thế\". Ai hát thì gắn tên tiệm vô nha.",
      "Tiệm xin phép biến câu khen của {name} thành câu chào khách của cả tuần. #câuchàotuầnnày",
      "Thử thách 5 giây: cắn một miếng {loaf} rồi nói một câu khen không trùng {name}. Đố đó.",
      "Hashtag của tuần: #ổbachụcnămsao. Đăng ổ của bạn, tiệm thả tim hết.",
    ],
    down: [
      "Thử thách mới: đoán xem ổ {loaf} hôm đó dính vụ {mistake} cỡ nào. Ai đoán đúng được tiệm làm lại trong tưởng tượng. #đoánlỗi",
      "Tiệm phát động #tiệmsaitiệmsửa: mỗi lần tiệm sai, tiệm đăng video tự sửa. Tập một: hôm nay.",
      "Biến review thành phim ngắn: tập 1 \"Ổ bánh định mệnh\", tập 2 \"Tiệm chuộc lỗi\". Đang quay.",
      "Trend tuần này: kể lần bạn nhận nhầm ổ bánh mì đáng nhớ nhất. Tiệm kể trước: chính là ổ của {name}.",
      "Tiệm thách cả hẻm: tìm thêm một ổ {loaf} nào lỗi nữa, tiệm đứng trước quầy hát một bài. #tháchtiệm",
      "Thử thách: review tiệm bằng đúng ba chữ. Tiệm mở màn: \"lỗi, sửa, hứa\".",
    ],
  },

  // ===== Sale-man =====
  "sale-thanks": {
    up: [
      "Cảm ơn {name}! Mai mua 5 ổ tặng 1 trà đá, rủ cả phòng luôn nha!",
      "Dạ cảm ơn {name}. {name} khen vậy chắc đồng nghiệp {name} cũng sẽ thích, rủ cả phòng ghé nha.",
      "Cảm ơn {name}. Tiệm có bánh cho cả nhóm, túi cho cả nhóm, và lời cảm ơn cho cả nhóm.",
      "Review này đáng được chia sẻ cho cả lớp, cả phòng, cả xóm. Rủ mọi người ghé tiệm nha {name}.",
      "Cảm ơn {name}! Mang thêm một người bạn ca sau, tiệm ráp hai ổ giòn như ảnh.",
      "Tiệm cảm ơn {name}. Đồn xa giùm tiệm nha, mỗi người bạn {name} rủ tới là một tiếng rộp vui của tiệm.",
      "Dạ cảm ơn {name}. Nhóm chat nào cũng cần một ổ {loaf} buổi sáng, {name} gửi giùm tiệm địa chỉ nha.",
      "Cảm ơn {name}, tiệm xin phép mời luôn hội bạn của {name}. Ca sau tiệm nướng dư một mẻ chờ cả nhóm.",
    ],
  },
  "sale-sorry": {
    down: [
      "Xin lỗi {name} vì {mistake}! Mai ghé đọc mã \"GIONLAI\" giảm 5k ổ bất kỳ, tiệm làm lại chuẩn 100%!",
      "Tiệm thành thật xin lỗi. Ca sau {name} ghé, ổ {loaf} tiệm làm lại, giảm 5k, hứa đúng phiếu.",
      "Xin lỗi {name}. Tiệm không chỉ xin lỗi suông, tiệm xin lỗi kèm ưu đãi và một ổ giòn đúng vị.",
      "Dạ tiệm sai. Ưu đãi chuộc lỗi đã gửi {name}, ca sau tiệm chứng minh tiệm sửa thật.",
      "Tiệm xin lỗi {name} vì vụ {mistake}. Ghé lại cho tiệm phục vụ lại từ đầu, giá mềm, ổ chuẩn.",
      "Tiệm xin lỗi nha {name}. Khách không vui là tiệm lỗ nhất, nên tiệm chịu lỗ thêm 5k cho ổ sau của {name}.",
      "Dạ tiệm xin lỗi. Lời hứa có hạn chót: ca sau. Ưu đãi có hạn chót: khi {name} ghé.",
      "Tiệm xin lỗi {name}. Ổ bù đã lên lịch, mã giảm đã gắn tên, chỉ còn chờ {name} ghé.",
    ],
  },
  "sale-voucher": {
    up: [
      "Cảm ơn {name}! Tặng {name} mã GHELAI giảm 5k ổ kế tiếp. Chốt đơn ca sau nha.",
      "Dạ cảm ơn {name}. Ghé lại tiệm đọc mã NAMSAO, tiệm giảm liền 5k.",
      "Review đẹp quá, tiệm gửi {name} voucher ổ sau. Mã có hạn tới khi lò còn nóng.",
      "Cảm ơn {name} đã tin tiệm. Tiệm tặng mã giảm, nhớ ghé dùng kẻo mã buồn.",
      "{stars} sao xứng đáng nhận voucher. {name} ghé ca sau, tiệm giảm ngay, không cần chụp màn hình.",
      "Tiệm cảm ơn {name} bằng thứ thiết thực nhất: mã giảm giá. Hẹn {name} ca sau.",
    ],
    down: [
      "Dạ tiệm xin lỗi {name}. Tặng {name} mã SUALOI giảm 5k, ghé ca sau tiệm làm lại ổ {loaf} thật chuẩn.",
      "Vụ {mistake} tiệm xin nhận và xin đền bằng voucher. {name} ghé lại là dùng được liền.",
      "Tiệm xin lỗi và tặng {name} mã giảm. Ổ sau đúng phiếu, giá lại mềm hơn, hai cái lợi.",
      "Dạ tiệm gửi {name} mã GIONLAI. Ghé lại cho tiệm cơ hội chuộc lỗi bằng ổ {loaf} giòn đúng bài.",
      "Tiệm biết {name} chưa vui. Mã giảm 5k đang chờ {name}, còn ổ nóng thì chờ ca sau.",
      "Tiệm xin lỗi ạ. Tặng {name} voucher, hạn dùng: ngay khi {name} sẵn sàng tha thứ.",
      "Mã giảm giá này tiệm đặt tên theo {name}. Ghé lại đọc tên mình là được giảm.",
    ],
  },
  "sale-combo": {
    up: [
      "Cảm ơn {name}! Nhân tiện: combo ổ {loaf} thêm trứng kèm trà đá chỉ nhỉnh chút xíu, ca sau tiệm có sẵn nha.",
      "Dạ cảm ơn {name}. {name} thích ổ {loaf} thì chắc thích combo hai ổ cho hai người, mời rủ bạn.",
      "Review {stars} sao, tiệm mừng bằng combo: ổ {loaf} kèm ly sữa đậu, giá như được tặng.",
      "Cảm ơn {name}. Tiện đây giới thiệu combo đi làm: ổ đầy, trà đá mát, chủ tiệm cười miễn phí.",
      "Ổ {loaf} được khen thì tiệm ra combo liền: ca sau gọi hai ổ, ổ thứ hai thêm chả.",
      "Cảm ơn {name}! Ai đọc tới đây: ổ {loaf} đang là món hot nhất tiệm, ca sau ghé gọi kẻo hết mẻ.",
      "{name} khen đúng món tủ. Combo món tủ ca sau đã sẵn, ai tới trước ăn trước.",
    ],
    down: [
      "Dạ tiệm xin lỗi {name}. Ca sau tiệm ra combo ổ {loaf} làm lại công thức mới, mời {name} thử đầu tiên.",
      "Tiệm xin lỗi vụ {mistake}. Để chuộc lỗi, tiệm ra combo đúng phiếu, ca sau ai gọi ổ {loaf} được thêm trứng.",
      "Lỗi hôm đó tiệm sửa rồi. Mời mọi người ghé ca sau thử combo ổ {loaf} phiên bản đã sửa.",
      "Dạ xin lỗi {name}. Tiện thông báo: combo hai ổ ca sau, cam kết không tái diễn vụ {mistake}.",
      "Tiệm nhận lỗi. Tiệm tin ổ {loaf} phiên bản mới sẽ làm {name} đổi ý, giá combo còn mềm hơn.",
      "Tiệm xin lỗi {name}. Ai từng gặp vụ {mistake} ở tiệm, ca sau đọc tên review được ưu tiên combo.",
    ],
  },
};

/** Câu đáp lại: reviewer = người viết review, net = cư dân mạng. Biến {name} {shop} {loaf}. */
export const COMEBACK = {
  warm: {
    reviewer: [
      "Tiệm dễ thương quá, mình ghé tiếp chắc luôn.",
      "Đọc câu trả lời xong mình muốn tăng thêm một sao mà hết sao để tăng.",
      "Dạ hẹn tiệm, sáng mai mình rủ thêm cả phòng.",
      "Tiệm trả lời có tâm ghê. Mình lưu tiệm vào danh sách quán ăn sáng ruột.",
      "Cảm ơn tiệm nha, mình mới kể cho mẹ nghe xong.",
      "Ui tiệm trả lời nhanh vậy. Mai mình ghé lúc bánh mới ra lò.",
    ],
    net: [
      "Thấy tiệm trả lời khách vậy là muốn ghé thử một ổ rồi.",
      "Lâu lắm mới thấy tiệm trả lời review mà đọc thấy ấm như ổ bánh mới ra lò.",
      "Lưu tiệm lại, sáng mai ghé.",
      "Câu trả lời này nên được dạy trong lớp chăm sóc khách hàng.",
      "Tiệm nhỏ mà chu đáo, ủng hộ tiệm một ổ.",
    ],
  },
  promise: {
    reviewer: [
      "Được, mình cho tiệm một cơ hội. Ca sau mình ghé kiểm tra nha.",
      "Xin lỗi đàng hoàng vậy thì mình hết giận rồi. Hẹn ca sau.",
      "Mình sẽ quay lại, và mình sẽ nhìn kỹ từng cọng hành đó.",
      "Ok tiệm, lời hứa đã được ghi nhận. Mình chụp màn hình rồi nha.",
      "Tiệm nói vậy thì mình tin. Lần sau đúng phiếu là mình sửa review.",
      "Mình hơi gắt hôm đó, tiệm nhận lỗi vậy mình cũng thấy ngại.",
    ],
    net: [
      "Hứa rồi đó nha, cả hẻm làm chứng.",
      "Tiệm biết nhận lỗi là được rồi, nhiều chỗ còn không thèm trả lời.",
      "Hóng ca sau xem tiệm giữ lời không.",
      "Nhận lỗi gọn vậy là mình quý.",
      "Lỗi thì ai cũng có, sửa được là được. Ủng hộ tiệm.",
    ],
  },
  viral: {
    reviewer: [
      "Trời ơi câu trả lời của tiệm còn nổi hơn review của mình.",
      "Mình đi đâu cũng có người hỏi: có phải người được tiệm bánh mì trả lời không.",
      "Ok tiệm thắng. Mình ghé lại để chụp hình với tiệm.",
      "Câu này mình phải in lên áo. Tiệm cho phép không?",
      "Thôi được, mình đổi ý, tiệm cũng dễ thương theo kiểu riêng.",
      "Mình chụp màn hình gửi nhóm chat, giờ cả phòng muốn tới tiệm ăn sáng.",
    ],
    net: [
      "Câu trả lời này đi vào lịch sử của hẻm.",
      "Mình không ăn sáng bao giờ mà cũng muốn ghé vì câu này.",
      "Ai còn chưa đọc câu trả lời của tiệm thì lên đọc liền đi.",
      "Chủ tiệm này nên mở lớp dạy trả lời review.",
      "Lưu lại để học. Một câu mà vừa thật vừa vui.",
      "Đọc xong cười tới mức rớt luôn miếng đồ chua.",
    ],
  },
  phot: {
    reviewer: [
      "Tiệm nói vậy là sao? Mình chỉ góp ý thôi mà.",
      "Thái độ này thì mình xin phép suy nghĩ lại chuyện quay lại.",
      "Mình chụp màn hình rồi. Để mọi người cùng đánh giá.",
      "Mình góp ý thật lòng, tiệm trả lời như đi tranh luận.",
      "Ủa vậy là lỗi của mình hả tiệm?",
      "Mình sẽ viết thêm một review nữa, dài hơn ổ bánh.",
    ],
    net: [
      "Hóng drama. Ai có bánh mì que không.",
      "Tiệm thẳng quá thành ra hơi gắt đó nha.",
      "Cũng có lý, mà nói kiểu đó thì khách buồn.",
      "Đang có người chia sẻ bài này trên nhóm ăn sáng của quận.",
      "Phe khách hay phe tiệm? Mình đứng giữa gặm ổ bánh.",
      "Đọc xong không biết nên cười hay nên lo cho tiệm.",
    ],
  },
  flop: {
    reviewer: [
      "Ủa, mình không hiểu tiệm nói gì luôn.",
      "Ok tiệm. Mình đọc ba lần vẫn chưa hiểu, nhưng thôi.",
      "Câu này tiệm tự cười hả?",
      "Mình chờ một lời giải thích, nhận được một… cái gì đó.",
      "Haha. Mà khoan, là đang đùa hay đang buồn vậy tiệm?",
    ],
    net: [
      "Meme này cần giải thích bằng một meme khác.",
      "Mình thấy được cái cố gắng của tiệm.",
      "Tiệm ơi, admin đi ngủ sớm đi, mai còn nhóm lò.",
      "Không hiểu nhưng vẫn thả tim ủng hộ.",
      "Câu này nguội hơn ổ bánh để từ hôm qua.",
    ],
  },
  annoyed: {
    reviewer: [
      "Mình viết review chứ không xin mã giảm giá đâu tiệm.",
      "Trả lời mình mà như đọc tờ rơi.",
      "Mình góp ý chuyện ổ bánh, tiệm trả lời chuyện combo.",
      "Thôi được, mình nhận, nhưng mình vẫn hơi buồn.",
      "Tiệm chăm chốt đơn quá, chăm canh lò thêm chút nữa nha.",
    ],
    net: [
      "Review nào tiệm cũng chèn quảng cáo hả?",
      "Tưởng tiệm trả lời, hóa ra là banner.",
      "Câu này mình thấy ở tờ rơi dán cột điện đầu hẻm rồi.",
      "Hơi quá tay rồi nha tiệm, như ớt vậy.",
      "Muốn ủng hộ mà đọc vậy thấy mệt ghê.",
    ],
  },
  sold: {
    reviewer: [
      "Ok tiệm, mã đó mình dùng sáng mai liền.",
      "Tiệm giỏi chốt ghê, mình bị thuyết phục rồi.",
      "Combo nghe hợp lý, mình rủ thêm cả phòng.",
      "Được, mình quay lại. Nhớ giữ mã cho mình.",
      "Mình định thôi rồi, giờ lại muốn ghé vì mã giảm.",
    ],
    net: [
      "Có mã giảm thì mình ghé ké được không tiệm?",
      "Combo này hời thật, sáng mai rủ bạn đi.",
      "Thấy tiệm chịu chơi, ủng hộ một ổ.",
      "Lưu mã lại. Cảm ơn tiệm.",
      "Ổ ba chục mà còn giảm nữa thì mình ghé liền.",
    ],
  },
  back: {
    reviewer: [
      "Hẹn tiệm ca sau. Mình tới là làm đúng phiếu cho mình nha.",
      "Thách thì mình nhận. Ca sau gặp ở quầy.",
      "Mình sẽ ghé, và mình sẽ chấm điểm công bằng.",
      "Ok, cho tiệm một cơ hội. Mình dắt theo một người làm chứng.",
      "Tiệm mời vậy mình ngại từ chối. Ca sau mình ghé.",
    ],
    net: [
      "Cập nhật kết quả giùm nha, hóng ổ phục thù.",
      "Kèo này hay, ca sau ai rảnh ra xem.",
      "Hẹn gặp ở quầy, đúng tinh thần thể thao.",
      "Ước gì tiệm nào cũng mời khách quay lại như vậy.",
      "Hóng tiếng rộp của trận tái đấu.",
    ],
  },
};

/** Cư dân mạng để ý chủ tiệm đổi tính (trả lời bằng tính cách khác lần trước). Biến {from} {to}. */
export const FLIP_LINES = [
  "Hôm qua chủ tiệm còn {from}, nay {to} như bị hack nick vậy?",
  "Ủa, admin tiệm đổi ca hả? Mới hôm trước còn {from}, giờ đã {to}.",
  "Tiệm này có hai chủ hay một chủ hai chế độ vậy mọi người?",
  "Mình theo dõi tiệm vì kiểu {from}, giờ ở lại vì kiểu {to}. Bất ngờ ghê.",
  "Chủ tiệm đổi giọng nhanh hơn đổi nhân bánh.",
  "Phiên bản {to} của tiệm hôm nay là bản cập nhật hay bản lỗi vậy?",
  "Ai cầm điện thoại của tiệm hôm nay vậy? Khác hẳn hôm trước.",
  "Tiệm giống đồ chua đổi vị theo ngày: hôm trước {from}, hôm nay {to}.",
  "Sáng {from}, trưa {to}. Chủ tiệm nướng tính cách theo mẻ hả?",
  "Mình chụp màn hình hai câu trả lời đặt cạnh nhau: một bên {from}, một bên {to}. Ai giải thích giùm.",
];

export const NET_HANDLES = ["Cư Dân Hẻm 7", "Team Không Hành", "Hội Mê Pate", "Bé Su Ăn Sáng", "Chú Ba Đọc Review", "Người Qua Đường",
  "Anh Shipper Đọc Lén", "Hội Nghiện Đồ Chua", "Phe Ít Ớt", "Chị Gánh Xôi Đầu Hẻm", "Đồng Nghiệp Của Ai Đó", "Khách Quen Giấu Tên",
  "Thợ Hồ Ăn Sáng", "Hội Săn Tiếng Rộp"];

/** Review của cư dân mạng sinh ra từ câu trả lời (đổi điểm đánh giá). */
export const NET_REVIEW = {
  2: [
    "Đọc câu trả lời của tiệm với khách xong mình hơi ngại ghé. Thẳng thì tốt, mà nhẹ nhàng chút nữa thì hơn. #tháiđộ",
    "Chưa ăn nhưng đọc câu trả lời thấy căng. Tạm hai sao cho cách nói chuyện. #phốtnhỏ",
    "Tiệm trả lời khách như đang tranh luận trên truyền hình. Ổ bánh chắc giòn, nhưng mình né. #hóngdrama",
    "Một sao cho ổ bánh, một sao cho dũng khí. Tổng hai sao. #cươngquá",
    "Khách góp ý mà tiệm đáp như phản biện luận văn. Hai sao, mong tiệm bình tĩnh hơn. #bìnhtĩnh",
    "Mình theo dõi vụ trả lời review. Bánh giòn không cứu nổi câu chữ. Hai sao. #tiệmcăng",
    "Câu trả lời cay hơn cả ớt của tiệm. Hai sao, xin bớt một nấc. #ítớtgiùm",
    "Ghé vì tò mò sau vụ trả lời review. Bánh ổn, nhưng mình vẫn nhớ câu đó. Hai sao. #nhớđời",
  ],
  5: [
    "Ghé vì đọc câu trả lời của tiệm trên mạng. Bánh giòn, chủ tiệm y như trên mạng. Năm sao. #ghévìcâurep",
    "Tiệm trả lời review hay tới mức mình chạy xe qua hai quận để ăn thử một ổ. Đáng. #trendhẻm",
    "Câu trả lời đưa mình tới, tiếng rộp giữ mình lại. #nămsao",
    "Đọc câu trả lời xong ghé liền, chủ tiệm nói chuyện vui, pate ngon thật. #tiệmvui",
    "Đến vì meme, ở lại vì pate. Năm sao. #đếnvìmeme",
    "Không ngờ một câu trả lời review làm mình có quán ăn sáng ruột mới. #quánruột",
    "Ổ ba chục đầy đặn, chủ tiệm trả lời review có duyên. Năm sao cho cả hai. #ổbachục",
    "Cả phòng mình ghé sau khi đọc câu trả lời. Mười ổ đúng mười người. Năm sao. #đơnnhóm",
  ],
};

/** Khách quay lại nhờ câu trả lời (câu gọi món, theo tính cách lúc trả lời). */
export const RETURN_LINES = {
  hien: [
    "{Call} ơi, {self} quay lại nè. {Call} trả lời dễ thương quá nên {self} ghé: một ổ {loaf} nha.",
    "{Self} đọc câu trả lời của tiệm xong là muốn ghé liền. Cho {self} một ổ {loaf}.",
    "Lần này {self} tới để xem tiệm giữ lời không nè. Ổ {loaf} nha {call}.",
    "{Call} còn nhớ {self} không? Người viết review hôm trước đó. Một ổ {loaf}.",
    "{Self} quay lại theo lời mời nè {call}. Ổ {loaf}, làm từ từ cũng được.",
    "{Call} hứa sửa nên {self} ghé thử lại. Một ổ {loaf}, nhớ đọc phiếu kỹ nha.",
  ],
  cucsuc: [
    "{Call} thách {self} ghé thì {self} ghé. Ổ {loaf}. Ráp đi, {self} chấm.",
    "Người được trả lời cộc hôm trước đây. Cho {self} ổ {loaf}. Xem ai đúng.",
    "{Self} tới phục thù nè {call}. Ổ {loaf}. Không được sai cọng hành nào.",
    "{Call} nói ghé là biết. {Self} ghé rồi đó: một ổ {loaf}.",
    "{Self} đọc câu trả lời mà vừa tức vừa buồn cười. Giờ cho {self} một ổ {loaf}.",
    "Nghe nói mai tới sớm còn giòn hơn. {Self} tới sớm rồi nè {call}, ổ {loaf}.",
  ],
  lay: [
    "{Call} ơi {self} là nhân vật chính trong meme hôm trước nè. Ổ {loaf} nha.",
    "{Self} ghé để quay video đáp lại meme của tiệm. Một ổ {loaf}, cắn phải nghe rộp đó.",
    "Fan trang meme của tiệm đây. Cho {self} ổ {loaf}, gói cho lên hình đẹp.",
    "{Self} tới xem chủ tiệm ngoài đời có lầy như trên mạng không. Ổ {loaf} nha {call}.",
    "Meme hôm trước làm {self} cười cả buổi. Đền bằng một ổ {loaf} nha.",
  ],
  sale: [
    "{Call} ơi {self} có mã giảm nè. Cho {self} ổ {loaf}, nhớ trừ mã nha.",
    "{Self} tới dùng voucher. Một ổ {loaf}. Mã còn hạn chứ {call}?",
    "Tiệm chốt đơn giỏi quá nên {self} ghé. Ổ {loaf} nha {call}.",
    "Combo {call} quảng cáo hôm trước đó, {self} thử ổ {loaf} trước.",
    "{Self} quay lại vì cái mã giảm có tên mình. Ổ {loaf} nha.",
  ],
};

/** Câu kèm theo sau mỗi lựa chọn trong sự kiện drama, theo tính cách chủ tiệm (hiện ở bảng hậu quả). */
export const PERSONA_ASIDE = {
  hien: [
    "Chủ tiệm khẽ cúi đầu cảm ơn, dù người ta chưa kịp nói gì.",
    "Bạn nói nhỏ nhẹ tới mức cả hẻm phải nghiêng tai.",
    "Chủ tiệm hiền thêm một nấc, cái lò cũng cháy đều hơn.",
    "Bạn mỉm cười, kiểu nụ cười khiến người ta ngại cãi tiếp.",
    "Bạn rót thêm ly trà đá mời, theo thói quen của người hiền.",
    "Bạn ghi chuyện này vào sổ bằng nét chữ tròn trịa, có vẽ thêm ổ bánh nhỏ.",
    "Bạn xin lỗi luôn cả cái ghế nhựa vì lỡ va vào nó.",
    "Chủ tiệm gật đầu lia lịa, dạ vâng đã thành phản xạ.",
  ],
  cucsuc: [
    "Bạn lẩm bẩm: \"Xong. Việc tiếp.\" Rồi quay lại canh lò.",
    "Chủ tiệm khoanh tay, gật một cái. Với chủ tiệm, vậy là rất cảm động rồi.",
    "Bạn nói thẳng tới mức cái quạt máy cũng ngừng quay một nhịp.",
    "Bạn càu nhàu ba câu, rồi lén gói thêm một ổ mời.",
    "Chủ tiệm nhún vai: \"Nói thật thì mất lòng trước, được lòng sau. Sau bao lâu thì chưa biết.\"",
    "Bạn đặt con dao rạch bánh xuống thớt hơi mạnh. Ý là: vụ này giải quyết xong.",
    "Bạn thở dài kiểu người thẳng tính mà phải nói giảm nói tránh.",
    "Chủ tiệm cộc một câu, cười một cái. Khách quen đã quen.",
  ],
  lay: [
    "Bạn quay mặt về phía một cái máy quay tưởng tượng và nháy mắt.",
    "Chủ tiệm đã nghĩ xong caption cho chuyện này trước khi nó kịp kết thúc.",
    "Bạn ghi chú: \"Chuyện này làm meme được.\"",
    "Bạn ngâm nga nhạc nền phim truyền hình, rất đúng lúc.",
    "Chủ tiệm tạo dáng với ổ bánh mì như cầm micro nhận giải.",
    "Bạn gửi ngay vào nhóm chat của tiệm kèm ba dấu chấm than.",
    "Bạn tự đặt tên cho chuyện này: \"Tập 47: Tiệm và những ổ bánh\".",
    "Chủ tiệm cười trước, nghĩ sau, rồi lại cười tiếp.",
  ],
  sale: [
    "Bạn lẩm bẩm: \"Chuyện này mà làm khuyến mãi thì hay.\"",
    "Chủ tiệm đã kịp nhét một tờ rơi vào túi bánh của người ta.",
    "Bạn tính nhẩm: một rắc rối bằng bao nhiêu ổ bán thêm.",
    "Bạn nói \"dạ\" xong nói luôn \"mà tiệm đang có combo trà đá\".",
    "Chủ tiệm ghi chú: biến chuyện hôm nay thành chương trình tuần sau.",
    "Bạn mỉm cười kiểu người vừa nghĩ ra mã giảm giá mới.",
    "Chủ tiệm đưa danh thiếp, dù tiệm chưa từng in danh thiếp.",
    "Bạn chốt hạ: \"Vậy hẹn sáng mai, mua năm ổ tặng một trà đá.\"",
  ],
};

/** Câu chốt ca Nhật Ký theo tính cách (thay câu thường ở ca bình thường) và theo câu trả lời nổi bật nhất ngày. */
export const CAPTIONS_PERSONA = {
  hien: [
    "Bán {loaves} ổ, nói \"dạ\" nhiều hơn số ổ. Chủ tiệm hiền nhất hẻm vẫn giữ phong độ.",
    "{loaves} ổ, {stars} sao, và một chủ tiệm cảm ơn tới cả cái lò.",
    "Ca này êm như giọng chủ tiệm. Bán {loaves} ổ, không ai phải chờ lâu.",
    "Hiền thì không giàu nhanh, nhưng khách nhớ lâu. {loaves} ổ hôm nay.",
    "{loaves} ổ ra quầy, ổ nào cũng kèm một câu \"dạ tiệm cảm ơn\".",
  ],
  cucsuc: [
    "Bán {loaves} ổ. Nói ít, nướng nhiều, khách vẫn quay lại.",
    "{loaves} ổ, {stars} sao. Chủ tiệm không cười trên mạng, chỉ cười sau lò.",
    "Hôm nay {loaves} ổ ra quầy. Câu cửa miệng: \"Ăn đi rồi nói.\"",
    "Thẳng như ruột ngựa, giòn như vỏ bánh: {loaves} ổ hôm nay.",
    "{loaves} ổ. Không hành thì không hành. Hết.",
  ],
  lay: [
    "Bán {loaves} ổ và nghĩ ra ba meme. Một ngày năng suất của chủ tiệm lầy.",
    "{loaves} ổ, {stars} sao, và một caption chưa ai hiểu.",
    "Hôm nay tiệm không viral, nhưng tiệm vui. {loaves} ổ. #tiệmlầy",
    "Góc nhìn của cái lò: {loaves} ổ ra lò và một chủ tiệm hát suốt ca.",
    "{loaves} ổ bánh, mỗi ổ một tiếng rộp, mỗi tiếng rộp một ý tưởng meme.",
  ],
  sale: [
    "Bán {loaves} ổ, phát ba lời mời quay lại. Chủ tiệm chốt đơn cả trong giấc mơ.",
    "{loaves} ổ hôm nay. Câu của ngày: \"Mua năm ổ tặng một trà đá.\"",
    "Chốt ca: {loaves} ổ, {stars} sao, và một kế hoạch khuyến mãi cho sáng mai.",
    "Ai ghé cũng nghe một câu combo. {loaves} ổ hôm nay, mai bán gấp đôi.",
    "{loaves} ổ và một xấp mã giảm giá đã phát. Mai thu hoạch.",
  ],
};
export const CAPTIONS_REPLY = {
  viral: [
    "Câu trả lời review của tiệm hôm nay nổi hơn cả ổ bánh. +{followers} người theo dõi.",
    "Bán {loaves} ổ, nhưng thứ lên mạng là một câu trả lời review. Đời là vậy.",
    "Một câu trả lời, nửa cái hẻm chụp màn hình. {loaves} ổ và một khoảnh khắc nổi tiếng.",
    "Hôm nay tiệm nổi nhờ một câu trả lời. Mẹ hỏi: con nướng bánh hay viết văn?",
    "{loaves} ổ, {stars} sao, và một câu trả lời được in lên tạp dề (trong tưởng tượng).",
    "Tiệm học được: một câu trả lời đúng lúc bằng mười tờ rơi dán cột điện.",
  ],
  phot: [
    "Bán {loaves} ổ và một câu trả lời hơi thẳng. Cả hẻm đang hóng phần tiếp theo.",
    "Hôm nay tiệm dính phốt nhỏ vì nói thật. Bánh vẫn giòn, câu chữ thì cần nướng lại.",
    "{loaves} ổ bán ra, một câu trả lời bay đi không thu lại được. Bài học về độ cay của lời nói.",
    "Ca này có một câu trả lời nóng hơn cả lò than. Tiệm đang làm nguội.",
    "Tiệm lên nhóm ăn sáng của quận, nhưng không phải vì bánh giòn. Hẹn chương sau.",
    "Bán {loaves} ổ, cãi một câu, hot cả hẻm. Không khuyến khích, nhưng nhớ đời.",
  ],
  flip: [
    "Hôm nay chủ tiệm đổi tính {flips} lần. Khách hỏi: \"Hôm nay là phiên bản nào vậy?\"",
    "Sáng hiền, trưa cục, chiều lầy, tối chốt đơn. {flips} lần đổi tính trong một ngày.",
    "Bán {loaves} ổ với {flips} phiên bản chủ tiệm. Cái lò vẫn là cái lò.",
    "Cư dân mạng nghi tiệm có nhiều admin. Sự thật: một người, {flips} tâm trạng.",
    "{flips} lần đổi giọng, {loaves} ổ bánh. Chỉ có pate là giữ nguyên công thức.",
  ],
};

/** Bản cũ (v2) chỉ lưu loại trả lời: hiện lại đúng câu cũ. */
export const LEGACY_REPLY = {
  sorry: "Tiệm xin lỗi nha, ca sau tụi mình đọc phiếu hai lần rồi mới gói. Hứa bằng cả tiếng rộp.",
  thanks: "Cảm ơn bạn! Ổ sau tiệm vẫn nướng bằng cả trái tim và cái lò nóng.",
  meme: "Tiệm đọc review xong đứng im 3 giây, rồi quay lại canh lò tiếp.",
};
