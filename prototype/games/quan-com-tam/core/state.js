// Trạng thái quán: tạo mới, đọc + kẹp bản lưu, ghi. Thuần. Khoá lưu "wgp.quancomtam.v1" (save.js), phiên bản trong bản lưu: v.
// Quy tắc đọc: mọi số bị kẹp về miền hợp lệ, id lạ bị bỏ; ca dở dang được giữ nếu cấu trúc hợp lệ, ngược lại bỏ riêng ca (giữ tiền / cấp / kho).
// MIGRATIONS[v] nâng v → v+1 (v1: bản M2 trên master; v2: gộp M3 + M4).
// save.js giữ bản sao nguyên văn bản cũ (KEY.bak-vN) một lần trước khi nâng, bản hỏng chép sang KEY.corrupt.
import { STOCK_IDS, START_MONEY, START_STOCK, GEAR, SHIFTS, SERVICE, GRILL, DISHES, SHELF } from "../data/economy.js?v=c2";
import { ARCHETYPES, QUIRKS } from "../data/customers.js?v=c2";
import { levelForXp } from "./progress.js?v=c2";
import { freshSocial, loadSocial } from "./reviews.js?v=c2"; // C: review / tính cách / Nhật Ký
import { freshDrama } from "./flags.js?v=c2"; // B: drama
import { freshA, loadA } from "./progression.js?v=c2"; // A: khoá tiến trình M3

export const SAVE_VERSION = 2;
/**
 * v1 → v2 (gộp M3 + M4: A tiến trình, B Drama, C review / Nhật Ký). Khoá mới đều có mặc định an toàn khi đọc; bước nâng chỉ đổi những gì
 * hai nhánh từng ghi khác chỗ: độ hot của A (`buzz`) gộp vào `hype` (C), một sổ người theo dõi (`followers`), cờ dùng chung `s.flags`
 * chỉ giữ giá trị true / số (khoá dài ≤ 60).
 */
export const MIGRATIONS = {
  1: (d) => {
    const out = { ...d, v: 2 };
    const buzz = typeof d.buzz === "number" && Number.isFinite(d.buzz) ? d.buzz : 0;
    if (buzz > 0) out.hype = Math.min(20, Math.max(typeof d.hype === "number" && Number.isFinite(d.hype) ? d.hype : 0, buzz));
    delete out.buzz;
    if (obj(d.flags)) out.flags = Object.fromEntries(Object.entries(d.flags).filter(([k, v]) => k.length <= 60 && (v === true || (typeof v === "number" && Number.isFinite(v)))));
    return out;
  },
};

export function createState(seed = 20261120) {
  return {
    v: SAVE_VERSION, seed: seed >>> 0, rng: seed >>> 0, shopName: "Cơm Tấm Nhà Mình", introSeen: false, tutorialDone: false,
    money: START_MONEY, xp: 0, level: 1, rep: 50, day: 1, stage: "street",
    stock: Object.fromEntries(STOCK_IDS.map((id) => [id, START_STOCK[id] || 0])), uopOld: 0, plates: SERVICE.plates.street, spareSack: 0, owned: {},
    moHanh: { n: 0, day: 1 }, kitchen: { rice: 0, coal: 0, prepCoal: 0 },
    plan: ["toi"], shiftIdx: 0, between: null, dayDone: false, menu: ["com-suon"], menuOff: [],
    stats: { plates: 0, revenue: 0, shifts: 0, bestProfit: 0, spentStock: 0, spentGear: 0, reviews: {}, debtPaid: 0, ordersDone: 0, missions: 0 },
    regulars: {}, feed: [], nextReviewId: 0, rating: null, consign: null, daily: { consigned: false, borrowed: {} },
    usedDay: [], shift: null, lastSummary: null,
    bought: Object.fromEntries(Object.entries(START_STOCK).filter(([id]) => SHELF[id]).map(([id, n]) => [id, [{ day: 1, n }]])), // S: gói học có hạn từ ngày 1
    // --- C: reviews/journal --- (persona, followers, hype, nextGuests, promises, returning, journal, dayLog)
    ...freshSocial(),
    // --- B: drama --- (cờ trơn dùng chung s.flags, cờ / hàng hẹn / lịch sử Drama, mod có hạn, (người theo dõi / độ hot dùng chung khối C))
    flags: {}, drama: freshDrama(), mods: [],
    // --- A: progression --- (sổ nợ, đơn đặt trước / mâm cơm, hạng quán, nước mắm nhà pha, nhân viên theo ngày, quảng bá, trang trí + chỗ đặt,
    // kỷ niệm vỉa hè, cơm chiên ngày mai, thời tiết, ca khuya kéo dài). Mặc định ở core/progression.js freshA(); đọc bản lưu cũ: loadA().
    ...freshA(),
  };
}

const num = (v, lo, hi, d) => (typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d);
const int = (v, lo, hi, d) => Math.floor(num(v, lo, hi, d));
const str = (v, max, d) => (typeof v === "string" && v.trim() ? v.slice(0, max) : d);
const obj = (v) => !!v && typeof v === "object" && !Array.isArray(v);
const arr = (v) => (Array.isArray(v) ? v : []);
const bool = (v) => v === true;
const BIG = 1e9;
const pt2 = (p) => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite);

/** Ca đang mở: kiểm cấu trúc, kẹp số. Hỏng chỗ nào ⇒ bỏ ca (null), giữ phần còn lại của bản lưu. */
function loadShift(sh, s) {
  if (!obj(sh) || sh.status !== "open" || !SHIFTS[sh.kind]) return null;
  try {
    const t = num(sh.t, 0, 3_600_000, 0);
    if (!Array.isArray(sh.groups) || !Array.isArray(sh.tickets) || !Array.isArray(sh.tables) || !Array.isArray(sh.slots) || !obj(sh.grill) || !obj(sh.rice) || !obj(sh.owner) || !obj(sh.stats)) throw 0;
    const g = sh.grill;
    if (!Array.isArray(g.slots) || (g.slots.length !== GRILL.slots && g.slots.length !== GRILL.slots * 2)) throw 0; // A: bếp 2 ⇒ 12 chỗ
    g.slots = g.slots.map((it) => (obj(it) && GRILL.side[it.item] && Array.isArray(it.sides) ? { ...it, sides: [num(it.sides[0], 0, GRILL.sideMax, 0), num(it.sides[1], 0, GRILL.sideMax, 0)], fresh: num(it.fresh, 0, 100, 100), warmMs: num(it.warmMs, 0, BIG, 0), said: obj(it.said) ? it.said : {} } : null));
    g.coal = num(g.coal, 0, 100, 0); g.smoke = num(g.smoke, 0, 100, 0); g.fan = false; g.pending = arr(g.pending).filter((p) => obj(p) && Number.isFinite(p.at)).slice(0, 10);
    sh.rice.n = int(sh.rice.n, 0, 40, 0);
    sh.cleanPlates = int(sh.cleanPlates, 0, 200, 0); sh.dirty = int(sh.dirty, 0, 200, 0);
    for (const tb of sh.tables) if (!obj(tb) || typeof tb.id !== "string" || !["clean", "dirty", "wet"].includes(tb.state)) throw 0;
    for (const gr of sh.groups) if (!obj(gr) || !ARCHETYPES[gr.arch] || !Array.isArray(gr.members) || !gr.members.length) throw 0;
    for (const tk of sh.tickets) { if (!obj(tk) || !DISHES[tk.dish]) throw 0; tk.quirks = arr(tk.quirks).filter((q) => QUIRKS[q]); }
    if (!pt2(sh.owner.pos)) throw 0;
    sh.owner.queue = arr(sh.owner.queue).slice(0, 8);
    sh.sel = int(sh.sel, 0, Math.max(0, sh.slots.length - 1), 0);
    sh.t = t;
    sh.usedLines = arr(sh.usedLines).filter((x) => typeof x === "string").slice(-120);
    return sh;
  } catch { return null; }
}

/** Đọc chuỗi JSON bản lưu ⇒ trạng thái hợp lệ, hoặc null nếu hỏng. Kẹp mọi số. */
export function loadSave(raw) {
  let d;
  try { d = typeof raw === "string" ? JSON.parse(raw) : structuredClone(raw); } catch { return null; }
  if (!obj(d) || !Number.isInteger(d.v) || d.v < 1 || d.v > SAVE_VERSION) return null;
  for (let v = d.v; v < SAVE_VERSION; v++) { if (!MIGRATIONS[v]) return null; d = MIGRATIONS[v](d); }
  const s = createState(int(d.seed, 0, 2 ** 32 - 1, 1));
  s.rng = int(d.rng, 0, 2 ** 32 - 1, s.seed);
  s.shopName = str(d.shopName, 32, s.shopName);
  s.introSeen = bool(d.introSeen); s.tutorialDone = bool(d.tutorialDone);
  s.money = int(d.money, 0, BIG, START_MONEY);
  s.xp = int(d.xp, 0, BIG, 0); s.level = levelForXp(s.xp);
  s.rep = num(d.rep, 0, 100, 50); s.day = int(d.day, 1, BIG, 1);
  s.stage = d.stage === "quan" ? "quan" : "street";
  for (const id of STOCK_IDS) s.stock[id] = int(d.stock?.[id], 0, 100000, 0);
  s.uopOld = int(d.uopOld, 0, 1000, 0);
  s.plates = int(d.plates, 0, 60, SERVICE.plates.street);
  s.spareSack = int(d.spareSack, 0, 50, 0);
  s.owned = Object.fromEntries(Object.entries(obj(d.owned) ? d.owned : {}).filter(([k, v]) => GEAR[k] && v === true));
  s.moHanh = obj(d.moHanh) ? { n: int(d.moHanh.n, 0, 40, 0), day: int(d.moHanh.day, 0, BIG, s.day) } : { n: 0, day: s.day };
  s.kitchen = obj(d.kitchen) ? { rice: int(d.kitchen.rice, 0, 40, 0), coal: num(d.kitchen.coal, 0, 100, 0), prepCoal: int(d.kitchen.prepCoal, 0, 50, 0) } : s.kitchen;
  const plan = arr(d.plan).filter((k) => SHIFTS[k]);
  s.plan = plan.length ? plan.slice(0, 2) : ["toi"];
  s.shiftIdx = int(d.shiftIdx, 0, s.plan.length - 1, 0);
  s.between = SHIFTS[d.between] ? d.between : null;
  s.dayDone = bool(d.dayDone);
  const menu = arr(d.menu).filter((id) => DISHES[id] && !DISHES[id].rescue);
  s.menu = menu.length ? [...new Set(menu)] : ["com-suon"];
  s.menuOff = arr(d.menuOff).filter((id) => DISHES[id]);
  if (obj(d.stats)) for (const k of ["plates", "revenue", "shifts", "bestProfit", "spentStock", "spentGear", "debtPaid", "ordersDone", "missions"]) s.stats[k] = num(d.stats[k], -BIG, BIG, 0);
  if (obj(d.stats?.reviews)) for (const k of ["1", "2", "3", "4", "5"]) if (Number.isInteger(d.stats.reviews[k])) s.stats.reviews[k] = Math.max(0, d.stats.reviews[k]);
  s.regulars = Object.fromEntries(Object.entries(obj(d.regulars) ? d.regulars : {}).filter(([, r]) => obj(r)).slice(0, 60).map(([k, r]) => [k.slice(0, 40), {
    visits: int(r.visits, 0, BIG, 0), good: int(r.good, 0, BIG, 0), ...(obj(r.fav) && DISHES[r.fav.dish] ? { fav: { dish: r.fav.dish, quirks: arr(r.fav.quirks).filter((q) => QUIRKS[q]) } } : {}) }]));
  s.feed = arr(d.feed).filter(obj).slice(0, 40).map((r) => ({ id: int(r.id, 0, BIG, 0), day: int(r.day, 1, BIG, 1), name: str(r.name, 40, "Khách"), role: ARCHETYPES[r.role] ? r.role : "student",
    stars: int(r.stars, 1, 5, 3), line: str(r.line, 300, ""), mistake: typeof r.mistake === "string" ? r.mistake.slice(0, 20) : null, ...(DISHES[r.dish] ? { dish: r.dish } : {}), ...(typeof r.mech === "string" ? { mech: r.mech.slice(0, 24) } : {}) })); // mech: A
  s.nextReviewId = int(d.nextReviewId, 0, BIG, s.feed.length);
  s.rating = typeof d.rating === "number" ? num(d.rating, 1, 5, null) : null;
  s.consign = obj(d.consign) && d.consign.owed > 0 ? { owed: int(d.consign.owed, 1, 100000, 1) } : null;
  s.daily = obj(d.daily) ? { consigned: bool(d.daily.consigned), borrowed: obj(d.daily.borrowed) ? Object.fromEntries(Object.entries(d.daily.borrowed).filter(([k, v]) => STOCK_IDS.includes(k) && Number.isInteger(v))) : {} } : s.daily;
  s.bought = Object.fromEntries(Object.entries(obj(d.bought) ? d.bought : {}).filter(([k]) => STOCK_IDS.includes(k)).map(([k, v]) => [k, arr(v).filter((p) => obj(p) && Number.isInteger(p.day) && Number.isInteger(p.n) && p.n > 0).slice(-20)]));
  s.usedDay = arr(d.usedDay).filter((x) => typeof x === "string").slice(-120);
  s.lastSummary = obj(d.lastSummary) ? { ...d.lastSummary, seen: bool(d.lastSummary.seen) } : null;
  // --- C: reviews/journal --- (lý do / nguồn / câu trả lời của review, tính cách, người theo dõi, độ hot, Nhật Ký)
  loadSocial(s, d);
  // --- B: drama ---
  s.flags = Object.fromEntries(Object.entries(obj(d.flags) ? d.flags : {}).filter(([k, v]) => k.length <= 60 && (v === true || (typeof v === "number" && Number.isFinite(v)))).slice(0, 200));
  s.mods = arr(d.mods).filter((m) => obj(m) && typeof m.id === "string" && Number.isInteger(m.until)).slice(0, 30);
  if (obj(d.drama)) {
    const D = d.drama, F = freshDrama(), ints = (o) => Object.fromEntries(Object.entries(obj(o) ? o : {}).filter(([k, v]) => k.length <= 60 && Number.isInteger(v)).slice(0, 300));
    s.drama = { ...F, flags: ints(D.flags), seen: ints(D.seen), debt: ints(D.debt), decor: Object.fromEntries(Object.entries(obj(D.decor) ? D.decor : {}).filter(([, v]) => v === true).slice(0, 40)),
      queue: arr(D.queue).filter((q) => obj(q) && typeof q.id === "string" && Number.isInteger(q.day)).slice(0, 40), history: arr(D.history).filter(obj).slice(0, 40),
      moments: arr(D.moments).filter(obj).slice(0, 30), recent: arr(D.recent).filter((x) => typeof x === "string").slice(-6), pre: arr(D.pre).filter((p) => obj(p) && Number.isInteger(p.day) && p.n > 0).slice(0, 10),
      pending: obj(D.pending) && D.pending.kind === "event" && typeof D.pending.id === "string" ? D.pending : null,
      nextGuests: int(D.nextGuests, -4, 8, 0), nextArch: Object.fromEntries(Object.entries(obj(D.nextArch) ? D.nextArch : {}).filter(([k, v]) => ARCHETYPES[k] && Number.isInteger(v))),
      catName: typeof D.catName === "string" ? D.catName.slice(0, 20) : null };
  }
  loadA(s, d); // --- A: progression --- (thiếu khoá ⇒ mặc định an toàn)
  s.shift = loadShift(d.shift, s);
  if (s.shift && s.shift.day !== s.day) s.shift = null;
  return s;
}
export const dump = (s) => JSON.stringify(s);
export function saveVersion(raw) { try { const d = JSON.parse(raw); return obj(d) && Number.isInteger(d.v) ? d.v : null; } catch { return null; } }
