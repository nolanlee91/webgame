// Nhật Ký Làm Chủ: câu chốt ca kiểu meme (theo dữ kiện ca) và nội dung thẻ chia sẻ 1080×1350 (ui/journal.js vẽ lên journal-card.png).
// Thuần: test kiểm câu chọn đúng tình huống và nội dung thẻ đủ dòng.
import { CAPTIONS as BASE_CAPTIONS } from "../data/lines.js?v=m37";
import { CAPTIONS_M3 } from "../data/lines-m3.js?v=m37";
import { CAPTIONS_PERSONA, CAPTIONS_REPLY } from "../data/lines-reply.js?v=m37";
import { CAPTIONS_STOCKOUT } from "../data/lines-stockout.js?v=m37";
import { STOCK } from "../data/ingredients.js?v=m37";
import { CAPTIONS_FAIR, CAPTIONS_CHALLENGE } from "../data/lines-m5.js?v=m37";

const CAPTIONS = { ...BASE_CAPTIONS, missions: CAPTIONS_M3.missions, multi: [...BASE_CAPTIONS.multi, ...CAPTIONS_M3.multi],
  replyViral: CAPTIONS_REPLY.viral, replyPhot: CAPTIONS_REPLY.phot, flip: CAPTIONS_REPLY.flip,
  closed: CAPTIONS_STOCKOUT.closed, ran: CAPTIONS_STOCKOUT.ran, fair: CAPTIONS_FAIR, challengeWin: CAPTIONS_CHALLENGE.win, challengeLose: CAPTIONS_CHALLENGE.lose };
/** Ca bình thường: chủ tiệm đã chọn tính cách thì một nửa số lần dùng câu theo tính cách. */
const PLAIN = new Set(["good", "few", "perfect"]);
import { fill } from "./text.js?v=m37";
import { int } from "./rng.js?v=m37";

/** Chọn nhóm câu theo dữ kiện ca: lỗ > câu trả lời review lên mạng / dính phốt > đổi tính nhiều lần > khách bỏ về > drama > 0% đường > pha nhầm > xong cả 3 nhiệm vụ > lên mạng > đơn nhóm > hoàn hảo > ít khách > ổn. */
export function captionKind(sum) {
  const moments = sum.moments || [];
  if (sum.closedEarly || moments.some((m) => m.kind === "closed")) return "closed"; // hết hàng, đóng cửa sớm
  if (sum.challenge) return sum.challenge.ok ? "challengeWin" : "challengeLose"; // ca thử thách (cấp 20)
  if (sum.profit < 0) return "loss";
  if (sum.fair) return "fair"; // ca hội chợ (cấp 18)
  if (moments.some((m) => m.kind === "ran")) return "ran";
  if (moments.some((m) => m.kind === "reply" && m.outcome === "viral")) return "replyViral";
  if (moments.some((m) => m.kind === "reply" && m.outcome === "phot")) return "replyPhot";
  if (moments.some((m) => m.kind === "flip")) return "flip";
  if (sum.lost > 1) return "lost";
  if ((sum.drama || []).length >= 2) return "drama";
  if (moments.some((m) => m.kind === "drama" && /0%/.test(m.line || ""))) return "sugar0";
  if (moments.filter((m) => m.kind === "mistake").length >= 2) return "oops";
  if ((sum.missions || []).length >= 3 && sum.missions.every((m) => m.done)) return "missions";
  if ((sum.followersDelta || 0) >= 20) return "viral";
  if (sum.multi >= 2) return "multi";
  if (sum.lost > 0) return "lost";
  if (sum.cups <= 2) return "few";
  if (sum.avgStars >= 4.5) return "perfect";
  return "good";
}

export function caption(s, sum) {
  const kind = captionKind(sum);
  const persona = s.owner?.persona;
  const list = PLAIN.has(kind) && CAPTIONS_PERSONA[persona] && int(s, 2) === 0 ? CAPTIONS_PERSONA[persona] : CAPTIONS[kind];
  const tpl = list[int(s, list.length)];
  return fill(tpl, {
    cups: sum.cups, lost: sum.lost, profit: Math.abs(sum.profit), multi: sum.multi || 0, followers: Math.max(0, sum.followersDelta || 0),
    drama: (sum.drama || []).length, oops: (sum.moments || []).filter((m) => m.kind === "mistake").length, shop: sum.shopName || s.shopName,
    stars: (sum.avgStars || 0).toLocaleString("vi-VN", { maximumFractionDigits: 1 }),
    challenge: sum.challenge?.name || "",
    item: (STOCK[sum.closedEarly || (sum.moments || []).find((m) => m.kind === "ran" || m.kind === "closed")?.id]?.name || "hàng").toLocaleLowerCase("vi"), day: sum.day,
    flips: Math.max(3, (s.owner?.switches || []).filter((x) => x.day === sum.day).length),
  });
}

const JOURNAL_KINDS = new Set(["badge", "challenge", "closed", "ran", "reply", "flip", "drama", "mistake", "five", "multi5", "multi", "promise", "mission-all", "mission-miss", "consign-done"]);
/** Khoảnh khắc có thể đặt làm câu trích trên thẻ (drama trước, rồi review 5 sao, rồi review hay nhất). */
export function journalMoments(sum) {
  const out = [];
  // câu trả lời review nổi nhất / tệ nhất ngày lên đầu
  const big = (m) => m.kind === "reply" && (m.outcome === "viral" || m.outcome === "phot");
  const ms = [...(sum.moments || [])].sort((a, b) => big(b) - big(a));
  for (const m of ms) if (m.line && JOURNAL_KINDS.has(m.kind)) out.push({ who: m.name, line: m.line });
  if (sum.best?.line && !out.some((o) => o.line === sum.best.line)) out.push({ who: sum.best.name, line: sum.best.line });
  for (const r of sum.reviews || []) if (out.length < 6 && !out.some((o) => o.line === r.line) && r.stars <= 2) out.push({ who: r.name, line: r.line });
  if (!out.length) out.push({ who: "", line: "Một ngày bình thường ở tiệm: pha, cười, lau quầy." });
  return out.slice(0, 6);
}

/** Nội dung thẻ: tiêu đề, tên tiệm (có thể ẩn), câu trích, kết quả, ba số, chân thẻ. */
export function journalCard(sum, { shopName = "", hideName = false, moment = 0 } = {}) {
  const ms = journalMoments(sum);
  const m = ms[((moment % ms.length) + ms.length) % ms.length];
  const k = (n) => `${n < 0 ? "−" : ""}${Math.abs(n).toLocaleString("vi-VN")}k`;
  return {
    brand: "Lụm Kèo", title: "Nhật Ký Làm Chủ", shop: hideName ? "" : shopName || sum.shopName || "", day: `Ngày ${sum.day}`,
    quote: m.line, who: m.who, headline: sum.headline,
    stats: [
      { label: "Ly bán", value: String(sum.cups) },
      { label: "Lãi ca", value: k(sum.profit) },
      { label: "Sao", value: sum.avgStars ? sum.avgStars.toLocaleString("vi-VN") : "—" },
    ],
    footer: "lumkeo.com", moments: ms.length,
  };
}
