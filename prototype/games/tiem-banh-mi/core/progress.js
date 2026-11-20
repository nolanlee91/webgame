// Tiến trình + kinh tế M3 (ECONOMY.md §6–§10, GAME-DESIGN.md §6): mua đồ / trang trí / bảng hiệu, thuê mặt bằng (lên tiệm cấp 7),
// hạng tiệm + pate nhà làm (chỗ tiêu tiền cuối game), quảng bá, phụ việc Bé Na, hội chợ, thử thách, ổ mang tên tiệm, bánh hôm qua,
// thời tiết, đơn đặt trước (Chuẩn bị ca + sự kiện), kéo thả trang trí. Thuần; mọi thao tác qua core/apply.js.
import { EQUIPMENT, DECOR, SIGNBOARDS, APPEAL_CAP, PLACE_ZONES, SPOT_CLEARANCE, PATH_CLEARANCE, RANKS, HOUSE_PATE, HOUSE_LOAF, PROMOS, PROMO_UNLOCK,
  RENT, HELPER, PREORDER, FAIR, CHALLENGE, RECIPE_NEEDS } from "../data/equipment.js?v=b3";
import { RECIPE, STOCK, SPREADS, FILLINGS, LEVEL_USE, BASE_COST, OVENS } from "../data/economy.js?v=b3";
import { ARCHETYPES } from "../data/customers.js?v=b3";
import { RENT_LINES, RANK_LINES, UPGRADE_LINES, CART_MEMORY, STALE } from "../data/lines-m3.js?v=b3";
import { next, int, pick } from "./rng.js?v=b3";
import { fill, freshLine } from "./text.js?v=b3";
import { spend } from "./money.js?v=b3";
import { makeItem, menuFor } from "./order.js?v=b3";
import { engineFlag, today, addMod } from "./flags.js?v=b3";

const owns = (s, id) => !!s.owned?.[id];
export const stageOf = (s) => (s.level >= 16 && s.shop ? "famous" : s.shop ? "shop" : "cart");

// ---------- mua đồ ----------
export function canBuy(s, id) {
  const it = EQUIPMENT[id] || DECOR[id] || SIGNBOARDS[id];
  if (!it || it.event) return "bad-item";
  if (owns(s, id) && !it.consumable) return "owned";
  if (it.consumable && owns(s, id)) return "owned";
  if (it.level > s.level) return "locked";
  if (it.needs && !owns(s, it.needs)) return "needs";
  if (id === "awning" && s.shop) return "not-needed";
  if (s.money < it.price) return "money";
  return null;
}
export function buyItem(s, id, ev) {
  if (s.shift) return { err: "shift-open" };
  const e = canBuy(s, id);
  if (e) return { err: e };
  const it = EQUIPMENT[id] || DECOR[id] || SIGNBOARDS[id];
  spend(s, it.price);
  s.owned[id] = true;
  s.stats.spentGear = (s.stats.spentGear || 0) + it.price;
  if (id === "electric-oven") { s.oven = "electric"; engineFlag(s, "lo-dien", 5); }
  ev.push({ type: "bought", id, price: it.price, name: it.name, line: freshLine(s, UPGRADE_LINES, { item: it.name }) });
  return { ok: true };
}
export const boardCount = (s) => (owns(s, "board-3") ? 3 : owns(s, "board-2") ? 2 : 1);
/** Số ổ giống nhau ráp một lượt (thớt dài 4, bàn dài 8). */
export const batchMax = (s) => (owns(s, "long-table") ? 8 : owns(s, "long-board") ? 4 : 1);
export const toasterSlots = (s) => (owns(s, "toaster-2") ? 2 : 1);

/** Điểm hấp dẫn (trang trí + bảng hiệu), trần 3 (4 từ cấp 19). */
export function appeal(s) {
  let a = 0;
  for (const [id, D] of Object.entries(DECOR)) if (owns(s, id)) a += D.appeal || 0;
  for (const [id, D] of Object.entries(SIGNBOARDS)) if (owns(s, id)) a += D.appeal || 0;
  return Math.min(APPEAL_CAP(s.level), a);
}
/** % kiên nhẫn cộng thêm (trà đá, dây xếp hàng, ghế, quạt, hạng tiệm). */
export function patienceBonus(s) {
  let p = 0;
  if (owns(s, "tea-jug")) p += 6;
  if (owns(s, "queue-rope")) p += 5;
  for (const [id, D] of Object.entries(DECOR)) if (owns(s, id) && D.patience) p += D.patience;
  p += 2 * (s.rank || 0);
  return p;
}

// ---------- lên tiệm ----------
export function rentShop(s, ev) {
  if (s.shift) return { err: "shift-open" };
  if (s.shop) return { err: "owned" };
  if (s.level < RENT.level) return { err: "locked" };
  if (s.money < RENT.price) return { err: "money" };
  spend(s, RENT.price);
  // kỷ niệm xe đẩy giữ lại trong Nhật Ký
  const days = Math.max(1, s.stats.shifts);
  const memory = fill(pick(s, CART_MEMORY), { days, loaves: s.stats.loaves });
  s.cartMemory = { days, loaves: s.stats.loaves, revenue: Math.round(s.stats.revenue), best: s.stats.bestProfit, line: memory, movedDay: s.day };
  s.journal = s.journal || [];
  s.journal.unshift({ day: Math.max(1, s.day - 1), kind: "cart", headline: "Tạm biệt xe đẩy", moment: memory, loaves: s.stats.loaves, profit: Math.round(s.stats.bestProfit), stars: s.rating || 0, shop: s.shopName });
  if (s.journal.length > 40) s.journal.length = 40;
  s.shop = true;
  if (s.oven === "mini") s.oven = "gas";
  engineFlag(s, "len-tiem", 4);
  ev.push({ type: "rented", line: freshLine(s, RENT_LINES, {}), memory });
  return { ok: true };
}

// ---------- hạng tiệm + pate nhà làm ----------
export function buyRank(s, ev) {
  if (s.shift) return { err: "shift-open" };
  const R = RANKS[s.rank || 0];
  if (!R) return { err: "max" };
  if (!s.shop) return { err: "needs" };
  if (R.level > s.level) return { err: "locked" };
  if (s.money < R.price) return { err: "money" };
  spend(s, R.price);
  s.rank = (s.rank || 0) + 1;
  ev.push({ type: "ranked", rank: s.rank, price: R.price, line: freshLine(s, RANK_LINES, {}) });
  return { ok: true };
}
export function buyPate(s, ev) {
  if (s.shift) return { err: "shift-open" };
  const P = HOUSE_PATE[s.pate || 0];
  if (!P) return { err: "max" };
  if (P.level > s.level) return { err: "locked" };
  const price = s.drama?.flags?.["pate-nha-lam-giam"] && !s.pate ? Math.round(P.price * 0.75) : P.price;
  if (s.money < price) return { err: "money" };
  spend(s, price);
  s.pate = (s.pate || 0) + 1;
  ev.push({ type: "pateUp", tier: s.pate, price });
  return { ok: true };
}
/** Ổ có pate: +k giá bán (pate nhà làm + mod "pate" từ sự kiện). */
export const patePlus = (s) => (s.pate || 0);

// ---------- ổ mang tên tiệm ----------
export const houseCost = (spreads, fills) => BASE_COST + SPREADS.reduce((a, id) => a + STOCK[id].cost * LEVEL_USE[spreads[id] || 0], 0) + fills.reduce((a, id) => a + STOCK[id].cost, 0);
export function houseRange(spreads, fills) { const c = houseCost(spreads, fills); return [Math.ceil(c * HOUSE_LOAF.minMul), Math.floor(c * HOUSE_LOAF.maxMul)]; }
export function setHouse(s, { name, spreads = { pate: 2, bo: 2 }, fills = [], price } = {}, ev) {
  if (s.shift) return { err: "shift-open" };
  if (s.level < HOUSE_LOAF.level) return { err: "locked" };
  const nm = typeof name === "string" ? name.replace(/\s+/g, " ").trim().slice(0, 28) : "";
  if (!nm) return { err: "empty-name" };
  const fl = [...new Set(fills)].filter((id) => FILLINGS.includes(id) && STOCK[id].unlock <= s.level);
  if (!fl.length || fl.length > HOUSE_LOAF.maxFills) return { err: "bad-fills" };
  const sp = Object.fromEntries(Object.entries(spreads).filter(([id, l]) => SPREADS.includes(id) && Number.isInteger(l) && l >= 1 && l <= 3));
  const [lo, hi] = houseRange(sp, fl);
  const p = Math.round(Number(price));
  if (!(p >= lo && p <= hi)) return { err: "bad-price", detail: { lo, hi } };
  s.house = { name: nm, spreads: sp, fills: fl, price: p, mul: Math.round((p / houseCost(sp, fl)) * 100) / 100 };
  ev.push({ type: "house", name: nm, price: p });
  return { ok: true };
}

// ---------- quảng bá / phụ việc / hội chợ / thử thách ----------
export function promo(s, kind, ev) {
  const P = PROMOS[kind];
  if (!P) return { err: "bad-promo" };
  if (s.shift) return { err: "shift-open" };
  if (s.level < PROMO_UNLOCK) return { err: "locked" };
  if (s.promo?.day === s.day) return { err: "once-per-day" };
  if (s.money < P.price) return { err: "money" };
  spend(s, P.price);
  s.promo = { day: s.day, kind };
  s.followers = (s.followers || 0) + (P.followers || 0);
  s.buzz = Math.min(20, (s.buzz || 0) + (P.buzz || 0));
  // cờ chỉ cho ca hôm nay (giữa hai ca s.day là ngày ca tới ⇒ hạn = s.day)
  s.drama.flags["promo-" + kind] = s.day;
  ev.push({ type: "promoted", kind, price: P.price });
  return { ok: true };
}
/** Khách thêm hôm nay nhờ quảng bá: { total, byArch }. */
export function promoGuests(s) {
  if (s.promo?.day !== s.day) return { total: 0, byArch: {} };
  const g = PROMOS[s.promo.kind]?.guests;
  if (typeof g === "number") return { total: g, byArch: {} };
  return { total: 0, byArch: { ...(g || {}) } };
}
export function hireHelper(s, on, ev) {
  if (s.shift) return { err: "shift-open" };
  if (s.level < HELPER.level) return { err: "locked" };
  if (!on) { if (s.helperDay === s.day) { s.money += HELPER.price; s.helperDay = 0; } ev.push({ type: "helper", on: false }); return { ok: true }; }
  if (s.helperDay === s.day) return { err: "owned" };
  if (s.money < HELPER.price) return { err: "money" };
  spend(s, HELPER.price);
  s.helperDay = s.day;
  s.drama.flags["be-na"] = s.day;
  ev.push({ type: "helper", on: true });
  return { ok: true };
}
export const helperToday = (s) => s.helperDay === s.day;
/** Hội chợ (cấp 18, Milestone 5 chép Trà Sữa): trả phí gian trước ca ⇒ ca hôm nay là "Lễ hội Bánh Mì phố": dài 4,5 phút, +8 khách, giá +15%,
 *  khách kém kiên nhẫn 10%, khách nào cũng hay đi nhóm (đơn kết hợp 2–3 ổ). Mỗi FAIR.every ngày một lần. s.fair = { last, count }. */
export const fairToday = (s) => s.fairDay === s.day;
export const fairAvailable = (s) => s.level >= FAIR.level && s.shop && !s.shift && !fairToday(s) && (!s.fairDay || s.day - s.fairDay >= FAIR.every);
export const nextFairDay = (s) => (!s.fairDay ? s.day : Math.max(s.day, s.fairDay + FAIR.every));
export function rentFair(s, ev) {
  if (s.shift) return { err: "shift-open" };
  if (s.level < FAIR.level || !s.shop) return { err: "locked" };
  if (fairToday(s)) return { err: "already" };
  if (!fairAvailable(s)) return { err: "too-soon" };
  if (s.money < FAIR.price) return { err: "money" };
  spend(s, FAIR.price);
  s.fairDay = s.day;
  s.fairCount = (s.fairCount || 0) + 1;
  s.drama.flags["hoi-cho"] = s.day;
  ev.push({ type: "fair", count: s.fairCount });
  return { ok: true };
}
/** Độ dài ca hôm nay (ms ca): hội chợ 4,5 phút, ngày thường 4 phút. */
export const shiftLenFor = (s) => (fairToday(s) ? FAIR.ms : 240000);
export { CHALLENGES, CHALLENGE_BY_ID, challengeToday, challengeWeek, activeChallenge, setChallenge, judgeChallenge, challengeMods } from "./challenge.js?v=b3";

// ---------- bánh hôm qua ----------
export const STALE_CRISP = 30, STALE_MAX = 70, STALE_PRICE = 10;
/** Sáng mai: bán nướng bơ đường (vào tủ giòn 30, ổ làm từ bánh này rẻ hơn, nướng lại tối đa 70) · cho đi (+1 danh tiếng) · bỏ (hao). */
export function staleChoice(s, choice, ev) {
  if (s.shift) return { err: "shift-open" };
  if (!s.stale?.n) return { err: "none" };
  if (!["sell", "give", "toss"].includes(choice)) return { err: "bad-choice" };
  s.stale.choice = choice;
  ev.push({ type: "stale", choice, n: s.stale.n, line: choice === "sell" ? freshLine(s, STALE.prep, {}) : "" });
  return { ok: true };
}

// ---------- thời tiết ----------
/** Thời tiết của ngày ca tới, tung một lần (từ ngày 5 có mưa 15%). */
export function rollWeather(s) {
  if (s.weather?.day === s.day) return s.weather;
  const kind = s.day >= 5 && next(s) < 0.15 ? "rain" : "clear";
  s.weather = { day: s.day, kind };
  if (kind === "rain") s.drama.flags.mua = s.day;
  return s.weather;
}
/** Hệ số khách ngày mưa: xe đẩy −35% (mái che −15%), tiệm −15%. */
export const rainMul = (s) => (s.weather?.kind !== "rain" || s.weather.day !== s.day ? 1 : s.shop || owns(s, "awning") ? 0.85 : 0.65);

// ---------- trang trí kéo thả (cảnh tiệm) ----------
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
function distToSegment(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)));
  return dist(p, [a[0] + t * dx, a[1] + t * dy]);
}
export const placeOf = (s, id) => s.placement?.[id] || DECOR[id]?.at || null;
/** null nếu hợp lệ; ngược lại mã lý do: zone | spot | path | fixed. `P` = toạ độ cảnh tiệm { door, queue }. */
export function placeError(id, x, y, P) {
  const it = DECOR[id];
  if (!it?.place) return "fixed";
  if (!Number.isFinite(x) || !Number.isFinite(y)) return "zone";
  const z = PLACE_ZONES[it.place];
  if (x < z.x[0] || x > z.x[1] || y < z.y[0] || y > z.y[1]) return "zone";
  if (it.place === "floor" && P) {
    if (P.queue.some((sp) => dist([x, y], sp) < SPOT_CLEARANCE)) return "spot";
    const path = [P.door, ...P.queue];
    for (let i = 0; i < path.length - 1; i++) if (distToSegment([x, y], path[i], path[i + 1]) < PATH_CLEARANCE) return "path";
  }
  return null;
}
export const PLACE_REASON = {
  zone: "Chỗ này không đặt được: đồ sàn để trên sàn trước quầy, đèn / lịch / biển treo trên tường.",
  spot: "Đặt đây khách hết chỗ đứng chờ.",
  path: "Đặt đây chắn lối từ cửa vào quầy.",
  fixed: "Món này gắn cố định.",
};
export function placeDecor(s, id, x, y, P, ev) {
  if (s.shift) return { err: "shift-open" };
  if (!s.shop) return { err: "needs" };
  if (!owns(s, id)) return { err: "not-owned" };
  const e = placeError(id, x, y, P);
  if (e) return { err: "place-" + e, detail: { reason: e } };
  s.placement = s.placement || {};
  s.placement[id] = [Math.round(x), Math.round(y)];
  ev.push({ type: "placed", id, at: s.placement[id] });
  return { ok: true };
}
export function resetDecor(s, id, ev) {
  if (s.shift) return { err: "shift-open" };
  if (!s.placement?.[id]) return { err: "none" };
  delete s.placement[id];
  ev.push({ type: "placed", id, at: DECOR[id]?.at });
  return { ok: true };
}

// ---------- đơn đặt trước ----------
const PRE_WHO = [
  { name: "Chị Thảo (Hoa Sen Xanh)", arch: "office", recipes: ["thap-cam", "cha-lua", "ga-xe", "chay"], label: "Họp sáng công ty" },
  { name: "Chú Tám (đội thợ)", arch: "worker", recipes: ["cha-lua", "thap-cam", "thit-nuong", "trung"], label: "Đội thợ hồ" },
  { name: "Cô giáo lớp 11A2", arch: "parent", recipes: ["pate-bo", "que", "cha-lua"], label: "Lớp đi dã ngoại" },
  { name: "Chị Hạnh (shipper)", arch: "shipper", recipes: ["cha-lua", "thit-nuong", "pate-bo", "heo-quay"], label: "Gom đơn app" },
  { name: "Anh Khoa (phòng khám)", arch: "office", recipes: ["ga-xe", "cha-lua", "xiu-mai"], label: "Giao ban phòng khám" },
];
let preId = 0;
/** Tạo đơn đặt trước từ mô tả (sự kiện fx.preorder hoặc thẻ Chuẩn bị ca). Cọc 30% nhận ngay. */
export function createPreorder(s, spec, ev, hooks = {}) {
  const menu = menuFor(s).map((r) => r.id);
  const fallback = menu.includes("cha-lua") ? "cha-lua" : menu[0] || "pate-bo";
  const parts = spec.mix && spec.mix.length ? spec.mix : [{ recipe: spec.recipe, n: spec.n || PREORDER.minN, quirks: spec.quirks || [] }];
  const items = [];
  for (const m of parts) {
    const rid = menu.includes(m.recipe) ? m.recipe : fallback;
    for (let i = 0; i < Math.max(1, Math.min(30, m.n || 1)) && items.length < PREORDER.maxN; i++) items.push(makeItem(rid, m.quirks || [], { bag: true }, s.house));
  }
  if (!items.length) return null;
  const discount = Math.max(0, Math.min(0.3, spec.discount || 0));
  const total = Math.round(items.reduce((a, it) => a + it.price, 0) * (1 - discount));
  const deposit = spec.noDeposit ? 0 : Math.round(total * PREORDER.deposit);
  s.money += deposit;
  s.stats.deposits = (s.stats.deposits || 0) + deposit;
  const pre = {
    id: (s.nextPre = (s.nextPre || 0) + 1), name: String(spec.name || "Khách đặt trước").slice(0, 40), arch: ARCHETYPES[spec.arch] ? spec.arch : "office",
    items, total, deposit, discount, tip: Math.max(0, spec.tip || 0), label: String(spec.label || "Đơn đặt trước").slice(0, 40),
    flagOk: spec.flagOk || null, laterOk: spec.laterOk || null, okStars: spec.okStars || 4, ...(spec.contract ? { contract: String(spec.contract) } : {}),
  };
  if (spec.when === "now" && s.shift) { pre.dueT = s.shift.t + (spec.dueMs ?? 90000); hooks.spawnPre?.(s, pre, ev); }
  else { pre.day = s.shift ? s.day + 1 : s.day; pre.dueMs = spec.dueMs ?? 60000; s.preorders = [...(s.preorders || []), pre].slice(-6); }
  ev.push({ type: "preorder", id: pre.id, name: pre.name, n: items.length, deposit, when: pre.dueT !== undefined ? "now" : "next", contract: !!spec.contract });
  return pre;
}
/** Đơn đặt trước mời nhận ở Chuẩn bị ca hôm nay (cấp 7, tối đa 2 mỗi ngày). Tung một lần mỗi ngày, lưu trong s.offers. */
export function preorderOffers(s) {
  if (s.level < PREORDER.level || !s.shop) return [];
  if (s.offers?.day === s.day) return s.offers.list;
  const menu = menuFor(s).map((r) => r.id);
  const list = [];
  const n = s.level >= 10 ? 2 : 1;
  for (let i = 0; i < n; i++) {
    const W = pick(s, PRE_WHO);
    const rs = W.recipes.filter((r) => menu.includes(r));
    if (!rs.length) continue;
    // M5: trước đây tới 30 ổ ở cấp 16+ ⇒ người chơi ẩu hỏng cả đơn (hao 300–500k một ca). Nay 6 → tối đa 6 + 0,8 × cấp.
    const size = Math.min(PREORDER.maxN, PREORDER.minN + int(s, Math.min(20, 3 + Math.floor(s.level * 0.8))));
    const mix = rs.length > 1 && size >= 10 ? [{ recipe: rs[0], n: Math.ceil(size * 0.6) }, { recipe: rs[1], n: Math.floor(size * 0.4) }] : [{ recipe: rs[0], n: size }];
    list.push({ name: W.name, arch: W.arch, label: W.label, mix, dueMs: 40000 + int(s, 6) * 20000, discount: size >= 10 ? 0.05 : 0, taken: false });
  }
  s.offers = { day: s.day, list };
  return list;
}
export function acceptOffer(s, idx, ev) {
  if (s.shift) return { err: "shift-open" };
  const list = preorderOffers(s);
  const o = list[idx];
  if (!o || o.taken) return { err: "bad-offer" };
  const todays = (s.preorders || []).filter((p) => p.day === s.day).length;
  if (todays >= PREORDER.perDay) return { err: "preorder-max" };
  o.taken = true;
  createPreorder(s, { ...o, when: "next" }, ev);
  // nhận ở Chuẩn bị ca ⇒ đơn cho ca hôm nay
  const p = s.preorders[s.preorders.length - 1];
  p.day = s.day;
  return { ok: true };
}
export const preorderValue = (p) => p.items.reduce((a, it) => a + it.price, 0);
export { RECIPE_NEEDS, OVENS, addMod, today };
