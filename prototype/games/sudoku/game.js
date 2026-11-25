// Sudoku — phần hiển thị + điều khiển. Luật chơi, sinh đề, lưu/nạp nằm ở logic.js.
import * as L from "./logic.js?v=daily1";
import * as UI from "../_shared/daily-ui.js?v=name1";

const D = UI.D;
const DAILY_ID = "sudoku";

const SAVE_KEY = "wgp.sudoku.v1";

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
  const d = { diff: "vua", best: {}, wins: {}, games: {} };
  try {
    const v = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (v && typeof v === "object") {
      if (L.DIFFS[v.diff]) d.diff = v.diff;
      for (const k of L.DIFF_IDS) {
        const b = v.best && +v.best[k];
        if (b > 0) d.best[k] = b;
        d.wins[k] = Math.max(0, (v.wins && v.wins[k]) | 0);
        if (v.games && v.games[k] && L.deserialize(v.games[k])) d.games[k] = v.games[k];
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
  const stage = $("stage"), frame = $("frame"), board = $("board"), pad = $("pad"), ctrl = $("ctrl");
  const ov = { menu: $("ovMenu"), win: $("ovWin"), confirm: $("ovConfirm") };
  const sfx = makeSfx("assets/sfx/", ["buoc-nhay", "do-xuc-xac", "het-gio", "trung-da", "trung-kim-cuong", "thang"], sdk);
  let save = loadSave();
  let diff = save.diff, s = null, sel = 40, notesMode = false, destroyed = false, viewOnly = true;
  let seedBase = ctx.seed ?? (Date.now() & 0xffffff), games = 0;
  const G = { cs: 40 };
  // Thử thách hôm nay (?daily=1): một đề "Vừa" cố định theo ngày, chơi 1 lần rồi khoá. Không đụng bản lưu thường.
  const daily = ctx.daily ? { day: D.dayNumber(), seed: 0, panel: null } : null;
  if (daily) daily.seed = D.seedFor(DAILY_ID, daily.day);

  // ---------- Dựng lưới 9 khối × 9 ô ----------
  const cellEls = new Array(81);
  for (let b = 0; b < 9; b++) {
    const box = document.createElement("div"); box.className = "box";
    for (let k = 0; k < 9; k++) {
      const i = (((b / 3) | 0) * 3 + ((k / 3) | 0)) * 9 + (b % 3) * 3 + (k % 3);
      const c = document.createElement("div");
      c.className = "cell"; c.dataset.i = i; c.setAttribute("role", "gridcell");
      c.style.setProperty("--d", L.ROW(i) + L.COL(i));
      cellEls[i] = c; box.appendChild(c);
    }
    board.appendChild(box);
  }
  const padBtns = [];
  for (let d = 1; d <= 9; d++) {
    const b = document.createElement("button");
    b.className = "btn"; b.type = "button"; b.dataset.d = d;
    b.setAttribute("aria-label", "Số " + d);
    b.innerHTML = `${d}<small>9</small>`;
    pad.appendChild(b); padBtns[d] = b;
  }

  // ---------- Lưu ----------
  function persist() {
    if (destroyed) return;
    if (daily) { if (s && !viewOnly && s.status === "playing") D.saveProgress(DAILY_ID, daily.day, L.serialize(s)); return; }
    try {
      save.diff = diff;
      if (s && !viewOnly) {
        if (s.status === "playing") save.games[s.diff] = L.serialize(s);
        else delete save.games[s.diff];
      }
      localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    } catch { /* hết chỗ / chế độ riêng tư */ }
  }

  // ---------- Bố cục ----------
  function layout() {
    const row = getComputedStyle(stage).flexDirection === "row";
    const W = stage.clientWidth, H = stage.clientHeight;
    const fr = W < 420 || H < 420 ? 6 : 10;
    const g1 = 2, g2 = W < 420 || H < 420 ? 4 : 5;
    const gap = parseFloat(getComputedStyle(stage).rowGap) || 12;
    let avail;
    if (row) avail = Math.min(H - 12, W - ctrl.offsetWidth - gap - 10) - fr * 2;
    else avail = Math.min(W - 10, H - ctrl.offsetHeight - gap - 10) - fr * 2;
    const cs = Math.max(20, Math.min(74, Math.floor((avail - 6 * g1 - 2 * g2) / 9)));
    const bw = cs * 9 + 6 * g1 + 2 * g2;
    G.cs = cs; G.bw = bw; G.row = row;
    stage.style.setProperty("--cs", cs + "px");
    stage.style.setProperty("--bw", bw + "px");
    stage.style.setProperty("--fr", fr + "px");
    board.style.setProperty("--g2", g2 + "px");
  }

  // ---------- Vẽ ----------
  let clashSet = new Set();
  function render() {
    if (!s) return;
    clashSet = L.conflicts(s);
    const sv = s.cells[sel] || 0;
    const sr = L.ROW(sel), sc = L.COL(sel), sb = L.BOX(sel);
    const showSel = !viewOnly && s.status === "playing";
    for (let i = 0; i < 81; i++) {
      const c = cellEls[i], v = s.cells[i];
      const given = s.puzzle[i] !== 0, hinted = s.hinted[i] === 1, wrong = L.isWrong(s, i);
      const peer = showSel && i !== sel && (L.ROW(i) === sr || L.COL(i) === sc || L.BOX(i) === sb);
      const same = showSel && sv && v === sv && i !== sel;
      c.classList.toggle("given", given);
      c.classList.toggle("hinted", hinted);
      c.classList.toggle("wrong", wrong);
      c.classList.toggle("clash", clashSet.has(i));
      c.classList.toggle("sel", showSel && i === sel);
      c.classList.toggle("peer", !!peer);
      c.classList.toggle("same", !!same);
      const key = v ? "v" + v : s.notes[i] ? "n" + s.notes[i] + (sv ? "h" + sv : "") : "";
      if (c.dataset.k !== key) {
        c.dataset.k = key;
        if (v) c.innerHTML = `<span>${v}</span>`;
        else if (s.notes[i]) {
          let h = '<div class="nt">';
          for (let d = 1; d <= 9; d++) h += s.notes[i] & (1 << d) ? `<i${d === sv ? ' class="hl"' : ""}>${d}</i>` : "<i></i>";
          c.innerHTML = h + "</div>";
        } else c.textContent = "";
      }
      c.setAttribute("aria-label", `Hàng ${L.ROW(i) + 1} cột ${L.COL(i) + 1}: ${v ? v + (given ? " (cho sẵn)" : wrong ? " (sai)" : "") : "trống"}`);
    }
    hud();
  }
  const setText = (id, t) => { const e = $(id); if (e.textContent !== String(t)) e.textContent = t; };
  function hud() {
    if (!s) return;
    setText("hDiff", L.DIFFS[s.diff].name);
    setText("hMist", s.mistakes);
    $("hMist").classList.toggle("bad", s.mistakes > 0);
    setText("hHints", s.hintsLeft);
    setText("hTime", fmtTime(s.time));
    const filled = s.cells.filter((v, i) => v && v === s.solution[i]).length;
    setText("hFillN", filled + "/81");
    $("hFill").style.setProperty("--p", (filled / 81).toFixed(3));
    $("hBar").classList.toggle("done", filled === 81);
    setText("hBest", save.best[s.diff] ? fmtTime(save.best[s.diff]) : "—");
    const counts = L.digitCounts(s);
    for (let d = 1; d <= 9; d++) {
      const left = 9 - counts[d];
      padBtns[d].disabled = left <= 0;
      padBtns[d].lastChild.textContent = left;
    }
    $("undoBtn").disabled = !L.canUndo(s);
    $("hintBtn").disabled = s.hintsLeft <= 0 || s.status !== "playing";
    setText("hintN", s.hintsLeft);
    $("eraseBtn").disabled = s.status !== "playing" || L.isLocked(s, sel) || (!s.cells[sel] && !s.notes[sel]);
    $("notesBtn").classList.toggle("on", notesMode);
    $("notesBtn").setAttribute("aria-pressed", String(notesMode));
    setText("notesN", notesMode ? "Bật" : "Tắt");
    pad.classList.toggle("notes", notesMode);
  }
  function flashUnits(units) {
    const set = new Set();
    for (const k of units) for (const i of L.UNITS[k]) set.add(i);
    for (const i of set) { const c = cellEls[i]; c.classList.remove("flash"); void c.offsetWidth; c.classList.add("flash"); }
    setTimeout(() => { for (const i of set) cellEls[i].classList.remove("flash"); }, 600);
  }
  function anim(i, cls) {
    const c = cellEls[i]; c.classList.remove("pop", "shake"); void c.offsetWidth; c.classList.add(cls);
    setTimeout(() => c.classList.remove(cls), 300);
  }

  // ---------- Thao tác ----------
  const canPlay = () => s && !viewOnly && s.status === "playing" && !anyOverlay();
  function select(i) {
    if (!s || i < 0 || i > 80) return;
    sel = i;
    render();
  }
  function moveSel(dr, dc) {
    const r = (L.ROW(sel) + dr + 9) % 9, c = (L.COL(sel) + dc + 9) % 9;
    select(r * 9 + c);
  }
  function input(d, asNote = false) {
    if (!canPlay()) return false;
    sfx.unlock();
    if (notesMode !== asNote && !L.isLocked(s, sel) && !s.cells[sel]) {
      const r = L.toggleNote(s, sel, d);
      if (!r) return false;
      sfx.play("do-xuc-xac", 0.18, r.on ? 1.5 : 1.25);
      render(); persist();
      return true;
    }
    if (notesMode !== asNote) return false; // ghi chú vào ô đã có số → bỏ qua
    const r = L.place(s, sel, d);
    if (!r) { if (L.isLocked(s, sel)) { anim(sel, "shake"); sfx.play("do-xuc-xac", 0.25, 0.7); } return false; } // ô đề cho sẵn
    render();
    if (r.wrong) { anim(sel, "shake"); sfx.play("het-gio", 0.35, 1.2); }
    else {
      anim(sel, "pop");
      if (r.units.length) { flashUnits(r.units); sfx.play("trung-da", 0.5, 0.95 + r.units.length * 0.1); }
      else sfx.play("buoc-nhay", 0.3, 1.1);
    }
    if (r.won) onWin();
    persist();
    return true;
  }
  function doErase() {
    if (!canPlay()) return false;
    const r = L.erase(s, sel);
    if (!r) return false;
    sfx.play("do-xuc-xac", 0.2, 0.8);
    render(); persist();
    return true;
  }
  function doHint() {
    if (!canPlay()) return false;
    sfx.unlock();
    const r = L.hint(s, sel);
    if (!r) return false;
    sel = r.i;
    render();
    anim(r.i, "pop");
    sfx.play("trung-kim-cuong", 0.45, 1.1);
    if (r.units.length) flashUnits(r.units);
    if (r.won) onWin();
    persist();
    return true;
  }
  function doUndo() {
    if (!canPlay() || !L.undo(s)) return false;
    sfx.play("do-xuc-xac", 0.25, 0.9);
    render(); persist();
    return true;
  }
  function toggleNotes() {
    if (!s || viewOnly) return;
    notesMode = !notesMode;
    hud();
  }

  // ---------- Thắng ----------
  let winTimer = 0;
  function onWin() {
    if (daily) return onDailyWin();
    const prev = save.best[s.diff] || 0;
    const t = Math.max(1, Math.floor(s.time));
    const isRecord = !prev || t < prev;
    if (isRecord) save.best[s.diff] = t;
    save.wins[s.diff] = (save.wins[s.diff] || 0) + 1;
    delete save.games[s.diff];
    const pts = L.score(s);
    sdk.reportScore && sdk.reportScore(pts);
    sdk.gameOver && sdk.gameOver({ result: "solved", diff: s.diff, time: t, mistakes: s.mistakes, hints: L.HINTS - s.hintsLeft, score: pts });
    board.classList.remove("win"); void board.offsetWidth; board.classList.add("win");
    persist();
    clearTimeout(winTimer);
    winTimer = setTimeout(() => { sfx.play("thang", 0.8); showWin(isRecord, prev, pts); }, 900);
  }
  function onDailyWin() {
    const t = Math.max(1, Math.floor(s.time));
    const hints = L.HINTS - s.hintsLeft;
    // proof: lưới đã giải + ô gợi ý + thời gian ⇒ máy chủ kiểm lại với đề của ngày trước khi ghi lên Bảng xếp hạng hôm nay
    const r = { time: t, mistakes: s.mistakes, hints, proof: { cells: s.cells.join(""), hinted: s.hinted.join(""), time: t, mistakes: s.mistakes, hints } };
    D.record(DAILY_ID, daily.day, r);
    const pts = L.score(s);
    sdk.reportScore && sdk.reportScore(pts);
    sdk.gameOver && sdk.gameOver({ result: "solved", daily: daily.day, diff: s.diff, time: t, mistakes: s.mistakes, hints, score: pts });
    board.classList.remove("win"); void board.offsetWidth; board.classList.add("win");
    viewOnly = true;
    clearTimeout(winTimer);
    winTimer = setTimeout(() => { sfx.play("thang", 0.8); showDaily(); }, 900);
  }
  function showDaily() {
    const res = D.getResult(DAILY_ID, daily.day);
    const perfect = res && res.mistakes === 0 && res.hints === 0;
    if (daily.panel) daily.panel.destroy();
    daily.panel = UI.panel({ game: DAILY_ID, day: daily.day, result: res, title: perfect ? "Hoàn hảo!" : "Giải xong!" });
    render();
  }
  function startDaily() {
    UI.badge(daily.day);
    for (const id of ["newBtn"]) $(id).hidden = true;
    for (const id of ["menuBtn", "menuBtn2"]) { $(id).title = "Chơi thường"; $(id).setAttribute("aria-label", "Về chế độ chơi thường"); }
    $("menuBtn").textContent = "☰ Chơi thường";
    const fresh = L.newGame({ diff: "vua", seed: daily.seed });
    if (D.isDone(DAILY_ID, daily.day)) {
      s = fresh; s.cells = s.solution.slice(); s.status = "won"; viewOnly = true;
      show(null); render(); showDaily();
      return;
    }
    const prog = D.loadProgress(DAILY_ID, daily.day);
    const g = prog && prog.seed === daily.seed && prog.diff === "vua" ? L.deserialize(prog) : null;
    s = g && g.status === "playing" ? g : fresh;
    viewOnly = false; notesMode = false;
    sel = s.cells.findIndex((v) => v === 0); if (sel < 0) sel = 40;
    show(null); render(); persist();
    stage.focus({ preventScroll: true });
  }
  function showWin(isRecord, prev, pts) {
    const D = L.DIFFS[s.diff];
    $("wTitle").textContent = s.mistakes === 0 && s.hintsLeft === L.HINTS ? "Hoàn hảo!" : "Giải xong!";
    $("wSub").textContent = `Đề ${D.name} · ${s.clues} số cho sẵn. Bạn đã điền đúng cả 81 ô.`;
    $("wResult").innerHTML = [
      ["Thời gian", fmtTime(s.time)], ["Lỗi", s.mistakes], ["Gợi ý đã dùng", L.HINTS - s.hintsLeft],
      ["Kỷ lục mức " + D.name, fmtTime(save.best[s.diff])],
    ].map(([a, b]) => `<span>${a}</span><b>${b}</b>`).join("") + `<span class="total">Điểm</span><b>${fmt(pts)}</b>`;
    if (isRecord) setTimeout(() => sfx.play("trung-kim-cuong", 0.7, 1.2), 700); // kỷ lục mới
    $("wRecord").innerHTML = isRecord ? `<span class="record">★ ${prev ? "Kỷ lục mới!" : "Lần đầu giải mức này!"}</span>` : "";
    show("win");
    $("nextBtn").focus({ preventScroll: true });
  }

  // ---------- Menu / ván mới ----------
  function show(name) { for (const k in ov) ov[k].hidden = k !== name; }
  const anyOverlay = () => Object.values(ov).some((o) => !o.hidden);
  function renderMenu() {
    for (const m of root.querySelectorAll(".mode")) {
      const on = m.dataset.diff === diff;
      m.classList.toggle("on", on); m.setAttribute("aria-checked", String(on));
    }
    for (const r of root.querySelectorAll("[data-rec]")) {
      const k = r.dataset.rec, b = save.best[k];
      r.textContent = b ? `Kỷ lục ${fmtTime(b)} · giải ${save.wins[k]} đề` : save.games[k] ? "Đang giải dở" : "Chưa giải";
    }
    const g = save.games[diff] && L.deserialize(save.games[diff]);
    if (g) {
      const left = g.cells.filter((v, i) => v !== g.solution[i]).length;
      $("playBtn").textContent = `▶ Giải tiếp (${fmtTime(g.time)})`;
      $("freshBtn").hidden = false;
      $("mBest").textContent = `Đề ${L.DIFFS[diff].name} đang giải dở: còn ${left} ô, ${g.mistakes} lỗi.`;
    } else {
      $("playBtn").textContent = "▶ Bắt đầu";
      $("freshBtn").hidden = true;
      $("mBest").textContent = save.best[diff] ? `Kỷ lục mức ${L.DIFFS[diff].name}: ${fmtTime(save.best[diff])}.` : `Chưa có kỷ lục ở mức ${L.DIFFS[diff].name}.`;
    }
  }
  function showMenu() {
    if (daily) { persist(); location.href = "./"; return; }
    if (s) sfx.play("buoc-nhay", 0.35, 0.8);
    persist();
    clearTimeout(winTimer);
    // xem trước đề đang giải dở (hoặc đề mẫu) phía sau menu
    if (!s || s.status !== "playing" || s.diff !== diff) preview();
    renderMenu();
    show("menu");
    $("playBtn").focus({ preventScroll: true });
  }
  function preview() {
    const g = save.games[diff] && L.deserialize(save.games[diff]);
    s = g || L.newGame({ diff, seed: 20261117 });
    viewOnly = true; notesMode = false;
    board.classList.remove("win");
    render();
  }
  function start(fresh) {
    sfx.unlock(); sfx.play("buoc-nhay", 0.5, 1.25);
    clearTimeout(winTimer);
    const g = !fresh && save.games[diff] && L.deserialize(save.games[diff]);
    if (g) s = g;
    else { s = L.newGame({ diff, seed: (seedBase + games * 7919 + L.DIFF_IDS.indexOf(diff) * 104729) | 0 }); games++; }
    viewOnly = false; notesMode = false;
    sel = s.cells.findIndex((v) => v === 0);
    if (sel < 0) sel = 40;
    board.classList.remove("win");
    for (const c of cellEls) c.dataset.k = "?";
    show(null);
    render();
    persist();
    stage.focus({ preventScroll: true });
  }
  function askNew() {
    if (daily) return;
    if (!s || viewOnly || s.status !== "playing" || s.moves === 0) { start(true); return; }
    show("confirm");
    $("noNewBtn").focus({ preventScroll: true });
  }

  // ---------- Âm thanh ----------
  function showMute() {
    const m = !!sdk.sound.muted;
    for (const ic of root.querySelectorAll(".muteIc")) ic.src = "assets/ui/" + (m ? "icon-am-thanh-tat.png" : "icon-am-thanh-bat.png");
    $("muteTx").textContent = m ? "Âm thanh: tắt" : "Âm thanh: bật";
    $("muteBtn").setAttribute("aria-pressed", String(m));
  }
  function toggleMute() {
    sdk.sound.muted = !sdk.sound.muted;
    try { localStorage.setItem("wgp.muted", sdk.sound.muted ? "1" : "0"); } catch {}
    showMute();
    if (!sdk.sound.muted) sfx.unlock();
  }

  // ---------- Sự kiện ----------
  const on = (el, ev, fn, opt) => { el.addEventListener(ev, fn, opt); offs.push(() => el.removeEventListener(ev, fn, opt)); };
  const offs = [];
  on(board, "pointerdown", (e) => {
    const c = e.target.closest(".cell");
    if (!c || !canPlay()) return;
    e.preventDefault();
    sfx.unlock();
    select(+c.dataset.i);
    stage.focus({ preventScroll: true });
  });
  on(pad, "click", (e) => {
    const b = e.target.closest("button[data-d]");
    if (b) input(+b.dataset.d, false);
  });
  on($("undoBtn"), "click", doUndo);
  on($("eraseBtn"), "click", doErase);
  on($("notesBtn"), "click", toggleNotes);
  on($("hintBtn"), "click", doHint);
  on($("newBtn"), "click", askNew);
  on($("menuBtn"), "click", showMenu);
  on($("menuBtn2"), "click", showMenu);
  on($("muteBtn"), "click", toggleMute);
  on($("muteBtn2"), "click", toggleMute);
  on($("playBtn"), "click", () => start(false));
  on($("freshBtn"), "click", () => start(true));
  on($("nextBtn"), "click", () => start(true));
  on($("menuBtnW"), "click", showMenu);
  on($("yesNewBtn"), "click", () => start(true));
  on($("noNewBtn"), "click", () => { show(null); stage.focus({ preventScroll: true }); });
  on($("modes"), "click", (e) => {
    const m = e.target.closest(".mode");
    if (!m) return;
    diff = m.dataset.diff;
    preview(); renderMenu(); persist();
  });
  on(window, "keydown", (e) => {
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    const k = e.key, code = e.code || "";
    if (k === "m" || k === "M") { toggleMute(); e.preventDefault(); return; }
    if (k === "Escape") {
      if (!ov.confirm.hidden) { show(null); stage.focus({ preventScroll: true }); }
      else if (ov.menu.hidden && !daily) showMenu();
      e.preventDefault(); return;
    }
    if (anyOverlay()) return;
    const dig = /^(Digit|Numpad)([0-9])$/.exec(code);
    const dv = dig ? +dig[2] : /^[0-9]$/.test(k) ? +k : -1;
    if (dv >= 1) { input(dv, e.shiftKey); e.preventDefault(); return; }
    if (dv === 0 || k === "Backspace" || k === "Delete") { doErase(); e.preventDefault(); return; }
    if ((e.ctrlKey || e.metaKey) && (k === "z" || k === "Z")) { doUndo(); e.preventDefault(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const mv = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1], KeyW: [-1, 0], KeyS: [1, 0], KeyA: [0, -1], KeyD: [0, 1] }[k.startsWith("Arrow") ? k : code];
    if (mv && canPlay()) { moveSel(...mv); e.preventDefault(); return; }
    if (k === "n" || k === "N") { toggleNotes(); e.preventDefault(); return; }
    if (k === "h" || k === "H") { doHint(); e.preventDefault(); return; }
    if (k === "z" || k === "Z" || k === "u" || k === "U") { doUndo(); e.preventDefault(); }
  });
  on(document, "visibilitychange", () => { if (document.hidden) persist(); });
  on(window, "pagehide", persist);
  const ro = new ResizeObserver(() => layout());
  ro.observe(stage);
  offs.push(() => ro.disconnect());

  // ---------- Đồng hồ ----------
  let last = performance.now(), lastSave = 0, raf = 0;
  function frameLoop(now) {
    const dt = Math.min(0.25, (now - last) / 1000); last = now;
    if (s && !viewOnly && s.status === "playing" && !anyOverlay() && !document.hidden) {
      s.time += dt;
      setText("hTime", fmtTime(s.time));
      lastSave += dt;
      if (lastSave > 5) { lastSave = 0; persist(); }
    }
    raf = requestAnimationFrame(frameLoop);
  }
  raf = requestAnimationFrame(frameLoop);

  // ---------- Khởi động ----------
  showMute();
  layout();
  if (daily) startDaily();
  else {
    showMenu();
    const dl = $("dailyLink");
    if (dl) { const n = D.dayNumber(); dl.textContent = D.isDone(DAILY_ID, n) ? `★ Thử thách #${n} · đã xong ✓` : `★ Thử thách hôm nay #${n}`; }
  }

  return {
    get state() { return s; },
    get sel() { return sel; },
    get notesMode() { return notesMode; },
    get layout() { return { ...G }; },
    get daily() { return daily ? { day: daily.day, seed: daily.seed } : null; },
    sfx,
    select, input, erase: doErase, hint: doHint, undo: doUndo, toggleNotes, start, showMenu,
    setDiff(d) { if (L.DIFFS[d]) { diff = d; renderMenu(); } },
    resync() { for (const c of cellEls) c.dataset.k = "?"; render(); },
    persist,
    destroy() { destroyed = true; cancelAnimationFrame(raf); clearTimeout(winTimer); for (const f of offs) f(); sfx.close(); },
  };
}
