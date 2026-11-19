// Cấu hình cây trồng (DESIGN-2.0 §2.2). Thuần dữ liệu — luật nằm ở core/.
// atlasRow: hàng trong atlas 5 giai đoạn (80 px): assets/garden/crops.webp, hoặc assets/v3/crops-2.webp nếu atlas: "crops-2" (lúa, mía).
// null ⇒ chưa có atlas, giao diện vẽ icon từ assets/v3/items.webp.
// "Dùng cho" của mỗi cây tính từ data/recipes.js trong data/catalog.js.
// requires: công trình cần có (Mía cần Nhà kính — Milestone 3), chưa có công trình ⇒ luôn khoá, không hiện trên khay hạt.
export const CROPS = [
  { id: "ca-rot", name: "Cà rốt", level: 1, seed: 2, growMs: 30_000, sell: 6, xp: 2, atlasRow: 0 },
  { id: "ca-chua", name: "Cà chua", level: 1, seed: 5, growMs: 60_000, sell: 12, xp: 4, atlasRow: 1 },
  { id: "dau-tay", name: "Dâu tây", level: 2, seed: 8, growMs: 90_000, sell: 18, xp: 6, atlasRow: 2 },
  { id: "ngo", name: "Ngô", level: 3, seed: 12, growMs: 180_000, sell: 29, xp: 10, atlasRow: 3 },
  { id: "bi-ngo", name: "Bí ngô", level: 4, seed: 20, growMs: 300_000, sell: 47, xp: 16, atlasRow: 4 },
  { id: "lua", name: "Lúa", level: 6, seed: 10, growMs: 240_000, sell: 26, xp: 12, atlas: "crops-2", atlasRow: 0 },
  { id: "mia", name: "Mía", level: 10, requires: "nha-kinh", seed: 24, growMs: 480_000, sell: 58, xp: 20, atlas: "crops-2", atlasRow: 1 },
];
export const CROP = Object.freeze(Object.assign(Object.create(null), Object.fromEntries(CROPS.map((c) => [c.id, c]))));
/** Cây có thể hiện trên khay hạt ở Milestone 1 (không cần công trình chưa có). */
export const FIELD_CROPS = CROPS.filter((c) => !c.requires);
