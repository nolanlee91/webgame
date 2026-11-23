// Drama Engine Quán Cơm Tấm (docs/quan-com-tam/DRAMA.md; khung chép core/drama.js của Tiệm Bánh Mì). Thuần, RNG của ván ⇒ cùng hạt +
// cùng thao tác ⇒ cùng sự kiện. Sự kiện khai báo ở data/events*.js: điều kiện `if`, nhiều bước (goto), hên xui (roll), hẹn quay lại ngày
// sau (later → s.drama.queue), nghỉ (cooldown), ưu tiên (priority 3 = do người chơi gây ra).
// Trong ca: tối đa 1 sự kiện (+1 nếu là lỗi lên mạng do người chơi gây ra), mở bằng sh.dialog kind "event" ⇒ đồng hồ ca + bếp dừng
// (shift.tick không chạy khi có hội thoại). Không chen lúc cô chủ đang bưng dĩa / đi chợ / đang tính tiền: chờ dĩa xuống bàn rồi mới mở.
// Giữa hai ngày (nextDay): tối đa 1 sự kiện (s.drama.pending), hiện trên bảng Chuẩn bị. Mỗi lựa chọn lưu một khoảnh khắc Nhật Ký
// (s.drama.moments) + lịch sử (s.drama.history). Chạm trạng thái hệ khác chỉ qua cờ (s.flags) hoặc khoá đọc có optional chaining.
import { EVENTS, EVENT } from "../data/events.js?v=c1";
import { NPCS, npcByName } from "../data/npcs.js?v=c1";
import { ARCHETYPES } from "../data/customers.js?v=c1";
import { STOCK, GEAR, SHIFTS } from "../data/economy.js?v=c1";
import { next, int, pick, weighted } from "./rng.js?v=c1";
import { fill } from "./text.js?v=c1";
import { FLAG_DAYS, freshDrama, today, liveFlags, flagIn, flagNum, dropFlag, expireFlags, addMod, modGuests, modPatience, pruneMods } from "./flags.js?v=c1";
import { gainXp } from "./progress.js?v=c1";
import { sendAway } from "./walker.js?v=c1";

export { freshDrama };
export const DRAMA = {
  perShift: 1, viralExtra: 1, fromDay: 2, dayFromDay: 3, firstAt: [0.16, 0.42], gap: [0.25, 0.4], closeBefore: 20000, betweenDaysChance: 0.55, freshMs: 400, helperEvery: 4000,
};
export const FX_KEYS = new Set(["money", "rep", "xp", "followers", "hype", "stock", "guests", "arch", "group", "preorder", "nextGuests", "mod", "flag", "flagDays", "unflag",
  "patience", "whoPatience", "away", "coal", "smoke", "rice", "plates", "closeEarly", "pauseGuests", "freeWho", "teaAll", "cleanTables", "wash", "helper", "debt", "own",
  "decor", "catName", "moment"]);
export const IF_KEYS = new Set(["minDay", "maxDay", "minLevel", "maxLevel", "minRep", "maxRep", "minMoney", "maxMoney", "minFollowers", "minHype", "flags", "noFlags", "anyFlags",
  "flagMin", "stage", "owns", "notOwns", "chain", "sum", "debtMin",
  "kind", "phase", "fMin", "fMax", "waitingMin", "seatedMin", "freeSeats", "dirtyMin", "coalMax", "coalMin", "smokeMin", "riceCooking", "riceMax", "stockMax",
  "cleanPlatesMax", "warmMin", "hotMin", "grillMin", "archPresent", "lastServe", "statMin"]);
const SHIFT_ONLY = ["kind", "phase", "fMin", "fMax", "waitingMin", "seatedMin", "freeSeats", "dirtyMin", "coalMax", "coalMin", "smokeMin", "riceCooking", "riceMax", "stockMax",
  "cleanPlatesMax", "warmMin", "hotMin", "grillMin", "archPresent", "lastServe", "statMin"];

const groupOf = (s, gid) => s.shift?.groups.find((g) => g.id === gid) || null;
const waitingOf = (s) => (s.shift ? s.shift.groups.filter((g) => g.phase === "wait" && !g.takeaway) : []);
const seatedOf = (s) => (s.shift ? s.shift.groups.filter((g) => g.phase === "seated" && !g.paid) : []);
const hasRole = (g, r) => g.arch === r || g.members.some((m) => m.role === r);
/** Tính cách chủ quán (trả lời review, agent C) — đọc mềm, không có thì null. */
// tính cách chủ quán do phần review (C) giữ ở s.persona.id (hien | cucsuc | lay | sale)
export const personaOf = (s) => (typeof s.persona === "string" ? s.persona : s.persona?.id) ?? null;

// ---------- điều kiện ----------
export function buildCtx(s, when) {
  const sh = s.shift;
  const x = { when, day: today(s), level: s.level || 1, rep: s.rep ?? 50, money: s.money || 0, followers: s.followers || 0, hype: s.hype || 0, flags: liveFlags(s), s, sum: s.lastSummary };
  if (sh && when === "shift") {
    x.t = sh.t; x.frac = sh.t / (sh.len || 1); x.kind = sh.kind;
    x.phase = SHIFTS[sh.kind]?.phases?.[sh.phaseIdx]?.key || null;
    x.waiting = waitingOf(s); x.seated = seatedOf(s);
    const L = sh.drama?.lastServe;
    x.lastServe = L ? { ...L, age: sh.t - L.t, present: !!groupOf(s, L.gid) && groupOf(s, L.gid).phase === "seated" } : null;
  }
  return x;
}

/** Điều kiện `if` của sự kiện có thoả trong ngữ cảnh x không. */
export function meets(ifs = {}, x) {
  const s = x.s, shift = x.when === "shift";
  if (ifs.minDay && x.day < ifs.minDay) return false;
  if (ifs.maxDay && x.day > ifs.maxDay) return false;
  if (ifs.minLevel && x.level < ifs.minLevel) return false;
  if (ifs.maxLevel && x.level > ifs.maxLevel) return false;
  if (ifs.minRep !== undefined && x.rep < ifs.minRep) return false;
  if (ifs.maxRep !== undefined && x.rep > ifs.maxRep) return false;
  if (ifs.minMoney !== undefined && x.money < ifs.minMoney) return false;
  if (ifs.maxMoney !== undefined && x.money > ifs.maxMoney) return false;
  if (ifs.minFollowers && x.followers < ifs.minFollowers) return false;
  if (ifs.minHype !== undefined && x.hype < ifs.minHype) return false;
  if (ifs.flags && !ifs.flags.every((f) => flagIn(x.flags, f))) return false;
  if (ifs.noFlags && ifs.noFlags.some((f) => flagIn(x.flags, f))) return false;
  if (ifs.anyFlags && !ifs.anyFlags.some((f) => flagIn(x.flags, f))) return false;
  if (ifs.flagMin && !Object.entries(ifs.flagMin).every(([f, n]) => flagNum(s, f) >= n)) return false;
  if (ifs.stage && (s.stage || "street") !== ifs.stage) return false;
  if (ifs.owns && ![].concat(ifs.owns).some((id) => s.owned?.[id] || s.drama?.decor?.[id])) return false;
  if (ifs.notOwns && (s.owned?.[ifs.notOwns] || s.drama?.decor?.[ifs.notOwns])) return false;
  if (ifs.debtMin !== undefined && Object.values(s.drama?.debt || {}).reduce((a, b) => a + b, 0) < ifs.debtMin) return false;
  if (ifs.sum) {
    const S = x.sum, q = ifs.sum;
    if (!S) return false;
    if (q.profitMax !== undefined && !(S.profit <= q.profitMax)) return false;
    if (q.profitMin !== undefined && !(S.profit >= q.profitMin)) return false;
    if (q.starsMin !== undefined && !(S.avg >= q.starsMin)) return false;
    if (q.starsMax !== undefined && !(S.avg <= q.starsMax)) return false;
    if (q.lostMin !== undefined && !((S.lost || 0) >= q.lostMin)) return false;
    if (q.burntMin !== undefined && !((S.burnt || 0) >= q.burntMin)) return false;
    if (q.smokeMin !== undefined && !((S.smokeMax || 0) >= q.smokeMin)) return false;
    if (q.riceLeftMin !== undefined && !((S.riceLeft || 0) >= q.riceLeftMin)) return false;
    if (q.platesMin !== undefined && !((S.plates || 0) >= q.platesMin)) return false;
    if (q.mistake !== undefined && !((S.mistakes?.[q.mistake] || 0) >= (q.mistakeMin || 1))) return false;
  }
  if (!shift) return !SHIFT_ONLY.some((k) => ifs[k] !== undefined);
  const sh = s.shift;
  if (!sh) return false;
  if (ifs.kind && x.kind !== ifs.kind) return false;
  if (ifs.phase && ![].concat(ifs.phase).includes(x.phase)) return false;
  if (ifs.fMin !== undefined && x.frac < ifs.fMin) return false;
  if (ifs.fMax !== undefined && x.frac > ifs.fMax) return false;
  if (ifs.waitingMin !== undefined && x.waiting.length < ifs.waitingMin) return false;
  if (ifs.seatedMin !== undefined && x.seated.length < ifs.seatedMin) return false;
  if (ifs.freeSeats !== undefined && !sh.tables.some((t) => t.gid === null && t.state !== "dirty" && t.seats >= ifs.freeSeats)) return false;
  if (ifs.dirtyMin !== undefined && sh.tables.filter((t) => t.state === "dirty").length < ifs.dirtyMin) return false;
  if (ifs.coalMax !== undefined && !(sh.grill.coal <= ifs.coalMax)) return false;
  if (ifs.coalMin !== undefined && !(sh.grill.coal >= ifs.coalMin)) return false;
  if (ifs.smokeMin !== undefined && !(sh.grill.smoke >= ifs.smokeMin)) return false;
  if (ifs.riceCooking && !sh.rice.cooking) return false;
  if (ifs.riceMax !== undefined && sh.rice.n > ifs.riceMax) return false;
  if (ifs.stockMax && !Object.entries(ifs.stockMax).every(([id, n]) => (s.stock?.[id] || 0) <= n)) return false;
  if (ifs.cleanPlatesMax !== undefined && sh.cleanPlates > ifs.cleanPlatesMax) return false;
  if (ifs.warmMin !== undefined && sh.grill.slots.slice(4).filter(Boolean).length < ifs.warmMin) return false;
  if (ifs.hotMin !== undefined && sh.grill.slots.slice(0, 2).filter(Boolean).length < ifs.hotMin) return false;
  if (ifs.grillMin !== undefined && sh.grill.slots.filter(Boolean).length < ifs.grillMin) return false;
  if (ifs.statMin && !Object.entries(ifs.statMin).every(([k, n]) => (sh.stats?.[k] || 0) >= n)) return false;
  if (ifs.archPresent && ![...x.waiting, ...x.seated].some((g) => hasRole(g, ifs.archPresent))) return false;
  if (ifs.lastServe) {
    const L = x.lastServe, q = ifs.lastServe;
    if (!L || !L.present || L.age > (q.maxAgeMs ?? 15000)) return false;
    if (q.mistake !== undefined && !(q.mistake === "any" ? L.mistakes.length > 0 : [].concat(q.mistake).some((m) => L.mistakes.includes(m)))) return false;
    if (q.arch !== undefined && ![].concat(q.arch).includes(L.arch)) return false;
    if (q.phone && !L.phone) return false;
    if (q.clean && L.mistakes.length) return false;
  }
  return true;
}

/** Người nói: NPC (npc) hoặc khách trong cảnh (who: "waiting" | "seated" | "lastServed" | { arch }). Trả { cid } (id nhóm) hoặc { npc }. */
function speakerFor(s, ev, x, probe = false) {
  if (ev.who === "lastServed") {
    const g = x.lastServe && x.lastServe.present && groupOf(s, x.lastServe.gid);
    return g ? { cid: g.id } : null;
  }
  if (ev.who) {
    if (x.when !== "shift") return null;
    const pool = ev.who === "waiting" ? x.waiting : ev.who === "seated" ? x.seated : [...x.waiting, ...x.seated].filter((g) => hasRole(g, ev.who.arch));
    if (!pool.length) return null;
    return { cid: probe ? pool[0].id : pick(s, pool).id };
  }
  return { npc: NPCS[ev.npc] ? ev.npc : "co-ut" };
}

function eligible(s, ev, x, viaQueue) {
  if (ev.when !== x.when) return false;
  if (ev.if?.chain && !viaQueue) return false;
  const seen = s.drama.seen[ev.id];
  if (!viaQueue && seen !== undefined && (ev.once || today(s) - seen < (ev.cooldown ?? 2))) return false;
  if (viaQueue && ev.once && seen !== undefined && seen !== today(s)) return false;
  if (!meets(ev.if, x)) return false;
  return !!speakerFor(s, ev, x, true);
}

function chooseEvent(s, x, { onlyPriority = 0 } = {}) {
  const D = s.drama;
  for (let i = 0; i < D.queue.length; i++) {
    const q = D.queue[i], ev = EVENT[q.id];
    if (!ev || q.day > today(s) || ev.when !== x.when || (ev.priority || 1) < onlyPriority) continue;
    if (eligible(s, ev, x, true)) { D.queue.splice(i, 1); return ev; }
  }
  let list = EVENTS.filter((ev) => (ev.priority || 1) >= onlyPriority && eligible(s, ev, x, false));
  if (!list.length) return null;
  // cứ ba sự kiện có ít nhất một chuyện vui
  if (D.recent.length >= 2 && D.recent.slice(-2).every((t) => t !== "good")) {
    const good = list.filter((ev) => ev.tone === "good");
    if (good.length) list = good;
  }
  // ưu tiên sự cố do người chơi gây ra
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
    const g = d.cid !== null ? groupOf(s, d.cid) : null;
    if (g) g.say = { text: textOf(s, d, nodeOf(s, ev, "start").line), at: sh.t, who: 0 };
  } else s.drama.pending = d;
  return d;
}

/** Node có câu mở theo cờ (alt: cái khớp đầu tiên thắng). */
export function nodeOf(s, ev, id) {
  const n = ev?.nodes?.[id];
  if (!n || !n.alt) return n;
  const fl = liveFlags(s);
  const a = n.alt.find((x) => (x.flags || []).every((f) => flagIn(fl, f)));
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
  if (!s.drama) s.drama = freshDrama();
  if (s.shift && !s.shift.drama) startDrama(s, { quiet: true });
  const x = buildCtx(s, when);
  if (!speakerFor(s, ev, x, true)) return { err: "no-speaker" };
  open(s, ev, x);
  return { ok: true };
}

// ---------- khách thêm vào lịch ca ----------
const maxSeats = (sh) => Math.max(1, ...sh.tables.map((t) => t.seats));
function rolesFor(s, arch, sh, n = null) {
  const A = ARCHETYPES[arch] || ARCHETYPES.student;
  const size = A.takeaway ? 1 : Math.max(1, Math.min(maxSeats(sh), n ?? A.size[0] + int(s, Math.max(1, Math.min(2, A.size[1] - A.size[0] + 1)))));
  const rs = [arch];
  for (let i = 1; i < size; i++) rs.push(A.mates.length ? A.mates[int(s, A.mates.length)] : arch);
  return rs;
}
const safeArch = (s, a) => (ARCHETYPES[a]?.takeaway && !s.owned?.["takeaway-shelf"] ? "office" : ARCHETYPES[a] ? a : "student");
function pushGuest(s, arch, at, extra = {}) {
  const sh = s.shift;
  arch = safeArch(s, arch);
  const roles = extra.roles ? extra.roles.slice(0, maxSeats(sh)) : rolesFor(s, arch, sh);
  sh.schedule.push({ at: Math.round(at), arch, roles, patienceMul: extra.patienceMul || 1, ...(extra.tag ? { tag: extra.tag } : {}) });
}
const randomArch = (s) => pick(s, ["student", "worker", "office", "driver", "worker2", "nurse"]);

/** Gọi khi mở ca (sau khi s.shift được tạo). Áp khách dồn từ sự kiện giữa hai ca, mod có hạn, đơn đặt trước của hôm nay. */
export function startDrama(s, { quiet = false } = {}) {
  const sh = s.shift;
  if (!s.drama) s.drama = freshDrama();
  const D = s.drama;
  sh.drama = { count: 0, max: sh.tutorial || s.day < DRAMA.fromDay ? 0 : DRAMA.perShift, nextAt: Math.round(sh.len * (DRAMA.firstAt[0] + next(s) * (DRAMA.firstAt[1] - DRAMA.firstAt[0]))), lastServe: null, watch: [], helperUntil: 0, helperAt: 0 };
  if (quiet) return;
  D.pending = null; // sự kiện giữa hai ngày chưa chọn thì bỏ qua (không bao giờ kẹt mở quán)
  if (sh.tutorial) return;
  const len = sh.len;
  const spread = (i, n) => len * (0.12 + (0.6 * (i + 0.5)) / Math.max(1, n));
  const extra = Math.max(-4, Math.min(8, D.nextGuests || 0));
  const mg = modGuests(s);
  const total = extra + mg.total;
  if (total > 0) for (let i = 0; i < total; i++) pushGuest(s, randomArch(s), spread(i, total));
  // bớt khách: chỉ khách thường (không nhãn: khách quay lại, đặt trước, khách nhờ review…), bớt từ cuối lịch
  if (total < 0) { const drop = sh.schedule.filter((g) => !g.done && !g.tag).slice(total); for (const g of drop) g.done = true; }
  const arch = { ...D.nextArch };
  for (const [a, n] of Object.entries(mg.byArch)) arch[a] = (arch[a] || 0) + n;
  for (const [a, n] of Object.entries(arch)) for (let i = 0; i < Math.min(6, n); i++) pushGuest(s, a, spread(i, n) + 3000);
  D.nextGuests = 0; D.nextArch = {};
  const pm = modPatience(s);
  if (pm) for (const g of sh.schedule) g.patienceMul = Math.max(0.5, (g.patienceMul || 1) * (1 + pm / 100));
  // đơn đặt trước của hôm nay: thành các nhóm khách có nhãn, giao đủ thì đặt cờ + hẹn
  for (const p of (D.pre || []).filter((p) => p.day === today(s) && p.kind === sh.kind)) startPre(s, p);
  D.pre = (D.pre || []).filter((p) => !(p.day === today(s) && p.kind === sh.kind) && p.day >= today(s));
  sh.schedule.sort((a, b) => a.at - b.at);
}
function startPre(s, p) {
  const sh = s.shift, seats = maxSeats(sh);
  const groups = Math.max(1, Math.min(4, Math.ceil(p.n / seats)));
  const tag = `dr:${p.id}`;
  for (let i = 0; i < groups; i++) {
    const n = Math.min(seats, Math.ceil(p.n / groups));
    pushGuest(s, p.arch || "office", sh.len * (p.at ?? 0.2) + i * 7000, { roles: rolesFor(s, safeArch(s, p.arch || "office"), sh, n), patienceMul: 1.4, tag });
  }
  sh.drama.watch.push({ tag, left: groups, stars: [], tip: p.tip || 0, flagOk: p.flagOk || null, laterOk: p.laterOk || null, okStars: p.okStars ?? 4, label: p.label || "" });
}

/** Gọi cuối mỗi nhịp ca (shift.tick). events = sự kiện của nhịp này. */
export function maybeTrigger(s, events) {
  const sh = s.shift;
  if (!sh) return;
  if (!sh.drama) startDrama(s, { quiet: true });
  const dr = sh.drama;
  // ghi lại dĩa vừa xuống bàn (cho lỗi lên mạng) + theo dõi nhóm có nhãn (đơn nhiều phần, đặt trước)
  for (const e of events) {
    if (e.type === "delivered" && e.tid) {
      const g = groupOf(s, e.gid);
      if (g) dr.lastServe = { gid: g.id, t: sh.t, mistakes: e.mistakes || [], arch: g.arch, tid: e.tid, phone: ["reviewer", "student", "student2", "office", "tourist"].some((r) => hasRole(g, r)) };
    }
    if (e.type === "noTea") {
      const g = groupOf(s, e.gid);
      if (g && g.phase === "seated") dr.lastServe = { gid: g.id, t: sh.t, mistakes: ["noTea"], arch: g.arch, tid: g.table, phone: ["reviewer", "student", "student2", "office", "tourist"].some((r) => hasRole(g, r)) };
    }
    if (e.type === "groupDone") {
      const g = groupOf(s, e.gid);
      const w = g?.tag && dr.watch.find((x) => x.tag === g.tag);
      if (w) {
        w.stars.push(e.stars); w.left--;
        if (w.left <= 0) {
          const avg = w.stars.reduce((a, b) => a + b, 0) / w.stars.length;
          if (avg >= w.okStars) {
            if (w.tip) { s.money += w.tip; sh.stats.revenue += w.tip; }
            if (w.flagOk) s.drama.flags[w.flagOk] = today(s) + FLAG_DAYS + 2;
            if (w.laterOk && EVENT[w.laterOk.id]) s.drama.queue.push({ id: w.laterOk.id, day: today(s) + (w.laterOk.days ?? 1), from: w.tag });
            events.push({ type: "say", text: `${w.label || "Đơn nhiều phần"}: giao trọn, khách hài lòng${w.tip ? ` (+${w.tip}k tip)` : ""}.`, kind: "good" });
          }
          dr.watch = dr.watch.filter((x) => x !== w);
        }
      }
    }
  }
  // bàn bên cạnh dơ lâu (lỗi bàn dơ): ghi một lần mỗi nhóm
  for (const g of sh.groups) if (g.phase === "seated" && !g.paid && !g.dramaDirty && g.members.some((m) => m.dirty)) {
    g.dramaDirty = true;
    dr.lastServe = { gid: g.id, t: sh.t, mistakes: ["dirtyTable"], arch: g.arch, tid: g.table, phone: ["reviewer", "student", "student2", "office", "tourist"].some((r) => hasRole(g, r)) };
  }
  // người phụ tạm (Mẹ, Cô Út…): mỗi 4 giây dọn một bàn dơ hoặc rửa 2 dĩa
  if (dr.helperUntil > sh.t && sh.t - dr.helperAt >= DRAMA.helperEvery) {
    dr.helperAt = sh.t;
    const t = sh.tables.find((x) => x.state === "dirty" && x.gid === null);
    if (t) { sh.dirty += t.plates || 0; t.plates = 0; t.state = "clean"; t.dirtyT = null; events.push({ type: "cleaned", tid: t.id, plates: 0, dirtyMs: 0, by: "helper" }); }
    else if (sh.dirty > 0) { const n = Math.min(2, sh.dirty); sh.dirty -= n; sh.cleanPlates += n; sh.stats.washed += n; }
  }
  if (sh.dialog || sh.tutorial || sh.closed || sh.owner.away || sh.billing) return;
  const o = sh.owner;
  if (o.task?.kind === "deliver" || o.queue.some((q) => q.kind === "deliver")) return; // chờ dĩa xuống bàn
  if (sh.t > sh.len - DRAMA.closeBefore) return;
  const viral = dr.count >= dr.max && dr.count < dr.max + DRAMA.viralExtra && dr.max > 0;
  if (dr.count >= dr.max && !viral) return;
  const x = buildCtx(s, "shift");
  const fresh = x.lastServe && x.lastServe.age < DRAMA.freshMs && x.lastServe.mistakes.length > 0;
  if (viral && !fresh) return;
  if (sh.t < dr.nextAt && !fresh) return;
  const ev = chooseEvent(s, x, { onlyPriority: viral || (fresh && sh.t < dr.nextAt) ? 3 : 0 });
  if (!ev) { if (!fresh) dr.nextAt = sh.t + 5000; return; }
  open(s, ev, x);
  dr.nextAt = sh.t + Math.round(sh.len * (DRAMA.gap[0] + next(s) * (DRAMA.gap[1] - DRAMA.gap[0])));
  events.push({ type: "drama", id: ev.id });
}

/** Gọi trong nextDay (s.day đã là ngày mới): hết hạn cờ / mod, chọn sự kiện giữa hai ngày (hiện trên bảng Chuẩn bị). */
export function endDrama(s, events = []) {
  if (!s.drama) s.drama = freshDrama();
  const D = s.drama, t = today(s);
  expireFlags(s); pruneMods(s);
  D.queue = D.queue.filter((q) => q.day + FLAG_DAYS + 5 >= t && EVENT[q.id]);
  D.pending = null;
  // cờ Drama tự đặt theo ca vừa chốt (hôm qua lỗ, khói cao / cháy nhiều, cơm dư)
  const S = s.lastSummary;
  if (S) {
    if (S.profit < 0) D.flags["lo-hom-qua"] = t;
    if ((S.smokeMax || 0) >= 70 || (S.burnt || 0) >= 3) D.flags["khoi-cao"] = t + 1;
    if ((S.riceLeft || 0) >= 3) D.flags["com-du"] = t;
  }
  if (t < DRAMA.dayFromDay) return;
  const x = buildCtx(s, "day");
  const due = D.queue.some((q) => q.day <= t && EVENT[q.id]?.when === "day");
  if (!due && next(s) > DRAMA.betweenDaysChance) return;
  const ev = chooseEvent(s, x);
  if (ev) { open(s, ev, x); events.push({ type: "dramaDay", id: ev.id }); }
}

// ---------- hội thoại ----------
export const currentEvent = (s) => (s.shift ? (s.shift.dialog?.kind === "event" ? s.shift.dialog : null) : s.drama?.pending || null);

export function textCtx(s, d) {
  const debt = Object.values(s.drama?.debt || {}).reduce((a, b) => a + b, 0);
  const base = { shop: s.shopName || "quán", day: today(s), followers: s.followers || 0, debt, catName: s.drama?.catName || "Vàng" };
  const g = d.cid !== null && d.cid !== undefined ? groupOf(s, d.cid) : null;
  if (g) { const m = g.members[0]; return { ...base, self: m.self, call: m.call, name: m.name, n: g.size }; }
  const n = NPCS[d.npc] || NPCS["co-ut"];
  return { ...base, name: n.name, self: n.self, call: n.call, n: 1 };
}
export const textOf = (s, d, tpl) => fill(tpl || "", textCtx(s, d));
export const byPersona = (s, map, base) => (personaOf(s) && map?.[personaOf(s)]) || base;
/** Ai đang nói (UI chân dung): { name, npc?, role, mono? }. Khách trong cảnh trùng tên NPC (neo đầu tên) thì dùng chân dung NPC. */
export function speakerInfo(s, d) {
  if (d.cid !== null && d.cid !== undefined) {
    const g = groupOf(s, d.cid), m = g?.members[0];
    return { name: m?.name || "Khách", role: m?.role || g?.arch || "student", npc: npcByName(m?.name), cid: d.cid };
  }
  const n = NPCS[d.npc] || NPCS["co-ut"];
  return { name: n.name, npc: d.npc, role: n.role, mono: !!n.mono };
}

/** Lựa chọn có hiện không (need.flags / noFlags / stage / level ẩn hẳn). */
export function choiceVisible(s, ch) {
  const n = ch.need;
  if (!n) return true;
  const fl = liveFlags(s);
  if (n.flags && !n.flags.every((f) => flagIn(fl, f))) return false;
  if (n.noFlags && n.noFlags.some((f) => flagIn(fl, f))) return false;
  if (n.stage && (s.stage || "street") !== n.stage) return false;
  if (n.minLevel && (s.level || 1) < n.minLevel) return false;
  return true;
}
/** Lựa chọn làm được không (đủ tiền / hàng / dĩa / người chờ). */
export function affordable(s, ch) {
  if (!choiceVisible(s, ch)) return false;
  const fx = ch.fx || {};
  if (fx.money < 0 && (s.money || 0) < -fx.money) return false;
  for (const [id, n] of Object.entries(fx.stock || {})) if (n < 0 && (s.stock?.[id] || 0) < -n) return false;
  if (fx.rice < 0 && s.shift && s.shift.rice.n < -fx.rice) return false;
  const n = ch.need || {};
  if (n.waitingMin && waitingOf(s).length < n.waitingMin) return false;
  if (n.owns && !(s.owned?.[n.owns] || s.drama?.decor?.[n.owns])) return false;
  return true;
}
export const isFree = (ch) => !(ch.need && (ch.need.owns || ch.need.waitingMin)) && !((ch.fx?.money || 0) < 0) && !Object.values(ch.fx?.stock || {}).some((n) => n < 0)
  && !((ch.fx?.rice || 0) < 0) && !(ch.need?.flags || ch.need?.minLevel || ch.need?.stage);
export const visibleChoices = (s, node) => node.choices.filter((ch) => choiceVisible(s, ch));
/** Bot / test: id một lựa chọn bấm được ở bước hiện tại (rnd() chọn ngẫu nhiên, không đụng RNG ván). */
export function pickFree(s, rnd = Math.random) {
  const d = currentEvent(s);
  const node = d && EVENT[d.id]?.nodes[d.node];
  if (!node) return null;
  const ok = node.choices.filter((ch) => affordable(s, ch));
  return (ok[Math.floor(rnd() * ok.length)] || ok[0] || node.choices[0]).id;
}

/** Chữ mô tả hậu quả (hiện sau khi chọn). */
export function fxSummary(fx = {}, later = null) {
  const out = [];
  const sign = (n) => (n > 0 ? "+" : "−") + Math.abs(n);
  const sec = (ms) => Math.round(Math.abs(ms) / 1000);
  if (fx.money) out.push(`${sign(fx.money)}k`);
  if (fx.rep) out.push(`Danh tiếng ${sign(fx.rep)}`);
  if (fx.followers) out.push(`${sign(fx.followers)} người theo dõi`);
  if (fx.hype) out.push(fx.hype > 0 ? "Quán hot lên" : "Bớt hot");
  if (fx.xp) out.push(`+${fx.xp} XP`);
  for (const [id, n] of Object.entries(fx.stock || {})) out.push(`${sign(n)} ${STOCK[id]?.name || id}`);
  if (fx.patience) out.push(fx.patience > 0 ? `Khách chờ thêm ${sec(fx.patience)} giây` : `Khách bớt kiên nhẫn ${sec(fx.patience)} giây`);
  if (fx.whoPatience) out.push(fx.whoPatience > 0 ? `Bàn này chờ thêm ${sec(fx.whoPatience)} giây` : `Bàn này bớt kiên nhẫn ${sec(fx.whoPatience)} giây`);
  if (fx.away) out.push(`Cô chủ rời quán ${sec(fx.away)} giây (bếp vẫn chạy)`);
  if (fx.coal) out.push(fx.coal > 0 ? `Than +${fx.coal}` : `Than ${fx.coal}`);
  if (fx.smoke) out.push(fx.smoke > 0 ? `Khói +${fx.smoke}` : `Khói ${fx.smoke}`);
  if (fx.rice) out.push(`${sign(fx.rice)} phần cơm trong nồi`);
  if (fx.plates) out.push(fx.plates < 0 ? `Mất ${-fx.plates} dĩa` : `+${fx.plates} dĩa`);
  if (fx.guests) out.push(`${sign(fx.guests)} khách`);
  if (fx.arch) out.push(`+${fx.arch.n} nhóm ${ARCHETYPES[fx.arch.arch]?.label.toLocaleLowerCase("vi") || "khách"}`);
  if (fx.group) out.push(`Bàn ${fx.group.roles.length} người tới${fx.group.tip ? `, đúng hết +${fx.group.tip}k` : ""}`);
  if (fx.preorder) out.push(`Đơn đặt trước ${fx.preorder.n} phần${fx.preorder.label ? ` (${fx.preorder.label})` : ""}`);
  if (fx.nextGuests) out.push(`Ca sau ${sign(fx.nextGuests)} khách`);
  if (fx.mod) out.push(`Hiệu lực ${fx.mod.days ?? 1} ngày`);
  if (fx.closeEarly) out.push("Không nhận thêm khách");
  if (fx.pauseGuests) out.push(`Khách mới chờ ${sec(fx.pauseGuests)} giây`);
  if (fx.freeWho) out.push("Bàn này quán mời");
  if (fx.teaAll) out.push("Châm trà mọi bàn");
  if (fx.cleanTables) out.push("Dọn sạch bàn dơ");
  if (fx.wash) out.push(`Rửa ${fx.wash} dĩa`);
  if (fx.helper) out.push(`Có người phụ ${sec(fx.helper)} giây`);
  if (fx.debt) out.push(fx.debt.k >= 0 ? `Ghi sổ +${fx.debt.k}k` : `Trả nợ ${-fx.debt.k}k`);
  if (fx.own) out.push(`Có ${GEAR[fx.own]?.name || fx.own}`);
  if (fx.decor) out.push("Thêm đồ trang trí");
  if (later) out.push(later.days > 0 ? "Chờ đến ngày sau…" : "Chuyện chưa hết…");
  return out;
}

function applyFx(s, d, fx, events) {
  const sh = s.shift, D = s.drama;
  const who = d.cid !== null && d.cid !== undefined && sh ? groupOf(s, d.cid) : null;
  if (fx.money) {
    const k = Math.round(fx.money);
    if (k < 0) s.money = Math.max(0, s.money - Math.min(-k, s.money)); else s.money += k;
    if (sh) sh.stats.revenue += k > 0 ? k : 0;
    if (sh && k < 0) sh.stats.wasteCost += Math.min(-k, 9999);
  }
  if (fx.rep) s.rep = Math.max(0, Math.min(100, (s.rep ?? 50) + fx.rep));
  if (fx.followers) s.followers = Math.max(0, (s.followers || 0) + fx.followers);
  if (fx.hype) s.hype = Math.max(0, Math.min(20, (s.hype || 0) + fx.hype));
  if (fx.xp) gainXp(s, fx.xp, events);
  for (const [id, n] of Object.entries(fx.stock || {})) if (STOCK[id]) s.stock[id] = Math.max(0, (s.stock[id] || 0) + Math.round(n));
  const days = fx.flagDays ?? FLAG_DAYS;
  for (const f of fx.flag ? [].concat(fx.flag) : []) D.flags[f] = today(s) + days;
  for (const f of fx.unflag ? [].concat(fx.unflag) : []) dropFlag(s, f);
  if (fx.nextGuests) D.nextGuests = Math.max(-4, Math.min(8, (D.nextGuests || 0) + fx.nextGuests));
  if (fx.mod) addMod(s, fx.mod);
  if (fx.own && GEAR[fx.own] && !GEAR[fx.own].repeat) s.owned[fx.own] = true;
  if (fx.decor) D.decor[fx.decor] = true;
  if (fx.debt) { const k = fx.debt.who || "khach"; D.debt[k] = Math.max(0, (D.debt[k] || 0) + (fx.debt.k || 0)); if (!D.debt[k]) delete D.debt[k]; if (fx.debt.clear) delete D.debt[k]; }
  if (fx.catName && !D.catName) D.catName = pick(s, ["Vàng", "Mỡ Hành", "Sườn", "Than", "Cơm Cháy", "Bì"]);
  if (fx.preorder) {
    const p = fx.preorder;
    D.pre.push({ id: p.id || d.id, day: today(s) + (p.days ?? (sh ? 1 : 0)), kind: p.kind || "toi", n: p.n, arch: p.arch || "office", label: p.label || "", tip: p.tip || 0, flagOk: p.flagOk || null,
      laterOk: p.laterOk || null, okStars: p.okStars ?? 4, at: p.at ?? 0.2 });
    if (p.flag) D.flags[p.flag] = today(s) + (p.days ?? 1) + 1;
  }
  if (!sh) {
    // sự kiện giữa hai ngày: khách thêm dồn sang ca tới
    if (fx.guests) D.nextGuests = Math.max(-4, Math.min(8, (D.nextGuests || 0) + fx.guests));
    if (fx.arch) D.nextArch[fx.arch.arch] = (D.nextArch[fx.arch.arch] || 0) + fx.arch.n;
    if (fx.group) D.pre.push({ id: d.id, day: today(s), kind: "toi", n: fx.group.roles.length, arch: fx.group.roles[0], label: fx.group.label || "", tip: fx.group.tip || 0, flagOk: fx.group.flagOk || null, laterOk: fx.group.laterOk || null, okStars: fx.group.okStars ?? 3, at: 0.3 });
    return;
  }
  const t = sh.t;
  if (fx.patience) for (const g of [...waitingOf(s), ...seatedOf(s)]) g.patienceMs = Math.max(5000, g.patienceMs + fx.patience);
  if (fx.whoPatience && who) who.patienceMs = Math.max(5000, who.patienceMs + fx.whoPatience);
  if (fx.away) sendAway(s, "event", Math.max(fx.away, (sh.owner.away?.until || 0) - t));
  if (fx.coal) sh.grill.coal = Math.max(0, Math.min(100, sh.grill.coal + fx.coal));
  if (fx.smoke) sh.grill.smoke = Math.max(0, Math.min(100, sh.grill.smoke + fx.smoke));
  if (fx.rice) sh.rice.n = Math.max(0, Math.min(40, sh.rice.n + fx.rice));
  if (fx.plates < 0) { const k = Math.min(sh.cleanPlates, -fx.plates); sh.cleanPlates -= k; s.plates -= k; }
  if (fx.plates > 0) { sh.cleanPlates += fx.plates; s.plates += fx.plates; }
  if (fx.guests > 0) for (let i = 0; i < fx.guests; i++) pushGuest(s, randomArch(s), t + 2500 + i * 6000);
  if (fx.guests < 0) { const drop = sh.schedule.filter((g) => !g.done && !g.tag && g.at > t).slice(fx.guests); for (const g of drop) g.done = true; }
  if (fx.arch) for (let i = 0; i < fx.arch.n; i++) pushGuest(s, fx.arch.arch, t + 2500 + i * 6000);
  if (fx.group) {
    const tag = `dr:${d.id}:${t}`;
    pushGuest(s, fx.group.roles[0], t + (fx.group.delay ?? 1500), { roles: fx.group.roles, patienceMul: fx.group.patienceMul || 1.3, tag });
    sh.drama.watch.push({ tag, left: 1, stars: [], tip: fx.group.tip || 0, flagOk: fx.group.flagOk || null, laterOk: fx.group.laterOk || null, okStars: fx.group.okStars ?? 4, label: fx.group.label || "" });
  }
  if (fx.closeEarly) { sh.closed = true; for (const g of sh.schedule) if (!g.done) g.done = true; }
  if (fx.pauseGuests) for (const g of sh.schedule) if (!g.done && g.at < t + fx.pauseGuests) g.at += fx.pauseGuests;
  if (fx.freeWho && who) for (const tk of sh.tickets) if (tk.gid === who.id) tk.free = true;
  if (fx.teaAll) for (const g of seatedOf(s)) for (const m of g.members) if (m.tea !== "full" && !m.eaten) {
    if ((s.stock.tra || 0) > 0) { s.stock.tra--; sh.stats.teaCost += STOCK.tra.cost; }
    m.tea = "full"; m.teaT = t; m.teaEmpty = null;
  }
  if (fx.cleanTables) for (const tb of sh.tables) if (tb.state === "dirty" && tb.gid === null) { sh.dirty += tb.plates || 0; tb.plates = 0; tb.state = "clean"; tb.dirtyT = null; }
  if (fx.wash) { const k = Math.min(fx.wash, sh.dirty); sh.dirty -= k; sh.cleanPlates += k; sh.stats.washed += k; }
  if (fx.helper) sh.drama.helperUntil = Math.max(sh.drama.helperUntil || 0, t + fx.helper);
}

/** Gộp fx chung của lựa chọn với fx của nhánh hên xui: số cộng dồn (chi phí chung + phần thắng / thua), kho cộng theo id, còn lại nhánh thắng. */
export function mergeFx(a = {}, b = {}) {
  const out = { ...a };
  for (const [k, v] of Object.entries(b || {})) {
    if (typeof v === "number" && typeof out[k] === "number" && k !== "flagDays") out[k] += v;
    else if (k === "stock" && out.stock) { out.stock = { ...out.stock }; for (const [id, n] of Object.entries(v)) out.stock[id] = (out.stock[id] || 0) + n; }
    else out[k] = v;
  }
  return out;
}
/** Người chơi chọn một lựa chọn trong hội thoại sự kiện. */
export function choose(s, choiceId, events = []) {
  const d = currentEvent(s);
  if (!d) return { err: "no-event" };
  const ev = EVENT[d.id], node = ev?.nodes[d.node];
  if (!node) return { err: "bad-event" };
  const ch = node.choices.find((c) => c.id === choiceId);
  if (!ch) return { err: "bad-choice" };
  if (!affordable(s, ch)) return { err: "cannot-afford" };
  const persona = personaOf(s);
  let said = (persona && ch.sayBy?.[persona]) || ch.say, fx = ch.fx || {}, rolled = null, goto = ch.goto, later = ch.later;
  if (ch.roll) {
    const win = next(s) < ch.roll.p;
    rolled = win ? "win" : "lose";
    const R = ch.roll[rolled] || {};
    said = (persona && R.sayBy?.[persona]) || R.say || said; fx = mergeFx(fx, R.fx);
    if (R.goto) goto = R.goto;
    if (R.later) later = R.later;
  }
  applyFx(s, d, fx, events);
  if (later && EVENT[later.id]) s.drama.queue.push({ id: later.id, day: today(s) + (later.days ?? 1), from: ev.id });
  const sayText = textOf(s, d, said);
  const momentText = fx.moment === false ? null : textOf(s, d, fx.moment || ev.moment || said);
  const speaker = speakerInfo(s, d).name;
  const entry = { day: today(s), id: ev.id, choice: ch.id, label: ch.label, line: sayText, who: speaker || "", rolled };
  s.drama.history.unshift(entry);
  s.drama.history.length = Math.min(s.drama.history.length, 40);
  if (momentText) {
    s.drama.moments = s.drama.moments || [];
    s.drama.moments.unshift({ day: today(s), id: ev.id, name: speaker || "", line: momentText });
    s.drama.moments.length = Math.min(s.drama.moments.length, 30);
  }
  const summary = fxSummary(fx, later);
  if (goto && ev.nodes[goto]) { d.node = goto; d.steps++; }
  else {
    if (s.shift?.dialog === d) s.shift.dialog = null;
    else if (s.drama.pending === d) s.drama.pending = null;
    const g = d.cid !== null && d.cid !== undefined && s.shift ? groupOf(s, d.cid) : null;
    if (g) g.say = { text: sayText, at: s.shift.t, who: 0 };
  }
  events.push({ type: "dramaResolved", id: ev.id, choice: ch.id, say: sayText, fx: summary, goto: goto && ev.nodes[goto] ? goto : null, later: later || null, rolled });
  return { ok: true };
}
