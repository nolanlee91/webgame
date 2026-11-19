// 8 công thức theo docs/tiem-tra-sua/ECONOMY.md. Giá vốn KHÔNG ghi tay: core/economy.js tính từ data/ingredients.js
// (test kiểm khớp bảng 11/10/12/14/11/13/17/13). `price` = giá bán (k), `xp` = XP khi được 4–5 sao.
export const RECIPES = [
  { id: "tra-sua-truyen-thong", name: "Trà sữa truyền thống", short: "TS truyền thống", unlock: 1, base: "hong-tra", add: "sua",       sugar: 50, ice: "it",  topping: "tran-chau", price: 27, xp: 8 },
  { id: "tra-dao",              name: "Trà đào",              short: "Trà đào",         unlock: 1, base: "hong-tra", add: "dao",       sugar: 50, ice: "vua", topping: "none",      price: 26, xp: 8 },
  { id: "o-long-thach",         name: "Trà sữa ô long thạch", short: "Ô long thạch",    unlock: 2, base: "o-long",   add: "sua",       sugar: 50, ice: "vua", topping: "thach",     price: 32, xp: 9 },
  { id: "sua-tuoi-duong-den",   name: "Sữa tươi trân châu đường đen", short: "Sữa tươi đường đen", unlock: 3, base: "sua-tuoi", add: "duong-den", sugar: 0, ice: "it", topping: "tran-chau", price: 36, xp: 10 },
  { id: "tra-vai-lai",          name: "Trà vải lài",          short: "Trà vải lài",     unlock: 4, base: "tra-lai",  add: "vai",       sugar: 30, ice: "vua", topping: "none",      price: 31, xp: 9 },
  { id: "o-long-kem-sua",       name: "Ô long kem sữa",       short: "Ô long kem sữa",  unlock: 6, base: "o-long",   add: "kem-sua",   sugar: 30, ice: "it",  topping: "none",      price: 37, xp: 10 },
  { id: "matcha-pudding",       name: "Matcha pudding",       short: "Matcha pudding",  unlock: 8, base: "matcha",   add: "sua",       sugar: 50, ice: "it",  topping: "pudding",   price: 43, xp: 12 },
  { id: "tra-chanh-day-thach",  name: "Trà chanh dây thạch",  short: "Chanh dây thạch", unlock: 10, base: "tra-lai", add: "chanh-day", sugar: 50, ice: "vua", topping: "thach",     price: 35, xp: 10 },
];
export const RECIPE = Object.fromEntries(RECIPES.map((r) => [r.id, r]));
/** Các bước có thể chấm đúng / sai trong một đơn. */
export const ORDER_FIELDS = ["base", "add", "sugar", "ice", "topping"];
