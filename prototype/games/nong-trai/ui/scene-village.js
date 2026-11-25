// Cảnh Làng (DESIGN-2.0 §1 khu 7, §5 — Milestone 4). Con đường làng nằm ngang (village.webp: duong-lang + mep-co lặp, tre,
// bụi chuối, cột đèn lồng), 4 nhà NPC, NPC đứng trước nhà (npc / npc-2, khung đứng luân phiên, vẫy tay khi được chọn).
// Chạm NPC ⇒ thẻ thoại: chân dung, câu thoại (data/village.js), mức thân thiết, câu chuyện chuỗi 3 bước (tiến độ, nút nhận),
// nhiệm vụ tiến trình (Chị Ba giao). "Bảng nhiệm vụ làng" 3 ô lặp lại có nút nhận.
// Mọi thay đổi trạng thái đi qua ctx.exec(action) ⇒ apply(). File này chỉ đọc luật (core/village.js) để hiển thị.
//
// ctx = {
//   s (getter: s.village, s.level, s.inv, s.overflow, s.quests), now(), exec(action, origin),
//   host?: Element (mặc định <main> hoặc <body>), rulesCtx?(): ctx cho core/village.js
//     (mặc định { level: s.level, seed: s.seed, buildings: s.buildings, tutorialDone: tutorialDone(s) }),
//   toast?(msg, ms), sfx?(name, vol, rate), onBack?(),
// }
// Trả { root, open, close, show, hide, render, onEvents(events, origin), selectNpc(id), npcEl(id) }.
import * as V from "../core/village.js?v=m10";
import { VILLAGERS, VILLAGER, PROGRESSION_GIVER, VILLAGE_LEVEL, CHAIN_LEVEL, FRIEND_LEVELS } from "../data/village.js?v=m10";
import { ITEM } from "../data/catalog.js?v=m10";
import {
  loadArt, artReady, draw, tileRow, cropUrl, fx, floatText, centerIn, injectStyle, esc, fmtNum, iconHtml, makeToast, makeSfx, frameCss, frameEdgeCss,
  rewardHtml, rewardText,
} from "./m4-art.js?v=m10";

const RW = 1000, RH = 216, GROUND = 144; // khung vẽ đường làng (logic)
const HOUSE_X = [130, 375, 625, 870];
const NPC_DX = 74, NPC_Y = 192, NPC_K = 0.62, HOUSE_K = 0.78;
const PROPS = [["tre", 22, 136, 0.9], ["bui-chuoi", 252, 140, 0.75], ["cot-den-long", 500, 144, 0.8], ["bui-chuoi", 748, 140, 0.75], ["tre", 985, 136, 0.9]];
const ERR_TEXT = {
  "give-stock": "Chưa đủ hàng để trao — xem số còn thiếu trong thẻ.", "quest-incomplete": "Nhiệm vụ chưa xong.", "quest-claimed": "Đã nhận rồi.",
  full: "Kho đầy — bán bớt rồi nhận thưởng.", locked: "Chưa mở.",
};

const CSS = `
.vl-scene { --vl-ink: #f4ead2; --vl-soft: #b9ad93; --vl-gold: #ffc94a; --vl-line: #0a0807;
  --vl-border: 0 -3px 0 0 var(--vl-line), 0 3px 0 0 var(--vl-line), -3px 0 0 0 var(--vl-line), 3px 0 0 0 var(--vl-line);
  position: relative; width: 100%; max-width: 1180px; margin: 0 auto; padding: 12px 16px 20px; color: var(--vl-ink);
  font: 500 15px/1.45 "Be Vietnam Pro", system-ui, sans-serif; box-sizing: border-box; }
.vl-scene *, .vl-scene *::before { box-sizing: border-box; }
.vl-head { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 14px; margin: 0 0 10px; }
.vl-head h2 { margin: 0; font: 800 20px/1.2 "Be Vietnam Pro", system-ui; letter-spacing: .04em; text-transform: uppercase; text-shadow: 2px 2px 0 #000; }
.vl-head small { color: var(--vl-soft); font-weight: 600; }
.vl-back { min-height: 44px; padding: 6px 12px; font: 700 14px "Be Vietnam Pro", system-ui; color: var(--vl-ink); background: #262019; border: 0; box-shadow: var(--vl-border); cursor: pointer; }
.vl-road { position: relative; overflow-x: auto; overflow-y: hidden; -webkit-overflow-scrolling: touch; overscroll-behavior-x: contain;
  box-shadow: inset 0 0 0 3px var(--vl-line); background: #3d7230 var(--m4-grass, none) 0 0 / 64px 64px repeat; image-rendering: pixelated; scrollbar-width: thin; }
.vl-strip { position: relative; width: ${RW}px; height: ${RH}px; }
.vl-strip canvas { display: block; width: ${RW}px; height: ${RH}px; image-rendering: pixelated; }
.vl-npc { position: absolute; width: 72px; height: 104px; padding: 0; border: 0; background: transparent; cursor: pointer; }
.vl-npc span { position: absolute; left: 50%; bottom: -6px; transform: translateX(-50%); white-space: nowrap; padding: 2px 6px;
  font: 800 12px/1.2 "Be Vietnam Pro", system-ui; color: #fff; background: rgba(20,14,8,.78); box-shadow: 0 0 0 2px var(--vl-line); }
.vl-npc[aria-pressed="true"] span { background: #7a4d12; color: var(--vl-gold); }
.vl-npc i { position: absolute; right: 2px; top: 6px; min-width: 22px; height: 22px; display: grid; place-items: center; font: 900 14px/1 "Be Vietnam Pro", system-ui; font-style: normal;
  color: #2a1606; background: var(--vl-gold); box-shadow: 0 0 0 2px var(--vl-line); animation: vl-bob 1.2s ease-in-out infinite; }
@keyframes vl-bob { 50% { transform: translateY(-4px); } }
.vl-npc:focus-visible, .vl-btn:focus-visible, .vl-back:focus-visible, .vl-x:focus-visible { outline: 3px dashed var(--vl-gold); outline-offset: 2px; }
.vl-hint { margin: 6px 0 12px; font-size: 13px; color: var(--vl-soft); }
.vl-lock { padding: 10px 12px; margin: 0 0 12px; background: #262019; box-shadow: var(--vl-border); font-weight: 700; }
.vl-grid { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); gap: 16px; align-items: start; }
@media (max-width: 860px) { .vl-grid { grid-template-columns: minmax(0, 1fr); } }
.vl-card { position: relative; min-width: 0; padding: 12px 14px; background: #f1e3c0; color: #2c1d10; box-shadow: var(--vl-border), 4px 7px 0 0 rgba(0,0,0,.5); }
${frameEdgeCss(".m4-art-ready .vl-card", "the-cong-thuc", "14 14 14 14", 14, "#f1dcae")}
.m4-art-ready .vl-card { box-shadow: 4px 7px 0 0 rgba(0,0,0,.45); padding: 4px 6px; }
.vl-card h3 { margin: 0 0 6px; font: 800 16px/1.25 "Be Vietnam Pro", system-ui; }
.vl-card h4 { margin: 12px 0 4px; font: 800 14px/1.25 "Be Vietnam Pro", system-ui; color: #6b3d10; }
.vl-dlg-head { display: grid; grid-template-columns: 88px minmax(0, 1fr) auto; gap: 10px; align-items: center; }
.vl-face { width: 88px; height: 88px; background: #e2c995 center / contain no-repeat; image-rendering: pixelated; box-shadow: 0 0 0 3px #5a3a1b; }
.vl-who b { display: block; font: 800 17px/1.2 "Be Vietnam Pro", system-ui; }
.vl-who small { display: block; color: #6b5640; font-weight: 600; }
.vl-x { width: 44px; height: 44px; border: 0; background: #5a3a1b; color: #f4ead2; font: 800 18px/1 "Be Vietnam Pro", system-ui; cursor: pointer; box-shadow: var(--vl-border); }
.vl-friend { margin-top: 4px; font-size: 13px; font-weight: 700; color: #7a4d12; }
.vl-bar { position: relative; height: 10px; margin-top: 3px; background: #5a3a1b; box-shadow: 0 0 0 2px #2c1d10; }
.vl-bar > b { position: absolute; inset: 0 auto 0 0; background: linear-gradient(#ffe08a, #e0a530); }
.vl-line { margin: 10px 0 0; padding: 8px 10px; background: #fff7e2; box-shadow: 0 0 0 2px #c9a86a; font-style: italic; }
.vl-intro { margin: 2px 0 6px; font-size: 13px; color: #5a4632; }
.vl-steps { list-style: none; margin: 4px 0; padding: 0; display: grid; gap: 3px; font-size: 14px; }
.vl-steps li { display: flex; gap: 6px; align-items: baseline; }
.vl-steps li.done { color: #3d7a2a; text-decoration: line-through; }
.vl-steps li.now { font-weight: 800; }
.vl-steps li.later { color: #8c7a63; }
.vl-quest { margin-top: 6px; padding: 8px 10px; background: rgba(255,255,255,.45); box-shadow: 0 0 0 2px #c9a86a; }
.vl-quest p { margin: 2px 0 6px; font-size: 13px; color: #5a4632; }
.vl-give { list-style: none; margin: 4px 0 6px; padding: 0; display: flex; flex-wrap: wrap; gap: 6px 12px; font-size: 13px; font-weight: 700; }
.vl-give li.miss { color: #b3261e; } .vl-give li.ok { color: #2f6b1f; }
.vl-row { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; margin-top: 6px; }
.vl-reward { font-size: 13px; font-weight: 700; display: flex; flex-wrap: wrap; gap: 4px 10px; align-items: center; }
.vl-btn { min-height: 44px; min-width: 44px; padding: 6px 14px; font: 800 14px/1.2 "Be Vietnam Pro", system-ui; color: #2a1606; cursor: pointer;
  background: #8fd27b; border: 0; box-shadow: var(--vl-border); }
${frameCss(".m4-art-ready .vl-btn", "nut-nhan", "10 14 10 14", 10)}
.m4-art-ready .vl-btn { background: none; box-shadow: none; }
.m4-art-ready .vl-btn:not(:disabled) { color: #fff3cf; text-shadow: 1px 1px 0 #000, -1px 0 0 #000; }
.vl-btn:disabled { cursor: not-allowed; color: #2e2822; text-shadow: 0 1px 0 rgba(255,255,255,.35); }
${frameCss(".m4-art-ready .vl-btn:disabled", "nut-khoa", "10 14 10 14", 10)}
.vl-board { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.vl-slip { padding: 10px 12px; background: #f7ecd2; color: #2c1d10; box-shadow: var(--vl-border); }
${frameEdgeCss(".m4-art-ready .vl-slip", "phieu-don", "26 14 12 24", 14, "#f7e7c4")}
.m4-art-ready .vl-slip { box-shadow: none; padding: 6px 4px 2px 6px; }
.vl-slip b { display: block; font: 800 14px/1.25 "Be Vietnam Pro", system-ui; }
.vl-slip p { margin: 2px 0 4px; font-size: 12px; color: #5a4632; }
.vl-slip.is-done { outline: 3px solid #3fae4a; outline-offset: -3px; }
.vl-prog { font-size: 12px; font-weight: 800; color: #6b3d10; }
.vl-empty { font-size: 13px; color: #5a4632; }
.vl-truck { margin-top: 12px; }
@media (max-width: 480px) { .vl-scene { padding: 10px 12px 16px; } .vl-dlg-head { grid-template-columns: 64px minmax(0, 1fr) auto; } .vl-face { width: 64px; height: 64px; } }
`;

export function createVillageScene(ctx) {
  injectStyle("vl-scene", CSS);
  const toast = makeToast(ctx), sfx = makeSfx(ctx);
  const host = ctx.host || document.querySelector("main") || document.body;
  const root = document.createElement("section");
  root.className = "vl-scene"; root.id = "villageScene"; root.hidden = true; root.setAttribute("aria-label", "Làng");
  root.innerHTML =
    `<header class="vl-head">${ctx.onBack ? `<button class="vl-back" type="button" data-act="back">← Nông trại</button>` : ""}` +
    `<h2>Làng</h2><small class="vl-sub"></small></header>` +
    `<div class="vl-lock" hidden></div>` +
    `<div class="vl-road" tabindex="-1"><div class="vl-strip"><canvas width="${RW}" height="${RH}" aria-hidden="true"></canvas>` +
    VILLAGERS.map((v, k) => `<button class="vl-npc" type="button" data-act="npc" data-npc="${v.id}" aria-pressed="false" ` +
      `style="left:${HOUSE_X[k] + NPC_DX - 36}px;top:${NPC_Y - 104}px" aria-label="${esc(v.name)} — ${esc(v.role)}"><i hidden>!</i><span>${esc(v.name.split(" ").slice(0, 2).join(" "))}</span></button>`).join("") +
    `</div></div>` +
    `<p class="vl-hint">Kéo ngang để đi dọc đường làng · chạm một người để trò chuyện và xem nhiệm vụ.</p>` +
    `<div class="vl-grid"><div class="vl-card vl-dialog" aria-live="polite"></div>` +
    `<section class="vl-card vl-boardcard" aria-label="Bảng nhiệm vụ làng"><h3>Bảng nhiệm vụ làng</h3><ul class="vl-board"></ul>` +
    `<p class="vl-empty">Làm xong nhiệm vụ nào thì nhận thưởng, ô đó có nhiệm vụ mới.</p></section></div>`;
  host.append(root);

  const $ = (sel) => root.querySelector(sel);
  const cv = $(".vl-strip canvas"), g = cv.getContext("2d");
  const dlg = $(".vl-dialog"), board = $(".vl-board"), lockEl = $(".vl-lock"), sub = $(".vl-sub"), road = $(".vl-road");
  const npcBtns = Object.fromEntries(VILLAGERS.map((v) => [v.id, root.querySelector(`.vl-npc[data-npc="${v.id}"]`)]));
  let sel = null, line = "", waveUntil = 0, raf = 0, lastPaint = 0, dlgKey = "", boardKey = "";

  const s = () => ctx.s;
  const now = () => ctx.now();
  const vs = () => s().village || V.createVillage();
  const rc = () => (typeof ctx.rulesCtx === "function" ? ctx.rulesCtx()
    : { level: s().level, seed: s().seed, buildings: s().buildings, tutorialDone: V.tutorialDone(s()) });
  const inv = () => {
    const c = (id) => (s().inv?.[id] || 0) + (s().overflow?.[id] || 0) + (s().decor?.[id] || 0);
    return { count: c, has: (id, n) => c(id) >= n };
  };
  const log = () => V.questLog(vs(), rc(), inv());

  // ---------- vẽ đường làng ----------
  let paintedKey = "";
  /** Vẽ lại chỉ khi khung NPC / trạng thái mở đổi (khung idle đổi mỗi 750 ms) — không vẽ 8 lần/giây khi cảnh đứng yên. */
  function paint(t) {
    const open = V.villageUnlocked(rc());
    const key = open + "|" + VILLAGERS.map((v, i) => (sel === v.id && t < waveUntil ? "w" : Math.floor((t + i * 310) / 750) % v.idle.length)).join(",");
    if (key === paintedKey) return;
    paintedKey = key;
    g.clearRect(0, 0, RW, RH);
    tileRow(g, "village", "mep-co", 0, RW, GROUND - 6, 1);
    tileRow(g, "village", "duong-lang", 0, RW, GROUND + 32, 1);
    tileRow(g, "village", "duong-lang", 0, RW, GROUND + 80, 1);
    for (const [id, x, y, k] of PROPS) draw(g, "village", id, x, y, k);
    VILLAGERS.forEach((v, i) => {
      draw(g, "village", v.house, HOUSE_X[i], GROUND, HOUSE_K, open ? 1 : 0.55);
      const waving = sel === v.id && t < waveUntil;
      const fr = waving ? v.wave : v.idle[Math.floor((t + i * 310) / 750) % v.idle.length];
      g.save(); g.globalAlpha = 0.3; g.fillStyle = "#000"; g.beginPath(); g.ellipse(HOUSE_X[i] + NPC_DX, NPC_Y - 2, 20, 6, 0, 0, Math.PI * 2); g.fill(); g.restore();
      draw(g, v.sheet, fr, HOUSE_X[i] + NPC_DX, NPC_Y, NPC_K, open ? 1 : 0.6, i % 2 === 1);
    });
  }
  function loop(t) {
    raf = 0;
    if (root.hidden || document.hidden) return;
    if (t - lastPaint > 120) { lastPaint = t; if (artReady()) paint(t); }
    raf = requestAnimationFrame(loop);
  }

  // ---------- HTML ----------
  const bar = (p, n) => `<div class="vl-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${n}" aria-valuenow="${Math.min(p, n)}"><b style="width:${n ? Math.round((100 * Math.min(p, n)) / n) : 100}%"></b></div>`;
  function questHtml(q, btnAttrs, label) {
    if (!q) return "";
    const give = q.give ? `<ul class="vl-give">${q.give.map((x) => `<li class="${x.have >= x.need ? "ok" : "miss"}">${iconHtml(x.id, 20)} ${esc(ITEM[x.id]?.name || x.id)} ${x.have}/${x.need}</li>`).join("")}</ul>` : "";
    const prog = q.give ? "" : `<span class="vl-prog">${fmtNum(Math.min(q.progress, q.count))}/${fmtNum(q.count)}${q.steps ? " bước" : ""}</span>${bar(q.progress, q.count)}`;
    return `<div class="vl-quest"><b>${esc(q.title)}</b><p>${esc(q.hint)}</p>${give}${prog}` +
      `<div class="vl-row"><span class="vl-reward">${rewardHtml(q.reward)}</span>` +
      `<button class="vl-btn" type="button" ${btnAttrs}${q.claimable ? "" : " disabled"}>${esc(q.give ? (q.claimable ? "Trao hàng & nhận" : "Chưa đủ hàng") : label)}</button></div></div>`;
  }
  function dialogHtml(id) {
    const v = VILLAGER[id], L = log(), c = rc(), vsv = vs(), f = vsv.friends[id];
    const fr = V.friendLevel(f.points), nextMin = fr.next, prevMin = FRIEND_LEVELS[fr.index].min;
    const face = cropUrl(v.sheet, v.portrait);
    let h = `<div class="vl-dlg-head"><div class="vl-face" role="img" aria-label="Chân dung ${esc(v.name)}"${face ? ` style="background-image:url(${face})"` : ""}></div>` +
      `<div class="vl-who"><b id="vlName">${esc(v.name)}</b><small>${esc(v.role)}</small>` +
      `<div class="vl-friend">Thân thiết: ${esc(fr.name)} · ${f.points}${nextMin !== null ? `/${nextMin}` : ""} điểm</div>` +
      `${bar(f.points - prevMin, (nextMin ?? f.points + 1) - prevMin)}</div>` +
      `<button class="vl-x" type="button" data-act="closeDlg" aria-label="Đóng thoại">✕</button></div>` +
      `<p class="vl-line">“${esc(line || v.lines[f.talks % v.lines.length])}”</p>`;
    if (id === PROGRESSION_GIVER) {
      h += `<h4>Nhiệm vụ của ${esc(v.name.split(" ").slice(0, 2).join(" "))}</h4>`;
      if (L.progression) h += questHtml(L.progression, `data-act="claimProg" data-id="${esc(L.progression.id)}"`, L.progression.claimable ? "Nhận thưởng" : "Đang làm");
      else if (L.progressionNext) h += `<p class="vl-intro">${L.progressionNext.reason === "tutorial" ? "Làm xong các bước hướng dẫn trên nông trại trước đã nhé." : `Nhiệm vụ tiếp theo “${esc(L.progressionNext.title)}” mở ở cấp ${L.progressionNext.minLevel}.`}</p>`;
      else h += `<p class="vl-intro">Em đã làm hết việc chị nhờ rồi. Giỏi lắm!</p>`;
    }
    const ch = L.chains.find((x) => x.npc === id);
    h += `<h4>Câu chuyện: ${esc(v.chain.title)}</h4>`;
    if (ch.locked) h += `<p class="vl-intro">Câu chuyện của ${esc(v.name.split(" ").slice(0, 2).join(" "))} mở ở cấp ${CHAIN_LEVEL}${c.level < CHAIN_LEVEL ? ` (bạn đang cấp ${c.level})` : ""}.</p>`;
    else {
      if (ch.step === 0) h += `<p class="vl-intro">${esc(v.chain.intro)}</p>`;
      h += `<ol class="vl-steps">${v.chain.steps.map((st, k) => `<li class="${k < ch.step ? "done" : k === ch.step ? "now" : "later"}">${k < ch.step ? "✓" : k === ch.step ? "▶" : "○"} ${esc(st.title)}</li>`).join("")}</ol>`;
      if (ch.done) h += `<p class="vl-intro">Đã xong câu chuyện — cảm ơn bạn nhiều!</p>`;
      else h += questHtml(ch.quest, `data-act="claimStep" data-npc="${id}" data-step="${ch.step}"`, ch.quest.claimable ? `Nhận thưởng bước ${ch.step + 1}` : "Đang làm");
    }
    return h;
  }
  function boardHtml(L) {
    if (!L.villageUnlocked) return `<li class="vl-empty">Bảng mở khi Làng mở (cấp ${VILLAGE_LEVEL}).</li>`;
    if (!L.board.length) return `<li class="vl-empty">Chưa có nhiệm vụ.</li>`;
    return L.board.map((q) => `<li class="vl-slip${q.claimable ? " is-done" : ""}" data-uid="${q.uid}"><b>${esc(q.title)}</b><p>${esc(q.hint)}</p>` +
      `<span class="vl-prog">${fmtNum(Math.min(q.progress, q.count))}/${fmtNum(q.count)}</span>${bar(q.progress, q.count)}` +
      `<div class="vl-row"><span class="vl-reward">${rewardHtml(q.reward)}</span>` +
      `<button class="vl-btn" type="button" data-act="claimBoard" data-uid="${q.uid}"${q.claimable ? "" : " disabled"}>${q.claimable ? "Nhận thưởng" : "Đang làm"}</button></div></li>`).join("");
  }
  const claimableFor = (L, id) => (id === PROGRESSION_GIVER && !!L.progression?.claimable) || !!L.chains.find((x) => x.npc === id)?.quest?.claimable;

  function render() {
    if (root.hidden) return;
    const L = log(), c = rc();
    const open = L.villageUnlocked;
    lockEl.hidden = open;
    if (!open) lockEl.textContent = `Làng mở ở cấp ${VILLAGE_LEVEL} — bạn đang cấp ${c.level}. Giao đơn, thu hoạch để lên cấp nhé!`;
    sub.textContent = open ? L.friends.map((f) => `${VILLAGER[f.npc].name.split(" ").slice(0, 2).join(" ")}: ${f.name}`).join(" · ") : "";
    for (const v of VILLAGERS) {
      const b = npcBtns[v.id];
      b.setAttribute("aria-pressed", String(sel === v.id));
      b.querySelector("i").hidden = !open || !claimableFor(L, v.id);
    }
    const bk = JSON.stringify(L.board) + open;
    if (bk !== boardKey) { boardKey = bk; board.innerHTML = boardHtml(L); }
    if (sel) {
      const dk = sel + line + JSON.stringify([L.progression, L.progressionNext, L.chains.find((x) => x.npc === sel), vs().friends[sel], c.level]);
      if (dk !== dlgKey) { dlgKey = dk; dlg.innerHTML = dialogHtml(sel); }
      dlg.hidden = false;
    } else {
      const html = open ? `<h3>Chào mừng tới làng!</h3><p class="vl-intro">Chạm Chị Ba, Cô Hai, Bác Tư hoặc Anh Út trên đường làng để trò chuyện (mỗi 4 giờ +1 thân thiết) và xem nhiệm vụ của họ.</p>`
        : `<h3>Làng chưa mở</h3><p class="vl-intro">Từ cấp ${VILLAGE_LEVEL}, bốn người bạn trong làng sẽ giao nhiệm vụ và câu chuyện cho bạn.</p>`;
      if (dlgKey !== "none" + open) { dlgKey = "none" + open; dlg.innerHTML = html; }
    }
    if (!raf) raf = requestAnimationFrame(loop);
  }

  // ---------- điều khiển ----------
  function selectNpc(id) {
    const v = VILLAGER[id];
    if (!v) return;
    if (!V.villageUnlocked(rc())) { toast(`Làng mở ở cấp ${VILLAGE_LEVEL}.`); sfx("trung-da", 0.3); return; }
    const f = vs().friends[id];
    sel = id; line = v.lines[f.talks % v.lines.length]; waveUntil = performance.now() + 1500; dlgKey = "";
    render();
    ctx.exec({ type: "talkNpc", npc: id }, { el: npcBtns[id] });
    sfx("buoc-nhay", 0.35, 1.2);
    if (matchMedia("(max-width: 860px)").matches) dlg.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]");
    if (!b || b.disabled) return;
    const act = b.dataset.act;
    if (act === "npc") selectNpc(b.dataset.npc);
    else if (act === "closeDlg") { const was = sel; sel = null; line = ""; dlgKey = ""; render(); npcBtns[was]?.focus({ preventScroll: true }); }
    else if (act === "claimProg") ctx.exec({ type: "claimProgressQuest", id: b.dataset.id }, { el: b });
    else if (act === "claimStep") ctx.exec({ type: "claimChainStep", npc: b.dataset.npc, step: Number(b.dataset.step) }, { el: b });
    else if (act === "claimBoard") ctx.exec({ type: "claimBoardQuest", uid: Number(b.dataset.uid) }, { el: b });
    else if (act === "back") ctx.onBack?.();
  });

  /** Hiệu ứng theo sự kiện luật (game.js gọi sau mỗi apply thành công). */
  function onEvents(events = [], origin = {}) {
    if (root.hidden) return;
    let sound = null;
    const msgs = [];
    for (const e of events) {
      if (e.type === "npcTalked") {
        if (e.npc === sel && e.line) { line = e.line; dlgKey = ""; }
        if (e.points) { const p = centerIn(root, npcBtns[e.npc]); if (p) floatText(root, p[0], p[1] - 50, "+1 thân thiết", "#ffd0e8"); }
      } else if (e.type === "villageQuestClaimed") {
        const p = origin.el && root.contains(origin.el) ? centerIn(root, origin.el) : null;
        if (p) { fx(root, "lap-lanh", p[0], p[1] - 6, 64); fx(root, "xu-bay", p[0] - 20, p[1] - 6, 56); floatText(root, p[0], p[1] - 30, rewardText(e.reward)); }
        sound = ["qua-man", 0.7];
        msgs.push(`Nhiệm vụ xong: ${e.title}${rewardText(e.reward) ? ` (${rewardText(e.reward)})` : ""}.`);
      } else if (e.type === "villageQuestDone") {
        sound ??= ["trung-kim-cuong", 0.55, 1.2];
        msgs.push(`Đã xong “${e.title}” — nhận thưởng ở Làng!`);
      } else if (e.type === "friendUp") {
        sound ??= ["thang", 0.5, 1.2];
        msgs.push(`${VILLAGER[e.npc].name} giờ đã ${e.name.toLowerCase()} với bạn!`);
      } else if (e.type === "chainComplete") {
        sound = ["thang", 0.8];
        msgs.push(`Hoàn thành câu chuyện “${e.title}”!`);
      }
    }
    if (sound) sfx(...sound);
    if (msgs.length) toast(msgs.slice(-2).join(" "), 3000);
    boardKey = ""; dlgKey = "";
    render();
  }

  let secT = 0;
  function show() {
    root.hidden = false; boardKey = ""; dlgKey = ""; paintedKey = "";
    render();
    clearInterval(secT); secT = setInterval(() => { if (!root.hidden && !document.hidden) render(); }, 1000);
  }
  function hide() { root.hidden = true; clearInterval(secT); if (raf) { cancelAnimationFrame(raf); raf = 0; } }
  loadArt().then(() => { dlgKey = ""; render(); });
  void road;
  return {
    root, render, show, hide, open: show, close: hide, onEvents, selectNpc,
    errorText: (code) => ERR_TEXT[code] || null,
    npcEl: (id) => npcBtns[id],
    get selected() { return sel; },
    get visible() { return !root.hidden; },
  };
}
