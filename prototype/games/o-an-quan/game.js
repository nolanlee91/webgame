// Ô Ăn Quan — điều khiển: màn vào game, HUD, chơi với máy, phòng online + chat, âm thanh, lưu ván dở.
// Luật ở logic.js (dùng chung với máy chủ), máy chơi ở ai.js, vẽ bàn + hoạt cảnh ở board.js, hình vẽ bằng code ở art.js.
import { newMatch, nextRound, restartRound, playSteps, replay, canPlay, isOver, isAiTurn, legalMoves, ROWS, LEVELS, RULES } from "./logic.js";
import { bestMove } from "./ai.js";
import { createBoard } from "./board.js?v=oaq2";
import { makeYardTile, makeBoard, makeStones, makeQuan, DEFAULT_PLACEMENTS } from "./art.js?v=oaq2";
import { createNet, CODE_RE } from "./net.js?v=kk1h3";
import { shareResult } from "../_shared/share.js?v=s2";
import { isChatOff, initChatOff } from "../_shared/chat-off.js?v=co1";
import { sharedName, initKick, kickButtonHTML, BANNED_TEXT, KICK_ERR } from "../_shared/online-kit.js?v=ok2"; // tên dùng chung + "Mời ra"

const V = "oaq2"; // tag chống cache — đổi cùng lúc với index.html khi đổi API giữa các module
const SAVE_KEY = "wgp.o-an-quan.v1", NAME_KEY = "wgp.o-an-quan.name";
const DEFAULT_OPTS = { aiLevel: "medium", rule: "thuong", size: 2 };
const LEVEL_NAME = { easy: "Dễ", medium: "Vừa", hard: "Khó" };
const ERR = {
  "no-room": "Không tìm thấy phòng — kiểm tra lại mã phòng.",
  full: "Phòng đã đủ người.",
  started: "Phòng này đang chơi, không vào thêm được.",
  "not-host": "Chỉ chủ phòng làm được việc này.",
  "need-all": "Cần đủ người mới bắt đầu được.",
  "not-turn": "Chưa tới lượt bạn.",
  illegal: "Nước này không đi được.",
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

// Biểu tượng pixel: viên sỏi theo màu đội (HUD) và viên quan (tiêu đề)
const PEB = ["..XXXX..", ".XXXXXX.", "XXXXXXXX", "XXXXXXXX", ".XXXXXX.", "..XXXX.."];
function pebbleSvg(c, hi, d) {
  let r = "";
  PEB.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === "X") r += `<rect x="${x}" y="${y + 1}" width="1" height="1" fill="${d}"/>`; }));
  PEB.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === "X") r += `<rect x="${x}" y="${y}" width="1" height="1" fill="${y < 2 && x < 5 ? hi : c}"/>`; }));
  return `<svg viewBox="0 0 8 8" shape-rendering="crispEdges" aria-hidden="true" width="100%" height="100%">${r}</svg>`;
}
const TEAM_SVG = [pebbleSvg("#3f8be0", "#9cc8ff", "#122e57"), pebbleSvg("#e0483d", "#ff8f84", "#5a1410")];
const QUAN_SVG = [pebbleSvg("#3fae98", "#8be3cf", "#0f3a33"), pebbleSvg("#c8452e", "#ff9a7e", "#3e0f07")];

// Âm thanh Codex (docs/o-an-quan/AUDIO.md): hiệu ứng mp3 ngắn giải mã vào WebAudio, nạp lười (sau lần chạm đầu hoặc
// ~1,5 s rảnh) để không chặn lúc vào game; hai nền lặp (sân + nhạc) là <audio> nhỏ, chỉ bật sau lần chạm đầu. M tắt tất cả.
const SFX = ["pebble-1", "pebble-2", "pebble-3", "pebble-4", "pick-up", "capture", "capture-quan", "chain", "borrow", "select", "turn", "win", "lose", "draw", "invalid", "chat", "pause"]; // 3 tiếng cuối: Codex 11/2026
const LOOPS = { "amb-yard": 0.22, "music-game": 0.14 };
function makeAudio(dir, sdk) {
  const AC = window.AudioContext || window.webkitAudioContext;
  const buf = {}, log = [];
  let ac = null, loading = false, unlocked = false, pebble = 0, inGame = false;
  const loops = {};
  const muted = () => !!(sdk.sound && sdk.sound.muted);
  const url = (n) => new URL(dir + n + ".mp3?v=oaq2", import.meta.url).href;
  function load() {
    if (loading || !AC) return; loading = true;
    try { ac = ac || new AC(); } catch { ac = null; return; }
    for (const n of SFX) {
      fetch(url(n)).then((r) => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
        .then((b) => ac.decodeAudioData(b)).then((d) => { buf[n] = d; })
        .catch(() => console.warn("Không tải được âm thanh " + n + ".mp3"));
    }
  }
  const idle = setTimeout(load, 1500);
  function syncLoops() {
    for (const [n, vol] of Object.entries(LOOPS)) {
      const want = unlocked && !muted() && (n === "amb-yard" || inGame);
      let a = loops[n];
      if (want && !a) { a = loops[n] = new Audio(url(n)); a.loop = true; a.volume = vol; a.preload = "auto"; }
      if (!a) continue;
      if (want && a.paused) a.play().then(() => log.push({ n, t: Math.round(performance.now()) })).catch(() => {});
      if (!want && !a.paused) a.pause();
    }
  }
  function unlock() {
    load();
    if (ac && ac.state === "suspended") ac.resume().catch(() => {});
    if (!unlocked) { unlocked = true; syncLoops(); }
  }
  addEventListener("pointerdown", unlock, { capture: true });
  addEventListener("keydown", unlock, { capture: true });
  function play(n, vol = 1) {
    if (muted() || !ac || !buf[n]) return false;
    if (ac.state === "suspended") ac.resume().catch(() => {});
    const src = ac.createBufferSource(), gn = ac.createGain();
    src.buffer = buf[n]; gn.gain.value = vol; src.connect(gn).connect(ac.destination); src.start();
    log.push({ n, t: Math.round(performance.now()) }); if (log.length > 500) log.shift();
    return true;
  }
  return {
    play,
    pebble(k = 1) { pebble = (pebble + 1) % 4; return play("pebble-" + (pebble + 1), Math.min(1, 0.55 + k * 0.03)); }, // 4 biến thể xoay vòng
    setInGame(on) { inGame = !!on; syncLoops(); },
    syncMute: syncLoops,
    get loaded() { return Object.keys(buf).length; },
    get loops() { return Object.fromEntries(Object.entries(loops).map(([n, a]) => [n, !a.paused])); },
    log,
    close() { clearTimeout(idle); removeEventListener("pointerdown", unlock, { capture: true }); removeEventListener("keydown", unlock, { capture: true }); for (const a of Object.values(loops)) a.pause(); if (ac) ac.close().catch(() => {}); },
  };
}

function loadSave() {
  const fresh = { opts: { ...DEFAULT_OPTS }, game: null };
  try {
    const v = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!v || typeof v !== "object" || Array.isArray(v)) return fresh;
    const o = v.opts && typeof v.opts === "object" ? v.opts : {};
    const opts = { aiLevel: LEVELS.includes(o.aiLevel) ? o.aiLevel : DEFAULT_OPTS.aiLevel, rule: RULES.includes(o.rule) ? o.rule : DEFAULT_OPTS.rule, size: o.size === 4 ? 4 : 2 };
    let game = null;
    const g = v.game;
    // Ván dở dựng lại TỪ DANH SÁCH NƯỚC ĐI bằng luật (không tin bàn đã lưu); bản lưu khác phiên bản / hỏng thì bỏ ván, giữ tuỳ chọn.
    if (v.v === 1 && g && typeof g === "object" && Array.isArray(g.moves) && g.moves.length) {
      const base = newMatch({ mode: "ai", aiLevel: LEVELS.includes(g.aiLevel) ? g.aiLevel : opts.aiLevel, quanNon: g.quanNon === true, first: g.first === 1 ? 1 : 0 });
      const tally = Array.isArray(g.tally) ? [0, 1, 2].map((i) => Math.max(0, g.tally[i] | 0)) : [0, 0, 0];
      const s = replay({ ...base, tally, round: Math.max(1, g.round | 0) }, g.moves);
      if (s && !isOver(s)) game = s;
    }
    return { opts, game };
  } catch { return fresh; }
}

export function mount(root, ctx = {}) {
  const sdk = ctx.sdk || { sound: { muted: false } };
  const $ = (id) => root.querySelector("#" + id) || document.getElementById(id);
  const cv = $("cv"), stage = $("stage");
  const ui = {
    plA: $("plA"), plB: $("plB"), nA: $("nA"), nB: $("nB"), sA: $("sA"), sB: $("sB"), tA: $("tA"), tB: $("tB"), xA: $("xA"), xB: $("xB"),
    round: $("hRound"), status: $("hStatus"), info: $("hInfo"),
    undo: $("undoBtn"), next: $("newBtn"), menu: $("menuBtn"), mute: $("muteBtn"), muteIc: $("muteIc"), tip: $("tip"),
    anim: $("anim"), fast: $("fastBtn"), skip: $("skipBtn"),
    ovMenu: $("ovMenu"), ovPause: $("ovPause"), ovEnd: $("ovEnd"), ovRoom: $("ovRoom"), mResume: $("mResume"), mNote: $("mNote"),
    vEntry: $("vEntry"), vSolo: $("vSolo"), vCreate: $("vCreate"), createBtn: $("createBtn"), soloBtn: $("soloBtn"), resumeGame: $("resumeGameBtn"), startBtn: $("startBtn"), createRoomBtn: $("createRoomBtn"),
    eTitle: $("eTitle"), eSub: $("eSub"), eResult: $("eResult"), eTally: $("eTally"), pSub: $("pSub"),
    nameIn: $("nameIn"), codeIn: $("codeIn"), joinBtn: $("joinBtn"), mErr: $("mErr"),
    rCode: $("rCode"), rOpts: $("rOpts"), rRule: $("rRule"), rSeats: $("rSeats"), rNote: $("rNote"), rStart: $("rStart"), rCopy: $("rCopy"), rLeave: $("rLeave"), rDisband: $("rDisband"), eDisband: $("eDisband"),
    toast: $("toast"), menuP: $("menuBtnP"), menuE: $("menuBtnE"),
    chat: $("chat"), chatLog: $("chatLog"), chatF: $("chatF"), chatIn: $("chatIn"), chatBtn: $("chatBtn"), chatN: $("chatN"), chatX: $("chatX"),
  };
  root.querySelectorAll(".pcA").forEach((e) => { e.innerHTML = TEAM_SVG[0]; });
  root.querySelectorAll(".pcB").forEach((e) => { e.innerHTML = TEAM_SVG[1]; });
  root.querySelectorAll(".pcQL").forEach((e) => { e.innerHTML = QUAN_SVG[0]; });
  root.querySelectorAll(".pcQR").forEach((e) => { e.innerHTML = QUAN_SVG[1]; });
  const sfx = makeAudio("assets/audio/", sdk);

  const saved = loadSave();
  let opts = saved.opts;
  let s = null;                                   // trạng thái ván (null = chưa vào trận)
  let pendingResume = saved.game;
  let destroyed = false, raf = 0, aiTimer = 0, endTimer = 0, thinking = false, lastHud = 0, moverShown = 0;
  let room = null, skew = 0, sent = false, toastTimer = 0;
  const online = () => !!room && room.phase !== "lobby";
  const myTeam = () => (room ? room.you % 2 : 0);

  const board = createBoard(cv, {
    sfx: {
      pick: () => sfx.play("pick-up", 0.7),
      tach: (k) => sfx.pebble(k),
      take: (v, nth) => sfx.play(nth > 1 ? "chain" : "capture", 0.8), // lần ăn thứ 2 trở đi trong một nước = ăn liên hoàn
      quan: () => sfx.play("capture-quan", 0.9),
      refill: () => sfx.play("borrow", 0.8),
    },
    onChange: () => hud(),
  });
  function toast(text, ms = 2600) {
    ui.toast.textContent = text; ui.toast.hidden = false;
    clearTimeout(toastTimer); if (ms) toastTimer = setTimeout(() => (ui.toast.hidden = true), ms);
  }
  const hideToast = () => { ui.toast.hidden = true; clearTimeout(toastTimer); };
  const setRoomParam = (code) => { try { const u = new URL(location.href); if (code) u.searchParams.set("room", code); else u.searchParams.delete("room"); history.replaceState(null, "", u.href); } catch {} };

  // ---------- Hình: vẽ bằng code ngay (luôn chơi được), rồi thay bằng ảnh Codex nếu manifest có và tải được
  const assets = { manifest: null, loaded: [] };
  const procedural = { yardTile: makeYardTile(), yard: null, board: makeBoard(), stones: makeStones(), quan: makeQuan(), hand: null, placements: DEFAULT_PLACEMENTS };
  board.setSheets(procedural);
  (async () => {
    let man = null;
    try { const r = await fetch("data/asset-manifest.json?v=" + V); if (r.ok) man = await r.json(); } catch {}
    assets.manifest = man;
    const items = (man && Array.isArray(man.items)) ? man.items : [];
    const img = (src) => new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
    const sheet = async (f) => { const it = items.find((i) => i && i.filename === f); if (!it) return null; const im = await img(f + "?v=" + V); return im ? { img: im, frames: it.frames || {} } : null; };
    const [yard, bd, stones, quan, hand] = await Promise.all(["assets/yard-bg.webp", "assets/board.webp", "assets/stones.webp", "assets/quan.webp", "assets/hand.webp"].map(sheet));
    if (destroyed) return;
    const next = { ...procedural };
    const pl = man && man.placements;
    const pitsOk = pl && [...Array(12).keys()].every((i) => Array.isArray(pl["pit-" + i]?.at) && pl["pit-" + i].r > 0);
    if (yard) { next.yard = yard.img; assets.loaded.push("yard"); }
    // ảnh bàn Codex kín 10..470 px → hai khay điểm đặt ngoài bàn (trên / dưới), trừ khi manifest ghi tray-a / tray-b
    if (bd && pitsOk) { next.board = bd.img; next.placements = { "tray-a": { at: [600, 498], w: 560, h: 44 }, "tray-b": { at: [600, -18], w: 560, h: 44 }, ...pl }; assets.loaded.push("board"); }
    if (stones && stones.frames["dan-1"]) { next.stones = stones; next.stoneScale = 1.5; assets.loaded.push("stones"); }
    if (quan && quan.frames["quan-left"] && quan.frames["quan-right"]) { next.quan = quan; assets.loaded.push("quan"); }
    if (hand && hand.frames["hand-hold"]) { next.hand = hand; assets.loaded.push("hand"); }
    if (assets.loaded.length) { board.setSheets(next); layout(); }
  })();

  // ---------- Bố cục
  // OAQ-02: màn dọc hẹp thì bàn xoay 90° (board.info.rot) ⇒ hàng của mình thành cột bên phải — chữ hướng dẫn đổi theo
  function layout() { board.layout(); const side = $("mySide"); if (side) side.textContent = board.info.rot ? "cột bên phải" : "hàng dưới"; }
  const ro = new ResizeObserver(() => { layout(); board.draw(performance.now()); });
  ro.observe(stage);

  // ---------- HUD
  function teamNames() {
    if (room) {
      const p = room.players, nm = (i) => p[i]?.name || (room.phase === "lobby" ? "…" : "?");
      return room.max === 4 ? [nm(0) + " & " + nm(2), nm(1) + " & " + nm(3)] : [nm(0), nm(1)];
    }
    return ["Bạn", "Máy"];
  }
  const seatName = (i) => room?.players[i]?.name || "Người " + (i + 1);
  let warnLeft = -1;
  function hud() {
    const nm = teamNames(), D = board.display;
    ui.nA.textContent = nm[0]; ui.nB.textContent = nm[1];
    document.body.classList.toggle("is-online", online());
    document.body.classList.toggle("in-game", !!s);
    sfx.setInGame(!!s && !overlaysOpen());
    const me = myTeam();
    ui.tA.textContent = "Đội A" + (s && (room ? me === 0 : true) ? " · Bạn" : "");
    ui.tB.textContent = "Đội B" + (room && me === 1 ? " · Bạn" : "");
    if (!room) ui.tB.textContent = "Đội B · Máy";
    const busy = board.busy;
    ui.anim.hidden = !busy;
    ui.fast.setAttribute("aria-pressed", String(board.fast));
    if (!s) {
      ui.sA.textContent = "0"; ui.sB.textContent = "0"; ui.xA.textContent = ""; ui.xB.textContent = room ? "" : LEVEL_NAME[opts.aiLevel];
      ui.round.textContent = room ? "Phòng " + room.code : "Chưa bắt đầu"; ui.status.textContent = room ? "Phòng chờ" : "Sẵn sàng"; ui.info.textContent = "";
      ui.plA.classList.remove("on", "win"); ui.plB.classList.remove("on", "win");
      ui.undo.disabled = true; ui.next.disabled = true; ui.tip.hidden = true; return;
    }
    const sc = D ? D.score : s.score, eat = D ? D.eaten : s.eaten, debt = D ? D.debt : s.debt;
    ui.sA.textContent = sc[0]; ui.sB.textContent = sc[1];
    const extra = (t) => [eat[t] ? eat[t] + " quan" : "", debt[t] ? "nợ " + debt[t] : ""].filter(Boolean).join(" · ");
    ui.xA.textContent = extra(0); ui.xB.textContent = [room ? "" : LEVEL_NAME[s.aiLevel], extra(1)].filter(Boolean).join(" · ");
    const over = isOver(s) && !busy, turn = busy ? moverShown : s.turn;
    ui.round.textContent = "Ván " + s.round + (s.quanNon ? " · quan non" : "");
    ui.plA.classList.toggle("on", !over && turn === 0); ui.plB.classList.toggle("on", !over && turn === 1);
    ui.plA.classList.toggle("win", over && s.winner === 0); ui.plB.classList.toggle("win", over && s.winner === 1);
    const onBoard = (D ? D.pits : s.pits).reduce((a, b) => a + b, 0);
    ui.info.textContent = "Trên bàn " + onBoard + " dân";
    let st;
    if (over) st = s.winner === 2 ? "Hòa!" : (room ? (s.winner === me ? "Đội bạn thắng!" : nm[s.winner] + " thắng!") : s.winner === 0 ? "Bạn thắng!" : "Máy thắng!");
    else if (busy) st = "Đang rải sỏi…";
    else if (thinking) st = "Máy đang nghĩ…";
    else if (online()) {
      const left = room.deadline ? Math.max(0, Math.ceil((room.deadline - (Date.now() + skew)) / 1000)) : 0;
      const t = left && left <= 15 ? " · " + left + "s" : "";
      const mine = room.seat === room.you;
      if (mine && left > 0 && left <= 5 && left !== warnLeft) { warnLeft = left; sfx.play("select", 0.5); }
      const who = room.players[room.seat];
      st = mine ? (sent ? "Đang gửi…" : "Lượt bạn") + t : who && !who.connected ? seatName(room.seat) + " mất kết nối…" + t : "Chờ " + seatName(room.seat) + "…" + t;
    } else st = s.turn === 0 ? "Lượt bạn" : "Lượt máy";
    ui.status.textContent = st;
    ui.undo.disabled = !!room || busy || over || isOver(s) || !s.moves.length || !humanMoved();
    ui.next.disabled = online() && !isOver(s);
    ui.next.classList.toggle("btn--primary", over);
    ui.next.firstChild.textContent = over ? "Ván tiếp ▶" : "Ván mới";
    const act = canAct();
    ui.tip.textContent = board.selected != null ? "Bấm mũi tên vàng để chọn hướng rải" : "Chạm một ô sáng bên bạn để bốc sỏi";
    ui.tip.hidden = !(act && (board.selected != null || s.ply < 2));
  }
  const humanMoved = () => s && s.moves.some((_, i) => (s.first + i) % 2 === 0);
  function showMute() {
    const m = !!sdk.sound.muted;
    ui.mute.setAttribute("aria-pressed", String(m));
    ui.muteIc.src = "assets/ui/icon-am-thanh-" + (m ? "tat" : "bat") + ".png";
  }
  function toggleMute() { sdk.sound.muted = !sdk.sound.muted; try { localStorage.setItem("wgp.muted", sdk.sound.muted ? "1" : "0"); } catch {} showMute(); sfx.syncMute(); }

  function persist() {
    if (room) return; // ván online do máy chủ giữ — không ghi đè ván dở chơi với máy
    try {
      const game = s && s.mode === "ai" && !isOver(s) && s.moves.length ? { quanNon: s.quanNon, aiLevel: s.aiLevel, first: s.first, round: s.round, tally: s.tally, moves: s.moves } : null;
      localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 1, opts, game }));
    } catch {}
  }

  // ---------- Menu / overlay
  function syncOpts() {
    root.querySelectorAll(".seg").forEach((seg) => {
      const k = seg.dataset.k, val = k === "roomRule" ? room?.rule : opts[k];
      seg.querySelectorAll("button").forEach((b) => {
        const on = String(val) === b.dataset.v;
        b.setAttribute("aria-checked", String(on)); b.tabIndex = on ? 0 : -1;
      });
    });
  }
  root.querySelectorAll(".seg").forEach((seg) => {
    seg.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      const k = seg.dataset.k;
      if (k === "roomRule") { if (room && room.you === room.host) net.send({ t: "rule", rule: b.dataset.v }); return; }
      opts[k] = k === "size" ? Number(b.dataset.v) : b.dataset.v;
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
    ui.mResume.textContent = g ? "Ván " + g.round + " đang dở · " + g.moves.length + " nước · điểm " + g.score[0] + " – " + g.score[1] + " (máy " + LEVEL_NAME[g.aiLevel] + ")" : "";
  }
  function showMenu(err = "") {
    clearTimers();
    room = null; sent = false; document.body.classList.remove("is-online");
    renderChat(null); busyMenu(false);
    syncOpts(); menuResume(); ui.mNote.textContent = "";
    overlay("menu");
    s = null; board.skip(); board.selected = null; board.cursor = null; board.setPerspective(0);
    board.show(newMatch());
    hud(); layout();
    menuView("entry"); ui.mErr.textContent = err;
  }
  ui.soloBtn.onclick = () => menuView("solo");
  ui.resumeGame.onclick = () => { if (pendingResume) start(pendingResume); };
  ui.startBtn.onclick = () => start(null);
  $("soloBack").onclick = () => menuView("entry", ui.soloBtn);
  $("createBack").onclick = () => menuView("entry", ui.createBtn);
  ui.createBtn.onclick = () => goOnline("create");
  ui.createRoomBtn.onclick = () => goOnline("room");
  ui.ovMenu.addEventListener("keydown", (e) => { if (e.key === "Escape" && view !== "entry") { e.preventDefault(); e.stopPropagation(); menuView("entry", view === "solo" ? ui.soloBtn : ui.createBtn); } });

  // ---------- Online
  const net = createNet({
    joined(code) { setRoomParam(code); hideToast(); ui.mErr.textContent = ""; },
    state(v, sk) { skew = sk; netState(v); },
    left() { setRoomParam(""); if (exiting) return; s = null; showMenu(); },
    gone(text) { setRoomParam(""); s = null; showMenu(text); },
    closed() {
      if (exiting) return;
      const mine = !!room && room.you === room.host;
      setRoomParam(""); s = null; sfx.play("borrow", 0.5);
      showMenu(mine ? "Đã hủy phòng." : "Chủ phòng đã hủy phòng.");
    },
    error(code, inRoom) {
      const text = ERR[code] || "Có lỗi xảy ra (" + code + ").";
      if (!inRoom) { busyMenu(false); ui.mErr.textContent = text; return; }
      if (code === "illegal" || code === "not-turn") { sent = false; hud(); }
      if (code !== "phase") toast(text);
    },
    offline(text) { busyMenu(false); if (room) { s = null; showMenu(text); } else ui.mErr.textContent = text; },
    reconnecting() { toast("Mất kết nối — đang nối lại…", 0); },
  }, { url: ctx.wsUrl });
  function busyMenu(on) { ui.ovMenu.querySelectorAll(".btn").forEach((b) => (b.disabled = on)); }
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
  const myName = sharedName({ game: "o-an-quan", input: ui.nameIn, legacy: () => { try { return localStorage.getItem(NAME_KEY) || ""; } catch { return ""; } } });
  initKick({ send: (o) => net.send(o) }); // chủ phòng "Mời ra" (hộp xác nhận pixel → máy chủ kiểm quyền)

  function showRoom(v) {
    const n = v.players.length, host = v.you === v.host;
    ui.rCode.textContent = v.code;
    ui.rOpts.textContent = (v.max === 4 ? "2v2 · lượt A1 → B1 → A2 → B2" : "1v1") + " · luật " + (v.rule === "quan-non" ? "quan non" : "thường") + (host ? "" : " (chủ phòng chọn)");
    ui.rRule.hidden = !host; syncOpts();
    ui.rSeats.innerHTML = [...Array(v.max).keys()].map((i) => {
      const p = v.players[i], team = i % 2, tag = `<span class="team${team ? " b" : ""}">${team ? "Đội B" : "Đội A"}${v.max === 4 ? (i < 2 ? "1" : "2") : ""}</span>`;
      if (!p) return `<div class="seat off"><span class="pc">${TEAM_SVG[team]}</span>${tag}<b>Đang chờ người chơi…</b><em>Chỗ trống</em></div>`;
      return `<div class="seat"><span class="pc">${TEAM_SVG[team]}</span>${tag}<b>${esc(p.name)}${i === v.you ? " (Bạn)" : ""}</b><em class="${p.connected ? "ok" : "bad"}">${i === v.host ? "Chủ phòng · " : ""}${p.connected ? "Sẵn sàng" : "Mất kết nối"}</em>${host && i !== v.you ? kickButtonHTML(i, p.name) : ""}</div>`;
    }).join("");
    ui.rStart.textContent = host ? "▶ Bắt đầu" : "Chờ chủ phòng";
    ui.rStart.disabled = !host || n < v.max;
    ui.rNote.textContent = n < v.max ? "Còn thiếu " + (v.max - n) + " người — gửi mã " + v.code + " (hoặc bấm Chép link mời) cho bạn bè." : host ? "Đủ người — bấm Bắt đầu." : "Chủ phòng sẽ bấm Bắt đầu.";
    ui.rDisband.hidden = !host;
    if (ui.ovRoom.hidden) { overlay("room"); (host ? ui.rCopy : ui.rLeave).focus({ preventScroll: true }); }
  }
  function fromServer(v) {
    const G = v.game;
    const base = { ...newMatch({ quanNon: G.quanNon, first: G.first, mode: "pvp" }), round: G.round };
    let n = replay(base, G.moves);
    const same = n && n.pits.every((x, i) => x === G.pits[i]) && n.score.every((x, i) => x === G.score[i]);
    if (!same) n = { ...base, pits: G.pits.slice(), quan: G.quan.slice(), score: G.score.slice(), debt: G.debt.slice(), eaten: G.eaten.slice(), quanBy: (G.quanBy || [-1, -1]).slice(), turn: G.turn, moves: G.moves.map((m) => m.slice()), ply: G.moves.length, winner: G.winner, final: G.final };
    return { ...n, tally: G.tally.slice(), round: G.round };
  }

  // ---------- Trò chuyện (qua máy chủ; tên người gửi do máy chủ gắn) — giống Cờ Caro
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
        const seat = v.players.findIndex((p) => p.name === c.name);
        li.className = c.mine ? "mine" : seat % 2 === 1 ? "b" : "a";
        b.textContent = c.mine ? "Bạn" : c.name; li.append(b, document.createTextNode(c.text));
        return li;
      }) : [Object.assign(document.createElement("li"), { className: "empty", textContent: "Chưa có tin nhắn. Chào cả phòng một câu nhé!" })]));
      if (atEnd || list.at(-1)?.mine) ui.chatLog.scrollTop = ui.chatLog.scrollHeight;
      const last = list.at(-1);
      if (isNew && last && !last.mine && !off) sfx.play("chat", 0.7);
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

  function presenceSfx(prev, v) {
    if (!prev || prev.code !== v.code) return;
    let join = false, gone = (prev.players || []).length > (v.players || []).length || (!prev.oppLeft && !!v.oppLeft);
    (v.players || []).forEach((p, i) => {
      if (i === v.you || !p) return;
      const o = prev.players[i];
      if (!o || o.name !== p.name || (!o.connected && p.connected)) join = true;
      else if (o.connected && !p.connected) gone = true;
    });
    if (join) sfx.play("turn", 0.5); else if (gone) sfx.play("pick-up", 0.5);
  }
  function netState(v) {
    const prev = room; room = v;
    renderChat(v); presenceSfx(prev, v);
    if (v.phase === "lobby") {
      clearTimers(); s = null; sent = false; board.skip();
      if (v.oppLeft && prev && prev.phase !== "lobby") toast("Có người đã rời phòng — gửi mã cho người khác vào chơi tiếp.", 4000);
      board.setPerspective(v.you % 2); board.show(newMatch());
      hud(); showRoom(v); return;
    }
    const sameGame = prev && prev.phase !== "lobby" && prev.gid === v.gid && s;
    const next = fromServer(v);
    sent = false;
    if (!sameGame) {
      clearTimers(); board.skip(); board.selected = null; board.cursor = null;
      board.setPerspective(v.you % 2);
      s = next; board.show(s);
      overlay(null); layout(); cv.focus({ preventScroll: true });
      sfx.play("turn", 0.6);
      if (isOver(s)) endTimer = setTimeout(showEnd, 300);
      hud(); return;
    }
    if (v.seq === prev.seq + 1 && v.act) {
      const r = playSteps(s, v.act.pit, v.act.dir);
      if (r && r.state.pits.every((x, i) => x === next.pits[i])) {
        if (v.act.auto) toast(seatName(v.act.seat) + " hết giờ — máy chủ đi thay.", 2200);
        runMove(r.steps, next, v.act.seat % 2);
        return;
      }
    }
    // cùng seq (chỉ đổi chat / kết nối / hạn giờ): giữ nguyên ván đang hiển thị, không cắt ngang hoạt cảnh
    if (v.seq !== prev.seq) { board.skip(); s = next; board.show(s); if (isOver(s) && ui.ovEnd.hidden) endTimer = setTimeout(showEnd, 300); }
    hud();
  }
  function leaveRoom() {
    if (online() && !isOver(s) && !confirm("Rời ván đang chơi? Cả phòng sẽ phải chờ người mới.")) return;
    net.leave();
  }
  ui.rStart.onclick = () => net.send({ t: "start" });
  ui.rLeave.onclick = () => net.leave();
  function disbandRoom() {
    if (!room || room.you !== room.host) return;
    if (room.players.length > 1 && !confirm("Hủy phòng? Mọi người trong phòng sẽ bị đưa ra ngoài.")) return;
    if (!net.disband()) toast("Đang nối lại máy chủ — chưa hủy được phòng.");
  }
  ui.rDisband.onclick = disbandRoom; ui.eDisband.onclick = disbandRoom;
  // "← Trang chủ" khi đang trong phòng: báo máy chủ rời phòng (chủ phòng ngồi một mình thì hủy luôn) rồi mới chuyển trang.
  let exiting = false;
  function onHomeClick(e) {
    if (!(room || net.inRoom) || e.defaultPrevented || e.button > 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (exiting) return;
    if (online() && s && !isOver(s) && !confirm("Rời ván đang chơi?")) return;
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

  // ---------- Ván chơi với máy
  function start(game) {
    clearTimers();
    if (game) { s = game; opts.aiLevel = s.aiLevel; opts.rule = s.quanNon ? "quan-non" : "thuong"; }
    else s = newMatch({ mode: "ai", aiLevel: opts.aiLevel, rule: opts.rule, first: 0 });
    pendingResume = null;
    board.skip(); board.setPerspective(0); board.selected = null; board.cursor = null; board.show(s);
    overlay(null); layout(); persist(); hud(); cv.focus({ preventScroll: true });
    sfx.play("turn", 0.6);
    maybeAi();
  }
  function showEnd() {
    if (!s || !isOver(s)) return;
    const nm = teamNames(), f = s.final || { score: s.score, debt: [0, 0], eaten: s.eaten };
    const me = myTeam();
    const t = s.winner === 2 ? "Hòa!" : room ? (s.winner === me ? "Đội bạn thắng!" : "Đội bạn thua!") : s.winner === 0 ? "Bạn thắng!" : "Máy thắng!";
    ui.eTitle.innerHTML = s.winner === 2 ? t : `<span class="pc">${TEAM_SVG[s.winner]}</span>${esc(t)}`;
    const debts = [0, 1].filter((i) => f.debt[i]).map((i) => nm[i] + " trả nợ " + f.debt[i] + " dân").join(", ");
    ui.eSub.textContent = (s.ply >= 240 ? "Ván quá dài — dừng và tính điểm." : "Hết quan! Mỗi bên thu dân còn trên hàng mình.") + (debts ? " " + debts + "." : "");
    const box = (i) => `<div class="${i ? "rb" : "ra"}"><small>${esc(nm[i])}</small><b>${f.score[i]}</b><em>${f.eaten[i]} quan</em></div>`;
    ui.eResult.innerHTML = box(0) + box(1);
    ui.eTally.textContent = "Tỉ số các ván: " + nm[0] + " " + s.tally[0] + " – " + s.tally[1] + " " + nm[1] + (s.tally[2] ? " · hòa " + s.tally[2] : "");
    ui.menuE.textContent = online() ? "Rời phòng" : "Trận mới";
    ui.eDisband.hidden = !(room && room.you === room.host);
    overlay("end");
    $("nextBtn").focus({ preventScroll: true });
  }
  // "Khoe kết quả": ảnh 1080×1080 với số thật của ván vừa xong (điểm, quan ăn được, số nước, mức máy / đối thủ, tỉ số các ván).
  function shareEnd() {
    if (!s || !isOver(s)) return;
    const f = s.final || { score: s.score, eaten: s.eaten }, me = myTeam(), op = 1 - me, nm = teamNames();
    const mine = f.score[me], theirs = f.score[op], gap = mine - theirs;
    const res = s.winner === 2 ? "draw" : s.winner === me ? "win" : "lose";
    const vs = room ? "" : " máy";
    const title = (res === "win" ? "Thắng" : res === "lose" ? "Thua" : "Hòa") + vs + " " + mine + "–" + theirs;
    const tagline = res === "draw" ? "Bất phân thắng bại — làm thêm ván nữa!"
      : res === "lose" ? (room ? "Thua ván này thôi, ván sau gỡ lại cả quan lẫn dân!" : "Máy ăn quan mất rồi, mai phục thù!")
      : gap >= 20 ? (room ? "Rải một đường, đối thủ hết dân luôn!" : "Máy xin thua, quan dân về tay hết!")
      : gap <= 6 ? "Thắng sát nút, tim đập thình thịch!" : "Rải sỏi khéo như bà ngoại dạy.";
    shareResult({
      game: "o-an-quan", title, tagline, theme: "wood",
      lines: [
        room ? "Đối thủ: " + nm[op] : "Mức máy: " + LEVEL_NAME[s.aiLevel],
        "Quan ăn được: " + f.eaten[me] + " – " + f.eaten[op],
        "Số nước: " + s.moves.length,
        "Tỉ số các ván: " + s.tally[me] + " – " + s.tally[op] + (s.tally[2] ? " (hòa " + s.tally[2] + ")" : ""),
      ],
    });
  }
  function clearTimers() { clearTimeout(aiTimer); clearTimeout(endTimer); thinking = false; }

  // ---------- Hành động
  const overlaysOpen = () => !ui.ovMenu.hidden || !ui.ovPause.hidden || !ui.ovEnd.hidden || !ui.ovRoom.hidden;
  function canAct() {
    if (!s || isOver(s) || board.busy || thinking || overlaysOpen()) return false;
    if (online()) return room.seat === room.you && !sent;
    return !room && s.mode === "ai" && s.turn === 0;
  }
  function sow(pit, dir) {
    if (!canAct() || !canPlay(s, pit, dir)) return false;
    board.selected = null; board.cursor = null;
    if (online()) {
      sent = net.send({ t: "move", pit, dir });
      if (!sent) toast("Đang nối lại máy chủ…");
      hud(); return sent;
    }
    const r = playSteps(s, pit, dir);
    runMove(r.steps, r.state, s.turn);
    return true;
  }
  // chạy hoạt cảnh của một nước (của mình, của máy, hay nhận từ máy chủ), rồi tới bước kế
  function runMove(steps, final, mover) {
    moverShown = mover;
    s = final;
    if (!room) persist();
    hud();
    board.animate(steps, final, teamNames()).then(() => {
      if (destroyed || s !== final) return;
      hud();
      if (isOver(s)) {
        const lost = room ? s.winner !== myTeam() : s.winner === 1;
        sfx.play(s.winner === 2 ? "draw" : lost ? "lose" : "win", 0.9);
        if (!room) { sdk.reportScore?.(s.final.score[0]); sdk.gameOver?.({ winner: s.winner, score: s.final.score, moves: s.moves.length }); }
        endTimer = setTimeout(showEnd, 900);
        return;
      }
      const myTurn = room ? room.seat === room.you : s.turn === 0;
      if (myTurn && mover !== myTeam()) sfx.play("turn", 0.6);
      maybeAi();
    });
  }
  function maybeAi() {
    if (!s || !isAiTurn(s) || thinking || board.busy || room) return;
    thinking = true; hud();
    aiTimer = setTimeout(() => {
      if (destroyed || !s || !isAiTurn(s)) { thinking = false; hud(); return; }
      const mv = bestMove(s, s.aiLevel);
      if (!mv) { thinking = false; hud(); return; }
      // hiện ô máy chọn một nhịp cho người chơi kịp nhìn
      board.preview = { pit: mv[0], dir: mv[1], side: 1 };
      aiTimer = setTimeout(() => {
        thinking = false; board.preview = null;
        if (destroyed || !s || !isAiTurn(s)) { hud(); return; }
        const r = playSteps(s, mv[0], mv[1]);
        if (r) runMove(r.steps, r.state, 1); else hud();
      }, 380);
    }, 380 + Math.random() * 220);
  }
  function doUndo() {
    if (room || !s || isOver(s) || !s.moves.length || overlaysOpen()) return false;
    // bỏ ngược tới trước nước gần nhất của người chơi (cả nước của máy sau đó)
    let k = s.moves.length - 1;
    while (k >= 0 && (s.first + k) % 2 !== 0) k--;
    if (k < 0) return false;
    clearTimers(); board.skip();
    const u = replay(restartRound(s), s.moves.slice(0, k));
    if (!u) return false;
    s = u; board.selected = null; board.show(s);
    sfx.play("pick-up", 0.5);
    persist(); hud(); maybeAi();
    return true;
  }
  function doNext() {
    if (!s) return;
    if (room) { if (isOver(s)) net.send({ t: "again" }); return; }
    clearTimers(); board.skip();
    s = isOver(s) ? nextRound(s) : { ...restartRound(s) };
    board.selected = null; board.show(s);
    overlay(null); persist(); hud(); cv.focus({ preventScroll: true }); sfx.play("turn", 0.6); maybeAi();
  }
  function setPause(on) {
    if (!s || !ui.ovMenu.hidden || !ui.ovEnd.hidden) return;
    ui.menuP.textContent = room ? "Rời phòng" : "Về menu";
    if (on) {
      ui.pSub.textContent = "Ván " + s.round + " · " + s.moves.length + " nước · điểm " + s.score[0] + " – " + s.score[1];
      overlay("pause"); $("resumeBtn").focus({ preventScroll: true }); sfx.play("pause", 0.6);
    } else { overlay(null); cv.focus({ preventScroll: true }); sfx.play("pause", 0.6); }
    hud();
  }

  // ---------- Nhập liệu: chạm/nhấp ô bên mình → hai mũi tên vàng hiện trên bàn → chạm mũi tên để rải
  function onPointerDown(e) {
    if (e.button > 0 || !s) return;
    const h = board.hit(e.clientX, e.clientY);
    if (h && h.kind === "arrow") { sow(board.selected, h.dir); return; }
    if (!canAct()) return;
    if (h && h.kind === "pit") {
      const mineRow = ROWS[myTeam()].includes(h.pit);
      if (mineRow && s.pits[h.pit] > 0) { board.selected = board.selected === h.pit ? null : h.pit; board.cursor = null; sfx.play("select", 0.7); }
      else { board.flash = { pit: h.pit, t: performance.now() }; board.selected = null; sfx.play("invalid", 0.7); }
    } else board.selected = null;
    hud();
  }
  function onPointerMove(e) {
    if (e.pointerType !== "mouse") return;
    const h = board.hit(e.clientX, e.clientY);
    board.hover = h && h.kind === "pit" ? h.pit : null;
    board.hoverArrow = h && h.kind === "arrow" ? h.dir : 0;
    cv.style.cursor = canAct() && h && (h.kind === "arrow" || (ROWS[myTeam()].includes(h.pit) && s.pits[h.pit] > 0)) ? "pointer" : "";
  }
  cv.addEventListener("pointerdown", onPointerDown);
  cv.addEventListener("pointermove", onPointerMove);
  cv.addEventListener("pointerleave", () => { board.hover = null; board.hoverArrow = 0; });
  ui.undo.onclick = doUndo;
  ui.next.onclick = doNext;
  ui.menu.onclick = () => setPause(ui.ovPause.hidden);
  ui.mute.onclick = toggleMute;
  ui.fast.onclick = () => { board.fast = !board.fast; hud(); };
  ui.skip.onclick = () => board.skip();
  $("resumeBtn").onclick = () => setPause(false);
  $("restartBtn").onclick = doNext;
  $("menuBtnP").onclick = () => { if (room) return leaveRoom(); pendingResume = s && !isOver(s) && s.moves.length ? s : null; board.skip(); showMenu(); };
  $("menuBtnE").onclick = () => { if (room) return net.leave(); pendingResume = null; showMenu(); };
  $("nextBtn").onclick = doNext;
  $("shareBtn").onclick = shareEnd;
  $("viewBtn").onclick = () => { overlay(null); cv.focus({ preventScroll: true }); };

  function onKey(e) {
    if (e.target.closest && e.target.closest(".seg, input")) return;
    const k = e.key;
    if (k === "m" || k === "M") { toggleMute(); return; }
    if (!s) return;
    if (k === "f" || k === "F") { if (board.busy) { board.fast = !board.fast; hud(); } return; }
    if ((k === "s" || k === "S") && board.busy) { board.skip(); return; }
    if (k === "Escape") {
      if (!ui.ovEnd.hidden) { overlay(null); return; }
      if (board.selected != null && ui.ovPause.hidden) { board.selected = null; hud(); e.preventDefault(); return; }
      setPause(ui.ovPause.hidden); e.preventDefault(); return;
    }
    if (!ui.ovPause.hidden || !ui.ovMenu.hidden) return;
    if (k === "n" || k === "N") { doNext(); return; }
    if (!ui.ovEnd.hidden) return;
    if (k === "u" || k === "U" || ((e.ctrlKey || e.metaKey) && (k === "z" || k === "Z"))) { doUndo(); e.preventDefault(); return; }
    const d = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[k];
    if (d) {
      e.preventDefault();
      if (!canAct()) return;
      const dir = board.dirFromKey(d[0], d[1]); if (!dir) return;
      if (board.selected != null) { sow(board.selected, dir); return; }
      const row = ROWS[myTeam()].filter((p) => s.pits[p] > 0); if (!row.length) return;
      const i = row.indexOf(board.cursor);
      board.cursor = i < 0 ? row[dir > 0 ? 0 : row.length - 1] : row[Math.max(0, Math.min(row.length - 1, i + dir))];
      hud(); return;
    }
    if ((k === "Enter" || k === " ") && document.activeElement === cv) {
      e.preventDefault();
      if (canAct() && board.cursor != null) { board.selected = board.cursor; hud(); }
    }
  }
  window.addEventListener("keydown", onKey);

  function frame(now) {
    if (destroyed) return;
    board.canAct = canAct();
    board.draw(now);
    if (now - lastHud > (online() ? 500 : 1000)) { lastHud = now; hud(); }
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
    get state() { return s; }, get thinking() { return thinking; }, get busy() { return board.busy; },
    get room() { return room; }, get myTeam() { return myTeam(); }, net, board, sfx, assets,
    get canAct() { return canAct(); },
    legal: () => (s ? legalMoves(s) : []),
    pitPoint: (pit) => board.pitPoint(pit), arrowPoint: (dir) => board.arrowPoint(dir),
    sow, undo: doUndo, next: doNext, skip: () => board.skip(),
    destroy() { destroyed = true; net.close(); clearTimers(); cancelAnimationFrame(raf); ro.disconnect(); sfx.close(); window.removeEventListener("keydown", onKey); homeLinks.forEach((a) => a.removeEventListener("click", onHomeClick)); },
  };
}
