// Cờ Tướng — phần vẽ (canvas), điều khiển, HUD, âm thanh, lưu ván, online. Luật ở logic.js, máy chơi ở ai.js.
// Quân + bàn hiện do code vẽ (placeholder); khi có ảnh của Codex chỉ cần thay drawPiece/drawBoard, không đổi luật.
import { W, RED, BLACK, START, parse, sideOf, typeOf, newMatch, newRound, nextRound, play, undo, replay, resign, agreeDraw,
  legalFrom, isAiTurn, other, moveName, REASON, findKing } from "./logic.js";
import { bestMove, evaluate } from "./ai.js";
import { createNet, CODE_RE } from "./net.js?v=kk1";
import { shareResult } from "../_shared/share.js?v=s2";
import { isChatOff, initChatOff } from "../_shared/chat-off.js?v=co1";
import { sharedName, initKick, kickButtonHTML, BANNED_TEXT, KICK_ERR } from "../_shared/online-kit.js?v=ok2"; // tên dùng chung + "Mời ra"

const SAVE_KEY = "wgp.tuong.v1";
const NAME_KEY = "wgp.tuong.name";
const C = {
  frame: "#6b4426", frameHi: "#93623a", frameD: "#3e2412", line: "#0a0807",
  paperA: "#ecdcb4", paperB: "#e3cf9f", grid: "#7a5a30", river: "#d9c48f", riverInk: "#8a6a3a",
  gold: "#ffc94a", goldD: "#a8741a", teal: "#2f8f7f", tealL: "#6fd0bb", bad: "#e0483d",
  face: "#f2e3bd", faceHi: "#fff4d6", faceD: "#c9b07a",
  red: "#c8342c", redD: "#5a1410", blk: "#2a2e36", blkD: "#0a0c10",
};
const GLYPH = { K: "帥", A: "仕", B: "相", N: "傌", R: "俥", C: "炮", P: "兵", k: "將", a: "士", b: "象", n: "馬", r: "車", c: "砲", p: "卒" };
const SIDE = { 1: "Đỏ", 2: "Đen" };
const GLYPH_FONT = '"Noto Serif SC","Noto Serif CJK SC","Source Han Serif SC","SimSun","Songti SC","Microsoft YaHei","PingFang SC",serif';

// Ảnh của Codex (assets/HANDOFF.md): board-grid.webp lưới đúng 64px, lề 32px; pieces.png atlas 7×2 khung 64px (hàng 0 Đỏ, hàng 1 Đen).
// Chưa tải xong / lỗi tải thì vẽ tạm bằng code (giữ nguyên chơi được).
const PIECE_FILE = { K: "general", A: "advisor", B: "elephant", N: "horse", R: "rook", C: "cannon", P: "pawn" };
const ATLAS_COL = "KABNRCP";
const PIECE_VER = "han1"; // bộ quân chữ Hán (thay bộ ký hiệu Latin cũ cùng tên file) — đổi số này khi Codex giao bộ ảnh mới để trình duyệt bỏ ảnh cũ đã lưu
const pieceSrc = (pc) => "assets/pieces/" + (sideOf(pc) === RED ? "red-" : "black-") + PIECE_FILE[pc.toUpperCase()] + ".png?v=" + PIECE_VER;
function loadImg(src) { const im = new Image(); im.decoding = "async"; im.src = new URL(src, import.meta.url).href; return im; }
const IMG = { board: loadImg("assets/board-grid.webp"), atlas: loadImg("assets/pieces.png?v=" + PIECE_VER) };
const ready = (im) => im.complete && im.naturalWidth > 0;
function pieceHtml(pc) { return `<img src="${pieceSrc(pc)}" alt="" width="64" height="64" style="display:block;width:100%;height:100%;image-rendering:pixelated">`; }
function pieceSvg(pc) {
  const red = sideOf(pc) === RED, ink = red ? C.red : C.blk;
  return `<svg viewBox="0 0 20 20" aria-hidden="true" width="100%" height="100%"><circle cx="10.6" cy="11" r="9" fill="rgba(0,0,0,.45)"/>` +
    `<circle cx="10" cy="10" r="9" fill="${C.line}"/><circle cx="10" cy="10" r="8" fill="${C.face}"/><circle cx="10" cy="10" r="6.4" fill="none" stroke="${ink}" stroke-width="1"/>` +
    `<text x="10" y="10.4" text-anchor="middle" dominant-baseline="central" font-size="9" font-weight="700" fill="${ink}" font-family='${GLYPH_FONT}'>${GLYPH[pc]}</text></svg>`;
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
const DEFAULT_OPTS = { mode: "ai", aiLevel: "easy" };
const ERR = {
  "no-room": "Không tìm thấy phòng — kiểm tra lại mã phòng.",
  full: "Phòng đã đủ 2 người.",
  started: "Phòng này đang chơi, không vào thêm được.",
  "not-host": "Chỉ chủ phòng làm được việc này.",
  "need-2": "Cần đủ 2 người mới bắt đầu được.",
  "not-turn": "Chưa tới lượt bạn.",
  illegal: "Nước này không hợp lệ.",
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
const isMoves = (a) => Array.isArray(a) && a.length <= 1000 && a.every((m) => Array.isArray(m) && Number.isInteger(m[0]) && Number.isInteger(m[1]));
function loadSave() {
  try {
    const v = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!v || typeof v !== "object") return { opts: { ...DEFAULT_OPTS }, game: null };
    const o = v.opts || {};
    // Bản lưu cũ có mode "pvp" (2 người chung máy, đã bỏ) → chuyển sang chơi với máy.
    const opts = { mode: o.mode === "online" ? "online" : "ai", aiLevel: o.aiLevel === "normal" ? "normal" : "easy" };
    let game = null;
    const g = v.game;
    // Ván dở của chế độ chung máy cũ thì bỏ (không ép thành ván với máy giữa chừng).
    if (g && g.mode === "ai" && isMoves(g.moves)) {
      // Dựng lại từ danh sách nước đi (kiểm tra luật từng nước) để không tin bàn cờ đã lưu.
      const base = { ...newMatch({ mode: g.mode, aiLevel: g.aiLevel }), score: { 1: g.score?.[1] | 0, 2: g.score?.[2] | 0, draw: g.score?.draw | 0 }, round: Math.max(1, g.round | 0) };
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
    plR: $("plR"), plB: $("plB"), nR: $("nR"), nB: $("nB"), sR: $("sR"), sB: $("sB"), gR: $("gR"), gB: $("gB"), tR: $("tR"), tB: $("tB"),
    round: $("hRound"), status: $("hStatus"), draw: $("hDraw"),
    undo: $("undoBtn"), drawBtn: $("drawBtn"), resign: $("resignBtn"), next: $("newBtn"), menu: $("menuBtn"), mute: $("muteBtn"), muteIc: $("muteIc"), tip: $("tip"),
    ovMenu: $("ovMenu"), ovPause: $("ovPause"), ovEnd: $("ovEnd"), mResume: $("mResume"), mNote: $("mNote"),
    vEntry: $("vEntry"), vSolo: $("vSolo"), createBtn: $("createBtn"), soloBtn: $("soloBtn"), resumeGame: $("resumeGameBtn"), startBtn: $("startBtn"),
    eTitle: $("eTitle"), eSub: $("eSub"), eResult: $("eResult"), pSub: $("pSub"),
    nameIn: $("nameIn"), codeIn: $("codeIn"), joinBtn: $("joinBtn"), mErr: $("mErr"),
    ovRoom: $("ovRoom"), rCode: $("rCode"), rSeats: $("rSeats"), rNote: $("rNote"), rStart: $("rStart"), rCopy: $("rCopy"), rLeave: $("rLeave"), rDisband: $("rDisband"), eDisband: $("eDisband"),
    toast: $("toast"), menuP: $("menuBtnP"), menuE: $("menuBtnE"),
    offer: $("offer"), offerT: $("offerT"), offerYes: $("offerYes"), offerNo: $("offerNo"),
    logList: $("logList"), logN: $("logN"),
    chat: $("chat"), chatLog: $("chatLog"), chatF: $("chatF"), chatIn: $("chatIn"), chatBtn: $("chatBtn"), chatN: $("chatN"), chatX: $("chatX"),
  };
  const TIP_KEY = "wgp.co-tuong.tip", TIP_MAX = 3;
  let tipCount = 0; try { tipCount = Number(localStorage.getItem(TIP_KEY)) || 0; } catch {}
  root.querySelectorAll(".pcR").forEach((e) => { e.innerHTML = pieceHtml("K"); });
  root.querySelectorAll(".pcB").forEach((e) => { e.innerHTML = pieceHtml("k"); });
  const sfx = makeSfx("assets/sfx/", ["buoc-nhay", "trung-da", "do-xuc-xac", "thang", "thua", "qua-man", "tin-nhan"], sdk);

  const saved = loadSave();
  let opts = saved.opts;
  opts.mode = "ai"; // màn vào game không còn ô "Chế độ": chơi trên máy luôn là với máy, online đi qua phòng
  let s = null;                 // trạng thái ván (null = chưa vào trận)
  let pendingResume = saved.game && !saved.game.winner && saved.game.moves.length ? saved.game : null;
  let destroyed = false, raf = 0, aiTimer = 0, endTimer = 0, thinking = false;
  let L = { cs: 30, ox: 0, oy: 0, fr: 10, m: 18, dpr: 1, w: 0, h: 0 };
  let sel = -1, dests = [], hover = -1, cursor = null;   // cursor = [hàng, cột] theo góc nhìn trên màn hình
  let fx = { move: null, bad: null, check: 0 };
  let drawAsked = -1;           // chơi với máy: đã cầu hòa ở nước thứ mấy (mỗi nước 1 lần)
  // ---- Online: máy chủ giữ ván; client chỉ gửi "đi quân f → to" rồi dựng lại theo danh sách nước máy chủ gửi về.
  let room = null, skew = 0, sent = false, toastTimer = 0, lastHud = 0;
  const online = () => !!room && room.phase !== "lobby";
  const mySide = () => (room ? (room.you === room.redSeat ? RED : BLACK) : 0);
  const flip = () => online() && mySide() === BLACK;      // cầm Đen thì xoay bàn để quân mình ở dưới
  const blocked = () => thinking || isAiTurn(s) || (online() && (s.turn !== mySide() || sent));
  const seatOfSide = (side) => (side === RED ? room.redSeat : 1 - room.redSeat);
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
    const shadow = Math.round(5 * dpr);
    // 9 cột × 10 hàng giao điểm; lề giấy 0,62 ô mỗi bên (đủ chỗ nửa quân), khung gỗ 0,24 ô
    const cs = Math.max(8, Math.floor(Math.min((w - shadow - 4) / (8 + 1 + 0.48), (h - shadow - 4) / (9 + 1 + 0.48))));
    const m = Math.round(cs * 0.5), fr = Math.max(Math.round(4 * dpr), Math.round(cs * 0.24));
    const bw = cs * 8 + 2 * (m + fr), bh = cs * 9 + 2 * (m + fr);
    L = { cs, m, fr, dpr, w, h, ox: Math.floor((w - shadow - bw) / 2) + fr + m, oy: Math.floor((h - shadow - bh) / 2) + fr + m };
  }
  const disp = (k) => { const r = Math.floor(k / W), c = k % W; return flip() ? [9 - r, 8 - c] : [r, c]; };
  const fromDisp = (dr, dc) => (flip() ? (9 - dr) * W + (8 - dc) : dr * W + dc);
  const pt = (k) => { const [dr, dc] = disp(k); return [L.ox + dc * L.cs, L.oy + dr * L.cs]; };
  function sqAt(clientX, clientY) {
    const r = cv.getBoundingClientRect();
    const x = (clientX - r.left) * L.dpr - L.ox, y = (clientY - r.top) * L.dpr - L.oy;
    const dc = Math.round(x / L.cs), dr = Math.round(y / L.cs);
    if (dr < 0 || dc < 0 || dr > 9 || dc > 8) return -1;
    if (Math.hypot(x - dc * L.cs, y - dr * L.cs) > L.cs * 0.52) return -1;
    return fromDisp(dr, dc);
  }
  const ro = new ResizeObserver(() => { layout(); draw(performance.now()); });
  ro.observe(stage);

  // ---------- Vẽ ----------
  function px(x0, y0, x1, y1, t, col) { // đoạn thẳng bằng ô vuông pixel (đường chéo cung)
    g2.fillStyle = col;
    const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) / Math.max(1, t * 0.7));
    for (let i = 0; i <= n; i++) g2.fillRect(Math.round(x0 + (x1 - x0) * i / n - t / 2), Math.round(y0 + (y1 - y0) * i / n - t / 2), t, t);
  }
  function drawBoard() {
    const { cs, m, fr, ox, oy, dpr } = L, bw = cs * 8, bh = cs * 9;
    const sh = Math.round(5 * dpr), b = Math.max(2, Math.round(3 * dpr)), X0 = ox - m - fr, Y0 = oy - m - fr, TW = bw + 2 * (m + fr), TH = bh + 2 * (m + fr);
    g2.fillStyle = "rgba(0,0,0,.6)"; g2.fillRect(X0 + sh, Y0 + sh, TW, TH);
    g2.fillStyle = C.line; g2.fillRect(X0 - b, Y0 - b, TW + 2 * b, TH + 2 * b);
    g2.fillStyle = C.frame; g2.fillRect(X0, Y0, TW, TH);
    const bv = Math.max(1, Math.round(2 * dpr));
    g2.fillStyle = C.frameHi; g2.fillRect(X0, Y0, TW, bv); g2.fillRect(X0, Y0, bv, TH);
    g2.fillStyle = C.frameD; g2.fillRect(X0, Y0 + TH - bv, TW, bv); g2.fillRect(X0 + TW - bv, Y0, bv, TH);
    // Viền trong theo màu bên đang tới lượt
    if (s && !s.winner) {
      const t = Math.max(2, Math.round(fr / 3));
      g2.fillStyle = s.turn === RED ? C.red : C.blk;
      g2.fillRect(ox - m - t, oy - m - t, bw + 2 * m + 2 * t, t); g2.fillRect(ox - m - t, oy + bh + m, bw + 2 * m + 2 * t, t);
      g2.fillRect(ox - m - t, oy - m, t, bh + 2 * m); g2.fillRect(ox + bw + m, oy - m, t, bh + 2 * m);
    }
    const lw = Math.max(1, Math.round(dpr * 1.25));
    if (ready(IMG.board)) {
      g2.imageSmoothingEnabled = false;
      const k = cs / 64; // ảnh: giao điểm (c, r) ở (32 + 64c, 32 + 64r)
      g2.drawImage(IMG.board, ox - 32 * k, oy - 32 * k, IMG.board.naturalWidth * k, IMG.board.naturalHeight * k);
      g2.fillStyle = "#1b120c";
    } else {
    // Giấy: sọc ngang nhẹ kiểu pixel
    const band = Math.max(2, Math.round(cs / 4));
    for (let y = 0; y < bh + 2 * m; y += band) { g2.fillStyle = (y / band) % 2 ? C.paperB : C.paperA; g2.fillRect(ox - m, oy - m + y, bw + 2 * m, Math.min(band, bh + 2 * m - y)); }
    // Sông
    g2.fillStyle = C.river; g2.fillRect(ox, oy + 4 * cs, bw, cs);
    g2.fillStyle = C.grid;
    for (let r = 0; r < 10; r++) g2.fillRect(ox, oy + r * cs, bw + lw, lw);
    for (let c = 0; c < 9; c++) {
      if (c === 0 || c === 8) { g2.fillRect(ox + c * cs, oy, lw, bh); continue; }
      g2.fillRect(ox + c * cs, oy, lw, 4 * cs); g2.fillRect(ox + c * cs, oy + 5 * cs, lw, 4 * cs);
    }
    // Khung ngoài đậm hơn
    const ow = lw * 2;
    g2.fillRect(ox - ow - lw, oy - ow - lw, bw + 2 * ow + 3 * lw, lw); g2.fillRect(ox - ow - lw, oy + bh + ow + lw, bw + 2 * ow + 3 * lw, lw);
    g2.fillRect(ox - ow - lw, oy - ow - lw, lw, bh + 2 * ow + 3 * lw); g2.fillRect(ox + bw + ow + lw, oy - ow - lw, lw, bh + 2 * ow + 3 * lw);
    // Cung (chéo)
    for (const r0 of [0, 7]) {
      px(ox + 3 * cs, oy + r0 * cs, ox + 5 * cs, oy + (r0 + 2) * cs, lw, C.grid);
      px(ox + 5 * cs, oy + r0 * cs, ox + 3 * cs, oy + (r0 + 2) * cs, lw, C.grid);
    }
    g2.fillStyle = C.grid;
    }
    // Dấu vị trí Pháo / Tốt
    const d = Math.max(2, Math.round(cs * 0.09)), len = Math.max(3, Math.round(cs * 0.2));
    const marks = [[2, 1], [2, 7], [7, 1], [7, 7], ...[0, 2, 4, 6, 8].flatMap((c) => [[3, c], [6, c]])];
    for (const [r, c] of marks) {
      const X = ox + c * cs, Y = oy + r * cs;
      for (const sx of [-1, 1]) {
        if ((c === 0 && sx < 0) || (c === 8 && sx > 0)) continue;
        for (const sy of [-1, 1]) {
          const ax = X + sx * d + (sx < 0 ? -len : lw), ay = Y + sy * d + (sy < 0 ? -lw : lw);
          g2.fillRect(ax, ay, len, lw);
          g2.fillRect(X + sx * d + (sx < 0 ? -lw : lw), Y + sy * d + (sy < 0 ? -len : lw), lw, len);
        }
      }
    }
    // Chữ trên sông
    const fs = Math.max(9, Math.round(cs * 0.42));
    g2.font = `800 ${fs}px "Be Vietnam Pro", system-ui, sans-serif`; g2.textAlign = "center"; g2.textBaseline = "middle"; g2.fillStyle = C.riverInk;
    g2.fillText("SỞ HÀ", ox + 2 * cs, oy + 4.5 * cs + 1); g2.fillText("HÁN GIỚI", ox + 6 * cs, oy + 4.5 * cs + 1);
  }
  function drawPiece(pc, X, Y, alpha = 1, lift = 0) {
    if (ready(IMG.atlas)) {
      const S = Math.round(L.cs * 0.96), o = Math.max(1, Math.round(L.dpr)), col = ATLAS_COL.indexOf(pc.toUpperCase()), row = sideOf(pc) === RED ? 0 : 1;
      g2.globalAlpha = alpha * 0.4; g2.fillStyle = "#000"; g2.beginPath(); g2.arc(X + 2 * o, Y + 3 * o, S * 0.45, 0, 7); g2.fill();
      g2.globalAlpha = alpha; g2.imageSmoothingEnabled = false;
      g2.drawImage(IMG.atlas, col * 64, row * 64, 64, 64, Math.round(X - S / 2), Math.round(Y - lift - S / 2), S, S);
      g2.globalAlpha = 1;
      return;
    }
    const R = Math.round(L.cs * 0.45), red = sideOf(pc) === RED, ink = red ? C.red : C.blk, o = Math.max(1, Math.round(L.dpr));
    g2.globalAlpha = alpha;
    g2.fillStyle = "rgba(0,0,0,.45)"; g2.beginPath(); g2.arc(X + 2 * o, Y + 3 * o + lift, R, 0, 7); g2.fill();
    Y -= lift;
    g2.fillStyle = C.line; g2.beginPath(); g2.arc(X, Y, R, 0, 7); g2.fill();
    g2.fillStyle = C.faceD; g2.beginPath(); g2.arc(X, Y, R - o * 1.5, 0, 7); g2.fill();
    g2.fillStyle = C.face; g2.beginPath(); g2.arc(X, Y - o, R - o * 2.5, 0, 7); g2.fill();
    g2.strokeStyle = ink; g2.lineWidth = Math.max(1, R * 0.08); g2.beginPath(); g2.arc(X, Y - o, R * 0.74, 0, 7); g2.stroke();
    g2.fillStyle = ink; g2.font = `700 ${Math.round(R * 1.08)}px ${GLYPH_FONT}`; g2.textAlign = "center"; g2.textBaseline = "middle";
    g2.fillText(GLYPH[pc], X, Y - o + R * 0.04);
    g2.globalAlpha = 1;
  }
  function ring(X, Y, R, t, col) { g2.strokeStyle = col; g2.lineWidth = t; g2.beginPath(); g2.arc(X, Y, R, 0, 7); g2.stroke(); }
  function brackets(X, Y, S, col, t) { // 4 góc vuông quanh ô (tâm X,Y, cạnh S)
    const k = Math.max(t * 2, Math.floor(S / 4)), x0 = X - S / 2, y0 = Y - S / 2;
    g2.fillStyle = col;
    for (const [ax, ay, sx, sy] of [[x0, y0, 1, 1], [x0 + S, y0, -1, 1], [x0, y0 + S, 1, -1], [x0 + S, y0 + S, -1, -1]]) {
      g2.fillRect(sx > 0 ? ax : ax - k, sy > 0 ? ay : ay - t, k, t);
      g2.fillRect(sx > 0 ? ax : ax - t, sy > 0 ? ay : ay - k, t, k);
    }
  }
  function draw(now) {
    g2.setTransform(1, 0, 0, 1, 0, 0);
    g2.clearRect(0, 0, L.w, L.h);
    drawBoard();
    const board = s ? s.board : parse(START), cs = L.cs, t = Math.max(2, Math.round(cs / 14));
    const last = s && s.moves[s.moves.length - 1];
    if (last) { const [fx0, fy0] = pt(last[0]); brackets(fx0, fy0, cs * 0.9, "rgba(168,116,26,.85)", t); }
    // Tướng đang bị chiếu: vòng đỏ nhấp nháy
    let chkK = -1;
    if (s && s.check && (!s.winner || s.reason === "checkmate")) chkK = findKing(s.board, s.turn);
    let moving = null;
    if (fx.move) { const k = (now - fx.move.t0) / 170; if (k >= 1) fx.move = null; else moving = { ...fx.move, k }; }
    for (let k = 0; k < 90; k++) {
      const pc = board[k]; if (pc === ".") continue;
      if (moving && moving.t === k) continue;
      const [X, Y] = pt(k);
      drawPiece(pc, X, Y, 1, k === sel ? Math.round(cs * 0.08) : 0);
    }
    if (moving) {
      const [x0, y0] = pt(moving.f), [x1, y1] = pt(moving.t), e = 1 - (1 - moving.k) ** 2;
      drawPiece(board[moving.t], x0 + (x1 - x0) * e, y0 + (y1 - y0) * e, 1, Math.round(Math.sin(moving.k * Math.PI) * cs * 0.12));
    }
    if (last && !moving) { const [X, Y] = pt(last[1]); brackets(X, Y, cs * 1.02, C.gold, t); }
    if (chkK >= 0) { const [X, Y] = pt(chkK); const on = Math.floor(now / 280) % 2; ring(X, Y, cs * 0.5, t + 1, on ? C.bad : "rgba(224,72,61,.55)"); }
    if (sel >= 0) {
      const [X, Y] = pt(sel); ring(X, Y - Math.round(cs * 0.08), cs * 0.49, t, C.gold);
      for (const d of dests) {
        const [dx, dy] = pt(d);
        if (board[d] !== ".") brackets(dx, dy, cs * 0.96, C.teal, t + 1);
        else { const r = Math.max(3, Math.round(cs * 0.13)); g2.fillStyle = C.line; g2.fillRect(dx - r - 1, dy - r - 1, 2 * r + 2, 2 * r + 2); g2.fillStyle = C.tealL; g2.fillRect(dx - r, dy - r, 2 * r, 2 * r); }
      }
    }
    if (s && hover >= 0 && hover !== sel && canAct() && sideOf(board[hover]) === s.turn) { const [X, Y] = pt(hover); ring(X, Y, cs * 0.48, Math.max(1, t - 1), "rgba(255,201,74,.6)"); }
    if (fx.bad) {
      const k = (now - fx.bad.t) / 320;
      if (k >= 1) fx.bad = null; else { const [X, Y] = pt(fx.bad.k); ring(X, Y, cs * 0.48, t + 1, `rgba(224,72,61,${1 - k})`); }
    }
    if (cursor && s && !s.winner) { const k = fromDisp(cursor[0], cursor[1]); const [X, Y] = pt(k); brackets(X, Y, cs * 1.1, "#fff", Math.max(2, t - 1)); }
    // Chữ "CHIẾU!" nổi lên giữa bàn
    if (fx.check) {
      const k = (now - fx.check) / 1100;
      if (k >= 1) fx.check = 0;
      else {
        const fs = Math.round(cs * 1.1), y = L.oy + 4.5 * cs - Math.round(k * cs * 0.4);
        g2.globalAlpha = k < 0.75 ? 1 : (1 - k) * 4;
        g2.font = `800 ${fs}px "Be Vietnam Pro", system-ui, sans-serif`; g2.textAlign = "center"; g2.textBaseline = "middle";
        g2.lineWidth = Math.max(3, Math.round(fs / 7)); g2.strokeStyle = C.line; g2.strokeText("CHIẾU!", L.ox + 4 * cs, y);
        g2.fillStyle = "#ff6a5c"; g2.fillText("CHIẾU!", L.ox + 4 * cs, y);
        g2.globalAlpha = 1;
      }
    }
  }

  // ---------- HUD ----------
  function names() {
    if (room) {
      if (!s) return { 1: room.players[0]?.name || "Chủ phòng", 2: room.players[1]?.name || "Đang chờ…" };
      return { 1: room.players[seatOfSide(RED)]?.name || "Đỏ", 2: room.players[seatOfSide(BLACK)]?.name || "Đen" };
    }
    const mode = s?.mode ?? opts.mode;
    if (mode === "ai") return { 1: "Bạn", 2: "Máy" }; // mức máy ghi riêng ở thẻ khoe; tên dài bị cắt "Máy (…" trên điện thoại
    return { 1: "Người 1", 2: "Người 2" };
  }
  const scores = () => (online() ? { 1: room.score[seatOfSide(RED)], 2: room.score[seatOfSide(BLACK)], draw: room.draws } : s ? s.score : { 1: 0, 2: 0, draw: 0 });
  let logKey = "";
  function renderLog() {
    const moves = s ? s.moves : [];
    const key = (room ? room.gid : "l") + ":" + moves.length + ":" + (moves.at(-1) || []).join(",");
    if (key === logKey) return; logKey = key;
    ui.logN.textContent = moves.length ? moves.length + " nước" : "";
    if (!moves.length) { ui.logList.innerHTML = `<li class="empty">${s ? "Đỏ đi trước." : "Chưa có nước đi."}</li>`; return; }
    let b = parse(START); const out = [];
    moves.forEach(([f, t], i) => {
      const nm = esc(moveName(b, f, t)); b = b.slice(); b[t] = b[f]; b[f] = ".";
      const cur = i === moves.length - 1 ? " cur" : "";
      if (i % 2 === 0) out.push(`<li class="n">${i / 2 + 1}.</li><li class="r${cur}">${nm}</li>`);
      else out.push(`<li class="k${cur}">${nm}</li>`);
    });
    ui.logList.innerHTML = out.join("");
    ui.logList.scrollTop = ui.logList.scrollHeight;
  }
  function hud() {
    const nm = names(), sc = scores();
    ui.nR.textContent = nm[1]; ui.nB.textContent = nm[2];
    document.body.classList.toggle("is-online", !!room);
    document.body.classList.toggle("live", !!s && !s.winner);
    const tag = (side) => "Quân " + SIDE[side] + (online() && mySide() === side ? " · Bạn" : "") +
      (online() && room.players[seatOfSide(side)] && !room.players[seatOfSide(side)].connected ? " · mất kết nối" : "");
    ui.gR.textContent = tag(RED); ui.gB.textContent = tag(BLACK);
    renderLog();
    ui.offer.hidden = !(online() && !s.winner && room.drawOffer === 1 - room.you);
    if (!s) {
      ui.sR.textContent = "0"; ui.sB.textContent = "0"; ui.round.textContent = room ? "Phòng " + room.code : "Chưa bắt đầu"; ui.status.textContent = room ? "Phòng chờ" : "Sẵn sàng"; ui.draw.textContent = "Hòa 0";
      ui.status.classList.remove("chk");
      ui.plR.classList.remove("on", "win", "chk"); ui.plB.classList.remove("on", "win", "chk");
      for (const b of [ui.undo, ui.next, ui.drawBtn, ui.resign]) b.disabled = true;
      ui.tip.hidden = true;
      return;
    }
    ui.sR.textContent = sc[1]; ui.sB.textContent = sc[2]; ui.draw.textContent = "Hòa " + sc.draw;
    ui.round.textContent = "Ván " + (online() ? room.round : s.round) + " · " + s.moves.length + " nước";
    const live = !s.winner;
    ui.plR.classList.toggle("on", live && s.turn === RED); ui.plB.classList.toggle("on", live && s.turn === BLACK);
    ui.plR.classList.toggle("chk", live && s.check && s.turn === RED); ui.plB.classList.toggle("chk", live && s.check && s.turn === BLACK);
    ui.tR.textContent = live && s.check && s.turn === RED ? "Bị chiếu" : "Lượt"; ui.tB.textContent = live && s.check && s.turn === BLACK ? "Bị chiếu" : "Lượt";
    ui.plR.classList.toggle("win", s.winner === RED); ui.plB.classList.toggle("win", s.winner === BLACK);
    const chk = live && s.check ? " · Chiếu!" : "";
    let st = s.winner === 3 ? "Hòa!" : s.winner ? nm[s.winner] + " thắng!" : thinking ? "Máy đang nghĩ…" + chk : "Lượt " + SIDE[s.turn] + " · " + nm[s.turn] + chk;
    if (online() && live) {
      const left = room.deadline ? Math.max(0, Math.ceil((room.deadline - (Date.now() + skew)) / 1000)) : 0;
      const t = left && left <= 15 ? " · " + left + "s" : "";
      const opp = room.players[seatOfSide(s.turn)];
      st = s.turn === mySide() ? "Lượt bạn (" + SIDE[s.turn] + ")" + chk + t : opp && !opp.connected ? nm[s.turn] + " mất kết nối…" + t : "Chờ " + nm[s.turn] + " đi…" + chk + t;
    }
    if (online() && s.winner && s.winner !== 3) st = s.winner === mySide() ? "Bạn thắng!" : nm[s.winner] + " thắng!";
    ui.status.textContent = st; ui.status.classList.toggle("chk", live && s.check);
    const mineMoved = s.mode !== "ai" || s.moves.some((m, i) => i % 2 === 0);
    ui.undo.disabled = !live || !s.moves.length || !mineMoved || !!room;
    ui.resign.disabled = !live;
    if (online()) {
      const mine = room.drawOffer === room.you, theirs = room.drawOffer === 1 - room.you;
      ui.drawBtn.disabled = !live || mine;
      ui.drawBtn.textContent = theirs ? "Đồng ý hòa" : mine ? "Đã cầu hòa" : "Cầu hòa";
    } else {
      ui.drawBtn.disabled = !live || !s.moves.length || (s.mode === "ai" && (drawAsked === s.moves.length || thinking));
      ui.drawBtn.textContent = "Cầu hòa";
    }
    ui.next.disabled = !!room && live;
    ui.next.classList.toggle("btn--primary", !live);
    ui.next.firstChild.textContent = live ? "Ván mới" : "Ván tiếp ▶";
    // BRD-13: gợi ý chỉ hiện 3 lần chọn quân đầu tiên (nhớ qua các lần chơi), nằm ngoài bàn (cột biên bản / dưới bàn) — không che hàng quân nhà
    const wantTip = sel >= 0 && dests.length > 0 && matchMedia("(pointer: coarse)").matches;
    const showTip = wantTip && (!ui.tip.hidden || tipCount < TIP_MAX);
    if (showTip && ui.tip.hidden) { tipCount++; try { localStorage.setItem(TIP_KEY, String(tipCount)); } catch {} }
    ui.tip.hidden = !showTip;
  }
  function showMute() {
    const m = !!sdk.sound.muted;
    ui.mute.setAttribute("aria-pressed", String(m));
    ui.muteIc.src = "assets/ui/icon-am-thanh-" + (m ? "tat" : "bat") + ".png";
  }
  function toggleMute() { sdk.sound.muted = !sdk.sound.muted; localStorage.setItem("wgp.muted", sdk.sound.muted ? "1" : "0"); showMute(); }

  function persist() {
    if (room) return; // ván online do máy chủ giữ — không ghi đè ván dở chơi trên máy
    try {
      const game = s && !s.winner && s.moves.length ? { mode: s.mode, aiLevel: s.aiLevel, score: s.score, round: s.round, moves: s.moves.map(([f, t]) => [f, t]) } : null;
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
      opts[seg.dataset.k] = b.dataset.v;
      syncOpts(); persist();
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
  // Màn vào game: "entry" (tên · Tạo phòng online · mã phòng · Chơi với máy) → "solo" (tuỳ chọn chơi với máy)
  let view = "entry";
  function entryFocus() { return pendingResume ? ui.resumeGame : !ui.nameIn.value.trim() ? ui.nameIn : ui.createBtn; }
  function menuView(v, focusEl) {
    view = v;
    ui.vEntry.hidden = v !== "entry"; ui.vSolo.hidden = v !== "solo";
    ui.mErr.textContent = ""; ui.ovMenu.scrollTop = 0;
    (focusEl || (v === "solo" ? ui.startBtn : entryFocus())).focus({ preventScroll: true });
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
    s = null; resetSel(); cursor = null; fx = { move: null, bad: null, check: 0 };
    hud(); layout(); draw(performance.now());
    menuView("entry"); ui.mErr.textContent = err;
  }
  ui.soloBtn.onclick = () => menuView("solo");
  ui.resumeGame.onclick = () => { if (pendingResume) start(pendingResume); };
  ui.startBtn.onclick = () => start(null);
  $("soloBack").onclick = () => menuView("entry", ui.soloBtn);
  ui.createBtn.onclick = () => goOnline("create");
  // Esc ở bước 2 → quay lại màn đầu
  ui.ovMenu.addEventListener("keydown", (e) => { if (e.key === "Escape" && view !== "entry") { e.preventDefault(); e.stopPropagation(); menuView("entry", ui.soloBtn); } });

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
      if (code === "illegal" || code === "not-turn" || code === "stale") { sent = false; net.send({ t: "sync" }); }
      if (code !== "phase" && code !== "stale") toast(text); // lệnh từ ván/thế cờ cũ bị bỏ: chỉ đồng bộ lại, không báo lỗi
      hud();
    },
    offline(text) { busyMenu(false); if (room) { s = null; showMenu(text); } else ui.mErr.textContent = text; },
    reconnecting() { toast("Mất kết nối — đang nối lại…", 0); },
  }, { url: ctx.wsUrl });
  function busyMenu(on) { ui.ovMenu.querySelectorAll(".btn").forEach((b) => (b.disabled = on)); }
  function goOnline(kind) {
    const nm = myName.commit(ui.nameIn.value); // tên dùng chung toàn site (_shared/online-kit.js): sửa ở đây ⇒ mọi game cùng đổi
    if (!nm) { if (view !== "entry") menuView("entry"); ui.mErr.textContent = "Nhập tên của bạn trước nhé."; ui.nameIn.focus(); return; }
    try { localStorage.setItem(NAME_KEY, nm); } catch {}
    if (kind === "join") {
      const c = ui.codeIn.value.trim().toUpperCase();
      if (!CODE_RE.test(c)) { ui.mErr.textContent = "Mã phòng gồm 5 ký tự (chữ và số), ví dụ K7M2Q."; ui.codeIn.focus(); return; }
      net.join(c, nm);
    } else net.create(nm, !$("privateRoom").checked);
    ui.mErr.textContent = "Đang kết nối…"; busyMenu(true);
  }
  ui.joinBtn.onclick = () => goOnline("join");
  ui.codeIn.addEventListener("input", () => { ui.codeIn.value = ui.codeIn.value.toUpperCase().replace(/[^A-Z0-9]/g, ""); });
  const onEnter = (e) => { if (e.key === "Enter") { e.preventDefault(); goOnline(e.target === ui.codeIn || ui.codeIn.value ? "join" : "create"); } };
  ui.nameIn.addEventListener("keydown", onEnter); ui.codeIn.addEventListener("keydown", onEnter);
  ui.nameIn.addEventListener("input", () => { if (ui.mErr.textContent === "Nhập tên của bạn trước nhé.") ui.mErr.textContent = ""; });
  // Ô tên điền sẵn tên dùng chung (tài khoản); người cũ có tên riêng của game (NAME_KEY) được chuyển sang một lần.
  const myName = sharedName({ game: "co-tuong", input: ui.nameIn, legacy: () => { try { return localStorage.getItem(NAME_KEY) || ""; } catch { return ""; } } });
  initKick({ send: (o) => net.send(o) }); // chủ phòng "Mời ra" (hộp xác nhận pixel → máy chủ kiểm quyền)

  function showRoom(v) {
    const n = v.players.length, host = v.you === v.host;
    ui.rCode.textContent = v.code;
    ui.rSeats.innerHTML = [0, 1].map((i) => {
      const p = v.players[i], pc = i === 0 ? "K" : "k";
      if (!p) return `<div class="seat off"><span class="pc">${pieceHtml(pc)}</span><b>Đang chờ người chơi…</b><em>Chỗ trống</em></div>`;
      return `<div class="seat"><span class="pc">${pieceHtml(pc)}</span><b>${esc(p.name)}${i === v.you ? " (Bạn)" : ""}</b><em class="${p.connected ? "ok" : "bad"}">${i === v.host ? "Chủ phòng · " : ""}${p.connected ? "Sẵn sàng" : "Mất kết nối"}</em>${host && i !== v.you ? kickButtonHTML(i, p.name) : ""}</div>`;
    }).join("");
    ui.rStart.textContent = host ? "▶ Bắt đầu" : "Chờ chủ phòng";
    ui.rStart.disabled = !host || n < 2;
    ui.rNote.textContent = n < 2 ? "Gửi mã " + v.code + " (hoặc bấm Chép link mời) cho bạn bè." : host ? "Đủ 2 người — bấm Bắt đầu." : "Chủ phòng sẽ bấm Bắt đầu.";
    ui.rDisband.hidden = !host;
    ui.rLeave.title = host && n > 1 ? "Rời phòng — người còn lại thành chủ phòng" : "";
    if (ui.ovRoom.hidden) { overlay("room"); (host ? ui.rCopy : ui.rLeave).focus({ preventScroll: true }); }
  }
  function fromServer(v) {
    const G = v.game, base = newMatch({ mode: "pvp" });
    let n = replay(base, G.moves.map(([f, t]) => [f, t]));
    if (!n || n.board.join("") !== G.board) { // không dựng lại được bằng luật (không nên xảy ra) → chép thẳng trạng thái máy chủ
      n = { ...newRound(base), board: [...G.board], moves: G.moves.map((m) => m.slice()) };
    }
    return { ...n, turn: G.turn, check: !!G.check, winner: G.winner, reason: G.reason };
  }
  // ---------- Trò chuyện (qua máy chủ; tên người gửi do máy chủ gắn) ----------
  let chatSeen = 0, chatLast = -1;
  const narrow = () => matchMedia("(max-width: 860px), (max-aspect-ratio: 1/1)").matches && !matchMedia("(max-height: 560px) and (min-aspect-ratio: 1/1)").matches;
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
        li.className = c.mine ? "mine" : "";
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
      clearTimers(); s = null; sent = false; resetSel(); fx = { move: null, bad: null, check: 0 };
      if (v.oppLeft && prev && prev.phase !== "lobby") toast("Đối thủ đã rời phòng — gửi mã cho người khác vào chơi tiếp.", 4000);
      hud(); showRoom(v); layout(); return;
    }
    const sameGame = prev && prev.gid === v.gid && s;
    const before = sameGame ? s.moves.length : -1, wasOver = sameGame && !!s.winner;
    if (prev && prev.drawOffer !== v.drawOffer && sameGame) {
      if (v.drawOffer === 1 - v.you) { sfx.play("do-xuc-xac", 0.5); toast("Đối thủ cầu hòa — bấm Đồng ý hoặc Từ chối.", 3500); }
      else if (prev.drawOffer === v.you && v.drawOffer === -1 && v.seq === prev.seq && v.phase === "play") toast("Đối thủ từ chối hòa.");
    }
    s = fromServer(v); sent = false;
    if (!sameGame) {
      clearTimers(); resetSel(); cursor = null; hover = -1; fx = { move: null, bad: null, check: 0 };
      overlay(null); layout(); cv.focus({ preventScroll: true });
      if (!prev || prev.phase === "lobby" || prev.gid !== v.gid) { sfx.play("qua-man", 0.5); if (v.round > 1 || !prev || prev.phase !== "lobby") toast("Ván " + v.round + ": bạn cầm quân " + SIDE[mySide()] + (mySide() === RED ? " (đi trước)" : "") + ".", 2600); }
    } else if (s.moves.length === before + 1) {
      const m = s.moves[s.moves.length - 1];
      afterMove(m, !!(v.act && v.act.auto && v.act.p === mySide()));
    }
    if (s.winner && !wasOver) {
      hideToast(); endSound();
      sel = -1; dests = [];
      endTimer = setTimeout(showEnd, s.moves.length === before + 1 ? 1100 : 300);
    }
    if (sel >= 0 && (s.winner || s.turn !== mySide() || sideOf(s.board[sel]) !== mySide())) resetSel();
    hud();
  }
  function endSound() {
    const mine = online() ? mySide() : s.mode === "ai" ? RED : 0;
    sfx.play(s.winner === 3 ? "qua-man" : !mine || s.winner === mine ? "thang" : "thua", 0.8);
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
  ui.offerYes.onclick = () => room && net.send({ t: "draw", gid: room.gid });
  ui.offerNo.onclick = () => room && net.send({ t: "draw-no", gid: room.gid });

  function start(game) {
    if (game) { s = game; opts = { mode: s.mode, aiLevel: s.aiLevel }; }
    else { opts.mode = "ai"; s = newMatch(opts); }
    pendingResume = null; drawAsked = -1;
    resetSel(); cursor = null; hover = -1; fx = { move: null, bad: null, check: 0 };
    overlay(null); layout(); persist(); hud(); cv.focus({ preventScroll: true });
    sfx.play("qua-man", 0.4);
    maybeAi();
  }
  function showEnd() {
    if (!s || !s.winner) return;
    const nm = names(), w = s.winner, loser = w === 3 ? 0 : other(w);
    const t = w === 3 ? "Hòa!" : online() ? (w === mySide() ? "Bạn thắng!" : "Bạn thua!") : s.mode === "ai" ? (w === RED ? "Bạn thắng!" : "Máy thắng!") : SIDE[w] + " thắng!";
    ui.eTitle.innerHTML = w === 3 ? t : `<span class="pc">${pieceHtml(w === RED ? "K" : "k")}</span>${t}`;
    const n = s.moves.length, who = (side) => nm[side] + " (" + SIDE[side] + ")";
    const why = {
      checkmate: () => who(w) + " chiếu bí sau " + n + " nước.",
      stalemate: () => who(loser) + " hết nước đi sau " + n + " nước.",
      perpetual: () => who(loser) + " chiếu mãi, lặp thế 3 lần nên bị xử thua.",
      resign: () => who(loser) + " xin thua.",
      agreed: () => "Hai bên đồng ý hòa sau " + n + " nước.",
      repetition: () => "Lặp lại thế cờ 3 lần.",
      quiet: () => "60 lượt mỗi bên không ăn quân nào.",
      material: () => "Cả hai bên đều hết quân tấn công.",
    }[s.reason];
    ui.eSub.textContent = (why ? why() : REASON[s.reason] || "") + (online() ? " Ván sau hai bên đổi màu." : "");
    const sc = scores();
    ui.eResult.innerHTML = online()
      ? `<div class="${room.redSeat === 0 ? "rx" : "ro"}"><small>${esc(room.players[0]?.name || "")}</small><b>${room.score[0]}</b></div><div><small>Hòa</small><b>${room.draws}</b></div><div class="${room.redSeat === 1 ? "rx" : "ro"}"><small>${esc(room.players[1]?.name || "")}</small><b>${room.score[1]}</b></div>`
      : `<div class="rx"><small>${esc(nm[1])} · Đỏ</small><b>${sc[1]}</b></div><div><small>Hòa</small><b>${sc.draw}</b></div><div class="ro"><small>${esc(nm[2])} · Đen</small><b>${sc[2]}</b></div>`;
    ui.menuE.textContent = room ? "Rời phòng" : "Trận mới";
    ui.eDisband.hidden = !(room && room.you === room.host);
    overlay("end");
    $("nextBtn").focus({ preventScroll: true });
  }
  // "Khoe kết quả": ảnh 1080×1080 với số thật của ván (cách kết thúc, số nước, quân ăn được, mức máy / đối thủ, tỉ số).
  function shareEnd() {
    if (!s || !s.winner) return;
    const me = online() ? mySide() : RED, op = other(me), nm = names(), sc = scores(), w = s.winner;
    const res = w === 3 ? "draw" : w === me ? "win" : "lose";
    const lv = s.aiLevel === "normal" ? "Thường" : "Dễ";
    const foe = online() ? String(nm[op]).slice(0, 16) : "máy (" + lv + ")";
    const full = Math.ceil(s.moves.length / 2);
    const ate = (side) => s.moves.filter((m) => m[2] !== "." && sideOf(m[2]) === other(side)).length;
    const myAte = ate(me), opAte = ate(op);
    const title = res === "draw" ? "Hòa " + foe
      : res === "win" ? (s.reason === "checkmate" ? "Chiếu bí " + foe : "Thắng " + foe) + " sau " + full + " nước"
      : "Thua " + foe + " sau " + full + " nước";
    const tagline = res === "draw" ? "Kỳ phùng địch thủ — pha trà làm ván nữa!"
      : res === "lose" ? (online() ? "Tướng nhà hơi run, ván sau gỡ lại!" : "Máy cao cờ quá, ván sau phục thù!")
      : full <= 25 ? "Chiếu tướng chớp nhoáng, quán nước đầu hẻm vỗ tay!"
      : myAte - opAte >= 6 ? "Ăn sạch Xe Pháo Mã, đối thủ chỉ còn Tướng ngồi khóc!" : "Thắng chắc tay, cao thủ vỉa hè là đây!";
    shareResult({
      game: "co-tuong", title, tagline, theme: "wood",
      lines: [
        online() ? "Đối thủ: " + nm[op] : "Mức máy: " + lv,
        "Kết thúc: " + (s.reason === "resign" ? (res === "win" ? "đối thủ xin thua" : "xin thua") : REASON[s.reason] || "—"),
        "Quân ăn được: " + myAte + " – " + opAte,
        "Tỉ số các ván: " + sc[me] + " – " + sc[op] + (sc.draw ? " (hòa " + sc.draw + ")" : ""),
      ],
    });
  }
  function clearTimers() { clearTimeout(aiTimer); clearTimeout(endTimer); thinking = false; }
  function resetSel() { sel = -1; dests = []; }

  // ---------- Hành động ----------
  const canAct = () => !!s && !s.winner && !blocked() && ui.ovMenu.hidden && ui.ovPause.hidden && ui.ovEnd.hidden && ui.ovRoom.hidden;
  const mine = (k) => sideOf(s.board[k]) === s.turn;
  /** Chạm/bấm vào ô k: chọn quân mình, hoặc đi tới ô sáng. Trả true nếu đã đi quân. */
  function tap(k) {
    if (!canAct() || !Number.isInteger(k) || k < 0 || k >= 90) return false;
    if (sel >= 0 && dests.includes(k)) return move(sel, k);
    if (mine(k)) {
      if (sel === k) { resetSel(); hud(); return false; }
      sel = k; dests = legalFrom(s.board, k);
      if (!dests.length) { fx.bad = { k, t: performance.now() }; toast(s.check ? "Đang bị chiếu — quân này không giải được chiếu." : "Quân này chưa đi được (bị cản hoặc đi sẽ để Tướng bị chiếu).", 2200); }
      sfx.play(dests.length ? "buoc-nhay" : "trung-da", 0.25); // quân không đi được ⇒ tiếng lỗi
      hud(); return false;
    }
    if (sel >= 0) { fx.bad = { k, t: performance.now() }; sfx.play("trung-da", 0.25); }
    resetSel(); hud(); return false;
  }
  function move(f, t) {
    if (!canAct()) return false;
    if (online()) {
      if (!legalFrom(s.board, f).includes(t) || !mine(f)) return false;
      sent = net.send({ t: "move", f, to: t, gid: room.gid, seq: room.seq });
      if (!sent) toast("Đang nối lại máy chủ…");
      resetSel(); hud();
      return sent;
    }
    return apply(f, t);
  }
  function afterMove(m, autoMine) {
    const [f, t, cap, chk] = m;
    fx.move = { f, t, t0: performance.now() };
    sfx.play(cap !== "." ? "trung-da" : "buoc-nhay", cap !== "." ? 0.7 : 0.55);
    if (chk && !s.winner) { fx.check = performance.now(); sfx.play("do-xuc-xac", 0.6); }
    if (autoMine) toast("Bạn quá giờ — máy đã đi thay một nước.", 3000);
  }
  function apply(f, t) {
    const n = play(s, f, t);
    if (!n) { fx.bad = { k: t, t: performance.now() }; sfx.play("trung-da", 0.25); return false; }
    s = n; resetSel();
    afterMove(s.moves[s.moves.length - 1], false);
    if (s.winner) finishLocal(); else { persist(); hud(); maybeAi(); }
    return true;
  }
  function finishLocal() {
    endSound();
    sdk.reportScore?.(s.score); sdk.gameOver?.({ winner: s.winner, reason: s.reason, moves: s.moves.length, score: s.score });
    endTimer = setTimeout(showEnd, s.reason === "resign" || s.reason === "agreed" ? 250 : 1100);
    persist(); hud();
  }
  function maybeAi() {
    if (!s || !isAiTurn(s) || thinking) return;
    thinking = true; hud();
    aiTimer = setTimeout(() => {
      thinking = false;
      if (destroyed || !s || !isAiTurn(s)) { hud(); return; }
      const mv = bestMove(s, s.aiLevel);
      if (mv) apply(mv[0], mv[1]); else hud();
    }, 420 + Math.random() * 280);
  }
  function doUndo() {
    if (room) return false; // chơi online không có đi lại
    if (!s || s.winner || !s.moves.length || !ui.ovMenu.hidden || !ui.ovPause.hidden) return false;
    let k = 1;
    if (s.mode === "ai") {
      if (thinking) { clearTimeout(aiTimer); thinking = false; k = 1; }
      else k = s.turn === RED ? 2 : 1;
      if (s.moves.length < k) return false;
    }
    const u = undo(s, k); if (!u) return false;
    s = u; resetSel(); fx.move = null; fx.check = 0;
    sfx.play("do-xuc-xac", 0.35);
    persist(); hud(); maybeAi();
    return true;
  }
  function doResign() {
    if (!s || s.winner) return false;
    if (online()) {
      if (!ctx.noConfirm && !confirm("Xin thua ván này?")) return false;
      return net.send({ t: "resign", gid: room.gid });
    }
    const side = s.mode === "ai" ? RED : s.turn;
    if (!ctx.noConfirm && !confirm(s.mode === "ai" ? "Xin thua ván này?" : "Bên " + SIDE[side] + " (đang tới lượt) xin thua?")) return false;
    clearTimers();
    s = resign(s, side); resetSel(); finishLocal();
    return true;
  }
  function doDraw() {
    if (!s || s.winner) return false;
    if (online()) return net.send({ t: "draw", gid: room.gid });
    if (s.mode === "ai") {
      if (thinking || drawAsked === s.moves.length) return false;
      drawAsked = s.moves.length;
      // Máy đồng ý hòa khi không đang có lợi (điểm thế cờ của máy ≤ 0)
      if (evaluate(s.board, s.aiSide) <= 0 && s.moves.length >= 10) { s = agreeDraw(s); resetSel(); finishLocal(); return true; }
      toast(s.moves.length < 10 ? "Máy muốn đánh thêm đã — chưa đồng ý hòa." : "Máy từ chối hòa (máy đang thấy có lợi)."); hud();
      return false;
    }
    if (!ctx.noConfirm && !confirm("Hai bên đồng ý hòa ván này?")) return false;
    s = agreeDraw(s); resetSel(); finishLocal();
    return true;
  }
  function doNext() {
    if (!s) return;
    if (room) { if (s.winner) net.send({ t: "again", gid: room.gid }); return; }
    clearTimers();
    s = s.winner ? nextRound(s) : newRound({ ...s, round: s.round - 1 });
    drawAsked = -1; resetSel(); fx = { move: null, bad: null, check: 0 };
    overlay(null); persist(); hud(); cv.focus({ preventScroll: true }); sfx.play("qua-man", 0.4); maybeAi();
  }
  function setPause(on) {
    if (!s || !ui.ovMenu.hidden || !ui.ovEnd.hidden) return;
    ui.menuP.textContent = room ? "Rời phòng" : "Về menu";
    if (on) {
      const sc = scores();
      ui.pSub.textContent = "Ván " + (room ? room.round : s.round) + " · " + s.moves.length + " nước · tỉ số Đỏ " + sc[1] + " – " + sc[2] + " Đen";
      overlay("pause"); $("resumeBtn").focus({ preventScroll: true }); sfx.play("buoc-nhay", 0.35);
    } else { overlay(null); cv.focus({ preventScroll: true }); sfx.play("buoc-nhay", 0.35); }
  }

  // ---------- Nhập liệu ----------
  // Chuột và cảm ứng như nhau: chạm quân mình để chọn (hiện chấm sáng), chạm chấm sáng để đi — 2 bước nên không sợ bấm nhầm.
  cv.addEventListener("pointerdown", (e) => {
    if (e.button > 0 || !s) return;
    const k = sqAt(e.clientX, e.clientY);
    cursor = null;
    if (k < 0) { if (sel >= 0) { resetSel(); hud(); } return; }
    tap(k);
  });
  cv.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") { hover = sqAt(e.clientX, e.clientY); cv.style.cursor = hover >= 0 && s && canAct() && (mine(hover) || dests.includes(hover)) ? "pointer" : ""; } });
  cv.addEventListener("pointerleave", () => { hover = -1; });
  ui.undo.onclick = doUndo;
  ui.drawBtn.onclick = doDraw;
  ui.resign.onclick = doResign;
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
    if (k === "Escape") { if (!ui.ovEnd.hidden) { overlay(null); return; } if (sel >= 0 && ui.ovPause.hidden) { resetSel(); hud(); return; } setPause(ui.ovPause.hidden); e.preventDefault(); return; }
    if (!ui.ovPause.hidden || !ui.ovMenu.hidden) return;
    if (k === "n" || k === "N") { doNext(); return; }
    if (!ui.ovEnd.hidden) return;
    if (k === "u" || k === "U" || ((e.ctrlKey || e.metaKey) && (k === "z" || k === "Z"))) { doUndo(); e.preventDefault(); return; }
    const d = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[k];
    if (d) {
      e.preventDefault();
      const base = cursor || (sel >= 0 ? disp(sel) : s.moves.length ? disp(s.moves[s.moves.length - 1][1]) : [9, 4]);
      cursor = [Math.max(0, Math.min(9, base[0] + d[0])), Math.max(0, Math.min(8, base[1] + d[1]))];
      return;
    }
    if ((k === "Enter" || k === " ") && document.activeElement === cv && cursor) { e.preventDefault(); tap(fromDisp(cursor[0], cursor[1])); }
  }
  window.addEventListener("keydown", onKey);

  function frame(now) {
    if (destroyed) return;
    draw(now);
    if (online() && now - lastHud > 500) { lastHud = now; hud(); } // đếm ngược hạn đi
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
    get room() { return room; }, get mySide() { return mySide(); }, get flipped() { return flip(); }, net,
    get sel() { return sel; }, get dests() { return dests.slice(); },
    get layout() { return { ...L }; },
    sfx,
    // Tâm giao điểm của ô k theo toạ độ CSS của trang — dùng cho test bấm thật.
    point(k) { const b = cv.getBoundingClientRect(), [X, Y] = pt(k); return { x: b.left + X / L.dpr, y: b.top + Y / L.dpr }; },
    tap, move, undo: doUndo, next: doNext, resign: doResign, offerDraw: doDraw,
    destroy() { destroyed = true; net.close(); clearTimers(); cancelAnimationFrame(raf); ro.disconnect(); sfx.close(); window.removeEventListener("keydown", onKey); homeLinks.forEach((a) => a.removeEventListener("click", onHomeClick)); },
  };
}
