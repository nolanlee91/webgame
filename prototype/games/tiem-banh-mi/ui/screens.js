// HUD, viên Lò / Gas, dải phiếu, thông báo, và các bảng phủ: chào, Chuẩn bị ca (nhập hàng, tiền lẻ, mẻ đầu, dự báo), Cách chơi,
// Tạm dừng (Chơi lại từ đầu có xác nhận + backup), Chốt ca (lời lỗ), khiếu nại, hết hàng, hết tiền lẻ.
import { icon } from "../render/atlas.js?v=b14";
import { clockOf, phaseAt, customer, patienceLeft, orderPrice } from "../core/shift.js?v=b14";
import { batchSec, batchLevel, ovenOf, CRUST, doneness, traySize, caseCap, prepMax as prepMaxOf } from "../core/oven.js?v=b14";
import { floatValue, sumBills } from "../core/money.js?v=b14";
import { demandEstimate, packPrice, packSize, capacity, stockUsed, shiftFee, consignAvailable, stage } from "../core/stock.js?v=b14";
import { stockoutOptions, nochangeOptions, itemName } from "../core/rescue.js?v=b14";
import { orderText, loafName, menuAt } from "../core/order.js?v=b14";
import { STOCK, STOCK_IDS, EXCHANGE, FLOAT_BILLS, LEVELS, AUTO_CHANGE_DAYS, OVENS } from "../data/economy.js?v=b14";
import { MISTAKES } from "../data/lines-mistakes.js?v=b14";
import { PHASES } from "../data/shift.js?v=b14";
import { quirkChips } from "./bench.js?v=b14";
import { personaCards } from "./persona.js?v=b14";
import { buildEvent } from "./drama.js?v=b14";
import { buildNotebook } from "./notebook.js?v=b14";
import { drawJournal, download, share } from "./journal.js?v=b14";
import { EQUIPMENT, DECOR, SIGNBOARDS, RANKS, HOUSE_PATE, PROMOS, PROMO_UNLOCK, RENT, HELPER, FAIR, CHALLENGE, HOUSE_LOAF, PREORDER } from "../data/equipment.js?v=b14";
import { canBuy, preorderOffers, fairAvailable, fairToday, nextFairDay, helperToday, houseRange, appeal } from "../core/progress.js?v=b14";
import { challengeToday, challengeWeek, activeChallenge } from "../core/challenge.js?v=b14";
import { expiringOn } from "../core/expiry.js?v=b14";
import { maiOpen, MAI } from "../core/stock.js?v=b14";
import { currentEvent } from "../core/drama.js?v=b14";
import { MERGE_SLICE_DAYS } from "../core/board.js?v=b14";
import { PERSONAS } from "../data/lines-reply.js?v=b14";
import { STALE } from "../data/lines-m3.js?v=b14";
import { FILLINGS, NAMES } from "../data/economy.js?v=b14";
import { shareResult } from "../../_shared/share.js?v=s3";

// Khoe kết quả chốt ca: tiền trong game tính theo nghìn ⇒ 1.250k → "1.250.000đ".
const vnd = (kNum) => `${Math.round(Math.abs(kNum) * 1000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}đ`;
export function summaryShare(S) {
  const p = S.profit, lvUp = Array.isArray(S.levelUps) && S.levelUps.length ? Math.max(...S.levelUps) : 0;
  const title = p > 0 ? `Ngày ${S.day} lời ${vnd(p)}` : p < 0 ? `Ngày ${S.day} lỗ ${vnd(p)}` : `Ngày ${S.day} huề vốn`;
  const lines = [`Doanh thu: ${vnd(S.revenue)}`, `Ổ bán: ${S.loaves} (${S.served} khách)`];
  if (S.avg) lines.push(`Sao trung bình: ${String(S.avg).replace(".", ",")}★`);
  lines.push(lvUp ? `Lên cấp: ${lvUp}!` : `Cấp tiệm: ${S.level}`);
  const tagline = p < 0 ? (S.burntBatches ? "Lò hơi nóng tính, bánh hơi đen, ví hơi mỏng. Mai gỡ!" : "Bán bánh mì mà lỗ, coi như phát cơm từ thiện.")
    : p === 0 ? "Huề vốn: nướng cả ngày lấy mùi bơ thơm làm lời."
    : lvUp ? `Lên cấp ${lvUp}, sắp thành tiệm bánh mì có tiếng cả phố.`
    : p >= Math.max(150, S.revenue * 0.4) ? "Giòn rụm, lời đậm, hàng xóm bắt đầu ganh tị." : "Có lời là vui rồi, mai nướng thêm mẻ nữa!";
  return { game: "tiem-banh-mi", title, lines, tagline, accent: "#f7c96d" };
}

/** Khoe ngay lúc lên cấp giữa ca (nút "Khoe" trên thông báo): số thật của tiệm lúc đó. */
export function levelUpShare(state, level = state.level) {
  const lines = [`Tiệm: ${state.shopName}`, `Ngày: ${state.day}`, `Danh tiếng: ${Math.round(state.rep)}`];
  if (state.followers) lines.push(`Người theo dõi: ${state.followers}`);
  const tagline = level >= 16 ? "Cả phố xếp hàng, lò than chạy không kịp nghỉ." : level >= 8 ? "Từ xe đẩy đầu hẻm lên tiệm có tiếng, ai mà cản nổi!"
    : "Ổ bánh giòn rụm, chủ tiệm lên tay thấy rõ.";
  return { game: "tiem-banh-mi", title: `Lên cấp ${level}!`, lines, tagline, accent: "#f7c96d" };
}

const h = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
export const fmtK = (k) => (Math.round(k * 10) / 10).toLocaleString("vi-VN") + "k";
/** Thông báo (D11, TLC2-12). Luật D4 "một thông báo một lúc" áp cho mọi cỡ màn (kể cả máy tính): thông báo mới thay thông báo cũ;
 *  riêng thông báo có nút (`action` = { label, act, onClick }, vd "Khoe" lúc lên cấp) ở 7 giây, nằm dưới cùng và không bị thay.
 *  Khi bảng phủ đang mở (`isOpen()`): không vẽ đè thanh đầu nữa mà xếp hàng (tối đa 3 câu mới nhất, bỏ câu trùng); đóng bảng thì
 *  hiện lần lượt từng câu (2,4 giây một câu, câu cũ quá 45 giây thì bỏ). Câu quan trọng (`opt.important`, vd sắp hết hàng) và câu
 *  trả lời cho thao tác trong bảng (`opt.sheet`, vd "Không đủ tiền") hiện thành một dòng `.sheet-note` trong chân bảng dính đáy (`footSel`), không có thì dưới tiêu đề. */
export function createToaster(box, { isOpen, sheet, footSel = "", watch = [] }) {
  const queue = [], QMAX = 3, TTL = 45000, GAP = 2400, NOTE_MS = 5000;
  let note = null, drainT = 0, wasOpen = isOpen();
  function place(text, kind, action) {
    for (const x of [...box.children]) if (action ? x.classList.contains("has-act") : !x.classList.contains("has-act")) x.remove();
    const t = h("div", "toast " + kind, text);
    if (action) {
      t.classList.add("has-act");
      const b = h("button", "toast-act", action.label); b.type = "button"; if (action.act) b.dataset.act = action.act;
      b.addEventListener("click", (e) => { e.stopPropagation(); t.remove(); action.onClick(); });
      t.appendChild(b);
    }
    t._q = { text, kind, action };
    const keep = !action && box.querySelector(".toast.has-act");
    if (keep) box.insertBefore(t, keep); else box.appendChild(t);
    setTimeout(() => t.remove(), action ? 7000 : 3600);
  }
  function enqueue(q) {
    const k = queue.findIndex((x) => x.text === q.text);
    if (k >= 0) queue.splice(k, 1);
    queue.push(q);
    while (queue.length > QMAX) queue.splice(queue.findIndex((x) => !x.action) >= 0 ? queue.findIndex((x) => !x.action) : 0, 1);
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
    const live = note && isOpen() && note.view === sheet.dataset.view && Date.now() - note.at < note.ms;
    if (!live) { old?.remove(); return; }
    if (old && old.textContent === note.text) return;
    const n = old || h("p");
    n.className = "sheet-note " + note.kind; n.textContent = note.text; n.setAttribute("role", "status");
    // chân bảng dính đáy (nút chính) có sẵn ⇒ dòng nằm ngay trên nút, luôn thấy mà không che tab / nút nào; không có ⇒ dưới tiêu đề
    if (!old) { const foot = footSel ? [...sheet.querySelectorAll(footSel)].pop() : null, h2 = sheet.querySelector("h2"); if (foot) foot.prepend(n); else if (h2) h2.after(n); else sheet.prepend(n); }
  }
  function sheetNote(text, kind, important) {
    note = { text, kind, at: Date.now(), ms: important ? Infinity : NOTE_MS, view: sheet.dataset.view };
    renderNote();
    if (!important) setTimeout(renderNote, NOTE_MS + 50);
  }
  function sync() {
    const open = isOpen();
    if (open && !wasOpen) { // bảng vừa mở: thông báo đang hiện ⇒ cất lại vào hàng, không vẽ đè thanh đầu
      clearTimeout(drainT); drainT = 0;
      for (const t of [...box.children]) { if (t._q) queue.unshift({ ...t._q, at: Date.now() }); t.remove(); }
      while (queue.length > QMAX) queue.shift();
    }
    if (!open && wasOpen) { note = null; drain(); }
    wasOpen = open;
    renderNote();
  }
  if (typeof MutationObserver === "function") {
    const mo = new MutationObserver(sync);
    for (const [el, opts] of watch) if (el) mo.observe(el, opts);
    mo.observe(sheet, { childList: true });
  }
  function toast(text, kind = "", action = null, opt = {}) {
    if (!text) return;
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

// ---------- HUD + viên Lò / Gas ----------
// HUD 1 hàng (TLC2-04, cùng kiểu Trà Sữa TLC1-03): ô dựng một lần, mỗi khung chỉ ghi chữ khi đổi. Điện thoại / màn thấp (xoay ngang):
// số gọn (148k · 1,2tr · 12k) trên, nhãn 9 px dưới, không xuống dòng (khối CSS "HUD 1 hàng" trong index.html); ô Tiền có title ghi số đủ.
const short1 = (v) => (v >= 10 ? String(Math.floor(v)) : (Math.floor(v * 10) / 10).toLocaleString("vi-VN", { maximumFractionDigits: 1 }));
export function shortMoney(kNum) {
  const s = kNum < 0 ? "−" : "", n = Math.abs(Math.round(kNum));
  return s + (n < 1000 ? `${n}k` : n < 1e6 ? `${short1(n / 1000)}tr` : `${short1(n / 1e6)} tỷ`);
}
export const shortCount = (n) => (n < 1000 ? String(n) : n < 1e6 ? `${short1(n / 1000)}k` : `${short1(n / 1e6)}tr`);
const setText = (el, v) => { v = String(v); if (el.textContent !== v) el.textContent = v; };
/** Cùng điều kiện với khối CSS "HUD 1 hàng" trong index.html. */
const HUD_COMPACT = "(max-width: 760px), (max-width: 1024px) and (orientation: portrait), (orientation: landscape) and (max-height: 500px)";
export function createHud(root, pills, atlas, dispatch) {
  const compact = typeof matchMedia === "function" ? matchMedia(HUD_COMPACT) : { matches: false };
  const chips = {};
  for (const id of ["time", "money", "float", "level", "rep", "fol"]) {
    const c = h("div", "chip chip-" + id), sm = h("small"), b = h("b");
    c.append(sm, b); root.appendChild(c); chips[id] = { c, sm, b };
  }
  const ovenPill = h("button", "pill oven-pill"); ovenPill.type = "button"; ovenPill.dataset.act = "ovenPill";
  const ring = h("span", "ring"), olbl = h("span", "", "Lò");
  ovenPill.append(ring, olbl);
  const gasPill = h("div", "pill gas");
  pills.append(ovenPill, gasPill);
  let pillAction = null, moneyTitle = null;
  ovenPill.addEventListener("click", () => pillAction && dispatch(pillAction));
  const set = (id, label, val) => { setText(chips[id].sm, label); setText(chips[id].b, val); };
  return (state) => {
    const sh = state.shift;
    pills.hidden = !sh;
    const sm = compact.matches, fl = floatValue(state.float);
    set("time", "Ngày " + state.day, sh ? clockOf(sh.t) : "--:--");
    set("money", "Tiền", sm ? shortMoney(state.money) : fmtK(state.money));
    if (moneyTitle !== state.money) { moneyTitle = state.money; chips.money.c.title = "Tiền: " + fmtK(state.money); }
    set("float", "Lẻ", sm ? shortMoney(fl) : fmtK(fl));
    chips.float.c.classList.toggle("low", fl < 10);
    set("level", sm ? "Cấp" : "Cấp " + state.level, sm ? state.level : `${state.xp}/${LEVELS[state.level] ?? "max"}`);
    set("rep", "Danh tiếng", Math.round(state.rep));
    set("fol", "Theo dõi", sm ? shortCount(state.followers || 0) : state.followers || 0);
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
    const gt = `Gas ${gas} mẻ`; // D9: " mẻ" bọc riêng để dải dính hẹp ẩn được (index.html .dockbar .pill.gas .u)
    if (gasPill.textContent !== gt) gasPill.innerHTML = `Gas ${gas}<span class="u"> mẻ</span>`;
    gasPill.className = "pill gas" + (gas <= 0 ? " out" : gas < 6 ? " low" : "");
  };
}

// ---------- dải phiếu ----------
/** "5 thập cẩm, 2 chả lụa" thay vì liệt kê từng ổ. */
const groupNames = (items) => { const m = new Map(); for (const it of items) m.set(loafName(it), (m.get(loafName(it)) || 0) + 1); return [...m].map(([n, k]) => (k > 1 ? `${k} ${n}` : n)).join(", "); };
export function createRail(root, onPin) {
  let key = "";
  const bars = new Map();
  return (state, hintPin = false) => {
    const sh = state.shift;
    const list = sh ? sh.customers.filter((c) => c.phase === "wait" || c.phase === "pay") : [];
    const pinned = sh ? sh.boards.map((b) => b.cid) : [];
    const k = JSON.stringify(list.map((c) => [c.id, c.phase, c.filled.map(Boolean), c.nhuCu, c.pre && Math.ceil((c.pre.dueT - sh.t) / 5000)])) + pinned + hintPin;
    if (k !== key) {
      key = k; root.textContent = ""; bars.clear();
      if (!list.length) root.appendChild(h("div", "rail-empty", sh ? "Chưa có phiếu. Khách tới thì phiếu hiện ở đây." : "Phiếu khách sẽ hiện ở đây khi mở hàng."));
      list.forEach((c, i) => {
        const s = h("button", "slip" + (pinned.includes(c.id) ? " on" : "") + (hintPin && i === 0 && !pinned.includes(c.id) ? " hint" : ""));
        s.type = "button"; s.dataset.cid = c.id;
        if (c.pre) s.classList.add("pre");
        s.appendChild(h("b", "", `${i + 1}. ${c.pre ? "Đặt trước · " : ""}${c.name}`));
        s.appendChild(h("span", "what", c.nhuCu ? "Như cũ" : c.items.length > 1 ? `${c.items.length} ổ: ${groupNames(c.items)}` : loafName(c.items[0])));
        if (!c.nhuCu && c.items.length === 1) { const q = quirkChips(c.items[0]); if (q.childNodes.length) s.appendChild(q); }
        if (c.phase === "pay") s.appendChild(h("span", "state", "Chờ thối tiền"));
        else if (c.filled.some(Boolean)) s.appendChild(h("span", "state", `Đã gói ${c.filled.filter(Boolean).length}/${c.items.length}`));
        if (c.pre) s.appendChild(h("span", "state due", sh.t <= c.pre.dueT ? `Giao trong ${Math.ceil((c.pre.dueT - sh.t) / 1000)} giây` : `Trễ ${Math.ceil((sh.t - c.pre.dueT) / 1000)} giây!`));
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
      c.appendChild(h("h3", "", "Tính cách chủ tiệm (trả lời review)"));
      c.appendChild(h("p", "muted small", "Đổi được ngay trên từng review sau này."));
      let persona = state.owner?.persona || "hien";
      c.appendChild(personaCards(persona, (p) => { persona = p; }));
      const go = btn("Mở xe bánh mì", "primary", "introGo", () => { dispatch({ type: "setName", name: inp.value || state.shopName }); dispatch({ type: "persona", persona }); dispatch({ type: "seeIntro" }); close(); hooks.afterIntro(); });
      go.id = "introGo"; go.dataset.autofocus = "";
      const row = h("div", "row sum-foot"); row.appendChild(go); c.appendChild(row); // D11 TLC22-05: chân bảng dính đáy ⇒ xoay ngang không phải cuộn tìm nút
    });
  }

  // ---------- Chuẩn bị ca ----------
  let prepTab = "stock", prepOven = null;
  function prep(state, tab) {
    if (tab) prepTab = tab;
    open("prep", (c) => {
      const s = hooks.state();
      c.appendChild(h("h2", "", `Chuẩn bị ca · Ngày ${s.day}`));
      const est = demandEstimate(s);
      c.appendChild(h("p", "muted small", `Dự báo: khoảng ${est.guests} khách${s.weather?.kind === "rain" && s.weather.day === s.day ? " (trời mưa, vắng hơn)" : ""}, cần chừng ${est.loaves} ổ. Tiền ${fmtK(s.money)} · quỹ lẻ ${fmtK(floatValue(s.float))} · phí ca ${fmtK(shiftFee(s))}.${s.consign ? ` Đang nợ ký gửi ${fmtK(s.consign.owed)}.` : ""}${(s.preorders || []).some((p) => p.day === s.day) ? ` Có ${(s.preorders || []).filter((p) => p.day === s.day).length} đơn đặt trước hôm nay.` : ""}`));
      topCards(c, s);
      const tabs = h("div", "tabs");
      const TABS = [["stock", "Nhập hàng"], ["change", "Tiền lẻ"], ["oven", "Mẻ đầu"], ...(s.level >= PREORDER.level && s.shop ? [["pre", "Đơn đặt"]] : []), ["shop", "Nâng cấp"], ["forecast", "Dự báo"]];
      if (!TABS.some(([id]) => id === prepTab)) prepTab = "stock";
      for (const [id, name] of TABS) {
        const t = h("button", "tab" + (prepTab === id ? " on" : ""), name); t.type = "button"; t.dataset.tab = id;
        t.addEventListener("click", () => { prepTab = id; prep(s); });
        tabs.appendChild(t);
      }
      c.appendChild(tabs);
      const body = h("div", "stack"); c.appendChild(body);
      if (prepTab === "stock") stockTab(body, s, est);
      else if (prepTab === "change") changeTab(body, s);
      else if (prepTab === "oven") ovenTab(body, s);
      else if (prepTab === "pre") preTab(body, s);
      else if (prepTab === "shop") shopTab(body, s);
      else forecastTab(body, s, est);
      const foot = h("div", "row sum-foot"); // D11 TLC22-05: "Mở hàng" dính đáy bảng (xoay ngang / điện thoại không phải cuộn hết bảng)
      if (consignAvailable(s)) foot.appendChild(btn("Nhận gói ký gửi Bà Tư", "warn", "consign", () => { const r = dispatch({ type: "consign" }); if (r.ok) prep(hooks.state()); }));
      const go = btn("Mở hàng", "primary", "openShop", () => { stopPrepOven(); close(); const r = dispatch({ type: "startShift" }); if (r.err) prep(hooks.state()); });
      go.id = "openShop"; go.dataset.autofocus = "";
      foot.appendChild(go);
      c.appendChild(foot);
    });
  }
  let sup = "tu";
  function stockTab(body, s, est) {
    if (maiOpen(s)) {
      const st = h("div", "tabs sup");
      for (const [id, name] of [["tu", "Bà Tư (chợ hẻm)"], ["mai", "Chị Mai (lò sỉ, gói đôi rẻ 10%)"]]) { const b = h("button", "tab" + (sup === id ? " on" : ""), name); b.type = "button"; b.dataset.sup = id; b.addEventListener("click", () => { sup = id; prep(hooks.state()); }); st.appendChild(b); }
      body.appendChild(st);
    } else sup = "tu";
    const top = h("div", "row");
    top.appendChild(btn("Nhập đủ cho hôm nay", "primary", "restockToday", () => { const r = dispatch({ type: "restockToday" }); if (r.err === "nothing") hooks.toast("Hàng đã đủ cho dự báo (hoặc chưa đủ tiền).", "warn"); prep(hooks.state()); }));
    top.appendChild(h("span", "muted small", `Kho ${stockUsed(s)}/${capacity(s)} phần (đồ chua, dưa leo, rau, gia vị, giấy, túi, than, gas để riêng)`));
    body.appendChild(top);
    const list = h("div", "stocklist");
    const short = new Set(est.short.map((x) => x.id));
    const exp = expiringOn(s, s.day);
    for (const id of STOCK_IDS) {
      const it = STOCK[id];
      if (it.unlock > s.level) continue;
      if (sup === "mai" && !MAI.has(id)) continue;
      if (sup === "tu" && id === "banh-si") continue;
      const row = h("div", "stockitem" + (short.has(id) ? " short" : ""));
      row.dataset.item = id;
      row.appendChild(icon(atlas, ["ingr", it.icon], 32));
      const nm = h("div", "nm"); nm.appendChild(h("b", "", it.name)); nm.appendChild(h("small", "", `Còn ${s.stock[id]}${est.need[id] ? ` · cần ~${est.need[id]}` : ""}${exp[id] ? ` · ${exp[id]} hết hạn cuối ca nay` : ""}`)); row.appendChild(nm);
      if (exp[id]) row.dataset.expiring = exp[id];
      const price = packPrice(id, false, sup, s);
      const b = btn(`+${packSize(id, sup)} · ${price}k`, "small", "buy", () => { const r = dispatch({ type: "restock", id, sup }); if (r.err) hooks.toast(r.err === "capacity" ? "Kho đầy rồi." : r.err === "promised" ? "Đã hứa chỉ lấy pate của Bà Tư." : "Không đủ tiền.", "warn"); prep(hooks.state()); });
      b.dataset.item = id; b.dataset.sup = sup; b.disabled = price > s.money;
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
    const O = ovenOf(s), max = prepMaxOf(s), done = s.prep?.batches || 0;
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
  // ---------- thẻ đầu bảng: bánh hôm qua, thuê mặt bằng ----------
  function topCards(c, s) {
    if (s.stale?.n) {
      const box = h("div", "card-note"); box.dataset.card = "stale";
      box.appendChild(h("b", "", `Bánh hôm qua: ${s.stale.n} ổ (giòn 30)`));
      box.appendChild(h("p", "small", s.stale.choice ? `Đã chọn: ${{ sell: "bán bánh mì nướng bơ đường 10k (khách sáng gọi, nướng lại ở lò than, giòn tối đa 70)", give: "cho đi", toss: "bỏ" }[s.stale.choice]}.` : "Sáng nay làm gì với bánh dư hôm qua?"));
      const row = h("div", "row");
      for (const [id, label] of [["sell", "Bán nướng bơ đường"], ["give", "Cho đi (+1 danh tiếng)"], ["toss", "Bỏ"]]) {
        const b = btn(label, s.stale.choice === id ? "small primary" : "small", "stale", () => { dispatch({ type: "stale", choice: id }); prep(hooks.state()); });
        b.dataset.choice = id; row.appendChild(b);
      }
      box.appendChild(row); c.appendChild(box);
    }
    // hợp đồng định kỳ (M5)
    if ((s.contracts || []).length) {
      const box = h("div", "card-note"); box.dataset.card = "contracts";
      box.appendChild(h("b", "", "Hợp đồng định kỳ"));
      for (const k of s.contracts) box.appendChild(h("p", "small", `${k.name}: ${k.n} ổ ${NAMES[k.recipe] ? NAMES[k.recipe].toLocaleLowerCase("vi") : k.recipe} mỗi ${k.every} ngày · đợt kế ${k.next === s.day ? "HÔM NAY" : "ngày " + k.next} (giao trong ${Math.round(k.dueMs / 1000)} giây sau mở cửa) · còn ${k.left} đợt${k.strikes ? ` · đã trễ ${k.strikes} lần (trễ ${2} lần là mất hợp đồng)` : ""}`));
      c.appendChild(box);
    }
    // ca đặc biệt (M5): hội chợ cấp 18 + thử thách cấp 20
    if (s.level >= FAIR.level && s.shop) {
      const box = h("div", "card-note gold"); box.dataset.card = "fair";
      box.appendChild(h("b", "", "Lễ hội Bánh Mì phố (hội chợ)"));
      box.appendChild(h("p", "small", `Thuê gian ${FAIR.price}k: ca dài 4,5 phút, +${FAIR.guests} khách, giá +15%, khách đi nhóm gọi đơn 2–3 ổ, kém kiên nhẫn hơn. Mỗi ${FAIR.every} ngày một lần · đã dự ${s.fairCount || 0} lần.`));
      const row = h("div", "row");
      const b = btn(fairToday(s) ? "Hôm nay là ca hội chợ" : fairAvailable(s) ? `Thuê gian (${FAIR.price}k)` : `Hội chợ kế: ngày ${nextFairDay(s)}`, fairToday(s) ? "small primary" : "small", "fair", () => { const r = dispatch({ type: "fair" }); if (r.err) hooks.toast(r.err === "money" ? "Không đủ tiền thuê gian." : "Chưa thuê được gian.", "warn"); prep(hooks.state()); });
      b.disabled = fairToday(s) || !fairAvailable(s) || s.money < FAIR.price; row.appendChild(b); box.appendChild(row); c.appendChild(box);
    }
    if (s.level >= CHALLENGE.level) {
      const today = challengeToday(s), on = activeChallenge(s);
      const box = h("div", "card-note gold"); box.dataset.card = "challenge";
      box.appendChild(h("b", "", `Lịch thử thách · hôm nay: ${today.name}`));
      box.appendChild(h("p", "small", `${today.desc} Thưởng lần đầu ${CHALLENGE.firstReward.money}k + ${CHALLENGE.firstReward.xp} XP + huy hiệu, lần sau ${CHALLENGE.reward.money}k + ${CHALLENGE.reward.xp} XP. Miễn phí, bỏ được trước khi mở hàng.`));
      const wk = h("div", "week"); for (const d of challengeWeek(s)) { const x = h("span", d.day === s.day ? "on" : "", `Ngày ${d.day}: ${d.name}${s.badges?.["tt-" + d.id] ? " ✓" : ""}`); wk.appendChild(x); }
      box.appendChild(wk);
      const row = h("div", "row");
      row.appendChild(btn(on ? "Đã nhận thử thách (bấm để bỏ)" : "Nhận thử thách hôm nay", on ? "small primary" : "small", "challenge", () => { dispatch({ type: "challenge", on: !on }); prep(hooks.state()); }));
      box.appendChild(row); c.appendChild(box);
    }
    if (s.level >= RENT.level && !s.shop) {
      const box = h("div", "card-note gold"); box.dataset.card = "rent";
      box.appendChild(h("b", "", `Cấp ${s.level}: thuê mặt bằng ngay (${RENT.price}k) hay ở xe đẩy thêm?`));
      box.appendChild(h("p", "small", "Lên tiệm: lò gas 2 ngăn, kho 100, hàng chờ 5, đơn đặt trước, trang trí kéo thả. Phí ca tăng. Xe đẩy được giữ trong Nhật Ký."));
      const row = h("div", "row");
      const yes = btn(s.money >= RENT.price ? `Thuê mặt bằng (${RENT.price}k)` : `Để dành thêm (còn thiếu ${RENT.price - s.money}k)`, "primary", "rentShop", () => { const r = dispatch({ type: "rentShop" }); if (r.ok) hooks.moved?.(); prep(hooks.state()); });
      yes.disabled = s.money < RENT.price;
      row.append(yes, h("span", "muted small", "Ở lại xe đẩy vẫn chơi bình thường."));
      box.appendChild(row); c.appendChild(box);
    }
  }
  // ---------- Đơn đặt trước ----------
  function preTab(body, s) {
    body.appendChild(h("p", "", `Đơn đặt trước: cọc ${PREORDER.deposit * 100}% nhận ngay, giao trước hạn trong ca. Trễ ≤ 30 giây giảm 10%, trễ hơn giảm 30% + review 2 sao. Tối đa ${PREORDER.perDay} đơn mỗi ngày. Ráp nhanh bằng thớt dài (ráp ×N).`));
    const todays = (s.preorders || []).filter((p) => p.day === s.day);
    for (const p of todays) body.appendChild(h("div", "rev", `Đã nhận: ${p.name} · ${p.items.length} ổ · ${p.label} · cọc ${p.deposit}k · giao lúc ${Math.round(p.dueMs / 1000)} giây sau mở cửa`));
    preorderOffers(s).forEach((o, i) => {
      const n = o.mix.reduce((a, m) => a + m.n, 0);
      const row = h("div", "stockitem");
      const nm = h("div", "nm"); nm.appendChild(h("b", "", `${o.name}: ${n} ổ`)); nm.appendChild(h("small", "", `${o.label} · ${o.mix.map((m) => `${m.n} ${NAMES[m.recipe] || m.recipe}`).join(", ")} · hạn ${Math.round(o.dueMs / 1000)} giây${o.discount ? ` · giảm ${o.discount * 100}%` : ""}`)); row.appendChild(nm);
      const b = btn(o.taken ? "Đã nhận" : "Nhận đơn", "small primary", "acceptOffer", () => { const r = dispatch({ type: "acceptOffer", idx: i }); if (r.err === "preorder-max") hooks.toast("Hôm nay đủ đơn rồi.", "warn"); prep(hooks.state()); });
      b.dataset.idx = i; b.disabled = o.taken || todays.length >= PREORDER.perDay;
      row.appendChild(b); body.appendChild(row);
    });
  }
  // ---------- Nâng cấp & Trang trí ----------
  function buyRow(list, s, id, it, extra = "") {
    const e = canBuy(s, id);
    const row = h("div", "stockitem" + (s.owned?.[id] ? " owned" : ""));
    row.dataset.item = id;
    const nm = h("div", "nm"); nm.appendChild(h("b", "", it.name)); nm.appendChild(h("small", "", `${it.desc || extra}${it.level > s.level ? ` · mở ở cấp ${it.level}` : ""}`)); row.appendChild(nm);
    const b = btn(s.owned?.[id] ? "Đã có" : `${it.price}k`, "small", "buyItem", () => { const r = dispatch({ type: "buy", id }); if (r.err) hooks.toast({ money: "Không đủ tiền.", locked: "Chưa tới cấp.", needs: "Cần mua món trước đó.", owned: "Đã có rồi." }[r.err] || "Chưa mua được.", "warn"); prep(hooks.state(), "shop"); });
    b.dataset.item = id; b.disabled = !!e;
    row.appendChild(b); list.appendChild(row);
  }
  function shopTab(body, s) {
    body.appendChild(h("h3", "", "Đồ nghề"));
    const l1 = h("div", "stocklist");
    for (const [id, it] of Object.entries(EQUIPMENT)) if (it.level <= s.level + 2 && !(id === "awning" && s.shop)) buyRow(l1, s, id, it);
    body.appendChild(l1);
    body.appendChild(h("h3", "", `Trang trí (hấp dẫn ${appeal(s)}/${s.level >= 19 ? 4 : 3}: +khách đi ngang)`));
    const l2 = h("div", "stocklist");
    for (const [id, it] of Object.entries(DECOR)) if (!it.event && it.level <= s.level + 2) buyRow(l2, s, id, it, `+${it.appeal || 0} hấp dẫn${it.patience ? `, +${it.patience}% kiên nhẫn` : ""}`);
    for (const [id, it] of Object.entries(SIGNBOARDS)) if (it.level <= s.level + 2) buyRow(l2, s, id, it, `+${it.appeal} hấp dẫn`);
    body.appendChild(l2);
    if (s.shop && Object.keys(DECOR).some((id) => s.owned?.[id])) body.appendChild(btn("Sắp xếp trang trí trong tiệm", "", "decorMode", () => { close(); hooks.decor?.(); }));
    else if (!s.shop) body.appendChild(h("p", "muted small", "Trang trí kéo thả được khi lên tiệm (cấp 7)."));
    if (s.level >= 10) {
      body.appendChild(h("h3", "", "Hạng tiệm & pate nhà làm"));
      const R = RANKS[s.rank || 0], P = HOUSE_PATE[s.pate || 0];
      const row = h("div", "row");
      const rb = btn(R ? `Lên hạng ${(s.rank || 0) + 1}/8 · ${R.price}k${R.level > s.level ? ` (cấp ${R.level})` : ""}` : "Hạng tiệm tối đa", "", "buyRank", () => { const r = dispatch({ type: "buyRank" }); if (r.err) hooks.toast("Chưa lên hạng được.", "warn"); prep(hooks.state(), "shop"); });
      rb.disabled = !R || R.level > s.level || s.money < R.price || !s.shop;
      const pb = btn(P ? `Pate nhà làm bậc ${(s.pate || 0) + 1}/3 · ${P.price}k${P.level > s.level ? ` (cấp ${P.level})` : ""}` : "Pate nhà làm tối đa", "", "buyPate", () => { const r = dispatch({ type: "buyPate" }); if (r.err) hooks.toast("Chưa nâng được.", "warn"); prep(hooks.state(), "shop"); });
      pb.disabled = !P || P.level > s.level || s.money < P.price;
      row.append(rb, pb); body.appendChild(row);
      body.appendChild(h("p", "muted small", "Mỗi hạng: +1 khách đi ngang mỗi ca, kiên nhẫn +2%. Pate nhà làm: ổ có pate +1k mỗi bậc."));
    }
    if (s.level >= PROMO_UNLOCK) {
      body.appendChild(h("h3", "", "Quảng bá (một lần mỗi ngày)"));
      const row = h("div", "row");
      for (const [id, P] of Object.entries(PROMOS)) { const b = btn(`${P.name} · ${P.price ? P.price + "k" : "miễn phí"}`, s.promo?.day === s.day && s.promo.kind === id ? "primary" : "", "promo", () => { const r = dispatch({ type: "promo", kind: id }); if (r.err) hooks.toast(r.err === "once-per-day" ? "Hôm nay quảng bá rồi." : "Không đủ tiền.", "warn"); prep(hooks.state(), "shop"); }); b.dataset.kind = id; b.title = P.desc; b.disabled = s.promo?.day === s.day; row.appendChild(b); }
      body.appendChild(row);
    }
    if (s.level >= HELPER.level) {
      const on = helperToday(s);
      body.appendChild(btn(on ? "Bé Na phụ hôm nay (bấm để thôi)" : `Thuê Bé Na phụ ca · ${HELPER.price}k (tự gói + thối tiền)`, on ? "primary" : "", "helper", () => { dispatch({ type: "helper", on: !on }); prep(hooks.state(), "shop"); }));
    }
    if (s.level >= HOUSE_LOAF.level) houseForm(body, s);
  }
  function houseForm(body, s) {
    body.appendChild(h("h3", "", "Ổ mang tên tiệm"));
    if (s.house) body.appendChild(h("p", "", `Đang bán: ${s.house.name} · ${s.house.fills.map((f) => NAMES[f]).join(", ")} · ${s.house.price}k`));
    const nm = h("input", "namein"); nm.placeholder = "Tên ổ (ví dụ: Ổ Hẻm Mười)"; nm.value = s.house?.name || ""; nm.maxLength = 28; nm.dataset.house = "name";
    const picks = new Set(s.house?.fills || ["cha-lua", "thit-nguoi"]);
    const grid = h("div", "row");
    for (const id of FILLINGS) { if (STOCK[id].unlock > s.level) continue; const b = btn(NAMES[id], picks.has(id) ? "small primary" : "small", "houseFill", () => { if (picks.has(id)) picks.delete(id); else if (picks.size < HOUSE_LOAF.maxFills) picks.add(id); b.className = "btn small" + (picks.has(id) ? " primary" : ""); upd(); }); grid.appendChild(b); }
    const price = h("input", "namein"); price.type = "number"; price.dataset.house = "price";
    const rng = h("span", "muted small");
    const upd = () => { const [lo, hi] = houseRange({ pate: 2, bo: 2 }, [...picks]); rng.textContent = `Khung giá ${lo}–${hi}k`; if (!price.value) price.value = Math.round((lo + hi) / 2); };
    upd();
    const save = btn("Lưu ổ mang tên tiệm", "primary", "saveHouse", () => { const r = dispatch({ type: "house", name: nm.value, spreads: { pate: 2, bo: 2 }, fills: [...picks], price: Number(price.value) }); if (r.err) hooks.toast(r.err === "bad-price" ? "Giá ngoài khung." : r.err === "empty-name" ? "Đặt tên cho ổ đã." : "Chọn 1–4 nhân.", "warn"); else prep(hooks.state(), "shop"); });
    body.append(nm, grid, h("div", "row"), price, rng, save);
  }
  function forecastTab(body, s, est) {
    const ul = h("ul", "small");
    for (const p of PHASES) ul.appendChild(h("li", "", `${p.name}: ~${Math.round(est.guests * p.share)} khách`));
    if (s.weather?.day === s.day) body.appendChild(h("p", "", s.weather.kind === "rain" ? "Trời mưa: khách vắng hơn (xe đẩy có mái che hoặc tiệm thì đỡ)." : "Trời quang."));
    body.appendChild(ul);
    body.appendChild(h("p", "", "Menu: " + menuAt(s.level, s).map((r) => `${r.id === "gia-truyen" && s.house ? s.house.name : r.name} ${r.id === "gia-truyen" && s.house ? s.house.price : r.price}k`).join(" · ")));
    if (est.short.length) body.appendChild(h("p", "", "Coi chừng thiếu: " + est.short.map((x) => `${STOCK[x.id].name} (${x.have}/${x.need})`).join(", ")));
  }

  // ---------- Cách chơi / tạm dừng ----------
  const STEPS_HELP = [
    ["Lò", "Bỏ mẻ phôi vào lò. Vỏ đổi màu: vàng nhạt → vàng óng (vùng xanh “Rút!”) → xém → cháy. Rút đúng vùng chín: giòn 100."],
    ["Tủ kính", "Bánh ra lò nguội dần (−1 giòn mỗi 2,5 giây). Dưới 50 là bánh ỉu. Phiếu “giòn giòn nha” cần ≥ 85: nướng lại ở lò than 4 giây (quá 10 giây là cháy)."],
    ["Ráp ổ", `Ghim phiếu (chạm khách) → lấy bánh → (nướng lại) → rạch → phết → nhân → rau dưa → gia vị → gói → Giao. Ngày 1–${MERGE_SLICE_DAYS}: “Lấy + rạch” là một bước. Làm bước sau thì bước trước khoá lại; Hoàn tác để sửa.`],
    ["Thối tiền", `Khách đưa tờ lớn: chọn tờ trong quỹ lẻ cho đủ số cần thối. Thối thiếu là lỗi (tối đa 2 sao), thối dư là mất tiền. Ngày 1–${AUTO_CHANGE_DAYS} có nút “Thối đúng”.`],
    ["Buổi", "Cao điểm sáng đông và gấp, trưa vắng để nướng bánh, chiều tối có đơn nhiều ổ. Hết hàng giữa ca luôn có cách cứu (mượn, chạy chợ, ký gửi)."],
  ];
  function helpBody(c) {
    STEPS_HELP.forEach(([t, d], i) => { const r = h("div", "help-step"); r.appendChild(h("b", "n", String(i + 1))); const x = h("div"); x.appendChild(h("b", "", t)); x.appendChild(h("div", "small", d)); r.appendChild(x); c.appendChild(r); });
    c.appendChild(h("p", "muted small", "Phím: Enter giao / thối · Backspace hoàn tác · L lò · 1–6 chọn phiếu · Esc tạm dừng · H cách chơi · M tiếng."));
  }
  function restartRow(c) {
    const row = h("div", "row"); row.style.marginTop = "10px";
    const info = hooks.replayInfo?.();
    if (info) row.appendChild(btn(`Chơi lại ngày ${info.day}`, "", "replayDay", () => confirmReplay()));
    row.appendChild(btn("Chơi lại từ đầu", "warn", "restart", () => confirmRestart()));
    c.appendChild(row);
  }
  function confirmReplay() {
    const back = current;
    const info = hooks.replayInfo?.();
    open("confirm-replay", (c) => {
      c.appendChild(h("h2", "", `Chơi lại ngày ${info?.day ?? ""}?`));
      c.appendChild(h("p", "", "Quay về lúc Chuẩn bị ca của ngày này. Bản hiện tại được cất sang bản dự phòng (không mất)."));
      const row = h("div", "row");
      const no = btn("Thôi", "", "replayNo", () => { close(); if (back === "summary") summary(hooks.state()); else if (back === "prep") prep(hooks.state()); else hooks.resume(); }); no.dataset.autofocus = "";
      row.append(no, btn("Chơi lại", "warn", "replayYes", () => { if (!hooks.replay()) hooks.toast("Không cất được bản dự phòng, chưa đổi gì.", "warn"); }));
      c.appendChild(row);
    }, true);
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
      if (S.headline) c.appendChild(h("p", "say headline", S.headline));
      const big = h("div", "big");
      const card = (v, l, cls = "") => { const d = h("div"); d.appendChild(h("b", cls, v)); d.appendChild(h("small", "", l)); big.appendChild(d); };
      card(fmtK(S.revenue), "Doanh thu"); card((S.profit >= 0 ? "+" : "") + fmtK(S.profit), "Lời còn lại", S.profit >= 0 ? "pos" : "neg");
      card(String(S.loaves), "Ổ bán"); card(S.avg ? S.avg + " sao" : "—", "Sao trung bình");
      c.appendChild(big);
      const grid = h("div", "grid2");
      const t = h("table", "pl");
      const row = (a, v, cls = "") => { const tr = h("tr", cls); tr.appendChild(h("td", "", a)); tr.appendChild(h("td", "", v)); t.appendChild(tr); };
      row("Doanh thu", fmtK(S.revenue));
      row("Tiền nguyên liệu ổ đã bán", "−" + fmtK(S.cogs));
      row("Đồ hỏng bỏ (bánh cháy, bánh dư, đổ bỏ)", "−" + fmtK(S.waste));
      row(`Gas (${S.batches} mẻ)`, "−" + fmtK(S.gas));
      row(`Than (${S.toasts} lần nướng lại)`, "−" + fmtK(S.than));
      row("Phí ca", "−" + fmtK(S.fee));
      if (S.changeLoss) row("Thối dư mất", "−" + fmtK(S.changeLoss));
      row("Lời còn lại", (S.profit >= 0 ? "+" : "") + fmtK(S.profit), "total");
      grid.appendChild(t);
      const right = h("div", "small");
      right.appendChild(h("p", "", `Khách phục vụ ${S.served} · bỏ về ${S.lost} · mẻ nướng ${S.batches} (cháy ${S.burntBatches}, đúng vùng chín ${S.goldenPulls}) · thối đúng ${S.changeRight}, sai ${S.changeWrong}.`));
      right.appendChild(h("p", "", `Dòng tiền khác: nhập hàng trong ca ${fmtK(S.restockSpent)}, cứu hàng ${fmtK(S.rescueSpent)}, trả ký gửi ${fmtK(S.consignRepaid)}${S.owed ? `, khách nợ ${fmtK(S.owed)}` : ""}. Tiền hiện có ${fmtK(S.money)}. +${S.xp} XP.`));
      const mk = Object.entries(S.mistakes || {});
      if (mk.length) right.appendChild(h("p", "", "Lỗi: " + mk.map(([m, n]) => `${MISTAKES[m]?.label || m} ×${n}`).join(", ")));
      if (S.wasteLog?.length) right.appendChild(h("p", "muted", "Đồ hỏng bỏ: " + S.wasteLog.join(" · ")));
      if (S.missions?.length) right.appendChild(h("p", "", "Nhiệm vụ: " + S.missions.map((m) => `${m.done ? "✓" : "✗"} ${m.text}`).join(" · ")));
      if (S.preorders || S.multi) right.appendChild(h("p", "", `Đơn nhiều ổ ${S.multi || 0} · đơn đặt trước ${S.preorders || 0}${S.preLate ? ` (trễ ${S.preLate})` : ""}${S.staleSold ? ` · bán ${S.staleSold} ổ bánh hôm qua` : ""}`));
      if (S.followersDelta) right.appendChild(h("p", "", `Người theo dõi ${S.followersDelta > 0 ? "+" : ""}${S.followersDelta}`));
      if (S.expiredK) right.appendChild(h("p", "", `Hết hạn bỏ đi: ${fmtK(S.expiredK)} (${Object.entries(S.expired || {}).map(([id, n]) => `${STOCK[id]?.name || id} ${n}`).join(", ")}). Nhập vừa đủ theo dự báo để đỡ hao.`));
      if (S.fair) right.appendChild(h("p", "", `Ca hội chợ: giá +15%, +${FAIR.guests} khách.`));
      if (S.levelUps?.length) { const p = h("p", "card-note gold", `Lên cấp ${S.levelUps.join(", ")} trong ca!`); p.dataset.card = "levelUp"; right.appendChild(p); }
      if (S.challenge) { const p = h("p", "card-note" + (S.challenge.ok ? " gold" : "")); p.dataset.card = "challengeResult"; p.textContent = `Thử thách “${S.challenge.name}”: ${S.challenge.ok ? `ĐẠT · +${S.challenge.money}k, +${S.challenge.xp} XP` : "chưa đạt"}. ${S.challenge.line}`; right.appendChild(p); }
      for (const bg of S.badges || []) { const p = h("p", "card-note gold"); p.dataset.card = "badge"; p.textContent = `Huy hiệu mới: ${bg.name}. ${bg.line}`; right.appendChild(p); }
      const dm = (S.moments || []).filter((m) => m.kind === "drama").slice(-2);
      for (const m of dm) right.appendChild(h("p", "say small", `${m.name}: “${m.line}”`));
      for (const r of [S.best, S.worst].filter(Boolean).filter((r, i, a) => a.findIndex((x) => x.id === r.id) === i)) {
        const d = h("div", "rev"); d.appendChild(h("span", "st", "★".repeat(r.stars) + "☆".repeat(5 - r.stars) + " ")); d.appendChild(h("b", "", r.name + ": ")); d.appendChild(document.createTextNode(r.line)); right.appendChild(d);
      }
      grid.appendChild(right);
      c.appendChild(grid);
      const foot = h("div", "row sum-foot"); // TLC2-13: chân bảng chốt ca dính đáy ⇒ "Ngày tiếp theo" luôn thấy, không phải cuộn tìm
      const go = btn("Ngày tiếp theo", "primary", "nextDay", () => { dispatch({ type: "closeSummary" }); close(); hooks.afterSummary(); }); go.dataset.autofocus = "";
      // Review chưa trả lời ⇒ nút dẫn thẳng tới ô trả lời (như Trà Sữa); không có thì thôi
      const open = (hooks.state().feed || []).filter((r) => !r.reply);
      if (open.length) { const rb = btn(`Trả lời review (${open.length})`, "accent", "replyReviews", () => { bookSel = open[0].id; notebook(hooks.state(), "reviews", "summary"); }); foot.appendChild(rb); }
      foot.appendChild(btn("Lưu ảnh Nhật Ký", "", "journal", () => journalCard(hooks.state(), "summary")));
      foot.appendChild(btn("Khoe kết quả", "", "shareResult", () => shareResult(summaryShare(S))));
      foot.appendChild(btn("Nâng cấp", "", "upgrades", () => { dispatch({ type: "closeSummary" }); close(); hooks.afterSummary("shop"); }));
      foot.appendChild(go); c.appendChild(foot);
      const info = hooks.replayInfo?.();
      if (info && info.day === S.day) { const r2 = h("div", "row"); r2.appendChild(btn(`Chơi lại ngày ${S.day}`, "small", "replayDay", () => confirmReplay())); c.appendChild(r2); }
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
  // ---------- sự kiện Drama ----------
  function event(state, after) {
    if (!currentEvent(state)) { after?.(); return; }
    open("event", (c) => {
      c.classList.add("drama");
      buildEvent(c, state, atlas, { dispatch, persona: state.owner?.persona, onDone: () => { close(); after ? after() : hooks.resume(); } });
    });
  }
  // ---------- Sổ quản lý ----------
  let bookTab = "reviews", bookSel = null;
  function notebook(state, tab, back) {
    if (tab) bookTab = tab;
    const ret = back ?? current;
    const draw = (c) => buildNotebook(c, hooks.state(), {
      dispatch: (a) => { const r = dispatch(a); draw(c); return r; },
      tab: bookTab, sel: bookSel,
      setTab: (id) => { bookTab = id; draw(c); }, setSel: (id) => { bookSel = id; draw(c); },
      openCard: () => journalCard(hooks.state(), "notebook"),
      close: () => { close(); if (ret === "prep") prep(hooks.state()); else if (ret === "summary") summary(hooks.state()); else hooks.resume(); },
    });
    open("notebook", (c) => { c.classList.add("book"); draw(c); });
  }
  // ---------- thẻ Nhật Ký ----------
  function journalCard(state, back) {
    const S = state.lastSummary;
    if (!S) return;
    let hide = false, moment = 0;
    open("journal", (c) => {
      c.appendChild(h("h2", "", `Nhật Ký Làm Chủ · ngày ${S.day}`));
      const cv = document.createElement("canvas"); cv.className = "journal-canvas"; cv.width = 1080; cv.height = 1350; cv.id = "journalCanvas";
      c.appendChild(cv);
      const redraw = async () => { const card = await drawJournal(cv, S, { shopName: state.shopName, hideName: hide, moment, scene: hooks.sceneImage?.() }); cv.dataset.ready = "1"; cv.dataset.quote = card.quote; };
      redraw();
      const row = h("div", "row");
      row.appendChild(btn("Lưu PNG", "primary", "savePng", async () => { await download(cv, `nhat-ky-ngay-${S.day}.png`); }));
      row.appendChild(btn("Chia sẻ", "", "sharePng", async () => { if (!(await share(cv, `nhat-ky-ngay-${S.day}.png`, S.headline || ""))) { await download(cv, `nhat-ky-ngay-${S.day}.png`); hooks.toast("Máy không chia sẻ được, đã tải PNG.", ""); } }));
      row.appendChild(btn("Ẩn tên tiệm", "", "hideName", () => { hide = !hide; redraw(); }));
      row.appendChild(btn("Đổi khoảnh khắc", "", "nextMoment", () => { moment++; redraw(); }));
      row.appendChild(btn("Đóng", "", "closeJournal", () => { close(); if (back === "summary") summary(hooks.state()); else if (back === "notebook") notebook(hooks.state(), "journal", "prep"); else hooks.resume(); }));
      c.appendChild(row);
    });
  }
  return { open, close, intro, prep, help, pause, summary, complaint, stockout, nochange, event, notebook, journalCard, get current() { return current; } };
}
export { orderText, OVENS, caseCap };
