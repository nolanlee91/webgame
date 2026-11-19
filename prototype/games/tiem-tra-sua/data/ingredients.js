// Kho nguyên liệu và các lựa chọn ở từng bước pha. Đơn vị tiền: k (1.000 đồng ảo). Số liệu theo docs/tiem-tra-sua/ECONOMY.md.
// `icon` = [bí danh atlas, tên frame] — xem render/atlas.js (SHEETS). Mọi hình trong UI đi qua manifest, không dùng emoji.

/** Hàng trong kho: mỗi đơn vị là một "phần". `pack` = số phần mỗi lần nhập. */
export const STOCK = {
  "ly":        { name: "Ly + nắp",      cost: 2, pack: 10, unlock: 1, icon: ["pantry", "cup-stack"] },
  "hong-tra":  { name: "Hồng trà",      cost: 2, pack: 6,  unlock: 1, icon: ["cupui", "black-tea"] },
  "o-long":    { name: "Ô long",        cost: 2, pack: 6,  unlock: 2, icon: ["pantry", "oolong"] },
  "tra-lai":   { name: "Trà lài",       cost: 2, pack: 6,  unlock: 4, icon: ["pantry", "jasmine"] },
  "matcha":    { name: "Matcha",        cost: 6, pack: 4,  unlock: 8, icon: ["decor", "matcha"] },
  "sua":       { name: "Sữa",           cost: 3, pack: 6,  unlock: 1, icon: ["cupui", "milk"] },
  "kem-sua":   { name: "Kem sữa",       cost: 7, pack: 4,  unlock: 6, icon: ["pantry", "cream"] },
  "duong":     { name: "Đường",         cost: 1, pack: 10, unlock: 1, icon: ["cupui", "sugar"] },
  "da":        { name: "Đá",            cost: 1, pack: 10, unlock: 1, icon: ["cupui", "ice"] },
  "tran-chau": { name: "Trân châu",     cost: 2, pack: 6,  unlock: 1, icon: ["cupui", "pearls"] },
  "thach":     { name: "Thạch",         cost: 3, pack: 5,  unlock: 2, icon: ["decor", "clear-jelly"] },
  "pudding":   { name: "Pudding",       cost: 4, pack: 4,  unlock: 8, icon: ["decor", "pudding"] },
  "dao":       { name: "Đào",           cost: 4, pack: 4,  unlock: 1, icon: ["decor", "peach"] },
  "vai":       { name: "Vải",           cost: 5, pack: 4,  unlock: 4, icon: ["decor", "lychee"] },
  "chanh-day": { name: "Chanh dây",     cost: 4, pack: 4,  unlock: 10, icon: ["decor", "passionfruit"] },
  "duong-den": { name: "Sốt đường đen", cost: 3, pack: 5,  unlock: 3, icon: ["pantry", "dark-sugar-syrup"] },
};
export const STOCK_IDS = Object.keys(STOCK);

/** Sức chứa kho lúc đầu (phần) và gói học đủ khoảng 8 ly cơ bản. */
export const START_CAPACITY = 60;
export const START_STOCK = { "ly": 10, "hong-tra": 10, "sua": 8, "duong": 8, "da": 10, "tran-chau": 8, "dao": 4 };

/** Bảy bước pha theo đúng thứ tự (GAME-DESIGN: ly → trà → sữa/thành phần khác → đường → đá → topping → nắp). */
export const STEPS = ["cup", "base", "add", "sugar", "ice", "topping", "lid"];
export const STEP_LABEL = { cup: "Ly", base: "Trà", add: "Thêm", sugar: "Đường", ice: "Đá", topping: "Topping", lid: "Nắp" };
export const STEP_VERB = {
  cup: "Lấy ly", base: "Rót trà nền", add: "Thêm sữa / vị", sugar: "Chọn mức đường", ice: "Chọn mức đá", topping: "Thêm topping", lid: "Đóng nắp",
};
export const STEP_ICON = {
  cup: ["pantry", "cup-stack"], base: ["cupui", "black-tea"], add: ["cupui", "milk"], sugar: ["cupui", "sugar"],
  ice: ["cupui", "ice"], topping: ["cupui", "pearls"], lid: ["pantry", "lid-stack"],
};

/** Lựa chọn mỗi bước. `use` = phần trừ kho khi xác nhận. `liquid` mô tả lớp chất lỏng cho ly (core/cupview.js). */
export const CHOICES = {
  cup: [{ id: "ly", name: "Ly nhựa", use: { "ly": 1 }, unlock: 1, icon: ["pantry", "cup-stack"] }],
  base: [
    { id: "hong-tra", name: "Hồng trà", use: { "hong-tra": 1 }, unlock: 1, liquid: { color: "amber", level: 50 }, icon: ["cupui", "black-tea"] },
    { id: "o-long",   name: "Ô long",   use: { "o-long": 1 },   unlock: 2, liquid: { color: "amber", level: 50 }, icon: ["pantry", "oolong"] },
    { id: "tra-lai",  name: "Trà lài",  use: { "tra-lai": 1 },  unlock: 4, liquid: { color: "amber", level: 50 }, icon: ["pantry", "jasmine"] },
    { id: "matcha",   name: "Matcha",   use: { "matcha": 1 },   unlock: 8, liquid: { color: "matcha", level: 75 }, icon: ["decor", "matcha"] },
    { id: "sua-tuoi", name: "Sữa tươi làm nền", use: { "sua": 2 }, unlock: 3, liquid: { color: "milk", level: 50 }, icon: ["pantry", "milk-carton"] },
  ],
  add: [
    { id: "none",      name: "Không thêm", use: {}, unlock: 1 },
    { id: "sua",       name: "Sữa",       use: { "sua": 1 },       unlock: 1, liquid: { color: "milk" }, icon: ["cupui", "milk"] },
    { id: "dao",       name: "Đào",       use: { "dao": 1 },       unlock: 1, liquid: { color: "amber", rise: 25 }, icon: ["decor", "peach"] },
    { id: "kem-sua",   name: "Kem sữa",   use: { "kem-sua": 1 },   unlock: 6, liquid: { color: "milk" }, icon: ["pantry", "cream"] },
    { id: "vai",       name: "Vải",       use: { "vai": 1 },       unlock: 4, liquid: { color: "amber", rise: 25 }, icon: ["decor", "lychee"] },
    { id: "chanh-day", name: "Chanh dây", use: { "chanh-day": 1 }, unlock: 10, liquid: { color: "amber", rise: 25 }, icon: ["decor", "passionfruit"] },
    { id: "duong-den", name: "Sốt đường đen", use: { "duong-den": 1 }, unlock: 3, liquid: { rise: 25 }, icon: ["pantry", "dark-sugar-syrup"] },
  ],
  sugar: [0, 30, 50, 70, 100].map((v) => ({ id: v, name: v + "%", use: v > 0 ? { "duong": 1 } : {}, unlock: 1, liquid: v > 0 ? { rise: 25 } : null })),
  ice: [
    { id: "khong", name: "Không đá", use: {}, unlock: 1 },
    { id: "it",    name: "Ít đá",    use: { "da": 1 }, unlock: 1 },
    { id: "vua",   name: "Đá vừa",   use: { "da": 1 }, unlock: 1 },
    { id: "nhieu", name: "Nhiều đá", use: { "da": 1 }, unlock: 1 },
  ],
  topping: [
    { id: "none",      name: "Không topping", use: {}, unlock: 1 },
    { id: "tran-chau", name: "Trân châu", use: { "tran-chau": 1 }, unlock: 1, layer: "pearls-bottom", icon: ["cupui", "pearls"] },
    { id: "thach",     name: "Thạch",     use: { "thach": 1 },     unlock: 2, layer: "jelly-bottom", icon: ["decor", "clear-jelly"] },
    { id: "pudding",   name: "Pudding",   use: { "pudding": 1 },   unlock: 8, layer: "jelly-bottom", icon: ["decor", "pudding"] },
  ],
  lid: [{ id: "dong-nap", name: "Đóng nắp", use: {}, unlock: 1, icon: ["pantry", "lid-stack"] }],
};
export const ICE_ORDER = ["khong", "it", "vua", "nhieu"];
export const SUGAR_ORDER = [0, 30, 50, 70, 100];

export const choice = (step, id) => (CHOICES[step] || []).find((c) => c.id === id) || null;
export const choiceName = (step, id) => choice(step, id)?.name ?? String(id);
/** Đường/đá tính 1 phần bất kể mức: ECONOMY ghi "đường và đá mỗi phần 1k", 0% hoặc không đá trừ phần không dùng. */
export function useOf(step, id) { return choice(step, id)?.use || {}; }
