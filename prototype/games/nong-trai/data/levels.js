// Tiến trình 20 cấp (DESIGN-2.0 §3) dưới dạng dữ liệu. XP mỗi cấp: XP_TO_NEXT (core/progression.js xpNeed đọc bảng này).
// milestone: bản nào hiện thực món mở khoá. Giao diện chỉ báo / dùng món có milestone ≤ CURRENT_MILESTONE ⇒ không có nút giả.
// Hàng rào đá (chưa có sprite), đơn đặc biệt hai lúc, Phiên chợ ⇒ milestone 6 (để sau, không báo khi lên cấp).
export const CURRENT_MILESTONE = 5;
export const MAX_LEVEL = 20;
/**
 * XP để đi từ cấp lv lên lv + 1 (XP_TO_NEXT[lv − 1]); phần tử cuối = trần XP ở cấp 20.
 * Milestone 5 (tools/sim): ≈ 45·cấp², cấp 4–6 ×0,7 (đoạn này ít nguồn XP: chưa có máy / vật nuôi), từ cấp 14 ×0,92; làm tròn 10.
 * Hồ sơ "chăm": cấp 4 / 7 / 10 / 20 ≈ 10 ph / 39 ph / 1,9 h / 11 h chơi (mục tiêu §3: 10 ph / 40 ph / 2 h / 10–12 h).
 * Bản M4 (60·cấp²) chậm hơn ~1,4 lần: cấp 7 sau 63 ph, cấp 20 sau 15,9 h.
 */
export const XP_TO_NEXT = Object.freeze([50, 180, 410, 500, 790, 1130, 2210, 2880, 3650, 4500, 5450, 6480, 7610, 8110, 9320, 10600, 11960, 13410, 14950, 16560]);

const crop = (id, name) => ({ kind: "crop", id, name, milestone: 1 });
const feat = (id, name, milestone = 1) => ({ kind: "feature", id, name, milestone });

export const LEVELS = [
  { lv: 1, unlocks: [crop("ca-rot", "Cà rốt"), crop("ca-chua", "Cà chua"), feat("orders", "Bảng đơn hàng (3 ô)"), feat("tutorial", "Nhiệm vụ hướng dẫn")] },
  { lv: 2, unlocks: [crop("dau-tay", "Dâu tây"), feat("plots", "Mở thêm ô đất")] }, // nâng kho 90 chỗ: cấp 3, cùng lúc xây Nhà kho (data/warehouse.js minLevel)
  { lv: 3, unlocks: [crop("ngo", "Ngô"), feat("order-slot-4", "Ô đơn thứ 4"), feat("build-warehouse", "Xây Nhà kho trên bản đồ", 3), feat("market", "Khu chợ: vật tư, trang trí", 2)] },
  { lv: 4, unlocks: [crop("bi-ngo", "Bí ngô"), feat("workshop", "Xưởng + Bếp sên", 2)] },
  { lv: 5, unlocks: [feat("orders-combo", "Đơn kết hợp"), feat("mill", "Cối xay (trong Xưởng)", 2)] },
  { lv: 6, unlocks: [crop("lua", "Lúa"), feat("order-slot-5", "Ô đơn thứ 5"), feat("village", "Làng (4 NPC)", 4)] },
  { lv: 7, unlocks: [feat("chicken", "Chuồng gà", 4)] },
  { lv: 8, unlocks: [feat("bakery", "Lò bánh (trong Xưởng)", 2)] },
  { lv: 9, unlocks: [feat("cow", "Chuồng bò", 4)] },
  { lv: 10, unlocks: [feat("greenhouse", "Nhà kính + cây mía", 3), feat("fame-house", "Nâng Nhà: danh hiệu + đơn hàng thêm xu", 5)] },
  { lv: 11, unlocks: [feat("orders-special", "Đơn đặc biệt (Anh Út)"), feat("order-slot-6", "Ô đơn thứ 6")] },
  { lv: 12, unlocks: [feat("butter", "Máy bơ sữa", 4)] },
  { lv: 13, unlocks: [feat("workshop-2", "Nâng Xưởng cấp 2 (+1 ô hàng chờ mọi máy)", 2), feat("sugar", "Nồi đường", 4)] },
  { lv: 14, unlocks: [feat("npc-chains", "Nhiệm vụ chuỗi của NPC", 4)] },
  { lv: 15, unlocks: [feat("warehouse-4", "Nhà kho cấp 4"), feat("stone-fence", "Hàng rào đá", 6)] },
  { lv: 16, unlocks: [feat("bakery-2", "Lò bánh cấp 2", 4)] },
  { lv: 17, unlocks: [feat("east-land", "Khu đất phía Đông", 3)] },
  { lv: 18, unlocks: [feat("special-2", "Đơn đặc biệt hai lúc", 6), feat("fair", "Phiên chợ", 6), feat("warehouse-5", "Nhà kho cấp 5")] },
  { lv: 19, unlocks: [feat("rare-decor", "Trang trí hiếm ở chợ", 2), feat("warehouse-6", "Nhà kho 320 chỗ", 5)] },
  { lv: 20, unlocks: [feat("fame", "Nông trại danh tiếng: bậc Nhà cao nhất", 5)] },
];

/** Cấp mở một tính năng (theo LEVELS). Không có ⇒ Infinity. */
export function featureLevel(id) {
  for (const { lv, unlocks } of LEVELS) if (unlocks.some((u) => u.kind === "feature" && u.id === id)) return lv;
  return Infinity;
}

/** Số ô đơn thường/kết hợp theo cấp: 3, +1 ở cấp 3, 6, 11 (tối đa 6). */
export const ORDER_SLOT_LEVELS = [1, 1, 1, featureLevel("order-slot-4"), featureLevel("order-slot-5"), featureLevel("order-slot-6")];
