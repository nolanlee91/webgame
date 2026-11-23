// Toạ độ cảnh dự phòng (ART-DIRECTION §6–§7, đề xuất cho Codex). Khi docs/quan-com-tam/asset-manifest.json có `placements`
// (Codex ghi theo tranh thật) thì core/placements.js dùng giá trị trong manifest; ở đây chỉ là dự phòng để chơi được trước khi có art.
// Quy ước: khoá không tiền tố thuộc quan-scene, tiền tố street- thuộc street-scene (giống asset-spec.json).

const T2 = (id, at, unlock, joinWith) => ({
  id, seats: 2, unlock, at, joinWith,
  seatSpots: [{ at: [at[0] - 100, at[1] + 6], face: "right" }, { at: [at[0] + 100, at[1] + 6], face: "left" }],
  plateSpots: [[at[0] - 30, at[1] - 120], [at[0] + 30, at[1] - 120]],
  servePoint: [at[0], 610],
});
const T4 = (id, at, unlock) => ({
  id, seats: 4, unlock, at,
  seatSpots: [{ at: [at[0] - 120, at[1] - 20], face: "right" }, { at: [at[0] - 105, at[1] + 18], face: "right" }, { at: [at[0] + 120, at[1] - 20], face: "left" }, { at: [at[0] + 105, at[1] + 18], face: "left" }],
  plateSpots: [[at[0] - 40, at[1] - 126], [at[0] - 34, at[1] - 114], [at[0] + 40, at[1] - 126], [at[0] + 34, at[1] - 114]],
  servePoint: [at[0], 610],
});

/** Quầy giống nhau ở hai cảnh (ART-DIRECTION §7). */
const COUNTER = {
  owner: [330, 520], grill: [235, 408], "suon-tray": [80, 410], "charcoal-sack": [40, 600], "plate-stack": [400, 410], "bi-tray": [440, 412],
  "mo-hanh-pot": [478, 412], "sauce-jar": [512, 414], "chili-jar": [538, 414], "glass-case": [585, 396], "pickle-jar": [615, 414],
  "cucumber-tray": [645, 414], "box-stack": [672, 414], "cash-tin": [560, 300], ledger: [610, 302], "rice-cooker": [440, 322],
  "soup-pot": [560, 322], steamer: [620, 322], "egg-pan": [680, 324], "tea-cooler": [690, 560], "wash-tub": [90, 456], "water-can": [40, 456],
};
/**
 * A: hệ số hiện trong cảnh theo từng sheet (dữ liệu, không hằng số trong code vẽ). Đợt 1 Codex vẽ thiết bị (nồi cơm cao ~132 px trong ô 192)
 * và ly trà to gấp đôi thước cảnh ⇒ hiện ×0,5. Luật chỉ áp khi manifest còn ĐÚNG bản đó (dấu vân tay: productionStatus + dimensions);
 * Codex giao bản vẽ đúng thước (manifest đổi trạng thái / cỡ) ⇒ tự hiện ×1. Item trong manifest có `displayScale` ⇒ dùng số đó (ưu tiên nhất).
 * frames: chỉ áp cho frame khớp (table-items: ly trà ×0,5, ghế / dĩa đang ăn ×1).
 */
export const SHEET_SCALE = {
  "assets/equipment.webp": { scale: 0.5, match: { productionStatus: "produced-wave-1", dimensions: [1344, 1536] } },
  "assets/table-items.webp": { scale: 0.5, frames: /^tea-glass-/, match: { productionStatus: "produced-wave-1", dimensions: [672, 192] } },
};
/** Toạ độ 6 chỗ trên vỉ, tương đối anchor bếp (ART-DIRECTION §6). */
export const GRILL_SLOTS = [[-100, -40], [-60, -40], [-20, -40], [20, -40], [60, -44], [100, -44]];

export const STREET = {
  ...COUNTER,
  awning: [340, 150], signboard: [600, 620], "lantern-string": [800, 40],
  entry: [1300, 620],
  waitSpots: [[1245, 605], [1210, 628]],
  queueSpots: [[160, 700], [290, 712]],
  exitPath: [[1180, 612], [1300, 620]],
  aisle: [[690, 545], [700, 610], [1280, 610]],
  tables: [T2("s1", [800, 530], 1, "s2"), T2("s2", [1090, 530], 1, "s1"), T2("s3", [800, 680], 3, "s4"), T2("s4", [1090, 680], 5, "s3")],
};
export const QUAN = {
  ...COUNTER,
  "helper-home": [700, 600], "grill-2": [210, 326], "rice-cooker-2": [500, 322], "electric-blower": [372, 414], "smoke-hood": [235, 290],
  entry: [1245, 440],
  waitSpots: [[1200, 462], [1150, 458], [1100, 455], [1040, 452]], // V: chỗ thứ 4 (ghế chờ cấp 16)
  queueSpots: [[160, 700], [290, 712], [60, 690]],
  exitPath: [[1245, 610], [1245, 440]],
  aisle: [[690, 545], [700, 610], [1245, 610]],
  tables: [T2("q1", [820, 530], 7), T2("q2", [1100, 530], 7), T4("q3", [820, 680], 7), { ...T2("q4", [520, 690], 10), servePoint: [560, 610] }, T4("q5", [1130, 680], 13)],
};
