// A: Tiến trình + kinh tế M3 (GAME-DESIGN §5–§6, ECONOMY §4.3, §7–§11). Thuần, không DOM. Mọi thay đổi đi qua core/apply.js.
// Gồm: thuê mặt bằng lên quán (cấp 7), nhà cung cấp 2 Chú Hòa (cấp 9), phụ bàn Bông + Dì Năm rửa chén (thuê theo ngày, trả mỗi ca),
// sổ nợ "ghi sổ" (cấp 6), đơn đặt trước (cấp 7) + mâm cơm công ty (cấp 10, bày ×N), ca trưa dồn + shipper nhiều hộp (cấp 5),
// ghép bàn vỉa hè (cấp 5), nồi canh, cơm chiên từ cơm dư (cấp 2), nhiệm vụ ngày (cấp 2), quảng bá (cấp 11), trang trí kéo thả,
// hạng quán + nước mắm nhà pha (chỗ tiêu tiền cuối game), quạt máy, nồi cơm thứ hai, ca khuya kéo dài, quán nổi tiếng, thời tiết.
// Nối vào lõi bằng các móc một dòng "// A:" ở core/shift.js, core/tables.js, core/apply.js (onStart, onTick, beforeEnd, afterEnd, onNextDay, afterApply…).
// Cờ dùng chung (agent B đọc): ghi đúng kiểu `s.flags = s.flags || {}; s.flags[name] = value;` — danh sách ở DEV-NOTES "Cờ dùng chung".
import {
  STOCK, SHELF, DISHES, GEAR, STAFF, DECOR, TIERS, FISH_SAUCE, PROMOS, PROMO_UNLOCK, HOA, hoaPack, PREORDER, DEBT, LATE, FRIED_RICE,
  MISSIONS, MISSIONS_PER_DAY, APPEAL_CAP, PLACE_ZONES, SPOT_CLEARANCE, STREET_DECOR_AT, RENT, HELPER, WEATHER, LUNCH, SHIFTS, SERVICE,
  XP_SHARE, RICE, TABLE_GEAR, CAPACITY,
} from "../data/economy.js?v=c3";
import { ARCHETYPES } from "../data/customers.js?v=c3";
import * as LP from "../data/lines-progress.js?v=c3";
import { FLAG_DAYS } from "./flags.js?v=c3"; // B: hạn cờ Drama
import { pushReview, dayMoment } from "./reviews.js?v=c3"; // C: một sổ review, khoảnh khắc Nhật Ký
import { next, int, weighted } from "./rng.js?v=c3";
import { freshLine, fill } from "./text.js?v=c3";
import { gainXp, addNewDishes } from "./progress.js?v=c3";
import { pointsOf } from "./walker.js?v=c3";
import { ownerRoute, pathLen, alongDist, dist } from "./placements.js?v=c3";
import { stockUsed, capacity, addLot } from "./stock.js?v=c3";

const owns = (s, id) => !!s.owned?.[id];
export const setFlag = (s, name, value) => { s.flags = s.flags || {}; s.flags[name] = value; };
const ticketById = (s, tk) => s.shift?.tickets.find((x) => x.id === tk) || null;
const groupOf = (s, gid) => s.shift?.groups.find((g) => g.id === gid) || null;
const tableOf = (s, tid) => s.shift?.tables.find((t) => t.id === tid) || null;
/** Mã khách quen cho cờ ghiso-unpaid-<id>: tên bỏ dấu, nối gạch ("Chú Tư" ⇒ "chu-tu"). */
export const regularId = (name) => String(name || "khach").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "khach";

// ---------- trạng thái riêng (đọc bản lưu cũ an toàn) ----------
/** Khoá mặc định của phần A trong s (state.js khối "// --- A: progression ---" dùng cùng bảng này). */
export function freshA() {
  return {
    debts: [], debtNews: [], tabVisits: {}, orders: [], offers: null, nextOrder: 0, tier: 0, fishSauce: 0, staff: {}, promo: null,
    decor: {}, placement: {}, streetMemory: null, friedRice: 0, weather: null, lateShift: false,
  };
}
const obj = (v) => !!v && typeof v === "object" && !Array.isArray(v);
const arr = (v) => (Array.isArray(v) ? v : []);
const clampInt = (v, lo, hi, d) => (Number.isFinite(v) ? Math.floor(Math.min(hi, Math.max(lo, v))) : d);
/** Đọc phần A của bản lưu (thiếu / hỏng ⇒ mặc định). */
export function loadA(s, d) {
  const A = freshA();
  if (!obj(d)) return Object.assign(s, A);
  A.debts = arr(d.debts).filter((x) => obj(x) && typeof x.name === "string" && Number.isFinite(x.amount) && x.amount > 0).slice(-60)
    .map((x) => ({ id: regularId(x.id || x.name), name: x.name.slice(0, 40), amount: clampInt(x.amount, 1, 100000, 1), day: clampInt(x.day, 1, 1e9, s.day), ...(x.drama === true ? { drama: true } : {}) })); // S: nợ Drama
  A.debtNews = arr(d.debtNews).filter((x) => typeof x === "string").slice(-8);
  A.tabVisits = Object.fromEntries(Object.entries(obj(d.tabVisits) ? d.tabVisits : {}).filter(([, v]) => Number.isInteger(v)).slice(0, 80));
  A.orders = arr(d.orders).filter((o) => obj(o) && DISHES[o.dish] && Number.isInteger(o.n) && o.n > 0).slice(-6)
    .map((o) => ({ ...o, n: clampInt(o.n, 1, 60, 1), done: clampInt(o.done, 0, 60, 0), total: clampInt(o.total, 0, 1e6, 0), deposit: clampInt(o.deposit, 0, 1e6, 0) }));
  A.offers = obj(d.offers) && Number.isInteger(d.offers.day) && Array.isArray(d.offers.list) ? { day: d.offers.day, list: d.offers.list.filter((o) => obj(o) && DISHES[o.dish]).slice(0, 4) } : null;
  A.nextOrder = clampInt(d.nextOrder, 0, 1e9, 0);
  A.tier = clampInt(d.tier, 0, TIERS.length, 0);
  A.fishSauce = clampInt(d.fishSauce, 0, FISH_SAUCE.length, 0);
  A.staff = Object.fromEntries(Object.entries(obj(d.staff) ? d.staff : {}).filter(([k, v]) => STAFF[k] && Number.isInteger(v)));
  A.promo = obj(d.promo) && PROMOS[d.promo.kind] && Number.isInteger(d.promo.day) ? { day: d.promo.day, kind: d.promo.kind, roll: d.promo.roll ?? null } : null;
  A.decor = Object.fromEntries(Object.entries(obj(d.decor) ? d.decor : {}).filter(([k, v]) => DECOR[k] && v === true));
  A.placement = Object.fromEntries(Object.entries(obj(d.placement) ? d.placement : {}).filter(([k, v]) => DECOR[k] && Array.isArray(v) && v.length === 2 && v.every(Number.isFinite)));
  A.streetMemory = obj(d.streetMemory) ? { days: clampInt(d.streetMemory.days, 0, 1e6, 0), plates: clampInt(d.streetMemory.plates, 0, 1e9, 0), revenue: clampInt(d.streetMemory.revenue, -1e9, 1e9, 0), movedDay: clampInt(d.streetMemory.movedDay, 1, 1e9, 1), line: String(d.streetMemory.line || "").slice(0, 300) } : null;
  A.friedRice = clampInt(d.friedRice, 0, FRIED_RICE.max, 0);
  A.weather = obj(d.weather) && Number.isInteger(d.weather.day) ? { day: d.weather.day, kind: d.weather.kind === "rain" ? "rain" : "clear" } : null;
  A.lateShift = d.lateShift === true;
  // người theo dõi / độ hot: khối C (core/reviews.js loadSocial) là nguồn duy nhất; cờ dùng chung s.flags: chỉ core/state.js (khối B) đọc
  Object.assign(s, A);
  return s;
}

// ---------- giai đoạn, sức chứa, bàn ----------
export const isFamous = (s) => s.stage === "quan" && s.level >= 16 && owns(s, "signboard-3");
export const stageName = (s) => (isFamous(s) ? "Quán nổi tiếng" : s.stage === "quan" ? "Quán có mái" : "Quán vỉa hè");
export const waitMax = (s) => (s.stage === "street" ? SERVICE.waitMax.street : owns(s, "queue-bench") ? SERVICE.waitMax.famous : SERVICE.waitMax.quan);
export const capacityFor = (s) => (owns(s, "fridge") && s.stage === "quan" ? 200 : CAPACITY[s.stage === "quan" ? "quan" : "street"]);
/** Bàn của quán / vỉa hè có dùng được không (cấp + đồ đã mua). */
export function tableUnlocked(s, t) {
  const gear = TABLE_GEAR[t.id];
  if (s.stage === "street") return !gear || (owns(s, gear) && s.level >= (GEAR[gear]?.level || 1));
  return s.level >= (t.unlock || 1) && (!gear || owns(s, gear));
}
/** Cỡ nồi: nồi lớn 20 ở quán (nồi nhỏ 12 ở vỉa hè), nồi thứ hai +20. */
export const potSize = (s) => (s.stage === "quan" ? RICE.big.size : RICE.small.size) + (owns(s, "rice-cooker-2") ? RICE.big.size : 0);
/** Số dĩa bày một lượt cho mâm cơm (bày ×N): ô bày đôi 2, khay mâm 4. */
export const batchMax = (s) => (owns(s, "tray-4") ? 4 : owns(s, "double-slot") ? 2 : 1);

// ---------- ghép bàn (vỉa hè, cấp 5) ----------
export const JOIN_LEVEL = 5;
/** Bàn ghép cạnh bàn tid (cùng trống, sạch, đã mở) — chỉ vỉa hè, từ cấp 5. */
export function joinPartner(s, t) {
  if (!t || s.stage !== "street" || s.level < JOIN_LEVEL) return null;
  const tp = pointsOf(s).tables.find((x) => x.id === t.id);
  const pid = tp?.joinWith;
  const p = pid ? tableOf(s, pid) : null;
  return p && p.gid === null && p.state !== "dirty" && !p.joinOf ? p : null;
}
/** Nhóm đông hơn bàn: được ngồi nếu ghép được bàn bên cạnh. */
export const canJoin = (s, g, t) => !!g && !!t && g.size > t.seats && g.size <= t.seats + 2 && !!joinPartner(s, t);
/** Ghép: bàn bên cạnh nhận cùng nhóm (t.joinOf = bàn chính). */
export function joinTables(s, g, t, ev = []) {
  const p = joinPartner(s, t);
  if (!p) return false;
  p.gid = g.id; p.joinOf = t.id; t.joined = p.id;
  ev.push({ type: "joined", tid: t.id, with: p.id });
  return true;
}
/** Chỗ ngồi của cả nhóm (bàn chính + bàn ghép), cho vẽ + đường đi. */
export function seatSpotsFor(s, g) {
  const P = pointsOf(s);
  const tp = P.tables.find((x) => x.id === g.table);
  if (!tp) return [];
  const t = tableOf(s, g.table);
  const pp = t?.joined ? P.tables.find((x) => x.id === t.joined) : null;
  return [...tp.seatSpots, ...(pp ? pp.seatSpots : [])];
}
/** Khi nhóm rời bàn ghép: bàn bên cạnh cũng dơ, chia dĩa. */
export function leaveJoined(s, t, sh) {
  if (!t?.joined) return;
  const p = tableOf(s, t.joined);
  t.joined = null;
  if (!p) return;
  const extra = Math.max(0, (t.plates || 0) - t.seats);
  t.plates -= extra;
  p.gid = null; p.joinOf = null; p.state = "dirty"; p.dirtyT = sh.t; p.plates = extra;
}
/** Số ghế tối đa một nhóm (để xếp lịch): ghép bàn ⇒ 4. */
export function maxGroupSeats(s, tables) {
  const m = Math.max(...tables.map((t) => t.seats));
  if (s.stage === "street" && s.level >= JOIN_LEVEL && tables.some((t) => pointsOf(s).tables.find((x) => x.id === t.id)?.joinWith && tables.some((u) => u.id === pointsOf(s).tables.find((x) => x.id === t.id).joinWith))) return Math.max(m, 4);
  return m;
}

// ---------- thời tiết, khách thêm, kiên nhẫn ----------
export function rollWeather(s) {
  if (s.weather?.day === s.day) return s.weather;
  const kind = s.day >= WEATHER.fromDay && next(s) < WEATHER.rain ? "rain" : "clear";
  s.weather = { day: s.day, kind };
  setFlag(s, "rain-today", kind === "rain" ? s.day : 0);
  return s.weather;
}
export const rainToday = (s) => s.weather?.day === s.day && s.weather.kind === "rain";
export const rainMul = (s) => (!rainToday(s) ? 1 : s.stage === "quan" ? WEATHER.quan : owns(s, "awning") ? WEATHER.awning : WEATHER.street);
/** Điểm hấp dẫn: trang trí + bảng hiệu, trần 3 (4 từ cấp 19). */
export function appeal(s) {
  let a = 0;
  for (const id of Object.keys(s.decor || {})) a += DECOR[id]?.appeal || 0;
  if (owns(s, "signboard-2")) a += 0.5;
  if (owns(s, "signboard-3")) a += 1;
  return Math.min(APPEAL_CAP(s.level), a);
}
/** Khách thêm mỗi ca (ngoài lịch gốc): hấp dẫn, hạng quán, đèn, neon, TV, ca khuya đông (cấp 12), quán nổi tiếng, quảng bá. */
export function extraGuests(s, kind) {
  let n = Math.floor(appeal(s)) + (s.tier || 0);
  if (kind === "toi") {
    if (s.decor?.["fairy-lights"]) n += 1;
    if (s.decor?.["neon-sign"]) n += 2;
    if (s.level >= 12) n += 2;
  }
  if (isFamous(s)) n += 2;
  if (s.stage === "quan") n += kind === "trua" ? 2 : 3; // S (M5): quán có mái đông hơn vỉa hè (khách cơ bản tăng chậm lại theo cấp)
  const pr = s.promo?.day === s.day ? s.promo : null;
  if (pr?.kind === "check-in") n += PROMOS["check-in"].guests;
  if (pr?.kind === "livestream" && pr.roll === "viral") n += 4;
  if (pr?.kind === "livestream" && pr.roll === "ok") n += 1;
  return n;
}
/** Hệ số kiên nhẫn: hạng quán +2%/bậc, quạt tường +4%, ghế chờ +10%. */
export const patienceMul = (s) => 1 + 0.02 * (s.tier || 0) + (s.decor?.["wall-fan"] ? 0.04 : 0) + (owns(s, "queue-bench") ? 0.1 : 0);

/** Sửa lịch khách lúc mở ca: mưa bớt khách, khách thêm, ca trưa dồn 45 giây, shipper trưa nhiều hộp, ca khuya kéo dài. */
export function adjustSchedule(s, sh) {
  if (sh.tutorial) return;
  const kind = sh.kind;
  const sched = sh.schedule;
  // ca trưa: dân văn phòng dồn vào khúc giữa (LUNCH.rush)
  if (kind === "trua") for (const g of sched) { const f = g.at / sh.len; g.at = Math.round(sh.len * (LUNCH.rush[0] + (LUNCH.rush[1] - LUNCH.rush[0]) * Math.min(1, f / 0.77))); }
  // mưa
  const mul = rainMul(s);
  if (mul < 1) { // chỉ bớt khách thường (không nhãn)
    const plain = sched.filter((g) => !g.tag);
    const drop = Math.floor(plain.length * (1 - mul));
    for (let i = 0; i < drop && plain.length > 1; i++) sched.splice(sched.indexOf(plain.splice(int(s, plain.length), 1)[0]), 1);
  }
  // khách thêm
  const roles = Object.keys(ARCHETYPES).filter((a) => { const A = ARCHETYPES[a]; return A.unlock <= s.level && (A.minRep || 0) <= s.rep && !A.takeaway; });
  const add = (arch, frac, size = 1) => { const A = ARCHETYPES[arch]; const rs = [arch]; for (let i = 1; i < size; i++) rs.push(A.mates.length ? A.mates[int(s, A.mates.length)] : arch); sched.push({ at: Math.round(sh.len * frac), arch, roles: rs, patienceMul: 1, tag: "extra" }); };
  for (let i = 0, n = extraGuests(s, kind); i < n && roles.length; i++) {
    const a = weighted(s, roles.map((r) => ({ r, w: ARCHETYPES[r].shifts[kind] || 0.1 }))).r;
    add(a, kind === "trua" ? LUNCH.rush[0] + next(s) * (LUNCH.rush[1] - LUNCH.rush[0]) : 0.05 + next(s) * 0.85);
  }
  if (s.promo?.day === s.day && s.promo.kind === "to-roi" && kind === "toi") for (let i = 0; i < PROMOS["to-roi"].guests.student; i += 2) add("student", 0.05 + next(s) * 0.5, 2);
  // shipper ca trưa lấy 1–3 hộp (từ cấp 5)
  if (kind === "trua") for (const g of sched) if (ARCHETYPES[g.arch]?.takeaway) { const n = LUNCH.shipperBoxes[0] + int(s, LUNCH.shipperBoxes[1] - LUNCH.shipperBoxes[0] + 1); g.roles = Array.from({ length: n }, () => g.arch); }
  // ca khuya kéo dài (cấp 17, tuỳ chọn): ca tối dài thêm, khuya +25% khách
  if (kind === "toi" && s.lateShift && s.level >= LATE.level) {
    const oldLen = sh.len;
    sh.len += LATE.extraMs; sh.late = true;
    const khuya = sched.filter((g) => g.at >= oldLen * 0.62).length;
    for (let i = 0; i < Math.max(2, Math.round(khuya * (LATE.guestMul - 1) + 2)); i++) add(weighted(s, roles.map((r) => ({ r, w: (ARCHETYPES[r].shifts.toi || 0.1) * (ARCHETYPES[r].khuya || 1) }))).r, (oldLen + next(s) * LATE.extraMs * 0.9) / sh.len);
  }
  const pm = patienceMul(s);
  for (const g of sched) g.patienceMul = (g.patienceMul || 1) * pm;
  sched.sort((a, b) => a.at - b.at);
}

// ---------- thuê mặt bằng (lên quán) ----------
export function rentQuan(s, ev = []) {
  if (s.shift) return { err: "in-shift" };
  if (s.stage === "quan") return { err: "owned" };
  if (s.level < RENT.level) return { err: "locked" };
  if (s.money < RENT.price) return { err: "money" };
  s.money -= RENT.price; s.stats.spentGear += RENT.price;
  const days = Math.max(1, s.day - 1);
  const line = freshLine(s, LP.STREET_MEMORY, { days, plates: s.stats.plates });
  s.streetMemory = { days, plates: s.stats.plates, revenue: Math.round(s.stats.revenue), movedDay: s.day, line };
  s.stage = "quan";
  s.plates = Math.max(s.plates, RENT.plates);
  setFlag(s, "quan-moved", s.day);
  dayMoment(s, { kind: "moved", who: "", line }); // C: Nhật Ký ngày lên quán
  ev.push({ type: "rented", line: freshLine(s, LP.RENT_LINES, {}), memory: line });
  return { ok: true };
}

// ---------- mua đồ (bản mở rộng của stock.buyGear: lọc vỉa hè / quán, đồ cần đồ) ----------
export function gearBlock(s, id) {
  const G = GEAR[id];
  if (!G) return "bad-gear";
  if (s.level < G.level) return "locked";
  if (G.street && s.stage !== "street") return "not-needed";
  if (G.quan && s.stage !== "quan") return "needs-quan";
  if (G.needs && !owns(s, G.needs)) return "needs";
  if ((id === "q-table-4" || id === "q-table-5") && s.stage !== "quan") return "needs-quan";
  return null;
}

// ---------- nhà cung cấp 2: Chú Hòa (cấp 9, chỉ trước ca) ----------
export const hoaOpen = (s) => s.level >= HOA.level;
export const canBuyHoa = (s, id) => hoaOpen(s) && HOA.ids.includes(id) && !!STOCK[id] && STOCK[id].buy !== false && (STOCK[id].unlock || 1) <= s.level && !!hoaPack(id);
export function restockHoa(s, id, ev = []) {
  if (s.shift) return { err: "in-shift" };
  if (!canBuyHoa(s, id)) return { err: "locked" };
  const [n, price] = hoaPack(id);
  if (s.money < price) return { err: "money" };
  if (STOCK[id].cap && stockUsed(s) + n > capacity(s)) return { err: "capacity" };
  s.money -= price; s.stock[id] = (s.stock[id] || 0) + n; s.stats.spentStock += price;
  addLot(s, id, n);
  ev.push({ type: "restocked", id, n, price, express: false, by: "hoa" });
  return { ok: true };
}

// ---------- nhân viên theo ngày ----------
export const staffToday = (s, id) => s.staff?.[id] === s.day;
export function hireStaff(s, id, on, ev = []) {
  const S = STAFF[id];
  if (!S) return { err: "bad-staff" };
  if (s.shift) return { err: "in-shift" };
  if (s.level < S.level) return { err: "locked" };
  s.staff = s.staff || {};
  if (on) { if (s.money < S.price) return { err: "money" }; s.staff[id] = s.day; }
  else delete s.staff[id];
  if (id === "bong") setFlag(s, "helper-bong", on ? s.day : 0);
  ev.push({ type: "staff", id, on: !!on, name: S.name });
  return { ok: true };
}

// ---------- trang trí ----------
export function buyDecor(s, id, ev = []) {
  const D = DECOR[id];
  if (!D || D.event) return { err: "bad-item" };
  if (s.shift) return { err: "in-shift" };
  if (s.level < D.level) return { err: "locked" };
  if (s.decor?.[id]) return { err: "owned" };
  if (s.money < D.price) return { err: "money" };
  s.money -= D.price; s.stats.spentGear += D.price;
  s.decor = { ...(s.decor || {}), [id]: true };
  ev.push({ type: "bought", id, name: D.name, price: D.price, line: freshLine(s, LP.UPGRADE_LINES, { item: D.name }) });
  return { ok: true };
}
/** Chỗ đặt mặc định (manifest placements.<id>.at ở quán; vỉa hè xếp theo STREET_DECOR_AT). */
export function decorAt(s, id, placements = {}) {
  if (s.stage === "quan") return s.placement?.[id] || (Array.isArray(placements[id]?.at) ? placements[id].at : null) || STREET_DECOR_AT[Object.keys(DECOR).indexOf(id) % STREET_DECOR_AT.length];
  return STREET_DECOR_AT[Object.keys(DECOR).indexOf(id) % STREET_DECOR_AT.length];
}
function distSeg(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)));
  return dist(p, [a[0] + t * dx, a[1] + t * dy]);
}
/** null nếu đặt được; ngược lại: zone | table | spot | path | fixed. */
export function placeError(s, id, x, y) {
  const D = DECOR[id];
  if (!D?.place) return "fixed";
  if (!Number.isFinite(x) || !Number.isFinite(y)) return "zone";
  const z = PLACE_ZONES[D.place];
  if (x < z.x[0] || x > z.x[1] || y < z.y[0] || y > z.y[1]) return "zone";
  if (D.place === "floor") {
    const P = pointsOf({ ...s, stage: "quan" });
    const p = [x, y];
    for (const t of P.tables) {
      if (dist(p, t.at) < SPOT_CLEARANCE * 1.2) return "table";
      if (t.seatSpots.some((sp) => dist(p, sp.at) < SPOT_CLEARANCE)) return "table";
      if (dist(p, t.servePoint) < SPOT_CLEARANCE) return "path";
    }
    if ([...P.waitSpots, ...P.queueSpots, P.entry].some((sp) => dist(p, sp) < SPOT_CLEARANCE)) return "spot";
    const path = P.aisle;
    for (let i = 0; i < path.length - 1; i++) if (distSeg(p, path[i], path[i + 1]) < SPOT_CLEARANCE * 0.8) return "path";
    for (let i = 0; i < P.exitPath.length - 1; i++) if (distSeg(p, P.exitPath[i], P.exitPath[i + 1]) < SPOT_CLEARANCE * 0.8) return "path";
  }
  return null;
}
export const PLACE_REASON = {
  zone: "Chỗ này không đặt được: đồ sàn để trên sàn, đèn / lịch / quạt treo trên tường.",
  table: "Đặt đây đụng bàn ghế của khách.",
  spot: "Đặt đây khách hết chỗ đứng chờ.",
  path: "Đặt đây chắn lối đi của cô chủ và khách.",
  fixed: "Món này gắn cố định.",
};
export function placeDecor(s, id, x, y, ev = []) {
  if (s.shift) return { err: "in-shift" };
  if (s.stage !== "quan") return { err: "needs-quan" };
  if (!s.decor?.[id]) return { err: "not-owned" };
  const e = placeError(s, id, x, y);
  if (e) return { err: "place-" + e, detail: { reason: e } };
  s.placement = { ...(s.placement || {}), [id]: [Math.round(x), Math.round(y)] };
  ev.push({ type: "decorPlaced", id, at: s.placement[id] });
  return { ok: true };
}

// ---------- hạng quán + nước mắm nhà pha + quảng bá ----------
export function buyTier(s, ev = []) {
  if (s.shift) return { err: "in-shift" };
  const T = TIERS[s.tier || 0];
  if (!T) return { err: "max" };
  if (s.stage !== "quan") return { err: "needs-quan" };
  if (T.level > s.level) return { err: "locked" };
  if (s.money < T.price) return { err: "money" };
  s.money -= T.price; s.stats.spentGear += T.price;
  s.tier = (s.tier || 0) + 1;
  ev.push({ type: "tier", tier: s.tier, price: T.price, line: freshLine(s, LP.TIER_LINES, { n: s.tier }) });
  return { ok: true };
}
export function buyFishSauce(s, ev = []) {
  if (s.shift) return { err: "in-shift" };
  const F = FISH_SAUCE[s.fishSauce || 0];
  if (!F) return { err: "max" };
  if (F.level > s.level) return { err: "locked" };
  if (s.money < F.price) return { err: "money" };
  s.money -= F.price; s.stats.spentGear += F.price;
  s.fishSauce = (s.fishSauce || 0) + 1;
  ev.push({ type: "fishSauce", tier: s.fishSauce, price: F.price });
  return { ok: true };
}
export function promo(s, kind, ev = []) {
  const P = PROMOS[kind];
  if (!P) return { err: "bad-promo" };
  if (s.shift) return { err: "in-shift" };
  if (s.level < PROMO_UNLOCK) return { err: "locked" };
  if (s.promo?.day === s.day) return { err: "once-per-day" };
  if (s.money < P.price) return { err: "money" };
  s.money -= P.price;
  let roll = null;
  if (P.roll) { const r = next(s); roll = r < 0.3 ? "viral" : r < 0.8 ? "ok" : "flop"; }
  s.promo = { day: s.day, kind, roll };
  // cùng một sổ với review (C) và Drama (B): s.followers, s.hype (độ hot 0–20)
  s.followers = (s.followers || 0) + (P.followers || 0) + (roll === "viral" ? 60 : roll === "ok" ? 15 : 0);
  s.hype = Math.min(20, (s.hype || 0) + (P.buzz || 0) + (roll === "viral" ? 2 : 0));
  ev.push({ type: "promoted", kind, price: P.price, roll, line: freshLine(s, LP.PROMO_LINES[roll || kind] || LP.PROMO_LINES.ok, {}) });
  return { ok: true };
}

// ---------- đơn đặt trước (cấp 7) + mâm cơm công ty (cấp 10) ----------
const PRE_WHO = [
  { name: "Chị Thảo (văn phòng)", arch: "office", label: "Cơm trưa phòng kế toán" },
  { name: "Chú Tư (đội thợ)", arch: "worker", label: "Đội thợ hồ đặt cơm" },
  { name: "Điều dưỡng Hạnh", arch: "nurse", label: "Ca trực bệnh viện" },
  { name: "Anh Khoa (shop điện thoại)", arch: "office", label: "Cơm cho nhân viên shop" },
];
const CATER_WHO = [
  { name: "Công ty may Phước Thịnh", arch: "office", label: "Mâm cơm công ty" },
  { name: "Văn phòng luật sư Minh An", arch: "office", label: "Mâm cơm họp tháng" },
  { name: "Xưởng in Sao Mai", arch: "worker", label: "Cơm cho thợ xưởng" },
  { name: "Trường mầm non Hoa Cau", arch: "nurse", label: "Cơm cho cô giáo" },
];
const orderMenu = (s) => (s.menu || []).filter((id) => { const d = DISHES[id]; return d && !d.rescue && !d.special && d.level <= s.level && (d.needs || []).every((k) => owns(s, k)); });
export const ordersOpen = (s) => s.stage === "quan" && s.level >= PREORDER.level;
/** Đơn mời nhận hôm nay (tung một lần mỗi ngày, lưu trong s.offers). */
export function orderOffers(s) {
  if (!ordersOpen(s)) return [];
  if (s.offers?.day === s.day) return s.offers.list;
  const menu = orderMenu(s);
  const list = [];
  if (menu.length) {
    const W = PRE_WHO[int(s, PRE_WHO.length)];
    list.push({ kind: "pre", name: W.name, arch: W.arch, label: W.label, dish: menu[int(s, menu.length)], n: 3 + int(s, 4), dueFrac: 0.45 + int(s, 4) * 0.08, taken: false });
    if (s.level >= PREORDER.cateringLevel) {
      const C = CATER_WHO[int(s, CATER_WHO.length)];
      const n = Math.min(24, 8 + int(s, Math.min(10, 3 + s.level - PREORDER.cateringLevel)));
      list.push({ kind: "catering", name: C.name, arch: C.arch, label: C.label, dish: menu[int(s, menu.length)], n, dueFrac: 0.55 + int(s, 3) * 0.08, taken: false });
    }
  }
  s.offers = { day: s.day, list };
  return list;
}
export const orderUnit = (s, dish) => (DISHES[dish]?.price || 0) + (s.fishSauce || 0);
export function acceptOrder(s, idx, ev = []) {
  if (s.shift) return { err: "in-shift" };
  if (s.shiftIdx > 0 || s.dayDone) return { err: "day-started" };
  const list = orderOffers(s);
  const o = list[idx];
  if (!o || o.taken) return { err: "bad-offer" };
  if ((s.orders || []).filter((x) => x.day === s.day).length >= PREORDER.perDay) return { err: "preorder-max" };
  o.taken = true;
  const disc = o.n >= 10 ? 0.07 : 0;
  const total = Math.round(o.n * orderUnit(s, o.dish) * (1 - disc));
  const deposit = Math.round(total * PREORDER.deposit);
  s.money += deposit;
  const order = { id: (s.nextOrder = (s.nextOrder || 0) + 1), kind: o.kind, name: o.name, arch: o.arch, label: o.label, dish: o.dish, n: o.n, done: 0, total, deposit, day: s.day, shift: s.plan[0] || "toi", dueFrac: o.dueFrac, status: "waiting" };
  s.orders = [...(s.orders || []).filter((x) => x.day >= s.day), order].slice(-6);
  ev.push({ type: "orderTaken", id: order.id, kind: o.kind, name: o.name, n: o.n, deposit });
  return { ok: true };
}
/** Mở ca: đơn của ca này thành phiếu "mâm" trên thanh phiếu (bày ×N, hộp + bịch nước mắm). */
function openOrders(s, sh, ev) {
  let any = false;
  for (const o of s.orders || []) {
    if (o.day !== s.day || o.shift !== sh.kind || o.status !== "waiting") continue;
    o.status = "open"; o.dueT = Math.round(sh.len * o.dueFrac);
    const t = { id: sh.nextTk++, gid: null, tid: null, mi: 0, name: o.kind === "catering" ? "Mâm cơm" : "Đặt trước", role: o.arch, dish: o.dish, quirks: [], takeaway: true, status: "open", orderT: 0, nhuCu: false, catering: o.id, n: o.n - o.done, line: `${o.name}: ${o.n} phần ${DISHES[o.dish].name.toLocaleLowerCase("vi")}` };
    sh.tickets.push(t);
    any = true;
    ev.push({ type: "orderOpen", id: o.id, n: t.n, dueT: o.dueT });
  }
  if (any) setFlag(s, "catering-active", s.day);
}
/**
 * Gộp B → A: đơn đặt trước của Drama (fx.preorder, vd X03 mâm cơm 40 phần, D06 xưởng, K07 lớp liên hoan) thành đơn mâm thật của A
 * (phiếu "Mâm cơm ×N", bày ×N, giờ hẹn, trễ trừ tiền) khi quán đã mở đơn đặt (ở quán, cấp 7+). Cọc đã vào két lúc chọn sự kiện.
 * Giao đủ đạt sao ⇒ cờ / sự kiện nối tiếp / tip của Drama (p.flagOk, p.laterOk, p.tip). Trả true nếu đã nhận thành đơn A.
 */
export function openDramaOrder(s, p, ev = []) {
  const sh = s.shift;
  if (!sh || !ordersOpen(s) || !(p.n >= 8)) return false;
  const menu = orderMenu(s);
  if (!menu.length) return false;
  const n = Math.min(40, Math.round(p.n));
  const dish = menu.includes("com-suon") ? "com-suon" : menu[int(s, menu.length)];
  const total = Math.round(n * orderUnit(s, dish) * (n >= 10 ? 0.93 : 1));
  const deposit = Math.round(total * PREORDER.deposit);
  const W = ARCHETYPES[p.arch] ? p.arch : "office";
  const order = { id: (s.nextOrder = (s.nextOrder || 0) + 1), kind: "catering", name: p.label || "Khách đặt trước", arch: W, label: p.label || "", dish, n, done: 0, total, deposit, day: s.day, shift: sh.kind,
    dueFrac: Math.min(0.85, Math.max(0.4, (p.at ?? 0.2) + 0.35)), status: "open", drama: { id: p.id, flagOk: p.flagOk || null, laterOk: p.laterOk || null, tip: p.tip || 0, okStars: p.okStars ?? 4 } };
  order.dueT = Math.round(sh.len * order.dueFrac);
  s.orders = [...(s.orders || []).filter((x) => x.day >= s.day), order].slice(-6);
  const t = { id: sh.nextTk++, gid: null, tid: null, mi: 0, name: "Mâm cơm", role: W, dish, quirks: [], takeaway: true, status: "open", orderT: 0, nhuCu: false, catering: order.id, n, line: `${order.name}: ${n} phần ${DISHES[dish].name.toLocaleLowerCase("vi")}` };
  sh.tickets.push(t);
  setFlag(s, "catering-active", s.day);
  ev.push({ type: "orderOpen", id: order.id, n, dueT: order.dueT });
  return true;
}
/** Đơn của Drama giao xong đạt sao ⇒ hậu quả của Drama (cờ còn hạn, sự kiện nối tiếp, tip). Chỉ ghi dữ liệu, không gọi core/drama.js. */
function dramaOrderDone(s, o, stars, ev) {
  const W = o.drama;
  if (!W || stars < W.okStars || !s.drama) return;
  if (W.tip) { s.money += W.tip; if (s.shift) s.shift.stats.revenue += W.tip; }
  if (W.flagOk) s.drama.flags[W.flagOk] = Math.max(1, s.day) + FLAG_DAYS + 2;
  if (W.laterOk?.id) s.drama.queue.push({ id: W.laterOk.id, day: Math.max(1, s.day) + (W.laterOk.days ?? 1), from: "dr:" + W.id });
  ev.push({ type: "say", text: `${o.label || o.name}: giao trọn, khách hài lòng${W.tip ? ` (+${W.tip}k tip)` : ""}.`, kind: "good" });
}
export const isCateringSlot = (s) => { const sl = s.shift?.slots[s.shift.sel]; return !!(sl && sl.tk !== null && ticketById(s, sl.tk)?.catering); };
const TOGGLE = { bi: "bi", cha: "cha", doChua: "doChua", duaLeo: "duaLeo", ngo: "ngo", hanhPhi: "hanhPhi" };
/** Bày ×N: mỗi chạm áp cho cả hàng dĩa của mâm (ô bày đôi 2, khay 4). layerFn = plate.layer. */
export function batchLayer(s, id, ev, layerFn) {
  const sh = s.shift, slot = sh.slots[sh.sel];
  const t = slot.tk !== null ? ticketById(s, slot.tk) : null;
  const tableBatch = !t?.catering && slot.batchTks?.length > 0; // S (M5): bày ×N cho bàn cùng món (core/extras.js batchPin)
  if (!t?.catering && !tableBatch) return layerFn(s, id, ev);
  if (!slot.plate && (id === "hop" || id === "dia")) {
    const kind = t.catering ? "hop" : id;
    const want = t.catering ? Math.max(1, Math.min(batchMax(s), t.n)) : 1 + slot.batchTks.length;
    const r = layerFn(s, kind, ev);
    if (r.err) return r;
    const main = slot.plate;
    slot.batch = [];
    for (let i = 1; i < want; i++) { slot.plate = null; const r2 = layerFn(s, kind, []); if (r2.err) break; if (tableBatch) slot.plate.tk = slot.batchTks[i - 1]; slot.batch.push(slot.plate); }
    slot.plate = main;
    return { ok: true, batch: 1 + slot.batch.length };
  }
  const main = slot.plate;
  const before = main && TOGGLE[id] ? !!main[TOGGLE[id]] : null;
  const r = layerFn(s, id, ev);
  let any = !r.err;
  for (let i = 0; i < (slot.batch || []).length; i++) {
    const p = slot.batch[i];
    if (before !== null && !!p[TOGGLE[id]] !== before) continue; // dĩa lệch nhịp (thiếu hàng lúc trước) không bị bật / tắt ngược
    slot.plate = p;
    const r2 = layerFn(s, id, []);
    if (!r2.err) any = true;
    slot.batch[i] = slot.plate;
  }
  slot.plate = main;
  return any ? { ok: true } : r;
}
export function batchUndo(s, ev, undoFn) {
  const sh = s.shift, slot = sh.slots[sh.sel];
  const r = undoFn(s, ev);
  if (!slot.batch?.length) return r;
  const main = slot.plate;
  for (let i = 0; i < slot.batch.length; i++) { slot.plate = slot.batch[i]; undoFn(s, []); slot.batch[i] = slot.plate; }
  slot.batch = slot.batch.filter(Boolean);
  slot.plate = main;
  if (!main) { slot.plate = slot.batch.shift() || null; }
  return r;
}
export function batchDiscard(s, ev, discardFn) {
  const sh = s.shift, slot = sh.slots[sh.sel];
  const extra = slot.batch || [];
  const r = discardFn(s, ev);
  for (const p of extra) { slot.plate = p; discardFn(s, []); }
  slot.plate = null; slot.batch = null;
  return r;
}
const plateCostOf = (used) => Object.entries(used || {}).reduce((a, [id, n]) => a + (id === "com" ? STOCK["gao-tam"].cost : id === "moHanh" ? 0.5 : STOCK[id]?.cost || 0) * n, 0);
/** Giao một lượt mâm (1–4 hộp) vào đơn; đủ phần ⇒ khách tới lấy, trả phần còn lại (trừ trễ). */
export function serveCatering(s, ev, judgeFn) {
  const sh = s.shift, slot = sh.slots[sh.sel];
  const t = ticketById(s, slot.tk);
  const o = (s.orders || []).find((x) => x.id === t?.catering);
  if (!t || !o) return { err: "bad-ticket" };
  if (!slot.plate) return { err: "need-container" };
  const plates = [slot.plate, ...(slot.batch || [])].slice(0, Math.max(1, t.n));
  let good = 0;
  for (const p of plates) {
    const j = judgeFn(p, t);
    if (!j.mistakes.length) good++;
    sh.stats.cogs += plateCostOf(p.used);
    sh.stats.plates++;
    const xp = Math.floor((DISHES[t.dish]?.xp || 0) * (o.done < 4 ? 1 : 0.5) * (j.mistakes.length ? XP_SHARE[3] : 1));
    sh.stats.xp += xp; gainXp(s, xp, ev);
    o.done++;
  }
  o.bad = (o.bad || 0) + (plates.length - good);
  t.n = Math.max(0, o.n - o.done);
  slot.plate = null; slot.batch = null;
  ev.push({ type: "cateringBatch", id: o.id, n: plates.length, done: o.done, total: o.n });
  if (t.n <= 0) { t.status = "served"; slot.tk = null; finishOrder(s, o, ev); }
  return { ok: true };
}
function finishOrder(s, o, ev, partial = false) {
  const sh = s.shift;
  const lateMs = Math.max(0, sh.t - (o.dueT ?? sh.t));
  let pay, stars, late = lateMs > 0 || partial;
  if (partial) {
    pay = Math.max(0, Math.round((o.done / o.n) * o.total * PREORDER.partialPay) - o.deposit);
    stars = o.done ? 2 : 1;
  } else {
    const cut = lateMs <= 0 ? 0 : lateMs <= PREORDER.lateSmall ? PREORDER.lateSmallCut : PREORDER.lateBigCut;
    pay = Math.max(0, Math.round(o.total * (1 - cut)) - o.deposit);
    stars = lateMs <= 0 ? (o.bad ? 4 : 5) : lateMs <= PREORDER.lateSmall ? 3 : 2;
  }
  if (!partial || o.done) { s.money += pay; sh.stats.revenue += pay + o.deposit; }
  else { const back = Math.min(s.money, o.deposit); s.money -= back; sh.stats.refunds += back; }
  o.status = late ? "late" : "done"; o.paid = pay;
  const lines = late ? LP.CATERING_LATE_REVIEW : LP.CATERING_ONTIME_REVIEW;
  addReviewA(s, { name: o.name, role: o.arch, stars, line: freshLine(s, lines, { n: o.n, dish: DISHES[o.dish].name.toLocaleLowerCase("vi") }), mistake: null, mech: late ? "catering-late" : "catering-ontime" });
  if (late) setFlag(s, "catering-late", s.day);
  if (!(s.orders || []).some((x) => x.day === s.day && (x.status === "open" || x.status === "waiting"))) setFlag(s, "catering-active", 0);
  sh.a.ordersDone = (sh.a.ordersDone || 0) + (late ? 0 : 1);
  ev.push({ type: "orderDone", id: o.id, kind: o.kind, late, partial, pay, stars, line: freshLine(s, late ? LP.CATERING_PICKUP_LATE : LP.CATERING_PICKUP_ONTIME, { name: o.name, n: o.n }) });
  dramaOrderDone(s, o, stars, ev); // B: đơn đặt từ sự kiện
  if (!late) { missionBump(s, "preorder", 1, ev); s.stats.ordersDone = (s.stats.ordersDone || 0) + 1; }
  dayMoment(s, { who: "", kind: late ? "catering-late" : "catering-done", line: late ? `${o.name}: ${o.done}/${o.n} phần, giao trễ.` : `Giao trọn ${o.n} phần cho ${o.name}, đúng giờ.` }); // C: Nhật Ký
}
/** Review riêng của phần A (khách đặt mâm, khách trả nợ): cùng sổ review với lõi. */
export function addReviewA(s, r) {
  // một sổ review cho cả quán (C): lý do, người theo dõi, đánh giá trung bình 20 review, cờ 1 sao
  const reason = r.mech === "catering-late" ? "slow" : r.mech === "catering-ontime" ? "takeaway" : undefined;
  return pushReview(s, reason ? { ...r, reason, takeaway: true } : r);
}

// ---------- sổ nợ (ghi sổ, cấp 6) ----------
export const debtTotal = (s) => (s.debts || []).reduce((a, d) => a + d.amount, 0);
export const debtTabs = (s, id) => (s.debts || []).filter((d) => !id || d.id === id).length;
export function syncDebtFlags(s, touched = []) { // S: xuất cho nợ Drama (core/extras.js dramaDebt)
  setFlag(s, "ghiso-open", (s.debts || []).length);
  const ids = new Set([...touched, ...(s.debts || []).map((d) => d.id)]);
  for (const id of ids) setFlag(s, "ghiso-unpaid-" + id, (s.debts || []).filter((d) => d.id === id).reduce((a, d) => a + d.amount, 0));
}
/** Khách được ghi sổ: khách quen (vai regular) hoặc thợ / tài xế quen (≥ 3 lần từ 4 sao); trong hạn mức. */
export function ghiSoEligible(s, g, amount = 0) {
  if (s.level < DEBT.level || !g || g.takeaway) return false;
  const m = g.members[0];
  const known = m.role === "regular" || ((m.role === "worker" || m.role === "worker2" || m.role === "driver") && (s.tabVisits?.[m.name] || 0) >= 3);
  if (!known) return false;
  const id = regularId(m.name);
  return debtTabs(s, id) < DEBT.perPerson && debtTotal(s) + amount <= DEBT.limit(s.level);
}
/** Trả lời khách xin ghi sổ: accept ⇒ ăn trước trả sau (tiền vào sổ); không ⇒ khách trả liền, hơi buồn. collectFn = tables.collect. */
export function resolveGhiSo(s, accept, ev, collectFn) {
  const sh = s.shift, b = sh.billing;
  if (!b?.ghiSo) return { err: "no-ghiso" };
  const g = groupOf(s, b.gid);
  if (!g) return { err: "gone" };
  const m = g.members[0];
  const correct = b.lines.filter((l) => l.real).reduce((a, l) => a + l.price, 0);
  if (accept && !ghiSoEligible(s, g, correct)) return { err: "debt-limit" };
  b.tapped = b.lines.filter((l) => l.real).map((l) => l.key); // ghi sổ: ghi đúng số
  const info = b.ghiSo;
  b.ghiSo = null;
  if (!accept) {
    for (const x of g.members) x.bonus = (x.bonus || 0) - 1;
    g.say = { text: freshLine(s, LP.GHISO_REFUSED, { self: m.self, call: m.call }), at: sh.t, who: 0 };
    ev.push({ type: "ghiSo", accept: false, name: m.name });
    return collectFn(s, ev);
  }
  g.ghiSo = true;
  const feedTop = s.feed[0]?.id;
  const r = collectFn(s, ev);
  if (r.err) return r;
  const back = Math.min(s.money, correct);
  s.money -= back; sh.stats.revenue -= back; sh.stats.ghiSo = (sh.stats.ghiSo || 0) + back;
  if (back > 0) s.debts = [...(s.debts || []), { id: info.id, name: m.name, amount: back, day: s.day }];
  s.rep = Math.min(100, s.rep + 0.3);
  syncDebtFlags(s, [info.id]);
  // review của bàn vừa chốt: câu ghi sổ thay câu chung
  if (s.feed[0] && s.feed[0].id !== feedTop && s.feed[0].name === m.name) { s.feed[0].line = freshLine(s, LP.GHISO_TAB_REVIEW, { self: m.self, call: m.call }); s.feed[0].mech = "ghiso-unpaid"; }
  g.say = { text: freshLine(s, LP.GHISO_THANKS, { self: m.self, call: m.call }), at: sh.t, who: 0 };
  ev.push({ type: "ghiSo", accept: true, name: m.name, amount: back });
  return { ok: true, amount: back };
}
/** Trả nợ (sự kiện K04 / K05 / K14 của agent B gọi được): trả hết các lần của khách id. */
export function payDebt(s, id, ev = [], { review = true } = {}) {
  const list = (s.debts || []).filter((d) => d.id === id);
  if (!list.length) return { err: "none" };
  const amount = list.reduce((a, d) => a + d.amount, 0);
  s.debts = s.debts.filter((d) => d.id !== id);
  s.money += amount; s.stats.debtPaid = (s.stats.debtPaid || 0) + amount;
  const name = list[0].name;
  const R = Object.values(ARCHETYPES).find((A) => A.names.includes(name));
  if (review) addReviewA(s, { name, role: R?.sprite || "regular", stars: 5, line: freshLine(s, LP.GHISO_PAID_REVIEW, { self: R?.self || "cô", call: R?.call || "con", amount }), mistake: null, mech: "ghiso-paid" });
  syncDebtFlags(s, [id]);
  ev.push({ type: "debtPaid", id, name, amount });
  return { ok: true, amount };
}
/** Khách nợ lâu nhất (sự kiện "khách nợ quên trả kèm thư" của Drama trả đúng người này qua payDebt). */
export function oldestDebtor(s) {
  const d = [...(s.debts || [])].sort((a, b) => a.day - b.day)[0];
  return d ? d.id : null;
}
/** Xoá nợ (Sổ): mất tiền, +1 danh tiếng. */
export function forgiveDebt(s, id, ev = []) {
  if (s.shift) return { err: "in-shift" };
  const n = (s.debts || []).filter((d) => d.id === id).length;
  if (!n) return { err: "none" };
  s.debts = s.debts.filter((d) => d.id !== id);
  s.rep = Math.min(100, s.rep + 1);
  syncDebtFlags(s, [id]);
  ev.push({ type: "debtForgiven", id });
  return { ok: true };
}
/** Sang ngày: mỗi người nợ 25% trả hết; nợ quá 14 ngày 6% "quên luôn". */
function debtsNextDay(s, ev) {
  s.debtNews = [];
  const ids = [...new Set((s.debts || []).filter((d) => !d.drama).map((d) => d.id))]; // S: nợ Drama (Anh Sáu) trả theo chuỗi sự kiện, không tự trả ngẫu nhiên
  for (const id of ids) {
    const list = s.debts.filter((d) => d.id === id);
    const oldest = Math.min(...list.map((d) => d.day));
    if (next(s) < DEBT.payChance) {
      const r = payDebt(s, id, ev);
      if (r.ok) s.debtNews.push(fill(freshLine(s, LP.DEBT_PAID_NEWS, { name: list[0].name, amount: r.amount }), {}));
    } else if (s.day - oldest >= DEBT.forgetDays && next(s) < DEBT.forgetChance) {
      s.debts = s.debts.filter((d) => d.id !== id);
      syncDebtFlags(s, [id]);
      s.debtNews.push(freshLine(s, LP.DEBT_FORGOT_NEWS, { name: list[0].name, amount: list.reduce((a, d) => a + d.amount, 0) }));
      ev.push({ type: "debtForgot", id, name: list[0].name });
    }
  }
}

// ---------- phụ bàn Bông (cấp 9): tự châm trà + dọn / lau bàn ----------
const helperHome = (P) => P["helper-home"] || [P.aisle[1][0] + 30, P.aisle[1][1] - 10];
/** Việc Bông nhận được bây giờ (không trùng việc cô chủ đang làm / đã giao). */
export function helperJob(s) {
  const sh = s.shift;
  const ownerOn = new Set([sh.owner.task, ...sh.owner.queue].filter(Boolean).filter((t) => t.kind === "clean").map((t) => t.tid));
  let best = null;
  for (const t of sh.tables) {
    if (t.joinOf) continue;
    if (t.state === "dirty" && t.gid === null && !ownerOn.has(t.id)) { const w = 2 + (sh.t - (t.dirtyT ?? sh.t)) / 1000; if (!best || w > best.w) best = { kind: "clean", tid: t.id, w }; continue; }
    const g = t.gid !== null ? groupOf(s, t.gid) : null;
    if (g && g.phase === "seated" && !g.paid && g.billT === null && g.members.some((m) => m.tea === "empty" && !m.eaten)) { const w = 5 + (g.firstTeaT === null ? 5 : 0); if (!best || w > best.w) best = { kind: "pour", tid: t.id, w }; }
  }
  return best;
}
function helperStart(s, h, job, P) {
  const tp = P.tables.find((x) => x.id === job.tid);
  if (!tp) return;
  h.task = { kind: job.kind, tid: job.tid, phase: "walk", target: [...tp.servePoint] };
  h.path = ownerRoute(P, h.pos, tp.servePoint); h.walked = 0;
}
export function stepHelper(s, dt, ev, TASKS) {
  const sh = s.shift, h = sh.helper;
  if (!h) return;
  const P = pointsOf(s), home = helperHome(P);
  let budget = dt;
  for (let guard = 0; guard < 4 && budget > 0; guard++) {
    if (!h.task || h.task.kind === "home") {
      const job = helperJob(s);
      if (job) helperStart(s, h, job, P);
      else if (!h.task && dist(h.pos, home) > 6) { h.task = { kind: "home", phase: "walk", target: [...home] }; h.path = ownerRoute(P, h.pos, home); h.walked = 0; }
      else if (!h.task) return;
    }
    const tk = h.task;
    if (tk.phase === "walk") {
      const len = pathLen(h.path);
      const need = ((len - h.walked) / HELPER.speed) * 1000;
      if (need > budget) { h.walked += (budget / 1000) * HELPER.speed; h.pos = alongDist(h.path, h.walked); return; }
      budget -= Math.max(0, need);
      h.pos = [...tk.target]; h.path = null;
      if (tk.kind === "home") { h.task = null; return; }
      tk.phase = "work"; tk.left = tk.kind === "pour" ? HELPER.pourMs : HELPER.cleanMs;
    }
    if (tk.phase === "work") {
      if (tk.left > budget) { tk.left -= budget; return; }
      budget -= tk.left;
      if (tk.kind === "pour") helperPour(s, tk.tid, ev);
      else if (tk.kind === "clean" && tableOf(s, tk.tid)?.state === "dirty") { TASKS.clean.done(s, { tid: tk.tid }, ev); sh.stats.helperJobs = (sh.stats.helperJobs || 0) + 1; }
      h.task = null;
    }
  }
}
function helperPour(s, tid, ev) {
  const sh = s.shift, t = tableOf(s, tid), g = t?.gid !== null ? groupOf(s, t?.gid) : null;
  if (!g || g.phase !== "seated" || g.paid) return;
  let n = 0;
  for (const m of g.members) {
    if (m.tea === "full" || m.eaten) continue;
    if ((s.stock.tra || 0) > 0) { s.stock.tra--; sh.stats.teaCost += STOCK.tra.cost; } else sh.stats.waterPours++;
    m.tea = "full"; m.teaT = sh.t; m.teaEmpty = null; n++;
  }
  if (!n) return;
  if (g.firstTeaT === null) g.firstTeaT = sh.t;
  g.helped = true;
  sh.stats.helperJobs = (sh.stats.helperJobs || 0) + 1;
  ev.push({ type: "teaPoured", gid: g.id, n, by: "bong" });
  if (!sh.a.bongSaid || sh.t - sh.a.bongSaid > 40000) { sh.a.bongSaid = sh.t; ev.push({ type: "say", text: "Bông: " + freshLine(s, LP.HELPER_SAY, {}), kind: "" }); }
}

// ---------- nhiệm vụ ngày (cấp 2) ----------
export const missionsUnlocked = (s) => s.level >= 2 && s.tutorialDone;
function startMissions(s, sh) {
  sh.missions = [];
  if (!missionsUnlocked(s) || sh.tutorial) return;
  const pool = MISSIONS.filter((m) => m.unlock <= s.level && (!m.needs || owns(s, m.needs)) && (m.kind !== "preorder" || (s.orders || []).some((o) => o.day === s.day && o.shift === sh.kind)));
  while (sh.missions.length < MISSIONS_PER_DAY && pool.length) {
    const m = pool.splice(int(s, pool.length), 1)[0];
    sh.missions.push({ id: m.id, kind: m.kind, text: fill(m.text, { n: m.n }), n: m.n, prog: 0, done: false, reward: { ...m.reward } });
  }
}
function completeMission(s, m, ev) {
  m.done = true; m.prog = m.n;
  gainXp(s, m.reward.xp, ev);
  s.shift.stats.xp += m.reward.xp;
  s.money += m.reward.money;
  s.shift.stats.missionCash = (s.shift.stats.missionCash || 0) + m.reward.money;
  s.stats.missions = (s.stats.missions || 0) + 1;
  ev.push({ type: "missionDone", id: m.id, text: m.text, xp: m.reward.xp, money: m.reward.money, line: freshLine(s, LP.MISSION_DONE, {}) });
}
export function missionBump(s, kind, by, ev) {
  for (const m of s.shift?.missions || []) if (m.kind === kind && !m.done && by > 0) { m.prog = Math.min(m.n, m.prog + by); if (m.prog >= m.n) completeMission(s, m, ev); }
}
function missionSet(s, kind, val, ev, ok = true) {
  for (const m of s.shift?.missions || []) if (m.kind === kind && !m.done) { m.prog = Math.min(m.n, Math.max(0, val)); if (ok && m.prog >= m.n) completeMission(s, m, ev); }
}
/** Nhiệm vụ đếm theo số liệu ca (gọi mỗi nhịp, rẻ). */
function missionsTick(s, ev) {
  const sh = s.shift, st = sh.stats;
  if (!sh.missions?.length) return;
  missionSet(s, "plates", st.plates, ev);
  missionSet(s, "revenue", st.revenue, ev);
  missionSet(s, "noBurnt", st.burnt ? 0 : st.plates, ev, !st.burnt);
  missionSet(s, "noTimeout", st.timeouts ? 0 : st.groupsServed, ev, !st.timeouts);
}
/** Nhiệm vụ xét lúc chốt ca. */
function missionsEnd(s, sh, info, ev) {
  const st = sh.stats;
  for (const m of sh.missions || []) {
    if (m.done) continue;
    if (m.kind === "clean" && st.maxDirtyMs < m.n * 1000 && st.groupsServed >= 3) completeMission(s, m, ev);
    else if (m.kind === "riceLeft" && info.riceLeft <= m.n && st.plates >= 4) completeMission(s, m, ev);
    else if (m.kind === "smoke" && st.smokeMax < m.n && st.plates >= 4) completeMission(s, m, ev);
  }
  sh.missionsMissed = (sh.missions || []).filter((m) => !m.done).map((m) => ({ text: m.text, line: freshLine(s, LP.MISSION_MISS, {}) }));
}

// ---------- câu riêng theo cơ chế (review / bong bóng) ----------
const lower = (t) => String(t || "").toLocaleLowerCase("vi");
/** Sau khi một bàn chốt (groupDone): đếm nhiệm vụ, đổi câu review theo cơ chế (ca trưa, mang về, cơm chiên, phụ bàn). */
function onGroupDone(s, e, ev) {
  const sh = s.shift, g = groupOf(s, e.gid);
  if (!g) return;
  const served = g.members.map((m) => ({ m, t: ticketById(s, m.tk) })).filter((x) => x.t && x.t.status === "served");
  if (e.stars >= 4 && g.members.every((m) => !m.noTea) && !g.takeaway) missionBump(s, "tea", 1, ev);
  if (e.stars === 5) missionBump(s, "five", 1, ev);
  if (g.size >= 3 && e.stars >= 4) missionBump(s, "table4", 1, ev);
  if (served.some((x) => x.t.nhuCu) && e.stars >= 4) missionBump(s, "nhuCu", 1, ev);
  // thợ / tài xế quen: đếm lần ăn vui để được ghi sổ
  const m0 = g.members[0];
  if (e.stars >= 4 && ["worker", "worker2", "driver"].includes(m0.role)) s.tabVisits = { ...(s.tabVisits || {}), [m0.name]: ((s.tabVisits || {})[m0.name] || 0) + 1 };
  // review theo cơ chế (một trong số đó, không đè review lỗi nặng)
  const top = s.feed[0];
  if (!top || top.day !== s.day || !g.members.some((m) => m.name === top.name) || top.mech || (top.mistake && top.stars <= 3)) return;
  const ctx = { self: m0.self, call: m0.call, name: m0.name };
  let pool = null, mech = null;
  if (served.some((x) => DISHES[x.t.dish]?.fried) && next(s) < 0.7) { pool = top.stars >= 3 ? LP.COM_CHIEN_REVIEW : LP.COM_CHIEN_REVIEW_LOW; mech = "com-chien"; }
  else if (g.takeaway && next(s) < 0.6) { pool = top.stars >= 4 ? LP.TAKEAWAY_REVIEW : LP.TAKEAWAY_REVIEW_LOW; mech = "takeaway"; }
  else if (sh.kind === "trua" && m0.role === "office" && next(s) < 0.6) { pool = top.stars >= 4 ? LP.LUNCH_REVIEW : LP.LUNCH_REVIEW_LOW; mech = "lunch"; }
  else if (g.helped && sh.helper && next(s) < 0.5 && top.stars >= 4) { pool = LP.HELPER_REVIEW; mech = "helper"; }
  if (pool) { top.line = freshLine(s, pool, ctx); top.mech = mech; }
}
/** Bong bóng riêng: dân văn phòng ca trưa, shipper, khách gọi cơm chiên. */
function lunchSays(s) {
  const sh = s.shift;
  for (const g of sh.groups) {
    if (g.aSaid || g.phase === "enter" || g.phase === "leave") continue;
    g.aSaid = true;
    const m = g.members[0];
    if (g.takeaway && next(s) < 0.6) g.say = { text: freshLine(s, LP.TAKEAWAY_SAY, { self: m.self, call: m.call, n: g.size }), at: sh.t, who: 0 };
    else if (sh.kind === "trua" && m.role === "office" && g.phase === "wait" && next(s) < 0.6) g.say = { text: freshLine(s, LP.LUNCH_SAY, { self: m.self, call: m.call }), at: sh.t, who: 0 };
  }
}

// ---------- cơm chiên từ cơm dư (cấp 2, cần chảo) ----------
/** makeTicket gọi: món cơm chiên chỉ khi còn phần (giữ chỗ ngay lúc gọi). */
export function pickDish(s, dish, dishes) {
  if (dish !== "com-chien") return dish;
  if ((s.friedRice || 0) > 0) { s.friedRice--; if (s.friedRice <= 0) s.menu = (s.menu || []).filter((x) => x !== "com-chien"); return dish; }
  const other = dishes.filter((x) => x !== "com-chien");
  return other.length ? other[int(s, other.length)] : "com-suon";
}
function friedRiceMenu(s) {
  const on = (s.friedRice || 0) > 0 && owns(s, "egg-pan") && s.level >= DISHES["com-chien"].level;
  s.menu = (s.menu || []).filter((x) => x !== "com-chien");
  if (on) s.menu.push("com-chien");
}

// ---------- móc vào nhịp ca ----------
/** core/shift.js startShift ⇒ sau khi tạo ca. */
export function onStart(s, ev) {
  const sh = s.shift;
  sh.a = { perfect: 0, washAcc: 0 };
  rollWeather(s);
  adjustSchedule(s, sh);
  sh.rice.size = Math.max(sh.rice.size, potSize(s));
  if (owns(s, "double-slot") && sh.slots.length < 2) sh.slots.push({ tk: null, plate: null });
  if (owns(s, "soup-pot") && s.level >= 5) sh.soup = { n: 30 };
  if (owns(s, "electric-blower")) sh.grill.blower = false;
  if (owns(s, "smoke-hood") && s.stage === "quan") sh.grill.hood = true;
  if (owns(s, "grill-2") && s.stage === "quan" && sh.grill.slots.length < 12) sh.grill.slots.push(...Array(6).fill(null)); // bếp 2: +6 chỗ, chung than
  if (staffToday(s, "bong")) { const P = pointsOf(s); sh.helper = { pos: [...helperHome(P)], path: null, walked: 0, task: null }; setFlag(s, "helper-bong", s.day); }
  if (staffToday(s, "di-nam")) sh.dishwasher = true;
  setFlag(s, "lunch-today", s.plan.includes("trua") ? s.day : 0);
  openOrders(s, sh, ev);
  startMissions(s, sh);
  if (sh.missions?.length) ev.push({ type: "missions", list: sh.missions.map((m) => m.text) });
  if (rainToday(s)) ev.push({ type: "say", text: freshLine(s, LP.RAIN_LINES, {}), kind: "warn" });
}
/** core/shift.js tick ⇒ mỗi nhịp, trước khi xét đóng ca. */
export function onTick(s, dt, ev, TASKS) {
  const sh = s.shift;
  if (!sh.a) sh.a = { perfect: 0, washAcc: 0 };
  if (sh.helper) stepHelper(s, dt, ev, TASKS);
  if (sh.dishwasher && sh.dirty > 0) {
    sh.a.washAcc += dt;
    while (sh.a.washAcc >= HELPER.washMs && sh.dirty > 0) { sh.a.washAcc -= HELPER.washMs; sh.dirty--; sh.cleanPlates++; sh.stats.washed++; }
  } else sh.a.washAcc = 0;
  if (sh.grill.coal < 25 && sh.lit && s.flags?.["charcoal-low"] !== s.day) setFlag(s, "charcoal-low", s.day);
  if (sh.grill.smoke >= 70 && (sh.grill.fan || sh.grill.blower) && s.flags?.["smoke-high"] !== s.day) setFlag(s, "smoke-high", s.day);
  // đơn đặt trước tới hạn + ân hạn mà chưa đủ ⇒ khách lấy phần đã xong
  for (const o of s.orders || []) {
    if (o.status !== "open" || o.dueT === undefined) continue;
    if (sh.t > o.dueT && !o.lateSaid) { o.lateSaid = true; ev.push({ type: "orderLate", id: o.id, name: o.name }); setFlag(s, "catering-late", s.day); }
    if (sh.t > o.dueT + PREORDER.grace) closeOrderPartial(s, o, ev);
  }
  lunchSays(s);
  missionsTick(s, ev);
}
function closeOrderPartial(s, o, ev) {
  const sh = s.shift;
  const t = sh.tickets.find((x) => x.catering === o.id && x.status !== "served" && x.status !== "void");
  if (t) { t.status = "void"; for (const sl of sh.slots) if (sl.tk === t.id) { sl.tk = null; } }
  finishOrder(s, o, ev, true);
}
/** core/shift.js endShift ⇒ đầu hàm (trước khi tính hao): dĩa mâm dở thành hao, đơn chưa xong chốt phần đã làm. */
export function beforeEnd(s, ev, addWaste) {
  const sh = s.shift;
  for (const sl of sh.slots) { for (const p of sl.batch || []) for (const [id, n] of Object.entries(p.used || {})) addWaste(sh, id, n, id === "com" ? n * STOCK["gao-tam"].cost : id === "moHanh" ? n * 0.5 : undefined); sl.batch = null; }
  for (const o of s.orders || []) if (o.status === "open") closeOrderPartial(s, o, ev);
  for (const o of s.orders || []) if (o.status === "waiting" && o.day === s.day && o.shift === sh.kind) { o.status = "late"; }
}
/** core/shift.js endShift ⇒ sau khi có s.lastSummary: lương nhân viên, nhiệm vụ cuối ca, cơm chiên ngày mai. */
export function afterEnd(s, sh, sum, ev) {
  let wages = 0;
  for (const id of Object.keys(STAFF)) if (staffToday(s, id)) wages += STAFF[id].price;
  const paid = Math.min(s.money, wages);
  s.money -= paid;
  missionsEnd(s, sh, { riceLeft: sum.riceLeft }, ev);
  sum.staff = wages; sum.profit -= wages;
  sum.missions = (sh.missions || []).map((m) => ({ text: m.text, done: m.done, prog: m.prog, n: m.n, reward: m.reward }));
  sum.missionsMissed = sh.missionsMissed || [];
  sum.missionCash = sh.stats.missionCash || 0;
  sum.ghiSo = sh.stats.ghiSo || 0;
  sum.helperJobs = sh.stats.helperJobs || 0;
  sum.orders = (s.orders || []).filter((o) => o.day === s.day && o.shift === sh.kind).map((o) => ({ name: o.name, kind: o.kind, n: o.n, done: o.done, status: o.status, paid: o.paid || 0 }));
  sum.debtTotal = debtTotal(s);
  sum.money = s.money;
  sum.late = !!sh.late;
  sum.weather = rainToday(s) ? "rain" : "clear";
  if (sum.final) {
    sum.friedTomorrow = owns(s, "egg-pan") && s.level >= 2 ? Math.min(FRIED_RICE.max, Math.floor(sum.riceLeft * FRIED_RICE.share)) : 0;
    s.friedRice = sum.friedTomorrow;
  }
}
/** core/shift.js nextDay ⇒ sau khi sang ngày. */
export function onNextDay(s, ev) {
  debtsNextDay(s, ev);
  friedRiceMenu(s);
  s.orders = (s.orders || []).filter((o) => o.day >= s.day);
  rollWeather(s);
  setFlag(s, "lunch-today", s.plan.includes("trua") ? s.day : 0);
  setFlag(s, "helper-bong", 0);
  setFlag(s, "catering-active", 0);
}

/** core/apply.js ⇒ sau mỗi action thành công (trên bản nháp, trước khi kiểm bất biến). */
export function afterApply(s, action, events, result) {
  const ev = [];
  for (const e of events) {
    if (!s.shift) break;
    switch (e.type) {
      case "flip": if (e.perfect) missionBump(s, "flips", 1, ev); break;
      case "groupDone": onGroupDone(s, e, ev); break;
      case "delivered": {
        const t = ticketById(s, e.tk);
        if (!t || e.mistakes?.length) break;
        if (t.quirks?.length) missionBump(s, "quirks", 1, ev);
        if (t.quirks?.includes("longDao")) missionBump(s, "runny", 1, ev);
        if (e.takeaway) missionBump(s, "takeaway", 1, ev);
        if (s.shift.soup?.n > 0 && !e.takeaway) { s.shift.soup.n--; s.shift.stats.teaCost += 0.6; const g = groupOf(s, t.gid); const m = g?.members.find((x) => x.tk === t.id); if (m) m.canh = true; }
        break;
      }
      case "ordered": {
        for (const t of s.shift.tickets) if (t.gid === e.gid && t.plus === undefined) {
          t.plus = s.fishSauce || 0;
          if (DISHES[t.dish]?.fried) { const g = groupOf(s, t.gid); const m = g?.members.find((x) => x.tk === t.id); t.line = freshLine(s, LP.COM_CHIEN_ORDER, m ? { self: m.self, call: m.call } : {}); if (g) g.say = { text: t.line, at: s.shift.t, who: m?.idx || 0 }; }
        }
        break;
      }
      case "billOpen": {
        const b = s.shift.billing, g = b && groupOf(s, b.gid);
        if (!g) break;
        const amount = b.lines.filter((l) => l.real).reduce((a, l) => a + l.price, 0);
        if (ghiSoEligible(s, g, amount) && next(s) < DEBT.askChance) {
          const m = g.members[0];
          b.ghiSo = { id: regularId(m.name), name: m.name, amount };
          g.say = { text: freshLine(s, LP.GHISO_ASK, { self: m.self, call: m.call }), at: s.shift.t, who: 0 };
          ev.push({ type: "ghiSoAsk", name: m.name, amount });
        }
        break;
      }
      case "dramaResolved": case "dramaDone": missionBump(s, "drama", 1, ev); break;
      default: break;
    }
  }
  if (action?.type === "collect" && result && !result.over && !result.under && !s.shift?.billing) missionBump(s, "bill", 1, ev);
  events.push(...ev);
}

// ---------- ô bày đôi ----------
export { DISHES };
