// Nhật Ký Làm Chủ (DRAMA.md §6, chép core/journal.js của Tiệm Bánh Mì): câu chốt ngày kiểu meme theo dữ kiện ngày (cộng dồn các ca,
// core/reviews.js onShiftEnd) + nội dung thẻ 1080×1350 (ui/journal.js vẽ lên journal-card.webp khi có, không thì nền canvas dự phòng).
// Câu trả lời review nổi nhất ngày (lên mạng / dính phốt) hoặc đổi tính ≥ 3 lần thay câu chốt (recaption), kể cả khi trả lời sau lúc chốt ngày.
// Thuần: test kiểm câu chọn đúng tình huống, đủ biến, thẻ đủ dòng. Mọi câu chọn qua freshLine.
import { CAPTIONS } from "../data/lines-journal.js?v=c9";
import { CAPTIONS_PERSONA, CAPTIONS_REPLY, PERSONAS } from "../data/lines-reply.js?v=c9";
import { freshLine } from "./text.js?v=c9";
import { int } from "./rng.js?v=c9";

const PLAIN = new Set(["good", "few", "perfect"]);
const ALL = { ...CAPTIONS, replyViral: CAPTIONS_REPLY.viral, replyPhot: CAPTIONS_REPLY.phot, flip: CAPTIONS_REPLY.flip };
export const CAPTION_KINDS = Object.keys(ALL);
const big = (ms, o) => ms.some((m) => m.kind === "reply" && m.outcome === o);

/** Nhóm câu theo dữ kiện ngày (ưu tiên từ trên xuống). d = { day, tutorial, plates, profit, stars, lost, burnt, perfect, flips, washed, oops, takeaway, soldOut, followers, moments }. */
export function captionKind(d) {
  const ms = d.moments || [];
  if (d.tutorial) return "tutorial";
  if (d.profit < 0) return "loss";
  if (big(ms, "viral")) return "replyViral";
  if (big(ms, "phot")) return "replyPhot";
  if (ms.some((m) => m.kind === "moved")) return "moved"; // A: ngày lên quán
  if (ms.some((m) => m.kind === "flip")) return "flip";
  if (ms.some((m) => m.kind === "serious")) return "serious";
  if (d.lost > 1) return "lost";
  if (d.burnt >= 2) return "burnt";
  if (d.oops >= 3) return "oops";
  if (ms.some((m) => m.kind === "catering-done")) return "catering"; // A: giao trọn mâm cơm / đơn đặt
  if (ms.some((m) => m.kind === "promise")) return "promise";
  if (ms.some((m) => m.kind === "drama")) return "drama"; // B: chuyện trong ngày (s.drama.moments)
  if ((d.followers || 0) >= 30) return "viral";
  if (d.perfect >= 8 && !d.burnt) return "grill";
  if (d.soldOut > 0) return "soldOut";
  if (d.takeaway >= 3) return "takeaway";
  if (d.washed >= 12) return "wash";
  if (d.plates <= 4) return "few";
  if (d.stars >= 4.5) return "perfect";
  return "good";
}
const flipsOn = (s, day) => Math.max(3, (s.persona?.switches || []).filter((x) => x.day === day).length);
function ctxOf(s, d) {
  return {
    plates: d.plates, profit: Math.abs(Math.round(d.profit || 0)), revenue: Math.round(d.revenue || 0), stars: (d.stars || 0).toLocaleString("vi-VN", { maximumFractionDigits: 1 }),
    lost: d.lost || 0, burnt: d.burnt || 0, perfect: d.perfect || 0, flips: d.kind === "flip" ? flipsOn(s, d.day) : d.flips || 0, washed: d.washed || 0, oops: d.oops || 0,
    followers: Math.max(0, d.followers || 0), takeaway: d.takeaway || 0, day: d.day, shop: s.shopName,
  };
}
/** Câu chốt ngày: { kind, headline }. Ngày bình thường thì một nửa số lần dùng câu theo tính cách cô chủ. */
export function caption(s, d) {
  const kind = captionKind(d);
  const persona = s.persona?.id;
  const list = PLAIN.has(kind) && CAPTIONS_PERSONA[persona] && int(s, 2) === 0 ? CAPTIONS_PERSONA[persona] : ALL[kind]?.length ? ALL[kind] : ALL.good;
  return { kind, headline: freshLine(s, list, ctxOf(s, { ...d, kind })) };
}
/** Câu trả lời nổi bật (viral / phot) hoặc đổi tính sau lúc chốt ngày: thay câu chốt của thẻ ngày hôm nay (một lần mỗi ngày, viral / phot thắng flip). */
export function recaption(s, kind, moment) {
  const j = s.journal?.[0];
  if (!j || j.day !== s.day || !s.dayDone) return false;
  if (j.replyCap && (j.replyCap !== "flip" || kind === "flip")) return false;
  const list = CAPTIONS_REPLY[kind];
  if (!list) return false;
  j.headline = freshLine(s, list, ctxOf(s, { ...j, kind }));
  j.replyCap = kind; j.kind = kind === "viral" ? "replyViral" : kind === "phot" ? "replyPhot" : "flip";
  if (s.lastSummary && s.lastSummary.journalDay === s.day) s.lastSummary.headline = j.headline;
  return !!moment;
}

/** Khoảnh khắc đặt làm câu trích trên thẻ (đã xếp ở core/reviews.js). Không có thì một câu đời thường. */
export function journalMoments(j) {
  const out = (j?.moments || []).filter((m) => m.line).map((m) => ({ who: m.who || "", line: m.line, kind: m.kind }));
  if (!out.length) out.push({ who: "", line: "Một ngày bình thường ở quán: nhóm than, lật sườn, xới cơm, châm trà, tính tiền, lau bàn.", kind: "plain" });
  return out.slice(0, 8);
}
/** Nội dung thẻ: tiêu đề, tên quán (ẩn được), ngày, câu chốt, câu trích (đổi được), ba số, chân thẻ. */
export function journalCard(j, { shopName = "", hideName = false, moment = 0 } = {}) {
  const ms = journalMoments(j);
  const m = ms[((moment % ms.length) + ms.length) % ms.length];
  const k = (n) => `${n < 0 ? "−" : ""}${Math.abs(Math.round(n)).toLocaleString("vi-VN")}k`;
  return {
    brand: "Lụm Kèo", title: "Nhật Ký Làm Chủ", shop: hideName ? "" : shopName || "", day: `Ngày ${j.day}`,
    headline: j.headline || "", quote: m.line, who: m.who,
    stats: [{ label: "Dĩa bán", value: String(j.plates) }, { label: j.profit < 0 ? "Lỗ ngày" : "Lời ngày", value: k(j.profit) }, { label: "Sao", value: j.stars ? j.stars.toLocaleString("vi-VN") : "—" }],
    footer: "lumkeo.com", moments: ms.length, game: "Quán Cơm Tấm · Tập Làm Chủ",
  };
}
export { PERSONAS };
