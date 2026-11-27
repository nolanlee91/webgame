// Chấm điểm (GAME-DESIGN §3.5): điểm 0–100 = công thức 50 (nhân 20, phết 8, rau dưa 8, gia vị 6, gói 4, nướng lại nếu phiếu cần 4)
// + độ giòn 15 (≥ 85 đủ, < 50 còn 0) + thời gian 20 (giao trước nửa kiên nhẫn đủ 20, sát hạn còn 4) + kỳ vọng 15 (biến thể trên phiếu).
// Mốc sao 1/2/3/4/5 tại 0/40/55/70/85. Lỗi đặc thù (data/lines-mistakes.js) đặt trần sao. Thuần.
import { SPREADS, VEG_IDS, SAUCES, BACHUC, DISPLAY, TOASTER, FILLINGS } from "../data/economy.js?v=b13";
import { MISTAKES } from "../data/lines-mistakes.js?v=b13";
import { QUIRKS } from "../data/quirks.js?v=b13";
import { bachucPrice } from "./order.js?v=b13";

export const STAR_AT = [0, 40, 55, 70, 85];
export const starsFor = (points) => { let st = 1; for (let i = 0; i < STAR_AT.length; i++) if (points >= STAR_AT[i]) st = i + 1; return st; };
const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
const MEAT = new Set(FILLINGS.filter((id) => id !== "cha-chay"));

/** Thứ tự ưu tiên khi chọn câu cho lỗi (lỗi nặng trước). */
export const MISTAKE_ORDER = ["veganMeat", "wrongFilling", "swapped", "burnt", "noPate", "onionAnyway", "tooSpicy", "soggy", "notToasted", "wrongWrap", "wrongChange"];

/** Chấm một ổ đã gói `loaf` theo yêu cầu `it`. Trả { recipe, crisp, quirk, errors, mistakes, quirkOk }. */
export function checkLoaf(loaf, it) {
  const errors = [], mistakes = new Set();
  let fill = 20, spread = 8, veg = 8, spice = 6, wrap = 4, toast = 4;
  // nhân + phết
  if (it.recipe === "bachuc") {
    const p = bachucPrice(loaf), d = p - it.target;
    if (d < -BACHUC.tolerance) { fill = Math.max(0, 20 + d * 2); errors.push("bachucLow"); }
    else if (d > BACHUC.tolerance) errors.push("bachucHigh"); // khách vui, tiệm lỗ
  } else {
    const want = it.fills, got = loaf.fills || [];
    if (!sameSet(want, got)) {
      const missing = want.filter((x) => !got.includes(x)), extra = got.filter((x) => !want.includes(x));
      fill = Math.max(0, 20 - missing.length * 12 - extra.length * 6);
      if (missing.length || extra.some((x) => MEAT.has(x) || x === "cha-chay")) { mistakes.add("wrongFilling"); errors.push("fill"); }
    }
    for (const id of SPREADS) {
      const w = it.spreads[id] || 0, g = loaf.spreads?.[id] || 0;
      if (w === g) continue;
      spread -= (w === 0) !== (g === 0) ? 4 : 2;
      if (id === "pate" && w > 0 && g === 0) mistakes.add("noPate");
      errors.push("spread-" + id);
    }
    spread = Math.max(0, spread);
  }
  // rau dưa
  for (const id of VEG_IDS) {
    const w = !!it.veg[id], g = !!loaf.veg?.[id];
    if (w !== g) { veg -= 2; errors.push("veg-" + id); if (id === "hanh-la" && !w && g && it.quirks.some((q) => q === "khong-hanh" || q === "khong-rau")) mistakes.add("onionAnyway"); }
  }
  // gia vị
  const dOt = (loaf.ot || 0) - it.ot;
  if (dOt) { spice -= Math.min(4, Math.abs(dOt) * 2); errors.push("ot"); }
  if (dOt >= 2 || (it.ot === 0 && (loaf.ot || 0) >= 2)) mistakes.add("tooSpicy");
  for (const id of SAUCES) if (!!it.sauces[id] !== !!loaf.sauces?.[id]) { spice -= 1; errors.push("sauce-" + id); }
  spice = Math.max(0, spice);
  // gói
  if ((it.wrap === "cat-doi") !== (loaf.wrap === "cat-doi") || (it.bag && loaf.wrap !== "tui")) { wrap = 0; mistakes.add("wrongWrap"); errors.push("wrap"); }
  // giòn / cháy
  const crisp = Math.round(loaf.crisp ?? 0);
  if (it.crispy && crisp < TOASTER.minCrisp) { toast = 0; if (crisp >= DISPLAY.soggy) mistakes.add("notToasted"); errors.push("crispy"); }
  if (loaf.burnt) { mistakes.add("burnt"); errors.push("burnt"); }
  if (crisp < DISPLAY.soggy) { mistakes.add("soggy"); errors.push("soggy"); }
  // chay dính mặn
  if (it.vegan && ((loaf.spreads?.pate || 0) > 0 || (loaf.spreads?.mayo || 0) > 0 || (loaf.fills || []).some((x) => MEAT.has(x)))) mistakes.add("veganMeat");
  const recipe = fill + spread + veg + spice + wrap + toast;
  const crispPts = loaf.burnt ? 0 : crisp >= 85 ? 15 : crisp < DISPLAY.soggy ? 0 : Math.round(((crisp - DISPLAY.soggy) / (85 - DISPLAY.soggy)) * 15);
  // kỳ vọng: mỗi biến thể trên phiếu không đạt −5; ổ xém cho khách không dặn giòn −3
  const quirkOk = it.quirks.map((q) => ({ q, ok: quirkSatisfied(q, loaf, it) }));
  let quirk = 15 - quirkOk.filter((x) => !x.ok).length * 5;
  if (loaf.dark && !it.crispy) quirk -= 3;
  if (it.recipe === "bachuc" && errors.includes("bachucLow")) quirk -= 8;
  return { recipe, crisp: crispPts, quirk: Math.max(0, quirk), errors, mistakes: [...mistakes], quirkOk };
}

export function quirkSatisfied(q, loaf, it) {
  switch (q) {
    case "khong-hanh": return !loaf.veg?.["hanh-la"];
    case "khong-rau": return !loaf.veg?.["hanh-la"] && !loaf.veg?.["rau-mui"];
    case "khong-do-chua": return !loaf.veg?.["do-chua"];
    case "it-ot": return (loaf.ot || 0) <= 1;
    case "khong-ot": return (loaf.ot || 0) === 0;
    case "nhieu-ot": return (loaf.ot || 0) === 3;
    case "nhieu-pate": return (loaf.spreads?.pate || 0) === 3;
    case "gion-gion": return (loaf.crisp || 0) >= TOASTER.minCrisp && !loaf.burnt;
    case "cat-doi": return loaf.wrap === "cat-doi";
    case "them-trung": return (loaf.fills || []).includes("trung");
    default: return QUIRKS[q] ? true : true;
  }
}

/** Điểm thời gian theo phần kiên nhẫn đã dùng. */
export function timePoints(waitMs, patience) {
  const f = waitMs / Math.max(1, patience);
  if (f <= 0.5) return 20;
  if (f >= 1) return 4;
  return Math.round(20 - ((f - 0.5) / 0.5) * 16);
}

/** Chấm cả đơn: trung bình điểm các ổ (thời gian chung), lỗi gộp, phát hiện tráo phần (ổ i khớp hoàn toàn ổ j). */
export function scoreOrder(c, waitMs) {
  const per = c.items.map((it, i) => checkLoaf(c.filled[i], it));
  // tráo đơn: ổ i sai nhưng khớp hẳn yêu cầu của ổ j khác (cùng đơn)
  if (c.items.length > 1) {
    per.forEach((p, i) => {
      if (!p.errors.length) return;
      const j = c.items.findIndex((it, k) => k !== i && !checkLoaf(c.filled[i], it).errors.length);
      if (j >= 0) { p.mistakes = [...new Set([...p.mistakes.filter((m) => m !== "wrongFilling"), "swapped"])]; }
    });
  }
  const time = timePoints(waitMs, c.patience);
  const pts = per.map((p) => p.recipe + p.crisp + p.quirk + time);
  const points = Math.round(pts.reduce((a, b) => a + b, 0) / pts.length);
  const mistakes = MISTAKE_ORDER.filter((m) => per.some((p) => p.mistakes.includes(m)));
  let stars = starsFor(points);
  for (const m of mistakes) stars = Math.min(stars, MISTAKES[m].cap);
  if (per.some((p) => p.errors.includes("bachucLow"))) stars = Math.min(stars, 3); // "ổ ba chục mà ba sợi chả"
  return { points, stars, time, per, mistakes, errors: [...new Set(per.flatMap((p) => p.errors))] };
}
