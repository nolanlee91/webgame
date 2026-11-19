// Review: sổ review lưu qua các ngày (s.feed), điểm đánh giá trung bình 20 review gần nhất (s.rating) và người theo dõi (s.followers).
// Điểm đánh giá + người theo dõi + "độ hot" ngắn hạn (s.buzz, giảm một nửa mỗi ngày) đổi lượng khách ca sau (trafficBonus).
// Trả lời review theo tính cách chủ tiệm (s.owner.persona, data/lines-reply.js): mỗi review trả lời một lần, mỗi tính cách 3–4 lựa chọn
// tuỳ sao và lý do review. Câu trả lời được lưu dưới review (r.reply.text) kèm hậu quả thấy được (r.reply.fx) và câu đáp lại (r.reply.comeback).
// Đổi tính cách lúc nào cũng được (ngay trên bảng trả lời); đổi nhiều lần trong ngày thì cư dân mạng để ý (rep-flip, R09 / R10, câu Nhật Ký).
// Xin lỗi review có lỗi thật tạo lời hứa; ca sau giữ trung bình ≥ 4 sao mới được cộng danh tiếng.
import { PERSONAS, REPLY_OPTIONS, REPLY_LINES, MISTAKE_TEXT, OUTCOME_LABEL, COMEBACK, FLIP_LINES, NET_HANDLES, NET_REVIEW, RETURN_LINES, CAPTIONS_REPLY } from "../data/lines-reply.js?v=m36";
import { RECIPE } from "../data/recipes.js?v=m36";
import { ARCHETYPES } from "../data/customers.js?v=m36";
import { addRep, freshLine } from "./shift.js?v=m36";
import { recipesAt } from "./progression.js?v=m36";
import { next, pick } from "./rng.js?v=m36";
import { fill } from "./text.js?v=m36";

export const FEED_MAX = 40, RATING_N = 20;
/** Số lần đổi tính trong một ngày để cư dân mạng bắt đầu bàn tán (cờ rep-flip, sự kiện R09, câu Nhật Ký "flip"). */
export const FLIP_DAY = 3;
export const REAL_ERRORS = new Set(["toppingMissing", "toppingWrong", "addWrong", "sugarHigh", "sugarLow", "iceHigh", "iceLow", "slow", "timeout", "discount", "refund", "noLid", "swapped", "wrongCustomer", "wrongDrink", "sugar", "ice", "topping", "multiLate", "multiWrong"]);
const SLOW = new Set(["slow", "timeout", "multiLate"]);
const UP_MULTI = new Set(["multi", "multi3", "multiSync"]);
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
  if (r !== null && feed.length >= 3) { if (r >= 4.5) b += 2; else if (r >= 4) b += 1; else if (r < 2.5) b -= 1; }
  const f = s.followers || 0;
  if (f >= 1000) b += 2; else if (f >= 200) b += 1;
  b += Math.min(3, Math.floor(s.buzz || 0));
  return Math.max(-1, Math.min(5, b));
}

/** Gọi trong endShift: chép review của ca vào sổ, người theo dõi theo sao, kiểm lời hứa, giảm độ hot. */
export function archiveShift(s, sum) {
  s.feed = s.feed || [];
  s.nextReviewId = s.nextReviewId || 1;
  const sh = s.shift;
  for (const r of sh.reviews) {
    s.feed.unshift({ id: s.nextReviewId++, day: sh.day, name: r.name, arch: r.arch, recipe: r.recipe, stars: r.stars, line: r.line, reason: r.reason, reply: null, src: r.src || "quan" });
    s.followers = (s.followers || 0) + (r.stars === 5 ? 3 : r.stars === 4 ? 1 : 0);
  }
  s.feed.length = Math.min(s.feed.length, FEED_MAX);
  s.rating = ratingOf(s.feed);
  // lời hứa sửa sai từ ca trước
  const kept = [];
  for (const p of s.promises || []) {
    if (p.day > sh.day) { kept.push(p); continue; }
    if (sum.avgStars >= 4 && sum.cups >= 2) {
      const d = addRep(s, 2, false);
      sum.moments.push({ kind: "promise", name: p.name, line: `Đã giữ lời hứa với ${p.name}: ca này ${sum.avgStars} sao. Danh tiếng +${d}.` });
    } else sum.moments.push({ kind: "promise-miss", name: p.name, line: `Hứa sửa với ${p.name} mà ca này chưa tới 4 sao. Hẹn lần sau làm tốt hơn.` });
  }
  s.promises = kept;
  s.buzz = Math.floor(((s.buzz || 0) / 2) * 10) / 10;
}

// ---------- tính cách chủ tiệm ----------
export const personaOf = (s) => (PERSONAS[s.owner?.persona] ? s.owner.persona : null);
export const switchesOn = (s, day) => (s.owner?.switches || []).filter((x) => x.day === day).length;

/** Chọn / đổi tính cách. Lúc nào cũng được; lần đầu (màn chào hoặc hỏi một lần ở Chuẩn bị ca) không tính là "đổi". */
export function setPersona(s, p, events) {
  if (!PERSONAS[p]) return { err: "bad-persona" };
  s.owner = s.owner || freshOwner();
  const from = personaOf(s);
  if (from === p) return { ok: true };
  s.owner.persona = p;
  let n = 0;
  if (from) {
    s.owner.switches.push({ day: s.day, from, to: p });
    if (s.owner.switches.length > 20) s.owner.switches.shift();
    n = switchesOn(s, s.day);
    if (n === FLIP_DAY) {
      flag(s, "rep-flip", 4);
      queueEvent(s, "R09", 1, "day");
      const line = `Một ngày đổi tính ${n} lần: ${PERSONAS[from].short} sang ${PERSONAS[p].short}. Cư dân mạng bắt đầu nghi tiệm có nhiều admin.`;
      if (s.shift) s.shift.moments.push({ kind: "flip", name: "Chủ tiệm", line });
      else if (s.lastSummary) { (s.lastSummary.moments = s.lastSummary.moments || []).push({ kind: "flip", name: "Chủ tiệm", line }); replyCaption(s, "flip", line); }
    }
  }
  events.push({ type: "persona", persona: p, from, switches: n });
  return { ok: true };
}

// ---------- lựa chọn trả lời ----------
/** Chủ đề của review: praise | decor | multi (≥ 4 sao) · mistake | slow | meh | net (≤ 3 sao). */
export function topicOf(r) {
  if (r.stars >= 4) return r.reason === "decor" ? "decor" : UP_MULTI.has(r.reason) ? "multi" : "praise";
  if (r.src === "mang") return "net";
  if (SLOW.has(r.reason)) return "slow";
  if (REAL_ERRORS.has(r.reason)) return "mistake";
  return "meh";
}
export const groupOf = (topic) => (topic === "praise" || topic === "decor" || topic === "multi" ? "up" : "down");

/** Lựa chọn trả lời của tính cách cho một review (mặc định Hiền lành khi chưa chọn). */
export function replyOptions(s, r, persona = personaOf(s) || "hien") {
  if (!r || !REPLY_OPTIONS[persona]) return [];
  const topic = topicOf(r), g = groupOf(topic);
  return REPLY_OPTIONS[persona].filter((o) => o.on.some((x) => x === "all" || x === g || x === topic));
}
/** Bảng câu cho một lựa chọn theo chủ đề review. */
export function linesFor(optId, topic) {
  const L = REPLY_LINES[optId] || {};
  return [...(L[topic] || []), ...(L[groupOf(topic)] || [])];
}
export const canPromise = (r, opt) => !!opt?.promise && r.stars <= 3 && REAL_ERRORS.has(r.reason);
export const canReply = (r, kind, persona = "hien") => !!r && !r.reply && replyOptions(null, r, persona).some((o) => o.id === kind);
/** Mô tả lựa chọn cho nút: chi phí trước, hậu quả có thể. */
export function optionHint(r, opt) {
  const parts = [];
  if (opt.cost) parts.push(`Tốn ${opt.cost}k`);
  parts.push(opt.hint);
  if (canPromise(r, opt)) parts.push("Hứa: ca sau ≥ 4 sao thì danh tiếng +2");
  return parts.join(" · ");
}

function flag(s, f, days) { if (s.drama) s.drama.flags[f] = s.day + days; }
/** Hẹn sự kiện: "days" = số ca nữa (1 = ca kế tiếp với sự kiện trong ca, tối sau ca kế tiếp với sự kiện giữa hai ca). */
function queueEvent(s, id, days, when) {
  if (!s.drama) return;
  const base = s.shift ? s.day + 1 : s.day; // ngày của ca kế tiếp
  const day = base + days - 1 + (when === "day" ? 1 : 0);
  if (!s.drama.queue.some((q) => q.id === id)) s.drama.queue.push({ id, day, from: "reply" });
}
const EVENT_WHEN = { R01: "day", R02: "shift", R03: "day", R04: "day", R05: "shift", R06: "day", R07: "day", R08: "day", R09: "day", R10: "shift" };
const fmtR = (x) => (x === null || x === undefined ? "—" : x.toLocaleString("vi-VN", { maximumFractionDigits: 1 }));
const sign = (n) => (n > 0 ? "+" : "−") + Math.abs(n);

/** Câu chốt ca Nhật Ký đổi theo câu trả lời nổi bật nhất (viral / phốt) hoặc ngày đổi tính nhiều lần. Giữa hai ca: sửa bảng chốt ca vừa xong. */
function replyCaption(s, kind, moment) {
  const S = s.lastSummary;
  if (s.shift || !S || S.replyCap) return;
  const list = CAPTIONS_REPLY[kind];
  if (!list) return;
  S.headline = fill(pick(s, list), { cups: S.cups, stars: fmtR(S.avgStars), followers: Math.max(0, S.followersDelta || 0), flips: Math.max(FLIP_DAY, switchesOn(s, s.day)) });
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
  const drink = (RECIPE[r.recipe]?.name || "trà sữa").toLocaleLowerCase("vi");
  const ctx = { name: r.name, drink, mistake: MISTAKE_TEXT[r.reason] || MISTAKE_TEXT.ok, shop: s.shopName, stars: r.stars };
  const text = freshLine(s, linesFor(kind, topic), ctx);
  const res = opt.out.roll ? (next(s) < opt.out.roll.p ? opt.out.roll.win : opt.out.roll.lose) : opt.out;
  const promise = canPromise(r, opt);
  const outcome = res.kind === "promise" && !promise ? "warm" : res.kind;
  const fx = res.fx || {};
  const out = []; // hậu quả thấy được
  const sh = s.shift;
  if (opt.cost) { s.money -= opt.cost; if (sh) sh.ledger.eventCash -= opt.cost; out.push(`−${opt.cost}k`); }
  if (fx.followers) { const f0 = s.followers || 0; s.followers = Math.max(0, f0 + fx.followers); out.push(`${sign(s.followers - f0 || fx.followers)} người theo dõi`); }
  if (fx.buzz) { s.buzz = Math.min(20, Math.max(0, (s.buzz || 0) + fx.buzz)); out.push(fx.buzz >= 1 ? "Tiệm hot lên" : "Tiệm hot nhẹ"); }
  if (fx.rep) { const d = addRep(s, fx.rep, !!sh); out.push(`Danh tiếng ${d ? sign(d) : "giữ nguyên (đã chạm trần ca)"}`); }
  if (fx.netReview && NET_REVIEW[fx.netReview]) {
    const before = s.rating;
    const handle = pick(s, NET_HANDLES);
    s.nextReviewId = Math.max(s.nextReviewId || 1, ...s.feed.map((x) => x.id + 1));
    const nr = { id: s.nextReviewId++, day: sh ? sh.day : s.day, name: handle, arch: "reviewer", recipe: RECIPE[r.recipe] ? r.recipe : "tra-sua-truyen-thong", stars: fx.netReview,
      line: freshLine(s, NET_REVIEW[fx.netReview], ctx), reason: fx.netReview >= 4 ? "good" : "phot", reply: null, src: "mang" };
    s.feed.unshift(nr);
    s.feed.length = Math.min(s.feed.length, FEED_MAX);
    s.rating = ratingOf(s.feed);
    out.push(`${handle} chấm ${fx.netReview} sao · đánh giá ${fmtR(before)} → ${fmtR(s.rating)}`);
  }
  if (fx.guests && s.drama) { s.drama.nextGuests = Math.max(-3, Math.min(6, (s.drama.nextGuests || 0) + fx.guests)); out.push(`Ca sau +${fx.guests} khách`); }
  if (fx.demand && s.drama && RECIPE[r.recipe]) { s.drama.demand = r.recipe; out.push(`Ca sau nhiều người gọi ${drink}`); }
  if (fx.back && r.src !== "mang" && ARCHETYPES[r.arch]) {
    s.returning = (s.returning || []).filter((g) => g.name !== r.name);
    s.returning.push({ name: r.name, arch: r.arch, recipe: r.recipe, persona, day: sh ? s.day + 1 : s.day });
    if (s.returning.length > 6) s.returning.shift();
    out.push(`${r.name} quay lại ca sau`);
  }
  if (promise) { s.promises = s.promises || []; s.promises.push({ day: sh ? s.day + 1 : s.day, name: r.name, reviewId: id }); out.push("Hứa: ca sau trung bình ≥ 4 sao thì danh tiếng +2"); }
  for (const f of [].concat(fx.flag || [])) flag(s, f, 4);
  if (persona === "cucsuc") flag(s, "rep-cuc", 3);
  if (fx.event) { queueEvent(s, fx.event.id, fx.event.days, EVENT_WHEN[fx.event.id]); out.push("Chuyện còn tiếp ở ca sau…"); }
  if (!out.length) out.push("Khách đã đọc");
  // câu đáp lại: người viết review, đôi khi cư dân mạng (để ý cả chuyện chủ tiệm đổi tính)
  const comeback = [];
  const C = COMEBACK[outcome];
  const isNet = r.src === "mang";
  if (C && next(s) < 0.8) comeback.push({ who: r.name, line: freshLine(s, C.reviewer, ctx), net: isNet });
  const last = s.owner.lastPersona;
  if (last && last !== persona && PERSONAS[last] && next(s) < 0.7) {
    const pool = FLIP_LINES.filter((t) => last === "hien" || !/cục bột/.test(t));
    comeback.push({ who: pick(s, NET_HANDLES), line: freshLine(s, pool, { from: PERSONAS[last].short.toLocaleLowerCase("vi"), to: PERSONAS[persona].short.toLocaleLowerCase("vi") }), net: true, flip: true });
  } else if (C && next(s) < (outcome === "viral" || outcome === "phot" || outcome === "annoyed" ? 1 : 0.4)) {
    comeback.push({ who: pick(s, NET_HANDLES), line: freshLine(s, C.net, ctx), net: true });
  }
  s.owner.lastPersona = persona;
  r.reply = { kind, persona, text, outcome, fx: out, comeback, day: sh ? sh.day : s.day };
  // Nhật Ký: câu trả lời là khoảnh khắc; câu nổi nhất / tệ nhất ngày thành câu chốt ca
  const m = { kind: "reply", name: `Chủ tiệm trả lời ${r.name}`, line: text, outcome };
  if (sh) sh.moments.push(m);
  else if (s.lastSummary) (s.lastSummary.moments = s.lastSummary.moments || []).push(m);
  if (outcome === "viral" || outcome === "phot") replyCaption(s, outcome, text);
  events.push({ type: "replied", id, kind, persona, line: text, outcome, label: OUTCOME_LABEL[outcome], fx: out, comeback });
  return { ok: true };
}

/** Khách quay lại nhờ câu trả lời: gọi trong startShift (ca thường), đến sớm, tip 3k nếu ly ≥ 3 sao. */
export function returningGuests(s, duration) {
  const all = s.returning || [];
  const due = all.filter((g) => g.day <= s.day).slice(0, 3);
  s.returning = all.filter((g) => !due.includes(g));
  const menu = recipesAt(s.level).map((r) => r.id);
  return due.map((g, i) => {
    const rid = menu.includes(g.recipe) ? g.recipe : menu[0];
    const R = RECIPE[rid];
    return { at: 9000 + i * Math.floor(duration / 5), arch: ARCHETYPES[g.arch] ? g.arch : "hoc-sinh", name: g.name, items: [{ recipe: rid, sugar: R.sugar, ice: R.ice }],
      tag: "back", tip: 3, line: freshLine(s, RETURN_LINES[g.persona] || RETURN_LINES.hien, {}) };
  });
}
export { PERSONAS, OUTCOME_LABEL };
