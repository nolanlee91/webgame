// Chấm điểm mỗi dĩa 0–100 (GAME-DESIGN §3.8) + 13 kiểu lỗi (DRAMA.md §3). Thuần.
// Công thức 45 (đúng món 20 · đủ lớp 15 · đúng biến thể 10) · Nướng 20 · Thời gian 20 (chấm lúc dĩa xuống bàn)
// · Phục vụ 15 (trà đá 5 · bàn sạch 4 · canh 3 · tính tiền nhanh 3, chấm lúc trả tiền).
// Sao 1–5 tại 0 / 40 / 55 / 70 / 85, rồi kẹp theo trần lỗi. Lỗi 5 (sườn sống) và 13 (chay dính mặn) luôn mở hội thoại xin lỗi nghiêm túc.
import { STAR_CUTS, GRILL } from "../data/economy.js?v=c9";
import { targetOf } from "./plate.js?v=c9";

/** 13 kiểu lỗi: trần sao + có phải lỗi món (mở khiếu nại khi giao) không. */
export const MISTAKES = {
  wrongDish: { name: "sai món", cap: 2, food: true },
  biAnyway: { name: "dặn không bì mà có bì", cap: 3, food: true },
  hardEgg: { name: "trứng lòng đào thành chín kỹ", cap: 4, food: true },
  burnt: { name: "sườn cháy khét", cap: 2, food: true },
  raw: { name: "sườn còn sống", cap: 1, food: true, serious: true },
  noMoHanh: { name: "quên mỡ hành", cap: 4, food: true },
  sauceMixed: { name: "nước mắm chan khi dặn để riêng", cap: 3, food: true },
  noTea: { name: "quên châm trà đá", cap: 4 },
  dirtyTable: { name: "bàn dơ", cap: 3 },
  wrongTable: { name: "bưng nhầm bàn", cap: 2, food: true },
  swapped: { name: "tráo dĩa trong bàn", cap: 3, food: true },
  wrongBill: { name: "tính tiền sai", cap: 2 },
  veganMeat: { name: "cơm chay dính mặn", cap: 1, food: true, serious: true },
};
export const MISTAKE_IDS = Object.keys(MISTAKES);
/** Trần phụ (không phải lỗi trong 13 kiểu): ăn hộp tại bàn, sườn khô vì giữ ấm lâu. */
export const SOFT_CAPS = { box: 4, dry: 4, plainRice: 4 };

export function starsFor(points) { let st = 1; STAR_CUTS.forEach((c, i) => { if (points >= c) st = i + 1; }); return st; }

/** So dĩa với mục tiêu của phiếu: lỗi (13 kiểu), lỗi nhỏ (thiếu lớp / sai biến thể), điểm công thức + nướng. */
export function judge(plate, ticket) {
  const tg = targetOf(ticket);
  const mistakes = [], errors = [];
  const p = plate || { kind: "dia", com: 0, moHanh: 0, meat: null, bi: false, cha: false, trung: null, doChua: false, duaLeo: false, sauce: null, ngo: false, hanhPhi: false };
  // món mặn chính
  let proteinDiff = 0, meatWrong = false;
  if (tg.meat) { if (!p.meat || p.meat.item !== tg.meat) { meatWrong = true; proteinDiff++; } }
  else if (p.meat) proteinDiff += 2; // món không thịt mà có thịt
  const dishBi = !!targetOf({ ...ticket, quirks: [] }).bi;
  if (dishBi !== p.bi && !(dishBi && ticket.quirks?.includes("khongBi"))) proteinDiff++;
  if (!!tg.cha !== p.cha) proteinDiff++;
  if (!!tg.trung !== !!p.trung) proteinDiff++;
  const wrongDish = meatWrong || proteinDiff >= 2;
  if (wrongDish) mistakes.push("wrongDish");
  if (tg.vegan && (p.moHanh > 0 || (p.meat && (p.meat.item !== "dau-hu" || p.meat.tainted)) || (p.sauce && p.sauceKind === "nuoc-mam"))) mistakes.push("veganMeat"); // S: đậu hũ nướng trên chỗ vừa nướng thịt = dính mặn
  // lớp
  const need = [];
  if (tg.com) need.push(p.com >= 1);
  if (tg.moHanh) need.push(p.moHanh >= 1);
  if (tg.hanhPhi) need.push(!!p.hanhPhi);
  if (tg.meat) need.push(!!p.meat);
  if (tg.bi) need.push(p.bi);
  if (tg.cha) need.push(p.cha);
  if (tg.trung) need.push(!!p.trung);
  if (tg.doChua) need.push(p.doChua);
  if (tg.duaLeo) need.push(p.duaLeo);
  if (tg.sauce) need.push(p.sauce !== null);
  if (tg.ngo) need.push(p.ngo);
  const have = need.filter(Boolean).length;
  if (have < need.length) errors.push("missing");
  // biến thể
  let variant = 0;
  const q = new Set(ticket.quirks || []);
  if (q.has("khongBi") && p.bi) mistakes.push("biAnyway");
  if (tg.moHanh && (p.moHanh === 0 || (tg.moHanh === 2 && p.moHanh < 2))) mistakes.push("noMoHanh");
  if (!tg.moHanh && q.has("khongMoHanh") && p.moHanh > 0) { variant++; errors.push("moHanhAnyway"); }
  if (tg.com === 2 && p.com === 1) { variant++; errors.push("themCom"); }
  if (tg.com === 1 && p.com === 2) { variant++; errors.push("extraCom"); }
  if (q.has("khongDoChua") && p.doChua) { variant++; errors.push("doChuaAnyway"); }
  if (tg.trung === "runny" && p.trung && p.trung !== "runny") mistakes.push("hardEgg");
  if (p.trung === "burnt" && !mistakes.includes("hardEgg")) { variant++; errors.push("burntEgg"); }
  if ((tg.sauce === "chen" || tg.sauce === "bich") && p.sauce === "chan") mistakes.push("sauceMixed");
  if (tg.sauce === "bich" && p.sauce === "chen") { variant++; errors.push("sauceCup"); }
  if (tg.kind === "dia" && p.kind === "hop") errors.push("box");
  if (tg.kind === "hop" && p.kind === "dia") { variant++; errors.push("plateTakeaway"); }
  // nướng
  let grill = 20;
  if (tg.meat && p.meat && !meatWrong) {
    const r = p.meat.result;
    if (r === "raw" || r === "half") { grill = 0; mistakes.push("raw"); }
    else if (r === "burnt") { grill = 0; mistakes.push("burnt"); }
    else if (r === "charred") grill = tg.charred ? 20 : 16;
    else grill = tg.charred ? 15 : 20;
    if ((r === "done" || r === "charred") && p.meat.fresh < GRILL.dryBelow) { grill = Math.min(grill, 14); errors.push("dry"); }
  } else if (tg.meat) grill = 0;
  const recipe = (wrongDish ? 0 : 20) + Math.round(15 * (need.length ? have / need.length : 1)) + Math.max(0, 10 - 5 * variant);
  return { mistakes: [...new Set(mistakes)], errors, recipe, grill, perfect: mistakes.length === 0 && errors.length === 0 && have === need.length };
}
/** Dĩa có đúng hoàn toàn phiếu này không (để nhận ra bưng nhầm bàn / tráo dĩa). */
export const fits = (plate, ticket) => judge(plate, ticket).perfect;

/** Điểm thời gian: dĩa xuống bàn trước nửa kiên nhẫn được 20, sát hạn còn 4. */
export function timePoints(waitMs, patienceMs) {
  if (waitMs <= patienceMs / 2) return 20;
  const f = Math.min(1, (waitMs - patienceMs / 2) / (patienceMs / 2));
  return Math.round(20 - 16 * f);
}
/** Chấm phần dĩa lúc dĩa xuống bàn. others = các phiếu đang chờ khác ({ticket, sameTable}). */
export function scorePlate(plate, ticket, { waitMs = 0, patienceMs = 50000, others = [], dishOrderBonus = false, houseSauce = 0 } = {}) {
  let j = judge(plate, ticket);
  let swap = null;
  if (!j.perfect) {
    const hit = others.find((o) => fits(plate, o.ticket));
    if (hit) { swap = hit.sameTable ? "swapped" : "wrongTable"; j = { ...j, mistakes: [swap], errors: [] }; }
  }
  const time = timePoints(waitMs, patienceMs);
  let partial = (swap ? 20 : j.recipe) + (swap ? 0 : j.grill) + time + (dishOrderBonus && !swap ? 3 : 0);
  if (swap) partial = Math.min(partial, 40);
  // S (M5): nước mắm nhà pha (+1 điểm kỳ vọng mỗi bậc) khi dĩa có chan / chén / bịch nước mắm (không áp cho dĩa chay)
  const sauceBonus = !swap && houseSauce > 0 && plate?.sauce && !targetOf(ticket).vegan ? houseSauce : 0;
  return { recipe: j.recipe, grill: j.grill, time, sauceBonus, partial: Math.min(88, partial) + sauceBonus, mistakes: j.mistakes, errors: j.errors, swapTk: swap ? others.find((o) => fits(plate, o.ticket)).ticket.id : null };
}
/** Điểm phục vụ lúc trả tiền. */
export function servicePoints({ noTea = false, dirty = false, canhOk = true, billMs = 0, auto = false } = {}) {
  const bill = auto ? 0 : billMs <= 6000 ? 3 : billMs <= 15000 ? 2 : billMs <= 25000 ? 1 : 0;
  return (noTea ? 0 : 5) + (dirty ? 0 : 4) + (canhOk ? 3 : 0) + bill;
}
/** Sao cuối của một người: điểm → sao → kẹp trần lỗi (và trần phụ). bonus = khiếu nại đã được bù (giảm giá +1, miễn phí +2). */
export function finalStars(points, mistakes = [], errors = [], bonus = 0) {
  let st = starsFor(points);
  let cap = 5;
  for (const m of mistakes) cap = Math.min(cap, MISTAKES[m]?.cap ?? 5);
  for (const e of errors) if (SOFT_CAPS[e]) cap = Math.min(cap, SOFT_CAPS[e]);
  cap = Math.min(5, cap + bonus);
  return Math.max(1, Math.min(st, cap));
}
/** Lỗi nặng nhất (trần thấp nhất) để chọn câu review / câu khiếu nại. */
export function worstMistake(list) {
  let best = null;
  for (const m of list || []) if (MISTAKES[m] && (!best || MISTAKES[m].cap < MISTAKES[best].cap)) best = m;
  return best;
}
