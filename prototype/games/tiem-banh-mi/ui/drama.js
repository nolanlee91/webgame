// Hội thoại Drama (SCREENS.md "Hội thoại Drama"): chân dung người nói (trái) + chủ tiệm (phải), câu mở, 2–3 lựa chọn có dòng chi phí,
// bảng hậu quả sau khi chọn ("Tiếp" nếu còn bước, "Xong" thì đóng). Ca tạm dừng; Esc không đóng (phải chọn).
// Chân dung (đợt 2 tự dùng khi manifest có): drama-portraits-hd "<npc>-<mood>" → portrait-expressions-hd "<vai>-<biểu cảm>" → portraits-hd "<vai>"
// → nhân vật trong cảnh characters "<vai>" → vòng tròn chữ cái đầu. Cùng cách Trà Sữa khớp tên người với frame.
import { icon } from "../render/atlas.js?v=b3";
import { EVENT } from "../data/events.js?v=b3";
import { DRAMA_FACES } from "../data/npcs.js?v=b3";
import { currentEvent, nodeOf, speakerInfo, textOf, byPersona, choiceVisible, affordable, fxSummary } from "../core/drama.js?v=b3";
import { PERSONAS } from "../data/lines-reply.js?v=b3";

const h = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
const FACE = { neutral: "waiting", happy: "happy", annoyed: "annoyed", surprised: "surprised" };
const BAKER = { neutral: "neutral", happy: "happy", annoyed: "concerned", surprised: "surprised" };

/** Chọn frame chân dung tốt nhất đang có cho người nói. Trả [alias, frame] hoặc null. */
export function portraitRef(atlas, { npc = null, role = "student", mood = "neutral", baker = false } = {}) {
  const m = FACE[mood] ? mood : "neutral";
  if (baker) {
    if (atlas.has("faces", `baker-${BAKER[m]}`)) return ["faces", `baker-${BAKER[m]}`];
    if (atlas.has("portraits", "baker")) return ["portraits", "baker"];
    return ["chars", "baker"];
  }
  if (npc && DRAMA_FACES.includes(npc)) {
    if (atlas.has("drama", `${npc}-${m}`)) return ["drama", `${npc}-${m}`];
    if (atlas.has("drama", `${npc}-neutral`)) return ["drama", `${npc}-neutral`];
  }
  if (atlas.has("faces", `${role}-${FACE[m]}`)) return ["faces", `${role}-${FACE[m]}`];
  if (atlas.has("portraits", role)) return ["portraits", role];
  return ["chars", role];
}
export function portraitEl(atlas, opts, px = 160, label = "") {
  const box = h("div", "portrait" + (opts.baker ? " me" : ""));
  const ref = portraitRef(atlas, opts);
  const f = ref && atlas.frame(ref[0], ref[1]);
  if (f) { const ic = icon(atlas, ref, ref[0] === "chars" ? Math.round(px * 1.15) : px, "ico pic"); box.appendChild(ic); box.dataset.frame = ref.join("/"); }
  else { const ini = h("div", "ini", (label || "?").trim().split(/\s+/).slice(-1)[0][0] || "?"); box.appendChild(ini); }
  if (label) box.appendChild(h("b", "pname", label));
  return box;
}

/** Dựng nội dung hội thoại vào `el`. onChoose(choiceId) ⇒ kết quả dispatch; onDone() khi đóng. */
export function buildEvent(el, state, atlas, { dispatch, onDone, persona }) {
  const d = currentEvent(state);
  if (!d) { onDone(); return; }
  const ev = EVENT[d.id], node = nodeOf(state, ev, d.node);
  const who = speakerInfo(state, d);
  el.textContent = "";
  el.dataset.event = ev.id;
  el.dataset.node = d.node;
  const stage = h("div", "drama-stage");
  stage.appendChild(portraitEl(atlas, { npc: who.npc, role: who.role, mood: node.mood }, 168, who.name));
  const talk = h("div", "drama-talk");
  talk.appendChild(h("p", "say who", textOf(state, d, node.line)));
  const me = byPersona(state, node.meBy, node.me);
  if (me) talk.appendChild(h("p", "say me", textOf(state, d, me)));
  stage.appendChild(talk);
  stage.appendChild(portraitEl(atlas, { baker: true, mood: node.mood === "annoyed" ? "annoyed" : node.mood === "happy" ? "happy" : "neutral" }, 120, state.shopName ? "Chủ tiệm" : ""));
  el.appendChild(stage);
  if (persona && PERSONAS[persona]) el.appendChild(h("p", "muted small", `Chủ tiệm kiểu ${PERSONAS[persona].short}. Ca tạm dừng, chọn một cách xử lý:`));
  const ch = h("div", "choices");
  for (const c of node.choices) {
    if (!choiceVisible(state, c)) continue;
    const b = h("button", "choice"); b.type = "button"; b.dataset.choice = c.id;
    b.appendChild(h("b", "", c.label));
    b.appendChild(h("small", "", c.hint || ""));
    const cost = c.fx?.money < 0 ? `${c.fx.money}k`.replace("-", "−") : c.roll ? `Hên xui ${Math.round(c.roll.p * 100)}%` : "";
    b.appendChild(h("span", "cost" + (c.roll ? " risk" : ""), cost));
    const ok = affordable(state, c);
    b.disabled = !ok;
    if (!ok) b.title = "Chưa đủ tiền / hàng / bánh cho lựa chọn này";
    b.addEventListener("click", () => {
      const r = dispatch({ type: "event", choice: c.id });
      const res = r?.events?.find((e) => e.type === "dramaResolved");
      if (!res) return;
      showResult(el, res, state, { onNext: () => buildEvent(el, state, atlas, { dispatch, onDone, persona }), onDone });
    });
    ch.appendChild(b);
  }
  el.appendChild(ch);
  try { ch.querySelector(".choice:not(:disabled)")?.focus({ preventScroll: true }); } catch {}
}
function showResult(el, res, state, { onNext, onDone }) {
  el.textContent = "";
  el.appendChild(h("h2", "", res.rolled === "win" ? "Hên quá!" : res.rolled === "lose" ? "Xui một chút…" : "Đã chọn"));
  el.appendChild(h("p", "say", "“" + res.say + "”"));
  if (res.aside) el.appendChild(h("p", "muted small", res.aside));
  if (res.fx?.length) { const row = h("div", "row fxrow"); for (const f of res.fx) row.appendChild(h("span", "qchip cut", f)); el.appendChild(row); }
  const foot = h("div", "row"); foot.style.marginTop = "12px";
  const b = h("button", "btn primary", res.goto ? "Tiếp" : "Xong"); b.type = "button"; b.dataset.act = res.goto ? "eventNext" : "eventDone";
  b.addEventListener("click", () => (res.goto ? onNext() : onDone()));
  foot.appendChild(b); el.appendChild(foot);
  try { b.focus({ preventScroll: true }); } catch {}
}
