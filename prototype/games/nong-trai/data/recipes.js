// Công thức Xưởng — đúng bảng DESIGN-2.0 §2.3. Thuần dữ liệu.
// inputs: { itemId: số lượng } (trừ lúc bấm "Bắt đầu"). ms: thời gian chạy. output × qty vào kho khi "Nhận". xp: khi nhận.
// level: cấp người chơi cần (mặc định = cấp mở máy). machineLevel: level máy cần (Bánh flan cần Lò bánh level 2).

const R = (id, machine, name, inputs, ms, output, qty, xp, level, machineLevel = 1) =>
  ({ id, machine, name, inputs, ms, output, qty, xp, level, machineLevel });

export const RECIPES = [
  R("mut-dau", "bep-sen", "Mứt dâu", { "dau-tay": 3 }, 120_000, "mut-dau", 1, 8, 4),
  R("sot-ca-chua", "bep-sen", "Sốt cà chua", { "ca-chua": 3 }, 90_000, "sot-ca-chua", 1, 6, 4),
  R("nuoc-ep-ca-rot", "bep-sen", "Nước ép cà rốt", { "ca-rot": 4 }, 60_000, "nuoc-ep-ca-rot", 1, 4, 4),
  R("thuc-an-gia-suc", "coi-xay", "Thức ăn gia súc ×3", { ngo: 2 }, 60_000, "thuc-an-gia-suc", 3, 4, 5),
  R("bot-gao", "coi-xay", "Bột gạo", { lua: 2 }, 120_000, "bot-gao", 1, 7, 6), // lúa mở ở cấp 6
  R("bap-rang", "lo-banh", "Bắp rang", { ngo: 2 }, 90_000, "bap-rang", 1, 7, 8),
  R("banh-trung", "lo-banh", "Bánh trứng", { "trung-ga": 2, "bot-gao": 1 }, 240_000, "banh-trung", 1, 14, 8),
  R("banh-bi-ngo", "lo-banh", "Bánh bí ngô", { "bi-ngo": 1, "bot-gao": 1, "trung-ga": 1 }, 300_000, "banh-bi-ngo", 1, 16, 8),
  R("bo", "may-bo-sua", "Bơ", { sua: 2 }, 180_000, "bo", 1, 12, 12),
  R("pho-mai", "may-bo-sua", "Phô mai", { sua: 3 }, 360_000, "pho-mai", 1, 20, 12),
  R("duong", "noi-duong", "Đường", { mia: 2 }, 180_000, "duong", 1, 12, 13),
  R("banh-flan", "lo-banh", "Bánh flan", { "trung-ga": 2, sua: 1, duong: 1 }, 360_000, "banh-flan", 1, 26, 16, 2),
  // Milestone 6: 6 công thức mới trên máy đã có (đủ 30 món cho Sổ sưu tập). Giá ra ≈ 1,29–1,31 × giá vào (§2.1 "1,25–1,45×"),
  // giá trị cộng thêm / phút-máy 12–14,5 (ngang bánh flan, bơ) ⇒ không công thức nào "ăn đứt" món cũ.
  R("banh-ngo", "lo-banh", "Bánh ngô", { ngo: 3, "trung-ga": 1 }, 180_000, "banh-ngo", 1, 11, 9),
  R("sinh-to-dau", "may-bo-sua", "Sinh tố dâu", { "dau-tay": 3, sua: 1 }, 180_000, "sinh-to-dau", 1, 12, 12),
  R("bap-rang-bo", "lo-banh", "Bắp rang bơ", { ngo: 2, bo: 1 }, 300_000, "bap-rang-bo", 1, 22, 13),
  R("che-bi-ngo", "noi-duong", "Chè bí ngô", { "bi-ngo": 1, duong: 1 }, 300_000, "che-bi-ngo", 1, 18, 14),
  R("sua-chua", "may-bo-sua", "Sữa chua", { sua: 2, duong: 1 }, 360_000, "sua-chua", 1, 27, 15),
  R("banh-gao", "lo-banh", "Bánh gạo", { "bot-gao": 2, duong: 1 }, 360_000, "banh-gao", 1, 26, 17),
];

export const RECIPE = Object.freeze(Object.assign(Object.create(null), Object.fromEntries(RECIPES.map((r) => [r.id, r]))));
export const recipesOf = (machineId) => RECIPES.filter((r) => r.machine === machineId);
