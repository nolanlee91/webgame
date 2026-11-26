// Phiếu: yêu cầu của từng ổ (công thức + biến thể), chữ trên phiếu, giá "ổ ba chục". Thuần.
import { RECIPE, RECIPES, LEVEL_USE, LEVEL_NAMES, RETAIL, BACHUC, SPREADS, FILLINGS, NAMES, STOCK } from "../data/economy.js?v=b11";
import { QUIRKS } from "../data/quirks.js?v=b11";
import { RECIPE_NEEDS } from "../data/equipment.js?v=b11";

const lower = (t) => t.toLocaleLowerCase("vi");
/** Món bán được: đủ cấp; khi có trạng thái `s` thì cần thêm đồ / trạm (RECIPE_NEEDS) và ổ gia truyền phải đã đặt tên (s.house). */
export const menuAt = (level, s = null) => RECIPES.filter((r) => r.level <= level && !r.stale && (!s || ((!RECIPE_NEEDS[r.id] || s.owned?.[RECIPE_NEEDS[r.id]]) && (!r.house || s.house))));
export const menuFor = (s) => menuAt(s.level, s);

/** Một ổ theo công thức + danh sách biến thể. */
export function makeItem(recipeId, quirks = [], extra = {}, house = null) {
  const R = RECIPE[recipeId];
  if (R.house && house) extra = { label: house.name, ...extra, price: extra.price ?? house.price };
  const it = {
    recipe: R.id, price: R.price, spreads: { ...(R.house && house ? house.spreads : R.spreads) }, fills: [...(R.house && house ? house.fills : R.fills)], veg: { ...R.veg }, ot: R.ot,
    sauces: { ...R.sauces }, wrap: R.wrap, crispy: false, quirks: [], vegan: !!R.vegan, ...extra,
  };
  for (const q of quirks) {
    const Q = QUIRKS[q];
    if (!Q || (Q.needs && !Q.needs(it)) || it.quirks.some((x) => QUIRKS[x].conflicts?.includes(q) || Q.conflicts?.includes(x))) continue;
    Q.apply(it);
    it.quirks.push(q);
  }
  return it;
}
/** "Ổ ba chục": khách nói giá, người chơi tự chọn nhân. Phiếu không ràng buộc phết / nhân, chấm theo tổng giá. */
export function makeBachuc(target) {
  return {
    recipe: "bachuc", price: target, target, spreads: {}, fills: [], veg: { "do-chua": true, "dua-leo": true, "rau-mui": true, "hanh-la": true },
    ot: 2, sauces: { "nuoc-tuong": true, "tuong-ot": false }, wrap: "giay", crispy: false, quirks: [], vegan: false,
  };
}
/** Giá ổ tự chọn nhân theo bảng giá lẻ: 7k nền + phần lẻ + phụ thu 2k. Phết "nhiều" tính 2 phần. */
export function bachucPrice(loaf) {
  let p = BACHUC.base + BACHUC.surcharge;
  for (const id of SPREADS) p += (RETAIL[id] || 0) * LEVEL_USE[loaf.spreads?.[id] || 0];
  for (const id of loaf.fills || []) p += RETAIL[id] || 0;
  return p;
}
/** Giá cao nhất làm được với nhân đã mở (để không ra giá không với tới). */
const FILL_NEEDS = { trung: "egg-pan", "xiu-mai": "xiu-mai-pot", "thit-nuong": "grill" };
export function bachucMax(level, owned = null) {
  const fills = FILLINGS.filter((id) => STOCK[id].unlock <= level && (!owned || !FILL_NEEDS[id] || owned[FILL_NEEDS[id]]));
  let p = BACHUC.base + BACHUC.surcharge;
  for (const id of SPREADS) if (STOCK[id].unlock <= level) p += RETAIL[id] * 2;
  for (const id of fills) p += RETAIL[id];
  return p;
}

/** Tên ngắn của món ("chả lụa", "pate bơ"…). */
export const loafName = (it) => (it.recipe === "bachuc" ? `ổ ${it.target} ngàn` : it.label ? it.label : lower(RECIPE[it.recipe].name.replace("Bánh mì ", "")));
/** Chữ khách nói: "một ổ chả lụa, không hành, ít ớt". */
export function itemText(it, count = "một") {
  if (it.recipe === "bachuc") return `${count} ổ ${it.target} ngàn`;
  const q = it.quirks.map((x) => QUIRKS[x].label);
  return `${count} ổ ${loafName(it)}${q.length ? ", " + q.join(", ") : ""}`;
}
/** Nhiều ổ: gom ổ giống nhau ("hai ổ chả lụa, một ổ pate bơ không ớt"). */
const COUNT = ["", "một", "hai", "ba", "bốn", "năm", "sáu"];
export function orderText(items) {
  const groups = [];
  for (const it of items) {
    const key = JSON.stringify([it.recipe, it.quirks, it.target]);
    const g = groups.find((x) => x.key === key);
    if (g) g.n++; else groups.push({ key, it, n: 1 });
  }
  return groups.map((g) => itemText(g.it, COUNT[g.n] || String(g.n))).join("; ");
}
/** Dòng chi tiết cho phiếu (UI): những gì khác công thức gốc. */
export function itemSpec(it) {
  const out = [];
  if (it.recipe === "bachuc") return [`Giá ${it.target}k, nhân tự chọn (lệch ≤ ${BACHUC.tolerance}k)`];
  for (const q of it.quirks) out.push(QUIRKS[q].label);
  return out;
}
/** Diễn giải đầy đủ một ổ (bảng công thức trong phiếu). */
export function itemSteps(it) {
  const sp = SPREADS.filter((id) => it.spreads[id]).map((id) => `${NAMES[id]} ${LEVEL_NAMES[it.spreads[id]]}`);
  const fl = it.fills.map((id) => NAMES[id]);
  const vg = Object.entries(it.veg).filter(([, on]) => on).map(([id]) => NAMES[id]);
  const no = Object.entries(it.veg).filter(([, on]) => !on).map(([id]) => "không " + lower(NAMES[id]));
  return { spreads: sp, fills: fl, veg: vg, noVeg: no, ot: LEVEL_NAMES[it.ot], sauces: Object.entries(it.sauces).filter(([, on]) => on).map(([id]) => NAMES[id]) };
}
