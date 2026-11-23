// Hội thoại Drama (SCREENS.md "Hội thoại Drama"): chân dung người nói (trái) + cô chủ (phải), câu mở, 2–4 lựa chọn có dòng chi phí,
// bảng hậu quả sau khi chọn ("Tiếp" nếu còn bước, "Xong" thì đóng). Trong ca: đồng hồ + bếp dừng (sh.dialog). Giữa hai ngày: hiện trên
// bảng Chuẩn bị. Lớp riêng (#drama) nằm trên bảng phủ, không đụng ui/overlays.js. Esc không đóng (phải chọn).
// Độc thoại (npc "owner") chỉ một chân dung. Chân dung (đợt 2 tự dùng khi manifest có, qua HD_SHEETS / LAZY_SHEETS):
// drama-portraits-hd "<npc>-<mood>" → portrait-expressions-hd "<vai>-<biểu cảm>" → portraits-hd "<vai>" → characters "<vai>" → chữ cái đầu.
import { icon } from "../render/atlas.js?v=c3";
import { EVENT } from "../data/events.js?v=c3";
import { DRAMA_FACES } from "../data/npcs.js?v=c3";
import { currentEvent, nodeOf, speakerInfo, textOf, byPersona, choiceVisible, affordable } from "../core/drama.js?v=c3";

const h = (tag, cls, text, parent) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined && text !== null) e.textContent = text; parent?.appendChild(e); return e; };
const FACE = { neutral: "waiting", happy: "happy", annoyed: "annoyed", surprised: "surprised" };
const OWNER = { neutral: "neutral", happy: "happy", annoyed: "concerned", surprised: "surprised" };
const NO_FACES = new Set(["helper", "owner"]);

/** Frame chân dung tốt nhất đang có. Trả [alias, frame]. */
export function portraitRef(atlas, { npc = null, role = "student", mood = "neutral", owner = false } = {}) {
  const m = FACE[mood] ? mood : "neutral";
  if (owner || role === "owner") {
    if (atlas.has("faces", `owner-${OWNER[m]}`)) return ["faces", `owner-${OWNER[m]}`];
    if (atlas.has("portraits", "owner")) return ["portraits", "owner"];
    return ["chars", "owner"];
  }
  if (npc && DRAMA_FACES.includes(npc)) {
    if (atlas.has("drama", `${npc}-${m}`)) return ["drama", `${npc}-${m}`];
    if (atlas.has("drama", `${npc}-neutral`)) return ["drama", `${npc}-neutral`];
  }
  if (!NO_FACES.has(role) && atlas.has("faces", `${role}-${FACE[m]}`)) return ["faces", `${role}-${FACE[m]}`];
  if (atlas.has("portraits", role)) return ["portraits", role];
  return ["chars", role];
}
function portraitEl(atlas, opts, px, label) {
  const box = h("div", "dportrait" + (opts.owner ? " me" : ""));
  const ref = portraitRef(atlas, opts);
  const f = ref && atlas.frame(ref[0], ref[1]);
  if (f) { box.appendChild(icon(atlas, ref, ref[0] === "chars" ? Math.round(px * 1.2) : px, "ico pic")); box.dataset.frame = ref.join("/"); }
  else h("div", "ini", (label || "?").trim().split(/\s+/).slice(-1)[0][0] || "?", box);
  if (label) h("b", "pname", label, box);
  return box;
}

const CSS = `
.drama-ov { z-index: 55; }
.drama-sheet { width: min(640px, 100%); }
.drama-stage { display: grid; grid-template-columns: auto 1fr auto; gap: 10px; align-items: end; margin-bottom: 6px; }
.drama-stage.mono { grid-template-columns: auto 1fr; }
.dportrait { position: relative; width: 132px; height: 124px; border-radius: 14px; background: linear-gradient(#f3dfb9, #e9c993); overflow: hidden; display: grid; place-items: end center; box-shadow: 0 0 0 2px var(--cream3) inset; }
.dportrait.me { width: 100px; height: 100px; background: linear-gradient(#dfe9e4, #c3d9cf); }
.dportrait .pic { image-rendering: pixelated; }
.dportrait .ini { font: 800 44px/1 inherit; color: var(--brown); align-self: center; }
.dportrait .pname { position: absolute; left: 4px; right: 4px; bottom: 4px; background: rgba(255, 250, 240, .94); color: var(--ink); border-radius: 8px; font-size: 11.5px; text-align: center; padding: 1px 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.drama-talk { display: flex; flex-direction: column; gap: 6px; }
.drama-talk .say { margin: 0; background: #fffaf0; border-radius: 12px; padding: 8px 11px; box-shadow: 0 0 0 1.5px var(--cream3) inset; font-weight: 600; }
.drama-talk .say.me { background: #e9f3ee; font-weight: 500; font-style: italic; }
.drama-sheet .fxrow { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.drama-sheet .fxchip { background: var(--amber-l); color: var(--ink); border-radius: 9px; padding: 2px 9px; font-size: 12.5px; font-weight: 700; }
.drama-sheet .choice .cost.risk { color: var(--indigo); }
@media (max-width: 560px) {
  .drama-stage { grid-template-columns: auto auto; justify-content: space-between; }
  .drama-stage .drama-talk { grid-column: 1 / -1; grid-row: 2; }
  .drama-stage.mono { grid-template-columns: auto; }
  .dportrait { width: 104px; height: 98px; } .dportrait.me { width: 82px; height: 82px; }
}`;

/** Lớp hội thoại Drama. act(action) ⇒ kết quả apply; state() ⇒ trạng thái hiện tại. */
export function createDrama(atlas, { act, state }) {
  if (!document.getElementById("drama-css")) { const st = document.createElement("style"); st.id = "drama-css"; st.textContent = CSS; document.head.appendChild(st); }
  const layer = h("div", "overlay drama-ov", null, document.body);
  layer.id = "drama"; layer.hidden = true;
  const sheet = h("div", "sheet drama-sheet", null, layer);
  sheet.setAttribute("role", "dialog"); sheet.setAttribute("aria-modal", "true");
  let open = false, done = null;
  const close = () => {
    open = false; layer.hidden = true; sheet.textContent = "";
    if (document.getElementById("overlay")?.hidden !== false) document.body.classList.remove("ov");
    const f = done; done = null; f?.();
  };
  function build() {
    const s = state();
    const d = currentEvent(s);
    if (!d) { close(); return; }
    const ev = EVENT[d.id], node = nodeOf(s, ev, d.node);
    const who = speakerInfo(s, d);
    sheet.textContent = "";
    sheet.dataset.event = ev.id; sheet.dataset.node = d.node;
    h("p", "muted small", s.shift ? "Ca tạm dừng, bếp cũng dừng. Chọn một cách xử lý:" : `Trước giờ mở quán ngày ${s.day}:`, sheet);
    const stage = h("div", "drama-stage" + (who.mono ? " mono" : ""), null, sheet);
    stage.appendChild(portraitEl(atlas, { npc: who.npc, role: who.role, mood: node.mood, owner: who.mono }, 132, who.mono ? "Cô chủ" : who.name));
    const talk = h("div", "drama-talk", null, stage);
    h("p", "say who", textOf(s, d, node.line), talk);
    const me = byPersona(s, node.meBy, node.me);
    if (me) h("p", "say me", textOf(s, d, me), talk);
    if (!who.mono) stage.appendChild(portraitEl(atlas, { owner: true, mood: node.mood === "annoyed" ? "annoyed" : node.mood === "happy" ? "happy" : node.mood === "surprised" ? "surprised" : "neutral" }, 100, "Cô chủ"));
    const list = h("div", "choices", null, sheet);
    for (const c of node.choices) {
      if (!choiceVisible(s, c)) continue;
      const ok = affordable(s, c);
      const b = h("button", "choice" + (!c.fx?.money || c.fx.money >= 0 ? " free" : ""), null, list);
      b.type = "button"; b.dataset.choice = c.id; b.disabled = !ok;
      if (!ok) b.title = "Chưa đủ tiền / hàng cho lựa chọn này";
      const l = h("div", "", null, b); h("b", "", c.label, l); h("small", "", c.hint || "", l);
      const cost = c.fx?.money < 0 ? `−${-c.fx.money}k` : c.roll ? `Hên xui ${Math.round(c.roll.p * 100)}%` : "Miễn phí";
      h("span", "cost" + (c.roll && !(c.fx?.money < 0) ? " risk" : ""), cost, b);
      b.addEventListener("click", () => {
        const r = act({ type: "event", choice: c.id });
        const res = r?.events?.find((e) => e.type === "dramaResolved");
        if (res) result(res);
      });
    }
    setTimeout(() => { try { list.querySelector(".choice:not(:disabled)")?.focus({ preventScroll: true }); } catch {} }, 30);
  }
  function result(res) {
    sheet.textContent = "";
    h("h2", "", res.rolled === "win" ? "Hên quá!" : res.rolled === "lose" ? "Xui một chút…" : "Đã chọn", sheet);
    h("p", "say", "“" + res.say + "”", sheet);
    if (res.fx?.length) { const row = h("div", "fxrow", null, sheet); for (const f of res.fx) h("span", "fxchip", f, row); }
    const foot = h("div", "footer", null, sheet);
    const b = h("button", "btn primary", res.goto ? "Tiếp" : "Xong", foot);
    b.type = "button"; b.dataset.act = res.goto ? "eventNext" : "eventDone";
    b.addEventListener("click", () => (res.goto ? build() : close()));
    setTimeout(() => { try { b.focus({ preventScroll: true }); } catch {} }, 30);
  }
  return {
    /** Mở (hoặc dựng lại) hội thoại của sự kiện đang chờ. onDone() khi đóng. */
    open(onDone) {
      if (!currentEvent(state())) { onDone?.(); return; }
      if (onDone) done = onDone;
      open = true; layer.hidden = false; document.body.classList.add("ov");
      build();
    },
    close,
    get isOpen() { return open; },
  };
}
