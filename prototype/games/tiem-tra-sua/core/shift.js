// Một ca bán hàng: mở quán → khách đến (đi từ cửa, đứng chờ, kiên nhẫn giảm) → ghim phiếu → pha 7 bước ở một trong các chỗ pha
// → ghép ly vào đơn (đơn nhiều ly giao chung một lượt) → review / tiền / XP → khách về → hết giờ + hết khách ⇒ chốt ca.
// Thuần, chạy theo "thời gian ca" sh.t (ms) do action tick cộng dồn.
// Chỗ pha: sh.stations = [{ cup, cid, item }], sh.sel = chỗ đang chọn. Khách: items = [{ recipe, order, price }], filled = ly đã ghép.
// c.recipe / c.order là ly đầu (để thoại), c.price là tổng đơn.
import { STEPS, CHOICES, choice, choiceName, useOf } from "../data/ingredients.js?v=m37";
import { RECIPE } from "../data/recipes.js?v=m37";
import { ARCHETYPES } from "../data/customers.js?v=m37";
import {
  SHIFT_FEE, QUEUE_MAX, WALK_MS, REACT_MS, IMPATIENT_AT, REMAKE_PATIENCE_MS, SPAWN_RETRY_MS,
  TUTORIAL_DAY, NORMAL_DAY, SPOTS, REP_BY_STARS, REP_CAP_PER_SHIFT, MULTI_CUP,
} from "../data/shift.js?v=m37";
import * as L from "../data/lines.js?v=m37";
import { MISTAKE_SAY, MISTAKE_REVIEW, REVIEW_BY_STARS, mistakeOf } from "../data/lines-mistakes.js?v=m37";
import { ORDER_MULTI, MULTI_REVIEW, MULTI_SAY, BARISTA_PARALLEL, REVIEW_DECOR, PROMO_REVIEW, CONSIGN_DONE } from "../data/lines-m3.js?v=m37";
import { next, int, pick, weighted } from "./rng.js?v=m37";
import { fill, pickLine } from "./text.js?v=m37";
import { cupCost, costOfUse, hasStock, takeStock, operatingProfit } from "./economy.js?v=m37";
import { recipesAt, archetypesFor, choiceUnlocked, gainXp, xpForServe } from "./progression.js?v=m37";
import { scoreServe, starsFor } from "./score.js?v=m37";
import { BATCHES, PEARL_RAW, TUTORIAL_PRECOOKED } from "../data/equipment.js?v=m37";
import { appeal, owns, kitchenSlots, stationCount, patienceBonus, SEAL_BONUS_MS } from "./equipment.js?v=m37";
import { trafficBonus, archiveShift, returningGuests } from "./reviews.js?v=m37";
import { startMissions, missionsOnServe, missionsOnEnd } from "./missions.js?v=m37";
import { maybeTrigger, startDrama, endDrama } from "./drama.js?v=m37";
import { promoGuests, consignRepay } from "./business.js?v=m37";
import { caption } from "./journal.js?v=m37";
import { openStockout, missingFor, lowCheck, stockoutTick, RUN_REVIEW } from "./stockout.js?v=m37";
import { SWAP_YES_REVIEW } from "../data/lines-stockout.js?v=m37";
import { PEARL_RAW as RAW } from "../data/equipment.js?v=m37";
import { FAIR, fairToday, fairDone, shiftFee, tierOf, TIER_GUESTS, TIER_PATIENCE } from "./fair.js?v=m37";
import { activeChallenge, finishChallenge, checkBadges } from "./challenge.js?v=m37";
import { FAIR_ORDER, FAIR_REVIEW, CHALLENGE_REVIEW, DUAL_SPOUT_LINES, DUAL_SPOUT_REVIEW } from "../data/lines-m5.js?v=m37";

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const isOpen = (s) => !!(s.shift && s.shift.status === "open");
export const customer = (s, cid) => s.shift?.customers.find((c) => c.id === cid) || null;
export const waiting = (s) => (s.shift?.customers || []).filter((c) => c.phase === "wait");
export const patienceOf = (c) => c.patience + (c.bonus || 0);
/** Chỗ pha đang chọn, ly ở đó, khách được ghim ở đó. */
export const curStation = (sh) => sh?.stations?.[sh.sel] || null;
export const curCup = (sh) => curStation(sh)?.cup || null;
export const activeCid = (sh) => curStation(sh)?.cid ?? null;
/** 0..1 phần kiên nhẫn còn lại (1 = vừa tới). */
export function patienceLeft(s, c) {
  if (c.phase !== "wait") return c.phase === "enter" ? 1 : 0;
  return clamp(1 - (s.shift.t - c.arriveT) / patienceOf(c), 0, 1);
}
/** Số ly còn thiếu của đơn. */
export const cupsLeft = (c) => c.filled.filter((x) => !x).length;

// ---------- tạo ca ----------
export function orderSpec(recipeId, sugar, ice) {
  const r = RECIPE[recipeId];
  return { base: r.base, add: r.add, sugar, ice, topping: r.topping };
}
export function lineCtx(c) {
  const a = ARCHETYPES[c.arch], r = RECIPE[c.recipe];
  return {
    self: a.self, call: a.call, drink: r.name.toLocaleLowerCase("vi"), sugar: c.order.sugar + "%", name: c.name, n: c.items?.length || 1,
    ice: choiceName("ice", c.order.ice).toLocaleLowerCase("vi"), topping: choiceName("topping", r.topping === "none" ? "tran-chau" : r.topping).toLocaleLowerCase("vi"),
  };
}

/** Một ly của một vị khách theo sở thích nhóm. */
export function guestItem(s, arch, menu, recipe = null) {
  const A = ARCHETYPES[arch];
  const liked = A.likes.filter((id) => menu.includes(id));
  const rid = recipe || (liked.length && next(s) < 0.55 ? pick(s, liked) : pick(s, menu));
  const R = RECIPE[rid];
  const sugar = next(s) < 0.5 ? R.sugar : pick(s, A.prefs.sugar);
  const ice = next(s) < 0.5 ? R.ice : pick(s, A.prefs.ice);
  return { recipe: rid, sugar, ice };
}
/** Số ly của một đơn: hai ly từ cấp 3 hoặc ngày 3, ba ly từ cấp 10 vào giờ cao điểm. */
export function cupsFor(s, arch, inRush, fair = false) {
  const M = MULTI_CUP;
  if (fair) { const r = next(s); return r < FAIR.three ? 3 : r < FAIR.two ? 2 : 1; } // hội chợ: đơn nhóm kết hợp, nhóm khách nào cũng có
  if (!(s.level >= M.twoFrom.level || s.day >= M.twoFrom.day)) return 1;
  if (arch !== "van-phong" && arch !== "hoc-sinh") return 1;
  const r = next(s);
  if (s.level >= M.threeFromLevel && inRush && r < M.three) return 3;
  return r < M.two ? 2 : 1;
}

function genGuests(s, cfg, extra = 0, opt = {}) {
  const menu = recipesAt(s.level).map((r) => r.id);
  const archs = opt.archs || archetypesFor(s);
  const n = clamp(cfg.minGuests + Math.floor((s.rep - 35) / 15) + Math.floor(s.level / 4) + appeal(s) + trafficBonus(s) + int(s, 2) + extra, cfg.minGuests, cfg.maxGuests + 3);
  const times = [];
  for (let i = 0; i < n; i++) {
    const inRush = next(s) < 0.45;
    const at = inRush ? pick(s, cfg.rushes) + int(s, cfg.rushWindow) : cfg.firstAt + int(s, cfg.lastAt - cfg.firstAt);
    times.push({ at, inRush });
  }
  times.sort((a, b) => a.at - b.at);
  for (let i = 1; i < times.length; i++) times[i].at = Math.max(times[i].at, times[i - 1].at + 4000);
  const used = new Set();
  const demand = s.drama?.demand && menu.includes(s.drama.demand) ? s.drama.demand : null;
  return times.filter((x) => x.at <= cfg.lastAt + 8000).map(({ at, inRush }) => {
    const arch = weighted(s, archs.map((id) => ({ id, w: ARCHETYPES[id].weight }))).id;
    const A = ARCHETYPES[arch];
    const first = guestItem(s, arch, menu, demand && next(s) < 0.35 ? demand : null);
    const cups = cupsFor(s, arch, inRush, !!opt.fair);
    const items = [first];
    for (let i = 1; i < cups; i++) items.push(arch === "van-phong" && !opt.fair ? { ...first } : guestItem(s, arch, menu));
    let name = pick(s, A.names);
    if (used.has(name)) name = pick(s, A.names);
    used.add(name);
    return { at, arch, name, items };
  });
}

export function startShift(s, events) {
  if (s.shift) return { err: "shift-open" };
  if (s.drama?.pending) return { err: "event-pending" };
  const tut = !s.tutorialDone;
  // Milestone 5: ca hội chợ (core/fair.js), ca thử thách (core/challenge.js), hạng tiệm
  const fair = !tut && fairToday(s);
  const ch = tut ? null : activeChallenge(s);
  const M = ch?.mods || {};
  const day = fair ? { ...NORMAL_DAY, duration: FAIR.duration, lastAt: FAIR.lastAt, maxGuests: NORMAL_DAY.maxGuests + FAIR.guests } : M.extraGuests ? { ...NORMAL_DAY, maxGuests: NORMAL_DAY.maxGuests + M.extraGuests } : NORMAL_DAY;
  const cfg = tut ? TUTORIAL_DAY : day;
  const extra = tut ? 0 : promoGuests(s) + (s.drama?.nextGuests || 0) + tierOf(s) * TIER_GUESTS + (fair ? FAIR.guests : 0) + (M.extraGuests || 0);
  const archs = M.archs ? M.archs.filter((a) => ARCHETYPES[a]) : null;
  const guests = tut ? TUTORIAL_DAY.guests.map((g) => ({ at: g.at, arch: g.arch, name: g.name, items: [{ recipe: g.recipe, sugar: g.sugar, ice: g.ice }] })) : genGuests(s, day, extra, { fair, archs });
  if (!tut) for (const g of returningGuests(s, cfg.duration)) guests.push(g); // khách quay lại nhờ câu trả lời review (core/reviews.js)
  guests.sort((a, b) => a.at - b.at);
  const fee = Math.min(shiftFee(s), s.money); // hụt vốn: chủ nhà cho khất phần thiếu (xem thêm gói ký gửi ở core/business.js)
  s.money -= fee;
  const stations = Array.from({ length: M.stations || stationCount(s) }, () => ({ cup: null, cid: null, item: null }));
  const pm = (fair ? FAIR.patienceMul : 1) * (M.patienceMul || 1) * (1 + TIER_PATIENCE * tierOf(s));
  s.shift = {
    day: s.day, t: 0, duration: cfg.duration, patienceMult: cfg.patienceMult * (1 + 0.03 * appeal(s) + patienceBonus(s)) * pm, hints: cfg.hints, tutorial: tut,
    status: "open", schedule: guests, planned: guests.length, customers: [], nextCid: 1, stations, sel: 0, dialog: null,
    ledger: { revenue: 0, cogs: 0, waste: 0, fee, restock: 0, cups: 0, served: 0, lost: 0, refunds: 0, remakes: 0, pearlWaste: 0, multi: 0, consignPaid: 0, eventCash: 0 },
    reviews: [], repDelta: 0, xp: 0, levelUps: [], moments: [], usedLines: [],
    kitchen: { ready: (tut ? TUTORIAL_PRECOOKED : 0) + s.carryPearls, batches: [] },
    mods: { sealMs: 0, spawnPauseUntil: 0 }, lastServe: null, missions: [], drama: null, followers0: s.followers || 0,
    away: null, deliveries: [], borrowDay: null, closedEarly: null, stockouts: 0, lowWarned: {},
    fair, challenge: ch?.id || null, noUndo: !!M.noUndo,
  };
  s.carryPearls = 0;
  s.usedDay = [];
  if (s.drama) { s.drama.nextGuests = 0; s.drama.demand = null; }
  startMissions(s);
  startDrama(s);
  events.push({ type: "shiftStarted", day: s.day, guests: guests.length, fee });
  return { ok: true };
}

function freeSpot(sh) {
  const taken = new Set(sh.customers.filter((c) => c.phase !== "leave").map((c) => c.spot));
  for (let i = 0; i < SPOTS.length; i++) if (!taken.has(i)) return i;
  return -1;
}

function spawn(s, g, events) {
  const sh = s.shift, A = ARCHETYPES[g.arch];
  const items = g.items.slice(0, MULTI_CUP.maxCups).map((it) => ({ recipe: it.recipe, order: orderSpec(it.recipe, it.sugar, it.ice), price: sh.fair ? Math.round(RECIPE[it.recipe].price * FAIR.priceMul) : RECIPE[it.recipe].price }));
  const extra = items.length - 1;
  const c = {
    id: sh.nextCid++, arch: g.arch, sprite: A.sprite, name: g.name, items, filled: items.map(() => null),
    recipe: items[0].recipe, order: { ...items[0].order }, price: items.reduce((a, it) => a + it.price, 0),
    patience: Math.round(A.patience * sh.patienceMult * (1 + MULTI_CUP.patiencePerExtra * extra) * (g.patienceMul || 1)), bonus: 0, spot: freeSpot(sh),
    t0: sh.t, arriveT: null, phase: "enter", mood: "walk", pinned: false, impatientSaid: false, remade: false,
    say: null, leaveT: null, reactUntil: null, review: null, tag: g.tag || null, tip: g.tip || 0,
  };
  const lines = items.length > 1 ? (sh.fair ? [...FAIR_ORDER, ...poolFor(ORDER_MULTI, c.arch)] : poolFor(ORDER_MULTI, c.arch)) : [...L.ORDER_LINES, ...(L.ORDER_LINES_BY_ARCH[c.arch] || [])];
  c.orderLine = g.line ? fill(g.line, lineCtx(c)) : freshLine(s, lines, { ...lineCtx(c), shop: s.shopName }); // không lặp câu trong cùng ca
  sh.customers.push(c);
  events.push({ type: "spawn", cid: c.id, arch: c.arch, cups: items.length });
  return c;
}
/** Thêm lượt khách vào lịch ca (sự kiện đoàn khách, quảng bá giữa ca). */
export function scheduleGuest(s, g) {
  const sh = s.shift;
  sh.schedule.push(g);
  sh.schedule.sort((a, b) => a.at - b.at);
  sh.planned++;
}

export function say(sh, c, text) { c.say = { text, at: sh.t }; }

function unpinAll(sh, cid) {
  for (const st of sh.stations) if (st.cid === cid) { st.cid = null; st.item = null; }
}
function leave(sh, c, mood) {
  c.phase = "leave"; c.leaveT = sh.t; c.mood = mood;
  unpinAll(sh, c.id);
}

export function addRep(s, d, capped = true) {
  const before = s.rep;
  if (capped && s.shift) {
    const sh = s.shift;
    const want = clamp(sh.repDelta + d, -REP_CAP_PER_SHIFT, REP_CAP_PER_SHIFT);
    d = want - sh.repDelta;
    sh.repDelta = want;
  }
  s.rep = clamp(s.rep + d, 0, 100);
  return s.rep - before;
}

export function review(s, c, stars, line, reason) {
  const rep = addRep(s, REP_BY_STARS[stars]);
  c.review = { stars, line, reason };
  s.shift.reviews.push({ cid: c.id, name: c.name, arch: c.arch, recipe: c.recipe, stars, line, reason, rep });
  s.stats.reviews[stars] = (s.stats.reviews[stars] || 0) + 1;
}

// ---------- nhịp thời gian ----------
export function tick(s, dt, events) {
  const sh = s.shift;
  if (!sh || sh.status !== "open" || sh.dialog) return { ok: true };
  if (!Number.isFinite(dt) || dt < 0) return { err: "bad-dt" };
  sh.t += Math.min(dt, 1000);
  const t = sh.t;
  stockoutTick(s, Math.min(dt, 1000), events); // chủ tiệm chạy đi mua về, Anh Tèo giao hàng (core/stockout.js)
  // khách mới (cửa đóng sau giờ ca: bỏ lượt chưa tới)
  while (sh.schedule.length && sh.schedule[0].at <= t) {
    if (t > sh.duration) { sh.schedule.length = 0; break; }
    const live = sh.customers.filter((c) => c.phase !== "leave").length;
    if (live >= QUEUE_MAX || freeSpot(sh) < 0 || t < sh.mods.spawnPauseUntil) {
      sh.schedule[0].at = Math.max(t + SPAWN_RETRY_MS, sh.mods.spawnPauseUntil); sh.schedule.sort((a, b) => a.at - b.at); break;
    }
    spawn(s, sh.schedule.shift(), events);
  }
  // bếp topping: mẻ chín
  const k = sh.kitchen;
  for (const b of k.batches.filter((x) => x.doneAt <= t)) { k.ready += b.size; events.push({ type: "batchDone", size: b.size }); }
  k.batches = k.batches.filter((x) => x.doneAt > t);
  for (const c of sh.customers) {
    if (c.phase === "enter" && t >= c.t0 + WALK_MS) {
      c.phase = "wait"; c.arriveT = c.t0 + WALK_MS; c.mood = "order";
      say(sh, c, c.orderLine);
      events.push({ type: "arrive", cid: c.id });
    }
    if (c.phase === "wait") {
      const left = 1 - (t - c.arriveT) / patienceOf(c);
      if (left <= 0) {
        const tl = [...(L.TIMEOUT_LINES[c.arch] || []), ...L.TIMEOUT_LINES.default];
        say(sh, c, pickLine(s, tl, lineCtx(c)));
        review(s, c, 1, freshLine(s, [...L.TIMEOUT_REVIEW, ...(owns(s, "waiting-bench") ? REVIEW_DECOR["waiting-bench"].slow : [])], lineCtx(c)), "timeout");
        for (const cup of c.filled) if (cup) sh.ledger.waste += cupCost(cup); // ly đã ghép mà khách bỏ về
        sh.ledger.lost++;
        leave(sh, c, "annoyed");
        sh.moments.push({ kind: "timeout", name: c.name });
        events.push({ type: "timeout", cid: c.id, name: c.name });
      } else if (left <= IMPATIENT_AT) {
        c.mood = "impatient";
        if (!c.impatientSaid) { c.impatientSaid = true; say(sh, c, pickLine(s, L.IMPATIENT_LINES, lineCtx(c))); events.push({ type: "impatient", cid: c.id }); }
      } else if (t - c.arriveT > 900) c.mood = "waiting";
    }
    if (c.phase === "react" && t >= c.reactUntil) leave(sh, c, c.mood);
  }
  sh.customers = sh.customers.filter((c) => !(c.phase === "leave" && t >= c.leaveT + WALK_MS));
  if (!sh.schedule.length && !sh.customers.length) { endShift(s, events); return { ok: true }; } // hết giờ nhận khách + quầy trống
  if (!sh.away) maybeTrigger(s, events);
  return { ok: true };
}

// ---------- quầy ----------
/** Chủ tiệm đang chạy đi mua hàng: quầy bỏ trống, không thao tác được. */
const awayErr = (sh) => (sh.away ? { err: "away" } : null);
/** Hàng đang được mang tới (chạy đi mua / Anh Tèo) ⇒ không hỏi lại. */
const coming = (sh, id) => sh.away?.id === id || (sh.deliveries || []).some((d) => d.id === id && !d.wrong);
/** Ly chưa ghép và chưa có chỗ pha nào nhận (trừ chỗ `except`). */
function freeItem(sh, c, except = -1) {
  for (let i = 0; i < c.items.length; i++) {
    if (c.filled[i]) continue;
    if (sh.stations.some((st, j) => j !== except && st.cid === c.id && st.item === i)) continue;
    return i;
  }
  return null;
}

export function pin(s, cid, events) {
  if (!isOpen(s)) return { err: "closed" };
  const sh = s.shift;
  if (sh.dialog) return { err: "dialog" };
  if (sh.away) return awayErr(sh);
  const c = customer(s, cid);
  if (!c || c.phase !== "wait") return { err: "not-waiting" };
  const mine = sh.stations.findIndex((st) => st.cid === cid);
  let target;
  if (sh.stations[sh.sel].cid === cid) target = sh.sel;
  else if (mine >= 0 && freeItem(sh, c, -2) === null) target = mine; // đủ chỗ cho đơn rồi: chỉ chuyển sang chỗ đó
  else {
    const cur = sh.stations[sh.sel];
    const idle = sh.stations.findIndex((st) => !st.cup && st.cid === null);
    target = !cur.cup || !cur.cup.steps.length || idle < 0 ? sh.sel : idle;
  }
  const st = sh.stations[target];
  if (st.cid !== cid) { st.cid = cid; st.item = freeItem(sh, c, target); }
  // các chỗ pha đang rảnh nhận luôn các ly còn lại của cùng đơn (pha song song)
  for (const o of sh.stations) {
    if (o === st || o.cup || o.cid !== null) continue;
    const i = freeItem(sh, c);
    if (i === null) break;
    o.cid = cid; o.item = i;
  }
  sh.sel = target;
  c.pinned = true;
  events.push({ type: "pinned", cid, station: target });
  // đơn cần món hàng đã hết ⇒ hỏi cách xử lý ngay (không đợi tới bước pha)
  const it = c.items[st.item ?? 0];
  const miss = it && missingFor(s, it.order, st.cup ? st.cup.steps.length : 0);
  if (miss && !coming(sh, miss)) openStockout(s, miss, cid, events);
  return { ok: true };
}

export function select(s, i, events) {
  if (!isOpen(s)) return { err: "closed" };
  const sh = s.shift;
  if (sh.dialog) return { err: "dialog" };
  if (!Number.isInteger(i) || i < 0 || i >= sh.stations.length) return { err: "bad-station" };
  sh.sel = i;
  events.push({ type: "selected", station: i });
  return { ok: true };
}

/** Bước kế tiếp phải làm trên ly (null = ly đã đóng nắp). */
export function nextStep(cup) {
  if (!cup) return "cup";
  if (cup.sealed) return null;
  return STEPS[cup.steps.length] || null;
}
/** Giá trị phiếu ở một bước (lựa chọn đúng). */
export const wantOf = (order, step) => (step === "cup" ? "ly" : step === "lid" ? "dong-nap" : order[step]);
export function orderAt(s, st) {
  const c = st.cid !== null ? customer(s, st.cid) : null;
  if (!c) return null;
  return c.items[st.item ?? 0]?.order || c.order;
}

function pour(s, sh, st, step, id, c) {
  const use = useOf(step, id);
  if (c.kitchen) {
    if (sh.kitchen.ready < 1) return { err: !sh.kitchen.batches.length && (s.stock[RAW] || 0) < 3 ? "out-of-stock" : "not-cooked", use: { [RAW]: 3 } };
    sh.kitchen.ready--;
  } else {
    if (!hasStock(s, use)) return { err: "out-of-stock", use };
    takeStock(s, use);
  }
  if (step === "cup") st.cup = { steps: [], sealed: false, forCid: st.cid };
  st.cup.steps.push({ step, id });
  if (step === "lid") st.cup.sealed = true;
  return { ok: true };
}

export function brew(s, step, id, events) {
  if (!isOpen(s)) return { err: "closed" };
  const sh = s.shift;
  if (sh.dialog) return { err: "dialog" };
  const st = curStation(sh);
  const want = nextStep(st.cup);
  if (want === null) return { err: "sealed" };
  if (step !== want) return { err: "wrong-step", want };
  const c = choice(step, id);
  if (!c) return { err: "bad-choice" };
  if (!choiceUnlocked(step, c, s.level)) return { err: "locked" };
  if (sh.away) return awayErr(sh);
  const r = pour(s, sh, st, step, id, c);
  if (r.err === "out-of-stock") {
    const miss = Object.keys(r.use || {})[0];
    if (miss && coming(sh, miss)) return { err: "coming", id: miss };
    if (miss && openStockout(s, miss, st.cid, events)) return { ok: true, stockout: miss }; // hết hàng: hội thoại, không kẹt
  }
  if (r.err) return r;
  // pha đồng loạt: chỗ pha khác đang ở cùng bước và phiếu ở đó cũng ghi đúng lựa chọn này
  const also = [];
  sh.stations.forEach((o, j) => {
    if (o === st || o.cid === null || nextStep(o.cup) !== step) return;
    const ord = orderAt(s, o);
    if (!ord || String(wantOf(ord, step)) !== String(id)) return;
    if (!pour(s, sh, o, step, id, c).err) also.push(j);
  });
  // máy rót hai vòi: rót trà nền cho chỗ pha khác đang ở bước trà, mỗi ly đúng loại trà trên phiếu của ly đó
  const dual = [];
  if (step === "base" && owns(s, "dual-spout-brewer")) {
    sh.stations.forEach((o, j) => {
      if (o === st || o.cid === null || also.includes(j) || nextStep(o.cup) !== "base") return;
      const ord = orderAt(s, o);
      const bid = ord && wantOf(ord, "base");
      const bc = bid && choice("base", bid);
      if (!bc || !choiceUnlocked("base", bc, s.level)) return;
      if (!pour(s, sh, o, "base", bid, bc).err) { dual.push(j); o.cup.dual = true; }
    });
    if (dual.length) st.cup.dual = true;
  }
  const line = dual.length ? freshLine(s, DUAL_SPOUT_LINES, {}) : also.length && step === "cup" ? freshLine(s, BARISTA_PARALLEL, { n: also.length + 1 }) : null; // bàn pha đôi / ba chỗ
  events.push({ type: "brewed", step, id, station: sh.sel, also, ...(dual.length ? { dual } : {}), ...(line ? { line } : {}) });
  lowCheck(s, Object.keys(c.kitchen ? {} : useOf(step, id)), events);
  return { ok: true };
}

/** Sửa bước gần nhất trước khi đóng nắp. Nguyên liệu đã đổ vẫn tính hao hụt. */
export function undo(s, events) {
  if (!isOpen(s)) return { err: "closed" };
  const sh = s.shift, st = curStation(sh), cup = st.cup;
  if (sh.dialog) return { err: "dialog" };
  if (sh.away) return awayErr(sh);
  if (sh.noUndo) return { err: "no-undo" }; // ca thử thách "Một lần là xong"
  if (!cup || !cup.steps.length) return { err: "empty" };
  if (cup.sealed) return { err: "sealed" };
  const last = cup.steps.pop();
  sh.ledger.waste += costOfUse(useOf(last.step, last.id));
  if (!cup.steps.length) st.cup = null;
  events.push({ type: "undone", step: last.step });
  return { ok: true };
}

export function discard(s, events) {
  if (!isOpen(s)) return { err: "closed" };
  const sh = s.shift, st = curStation(sh);
  if (sh.dialog) return { err: "dialog" };
  if (sh.away) return awayErr(sh);
  if (!st.cup) return { err: "empty" };
  const k = cupCost(st.cup);
  sh.ledger.waste += k;
  st.cup = null;
  events.push({ type: "discarded", cost: k });
  return { ok: true };
}

/** Chọn câu, tránh lặp câu đã dùng trong ca nếu còn câu khác. */
export function freshLine(s, list, ctx) {
  // trong ca nhớ ở sh.usedLines; giữa hai ca (trả lời review, sự kiện sau giờ đóng cửa) nhớ ở s.usedDay, xoá khi mở ca mới
  const mem = s.shift ? s.shift.usedLines : (s.usedDay = Array.isArray(s.usedDay) ? s.usedDay : []);
  const used = new Set(mem);
  const fresh = list.filter((t) => !used.has(t));
  const tpl = pick(s, fresh.length ? fresh : list);
  mem.push(tpl);
  if (mem.length > 40) mem.shift();
  return fill(tpl, ctx);
}

/** Gộp câu chung + câu riêng của nhóm khách (data/lines-mistakes.js). */
export const poolFor = (table, arch) => [...(table?.default || []), ...(table?.[arch] || [])];
/** Lỗi lớn nhất của ly (để chọn câu): khi lỗi đó tạo ra câu nhận xét chi tiết. */
const ERR_ORDER = ["toppingMissing", "toppingWrong", "addWrong", "sugarHigh", "sugarLow", "iceHigh", "iceLow", "slow", "toppingExtra"];
/** Thời gian (ms ca) giữa ly đầu và ly cuối được ghép vào đơn: từ LATE_MS là "ly tới trễ"; tới SYNC_MS (có bàn pha nhiều chỗ) là "ra cùng lúc". */
export const LATE_MS = 18000, SYNC_MS = 2500;
/** Kết quả đơn nhiều ly để chọn câu: swapped | oneWrong | late | perfect3 | sync | allRight | null (đơn một ly / lỗi nặng / chưa tới 4 sao). */
export function multiOutcome(c, sc, stations = 1) {
  if (!c.items || c.items.length < 2) return null;
  const mk = mistakeOf(sc.errors);
  if (mk === "swapped") return "swapped";
  if (mk === "wrongCustomer" || mk === "wrongDrink") return null;
  const bad = (sc.per || []).filter((x) => x.errors.some((e) => e !== "slow" && e !== "toppingExtra")).length;
  if (bad === 1) return "oneWrong"; // kể cả khi điểm trung bình vẫn 5 sao: người trúng ly lệch vẫn có chuyện để kể
  if (bad >= 1) return null;
  const ts = c.filled.map((cup) => cup?.at).filter(Number.isFinite);
  const gap = ts.length === c.items.length ? Math.max(...ts) - Math.min(...ts) : null;
  if (gap !== null && gap >= LATE_MS) return "late";
  if (sc.stars < 4) return null;
  if (c.items.length === 3 && sc.stars === 5) return "perfect3";
  if (stations > 1 && gap !== null && gap <= SYNC_MS) return "sync";
  return "allRight";
}
const MULTI_REASON = { allRight: "multi", perfect3: "multi3", sync: "multiSync", late: "multiLate", oneWrong: "multiWrong", swapped: "swapped" };
/** Câu review nhắc tới đồ trang trí tiệm đang có (4–5 sao). */
export function decorPool(s) {
  return Object.keys(REVIEW_DECOR).filter((id) => owns(s, id)).flatMap((id) => REVIEW_DECOR[id].good || []);
}
/** Câu review của khách đến nhờ quảng bá hôm nay. */
export const promoPool = (s) => (s.promo && s.promo.day === s.shift?.day ? PROMO_REVIEW[s.promo.kind] || [] : []);
function reviewLine(s, c, sc) {
  const ctx = lineCtx(c);
  const mk = mistakeOf(sc.errors);
  const mo = multiOutcome(c, sc, s.shift.stations.length);
  if (mo) {
    let pool = poolFor(MULTI_REVIEW[mo], c.arch);
    if (mo === "swapped") pool = [...pool, ...poolFor(MISTAKE_REVIEW.swapped, c.arch)];
    const err = mo === "oneWrong" ? ERR_ORDER.find((e) => sc.errors.includes(e)) : null;
    return { line: freshLine(s, pool, ctx), reason: err || MULTI_REASON[mo], mistake: mk, outcome: mo };
  }
  if (mk && sc.stars <= 4) {
    let pool = poolFor(MISTAKE_REVIEW[mk], c.arch);
    if (mk === "slow" && owns(s, "waiting-bench")) pool = [...pool, ...REVIEW_DECOR["waiting-bench"].slow];
    const err = ERR_ORDER.find((e) => sc.errors.includes(e));
    const reason = ["noLid", "swapped", "wrongCustomer"].includes(mk) ? mk : err || mk;
    if (pool.length) return { line: freshLine(s, pool, ctx), reason, mistake: mk };
    if (err) return { line: freshLine(s, L.REVIEW_LINES[err], ctx), reason: err, mistake: mk };
  }
  const rctx = { ...ctx, shop: s.shopName };
  const why = () => (mk ? ERR_ORDER.find((e) => sc.errors.includes(e)) || mk : sc.stars >= 4 ? "good" : "ok");
  if (s.shift.fair && next(s) < 0.6) return { line: freshLine(s, FAIR_REVIEW[sc.stars >= 4 ? "great" : sc.stars === 3 ? "ok" : "bad"], rctx), reason: why(), mistake: mk };
  if (s.shift.challenge && next(s) < 0.35) return { line: freshLine(s, CHALLENGE_REVIEW[sc.stars >= 4 ? "win" : "lose"], rctx), reason: why(), mistake: mk };
  if (c.filled.some((cup) => cup?.dual) && next(s) < 0.55) return { line: freshLine(s, DUAL_SPOUT_REVIEW[sc.stars >= 4 ? "good" : "meh"], rctx), reason: why(), mistake: mk };
  if (!mk && sc.stars >= 3 && c.swapped && next(s) < 0.7) return { line: freshLine(s, SWAP_YES_REVIEW, { ...ctx, sub: RECIPE[c.swapped].name.toLocaleLowerCase("vi"), item: "hàng" }), reason: sc.stars >= 4 ? "good" : "ok" };
  if (c.ranFor && sc.stars >= 2 && next(s) < 0.6) return { line: freshLine(s, RUN_REVIEW, ctx), reason: sc.stars >= 4 ? "good" : "slow" };
  if (!mk && sc.stars >= 4) { const dp = decorPool(s); if (dp.length && next(s) < 0.3) return { line: freshLine(s, dp, ctx), reason: "decor" }; } // trả lời review có câu riêng cho khen trang trí
  if (!mk && sc.stars >= 3) { const pp = promoPool(s); if (pp.length && next(s) < 0.35) return { line: freshLine(s, pp, ctx), reason: sc.stars >= 4 ? "good" : "ok" }; }
  const pool = poolFor(REVIEW_BY_STARS[sc.stars], c.arch);
  return { line: freshLine(s, pool.length ? pool : L.REVIEW_LINES[sc.stars], ctx), reason: sc.stars >= 4 ? "good" : "ok" };
}
/** Câu khách nói ngay khi nhận ly có lỗi (bong bóng thoại). */
function mistakeSay(s, c, mk) {
  const pool = poolFor(MISTAKE_SAY[mk], c.arch);
  return pool.length ? freshLine(s, pool, lineCtx(c)) : null;
}

function pay(s, c, sc, price, cost, events, reasonOverride) {
  const sh = s.shift;
  const owed0 = s.consign?.owed || 0;
  const repay = consignRepay(s, Math.min(cost, price));
  sh.ledger.revenue += price;
  sh.ledger.cogs += cost;
  sh.ledger.cups += c.items.length;
  sh.ledger.served++;
  sh.ledger.consignPaid += repay;
  if (c.items.length > 1) sh.ledger.multi++;
  s.money += price - repay;
  s.stats.cups += c.items.length;
  s.stats.revenue += price;
  const { line, reason, mistake, outcome } = reasonOverride || reviewLine(s, c, sc);
  review(s, c, sc.stars, line, reason);
  const multiSay = outcome ? poolFor(MULTI_SAY[outcome], c.arch) : [];
  const spoken = (multiSay.length && freshLine(s, multiSay, lineCtx(c))) || (!reasonOverride && mistake && mistakeSay(s, c, mistake)) || line;
  const xp = gainXp(s, price > 0 ? c.items.reduce((a, it) => a + xpForServe(RECIPE[it.recipe], sc.stars), 0) : 0, events);
  sh.xp += xp;
  let tip = 0;
  if (c.tip && sc.stars >= 3 && !reasonOverride) { tip = c.tip; s.money += tip; sh.ledger.eventCash += tip; }
  c.phase = "react"; c.reactUntil = sh.t + REACT_MS; c.mood = sc.stars >= 3 ? "happy" : "annoyed";
  say(sh, c, spoken);
  unpinAll(sh, c.id);
  if (mistake) sh.moments.push({ kind: "mistake", id: mistake, name: c.name, line: spoken });
  else if (outcome && outcome !== "allRight") sh.moments.push({ kind: "multi", id: outcome, name: c.name, line: spoken });
  if (sc.stars === 5) sh.moments.push({ kind: c.items.length > 1 ? "multi5" : "five", name: c.name, line });
  if (owed0 > 0 && !s.consign?.owed) { // trả đủ gói ký gửi
    const t = freshLine(s, CONSIGN_DONE, lineCtx(c));
    sh.moments.push({ kind: "consign-done", name: "Dì Ba", line: t });
    events.push({ type: "consignDone", line: t });
  }
  events.push({ type: "served", cid: c.id, stars: sc.stars, price, xp, raw: sc.raw, errors: sc.errors, cups: c.items.length, tip, repay, ...(outcome ? { outcome } : {}) });
  if (!reasonOverride) missionsOnServe(s, c, sc, events);
}

/** Chấm cả đơn: điểm thô trung bình các ly, sai món nền ở ly nào cũng tối đa 2 sao. */
export function scoreOrder(s, c) {
  const sh = s.shift;
  const frac = Math.max(0, sh.t - c.arriveT + sh.mods.sealMs - (owns(s, "powered-sealer") ? SEAL_BONUS_MS : 0)) / patienceOf(c);
  // ly pha cho khách khác (phiếu đã chuyển) mà không khớp đơn người nhận ⇒ "giao nhầm khách"
  const wrongFor = (cup, it) => cup.forCid !== null && cup.forCid !== undefined && cup.forCid !== c.id && scoreServe(it.order, cup, 0, "base").recipe < 60;
  const per = c.items.map((it, i) => scoreServe(it.order, c.filled[i], frac, ARCHETYPES[c.arch].expect, wrongFor(c.filled[i], it)));
  // đơn nhiều ly: đổi chỗ hai ly thì đúng hết ⇒ "ghi nhầm tên trên ly"
  if (c.items.length > 1 && per.some((x) => x.recipe < 60)) {
    const fits = (a, b) => scoreServe(c.items[a].order, c.filled[b], 0, "base").recipe >= 60;
    const n = c.items.length;
    const perms = n === 2 ? [[1, 0]] : [[0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
    if (perms.some((pm) => pm.every((b, a) => fits(a, b)))) per[0].errors.push("swapped");
  }
  const raw = Math.round(per.reduce((a, x) => a + x.raw, 0) / per.length);
  const wrong = per.map((x, i) => (x.wrongBase ? i : -1)).filter((i) => i >= 0);
  let stars = starsFor(raw);
  if (wrong.length || per.some((x) => x.wrongCustomer)) stars = Math.min(stars, 2);
  if (c.filled.some((cup) => cup && !cup.sealed)) stars = Math.min(stars, 3); // quên nắp
  if (c.remade) stars = Math.min(stars, 4);
  const errors = [...new Set(per.flatMap((x) => x.errors))];
  return { raw, stars, errors, wrongBase: wrong.length > 0, wrong, per, frac };
}

/** Ly hợp nhất với ly nào còn thiếu trong đơn (điểm công thức cao nhất). */
function bestItem(c, cup) {
  let best = null, pts = -1;
  c.items.forEach((it, i) => {
    if (c.filled[i]) return;
    const p = scoreServe(it.order, cup, 0, "base").recipe;
    if (p > pts) { pts = p; best = i; }
  });
  return best;
}

export function serve(s, cid, events) {
  if (!isOpen(s)) return { err: "closed" };
  const sh = s.shift;
  if (sh.dialog) return { err: "dialog" };
  if (sh.away) return awayErr(sh);
  const c = customer(s, cid);
  if (!c || c.phase !== "wait") return { err: "not-waiting" };
  const st = curStation(sh), cup = st.cup;
  // quên đóng nắp: ly đủ 6 bước vẫn giao được (bị trừ điểm, khách có câu riêng)
  if (!cup || !(cup.sealed || cup.steps.length === STEPS.length - 1)) return { err: "not-sealed" };
  const best = bestItem(c, cup);
  const fit = (k) => scoreServe(c.items[k].order, cup, 0, "base").recipe;
  const i = st.cid === cid && st.item !== null && !c.filled[st.item] && best !== null && fit(st.item) >= fit(best) ? st.item : best;
  if (i === null) return { err: "order-full" };
  cup.at = sh.t; // thời điểm ghép vào đơn (ly tới trễ / ra cùng lúc)
  c.filled[i] = cup;
  st.cup = null;
  for (const o of sh.stations) if (o !== st && o.cid === cid && o.item === i) o.item = freeItem(sh, c);
  if (cupsLeft(c)) {
    st.cid = cid; st.item = freeItem(sh, c, sh.sel);
    if (st.item === null) { st.cid = null; }
    events.push({ type: "filled", cid, n: c.items.length - cupsLeft(c), of: c.items.length });
    return { ok: true, partial: true };
  }
  return finishOrder(s, c, events);
}

function finishOrder(s, c, events) {
  const sh = s.shift;
  const sc = scoreOrder(s, c);
  const cost = c.filled.reduce((a, cup) => a + cupCost(cup), 0);
  if (sc.wrongBase) {
    // Khách phát hiện sai món ⇒ dừng ca, hỏi cách xử lý. Chưa thu tiền.
    c.mood = "surprised";
    const wrongCost = sc.wrong.reduce((a, i) => a + cupCost(c.filled[i]), 0);
    const mk = mistakeOf(sc.errors) || "wrongDrink";
    const said = mistakeSay(s, c, mk) || fill(L.COMPLAINT.line, lineCtx(c));
    sh.dialog = { kind: "complaint", cid: c.id, cost, wrongCost, wrong: sc.wrong, stars: sc.stars, raw: sc.raw, errors: sc.errors, line: said };
    say(sh, c, said);
    sh.moments.push({ kind: "mistake", id: mk, name: c.name, line: said });
    events.push({ type: "complaint", cid: c.id, errors: sc.errors });
    return { ok: true, complaint: true };
  }
  setLastServe(s, c, sc);
  pay(s, c, sc, c.price, cost, events);
  return { ok: true };
}

function setLastServe(s, c, sc) {
  const sh = s.shift, first = c.filled[0];
  const spec = {};
  for (const st of first?.steps || []) spec[st.step] = st.id;
  sh.lastServe = {
    t: sh.t, cid: c.id, arch: c.arch, name: c.name, recipe: c.recipe, stars: sc.stars, cups: c.items.length,
    sugar: c.order.sugar, ice: c.order.ice, sugarOk: spec.sugar === c.order.sugar, iceOk: spec.ice === c.order.ice, topping: c.order.topping,
    mistake: mistakeOf(sc.errors), outcome: sc.per ? multiOutcome(c, sc, sh.stations.length) : null,
  };
}

export function resolve(s, pickId, events) {
  const sh = s.shift;
  if (!sh || !sh.dialog || sh.dialog.kind !== "complaint") return { err: "no-dialog" };
  const d = sh.dialog, c = customer(s, d.cid);
  if (!c) { sh.dialog = null; return { ok: true }; }
  const ctx = lineCtx(c);
  if (pickId === "remake") {
    sh.ledger.waste += d.wrongCost ?? d.cost;
    sh.ledger.remakes++;
    for (const i of d.wrong || [0]) c.filled[i] = null;
    c.bonus += REMAKE_PATIENCE_MS; c.remade = true; c.mood = "waiting";
    const idle = sh.stations.findIndex((st) => !st.cup);
    const target = idle >= 0 ? idle : sh.sel;
    sh.stations[target].cid = c.id; sh.stations[target].item = freeItem(sh, c, target);
    sh.sel = target;
    say(sh, c, fill(L.COMPLAINT.after.remake, ctx));
    sh.moments.push({ kind: "remake", name: c.name });
    if (s.drama) s.drama.flags["fix-" + c.arch] = s.day + 3; // C01 → C05: khách nhớ tiệm đã sửa sai
  } else if (pickId === "discount") {
    const sc = { stars: Math.min(d.stars, 2), raw: d.raw, errors: d.errors };
    sh.dialog = null;
    pay(s, c, sc, Math.floor(c.price / 2), d.cost, events, { line: fill(L.COMPLAINT.after.discount, ctx), reason: "discount" });
    setLastServe(s, c, { ...sc, errors: d.errors });
    events.push({ type: "resolved", choice: pickId, cid: c.id });
    return { ok: true };
  } else if (pickId === "refund") {
    sh.ledger.waste += d.cost;
    sh.ledger.refunds++;
    review(s, c, 2, fill(L.COMPLAINT.after.refund, ctx), "refund");
    c.phase = "react"; c.reactUntil = sh.t + REACT_MS; c.mood = "happy";
    say(sh, c, fill(L.COMPLAINT.after.refund, ctx));
    unpinAll(sh, c.id);
    sh.moments.push({ kind: "refund", name: c.name });
    setLastServe(s, c, { stars: 2, errors: d.errors });
  } else return { err: "bad-choice" };
  sh.dialog = null;
  events.push({ type: "resolved", choice: pickId, cid: c.id });
  return { ok: true };
}

// ---------- bếp topping ----------
export function cook(s, size, events) {
  if (!isOpen(s)) return { err: "closed" };
  const sh = s.shift, B = BATCHES[size];
  if (sh.dialog) return { err: "dialog" };
  if (!B) return { err: "bad-size" };
  if (B.unlock > s.level) return { err: "locked" };
  if (sh.away) return awayErr(sh);
  if (sh.kitchen.batches.length >= kitchenSlots(s)) return { err: "kitchen-busy" };
  if ((s.stock[PEARL_RAW] || 0) < size) {
    if ((s.stock[PEARL_RAW] || 0) < 3 && !coming(sh, PEARL_RAW) && openStockout(s, PEARL_RAW, activeCid(sh), events)) return { ok: true, stockout: PEARL_RAW };
    return { err: "out-of-stock", use: { [PEARL_RAW]: size } };
  }
  s.stock[PEARL_RAW] -= size;
  sh.kitchen.batches.push({ size, doneAt: sh.t + B.ms, ms: B.ms });
  events.push({ type: "cooking", size });
  lowCheck(s, [PEARL_RAW], events);
  return { ok: true };
}

// ---------- chốt ca ----------
export function endShift(s, events) {
  const sh = s.shift;
  if (!sh) return { err: "no-shift" };
  for (const st of sh.stations) if (st.cup) sh.ledger.waste += cupCost(st.cup); // ly dở cuối ca bỏ đi
  // trân châu đã nấu: tủ mát giữ sang ca sau, không thì hao hụt một lần; mẻ đang nấu dở bỏ
  const pearlCost = costOfUse({ [PEARL_RAW]: 1 });
  const cooking = sh.kitchen.batches.reduce((a, b) => a + b.size, 0);
  let left = sh.kitchen.ready;
  if (owns(s, "upright-fridge")) { s.carryPearls = Math.min(12, left); left -= s.carryPearls; }
  sh.ledger.pearlWaste = left + cooking;
  sh.ledger.waste += (left + cooking) * pearlCost;
  missionsOnEnd(s, events);
  const Lg = sh.ledger;
  const stars = sh.reviews.map((r) => r.stars);
  const avg = stars.length ? stars.reduce((a, b) => a + b, 0) / stars.length : 0;
  const best = [...sh.reviews].sort((a, b) => b.stars - a.stars || a.cid - b.cid)[0] || null;
  const sum = {
    day: sh.day, cups: Lg.cups, served: Lg.served, lost: Lg.lost, planned: sh.planned, revenue: Lg.revenue, cogs: Lg.cogs, waste: Lg.waste,
    fee: Lg.fee, restock: Lg.restock, refunds: Lg.refunds, remakes: Lg.remakes, pearlWaste: Lg.pearlWaste, carry: s.carryPearls, profit: operatingProfit(Lg),
    multi: Lg.multi, consignPaid: Lg.consignPaid, eventCash: Lg.eventCash, closedEarly: sh.closedEarly || null, stockouts: sh.stockouts || 0, fair: !!sh.fair,
    avgStars: Math.round(avg * 10) / 10, reviews: sh.reviews.map((r) => ({ name: r.name, stars: r.stars, line: r.line, reason: r.reason, recipe: r.recipe })),
    best: best ? { name: best.name, stars: best.stars, line: best.line } : null,
    repDelta: sh.repDelta, rep: s.rep, xp: sh.xp, levelUps: [...sh.levelUps], level: s.level, money: s.money, moments: sh.moments.slice(0, 12),
    missions: sh.missions.map((m) => ({ id: m.id, text: m.text, done: m.done, reward: m.reward })),
    drama: (sh.drama?.log || []).slice(0, 6), followers: s.followers || 0, followersDelta: (s.followers || 0) - (sh.followers0 || 0), shopName: s.shopName,
  };
  archiveShift(s, sum);
  sum.rating = s.rating ?? null;
  // Milestone 5: ca thử thách, hội chợ, huy hiệu (trước câu chốt ca để Nhật Ký nói đúng chuyện)
  sum.challenge = finishChallenge(s, sum, gainXp, events);
  if (sum.challenge?.ok) { sum.money = s.money; sum.level = s.level; }
  if (sh.fair) fairDone(s);
  sum.badges = checkBadges(s, sum, events).map((b) => ({ id: b.id, name: b.name, line: b.line }));
  sum.headline = caption(s, sum);
  s.lastSummary = sum;
  s.journal.unshift({ day: sum.day, cups: sum.cups, profit: sum.profit, avgStars: sum.avgStars, headline: sum.headline, moment: sum.moments.find((m) => m.kind === "reply" && (m.outcome === "viral" || m.outcome === "phot"))?.line || sum.moments.find((m) => m.kind === "drama")?.line || sum.best?.line || "" });
  s.journal.length = Math.min(s.journal.length, 30);
  s.stats.shifts++;
  s.stats.bestProfit = Math.max(s.stats.bestProfit, sum.profit);
  s.day++;
  s.tutorialDone = true;
  s.shift = null;
  endDrama(s, sum);
  events.push({ type: "shiftEnded", summary: sum });
  return { ok: true };
}

/** Còn bao nhiêu khách chưa tới. */
export const pendingGuests = (s) => s.shift?.schedule.length || 0;
export { CHOICES };
