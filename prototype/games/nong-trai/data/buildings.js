// Công trình trên bản đồ nông trại (DESIGN-2.0 §1 khu 8, §2.7, §3). Thuần dữ liệu — luật ở core/build.js,
// bản đồ theo cấp ở core/levels-map.js.
//
// TOẠ ĐỘ: chuẩn hoá theo bản đồ gốc 960×640 px (tỉ lệ 1,5:1): x = px/960, y = px/640, (x, y) là
// ĐIỂM NEO đáy-giữa của sprite (khớp `anchor` trong assets/v3/manifest.json). w = bề rộng vẽ / 960.
// Bản đồ gốc: x 0..1. Khu đất phía Đông (cấp 17) nối sang phải: x 1..EAST_W (bản đồ khi mở rộng rộng 1,5 lần).
// Ruộng 5×5 (ô 64 px) nằm giữa: FIELD. Cổng + đường đất ở giữa cạnh trên (bảng đơn cạnh cổng, biển "Làng" ở cuối đường).
//
// KIND:
//   "prebuilt"  có sẵn từ đầu (level 1, không cần lưu). Có thể có nâng cấp (sạp chợ).
//   "build"     người chơi xây ở lô cố định: Khoá → Có thể xây → Đang xây → Hoàn thành → Nâng cấp được.
//   "expansion" như "build" nhưng là mở đất (Khu đất phía Đông).
//   "auto"      cảnh vật tự xuất hiện khi đủ cấp (biển Làng, xe giao hàng) — không có giá, không lưu.
//   "machine"   hình trên bản đồ của một MÁY trong Xưởng (Cối xay gió = máy "coi-xay" của core/production.js).
//               Trạng thái lấy từ production; build.js không xây / thu tiền cho loại này (tránh trừ 2 lần).
//
// levels[0] = xây (lên level 1); levels[k] = nâng lên level k+1. Mỗi mốc:
//   { feature?, unlock, cost, materials, ms, sprite, effect }
//   feature: id tính năng trong data/levels.js ⇒ unlock = featureLevel(feature) (một nguồn sự thật với levels.js).
//   ms = 0 ⇒ xây / nâng TỨC THÌ (công trình nhỏ, §3). Công trình lớn 1–5 phút.
//   effect: giá trị mà core/build.js effects() cộng dồn (mốc sau ghi đè mốc trước).
// SPRITE: { sheet, id } — sheet là key trong assets/v3/manifest.json `sheets`, hoặc "garden" = assets/garden/<id>.webp.

import { featureLevel } from "./levels.js?v=m6s";
// Cấp của một tính năng trong data/levels.js; tính năng chưa có trong bản levels.js đang dùng ⇒ số dự phòng (theo §3).
const fl = (id, fallback) => (Number.isFinite(featureLevel(id)) ? featureLevel(id) : fallback);
import { WAREHOUSE } from "./warehouse.js?v=m6s";

// Milestone 5: bản đồ cao 600 → 640 px (thêm dải cỏ dưới cùng) — chuồng gà / chuồng bò / Nhà kính ở mép dưới không còn bị cắt nhãn,
// có chỗ cho gà / bò đi lại trước chuồng. Mọi toạ độ ghi bằng px gốc nên công trình giữ nguyên chỗ.
export const MAP_W = 960, MAP_H = 640;
export const EAST_W = 1.5; // bề rộng bản đồ (đơn vị bản đồ gốc) khi đã mở Khu đất phía Đông
export const FIELD = Object.freeze({ x: 320 / MAP_W, y: 200 / MAP_H, w: 320 / MAP_W, h: 320 / MAP_H, cols: 5, rows: 5 });
export const EAST_FIELD = Object.freeze({ x: 1000 / MAP_W, y: 230 / MAP_H, w: 192 / MAP_W, h: 192 / MAP_H, cols: 3, rows: 3 });
export const EAST_PLOTS = EAST_FIELD.cols * EAST_FIELD.rows; // +9 ô (§3 cấp 17)
/** Cảnh vật cố định (không phải công trình) — để UI và kiểm chồng lấn. */
export const SCENERY = Object.freeze({
  gate: { x: 480 / MAP_W, y: 40 / MAP_H },
  pond: { x: 720 / MAP_W, y: 480 / MAP_H, w: 150 / MAP_W },
});

export const BLUEPRINT = Object.freeze({ sheet: "buildings", id: "lo-ban-ve" });
export const SCAFFOLD = Object.freeze({ sheet: "buildings", id: "gian-giao" });

const px = (x, y, w) => ({ x: +(x / MAP_W).toFixed(4), y: +(y / MAP_H).toFixed(4), w: +(w / MAP_W).toFixed(4) });
const S = (sheet, id) => Object.freeze({ sheet, id });
const B = (id) => S("buildings", id);
const B2 = (id) => S("buildings-2", id);

// Nhà kho: level L ⇔ mốc sức chứa WAREHOUSE[L-1] (data/warehouse.js — giá, cấp, vật liệu lấy thẳng từ đó).
// Chưa xây ⇒ mốc 0 (60 chỗ, "kho tạm" như M1). Xây ở cấp 3 giá 60 xu (§3) ⇒ level 1 = vẫn 60 chỗ, mở cảnh Nhà kho
// + các mốc nâng. Kho cấp 4 (180) dùng sprite "nha-kho-2" (§3 cấp 15 "Kho to hơn").
const WAREHOUSE_FEATURE = { 3: "warehouse-4", 4: "warehouse-5", 5: "warehouse-6" };
const warehouseLevels = WAREHOUSE.map((t, i) => i === 0
  ? { feature: "build-warehouse", cost: 60, materials: {}, ms: 0, sprite: B("nha-kho"), effect: { warehouseTier: 0 } }
  : { feature: WAREHOUSE_FEATURE[i], minLevel: t.minLevel, cost: t.cost, materials: { ...t.materials }, ms: 0,
      sprite: i >= 3 ? B2("nha-kho-2") : B("nha-kho"), effect: { warehouseTier: i } });

// Danh hiệu theo bậc Nhà (level 1 = nhà ban đầu). orderBonus: phần xu cộng thêm khi giao đơn (+2 % mỗi bậc, tối đa +20 %).
export const FAME_TITLES = Object.freeze(["Nông trại nhỏ", "Nông trại chăm chỉ", "Nông trại khá giả", "Nông trại có tiếng", "Nông trại nổi tiếng trong làng",
  "Nông trại kiểu mẫu", "Nông trại danh tiếng", "Nông trại vang danh", "Nông trại huyền thoại", "Điền trang vàng", "Nông trại mạ vàng"]);
export const FAME_BONUS_STEP = 0.02;
const HOUSE_UNLOCK = [1, 10, 12, 14, 16, 17, 18, 19, 20, 20, 20];
// Milestone 6 — ảnh nhà theo bậc: sheet "house-tiers" (assets/v3/house-tiers.webp, ô 288 × 224, neo [144, 216]), frame nha-bac-1..10
// (docs/nong-trai/asset-spec.json). Giao diện (ui/farm-map.js resolveSprite) dùng frame đúng bậc nếu có, không có thì frame bậc thấp
// gần nhất đã vẽ, không có frame nào ⇒ `fallback` = ảnh garden/house như M5 (nhãn "Nhà ★n" vẫn hiện).
export const HOUSE_SHEET = "house-tiers", HOUSE_FRAME = "nha-bac-";
const houseSprite = (tier) => Object.freeze({ sheet: HOUSE_SHEET, id: HOUSE_FRAME + tier, tier, prefix: HOUSE_FRAME, fallback: S("garden", "house") });
const HOUSE_LEVELS = FAME_TITLES.map((title, i) => i === 0
  ? { unlock: 1, sprite: S("garden", "house"), effect: { fameLevel: 1, orderBonus: 0 } }
  : { ...(i === 1 ? { feature: "fame-house" } : {}), unlock: HOUSE_UNLOCK[i], cost: Math.round((3000 * 1.8 ** (i - 1)) / 100) * 100,
      materials: i < 3 ? {} : { "van-go": i, "hop-dinh": i - 1, ...(i >= 6 ? { "thung-son": i - 4 } : {}) },
      ms: 120_000, sprite: houseSprite(i), effect: { fameLevel: i + 1, orderBonus: +(FAME_BONUS_STEP * i).toFixed(2) } });
// Milestone 6 — Hàng rào (§3 cấp 15 "hàng rào đá"): hàng rào gỗ có sẵn ở mép dưới bản đồ (trước là ảnh tĩnh garden/fence), nâng lên
// hàng rào đá. Sprite đá: sheet "hang-rao" (assets/v3/hang-rao.webp, ô 256 × 128, neo [128, 120]) frame "hang-rao-da"; chưa có ⇒
// hàng rào gỗ lọc màu đá (fallback.filter "stone", ui/farm-map.js). Chỉ trang trí + chỗ tiêu xu (không đổi luật).
export const FENCE_SHEET = "hang-rao", FENCE_FRAME = "hang-rao-da";
const FENCE_LEVELS = [
  { unlock: 1, sprite: S("garden", "fence"), effect: { stoneFence: false } },
  { feature: "stone-fence", cost: 6000, materials: { "hop-dinh": 4, "thung-son": 2 }, ms: 0, // công trình nhỏ ⇒ xong ngay (§3)
    sprite: Object.freeze({ sheet: FENCE_SHEET, id: FENCE_FRAME, fallback: Object.freeze({ sheet: "garden", id: "fence", filter: "stone" }) }),
    effect: { stoneFence: true } },
];

const RAW = [
  // Nhà = "Nông trại danh tiếng" (§3 cấp 20, Milestone 5): chỗ tiêu xu dài hạn cuối game. Mỗi lần nâng ⇒ danh hiệu mới + đơn hàng
  // trả thêm xu (effect.orderBonus, core/orders.js orderPayout). Giá ×1,8 mỗi bậc (3 000 → ~595 000, tổng ~1,33 triệu) ⇒ người chơi
  // chăm vẫn có mục tiêu tới hết tuần (tools/sim/report.md: bản M4 tích 920 000 xu ngày 7). Chưa có sprite nhà cấp cao ⇒ dùng lại
  // ảnh garden/house, bản đồ hiện "★ bậc" trên nhãn.
  { id: "nha", name: "Nhà", kind: "prebuilt", lot: "lo-nha", size: "big", ...px(165, 175, 230),
    levels: HOUSE_LEVELS },
  { id: "sap-cho", name: "Sạp chợ", kind: "prebuilt", lot: "lo-cho", size: "small", ...px(835, 177, 190), // M5: hạ 12 px — mái sạp không bị cắt ở mép trên
    levels: [
      { unlock: 1, sprite: S("garden", "market"), effect: { marketFull: false } },
      // §3 cấp 3 "Khu chợ đầy đủ" — sạp nhỏ thành quầy chợ, công trình nhỏ ⇒ tức thì.
      { feature: "market", cost: 50, materials: {}, ms: 0, sprite: S("market-stall", "quay-cho-hoan-chinh"), effect: { marketFull: true } },
    ] },
  { id: "hang-rao", name: "Hàng rào", kind: "prebuilt", lot: "lo-rao", size: "small", ...px(560, 626, 200), hitH: 100, levels: FENCE_LEVELS },
  { id: "bang-don-hang", name: "Bảng đơn hàng", kind: "prebuilt", lot: "lo-bang", size: "small", ...px(560, 170, 86),
    levels: [{ unlock: 1, sprite: B("bang-don-hang") }] },
  { id: "bien-lang", name: "Biển Làng", kind: "auto", lot: null, size: "small", ...px(420, 70, 80),
    levels: [{ feature: "village", sprite: B("bien-lang") }] },
  { id: "xe-giao-hang", name: "Xe giao hàng", kind: "auto", lot: null, size: "small", ...px(650, 95, 120),
    levels: [{ feature: "orders-special", sprite: B("xe-giao-hang") }] },

  { id: "nha-kho", name: "Nhà kho", kind: "build", lot: "lo-kho", size: "small", ...px(140, 370, 150),
    levels: warehouseLevels },
  // Id "xuong" = s.buildings.xuong của Milestone 2 (core/workshop.js, data/workshop.js) + nhiệm vụ { building: "xuong" }.
  // Giá / thời gian khớp data/workshop.js: xây 150 xu, 1 ph (tặng kèm Bếp sên); nâng cấp 2 ở cấp 13: 6000 xu, tức thì.
  { id: "xuong", name: "Xưởng chế biến", kind: "build", lot: "lo-xuong", size: "big", ...px(820, 340, 170),
    levels: [
      { feature: "workshop", cost: 150, materials: {}, ms: 60_000, sprite: B("xuong-che-bien"), effect: { workshopLevel: 1, extraQueueSlots: 0 } },
      // §3 cấp 13: xưởng cấp 2 ⇒ +1 ô hàng chờ cho MỌI máy (ctx.extraSlots của core/production.js).
      // Giá ×4 (1 500 → 6 000): chỗ tiêu xu muộn (tools/sim/report.md gợi ý 3).
      { unlock: fl("workshop-2", 13), cost: 6000, materials: {}, ms: 0, sprite: B2("xuong-che-bien-2"),
        effect: { workshopLevel: 2, extraQueueSlots: 1 } },
    ] },
  { id: "coi-xay-gio", name: "Cối xay gió", kind: "machine", machine: "coi-xay", lot: "lo-coi-xay", size: "big", ...px(870, 470, 110),
    levels: [{ feature: "mill", sprite: B("than-coi-xay"), rotor: B("canh-coi-xay") }] },
  { id: "chuong-ga", name: "Chuồng gà", kind: "build", lot: "lo-chuong-ga", size: "big", ...px(104, 584, 130),
    // Sức chứa khớp data/animals.js capacityByLevel (gà [6, 8, 10]). Nâng dùng vật liệu (§2.7 "công trình cấp 2").
    levels: [
      { feature: "chicken", cost: 300, materials: {}, ms: 120_000, sprite: B("chuong-ga"), effect: { chickenCap: 6 } },
      { unlock: 10, cost: 700, materials: { "van-go": 3, "hop-dinh": 2 }, ms: 120_000, sprite: B2("chuong-ga-2"), effect: { chickenCap: 8 } },
      { unlock: 14, cost: 1400, materials: { "van-go": 5, "hop-dinh": 4, "thung-son": 1 }, ms: 180_000, sprite: B2("chuong-ga-2"), effect: { chickenCap: 10 } },
    ] },
  { id: "chuong-bo", name: "Chuồng bò", kind: "build", lot: "lo-chuong-bo", size: "big", ...px(240, 592, 140),
    // bò [4, 6] (data/animals.js). Chưa có sprite chuồng bò cấp 2 ⇒ dùng lại "chuong-bo".
    levels: [
      { feature: "cow", cost: 600, materials: {}, ms: 180_000, sprite: B("chuong-bo"), effect: { cowCap: 4 } },
      { unlock: 12, cost: 1000, materials: { "van-go": 4, "hop-dinh": 3 }, ms: 180_000, sprite: B("chuong-bo"), effect: { cowCap: 6 } },
    ] },
  { id: "nha-kinh", name: "Nhà kính", kind: "build", lot: "lo-nha-kinh", size: "big", ...px(846, 614, 136), // M5: hạ xuống dải mới, không đè chân Cối xay gió
    levels: [
      // 10 → 4 ván gỗ (tools/sim/report.md gợi ý 5): ván chỉ rơi ~0,7 %/vụ trước cấp 11 ⇒ 10 tấm buộc mua 1 200 xu ở chợ.
      // Chọn giảm vật liệu thay vì tăng tỉ lệ rơi 2 % → 5 %: chỉ đụng một mốc, không làm vật liệu dư thừa cho mọi mốc khác.
      { feature: "greenhouse", cost: 900, materials: { "van-go": 4 }, ms: 300_000, sprite: B("nha-kinh"),
        effect: { greenhousePlots: 6, greenhouseNoWater: true } },
      { unlock: 16, cost: 7500, materials: { "van-go": 6, "hop-dinh": 4, "thung-son": 2 }, ms: 300_000, sprite: B2("nha-kinh-2"), // ×5
        effect: { greenhousePlots: 9, greenhouseNoWater: true } },
    ] },
  // §3 cấp 17: +9 ô + 1 lô xây. Bản vẽ / giàn giáo đặt ở mép Đông (UI hé một dải bên phải khi "Có thể xây").
  { id: "dat-phia-dong", name: "Khu đất phía Đông", kind: "expansion", lot: "lo-dong-mo", size: "big", ...px(1096, 470, 200),
    // Giá ×5 (3 000 → 15 000): mục tiêu tiết kiệm dài hạn (tools/sim/report.md gợi ý 3).
    levels: [{ feature: "east-land", cost: 15000, materials: { "van-go": 8, "hop-dinh": 8 }, ms: 300_000, sprite: null,
      effect: { eastOpen: true, eastPlots: EAST_PLOTS, eastLots: 1 } }] },
];

/** Lô xây trên bản đồ. candidates: công trình xây được ở lô (mỗi lô cố định 1 công trình ở bản này).
 *  "lo-dong": lô xây của Khu đất phía Đông — CHƯA có công trình (dành cho nội dung sau), chỉ hiện khi đã mở đất. */
export const LOTS = Object.freeze([
  ...RAW.filter((b) => b.lot).map((b) => Object.freeze({ id: b.lot, x: b.x, y: b.y, w: b.w, area: b.x >= 1 ? "east" : "base", candidates: [b.id] })),
  Object.freeze({ id: "lo-dong", ...px(1300, 520, 150), area: "east", candidates: [] }),
]);

export const BUILDINGS = Object.freeze(RAW.map((b) => Object.freeze({
  ...b,
  area: b.x >= 1 ? "east" : "base",
  // unlock không giảm theo level: không nâng được trước khi xây (vd. kho mốc 90 có minLevel 2 nhưng chỉ xây kho từ cấp 3).
  levels: Object.freeze(b.levels.reduce((acc, l) => acc.concat(Object.freeze({
    ...l,
    unlock: Math.max(l.unlock ?? 1, l.feature ? featureLevel(l.feature) : 1, l.minLevel ?? 1, acc.length ? acc[acc.length - 1].unlock : 1),
    cost: l.cost ?? 0,
    materials: Object.freeze({ ...(l.materials || {}) }),
    ms: l.ms ?? 0,
    effect: Object.freeze({ ...(l.effect || {}) }),
  })), [])),
})));
export const BUILDING = Object.freeze(Object.assign(Object.create(null), Object.fromEntries(BUILDINGS.map((b) => [b.id, b]))));
export const maxLevel = (id) => BUILDING[id]?.levels.length ?? 0;
/** Loại công trình build.js xây / nâng được (có giá). */
export const BUILDABLE_KINDS = Object.freeze(["build", "expansion", "prebuilt"]);

// ---- Trang trí (assets/v3 decor.webp). rare = đồ hiếm §3 cấp 19. size "l" chỉ đặt ở ô trang trí lớn.
// unlock của đồ thường khớp shopLevel trong data/goods.js (M2) — ghi tay ở đây để không phụ thuộc file đang sửa.
const D = (id, name, unlock, size = "s", rare = false) => Object.freeze({ id, name, rare, size, unlock: rare ? featureLevel("rare-decor") : unlock, sprite: S("decor", id) });
export const DECOR = Object.freeze([
  D("chau-hoa", "Chậu hoa", 3), D("ghe-tre", "Ghế tre", 5), D("co-lau", "Cỏ lau", 6), D("dong-bi-ngo", "Đống bí ngô", 8),
  D("den-long", "Đèn lồng", 19, "s", true), D("bu-nhin", "Bù nhìn", 19, "s", true),
  D("gieng-da", "Giếng đá", 19, "l", true), D("cong-tre", "Cổng tre", 19, "l", true),
]);
export const DECOR_ITEM = Object.freeze(Object.assign(Object.create(null), Object.fromEntries(DECOR.map((d) => [d.id, d]))));
export const DECOR_BAG_MAX = 9999; // tối đa mỗi loại trong túi trang trí (s.decor) mà addDecor / sanitize chấp nhận

/** Ô đặt trang trí cố định (M3: dời cong / hien-nha / bo-ao / san-kho để ô không chồng nhau, không đè ruộng / lô Nhà kho). size "l" nhận mọi đồ, "s" chỉ đồ nhỏ. area "east" chỉ dùng khi đã mở đất phía Đông. */
const slot = (id, x, y, size, unlock = 3, area = "base") => Object.freeze({ id, ...px(x, y, size === "l" ? 96 : 64), size, unlock, area });
export const DECOR_SLOTS = Object.freeze([
  slot("cong", 480, 92, "l"),            // ngay cổng — chỗ đẹp cho Cổng tre
  slot("hien-nha", 215, 218, "s"),       // hiên nhà
  slot("goc-ruong-tl", 300, 215, "s"),
  slot("goc-ruong-tr", 660, 215, "s"),
  slot("goc-ruong-bl", 345, 590, "s"),  // M5: dời khỏi mái Chuồng bò
  slot("goc-ruong-br", 660, 540, "s"),
  slot("bo-ao", 676, 402, "s"),
  slot("san-kho", 262, 340, "l"),        // sân trước nhà kho — Giếng đá
  slot("loi-di", 420, 606, "s"),
  slot("dong-1", 1000, 470, "l", 17, "east"),
  slot("dong-2", 1200, 250, "s", 17, "east"),
  slot("dong-3", 1200, 420, "s", 17, "east"),
]);
export const DECOR_SLOT = Object.freeze(Object.assign(Object.create(null), Object.fromEntries(DECOR_SLOTS.map((s) => [s.id, s]))));
