// Bảng đơn hàng (DESIGN-2.0 §2.6). Thuần dữ liệu — bộ sinh đơn nằm ở core/orders.js.
// mult: hệ số thưởng xu so với giá chợ ([min, max], chọn ngẫu nhiên có seed rồi lưu trong đơn).
// xpMult: hệ số XP. items: số loại món [min, max]. qty: tỉ lệ so với "sản lượng một vụ" của món (xem core/orders.js).
// Cấp mở từng loại đơn đọc từ data/levels.js (orders / orders-combo / orders-special).
export const ORDER_TYPES = {
  thuong: { name: "Đơn thường", mult: [1.15, 1.2], xpMult: 1, items: [1, 2], qty: [0.4, 1], npcs: ["co-hai", "chi-ba", "bac-tu"] },
  "ket-hop": { name: "Đơn kết hợp", mult: [1.3, 1.3], xpMult: 1.5, items: [3, 4], qty: [0.25, 0.6], npcs: ["bac-tu"] },
  "dac-biet": { name: "Đơn đặc biệt", mult: [1.35, 1.35], xpMult: 1.5, items: [2, 3], qty: [0.7, 1.3], npcs: ["anh-ut"],
    durationMs: 2 * 3600_000, materials: { kinds: [1, 2], qty: [1, 2] } },
};
/** Bỏ đơn ⇒ đơn mới sau 2 phút (theo mốc thời gian, chạy cả khi tắt trang). */
export const CANCEL_REFILL_MS = 120_000;
/** Đơn đặc biệt hết hạn / đã giao ⇒ đơn đặc biệt tiếp theo sau 15 phút. */
export const SPECIAL_COOLDOWN_MS = 15 * 60_000;
/** Tỉ lệ một ô đơn mới là đơn kết hợp (khi đã mở), tối đa số đơn kết hợp cùng lúc. */
export const COMBO_CHANCE = 0.35, COMBO_MAX = 2;
/** Ba đơn đầu cho người mới: dễ, chỉ cà rốt / cà chua. Đơn đầu là của Bác Tư (DESIGN §4). */
export const FIRST_ORDERS = [
  { type: "thuong", npc: "bac-tu", items: { "ca-rot": 2 }, mult: 1.2 },
  { type: "thuong", npc: "co-hai", items: { "ca-chua": 1, "ca-rot": 1 }, mult: 1.2 },
  { type: "thuong", npc: "chi-ba", items: { "ca-rot": 3 }, mult: 1.15 },
];
/** Công thức đơn của bản v2 (chưa commit) — chỉ dùng để di chuyển bản lưu cũ sang v3. */
export const LEGACY_RECIPES = [
  { "ca-rot": 2 }, { "ca-chua": 2, "ca-rot": 1 }, { "ca-chua": 1, "ca-rot": 2 },
  { "ca-chua": 3 }, { "dau-tay": 2, "ca-chua": 1 },
  { "ngo": 2, "dau-tay": 1 }, { "bi-ngo": 1, "ngo": 1 },
];
