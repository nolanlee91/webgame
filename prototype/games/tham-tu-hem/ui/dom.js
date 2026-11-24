// DOM nhỏ gọn: h(), icon pixel 16×16 (SVG crispEdges), thông báo, hộp xác nhận.

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/** h("button.btn.btn--primary", { onclick, data: { act: "x" } }, "Chữ", child…) */
export function h(sel, attrs, ...kids) {
  if (attrs == null || typeof attrs !== "object" || attrs instanceof Node || Array.isArray(attrs)) { kids.unshift(attrs); attrs = {}; }
  let id = null;
  sel = sel.replace(/#([\w-]+)/, (_, x) => { id = x; return ""; });
  const [t, ...cls] = sel.split(".");
  const el = document.createElement(t || "div");
  if (id) el.id = id;
  if (cls.length) el.className = cls.join(" ");
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (k === "data") for (const [dk, dv] of Object.entries(v)) el.dataset[dk] = dv;
    else if (k === "style" && typeof v === "object") for (const [sk, sv] of Object.entries(v)) { if (sk.startsWith("--")) el.style.setProperty(sk, sv); else el.style[sk] = sv; }
    else if (k === "html") el.innerHTML = v;
    else if (k === "class") el.className += (el.className ? " " : "") + v;
    else if (v === true) el.setAttribute(k, "");
    else el.setAttribute(k, v);
  }
  add(el, kids);
  return el;
}
function add(el, kids) {
  for (const k of kids.flat(Infinity)) {
    if (k == null || k === false) continue;
    el.append(k instanceof Node ? k : document.createTextNode(String(k)));
  }
}
export const clear = (el) => { while (el.firstChild) el.firstChild.remove(); return el; };

// ---------- icon pixel 16×16: mỗi chuỗi là các ô "x,y,w,h" ----------
const ICONS = {
  lens: { "#f4ead2": "5,1,5,1 3,2,2,1 10,2,2,1 2,3,1,2 12,3,1,2 1,5,1,4 13,5,1,4 2,9,1,2 12,9,1,2 3,11,2,1 10,11,2,1 5,12,5,1", "#9fd3e6": "5,2,5,1 3,3,9,1 3,4,1,1 2,5,1,4 3,9,9,2 5,11,5,1", "#d6f1fa": "4,4,3,1 3,5,2,2 ", "#6fa8bf": "5,6,8,3 4,5,9,1 12,4,1,1", "#8a5a2b": "12,12,2,2 13,13,2,2 14,14,2,2", "#5a3a1c": "11,11,2,1 11,12,1,1" },
  lensOff: { "#5b5345": "5,1,5,1 3,2,2,1 10,2,2,1 2,3,1,2 12,3,1,2 1,5,1,4 13,5,1,4 2,9,1,2 12,9,1,2 3,11,2,1 10,11,2,1 5,12,5,1 12,12,2,2 13,13,2,2 14,14,2,2", "#2a251e": "5,2,5,1 3,3,9,8 5,11,5,1 2,5,1,4 12,5,1,4", "#7d7564": "6,3,1,2 7,5,1,2 6,7,2,1 8,8,1,2 9,6,2,1" },
  book: { "#0a0807": "2,1,12,1 2,14,12,1 1,2,1,12 14,2,1,12", "#c9a46a": "2,2,12,12", "#8a5a2b": "2,2,2,12", "#f4ead2": "6,4,6,1 6,6,6,1 6,8,4,1", "#c8382e": "10,11,2,4" },
  board: { "#0a0807": "1,2,14,1 1,13,14,1 0,3,1,10 15,3,1,10", "#8a5a2b": "1,3,14,10", "#a8743c": "2,4,12,8", "#f4ead2": "3,5,4,3 9,7,4,3", "#e0483d": "4,4,2,2 10,6,2,2 6,7,1,1 7,8,1,1 8,8,1,1" },
  bulb: { "#0a0807": "5,1,6,1 3,2,2,1 11,2,2,1 2,3,1,5 13,3,1,5 3,8,2,2 11,8,2,2 5,10,1,2 10,10,1,2", "#ffe9a8": "5,2,6,1 3,3,10,5 5,8,6,2", "#fff7dc": "5,3,2,2", "#7d7564": "6,11,4,1 6,13,4,1", "#b9ad93": "6,12,4,1 7,14,2,1" },
  sound: { "#f4ead2": "1,6,3,4 4,5,1,6 5,4,1,8 6,3,1,10 7,2,1,12", "#b9ad93": "10,5,1,1 11,6,1,4 10,10,1,1 12,3,1,1 13,4,1,8 12,12,1,1" },
  mute: { "#f4ead2": "1,6,3,4 4,5,1,6 5,4,1,8 6,3,1,10 7,2,1,12", "#e0483d": "9,5,1,1 10,6,1,1 11,7,2,2 13,9,1,1 14,10,1,1 13,6,1,1 14,5,1,1 10,9,1,1 9,10,1,1" },
  back: { "#f4ead2": "6,3,2,2 4,5,2,2 2,7,12,2 4,9,2,2 6,11,2,2" },
  star: { "#ffc94a": "7,1,2,3 6,4,4,2 1,6,14,2 3,8,10,1 4,9,8,1 4,10,3,2 9,10,3,2 3,12,3,2 10,12,3,2 2,14,2,1 12,14,2,1", "#ffe9a8": "7,2,1,2 2,6,5,1", "#a8741a": "8,4,2,2 10,8,3,1 11,9,1,1" },
  starOff: { "#3a332a": "7,1,2,3 6,4,4,2 1,6,14,2 3,8,10,1 4,9,8,1 4,10,3,2 9,10,3,2 3,12,3,2 10,12,3,2 2,14,2,1 12,14,2,1" },
  lock: { "#0a0807": "4,7,8,1 4,14,8,1 3,8,1,6 12,8,1,6", "#b9ad93": "5,2,6,1 4,3,1,4 11,3,1,4", "#7d7564": "4,8,8,6", "#1d1a16": "7,9,2,3" },
  pin: { "#0a0807": "6,1,4,1 5,2,1,4 10,2,1,4 6,6,4,1", "#e0483d": "6,2,4,4", "#ff8f84": "6,2,2,1", "#b9ad93": "7,7,2,1 8,8,1,6" },
  eye: { "#f4ead2": "4,4,8,1 2,5,2,1 12,5,2,1 1,6,1,3 14,6,1,3 2,9,2,1 12,9,2,1 4,10,8,1", "#9fd3e6": "6,5,4,5", "#0a0807": "7,6,2,3" },
  phone: { "#0a0807": "4,0,8,1 4,15,8,1 3,1,1,14 12,1,1,14", "#262019": "4,1,8,14", "#6fd0bb": "5,3,6,8", "#f4ead2": "7,12,2,2" },
  chat: { "#f4ead2": "2,2,12,1 1,3,1,7 14,3,1,7 2,10,7,1 9,10,1,2 10,11,1,2 11,10,3,1", "#b9ad93": "4,5,8,1 4,7,5,1" },
  heart: { "#e0483d": "2,3,4,1 10,3,4,1 1,4,6,3 9,4,6,3 7,5,2,2 2,7,12,2 3,9,10,1 4,10,8,1 5,11,6,1 6,12,4,1 7,13,2,1", "#ff8f84": "2,4,2,2" },
  check: { "#6fd0bb": "13,3,2,2 11,5,2,2 9,7,2,2 7,9,2,2 5,11,2,2 3,9,2,2 1,7,2,2" },
  skip: { "#f4ead2": "2,3,2,10 4,4,1,8 5,5,1,6 6,6,1,4 7,7,1,2 8,3,2,10 10,4,1,8 11,5,1,6 12,6,1,4 13,7,1,2" },
};
export function icon(name, size = 16, title = "") {
  const d = ICONS[name]; if (!d) return document.createTextNode("");
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 16 16"); svg.setAttribute("width", size); svg.setAttribute("height", size);
  svg.setAttribute("shape-rendering", "crispEdges"); svg.setAttribute("class", "ico ico-" + name);
  if (title) { svg.setAttribute("role", "img"); svg.setAttribute("aria-label", title); } else svg.setAttribute("aria-hidden", "true");
  for (const [fill, rects] of Object.entries(d)) for (const r of rects.trim().split(/\s+/)) {
    if (!r) continue;
    const [x, y, w, hh] = r.split(",").map(Number);
    const e = document.createElementNS(ns, "rect");
    e.setAttribute("x", x); e.setAttribute("y", y); e.setAttribute("width", w); e.setAttribute("height", hh); e.setAttribute("fill", fill);
    svg.append(e);
  }
  return svg;
}

// ---------- thông báo ----------
export function toast(text, kind = "") {
  const box = $("#toasts"); if (!box) return;
  const t = h("div.toast" + (kind ? ".toast--" + kind : ""), { role: "status" }, text);
  box.append(t);
  while (box.children.length > 3) box.firstChild.remove();
  setTimeout(() => { t.classList.add("out"); setTimeout(() => t.remove(), 300); }, 2600);
}

/** Hộp xác nhận pixel. Trả Promise<boolean>. */
export function confirmBox(title, text, yes = "Đồng ý", no = "Thôi", danger = false) {
  return new Promise((ok) => {
    const done = (v) => { wrap.remove(); ok(v); };
    const wrap = h("div.modal", { role: "dialog", "aria-modal": "true", "aria-label": title },
      h("div.card.card--confirm",
        h("h2", title), h("p.sub", text),
        h("div.actions",
          h("button.btn" + (danger ? ".btn--danger" : ".btn--primary"), { id: "cfYes", onclick: () => done(true) }, yes),
          h("button.btn", { id: "cfNo", onclick: () => done(false) }, no))));
    wrap.addEventListener("keydown", (e) => { if (e.key === "Escape") { e.stopPropagation(); done(false); } });
    document.body.append(wrap);
    $("#cfNo", wrap).focus();
  });
}

/** Hộp nhiều lựa chọn: choices = [{ label, value, kind: "primary"|"danger"|"" }]. Esc / bấm nền ⇒ null. */
export function choiceBox(title, text, choices) {
  return new Promise((ok) => {
    const done = (v) => { wrap.remove(); ok(v); };
    const wrap = h("div.modal", { role: "dialog", "aria-modal": "true", "aria-label": title, onclick: (e) => { if (e.target === wrap) done(null); } },
      h("div.card.card--confirm", h("h2", title), h("p.sub", text),
        h("div.actions", choices.map((c, i) => h("button.btn" + (c.kind ? ".btn--" + c.kind : ""), { data: { choice: String(c.value) }, id: "ch" + i, onclick: () => done(c.value) }, c.label)))));
    wrap.addEventListener("keydown", (e) => { if (e.key === "Escape") { e.stopPropagation(); done(null); } });
    document.body.append(wrap);
    $("#ch0", wrap)?.focus();
  });
}
