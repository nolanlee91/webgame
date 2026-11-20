// Nhóm khách (GAME-DESIGN §3.4). sprite = vai trong atlas (asset-spec: characters, customer-walk-cycles, -reactions, -actions).
// self / call = khách tự xưng / gọi chủ tiệm (chủ tiệm nam). patience = ms ca. pay = khả năng chuyển khoản, bigBill = thích tờ lớn.
// quirks = trọng số biến thể hay gặp ở nhóm này. Tên hư cấu.
export const ARCHETYPES = {
  student: {
    label: "Học sinh", sprite: "student", patience: 40000, unlock: 1, weight: { sang: 4, trua: 1, chieu: 2 },
    self: "em", call: "anh", names: ["Bin", "Tí", "Khoa", "Bơ", "Tôm", "Na", "Su", "Gạo", "Mít", "Bắp"],
    likes: ["pate-bo", "pate-bo", "cha-lua", "trung"], transfer: 0.1, bigBill: 0.1, exact: 0.4,
    quirks: { "khong-hanh": 1, "it-ot": 2, "khong-ot": 1, "nhieu-pate": 2, "gion-gion": 1 },
  },
  worker: {
    label: "Thợ hồ", sprite: "worker", patience: 50000, unlock: 1, weight: { sang: 4, trua: 1, chieu: 1 },
    self: "anh", call: "em", names: ["Anh Hải", "Anh Lộc", "Anh Tư", "Anh Sơn", "Anh Tài", "Anh Mạnh"],
    likes: ["cha-lua", "cha-lua", "pate-bo", "trung", "thap-cam"], transfer: 0, bigBill: 0.5, exact: 0.15,
    quirks: { "nhieu-ot": 3, "nhieu-pate": 2, "them-trung": 2, "khong-hanh": 1 },
  },
  shipper: {
    label: "Shipper", sprite: "shipper", patience: 35000, unlock: 1, weight: { sang: 2, trua: 2, chieu: 2 },
    self: "em", call: "anh", names: ["Chị Hạnh", "Chị Vy", "Chị Thơ", "Chị Lan", "Chị Mỹ"],
    likes: ["pate-bo", "cha-lua", "thit-nuong"], transfer: 0.2, bigBill: 0.2, exact: 0.3, bag: true,
    quirks: { "khong-hanh": 1, "it-ot": 1, "cat-doi": 1 },
  },
  office: {
    label: "Dân văn phòng", sprite: "office", patience: 45000, unlock: 1, weight: { sang: 3, trua: 1, chieu: 3 },
    self: "chị", call: "em", names: ["Chị Thảo", "Chị Ngân", "Chị Uyên", "Chị My", "Chị Trâm", "Chị Quyên"],
    likes: ["cha-lua", "pate-bo", "ga-xe", "chay"], transfer: 0.45, bigBill: 0.25, exact: 0.2,
    quirks: { "khong-hanh": 3, "it-ot": 3, "khong-do-chua": 1, "gion-gion": 1 },
  },
  regular: {
    label: "Khách quen", sprite: "regular", patience: 70000, unlock: 1, weight: { sang: 3, trua: 1, chieu: 2 },
    self: "cụ", call: "con", names: ["Cụ Năm", "Bác Tư Sửa Xe", "Cô Hoa Bán Vé Số", "Chú Lực Đầu Hẻm"],
    likes: ["cha-lua", "pate-bo"], transfer: 0, bigBill: 0, exact: 0.8, regular: true,
    quirks: { "gion-gion": 2, "nhieu-pate": 1, "khong-ot": 1 },
  },
  parent: {
    label: "Phụ huynh", sprite: "parent", patience: 50000, unlock: 1, weight: { sang: 3, trua: 1, chieu: 3 },
    self: "chị", call: "em", names: ["Chị Hương", "Chị Diễm", "Chị Loan", "Chị Phượng", "Chị Thu"],
    likes: ["pate-bo", "cha-lua", "trung"], transfer: 0.15, bigBill: 0.2, exact: 0.25,
    quirks: { "cat-doi": 3, "khong-ot": 3, "khong-hanh": 1 },
  },
  reviewer: {
    label: "Reviewer", sprite: "reviewer", patience: 55000, unlock: 1, minRep: 55, weight: { sang: 1, trua: 1, chieu: 1 },
    self: "mình", call: "anh", names: ["Tí Mập Ăn Sáng", "Ngọc Giòn Rụm", "Bé Su Review"],
    likes: ["cha-lua", "thap-cam", "thit-nuong"], transfer: 0.3, bigBill: 0.3, exact: 0.2,
    quirks: { "gion-gion": 3, "nhieu-pate": 1 },
  },
  tourist: {
    label: "Khách Tây", sprite: "tourist", patience: 60000, unlock: 6, weight: { sang: 0, trua: 2, chieu: 2 },
    self: "tôi", call: "anh", names: ["Ollie", "Mia", "Lukas", "Sofia", "Tom"],
    likes: ["thit-nuong", "cha-lua", "ga-xe"], transfer: 0.5, bigBill: 0.4, exact: 0.1,
    quirks: { "khong-ot": 2, "nhieu-ot": 1 },
  },
};
export const ARCH_IDS = Object.keys(ARCHETYPES);

/** Khách quen có tên cố định + món "như cũ" (Sổ khách quen hiện sau 2 lần phục vụ ≥ 4 sao). */
export const REGULARS = {
  "Cụ Năm": { self: "cụ", recipe: "cha-lua", quirks: ["gion-gion", "khong-ot"] },
  "Bác Tư Sửa Xe": { self: "bác", recipe: "pate-bo", quirks: ["nhieu-pate"] },
  "Cô Hoa Bán Vé Số": { self: "cô", recipe: "cha-lua", quirks: ["khong-hanh"] },
  "Chú Lực Đầu Hẻm": { self: "chú", recipe: "pate-bo", quirks: ["nhieu-ot"] },
};
export const REGULAR_KNOWN_AT = 2;
