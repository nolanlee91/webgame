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
  "do-chua": { name: "Đồ chua", unit: "phần", cost: 1, pack: [20, 20], cap: true, unlock: 1 },
  "dua-leo": { name: "Dưa leo, cà chua", unit: "phần", cost: 1, pack: [20, 20], cap: true, unlock: 1 },
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
  "com-suon": { name: "Cơm sườn", level: 1, price: 32, cost: 15, xp: 8, meat: "suon" },
  "com-suon-trung": { name: "Cơm sườn trứng", level: 2, price: 38, cost: 18, xp: 9, meat: "suon", trung: true, needs: ["egg-pan"] },
  "com-suon-bi": { name: "Cơm sườn bì", level: 3, price: 37, cost: 18, xp: 9, meat: "suon", bi: true },
  "com-suon-bi-cha": { name: "Cơm sườn bì chả", level: 4, price: 45, cost: 22, xp: 10, meat: "suon", bi: true, cha: true, needs: ["steamer"] },
  "com-bi-cha": { name: "Cơm bì chả", level: 5, price: 26, cost: 12, xp: 7, meat: null, bi: true, cha: true, needs: ["steamer"] },
  "dac-biet": { name: "Cơm tấm đặc biệt", level: 6, price: 55, cost: 25, xp: 13, meat: "suon", bi: true, cha: true, trung: true, ngo: true, needs: ["egg-pan", "steamer"] },
  "com-ga": { name: "Cơm gà nướng", level: 8, price: 40, cost: 17, xp: 11, meat: "ga" },
  "com-suon-non": { name: "Cơm sườn non", level: 10, price: 50, cost: 20, xp: 13, meat: "suon-non" },
  "com-chay": { name: "Cơm chay", level: 11, price: 30, cost: 11.5, xp: 11, meat: "dau-hu", bi: true, cha: true, vegan: true, needs: ["steamer"] },
  "com-lap-xuong-trung": { name: "Cơm lạp xưởng trứng", level: 13, price: 34, cost: 13, xp: 10, meat: "lap-xuong", trung: true, needs: ["egg-pan"] },
  "banh-mi-suon": { name: "Bánh mì sườn", level: 1, price: 30, cost: 13, xp: 4, meat: "suon", noRice: true, rescue: true, bread: 3 },
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
  zoneMul: { hot: 1.5, mid: 1, warm: 0.25 },
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
  bandSec: { hot: { done: 2.5, charred: 1.8 }, mid: { done: 4.5, charred: 3 } },
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
  ownerSpeed: 330, guestSpeed: 230, walkInMs: 2600,
  pourMs: 800, orderMs: 2000, deliverMs: 600, billMs: 500, clearMs: 1500, wipeMs: 1000, wetMs: 1500,
  washPerPlateMs: 1000, washBatch: 6, marinateMs: 10000, khanMs: 400, riceMs: 500,
  teaHalfMs: 20000, noTeaMs: 20000, firstTeaMs: 12000,
  eatMs: [25000, 40000], billAutoMs: 40000, dirtyNeighborMs: 15000, dirtyWaitDrain: 2.5,
  queueMax: 4, carryMax: 2, toTableMs: 1400,
  plates: { street: 10, quan: 16, cabinet: 24 },
  waitMax: { street: 2, quan: 3, famous: 4 },
};

/** Giá cố định. Phí ca vỉa hè 12k + 2k mỗi cấp. */
export const FEES = { street: (lvl) => 12 + 2 * lvl, quan: (lvl) => 30 + 3 * lvl };
export const CAPACITY = { street: 80, quan: 140 };

/** Vốn đầu 150k + gói học (ECONOMY §6): đủ khoảng 12 dĩa cơm sườn. */
export const START_MONEY = 150;
export const START_STOCK = { "suon-uop": 12, "gao-tam": 24, "do-chua": 20, "dua-leo": 20, "mo-hanh-bo": 1, "nuoc-mam": 30, tra: 30, than: 10, hop: 6, "khan-lanh": 10 };

/** Gói ký gửi Cô Ba: bù đủ cho 10 dĩa cơm sườn (chỉ phần thiếu). */
export const CONSIGN = { dishes: 10, parts: { "suon-uop": 10, "gao-tam": 12, "do-chua": 10, "dua-leo": 10, "nuoc-mam": 10, than: 1 } };

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
};
/** Bàn vỉa hè mở theo đồ đã mua (s1, s2 có sẵn). */
export const TABLE_GEAR = { s3: "ban-3", s4: "ban-4" };

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
  const base = day <= 1 ? 9 : 9 + Math.min(30, (level - 1) * 1.6) + Math.min(2, (day - 1) * 0.5);
  return Math.max(4, Math.round(base * (SHIFTS[kind]?.guestMul ?? 1)));
}
