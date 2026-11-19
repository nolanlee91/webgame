// Tiến trình 20 cấp (DESIGN-2.0 §3) dưới dạng dữ liệu. XP mỗi cấp: core/progression.js xpNeed (60·cấp²).
// milestone: bản nào hiện thực món mở khoá. Giao diện chỉ báo / dùng món có milestone ≤ CURRENT_MILESTONE ⇒ không có nút giả.
// Hàng rào đá chưa có sprite ⇒ milestone 5 (không báo khi lên cấp).
export const CURRENT_MILESTONE = 3;
export const MAX_LEVEL = 20;

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
  { lv: 10, unlocks: [feat("greenhouse", "Nhà kính + cây mía", 3)] },
  { lv: 11, unlocks: [feat("orders-special", "Đơn đặc biệt (Anh Út)"), feat("order-slot-6", "Ô đơn thứ 6")] },
  { lv: 12, unlocks: [feat("butter", "Máy bơ sữa", 4)] },
  { lv: 13, unlocks: [feat("workshop-2", "Nâng Xưởng cấp 2 (+1 ô hàng chờ mọi máy)", 2), feat("sugar", "Nồi đường", 4)] },
  { lv: 14, unlocks: [feat("npc-chains", "Nhiệm vụ chuỗi của NPC", 4)] },
  { lv: 15, unlocks: [feat("warehouse-4", "Nhà kho cấp 4"), feat("stone-fence", "Hàng rào đá", 5)] },
  { lv: 16, unlocks: [feat("bakery-2", "Lò bánh cấp 2", 4)] },
  { lv: 17, unlocks: [feat("east-land", "Khu đất phía Đông", 3)] },
  { lv: 18, unlocks: [feat("special-2", "Đơn đặc biệt hai lúc", 5), feat("fair", "Phiên chợ", 5), feat("warehouse-5", "Nhà kho cấp 5")] },
  { lv: 19, unlocks: [feat("rare-decor", "Trang trí hiếm ở chợ", 2)] },
  { lv: 20, unlocks: [feat("fame", "Nông trại danh tiếng", 5)] },
];

/** Cấp mở một tính năng (theo LEVELS). Không có ⇒ Infinity. */
export function featureLevel(id) {
  for (const { lv, unlocks } of LEVELS) if (unlocks.some((u) => u.kind === "feature" && u.id === id)) return lv;
  return Infinity;
}

/** Số ô đơn thường/kết hợp theo cấp: 3, +1 ở cấp 3, 6, 11 (tối đa 6). */
export const ORDER_SLOT_LEVELS = [1, 1, 1, featureLevel("order-slot-4"), featureLevel("order-slot-5"), featureLevel("order-slot-6")];
