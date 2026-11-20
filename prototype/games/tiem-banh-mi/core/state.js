// Trạng thái tiệm: tạo mới, đọc + kẹp bản lưu, ghi. Thuần. Khoá lưu "wgp.tiembanhmi.v1" (save.js), phiên bản trong bản lưu: v.
// Quy tắc đọc: số bị kẹp về miền hợp lệ, id lạ bị bỏ; ca dở dang được giữ nếu cấu trúc hợp lệ, ngược lại bỏ riêng ca (giữ tiền / cấp / kho).
// MIGRATIONS[v] nâng v → v+1 (chưa có bản nào cần nâng; khung giữ sẵn như Trà Sữa). save.js giữ bản sao bản cũ trước khi nâng.
import { STOCK_IDS, START_MONEY, START_STOCK, START_FLOAT, FLOAT_BILLS, RECIPE, OVENS, BILLS, WRAPS } from "../data/economy.js?v=b1";
import { ARCHETYPES } from "../data/customers.js?v=b1";
import { QUIRKS } from "../data/quirks.js?v=b1";
import { levelForXp } from "./shift.js?v=b1";
import { floatValue } from "./money.js?v=b1";

export const SAVE_VERSION = 1;
export const MIGRATIONS = {};

export function createState(seed = 20261119) {
  return {
    v: SAVE_VERSION, seed: seed >>> 0, rng: seed >>> 0, shopName: "Bánh Mì Nhà Mình", introSeen: false, tutorialDone: false,
    money: START_MONEY, float: { ...START_FLOAT }, xp: 0, level: 1, rep: 50, day: 1, oven: "mini", shop: false,
    stock: Object.fromEntries(STOCK_IDS.map((id) => [id, START_STOCK[id] || 0])),
    stats: { loaves: 0, revenue: 0, shifts: 0, bestProfit: 0, spentStock: 0, reviews: {} },
    owned: {}, regulars: {}, feed: [], nextReviewId: 0, nextLoaf: 0, debts: {}, consign: null, daily: {}, prep: null,
    usedDay: [], shift: null, lastSummary: null,
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
  if (it.recipe === "bachuc") out.target = int(it.target, 10, 200, 30);
  return out;
}
function loadLoaf(l, built) {
  if (!obj(l)) throw 0;
  const out = {
    spreads: lvlMap(l.spreads, SPREAD_KEYS), fills: arr(l.fills).filter((x) => FILL_KEYS.includes(x)), veg: boolMap(l.veg, VEG_KEYS), ot: int(l.ot, 0, 3, 0),
    sauces: boolMap(l.sauces, SAUCE_KEYS), wrap: WRAPS[l.wrap] ? l.wrap : null, crisp: num(l.crisp, 0, 100, 60), burnt: bool(l.burnt), dark: bool(l.dark),
    toasted: bool(l.toasted), src: l.src === "si" ? "si" : "oven",
    used: Object.fromEntries(Object.entries(obj(l.used) ? l.used : {}).filter(([k, v]) => STOCK_IDS.includes(k) && Number.isInteger(v) && v > 0 && v < 50)),
  };
  if (built) { out.item = int(l.item, 0, 6, 0); return out; }
  out.id = int(l.id, 0, BIG, 0); out.sliced = bool(l.sliced);
  out.toastT0 = typeof l.toastT0 === "number" && Number.isFinite(l.toastT0) ? l.toastT0 : null;
  if (l.readyWarned) out.readyWarned = true;
  if (l.burntWarned) out.burntWarned = true;
  return out;
}
const PHASE = new Set(["enter", "wait", "pay", "react", "leave"]);
function loadCustomer(c, t) {
  if (!obj(c) || !Number.isInteger(c.id) || !ARCHETYPES[c.arch] || !PHASE.has(c.phase)) throw 0;
  const items = arr(c.items).slice(0, 6).map(loadItem);
  if (!items.length) throw 0;
  const filled = items.map((_, i) => (c.filled?.[i] ? loadLoaf(c.filled[i], true) : null));
  const A = ARCHETYPES[c.arch];
  const out = {
    id: c.id, arch: c.arch, sprite: A.sprite, name: str(c.name, 40, "Khách"), self: str(c.self, 10, A.self), call: str(c.call, 10, A.call), items, filled,
    phase: c.phase, t0: num(c.t0, 0, t, t), arriveT: c.arriveT === null ? null : num(c.arriveT, -600000, t, t), patience: int(c.patience, 5000, 600000, A.patience),
    spot: int(c.spot, 0, 5, 0), mood: str(c.mood, 20, "waiting"), say: obj(c.say) && typeof c.say.text === "string" ? { text: c.say.text.slice(0, 300), at: num(c.say.at, 0, t, t) } : null,
    orderLine: str(c.orderLine, 300, ""), nhuCu: bool(c.nhuCu), payPlan: c.payPlan === "exact" || c.payPlan === "transfer" || BILLS.includes(c.payPlan) ? c.payPlan : null,
    leaveT: c.leaveT === null || c.leaveT === undefined ? null : num(c.leaveT, 0, t, t), reactUntil: c.reactUntil === null || c.reactUntil === undefined ? null : num(c.reactUntil, 0, t + 5000, t),
    remade: bool(c.remade), impatientSaid: bool(c.impatientSaid), discount: num(c.discount, 0, 1, 0), pinned: bool(c.pinned), free: bool(c.free),
    pay: null, score: null, stars: c.stars ? int(c.stars, 1, 5, 3) : undefined,
  };
  if (c.swapped) out.swapped = String(c.swapped).slice(0, 20);
  if (obj(c.score)) out.score = { points: int(c.score.points, 0, 100, 50), stars: int(c.score.stars, 1, 5, 3), time: int(c.score.time, 0, 20, 10),
    per: arr(c.score.per).slice(0, 6).map((p) => ({ recipe: num(p?.recipe, 0, 50, 0), crisp: num(p?.crisp, 0, 15, 0), quirk: num(p?.quirk, 0, 15, 0), errors: arr(p?.errors).filter((e) => typeof e === "string").slice(0, 20), mistakes: arr(p?.mistakes).filter((e) => typeof e === "string").slice(0, 11), quirkOk: [] })),
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
  const out = { at: num(g.at, 0, 3_600_000, 0), arch: g.arch, items: arr(g.items).slice(0, 6).map(loadItem), patienceMul: num(g.patienceMul, 0.5, 3, 1) };
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
  return null;
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
    const customers = arr(sh.customers).slice(0, 8).map((c) => loadCustomer(c, t));
    const ids = new Set(customers.map((c) => c.id));
    const slots = (OVENS[s.oven] || OVENS.mini).slots;
    const oven = Array.from({ length: slots }, (_, i) => { const b = arr(sh.oven)[i]; return obj(b) ? { n: int(b.n, 1, 12, 4), t0: num(b.t0, -600000, t, t), said: obj(b.said) ? { golden: bool(b.said.golden), dark: bool(b.said.dark), burnt: bool(b.said.burnt) } : {} } : null; });
    const boards = arr(sh.boards).slice(0, 3).map((b) => loadBoard(b, ids));
    if (!boards.length) throw 0;
    const paying = Number.isInteger(sh.paying) && customers.some((c) => c.id === sh.paying && c.phase === "pay") ? sh.paying : null;
    const stats = obj(sh.stats) ? sh.stats : {};
    const S = (k, d = 0) => num(stats[k], 0, BIG, d);
    const out = {
      status: "open", t, day: int(sh.day, 1, BIG, s.day), phase: ["sang", "trua", "chieu"].includes(sh.phase) ? sh.phase : "sang",
      schedule: arr(sh.schedule).slice(0, 60).map(loadGuest), customers, nextCid: int(sh.nextCid, 1, BIG, Math.max(0, ...ids) + 1), boards, sel: 0, oven,
      case: arr(sh.case).slice(0, 20).filter(obj).map((l) => ({ id: int(l.id, 0, BIG, 0), crisp: num(l.crisp, 0, 100, 60), src: l.src === "si" ? "si" : "oven", ...(l.dark ? { dark: true } : {}) })),
      dialog: loadDialog(sh.dialog, ids), away: obj(sh.away) && ["run", "si", "gas", "change"].includes(sh.away.kind) ? { until: num(sh.away.until, 0, t + 30000, t), kind: sh.away.kind, ...(STOCK_IDS.includes(sh.away.id) ? { id: sh.away.id } : {}), ...(Number.isInteger(sh.away.cid) ? { cid: sh.away.cid } : {}) } : null,
      deliveries: arr(sh.deliveries).slice(0, 5).filter((d) => obj(d) && STOCK_IDS.includes(d.id)).map((d) => ({ at: num(d.at, 0, t + 60000, t), id: d.id, want: STOCK_IDS.includes(d.want) ? d.want : d.id, n: int(d.n, 1, 60, 1) })),
      paying, usedLines: arr(sh.usedLines).filter((x) => typeof x === "string").slice(-120), lowSaid: obj(sh.lowSaid) ? sh.lowSaid : {},
      waste: Object.fromEntries(Object.entries(obj(sh.waste) ? sh.waste : {}).filter(([, v]) => typeof v === "number" && v >= 0 && v < BIG)), wasteLog: arr(sh.wasteLog).filter((x) => typeof x === "string").slice(-30),
      fee: int(sh.fee, 0, 1000, 0), tutorial: bool(sh.tutorial), consignUsed: bool(sh.consignUsed), settleQueue: arr(sh.settleQueue).filter((q) => obj(q) && ids.has(q.cid)).map((q) => ({ cid: q.cid, mode: "exact-change" })), feedFrom: int(sh.feedFrom, 0, BIG, 0),
      stats: { served: S("served"), loaves: S("loaves"), revenue: S("revenue"), cogs: S("cogs"), batches: S("batches"), burntBatches: S("burntBatches"), goldenPulls: S("goldenPulls"), toasts: S("toasts"),
        lost: S("lost"), timeouts: S("timeouts"), stars: arr(stats.stars).filter((x) => Number.isInteger(x) && x >= 1 && x <= 5).slice(0, 200), changeRight: S("changeRight"), changeWrong: S("changeWrong"),
        changeLoss: S("changeLoss"), restockSpent: S("restockSpent"), rescueSpent: S("rescueSpent"), xp: S("xp"), consignRepaid: S("consignRepaid"), owed: S("owed"),
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
  s.feed = arr(d.feed).filter(obj).slice(0, 60).map((r) => ({ id: int(r.id, 0, BIG, 0), day: int(r.day, 1, BIG, 1), name: str(r.name, 40, "Khách"), arch: ARCHETYPES[r.arch] ? r.arch : "student", stars: int(r.stars, 1, 5, 3), line: str(r.line, 300, ""), reason: str(r.reason, 30, "") }));
  s.nextReviewId = int(d.nextReviewId, 0, BIG, s.feed.length); s.nextLoaf = int(d.nextLoaf, 0, BIG, 0);
  s.debts = Object.fromEntries(Object.entries(obj(d.debts) ? d.debts : {}).filter(([, v]) => typeof v === "number" && v >= 0 && v < BIG));
  s.consign = obj(d.consign) && d.consign.owed > 0 ? { owed: int(d.consign.owed, 1, 100000, 1) } : null;
  s.daily = obj(d.daily) ? { exchanged: int(d.daily.exchanged, 0, 1000, 0), consigned: bool(d.daily.consigned), borrowed: bool(d.daily.borrowed), gasBorrowed: bool(d.daily.gasBorrowed) } : {};
  s.prep = obj(d.prep) ? { batches: int(d.prep.batches, 0, 10, 0), burnt: int(d.prep.burnt, 0, 100, 0), loaves: arr(d.prep.loaves).filter(obj).slice(0, 20).map((l) => ({ crisp: num(l.crisp, 0, 100, 60), dark: bool(l.dark) })) } : null;
  s.usedDay = arr(d.usedDay).filter((x) => typeof x === "string").slice(-120);
  s.shift = loadShift(d.shift, s);
  s.lastSummary = obj(d.lastSummary) ? { ...d.lastSummary, seen: bool(d.lastSummary.seen) } : null;
  return s;
}
export const dump = (s) => JSON.stringify(s);
export function saveVersion(raw) { try { const d = JSON.parse(raw); return obj(d) && Number.isInteger(d.v) ? d.v : null; } catch { return null; } }
