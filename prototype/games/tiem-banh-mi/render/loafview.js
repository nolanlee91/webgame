// Ổ bánh trên thớt ⇒ danh sách lớp loaf-layers theo thứ tự vẽ (ART-DIRECTION §5). Thuần (test được bằng node).
// Dưới lên: loaf-open-back → spread-* → fill-* → do-chua → dua-leo → rau-mui → hanh-la → ot-* → sauce-* → loaf-open-front
// → loaf-toasted-sheen → wrap-* (gói thay toàn bộ ổ). Chưa rạch: loaf-whole-{mức nướng}.
import { SPREADS, VEG_IDS, SAUCES, WRAPS } from "../data/economy.js?v=b10";

export const OT_LAYER = [null, "ot-it", "ot-vua", "ot-nhieu"];
/** Mức vỏ theo độ giòn / cháy / xém của ổ trong tủ hoặc trên thớt. */
export function crustOf(l) {
  if (!l) return "golden";
  if (l.burnt) return "burnt";
  if (l.dark) return "dark";
  if (l.crisp < 70) return "pale";
  return "golden";
}
export function loafLayers(l) {
  if (!l) return [];
  if (l.wrap) return [WRAPS[l.wrap].layer];
  if (!l.sliced) return ["loaf-whole-" + crustOf(l), ...(l.toasted ? ["loaf-toasted-sheen"] : [])];
  const out = ["loaf-open-back"];
  for (const id of SPREADS) if (l.spreads?.[id]) out.push("spread-" + id);
  for (const id of l.fills || []) out.push("fill-" + id);
  for (const id of VEG_IDS) if (l.veg?.[id]) out.push(id);
  if (OT_LAYER[l.ot || 0]) out.push(OT_LAYER[l.ot]);
  for (const id of SAUCES) if (l.sauces?.[id]) out.push("sauce-" + id);
  out.push("loaf-open-front");
  if (l.toasted) out.push("loaf-toasted-sheen");
  return out;
}
