// Hiệu ứng riêng của game: tem mực đóng dấu (đỏ = đúng / bể, xám = trật), rung màn, kính lúp nứt. Chỉ CSS + DOM, tôn trọng giảm chuyển động.
import { h } from "./dom.js?v=t1";

const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** Đóng tem giữa màn. kind: "red" | "gray" | "teal". Trả Promise khi tem đã đóng xong (người chơi vẫn đọc được). */
export async function stamp(text, kind = "red", sub = "", hold = 650) {
  const fx = document.getElementById("fx");
  for (const old of fx.querySelectorAll(".stamp")) old.remove();
  const el = h("div.stamp.stamp--" + kind, { role: "status", "aria-live": "assertive" }, h("span.stamp-t", text), sub ? h("span.stamp-s", sub) : null);
  fx.append(el);
  if (!reduced()) shake(kind === "gray" ? 1 : 2);
  await wait(reduced() ? 300 : hold);
  el.classList.add("out");
  setTimeout(() => el.remove(), 260);
}
export function shake(power = 2) {
  if (reduced()) return;
  const app = document.getElementById("app");
  app.classList.remove("shake1", "shake2"); void app.offsetWidth;
  app.classList.add("shake" + power);
  setTimeout(() => app.classList.remove("shake" + power), 420);
}
/** Kính lúp vừa mất nứt ra (idx = vị trí), idx = -1 ⇒ cả hàng chớp (Tèo can, hồi về 1). */
export function crackLens(cred, idx) {
  if (!cred) return;
  const all = [...cred.querySelectorAll(".lens")];
  for (const t of idx < 0 ? all : [all[idx]].filter(Boolean)) { t.classList.remove("crack"); void t.offsetWidth; t.classList.add("crack"); }
}
