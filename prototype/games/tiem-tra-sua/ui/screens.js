// HUD, dải phiếu khách, và các bảng phủ (chào mừng, chuẩn bị ca, hội thoại khiếu nại, chốt ca, tạm dừng, cách chơi).
import { icon } from "../render/atlas.js";
import { ingIcon, headIcon } from "./brew.js";
import { RECIPE, RECIPES } from "../data/recipes.js";
import { STOCK, STOCK_IDS, choiceName } from "../data/ingredients.js";
import { ARCHETYPES } from "../data/customers.js";
import { COMPLAINT } from "../data/lines.js";
import { LEVELS, MAX_LEVEL } from "../data/levels.js";
import { patienceLeft, customer } from "../core/shift.js";
import { capacity, stockUsed, packPrice, recipeCost } from "../core/economy.js";
import { xpProgress, unlocksAt } from "../core/progression.js";
import { fill } from "../core/text.js";
import { EQUIPMENT, EQUIPMENT_IDS, APPEAL_CAP } from "../data/equipment.js";
import { appeal } from "../core/equipment.js";

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
    const xp = xpProgress(state);
    items.hLevel.b.textContent = `Cấp ${state.level}`; items.hLevel.sm.textContent = xp.need ? `${xp.into}/${xp.need} XP` : "Tối đa";
    xpBar.firstChild.style.width = (xp.need ? Math.min(100, (xp.into / xp.need) * 100) : 100) + "%";
    items.hStock.b.textContent = `${stockUsed(state)}/${capacity(state)}`; items.hStock.sm.textContent = "Kho";
  };
}

// ---------- phiếu khách ----------
export function createRail(root, atlas, onPin) {
  const cards = new Map();
  const empty = h("p", "rail-empty", "");
  root.appendChild(empty);
  root.addEventListener("click", (e) => { const b = e.target.closest("button[data-cid]"); if (b && !b.disabled) onPin(Number(b.dataset.cid)); });
  return function render(state) {
    const sh = state.shift;
    const list = (sh?.customers || []).filter((c) => c.phase === "wait" || c.phase === "enter");
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
        tx.appendChild(h("span", "", RECIPE[c.recipe].short));
        top.appendChild(tx);
        b.appendChild(top);
        b.appendChild(h("small", "slip-spec", `${c.order.sugar}% đường · ${choiceName("ice", c.order.ice)}`));
        const bar = h("div", "pbar"); bar.appendChild(h("i")); b.appendChild(bar);
        const st = h("em", "slip-state"); b.appendChild(st);
        root.appendChild(b);
        n = { b, bar, st };
        cards.set(c.id, n);
      }
      const p = patienceLeft(state, c);
      n.bar.firstChild.style.width = p * 100 + "%";
      n.bar.className = "pbar" + (p <= 0.35 ? " low" : p <= 0.6 ? " mid" : "");
      n.b.disabled = c.phase !== "wait";
      n.b.classList.toggle("on", sh.active === c.id);
      n.st.textContent = c.phase === "enter" ? "Đang vào…" : sh.active === c.id ? "Đang pha" : p <= 0.35 ? "Sắp bỏ về!" : "Chạm để ghim";
    }
    for (const [id, n] of cards) if (!live.has(id)) { n.b.remove(); cards.delete(id); }
  };
}

// ---------- bảng phủ ----------
export function createOverlays(root, atlas, dispatch, hooks) {
  let current = null;
  const close = () => { root.textContent = ""; root.hidden = true; current = null; hooks.onClose?.(); };
  function open(kind, build, { modal = true, cls = "" } = {}) {
    root.textContent = "";
    root.hidden = false;
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

  function prep(state) {
    open("prep", (c) => {
      c.classList.add("prep");
      const hd = h("header", "sheet-head");
      hd.appendChild(icon(atlas, ["icons", "journal"], 36));
      const t = h("div"); t.appendChild(h("h2", "", `Chuẩn bị ca · Ngày ${state.day}`));
      t.appendChild(h("p", "muted", state.tutorialDone ? "Khách hôm nay 6–10 người, có hai đợt cao điểm. Xem kho trước khi mở cửa." : "Ngày học: 5 khách, mỗi phiếu có gợi ý bước kế tiếp."));
      hd.appendChild(t); c.appendChild(hd);
      const grid = h("div", "prep-grid");
      // menu
      const menu = h("div", "box");
      menu.appendChild(h("h3", "", "Menu đang bán"));
      const ul = h("ul", "menu");
      for (const r of RECIPES) {
        const li = h("li", r.unlock > state.level ? "locked" : "");
        li.appendChild(ingIcon(atlas, drinkIcon(r), 40));
        const tx = h("div");
        tx.appendChild(h("b", "", r.name));
        tx.appendChild(h("small", "", r.unlock > state.level ? `Mở ở cấp ${r.unlock}` : `Bán ${k(r.price)} · vốn ${k(recipeCost(r.id))} · lãi ${k(r.price - recipeCost(r.id))}`));
        li.appendChild(tx);
        ul.appendChild(li);
      }
      menu.appendChild(ul);
      grid.appendChild(menu);
      // kho
      const st = h("div", "box");
      const used = stockUsed(state), cap = capacity(state);
      st.appendChild(h("h3", "", `Kho nguyên liệu · ${used}/${cap} phần`));
      const sg = h("div", "stock");
      for (const id of STOCK_IDS) {
        const it = STOCK[id];
        if (it.unlock > state.level) continue;
        const row = h("div", "srow" + ((state.stock[id] || 0) <= 2 ? " low" : ""));
        row.appendChild(ingIcon(atlas, it.icon, 34));
        const tx = h("div"); tx.appendChild(h("b", "", it.name)); tx.appendChild(h("small", "", `còn ${state.stock[id] || 0} phần`)); row.appendChild(tx);
        const price = packPrice(id);
        const b = h("button", "btn small", `+${it.pack} · ${k(price)}`); b.type = "button"; b.dataset.restock = id;
        b.disabled = state.money < price || cap - used < it.pack;
        b.title = b.disabled ? (state.money < price ? "Không đủ tiền" : "Kho đầy") : `Nhập ${it.pack} phần ${it.name}`;
        b.addEventListener("click", () => { dispatch({ type: "restock", id }); prep(hooks.state()); });
        row.appendChild(b);
        sg.appendChild(row);
      }
      st.appendChild(sg);
      grid.appendChild(st);
      c.appendChild(grid);
      // nâng cấp + trang trí
      const up = h("div", "box gear-box");
      up.appendChild(h("h3", "", `Nâng cấp & trang trí · hấp dẫn ${appeal(state)}/${APPEAL_CAP}`));
      const gl = h("div", "gear");
      for (const id of EQUIPMENT_IDS) {
        const it = EQUIPMENT[id];
        const owned = !!state.owned[id], locked = it.unlock > state.level;
        const row = h("div", "grow" + (owned ? " owned" : "") + (locked ? " locked" : ""));
        row.dataset.item = id;
        row.appendChild(icon(atlas, it.sprite, 54));
        const tx = h("div");
        tx.appendChild(h("b", "", it.name));
        tx.appendChild(h("small", "", it.effect));
        row.appendChild(tx);
        const b = h("button", "btn small" + (owned ? "" : " primary"), owned ? "Đã có" : locked ? `Cấp ${it.unlock}` : `Mua ${k(it.price)}`);
        b.type = "button"; b.dataset.buy = id;
        b.disabled = owned || locked || state.money < it.price;
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

  function portrait(role, mood) {
    if (role === "regular") return icon(atlas, ["faces", `regular-${mood === "happy" ? "happy" : mood === "sheepish" ? "sheepish" : "annoyed"}`], 150, "ico portrait");
    if (atlas.has("portraits", role)) return icon(atlas, ["portraits", role], 150, "ico portrait");
    return icon(atlas, ["reactions", `${role}-impatient`], 150, "ico portrait body"); // office-worker chưa có chân dung (Cần Codex)
  }

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
      say.appendChild(h("p", "line", "“" + fill(COMPLAINT.line, ctx) + "”"));
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
      c.appendChild(tbl);
      const meta = h("p", "sum-meta");
      meta.textContent = `Danh tiếng ${S.repDelta >= 0 ? "+" : ""}${S.repDelta} → ${S.rep} · +${S.xp} XP · Cấp ${S.level} · Tiền mặt ${k(S.money)}`;
      c.appendChild(meta);
      if (S.levelUps.length) c.appendChild(h("p", "levelup", `Lên cấp ${S.levelUps.join(", ")}! Mở: ${S.levelUps.flatMap((l) => unlocksAt(l).filter((u) => u.kind !== "note").map((u) => u.name)).join(", ") || "quyền lợi mới"}.`));
      const rv = h("div", "reviews");
      rv.appendChild(h("h3", "", "Review trong ca"));
      if (!S.reviews.length) rv.appendChild(h("p", "muted", "Chưa có review nào. Ca này yên tĩnh quá."));
      for (const r of S.reviews) {
        const it = h("div", "rv");
        const stars = h("span", "stars"); stars.setAttribute("aria-label", `${r.stars} sao`);
        for (let i = 0; i < 5; i++) stars.appendChild(icon(atlas, ["icons", "review-star"], 18, "ico" + (i < r.stars ? "" : " off")));
        it.appendChild(stars);
        const tx = h("div"); tx.appendChild(h("b", "", `${r.name} · ${RECIPE[r.recipe]?.short || ""}`)); tx.appendChild(h("p", "", r.line)); it.appendChild(tx);
        rv.appendChild(it);
      }
      c.appendChild(rv);
      const foot = h("footer", "sheet-foot");
      foot.appendChild(h("span", "muted small", "Nhật Ký Làm Chủ (ảnh chia sẻ) sẽ có ở bản sau."));
      const go = h("button", "btn primary big", `Chuẩn bị ngày ${state.day}`); go.id = "nextDay"; go.type = "button"; go.dataset.autofocus = "";
      go.addEventListener("click", () => { dispatch({ type: "closeSummary" }); prep(hooks.state()); });
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
    });
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
        "Phím tắt: 1–7 chọn nguyên liệu, Enter giao, Backspace hoàn tác, P tạm dừng, M tắt tiếng.",
      ]) ol.appendChild(h("li", "", s));
      c.appendChild(ol);
      const ok = h("button", "btn primary", "Đã hiểu"); ok.type = "button"; ok.id = "helpOk"; ok.dataset.autofocus = "";
      ok.addEventListener("click", close);
      c.appendChild(ok);
    });
  }

  return { intro, prep, complaint, summary, pause, help, close, get current() { return current; } };
}

export function toast(root, text, kind = "") {
  const t = h("div", "toast " + kind, text);
  t.setAttribute("role", "status");
  root.appendChild(t);
  setTimeout(() => t.classList.add("out"), 2600);
  setTimeout(() => t.remove(), 3200);
}
export { mmss, k as fmtK };
