// Sự kiện Drama (docs/tiem-tra-sua/DRAMA.md + mở rộng). Nhân vật, tiệm, địa danh đều hư cấu; không thương hiệu thật, không người thật.
// Giọng hài tử tế: châm chọc tình huống, không chê bai người.
//
// Cấu trúc một sự kiện:
//   id        mã duy nhất (C01–X05 theo DRAMA.md, mở rộng dùng tiền tố V = viral, D = đời thường, K = khách, M = mạng, O = vận hành)
//   group     "khach" | "mang" | "van-hanh" | "dac-biet" | "doi"
//   tone      "good" (tích cực / đời thường) | "mixed" | "bad" — engine giữ ít nhất một "good" mỗi ba sự kiện
//   when      "shift" (trong ca, đồng hồ dừng) | "day" (giữa hai ca, sau bảng chốt ca)
//   priority  1..3 (3 = do người chơi gây ra, ưu tiên), w = trọng số (mặc định 1), cooldown = số ngày nghỉ (mặc định 2), once
//   if        điều kiện khai báo (core/drama.js meets): minDay minLevel minRep maxRep minFollowers minMoney maxMoney flags noFlags owns notOwns
//             reviewLow sum{lostMin profitMax profitMin starsMin starsMax cupsMin} chain (chỉ mở qua hẹn "later")
//             — chỉ trong ca: waitingMin queueFree rush pearlsOut archWaiting lostMin cupsMin tMin tMax lastServe{sugar sugarOk iceOk minStars maxStars arch notArch cups topping mistake outcome maxAgeMs}
//   who       "waiting" | { arch } (khách đang chờ nói) | "lastServed" (khách vừa nhận ly) — hoặc npc: { role, name, self, call }
//             role ∈ barista regular vip reviewer courier neighbor office-worker (ảnh chân dung)
//   nodes     { start: { line, mood, me?, choices: [...] }, <bước khác>: {...} }
//   choice    { id, label, hint, say (câu trả lời đáng trích — lưu vào Nhật Ký), fx, goto?: bước kế tiếp ngay, later?: { id, days }, roll?: { p, win:{say,fx}, lose:{say,fx} } }
//   fx        money rep followers buzz xp stock{id:±n} kitchen patience whoPatience delaySpawn sealMs guests group{cups arch tip name line same recipe patienceMul}
//             nextGuests demand("who"|recipe) flag unflag review{stars line name} swapTopping priceWho leaveWho moment(chuỗi | false)
// Biến trong câu: {name} {self} {Self} {call} {Call} {drink} {sugar} {ice} {topping} {shop} {n} {followers}.
// Mọi bước phải có ít nhất một lựa chọn không tốn tiền / hàng (test/drama.test.mjs kiểm).
// Sự kiện cho các cơ chế M3 (đơn nhóm F, bàn pha P, vựa sỉ U, quảng bá Q, ký gửi B) ở data/events-m3.js.
// Sự kiện sinh ra từ câu trả lời review (R01–R10) ở data/events-reply.js; lựa chọn có thể có sayBy / nút meBy theo tính cách chủ tiệm.
import { EVENTS_M3 } from "./events-m3.js?v=m37";
import { EVENTS_REPLY } from "./events-reply.js?v=m37";
import { EVENTS_STOCKOUT } from "./events-stockout.js?v=m37";

export const EVENTS = [
  // ===== Khách =====
  {
    id: "C02", group: "khach", tone: "mixed", when: "shift", priority: 3, cooldown: 2,
    if: { minDay: 2, lastServe: { sugar: 0, sugarOk: true, notArch: "khach-quen" } }, who: "lastServed",
    nodes: {
      start: {
        mood: "annoyed", line: "{Self} gọi 0% đường… sao không ngọt vậy {call}?", me: "Dạ… 0% là không có đường đó {call}.",
        choices: [
          { id: "explain", label: "Giải thích công thức", hint: "Giữ nguyên ly, khách hiểu thì +1 danh tiếng",
            say: "0% đường nghĩa là ly này trung thực với {self} tuyệt đối.", fx: { rep: 1, flag: "c02-explained" }, later: { id: "C05", days: 1 } },
          { id: "fruit", label: "Cho thử trà đào", hint: "Tốn 1 phần đào, nhớ vị khách thích",
            say: "Thử ngụm đào này nè, ngọt tự nhiên mà không phạm luật 0%.", fx: { stock: { dao: -1 }, demand: "tra-dao", flag: "c02-explained" }, later: { id: "C05", days: 1 } },
        ],
      },
    },
  },
  {
    id: "C05", group: "khach", tone: "good", when: "shift", priority: 2, cooldown: 3,
    if: { chain: true, waitingMin: 1 }, who: "waiting",
    nodes: {
      start: {
        mood: "happy", line: "{Call} còn nhớ {self} không? {Self} quên mà {call} nhớ là được.",
        choices: [
          { id: "remember", label: "Gợi lại vị đã lưu", hint: "Khách vui, chờ thêm 10 giây",
            say: "Nhớ chứ, {sugar} đường, {ice}. Tiệm có sổ, sổ có tâm.", fx: { whoPatience: 10000, rep: 1, followers: 3 } },
          { id: "new", label: "Mời món mới", hint: "Ca sau nhiều người gọi món này",
            say: "Hôm nay thử món mới đi, không ngon tiệm đổi lại vị cũ liền.", fx: { demand: "who", buzz: 0.5 } },
        ],
      },
    },
  },
  // ===== Vận hành =====
  {
    id: "O02", group: "van-hanh", tone: "mixed", when: "shift", priority: 3, cooldown: 2,
    if: { minDay: 2, pearlsOut: true }, who: "waiting",
    nodes: {
      start: {
        mood: "annoyed", line: "Hết trân châu thiệt hả {call}? {Self} tưởng tiệm lấy tên {self} đặt mà.",
        choices: [
          { id: "wait", label: "Báo chờ mẻ mới", hint: "Giữ đơn, khách chờ thêm 15 giây",
            say: "Mẻ mới đang lăn tăn trong nồi, {self} chờ chút xíu là có liền.", fx: { whoPatience: 15000 } },
          { id: "jelly", label: "Mời đổi thạch, giảm 2k", hint: "Đổi topping của đơn sang thạch",
            say: "Đổi thạch nha, giòn sần sật, giảm 2k coi như tiền xin lỗi trân châu.", fx: { swapTopping: "thach", priceWho: -2 } },
        ],
      },
    },
  },
  // ===== Đặc biệt =====
  {
    id: "X04", group: "dac-biet", tone: "good", when: "shift", priority: 1, cooldown: 2,
    if: { minDay: 3, queueFree: true, tMax: 150000 }, npc: { role: "office-worker", name: "Chị Hằng phòng kế toán", self: "chị", call: "em" },
    nodes: {
      start: {
        mood: "happy", line: "Tụi chị đi ngang, thấy có chỗ trống nên rủ cả phòng. Nhóm chat đang lên đơn 15 ly…",
        choices: [
          { id: "accept", label: "Nhận đơn nhóm 3 ly", hint: "Giao đúng giờ được thưởng 8k", goto: "cap",
            say: "Dạ nhận! Nhưng tiệm nhỏ, mình chốt 3 ly trước nha chị.", fx: {} },
          { id: "later", label: "Mời đặt khung giờ sau", hint: "Ca sau thêm 2 khách",
            say: "Chị đặt khung giờ sáng mai nha, tiệm pha sẵn đợi cả phòng.", fx: { nextGuests: 2 } },
        ],
      },
      cap: {
        mood: "sheepish", line: "Ủa 3 ly thôi hả em? Còn 12 người kia chị nói sao?",
        choices: [
          { id: "honest", label: "Nói thật: quầy có 1 đôi tay", hint: "Đơn 3 ly, thưởng 8k nếu kịp",
            say: "Tiệm có một đôi tay và một trái tim, 3 ly là vừa đẹp chị ơi.", fx: { group: { cups: 3, arch: "van-phong", tip: 8, name: "Chị Hằng", line: "Ba ly cho phòng kế toán nha em, ghi tên từng ly giùm chị." } } },
          { id: "voucher", label: "Tặng mã giảm cho 12 người kia", hint: "Đơn 3 ly, ca sau thêm 3 khách",
            say: "Mười hai người kia ghé mai, mỗi người được tặng một tiếng nắp cạch.", fx: { group: { cups: 3, arch: "van-phong", tip: 0, name: "Chị Hằng" }, nextGuests: 3 } },
        ],
      },
    },
  },
  // ===== Đời thường (giữa hai ca) =====
  {
    id: "D01", group: "doi", tone: "good", when: "day", priority: 1, cooldown: 4,
    if: { minDay: 2 }, npc: { role: "neighbor", name: "Mẹ", self: "mẹ", call: "con" },
    nodes: {
      start: {
        mood: "happy", line: "Alo con hả? Bán được hông? Mẹ thấy trên mạng người ta nói tiệm con… à mà mẹ không biết đọc chữ nhỏ.",
        choices: [
          { id: "brag", label: "Kể thành tích hôm nay", hint: "Mẹ khoe nhóm Zalo họ: +15 người theo dõi",
            say: "Con bán đắt lắm mẹ, có người còn khen cái nắp.", fx: { followers: 15 } },
          { id: "honest", label: "Than mệt, hứa về ăn cơm", hint: "Mẹ gửi đồ ăn: ca sau khách kiên nhẫn hơn (+1 danh tiếng)",
            say: "Con mệt xíu mà vui. Mai con về ăn cơm, mẹ đừng nấu nhiều quá nha.", fx: { rep: 1 } },
        ],
      },
    },
  },
  // ===== Khách (DRAMA.md) =====
  {
    id: "C03", group: "khach", tone: "mixed", when: "shift", priority: 3, cooldown: 3,
    if: { minDay: 3, lastServe: { iceOk: true, minStars: 3 } }, who: "lastServed",
    nodes: {
      start: {
        mood: "annoyed", line: "{Call} ơi, {self} bấm ít đá hay {self} nghĩ là {self} bấm ít đá ta?", me: "Để em lấy phiếu ra coi chung nha.",
        choices: [
          { id: "check", label: "Đối chiếu phiếu", hint: "Giữ chi phí, khách xem lại đơn. Có thể thành chuyện trên mạng",
            say: "Phiếu ghi {ice}, ly cũng {ice}. Phiếu không biết nói dối, chỉ biết dính nước.", goto: "proof", fx: {} },
          { id: "remake", label: "Làm lại ly ít đá", hint: "Tốn 1 ly + 1 đá, khách quý tiệm (+1 danh tiếng)",
            say: "Không sao, tiệm làm lại. Đá có thể sai, tình cảm khách hàng thì không.", fx: { stock: { ly: -1, da: -1 }, rep: 1, followers: 3 } },
        ],
      },
      proof: {
        mood: "sheepish", line: "Ờ ha… đúng là {ice}. Mà {self} lỡ đăng story than rồi {call} ơi.",
        choices: [
          { id: "laugh", label: "Cười xoà, xin tag tiệm", hint: "+8 người theo dõi, chuyện có thể lên nhóm review",
            say: "Story than cũng được, nhớ tag tiệm để mọi người biết tiệm đo đá bằng thước.", fx: { followers: 8, flag: ["phieu-doi-chieu", "tranh-cai"] }, later: { id: "S05", days: 1 } },
          { id: "gift", label: "Tặng phiếu giảm giá lần sau", hint: "Ca sau thêm 1 khách quen",
            say: "Lần sau ghé tiệm giảm liền, coi như phí tâm lý cho viên đá.", fx: { nextGuests: 1, flag: "phieu-doi-chieu" } },
        ],
      },
    },
  },
  {
    id: "C04", group: "khach", tone: "mixed", when: "shift", priority: 2, cooldown: 3,
    if: { minLevel: 8, waitingMin: 2 }, who: { arch: "vip" },
    nodes: {
      start: {
        mood: "annoyed", line: "Ly {self} phải đúng vị nha {call}, mà messenger sếp {self} cũng đang kêu ting ting.",
        choices: [
          { id: "vip", label: "Ưu tiên VIP", hint: "VIP chờ thêm 10 giây, khách khác mất 8 giây kiên nhẫn",
            say: "Dạ ly của {call}… à của chị, em làm liền. Mọi người thông cảm, sếp chị đang ting ting.", fx: { whoPatience: 10000, patience: -8000 } },
          { id: "queue", label: "Giữ thứ tự", hint: "+1 danh tiếng, ca sau VIP đặt trước (+1 khách)",
            say: "Tiệm làm theo thứ tự nha chị, nhưng em hứa ly chị đúng tới từng giọt.", goto: "boss", fx: { rep: 1, nextGuests: 1 } },
        ],
      },
      boss: {
        mood: "sheepish", line: "Thôi được… mà sếp {self} hỏi tiệm có nhận đặt trước cho cả phòng mai không?",
        choices: [
          { id: "preorder", label: "Nhận đặt trước cho ngày mai", hint: "Ca sau thêm 2 khách, VIP quay lại",
            say: "Dạ nhận! Mai phòng chị tới là có ly đúng tên, đúng vị, đúng giờ họp.", fx: { nextGuests: 2 }, later: { id: "C05", days: 1 } },
          { id: "card", label: "Đưa danh thiếp kèm tiếng cạch", hint: "VIP chờ thêm 6 giây, +5 người theo dõi",
            say: "Danh thiếp tiệm đây chị, mặt sau có ghi: 'Đặt trước khỏi chờ, khỏi bị sếp réo'.", fx: { whoPatience: 6000, followers: 5 } },
        ],
      },
    },
  },
  // ===== Mạng xã hội (DRAMA.md) =====
  {
    id: "S01", group: "mang", tone: "good", when: "shift", priority: 1, cooldown: 4,
    if: { minRep: 60, cupsMin: 2 }, who: { arch: "reviewer" },
    nodes: {
      start: {
        mood: "happy", line: "Cho mình quay lúc {call} đóng nắp nha, tiếng 'cạch' này nghe ghiền.",
        choices: [
          { id: "film", label: "Cho quay món chủ lực", hint: "Hên xui: clip nổ thì thêm nhiều người theo dõi",
            say: "Quay đi bạn, nắp tiệm kêu cạch chuẩn tông Đô trưởng.", later: { id: "S03", days: 1 },
            roll: { p: 0.6, win: { say: "Cạch! Một phát ăn ngay. Mi Review hét lên: 'Tiếng này là ASMR quốc dân!'", fx: { followers: 40, buzz: 1, flag: "s01-ok" } },
              lose: { say: "Cạch… cạch… cạch. Ba lần mới dính. Clip tên là 'Chị chủ và chiếc nắp cứng đầu'.", fx: { followers: 12 } } } },
          { id: "after", label: "Xin quay góc quầy sau ca", hint: "Không ảnh hưởng nhịp, +1 danh tiếng",
            say: "Sau ca quầy sạch bóng, quay góc nào cũng như ảnh bìa.", fx: { rep: 1, followers: 6, flag: "len-hinh" } },
        ],
      },
    },
  },
  {
    id: "S02", group: "mang", tone: "bad", when: "day", priority: 3, cooldown: 4,
    if: { reviewLow: true, flags: ["phieu-doi-chieu"] }, npc: { role: "reviewer", name: "Nhóm Review Ăn Uống Khu Phố", self: "nhóm", call: "tiệm" },
    nodes: {
      start: {
        mood: "annoyed", line: "Ảnh chụp ghi ô long, dòng mô tả lại bảo matcha. Tiệm giải thích sao đây ạ?",
        choices: [
          { id: "proof", label: "Đính chính bằng phiếu", hint: "+1 danh tiếng, nhóm theo dõi tiếp",
            say: "Phiếu đây ạ: ô long là ô long, matcha là matcha. Chỉ có caption là đi lạc.", fx: { rep: 1, flag: "tranh-cai" }, later: { id: "S05", days: 1 } },
          { id: "retry", label: "Mời thử lại một ly", hint: "Tốn 1 ly + 1 ô long, +2 danh tiếng",
            say: "Mời bạn ghé thử lại, ly sửa tiệm bao, lần này chụp đúng góc.", fx: { stock: { ly: -1, "o-long": -1 }, rep: 2 } },
        ],
      },
    },
  },
  {
    id: "S03", group: "mang", tone: "good", when: "day", priority: 1, cooldown: 4,
    if: { chain: true, flags: ["s01-ok"] }, npc: { role: "reviewer", name: "Mi Review", self: "em", call: "chị" },
    nodes: {
      start: {
        mood: "happy", line: "Chị ơi clip đóng nắp có người bật lại mười lần. Comment kêu tiệm mở khung giờ đặt trước kìa!",
        choices: [
          { id: "slots", label: "Nhận đặt theo khung giờ", hint: "Ca sau thêm 2 khách",
            say: "Mở khung giờ liền! Đặt trước được nghe tiếng cạch bản gốc.", fx: { nextGuests: 2, flag: "len-hinh" } },
          { id: "steady", label: "Giữ số đơn hiện tại", hint: "+1 danh tiếng, +10 người theo dõi",
            say: "Tiệm nhỏ, chạy chậm mà chắc. Nổi tiếng thì nổi, trân châu vẫn phải chín.", fx: { rep: 1, followers: 10, flag: "len-hinh" } },
        ],
      },
    },
  },
  {
    id: "S04", group: "mang", tone: "good", when: "shift", priority: 1, cooldown: 3,
    if: { minDay: 3, owns: ["premium-lantern", "lit-signboard"] }, who: "waiting",
    nodes: {
      start: {
        mood: "happy", line: "{Call} ơi cho {self} chụp ly một tấm. Ly lên hình đẹp hơn {self} luôn á.",
        choices: [
          { id: "corner", label: "Cho chụp ở góc quán", hint: "+1 danh tiếng, ảnh vào Nhật Ký",
            say: "Góc này đèn vàng, ai đứng cũng thành ảnh bìa, ly đứng thì thành poster.", fx: { rep: 1, flag: "len-hinh" } },
          { id: "tag", label: "Mời ghi tên món khi đăng", hint: "Ca sau nhiều người gọi món này, +5 theo dõi",
            say: "Đăng nhớ ghi tên món nha, để người ta khỏi hỏi 'ly gì mà xinh vậy'.", fx: { demand: "who", followers: 5, flag: "len-hinh" } },
        ],
      },
    },
  },
  {
    id: "S05", group: "mang", tone: "mixed", when: "day", priority: 2, cooldown: 4,
    if: { chain: true, flags: ["tranh-cai"] }, npc: { role: "reviewer", name: "Admin nhóm review", self: "em", call: "tiệm" },
    nodes: {
      start: {
        mood: "waiting", line: "Tiệm trả lời gọn giúp em nha, cả nhóm đang hóng như hóng phim bộ.",
        choices: [
          { id: "reply", label: "Phản hồi và đính chính", hint: "+1 danh tiếng",
            say: "Tóm tắt: ly đúng, caption sai, cả nhà thương nhau. Hết phim.", fx: { rep: 1, unflag: "tranh-cai" } },
          { id: "fix", label: "Đăng cách tiệm khắc phục", hint: "+15 người theo dõi, ca sau thêm 1 khách",
            say: "Từ nay mỗi ly có phiếu dán kèm. Đọc phiếu như đọc thư tình, rõ từng dòng.", fx: { followers: 15, nextGuests: 1, unflag: "tranh-cai" } },
        ],
      },
    },
  },
  // ===== Vận hành (DRAMA.md) =====
  {
    id: "O01", group: "van-hanh", tone: "mixed", when: "shift", priority: 1, cooldown: 3,
    if: { minDay: 2, tMin: 20000 }, npc: { role: "courier", name: "Anh Tèo shipper", self: "em", call: "chị" },
    nodes: {
      start: {
        mood: "sheepish", line: "Em đọc đúng số nhà, mỗi cái đường hơi sai. Thùng hàng này của tiệm bên kia hẻm…",
        choices: [
          { id: "swap", label: "Đổi lô, chờ 15 giây", hint: "Tạm ngưng nhận khách 15 giây, khách đang chờ thêm 10 giây",
            say: "Em chạy đổi đi, tiệm chờ được. Đường sai thì quay xe, đừng quay lưng.", fx: { delaySpawn: 15000, patience: 10000 } },
          { id: "keep", label: "Nhận phần dùng được", hint: "Được thêm 2 đào + 2 đá",
            say: "Đào với đá thì nhà nào cũng cần. Phần còn lại em trả giùm chị nha.", goto: "bonus", fx: { stock: { dao: 2, da: 2 } } },
        ],
      },
      bonus: {
        mood: "happy", line: "Cảm ơn chị! Mà chị có muốn em ghé giao mỗi sáng không? Em thuộc hẻm này rồi.",
        choices: [
          { id: "deal", label: "Nhận, hẹn giao sáng mai", hint: "+1 danh tiếng, ca sau thêm 1 khách",
            say: "Ok em, sáng mai giao đúng số nhà là chị tặng một tiếng cạch.", fx: { rep: 1, nextGuests: 1 } },
          { id: "tip", label: "Bo em 5k", hint: "−5k, +8 người theo dõi (Tèo kể khắp hẻm)",
            say: "Cầm 5k uống nước, nhớ kể cả hẻm là tiệm dễ thương.", fx: { money: -5, followers: 8 } },
        ],
      },
    },
  },
  {
    id: "O03", group: "van-hanh", tone: "bad", when: "shift", priority: 2, cooldown: 4,
    if: { minDay: 3, cupsMin: 3 }, npc: { role: "barista", name: "Bạn", self: "mình", call: "máy" },
    nodes: {
      start: {
        mood: "surprised", line: "Máy kêu cạch. Rồi nó kêu lại lần nữa dù mình chưa bấm. Nó tự đóng nắp… không khí?",
        choices: [
          { id: "hand", label: "Đóng nắp bằng tay", hint: "Mỗi ly chậm 3 giây đến hết ca, không tốn tiền",
            say: "Thôi máy nghỉ đi, hôm nay tay mình là máy đóng nắp phiên bản giới hạn.", fx: { sealMs: 3000 } },
          { id: "fix", label: "Gọi thợ sửa (18k)", hint: "−18k, tạm ngưng nhận khách 12 giây",
            say: "Alo thợ ơi, máy nhà em kêu cạch tự do. Anh qua liền giùm em.", fx: { money: -18, delaySpawn: 12000, xp: 3 } },
        ],
      },
    },
  },
  {
    id: "O04", group: "van-hanh", tone: "bad", when: "shift", priority: 1, cooldown: 4,
    if: { minLevel: 6, waitingMin: 1 }, who: "waiting",
    nodes: {
      start: {
        mood: "surprised", line: "Ủa cúp điện rồi {call}? Mà đèn điện thoại của khách bật lên hết, nhìn như concert.",
        choices: [
          { id: "cold", label: "Chạy menu nguội, pha tay", hint: "Mỗi ly chậm 2 giây, +1 danh tiếng vì bình tĩnh",
            say: "Không điện vẫn có tâm. Mọi người giữ đèn giùm, tiệm pha dưới ánh sáng fan cuồng.", fx: { sealMs: 2000, rep: 1 }, later: { id: "S04", days: 1 } },
          { id: "pause", label: "Tạm nhận đơn mới sau 12 giây", hint: "Tạm ngưng nhận khách 12 giây, khách đang chờ thêm 8 giây",
            say: "Tiệm tạm dừng 12 giây để cầu dao suy nghĩ lại cuộc đời.", fx: { delaySpawn: 12000, patience: 8000 } },
        ],
      },
    },
  },
  {
    id: "O05", group: "van-hanh", tone: "mixed", when: "shift", priority: 3, cooldown: 3,
    if: { minLevel: 3, lastServe: { cups: 2 } }, who: "lastServed",
    nodes: {
      start: {
        mood: "sheepish", line: "Hai ly đều đúng nha {call}. Chỉ có hai cái tên trên ly bị đổi chỗ cho nhau.",
        choices: [
          { id: "relabel", label: "Kiểm phiếu và đổi nhãn", hint: "Khách đang chờ mất 4 giây, +1 danh tiếng",
            say: "Để em đổi nhãn liền, ly nào về đúng chủ nấy, không ai uống nhầm tâm trạng.", fx: { patience: -4000, rep: 1 } },
          { id: "joke", label: "Đùa: đổi ly đổi vận", hint: "+6 người theo dõi, khách cười rồi đi",
            say: "Đổi ly là đổi vận, hôm nay hai bạn may mắn gấp đôi.", fx: { followers: 6, leaveWho: true } },
        ],
      },
    },
  },
  // ===== Đặc biệt (DRAMA.md) =====
  {
    id: "X01", group: "dac-biet", tone: "mixed", when: "shift", priority: 1, cooldown: 5,
    if: { minLevel: 6, tMax: 45000 }, npc: { role: "neighbor", name: "Cô Hạnh tổ kiểm tra phường", self: "cô", call: "con" },
    nodes: {
      start: {
        mood: "waiting", line: "Cho cô xem lúc mở mẻ trân châu. Cái này nhìn sạch, giấy ghi còn sạch hơn.",
        choices: [
          { id: "book", label: "Trình sổ ghi lô hàng", hint: "Hên xui: sổ đủ thì +2 danh tiếng",
            say: "Dạ sổ đây cô, lô nào nhập ngày nào con ghi hết, chữ hơi xấu nhưng thật thà.",
            roll: { p: 0.7, win: { say: "Cô gật gù: 'Sổ sạch như nồi mới chà.' Tiệm đạt kiểm tra!", fx: { rep: 2 } },
              lose: { say: "Thiếu đúng một dòng ngày nhập đường. Cô dặn bổ sung, con ghi liền vô tay.", fx: { xp: 4 } } } },
          { id: "self", label: "Tự kiểm và bổ sung", hint: "Tạm ngưng nhận khách 10 giây, +1 danh tiếng",
            say: "Con xin 10 giây kiểm lại bếp, cô uống ly trà đào ngồi chờ nha.", fx: { delaySpawn: 10000, rep: 1 } },
        ],
      },
    },
  },
  {
    id: "X02", group: "dac-biet", tone: "mixed", when: "shift", priority: 2, cooldown: 4,
    if: { chain: true, flags: ["do-that-lac"] }, npc: { role: "courier", name: "Chú Tám bảo vệ khu phố", self: "chú", call: "con" },
    nodes: {
      start: {
        mood: "waiting", line: "Có hai người cùng nhận cái túi bỏ quên hôm bữa. Ai nhớ trong túi có gì thì đứng một bên giùm chú.",
        choices: [
          { id: "handover", label: "Giao đồ cho chú phụ trách", hint: "+1 danh tiếng, đóng chuyện an toàn",
            say: "Dạ chú giữ giùm con, con chỉ giỏi giữ trân châu thôi.", fx: { rep: 1, unflag: "do-that-lac" } },
          { id: "quiz", label: "Hỏi riêng mô tả từng người", hint: "Khách đang chờ mất 8 giây, đúng người thì quay lại làm khách quen",
            say: "Mỗi người nói nhỏ cho con nghe trong túi có gì. Ai nói 'cục sạc với nửa gói bánh' là đúng.", fx: { patience: -8000, followers: 5, unflag: "do-that-lac" }, later: { id: "C05", days: 1 } },
        ],
      },
    },
  },
  {
    id: "X03", group: "dac-biet", tone: "good", when: "shift", priority: 1, cooldown: 4,
    if: { minDay: 3, cupsMin: 2 }, npc: { role: "neighbor", name: "Bé Su con nhà bên", self: "em", call: "chị" },
    nodes: {
      start: {
        mood: "surprised", line: "Chị ơi cái túi này ngồi trên ghế lâu hơn cả người đặt trước luôn á.",
        choices: [
          { id: "keep", label: "Cất kỹ, gọi khách theo phiếu", hint: "+1 danh tiếng, đúng người thì ca sau quay lại",
            say: "Cất vô tủ, phiếu còn ghi tên. Đồ đi lạc tiệm giữ như giữ trân châu nóng.", fx: { rep: 1 }, later: { id: "C05", days: 1 } },
          { id: "log", label: "Ghi vào sổ thất lạc", hint: "Ghi sổ cẩn thận (+3 XP), có thể có người tới nhận",
            say: "Ghi sổ: một túi vải, một móc khoá hình con vịt, một nỗi nhớ chủ.", fx: { xp: 3, flag: "do-that-lac" }, later: { id: "X02", days: 1 } },
        ],
      },
    },
  },
  {
    id: "X05", group: "dac-biet", tone: "good", when: "shift", priority: 1, cooldown: 5,
    if: { minRep: 75, flags: ["len-hinh"] }, npc: { role: "vip", name: "Lam Lam ca sĩ phòng trà", self: "em", call: "chị" },
    nodes: {
      start: {
        mood: "sheepish", line: "Em xin ngồi góc kia. Hôm nay em nổi tiếng với đúng một người là em.",
        choices: [
          { id: "normal", label: "Cho dùng như mọi người", hint: "+1 danh tiếng, khách thành khách quen",
            say: "Ở đây ai cũng là ca sĩ chính của ly trà mình. Em cứ ngồi thoải mái.", fx: { rep: 1 }, later: { id: "C05", days: 1 } },
          { id: "photo", label: "Xin chụp bảng món cùng ly", hint: "+30 người theo dõi, ca sau thêm 2 khách đi ngang",
            say: "Cho chị xin một tấm với bảng món, chị hứa không ghi 'ca sĩ ghé', chỉ ghi 'người hát hay ghé'.", fx: { followers: 30, buzz: 1, nextGuests: 2 } },
        ],
      },
    },
  },
  // ===== Khách mở rộng =====
  {
    id: "K10", group: "khach", tone: "good", when: "shift", priority: 1, cooldown: 3,
    if: { minDay: 2 }, who: { arch: "hoc-sinh" },
    nodes: {
      start: {
        mood: "happy", line: "{Call} ơi ly này phải healing á, kiểu uống vô là hết red flag, no cap luôn.",
        choices: [
          { id: "vibe", label: "Bắt sóng: 'Có liền, ly green flag'", hint: "Khách chờ thêm 10 giây, +5 người theo dõi",
            say: "Ly này xanh như green flag, ngọt như crush rep tin nhắn.", fx: { whoPatience: 10000, followers: 5 } },
          { id: "ask", label: "Hỏi lại nghĩa là sao", hint: "Nghe khách dịch tiếng Gen Z",
            say: "Khoan, healing là ít đá hay nhiều đá vậy em?", goto: "translate", fx: {} },
        ],
      },
      translate: {
        mood: "sheepish", line: "Dạ healing là… đúng như phiếu á {call}. Mà {call} nói chuyện vậy là 'chill' rồi đó.",
        choices: [
          { id: "learn", label: "Xin học thêm từ mới", hint: "+4 XP, khách vui chờ thêm 6 giây",
            say: "Vậy chị pha xong em chấm 'slay' giùm chị nha.", fx: { xp: 4, whoPatience: 6000 } },
          { id: "post", label: "Ghi lên bảng: 'Menu healing'", hint: "+1 tiệm hot, ca sau nhiều người gọi món này",
            say: "Từ nay món này tên 'ly hết red flag', bán kèm một câu động viên.", fx: { buzz: 1, demand: "who" } },
        ],
      },
    },
  },
  {
    id: "K11", group: "khach", tone: "mixed", when: "shift", priority: 1, cooldown: 3,
    if: { minDay: 2, waitingMin: 1 }, who: "waiting",
    nodes: {
      start: {
        mood: "waiting", line: "Cho {self} ít ngọt… mà ngọt nha {call}. Ngọt kiểu dịu dàng, không phải ngọt kiểu sến.",
        choices: [
          { id: "taste", label: "Cho nếm thử từng mức", hint: "Tốn 1 phần đường, khách chờ thêm 8 giây",
            say: "Nếm thử nè: muỗng này dịu dàng, muỗng kia là thơ tình.", goto: "pick", fx: { stock: { duong: -1 }, whoPatience: 8000 } },
          { id: "explain", label: "Giải thích theo phiếu", hint: "+1 danh tiếng, giữ đúng {sugar}",
            say: "Ít ngọt mà ngọt là {sugar}, ngọt vừa đủ để nhớ, không đủ để ngán.", fx: { rep: 1 } },
        ],
      },
      pick: {
        mood: "happy", line: "Muỗng thứ hai! Muỗng đó ngọt như lời xin lỗi thật lòng.",
        choices: [
          { id: "name", label: "Đặt tên mức 'xin lỗi thật lòng'", hint: "+8 người theo dõi",
            say: "Mức đường mới: 'xin lỗi thật lòng'. Gọi tên này tiệm hiểu liền.", fx: { followers: 8 } },
          { id: "note", label: "Ghi sổ vị khách thích", hint: "Khách thành khách quen, quay lại sau",
            say: "Ghi sổ: {name}, ít ngọt mà ngọt, muỗng số hai.", fx: { xp: 3 }, later: { id: "C05", days: 2 } },
        ],
      },
    },
  },
  {
    id: "K12", group: "khach", tone: "mixed", when: "shift", priority: 1, cooldown: 4,
    if: { minDay: 3 }, who: { arch: "khach-quen" },
    nodes: {
      start: {
        mood: "sheepish", line: "Con ghi sổ cho cô nha, cuối tháng cô trả… cuối tháng nào thì cô chưa biết.",
        choices: [
          { id: "tab", label: "Ghi sổ cho cô", hint: "Ly này thu ít hơn 20k, cô hứa trả sau",
            say: "Dạ con ghi sổ, sổ tiệm dày nhưng lòng tiệm còn dày hơn.", fx: { priceWho: -20, flag: "ghi-so" }, later: { id: "K12B", days: 2 } },
          { id: "cash", label: "Năn nỉ trả liền, tặng nụ cười", hint: "+3 XP quản lý dòng tiền, cô vẫn vui",
            say: "Hôm nay tiệm khuyến mãi: trả liền được tặng nụ cười, ghi sổ được tặng lo âu.", fx: { xp: 3, whoPatience: 4000 } },
        ],
      },
    },
  },
  {
    id: "K12B", group: "khach", tone: "good", when: "day", priority: 1, cooldown: 5,
    if: { chain: true, flags: ["ghi-so"] }, npc: { role: "neighbor", name: "Cô Tư", self: "cô", call: "con" },
    nodes: {
      start: {
        mood: "happy", line: "Cô trả tiền sổ nè con. Cô còn đem nồi chè đậu trắng cho cả tiệm, cuối tháng của cô tới sớm.",
        choices: [
          { id: "take", label: "Nhận tiền, cảm ơn chè", hint: "+30k, gạch sổ",
            say: "Con nhận tiền, nhận chè, nhận luôn bài học: tin người cũng có lời.", fx: { money: 30, unflag: "ghi-so" } },
          { id: "forgive", label: "Mời cô, coi như quà", hint: "+2 danh tiếng, cô kể cả xóm (+15 theo dõi)",
            say: "Ly đó con mời cô, chè này con nhận thay tiền. Huề cả làng!", fx: { rep: 2, followers: 15, unflag: "ghi-so" } },
        ],
      },
    },
  },
  // ===== Mạng mở rộng =====
  {
    id: "V10", group: "mang", tone: "good", when: "shift", priority: 1, cooldown: 4,
    if: { minDay: 3, waitingMin: 1 }, npc: { role: "reviewer", name: "Hến Đi Ăn", self: "mình", call: "chị chủ" },
    nodes: {
      start: {
        mood: "happy", line: "Hi cả nhà, mình đang live ở {shop} nè! Chị chủ nói gì với hai nghìn người xem đi ạ!",
        choices: [
          { id: "pose", label: "Tạo dáng, chào khán giả", hint: "Hên xui: nói trơn tru thì nổ follow",
            say: "Chào cả nhà, tiệm có trà, có sữa, có một chủ tiệm đang run.", later: { id: "V11", days: 1 },
            roll: { p: 0.55, win: { say: "Câu chào thành trend: 'có một chủ tiệm đang run' được ghép nhạc 300 lần.", fx: { followers: 60, buzz: 1, flag: "clip-tiem" } },
              lose: { say: "Nói vấp ba lần, nhưng comment khen 'chị chủ vấp mà dễ thương'.", fx: { followers: 15, flag: "clip-tiem" } } } },
          { id: "shy", label: "Xin quay cái ly thôi", hint: "+1 danh tiếng, khách đang chờ thêm 5 giây vì vui",
            say: "Quay ly giùm chị nha, ly ăn ảnh hơn chị nhiều.", fx: { rep: 1, patience: 5000 } },
        ],
      },
    },
  },
  {
    id: "V11", group: "mang", tone: "good", when: "day", priority: 1, cooldown: 5,
    if: { chain: true, flags: ["clip-tiem"] }, npc: { role: "reviewer", name: "Hến Đi Ăn", self: "mình", call: "chị chủ" },
    nodes: {
      start: {
        mood: "happy", line: "Clip hôm qua lên 12 nghìn view nha chị! Comment top: 'tiệm này có cái nắp biết hát'.",
        choices: [
          { id: "pin", label: "Ghim comment, cảm ơn", hint: "+20 người theo dõi",
            say: "Ghim liền! Cảm ơn mọi người, cái nắp đang tập bài thứ hai.", fx: { followers: 20, unflag: "clip-tiem" } },
          { id: "series", label: "Làm series 'Một ngày ở tiệm'", hint: "Tiệm hot lên, ca sau thêm 2 khách",
            say: "Tập 2: chủ tiệm nấu trân châu và nói chuyện với nồi.", fx: { buzz: 1, nextGuests: 2, unflag: "clip-tiem" } },
        ],
      },
    },
  },
  {
    id: "V12", group: "mang", tone: "mixed", when: "day", priority: 1, cooldown: 5,
    if: { minDay: 5 }, npc: { role: "reviewer", name: "Bé Ngân Food", self: "em", call: "chị" },
    nodes: {
      start: {
        mood: "happy", line: "Chị ơi trên mạng đang trend 'ô long kem sữa muối hồng' á, ai cũng đi săn. Tiệm có chưa?",
        choices: [
          { id: "trend", label: "Chạy theo trend (25k thử công thức)", hint: "−25k, tiệm hot lên, ca sau nhiều người gọi ô long kem sữa",
            say: "Có liền! Muối hồng, kem sữa, ô long, và một chút liều lĩnh.", fx: { money: -25, buzz: 1, demand: "o-long-kem-sua" } },
          { id: "classic", label: "Giữ bản sắc tiệm", hint: "+1 danh tiếng, +5 người theo dõi",
            say: "Trend đến rồi đi, trà sữa truyền thống thì ở lại như mối tình đầu.", fx: { rep: 1, followers: 5, demand: "tra-sua-truyen-thong" } },
        ],
      },
    },
  },
  {
    id: "V13", group: "mang", tone: "good", when: "day", priority: 1, cooldown: 5,
    if: { minDay: 4 }, npc: { role: "neighbor", name: "Chị Hai bán quần áo online", self: "chị", call: "em" },
    nodes: {
      start: {
        mood: "happy", line: "Tối nay chị live bán đồ, em ké một slot giới thiệu trà sữa hông? Khán giả chị toàn người khát.",
        choices: [
          { id: "slot", label: "Ké slot của chị Hai", hint: "Hên xui: mic tốt thì nổ follow",
            say: "Dạ em ké! Mặc áo chị bán, cầm ly em pha, combo đẹp người đẹp nết.",
            roll: { p: 0.5, win: { say: "Khán giả chốt áo xong hỏi luôn 'ly kia bao nhiêu'. Tiệm nổi theo áo!", fx: { followers: 50, nextGuests: 2 } },
              lose: { say: "Mic tắt nguyên đoạn em nói. Người ta chỉ thấy em cầm ly cười 3 phút.", fx: { followers: 8 } } } },
          { id: "own", label: "Tự live riêng", hint: "Chọn cách live ở bước sau",
            say: "Thôi em tự live, lỡ nổi thì nổi một mình cho dễ cảm ơn.", goto: "live", fx: {} },
        ],
      },
      live: {
        mood: "waiting", line: "Vậy ai cầm điện thoại cho em? Chị Hai bận chốt đơn rồi nha.",
        choices: [
          { id: "tripod", label: "Mua chân máy (15k)", hint: "−15k, +30 người theo dõi",
            say: "Chân máy 15k, đứng vững hơn cả lập trường ăn kiêng của khách.", fx: { money: -15, followers: 30 } },
          { id: "mom", label: "Nhờ mẹ cầm giùm", hint: "+15 người theo dõi, tiệm hot nhẹ",
            say: "Mẹ cầm máy, khung hình lệch nhưng tình thương thì thẳng tắp.", fx: { followers: 15, buzz: 0.5 } },
        ],
      },
    },
  },
  {
    id: "V14", group: "mang", tone: "mixed", when: "shift", priority: 1, cooldown: 5,
    if: { minDay: 4, minRep: 40 }, npc: { role: "vip", name: "Bé Bông Official", self: "em", call: "chị" },
    nodes: {
      start: {
        mood: "happy", line: "Chị ơi em có 80 nghìn follow á. Chị tặng em ba ly, em đăng story cho tiệm nổi liền.",
        choices: [
          { id: "deal", label: "Thương lượng", hint: "Nghe Bé Bông ra giá",
            say: "Ba ly hơi nhiều, mình nói chuyện như hai người kinh doanh nha em.", goto: "bargain", fx: {} },
          { id: "fair", label: "Mời giảm giá như mọi khách", hint: "+1 danh tiếng, +5 người theo dõi",
            say: "Ở tiệm ai cũng là KOL của ly mình, giảm giá chung, tiếng cạch miễn phí.", fx: { rep: 1, followers: 5 } },
        ],
      },
      bargain: {
        mood: "sheepish", line: "Vậy một ly thôi, nhưng chị cho em quay lúc đóng nắp nha.",
        choices: [
          { id: "gift", label: "Tặng một ly (tốn 1 ly + 1 hồng trà)", hint: "Hên xui: story nổ hay story chìm",
            say: "Một ly cho em, kèm lời dặn: quay rõ mặt cái nắp.", fx: { stock: { ly: -1, "hong-tra": -1 } },
            roll: { p: 0.5, win: { say: "Story lên xu hướng: 'tiệm có cái nắp kêu như vỗ tay'. Khách kéo tới!", fx: { stock: { ly: -1, "hong-tra": -1 }, followers: 80, buzz: 1 } },
              lose: { say: "Story 3 giây, ly bị che bởi filter tai thỏ. Ít ra tai thỏ cũng dễ thương.", fx: { stock: { ly: -1, "hong-tra": -1 }, followers: 3 } } } },
          { id: "pass", label: "Hẹn khi nào em mua thì quay", hint: "+3 XP, giữ giá trị tiệm",
            say: "Em mua một ly, chị cho quay nguyên quá trình, kể cả lúc chị lau quầy.", fx: { xp: 3 } },
        ],
      },
    },
  },
  {
    id: "V16", group: "mang", tone: "good", when: "day", priority: 1, cooldown: 6, once: true,
    if: { minDay: 3 }, npc: { role: "neighbor", name: "Chú Sáu làm bảng hiệu", self: "chú", call: "con" },
    nodes: {
      start: {
        mood: "sheepish", line: "Chú làm bảng xong rồi nè. Chú ghi 'Trà Sữ' thôi, chữ 'a' chú để dành làm logo.",
        choices: [
          { id: "keep", label: "Giữ nguyên bảng 'Trà Sữ'", hint: "+40 người theo dõi, tiệm hot (chuyện còn tiếp)",
            say: "Giữ nguyên chú ơi! Tiệm thiếu chữ 'a' nhưng không thiếu chữ 'tâm'.", fx: { followers: 40, buzz: 1, flag: "bang-sai" }, later: { id: "V17", days: 1 } },
          { id: "fix", label: "Nhờ chú sửa (15k)", hint: "−15k, +1 danh tiếng",
            say: "Chú thêm chữ 'a' giùm con, con bao chú ly trà sữa đủ chữ.", fx: { money: -15, rep: 1 } },
        ],
      },
    },
  },
  {
    id: "V17", group: "mang", tone: "good", when: "day", priority: 1, cooldown: 6,
    if: { chain: true, flags: ["bang-sai"] }, npc: { role: "regular", name: "Bé Tí", self: "em", call: "chị" },
    nodes: {
      start: {
        mood: "happy", line: "Chị ơi người ta xếp hàng chụp hình với bảng 'Trà Sữ' kìa. Có người hỏi mua áo in chữ đó luôn!",
        choices: [
          { id: "shirt", label: "In áo 'Trà Sữ – thiếu a đủ tâm'", hint: "+20k bán áo, +20 người theo dõi",
            say: "In liền! Áo thiếu chữ 'a' nhưng mặc vào đủ ấm.", fx: { money: 20, followers: 20, unflag: "bang-sai" } },
          { id: "board", label: "Treo bảng phụ 'đã có chữ a'", hint: "+1 danh tiếng, ca sau thêm 2 khách tò mò",
            say: "Bảng phụ ghi: 'Chữ a đã về, đang đi làm thủ tục'.", fx: { rep: 1, nextGuests: 2, unflag: "bang-sai" } },
        ],
      },
    },
  },
  {
    id: "M10", group: "mang", tone: "mixed", when: "day", priority: 1, cooldown: 6,
    if: { minDay: 4 }, npc: { role: "vip", name: "Chị Lụa chủ Trà Sữa Hẻm Bên", self: "chị", call: "em" },
    nodes: {
      start: {
        mood: "sheepish", line: "Chị mới ra món 'Trà sữa nắp kêu cạch'. Trùng ý tiệm em hả? Chị đâu biết… thiệt đó.",
        choices: [
          { id: "cheer", label: "Chúc mừng chị Lụa", hint: "+1 danh tiếng, +10 người theo dõi, hai tiệm thân nhau hơn",
            say: "Chúc mừng chị! Hẻm mình giờ có hai cái nắp, kêu thành dàn đồng ca.", fx: { rep: 1, followers: 10, flag: "hem-ben" }, later: { id: "M11", days: 2 } },
          { id: "new", label: "Ra món mới đáp lễ", hint: "Chọn món ở bước sau",
            say: "Vậy em ra món mới, hẻm mình cạnh tranh lành mạnh như hai đội bóng nhí.", goto: "menu", fx: {} },
        ],
      },
      menu: {
        mood: "waiting", line: "Món gì đây? Khách hai tiệm đang hóng như hóng chung kết.",
        choices: [
          { id: "create", label: "Sáng tạo món mới (30k)", hint: "−30k, tiệm hot, ca sau nhiều người gọi ô long kem sữa",
            say: "Món mới: 'Ô long kem sữa – không trùng ai hết'. Tên dài để khó copy.", fx: { money: -30, buzz: 1, demand: "o-long-kem-sua" } },
          { id: "roots", label: "Giữ món truyền thống, làm ngon hơn", hint: "+1 danh tiếng, ca sau thêm 1 khách",
            say: "Không cần món mới, chỉ cần ly cũ ngon hơn hôm qua.", fx: { rep: 1, nextGuests: 1, flag: "hem-ben" }, later: { id: "M11", days: 2 } },
        ],
      },
    },
  },
  {
    id: "M11", group: "mang", tone: "good", when: "day", priority: 1, cooldown: 6,
    if: { chain: true, flags: ["hem-ben"] }, npc: { role: "vip", name: "Chị Lụa chủ Trà Sữa Hẻm Bên", self: "chị", call: "em" },
    nodes: {
      start: {
        mood: "happy", line: "Em ơi chị nghĩ rồi: mình làm combo 'Hai tiệm một hẻm', mua bên chị tặng phiếu bên em, chịu hông?",
        choices: [
          { id: "collab", label: "Hợp tác combo", hint: "Ca sau thêm 3 khách, +30 người theo dõi",
            say: "Chịu! Hẻm mình từ nay là phố trà sữa, chỉ thiếu cái cổng chào.", fx: { nextGuests: 3, followers: 30, unflag: "hem-ben" } },
          { id: "solo", label: "Cảm ơn, mỗi tiệm một màu", hint: "+1 danh tiếng",
            say: "Mỗi tiệm một màu cho hẻm đủ cầu vồng. Em vẫn ghé chị uống ké.", fx: { rep: 1, unflag: "hem-ben" } },
        ],
      },
    },
  },
  // ===== Vận hành mở rộng =====
  {
    id: "O10", group: "van-hanh", tone: "mixed", when: "shift", priority: 1, cooldown: 4,
    if: { minDay: 3, queueFree: true, tMin: 110000 }, npc: { role: "office-worker", name: "Anh Duy trưởng nhóm", self: "anh", call: "em" },
    nodes: {
      start: {
        mood: "waiting", line: "Em ơi nhóm chat chốt 15 ly, 5 phút nữa tụi anh qua lấy. À mà mỗi người một mức đường.",
        choices: [
          { id: "three", label: "Nhận 3 ly trước", hint: "Đơn 3 ly (thưởng 10k nếu kịp), ca sau thêm 3 khách của nhóm",
            say: "Em nhận 3 ly trước, 12 người kia mai ghé, em pha sẵn mức đường theo từng tin nhắn.", fx: { group: { cups: 3, arch: "van-phong", tip: 10, same: false, name: "Anh Duy", line: "Ba ly cho nhóm anh nha, mỗi ly một mức đường như mỗi người một tính." }, nextGuests: 3 } },
          { id: "talk", label: "Thương lượng lại", hint: "Nghe nhóm chat phản hồi",
            say: "Anh ơi 15 ly trong 5 phút là phim hành động rồi, mình bàn lại xíu.", goto: "chat", fx: {} },
        ],
      },
      chat: {
        mood: "sheepish", line: "Nhóm chat nói: 'Vậy 2 ly cho sếp với kế toán trước, còn lại tự đi mua'. Ổn hông em?",
        choices: [
          { id: "two", label: "Nhận 2 ly cho sếp", hint: "Đơn 2 ly, thưởng 6k nếu kịp",
            say: "Hai ly cho sếp với kế toán, em làm cẩn thận như làm báo cáo cuối năm.", fx: { group: { cups: 2, arch: "van-phong", tip: 6, name: "Anh Duy" } } },
          { id: "tomorrow", label: "Mời cả nhóm đặt mai", hint: "+1 danh tiếng, ca sau thêm 4 khách",
            say: "Mai cả nhóm ghé, tiệm mở bàn riêng tên 'Phòng họp không cần họp'.", fx: { rep: 1, nextGuests: 4 } },
        ],
      },
    },
  },
  {
    id: "O11", group: "van-hanh", tone: "mixed", when: "shift", priority: 1, cooldown: 4,
    if: { minDay: 2, tMin: 25000 }, npc: { role: "courier", name: "Anh Tèo shipper", self: "em", call: "chị" },
    nodes: {
      start: {
        mood: "sheepish", line: "Chị ơi app báo khách hủy đơn, mà ly em cầm trên tay rồi. Giờ em uống hay em khóc?",
        choices: [
          { id: "give", label: "Tặng em ly đó luôn", hint: "+1 danh tiếng, +10 người theo dõi (Tèo kể cả nhóm shipper)",
            say: "Em uống đi, khóc thì để dành cho lúc kẹt xe.", fx: { rep: 1, followers: 10 } },
          { id: "resell", label: "Mời khách trong tiệm mua lại", hint: "Hên xui: có người mua thì được tiền",
            say: "Ai muốn ly trà sữa có câu chuyện buồn không? Giá hữu nghị!",
            roll: { p: 0.6, win: { say: "Một chị mua liền: 'ly có lịch sử, uống thấy sâu sắc'. Tiệm thu lại 20k.", fx: { money: 20 } },
              lose: { say: "Không ai mua, nhưng cả tiệm cười một trận. Tèo uống ly đó và tha thứ cho app.", fx: { rep: 1, xp: 2 } } } },
        ],
      },
    },
  },
  {
    id: "V15", group: "van-hanh", tone: "mixed", when: "shift", priority: 1, cooldown: 3,
    if: { minDay: 3 }, npc: { role: "neighbor", name: "Bà Tư bán xôi", self: "bà", call: "con" },
    nodes: {
      start: {
        mood: "surprised", line: "Mưa to quá con ơi! Cho bà đứng nhờ chút, mà khách ngoài kia chắc kẹt hết rồi.",
        choices: [
          { id: "shelter", label: "Mời bà và mọi người trú mưa", hint: "Tạm ngưng khách mới 15 giây, khách đang chờ thêm 15 giây, +1 danh tiếng",
            say: "Vô đây bà, tiệm nhỏ mà lòng rộng, mái che thì hơi dột một góc.", goto: "warm", fx: { delaySpawn: 15000, patience: 15000, rep: 1 } },
          { id: "post", label: "Đăng 'Mưa rồi, ghé tiệm trú'", hint: "Tạm ngưng khách mới 15 giây, +15 người theo dõi, ca sau thêm 1 khách",
            say: "Đăng: 'Trời mưa, tiệm có mái, có trà, có chỗ ngồi chờ người yêu tới đón'.", fx: { delaySpawn: 15000, followers: 15, nextGuests: 1 } },
        ],
      },
      warm: {
        mood: "happy", line: "Bà đứng nhờ mà áy náy quá. Hay bà đổi con gói xôi, con cho bà ly gì nóng nóng?",
        choices: [
          { id: "swap", label: "Đổi xôi lấy trà (tốn 1 hồng trà)", hint: "+1 danh tiếng, bà kể cả chợ (+10 theo dõi)",
            say: "Xôi của bà đổi trà của con, hẻm mình làm ăn theo kiểu tình làng nghĩa xóm.", fx: { stock: { "hong-tra": -1 }, rep: 1, followers: 10 } },
          { id: "free", label: "Không cần đổi đâu bà", hint: "+3 XP, bà hứa ghé mua (ca sau +1 khách)",
            say: "Bà cứ đứng tới tạnh, tiệm có mái che với một chủ tiệm biết nghe chuyện.", fx: { xp: 3, nextGuests: 1 } },
        ],
      },
    },
  },
  // ===== Đời thường =====
  {
    id: "D02", group: "doi", tone: "good", when: "shift", priority: 1, cooldown: 4,
    if: { minDay: 3, tMin: 30000 }, npc: { role: "neighbor", name: "Mẹ", self: "mẹ", call: "con" },
    nodes: {
      start: {
        mood: "happy", line: "Alo con, mẹ đang ở chợ. Con ăn gì chưa? Mẹ nghe tiếng nắp cạch là biết con đang bận rồi.",
        choices: [
          { id: "talk", label: "Nghe mẹ nói hết", hint: "Khách đang chờ mất 5 giây, +1 danh tiếng (khách nghe được, thấy thương)",
            say: "Dạ con ăn rồi mẹ, con ăn trân châu nấu dở… à không, con ăn cơm rồi.", fx: { patience: -5000, rep: 1 } },
          { id: "later", label: "Hẹn gọi lại sau ca", hint: "Mẹ sẽ ghé tiệm (chuyện còn tiếp)",
            say: "Mẹ ơi con đang có khách, tối con gọi lại kể mẹ nghe chuyện cái nắp.", fx: { xp: 2, flag: "me-ghe" }, later: { id: "D03", days: 1 } },
        ],
      },
    },
  },
  {
    id: "D03", group: "doi", tone: "good", when: "day", priority: 1, cooldown: 5,
    if: { chain: true, flags: ["me-ghe"] }, npc: { role: "neighbor", name: "Mẹ", self: "mẹ", call: "con" },
    nodes: {
      start: {
        mood: "happy", line: "Mẹ ghé nè! Mẹ đem cơm, mẹ đem trái cây, mẹ đem luôn ba bà bạn tới uống ủng hộ.",
        choices: [
          { id: "treat", label: "Pha mời mẹ một ly", hint: "Tốn 1 phần sữa, +1 danh tiếng",
            say: "Ly này con pha 50% đường, 100% hiếu thảo.", fx: { stock: { sua: -1 }, rep: 1, unflag: "me-ghe" } },
          { id: "brag", label: "Để mẹ khoe với các bà", hint: "+25 người theo dõi, ca sau thêm 2 khách là bạn của mẹ",
            say: "Mẹ khoe đi mẹ, khoe xong nhớ dặn các bà gọi đúng mức đường.", fx: { followers: 25, nextGuests: 2, unflag: "me-ghe" } },
        ],
      },
    },
  },
  {
    id: "D04", group: "doi", tone: "good", when: "day", priority: 1, cooldown: 6,
    if: { minDay: 6 }, npc: { role: "neighbor", name: "Cô Ba chủ nhà", self: "cô", call: "con" },
    nodes: {
      start: {
        mood: "waiting", line: "Cô không tăng tiền nhà đâu. Cô chỉ hỏi con có muốn tặng cô ly trà sữa mỗi sáng không thôi.",
        choices: [
          { id: "gift", label: "Tặng cô ly sáng nay", hint: "Tốn 1 ly + 1 hồng trà, +2 danh tiếng",
            say: "Dạ ly đầu ngày con dành cho cô, ít đường để cô sống lâu thu tiền nhà con.", fx: { stock: { ly: -1, "hong-tra": -1 }, rep: 2 } },
          { id: "chat", label: "Ngồi kể chuyện vui với cô", hint: "+3 XP, cô hứa giới thiệu khách",
            say: "Con kể cô nghe chuyện khách gọi ít ngọt mà ngọt, cô cười tới quên hỏi tiền điện.", goto: "promise", fx: { xp: 3 } },
        ],
      },
      promise: {
        mood: "happy", line: "Con kể chuyện có duyên ghê. Thôi cô dẫn hội dưỡng sinh tới uống nha.",
        choices: [
          { id: "yes", label: "Dạ mời cả hội", hint: "Ca sau thêm 3 khách quen",
            say: "Hội dưỡng sinh tới, tiệm pha 30% đường, nhạc nhẹ, ghế đủ cho cả hội.", fx: { nextGuests: 3 } },
          { id: "slow", label: "Mời từ từ từng người", hint: "+1 danh tiếng, ca sau thêm 1 khách",
            say: "Mỗi ngày một cô thôi cô ơi, tiệm còn tập đếm ly.", fx: { rep: 1, nextGuests: 1 } },
        ],
      },
    },
  },
  {
    id: "D05", group: "doi", tone: "good", when: "day", priority: 1, cooldown: 5,
    if: { minDay: 3, sum: { starsMin: 4, cupsMin: 3 } }, npc: { role: "regular", name: "Bé Tí", self: "em", call: "chị" },
    nodes: {
      start: {
        mood: "happy", line: "Em viết thư tay cảm ơn tiệm nè. Em dán lên tủ lạnh nhà em rồi chụp gửi chị luôn.",
        choices: [
          { id: "wall", label: "Dán thư lên quầy", hint: "+1 danh tiếng, +10 người theo dõi",
            say: "Thư này dán ngay quầy, ai đọc cũng biết tiệm có fan nhí siêu dễ thương.", fx: { rep: 1, followers: 10 } },
          { id: "reply", label: "Viết thư trả lời", hint: "+5 XP, bé dẫn bạn tới (ca sau +1 khách)",
            say: "Chị viết lại: 'Cảm ơn em, ly sau chị thêm trân châu bằng tình cảm'.", fx: { xp: 5, nextGuests: 1 } },
        ],
      },
    },
  },
  // ===== Lỗi lên mạng (lỗi pha của chính người chơi bị quay lại) =====
  {
    id: "V20", group: "mang", tone: "mixed", when: "shift", priority: 3, cooldown: 3,
    if: { minDay: 2, lastServe: { mistake: "noLid", maxStars: 3 } }, who: "lastServed",
    nodes: {
      start: {
        mood: "sheepish", line: "{Call} ơi {self} lỡ quay cảnh ly không nắp rồi. Bạn {self} comment: 'tiệm ra mắt ly mui trần hả'.",
        me: "Dạ… cái nắp hôm nay xin nghỉ phép.",
        choices: [
          { id: "trend", label: "Nhận luôn: 'ly mui trần' phiên bản giới hạn", hint: "Hên xui: lên trend hoặc bị chọc nhẹ",
            say: "Ly mui trần phiên bản giới hạn, chỉ dành cho người dám đi bộ chậm.", later: { id: "V24", days: 1 },
            roll: { p: 0.6, win: { say: "Comment nổ: 'mui trần mà mát lòng'. Tiệm có thêm một trend.", fx: { followers: 40, buzz: 1, flag: "loi-viral" } },
              lose: { say: "Người ta chọc 'tiệm quên nắp' cả buổi, nhưng ai cũng cười.", fx: { followers: 10, flag: "loi-viral" } } } },
          { id: "remake", label: "Tặng ly mới có nắp", hint: "Tốn 1 ly, +2 danh tiếng",
            say: "Ly mới đây, nắp kêu cạch hai lần cho chắc ăn.", fx: { stock: { ly: -1 }, rep: 2 } },
          { id: "sorry", label: "Xin lỗi, đóng nắp liền", hint: "+1 danh tiếng",
            say: "Tiệm xin lỗi nha, cái nắp đây, nó đến trễ nhưng có tâm.", fx: { rep: 1 } },
        ],
      },
    },
  },
  {
    id: "V21", group: "mang", tone: "good", when: "shift", priority: 3, cooldown: 3,
    if: { minDay: 2, lastServe: { mistake: ["sugar", "ice"], maxStars: 3 } }, who: "lastServed",
    nodes: {
      start: {
        mood: "happy", line: "{Self} gọi {sugar} đường mà ly này ít ngọt mà ngọt. {Self} quay lại rồi, câu này chắc thành trend đó {call}.",
        choices: [
          { id: "trend", label: "Biến thành mức đường mới", hint: "Đặt tên cho mức đường 'ít ngọt mà ngọt'", goto: "name",
            say: "Từ hôm nay menu có thêm mức đường: ít ngọt mà ngọt.", fx: {} },
          { id: "sorry", label: "Xin lỗi, chỉnh lại đúng mức", hint: "+1 danh tiếng, khách nhớ tiệm có tâm",
            say: "Tiệm chỉnh lại đúng {sugar} liền, ly sau đo bằng cả cái cân.", fx: { rep: 1, flag: "c02-explained" } },
        ],
      },
      name: {
        mood: "happy", line: "Hay quá! Vậy mức đường này tên chính thức là gì {call}?",
        choices: [
          { id: "official", label: "'Ít ngọt mà ngọt' — giữ nguyên câu gốc", hint: "+30 người theo dõi, tiệm hot lên, ca sau nhiều người gọi món này",
            say: "Tên chính thức: ít ngọt mà ngọt. Bản quyền thuộc về {self}.", fx: { followers: 30, buzz: 1, demand: "who" } },
          { id: "poetic", label: "'Ngọt vừa đủ thương'", hint: "+15 người theo dõi, +1 danh tiếng",
            say: "Mức đường mới: ngọt vừa đủ thương, không đủ để say nắng.", fx: { followers: 15, rep: 1 } },
        ],
      },
    },
  },
  {
    id: "V22", group: "mang", tone: "mixed", when: "shift", priority: 3, cooldown: 3,
    if: { minDay: 3, lastServe: { mistake: ["wrongDrink", "wrongCustomer", "topping", "slow"], maxStars: 3 } },
    npc: { role: "reviewer", name: "Mi Review", self: "mình", call: "chị chủ" },
    nodes: {
      start: {
        mood: "happy", line: "Chị chủ ơi, mình vừa quay được cảnh tiệm luống cuống với ly của bạn kia. Khán giả đang hỏi: tiệm có muốn nói gì không?",
        choices: [
          { id: "mystery", label: "Biến thành 'món bí ẩn của ngày'", hint: "Hên xui: lên trend hoặc mất 1 danh tiếng",
            say: "Mỗi ngày tiệm có một món bí ẩn, hôm nay bí ẩn tới mức tiệm cũng bất ngờ.", later: { id: "V24", days: 1 },
            roll: { p: 0.5, win: { say: "Khán giả mê ý tưởng, ai cũng muốn thử món bí ẩn.", fx: { followers: 45, buzz: 1, flag: "loi-viral" } },
              lose: { say: "Có người bảo 'bí ẩn là sai món đó', nhưng clip vẫn nhiều view.", fx: { rep: -1, followers: 15, flag: "loi-viral" } } } },
          { id: "public", label: "Xin lỗi công khai trên clip", hint: "+1 danh tiếng, review 4 sao trên mạng",
            say: "Tiệm nhầm thật, tiệm sửa liền, cảm ơn khán giả đã chứng kiến tiệm lớn lên.",
            fx: { rep: 1, review: { stars: 4, name: "Mi Review", line: "Tiệm nhầm nhưng nhận lỗi rất đẹp, xứng đáng thêm cơ hội. #nhậnlỗiđẹp" } } },
          { id: "treat", label: "Mời bạn reviewer một ly", hint: "Tốn 8k, +20 người theo dõi",
            say: "Ly này tiệm mời, pha đúng từng bước, có quay cả tiếng cạch.", fx: { money: -8, followers: 20 } },
        ],
      },
    },
  },
  {
    id: "V23", group: "mang", tone: "good", when: "shift", priority: 3, cooldown: 3,
    if: { minDay: 3, lastServe: { mistake: "swapped", maxStars: 3 } }, who: "lastServed",
    nodes: {
      start: {
        mood: "happy", line: "Nhóm {self} quay cảnh tráo ly rồi {call}. Cả nhóm chat đang cá cược ly nào của ai.",
        choices: [
          { id: "game", label: "Làm game 'Đoán ly của ai'", hint: "Chọn cách tổ chức game", goto: "rule",
            say: "Tiệm chính thức ra mắt game: đoán ly của ai, đoán đúng có thưởng.", fx: {} },
          { id: "sorry", label: "Xin lỗi, ghi tên to hơn", hint: "+1 danh tiếng, hẹn nhóm quay lại",
            say: "Lần sau tiệm ghi tên to như bảng hiệu, không tráo được nữa.", fx: { rep: 1, flag: "loi-viral" }, later: { id: "V24", days: 1 } },
        ],
      },
      rule: {
        mood: "happy", line: "Game vui đó! Mà đoán đúng thì được gì {call}?",
        choices: [
          { id: "free", label: "Được tiếng cạch miễn phí", hint: "Tiệm hot nhẹ, ca sau thêm 2 khách",
            say: "Đoán đúng được tiệm đóng nắp tặng một tiếng cạch thật kêu.", fx: { buzz: 0.5, nextGuests: 2, flag: "loi-viral" }, later: { id: "V24", days: 1 } },
          { id: "prize", label: "Giảm 10k cho người đoán đúng", hint: "Tốn 10k, +30 người theo dõi",
            say: "Ai đoán đúng ly của ai, tiệm giảm 10k. Cả nhóm chat lao vào đoán.", fx: { money: -10, followers: 30, flag: "loi-viral" } },
        ],
      },
    },
  },
  {
    id: "V24", group: "mang", tone: "good", when: "day", priority: 2, cooldown: 4,
    if: { chain: true, flags: ["loi-viral"] }, npc: { role: "reviewer", name: "Hội Review Ăn Uống Khu Phố", self: "tụi mình", call: "tiệm" },
    nodes: {
      start: {
        mood: "happy", line: "Clip lỗi hôm qua của tiệm lên 20 nghìn view. Comment top: 'tiệm sai mà sai có duyên'. Tiệm định làm gì tiếp?",
        choices: [
          { id: "series", label: "Làm series 'Lỗi của tuần'", hint: "Tiệm hot lên, +30 người theo dõi, ca sau thêm 2 khách",
            say: "Series mới: mỗi tuần một lỗi, mỗi lỗi một bài học, mỗi bài học một ly ngon hơn.", fx: { buzz: 1, followers: 30, nextGuests: 2, unflag: "loi-viral" } },
          { id: "promise", label: "Đăng bài cảm ơn và cam kết sửa", hint: "+2 danh tiếng",
            say: "Cảm ơn mọi người đã cười cùng tiệm. Tiệm hứa từ nay đúng nắp, đúng đường, đúng tên.", fx: { rep: 2, unflag: "loi-viral" } },
        ],
      },
    },
  },
  ...EVENTS_M3,
  ...EVENTS_REPLY,
  ...EVENTS_STOCKOUT,
];

export const EVENT = Object.fromEntries(EVENTS.map((e) => [e.id, e]));
