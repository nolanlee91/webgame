// Milestone 2 — danh mục hàng KHÔNG phải nông sản (DESIGN-2.0 §2.3, §2.4, §2.7) + giá mua ở chợ.
// Ghi chú: file này được viết song song với data/items.js của Milestone 1 (đã tồn tại, không sửa). Id + giá bán
// khớp nhau; khi ghép, lead có thể gộp `buy` / `shopLevel` / `uses` vào data/items.js rồi bỏ file này.
// Nông sản (ca-rot, ca-chua, dau-tay, ngo, bi-ngo, lua, mia) nằm ở data/crops.js — ở đây chỉ nhắc id dạng chuỗi.
//
// category: "product" (thành phẩm Xưởng) | "animal" (trứng, sữa) | "material" (vật liệu) | "special" (trang trí).
// sell: giá bán GỐC ở chợ (dao động ±15 % theo chu kỳ 3 giờ, xem core/market.js). 0 ⇒ không bán được ở chợ.
// buy / shopLevel: có ⇒ chợ bán món này cho người chơi với giá `buy`, từ cấp `shopLevel`.
// icon: id ô trong assets/v3/items.webp (manifest.json → items.frames) hoặc decor.webp; null ⇒ chưa có icon.

export const CROP_IDS = ["ca-rot", "ca-chua", "dau-tay", "ngo", "bi-ngo", "lua", "mia"];

const product = (id, name, sell, uses) => ({ id, name, category: "product", sell, uses, icon: id });

export const GOODS = [
  // Thành phẩm Xưởng (§2.3)
  product("mut-dau", "Mứt dâu", 74, "Đơn hàng"),
  product("sot-ca-chua", "Sốt cà chua", 48, "Đơn hàng"),
  product("nuoc-ep-ca-rot", "Nước ép cà rốt", 32, "Đơn hàng"),
  // Thức ăn gia súc: chợ bán dự phòng, giá 48 (≥ ngưỡng chống lời khi đổi thức ăn mua → sữa → bơ / phô mai, xem core/market.js).
  { ...product("thuc-an-gia-suc", "Thức ăn gia súc", 19, "Cho gà (1), bò (2) ăn"), buy: 48, shopLevel: 7 },
  product("bot-gao", "Bột gạo", 70, "Bánh trứng, bánh bí ngô"),
  product("bap-rang", "Bắp rang", 78, "Đơn hàng"),
  product("banh-trung", "Bánh trứng", 160, "Đơn hàng"),
  product("banh-bi-ngo", "Bánh bí ngô", 190, "Đơn hàng"),
  product("bo", "Bơ", 150, "Đơn hàng"),
  product("pho-mai", "Phô mai", 240, "Đơn hàng"),
  product("duong", "Đường", 150, "Bánh flan"),
  product("banh-flan", "Bánh flan", 330, "Đơn hàng"),
  // Sản phẩm vật nuôi (§2.4)
  { id: "trung-ga", name: "Trứng gà", category: "animal", sell: 26, uses: "Bánh trứng, bánh bí ngô, bánh flan", icon: "trung-ga" },
  { id: "sua", name: "Sữa", category: "animal", sell: 58, uses: "Bơ, phô mai, bánh flan", icon: "sua" },
  // Vật liệu (§2.7): không bán lại được (sell 0). Chợ bán đắt để đơn đặc biệt / nhiệm vụ vẫn là nguồn chính.
  { id: "van-go", name: "Ván gỗ", category: "material", sell: 0, uses: "Nâng Nhà kho, Nhà kính, công trình cấp 2", icon: "van-go", buy: 120, shopLevel: 6 },
  { id: "hop-dinh", name: "Hộp đinh", category: "material", sell: 0, uses: "Nâng Nhà kho, công trình cấp 2", icon: "hop-dinh", buy: 90, shopLevel: 6 },
  { id: "thung-son", name: "Thùng sơn", category: "material", sell: 0, uses: "Nâng Nhà kho, trang trí", icon: "thung-son", buy: 150, shopLevel: 15 },
  // Trang trí (assets/v3 decor.webp). Không bán lại. Đồ hiếm (§3 cấp 19) chỉ từ cấp 19.
  { id: "chau-hoa", name: "Chậu hoa", category: "special", sell: 0, uses: "Trang trí", icon: "chau-hoa", buy: 40, shopLevel: 3 },
  { id: "ghe-tre", name: "Ghế tre", category: "special", sell: 0, uses: "Trang trí", icon: "ghe-tre", buy: 80, shopLevel: 5 },
  { id: "dong-bi-ngo", name: "Đống bí ngô", category: "special", sell: 0, uses: "Trang trí", icon: "dong-bi-ngo", buy: 120, shopLevel: 8 },
  { id: "co-lau", name: "Cỏ lau", category: "special", sell: 0, uses: "Trang trí", icon: "co-lau", buy: 60, shopLevel: 6 },
  { id: "den-long", name: "Đèn lồng", category: "special", sell: 0, uses: "Trang trí hiếm", icon: "den-long", buy: 400, shopLevel: 19 },
  { id: "bu-nhin", name: "Bù nhìn", category: "special", sell: 0, uses: "Trang trí hiếm", icon: "bu-nhin", buy: 450, shopLevel: 19 },
  { id: "gieng-da", name: "Giếng đá", category: "special", sell: 0, uses: "Trang trí hiếm", icon: "gieng-da", buy: 700, shopLevel: 19 },
  { id: "cong-tre", name: "Cổng tre", category: "special", sell: 0, uses: "Trang trí hiếm", icon: "cong-tre", buy: 900, shopLevel: 19 },
];

export const GOOD = Object.freeze(Object.assign(Object.create(null), Object.fromEntries(GOODS.map((g) => [g.id, g]))));

// Vật nuôi (§2.4) — chỉ dùng ở đây để kiểm chống lời (mua thức ăn → nuôi → bán / chế biến). Luật chăn nuôi là Milestone 4.
export const ANIMAL_REF = [
  { id: "ga", name: "Gà", level: 7, buy: 60, feed: 1, cycleMs: 240_000, output: "trung-ga", qty: 1, max: 6 },
  { id: "bo", name: "Bò", level: 9, buy: 180, feed: 2, cycleMs: 480_000, output: "sua", qty: 1, max: 4 },
];
