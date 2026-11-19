// Danh mục vật phẩm trong kho (DESIGN-2.0 §2.3, §2.4, §2.7). Kho thống nhất theo id vật phẩm.
// cat: nhóm kệ trong Nhà kho. counts=false ⇒ không tính vào sức chứa (vật liệu).
// producer: cách làm ra — { kind: "crop", id } | { kind: "machine", id } | { kind: "animal", id } | { kind: "reward" }.
// Món chế biến / vật nuôi đã có trong dữ liệu để thiết kế khớp Milestone 2–4, nhưng chưa có máy / chuồng ⇒ không bao giờ được yêu cầu trong đơn.
import { CROPS } from "./crops.js";

// Thứ tự ô trong assets/v3/items.webp (8 × 4, ô 64 px), khớp assets/v3/manifest.json.
export const ICON_IDS = [
  "ca-rot", "ca-chua", "dau-tay", "ngo", "bi-ngo", "lua", "mia", "hat-giong",
  "mut-dau", "sot-ca-chua", "nuoc-ep-ca-rot", "thuc-an-gia-suc", "bot-gao", "bap-rang", "banh-trung", "banh-bi-ngo",
  "trung-ga", "sua", "bo", "pho-mai", "duong", "banh-flan", "van-go", "hop-dinh",
  "thung-son", "dong-xu", "sao-xp", "kho", "bua-xay-dung", "bang-don", "chuong-thong-bao", "o-khoa",
];
export const ICON_COLS = 8, ICON_ROWS = 4;

export const CATEGORIES = [
  { id: "nong-san", name: "Nông sản" },
  { id: "chan-nuoi", name: "Chăn nuôi" },
  { id: "thanh-pham", name: "Thành phẩm" },
  { id: "vat-lieu", name: "Vật liệu" },
  { id: "dac-biet", name: "Đặc biệt" },
];

const product = (id, name, sell, machine, uses) => ({ id, name, cat: "thanh-pham", sell, counts: true, producer: { kind: "machine", id: machine }, source: "Xưởng chế biến (sắp có)", uses });
const material = (id, name, uses) => ({ id, name, cat: "vat-lieu", sell: 0, counts: false, producer: { kind: "reward" }, source: "Đơn đặc biệt · thu hoạch (hiếm)", uses });

export const ITEMS = [
  ...CROPS.map((c) => ({ id: c.id, name: c.name, cat: "nong-san", sell: c.sell, counts: true, producer: { kind: "crop", id: c.id }, source: c.requires ? "Trồng trong Nhà kính (sắp có)" : "Trồng ở ruộng", uses: c.uses })),
  product("mut-dau", "Mứt dâu", 74, "bep-sen", "Đơn hàng"),
  product("sot-ca-chua", "Sốt cà chua", 48, "bep-sen", "Đơn hàng"),
  product("nuoc-ep-ca-rot", "Nước ép cà rốt", 32, "bep-sen", "Đơn hàng"),
  product("thuc-an-gia-suc", "Thức ăn gia súc", 19, "coi-xay", "Cho gà, bò ăn"),
  product("bot-gao", "Bột gạo", 70, "coi-xay", "Bánh trứng, bánh bí ngô"),
  product("bap-rang", "Bắp rang", 78, "lo-banh", "Đơn hàng"),
  product("banh-trung", "Bánh trứng", 160, "lo-banh", "Đơn hàng"),
  product("banh-bi-ngo", "Bánh bí ngô", 190, "lo-banh", "Đơn hàng"),
  product("bo", "Bơ", 150, "may-bo-sua", "Đơn hàng"),
  product("pho-mai", "Phô mai", 240, "may-bo-sua", "Đơn hàng"),
  product("duong", "Đường", 150, "noi-duong", "Bánh flan"),
  product("banh-flan", "Bánh flan", 330, "lo-banh-2", "Đơn hàng"),
  { id: "trung-ga", name: "Trứng gà", cat: "chan-nuoi", sell: 26, counts: true, producer: { kind: "animal", id: "ga" }, source: "Chuồng gà (sắp có)", uses: "Bánh trứng, bánh flan" },
  { id: "sua", name: "Sữa", cat: "chan-nuoi", sell: 58, counts: true, producer: { kind: "animal", id: "bo" }, source: "Chuồng bò (sắp có)", uses: "Bơ, phô mai" },
  material("van-go", "Ván gỗ", "Nâng Nhà kho, công trình"),
  material("hop-dinh", "Hộp đinh", "Nâng Nhà kho, công trình"),
  material("thung-son", "Thùng sơn", "Nâng Nhà kho, trang trí"),
];
export const ITEM = Object.freeze(Object.assign(Object.create(null), Object.fromEntries(ITEMS.map((it) => [it.id, it]))));
export const MATERIALS = ITEMS.filter((it) => it.cat === "vat-lieu").map((it) => it.id);
/** Vị trí ô icon (cột, hàng) trong items.webp; không có ⇒ null. */
export function iconCell(id) {
  const k = ICON_IDS.indexOf(id);
  return k < 0 ? null : { col: k % ICON_COLS, row: Math.floor(k / ICON_COLS) };
}
