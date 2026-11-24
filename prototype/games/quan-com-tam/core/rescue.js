// Cứu hết hàng giữa ca (GAME-DESIGN §5, ECONOMY §10; khung theo core/rescue.js của Tiệm Bánh Mì).
// Hội thoại hết hàng luôn có lựa chọn miễn phí (mượn quán bên cạnh, để sau, treo bảng hết món, đổi bánh mì sườn) và gói ký gửi Cô Ba
// lên đầu khi không đủ tiền. Chạy ra chợ: cô chủ rời quán 12 giây, bếp vẫn chạy. Nhờ Anh Sáu chở: hàng tới sau 20 giây.
import { STOCK, RESCUE, DISHES } from "../data/economy.js?v=c5";
import { packPrice, packSize, consignAvailable, consign, addLot } from "./stock.js?v=c5";
import { sendAway } from "./walker.js?v=c5";
import { voidTicket } from "./tables.js?v=c5";

const lower = (t) => t.toLocaleLowerCase("vi");
export const itemName = (id) => (id === "gao-tam" ? "gạo tấm" : id === "suon-uop" ? "sườn ướp" : lower(STOCK[id]?.name || id));
const buyId = (id) => (id === "suon-uop" ? "suon" : id);
const runPrice = (id) => Math.ceil(packPrice(buyId(id)) * (1 + RESCUE.runMarkup));
const shipPrice = (id) => Math.ceil(packPrice(buyId(id)) * (1 + RESCUE.shipMarkup)) + RESCUE.shipTip;

/** Mở hội thoại hết hàng (gọi từ thao tác của người chơi). */
export function openStockout(s, id, ev = [], extra = {}) {
  const sh = s.shift;
  if (sh.dialog) return { err: "dialog-open" };
  sh.dialog = { kind: "stockout", id, ...extra };
  ev.push({ type: "stockout", id });
  return { ok: true, stockout: id };
}

/** Lựa chọn của hội thoại hết hàng đang mở. */
export function stockoutOptions(s) {
  const sh = s.shift, d = sh?.dialog;
  if (!d || d.kind !== "stockout") return [];
  const id = d.id, out = [];
  const borrowed = !!s.daily.borrowed?.[id];
  const coming = sh.deliveries.find((x) => x.id === buyId(id) || x.id === id);
  if (id === "suon-uop" && (s.stock.suon || 0) > 0) out.push({ id: "marinate", label: "Ướp gấp sườn sống", hint: "Cô chủ đứng ở khay 10 giây, miếng ướp gấp tươi tối đa 90", cost: "Miễn phí", price: 0, free: true });
  out.push({ id: "run", label: `Chạy ra chợ mua ${itemName(id)}`, hint: `${packSize(buyId(id))} phần, cô chủ rời quán 12 giây (bếp vẫn chạy)`, cost: `−${runPrice(id)}k (+30%)`, price: runPrice(id) });
  if (coming) out.push({ id: "dismiss", label: `Anh Sáu đang chở ${itemName(id)} tới`, hint: `Còn khoảng ${Math.max(1, Math.ceil((coming.at - sh.t) / 1000))} giây`, cost: "Miễn phí", price: 0, free: true });
  else out.push({ id: "ship", label: "Nhờ Anh Sáu chở tới", hint: "Hàng tới sau 20 giây, cô chủ ở lại bếp", cost: `−${shipPrice(id)}k`, price: shipPrice(id) });
  const bn = id === "than" ? RESCUE.borrowThan : id === "gao-tam" ? 6 : RESCUE.borrowN;
  out.push({ id: "borrow", label: `Mượn quán bên cạnh ${bn} ${id === "than" ? "rổ" : "phần"}`, hint: "Mai trả lại", cost: "Miễn phí · 1 lần/ngày", price: 0, free: true, ok: !borrowed });
  if (id === "gao-tam" && (sh.breadUsed || 0) < RESCUE.breadMax) out.push({ id: "bread", label: "Đổi sang bánh mì sườn", hint: `Phiếu chưa xới cơm thành bánh mì sườn 30k (tối đa ${RESCUE.breadMax} ổ/ca)`, cost: "Miễn phí", price: 0, free: true });
  if (id === "suon-uop" || id === "gao-tam") out.push({ id: "soldOut", label: "Treo bảng hết món", hint: "Báo khách đang chờ món, không nhận thêm khách", cost: "Miễn phí · khách về", price: 0, free: true });
  if (id !== "suon-uop" && id !== "gao-tam") out.push({ id: "dismiss", label: id === "than" ? "Để sau, nướng bằng than còn lại" : `Bỏ qua ${itemName(id)} ở dĩa này`, hint: id === "than" ? "Bếp yếu dần tới khi có than" : "Thiếu lớp thì dĩa bị trừ điểm", cost: "Miễn phí", price: 0, free: true });
  const poor = out.filter((o) => o.price > 0).every((o) => o.price > s.money);
  if (consignAvailable(s) || (poor && !sh.consignUsed)) out.unshift({ id: "consign", label: "Nhận gói ký gửi Cô Ba", hint: "Đủ làm 10 dĩa cơm sườn, bán tới đâu trả tới đó", cost: "Trả sau bằng giá vốn", price: 0, free: true });
  for (const o of out) if (o.ok === undefined) o.ok = o.price <= s.money;
  return out;
}

/** Chọn một lựa chọn hết hàng. */
export function resolveStockout(s, choice, ev = []) {
  const sh = s.shift, d = sh.dialog;
  if (!d || d.kind !== "stockout") return { err: "no-dialog" };
  const opt = stockoutOptions(s).find((o) => o.id === choice);
  if (!opt) return { err: "bad-choice" };
  if (!opt.ok) return { err: opt.price > s.money ? "cannot-afford" : "used" };
  const id = d.id, bid = buyId(id);
  switch (choice) {
    case "marinate": sh.dialog = null; return { ok: true, task: "marinate" };
    case "run":
      s.money -= opt.price; sh.stats.rescueSpent += opt.price; s.stats.spentStock += opt.price;
      sendAway(s, "run", RESCUE.runMs, { id });
      sh.deliveries.push({ at: sh.t + RESCUE.runMs, id: id === "suon-uop" ? "suon-uop" : bid, n: packSize(bid), fresh: 90 });
      break;
    case "ship":
      s.money -= opt.price; sh.stats.rescueSpent += opt.price; s.stats.spentStock += opt.price;
      sh.deliveries.push({ at: sh.t + RESCUE.shipMs, id: id === "suon-uop" ? "suon-uop" : bid, n: packSize(bid), fresh: 90, by: "anh-sau" });
      break;
    case "borrow": {
      const n = id === "than" ? RESCUE.borrowThan : id === "gao-tam" ? 6 : RESCUE.borrowN;
      s.stock[id] = (s.stock[id] || 0) + n; addLot(s, id, n); // S
      s.daily.borrowed = { ...(s.daily.borrowed || {}), [id]: n };
      if (id === "suon-uop") sh.uopFresh = Math.min(sh.uopFresh ?? 100, 90);
      ev.push({ type: "borrowed", id, n });
      break;
    }
    case "bread": {
      let n = 0;
      for (const t of sh.tickets) {
        if (n + (sh.breadUsed || 0) >= RESCUE.breadMax) break;
        if ((t.status !== "open" && t.status !== "pinned") || t.takeaway || DISHES[t.dish]?.meat !== "suon") continue;
        const sl = sh.slots.find((x) => x.tk === t.id);
        if (sl?.plate?.com) continue;
        t.dish = "banh-mi-suon"; t.quirks = (t.quirks || []).filter((q) => q === "chayCanh"); n++;
      }
      sh.breadUsed = (sh.breadUsed || 0) + n;
      ev.push({ type: "breadSwap", n });
      break;
    }
    case "soldOut": {
      sh.closed = true;
      for (const t of sh.tickets.slice()) if ((t.status === "open" || t.status === "pinned") && !sh.slots.some((x) => x.tk === t.id && x.plate && (id !== "gao-tam" || x.plate.com))) voidTicket(s, t.id, ev);
      ev.push({ type: "closedEarly", id });
      break;
    }
    case "consign": consign(s, ev, true); break;
    case "dismiss": break;
    default: return { err: "bad-choice" };
  }
  sh.dialog = null;
  ev.push({ type: "rescued", choice, id });
  return { ok: true };
}
