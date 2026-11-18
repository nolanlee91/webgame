// Cờ Tỷ Phú — giao diện: bàn ảnh + lớp phủ DOM theo tọa độ manifest (hệ 1024×1024), phát lại sự kiện từ logic.js.
import { TOKENS, REGIONS, TILES, LEVEL_NAMES, RULES, createGame, roll, decide, payJail, botStep, botWants, drainEvents,
  current, rentOf, netWorth, ownedBy, upgradeCost, baseRent, ownsRegion } from "./logic.js";
import { NAME_KEY, CODE_RE, createNet, createChat, toast } from "./online.js?v=private1";

const $ = (s) => document.querySelector(s);
let SPEED = 1;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms * SPEED));
const K = (v) => (v < 0 ? "−" : "") + Math.abs(v).toLocaleString("vi-VN") + "K";
const pct = (v) => (v / 1024 * 100) + "%";
const TURN_SECONDS = 15;          // chơi với máy
const ONLINE_TURN_SECONDS = 25;   // online — khớp DEFAULT_TIMINGS.turn ở games-server/co-ty-phu/room.js
const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// ---------- Âm thanh retro (WebAudio, tự tạo) ----------
const AC = window.AudioContext || window.webkitAudioContext;
let ac = null, muted = localStorage.getItem("wgp.muted") === "1"; // dùng chung nút tắt tiếng của cả cổng game
function beep(freq, dur = 0.06, type = "square", vol = 0.05) {
  if (muted || !AC) return;
  try {
    ac = ac || new AC();
    const o = ac.createOscillator(), gn = ac.createGain();
    o.type = type; o.frequency.value = freq; gn.gain.value = vol;
    gn.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
    o.connect(gn).connect(ac.destination); o.start(); o.stop(ac.currentTime + dur);
  } catch {}
}
const SFX = { hop: () => beep(520, 0.04), dice: () => beep(220 + Math.random() * 200, 0.03, "triangle"), coin: () => { beep(988, 0.07); setTimeout(() => beep(1319, 0.1), 70); },
  bad: () => { beep(220, 0.12, "sawtooth"); setTimeout(() => beep(160, 0.16, "sawtooth"), 110); }, build: () => { beep(660, 0.06); setTimeout(() => beep(880, 0.08), 60); setTimeout(() => beep(1100, 0.1), 130); },
  win: () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.14), i * 140)),
  // online: tin chat mới, người vào / rời phòng, tới lượt mình, ván bắt đầu
  msg: () => { beep(1175, 0.05, "triangle", 0.04); setTimeout(() => beep(1568, 0.07, "triangle", 0.04), 60); },
  join: () => { beep(440, 0.06, "triangle"); setTimeout(() => beep(660, 0.08, "triangle"), 80); },
  leave: () => { beep(523, 0.07, "triangle"); setTimeout(() => beep(330, 0.1, "triangle"), 90); },
  turn: () => { beep(784, 0.06); setTimeout(() => beep(1047, 0.09), 90); },
  start: () => [392, 523, 659].forEach((f, i) => setTimeout(() => beep(f, 0.1), i * 110)) };
$("#mute").textContent = muted ? "🔇" : "🔊";
$("#mute").onclick = () => { muted = !muted; localStorage.setItem("wgp.muted", muted ? "1" : "0"); $("#mute").textContent = muted ? "🔇" : "🔊"; };

// ---------- Bàn ----------
let RECTS = null; // board.tiles trong manifest
const boardEl = $("#board");
const tileEls = [];
async function loadManifest() {
  const m = await fetch("assets/asset-manifest.json").then((r) => r.json());
  RECTS = m.board.tiles;
  if (RECTS.length !== TILES.length) console.error("Manifest có", RECTS.length, "ô, logic có", TILES.length);
  const c = m.board.centerCourt, cs = document.querySelector(".court").style;
  Object.assign(cs, { left: pct(c.x), top: pct(c.y), width: pct(c.width), height: pct(c.height) });
}
function buildBoard() {
  RECTS.forEach((r) => {
    const t = TILES[r.id], el = document.createElement("div");
    el.className = "tile"; el.tabIndex = 0; el.dataset.i = r.id;
    Object.assign(el.style, { left: pct(r.x), top: pct(r.y), width: pct(r.width), height: pct(r.height) });
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", t.name + (t.price ? ", giá " + K(t.price) : ""));
    if (t.type === "property") {
      el.classList.add("prop"); if (r.width > r.height) el.classList.add("wide");
      el.innerHTML = `<span class="band" style="background:${REGIONS[t.region].color}"></span><span class="nm">${t.short}</span><span class="bld"></span><span class="pr">${t.price}K</span>`;
    }
    el.onclick = () => showInfo(r.id);
    el.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); showInfo(r.id); } };
    boardEl.appendChild(el); tileEls[r.id] = el;
  });
}
// Vị trí quân: tâm ô theo manifest, lệch 2×2 khi nhiều quân cùng ô.
const OFF = [[-16, -4], [16, -4], [-16, 22], [16, 22]];
function tokenXY(tile, k) {
  const r = RECTS[tile], [ox, oy] = OFF[k];
  return [r.center[0] + ox, r.center[1] + oy + 6];
}

// ---------- Trạng thái UI ----------
let g = null, setup = { token: 0, n: 4 }, shown = [], shownCash = [], busy = false, timer = null, timeLeft = 0;
const tokEls = [];
// Online: mode "online" khi đã vào phòng. room = góc nhìn mới nhất máy chủ gửi; g = room.game (đã gắn p.bot = "không phải mình").
let mode = "solo", room = null, net = null, chat = null, curGid = 0, lastSeq = -1, queue = [], pumping = false, sent = false;
const turnSec = () => (mode === "online" ? ONLINE_TURN_SECONDS : TURN_SECONDS);
const myIdx = () => (mode === "online" ? room.you : g.players.findIndex((p) => !p.bot));

function renderPlayers() {
  g.players.forEach((p, k) => {
    const el = $("#pc" + k), tk = TOKENS[p.token];
    el.hidden = false; el.style.setProperty("--pc", tk.color);
    el.classList.toggle("turn", g.phase !== "over" && g.turn === k);
    el.classList.toggle("out", p.bankrupt);
    const lands = ownedBy(g, p.id).length;
    const rp = mode === "online" && room ? room.players[k] : null;
    const status = rp ? (rp.left ? '<span class="off">Đã rời</span>' : !rp.connected ? '<span class="off">Mất kết nối</span>' : "") : "";
    el.innerHTML = `<i class="tok spr tk tk${p.token}" aria-hidden="true"></i>
      <span class="nm">${esc(p.name)}${mode === "online" && k === room.you ? " (Bạn)" : ""} · ${tk.name}</span>
      <span class="cash"><i class="ic ic-money" aria-hidden="true"></i>${p.bankrupt ? "Phá sản" : K(shownCash[k] ?? p.cash)}</span>
      <span class="meta"><span title="Số ô đất">🏠 ${lands} ô</span><span title="Tổng tài sản">💰 ${K(p.bankrupt ? 0 : netWorth(g, p.id))}</span>${p.jailed ? '<i class="ic ic-jail" title="Đang ở tù"></i>' : ""}${status}</span>
      ${g.turn === k && (mode === "online" || !p.bot) && g.phase !== "over" && timeLeft > 0 ? `<span class="timer" style="width:${Math.min(100, timeLeft / turnSec() * 100)}%"></span>` : ""}`;
  });
  for (let k = g.players.length; k < 4; k++) $("#pc" + k).hidden = true;
}
function flashDelta(k, amt) {
  if (!amt) return;
  const d = document.createElement("span");
  d.className = "delta " + (amt > 0 ? "up" : "down"); d.textContent = (amt > 0 ? "+" : "") + K(amt);
  $("#pc" + k).appendChild(d); setTimeout(() => d.remove(), 1300);
}
function renderTiles() {
  for (const i in g.props) {
    const el = tileEls[i], pr = g.props[i];
    el.classList.toggle("owned", pr.owner != null);
    const bld = el.querySelector(".bld"); bld.innerHTML = "";
    if (pr.owner != null) {
      el.style.setProperty("--oc", TOKENS[g.players[pr.owner].token].color);
      bld.innerHTML = pr.level ? `<i class="spr bd bd${pr.level}"></i>` : `<i class="spr bd bdF"></i>`;
      el.querySelector(".pr").textContent = rentOf(g, +i) + "K";
      el.setAttribute("aria-label", `${TILES[i].name}, chủ ${g.players[pr.owner].name}, ${LEVEL_NAMES[pr.level]}, thuê ${K(rentOf(g, +i))}`);
    } else {
      el.querySelector(".pr").textContent = TILES[i].price + "K";
      el.setAttribute("aria-label", `${TILES[i].name}, đất trống, giá ${K(TILES[i].price)}`);
    }
  }
}
function placeTokens() {
  const groups = {};
  g.players.forEach((p, k) => {
    const el = tokEls[k]; el.hidden = p.bankrupt;
    if (p.bankrupt) return;
    const pos = shown[k], slot = (groups[pos] = (groups[pos] ?? -1) + 1);
    const [x, y] = tokenXY(pos, slot % 4);
    el.style.left = pct(x); el.style.top = pct(y);
    el.style.zIndex = 4 + Math.round(y / 10);
  });
}
function setDice(d, rolling) {
  [0, 1].forEach((i) => {
    const el = $("#d" + i), f = (d ? d[i] : i + 1) - 1;
    el.style.backgroundPosition = `${(f % 5) * 25}% ${f >= 5 ? 100 : 0}%`;
    el.classList.toggle("rolling", !!rolling);
  });
}
const nameOf = (pid) => `<b style="color:${TOKENS[g.players[pid].token].color}">${esc(g.players[pid].name)}</b>`;
const news = (html) => { $("#news").innerHTML = html; };

function renderAll() {
  shownCash = g.players.map((p) => p.cash);
  $("#round").textContent = `Vòng ${g.round}/${g.rules.maxRounds}`;
  renderPlayers(); renderTiles(); placeTokens(); renderActions();
}

// ---------- Nút hành động ----------
function renderActions() {
  const box = $("#actions"); box.innerHTML = "";
  if (!g || g.phase === "over") return;
  const p = current(g);
  $("#who").innerHTML = p.bot ? `Lượt ${nameOf(p.id)}…` : mode === "online" ? "Tới lượt bạn!" : `Lượt của ${nameOf(p.id)}!`;
  if (busy) return;
  if (p.bot || sent) { if (mode === "online") startTimer(); return; }
  const btn = (label, cls, fn) => { const b = document.createElement("button"); b.className = "btn " + cls; b.innerHTML = label; b.onclick = () => { if (!busy) fn(); }; box.appendChild(b); return b; };
  if (g.phase === "roll") {
    btn("🎲 Gieo xúc xắc", "btn--primary btn--big", humanRoll).focus({ preventScroll: true });
    if (p.jailed) { const b = btn(`Nộp ${g.rules.jailFine}K ra tù`, "", humanJail); b.disabled = p.cash < g.rules.jailFine; }
  } else if (g.phase === "decide") {
    const { type, tile, cost } = g.pending, t = TILES[tile];
    news(type === "buy" ? `Mua <b>${t.name}</b> giá ${K(cost)}? Thuê khởi điểm ${K(baseRent(t.price, 0))}.`
      : `Nâng <b>${t.name}</b> lên <b>${LEVEL_NAMES[g.props[tile].level + 1]}</b> giá ${K(cost)}? Thuê → ${K(baseRent(t.price, g.props[tile].level + 1) * (ownsRegion(g, p.id, t.region) ? 2 : 1))}.`);
    btn(type === "buy" ? `Mua ${K(cost)}` : `Nâng cấp ${K(cost)}`, "btn--primary", () => humanDecide(true));
    btn("Bỏ qua", "", () => humanDecide(false));
  }
  startTimer();
}

function startTimer() {
  stopTimer();
  let warned = false;
  if (mode === "online") { // hạn do máy chủ đặt (đã gồm thời gian hoạt ảnh); hết giờ máy chủ tự làm thay, client chỉ hiển thị
    const left = () => Math.max(0, (room.deadline - (Date.now() + (room.skew || 0))) / 1000);
    if (!room.deadline) return renderPlayers();
    timeLeft = left();
    timer = setInterval(() => {
      timeLeft = left();
      const bar = $(`#pc${g.turn} .timer`); if (bar) bar.style.width = Math.min(100, timeLeft / ONLINE_TURN_SECONDS * 100) + "%";
      if (g.turn === room.you && timeLeft <= 3 && !warned) { warned = true; SFX.dice(); } // còn 3 giây
      if (timeLeft <= 0) stopTimer();
    }, 250);
    return renderPlayers();
  }
  timeLeft = TURN_SECONDS;
  timer = setInterval(() => {
    timeLeft -= 0.25;
    if (timeLeft <= 3 && !warned) { warned = true; SFX.dice(); } // còn 3 giây là máy tự đi thay
    const bar = $(`#pc${g.turn} .timer`); if (bar) bar.style.width = (timeLeft / TURN_SECONDS * 100) + "%";
    if (timeLeft <= 0) {
      stopTimer();
      if (g.phase === "roll") humanRoll();
      else if (g.phase === "decide") humanDecide(current(g).cash - g.pending.cost >= 0 && botWants(g));
    }
  }, 250);
  renderPlayers();
}
function stopTimer() { if (timer) clearInterval(timer); timer = null; timeLeft = 0; }

// Online: chỉ gửi ý định lên máy chủ; kết quả (xúc xắc, tiền, ô) về qua trạng thái mới.
function netAct(o) { if (net.send(o)) { sent = true; renderActions(); } }
function humanRoll() { if (g.phase !== "roll") return; if (mode === "online") return netAct({ t: "roll" }); stopTimer(); roll(g); play(drainEvents(g)); }
function humanDecide(yes) { if (mode === "online") return netAct({ t: "decide", yes: !!yes }); stopTimer(); decide(g, yes); play(drainEvents(g)); }
function humanJail() { if (mode === "online") return netAct({ t: "jail" }); payJail(g); play(drainEvents(g)); }

// ---------- Phát sự kiện ----------
let epoch = 0; // tăng khi dọn bàn (rời phòng / về phòng chờ) → hoạt ảnh đang phát dừng ngay
async function play(events) {
  const ep = epoch;
  busy = true; renderActions();
  for (const e of events) {
    if (ep !== epoch) return;
    try { await playOne(e); } catch (err) { if (ep === epoch) throw err; return; } // bàn đã dọn giữa chừng → bỏ phần còn lại
  }
  if (ep !== epoch) return;
  busy = false;
  renderAll();
  if (g.phase === "over") return showEnd();
  if (mode === "solo" && current(g).bot) { await sleep(450); botStep(g); play(drainEvents(g)); }
}
function syncCash(e) {
  if (!e.cash) return;
  const d = e.cash.map((c, k) => c - shownCash[k]);
  shownCash = e.cash.slice(); renderPlayers();
  d.forEach((v, k) => flashDelta(k, v));
}
async function playOne(e) {
  const p = e.pid != null ? g.players[e.pid] : null;
  switch (e.type) {
    case "roll": {
      $("#who").innerHTML = `${nameOf(e.pid)} gieo xúc xắc`;
      for (let i = 0; i < 7; i++) { setDice([1 + (Math.random() * 6 | 0), 1 + (Math.random() * 6 | 0)], true); SFX.dice(); await sleep(70); }
      setDice(e.dice, false);
      news(`${nameOf(e.pid)} gieo được <b>${e.dice[0]} + ${e.dice[1]} = ${e.dice[0] + e.dice[1]}</b>${e.dice[0] === e.dice[1] ? " (đôi!)" : ""}`);
      await sleep(350); break;
    }
    case "move":
      for (const pos of e.path) {
        shown[e.pid] = pos; placeTokens();
        const el = tokEls[e.pid]; el.classList.remove("hop"); void el.offsetWidth; el.classList.add("hop");
        SFX.hop(); await sleep(150);
      }
      await sleep(120); break;
    case "jump": shown[e.pid] = e.to; placeTokens(); SFX.hop(); await sleep(400); break;
    case "passStart": syncCash(e); SFX.coin(); news(`${nameOf(e.pid)} qua <b>Xuất Phát</b>, lụm +${K(e.amt)}`); await sleep(650); break;
    case "buy": syncCash(e); hlTile(e.tile); SFX.coin(); news(`${nameOf(e.pid)} vừa thâu tóm <b>${TILES[e.tile].name}</b>!`); renderTiles(); await sleep(800); break;
    case "upgrade": syncCash(e); hlTile(e.tile); SFX.build(); news(`${nameOf(e.pid)} xây <b>${LEVEL_NAMES[e.level]}</b> ở ${TILES[e.tile].name}`); renderTiles(); await sleep(800); break;
    case "skip": news(`${nameOf(e.pid)} bỏ qua ${TILES[e.tile].name}`); await sleep(450); break;
    case "cantAfford": news(`${nameOf(e.pid)} không đủ tiền ở ${TILES[e.tile].name}`); await sleep(700); break;
    case "rent": hlTile(e.tile); news(`${nameOf(e.pid)} trả <b>${K(e.amt)}</b> tiền thuê cho ${nameOf(e.to)}`); SFX.bad(); await sleep(250); break;
    case "pay": syncCash(e); await sleep(e.to != null ? 600 : 400); break;
    case "gain": syncCash(e); SFX.coin(); await sleep(300); break;
    case "bonus": syncCash(e); SFX.coin(); news(`${nameOf(e.pid)} nghỉ chân Bến Xe, nhận thưởng +${K(e.amt)}`); await sleep(800); break;
    case "card": await showCard(e, p); break;
    case "note": news(e.text); await sleep(700); break;
    case "jailed": news(`${nameOf(e.pid)} bị tạm giam ở <b>Nhà Tù</b>!`); SFX.bad(); renderPlayers(); await sleep(800); break;
    case "stayJail": news(`${nameOf(e.pid)} không đổ được đôi, ngồi tù thêm (còn ${e.left} lượt)`); await sleep(800); break;
    case "freed": syncCash(e); news(e.how === "paid" ? `${nameOf(e.pid)} nộp ${K(e.amt)} ra tù` : e.how === "double" ? `${nameOf(e.pid)} đổ đôi, ra tù!` : `${nameOf(e.pid)} mãn hạn, ra tù`); await sleep(600); break;
    case "sellHouse": syncCash(e); news(`${nameOf(e.pid)} bán bớt nhà ở ${TILES[e.tile].name} để trả nợ`); renderTiles(); await sleep(600); break;
    case "sellLand": syncCash(e); news(`${nameOf(e.pid)} cầm cố ${TILES[e.tile].name} cho ngân hàng`); renderTiles(); await sleep(600); break;
    case "bankrupt": syncCash(e); SFX.bad(); news(`💥 ${nameOf(e.pid)} <b>PHÁ SẢN!</b>`); renderTiles(); placeTokens(); renderPlayers(); await sleep(1400); break;
    case "round": $("#round").textContent = `Vòng ${e.round}/${g.rules.maxRounds}`; if (e.round >= g.rules.maxRounds - 2) news(`⚠ Vòng <b>${e.round}</b>/${g.rules.maxRounds} — sắp chốt sổ!`); break;
    case "turn": renderPlayers(); if (g.players[e.pid] && !g.players[e.pid].bot) SFX.turn(); break; // tới lượt bạn (cả chơi với máy lẫn online)
  }
}
function hlTile(i) { const el = tileEls[i]; el.classList.remove("hl"); void el.offsetWidth; el.classList.add("hl"); }

// Thẻ Kèo: mặt sau (asset) lật sang mặt trước (HTML).
function showCard(e, p) {
  return new Promise(async (done) => {
    const thom = e.kind === "thom", kc = $("#kcard");
    kc.className = "kcard " + (thom ? "thom" : "thoi");
    $("#kTitle").textContent = thom ? "Kèo Thơm" : "Kèo Thối";
    $("#kText").textContent = e.text;
    $("#kAmt").textContent = g.players[e.pid].name;
    $("#cardOv").hidden = false; $("#kOk").hidden = true;
    const ep = epoch;
    await sleep(500); if (ep !== epoch || !g) { $("#cardOv").hidden = true; return done(); }
    kc.classList.add("flip"); (thom ? SFX.coin : SFX.bad)();
    news(`${nameOf(e.pid)} rút <b>${thom ? "Kèo Thơm" : "Kèo Thối"}</b>: ${e.text}`);
    const close = () => { $("#cardOv").hidden = true; done(); };
    if (p.bot || mode === "online") { await sleep(1700); close(); } // online: tự đóng để không lệch nhịp cả phòng
    else { $("#kOk").hidden = false; $("#kOk").focus(); $("#kOk").onclick = close; }
  });
}

// Chi tiết ô
function showInfo(i) {
  const t = TILES[i], box = $("#info");
  let html = `<h2>${t.name}</h2>`;
  if (t.type === "property") {
    const pr = g ? g.props[i] : { owner: null, level: 0 }, mono = g && pr.owner != null && ownsRegion(g, pr.owner, t.region);
    html += `<p class="sub">${REGIONS[t.region].name} · giá ${K(t.price)} · nâng cấp ${K(upgradeCost(t.price))}/cấp</p><div class="regband" style="background:${REGIONS[t.region].color}"></div>
      <table>${LEVEL_NAMES.map((n, l) => `<tr class="${pr.owner != null && pr.level === l ? "cur" : ""}"><td>${n}</td><td>${K(baseRent(t.price, l) * (mono ? 2 : 1))}</td></tr>`).join("")}</table>
      <p class="sub">${pr.owner != null ? `Chủ: ${esc(g.players[pr.owner].name)}${mono ? " · độc quyền vùng, thuê x2" : ""}` : "Đất trống — đủ 4 ô cùng vùng thì thuê x2."}</p>`;
  } else {
    const desc = { start: `Đi qua nhận +${RULES.passStart}K.`, jail: `Tạm giam tối đa ${RULES.maxJailTries} lượt. Đổ đôi hoặc nộp ${RULES.jailFine}K để ra sớm.`,
      bus: "Nghỉ chân miễn phí, nhận thưởng ngẫu nhiên 20K–100K.", "go-to-jail": "Bị bắt quả tang! Vào thẳng Nhà Tù.",
      "keo-thom": "Rút thẻ Kèo Thơm: thưởng đột xuất.", "keo-thoi": "Rút thẻ Kèo Thối: nộp phạt, xui xẻo." };
    html += `<p class="sub" style="margin:10px 0 16px">${desc[t.type]}</p>`;
  }
  html += `<button class="btn btn--primary" id="infoOk">Đóng</button>`;
  box.innerHTML = html; $("#infoOv").hidden = false; $("#infoOk").focus();
  $("#infoOk").onclick = () => { $("#infoOv").hidden = true; };
}
$("#infoOv").onclick = (e) => { if (e.target.id === "infoOv") $("#infoOv").hidden = true; };
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") $("#infoOv").hidden = true;
  if ((e.key === " " || e.key === "Enter") && g && !busy && g.phase === "roll" && !current(g).bot && !sent && $("#lobby").hidden && $("#infoOv").hidden && document.activeElement?.tagName !== "BUTTON" && !document.activeElement?.classList.contains("tile")) { e.preventDefault(); humanRoll(); }
});

// Tổng kết
function showEnd() {
  stopTimer();
  const me = g.players[myIdx()], win = g.players[g.winner], iWon = win === me;
  $("#endTitle").textContent = iWon ? "Đại Phú Lụm Kèo!" : `${win.name} là Đại Phú`;
  $("#again").textContent = mode === "online" ? "Về phòng chờ" : "Chơi lại"; $("#endLeave").hidden = mode !== "online";
  $("#endSub").textContent = (g.endReason === "rounds" ? `Hết ${g.rules.maxRounds} vòng — xếp hạng theo tổng tài sản (tiền + đất + nhà).` : "Chỉ còn một người trụ lại, thắng tuyệt đối!")
    + (me.bankrupt && !iWon ? " Bạn đã phá sản." : "");
  $("#rank").innerHTML = g.ranking.map((r, i) => { const p = g.players[r.pid];
    return `<div><span>#${i + 1}</span><i class="spr tk tk${p.token}"></i><span>${esc(p.name)} · ${TOKENS[p.token].name}</span><span class="w">${p.bankrupt ? "Phá sản" : K(r.worth)}</span></div>`; }).join("");
  $("#endOv").hidden = false; $("#again").focus();
  if (iWon) { SFX.win(); confetti(); } else SFX.bad();
}
function confetti() {
  const box = $("#confetti"), cols = ["#ffc94a", "#e0483d", "#3d7be0", "#3fae4a", "#f4ead2"];
  for (let i = 0; i < 70; i++) { const c = document.createElement("i"); c.style.left = Math.random() * 100 + "vw"; c.style.background = cols[i % 5];
    c.style.animationDuration = 1.8 + Math.random() * 1.8 + "s"; c.style.animationDelay = Math.random() * 0.8 + "s"; box.appendChild(c); }
  setTimeout(() => (box.innerHTML = ""), 4500);
}

// ---------- Sảnh ----------
function renderLobby() {
  $("#pick").innerHTML = TOKENS.map((t, i) => `<button style="--pc:${t.color}" aria-pressed="${setup.token === i}" data-t="${i}"><i class="spr tk tk${i}"></i>${t.name}<span style="color:${t.color}">● ${t.seat}</span></button>`).join("");
  $("#pick").querySelectorAll("button").forEach((b) => (b.onclick = () => { setup.token = +b.dataset.t; renderLobby(); }));
  document.querySelectorAll(".seg button").forEach((b) => { b.setAttribute("aria-pressed", +b.dataset.n === setup.n); b.onclick = () => { setup.n = +b.dataset.n; renderLobby(); }; });
}
function buildTokens() {
  tokEls.forEach((el) => el.remove()); tokEls.length = 0;
  const me = myIdx();
  g.players.forEach((p, k) => { const el = document.createElement("i"); el.className = `token spr tk tk${p.token}` + (k === me ? " me" : ""); boardEl.appendChild(el); tokEls[k] = el; });
}
function newGame() {
  stopTimer();
  g = createGame({ players: setup.n, human: setup.token });
  drainEvents(g);
  shown = g.players.map(() => 0);
  buildTokens();
  setDice([1, 2]); news("Gieo xúc xắc để bắt đầu lụm kèo!");
  $("#tagline").textContent = "Lụm Kèo Đại Phú · chơi với máy";
  $("#lobby").hidden = true; $("#endOv").hidden = true;
  renderAll(); SFX.start();
}
function clearBoard() {
  epoch++; stopTimer(); g = null; busy = false; sent = false; queue = []; curGid = 0; lastSeq = -1;
  tokEls.forEach((el) => el.remove()); tokEls.length = 0;
  for (let k = 0; k < 4; k++) $("#pc" + k).hidden = true;
  $("#actions").innerHTML = ""; $("#who").textContent = "Chuẩn bị"; news("Gieo xúc xắc để bắt đầu lụm kèo!");
  $("#endOv").hidden = true; $("#cardOv").hidden = true; $("#round").textContent = `Vòng 1/${RULES.maxRounds}`;
  tileEls.forEach((el, i) => { const t = TILES[i]; if (t.type !== "property") return; el.classList.remove("owned"); el.querySelector(".bld").innerHTML = ""; el.querySelector(".pr").textContent = t.price + "K"; });
}

// ---------- Màn vào phòng / phòng chờ ----------
function lobbyView(which) { // "entry" | "solo" | "room"
  $("#lobby").hidden = false;
  $("#vEntry").hidden = which !== "entry"; $("#vSolo").hidden = which !== "solo"; $("#vRoom").hidden = which !== "room";
  $("#lobbyBtns").hidden = which === "entry";
  $("#backBtn").textContent = which === "room" ? "Rời phòng" : "Quay lại";
}
function setConnecting(on) {
  ["#mkRoom", "#joinRoom", "#goSolo"].forEach((s) => ($(s).disabled = on));
  $("#mkRoom").textContent = on ? "Đang kết nối…" : "Tạo phòng online";
}
function showEntry(msg = "", code = "") {
  mode = "solo"; room = null; chat.show(false); $("#quitBtn").hidden = true; clearBoard(); setConnecting(false);
  $("#tagline").textContent = "Lụm Kèo Đại Phú · 2–4 người";
  $("#entryErr").textContent = msg; if (code) $("#codeIn").value = code;
  lobbyView("entry");
}
function readName() { const n = $("#nmIn").value.trim(); try { localStorage.setItem(NAME_KEY, n); } catch {} return n; }
function showRoom() {
  const v = room, n = v.players.length, host = v.you === v.host;
  lobbyView("room");
  $("#rCode").textContent = v.code;
  $("#rPick").innerHTML = TOKENS.map((t, i) => {
    const k = v.players.findIndex((p) => p.tok === i), p = v.players[k], mine = k === v.you;
    const who = p ? (k === v.host ? "👑 " : "") + esc(p.name) + (mine ? " (Bạn)" : "") : "Trống";
    return `<button type="button" style="--pc:${t.color}" aria-pressed="${mine}" data-t="${i}"${p && !mine ? " disabled" : ""} aria-label="${t.name}: ${p ? esc(p.name) : "chỗ trống, bấm để chọn"}">`
      + `<i class="spr tk tk${i}"></i>${t.name}<span class="who2${p ? "" : " free"}">${who}</span>${p && !p.connected ? '<span class="off">mất kết nối</span>' : ""}</button>`;
  }).join("");
  $("#rPick").querySelectorAll("button").forEach((b) => (b.onclick = () => { if (!b.disabled && b.getAttribute("aria-pressed") !== "true") net.send({ t: "token", tok: +b.dataset.t }); }));
  $("#rNote").textContent = `${n}/4 người trong phòng. ` + (host ? (n < 2 ? "Gửi mã hoặc link mời cho bạn bè — cần ít nhất 2 người." : "Đủ người rồi, bấm Bắt đầu!") : "Đang chờ chủ phòng bấm Bắt đầu…") + " Bấm linh vật trống để đổi quân.";
  $("#start").disabled = !host || n < 2;
  $("#start").textContent = host ? "Bắt đầu" : "Chờ chủ phòng";
}

// ---------- Nhận trạng thái từ máy chủ ----------
// Tiếng vào/rời phòng: so danh sách người chơi lần trước với lần này (không kêu cho chính mình).
function presenceSfx(prev, v) {
  if (!prev || prev.code !== v.code) return;
  let join = false, gone = (prev.players || []).length > (v.players || []).length;
  (v.players || []).forEach((p, i) => {
    if (i === v.you || !p) return;
    const o = prev.players[i];
    if (!o || o.name !== p.name || (!o.connected && p.connected && !p.left)) join = true;
    else if ((o.connected && !p.connected) || (!o.left && p.left)) gone = true;
  });
  if (join) SFX.join(); else if (gone) SFX.leave();
}
function netState(v) {
  const prev = room;
  room = v; chat.render(v); presenceSfx(prev, v);
  if (prev && prev.phase === "lobby" && v.phase !== "lobby") SFX.start(); // ván bắt đầu
  $("#tagline").textContent = "Phòng " + v.code + " · online";
  if (v.phase === "lobby") { if (g) clearBoard(); showRoom(); return; }
  queue.push(v); pump();
}
async function pump() {
  if (pumping) return; pumping = true;
  try {
    while (queue.length) {
      const v = queue.shift(), gv = v.game;
      gv.players.forEach((p) => (p.bot = p.id !== v.you));
      if (!g || v.gid !== curGid) { // ván mới (hoặc vừa nối lại) → dựng lại từ ảnh chụp, không phát hoạt ảnh
        curGid = v.gid; lastSeq = v.seq; g = gv; sent = false;
        buildTokens(); shown = g.players.map((p) => p.pos);
        $("#lobby").hidden = true; $("#endOv").hidden = true;
        setDice(g.dice || [1, 2]); news(v.seq ? "Đã vào lại ván đang chơi." : "Ván mới! Gieo xúc xắc để bắt đầu lụm kèo!");
        renderAll(); if (g.phase === "over") showEnd();
        continue;
      }
      if (v.seq === lastSeq + 1 && v.events.length && !queue.length && !document.hidden) { // nước kế tiếp → phát hoạt ảnh
        lastSeq = v.seq; g = gv; sent = false;
        await play(v.events);
        continue;
      }
      if (v.seq !== lastSeq) { // lệch / dồn gói / tab ẩn → nhảy thẳng tới trạng thái mới
        lastSeq = v.seq; g = gv; sent = false;
        shown = g.players.map((p) => p.pos); if (g.dice) setDice(g.dice);
        renderAll(); if (g.phase === "over") showEnd();
        continue;
      }
      g = gv; renderPlayers(); renderActions(); // cùng nước: chỉ đổi kết nối / hạn giờ / chat
    }
  } finally { pumping = false; }
}

$("#start").onclick = () => (mode === "online" ? net.send({ t: "start" }) : newGame());
$("#backBtn").onclick = () => (mode === "online" ? net.leave() : lobbyView("entry"));
$("#again").onclick = () => {
  if (mode === "online") return net.send({ t: "lobby" });
  $("#endOv").hidden = true; lobbyView("solo"); renderLobby();
};
$("#endLeave").onclick = () => net.leave();
$("#quitBtn").onclick = () => {
  if (room?.phase === "play" && !confirm("Rời ván đang chơi? Máy sẽ đi thay phần của bạn.")) return;
  net.leave();
};
$("#goSolo").onclick = () => { $("#entryErr").textContent = ""; lobbyView("solo"); renderLobby(); };
$("#mkRoom").onclick = () => { $("#entryErr").textContent = ""; setConnecting(true); net.create(readName(), !$("#privateRoom").checked); };
function joinRoom() {
  const code = $("#codeIn").value.trim().toUpperCase();
  if (!CODE_RE.test(code)) { $("#entryErr").textContent = "Mã phòng gồm 5 ký tự (chữ và số), ví dụ K7QX2."; $("#codeIn").focus(); return; }
  $("#entryErr").textContent = ""; setConnecting(true); net.join(code, readName());
}
$("#joinRoom").onclick = joinRoom;
$("#codeIn").addEventListener("keydown", (e) => { e.stopPropagation(); if (e.key === "Enter") joinRoom(); });
$("#nmIn").addEventListener("keydown", (e) => e.stopPropagation());
$("#copyLink").onclick = async () => {
  const u = new URL(location.href); u.search = "?room=" + room.code;
  try { await navigator.clipboard.writeText(u.href); toast("Đã sao chép link mời — gửi cho bạn bè nhé!"); }
  catch { toast("Link mời: " + u.href, 6000); }
};

(async () => {
  await loadManifest();
  buildBoard(); renderLobby(); setDice([5, 6]);
  try { $("#nmIn").value = localStorage.getItem(NAME_KEY) || ""; } catch {}
  chat = createChat({ box: $("#chat"), button: $("#chatBtn"), send: (o) => net.send(o), onNew: () => SFX.msg(),
    colorOf: (name) => { const p = room && room.players.find((x) => x.name === name); return p ? TOKENS[p.tok].color : ""; } });
  net = createNet({
    onJoined: () => { mode = "online"; chat.show(true); $("#quitBtn").hidden = false; setConnecting(false); $("#entryErr").textContent = ""; },
    onState: netState,
    onExit: (msg, code) => showEntry(msg, code),
  });
  showEntry();
  const param = (new URLSearchParams(location.search).get("room") || "").toUpperCase();
  if (net.seat && (!param || param === net.seat.code)) { setConnecting(true); net.resume(); }
  else if (CODE_RE.test(param)) { $("#codeIn").value = param; $("#entryErr").textContent = ""; ($("#nmIn").value ? $("#joinRoom") : $("#nmIn")).focus(); }
  // Hook test: ?seed=…&auto=1 cho kiểm thử tự động.
  window.__cotyphu = { get g() { return g; }, get room() { return room; }, get mode() { return mode; }, get net() { return net; },
    newGame, humanRoll, humanDecide, setFast: (v) => { SPEED = v; } };
})();
