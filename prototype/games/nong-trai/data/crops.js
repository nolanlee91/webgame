// Cấu hình cây trồng (DESIGN-2.0 §2.2). Thuần dữ liệu — luật nằm ở core/.
// atlasRow: hàng trong assets/garden/crops.webp (5 giai đoạn). null ⇒ chưa có atlas, giao diện vẽ icon từ assets/v3/items.webp.
// requires: công trình cần có (Mía cần Nhà kính — Milestone 3), chưa có công trình ⇒ luôn khoá, không hiện trên khay hạt.
export const CROPS = [
  { id: "ca-rot", name: "Cà rốt", level: 1, seed: 2, growMs: 30_000, sell: 6, xp: 2, atlasRow: 0, uses: "Đơn hàng · Nước ép cà rốt (Xưởng, sắp có)" },
  { id: "ca-chua", name: "Cà chua", level: 1, seed: 5, growMs: 60_000, sell: 12, xp: 4, atlasRow: 1, uses: "Đơn hàng · Sốt cà chua (Xưởng, sắp có)" },
  { id: "dau-tay", name: "Dâu tây", level: 2, seed: 8, growMs: 90_000, sell: 18, xp: 6, atlasRow: 2, uses: "Đơn hàng · Mứt dâu (Xưởng, sắp có)" },
  { id: "ngo", name: "Ngô", level: 3, seed: 12, growMs: 180_000, sell: 29, xp: 10, atlasRow: 3, uses: "Đơn hàng · Bắp rang, thức ăn gia súc (sắp có)" },
  { id: "bi-ngo", name: "Bí ngô", level: 4, seed: 20, growMs: 300_000, sell: 47, xp: 16, atlasRow: 4, uses: "Đơn hàng · Bánh bí ngô (sắp có)" },
  { id: "lua", name: "Lúa", level: 6, seed: 10, growMs: 240_000, sell: 26, xp: 12, atlasRow: null, uses: "Đơn hàng · Bột gạo (Cối xay, sắp có)" },
  { id: "mia", name: "Mía", level: 10, requires: "nha-kinh", seed: 24, growMs: 480_000, sell: 58, xp: 20, atlasRow: null, uses: "Đường (Nồi đường, sắp có)" },
];
export const CROP = Object.freeze(Object.assign(Object.create(null), Object.fromEntries(CROPS.map((c) => [c.id, c]))));
/** Cây có thể hiện trên khay hạt ở Milestone 1 (không cần công trình chưa có). */
export const FIELD_CROPS = CROPS.filter((c) => !c.requires);
