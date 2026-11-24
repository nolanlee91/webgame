// Thoại kiểu visual novel: chân dung trái (thám tử, Tèo) / phải (người khác) đổi biểu cảm theo mood, gõ chữ dần, bấm để qua, nút Tua.
// Phát hàng đợi `show` của engine: dòng thoại + thẻ (vật chứng mới, ghi lời khai, địa điểm mới, nhân vật mới).
// Mỗi mục HIỆN RA thì gọi ctx.read(text) ⇒ nhặt [[từ khoá]]. Tua: chạy nhanh tới thẻ kế tiếp (thẻ vẫn hiện để không lỡ vật chứng), chữ bị tua vẫn tính là đã đọc.
import { h, clear, icon } from "./dom.js?v=t4";
import { segments, norm } from "../core/text.js?v=t4";
import { portraitEl, setPortrait, portraitSize, accentOf } from "./art.js?v=t4";
import { blip, play as sfx } from "./sfx.js?v=t4";

const LEFT = new Set(["me", "teo"]);
const CPS = 46; // ký tự / giây
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

export function renderText(text, words, cls = "w") {
  return segments(text, words).map((x) => (x.t === "word" ? h("b." + cls, { data: { word: x.id } }, x.v) : x.v));
}

export function createDialog(root, ctx) {
  let queue = [], idx = 0, typing = null, resolve = null, shown = 0, full = "", cur = null;
  const left = h("div.dlg-side.dlg-left"), right = h("div.dlg-side.dlg-right");
  const name = h("div.dlg-name"), text = h("div.dlg-text", { "aria-live": "polite" }), card = h("div.dlg-card");
  const more = h("span.dlg-more", { "aria-hidden": "true" }, "▼");
  const skip = h("button.btn.btn--sm.dlg-skip", { type: "button", title: "Tua (bỏ qua thoại tới thẻ kế tiếp)", onclick: (e) => { e.stopPropagation(); ff(); } }, icon("skip", 16), " Tua");
  const box = h("div.dlg-box", name, text, card, h("div.dlg-ctl", skip, more));
  const layer = h("div.dlg", { id: "dlg", hidden: true, onclick: (e) => { if (!e.target.closest(".dlg-skip")) next(); } }, h("div.dlg-stage", left, right), box);
  root.append(layer);
  const sides = { left: null, right: null };

  const pSize = () => portraitSize(Math.min(innerWidth < 700 ? 150 : 300, innerHeight * 0.36));
  function face(side, pid, mood, active) {
    const el = side === "left" ? left : right;
    if (!pid) { clear(el); sides[side] = null; return; }
    const { size, smooth } = pSize();
    let p = el.querySelector(".portrait");
    if (!p || p.dataset.pid !== pid) { clear(el); p = portraitEl(pid, mood, ctx.caseId(), size, ctx.name(pid)); el.append(p); }
    else setPortrait(p, pid, mood, ctx.caseId(), size, smooth, ctx.name(pid));
    p.dataset.pid = pid;
    if (active && p.dataset.lastMood !== mood) { p.classList.remove("pop"); void p.offsetWidth; p.classList.add("pop"); }
    p.dataset.lastMood = mood;
    sides[side] = pid;
    el.classList.toggle("on", !!active);
  }

  function showItem(it) {
    cur = it; clearInterval(typing); typing = null;
    card.hidden = true; text.hidden = false; clear(card);
    box.classList.remove("narr", "is-card");
    if (it.t === "line") {
      const l = norm(it);
      ctx.read(l.text);
      if (l.who === "narr") {
        box.classList.add("narr"); name.hidden = true;
        left.classList.remove("on"); right.classList.remove("on");
      } else {
        name.hidden = false; name.textContent = ctx.name(l.who);
        name.style.setProperty("--who", accentOf(l.who));
        const side = LEFT.has(l.who) ? "left" : "right";
        face(side, l.who, l.mood, true);
        const other = side === "left" ? "right" : "left";
        if (sides[other]) (other === "left" ? left : right).classList.remove("on");
      }
      typeOut(l.text, l.who);
    } else {
      box.classList.add("is-card"); name.hidden = true; text.hidden = true; card.hidden = false;
      ctx.read(ctx.textOf(it));
      card.append(ctx.card(it));
      more.hidden = false;
    }
  }
  function typeOut(t, who) {
    const segs = segments(t, ctx.words());
    full = segs.map((x) => x.v).join("");
    shown = 0; more.hidden = true;
    const draw = () => {
      clear(text);
      let left2 = shown;
      for (const s of segs) {
        if (left2 <= 0) break;
        const part = s.v.slice(0, left2); left2 -= s.v.length;
        text.append(s.t === "word" ? h("b.w", { data: { word: s.id } }, part) : part);
      }
    };
    if (reduced() || ctx.fast?.()) { shown = full.length; draw(); more.hidden = false; return; }
    const pitch = 0.8 + (Math.abs([...String(who)].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7)) % 7) / 10;
    let n = 0;
    typing = setInterval(() => {
      shown = Math.min(full.length, shown + 2);
      draw();
      if (who !== "narr") blip(pitch);
      if (shown >= full.length) { clearInterval(typing); typing = null; more.hidden = false; }
    }, 2000 / CPS);
    draw();
  }
  function finishTyping() { if (!typing) return false; clearInterval(typing); typing = null; shown = full.length; clear(text); text.append(...renderText(cur.text, ctx.words())); more.hidden = false; return true; }
  function next() {
    if (!resolve) return;
    if (finishTyping()) return;
    idx++;
    if (idx >= queue.length) return close();
    showItem(queue[idx]);
  }
  /** Tua: đọc hết các dòng tới thẻ kế tiếp (thẻ vẫn hiện), không có thẻ thì kết thúc. */
  function ff() {
    if (!resolve) return;
    finishTyping();
    let j = idx + 1;
    while (j < queue.length && queue[j].t === "line") { ctx.read(norm(queue[j]).text); j++; }
    if (j >= queue.length) { idx = queue.length; return close(); }
    idx = j; showItem(queue[idx]);
  }
  function close() {
    clearInterval(typing); typing = null;
    layer.hidden = true; document.body.classList.remove("dlg-open");
    const r = resolve; resolve = null; queue = []; idx = 0; clear(left); clear(right); sides.left = sides.right = null;
    r?.();
  }
  return {
    /** Phát danh sách mục (show của engine hoặc mảng lời thoại thô). Promise xong khi người chơi qua hết. */
    play(items) {
      const list = (items || []).map((x) => (x && x.t ? x : { t: "line", ...norm(x) })).filter((x) => x.t !== "line" || x.text);
      if (!list.length) return Promise.resolve();
      if (resolve) { queue.push(...list); return new Promise((r) => { const prev = resolve; resolve = () => { prev(); r(); }; }); }
      queue = list; idx = 0;
      layer.hidden = false; document.body.classList.add("dlg-open");
      return new Promise((r) => { resolve = r; showItem(queue[0]); layer.focus?.(); });
    },
    next, ff,
    get open() { return !!resolve; },
  };
}
