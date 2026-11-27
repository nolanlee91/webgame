// Review (chép core/reviews.js của Trà Sữa): sổ review lưu qua các ngày (s.feed), điểm đánh giá trung bình 20 review gần nhất (s.rating),
// người theo dõi (s.followers), độ hot (s.buzz, giảm một nửa mỗi ngày) ⇒ khách ca sau (trafficBonus).
// Trả lời review theo tính cách chủ tiệm (s.owner.persona, data/lines-reply.js): mỗi review trả lời một lần, mỗi tính cách 3–6 lựa chọn tuỳ sao
// và lý do review. Câu trả lời lưu nguyên văn dưới review (r.reply) kèm hậu quả (r.reply.fx) và câu đáp lại (r.reply.comeback).
// Đổi tính cách lúc nào cũng được (ngay trên bảng trả lời); đổi nhiều lần trong ngày thì cư dân mạng để ý (rep-flip, R09, câu Nhật Ký).
// Review "chay dính mặn" (lỗi 11) chỉ cho lựa chọn xin lỗi nghiêm túc (DRAMA.md §3: không đùa vào niềm tin của khách).
import { PERSONAS, REPLY_OPTIONS, REPLY_LINES, MISTAKE_TEXT, OUTCOME_LABEL, COMEBACK, FLIP_LINES, NET_HANDLES, NET_REVIEW, RETURN_LINES, CAPTIONS_REPLY } from "../data/lines-reply.js?v=b13";
import { RECIPE } from "../data/economy.js?v=b13";
import { ARCHETYPES } from "../data/customers.js?v=b13";
import { next, pick } from "./rng.js?v=b13";
import { fill, freshLine } from "./text.js?v=b13";
import { today } from "./flags.js?v=b13";
import { spend } from "./money.js?v=b13";

export const FEED_MAX = 40, RATING_N = 20;
export const FLIP_DAY = 3;
export const REAL_ERRORS = new Set(["wrongFilling", "noPate", "onionAnyway", "tooSpicy", "burnt", "soggy", "notToasted", "wrongWrap", "wrongChange", "swapped", "veganMeat",
  "timeout", "slow", "multiLate", "multiWrong", "preLate", "preShort"]);
const SLOW = new Set(["timeout", "slow", "multiLate", "preLate"]);
const UP_MULTI = new Set(["multi", "preorder"]);
export const freshOwner = () => ({ persona: null, lastPersona: null, switches: [] });

export function ratingOf(feed) {
  const r = (feed || []).slice(0, RATING_N);
  return r.length ? Math.round((r.reduce((a, x) => a + x.stars, 0) / r.length) * 10) / 10 : null;
}
/** Khách thêm ca sau nhờ review / người theo dõi / độ hot. */
export function trafficBonus(s) {
  const feed = s.feed || [];
  const r = ratingOf(feed);
  let b = 0;
  if (r !== null && feed.length >= 5) { if (r >= 4.5) b += 2; else if (r >= 4) b += 1; else if (r < 2.5) b -= 1; }
  const f = s.followers || 0;
  if (f >= 1000) b += 2; else if (f >= 200) b += 1;
  b += Math.min(3, Math.floor(s.buzz || 0));
  return Math.max(-1, Math.min(5, b));
}
/** Một review lên sổ (khách trong ca hoặc cư dân mạng), người theo dõi theo sao. */
export function pushReview(s, r) {
  s.nextReviewId = (s.nextReviewId || 0) + 1;
  const rec = { id: s.nextReviewId, day: s.shift?.day ?? today(s), name: r.name, arch: ARCHETYPES[r.arch] ? r.arch : "reviewer", stars: r.stars, line: r.line, reason: r.reason || "", recipe: r.recipe || null, src: r.src || "quan", reply: null };
  s.feed.unshift(rec);
  if (s.feed.length > FEED_MAX) s.feed.length = FEED_MAX;
  s.stats.reviews[r.stars] = (s.stats.reviews[r.stars] || 0) + 1;
  s.followers = (s.followers || 0) + (r.stars === 5 ? 3 : r.stars === 4 ? 1 : 0);
  s.rating = ratingOf(s.feed);
  return rec;
}
export const netReview = (s, r) => pushReview(s, { ...r, arch: "reviewer", reason: r.stars >= 4 ? "good" : "mang", src: "mang" });

/** Gọi trong endShift: kiểm lời hứa, giảm độ hot. */
export function archiveShift(s, sum) {
  const kept = [];
  sum.moments = sum.moments || [];
  for (const p of s.promises || []) {
    if (p.day > sum.day) { kept.push(p); continue; }
    if (sum.avg >= 4 && sum.served >= 2) {
      s.rep = Math.min(100, s.rep + 2);
      sum.moments.push({ kind: "promise", name: p.name, line: `Đã giữ lời hứa với ${p.name}: ca này ${sum.avg} sao. Danh tiếng +2.` });
    } else sum.moments.push({ kind: "promise-miss", name: p.name, line: `Hứa sửa với ${p.name} mà ca này chưa tới 4 sao. Hẹn lần sau làm kỹ hơn.` });
  }
  s.promises = kept;
  s.buzz = Math.floor(((s.buzz || 0) / 2) * 10) / 10;
}

// ---------- tính cách chủ tiệm ----------
export const personaOf = (s) => (PERSONAS[s.owner?.persona] ? s.owner.persona : null);
export const switchesOn = (s, day) => (s.owner?.switches || []).filter((x) => x.day === day).length;
function flag(s, f, days) { if (s.drama) s.drama.flags[f] = today(s) + days; }
function queueEvent(s, id, days) { if (s.drama && !s.drama.queue.some((q) => q.id === id)) s.drama.queue.push({ id, day: today(s) + days, from: "reply" }); }

export function setPersona(s, p, events) {
  if (!PERSONAS[p]) return { err: "bad-persona" };
  s.owner = s.owner || freshOwner();
  const from = personaOf(s);
  if (from === p) return { ok: true };
  s.owner.persona = p;
  let n = 0;
  if (from) {
    const d = today(s);
    s.owner.switches.push({ day: d, from, to: p });
    if (s.owner.switches.length > 20) s.owner.switches.shift();
    n = switchesOn(s, d);
    if (n === FLIP_DAY) {
      flag(s, "rep-flip", 4);
      queueEvent(s, "R09", 1);
      const line = `Một ngày đổi tính ${n} lần: ${PERSONAS[from].short} sang ${PERSONAS[p].short}. Cư dân mạng bắt đầu nghi tiệm có nhiều admin.`;
      if (s.shift) s.shift.moments.push({ kind: "flip", name: "Chủ tiệm", line });
      else if (s.lastSummary) { (s.lastSummary.moments = s.lastSummary.moments || []).push({ kind: "flip", name: "Chủ tiệm", line }); replyCaption(s, "flip", line); }
    }
  }
  events.push({ type: "persona", persona: p, from, switches: n });
  return { ok: true };
}

// ---------- lựa chọn trả lời ----------
export function topicOf(r) {
  if (r.stars >= 4) return UP_MULTI.has(r.reason) ? "multi" : "praise";
  if (r.src === "mang") return "net";
  if (SLOW.has(r.reason)) return "slow";
  if (REAL_ERRORS.has(r.reason)) return "mistake";
  return "meh";
}
export const groupOf = (topic) => (topic === "praise" || topic === "decor" || topic === "multi" ? "up" : "down");
const SERIOUS = /sorry|invite/;
export function replyOptions(s, r, persona = personaOf(s) || "hien") {
  if (!r || !REPLY_OPTIONS[persona]) return [];
  const topic = topicOf(r), g = groupOf(topic);
  let list = REPLY_OPTIONS[persona].filter((o) => o.on.some((x) => x === "all" || x === g || x === topic));
  if (r.reason === "veganMeat") { const serious = list.filter((o) => SERIOUS.test(o.id)); list = serious.length ? serious : REPLY_OPTIONS.hien.filter((o) => SERIOUS.test(o.id)); }
  return list;
}
export function linesFor(optId, topic) {
  const L = REPLY_LINES[optId] || {};
  return [...(L[topic] || []), ...(L[groupOf(topic)] || [])];
}
export const canPromise = (r, opt) => !!opt?.promise && r.stars <= 3 && REAL_ERRORS.has(r.reason);
export const canReply = (r, kind, persona = "hien") => !!r && !r.reply && replyOptions(null, r, persona).some((o) => o.id === kind);
export function optionHint(r, opt) {
  const parts = [];
  if (opt.cost) parts.push(`Tốn ${opt.cost}k`);
  parts.push(opt.hint);
  if (canPromise(r, opt)) parts.push("Hứa: ca sau ≥ 4 sao thì danh tiếng +2");
  return parts.join(" · ");
}
const fmtR = (x) => (x === null || x === undefined ? "—" : x.toLocaleString("vi-VN", { maximumFractionDigits: 1 }));
const sign = (n) => (n > 0 ? "+" : "−") + Math.abs(n);

function replyCaption(s, kind, moment) {
  const S = s.lastSummary;
  if (s.shift || !S || S.replyCap) return;
  const list = CAPTIONS_REPLY[kind];
  if (!list) return;
  S.headline = fill(pick(s, list), { loaves: S.loaves, stars: fmtR(S.avg), followers: Math.max(0, S.followersDelta || 0), flips: Math.max(FLIP_DAY, switchesOn(s, today(s))) });
  S.replyCap = kind;
  const j = s.journal?.[0];
  if (j && j.day === S.day) { j.headline = S.headline; if (moment) j.moment = moment.slice(0, 300); }
}

export function reply(s, id, kind, events) {
  const r = (s.feed || []).find((x) => x.id === id);
  if (!r) return { err: "no-review" };
  if (r.reply) return { err: "replied" };
  const persona = personaOf(s) || "hien";
  const opt = replyOptions(s, r, persona).find((o) => o.id === kind);
  if (!opt) return { err: Object.values(REPLY_OPTIONS).some((L) => L.some((o) => o.id === kind)) ? "not-eligible" : "bad-reply" };
  if (opt.cost && s.money < opt.cost) return { err: "money" };
  s.owner = s.owner || freshOwner();
  const topic = topicOf(r);
  const loaf = (RECIPE[r.recipe]?.name || "bánh mì").toLocaleLowerCase("vi");
  const ctx = { name: r.name, loaf, mistake: MISTAKE_TEXT[r.reason] || MISTAKE_TEXT.ok, shop: s.shopName, stars: r.stars };
  const text = freshLine(s, linesFor(kind, topic), ctx);
  const res = opt.out.roll ? (next(s) < opt.out.roll.p ? opt.out.roll.win : opt.out.roll.lose) : opt.out;
  const promise = canPromise(r, opt);
  const outcome = res.kind === "promise" && !promise ? "warm" : res.kind;
  const fx = res.fx || {};
  const out = [];
  const sh = s.shift;
  if (opt.cost) { spend(s, opt.cost); if (sh) sh.stats.eventCash = (sh.stats.eventCash || 0) - opt.cost; out.push(`−${opt.cost}k`); }
  if (fx.followers) { const f0 = s.followers || 0; s.followers = Math.max(0, f0 + fx.followers); out.push(`${sign(s.followers - f0 || fx.followers)} người theo dõi`); }
  if (fx.buzz) { s.buzz = Math.min(20, Math.max(0, (s.buzz || 0) + fx.buzz)); out.push(fx.buzz >= 1 ? "Tiệm hot lên" : "Tiệm hot nhẹ"); }
  if (fx.rep) { const r0 = s.rep; s.rep = Math.max(0, Math.min(100, s.rep + fx.rep)); out.push(`Danh tiếng ${sign(Math.round(s.rep - r0) || fx.rep)}`); }
  if (fx.netReview && NET_REVIEW[fx.netReview]) {
    const before = s.rating;
    const handle = pick(s, NET_HANDLES);
    pushReview(s, { name: handle, arch: "reviewer", recipe: r.recipe, stars: fx.netReview, line: freshLine(s, NET_REVIEW[fx.netReview], ctx), reason: fx.netReview >= 4 ? "good" : "phot", src: "mang" });
    out.push(`${handle} chấm ${fx.netReview} sao · đánh giá ${fmtR(before)} → ${fmtR(s.rating)}`);
  }
  if (fx.guests && s.drama) { s.drama.nextGuests = Math.max(-4, Math.min(8, (s.drama.nextGuests || 0) + fx.guests)); out.push(`Ca sau +${fx.guests} khách`); }
  if (fx.demand && s.drama && RECIPE[r.recipe]) { s.drama.demand = r.recipe; out.push(`Ca sau nhiều người gọi ${loaf}`); }
  if (fx.back && r.src !== "mang" && ARCHETYPES[r.arch]) {
    s.returning = (s.returning || []).filter((g) => g.name !== r.name);
    s.returning.push({ name: r.name, arch: r.arch, recipe: RECIPE[r.recipe] ? r.recipe : "pate-bo", persona, day: sh ? s.day + 1 : s.day });
    if (s.returning.length > 6) s.returning.shift();
    out.push(`${r.name} quay lại ca sau`);
  }
  if (promise) { s.promises = s.promises || []; s.promises.push({ day: sh ? s.day + 1 : s.day, name: r.name, reviewId: id }); out.push("Hứa: ca sau trung bình ≥ 4 sao thì danh tiếng +2"); }
  for (const f of [].concat(fx.flag || [])) flag(s, f, 4);
  if (persona === "cucsuc") flag(s, "rep-cuc", 3);
  if (persona === "sale" && outcome !== "promise") flag(s, "rep-sale", 3);
  if (fx.event) { queueEvent(s, fx.event.id, fx.event.days ?? 1); out.push("Chuyện còn tiếp ở ca sau…"); }
  if (!out.length) out.push("Khách đã đọc");
  const comeback = [];
  const C = COMEBACK[outcome];
  const isNet = r.src === "mang";
  if (C && next(s) < 0.8) comeback.push({ who: r.name, line: freshLine(s, C.reviewer, ctx), net: isNet });
  const last = s.owner.lastPersona;
  if (last && last !== persona && PERSONAS[last] && next(s) < 0.7) {
    comeback.push({ who: pick(s, NET_HANDLES), line: freshLine(s, FLIP_LINES, { from: PERSONAS[last].short.toLocaleLowerCase("vi"), to: PERSONAS[persona].short.toLocaleLowerCase("vi") }), net: true, flip: true });
  } else if (C && next(s) < (outcome === "viral" || outcome === "phot" || outcome === "annoyed" ? 1 : 0.4)) {
    comeback.push({ who: pick(s, NET_HANDLES), line: freshLine(s, C.net, ctx), net: true });
  }
  s.owner.lastPersona = persona;
  r.reply = { kind, persona, text, outcome, fx: out, comeback, day: today(s) };
  const m = { kind: "reply", name: `Chủ tiệm trả lời ${r.name}`, line: text, outcome };
  if (sh) sh.moments.push(m);
  else if (s.lastSummary) (s.lastSummary.moments = s.lastSummary.moments || []).push(m);
  if (outcome === "viral" || outcome === "phot") replyCaption(s, outcome, text);
  events.push({ type: "replied", id, kind, persona, line: text, outcome, label: OUTCOME_LABEL[outcome], fx: out, comeback });
  return { ok: true };
}

/** Khách quay lại nhờ câu trả lời: gọi trong startShift, đến sớm. */
export function returningGuests(s) {
  const all = s.returning || [];
  const due = all.filter((g) => g.day <= s.day).slice(0, 3);
  s.returning = all.filter((g) => !due.includes(g));
  return due.map((g, i) => ({ at: 12000 + i * 40000, arch: ARCHETYPES[g.arch] ? g.arch : "student", name: g.name, recipe: g.recipe, tag: "back", line: freshLine(s, RETURN_LINES[g.persona] || RETURN_LINES.hien, {}) }));
}
export { PERSONAS, OUTCOME_LABEL };
