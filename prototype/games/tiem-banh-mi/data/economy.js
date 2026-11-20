// Bảng số liệu Tiệm Bánh Mì (docs/tiem-banh-mi/ECONOMY.md). Đơn vị tiền: k (1.000 đồng ảo), luôn là số nguyên trong trạng thái.
// Giá lẻ dưới 1k (than 0,4k/lần, gas 2k/mẻ) trả trước khi mua cả bao / cả bình ⇒ tiền trong trạng thái không bao giờ lẻ.

/** Nguyên liệu. cost = giá vốn một phần (k, dùng cho báo cáo lời lỗ). pack = gói Bà Tư [số phần, giá k]. kho = có tính sức chứa.
 *  icon = frame trong ingredients.webp (asset-spec). unlock = cấp mở. */
export const STOCK = {
  phoi: { name: "Phôi bánh", cost: 2, pack: [12, 24], kho: true, icon: "phoi", unlock: 1 },
  "banh-si": { name: "Bánh sỉ", cost: 3, pack: [10, 30], kho: true, icon: "banh-si", unlock: 9 },
  "phoi-que": { name: "Phôi bánh mì que", cost: 0.6, pack: [20, 12], kho: true, icon: "phoi-que", unlock: 12 },
  pate: { name: "Pate", cost: 2, pack: [10, 20], kho: true, icon: "pate", unlock: 1 },
  bo: { name: "Bơ", cost: 1, pack: [10, 10], kho: true, icon: "bo", unlock: 1 },
  mayo: { name: "Mayo", cost: 1, pack: [10, 10], kho: true, icon: "mayo", unlock: 1 },
  "cha-lua": { name: "Chả lụa", cost: 4, pack: [8, 32], kho: true, icon: "cha-lua", unlock: 1 },
  "thit-nguoi": { name: "Thịt nguội", cost: 5, pack: [8, 40], kho: true, icon: "thit-nguoi", unlock: 4 },
  "xiu-mai": { name: "Xíu mại", cost: 5, pack: [10, 50], kho: true, icon: "xiu-mai", unlock: 3 },
  trung: { name: "Trứng", cost: 3, pack: [10, 30], kho: true, icon: "trung", unlock: 2 },
  "thit-nuong": { name: "Thịt nướng", cost: 6, pack: [10, 60], kho: true, icon: "thit-nuong", unlock: 5 },
  "heo-quay": { name: "Heo quay", cost: 7, pack: [8, 56], kho: true, icon: "heo-quay", unlock: 10 },
  "ga-xe": { name: "Gà xé", cost: 5, pack: [8, 40], kho: true, icon: "ga-xe", unlock: 8 },
  "cha-chay": { name: "Chả chay", cost: 3, pack: [8, 24], kho: true, icon: "cha-chay", unlock: 6 },
  "cha-bong": { name: "Chà bông", cost: 2, pack: [10, 20], kho: true, icon: "cha-bong", unlock: 4 },
  "do-chua": { name: "Đồ chua", cost: 1, pack: [15, 15], kho: false, icon: "do-chua", unlock: 1 },
  "dua-leo": { name: "Dưa leo", cost: 1, pack: [15, 15], kho: false, icon: "dua-leo", unlock: 1 },
  rau: { name: "Rau thơm", cost: 1, pack: [15, 15], kho: false, icon: "rau-mui", unlock: 1 },
  "gia-vi": { name: "Gia vị", cost: 1, pack: [30, 30], kho: false, icon: "ot", unlock: 1 },
  "giay-goi": { name: "Giấy gói", cost: 1, pack: [30, 30], kho: false, icon: "giay-goi", unlock: 1 },
  tui: { name: "Túi", cost: 1, pack: [30, 30], kho: false, icon: "tui", unlock: 1 },
  than: { name: "Than", cost: 0.4, pack: [20, 8], kho: false, icon: "than", unlock: 1 },
  gas: { name: "Gas", cost: 2, pack: [30, 60], kho: false, icon: "gas", unlock: 1 },
};
export const STOCK_IDS = Object.keys(STOCK);
/** Ghi chú M2: đồ chua / dưa leo / rau (để trong hũ, rổ trên quầy) không tính sức chứa, nếu không gói học đầu game (85 phần) đã vượt kho 60.
 *  Bộ mô phỏng M5 dò lại (docs/tiem-banh-mi/DEV-NOTES.md). */
/** M5 (bộ mô phỏng): kho 60 đầy chà bông / thịt nguội từ cấp 4 (gói 8–10 phần cho mỗi nhân) ⇒ phôi không vào được, ngày nào cũng hết bánh. Nới 60 → 90 / 100 → 140 / 150 → 200. */
export const CAPACITY = { cart: 90, shop: 140, fridge: 200 };
export const EXPRESS_MARKUP = 0.15;

/** Vốn đầu + gói học (ECONOMY §5): đủ ~12 ổ. */
export const START_MONEY = 120;
export const START_STOCK = { phoi: 12, pate: 10, bo: 10, "cha-lua": 8, "do-chua": 15, "dua-leo": 15, rau: 15, "gia-vi": 30, "giay-goi": 30, tui: 10, than: 20, gas: 30 };

/** Phết và nhân. lvl: 0 không · 1 ít · 2 vừa · 3 nhiều. Phần dùng theo nấc (nhiều pate = 2 phần, khách không trả thêm). */
export const LEVEL_NAMES = ["không", "ít", "vừa", "nhiều"];
export const LEVEL_USE = [0, 1, 1, 2];
export const SPREADS = ["pate", "bo", "mayo"];
export const FILLINGS = ["cha-lua", "thit-nguoi", "xiu-mai", "trung", "thit-nuong", "heo-quay", "ga-xe", "cha-chay", "cha-bong"];
/** Rau dưa: id lớp ổ bánh → kho. Rau mùi và hành lá hai bước riêng, dùng chung một phần rau. */
export const VEG = { "do-chua": "do-chua", "dua-leo": "dua-leo", "rau-mui": "rau", "hanh-la": "rau" };
export const VEG_IDS = Object.keys(VEG);
export const SAUCES = ["nuoc-tuong", "tuong-ot"];
/** Gói: giấy, giấy cắt đôi, giấy + túi. */
export const WRAPS = { giay: { name: "Gói giấy", layer: "wrap-paper" }, "cat-doi": { name: "Cắt đôi + gói", layer: "wrap-paper-half" }, tui: { name: "Gói + bỏ túi", layer: "wrap-bag" } };
export const NAMES = {
  pate: "Pate", bo: "Bơ", mayo: "Mayo", "cha-lua": "Chả lụa", "thit-nguoi": "Thịt nguội", "xiu-mai": "Xíu mại", trung: "Trứng ốp la",
  "thit-nuong": "Thịt nướng", "heo-quay": "Heo quay", "ga-xe": "Gà xé", "cha-chay": "Chả chay", "cha-bong": "Chà bông",
  "do-chua": "Đồ chua", "dua-leo": "Dưa leo", "rau-mui": "Rau mùi", "hanh-la": "Hành lá", ot: "Ớt", "nuoc-tuong": "Nước tương", "tuong-ot": "Tương ớt",
};

/** Công thức (ECONOMY §2). Mọi ổ ráp có phần nền: phôi + đồ chua + dưa leo + rau + gia vị + giấy = 7k.
 *  M5 (bộ mô phỏng): giá bán ×1,25 (16 → 20k…) — người chơi trung bình ráp ~13 giây một ổ nên lời vận hành chỉ 20–60k ở cấp 7 (mục tiêu 160–200k). */
export const BASE_COST = 7;
const baseVeg = { "do-chua": true, "dua-leo": true, "rau-mui": true, "hanh-la": true };
export const RECIPES = [
  { id: "pate-bo", name: "Bánh mì pate bơ", level: 1, price: 20, xp: 6, spreads: { pate: 2, bo: 2 }, fills: [], cost: 10 },
  { id: "cha-lua", name: "Bánh mì chả lụa", level: 1, price: 27, xp: 7, spreads: { pate: 2, bo: 2 }, fills: ["cha-lua"], cost: 14 },
  { id: "trung", name: "Bánh mì trứng ốp la", level: 2, price: 25, xp: 7, spreads: { pate: 2 }, fills: ["trung"], cost: 12 },
  { id: "xiu-mai", name: "Bánh mì xíu mại", level: 3, price: 27, xp: 8, spreads: {}, fills: ["xiu-mai"], cost: 12 },
  { id: "thap-cam", name: "Bánh mì thập cẩm", level: 4, price: 42, xp: 9, spreads: { pate: 2, bo: 2 }, fills: ["cha-lua", "thit-nguoi", "cha-bong"], cost: 21 },
  { id: "thit-nuong", name: "Bánh mì thịt nướng", level: 5, price: 32, xp: 9, spreads: { mayo: 2 }, fills: ["thit-nuong"], cost: 14 },
  { id: "chay", name: "Bánh mì chay", level: 6, price: 25, xp: 8, spreads: { bo: 2 }, fills: ["cha-chay"], cost: 11, vegan: true },
  { id: "ga-xe", name: "Bánh mì gà xé", level: 8, price: 31, xp: 9, spreads: { mayo: 2 }, fills: ["ga-xe"], cost: 13 },
  { id: "heo-quay", name: "Bánh mì heo quay", level: 10, price: 40, xp: 10, spreads: { pate: 2 }, fills: ["heo-quay"], cost: 16 },
  /** Ổ mang tên tiệm (cấp 19): công thức mặc định, người chơi đặt tên / nhân / giá (core/progress.js setHouse ghi đè trên phiếu). */
  { id: "gia-truyen", name: "Ổ gia truyền", level: 19, price: 58, xp: 12, spreads: { pate: 2, bo: 2 }, fills: ["cha-lua", "thit-nguoi", "heo-quay", "cha-bong"], cost: 28, house: true },
].map((r) => ({ ...r, veg: { ...baseVeg }, ot: 2, sauces: { "nuoc-tuong": true, "tuong-ot": false }, wrap: "giay" }));
/** Bánh mì que (cấp 12): bịch 5 que nướng trên khay que, phết pate, bỏ túi. Không rạch, không rau dưa, không gia vị. */
RECIPES.push({ id: "que", name: "Bánh mì que (bịch 5)", level: 12, price: 18, xp: 8, cost: 6, que: true, spreads: { pate: 2 }, fills: [], veg: { "do-chua": false, "dua-leo": false, "rau-mui": false, "hanh-la": false }, ot: 0, sauces: {}, wrap: "tui" });
/** Bánh mì nướng bơ đường (M5): món riêng 10k làm từ bánh hôm qua (Chuẩn bị ca chọn "Bán nướng bơ đường"). Nướng lại ở lò than (tối đa giòn 70),
 *  phết bơ, gói giấy; không rau, không ớt. Không nằm trong menu thường: chỉ khách sáng hôm đó gọi, tối đa bằng số ổ bánh hôm qua. */
RECIPES.push({ id: "bo-duong", name: "Bánh mì nướng bơ đường", level: 1, price: 10, xp: 3, cost: 1, stale: true, spreads: { bo: 2 }, fills: [], veg: { "do-chua": false, "dua-leo": false, "rau-mui": false, "hanh-la": false }, ot: 0, sauces: {}, wrap: "giay" });
export const RECIPE = Object.fromEntries(RECIPES.map((r) => [r.id, r]));
/** Khay que: 12 que một ngăn, chín 14–19 giây, cháy sau 22 giây; một bịch = 5 que. */
export const QUE = { tray: 12, bag: 5, golden: [14, 19], dark: 22 };

/** "Ổ ba chục": giá ổ = 7k nền + tổng giá lẻ từng phần + phụ thu 2k; lệch ≤ 3k là đúng. */
export const RETAIL = { pate: 3, bo: 1, mayo: 1, "cha-lua": 7, "thit-nguoi": 8, "xiu-mai": 9, trung: 5, "thit-nuong": 11, "heo-quay": 15, "ga-xe": 11, "cha-chay": 7, "cha-bong": 3 };
export const BACHUC = { base: 7, surcharge: 2, tolerance: 3, targets: [20, 25, 30, 40], unlock: 3 };

/** Lò (ECONOMY §3). Giây = giây ca. sống < golden[0] · chín golden · xém tới dark · cháy sau đó. */
export const OVENS = {
  mini: { name: "Lò mini", slots: 1, tray: 4, golden: [26, 32], dark: 36, frame: "oven-mini" },
  gas: { name: "Lò gas 2 ngăn", slots: 2, tray: 6, golden: [24, 31], dark: 35, frame: "oven-gas" },
  electric: { name: "Lò điện đối lưu", slots: 3, tray: 8, golden: [20, 32], dark: 37, frame: "oven-electric" },
};
/** Độ giòn khi rút. */
export const PULL_CRISP = { raw: 60, golden: 100, dark: 90 };
/** Dưới vùng "pale" là phôi còn trắng (chỉ để vẽ). */
export const RAW_UNTIL = 8;
/** Tủ kính: sức chứa, giảm giòn −1 mỗi decayMs (ms ca). */
export const DISPLAY = { cap: 12, decayMs: 2500, soggy: 50, refuse: 25 };
/** Lò than nướng lại: giây ca mỗi ổ, độ giòn tối thiểu sau khi nướng, quá burnAt giây là cháy ổ. */
export const TOASTER = { ms: 4000, minCrisp: 85, burnMs: 10000, slots: 1 };
/** Nướng lại xong: độ giòn lấy max(cũ, TOAST_TO). */
export const TOAST_TO = 92;

/** Tiền lẻ (ECONOMY §4). Mệnh giá (k). Tờ ≤ 50k vào quỹ lẻ, tờ lớn vào két. */
export const BILLS = [1, 2, 5, 10, 20, 50, 100, 200, 500];
export const FLOAT_BILLS = [1, 2, 5, 10, 20, 50];
export const START_FLOAT = { 1: 5, 2: 5, 5: 3, 10: 1 };
/** Đổi lẻ ở Cô Sáu (Chuẩn bị ca), miễn phí, tối đa limit k mỗi ngày (xe đẩy). */
export const EXCHANGE = {
  limit: { cart: 100, shop: 200, famous: 300 },
  packs: {
    nho: { name: "Nhiều tờ nhỏ", bills: { 1: 10, 2: 5, 5: 4 } },
    vua: { name: "Nhiều tờ 10–20k", bills: { 5: 2, 10: 2, 20: 1 } },
  },
};
/** Ngày 1–3 có nút "Thối đúng" (chủ dự án duyệt 19/11/2026), từ ngày 4 thối tay. */
export const AUTO_CHANGE_DAYS = 3;
/** Khách thật thà trả lại tiền thối dư. */
export const HONEST_RETURN = 0.4;

/** Phí ca (ECONOMY §5): xe đẩy 8k + 2k mỗi cấp. */
export const shiftFeeFor = (level) => (level <= 6 ? 8 + 2 * level : 20 + 2 * level);
export const QUEUE_MAX = { cart: 4, shop: 5, famous: 6 };

/** 20 cấp (GAME-DESIGN §6). */
export const LEVELS = [0, 35, 70, 115, 360, 580, 870, 1450, 2100, 3000, 3625, 4380, 5225, 6240, 7530, 9005, 10835, 12950, 15415, 18260];
/** XP theo sao (ECONOMY §2): 4–5 sao đủ, 3 sao 60%, 1–2 sao 25%. Ổ thứ 5 trở đi trong một đơn 50%. */
export const XP_MUL = { 5: 1, 4: 1, 3: 0.6, 2: 0.25, 1: 0.25 };

/** Cứu hết hàng giữa ca (ECONOMY §9, mô phỏng ui/stockout của Trà Sữa). */
export const RESCUE = {
  runMarkup: 0.3, runMs: 12000, shipMarkup: 0.15, shipTip: 5, shipMs: 20000, shipWrong: 0.25, borrowN: 4,
  siPack: 10, siPrice: 45, siCrisp: 80, siMs: 15000, gasTank: 60, swapAccept: { student: 0.75, office: 0.6, regular: 0.5, worker: 0.8, shipper: 0.7, parent: 0.6, reviewer: 0.4, tourist: 0.8 },
  closeRep: -3, lowAt: 2,
};
/** Gói ký gửi Bà Tư: đủ cho 10 ổ pate bơ (chỉ phần thiếu), trừ dần bằng giá vốn khi bán. */
export const CONSIGN = { loaves: 10, use: { phoi: 1, pate: 1, bo: 1, "do-chua": 1, "dua-leo": 1, rau: 1, "gia-vi": 1, "giay-goi": 1 }, gas: 3 };
