// Nhân vật Drama (docs/tiem-banh-mi/DRAMA.md §1). portrait = tên người trong drama-portraits-hd.webp (đợt 2: "<id>-<biểu cảm>"),
// role = vai trong cảnh dùng làm chân dung dự phòng khi chưa có ảnh HD (portraits-hd "<role>", rồi characters "<role>").
// self / call = người đó tự xưng / gọi chủ tiệm (chủ tiệm nam). Tên, tiệm, công ty đều hư cấu.
export const NPCS = {
  me: { name: "Mẹ", self: "mẹ", call: "con", role: "parent" },
  "chu-tam": { name: "Chú Tám", self: "chú", call: "con", role: "worker" },
  "anh-bay": { name: "Anh Bảy", self: "anh", call: "em", role: "regular" },
  "ba-tu": { name: "Bà Tư", self: "bà", call: "con", role: "regular" },
  "chi-mai": { name: "Chị Mai", self: "chị", call: "em", role: "office" },
  "cau-hung": { name: "Cậu Hưng", self: "em", call: "anh", role: "student" },
  "co-hai": { name: "Cô Hai", self: "cô", call: "con", role: "parent" },
  "co-sau": { name: "Cô Sáu", self: "cô", call: "con", role: "regular" },
  "co-thanh": { name: "Cô Thanh", self: "cô", call: "con", role: "office" },
  "anh-lam": { name: "Anh Lâm", self: "anh", call: "em", role: "shipper" },
  "be-na": { name: "Bé Na", self: "con", call: "chú", role: "student" },
  ollie: { name: "Ollie", self: "tôi", call: "anh", role: "tourist" },
  // nhân vật phụ (không có chân dung riêng, dùng vai trong cảnh)
  "cu-nam": { name: "Cụ Năm", self: "cụ", call: "con", role: "regular" },
  "chi-hanh": { name: "Chị Hạnh", self: "em", call: "anh", role: "shipper" },
  "chi-thao": { name: "Chị Thảo", self: "chị", call: "em", role: "office" },
  "ti-map": { name: "Tí Mập Ăn Sáng", self: "mình", call: "anh", role: "reviewer" },
  "co-giao": { name: "Cô giáo lớp 11A2", self: "cô", call: "em", role: "parent" },
  "to-truong": { name: "Tổ trưởng tổ dân phố", self: "tôi", call: "cậu", role: "regular" },
  "lao-cong": { name: "Ông lao công", self: "tôi", call: "cậu", role: "worker" },
  mc: { name: "MC hội chợ", self: "mình", call: "anh chủ tiệm", role: "office" },
  "cu-dan-mang": { name: "Cư dân mạng", self: "mình", call: "chủ tiệm", role: "reviewer" },
};
export const NPC_IDS = Object.keys(NPCS);
/** Người có chân dung riêng trong drama-portraits-hd (asset-spec đợt 2). */
export const DRAMA_FACES = ["me", "chu-tam", "anh-bay", "ba-tu", "chi-mai", "cau-hung", "co-hai", "co-sau", "co-thanh", "anh-lam", "be-na", "ollie"];
export const MOODS = ["neutral", "happy", "annoyed", "surprised"];
