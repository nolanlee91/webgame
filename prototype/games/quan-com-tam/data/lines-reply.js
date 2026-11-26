// Trả lời review theo tính cách cô chủ quán (core/reviews.js). Chép khung data/lines-reply.js của Tiệm Bánh Mì, viết lại cho cơm tấm.
// Câu trả lời từng lựa chọn ở data/lines-reply-a.js (Hiền lành, Cục súc) và data/lines-reply-b.js (Lầy lội, Sale-man).
// Cục súc thẳng và cộc, KHÔNG chê ngoại hình, giới tính, vùng miền hay ai cả: chỉ châm chọc tình huống và chính quán.
// Không emoji, không thương hiệu thật, không người thật. Hashtag được.
//
// Biến trong câu trả lời / câu đáp lại: {name} người viết review, {dish} tên món (chữ thường), {mistake} lỗi (MISTAKE_TEXT), {shop} tên quán, {stars} số sao.
// Biến trong câu cư dân mạng "đổi tính" (FLIP_LINES): {from} {to} (tên ngắn tính cách cũ / mới, chữ thường).
// Biến trong câu khách quay lại (RETURN_LINES): {call} {Call} {self}.
// Biến trong câu chốt ngày (CAPTIONS_*): {plates} {stars} {followers} {flips}.
//
// REPLY_LINES[option] = { [lý do review]?, [chủ đề], [nhóm] }: chọn [...câu riêng theo lý do, ...câu theo chủ đề, ...câu chung theo nhóm].
//   Chủ đề: praise | takeaway (nhóm up) · mistake | slow | meh | net (nhóm down) · serious (nhóm serious: chỉ câu serious).
import { REPLY_LINES_A } from "./lines-reply-a.js?v=c9";
import { REPLY_LINES_B } from "./lines-reply-b.js?v=c9";

export const PERSONAS = {
  hien: { name: "Hiền lành, lễ phép", short: "Hiền lành", desc: "Dạ vâng, cảm ơn, xin lỗi đủ cả. Trả lời an toàn: tăng ít mà chắc, hiếm khi có chuyện." },
  cucsuc: { name: "Cục súc, thẳng như ruột ngựa", short: "Cục súc", desc: "Nói ít, nói thẳng, không vòng vo (mà không bao giờ chê người). Đánh cược: có khi lên mạng, có khi dính phốt." },
  lay: { name: "Lầy lội, meme lord", short: "Lầy lội", desc: "Câu nào cũng thành meme. Độ hot lên xuống thất thường, đôi khi thành trend." },
  sale: { name: "Sale-man chốt đơn", short: "Sale-man", desc: "Review nào cũng thành khuyến mãi. Ra khách quay lại, nhưng có người thấy phiền." },
};
export const PERSONA_IDS = Object.keys(PERSONAS);

/** Lỗi theo lý do review (biến {mistake}). Viết để đọc trơn sau "vụ", "lỗi", "vì". */
export const MISTAKE_TEXT = {
  wrongDish: "đưa nhầm món", biAnyway: "dặn không bì mà vẫn có bì", hardEgg: "trứng lòng đào thành chín kỹ", burnt: "sườn cháy khét",
  raw: "sườn chưa chín", noMoHanh: "quên mỡ hành", sauceMixed: "chan nước mắm khi dặn để riêng", noTea: "quên châm trà đá",
  dirtyTable: "để khách ngồi bàn dơ", wrongTable: "bưng nhầm bàn", swapped: "tráo dĩa trong bàn", wrongBill: "tính tiền sai",
  veganMeat: "để dĩa chay dính đồ mặn", slow: "để khách chờ lâu", soldOut: "hết món giữa chừng", meh: "chưa tròn vị", net: "chuyện trên mạng",
  phot: "câu trả lời hơi gắt", ok: "chưa tròn vị",
};

/** Kết quả một câu trả lời (hiện ngay dưới review). */
export const OUTCOME_LABEL = {
  warm: "Khách vui", promise: "Đã hứa sửa", viral: "Lên mạng", phot: "Dính phốt", flop: "Meme xịt", annoyed: "Có người thấy phiền", sold: "Chốt đơn",
  back: "Khách sẽ quay lại", serious: "Xin lỗi nghiêm túc",
};

/** Lựa chọn trả lời theo tính cách. on: up | down | praise | takeaway | mistake | slow | meh | net | serious | all (all = up + down, không gồm serious).
 *  out: { kind, fx } hoặc roll { p, win, lose }. fx: followers hype rep netReview(sao review cư dân mạng) guests(ca sau) back(khách quay lại) flag.
 *  cost = tiền trả ngay (k). promise = xin lỗi tạo lời hứa (chỉ khi review có lỗi thật, ≤ 3 sao). */
export const REPLY_OPTIONS = {
  hien: [
    { id: "hien-thanks", on: ["up"], label: "Cảm ơn thật lòng", hint: "+5 người theo dõi. Hên thì khách ghé lại ca sau",
      out: { roll: { p: 0.35, win: { kind: "back", fx: { followers: 5, back: true } }, lose: { kind: "warm", fx: { followers: 5 } } } } },
    { id: "hien-sorry", on: ["down"], promise: true, label: "Xin lỗi, hứa sửa", hint: "+3 người theo dõi, an toàn",
      out: { kind: "promise", fx: { followers: 3, rep: 1 } } },
    { id: "hien-explain", on: ["meh", "net", "slow"], label: "Giải thích nhẹ nhàng", hint: "Khách hiểu thì danh tiếng +1",
      out: { roll: { p: 0.75, win: { kind: "warm", fx: { rep: 1, followers: 3 } }, lose: { kind: "flop", fx: { followers: 1 } } } } },
    { id: "hien-invite", on: ["all"], cost: 10, label: "Mời ghé lại, dĩa sau quán mời", hint: "Tiền dĩa mời. Khách quay lại ca sau, +2 người theo dõi",
      out: { kind: "back", fx: { back: true, followers: 2 } } },
    { id: "hien-meme", on: ["all"], label: "Meme dễ thương", hint: "Hên xui nhẹ: +8 người theo dõi, quán hot nhẹ",
      out: { roll: { p: 0.65, win: { kind: "warm", fx: { followers: 8, hype: 0.4 } }, lose: { kind: "flop", fx: { followers: 2 } } } } },
    { id: "hien-serious", on: ["serious"], promise: true, label: "Xin lỗi nghiêm túc, hứa sửa", hint: "An toàn. Danh tiếng +1, hứa ca sau ≥ 4 sao",
      out: { kind: "serious", fx: { rep: 1, followers: 2 } } },
    { id: "hien-refund", on: ["serious"], cost: 15, label: "Xin lỗi, hoàn tiền + mời bữa khác", hint: "Tốn tiền dĩa. Khách quay lại ca sau, danh tiếng +2",
      out: { kind: "serious", fx: { rep: 2, back: true } } },
  ],
  cucsuc: [
    { id: "cuc-thanks", on: ["up"], label: "Cảm ơn kiểu cộc lốc", hint: "Hên xui: dân mạng mê sự cộc (+18) hoặc thấy kỳ kỳ",
      out: { roll: { p: 0.55, win: { kind: "viral", fx: { followers: 18, hype: 0.8 } }, lose: { kind: "flop", fx: { followers: 2 } } } } },
    { id: "cuc-brag", on: ["up"], label: "Khoe ngược: Biết mà", hint: "Hên xui: +14 người theo dõi, có khi bị chê tự tin quá",
      out: { roll: { p: 0.6, win: { kind: "viral", fx: { followers: 14, hype: 0.6 } }, lose: { kind: "annoyed", fx: { followers: -2, hype: 0.4 } } } } },
    { id: "cuc-sorry", on: ["mistake", "slow"], promise: true, label: "Nhận lỗi một câu, không vòng vo", hint: "+6 người theo dõi (dân mạng thích sự gọn)",
      out: { kind: "promise", fx: { followers: 6 } } },
    { id: "cuc-truth", on: ["down"], label: "Nói thẳng, cãi tay đôi", hint: "Đánh cược: lên mạng (+30, đánh giá lên) hoặc dính phốt (hot lên, danh tiếng −2)",
      out: { roll: { p: 0.45,
        win: { kind: "viral", fx: { followers: 30, hype: 1, rep: 1, netReview: 5 } },
        lose: { kind: "phot", fx: { followers: 6, hype: 1.5, rep: -2, netReview: 2 } } } } },
    { id: "cuc-dare", on: ["down"], label: "Thách ghé lại ăn thử", hint: "Khách quay lại ca sau để phục thù, +4 người theo dõi",
      out: { kind: "back", fx: { back: true, followers: 4 } } },
    { id: "cuc-meme", on: ["all"], label: "Meme cà khịa nhẹ", hint: "50/50: lên mạng (+16) hoặc bị chê vô duyên (−4)",
      out: { roll: { p: 0.5, win: { kind: "viral", fx: { followers: 16, hype: 1 } }, lose: { kind: "annoyed", fx: { followers: -4, hype: 0.5 } } } } },
    { id: "cuc-serious", on: ["serious"], promise: true, label: "Nhận lỗi thẳng, không bào chữa", hint: "An toàn. Danh tiếng +1, hứa ca sau ≥ 4 sao",
      out: { kind: "serious", fx: { rep: 1, followers: 3 } } },
    { id: "cuc-refund", on: ["serious"], cost: 15, label: "Hoàn tiền, mời bữa khác", hint: "Tốn tiền dĩa. Khách quay lại ca sau, danh tiếng +2",
      out: { kind: "serious", fx: { rep: 2, back: true } } },
  ],
  lay: [
    { id: "lay-thanks", on: ["up"], label: "Cảm ơn bằng caption dài như sớ", hint: "+7 người theo dõi, quán hot nhẹ",
      out: { kind: "warm", fx: { followers: 7, hype: 0.3 } } },
    { id: "lay-sorry", on: ["down"], promise: true, label: "Xin lỗi bằng thơ lục bát", hint: "+8 người theo dõi, quán hot nhẹ",
      out: { kind: "promise", fx: { followers: 8, hype: 0.3 } } },
    { id: "lay-meme", on: ["all"], label: "Đăng meme", hint: "Độ hot lên xuống: lên mạng (+22) hoặc meme xịt (+2)",
      out: { roll: { p: 0.55, win: { kind: "viral", fx: { followers: 22, hype: 1.5 } }, lose: { kind: "flop", fx: { followers: 2, hype: -0.5 } } } } },
    { id: "lay-trend", on: ["all"], label: "Biến review thành trend", hint: "Đánh cược lớn: trend nổ (+40) hoặc không ai theo (độ hot giảm)",
      out: { roll: { p: 0.4, win: { kind: "viral", fx: { followers: 40, hype: 2 } }, lose: { kind: "flop", fx: { followers: 3, hype: -1 } } } } },
    { id: "lay-serious", on: ["serious"], promise: true, label: "Cất meme, xin lỗi nghiêm túc", hint: "An toàn. Danh tiếng +1, hứa ca sau ≥ 4 sao",
      out: { kind: "serious", fx: { rep: 1, followers: 2 } } },
    { id: "lay-refund", on: ["serious"], cost: 15, label: "Hoàn tiền, mời bữa khác", hint: "Tốn tiền dĩa. Khách quay lại ca sau, danh tiếng +2",
      out: { kind: "serious", fx: { rep: 2, back: true } } },
  ],
  sale: [
    { id: "sale-thanks", on: ["up"], label: "Cảm ơn, rủ khách mang cả phòng tới", hint: "Ca sau +2 khách. Có người thấy hơi lộ",
      out: { roll: { p: 0.8, win: { kind: "sold", fx: { guests: 2, followers: 3 } }, lose: { kind: "annoyed", fx: { guests: 1, followers: -2 } } } } },
    { id: "sale-sorry", on: ["down"], promise: true, cost: 5, label: "Xin lỗi kèm mã giảm", hint: "Mã giảm 5k. Khách quay lại ca sau, +3 người theo dõi",
      out: { kind: "promise", fx: { back: true, followers: 3 } } },
    { id: "sale-voucher", on: ["all"], cost: 5, label: "Tặng mã giảm, mời quay lại", hint: "Khách quay lại ca sau. 1/4 thấy quảng cáo lộ",
      out: { roll: { p: 0.75, win: { kind: "sold", fx: { back: true, followers: 3 } }, lose: { kind: "annoyed", fx: { back: true, followers: -3 } } } } },
    { id: "sale-combo", on: ["all"], label: "Chèn quảng cáo combo", hint: "Ca sau +1 khách. 1/3 bị chê lộ liễu (danh tiếng −1)",
      out: { roll: { p: 0.65, win: { kind: "sold", fx: { guests: 1, followers: 1 } }, lose: { kind: "annoyed", fx: { guests: 1, rep: -1 } } } } },
    { id: "sale-serious", on: ["serious"], promise: true, label: "Gác khuyến mãi, xin lỗi nghiêm túc", hint: "An toàn. Danh tiếng +1, hứa ca sau ≥ 4 sao",
      out: { kind: "serious", fx: { rep: 1, followers: 2 } } },
    { id: "sale-refund", on: ["serious"], cost: 15, label: "Hoàn tiền, mời bữa khác", hint: "Tốn tiền dĩa. Khách quay lại ca sau, danh tiếng +2",
      out: { kind: "serious", fx: { rep: 2, back: true } } },
  ],
};

export const REPLY_LINES = { ...REPLY_LINES_A, ...REPLY_LINES_B };

/** Câu đáp lại sau khi quán trả lời: người viết review (reviewer) và cư dân mạng (net), theo kết quả. */
export const COMEBACK = {
  warm: {
    reviewer: [
      "Đọc trả lời của quán mà thấy ấm như dĩa cơm mới xới. Hẹn tối mai nha.",
      "Quán dễ thương vậy thì {name} ghé hoài luôn chứ sao.",
      "Cảm ơn quán đã đọc kỹ. Tuần này {name} dẫn thêm đứa bạn tới.",
      "Trả lời có tâm ghê. Dĩa {dish} lần sau chắc ngon gấp đôi.",
      "Thôi được, quán trả lời vầy thì {name} hết giận rồi đó.",
      "Lưu lại câu trả lời này, mai đưa cô chủ coi rồi gọi như cũ.",
    ],
    net: [
      "Quán trả lời lễ phép quá, tối nay phải ghé thử dĩa sườn.",
      "Đọc phần trả lời mà muốn ra vỉa hè ngồi liền.",
      "Quán nhỏ mà cách nói chuyện lớn. Ủng hộ.",
      "Mấy quán khác học theo cách trả lời này đi nha.",
      "Lần đầu thấy chủ quán đọc review kỹ vậy.",
      "Ghi chú: quán này có cô chủ dễ thương và sườn thơm.",
    ],
  },
  promise: {
    reviewer: [
      "Quán hứa rồi đó nha, ca sau {name} ghé kiểm tra.",
      "Ok, cho quán một cơ hội. Lần tới mà đúng là {name} sửa lại thành 5 sao.",
      "Nhận lời xin lỗi. {name} sẽ quay lại coi quán sửa thật không.",
      "Được, quán biết lỗi là tốt rồi. Hẹn dĩa {dish} chuẩn chỉnh lần sau.",
      "Nói được thì làm được nha cô chủ. {name} chờ đó.",
      "Thôi, ai cũng có tối bận. Lần sau làm kỹ là được.",
    ],
    net: [
      "Biết nhận lỗi vậy là quán có tâm rồi.",
      "Hóng ca sau quán giữ lời không.",
      "Xin lỗi gọn gàng, không đổ thừa. Điểm cộng.",
      "Quán chịu sửa thì khách chịu quay lại thôi.",
      "Câu xin lỗi này đọc thấy thật, không phải văn mẫu.",
      "Đã lưu, tuần sau quay lại hỏi thăm quán sửa tới đâu.",
    ],
  },
  viral: {
    reviewer: [
      "Ủa sao câu trả lời của quán nhiều tim hơn review của {name} vậy?",
      "Thôi xong, {name} thành nhân vật phụ trong câu chuyện của quán rồi.",
      "Cô chủ trả lời hay quá, {name} chụp màn hình gửi cả nhóm rồi.",
      "Phục. Lần sau {name} viết review dài hơn cho quán có cái mà trả lời.",
      "Câu này phải in ra dán lên vỉ nướng mới đúng.",
      "Được rồi, {name} thua. Tối mai ghé ăn tiếp.",
    ],
    net: [
      "Ai cho chủ quán cơm tấm trả lời hay vậy trời.",
      "Đọc xong muốn đi ăn cơm tấm lúc nửa đêm.",
      "Câu trả lời này đáng được đóng khung.",
      "Tag đứa bạn hay than đói khuya vô coi nè.",
      "Quán này admin là chủ hay là nhà văn vậy?",
      "Cơm tấm ngon cỡ nào mà chủ quán tự tin vậy, phải tới thử mới được.",
      "Mới đọc mà đã nghe mùi sườn nướng than.",
    ],
  },
  phot: {
    reviewer: [
      "Ủa quán nói vậy là sao? {name} góp ý thôi mà.",
      "Trả lời gắt vậy chắc quán cũng mệt. Nhưng {name} vẫn buồn.",
      "Thôi được, {name} không tranh cãi nữa, để mọi người tự đánh giá.",
      "Quán nói đúng một nửa. Nửa còn lại {name} giữ ý kiến.",
      "Đọc câu trả lời xong {name} hơi sốc, mà cũng hơi muốn ghé coi thử.",
      "Lần đầu bị chủ quán cơm tấm cãi lại. Kỷ niệm khó quên.",
    ],
    net: [
      "Hóng phần hai. Ai có bắp rang không?",
      "Thẳng thì thẳng, mà nói nhẹ chút cũng được mà quán ơi.",
      "Quán gắt nhưng mà sườn nghe nói ngon thật. Khó xử ghê.",
      "Hai bên bình tĩnh, ăn dĩa cơm rồi nói chuyện tiếp.",
      "Chủ quán này cá tính quá, không biết nên sợ hay nên thương.",
      "Đang có drama ở quán cơm tấm vỉa hè, mọi người vô coi.",
      "Thôi mai ra quán coi tận mắt cho biết ai đúng.",
    ],
  },
  flop: {
    reviewer: [
      "Ờ… {name} đọc ba lần vẫn chưa hiểu câu đùa của quán.",
      "Quán dễ thương mà meme hơi xa. Thôi cũng được.",
      "Haha, chắc phải ăn thêm một dĩa mới hiểu được câu này.",
      "Câu trả lời này {name} để dành mai đọc lại.",
      "Cảm ơn quán đã trả lời. Còn câu đùa thì {name} xin kiếu.",
      "Ok quán. Đùa vậy {name} cười nửa miệng thôi nha.",
    ],
    net: [
      "Quán cố gắng rồi, tặng một tim cho sự cố gắng.",
      "Meme này chắc dành cho người trong quán thôi.",
      "Đọc xong im lặng ba giây, rồi kéo xuống coi tiếp.",
      "Câu đùa này nguội nhanh hơn trà đá.",
      "Quán nướng sườn giỏi hơn làm meme, nói thiệt.",
      "Không hiểu lắm nhưng vẫn muốn ăn cơm tấm.",
    ],
  },
  annoyed: {
    reviewer: [
      "{name} chỉ viết review thôi mà sao quán quảng cáo dữ vậy.",
      "Ủa trả lời review hay đọc tờ rơi vậy cô chủ?",
      "Quán khoe hơi nhiều. {name} thích nghe xin lỗi hơn.",
      "Hơi quá rồi đó quán ơi, bớt bớt lại chút.",
      "Cảm ơn quán, nhưng {name} không cần mã giảm, cần dĩa đúng thôi.",
      "Câu trả lời làm {name} thấy hơi bị chào hàng.",
    ],
    net: [
      "Review nào quán cũng chèn combo, mệt ghê.",
      "Trả lời kiểu này mất điểm quá quán ơi.",
      "Tự tin là tốt, mà tự tin quá thì hơi khó nghe.",
      "Có ai thấy câu trả lời này hơi lố không?",
      "Bớt quảng cáo đi quán, sườn ngon tự khắc có khách.",
      "Quán đang nói chuyện với khách hay đang chạy chương trình?",
    ],
  },
  sold: {
    reviewer: [
      "Ok chốt, tối thứ Sáu {name} dẫn cả phòng tới.",
      "Mã giảm này {name} lưu rồi nha, đừng có nói hết hạn đó.",
      "Combo nghe được đó, lần sau {name} gọi thử.",
      "Quán chốt đơn nhanh hơn {name} gọi món luôn.",
      "Được, {name} ghé lại. Nhớ để dành bàn gần bếp.",
      "Chịu quán thật, đọc xong muốn đặt mâm cơm cho cả xưởng.",
    ],
    net: [
      "Có mã giảm hả, cho xin với quán ơi.",
      "Quán này buôn bán giỏi ghê, ủng hộ.",
      "Đọc xong muốn rủ cả nhóm đi ăn cơm tấm.",
      "Combo cơm sườn trà tắc nghe hợp lý đó.",
      "Mai đi ngang quán ghé thử coi có giảm thật không.",
      "Quán chịu chơi vậy thì phải ra ủng hộ.",
    ],
  },
  back: {
    reviewer: [
      "Được, ca sau {name} ghé. Quán chuẩn bị tinh thần nha.",
      "Lời mời này {name} nhận. Hẹn gặp bên bếp than.",
      "Thách thì {name} tới, coi dĩa {dish} lần này ra sao.",
      "Ok, cho quán gỡ điểm. {name} tới sớm cho đỡ đông.",
      "Ghé lại thì ghé, nhưng phải cho {name} ngồi chỗ thấy vỉ nướng.",
      "Hẹn tối mai. Lần này {name} dặn kỹ hơn.",
    ],
    net: [
      "Hóng tập sau: khách quay lại chấm lại.",
      "Quán tự tin mời khách quay lại, chắc ngon thật.",
      "Ai đi chung với bạn đó thì kể lại nha.",
      "Mời ghé lại kiểu này là có thành ý.",
      "Lần sau review lại nha, cả xóm đang chờ.",
      "Hay đó, cho nhau thêm một cơ hội.",
    ],
  },
  serious: {
    reviewer: [
      "Cảm ơn quán đã xin lỗi đàng hoàng. {name} mong lần sau cẩn thận hơn.",
      "{name} ghi nhận lời xin lỗi. Chuyện này thật sự quan trọng với {name}.",
      "Quán nhận lỗi rõ ràng như vầy, {name} sẽ cân nhắc quay lại.",
      "Cảm ơn quán đã không đùa chuyện này. Mong quán giữ lời.",
      "{name} đọc rồi. Mong quán tách riêng đồ cho khách như {name}.",
      "Lời xin lỗi thật lòng. {name} cho quán thêm một cơ hội.",
    ],
    net: [
      "Quán xử lý đúng mực, xin lỗi nghiêm túc là được.",
      "Chuyện an toàn đồ ăn mà quán nhận lỗi nhanh vậy là tốt.",
      "Mong quán giữ lời, khách ăn chay rất cần những quán cẩn thận.",
      "Câu xin lỗi này không đùa, đọc thấy yên tâm hơn.",
      "Lỗi thì ai cũng có, quan trọng là sửa. Ủng hộ quán sửa.",
      "Cách quán trả lời làm mình tin là lần sau sẽ khác.",
    ],
  },
};

/** Cư dân mạng bình luận khi cô chủ đổi tính cách giữa hai lần trả lời. */
export const FLIP_LINES = [
  "Hôm qua quán còn {from}, hôm nay đã {to}. Admin mới hả?",
  "Ủa quán đổi giọng từ {from} sang {to} nhanh hơn lật sườn.",
  "Cùng một quán mà sáng {from}, tối {to}. Nhân cách thứ mấy rồi?",
  "Quán ơi, rốt cuộc quán là {from} hay {to}, cho xin một câu trả lời.",
  "Tưởng quán {from}, ai ngờ quán {to}. Cơm tấm mà nhiều vị quá.",
  "Ai đang cầm điện thoại của quán vậy? Câu trước {from}, câu này {to}.",
  "Từ {from} qua {to} trong một buổi tối. Chắc than nóng quá.",
  "Mọi người ơi quán đổi tính rồi, từ {from} thành {to}. Hóng tiếp.",
  "Quán có hai admin, một người {from}, một người {to}, đúng không?",
  "Đọc trả lời của quán như coi phim nhiều tập: tập trước {from}, tập này {to}.",
];

/** Tên cư dân mạng (hư cấu). */
export const NET_HANDLES = ["Cư Dân Hẻm 9", "Hội Mê Sườn Cháy Cạnh", "Team Không Bì", "Đói Khuya Quận Tư", "Chú Ba Đọc Review", "Người Qua Đường",
  "Bé Su Ăn Đêm", "Hội Trà Đá Vỉa Hè", "Sinh Viên Năm Cuối", "Tài Xế Ca Ba", "Cô Năm Bán Nước", "Fan Mỡ Hành"];

/** Review của cư dân mạng sinh ra từ câu trả lời (fx.netReview = sao). */
export const NET_REVIEW = {
  5: [
    "Ghé vì câu trả lời review, ở lại vì dĩa sườn. 5 sao. #comtam",
    "Đọc cô chủ trả lời xong chạy ra ăn liền. Sườn thơm, cô chủ còn vui hơn trên mạng.",
    "Quán này trả lời review hay, nướng sườn còn hay hơn. #sườncháycạnh",
    "Đi ăn vì tò mò, về nhà thành fan. 5 sao cho cả cơm lẫn câu chữ.",
    "Cô chủ thẳng tính nhưng dĩa cơm thì chuẩn. Ủng hộ quán.",
    "Tới coi mặt chủ quán nổi tiếng trên mạng, được thêm dĩa cơm ngon.",
  ],
  2: [
    "Đọc câu trả lời của quán thấy hơi gắt. Tạm 2 sao cho thái độ. #thẳngquá",
    "Cơm chưa ăn, nhưng cách trả lời khách vậy thì chưa muốn ăn.",
    "Khách góp ý mà quán cãi lại, hơi buồn. 2 sao.",
    "Thẳng tính là một chuyện, nói chuyện với khách là chuyện khác.",
    "Không ghé nữa đâu, ít nhất là tới khi quán trả lời nhẹ nhàng hơn.",
    "Mong quán bớt nóng như than, khách tới để ăn chứ không để cãi.",
  ],
};

/** Câu khách quay lại nhờ câu trả lời (theo tính cách cô chủ lúc trả lời). */
export const RETURN_LINES = {
  hien: [
    "{Call} ơi, {self} đọc trả lời của quán rồi, nay ghé lại nè.",
    "Quán dễ thương quá nên {self} quay lại liền.",
    "{Self} ghé lấy dĩa quán hứa mời nè {call}.",
    "Đọc {call} trả lời mà {self} muốn ăn lại ngay.",
    "Nay {self} tới coi quán sửa chưa nha {call}.",
    "{Call} còn nhớ {self} không, cái người viết review hôm bữa đó.",
  ],
  cucsuc: [
    "{Self} tới phục thù đây {call}. Nướng cho đàng hoàng nha.",
    "Quán thách thì {self} tới. Coi lần này ra sao.",
    "{Call} nói thẳng quá nên {self} phải tới coi tận mắt.",
    "Nay {self} tới chấm lại. Một dĩa như hôm bữa.",
    "Thôi được, {self} tới rồi nè. Đừng có cộc với {self} nha {call}.",
    "{Self} quay lại vì tò mò cô chủ ngoài đời có cộc vậy không.",
  ],
  lay: [
    "{Call} ơi, {self} tới coi nhân vật chính của meme nè.",
    "Đọc meme của quán cười quá, nay {self} ghé ăn thật.",
    "{Self} tới tham gia trend của quán nè {call}.",
    "Quán lầy vậy {self} không ghé không được.",
    "Cho {self} một dĩa như trong meme nha {call}.",
    "{Self} quay lại để được lên caption của quán.",
  ],
  sale: [
    "{Call} ơi, {self} có mã giảm của quán nè.",
    "{Self} tới dùng mã giảm đây, còn hạn không {call}?",
    "Quán mời combo nên {self} ghé thử luôn.",
    "{Self} dẫn bạn tới theo lời rủ của quán nè {call}.",
    "Nay {self} tới chốt đơn với {call} nè.",
    "{Call} ơi mã COMNONG còn xài được không, {self} ghé rồi nè.",
  ],
};

/** Câu chốt ngày Nhật Ký theo tính cách (thay câu thường ở ngày bình thường). */
export const CAPTIONS_PERSONA = {
  hien: [
    "Bán {plates} dĩa, nói dạ nhiều hơn số dĩa. Cô chủ hiền nhất hẻm vẫn giữ phong độ.",
    "{plates} dĩa, {stars} sao, và một cô chủ cảm ơn tới cả cái bếp than.",
    "Tối nay êm như giọng cô chủ. {plates} dĩa ra bàn, ai cũng được châm trà.",
    "Hiền thì không giàu nhanh, nhưng khách nhớ lâu. {plates} dĩa hôm nay.",
    "{plates} dĩa, dĩa nào cũng kèm một câu quán cảm ơn ạ.",
  ],
  cucsuc: [
    "Bán {plates} dĩa. Nói ít, nướng nhiều, khách vẫn quay lại.",
    "{plates} dĩa, {stars} sao. Cô chủ không cười trên mạng, chỉ cười sau vỉ.",
    "Hôm nay {plates} dĩa. Câu cửa miệng: ăn đi rồi nói.",
    "Thẳng như ruột ngựa, giòn như cơm cháy: {plates} dĩa hôm nay.",
    "{plates} dĩa. Không bì là không bì. Hết.",
  ],
  lay: [
    "Bán {plates} dĩa và nghĩ ra ba meme. Một ngày năng suất của cô chủ lầy.",
    "{plates} dĩa, {stars} sao, và một caption chưa ai hiểu.",
    "Hôm nay quán không viral, nhưng quán vui. {plates} dĩa. #quánlầy",
    "Góc nhìn của cái vỉ nướng: {plates} miếng sườn và một cô chủ hát suốt ca.",
    "{plates} dĩa cơm, mỗi dĩa một tiếng xèo, mỗi tiếng xèo một ý tưởng meme.",
  ],
  sale: [
    "Bán {plates} dĩa, phát ba lời mời quay lại. Cô chủ chốt đơn cả trong mơ.",
    "{plates} dĩa hôm nay. Câu của ngày: combo cơm sườn trà tắc.",
    "Chốt ngày: {plates} dĩa, {stars} sao, và một kế hoạch khuyến mãi cho tối mai.",
    "Ai ghé cũng nghe một câu combo. {plates} dĩa hôm nay, mai bán gấp đôi.",
    "{plates} dĩa và một xấp mã giảm đã phát. Mai thu hoạch.",
  ],
};
/** Câu chốt ngày khi có câu trả lời nổi bật nhất ngày (lên mạng, dính phốt) hoặc đổi tính nhiều lần. */
export const CAPTIONS_REPLY = {
  viral: [
    "Câu trả lời review hôm nay nổi hơn cả dĩa sườn. +{followers} người theo dõi.",
    "Bán {plates} dĩa, nhưng thứ lên mạng là một câu trả lời review. Đời là vậy.",
    "Một câu trả lời, nửa cái hẻm chụp màn hình. {plates} dĩa và một khoảnh khắc nổi tiếng.",
    "Hôm nay quán nổi nhờ một câu trả lời. Mẹ gọi hỏi: con bán cơm hay viết văn?",
    "{plates} dĩa, {stars} sao, và một câu trả lời được in lên tạp dề (trong tưởng tượng).",
    "Bài học hôm nay: một câu trả lời đúng lúc bằng mười tờ rơi dán cột điện.",
  ],
  phot: [
    "Bán {plates} dĩa và một câu trả lời hơi thẳng. Cả hẻm đang hóng phần tiếp theo.",
    "Hôm nay quán dính phốt nhỏ vì nói thật. Sườn vẫn thơm, câu chữ thì cần nướng lại.",
    "{plates} dĩa bán ra, một câu trả lời bay đi không thu lại được.",
    "Có một câu trả lời nóng hơn cả bếp than. Quán đang quạt cho nguội.",
    "Quán lên nhóm ăn đêm của quận, nhưng không phải vì sườn. Hẹn chương sau.",
    "Bán {plates} dĩa, cãi một câu, hot cả hẻm. Không khuyến khích, nhưng nhớ đời.",
  ],
  flip: [
    "Hôm nay cô chủ đổi tính {flips} lần. Khách hỏi: nay là phiên bản nào vậy?",
    "Chiều hiền, tối cục, khuya lầy, sáng chốt đơn. {flips} lần đổi tính trong một ngày.",
    "Bán {plates} dĩa với {flips} phiên bản cô chủ. Cái bếp than vẫn là cái bếp than.",
    "Cư dân mạng nghi quán có nhiều admin. Sự thật: một người, {flips} tâm trạng.",
    "{flips} lần đổi giọng, {plates} dĩa cơm. Chỉ có nước mắm là giữ nguyên công thức.",
  ],
};
