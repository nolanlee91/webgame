// Một ca bán hàng: mở quán → khách đến (đi từ cửa, đứng chờ, kiên nhẫn giảm) → ghim phiếu → pha 7 bước → giao → review / tiền / XP
// → khách về → hết giờ + hết khách ⇒ chốt ca. Thuần, chạy theo "thời gian ca" sh.t (ms) do action tick cộng dồn.
import { STEPS, CHOICES, choice, choiceName, useOf } from "../data/ingredients.js";
import { RECIPE } from "../data/recipes.js";
import { ARCHETYPES } from "../data/customers.js";
import {
  SHIFT_FEE, QUEUE_MAX, WALK_MS, REACT_MS, IMPATIENT_AT, REMAKE_PATIENCE_MS, SPAWN_RETRY_MS,
  TUTORIAL_DAY, NORMAL_DAY, SPOTS, REP_BY_STARS, REP_CAP_PER_SHIFT,
} from "../data/shift.js";
import * as L from "../data/lines.js";
import { next, int, pick, weighted } from "./rng.js";
import { fill, pickLine } from "./text.js";
import { cupCost, costOfUse, hasStock, takeStock, operatingProfit } from "./economy.js";
import { recipesAt, archetypesFor, choiceUnlocked, gainXp, xpForServe } from "./progression.js";
import { scoreServe } from "./score.js";
import { BATCHES, PEARL_RAW, TUTORIAL_PRECOOKED } from "../data/equipment.js";
import { appeal, owns, kitchenSlots, SEAL_BONUS_MS } from "./equipment.js";

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const isOpen = (s) => !!(s.shift && s.shift.status === "open");
export const customer = (s, cid) => s.shift?.customers.find((c) => c.id === cid) || null;
export const waiting = (s) => (s.shift?.customers || []).filter((c) => c.phase === "wait");
export const patienceOf = (c) => c.patience + (c.bonus || 0);
/** 0..1 phần kiên nhẫn còn lại (1 = vừa tới). */
export function patienceLeft(s, c) {
  if (c.phase !== "wait") return c.phase === "enter" ? 1 : 0;
  return clamp(1 - (s.shift.t - c.arriveT) / patienceOf(c), 0, 1);
}

// ---------- tạo ca ----------
function orderSpec(recipeId, sugar, ice) {
  const r = RECIPE[recipeId];
  return { base: r.base, add: r.add, sugar, ice, topping: r.topping };
}
function lineCtx(c) {
  const a = ARCHETYPES[c.arch], r = RECIPE[c.recipe];
  return {
    self: a.self, call: a.call, drink: r.name.toLocaleLowerCase("vi"), sugar: c.order.sugar + "%",
    ice: choiceName("ice", c.order.ice).toLocaleLowerCase("vi"), topping: choiceName("topping", r.topping === "none" ? "tran-chau" : r.topping).toLocaleLowerCase("vi"),
  };
}

function genGuests(s, cfg) {
  const menu = recipesAt(s.level).map((r) => r.id);
  const archs = archetypesFor(s);
  const n = clamp(cfg.minGuests + Math.floor((s.rep - 35) / 15) + Math.floor(s.level / 4) + appeal(s) + int(s, 2), cfg.minGuests, cfg.maxGuests);
  const times = [];
  for (let i = 0; i < n; i++) {
    const inRush = next(s) < 0.45;
    const at = inRush ? pick(s, cfg.rushes) + int(s, cfg.rushWindow) : cfg.firstAt + int(s, cfg.lastAt - cfg.firstAt);
    times.push(at);
  }
  times.sort((a, b) => a - b);
  for (let i = 1; i < times.length; i++) times[i] = Math.max(times[i], times[i - 1] + 4000);
  const used = new Set();
  return times.filter((t) => t <= cfg.lastAt + 8000).map((at) => {
    const arch = weighted(s, archs.map((id) => ({ id, w: ARCHETYPES[id].weight }))).id;
    const A = ARCHETYPES[arch];
    const liked = A.likes.filter((id) => menu.includes(id));
    const recipe = liked.length && next(s) < 0.55 ? pick(s, liked) : pick(s, menu);
    const R = RECIPE[recipe];
    const sugar = next(s) < 0.5 ? R.sugar : pick(s, A.prefs.sugar);
    const ice = next(s) < 0.5 ? R.ice : pick(s, A.prefs.ice);
    let name = pick(s, A.names);
    if (used.has(name)) name = pick(s, A.names);
    used.add(name);
    return { at, arch, name, recipe, sugar, ice };
  });
}

export function startShift(s, events) {
  if (s.shift) return { err: "shift-open" };
  const tut = !s.tutorialDone;
  const cfg = tut ? TUTORIAL_DAY : NORMAL_DAY;
  const guests = tut ? TUTORIAL_DAY.guests.map((g) => ({ ...g })) : genGuests(s, NORMAL_DAY);
  const fee = Math.min(SHIFT_FEE, s.money); // hụt vốn: chủ nhà cho khất phần thiếu (gói ký gửi ở Milestone 3)
  s.money -= fee;
  s.shift = {
    day: s.day, t: 0, duration: cfg.duration, patienceMult: cfg.patienceMult * (1 + 0.03 * appeal(s)), hints: cfg.hints, tutorial: tut,
    status: "open", schedule: guests, planned: guests.length, customers: [], nextCid: 1, active: null, cup: null, dialog: null,
    ledger: { revenue: 0, cogs: 0, waste: 0, fee, restock: 0, cups: 0, served: 0, lost: 0, refunds: 0, remakes: 0, pearlWaste: 0 },
    reviews: [], repDelta: 0, xp: 0, levelUps: [], moments: [], usedLines: [],
    kitchen: { ready: (tut ? TUTORIAL_PRECOOKED : 0) + s.carryPearls, batches: [] },
  };
  s.carryPearls = 0;
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
  const c = {
    id: sh.nextCid++, arch: g.arch, sprite: A.sprite, name: g.name, recipe: g.recipe, order: orderSpec(g.recipe, g.sugar, g.ice),
    price: RECIPE[g.recipe].price, patience: Math.round(A.patience * sh.patienceMult), bonus: 0, spot: freeSpot(sh),
    t0: sh.t, arriveT: null, phase: "enter", mood: "walk", pinned: false, impatientSaid: false, remade: false,
    say: null, leaveT: null, reactUntil: null, review: null,
  };
  const lines = [...L.ORDER_LINES, ...(L.ORDER_LINES_BY_ARCH[c.arch] || [])];
  c.orderLine = freshLine(s, lines, lineCtx(c)); // không lặp câu trong cùng ca
  sh.customers.push(c);
  events.push({ type: "spawn", cid: c.id, arch: c.arch });
}

function say(sh, c, text) { c.say = { text, at: sh.t }; }

function leave(sh, c, mood) {
  c.phase = "leave"; c.leaveT = sh.t; c.mood = mood;
  if (sh.active === c.id) sh.active = null;
}

function addRep(s, stars) {
  const sh = s.shift;
  const want = clamp(sh.repDelta + REP_BY_STARS[stars], -REP_CAP_PER_SHIFT, REP_CAP_PER_SHIFT);
  const d = want - sh.repDelta;
  sh.repDelta = want;
  const before = s.rep;
  s.rep = clamp(s.rep + d, 0, 100);
  return s.rep - before;
}

function review(s, c, stars, line, reason) {
  const rep = addRep(s, stars);
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
  // khách mới (cửa đóng sau giờ ca: bỏ lượt chưa tới)
  while (sh.schedule.length && sh.schedule[0].at <= t) {
    if (t > sh.duration) { sh.schedule.length = 0; break; }
    const live = sh.customers.filter((c) => c.phase !== "leave").length;
    if (live >= QUEUE_MAX || freeSpot(sh) < 0) { sh.schedule[0].at = t + SPAWN_RETRY_MS; sh.schedule.sort((a, b) => a.at - b.at); break; }
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
        review(s, c, 1, freshLine(s, L.TIMEOUT_REVIEW, lineCtx(c)), "timeout");
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
  if (!sh.schedule.length && !sh.customers.length) endShift(s, events); // hết giờ nhận khách (lượt còn lại bị bỏ) + quầy trống
  return { ok: true };
}

// ---------- quầy ----------
export function pin(s, cid, events) {
  if (!isOpen(s)) return { err: "closed" };
  if (s.shift.dialog) return { err: "dialog" };
  const c = customer(s, cid);
  if (!c || c.phase !== "wait") return { err: "not-waiting" };
  s.shift.active = cid;
  c.pinned = true;
  events.push({ type: "pinned", cid });
  return { ok: true };
}

/** Bước kế tiếp phải làm trên ly (null = ly đã đóng nắp). */
export function nextStep(cup) {
  if (!cup) return "cup";
  if (cup.sealed) return null;
  return STEPS[cup.steps.length] || null;
}

export function brew(s, step, id, events) {
  if (!isOpen(s)) return { err: "closed" };
  const sh = s.shift;
  if (sh.dialog) return { err: "dialog" };
  const want = nextStep(sh.cup);
  if (want === null) return { err: "sealed" };
  if (step !== want) return { err: "wrong-step", want };
  const c = choice(step, id);
  if (!c) return { err: "bad-choice" };
  if (!choiceUnlocked(step, c, s.level)) return { err: "locked" };
  const use = useOf(step, id);
  if (c.kitchen) {
    if (sh.kitchen.ready < 1) return { err: "not-cooked" };
    sh.kitchen.ready--;
  } else {
    if (!hasStock(s, use)) return { err: "out-of-stock", use };
    takeStock(s, use);
  }
  if (step === "cup") sh.cup = { steps: [], sealed: false, forCid: sh.active };
  sh.cup.steps.push({ step, id });
  if (step === "lid") sh.cup.sealed = true;
  events.push({ type: "brewed", step, id });
  return { ok: true };
}

/** Sửa bước gần nhất trước khi đóng nắp. Nguyên liệu đã đổ vẫn tính hao hụt. */
export function undo(s, events) {
  if (!isOpen(s)) return { err: "closed" };
  const sh = s.shift, cup = sh.cup;
  if (sh.dialog) return { err: "dialog" };
  if (!cup || !cup.steps.length) return { err: "empty" };
  if (cup.sealed) return { err: "sealed" };
  const st = cup.steps.pop();
  sh.ledger.waste += costOfUse(useOf(st.step, st.id));
  if (!cup.steps.length) sh.cup = null;
  events.push({ type: "undone", step: st.step });
  return { ok: true };
}

export function discard(s, events) {
  if (!isOpen(s)) return { err: "closed" };
  const sh = s.shift;
  if (sh.dialog) return { err: "dialog" };
  if (!sh.cup) return { err: "empty" };
  const k = cupCost(sh.cup);
  sh.ledger.waste += k;
  sh.cup = null;
  events.push({ type: "discarded", cost: k });
  return { ok: true };
}

/** Chọn câu, tránh lặp câu đã dùng trong ca nếu còn câu khác. */
function freshLine(s, list, ctx) {
  const sh = s.shift, used = new Set(sh.usedLines);
  const fresh = list.filter((t) => !used.has(t));
  const tpl = pick(s, fresh.length ? fresh : list);
  sh.usedLines.push(tpl);
  if (sh.usedLines.length > 40) sh.usedLines.shift();
  return fill(tpl, ctx);
}

function reviewLine(s, c, sc) {
  const ctx = lineCtx(c);
  const order = ["toppingMissing", "toppingWrong", "addWrong", "sugarHigh", "sugarLow", "iceHigh", "iceLow", "slow", "toppingExtra"];
  const err = order.find((e) => sc.errors.includes(e));
  if (err && sc.stars <= 4) return { line: freshLine(s, L.REVIEW_LINES[err], ctx), reason: err };
  return { line: freshLine(s, L.REVIEW_LINES[sc.stars], ctx), reason: sc.stars >= 4 ? "good" : "ok" };
}

function pay(s, c, sc, price, cost, events, reasonOverride) {
  const sh = s.shift;
  sh.ledger.revenue += price;
  sh.ledger.cogs += cost;
  sh.ledger.cups++;
  sh.ledger.served++;
  s.money += price;
  s.stats.cups++;
  s.stats.revenue += price;
  const { line, reason } = reasonOverride || reviewLine(s, c, sc);
  review(s, c, sc.stars, line, reason);
  const xp = gainXp(s, price > 0 ? xpForServe(RECIPE[c.recipe], sc.stars) : 0, events);
  sh.xp += xp;
  c.phase = "react"; c.reactUntil = sh.t + REACT_MS; c.mood = sc.stars >= 3 ? "happy" : "annoyed";
  say(sh, c, line);
  if (sh.active === c.id) sh.active = null;
  if (sc.stars === 5) sh.moments.push({ kind: "five", name: c.name, line });
  events.push({ type: "served", cid: c.id, stars: sc.stars, price, xp, raw: sc.raw, errors: sc.errors });
}

export function serve(s, cid, events) {
  if (!isOpen(s)) return { err: "closed" };
  const sh = s.shift;
  if (sh.dialog) return { err: "dialog" };
  const c = customer(s, cid);
  if (!c || c.phase !== "wait") return { err: "not-waiting" };
  const cup = sh.cup;
  if (!cup || !cup.sealed) return { err: "not-sealed" };
  const frac = Math.max(0, sh.t - c.arriveT - (owns(s, "powered-sealer") ? SEAL_BONUS_MS : 0)) / patienceOf(c);
  const sc = scoreServe(c.order, cup, frac, ARCHETYPES[c.arch].expect);
  if (c.remade) sc.stars = Math.min(sc.stars, 4);
  const cost = cupCost(cup);
  sh.cup = null;
  if (sc.wrongBase) {
    // Khách phát hiện sai món ⇒ dừng ca, hỏi cách xử lý. Chưa thu tiền.
    c.mood = "surprised";
    sh.dialog = { kind: "complaint", cid, cost, stars: sc.stars, raw: sc.raw, errors: sc.errors };
    say(sh, c, fill(L.COMPLAINT.line, lineCtx(c)));
    events.push({ type: "complaint", cid, errors: sc.errors });
    return { ok: true, complaint: true };
  }
  pay(s, c, sc, c.price, cost, events);
  return { ok: true };
}

export function resolve(s, pickId, events) {
  const sh = s.shift;
  if (!sh || !sh.dialog || sh.dialog.kind !== "complaint") return { err: "no-dialog" };
  const d = sh.dialog, c = customer(s, d.cid);
  if (!c) { sh.dialog = null; return { ok: true }; }
  const ctx = lineCtx(c);
  if (pickId === "remake") {
    sh.ledger.waste += d.cost;
    sh.ledger.remakes++;
    c.bonus += REMAKE_PATIENCE_MS; c.remade = true; c.mood = "waiting";
    sh.active = c.id;
    say(sh, c, fill(L.COMPLAINT.after.remake, ctx));
    sh.moments.push({ kind: "remake", name: c.name });
  } else if (pickId === "discount") {
    const sc = { stars: Math.min(d.stars, 2), raw: d.raw, errors: d.errors };
    sh.dialog = null;
    pay(s, c, sc, Math.floor(c.price / 2), d.cost, events, { line: fill(L.COMPLAINT.after.discount, ctx), reason: "discount" });
    events.push({ type: "resolved", choice: pickId, cid: c.id });
    return { ok: true };
  } else if (pickId === "refund") {
    sh.ledger.waste += d.cost;
    sh.ledger.refunds++;
    review(s, c, 2, fill(L.COMPLAINT.after.refund, ctx), "refund");
    c.phase = "react"; c.reactUntil = sh.t + REACT_MS; c.mood = "happy";
    say(sh, c, fill(L.COMPLAINT.after.refund, ctx));
    if (sh.active === c.id) sh.active = null;
    sh.moments.push({ kind: "refund", name: c.name });
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
  if (sh.kitchen.batches.length >= kitchenSlots(s)) return { err: "kitchen-busy" };
  if ((s.stock[PEARL_RAW] || 0) < size) return { err: "out-of-stock", use: { [PEARL_RAW]: size } };
  s.stock[PEARL_RAW] -= size;
  sh.kitchen.batches.push({ size, doneAt: sh.t + B.ms, ms: B.ms });
  events.push({ type: "cooking", size });
  return { ok: true };
}

// ---------- chốt ca ----------
function headline(sum) {
  const H = L.HEADLINES;
  const ctx = { cups: sum.cups, lost: sum.lost, profit: Math.abs(sum.profit), stars: sum.avgStars.toLocaleString("vi-VN", { maximumFractionDigits: 1 }) };
  if (sum.profit < 0) return fill(H.loss, ctx);
  if (sum.lost > 0) return fill(H.lost, ctx);
  if (sum.cups <= 2) return fill(H.few, ctx);
  if (sum.avgStars >= 4.5) return fill(H.perfect, ctx);
  return fill(H.good, ctx);
}

export function endShift(s, events) {
  const sh = s.shift;
  if (!sh) return { err: "no-shift" };
  if (sh.cup) sh.ledger.waste += cupCost(sh.cup); // ly dở cuối ca bỏ đi
  // trân châu đã nấu: tủ mát giữ sang ca sau, không thì hao hụt một lần; mẻ đang nấu dở bỏ
  const pearlCost = costOfUse({ [PEARL_RAW]: 1 });
  const cooking = sh.kitchen.batches.reduce((a, b) => a + b.size, 0);
  let left = sh.kitchen.ready;
  if (owns(s, "upright-fridge")) { s.carryPearls = Math.min(12, left); left -= s.carryPearls; }
  sh.ledger.pearlWaste = left + cooking;
  sh.ledger.waste += (left + cooking) * pearlCost;
  const Lg = sh.ledger;
  const stars = sh.reviews.map((r) => r.stars);
  const avg = stars.length ? stars.reduce((a, b) => a + b, 0) / stars.length : 0;
  const best = [...sh.reviews].sort((a, b) => b.stars - a.stars || a.cid - b.cid)[0] || null;
  const sum = {
    day: sh.day, cups: Lg.cups, served: Lg.served, lost: Lg.lost, planned: sh.planned, revenue: Lg.revenue, cogs: Lg.cogs, waste: Lg.waste,
    fee: Lg.fee, restock: Lg.restock, refunds: Lg.refunds, remakes: Lg.remakes, pearlWaste: Lg.pearlWaste, carry: s.carryPearls, profit: operatingProfit(Lg),
    avgStars: Math.round(avg * 10) / 10, reviews: sh.reviews.map((r) => ({ name: r.name, stars: r.stars, line: r.line, reason: r.reason, recipe: r.recipe })),
    best: best ? { name: best.name, stars: best.stars, line: best.line } : null,
    repDelta: sh.repDelta, rep: s.rep, xp: sh.xp, levelUps: [...sh.levelUps], level: s.level, money: s.money, moments: sh.moments.slice(0, 8),
  };
  sum.headline = headline(sum);
  s.lastSummary = sum;
  s.journal.unshift({ day: sum.day, cups: sum.cups, profit: sum.profit, avgStars: sum.avgStars, headline: sum.headline });
  s.journal.length = Math.min(s.journal.length, 30);
  s.stats.shifts++;
  s.stats.bestProfit = Math.max(s.stats.bestProfit, sum.profit);
  s.day++;
  s.tutorialDone = true;
  s.shift = null;
  events.push({ type: "shiftEnded", summary: sum });
  return { ok: true };
}

/** Còn bao nhiêu khách chưa tới. */
export const pendingGuests = (s) => s.shift?.schedule.length || 0;
export { CHOICES };
