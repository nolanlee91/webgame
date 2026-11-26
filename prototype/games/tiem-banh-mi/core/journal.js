// Nhật Ký Làm Chủ (DRAMA.md §6, chép core/journal.js Trà Sữa): câu chốt ca kiểu meme theo dữ kiện ca + nội dung thẻ 1080×1350
// (ui/journal.js vẽ lên journal-card.webp khi có, không thì nền canvas dự phòng). Thuần: test kiểm câu chọn đúng tình huống, thẻ đủ dòng.
import { CAPTIONS } from "../data/lines-m3.js?v=b10";
import { CAPTIONS_M5 } from "../data/lines-m5.js?v=b10";
import { CAPTIONS_PERSONA, CAPTIONS_REPLY } from "../data/lines-reply.js?v=b10";
import { STOCK } from "../data/economy.js?v=b10";
import { fill } from "./text.js?v=b10";
import { int } from "./rng.js?v=b10";

const PLAIN = new Set(["good", "few", "perfect"]);
const ALL = { ...CAPTIONS, ...CAPTIONS_M5, replyViral: CAPTIONS_REPLY.viral, replyPhot: CAPTIONS_REPLY.phot, flip: CAPTIONS_REPLY.flip };

/** Nhóm câu theo dữ kiện ca (ưu tiên từ trên xuống). */
export function captionKind(sum) {
  const ms = sum.moments || [];
  if (sum.early || ms.some((m) => m.kind === "closed")) return "closed";
  if (sum.challenge) return sum.challenge.ok ? "challengeWin" : "challengeLose";
  if ((sum.badges || []).length) return "badge";
  if (sum.moved) return "shop";
  if (sum.profit < 0) return "loss";
  if (sum.fair) return "fair";
  if (ms.some((m) => m.kind === "ran")) return "ran";
  if (ms.some((m) => m.kind === "reply" && m.outcome === "viral")) return "replyViral";
  if (ms.some((m) => m.kind === "reply" && m.outcome === "phot")) return "replyPhot";
  if (ms.some((m) => m.kind === "flip")) return "flip";
  if (sum.rain) return "rain";
  if (sum.lost > 1) return "lost";
  if (ms.some((m) => m.kind === "contract")) return "contract";
  if ((sum.preorders || 0) > 0) return "preorder";
  if ((sum.dramaN || 0) >= 2) return "drama";
  if (sum.burntBatches >= 1) return "burnt";
  if (Object.values(sum.mistakes || {}).reduce((a, b) => a + b, 0) >= 3) return "oops";
  if ((sum.missions || []).length >= 3 && sum.missions.every((m) => m.done)) return "missions";
  if ((sum.followersDelta || 0) >= 30) return "viral";
  if ((sum.multi || 0) >= 2) return "multi";
  if ((sum.staleSold || 0) > 0) return "stale";
  if (sum.lost > 0) return "lost";
  if (sum.loaves <= 4) return "few";
  if (sum.avg >= 4.5) return "perfect";
  if (sum.goldenPulls >= 3 && !sum.burntBatches) return "golden";
  return "good";
}
export function caption(s, sum) {
  const kind = captionKind(sum);
  const persona = s.owner?.persona;
  const list = PLAIN.has(kind) && CAPTIONS_PERSONA[persona] && int(s, 2) === 0 ? CAPTIONS_PERSONA[persona] : ALL[kind] || ALL.good;
  const tpl = list[int(s, list.length)];
  return fill(tpl, {
    n: sum.loaves, loaves: sum.loaves, profit: Math.abs(sum.profit), revenue: sum.revenue, batches: sum.batches, lost: sum.lost, drama: sum.dramaN || 0,
    oops: Object.values(sum.mistakes || {}).reduce((a, b) => a + b, 0), followers: Math.max(0, sum.followersDelta || 0), shop: s.shopName, day: sum.day,
    stars: (sum.avg || 0).toLocaleString("vi-VN", { maximumFractionDigits: 1 }), item: (STOCK[sum.ranItem]?.name || "hàng").toLocaleLowerCase("vi"),
    flips: Math.max(3, (s.owner?.switches || []).filter((x) => x.day === sum.day).length),
  });
}
const JOURNAL_KINDS = new Set(["badge", "contract", "partial", "expired", "challenge", "closed", "ran", "reply", "flip", "drama", "mistake", "five", "multi", "promise", "mission-all", "mission-miss", "consign-done", "preorder", "shop", "stale"]);
/** Khoảnh khắc đặt làm câu trích trên thẻ (câu trả lời nổi / phốt trước, rồi drama, rồi review hay nhất). */
export function journalMoments(sum) {
  const out = [];
  const big = (m) => m.kind === "reply" && (m.outcome === "viral" || m.outcome === "phot");
  const ms = [...(sum.moments || [])].sort((a, b) => big(b) - big(a));
  for (const m of ms) if (m.line && JOURNAL_KINDS.has(m.kind) && !out.some((o) => o.line === m.line)) out.push({ who: m.name, line: m.line });
  if (sum.best?.line && !out.some((o) => o.line === sum.best.line)) out.push({ who: sum.best.name, line: sum.best.line });
  if (sum.worst?.line && sum.worst.stars <= 2 && !out.some((o) => o.line === sum.worst.line)) out.push({ who: sum.worst.name, line: sum.worst.line });
  if (!out.length) out.push({ who: "", line: "Một ngày bình thường ở tiệm: nướng, rạch, phết, gói, thối tiền, lau thớt." });
  return out.slice(0, 6);
}
/** Nội dung thẻ: tiêu đề, tên tiệm (ẩn được), câu chốt ca, câu trích, ba số, chân thẻ. */
export function journalCard(sum, { shopName = "", hideName = false, moment = 0 } = {}) {
  const ms = journalMoments(sum);
  const m = ms[((moment % ms.length) + ms.length) % ms.length];
  const k = (n) => `${n < 0 ? "−" : ""}${Math.abs(Math.round(n)).toLocaleString("vi-VN")}k`;
  return {
    brand: "Lụm Kèo", title: "Nhật Ký Làm Chủ", shop: hideName ? "" : shopName || "", day: `Ngày ${sum.day}`,
    headline: sum.headline || "", quote: m.line, who: m.who,
    stats: [{ label: "Ổ bán", value: String(sum.loaves) }, { label: "Lời ca", value: k(sum.profit) }, { label: "Sao", value: sum.avg ? sum.avg.toLocaleString("vi-VN") : "—" }],
    footer: "lumkeo.com", moments: ms.length,
  };
}
