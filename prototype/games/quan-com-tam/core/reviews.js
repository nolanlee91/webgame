// Review + trả lời review theo tính cách cô chủ (M4, chép core/reviews.js của Tiệm Bánh Mì, viết lại cho cơm tấm). Thuần.
// Sổ review lưu qua các ngày (s.feed, tối đa 40), đánh giá = trung bình 20 review gần nhất (s.rating), người theo dõi (s.followers),
// độ hot (s.hype, giảm một nửa mỗi ngày) ⇒ khách ca sau (trafficBonus, thêm vào lịch khách lúc mở ca: onShiftStart).
// Lý do review (r.reason): 13 kiểu lỗi (core/score.js MISTAKES) · slow (chờ lâu / bỏ về) · soldOut · takeaway · praise · charred · egg · service · meh · net.
// Tính cách (s.persona.id: hien | cucsuc | lay | sale) chọn ở màn chào; bản lưu cũ chưa có thì hỏi một lần ở Chuẩn bị (needPersona).
// Đổi tính cách ngay trên bảng trả lời (lựa chọn đổi ngay); đổi nhiều lần trong ngày ⇒ cờ persona-flip, cư dân mạng bình luận (FLIP_LINES).
// Mỗi review trả lời một lần: 3–4 lựa chọn theo tính cách + sao + lý do; câu trả lời lưu nguyên văn dưới review (r.reply) kèm hậu quả + câu đáp lại.
// Review sườn sống / dĩa chay dính mặn (serious) chỉ cho lựa chọn xin lỗi nghiêm túc của tính cách đang chọn (không đùa, không khuyến mãi).
// Cờ dùng chung (Agent B đọc, DEV-NOTES "Cờ dùng chung"): reply-viral, reply-phot, reply-sale, persona-flip, review-1star-<lý do>.
import { PERSONAS, REPLY_OPTIONS, REPLY_LINES, MISTAKE_TEXT, OUTCOME_LABEL, COMEBACK, FLIP_LINES, NET_HANDLES, NET_REVIEW, RETURN_LINES } from "../data/lines-reply.js?v=c5";
import { SLOW_REVIEW, TAKEAWAY_REVIEW, TAKEAWAY_LOW, CHARRED_PRAISE, EGG_PRAISE, SERVICE_PRAISE } from "../data/lines-reviews-m4.js?v=c5";
import { REVIEWS } from "../data/lines-reviews.js?v=c5";
import { MISTAKE_REVIEW } from "../data/lines-mistakes.js?v=c5";
import { pool } from "../data/lines.js?v=c5";
import { DISHES } from "../data/economy.js?v=c5";
import { ARCHETYPES } from "../data/customers.js?v=c5";
import { next, pick, int } from "./rng.js?v=c5";
import { freshLine, fill } from "./text.js?v=c5";
import { MISTAKES } from "./score.js?v=c5";
import { caption, recaption } from "./journal.js?v=c5";

export const FEED_MAX = 40, RATING_N = 20, FLIP_DAY = 3;
export const SERIOUS = new Set(["raw", "veganMeat"]);
const UP = new Set(["praise", "takeaway"]);
export { PERSONAS, OUTCOME_LABEL };

// ---------- trạng thái (state.js gọi) ----------
export const freshPersona = () => ({ id: null, last: null, switches: [], asked: false });
/** Khoá trạng thái của phần review / Nhật Ký (createState). */
export const freshSocial = () => ({ persona: freshPersona(), followers: 0, hype: 0, nextGuests: 0, promises: [], returning: [], journal: [], dayLog: null });

const obj = (v) => !!v && typeof v === "object" && !Array.isArray(v);
const arr = (v) => (Array.isArray(v) ? v : []);
const num = (v, lo, hi, d) => (typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d);
const int2 = (v, lo, hi, d) => Math.floor(num(v, lo, hi, d));
const str = (v, max, d = "") => (typeof v === "string" ? v.slice(0, max) : d);
const BIG = 1e9;
const loadMoment = (m) => ({ kind: str(m.kind, 20, "note"), who: str(m.who, 60), line: str(m.line, 300), ...(typeof m.outcome === "string" ? { outcome: m.outcome.slice(0, 12) } : {}) });

/** Đọc + kẹp phần review / Nhật Ký của bản lưu (bản cũ chưa có ⇒ mặc định an toàn; chưa có tính cách ⇒ sẽ được hỏi một lần). */
export function loadSocial(s, d) {
  const p = obj(d.persona) ? d.persona : {};
  s.persona = { id: PERSONAS[p.id] ? p.id : null, last: PERSONAS[p.last] ? p.last : null, asked: p.asked === true,
    switches: arr(p.switches).filter((x) => obj(x) && PERSONAS[x.to]).slice(-20).map((x) => ({ day: int2(x.day, 0, BIG, 1), from: PERSONAS[x.from] ? x.from : null, to: x.to })) };
  s.followers = int2(d.followers, 0, BIG, 0);
  s.hype = num(d.hype, 0, 20, 0);
  s.nextGuests = int2(d.nextGuests, -4, 8, 0);
  s.promises = arr(d.promises).filter(obj).slice(-10).map((x) => ({ day: int2(x.day, 0, BIG, 1), name: str(x.name, 40, "Khách"), reviewId: int2(x.reviewId, 0, BIG, 0) }));
  s.returning = arr(d.returning).filter((g) => obj(g) && ARCHETYPES[g.arch] && !ARCHETYPES[g.arch].takeaway).slice(-6)
    .map((g) => ({ name: str(g.name, 40, "Khách"), arch: g.arch, persona: PERSONAS[g.persona] ? g.persona : "hien", day: int2(g.day, 0, BIG, 0) }));
  s.journal = arr(d.journal).filter(obj).slice(0, 30).map((j) => ({ day: int2(j.day, 0, BIG, 1), kind: str(j.kind, 20, "good"), headline: str(j.headline, 300),
    plates: int2(j.plates, 0, BIG, 0), profit: num(j.profit, -BIG, BIG, 0), revenue: num(j.revenue, 0, BIG, 0), stars: num(j.stars, 0, 5, 0), followers: int2(j.followers, 0, BIG, 0),
    moments: arr(j.moments).filter(obj).slice(0, 10).map(loadMoment), replyCap: typeof j.replyCap === "string" ? j.replyCap.slice(0, 12) : null }));
  const L = obj(d.dayLog) ? d.dayLog : null;
  s.dayLog = L && Number.isInteger(L.day) ? { ...freshDayLog(L.day, int2(L.followers0, 0, BIG, 0)), ...Object.fromEntries(DAY_NUMS.map((k) => [k, num(L[k], -BIG, BIG, 0)])), moments: arr(L.moments).filter(obj).slice(-30).map(loadMoment) } : null;
  // review: giữ lý do, nguồn, câu trả lời (state.js đọc phần chung: tên, vai, sao, câu, lỗi, món)
  const raw = arr(d.feed).filter(obj).slice(0, 40);
  s.feed.forEach((r, i) => {
    const x = raw[i] || {};
    if (x.takeaway === true) r.takeaway = true;
    if (x.soldOut === true) r.soldOut = true;
    if (typeof x.timeout === "string") r.timeout = x.timeout.slice(0, 10);
    r.src = x.src === "mang" ? "mang" : "quan";
    r.reason = str(x.reason, 20) || reasonOf(r);
    r.reply = loadReply(x.reply);
  });
}
function loadReply(x) {
  if (!obj(x) || typeof x.text !== "string") return null;
  return { kind: str(x.kind, 30, "legacy"), persona: PERSONAS[x.persona] ? x.persona : "hien", text: x.text.slice(0, 400), outcome: OUTCOME_LABEL[x.outcome] ? x.outcome : "warm",
    fx: arr(x.fx).filter((f) => typeof f === "string").slice(0, 8).map((f) => f.slice(0, 120)),
    comeback: arr(x.comeback).filter((c) => obj(c) && typeof c.line === "string").slice(0, 3).map((c) => ({ who: str(c.who, 40, "Cư dân mạng"), line: c.line.slice(0, 300), net: c.net === true, flip: c.flip === true })),
    day: int2(x.day, 0, BIG, 1) };
}

// ---------- đánh giá, người theo dõi, khách ca sau ----------
export function ratingOf(feed) {
  const r = (feed || []).slice(0, RATING_N);
  return r.length ? Math.round((r.reduce((a, x) => a + x.stars, 0) / r.length) * 100) / 100 : null;
}
/** Khách thêm (hoặc bớt) ca sau nhờ review / người theo dõi / độ hot: −1..+5 người. */
export function trafficBonus(s) {
  const feed = s.feed || [];
  const r = ratingOf(feed);
  let b = 0;
  if (r !== null && feed.length >= 5) { if (r >= 4.5) b += 2; else if (r >= 4) b += 1; else if (r < 2.5) b -= 1; }
  const f = s.followers || 0;
  if (f >= 1000) b += 2; else if (f >= 200) b += 1;
  b += Math.min(3, Math.floor(s.hype || 0));
  return Math.max(-1, Math.min(5, b));
}
export function setFlag(s, name, value) { s.flags = s.flags || {}; s.flags[name] = value; }

/** Lý do của một review đã có (bản lưu cũ / review chưa ghi lý do). */
export function reasonOf(r) {
  if (r.src === "mang") return "net";
  if (r.mistake && MISTAKES[r.mistake]) return r.mistake;
  if (r.timeout) return "slow";
  if (r.soldOut) return "soldOut";
  if (r.takeaway && r.stars >= 4) return "takeaway";
  return r.stars >= 4 ? "praise" : "meh";
}
/**
 * Pool câu review theo lý do (tables.js finalizeGroup). worst = lỗi nặng nhất, st = sao, role = vai, opt = { takeaway, slow, quirks, service }.
 * Trả { lines, reason }.
 */
export function reviewPool(worst, st, role, { takeaway = false, slow = false, quirks = [], service = false } = {}) {
  if (worst && st <= 4) return { lines: pool(MISTAKE_REVIEW[worst], role), reason: worst };
  if (takeaway) return st >= 4 ? { lines: [...TAKEAWAY_REVIEW[st], ...pool(REVIEWS[st], role)], reason: "takeaway" } : { lines: TAKEAWAY_LOW, reason: "takeaway" };
  if (slow && st <= 3) return { lines: pool(SLOW_REVIEW, role), reason: "slow" };
  if (st === 5 && quirks.includes("chayCanh")) return { lines: CHARRED_PRAISE, reason: "charred" };
  if (st === 5 && quirks.includes("longDao")) return { lines: EGG_PRAISE, reason: "egg" };
  if (st === 5 && service) return { lines: [...SERVICE_PRAISE, ...pool(REVIEWS[5], role)], reason: "service" };
  return { lines: pool(REVIEWS[st], role), reason: st >= 4 ? "praise" : "meh" };
}

/** Một review lên sổ (khách trong ca hoặc cư dân mạng). Thay addReview cũ của tables.js. */
export function pushReview(s, r) {
  const id = s.nextReviewId++;
  const rec = { ...r, id, day: s.day, src: r.src || "quan", reply: null };
  rec.reason = r.reason || reasonOf(rec);
  s.feed.unshift(rec);
  if (s.feed.length > FEED_MAX) s.feed.length = FEED_MAX;
  s.stats.reviews[r.stars] = (s.stats.reviews[r.stars] || 0) + 1;
  s.followers = (s.followers || 0) + (r.stars === 5 ? 3 : r.stars === 4 ? 1 : 0);
  s.rating = ratingOf(s.feed);
  if (s.shift && rec.src === "quan") s.shift.stats.reviews += 1;
  if (r.stars === 1) setFlag(s, `review-1star-${rec.reason}`, s.day);
  return rec;
}

// ---------- tính cách ----------
export const personaOf = (s) => (PERSONAS[s.persona?.id] ? s.persona.id : null);
export const needPersona = (s) => !!s.introSeen && !personaOf(s);
export const switchesOn = (s, day) => (s.persona?.switches || []).filter((x) => x.day === day).length;

export function setPersona(s, p, ev = []) {
  if (!PERSONAS[p]) return { err: "bad-persona" };
  s.persona = s.persona || freshPersona();
  const from = personaOf(s);
  s.persona.asked = true;
  if (from === p) return { ok: true };
  s.persona.id = p;
  let n = 0;
  if (from) {
    const d = s.day;
    s.persona.switches.push({ day: d, from, to: p });
    if (s.persona.switches.length > 20) s.persona.switches.shift();
    n = switchesOn(s, d);
    setFlag(s, "persona-flip", n);
    if (n === FLIP_DAY) {
      const line = `Một ngày đổi tính ${n} lần: ${PERSONAS[from].short} sang ${PERSONAS[p].short}. Cư dân mạng bắt đầu nghi quán có nhiều admin.`;
      dayMoment(s, { kind: "flip", who: "Cô chủ", line });
      recaption(s, "flip", line);
    }
  }
  ev.push({ type: "persona", persona: p, from, switches: n });
  return { ok: true };
}

// ---------- lựa chọn trả lời ----------
export function topicOf(r) {
  if (SERIOUS.has(r.reason) || SERIOUS.has(r.mistake)) return "serious";
  if (r.src === "mang") return r.stars >= 4 ? "praise" : "net";
  if (r.stars >= 5 || (r.stars >= 4 && !MISTAKES[r.reason])) return r.reason === "takeaway" ? "takeaway" : "praise";
  if (MISTAKES[r.reason]) return "mistake";
  if (r.reason === "slow") return "slow";
  return "meh";
}
export const groupOf = (topic) => (topic === "serious" ? "serious" : UP.has(topic) ? "up" : "down");
export function replyOptions(s, r, persona = (s && personaOf(s)) || "hien") {
  if (!r || !REPLY_OPTIONS[persona]) return [];
  const topic = topicOf(r), g = groupOf(topic);
  return REPLY_OPTIONS[persona].filter((o) => o.on.some((x) => (x === "all" && g !== "serious") || x === g || x === topic));
}
/** Câu cho một lựa chọn: câu riêng theo lý do + theo chủ đề + chung theo nhóm (serious chỉ câu serious). */
export function linesFor(optId, r) {
  const L = REPLY_LINES[optId] || {};
  const topic = topicOf(r), g = groupOf(topic);
  if (g === "serious") return [...(L.serious || [])];
  return [...(L[r.reason] || []), ...(topic !== g ? L[topic] || [] : []), ...(L[g] || [])];
}
export const canPromise = (r, opt) => !!opt?.promise && r.stars <= 3 && (!!MISTAKES[r.reason] || r.reason === "slow");
export function optionHint(r, opt) {
  const parts = [opt.hint];
  if (canPromise(r, opt) && opt.out.kind !== "promise" && opt.out.kind !== "serious") parts.push("Hứa: ca sau ≥ 4 sao thì danh tiếng +2");
  return parts.join(" · ");
}
const fmtR = (x) => (x === null || x === undefined ? "—" : x.toLocaleString("vi-VN", { maximumFractionDigits: 1 }));
const sign = (n) => (n > 0 ? "+" : "−") + Math.abs(n);
const dishName = (r) => (DISHES[r.dish]?.name || "cơm tấm").toLocaleLowerCase("vi");
const laterDay = (s) => (s.shift || s.dayDone ? s.day + 1 : s.day);

export function reply(s, id, kind, ev = []) {
  const idx = (s.feed || []).findIndex((x) => x.id === id);
  if (idx < 0) return { err: "no-review" };
  const r = s.feed[idx];
  if (r.reply) return { err: "replied" };
  const persona = personaOf(s) || "hien";
  const opt = replyOptions(s, r, persona).find((o) => o.id === kind);
  if (!opt) return { err: Object.values(REPLY_OPTIONS).some((L) => L.some((o) => o.id === kind)) ? "not-eligible" : "bad-reply" };
  if (opt.cost && s.money < opt.cost) return { err: "money" };
  s.persona = s.persona || freshPersona();
  const topic = topicOf(r);
  const ctx = { name: r.name, dish: dishName(r), mistake: MISTAKE_TEXT[r.reason] || MISTAKE_TEXT[topic] || MISTAKE_TEXT.ok, shop: s.shopName, stars: r.stars };
  const text = freshLine(s, linesFor(kind, r), ctx);
  const res = opt.out.roll ? (next(s) < opt.out.roll.p ? opt.out.roll.win : opt.out.roll.lose) : opt.out;
  const promise = canPromise(r, opt);
  const outcome = res.kind === "promise" && !promise ? "warm" : res.kind;
  const fx = res.fx || {};
  const out = [];
  if (opt.cost) { s.money -= opt.cost; out.push(`−${opt.cost}k`); }
  if (fx.followers) { const f0 = s.followers || 0; s.followers = Math.max(0, f0 + fx.followers); out.push(`${sign(s.followers - f0 || fx.followers)} người theo dõi`); }
  if (fx.hype) { s.hype = Math.min(20, Math.max(0, (s.hype || 0) + fx.hype)); out.push(fx.hype >= 1 ? "Quán hot lên" : fx.hype > 0 ? "Quán hot nhẹ" : "Độ hot giảm"); }
  if (fx.rep) { const r0 = s.rep; s.rep = Math.max(0, Math.min(100, s.rep + fx.rep)); out.push(`Danh tiếng ${sign(Math.round(s.rep - r0) || fx.rep)}`); }
  if (fx.netReview && NET_REVIEW[fx.netReview]) {
    const before = s.rating;
    const handle = pick(s, NET_HANDLES);
    pushReview(s, { name: handle, role: "reviewer", stars: fx.netReview, line: freshLine(s, NET_REVIEW[fx.netReview], ctx), mistake: null, src: "mang", reason: "net" });
    out.push(`${handle} chấm ${fx.netReview} sao · đánh giá ${fmtR(before)} → ${fmtR(s.rating)}`);
  }
  if (fx.guests) { s.nextGuests = Math.max(-4, Math.min(8, (s.nextGuests || 0) + fx.guests)); out.push(`Ca sau +${fx.guests} khách`); }
  if (fx.back && r.src !== "mang" && ARCHETYPES[r.role] && !ARCHETYPES[r.role].takeaway) {
    s.returning = (s.returning || []).filter((g) => g.name !== r.name);
    s.returning.push({ name: r.name, arch: r.role, persona, day: laterDay(s) });
    if (s.returning.length > 6) s.returning.shift();
    out.push(`${r.name} quay lại ca sau`);
  }
  if (promise) { s.promises = s.promises || []; s.promises.push({ day: laterDay(s), name: r.name, reviewId: id }); if (s.promises.length > 10) s.promises.shift(); out.push("Hứa: ngày sau trung bình ≥ 4 sao thì danh tiếng +2"); }
  if (outcome === "viral") setFlag(s, "reply-viral", s.day);
  if (outcome === "phot") setFlag(s, "reply-phot", s.day);
  if (persona === "sale") setFlag(s, "reply-sale", s.day);
  if (!out.length) out.push("Khách đã đọc");
  const comeback = [];
  const C = COMEBACK[outcome];
  if (C && next(s) < 0.8) comeback.push({ who: r.name, line: freshLine(s, C.reviewer, ctx), net: r.src === "mang", flip: false });
  const last = s.persona.last;
  if (last && last !== persona && PERSONAS[last] && next(s) < 0.7) {
    comeback.push({ who: pick(s, NET_HANDLES), line: freshLine(s, FLIP_LINES, { from: PERSONAS[last].short.toLocaleLowerCase("vi"), to: PERSONAS[persona].short.toLocaleLowerCase("vi") }), net: true, flip: true });
  } else if (C && next(s) < (outcome === "viral" || outcome === "phot" || outcome === "annoyed" ? 1 : 0.4)) {
    comeback.push({ who: pick(s, NET_HANDLES), line: freshLine(s, C.net, ctx), net: true, flip: false });
  }
  s.persona.last = persona;
  // sổ review chép nông trong apply ⇒ thay phần tử, không sửa object cũ
  const i2 = s.feed.findIndex((x) => x.id === id);
  s.feed[i2] = { ...r, reply: { kind, persona, text, outcome, fx: out, comeback, day: s.day } };
  dayMoment(s, { kind: outcome === "serious" ? "serious" : "reply", who: `Cô chủ trả lời ${r.name}`, line: text, outcome });
  if (outcome === "viral" || outcome === "phot") recaption(s, outcome, text);
  ev.push({ type: "replied", id, kind, persona, line: text, outcome, label: OUTCOME_LABEL[outcome], fx: out, comeback });
  return { ok: true };
}

// ---------- nhật ký trong ngày (cộng dồn hai ca) ----------
const DAY_NUMS = ["plates", "profit", "revenue", "starsSum", "starsN", "lost", "burnt", "perfect", "flips", "washed", "oops", "takeaway", "soldOut", "shifts"];
export function freshDayLog(day, followers0 = 0) { return { day, followers0, ...Object.fromEntries(DAY_NUMS.map((k) => [k, 0])), moments: [] }; }
export function dayLog(s) {
  if (!s.dayLog || s.dayLog.day !== s.day) s.dayLog = freshDayLog(s.day, s.followers || 0);
  return s.dayLog;
}
export function dayMoment(s, m) {
  const L = dayLog(s);
  L.moments.push(m);
  if (L.moments.length > 30) L.moments.shift();
  const j = s.journal?.[0];
  if (j && j.day === s.day && s.dayDone && m.line) { j.moments = [m, ...(j.moments || [])].slice(0, 10); }
}

/** Mở ca (shift.js startShift): khách thêm nhờ review / độ hot + khách quay lại nhờ câu trả lời, xếp vào lịch khách. */
export function onShiftStart(s) {
  const sh = s.shift;
  if (!sh) return;
  dayLog(s);
  sh.feedFrom = s.nextReviewId;
  if (sh.tutorial) return;
  const sched = sh.schedule;
  let k = trafficBonus(s) + (s.nextGuests || 0);
  s.nextGuests = 0;
  const singles = sched.filter((g) => g.roles.length === 1 && !ARCHETYPES[g.arch]?.takeaway);
  const base = singles.length ? singles : sched.filter((g) => !ARCHETYPES[g.arch]?.takeaway);
  if (k > 0 && base.length) for (let i = 0; i < k; i++) { const e = base[int(s, base.length)]; sched.push({ at: Math.round(sh.len * (0.08 + next(s) * 0.6)), arch: e.arch, roles: [e.arch], patienceMul: 1, tag: "buzz" }); }
  else if (k < 0) { const plain = singles.filter((g) => !g.tag); for (let i = 0; i < -k && plain.length > 1; i++) { const e = plain.splice(1 + int(s, plain.length - 1), 1)[0]; sched.splice(sched.indexOf(e), 1); } } // chỉ bớt khách thường (không bỏ khách có nhãn của A)
  const due = (s.returning || []).filter((g) => g.day <= s.day && ARCHETYPES[g.arch] && ARCHETYPES[g.arch].unlock <= s.level).slice(0, 3);
  s.returning = (s.returning || []).filter((g) => !due.includes(g));
  due.forEach((g, i) => {
    const A = ARCHETYPES[g.arch];
    sched.push({ at: Math.round(sh.len * (0.05 + i * 0.12)), arch: g.arch, roles: [g.arch], patienceMul: 1.2, tag: "back", name: g.name,
      line: freshLine(s, RETURN_LINES[g.persona] || RETURN_LINES.hien, { self: A.self, call: A.call }) });
  });
  sched.sort((a, b) => a.at - b.at);
}

/** Chốt ca (shift.js endShift, trước khi bỏ s.shift): cộng dồn ngày; ca cuối ngày ⇒ giữ lời hứa, giảm độ hot, câu chốt ngày + Nhật Ký. */
export function onShiftEnd(s, S, sh, lastOfDay) {
  const L = dayLog(s);
  const st = sh.stats;
  L.plates += S.plates; L.profit += S.profit; L.revenue += S.revenue; L.lost += S.lost; L.burnt += S.burnt; L.perfect += S.perfectFlips; L.flips += S.flips;
  L.washed += S.washed; L.takeaway += S.takeaway || 0; L.soldOut += S.soldOut || 0; L.shifts++;
  L.oops += Object.values(S.mistakes || {}).reduce((a, b) => a + b, 0);
  L.starsSum += st.stars.reduce((a, b) => a + b, 0); L.starsN += st.stars.length;
  const mine = s.feed.filter((r) => r.id >= (sh.feedFrom ?? 0) && r.src === "quan");
  if (mine.length) {
    const best = mine.reduce((a, r) => (r.stars > a.stars ? r : a), mine[0]);
    const worst = mine.reduce((a, r) => (r.stars < a.stars ? r : a), mine[0]);
    if (best.stars >= 4) L.moments.push({ kind: "best", who: best.name, line: best.line });
    if (worst.stars <= 2 && worst !== best) L.moments.push({ kind: "worst", who: worst.name, line: worst.line });
    for (const r of mine) if (SERIOUS.has(r.reason)) { L.moments.push({ kind: "serious", who: r.name, line: r.line }); break; }
  }
  if (L.moments.length > 30) L.moments.splice(0, L.moments.length - 30);
  if (!lastOfDay) return;
  // B: khoảnh khắc Drama của hôm nay (s.drama.moments) cũng vào Nhật Ký
  for (const m of (s.drama?.moments || []).filter((x) => x.day === s.day && x.line).slice(0, 3)) if (!L.moments.some((x) => x.line === m.line)) L.moments.push({ kind: "drama", who: m.name || "", line: m.line });
  const avg = L.starsN ? Math.round((L.starsSum / L.starsN) * 10) / 10 : 0;
  // lời hứa (từ câu trả lời xin lỗi): ngày tới hạn trung bình ≥ 4 sao, phục vụ ≥ 2 khách ⇒ danh tiếng +2
  const kept = [];
  for (const p of s.promises || []) {
    if (p.day > s.day) { kept.push(p); continue; }
    if (avg >= 4 && L.starsN >= 2) { s.rep = Math.min(100, s.rep + 2); L.moments.push({ kind: "promise", who: p.name, line: `Đã giữ lời hứa với ${p.name}: hôm nay ${avg} sao. Danh tiếng +2.` }); }
    else L.moments.push({ kind: "promise-miss", who: p.name, line: `Hứa sửa với ${p.name} mà hôm nay chưa tới 4 sao. Hẹn lần sau làm kỹ hơn.` });
  }
  s.promises = kept;
  s.hype = Math.floor(((s.hype || 0) / 2) * 10) / 10;
  const day = { day: s.day, tutorial: !!S.tutorial, plates: L.plates, profit: Math.round(L.profit), revenue: Math.round(L.revenue), stars: avg, lost: L.lost, burnt: L.burnt,
    perfect: L.perfect, flips: L.flips, washed: L.washed, oops: L.oops, takeaway: L.takeaway, soldOut: L.soldOut, followers: Math.max(0, (s.followers || 0) - L.followers0), moments: L.moments.slice() };
  const { kind, headline } = caption(s, day);
  const entry = { day: s.day, kind, headline, plates: day.plates, profit: day.profit, revenue: day.revenue, stars: avg, followers: day.followers, moments: pickMoments(L.moments), replyCap: null };
  s.journal = [entry, ...(s.journal || []).filter((j) => j.day !== s.day)].slice(0, 30);
  S.headline = headline;
  S.journalDay = s.day;
}
/** Khoảnh khắc lưu vào Nhật Ký (câu trả lời nổi / phốt trước, rồi câu xin lỗi nghiêm túc, lời hứa, review hay / tệ nhất). */
const RANK = { reply: 1, moved: 1, serious: 2, flip: 2, drama: 3, "catering-done": 3, promise: 3, "promise-miss": 3, "catering-late": 4, best: 4, worst: 5 }; // moved / catering: A, drama: B
function pickMoments(ms) {
  const big = (m) => m.kind === "reply" && (m.outcome === "viral" || m.outcome === "phot");
  const out = [];
  for (const m of [...ms].sort((a, b) => big(b) - big(a) || (RANK[a.kind] || 9) - (RANK[b.kind] || 9))) if (m.line && !out.some((o) => o.line === m.line)) out.push(m);
  return out.slice(0, 10);
}
/** Sang ngày mới (shift.js nextDay): cờ đổi tính đếm lại từ 0. */
export function onNewDay(s) { if (s.flags && "persona-flip" in s.flags) s.flags["persona-flip"] = 0; dayLog(s); }

export { fill };
