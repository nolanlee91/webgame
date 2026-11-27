// Tiện ích giao diện dùng chung: tạo phần tử, thông báo (toast), định dạng tiền, màu bàn, giờ ca.
import { SHIFTS } from "../data/economy.js?v=c12";

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
/** Thông báo trong khung cảnh (D11, TLC2-12). Luật D4 "một thông báo một lúc" áp cho mọi cỡ màn: thông báo mới thay thông báo cũ;
 *  riêng thông báo có nút (`action` = { label, act, onClick }, vd "Khoe" lúc lên cấp) ở 7 giây, nằm dưới cùng và không bị thay.
 *  Khi bảng phủ / lớp thoại đang mở (`isOpen()`): không vẽ đè thanh đầu nữa mà xếp hàng (tối đa 3 câu mới nhất, bỏ câu trùng);
 *  đóng bảng thì hiện lần lượt từng câu (2,4 giây một câu, câu cũ quá 45 giây thì bỏ). Câu quan trọng (`opt.important`, vd sắp hết
 *  cơm / than / dĩa) và câu trả lời cho thao tác trong bảng (`opt.sheet`) hiện thành một dòng `.sheet-note` trong chân bảng dính đáy (`footSel`), không có thì dưới tiêu đề. */
export function createToaster(root, { isOpen, sheet, footSel = "", view = () => sheet.dataset.ov, watch = [] }) {
  const queue = [], QMAX = 3, TTL = 45000, GAP = 2400, NOTE_MS = 5000;
  let note = null, drainT = 0, wasOpen = isOpen();
  function place(text, kind, action) {
    for (const x of [...root.children]) if (action ? x.classList.contains("has-act") : !x.classList.contains("has-act")) x.remove();
    const t = el("div", "toast" + (kind ? " " + kind : ""), null, text);
    if (action) {
      t.classList.add("has-act"); t.textContent = ""; el("span", "", t, text);
      button(t, "toast-act", action.label, (e) => { e.stopPropagation(); t.remove(); action.onClick(); }, { "data-act": action.act });
    }
    t._q = { text, kind, action };
    const keep = !action && root.querySelector(".toast.has-act");
    if (keep) root.insertBefore(t, keep); else root.appendChild(t);
    t.dataset.t = Date.now();
    setTimeout(() => t.remove(), action ? 7000 : kind === "warn" ? 3600 : 2800);
  }
  function enqueue(q) {
    const k = queue.findIndex((x) => x.text === q.text);
    if (k >= 0) queue.splice(k, 1);
    queue.push(q);
    while (queue.length > QMAX) { const n = queue.findIndex((x) => !x.action); queue.splice(n >= 0 ? n : 0, 1); }
  }
  function drain() {
    clearTimeout(drainT); drainT = 0;
    if (isOpen()) return;
    let q;
    while ((q = queue.shift()) && Date.now() - q.at > TTL && !q.action);
    if (!q) return;
    place(q.text, q.kind, q.action);
    if (queue.length) drainT = setTimeout(drain, GAP);
  }
  function renderNote() {
    const old = sheet.querySelector(".sheet-note");
    const live = note && isOpen() && note.view === view() && Date.now() - note.at < note.ms;
    if (!live) { old?.remove(); return; }
    if (old && old.textContent === note.text) return;
    const n = old || el("p");
    n.className = "sheet-note" + (note.kind ? " " + note.kind : ""); n.textContent = note.text; n.setAttribute("role", "status");
    // chân bảng dính đáy (nút chính) có sẵn ⇒ dòng nằm ngay trên nút, luôn thấy mà không che tab / nút nào; không có ⇒ dưới tiêu đề
    if (!old) { const foot = footSel ? [...sheet.querySelectorAll(footSel)].pop() : null, h2 = sheet.querySelector("h2"); if (foot) foot.prepend(n); else if (h2) h2.after(n); else sheet.prepend(n); }
  }
  function sheetNote(text, kind, important) {
    note = { text, kind, at: Date.now(), ms: important ? Infinity : NOTE_MS, view: view() };
    renderNote();
    if (!important) setTimeout(renderNote, NOTE_MS + 50);
  }
  function sync() {
    const open = isOpen();
    if (open && !wasOpen) { // bảng vừa mở: thông báo đang hiện ⇒ cất lại vào hàng, không vẽ đè thanh đầu
      clearTimeout(drainT); drainT = 0;
      for (const t of [...root.children]) { if (t._q) queue.unshift({ ...t._q, at: Date.now() }); t.remove(); }
      while (queue.length > QMAX) queue.shift();
    }
    if (!open && wasOpen) { note = null; drain(); }
    wasOpen = open;
    renderNote();
  }
  if (typeof MutationObserver === "function") {
    const mo = new MutationObserver(sync);
    for (const [node, opts] of watch) if (node) mo.observe(node, opts);
    mo.observe(sheet, { childList: true });
  }
  function toast(text, kind = "", action = null, opt = {}) {
    if (!root || !text) return;
    sync();
    if (isOpen()) {
      if (opt.important || opt.sheet) sheetNote(text, kind, !!opt.important);
      if (!opt.sheet) enqueue({ text, kind, action, at: Date.now() });
      return;
    }
    if (queue.length) { enqueue({ text, kind, action, at: Date.now() }); if (!drainT) drain(); return; }
    place(text, kind, action);
  }
  return { toast, sync, get queued() { return queue.map((q) => q.text); } };
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
