// Drama Engine (docs/tiem-banh-mi/DRAMA.md, chép khung core/drama.js của Trà Sữa): sự kiện có điều kiện khai báo (data/events.js),
// nhiều bước (goto), hên xui (roll), hẹn quay lại ngày sau (later → s.drama.queue). Trong ca: tối đa 1–2 sự kiện, đồng hồ dừng khi hội thoại
// mở (sh.dialog kind "event"). Giữa hai ca: tối đa 1 sự kiện (s.drama.pending), hiện sau bảng chốt ca. Mỗi lựa chọn lưu một khoảnh khắc
// cho Nhật Ký Làm Chủ. Thuần, RNG của ván ⇒ cùng hạt + cùng thao tác ⇒ cùng sự kiện.
import { EVENTS, EVENT } from "../data/events.js?v=b4";
import { NPCS } from "../data/npcs.js?v=b4";
import { ARCHETYPES } from "../data/customers.js?v=b4";
import { STOCK, STOCK_IDS, LEVELS } from "../data/economy.js?v=b4";
import { EQUIPMENT, DECOR } from "../data/equipment.js?v=b4";
import { QUIRKS } from "../data/quirks.js?v=b4";
import { PHASES, SHIFT_MS } from "../data/shift.js?v=b4";
import { next, int, pick, weighted } from "./rng.js?v=b4";
import { fill, freshLine } from "./text.js?v=b4";
import { FLAG_DAYS, freshDrama, today, liveFlags, addMod, engineFlag } from "./flags.js?v=b4";
import { canChange, spend } from "./money.js?v=b4";
import { STEPS } from "./board.js?v=b4";
import { loafName } from "./order.js?v=b4";
import { newLoaf, addWaste } from "./oven.js?v=b4";
import { PERSONA_ASIDE } from "../data/lines-reply.js?v=b4";

export { freshDrama };
export const DRAMA = { perShift: 2, perShiftEarly: 1, manyFromDay: 5, firstAt: [30000, 70000], gap: [50000, 80000], closeBefore: 25000, betweenDaysChance: 0.6 };
export const FX_KEYS = new Set(["money", "rep", "followers", "buzz", "xp", "stock", "bread", "patience", "whoPatience", "away", "guests", "arch", "group", "preorder", "nextGuests",
  "mod", "flag", "flagDays", "unflag", "review", "priceWho", "freeWho", "leaveWho", "sell", "own", "regular", "helper", "debt", "ovenPause", "ovenRaw", "ovenDump",
  "closeEarly", "moment", "flagLast", "quirk", "bachucTotal", "contract"]);
export const IF_KEYS = new Set(["minDay", "minLevel", "maxLevel", "minRep", "maxRep", "minFollowers", "minMoney", "maxMoney", "minBuzz", "flags", "noFlags", "anyFlags",
  "owns", "notOwns", "shop", "oven", "weather", "reviewLow", "staleMin", "sum", "chain", "waitingMin", "queueFree", "phase", "tMin", "tMax", "archWaiting",
  "caseMin", "caseMax", "caseCrispOne", "boardStep", "burntRecent", "gasOut", "noChange", "lastServe"]);
const SHIFT_ONLY = ["waitingMin", "queueFree", "phase", "tMin", "tMax", "archWaiting", "caseMin", "caseMax", "caseCrispOne", "boardStep", "burntRecent", "gasOut", "noChange", "lastServe"];

const owns = (s, id) => !!s.owned?.[id];
const waitingOf = (s) => (s.shift ? s.shift.customers.filter((c) => c.phase === "wait" && !c.pre) : []);
const custOf = (s, cid) => s.shift?.customers.find((c) => c.id === cid) || null;

// ---------- điều kiện ----------
export function buildCtx(s, when) {
  const sh = s.shift;
  const x = { when, day: s.day, level: s.level, rep: s.rep, followers: s.followers || 0, buzz: s.buzz || 0, money: s.money, flags: liveFlags(s), s, sum: s.lastSummary };
  x.reviewLow = (s.feed || []).slice(0, 6).some((r) => r.stars <= 2);
  if (sh) {
    const w = waitingOf(s);
    x.t = sh.t; x.waiting = w; x.waitingN = w.length;
    x.phase = sh.phase;
    x.queueFree = sh.customers.filter((c) => c.phase !== "leave" && !c.pre).length < 4;
    x.caseN = sh.case.length;
    x.lastServe = sh.lastServe ? { ...sh.lastServe, age: sh.t - sh.lastServe.t, present: !!custOf(s, sh.lastServe.cid) } : null;
  }
  return x;
}

/** Điều kiện `if` của sự kiện có thoả trong ngữ cảnh x không. */
export function meets(ifs = {}, x) {
  const s = x.s, shift = x.when === "shift";
  if (ifs.minDay && x.day < ifs.minDay) return false;
  if (ifs.minLevel && x.level < ifs.minLevel) return false;
  if (ifs.maxLevel && x.level > ifs.maxLevel) return false;
  if (ifs.minRep !== undefined && x.rep < ifs.minRep) return false;
  if (ifs.maxRep !== undefined && x.rep > ifs.maxRep) return false;
  if (ifs.minFollowers && x.followers < ifs.minFollowers) return false;
  if (ifs.minBuzz !== undefined && x.buzz < ifs.minBuzz) return false;
  if (ifs.minMoney !== undefined && x.money < ifs.minMoney) return false;
  if (ifs.maxMoney !== undefined && x.money > ifs.maxMoney) return false;
  if (ifs.flags && !ifs.flags.every((f) => x.flags.has(f))) return false;
  if (ifs.noFlags && ifs.noFlags.some((f) => x.flags.has(f))) return false;
  if (ifs.anyFlags && !ifs.anyFlags.some((f) => x.flags.has(f))) return false;
  if (ifs.owns && ![].concat(ifs.owns).some((id) => owns(s, id))) return false;
  if (ifs.notOwns && owns(s, ifs.notOwns)) return false;
  if (ifs.shop !== undefined && !!s.shop !== ifs.shop) return false;
  if (ifs.oven && s.oven !== ifs.oven) return false;
  if (ifs.weather && s.weather?.kind !== ifs.weather) return false;
  if (ifs.reviewLow && !x.reviewLow) return false;
  if (ifs.staleMin && (s.stale?.n || 0) < ifs.staleMin) return false;
  if (ifs.sum) {
    const S = x.sum, q = ifs.sum;
    if (!S) return false;
    if (q.lostMin !== undefined && S.lost < q.lostMin) return false;
    if (q.profitMax !== undefined && S.profit > q.profitMax) return false;
    if (q.profitMin !== undefined && S.profit < q.profitMin) return false;
    if (q.starsMin !== undefined && S.avg < q.starsMin) return false;
    if (q.starsMax !== undefined && S.avg > q.starsMax) return false;
    if (q.loavesMin !== undefined && S.loaves < q.loavesMin) return false;
    if (q.burntMin !== undefined && S.burntBatches < q.burntMin) return false;
    if (q.batchesMin !== undefined && S.batches < q.batchesMin) return false;
    if (q.leftoverMin !== undefined && (S.leftover || 0) < q.leftoverMin) return false;
  }
  if (!shift) return !SHIFT_ONLY.some((k) => ifs[k] !== undefined);
  const sh = s.shift;
  if (ifs.waitingMin !== undefined && x.waitingN < ifs.waitingMin) return false;
  if (ifs.queueFree && !x.queueFree) return false;
  if (ifs.phase && x.phase !== ifs.phase) return false;
  if (ifs.tMin !== undefined && x.t < ifs.tMin) return false;
  if (ifs.tMax !== undefined && x.t > ifs.tMax) return false;
  if (ifs.archWaiting && !x.waiting.some((c) => c.arch === ifs.archWaiting)) return false;
  if (ifs.caseMin !== undefined && x.caseN < ifs.caseMin) return false;
  if (ifs.caseMax !== undefined && x.caseN > ifs.caseMax) return false;
  if (ifs.caseCrispOne && !(sh.case.filter((l) => l.crisp >= 85).length === 1 && x.waitingN >= 2)) return false;
  if (ifs.boardStep) {
    const i = STEPS.indexOf(ifs.boardStep);
    if (!sh.boards.some((b) => b.loaf && b.cid !== null && (b.step === i || b.step + 1 === i))) return false;
  }
  if (ifs.burntRecent && !(sh.burntAt !== undefined && sh.burntAt !== null && sh.t - sh.burntAt < 10000)) return false;
  if (ifs.gasOut && !((s.stock.gas || 0) < 1 && !owns(s, "spare-gas"))) return false;
  if (ifs.noChange && canChange(s.float, 478)) return false;
  if (ifs.lastServe) {
    const L = x.lastServe, q = ifs.lastServe;
    if (!L || !L.present || L.age > (q.maxAgeMs ?? 6000)) return false;
    if (q.minStars !== undefined && L.stars < q.minStars) return false;
    if (q.maxStars !== undefined && L.stars > q.maxStars) return false;
    if (q.arch !== undefined && ![].concat(q.arch).includes(L.arch)) return false;
    if (q.notArch !== undefined && L.arch === q.notArch) return false;
    if (q.mistake !== undefined && !(q.mistake === "any" ? L.mistakes.length > 0 : [].concat(q.mistake).some((m) => L.mistakes.includes(m)))) return false;
    if (q.crispMin !== undefined && L.crisp < q.crispMin) return false;
    if (q.loavesMin !== undefined && L.loaves < q.loavesMin) return false;
    if (q.bachucLow && !L.bachucLow) return false;
    if (q.overpaidMin !== undefined && (L.overpaid || 0) < q.overpaidMin) return false;
    if (q.quirk !== undefined && !L.quirks.includes(q.quirk)) return false;
    if (q.burnt && !L.burnt) return false;
  }
  return true;
}

function eligible(s, ev, x, viaQueue) {
  if (ev.when !== x.when) return false;
  if (ev.if?.chain && !viaQueue) return false;
  const seen = s.drama.seen[ev.id];
  if (!viaQueue && seen !== undefined && (ev.once || today(s) - seen <= (ev.cooldown ?? 2))) return false;
  if (viaQueue && ev.once && seen !== undefined) return false;
  if (!meets(ev.if, x)) return false;
  return !!speakerFor(s, ev, x, true);
}

/** Người nói: khách trong cảnh (who) hoặc NPC (npc id trong data/npcs.js). */
function speakerFor(s, ev, x, probe = false) {
  if (ev.who === "lastServed") {
    const c = x.lastServe && custOf(s, x.lastServe.cid);
    return c ? { cid: c.id } : null;
  }
  if (ev.who === "waiting" || ev.who?.arch) {
    if (x.when !== "shift") return null;
    const list = x.waiting.filter((c) => !ev.who.arch || c.arch === ev.who.arch);
    if (!list.length) return null;
    return { cid: probe ? list[0].id : pick(s, list).id };
  }
  return { npc: NPCS[ev.npc] ? ev.npc : "co-sau" };
}

function chooseEvent(s, x) {
  const D = s.drama;
  for (let i = 0; i < D.queue.length; i++) {
    const q = D.queue[i], ev = EVENT[q.id];
    if (!ev || q.day > today(s) || ev.when !== x.when) continue;
    if (eligible(s, ev, x, true)) { D.queue.splice(i, 1); return ev; }
  }
  let list = EVENTS.filter((ev) => eligible(s, ev, x, false));
  if (!list.length) return null;
  if (D.recent.length >= 2 && D.recent.slice(-2).every((t) => t !== "good")) {
    const good = list.filter((ev) => ev.tone === "good");
    if (good.length) list = good;
  }
  const top = Math.max(...list.map((ev) => ev.priority || 1));
  if (top >= 3) list = list.filter((ev) => (ev.priority || 1) >= 3);
  return weighted(s, list.map((ev) => ({ ev, w: (ev.w ?? 1) * (ev.priority || 1) }))).ev;
}

function open(s, ev, x) {
  const sp = speakerFor(s, ev, x);
  const d = { kind: "event", id: ev.id, node: "start", cid: sp.cid ?? null, npc: sp.npc || null, steps: 0 };
  s.drama.seen[ev.id] = today(s);
  s.drama.recent.push(ev.tone === "good" ? "good" : "other");
  if (s.drama.recent.length > 6) s.drama.recent.shift();
  if (x.when === "shift") {
    const sh = s.shift;
    sh.dialog = d;
    sh.drama.count++;
    const c = d.cid !== null ? custOf(s, d.cid) : null;
    if (c) { c.say = { text: textOf(s, d, nodeOf(s, ev, "start").line), at: sh.t }; c.mood = "waiting"; }
  } else s.drama.pending = d;
  return d;
}

/** Node có câu mở theo cờ (alt). */
export function nodeOf(s, ev, id) {
  const n = ev?.nodes?.[id];
  if (!n || !n.alt) return n;
  const fl = liveFlags(s);
  const a = n.alt.find((x) => (x.flags || []).every((f) => fl.has(f)));
  return a ? { ...n, line: a.line ?? n.line, me: a.me ?? n.me, mood: a.mood ?? n.mood } : n;
}

export const eligibleNow = (s, ev) => eligible(s, ev, buildCtx(s, ev.when), !!ev.if?.chain);
/** Mở thẳng một sự kiện (test, ?event=ID). Chỉ kiểm thời điểm + người nói. */
export function openEvent(s, id) {
  const ev = EVENT[id];
  if (!ev) return { err: "unknown-event" };
  const when = s.shift ? "shift" : "day";
  if (ev.when !== when) return { err: "wrong-time" };
  if (currentEvent(s) || s.shift?.dialog) return { err: "busy" };
  const x = buildCtx(s, when);
  if (!speakerFor(s, ev, x, true)) return { err: "no-speaker" };
  open(s, ev, x);
  return { ok: true };
}

export function startDrama(s) {
  const sh = s.shift;
  const many = s.day >= DRAMA.manyFromDay;
  sh.drama = { count: 0, max: sh.tutorial ? 0 : many ? DRAMA.perShift : DRAMA.perShiftEarly, nextAt: DRAMA.firstAt[0] + int(s, DRAMA.firstAt[1] - DRAMA.firstAt[0]) };
}

/** Gọi cuối mỗi tick. */
export function maybeTrigger(s, events) {
  const sh = s.shift;
  if (!sh || sh.dialog || sh.away || sh.paying !== null || !sh.drama || sh.drama.count >= sh.drama.max) return;
  if (sh.t > SHIFT_MS - DRAMA.closeBefore) return;
  const x = buildCtx(s, "shift");
  const fresh = x.lastServe && x.lastServe.age < 300 && sh.t >= DRAMA.firstAt[0] / 2;
  if (sh.t < sh.drama.nextAt && !fresh) return;
  const ev = chooseEvent(s, x);
  if (fresh && !ev) return;
  if (!ev) { sh.drama.nextAt = sh.t + 5000; return; }
  if (fresh && sh.t < sh.drama.nextAt && !ev.if?.lastServe) return;
  open(s, ev, x);
  sh.drama.nextAt = sh.t + DRAMA.gap[0] + int(s, DRAMA.gap[1] - DRAMA.gap[0]);
  events.push({ type: "drama", id: ev.id });
}

/** Gọi cuối endShift (s.day đã sang ngày mai): hết hạn cờ, chọn sự kiện giữa hai ca. */
export function endDrama(s) {
  const D = s.drama;
  const t = today(s);
  for (const [f, until] of Object.entries(D.flags)) if (until < t) delete D.flags[f];
  D.queue = D.queue.filter((q) => q.day + FLAG_DAYS + 4 >= t);
  const x = buildCtx(s, "day");
  const due = D.queue.some((q) => q.day <= t && EVENT[q.id]?.when === "day");
  if (!due && next(s) > DRAMA.betweenDaysChance) return;
  const ev = chooseEvent(s, x);
  if (ev) open(s, ev, x);
}

// ---------- hội thoại ----------
export const currentEvent = (s) => (s.shift?.dialog?.kind === "event" ? s.shift.dialog : !s.shift ? s.drama?.pending || null : null);

export function textCtx(s, d) {
  const c = d.cid !== null ? custOf(s, d.cid) : null;
  const base = { shop: s.shopName, day: today(s), followers: s.followers || 0 };
  if (c) return { self: c.self, call: c.call, name: c.name, loaf: loafName(c.items[0]), n: c.items.length, price: c.items.reduce((a, it) => a + it.price, 0), ...base };
  const n = NPCS[d.npc] || NPCS["co-sau"];
  return { name: n.name, self: n.self, call: n.call, loaf: "bánh mì", n: 1, price: 0, ...base };
}
export const textOf = (s, d, tpl) => fill(tpl || "", textCtx(s, d));
export const byPersona = (s, map, base) => (s.owner?.persona && map?.[s.owner.persona]) || base;
/** Ai đang nói (UI chân dung): { name, npc?, role, cid? }. */
export function speakerInfo(s, d) {
  if (d.cid !== null) { const c = custOf(s, d.cid); return { name: c?.name || "Khách", role: c?.sprite || "student", cid: d.cid }; }
  const n = NPCS[d.npc] || NPCS["co-sau"];
  return { name: n.name, npc: d.npc, role: n.role };
}

/** Lựa chọn có hiện không (need.flags / noFlags ẩn hẳn). */
export function choiceVisible(s, ch) {
  const n = ch.need;
  if (!n) return true;
  const fl = liveFlags(s);
  if (n.flags && !n.flags.every((f) => fl.has(f))) return false;
  if (n.noFlags && n.noFlags.some((f) => fl.has(f))) return false;
  return true;
}
/** Lựa chọn làm được không (đủ tiền / hàng / bánh, need khác). */
export function affordable(s, ch) {
  if (!choiceVisible(s, ch)) return false;
  const fx = ch.fx || {};
  if (fx.money < 0 && s.money < -fx.money) return false;
  for (const [id, n] of Object.entries(fx.stock || {})) if (n < 0 && (s.stock[id] || 0) < -n) return false;
  if (fx.bread < 0 && (s.shift ? s.shift.case.length : s.stock.phoi || 0) < -fx.bread) return false; // giữa hai ca: ổ lấy từ phôi trong kho
  const n = ch.need || {};
  if (n.waitingMin && waitingOf(s).length < n.waitingMin) return false;
  if (n.caseMin && (s.shift?.case.length || 0) < n.caseMin) return false;
  if (n.owns && !owns(s, n.owns)) return false;
  if (n.shop !== undefined && !!s.shop !== n.shop) return false;
  return true;
}
export const isFree = (ch) => !ch.need && !((ch.fx?.money || 0) < 0) && !Object.values(ch.fx?.stock || {}).some((n) => n < 0) && !((ch.fx?.bread || 0) < 0);
export const visibleChoices = (s, node) => node.choices.filter((ch) => choiceVisible(s, ch));

/** Chữ mô tả hậu quả (hiện trên nút và sau khi chọn). */
export function fxSummary(fx = {}, later = null) {
  const out = [];
  const sign = (n) => (n > 0 ? "+" : "−") + Math.abs(n);
  if (fx.money) out.push(`${sign(fx.money)}k`);
  if (fx.rep) out.push(`Danh tiếng ${sign(fx.rep)}`);
  if (fx.followers) out.push(`${sign(fx.followers)} người theo dõi`);
  if (fx.buzz) out.push(fx.buzz > 0 ? "Tiệm hot lên" : "Bớt hot");
  if (fx.xp) out.push(`+${fx.xp} XP`);
  for (const [id, n] of Object.entries(fx.stock || {})) out.push(`${sign(n)} ${STOCK[id]?.name || id}`);
  if (fx.bread) out.push(`${sign(fx.bread)} ổ trong tủ`);
  if (fx.patience) out.push(fx.patience > 0 ? `Khách chờ thêm ${Math.round(fx.patience / 1000)} giây` : `Khách bớt kiên nhẫn ${Math.round(-fx.patience / 1000)} giây`);
  if (fx.whoPatience) out.push(fx.whoPatience > 0 ? `Khách này chờ thêm ${Math.round(fx.whoPatience / 1000)} giây` : `Khách này bớt kiên nhẫn ${Math.round(-fx.whoPatience / 1000)} giây`);
  if (fx.away) out.push(`Quầy trống ${Math.round(fx.away / 1000)} giây`);
  if (fx.guests) out.push(`${sign(fx.guests)} khách`);
  if (fx.arch) out.push(`+${fx.arch.n} ${ARCHETYPES[fx.arch.arch]?.label.toLocaleLowerCase("vi") || "khách"}`);
  if (fx.group) out.push(`Đơn ${fx.group.n} ổ${fx.group.tip ? `, thưởng ${fx.group.tip}k nếu đúng` : ""}`);
  if (fx.preorder) out.push(`Đơn đặt trước ${fx.preorder.n || (fx.preorder.mix || []).reduce((a, m) => a + m.n, 0)} ổ${fx.preorder.when === "next" ? " (ca sau)" : ""}`);
  if (fx.contract) out.push(`Hợp đồng ${fx.contract.n} ổ mỗi ${fx.contract.every} ngày × ${fx.contract.deliveries} đợt`);
  if (fx.nextGuests) out.push(`Ca sau ${sign(fx.nextGuests)} khách`);
  if (fx.mod) out.push(`Hiệu lực ${fx.mod.days ?? 1} ngày`);
  if (fx.review) out.push(`Review ${fx.review.stars} sao`);
  if (fx.priceWho) out.push(`Giá đơn ${sign(fx.priceWho)}k`);
  if (fx.freeWho) out.push("Đơn này miễn phí");
  if (fx.leaveWho) out.push("Khách rời quầy");
  if (fx.sell) out.push(`Bán ${fx.sell.n} ổ`);
  if (fx.own) out.push(`Có ${EQUIPMENT[fx.own]?.name || DECOR[fx.own]?.name || fx.own}`);
  if (fx.helper) out.push(`Có người phụ ${Math.round(fx.helper / 1000)} giây`);
  if (fx.ovenPause) out.push(`Lò dừng ${Math.round(fx.ovenPause / 1000)} giây`);
  if (fx.ovenDump) out.push("Bỏ mẻ đang nướng");
  if (fx.ovenRaw) out.push("Mẻ đang nướng thành bánh sống");
  if (fx.closeEarly) out.push("Đóng cửa sớm");
  if (later) out.push(later.days > 0 ? "Chờ đến ngày sau…" : "Chuyện chưa hết…");
  return out;
}

/** Ổ trong tủ: bỏ đi n ổ (giòn nhất trước, để tặng / làm lại). */
function takeBread(sh, n) { sh.case.sort((a, b) => b.crisp - a.crisp); return sh.case.splice(0, Math.min(n, sh.case.length)); }

function applyFx(s, d, fx, events, hooks) {
  const sh = s.shift, D = s.drama;
  const who = d.cid !== null && sh ? custOf(s, d.cid) : null;
  if (fx.money) { if (fx.money < 0) spend(s, Math.min(-fx.money, s.money)); else s.money += fx.money; if (sh) sh.stats.eventCash = (sh.stats.eventCash || 0) + fx.money; }
  if (fx.rep) s.rep = Math.max(0, Math.min(100, s.rep + fx.rep));
  if (fx.followers) s.followers = Math.max(0, (s.followers || 0) + fx.followers);
  if (fx.buzz) s.buzz = Math.max(0, Math.min(20, (s.buzz || 0) + fx.buzz));
  if (fx.xp) hooks.gainXp(s, fx.xp, events);
  for (const [id, n] of Object.entries(fx.stock || {})) if (STOCK[id]) s.stock[id] = Math.max(0, (s.stock[id] || 0) + n);
  const days = fx.flagDays ?? FLAG_DAYS;
  for (const f of fx.flag ? [].concat(fx.flag) : []) D.flags[f] = today(s) + days;
  for (const f of fx.unflag ? [].concat(fx.unflag) : []) delete D.flags[f];
  if (fx.nextGuests) D.nextGuests = Math.max(-4, Math.min(8, (D.nextGuests || 0) + fx.nextGuests));
  if (fx.mod) addMod(s, fx.mod);
  if (fx.own) { if (EQUIPMENT[fx.own] || DECOR[fx.own]) s.owned[fx.own] = true; }
  if (fx.debt) { const k = fx.debt.name || "khach"; s.debts[k] = Math.max(0, (s.debts[k] || 0) + (fx.debt.k || 0)); if (!s.debts[k]) delete s.debts[k]; }
  if (fx.bachucTotal) D.flags["bachuc-to"] = today(s) + 999;
  if (fx.flagLast && sh?.lastServe) { const st = sh.lastServe.stars; D.flags[`${fx.flagLast}-${st >= 4 ? "hi" : st === 3 ? "mid" : "lo"}`] = today(s) + days + 2; }
  if (fx.review) hooks.netReview(s, { name: fill(fx.review.name || "{name}", textCtx(s, d)), stars: fx.review.stars, line: fill(fx.review.line, textCtx(s, d)) });
  if (fx.preorder) hooks.preorder(s, fx.preorder, events);
  if (fx.contract) hooks.contract(s, fx.contract, events);
  if (fx.regular && who) { s.regulars[who.name] = s.regulars[who.name] || { visits: 0, good: 0 }; s.regulars[who.name].good = Math.max(2, s.regulars[who.name].good); s.regulars[who.name].fav = who.items[0].recipe; }
  if (!sh) {
    // sự kiện giữa hai ca: khách thêm dồn sang ca tới
    if (fx.guests) D.nextGuests = Math.max(-4, Math.min(8, (D.nextGuests || 0) + fx.guests));
    if (fx.arch) D.nextArch[fx.arch.arch] = (D.nextArch[fx.arch.arch] || 0) + fx.arch.n;
    if (fx.group) hooks.preorder(s, { ...fx.group, when: "next", dueMs: 60000 }, events);
    if (fx.bread > 0) s.stale = { n: Math.min(20, (s.stale?.n || 0) + fx.bread), choice: s.stale?.choice || null };
    if (fx.bread < 0) s.stock.phoi = Math.max(0, (s.stock.phoi || 0) + fx.bread);
    return;
  }
  const t = sh.t;
  if (fx.bread > 0) for (let i = 0; i < fx.bread; i++) sh.case.push(newLoaf(s, 95, "oven"));
  if (fx.bread < 0) { const got = takeBread(sh, -fx.bread); addWaste(sh, "gift", got.length * STOCK.phoi.cost, `Tặng / làm lại ${got.length} ổ`); }
  if (fx.patience) for (const c of waitingOf(s)) c.patience = Math.max(5000, c.patience + fx.patience);
  if (fx.whoPatience && who) who.patience = Math.max(5000, who.patience + fx.whoPatience);
  if (fx.away) sh.away = { until: Math.max(sh.away?.until || 0, t + fx.away), kind: "event" };
  if (fx.guests > 0) for (let i = 0; i < fx.guests; i++) hooks.extraGuest(s, null, t + 2500 + i * 5000);
  if (fx.guests < 0) sh.schedule.splice(0, Math.min(sh.schedule.length, -fx.guests));
  if (fx.arch) for (let i = 0; i < fx.arch.n; i++) hooks.extraGuest(s, fx.arch.arch, t + 2500 + i * 5000);
  if (fx.group) hooks.group(s, fx.group, d, events);
  if (fx.sell) {
    const got = takeBread(sh, fx.sell.n);
    const k = got.length * (fx.sell.price || 0);
    s.money += k; sh.stats.revenue += k; sh.stats.cogs += got.length * STOCK.phoi.cost;
  }
  if (fx.helper) sh.helperUntil = Math.max(sh.helperUntil || 0, t + fx.helper);
  if (fx.ovenPause) for (const b of sh.oven) if (b) b.t0 += fx.ovenPause;
  if (fx.ovenRaw) for (const b of sh.oven) if (b) b.t0 = t - 10000;
  if (fx.ovenDump) sh.oven.forEach((b, i) => { if (b) { addWaste(sh, "burnt", b.n * STOCK.phoi.cost, `Bỏ mẻ đang nướng (${b.n} ổ)`); sh.oven[i] = null; } });
  if (who) {
    if (fx.priceWho) for (const it of who.items) { it.price = Math.max(0, it.price + Math.round(fx.priceWho / who.items.length)); }
    if (fx.freeWho) who.discount = 1, who.free = true;
    if (fx.quirk && QUIRKS[fx.quirk]) hooks.addQuirk(who, fx.quirk);
    if (fx.leaveWho && who.phase === "wait") hooks.leave(s, who);
  }
  if (fx.closeEarly) sh.closeNow = true;
}

/** Người chơi chọn một lựa chọn trong hội thoại sự kiện. hooks: hàm của core/shift.js (tránh vòng import cứng). */
export function choose(s, choiceId, events, hooks) {
  const d = currentEvent(s);
  if (!d) return { err: "no-event" };
  const ev = EVENT[d.id], node = ev?.nodes[d.node];
  if (!node) return { err: "bad-event" };
  const ch = node.choices.find((c) => c.id === choiceId);
  if (!ch) return { err: "bad-choice" };
  if (!affordable(s, ch)) return { err: "cannot-afford" };
  const persona = s.owner?.persona || null;
  let said = (persona && ch.sayBy?.[persona]) || ch.say, fx = ch.fx || {}, rolled = null, goto = ch.goto, later = ch.later;
  if (ch.roll) {
    const win = next(s) < ch.roll.p;
    rolled = win ? "win" : "lose";
    const R = ch.roll[rolled] || {};
    said = (persona && R.sayBy?.[persona]) || R.say || said; fx = { ...fx, ...(R.fx || {}) };
    if (R.goto) goto = R.goto;
    if (R.later) later = R.later;
  }
  applyFx(s, d, fx, events, hooks);
  if (later && EVENT[later.id]) s.drama.queue.push({ id: later.id, day: today(s) + (later.days ?? 1), from: ev.id });
  const sayText = textOf(s, d, said);
  const momentText = fx.moment === false ? null : textOf(s, d, fx.moment || said);
  const speaker = speakerInfo(s, d).name;
  const entry = { day: today(s), id: ev.id, choice: ch.id, label: ch.label, line: momentText || sayText, who: speaker || "", rolled };
  s.drama.history.unshift(entry);
  s.drama.history.length = Math.min(s.drama.history.length, 40);
  if (momentText) {
    const m = { kind: "drama", id: ev.id, name: speaker || "", line: momentText };
    if (s.shift) s.shift.moments.push(m);
    else if (s.lastSummary) { (s.lastSummary.moments = s.lastSummary.moments || []).push(m); (s.lastSummary.drama = s.lastSummary.drama || []).push(entry); }
  }
  const summary = fxSummary(fx, later);
  if (goto && ev.nodes[goto]) { d.node = goto; d.steps++; }
  else {
    if (s.shift?.dialog === d) s.shift.dialog = null;
    else if (s.drama.pending === d) s.drama.pending = null;
    if (s.shift) { s.shift.dramaDone = (s.shift.dramaDone || 0) + 1; hooks.onDramaDone?.(s, events); }
    const c = d.cid !== null && s.shift ? custOf(s, d.cid) : null;
    if (c && (c.phase === "wait" || c.phase === "react")) c.say = { text: sayText, at: s.shift.t };
  }
  const aside = persona && PERSONA_ASIDE?.[persona] ? freshLine(s, PERSONA_ASIDE[persona], {}) : null;
  events.push({ type: "dramaResolved", id: ev.id, choice: ch.id, say: sayText, fx: summary, goto: goto && ev.nodes[goto] ? goto : null, later: later || null, rolled, aside });
  return { ok: true };
}
export { LEVELS, STOCK_IDS, PHASES, engineFlag };
