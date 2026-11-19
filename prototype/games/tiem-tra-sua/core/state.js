// Trạng thái tiệm: tạo mới, đọc + kẹp bản lưu, ghi. Thuần. Bản lưu v1 (khoá "wgp.tiemtrasua.v1", xem save.js).
// Quy tắc đọc: số bị kẹp về miền hợp lệ, id lạ bị bỏ, ca dở dang được giữ (ly đang pha, phiếu, khách) nếu cấu trúc hợp lệ,
// ngược lại bỏ riêng ca (giữ tiền / cấp / kho). MIGRATIONS[v] nâng v → v+1 khi có bản lưu mới (Milestone 3+).
import { STOCK, STOCK_IDS, START_CAPACITY, START_STOCK, STEPS, choice } from "../data/ingredients.js";
import { RECIPE } from "../data/recipes.js";
import { ARCHETYPES } from "../data/customers.js";
import { START_MONEY, START_REP, SPOTS } from "../data/shift.js";
import { levelForXp } from "./progression.js";
import { EQUIPMENT, BATCHES, PEARL_RAW } from "../data/equipment.js";
import { capacityFor } from "./equipment.js";

export const SAVE_VERSION = 1;
export const MIGRATIONS = {}; // { 1: (raw) => rawV2 } khi có v2

export function createState(seed = 20261119) {
  return {
    v: SAVE_VERSION, seed: seed >>> 0, rng: seed >>> 0, shopName: "Tiệm Nhà Mình", introSeen: false, tutorialDone: false,
    money: START_MONEY, xp: 0, level: 1, rep: START_REP, day: 1, capacity: START_CAPACITY,
    stock: Object.fromEntries(STOCK_IDS.map((id) => [id, START_STOCK[id] || 0])),
    stats: { cups: 0, revenue: 0, shifts: 0, bestProfit: 0, spentStock: 0, reviews: {} },
    owned: {}, carryPearls: 0,
    shift: null, lastSummary: null, journal: [],
  };
}

const num = (v, lo, hi, d) => (typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d);
const int = (v, lo, hi, d) => Math.floor(num(v, lo, hi, d));
const str = (v, max, d) => (typeof v === "string" && v.trim() ? v.slice(0, max) : d);
const obj = (v) => v && typeof v === "object" && !Array.isArray(v);
const BIG = 1e9;

function loadCup(c) {
  if (!obj(c) || !Array.isArray(c.steps) || c.steps.length > STEPS.length) return null;
  const steps = [];
  for (let i = 0; i < c.steps.length; i++) {
    const st = c.steps[i];
    if (!obj(st) || st.step !== STEPS[i] || !choice(st.step, st.id)) return null;
    steps.push({ step: st.step, id: st.id });
  }
  if (!steps.length) return null;
  const sealed = steps[steps.length - 1].step === "lid";
  return { steps, sealed, forCid: Number.isInteger(c.forCid) ? c.forCid : null };
}

const PHASES = new Set(["enter", "wait", "react", "leave"]);
function loadCustomer(c, t) {
  if (!obj(c) || !Number.isInteger(c.id) || !ARCHETYPES[c.arch] || !RECIPE[c.recipe] || !PHASES.has(c.phase)) return null;
  const o = c.order;
  if (!obj(o) || !choice("base", o.base) || !choice("add", o.add) || !choice("sugar", o.sugar) || !choice("ice", o.ice) || !choice("topping", o.topping)) return null;
  const spot = int(c.spot, 0, SPOTS.length - 1, 0);
  const out = {
    id: c.id, arch: c.arch, sprite: ARCHETYPES[c.arch].sprite, name: str(c.name, 40, "Khách"), recipe: c.recipe,
    order: { base: o.base, add: o.add, sugar: o.sugar, ice: o.ice, topping: o.topping },
    price: int(c.price, 0, 999, RECIPE[c.recipe].price), patience: int(c.patience, 5000, 600000, ARCHETYPES[c.arch].patience),
    bonus: int(c.bonus, 0, 600000, 0), spot, t0: num(c.t0, 0, t, t), arriveT: c.arriveT === null ? null : num(c.arriveT, 0, t, t),
    phase: c.phase, mood: str(c.mood, 20, "waiting"), pinned: !!c.pinned, impatientSaid: !!c.impatientSaid, remade: !!c.remade,
    say: obj(c.say) && typeof c.say.text === "string" ? { text: c.say.text.slice(0, 240), at: num(c.say.at, 0, t, t) } : null,
    leaveT: c.leaveT === null ? null : num(c.leaveT, 0, t, t), reactUntil: c.reactUntil === null ? null : num(c.reactUntil, 0, t + 10000, t),
    review: obj(c.review) ? { stars: int(c.review.stars, 1, 5, 3), line: str(c.review.line, 240, ""), reason: str(c.review.reason, 30, "") } : null,
    orderLine: str(c.orderLine, 240, ""),
  };
  if (out.phase === "wait" && out.arriveT === null) out.arriveT = t;
  if (out.phase === "leave" && out.leaveT === null) out.leaveT = t;
  if (out.phase === "react" && out.reactUntil === null) out.reactUntil = t;
  return out;
}

function loadShift(sh) {
  if (!obj(sh) || sh.status !== "open") return null;
  const t = num(sh.t, 0, 3_600_000, 0);
  const customers = [];
  for (const c of Array.isArray(sh.customers) ? sh.customers.slice(0, 8) : []) {
    const cc = loadCustomer(c, t);
    if (!cc) return null;
    customers.push(cc);
  }
  const schedule = [];
  for (const g of Array.isArray(sh.schedule) ? sh.schedule.slice(0, 20) : []) {
    if (!obj(g) || !ARCHETYPES[g.arch] || !RECIPE[g.recipe] || !choice("sugar", g.sugar) || !choice("ice", g.ice)) return null;
    schedule.push({ at: num(g.at, 0, 3_600_000, t), arch: g.arch, name: str(g.name, 40, "Khách"), recipe: g.recipe, sugar: g.sugar, ice: g.ice });
  }
  const Lg = obj(sh.ledger) ? sh.ledger : {};
  const ledger = {};
  for (const k of ["revenue", "cogs", "waste", "fee", "restock", "cups", "served", "lost", "refunds", "remakes", "pearlWaste"]) ledger[k] = int(Lg[k], 0, BIG, 0);
  const K = obj(sh.kitchen) ? sh.kitchen : {};
  const kitchen = {
    ready: int(K.ready, 0, 99, 0),
    batches: (Array.isArray(K.batches) ? K.batches : []).filter((b) => obj(b) && BATCHES[b.size]).slice(0, 2)
      .map((b) => ({ size: b.size, ms: BATCHES[b.size].ms, doneAt: num(b.doneAt, 0, t + BATCHES[b.size].ms, t + BATCHES[b.size].ms) })),
  };
  const ids = new Set(customers.map((c) => c.id));
  let dialog = null;
  if (obj(sh.dialog) && sh.dialog.kind === "complaint" && ids.has(sh.dialog.cid)) {
    dialog = { kind: "complaint", cid: sh.dialog.cid, cost: int(sh.dialog.cost, 0, 999, 0), stars: int(sh.dialog.stars, 1, 2, 1),
      raw: int(sh.dialog.raw, 0, 100, 0), errors: Array.isArray(sh.dialog.errors) ? sh.dialog.errors.filter((e) => typeof e === "string").slice(0, 10) : [] };
  }
  return {
    day: int(sh.day, 1, 1e6, 1), t, duration: int(sh.duration, 30000, 600000, 180000), patienceMult: num(sh.patienceMult, 0.5, 3, 1),
    hints: !!sh.hints, tutorial: !!sh.tutorial, status: "open", schedule, planned: int(sh.planned, 0, 40, schedule.length + customers.length),
    customers, nextCid: Math.max(int(sh.nextCid, 1, 1e6, 1), ...customers.map((c) => c.id + 1)), active: ids.has(sh.active) ? sh.active : null,
    cup: loadCup(sh.cup), dialog, ledger, kitchen,
    reviews: Array.isArray(sh.reviews) ? sh.reviews.filter(obj).slice(0, 40).map((r) => ({
      cid: int(r.cid, 0, 1e6, 0), name: str(r.name, 40, "Khách"), arch: ARCHETYPES[r.arch] ? r.arch : "hoc-sinh", recipe: RECIPE[r.recipe] ? r.recipe : "tra-dao",
      stars: int(r.stars, 1, 5, 3), line: str(r.line, 240, ""), reason: str(r.reason, 30, ""), rep: int(r.rep, -8, 8, 0) })) : [],
    usedLines: Array.isArray(sh.usedLines) ? sh.usedLines.filter((x) => typeof x === "string").slice(-40).map((x) => x.slice(0, 240)) : [],
    repDelta: int(sh.repDelta, -8, 8, 0), xp: int(sh.xp, 0, BIG, 0), levelUps: Array.isArray(sh.levelUps) ? sh.levelUps.filter(Number.isInteger).slice(0, 20) : [],
    moments: Array.isArray(sh.moments) ? sh.moments.filter(obj).slice(0, 20).map((m) => ({ kind: str(m.kind, 20, "note"), name: str(m.name, 40, ""), line: typeof m.line === "string" ? m.line.slice(0, 240) : undefined })) : [],
  };
}

const parse = (raw) => { if (typeof raw !== "string") return raw; try { return JSON.parse(raw); } catch { return null; } };

/** Đọc bản lưu (chuỗi hoặc object). Trả null nếu không đọc được (save.js giữ bản hỏng ở khoá *.corrupt). */
export function loadSave(raw) {
  let d = parse(raw);
  if (!obj(d) || !Number.isInteger(d.v)) return null;
  while (d.v < SAVE_VERSION && MIGRATIONS[d.v]) d = MIGRATIONS[d.v](d);
  if (d.v !== SAVE_VERSION) return null;
  const s = createState(int(d.seed, 0, 0xffffffff, 1));
  s.rng = int(d.rng, 0, 0xffffffff, s.seed);
  s.shopName = str(d.shopName, 32, s.shopName);
  s.introSeen = !!d.introSeen;
  s.tutorialDone = !!d.tutorialDone;
  s.money = int(d.money, 0, BIG, s.money);
  s.xp = int(d.xp, 0, BIG, 0);
  s.level = levelForXp(s.xp);
  s.rep = int(d.rep, 0, 100, s.rep);
  s.day = int(d.day, 1, 1e6, 1);
  if (obj(d.stock)) {
    for (const id of STOCK_IDS) s.stock[id] = int(d.stock[id], 0, 999, 0);
    if (d.stock["tran-chau"] !== undefined && d.stock[PEARL_RAW] === undefined) s.stock[PEARL_RAW] = int(d.stock["tran-chau"], 0, 999, 0); // bản thử trước Bếp topping
  }
  if (obj(d.owned)) for (const id of Object.keys(EQUIPMENT)) if (d.owned[id] === true) s.owned[id] = true;
  s.capacity = capacityFor(s);
  s.carryPearls = int(d.carryPearls, 0, 12, 0);
  if (obj(d.stats)) {
    for (const k of ["cups", "revenue", "shifts", "bestProfit", "spentStock"]) s.stats[k] = int(d.stats[k], k === "bestProfit" ? -BIG : 0, BIG, 0);
    if (obj(d.stats.reviews)) for (const k of [1, 2, 3, 4, 5]) if (d.stats.reviews[k]) s.stats.reviews[k] = int(d.stats.reviews[k], 0, BIG, 0);
  }
  s.shift = loadShift(d.shift);
  if (s.shift) s.shift.day = s.day;
  s.lastSummary = obj(d.lastSummary) ? d.lastSummary : null; // chỉ để hiển thị lại bảng chốt ca
  s.journal = Array.isArray(d.journal) ? d.journal.filter(obj).slice(0, 30).map((j) => ({
    day: int(j.day, 1, 1e6, 1), cups: int(j.cups, 0, 999, 0), profit: int(j.profit, -BIG, BIG, 0), avgStars: num(j.avgStars, 0, 5, 0), headline: str(j.headline, 300, "") })) : [];
  return s;
}

export const dump = (s) => JSON.stringify(s);
export { STOCK };
