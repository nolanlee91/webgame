// HUD, dải phiếu khách, và các bảng phủ (chào mừng, chuẩn bị ca, hội thoại khiếu nại, chốt ca, tạm dừng, cách chơi).
import { icon } from "../render/atlas.js?v=m34";
import { ingIcon, headIcon } from "./brew.js?v=m34";
import { RECIPE, RECIPES } from "../data/recipes.js?v=m34";
import { STOCK, STOCK_IDS, choiceName } from "../data/ingredients.js?v=m34";
import { ARCHETYPES } from "../data/customers.js?v=m34";
import { COMPLAINT } from "../data/lines.js?v=m34";
import { LEVELS, MAX_LEVEL } from "../data/levels.js?v=m34";
import { patienceLeft, customer, cupsLeft, activeCid } from "../core/shift.js?v=m34";
import { capacity, stockUsed, packPrice, packSize, recipeCost, SUPPLIERS } from "../core/economy.js?v=m34";
import { consignAvailable, needsBailout, CONSIGN_KIT, PROMOS, PROMO_UNLOCK } from "../core/business.js?v=m34";
import { owns, stationCount, appealCap } from "../core/equipment.js?v=m34";
import { xpProgress, unlocksAt } from "../core/progression.js?v=m34";
import { fill } from "../core/text.js?v=m34";
import { EQUIPMENT, EQUIPMENT_IDS } from "../data/equipment.js?v=m34";
import { appeal } from "../core/equipment.js?v=m34";
import { portrait as portraitOf } from "./panels.js?v=m34";

const h = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
const k = (n) => `${n.toLocaleString("vi-VN")}k`;
const mmss = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
const drinkIcon = (r) => (r.add === "sua" || r.add === "kem-sua" || r.base === "sua-tuoi" ? ["cupui", "served-milk-tea"] : ["cupui", "tea-mid"]);

// ---------- HUD ----------
export function createHud(root, atlas) {
  const items = {};
  const add = (id, ico, title) => {
    const d = h("div", "chip"); d.title = title; d.id = id;
    d.appendChild(icon(atlas, ["icons", ico], 26));
    const b = h("b"); d.appendChild(b);
    const sm = h("small"); d.appendChild(sm);
    root.appendChild(d); items[id] = { b, sm, d };
  };
  add("hMoney", "coin", "Tiền mặt");
  add("hClock", "clock", "Thời gian ca");
  add("hRep", "review-star", "Danh tiếng");
  add("hFans", "customer", "Người theo dõi · đánh giá");
  add("hLevel", "upgrade", "Cấp tiệm");
  add("hStock", "storage", "Kho");
  const xpBar = h("div", "xpbar"); xpBar.appendChild(h("i")); items.hLevel.d.appendChild(xpBar);
  return function render(state) {
    const sh = state.shift;
    items.hMoney.b.textContent = k(state.money); items.hMoney.sm.textContent = "Tiền";
    if (sh) {
      const left = sh.duration - sh.t;
      items.hClock.b.textContent = left > 0 ? mmss(left) : "Hết giờ";
      items.hClock.sm.textContent = `Ngày ${sh.day}`;
      items.hClock.d.classList.toggle("warn", left > 0 && left < 20000);
    } else { items.hClock.b.textContent = "Đóng cửa"; items.hClock.sm.textContent = `Ngày ${state.day}`; items.hClock.d.classList.remove("warn"); }
    items.hRep.b.textContent = state.rep; items.hRep.sm.textContent = "Danh tiếng";
    const f = state.followers || 0;
    items.hFans.b.textContent = f >= 1000 ? (f / 1000).toLocaleString("vi-VN", { maximumFractionDigits: 1 }) + "k" : String(f);
    items.hFans.sm.textContent = state.rating ? `${state.rating.toLocaleString("vi-VN")}★` : "theo dõi";
    const xp = xpProgress(state);
    items.hLevel.b.textContent = `Cấp ${state.level}`; items.hLevel.sm.textContent = xp.need ? `${xp.into}/${xp.need} XP` : "Tối đa";
    xpBar.firstChild.style.width = (xp.need ? Math.min(100, (xp.into / xp.need) * 100) : 100) + "%";
    items.hStock.b.textContent = `${stockUsed(state)}/${capacity(state)}`; items.hStock.sm.textContent = "Kho";
  };
}

// ---------- phiếu khách ----------
export function createRail(root, atlas, onPin) {
  const cards = new Map();
  const goals = h("div", "goals"); goals.hidden = true; root.appendChild(goals);
  let goalsKey = "";
  const empty = h("p", "rail-empty", "");
  root.appendChild(empty);
  root.addEventListener("click", (e) => { const b = e.target.closest("button[data-cid]"); if (b && !b.disabled) onPin(Number(b.dataset.cid)); });
  return function render(state) {
    const sh = state.shift;
    const list = (sh?.customers || []).filter((c) => c.phase === "wait" || c.phase === "enter");
    const ms = sh?.missions || [];
    const gk = JSON.stringify(ms.map((m) => [m.prog, m.done]));
    goals.hidden = !ms.length;
    if (gk !== goalsKey) {
      goalsKey = gk; goals.textContent = "";
      goals.appendChild(h("b", "", "Nhiệm vụ ngày"));
      for (const m of ms) { const li = h("span", "goal" + (m.done ? " done" : ""), `${m.done ? "✓ " : ""}${m.text} · ${m.prog}/${m.n}`); goals.appendChild(li); }
    }
    empty.hidden = list.length > 0;
    empty.textContent = !sh ? "Phiếu gọi món sẽ hiện ở đây khi tiệm mở cửa." : sh.schedule.length ? "Chưa có khách. Khách kế tiếp sắp tới…" : "Hết khách trong ca.";
    const live = new Set();
    for (const c of list) {
      live.add(c.id);
      let n = cards.get(c.id);
      if (!n) {
        const b = h("button", "slip"); b.type = "button"; b.dataset.cid = c.id;
        const top = h("div", "slip-top");
        top.appendChild(headIcon(atlas, c.sprite, 34));
        const tx = h("div", "slip-tx");
        tx.appendChild(h("b", "", c.name));
        tx.appendChild(h("span", "", c.items.length > 1 ? `${c.items.length} ly · ${RECIPE[c.recipe].short}${c.items.some((it) => it.recipe !== c.recipe) ? " +…" : ""}` : RECIPE[c.recipe].short));
        top.appendChild(tx);
        if (c.items.length > 1) { const bd = h("span", "cups-badge", ""); top.appendChild(bd); }
        b.appendChild(top);
        b.appendChild(h("small", "slip-spec", `${c.order.sugar}% đường · ${choiceName("ice", c.order.ice)}`));
        const bar = h("div", "pbar"); bar.appendChild(h("i")); b.appendChild(bar);
        const st = h("em", "slip-state"); b.appendChild(st);
        root.appendChild(b);
        n = { b, bar, st, bd: top.querySelector(".cups-badge") };
        cards.set(c.id, n);
      }
      const p = patienceLeft(state, c);
      n.bar.firstChild.style.width = p * 100 + "%";
      n.bar.className = "pbar" + (p <= 0.35 ? " low" : p <= 0.6 ? " mid" : "");
      n.b.disabled = c.phase !== "wait";
      const act = activeCid(sh) === c.id, onAny = sh.stations.some((x) => x.cid === c.id);
      n.b.classList.toggle("on", act);
      if (n.bd) n.bd.textContent = `${c.items.length - cupsLeft(c)}/${c.items.length}`;
      n.st.textContent = c.phase === "enter" ? "Đang vào…" : act ? "Đang pha" : onAny ? "Ở chỗ pha khác" : p <= 0.35 ? "Sắp bỏ về!" : "Chạm để ghim";
    }
    for (const [id, n] of cards) if (!live.has(id)) { n.b.remove(); cards.delete(id); }
  };
}

// ---------- bảng phủ ----------
export function createOverlays(root, atlas, dispatch, hooks) {
  let current = null;
  const close = () => { root.textContent = ""; root.hidden = true; root.classList.remove("pass"); current = null; hooks.onClose?.(); };
  function open(kind, build, { modal = true, cls = "" } = {}) {
    root.textContent = "";
    root.hidden = false;
    root.classList.toggle("pass", !modal);
    current = kind;
    const card = h("section", "sheet " + cls);
    card.setAttribute("role", modal ? "dialog" : "region");
    card.setAttribute("aria-modal", modal ? "true" : "false");
    card.dataset.kind = kind;
    build(card);
    root.appendChild(card);
    const f = card.querySelector("[data-autofocus]") || card.querySelector("h2");
    if (f) { if (f.tagName === "H2") f.tabIndex = -1; f.focus({ preventScroll: true }); }
    return card;
  }

  function intro(state) {
    open("intro", (c) => {
      c.classList.add("intro");
      const art = h("div", "intro-art");
      const bg = h("img"); bg.src = "assets/street-background.webp"; bg.alt = ""; bg.width = 1280; bg.height = 720; art.appendChild(bg);
      art.appendChild(icon(atlas, ["portraits", "barista"], 150, "ico portrait"));
      c.appendChild(art);
      const tx = h("div", "intro-tx");
      tx.appendChild(h("h2", "", "Chào chủ tiệm mới!"));
      tx.appendChild(h("p", "", "Dì Ba giao lại cái tiệm nhỏ đầu hẻm, kèm một câu: \"Pha cho đúng, thối tiền cho đủ, đừng cãi khách về chuyện 0% đường.\" Hôm nay là ngày đầu: 5 vị khách, kiên nhẫn dài hơn và có gợi ý từng bước."));
      const lab = h("label", "field"); lab.appendChild(h("span", "", "Tên tiệm của bạn"));
      const inp = h("input"); inp.id = "shopName"; inp.maxLength = 32; inp.value = state.shopName; inp.autocomplete = "off"; inp.dataset.autofocus = "";
      lab.appendChild(inp); tx.appendChild(lab);
      const go = h("button", "btn primary big", "Nhận tiệm"); go.id = "introGo"; go.type = "button";
      go.addEventListener("click", () => { dispatch({ type: "setName", name: inp.value || state.shopName }); dispatch({ type: "seeIntro" }); hooks.afterIntro(); });
      inp.addEventListener("keydown", (e) => { if (e.key === "Enter") go.click(); });
      tx.appendChild(go);
      c.appendChild(tx);
    });
  }

  let supplier = "di-ba";
  function prep(state) {
    open("prep", (c) => {
      c.classList.add("prep");
      const hd = h("header", "sheet-head");
      hd.appendChild(icon(atlas, ["icons", "journal"], 36));
      const t = h("div"); t.appendChild(h("h2", "", `Chuẩn bị ca · Ngày ${state.day}`));
      t.appendChild(h("p", "muted", state.tutorialDone ? "Khách hôm nay 6–10 người (thêm nếu review tốt, nhiều người theo dõi), có hai đợt cao điểm. Xem kho trước khi mở cửa." : "Ngày học: 5 khách, mỗi phiếu có gợi ý bước kế tiếp."));
      t.classList.add("grow1");
      hd.appendChild(t);
      const nb = h("button", "btn small", "Sổ"); nb.type = "button"; nb.id = "prepBook";
      nb.addEventListener("click", () => hooks.notebook?.("reviews", () => prep(hooks.state())));
      hd.appendChild(nb);
      c.appendChild(hd);
      if (needsBailout(state)) {
        const bx = h("div", "box bail");
        bx.appendChild(h("h3", "", "Hụt vốn rồi!"));
        bx.appendChild(h("p", "", "Không đủ tiền và hàng để pha một ly cơ bản. Dì Ba cho ký gửi một gói hàng (khoảng 6 ly trà đào, 3 ly trà sữa). Bán tới đâu trừ giá vốn tới đó, không lãi, không phạt."));
        const b = h("button", "btn primary", "Nhận gói ký gửi"); b.type = "button"; b.id = "consignBtn";
        b.disabled = !consignAvailable(state);
        if (b.disabled) b.title = "Mỗi ngày nhận một lần";
        b.addEventListener("click", () => { dispatch({ type: "consign" }); prep(hooks.state()); });
        bx.appendChild(b);
        c.appendChild(bx);
      } else if (state.consign?.owed) c.appendChild(h("p", "muted small", `Còn nợ ký gửi Dì Ba ${k(state.consign.owed)}, tự trừ dần khi bán.`));
      const grid = h("div", "prep-grid");
      // menu
      const menu = h("div", "box");
      menu.appendChild(h("h3", "", "Menu đang bán"));
      const ul = h("ul", "menu");
      for (const r of RECIPES) {
        const li = h("li", r.unlock > state.level ? "locked" : "");
        li.appendChild(ingIcon(atlas, drinkIcon(r), 40));
        const tx = h("div");
        tx.appendChild(h("b", "", r.name + (state.drama?.demand === r.id ? " · đang hot" : "")));
        tx.appendChild(h("small", "", r.unlock > state.level ? `Mở ở cấp ${r.unlock}` : `Bán ${k(r.price)} · vốn ${k(recipeCost(r.id))} · lãi ${k(r.price - recipeCost(r.id))}`));
        li.appendChild(tx);
        ul.appendChild(li);
      }
      menu.appendChild(ul);
      grid.appendChild(menu);
      // kho
      const st = h("div", "box");
      const used = stockUsed(state), cap = capacity(state);
      const sth = h("h3", "kho-h"); sth.appendChild(icon(atlas, ["fixtures", "storage-shelf"], 34)); sth.appendChild(h("span", "", `Kho nguyên liệu · ${used}/${cap} phần`)); st.appendChild(sth);
      if (state.level >= SUPPLIERS.si.unlock) {
        const sw = h("div", "seg"); sw.setAttribute("role", "group"); sw.setAttribute("aria-label", "Nhà cung cấp");
        for (const [id, S] of Object.entries(SUPPLIERS)) {
          const b = h("button", "btn small" + (supplier === id ? " primary" : ""), S.name); b.type = "button"; b.dataset.supplier = id;
          b.setAttribute("aria-pressed", supplier === id ? "true" : "false");
          b.addEventListener("click", () => { supplier = id; prep(hooks.state()); });
          sw.appendChild(b);
        }
        st.appendChild(sw);
        st.appendChild(h("small", "muted", supplier === "si" ? "Vựa sỉ: gói gấp đôi, rẻ hơn 10%, tốn chỗ kho. Chỉ giao trước ca." : "Dì Ba: gói nhỏ, giữa ca giao gấp +15%."));
      } else supplier = "di-ba";
      const sg = h("div", "stock");
      for (const id of STOCK_IDS) {
        const it = STOCK[id];
        if (it.unlock > state.level) continue;
        const row = h("div", "srow" + ((state.stock[id] || 0) <= 2 ? " low" : ""));
        row.appendChild(ingIcon(atlas, it.icon, 34));
        const tx = h("div"); tx.appendChild(h("b", "", it.name)); tx.appendChild(h("small", "", `còn ${state.stock[id] || 0} phần`)); row.appendChild(tx);
        const price = packPrice(id, false, supplier), n = packSize(id, supplier);
        const b = h("button", "btn small", `+${n} · ${k(price)}`); b.type = "button"; b.dataset.restock = id;
        b.disabled = state.money < price || cap - used < n;
        b.title = b.disabled ? (state.money < price ? "Không đủ tiền" : "Kho đầy") : `Nhập ${n} phần ${it.name}`;
        b.addEventListener("click", () => { dispatch({ type: "restock", id, supplier }); prep(hooks.state()); });
        row.appendChild(b);
        sg.appendChild(row);
      }
      st.appendChild(sg);
      grid.appendChild(st);
      c.appendChild(grid);
      // quảng bá
      if (state.level >= PROMO_UNLOCK) {
        const pb = h("div", "box promo");
        const done = state.promo?.day === state.day;
        pb.appendChild(h("h3", "", done ? `Quảng bá hôm nay: ${PROMOS[state.promo.kind].name}` : "Quảng bá địa phương (một lần mỗi ngày)"));
        const row = h("div", "promo-row");
        for (const [id, P] of Object.entries(PROMOS)) {
          const b = h("button", "btn small choice", ""); b.type = "button"; b.dataset.promo = id;
          b.appendChild(h("b", "", P.name)); b.appendChild(h("small", "", `${P.price ? k(P.price) : "Miễn phí"} · +${P.guests} khách${P.followers ? ` · +${P.followers} theo dõi` : ""}`));
          b.disabled = done || state.money < P.price;
          b.addEventListener("click", () => { dispatch({ type: "promo", kind: id }); prep(hooks.state()); });
          row.appendChild(b);
        }
        pb.appendChild(row);
        c.appendChild(pb);
      }
      // nâng cấp + trang trí
      const up = h("div", "box gear-box");
      const uph = h("div", "gear-head");
      uph.appendChild(h("h3", "", `Nâng cấp & trang trí · hấp dẫn ${appeal(state)}/${appealCap(state)} · ${stationCount(state)} chỗ pha`));
      const canArrange = Object.keys(state.owned).some((id) => EQUIPMENT[id]?.place);
      const ab = h("button", "btn small", "Xếp chỗ trang trí"); ab.type = "button"; ab.id = "arrangeBtn"; ab.disabled = !canArrange;
      if (!canArrange) ab.title = "Mua đồ trang trí trước";
      ab.addEventListener("click", () => hooks.arrange?.());
      uph.appendChild(ab);
      up.appendChild(uph);
      const gl = h("div", "gear");
      for (const id of EQUIPMENT_IDS) {
        const it = EQUIPMENT[id];
        const owned = !!state.owned[id], locked = it.unlock > state.level, needs = it.requires && !state.owned[it.requires];
        const row = h("div", "grow" + (owned ? " owned" : "") + (locked ? " locked" : ""));
        row.dataset.item = id;
        row.appendChild(icon(atlas, it.sprite, 54));
        const tx = h("div");
        tx.appendChild(h("b", "", it.name));
        tx.appendChild(h("small", "", it.effect + (needs ? ` (cần ${EQUIPMENT[it.requires].name} trước)` : "")));
        row.appendChild(tx);
        const b = h("button", "btn small" + (owned ? "" : " primary"), owned ? "Đã có" : locked ? `Cấp ${it.unlock}` : `Mua ${k(it.price)}`);
        b.type = "button"; b.dataset.buy = id;
        b.disabled = owned || locked || !!needs || state.money < it.price;
        if (!owned && !locked && state.money < it.price) b.title = "Chưa đủ tiền";
        b.addEventListener("click", () => { dispatch({ type: "buy", id }); prep(hooks.state()); });
        row.appendChild(b);
        gl.appendChild(row);
      }
      up.appendChild(gl);
      c.appendChild(up);
      const nextL = LEVELS[state.level];
      if (state.level < MAX_LEVEL && nextL) { const u = unlocksAt(nextL.level).filter((x) => x.kind !== "note").map((x) => x.name); c.appendChild(h("p", "muted small", `Cấp ${nextL.level} (${nextL.xp} XP) mở: ${u.length ? u.join(", ") : nextL.note}.`)); }
      const foot = h("footer", "sheet-foot");
      foot.appendChild(h("span", "muted", `Tiền mặt ${k(state.money)} · Phí ca 12k ghi lúc mở cửa`));
      const go = h("button", "btn primary big", "Mở quán"); go.id = "openShop"; go.type = "button"; go.dataset.autofocus = "";
      go.addEventListener("click", () => { close(); dispatch({ type: "startShift" }); });
      foot.appendChild(go);
      c.appendChild(foot);
    });
  }

  const portrait = (role, mood) => portraitOf(atlas, role, mood);

  function complaint(state) {
    const sh = state.shift, d = sh.dialog, c = customer(state, d.cid);
    open("complaint", (card) => {
      card.classList.add("drama");
      const stage = h("div", "drama-stage");
      const left = h("figure", "speaker cust"); left.appendChild(portrait(c.sprite, "annoyed")); left.appendChild(h("figcaption", "", c.name));
      const right = h("figure", "speaker me"); right.appendChild(icon(atlas, ["faces", "barista-surprised"], 150, "ico portrait")); right.appendChild(h("figcaption", "", "Bạn"));
      stage.appendChild(left); stage.appendChild(right);
      card.appendChild(stage);
      const ctx = { self: ARCHETYPES[c.arch].self, call: ARCHETYPES[c.arch].call, drink: RECIPE[c.recipe].name.toLocaleLowerCase("vi") };
      const say = h("div", "say");
      say.appendChild(h("h2", "", "Sai món rồi!"));
      say.appendChild(h("p", "line", "“" + (d.line || fill(COMPLAINT.line, ctx)) + "”"));
      say.appendChild(h("p", "line me", "“" + COMPLAINT.barista + "”"));
      say.appendChild(h("p", "muted small", "Ca đang tạm dừng. Chọn cách xử lý:"));
      card.appendChild(say);
      const ch = h("div", "choices");
      COMPLAINT.choices.forEach((o, i) => {
        const b = h("button", "btn choice" + (i === 0 ? " primary" : ""), ""); b.type = "button"; b.dataset.choice = o.id;
        b.appendChild(h("b", "", o.label)); b.appendChild(h("small", "", o.hint));
        if (i === 0) b.dataset.autofocus = "";
        b.addEventListener("click", () => { close(); dispatch({ type: "resolve", choice: o.id }); });
        ch.appendChild(b);
      });
      card.appendChild(ch);
    });
  }

  function summary(state) {
    const S = state.lastSummary;
    open("summary", (c) => {
      c.classList.add("summary");
      const hd = h("header", "sheet-head");
      hd.appendChild(icon(atlas, ["icons", "journal"], 40));
      const t = h("div"); t.appendChild(h("h2", "", `Chốt ca · Ngày ${S.day}`)); t.appendChild(h("p", "headline", S.headline)); hd.appendChild(t);
      c.appendChild(hd);
      const top = h("div", "sum-top");
      const big = (label, v, cls = "") => { const d = h("div", "big " + cls); d.appendChild(h("small", "", label)); d.appendChild(h("b", "", v)); return d; };
      top.appendChild(big("Lợi nhuận ca", (S.profit >= 0 ? "+" : "−") + k(Math.abs(S.profit)), S.profit >= 0 ? "pos" : "neg"));
      top.appendChild(big("Ly bán", `${S.cups}`));
      top.appendChild(big("Sao trung bình", S.avgStars ? S.avgStars.toLocaleString("vi-VN") : "—"));
      top.appendChild(big("Khách bỏ về", `${S.lost}`, S.lost ? "neg" : ""));
      c.appendChild(top);
      const tbl = h("dl", "ledger");
      const row = (a, b, cls = "") => { tbl.appendChild(h("dt", cls, a)); tbl.appendChild(h("dd", cls, b)); };
      row("Doanh thu", k(S.revenue));
      row("Giá vốn ly bán", "−" + k(S.cogs));
      row(S.pearlWaste ? `Hao hụt (ly bỏ, sửa bước, ${S.pearlWaste} phần trân châu dư)` : "Hao hụt (ly bỏ, sửa bước)", "−" + k(S.waste));
      row("Phí ca", "−" + k(S.fee));
      row("Lợi nhuận vận hành", (S.profit >= 0 ? "" : "−") + k(Math.abs(S.profit)), "total");
      if (S.restock) row("Nhập hàng giữa ca (dòng tiền)", "−" + k(S.restock));
      if (S.eventCash) row("Thu / chi do sự kiện, tiền thưởng (dòng tiền)", (S.eventCash > 0 ? "+" : "−") + k(Math.abs(S.eventCash)));
      if (S.consignPaid) row("Trả nợ ký gửi (dòng tiền)", "−" + k(S.consignPaid));
      c.appendChild(tbl);
      const meta = h("p", "sum-meta");
      meta.textContent = `Danh tiếng ${S.repDelta >= 0 ? "+" : ""}${S.repDelta} → ${S.rep} · +${S.xp} XP · Cấp ${S.level} · ${S.followers ?? 0} người theo dõi${S.followersDelta ? ` (+${S.followersDelta})` : ""}${S.rating ? ` · đánh giá ${S.rating.toLocaleString("vi-VN")} sao` : ""}${S.multi ? ` · ${S.multi} đơn nhiều ly` : ""} · Tiền mặt ${k(S.money)}`;
      c.appendChild(meta);
      if (S.levelUps.length) c.appendChild(h("p", "levelup", `Lên cấp ${S.levelUps.join(", ")}! Mở: ${S.levelUps.flatMap((l) => unlocksAt(l).filter((u) => u.kind !== "note").map((u) => u.name)).join(", ") || "quyền lợi mới"}.`));
      if (S.missions?.length) {
        const mb = h("div", "goals sum-goals");
        mb.appendChild(h("b", "", "Nhiệm vụ ngày"));
        for (const m of S.missions) mb.appendChild(h("span", "goal" + (m.done ? " done" : ""), `${m.done ? "✓ " : "· "}${m.text}${m.done ? ` (+${m.reward.xp} XP${m.reward.money ? `, +${m.reward.money}k` : ""})` : ""}`));
        c.appendChild(mb);
      }
      const dm = (S.moments || []).filter((m) => m.kind === "drama" || m.kind === "promise" || m.kind === "promise-miss");
      if (dm.length) {
        const db = h("div", "reviews moments");
        db.appendChild(h("h3", "", "Khoảnh khắc đáng nhớ"));
        for (const m of dm) { const it = h("div", "rv moment"); const tx = h("div"); tx.appendChild(h("b", "", m.name || "Tiệm")); tx.appendChild(h("p", "", "“" + m.line + "”")); it.appendChild(tx); db.appendChild(it); }
        c.appendChild(db);
      }
      const rv = h("div", "reviews");
      rv.appendChild(h("h3", "", "Review trong ca"));
      if (!S.reviews.length) rv.appendChild(h("p", "muted", "Chưa có review nào. Ca này yên tĩnh quá."));
      for (const r of S.reviews) {
        const it = h("div", "rv");
        const stars = h("span", "stars"); stars.setAttribute("aria-label", `${r.stars} sao`);
        for (let i = 0; i < 5; i++) stars.appendChild(icon(atlas, ["icons", "review-star"], 18, "ico" + (i < r.stars ? "" : " off")));
        it.appendChild(stars);
        const tx = h("div"); tx.appendChild(h("b", "", `${r.name} · ${r.reason === "mang" ? "trên mạng" : RECIPE[r.recipe]?.short || ""}`)); tx.appendChild(h("p", "", r.line)); it.appendChild(tx);
        rv.appendChild(it);
      }
      c.appendChild(rv);
      const foot = h("footer", "sheet-foot");
      const left = h("div", "foot-l");
      const jb = h("button", "btn", "Nhật Ký · Lưu ảnh"); jb.id = "journalBtn"; jb.type = "button";
      jb.addEventListener("click", () => hooks.journal?.(() => summary(hooks.state())));
      const rb = h("button", "btn", "Trả lời review"); rb.id = "replyBtn"; rb.type = "button";
      rb.addEventListener("click", () => hooks.notebook?.("reviews", () => summary(hooks.state())));
      left.appendChild(jb); left.appendChild(rb);
      foot.appendChild(left);
      const go = h("button", "btn primary big", `Chuẩn bị ngày ${state.day}`); go.id = "nextDay"; go.type = "button"; go.dataset.autofocus = "";
      go.addEventListener("click", () => { dispatch({ type: "closeSummary" }); hooks.afterSummary ? hooks.afterSummary() : prep(hooks.state()); });
      foot.appendChild(go);
      c.appendChild(foot);
    });
  }

  function pause(state, reason) {
    open("pause", (c) => {
      c.classList.add("pause");
      c.appendChild(h("h2", "", reason === "resume" ? "Ca đang dở dang" : "Tạm dừng"));
      c.appendChild(h("p", "muted", reason === "resume" ? `Ngày ${state.shift.day}: phiếu, ly đang pha và khách vẫn giữ nguyên chỗ cũ.` : "Đồng hồ ca đã dừng. Khách đứng yên chờ bạn."));
      const go = h("button", "btn primary big", "Tiếp tục ca"); go.id = "resumeBtn"; go.type = "button"; go.dataset.autofocus = "";
      go.addEventListener("click", () => { close(); hooks.resume(); });
      c.appendChild(go);
      restartBlock(c);
    });
  }

  /** Nút "Chơi lại từ đầu" + bước xác nhận ngay trong bảng (không mất dữ liệu: bản cũ được cất dự phòng). */
  function restartBlock(c) {
    const box = h("div", "restart");
    const ask = h("button", "btn ghost small", "Chơi lại từ đầu"); ask.type = "button"; ask.id = "restartAsk";
    ask.addEventListener("click", () => {
      box.textContent = "";
      box.appendChild(h("p", "small", "Mở lại tiệm từ Ngày 1 với tiền, cấp và kho ban đầu? Tiến trình hiện tại được cất một bản dự phòng trên máy này."));
      const row = h("div", "row");
      const yes = h("button", "btn danger small", "Chơi lại"); yes.type = "button"; yes.id = "restartYes";
      yes.addEventListener("click", () => { if (!hooks.restart?.()) { box.appendChild(h("p", "small", "Trình duyệt không cho lưu, chưa chơi lại được.")); } });
      const no = h("button", "btn small", "Thôi"); no.type = "button"; no.id = "restartNo";
      no.addEventListener("click", () => { box.textContent = ""; box.appendChild(ask); ask.focus(); });
      row.appendChild(yes); row.appendChild(no); box.appendChild(row); no.focus();
    });
    box.appendChild(ask);
    c.appendChild(box);
  }

  function help() {
    open("help", (c) => {
      c.appendChild(h("h2", "", "Cách chơi"));
      const ol = h("ol", "help");
      for (const s of [
        "Khách vào từ cửa phải, nói món và đứng chờ. Thanh màu dưới tên là độ kiên nhẫn.",
        "Chạm vào khách hoặc phiếu để ghim đơn lên Quầy pha.",
        "Pha đúng thứ tự: Ly → Trà → Thêm sữa/vị → Đường → Đá → Topping → Đóng nắp. Ly đổi hình ở từng bước.",
        "Sai bước gần nhất? Bấm Hoàn tác (nguyên liệu đã đổ vẫn tính hao hụt). Đổ bỏ ly nếu sai từ đầu.",
        "Đóng nắp xong bấm Giao. Đúng công thức, nhanh và hợp ý khách thì được nhiều sao, tiền và XP.",
        "Sai món nền: khách khiếu nại, bạn chọn làm lại, giảm giá hoặc không lấy tiền.",
        "Đơn nhiều ly: pha từng ly rồi bấm Ghép ly vào đơn; đủ ly thì giao chung một lượt. Có bàn pha đôi / ba thì ly cùng yêu cầu được rót cùng lúc.",
        "Drama: khách, mạng xã hội, mẹ gọi… Ca tạm dừng khi hội thoại mở. Mỗi lựa chọn có hậu quả, có chuyện quay lại ngày sau.",
        "Sổ: xem và trả lời review, nhật ký từng ngày, sự kiện, nhiệm vụ ngày. Hết vốn thì nhận gói ký gửi ở bảng Chuẩn bị ca.",
        "Phím tắt: 1–7 chọn nguyên liệu, Enter giao, Backspace hoàn tác, P tạm dừng, M tắt tiếng.",
      ]) ol.appendChild(h("li", "", s));
      c.appendChild(ol);
      const ok = h("button", "btn primary", "Đã hiểu"); ok.type = "button"; ok.id = "helpOk"; ok.dataset.autofocus = "";
      ok.addEventListener("click", close);
      c.appendChild(ok);
      restartBlock(c);
    });
  }

  return { intro, prep, complaint, summary, pause, help, close, open, get current() { return current; } };
}

export function toast(root, text, kind = "") {
  const t = h("div", "toast " + kind, text);
  t.setAttribute("role", "status");
  root.appendChild(t);
  setTimeout(() => t.classList.add("out"), 2600);
  setTimeout(() => t.remove(), 3200);
}
export { mmss, k as fmtK };
