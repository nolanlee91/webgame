// Nhà kho (DESIGN-2.0 §2.7): sức chứa 60 → 90 → 130 → 180 → 250. Nông sản + thành phẩm + sản phẩm động vật tính chung;
// vật liệu không tính. Nâng bằng xu; từ mốc 130 cần thêm vật liệu (lấy từ đơn đặc biệt / thu hoạch hiếm).
// minLevel: cấp người chơi cần để nâng lên mốc này.
export const WAREHOUSE = [
  { cap: 60, cost: 0, minLevel: 1, materials: {} },
  { cap: 90, cost: 80, minLevel: 2, materials: {} },
  { cap: 130, cost: 400, minLevel: 6, materials: { "van-go": 2, "hop-dinh": 2 } },
  { cap: 180, cost: 900, minLevel: 15, materials: { "van-go": 5, "hop-dinh": 5, "thung-son": 2 } },
  { cap: 250, cost: 1800, minLevel: 18, materials: { "van-go": 10, "hop-dinh": 10, "thung-son": 5 } },
];
/** Giỏ tràn: hàng thu hoạch khi kho đầy, tối đa 10 món. */
export const OVERFLOW_MAX = 10;
