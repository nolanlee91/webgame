// Bày dĩa xếp lớp (GAME-DESIGN §3.3). Thuần. Ô bày giữ một phiếu + một dĩa (hoặc hộp).
// Bước: dĩa / hộp → cơm (1 / 2 vá) → mỡ hành (1 / 2 phần) → món nướng (gắp từ vỉ) → bì → chả → trứng → đồ chua → dưa leo → nước mắm (chan / chén / bịch) → ngò.
// Luật thứ tự tối thiểu: phải có dĩa / hộp trước; món ăn đặt lên cơm nên phải xới cơm trước (trừ bánh mì sườn). Còn lại bày theo ý.
// Mỗi lớp trừ kho ngay lúc đặt. Hoàn tác / đổ dĩa: lớp đã bỏ tính hao (trừ dĩa sạch trả lại chồng, miếng sườn trả về vùng giữ ấm nếu còn chỗ).
import { DISHES, STOCK, MO_HANH } from "../data/economy.js?v=c9";
import { QUIRKS } from "../data/customers.js?v=c9";
import { takeRice } from "./rice.js?v=c9";
import { takeItem, isCooked, itemResult, freeWarm, hottestFree, placeItem, zoneOf } from "./grill.js?v=c9";
import { takeEgg, eggState } from "./rice.js?v=c9";

export const LAYER_NAME = {
  dia: "Dĩa", hop: "Hộp", com: "Cơm", moHanh: "Mỡ hành", hanhPhi: "Hành phi", meat: "Món nướng", bi: "Bì", cha: "Chả", trung: "Trứng",
  doChua: "Đồ chua", duaLeo: "Dưa leo", sauce: "Nước mắm", ngo: "Ngò",
};
/** Dải lớp hiện theo cấp + đồ đã có. */
export function layerStrip(s) {
  const L = s.level, o = s.owned || {};
  const out = ["dia", "hop", "com", "moHanh", "meat"];
  if (L >= 3) out.push("bi");
  if (L >= 4 && o.steamer) out.push("cha");
  if (L >= 2 && o["egg-pan"]) out.push("trung");
  out.push("doChua", "duaLeo", "sauce");
  if (L >= 6) out.push("ngo");
  if (L >= 11) out.splice(4, 0, "hanhPhi");
  return out;
}

export const emptyPlate = (tk, kind) => ({ tk, kind, com: 0, moHanh: 0, hanhPhi: false, meat: null, bi: false, cha: false, trung: null, doChua: false, duaLeo: false, sauce: null, ngo: false, order: [], used: {}, hist: [] });
export const slotOf = (s) => s.shift.slots[s.shift.sel];
export const ticketOf = (s, tk) => s.shift.tickets.find((x) => x.id === tk) || null;

/** Mục tiêu của phiếu: dĩa đúng phải ra sao. sauce: "any" = chan hoặc chén; "chen" / "bich" bắt buộc. */
export function targetOf(ticket) {
  const d = DISHES[ticket.dish] || DISHES["com-suon"];
  const q = new Set(ticket.quirks || []);
  if (d.fried) return { kind: ticket.takeaway ? "hop" : "dia", com: 1, moHanh: 0, hanhPhi: false, meat: null, bi: false, cha: false, trung: "any", doChua: false, duaLeo: true, sauce: null, ngo: false, charred: false, vegan: false, fried: true }; // A: cơm chiên
  return {
    kind: ticket.takeaway ? "hop" : "dia",
    com: d.noRice ? 0 : q.has("themCom") ? 2 : 1,
    moHanh: d.vegan || d.noRice ? 0 : q.has("khongMoHanh") ? 0 : q.has("themMoHanh") ? 2 : 1,
    hanhPhi: !!d.vegan,
    meat: d.meat || null,
    bi: !!d.bi && !q.has("khongBi"),
    cha: !!d.cha,
    trung: d.trung ? (q.has("longDao") ? "runny" : "any") : null,
    doChua: !d.noRice && !q.has("khongDoChua"),
    duaLeo: !d.noRice,
    sauce: d.noRice ? null : ticket.takeaway ? "bich" : q.has("riengNuocMam") ? "chen" : "any",
    ngo: !!d.ngo,
    charred: q.has("chayCanh"),
    vegan: !!d.vegan,
  };
}

const use = (p, id, n = 1) => { p.used[id] = (p.used[id] || 0) + n; };
export function addWaste(sh, id, n, cost) {
  if (!n) return;
  sh.waste[id] = (sh.waste[id] || 0) + n;
  sh.stats.wasteCost += cost ?? (STOCK[id]?.cost || 0) * n;
}
const meatStock = (item) => (item === "suon" ? "suon-uop" : item);
const needCom = (p, t) => (t.com > 0 && p.com === 0 ? { err: "need-com" } : null);

/** Ghim phiếu vào ô bày đang chọn. Ô đang có dĩa dở của phiếu khác ⇒ lỗi (giao hoặc đổ trước). */
export function pin(s, tk, ev = []) {
  const sh = s.shift, slot = slotOf(s);
  const t = ticketOf(s, tk);
  if (!t || t.status === "served" || t.status === "void") return { err: "bad-ticket" };
  const other = sh.slots.findIndex((x, i) => x.tk === tk && i !== sh.sel);
  if (other >= 0) { sh.sel = other; ev.push({ type: "pinned", tk, slot: other }); return { ok: true }; }
  if (slot.plate && slot.tk !== tk) return { err: "slot-busy" };
  if (slot.tk !== null && slot.tk !== tk) { const old = ticketOf(s, slot.tk); if (old && old.status === "pinned") old.status = "open"; }
  slot.tk = tk;
  if (slot.plate) slot.plate.tk = tk;
  t.status = "pinned";
  ev.push({ type: "pinned", tk, slot: sh.sel });
  return { ok: true };
}

/** Đặt / đổi một lớp trên dĩa của ô đang chọn. */
export function layer(s, id, ev = []) {
  const sh = s.shift, slot = slotOf(s);
  if (slot.tk === null) return { err: "no-ticket" };
  const tkt = ticketOf(s, slot.tk);
  const tg = targetOf(tkt);
  let p = slot.plate;
  if (id === "dia" || id === "hop") {
    if (p) return { err: "has-container" };
    if (id === "dia") { if (sh.cleanPlates <= 0) return { err: "no-plates" }; sh.cleanPlates--; }
    else { if ((s.stock.hop || 0) <= 0) return { err: "no-hop" }; s.stock.hop--; }
    p = slot.plate = emptyPlate(slot.tk, id);
    if (id === "hop") use(p, "hop");
    p.hist.push({ id, prev: null });
    p.order.push(id);
    ev.push({ type: "layer", id });
    return { ok: true };
  }
  if (!p) return { err: "need-container" };
  const histPush = (prev, extra = {}) => p.hist.push({ id, prev, ...extra });
  switch (id) {
    case "com": {
      if (tg.com === 0 && p.com === 0) return { err: "no-rice-dish" };
      if (p.com >= 2) return { err: "com-max" };
      const r = tg.fried ? { ok: true } : takeRice(sh.rice, 1); // A: cơm chiên dùng cơm dư hôm qua, không lấy nồi
      if (r.err) return r;
      histPush(p.com); p.com++; use(p, tg.fried ? "comChien" : "com");
      break;
    }
    case "moHanh": {
      const e = needCom(p, tg); if (e) return e;
      if (p.moHanh >= 2) return { err: "mo-hanh-max" };
      if ((s.moHanh?.n || 0) < 1) return { err: "mo-hanh-empty" };
      s.moHanh.n--; histPush(p.moHanh); p.moHanh++; use(p, "moHanh");
      break;
    }
    case "hanhPhi": {
      const e = needCom(p, tg); if (e) return e;
      histPush(p.hanhPhi); p.hanhPhi = !p.hanhPhi;
      break;
    }
    case "meat": return pickBest(s, ev);
    case "bi": case "cha": {
      const e = needCom(p, tg); if (e) return e;
      const stockId = tg.vegan ? id + "-chay" : id;
      if (p[id]) { histPush(true); p[id] = false; addWaste(sh, stockId, 1); if (p.used[stockId]) p.used[stockId]--; break; }
      if (id === "cha") {
        if (tg.vegan) { if ((s.stock[stockId] || 0) <= 0) return { err: "out", id: stockId }; s.stock[stockId]--; }
        else { if (!sh.steamer || sh.steamer.done <= 0) return { err: "no-cha-ready" }; sh.steamer.done--; }
      } else { if ((s.stock[stockId] || 0) <= 0) return { err: "out", id: stockId }; s.stock[stockId]--; }
      histPush(false); p[id] = true; use(p, stockId);
      break;
    }
    case "trung": {
      const e = needCom(p, tg); if (e) return e;
      if (p.trung) return { err: "has-egg" };
      const r = takeEgg(sh.pan || {}, sh.t);
      if (r.err) return r;
      histPush(null); p.trung = r.state; use(p, "trung");
      break;
    }
    case "doChua": case "duaLeo": {
      if (!tg.duaLeo && !p[id] && tg.com === 0) { /* bánh mì: vẫn cho bỏ đồ chua */ }
      const e = tg.com > 0 ? needCom(p, tg) : null; if (e) return e;
      const stockId = id === "doChua" ? "do-chua" : "dua-leo";
      if (p[id]) { histPush(true); p[id] = false; addWaste(sh, stockId, 1); if (p.used[stockId]) p.used[stockId]--; break; }
      if ((s.stock[stockId] || 0) <= 0) return { err: "out", id: stockId };
      s.stock[stockId]--; histPush(false); p[id] = true; use(p, stockId);
      break;
    }
    case "sauce": {
      const e = needCom(p, tg); if (e) return e;
      const cycle = p.kind === "hop" ? [null, "bich"] : [null, "chan", "chen"];
      const i = cycle.indexOf(p.sauce), nx = cycle[(i + 1) % cycle.length];
      const sid = tg.vegan ? "nuoc-tuong" : "nuoc-mam";
      if (p.sauce === null) { if ((s.stock[sid] || 0) <= 0) return { err: "out", id: sid }; s.stock[sid]--; use(p, sid); }
      if (nx === null) { addWaste(sh, sid, 1); if (p.used[sid]) p.used[sid]--; }
      histPush(p.sauce); p.sauce = nx;
      break;
    }
    case "ngo": {
      const e = needCom(p, tg); if (e) return e;
      histPush(p.ngo); p.ngo = !p.ngo;
      break;
    }
    default: return { err: "bad-layer" };
  }
  if (!p.order.includes(id)) p.order.push(id);
  ev.push({ type: "layer", id });
  return { ok: true };
}

/** Gắp miếng ở chỗ `gslot` trên vỉ vào dĩa đang mở. */
export function pickMeat(s, gslot, ev = []) {
  const sh = s.shift, slot = slotOf(s);
  if (slot.tk === null) return { err: "no-ticket" };
  const p = slot.plate;
  if (!p) return { err: "need-container" };
  const tg = targetOf(ticketOf(s, slot.tk));
  if (tg.com > 0 && p.com === 0) return { err: "need-com" };
  if (p.meat) return { err: "has-meat" };
  const r = takeItem(sh.grill, gslot);
  if (r.err) return r;
  const it = r.it;
  p.meat = { item: it.item, sides: it.sides.map((v) => Math.round(v)), fresh: Math.round(it.fresh), result: itemResult(it), perfect: it.perfect, ...(it.tainted ? { tainted: true } : {}) }; // S: đậu hũ dính mặn
  p.hist.push({ id: "meat", prev: null, piece: it });
  if (!p.order.includes("meat")) p.order.push("meat");
  use(p, meatStock(it.item));
  ev.push({ type: "layer", id: "meat", result: p.meat.result });
  return { ok: true };
}
/** Chọn miếng hợp nhất cho phiếu: đúng loại thịt, đã chín hai mặt; dặn cháy cạnh thì ưu tiên miếng cháy cạnh; ưu tiên miếng ở vùng giữ ấm. */
export function bestPiece(s, tg) {
  const g = s.shift.grill;
  let best = -1, score = -1;
  g.slots.forEach((it, i) => {
    if (!it || !isCooked(it) || (tg.meat && it.item !== tg.meat)) return;
    const r = itemResult(it);
    let sc = 10 + (zoneOf(i, g) === "warm" ? 3 : 0) + it.fresh / 100 - (it.tainted && tg.vegan ? 8 : 0); // S: dĩa chay tránh miếng dính mặn
    if (tg.charred ? r === "charred" : r === "done") sc += 5;
    if (sc > score) { score = sc; best = i; }
  });
  return best;
}
function pickBest(s, ev) {
  const slot = slotOf(s);
  const tg = targetOf(ticketOf(s, slot.tk));
  if (!tg.meat) return { err: "no-meat-dish" };
  const i = bestPiece(s, tg);
  if (i < 0) return caseHas(s, tg) ? pickFromCase(s, tg, ev) : { err: "no-meat" }; // S: tủ kính giữ ấm
  return pickMeat(s, i, ev);
}

/** S (M5): tủ kính giữ ấm (sh.case) có miếng hợp phiếu không. */
export const caseHas = (s, tg) => !!tg?.meat && (s.shift?.case || []).some((it) => it.item === tg.meat);
/** S (M5): gắp miếng từ tủ kính (tươi nhất trước; dĩa chay tránh miếng dính mặn). */
export function pickFromCase(s, tg, ev = []) {
  const sh = s.shift, slot = slotOf(s), p = slot.plate;
  if (!p) return { err: "need-container" };
  if (tg.com > 0 && p.com === 0) return { err: "need-com" };
  if (p.meat) return { err: "has-meat" };
  const list = sh.case.map((it, i) => ({ it, i })).filter((x) => x.it.item === tg.meat).sort((a, b) => (a.it.tainted && tg.vegan ? 1 : 0) - (b.it.tainted && tg.vegan ? 1 : 0) || b.it.fresh - a.it.fresh);
  if (!list.length) return { err: "no-meat" };
  const it = list[0].it;
  sh.case.splice(list[0].i, 1);
  p.meat = { item: it.item, sides: it.sides.map((v) => Math.round(v)), fresh: Math.round(it.fresh), result: itemResult(it), perfect: it.perfect, ...(it.tainted ? { tainted: true } : {}) };
  p.hist.push({ id: "meat", prev: null, piece: it, fromCase: true });
  if (!p.order.includes("meat")) p.order.push("meat");
  use(p, meatStock(it.item));
  ev.push({ type: "layer", id: "meat", result: p.meat.result, from: "case" });
  return { ok: true };
}
/** Hoàn tác lớp gần nhất. */
export function undo(s, ev = []) {
  const sh = s.shift, slot = slotOf(s), p = slot.plate;
  if (!p || !p.hist.length) return { err: "nothing" };
  const h = p.hist.pop();
  const tg = targetOf(ticketOf(s, slot.tk));
  switch (h.id) {
    case "dia": sh.cleanPlates++; slot.plate = null; break;
    case "hop": s.stock.hop++; slot.plate = null; break;
    case "com": addWaste(sh, "com", 1, STOCK["gao-tam"].cost); p.com = h.prev; if (p.used.com) p.used.com--; break;
    case "moHanh": addWaste(sh, "moHanh", 1, MO_HANH.portionCost); p.moHanh = h.prev; if (p.used.moHanh) p.used.moHanh--; break;
    case "meat": {
      const back = freeWarm(sh.grill) >= 0 ? freeWarm(sh.grill) : hottestFree(sh.grill, h.piece?.item);
      if (h.fromCase && sh.case && sh.case.length < 6 && h.piece) { sh.case.push(h.piece); ev.push({ type: "meatBack", to: "case" }); } // S: trả về tủ kính
      else if (back >= 0 && h.piece) { sh.grill.slots[back] = h.piece; ev.push({ type: "meatBack", slot: back }); }
      else addWaste(sh, meatStock(p.meat.item), 1);
      if (p.used[meatStock(p.meat.item)]) p.used[meatStock(p.meat.item)]--;
      p.meat = null; break;
    }
    case "trung": addWaste(sh, "trung", 1); p.trung = null; if (p.used.trung) p.used.trung--; break;
    case "bi": case "cha": case "doChua": case "duaLeo": {
      const sid = h.id === "doChua" ? "do-chua" : h.id === "duaLeo" ? "dua-leo" : tg.vegan ? h.id + "-chay" : h.id;
      if (h.prev === false) { addWaste(sh, sid, 1); if (p.used[sid]) p.used[sid]--; }
      else { if (h.id === "cha" && !tg.vegan) { if (!sh.steamer?.done) { p.hist.push(h); return { err: "no-cha-ready" }; } sh.steamer.done--; } else { if ((s.stock[sid] || 0) <= 0) { p.hist.push(h); return { err: "out", id: sid }; } s.stock[sid]--; } }
      if (h.prev === true) p.used[sid] = (p.used[sid] || 0) + 1;
      p[h.id] = h.prev; break;
    }
    case "sauce": {
      const sid = tg.vegan ? "nuoc-tuong" : "nuoc-mam";
      if (h.prev === null) { addWaste(sh, sid, 1); if (p.used[sid]) p.used[sid]--; }
      else if (p.sauce === null) { if ((s.stock[sid] || 0) <= 0) { p.hist.push(h); return { err: "out", id: sid }; } s.stock[sid]--; p.used[sid] = (p.used[sid] || 0) + 1; }
      p.sauce = h.prev; break;
    }
    default: p[h.id] = h.prev;
  }
  if (slot.plate) slot.plate.order = slot.plate.order.filter((x) => x !== h.id || slot.plate.hist.some((y) => y.id === x));
  ev.push({ type: "undo", id: h.id });
  return { ok: true };
}

/** Đổ dĩa đang bày: mọi lớp tính hao, dĩa vào thau rửa, miếng sườn (nếu có) cũng hao. Phiếu vẫn ghim. */
export function discard(s, ev = []) {
  const sh = s.shift, slot = slotOf(s), p = slot.plate;
  if (!p) return { err: "nothing" };
  for (const [id, n] of Object.entries(p.used)) addWaste(sh, id, n, id === "com" ? n * STOCK["gao-tam"].cost : id === "moHanh" ? n * MO_HANH.portionCost : undefined);
  if (p.kind === "dia") sh.dirty++;
  slot.plate = null;
  ev.push({ type: "discarded" });
  return { ok: true };
}

/** Bước kế tiếp mặc định theo phiếu (phím Space, bot): trả id lớp cần làm, "grill" (bỏ thịt lên vỉ), "wait-meat", "wait-egg", "serve" hoặc null. */
export function nextStep(s) {
  const sh = s.shift, slot = slotOf(s);
  if (slot.tk === null) return null;
  const tg = targetOf(ticketOf(s, slot.tk));
  const p = slot.plate;
  if (!p) return tg.kind === "dia" && sh.cleanPlates <= 0 ? "hop" : tg.kind;
  if (p.com < tg.com) return "com";
  if (p.moHanh < tg.moHanh) return "moHanh";
  if (tg.hanhPhi && !p.hanhPhi) return "hanhPhi";
  if (tg.meat && !p.meat) {
    if (bestPiece(s, tg) >= 0 || caseHas(s, tg)) return "meat"; // S: tủ kính
    return sh.grill.slots.some((it) => it && it.item === tg.meat && !it.reserved) ? "wait-meat" : "grill";
  }
  if (tg.bi && !p.bi) return "bi";
  if (tg.cha && !p.cha) return "cha";
  if (tg.trung && !p.trung) return sh.pan?.egg && eggState(sh.pan, sh.t) !== "raw" ? "trung" : sh.pan?.egg ? "wait-egg" : "egg";
  if (tg.doChua && !p.doChua) return "doChua";
  if (tg.duaLeo && !p.duaLeo) return "duaLeo";
  if (tg.sauce && (p.sauce === null || (tg.sauce === "chen" && p.sauce !== "chen") || (tg.sauce === "bich" && p.sauce !== "bich"))) return "sauce";
  if (tg.ngo && !p.ngo) return "ngo";
  return "serve";
}

/** Tên frame plate-layers theo thứ tự vẽ (ART-DIRECTION §5). */
export function plateFrames(p) {
  if (!p) return [];
  const out = [p.kind === "hop" ? "box-open" : "plate-dia"];
  if (p.com) out.push(p.com >= 2 ? "com-them" : "com");
  if (p.moHanh) out.push("mo-hanh");
  if (p.hanhPhi) out.push("hanh-phi");
  if (p.bi) out.push(p.meat?.item === "dau-hu" ? "bi-chay" : "bi");
  if (p.meat) {
    const r = p.meat.result === "raw" ? "half" : p.meat.result;
    if (p.meat.item === "suon") out.push(`suon-${r}`);
    else if (p.meat.item === "suon-non" || p.meat.item === "ga") out.push(`${p.meat.item}-${r === "charred" || r === "burnt" ? "charred" : "done"}`);
    else out.push(p.meat.item);
  }
  if (p.cha) out.push(p.meat?.item === "dau-hu" ? "cha-chay" : "cha");
  if (p.trung) out.push(`trung-${p.trung === "burnt" ? "hard" : p.trung}`);
  if (p.doChua) out.push("do-chua");
  if (p.duaLeo) { out.push("dua-leo"); out.push("ca-chua"); }
  if (p.sauce === "chan") out.push("nuoc-mam-chan");
  else if (p.sauce === "chen") out.push("chen-nuoc-mam");
  else if (p.sauce === "bich") out.push("bich-nuoc-mam");
  if (p.ngo) out.push("ngo-rac");
  return out;
}
export const quirkText = (q) => QUIRKS[q]?.text || q;
// (placeItem được gọi ở core/shift.js khi bỏ thịt lên vỉ; xuất lại cho tiện test)
export { placeItem };
