// Thiết bị nâng cấp và trang trí (ECONOMY.md, bảng cấp). Mua ở bảng Chuẩn bị ca (tiệm đóng cửa), trừ tiền khi xác nhận.
// sprite = [bí danh atlas, frame]; at = điểm neo trong cảnh 1280×720; scale = tỉ lệ vẽ; replaces = frame mặc định bị thay.
// place = "floor" | "wall": trang trí kéo-thả được (core/decor.js kiểm chỗ hợp lệ). stations = số chỗ pha song song.
export const EQUIPMENT = {
  "flowering-pot":   { name: "Chậu hoa tím",    kind: "decor", unlock: 1,  price: 40,  appeal: 1, place: "floor", sprite: ["upgrades", "flowering-pot"], at: [1080, 452], scale: 0.42,
    effect: "Tiệm xinh hơn: +1 điểm hấp dẫn (thêm khách, khách kiên nhẫn hơn chút)" },
  "premium-lantern": { name: "Đèn mây lớn",     kind: "decor", unlock: 4,  price: 60,  appeal: 1, place: "wall", sprite: ["upgrades", "premium-lantern"], at: [700, 150], scale: 0.42,
    effect: "+1 điểm hấp dẫn, ánh vàng trên quầy" },
  "powered-sealer":  { name: "Máy đóng nắp tốt", kind: "machine", unlock: 5, price: 140, sprite: ["upgrades", "powered-sealer"], at: [222, 340], scale: 0.42, replaces: "cup-sealer",
    effect: "Đóng nắp nhanh hơn: mỗi ly được tính sớm hơn 1,5 giây khi chấm thời gian" },
  "crate-rack":      { name: "Kệ kho mở rộng",  kind: "machine", unlock: 6,  price: 180, sprite: ["upgrades", "crate-rack"], at: [62, 520], scale: 0.5,
    effect: "Sức chứa kho 60 → 90 phần", capacity: 90 },
  "dual-pot-cooker": { name: "Bếp topping 2 ngăn", kind: "machine", unlock: 7, price: 240, sprite: ["upgrades", "dual-pot-cooker"], at: [470, 300], scale: 0.42, replaces: "topping-stove",
    effect: "Nấu hai mẻ trân châu cùng lúc", kitchenSlots: 2 },
  "tea-table-set":   { name: "Bộ bàn ghế tre",  kind: "decor", unlock: 11, price: 120, appeal: 1, place: "floor", sprite: ["upgrades", "tea-table-set"], at: [1010, 690], scale: 0.5,
    effect: "+1 điểm hấp dẫn, khách thích ngồi lại" },
  "upright-fridge":  { name: "Tủ mát",          kind: "machine", unlock: 13, price: 300, sprite: ["upgrades", "upright-fridge"], at: [600, 262], scale: 0.42,
    effect: "Trân châu nấu dư cuối ca được giữ sang ca sau, không hao" },
  "waiting-bench":   { name: "Ghế chờ gỗ",      kind: "decor", unlock: 3,  price: 70,  place: "floor", sprite: ["fixtures", "waiting-bench"], at: [1150, 650], scale: 0.42, patience: 0.08,
    effect: "Khách có chỗ ngồi chờ: kiên nhẫn +8%" },
  "room-screen":     { name: "Bình phong mây",  kind: "decor", unlock: 7,  price: 90,  appeal: 1, place: "floor", sprite: ["fixtures", "room-screen"], at: [1225, 560], scale: 0.42,
    effect: "+1 điểm hấp dẫn, góc chụp hình sống ảo" },
  "double-station":  { name: "Bàn pha đôi",     kind: "machine", unlock: 9, price: 320, sprite: ["upgrades", "double-station"], at: [600, 452], scale: 0.36, stations: 2, front: true,
    effect: "Hai chỗ pha song song. Ly cùng yêu cầu được rót cùng lúc" },
  "triple-station":  { name: "Bàn pha ba chỗ",  kind: "machine", unlock: 17, price: 620, requires: "double-station", sprite: ["upgrades", "triple-station"], at: [600, 452], scale: 0.36, stations: 3, front: true, replacesOwned: "double-station",
    effect: "Ba chỗ pha song song, hợp đơn ba ly giờ cao điểm" },
  "portion-dispenser": { name: "Máy định lượng", kind: "machine", unlock: 15, price: 460, sprite: ["upgrades", "portion-dispenser"], at: [150, 330], scale: 0.36,
    effect: "Luôn đánh dấu mức đường / đá theo phiếu" },
  "lit-signboard":   { name: "Biển hiệu đèn",   kind: "decor", unlock: 16, price: 150, appeal: 1, place: "wall", sprite: ["upgrades", "lit-signboard"], at: [1196, 250], scale: 0.4,
    effect: "+1 điểm hấp dẫn, thêm khách đi ngang" },
};
export const EQUIPMENT_IDS = Object.keys(EQUIPMENT);
export const APPEAL_CAP = 3;
export const APPEAL_CAP_FULL = 4; // cấp 19: nội thất hoàn thiện, tăng trần trang trí

/** Vùng đặt trang trí trong cảnh 1280×720 (kéo-thả). Lối từ cửa tới chỗ đứng chờ và chỗ khách đứng phải thông thoáng. */
export const PLACE_ZONES = {
  floor: { x: [760, 1250], y: [440, 712] },
  wall: { x: [560, 1250], y: [70, 330] },
};
export const SPOT_CLEARANCE = 70, PATH_CLEARANCE = 24;

/** Bếp topping: mẻ trân châu nấu từ trân châu sống, tính theo thời gian ca. */
export const BATCHES = {
  3: { ms: 18000, unlock: 1 },
  6: { ms: 28000, unlock: 3 },
};
export const PEARL_RAW = "tran-chau-song";
export const TUTORIAL_PRECOOKED = 3; // ngày học: Dì Ba nấu sẵn một mẻ
