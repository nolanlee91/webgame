// Thoại kiểu visual novel: chân dung trái (thám tử, Tèo) / phải (người khác) đổi biểu cảm theo mood, gõ chữ dần, bấm để qua, nút Tua.
// Phát hàng đợi `show` của engine: dòng thoại + thẻ (vật chứng mới, ghi lời khai, địa điểm mới, nhân vật mới).
// Mỗi mục HIỆN RA thì gọi ctx.read(text) ⇒ nhặt [[từ khoá]]. Tua: chạy nhanh tới thẻ kế tiếp (thẻ vẫn hiện để không lỡ vật chứng), chữ bị tua vẫn tính là đã đọc.
// Đọc nhanh (D12, công tắc nhớ trong localStorage "tth.fastread"): mọi dòng liền nhau tới thẻ kế tiếp hiện CẢ ĐOẠN một lần, không gõ chữ dần;
// một chạm qua cả đoạn. Khác Tua: chữ vẫn hiện để đọc, chỉ bớt chạm.
import { h, clear, icon } from "./dom.js?v=t10";
import { segments, norm } from "../core/text.js?v=t10";
import { portraitEl, setPortrait, portraitSize, accentOf } from "./art.js?v=t10";
import { blip, play as sfx } from "./sfx.js?v=t10";

const LEFT = new Set(["me", "teo"]);
const CPS = 46; // ký tự / giây
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
export const FASTREAD_KEY = "tth.fastread";
export function fastRead() { try { return localStorage.getItem(FASTREAD_KEY) === "1"; } catch { return false; } }
export function setFastRead(on) { try { localStorage.setItem(FASTREAD_KEY, on ? "1" : "0"); } catch {} }

export function renderText(text, words, cls = "w") {
  return segments(text, words).map((x) => (x.t === "word" ? h("b." + cls, { data: { word: x.id } }, x.v) : x.v));
}

export function createDialog(root, ctx) {
  let queue = [], idx = 0, typing = null, resolve = null, shown = 0, full = "", cur = null, end = 0, heard = false;
  const left = h("div.dlg-side.dlg-left"), right = h("div.dlg-side.dlg-right");
  const name = h("div.dlg-name"), text = h("div.dlg-text", { "aria-live": "polite" }), card = h("div.dlg-card");
  const more = h("span.dlg-more", { "aria-hidden": "true" }, "▼");
  const skip = h("button.btn.btn--sm.dlg-skip", { type: "button", title: "Tua (bỏ qua thoại tới thẻ kế tiếp)", onclick: (e) => { e.stopPropagation(); ff(); } }, icon("skip", 16), " Tua");
  const fastBtn = h("button.btn.btn--sm.dlg-fast", { type: "button", id: "fastReadBtn", "aria-pressed": String(fastRead()), title: "Đọc nhanh: hiện cả đoạn thoại một lần, chạm một lần để qua", onclick: (e) => { e.stopPropagation(); toggleFast(); } }, h("span.dlg-fast-box", { "aria-hidden": "true" }), " Đọc nhanh");
  const box = h("div.dlg-box", name, text, card, h("div.dlg-ctl", fastBtn, skip, more));
  const layer = h("div.dlg", { id: "dlg", hidden: true, onclick: (e) => { if (!e.target.closest(".dlg-ctl button")) next(); } }, h("div.dlg-stage", left, right), box);
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
    cur = it; end = idx + 1; clearInterval(typing); typing = null;
    card.hidden = true; text.hidden = false; clear(card);
    box.classList.remove("narr", "is-card", "fastread");
    if (it.t === "line" && fastRead()) return showPassage();
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
  /** Đọc nhanh: các dòng idx..(trước thẻ kế tiếp) hiện cùng lúc, mỗi dòng có tên người nói; chân dung theo người nói cuối mỗi bên. */
  function showPassage() {
    let j = idx;
    while (j < queue.length && queue[j].t === "line") j++;
    end = j;
    box.classList.add("fastread"); name.hidden = true;
    clear(text); more.hidden = false;
    let last = null;
    heard = false;
    for (let k = idx; k < j; k++) {
      const l = norm(queue[k]);
      if (ctx.read(l.text)) heard = true;
      const row = h("p.dlg-line" + (l.who === "narr" ? ".narr" : ""));
      if (l.who !== "narr") {
        row.append(h("b.dlg-who", { style: { "--who": accentOf(l.who) } }, ctx.name(l.who) + ": "));
        face(LEFT.has(l.who) ? "left" : "right", l.who, l.mood, false);
        last = l.who;
      }
      row.append(...renderText(l.text, ctx.words()));
      text.append(row);
    }
    left.classList.toggle("on", !!last && LEFT.has(last));
    right.classList.toggle("on", !!last && !LEFT.has(last));
    if (!last) { left.classList.remove("on"); right.classList.remove("on"); }
    text.scrollTop = 0;
  }
  function toggleFast() {
    const on = !fastRead();
    setFastRead(on); fastBtn.setAttribute("aria-pressed", String(on));
    // đổi ngay trên đoạn đang xem: bật ⇒ hiện cả đoạn từ dòng hiện tại; tắt ⇒ về từng dòng, từ dòng hiện tại
    heard = false;
    if (resolve && cur && cur.t === "line") showItem(queue[idx]);
    // mỗi lần bấm đúng 1 tiếng: hiện cả đoạn mà nhặt được từ khoá mới thì tiếng "keyword" đã kêu, không thêm "click"
    if (!heard) sfx("click");
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
    // Đọc nhanh, đoạn dài hơn khung (màn thấp / xoay ngang): chạm cuộn xuống phần chưa đọc trước, hết đoạn mới qua
    if (box.classList.contains("fastread") && text.scrollTop + text.clientHeight < text.scrollHeight - 4) {
      text.scrollTop += Math.max(40, text.clientHeight - 28);
      return;
    }
    idx = Math.max(idx + 1, end);
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
      queue = list; idx = 0; end = 0;
      layer.hidden = false; document.body.classList.add("dlg-open");
      return new Promise((r) => { resolve = r; showItem(queue[0]); layer.focus?.(); });
    },
    next, ff,
    /** Rời vụ giữa đoạn thoại (nút Về bản đồ trên thanh trên, TTH-01): đóng khung thoại, KHÔNG chạy tiếp phần sau lời thoại. */
    cancel() { if (!resolve) return; clearInterval(typing); typing = null; layer.hidden = true; document.body.classList.remove("dlg-open"); resolve = null; queue = []; idx = 0; clear(left); clear(right); sides.left = sides.right = null; },
    get open() { return !!resolve; },
  };
}
