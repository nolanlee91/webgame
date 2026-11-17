// Cờ Caro — phần vẽ (canvas), điều khiển, HUD, âm thanh, lưu ván. Luật chơi ở logic.js, máy chơi ở ai.js.
import { newMatch, newRound, nextRound, play, undo, replay, canPlay, isAiTurn, other } from "./logic.js";
import { bestMove } from "./ai.js";

const SAVE_KEY = "wgp.caro.v1";
const C = {
  frame: "#6b4426", frameHi: "#93623a", frameD: "#3e2412", line: "#0a0807",
  paperA: "#ecdfbd", paperB: "#e4d5ae", grid: "#b49d6e", star: "#7a6440",
  gold: "#ffc94a", goldD: "#a8741a",
  x: "#e0483d", xHi: "#ff8f84", xD: "#5a1410",
  o: "#3f8be0", oHi: "#9cc8ff", oD: "#122e57",
};
// Quân vẽ bằng mặt nạ pixel 9×9 (placeholder do code vẽ — có thể thay bằng ảnh mà không đổi luật).
const MASK = {
  1: ["XX.....XX", "XXX...XXX", ".XXX.XXX.", "..XXXXX..", "...XXX...", "..XXXXX..", ".XXX.XXX.", "XXX...XXX", "XX.....XX"],
  2: ["..XXXXX..", ".XXXXXXX.", "XXX...XXX", "XX.....XX", "XX.....XX", "XX.....XX", "XXX...XXX", ".XXXXXXX.", "..XXXXX.."],
};
const PAL = { 1: [C.x, C.xHi, C.xD], 2: [C.o, C.oHi, C.oD] };
const SYM = { 1: "X", 2: "O" };
const DIR_NAME = (line) => {
  const [a, b] = [line[0], line[1]];
  return a[0] === b[0] ? "hàng ngang" : a[1] === b[1] ? "hàng dọc" : "đường chéo";
};

function pieceSvg(p) {
  const [c, hi, d] = PAL[p];
  let r = "";
  MASK[p].forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch !== "X") return;
    r += `<rect x="${x + 1}" y="${y + 1}" width="1" height="1" fill="${d}"/>`;
  }));
  MASK[p].forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch !== "X") return;
    const top = y === 0 || MASK[p][y - 1][x] !== "X";
    r += `<rect x="${x}" y="${y}" width="1" height="1" fill="${top ? hi : c}"/>`;
  }));
  return `<svg viewBox="0 0 10 10" shape-rendering="crispEdges" aria-hidden="true" width="100%" height="100%">${r}</svg>`;
}

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
    play(n, vol = 1) {
      if (muted() || !ac || !buf[n]) return false;
      if (ac.state === "suspended") ac.resume().catch(() => {});
      const s = ac.createBufferSource(), gn = ac.createGain();
      s.buffer = buf[n]; gn.gain.value = vol; s.connect(gn).connect(ac.destination); s.start();
      log.push({ n, t: Math.round(performance.now()) }); if (log.length > 500) log.shift();
      return true;
    },
    get loaded() { return Object.keys(buf).length; },
    log,
    close() { if (ac) ac.close().catch(() => {}); },
  };
}

const DEFAULT_OPTS = { mode: "pvp", aiLevel: "hard", size: 15, rule: "free" };
function loadSave() {
  try {
    const v = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!v || typeof v !== "object") return { opts: { ...DEFAULT_OPTS }, game: null };
    const o = v.opts || {};
    const opts = { mode: o.mode === "ai" ? "ai" : "pvp", aiLevel: o.aiLevel === "easy" ? "easy" : "hard", size: o.size === 19 ? 19 : 15, rule: o.rule === "block2" ? "block2" : "free" };
    let game = null;
    const g = v.game;
    if (g && Array.isArray(g.moves) && [15, 19].includes(g.size)) {
      // Dựng lại từ danh sách nước đi để không tin dữ liệu bàn cờ đã lưu (chống lỗi/sửa tay).
      const base = { ...newMatch(g), score: { 1: g.score?.[1] | 0, 2: g.score?.[2] | 0, draw: g.score?.draw | 0 }, round: Math.max(1, g.round | 0), first: g.first === 2 ? 2 : 1 };
      game = replay(base, g.moves);
    }
    return { opts, game };
  } catch { return { opts: { ...DEFAULT_OPTS }, game: null }; }
}

export function mount(root, ctx = {}) {
  const sdk = ctx.sdk || { sound: { muted: false } };
  const $ = (id) => root.querySelector("#" + id) || document.getElementById(id);
  const cv = $("cv"), stage = $("stage"), g2 = cv.getContext("2d");
  const ui = {
    plX: $("plX"), plO: $("plO"), nX: $("nX"), nO: $("nO"), sX: $("sX"), sO: $("sO"), round: $("hRound"), status: $("hStatus"), draw: $("hDraw"),
    undo: $("undoBtn"), next: $("newBtn"), menu: $("menuBtn"), mute: $("muteBtn"), muteIc: $("muteIc"), tip: $("tip"),
    ovMenu: $("ovMenu"), ovPause: $("ovPause"), ovEnd: $("ovEnd"), mActions: $("mActions"), mResume: $("mResume"), optAi: $("optAi"),
    eTitle: $("eTitle"), eSub: $("eSub"), eResult: $("eResult"), pSub: $("pSub"),
  };
  root.querySelectorAll(".pcX").forEach((e) => { e.innerHTML = pieceSvg(1); });
  root.querySelectorAll(".pcO").forEach((e) => { e.innerHTML = pieceSvg(2); });
  const sfx = makeSfx("assets/sfx/", ["buoc-nhay", "trung-da", "do-xuc-xac", "thang", "thua", "qua-man"], sdk);

  const saved = loadSave();
  let opts = saved.opts;
  let s = null;                 // trạng thái ván (null = chưa vào trận)
  let pendingResume = saved.game && !saved.game.winner && saved.game.moves.length ? saved.game : null;
  let destroyed = false, raf = 0, aiTimer = 0, endTimer = 0, thinking = false;
  let L = { cs: 30, ox: 0, oy: 0, fr: 10, px: 3, dpr: 1, w: 0, h: 0 };
  let hover = null, cursor = null, pending = null;
  let fx = { drop: null, win: null, bad: null };

  // ---------- Bố cục ----------
  function layout() {
    const r = stage.getBoundingClientRect();
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
    cv.width = w; cv.height = h;
    const n = s ? s.size : opts.size;
    const shadow = Math.round(5 * dpr);
    const avail = Math.min(w, h) - shadow - 2;
    const cs = Math.max(6, Math.floor(avail / (n + 0.9)));
    const fr = Math.max(Math.round(4 * dpr), Math.floor((avail - cs * n) / 2));
    const tot = cs * n + fr * 2;
    L = { cs, fr, px: Math.max(1, Math.floor(cs / 11)), dpr, w, h,
      ox: Math.floor((w - shadow - tot) / 2) + fr, oy: Math.floor((h - shadow - tot) / 2) + fr };
  }
  function cellAt(clientX, clientY) {
    const r = cv.getBoundingClientRect();
    const x = (clientX - r.left) * L.dpr - L.ox, y = (clientY - r.top) * L.dpr - L.oy;
    const n = s ? s.size : opts.size;
    const c = Math.floor(x / L.cs), rr = Math.floor(y / L.cs);
    return rr >= 0 && c >= 0 && rr < n && c < n ? [rr, c] : null;
  }
  const ro = new ResizeObserver(() => { layout(); draw(performance.now()); });
  ro.observe(stage);

  // ---------- Vẽ ----------
  function drawPiece(p, X, Y, size, alpha = 1) {
    const u = Math.max(1, Math.floor(size / 11));
    const span = u * 9, sx = Math.round(X + (size - span) / 2), sy = Math.round(Y + (size - span) / 2);
    const [c, hi, d] = PAL[p], m = MASK[p];
    g2.globalAlpha = alpha;
    g2.fillStyle = d;
    for (let y = 0; y < 9; y++) for (let x = 0; x < 9; x++) if (m[y][x] === "X") g2.fillRect(sx + (x + 1) * u - Math.ceil(u / 2), sy + (y + 1) * u - Math.ceil(u / 2), u, u);
    for (let y = 0; y < 9; y++) for (let x = 0; x < 9; x++) if (m[y][x] === "X") {
      g2.fillStyle = y === 0 || m[y - 1][x] !== "X" ? hi : c;
      g2.fillRect(sx + x * u, sy + y * u, u, u);
    }
    g2.globalAlpha = 1;
  }
  function brackets(X, Y, S, col, t) {
    const k = Math.max(t * 2, Math.floor(S / 3));
    g2.fillStyle = col;
    for (const [ax, ay, sx, sy] of [[X, Y, 1, 1], [X + S, Y, -1, 1], [X, Y + S, 1, -1], [X + S, Y + S, -1, -1]]) {
      g2.fillRect(sx > 0 ? ax : ax - k, sy > 0 ? ay : ay - t, k, t);
      g2.fillRect(sx > 0 ? ax : ax - t, sy > 0 ? ay : ay - k, t, k);
    }
  }
  function draw(now) {
    g2.setTransform(1, 0, 0, 1, 0, 0);
    g2.clearRect(0, 0, L.w, L.h);
    const n = s ? s.size : opts.size, { cs, fr, ox, oy, dpr } = L, tot = cs * n;
    const sh = Math.round(5 * dpr), b = Math.max(2, Math.round(3 * dpr));
    // Khung gỗ + bóng cứng
    g2.fillStyle = "rgba(0,0,0,.6)"; g2.fillRect(ox - fr + sh, oy - fr + sh, tot + fr * 2, tot + fr * 2);
    g2.fillStyle = C.line; g2.fillRect(ox - fr - b, oy - fr - b, tot + fr * 2 + b * 2, tot + fr * 2 + b * 2);
    g2.fillStyle = C.frame; g2.fillRect(ox - fr, oy - fr, tot + fr * 2, tot + fr * 2);
    const bv = Math.max(1, Math.round(2 * dpr));
    g2.fillStyle = C.frameHi; g2.fillRect(ox - fr, oy - fr, tot + fr * 2, bv); g2.fillRect(ox - fr, oy - fr, bv, tot + fr * 2);
    g2.fillStyle = C.frameD; g2.fillRect(ox - fr, oy + tot + fr - bv, tot + fr * 2, bv); g2.fillRect(ox + tot + fr - bv, oy - fr, bv, tot + fr * 2);
    // Viền trong theo màu người đang tới lượt (nhìn bàn là biết lượt ai)
    if (s && !s.winner) {
      const col = PAL[s.turn][0], t = Math.max(2, Math.round(fr / 3));
      g2.fillStyle = col;
      g2.fillRect(ox - t, oy - t, tot + t * 2, t); g2.fillRect(ox - t, oy + tot, tot + t * 2, t);
      g2.fillRect(ox - t, oy, t, tot); g2.fillRect(ox + tot, oy, t, tot);
    }
    // Giấy ô
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      g2.fillStyle = (r + c) % 2 ? C.paperB : C.paperA;
      g2.fillRect(ox + c * cs, oy + r * cs, cs, cs);
    }
    // Ô thắng
    const win = s && s.line && fx.win;
    if (win) {
      const k = Math.min(1, (now - fx.win) / 450);
      const blink = Math.floor((now - fx.win) / 260) % 2;
      g2.fillStyle = blink ? "rgba(255,201,74,.75)" : "rgba(255,201,74,.5)";
      s.line.forEach(([r, c], i) => { if (i / s.line.length <= k) g2.fillRect(ox + c * cs, oy + r * cs, cs, cs); });
    }
    // Lưới
    const lw = Math.max(1, Math.round(dpr * 0.75));
    g2.fillStyle = C.grid;
    for (let i = 1; i < n; i++) { g2.fillRect(ox + i * cs, oy, lw, tot); g2.fillRect(ox, oy + i * cs, tot, lw); }
    const mid = (n - 1) / 2, st = Math.max(2, Math.round(cs / 6));
    g2.fillStyle = C.star;
    for (const [r, c] of [[mid, mid], [3, 3], [3, n - 4], [n - 4, 3], [n - 4, n - 4]]) g2.fillRect(ox + c * cs + (cs - st) / 2 | 0, oy + r * cs + (cs - st) / 2 | 0, st, st);
    if (!s) return;
    // Quân cờ
    const last = s.moves[s.moves.length - 1];
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const p = s.board[r * n + c]; if (!p) continue;
      let dy = 0;
      if (fx.drop && fx.drop.r === r && fx.drop.c === c) {
        const k = Math.min(1, (now - fx.drop.t) / 140);
        dy = -Math.round((1 - k) * cs * 0.35);
        if (k >= 1) fx.drop = null;
      }
      drawPiece(p, ox + c * cs, oy + r * cs + dy, cs);
    }
    if (last && !win) brackets(ox + last[1] * cs, oy + last[0] * cs, cs, C.gold, Math.max(2, L.px));
    // Đường thắng: kẻ bằng ô vuông pixel nối tâm ô đầu → ô cuối
    if (win) {
      const k = Math.min(1, (now - fx.win) / 450);
      const [a, z] = [s.line[0], s.line[s.line.length - 1]];
      const x0 = ox + a[1] * cs + cs / 2, y0 = oy + a[0] * cs + cs / 2, x1 = ox + z[1] * cs + cs / 2, y1 = oy + z[0] * cs + cs / 2;
      const t = Math.max(3, Math.round(cs / 7)), steps = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) / (t / 2));
      for (const [col, w] of [[C.line, t + 2 * Math.max(1, Math.round(dpr))], [C.gold, t]]) {
        g2.fillStyle = col;
        for (let i = 0; i <= steps * k; i++) {
          const x = x0 + (x1 - x0) * i / steps, y = y0 + (y1 - y0) * i / steps;
          g2.fillRect(Math.round(x - w / 2), Math.round(y - w / 2), w, w);
        }
      }
    }
    // Ô lỗi (đặt vào ô đã có quân)
    if (fx.bad) {
      const k = (now - fx.bad.t) / 300;
      if (k >= 1) fx.bad = null;
      else { g2.fillStyle = `rgba(224,72,61,${0.55 * (1 - k)})`; g2.fillRect(ox + fx.bad.c * cs, oy + fx.bad.r * cs, cs, cs); }
    }
    // Ô chờ xác nhận (chạm lần 1) / con trỏ bàn phím / rê chuột
    const canAct = !s.winner && !thinking && !isAiTurn(s);
    const mark = pending || cursor;
    if (canAct && mark && s.board[mark[0] * n + mark[1]] === 0) drawPiece(s.turn, ox + mark[1] * cs, oy + mark[0] * cs, cs, 0.5);
    if (canAct && hover && !pending && s.board[hover[0] * n + hover[1]] === 0) drawPiece(s.turn, ox + hover[1] * cs, oy + hover[0] * cs, cs, 0.3);
    if (mark && canAct) {
      const t = Math.max(2, L.px);
      g2.fillStyle = C.gold;
      const X = ox + mark[1] * cs, Y = oy + mark[0] * cs;
      g2.fillRect(X - t, Y - t, cs + 2 * t, t); g2.fillRect(X - t, Y + cs, cs + 2 * t, t);
      g2.fillRect(X - t, Y, t, cs); g2.fillRect(X + cs, Y, t, cs);
    }
  }

  // ---------- HUD ----------
  const names = () => (s?.mode ?? opts.mode) === "ai" ? { 1: "Bạn", 2: "Máy" + ((s?.aiLevel ?? opts.aiLevel) === "easy" ? " (dễ)" : " (khó)") } : { 1: "Người 1", 2: "Người 2" };
  function hud() {
    const nm = names();
    ui.nX.textContent = nm[1]; ui.nO.textContent = nm[2];
    if (!s) {
      ui.sX.textContent = "0"; ui.sO.textContent = "0"; ui.round.textContent = "Chưa bắt đầu"; ui.status.textContent = "Chọn chế độ"; ui.draw.textContent = "Hòa 0";
      ui.plX.classList.remove("on", "win"); ui.plO.classList.remove("on", "win");
      ui.undo.disabled = true; ui.next.disabled = true; return;
    }
    ui.sX.textContent = s.score[1]; ui.sO.textContent = s.score[2]; ui.draw.textContent = "Hòa " + s.score.draw;
    ui.round.textContent = "Ván " + s.round + " · " + s.size + "×" + s.size + (s.rule === "block2" ? " · chặn 2 đầu" : "");
    ui.plX.classList.toggle("on", !s.winner && s.turn === 1); ui.plO.classList.toggle("on", !s.winner && s.turn === 2);
    ui.plX.classList.toggle("win", s.winner === 1); ui.plO.classList.toggle("win", s.winner === 2);
    ui.status.textContent = s.winner === 3 ? "Hòa!" : s.winner ? nm[s.winner] + " thắng!" : thinking ? "Máy đang nghĩ…" : "Lượt " + SYM[s.turn] + " · " + nm[s.turn];
    ui.undo.disabled = !!s.winner || !s.moves.length || (s.mode === "ai" && !s.moves.some((m) => m[2] !== s.aiSide));
    ui.next.disabled = false;
    ui.next.classList.toggle("btn--primary", !!s.winner);
    ui.next.firstChild.textContent = s.winner ? "Ván tiếp ▶" : "Ván mới";
    ui.tip.hidden = !pending;
  }
  function showMute() {
    const m = !!sdk.sound.muted;
    ui.mute.setAttribute("aria-pressed", String(m));
    ui.muteIc.src = "assets/ui/icon-am-thanh-" + (m ? "tat" : "bat") + ".png";
  }
  function toggleMute() { sdk.sound.muted = !sdk.sound.muted; localStorage.setItem("wgp.muted", sdk.sound.muted ? "1" : "0"); showMute(); }

  function persist() {
    try {
      const game = s && !s.winner && s.moves.length ? { size: s.size, rule: s.rule, mode: s.mode, aiLevel: s.aiLevel, score: s.score, round: s.round, first: s.first, moves: s.moves.map(([r, c]) => [r, c]) } : null;
      localStorage.setItem(SAVE_KEY, JSON.stringify({ opts, game }));
    } catch {}
  }

  // ---------- Menu / overlay ----------
  function syncOpts() {
    root.querySelectorAll(".seg").forEach((seg) => {
      const k = seg.dataset.k;
      seg.querySelectorAll("button").forEach((b) => {
        const on = String(opts[k]) === b.dataset.v;
        b.setAttribute("aria-checked", String(on)); b.tabIndex = on ? 0 : -1;
      });
    });
    ui.optAi.hidden = opts.mode !== "ai";
  }
  root.querySelectorAll(".seg").forEach((seg) => {
    seg.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      const k = seg.dataset.k; opts[k] = k === "size" ? Number(b.dataset.v) : b.dataset.v;
      syncOpts(); persist(); if (!s) { layout(); draw(performance.now()); }
    });
    seg.addEventListener("keydown", (e) => {
      if (!["ArrowLeft", "ArrowRight"].includes(e.key)) return;
      e.preventDefault(); e.stopPropagation();
      const bs = [...seg.querySelectorAll("button")], i = bs.findIndex((x) => x.getAttribute("aria-checked") === "true");
      const nb = bs[(i + (e.key === "ArrowRight" ? 1 : bs.length - 1)) % bs.length]; nb.click(); nb.focus();
    });
  });
  function btn(label, cls, fn, id) {
    const b = document.createElement("button"); b.type = "button"; b.className = "btn btn--big " + cls; b.textContent = label; if (id) b.id = id; b.onclick = fn; return b;
  }
  function overlay(which) {
    ui.ovMenu.hidden = which !== "menu"; ui.ovPause.hidden = which !== "pause"; ui.ovEnd.hidden = which !== "end";
  }
  function showMenu() {
    clearTimers();
    syncOpts();
    ui.mActions.replaceChildren();
    if (pendingResume) {
      const g = pendingResume;
      ui.mActions.append(btn("▶ Chơi tiếp ván dở", "btn--primary", () => start(g), "resumeGameBtn"), btn("Trận mới", "", () => start(null), "startBtn"));
      ui.mResume.textContent = "Ván " + g.round + " đang dở · " + g.moves.length + " nước · tỉ số " + g.score[1] + " – " + g.score[2] + (g.mode === "ai" ? " (với máy)" : "");
    } else {
      ui.mActions.append(btn("▶ Bắt đầu", "btn--primary", () => start(null), "startBtn"));
      ui.mResume.textContent = "";
    }
    overlay("menu");
    s = null; pending = null; hover = null; cursor = null; fx = { drop: null, win: null, bad: null };
    hud(); layout(); draw(performance.now());
    ui.mActions.firstChild.focus({ preventScroll: true });
  }
  function start(game) {
    if (game) { s = game; opts = { mode: s.mode, aiLevel: s.aiLevel, size: s.size, rule: s.rule }; }
    else s = newMatch(opts);
    pendingResume = null;
    pending = null; cursor = null; hover = null; fx = { drop: null, win: null, bad: null };
    overlay(null); layout(); persist(); hud(); cv.focus({ preventScroll: true });
    maybeAi();
  }
  function showEnd() {
    const nm = names();
    const t = s.winner === 3 ? "Hòa!" : s.mode === "ai" ? (s.winner === 1 ? "Bạn thắng!" : "Máy thắng!") : SYM[s.winner] + " thắng!";
    ui.eTitle.innerHTML = s.winner === 3 ? t : `<span class="pc">${pieceSvg(s.winner)}</span>${t}`;
    ui.eSub.textContent = s.winner === 3 ? "Bàn đã kín mà chưa ai xếp được 5 quân." :
      nm[s.winner] + " xếp 5 quân theo " + DIR_NAME(s.line) + " sau " + s.moves.length + " nước. Ván sau " + nm[other(s.winner)] + " đi trước.";
    ui.eResult.innerHTML = `<div class="rx"><small>${nm[1]} · X</small><b>${s.score[1]}</b></div><div><small>Hòa</small><b>${s.score.draw}</b></div><div class="ro"><small>${nm[2]} · O</small><b>${s.score[2]}</b></div>`;
    overlay("end");
    $("nextBtn").focus({ preventScroll: true });
  }
  function clearTimers() { clearTimeout(aiTimer); clearTimeout(endTimer); thinking = false; }

  // ---------- Hành động ----------
  function place(r, c) {
    if (!s || s.winner || !ui.ovMenu.hidden || !ui.ovPause.hidden || !ui.ovEnd.hidden) return false;
    if (thinking || isAiTurn(s)) return false;
    return apply(r, c);
  }
  function apply(r, c) {
    if (!canPlay(s, r, c)) {
      if (s.board[r * s.size + c]) { fx.bad = { r, c, t: performance.now() }; sfx.play("trung-da", 0.35); }
      return false;
    }
    const p = s.turn;
    s = play(s, r, c);
    pending = null;
    fx.drop = { r, c, t: performance.now() };
    sfx.play("buoc-nhay", p === 1 ? 0.7 : 0.55);
    if (s.winner) {
      fx.win = performance.now();
      const humanLost = s.mode === "ai" && s.winner === s.aiSide;
      sfx.play(s.winner === 3 ? "qua-man" : humanLost ? "thua" : "thang", 0.8);
      sdk.reportScore?.(s.score); sdk.gameOver?.({ winner: s.winner, moves: s.moves.length, score: s.score });
      endTimer = setTimeout(showEnd, 1300);
    }
    persist(); hud();
    maybeAi();
    return true;
  }
  function maybeAi() {
    if (!s || !isAiTurn(s) || thinking) return;
    thinking = true; hud();
    aiTimer = setTimeout(() => {
      thinking = false;
      if (destroyed || !s || !isAiTurn(s)) { hud(); return; }
      const mv = bestMove(s, s.aiLevel);
      if (mv) apply(mv[0], mv[1]); else hud();
    }, 380 + Math.random() * 260);
  }
  function doUndo() {
    if (!s || s.winner || !s.moves.length || !ui.ovMenu.hidden || !ui.ovPause.hidden) return false;
    let k = 1;
    if (s.mode === "ai") {
      if (thinking) { clearTimeout(aiTimer); thinking = false; k = 1; }
      else k = s.moves[s.moves.length - 1][2] === s.aiSide ? 2 : 1;
      if (!s.moves.some((m) => m[2] !== s.aiSide)) return false;
    }
    const u = undo(s, k); if (!u) return false;
    s = u; pending = null; fx.drop = null;
    sfx.play("do-xuc-xac", 0.35);
    persist(); hud(); maybeAi();
    return true;
  }
  function doNext() {
    if (!s) return;
    clearTimers();
    s = s.winner ? nextRound(s) : { ...newRound(s, s.first), round: s.round };
    pending = null; fx = { drop: null, win: null, bad: null };
    overlay(null); persist(); hud(); cv.focus({ preventScroll: true }); maybeAi();
  }
  function setPause(on) {
    if (!s || !ui.ovMenu.hidden || !ui.ovEnd.hidden) return;
    if (on) {
      ui.pSub.textContent = "Ván " + s.round + " · " + s.moves.length + " nước · tỉ số " + s.score[1] + " – " + s.score[2];
      overlay("pause"); $("resumeBtn").focus({ preventScroll: true });
    } else { overlay(null); cv.focus({ preventScroll: true }); }
  }

  // ---------- Nhập liệu ----------
  // Chuột: một lần bấm là đặt. Cảm ứng/bút: chạm lần 1 chọn ô (hiện quân mờ), chạm lại đúng ô đó mới đặt — chống bấm nhầm ô nhỏ.
  function onPointerDown(e) {
    if (e.button > 0) return;
    const cell = cellAt(e.clientX, e.clientY);
    if (!cell || !s) return;
    if (e.pointerType === "mouse") { cursor = null; place(cell[0], cell[1]); hover = null; }
    else if (pending && pending[0] === cell[0] && pending[1] === cell[1]) place(cell[0], cell[1]);
    else if (s && !s.winner && !thinking && !isAiTurn(s) && ui.ovPause.hidden && ui.ovEnd.hidden) {
      if (s.board[cell[0] * s.size + cell[1]]) { fx.bad = { r: cell[0], c: cell[1], t: performance.now() }; pending = null; }
      else pending = cell;
      cursor = null; hud();
    }
  }
  function onPointerMove(e) { if (e.pointerType === "mouse") hover = cellAt(e.clientX, e.clientY); }
  cv.addEventListener("pointerdown", onPointerDown);
  cv.addEventListener("pointermove", onPointerMove);
  cv.addEventListener("pointerleave", () => { hover = null; });
  ui.undo.onclick = doUndo;
  ui.next.onclick = doNext;
  ui.menu.onclick = () => setPause(ui.ovPause.hidden);
  ui.mute.onclick = toggleMute;
  $("resumeBtn").onclick = () => setPause(false);
  $("restartBtn").onclick = doNext;
  // Về menu giữa ván: ván dở vẫn được giữ để "Chơi tiếp ván dở".
  $("menuBtnP").onclick = () => { pendingResume = s && !s.winner && s.moves.length ? s : null; showMenu(); };
  $("menuBtnE").onclick = () => { pendingResume = null; showMenu(); };
  $("nextBtn").onclick = doNext;
  $("viewBtn").onclick = () => { overlay(null); cv.focus({ preventScroll: true }); };

  function onKey(e) {
    if (e.target.closest && e.target.closest(".seg")) return;
    const k = e.key;
    if (k === "m" || k === "M") { toggleMute(); return; }
    if (!s) return;
    if (k === "Escape") { if (!ui.ovEnd.hidden) { overlay(null); return; } setPause(ui.ovPause.hidden); e.preventDefault(); return; }
    if (!ui.ovPause.hidden || !ui.ovMenu.hidden) return;
    if ((k === "n" || k === "N") ) { doNext(); return; }
    if (!ui.ovEnd.hidden) return;
    if (k === "u" || k === "U" || ((e.ctrlKey || e.metaKey) && (k === "z" || k === "Z"))) { doUndo(); e.preventDefault(); return; }
    const d = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[k];
    if (d) {
      e.preventDefault();
      const last = s.moves[s.moves.length - 1];
      const base = cursor || pending || (last ? [last[0], last[1]] : [s.size >> 1, s.size >> 1]);
      cursor = [Math.max(0, Math.min(s.size - 1, base[0] + d[0])), Math.max(0, Math.min(s.size - 1, base[1] + d[1]))];
      pending = null; hud(); return;
    }
    if ((k === "Enter" || k === " ") && document.activeElement === cv) {
      e.preventDefault();
      const mk = cursor || pending; if (mk) place(mk[0], mk[1]);
    }
  }
  window.addEventListener("keydown", onKey);

  function frame(now) {
    if (destroyed) return;
    draw(now);
    raf = requestAnimationFrame(frame);
  }
  showMute(); layout(); showMenu(); raf = requestAnimationFrame(frame);

  return {
    get state() { return s; },
    get thinking() { return thinking; },
    get pending() { return pending; },
    get layout() { return { ...L }; },
    sfx,
    // Tâm ô (r,c) theo toạ độ CSS của trang — dùng cho test bấm thật.
    cellPoint(r, c) {
      const b = cv.getBoundingClientRect();
      return { x: b.left + (L.ox + c * L.cs + L.cs / 2) / L.dpr, y: b.top + (L.oy + r * L.cs + L.cs / 2) / L.dpr };
    },
    place, undo: doUndo, next: doNext,
    destroy() { destroyed = true; clearTimers(); cancelAnimationFrame(raf); ro.disconnect(); sfx.close(); window.removeEventListener("keydown", onKey); },
  };
}
