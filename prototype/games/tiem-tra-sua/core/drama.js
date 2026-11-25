// Drama Engine (docs/tiem-tra-sua/DRAMA.md): sự kiện có điều kiện khai báo (data/events.js), nhiều bước (goto), hậu quả ghi ngay
// và hẹn quay lại ngày sau (later → s.drama.queue). Trong ca: tối đa 1–2 sự kiện, đồng hồ dừng khi hội thoại mở (sh.dialog kind "event").
// Giữa hai ca: tối đa 1 sự kiện (s.drama.pending), hiện sau bảng chốt ca. Mỗi lựa chọn lưu một khoảnh khắc cho Nhật Ký Làm Chủ.
// Thuần, RNG của ván ⇒ cùng hạt + cùng thao tác ⇒ cùng sự kiện.
import { EVENTS, EVENT } from "../data/events.js?v=m38";
import { DRAMA, NORMAL_DAY, WALK_MS, REP_BY_STARS } from "../data/shift.js?v=m38";
import { ARCHETYPES } from "../data/customers.js?v=m38";
import { RECIPE } from "../data/recipes.js?v=m38";
import { STOCK } from "../data/ingredients.js?v=m38";
import { EQUIPMENT } from "../data/equipment.js?v=m38";
import { next, int, pick, weighted } from "./rng.js?v=m38";
import { fill } from "./text.js?v=m38";
import { gainXp, recipesAt, archetypesFor } from "./progression.js?v=m38";
import { stockUsed, capacity } from "./economy.js?v=m38";
import { owns } from "./equipment.js?v=m38";
import { customer, waiting, lineCtx, scheduleGuest, guestItem, addRep, say, freshLine } from "./shift.js?v=m38";
import { PERSONA_ASIDE } from "../data/lines-reply.js?v=m38";
import { missionsOnDrama } from "./missions.js?v=m38";
import { ratingOf } from "./reviews.js?v=m38";

export const FX_KEYS = new Set(["money", "rep", "followers", "buzz", "xp", "stock", "patience", "whoPatience", "delaySpawn", "sealMs", "guests", "group",
  "nextGuests", "demand", "flag", "unflag", "review", "kitchen", "swapTopping", "priceWho", "leaveWho", "moment"]);
export const IF_KEYS = new Set(["minDay", "minLevel", "minRep", "maxRep", "minFollowers", "flags", "noFlags", "owns", "notOwns", "waitingMin", "queueFree",
  "rush", "lastServe", "pearlsOut", "archWaiting", "lostMin", "cupsMin", "minMoney", "maxMoney", "tMin", "tMax", "reviewLow", "sum", "chain"]);
/** Cờ do chính game đặt (không cần sự kiện nào đặt): C01 làm lại ly ⇒ fix-<nhóm khách>; nhập vựa sỉ ⇒ si-mua;
 *  quảng bá ⇒ promo-<loại> (chỉ trong ngày); nhận gói ký gửi ⇒ ky-gui; trả đủ ⇒ ky-gui-xong; câu trả lời review ⇒ rep-<kết quả> (core/reviews.js). */
export const ENGINE_FLAG = /^(fix-|promo-|si-mua$|ky-gui|rep-|muon-hb$|dong-som$|het-hang$|hoi-cho|thu-thach)/; // + hội chợ / ca thử thách (core/fair.js, core/challenge.js) // + hết hàng giữa ca (core/stockout.js)
/** Đặt cờ của game (hết hạn sau `days` ngày, mặc định DRAMA.flagDays). */
export function engineFlag(s, f, days = DRAMA.flagDays) { if (s.drama) s.drama.flags[f] = s.day + days; }
export const ROLES = ["barista", "regular", "vip", "reviewer", "courier", "neighbor", "office-worker"];

export function freshDrama() {
  return { flags: {}, queue: [], seen: {}, history: [], pending: null, nextGuests: 0, demand: null, recent: [] };
}

// ---------- điều kiện ----------
const inRush = (t) => NORMAL_DAY.rushes.some((r) => t >= r && t <= r + NORMAL_DAY.rushWindow + 15000);

export function buildCtx(s, when) {
  const sh = s.shift;
  const flags = new Set(Object.keys(s.drama?.flags || {}));
  const x = { when, day: s.day, level: s.level, rep: s.rep, followers: s.followers || 0, money: s.money, flags, s, sum: s.lastSummary };
  const feed = s.feed || [];
  x.reviewLow = feed.slice(0, 6).some((r) => r.stars <= 2);
  if (sh) {
    const w = waiting(s);
    x.t = sh.t; x.waiting = w; x.waitingN = w.length; x.rush = inRush(sh.t);
    x.queueFree = sh.customers.filter((c) => c.phase !== "leave").length < 4;
    x.lost = sh.ledger.lost; x.cups = sh.ledger.cups;
    x.lastServe = sh.lastServe ? { ...sh.lastServe, age: sh.t - sh.lastServe.t, present: !!customer(s, sh.lastServe.cid) } : null;
    x.pearlsOut = sh.kitchen.ready < 1 && w.some((c) => c.items.some((it, i) => !c.filled[i] && it.order.topping === "tran-chau"));
  }
  return x;
}

/** Điều kiện `if` của sự kiện có thoả trong ngữ cảnh x không. */
export function meets(ifs = {}, x) {
  const shift = x.when === "shift";
  if (ifs.minDay && x.day < ifs.minDay) return false;
  if (ifs.minLevel && x.level < ifs.minLevel) return false;
  if (ifs.minRep !== undefined && x.rep < ifs.minRep) return false;
  if (ifs.maxRep !== undefined && x.rep > ifs.maxRep) return false;
  if (ifs.minFollowers && x.followers < ifs.minFollowers) return false;
  if (ifs.minMoney !== undefined && x.money < ifs.minMoney) return false;
  if (ifs.maxMoney !== undefined && x.money > ifs.maxMoney) return false;
  if (ifs.flags && !ifs.flags.every((f) => x.flags.has(f))) return false;
  if (ifs.noFlags && ifs.noFlags.some((f) => x.flags.has(f))) return false;
  if (ifs.owns && !(Array.isArray(ifs.owns) ? ifs.owns.some((id) => owns(x.s, id)) : owns(x.s, ifs.owns))) return false;
  if (ifs.notOwns && owns(x.s, ifs.notOwns)) return false;
  if (ifs.reviewLow && !x.reviewLow) return false;
  if (ifs.sum) {
    const S = x.sum, q = ifs.sum;
    if (!S) return false;
    if (q.lostMin !== undefined && S.lost < q.lostMin) return false;
    if (q.profitMax !== undefined && S.profit > q.profitMax) return false;
    if (q.profitMin !== undefined && S.profit < q.profitMin) return false;
    if (q.starsMin !== undefined && S.avgStars < q.starsMin) return false;
    if (q.starsMax !== undefined && S.avgStars > q.starsMax) return false;
    if (q.cupsMin !== undefined && S.cups < q.cupsMin) return false;
  }
  if (!shift) return !["waitingMin", "rush", "lastServe", "pearlsOut", "archWaiting", "lostMin", "cupsMin", "tMin", "tMax", "queueFree"].some((k) => ifs[k] !== undefined);
  if (ifs.waitingMin !== undefined && x.waitingN < ifs.waitingMin) return false;
  if (ifs.queueFree && !x.queueFree) return false;
  if (ifs.rush !== undefined && x.rush !== ifs.rush) return false;
  if (ifs.pearlsOut && !x.pearlsOut) return false;
  if (ifs.archWaiting && !x.waiting.some((c) => c.arch === ifs.archWaiting)) return false;
  if (ifs.lostMin !== undefined && x.lost < ifs.lostMin) return false;
  if (ifs.cupsMin !== undefined && x.cups < ifs.cupsMin) return false;
  if (ifs.tMin !== undefined && x.t < ifs.tMin) return false;
  if (ifs.tMax !== undefined && x.t > ifs.tMax) return false;
  if (ifs.lastServe) {
    const L = x.lastServe, q = ifs.lastServe;
    if (!L || !L.present || L.age > (q.maxAgeMs ?? 6000)) return false;
    if (q.sugar !== undefined && L.sugar !== q.sugar) return false;
    if (q.sugarOk !== undefined && L.sugarOk !== q.sugarOk) return false;
    if (q.iceOk !== undefined && L.iceOk !== q.iceOk) return false;
    if (q.minStars !== undefined && L.stars < q.minStars) return false;
    if (q.maxStars !== undefined && L.stars > q.maxStars) return false;
    if (q.arch !== undefined && L.arch !== q.arch) return false;
    if (q.notArch !== undefined && L.arch === q.notArch) return false;
    if (q.cups !== undefined && L.cups < q.cups) return false;
    if (q.topping !== undefined && L.topping !== q.topping) return false;
    if (q.outcome !== undefined && ![].concat(q.outcome).includes(L.outcome)) return false;
    if (q.mistake !== undefined && !(q.mistake === "any" ? !!L.mistake : [].concat(q.mistake).includes(L.mistake))) return false;
  }
  return true;
}

function eligible(s, ev, x, viaQueue) {
  if (ev.when !== x.when) return false;
  if (ev.if?.chain && !viaQueue) return false;
  const seen = s.drama.seen[ev.id];
  if (!viaQueue && seen !== undefined && (ev.once || s.day - seen <= (ev.cooldown ?? 2))) return false;
  if (!meets(ev.if, x)) return false;
  return !!speakerFor(s, ev, x, true);
}

/** Người nói: khách đang chờ (who) hoặc NPC cố định. */
function speakerFor(s, ev, x, probe = false) {
  if (ev.who === "lastServed") {
    const c = x.lastServe && customer(s, x.lastServe.cid);
    return c ? { cid: c.id } : null;
  }
  if (ev.who === "waiting" || ev.who?.arch) {
    if (x.when !== "shift") return null;
    const list = x.waiting.filter((c) => !ev.who.arch || c.arch === ev.who.arch);
    if (!list.length) return null;
    return { cid: probe ? list[0].id : pick(s, list).id };
  }
  return { npc: ev.npc || { role: "neighbor", name: "Hàng xóm" } };
}

function chooseEvent(s, x) {
  const D = s.drama;
  // hẹn quay lại tới hạn được ưu tiên
  for (let i = 0; i < D.queue.length; i++) {
    const q = D.queue[i], ev = EVENT[q.id];
    if (!ev || q.day > s.day || ev.when !== x.when) continue;
    if (eligible(s, ev, x, true)) { D.queue.splice(i, 1); return ev; }
  }
  let list = EVENTS.filter((ev) => eligible(s, ev, x, false));
  if (!list.length) return null;
  // mỗi nhóm ba sự kiện có ít nhất một tình huống tích cực / đời thường
  if (D.recent.length >= 2 && D.recent.slice(-2).every((t) => t !== "good")) {
    const good = list.filter((ev) => ev.tone === "good");
    if (good.length) list = good;
  }
  const top = Math.max(...list.map((ev) => ev.priority || 1));
  if (top >= 3) list = list.filter((ev) => (ev.priority || 1) >= 3); // sự cố do người chơi gây ra trước
  return weighted(s, list.map((ev) => ({ ev, w: (ev.w ?? 1) * (ev.priority || 1) }))).ev;
}

function open(s, ev, x) {
  const sp = speakerFor(s, ev, x);
  const d = { kind: "event", id: ev.id, node: "start", cid: sp.cid ?? null, npc: sp.npc || null, steps: 0 };
  s.drama.seen[ev.id] = s.day;
  s.drama.queue = s.drama.queue.filter((q) => !(q.id === ev.id && q.from === "reply")); // hẹn từ câu trả lời review: mở rồi thì thôi
  s.drama.recent.push(ev.tone === "good" ? "good" : "other");
  if (s.drama.recent.length > 6) s.drama.recent.shift();
  if (x.when === "shift") {
    const sh = s.shift;
    sh.dialog = d;
    sh.drama.count++;
    const c = d.cid !== null ? customer(s, d.cid) : null;
    if (c) { c.mood = ev.nodes.start.mood === "happy" ? "happy" : "waiting"; say(sh, c, textOf(s, d, ev.nodes.start.line)); }
  } else s.drama.pending = d;
  return d;
}

/** Kiểm tra / test: sự kiện có mở được ngay trong trạng thái này không. */
export const eligibleNow = (s, ev) => eligible(s, ev, buildCtx(s, ev.when), !!ev.if?.chain);
/** Mở thẳng một sự kiện (test, công cụ xem thử ?event=ID). Không kiểm điều kiện ngoài người nói. */
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
  sh.drama = { count: 0, max: sh.tutorial ? 0 : many ? DRAMA.perShift : DRAMA.perShiftEarly, nextAt: DRAMA.firstAt[0] + int(s, DRAMA.firstAt[1] - DRAMA.firstAt[0]), log: [] };
}

/** Gọi cuối mỗi tick (sau khi khách / bếp cập nhật). */
export function maybeTrigger(s, events) {
  const sh = s.shift;
  if (!sh || sh.dialog || !sh.drama || sh.drama.count >= sh.drama.max) return;
  if (sh.t > sh.duration - DRAMA.closeBefore) return;
  const x = buildCtx(s, "shift");
  const fresh = x.lastServe && x.lastServe.age < 300 && sh.t >= DRAMA.firstAt[0];
  if (sh.t < sh.drama.nextAt && !fresh) return;
  let ev = chooseEvent(s, x);
  if (fresh && !ev) return;
  if (!ev) { sh.drama.nextAt = sh.t + 5000; return; }
  if (fresh && sh.t < sh.drama.nextAt && !ev.if?.lastServe) return; // ngoài giờ hẹn chỉ bật sự kiện ngay sau khi giao
  open(s, ev, x);
  sh.drama.nextAt = sh.t + DRAMA.gap[0] + int(s, DRAMA.gap[1] - DRAMA.gap[0]);
  events.push({ type: "drama", id: ev.id });
}

/** Gọi trong endShift: hết hạn cờ, chọn sự kiện giữa hai ca. */
export function endDrama(s) {
  const D = s.drama;
  for (const [f, until] of Object.entries(D.flags)) if (until < s.day) delete D.flags[f];
  D.queue = D.queue.filter((q) => q.day + DRAMA.flagDays >= s.day);
  const x = buildCtx(s, "day");
  const due = D.queue.some((q) => q.day <= s.day && EVENT[q.id]?.when === "day");
  if (!due && next(s) > DRAMA.betweenDaysChance) return;
  const ev = chooseEvent(s, x);
  if (ev) open(s, ev, x);
}

// ---------- hội thoại ----------
export const currentEvent = (s) => (s.shift?.dialog?.kind === "event" ? s.shift.dialog : !s.shift ? s.drama?.pending || null : null);

export function textCtx(s, d) {
  const c = d.cid !== null ? customer(s, d.cid) : null;
  const base = { shop: s.shopName, day: s.day, followers: s.followers || 0 };
  if (c) return { ...lineCtx(c), ...base };
  const n = d.npc || {};
  return { name: n.name || "Hàng xóm", self: n.self || "em", call: n.call || "chị chủ", drink: "trà sữa", ...base };
}
export const textOf = (s, d, tpl) => fill(tpl || "", textCtx(s, d));
/** Câu theo tính cách chủ tiệm (sayBy / meBy trong data/events-reply.js), không có thì dùng câu chung. */
export const byPersona = (s, map, base) => (s.owner?.persona && map?.[s.owner.persona]) || base;

/** Lựa chọn có làm được không (đủ tiền / hàng / trân châu). Luôn có ít nhất một lựa chọn miễn phí (test kiểm). */
export function affordable(s, ch) {
  const fx = ch.fx || {};
  if (fx.money < 0 && s.money < -fx.money) return false;
  for (const [id, n] of Object.entries(fx.stock || {})) if (n < 0 && (s.stock[id] || 0) < -n) return false;
  if (fx.kitchen < 0 && (s.shift?.kitchen.ready || 0) < -fx.kitchen) return false;
  if (ch.need?.waitingMin && waiting(s).length < ch.need.waitingMin) return false;
  return true;
}

/** Danh sách chữ mô tả hậu quả (hiện ngay trên nút và sau khi chọn). */
export function fxSummary(fx = {}, later = null) {
  const out = [];
  const sign = (n) => (n > 0 ? "+" : "−") + Math.abs(n);
  if (fx.money) out.push(`${sign(fx.money)}k`);
  if (fx.rep) out.push(`Danh tiếng ${sign(fx.rep)}`);
  if (fx.followers) out.push(`${sign(fx.followers)} người theo dõi`);
  if (fx.buzz) out.push(fx.buzz > 0 ? "Tiệm hot lên" : "Bớt hot");
  if (fx.xp) out.push(`+${fx.xp} XP`);
  for (const [id, n] of Object.entries(fx.stock || {})) out.push(`${sign(n)} ${STOCK[id]?.name || id}`);
  if (fx.kitchen) out.push(`${sign(fx.kitchen)} trân châu nấu sẵn`);
  if (fx.patience) out.push(fx.patience > 0 ? `Khách chờ thêm ${Math.round(fx.patience / 1000)} giây` : `Khách bớt kiên nhẫn ${Math.round(-fx.patience / 1000)} giây`);
  if (fx.whoPatience) out.push(fx.whoPatience > 0 ? `Khách này chờ thêm ${Math.round(fx.whoPatience / 1000)} giây` : `Khách này bớt kiên nhẫn ${Math.round(-fx.whoPatience / 1000)} giây`);
  if (fx.delaySpawn) out.push(`Tạm ngưng nhận khách ${Math.round(fx.delaySpawn / 1000)} giây`);
  if (fx.sealMs) out.push(fx.sealMs > 0 ? `Mỗi ly chậm ${fx.sealMs / 1000} giây` : `Mỗi ly nhanh ${-fx.sealMs / 1000} giây`);
  if (fx.guests) out.push(`+${fx.guests} khách ngay ca này`);
  if (fx.group) out.push(`Đơn nhóm ${fx.group.cups} ly${fx.group.tip ? `, thưởng ${fx.group.tip}k nếu kịp` : ""}`);
  if (fx.nextGuests) out.push(`Ca sau ${sign(fx.nextGuests)} khách`);
  if (fx.demand) out.push("Ca sau nhiều người gọi món này");
  if (fx.review) out.push(`Review ${fx.review.stars} sao trên mạng`);
  if (fx.swapTopping) out.push("Đổi topping");
  if (fx.priceWho) out.push(`Giá ly ${sign(fx.priceWho)}k`);
  if (fx.leaveWho) out.push("Khách rời quầy");
  if (later) out.push(later.days > 0 ? "Chờ đến ca sau…" : "Chuyện chưa hết…");
  return out;
}

function applyFx(s, d, fx, events) {
  const sh = s.shift, D = s.drama;
  const who = d.cid !== null && sh ? customer(s, d.cid) : null;
  if (fx.money) { s.money = Math.max(0, s.money + fx.money); if (sh) sh.ledger.eventCash += fx.money; }
  if (fx.rep) addRep(s, fx.rep, !!sh);
  if (fx.followers) s.followers = Math.max(0, (s.followers || 0) + fx.followers);
  if (fx.buzz) s.buzz = Math.max(0, (s.buzz || 0) + fx.buzz);
  if (fx.xp) { const g = gainXp(s, fx.xp, events); if (sh) sh.xp += g; }
  for (const [id, n] of Object.entries(fx.stock || {})) {
    if (!STOCK[id]) continue;
    const add = n > 0 ? Math.min(n, Math.max(0, capacity(s) - stockUsed(s))) : n;
    s.stock[id] = Math.max(0, (s.stock[id] || 0) + add);
  }
  const flags = fx.flag ? [].concat(fx.flag) : [];
  for (const f of flags) D.flags[f] = s.day + DRAMA.flagDays;
  for (const f of fx.unflag ? [].concat(fx.unflag) : []) delete D.flags[f];
  if (fx.nextGuests) D.nextGuests = Math.max(-3, Math.min(6, (D.nextGuests || 0) + fx.nextGuests));
  if (fx.demand) D.demand = fx.demand === "who" ? who?.recipe || null : RECIPE[fx.demand] ? fx.demand : null;
  if (fx.review) {
    const r = { name: fill(fx.review.name || "{name}", textCtx(s, d)), stars: fx.review.stars, line: fill(fx.review.line, textCtx(s, d)), reason: "mang", src: "mang" };
    if (sh) {
      const rep = addRep(s, REP_BY_STARS[r.stars]);
      sh.reviews.push({ cid: 0, arch: "reviewer", recipe: who?.recipe || "tra-sua-truyen-thong", rep, ...r });
      s.stats.reviews[r.stars] = (s.stats.reviews[r.stars] || 0) + 1;
    } else {
      s.feed = s.feed || []; s.nextReviewId = s.nextReviewId || 1;
      s.feed.unshift({ id: s.nextReviewId++, day: s.day, arch: "reviewer", recipe: "tra-sua-truyen-thong", reply: null, ...r });
      s.feed.length = Math.min(s.feed.length, 40);
      s.rating = ratingOf(s.feed);
      addRep(s, REP_BY_STARS[r.stars], false);
    }
  }
  if (!sh) return;
  const t = sh.t;
  if (fx.patience) for (const c of waiting(s)) c.bonus += fx.patience;
  if (fx.whoPatience && who) who.bonus += fx.whoPatience;
  if (fx.delaySpawn) sh.mods.spawnPauseUntil = Math.max(sh.mods.spawnPauseUntil, t + fx.delaySpawn);
  if (fx.sealMs) sh.mods.sealMs += fx.sealMs;
  if (fx.kitchen) sh.kitchen.ready = Math.max(0, sh.kitchen.ready + fx.kitchen);
  const menu = recipesAt(s.level).map((r) => r.id);
  if (fx.guests) {
    const archs = archetypesFor(s);
    for (let i = 0; i < fx.guests; i++) {
      const arch = pick(s, archs);
      scheduleGuest(s, { at: t + 3000 + i * 6000, arch, name: pick(s, ARCHETYPES[arch].names), items: [guestItem(s, arch, menu)] });
    }
  }
  if (fx.group) {
    const g = fx.group, arch = g.arch || "van-phong";
    const first = guestItem(s, arch, menu, g.recipe && menu.includes(g.recipe) ? g.recipe : null);
    const items = Array.from({ length: Math.min(3, g.cups || 2) }, (_, i) => (i === 0 || g.same !== false ? { ...first } : guestItem(s, arch, menu)));
    scheduleGuest(s, { at: t + 2500, arch, name: g.name || pick(s, ARCHETYPES[arch].names), items, tag: "group", tip: g.tip || 0, line: g.line, patienceMul: g.patienceMul });
  }
  if (who) {
    if (fx.swapTopping) {
      for (let i = 0; i < who.items.length; i++) if (!who.filled[i]) who.items[i].order.topping = fx.swapTopping;
      who.order.topping = who.items[0].order.topping;
    }
    if (fx.priceWho) { who.price = Math.max(0, who.price + fx.priceWho); }
    if (fx.leaveWho) {
      who.phase = "leave"; who.leaveT = t; who.mood = "happy";
      for (const st of sh.stations) if (st.cid === who.id) { st.cid = null; st.item = null; }
    }
  }
}

/** Người chơi chọn một lựa chọn trong hội thoại sự kiện. */
export function choose(s, choiceId, events) {
  const d = currentEvent(s);
  if (!d) return { err: "no-event" };
  const ev = EVENT[d.id], node = ev?.nodes[d.node];
  if (!node) return { err: "bad-event" };
  const ch = node.choices.find((c) => c.id === choiceId);
  if (!ch) return { err: "bad-choice" };
  if (!affordable(s, ch)) return { err: "cannot-afford" };
  const persona = s.owner?.persona || null;
  let said = (persona && ch.sayBy?.[persona]) || ch.say, fx = ch.fx || {}, rolled = null;
  if (ch.roll) {
    const win = next(s) < ch.roll.p;
    rolled = win ? "win" : "lose";
    const R = ch.roll[rolled];
    said = R.say || said; fx = { ...fx, ...(R.fx || {}) };
  }
  applyFx(s, d, fx, events);
  if (ch.later) s.drama.queue.push({ id: ch.later.id, day: s.day + (ch.later.days ?? 1), from: ev.id });
  const sayText = textOf(s, d, said);
  const momentText = fx.moment === false ? null : textOf(s, d, fx.moment || said);
  const speaker = d.cid !== null ? customer(s, d.cid)?.name : textCtx(s, d).name;
  const entry = { day: s.shift?.day ?? s.day, id: ev.id, choice: ch.id, label: ch.label, line: momentText || sayText, who: speaker || "" };
  s.drama.history.unshift(entry);
  s.drama.history.length = Math.min(s.drama.history.length, 40);
  if (momentText) {
    const m = { kind: "drama", id: ev.id, name: speaker || "", line: momentText };
    if (s.shift) { s.shift.moments.push(m); s.shift.drama?.log.push(entry); }
    else if (s.lastSummary) { (s.lastSummary.moments = s.lastSummary.moments || []).push(m); (s.lastSummary.drama = s.lastSummary.drama || []).push(entry); }
  }
  const summary = fxSummary(fx, ch.later);
  if (ch.goto) { d.node = ch.goto; d.steps++; }
  else {
    if (s.shift?.dialog === d) s.shift.dialog = null;
    else if (s.drama.pending === d) s.drama.pending = null;
    missionsOnDrama(s, events);
    const c = d.cid !== null && s.shift ? customer(s, d.cid) : null;
    if (c && c.phase === "wait") { c.mood = "waiting"; s.shift && (c.say = { text: sayText, at: s.shift.t }); }
  }
  // tính cách chủ tiệm: một câu kèm theo ở bảng hậu quả (data/lines-reply.js PERSONA_ASIDE)
  const aside = persona && PERSONA_ASIDE[persona] ? freshLine(s, PERSONA_ASIDE[persona], {}) : null;
  events.push({ type: "dramaResolved", id: ev.id, choice: ch.id, say: sayText, fx: summary, goto: ch.goto || null, later: ch.later || null, rolled, aside });
  return { ok: true };
}
export { EQUIPMENT, WALK_MS, int };
