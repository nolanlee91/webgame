// Quầy ráp (cột phải desktop / dưới cảnh trên mobile): lò, phiếu ghim, ổ bánh cận cảnh (loaf-layers), dải bước, ô nguyên liệu,
// Hoàn tác / Đổ / Giao, và khay thối tiền khi khách trả tiền. Dựng lại DOM khi khoá trạng thái đổi; phần động (thanh lò, độ giòn,
// lò than) cập nhật mỗi khung. Mọi thao tác đi qua dispatch(action) ⇒ core/apply.js.
import { paint, crisp as crispScale, icon } from "../render/atlas.js?v=b1";
import { loafLayers } from "../render/loafview.js?v=b1";
import { STEPS, STEP_NAME } from "../core/board.js?v=b1";
import { batchSec, batchLevel, ovenOf, caseCap, CRUST } from "../core/oven.js?v=b1";
import { autoChangeAllowed, customer, orderPrice } from "../core/shift.js?v=b1";
import { sumBills } from "../core/money.js?v=b1";
import { itemSpec, itemSteps, loafName, bachucPrice } from "../core/order.js?v=b1";
import { STOCK, NAMES, LEVEL_NAMES, SPREADS, FILLINGS, VEG_IDS, SAUCES, WRAPS, TOASTER, FLOAT_BILLS, RECIPE } from "../data/economy.js?v=b1";
import { QUIRKS } from "../data/quirks.js?v=b1";

const h = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
const LV_ORDER = [2, 3, 1, 0]; // chạm lần đầu = vừa (mặc định công thức), rồi nhiều → ít → không
const nextLv = (cur) => (cur === 0 ? 2 : LV_ORDER[(LV_ORDER.indexOf(cur) + 1) % 4]);
const LEVEL_LABEL = { raw: "Phôi", pale: "Vàng nhạt", golden: "Vàng óng!", dark: "Xém!", burnt: "Cháy rồi" };
export const QMARK = { no: "", down: "up", up: "up", crisp: "crisp", cut: "cut" };
export function quirkChips(it) {
  const box = h("span", "q");
  for (const q of it.quirks) { const Q = QUIRKS[q]; box.appendChild(h("span", "qchip " + (Q.mark === "crisp" ? "crisp" : Q.mark === "cut" ? "cut" : Q.mark === "up" ? "up" : ""), Q.label)); }
  if (it.bag) box.appendChild(h("span", "qchip cut", "bỏ túi"));
  return box;
}

export function createBench(root, atlas, dispatch, hooks = {}) {
  let key = "", picked = {}, showBook = false, loafScale = 1;
  const dyn = { bars: [], crispNum: null, toastBar: null };

  function ovenBox(state) {
    const sh = state.shift, box = h("div", "box ovenbox");
    const O = ovenOf(state);
    dyn.bars = [];
    sh.oven.forEach((b, i) => {
      const row = h("div", "oven-row");
      const lbl = h("span", "oven-lbl", b ? "" : "Lò trống");
      const bar = h("div", "crust");
      const max = O.dark + 4;
      const zone = h("i", "zone"); zone.style.left = (O.golden[0] / max) * 100 + "%"; zone.style.width = ((O.golden[1] - O.golden[0]) / max) * 100 + "%";
      bar.appendChild(zone);
      const mark = h("i", "mark"); bar.appendChild(mark);
      const btn = h("button", "btn small", b ? "Rút" : "Bỏ mẻ");
      btn.type = "button"; btn.dataset.act = b ? "pull" : "bake"; btn.dataset.slot = i;
      btn.addEventListener("click", () => dispatch({ type: b ? "pull" : "bake", slot: i }));
      if (!b && (state.stock.phoi || 0) <= 0 && (state.stock.gas || 0) > 0) btn.title = "Hết phôi";
      row.append(lbl, bar, btn);
      box.appendChild(row);
      dyn.bars.push({ b, mark, lbl, btn, max, slot: i });
    });
    const meta = h("div", "meta");
    const cs = sh.case;
    const avg = cs.length ? Math.round(cs.reduce((a, l) => a + l.crisp, 0) / cs.length) : 0;
    meta.appendChild(h("span", "", `Tủ kính: ${cs.length}/${caseCap(state)} ổ${cs.length ? ` · giòn TB ${avg}` : ""}`));
    meta.appendChild(h("span", "", `Phôi ${state.stock.phoi} · Gas ${state.stock.gas} mẻ`));
    box.appendChild(meta);
    return box;
  }

  function ticket(state) {
    const sh = state.shift, b = sh.boards[sh.sel];
    const c = b.cid !== null ? customer(state, b.cid) : null;
    if (!c && sh.paying !== null) return h("div", "ticket empty", `Đã giao ổ cho ${customer(state, sh.paying)?.name || "khách"}. Thối tiền bên dưới.`);
    if (!c) {
      const t = h("div", "ticket empty", sh.customers.some((x) => x.phase === "wait") ? "Chạm một khách (hoặc phiếu bên dưới) để ghim phiếu lên thớt." : "Chưa có khách chờ. Tranh thủ nướng bánh!");
      return t;
    }
    const t = h("div", "ticket");
    t.dataset.cid = c.id;
    const head = h("div", "t-head");
    head.appendChild(h("b", "", c.nhuCu && !showBook ? "Như cũ" : c.items.length > 1 ? `${c.items.length} ổ` : loafName(c.items[0])));
    head.appendChild(h("span", "who", c.name));
    head.appendChild(h("span", "price", orderPrice(c) + "k"));
    t.appendChild(head);
    if (c.items.length > 1) {
      const tabs = h("div", "t-items");
      c.items.forEach((it, i) => {
        const bt = h("button", "t-item" + (i === b.item ? " on" : c.filled[i] ? " done" : ""), `${i + 1}. ${loafName(it)}${it.quirks.length ? " *" : ""}`);
        bt.type = "button"; bt.dataset.item = i; bt.disabled = !!c.filled[i] || !!b.loaf;
        bt.addEventListener("click", () => dispatch({ type: "selectItem", idx: i }));
        tabs.appendChild(bt);
      });
      t.appendChild(tabs);
    }
    const it = c.items[b.item];
    if (c.nhuCu && !showBook) {
      const p = h("p", "t-spec", "Khách quen gọi “như cũ”. Nhớ không? ");
      const bk = h("button", "btn small", "Mở Sổ khách quen"); bk.type = "button"; bk.dataset.act = "book";
      bk.addEventListener("click", () => { showBook = true; key = ""; });
      p.appendChild(bk); t.appendChild(p);
      return t;
    }
    if (it.recipe === "bachuc") {
      t.appendChild(h("p", "t-spec", `Ổ ${it.target} ngàn: tự chọn phết + nhân cho vừa giá (lệch ≤ 3k).`));
      if (b.loaf) t.appendChild(h("p", "t-spec", `Giá ổ đang ráp: ${bachucPrice(b.loaf)}k`));
      return t;
    }
    const q = quirkChips(it); if (q.childNodes.length) t.appendChild(q);
    const st = itemSteps(it), sp = h("div", "t-spec");
    const line = (lbl, v) => { if (!v) return; const d = h("div"); d.appendChild(h("b", "", lbl + ": ")); d.appendChild(document.createTextNode(v)); sp.appendChild(d); };
    line("Phết", st.spreads.join(", ") || "không");
    line("Nhân", st.fills.join(", ") || "không");
    line("Rau dưa", st.veg.length === 4 ? "đủ" : st.veg.join(", ") || "không");
    line("Ớt", st.ot + (st.sauces.length ? " · " + st.sauces.join(", ") : ""));
    line("Gói", it.bag ? "bỏ túi" : WRAPS[it.wrap].name);
    t.appendChild(sp);
    return t;
  }

  function loafView(state) {
    const sh = state.shift, b = sh.boards[sh.sel], l = b.loaf;
    const wrap = h("div", "loafwrap");
    wrap.id = "loafView";
    dyn.crispNum = null; dyn.toastBar = null;
    if (!l) { wrap.appendChild(h("div", "empty-loaf", b.cid === null ? "Thớt trống" : sh.case.length ? "Lấy một ổ từ tủ kính để bắt đầu." : "Tủ kính hết bánh: nướng mẻ mới!")); wrap.dataset.stage = "empty"; return wrap; }
    const names = loafLayers(l);
    wrap.dataset.stage = names.join("|");
    const v = h("div", "loafview");
    const f0 = atlas.frame("loaf", names[0]) || atlas.frame("loaf", "loaf-open-back");
    const sc = loafScale;
    if (f0) { v.style.width = f0.w * sc + "px"; v.style.height = f0.h * sc + "px"; }
    names.forEach((n, i) => { const e = h("i", "spr" + (i === names.length - 1 ? " in" : "")); paint(e, atlas.frame("loaf", n), sc); e.dataset.layer = n; v.appendChild(e); });
    wrap.appendChild(v);
    const cn = h("span", "crispnum"); wrap.appendChild(cn); dyn.crispNum = cn;
    if (l.toastT0 !== null) { const tb = h("div", "toastbar"); tb.appendChild(h("i")); wrap.appendChild(tb); dyn.toastBar = tb; }
    return wrap;
  }

  function stepsStrip(b) {
    const ul = h("ol", "steps");
    STEPS.forEach((s, i) => { const li = h("li", "", STEP_NAME[s]); if (b.loaf && i <= b.step) li.className = "done"; if (b.loaf && i === b.step + 1) li.className = "now"; ul.appendChild(li); });
    return ul;
  }

  const ING_ICON = { pate: "pate", bo: "bo", mayo: "mayo", "do-chua": "do-chua", "dua-leo": "dua-leo", "rau-mui": "rau-mui", "hanh-la": "hanh-la", ot: "ot", "nuoc-tuong": "nuoc-tuong", "tuong-ot": "tuong-ot", giay: "giay-goi", "cat-doi": "giay-goi", tui: "tui" };
  function opt(label, sub, attrs, onClick, cls = "") {
    const b = h("button", "opt " + cls); b.type = "button";
    const ic = ING_ICON[attrs.spread || attrs.veg || attrs.sauce || attrs.spice || attrs.wrap] || attrs.fill;
    if (ic && atlas.has("ingr", ic)) b.appendChild(icon(atlas, ["ingr", ic], 24));
    b.appendChild(document.createTextNode(label));
    if (sub) b.appendChild(h("small", "", sub));
    for (const [k, v] of Object.entries(attrs)) b.dataset[k] = v;
    b.addEventListener("click", onClick);
    return b;
  }
  function group(title, cls) { const g = h("div", "grp " + cls); g.appendChild(h("h4", "", title)); const o = h("div", "opts"); g.appendChild(o); return [g, o]; }

  function options(state, tut) {
    const sh = state.shift, b = sh.boards[sh.sel], l = b.loaf;
    const c = b.cid !== null ? customer(state, b.cid) : null;
    const it = c?.items[b.item];
    const wrap = h("div", "stack"); wrap.id = "opts";
    if (!c) return wrap;
    const want = (cond) => (tut && cond ? "want" : "");
    if (!l) {
      const [g, o] = group("Lấy bánh", "grp-take");
      o.appendChild(opt("Lấy ổ giòn nhất", sh.case.length ? `${sh.case.length} ổ trong tủ` : "Tủ trống", { act: "take" }, () => dispatch({ type: "take" })));
      sh.case.slice().sort((a, b2) => a.crisp - b2.crisp).slice(0, 5).forEach((lf) => o.appendChild(opt(`Giòn ${Math.round(lf.crisp)}`, lf.src === "si" ? "bánh sỉ" : lf.crisp < 50 ? "ỉu" : "", { loaf: lf.id }, () => dispatch({ type: "take", loaf: lf.id }))));
      wrap.appendChild(g);
      return wrap;
    }
    if (l.wrap) return wrap;
    if (!l.sliced || l.toastT0 !== null) {
      const [g, o] = group("Chuẩn bị", "grp-prep");
      const toasting = l.toastT0 !== null;
      o.appendChild(opt(toasting ? "Lấy ra" : "Nướng lại", toasting ? "lò than" : `giòn ≥ ${TOASTER.minCrisp}`, { act: "toast" }, () => dispatch({ type: "toast" }), want(it.crispy && !toasting)));
      if (!toasting) o.appendChild(opt("Rạch bánh", "dao răng cưa", { act: "slice" }, () => dispatch({ type: "slice" })));
      wrap.appendChild(g);
      return wrap;
    }
    const past = (step) => STEPS.indexOf(step) < b.step;
    // phết
    { const [g, o] = group("Phết", "grp-spread");
      for (const id of SPREADS) { if (STOCK[id].unlock > state.level) continue; const cur = l.spreads[id] || 0; const bt = opt(NAMES[id], cur ? LEVEL_NAMES[cur] : `còn ${state.stock[id]}`, { spread: id }, () => dispatch({ type: "spread", id, lvl: nextLv(cur) }), (cur ? "on " : "") + want((it.spreads[id] || 0) > 0 && cur !== it.spreads[id])); bt.disabled = past("spread"); o.appendChild(bt); }
      wrap.appendChild(g); }
    // nhân
    { const [g, o] = group("Nhân", "grp-fill");
      for (const id of FILLINGS) { if (STOCK[id].unlock > state.level) continue; const on = l.fills.includes(id); const bt = opt(NAMES[id], on ? "đã bỏ" : `còn ${state.stock[id]}`, { fill: id }, () => dispatch({ type: "fill", id }), (on ? "on " : "") + want(it.fills.includes(id) && !on)); bt.disabled = past("fill"); o.appendChild(bt); }
      wrap.appendChild(g); }
    // rau dưa
    { const [g, o] = group("Rau dưa", "grp-veg");
      const all = opt("Đủ rau dưa", "4 thứ", { veg: "all" }, () => dispatch({ type: "veg", id: "all" }), want(VEG_IDS.every((v) => it.veg[v]) && VEG_IDS.some((v) => !l.veg[v])));
      all.disabled = past("veg") || VEG_IDS.every((v) => l.veg[v]); o.appendChild(all);
      for (const id of VEG_IDS) { const on = !!l.veg[id]; const allWanted = VEG_IDS.every((v) => it.veg[v]) && VEG_IDS.every((v) => !l.veg[v]);
        const bt = opt(NAMES[id], on ? "bật" : "tắt", { veg: id }, () => dispatch({ type: "veg", id }), (on ? "on " : "") + want(!allWanted && !!it.veg[id] !== on)); bt.disabled = past("veg"); o.appendChild(bt); }
      wrap.appendChild(g); }
    // gia vị
    { const [g, o] = group("Gia vị", "grp-spice");
      const ot = opt("Ớt", LEVEL_NAMES[l.ot], { spice: "ot" }, () => dispatch({ type: "spice", id: "ot", lvl: nextLv(l.ot) }), (l.ot ? "on " : "") + want(l.ot !== it.ot)); ot.disabled = past("spice"); o.appendChild(ot);
      for (const id of SAUCES) { const on = !!l.sauces[id]; const bt = opt(NAMES[id], on ? "bật" : "tắt", { sauce: id }, () => dispatch({ type: "spice", id }), (on ? "on " : "") + want(!!it.sauces[id] !== on)); bt.disabled = past("spice"); o.appendChild(bt); }
      wrap.appendChild(g); }
    // gói
    { const [g, o] = group("Gói", "grp-wrap");
      for (const [id, W] of Object.entries(WRAPS)) o.appendChild(opt(W.name, id === "tui" ? `túi còn ${state.stock.tui}` : "", { wrap: id }, () => dispatch({ type: "wrap", kind: id }), want((it.bag ? "tui" : it.wrap) === id)));
      wrap.appendChild(g); }
    return wrap;
  }

  function changePanel(state) {
    const sh = state.shift, c = customer(state, sh.paying);
    const box = h("div", "change"); box.id = "change";
    const due = h("div", "due");
    const left = h("div", "got");
    const bf = atlas.frame("bills", `bill-${c.pay.bill}k`);
    if (bf) left.appendChild(icon(atlas, ["bills", `bill-${c.pay.bill}k`], 36));
    left.appendChild(h("span", "", `${c.name} đưa ${c.pay.bill}k cho ${c.pay.due}k`));
    due.appendChild(left);
    const right = h("div"); right.appendChild(h("small", "muted", "Cần thối ")); right.appendChild(h("b", "", c.pay.change + "k"));
    due.appendChild(right);
    box.appendChild(due);
    const bills = h("div", "bills");
    for (const d of FLOAT_BILLS) {
      const have = (state.float[d] || 0) - (picked[d] || 0);
      const b = h("button", "billbtn"); b.type = "button"; b.dataset.bill = d;
      if (atlas.frame("bills", `bill-${d}k`)) b.appendChild(icon(atlas, ["bills", `bill-${d}k`], 28));
      b.appendChild(h("span", "", d + "k"));
      b.appendChild(h("small", "", `còn ${state.float[d] || 0} tờ`));
      if (picked[d]) b.appendChild(h("span", "n", "×" + picked[d]));
      b.disabled = have <= 0;
      b.addEventListener("click", () => { picked[d] = (picked[d] || 0) + 1; key = ""; });
      bills.appendChild(b);
    }
    box.appendChild(bills);
    const sum = sumBills(picked), diff = sum - c.pay.change;
    const p = h("div", "picked " + (diff === 0 ? "ok" : diff < 0 ? "short" : "over"));
    p.appendChild(h("span", "", `Đã chọn: ${sum}k`));
    p.appendChild(h("span", "", diff === 0 ? "Vừa đủ" : diff < 0 ? `Thiếu ${-diff}k` : `Dư ${diff}k`));
    box.appendChild(p);
    const row = h("div", "row");
    const clear = h("button", "btn small", "Chọn lại"); clear.type = "button"; clear.dataset.act = "clearChange"; clear.addEventListener("click", () => { picked = {}; key = ""; });
    const give = h("button", "btn primary", "Thối " + sum + "k"); give.type = "button"; give.dataset.act = "giveChange";
    give.addEventListener("click", () => { const bills = picked; picked = {}; key = ""; dispatch({ type: "giveChange", bills }); });
    row.append(clear, give);
    if (autoChangeAllowed(state)) { const auto = h("button", "btn", "Thối đúng"); auto.type = "button"; auto.dataset.act = "autoChange"; auto.title = "Ngày 1–3: máy tự chọn tờ thối"; auto.addEventListener("click", () => { picked = {}; key = ""; dispatch({ type: "autoChange" }); }); row.appendChild(auto); }
    const none = h("button", "btn small", "Hết lẻ?"); none.type = "button"; none.dataset.act = "noChange"; none.addEventListener("click", () => dispatch({ type: "noChange" }));
    row.appendChild(none);
    box.appendChild(row);
    return box;
  }

  function acts(state) {
    const sh = state.shift, b = sh.boards[sh.sel], l = b.loaf;
    const row = h("div", "acts");
    const undo = h("button", "btn", "Hoàn tác"); undo.type = "button"; undo.dataset.act = "undo"; undo.disabled = !l || !b.hist.length || l.toastT0 !== null;
    undo.addEventListener("click", () => dispatch({ type: "undo" }));
    const disc = h("button", "btn", "Đổ ổ"); disc.type = "button"; disc.dataset.act = "discard"; disc.disabled = !l;
    disc.addEventListener("click", () => dispatch({ type: "discard" }));
    const serve = h("button", "btn primary", "Giao"); serve.type = "button"; serve.dataset.act = "serve"; serve.disabled = !l?.wrap;
    serve.addEventListener("click", () => dispatch({ type: "serve" }));
    row.append(undo, disc, serve);
    return row;
  }

  /** Dựng lại khi khoá đổi. hint = { key } từ core/tutorial.js (ngày 1). */
  function render(state, hint = null) {
    const sh = state.shift;
    if (!sh) { if (key !== "closed") { key = "closed"; root.textContent = ""; root.appendChild(h("div", "ticket empty", "Xe bánh mì đang đóng. Chuẩn bị ca rồi mở hàng!")); } return; }
    const b = sh.boards[sh.sel];
    const l = b.loaf;
    const k = JSON.stringify([b.cid, b.item, b.step, l && [l.sliced, l.wrap, l.toastT0 !== null, l.spreads, l.fills, l.veg, l.ot, l.sauces, l.toasted, l.burnt, l.id],
      sh.paying, sh.paying !== null && state.float, picked, sh.oven.map((x) => !!x), sh.case.length, state.stock, hint?.key, showBook, loafScale, state.day,
      b.cid !== null && customer(state, b.cid)?.filled.map(Boolean)]);
    if (k === key) return;
    if (b.cid === null) showBook = false;
    key = k;
    const scroll = root.scrollTop;
    root.textContent = "";
    root.appendChild(ovenBox(state));
    root.appendChild(ticket(state));
    if (sh.paying !== null) root.appendChild(changePanel(state));
    else {
      root.appendChild(loafView(state));
      root.appendChild(stepsStrip(b));
      root.appendChild(options(state, sh.tutorial));
      root.appendChild(acts(state));
    }
    root.scrollTop = scroll;
    applyHint(hint);
    frame(state);
  }
  const HINT_SEL = { bake: '[data-act="bake"]', pull: '[data-act="pull"]', take: '[data-act="take"]', toast: '[data-act="toast"]', toasting: '[data-act="toast"]', slice: '[data-act="slice"]',
    spread: ".grp-spread", fill: ".grp-fill", veg: ".grp-veg", spice: ".grp-spice", wrap: ".grp-wrap", serve: '[data-act="serve"]', change: '[data-act="autoChange"], [data-act="giveChange"]' };
  function applyHint(hint) {
    if (!hint) return;
    const sel = HINT_SEL[hint.key];
    if (!sel) return;
    for (const e of root.querySelectorAll(sel)) e.classList.add("hint");
  }
  /** Phần động mỗi khung: thanh màu vỏ, độ giòn, lò than. */
  function frame(state) {
    const sh = state.shift;
    if (!sh) return;
    for (const d of dyn.bars) {
      const b = sh.oven[d.slot];
      if (!b) continue;
      const sec = batchSec(sh, b), lv = batchLevel(state, b);
      d.mark.style.left = Math.min(100, (sec / d.max) * 100) + "%";
      d.lbl.textContent = `${LEVEL_LABEL[lv]} · ${Math.floor(sec)}s`;
      d.lbl.className = "oven-lbl " + lv;
      d.btn.textContent = lv === "burnt" ? "Bỏ mẻ cháy" : "Rút";
    }
    const l = sh.boards[sh.sel].loaf;
    if (dyn.crispNum && l) {
      const c = Math.round(l.crisp);
      dyn.crispNum.textContent = l.burnt ? "Cháy" : `Giòn ${c}`;
      dyn.crispNum.className = "crispnum" + (l.burnt || c < 50 ? " lo" : c >= 85 ? " hi" : "");
    }
    if (dyn.toastBar && l && l.toastT0 !== null) {
      const ms = sh.t - l.toastT0;
      dyn.toastBar.firstChild.style.width = Math.min(100, (ms / TOASTER.burnMs) * 100) + "%";
      dyn.toastBar.classList.toggle("burn", ms > TOASTER.burnMs);
    }
  }
  function setLoafScale(s) { const v = crispScale(s); if (v !== loafScale) { loafScale = v; key = ""; } }
  return { render, frame, setLoafScale, resetPicked: () => { picked = {}; key = ""; } };
}
export { CRUST, RECIPE };
