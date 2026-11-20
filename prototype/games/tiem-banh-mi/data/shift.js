// Nhịp ca và toạ độ cảnh (docs/tiem-banh-mi/GAME-DESIGN.md §3, ART-DIRECTION.md §6).
// Một ca dài 4 phút thực = 240 000 ms ca. Đồng hồ trong game chạy qua ba buổi: cao điểm sáng, trưa vắng, chiều tối.

/** Ba buổi: [bắt đầu ms ca, kết thúc ms ca), giờ hiển thị, phần khách, hệ số kiên nhẫn. */
export const PHASES = [
  { id: "sang", name: "Cao điểm sáng", from: 0, to: 105000, clock: [5 * 60 + 30, 8 * 60], share: 0.55, patience: 0.8 },
  { id: "trua", name: "Trưa vắng", from: 105000, to: 150000, clock: [11 * 60, 13 * 60], share: 0.15, patience: 1.1 },
  { id: "chieu", name: "Chiều tối", from: 150000, to: 240000, clock: [16 * 60, 19 * 60], share: 0.3, patience: 1 },
];
export const SHIFT_MS = 240000;
/** Băng chữ khi đổi buổi. */
export const PHASE_BANNER = {
  trua: "Trưa vắng rồi, tranh thủ nướng bánh cho buổi chiều.",
  chieu: "Chiều tối: dân văn phòng tan ca, phụ huynh đón con. Chuẩn bị bánh!",
};

/** Ngày thường: số khách theo ngày + cấp (bộ mô phỏng M5 chỉnh lại). */
export const NORMAL_DAY = { minGuests: 11, maxGuests: 22, multiFromDay: 2, multiChance: 0.18 };
/** Ngày 1 (hướng dẫn): ít khách, kiên nhẫn dài, khách đầu tới lúc 6 giây, gợi ý từng bước. */
export const TUTORIAL = { guests: 10, patienceMul: 1.8, firstAt: 6000, gap: 14000 };

/** Toạ độ cảnh xe đẩy (ART-DIRECTION §6, đề xuất). Manifest Codex có placements thì dùng giá trị thật (render/scene.js). */
export const CART = {
  entry: [1260, 590],
  queue: [[760, 600], [870, 625], [980, 650], [1090, 670]],
  exit: [[700, 640], [400, 670], [20, 660]],
  baker: [580, 444],
  oven: [380, 418], toaster: [470, 420], sauce: [430, 424], pate: [520, 424], board: [590, 426], pickle: [655, 424],
  herb: [700, 426], display: [810, 422], paper: [905, 430], cash: [940, 432], gas: [360, 560], tea: [1010, 560],
};
export const WALK_MS = 2600;
export const ORDER_ANIM_MS = 1200;
export const BUBBLE_MS = 4200;
