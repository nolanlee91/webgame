// Quầy ráp (cột phải desktop / dưới cảnh trên mobile): lò, phiếu ghim, ổ bánh cận cảnh (loaf-layers), dải bước, ô nguyên liệu,
// Hoàn tác / Đổ / Giao, và khay thối tiền khi khách trả tiền. Dựng lại DOM khi khoá trạng thái đổi; phần động (thanh lò, độ giòn,
// lò than) cập nhật mỗi khung. Mọi thao tác đi qua dispatch(action) ⇒ core/apply.js.
import { paint, crisp as crispScale, icon } from "../render/atlas.js?v=b5";
import { loafLayers } from "../render/loafview.js?v=b5";
import { STEPS, STEP_NAME } from "../core/board.js?v=b5";
import { batchSec, batchLevel, ovenOf, caseCap, CRUST } from "../core/oven.js?v=b5";
import { autoChangeAllowed, customer, orderPrice, helperOn } from "../core/shift.js?v=b5";
import { sumBills, makeChange } from "../core/money.js?v=b5";
import { sameLeft, batchMax } from "../core/board.js?v=b5";
import { itemSpec, itemSteps, loafName, bachucPrice } from "../core/order.js?v=b5";
import { STOCK, NAMES, LEVEL_NAMES, SPREADS, FILLINGS, VEG_IDS, SAUCES, WRAPS, TOASTER, FLOAT_BILLS, RECIPE, QUE } from "../data/economy.js?v=b5";
const FILL_NEEDS = { trung: "egg-pan", "xiu-mai": "xiu-mai-pot", "thit-nuong": "grill" };
const fmtS = (ms) => `${Math.max(0, Math.ceil(ms / 1000))}s`;
import { QUIRKS } from "../data/quirks.js?v=b5";
import { panSlots, grillLevel, COOK } from "../core/cook.js?v=b5";

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
  const dyn = { bars: [], crispNum: null, toastBar: null, due: null };

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
      if (b?.kind === "que") lbl.dataset.que = "1";
      if (!b && state.owned?.["que-tray"]) {
        const qb = h("button", "btn small", "Khay que"); qb.type = "button"; qb.dataset.act = "bakeQue"; qb.dataset.slot = i;
        qb.disabled = (state.stock["phoi-que"] || 0) < QUE.bag; qb.addEventListener("click", () => dispatch({ type: "bake", slot: i, kind: "que" }));
        row.appendChild(qb);
      }
      box.appendChild(row);
      dyn.bars.push({ b, mark, lbl, btn, max, slot: i });
    });
    // chảo trứng + bếp than (M5): chiên / nướng sẵn khi rảnh; bước Nhân lấy phần đã chín
    const ck = sh.cook;
    dyn.cook = null;
    if (ck && (panSlots(state) || state.owned?.grill)) {
      const row = h("div", "cook-row");
      if (panSlots(state)) {
        const frying = ck.pan.filter((x) => x !== null).length;
        const lbl = h("span", "cook-lbl", `Chảo: ${ck.eggs} trứng chín${frying ? ` · đang chiên ${frying}` : ""}`); lbl.dataset.cook = "egg";
        const bt = h("button", "btn small", "Chiên trứng"); bt.type = "button"; bt.dataset.act = "fry";
        bt.disabled = ck.pan.every((x) => x !== null) || (state.stock.trung || 0) < 1;
        bt.addEventListener("click", () => dispatch({ type: "fry" }));
        const it = h("div", "cook-item"); it.append(lbl, bt); row.appendChild(it);
      }
      if (state.owned?.grill) {
        const lbl = h("span", "cook-lbl", ""); lbl.dataset.cook = "meat";
        const bt = h("button", "btn small", ck.grill ? "Gắp thịt" : "Nướng thịt"); bt.type = "button"; bt.dataset.act = ck.grill ? "grillPull" : "grill";
        bt.disabled = !ck.grill && (state.stock["thit-nuong"] || 0) < 1;
        bt.addEventListener("click", () => dispatch({ type: ck.grill ? "grillPull" : "grill" }));
        const it = h("div", "cook-item"); it.append(lbl, bt); row.appendChild(it);
        dyn.cook = { lbl, bt };
      }
      box.appendChild(row);
    }
    const meta = h("div", "meta");
    const cs = sh.case;
    const avg = cs.length ? Math.round(cs.reduce((a, l) => a + l.crisp, 0) / cs.length) : 0;
    const stale = cs.filter((l) => l.src === "stale").length;
    meta.appendChild(h("span", "", `Tủ kính: ${cs.length}/${caseCap(state)} ổ${cs.length ? ` · giòn TB ${avg}` : ""}${stale ? ` · ${stale} bánh hôm qua` : ""}${sh.que ? ` · que ${sh.que}` : ""}`));
    meta.appendChild(h("span", "", `Phôi ${state.stock.phoi} · Gas ${state.stock.gas} mẻ`));
    box.appendChild(meta);
    return box;
  }

  function boardTabs(state) {
    const sh = state.shift;
    const row = h("div", "t-items boards");
    sh.boards.forEach((bd, i) => {
      const c = bd.cid !== null ? customer(state, bd.cid) : null;
      const bt = h("button", "t-item" + (i === sh.sel ? " on" : bd.loaf ? " done" : ""), `Thớt ${i + 1}${c ? " · " + c.name.split(" ").slice(-1)[0] : ""}`);
      bt.type = "button"; bt.dataset.board = i;
      bt.addEventListener("click", () => dispatch({ type: "selectBoard", idx: i }));
      row.appendChild(bt);
    });
    return row;
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
    if (c.pre) { t.classList.add("pre"); const due = h("p", "t-spec pre-due"); due.dataset.due = c.pre.dueT; due.textContent = `${c.pre.label} · đã cọc ${c.pre.deposit}k · giao trong ${fmtS(c.pre.dueT - sh.t)}`; t.appendChild(due); dyn.due = due; }
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
    // chủ tiệm cận cảnh HD (baker-actions-hd, đợt 2) mờ phía sau ổ bánh, động tác theo bước đang làm
    const act = ["slice", "slice", "slice", "spread", "fill", "fill", "sauce", "wrap"][Math.min(7, b.step + 1)] || "idle";
    const bk = atlas.has("bakerhd", `${act}-1`) ? `${act}-${(b.step % 4) + 1}` : atlas.has("bakerhd", "idle-1") ? "idle-1" : null;
    if (bk) { const e = h("i", "spr baker-hd"); const f = atlas.frame("bakerhd", bk); paint(e, f, loafScale * 0.75); e.dataset.frame = bk; wrap.appendChild(e); }
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
      if (it.recipe === "que") {
        o.appendChild(opt("Lấy một bịch que", `${sh.que || 0} que đã nướng`, { act: "take" }, () => dispatch({ type: "take" })));
        wrap.appendChild(g);
        return wrap;
      }
      o.appendChild(opt("Lấy ổ giòn nhất", sh.case.length ? `${sh.case.length} ổ trong tủ` : "Tủ trống", { act: "take" }, () => dispatch({ type: "take" })));
      const nb = Math.min(batchMax(state), sameLeft(state, b), sh.case.length);
      if (nb > 1) o.appendChild(opt(`Ráp ×${nb}`, `${nb} ổ giống nhau một lượt`, { act: "takeBatch", n: nb }, () => dispatch({ type: "take", n: nb }), "batch"));
      sh.case.slice().sort((a, b2) => a.crisp - b2.crisp).slice(0, 5).forEach((lf) => o.appendChild(opt(`Giòn ${Math.round(lf.crisp)}`, lf.src === "si" ? "bánh sỉ" : lf.crisp < 50 ? "ỉu" : "", { loaf: lf.id }, () => dispatch({ type: "take", loaf: lf.id }))));
      wrap.appendChild(g);
      return wrap;
    }
    if (l.wrap) return wrap;
    if (l.n > 1) wrap.appendChild(h("p", "t-spec batch-note", `Đang ráp ${l.n} ổ một lượt trên thớt dài: mỗi bước dùng ×${l.n} phần.`));
    if (l.que) {
      const [g, o] = group("Phết pate", "grp-spread");
      const cur = l.spreads.pate || 0;
      o.appendChild(opt("Pate", cur ? LEVEL_NAMES[cur] : `còn ${state.stock.pate}`, { spread: "pate" }, () => dispatch({ type: "spread", id: "pate", lvl: nextLv(cur) }), cur ? "on" : ""));
      wrap.appendChild(g);
      const [g2, o2] = group("Gói", "grp-wrap");
      o2.appendChild(opt(WRAPS.tui.name, `túi còn ${state.stock.tui}`, { wrap: "tui" }, () => dispatch({ type: "wrap", kind: "tui" })));
      wrap.appendChild(g2);
      return wrap;
    }
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
      if (state.owned?.["auto-dose"] && it.recipe !== "bachuc" && !past("spread")) o.appendChild(opt("Theo phiếu", "máy định lượng", { act: "autoSpread" }, () => dispatch({ type: "autoSpread" }), "auto"));
      for (const id of SPREADS) { if (STOCK[id].unlock > state.level) continue; const cur = l.spreads[id] || 0; const bt = opt(NAMES[id], cur ? LEVEL_NAMES[cur] : `còn ${state.stock[id]}`, { spread: id }, () => dispatch({ type: "spread", id, lvl: nextLv(cur) }), (cur ? "on " : "") + want((it.spreads[id] || 0) > 0 && cur !== it.spreads[id])); bt.disabled = past("spread"); o.appendChild(bt); }
      wrap.appendChild(g); }
    // nhân
    { const [g, o] = group("Nhân", "grp-fill");
      for (const id of FILLINGS) { if (STOCK[id].unlock > state.level || (FILL_NEEDS[id] && !state.owned?.[FILL_NEEDS[id]])) continue; const on = l.fills.includes(id); const bt = opt(NAMES[id], on ? "đã bỏ" : `còn ${state.stock[id]}`, { fill: id }, () => dispatch({ type: "fill", id }), (on ? "on " : "") + want(it.fills.includes(id) && !on)); bt.disabled = past("fill"); o.appendChild(bt); }
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
    const sug = state.owned?.["cash-counter"] ? makeChange(state.float, c.pay.change) || {} : {};
    for (const d of FLOAT_BILLS) {
      const have = (state.float[d] || 0) - (picked[d] || 0);
      const b = h("button", "billbtn"); b.type = "button"; b.dataset.bill = d;
      if (atlas.frame("bills", `bill-${d}k`)) b.appendChild(icon(atlas, ["bills", `bill-${d}k`], 28));
      b.appendChild(h("span", "", d + "k"));
      b.appendChild(h("small", "", `còn ${state.float[d] || 0} tờ`));
      if (picked[d]) b.appendChild(h("span", "n", "×" + picked[d]));
      if (sug[d] && (picked[d] || 0) < sug[d]) { b.classList.add("sug"); b.title = `Hộp đếm tiền gợi ý ${sug[d]} tờ`; }
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
    const helper = helperOn(state) && l && !l.wrap && (l.sliced || l.que);
    const serve = h("button", "btn primary", helper ? "Giao (phụ việc gói)" : "Giao"); serve.type = "button"; serve.dataset.act = "serve"; serve.disabled = !l?.wrap && !helper;
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
      b.cid !== null && customer(state, b.cid)?.filled.map(Boolean), sh.sel, sh.boards.map((x) => [x.cid, !!x.loaf]), sh.que, l?.n, helperOn(state), Object.keys(state.owned || {}).length,
      sh.cook && [sh.cook.eggs, sh.cook.pan.map((x) => x !== null), sh.cook.meat, !!sh.cook.grill]]);
    if (k === key) return;
    if (b.cid === null) showBook = false;
    key = k;
    const scroll = root.scrollTop;
    root.textContent = "";
    dyn.due = null;
    root.appendChild(ovenBox(state));
    if (sh.boards.length > 1) root.appendChild(boardTabs(state));
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
    if (dyn.cook) {
      const g = sh.cook?.grill, lv = grillLevel(sh);
      dyn.cook.lbl.textContent = g ? `Bếp than: ${g.n} phần · ${lv === "raw" ? `chín sau ${fmtS(COOK.grill.golden - (sh.t - g.t0))}` : lv === "golden" ? "chín rồi, gắp!" : "cháy rồi!"}` : `Thịt nướng chín: ${sh.cook.meat}`;
      dyn.cook.lbl.className = "cook-lbl" + (lv === "golden" ? " golden" : lv === "burnt" ? " burnt" : "");
      dyn.cook.bt.disabled = g ? lv === "raw" : (state.stock["thit-nuong"] || 0) < 1;
    }
    if (dyn.due) dyn.due.textContent = dyn.due.textContent.replace(/(giao trong |trễ )\S+$/, (sh.t <= Number(dyn.due.dataset.due) ? "giao trong " : "trễ ") + fmtS(Math.abs(Number(dyn.due.dataset.due) - sh.t)));
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
