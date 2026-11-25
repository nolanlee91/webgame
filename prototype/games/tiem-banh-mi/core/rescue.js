// Cứu giữa ca (mô phỏng core/stockout.js + ui/stockout.js của Trà Sữa): hết nguyên liệu, hết bánh, hết gas, hết tiền lẻ.
// Không bao giờ kẹt: mỗi hội thoại luôn có lựa chọn miễn phí (mượn Cậu Hưng / Cô Sáu, chờ lò, khách đổi món, cho nợ, đóng cửa sớm)
// và gói ký gửi Bà Tư lên đầu khi không đủ tiền cho lựa chọn trả tiền. Thuần, đổi trạng thái chỉ qua apply().
import { STOCK, STOCK_IDS, RESCUE, VEG } from "../data/economy.js?v=b8";
import { ARCHETYPES } from "../data/customers.js?v=b8";
import { RESCUE_SAY, NOCHANGE, OUT_LINES } from "../data/lines-ops.js?v=b8";
import { addLot } from "./expiry.js?v=b8";
import { takePartial } from "./partial.js?v=b8";
import { packPrice, packSize, consignAvailable, consign } from "./stock.js?v=b8";
import { spend, receive, greedyBills } from "./money.js?v=b8";
import { newLoaf } from "./oven.js?v=b8";
import { next, pick } from "./rng.js?v=b8";
import { freshLine } from "./text.js?v=b8";
import { board, emptyBoard, wasteLoaf } from "./board.js?v=b8";
import { engineFlag } from "./flags.js?v=b8";

const lower = (t) => t.toLocaleLowerCase("vi");
export const itemName = (id) => (id === "banh" ? "bánh" : id === "que" ? "bánh mì que" : lower(STOCK[id]?.name || id));
const runPrice = (id) => Math.ceil(STOCK[id].pack[1] * (1 + RESCUE.runMarkup));
const shipPrice = (id) => Math.ceil(STOCK[id].pack[1] * (1 + RESCUE.shipMarkup)) + RESCUE.shipTip;
/** Món có thể bỏ khỏi ổ nếu khách chịu (không bỏ được phôi, giấy, túi, than, gas). */
const SWAPPABLE = new Set(["pate", "bo", "mayo", "cha-lua", "thit-nguoi", "xiu-mai", "trung", "thit-nuong", "heo-quay", "ga-xe", "cha-chay", "cha-bong", "do-chua", "dua-leo", "rau", "gia-vi"]);

/** Các lựa chọn của hội thoại hết hàng đang mở: [{ id, label, hint, cost, price, ok, free, risk }]. */
export function stockoutOptions(s) {
  const sh = s.shift, d = sh?.dialog;
  if (!d || d.kind !== "stockout") return [];
  const id = d.id, out = [];
  const borrowOk = !s.daily.borrowed;
  if (id === "gas") {
    const coming = sh.deliveries.some((x) => x.want === "gas");
    out.push({ id: "gasCall", label: coming ? "Anh Lâm đang chở bình tới" : "Gọi Anh Lâm thay bình", hint: coming ? "Đã gọi rồi, chờ chút" : "Bình mới tới sau 20 giây", cost: `−${RESCUE.gasTank + RESCUE.shipTip}k`, price: RESCUE.gasTank + RESCUE.shipTip, ...(coming ? { ok: false } : {}) });
    out.push({ id: "gasBorrow", label: "Chạy qua mượn bình Cô Sáu", hint: "Quầy trống 10 giây, mai trả bình", cost: "Miễn phí · 1 lần/ngày", price: 0, ok: !s.daily.gasBorrowed, free: true });
    out.push({ id: "dismiss", label: "Bán bánh trong tủ trước", hint: "Chưa nướng mẻ mới tới khi có gas", cost: "Miễn phí", price: 0, free: true });
  } else if (id === "que") {
    const baking = sh.oven.some((b) => b && b.kind === "que");
    out.push({ id: "waitOven", label: baking ? "Mời khách chờ khay que đang nướng" : "Nướng một khay que", hint: "Que chín nhanh (14–19 giây)", cost: "Miễn phí", price: 0, free: true });
    out.push({ id: "dismiss", label: "Để sau, làm ổ khác trước", hint: "Phiếu vẫn giữ trên thớt", cost: "Miễn phí", price: 0, free: true });
  } else if (id === "banh") {
    const baking = sh.oven.some(Boolean), canBake = (s.stock.phoi || 0) > 0 && (s.stock.gas || 0) > 0;
    if (baking || canBake) out.push({ id: "waitOven", label: baking ? "Mời khách chờ mẻ đang nướng" : "Nướng mẻ mới", hint: baking ? "Rút mẻ là ráp tiếp được" : "Bỏ phôi vào lò rồi chờ chín", cost: "Miễn phí", price: 0, free: true });
    out.push({ id: "si", label: "Mua bánh sỉ lò đầu hẻm", hint: `${RESCUE.siPack} ổ giòn ${RESCUE.siCrisp}, quầy trống 15 giây`, cost: `−${RESCUE.siPrice}k`, price: RESCUE.siPrice });
    if (!canBake && (s.stock.phoi || 0) === 0) {
      out.push({ id: "run", label: "Chạy ra chợ mua phôi", hint: `${packSize("phoi")} phôi, quầy trống 12 giây`, cost: `−${runPrice("phoi")}k`, price: runPrice("phoi"), item: "phoi" });
      out.push({ id: "borrow", label: "Mượn Cậu Hưng 4 phôi", hint: "Xe bên kia đường, mai trả", cost: "Miễn phí · 1 lần/ngày", price: 0, ok: borrowOk, free: true, item: "phoi" });
    }
  } else {
    out.push({ id: "run", label: "Chạy ra chợ mua gấp", hint: `${packSize(id)} phần, quầy bỏ trống 12 giây`, cost: `−${runPrice(id)}k (+30%)`, price: runPrice(id), item: id });
    // M5: đã nhờ chở món này thì không gọi thêm lần nữa (bộ mô phỏng từng gọi 16 chuyến dưa leo trong một ca), mời khách chờ hàng tới
    const coming = sh.deliveries.find((x) => x.want === id);
    if (coming) out.push({ id: "dismiss", label: `Anh Lâm đang chở ${itemName(id)} tới`, hint: `Còn khoảng ${Math.max(1, Math.ceil((coming.at - sh.t) / 1000))} giây, làm ổ khác trước`, cost: "Miễn phí", price: 0, free: true });
    else out.push({ id: "ship", label: "Nhờ Anh Lâm chở tới", hint: "Tới sau 20 giây, đôi khi mua nhầm", cost: `−${shipPrice(id)}k`, price: shipPrice(id), item: id, risk: true });
    out.push({ id: "borrow", label: `Mượn Cậu Hưng ${RESCUE.borrowN} phần`, hint: "Xe bên kia đường, mai trả", cost: "Miễn phí · 1 lần/ngày", price: 0, ok: borrowOk, free: true, item: id });
    const c = d.cid !== null ? sh.customers.find((x) => x.id === d.cid) : null;
    if (c && SWAPPABLE.has(id)) out.push({ id: "swap", label: `Hỏi khách bỏ ${itemName(id)}`, hint: `Khả năng khách chịu ${Math.round((RESCUE.swapAccept[c.arch] ?? 0.6) * 100)}%`, cost: "Miễn phí · hên xui", price: 0, free: true, risk: true });
  }
  if (consignAvailable(s) || (!s.shift.consignUsed && out.filter((o) => o.price > 0).every((o) => o.price > s.money))) {
    out.unshift({ id: "consign", label: "Nhận gói ký gửi Bà Tư", hint: "Đủ làm 10 ổ pate bơ, bán tới đâu trả tới đó", cost: "Trả sau bằng giá vốn", price: 0, free: true });
  }
  out.push({ id: "close", label: "Đóng cửa sớm", hint: "Khách đang chờ về hết, danh tiếng −3", cost: "Miễn phí", price: 0, free: true });
  for (const o of out) if (o.ok === undefined) o.ok = o.price <= s.money;
  return out;
}

/** Chọn cách cứu hết hàng. */
export function resolveStockout(s, choice, ev, endShift) {
  const sh = s.shift, d = sh?.dialog;
  if (!d || d.kind !== "stockout") return { err: "no-dialog" };
  const o = stockoutOptions(s).find((x) => x.id === choice);
  if (!o) return { err: "bad-choice" };
  if (!o.ok) return { err: "cannot-afford" };
  const id = d.id, ctx = { item: itemName(o.item || id), n: RESCUE.borrowN };
  let line = "";
  sh.dialog = null;
  engineFlag(s, "het-hang", 2);
  switch (choice) {
    case "run":
      spend(s, o.price); sh.stats.rescueSpent += o.price;
      sh.away = { until: sh.t + RESCUE.runMs, kind: "run", id: o.item };
      line = freshLine(s, RESCUE_SAY.run, ctx);
      engineFlag(s, "chay-cho", 2); sh.witness = { kind: "ran", t: sh.t };
      sh.moments?.push({ kind: "ran", id: o.item, name: "", line: `Chạy ra chợ mua gấp ${ctx.item}, quầy bỏ trống mười hai giây.` });
      break;
    case "ship": {
      spend(s, o.price); sh.stats.rescueSpent += o.price;
      const wrong = next(s) < RESCUE.shipWrong;
      const got = wrong ? pick(s, STOCK_IDS.filter((x) => x !== id && STOCK[x].kho && STOCK[x].unlock <= s.level)) : id;
      sh.deliveries.push({ at: sh.t + RESCUE.shipMs, id: got || id, want: id, n: packSize(got || id) });
      line = freshLine(s, RESCUE_SAY.ship, ctx);
      break;
    }
    case "borrow":
      s.stock[o.item] = (s.stock[o.item] || 0) + RESCUE.borrowN;
      s.daily.borrowed = true; s.debts.hung = (s.debts.hung || 0) + RESCUE.borrowN;
      engineFlag(s, "muon-hung", 2);
      line = freshLine(s, RESCUE_SAY.borrow, ctx);
      break;
    case "swap": {
      const c = sh.customers.find((x) => x.id === d.cid);
      if (next(s) < (RESCUE.swapAccept[c.arch] ?? 0.6)) {
        dropRequirement(c.items[board(s).item] || c.items[0], id);
        c.swapped = id;
        sh.witness = { kind: "swapYes", t: sh.t };
        line = freshLine(s, RESCUE_SAY.swapYes, { ...ctx, call: c.call });
        ev.push({ type: "swapped", cid: c.id, ok: true });
      } else {
        line = freshLine(s, RESCUE_SAY.swapNo, { ...ctx, call: c.call });
        sh.witness = { kind: "swapNo", t: sh.t };
        walkOff(s, c, ev);
        ev.push({ type: "swapped", cid: c.id, ok: false });
      }
      break;
    }
    case "consign": consign(s, ev, true); line = freshLine(s, RESCUE_SAY.consign, ctx); break;
    case "si":
      spend(s, o.price); sh.stats.rescueSpent += o.price;
      sh.away = { until: sh.t + RESCUE.siMs, kind: "si" };
      line = freshLine(s, RESCUE_SAY.si, ctx);
      break;
    case "waitOven": line = freshLine(s, RESCUE_SAY.waitOven, ctx); break;
    case "gasCall":
      spend(s, o.price); sh.stats.rescueSpent += o.price;
      sh.deliveries.push({ at: sh.t + RESCUE.shipMs, id: "gas", want: "gas", n: packSize("gas") });
      line = freshLine(s, RESCUE_SAY.gasCall, ctx);
      break;
    case "gasBorrow":
      s.daily.gasBorrowed = true;
      sh.away = { until: sh.t + 10000, kind: "gas" };
      line = freshLine(s, RESCUE_SAY.gasBorrow, ctx);
      break;
    case "dismiss": break;
    case "close":
      line = freshLine(s, RESCUE_SAY.close, ctx);
      s.rep = Math.max(0, s.rep + RESCUE.closeRep);
      engineFlag(s, "dong-som", 2);
      sh.moments?.push({ kind: "closed", name: "", line: `Hết ${ctx.item}, đóng cửa sớm.` });
      ev.push({ type: "stockoutResolved", choice, id, line });
      return endShift(s, ev, true);
    default: return { err: "bad-choice" };
  }
  ev.push({ type: "stockoutResolved", choice, id, line });
  return { ok: true };
}

/** Khách chịu bỏ một món: yêu cầu của ổ không còn món đó. */
function dropRequirement(it, id) {
  if (!it) return;
  if (it.spreads[id]) delete it.spreads[id];
  it.fills = it.fills.filter((x) => x !== id);
  for (const [v, k] of Object.entries(VEG)) if (k === id) it.veg[v] = false;
  if (id === "gia-vi") { it.ot = 0; it.sauces = {}; it.quirks = it.quirks.filter((q) => !q.includes("ot")); }
  if (id === "pate") it.quirks = it.quirks.filter((q) => q !== "nhieu-pate");
}
/** Khách bỏ đi (không chịu đổi món): thớt trả ổ về tủ nếu chưa rạch, không thì hao. */
export function walkOff(s, c, ev) {
  const sh = s.shift;
  for (const b of sh.boards) {
    if (b.cid !== c.id) continue;
    if (b.loaf && !b.loaf.sliced && b.loaf.toastT0 === null && !Object.keys(b.loaf.used).length) sh.case.push({ id: b.loaf.id, crisp: b.loaf.crisp, src: b.loaf.src, ...(b.loaf.dark ? { dark: true } : {}) });
    else if (b.loaf) wasteLoaf(sh, b.loaf, "Ổ làm dở, khách bỏ đi");
    Object.assign(b, emptyBoard());
  }
  takePartial(s, c, ev);
  for (const f of c.filled) if (f) wasteLoaf(sh, f, "Ổ đã gói, khách bỏ đi");
  c.phase = "leave"; c.leaveT = sh.t; c.mood = "impatient";
  if (sh.paying === c.id) sh.paying = null;
  s.rep = Math.max(0, s.rep - 1);
  sh.stats.lost++;
}

/** Quầy trống / giao hàng tới: chạy trong tick. */
export function tickRescue(s, ev) {
  const sh = s.shift;
  if (sh.away && sh.t >= sh.away.until) {
    const a = sh.away;
    sh.away = null;
    if (a.kind === "run") { s.stock[a.id] = (s.stock[a.id] || 0) + packSize(a.id); addLot(s, a.id, packSize(a.id)); ev.push({ type: "ranBack", id: a.id, line: freshLine(s, RESCUE_SAY.back, { item: itemName(a.id) }) }); }
    else if (a.kind === "si") { for (let i = 0; i < RESCUE.siPack; i++) sh.case.push(newLoaf(s, RESCUE.siCrisp, "si")); ev.push({ type: "ranBack", id: "banh-si", line: "Mang về mười ổ bánh sỉ, giòn vừa thôi nhưng đỡ." }); }
    else if (a.kind === "gas") { s.stock.gas = (s.stock.gas || 0) + 10; ev.push({ type: "ranBack", id: "gas", line: "Mượn được bình gas của Cô Sáu, lò lên lửa rồi." }); }
    else if (a.kind === "change") { finishRunChange(s, a, ev); }
  }
  for (let i = sh.deliveries.length - 1; i >= 0; i--) {
    const dv = sh.deliveries[i];
    if (sh.t < dv.at) continue;
    sh.deliveries.splice(i, 1);
    s.stock[dv.id] = (s.stock[dv.id] || 0) + dv.n; addLot(s, dv.id, dv.n);
    const wrong = dv.id !== dv.want;
    ev.push({ type: "delivered", id: dv.id, wrong, line: freshLine(s, wrong ? RESCUE_SAY.deliveredWrong : RESCUE_SAY.delivered, { item: itemName(dv.want), got: itemName(dv.id), n: dv.n }) });
  }
}

// ---------- hết tiền lẻ ----------
export function nochangeOptions(s) {
  const d = s.shift?.dialog;
  if (!d || d.kind !== "nochange") return [];
  return [
    { id: "run", label: "Chạy qua Cô Sáu đổi lẻ", hint: "Quầy trống 10 giây, thối đúng", cost: "Miễn phí", ok: true, free: true },
    { id: "owe", label: "Cho khách thiếu, mai trả", hint: "Hôm nay không thu tiền ổ này", cost: `−${d.price}k hôm nay`, ok: true, free: true },
    { id: "self", label: "Nhờ khách tự đi đổi", hint: "Khách có thể không quay lại (20%)", cost: "Miễn phí · hên xui", ok: true, free: true, risk: true },
  ];
}
/** Mở hội thoại hết lẻ cho khách đang trả tiền. */
export function openNochange(s, c, ev) {
  const sh = s.shift;
  sh.dialog = { kind: "nochange", cid: c.id, bill: c.pay.bill, price: c.pay.due, line: freshLine(s, NOCHANGE.open, { bill: c.pay.bill, price: c.pay.due }) };
  ev.push({ type: "nochange", cid: c.id });
}
export function resolveNochange(s, choice, ev, settle) {
  const sh = s.shift, d = sh?.dialog;
  if (!d || d.kind !== "nochange") return { err: "no-dialog" };
  const c = sh.customers.find((x) => x.id === d.cid);
  if (!c || c.phase !== "pay") { sh.dialog = null; return { err: "not-paying" }; }
  sh.dialog = null;
  let line;
  if (choice === "run") {
    sh.away = { until: sh.t + 10000, kind: "change", cid: c.id };
    line = freshLine(s, NOCHANGE.run, {});
  } else if (choice === "owe") {
    line = freshLine(s, NOCHANGE.owe, {});
    s.debts.customers = (s.debts.customers || 0) + c.pay.due;
    settle(s, c, { received: {}, change: {}, owed: true }, ev);
  } else if (choice === "self") {
    if (next(s) < 0.8) { line = freshLine(s, NOCHANGE.self, {}); settle(s, c, { received: greedyBills(c.pay.due), change: {}, exact: true }, ev); }
    else { line = freshLine(s, NOCHANGE.selfLeft, {}); settle(s, c, { received: {}, change: {}, lost: true }, ev); }
  } else { sh.dialog = d; return { err: "bad-choice" }; }
  ev.push({ type: "nochangeResolved", choice, line });
  return { ok: true };
}
/** Về từ Cô Sáu: tờ lớn khách đưa vào két, thối đúng bằng tờ vừa đổi. */
function finishRunChange(s, a, ev) {
  const c = s.shift.customers.find((x) => x.id === a.cid && x.phase === "pay");
  if (!c) return;
  ev.push({ type: "ranBack", id: "tien-le", line: "Cô Sáu đổi cho một nắm tiền lẻ, thối đúng cho khách rồi." });
  s.shift.settleQueue = s.shift.settleQueue || [];
  s.shift.settleQueue.push({ cid: c.id, mode: "exact-change" });
}
export { OUT_LINES, receive };
