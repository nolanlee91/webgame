// Cờ Vua — phần vẽ (canvas), điều khiển, HUD, âm thanh, lưu ván, online. Luật ở logic.js, máy chơi ở ai.js.
// Ảnh bàn + quân: assets/board-grid.webp (576×576, viền 32px, ô 64px) và assets/pieces.png (atlas 6×2 khung 64px) do Codex vẽ.
import * as L from "./logic.js";
import { bestMove } from "./ai.js";
import { createNet, CODE_RE } from "./net.js?v=leave1";

const SAVE_KEY = "wgp.covua.v1";
const NAME_KEY = "wgp.covua.name";
const COL = { gold: "#ffc94a", goldD: "#5a3a08", line: "#0a0807", red: "#e0483d", coord: "#d9c8a0" };
const ATLAS = { k: 0, q: 1, r: 2, b: 3, n: 4, p: 5 };            // cột trong pieces.png; hàng 0 Trắng, hàng 1 Đen
const PNAME = { k: "Vua", q: "Hậu", r: "Xe", b: "Tượng", n: "Mã", p: "Tốt" };
const VAL = { q: 9, r: 5, b: 3, n: 3, p: 1, k: 0 };
const CNAME = { w: "Trắng", b: "Đen" };
const REASON = {
  mate: "chiếu bí", resign: "xin thua", stalemate: "hết nước đi mà Vua không bị chiếu", material: "không còn đủ quân để chiếu bí",
  fifty: "50 nước liền không ăn quân, không đi Tốt", repeat: "lặp lại cùng thế cờ 3 lần", agreed: "hai bên đồng ý hòa",
};
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
  "draw-wait": "Bạn vừa mời hòa rồi — đi thêm một nước mới mời lại được.",
  slow: "Thao tác nhanh quá, chậm lại chút nhé.",
  busy: "Máy chủ đang bận (hoặc bạn mở quá nhiều phòng). Thử lại sau.",
  loading: "Máy chủ đang khởi động, thử lại sau giây lát.",
  server: "Máy chủ gặp lỗi, thử lại.",
  bad: "Yêu cầu không hợp lệ.",
  long: "Tin nhắn dài quá (tối đa 200 ký tự).",
  "chat-slow": "Bạn nhắn nhanh quá — đợi một chút rồi gửi tiếp.",
};
const esc = (t) => String(t).replace(/[&<>"']/g, (ch) => "&#" + ch.charCodeAt(0) + ";");
// biểu tượng quân bằng CSS (cắt từ atlas) — dùng cho HUD, phòng chờ, bảng phong cấp
const icon = (color, t, cls = "pc") => `<span class="${cls}" style="--ix:${ATLAS[t]};--iy:${color === "w" ? 0 : 1}" aria-hidden="true"></span>`;

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

function baseOf(g) {
  return { ...L.newMatch({ mode: g.mode, aiLevel: g.aiLevel }), score: [g.score?.[0] | 0, g.score?.[1] | 0], draws: g.draws | 0, round: Math.max(1, g.round | 0), white: g.white === 1 ? 1 : 0 };
}
function loadSave() {
  try {
    const v = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!v || typeof v !== "object") return { opts: { ...DEFAULT_OPTS }, game: null };
    const o = v.opts || {};
    // Bản lưu cũ có mode "pvp" (2 người chung máy, đã bỏ) → chuyển sang chơi với máy.
    const opts = { mode: o.mode === "online" ? "online" : "ai", aiLevel: o.aiLevel === "normal" ? "normal" : "easy" };
    let game = null;
    const g = v.game;
    // Dựng lại từ danh sách nước đi bằng luật (không tin bàn cờ đã lưu — chống lỗi/sửa tay).
    // Ván dở của chế độ chung máy cũ thì bỏ (không ép thành ván với máy giữa chừng).
    if (g && g.mode === "ai" && Array.isArray(g.moves)) game = L.replay(baseOf(g), g.moves.map((m) => ({ from: m[0], to: m[1], promo: m[2] || undefined })));
    return { opts, game };
  } catch { return { opts: { ...DEFAULT_OPTS }, game: null }; }
}

export function mount(root, ctx = {}) {
  const sdk = ctx.sdk || { sound: { muted: false } };
  const $ = (id) => root.querySelector("#" + id) || document.getElementById(id);
  const cv = $("cv"), stage = $("stage"), g2 = cv.getContext("2d");
  const ui = {
    pl: [$("plA"), $("plB")], nm: [$("nA"), $("nB")], sc: [$("sA"), $("sB")], col: [$("cA"), $("cB")], cap: [$("kA"), $("kB")],
    round: $("hRound"), status: $("hStatus"), draw: $("hDraw"),
    undo: $("undoBtn"), next: $("newBtn"), offer: $("drawBtn"), resign: $("resignBtn"), menu: $("menuBtn"), mute: $("muteBtn"), muteIc: $("muteIc"),
    ovMenu: $("ovMenu"), ovPause: $("ovPause"), ovEnd: $("ovEnd"), mResume: $("mResume"), mNote: $("mNote"),
    vEntry: $("vEntry"), vSolo: $("vSolo"), createBtn: $("createBtn"), soloBtn: $("soloBtn"), resumeGame: $("resumeGameBtn"), startBtn: $("startBtn"),
    eTitle: $("eTitle"), eSub: $("eSub"), eResult: $("eResult"), pSub: $("pSub"),
    nameIn: $("nameIn"), codeIn: $("codeIn"), joinBtn: $("joinBtn"), mErr: $("mErr"),
    ovRoom: $("ovRoom"), rCode: $("rCode"), rOpts: $("rOpts"), rSeats: $("rSeats"), rNote: $("rNote"), rStart: $("rStart"), rCopy: $("rCopy"), rLeave: $("rLeave"), rDisband: $("rDisband"), eDisband: $("eDisband"),
    toast: $("toast"), menuP: $("menuBtnP"), menuE: $("menuBtnE"),
    promo: $("promo"), promoBox: $("promoBox"), ask: $("askDraw"), askText: $("askText"), askYes: $("askYes"), askNo: $("askNo"),
    chat: $("chat"), chatLog: $("chatLog"), chatF: $("chatF"), chatIn: $("chatIn"), chatBtn: $("chatBtn"), chatN: $("chatN"), chatX: $("chatX"),
  };
  root.querySelectorAll("[data-icon]").forEach((e) => { const [c, t] = e.dataset.icon.split(""); e.outerHTML = icon(c, t); });
  const sfx = makeSfx("assets/sfx/", ["buoc-nhay", "trung-da", "do-xuc-xac", "thang", "thua", "qua-man", "tin-nhan"], sdk);
  const img = { board: new Image(), pieces: new Image() };
  img.board.src = new URL("assets/board-grid.webp", import.meta.url).href;
  img.pieces.src = new URL("assets/pieces.png", import.meta.url).href;

  const saved = loadSave();
  let opts = saved.opts;
  opts.mode = "ai"; // màn vào game không còn ô "Chế độ": chơi trên máy luôn là với máy, online đi qua phòng
  let s = null;                 // trạng thái ván (null = chưa vào trận)
  let pendingResume = saved.game && !saved.game.result && saved.game.moves.length ? saved.game : null;
  let destroyed = false, raf = 0, aiTimer = 0, endTimer = 0, thinking = false;
  let G = { cs: 40, ox: 0, oy: 0, pad: 20, dpr: 1, w: 0, h: 0 };
  let sel = -1, targets = [], hover = -1, cursor = -1, promoAsk = null;
  let fx = { anim: null, bad: null };
  // ---- Online: máy chủ giữ ván; client chỉ gửi "đi từ ô a sang ô b" rồi dựng lại thế cờ theo danh sách nước máy chủ gửi về.
  let room = null, skew = 0, sent = false, toastTimer = 0, lastHud = 0;
  const online = () => !!room && room.phase !== "lobby";
  const mySeat = () => (room ? room.you : 0);
  const myColor = () => (s ? L.colorOfSeat(s, mySeat()) : "w");
  const turnSeat = () => (s ? L.seatOf(s, s.turn) : 0);
  const blocked = () => !s || !!s.result || thinking || L.isAiTurn(s) || (online() && (s.turn !== myColor() || sent));
  // bên ở phía dưới bàn: online/với máy = màu của mình (chưa vào ván = Trắng)
  const bottom = () => (!s ? "w" : online() || s.mode === "ai" ? myColor() : "w");
  const flip = () => bottom() === "b";
  const disp = (i) => (flip() ? 63 - i : i); // chỉ số ô logic ↔ vị trí hiển thị (đối xứng nên dùng 2 chiều)

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
    const avail = Math.min(w, h) - shadow - 2;
    const cs = Math.max(8, Math.floor(avail / 9));   // 8 ô + viền 2 × nửa ô (đúng tỉ lệ ảnh 576 = 9 × 64)
    const pad = Math.round(cs / 2), tot = cs * 8 + pad * 2;
    G = { cs, pad, dpr, w, h, ox: Math.floor((w - shadow - tot) / 2) + pad, oy: Math.floor((h - shadow - tot) / 2) + pad };
  }
  function sqAt(clientX, clientY) {
    const r = cv.getBoundingClientRect();
    const x = (clientX - r.left) * G.dpr - G.ox, y = (clientY - r.top) * G.dpr - G.oy;
    const c = Math.floor(x / G.cs), rr = Math.floor(y / G.cs);
    return rr >= 0 && c >= 0 && rr < 8 && c < 8 ? disp(rr * 8 + c) : -1;
  }
  const xy = (i) => { const d = disp(i); return [G.ox + (d & 7) * G.cs, G.oy + (d >> 3) * G.cs]; };
  const ro = new ResizeObserver(() => { layout(); draw(performance.now()); });
  ro.observe(stage);

  // ---------- Vẽ ----------
  function sprite(p, X, Y, size, alpha = 1) {
    if (!img.pieces.complete || !img.pieces.naturalWidth) return;
    g2.globalAlpha = alpha;
    g2.drawImage(img.pieces, ATLAS[L.typeOf(p)] * 64, L.colorOf(p) === "w" ? 0 : 64, 64, 64, Math.round(X), Math.round(Y), size, size);
    g2.globalAlpha = 1;
  }
  function brackets(X, Y, S, col, t) {
    const k = Math.max(t * 2, Math.floor(S / 4));
    g2.fillStyle = col;
    for (const [ax, ay, sx, sy] of [[X, Y, 1, 1], [X + S, Y, -1, 1], [X, Y + S, 1, -1], [X + S, Y + S, -1, -1]]) {
      g2.fillRect(sx > 0 ? ax : ax - k, sy > 0 ? ay : ay - t, k, t);
      g2.fillRect(sx > 0 ? ax : ax - t, sy > 0 ? ay : ay - k, t, k);
    }
  }
  function frameRect(X, Y, S, col, t) { g2.fillStyle = col; g2.fillRect(X, Y, S, t); g2.fillRect(X, Y + S - t, S, t); g2.fillRect(X, Y, t, S); g2.fillRect(X + S - t, Y, t, S); }
  function draw(now) {
    g2.setTransform(1, 0, 0, 1, 0, 0);
    g2.imageSmoothingEnabled = false;
    g2.clearRect(0, 0, G.w, G.h);
    const { cs, pad, ox, oy, dpr } = G, tot = cs * 8, sh = Math.round(5 * dpr), b = Math.max(2, Math.round(3 * dpr));
    // bóng cứng + viền đen + ảnh bàn
    g2.fillStyle = "rgba(0,0,0,.6)"; g2.fillRect(ox - pad + sh, oy - pad + sh, tot + pad * 2, tot + pad * 2);
    g2.fillStyle = COL.line; g2.fillRect(ox - pad - b, oy - pad - b, tot + pad * 2 + b * 2, tot + pad * 2 + b * 2);
    if (img.board.complete && img.board.naturalWidth) g2.drawImage(img.board, ox - pad, oy - pad, tot + pad * 2, tot + pad * 2);
    else { for (let i = 0; i < 64; i++) { g2.fillStyle = ((i >> 3) + (i & 7)) % 2 ? "#663a20" : "#efd3a2"; g2.fillRect(ox + (i & 7) * cs, oy + (i >> 3) * cs, cs, cs); } }
    // toạ độ a–h / 1–8 trên viền gỗ
    const fs = Math.max(8, Math.round(pad * 0.5));
    g2.font = `800 ${fs}px "Be Vietnam Pro", system-ui, sans-serif`; g2.textAlign = "center"; g2.textBaseline = "middle";
    for (let k = 0; k < 8; k++) {
      const file = L.FILES[flip() ? 7 - k : k], rank = String(flip() ? k + 1 : 8 - k);
      g2.fillStyle = "#000"; g2.fillText(file, ox + k * cs + cs / 2 + 1, oy + tot + pad / 2 + 1); g2.fillText(rank, ox - pad / 2 + 1, oy + k * cs + cs / 2 + 1);
      g2.fillStyle = COL.coord; g2.fillText(file, ox + k * cs + cs / 2, oy + tot + pad / 2); g2.fillText(rank, ox - pad / 2, oy + k * cs + cs / 2);
    }
    if (!s) { drawStart(); return; }
    const t = Math.max(2, Math.round(cs / 20));
    // nước vừa đi
    const last = s.moves[s.moves.length - 1];
    if (last) for (const i of [last.from, last.to]) { const [X, Y] = xy(i); g2.fillStyle = "rgba(255,201,74,.38)"; g2.fillRect(X, Y, cs, cs); }
    // Vua đang bị chiếu / bị chiếu bí
    if (!s.result || s.result.reason === "mate") {
      if (L.inCheck(s)) { const [X, Y] = xy(L.kingSq(s.board, s.turn)); g2.fillStyle = Math.floor(now / 300) % 2 && s.result ? "rgba(224,72,61,.5)" : "rgba(224,72,61,.72)"; g2.fillRect(X, Y, cs, cs); frameRect(X, Y, cs, "#5a120c", t); }
    }
    // quân đang chọn
    if (sel >= 0) { const [X, Y] = xy(sel); g2.fillStyle = "rgba(255,201,74,.55)"; g2.fillRect(X, Y, cs, cs); }
    if (fx.bad) {
      const k = (now - fx.bad.t) / 320;
      if (k >= 1) fx.bad = null; else { const [X, Y] = xy(fx.bad.i); g2.fillStyle = `rgba(224,72,61,${0.6 * (1 - k)})`; g2.fillRect(X, Y, cs, cs); }
    }
    // quân cờ (quân vừa đi trượt từ ô cũ sang ô mới)
    let anim = fx.anim;
    if (anim && now - anim.t >= 170) { fx.anim = anim = null; }
    for (let i = 0; i < 64; i++) {
      const p = s.board[i]; if (!p) continue;
      let [X, Y] = xy(i);
      if (anim && anim.to === i) {
        const k = Math.min(1, (now - anim.t) / 170), e = 1 - (1 - k) * (1 - k), [fx0, fy0] = xy(anim.from);
        X = fx0 + (X - fx0) * e; Y = fy0 + (Y - fy0) * e - Math.sin(k * Math.PI) * cs * 0.12;
      }
      sprite(p, X, Y, cs, anim && anim.to === i ? 1 : 1);
    }
    // nước đi hợp lệ của quân đang chọn: ô trống = chấm, ô có quân đối phương = 4 góc
    for (const m of targets) {
      if (m.promo && m.promo !== "q") continue;
      const [X, Y] = xy(m.to), cap = !!s.board[m.to] || (L.typeOf(s.board[m.from]) === "p" && m.to === s.ep);
      if (cap) brackets(X + t, Y + t, cs - 2 * t, "rgba(23,15,10,.75)", Math.max(3, t + 1));
      else { // chấm vuông: viền tối + lõi vàng nhạt — thấy rõ trên cả ô sáng lẫn ô tối
        const d = Math.max(6, Math.round(cs * 0.28)), x0 = Math.round(X + (cs - d) / 2), y0 = Math.round(Y + (cs - d) / 2), o = Math.max(2, Math.round(t * 0.8));
        g2.fillStyle = "rgba(23,15,10,.7)"; g2.fillRect(x0, y0, d, d);
        g2.fillStyle = "rgba(255,226,140,.9)"; g2.fillRect(x0 + o, y0 + o, d - 2 * o, d - 2 * o);
      }
    }
    const canAct = !blocked();
    // rê chuột lên quân của mình còn nước đi
    if (canAct && hover >= 0 && hover !== sel) {
      const p = s.board[hover], tg = targets.some((m) => m.to === hover);
      if (tg || (p && L.colorOf(p) === s.turn)) { const [X, Y] = xy(hover); frameRect(X, Y, cs, "rgba(255,233,168,.85)", t); }
    }
    if (sel >= 0) { const [X, Y] = xy(sel); brackets(X, Y, cs, COL.gold, Math.max(3, t + 1)); }
    if (cursor >= 0 && canAct) { const [X, Y] = xy(cursor); frameRect(X - t, Y - t, cs + 2 * t, COL.gold, t); }
  }
  // Màn chờ: bày quân xuất phát mờ
  function drawStart() {
    const st = L.newMatch().board;
    for (let i = 0; i < 64; i++) if (st[i]) sprite(st[i], G.ox + (i & 7) * G.cs, G.oy + (i >> 3) * G.cs, G.cs, 0.85);
  }

  // ---------- HUD ----------
  function names() {
    if (room) return [room.players[0]?.name || "Người 1", room.players[1]?.name || (room.phase === "lobby" ? "Đang chờ…" : "Người 2")];
    if ((s?.mode ?? opts.mode) === "ai") return ["Bạn", "Máy" + ((s?.aiLevel ?? opts.aiLevel) === "normal" ? " (vừa)" : " (dễ)")];
    return ["Người 1", "Người 2"];
  }
  function capHtml(list) {
    const order = "qrbnp";
    return list.slice().sort((a, b) => order.indexOf(L.typeOf(a)) - order.indexOf(L.typeOf(b))).map((p) => icon(L.colorOf(p), L.typeOf(p), "mini")).join("");
  }
  let warnLeft = -1; // giây cuối đã tích cảnh báo hết giờ lượt
  function hud() {
    const nm = names();
    document.body.classList.toggle("is-online", online());
    ui.nm[0].textContent = nm[0]; ui.nm[1].textContent = nm[1];
    if (!s) {
      for (const k of [0, 1]) { ui.sc[k].textContent = "0"; ui.pl[k].classList.remove("on", "win"); ui.cap[k].innerHTML = ""; ui.col[k].innerHTML = icon(k ? "b" : "w", "k"); ui.pl[k].querySelector("small").textContent = k ? "Quân Đen" : "Quân Trắng"; }
      ui.round.textContent = room ? "Phòng " + room.code : "Chưa bắt đầu"; ui.status.textContent = room ? "Phòng chờ" : "Sẵn sàng"; ui.draw.textContent = "Hòa 0";
      ui.undo.disabled = true; ui.next.disabled = true; ui.resign.disabled = true; ui.offer.disabled = true; return;
    }
    const caps = L.captured(s), res = s.result, ts = turnSeat();
    const mat = (c) => caps[c].reduce((a, p) => a + VAL[L.typeOf(p)], 0);
    for (const k of [0, 1]) {
      const c = L.colorOfSeat(s, k), lead = mat(c) - mat(L.other(c));
      ui.sc[k].textContent = s.score[k];
      ui.col[k].innerHTML = icon(c, "k");
      ui.cap[k].innerHTML = capHtml(caps[c]) + (lead > 0 ? `<i>+${lead}</i>` : "");
      let tag = "Quân " + CNAME[c];
      if (online()) tag += (k === mySeat() ? " · Bạn" : "") + (room.players[k] && !room.players[k].connected ? " · mất kết nối" : "");
      ui.pl[k].querySelector("small").textContent = tag;
      ui.pl[k].classList.toggle("on", !res && ts === k);
      ui.pl[k].classList.toggle("win", !!res && !!res.winner && L.seatOf(s, res.winner) === k);
    }
    ui.draw.textContent = "Hòa " + s.draws;
    const lastSan = s.moves.length ? " · " + Math.ceil(s.moves.length / 2) + (s.moves.length % 2 ? ". " : "… ") + s.moves[s.moves.length - 1].san : "";
    ui.round.textContent = "Ván " + s.round + lastSan;
    const check = !res && L.inCheck(s) ? " · Chiếu!" : "";
    if (res) ui.status.textContent = !res.winner ? "Hòa!" : online() ? (L.seatOf(s, res.winner) === mySeat() ? "Bạn thắng!" : nm[L.seatOf(s, res.winner)] + " thắng!") : nm[L.seatOf(s, res.winner)] + " thắng!";
    else if (thinking) ui.status.textContent = "Máy đang nghĩ…" + check;
    else if (online()) {
      const left = room.deadline ? Math.max(0, Math.ceil((room.deadline - (Date.now() + skew)) / 1000)) : 0;
      const tm = left && left <= 15 ? " · " + left + "s" : "", opp = room.players[ts];
      if (ts === mySeat() && left > 0 && left <= 5 && left !== warnLeft) { warnLeft = left; sfx.play("do-xuc-xac", 0.3); }
      ui.status.textContent = (ts === mySeat() ? "Lượt bạn (" + CNAME[s.turn] + ")" : opp && !opp.connected ? nm[ts] + " mất kết nối…" : "Chờ " + nm[ts] + " đi…") + check + tm;
    } else ui.status.innerHTML = "Lượt " + CNAME[s.turn] + '<span class="hn"> · ' + esc(nm[ts]) + "</span>" + check;
    const humanMoved = s.mode !== "ai" || s.moves.some((m, i) => (i % 2 ? "b" : "w") === L.colorOfSeat(s, 0));
    ui.undo.disabled = !!res || !s.moves.length || !humanMoved;
    ui.next.disabled = online() && !res;
    ui.next.classList.toggle("btn--primary", !!res);
    ui.next.firstChild.textContent = res ? "Ván tiếp ▶" : "Ván mới";
    ui.resign.disabled = !!res || (online() && false) || (s.mode === "ai" && !humanMoved && false);
    ui.offer.disabled = !online() || !!res || !room.canOffer || room.drawOffer === mySeat();
    ui.offer.firstChild.textContent = online() && room.drawOffer === mySeat() ? "Đã mời hòa" : "Xin hòa";
    // lời mời hòa từ đối thủ
    const asked = online() && !res && room.drawOffer >= 0 && room.drawOffer !== mySeat();
    ui.ask.hidden = !asked;
    if (asked) ui.askText.textContent = nm[room.drawOffer] + " mời hòa ván này.";
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
      const game = s && !s.result && s.moves.length ? { mode: s.mode, aiLevel: s.aiLevel, score: s.score, draws: s.draws, round: s.round, white: s.white, moves: s.moves.map((m) => (m.promo ? [m.from, m.to, m.promo] : [m.from, m.to])) } : null;
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
    if (which) closePromo();
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
    ui.mResume.textContent = g ? "Ván " + g.round + " đang dở · " + g.moves.length + " nước · tỉ số " + g.score[0] + " – " + g.score[1] + " (với máy)" : "";
  }
  function showMenu(err = "") {
    clearTimers();
    room = null; sent = false; document.body.classList.remove("is-online");
    renderChat(null); busyMenu(false);
    syncOpts(); menuResume(); ui.mNote.textContent = "";
    overlay("menu");
    s = null; sel = -1; targets = []; hover = -1; cursor = -1; fx = { anim: null, bad: null };
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
      if (code === "illegal" || code === "not-turn") { sent = false; net.send({ t: "sync" }); }
      if (code !== "phase") toast(text);
    },
    offline(text) { busyMenu(false); if (room) { s = null; showMenu(text); } else ui.mErr.textContent = text; },
    reconnecting() { toast("Mất kết nối — đang nối lại…", 0); },
  }, { url: ctx.wsUrl });
  function busyMenu(on) { ui.ovMenu.querySelectorAll(".btn").forEach((b) => (b.disabled = on)); }
  function goOnline(kind) {
    const nm = ui.nameIn.value.trim();
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
  try { ui.nameIn.value = localStorage.getItem(NAME_KEY) || ""; } catch {}

  function showRoom(v) {
    const n = v.players.length, host = v.you === v.host;
    ui.rCode.textContent = v.code;
    ui.rOpts.textContent = "Ván 1: chủ phòng cầm Trắng (đi trước) · mỗi ván sau đổi màu";
    ui.rSeats.innerHTML = [0, 1].map((i) => {
      const p = v.players[i], ic = icon(i ? "b" : "w", "k");
      if (!p) return `<div class="seat off">${ic}<b>Đang chờ người chơi…</b><em>Chỗ trống</em></div>`;
      return `<div class="seat">${ic}<b>${esc(p.name)}${i === v.you ? " (Bạn)" : ""}</b><em class="${p.connected ? "ok" : "bad"}">${i === v.host ? "Chủ phòng · " : ""}${p.connected ? "Sẵn sàng" : "Mất kết nối"}</em></div>`;
    }).join("");
    ui.rStart.textContent = host ? "▶ Bắt đầu" : "Chờ chủ phòng";
    ui.rStart.disabled = !host || n < 2;
    ui.rNote.textContent = n < 2 ? "Gửi mã " + v.code + " (hoặc bấm Chép link mời) cho bạn bè." : host ? "Đủ 2 người — bấm Bắt đầu." : "Chủ phòng sẽ bấm Bắt đầu.";
    ui.rDisband.hidden = !host;
    ui.rLeave.title = host && n > 1 ? "Rời phòng — người còn lại thành chủ phòng" : "";
    if (ui.ovRoom.hidden) { overlay("room"); (host ? ui.rCopy : ui.rLeave).focus({ preventScroll: true }); }
  }
  function fromServer(v) {
    const g = v.game;
    const n = L.replay(baseOf({ ...g, mode: "pvp" }), g.moves.map(([from, to, promo]) => ({ from, to, promo: promo || undefined })));
    if (!n) return null;
    return { ...n, score: g.score.slice(), draws: g.draws, result: g.result };
  }
  // ---------- Trò chuyện (qua máy chủ; tên người gửi do máy chủ gắn) ----------
  let chatSeen = 0, chatLast = -1;
  const narrow = () => matchMedia("(max-width: 760px), (max-aspect-ratio: 1/1)").matches;
  const chatOpen = () => !narrow() || document.body.classList.contains("chat-open");
  function renderChat(v) {
    const on = !!v;
    document.body.classList.toggle("has-chat", on); ui.chat.hidden = !on;
    if (!on) { document.body.classList.remove("chat-open"); chatSeen = 0; chatLast = -1; ui.chatLog.replaceChildren(); ui.chatN.hidden = true; ui.chatIn.value = ""; return; }
    const list = v.chat || [], top = list.length ? list[list.length - 1].id : 0;
    if (top !== chatLast) {
      const atEnd = ui.chatLog.scrollHeight - ui.chatLog.scrollTop - ui.chatLog.clientHeight < 40;
      const isNew = chatLast >= 0 && top > chatLast;
      chatLast = top;
      ui.chatLog.replaceChildren(...(list.length ? list.map((c) => {
        const li = document.createElement("li"), b = document.createElement("b");
        const side = v.players.findIndex((p) => p.name === c.name);
        li.className = c.mine ? "mine" : side === 0 ? "a" : "b";
        b.textContent = c.mine ? "Bạn" : c.name; li.append(b, document.createTextNode(c.text));
        return li;
      }) : [Object.assign(document.createElement("li"), { className: "empty", textContent: "Chưa có tin nhắn. Chào đối thủ một câu nhé!" })]));
      if (atEnd || list.at(-1)?.mine) ui.chatLog.scrollTop = ui.chatLog.scrollHeight;
      const last = list.at(-1);
      if (isNew && last && !last.mine) sfx.play("tin-nhan", 0.6); // có tin mới từ người khác: kêu cả khi đang mở khung chat
      if (isNew && last && !last.mine && !chatOpen()) toast(last.name + ": " + last.text, 3500);
    }
    if (chatOpen()) chatSeen = top;
    const unread = list.filter((c) => c.id > chatSeen && !c.mine).length;
    ui.chatN.hidden = !unread; ui.chatN.textContent = unread > 9 ? "9+" : String(unread);
  }
  function setChatOpen(on) {
    document.body.classList.toggle("chat-open", on);
    if (on) { hideToast(); if (room) renderChat(room); ui.chatLog.scrollTop = ui.chatLog.scrollHeight; ui.chatIn.focus({ preventScroll: true }); }
    else if (!ui.ovRoom.hidden) ui.rLeave.focus({ preventScroll: true }); else cv.focus({ preventScroll: true });
  }
  ui.chatBtn.onclick = () => setChatOpen(!document.body.classList.contains("chat-open"));
  ui.chatX.onclick = () => setChatOpen(false);
  ui.chatIn.addEventListener("keydown", (e) => { if (e.key === "Escape") { e.stopPropagation(); setChatOpen(false); } });
  ui.chatF.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = ui.chatIn.value.trim(); if (!text) return;
    if (net.send({ t: "chat", text })) ui.chatIn.value = ""; else toast("Đang nối lại máy chủ — chưa gửi được tin.");
  });

  function moveSound(rec, n) {
    if (!rec) return;
    sfx.play(rec.cap ? "trung-da" : "buoc-nhay", rec.cap ? 0.6 : 0.6);
    if (!n.result && L.inCheck(n)) setTimeout(() => sfx.play("do-xuc-xac", 0.45), 90);
  }
  function endSound() {
    const r = s.result; if (!r) return;
    const humanSeat = online() ? mySeat() : s.mode === "ai" ? 0 : -1;
    sfx.play(!r.winner ? "qua-man" : humanSeat < 0 || L.seatOf(s, r.winner) === humanSeat ? "thang" : "thua", 0.8);
  }
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
    if (prev && prev.gid === v.gid && prev.drawOffer !== v.drawOffer && v.drawOffer >= 0 && v.drawOffer !== v.you) sfx.play("do-xuc-xac", 0.5); // đối thủ mời hòa
    if (v.phase === "lobby") {
      clearTimers(); s = null; sent = false; sel = -1; targets = []; fx = { anim: null, bad: null }; closePromo();
      if (v.oppLeft && prev && prev.phase !== "lobby") toast("Đối thủ đã rời phòng — gửi mã cho người khác vào chơi tiếp.", 4000);
      hud(); showRoom(v); layout(); return;
    }
    const sameGame = prev && prev.gid === v.gid && s;
    const before = sameGame ? s.moves.length : -1, wasOver = sameGame && !!s.result;
    const n = fromServer(v);
    if (!n) { net.send({ t: "sync" }); return; }
    s = n; sent = false;
    if (!sameGame) {
      clearTimers(); sel = -1; targets = []; cursor = -1; hover = -1; fx = { anim: null, bad: null }; closePromo();
      overlay(null); layout(); cv.focus({ preventScroll: true });
      if (!prev || prev.phase === "lobby" || prev.gid !== v.gid) sfx.play("qua-man", 0.5);
      if (s.result) endTimer = setTimeout(showEnd, 400);
    } else {
      if (s.moves.length === before + 1) {
        const rec = s.moves[s.moves.length - 1];
        fx.anim = { from: rec.from, to: rec.to, t: performance.now() };
        moveSound(rec, s);
      }
      if (sel >= 0 && (s.moves.length !== before)) { sel = -1; targets = []; closePromo(); }
      if (s.result && !wasOver) { endSound(); closePromo(); ui.ask.hidden = true; endTimer = setTimeout(showEnd, s.result.reason === "mate" ? 1200 : 500); }
    }
    hud();
  }
  function leaveRoom() {
    if (online() && !s.result && !confirm("Rời ván đang chơi? Đối thủ sẽ phải chờ người mới.")) return;
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
    if (online() && s && !s.result && !confirm("Rời ván đang chơi?")) return;
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
  ui.askYes.onclick = () => { net.send({ t: "draw" }); ui.ask.hidden = true; };
  ui.askNo.onclick = () => { net.send({ t: "draw-no" }); ui.ask.hidden = true; };

  function start(game) {
    if (game) { s = game; opts = { ...opts, mode: s.mode, aiLevel: s.aiLevel }; }
    else { opts.mode = "ai"; s = L.newMatch(opts); }
    pendingResume = null;
    sel = -1; targets = []; cursor = -1; hover = -1; fx = { anim: null, bad: null };
    overlay(null); layout(); persist(); hud(); cv.focus({ preventScroll: true });
    sfx.play("qua-man", 0.4);
    maybeAi();
  }
  function showEnd() {
    if (!s || !s.result) return;
    const nm = names(), r = s.result, ws = r.winner ? L.seatOf(s, r.winner) : -1;
    const humanSeat = online() ? mySeat() : s.mode === "ai" ? 0 : -1;
    const t = !r.winner ? "Hòa!" : humanSeat >= 0 ? (ws === humanSeat ? "Bạn thắng!" : online() ? "Bạn thua!" : "Máy thắng!") : CNAME[r.winner] + " thắng!";
    ui.eTitle.innerHTML = (r.winner ? icon(r.winner, "k") : icon("w", "k") + icon("b", "k")) + esc(t);
    const loser = r.winner ? nm[1 - ws] : "";
    ui.eSub.textContent = r.reason === "mate" ? nm[ws] + " chiếu bí sau " + s.moves.length + " nước (" + s.moves.at(-1).san + ")."
      : r.reason === "resign" ? loser + " xin thua." : "Hòa vì " + REASON[r.reason] + ".";
    ui.eSub.textContent += " Ván sau hai bên đổi màu quân.";
    ui.eResult.innerHTML = `<div class="ra"><small>${esc(nm[0])}</small><b>${s.score[0]}</b></div><div><small>Hòa</small><b>${s.draws}</b></div><div class="rb"><small>${esc(nm[1])}</small><b>${s.score[1]}</b></div>`;
    ui.menuE.textContent = online() ? "Rời phòng" : "Trận mới";
    ui.eDisband.hidden = !(room && room.you === room.host);
    overlay("end");
    $("nextBtn").focus({ preventScroll: true });
  }
  function clearTimers() { clearTimeout(aiTimer); clearTimeout(endTimer); thinking = false; }

  // ---------- Hành động ----------
  function busyUi() { return !s || !ui.ovMenu.hidden || !ui.ovPause.hidden || !ui.ovEnd.hidden || !ui.ovRoom.hidden; }
  function bad(i) { fx.bad = { i, t: performance.now() }; sfx.play("trung-da", 0.25); }
  /** Bấm/chạm vào ô i: chọn quân của mình → hiện nước đi; bấm ô đích → đi. */
  function tap(i) {
    if (busyUi() || blocked() || i < 0) return false;
    if (promoAsk) closePromo();
    if (sel >= 0) {
      const hits = targets.filter((m) => m.to === i);
      if (hits.length) {
        if (hits.length > 1) { openPromo(sel, i); return true; }
        return move(sel, i);
      }
      if (i === sel) { sel = -1; targets = []; return false; }
    }
    const p = s.board[i];
    if (p && L.colorOf(p) === s.turn) {
      const tg = L.legalMoves(s, i);
      if (!tg.length) { bad(i); sel = -1; targets = []; return false; }
      sel = i; targets = tg; return true;
    }
    if (sel >= 0 || p) bad(i);
    sel = -1; targets = [];
    return false;
  }
  function move(from, to, promo) {
    if (busyUi() || blocked()) return false;
    const mv = { from, to, promo };
    if (online()) {
      if (!L.legalMoves(s).some((m) => m.from === from && m.to === to && m.promo === promo)) { bad(to); return false; }
      sent = net.send(promo ? { t: "move", from, to, promo } : { t: "move", from, to });
      sel = -1; targets = []; closePromo();
      if (!sent) toast("Đang nối lại máy chủ…");
      return sent;
    }
    return apply(mv);
  }
  function apply(mv) {
    const n = L.play(s, mv);
    if (!n) { bad(mv.to); return false; }
    s = n; sel = -1; targets = []; closePromo();
    const rec = s.moves[s.moves.length - 1];
    fx.anim = { from: rec.from, to: rec.to, t: performance.now() };
    moveSound(rec, s);
    if (s.result) finishLocal();
    persist(); hud();
    maybeAi();
    return true;
  }
  function finishLocal() {
    endSound();
    sdk.reportScore?.(s.score); sdk.gameOver?.({ winner: s.result.winner, reason: s.result.reason, moves: s.moves.length, score: s.score });
    endTimer = setTimeout(showEnd, s.result.reason === "mate" ? 1200 : 500);
  }
  function maybeAi() {
    if (!s || !L.isAiTurn(s) || thinking) return;
    thinking = true; hud();
    aiTimer = setTimeout(() => {
      thinking = false;
      if (destroyed || !s || !L.isAiTurn(s)) { hud(); return; }
      const mv = bestMove(s, s.aiLevel);
      if (mv) apply(mv); else hud();
    }, 420 + Math.random() * 300);
  }
  function doUndo() {
    if (room) return false; // chơi online không có đi lại
    if (!s || s.result || !s.moves.length || busyUi()) return false;
    let k = 1;
    if (s.mode === "ai") {
      const me = L.colorOfSeat(s, 0), colorAt = (i) => (i % 2 ? "b" : "w");
      if (!s.moves.some((m, i) => colorAt(i) === me)) return false;
      if (thinking) { clearTimeout(aiTimer); thinking = false; k = 1; }
      else k = colorAt(s.moves.length - 1) === me ? 1 : 2;
    }
    const u = L.undo(s, k); if (!u) return false;
    s = u; sel = -1; targets = []; fx.anim = null; closePromo();
    sfx.play("do-xuc-xac", 0.35);
    persist(); hud(); maybeAi();
    return true;
  }
  function doNext() {
    if (!s) return;
    if (room) { if (s.result) net.send({ t: "again" }); return; }
    if (!s.result && s.moves.length && !confirm("Bỏ ván đang chơi và bắt đầu ván mới? Ván này không tính điểm.")) return;
    clearTimers();
    s = s.result ? L.nextRound(s) : L.replay(s, []);
    sel = -1; targets = []; fx = { anim: null, bad: null };
    overlay(null); persist(); hud(); cv.focus({ preventScroll: true }); sfx.play("qua-man", 0.4); maybeAi();
  }
  function doResign() {
    if (!s || s.result || busyUi()) return;
    if (online()) { if (confirm("Xin thua ván này?")) net.send({ t: "resign" }); return; }
    const who = s.mode === "ai" ? L.colorOfSeat(s, 0) : s.turn;
    if (!confirm(s.mode === "ai" ? "Xin thua ván này?" : "Bên " + CNAME[who] + " xin thua?")) return;
    clearTimers();
    s = L.resign(s, who); sel = -1; targets = [];
    finishLocal(); persist(); hud();
  }
  function setPause(on) {
    if (!s || !ui.ovMenu.hidden || !ui.ovEnd.hidden) return;
    ui.menuP.textContent = room ? "Rời phòng" : "Về menu";
    if (on) {
      ui.pSub.textContent = "Ván " + s.round + " · " + s.moves.length + " nước · tỉ số " + s.score[0] + " – " + s.score[1];
      overlay("pause"); $("resumeBtn").focus({ preventScroll: true }); sfx.play("buoc-nhay", 0.35);
    } else { overlay(null); cv.focus({ preventScroll: true }); sfx.play("buoc-nhay", 0.35); }
  }
  // Bảng chọn quân phong cấp (Hậu / Xe / Tượng / Mã)
  function openPromo(from, to) {
    promoAsk = { from, to };
    const c = s.turn;
    ui.promoBox.innerHTML = L.PROMOS.map((t) => `<button class="btn pbtn" type="button" data-p="${t}" aria-label="${PNAME[t]}">${icon(c, t)}<span>${PNAME[t]}</span></button>`).join("");
    ui.promo.hidden = false;
    ui.promoBox.querySelector("button").focus({ preventScroll: true });
  }
  function closePromo() { promoAsk = null; if (ui.promo) ui.promo.hidden = true; }
  ui.promoBox.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-p]"); if (!b || !promoAsk) return;
    const { from, to } = promoAsk; closePromo(); move(from, to, b.dataset.p); cv.focus({ preventScroll: true });
  });
  $("promoX").onclick = () => { closePromo(); sel = -1; targets = []; cv.focus({ preventScroll: true }); };

  // ---------- Nhập liệu ----------
  cv.addEventListener("pointerdown", (e) => { if (e.button > 0) return; cursor = -1; tap(sqAt(e.clientX, e.clientY)); hud(); });
  cv.addEventListener("pointermove", (e) => { hover = e.pointerType === "mouse" ? sqAt(e.clientX, e.clientY) : -1; cv.style.cursor = hover >= 0 && s && !blocked() && (targets.some((m) => m.to === hover) || L.colorOf(s.board[hover]) === s.turn) ? "pointer" : "default"; });
  cv.addEventListener("pointerleave", () => { hover = -1; });
  ui.undo.onclick = doUndo;
  ui.next.onclick = doNext;
  ui.resign.onclick = doResign;
  ui.offer.onclick = () => { if (online() && !s.result) net.send({ t: "draw" }); };
  ui.menu.onclick = () => setPause(ui.ovPause.hidden);
  ui.mute.onclick = toggleMute;
  $("resumeBtn").onclick = () => setPause(false);
  $("restartBtn").onclick = () => { overlay(null); doNext(); };
  // Về menu giữa ván: ván dở vẫn được giữ để "Chơi tiếp ván dở".
  $("menuBtnP").onclick = () => { if (room) return leaveRoom(); pendingResume = s && !s.result && s.moves.length ? s : null; showMenu(); };
  $("menuBtnE").onclick = () => { if (room) return net.leave(); pendingResume = null; showMenu(); };
  $("nextBtn").onclick = doNext;
  $("viewBtn").onclick = () => { overlay(null); cv.focus({ preventScroll: true }); };

  function onKey(e) {
    if (e.target.closest && e.target.closest(".seg, input, .promo")) { if (e.key === "Escape" && promoAsk) { closePromo(); cv.focus(); } return; }
    const k = e.key;
    if (k === "m" || k === "M") { toggleMute(); return; }
    if (!s) return;
    if (k === "Escape") { if (promoAsk) { closePromo(); return; } if (!ui.ovEnd.hidden) { overlay(null); return; } if (sel >= 0) { sel = -1; targets = []; return; } setPause(ui.ovPause.hidden); e.preventDefault(); return; }
    if (!ui.ovPause.hidden || !ui.ovMenu.hidden) return;
    if (k === "n" || k === "N") { doNext(); return; }
    if (!ui.ovEnd.hidden) return;
    if (k === "u" || k === "U" || ((e.ctrlKey || e.metaKey) && (k === "z" || k === "Z"))) { doUndo(); e.preventDefault(); return; }
    const d = { ArrowUp: -8, ArrowDown: 8, ArrowLeft: -1, ArrowRight: 1 }[k];
    if (d) {
      e.preventDefault();
      let c = cursor >= 0 ? disp(cursor) : sel >= 0 ? disp(sel) : disp(L.kingSq(s.board, s.turn));
      const r = (c >> 3) + (Math.abs(d) === 8 ? Math.sign(d) : 0), col = (c & 7) + (Math.abs(d) === 1 ? d : 0);
      c = Math.max(0, Math.min(7, r)) * 8 + Math.max(0, Math.min(7, col));
      cursor = disp(c); return;
    }
    if ((k === "Enter" || k === " ") && document.activeElement === cv) { e.preventDefault(); if (cursor >= 0) { tap(cursor); hud(); } }
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
    get room() { return room; }, get mySeat() { return mySeat(); }, get myColor() { return myColor(); }, net,
    get selected() { return sel; }, get targets() { return targets.slice(); }, get promoOpen() { return !!promoAsk; },
    get layout() { return { ...G }; }, get flipped() { return flip(); },
    sfx,
    // Tâm ô (chỉ số logic) theo toạ độ CSS của trang — dùng cho test bấm thật.
    squarePoint(i) {
      const b = cv.getBoundingClientRect(), d = disp(i);
      return { x: b.left + (G.ox + (d & 7) * G.cs + G.cs / 2) / G.dpr, y: b.top + (G.oy + (d >> 3) * G.cs + G.cs / 2) / G.dpr };
    },
    tap, move, undo: doUndo, next: doNext, resign: doResign,
    destroy() { destroyed = true; net.close(); clearTimers(); cancelAnimationFrame(raf); ro.disconnect(); sfx.close(); window.removeEventListener("keydown", onKey); homeLinks.forEach((a) => a.removeEventListener("click", onHomeClick)); },
  };
}
