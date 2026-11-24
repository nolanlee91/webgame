// Kho + nhập hàng + ướp sườn + đồ nghề + gói ký gửi Cô Ba (ECONOMY §1, §6, §7). Thuần.
// Sức chứa kho tính các nguyên liệu có cap (vỉa hè 80 phần). Hàng ký gửi / cứu giữa ca được vượt sức chứa (để dưới gầm bếp).
// Không bao giờ kẹt: khi tiền + hàng không làm nổi một dĩa cơm sườn, Cô Ba gửi gói ký gửi (bù đủ 10 dĩa, trả dần bằng giá vốn khi bán).
import { STOCK, STOCK_IDS, CAPACITY, GEAR, CONSIGN, SERVICE, guestsFor, MO_HANH, DISHES, dishParts, SHELF } from "../data/economy.js?v=c4";
import { addNewDishes } from "./progress.js?v=c4";

export const capacity = (s) => (s.owned?.fridge && s.stage === "quan" ? 200 : CAPACITY[s.stage === "quan" ? "quan" : "street"]); // A: tủ mát kho 200
export const stockUsed = (s) => STOCK_IDS.filter((id) => STOCK[id].cap).reduce((a, id) => a + (s.stock[id] || 0), 0);
export const packPrice = (id, express = false) => (STOCK[id]?.pack ? Math.ceil(STOCK[id].pack[1] * (express ? 1.15 : 1)) : 0);
export const packSize = (id) => STOCK[id]?.pack?.[0] || 0;
export const canBuy = (s, id) => !!STOCK[id] && STOCK[id].buy !== false && !!STOCK[id].pack && (STOCK[id].unlock || 1) <= s.level;

/** S: ghi một lô hàng tươi (hạn tính từ hôm nay). Mọi chỗ cộng kho hàng có hạn đều gọi (nhập, ký gửi, mượn, hàng chở tới, quà sự kiện, gói học),
 * nếu không lô đó bị coi là hàng cũ và bỏ ngay lúc sang ngày (lỗi M5: gói học + ký gửi hết hạn sau một đêm). */
export function addLot(s, id, n, day = s.day) { if (!SHELF[id] || !(n > 0)) return; s.bought ||= {}; (s.bought[id] ||= []).push({ day, n }); }
/** Nhập một gói (express = giao gấp trong ca, +15%). */
export function restock(s, id, ev = [], { express = false, packs = 1 } = {}) {
  if (!canBuy(s, id)) return { err: "locked" };
  const n = packSize(id) * packs, price = packPrice(id, express) * packs;
  if (s.money < price) return { err: "money" };
  if (STOCK[id].cap && stockUsed(s) + n > capacity(s)) return { err: "capacity" };
  s.money -= price; s.stock[id] = (s.stock[id] || 0) + n;
  s.stats.spentStock += price;
  addLot(s, id, n);
  if (s.shift) s.shift.stats.restockSpent += price;
  ev.push({ type: "restocked", id, n, price, express });
  return { ok: true };
}

/** Nhu cầu hôm nay (dự báo): số dĩa + phần trà + rổ than. */
export function forecast(s) {
  const kinds = s.plan?.length ? s.plan : ["toi"];
  const guests = kinds.reduce((a, k) => a + guestsFor(s.level, k, s.day), 0);
  // S (M5): bộ mô phỏng cho thấy người chơi bán được khoảng 75–85% số khách dự báo (còn lại đi ngang / bỏ về); nhập theo đủ 100% thì hao hàng tươi
  return { guests, dishes: Math.ceil(guests * 0.85) + 2, tea: Math.ceil(guests * 2.2), coal: 5 * kinds.length };
}
/** S (M5): số hộp các đơn đặt trước / mâm cơm hôm nay còn cần (mâm 8–40 phần đựng hộp). */
const orderBoxes = (s) => (s.orders || []).filter((o) => o.day === s.day && (o.status === "waiting" || o.status === "open")).reduce((a, o) => a + Math.max(0, o.n - (o.done || 0)), 0);
/** "Nhập + ướp đủ cho hôm nay": mua theo thứ tự ưu tiên tới khi đủ dự báo hoặc hết tiền / chỗ, rồi ướp sườn cho đủ. */
export function restockToday(s, ev = []) {
  const f = forecast(s);
  const rice = (s.kitchen?.rice || 0);
  const want = [
    ["suon", Math.max(0, f.dishes - (s.stock["suon-uop"] || 0) - (s.stock.suon || 0))],
    ["gao-tam", Math.max(0, f.dishes + 3 - rice - (s.stock["gao-tam"] || 0))],
    ["than", Math.max(0, f.coal - (s.stock.than || 0) - (s.spareSack || 0) * 10)],
    ["do-chua", Math.max(0, f.dishes + 3 - (s.stock["do-chua"] || 0))],
    ["dua-leo", Math.max(0, f.dishes + 3 - (s.stock["dua-leo"] || 0))],
    ["nuoc-mam", Math.max(0, f.dishes + 3 - (s.stock["nuoc-mam"] || 0))],
    ["mo-hanh-bo", (s.moHanh?.n || 0) + (s.stock["mo-hanh-bo"] || 0) * MO_HANH.jar < f.dishes + 2 ? 1 : 0],
    ["tra", Math.max(0, f.tea - (s.stock.tra || 0))],
    // S (M5): hộp theo số khách mang về dự kiến (shipper ca trưa lấy 1–3 hộp); bản cũ chỉ giữ 4 hộp ⇒ hết hộp giữa ca trưa
    ["hop", Math.max(0, (s.owned?.["takeaway-shelf"] ? Math.ceil(f.guests * 0.3) + 2 : 4) + orderBoxes(s) - (s.stock.hop || 0))], // + hộp cho đơn đặt / mâm cơm hôm nay
  ];
  // nguyên liệu riêng của các món trong menu (bì, chả, trứng…): chia đều theo số món
  const menu = (s.menu || ["com-suon"]).filter((id) => DISHES[id] && DISHES[id].level <= s.level);
  const share = Math.ceil(f.dishes / Math.max(1, menu.length)) + 2;
  const extra = {};
  for (const id of menu) for (const k of Object.keys(dishParts(id))) if (k !== "suon-uop" && k !== "bread" && STOCK[k]) extra[k] = (extra[k] || 0) + share;
  // S (M5): than ngay sau sườn + gạo, trước món phụ: thiếu tiền mà mua bì / trứng trước thì sáng mai không nhóm nổi bếp (sim: ẩu lụn bại vì bếp nguội)
  want.splice(3, 0, ...Object.entries(extra).map(([k, n]) => [k, Math.max(0, n - (s.stock[k] || 0))])); // món của menu ngay sau sườn + gạo
  // mua lần lượt từng gói theo vòng (mỗi món cần một gói trước khi món nào được gói thứ hai): kho vỉa hè 80 phần không bị
  // sườn + gạo + một món phụ chiếm hết trước khi tới bì / chả / trứng của menu
  let spent = 0, bought = 0;
  const left = new Map(want.filter(([id, need]) => need > 0 && canBuy(s, id)).map(([id, need]) => [id, need]));
  // kho không đủ chỗ cho mọi thứ: chia chỗ theo tỉ lệ nhu cầu (sườn tính cả phần sẽ ướp) để món nào cũng có phần
  const capNeed = [...left].filter(([id]) => STOCK[id].cap).reduce((a, [, n]) => a + n, 0);
  const free = capacity(s) - stockUsed(s);
  if (capNeed > free && free > 0) for (const [id, n] of left) if (STOCK[id].cap) left.set(id, Math.max(1, Math.round((n * free) / capNeed)));
  while (left.size) {
    for (const [id, need] of [...left]) {
      const r = restock(s, id, []);
      if (r.err) { left.delete(id); continue; }
      spent += packPrice(id); bought++;
      if (need - packSize(id) > 0) left.set(id, need - packSize(id)); else left.delete(id);
    }
  }
  const mar = marinate(s, Math.max(0, f.dishes - (s.stock["suon-uop"] || 0)), []);
  ev.push({ type: "restockedToday", spent, bought, marinated: mar.n || 0 });
  return { ok: true, spent };
}

/** Sang ngày: hàng tươi quá hạn (FIFO: phần còn lại là hàng mới nhất; vượt số đã nhập trong hạn thì là hàng cũ) ⇒ bỏ, ghi hao. */
export function expireStock(s, newDay) {
  const out = {};
  s.bought ||= {};
  for (const [id, life] of Object.entries(SHELF)) {
    const lots = (s.bought[id] || []).filter((p) => newDay - p.day < life);
    s.bought[id] = lots;
    const valid = lots.reduce((a, p) => a + p.n, 0);
    const over = (s.stock[id] || 0) - valid;
    if (over > 0) { s.stock[id] -= over; out[id] = over; }
  }
  return out;
}
/** Ướp sườn ở Chuẩn bị (không tính giờ): sườn sống → sườn ướp hôm nay. */
export function marinate(s, n, ev = []) {
  n = Math.max(0, Math.min(Math.floor(n) || 0, s.stock.suon || 0));
  if (!n) return { ok: true, n: 0 };
  s.stock.suon -= n; s.stock["suon-uop"] = (s.stock["suon-uop"] || 0) + n;
  ev.push({ type: "marinated", n });
  return { ok: true, n };
}

/** Mua đồ nghề (bao than dự phòng, thêm dĩa, chảo trứng, bàn 3…). */
export function buyGear(s, id, ev = []) {
  const G = GEAR[id];
  if (!G) return { err: "bad-gear" };
  if (s.level < G.level) return { err: "locked" };
  if (!G.repeat && s.owned[id]) return { err: "owned" };
  if (id === "plates-4" && s.plates + 4 > maxPlates(s)) return { err: "plates-max" };
  if (s.money < G.price) return { err: "money" };
  s.money -= G.price; s.stats.spentGear += G.price;
  if (id === "spare-sack") s.spareSack++;
  else if (id === "plates-4") s.plates += 4;
  else s.owned[id] = true;
  ev.push({ type: "bought", id, name: G.name, price: G.price });
  addNewDishes(s, ev);
  return { ok: true };
}
export const maxPlates = (s) => (s.owned["dish-cabinet"] ? SERVICE.plates.cabinet : s.stage === "quan" ? 24 : 16);

/** Làm nổi một dĩa cơm sườn không (tính cả tiền mua phần thiếu)? */
export function canMakeOne(s) {
  const rice = (s.shift ? s.shift.rice.n + (s.shift.rice.cooking?.add || 0) : s.kitchen?.rice || 0) + (s.stock["gao-tam"] || 0);
  const need = [
    ["suon", (s.stock["suon-uop"] || 0) + (s.stock.suon || 0) + (s.shift ? s.shift.grill.slots.filter(Boolean).length : 0) > 0],
    ["gao-tam", rice > 0],
    ["nuoc-mam", (s.stock["nuoc-mam"] || 0) > 0],
    ["than", (s.stock.than || 0) + (s.spareSack || 0) * 10 >= (s.shift ? 1 : 2) || (s.shift?.grill.coal || s.kitchen?.coal || 0) > 15], // S: đầu ngày cần 2 rổ để nhóm bếp
  ];
  const miss = need.filter(([, ok]) => !ok);
  const cost = miss.reduce((a, [id]) => a + packPrice(id, !!s.shift), 0);
  const room = miss.filter(([id]) => STOCK[id].cap).reduce((a, [id]) => a + packSize(id), 0);
  return cost <= s.money && stockUsed(s) + room <= capacity(s);
}
/** Gói ký gửi: một lần mỗi ngày (Chuẩn bị) + một lần giữa ca khi hết tiền. */
export function consignAvailable(s) {
  if (canMakeOne(s)) return false;
  return s.shift ? !s.shift.consignUsed : !s.daily.consigned;
}
export function consign(s, ev = [], force = false) {
  if (!force && !consignAvailable(s)) return { err: "no-consign" };
  let owed = 0;
  const added = {};
  for (const [id, n] of Object.entries(CONSIGN.parts)) {
    const have = id === "gao-tam" ? (s.stock[id] || 0) + (s.shift?.rice.n || s.kitchen?.rice || 0) : s.stock[id] || 0;
    const add = Math.max(0, n - have);
    if (!add) continue;
    s.stock[id] = (s.stock[id] || 0) + add; added[id] = add; addLot(s, id, add);
    owed += add * (id === "than" ? STOCK.than.cost : STOCK[id].cost);
  }
  if ((s.moHanh?.n || 0) < 10 && (s.stock["mo-hanh-bo"] || 0) === 0) { s.stock["mo-hanh-bo"] = 1; added["mo-hanh-bo"] = 1; owed += STOCK["mo-hanh-bo"].cost; }
  owed = Math.ceil(owed);
  s.consign = { owed: (s.consign?.owed || 0) + owed };
  if (s.shift) s.shift.consignUsed = true; else s.daily.consigned = true;
  ev.push({ type: "consigned", owed, added });
  return { ok: true, owed };
}
