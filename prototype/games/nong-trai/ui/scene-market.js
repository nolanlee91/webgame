// Cảnh Khu chợ (DESIGN-2.0 §1 khu 3): phố chợ — gian quầy market-stall.webp lặp theo repeatStepX, Cô Hai đứng sau quầy
// (npc-market.webp, keeperLayer.drawRect) với bong bóng thoại xoay vòng, kệ "Bán" (hàng trong kho, giá hôm nay + ↑↓·),
// bảng giá + "đổi giá sau h:mm:ss", kệ "Mua" (market.catalogue: hạt giống trả lúc gieo, thức ăn, vật liệu, trang trí).
// Mọi giao dịch qua ctx.exec ⇒ apply() (marketSell / marketBuy).
import { loadSprites, draw, sheet, image, frame, playFx } from "./sprites.js?v=m18";

const BUY_KIND = { seed: "Hạt giống", feed: "Thức ăn", material: "Vật liệu", decor: "Trang trí" };
const TREND = { "↑": ["up", "giá đang lên"], "↓": ["down", "giá đang xuống"], "·": ["flat", "giá đứng"] };

export function createMarketScene(ctx) {
  const { L, esc, fmtNum, iconHtml, until, setHtml } = ctx;
  const root = document.getElementById("marketScene");
  const cv = document.getElementById("mkStall"), bubble = document.getElementById("mkBubble");
  const sellEl = document.getElementById("mkSell"), boardEl = document.getElementById("mkBoard"), buyEl = document.getElementById("mkBuy");
  const changeEl = document.getElementById("mkChange");
  let lineK = 0, lineT = 0, raf = 0, last = 0, paintedKey = "";

  const trendHtml = (id, now) => { const t = L.MARKET.trend(id, now), [cls, label] = TREND[t]; return `<span class="trend trend--${cls}" title="${label}" aria-label="${label}">${t}</span>`; };
  /** Món hiện trên bảng giá: nông sản đã mở, thành phẩm của máy đã có, và mọi món đang có trong kho. */
  function boardIds(s) {
    const ids = new Set(L.CROPS.filter((c) => L.cropUnlocked(s, c.id)).map((c) => c.id));
    for (const r of L.RECIPES) if (s.production.machines[r.machine] && s.level >= r.level) ids.add(r.output);
    for (const id of [...Object.keys(s.inv), ...Object.keys(s.overflow)]) if (L.sellable(id)) ids.add(id);
    return [...ids].filter((id) => L.sellable(id));
  }

  // ---------- gian chợ (canvas) ----------
  function paint(t) {
    const st = sheet("market-stall");
    if (!st || !image("market-stall")) return;
    const s = ctx.s, step = st.repeatStepX, n = 3, W = st.frameWidth + step * (n - 1), H = st.frameHeight;
    const goods = Object.keys({ ...s.inv, ...s.overflow }).filter((id) => L.sellable(id) && L.iconCell(id)?.sheet === "items").slice(0, 9);
    const bob = Math.floor(t / 750) % 2;
    const key = goods.join() + bob;
    if (key === paintedKey) return;
    paintedKey = key;
    if (cv.width !== W) { cv.width = W; cv.height = H; }
    const g = cv.getContext("2d");
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, W, H);
    const [kx, ky, kw, kh] = st.keeperLayer.drawRect, mid = 1;
    const keeper = frame("npc-market", "co-hai-sau-quay");
    for (let i = 0; i < n; i++) {
      const left = i * step;
      if (i === mid && keeper) g.drawImage(image("npc-market"), keeper.x, keeper.y, keeper.width, keeper.height, left + kx, ky + bob * 2, kw, kh); // Cô Hai vẽ TRƯỚC gian quầy
      draw(g, "market-stall", "quay-cho-hoan-chinh", left + st.frameWidth / 2, 338, 1);
    }
    // hàng bày trên mặt quầy (đúng món đang có trong kho)
    const y = st.openingY[1] + 6, x0 = 70, gap = (W - 140) / Math.max(1, goods.length);
    goods.forEach((id, k) => draw(g, "items", id, x0 + gap * (k + 0.5), y + 22, 0.75));
  }
  function loop(t) {
    raf = 0;
    if (root.hidden || document.hidden) return;
    if (t - last > 200) { last = t; paint(t); }
    raf = requestAnimationFrame(loop);
  }

  function speak(force) {
    const now = Date.now();
    if (!force && now - lineT < 6000) return;
    lineT = now;
    const s = ctx.s, t = ctx.now();
    const fair = L.activeFair(s, t);
    if (fair) { // Milestone 6: câu riêng trong Phiên chợ
      const hot = fair.hot.map((id) => L.ITEM[id].name.toLowerCase()).join(", ");
      bubble.textContent = "Cô Hai: “" + L.FAIR_LINES[lineK++ % L.FAIR_LINES.length].replace("{hot}", hot) + "”";
      return;
    }
    const up = boardIds(s).filter((id) => L.MARKET.trend(id, t) === "↑").sort((a, b) => L.ITEM[b].sell - L.ITEM[a].sell)[0];
    let lines = L.MARKET_LINES.filter((l) => up || !l.includes("{up}"));
    const line = lines[lineK++ % lines.length].replace("{up}", up ? L.ITEM[up].name.toLowerCase() : "");
    bubble.textContent = "Cô Hai: “" + line + "”";
  }

  // ---------- Milestone 6: Phiên chợ ----------
  const fairEl = document.getElementById("mkFair");
  /** Số hàng săn còn bán giá ×1,5 trong phiên đang mở; null ⇒ món không phải hàng săn / không có phiên. */
  function hotLeft(s, id, now) { const f = L.activeFair(s, now); return f && f.hot.includes(id) ? f.left[id] : null; }
  const clock = (t) => new Date(t).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  function renderFair(s, now) {
    if (s.level < L.FAIR_LEVEL - 3) { fairEl.hidden = true; return; }
    fairEl.hidden = false;
    const f = L.activeFair(s, now), hotIcons = (ids, left) => ids.map((id) => `<span class="hot">${iconHtml(id, "it--xs")}${esc(L.ITEM[id].name)}${left ? ` ${left[id]}/${L.FAIR_HOT_CAP}` : ""}</span>`).join("");
    fairEl.classList.toggle("on", !!f);
    let html;
    if (s.level < L.FAIR_LEVEL) html = `<b>Phiên chợ</b> mở ở cấp ${L.FAIR_LEVEL}: mỗi ngày 30 phút, thành phẩm +25 %, Cô Hai săn 3 món giá rưỡi.`;
    else if (f) html = `<b>Phiên chợ đang diễn ra</b> — còn ${until(f.endAt)} · thành phẩm giá chốt +25 % · hàng săn giá rưỡi (10 món đầu): ${hotIcons(f.hot, f.left)}`;
    else { const n = L.nextFair(now), day = Math.floor((n.startAt + 7 * 3600_000) / 86400_000) === Math.floor((now + 7 * 3600_000) / 86400_000) ? "hôm nay" : "ngày mai";
      html = `<b>Phiên chợ kế tiếp</b>: ${day} lúc ${clock(n.startAt)} (30 phút) · hàng săn: ${hotIcons(n.hot)}`; }
    setHtml(fairEl, html);
  }

  // ---------- HTML ----------
  function sellHtml(s, now) {
    const ids = [...new Set([...Object.keys(s.inv), ...Object.keys(s.overflow)])].filter((id) => L.sellable(id) && L.have(s, id) > 0);
    const order = (id) => L.CATEGORIES.findIndex((c) => c.id === L.ITEM[id].cat);
    ids.sort((a, b) => order(a) - order(b) || L.ITEM[b].sell - L.ITEM[a].sell);
    if (!ids.length) return `<li class="mk-empty">Chưa có hàng để bán. Thu hoạch hoặc lấy thành phẩm ở Xưởng rồi quay lại nhé.</li>`;
    const need = L.demand(s);
    return ids.map((id) => {
      const it = L.ITEM[id], q = L.have(s, id), p = L.salePrice(s, id, now), hot = hotLeft(s, id, now);
      return `<li class="mk-row">${iconHtml(id)}<div class="mk-info"><b>${esc(it.name)} <span class="qty">×${fmtNum(q)}</span></b>` +
        `<small>${iconHtml("dong-xu", "it--xs")}<b class="mk-price">${fmtNum(p)}</b> xu ${trendHtml(id, now)} <span class="mk-base">gốc ${it.sell}</span>${hot !== null ? ` · <span class="mk-hot">hàng săn: còn ${hot}</span>` : ""}${need[id] ? ` · <span class="want">đơn cần ${need[id]}</span>` : ""}</small></div>` +
        `<div class="mk-btns"><button class="btn btn--sm" type="button" data-act="sell" data-id="${id}" data-n="1" data-key="ms1-${id}" aria-label="Bán 1 ${esc(it.name)}">Bán 1</button>` +
        `<button class="btn btn--sm btn--primary" type="button" data-act="sell" data-id="${id}" data-n="${q}" data-key="msn-${id}" aria-label="Bán hết ${esc(it.name)}">Bán hết · ${fmtNum(L.fairQuote(s, id, q, now)?.coins ?? p * q)}</button></div></li>`;
    }).join("");
  }
  function boardHtml(s, now) {
    return boardIds(s).map((id) => {
      const p = L.salePrice(s, id, now), it = L.ITEM[id], hot = hotLeft(s, id, now);
      return `<li data-id="${id}"${hot !== null ? ' class="hot"' : ""}>${iconHtml(id, "it--sm")}<span>${esc(it.name)}${hot !== null ? " ★" : ""}</span><b>${fmtNum(p)}</b>${trendHtml(id, now)}</li>`;
    }).join("");
  }
  function buyHtml(s) {
    const lv = s.level;
    return L.MARKET.catalogue().map((x) => {
      const locked = lv < x.level, crop = x.kind === "seed" ? L.CROP[x.crop] : null;
      if (crop?.requires) return ""; // mía: cần Nhà kính (Milestone 3)
      if (locked && x.level > lv + 5) return ""; // món còn xa: không làm dài kệ
      const icon = x.kind === "seed" ? `<span class="seedpack">${iconHtml("hat-giong")}${iconHtml(x.crop, "it--sm seedpack-crop")}</span>` : iconHtml(x.id);
      const owned = x.kind === "seed" ? 0 : L.have(s, x.id);
      let btn;
      if (locked) btn = `<span class="mk-lock">${iconHtml("o-khoa", "it--xs")}Cấp ${x.level}</span>`;
      else if (x.kind === "seed") btn = `<button class="btn btn--sm btn--teal" type="button" data-act="plant" data-crop="${x.crop}" data-key="mp-${x.id}">Gieo</button>`;
      else btn = `<button class="btn btn--sm btn--teal" type="button" data-act="buy" data-id="${x.id}" data-key="mb-${x.id}"${s.coins >= x.buy ? "" : " disabled"} aria-label="Mua 1 ${esc(x.name)}">Mua · ${fmtNum(x.buy)}</button>`;
      const note = x.kind === "seed" ? `${x.buy} xu / hạt · trả khi gieo` :
        x.kind === "decor" ? `Không tính sức chứa${owned ? ` · đang có ${owned}` : ""}` :
        x.kind === "material" ? `Dùng nâng kho, công trình${owned ? ` · đang có ${owned}` : ""}` : `Dự phòng cho vật nuôi${owned ? ` · đang có ${owned}` : ""}`;
      return `<li class="mk-row${locked ? " locked" : ""}" data-kind="${x.kind}">${icon}<div class="mk-info"><b>${esc(x.name)}</b><small>${BUY_KIND[x.kind]} · ${note}</small></div><div class="mk-btns">${btn}</div></li>`;
    }).join("");
  }

  function render() {
    if (root.hidden) return;
    const s = ctx.s, now = ctx.now();
    setHtml(sellEl, sellHtml(s, now));
    setHtml(boardEl, boardHtml(s, now));
    setHtml(buyEl, buyHtml(s));
    setHtml(changeEl, `đổi giá sau ${until(L.nextChangeAt(now))}`);
    renderFair(s, now);
    speak(false);
    if (!raf) raf = requestAnimationFrame(loop);
  }

  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]");
    if (!b || b.disabled) return;
    if (b.dataset.act === "sell") ctx.exec({ type: "marketSell", id: b.dataset.id, n: Number(b.dataset.n) }, { el: b, market: true });
    else if (b.dataset.act === "buy") ctx.exec({ type: "marketBuy", id: b.dataset.id, n: 1 }, { el: b, market: true });
    else if (b.dataset.act === "plant") ctx.plantSeed(b.dataset.crop);
  });
  cv.addEventListener("click", () => { speak(true); ctx.sfx("buoc-nhay", 0.3, 1.3); });

  function fxAt(el, kinds, text, color) {
    const r = el?.getBoundingClientRect?.(), h = root.getBoundingClientRect();
    if (!r) return;
    const x = r.left - h.left + r.width / 2, y = r.top - h.top + r.height / 2;
    for (const k of kinds) playFx(root, k, x, y, 64);
    if (text) ctx.floatAt(root, x, y - 18, text, color);
  }

  loadSprites().then(() => { paintedKey = ""; render(); });
  return {
    root, render, fxAt, hotLeft,
    show() { root.hidden = false; paintedKey = ""; speak(true); render(); },
    hide() { root.hidden = true; },
  };
}
