// Cờ Caro — phần vẽ (canvas), điều khiển, HUD, âm thanh, lưu ván. Luật chơi ở logic.js, máy chơi ở ai.js.
import { newMatch, newRound, nextRound, play, undo, replay, canPlay, isAiTurn, other } from "./logic.js";
import { bestMove } from "./ai.js";
import { createNet, CODE_RE } from "./net.js?v=kk1";
import { shareResult } from "../_shared/share.js?v=s2";
import { isChatOff, initChatOff } from "../_shared/chat-off.js?v=co1";
import { sharedName, initKick, kickButtonHTML, BANNED_TEXT, KICK_ERR } from "../_shared/online-kit.js?v=ok2"; // tên dùng chung + "Mời ra"

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

// Chỉ còn "ai" (chơi với máy) và "online" — bỏ chế độ 2 người chung máy.
const DEFAULT_OPTS = { mode: "ai", aiLevel: "hard", size: 15, rule: "free" };
const NAME_KEY = "wgp.caro.name";
const ERR = {
  "no-room": "Không tìm thấy phòng — kiểm tra lại mã phòng.",
  full: "Phòng đã đủ 2 người.",
  started: "Phòng này đang chơi, không vào thêm được.",
  "not-host": "Chỉ chủ phòng làm được việc này.",
  "need-2": "Cần đủ 2 người mới bắt đầu được.",
  "not-turn": "Chưa tới lượt bạn.",
  illegal: "Ô này không đặt được.",
  slow: "Thao tác nhanh quá, chậm lại chút nhé.",
  busy: "Máy chủ đang bận (hoặc bạn mở quá nhiều phòng). Thử lại sau.",
  loading: "Máy chủ đang khởi động, thử lại sau giây lát.",
  server: "Máy chủ gặp lỗi, thử lại.",
  bad: "Yêu cầu không hợp lệ.",
  banned: BANNED_TEXT,
  target: KICK_ERR.target,
  long: "Tin nhắn dài quá (tối đa 200 ký tự).",
  "chat-slow": "Bạn nhắn nhanh quá — đợi một chút rồi gửi tiếp.",
};
const esc = (t) => String(t).replace(/[&<>"']/g, (ch) => "&#" + ch.charCodeAt(0) + ";");
function loadSave() {
  try {
    const v = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!v || typeof v !== "object") return { opts: { ...DEFAULT_OPTS }, game: null };
    const o = v.opts || {};
    // Bản lưu cũ có mode "pvp" (2 người chung máy, đã bỏ) → chuyển sang chơi với máy.
    const opts = { mode: o.mode === "online" ? "online" : "ai", aiLevel: o.aiLevel === "easy" ? "easy" : "hard", size: o.size === 19 ? 19 : 15, rule: o.rule === "block2" ? "block2" : "free" };
    let game = null;
    const g = v.game;
    // Ván dở của chế độ chung máy cũ thì bỏ (không ép thành ván với máy giữa chừng).
    if (g && g.mode === "ai" && Array.isArray(g.moves) && [15, 19].includes(g.size)) {
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
    ovMenu: $("ovMenu"), ovPause: $("ovPause"), ovEnd: $("ovEnd"), mResume: $("mResume"), mNote: $("mNote"),
    vEntry: $("vEntry"), vSolo: $("vSolo"), vCreate: $("vCreate"), createBtn: $("createBtn"), soloBtn: $("soloBtn"), resumeGame: $("resumeGameBtn"), startBtn: $("startBtn"), createRoomBtn: $("createRoomBtn"),
    eTitle: $("eTitle"), eSub: $("eSub"), eResult: $("eResult"), pSub: $("pSub"),
    nameIn: $("nameIn"), codeIn: $("codeIn"), joinBtn: $("joinBtn"), mErr: $("mErr"),
    ovRoom: $("ovRoom"), rCode: $("rCode"), rOpts: $("rOpts"), rSeats: $("rSeats"), rNote: $("rNote"), rStart: $("rStart"), rCopy: $("rCopy"), rLeave: $("rLeave"), rDisband: $("rDisband"), eDisband: $("eDisband"),
    toast: $("toast"), menuP: $("menuBtnP"), menuE: $("menuBtnE"), place: $("placeBtn"),
    chat: $("chat"), chatLog: $("chatLog"), chatF: $("chatF"), chatIn: $("chatIn"), chatBtn: $("chatBtn"), chatN: $("chatN"), chatX: $("chatX"),
  };
  root.querySelectorAll(".pcX").forEach((e) => { e.innerHTML = pieceSvg(1); });
  root.querySelectorAll(".pcO").forEach((e) => { e.innerHTML = pieceSvg(2); });
  const sfx = makeSfx("assets/sfx/", ["buoc-nhay", "trung-da", "do-xuc-xac", "thang", "thua", "qua-man", "tin-nhan"], sdk);

  const saved = loadSave();
  let opts = saved.opts;
  opts.mode = "ai"; // màn vào game không còn ô "Chế độ": chơi trên máy luôn là với máy, online đi qua phòng
  let s = null;                 // trạng thái ván (null = chưa vào trận)
  let pendingResume = saved.game && !saved.game.winner && saved.game.moves.length ? saved.game : null;
  let destroyed = false, raf = 0, aiTimer = 0, endTimer = 0, thinking = false;
  let L = { cs: 30, ox: 0, oy: 0, fr: 10, px: 3, dpr: 1, w: 0, h: 0 };
  let hover = null, cursor = null, pending = null;
  let fx = { drop: null, win: null, bad: null };
  // ---- Online: máy chủ giữ ván; client chỉ gửi "đặt quân r,c" rồi vẽ lại theo danh sách nước máy chủ gửi về.
  let room = null, skew = 0, sent = false, toastTimer = 0, lastHud = 0;
  const online = () => !!room && room.phase !== "lobby";
  const mySide = () => (room ? room.you + 1 : 0);
  const blocked = () => thinking || isAiTurn(s) || (online() && (s.turn !== mySide() || sent));
  function toast(text, ms = 2600) {
    ui.toast.textContent = text; ui.toast.hidden = false;
    clearTimeout(toastTimer); if (ms) toastTimer = setTimeout(() => (ui.toast.hidden = true), ms);
  }
  const hideToast = () => { ui.toast.hidden = true; clearTimeout(toastTimer); };
  const setRoomParam = (code) => { try { const u = new URL(location.href); if (code) u.searchParams.set("room", code); else u.searchParams.delete("room"); history.replaceState(null, "", u.href); } catch {} };

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
    // Ô đang chọn chờ bấm Đặt (cảm ứng) / con trỏ bàn phím / rê chuột
    const canAct = !s.winner && !blocked();
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
  const names = () => room ? { 1: room.players[0]?.name || "X", 2: room.players[1]?.name || (room.phase === "lobby" ? "Đang chờ…" : "O") } : (s?.mode ?? opts.mode) === "ai" ? { 1: "Bạn", 2: "Máy" + ((s?.aiLevel ?? opts.aiLevel) === "easy" ? " (dễ)" : " (khó)") } : { 1: "Người 1", 2: "Người 2" };
  let warnLeft = -1; // giây cuối đã tích cảnh báo hết giờ lượt
  function hud() {
    const nm = names();
    ui.nX.textContent = nm[1]; ui.nO.textContent = nm[2];
    document.body.classList.toggle("is-online", online());
    document.body.classList.toggle("in-game", !!s);
    if (online()) {
      const tag = (k) => "Quân " + SYM[k] + (mySide() === k ? " · Bạn" : "") + (room.players[k - 1] && !room.players[k - 1].connected ? " · mất kết nối" : "");
      ui.plX.querySelector("small").textContent = tag(1); ui.plO.querySelector("small").textContent = tag(2);
    } else { ui.plX.querySelector("small").textContent = "Quân X"; ui.plO.querySelector("small").textContent = "Quân O"; }
    if (!s) {
      ui.sX.textContent = "0"; ui.sO.textContent = "0"; ui.round.textContent = room ? "Phòng " + room.code : "Chưa bắt đầu"; ui.status.textContent = room ? "Phòng chờ" : "Sẵn sàng"; ui.draw.textContent = "Hòa 0";
      ui.plX.classList.remove("on", "win"); ui.plO.classList.remove("on", "win");
      ui.undo.disabled = true; ui.next.disabled = true; return;
    }
    ui.sX.textContent = s.score[1]; ui.sO.textContent = s.score[2]; ui.draw.textContent = "Hòa " + s.score.draw;
    ui.round.textContent = "Ván " + s.round + " · " + s.size + "×" + s.size + (s.rule === "block2" ? " · chặn 2 đầu" : "");
    ui.plX.classList.toggle("on", !s.winner && s.turn === 1); ui.plO.classList.toggle("on", !s.winner && s.turn === 2);
    ui.plX.classList.toggle("win", s.winner === 1); ui.plO.classList.toggle("win", s.winner === 2);
    ui.status.textContent = s.winner === 3 ? "Hòa!" : s.winner ? nm[s.winner] + " thắng!" : thinking ? "Máy đang nghĩ…" : "Lượt " + SYM[s.turn] + " · " + nm[s.turn];
    if (online() && !s.winner) {
      const left = room.deadline ? Math.max(0, Math.ceil((room.deadline - (Date.now() + skew)) / 1000)) : 0;
      const t = left && left <= 15 ? " · " + left + "s" : "";
      if (s.turn === mySide() && left > 0 && left <= 5 && left !== warnLeft) { warnLeft = left; sfx.play("do-xuc-xac", 0.3); }
      const opp = room.players[s.turn - 1];
      ui.status.textContent = s.turn === mySide() ? "Lượt bạn (" + SYM[s.turn] + ")" + t : opp && !opp.connected ? nm[s.turn] + " mất kết nối…" + t : "Chờ " + nm[s.turn] + " đánh…" + t;
    }
    if (online() && s.winner && s.winner !== 3) ui.status.textContent = s.winner === mySide() ? "Bạn thắng!" : nm[s.winner] + " thắng!";
    ui.undo.disabled = !!s.winner || !s.moves.length || (s.mode === "ai" && !s.moves.some((m) => m[2] !== s.aiSide));
    ui.next.disabled = online() && !s.winner;
    ui.next.classList.toggle("btn--primary", !!s.winner);
    ui.next.firstChild.textContent = s.winner ? "Ván tiếp ▶" : "Ván mới";
    ui.tip.hidden = !pending;
    ui.place.disabled = !canConfirm();
  }
  // Nút Đặt (cảm ứng) chỉ bấm được khi đã chọn ô trống, đang tới lượt mình và máy không đang nghĩ.
  const canConfirm = () => !!(s && pending && !s.winner && !blocked() && s.board[pending[0] * s.size + pending[1]] === 0);
  function showMute() {
    const m = !!sdk.sound.muted;
    ui.mute.setAttribute("aria-pressed", String(m));
    ui.muteIc.src = "assets/ui/icon-am-thanh-" + (m ? "tat" : "bat") + ".png";
  }
  function toggleMute() { sdk.sound.muted = !sdk.sound.muted; localStorage.setItem("wgp.muted", sdk.sound.muted ? "1" : "0"); showMute(); }

  function persist() {
    if (room) return; // ván online do máy chủ giữ — không ghi đè ván dở chơi trên máy
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
  function overlay(which) {
    ui.ovMenu.hidden = which !== "menu"; ui.ovPause.hidden = which !== "pause"; ui.ovEnd.hidden = which !== "end"; ui.ovRoom.hidden = which !== "room";
  }
  // Màn vào game: "entry" (tên · Tạo phòng online · mã phòng · Chơi với máy) → "solo" (tuỳ chọn chơi với máy) / "create" (tuỳ chọn phòng online)
  let view = "entry";
  function entryFocus() { return pendingResume ? ui.resumeGame : !ui.nameIn.value.trim() ? ui.nameIn : ui.createBtn; }
  function menuView(v, focusEl) {
    view = v;
    ui.vEntry.hidden = v !== "entry"; ui.vSolo.hidden = v !== "solo"; ui.vCreate.hidden = v !== "create";
    ui.mErr.textContent = ""; ui.ovMenu.scrollTop = 0;
    (focusEl || (v === "solo" ? ui.startBtn : v === "create" ? ui.createRoomBtn : entryFocus())).focus({ preventScroll: true });
  }
  function menuResume() {
    const g = pendingResume;
    ui.resumeGame.hidden = !g;
    ui.mResume.textContent = g ? "Ván " + g.round + " đang dở · " + g.moves.length + " nước · tỉ số " + g.score[1] + " – " + g.score[2] + " (với máy)" : "";
  }
  function showMenu(err = "") {
    clearTimers();
    room = null; sent = false; document.body.classList.remove("is-online");
    renderChat(null); busyMenu(false);
    syncOpts(); menuResume(); ui.mNote.textContent = "";
    overlay("menu");
    s = null; pending = null; hover = null; cursor = null; fx = { drop: null, win: null, bad: null };
    hud(); layout(); draw(performance.now());
    menuView("entry"); ui.mErr.textContent = err;
  }
  ui.soloBtn.onclick = () => menuView("solo");
  ui.resumeGame.onclick = () => { if (pendingResume) start(pendingResume); };
  ui.startBtn.onclick = () => start(null);
  $("soloBack").onclick = () => menuView("entry", ui.soloBtn);
  $("createBack").onclick = () => menuView("entry", ui.createBtn);
  ui.createBtn.onclick = () => goOnline("create");
  ui.createRoomBtn.onclick = () => goOnline("room");
  // Esc ở bước 2 → quay lại màn đầu
  ui.ovMenu.addEventListener("keydown", (e) => { if (e.key === "Escape" && view !== "entry") { e.preventDefault(); e.stopPropagation(); menuView("entry", view === "solo" ? ui.soloBtn : ui.createBtn); } });

  // ---------- Online ----------
  const net = createNet({
    joined(code) { setRoomParam(code); hideToast(); ui.mErr.textContent = ""; },
    state(v, sk) { skew = sk; netState(v); },
    left() { setRoomParam(""); if (exiting) return; s = null; showMenu(); },
    gone(text) { setRoomParam(""); s = null; showMenu(text); },
    closed() { // chủ phòng đã hủy phòng → ai cũng về màn đầu (ghế đã lưu được net.js xoá)
      if (exiting) return;
      const mine = !!room && room.you === room.host;
      setRoomParam(""); s = null; sfx.play("trung-da", 0.5);
      showMenu(mine ? "Đã hủy phòng." : "Chủ phòng đã hủy phòng.");
    },
    error(code, inRoom) {
      const text = ERR[code] || "Có lỗi xảy ra (" + code + ").";
      if (!inRoom) { busyMenu(false); ui.mErr.textContent = text; return; }
      if (code === "illegal" || code === "not-turn") sent = false;
      if (code !== "phase") toast(text);
    },
    offline(text) { busyMenu(false); if (room) { s = null; showMenu(text); } else ui.mErr.textContent = text; },
    reconnecting() { toast("Mất kết nối — đang nối lại…", 0); },
  }, { url: ctx.wsUrl });
  function busyMenu(on) { ui.ovMenu.querySelectorAll(".btn").forEach((b) => (b.disabled = on)); }
  // kind: "create" (màn đầu → bước chọn bàn/luật) · "room" (gửi lệnh tạo phòng) · "join" (vào bằng mã)
  function goOnline(kind) {
    const nm = myName.commit(ui.nameIn.value); // tên dùng chung toàn site (_shared/online-kit.js): sửa ở đây ⇒ mọi game cùng đổi
    if (!nm) { if (view !== "entry") menuView("entry"); ui.mErr.textContent = "Nhập tên của bạn trước nhé."; ui.nameIn.focus(); return; }
    try { localStorage.setItem(NAME_KEY, nm); } catch {}
    if (kind === "create") { menuView("create"); return; }
    if (kind === "join") {
      const c = ui.codeIn.value.trim().toUpperCase();
      if (!CODE_RE.test(c)) { ui.mErr.textContent = "Mã phòng gồm 5 ký tự (chữ và số), ví dụ K7M2Q."; ui.codeIn.focus(); return; }
      net.join(c, nm);
    } else net.create(nm, opts.size, opts.rule, !$("privateRoom").checked);
    ui.mErr.textContent = "Đang kết nối…"; busyMenu(true);
  }
  ui.joinBtn.onclick = () => goOnline("join");
  ui.codeIn.addEventListener("input", () => { ui.codeIn.value = ui.codeIn.value.toUpperCase().replace(/[^A-Z0-9]/g, ""); });
  const onEnter = (e) => { if (e.key === "Enter") { e.preventDefault(); goOnline(e.target === ui.codeIn || ui.codeIn.value ? "join" : "create"); } };
  ui.nameIn.addEventListener("keydown", onEnter); ui.codeIn.addEventListener("keydown", onEnter);
  ui.nameIn.addEventListener("input", () => { if (ui.mErr.textContent === "Nhập tên của bạn trước nhé.") ui.mErr.textContent = ""; });
  // Ô tên điền sẵn tên dùng chung (tài khoản); người cũ có tên riêng của game (NAME_KEY) được chuyển sang một lần.
  const myName = sharedName({ game: "co-caro", input: ui.nameIn, legacy: () => { try { return localStorage.getItem(NAME_KEY) || ""; } catch { return ""; } } });
  initKick({ send: (o) => net.send(o) }); // chủ phòng "Mời ra" (hộp xác nhận pixel → máy chủ kiểm quyền)

  function showRoom(v) {
    const n = v.players.length, host = v.you === v.host;
    ui.rCode.textContent = v.code;
    ui.rOpts.textContent = "Bàn " + v.size + "×" + v.size + " · luật " + (v.rule === "block2" ? "chặn 2 đầu" : "tự do") + " · chủ phòng cầm X";
    ui.rSeats.innerHTML = [0, 1].map((i) => {
      const p = v.players[i];
      if (!p) return `<div class="seat off"><span class="pc">${pieceSvg(i + 1)}</span><b>Đang chờ người chơi…</b><em>Chỗ trống</em></div>`;
      return `<div class="seat"><span class="pc">${pieceSvg(i + 1)}</span><b>${esc(p.name)}${i === v.you ? " (Bạn)" : ""}</b><em class="${p.connected ? "ok" : "bad"}">${i === v.host ? "Chủ phòng · " : ""}${p.connected ? "Sẵn sàng" : "Mất kết nối"}</em>${host && i !== v.you ? kickButtonHTML(i, p.name) : ""}</div>`;
    }).join("");
    ui.rStart.textContent = host ? "▶ Bắt đầu" : "Chờ chủ phòng";
    ui.rStart.disabled = !host || n < 2;
    ui.rNote.textContent = n < 2 ? "Gửi mã " + v.code + " (hoặc bấm Chép link mời) cho bạn bè." : host ? "Đủ 2 người — bấm Bắt đầu." : "Chủ phòng sẽ bấm Bắt đầu.";
    ui.rDisband.hidden = !host;
    ui.rLeave.title = host && n > 1 ? "Rời phòng — người còn lại thành chủ phòng" : "";
    if (ui.ovRoom.hidden) { overlay("room"); (host ? ui.rCopy : ui.rLeave).focus({ preventScroll: true }); }
  }
  function fromServer(v) {
    const G = v.game;
    const base = { ...newMatch({ size: G.size, rule: G.rule }), score: G.score, round: G.round, first: G.first };
    let n = replay(base, G.moves.map(([r, c]) => [r, c]));
    if (!n) { // không dựng lại được bằng luật (không nên xảy ra) → chép thẳng trạng thái máy chủ
      n = newRound({ ...base, round: G.round - 1 }, G.first);
      n.board = n.board.slice(); for (const [r, c, q] of G.moves) n.board[r * G.size + c] = q;
      n.moves = G.moves.map((m) => m.slice());
    }
    return { ...n, score: G.score, turn: G.turn, winner: G.winner, line: G.line };
  }
  // ---------- Trò chuyện (qua máy chủ; tên người gửi do máy chủ gắn) ----------
  let chatSeen = 0, chatLast = -1;
  const narrow = () => matchMedia("(max-width: 760px), (max-aspect-ratio: 1/1)").matches;
  const chatOpen = () => !narrow() || document.body.classList.contains("chat-open");
  function renderChat(v) {
    const on = !!v;
    document.body.classList.toggle("has-chat", on); ui.chat.hidden = !on;
    if (!on) { document.body.classList.remove("chat-open"); chatSeen = 0; chatLast = -1; ui.chatLog.replaceChildren(); ui.chatN.hidden = true; ui.chatIn.value = ""; return; }
    const off = isChatOff(), send = ui.chatF.querySelector('[type="submit"]');
    ui.chatIn.disabled = off; if (send) send.disabled = off;
    if (!ui.chatIn.dataset.ph) ui.chatIn.dataset.ph = ui.chatIn.placeholder;
    ui.chatIn.placeholder = off ? "Chat đang tắt" : ui.chatIn.dataset.ph;
    const list = v.chat || [], top = list.length ? list[list.length - 1].id : 0;
    if (top !== chatLast) {
      const atEnd = ui.chatLog.scrollHeight - ui.chatLog.scrollTop - ui.chatLog.clientHeight < 40;
      const isNew = chatLast >= 0 && top > chatLast;
      chatLast = top;
      ui.chatLog.replaceChildren(...(list.length ? list.map((c) => {
        const li = document.createElement("li"), b = document.createElement("b");
        const side = v.players.findIndex((p) => p.name === c.name);
        li.className = c.mine ? "mine" : side === 0 ? "x" : "o";
        b.textContent = c.mine ? "Bạn" : c.name; li.append(b, document.createTextNode(c.text));
        return li;
      }) : [Object.assign(document.createElement("li"), { className: "empty", textContent: "Chưa có tin nhắn. Chào đối thủ một câu nhé!" })]));
      if (atEnd || list.at(-1)?.mine) ui.chatLog.scrollTop = ui.chatLog.scrollHeight;
      const last = list.at(-1);
      if (isNew && last && !last.mine && !off) sfx.play("tin-nhan", 0.6); // có tin mới từ người khác: kêu cả khi đang mở khung chat
      if (isNew && last && !last.mine && !off && !chatOpen()) toast(last.name + ": " + last.text, 3500);
    }
    if (chatOpen() || off) chatSeen = top;
    const unread = list.filter((c) => c.id > chatSeen && !c.mine).length;
    ui.chatN.hidden = !unread; ui.chatN.textContent = unread > 9 ? "9+" : String(unread);
  }
  function setChatOpen(on) {
    document.body.classList.toggle("chat-open", on);
    if (on) { hideToast(); if (room) renderChat(room); ui.chatLog.scrollTop = ui.chatLog.scrollHeight; ui.chatIn.focus({ preventScroll: true }); }
    else if (!ui.ovRoom.hidden) ui.rLeave.focus({ preventScroll: true }); else cv.focus({ preventScroll: true });
  }
  // "Tắt chat" (chung toàn trang): đổi ⇒ vẽ lại khung chat, tắt luôn toast tin nhắn đang hiện
  initChatOff((off) => { if (off) hideToast(); if (room) renderChat(room); });
  ui.chatBtn.onclick = () => setChatOpen(!document.body.classList.contains("chat-open"));
  ui.chatX.onclick = () => setChatOpen(false);
  ui.chatIn.addEventListener("keydown", (e) => { if (e.key === "Escape") { e.stopPropagation(); setChatOpen(false); } });
  ui.chatF.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = ui.chatIn.value.trim(); if (!text || isChatOff()) return;
    if (net.send({ t: "chat", text })) ui.chatIn.value = ""; else toast("Đang nối lại máy chủ — chưa gửi được tin.");
  });

  // Tiếng vào/rời phòng: so danh sách người chơi lần trước với lần này (không kêu cho chính mình).
  function presenceSfx(prev, v) {
    if (!prev || prev.code !== v.code) return;
    let join = false, gone = (prev.players || []).length > (v.players || []).length || (!prev.oppLeft && !!v.oppLeft);
    (v.players || []).forEach((p, i) => {
      if (i === v.you || !p) return;
      const o = prev.players[i];
      if (!o || o.name !== p.name || (!o.connected && p.connected)) join = true;
      else if (o.connected && !p.connected) gone = true;
    });
    if (join) sfx.play("buoc-nhay", 0.6); else if (gone) sfx.play("trung-da", 0.4);
  }
  function netState(v) {
    const prev = room; room = v;
    renderChat(v); presenceSfx(prev, v);
    if (v.phase === "lobby") {
      clearTimers(); s = null; sent = false; fx = { drop: null, win: null, bad: null };
      if (v.oppLeft && prev && prev.phase !== "lobby") toast("Đối thủ đã rời phòng — gửi mã cho người khác vào chơi tiếp.", 4000);
      hud(); showRoom(v); layout(); return;
    }
    const sameGame = prev && prev.gid === v.gid && s;
    const before = sameGame ? s.moves.length : -1;
    s = fromServer(v); sent = false;
    if (!sameGame) {
      clearTimers(); pending = null; cursor = null; hover = null; fx = { drop: null, win: null, bad: null };
      overlay(null); layout(); cv.focus({ preventScroll: true });
      if (!prev || prev.phase === "lobby" || prev.gid !== v.gid) sfx.play("qua-man", 0.5); // vào ván / ván mới trong cùng phòng
      if (s.winner) { fx.win = performance.now() - 450; }
    } else if (s.moves.length === before + 1) {
      const [r, c, q] = s.moves[s.moves.length - 1];
      fx.drop = { r, c, t: performance.now() }; pending = null;
      sfx.play("buoc-nhay", q === 1 ? 0.7 : 0.55);
      if (s.winner) {
        fx.win = performance.now();
        sfx.play(s.winner === 3 ? "qua-man" : s.winner === mySide() ? "thang" : "thua", 0.8);
        endTimer = setTimeout(showEnd, 1300);
      }
    }
    hud();
  }
  function leaveRoom() {
    if (online() && !s.winner && !confirm("Rời ván đang chơi? Đối thủ sẽ phải chờ người mới.")) return;
    net.leave();
  }
  ui.rStart.onclick = () => net.send({ t: "start" });
  ui.rLeave.onclick = () => net.leave();
  // Hủy phòng: chỉ chủ phòng, ở phòng chờ hoặc khi ván đã xong — máy chủ gửi "closed" cho cả phòng.
  function disbandRoom() {
    if (!room || room.you !== room.host) return;
    if (room.players.length > 1 && !confirm("Hủy phòng? Mọi người trong phòng sẽ bị đưa ra ngoài.")) return;
    if (!net.disband()) toast("Đang nối lại máy chủ — chưa hủy được phòng.");
  }
  ui.rDisband.onclick = disbandRoom; ui.eDisband.onclick = disbandRoom;
  // "← Trang chủ" khi đang ở trong phòng: báo máy chủ rời phòng (chủ phòng ngồi một mình ở phòng chờ thì hủy luôn) rồi mới
  // chuyển trang — người kia thấy mình rời ngay, không phải chờ máy chủ hết hạn. Ngoài phòng thì link chạy bình thường.
  let exiting = false;
  function onHomeClick(e) {
    if (!(room || net.inRoom) || e.defaultPrevented || e.button > 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (exiting) return;
    if (online() && s && !s.winner && !confirm("Rời ván đang chơi?")) return;
    const href = e.currentTarget.href;
    const alone = !!room && room.phase === "lobby" && room.you === room.host && room.players.length < 2;
    exiting = true;
    net.exit(alone ? "disband" : "leave", 400).then(() => { location.href = href; });
  }
  const homeLinks = [...document.querySelectorAll('a[href*="homepage"]')];
  homeLinks.forEach((a) => a.addEventListener("click", onHomeClick));
  ui.rCopy.onclick = async () => {
    const u = new URL(location.href); u.search = "?room=" + (room ? room.code : ""); u.hash = "";
    try { await navigator.clipboard.writeText(u.href); toast("Đã chép link mời: " + u.href); }
    catch { toast("Link mời: " + u.href, 6000); }
  };
  function start(game) {
    if (game) { s = game; opts = { mode: s.mode, aiLevel: s.aiLevel, size: s.size, rule: s.rule }; }
    else { opts.mode = "ai"; s = newMatch(opts); }
    pendingResume = null;
    pending = null; cursor = null; hover = null; fx = { drop: null, win: null, bad: null };
    overlay(null); layout(); persist(); hud(); cv.focus({ preventScroll: true });
    sfx.play("qua-man", 0.4);
    maybeAi();
  }
  function showEnd() {
    const nm = names();
    const t = s.winner === 3 ? "Hòa!" : online() ? (s.winner === mySide() ? "Bạn thắng!" : "Bạn thua!") : s.mode === "ai" ? (s.winner === 1 ? "Bạn thắng!" : "Máy thắng!") : SYM[s.winner] + " thắng!";
    ui.eTitle.innerHTML = s.winner === 3 ? t : `<span class="pc">${pieceSvg(s.winner)}</span>${t}`;
    ui.eSub.textContent = s.winner === 3 ? "Bàn đã kín mà chưa ai xếp được 5 quân." :
      nm[s.winner] + " xếp 5 quân theo " + DIR_NAME(s.line) + " sau " + s.moves.length + " nước. Ván sau " + nm[other(s.winner)] + " đi trước.";
    ui.eResult.innerHTML = `<div class="rx"><small>${esc(nm[1])} · X</small><b>${s.score[1]}</b></div><div><small>Hòa</small><b>${s.score.draw}</b></div><div class="ro"><small>${esc(nm[2])} · O</small><b>${s.score[2]}</b></div>`;
    ui.menuE.textContent = online() ? "Rời phòng" : "Trận mới";
    ui.eDisband.hidden = !(room && room.you === room.host);
    overlay("end");
    $("nextBtn").focus({ preventScroll: true });
  }
  // "Khoe kết quả": ảnh 1080×1080 với số thật của ván (mức máy / đối thủ, số nước, bàn + luật, tỉ số các ván).
  function shareEnd() {
    if (!s || !s.winner) return;
    const me = online() ? mySide() : 3 - s.aiSide, op = 3 - me, nm = names();
    const res = s.winner === 3 ? "draw" : s.winner === me ? "win" : "lose";
    const mine = s.moves.filter((m) => m[2] === me).length;
    const foe = online() ? String(nm[op]).slice(0, 16) : "máy (" + (s.aiLevel === "easy" ? "Dễ" : "Khó") + ")";
    const title = res === "draw" ? "Hòa " + foe : (res === "win" ? "Thắng " : "Thua ") + foe + " sau " + s.moves.length + " nước";
    const tagline = res === "draw" ? "Kín cả bàn mà chưa ai lọt 5 — kỳ phùng địch thủ!"
      : res === "lose" ? (online() ? "Bị chặn đầu rồi, ván sau phục thù!" : "Máy chặn hết đường, ván sau phục thù!")
      : mine <= 12 ? "Năm quân thẳng tắp, đối thủ chưa kịp chớp mắt!"
      : mine <= 25 ? "Caro thủ thứ thiệt, chặn đâu đánh đó!" : "Lì đòn tới cùng, cuối cùng cũng lọt 5!";
    shareResult({
      game: "co-caro", title, tagline,
      lines: [
        online() ? "Đối thủ: " + nm[op] : "Mức máy: " + (s.aiLevel === "easy" ? "Dễ" : "Khó"),
        "Số nước: " + s.moves.length + " (của bạn " + mine + ")",
        "Bàn: " + s.size + "×" + s.size + (s.rule === "block2" ? ", chặn 2 đầu" : ", tự do"),
        "Tỉ số các ván: " + s.score[me] + " – " + s.score[op] + (s.score.draw ? " (hòa " + s.score.draw + ")" : ""),
      ],
    });
  }
  function clearTimers() { clearTimeout(aiTimer); clearTimeout(endTimer); thinking = false; }

  // ---------- Hành động ----------
  function place(r, c) {
    if (!s || s.winner || !ui.ovMenu.hidden || !ui.ovPause.hidden || !ui.ovEnd.hidden) return false;
    if (blocked()) return false;
    if (online()) {
      if (!canPlay(s, r, c)) { if (s.board[r * s.size + c]) { fx.bad = { r, c, t: performance.now() }; sfx.play("trung-da", 0.35); } return false; }
      sent = net.send({ t: "move", r, c }); pending = null;
      if (!sent) toast("Đang nối lại máy chủ…");
      hud();
      return sent;
    }
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
    if (room) return false; // chơi online không có đi lại
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
    if (room) { if (s.winner) net.send({ t: "again" }); return; }
    clearTimers();
    s = s.winner ? nextRound(s) : { ...newRound(s, s.first), round: s.round };
    pending = null; fx = { drop: null, win: null, bad: null };
    overlay(null); persist(); hud(); cv.focus({ preventScroll: true }); sfx.play("qua-man", 0.4); maybeAi();
  }
  function setPause(on) {
    if (!s || !ui.ovMenu.hidden || !ui.ovEnd.hidden) return;
    ui.menuP.textContent = room ? "Rời phòng" : "Về menu";
    if (on) {
      ui.pSub.textContent = "Ván " + s.round + " · " + s.moves.length + " nước · tỉ số " + s.score[1] + " – " + s.score[2];
      overlay("pause"); $("resumeBtn").focus({ preventScroll: true }); sfx.play("buoc-nhay", 0.35);
    } else { overlay(null); cv.focus({ preventScroll: true }); sfx.play("buoc-nhay", 0.35); }
  }

  // ---------- Nhập liệu ----------
  // Chuột: một lần bấm là đặt. Cảm ứng/bút: chạm ô để chọn (hiện quân mờ), chạm ô khác để đổi, bấm nút ĐẶT để đặt — chống bấm nhầm ô nhỏ.
  const markTouch = () => document.body.classList.add("touch");
  try { if (matchMedia("(any-pointer: coarse)").matches) markTouch(); } catch {}
  function onPointerDown(e) {
    if (e.button > 0) return;
    if (e.pointerType !== "mouse") markTouch();
    const cell = cellAt(e.clientX, e.clientY);
    if (!cell || !s) return;
    if (e.pointerType === "mouse") { cursor = null; place(cell[0], cell[1]); hover = null; }
    else if (s && !s.winner && !blocked() && ui.ovPause.hidden && ui.ovEnd.hidden) {
      if (s.board[cell[0] * s.size + cell[1]]) { fx.bad = { r: cell[0], c: cell[1], t: performance.now() }; pending = null; sfx.play("trung-da", 0.35); } // ô đã có quân: cùng tiếng lỗi như bấm chuột
      else pending = cell;
      cursor = null; hud();
    }
  }
  function onPointerMove(e) { if (e.pointerType === "mouse") hover = cellAt(e.clientX, e.clientY); }
  cv.addEventListener("pointerdown", onPointerDown);
  cv.addEventListener("pointermove", onPointerMove);
  cv.addEventListener("pointerleave", () => { hover = null; });
  ui.place.onclick = () => { if (canConfirm()) place(pending[0], pending[1]); cv.focus({ preventScroll: true }); };
  ui.undo.onclick = doUndo;
  ui.next.onclick = doNext;
  ui.menu.onclick = () => setPause(ui.ovPause.hidden);
  ui.mute.onclick = toggleMute;
  $("resumeBtn").onclick = () => setPause(false);
  $("restartBtn").onclick = doNext;
  // Về menu giữa ván: ván dở vẫn được giữ để "Chơi tiếp ván dở".
  $("menuBtnP").onclick = () => { if (room) return leaveRoom(); pendingResume = s && !s.winner && s.moves.length ? s : null; showMenu(); };
  $("menuBtnE").onclick = () => { if (room) return net.leave(); pendingResume = null; showMenu(); };
  $("nextBtn").onclick = doNext;
  $("shareBtn").onclick = shareEnd;
  $("viewBtn").onclick = () => { overlay(null); cv.focus({ preventScroll: true }); };

  function onKey(e) {
    if (e.target.closest && e.target.closest(".seg, input")) return;
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
    if (online() && now - lastHud > 500) { lastHud = now; hud(); } // đếm ngược hạn đánh
    raf = requestAnimationFrame(frame);
  }
  showMute(); layout(); showMenu(); raf = requestAnimationFrame(frame);
  {
    const q = new URLSearchParams(location.search), code = String(q.get("room") || "").toUpperCase();
    const seat = net.seat;
    if (CODE_RE.test(code)) ui.codeIn.value = code; // vào lại thất bại (ghế hết hạn / phòng đã hết) ⇒ ô mã vẫn điền sẵn
    if (seat && seat.code && (!code || code === seat.code)) { net.resume(); ui.mErr.textContent = "Đang vào lại phòng " + seat.code + "…"; }
    else if (CODE_RE.test(code)) {
      ui.codeIn.value = code;
      ui.mNote.textContent = "Bạn được mời vào phòng " + code + " — nhập tên rồi bấm Vào phòng.";
      (ui.nameIn.value ? ui.joinBtn : ui.nameIn).focus({ preventScroll: true });
    }
  }

  return {
    get state() { return s; },
    get thinking() { return thinking; },
    get room() { return room; }, get mySide() { return mySide(); }, net,
    get pending() { return pending; },
    get layout() { return { ...L }; },
    sfx,
    // Tâm ô (r,c) theo toạ độ CSS của trang — dùng cho test bấm thật.
    cellPoint(r, c) {
      const b = cv.getBoundingClientRect();
      return { x: b.left + (L.ox + c * L.cs + L.cs / 2) / L.dpr, y: b.top + (L.oy + r * L.cs + L.cs / 2) / L.dpr };
    },
    place, undo: doUndo, next: doNext,
    destroy() { destroyed = true; net.close(); clearTimers(); cancelAnimationFrame(raf); ro.disconnect(); sfx.close(); window.removeEventListener("keydown", onKey); homeLinks.forEach((a) => a.removeEventListener("click", onHomeClick)); },
  };
}
