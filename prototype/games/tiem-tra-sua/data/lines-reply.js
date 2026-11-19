// Trả lời review theo tính cách chủ tiệm (core/reviews.js). Giọng mạng xã hội Việt, hài tử tế.
// Cục súc là thẳng và cộc, KHÔNG chê ngoại hình, giới tính, vùng miền hay ai cả: chỉ châm chọc tình huống và chính tiệm.
// Không emoji, không thương hiệu thật, không người thật. Hashtag được.
//
// Biến trong câu trả lời: {name} người viết review, {drink} tên món, {mistake} lỗi (MISTAKE_TEXT), {shop} tên tiệm, {stars} số sao.
// Biến trong câu khách quay lại (RETURN_LINES): {self} {Self} {call} {Call} {drink} {sugar} {ice} (theo nhóm khách, core/shift.js lineCtx).
// Biến trong câu cư dân mạng "đổi tính" (FLIP_LINES): {from} {to} (tên ngắn tính cách cũ / mới).
//
// REPLY_LINES[option] = { up, down, decor?, multi?, slow? }: chọn [...bảng riêng theo chủ đề, ...bảng chung theo nhóm].
//   up = review ≥ 4 sao (decor: khen trang trí, multi: đơn nhiều ly); down = ≤ 3 sao (slow: chờ lâu / bỏ về / ly tới trễ).

export const PERSONAS = {
  hien: { name: "Hiền lành, lễ phép", short: "Hiền lành", desc: "Dạ vâng, cảm ơn, xin lỗi đủ cả. Trả lời an toàn: tăng ít mà chắc, hiếm khi có chuyện." },
  cucsuc: { name: "Cục súc, thẳng như ruột ngựa", short: "Cục súc", desc: "Nói ít, nói thẳng, không vòng vo (mà không bao giờ chê người). Đánh cược: có khi lên mạng, có khi dính phốt." },
  lay: { name: "Lầy lội, meme lord", short: "Lầy lội", desc: "Câu nào cũng thành meme. Độ hot lên xuống thất thường, đôi khi thành trend." },
  sale: { name: "Sale-man chốt đơn", short: "Sale-man", desc: "Review nào cũng thành khuyến mãi. Ra đơn, khách quay lại, nhưng có người thấy phiền." },
};
export const PERSONA_IDS = Object.keys(PERSONAS);

/** Lỗi theo lý do review (biến {mistake}). */
export const MISTAKE_TEXT = {
  sugarHigh: "ngọt quá tay", sugarLow: "nhạt đường", sugar: "lệch đường", iceHigh: "đá nhiều hơn trà", iceLow: "thiếu đá", ice: "lệch đá",
  toppingMissing: "quên topping", toppingWrong: "nhầm topping", toppingExtra: "dư topping", topping: "lệch topping", addWrong: "nhầm món", wrongDrink: "nhầm món",
  noLid: "quên đóng nắp", wrongCustomer: "giao nhầm người", swapped: "tráo hai ly", multiWrong: "lệch một ly trong đơn", slow: "chậm", timeout: "chậm tới mức khách bỏ về",
  multiLate: "trễ một ly", discount: "pha sai món", refund: "pha sai món", mang: "chuyện trên mạng", phot: "câu trả lời hơi gắt", ok: "chưa tròn vị",
};

/** Kết quả một câu trả lời (hiện ngay dưới review). */
export const OUTCOME_LABEL = {
  warm: "Khách vui", promise: "Đã hứa sửa", viral: "Lên mạng", phot: "Dính phốt", flop: "Meme xịt", annoyed: "Có người thấy phiền", sold: "Chốt đơn", back: "Khách sẽ quay lại", legacy: "Đã trả lời",
};

/** Lựa chọn trả lời theo tính cách. on: up | down | mistake | slow | meh | net | all. out: { kind, fx } hoặc roll { p, win, lose }.
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
    { id: "hien-invite", on: ["all"], cost: 10, label: "Mời ghé lại, ly sau tiệm mời", hint: "Tiền ly mời. Khách quay lại ca sau, +2 người theo dõi",
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
    { id: "cuc-dare", on: ["down"], label: "Thách ghé lại uống thử", hint: "Khách quay lại ca sau để \"phục thù\", +4 người theo dõi",
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
    { id: "sale-thanks", on: ["up"], label: "Cảm ơn, rủ khách mang hội bạn tới", hint: "Ca sau +2 khách. Có người thấy hơi lộ",
      out: { roll: { p: 0.8, win: { kind: "sold", fx: { guests: 2, followers: 3 } }, lose: { kind: "annoyed", fx: { guests: 1, followers: -2 } } } } },
    { id: "sale-sorry", on: ["down"], promise: true, cost: 3, label: "Xin lỗi kèm ưu đãi", hint: "Mã giảm. Khách quay lại ca sau, +3 người theo dõi",
      out: { kind: "promise", fx: { back: true, followers: 3, flag: "rep-back" } } },
    { id: "sale-voucher", on: ["all"], cost: 3, label: "Tặng mã giảm, mời quay lại", hint: "Khách quay lại ca sau. 1/4 thấy quảng cáo lộ",
      out: { roll: { p: 0.75, win: { kind: "sold", fx: { back: true, followers: 3, flag: "rep-back" } }, lose: { kind: "annoyed", fx: { back: true, followers: -3 } } } } },
    { id: "sale-combo", on: ["all"], label: "Chèn quảng cáo combo", hint: "Ca sau +1 khách, nhiều người gọi món này. 1/3 bị chê lộ liễu (danh tiếng −1)",
      out: { roll: { p: 0.65, win: { kind: "sold", fx: { guests: 1, demand: true } }, lose: { kind: "annoyed", fx: { guests: 1, demand: true, rep: -1, flag: "rep-sale", event: { id: "R06", days: 2 } } } } } },
  ],
};

export const REPLY_LINES = {
  // ===== Hiền lành =====
  "hien-thanks": {
    up: [
      "Dạ tiệm cảm ơn {name} nhiều lắm. Đọc review xong tiệm vui tới mức lau quầy hai lần.",
      "Cảm ơn {name} đã thương ly {drink} của tiệm. Lần sau ghé, tiệm vẫn pha bằng cả tấm lòng và cái cân điện tử.",
      "Dạ tiệm xin cảm ơn ạ. {name} khen một câu mà cả tiệm được tiếp thêm năng lượng tới cuối tháng.",
      "Cảm ơn {name} nha. Tiệm in review này ra dán cạnh máy trà, mỗi lần mệt là nhìn vào.",
      "Tiệm cảm ơn {name} rất nhiều. Hẹn {name} một ngày đẹp trời, ly {drink} vẫn đúng vị như hôm nay.",
      "Dạ, tiệm đọc review mà rưng rưng. Cảm ơn {name} đã dành thời gian viết cho một tiệm nhỏ đầu hẻm.",
      "Cảm ơn {name} ạ. Tiệm hứa giữ đúng công thức, không tự ý đổi vị như đổi hình đại diện.",
      "Tiệm cảm ơn {name}, chúc {name} một ngày ngọt vừa đủ, như ly {drink} hôm nay.",
    ],
    decor: [
      "Dạ cảm ơn {name} đã để ý góc nhỏ của tiệm. Cái ghế với chậu hoa nghe khen chắc cũng vui lắm.",
      "Tiệm cảm ơn {name}. Góc trang trí đó tiệm tự tay sắp từng món, được khen là tiệm có động lực mua thêm một chậu.",
      "Dạ, tiệm sẽ giữ góc ngồi luôn sạch và mát để {name} ghé lại ngồi lâu hơn ạ.",
    ],
    multi: [
      "Cảm ơn {name} và cả nhóm nha. Pha đủ ly cho cả nhóm mà không ai cầm nhầm, tiệm tự hào lắm.",
      "Dạ tiệm cảm ơn cả nhóm của {name}. Lần sau cả nhóm ghé, tiệm vẫn ghi tên từng người lên nắp.",
      "Tiệm cảm ơn {name}. Đơn nhiều ly là bài kiểm tra lớn của tiệm, được cả nhóm khen là tiệm qua môn rồi.",
    ],
  },
  "hien-sorry": {
    down: [
      "Dạ tiệm thành thật xin lỗi {name} vì ly {drink} bị {mistake}. Ca sau tiệm đo lại từng muỗng, hứa với {name}.",
      "Tiệm xin lỗi {name} nhiều. Lỗi {mistake} là lỗi của tiệm, tiệm đã ghi vào sổ và dán ngay cạnh máy pha.",
      "Dạ tiệm xin lỗi ạ. {name} bỏ tiền mua một ly vui mà nhận một ly {mistake}, tiệm thấy có lỗi lắm.",
      "Tiệm cúi đầu xin lỗi {name}. Từ ca sau, mỗi ly {drink} tiệm đọc phiếu hai lần rồi mới đóng nắp.",
      "Dạ cảm ơn {name} đã nói thẳng. Tiệm xin lỗi vì {mistake}, và hứa sửa bằng hành động chứ không chỉ bằng chữ.",
      "Tiệm xin lỗi {name}. Tiệm đã họp khẩn với chính mình và cái cân, kết luận: ca sau phải đúng.",
      "Dạ tiệm biết lỗi rồi ạ. Ly {drink} hôm đó {mistake}, tiệm sẽ không để chuyện này lặp lại.",
      "Tiệm xin lỗi {name} nha. Nếu {name} cho tiệm thêm một cơ hội, tiệm sẽ pha lại cho thật đúng vị.",
    ],
    slow: [
      "Dạ tiệm xin lỗi đã để {name} chờ lâu. Tiệm đang tập tay nhanh hơn mà vẫn giữ đúng công thức.",
      "Tiệm xin lỗi {name} vì phải chờ. Thời gian của {name} quý lắm, tiệm hứa ca sau gọn hơn.",
      "Dạ, tiệm xin lỗi. Hôm đó đông khách quá, nhưng đó không phải lý do để {name} phải chờ.",
      "Tiệm xin lỗi vì cái sự chậm. Tiệm đã sắp lại quầy để ly đi ra nhanh hơn ạ.",
    ],
  },
  "hien-explain": {
    down: [
      "Dạ cảm ơn {name} đã góp ý. Ly {drink} của tiệm vị hơi thanh, nếu {name} thích đậm hơn cứ dặn tiệm nha.",
      "Tiệm cảm ơn {name}. Tiệm xin phép giải thích nhẹ: công thức của tiệm là vậy, nhưng tiệm luôn sẵn lòng chỉnh theo khẩu vị ạ.",
      "Dạ, tiệm hiểu cảm giác của {name}. Lần sau {name} cứ nói nhỏ với tiệm muốn ngọt hay đậm, tiệm chỉnh liền.",
      "Tiệm cảm ơn {name}. {stars} sao cũng là {stars} ngôi sao, tiệm sẽ cố để lần sau có thêm sao nữa.",
      "Dạ, tiệm đọc kỹ rồi ạ. Tiệm sẽ thử pha lại công thức này thêm mấy lần cho tròn vị hơn.",
      "Tiệm cảm ơn góp ý của {name}. Chuyện trên mạng có khi chưa đủ, mời {name} ghé tiệm để tiệm kể đầu đuôi nha.",
      "Dạ, tiệm xin nghe hết. Mỗi góp ý là một bài học, tiệm ghi vào sổ, sổ dày dần như sách giáo khoa.",
    ],
  },
  "hien-invite": {
    up: [
      "Cảm ơn {name} nha. Lần sau ghé, ly {drink} đầu tiên tiệm mời, coi như quà cảm ơn bài review dễ thương.",
      "Dạ tiệm muốn mời {name} một ly vào lần tới, để tiệm được nghe {name} khen trực tiếp lần nữa.",
      "Tiệm cảm ơn {name}. Hẹn {name} ghé lại, tiệm mời ly đầu, ly sau thì {name} tự chọn vị.",
      "Dạ, tiệm để sẵn một ly mời tên {name}. Ghé lúc nào cũng được, ly không hết hạn đâu ạ.",
      "Tiệm cảm ơn {name} nhiều. Ca sau {name} ghé, tiệm mời một ly và xin một lời góp ý thật lòng.",
      "Review dễ thương quá, tiệm xin mời {name} ly kế tiếp. Không cần review lại đâu, ghé chơi là vui rồi.",
    ],
    down: [
      "Dạ tiệm xin lỗi {name}. Ca sau {name} ghé, tiệm xin mời lại một ly {drink} pha thật đúng, coi như làm lại từ đầu.",
      "Tiệm biết ly hôm đó chưa tròn vị. {name} ghé lại cho tiệm mời một ly bù nha, tiệm muốn sửa sai tận tay.",
      "Dạ, tiệm xin {name} một cơ hội: ghé lại, tiệm mời ly {drink}, đúng phiếu từng dòng.",
      "Tiệm xin lỗi và xin mời {name} quay lại. Ly bù tiệm pha, tiệm đứng nhìn {name} uống ngụm đầu luôn.",
      "Dạ {name} ơi, tiệm giữ một ly mời cho {name}. Lần này tiệm hứa không để {mistake} nữa.",
      "Tiệm thấy có lỗi lắm. Mời {name} ghé ca sau, ly đó tiệm mời, nụ cười tiệm cũng mời luôn.",
    ],
  },
  "hien-meme": {
    up: [
      "Tiệm đọc review xong ôm cái nắp ly xoay ba vòng. Cảm ơn {name} nha.",
      "Chủ tiệm lúc đọc review của {name}: cười như được khen học giỏi trước cả họ.",
      "Ảnh minh hoạ: ly {drink} ngồi trên quầy, tự hào vì được {name} khen. Cảm ơn {name} ạ.",
      "Tình trạng của tiệm sau review này: vui, hơi ngại, và muốn nấu thêm một nồi trân châu.",
      "Cái cân trong tiệm nhờ tiệm nhắn: cảm ơn {name}, nó làm việc chăm chỉ lắm.",
      "Tiệm đã đọc review này cho cả chậu hoa nghe. Chậu hoa cũng nói cảm ơn {name}.",
    ],
    down: [
      "Ly {drink} hôm đó đã được tiệm mời lên nói chuyện riêng. Nó hứa không {mistake} nữa. Tiệm xin lỗi {name} nha.",
      "Chủ tiệm đọc review xong ngồi ôm hũ trân châu, suy nghĩ về cuộc đời và về vụ {mistake}. Tiệm xin lỗi ạ.",
      "Tiệm xin phép đăng hình cái muỗng đang bị phạt đứng góc vì vụ {mistake}. Tiệm sửa liền ạ.",
      "Cập nhật: cái phiếu order đã được dán to gấp đôi để tiệm không còn {mistake}. Xin lỗi {name} nha.",
      "Tiệm xin lỗi {name}. Tiệm vừa dặn ly {drink}: lần sau gặp {name} phải ngoan, đúng vị, không làm màu.",
      "Ảnh tiệm lúc đọc review: mắt rưng rưng, tay vẫn khuấy trà. Tiệm hứa ca sau tốt hơn ạ.",
    ],
  },

  // ===== Cục súc =====
  "cuc-thanks": {
    up: [
      "Ngon thì nói ngon. Cảm ơn. Mai ghé tiếp.",
      "Biết rồi, ly {drink} của tiệm ngon. Cảm ơn {name} đã nói ra sự thật.",
      "{stars} sao là đúng bài. Cảm ơn {name}. Đừng khen nữa, tiệm ngại.",
      "Cảm ơn. Tiệm không giỏi nói, tiệm giỏi pha. {name} ghé là biết.",
      "Ừ, cảm ơn {name}. Lần sau tới sớm, trễ là hết trân châu, khỏi trách.",
      "Khen vậy là tiệm nhận. Cảm ơn {name}, nói ít hiểu nhiều.",
      "Tiệm đọc rồi, tiệm cười rồi, tiệm đi pha tiếp. Cảm ơn {name}.",
      "Cảm ơn {name}. Ly ngon là chuyện bình thường ở đây, nhưng được khen thì vẫn vui.",
    ],
    decor: [
      "Cái ghế đó tiệm tự khiêng về. Ngồi êm là đúng rồi. Cảm ơn.",
      "Góc đó tiệm sắp mất nguyên buổi chiều. Khen là phải. Cảm ơn {name}.",
      "Chậu hoa nghe khen chắc nở thêm. Tiệm thì không nở, tiệm chỉ cảm ơn.",
    ],
    multi: [
      "Cả nhóm ly nào đúng ly nấy. Tiệm làm nghề mà. Cảm ơn cả nhóm.",
      "Mấy ly pha cùng lúc mà không lộn. Không phải may mắn đâu, là luyện tay. Cảm ơn {name}.",
      "Đơn nhóm là sở trường. Lần sau rủ đông hơn, tiệm chịu được.",
    ],
  },
  "cuc-brag": {
    up: [
      "Biết mà. Tiệm pha ly {drink} này từ hồi {name} chưa biết uống trà sữa.",
      "{stars} sao hả? Tiệm tưởng sáu sao. Thôi, nhận {stars} sao cũng được.",
      "Ngon là đúng. Tiệm nói thẳng: hẻm này khó kiếm ly {drink} nào chịu khó hơn.",
      "Không có gì bất ngờ. Tiệm tập pha ly này nhiều tới mức mơ cũng pha.",
      "Khen chuẩn. Nhưng {name} uống thêm món khác đi, còn ngon nữa.",
      "Tiệm đọc review mà gật gù: người này biết uống.",
      "Ừ. Ngon. Tiệm biết. Cảm ơn đã xác nhận giùm.",
      "Ly đó tiệm canh từng giây. Ngon là xứng đáng, không phải may.",
    ],
  },
  "cuc-sorry": {
    down: [
      "Lỗi tiệm. Không bào chữa. Ca sau làm lại cho đúng.",
      "Ừ, ly {drink} hôm đó {mistake}. Tiệm sai. Sửa liền, hứa.",
      "Tiệm đọc rồi, tiệm tức chính mình. {mistake} là không được. Ca sau đúng, không đúng thì tiệm tự phạt lau sàn.",
      "Xin lỗi {name}. Một câu thôi, còn lại để ly sau nói thay.",
      "Sai thì nhận. Vụ {mistake} là lỗi tay tiệm, không phải lỗi của {name}.",
      "Không vòng vo: tiệm làm sai. Mai tiệm dán cái phiếu ngay trước mặt mà pha.",
      "Tiệm nhận lỗi {mistake}. Không giải thích, không đổ cho đá. Sửa.",
      "Xin lỗi. Tiệm ghi lỗi này lên bảng đen trong quầy, ngày nào cũng đọc.",
    ],
    slow: [
      "Chậm là chậm. Tiệm nhận. Ca sau nhanh, không thì tiệm tự chạy ra mời ly.",
      "Để {name} chờ là tiệm sai. Không có lý do nào ngon hơn ly trà cả.",
      "Ừ, hôm đó tiệm chậm như rùa. Mai tiệm luyện tay như luyện thi.",
    ],
  },
  "cuc-truth": {
    down: [
      "Nói thẳng nha {name}: phiếu ghi đúng, tiệm pha… lệch. Tiệm nhận, nhưng {stars} sao là hơi ác đó.",
      "Tiệm thẳng tính: ly {drink} hôm đó {mistake} thật, nhưng {name} uống hết sạch rồi mới chê thì tiệm hơi buồn.",
      "Chuyện là vậy: hôm đó mười khách một lượt, tiệm có hai tay. Tiệm sai, nhưng tiệm không phải bạch tuộc.",
      "Tiệm đọc kỹ. Tiệm thấy {name} nói đúng một nửa. Nửa còn lại mời ghé tiệm cãi trực tiếp, tiệm pha trà mời.",
      "{name} chê thì tiệm nghe. Nhưng tiệm nói luôn: ly này nhiều người khen, chắc hôm đó tiệm với {name} chưa hợp nhau.",
      "Tiệm không giỏi xin lỗi vòng vo. Sai vụ {mistake} thì sửa. Còn chê luôn cả cái hẻm thì tiệm xin phép không nhận.",
      "Nói thật lòng: đọc review này tiệm muốn cãi, rồi đi pha thử lại, thấy {name} nói cũng có lý. Cay.",
      "Tiệm thẳng nha: lần sau {name} dặn rõ hơn một chút, tiệm cũng đọc phiếu kỹ hơn một chút. Hai bên cùng tiến bộ.",
    ],
    slow: [
      "Chờ lâu thật. Nhưng hôm đó cả hẻm kéo tới một lúc, tiệm pha muốn bốc khói. Thông cảm một chút được không?",
      "Tiệm nói thẳng: muốn nhanh thì tới lúc vắng, muốn đúng thì chờ một xíu. Hôm đó tiệm chọn đúng.",
      "Ừ chậm. Nhưng ly ngon thì phải có thời gian. Mì gói mới ba phút.",
      "Tiệm nhận chậm, không nhận chuyện tiệm làm biếng. Hôm đó tiệm chạy như thi chạy tiếp sức.",
    ],
  },
  "cuc-dare": {
    down: [
      "Chê hả? Ghé lại. Tiệm pha ly khác trước mặt. Chê nữa thì tiệm pha nữa.",
      "Mai ghé đi {name}. Tiệm pha lại ly {drink}, {name} nếm, rồi mình nói chuyện tiếp.",
      "Tiệm không cãi trên mạng. Tiệm thách {name} ghé lại uống thử một ly đúng bài.",
      "Lời nói gió bay, ly trà thì không. Ghé lại, tiệm chứng minh bằng ly.",
      "Thách {name} ghé ca sau. Nếu vẫn {mistake}, tiệm tự viết review một sao cho mình.",
      "Hẹn {name} ca sau. Tiệm pha, {name} chấm. Công bằng, sòng phẳng.",
      "Ghé lại đi. Tiệm không hứa nói ngọt, tiệm hứa pha ngọt đúng phần trăm.",
    ],
  },
  "cuc-meme": {
    up: [
      "Ảnh chụp chủ tiệm đọc review {stars} sao: mặt vẫn lạnh, trong lòng đang nhảy múa.",
      "Khen nữa đi, tiệm đang giả vờ không quan tâm mà quan tâm lắm.",
      "Meme hôm nay: \"Khi khách khen mà mình phải giữ hình tượng cục súc\".",
      "Tiệm vừa lấy review của {name} làm hình nền điện thoại. Không phải vì cảm động. Chắc vậy.",
      "Biểu cảm của tiệm khi được khen: gật đầu một cái, rồi đi vô kho cười một mình.",
      "Cái ly {drink} sau khi được {name} khen: đòi tăng lương. Không có đâu nha.",
    ],
    down: [
      "Ảnh minh hoạ: cái muỗng đường sau khi đọc review. Nó biết nó sai rồi.",
      "Meme hôm nay: \"Khi review nói {mistake} và mình biết là đúng\".",
      "Tiệm đọc review xong nhìn cái máy trà. Cái máy trà nhìn lại tiệm. Không ai nói gì.",
      "Tiệm đăng hình con cá vàng để tưởng nhớ trí nhớ của tiệm hôm làm ly {drink} đó.",
      "Phút im lặng dành cho ly {drink} hôm đó. Nó đã cố gắng, chỉ là cố sai hướng.",
      "Cập nhật: ly {drink} bị {mistake} đã bị tiệm cho nghỉ việc. Ly mới ngoan hơn, mời ghé thử.",
    ],
  },

  // ===== Lầy lội =====
  "lay-thanks": {
    up: [
      "Cảm ơn {name}. Caption dài như sớ: tiệm cảm ơn ly {drink}, cảm ơn cái nắp, cảm ơn đời, cảm ơn bạn.",
      "Diễn văn nhận giải: tiệm xin cảm ơn {name}, cảm ơn trân châu, cảm ơn khán giả đã luôn ủng hộ. #namsao",
      "Cảm ơn {name} nha. Tiệm đã đóng khung review này, treo cạnh giấy phép kinh doanh.",
      "Review này được tiệm đọc ba lần, chụp màn hình bốn lần, gửi mẹ một lần. Cảm ơn {name}.",
      "Tiệm cảm ơn {name} bằng một điệu nhảy, nhưng vì là chữ nên bạn tự tưởng tượng giùm nha.",
      "Cảm ơn {name}. Tiệm hứa ly sau vẫn ngon, nếu không ngon thì tiệm làm meme tự giễu.",
      "Lời cảm ơn này được tài trợ bởi: nồi trân châu, cái cân, và tấm lòng của {shop}.",
      "{name} khen một câu, tiệm vui một tuần. Tỷ giá rất có lợi cho tiệm. Cảm ơn nha.",
    ],
    decor: [
      "Cảm ơn {name}. Cái ghế chờ nghe khen đã xin được lên ảnh bìa trang của tiệm.",
      "Góc trang trí cảm ơn {name}. Nó nói nó cũng cố gắng lắm, chỉ là không biết nói.",
    ],
    multi: [
      "Cảm ơn cả nhóm của {name}. Đơn nhiều ly không lộn ly nào, tiệm xin tự thưởng một điệu nhảy.",
      "Nhóm {name} khen thì tiệm xin nhận. Cả nhóm là nhân chứng tiệm không ghi nhầm tên trên nắp.",
    ],
  },
  "lay-sorry": {
    down: [
      "Tiệm xin lỗi bằng thơ: \"Ly {drink} hôm ấy lỡ tay / {mistake} một bữa, hứa rày sửa ngay.\"",
      "Lục bát xin lỗi: \"{name} ơi đừng giận tiệm chi / ca sau ly mới đúng y phiếu ghi.\"",
      "Xin lỗi phiên bản rap: lỗi là của tiệm, ly là của bạn, ca sau tiệm sửa, không có lần hai. Yo.",
      "Tiệm viết thư tay, chụp lại, đăng lên: \"Gửi {name}, tiệm sai rồi, tiệm thương, tiệm sửa.\"",
      "Bản tin xin lỗi: phóng viên tiệm đưa tin, nghi phạm {mistake} đã bị bắt giữ, ca sau xét xử.",
      "\"Một ly lỡ dở bao lời / ca sau pha lại cho đời ngọt hơn.\" Tiệm xin lỗi {name} nha.",
      "Tiệm xin lỗi bằng cả trái tim và một câu vè: \"{mistake} là dở, tiệm sửa liền tay.\"",
      "Xin lỗi kiểu tiệm: cúi đầu ba giây, đứng dậy pha lại, đăng hình làm bằng chứng.",
    ],
  },
  "lay-meme": {
    up: [
      "POV: bạn là ly {drink} vừa được {name} cho {stars} sao. #tranhoangtai",
      "Tiệm đọc review xong mở nhạc ăn mừng, cái nắp ly tự nhảy theo nhịp. #nammeosao",
      "Tin nóng: ly {drink} được khen, toàn bộ trân châu trong nồi đứng dậy vỗ tay.",
      "Khi khách khen mà tiệm phải tỏ ra bình tĩnh: bên ngoài gật đầu, bên trong bắn pháo hoa.",
      "Đây là tấm hình cái cân điện tử khi biết mình được nhắc gián tiếp trong review {stars} sao.",
      "Tiệm xin phép in review này lên áo đồng phục. Size L, ghi chữ to.",
      "Mẹ ơi con được khen rồi. Mẹ: ừ, nhớ rửa ly. #tiemnhaminh",
    ],
    down: [
      "POV: bạn là ly {drink} bị {mistake} và giờ cả hẻm đều biết. #taolasai",
      "Tiệm đọc review xong: hình mờ dần, nhạc buồn nổi lên, chữ chạy \"còn tiếp\".",
      "Cái muỗng đường hôm đó đã được tiệm đưa đi tâm sự. Nó hứa sẽ đếm lại.",
      "Giả thuyết: ly {drink} hôm đó bị {mistake} vì nó đang yêu. Tiệm đã nói chuyện với nó.",
      "Đây là ảnh tiệm đọc review: một chú mèo nhìn ra cửa sổ, nghĩ về vụ {mistake}.",
      "Bất ngờ chưa: không phải {name} khó tính, là ly {drink} hôm đó nổi loạn. Đã xử lý.",
      "Tiệm đã thêm \"{mistake}\" vào danh sách những điều không bao giờ được lặp lại, ngay dưới \"quên tắt bếp\".",
    ],
  },
  "lay-trend": {
    up: [
      "Trend mới: chụp ly {drink} của tiệm, ghi caption như {name}, tiệm tặng sticker. #thachkhentiem",
      "Tiệm phát động thử thách: ai khen tiệm hay hơn {name} thì được… tiệm khen lại. #khenquaylai",
      "Biến review này thành bài hát: \"Ly {drink} ơi, sao em ngon thế\". Ai hát thì gắn tên tiệm vô nha.",
      "Tiệm xin phép biến câu khen của {name} thành câu chào khách của cả tuần. #cauchaotuannay",
      "Thử thách 5 giây: uống ngụm {drink} rồi nói một câu khen không trùng {name}. Đố đó.",
      "Hashtag của tuần: #namsaoxinchao. Đăng ly của bạn, tiệm thả tim hết.",
    ],
    down: [
      "Thử thách mới: đoán xem ly {drink} hôm đó {mistake} cỡ nào. Ai đoán đúng được tiệm pha lại trong tưởng tượng. #doanloi",
      "Tiệm phát động #tiemsaitiemsua: mỗi lần tiệm {mistake}, tiệm đăng video tự sửa. Tập một: hôm nay.",
      "Biến review thành phim ngắn: tập 1 \"Ly trà định mệnh\", tập 2 \"Tiệm chuộc lỗi\". Đang quay.",
      "Trend tuần này: kể lần bạn bị pha nhầm món đáng nhớ nhất. Tiệm kể trước: chính là ly của {name}.",
      "Tiệm thách cả hẻm: tìm thêm một ly {drink} nào lỗi nữa, tiệm đứng trước quầy hát một bài. #thachtiem",
      "Thử thách: review tiệm bằng đúng ba chữ. Tiệm mở màn: \"lỗi, sửa, hứa\".",
    ],
  },

  // ===== Sale-man =====
  "sale-thanks": {
    up: [
      "Cảm ơn {name}! Lần sau rủ hội bạn tới, nhóm từ ba người tiệm pha nhanh như chớp.",
      "Dạ cảm ơn {name}. {name} khen vậy chắc bạn bè {name} cũng sẽ thích, rủ cả nhóm ghé nha.",
      "Cảm ơn {name}. Tiệm có chỗ cho cả nhóm, ly cho cả nhóm, và lời cảm ơn cho cả nhóm.",
      "Review này đáng được chia sẻ cho cả lớp, cả phòng, cả xóm. Rủ mọi người ghé tiệm nha {name}.",
      "Cảm ơn {name}! Mang thêm một người bạn ca sau, tiệm pha hai ly đẹp như ảnh.",
      "Tiệm cảm ơn {name}. Đồn xa giùm tiệm nha, mỗi người bạn {name} rủ tới là một nụ cười của tiệm.",
      "Dạ cảm ơn {name}. Nhóm chat nào cũng cần một ly {drink}, {name} gửi giùm tiệm địa chỉ nha.",
      "Cảm ơn {name}, tiệm xin phép mời luôn hội bạn của {name}. Ca sau tiệm chờ cả nhóm.",
    ],
  },
  "sale-sorry": {
    down: [
      "Dạ tiệm xin lỗi {name}. Tiệm ghi lỗi {mistake} vào sổ, và giữ cho {name} một ly giảm giá ca sau.",
      "Tiệm thành thật xin lỗi. Ca sau {name} ghé, ly {drink} tiệm pha lại, giảm 3k, hứa đúng phiếu.",
      "Xin lỗi {name}. Tiệm không chỉ xin lỗi suông, tiệm xin lỗi kèm ưu đãi và một ly đúng vị.",
      "Dạ tiệm sai. Ưu đãi chuộc lỗi đã gửi {name}, ca sau tiệm chứng minh tiệm sửa thật.",
      "Tiệm xin lỗi {name} vì vụ {mistake}. Ghé lại cho tiệm phục vụ lại từ đầu, giá mềm, ly chuẩn.",
      "Tiệm xin lỗi nha {name}. Khách không vui là tiệm lỗ nhất, nên tiệm chịu lỗ thêm 3k cho ly sau của {name}.",
      "Dạ tiệm xin lỗi. Lời hứa có hạn chót: ca sau. Ưu đãi có hạn chót: khi {name} ghé.",
      "Tiệm xin lỗi {name}. Ly bù đã lên lịch, giảm giá đã gắn tên, chỉ còn chờ {name} ghé.",
    ],
  },
  "sale-voucher": {
    up: [
      "Cảm ơn {name}! Tặng {name} mã GHELAI giảm 3k ly kế tiếp. Chốt đơn ca sau nha.",
      "Dạ cảm ơn {name}. Ghé lại tiệm đọc mã NAMSAO, tiệm giảm liền 3k.",
      "Review đẹp quá, tiệm gửi {name} voucher ly sau. Mã có hạn tới khi tiệm còn mở cửa.",
      "Cảm ơn {name} đã tin tiệm. Tiệm tặng mã giảm, nhớ ghé dùng kẻo mã buồn.",
      "{stars} sao xứng đáng nhận voucher. {name} ghé ca sau, tiệm giảm ngay, không cần chụp màn hình.",
      "Tiệm cảm ơn {name} bằng thứ thiết thực nhất: mã giảm giá. Hẹn {name} ca sau.",
    ],
    down: [
      "Dạ tiệm xin lỗi {name}. Tặng {name} mã SUALOI giảm 3k, ghé ca sau tiệm pha lại ly {drink} thật chuẩn.",
      "Lỗi {mistake} tiệm xin nhận và xin đền bằng voucher. {name} ghé lại là dùng được liền.",
      "Tiệm xin lỗi và tặng {name} mã giảm. Ly sau đúng vị, giá lại mềm hơn, hai cái lợi.",
      "Dạ tiệm gửi {name} mã HUASUA. Ghé lại cho tiệm cơ hội chuộc lỗi bằng ly {drink} đúng phiếu.",
      "Tiệm biết {name} chưa vui. Mã giảm 3k đang chờ {name}, còn ly ngon thì chờ ca sau.",
      "Tiệm xin lỗi ạ. Tặng {name} voucher, hạn dùng: ngay khi {name} sẵn sàng tha thứ.",
      "Mã giảm giá này tiệm đặt tên theo {name}. Ghé lại đọc tên mình là được giảm.",
    ],
  },
  "sale-combo": {
    up: [
      "Cảm ơn {name}! Nhân tiện: combo {drink} thêm topping chỉ nhỉnh chút xíu, ca sau tiệm có sẵn nha.",
      "Dạ cảm ơn {name}. {name} thích {drink} thì chắc thích combo hai ly cho hai người, mời rủ bạn.",
      "Review {stars} sao, tiệm mừng bằng combo: mua {drink} kèm trân châu, giá như được tặng.",
      "Cảm ơn {name}. Tiện đây giới thiệu combo cuối tuần: ly lớn, topping đầy, chủ tiệm cười miễn phí.",
      "Ly {drink} được khen thì tiệm ra combo liền: ca sau gọi hai ly, ly thứ hai có thêm thạch.",
      "Cảm ơn {name}! Ai đọc tới đây: {drink} đang là món hot nhất tiệm, ca sau ghé gọi kẻo hết.",
      "{name} khen đúng món tủ. Combo món tủ ca sau đã sẵn, ai tới trước uống trước.",
    ],
    down: [
      "Dạ tiệm xin lỗi {name}. Ca sau tiệm ra combo {drink} pha lại công thức mới, mời {name} thử đầu tiên.",
      "Tiệm xin lỗi vụ {mistake}. Để chuộc lỗi, tiệm ra combo đúng vị, ca sau ai gọi {drink} được thêm topping.",
      "Lỗi hôm đó tiệm sửa rồi. Mời mọi người ghé ca sau thử combo {drink} phiên bản đã sửa.",
      "Dạ xin lỗi {name}. Tiện thông báo: combo hai ly ca sau, cam kết không {mistake}.",
      "Tiệm nhận lỗi. Tiệm tin ly {drink} phiên bản mới sẽ làm {name} đổi ý, giá combo còn mềm hơn.",
      "Tiệm xin lỗi {name}. Ai từng bị {mistake} ở tiệm, ca sau đọc tên review được ưu tiên combo.",
    ],
  },
};

/** Câu đáp lại: reviewer = người viết review, net = cư dân mạng. Biến {name} {shop} {drink}. */
export const COMEBACK = {
  warm: {
    reviewer: [
      "Tiệm dễ thương quá, mình ghé tiếp chắc luôn.",
      "Đọc câu trả lời xong mình muốn tăng thêm một sao mà hết sao để tăng.",
      "Dạ hẹn tiệm, tuần sau mình rủ thêm bạn.",
      "Tiệm trả lời có tâm ghê. Mình lưu tiệm vào danh sách quán ruột.",
      "Cảm ơn tiệm nha, mình mới kể cho mẹ nghe xong.",
      "Ui tiệm trả lời nhanh vậy. Mình ghé lại liền.",
    ],
    net: [
      "Thấy tiệm trả lời khách vậy là muốn ghé thử rồi.",
      "Lâu lắm mới thấy tiệm trả lời review mà đọc thấy ấm lòng.",
      "Lưu tiệm lại, cuối tuần ghé.",
      "Câu trả lời này nên được dạy trong lớp chăm sóc khách hàng.",
    ],
  },
  promise: {
    reviewer: [
      "Được, mình cho tiệm một cơ hội. Ca sau mình ghé kiểm tra nha.",
      "Xin lỗi đàng hoàng vậy thì mình hết giận rồi. Hẹn ca sau.",
      "Mình sẽ quay lại, và mình sẽ nhìn kỹ cái muỗng đường đó.",
      "Ok tiệm, lời hứa đã được ghi nhận. Mình chụp màn hình rồi nha.",
      "Tiệm nói vậy thì mình tin. Lần sau đúng vị là mình sửa review.",
      "Mình hơi gắt hôm đó, tiệm nhận lỗi vậy mình cũng thấy ngại.",
    ],
    net: [
      "Hứa rồi đó nha, cả hẻm làm chứng.",
      "Tiệm biết nhận lỗi là được rồi, nhiều chỗ còn không thèm trả lời.",
      "Hóng ca sau xem tiệm giữ lời không.",
      "Nhận lỗi gọn vậy là mình quý.",
    ],
  },
  viral: {
    reviewer: [
      "Trời ơi câu trả lời của tiệm còn nổi hơn review của mình.",
      "Mình đi đâu cũng có người hỏi: có phải người được tiệm trả lời không.",
      "Ok tiệm thắng. Mình ghé lại để chụp hình với tiệm.",
      "Câu này mình phải in lên áo. Tiệm cho phép không?",
      "Thôi được, mình đổi ý, tiệm cũng dễ thương theo kiểu riêng.",
      "Mình chụp màn hình gửi nhóm chat, giờ cả nhóm muốn tới tiệm.",
    ],
    net: [
      "Câu trả lời này đi vào lịch sử của hẻm.",
      "Mình không uống trà sữa mà cũng muốn ghé vì câu này.",
      "Ai còn chưa đọc câu trả lời của tiệm thì lên đọc liền đi.",
      "Chủ tiệm này nên mở lớp dạy trả lời review.",
      "Lưu lại để học. Một câu mà vừa thật vừa vui.",
      "Đọc xong cười tới mức ly trà của mình đổ ra bàn.",
    ],
  },
  phot: {
    reviewer: [
      "Tiệm nói vậy là sao? Mình chỉ góp ý thôi mà.",
      "Thái độ này thì mình xin phép suy nghĩ lại chuyện quay lại.",
      "Mình chụp màn hình rồi. Để mọi người cùng đánh giá.",
      "Mình góp ý thật lòng, tiệm trả lời như đi tranh luận.",
      "Ủa vậy là lỗi của mình hả tiệm?",
      "Mình sẽ viết thêm một review nữa, dài hơn.",
    ],
    net: [
      "Hóng drama. Ai có bắp rang không.",
      "Tiệm thẳng quá thành ra hơi gắt đó nha.",
      "Cũng có lý, mà nói kiểu đó thì khách buồn.",
      "Đang có người chia sẻ bài này trên nhóm review của quận.",
      "Phe khách hay phe tiệm? Mình đứng giữa uống trà.",
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
      "Tiệm ơi, admin đi ngủ sớm đi.",
      "Không hiểu nhưng vẫn thả tim ủng hộ.",
    ],
  },
  annoyed: {
    reviewer: [
      "Mình viết review chứ không xin mã giảm giá đâu tiệm.",
      "Trả lời mình mà như đọc tờ rơi.",
      "Mình góp ý chuyện ly trà, tiệm trả lời chuyện khác.",
      "Thôi được, mình nhận, nhưng mình vẫn hơi buồn.",
      "Tiệm chăm chốt đơn quá, chăm pha thêm chút nữa nha.",
    ],
    net: [
      "Review nào tiệm cũng chèn quảng cáo hả?",
      "Tưởng tiệm trả lời, hóa ra là banner.",
      "Câu này mình thấy ở tờ rơi đầu hẻm rồi.",
      "Hơi quá tay rồi nha tiệm.",
      "Muốn ủng hộ mà đọc vậy thấy mệt ghê.",
    ],
  },
  sold: {
    reviewer: [
      "Ok tiệm, mã đó mình dùng ca sau liền.",
      "Tiệm giỏi chốt ghê, mình bị thuyết phục rồi.",
      "Combo nghe hợp lý, mình rủ thêm bạn.",
      "Được, mình quay lại. Nhớ giữ mã cho mình.",
      "Mình định thôi rồi, giờ lại muốn ghé vì mã giảm.",
    ],
    net: [
      "Có mã giảm thì mình ghé ké được không tiệm?",
      "Combo này hời thật, cuối tuần rủ bạn đi.",
      "Thấy tiệm chịu chơi, ủng hộ một ly.",
      "Lưu mã lại. Cảm ơn tiệm.",
    ],
  },
  back: {
    reviewer: [
      "Hẹn tiệm ca sau. Mình tới là pha đúng cho mình nha.",
      "Thách thì mình nhận. Ca sau gặp ở quầy.",
      "Mình sẽ ghé, và mình sẽ chấm điểm công bằng.",
      "Ok, cho tiệm một cơ hội. Mình dắt theo một người làm chứng.",
      "Tiệm mời vậy mình ngại từ chối. Ca sau mình ghé.",
    ],
    net: [
      "Cập nhật kết quả giùm nha, hóng ly phục thù.",
      "Kèo này hay, ca sau ai rảnh ra xem.",
      "Hẹn gặp ở quầy, đúng tinh thần thể thao.",
      "Ước gì tiệm nào cũng mời khách quay lại như vậy.",
    ],
  },
};

/** Cư dân mạng để ý chủ tiệm đổi tính (trả lời bằng tính cách khác lần trước). Biến {from} {to}. */
export const FLIP_LINES = [
  "Hôm qua chủ tiệm hiền như cục bột, nay {to} như bị hack nick vậy?",
  "Ủa, admin tiệm đổi ca hả? Mới hôm trước còn {from}, giờ đã {to}.",
  "Tiệm này có hai chủ hay một chủ hai chế độ vậy mọi người?",
  "Mình theo dõi tiệm vì kiểu {from}, giờ ở lại vì kiểu {to}. Bất ngờ ghê.",
  "Chủ tiệm đổi giọng nhanh hơn đổi topping.",
  "Phiên bản {to} của tiệm hôm nay là bản cập nhật hay bản lỗi vậy?",
  "Ai cầm điện thoại của tiệm hôm nay vậy? Khác hẳn hôm trước.",
  "Tiệm giống ly trà đổi vị theo mùa: tuần trước {from}, tuần này {to}.",
];

export const NET_HANDLES = ["Cư dân Hẻm 7", "Team Ít Đá", "Hội Mê Trân Châu", "Bé Su Mê Trà", "Chú Ba Đọc Review", "Người Qua Đường",
  "Anh Shipper Đọc Lén", "Hội Nghiện Matcha", "Phe Không Đường", "Chị Gánh Hàng Đầu Hẻm", "Bạn Cùng Phòng Của Ai Đó", "Khách Quen Giấu Tên"];

/** Review của cư dân mạng sinh ra từ câu trả lời (đổi điểm đánh giá). */
export const NET_REVIEW = {
  2: [
    "Đọc câu trả lời của tiệm với khách xong mình hơi ngại ghé. Thẳng thì tốt, mà nhẹ nhàng chút nữa thì hơn. #thaido",
    "Chưa uống nhưng đọc câu trả lời thấy căng. Tạm hai sao cho cách nói chuyện. #photnho",
    "Tiệm trả lời khách như đang tranh luận trên truyền hình. Ly trà chắc ngon, nhưng mình né. #hongdrama",
    "Một sao cho ly, một sao cho dũng khí. Tổng hai sao. #cuongqua",
    "Khách góp ý mà tiệm đáp như phản biện luận văn. Hai sao, mong tiệm bình tĩnh hơn. #binhtinh",
    "Mình theo dõi vụ trả lời review. Ly ngon không cứu nổi câu chữ. Hai sao. #tiemcang",
  ],
  5: [
    "Ghé vì đọc câu trả lời của tiệm trên mạng. Ly ngon, chủ tiệm y như trên mạng. Năm sao. #ghevicaurep",
    "Tiệm trả lời review hay tới mức mình chạy xe qua hai quận để uống thử. Đáng. #trendhem",
    "Câu trả lời đưa mình tới, ly trà giữ mình lại. #namsao",
    "Đọc câu trả lời xong ghé liền, chủ tiệm nói chuyện vui, ly ngon thật. #tiemvui",
    "Đến vì meme, ở lại vì trân châu. Năm sao. #denvimeme",
    "Không ngờ một câu trả lời review làm mình có quán ruột mới. #quanruot",
  ],
};

/** Khách quay lại nhờ câu trả lời (câu gọi món, theo tính cách lúc trả lời). */
export const RETURN_LINES = {
  hien: [
    "{Call} ơi, {self} quay lại nè. {Call} trả lời dễ thương quá nên {self} ghé: {drink}, {sugar} đường, {ice} nha.",
    "{Self} đọc câu trả lời của tiệm xong là muốn ghé liền. Cho {self} {drink}, {sugar} đường, {ice}.",
    "Lần này {self} tới để xem tiệm giữ lời không nè. {Drink}, {sugar} đường, {ice} nha {call}.",
    "{Call} còn nhớ {self} không? Người viết review hôm trước đó. Một {drink}, {sugar} đường, {ice}.",
    "{Self} quay lại theo lời mời nè {call}. {Drink}, {sugar} đường, {ice}, pha từ từ cũng được.",
  ],
  cucsuc: [
    "{Call} thách {self} ghé thì {self} ghé. {Drink}, {sugar} đường, {ice}. Pha đi, {self} chấm.",
    "Người được trả lời cộc hôm trước đây. Cho {self} {drink}, {sugar} đường, {ice}. Xem ai đúng.",
    "{Self} tới phục thù nè {call}. {Drink}, {sugar} đường, {ice}. Không được sai ly nào.",
    "{Call} nói ghé là biết. {Self} ghé rồi đó: {drink}, {sugar} đường, {ice}.",
    "{Self} đọc câu trả lời mà vừa tức vừa buồn cười. Giờ cho {self} {drink}, {sugar} đường, {ice}.",
  ],
  lay: [
    "{Call} ơi {self} là nhân vật chính trong meme hôm trước nè. {Drink}, {sugar} đường, {ice} nha.",
    "{Self} ghé để quay video đáp lại meme của tiệm. Một {drink}, {sugar} đường, {ice}.",
    "Fan trang meme của tiệm đây. Cho {self} {drink}, {sugar} đường, {ice}, pha cho lên hình đẹp.",
    "{Self} tới xem chủ tiệm ngoài đời có lầy như trên mạng không. {Drink}, {sugar} đường, {ice}.",
    "Meme hôm trước làm {self} cười cả buổi. Đền bằng một ly {drink}, {sugar} đường, {ice} nha.",
  ],
  sale: [
    "{Call} ơi {self} có mã giảm nè. Cho {self} {drink}, {sugar} đường, {ice}, nhớ trừ mã nha.",
    "{Self} tới dùng voucher. Một {drink}, {sugar} đường, {ice}. Mã còn hạn chứ {call}?",
    "Tiệm chốt đơn giỏi quá nên {self} ghé. {Drink}, {sugar} đường, {ice} nha {call}.",
    "Combo {call} quảng cáo hôm trước đó, {self} thử ly {drink} trước, {sugar} đường, {ice}.",
    "{Self} quay lại vì cái mã giảm có tên mình. {Drink}, {sugar} đường, {ice} nha.",
  ],
};

/** Câu kèm theo sau mỗi lựa chọn trong sự kiện drama, theo tính cách chủ tiệm (hiện ở bảng hậu quả). */
export const PERSONA_ASIDE = {
  hien: [
    "Chủ tiệm khẽ cúi đầu cảm ơn, dù người ta chưa kịp nói gì.",
    "Bạn nói nhỏ nhẹ tới mức cả hẻm phải nghiêng tai.",
    "Chủ tiệm hiền thêm một nấc, cái máy trà cũng chạy êm hơn.",
    "Bạn mỉm cười, kiểu nụ cười khiến người ta ngại cãi tiếp.",
    "Bạn rót thêm ly nước lọc mời, theo thói quen của người hiền.",
    "Bạn ghi chuyện này vào sổ bằng nét chữ tròn trịa, có vẽ thêm trái tim nhỏ.",
    "Bạn xin lỗi luôn cả cái ghế vì lỡ va vào nó.",
    "Chủ tiệm gật đầu lia lịa, dạ vâng đã thành phản xạ.",
  ],
  cucsuc: [
    "Bạn lẩm bẩm: \"Xong. Việc tiếp.\" Rồi đi lau quầy mạnh tay.",
    "Chủ tiệm khoanh tay, gật một cái. Với chủ tiệm, vậy là rất cảm động rồi.",
    "Bạn nói thẳng tới mức cái quạt trần cũng ngừng quay một nhịp.",
    "Bạn càu nhàu ba câu, rồi lén pha thêm một ly mời.",
    "Chủ tiệm nhún vai: \"Nói thật thì mất lòng trước, được lòng sau. Sau bao lâu thì chưa biết.\"",
    "Bạn đặt cái ly xuống quầy hơi mạnh. Ý là: vụ này giải quyết xong.",
    "Bạn thở dài kiểu người thẳng tính mà phải nói giảm nói tránh.",
    "Chủ tiệm cộc một câu, cười một cái. Khách quen đã quen.",
  ],
  lay: [
    "Bạn quay mặt về phía một cái máy quay tưởng tượng và nháy mắt.",
    "Chủ tiệm đã nghĩ xong caption cho chuyện này trước khi nó kịp kết thúc.",
    "Bạn ghi chú: \"Chuyện này làm meme được.\"",
    "Bạn ngâm nga nhạc nền phim truyền hình, rất đúng lúc.",
    "Chủ tiệm tạo dáng với cái muỗng như cầm micro nhận giải.",
    "Bạn gửi ngay vào nhóm chat của tiệm kèm ba dấu chấm than.",
    "Bạn tự đặt tên cho chuyện này: \"Tập 47: Tiệm và những người bạn\".",
    "Chủ tiệm cười trước, nghĩ sau, rồi lại cười tiếp.",
  ],
  sale: [
    "Bạn lẩm bẩm: \"Chuyện này mà làm khuyến mãi thì hay.\"",
    "Chủ tiệm đã kịp nhét một tờ rơi vào túi người ta.",
    "Bạn tính nhẩm: một rắc rối bằng bao nhiêu ly bán thêm.",
    "Bạn nói \"dạ\" xong nói luôn \"mà tiệm đang có combo\".",
    "Chủ tiệm ghi chú: biến chuyện hôm nay thành chương trình tuần sau.",
    "Bạn mỉm cười kiểu người vừa nghĩ ra mã giảm giá mới.",
    "Chủ tiệm đưa danh thiếp, dù tiệm chưa từng in danh thiếp.",
    "Bạn chốt hạ: \"Vậy hẹn ca sau, đi ba người vui gấp ba.\"",
  ],
};

/** Câu chốt ca Nhật Ký theo tính cách (thay câu thường ở ca bình thường) và theo câu trả lời nổi bật nhất ngày. */
export const CAPTIONS_PERSONA = {
  hien: [
    "Bán {cups} ly, nói \"dạ\" nhiều hơn số ly. Chủ tiệm hiền nhất hẻm vẫn giữ phong độ.",
    "{cups} ly, {stars} sao, và một chủ tiệm cảm ơn tới cả cái nắp ly.",
    "Ca này êm như giọng chủ tiệm. Bán {cups} ly, lời {profit}k.",
    "Hiền thì không giàu nhanh, nhưng khách nhớ lâu. {cups} ly hôm nay.",
  ],
  cucsuc: [
    "Bán {cups} ly. Nói ít, pha nhiều, khách vẫn quay lại.",
    "{cups} ly, {stars} sao. Chủ tiệm không cười trên mạng, chỉ cười trong kho.",
    "Hôm nay {cups} ly ra quầy. Câu cửa miệng: \"Uống đi rồi nói.\"",
    "Thẳng như ruột ngựa, ngọt như trà đào: {cups} ly, lời {profit}k.",
  ],
  lay: [
    "Bán {cups} ly và nghĩ ra ba meme. Một ngày năng suất của chủ tiệm lầy.",
    "{cups} ly, {stars} sao, và một caption chưa ai hiểu.",
    "Hôm nay tiệm không viral, nhưng tiệm vui. {cups} ly. #tiemlay",
    "Góc nhìn của nồi trân châu: {cups} ly bán ra và một chủ tiệm hát suốt ca.",
  ],
  sale: [
    "Bán {cups} ly, phát ba lời mời quay lại. Chủ tiệm chốt đơn cả trong giấc mơ.",
    "{cups} ly, lời {profit}k. Câu hôm nay: \"Mua hai ly vui gấp đôi.\"",
    "Chốt ca: {cups} ly, {stars} sao, và một kế hoạch khuyến mãi cho ngày mai.",
    "Ai ghé cũng nghe một câu combo. {cups} ly hôm nay, mai bán gấp đôi.",
  ],
};
export const CAPTIONS_REPLY = {
  viral: [
    "Câu trả lời review của tiệm hôm nay nổi hơn cả ly trà. +{followers} người theo dõi.",
    "Bán {cups} ly, nhưng thứ lên mạng là một câu trả lời review. Đời là vậy.",
    "Một câu trả lời, nửa cái hẻm chụp màn hình. {cups} ly và một khoảnh khắc nổi tiếng.",
    "Hôm nay tiệm nổi nhờ một câu trả lời. Mẹ hỏi: con pha trà hay viết văn?",
    "{cups} ly, {stars} sao, và một câu trả lời được in lên áo (trong tưởng tượng).",
    "Tiệm học được: một câu trả lời đúng lúc bằng mười tờ rơi.",
  ],
  phot: [
    "Bán {cups} ly và một câu trả lời hơi thẳng. Cả hẻm đang hóng phần tiếp theo.",
    "Hôm nay tiệm dính phốt nhỏ vì nói thật. Ly trà vẫn ngon, câu chữ thì cần pha lại.",
    "{cups} ly bán ra, một câu trả lời bay đi không thu lại được. Bài học về độ ngọt của lời nói.",
    "Ca này có một câu trả lời nóng hơn nồi trân châu. Tiệm đang làm nguội.",
    "Tiệm lên nhóm review của quận, nhưng không phải vì ly ngon. Hẹn chương sau.",
    "Bán {cups} ly, cãi một câu, hot cả hẻm. Không khuyến khích, nhưng nhớ đời.",
  ],
  flip: [
    "Hôm nay chủ tiệm đổi tính {flips} lần. Khách hỏi: \"Hôm nay là phiên bản nào vậy?\"",
    "Sáng hiền, trưa cục, chiều lầy, tối chốt đơn. {flips} lần đổi tính trong một ngày.",
    "Bán {cups} ly với {flips} phiên bản chủ tiệm. Cái máy trà vẫn là máy trà.",
    "Cư dân mạng nghi tiệm có nhiều admin. Sự thật: một người, {flips} tâm trạng.",
  ],
};

/** Bản cũ (v2) chỉ lưu loại trả lời: hiện lại đúng câu cũ. */
export const LEGACY_REPLY = {
  sorry: "Tiệm xin lỗi nha, ca sau tụi mình đo lại từng muỗng. Hứa bằng cả cái nắp kêu cạch.",
  thanks: "Cảm ơn bạn! Ly sau tiệm vẫn làm bằng cả trái tim với cái cân.",
  meme: "Tiệm đọc review xong ngồi im lặng 3 giây, rồi đi nấu trân châu tiếp.",
};
