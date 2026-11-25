// Trạng thái tiệm: tạo mới, đọc + kẹp bản lưu, ghi. Thuần. Khoá lưu "wgp.tiemtrasua.v1" (xem save.js), phiên bản trong bản lưu: v.
// Quy tắc đọc: số bị kẹp về miền hợp lệ, id lạ bị bỏ, ca dở dang được giữ (ly ở từng chỗ pha, phiếu, khách, hội thoại) nếu cấu trúc hợp lệ,
// ngược lại bỏ riêng ca (giữ tiền / cấp / kho). MIGRATIONS[v] nâng v → v+1. save.js giữ bản sao bản cũ trước khi nâng.
// v2 (Milestone 3–4): chỗ pha song song (shift.stations), đơn nhiều ly (customer.items / filled), drama, sổ review, người theo dõi,
// nhiệm vụ ngày, vị trí trang trí, quảng bá, gói ký gửi.
// v3: tính cách chủ tiệm (owner), câu trả lời review lưu nguyên văn + hậu quả + câu đáp lại (feed[].reply là object),
// khách quay lại nhờ câu trả lời (returning), bộ nhớ chống lặp câu giữa hai ca (usedDay).
import { STOCK, STOCK_IDS, START_CAPACITY, START_STOCK, STEPS, choice } from "../data/ingredients.js?v=m38";
import { RECIPE } from "../data/recipes.js?v=m38";
import { ARCHETYPES } from "../data/customers.js?v=m38";
import { START_MONEY, START_REP, SPOTS, MULTI_CUP } from "../data/shift.js?v=m38";
import { levelForXp } from "./progression.js?v=m38";
import { EQUIPMENT, BATCHES, PEARL_RAW } from "../data/equipment.js?v=m38";
import { capacityFor, stationCount } from "./equipment.js?v=m38";
import { EVENT } from "../data/events.js?v=m38";
import { MISSION } from "../data/missions.js?v=m38";
import { PROMOS } from "./business.js?v=m38";
import { placeError } from "./decor.js?v=m38";
import { freshDrama } from "./drama.js?v=m38";
import { PERSONAS, LEGACY_REPLY, OUTCOME_LABEL } from "../data/lines-reply.js?v=m38";
import { LEVELS } from "../data/levels.js?v=m38";
import { CHALLENGE, BADGE } from "./challenge.js?v=m38";
import { TIERS } from "./fair.js?v=m38";

export const SAVE_VERSION = 4;
/** Bảng XP tích luỹ trước Milestone 5 (v1–v3). v4 kéo dài đường cong (bộ mô phỏng tools/sim), MIGRATIONS[3] quy đổi XP cũ
 *  sang đường mới giữ đúng cấp và đúng phần trăm tiến độ trong cấp ⇒ người chơi cũ không tụt cấp, không mất món đã mở. */
export const OLD_XP = [0, 30, 75, 130, 195, 270, 355, 450, 555, 670, 795, 930, 1075, 1230, 1395, 1570, 1755, 1950, 2155, 2370];
export function remapXp(xp, from = OLD_XP, to = LEVELS.map((L) => L.xp)) {
  if (!(xp > 0)) return 0;
  let lv = 0;
  for (let i = 0; i < from.length; i++) if (xp >= from[i]) lv = i;
  if (lv >= from.length - 1) return to[to.length - 1] + Math.round(xp - from[from.length - 1]);
  const frac = (xp - from[lv]) / (from[lv + 1] - from[lv]);
  return Math.floor(to[lv] + frac * (to[lv + 1] - to[lv]));
}

/** v1 → v2: một ly/một phiếu ⇒ chỗ pha 0; khách một ly ⇒ items[1]; thêm các mục mới (để trống). */
export const MIGRATIONS = {
  1: (d) => {
    const o = JSON.parse(JSON.stringify(d));
    o.v = 2;
    const sh = o.shift;
    if (sh && typeof sh === "object") {
      sh.stations = [{ cup: sh.cup ?? null, cid: Number.isInteger(sh.active) ? sh.active : null, item: Number.isInteger(sh.active) ? 0 : null }];
      sh.sel = 0;
      delete sh.cup; delete sh.active;
      for (const c of Array.isArray(sh.customers) ? sh.customers : []) {
        if (!c || typeof c !== "object") continue;
        c.items = [{ recipe: c.recipe, order: c.order, price: c.price }];
        c.filled = [null];
      }
      for (const g of Array.isArray(sh.schedule) ? sh.schedule : []) {
        if (!g || typeof g !== "object") continue;
        g.items = [{ recipe: g.recipe, sugar: g.sugar, ice: g.ice }];
      }
      if (sh.dialog && sh.dialog.kind === "complaint") { sh.dialog.wrong = [0]; sh.dialog.wrongCost = sh.dialog.cost; }
    }
    return o;
  },
  /** v2 → v3: trả lời review cũ (chỉ có loại) ⇒ object có câu cũ; chưa có tính cách (hỏi một lần ở Chuẩn bị ca). */
  2: (d) => {
    const o = JSON.parse(JSON.stringify(d));
    o.v = 3;
    for (const r of Array.isArray(o.feed) ? o.feed : []) {
      if (r && typeof r === "object" && typeof r.reply === "string")
        r.reply = LEGACY_REPLY[r.reply] ? { kind: "legacy-" + r.reply, persona: null, text: LEGACY_REPLY[r.reply], outcome: "legacy", fx: [], comeback: [], day: r.day } : null;
    }
    o.owner = { persona: null, lastPersona: null, switches: [] };
    o.returning = [];
    o.usedDay = [];
    return o;
  },
  /** v3 → v4 (Milestone 5): đường cong XP mới (giữ cấp + tiến độ), huy hiệu, hạng tiệm, hội chợ, ca thử thách. */
  3: (d) => {
    const o = JSON.parse(JSON.stringify(d));
    o.v = 4;
    if (typeof o.xp === "number" && Number.isFinite(o.xp)) o.xp = remapXp(o.xp);
    o.badges = {}; o.tier = 0; o.fair = null; o.challenge = null;
    return o;
  },
};

export function createState(seed = 20261119) {
  return {
    v: SAVE_VERSION, seed: seed >>> 0, rng: seed >>> 0, shopName: "Tiệm Nhà Mình", introSeen: false, tutorialDone: false,
    money: START_MONEY, xp: 0, level: 1, rep: START_REP, day: 1, capacity: START_CAPACITY,
    stock: Object.fromEntries(STOCK_IDS.map((id) => [id, START_STOCK[id] || 0])),
    stats: { cups: 0, revenue: 0, shifts: 0, bestProfit: 0, spentStock: 0, spentGear: 0, reviews: {}, missions: 0 },
    owned: {}, carryPearls: 0, placement: {},
    followers: 0, buzz: 0, feed: [], nextReviewId: 1, rating: null, promises: [],
    owner: { persona: null, lastPersona: null, switches: [] }, returning: [], usedDay: [],
    drama: freshDrama(), promo: null, consign: null, debtHB: null,
    badges: {}, tier: 0, fair: null, challenge: null,
    shift: null, lastSummary: null, journal: [],
  };
}

const num = (v, lo, hi, d) => (typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d);
const int = (v, lo, hi, d) => Math.floor(num(v, lo, hi, d));
const str = (v, max, d) => (typeof v === "string" && v.trim() ? v.slice(0, max) : d);
const obj = (v) => v && typeof v === "object" && !Array.isArray(v);
const arr = (v) => (Array.isArray(v) ? v : []);
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
  const out = { steps, sealed, forCid: Number.isInteger(c.forCid) ? c.forCid : null };
  if (typeof c.at === "number" && Number.isFinite(c.at) && c.at >= 0) out.at = Math.min(c.at, 3_600_000); // M3 nội dung: lúc ghép vào đơn
  if (c.dual) out.dual = true; // M5: trà nền rót bằng máy hai vòi
  return out;
}

function loadOrder(o) {
  if (!obj(o) || !choice("base", o.base) || !choice("add", o.add) || !choice("sugar", o.sugar) || !choice("ice", o.ice) || !choice("topping", o.topping)) return null;
  return { base: o.base, add: o.add, sugar: o.sugar, ice: o.ice, topping: o.topping };
}

const PHASES = new Set(["enter", "wait", "react", "leave"]);
function loadCustomer(c, t) {
  if (!obj(c) || !Number.isInteger(c.id) || !ARCHETYPES[c.arch] || !RECIPE[c.recipe] || !PHASES.has(c.phase)) return null;
  const order = loadOrder(c.order);
  if (!order) return null;
  const items = [];
  for (const it of arr(c.items).slice(0, MULTI_CUP.maxCups)) {
    const o = obj(it) && RECIPE[it.recipe] && loadOrder(it.order);
    if (!o) return null;
    items.push({ recipe: it.recipe, order: o, price: int(it.price, 0, 999, RECIPE[it.recipe].price) });
  }
  if (!items.length) return null;
  const filled = items.map((_, i) => (c.filled?.[i] ? loadCup(c.filled[i]) : null)).map((cup) => (cup && cup.sealed ? cup : null));
  const spot = int(c.spot, 0, SPOTS.length - 1, 0);
  const out = {
    id: c.id, arch: c.arch, sprite: ARCHETYPES[c.arch].sprite, name: str(c.name, 40, "Khách"), items, filled, recipe: c.recipe, order,
    price: int(c.price, 0, 3000, items.reduce((a, it) => a + it.price, 0)), patience: int(c.patience, 5000, 600000, ARCHETYPES[c.arch].patience),
    bonus: int(c.bonus, -300000, 600000, 0), spot, t0: num(c.t0, 0, t, t), arriveT: c.arriveT === null ? null : num(c.arriveT, 0, t, t),
    phase: c.phase, mood: str(c.mood, 20, "waiting"), pinned: !!c.pinned, impatientSaid: !!c.impatientSaid, remade: !!c.remade,
    say: obj(c.say) && typeof c.say.text === "string" ? { text: c.say.text.slice(0, 240), at: num(c.say.at, 0, t, t) } : null,
    leaveT: c.leaveT === null ? null : num(c.leaveT, 0, t, t), reactUntil: c.reactUntil === null ? null : num(c.reactUntil, 0, t + 10000, t),
    review: obj(c.review) ? { stars: int(c.review.stars, 1, 5, 3), line: str(c.review.line, 240, ""), reason: str(c.review.reason, 30, "") } : null,
    orderLine: str(c.orderLine, 300, ""), tag: typeof c.tag === "string" ? c.tag.slice(0, 20) : null, tip: int(c.tip, 0, 99, 0),
  };
  if (out.phase === "wait" && out.arriveT === null) out.arriveT = t;
  if (out.phase === "leave" && out.leaveT === null) out.leaveT = t;
  if (out.phase === "react" && out.reactUntil === null) out.reactUntil = t;
  return out;
}

function loadGuest(g, t) {
  if (!obj(g) || !ARCHETYPES[g.arch]) return null;
  const items = [];
  for (const it of arr(g.items).slice(0, MULTI_CUP.maxCups)) {
    if (!obj(it) || !RECIPE[it.recipe] || !choice("sugar", it.sugar) || !choice("ice", it.ice)) return null;
    items.push({ recipe: it.recipe, sugar: it.sugar, ice: it.ice });
  }
  if (!items.length) return null;
  const out = { at: num(g.at, 0, 3_600_000, t), arch: g.arch, name: str(g.name, 40, "Khách"), items };
  if (typeof g.tag === "string") out.tag = g.tag.slice(0, 20);
  if (g.tip) out.tip = int(g.tip, 0, 99, 0);
  if (typeof g.line === "string") out.line = g.line.slice(0, 300);
  if (g.patienceMul) out.patienceMul = num(g.patienceMul, 0.5, 3, 1);
  return out;
}

function loadDialog(d, ids) {
  if (!obj(d)) return null;
  if (d.kind === "complaint" && ids.has(d.cid)) {
    const wrong = arr(d.wrong).filter((i) => Number.isInteger(i) && i >= 0 && i < MULTI_CUP.maxCups).slice(0, 3);
    return { kind: "complaint", cid: d.cid, cost: int(d.cost, 0, 999, 0), wrongCost: int(d.wrongCost, 0, 999, int(d.cost, 0, 999, 0)), wrong: wrong.length ? wrong : [0],
      stars: int(d.stars, 1, 2, 1), raw: int(d.raw, 0, 100, 0), errors: arr(d.errors).filter((e) => typeof e === "string").slice(0, 10), ...(typeof d.line === "string" ? { line: d.line.slice(0, 300) } : {}) };
  }
  if (d.kind === "stockout" && STOCK[d.id]) return { kind: "stockout", id: d.id, cid: Number.isInteger(d.cid) && ids.has(d.cid) ? d.cid : null, line: str(d.line, 300, "") };
  return loadEvent(d, ids);
}
function loadEvent(d, ids) {
  if (!obj(d) || d.kind !== "event" || !EVENT[d.id] || !EVENT[d.id].nodes[d.node]) return null;
  const cid = Number.isInteger(d.cid) && (!ids || ids.has(d.cid)) ? d.cid : null;
  if (d.cid !== null && d.cid !== undefined && cid === null) return null; // người nói đã rời tiệm
  let npc = null;
  if (obj(d.npc)) {
    npc = { role: str(d.npc.role, 20, "neighbor"), name: str(d.npc.name, 40, "Hàng xóm") };
    if (typeof d.npc.self === "string") npc.self = d.npc.self.slice(0, 12);
    if (typeof d.npc.call === "string") npc.call = d.npc.call.slice(0, 16);
  }
  return { kind: "event", id: d.id, node: d.node, cid, npc, steps: int(d.steps, 0, 20, 0) };
}

function loadShift(sh, s) {
  if (!obj(sh) || sh.status !== "open") return null;
  const t = num(sh.t, 0, 3_600_000, 0);
  const customers = [];
  for (const c of arr(sh.customers).slice(0, 8)) {
    const cc = loadCustomer(c, t);
    if (!cc) return null;
    customers.push(cc);
  }
  const schedule = [];
  for (const g of arr(sh.schedule).slice(0, 30)) {
    const gg = loadGuest(g, t);
    if (!gg) return null;
    schedule.push(gg);
  }
  const Lg = obj(sh.ledger) ? sh.ledger : {};
  const ledger = {};
  for (const k of ["revenue", "cogs", "waste", "fee", "restock", "cups", "served", "lost", "refunds", "remakes", "pearlWaste", "multi", "consignPaid"]) ledger[k] = int(Lg[k], 0, BIG, 0);
  ledger.eventCash = int(Lg.eventCash, -BIG, BIG, 0);
  const K = obj(sh.kitchen) ? sh.kitchen : {};
  const kitchen = {
    ready: int(K.ready, 0, 99, 0),
    batches: arr(K.batches).filter((b) => obj(b) && BATCHES[b.size]).slice(0, 2)
      .map((b) => ({ size: b.size, ms: BATCHES[b.size].ms, doneAt: num(b.doneAt, 0, t + BATCHES[b.size].ms, t + BATCHES[b.size].ms) })),
  };
  const ids = new Set(customers.map((c) => c.id));
  const byId = new Map(customers.map((c) => [c.id, c]));
  const nSt = stationCount(s);
  const stations = Array.from({ length: nSt }, (_, i) => {
    const st = arr(sh.stations)[i];
    const cid = obj(st) && ids.has(st.cid) ? st.cid : null;
    const item = cid !== null && Number.isInteger(st.item) && st.item >= 0 && st.item < byId.get(cid).items.length ? st.item : null;
    return { cup: obj(st) ? loadCup(st.cup) : null, cid, item };
  });
  const M = obj(sh.mods) ? sh.mods : {};
  const D = obj(sh.drama) ? sh.drama : {};
  const L = obj(sh.lastServe) ? sh.lastServe : null;
  return {
    day: int(sh.day, 1, 1e6, 1), t, duration: int(sh.duration, 30000, 600000, 180000), patienceMult: num(sh.patienceMult, 0.5, 3, 1),
    hints: !!sh.hints, tutorial: !!sh.tutorial, status: "open", schedule, planned: int(sh.planned, 0, 60, schedule.length + customers.length),
    customers, nextCid: Math.max(int(sh.nextCid, 1, 1e6, 1), ...customers.map((c) => c.id + 1)), stations, sel: int(sh.sel, 0, nSt - 1, 0),
    dialog: loadDialog(sh.dialog, ids), ledger, kitchen,
    reviews: arr(sh.reviews).filter(obj).slice(0, 40).map((r) => ({
      cid: int(r.cid, 0, 1e6, 0), name: str(r.name, 40, "Khách"), arch: ARCHETYPES[r.arch] ? r.arch : "hoc-sinh", recipe: RECIPE[r.recipe] ? r.recipe : "tra-dao",
      stars: int(r.stars, 1, 5, 3), line: str(r.line, 300, ""), reason: str(r.reason, 30, ""), rep: int(r.rep, -8, 8, 0), ...(r.src ? { src: str(r.src, 10, "quan") } : {}) })),
    usedLines: arr(sh.usedLines).filter((x) => typeof x === "string").slice(-40).map((x) => x.slice(0, 300)),
    repDelta: int(sh.repDelta, -8, 8, 0), xp: int(sh.xp, 0, BIG, 0), levelUps: arr(sh.levelUps).filter(Number.isInteger).slice(0, 20),
    moments: arr(sh.moments).filter(obj).slice(0, 30).map(loadMoment),
    mods: { sealMs: int(M.sealMs, -10000, 30000, 0), spawnPauseUntil: num(M.spawnPauseUntil, 0, 3_600_000, 0) },
    lastServe: L && ids.has(L.cid) ? { t: num(L.t, 0, t, t), cid: L.cid, arch: ARCHETYPES[L.arch] ? L.arch : "hoc-sinh", name: str(L.name, 40, ""), recipe: RECIPE[L.recipe] ? L.recipe : "tra-dao",
      stars: int(L.stars, 1, 5, 3), cups: int(L.cups, 1, 3, 1), sugar: choice("sugar", L.sugar) ? L.sugar : 50, ice: str(L.ice, 10, "vua"), sugarOk: !!L.sugarOk, iceOk: !!L.iceOk, topping: str(L.topping, 20, "none"), mistake: typeof L.mistake === "string" ? L.mistake.slice(0, 20) : null, outcome: typeof L.outcome === "string" ? L.outcome.slice(0, 20) : null } : null,
    missions: arr(sh.missions).filter((m) => obj(m) && MISSION[m.id]).slice(0, 5).map((m) => ({ id: m.id, text: str(m.text, 120, MISSION[m.id].text), n: MISSION[m.id].n,
      prog: int(m.prog, 0, MISSION[m.id].n, 0), done: !!m.done, reward: { xp: MISSION[m.id].reward.xp, money: MISSION[m.id].reward.money } })),
    drama: { count: int(D.count, 0, 9, 0), max: int(D.max, 0, 9, 0), nextAt: num(D.nextAt, 0, 3_600_000, 60000), log: arr(D.log).filter(obj).slice(0, 10).map(loadHist) },
    followers0: int(sh.followers0, 0, BIG, 0),
    fair: !!sh.fair, challenge: CHALLENGE[sh.challenge] ? sh.challenge : null, noUndo: !!sh.noUndo,
    // hết hàng giữa ca (core/stockout.js): chạy đi mua, Anh Tèo đang giao, đã mượn Hẻm Bên, đóng cửa sớm, đã nhắc món sắp hết
    away: obj(sh.away) && STOCK[sh.away.id] ? { until: num(sh.away.until, 0, t + 60000, t), id: sh.away.id, n: int(sh.away.n, 0, 99, 0) } : null,
    deliveries: arr(sh.deliveries).filter((x) => obj(x) && STOCK[x.id]).slice(0, 5).map((x) => ({ at: num(x.at, 0, t + 120000, t), id: x.id, n: int(x.n, 0, 99, 0), wrong: STOCK[x.wrong] ? x.wrong : null })),
    borrowDay: Number.isInteger(sh.borrowDay) ? sh.borrowDay : null, closedEarly: STOCK[sh.closedEarly] ? sh.closedEarly : null, stockouts: int(sh.stockouts, 0, 99, 0),
    lowWarned: obj(sh.lowWarned) ? Object.fromEntries(Object.keys(sh.lowWarned).filter((id) => STOCK[id]).map((id) => [id, true])) : {},
  };
}
const loadMoment = (m) => ({ kind: str(m.kind, 20, "note"), name: str(m.name, 40, ""), ...(typeof m.line === "string" ? { line: m.line.slice(0, 300) } : {}), ...(typeof m.id === "string" ? { id: m.id.slice(0, 12) } : {}), ...(typeof m.outcome === "string" ? { outcome: m.outcome.slice(0, 12) } : {}) });
const loadHist = (h) => ({ day: int(h.day, 1, 1e6, 1), id: str(h.id, 12, ""), choice: str(h.choice, 30, ""), label: str(h.label, 80, ""), line: str(h.line, 300, ""), who: str(h.who, 40, "") });

function loadDrama(D) {
  const out = freshDrama();
  if (!obj(D)) return out;
  if (obj(D.flags)) for (const [f, v] of Object.entries(D.flags).slice(0, 60)) if (typeof f === "string" && f.length <= 40) out.flags[f] = int(v, 0, 1e6, 0);
  out.queue = arr(D.queue).filter((q) => obj(q) && EVENT[q.id]).slice(0, 20).map((q) => ({ id: q.id, day: int(q.day, 0, 1e6, 0), from: str(q.from, 12, "") }));
  if (obj(D.seen)) for (const [id, v] of Object.entries(D.seen)) if (EVENT[id]) out.seen[id] = int(v, 0, 1e6, 0);
  out.history = arr(D.history).filter(obj).slice(0, 40).map(loadHist);
  out.pending = loadEvent(D.pending, null);
  if (out.pending && out.pending.cid !== null) out.pending = null;
  out.nextGuests = int(D.nextGuests, -3, 6, 0);
  out.demand = RECIPE[D.demand] ? D.demand : null;
  out.recent = arr(D.recent).filter((x) => x === "good" || x === "other").slice(-6);
  return out;
}

/** Câu trả lời review (v3): { kind, persona, text, outcome, fx[], comeback[{who,line,net,flip?}], day }. */
function loadReply(x) {
  if (!obj(x) || typeof x.text !== "string" || !x.text.trim()) return null;
  return { kind: str(x.kind, 30, "legacy"), persona: PERSONAS[x.persona] ? x.persona : null, text: x.text.slice(0, 300), outcome: OUTCOME_LABEL[x.outcome] ? x.outcome : "legacy",
    fx: arr(x.fx).filter((f) => typeof f === "string").slice(0, 8).map((f) => f.slice(0, 120)),
    comeback: arr(x.comeback).filter((c) => obj(c) && typeof c.line === "string").slice(0, 3).map((c) => ({ who: str(c.who, 40, "Cư dân mạng"), line: c.line.slice(0, 300), net: !!c.net, ...(c.flip ? { flip: true } : {}) })),
    day: int(x.day, 1, 1e6, 1) };
}

const parse = (raw) => { if (typeof raw !== "string") return raw; try { return JSON.parse(raw); } catch { return null; } };

/** Phiên bản của bản lưu thô (null nếu không đọc được). save.js dùng để giữ bản sao trước khi nâng. */
export function saveVersion(raw) { const d = parse(raw); return obj(d) && Number.isInteger(d.v) ? d.v : null; }

/** Đọc bản lưu (chuỗi hoặc object). Trả null nếu không đọc được (save.js giữ bản hỏng ở khoá *.corrupt). */
export function loadSave(raw) {
  let d = parse(raw);
  if (!obj(d) || !Number.isInteger(d.v)) return null;
  try { while (d.v < SAVE_VERSION && MIGRATIONS[d.v]) d = MIGRATIONS[d.v](d); } catch { return null; }
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
  if (obj(d.placement)) for (const [id, p] of Object.entries(d.placement)) if (s.owned[id] && Array.isArray(p) && !placeError(id, p[0], p[1])) s.placement[id] = [Math.round(p[0]), Math.round(p[1])];
  if (obj(d.stats)) {
    for (const k of ["cups", "revenue", "shifts", "bestProfit", "spentStock", "spentGear", "missions"]) s.stats[k] = int(d.stats[k], k === "bestProfit" ? -BIG : 0, BIG, 0);
    if (obj(d.stats.reviews)) for (const k of [1, 2, 3, 4, 5]) if (d.stats.reviews[k]) s.stats.reviews[k] = int(d.stats.reviews[k], 0, BIG, 0);
  }
  s.followers = int(d.followers, 0, BIG, 0);
  s.buzz = num(d.buzz, 0, 20, 0);
  s.nextReviewId = int(d.nextReviewId, 1, BIG, 1);
  s.feed = arr(d.feed).filter(obj).slice(0, 40).map((r) => ({
    id: int(r.id, 1, BIG, 1), day: int(r.day, 1, 1e6, 1), name: str(r.name, 40, "Khách"), arch: ARCHETYPES[r.arch] ? r.arch : "hoc-sinh", recipe: RECIPE[r.recipe] ? r.recipe : "tra-dao",
    stars: int(r.stars, 1, 5, 3), line: str(r.line, 300, ""), reason: str(r.reason, 30, ""), reply: loadReply(r.reply), src: r.src === "mang" ? "mang" : "quan" }));
  s.nextReviewId = Math.max(s.nextReviewId, ...s.feed.map((r) => r.id + 1));
  s.rating = s.feed.length ? Math.round((s.feed.slice(0, 20).reduce((a, r) => a + r.stars, 0) / Math.min(20, s.feed.length)) * 10) / 10 : null;
  const O = obj(d.owner) ? d.owner : {};
  s.owner = { persona: PERSONAS[O.persona] ? O.persona : null, lastPersona: PERSONAS[O.lastPersona] ? O.lastPersona : null,
    switches: arr(O.switches).filter((x) => obj(x) && PERSONAS[x.from] && PERSONAS[x.to]).slice(-20).map((x) => ({ day: int(x.day, 1, 1e6, 1), from: x.from, to: x.to })) };
  s.returning = arr(d.returning).filter(obj).slice(0, 6).map((g) => ({ name: str(g.name, 40, "Khách"), arch: ARCHETYPES[g.arch] ? g.arch : "hoc-sinh", recipe: RECIPE[g.recipe] ? g.recipe : "tra-dao",
    persona: PERSONAS[g.persona] ? g.persona : "hien", day: int(g.day, 1, 1e6, 1) }));
  s.usedDay = arr(d.usedDay).filter((x) => typeof x === "string").slice(-40).map((x) => x.slice(0, 300));
  s.promises = arr(d.promises).filter(obj).slice(0, 10).map((p) => ({ day: int(p.day, 1, 1e6, 1), name: str(p.name, 40, "Khách"), reviewId: int(p.reviewId, 0, BIG, 0) }));
  s.drama = loadDrama(d.drama);
  s.promo = obj(d.promo) && PROMOS[d.promo.kind] ? { day: int(d.promo.day, 1, 1e6, 1), kind: d.promo.kind } : null;
  s.consign = obj(d.consign) ? { day: int(d.consign.day, 0, 1e6, 0), owed: int(d.consign.owed, 0, 9999, 0) } : null;
  s.badges = {};
  if (obj(d.badges)) for (const [id, v] of Object.entries(d.badges)) if (BADGE[id]) s.badges[id] = int(v, 1, 1e6, 1);
  s.tier = int(d.tier, 0, TIERS.length, 0);
  s.fair = obj(d.fair) ? { day: int(d.fair.day, 0, 1e6, 0), last: int(d.fair.last, -99, 1e6, -99), count: int(d.fair.count, 0, 1e6, 0) } : null;
  s.challenge = obj(d.challenge) && CHALLENGE[d.challenge.id] ? { id: d.challenge.id, day: int(d.challenge.day, 0, 1e6, 0) } : null;
  s.debtHB = obj(d.debtHB) && STOCK[d.debtHB.id] ? { id: d.debtHB.id, n: int(d.debtHB.n, 0, 99, 0), day: int(d.debtHB.day, 1, 1e6, 1) } : null;
  s.shift = loadShift(d.shift, s);
  if (s.shift) { s.shift.day = s.day; s.drama.pending = null; }
  s.lastSummary = obj(d.lastSummary) ? d.lastSummary : null; // chỉ để hiển thị lại bảng chốt ca / Nhật Ký
  s.journal = arr(d.journal).filter(obj).slice(0, 30).map((j) => ({
    day: int(j.day, 1, 1e6, 1), cups: int(j.cups, 0, 999, 0), profit: int(j.profit, -BIG, BIG, 0), avgStars: num(j.avgStars, 0, 5, 0), headline: str(j.headline, 300, ""), moment: str(j.moment, 300, "") }));
  return s;
}

export const dump = (s) => JSON.stringify(s);
export { STOCK };
