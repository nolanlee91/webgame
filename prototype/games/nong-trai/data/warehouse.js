// Nhà kho (DESIGN-2.0 §2.7): sức chứa 60 → 90 → 130 → 180 → 250 → 320 (mốc 320: Milestone 5). Nông sản + thành phẩm + sản phẩm động vật tính chung;
// vật liệu không tính. Nâng bằng xu; từ mốc 130 cần thêm vật liệu (lấy từ đơn đặc biệt / thu hoạch hiếm).
// minLevel: cấp người chơi cần để nâng lên mốc này. Milestone 3: Nhà kho phải XÂY trước (cấp 3, data/buildings.js) nên mốc 90
// cũng mở ở cấp 3 (bản M1/M2 cho nâng ở cấp 2 — người đã nâng giữ nguyên mốc qua core/build.js migrate).
// Hai mốc cuối ×4 / ×5 (tools/sim/report.md: người chơi chăm tích hàng trăm nghìn xu không có chỗ tiêu).
export const WAREHOUSE = [
  { cap: 60, cost: 0, minLevel: 1, materials: {} },
  { cap: 90, cost: 80, minLevel: 3, materials: {} },
  { cap: 130, cost: 400, minLevel: 6, materials: { "van-go": 2, "hop-dinh": 2 } },
  { cap: 180, cost: 3600, minLevel: 15, materials: { "van-go": 5, "hop-dinh": 5, "thung-son": 2 } },
  { cap: 250, cost: 9000, minLevel: 18, materials: { "van-go": 10, "hop-dinh": 10, "thung-son": 5 } },
  // Milestone 5: mốc cuối cho người chơi đã mở hết đất (43 ô) — chỗ tiêu xu muộn (tools/sim/report.md).
  { cap: 320, cost: 24000, minLevel: 19, materials: { "van-go": 12, "hop-dinh": 12, "thung-son": 8 } },
];
/** Giỏ tràn: hàng thu hoạch khi kho đầy, tối đa 10 món. */
export const OVERFLOW_MAX = 10;
