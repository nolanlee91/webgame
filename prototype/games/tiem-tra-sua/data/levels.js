// 20 cấp theo docs/tiem-tra-sua/ECONOMY.md. `xp` = XP tích lũy để đạt cấp. Mở khóa nguyên liệu / công thức đọc từ trường `unlock`
// trong data/ingredients.js + data/recipes.js; `perks` là quyền mua/dùng thiết bị, trang trí, sự kiện (Milestone 3–4 nối giao diện).
export const MAX_LEVEL = 20;
export const LEVELS = [
// Milestone 5: XP kéo dài theo bộ mô phỏng (tools/sim/fit.mjs, hồ sơ "average"): cấp 4 ≈ 10 phút, 7 ≈ 40 phút, 10 ≈ 2 giờ, 20 ≈ 11 giờ chơi.
// Bảng cũ (v1–v3) ở core/state.js OLD_XP; bản lưu cũ được quy đổi giữ nguyên cấp.
  { level: 1,  xp: 0,    note: "Hai công thức, một chỗ pha và bếp mẻ 3 phần" },
  { level: 2,  xp: 35,   note: "Ô long, thạch và nhiệm vụ ngày", perks: ["daily-goals"] },
  { level: 3,  xp: 70,   note: "Sữa tươi, sốt đường đen và khách gọi hai ly", perks: ["two-cup-orders"] },
  { level: 4,  xp: 115,  note: "Trà vải lài, đèn mây", perks: ["decor:premium-lantern"] },
  { level: 5,  xp: 360,  note: "Máy đóng nắp tốt (140k), giảm 1 giây mỗi ly", perks: ["machine:powered-sealer"] },
  { level: 6,  xp: 580,  note: "Kem sữa và nâng kho 80 → 130 phần (180k)", perks: ["storage:130"] },
  { level: 7,  xp: 870,  note: "Bếp 2 ngăn (240k), nấu hai mẻ cùng lúc", perks: ["machine:dual-pot-cooker"] },
  { level: 8,  xp: 1450,  note: "Matcha, pudding và nhóm khách VIP", perks: ["customer:vip"] },
  { level: 9,  xp: 2100,  note: "Bàn pha đôi (320k), pha hai ly song song", perks: ["machine:double-station"] },
  { level: 10, xp: 3000,  note: "Chanh dây, đơn ba ly giờ cao điểm", perks: ["three-cup-orders"] },
  { level: 11, xp: 3625,  note: "Ghế tre và bộ trang trí cửa kính", perks: ["decor:tea-table-set"] },
  { level: 12, xp: 4380,  note: "Nhà cung cấp thứ hai, giao gấp +15%", perks: ["supplier:express"] },
  { level: 13, xp: 5225, note: "Tủ mát (300k), giảm hao topping đã nấu", perks: ["machine:upright-fridge"] },
  { level: 14, xp: 6240, note: "Quảng bá địa phương bằng tiền ảo", perks: ["promo"] },
  { level: 15, xp: 7530, note: "Máy định lượng (460k), nhớ mức đường/đá", perks: ["machine:portion-dispenser"] },
  { level: 16, xp: 9005, note: "Biển hiệu đèn, tăng nhẹ khách đi ngang", perks: ["decor:lit-signboard"] },
  { level: 17, xp: 10835, note: "Bàn pha ba chỗ (620k)", perks: ["machine:triple-station"] },
  { level: 18, xp: 12950, note: "Hội chợ và đơn nhóm kết hợp", perks: ["event:fair"] },
  { level: 19, xp: 15415, note: "Nội thất hoàn thiện, tăng trần trang trí", perks: ["decor:cap"] },
  { level: 20, xp: 18260, note: "Huy hiệu Chủ Tiệm, lịch ca thử thách", perks: ["badge:chu-tiem"] },
];
