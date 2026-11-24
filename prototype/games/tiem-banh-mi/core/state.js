// Trạng thái tiệm: tạo mới, đọc + kẹp bản lưu, ghi. Thuần. Khoá lưu "wgp.tiembanhmi.v1" (save.js), phiên bản trong bản lưu: v.
// Quy tắc đọc: số bị kẹp về miền hợp lệ, id lạ bị bỏ; ca dở dang được giữ nếu cấu trúc hợp lệ, ngược lại bỏ riêng ca (giữ tiền / cấp / kho).
// MIGRATIONS[v] nâng v → v+1. v1 → v2 (M3 + M4): thêm tính cách chủ tiệm, người theo dõi / độ hot, Drama, Nhật Ký, bánh hôm qua, bộ điều chỉnh,
// trang trí, hạng tiệm, pate nhà làm, ổ mang tên tiệm, đơn đặt trước, quảng bá, phụ việc, hội chợ, thử thách, thời tiết (mặc định an toàn).
// save.js giữ bản sao nguyên văn bản cũ (KEY.bak-v1) một lần trước khi nâng.
import { STOCK_IDS, START_MONEY, START_STOCK, START_FLOAT, FLOAT_BILLS, RECIPE, OVENS, BILLS, WRAPS, LEVELS } from "../data/economy.js?v=b4";
import { ARCHETYPES } from "../data/customers.js?v=b4";
import { QUIRKS } from "../data/quirks.js?v=b4";
import { levelForXp } from "./shift.js?v=b4";
import { floatValue } from "./money.js?v=b4";
import { freshDrama } from "./flags.js?v=b4";
import { EVENT } from "../data/events.js?v=b4";
import { NPCS } from "../data/npcs.js?v=b4";
import { EQUIPMENT, DECOR, SIGNBOARDS } from "../data/equipment.js?v=b4";
import { PERSONAS } from "../data/lines-reply.js?v=b4";
import { loadContracts } from "./contracts.js?v=b4";
import { loadCook } from "./cook.js?v=b4";
import { loadLots } from "./expiry.js?v=b4";
import { CHALLENGE_BY_ID, BADGE } from "./challenge.js?v=b4";

export const SAVE_VERSION = 3;
/** v2 → v3 (M5): hợp đồng định kỳ, lô hàng theo ngày (hạn dùng), số lần hội chợ, thử thách theo lịch, huy hiệu theo id.
 *  Huy hiệu cũ "chuTiem" (đếm số lần đạt thử thách M3) chuyển thành s.stats.challenges; thử thách đang bật hôm nay giữ thành thử thách trên lịch.
 *  Cấp + phần trăm tới cấp sau giữ nguyên khi đổi đường cong XP (rescaleXp). save.js cất bản gốc ở KEY.bak-v2 một lần trước khi nâng. */
export const MIGRATIONS = {
  1: (d) => ({ ...d, v: 2, owner: { persona: null, lastPersona: null, switches: [] }, followers: 0, buzz: 0, drama: freshDrama(), journal: [], mods: [] }),
  2: (d) => {
    const b = d.badges && typeof d.badges === "object" ? d.badges : {};
    const stats = { ...(d.stats || {}), challenges: Number.isInteger(b.chuTiem) ? b.chuTiem : 0 };
    const out = { ...d, v: 3, stats, badges: {}, contracts: [], lots: {}, fairCount: d.fairDay ? 1 : 0, challenge: null };
    if (Number.isInteger(d.challengeDay) && d.challengeDay === d.day && (d.level || 1) >= 20) out.challenge = { id: CHALLENGE_LIST()[d.day % 5], day: d.day };
    out.xp = rescaleXp(d.xp, LEVELS_V2);
    return out;
  },
};
const CHALLENGE_LIST = () => Object.keys(CHALLENGE_BY_ID);
/** Đường cong XP bản lưu v2 (M3/M4). Bản v3 dùng LEVELS (data/economy.js) sau cân bằng M5. */
export const LEVELS_V2 = [0, 35, 70, 115, 360, 580, 870, 1450, 2100, 3000, 3625, 4380, 5225, 6240, 7530, 9005, 10835, 12950, 15415, 18260];
/** Giữ cấp + phần trăm đường tới cấp sau khi đổi bảng XP: xp cũ trên bảng `from` ⇒ xp tương ứng trên LEVELS hiện tại. */
export function rescaleXp(xp, from, to = LEVELS) {
  xp = Math.max(0, Math.floor(Number(xp) || 0));
  let i = 0; for (let k = 0; k < from.length; k++) if (xp >= from[k]) i = k;
  if (i >= from.length - 1) return to[to.length - 1] + Math.max(0, xp - from[from.length - 1]);
  const f = (xp - from[i]) / (from[i + 1] - from[i]);
  return Math.floor(to[i] + f * (to[i + 1] - to[i]));
}

export function createState(seed = 20261119) {
  return {
    v: SAVE_VERSION, seed: seed >>> 0, rng: seed >>> 0, shopName: "Bánh Mì Nhà Mình", introSeen: false, tutorialDone: false,
    money: START_MONEY, float: { ...START_FLOAT }, xp: 0, level: 1, rep: 50, day: 1, oven: "mini", shop: false,
    stock: Object.fromEntries(STOCK_IDS.map((id) => [id, START_STOCK[id] || 0])),
    stats: { loaves: 0, revenue: 0, shifts: 0, bestProfit: 0, spentStock: 0, reviews: {} },
    owned: {}, regulars: {}, feed: [], nextReviewId: 0, nextLoaf: 0, debts: {}, consign: null, daily: {}, prep: null,
    usedDay: [], shift: null, lastSummary: null,
    owner: { persona: null, lastPersona: null, switches: [] }, followers: 0, buzz: 0, rating: null, promises: [], returning: [],
    drama: freshDrama(), journal: [], cartMemory: null, stale: null, mods: [], placement: {}, rank: 0, pate: 0, house: null,
    preorders: [], nextPre: 0, offers: null, promo: null, helperDay: 0, fairDay: 0, challengeDay: 0, badges: {}, weather: null,
    contracts: [], lots: {}, fairCount: 0, challenge: null,
  };
}

const num = (v, lo, hi, d) => (typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d);
const int = (v, lo, hi, d) => Math.floor(num(v, lo, hi, d));
const str = (v, max, d) => (typeof v === "string" && v.trim() ? v.slice(0, max) : d);
const obj = (v) => !!v && typeof v === "object" && !Array.isArray(v);
const arr = (v) => (Array.isArray(v) ? v : []);
const bool = (v) => v === true;
const BIG = 1e9;
const lvlMap = (o, keys) => Object.fromEntries(Object.entries(obj(o) ? o : {}).filter(([k, v]) => keys.includes(k) && Number.isInteger(v) && v >= 0 && v <= 3 && v > 0));
const boolMap = (o, keys) => Object.fromEntries(Object.entries(obj(o) ? o : {}).filter(([k, v]) => keys.includes(k) && v === true));
const SPREAD_KEYS = ["pate", "bo", "mayo"], VEG_KEYS = ["do-chua", "dua-leo", "rau-mui", "hanh-la"], SAUCE_KEYS = ["nuoc-tuong", "tuong-ot"];
const FILL_KEYS = ["cha-lua", "thit-nguoi", "xiu-mai", "trung", "thit-nuong", "heo-quay", "ga-xe", "cha-chay", "cha-bong"];

function loadItem(it) {
  if (!obj(it) || !(RECIPE[it.recipe] || it.recipe === "bachuc")) throw 0;
  const out = {
    recipe: it.recipe, price: int(it.price, 0, 500, 0), spreads: lvlMap(it.spreads, SPREAD_KEYS), fills: arr(it.fills).filter((x) => FILL_KEYS.includes(x)),
    veg: Object.fromEntries(VEG_KEYS.map((k) => [k, it.veg?.[k] === true])), ot: int(it.ot, 0, 3, 2), sauces: boolMap(it.sauces, SAUCE_KEYS),
    wrap: WRAPS[it.wrap] ? it.wrap : "giay", crispy: bool(it.crispy), quirks: arr(it.quirks).filter((q) => QUIRKS[q]), vegan: bool(it.vegan),
  };
  if (it.bag) out.bag = true;
  if (typeof it.label === "string" && it.label) out.label = it.label.slice(0, 28);
  if (it.recipe === "bachuc") out.target = int(it.target, 10, 200, 30);
  return out;
}
function loadLoaf(l, built) {
  if (!obj(l)) throw 0;
  const out = {
    spreads: lvlMap(l.spreads, SPREAD_KEYS), fills: arr(l.fills).filter((x) => FILL_KEYS.includes(x)), veg: boolMap(l.veg, VEG_KEYS), ot: int(l.ot, 0, 3, 0),
    sauces: boolMap(l.sauces, SAUCE_KEYS), wrap: WRAPS[l.wrap] ? l.wrap : null, crisp: num(l.crisp, 0, 100, 60), burnt: bool(l.burnt), dark: bool(l.dark),
    toasted: bool(l.toasted), src: SRC.has(l.src) ? l.src : "oven", ...(["hot", "wait", "fresh", "held"].includes(l.ck) ? { ck: l.ck } : {}), ...(l.ckWait ? { ckWait: true } : {}), ...(l.ckSaid ? { ckSaid: true } : {}),
    used: Object.fromEntries(Object.entries(obj(l.used) ? l.used : {}).filter(([k, v]) => STOCK_IDS.includes(k) && Number.isInteger(v) && v > 0 && v < 50)),
  };
  if (built) { out.item = int(l.item, 0, 30, 0); return out; }
  out.id = int(l.id, 0, BIG, 0); out.sliced = bool(l.sliced);
  if (Number.isInteger(l.n) && l.n > 1 && l.n <= 8) out.n = l.n;
  if (l.que) out.que = true;
  out.toastT0 = typeof l.toastT0 === "number" && Number.isFinite(l.toastT0) ? l.toastT0 : null;
  if (l.readyWarned) out.readyWarned = true;
  if (l.burntWarned) out.burntWarned = true;
  return out;
}
const PHASE = new Set(["enter", "wait", "pay", "react", "leave"]);
const SRC = new Set(["oven", "si", "stale", "que"]);
const flagMap = (o) => Object.fromEntries(Object.entries(obj(o) ? o : {}).filter(([k, v]) => typeof k === "string" && k.length < 40 && Number.isInteger(v)).slice(0, 200));
function loadPre(p) {
  if (!obj(p)) return null;
  return { id: int(p.id, 0, BIG, 0), dueT: num(p.dueT, -BIG, BIG, 0), deposit: int(p.deposit, 0, 5000, 0), label: str(p.label, 40, "Đơn đặt trước"), tip: int(p.tip, 0, 500, 0),
    flagOk: typeof p.flagOk === "string" ? p.flagOk.slice(0, 40) : null, laterOk: obj(p.laterOk) && EVENT[p.laterOk.id] ? { id: p.laterOk.id, days: int(p.laterOk.days, 0, 30, 1) } : null,
    okStars: int(p.okStars, 1, 5, 4), ...(p.onTime !== undefined ? { onTime: bool(p.onTime), late: num(p.late, 0, BIG, 0) } : {}), ...(typeof p.contract === "string" ? { contract: p.contract.slice(0, 30) } : {}) };
}
function loadCustomer(c, t) {
  if (!obj(c) || !Number.isInteger(c.id) || !ARCHETYPES[c.arch] || !PHASE.has(c.phase)) throw 0;
  const items = arr(c.items).slice(0, 30).map(loadItem);
  if (!items.length) throw 0;
  const filled = items.map((_, i) => (c.filled?.[i] ? loadLoaf(c.filled[i], true) : null));
  const A = ARCHETYPES[c.arch];
  const out = {
    id: c.id, arch: c.arch, sprite: A.sprite, name: str(c.name, 40, "Khách"), self: str(c.self, 10, A.self), call: str(c.call, 10, A.call), items, filled,
    phase: c.phase, t0: num(c.t0, 0, t, t), arriveT: c.arriveT === null ? null : num(c.arriveT, -600000, t, t), patience: int(c.patience, 5000, 900000, A.patience),
    spot: int(c.spot, -1, 5, 0), mood: str(c.mood, 20, "waiting"), say: obj(c.say) && typeof c.say.text === "string" ? { text: c.say.text.slice(0, 300), at: num(c.say.at, 0, t, t) } : null,
    orderLine: str(c.orderLine, 300, ""), nhuCu: bool(c.nhuCu), payPlan: c.payPlan === "exact" || c.payPlan === "transfer" || BILLS.includes(c.payPlan) ? c.payPlan : null,
    leaveT: c.leaveT === null || c.leaveT === undefined ? null : num(c.leaveT, 0, t, t), reactUntil: c.reactUntil === null || c.reactUntil === undefined ? null : num(c.reactUntil, 0, t + 5000, t),
    remade: bool(c.remade), impatientSaid: bool(c.impatientSaid), discount: num(c.discount, 0, 1, 0), pinned: bool(c.pinned), free: bool(c.free),
    pay: null, score: null, stars: c.stars ? int(c.stars, 1, 5, 3) : undefined,
  };
  if (c.swapped) out.swapped = String(c.swapped).slice(0, 20);
  if (typeof c.tag === "string") out.tag = c.tag.slice(0, 12);
  if (obj(c.group)) out.group = { tip: int(c.group.tip, 0, 500, 0), flagOk: typeof c.group.flagOk === "string" ? c.group.flagOk.slice(0, 40) : null, laterOk: obj(c.group.laterOk) && EVENT[c.group.laterOk.id] ? { id: c.group.laterOk.id, days: int(c.group.laterOk.days, 0, 30, 1) } : null, okStars: int(c.group.okStars, 1, 5, 3) };
  if (obj(c.pre)) out.pre = loadPre(c.pre);
  if (typeof c.fillT0 === "number") out.fillT0 = num(c.fillT0, 0, t, 0);
  if (typeof c.fillT1 === "number") out.fillT1 = num(c.fillT1, 0, t, 0);
  if (c.batched) out.batched = int(c.batched, 0, 30, 0);
  if (obj(c.score)) out.score = { points: int(c.score.points, 0, 100, 50), stars: int(c.score.stars, 1, 5, 3), time: int(c.score.time, 0, 20, 10),
    per: arr(c.score.per).slice(0, 30).map((p) => ({ recipe: num(p?.recipe, 0, 50, 0), crisp: num(p?.crisp, 0, 15, 0), quirk: num(p?.quirk, 0, 15, 0), errors: arr(p?.errors).filter((e) => typeof e === "string").slice(0, 20), mistakes: arr(p?.mistakes).filter((e) => typeof e === "string").slice(0, 11), quirkOk: [] })),
    mistakes: arr(c.score.mistakes).filter((e) => typeof e === "string").slice(0, 11), errors: arr(c.score.errors).filter((e) => typeof e === "string").slice(0, 30) };
  if (obj(c.pay)) {
    const kind = ["free", "transfer", "exact", "bill"].includes(c.pay.kind) ? c.pay.kind : null;
    if (!kind) throw 0;
    out.pay = { due: int(c.pay.due, 0, 2000, 0), kind };
    if (kind === "bill") { if (!BILLS.includes(c.pay.bill)) throw 0; out.pay.bill = c.pay.bill; out.pay.change = int(c.pay.change, 0, 500, c.pay.bill - out.pay.due); }
    if (kind === "exact") out.pay.bills = Object.fromEntries(Object.entries(obj(c.pay.bills) ? c.pay.bills : {}).filter(([d, n]) => BILLS.includes(Number(d)) && Number.isInteger(n) && n > 0));
  }
  if (out.phase === "pay" && (!out.pay || !out.score)) throw 0;
  if (out.phase === "wait" && out.arriveT === null) out.arriveT = t;
  if (out.phase === "leave" && out.leaveT === null) out.leaveT = t;
  if (out.phase === "react" && out.reactUntil === null) out.reactUntil = t;
  return out;
}
function loadGuest(g) {
  if (!obj(g) || !ARCHETYPES[g.arch]) throw 0;
  const out = { at: num(g.at, 0, 3_600_000, 0), arch: g.arch, items: arr(g.items).slice(0, 30).map(loadItem), patienceMul: num(g.patienceMul, 0.5, 6, 1) };
  if (typeof g.tag === "string") out.tag = g.tag.slice(0, 12);
  if (typeof g.line === "string") out.line = g.line.slice(0, 300);
  if (obj(g.group)) out.group = { tip: int(g.group.tip, 0, 500, 0), flagOk: typeof g.group.flagOk === "string" ? g.group.flagOk : null, laterOk: obj(g.group.laterOk) && EVENT[g.group.laterOk.id] ? g.group.laterOk : null, okStars: int(g.group.okStars, 1, 5, 3) };
  if (!out.items.length) throw 0;
  if (typeof g.name === "string") out.name = g.name.slice(0, 40);
  if (g.pay === "exact" || g.pay === "transfer" || BILLS.includes(g.pay)) out.pay = g.pay;
  return out;
}
function loadDialog(d, ids) {
  if (!obj(d)) return null;
  if (d.kind === "complaint" && ids.has(d.cid)) return { kind: "complaint", cid: d.cid, stars: int(d.stars, 1, 5, 2), mistake: str(d.mistake, 20, "wrongFilling"), line: str(d.line, 300, "") };
  if (d.kind === "stockout" && (STOCK_IDS.includes(d.id) || d.id === "banh")) return { kind: "stockout", id: d.id, cid: Number.isInteger(d.cid) && ids.has(d.cid) ? d.cid : null };
  if (d.kind === "nochange" && ids.has(d.cid)) return { kind: "nochange", cid: d.cid, bill: int(d.bill, 1, 500, 100), price: int(d.price, 0, 2000, 0), line: str(d.line, 300, "") };
  if (d.kind === "stockout" && d.id === "que") return { kind: "stockout", id: "que", cid: Number.isInteger(d.cid) && ids.has(d.cid) ? d.cid : null };
  if (d.kind === "event") return loadEventDialog(d, ids);
  return null;
}
function loadEventDialog(d, ids) {
  if (!obj(d) || d.kind !== "event" || !EVENT[d.id] || !EVENT[d.id].nodes[d.node]) return null;
  const cid = Number.isInteger(d.cid) && ids && ids.has(d.cid) ? d.cid : null;
  const npc = NPCS[d.npc] ? d.npc : null;
  if (cid === null && !npc) return null;
  return { kind: "event", id: d.id, node: d.node, cid, npc, steps: int(d.steps, 0, 20, 0) };
}
function loadDrama(D) {
  const out = freshDrama();
  if (!obj(D)) return out;
  out.flags = flagMap(D.flags);
  out.queue = arr(D.queue).filter((q) => obj(q) && EVENT[q.id]).slice(0, 40).map((q) => ({ id: q.id, day: int(q.day, 0, BIG, 0), from: str(q.from, 12, "") }));
  out.seen = Object.fromEntries(Object.entries(obj(D.seen) ? D.seen : {}).filter(([k, v]) => EVENT[k] && Number.isInteger(v)));
  out.history = arr(D.history).filter(obj).slice(0, 40).map((h) => ({ day: int(h.day, 0, BIG, 1), id: str(h.id, 8, ""), choice: str(h.choice, 30, ""), label: str(h.label, 120, ""), line: str(h.line, 400, ""), who: str(h.who, 40, ""), rolled: h.rolled === "win" || h.rolled === "lose" ? h.rolled : null }));
  out.pending = loadEventDialog(D.pending, null);
  out.nextGuests = int(D.nextGuests, -4, 8, 0);
  out.nextArch = Object.fromEntries(Object.entries(obj(D.nextArch) ? D.nextArch : {}).filter(([a, n]) => ARCHETYPES[a] && Number.isInteger(n) && n > 0 && n < 20));
  out.recent = arr(D.recent).filter((x) => x === "good" || x === "other").slice(-6);
  if (RECIPE[D.demand]) out.demand = D.demand;
  return out;
}
const loadMod = (m) => {
  if (!obj(m) || typeof m.id !== "string") return null;
  const out = { id: m.id.slice(0, 40), until: int(m.until, 0, BIG, 0) };
  for (const k of ["price", "pate", "zone", "prepMax", "exchange", "patience", "sliceMs"]) if (typeof m[k] === "number" && Number.isFinite(m[k])) out[k] = Math.max(-500, Math.min(500, m[k]));
  if (typeof m.guests === "number") out.guests = int(m.guests, -10, 10, 0);
  else if (obj(m.guests)) out.guests = Object.fromEntries(Object.entries(m.guests).filter(([a, n]) => ARCHETYPES[a] && Number.isInteger(n)).map(([a, n]) => [a, Math.max(-5, Math.min(8, n))]));
  if (obj(m.cost)) out.cost = Object.fromEntries(Object.entries(m.cost).filter(([id, k]) => STOCK_IDS.includes(id) && typeof k === "number" && k > 0 && k < 5));
  return out;
};
function loadPreorder(p) {
  if (!obj(p)) return null;
  try {
    const items = arr(p.items).slice(0, 30).map(loadItem);
    if (!items.length) return null;
    return { id: int(p.id, 0, BIG, 0), day: int(p.day, 0, BIG, 0), name: str(p.name, 40, "Khách đặt trước"), arch: ARCHETYPES[p.arch] ? p.arch : "office", items, total: int(p.total, 0, 5000, 0),
      deposit: int(p.deposit, 0, 5000, 0), discount: num(p.discount, 0, 0.3, 0), tip: int(p.tip, 0, 500, 0), label: str(p.label, 40, "Đơn đặt trước"), dueMs: int(p.dueMs, 0, 240000, 60000),
      flagOk: typeof p.flagOk === "string" ? p.flagOk.slice(0, 40) : null, laterOk: obj(p.laterOk) && EVENT[p.laterOk.id] ? { id: p.laterOk.id, days: int(p.laterOk.days, 0, 30, 1) } : null, okStars: int(p.okStars, 1, 5, 4),
      ...(typeof p.contract === "string" ? { contract: p.contract.slice(0, 30) } : {}) };
  } catch { return null; }
}
const loadMoment = (m) => (obj(m) && typeof m.line === "string" ? { kind: str(m.kind, 20, "drama"), name: str(m.name, 60, ""), line: m.line.slice(0, 400), ...(m.outcome ? { outcome: str(m.outcome, 12, "") } : {}), ...(m.id ? { id: str(m.id, 20, "") } : {}) } : null);
function loadReply(x) {
  if (!obj(x) || typeof x.text !== "string") return null;
  return { kind: str(x.kind, 30, "legacy"), persona: PERSONAS[x.persona] ? x.persona : null, text: x.text.slice(0, 400), outcome: str(x.outcome, 12, "warm"),
    fx: arr(x.fx).filter((f) => typeof f === "string").slice(0, 8).map((f) => f.slice(0, 120)), day: int(x.day, 0, BIG, 0),
    comeback: arr(x.comeback).filter((c) => obj(c) && typeof c.line === "string").slice(0, 3).map((c) => ({ who: str(c.who, 40, ""), line: c.line.slice(0, 300), net: bool(c.net), ...(c.flip ? { flip: true } : {}) })) };
}
function loadBoard(b, ids) {
  if (!obj(b)) throw 0;
  const cid = Number.isInteger(b.cid) && ids.has(b.cid) ? b.cid : null;
  const loaf = cid !== null && b.loaf ? loadLoaf(b.loaf, false) : null;
  return { cid, item: int(b.item, 0, 5, 0), loaf, step: loaf ? int(b.step, -1, 7, 0) : -1, hist: loaf ? arr(b.hist).slice(-20).filter((h) => obj(h) && typeof h.loaf === "string" && Number.isInteger(h.step)).map((h) => ({ step: h.step, loaf: h.loaf })) : [] };
}
function loadShift(sh, s) {
  if (!obj(sh) || sh.status !== "open") return null;
  try {
    const t = num(sh.t, 0, 3_600_000, 0);
    const customers = arr(sh.customers).slice(0, 12).map((c) => loadCustomer(c, t));
    const ids = new Set(customers.map((c) => c.id));
    const slots = Math.min((OVENS[s.oven] || OVENS.mini).slots, s.challenge?.day === s.day && CHALLENGE_BY_ID[s.challenge.id]?.mods.slots || 9);
    const oven = Array.from({ length: slots }, (_, i) => { const b = arr(sh.oven)[i]; return obj(b) ? { n: int(b.n, 1, 12, 4), t0: num(b.t0, -600000, t + 600000, t), said: obj(b.said) ? { golden: bool(b.said.golden), dark: bool(b.said.dark), burnt: bool(b.said.burnt) } : {}, ...(b.kind === "que" ? { kind: "que" } : {}) } : null; });
    const boards = arr(sh.boards).slice(0, 3).map((b) => loadBoard(b, ids));
    const sel = int(sh.sel, 0, Math.max(0, boards.length - 1), 0);
    if (!boards.length) throw 0;
    const paying = Number.isInteger(sh.paying) && customers.some((c) => c.id === sh.paying && c.phase === "pay") ? sh.paying : null;
    const stats = obj(sh.stats) ? sh.stats : {};
    const S = (k, d = 0) => num(stats[k], 0, BIG, d);
    const out = {
      status: "open", t, day: int(sh.day, 1, BIG, s.day), phase: ["sang", "trua", "chieu"].includes(sh.phase) ? sh.phase : "sang",
      schedule: arr(sh.schedule).slice(0, 80).map(loadGuest), customers, nextCid: int(sh.nextCid, 1, BIG, Math.max(0, ...ids) + 1), boards, sel, oven,
      case: arr(sh.case).slice(0, 50).filter(obj).map((l) => ({ id: int(l.id, 0, BIG, 0), crisp: num(l.crisp, 0, 100, 60), src: SRC.has(l.src) ? l.src : "oven", ...(l.dark ? { dark: true } : {}) })),
      que: int(sh.que, 0, 200, 0), moments: arr(sh.moments).map(loadMoment).filter(Boolean).slice(-40), lastServe: null, burntAt: typeof sh.burntAt === "number" ? num(sh.burntAt, 0, t, 0) : null,
      helperUntil: num(sh.helperUntil, 0, t + 600000, 0), followers0: int(sh.followers0, 0, BIG, 0), witness: obj(sh.witness) && ["ran", "swapYes", "swapNo"].includes(sh.witness.kind) ? { kind: sh.witness.kind, t: num(sh.witness.t, 0, t, 0) } : null,
      drama: obj(sh.drama) ? { count: int(sh.drama.count, 0, 9, 0), max: int(sh.drama.max, 0, 9, 1), nextAt: num(sh.drama.nextAt, 0, BIG, 30000) } : { count: 0, max: 1, nextAt: 30000 },
      dramaDone: int(sh.dramaDone, 0, 50, 0), len: int(sh.len, 240000, 300000, 240000), cook: loadCook(sh.cook, s, t),
      missions: arr(sh.missions).filter(obj).slice(0, 3).map((m) => ({ id: str(m.id, 20, ""), kind: str(m.kind, 20, ""), text: str(m.text, 120, ""), n: int(m.n, 1, 10000, 1), prog: int(m.prog, 0, 10000, 0), done: bool(m.done), reward: { xp: int(m.reward?.xp, 0, 100, 0), money: int(m.reward?.money, 0, 100, 0) } })),
      dialog: loadDialog(sh.dialog, ids), away: obj(sh.away) && ["run", "si", "gas", "change", "event"].includes(sh.away.kind) ? { until: num(sh.away.until, 0, t + 30000, t), kind: sh.away.kind, ...(STOCK_IDS.includes(sh.away.id) ? { id: sh.away.id } : {}), ...(Number.isInteger(sh.away.cid) ? { cid: sh.away.cid } : {}) } : null,
      deliveries: arr(sh.deliveries).slice(0, 5).filter((d) => obj(d) && STOCK_IDS.includes(d.id)).map((d) => ({ at: num(d.at, 0, t + 60000, t), id: d.id, want: STOCK_IDS.includes(d.want) ? d.want : d.id, n: int(d.n, 1, 60, 1) })),
      paying, usedLines: arr(sh.usedLines).filter((x) => typeof x === "string").slice(-120), lowSaid: obj(sh.lowSaid) ? sh.lowSaid : {},
      waste: Object.fromEntries(Object.entries(obj(sh.waste) ? sh.waste : {}).filter(([, v]) => typeof v === "number" && v >= 0 && v < BIG)), wasteLog: arr(sh.wasteLog).filter((x) => typeof x === "string").slice(-30),
      fee: int(sh.fee, 0, 1000, 0), tutorial: bool(sh.tutorial), consignUsed: bool(sh.consignUsed), settleQueue: arr(sh.settleQueue).filter((q) => obj(q) && ids.has(q.cid)).map((q) => ({ cid: q.cid, mode: "exact-change" })), feedFrom: int(sh.feedFrom, 0, BIG, 0),
      stats: { served: S("served"), loaves: S("loaves"), revenue: S("revenue"), cogs: S("cogs"), batches: S("batches"), burntBatches: S("burntBatches"), goldenPulls: S("goldenPulls"), toasts: S("toasts"),
        lost: S("lost"), timeouts: S("timeouts"), stars: arr(stats.stars).filter((x) => Number.isInteger(x) && x >= 1 && x <= 5).slice(0, 200), changeRight: S("changeRight"), changeWrong: S("changeWrong"),
        changeLoss: S("changeLoss"), restockSpent: S("restockSpent"), rescueSpent: S("rescueSpent"), xp: S("xp"), consignRepaid: S("consignRepaid"), owed: S("owed"),
        multi: S("multi"), preorders: S("preorders"), preLate: S("preLate"), staleSold: S("staleSold"), burntMeat: S("burntMeat"), boDuong: S("boDuong"), eventCash: num(stats.eventCash, -BIG, BIG, 0), missionCash: S("missionCash"), lostSang: S("lostSang"), levelUps: arr(stats.levelUps).filter(Number.isInteger).slice(0, 20),
        mistakes: Object.fromEntries(Object.entries(obj(stats.mistakes) ? stats.mistakes : {}).filter(([, v]) => Number.isInteger(v) && v >= 0)) },
    };
    if (out.dialog?.kind === "nochange" && !customers.some((c) => c.id === out.dialog.cid && c.phase === "pay")) out.dialog = null;
    for (const c of customers) if (c.phase === "pay" && out.paying === null && !out.dialog && c.pay?.kind === "bill" && !out.settleQueue.some((q) => q.cid === c.id)) out.paying = c.id;
    return out;
  } catch { return null; }
}

/** Đọc chuỗi JSON bản lưu ⇒ trạng thái hợp lệ, hoặc null nếu hỏng. Kẹp mọi số. */
export function loadSave(raw) {
  let d;
  try { d = typeof raw === "string" ? JSON.parse(raw) : raw; } catch { return null; }
  if (!obj(d) || !Number.isInteger(d.v) || d.v < 1 || d.v > SAVE_VERSION) return null;
  for (let v = d.v; v < SAVE_VERSION; v++) { if (!MIGRATIONS[v]) return null; d = MIGRATIONS[v](d); }
  const base = createState(int(d.seed, 0, 2 ** 32 - 1, 1));
  const s = base;
  s.rng = int(d.rng, 0, 2 ** 32 - 1, s.seed);
  s.shopName = str(d.shopName, 32, s.shopName);
  s.introSeen = bool(d.introSeen); s.tutorialDone = bool(d.tutorialDone);
  s.money = int(d.money, 0, BIG, START_MONEY);
  s.float = Object.fromEntries(FLOAT_BILLS.map((b) => [b, int(d.float?.[b], 0, 10000, 0)]).filter(([, n]) => n > 0));
  while (floatValue(s.float) > s.money) { const b = FLOAT_BILLS.slice().reverse().find((x) => s.float[x] > 0); s.float[b]--; if (!s.float[b]) delete s.float[b]; }
  s.xp = int(d.xp, 0, BIG, 0); s.level = levelForXp(s.xp);
  s.rep = num(d.rep, 0, 100, 50); s.day = int(d.day, 1, BIG, 1);
  s.oven = OVENS[d.oven] ? d.oven : "mini"; s.shop = bool(d.shop);
  for (const id of STOCK_IDS) s.stock[id] = int(d.stock?.[id], 0, 100000, 0);
  if (obj(d.stats)) for (const k of ["loaves", "revenue", "shifts", "bestProfit", "spentStock"]) s.stats[k] = num(d.stats[k], -BIG, BIG, 0);
  if (obj(d.stats?.reviews)) for (const k of ["1", "2", "3", "4", "5"]) if (Number.isInteger(d.stats.reviews[k])) s.stats.reviews[k] = Math.max(0, d.stats.reviews[k]);
  s.owned = Object.fromEntries(Object.entries(obj(d.owned) ? d.owned : {}).filter(([k, v]) => typeof k === "string" && v === true).slice(0, 60));
  s.regulars = Object.fromEntries(Object.entries(obj(d.regulars) ? d.regulars : {}).filter(([, r]) => obj(r)).slice(0, 40).map(([k, r]) => [k.slice(0, 40), { visits: int(r.visits, 0, BIG, 0), good: int(r.good, 0, BIG, 0) }]));
  s.feed = arr(d.feed).filter(obj).slice(0, 40).map((r) => ({ id: int(r.id, 0, BIG, 0), day: int(r.day, 1, BIG, 1), name: str(r.name, 40, "Khách"), arch: ARCHETYPES[r.arch] ? r.arch : "student", stars: int(r.stars, 1, 5, 3), line: str(r.line, 300, ""), reason: str(r.reason, 30, ""),
    recipe: RECIPE[r.recipe] ? r.recipe : null, src: r.src === "mang" ? "mang" : "quan", reply: loadReply(r.reply) }));
  s.nextReviewId = int(d.nextReviewId, 0, BIG, s.feed.length); s.nextLoaf = int(d.nextLoaf, 0, BIG, 0);
  s.debts = Object.fromEntries(Object.entries(obj(d.debts) ? d.debts : {}).filter(([, v]) => typeof v === "number" && v >= 0 && v < BIG));
  s.consign = obj(d.consign) && d.consign.owed > 0 ? { owed: int(d.consign.owed, 1, 100000, 1) } : null;
  s.daily = obj(d.daily) ? { exchanged: int(d.daily.exchanged, 0, 1000, 0), consigned: bool(d.daily.consigned), borrowed: bool(d.daily.borrowed), gasBorrowed: bool(d.daily.gasBorrowed) } : {};
  s.prep = obj(d.prep) ? { batches: int(d.prep.batches, 0, 10, 0), burnt: int(d.prep.burnt, 0, 100, 0), ...(d.prep.golden ? { golden: true } : {}), loaves: arr(d.prep.loaves).filter(obj).slice(0, 20).map((l) => ({ crisp: num(l.crisp, 0, 100, 60), dark: bool(l.dark) })) } : null;
  s.usedDay = arr(d.usedDay).filter((x) => typeof x === "string").slice(-120);
  s.challenge = obj(d.challenge) && CHALLENGE_BY_ID[d.challenge.id] ? { id: d.challenge.id, day: int(d.challenge.day, 0, BIG, 0) } : null;
  s.shift = loadShift(d.shift, s);
  s.lastSummary = obj(d.lastSummary) ? { ...d.lastSummary, seen: bool(d.lastSummary.seen) } : null;
  // M3 + M4
  s.owner = { persona: PERSONAS[d.owner?.persona] ? d.owner.persona : null, lastPersona: PERSONAS[d.owner?.lastPersona] ? d.owner.lastPersona : null,
    switches: arr(d.owner?.switches).filter((x) => obj(x) && PERSONAS[x.to]).slice(-20).map((x) => ({ day: int(x.day, 0, BIG, 1), from: PERSONAS[x.from] ? x.from : null, to: x.to })) };
  s.followers = int(d.followers, 0, BIG, 0); s.buzz = num(d.buzz, 0, 20, 0); s.rating = typeof d.rating === "number" ? num(d.rating, 1, 5, null) : null;
  s.promises = arr(d.promises).filter(obj).slice(0, 10).map((p) => ({ day: int(p.day, 0, BIG, 0), name: str(p.name, 40, "Khách"), reviewId: int(p.reviewId, 0, BIG, 0) }));
  s.returning = arr(d.returning).filter((g) => obj(g) && ARCHETYPES[g.arch]).slice(0, 6).map((g) => ({ name: str(g.name, 40, "Khách"), arch: g.arch, recipe: RECIPE[g.recipe] ? g.recipe : "pate-bo", persona: PERSONAS[g.persona] ? g.persona : "hien", day: int(g.day, 0, BIG, 0) }));
  s.drama = loadDrama(d.drama);
  s.journal = arr(d.journal).filter(obj).slice(0, 40).map((j) => ({ day: int(j.day, 0, BIG, 1), kind: j.kind === "cart" ? "cart" : "day", headline: str(j.headline, 300, ""), moment: str(j.moment, 400, ""), loaves: int(j.loaves, 0, BIG, 0), profit: num(j.profit, -BIG, BIG, 0), stars: num(j.stars, 0, 5, 0), shop: str(j.shop, 40, "") }));
  s.cartMemory = obj(d.cartMemory) ? { days: int(d.cartMemory.days, 0, BIG, 0), loaves: int(d.cartMemory.loaves, 0, BIG, 0), revenue: num(d.cartMemory.revenue, 0, BIG, 0), best: num(d.cartMemory.best, -BIG, BIG, 0), line: str(d.cartMemory.line, 300, ""), movedDay: int(d.cartMemory.movedDay, 0, BIG, 0) } : null;
  s.stale = obj(d.stale) && d.stale.n > 0 ? { n: int(d.stale.n, 1, 20, 1), choice: ["sell", "give", "toss"].includes(d.stale.choice) ? d.stale.choice : null } : null;
  s.mods = arr(d.mods).map(loadMod).filter(Boolean).slice(0, 30);
  s.placement = Object.fromEntries(Object.entries(obj(d.placement) ? d.placement : {}).filter(([id, p]) => DECOR[id] && Array.isArray(p) && p.length === 2 && p.every(Number.isFinite)).map(([id, p]) => [id, [Math.round(p[0]), Math.round(p[1])]]));
  s.rank = int(d.rank, 0, 8, 0); s.pate = int(d.pate, 0, 3, 0);
  s.house = obj(d.house) && typeof d.house.name === "string" ? { name: d.house.name.slice(0, 28), spreads: lvlMap(d.house.spreads, SPREAD_KEYS), fills: arr(d.house.fills).filter((x) => FILL_KEYS.includes(x)).slice(0, 4), price: int(d.house.price, 10, 300, 48), mul: num(d.house.mul, 1, 3, 2) } : null;
  if (s.house && !s.house.fills.length) s.house = null;
  s.preorders = arr(d.preorders).map(loadPreorder).filter(Boolean).slice(-6);
  s.nextPre = int(d.nextPre, 0, BIG, 0);
  s.offers = obj(d.offers) && Array.isArray(d.offers.list) ? { day: int(d.offers.day, 0, BIG, 0), list: d.offers.list.filter(obj).slice(0, 3).map((o) => ({ ...o, taken: bool(o.taken) })) } : null;
  s.promo = obj(d.promo) && typeof d.promo.kind === "string" ? { day: int(d.promo.day, 0, BIG, 0), kind: d.promo.kind } : null;
  s.helperDay = int(d.helperDay, 0, BIG, 0); s.fairDay = int(d.fairDay, 0, BIG, 0); s.challengeDay = int(d.challengeDay, 0, BIG, 0);
  s.badges = Object.fromEntries(Object.entries(obj(d.badges) ? d.badges : {}).filter(([k, v]) => BADGE[k] && Number.isInteger(v)).map(([k, v]) => [k, int(v, 1, BIG, 1)]));
  s.contracts = loadContracts(d.contracts); s.lots = loadLots(d.lots); s.fairCount = int(d.fairCount, 0, BIG, 0);
  s.weather = obj(d.weather) && ["rain", "clear"].includes(d.weather.kind) ? { day: int(d.weather.day, 0, BIG, 0), kind: d.weather.kind } : null;
  if (obj(d.stats)) for (const k of ["mai", "spentGear", "deposits", "missions", "challenges"]) if (typeof d.stats[k] === "number") s.stats[k] = num(d.stats[k], 0, BIG, 0);
  s.owned = Object.fromEntries(Object.entries(s.owned).filter(([k]) => EQUIPMENT[k] || DECOR[k] || SIGNBOARDS[k] || k === "tray-6" || k === "warm-case"));
  if (s.owned["electric-oven"]) s.oven = "electric";
  else if (s.shop && s.oven === "mini") s.oven = "gas";
  // ca đang mở: số thớt theo đồ đã mua
  if (s.shift) { const want = s.owned["board-3"] ? 3 : s.owned["board-2"] ? 2 : 1; while (s.shift.boards.length < want) s.shift.boards.push({ cid: null, item: 0, loaf: null, step: -1, hist: [] }); }
  return s;
}
export const dump = (s) => JSON.stringify(s);
export function saveVersion(raw) { try { const d = JSON.parse(raw); return obj(d) && Number.isInteger(d.v) ? d.v : null; } catch { return null; } }
