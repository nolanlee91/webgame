// Chấm ly giao (GAME-DESIGN "Review"): 60 đúng công thức + 25 thời gian + 15 kỳ vọng của khách = điểm thô 0–100 → 1..5 sao.
// Công thức: món nền (trà 15 + phần thêm 10) 25, đường 10, đá 10, topping 10, ly + nắp 5.
// Sai món nền (trà hoặc phần thêm khác đơn) hoặc giao nhầm khách ⇒ tối đa 2 sao.
import { ICE_ORDER, SUGAR_ORDER } from "../data/ingredients.js";
import { STAR_CUTS } from "../data/shift.js";

export function cupSpec(cup) {
  const spec = {};
  for (const st of cup.steps) spec[st.step] = st.id;
  return spec;
}
export const starsFor = (raw) => { let s = 1; STAR_CUTS.forEach((cut, i) => { if (raw >= cut) s = i + 1; }); return s; };

function levelPts(order, got, scale, hi, lo, errors) {
  const a = scale.indexOf(order), b = scale.indexOf(got);
  if (a === b) return 10;
  errors.push(b > a ? hi : lo);
  return Math.abs(a - b) === 1 ? 5 : 0;
}

/**
 * @param order { base, add, sugar, ice, topping }
 * @param cup   { steps, sealed }
 * @param frac  thời gian chờ / kiên nhẫn (0..1+)
 * @param expect kỳ vọng nhóm khách
 * @param wrongCustomer ly pha cho khách khác
 */
export function scoreServe(order, cup, frac, expect, wrongCustomer = false) {
  const got = cupSpec(cup);
  const errors = [];
  let recipe = 0;
  const baseOk = got.base === order.base, addOk = (got.add ?? "none") === order.add;
  if (baseOk) recipe += 15; else errors.push("baseWrong");
  if (addOk) recipe += 10; else errors.push("addWrong");
  recipe += levelPts(order.sugar, got.sugar, SUGAR_ORDER, "sugarHigh", "sugarLow", errors);
  recipe += levelPts(order.ice, got.ice, ICE_ORDER, "iceHigh", "iceLow", errors);
  const tg = got.topping ?? "none";
  if (tg === order.topping) recipe += 10;
  else if (order.topping === "none") { recipe += 5; errors.push("toppingExtra"); }
  else if (tg === "none") errors.push("toppingMissing");
  else errors.push("toppingWrong");
  if (cup.sealed) recipe += 5;

  const f = Math.max(0, frac);
  const time = f <= 0.5 ? 25 : Math.max(5, Math.round(25 - ((Math.min(f, 1) - 0.5) / 0.5) * 20));
  if (time < 15) errors.push("slow");

  const sugarOk = got.sugar === order.sugar, iceOk = got.ice === order.ice;
  let exp = 0;
  if (expect === "topping") exp = tg === order.topping ? 15 : 0;
  else if (expect === "speed") exp = Math.round(15 * Math.max(0, Math.min(1, (0.8 - f) / 0.5)));
  else if (expect === "exact") exp = (sugarOk ? 8 : 0) + (iceOk ? 7 : 0);
  else exp = baseOk && addOk ? 15 : 0;

  const raw = recipe + time + exp;
  const wrongBase = !baseOk || !addOk;
  let stars = starsFor(raw);
  if (wrongBase || wrongCustomer) stars = Math.min(stars, 2);
  return { raw, stars, recipe, time, expect: exp, errors, wrongBase, wrongCustomer };
}
