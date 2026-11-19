// Review: sổ review lưu qua các ngày (s.feed), điểm đánh giá trung bình 20 review gần nhất (s.rating) và người theo dõi (s.followers).
// Điểm đánh giá + người theo dõi + "độ hot" ngắn hạn (s.buzz, giảm một nửa mỗi ngày) đổi lượng khách ca sau (trafficBonus).
// Trả lời review: một lần cho mỗi review. Xin lỗi review có lỗi thật tạo lời hứa; ca sau giữ trung bình ≥ 4 sao mới được cộng danh tiếng.
import { REPLIES, REPLY_LINES } from "../data/lines.js?v=m34";
import { addRep } from "./shift.js?v=m34";

export const FEED_MAX = 40, RATING_N = 20;
const REAL_ERRORS = new Set(["toppingMissing", "toppingWrong", "addWrong", "sugarHigh", "sugarLow", "iceHigh", "iceLow", "slow", "timeout", "discount", "refund", "noLid", "swapped", "wrongCustomer", "wrongDrink", "sugar", "ice", "topping"]);

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

export const canReply = (r, kind) => {
  if (!r || r.reply) return false;
  if (kind === "sorry") return r.stars <= 3 && REAL_ERRORS.has(r.reason);
  if (kind === "thanks") return r.stars >= 4;
  return kind === "meme";
};

export function reply(s, id, kind, events) {
  const r = (s.feed || []).find((x) => x.id === id);
  if (!r) return { err: "no-review" };
  if (!REPLIES[kind]) return { err: "bad-reply" };
  if (r.reply) return { err: "replied" };
  if (!canReply(r, kind)) return { err: "not-eligible" };
  r.reply = kind;
  const R = REPLIES[kind];
  s.followers = (s.followers || 0) + R.followers;
  if (R.buzz) s.buzz = (s.buzz || 0) + R.buzz;
  if (kind === "sorry") { s.promises = s.promises || []; s.promises.push({ day: s.shift ? s.day + 1 : s.day, name: r.name, reviewId: id }); }
  events.push({ type: "replied", id, kind, line: REPLY_LINES[kind], followers: R.followers });
  return { ok: true };
}
