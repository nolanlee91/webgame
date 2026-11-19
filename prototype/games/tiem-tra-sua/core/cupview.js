// Ly đang pha → danh sách lớp sprite (cup-layers.webp, ô 160×192, neo [80,174]). Thuần ⇒ test được "ly đổi hình ở từng bước".
// Thứ tự vẽ: chất lỏng → vệt siro / miếng trái → topping lắng → đá → thành ly (empty-cup) → kem → nắp. Trà nâng mực nước, sữa đổi màu,
// đường rót thêm siro (mực nước nhích lên; 0% thì không), "không đá" ⇒ thêm trà thay chỗ đá (mực nước cao hơn, không có lớp đá),
// topping lắng, nắp hiện sau khi đóng (GAME-DESIGN "Pha").
// Lớp mới mà Codex đang vẽ (DEV-NOTES "Cần Codex" #4–#6) được dùng tự động khi manifest có frame cùng tên — truyền `has` (atlas.has trên "cup").
import { choice } from "../data/ingredients.js?v=m35hd";

/** Frame có sẵn trong cup-layers.webp hiện tại (dùng khi không có atlas, ví dụ test). */
export const BASE_FRAMES = new Set(["empty-cup", "amber-25", "amber-50", "amber-75", "milk-25", "milk-50", "milk-75", "matcha-75", "pearls-bottom", "jelly-bottom", "ice-top", "dome-lid"]);
const baseHas = (name) => BASE_FRAMES.has(name);
/** Lớp tuỳ chọn → frame đề xuất (Cần Codex). */
export const OPTIONAL_LAYERS = {
  syrup: "syrup-swirl", brownSugar: "brown-sugar-streak", dao: "fruit-peach", vai: "fruit-lychee", "chanh-day": "fruit-passion",
  pudding: "pudding-bottom", cream: "cream-top", matcha50: "matcha-50", matchaMilk: "matcha-milk-75",
};

export function liquidOf(cup, has = baseHas) {
  let color = null, level = 0, milk = false;
  for (const st of cup?.steps || []) {
    if (st.step === "ice" && st.id === "khong" && color) { level += 25; continue; } // không đá: rót thêm cho đầy ly
    const c = choice(st.step, st.id);
    const L = c?.liquid;
    if (!L) continue;
    if (st.step === "base") { color = L.color; level = L.level; continue; }
    if (!color) continue; // chưa có trà nền thì sữa/đường chưa có chỗ nổi
    if (L.color === "milk") milk = true;
    if (L.color && color !== "matcha") color = L.color;
    level += L.rise || 0;
  }
  if (!color) return null;
  level = Math.max(25, Math.min(75, Math.round(level / 25) * 25));
  if (color === "matcha") {
    if (milk && has("matcha-milk-75")) return "matcha-milk-75";
    if (level <= 50 && has("matcha-50")) return "matcha-50";
    return "matcha-75";
  }
  const f = `${color}-${level}`;
  return has(f) ? f : `${color}-50`;
}

/** { layers: [frame…] theo thứ tự vẽ, stage: chuỗi duy nhất cho mỗi trạng thái nhìn thấy, step: số bước đã làm } */
export function cupLayers(cup, has = baseHas) {
  if (!cup || !cup.steps.length) return { layers: [], stage: "none", step: 0 };
  const layers = [];
  const liq = liquidOf(cup, has);
  if (liq) layers.push(liq);
  const add = cup.steps.find((s) => s.step === "add");
  const sugar = cup.steps.find((s) => s.step === "sugar");
  if (liq && add?.id === "duong-den" && has(OPTIONAL_LAYERS.brownSugar)) layers.push(OPTIONAL_LAYERS.brownSugar);
  if (liq && sugar && sugar.id > 0 && has(OPTIONAL_LAYERS.syrup)) layers.push(OPTIONAL_LAYERS.syrup);
  if (liq && add && OPTIONAL_LAYERS[add.id] && has(OPTIONAL_LAYERS[add.id])) layers.push(OPTIONAL_LAYERS[add.id]);
  const top = cup.steps.find((s) => s.step === "topping");
  let topLayer = top && choice("topping", top.id)?.layer;
  if (top?.id === "pudding" && has(OPTIONAL_LAYERS.pudding)) topLayer = OPTIONAL_LAYERS.pudding;
  if (topLayer) layers.push(topLayer);
  const ice = cup.steps.find((s) => s.step === "ice");
  if (ice && ice.id !== "khong") layers.push("ice-top");
  layers.push("empty-cup");
  if (add?.id === "kem-sua" && has(OPTIONAL_LAYERS.cream)) layers.push(OPTIONAL_LAYERS.cream);
  if (cup.sealed) layers.push("dome-lid");
  return { layers, stage: layers.join("+"), step: cup.steps.length };
}

/** Nhãn chữ cho lựa chọn "vô hình" (0% đường, không đá, không topping) để hiện cạnh ly. */
export function cupNotes(cup) {
  const out = [];
  for (const st of cup?.steps || []) {
    if (st.step === "sugar" && st.id === 0) out.push("0% đường");
    if (st.step === "ice" && st.id === "khong") out.push("Không đá");
    if (st.step === "topping" && st.id === "none") out.push("Không topping");
  }
  return out;
}
