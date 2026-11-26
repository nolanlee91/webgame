// Tiện ích giao diện dùng chung: tạo phần tử, thông báo (toast), định dạng tiền, màu bàn, giờ ca.
import { SHIFTS } from "../data/economy.js?v=c8";

export function el(tag, cls, parent, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined && text !== null) e.textContent = text;
  parent?.appendChild(e);
  return e;
}
export function button(parent, cls, text, onClick, attrs = {}) {
  const b = el("button", cls, parent, text);
  b.type = "button";
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null) b.setAttribute(k, v);
  if (onClick) b.addEventListener("click", onClick);
  return b;
}
export const fmtK = (n) => `${Math.round(n * 10) / 10}k`.replace(".", ",");
/** Thông báo trong khung cảnh (tối đa 2 cái thường, tự tắt). `action` = { label, act, onClick }: thêm nút nhỏ (vd "Khoe" lúc lên cấp) —
 *  thông báo ở 7 giây cho kịp bấm, luôn nằm dưới cùng (thông báo thường chen lên trên) và không bị thông báo thường đẩy mất. */
export function toast(root, text, kind = "", action = null) {
  if (!root || !text) return;
  for (const x of root.children) if (x.firstChild?.textContent === text || x.textContent === text) { x.remove(); break; } // V: cùng câu đang hiện ⇒ thay, không xếp chồng hai dòng giống nhau
  const t = el("div", "toast" + (kind ? " " + kind : ""), null, text);
  if (action) {
    t.classList.add("has-act"); t.textContent = ""; el("span", "", t, text);
    button(t, "toast-act", action.label, (e) => { e.stopPropagation(); t.remove(); action.onClick(); }, { "data-act": action.act });
  }
  const keep = !action && root.querySelector(".toast.has-act");
  if (keep) root.insertBefore(t, keep); else root.appendChild(t);
  while (root.children.length > (root.querySelector(".has-act") ? 3 : 2)) (root.querySelector(".toast:not(.has-act)") || root.firstChild).remove();
  t.dataset.t = Date.now();
  setTimeout(() => t.remove(), action ? 7000 : kind === "warn" ? 3600 : 2800);
}
/** Màu viền phiếu theo bàn (5 màu tách biệt, ART-DIRECTION §2). */
export function tableColor(tid) {
  if (!tid) return "#a07850";
  const n = Number(String(tid).slice(1)) || 1;
  return `var(--t${((n - 1) % 5) + 1})`;
}
export const tableName = (tid) => (tid ? `Bàn ${String(tid).slice(1)}` : "Mang về");
/** Giờ trên đồng hồ ca (ca tối 17:30–23:00 chạy trong 3 phút 30 giây). */
export function clockText(sh) {
  if (!sh) return "";
  const S = SHIFTS[sh.kind];
  const [a, b] = S.clock;
  const m = Math.min(b, a + Math.floor(((b - a) * sh.t) / sh.len));
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}
export const starText = (n) => "★".repeat(n) + "☆".repeat(5 - n);
