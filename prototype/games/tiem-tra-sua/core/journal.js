// Nhật Ký Làm Chủ: câu chốt ca kiểu meme (theo dữ kiện ca) và nội dung thẻ chia sẻ 1080×1350 (ui/journal.js vẽ lên journal-card.png).
// Thuần: test kiểm câu chọn đúng tình huống và nội dung thẻ đủ dòng.
import { CAPTIONS } from "../data/lines.js";
import { fill } from "./text.js";
import { int } from "./rng.js";

/** Chọn nhóm câu theo dữ kiện ca: lỗ > khách bỏ về > drama > 0% đường > lên mạng > đơn nhóm > hoàn hảo > ít khách > ổn. */
export function captionKind(sum) {
  const moments = sum.moments || [];
  if (sum.profit < 0) return "loss";
  if (sum.lost > 1) return "lost";
  if ((sum.drama || []).length >= 2) return "drama";
  if (moments.some((m) => m.kind === "drama" && /0%/.test(m.line || ""))) return "sugar0";
  if (moments.filter((m) => m.kind === "mistake").length >= 2) return "oops";
  if ((sum.followersDelta || 0) >= 20) return "viral";
  if (sum.multi >= 2) return "multi";
  if (sum.lost > 0) return "lost";
  if (sum.cups <= 2) return "few";
  if (sum.avgStars >= 4.5) return "perfect";
  return "good";
}

export function caption(s, sum) {
  const kind = captionKind(sum);
  const list = CAPTIONS[kind];
  const tpl = list[int(s, list.length)];
  return fill(tpl, {
    cups: sum.cups, lost: sum.lost, profit: Math.abs(sum.profit), multi: sum.multi || 0, followers: Math.max(0, sum.followersDelta || 0),
    drama: (sum.drama || []).length, oops: (sum.moments || []).filter((m) => m.kind === "mistake").length, shop: sum.shopName || s.shopName,
    stars: (sum.avgStars || 0).toLocaleString("vi-VN", { maximumFractionDigits: 1 }),
  });
}

/** Khoảnh khắc có thể đặt làm câu trích trên thẻ (drama trước, rồi review 5 sao, rồi review hay nhất). */
export function journalMoments(sum) {
  const out = [];
  for (const m of sum.moments || []) if (m.line && (m.kind === "drama" || m.kind === "mistake" || m.kind === "five" || m.kind === "multi5" || m.kind === "promise")) out.push({ who: m.name, line: m.line });
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
