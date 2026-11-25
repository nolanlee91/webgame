// Danh mục vật phẩm — MỘT nguồn sự thật cho mọi món (DESIGN-2.0 §2.2–§2.4, §2.7): tên, nhóm kệ, giá bán gốc,
// giá mua ở chợ, cấp mở ở chợ, nguồn gốc, "dùng cho". (Milestone 2 đã gộp data/goods.js vào đây.)
// cat: nhóm kệ trong Nhà kho. counts=false ⇒ không tính vào sức chứa (vật liệu, trang trí).
// bag: "decor" ⇒ món nằm ở túi trang trí riêng (s.decor), không vào kho / giỏ tràn.
// sell: giá bán GỐC (chợ dao động ±15 % theo chu kỳ 3 giờ — core/market.js; đơn hàng dùng giá gốc). 0 ⇒ không bán được.
// buy / shopLevel: có ⇒ chợ bán món này với giá `buy`, từ cấp `shopLevel` (hạt giống: giá trong data/crops.js, trả lúc gieo).
// producer: { kind: "crop", id } | { kind: "machine", id, recipe } | { kind: "animal", id } | { kind: "reward" } | { kind: "shop" }.
// icon: ô trong assets/v3/items.webp (8 × 4) hoặc assets/v3/decor.webp (4 × 2).
import { CROPS } from "./crops.js?v=m10";
import { RECIPES } from "./recipes.js?v=m10";
import { MACHINE } from "./machines.js?v=m10";
import { CURRENT_MILESTONE } from "./levels.js?v=m10";

// Thứ tự ô trong assets/v3/items.webp (8 × 4, ô 64 px), khớp assets/v3/manifest.json.
export const ICON_IDS = [
  "ca-rot", "ca-chua", "dau-tay", "ngo", "bi-ngo", "lua", "mia", "hat-giong",
  "mut-dau", "sot-ca-chua", "nuoc-ep-ca-rot", "thuc-an-gia-suc", "bot-gao", "bap-rang", "banh-trung", "banh-bi-ngo",
  "trung-ga", "sua", "bo", "pho-mai", "duong", "banh-flan", "van-go", "hop-dinh",
  "thung-son", "dong-xu", "sao-xp", "kho", "bua-xay-dung", "bang-don", "chuong-thong-bao", "o-khoa",
];
export const ICON_COLS = 8, ICON_ROWS = 4;
// assets/v3/items-2.webp (4 × 2, ô 64 px, Milestone 6 — chờ Codex, docs/nong-trai/asset-spec.json). Chưa có sheet / frame
// ⇒ giao diện vẽ icon dự phòng: ô `fallback` của items.webp + bộ lọc CSS `filter` (ICON_FALLBACK).
export const ICON2_IDS = ["banh-ngo", "sinh-to-dau", "bap-rang-bo", "che-bi-ngo", "sua-chua", "banh-gao", "so-suu-tap", "co-phien-cho"];
export const ICON2_COLS = 4, ICON2_ROWS = 2;
export const ICON_FALLBACK = Object.freeze({
  "banh-ngo": ["banh-bi-ngo", "hue-rotate(18deg) saturate(1.25)"],
  "sinh-to-dau": ["nuoc-ep-ca-rot", "hue-rotate(-38deg) saturate(1.2)"],
  "bap-rang-bo": ["bap-rang", "sepia(.45) saturate(1.3) brightness(1.05)"],
  "che-bi-ngo": ["mut-dau", "hue-rotate(32deg) saturate(1.2)"],
  "sua-chua": ["sua", "hue-rotate(-25deg) brightness(1.06)"],
  "banh-gao": ["bot-gao", "sepia(.55) saturate(1.4)"],
  "so-suu-tap": ["bang-don", ""],
  "co-phien-cho": ["chuong-thong-bao", ""],
});
// assets/v3/decor.webp (4 × 2, ô 128 px)
export const DECOR_ICON_IDS = ["den-long", "chau-hoa", "bu-nhin", "ghe-tre", "gieng-da", "cong-tre", "dong-bi-ngo", "co-lau"];

export const CATEGORIES = [
  { id: "nong-san", name: "Nông sản" },
  { id: "chan-nuoi", name: "Chăn nuôi" },
  { id: "thanh-pham", name: "Thành phẩm" },
  { id: "vat-lieu", name: "Vật liệu" },
  { id: "dac-biet", name: "Đặc biệt" },
];

const recipeOf = (id) => RECIPES.find((r) => r.output === id);
/** "Dùng cho": công thức Xưởng dùng món làm nguyên liệu (tính từ data/recipes.js ⇒ không lệch dữ liệu). */
function usesOf(id, extra = []) {
  const into = RECIPES.filter((r) => r.inputs[id]).map((r) => `${r.name.replace(/ ×\d+$/, "")} (${MACHINE[r.machine].name})`);
  return [...extra, ...[...new Set(into)]].join(" · ") || "Bán ở chợ";
}

function product(id, name, sell, extra = {}) {
  const r = recipeOf(id), m = MACHINE[r.machine];
  return { id, name, cat: "thanh-pham", sell, counts: true, producer: { kind: "machine", id: r.machine, recipe: r.id },
    source: `Xưởng chế biến · ${m.name}${m.milestone > CURRENT_MILESTONE ? " (sắp có)" : ""}`, uses: usesOf(id, ["Đơn hàng"]), ...extra };
}
const material = (id, name, buy, shopLevel, uses) => ({ id, name, cat: "vat-lieu", sell: 0, counts: false, producer: { kind: "reward" },
  source: "Đơn đặc biệt · thu hoạch (hiếm) · chợ", uses, buy, shopLevel });
const decor = (id, name, buy, shopLevel, uses = "Trang trí nông trại") => ({ id, name, cat: "dac-biet", sell: 0, counts: false, bag: "decor",
  producer: { kind: "shop" }, source: "Khu chợ (Cô Hai)", uses, buy, shopLevel });

export const ITEMS = [
  ...CROPS.map((c) => ({ id: c.id, name: c.name, cat: "nong-san", sell: c.sell, counts: true, producer: { kind: "crop", id: c.id },
    source: c.requires ? "Trồng trong Nhà kính" : "Trồng ở ruộng", uses: usesOf(c.id, ["Đơn hàng"]) })),
  // Thành phẩm Xưởng (§2.3)
  product("mut-dau", "Mứt dâu", 74),
  product("sot-ca-chua", "Sốt cà chua", 48),
  product("nuoc-ep-ca-rot", "Nước ép cà rốt", 32),
  // Thức ăn gia súc: chợ bán dự phòng, giá 56 (≥ ngưỡng chống lời khi đổi thức ăn mua → sữa → bơ / phô mai, xem core/market.js).
  // Milestone 4: 48 → 56 vì sữa 72 ⇒ bơ / phô mai phải ≥ 1,25 × 2 / 3 sữa (180 / 270) mà vẫn lỗ khi nuôi bằng thức ăn mua
  // (4 bao × 56 = 224 > bơ 185 × 1,15; 6 × 56 = 336 > phô mai 280 × 1,15). Với 48 hai điều kiện này mâu thuẫn.
  // Milestone 6: 56 → 72 vì Phiên chợ trả bơ / phô mai tới ×1,5 (hàng săn): 4 bao × 72 = 288 > bơ 185 × 1,5; 6 × 72 = 432 > phô mai 280 × 1,5.
  product("thuc-an-gia-suc", "Thức ăn gia súc", 19, { uses: "Cho gà (1 bao), bò (2 bao) ăn · Đơn hàng", buy: 72, shopLevel: 7 }),
  product("bot-gao", "Bột gạo", 70),
  product("bap-rang", "Bắp rang", 78),
  product("banh-trung", "Bánh trứng", 175), // M4: trứng 26 → 32 ⇒ giữ chế biến ≥ 1,25× (2 × 32 + 70 = 134)
  product("banh-bi-ngo", "Bánh bí ngô", 190),
  product("bo", "Bơ", 185), // M4: sữa 58 → 72 (2 × 72 = 144 ⇒ ×1,28)
  product("pho-mai", "Phô mai", 280), // 3 × 72 = 216 ⇒ ×1,30
  product("duong", "Đường", 150),
  product("banh-flan", "Bánh flan", 370), // M4: 2 trứng + sữa + đường = 286 ⇒ ×1,29. Lò bánh level 2 (recipe.machineLevel = 2), không phải máy riêng
  // Milestone 6 (Sổ sưu tập 30 món): icon ở assets/v3/items-2.webp khi Codex giao, chưa có ⇒ icon gần nghĩa + bộ lọc màu (ICON_FALLBACK).
  product("banh-ngo", "Bánh ngô", 155),        // 3 ngô + 1 trứng = 119 ⇒ ×1,30
  product("sinh-to-dau", "Sinh tố dâu", 165),  // 3 dâu + 1 sữa = 126 ⇒ ×1,31
  product("bap-rang-bo", "Bắp rang bơ", 315),  // 2 ngô + 1 bơ = 243 ⇒ ×1,30
  product("che-bi-ngo", "Chè bí ngô", 255),    // 1 bí + 1 đường = 197 ⇒ ×1,29
  product("sua-chua", "Sữa chua", 380),        // 2 sữa + 1 đường = 294 ⇒ ×1,29
  product("banh-gao", "Bánh gạo", 375),        // 2 bột gạo + 1 đường = 290 ⇒ ×1,29
  // Sản phẩm vật nuôi (§2.4) — Milestone 4. Giá theo mô phỏng (data/animals.js PROPOSED_SELL, core/README-M4.md "Balance"):
  // mua thức ăn 48 > trứng 32 × 1,15 và 2 × 48 > sữa 72 × 1,15 ⇒ mua thức ăn để nuôi vẫn lỗ (MARKET.assertEconomy).
  { id: "trung-ga", name: "Trứng gà", cat: "chan-nuoi", sell: 32, counts: true, producer: { kind: "animal", id: "ga" }, source: "Chuồng gà", uses: usesOf("trung-ga", ["Đơn hàng"]) },
  { id: "sua", name: "Sữa", cat: "chan-nuoi", sell: 72, counts: true, producer: { kind: "animal", id: "bo-sua" }, source: "Chuồng bò", uses: usesOf("sua", ["Đơn hàng"]) },
  // Vật liệu (§2.7): không bán lại được. Chợ bán đắt để đơn đặc biệt / nhiệm vụ vẫn là nguồn chính.
  material("van-go", "Ván gỗ", 120, 6, "Nâng Nhà kho, Nhà kính, công trình cấp 2"),
  material("hop-dinh", "Hộp đinh", 90, 6, "Nâng Nhà kho, công trình cấp 2"),
  material("thung-son", "Thùng sơn", 150, 15, "Nâng Nhà kho, trang trí"),
  // Trang trí (decor.webp) — túi riêng, không tính sức chứa. Đặt lên bản đồ: chế độ xây dựng (Milestone 3).
  decor("chau-hoa", "Chậu hoa", 40, 3),
  decor("ghe-tre", "Ghế tre", 80, 5),
  decor("co-lau", "Cỏ lau", 60, 6),
  decor("dong-bi-ngo", "Đống bí ngô", 120, 8),
  decor("den-long", "Đèn lồng", 400, 19, "Trang trí hiếm"),
  decor("bu-nhin", "Bù nhìn", 450, 19, "Trang trí hiếm"),
  decor("gieng-da", "Giếng đá", 700, 19, "Trang trí hiếm"),
  decor("cong-tre", "Cổng tre", 900, 19, "Trang trí hiếm"),
];
export const ITEM = Object.freeze(Object.assign(Object.create(null), Object.fromEntries(ITEMS.map((it) => [it.id, it]))));
export const MATERIALS = ITEMS.filter((it) => it.cat === "vat-lieu").map((it) => it.id);
export const PRODUCTS = ITEMS.filter((it) => it.cat === "thanh-pham").map((it) => it.id);
export const isDecor = (id) => ITEM[id]?.bag === "decor";

/**
 * Vị trí ô icon: { sheet: "items" | "decor", col, row }; không có ⇒ null.
 * Món Milestone 6 (items-2): trả ô DỰ PHÒNG trong items.webp + `filter` (mọi nơi vẽ icon cũ vẫn ra hình hợp lý) và `hd`
 * = ô thật trong items-2.webp — giao diện dùng `hd` khi manifest đã có frame cùng tên (ui/sprites.js frame("items-2", id)).
 */
export function iconCell(id) {
  const k = ICON_IDS.indexOf(id);
  if (k >= 0) return { sheet: "items", col: k % ICON_COLS, row: Math.floor(k / ICON_COLS) };
  const k2 = ICON2_IDS.indexOf(id);
  if (k2 >= 0) {
    const [fb, filter] = ICON_FALLBACK[id], f = ICON_IDS.indexOf(fb);
    return { sheet: "items", col: f % ICON_COLS, row: Math.floor(f / ICON_COLS), filter, hd: { sheet: "items-2", id, col: k2 % ICON2_COLS, row: Math.floor(k2 / ICON2_COLS) } };
  }
  const d = DECOR_ICON_IDS.indexOf(id);
  return d < 0 ? null : { sheet: "decor", col: d % 4, row: Math.floor(d / 4) };
}

// Vật nuôi (§2.4) — giá mua / thức ăn / chu kỳ (data/animals.js đọc qua trường `ref`; id "bo" ở đây là id tham chiếu, con bò trong luật là "bo-sua")
// + kiểm chống lời (mua thức ăn → nuôi → bán / chế biến) ở core/market.js. Luật chăn nuôi: core/animals.js (Milestone 4).
export const ANIMAL_REF = [
  { id: "ga", name: "Gà", level: 7, buy: 60, feed: 1, cycleMs: 240_000, output: "trung-ga", qty: 1, max: 6 },
  { id: "bo", name: "Bò", level: 9, buy: 180, feed: 2, cycleMs: 480_000, output: "sua", qty: 1, max: 4 },
];
