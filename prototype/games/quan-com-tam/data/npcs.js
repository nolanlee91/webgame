// Nhân vật Drama Quán Cơm Tấm (docs/quan-com-tam/DRAMA.md §1). 12 người có chân dung riêng trong drama-portraits-hd.webp
// ("<id>-<neutral|happy|annoyed|surprised>", đợt 2). role = vai trong cảnh làm chân dung dự phòng (portrait-expressions-hd → portraits-hd
// → characters). self / call = người đó tự xưng / gọi cô chủ quán. Tên, quán, công ty đều hư cấu.
export const NPCS = {
  me: { name: "Mẹ", self: "mẹ", call: "con", role: "regular" },
  "chu-tu": { name: "Chú Tư", self: "chú", call: "con", role: "worker" },
  "anh-sau": { name: "Anh Sáu", self: "anh", call: "em", role: "driver" },
  "co-ba": { name: "Cô Ba", self: "cô", call: "con", role: "regular" },
  "chu-hoa": { name: "Chú Hòa", self: "chú", call: "con", role: "worker" },
  "co-lan": { name: "Cô Lan", self: "cô", call: "con", role: "office" },
  "anh-quang": { name: "Anh Quang", self: "em", call: "chị", role: "worker2" },
  "bep-vu": { name: "Bếp trưởng Vũ", self: "tôi", call: "chị", role: "office" },
  "mai-an-dem": { name: "Mai Ăn Đêm", self: "Mai", call: "chị", role: "reviewer" },
  bong: { name: "Bông", self: "em", call: "chị", role: "helper" },
  "anh-hung": { name: "Anh Hùng", self: "anh", call: "em", role: "worker" },
  "chi-thu": { name: "Chị Thư", self: "em", call: "chị", role: "office" },
  // khách có tên lặp lại và vai phụ (không có chân dung Drama riêng: dùng vai trong cảnh)
  "co-ut": { name: "Cô Út", self: "cô", call: "con", role: "regular" },
  "dd-hanh": { name: "Điều dưỡng Hạnh", self: "em", call: "chị", role: "nurse" },
  "tx-loc": { name: "Tài xế Lộc", self: "anh", call: "em", role: "driver" },
  teo: { name: "Tèo", self: "em", call: "chị", role: "student" },
  mit: { name: "Mít", self: "em", call: "chị", role: "student2" },
  "tho-luc": { name: "Thợ Lực", self: "em", call: "chị", role: "worker2" },
  lucas: { name: "Lucas", self: "tôi", call: "chị", role: "tourist" },
  "ti-map": { name: "Tí Mập Ăn Khuya", self: "mình", call: "chị", role: "reviewer" },
  "be-su": { name: "Bé Su Review", self: "mình", call: "chị", role: "reviewer" },
  "di-nam": { name: "Dì Năm", self: "dì", call: "con", role: "regular" },
  "to-dan-pho": { name: "Tổ trưởng tổ dân phố", self: "tôi", call: "cô chủ", role: "regular" },
  shipper: { name: "Anh giao hàng", self: "em", call: "chị", role: "shipper" },
  "khach-vp": { name: "Chị Ngân", self: "em", call: "chị", role: "office" },
  "chu-vi": { name: "Anh Tâm", self: "anh", call: "em", role: "worker2" },
  mc: { name: "MC hội chợ", self: "mình", call: "cô chủ", role: "office" },
  "cu-dan-mang": { name: "Cư dân mạng", self: "mình", call: "quán", role: "reviewer" },
  // độc thoại của cô chủ (chỉ một chân dung)
  owner: { name: "Cô chủ", self: "mình", call: "mình", role: "owner", mono: true },
};
export const NPC_IDS = Object.keys(NPCS);
/** Người có chân dung riêng trong drama-portraits-hd (asset-spec đợt 2). */
export const DRAMA_FACES = ["me", "chu-tu", "anh-sau", "co-ba", "chu-hoa", "co-lan", "anh-quang", "bep-vu", "mai-an-dem", "bong", "anh-hung", "chi-thu"];
export const MOODS = ["neutral", "happy", "annoyed", "surprised"];
/** Khớp tên người (khách trong cảnh) với NPC: neo ở ĐẦU tên ("Chú Tư" khớp "Chú Tư 2", "Năm" không khớp "Bà Năm"). Tên dài khớp trước. */
export function npcByName(name) {
  if (!name) return null;
  const n = String(name).trim();
  let best = null;
  for (const [id, p] of Object.entries(NPCS)) {
    if (p.mono) continue;
    if ((n === p.name || n.startsWith(p.name + " ")) && (!best || p.name.length > NPCS[best].name.length)) best = id;
  }
  return best;
}
