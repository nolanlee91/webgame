// Công trình Xưởng chế biến trên bản đồ nông trại (DESIGN-2.0 §1 khu 2, §3 cấp 4 và 13). Thuần dữ liệu — luật ở core/workshop.js.
// Milestone 2 chỉ có MỘT công trình (Xưởng) trên lô cố định; chế độ xây dựng đầy đủ + công trình khác là Milestone 3.
// unlock: cấp người chơi. cost / buildMs: giá + thời gian xây (giàn giáo, chạy cả khi tắt trang).
// Xây Xưởng tặng kèm Bếp sên (data/machines.js withWorkshop) — "Xưởng + Bếp sên (150 xu, xây 1 ph)".
// upgrades[i]: nâng Xưởng lên level i+2. Xưởng cấp 2 (§3 cấp 13): +1 ô hàng chờ cho MỌI máy (4 → 5).
export const WORKSHOP = {
  id: "xuong", name: "Xưởng chế biến", unlock: 4, cost: 150, buildMs: 60_000,
  sprite: "xuong-che-bien", upgrades: [{ level: 13, cost: 6000, extraSlots: 1, sprite: "xuong-che-bien-2" }],
};
