// Một ca: khách tới theo ba buổi, ghim phiếu, giao ổ (cả ráp ×N), chấm sao, khiếu nại, trả tiền + thối, review, chốt ca lời lỗ. Thuần.
// M3: đơn nhiều ổ (đơn nhóm từ sự kiện), đơn đặt trước (cọc, hạn giao, trễ), thớt đôi / ba, phụ việc, bánh hôm qua, quảng bá, hội chợ,
// thử thách, nhiệm vụ ngày, bộ điều chỉnh có hạn. M4: Drama Engine (core/drama.js), review lưu sổ + trả lời (core/reviews.js), Nhật Ký.
import { RECIPE, NAMES, LEVELS, XP_MUL, STOCK, AUTO_CHANGE_DAYS, HONEST_RETURN, BACHUC, QUEUE_MAX, QUE } from "../data/economy.js?v=b3";
import { ARCHETYPES, ARCH_IDS, REGULARS, REGULAR_KNOWN_AT } from "../data/customers.js?v=b3";
import { QUIRKS } from "../data/quirks.js?v=b3";
import { PHASES, SHIFT_MS, PHASE_BANNER, NORMAL_DAY, TUTORIAL, WALK_MS } from "../data/shift.js?v=b3";
import { PREORDER, FAIR } from "../data/equipment.js?v=b3";
import * as L from "../data/lines.js?v=b3";
import * as M3 from "../data/lines-m3.js?v=b3";
import { STAR_REVIEWS_MORE, STAR_REVIEWS_ARCH_MORE, MISTAKE_SAY_MORE, MISTAKE_REVIEW_MORE } from "../data/lines-reviews.js?v=b3";
import { MISTAKE_SAY, MISTAKE_REVIEW } from "../data/lines-mistakes.js?v=b3";
import { next, int, pick, weighted } from "./rng.js?v=b3";
import { fill, freshLine, poolFor } from "./text.js?v=b3";
import { makeItem, makeBachuc, menuFor, orderText, loafName, bachucMax, bachucPrice } from "./order.js?v=b3";
import { scoreOrder } from "./score.js?v=b3";
import { customerPays, makeChange, canChange, payOut, receive, spend, greedyBills, sumBills } from "./money.js?v=b3";
import { ovenOf, newLoaf, tickOven, addWaste } from "./oven.js?v=b3";
import { emptyBoard, board, finished, wasteLoaf } from "./board.js?v=b3";
import { shiftFee, repayConsign, stage, baseGuests } from "./stock.js?v=b3";
import { tickRescue, openNochange } from "./rescue.js?v=b3";
import { engineFlag, modSum, modGuests, pruneMods, today, hasFlag } from "./flags.js?v=b3";
import { startDrama, maybeTrigger, endDrama, choose as dramaChoose } from "./drama.js?v=b3";
import { pushReview, netReview, archiveShift, returningGuests, ratingOf } from "./reviews.js?v=b3";
import { startMissions, missionsOnServe, missionsOnEnd, missionsOnChange, missionsOnDrama } from "./missions.js?v=b3";
import { caption } from "./journal.js?v=b3";
import { patienceBonus, boardCount, helperToday, fairToday, promoGuests, rollWeather, createPreorder, STALE_CRISP, rainMul, shiftLenFor } from "./progress.js?v=b3";
import { judgeChallenge, challengeMods, checkBadges } from "./challenge.js?v=b3";
import { freshCook, tickCook, cookLeftover } from "./cook.js?v=b3";
import { addContract, contractOrders, contractDelivered, contractFailed } from "./contracts.js?v=b3";
import { expire } from "./expiry.js?v=b3";
import { takePartial } from "./partial.js?v=b3";
import { CONTRACT_LINES, CONTRACT_REVIEW, COOK_LINES, EXPIRY_LINES, BO_DUONG, FAIR_LINES } from "../data/lines-m5.js?v=b3";

export const customer = (s, cid) => s.shift?.customers.find((c) => c.id === cid) || null;
export const levelForXp = (xp) => { let lv = 1; for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i]) lv = i + 1; return lv; };
export const phaseAt = (t) => PHASES.find((p) => t < p.to) || PHASES[PHASES.length - 1];
export function clockOf(t) {
  const p = phaseAt(t), f = Math.min(1, Math.max(0, (t - p.from) / (p.to - p.from)));
  const m = Math.floor(p.clock[0] + f * (p.clock[1] - p.clock[0]));
  return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
}
export const autoChangeAllowed = (s) => s.day <= AUTO_CHANGE_DAYS && !challengeMods(s).manual;
/** Độ dài ca đang mở (hội chợ 4,5 phút). */
export const shiftLen = (sh) => sh?.len || SHIFT_MS;
export const lineCtx = (c, extra = {}) => ({ self: c.self, call: c.call, name: c.name, n: c.items?.length || 1, loaf: c.items?.[0] ? loafName(c.items[0]) : "bánh mì", ...extra });
export const patienceLeft = (s, c) => (c.pre ? Math.max(0, Math.min(1, (c.pre.dueT - s.shift.t) / Math.max(1, c.pre.dueT - c.t0))) : c.phase === "wait" && c.arriveT !== null ? Math.max(0, 1 - (s.shift.t - c.arriveT) / c.patience) : 1);
export const orderPrice = (c) => c.items.reduce((a, it) => a + it.price, 0);
export const waiting = (s) => (s.shift ? s.shift.customers.filter((c) => c.phase === "wait") : []);
/** Có người phụ (mẹ / Bé Na): tự gói + tự thối tiền. */
export const helperOn = (s) => !!s.shift && !challengeMods(s).manual && (helperToday(s) || (s.shift.helperUntil || 0) > s.shift.t);

/** Cộng XP + lên cấp (ghi sự kiện). Trả số XP đã cộng. */
export function gainXp(s, xp, ev) {
  xp = Math.max(0, Math.floor(xp));
  s.xp += xp;
  if (s.shift) s.shift.stats.xp += xp;
  while (s.level < LEVELS.length && s.xp >= LEVELS[s.level]) {
    s.level++; ev.push({ type: "levelUp", level: s.level });
    if (s.level >= 16 && s.shop) engineFlag(s, "noi-tieng", 4);
  }
  return xp;
}

// ---------- khách tới ----------
const TUT = [
  { at: 6000, arch: "student", recipe: "pate-bo", q: [], pay: 50 },
  { at: 26000, arch: "office", recipe: "cha-lua", q: [], pay: 50 },
  { at: 46000, arch: "regular", name: "Cụ Năm", recipe: "cha-lua", q: ["gion-gion", "khong-ot"], pay: "exact" },
  { at: 64000, arch: "worker", recipe: "cha-lua", q: ["nhieu-ot"], pay: "exact" },
  { at: 82000, arch: "student", recipe: "pate-bo", q: ["khong-hanh"], pay: 50 },
  { at: 98000, arch: "parent", recipe: "pate-bo", q: ["cat-doi", "khong-ot"], pay: "exact" },
  { at: 120000, arch: "office", recipe: "pate-bo", q: ["it-ot"], pay: "transfer" },
  { at: 142000, arch: "shipper", recipe: "cha-lua", q: [], pay: "transfer", bag: true },
  { at: 168000, arch: "office", recipe: "cha-lua", q: ["khong-hanh", "it-ot"], pay: 50 },
  { at: 194000, arch: "parent", recipe: "pate-bo", q: [], pay: 50 },
];
function pickQuirks(s, A, level, max = 2) {
  const pool = Object.entries(A.quirks).filter(([q]) => QUIRKS[q] && QUIRKS[q].unlock <= level && (q !== "them-trung" || s.owned?.["egg-pan"])).map(([q, w]) => ({ q, w }));
  const out = [];
  const n = next(s) < 0.4 ? 0 : next(s) < 0.7 ? 1 : max;
  for (let i = 0; i < n && pool.length; i++) { const x = weighted(s, pool); out.push(x.q); pool.splice(pool.indexOf(x), 1); }
  return out;
}
function pickRecipe(s, A) {
  const menu = menuFor(s).map((r) => r.id);
  const likes = [...A.likes, ...(s.house ? ["gia-truyen"] : []), ...(menu.includes("que") && (A.label === "Học sinh" || A.label === "Phụ huynh") ? ["que"] : [])].filter((id) => menu.includes(id));
  return pick(s, likes.length && next(s) < 0.75 ? likes : menu);
}
/** Giá ổ theo hôm nay: bộ điều chỉnh (sự kiện), pate nhà làm, hội chợ. */
export function priceItem(s, it) {
  let p = it.price + modSum(s, "price");
  if ((it.spreads?.pate || 0) > 0) p += (s.pate || 0) + modSum(s, "pate");
  if (fairToday(s)) p = Math.round(p * FAIR.priceMul);
  it.price = Math.max(5, Math.round(p));
  return it;
}
const item = (s, rid, q, extra) => priceItem(s, makeItem(rid, q, extra, s.house));
function archPool(s, ph) {
  return ARCH_IDS.filter((id) => ARCHETYPES[id].unlock <= s.level && (!ARCHETYPES[id].minRep || s.rep >= ARCHETYPES[id].minRep))
    .map((id) => ({ id, w: (ARCHETYPES[id].weight[ph.id] || 0) * (id === "reviewer" && s.level >= 8 ? 2 : 1) })).filter((x) => x.w > 0);
}
function guestFor(s, arch, at, ph, usedRegulars) {
  const A = ARCHETYPES[arch];
  const g = { at, arch, patienceMul: ph.patience };
  if (A.regular && usedRegulars) {
    const free = Object.keys(REGULARS).filter((nm) => !usedRegulars.has(nm));
    if (free.length) { g.name = pick(s, free); usedRegulars.add(g.name); const fav = REGULARS[g.name]; g.items = [item(s, fav.recipe, fav.quirks)]; return g; }
  }
  if (s.level >= BACHUC.unlock && next(s) < 0.08) {
    const targets = BACHUC.targets.filter((t) => t <= bachucMax(s.level, s.owned) - BACHUC.tolerance);
    if (targets.length) { g.items = [makeBachuc(pick(s, targets))]; return g; }
  }
  let count = 1;
  if (s.day >= NORMAL_DAY.multiFromDay && ["parent", "worker", "office", "shipper"].includes(arch) && next(s) < NORMAL_DAY.multiChance) count = next(s) < 0.3 ? 3 : 2;
  // hội chợ: khách nào cũng hay đi nhóm, gọi đơn kết hợp (mỗi người một món)
  if (fairToday(s) && count === 1) { const r = next(s); count = r < FAIR.three ? 3 : r < FAIR.three + FAIR.two ? 2 : 1; if (count > 1) g.tag = "fair"; }
  // cấp 10+: đội thợ hồ đặt 6–12 ổ giờ cao điểm (ráp ×N)
  if (s.level >= 10 && arch === "worker" && ph.id === "sang" && next(s) < 0.22) count = 6 + int(s, 7);
  g.items = [];
  const rid0 = pickRecipe(s, A);
  for (let k = 0; k < count; k++) {
    const rid = count >= 6 && next(s) < 0.75 ? rid0 : pickRecipe(s, A);
    g.items.push(item(s, rid, pickQuirks(s, A, s.level, count > 1 ? 1 : 2)));
  }
  if (count >= 6) g.patienceMul = (g.patienceMul || 1) * 2.4;
  const bag = A.bag || count >= 3;
  if (bag) for (const it of g.items) { it.bag = true; if (it.wrap === "cat-doi") { it.wrap = "giay"; it.quirks = it.quirks.filter((q) => q !== "cat-doi"); } }
  return g;
}
/** Lịch khách của ca (xác định theo hạt RNG). */
export function genGuests(s) {
  if (!s.tutorialDone) return TUT.map((g) => ({ ...g, items: [makeItem(g.recipe, g.q, g.bag ? { bag: true } : {})], patienceMul: TUTORIAL.patienceMul }));
  const CM = challengeMods(s);
  const n = Math.max(4, baseGuests(s) + int(s, 3) - 1);
  const out = [];
  const usedRegulars = new Set();
  const len = shiftLenFor(s);
  const atIn = (ph) => { const to = ph.id === "chieu" ? len - 20000 : Math.min(ph.to, len - 20000); return Math.round(ph.from + 2000 + next(s) * (to - ph.from - 2000)); };
  const archOf = (ph) => (CM.tourist && next(s) < CM.tourist ? "tourist" : weighted(s, archPool(s, ph)).id);
  for (let i = 0; i < n; i++) {
    const ph = weighted(s, PHASES.map((p) => ({ p, w: p.share }))).p;
    out.push(guestFor(s, archOf(ph), atIn(ph), ph, usedRegulars));
  }
  // thử thách Rush kép: thêm khách giờ cao điểm sáng
  for (let i = 0; i < (CM.guests || 0); i++) out.push(guestFor(s, archOf(PHASES[0]), atIn(PHASES[0]), PHASES[0], null));
  // bánh hôm qua bán nướng bơ đường: khách buổi sáng gọi món riêng 10k (tối đa bằng số ổ)
  if (s.stale?.choice === "sell" && s.stale.n) {
    for (let i = 0; i < Math.ceil(s.stale.n * 0.7); i++) {
      const ph = next(s) < 0.75 ? PHASES[0] : PHASES[1], arch = pick(s, ["student", "regular", "worker", "parent"]);
      out.push({ at: atIn(ph), arch, patienceMul: ph.patience, items: [makeItem("bo-duong", [])], tag: "boDuong" });
    }
  }
  // khách thêm theo nhóm: bộ điều chỉnh (song ngữ…), quảng bá (tờ rơi: học sinh buổi sáng), sự kiện giữa hai ca
  const extra = { ...modGuests(s).byArch };
  for (const [a, k] of Object.entries(promoGuests(s).byArch)) extra[a] = (extra[a] || 0) + k;
  for (const [a, k] of Object.entries(s.drama?.nextArch || {})) extra[a] = (extra[a] || 0) + k;
  for (const [a, k] of Object.entries(extra)) {
    if (!ARCHETYPES[a]) continue;
    for (let i = 0; i < Math.min(8, Math.round(k * rainMul(s))); i++) {
      const ph = a === "student" ? PHASES[0] : weighted(s, PHASES.map((p) => ({ p, w: ARCHETYPES[a].weight[p.id] || 0.2 }))).p;
      const g = guestFor(s, a, atIn(ph), ph, null);
      if (s.promo?.day === s.day) g.tag = "promo";
      out.push(g);
    }
  }
  if (s.promo?.day === s.day) for (const g of out) if (next(s) < 0.25) g.tag = g.tag || "promo";
  // khách quay lại nhờ câu trả lời review
  for (const r of returningGuests(s)) {
    const menu = menuFor(s).map((x) => x.id);
    out.push({ at: r.at, arch: r.arch, name: r.name, tag: "back", line: r.line, patienceMul: 1.2, items: [item(s, menu.includes(r.recipe) ? r.recipe : menu[0], [])] });
  }
  return out.sort((a, b) => a.at - b.at);
}
/** Thêm khách vào lịch ca (sự kiện). */
export function scheduleGuest(s, g) {
  const sh = s.shift;
  const i = sh.schedule.findIndex((x) => x.at > g.at);
  if (i < 0) sh.schedule.push(g); else sh.schedule.splice(i, 0, g);
}
function extraGuest(s, arch, at) {
  const ph = phaseAt(s.shift.t);
  const a = arch && ARCHETYPES[arch] ? arch : weighted(s, archPool(s, ph)).id;
  scheduleGuest(s, guestFor(s, a, at, ph, null));
}
/** Đơn nhiều ổ tới ngay (sự kiện fx.group). */
function groupGuest(s, G, d) {
  const sh = s.shift;
  const menu = menuFor(s).map((r) => r.id);
  const arch = ARCHETYPES[G.arch] ? G.arch : "worker";
  const rid = menu.includes(G.recipe) ? G.recipe : menu.includes("cha-lua") ? "cha-lua" : menu[0];
  const n = Math.max(2, Math.min(20, G.n || 4));
  const items = [];
  for (let i = 0; i < n; i++) {
    const q = (G.quirks || []).filter((x) => QUIRKS[x])[i] ? [G.quirks[i]] : [];
    items.push(item(s, rid, q, { bag: true }));
  }
  const name = G.name || (d?.npc ? null : null) || pick(s, ARCHETYPES[arch].names);
  scheduleGuest(s, { at: sh.t + 1500, arch, name, items, patienceMul: 2 + n / 10, tag: "group", line: G.line, group: { tip: G.tip || 0, flagOk: G.flagOk || null, laterOk: G.laterOk || null, okStars: G.okStars || 3 } });
}

function spawn(s, g, spot, ev) {
  const sh = s.shift, A = ARCHETYPES[g.arch];
  const reg = g.name && REGULARS[g.name];
  const id = sh.nextCid++;
  const name = g.name || pick(s, A.names);
  const known = reg && (s.regulars[name]?.good || 0) >= REGULAR_KNOWN_AT;
  const pMul = (g.patienceMul || 1) * (1 + (patienceBonus(s) + modSum(s, "patience")) / 100) * (fairToday(s) ? FAIR.patienceMul : 1) * (challengeMods(s).patienceMul || 1);
  const c = {
    id, arch: g.arch, sprite: A.sprite, name, self: reg?.self || A.self, call: A.call, items: g.items, filled: g.items.map(() => null),
    phase: "enter", t0: sh.t, arriveT: null, patience: Math.round(A.patience * pMul * (s.tutorialDone ? NORMAL_DAY.patienceMul : 1)), spot, mood: "waiting", say: null,
    orderLine: "", nhuCu: !!known, pay: null, payPlan: g.pay ?? null, leaveT: null, reactUntil: null, remade: false, impatientSaid: false, discount: 0,
  };
  if (g.tag) c.tag = g.tag;
  if (g.group) c.group = g.group;
  const ctx = lineCtx(c, { order: orderText(c.items), n: c.items.length, shop: s.shopName, loaf: loafName(c.items[0]) });
  if (g.line) c.orderLine = fill(g.line, ctx) + (g.tag === "back" ? " " + orderText(c.items) + "." : "");
  else if (c.nhuCu) c.orderLine = freshLine(s, L.NHU_CU_LINES, ctx);
  else if (c.items[0].recipe === "bachuc") c.orderLine = freshLine(s, L.BACHUC_LINES, { ...ctx, target: c.items[0].target });
  else if (c.items.length > 1) c.orderLine = freshLine(s, L.MULTI_LINES, ctx);
  else if (c.items[0].recipe === "bo-duong") c.orderLine = freshLine(s, BO_DUONG.say, ctx);
  else if (g.tag === "fair") c.orderLine = freshLine(s, FAIR_LINES.say, ctx) + " " + orderText(c.items) + ".";
  else if (c.items[0].recipe === "que") c.orderLine = freshLine(s, M3.QUE.say, ctx);
  else if (c.items[0].recipe === "gia-truyen") c.orderLine = freshLine(s, M3.HOUSE_LOAF.say, ctx);
  else if (s.shop && s.cartMemory && s.day - s.cartMemory.movedDay < 4 && next(s) < 0.25) c.orderLine = freshLine(s, M3.SHOP.say, ctx) + " Cho " + orderText(c.items) + ".";
  else c.orderLine = freshLine(s, [...L.ORDER_LINES, ...(L.ORDER_BY_ARCH[g.arch] || [])], ctx);
  sh.customers.push(c);
  ev.push({ type: "arrive", cid: id });
}
const queueMax = (s) => (s.owned?.["queue-rope"] && s.shop ? 6 : QUEUE_MAX[stage(s)]);
const freeSpot = (s) => { const used = new Set(s.shift.customers.filter((c) => c.phase !== "leave" && !c.pre).map((c) => c.spot)); for (let i = 0; i < queueMax(s); i++) if (!used.has(i)) return i; return -1; };

/** Đơn đặt trước vào ca: phiếu có hạn giao (không đứng hàng chờ, người lấy đơn tới khi giao xong). */
export function spawnPre(s, p, ev) {
  const sh = s.shift;
  const A = ARCHETYPES[p.arch] || ARCHETYPES.office;
  const due = p.dueT ?? sh.t + (p.dueMs ?? 60000);
  const c = {
    id: sh.nextCid++, arch: p.arch, sprite: A.sprite, name: p.name, self: A.self, call: A.call, items: p.items, filled: p.items.map(() => null),
    phase: "wait", t0: sh.t, arriveT: sh.t, patience: Math.max(30000, due - sh.t + PREORDER.grace), spot: -1, mood: "waiting", say: null,
    orderLine: `${p.label}: ${orderText(p.items)}`, nhuCu: false, pay: null, payPlan: "transfer", leaveT: null, reactUntil: null, remade: false, impatientSaid: true, discount: 0,
    pre: { id: p.id, dueT: due, deposit: p.deposit, label: p.label, tip: p.tip || 0, flagOk: p.flagOk, laterOk: p.laterOk, okStars: p.okStars || 4, ...(p.contract ? { contract: p.contract } : {}) },
  };
  if (p.contract) c.orderLine = `${p.label}: ${orderText(p.items)}. ` + freshLine(s, CONTRACT_LINES.say, lineCtx(c, { n: p.items.length }));
  sh.customers.push(c);
  ev.push({ type: "preorderOpen", cid: c.id, name: c.name, n: c.items.length, due });
  return c;
}

// ---------- mở ca ----------
export function startShift(s, ev) {
  if (s.shift) return { err: "shift-open" };
  rollWeather(s);
  const fee = Math.min(shiftFee(s), s.money);
  spend(s, fee);
  const sh = {
    status: "open", t: 0, day: s.day, phase: "sang", schedule: [], customers: [], nextCid: 1, boards: Array.from({ length: boardCount(s) }, () => emptyBoard()), sel: 0,
    oven: new Array(Math.min(ovenOf(s).slots, challengeMods(s).slots || 9)).fill(null), case: [], que: 0, len: shiftLenFor(s), cook: freshCook(s), dialog: null, away: null, deliveries: [], paying: null, usedLines: [], lowSaid: {},
    waste: {}, wasteLog: [], fee, tutorial: !s.tutorialDone, consignUsed: false, settleQueue: [], feedFrom: s.feed.length ? s.feed[0].id : 0,
    moments: [], missions: [], lastServe: null, burntAt: null, helperUntil: 0, followers0: s.followers || 0, witness: null,
    stats: { served: 0, loaves: 0, revenue: 0, cogs: 0, batches: s.prep?.batches || 0, burntBatches: 0, goldenPulls: 0, toasts: 0, lost: 0, timeouts: 0, stars: [],
      changeRight: 0, changeWrong: 0, changeLoss: 0, restockSpent: 0, rescueSpent: 0, xp: 0, consignRepaid: 0, owed: 0, mistakes: {}, multi: 0, preorders: 0, preLate: 0,
      staleSold: 0, eventCash: 0, missionCash: 0, lostSang: 0, burntMeat: 0, boDuong: 0 },
  };
  s.shift = sh;
  sh.schedule = genGuests(s);
  for (const l of s.prep?.loaves || []) sh.case.push(newLoaf(s, l.crisp, "oven", l.dark ? { dark: true } : {}));
  if (s.prep?.burnt) addWaste(sh, "burnt", s.prep.burnt * STOCK.phoi.cost, `Mẻ đầu cháy (${s.prep.burnt} ổ)`);
  if (s.prep?.golden) engineFlag(s, "me-vang", 0);
  // bánh hôm qua: bán nướng bơ đường (vào tủ giòn 30) · cho đi (+1 danh tiếng) · bỏ
  if (s.stale?.n) {
    if (s.stale.choice === "sell") { for (let i = 0; i < s.stale.n; i++) sh.case.push(newLoaf(s, STALE_CRISP, "stale")); engineFlag(s, "bo-duong", 0); }
    else if (s.stale.choice === "give") { s.rep = Math.min(100, s.rep + 1); sh.moments.push({ kind: "stale", name: "", line: `Cho đi ${s.stale.n} ổ bánh hôm qua. Hẻm no thêm một chút.` }); }
    s.stale = null;
  }
  // bánh sỉ trong kho (Chị Mai) ra tủ lúc mở cửa, giòn 80
  const si = Math.min(s.stock["banh-si"] || 0, 20);
  if (si) { s.stock["banh-si"] -= si; for (let i = 0; i < si; i++) sh.case.push(newLoaf(s, 80, "si")); }
  contractOrders(s, ev, (st, spec, e) => createPreorder(st, spec, e, { spawnPre }));
  for (const p of (s.preorders || []).filter((x) => x.day === s.day)) spawnPre(s, p, ev);
  // cờ cho sự kiện cơ chế M5 (TR1, NT1): hôm nay có chảo trứng / bếp than
  if (s.owned?.["egg-pan"] && menuFor(s).some((r) => r.id === "trung")) engineFlag(s, "chao-trung", 0);
  if (s.owned?.grill && menuFor(s).some((r) => r.id === "thit-nuong")) engineFlag(s, "nuong-thit", 0);
  s.preorders = (s.preorders || []).filter((x) => x.day > s.day);
  s.prep = null;
  s.usedDay = [];
  if (s.drama) { s.drama.nextGuests = 0; s.drama.nextArch = {}; }
  startDrama(s);
  startMissions(s);
  ev.push({ type: "shiftStarted", day: s.day, guests: sh.schedule.length, fee, weather: s.weather?.kind });
  return { ok: true };
}

// ---------- nhịp ca ----------
export const HOOKS = {
  gainXp, netReview: (s, r) => netReview(s, r), preorder: (s, spec, ev) => createPreorder(s, spec, ev, { spawnPre }),
  extraGuest, group: (s, G, d) => groupGuest(s, G, d), addQuirk: (c, q) => addQuirk(c, q), leave: (s, c) => leaveQuiet(s, c),
  onDramaDone: (s, ev) => missionsOnDrama(s, ev, gainXp),
  contract: (s, spec, ev) => addContract(s, spec, ev),
};
function addQuirk(c, q) {
  const Q = QUIRKS[q];
  for (let i = 0; i < c.items.length; i++) {
    const it = c.items[i];
    if (c.filled[i] || it.recipe === "bachuc" || it.quirks.includes(q) || (Q.needs && !Q.needs(it)) || it.quirks.some((x) => QUIRKS[x].conflicts?.includes(q) || Q.conflicts?.includes(x))) continue;
    Q.apply(it); it.quirks.push(q);
  }
}
function leaveQuiet(s, c) {
  const sh = s.shift;
  for (const b of sh.boards) if (b.cid === c.id) { if (b.loaf) wasteLoaf(sh, b.loaf, "Ổ làm dở, khách rời quầy"); Object.assign(b, emptyBoard()); }
  for (const f of c.filled) if (f) wasteLoaf(sh, f, "Ổ đã gói, khách rời quầy");
  c.phase = "leave"; c.leaveT = sh.t; c.mood = "happy";
}

export function tick(s, dt, ev) {
  const sh = s.shift;
  if (!sh || sh.status !== "open") return { err: "no-shift" };
  if (!(dt > 0) || dt > 1000) return { err: "bad-dt" };
  if (sh.dialog) return { ok: true };
  if (sh.closeNow) { sh.closeNow = false; return endShift(s, ev, true); }
  sh.t += dt;
  const ph = phaseAt(sh.t);
  if (ph.id !== sh.phase && sh.t < shiftLen(sh)) { sh.phase = ph.id; ev.push({ type: "phase", id: ph.id, text: PHASE_BANNER[ph.id] || ph.name }); }
  if (sh.t >= shiftLen(sh)) sh.schedule = [];
  while (sh.schedule.length && sh.schedule[0].at <= sh.t) {
    const spot = freeSpot(s);
    if (spot < 0) break;
    spawn(s, sh.schedule.shift(), spot, ev);
  }
  for (const c of [...sh.customers]) {
    if (c.pre) {
      if (c.phase === "wait" && sh.t > c.pre.dueT + PREORDER.grace) preFail(s, c, ev);
      else if (c.phase === "react" && sh.t >= c.reactUntil) sh.customers.splice(sh.customers.indexOf(c), 1);
      else if (c.phase === "leave" || c.phase === "enter" || c.phase === "pay" && !c.pay) sh.customers.splice(sh.customers.indexOf(c), 1); // người lấy đơn đặt trước rời quầy (sự kiện): không đứng hàng chờ nên bỏ ngay
      continue;
    }
    if (c.phase === "enter" && sh.t - c.t0 >= WALK_MS) {
      c.phase = "wait"; c.arriveT = sh.t; c.say = { text: c.orderLine, at: sh.t };
    } else if (c.phase === "wait") {
      const used = (sh.t - c.arriveT) / c.patience;
      if (used >= 1) timeout(s, c, ev);
      else if (used >= 0.65 && !c.impatientSaid) { c.impatientSaid = true; c.mood = "impatient"; c.say = { text: freshLine(s, L.IMPATIENT_LINES, lineCtx(c)), at: sh.t }; ev.push({ type: "impatient", cid: c.id }); }
    } else if (c.phase === "react" && sh.t >= c.reactUntil) { c.phase = "leave"; c.leaveT = sh.t; }
    else if (c.phase === "leave" && sh.t - c.leaveT >= WALK_MS) sh.customers.splice(sh.customers.indexOf(c), 1);
  }
  tickOven(s, dt, ev);
  tickCook(s, ev);
  tickRescue(s, ev);
  while (sh.settleQueue.length) {
    const q = sh.settleQueue.shift(), c = customer(s, q.cid);
    if (c && c.phase === "pay") settle(s, c, { received: { [c.pay.bill]: 1 }, change: {}, viaExchange: true }, ev);
  }
  // phụ việc tự thối đúng cho khách đang trả tiền
  if (sh.paying !== null && !sh.dialog && !sh.away && helperOn(s)) {
    const c = customer(s, sh.paying), mk = c && makeChange(s.float, c.pay.change);
    if (mk) { ev.push({ type: "helperChange", line: freshLine(s, helperToday(s) ? M3.HELPER_LINES : M3.MOM_HELP_LINES, {}) }); settle(s, c, { received: { [c.pay.bill]: 1 }, change: mk }, ev); }
  }
  if (sh.t >= shiftLen(sh) && !sh.customers.length && !sh.schedule.length && !sh.dialog && !sh.away) return endShift(s, ev, false);
  maybeTrigger(s, ev);
  return { ok: true };
}

function timeout(s, c, ev) {
  const sh = s.shift;
  for (const b of sh.boards) if (b.cid === c.id) { if (b.loaf) wasteLoaf(sh, b.loaf, "Ổ làm dở, khách bỏ về"); Object.assign(b, emptyBoard()); }
  takePartial(s, c, ev);
  for (const f of c.filled) if (f) wasteLoaf(sh, f, "Ổ đã gói, khách bỏ về");
  c.phase = "leave"; c.leaveT = sh.t; c.mood = "impatient";
  c.say = { text: freshLine(s, L.TIMEOUT_SAY, lineCtx(c)), at: sh.t };
  review(s, c, 1, freshLine(s, L.TIMEOUT_REVIEW, lineCtx(c)), "timeout");
  s.rep = Math.max(0, s.rep - 1);
  sh.stats.timeouts++; sh.stats.lost++;
  if (sh.phase === "sang") sh.stats.lostSang++;
  ev.push({ type: "timeout", cid: c.id, name: c.name });
}
/** Đơn đặt trước quá hạn + thời gian chờ: giao thiếu / huỷ — mất phần còn lại (cọc giữ), review 2 sao. */
function preFail(s, c, ev) {
  const sh = s.shift;
  for (const b of sh.boards) if (b.cid === c.id) { if (b.loaf) wasteLoaf(sh, b.loaf, "Ổ làm dở, đơn đặt trước huỷ"); Object.assign(b, emptyBoard()); }
  const got = c.filled.filter(Boolean).length;
  takePartial(s, c, ev); // người lấy đơn mang về phần đã gói (trả 70%), phần còn lại huỷ
  for (const f of c.filled) if (f) wasteLoaf(sh, f, "Ổ của đơn đặt trước giao thiếu");
  sh.stats.revenue += c.pre.deposit;
  if (c.pre.contract) contractFailed(s, c.pre.contract, ev);
  c.phase = "react"; c.reactUntil = sh.t + 1200; c.mood = "impatient";
  review(s, c, 2, freshLine(s, M3.PREORDER_REVIEW.short, lineCtx(c, { n: c.items.length })), "preShort");
  s.rep = Math.max(0, s.rep - 2);
  sh.stats.lost++;
  sh.moments.push({ kind: "preorder", name: c.name, line: `Đơn đặt trước ${c.items.length} ổ của ${c.name} không kịp (xong ${got} ổ). Cọc giữ, uy tín thì không.` });
  ev.push({ type: "preorderFail", cid: c.id, name: c.name, line: freshLine(s, M3.PREORDER_SAY.short, lineCtx(c)) });
}

// ---------- ghim phiếu ----------
export function pin(s, cid, ev) {
  const sh = s.shift;
  if (!sh) return { err: "no-shift" };
  if (sh.away) return { err: "away" };
  if (sh.dialog) return { err: "dialog" };
  const c = customer(s, cid);
  if (!c || c.phase !== "wait") return { err: "not-waiting" };
  const b = board(s);
  if (b.cid === cid) return { ok: true };
  if (b.loaf) return { err: "board-busy" };
  const other = sh.boards.findIndex((x, i) => i !== sh.sel && x.cid === cid);
  if (other >= 0 && !sh.boards[other].loaf) Object.assign(sh.boards[other], emptyBoard());
  else if (other >= 0) { sh.sel = other; ev.push({ type: "boardSelected", idx: other }); return { ok: true }; }
  const item = nextItem(sh, c);
  Object.assign(b, emptyBoard(cid, item < 0 ? 0 : item));
  c.pinned = true;
  ev.push({ type: "pinned", cid });
  return { ok: true };
}
/** Ổ chưa ráp kế tiếp (bỏ qua ổ đang ráp trên thớt khác). */
function nextItem(sh, c, skipBoard = -1) {
  const busy = new Set(sh.boards.filter((x, i) => i !== skipBoard && x.cid === c.id && x.loaf).flatMap((x) => Array.from({ length: x.loaf.n || 1 }, (_, k) => x.item + k)));
  return c.filled.findIndex((f, i) => !f && !busy.has(i));
}
export function selectItem(s, idx, ev) {
  const b = s.shift && board(s);
  if (!b || b.cid === null) return { err: "no-ticket" };
  if (b.loaf) return { err: "board-busy" };
  const c = customer(s, b.cid);
  if (!c || !Number.isInteger(idx) || idx < 0 || idx >= c.items.length || c.filled[idx]) return { err: "bad-item" };
  b.item = idx;
  ev.push({ type: "itemSelected", idx });
  return { ok: true };
}
/** Thớt đôi / ba: chọn thớt đang làm. */
export function selectBoard(s, idx, ev) {
  const sh = s.shift;
  if (!sh) return { err: "no-shift" };
  if (!Number.isInteger(idx) || idx < 0 || idx >= sh.boards.length) return { err: "bad-board" };
  sh.sel = idx;
  ev.push({ type: "boardSelected", idx });
  return { ok: true };
}

// ---------- giao ----------
export function serve(s, ev) {
  const sh = s.shift;
  if (!sh) return { err: "no-shift" };
  if (sh.away) return { err: "away" };
  if (sh.dialog) return { err: "dialog" };
  if (sh.paying !== null) return { err: "paying" };
  const b = board(s);
  if (!b.loaf) return { err: "not-wrapped" };
  const c = customer(s, b.cid);
  if (!c || c.phase !== "wait") return { err: "not-waiting" };
  if (!b.loaf.wrap) {
    // phụ việc gói giùm đúng kiểu phiếu
    if (!helperOn(s) || !b.loaf.sliced && !b.loaf.que) return { err: "not-wrapped" };
    const it = c.items[b.item];
    const kind = it.bag ? "tui" : it.wrap;
    if ((s.stock["giay-goi"] || 0) < (b.loaf.n || 1)) return { err: "not-wrapped" };
    s.stock["giay-goi"] -= b.loaf.n || 1;
    b.loaf.wrap = kind;
  }
  const n = b.loaf.n || 1;
  let filledNow = 0;
  for (let k = 0, i = b.item; k < n && i < c.items.length; i++) {
    if (c.filled[i]) continue;
    if (k > 0 && !sameSpec(c.items[i], c.items[b.item])) continue;
    c.filled[i] = finished(b.loaf, i);
    k++; filledNow++;
  }
  c.fillT0 = c.fillT0 ?? sh.t; c.fillT1 = sh.t;
  if (filledNow > 1) c.batched = (c.batched || 0) + 1;
  const ni = nextItem(sh, c, sh.sel);
  if (ni >= 0) {
    Object.assign(b, emptyBoard(c.id, ni));
    ev.push({ type: "filled", cid: c.id, n: c.filled.filter(Boolean).length, of: c.items.length, batch: filledNow });
    return { ok: true };
  }
  Object.assign(b, emptyBoard());
  if (c.filled.some((f) => !f)) { ev.push({ type: "filled", cid: c.id, n: c.filled.filter(Boolean).length, of: c.items.length, batch: filledNow }); return { ok: true }; }
  return complete(s, c, ev);
}
/** Hai ổ cùng yêu cầu (để ráp ×N). */
export const specKey = (it) => JSON.stringify([it.recipe, it.spreads, it.fills, it.veg, it.ot, it.sauces, it.wrap, it.crispy, !!it.bag, it.target || 0]);
export const sameSpec = (a, b) => specKey(a) === specKey(b);

function mistakeCtx(c) {
  const it = c.items[0], f = c.filled[0];
  const got = f?.fills?.length ? f.fills.map((x) => NAMES[x].toLocaleLowerCase("vi")).join(", ") : "ổ trơn";
  return lineCtx(c, { want: loafName(it), got, loaf: loafName(it), price: orderPrice(c) });
}
const mergePool = (base, more, arch) => [...poolFor(base, arch), ...poolFor(more, arch)];
function complete(s, c, ev) {
  const sh = s.shift;
  const sc = scoreOrder(c, (c.pre ? 0 : sh.t - c.arriveT));
  if (c.remade) sc.stars = Math.min(sc.stars, 4);
  if (c.pre) {
    const late = sh.t - c.pre.dueT;
    c.pre.late = Math.max(0, late); c.pre.onTime = late <= 0;
    if (late > PREORDER.lateSmall) { c.discount = Math.max(c.discount, PREORDER.lateBigCut); sc.stars = Math.min(sc.stars, 2); }
    else if (late > 0) { c.discount = Math.max(c.discount, PREORDER.lateSmallCut); sc.stars = Math.min(sc.stars, 4); }
  }
  c.score = sc;
  const recipeMistake = sc.mistakes.find((m) => m !== "wrongChange");
  if (sc.stars <= 2 && recipeMistake && !c.remade && !c.pre) {
    const line = freshLine(s, mergePool(MISTAKE_SAY[recipeMistake], MISTAKE_SAY_MORE[recipeMistake], c.arch), mistakeCtx(c));
    c.say = { text: line, at: sh.t }; c.mood = "surprised";
    sh.dialog = { kind: "complaint", cid: c.id, stars: sc.stars, mistake: recipeMistake, line };
    ev.push({ type: "complaint", cid: c.id, mistake: recipeMistake });
    return { ok: true };
  }
  return enterPay(s, c, ev);
}
export function resolveComplaint(s, choice, ev) {
  const sh = s.shift, d = sh?.dialog;
  if (!d || d.kind !== "complaint") return { err: "no-dialog" };
  const c = customer(s, d.cid);
  if (!c) { sh.dialog = null; return { err: "gone" }; }
  if (!["remake", "discount", "free"].includes(choice)) return { err: "bad-choice" };
  sh.dialog = null;
  c.say = { text: freshLine(s, L.COMPLAINT_RESULT[choice], lineCtx(c)), at: sh.t };
  ev.push({ type: "complaintResolved", cid: c.id, choice });
  if (choice === "remake") {
    c.score.per.forEach((p, i) => { if (p.mistakes.length || p.errors.length) { wasteLoaf(sh, c.filled[i], "Ổ làm lại"); c.filled[i] = null; } });
    if (c.filled.every(Boolean)) c.filled = c.filled.map(() => null);
    c.remade = true; c.mood = "waiting"; c.score = null;
    c.arriveT = sh.t - Math.round(c.patience * 0.3); c.impatientSaid = false;
    const b = board(s);
    if (b.cid === null && !b.loaf) Object.assign(b, emptyBoard(c.id, c.filled.findIndex((f) => !f)));
    return { ok: true };
  }
  if (choice === "discount") { c.discount = 0.5; c.score.stars = Math.min(3, c.score.stars + 1); }
  if (choice === "free") { c.discount = 1; c.score.stars = 3; c.free = true; }
  return enterPay(s, c, ev);
}

// ---------- trả tiền + thối ----------
/** Giá phải trả: ổ làm từ bánh hôm qua rẻ 30% (tối thiểu 10k). */
export function dueOf(c) {
  let sum = 0;
  c.items.forEach((it, i) => { const p = it.price; sum += c.filled[i]?.src === "stale" ? Math.max(10, Math.round(p * 0.7)) : p; });
  return Math.round(sum * (1 - c.discount)) - (c.pre?.deposit || 0);
}
function enterPay(s, c, ev) {
  const sh = s.shift;
  const due = Math.max(0, dueOf(c));
  c.phase = "pay";
  let pay;
  if (due <= 0 || c.free) pay = { kind: "free" };
  else if (c.pre) pay = { kind: "transfer" };
  else if (c.payPlan === "exact") pay = { kind: "exact", bills: greedyBills(due, c.arch === "regular" ? [5, 2, 1] : undefined) };
  else if (c.payPlan === "transfer") pay = { kind: "transfer" };
  else if (typeof c.payPlan === "number" && c.payPlan >= due) pay = { kind: "bill", bill: c.payPlan };
  else pay = customerPays(s, ARCHETYPES[c.arch], due, { early: sh.t > 21000 && sh.t < 63000, level: s.level });
  c.pay = { due: c.free ? 0 : due, ...pay };
  if (pay.kind === "free") return settle(s, c, { received: {}, change: {} }, ev);
  if (pay.kind === "transfer") return settle(s, c, { received: {}, change: {}, transfer: true }, ev);
  if (pay.kind === "exact") return settle(s, c, { received: pay.bills, change: {} }, ev);
  const change = pay.bill - due;
  if (change === 0) return settle(s, c, { received: { [pay.bill]: 1 }, change: {} }, ev);
  c.pay.change = change;
  sh.paying = c.id;
  ev.push({ type: "paying", cid: c.id, bill: pay.bill, due, change });
  if (!canChange(s.float, change)) openNochange(s, c, ev);
  return { ok: true };
}
export function giveChange(s, bills, ev) {
  const sh = s.shift;
  if (!sh || sh.paying === null) return { err: "not-paying" };
  if (sh.dialog) return { err: "dialog" };
  if (sh.away) return { err: "away" };
  if (!bills || typeof bills !== "object") return { err: "bad-bills" };
  const clean = {};
  for (const [d, n] of Object.entries(bills)) {
    if (!Number.isInteger(n) || n < 0) return { err: "bad-bills" };
    if (n > 0) { if ((s.float[d] || 0) < n) return { err: "no-bills" }; clean[d] = n; }
  }
  const c = customer(s, sh.paying);
  return settle(s, c, { received: { [c.pay.bill]: 1 }, change: clean }, ev);
}
export function autoChange(s, ev) {
  const sh = s.shift;
  if (!sh || sh.paying === null) return { err: "not-paying" };
  if (!autoChangeAllowed(s)) return { err: "manual-change" };
  if (sh.dialog) return { err: "dialog" };
  if (sh.away) return { err: "away" };
  const c = customer(s, sh.paying);
  const mk = makeChange(s.float, c.pay.change);
  if (!mk) { openNochange(s, c, ev); return { ok: true }; }
  return giveChange(s, mk, ev);
}
export function noChange(s, ev) {
  const sh = s.shift;
  if (!sh || sh.paying === null) return { err: "not-paying" };
  if (sh.dialog || sh.away) return { err: sh.dialog ? "dialog" : "away" };
  openNochange(s, customer(s, sh.paying), ev);
  return { ok: true };
}
/** Chốt tiền một khách: nhận tiền, đưa tiền thối, kiểm đúng / thiếu / dư, review, XP, nhiệm vụ, chuỗi đơn nhóm / đặt trước. */
export function settle(s, c, pay, ev) {
  const sh = s.shift;
  const due = c.pay.due, needChange = c.pay.kind === "bill" ? c.pay.bill - due : 0;
  let received = 0, changeErr = null, diff = 0, changeLine = null;
  if (pay.owed || pay.lost) {
    sh.stats.owed += due;
  } else if (pay.viaExchange) {
    receive(s, pay.received); spend(s, needChange); received = due;
    sh.stats.changeRight++;
  } else {
    if (!payOut(s, pay.change)) return { err: "no-bills" };
    receive(s, pay.received);
    if (pay.transfer) s.money += due;
    received = c.pay.kind === "free" ? 0 : due;
    if (c.pay.kind === "bill" && !pay.exact) {
      diff = sumBills(pay.change) - needChange;
      const ctx = lineCtx(c, { diff: Math.abs(diff), price: due });
      if (diff < 0) { changeErr = "short"; spend(s, Math.min(-diff, s.money)); changeLine = freshLine(s, L.CHANGE_LINES.short, ctx); sh.stats.changeWrong++; }
      else if (diff > 0) {
        sh.stats.changeWrong++;
        if (next(s) < HONEST_RETURN) { receive(s, greedyBills(diff)); s.rep = Math.min(100, s.rep + 1); changeErr = "overBack"; changeLine = freshLine(s, L.CHANGE_LINES.overBack, ctx); }
        else { changeErr = "overGone"; sh.stats.changeLoss += diff; changeLine = freshLine(s, L.CHANGE_LINES.overGone, ctx); }
      } else { sh.stats.changeRight++; changeLine = freshLine(s, L.CHANGE_LINES.right, ctx); missionsOnChange(s, true, ev, gainXp); }
    } else if (c.pay.kind === "transfer") changeLine = freshLine(s, L.CHANGE_LINES.transfer, lineCtx(c));
    else if (c.pay.kind === "exact") changeLine = freshLine(s, L.CHANGE_LINES.exact, lineCtx(c));
  }
  const sc = c.score;
  if (changeErr === "short") { sc.stars = Math.min(sc.stars, 2); if (!sc.mistakes.includes("wrongChange")) sc.mistakes.push("wrongChange"); }
  // giá vốn + trả dần ký gửi
  let cogs = 0;
  for (const f of c.filled) cogs += (f.src === "si" ? STOCK["banh-si"].cost : f.src === "stale" ? 0 : f.src === "que" ? STOCK["phoi-que"].cost * QUE.bag : STOCK.phoi.cost) + Object.entries(f.used || {}).reduce((a, [id, n]) => a + n * STOCK[id].cost, 0);
  sh.stats.cogs = Math.round((sh.stats.cogs + cogs) * 10) / 10;
  if (received > 0) {
    const repay = Math.min(repayConsign(s, cogs), s.money);
    if (repay) { spend(s, repay); sh.stats.consignRepaid += repay; if (!s.consign) engineFlag(s, "ky-gui-xong", 2); }
  }
  // đơn đặt trước: cọc tính vào doanh thu lúc giao; thưởng nếu đúng giờ
  if (c.pre) {
    sh.stats.revenue += c.pre.deposit;
    sh.stats.preorders++;
    if (!c.pre.onTime) sh.stats.preLate++;
    if (c.pre.onTime && c.pre.tip && sc.stars >= 3) { s.money += c.pre.tip; sh.stats.revenue += c.pre.tip; }
    if (c.pre.contract) contractDelivered(s, c.pre.contract, c.pre.onTime, ev);
  }
  if (c.group?.tip && sc.stars >= 4 && !sc.mistakes.length) { s.money += c.group.tip; sh.stats.revenue += c.group.tip; }
  sh.stats.revenue += received;
  sh.stats.served++; sh.stats.loaves += c.items.length; sh.stats.stars.push(sc.stars);
  sh.stats.staleSold += c.filled.filter((f) => f.src === "stale").length;
  sh.stats.boDuong += c.items.filter((it) => it.recipe === "bo-duong").length;
  if (c.items.length > 1) sh.stats.multi++;
  for (const m of sc.mistakes) sh.stats.mistakes[m] = (sh.stats.mistakes[m] || 0) + 1;
  // XP: 4 ổ đầu đủ, ổ thứ 5 trở đi 50%; tặng luôn = 0 XP
  let xp = 0;
  if (!c.free && !pay.lost) c.items.forEach((it, i) => { xp += (it.recipe === "bachuc" ? 8 : RECIPE[it.recipe].xp) * XP_MUL[sc.stars] * (i >= 4 ? 0.5 : 1); });
  xp = gainXp(s, xp, ev);
  s.rep = Math.min(100, Math.max(0, s.rep + (sc.stars >= 5 ? 1 : sc.stars <= 2 ? -1 : 0)));
  if (REGULARS[c.name]) { const r = (s.regulars[c.name] ||= { visits: 0, good: 0 }); r.visits++; if (sc.stars >= 4) r.good++; }
  // chuỗi sự kiện: đơn nhóm / đặt trước giao trọn đủ sao
  const okMeta = c.group || (c.pre && c.pre.onTime ? c.pre : null);
  if (okMeta && sc.stars >= (okMeta.okStars || 3)) {
    if (okMeta.flagOk) engineFlag(s, okMeta.flagOk, 4);
    if (okMeta.laterOk?.id && s.drama) s.drama.queue.push({ id: okMeta.laterOk.id, day: today(s) + (okMeta.laterOk.days ?? 1), from: "order" });
  }
  // ổ ba chục thiếu nhân (V05) + ghi nhớ khách vừa nhận cho sự kiện
  const bachucLow = c.items.some((it, i) => it.recipe === "bachuc" && bachucPrice(c.filled[i]) < 22);
  if (bachucLow) engineFlag(s, "bachuc-thieu", 2);
  sh.lastServe = { cid: c.id, t: sh.t, stars: sc.stars, arch: c.arch, mistakes: [...sc.mistakes], crisp: Math.round(Math.min(...c.filled.map((f) => f.crisp ?? 0))), loaves: c.items.length,
    overpaid: changeErr === "overBack" || changeErr === "overGone" ? diff : 0, bachucLow, quirks: [...new Set(c.items.flatMap((it) => it.quirks))], burnt: c.filled.some((f) => f.burnt) };
  missionsOnServe(s, c, sc, ev, gainXp);
  // review + phản ứng
  const { line, reason } = reviewLine(s, c, sc, changeErr);
  review(s, c, sc.stars, line, reason);
  if (sc.stars >= 5) sh.moments.push({ kind: "five", name: c.name, line });
  if (c.items.length >= 4 && sc.stars >= 4) sh.moments.push({ kind: c.pre ? "preorder" : "multi", name: c.name, line });
  if (c.pre) sh.moments.push({ kind: "preorder", name: c.name, line: c.pre.onTime ? `Giao ${c.items.length} ổ cho ${c.name} đúng giờ.` : `Giao ${c.items.length} ổ cho ${c.name} trễ ${Math.ceil(c.pre.late / 1000)} giây.` });
  if (sc.mistakes.length && sc.stars <= 2) sh.moments.push({ kind: "mistake", name: c.name, line });
  c.phase = "react"; c.reactUntil = sh.t + 1600; c.mood = sc.stars >= 3 ? "happy" : "impatient"; c.stars = sc.stars;
  const say = c.pre ? freshLine(s, c.pre.onTime ? M3.PREORDER_SAY.pickup : M3.PREORDER_SAY.late, lineCtx(c)) : c.items.length > 1 ? freshLine(s, sc.mistakes.length ? M3.MULTI_SAY.oneOff : M3.MULTI_SAY.allRight, lineCtx(c, { n: c.items.length })) : null;
  c.say = { text: changeLine && changeErr ? changeLine : say || freshLine(s, sc.stars >= 4 ? L.HAPPY_LINES : L.MEH_LINES, lineCtx(c)), at: sh.t };
  if (sh.paying === c.id) sh.paying = null;
  ev.push({ type: "served", cid: c.id, price: received, stars: sc.stars, xp, change: changeErr, diff, owed: !!pay.owed, lost: !!pay.lost, loaves: c.items.length, pre: !!c.pre });
  return { ok: true };
}
/** Câu review + lý do (lý do quyết định lựa chọn trả lời ở core/reviews.js). Ưu tiên câu riêng của cơ chế (PLAYBOOK §5). */
function reviewLine(s, c, sc, changeErr) {
  const sh = s.shift;
  const ctx = lineCtx(c, { target: c.items[0].target, loaf: loafName(c.items[0]), n: c.items.length });
  const pickL = (list, reason) => ({ line: freshLine(s, list, ctx), reason });
  const mk = sc.mistakes[0];
  const multi = c.items.length > 1;
  if (c.pre?.contract) return pickL(c.pre.late > 0 ? CONTRACT_REVIEW.late : CONTRACT_REVIEW.onTime, c.pre.late > 0 ? "preLate" : "preorder");
  if (c.pre) {
    if (c.pre.late > PREORDER.lateSmall) return pickL(M3.PREORDER_REVIEW.lateBig, "preLate");
    if (c.pre.late > 0) return pickL(M3.PREORDER_REVIEW.lateLittle, "preLate");
    if (!mk) return pickL(M3.PREORDER_REVIEW.onTime, "preorder");
  }
  if (multi && mk === "swapped") return pickL(M3.MULTI_REVIEW.swapped, "swapped");
  if (mk) {
    if (mk === "wrongChange" && changeErr === "short" && next(s) < 0.5) return pickL(M3.CHANGE_REVIEW.short, "wrongChange");
    if (mk === "soggy" && next(s) < 0.4) return pickL(M3.CRISP_REVIEW.soggy, "soggy");
    if (multi && next(s) < 0.5 && sc.per.filter((p) => p.errors.length).length === 1) return pickL(M3.MULTI_REVIEW.oneOff, "multiWrong");
    return pickL(mergePool(MISTAKE_REVIEW[mk], MISTAKE_REVIEW_MORE[mk], c.arch), mk);
  }
  const it = c.items[0];
  if (it.recipe === "bachuc") { const d = bachucPrice(c.filled[0]) - it.target; return pickL(L.BACHUC_REVIEW[d < -BACHUC.tolerance ? "low" : d > BACHUC.tolerance ? "high" : "right"], "ok"); }
  if (multi && sc.stars >= 3) {
    if (c.fillT1 - c.fillT0 > 18000 && next(s) < 0.6) return pickL(M3.MULTI_REVIEW.late, "multiLate");
    if (next(s) < 0.6) return pickL(c.batched ? M3.MULTI_REVIEW.together : M3.MULTI_REVIEW.allRight, "multi");
  }
  if (sh?.witness && sh.t - sh.witness.t < 40000 && next(s) < 0.6) { const w = sh.witness.kind; sh.witness = null; return pickL(M3.STOCKOUT_REVIEW[w], sc.stars >= 4 ? "good" : "ok"); }
  if (changeErr === "overBack" && next(s) < 0.6) return pickL(M3.CHANGE_REVIEW.overBack, "good");
  if (it.recipe === "bo-duong") return pickL(BO_DUONG.review[sc.stars >= 4 ? "good" : "soggy"], sc.stars >= 4 ? "good" : "stale");
  if (c.filled.some((f) => f.src === "stale")) return pickL(M3.STALE.review, sc.stars >= 4 ? "good" : "stale");
  const ck = c.filled.find((f) => f.ck)?.ck;
  if (ck && next(s) < 0.55) return ck === "fresh" || ck === "held" ? pickL(COOK_LINES.grillReview[ck], ck === "fresh" && sc.stars >= 4 ? "good" : "ok") : pickL(COOK_LINES.eggReview[ck], ck === "hot" && sc.stars >= 4 ? "good" : "ok");
  if (c.filled.some((f) => f.veg?.["do-chua"]) && next(s) < 0.12) { const old = (s.lots?.["do-chua"]?.[0]?.[0] ?? s.day) <= s.day - 2; return pickL(old ? EXPIRY_LINES.old : EXPIRY_LINES.fresh, sc.stars >= 4 ? "good" : "ok"); }
  if (it.recipe === "que" && next(s) < 0.6) return pickL(M3.QUE.review, sc.stars >= 4 ? "good" : "ok");
  if (it.recipe === "gia-truyen" && next(s) < 0.7) return pickL(M3.HOUSE_LOAF.review, sc.stars >= 4 ? "good" : "ok");
  if (c.tag === "promo" && s.promo?.kind && next(s) < 0.6) return pickL(M3.PROMO_REVIEW[s.promo.kind] || M3.PROMO_REVIEW["to-roi"], sc.stars >= 4 ? "good" : "ok");
  if (fairToday(s) && next(s) < 0.5) return pickL(M3.FAIR_REVIEW[sc.stars >= 5 ? "great" : sc.stars >= 3 ? "ok" : "bad"], sc.stars >= 4 ? "good" : "ok");
  if (s.weather?.kind === "rain" && s.weather.day === s.day && next(s) < 0.3) return pickL(M3.WEATHER.rainReview, sc.stars >= 4 ? "good" : "ok");
  if (s.pate && c.filled.some((f) => (f.spreads?.pate || 0) > 0) && sc.stars >= 4 && next(s) < 0.25) return pickL(M3.HOUSE_PATE_REVIEW, "good");
  if (s.shop && s.cartMemory && s.day - s.cartMemory.movedDay < 4 && next(s) < 0.3) return pickL(M3.SHOP.review, sc.stars >= 4 ? "good" : "ok");
  if (sc.stars >= 4 && c.filled.every((f) => f.crisp >= 95) && next(s) < 0.35) return pickL(M3.CRISP_REVIEW.crisp95, "good");
  if (sc.stars >= 4 && c.filled.some((f) => f.toasted) && next(s) < 0.3) return pickL(M3.CRISP_REVIEW.toasted, "good");
  if (c.filled.some((f) => f.dark) && sc.stars >= 3 && next(s) < 0.4) return pickL(M3.CRISP_REVIEW.dark, "ok");
  if (changeErr === null && c.pay?.kind === "bill" && next(s) < 0.15) return pickL(M3.CHANGE_REVIEW.right, "good");
  if (c.nhuCu && sc.stars >= 4 && next(s) < 0.6) return pickL(L.NHU_CU_REVIEW, "good");
  const st = sc.stars;
  return pickL([...L.STAR_REVIEWS[st], ...STAR_REVIEWS_MORE[st], ...(L.STAR_REVIEWS_BY_ARCH[c.arch]?.[st] || []), ...(STAR_REVIEWS_ARCH_MORE[c.arch]?.[st] || [])], st >= 4 ? "good" : "ok");
}
export function review(s, c, stars, line, reason) {
  pushReview(s, { name: c.name, arch: c.arch, stars, line, reason, recipe: c.items[0]?.recipe === "bachuc" ? null : c.items[0]?.recipe });
}

// ---------- chốt ca ----------
export function endShift(s, ev, early = false) {
  const sh = s.shift;
  if (!sh) return { err: "no-shift" };
  for (const c of sh.customers) {
    if (c.pre && c.phase === "wait") { preFail(s, c, ev); continue; }
    if (c.phase === "wait" || c.phase === "enter" || c.phase === "pay") { for (const f of c.filled) if (f) wasteLoaf(sh, f, "Ổ đã gói, đóng cửa"); sh.stats.lost++; }
  }
  for (const b of sh.boards) if (b.loaf) wasteLoaf(sh, b.loaf, "Ổ làm dở lúc đóng cửa");
  const freshLeft = sh.case.filter((l) => l.src !== "stale").length + sh.oven.reduce((a, b) => a + (b && b.kind !== "que" ? b.n : 0), 0);
  const staleLeft = sh.case.length - sh.case.filter((l) => l.src !== "stale").length;
  if (freshLeft) addWaste(sh, "leftover", freshLeft * STOCK.phoi.cost, `Bánh dư cuối ca (${freshLeft} ổ, sáng mai thành bánh hôm qua)`);
  if (staleLeft) sh.wasteLog.push(`Bánh hôm qua không bán hết (${staleLeft} ổ, bỏ)`);
  if (sh.que) addWaste(sh, "leftover", Math.round(sh.que * STOCK["phoi-que"].cost * 10) / 10, `Que dư (${sh.que})`);
  cookLeftover(sh);
  const expired = expire(s, sh);
  const expiredK = sh.waste.expired || 0;
  if (expiredK >= 8) { engineFlag(s, "het-han", 2); sh.moments.push({ kind: "expired", name: "", line: freshLine(s, EXPIRY_LINES.toss, {}) }); }
  const st = sh.stats;
  const waste = Math.round(Object.values(sh.waste).reduce((a, b) => a + b, 0) * 10) / 10;
  const gas = st.batches * STOCK.gas.cost, than = Math.round(st.toasts * STOCK.than.cost * 10) / 10;
  const profit = Math.round(st.revenue - st.cogs - waste - gas - than - sh.fee - st.changeLoss);
  const avg = st.stars.length ? Math.round((st.stars.reduce((a, b) => a + b, 0) / st.stars.length) * 10) / 10 : 0;
  missionsOnEnd(s, { leftover: freshLeft, waste }, ev, gainXp);
  const reviews = s.feed.filter((r) => r.day === sh.day && r.src !== "mang").slice(0, 14);
  const ranM = sh.moments.find((m) => m.kind === "ran");
  s.lastSummary = {
    day: sh.day, early, revenue: st.revenue, cogs: Math.round(st.cogs), waste, wasteDetail: { ...sh.waste }, wasteLog: sh.wasteLog.slice(-8), gas, than, fee: sh.fee,
    changeLoss: st.changeLoss, profit, served: st.served, loaves: st.loaves, lost: st.lost, timeouts: st.timeouts, batches: st.batches, burntBatches: st.burntBatches,
    goldenPulls: st.goldenPulls, toasts: st.toasts, changeRight: st.changeRight, changeWrong: st.changeWrong, avg, xp: st.xp, level: s.level,
    restockSpent: st.restockSpent, rescueSpent: st.rescueSpent, consignRepaid: st.consignRepaid, owed: st.owed, mistakes: { ...st.mistakes },
    best: reviews.slice().sort((a, b) => b.stars - a.stars)[0] || null, worst: reviews.slice().sort((a, b) => a.stars - b.stars)[0] || null, money: s.money, seen: false,
    leftover: freshLeft, multi: st.multi, preorders: st.preorders, preLate: st.preLate, staleSold: st.staleSold, eventCash: st.eventCash, missionCash: st.missionCash,
    dramaN: sh.dramaDone || 0, missions: sh.missions.map((m) => ({ text: m.text, done: m.done, prog: m.prog, n: m.n })), moments: sh.moments.slice(-30),
    followersDelta: (s.followers || 0) - (sh.followers0 || 0), rain: s.weather?.kind === "rain" && s.weather.day === sh.day, fair: fairToday(s), ranItem: ranM?.id || null,
    moved: !!(s.cartMemory && s.cartMemory.movedDay === sh.day), rating: s.rating, expired, expiredK, len: sh.len || SHIFT_MS, burntMeat: st.burntMeat || 0, boDuong: st.boDuong || 0,
  };
  const S = s.lastSummary;
  S.challenge = judgeChallenge(s, S);
  if (S.challenge) {
    if (S.challenge.ok) { gainXp(s, S.challenge.xp, ev); engineFlag(s, "thu-thach-dat", 2); } else engineFlag(s, "thu-thach-hut", 2);
    S.moments.push({ kind: "challenge", name: S.challenge.name, line: S.challenge.line, outcome: S.challenge.ok ? "win" : "lose" });
    ev.push({ type: "challengeResult", ok: S.challenge.ok, name: S.challenge.name, money: S.challenge.money, xp: S.challenge.xp });
    s.challenge = null;
  }
  S.badges = checkBadges(s, S, ev).map((b) => ({ id: b.id, name: b.name, line: b.line }));
  S.money = s.money;
  archiveShift(s, S);
  if (profit < 0) engineFlag(s, "lo-ngay", 2);
  s.stats.shifts++; s.stats.loaves += st.loaves; s.stats.revenue += st.revenue;
  s.stats.bestProfit = Math.max(s.stats.bestProfit, profit);
  // bánh dư ⇒ bánh hôm qua (giòn 30), sáng mai chọn bán / cho / bỏ
  s.stale = freshLeft ? { n: Math.min(20, freshLeft), choice: null } : null;
  s.day++;
  s.tutorialDone = true;
  s.daily = {};
  s.prep = null;
  s.shift = null;
  s.usedDay = [];
  pruneMods(s);
  S.headline = caption(s, S);
  s.journal = s.journal || [];
  const moment = (S.moments.find((m) => m.kind === "drama") || S.best || {}).line || "";
  s.journal.unshift({ day: S.day, kind: "day", headline: S.headline, moment: moment.slice(0, 300), loaves: S.loaves, profit, stars: avg, shop: s.shopName });
  if (s.journal.length > 40) s.journal.length = 40;
  endDrama(s);
  ev.push({ type: "shiftEnded", day: S.day, profit, early });
  return { ok: true };
}
/** Hội thoại sự kiện: lựa chọn (core/drama.js) với hook của ca. */
export const chooseEvent = (s, id, ev) => dramaChoose(s, id, ev, HOOKS);
export { fill as fillLine, ratingOf, hasFlag };
