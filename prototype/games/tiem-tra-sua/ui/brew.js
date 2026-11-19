// Quầy pha: phiếu đang ghim, ly lớn đổi hình theo từng bước, dải 7 bước, lựa chọn nguyên liệu (hình từ atlas + chữ + tồn kho), hành động.
// Chỉ gửi action qua dispatch() — không tự đổi trạng thái.
import { icon, crisp } from "../render/atlas.js?v=m35";
import { createCupView } from "../render/cup.js?v=m35";
import { STEPS, STEP_LABEL, STEP_VERB, STEP_ICON, CHOICES, choiceName, useOf } from "../data/ingredients.js?v=m35";
import { RECIPE } from "../data/recipes.js?v=m35";
import { customer, nextStep, patienceLeft, curCup, curStation, activeCid, orderAt, cupsLeft } from "../core/shift.js?v=m35";
import { cupNotes } from "../core/cupview.js?v=m35";
import { hasStock } from "../core/economy.js?v=m35";
import { cupSpec } from "../core/score.js?v=m35";
import { BATCHES, PEARL_RAW } from "../data/equipment.js?v=m35";
import { kitchenSlots, owns } from "../core/equipment.js?v=m35";

const CROP = { cupui: [8, 52, 144, 132] };
export const ingIcon = (atlas, ref, px) => icon(atlas, ref, px, "ico", ref && CROP[ref[0]] && !/cup|tea-|milk-high|served|dome/.test(ref[1]) ? CROP[ref[0]] : null);
export const headIcon = (atlas, role, px = 40, mood = "waiting") => icon(atlas, ["reactions", `${role}-${mood}`], px, "ico face", [26, 6, 44, 44]);

const orderValue = (step, o) => (step === "sugar" ? o.sugar : o[step]);
const label = (step, id) => (step === "sugar" ? `${id}% đường` : choiceName(step, id));

export function createBrew(root, atlas, dispatch) {
  const $ = (sel) => root.querySelector(sel);
  const cupView = createCupView($("#cupView"), atlas, { scale: 1.5 });
  // nền Quầy pha = cắt cảnh tiệm: cỡ crisp để ô tranh 2×2 phủ số nguyên px thiết bị (không nhòe)
  const station = $("#cupView")?.closest(".station");
  if (station) { const s = crisp(1); station.style.backgroundSize = `${1280 * s}px ${720 * s}px`; station.style.backgroundPosition = `${-250 * s}px ${-40 * s}px`; }
  const stepsEl = $("#steps"), optsEl = $("#opts"), ticketEl = $("#ticket"), stationsEl = $("#stations");
  const notesEl = document.createElement("div"); notesEl.className = "cup-notes"; $("#cupView").appendChild(notesEl);
  let lastStations = "";
  stationsEl.addEventListener("click", (e) => { const b = e.target.closest("button[data-station]"); if (b && !b.disabled) dispatch({ type: "select", station: Number(b.dataset.station) }); });
  STEPS.forEach((st, i) => {
    const li = document.createElement("li"); li.dataset.step = st;
    li.appendChild(ingIcon(atlas, STEP_ICON[st], 26));
    const sp = document.createElement("span"); sp.textContent = `${i + 1}. ${STEP_LABEL[st]}`; li.appendChild(sp);
    stepsEl.appendChild(li);
  });
  $("#undoBtn").addEventListener("click", () => dispatch({ type: "undo" }));
  $("#discardBtn").addEventListener("click", () => {
    const b = $("#discardBtn");
    if (!b.dataset.confirm) { b.dataset.confirm = "1"; b.textContent = "Bấm lần nữa để đổ"; setTimeout(() => { delete b.dataset.confirm; b.textContent = "Đổ bỏ ly"; }, 2500); return; }
    delete b.dataset.confirm; b.textContent = "Đổ bỏ ly";
    dispatch({ type: "discard" });
  });
  $("#serveBtn").addEventListener("click", () => { const a = activeCid(lastState?.shift); if (a !== null && a !== undefined) dispatch({ type: "serve", cid: a }); });
  optsEl.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-step]");
    if (!b || b.disabled) return;
    const step = b.dataset.step, raw = b.dataset.id;
    dispatch({ type: "brew", step, id: step === "sugar" ? Number(raw) : raw });
  });

  let lastKey = "", lastTicket = "", lastState = null, lastKitchen = "";
  const kitchenEl = $("#kitchen");
  kitchenEl.addEventListener("click", (e) => { const b = e.target.closest("button[data-cook]"); if (b && !b.disabled) dispatch({ type: "cook", size: Number(b.dataset.cook) }); });
  const avail = (state, step, ch) => (ch.kitchen ? (state.shift?.kitchen.ready || 0) >= 1 : hasStock(state, useOf(step, ch.id)));

  function renderKitchen(state) {
    const sh = state.shift;
    kitchenEl.hidden = !sh;
    if (!sh) return;
    const k = sh.kitchen, slots = kitchenSlots(state), raw = state.stock[PEARL_RAW] || 0;
    const ord = orderAt(state, curStation(sh));
    const needs = !!(ord && ord.topping === "tran-chau" && k.ready < 1 && !k.batches.length);
    const key = JSON.stringify([k.ready, k.batches.length, raw, slots, state.level, needs, !!sh.dialog]);
    if (key !== lastKitchen) {
      lastKitchen = key;
      kitchenEl.textContent = "";
      kitchenEl.appendChild(icon(atlas, slots > 1 ? ["upgrades", "dual-pot-cooker"] : ["equip", "topping-stove"], 46, "ico stove"));
      const info = document.createElement("div"); info.className = "k-info";
      const t = document.createElement("b"); t.textContent = "Bếp topping · trân châu sẵn " + k.ready + " phần"; info.appendChild(t);
      const sm = document.createElement("small"); sm.textContent = "Trân châu sống trong kho: " + raw + (k.batches.length ? " · đang nấu" : ""); info.appendChild(sm);
      const bars = document.createElement("div"); bars.className = "k-bars"; info.appendChild(bars);
      for (let i = 0; i < k.batches.length; i++) { const bar = document.createElement("div"); bar.className = "pbar wide cook"; bar.appendChild(document.createElement("i")); bars.appendChild(bar); }
      kitchenEl.appendChild(info);
      const btns = document.createElement("div"); btns.className = "k-btns";
      for (const [size, B] of Object.entries(BATCHES)) {
        if (B.unlock > state.level) continue;
        const b = document.createElement("button"); b.type = "button"; b.className = "btn small"; b.dataset.cook = size;
        b.textContent = "Nấu " + size + " · " + B.ms / 1000 + "s";
        b.disabled = k.batches.length >= slots || raw < Number(size) || !!sh.dialog;
        b.title = raw < Number(size) ? "Thiếu trân châu sống, nhập thêm ở bảng Chuẩn bị ca" : k.batches.length >= slots ? "Bếp đang nấu" : "Nấu mẻ " + size + " phần";
        if (needs && !b.disabled && size === "3") b.classList.add("hint");
        btns.appendChild(b);
      }
      kitchenEl.appendChild(btns);
    }
    const bars = kitchenEl.querySelectorAll(".k-bars .pbar");
    k.batches.forEach((b, i) => { if (bars[i]) bars[i].firstChild.style.width = Math.min(100, (1 - (b.doneAt - sh.t) / b.ms) * 100) + "%"; });
  }

  function renderTicket(state) {
    const sh = state.shift, cid = activeCid(sh), c = cid !== null ? customer(state, cid) : null;
    const cup = curCup(sh), st = curStation(sh);
    const spec = cup ? cupSpec(cup) : {};
    const key = c ? `${c.id}|${st.item}|${JSON.stringify(spec)}|${c.mood}|${c.filled.map((x) => (x ? 1 : 0)).join("")}|${JSON.stringify(c.items[st.item ?? 0]?.order)}` : sh ? "none" : "closed";
    if (key !== lastTicket) {
      lastTicket = key;
      ticketEl.textContent = "";
      ticketEl.classList.toggle("empty", !c);
      if (!c) {
        const p = document.createElement("p"); p.className = "ticket-empty";
        p.textContent = sh ? (sh.customers.some((q) => q.phase === "wait") ? "Chạm vào khách đang chờ (hoặc phiếu bên dưới) để ghim đơn lên quầy." : "Chưa có khách chờ. Lau quầy cho bóng, khách sắp tới.") : "Tiệm đang đóng cửa.";
        ticketEl.appendChild(p);
      } else {
        const idx = st.item ?? c.filled.findIndex((x) => !x);
        const item = c.items[idx >= 0 ? idx : 0];
        const r = RECIPE[item.recipe], o = item.order;
        const head = document.createElement("div"); head.className = "ticket-head";
        head.appendChild(headIcon(atlas, c.sprite, 44, c.mood === "impatient" ? "impatient" : "waiting"));
        const h = document.createElement("div");
        h.innerHTML = `<b class="t-name"></b><span class="t-drink"></span>`;
        h.querySelector(".t-name").textContent = `#${c.id} · ${c.name}${c.items.length > 1 ? ` · ly ${idx + 1}/${c.items.length}` : ""}`;
        h.querySelector(".t-drink").textContent = r.name;
        head.appendChild(h);
        const price = document.createElement("span"); price.className = "t-price"; price.textContent = c.price + "k"; head.appendChild(price);
        ticketEl.appendChild(head);
        const ul = document.createElement("ul"); ul.className = "t-items";
        for (const st of ["base", "add", "sugar", "ice", "topping"]) {
          const want = orderValue(st, o);
          if (st === "add" && want === "none") continue;
          const li = document.createElement("li");
          const ch = CHOICES[st].find((x) => x.id === want);
          if (ch?.icon) li.appendChild(ingIcon(atlas, ch.icon, 22));
          else { const g = ingIcon(atlas, STEP_ICON[st], 22); if (want === "none" || want === "khong" || want === 0) g.classList.add("off"); li.appendChild(g); }
          const sp = document.createElement("span"); sp.textContent = label(st, want); li.appendChild(sp);
          if (spec[st] !== undefined) li.className = spec[st] === want ? "ok" : "bad";
          li.dataset.step = st;
          ul.appendChild(li);
        }
        ticketEl.appendChild(ul);
        if (c.items.length > 1) {
          const tray = document.createElement("div"); tray.className = "tray";
          c.items.forEach((it, i) => {
            const sp = document.createElement("span");
            sp.className = "tray-cup" + (c.filled[i] ? " done" : "") + (i === idx ? " now" : "");
            sp.appendChild(ingIcon(atlas, c.filled[i] ? ["cupui", "served-milk-tea"] : ["pantry", "cup-stack"], 22));
            sp.appendChild(document.createTextNode(`${i + 1}. ${RECIPE[it.recipe].short} · ${it.order.sugar}% · ${choiceName("ice", it.order.ice)}`));
            tray.appendChild(sp);
          });
          ticketEl.appendChild(tray);
        }
        const bar = document.createElement("div"); bar.className = "pbar wide"; bar.appendChild(document.createElement("i")); ticketEl.appendChild(bar);
      }
    }
    if (c) {
      const bar = ticketEl.querySelector(".pbar"), p = patienceLeft(state, c);
      if (bar) { bar.firstChild.style.width = p * 100 + "%"; bar.className = "pbar wide" + (p <= 0.35 ? " low" : p <= 0.6 ? " mid" : ""); }
    }
  }

  function renderOptions(state) {
    const sh = state.shift;
    const step = sh ? nextStep(curCup(sh)) : null;
    const cid = activeCid(sh), c = cid !== null && cid !== undefined ? customer(state, cid) : null;
    const ord = sh ? orderAt(state, curStation(sh)) : null;
    const dispenser = owns(state, "portion-dispenser") && (step === "sugar" || step === "ice");
    const hintWant = (sh?.hints || dispenser) && ord && step && step !== "cup" && step !== "lid" ? orderValue(step, ord) : null;
    const key = JSON.stringify([!!sh, step, state.level, hintWant, step ? CHOICES[step].map((x) => avail(state, step, x)) : 0, sh?.kitchen.ready]);
    if (key === lastKey) return;
    lastKey = key;
    optsEl.textContent = "";
    const title = $("#optsTitle");
    if (!sh) { title.textContent = "Mở quán để bắt đầu pha."; return; }
    if (!step) { title.textContent = c ? (cupsLeft(c) > 1 ? `Ly đã đóng nắp. Ghép vào đơn của ${c.name}!` : `Ly đã đóng nắp. Giao cho ${c.name}!`) : "Ly đã đóng nắp. Chọn khách để giao."; return; }
    title.textContent = `Bước ${STEPS.indexOf(step) + 1}/7 · ${STEP_VERB[step]}`;
    CHOICES[step].forEach((ch, i) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "opt"; b.dataset.step = step; b.dataset.id = ch.id;
      const locked = (ch.unlock || 1) > state.level;
      const out = !locked && !avail(state, step, ch);
      if (ch.icon) b.appendChild(ingIcon(atlas, ch.icon, step === "lid" || step === "cup" ? 44 : 40));
      else if (step === "sugar" || step === "ice") b.appendChild(ingIcon(atlas, STEP_ICON[step], 34));
      else { const g = ingIcon(atlas, STEP_ICON[step], 40); g.classList.add("ghost"); b.appendChild(g); }
      const nm = document.createElement("span"); nm.className = "opt-name"; nm.textContent = ch.name; b.appendChild(nm);
      const meta = document.createElement("small");
      const use = Object.entries(useOf(step, ch.id));
      meta.textContent = locked ? `Mở ở cấp ${ch.unlock}` : ch.kitchen ? (out ? "Chưa nấu, bấm Nấu" : `Sẵn: ${sh.kitchen.ready}`) : out ? "Hết hàng" : use.length ? `Kho: ${use.map(([id]) => state.stock[id] || 0).join(" · ")}` : "Không tốn";
      b.appendChild(meta);
      const kb = document.createElement("kbd"); kb.textContent = i + 1; b.appendChild(kb);
      if (step === "sugar" || step === "ice") b.classList.add("lvl");
      if (locked || out) { b.disabled = true; b.classList.add(locked ? "locked" : "out"); }
      if (hintWant !== null && ch.id === hintWant) b.classList.add("hint");
      b.setAttribute("aria-label", `${ch.name}${locked ? `, mở ở cấp ${ch.unlock}` : out ? ", hết hàng" : ""}`);
      optsEl.appendChild(b);
    });
  }

  function render(state, { justDid = null, reduced = false } = {}) {
    lastState = state;
    const sh = state.shift;
    root.classList.toggle("closed", !sh);
    const cup = curCup(sh);
    cupView.update(cup, { justDid, reduced });
    const notes = cupNotes(cup);
    notesEl.textContent = ""; notesEl.hidden = !notes.length;
    for (const n of notes) { const sp = document.createElement("span"); sp.textContent = n; notesEl.appendChild(sp); }
    renderStations(state);
    const step = sh ? nextStep(cup) : null;
    for (const li of stepsEl.children) {
      const i = STEPS.indexOf(li.dataset.step), done = cup ? cup.steps.length : 0;
      li.className = i < done ? "done" : li.dataset.step === step ? "now" : "";
    }
    renderTicket(state);
    renderOptions(state);
    renderKitchen(state);
    $("#undoBtn").disabled = !cup || cup.sealed || !cup.steps.length || !!sh.dialog;
    $("#discardBtn").disabled = !cup || !!sh?.dialog;
    const cid = activeCid(sh), c = cid !== null && cid !== undefined ? customer(state, cid) : null;
    const sb = $("#serveBtn");
    const noLid = !!cup && !cup.sealed && cup.steps.length === STEPS.length - 1;
    sb.disabled = !((cup?.sealed || noLid) && c && c.phase === "wait") || !!sh.dialog;
    const left = c ? cupsLeft(c) : 0;
    sb.textContent = c && noLid ? `Giao luôn (chưa đóng nắp!)` : c ? (left > 1 ? `Ghép ly vào đơn ${c.name} (${c.items.length - left + 1}/${c.items.length})` : c.items.length > 1 ? `Giao đủ ${c.items.length} ly cho ${c.name}` : `Giao cho ${c.name}`) : "Giao ly";
    sb.classList.toggle("ready", !sb.disabled && !!cup?.sealed);
  }
  /** Chỗ pha song song (bàn pha đôi / ba): mỗi nút một chỗ, ghi khách + tiến độ ly. */
  function renderStations(state) {
    const sh = state.shift;
    const list = sh?.stations || [];
    const key = JSON.stringify([sh?.sel, list.map((x) => [x.cid, x.item, x.cup?.steps.length || 0, !!x.cup?.sealed])]);
    if (key === lastStations) return;
    lastStations = key;
    stationsEl.textContent = "";
    stationsEl.hidden = list.length < 2;
    if (list.length < 2) return;
    list.forEach((x, i) => {
      const b = document.createElement("button"); b.type = "button"; b.className = "stn" + (i === sh.sel ? " on" : ""); b.dataset.station = i;
      b.setAttribute("aria-pressed", i === sh.sel ? "true" : "false");
      const c = x.cid !== null ? customer(state, x.cid) : null;
      const n = x.cup ? x.cup.steps.length : 0;
      const t = document.createElement("b"); t.textContent = `Chỗ ${i + 1}`; b.appendChild(t);
      const sm = document.createElement("small"); sm.textContent = (c ? c.name + (c.items.length > 1 ? ` · ly ${(x.item ?? 0) + 1}` : "") : "Trống") + ` · ${x.cup?.sealed ? "xong" : n + "/7"}`; b.appendChild(sm);
      stationsEl.appendChild(b);
    });
  }
  /** Cập nhật nhẹ mỗi khung (thanh kiên nhẫn trên phiếu). */
  function frame(state) { renderTicket(state); renderKitchen(state); renderOptions(state); renderStations(state); }
  return { render, frame, act: (w) => cupView.act(w), setCupScale: (s) => cupView.setScale(s) };
}
