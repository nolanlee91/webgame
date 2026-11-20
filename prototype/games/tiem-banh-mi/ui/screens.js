// HUD, viên Lò / Gas, dải phiếu, thông báo, và các bảng phủ: chào, Chuẩn bị ca (nhập hàng, tiền lẻ, mẻ đầu, dự báo), Cách chơi,
// Tạm dừng (Chơi lại từ đầu có xác nhận + backup), Chốt ca (lời lỗ), khiếu nại, hết hàng, hết tiền lẻ.
import { icon } from "../render/atlas.js?v=b1";
import { clockOf, phaseAt, customer, patienceLeft, orderPrice } from "../core/shift.js?v=b1";
import { batchSec, batchLevel, ovenOf, CRUST, doneness, traySize, caseCap } from "../core/oven.js?v=b1";
import { floatValue, sumBills } from "../core/money.js?v=b1";
import { demandEstimate, packPrice, packSize, capacity, stockUsed, shiftFee, consignAvailable, stage } from "../core/stock.js?v=b1";
import { stockoutOptions, nochangeOptions, itemName } from "../core/rescue.js?v=b1";
import { orderText, loafName, menuAt } from "../core/order.js?v=b1";
import { STOCK, STOCK_IDS, EXCHANGE, FLOAT_BILLS, LEVELS, AUTO_CHANGE_DAYS, OVENS } from "../data/economy.js?v=b1";
import { MISTAKES } from "../data/lines-mistakes.js?v=b1";
import { PHASES } from "../data/shift.js?v=b1";
import { quirkChips } from "./bench.js?v=b1";

const h = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
export const fmtK = (k) => (Math.round(k * 10) / 10).toLocaleString("vi-VN") + "k";
export function toast(box, text, kind = "") {
  const t = h("div", "toast " + kind, text);
  box.appendChild(t);
  while (box.children.length > 3) box.firstChild.remove();
  setTimeout(() => t.remove(), 3600);
}

// ---------- HUD + viên Lò / Gas ----------
export function createHud(root, pills, atlas, dispatch) {
  let key = "";
  const ovenPill = h("button", "pill oven-pill"); ovenPill.type = "button"; ovenPill.dataset.act = "ovenPill";
  const ring = h("span", "ring"), olbl = h("span", "", "Lò");
  ovenPill.append(ring, olbl);
  const gasPill = h("div", "pill gas");
  pills.append(ovenPill, gasPill);
  let pillAction = null;
  ovenPill.addEventListener("click", () => pillAction && dispatch(pillAction));
  return (state) => {
    const sh = state.shift;
    pills.hidden = !sh;
    const chips = [
      ["Ngày", String(state.day)],
      [sh ? phaseAt(sh.t).name : "Đóng cửa", sh ? clockOf(sh.t) : "--:--"],
      ["Tiền", fmtK(state.money)],
      ["Quỹ lẻ", fmtK(floatValue(state.float))],
      ["Cấp " + state.level, `${state.xp}/${LEVELS[state.level] ?? "max"} XP`],
      ["Danh tiếng", String(Math.round(state.rep))],
    ];
    const k = JSON.stringify(chips) + (state.stock.phoi <= 2);
    if (k !== key) {
      key = k; root.textContent = "";
      chips.forEach(([a, b], i) => { const c = h("div", "chip" + (i === 3 && floatValue(state.float) < 10 ? " low" : "")); c.appendChild(h("small", "", a)); c.appendChild(h("b", "", b)); root.appendChild(c); });
    }
    if (!sh) return;
    const O = ovenOf(state);
    const b = sh.oven.find(Boolean), slot = sh.oven.indexOf(b);
    if (b) {
      const sec = batchSec(sh, b), lv = batchLevel(state, b);
      ovenPill.style.setProperty("--p", Math.min(1, sec / O.golden[1]));
      ovenPill.style.setProperty("--crust", CRUST[lv]);
      olbl.textContent = lv === "golden" ? "Rút ngay!" : lv === "dark" ? "Xém! Rút" : lv === "burnt" ? "Cháy! Bỏ" : `Lò ${Math.floor(sec)}s`;
      ovenPill.className = "pill oven-pill" + (lv === "golden" ? " ready" : lv === "dark" || lv === "burnt" ? " danger" : "");
      pillAction = { type: "pull", slot };
    } else {
      ovenPill.style.setProperty("--p", 0); ovenPill.style.setProperty("--crust", CRUST.raw);
      olbl.textContent = (state.stock.phoi || 0) > 0 ? "Bỏ mẻ" : "Hết phôi";
      ovenPill.className = "pill oven-pill";
      pillAction = { type: "bake", slot: 0 };
    }
    const gas = state.stock.gas || 0;
    const gt = `Gas ${gas} mẻ`;
    if (gasPill.textContent !== gt) gasPill.textContent = gt;
    gasPill.className = "pill gas" + (gas <= 0 ? " out" : gas < 6 ? " low" : "");
  };
}

// ---------- dải phiếu ----------
export function createRail(root, onPin) {
  let key = "";
  const bars = new Map();
  return (state, hintPin = false) => {
    const sh = state.shift;
    const list = sh ? sh.customers.filter((c) => c.phase === "wait" || c.phase === "pay") : [];
    const pinned = sh ? sh.boards.map((b) => b.cid) : [];
    const k = JSON.stringify(list.map((c) => [c.id, c.phase, c.filled.map(Boolean), c.nhuCu])) + pinned + hintPin;
    if (k !== key) {
      key = k; root.textContent = ""; bars.clear();
      if (!list.length) root.appendChild(h("div", "rail-empty", sh ? "Chưa có phiếu. Khách tới thì phiếu hiện ở đây." : "Phiếu khách sẽ hiện ở đây khi mở hàng."));
      list.forEach((c, i) => {
        const s = h("button", "slip" + (pinned.includes(c.id) ? " on" : "") + (hintPin && i === 0 && !pinned.includes(c.id) ? " hint" : ""));
        s.type = "button"; s.dataset.cid = c.id;
        s.appendChild(h("b", "", `${i + 1}. ${c.name}`));
        s.appendChild(h("span", "what", c.nhuCu ? "Như cũ" : c.items.length > 1 ? `${c.items.length} ổ: ${c.items.map(loafName).join(", ")}` : loafName(c.items[0])));
        if (!c.nhuCu && c.items.length === 1) { const q = quirkChips(c.items[0]); if (q.childNodes.length) s.appendChild(q); }
        if (c.phase === "pay") s.appendChild(h("span", "state", "Chờ thối tiền"));
        else if (c.filled.some(Boolean)) s.appendChild(h("span", "state", `Đã gói ${c.filled.filter(Boolean).length}/${c.items.length}`));
        const bar = h("div", "pbar"); bar.appendChild(h("i")); s.appendChild(bar); bars.set(c.id, bar);
        s.disabled = c.phase !== "wait";
        s.addEventListener("click", () => onPin(c.id));
        root.appendChild(s);
      });
    }
    for (const c of list) {
      const bar = bars.get(c.id);
      if (!bar) continue;
      const p = patienceLeft(state, c);
      bar.firstChild.style.width = p * 100 + "%";
      bar.className = "pbar" + (p <= 0.35 ? " low" : p <= 0.6 ? " mid" : "");
    }
  };
}

// ---------- bảng phủ ----------
export function createOverlays(rootEl, sheetEl, atlas, dispatch, hooks) {
  let current = null;
  const open = (name, build, narrow = false) => {
    current = name;
    sheetEl.textContent = "";
    sheetEl.className = "sheet" + (narrow ? " narrow" : "");
    sheetEl.dataset.view = name;
    build(sheetEl);
    rootEl.hidden = false;
    const f = sheetEl.querySelector("[data-autofocus]") || sheetEl.querySelector("button.primary, .choice:not(:disabled), button");
    try { f?.focus({ preventScroll: true }); } catch {}
  };
  const close = () => { current = null; rootEl.hidden = true; sheetEl.textContent = ""; hooks.onClose?.(); };
  const btn = (label, cls, act, onClick) => { const b = h("button", "btn " + (cls || ""), label); b.type = "button"; if (act) b.dataset.act = act; b.addEventListener("click", onClick); return b; };

  function intro(state) {
    open("intro", (c) => {
      c.appendChild(h("h2", "", "Tiệm Bánh Mì"));
      c.appendChild(h("p", "muted", "5 giờ 30 sáng, hẻm còn tối, lò đã nóng. Bạn bắt đầu với một xe đẩy bánh mì: tự nướng từng mẻ, canh vỏ vàng giòn, ráp ổ theo phiếu và thối tiền lẻ cho khách."));
      const lbl = h("label", "small", "Tên tiệm"); const inp = h("input", "namein"); inp.id = "shopName"; inp.value = state.shopName; inp.maxLength = 32;
      c.append(lbl, inp);
      const go = btn("Mở xe bánh mì", "primary", "introGo", () => { dispatch({ type: "setName", name: inp.value || state.shopName }); dispatch({ type: "seeIntro" }); close(); hooks.afterIntro(); });
      go.id = "introGo"; go.dataset.autofocus = "";
      const row = h("div", "row"); row.style.marginTop = "12px"; row.appendChild(go); c.appendChild(row);
    }, true);
  }

  // ---------- Chuẩn bị ca ----------
  let prepTab = "stock", prepOven = null;
  function prep(state, tab) {
    if (tab) prepTab = tab;
    open("prep", (c) => {
      const s = hooks.state();
      c.appendChild(h("h2", "", `Chuẩn bị ca · Ngày ${s.day}`));
      const est = demandEstimate(s);
      c.appendChild(h("p", "muted small", `Dự báo: khoảng ${est.guests} khách (sáng đông nhất), cần chừng ${est.loaves} ổ. Tiền ${fmtK(s.money)} · quỹ lẻ ${fmtK(floatValue(s.float))} · phí ca ${fmtK(shiftFee(s))}.${s.consign ? ` Đang nợ ký gửi ${fmtK(s.consign.owed)}.` : ""}`));
      const tabs = h("div", "tabs");
      for (const [id, name] of [["stock", "Nhập hàng"], ["change", "Tiền lẻ"], ["oven", "Mẻ đầu"], ["forecast", "Dự báo"]]) {
        const t = h("button", "tab" + (prepTab === id ? " on" : ""), name); t.type = "button"; t.dataset.tab = id;
        t.addEventListener("click", () => { prepTab = id; prep(s); });
        tabs.appendChild(t);
      }
      c.appendChild(tabs);
      const body = h("div", "stack"); c.appendChild(body);
      if (prepTab === "stock") stockTab(body, s, est);
      else if (prepTab === "change") changeTab(body, s);
      else if (prepTab === "oven") ovenTab(body, s);
      else forecastTab(body, s, est);
      const foot = h("div", "row"); foot.style.marginTop = "12px";
      if (consignAvailable(s)) foot.appendChild(btn("Nhận gói ký gửi Bà Tư", "warn", "consign", () => { const r = dispatch({ type: "consign" }); if (r.ok) prep(hooks.state()); }));
      const go = btn("Mở hàng", "primary", "openShop", () => { stopPrepOven(); close(); const r = dispatch({ type: "startShift" }); if (r.err) prep(hooks.state()); });
      go.id = "openShop"; go.dataset.autofocus = "";
      foot.appendChild(go);
      c.appendChild(foot);
    });
  }
  function stockTab(body, s, est) {
    const top = h("div", "row");
    top.appendChild(btn("Nhập đủ cho hôm nay", "primary", "restockToday", () => { const r = dispatch({ type: "restockToday" }); if (r.err === "nothing") hooks.toast("Hàng đã đủ cho dự báo (hoặc chưa đủ tiền).", "warn"); prep(hooks.state()); }));
    top.appendChild(h("span", "muted small", `Kho ${stockUsed(s)}/${capacity(s)} phần (đồ chua, dưa leo, rau, gia vị, giấy, túi, than, gas để riêng)`));
    body.appendChild(top);
    const list = h("div", "stocklist");
    const short = new Set(est.short.map((x) => x.id));
    for (const id of STOCK_IDS) {
      const it = STOCK[id];
      if (it.unlock > s.level) continue;
      const row = h("div", "stockitem" + (short.has(id) ? " short" : ""));
      row.dataset.item = id;
      row.appendChild(icon(atlas, ["ingr", it.icon], 32));
      const nm = h("div", "nm"); nm.appendChild(h("b", "", it.name)); nm.appendChild(h("small", "", `Còn ${s.stock[id]}${est.need[id] ? ` · cần ~${est.need[id]}` : ""}`)); row.appendChild(nm);
      const b = btn(`+${packSize(id)} · ${packPrice(id)}k`, "small", "buy", () => { const r = dispatch({ type: "restock", id }); if (r.err) hooks.toast(r.err === "capacity" ? "Kho đầy rồi." : "Không đủ tiền.", "warn"); prep(hooks.state()); });
      b.dataset.item = id; b.disabled = packPrice(id) > s.money;
      row.appendChild(b);
      list.appendChild(row);
    }
    body.appendChild(list);
  }
  function changeTab(body, s) {
    body.appendChild(h("p", "", "Tiền lẻ để thối cho khách. Khách sáng sớm hay đưa tờ lớn, thiếu lẻ là kẹt. Đổi ở tạp hoá Cô Sáu, miễn phí."));
    const bills = h("div", "row");
    for (const d of FLOAT_BILLS) { const x = h("span", "qchip cut", `${d}k × ${s.float[d] || 0}`); bills.appendChild(x); }
    body.appendChild(bills);
    const limit = EXCHANGE.limit[stage(s)];
    body.appendChild(h("p", "muted small", `Đã đổi hôm nay ${s.daily.exchanged || 0}/${limit}k. Ngày 1–${AUTO_CHANGE_DAYS} có nút "Thối đúng"; từ ngày ${AUTO_CHANGE_DAYS + 1} tự thối tay.`));
    const row = h("div", "row");
    for (const [id, P] of Object.entries(EXCHANGE.packs)) {
      const v = sumBills(P.bills);
      const b = btn(`${P.name} (${v}k)`, "", "exchange", () => { const r = dispatch({ type: "exchange", pack: id }); if (r.err) hooks.toast(r.err === "exchange-limit" ? "Cô Sáu chỉ đổi tới hạn mức mỗi ngày." : "Két không đủ tiền chẵn để đổi.", "warn"); prep(hooks.state()); });
      b.dataset.pack = id; row.appendChild(b);
    }
    body.appendChild(row);
  }
  function stopPrepOven() { if (prepOven?.raf) cancelAnimationFrame(prepOven.raf); prepOven = null; }
  function ovenTab(body, s) {
    const O = ovenOf(s), max = O.slots * 2, done = s.prep?.batches || 0;
    body.appendChild(h("p", "", `Nướng mẻ đầu trước giờ mở cửa (không tính giờ ca). Tối đa ${max} mẻ, mỗi mẻ ${traySize(s)} ổ. Rút khi thanh vào vùng xanh.`));
    body.appendChild(h("p", "muted small", `Đã nướng ${done}/${max} mẻ · ổ sẵn trong tủ: ${s.prep?.loaves.length || 0}${s.prep?.burnt ? ` · cháy ${s.prep.burnt} ổ` : ""} · phôi còn ${s.stock.phoi} · gas ${s.stock.gas}`));
    const box = h("div", "minioven");
    const row = h("div", "oven-row");
    const lbl = h("span", "oven-lbl", "Lò trống");
    const bar = h("div", "crust"); const zmax = O.dark + 4;
    const zone = h("i", "zone"); zone.style.left = (O.golden[0] / zmax) * 100 + "%"; zone.style.width = ((O.golden[1] - O.golden[0]) / zmax) * 100 + "%"; bar.appendChild(zone);
    const mark = h("i", "mark"); mark.style.left = "0%"; bar.appendChild(mark);
    const b = btn("Bỏ mẻ", "primary", "prepBake", () => {
      if (!prepOven) {
        if (done >= max || s.stock.phoi <= 0 || s.stock.gas <= 0) return;
        const speed = hooks.prepSpeed?.() || 1;
        prepOven = { t0: performance.now(), speed };
        b.textContent = "Rút"; b.dataset.act = "prepPull";
        const tickP = () => {
          if (!prepOven) return;
          const sec = ((performance.now() - prepOven.t0) / 1000) * prepOven.speed;
          prepOven.sec = sec;
          mark.style.left = Math.min(100, (sec / zmax) * 100) + "%";
          const lv = doneness(sec, O); lbl.textContent = { raw: "Phôi", pale: "Vàng nhạt", golden: "Vàng óng!", dark: "Xém!", burnt: "Cháy rồi" }[lv] + ` · ${Math.floor(sec)}s`; lbl.className = "oven-lbl " + lv;
          prepOven.raf = requestAnimationFrame(tickP);
        };
        tickP();
      } else {
        const sec = prepOven.sec || 0; stopPrepOven();
        const r = dispatch({ type: "firstBatch", sec });
        if (r.ok) hooks.toast(r.result.level === "golden" ? `Mẻ đầu vàng đều: ${r.result.n} ổ giòn 100!` : r.result.level === "burnt" ? "Mẻ đầu cháy mất rồi." : `Rút ${r.result.level === "dark" ? "hơi xém" : "hơi sớm"}: ${r.result.n} ổ.`, r.result.level === "golden" ? "good" : "warn");
        prep(hooks.state(), "oven");
      }
    });
    b.disabled = done >= max || s.stock.phoi <= 0 || s.stock.gas <= 0;
    row.append(lbl, bar, b); box.appendChild(row);
    body.appendChild(box);
  }
  function forecastTab(body, s, est) {
    const ul = h("ul", "small");
    for (const p of PHASES) ul.appendChild(h("li", "", `${p.name}: ~${Math.round(est.guests * p.share)} khách`));
    body.appendChild(ul);
    body.appendChild(h("p", "", "Menu: " + menuAt(s.level).map((r) => `${r.name} ${r.price}k`).join(" · ")));
    if (est.short.length) body.appendChild(h("p", "", "Coi chừng thiếu: " + est.short.map((x) => `${STOCK[x.id].name} (${x.have}/${x.need})`).join(", ")));
  }

  // ---------- Cách chơi / tạm dừng ----------
  const STEPS_HELP = [
    ["Lò", "Bỏ mẻ phôi vào lò. Vỏ đổi màu: vàng nhạt → vàng óng (vùng xanh “Rút!”) → xém → cháy. Rút đúng vùng chín: giòn 100."],
    ["Tủ kính", "Bánh ra lò nguội dần (−1 giòn mỗi 2,5 giây). Dưới 50 là bánh ỉu. Phiếu “giòn giòn nha” cần ≥ 85: nướng lại ở lò than 4 giây (quá 10 giây là cháy)."],
    ["Ráp ổ", "Ghim phiếu (chạm khách) → lấy bánh → (nướng lại) → rạch → phết → nhân → rau dưa → gia vị → gói → Giao. Làm bước sau thì bước trước khoá lại; Hoàn tác để sửa."],
    ["Thối tiền", `Khách đưa tờ lớn: chọn tờ trong quỹ lẻ cho đủ số cần thối. Thối thiếu là lỗi (tối đa 2 sao), thối dư là mất tiền. Ngày 1–${AUTO_CHANGE_DAYS} có nút “Thối đúng”.`],
    ["Buổi", "Cao điểm sáng đông và gấp, trưa vắng để nướng bánh, chiều tối có đơn nhiều ổ. Hết hàng giữa ca luôn có cách cứu (mượn, chạy chợ, ký gửi)."],
  ];
  function helpBody(c) {
    STEPS_HELP.forEach(([t, d], i) => { const r = h("div", "help-step"); r.appendChild(h("b", "n", String(i + 1))); const x = h("div"); x.appendChild(h("b", "", t)); x.appendChild(h("div", "small", d)); r.appendChild(x); c.appendChild(r); });
    c.appendChild(h("p", "muted small", "Phím: Enter giao / thối · Backspace hoàn tác · L lò · 1–6 chọn phiếu · Esc tạm dừng · H cách chơi · M tiếng."));
  }
  function restartRow(c) {
    const row = h("div", "row"); row.style.marginTop = "10px";
    row.appendChild(btn("Chơi lại từ đầu", "warn", "restart", () => confirmRestart()));
    c.appendChild(row);
  }
  function confirmRestart() {
    open("confirm-restart", (c) => {
      c.appendChild(h("h2", "", "Chơi lại từ đầu?"));
      c.appendChild(h("p", "", "Tiệm hiện tại được cất sang bản dự phòng (không mất), rồi mở một xe bánh mì mới từ ngày 1."));
      const row = h("div", "row");
      const no = btn("Thôi", "", "restartNo", () => { close(); hooks.resume(); }); no.dataset.autofocus = "";
      row.append(no, btn("Chơi lại", "warn", "restartYes", () => { if (!hooks.restart()) hooks.toast("Không cất được bản dự phòng, chưa xoá gì.", "warn"); }));
      c.appendChild(row);
    }, true);
  }
  function help() {
    const back = current;
    open("help", (c) => {
      c.appendChild(h("h2", "", "Cách chơi"));
      helpBody(c);
      const row = h("div", "row"); row.appendChild(btn("Đã hiểu", "primary", "helpClose", () => { close(); if (back === "prep") prep(hooks.state()); else hooks.resume(); })); c.appendChild(row);
      restartRow(c);
    }, true);
  }
  function pause() {
    open("pause", (c) => {
      c.appendChild(h("h2", "", "Tạm dừng"));
      c.appendChild(h("p", "muted", "Đồng hồ ca đang dừng."));
      const row = h("div", "row");
      const go = btn("Tiếp tục", "primary", "resume", () => { close(); hooks.resume(); }); go.dataset.autofocus = "";
      row.append(go, btn("Cách chơi", "", "help", () => help()));
      c.appendChild(row);
      restartRow(c);
    }, true);
  }

  // ---------- Chốt ca ----------
  function summary(state) {
    const S = state.lastSummary;
    if (!S) return;
    open("summary", (c) => {
      c.appendChild(h("h2", "", `Chốt ca ngày ${S.day}${S.early ? " (đóng cửa sớm)" : ""}`));
      const big = h("div", "big");
      const card = (v, l, cls = "") => { const d = h("div"); d.appendChild(h("b", cls, v)); d.appendChild(h("small", "", l)); big.appendChild(d); };
      card(fmtK(S.revenue), "Doanh thu"); card((S.profit >= 0 ? "+" : "") + fmtK(S.profit), "Lời vận hành", S.profit >= 0 ? "pos" : "neg");
      card(String(S.loaves), "Ổ bán"); card(S.avg ? S.avg + " sao" : "—", "Sao trung bình");
      c.appendChild(big);
      const grid = h("div", "grid2");
      const t = h("table", "pl");
      const row = (a, v, cls = "") => { const tr = h("tr", cls); tr.appendChild(h("td", "", a)); tr.appendChild(h("td", "", v)); t.appendChild(tr); };
      row("Doanh thu", fmtK(S.revenue));
      row("Giá vốn ổ đã bán", "−" + fmtK(S.cogs));
      row("Hao hụt (bánh cháy, bánh dư, đổ bỏ)", "−" + fmtK(S.waste));
      row(`Gas (${S.batches} mẻ)`, "−" + fmtK(S.gas));
      row(`Than (${S.toasts} lần nướng lại)`, "−" + fmtK(S.than));
      row("Phí ca", "−" + fmtK(S.fee));
      if (S.changeLoss) row("Thối dư mất", "−" + fmtK(S.changeLoss));
      row("Lời vận hành", (S.profit >= 0 ? "+" : "") + fmtK(S.profit), "total");
      grid.appendChild(t);
      const right = h("div", "small");
      right.appendChild(h("p", "", `Khách phục vụ ${S.served} · bỏ về ${S.lost} · mẻ nướng ${S.batches} (cháy ${S.burntBatches}, đúng vùng chín ${S.goldenPulls}) · thối đúng ${S.changeRight}, sai ${S.changeWrong}.`));
      right.appendChild(h("p", "", `Dòng tiền khác: nhập hàng trong ca ${fmtK(S.restockSpent)}, cứu hàng ${fmtK(S.rescueSpent)}, trả ký gửi ${fmtK(S.consignRepaid)}${S.owed ? `, khách nợ ${fmtK(S.owed)}` : ""}. Tiền hiện có ${fmtK(S.money)}. +${S.xp} XP.`));
      const mk = Object.entries(S.mistakes || {});
      if (mk.length) right.appendChild(h("p", "", "Lỗi: " + mk.map(([m, n]) => `${MISTAKES[m]?.label || m} ×${n}`).join(", ")));
      if (S.wasteLog?.length) right.appendChild(h("p", "muted", "Hao: " + S.wasteLog.join(" · ")));
      for (const r of [S.best, S.worst].filter(Boolean).filter((r, i, a) => a.findIndex((x) => x.id === r.id) === i)) {
        const d = h("div", "rev"); d.appendChild(h("span", "st", "★".repeat(r.stars) + "☆".repeat(5 - r.stars) + " ")); d.appendChild(h("b", "", r.name + ": ")); d.appendChild(document.createTextNode(r.line)); right.appendChild(d);
      }
      grid.appendChild(right);
      c.appendChild(grid);
      const foot = h("div", "row"); foot.style.marginTop = "12px";
      const go = btn("Ngày tiếp theo", "primary", "nextDay", () => { dispatch({ type: "closeSummary" }); close(); hooks.afterSummary(); }); go.dataset.autofocus = "";
      foot.appendChild(go); c.appendChild(foot);
    });
  }

  // ---------- khiếu nại / hết hàng / hết lẻ ----------
  function choiceBtn(o, onClick) {
    const b = h("button", "choice" + (o.primary ? " primary" : "")); b.type = "button"; b.dataset.choice = o.id;
    b.appendChild(h("b", "", o.label)); b.appendChild(h("small", "", o.hint || "")); b.appendChild(h("span", "cost" + (o.risk ? " risk" : ""), o.cost || ""));
    b.disabled = o.ok === false; b.addEventListener("click", onClick);
    return b;
  }
  function complaint(state) {
    const d = state.shift?.dialog; if (!d || d.kind !== "complaint") return;
    const c = customer(state, d.cid);
    open("complaint", (el) => {
      el.appendChild(h("h2", "", `${c.name} không hài lòng`));
      el.appendChild(h("p", "say", "“" + d.line + "”"));
      el.appendChild(h("p", "muted small", `Lỗi: ${MISTAKES[d.mistake]?.label || d.mistake} · ổ đang ${d.stars} sao. Ca tạm dừng, chọn cách xử lý:`));
      const ch = h("div", "choices");
      const price = orderPrice(c);
      for (const o of [
        { id: "remake", label: "Làm lại ổ khác", hint: "Khách chờ thêm, ổ cũ ghi hao. Tối đa 4 sao.", cost: "Hao 1 ổ", primary: true },
        { id: "discount", label: "Giảm 50%", hint: "Khách nhận ổ này, +1 sao (tối đa 3).", cost: `−${Math.round(price / 2)}k` },
        { id: "free", label: "Tặng luôn, xin lỗi", hint: "Không thu tiền, khách bớt giận (3 sao), 0 XP.", cost: `−${price}k` },
      ]) ch.appendChild(choiceBtn(o, () => { close(); dispatch({ type: "complaint", choice: o.id }); hooks.resume(); }));
      el.appendChild(ch);
    }, true);
  }
  function stockout(state) {
    const d = state.shift?.dialog; if (!d || d.kind !== "stockout") return;
    open("stockout", (el) => {
      el.dataset.item = d.id;
      el.appendChild(h("h2", "", d.id === "gas" ? "Hết gas!" : d.id === "banh" ? "Tủ kính hết bánh!" : `Hết ${itemName(d.id)}!`));
      el.appendChild(h("p", "muted small", "Ca tạm dừng. Chọn cách xử lý (chi phí ghi trên nút):"));
      const ch = h("div", "choices");
      stockoutOptions(state).forEach((o, i) => ch.appendChild(choiceBtn({ ...o, primary: i === 0 && o.ok }, () => {
        const r = dispatch({ type: "stockout", choice: o.id });
        close();
        const done = r.events?.find((e) => e.type === "stockoutResolved");
        if (done?.line) hooks.toast(done.line, "good");
        hooks.resume();
      })));
      el.appendChild(ch);
    }, true);
  }
  function nochange(state) {
    const d = state.shift?.dialog; if (!d || d.kind !== "nochange") return;
    open("nochange", (el) => {
      el.appendChild(h("h2", "", "Hết tiền lẻ!"));
      el.appendChild(h("p", "say", d.line));
      el.appendChild(h("p", "muted small", `Quỹ lẻ: ${FLOAT_BILLS.map((b) => `${b}k×${state.float[b] || 0}`).join(" · ")}`));
      const ch = h("div", "choices");
      nochangeOptions(state).forEach((o, i) => ch.appendChild(choiceBtn({ ...o, primary: i === 0 }, () => {
        const r = dispatch({ type: "nochange", choice: o.id }); close();
        const done = r.events?.find((e) => e.type === "nochangeResolved"); if (done?.line) hooks.toast(done.line, "good");
        hooks.resume();
      })));
      el.appendChild(ch);
    }, true);
  }
  return { open, close, intro, prep, help, pause, summary, complaint, stockout, nochange, get current() { return current; } };
}
export { orderText, OVENS, caseCap };
