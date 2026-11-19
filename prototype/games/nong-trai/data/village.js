// Làng & nhiệm vụ (DESIGN-2.0 §1 khu 7, §3, §5 — Milestone 4). Thuần dữ liệu — luật ở core/village.js.
//
// ĐỊNH DẠNG NHIỆM VỤ (mở rộng tương thích với data/quests.js của M1):
//   { id, title, hint, reward: { coins?, xp?, items?: {id: n}, decor?: {id: n} }, count, ...điều kiện }
//   Điều kiện (một trong các dạng):
//   • Đếm sự kiện (như M1):   event: "<type>" | ["<type>", ...]
//       match?:   { field: value | [values] }   — sự kiện phải có e[field] khớp (vd. { item: "trung-ga" })
//       hasItem?: [id, ...]                      — e.items (object {id: n}) chứa ít nhất 1 id trong danh sách
//       amount?:  "<field>"                      — cộng e[field] (số nguyên > 0) thay vì +1 (vd. "qty", "count")
//   • Trạng thái (như `level` của M1): level: n (đạt cấp n) · building: "<id>" (công trình đã xây xong)
//   • Trao tay:  give: { id: n }  — kiểm + trừ khỏi kho LÚC bấm nhận (không đếm sự kiện)
//   • Chuỗi bước trong 1 nhiệm vụ: steps: [{ event, match?, hasItem? }, ...] — phải xảy ra đúng thứ tự; count = steps.length
//   minLevel: cấp người chơi cần để nhiệm vụ BẮT ĐẦU đếm (khác `level` của M1 = điều kiện hoàn thành).
//
// SỰ KIỆN được đếm (xem core/README-M4.md): planted · watered · harvested{crop} · sold{count, items} ·
//   delivered{orderType, npc, items} · jobCollected{machine, recipe, item, qty} · animalBought{kind} ·
//   animalFed{kind} · animalCollected{kind, item, qty} · npcTalked{npc}.

export const VILLAGE_LEVEL = 6;   // §3 cấp 6: Làng mở (4 NPC)
export const CHAIN_LEVEL = 14;    // §3 cấp 14: nhiệm vụ chuỗi của NPC
export const BOARD_SIZE = 3;      // §5: bảng 3 nhiệm vụ lặp lại

/** Món của Lò bánh (dùng cho điều kiện "đơn có bánh"). */
export const BAKERY_GOODS = ["bap-rang", "banh-trung", "banh-bi-ngo", "banh-flan"];

// ---------- Thân thiết ----------
export const FRIEND_LEVELS = [
  { min: 0, name: "Mới quen" },
  { min: 10, name: "Quen biết" },
  { min: 30, name: "Thân quen" },
  { min: 60, name: "Thân thiết" },
];
export const FRIEND_POINTS = { talk: 1, deliver: 2, chainStep: 5 };
/** Trò chuyện chỉ cộng điểm 1 lần mỗi 4 giờ / NPC (vẫn trò chuyện được, chỉ không cộng). */
export const TALK_COOLDOWN_MS = 4 * 3600_000;
export const FRIEND_MAX = 999;

// ---------- 4 NPC ----------
// house: frame trong assets/v3/village.webp (sheets.village). sheet/idle/wave/portrait: assets/v3/npc*.webp.
// lines: câu thoại ngắn (xoay vòng theo số lần trò chuyện). chain: câu chuyện 3 bước từ cấp 14.
export const VILLAGERS = [
  {
    id: "chi-ba", name: "Chị Ba Lúa", role: "Quản lý nông trại",
    house: "nha-chi-ba", sheet: "npc", idle: ["chi-ba-idle-1", "chi-ba-idle-2"], wave: "chi-ba-vay-tay", portrait: "chi-ba-chan-dung",
    lines: [
      "Sáng nay sương xuống dày, ruộng mình uống no nước rồi đó em!",
      "Gà đẻ trứng thì nhớ nhặt sớm, để lâu tụi nó ấp mất công lắm.",
      "Có gì chưa rành cứ hỏi chị, chị ở góc ruộng cả ngày mà.",
      "Lúa trổ bông đều thì cả làng cùng vui. Cố lên nha!",
      "Nghỉ tay uống miếng nước đã, việc đồng áng đâu có chạy mất.",
    ],
    chain: {
      title: "Mùa lúa chín",
      intro: "Năm nay chị muốn làm một mâm cơm mới thật tươm tất mời cả làng. Em phụ chị một tay nha?",
      steps: [
        { id: "ba-1", title: "Gặt 15 bó lúa", hint: "Trồng lúa ở ruộng rồi thu hoạch 15 lần.",
          event: "harvested", match: { crop: "lua" }, count: 15, reward: { coins: 100, xp: 25 } },
        { id: "ba-2", title: "Xay 3 bao bột gạo", hint: "Dùng Cối xay làm Bột gạo, nhận 3 bao.",
          event: "jobCollected", match: { item: "bot-gao" }, amount: "qty", count: 3, reward: { coins: 120, xp: 30, items: { "hop-dinh": 2 } } },
        { id: "ba-3", title: "Gửi chị gạo nấu cơm mới", hint: "Mang cho Chị Ba 2 bột gạo và 6 bó lúa.",
          give: { "bot-gao": 2, lua: 6 }, count: 1, reward: { coins: 250, xp: 50, decor: { "bu-nhin": 1 } } },
      ],
    },
  },
  {
    id: "co-hai", name: "Cô Hai Hạt Giống", role: "Chủ chợ",
    house: "nha-co-hai", sheet: "npc", idle: ["co-hai-idle-1", "co-hai-idle-2"], wave: "co-hai-vay-tay", portrait: "co-hai-chan-dung",
    lines: [
      "Trời hửng nắng vầy là hạt nảy mầm nhanh lắm nghen con.",
      "Chiều nay chắc có mưa rào, con khỏi tưới cũng được đó.",
      "Hạt giống cô lựa từng hạt, gieo xuống là lên xanh mướt.",
      "Giá chợ hôm nay lên xuống chút xíu, canh lúc giá lên mà bán.",
      "Hồi xưa cô gánh rau ra chợ từ lúc gà chưa gáy đó con.",
    ],
    chain: {
      title: "Chợ phiên đầu mùa",
      intro: "Sắp tới phiên chợ đầu mùa, cô muốn sạp mình đầy ắp hàng. Con giúp cô chuẩn bị nghen?",
      steps: [
        { id: "hai-1", title: "Gieo 12 hạt giống", hint: "Gieo bất kỳ hạt nào xuống ruộng 12 lần.",
          event: "planted", count: 12, reward: { coins: 80, xp: 20 } },
        { id: "hai-2", title: "Bán 25 món ở chợ", hint: "Bán nông sản hoặc thành phẩm ở Khu chợ.",
          event: "sold", amount: "count", count: 25, reward: { coins: 120, xp: 30, items: { "thung-son": 1 } } },
        { id: "hai-3", title: "Giao 3 đơn của Cô Hai", hint: "Giao 3 phiếu đơn có chân dung Cô Hai trên Bảng đơn.",
          event: "delivered", match: { npc: "co-hai" }, count: 3, reward: { coins: 250, xp: 50, decor: { "gieng-da": 1 } } },
      ],
    },
  },
  {
    id: "bac-tu", name: "Bác Tư Lò Bánh", role: "Thợ làm bánh",
    house: "tiem-banh-bac-tu", sheet: "npc-2", idle: ["bac-tu-idle-1", "bac-tu-idle-2"], wave: "bac-tu-vay-tay", portrait: "bac-tu-chan-dung",
    lines: [
      "Bột phải nhồi cho kỹ, bánh mới xốp. Làm ẩu là bác biết liền.",
      "Hừm, trứng hôm nay tròn trịa đó. Được.",
      "Lò bánh nóng từ sáng sớm, ai đi ngang cũng ghé hít mùi thơm.",
      "Bác khó tính vậy chứ ai làm tốt là bác thưởng không tiếc.",
      "Bánh ngon là nhờ nguyên liệu tươi. Nhớ chăm gà cho tốt.",
    ],
    chain: {
      title: "Mẻ bánh hội làng",
      intro: "Hội làng năm nay bác nhận làm bánh. Cháu có tay nghề, phụ bác vài mẻ coi được không?",
      steps: [
        { id: "tu-1", title: "Mang 3 bánh trứng cho Bác Tư", hint: "Nướng bánh trứng ở Lò bánh rồi mang tới tiệm bánh.",
          give: { "banh-trung": 3 }, count: 1, reward: { coins: 150, xp: 30 } },
        { id: "tu-2", title: "Nướng một mẻ bánh bí ngô", hint: "Lò bánh: 1 bí ngô + 1 bột gạo + 1 trứng. Nhận 1 bánh.",
          event: "jobCollected", match: { item: "banh-bi-ngo" }, count: 1, reward: { coins: 120, xp: 30, items: { "van-go": 2 } } },
        { id: "tu-3", title: "Giao 1 đơn kết hợp có bánh", hint: "Giao một đơn kết hợp có ít nhất 1 món của Lò bánh.",
          event: "delivered", match: { orderType: "ket-hop" }, hasItem: BAKERY_GOODS, count: 1,
          reward: { coins: 300, xp: 60, decor: { "den-long": 1 } } },
      ],
    },
  },
  {
    id: "anh-ut", name: "Anh Út Xe Tải", role: "Giao hàng",
    house: "kho-xe-anh-ut", sheet: "npc-2", idle: ["anh-ut-idle-1", "anh-ut-idle-2"], wave: "anh-ut-vay-tay", portrait: "anh-ut-chan-dung",
    lines: [
      "Bíp bíp! Hàng của bạn lên xe là tới nơi trong một nốt nhạc.",
      "Hôm qua xe anh suýt sa lầy, may có trâu nhà bên kéo giùm.",
      "Đường làng đẹp nhất lúc chiều, lúa vàng hai bên luôn.",
      "Có đơn gấp thì cứ gọi anh, anh chạy liền!",
      "Xe cũ mà chạy bền lắm nghen, anh lau nó mỗi sáng đó.",
    ],
    chain: {
      title: "Chuyến xe sữa sớm",
      intro: "Trên thị trấn có tiệm cà phê đặt sữa tươi mỗi sáng. Mình hợp tác làm mối này nghe?",
      steps: [
        { id: "ut-1", title: "Vắt 6 xô sữa", hint: "Cho bò ăn rồi thu sữa 6 lần.",
          event: "animalCollected", match: { item: "sua" }, amount: "qty", count: 6, reward: { coins: 120, xp: 30 } },
        { id: "ut-2", title: "Giao 1 đơn đặc biệt", hint: "Đơn đặc biệt (viền vàng) có hạn 2 giờ trên Bảng đơn.",
          event: "delivered", match: { orderType: "dac-biet" }, count: 1, reward: { coins: 200, xp: 40, items: { "van-go": 2, "hop-dinh": 1 } } },
        { id: "ut-3", title: "Chất hàng chuyến đầu", hint: "Mang cho Anh Út 4 sữa và 2 bánh trứng.",
          give: { sua: 4, "banh-trung": 2 }, count: 1, reward: { coins: 300, xp: 60, decor: { "cong-tre": 1 } } },
      ],
    },
  },
];
export const VILLAGER = Object.freeze(Object.assign(Object.create(null), Object.fromEntries(VILLAGERS.map((v) => [v.id, v]))));

// ---------- Nhiệm vụ tiến trình M4 (§5) — tuần tự, giao bởi Chị Ba ----------
export const PROGRESSION_GIVER = "chi-ba";
export const PROGRESSION = [
  { id: "xay-chuong-ga", title: "Xây chuồng gà", hint: "Bấm nút Xây (cái búa) và chọn Chuồng gà.",
    minLevel: 7, building: "chuong-ga", count: 1, reward: { coins: 40, xp: 10 } },
  { id: "mua-ga-dau", title: "Mua con gà đầu tiên", hint: "Vào chuồng gà, bấm “Mua gà” (60 xu).",
    minLevel: 7, event: "animalBought", match: { kind: "ga" }, count: 1, reward: { coins: 20, xp: 8, items: { "thuc-an-gia-suc": 2 } } },
  { id: "thu-trung-dau", title: "Thu quả trứng đầu tiên", hint: "Cho gà ăn 1 bao thức ăn, 4 phút sau chạm bong bóng trứng.",
    minLevel: 7, event: "animalCollected", match: { item: "trung-ga" }, count: 1, reward: { coins: 30, xp: 8 } },
  { id: "giao-don-trung-sua", title: "Giao đơn có trứng hoặc sữa", hint: "Giao một đơn trên Bảng đơn có trứng gà hoặc sữa.",
    minLevel: 7, event: "delivered", hasItem: ["trung-ga", "sua"], count: 1, reward: { coins: 50, xp: 12 } },
  { id: "lam-banh-trung", title: "Nướng bánh trứng", hint: "Lò bánh: 2 trứng + 1 bột gạo, 4 phút.",
    minLevel: 8, event: "jobCollected", match: { item: "banh-trung" }, count: 1, reward: { coins: 60, xp: 15 } },
  { id: "xay-chuong-bo", title: "Xây chuồng bò", hint: "Bấm nút Xây và chọn Chuồng bò (từ cấp 9).",
    minLevel: 9, building: "chuong-bo", count: 1, reward: { coins: 80, xp: 20, items: { "van-go": 1 } } },
];

// ---------- Bảng nhiệm vụ lặp lại (§5) — 3 ô, làm mới khi nhận thưởng ----------
// Thưởng vừa phải (không thay thế đơn hàng): ~ giá trị 1 đơn thường cùng cấp.
export const REPEATABLE = [
  { id: "giao-3-don", title: "Giao 3 đơn", hint: "Giao bất kỳ 3 đơn nào trên Bảng đơn.",
    minLevel: 6, event: "delivered", count: 3, reward: { coins: 60, xp: 15 } },
  { id: "thu-20-nong-san", title: "Thu 20 nông sản", hint: "Thu hoạch 20 lần ở ruộng.",
    minLevel: 6, event: "harvested", count: 20, reward: { coins: 40, xp: 10 } },
  { id: "che-bien-5", title: "Chế biến 5 món", hint: "Nhận 5 mẻ hàng từ các máy trong Xưởng.",
    minLevel: 6, event: "jobCollected", count: 5, reward: { coins: 60, xp: 15 } },
  { id: "ban-15-mon", title: "Bán 15 món ở chợ", hint: "Bán ở Khu chợ, lúc giá ↑ là lời nhất.",
    minLevel: 6, event: "sold", amount: "count", count: 15, reward: { coins: 35, xp: 8 } },
  { id: "thu-4-trung", title: "Nhặt 4 quả trứng", hint: "Cho gà ăn rồi thu trứng.",
    minLevel: 7, event: "animalCollected", match: { item: "trung-ga" }, amount: "qty", count: 4, reward: { coins: 45, xp: 12 } },
  { id: "chuoi-ngo-trung-banh", title: "Hoàn thành 1 chuỗi Ngô→Trứng→Bánh", hint: "Thu ngô → xay thức ăn → thu trứng → nướng bánh trứng, theo đúng thứ tự.",
    minLevel: 8, steps: [
      { event: "harvested", match: { crop: "ngo" } },
      { event: "jobCollected", match: { item: "thuc-an-gia-suc" } },
      { event: "animalCollected", match: { item: "trung-ga" } },
      { event: "jobCollected", match: { item: "banh-trung" } },
    ], count: 4, reward: { coins: 120, xp: 30, items: { "van-go": 1 } } },
];
export const REPEATABLE_BY_ID = Object.freeze(Object.assign(Object.create(null), Object.fromEntries(REPEATABLE.map((q) => [q.id, q]))));

// ---------- Xe giao hàng của Anh Út (§1 khu 4, §3 cấp 11) ----------
// Sau mỗi lần giao đơn (từ cấp 11): xe chạy vào cổng → chất hàng → chạy đi. Chỉ để vẽ — không ảnh hưởng luật.
export const TRUCK = {
  level: 11, arriveMs: 1_400, loadMs: 1_600, leaveMs: 1_400,
  sprite: { sheet: "buildings", frame: "xe-giao-hang" },
  driver: { sheet: "npc-2", idle: ["anh-ut-idle-1", "anh-ut-idle-2"], wave: "anh-ut-vay-tay" },
  fx: { sheet: "fx", load: ["giao-don-1", "giao-don-2", "giao-don-3", "giao-don-4"] },
};
