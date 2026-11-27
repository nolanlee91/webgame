// Cảnh Khu chăn nuôi (DESIGN-2.0 §1 khu 5, §2.4 — Milestone 4). Sân cỏ có hàng rào (garden grass + fence), chuồng gà / chuồng bò
// (buildings / buildings-2 theo level), mỗi con vẽ từ animals.webp: đứng / ăn / đi (animation tại chỗ, lắc qua lại vài pixel,
// không AI). Bong bóng trứng / sữa trên con đã chín, bong bóng đói trên con chưa ăn. Chạm con vật: cho ăn hoặc thu.
// Mọi thay đổi trạng thái đi qua ctx.exec(action) ⇒ apply(). File này chỉ đọc luật (core/animals.js) để hiển thị.
//
// ctx = {
//   s (getter: trạng thái có s.animals, s.inv, s.overflow, s.coins, s.level, s.buildings), now(), exec(action, origin),
//   host?: Element (mặc định <main> hoặc <body>) — cảnh tự tạo <section class="an-scene"> trong đó,
//   rulesCtx?(): { level, buildings, capacity?(kind) } cho core/animals.js (mặc định { level: s.level, buildings: s.buildings }),
//   toast?(msg, ms), sfx?(name, vol, rate), onBack?() (có ⇒ hiện nút "← Nông trại"),
// }
// Trả { root, open, close, show, hide, render, onEvents(events, origin), animalEl(uid) }.
// game.js gọi onEvents(r.events, origin) sau mỗi apply() thành công để cảnh phát hiệu ứng (fx am-vat-nuoi / lap-lanh, chữ nổi).
import * as A from "../core/animals.js?v=m18";
import { ANIMALS, ANIMAL, FEED } from "../data/animals.js?v=m18";
import { ITEM } from "../data/catalog.js?v=m18";
import {
  loadArt, artReady, draw, frame, fx, floatText, centerIn, injectStyle, esc, fmtNum, fmtLeft, iconHtml, makeToast, makeSfx, frameCss, frameEdgeCss,
} from "./m4-art.js?v=m18";

const W = 360; // khung vẽ logic của mỗi sân (CSS co giãn, pixel vuông)
/** Vị trí (chân) từng con trong sân, theo thứ tự mua. Chuồng ở góc trên trái. */
const SLOTS = {
  ga: { h: 236, house: [78, 132, 0.5], spots: [[206, 92], [264, 96], [322, 90], [186, 146], [244, 150], [302, 144], [44, 204], [104, 210], [164, 204], [224, 210], [284, 204], [336, 210]] },
  "bo-sua": { h: 256, house: [80, 136, 0.52], spots: [[222, 112], [310, 118], [200, 196], [292, 200], [60, 232], [140, 236]] },
};
const BUY_ERR = { locked: (d) => `Mở ở cấp ${d.level}`, "no-housing": (d) => `Cần xây ${d.housingName}`, capacity: () => "Chuồng đã đầy", coins: (d) => `Cần ${fmtNum(d.buy)} xu` };
const ERR_TEXT = { feed: "Hết thức ăn gia súc — Cối xay: 2 ngô → 3 bao, hoặc mua ở Khu chợ.", full: "Kho và giỏ tràn đều đầy — bán bớt rồi thu tiếp." };

const CSS = `
.an-scene { --an-ink: #f4ead2; --an-soft: #b9ad93; --an-gold: #ffc94a; --an-line: #0a0807;
  --an-border: 0 -3px 0 0 var(--an-line), 0 3px 0 0 var(--an-line), -3px 0 0 0 var(--an-line), 3px 0 0 0 var(--an-line);
  position: relative; width: 100%; max-width: 1180px; margin: 0 auto; padding: 12px 16px 20px; color: var(--an-ink);
  font: 500 15px/1.45 "Be Vietnam Pro", system-ui, sans-serif; box-sizing: border-box; }
.an-scene *, .an-scene *::before { box-sizing: border-box; }
.an-head { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 14px; margin: 0 0 10px; }
.an-head h2 { margin: 0; font: 800 20px/1.2 "Be Vietnam Pro", system-ui; letter-spacing: .04em; text-transform: uppercase; text-shadow: 2px 2px 0 #000; }
.an-feed { margin-left: auto; display: flex; align-items: center; gap: 8px; padding: 6px 10px; background: #262019; box-shadow: var(--an-border); font-weight: 700; }
.an-feed small { display: block; font-weight: 600; font-size: 12px; color: var(--an-soft); }
.an-feed.is-low b { color: #ffb08a; }
.an-actions { display: flex; flex-wrap: wrap; gap: 10px; margin: 0 0 12px; }
.an-btn { min-height: 44px; min-width: 44px; padding: 6px 14px; font: 800 14px/1.2 "Be Vietnam Pro", system-ui; color: #2a1606; cursor: pointer;
  background: #f2c86a; border: 0; box-shadow: var(--an-border), inset 0 2px 0 rgba(255,255,255,.35), inset 0 -3px 0 rgba(0,0,0,.25); }
.m4-art-ready .an-btn { box-shadow: none; }
${frameCss(".m4-art-ready .an-btn", "nut-thuong", "10 14 10 14", 10)}
.m4-art-ready .an-btn { background: none; }
.an-btn--go { background: #8fd27b; }
${frameCss(".m4-art-ready .an-btn--go", "nut-nhan", "10 14 10 14", 10)}
.m4-art-ready .an-btn--go:not(:disabled) { color: #fff3cf; text-shadow: 1px 1px 0 #000, -1px 0 0 #000; }
.an-btn:disabled { cursor: not-allowed; color: #2e2822; text-shadow: 0 1px 0 rgba(255,255,255,.35); }
${frameCss(".m4-art-ready .an-btn:disabled", "nut-khoa", "10 14 10 14", 10)}
.an-btn:focus-visible, .an-tap:focus-visible, .an-back:focus-visible { outline: 3px dashed var(--an-gold); outline-offset: 2px; }
.an-back { min-height: 44px; padding: 6px 12px; font: 700 14px "Be Vietnam Pro", system-ui; color: var(--an-ink); background: #262019; border: 0; box-shadow: var(--an-border); cursor: pointer; }
.an-pens { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr)); gap: 16px; }
.an-pen { min-width: 0; background: #1d1a16; box-shadow: var(--an-border), 4px 7px 0 0 rgba(0,0,0,.5); padding: 10px; }
${frameEdgeCss(".m4-art-ready .an-pen", "bang-go", "16 14 16 14", 14, "#4a2a1a")}
.m4-art-ready .an-pen { box-shadow: 4px 7px 0 0 rgba(0,0,0,.45); padding: 4px; }
.an-pen-head { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px; margin: 0 0 8px; }
.an-pen-head b { font: 800 16px/1.2 "Be Vietnam Pro", system-ui; text-shadow: 2px 2px 0 #000; }
.an-count { font-weight: 700; color: var(--an-gold); }
.an-buy-wrap { margin-left: auto; display: grid; justify-items: end; gap: 2px; }
.an-lock { font-size: 12px; font-weight: 700; color: #ffb08a; }
.an-yard { position: relative; width: 100%; overflow: hidden; background: #3d7230 var(--m4-grass, none) 0 0 / 64px 64px repeat; image-rendering: pixelated;
  box-shadow: inset 0 0 0 3px var(--an-line); }
.an-yard::before, .an-yard::after { content: ""; position: absolute; left: 0; right: 0; height: 26px; pointer-events: none; z-index: 2;
  background: var(--m4-fence, linear-gradient(#8a5a2b, #5a3a1b)) 0 0 / auto 26px repeat-x; image-rendering: pixelated; }
.an-yard::before { top: -4px; } .an-yard::after { bottom: -6px; }
.an-yard canvas { display: block; width: 100%; height: auto; image-rendering: pixelated; position: relative; z-index: 1; }
.an-taps { position: absolute; inset: 0; z-index: 3; }
.an-tap { position: absolute; min-width: 44px; min-height: 44px; padding: 0; border: 0; background: transparent; cursor: pointer; }
.an-tap[data-state="ready"] { cursor: grab; }
.an-tap .an-tip-t { position: absolute; left: 50%; bottom: -4px; transform: translateX(-50%); white-space: nowrap; font: 800 11px/1 "Be Vietnam Pro", system-ui;
  color: #fff; text-shadow: 1px 1px 0 #000, -1px -1px 0 #000; padding: 2px 4px; background: rgba(0,0,0,.45); }
.an-empty { position: absolute; left: 50%; bottom: 30px; transform: translateX(-50%); z-index: 4; width: min(92%, 300px); padding: 10px 12px; text-align: left;
  background: rgba(29,26,22,.92); box-shadow: var(--an-border); font-size: 13px; line-height: 1.45; }
.an-empty b { display: block; font-size: 14px; color: var(--an-gold); margin-bottom: 4px; }
.an-empty ol { margin: 0; padding-left: 18px; }
.an-note { margin: 12px 0 0; font-size: 13px; color: var(--an-soft); }
.an-toast-inline { min-height: 1.4em; }
@media (max-width: 480px) { .an-scene { padding: 10px 12px 16px; } .an-feed { margin-left: 0; width: 100%; } .an-actions .an-btn { flex: 1 1 140px; } }
`;

export function createAnimalsScene(ctx) {
  injectStyle("an-scene", CSS);
  const toast = makeToast(ctx), sfx = makeSfx(ctx);
  const host = ctx.host || document.querySelector("main") || document.body;
  const root = document.createElement("section");
  root.className = "an-scene"; root.id = "animalsScene"; root.hidden = true; root.setAttribute("aria-label", "Khu chăn nuôi");
  root.innerHTML =
    `<header class="an-head">${ctx.onBack ? `<button class="an-back" type="button" data-act="back">← Nông trại</button>` : ""}` +
    `<h2>Khu chăn nuôi</h2><div class="an-feed" aria-live="polite"></div></header>` +
    `<div class="an-actions"><button class="an-btn an-btn--go" type="button" data-act="feedAll">Cho ăn tất cả</button>` +
    `<button class="an-btn an-btn--go" type="button" data-act="collectAll">Thu tất cả</button></div>` +
    `<div class="an-pens">${ANIMALS.map((d) =>
      `<article class="an-pen" data-kind="${d.id}" aria-label="${esc(d.housingName)}"><div class="an-pen-head"><b>${esc(d.housingName)}</b><span class="an-count"></span>` +
      `<div class="an-buy-wrap"><button class="an-btn" type="button" data-act="buy" data-kind="${d.id}">Mua ${esc(d.name.toLowerCase())} · ${fmtNum(d.buy)} xu</button><small class="an-lock"></small></div></div>` +
      `<div class="an-yard"><canvas width="${W}" height="${SLOTS[d.id].h}" aria-hidden="true"></canvas><div class="an-taps"></div><div class="an-empty" hidden></div></div></article>`).join("")}</div>` +
    `<p class="an-note">Cho ăn trừ thức ăn ngay lúc bấm. Gà đẻ trứng sau ${fmtLeft(ANIMAL.ga.cycleMs)}, bò cho sữa sau ${fmtLeft(ANIMAL["bo-sua"].cycleMs)} — cả khi bạn tắt máy.</p>`;
  host.append(root);

  const $ = (sel) => root.querySelector(sel);
  const pens = Object.fromEntries(ANIMALS.map((d) => {
    const el = root.querySelector(`.an-pen[data-kind="${d.id}"]`);
    return [d.id, { el, cv: el.querySelector("canvas"), taps: el.querySelector(".an-taps"), empty: el.querySelector(".an-empty"),
      count: el.querySelector(".an-count"), buy: el.querySelector('[data-act="buy"]'), lock: el.querySelector(".an-lock"), key: "" }];
  }));
  const feedEl = $(".an-feed"), feedAllBtn = $('[data-act="feedAll"]'), collectAllBtn = $('[data-act="collectAll"]');
  let raf = 0, lastPaint = 0;

  const s = () => ctx.s;
  const now = () => ctx.now();
  const farm = () => s().animals || A.createAnimals();
  const rc = () => (typeof ctx.rulesCtx === "function" ? ctx.rulesCtx() : { level: s().level, buildings: s().buildings });
  const count = (id) => (s().inv?.[id] || 0) + (s().overflow?.[id] || 0);
  const housingLevel = (d) => {
    const c = rc();
    if (typeof c.capacity === "function") return c.capacity(d.id) > 0 ? Math.max(1, A.buildingLevel(c.buildings, d.housing)) : 0;
    return A.buildingLevel(c.buildings, d.housing);
  };
  /** Vị trí con thứ k của loại kind trong sân (toạ độ logic). */
  const spot = (kind, k) => { const sp = SLOTS[kind].spots; const p = sp[k % sp.length]; const lap = Math.floor(k / sp.length); return [p[0] - lap * 14, p[1] - lap * 10]; };
  /** Lắc qua lại vài pixel (chỉ khi khung đi). dx, hướng (true = sang phải ⇒ lật sprite vì gốc nhìn trái). */
  const wander = (uid, t) => { const ph = t / 1500 + uid * 1.7; return [Math.sin(ph) * 7, Math.cos(ph) > 0]; };

  // ---------- vẽ ----------
  function paint(t) {
    const n = now(), st = A.status(farm(), n, rc());
    for (const d of ANIMALS) {
      const p = pens[d.id], g = p.cv.getContext("2d"), L = SLOTS[d.id];
      g.clearRect(0, 0, W, L.h);
      const lv = housingLevel(d), [hx, hy, hk] = L.house;
      if (lv > 0) {
        const big = d.id === "ga" && lv >= 2;
        draw(g, big ? "buildings-2" : "buildings", big ? "chuong-ga-2" : d.housing, hx, hy, hk);
      } else {
        draw(g, "buildings", "lo-ban-ve", hx, hy - 60, 0.42, 0.85);
        draw(g, "buildings", d.housing, hx, hy, hk, 0.22);
      }
      const mine = st.list.filter((a) => a.kind === d.id);
      // thứ tự vẽ theo y để con phía dưới che con phía trên
      const placed = mine.map((a, k) => ({ a, p: spot(d.id, k) })).sort((x, y) => x.p[1] - y.p[1]);
      for (const { a, p: [x, y] } of placed) {
        const sp = a.sprite, k = d.sprite.scale;
        let dx = 0, flip = sp.flip;
        if (sp.frame.includes("-di-")) { const [w, right] = wander(a.uid, t); dx = w; flip = right; }
        // bóng
        g.save(); g.globalAlpha = 0.28; g.fillStyle = "#000"; g.beginPath(); g.ellipse(x + dx, y - 2, d.id === "ga" ? 16 : 30, d.id === "ga" ? 5 : 8, 0, 0, Math.PI * 2); g.fill(); g.restore();
        draw(g, "animals", sp.frame, x + dx, y, k, 1, flip);
        if (sp.bubble) {
          const f = frame("animals", sp.frame), top = y - (f ? f.anchor[1] * k * 0.78 : 60);
          draw(g, "animals", sp.bubble, x + dx + (d.id === "ga" ? 14 : 22), top + Math.sin(t / 380 + a.uid) * 2.5, 0.72);
        }
      }
    }
  }
  function loop(t) {
    raf = 0;
    if (root.hidden || document.hidden) return;
    if (t - lastPaint > 90) { lastPaint = t; if (artReady()) paint(t); }
    raf = requestAnimationFrame(loop);
  }

  // ---------- HTML ----------
  const STATE_LABEL = { hungry: "đói", producing: "đang làm", ready: "chín" };
  function renderPen(d, st) {
    const p = pens[d.id], f = farm(), c = rc(), info = st.kinds[d.id];
    const e = A.canBuy(f, { coins: () => s().coins }, d.id, c);
    p.count.textContent = info.capacity > 0 ? `${info.count}/${info.capacity} con` : info.count ? `${info.count} con` : "";
    p.buy.disabled = !!e;
    p.lock.textContent = e ? (e === "capacity" ? `Chuồng đầy ${info.count}/${info.capacity} — nâng chuồng để thêm chỗ` : (BUY_ERR[e]?.(d) || "Chưa mua được")) : `Còn ${info.capacity - info.count} chỗ`;
    p.buy.setAttribute("aria-describedby", "");
    // nút chạm từng con (≥ 44 px)
    const mine = st.list.filter((a) => a.kind === d.id);
    const key = mine.map((a) => a.uid + a.state).join(",");
    if (key !== p.key) { // dựng lại nút chỉ khi đàn / trạng thái đổi (giữ focus bàn phím); đồng hồ cập nhật riêng bên dưới
      p.key = key;
      const H = SLOTS[d.id].h, bw = d.id === "ga" ? 56 : 84, bh = d.id === "ga" ? 64 : 92;
      p.taps.innerHTML = mine.map((a, k) => {
        const [x, y] = spot(d.id, k);
        const what = a.state === "ready" ? `chạm để thu ${ITEM[d.product].name.toLowerCase()}` : a.state === "hungry" ? `chạm để cho ăn (${d.feed} bao)` : `còn ${fmtLeft(a.remaining)}`;
        return `<button class="an-tap" type="button" data-act="tap" data-uid="${a.uid}" data-state="${a.state}" ` +
          `style="left:${((x - bw / 2) / W) * 100}%;top:${((y - bh) / H) * 100}%;width:${(bw / W) * 100}%;height:${(bh / H) * 100}%" ` +
          `aria-label="${esc(d.name)} số ${k + 1}: ${STATE_LABEL[a.state]}, ${esc(what)}">` +
          (a.state === "producing" ? `<span class="an-tip-t">${fmtLeft(a.remaining)}</span>` : "") + `</button>`;
      }).join("");
    } else {
      for (const a of mine) {
        if (a.state !== "producing") continue;
        const t = p.taps.querySelector(`.an-tap[data-uid="${a.uid}"] .an-tip-t`);
        if (t) t.textContent = fmtLeft(a.remaining);
      }
    }
    // trạng thái trống: dạy phải làm gì
    let empty = "";
    if (!info.unlocked) empty = `<b>${esc(d.housingName)} mở ở cấp ${d.level}</b>Giao đơn, thu hoạch, chế biến để lên cấp.`;
    else if (info.capacity <= 0) empty = `<b>Chưa có ${esc(d.housingName.toLowerCase())}</b><ol><li>Bấm <b style="display:inline;color:inherit">Xây</b> (cái búa) trên bản đồ, chọn ${esc(d.housingName)}.</li><li>Xây xong quay lại đây mua ${esc(d.name.toLowerCase())}.</li></ol>`;
    else if (!info.count) {
      empty = `<b>Chuồng còn trống</b><ol><li>Bấm “Mua ${esc(d.name.toLowerCase())}” (${fmtNum(d.buy)} xu).</li>` +
        `<li>Chạm con vật để cho ăn ${d.feed} bao ${esc(ITEM[FEED].name.toLowerCase())}.</li>` +
        `<li>Sau ${fmtLeft(d.cycleMs)} chạm bong bóng ${esc(ITEM[d.product].name.toLowerCase())} để thu.</li></ol>`;
    }
    p.empty.hidden = !empty;
    if (empty && p.empty.innerHTML !== empty) p.empty.innerHTML = empty;
  }

  function render() {
    if (root.hidden) return;
    const n = now(), st = A.status(farm(), n, rc());
    const stock = count(FEED), need = ANIMALS.reduce((t, d) => t + st.kinds[d.id].feedNeeded, 0);
    const hungry = st.list.filter((a) => a.state === "hungry").length, ready = st.list.filter((a) => a.state === "ready").length;
    const low = need > stock;
    feedEl.classList.toggle("is-low", low);
    const fhtml = `${iconHtml(FEED, 32)}<div><b>${esc(ITEM[FEED].name)}: ${fmtNum(stock)} bao</b>` +
      `<small>${low ? `Cần ${need} bao cho ${hungry} con đói — Cối xay: 2 ngô → 3 bao · Chợ: ${fmtNum(ITEM[FEED].buy)} xu` : hungry ? `Đủ cho ${hungry} con đang đói` : "Gà 1 bao, bò 2 bao mỗi lần ăn"}</small></div>`;
    if (feedEl.innerHTML !== fhtml) feedEl.innerHTML = fhtml;
    feedAllBtn.textContent = hungry ? `Cho ăn tất cả (${hungry})` : "Cho ăn tất cả";
    feedAllBtn.disabled = !hungry || stock < Math.min(...ANIMALS.filter((d) => st.kinds[d.id].hungry).map((d) => d.feed), Infinity);
    collectAllBtn.textContent = ready ? `Thu tất cả (${ready})` : "Thu tất cả";
    collectAllBtn.disabled = !ready;
    for (const d of ANIMALS) renderPen(d, st);
    if (!raf) raf = requestAnimationFrame(loop);
  }

  // ---------- điều khiển ----------
  function tapAnimal(uid, el) {
    const a = farm().list.find((x) => x.uid === uid);
    if (!a) return;
    const d = ANIMAL[a.kind], st = A.stateOf(a, now());
    if (st === "hungry") {
      if (count(FEED) < d.feed) { toast(`${d.name} cần ${d.feed} bao thức ăn. ${ERR_TEXT.feed}`); sfx("trung-da", 0.35); return; }
      ctx.exec({ type: "feedAnimal", uid }, { el });
    } else if (st === "ready") ctx.exec({ type: "collectAnimal", uid }, { el });
    else { toast(`${d.name} đang ${d.id === "ga" ? "đẻ trứng" : "làm sữa"} — còn ${fmtLeft(a.readyAt - now())}.`); sfx("buoc-nhay", 0.25, 1.3); }
  }
  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]");
    if (!b || b.disabled) return;
    const act = b.dataset.act;
    if (act === "tap") tapAnimal(Number(b.dataset.uid), b);
    else if (act === "buy") ctx.exec({ type: "buyAnimal", kind: b.dataset.kind }, { el: b });
    else if (act === "feedAll") ctx.exec({ type: "feedAll" }, { el: b });
    else if (act === "collectAll") ctx.exec({ type: "collectAllAnimals" }, { el: b });
    else if (act === "back") ctx.onBack?.();
  });

  /** Toạ độ (trong root) của con uid — để đặt hiệu ứng. */
  function animalPos(uid) {
    const el = root.querySelector(`.an-tap[data-uid="${uid}"]`);
    if (el) return centerIn(root, el);
    const a = farm().list.find((x) => x.uid === uid), p = a && pens[a.kind];
    return p ? centerIn(root, p.cv) : null;
  }
  /** Hiệu ứng theo sự kiện luật (game.js gọi sau mỗi apply thành công). */
  function onEvents(events = [], origin = {}) {
    if (root.hidden) return;
    let sound = null;
    const collected = events.filter((e) => e.type === "animalCollected");
    for (const e of events) {
      if (e.type === "animalFed") {
        const p = animalPos(e.uid);
        if (p) fx(root, "thanh-am-vat-nuoi", p[0], p[1] - 16, 56);
        sound ??= ["buoc-nhay", 0.5, 0.8];
      } else if (e.type === "animalCollected") {
        const p = animalPos(e.uid);
        if (p) {
          fx(root, "lap-lanh", p[0], p[1] - 20, 64);
          if (collected.length <= 4) floatText(root, p[0], p[1] - 44, `+${e.qty} ${ITEM[e.item].name} · +${e.xp} XP`);
        }
        sound = ["trung-kim-cuong", 0.8, ANIMAL[e.kind]?.id === "ga" ? 1.15 : 0.95];
      } else if (e.type === "animalBought") {
        const p = origin.el ? centerIn(root, origin.el) : null;
        if (p) { fx(root, "lap-lanh", p[0], p[1], 64); floatText(root, p[0], p[1] - 24, `−${fmtNum(e.cost)} xu`); }
        sound = ["qua-man", 0.6, 1.1];
        toast(`Đã mua 1 ${ANIMAL[e.kind].name.toLowerCase()} — chạm vào để cho ăn.`);
      }
    }
    if (collected.length > 4 && origin.el) {
      const p = centerIn(root, origin.el), xp = collected.reduce((t, e) => t + e.xp, 0);
      if (p) floatText(root, p[0], p[1] - 24, `+${collected.length} món · +${xp} XP`);
    }
    if (sound) sfx(...sound);
    for (const p of Object.values(pens)) p.key = "";
  }

  let secT = 0;
  function show() {
    root.hidden = false;
    for (const p of Object.values(pens)) p.key = "";
    render();
    clearInterval(secT); secT = setInterval(() => { if (!root.hidden && !document.hidden) render(); }, 1000);
  }
  function hide() { root.hidden = true; clearInterval(secT); if (raf) { cancelAnimationFrame(raf); raf = 0; } }
  loadArt().then(() => render());
  return {
    root, render, show, hide, open: show, close: hide, onEvents,
    errorText: (code) => ERR_TEXT[code] || null,
    animalEl: (uid) => root.querySelector(`.an-tap[data-uid="${uid}"]`),
    get visible() { return !root.hidden; },
  };
}
