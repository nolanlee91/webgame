// Nâng cấp, trang trí, chỗ tiêu tiền cuối game, quảng bá, nhiệm vụ (docs/tiem-banh-mi/ECONOMY.md §6–§10, GAME-DESIGN.md §6).
// level = cấp mở quyền mua. price = k. needs = phải có đồ khác trước. frame = [sheet, frame] trong atlas (asset-spec) để vẽ / làm icon.
// Mở khoá là quyền mua, không trừ tiền tự động (GAME-DESIGN §6).

export const EQUIPMENT = {
  "spare-gas": { name: "Bình gas dự phòng", level: 1, price: 60, desc: "Hết gas thì tự thay, không phải gọi giữa ca. Dùng xong mua lại.", consumable: true, frame: ["equip", "gas-tank-full"] },
  "egg-pan": { name: "Chảo trứng", level: 2, price: 30, desc: "Mở bánh mì trứng ốp la và phiếu “thêm trứng”.", frame: ["equip", "egg-pan-idle"] },
  "xiu-mai-pot": { name: "Nồi xíu mại", level: 3, price: 40, desc: "Mở bánh mì xíu mại.", frame: ["equip", "xiu-mai-pot-idle"] },
  "long-board": { name: "Thớt dài (ráp ×4)", level: 3, price: 50, desc: "Ráp tối đa 4 ổ giống nhau một lượt.", frame: ["equip", "long-board"] },
  "tray-6": { name: "Khay lò 6", level: 4, price: 60, desc: "Lò mini nướng 6 ổ mỗi mẻ thay vì 4.", frame: ["ovens", "oven-mini-cold"] },
  grill: { name: "Bếp than nướng xiên", level: 5, price: 90, desc: "Mở bánh mì thịt nướng.", frame: ["equip", "grill-idle"] },
  "warm-case": { name: "Tủ kính sưởi", level: 5, price: 120, desc: "Bánh nguội chậm 40%, tủ thêm 4 chỗ.", frame: ["equip", "toaster-idle"] },
  awning: { name: "Mái che xe đẩy", level: 6, price: 50, desc: "Ngày mưa chỉ vắng 15% khách thay vì 35%.", frame: ["ui", "decor"] },
  "vegan-board": { name: "Thớt chay riêng", level: 6, price: 20, desc: "Mở bánh mì chay (thớt riêng, không dính pate, mayo trứng).", frame: ["equip", "board-empty"] },
  hood: { name: "Chụp hút khói", level: 7, price: 140, desc: "Hết phàn nàn khói, mẻ cháy không lan khói.", frame: ["equip", "sauce-bottles"] },
  "board-2": { name: "Thớt đôi", level: 8, price: 200, desc: "Hai thớt ráp song song.", frame: ["equip", "board-busy"] },
  "egg-pan-2": { name: "Chảo đôi", level: 8, price: 70, desc: "Chiên hai trứng cùng lúc.", needs: "egg-pan", frame: ["equip", "egg-pan-idle"] },
  "toaster-2": { name: "Lò than đôi", level: 8, price: 100, desc: "Nướng lại hai ổ cùng lúc.", frame: ["equip", "toaster-idle"] },
  "cash-counter": { name: "Hộp đếm tiền", level: 9, price: 90, desc: "Gợi ý tờ thối (vẫn phải bấm).", frame: ["equip", "cash-tin"] },
  "long-table": { name: "Bàn dài (ráp ×8)", level: 10, price: 160, desc: "Ráp tối đa 8 ổ giống nhau một lượt.", needs: "long-board", frame: ["equip", "long-board"] },
  "tea-jug": { name: "Bình trà đá miễn phí", level: 11, price: 40, desc: "Khách chờ thêm 6% kiên nhẫn.", frame: ["equip", "tea-jug"] },
  "que-tray": { name: "Khay que", level: 12, price: 70, desc: "Mở bánh mì que (bịch 5 que), nướng 12 que một ngăn.", frame: ["ingr", "phoi-que"] },
  fridge: { name: "Tủ mát lớn", level: 13, price: 280, desc: "Kho 150 phần.", frame: ["ui", "stock"] },
  "electric-oven": { name: "Lò điện đối lưu", level: 14, price: 520, desc: "3 ngăn × 8 ổ, vùng chín rộng. Sợ cúp điện.", frame: ["ovens", "oven-electric-cold"] },
  "auto-dose": { name: "Máy ráp định lượng", level: 15, price: 420, desc: "Bước phết tự đặt đúng lượng theo phiếu.", frame: ["equip", "sauce-bottles"] },
  "queue-rope": { name: "Dây xếp hàng", level: 16, price: 150, desc: "Hàng chờ 6, khách chờ thêm 5% kiên nhẫn.", frame: ["ui", "ticket"] },
  "board-3": { name: "Thớt ba", level: 17, price: 560, desc: "Ba thớt ráp song song.", needs: "board-2", frame: ["equip", "board-busy"] },
};
export const EQUIPMENT_IDS = Object.keys(EQUIPMENT);
/** Món cần đồ (trạm) mới bán được. */
export const RECIPE_NEEDS = { trung: "egg-pan", "xiu-mai": "xiu-mai-pot", "thit-nuong": "grill", chay: "vegan-board", que: "que-tray" };

/** Thuê mặt bằng (lên tiệm, cấp 7). Lò gas 2 ngăn đi kèm. */
export const RENT = { level: 7, price: 300 };
/** Phụ việc Bé Na (cấp 17): thuê theo ca. */
export const HELPER = { level: 17, price: 45 };

/** Trang trí: appeal = điểm hấp dẫn (+khách đi ngang). patience = % kiên nhẫn. place = "wall" | "floor". Kéo thả trong cảnh tiệm. */
export const DECOR = {
  "rattan-lamp": { name: "Đèn mây", level: 4, price: 30, appeal: 0.5, place: "wall", at: [330, 180] },
  "chalk-menu": { name: "Bảng phấn ghi menu", level: 4, price: 25, appeal: 0.5, place: "floor", at: [1070, 620] },
  "ceramic-jar": { name: "Hũ sứ xanh trắng", level: 4, price: 35, appeal: 0.5, place: "floor", at: [60, 650] },
  "wheat-bundle": { name: "Bó lúa mì", level: 5, price: 20, appeal: 0.25, place: "wall", at: [760, 200] },
  "herb-pot": { name: "Chậu rau thơm", level: 5, price: 30, appeal: 0.25, place: "floor", at: [1230, 640] },
  "wind-chime": { name: "Chuông gió", level: 6, price: 25, appeal: 0.25, place: "wall", at: [1000, 150] },
  "wall-calendar": { name: "Lịch treo tường", level: 7, price: 15, appeal: 0.25, place: "wall", at: [180, 200] },
  "old-radio": { name: "Radio cũ", level: 8, price: 45, appeal: 0.5, place: "wall", at: [880, 230] },
  "wall-fan": { name: "Quạt tường", level: 9, price: 50, appeal: 0, patience: 4, place: "wall", at: [1150, 170] },
  "banana-plant": { name: "Chuối cảnh", level: 10, price: 55, appeal: 0.5, place: "floor", at: [30, 560] },
  "plastic-stools": { name: "Ghế nhựa", level: 11, price: 40, appeal: 0, patience: 6, place: "floor", at: [1120, 700] },
  "small-table": { name: "Bàn nhỏ", level: 11, price: 60, appeal: 0.5, place: "floor", at: [1240, 700] },
  "neon-sign": { name: "Biển đèn neon", level: 16, price: 260, appeal: 1, place: "wall", at: [640, 110] },
  "award-frame": { name: "Khung giấy khen", level: 99, price: 0, appeal: 0.5, place: "wall", at: [470, 200], event: true },
};
export const DECOR_IDS = Object.keys(DECOR);
/** Bảng hiệu bậc 2 / 3 (cố định trên tường, không kéo). */
export const SIGNBOARDS = { "signboard-2": { name: "Bảng hiệu bậc 2", level: 10, price: 180, appeal: 0.5 }, "signboard-3": { name: "Bảng hiệu bậc 3", level: 16, price: 450, appeal: 1, needs: "signboard-2" } };
/** Trần hấp dẫn cộng dồn (+4 từ cấp 19). Mỗi 1 điểm = +1 khách đi ngang mỗi ca (làm tròn xuống). */
export const APPEAL_CAP = (level) => (level >= 19 ? 4 : 3);
/** Vùng đặt đồ trong cảnh tiệm 1280×720 (shop-scene): tường trên quầy, sàn trước quầy. Khoảng cách tối thiểu tới chỗ đứng / lối đi. */
export const PLACE_ZONES = { wall: { x: [40, 1240], y: [90, 300] }, floor: { x: [20, 1260], y: [540, 712] } };
export const SPOT_CLEARANCE = 70, PATH_CLEARANCE = 46;

/** Hạng tiệm 8 bậc (ECONOMY §10): mỗi bậc +1 khách đi ngang mỗi ca, kiên nhẫn +2%. */
export const RANKS = [
  { level: 10, price: 300 }, { level: 11, price: 600 }, { level: 12, price: 1000 }, { level: 14, price: 1600 },
  { level: 15, price: 2400 }, { level: 17, price: 3400 }, { level: 19, price: 4600 }, { level: 20, price: 6000 },
];
/** Pate nhà làm 3 bậc: ổ có pate +1k giá bán mỗi bậc. */
export const HOUSE_PATE = [{ level: 15, price: 400 }, { level: 17, price: 900 }, { level: 19, price: 1600 }];
/** Ổ mang tên tiệm (cấp 19): tối đa 4 nhân, giá trong khung giá vốn ×1,6 – ×2,4. */
export const HOUSE_LOAF = { level: 19, maxFills: 4, minMul: 1.6, maxMul: 2.4 };

/** Quảng bá (cấp 11), một lần mỗi ngày trước ca. */
export const PROMOS = {
  "to-roi": { name: "Tờ rơi cổng trường", price: 20, guests: { student: 4 }, followers: 0, buzz: 0, desc: "+4 học sinh buổi sáng." },
  "check-in": { name: "Check-in tặng trà đá", price: 15, guests: 2, followers: 20, buzz: 0.5, desc: "+2 khách, thêm người theo dõi." },
  livestream: { name: "Livestream lúc ráp", price: 0, guests: 0, followers: 0, buzz: 0, roll: true, desc: "Hên xui: lên mạng, khách ăn ké, hoặc phản tác dụng nếu làm sai trên sóng." },
};
export const PROMO_UNLOCK = 11;

/** Đơn đặt trước (cấp 7): cọc 30%, tối đa 2 đơn mỗi ngày, trễ ≤ 30 s ca −10%, trễ hơn / thiếu −30% + review 2 sao. */
export const PREORDER = { level: 7, deposit: 0.3, perDay: 2, lateSmall: 30000, lateSmallCut: 0.1, lateBigCut: 0.3, grace: 60000, minN: 6, maxN: 30 };
/** Hội chợ (cấp 18): thuê gian 150k mỗi 4 ngày, +8 khách, giá +15%. Thử thách (cấp 20). */
export const FAIR = { level: 18, price: 150, every: 4, guests: 8, priceMul: 1.15 };
export const CHALLENGE = { level: 20, firstReward: { money: 120, xp: 60 }, reward: { money: 60, xp: 30 } };

/** Nhiệm vụ ngày (ECONOMY §8): 3 mục mỗi ca từ cấp 2. kind = cách đếm ở core/missions.js. */
export const MISSIONS = [
  { id: "golden", kind: "golden", n: 3, unlock: 2, text: "Rút {n} mẻ đúng vùng chín", reward: { xp: 8, money: 0 } },
  { id: "no-soggy", kind: "noSoggy", n: 5, unlock: 2, text: "Bán {n} ổ mà không ổ nào ỉu", reward: { xp: 10, money: 8 } },
  { id: "change", kind: "change", n: 3, unlock: 2, text: "Thối tiền đúng {n} lần", reward: { xp: 8, money: 0 } },
  { id: "rush", kind: "rush", n: 5, unlock: 2, text: "Phục vụ {n} khách cao điểm sáng, không ai bỏ về", reward: { xp: 12, money: 10 } },
  { id: "quirks", kind: "quirks", n: 2, unlock: 2, text: "Giao {n} phiếu có dặn riêng (không hành, ít ớt…) đúng", reward: { xp: 10, money: 0 } },
  { id: "five", kind: "five", n: 2, unlock: 2, text: "Nhận {n} review 5 sao", reward: { xp: 10, money: 8 } },
  { id: "egg", kind: "egg", n: 2, unlock: 2, needs: "egg-pan", text: "Bán {n} ổ có trứng", reward: { xp: 8, money: 6 } },
  { id: "drama", kind: "drama", n: 1, unlock: 2, text: "Xử lý một tình huống trong ca", reward: { xp: 6, money: 5 } },
  { id: "multi", kind: "multi", n: 1, unlock: 3, text: "Giao trọn một đơn nhiều ổ từ 3 sao", reward: { xp: 12, money: 8 } },
  { id: "bachuc", kind: "bachuc", n: 1, unlock: 3, text: "Làm đúng {n} ổ ba chục", reward: { xp: 10, money: 0 } },
  { id: "leftover", kind: "leftover", n: 3, unlock: 3, text: "Bánh dư cuối ca không quá {n} ổ", reward: { xp: 12, money: 10 } },
  { id: "loaves", kind: "loaves", n: 12, unlock: 4, text: "Bán {n} ổ trong ca", reward: { xp: 14, money: 10 } },
  { id: "nhu-cu", kind: "nhuCu", n: 1, unlock: 4, text: "Phục vụ khách quen “như cũ” đúng", reward: { xp: 12, money: 0 } },
  { id: "revenue", kind: "revenue", n: 250, unlock: 5, text: "Doanh thu ca đạt {n}k", reward: { xp: 15, money: 15 } },
  { id: "preorder", kind: "preorder", n: 1, unlock: 7, text: "Giao đơn đặt trước đúng giờ", reward: { xp: 15, money: 15 } },
  { id: "low-waste", kind: "lowWaste", n: 12, unlock: 7, text: "Hao hụt cả ca dưới {n}k", reward: { xp: 12, money: 12 } },
];
export const MISSIONS_PER_DAY = 3;
