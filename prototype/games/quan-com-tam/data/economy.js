// Bảng số liệu Quán Cơm Tấm — chép từ docs/quan-com-tam/ECONOMY.md (bản M0). Đơn vị k = 1.000 đồng ảo.
// Luật đọc bảng này ở core/*. Đổi số thì sửa ở đây (test/economy.test.mjs kiểm giá vốn khớp bảng ECONOMY §2).

/** Nguyên liệu: cost = giá một phần; pack = [số phần, giá gói Cô Ba]; cap = có tính vào sức chứa kho; unlock = cấp mở; buy=false: không mua được (sườn ướp). */
export const STOCK = {
  "gao-tam": { name: "Gạo tấm", unit: "phần", cost: 1.5, pack: [20, 30], cap: true, unlock: 1 },
  suon: { name: "Sườn sống", unit: "miếng", cost: 10, pack: [10, 100], cap: true, unlock: 1 },
  "suon-uop": { name: "Sườn đã ướp", unit: "miếng", cost: 10, pack: null, cap: true, unlock: 1, buy: false },
  "suon-non": { name: "Sườn non", unit: "miếng", cost: 15, pack: [8, 120], cap: true, unlock: 10 },
  ga: { name: "Đùi gà", unit: "miếng", cost: 12, pack: [8, 96], cap: true, unlock: 8 },
  "lap-xuong": { name: "Lạp xưởng", unit: "cây", cost: 5, pack: [10, 50], cap: true, unlock: 13 },
  "dau-hu": { name: "Đậu hũ nướng", unit: "miếng", cost: 3, pack: [10, 30], cap: true, unlock: 11 },
  bi: { name: "Bì", unit: "phần", cost: 3, pack: [15, 45], cap: true, unlock: 3 },
  "bi-chay": { name: "Bì chay", unit: "phần", cost: 2, pack: [15, 30], cap: true, unlock: 11 },
  cha: { name: "Chả trứng", unit: "miếng", cost: 4, pack: [8, 32], cap: true, unlock: 4 },
  "cha-chay": { name: "Chả chay", unit: "miếng", cost: 2, pack: [8, 16], cap: true, unlock: 11 },
  trung: { name: "Trứng gà", unit: "quả", cost: 3, pack: [10, 30], cap: true, unlock: 2 },
  // S (M5): đồ chua + dưa leo không tính sức chứa (hũ / rổ để dưới quầy, như rau của Bánh Mì). Kho vỉa hè 80 dành cho thịt, bì, chả, trứng, gạo.
  "do-chua": { name: "Đồ chua", unit: "phần", cost: 1, pack: [20, 20], cap: false, unlock: 1 },
  "dua-leo": { name: "Dưa leo, cà chua", unit: "phần", cost: 1, pack: [20, 20], cap: false, unlock: 1 },
  "mo-hanh-bo": { name: "Bộ làm mỡ hành", unit: "hũ", cost: 10, pack: [1, 10], cap: false, unlock: 1 },
  "nuoc-mam": { name: "Nước mắm pha", unit: "phần", cost: 1, pack: [30, 30], cap: false, unlock: 1 },
  "nuoc-tuong": { name: "Nước tương chay", unit: "phần", cost: 0.5, pack: [30, 15], cap: false, unlock: 11 },
  tra: { name: "Trà đá", unit: "ly", cost: 0.3, pack: [30, 9], cap: false, unlock: 1 },
  "khan-lanh": { name: "Khăn lạnh", unit: "cái", cost: 0.8, pack: [30, 24], cap: false, unlock: 1 },
  than: { name: "Than", unit: "rổ", cost: 4, pack: [10, 40], cap: false, unlock: 1 },
  hop: { name: "Hộp giấy + bịch mắm", unit: "hộp", cost: 2, pack: [30, 60], cap: false, unlock: 1 },
  tui: { name: "Túi", unit: "cái", cost: 0.5, pack: [50, 25], cap: false, unlock: 4 },
};
export const STOCK_IDS = Object.keys(STOCK);
/** Hạn dùng (ngày) của hàng tươi trong kho, tính từ ngày nhập. Hàng cũ dùng trước (FIFO), quá hạn ghi hao lúc sang ngày. */
export const SHELF = { suon: 3, "suon-non": 3, ga: 3, "dau-hu": 3, bi: 3, "bi-chay": 3, cha: 3, "cha-chay": 3, "dua-leo": 3, "do-chua": 5, trung: 10, "lap-xuong": 14 };
/** Mỡ hành, gạo trong nồi tính theo phần ở bếp, không ở kho. */
export const MO_HANH = { jar: 20, makeMs: 8000, portionCost: 0.5, keepDays: 2 };

/** Phần nền tại bàn: cơm 1,5 + mỡ hành 0,5 + đồ chua 1 + dưa leo 1 + nước mắm 1 = 5k. Chay: hành phi + nước tương = 4,5k. */
export const BASE_COST = 5;
export const BASE_COST_VEGAN = 4.5;

/**
 * Món (ECONOMY §2). meat = món nướng (null: không cần bếp); bi/cha/trung/ngo = lớp bắt buộc; vegan = dĩa chay (mỡ hành / nước mắm / thịt là lỗi 13).
 * noRice = bánh mì sườn (cứu khi hết cơm). Giá vốn trong bảng ECONOMY: cost.
 */
export const DISHES = {
  "com-suon": { name: "Cơm sườn", level: 1, price: 38, cost: 15, xp: 8, meat: "suon" },
  "com-suon-trung": { name: "Cơm sườn trứng", level: 2, price: 45, cost: 18, xp: 9, meat: "suon", trung: true, needs: ["egg-pan"] },
  "com-suon-bi": { name: "Cơm sườn bì", level: 3, price: 44, cost: 18, xp: 9, meat: "suon", bi: true },
  "com-suon-bi-cha": { name: "Cơm sườn bì chả", level: 4, price: 54, cost: 22, xp: 10, meat: "suon", bi: true, cha: true, needs: ["steamer"] },
  "com-bi-cha": { name: "Cơm bì chả", level: 5, price: 32, cost: 12, xp: 7, meat: null, bi: true, cha: true, needs: ["steamer"] },
  "dac-biet": { name: "Cơm tấm đặc biệt", level: 6, price: 65, cost: 25, xp: 13, meat: "suon", bi: true, cha: true, trung: true, ngo: true, needs: ["egg-pan", "steamer"] },
  "com-ga": { name: "Cơm gà nướng", level: 8, price: 48, cost: 17, xp: 11, meat: "ga" },
  "com-suon-non": { name: "Cơm sườn non", level: 10, price: 60, cost: 20, xp: 13, meat: "suon-non" },
  "com-chay": { name: "Cơm chay", level: 11, price: 36, cost: 11.5, xp: 11, meat: "dau-hu", bi: true, cha: true, vegan: true, needs: ["steamer"] },
  "com-lap-xuong-trung": { name: "Cơm lạp xưởng trứng", level: 13, price: 40, cost: 13, xp: 10, meat: "lap-xuong", trung: true, needs: ["egg-pan"] },
  // A: cơm chiên từ cơm dư hôm trước (FRIED_RICE): không tự vào menu; core/progression.js bật / tắt theo s.friedRice.
  "com-chien": { name: "Cơm chiên", level: 2, price: 24, cost: 3.5, xp: 5, meat: null, trung: true, fried: true, needs: ["egg-pan"], special: true },
  "banh-mi-suon": { name: "Bánh mì sườn", level: 1, price: 35, cost: 13, xp: 4, meat: "suon", noRice: true, rescue: true, bread: 3 },
};
/** Thành phần một dĩa (để tính giá vốn khớp bảng): món nướng → id kho, bì / chả theo chay hay mặn. */
export function dishParts(id) {
  const d = DISHES[id];
  if (!d) return {};
  const out = {};
  if (d.noRice) { out.bread = d.bread || 3; if (d.meat) out[d.meat === "suon" ? "suon-uop" : d.meat] = 1; return out; }
  if (d.meat) out[d.meat === "suon" ? "suon-uop" : d.meat] = 1;
  if (d.bi) out[d.vegan ? "bi-chay" : "bi"] = 1;
  if (d.cha) out[d.vegan ? "cha-chay" : "cha"] = 1;
  if (d.trung) out.trung = 1;
  return out;
}
/** Giá vốn tính từ thành phần (test so với cột cost của bảng ECONOMY). */
export function dishCost(id) {
  const d = DISHES[id];
  if (!d) return 0;
  if (d.fried) return 3.5; // 2 phần cơm dư (đã tính hao hôm trước) + trứng 3 + mỡ 0,5
  let c = d.noRice ? 0 : d.vegan ? BASE_COST_VEGAN : BASE_COST;
  for (const [k, n] of Object.entries(dishParts(id))) c += (k === "bread" ? 1 : STOCK[k]?.cost || 0) * n;
  return Math.round(c * 10) / 10;
}

/** Gọi thêm (ECONOMY §2). */
export const EXTRAS = {
  com: { name: "Thêm cơm", price: 4, cost: 2 },
  khan: { name: "Khăn lạnh", price: 2, cost: 0.8 },
  trung: { name: "Thêm trứng", price: 6, cost: 3 },
};

/** Bếp than (ECONOMY §3.1). Thời gian một mặt tính bằng giây ở vùng vừa, than vừa. */
export const GRILL = {
  slots: 6,
  zones: ["hot", "hot", "mid", "mid", "warm", "warm"],
  zoneMul: { hot: 1.5, mid: 1, warm: 0.25, veg: 1 }, // S (M5): veg = vỉ chay riêng (như vùng vừa, chỉ nướng đậu hũ)
  warmSafeMs: 60000,
  heat: [ // nấc than: [mức tối thiểu, hệ số, khoá frame]
    { min: 60, mul: 1.2, key: "high" }, { min: 30, mul: 1, key: "mid" }, { min: 10, mul: 0.6, key: "low" }, { min: 0, mul: 0, key: "ash" },
  ],
  blazeMul: 1.4, // quạt khi đang rực: thêm một nấc
  burnPerSec: 0.5, fanBurnMul: 2,
  addCoal: 35, coalDelayMs: 4000, coalMax: 100,
  flareAt: 60, flareMs: 3000, flareMul: 2,
  side: { suon: 9, "suon-non": 14, ga: 12, "lap-xuong": 5, "dau-hu": 6 },
  halfMin: 60, doneMin: 100, charMin: 115, burntMin: 130, sideMax: 160, nearBurn: 125,
  perfect: [100, 114],
  // Cân bằng M3: giây ở vùng chín / cháy cạnh khi than rực (×1,2). Bản M2 vùng nóng chỉ ~0,7 giây chín ⇒ người chơi ẩu cháy gần hết.
  // Cân bằng M5 (bộ mô phỏng): vùng vừa chín 6 giây + cháy cạnh 5 giây (bản M3 4,5 + 3: một chuyến bưng ra bàn xa 4–5 giây là cháy); vùng nóng 3 + 2,5.
  bandSec: { hot: { done: 3, charred: 2.5 }, mid: { done: 6, charred: 5 }, veg: { done: 6, charred: 5 } },
  freshDecayMs: 3000, dryBelow: 60,
  smoke: { fan: 1, burning: 3, decay: 2, high: 70 },
  prepLight: { baskets: 2, level: 70 },
};
/** Nồi cơm (ECONOMY §4.1). */
export const RICE = { small: { size: 12, ms: 40000 }, big: { size: 20, ms: 45000 } };
/** Trứng ốp la theo giây trên chảo (GAME-DESIGN §3.2). */
export const EGG = { runny: 6, set: 9, hard: 13, burnt: 18 };
/** Xửng hấp chả: khay 8 miếng, 30 giây. */
export const STEAMER = { tray: 8, ms: 30000 };

/** Phục vụ tại bàn: thời gian (ms ca) và tốc độ đi (px cảnh / giây). Chủ quán đi tới bàn xa ~2,5 giây. */
export const SERVICE = {
  // Cân bằng M5 (bộ mô phỏng): cô chủ đi 400 px/giây (bản M0 330), châm trà + lấy phiếu 2,1 giây (2,8), dọn + lau 2 giây (2,5).
  // Một mình vừa nướng vừa bưng, bản M0 chỉ kham ~5 dĩa / ca; giờ ~7–8.
  ownerSpeed: 400, guestSpeed: 230, walkInMs: 2600,
  pourMs: 600, orderMs: 1500, deliverMs: 600, billMs: 500, clearMs: 1200, wipeMs: 800, wetMs: 1500,
  washPerPlateMs: 1000, washBatch: 6, marinateMs: 10000, khanMs: 400, riceMs: 500,
  teaHalfMs: 20000, noTeaMs: 20000, firstTeaMs: 12000,
  eatMs: [18000, 30000], billAutoMs: 40000, dirtyNeighborMs: 15000, dirtyWaitDrain: 1.6, seatedPatience: 1.4,
  queueMax: 4, carryMax: 2, toTableMs: 1400,
  plates: { street: 10, quan: 16, cabinet: 24 },
  waitMax: { street: 2, quan: 3, famous: 4 },
};

/** Giá cố định. Phí ca vỉa hè 12k + 2k mỗi cấp. */
// Cân bằng M5: phí ca nhẹ hơn bản M0 (12 + 2·cấp / 30 + 3·cấp): một mình cô chủ bán 6–8 dĩa một ca, phí cũ ăn gần nửa lãi.
export const FEES = { street: (lvl) => 8 + lvl, quan: (lvl) => 24 + 2 * lvl };
export const CAPACITY = { street: 80, quan: 140 };

/** Vốn đầu 150k + gói học (ECONOMY §6): đủ khoảng 12 dĩa cơm sườn. */
export const START_MONEY = 150;
export const START_STOCK = { "suon-uop": 12, "gao-tam": 24, "do-chua": 20, "dua-leo": 20, "mo-hanh-bo": 1, "nuoc-mam": 30, tra: 30, than: 10, hop: 6, "khan-lanh": 10 };

/** Gói ký gửi Cô Ba: bù đủ cho 10 dĩa cơm sườn (chỉ phần thiếu). */
// S (M5): 3 rổ than (bản M0: 1) — nhóm bếp đầu ca cần 2 rổ; 1 rổ thì mở ca bếp nguội, người chơi hết tiền không gượng dậy được (sim: ẩu lụn bại)
export const CONSIGN = { dishes: 10, parts: { "suon-uop": 10, "gao-tam": 12, "do-chua": 10, "dua-leo": 10, "nuoc-mam": 10, than: 3 } };

/** Cứu hết hàng giữa ca (ECONOMY §10). */
export const RESCUE = { runMarkup: 0.3, runMs: 12000, shipMarkup: 0.15, shipTip: 5, shipMs: 20000, borrowN: 4, borrowThan: 2, wrongBuy: 0.25, breadMax: 3 };

/** Đồ mua được ở cấp 1–6 (ECONOMY §7). M3 thêm phần còn lại. */
export const GEAR = {
  "spare-sack": { name: "Bao than dự phòng", level: 1, price: 40, repeat: true, text: "Tự mở 10 rổ khi hết than giữa ca, không phải chạy đi mua." },
  "plates-4": { name: "Thêm 4 dĩa", level: 1, price: 32, repeat: true, text: "Chồng dĩa sạch +4 (tối đa theo tủ)." },
  "egg-pan": { name: "Chảo trứng", level: 2, price: 40, text: "Mở trứng ốp la, cơm sườn trứng." },
  "ban-3": { name: "Bàn 3 (+2 ghế)", level: 3, price: 90, text: "Vỉa hè 6 chỗ." },
  "glass-case": { name: "Tủ kính giữ ấm", level: 3, price: 120, text: "Giữ thêm 6 miếng chín, tươi giảm chậm 40%." },
  steamer: { name: "Xửng hấp chả", level: 4, price: 60, text: "Mở chả trứng." },
  "takeaway-shelf": { name: "Kệ hộp mang về", level: 4, price: 40, text: "Mở shipper / hộp mang về." },
  "soup-pot": { name: "Nồi canh", level: 5, price: 50, text: "Chén canh miễn phí cho khách ngồi." },
  "ban-4": { name: "Bàn 4 (+2 ghế)", level: 5, price: 110, text: "Vỉa hè 8 chỗ, ghép bàn." },
  awning: { name: "Mái bạt", level: 6, price: 80, street: true, text: "Ngày mưa chỉ vắng 15% khách thay vì 40%." },
  "double-slot": { name: "Ô bày đôi + bày ×N", level: 6, price: 90, text: "Hai dĩa song song; bật ×N thì mỗi chạm áp cho cả hàng." },
  "water-can": { name: "Can nước dự trữ", level: 6, price: 50, text: "Mất nước vẫn rửa được 18 dĩa." },
  "smoke-hood": { name: "Chụp hút khói", level: 8, price: 180, quan: true, text: "Khói ×0,4, hàng xóm hết kêu." },
  "egg-pan-2": { name: "Chảo đôi", level: 8, price: 80, needs: "egg-pan", text: "Chiên 2 trứng cùng lúc." },
  "q-table-4": { name: "Bàn thứ 4 của quán (2 chỗ)", level: 10, price: 160, quan: true, text: "Quán 10 chỗ." },
  "tray-4": { name: "Khay mâm 4 dĩa", level: 10, price: 70, needs: "double-slot", text: "Bày ×N tới 4 dĩa cho mâm cơm công ty." },
  "electric-blower": { name: "Quạt máy thổi bếp", level: 12, price: 160, text: "Bật là bếp lên một nấc, than ×1,5, khói ×0,6, không tốn tay." },
  "rice-cooker-2": { name: "Nồi cơm thứ hai", level: 12, price: 150, text: "Nấu xen kẽ, không bao giờ trống cơm nếu canh đúng." },
  "q-table-5": { name: "Bàn 5 (4 chỗ)", level: 13, price: 260, quan: true, text: "Quán 14 chỗ." },
  "dish-cabinet": { name: "Tủ chén", level: 13, price: 120, text: "Chồng dĩa tới 24." },
  "grill-2": { name: "Bếp than thứ hai", level: 14, price: 520, quan: true, text: "+6 chỗ nướng (phím Shift+1..6)." },
  fridge: { name: "Tủ mát", level: 14, price: 300, text: "Kho 200, sườn ướp giữ thêm 1 ngày." },
  "cash-box": { name: "Hộp tính tiền", level: 15, price: 200, text: "Tự cộng phiếu tính tiền." },
  "queue-bench": { name: "Ghế chờ", level: 16, price: 120, quan: true, text: "4 người đứng chờ, kiên nhẫn chờ +10%." },
  "signboard-2": { name: "Bảng hiệu bậc 2", level: 10, price: 200, text: "+0,5 hấp dẫn." },
  "signboard-3": { name: "Bảng hiệu bậc 3", level: 16, price: 500, needs: "signboard-2", text: "+1 hấp dẫn, quán nổi tiếng." },
  // S (M5): vỉ chay riêng — 2 chỗ chỉ nướng đậu hũ; nướng đậu hũ trên chỗ vừa nướng thịt thì dính mặn (dĩa chay lỗi 13)
  "veg-grill": { name: "Vỉ nướng chay riêng", level: 11, price: 80, text: "2 chỗ chỉ nướng đậu hũ: dĩa chay không bao giờ dính mặn." },
};
/** Thuê theo ca (trả mỗi ca mở khi bật). */
export const STAFF = {
  bong: { name: "Phụ bàn Bông", level: 9, price: 40, text: "Tự mời ngồi, châm trà, lấy phiếu, bưng dĩa, dọn + lau bàn. Cô chủ ở lại bếp." },
  "di-nam": { name: "Dì Năm rửa chén", level: 13, price: 25, text: "Tự rửa 1 dĩa mỗi 2 giây." },
};
/** Trang trí (ECONOMY §8): appeal = điểm hấp dẫn. Kéo thả trong quán (cấp 7+); vỉa hè đặt chỗ mặc định. place: wall | floor. */
export const DECOR = {
  "bougainvillea-pot": { name: "Chậu hoa giấy", level: 4, price: 40, appeal: 0.5, place: "floor" },
  "red-lantern": { name: "Đèn lồng đỏ", level: 4, price: 35, appeal: 0.5, place: "wall" },
  "paper-lantern": { name: "Đèn lồng giấy", level: 4, price: 30, appeal: 0.25, place: "wall" },
  "fairy-lights": { name: "Dây đèn nhỏ", level: 5, price: 45, appeal: 0.5, place: "wall", guests: 1 },
  "ceramic-jar": { name: "Hũ sứ", level: 5, price: 35, appeal: 0.25, place: "floor" },
  "chalk-menu": { name: "Bảng phấn", level: 5, price: 30, appeal: 0.5, place: "floor" },
  "wall-calendar": { name: "Lịch treo", level: 7, price: 15, appeal: 0.25, place: "wall" },
  "old-radio": { name: "Radio cũ", level: 8, price: 50, appeal: 0.5, place: "wall" },
  "wall-fan": { name: "Quạt tường", level: 8, price: 60, appeal: 0, patience: 4, place: "wall" },
  "old-tv": { name: "TV cũ", level: 9, price: 120, appeal: 0.5, place: "wall" },
  "bird-cage": { name: "Lồng chim", level: 10, price: 70, appeal: 0.25, place: "wall" },
  "banana-plant": { name: "Chuối cảnh", level: 10, price: 55, appeal: 0.5, place: "floor" },
  "award-frame": { name: "Khung giấy khen", level: 99, price: 0, appeal: 0.5, place: "wall", event: true },
  // S (M5): đồ trang trí Drama tặng (fx.decor) thành đồ kéo thả; art = frame decor.webp dùng tạm tới khi Codex vẽ riêng
  "la-thu": { name: "Lá thư cảm ơn", level: 99, price: 0, appeal: 0.25, place: "wall", event: true, art: "wall-calendar" },
  "hoa-giay": { name: "Bó hoa giấy của chị Sáu", level: 99, price: 0, appeal: 0.5, place: "floor", event: true, art: "bougainvillea-pot" },
  "anh-khai-truong": { name: "Ảnh ngày khai trương", level: 99, price: 0, appeal: 0.5, place: "wall", event: true, art: "award-frame" },
  "anh-mai": { name: "Ảnh Mai nhắm mắt ăn sườn", level: 99, price: 0, appeal: 0.5, place: "wall", event: true, art: "award-frame" },
  "meo-vang": { name: "Ổ mèo", level: 99, price: 0, appeal: 0.25, place: "floor", event: true },
  "ghe-cao": { name: "Ghế nhựa cao", level: 99, price: 0, appeal: 0, place: "floor", event: true, art: "ceramic-jar" },
  "neon-sign": { name: "Biển đèn neon", level: 16, price: 300, appeal: 1, place: "wall", guests: 2 },
};
export const DECOR_IDS = Object.keys(DECOR);
export const APPEAL_CAP = (level) => (level >= 19 ? 4 : 3);
/** Vùng kéo thả trong quan-scene 1280×720 (tường trên, sàn trước). Đồ không đặt sát bàn / lối đi (khoảng cách tối thiểu). */
export const PLACE_ZONES = { wall: { x: [40, 1240], y: [80, 330] }, floor: { x: [20, 1260], y: [420, 712] } };
export const SPOT_CLEARANCE = 60;
/** Chỗ mặc định ở vỉa hè (street-scene không có toạ độ đồ trang trí trong manifest). */
export const STREET_DECOR_AT = [[90, 640], [1250, 640], [620, 250], [380, 250], [1180, 300], [60, 300], [900, 250], [200, 690], [1030, 690], [470, 690], [760, 250], [1240, 470], [40, 470], [640, 160]];

/** Hạng quán (ECONOMY §11): mỗi bậc +1 khách đi ngang mỗi ca, kiên nhẫn +2%. */
export const TIERS = [
  { level: 10, price: 500 }, { level: 11, price: 1000 }, { level: 12, price: 1700 }, { level: 14, price: 2600 },
  { level: 15, price: 3800 }, { level: 17, price: 5200 }, { level: 19, price: 7000 }, { level: 20, price: 9000 },
];
/** Nước mắm nhà pha 3 bậc: mọi dĩa +1k / bậc, +1 điểm kỳ vọng. */
export const FISH_SAUCE = [{ level: 15, price: 600 }, { level: 17, price: 1400 }, { level: 19, price: 2500 }];
/** Quảng bá (cấp 11), một lần mỗi ngày trước ca. */
export const PROMOS = {
  "to-roi": { name: "Tờ rơi khu trọ", price: 25, guests: { student: 4 }, followers: 0, desc: "+4 sinh viên ca tối." },
  "check-in": { name: "Check-in tặng trà tắc", price: 20, guests: 2, followers: 20, buzz: 0.5, desc: "+2 khách hôm nay, thêm người theo dõi." },
  livestream: { name: "Livestream lúc nướng", price: 0, roll: true, desc: "Hên xui: lên mạng, khách ăn ké, hoặc phản tác dụng nếu cháy miếng trên sóng." },
};
export const PROMO_UNLOCK = 11;
/** Nhà cung cấp 2 Chú Hòa (cấp 9): gói gấp đôi rẻ 10%, chỉ giao trước ca. */
export const HOA = { level: 9, ids: ["gao-tam", "than", "hop", "tui", "suon", "suon-non", "ga", "lap-xuong", "dau-hu", "bi", "bi-chay", "cha", "cha-chay", "trung", "do-chua", "dua-leo", "nuoc-mam", "nuoc-tuong", "tra", "khan-lanh"] };
export const hoaPack = (id) => { const p = STOCK[id]?.pack; return p ? [p[0] * 2, Math.round(p[1] * 2 * 0.9)] : null; };
/** Đơn đặt trước (cấp 7) / mâm cơm (cấp 10): cọc 30%, trễ ≤ 30 s −10%, trễ hơn / thiếu −30%; đơn tới hạn mà thiếu thì khách lấy phần đã xong, trả 70%. */
export const PREORDER = { level: 7, cateringLevel: 10, deposit: 0.3, perDay: 2, lateSmall: 30000, lateSmallCut: 0.1, lateBigCut: 0.3, grace: 45000, partialPay: 0.7 };
/** Sổ nợ (ECONOMY §4.3). */
export const DEBT = { level: 6, limit: (lvl) => (lvl >= 16 ? 500 : lvl >= 10 ? 300 : 150), perPerson: 5, payChance: 0.25, forgetDays: 14, forgetChance: 0.06, askChance: 0.4 };
/** Ca khuya kéo dài (cấp 17): ca tối dài thêm, khuya +25% khách. */
export const LATE = { level: 17, extraMs: 45000, guestMul: 1.25 };
/** Cơm chiên từ cơm dư (cấp 2, cần chảo): 50% số phần dư, tối đa 6 dĩa. */
export const FRIED_RICE = { share: 0.5, max: 6 };
/** Nhiệm vụ ngày (ECONOMY §9): 3 mục mỗi ca từ cấp 2. */
export const MISSIONS = [
  { id: "flips", kind: "flips", n: 4, unlock: 2, text: "Lật đúng lúc {n} lần", reward: { xp: 8, money: 0 } },
  { id: "no-burnt", kind: "noBurnt", n: 4, unlock: 2, text: "Bán {n} dĩa mà không miếng nào cháy đen", reward: { xp: 10, money: 10 } },
  { id: "tea", kind: "tea", n: 3, unlock: 2, text: "Châm trà kịp cho {n} bàn (không ai khát)", reward: { xp: 10, money: 0 } },
  { id: "no-timeout", kind: "noTimeout", n: 5, unlock: 2, text: "Phục vụ {n} khách, không ai bỏ về vì chờ bàn", reward: { xp: 12, money: 12 } },
  { id: "quirks", kind: "quirks", n: 3, unlock: 2, text: "Giao {n} phiếu có dặn riêng đúng", reward: { xp: 10, money: 0 } },
  { id: "five", kind: "five", n: 2, unlock: 2, text: "Nhận {n} review 5 sao", reward: { xp: 10, money: 10 } },
  { id: "runny", kind: "runny", n: 2, unlock: 2, needs: "egg-pan", text: "Làm đúng {n} trứng lòng đào", reward: { xp: 8, money: 6 } },
  { id: "drama", kind: "drama", n: 1, unlock: 2, text: "Xử lý một tình huống trong ca", reward: { xp: 6, money: 5 } },
  { id: "clean", kind: "clean", n: 10, unlock: 3, text: "Không để bàn nào dơ quá {n} giây", reward: { xp: 12, money: 10 } },
  { id: "rice-left", kind: "riceLeft", n: 3, unlock: 3, text: "Cơm dư cuối ca không quá {n} phần", reward: { xp: 10, money: 8 } },
  { id: "smoke", kind: "smoke", n: 70, unlock: 3, text: "Khói không vượt {n} cả ca", reward: { xp: 10, money: 0 } },
  { id: "takeaway", kind: "takeaway", n: 2, unlock: 4, needs: "takeaway-shelf", text: "Giao {n} hộp mang về đúng (có bịch nước mắm)", reward: { xp: 10, money: 0 } },
  { id: "plates", kind: "plates", n: 12, unlock: 4, text: "Bán {n} dĩa trong ca", reward: { xp: 14, money: 12 } },
  { id: "nhu-cu", kind: "nhuCu", n: 1, unlock: 4, text: "Phục vụ khách quen “như hôm qua” đúng", reward: { xp: 12, money: 0 } },
  { id: "bill", kind: "bill", n: 2, unlock: 4, text: "Tính tiền tay đúng {n} bàn", reward: { xp: 10, money: 0 } },
  { id: "table4", kind: "table4", n: 1, unlock: 5, text: "Phục vụ trọn một bàn 3–4 người từ 4 sao", reward: { xp: 14, money: 12 } },
  { id: "revenue", kind: "revenue", n: 300, unlock: 5, text: "Doanh thu ca đạt {n}k", reward: { xp: 15, money: 18 } },
  { id: "preorder", kind: "preorder", n: 1, unlock: 7, text: "Giao đơn đặt trước đúng giờ", reward: { xp: 15, money: 18 } },
];
export const MISSIONS_PER_DAY = 3;
/** Bàn vỉa hè mở theo đồ đã mua (s1, s2 có sẵn). */
export const TABLE_GEAR = { s3: "ban-3", s4: "ban-4", q4: "q-table-4", q5: "q-table-5" };
/** A: thuê mặt bằng lên quán (cấp 7): một lần, giữ bản lưu + đồ đã mua; dĩa tối thiểu 16. */
export const RENT = { level: 7, price: 350, plates: 16 };
/** A: phụ bàn Bông: tốc độ đi, thời gian châm trà / dọn + lau (tự nhận việc, không cần chạm). Dì Năm rửa 1 dĩa mỗi 2 giây. */
export const HELPER = { speed: 300, pourMs: 900, cleanMs: 2600, washMs: 2000 };
/** A: thời tiết: từ ngày 5 mưa 15%; vỉa hè mưa −40% khách (mái bạt −15%), quán −15%. */
export const WEATHER = { fromDay: 5, rain: 0.15, street: 0.6, awning: 0.85, quan: 0.85 };
/** A: ca trưa dồn trong 45 giây giữa ca; shipper ca trưa lấy 1–3 hộp. */
export const LUNCH = { rush: [0.12, 0.62], shipperBoxes: [1, 3] };

/** S (M5): hội chợ (cấp 18) — "Đêm hội ẩm thực bờ sông": thuê gian, ca tối dài 4 phút, +10 khách đi nhóm 2–4, giá +15%, khách kém kiên nhẫn 10%. */
export const FAIR = { level: 18, price: 180, every: 4, ms: 240000, guests: 10, priceMul: 1.15, patienceMul: 0.9, group: [2, 4] };
/** S (M5): ca thử thách (cấp 20, miễn phí, xoay vòng theo ngày): đạt lần đầu thưởng lớn + huy hiệu, lần sau thưởng nhỏ. */
export const CHALLENGE = { level: 20, firstReward: { money: 150, xp: 60 }, reward: { money: 75, xp: 30 } };
/** S (M5): tủ kính giữ ấm (glass-case): 6 miếng chín, tươi giảm chậm 40% (1 mỗi 5 giây thay vì 3), không cháy. */
export const GLASS_CASE = { size: 6, freshDecayMs: 5000 };

/** 20 cấp (GAME-DESIGN §6). */
export const LEVELS = [0, 30, 55, 125, 270, 445, 655, 1055, 1630, 2355, 2845, 3455, 4110, 5050, 6280, 7575, 9125, 11050, 13295, 16085];

/** Mốc sao theo điểm 0–100. */
export const STAR_CUTS = [0, 40, 55, 70, 85];
/** XP theo sao: 4–5 sao đủ, 3 sao 60%, 1–2 sao 25% (làm tròn xuống). */
export const XP_SHARE = { 5: 1, 4: 1, 3: 0.6, 2: 0.25, 1: 0.25 };

/** Ca (GAME-DESIGN §3). Ca trưa mở ở cấp 5 (dữ liệu, chưa chơi được ở M2). */
export const SHIFTS = {
  toi: { name: "Ca tối", unlock: 1, len: 210000, clock: [17 * 60 + 30, 23 * 60], phases: [
    { at: 0, key: "som", text: "Tối sớm: sinh viên, điều dưỡng đổi ca" },
    { at: 0.24, key: "cao", text: "Cao điểm tới rồi!" },
    { at: 0.62, key: "khuya", text: "Khuya rồi: thợ tan ca, tài xế ghé" },
  ], guestMul: 1 },
  trua: { name: "Ca trưa", unlock: 5, len: 150000, clock: [11 * 60, 13 * 60], phases: [
    { at: 0, key: "trua", text: "Giờ trưa: dân văn phòng tới dồn" },
  ], guestMul: 0.65 },
};
export const SHIFT_IDS = Object.keys(SHIFTS);
/** Sau giờ đóng quán tối đa bao lâu thì bàn cuối tự trả tiền (không bao giờ kẹt ca). */
export const CLOSE_GRACE_MS = 90000;

/** Số người ngồi mỗi ca: ngày 1 ≈ 9 (ECONOMY §5). */
export function guestsFor(level, kind = "toi", day = 1) {
  // S (M5): khách tăng chậm hơn bản M0 (+1,6 mỗi cấp): một mình cô chủ vừa nướng vừa bưng chỉ kham 8–10 dĩa một ca ở vỉa hè; thừa khách thì bỏ về 1 sao
  const base = day <= 1 ? 9 : 8 + Math.min(12, (level - 1) * 0.6) + Math.min(2, (day - 1) * 0.5);
  return Math.max(4, Math.round(base * (SHIFTS[kind]?.guestMul ?? 1)));
}
