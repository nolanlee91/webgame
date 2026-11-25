// Hết hàng: dự báo đầu ngày (bảng Chuẩn bị ca), "Nhập đủ cho hôm nay", nhắc khi hàng còn ≤ 2 phần giữa ca, và hội thoại
// khi một món cần hàng đã hết (sh.dialog kind "stockout") — không bao giờ kẹt: luôn có lựa chọn miễn phí (mượn Hẻm Bên,
// đóng cửa sớm) và gói ký gửi Dì Ba được đưa lên đầu khi không đủ tiền cho lựa chọn trả tiền.
// Thuần, đổi trạng thái chỉ qua apply() (core/apply.js).
import { STOCK, STOCK_IDS } from "../data/ingredients.js?v=m38";
import { RECIPE } from "../data/recipes.js?v=m38";
import { ARCHETYPES } from "../data/customers.js?v=m38";
import { SHIFT_FEE, NORMAL_DAY, TUTORIAL_DAY, MULTI_CUP, DRAMA } from "../data/shift.js?v=m38";
import { PEARL_RAW, TUTORIAL_PRECOOKED } from "../data/equipment.js?v=m38";
import { STOCK_KIND, LOW_LINES, OUT_LINES, CHOICE_SAY, AWAY_SAY, BACK_LINES, SWAP_YES_SAY, SWAP_YES_REVIEW, SWAP_NO_SAY, SWAP_NO_REVIEW,
  CLOSE_SAY, CLOSE_REVIEW, TEO_RIGHT, TEO_WRONG, LUA_GLOAT, CHOICE_SAY as SAY } from "../data/lines-stockout.js?v=m38";
import { useOfSpec, packSize, packPrice, capacity, stockUsed, costOfUse, cupCost } from "./economy.js?v=m38";
import { recipesAt } from "./progression.js?v=m38";
import { appeal } from "./equipment.js?v=m38";
import { trafficBonus } from "./reviews.js?v=m38";
import { promoGuests } from "./business.js?v=m38";
import { next } from "./rng.js?v=m38";
import { shiftFee } from "./fair.js?v=m38";
import { fill } from "./text.js?v=m38";
import { customer, waiting, lineCtx, freshLine, say, review, addRep, orderSpec } from "./shift.js?v=m38";

/** Nhắc khi còn ≤ LOW_AT phần. Chạy đi mua: +30%, quầy bỏ trống RUN_MS (đồng hồ vẫn chạy, kiên nhẫn tụt nhanh hơn AWAY_DRAIN).
 *  Anh Tèo: +15% + tiền tip, tới sau SHIP_MS, SHIP_WRONG khả năng mua nhầm. Mượn Hẻm Bên: BORROW_N phần, miễn phí, một lần mỗi ngày, hẹn đòi nợ. */
export const STOCKOUT = { LOW_AT: 2, RUN_MARKUP: 0.3, RUN_MS: 12000, AWAY_DRAIN: 0.6, SHIP_MARKUP: 0.15, SHIP_TIP: 5, SHIP_MS: 20000, SHIP_WRONG: 0.25, BORROW_N: 4, CLOSE_REP: -3 };
/** Khả năng khách chịu đổi món theo nhóm. */
export const SWAP_ACCEPT = { "hoc-sinh": 0.75, "van-phong": 0.6, "khach-quen": 0.5, "di-ngang": 0.8, "reviewer": 0.4, "vip": 0.25 };

const lower = (t) => t.toLocaleLowerCase("vi");
export const itemName = (id) => lower(STOCK[id]?.name || id);
const kindOf = (id) => STOCK_KIND[id] || "cup";

// ---------- dự báo đầu ngày ----------
/** Số khách dự kiến ca tới (cùng công thức core/shift.js genGuests, lấy trung bình phần ngẫu nhiên). */
export function expectedGuests(s) {
  if (!s.tutorialDone) return TUTORIAL_DAY.guests.length;
  const cfg = NORMAL_DAY;
  const n = cfg.minGuests + Math.floor((s.rep - 35) / 15) + Math.floor(s.level / 4) + appeal(s) + trafficBonus(s) + promoGuests(s) + (s.drama?.nextGuests || 0);
  return Math.max(cfg.minGuests, Math.min(cfg.maxGuests + 3, n)) + (s.returning?.length || 0);
}
/** Phần hàng cần cho ca tới: { guests, cups, need: {id: phần}, short: [{ id, have, need }] }. */
export function demandEstimate(s) {
  const need = {};
  const add = (use, k) => { for (const [id, n] of Object.entries(use)) need[id] = (need[id] || 0) + n * k; };
  let guests, cups;
  if (!s.tutorialDone) {
    guests = cups = TUTORIAL_DAY.guests.length;
    for (const g of TUTORIAL_DAY.guests) add(useOfSpec(orderSpec(g.recipe, g.sugar, g.ice)), 1);
  } else {
    guests = expectedGuests(s);
    const multi = s.level >= MULTI_CUP.twoFrom.level || s.day >= MULTI_CUP.twoFrom.day;
    cups = Math.round(guests * (multi ? 1.15 : 1));
    const menu = recipesAt(s.level);
    for (const R of menu) add(useOfSpec(R), cups / menu.length);
  }
  const pearlsReady = (s.tutorialDone ? 0 : TUTORIAL_PRECOOKED) + (s.carryPearls || 0);
  if (need[PEARL_RAW]) need[PEARL_RAW] = Math.max(0, need[PEARL_RAW] - pearlsReady);
  const short = [];
  for (const id of STOCK_IDS) {
    if (!need[id]) continue;
    let n = Math.ceil(need[id] - 0.15);
    if (id === PEARL_RAW && n > 0) n = Math.ceil(n / 3) * 3; // nấu theo mẻ 3 phần
    need[id] = n;
    const have = s.stock[id] || 0;
    if (n > 0 && have < n) short.push({ id, have, need: n });
  }
  short.sort((a, b) => (a.id === "ly" ? -1 : b.id === "ly" ? 1 : a.have / a.need - b.have / b.need));
  return { guests, cups, need, short };
}

/** "Nhập đủ cho hôm nay": mua gói Dì Ba cho từng món thiếu, giữ lại tiền phí ca, không vượt sức chứa. */
export function restockToday(s, events) {
  if (s.shift) return { err: "shift-open" };
  const bought = {};
  let spent = 0;
  for (let guard = 0; guard < 80; guard++) {
    const { short } = demandEstimate(s);
    const room = capacity(s) - stockUsed(s);
    const can = short.filter((x) => STOCK[x.id].unlock <= s.level && packPrice(x.id) <= s.money - shiftFee(s) && packSize(x.id) <= room);
    if (!can.length) break;
    const x = can[0], p = packPrice(x.id), n = packSize(x.id);
    s.money -= p; s.stock[x.id] = (s.stock[x.id] || 0) + n; s.stats.spentStock += p; spent += p;
    bought[x.id] = (bought[x.id] || 0) + n;
  }
  if (!spent) {
    const sh2 = demandEstimate(s).short;
    if (!sh2.length) return { err: "nothing" };
    return { err: sh2.some((x) => packPrice(x.id) <= s.money - shiftFee(s)) ? "capacity" : "money" };
  }
  const left = demandEstimate(s).short;
  events.push({ type: "restockedToday", bought, spent, left: left.map((x) => x.id) });
  return { ok: true, bought, spent, left };
}

// ---------- giữa ca ----------
/** Món kho mà các món trên menu đang dùng. */
export const menuStock = (s) => new Set(recipesAt(s.level).flatMap((R) => Object.keys(useOfSpec(R))));
/** Sau khi trừ kho: nhắc một lần mỗi món khi còn ≤ LOW_AT phần (đặt lại khi nhập thêm). */
export function lowCheck(s, ids, events) {
  const sh = s.shift;
  if (!sh) return;
  sh.lowWarned = sh.lowWarned || {};
  const rel = menuStock(s);
  for (const id of ids) {
    const n = s.stock[id] || 0;
    if (n > STOCKOUT.LOW_AT) { delete sh.lowWarned[id]; continue; }
    if (!rel.has(id) || sh.lowWarned[id] || n === 0 && sh.dialog) continue;
    sh.lowWarned[id] = true;
    const line = freshLine(s, LOW_LINES[kindOf(id)], { item: itemName(id), Item: STOCK[id].name, n });
    events.push({ type: "lowStock", id, n, line });
  }
}
/** Hàng đã hết mà ly / đơn này cần (trân châu: chưa có mẻ chín, không có mẻ đang nấu, không đủ 3 phần sống để nấu). */
export function missingFor(s, order, doneSteps = 0) {
  const use = useOfSpec(order);
  if (doneSteps > 0) delete use.ly;
  const sh = s.shift;
  for (const [id, n] of Object.entries(use)) {
    if (id === PEARL_RAW) {
      const k = sh?.kitchen;
      if (k && (k.ready > 0 || k.batches.length)) continue;
      if ((s.stock[id] || 0) < 3) return id;
      continue;
    }
    if ((s.stock[id] || 0) < n) return id;
  }
  return null;
}

/** Mở hội thoại hết hàng (trong ca, đồng hồ dừng). */
export function openStockout(s, id, cid, events) {
  const sh = s.shift;
  if (!sh || sh.dialog) return false;
  const line = freshLine(s, OUT_LINES[kindOf(id)], { item: itemName(id), Item: STOCK[id].name });
  sh.dialog = { kind: "stockout", id, cid: cid ?? null, line };
  if (s.drama) s.drama.flags["het-hang"] = s.day + DRAMA.flagDays; // reviewer đăng "tiệm hết ly" (sự kiện H03)
  sh.stockouts = (sh.stockouts || 0) + 1;
  events.push({ type: "stockout", id, cid: cid ?? null, line });
  return true;
}

const runPrice = (id) => Math.ceil(STOCK[id].cost * packSize(id) * (1 + STOCKOUT.RUN_MARKUP));
const shipPrice = (id) => Math.ceil(STOCK[id].cost * packSize(id) * (1 + STOCKOUT.SHIP_MARKUP)) + STOCKOUT.SHIP_TIP;
/** Món thay trên menu không cần món hàng đã hết (và đủ hàng để pha). */
export function substituteFor(s, c, id) {
  if (!c) return null;
  const it = c.items.find((x, i) => !c.filled[i] && Object.keys(useOfSpec(x.order)).includes(id));
  if (!it) return null;
  for (const R of recipesAt(s.level)) {
    if (R.id === it.recipe) continue;
    const spec = orderSpec(R.id, it.order.sugar, it.order.ice);
    if (Object.keys(useOfSpec(spec)).includes(id)) continue;
    if (!missingFor(s, spec)) return R.id;
  }
  return null;
}
/** Ký gửi giữa ca: lần đầu trong ngày luôn được; đã nhận rồi mà vẫn không đủ tiền cho lựa chọn trả tiền thì Dì Ba cho thêm (nợ cộng dồn) ⇒ không bao giờ kẹt. */
const consignOk = (s, poor = false) => s.consign?.day !== s.day || poor;

/** Các lựa chọn của hội thoại hết hàng (kèm chi phí hiện trước). */
export function stockoutOptions(s, d = s.shift?.dialog) {
  if (!d || d.kind !== "stockout") return [];
  const id = d.id, sh = s.shift, n = packSize(id), name = itemName(id);
  const c = d.cid !== null ? customer(s, d.cid) : null;
  const rp = runPrice(id), sp = shipPrice(id);
  const out = [];
  const poor = s.money < Math.min(rp, sp);
  const cons = { id: "consign", label: "Gọi Dì Ba ký gửi", hint: `Dì Ba mang ${n} phần ${name} ra liền, bán tới đâu trừ giá vốn tới đó`, cost: `Nợ ký gửi ${costOfUse({ [id]: n })}k`, ok: consignOk(s, poor) };
  if (poor && cons.ok) out.push(cons);
  out.push({ id: "run", label: "Chạy đi mua gấp", hint: `${Math.round(STOCKOUT.RUN_MS / 1000)} giây bỏ trống quầy: đồng hồ vẫn chạy, khách sốt ruột nhanh hơn. Về là có ${n} phần`, cost: `${rp}k (+30%)`, ok: s.money >= rp && !sh.away });
  out.push({ id: "shipper", label: "Nhờ Anh Tèo mua giùm", hint: `Tới sau khoảng ${Math.round(STOCKOUT.SHIP_MS / 1000)} giây, bạn vẫn pha món khác được. Có khi mua nhầm`, cost: `${sp}k (gồm ${STOCKOUT.SHIP_TIP}k tip)`, ok: s.money >= sp, risk: true });
  out.push({ id: "borrow", label: "Mượn đỡ chị Lụa Hẻm Bên", hint: `${STOCKOUT.BORROW_N} phần ngay, miễn phí. Mai chị ghé đòi, cả hẻm sẽ biết`, cost: "Miễn phí · nợ Hẻm Bên", ok: sh.borrowDay !== sh.day });
  const sub = substituteFor(s, c, id);
  if (c && c.phase === "wait") out.push({ id: "swap", label: sub ? `Đổi món: mời ${RECIPE[sub].short}` : "Đổi món cho khách", hint: sub ? "Khách có thể chịu hoặc bỏ về (tuỳ người)" : "Menu không có món nào không cần thứ này", cost: "Miễn phí · hên xui", ok: !!sub, sub, risk: true });
  out.push({ id: "close", label: "Đóng cửa sớm", hint: "Khách đang chờ về hết, mỗi người để lại review", cost: `Danh tiếng ${STOCKOUT.CLOSE_REP}`, ok: true });
  if (!poor && cons.ok && s.money < rp) out.push(cons);
  return out;
}

/** Hàng mua gấp / mượn / ký gửi giữa ca: để tạm dưới gầm quầy, được vượt sức chứa kho (core/apply.js OVER_CAP_OK) ⇒ trả tiền là có hàng. */
function addStock(s, id, n) {
  s.stock[id] = (s.stock[id] || 0) + n;
  return n;
}
function closeDialog(sh) { sh.dialog = null; }

/** Người chơi chọn cách xử lý hết hàng. */
export function resolveStockout(s, pickId, events) {
  const sh = s.shift;
  const d = sh?.dialog;
  if (!d || d.kind !== "stockout") return { err: "no-dialog" };
  const opt = stockoutOptions(s, d).find((o) => o.id === pickId);
  if (!opt) return { err: "bad-choice" };
  if (!opt.ok) return { err: "cannot-afford" };
  const id = d.id, n = packSize(id), name = itemName(id);
  const c = d.cid !== null ? customer(s, d.cid) : null;
  const ctx = { ...(c ? lineCtx(c) : {}), item: name, Item: STOCK[id].name, shop: s.shopName };
  const fx = [];
  let sayText = freshLine(s, SAY[pickId] || SAY.close, { ...ctx, sub: opt.sub ? lower(RECIPE[opt.sub].name) : "" });
  let extra = null;
  if (pickId === "consign") {
    s.stock[id] = (s.stock[id] || 0) + n; const got = n; // Dì Ba để dưới gầm quầy: được vượt sức chứa
    const owed = costOfUse({ [id]: got });
    s.consign = { day: s.day, owed: (s.consign?.owed || 0) + owed };
    if (s.drama) s.drama.flags["ky-gui"] = s.day + DRAMA.flagDays;
    fx.push(`+${got} ${STOCK[id].name}`, `Nợ ký gửi +${owed}k`);
  } else if (pickId === "run") {
    const p = runPrice(id);
    s.money -= p; sh.ledger.restock += p; s.stats.spentStock += p;
    sh.away = { until: sh.t + STOCKOUT.RUN_MS, id, n };
    const w = waiting(s);
    if (w.length) say(sh, w[0], freshLine(s, AWAY_SAY, lineCtx(w[0])));
    sh.moments.push({ kind: "ran", id, name: "Chủ tiệm", line: sayText });
    for (const x of w) x.ranFor = true; // khách chứng kiến ⇒ review riêng khi được giao
    fx.push(`−${p}k`, `Quầy bỏ trống ${Math.round(STOCKOUT.RUN_MS / 1000)} giây`, "Khách sốt ruột nhanh hơn", `Về có ${n} phần ${STOCK[id].name}`);
  } else if (pickId === "shipper") {
    const p = shipPrice(id);
    s.money -= p; sh.ledger.restock += p - STOCKOUT.SHIP_TIP; sh.ledger.eventCash -= STOCKOUT.SHIP_TIP; s.stats.spentStock += p - STOCKOUT.SHIP_TIP;
    const wrong = next(s) < STOCKOUT.SHIP_WRONG;
    let wid = null;
    if (wrong) { const pool = STOCK_IDS.filter((x) => x !== id && STOCK[x].unlock <= s.level); wid = pool[Math.floor(next(s) * pool.length)]; }
    sh.deliveries = sh.deliveries || [];
    sh.deliveries.push({ at: sh.t + STOCKOUT.SHIP_MS, id, n, wrong: wid });
    fx.push(`−${p}k`, `Anh Tèo tới sau ~${Math.round(STOCKOUT.SHIP_MS / 1000)} giây`, "Hên xui: có khi mua nhầm");
  } else if (pickId === "borrow") {
    const got = addStock(s, id, Math.min(STOCKOUT.BORROW_N, n));
    sh.borrowDay = sh.day;
    s.debtHB = { id, n: got, day: s.day };
    if (s.drama) { s.drama.flags["muon-hb"] = s.day + DRAMA.flagDays; s.drama.queue.push({ id: "H01", day: s.day + 1, from: "stockout" }); }
    extra = freshLine(s, LUA_GLOAT, ctx);
    sh.moments.push({ kind: "drama", id: "H00", name: "Chị Lụa Hẻm Bên", line: extra });
    fx.push(`+${got} ${STOCK[id].name}`, "Nợ chị Lụa (mai chị ghé)");
  } else if (pickId === "swap") {
    const sub = opt.sub;
    const ok = next(s) < (SWAP_ACCEPT[c.arch] ?? 0.5);
    const sctx = { ...ctx, sub: lower(RECIPE[sub].name), Sub: RECIPE[sub].name };
    if (ok) {
      for (let i = 0; i < c.items.length; i++) {
        const it = c.items[i];
        if (c.filled[i] || !Object.keys(useOfSpec(it.order)).includes(id)) continue;
        c.items[i] = { recipe: sub, order: orderSpec(sub, it.order.sugar, it.order.ice), price: RECIPE[sub].price };
      }
      c.recipe = c.items[0].recipe; c.order = { ...c.items[0].order }; c.price = c.items.reduce((a, it) => a + it.price, 0);
      for (const st of sh.stations) if (st.cid === c.id && st.cup && !st.cup.sealed) { sh.ledger.waste += cupCost(st.cup); st.cup = null; }
      c.bonus += 8000; c.mood = "happy"; c.swapped = sub;
      extra = freshLine(s, SWAP_YES_SAY, sctx);
      say(sh, c, extra);
      sh.moments.push({ kind: "drama", id: "S01", name: c.name, line: extra });
      fx.push(`${c.name} đổi sang ${RECIPE[sub].short}`, "Khách chờ thêm 8 giây");
    } else {
      extra = freshLine(s, SWAP_NO_SAY, sctx);
      review(s, c, 2, freshLine(s, SWAP_NO_REVIEW, sctx), "stockout");
      for (const cup of c.filled) if (cup) sh.ledger.waste += cupCost(cup);
      for (const st of sh.stations) if (st.cid === c.id) { if (st.cup) { sh.ledger.waste += cupCost(st.cup); st.cup = null; } st.cid = null; st.item = null; }
      sh.ledger.lost++;
      c.phase = "leave"; c.leaveT = sh.t; c.mood = "annoyed";
      say(sh, c, extra);
      sh.moments.push({ kind: "drama", id: "S02", name: c.name, line: extra });
      fx.push(`${c.name} không đổi, bỏ về`, "Review 2 sao");
    }
    sayText = freshLine(s, SAY.swap, sctx);
  } else if (pickId === "close") {
    const rep0 = s.rep;
    for (const x of sh.customers) {
      if (x.phase !== "wait" && x.phase !== "enter") continue;
      const xc = { ...lineCtx(x), item: name, Item: STOCK[id].name };
      review(s, x, 2, freshLine(s, CLOSE_REVIEW, xc), "closed");
      say(sh, x, freshLine(s, CLOSE_SAY, xc));
      for (const cup of x.filled) if (cup) sh.ledger.waste += cupCost(cup);
      x.phase = "leave"; x.leaveT = sh.t; x.mood = "annoyed";
      sh.ledger.lost++;
    }
    for (const st of sh.stations) { if (st.cup) { sh.ledger.waste += cupCost(st.cup); st.cup = null; } st.cid = null; st.item = null; }
    sh.schedule.length = 0;
    addRep(s, STOCKOUT.CLOSE_REP);
    sh.closedEarly = id;
    if (s.drama) s.drama.flags["dong-som"] = s.day + DRAMA.flagDays;
    sh.moments.push({ kind: "closed", id, name: "Tiệm", line: sayText });
    fx.push(`Danh tiếng ${s.rep - rep0}`, "Khách đang chờ về hết", "Chốt ca ngay");
  }
  closeDialog(sh);
  events.push({ type: "stockoutResolved", choice: pickId, id, say: sayText, extra, fx });
  return { ok: true };
}

/** Gọi mỗi tick: chủ tiệm chạy về, Anh Tèo giao hàng, kiên nhẫn tụt nhanh khi quầy bỏ trống. */
export function stockoutTick(s, dt, events) {
  const sh = s.shift;
  if (sh.away) {
    for (const c of sh.customers) if (c.phase === "wait") c.bonus -= Math.round(dt * STOCKOUT.AWAY_DRAIN);
    if (sh.t >= sh.away.until) {
      const { id, n } = sh.away;
      const got = addStock(s, id, n);
      sh.away = null;
      if (sh.lowWarned) delete sh.lowWarned[id];
      events.push({ type: "ranBack", id, n: got, line: freshLine(s, BACK_LINES, { item: itemName(id), Item: STOCK[id].name }) });
    }
  }
  if (sh.deliveries?.length) {
    for (const dv of sh.deliveries.filter((x) => x.at <= sh.t)) {
      const ctx = { item: itemName(dv.id), Item: STOCK[dv.id].name, wrong: dv.wrong ? itemName(dv.wrong) : "", Wrong: dv.wrong ? STOCK[dv.wrong].name : "" };
      if (dv.wrong) {
        const got = addStock(s, dv.wrong, Math.min(3, packSize(dv.wrong)));
        const line = freshLine(s, TEO_WRONG, ctx);
        sh.moments.push({ kind: "drama", id: "T01", name: "Anh Tèo shipper", line });
        events.push({ type: "delivered", id: dv.id, wrong: dv.wrong, n: got, line });
      } else {
        const got = addStock(s, dv.id, dv.n);
        if (sh.lowWarned) delete sh.lowWarned[dv.id];
        events.push({ type: "delivered", id: dv.id, wrong: null, n: got, line: freshLine(s, TEO_RIGHT, ctx) });
      }
    }
    sh.deliveries = sh.deliveries.filter((x) => x.at > sh.t);
  }
}
export { RUN_REVIEW } from "../data/lines-stockout.js?v=m38";
export { runPrice, shipPrice };
