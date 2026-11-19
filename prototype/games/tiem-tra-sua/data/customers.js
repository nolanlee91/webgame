// Nhóm khách (docs/tiem-tra-sua/GAME-DESIGN.md, "Khách và nhịp vận hành"). Nhân vật và tên đều hư cấu.
// sprite = vai trong atlas (customer-reactions / customer-actions / characters / portraits). Không có vai thì xem render/atlas.js FALLBACK.
// expect = kỳ vọng riêng (15 điểm của review): topping | speed | exact | base.
// self/call = cách xưng hô (khách tự xưng / gọi chủ quán) để thoại tự nhiên.
export const ARCHETYPES = {
  "hoc-sinh": {
    label: "Học sinh", sprite: "regular", patience: 65000, expect: "topping", unlock: 1, weight: 3,
    self: "em", call: "chị", names: ["Tí", "Bin", "Khoa", "Tuấn Kiệt", "Bơ", "Tôm"],
    prefs: { sugar: [50, 70, 70, 100], ice: ["it", "vua", "vua"] }, likes: ["tra-sua-truyen-thong", "o-long-thach", "sua-tuoi-duong-den"],
  },
  "van-phong": {
    label: "Dân văn phòng", sprite: "office-worker", patience: 48000, expect: "speed", unlock: 1, weight: 3,
    self: "anh", call: "em", names: ["Anh Tùng", "Anh Hải", "Anh Long", "Anh Quân", "Anh Phát"],
    prefs: { sugar: [30, 50, 50, 0], ice: ["vua", "nhieu", "it"] }, likes: ["tra-dao", "tra-vai-lai", "o-long-kem-sua"],
  },
  "khach-quen": {
    label: "Khách quen", sprite: "neighbor", patience: 70000, expect: "exact", unlock: 1, weight: 2,
    self: "cô", call: "con", names: ["Cô Tư", "Cô Sáu", "Bà Năm", "Cô Bảy"],
    prefs: { sugar: [30, 30, 50], ice: ["it", "khong", "it"] }, likes: ["tra-sua-truyen-thong", "tra-dao", "o-long-kem-sua"],
  },
  "di-ngang": {
    label: "Khách đi ngang", sprite: "courier", patience: 55000, expect: "base", unlock: 1, weight: 2,
    self: "anh", call: "em", names: ["Anh Lộc", "Anh Tèo", "Anh Bảo", "Anh Đạt"],
    prefs: { sugar: [50, 70, 100], ice: ["nhieu", "vua"] }, likes: ["tra-dao", "tra-chanh-day-thach"],
  },
  "reviewer": {
    label: "Reviewer", sprite: "reviewer", patience: 58000, expect: "exact", unlock: 1, minRep: 60, weight: 1,
    self: "mình", call: "chị chủ", names: ["Mi Review", "Hến Đi Ăn", "Bé Ngân Food"],
    prefs: { sugar: [30, 50], ice: ["it", "vua"] }, likes: ["sua-tuoi-duong-den", "matcha-pudding", "o-long-kem-sua"],
  },
  "vip": {
    label: "VIP", sprite: "vip", patience: 44000, expect: "exact", unlock: 8, weight: 1,
    self: "chị", call: "em", names: ["Chị Diễm", "Chị Thu Hà", "Chị Vy"],
    prefs: { sugar: [30, 0, 50], ice: ["it", "khong"] }, likes: ["matcha-pudding", "o-long-kem-sua"],
  },
};
export const ARCHETYPE_IDS = Object.keys(ARCHETYPES);
