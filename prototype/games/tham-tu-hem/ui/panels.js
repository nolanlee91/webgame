// Bảng phủ: thẩm vấn, sổ tay (vật chứng / lời khai / từ khoá / nhân vật), bảng suy luận (ghim + dây đỏ, kéo-thả hoặc chạm chọn), chọn vật chứng, thẻ trong thoại.
import { h, $, $$, icon, toast } from "./dom.js?v=t1";
import { portraitEl, accentOf } from "./art.js?v=t1";
import { renderText } from "./dialog.js?v=t1";
import { topicsOf, stmtList, peopleList, wordsOfKind, boardFilled } from "../core/engine.js?v=t1";
import { KINDS } from "../core/validate.js?v=t1";
import { accuse } from "./screens.js?v=t1";

export const KIND_NAME = { ai: "Ai", luc: "Lúc nào", o: "Ở đâu", vat: "Vật gì", cach: "Cách nào", vi: "Vì sao", khac: "Khác" };
const narrow = () => innerWidth < 900;

// ---------- thẻ dùng chung ----------
const hue = (id) => { let x = 7; for (const ch of String(id)) x = (x * 31 + ch.charCodeAt(0)) >>> 0; return x % 360; };
export function clueIcon(id, name, big = false) {
  return h("span.cicon" + (big ? ".big" : ""), { style: { "--h": hue(id) }, "aria-hidden": "true" }, h("i"), (name || id).trim().charAt(0).toUpperCase());
}
export function clueCard(app, id, { sel = false, onclick = null, attr = "clue" } = {}) {
  const k = app.G.c.clues[id];
  return h("button.ccard" + (sel ? ".sel" : ""), { type: "button", data: { [attr]: id }, "aria-pressed": sel ? "true" : "false", onclick }, clueIcon(id, k.name), h("b", k.name));
}
export function dialogCard(app, it) {
  const c = app.G.c;
  if (it.t === "clue") { const k = c.clues[it.id]; return h("div.dcard.dcard--clue", h("small.dcap", icon("book", 16), " Vật chứng mới"), h("div.drow", clueIcon(it.id, k.name, true), h("div", h("b", k.name), h("p", renderText(k.desc, c.words))))); }
  if (it.t === "stmt") { const st = c.stmts[it.id]; return h("div.dcard.dcard--stmt", h("small.dcap", icon("chat", 16), " Ghi vào sổ: lời khai"), h("div.drow", portraitEl(st.by, "neutral", c.id, 64, app.name(st.by)), h("div", h("b", app.name(st.by)), h("p.quote", "“", renderText(st.text, c.words), "”")))); }
  if (it.t === "loc") return h("div.dcard.dcard--loc", h("small.dcap", icon("pin", 16), " Địa điểm mới"), h("b.big", c.locations[it.id].name));
  if (it.t === "person") { const p = c.people[it.id]; return h("div.dcard", h("small.dcap", " Nhân vật mới"), h("div.drow", portraitEl(it.id, "neutral", c.id, 64, p.name), h("div", h("b", p.name), h("p", p.role || "")))); }
  return h("div");
}
function panel(title, onClose, ...body) {
  const full = typeof body[0] === "string" ? body.shift() : "";
  return h("div.panel" + full, { role: "dialog", "aria-label": title },
    h("header.panel-head", h("h2", title), h("button.btn.btn--sm.close", { type: "button", "data-close": "", title: "Đóng (Esc)", onclick: onClose }, "Đóng")),
    ...body);
}

// ---------- chọn vật chứng (modal, trên mọi bảng, dưới thoại) ----------
export function pickEvidence(app, { title, quote = "", by = null, confirm = "Đưa ra" }) {
  const { c, s } = app.G;
  return new Promise((ok) => {
    let sel = null;
    const done = (v) => { wrap.remove(); document.removeEventListener("keydown", key, true); ok(v); };
    const key = (e) => { if (e.key === "Escape") { e.stopPropagation(); e.preventDefault(); done(null); } };
    const go = h("button.btn.btn--primary#pickGo", { type: "button", disabled: true, onclick: () => done(sel) }, confirm);
    const info = h("p.pick-info", "Chọn một vật chứng.");
    const grid = h("div.cgrid", s.clues.map((id) => clueCard(app, id, { attr: "pick", onclick: (e) => {
      sel = id; for (const b of $$(".ccard", grid)) b.classList.toggle("sel", b.dataset.pick === id);
      info.replaceChildren(h("b", c.clues[id].name), ": ", ...renderText(c.clues[id].desc, c.words)); app.read(c.clues[id].desc);
      go.disabled = false; e.currentTarget.focus();
    } })));
    const wrap = h("div.modal.picker", { role: "dialog", "aria-modal": "true", "aria-label": title },
      h("div.card.pick-card",
        h("h2", title),
        quote ? h("blockquote.quote-box", by ? h("small", app.name(by) + ":") : null, " “", renderText(quote, c.words), "”") : null,
        s.clues.length ? grid : h("p.sub", "Chưa có vật chứng nào. Đi soi hiện trường trước đã."),
        info,
        h("div.actions", go, h("button.btn#pickCancel", { type: "button", onclick: () => done(null) }, "Thôi"))));
    document.addEventListener("keydown", key, true);
    document.body.append(wrap);
    (grid.querySelector("button") || $("#pickCancel", wrap)).focus();
  });
}

/** Vạch mâu thuẫn một lời khai: chọn vật chứng ⇒ tem ⇒ engine quyết bể / trật. */
export async function contradict(app, stmtId) {
  const { c } = app.G, st = c.stmts[stmtId];
  const clue = await pickEvidence(app, { title: "Vạch mâu thuẫn", quote: st.text, by: st.by, confirm: "Vạch ra" });
  if (!clue) return;
  await app.stamp("MÂU THUẪN!", "red", "", 480);
  await app.act({ type: "contradict", stmt: stmtId, clue }, { before: async (r) => {
    const ok = r.ev.some((e) => e.type === "break");
    if (ok) app.G.ui.mood[st.by] = "shock";
    await app.stamp(ok ? "BỂ!" : "TRẬT!", ok ? "red" : "gray", ok ? "Lời khai đã bể" : "Mất 1 uy tín", ok ? 750 : 600);
  } });
}

// ---------- thẩm vấn ----------
export function talk(app, pid) {
  const { c, s, ui } = app.G, p = c.people[pid];
  const topics = topicsOf(c, s, pid), stmts = stmtList(c, s, pid);
  if (p.bio) app.read(p.bio);
  const big = narrow() ? 120 : Math.min(300, innerHeight - 300);
  return panel(p.name, () => app.closeOverlay(),
    h("div.talk-body", { data: { pid } },
      h("div.talk-left", portraitEl(pid, ui.mood[pid] || "neutral", c.id, big, p.name, "big"),
        h("div.nameplate", { style: { "--who": accentOf(pid) } }, p.name, h("small", p.role || "")),
        p.bio ? h("p.bio", renderText(p.bio, c.words)) : null),
      h("div.talk-right",
        h("h3.sec", "Hỏi về"),
        topics.length ? h("div.topics", topics.map((t) => h("button.topic" + (t.asked ? ".asked" : ""), { type: "button", data: { topic: t.id }, onclick: () => app.act({ type: "ask", pid, topic: t.id }) },
          t.asked ? icon("check", 16) : h("span.new", "Mới"), h("span", t.topic)))) : h("p.sub", "Người này không có gì để kể thêm."),
        stmts.length ? h("h3.sec", "Lời khai đã ghi") : null,
        stmts.map((id) => stmtRow(app, id)),
        h("div.actions.talk-acts",
          h("button.btn#presentBtn", { type: "button", onclick: async () => {
            const clue = await pickEvidence(app, { title: `Đưa vật chứng cho ${p.name}`, confirm: "Đưa" });
            if (clue) app.act({ type: "present", pid, clue });
          } }, icon("book", 16), "Đưa vật chứng")))));
}
function stmtRow(app, id, { select = null, sel = false } = {}) {
  const { c, s } = app.G, st = c.stmts[id], broke = s.broke.includes(id);
  app.read(st.text);
  return h("div.stmt" + (broke ? ".broke" : "") + (sel ? ".sel" : ""), { data: { stmt: id } },
    select ? h("button.stmt-pick", { type: "button", onclick: select, "aria-pressed": sel ? "true" : "false" }, portraitEl(st.by, "neutral", c.id, 40, app.name(st.by)), h("span.quote", h("b", app.name(st.by) + ": "), "“", renderText(st.text, c.words), "”"))
      : h("p.quote", "“", renderText(st.text, c.words), "”"),
    broke ? h("span.mini-stamp", "ĐÃ BỂ") : !select ? h("button.btn.btn--sm.btn--red", { type: "button", data: { contra: id }, onclick: () => contradict(app, id) }, "Vạch mâu thuẫn") : null);
}

// ---------- sổ tay ----------
const TABS = [["clues", "Vật chứng"], ["stmts", "Lời khai"], ["words", "Từ khoá"], ["people", "Nhân vật"]];
export function notebook(app) {
  const { c, s, ui } = app.G;
  ui.nbSeen = s.clues.length + s.stmts.length;
  const tab = ui.nbTab || "clues";
  const tabs = h("div.tabs", { role: "tablist" }, TABS.map(([id, label]) => h("button.tab" + (tab === id ? ".on" : ""), { type: "button", role: "tab", "aria-selected": tab === id ? "true" : "false", data: { tab: id }, onclick: () => { ui.nbTab = id; ui.nbSel = null; app.refresh(); } },
    label, h("small", { stmts: s.stmts.length, clues: s.clues.length, words: s.words.length, people: peopleList(c, s).length }[id]))));
  let body;
  if (tab === "clues") {
    const sel = s.clues.includes(ui.nbSel) ? ui.nbSel : s.clues[0];
    const k = sel && c.clues[sel];
    if (k) app.read(k.desc);
    body = s.clues.length ? h("div.nb-split",
      h("div.cgrid", s.clues.map((id) => clueCard(app, id, { sel: id === sel, onclick: () => { ui.nbSel = id; app.refresh(); } }))),
      h("div.nb-detail", clueIcon(sel, k.name, true), h("h3", k.name), h("p", renderText(k.desc, c.words)),
        k.detail?.length ? h("button.btn.btn--sm", { type: "button", onclick: () => app.dialog.play(k.detail) }, "Xem kỹ") : null))
      : h("p.empty", "Chưa có vật chứng. Soi hiện trường để nhặt.");
  } else if (tab === "stmts") {
    const sel = s.stmts.includes(ui.nbSel) ? ui.nbSel : null;
    body = s.stmts.length ? h("div.nb-stmts",
      h("p.sub", "Chọn một lời khai rồi bấm “Vạch mâu thuẫn” để đưa vật chứng nói ngược lại."),
      s.stmts.map((id) => stmtRow(app, id, { sel: id === sel, select: () => { ui.nbSel = id; app.refresh(); } })),
      h("div.nb-act", sel && !s.broke.includes(sel)
        ? h("button.btn.btn--primary.btn--big#contraBtn", { type: "button", onclick: () => contradict(app, sel) }, "Vạch mâu thuẫn")
        : h("button.btn.btn--big", { type: "button", disabled: true }, sel ? "Lời khai này đã bể" : "Chọn một lời khai")))
      : h("p.empty", "Chưa ghi lời khai nào. Thẩm vấn nghi phạm để ghi.");
  } else if (tab === "words") {
    body = h("div.nb-words", s.words.length ? KINDS.filter((k) => wordsOfKind(c, s, k).length).map((k) => h("div.kind-row", h("h3.sec", KIND_NAME[k]), h("div.chips", wordsOfKind(c, s, k).map((w) => h("span.chip.k-" + k, c.words[w].text)))))
      : h("p.empty", "Từ khoá là chữ tô đỏ trong thoại, vật chứng và lời khai. Đọc tới là tự nhặt."));
  } else {
    body = h("div.nb-people", peopleList(c, s).map((pid) => { const p = c.people[pid]; if (p.bio) app.read(p.bio); return h("div.pcard2", portraitEl(pid, "neutral", c.id, 72, p.name), h("div", h("b", p.name), p.suspect ? h("span.tag", "Nghi phạm") : null, h("small", p.role || ""), p.bio ? h("p", renderText(p.bio, c.words)) : null)); }));
  }
  return panel("Sổ tay", () => app.closeOverlay(), ".full", tabs, h("div.nb-body", body));
}

// ---------- bảng suy luận ----------
export function board(app) {
  const { c, s, ui } = app.G;
  const slotSel = ui.slot && c.deduction.find((d) => d.id === ui.slot.ded)?.blanks?.[ui.slot.blank] ? ui.slot : null;
  const fill = (ded, blank, word) => app.act({ type: "fill", ded, blank, word }, { quiet: false }).then((r) => { if (!r.error) { ui.slot = null; ui.chip = null; } app.refresh(); });
  const notes = c.deduction.map((d, di) => {
    const parts = String(d.text).split(/(\{\w+\})/g).map((part) => {
      const m = part.match(/^\{(\w+)\}$/);
      if (!m) return part;
      const b = m[1], spec = d.blanks[b], w = s.board[d.id][b], on = slotSel && slotSel.ded === d.id && slotSel.blank === b;
      return h("button.slot.k-" + spec.kind + (w ? ".filled" : "") + (on ? ".on" : ""), { type: "button", data: { ded: d.id, blank: b, kind: spec.kind }, disabled: s.solved, title: KIND_NAME[spec.kind],
        onclick: () => {
          if (ui.chip && c.words[ui.chip]?.kind === spec.kind) return fill(d.id, b, ui.chip);
          ui.slot = on ? null : { ded: d.id, blank: b }; ui.chip = null; app.refresh();
        } }, w ? c.words[w].text : KIND_NAME[spec.kind] + "?");
    });
    return h("div.note", { style: { "--tilt": (di % 2 ? 1 : -1) + "px" } }, h("span.pinhead", icon("pin", 16)), h("p", parts), s.solved ? h("span.mini-stamp", "KHỚP") : null);
  });
  const kinds = slotSel ? [c.deduction.find((d) => d.id === slotSel.ded).blanks[slotSel.blank].kind] : [...new Set(c.deduction.flatMap((d) => Object.values(d.blanks).map((b) => b.kind)))];
  const tray = h("div.tray",
    h("small.lb", slotSel ? `Chọn từ khoá loại “${KIND_NAME[kinds[0]]}”` + (s.board[slotSel.ded][slotSel.blank] ? " · hoặc gỡ chỗ này" : "") : "Kéo từ khoá vào chỗ trống, hoặc chạm chỗ trống rồi chạm từ khoá"),
    h("div.tray-chips", kinds.map((k) => {
      const ws = wordsOfKind(c, s, k);
      return h("div.kind-row", h("span.kl", KIND_NAME[k]), ws.length ? ws.map((w) => h("button.chip.k-" + k + (ui.chip === w ? ".on" : ""), { type: "button", data: { word: w, kind: k }, disabled: s.solved,
        onpointerdown: (e) => dragChip(app, e, w, k, fill),
        onclick: () => { if (performance.now() - lastDrag < 350) return; if (slotSel) return fill(slotSel.ded, slotSel.blank, w); ui.chip = ui.chip === w ? null : w; app.refresh(); } }, c.words[w].text)) : h("span.none", "chưa nhặt được"));
    }),
    slotSel && s.board[slotSel.ded][slotSel.blank] ? h("button.btn.btn--sm#unfill", { type: "button", onclick: () => fill(slotSel.ded, slotSel.blank, null) }, "Gỡ") : null));
  const filled = boardFilled(c, s);
  const foot = h("footer.panel-foot",
    h("span.status", s.solved ? "Bảng đã khớp. Tới lúc vạch mặt!" : ui.boardMsg || (filled ? "Đủ chỗ rồi. Chốt thử?" : "Điền hết chỗ trống rồi chốt.")),
    s.solved ? h("button.btn.btn--primary.btn--big#accuseBtn2", { type: "button", onclick: () => accuse(app) }, "Vạch mặt thủ phạm")
      : h("button.btn.btn--primary.btn--big#commitBtn", { type: "button", disabled: !filled, onclick: async () => {
        await app.act({ type: "commit" }, { before: async (r) => {
          const w = r.ev.find((e) => e.type === "boardWrong");
          ui.boardMsg = w ? `Còn ${w.n} chỗ sai. (Không nói chỗ nào đâu!)` : "";
          await app.stamp(w ? `SAI ${w.n} CHỖ` : "ĐÃ KHỚP", w ? "gray" : "teal", w ? "Soi lại từ khoá" : "", 700);
        } });
      } }, "Chốt bảng"));
  const cork = h("div.cork", h("svg.string", { "aria-hidden": "true" }), notes);
  requestAnimationFrame(() => drawString(cork));
  return panel("Bảng suy luận", () => app.closeOverlay(), ".full", cork, tray, foot);
}
function drawString(cork) {
  const svg = cork.querySelector("svg.string"); if (!svg || !cork.isConnected) return;
  const r0 = cork.getBoundingClientRect();
  const pts = $$(".pinhead", cork).map((p) => { const r = p.getBoundingClientRect(); return [Math.round(r.left - r0.left + r.width / 2), Math.round(r.top - r0.top + r.height / 2 + cork.scrollTop)]; });
  svg.setAttribute("width", cork.scrollWidth); svg.setAttribute("height", cork.scrollHeight);
  svg.innerHTML = pts.length > 1 ? `<polyline points="${pts.map((p) => p.join(",")).join(" ")}" fill="none" stroke="#c8382e" stroke-width="3" stroke-linejoin="bevel"/>` : "";
}
let lastDrag = 0;
function dragChip(app, e, word, kind, fill) {
  if (e.button !== 0 && e.pointerType === "mouse") return;
  const chip = e.currentTarget, x0 = e.clientX, y0 = e.clientY;
  let ghost = null;
  const move = (ev) => {
    if (!ghost && Math.hypot(ev.clientX - x0, ev.clientY - y0) > 8) {
      ghost = chip.cloneNode(true); ghost.classList.add("ghost"); document.body.append(ghost);
      for (const sl of $$(`.slot[data-kind="${kind}"]:not(:disabled)`)) sl.classList.add("drop-ok");
    }
    if (ghost) { ev.preventDefault(); ghost.style.left = ev.clientX + "px"; ghost.style.top = ev.clientY + "px"; }
  };
  const up = (ev) => {
    removeEventListener("pointermove", move); removeEventListener("pointerup", up); removeEventListener("pointercancel", up);
    if (!ghost) return;
    ghost.remove(); for (const sl of $$(".slot.drop-ok")) sl.classList.remove("drop-ok");
    lastDrag = performance.now();
    const t = document.elementFromPoint(ev.clientX, ev.clientY)?.closest(".slot");
    if (t && t.dataset.kind === kind) fill(t.dataset.ded, t.dataset.blank, word);
    else if (t) toast(`Chỗ này cần từ khoá loại “${KIND_NAME[t.dataset.kind]}”`, "bad");
  };
  addEventListener("pointermove", move, { passive: false }); addEventListener("pointerup", up); addEventListener("pointercancel", up);
}

/** Chấm báo có thứ mới trong sổ tay. */
export function refreshBadges(app) {
  const { s, ui } = app.G;
  const dot = $("#btnNotebook .dot");
  if (dot && s) dot.hidden = !(s.clues.length + s.stmts.length > (ui.nbSeen || 0)) || app.top === "notebook";
}
