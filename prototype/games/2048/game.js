// 2048 — phần hiển thị + điều khiển. Ô số là phần tử DOM (trượt bằng transform), luật nằm ở logic.js.
import * as L from "./logic.js";

const SAVE_KEY = "wgp.2048.v1";
const ANIM = 100; // ms trượt

// Bảng màu ô theo Art Bible V5: giấy da → cam/đỏ (4 phường) → xanh dương/ngọc/lá/tím → vàng mục tiêu.
// [nền, viền tối, chữ, tầng lấp lánh]
const PAL = {
  2: ["#e9dcc0", "#6d5a3e", "#3a2a14", 0], 4: ["#e3c78f", "#6d5228", "#3a2a14", 0],
  8: ["#e8954a", "#7a3d10", "#fff4e0", 1], 16: ["#e0703d", "#6e2a0c", "#fff4e0", 1],
  32: ["#e0483d", "#651a14", "#fff4e0", 1], 64: ["#a8322b", "#4a0f0b", "#ffe9a8", 1],
  128: ["#3a7bd5", "#163463", "#f4f8ff", 3], 256: ["#2f8f7f", "#0f3a33", "#eafff9", 3],
  512: ["#3f9a45", "#173d1a", "#f2ffe8", 3], 1024: ["#8a5cc2", "#35204f", "#fbf2ff", 3],
  2048: ["#ffc94a", "#5a3a08", "#2c1b05", 4], 4096: ["#6fd0bb", "#0f3a33", "#0b2b25", 4],
  8192: ["#f4ead2", "#5a4632", "#8a5cc2", 4],
};
const BIG = ["#2b2622", "#ffc94a", "#ffc94a", 4];

function makeSfx(dir, names, sdk) {
  const AC = window.AudioContext || window.webkitAudioContext;
  const buf = {}, log = [];
  let ac = null;
  if (AC) {
    try { ac = new AC(); } catch { ac = null; }
    if (ac) for (const n of names) {
      fetch(new URL(dir + n + ".ogg", import.meta.url)).then((r) => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
        .then((b) => ac.decodeAudioData(b)).then((d) => { buf[n] = d; })
        .catch(() => console.warn("Không tải được âm thanh " + n + ".ogg"));
    }
  }
  const muted = () => !!(sdk.sound && sdk.sound.muted);
  return {
    unlock() { if (ac && ac.state === "suspended" && !muted()) ac.resume().catch(() => {}); },
    play(n, vol = 1, rate = 1) {
      if (muted() || !ac || !buf[n]) return false;
      if (ac.state === "suspended") ac.resume().catch(() => {});
      const s = ac.createBufferSource(), gn = ac.createGain();
      s.buffer = buf[n]; s.playbackRate.value = rate; gn.gain.value = vol; s.connect(gn).connect(ac.destination);
      s.start();
      log.push({ n, t: Math.round(performance.now()) });
      if (log.length > 300) log.shift();
      return true;
    },
    get loaded() { return Object.keys(buf).length; },
    log,
    close() { if (ac) ac.close().catch(() => {}); },
  };
}

function loadSave() {
  const d = { size: 4, best: { 3: 0, 4: 0, 5: 0 }, top: { 3: 0, 4: 0, 5: 0 }, games: {} };
  try {
    const v = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (v && typeof v === "object") {
      if (L.SIZES.includes(v.size)) d.size = v.size;
      for (const n of L.SIZES) {
        d.best[n] = Math.max(0, (v.best && v.best[n]) | 0);
        d.top[n] = Math.max(0, (v.top && v.top[n]) | 0);
        if (v.games && v.games[n] && L.deserialize(v.games[n])) d.games[n] = v.games[n];
      }
    }
  } catch { /* dữ liệu hỏng → mặc định */ }
  return d;
}

const fmt = (n) => Math.round(n).toLocaleString("vi-VN");
const fmtTime = (t) => { t = Math.floor(t); const m = Math.floor(t / 60), s = t % 60; return m >= 60 ? `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`; };

export function mount(root, ctx = {}) {
  const sdk = ctx.sdk || { reportScore() {}, gameOver() {}, sound: { muted: false } };
  if (!sdk.sound) sdk.sound = { muted: false };
  const $ = (id) => root.querySelector("#" + id);
  const stage = $("stage"), frame = $("frame"), board = $("board");
  const ov = { menu: $("ovMenu"), win: $("ovWin"), end: $("ovEnd"), confirm: $("ovConfirm") };
  const sfx = makeSfx("assets/sfx/", ["buoc-nhay", "trung-da", "trung-kim-cuong", "qua-man", "thang", "thua", "do-xuc-xac"], sdk);
  let save = loadSave();
  let size = save.size, s = null, startBest = 0, destroyed = false;
  let seedBase = ctx.seed ?? (Date.now() & 0xffffff), games = 0;
  const els = new Map();
  let pending = null, endTimer = 0, raf = 0, last = performance.now(), lastSec = -1;
  let G = { n: 4, cs: 80, gp: 10, st: 90, bw: 370, px: 3 };

  // ---------- Lưu ----------
  function persist() {
    try {
      if (s) {
        save.size = s.size;
        if (s.status === "over") delete save.games[s.size]; else save.games[s.size] = L.serialize(s);
      }
      localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    } catch { /* hết chỗ / chế độ riêng tư */ }
  }

  // ---------- Bố cục: bàn vuông to nhất vừa khung ----------
  function layout() {
    const n = s ? s.size : size;
    const r = stage.getBoundingClientRect();
    const hint = $("hint"), hintH = hint && getComputedStyle(hint).display !== "none" ? 18 : 0;
    const avail = Math.max(120, Math.min(r.width - 14, r.height - 14 - hintH, 640));
    const fr = Math.max(6, Math.min(14, Math.round(avail * 0.025)));
    let bw = avail - 2 * fr - 6;
    const gp = Math.max(5, Math.round(bw * (n === 5 ? 0.02 : 0.025)));
    const cs = Math.floor((bw - gp * (n + 1)) / n);
    const st = cs + gp; bw = st * n + gp;
    const px = Math.max(2, Math.round(cs / 26));
    G = { n, cs, gp, st, bw, px };
    frame.style.setProperty("--fr", fr + "px");
    for (const [k, v] of Object.entries({ cs, gp, st, bw, px })) board.style.setProperty("--" + k, v + "px");
    if (board.dataset.n !== String(n)) {
      board.dataset.n = String(n);
      board.querySelectorAll(".slot").forEach((e) => e.remove());
      for (let i = 0; i < n * n; i++) {
        const d = document.createElement("div");
        d.className = "slot";
        d.style.transform = `translate(calc(${i % n} * var(--st) + var(--gp)), calc(${Math.floor(i / n)} * var(--st) + var(--gp)))`;
        board.prepend(d);
      }
    }
    for (const el of els.values()) setFont(el, +el.dataset.v);
  }
  function setFont(el, v) {
    const d = String(v).length, k = d <= 2 ? 0.46 : d === 3 ? 0.38 : d === 4 ? 0.3 : d === 5 ? 0.25 : 0.21;
    el.style.setProperty("--fs", Math.max(10, Math.round(G.cs * k)) + "px");
  }

  // ---------- Ô ----------
  function makeTile(id, v, at, cls) {
    const el = document.createElement("div");
    const p = PAL[v] || BIG;
    el.className = "tile" + (cls ? " " + cls : "");
    el.dataset.v = v; el.dataset.id = id; el.dataset.t = p[3];
    el.style.setProperty("--tb", p[0]); el.style.setProperty("--td", p[1]); el.style.setProperty("--tc", p[2]);
    el.style.setProperty("--th", p[3] >= 1 ? "rgba(255,255,255,.28)" : "rgba(255,255,255,.45)");
    if (p[3] >= 1) el.style.setProperty("--tsh", "2px 2px 0 rgba(0,0,0,.35)");
    const f = document.createElement("div"); f.className = "face";
    const sp = document.createElement("span"); sp.textContent = v; f.appendChild(sp);
    el.appendChild(f);
    el.setAttribute("aria-label", String(v));
    place(el, at);
    setFont(el, v);
    board.appendChild(el);
    els.set(id, el);
    return el;
  }
  function place(el, at) { el.style.setProperty("--x", at % G.n); el.style.setProperty("--y", Math.floor(at / G.n)); el.dataset.at = at; }
  function syncAll() {
    finishPending();
    for (const el of els.values()) el.remove();
    els.clear();
    board.classList.remove("dead");
    if (!s) return;
    s.cells.forEach((c, i) => { if (c) makeTile(c.id, c.v, i); });
  }

  function burst(at, color) {
    const x = (at % G.n) * G.st + G.gp + G.cs / 2, y = Math.floor(at / G.n) * G.st + G.gp + G.cs / 2;
    for (let i = 0; i < 10; i++) {
      const p = document.createElement("i"); p.className = "part";
      const a = (i / 10) * Math.PI * 2 + Math.random() * 0.4, dist = G.cs * (0.55 + Math.random() * 0.35);
      p.style.cssText = `left:${x}px;top:${y}px;background:${i % 3 ? color : "#fff4e0"};--dx:${Math.round(Math.cos(a) * dist)}px;--dy:${Math.round(Math.sin(a) * dist)}px`;
      board.appendChild(p);
      setTimeout(() => p.remove(), 460);
    }
  }
  // Chữ bay: vị trí đặt qua biến CSS trong transform (không dùng left/top → không reflow),
  // tối đa 3 chữ cùng lúc trên bàn, gỡ khi animation kết thúc (có hẹn giờ dự phòng).
  const floats = [];
  function dropFloat(f) { const k = floats.indexOf(f); if (k >= 0) floats.splice(k, 1); f.remove(); }
  function floatText(at, text) {
    while (floats.length >= 3) dropFloat(floats[0]);
    const f = document.createElement("div"); f.className = "float"; f.textContent = text;
    f.style.setProperty("--fx", Math.round((at % G.n) * G.st + G.gp + G.cs * 0.12) + "px");
    f.style.setProperty("--fy", Math.round(Math.floor(at / G.n) * G.st + G.gp - G.cs * 0.05) + "px");
    f.addEventListener("animationend", () => dropFloat(f), { once: true });
    setTimeout(() => dropFloat(f), 1200);
    floats.push(f);
    board.appendChild(f);
  }
  let gainEl = null;
  function scoreGain(n) {
    // một chữ duy nhất: gộp liên tiếp thì cộng dồn và chạy lại animation thay vì chồng nhiều chữ
    const box = $("scoreBox");
    if (gainEl && gainEl.isConnected) {
      gainEl.dataset.n = n;
      gainEl.textContent = "+" + fmt(+gainEl.dataset.n);
      gainEl.style.animation = "none"; void gainEl.offsetWidth; gainEl.style.animation = "";
      return;
    }
    const g = document.createElement("span"); g.className = "gain"; g.dataset.n = n; g.textContent = "+" + fmt(n);
    g.addEventListener("animationend", () => { g.remove(); if (gainEl === g) gainEl = null; });
    gainEl = g;
    box.appendChild(g);
  }

  // ---------- Một nước đi ----------
  function finishPending() {
    if (!pending) return;
    clearTimeout(pending.timer);
    const p = pending; pending = null;
    finalize(p.r);
  }
  function finalize(r) {
    let best = null;
    for (const m of r.merges) {
      for (const id of m.from) { const e = els.get(id); if (e) e.remove(); els.delete(id); }
      makeTile(m.id, m.v, m.at, "merged pop");
      if (!best || m.v > best.v) best = m;
    }
    if (r.spawned) makeTile(r.spawned.id, r.spawned.v, r.spawned.at, "spawn");
    if (best) {
      if (best.v >= 64) burst(best.at, (PAL[best.v] || BIG)[0]);
      if (r.gained >= 8) floatText(best.at, "+" + fmt(r.gained));
    }
    // dọn class hoạt ảnh để lần sau không chạy lại
    setTimeout(() => { for (const el of els.values()) el.classList.remove("pop", "spawn", "merged"); }, 200);
    hud();
  }
  function doMove(dir) {
    if (!s || s.status !== "playing" || anyOverlay()) return false;
    finishPending();
    const r = L.move(s, dir);
    if (!r) {
      sfx.play("do-xuc-xac", 0.2, 0.7); // không đi được hướng này
      board.classList.remove("shake"); void board.offsetWidth; board.classList.add("shake");
      return false;
    }
    sfx.unlock();
    for (const m of r.moves) { const e = els.get(m.id); if (e) { place(e, m.to); if (r.merges.some((g) => g.from.includes(m.id))) e.classList.add("dying"); } }
    pending = { r, timer: setTimeout(() => { const p = pending; pending = null; if (p) finalize(p.r); }, ANIM) };
    // âm thanh
    const top = r.merges.reduce((a, m) => Math.max(a, m.v), 0);
    if (top >= 128) sfx.play("trung-kim-cuong", 0.55, Math.min(1.4, 0.85 + Math.log2(top) * 0.03));
    else if (top) sfx.play("trung-da", 0.5, 0.9 + Math.min(0.4, r.merges.length * 0.08));
    else sfx.play("buoc-nhay", 0.25, 1.15);
    if (r.gained) scoreGain(r.gained);
    if (s.score > save.best[s.size]) save.best[s.size] = s.score;
    if (s.maxTile > save.top[s.size]) save.top[s.size] = s.maxTile;
    sdk.reportScore && sdk.reportScore(s.score);
    if (r.reachedGoal) {
      clearTimeout(endTimer);
      endTimer = setTimeout(() => { sfx.play("thang", 0.8); showWin(); }, ANIM + 260);
      sfx.play("qua-man", 0.7);
    } else if (r.over) {
      clearTimeout(endTimer);
      setTimeout(() => board.classList.add("dead"), ANIM + 120);
      endTimer = setTimeout(() => { sfx.play("thua", 0.7); showEnd(); }, ANIM + 900);
    }
    persist();
    hud();
    return true;
  }
  function doUndo() {
    if (!s || anyOverlay(["menu", "win", "confirm"])) return false;
    finishPending();
    if (!L.undo(s)) { if (s.undoLeft === 0) { sfx.play("do-xuc-xac", 0.2, 0.7); board.classList.remove("shake"); void board.offsetWidth; board.classList.add("shake"); } return false; }
    clearTimeout(endTimer);
    hide(ov.end);
    syncAll();
    sfx.play("do-xuc-xac", 0.45, 1.1);
    persist(); hud();
    stage.focus({ preventScroll: true });
    return true;
  }

  // ---------- HUD ----------
  const hudCache = {};
  function setText(id, v) { if (hudCache[id] !== v) { hudCache[id] = v; $(id).textContent = v; } }
  function hud() {
    if (!s) return;
    setText("hScore", fmt(s.score));
    setText("hBest", fmt(Math.max(save.best[s.size], s.score)));
    setText("hTop", String(s.maxTile));
    setText("hTopL", ` · mục tiêu ${s.goal}`);
    setText("hMoves", fmt(s.moves));
    setText("hTime", fmtTime(s.time));
    const pct = Math.min(100, Math.round((Math.log2(Math.max(2, s.maxTile)) - 1) / (Math.log2(s.goal) - 1) * 100));
    if (hudCache.fill !== pct) { hudCache.fill = pct; $("hFill").style.width = pct + "%"; $("hBar").classList.toggle("done", pct >= 100); }
    const u = L.canUndo(s);
    $("undoBtn").disabled = !u; $("endUndoBtn").disabled = !u;
    $("endUndoBtn").hidden = s.undoLeft === 0;
    setText("undoN", String(s.undoLeft)); setText("endUndoN", String(s.undoLeft));
  }

  // ---------- Màn hình phủ ----------
  const show = (o) => { o.hidden = false; }, hide = (o) => { o.hidden = true; };
  function anyOverlay(which = ["menu", "win", "end", "confirm"]) { return which.some((k) => !ov[k].hidden); }
  function setMenuMode(on) { document.body.classList.toggle("is-menu", on); }

  function resultRows(el, rows) {
    el.innerHTML = "";
    rows.forEach(([k, v, total]) => {
      const a = document.createElement("span"), b = document.createElement("b");
      a.textContent = k; b.textContent = v; if (total) a.className = "total";
      el.append(a, b);
    });
  }
  function recordBadge(el) {
    el.innerHTML = "";
    if (s.score > startBest && s.score > 0) { const r = document.createElement("span"); r.className = "record"; r.textContent = "★ Kỷ lục mới!"; el.appendChild(r); setTimeout(() => sfx.play("trung-kim-cuong", 0.7, 1.2), 700); } // kỷ lục mới
  }
  function stats() {
    return [["Ô lớn nhất", String(s.maxTile)], ["Nước đi", fmt(s.moves)], ["Lần gộp", fmt(s.merges)], ["Thời gian", fmtTime(s.time)], ["Tổng điểm", fmt(s.score), true]];
  }
  function showWin() {
    const box = $("wTile"); box.innerHTML = "";
    const p = PAL[s.goal] || BIG;
    const t = document.createElement("div"); t.className = "tile"; t.dataset.t = p[3];
    t.style.cssText = `--tb:${p[0]};--td:${p[1]};--tc:${p[2]};--fs:${String(s.goal).length > 3 ? 24 : 30}px;--th:rgba(255,255,255,.3)`;
    t.innerHTML = `<div class="face"><span>${s.goal}</span></div>`;
    box.appendChild(t);
    $("wTitle").textContent = `Đạt ${s.goal}!`;
    $("wSub").textContent = `Bạn đã ghép tới ô mục tiêu trên bàn ${s.size}×${s.size}. Chơi tiếp để lên ô lớn hơn nhé!`;
    resultRows($("wResult"), stats());
    recordBadge($("wRecord"));
    show(ov.win);
    sdk.gameOver && sdk.gameOver({ score: s.score, maxTile: s.maxTile, size: s.size, moves: s.moves, time: Math.round(s.time), result: "goal" });
    persist();
    $("keepBtn").focus({ preventScroll: true });
  }
  function showEnd() {
    $("eTitle").textContent = s.won ? "Kết thúc!" : "Hết nước đi!";
    $("eSub").textContent = s.won ? `Bàn đã kín. Bạn đã vượt mục tiêu ${s.goal} — giỏi lắm!` : "Bàn đã kín, không còn cặp nào gộp được.";
    resultRows($("eResult"), stats());
    recordBadge($("eRecord"));
    hud();
    show(ov.end);
    sdk.gameOver && sdk.gameOver({ score: s.score, maxTile: s.maxTile, size: s.size, moves: s.moves, time: Math.round(s.time), result: "over" });
    persist();
    $("againBtn").focus({ preventScroll: true });
  }

  function renderMenu() {
    root.querySelectorAll(".mode").forEach((b) => { const on = +b.dataset.size === size; b.classList.toggle("on", on); b.setAttribute("aria-checked", on ? "true" : "false"); });
    const g = save.games[size] ? L.deserialize(save.games[size]) : null;
    $("playBtn").textContent = g ? `▶ Chơi tiếp · ${fmt(g.score)} điểm` : "▶ Bắt đầu";
    $("freshBtn").hidden = !g;
    const b = save.best[size], t = save.top[size];
    $("mBest").textContent = b ? `Kỷ lục ${size}×${size}: ${fmt(b)} điểm · ô lớn nhất ${t}` : `Chưa có kỷ lục ở bàn ${size}×${size}.`;
  }
  function showMenu() {
    finishPending(); clearTimeout(endTimer);
    if (s) sfx.play("buoc-nhay", 0.35, 0.8);
    if (s) persist();
    hide(ov.win); hide(ov.end); hide(ov.confirm);
    if (s) size = s.size;
    renderMenu();
    show(ov.menu);
    setMenuMode(true);
    layout();
    $("playBtn").focus({ preventScroll: true });
  }
  function start(fresh) {
    finishPending(); clearTimeout(endTimer);
    const g = !fresh && save.games[size] ? L.deserialize(save.games[size]) : null;
    s = g || L.newGame({ size, seed: (seedBase + games++ * 7919) | 0 });
    startBest = save.best[size];
    hide(ov.menu); hide(ov.win); hide(ov.end); hide(ov.confirm);
    setMenuMode(false);
    for (const k in hudCache) delete hudCache[k];
    layout(); syncAll(); hud(); persist();
    if (s.status === "won") showWin();
    else if (s.status === "over") showEnd();
    sfx.unlock(); sfx.play("qua-man", 0.5);
    stage.focus({ preventScroll: true });
  }
  function askNew() {
    if (!s) return start(true);
    if (s.status === "playing" && s.moves > 0) { show(ov.confirm); $("yesNewBtn").focus({ preventScroll: true }); }
    else start(true);
  }

  // ---------- Âm thanh ----------
  function showMute() {
    root.querySelectorAll(".muteIc").forEach((i) => { i.src = sdk.sound.muted ? "assets/ui/icon-am-thanh-tat.png" : "assets/ui/icon-am-thanh-bat.png"; });
    $("muteTx").textContent = sdk.sound.muted ? "Âm thanh: tắt" : "Âm thanh: bật";
    $("muteBtn").setAttribute("aria-pressed", sdk.sound.muted ? "true" : "false");
  }
  function toggleMute() { sdk.sound.muted = !sdk.sound.muted; try { localStorage.setItem("wgp.muted", sdk.sound.muted ? "1" : "0"); } catch {} showMute(); if (!sdk.sound.muted) sfx.unlock(); }

  // ---------- Điều khiển ----------
  const KEYMAP = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down", a: "left", d: "right", w: "up", s: "down", A: "left", D: "right", W: "up", S: "down" };
  function onKey(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const dir = KEYMAP[e.key];
    if (dir) {
      if (!anyOverlay()) { e.preventDefault(); if (!e.repeat) doMove(dir); }
      return;
    }
    const k = e.key.toLowerCase();
    if (k === "z" || k === "u" || e.key === "Backspace") { if (!ov.end.hidden || !anyOverlay()) { e.preventDefault(); doUndo(); } }
    else if (k === "n") { if (!anyOverlay()) askNew(); }
    else if (k === "m") toggleMute();
    else if (e.key === "Escape") {
      if (!ov.confirm.hidden) { hide(ov.confirm); stage.focus({ preventScroll: true }); }
      else if (ov.menu.hidden && ov.win.hidden) showMenu();
    }
  }

  // Vuốt / kéo trên bàn (chạm, bút, chuột)
  let sw = null;
  function swipeThr() { return Math.max(18, Math.min(42, G.cs * 0.32)); }
  function dirOf(dx, dy) { return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up"); }
  function onDown(e) {
    if (e.target.closest(".ov") || e.button > 0) return;
    sw = { id: e.pointerId, x: e.clientX, y: e.clientY, fired: false };
    try { stage.setPointerCapture(e.pointerId); } catch {}
    sfx.unlock();
    if (e.pointerType === "mouse") stage.focus({ preventScroll: true });
  }
  function onMoveP(e) {
    if (!sw || e.pointerId !== sw.id || sw.fired) return;
    const dx = e.clientX - sw.x, dy = e.clientY - sw.y;
    if (Math.hypot(dx, dy) >= swipeThr() && Math.max(Math.abs(dx), Math.abs(dy)) > 1.2 * Math.min(Math.abs(dx), Math.abs(dy))) {
      sw.fired = true; doMove(dirOf(dx, dy));
    }
  }
  function onUp(e) {
    if (!sw || e.pointerId !== sw.id) return;
    if (!sw.fired) {
      const dx = e.clientX - sw.x, dy = e.clientY - sw.y;
      if (Math.hypot(dx, dy) >= swipeThr() * 0.6) doMove(dirOf(dx, dy));
    }
    sw = null;
  }
  stage.addEventListener("pointerdown", onDown);
  stage.addEventListener("pointermove", onMoveP);
  stage.addEventListener("pointerup", onUp);
  stage.addEventListener("pointercancel", () => { sw = null; });
  // chặn cuộn/kéo trang trên iOS khi vuốt bàn
  const noScroll = (e) => { if (!e.target.closest(".ov")) e.preventDefault(); };
  stage.addEventListener("touchmove", noScroll, { passive: false });
  document.addEventListener("keydown", onKey);

  root.querySelectorAll(".mode").forEach((b) => b.addEventListener("click", () => { size = +b.dataset.size; save.size = size; renderMenu(); persist(); }));
  $("modes").addEventListener("keydown", (e) => {
    const i = L.SIZES.indexOf(size);
    if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); size = L.SIZES[Math.min(2, i + 1)]; }
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); size = L.SIZES[Math.max(0, i - 1)]; }
    else return;
    renderMenu(); root.querySelector(`.mode[data-size="${size}"]`).focus();
  });
  $("playBtn").addEventListener("click", () => start(false));
  $("freshBtn").addEventListener("click", () => start(true));
  $("keepBtn").addEventListener("click", () => { L.keepGoing(s); hide(ov.win); persist(); hud(); if (s.status === "over") showEnd(); else stage.focus({ preventScroll: true }); });
  $("winNewBtn").addEventListener("click", () => start(true));
  $("againBtn").addEventListener("click", () => start(true));
  $("menuBtnE").addEventListener("click", showMenu);
  $("endUndoBtn").addEventListener("click", doUndo);
  $("undoBtn").addEventListener("click", doUndo);
  $("newBtn").addEventListener("click", askNew);
  $("menuBtn").addEventListener("click", showMenu);
  $("yesNewBtn").addEventListener("click", () => start(true));
  $("noNewBtn").addEventListener("click", () => { hide(ov.confirm); stage.focus({ preventScroll: true }); });
  $("muteBtn").addEventListener("click", toggleMute);
  $("muteBtn2").addEventListener("click", toggleMute);

  // Đồng hồ (chỉ chạy khi đang chơi, không có màn phủ, tab đang mở)
  function frameLoop(now) {
    if (destroyed) return;
    const dt = Math.min(0.25, (now - last) / 1000); last = now;
    if (s && s.status === "playing" && !anyOverlay() && !document.hidden) {
      s.time += dt;
      const sec = Math.floor(s.time);
      if (sec !== lastSec) { lastSec = sec; setText("hTime", fmtTime(s.time)); if (sec % 5 === 0) persist(); }
    }
    raf = requestAnimationFrame(frameLoop);
  }
  const onVis = () => { if (document.hidden) persist(); };
  const onResize = () => { board.classList.add("snap"); layout(); requestAnimationFrame(() => board.classList.remove("snap")); };
  document.addEventListener("visibilitychange", onVis);
  window.addEventListener("pagehide", persist);
  window.addEventListener("resize", onResize);
  const ro = window.ResizeObserver ? new ResizeObserver(onResize) : null;
  if (ro) ro.observe(stage);

  // Khởi động: phía sau menu là ván đang lưu (nếu có) hoặc bàn mẫu
  function demoBoard() {
    const n = G.n, vals = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4, 8, 2, 16, 4];
    let id = -1;
    vals.slice(0, n * n).forEach((v, i) => { if ((i * 3) % 5 !== 1) makeTile(id--, v, (i * 7) % (n * n)); });
  }
  {
    const g = save.games[size] ? L.deserialize(save.games[size]) : null;
    layout();
    if (g) { s = g; syncAll(); hud(); s = null; } else demoBoard();
  }
  renderMenu(); showMute();
  raf = requestAnimationFrame(frameLoop);

  return {
    get state() { return s; },
    get layout() { return G; },
    sfx,
    move: doMove, undo: doUndo, start, showMenu,
    resync() { syncAll(); hud(); }, // dùng cho test: vẽ lại sau khi sửa bàn trực tiếp
    tileAt(i) { const el = [...els.values()].find((e) => +e.dataset.at === i && !e.classList.contains("dying")); return el ? el.getBoundingClientRect() : null; },
    destroy() {
      destroyed = true; cancelAnimationFrame(raf); clearTimeout(endTimer); finishPending();
      document.removeEventListener("keydown", onKey); document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("resize", onResize); window.removeEventListener("pagehide", persist);
      if (ro) ro.disconnect(); sfx.close();
    },
  };
}
