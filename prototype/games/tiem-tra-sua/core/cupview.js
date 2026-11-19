// Ly đang pha → danh sách lớp sprite (cup-layers.webp, ô 160×192, neo [80,174]). Thuần ⇒ test được "ly đổi hình ở từng bước".
// Thứ tự vẽ: chất lỏng → topping lắng → đá → thành ly (empty-cup) → nắp. Trà nâng mực nước, sữa đổi màu, đường rót thêm siro,
// đá nổi, topping lắng, nắp hiện sau khi đóng (GAME-DESIGN "Pha").
import { choice } from "../data/ingredients.js";

const LIQUID_FRAMES = new Set(["amber-25", "amber-50", "amber-75", "milk-25", "milk-50", "milk-75", "matcha-75"]);

export function liquidOf(cup) {
  let color = null, level = 0;
  for (const st of cup?.steps || []) {
    const c = choice(st.step, st.id);
    const L = c?.liquid;
    if (!L) continue;
    if (st.step === "base") { color = L.color; level = L.level; continue; }
    if (!color) continue; // chưa có trà nền thì sữa/đường chưa có chỗ nổi
    if (L.color && color !== "matcha") color = L.color;
    level += L.rise || 0;
  }
  if (!color) return null;
  level = Math.max(25, Math.min(75, Math.round(level / 25) * 25));
  if (color === "matcha") return "matcha-75";
  const f = `${color}-${level}`;
  return LIQUID_FRAMES.has(f) ? f : `${color}-50`;
}

/** { layers: [frame…] theo thứ tự vẽ, stage: chuỗi duy nhất cho mỗi trạng thái nhìn thấy, step: số bước đã làm } */
export function cupLayers(cup) {
  if (!cup || !cup.steps.length) return { layers: [], stage: "none", step: 0 };
  const layers = [];
  const liq = liquidOf(cup);
  if (liq) layers.push(liq);
  const top = cup.steps.find((s) => s.step === "topping");
  const topLayer = top && choice("topping", top.id)?.layer;
  if (topLayer) layers.push(topLayer);
  const ice = cup.steps.find((s) => s.step === "ice");
  if (ice && ice.id !== "khong") layers.push("ice-top");
  layers.push("empty-cup");
  if (cup.sealed) layers.push("dome-lid");
  return { layers, stage: layers.join("+"), step: cup.steps.length };
}
