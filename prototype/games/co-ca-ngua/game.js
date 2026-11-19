// Cờ Cá Ngựa — phần hiển thị + điều khiển, theo hợp đồng Game SDK (docs/tech-architecture.md §3.3):
//   mount(el, ctx) -> { pause, resume, destroy }
// Vẽ bằng bộ board-v5 của Codex (assets/board-v5/: bàn 832×832 lưới 13×13 ô 64px + ngựa 4 màu × 9 khung animation).
// Nếu ảnh không tải được thì tự quay về hình khối tạm (cùng lưới 13×13) — vẫn chơi được.
// Luật nằm hết trong logic.js; file này chỉ vẽ + nhận thao tác.
import { SEAT_NAMES, BASE, createGame, roll, move, restart, currentSeat, stableLevel, isHome, drainEvents } from "./logic.js";
import { createHud } from "./hud.js?v=leave1";
import { botMove, makeRng } from "./ai.js";
import { simulateThrow, sampleThrow, releaseVelocity, freeSpot } from "./dice-throw.js?v=leave1";

export const W = 832, H = 832;
const N = 13, C = 64, BX = 0, BY = 0;   // canvas = đúng ảnh board-v5 (13×13 ô 64px); HUD nằm ngoài (hud.js)
const PAL = {
  bg: "#11171c", panel: "rgba(14,18,22,.9)", ink: "#f4ead2", soft: "#b9ad93", edge: "#7a5152",
  wood: "#6b4a2e", woodDark: "#2a1a10", track: "#8f97ad", trackDark: "#4c536a", gold: "#ffc94a",
  red: ["#e0483d", "#7a1c17", "#f59a92"], green: ["#3fae4a", "#17521c", "#97dc9c"],
  yellow: ["#f2b632", "#7a5410", "#ffe08a"], blue: ["#3a7bd5", "#163a73", "#9cc3f5"],
};

// Đường đi chung 44 ô (ngược chiều kim đồng hồ), ô 0 = ô xuất phát của ghế 0 (Đỏ, nhánh trên).
const PATH = [
  [5, 0], [5, 1], [5, 2], [5, 3], [5, 4], [4, 5], [3, 5], [2, 5], [1, 5], [0, 5], [0, 6],
  [0, 7], [1, 7], [2, 7], [3, 7], [4, 7], [5, 8], [5, 9], [5, 10], [5, 11], [5, 12], [6, 12],
  [7, 12], [7, 11], [7, 10], [7, 9], [7, 8], [8, 7], [9, 7], [10, 7], [11, 7], [12, 7], [12, 6],
  [12, 5], [11, 5], [10, 5], [9, 5], [8, 5], [7, 4], [7, 3], [7, 2], [7, 1], [7, 0], [6, 0],
];
// Chuồng đích (bậc 1 → 4, đi vào tâm) và góc chuồng xuất phát của từng ghế.
const STABLE = [
  [[6, 1], [6, 2], [6, 3], [6, 4]], [[1, 6], [2, 6], [3, 6], [4, 6]],
  [[6, 11], [6, 10], [6, 9], [6, 8]], [[11, 6], [10, 6], [9, 6], [8, 6]],
];
const CORNER = [[0, 0], [0, 8], [8, 8], [8, 0]]; // ghế 0 trên-trái, 1 dưới-trái, 2 dưới-phải, 3 trên-phải
const SLOT = [[1.4, 1.4], [3.6, 1.4], [1.4, 3.6], [3.6, 3.6]];

// ---------- Asset thật: board-v5 (Codex, chủ dự án duyệt 2026-11-17) ----------
// board-v5-grid.json: tâm ô = [col*64+32, row*64+32]. Màu nhánh trên ảnh, đi ngược chiều kim đồng hồ từ nhánh trên:
// Đỏ (trên) → Xanh dương (trái) → Vàng (dưới) → Xanh lá (phải). logic.js đặt ghế 1 ở nhánh trái nên MÀU HIỂN THỊ
// của từng ghế lấy theo ảnh: ghế 0 Đỏ, 1 Xanh dương, 2 Vàng, 3 Xanh lá (luật, thứ tự lượt không đổi).
export const VIEW_COLORS = ["red", "blue", "yellow", "green"];
export const FILE_COLOR = { red: "do", blue: "xanh-duong", green: "xanh-la", yellow: "vang" };
const V5 = "assets/board-v5/";
export const ART = {
  board: { src: V5 + "board-v5.webp", grid: V5 + "board-v5-grid.json" },
  horse: { manifest: V5 + "animation-manifest.json", sheet: (c) => V5 + "ngua-" + FILE_COLOR[c] + "-animation.webp" },
  dice: { src: "assets/xuc-xac.webp", box: [304, 136, 672, 716], top: [[640, 160], [940, 327], [640, 503], [340, 327]], down: [0, 322] },
};
// Chuồng xuất phát = khối 5×5 ô ở góc (CORNER); trong ảnh là cái lán 256×256 bắt đầu từ +32px. 4 ngựa đứng dưới mái lán.
const HUT = 32, HUT_SIZE = 256;
const SLOT_FEET = [[104, 206], [204, 206], [104, 270], [204, 270]]; // chân ngựa, toạ độ trong khối 5×5 (px)
const FOOT = 22;                                                     // chân ngựa thấp hơn tâm ô 22px
// Chơi với máy: ghế của người chơi chọn được (màu). Ghế dùng = các ghế theo chiều đi bắt đầu từ ghế người chơi
// (2 người đối diện, 3 người bỏ ghế ngay trước mình) → người chơi luôn gieo trước; ghế 0 ⇒ đúng SEATS_FOR của logic.js.
export function seatsFor(players, human = 0) {
  const ring = [0, 1, 2, 3].map((k) => (human + k) % 4);
  return players === 2 ? [ring[0], ring[2]] : ring.slice(0, players);
}
export const COLOR_KEY = "wgp.co-ca-ngua.botColor"; // màu người chơi chọn ở phòng chờ chơi với máy (nhớ qua localStorage)
export { PATH, STABLE, CORNER };
let GRID = { cellSize: C, origin: [0, 0] };
// So board-v5-grid.json với đường đi/chuồng đích của game: trả về danh sách chỗ lệch (rỗng = khớp).
export function gridMismatch(grid) {
  const bad = [], same = (a, b) => a[0] === b.col && a[1] === b.row;
  if (grid.cellSize !== C || grid.cols !== N || grid.rows !== N) bad.push("lưới " + grid.cols + "×" + grid.rows + " ô " + grid.cellSize);
  VIEW_COLORS.forEach((c, s) => {
    const st = grid.startCells.find((x) => x.color === FILE_COLOR[c]);
    if (!st || !same(PATH[s * 11], st)) bad.push("ô xuất phát " + c);
    const home = grid.homeCells.filter((x) => x.color === FILE_COLOR[c]);
    STABLE[s].forEach((cell, k) => { if (!home.some((h) => same(cell, h))) bad.push("chuồng đích " + c + " bậc " + (k + 1)); });
  });
  return bad;
}
const cellXY = ([c, r]) => ({ x: GRID.origin[0] + (c + 0.5) * GRID.cellSize, y: GRID.origin[1] + (r + 0.5) * GRID.cellSize });
// Toạ độ màn hình (tâm "ô") của ngựa `h` ghế `seat` khi ở vị trí `pos`; chân ngựa = y + FOOT.
function posXY(g, seat, h, pos) {
  if (pos === BASE) { const [cc, cr] = CORNER[seat], [fx, fy] = SLOT_FEET[h]; return { x: cc * C + fx, y: cr * C + fy - FOOT }; }
  if (isHome(g, pos)) return cellXY(STABLE[seat][stableLevel(g, pos) - 1]);
  return cellXY(PATH[(seat * 11 + pos) % 44]);
}
const loadJson = (src) => fetch(new URL(src, import.meta.url)).then((r) => { if (!r.ok) throw new Error("Không tải được " + src); return r.json(); });
const loadImg = (src) => new Promise((ok, bad) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => bad(new Error("Không tải được " + src)); i.src = new URL(src, import.meta.url).href; });
// Mặt trên → [mặt trái, mặt phải] nhìn thấy trên ảnh khối nghiêng: 3 mặt đôi một không đối diện (tổng 7).
const DICE_SIDES = { 1: [2, 3], 2: [3, 1], 3: [1, 2], 4: [2, 6], 5: [1, 3], 6: [3, 2] };
const DICE_PIPS = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };


// ---------- Âm thanh (SFX .ogg) ----------
// Tải sẵn bằng Web Audio; trình duyệt chỉ cho phát sau lần chạm/bấm phím đầu tiên (unlock).
// Tắt tiếng: đọc sdk.sound.muted mỗi lần phát (trang/SDK đổi giá trị này khi người chơi bấm nút tắt tiếng).
function makeSfx(dir, names, sdk) {
  const AC = typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext);
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
    // opt: { rate, offset, dur, tag } — đổi cao độ, chỉ phát một đoạn ngắn (tiếng "cộp" khi xúc xắc nảy), tên ghi log riêng
    play(n, vol = 1, delay = 0, opt = {}) {
      if (muted() || !ac || !buf[n]) return false;
      if (ac.state === "suspended") ac.resume().catch(() => {});
      const s = ac.createBufferSource(), gn = ac.createGain();
      s.buffer = buf[n]; gn.gain.value = vol; s.connect(gn).connect(ac.destination);
      if (opt.rate) s.playbackRate.value = opt.rate;
      if (opt.dur) s.start(ac.currentTime + delay, Math.min(opt.offset || 0, Math.max(0, buf[n].duration - opt.dur)), opt.dur);
      else s.start(ac.currentTime + delay);
      log.push({ n: opt.tag || n, t: Math.round(performance.now() + delay * 1000) });
      if (log.length > 3000) log.shift();
      return true;
    },
    get loaded() { return Object.keys(buf).length; },
    get state() { return ac ? ac.state : "none"; },
    log,
    close() { if (ac) ac.close().catch(() => {}); },
  };
}

// Bục xếp hạng (buc-xep-hang-4-bac.webp 320×124, bậc 1 → 4 từ trái sang): tâm mặt bậc + vùng mặt trước để tô màu phường.
const PODIUM = { src: "assets/buc-xep-hang-4-bac.webp", top: [[45, 4], [120, 22], [190, 40], [262, 58]], front: [[8, 30, 64, 92], [84, 48, 62, 74], [154, 66, 62, 56], [226, 84, 62, 38]] };
const TRAY = { src: "assets/khay-xuc-xac.webp", grey: "assets/khay-xuc-xac-xam.webp" };

export function mount(el, ctx = {}) {
  const sdk = ctx.sdk || {};
  if (!sdk.sound) sdk.sound = { muted: false };
  const homeHref = ctx.homeHref || "../../homepage/";
  let players = [2, 3, 4].includes(ctx.localPlayers) ? ctx.localPlayers : 2;
  let ruleKey = ctx.rules && ctx.rules.launchOn && ctx.rules.launchOn.includes(1) ? "16" : "6";
  const rulesOf = () => ({ ...(ctx.rules || {}), launchOn: ruleKey === "16" ? [1, 6] : [6] });
  let lobby = !!ctx.lobby;      // phòng chờ: chọn số người/luật trên chính bàn cờ, chưa nhận thao tác chơi
  // ---- Online (ctx.online = { send, leave, disband }): máy chủ giữ ván; client chỉ gửi ý định và PHÁT LẠI hành động máy chủ gửi về
  // bằng chính logic.js (roll với mặt xúc xắc máy chủ gieo, move) để có hoạt ảnh; lệch / thiếu gói thì nhận nguyên trạng thái.
  const net = ctx.online || null;
  let room = null, netGid = -1, netSeq = -1, desyncs = 0;
  const inbox = [];
  const mySeat = () => (room && room.players[room.you] ? room.players[room.you].seat : -1);
  const myTurn = () => !!net && !lobby && g.phase !== "over" && currentSeat(g) === mySeat();
  // ---- Chơi với máy (không online): người chơi cầm ghế `human` (chọn màu ở phòng chờ, mặc định Đỏ = ghế 0), các ghế còn lại là máy (ai.js) ----
  const loadColor = () => { try { const i = VIEW_COLORS.indexOf(localStorage.getItem(COLOR_KEY)); return i >= 0 ? i : 0; } catch { return 0; } };
  const saveColor = (s) => { try { localStorage.setItem(COLOR_KEY, VIEW_COLORS[s]); } catch {} };
  let human = net ? 0 : [0, 1, 2, 3].includes(ctx.humanSeat) ? ctx.humanSeat : loadColor();
  const isBot = (s) => !net && s !== human;
  const meSeat = () => (net ? mySeat() : human);
  // Ván chơi với máy: logic.js không đổi, chỉ thay bộ ghế theo màu người chơi chọn (ghế 0 ⇒ y hệt createGame).
  function withSeats(G) {
    if (net) return G;
    const seats = seatsFor(G.players, human);
    if (seats.join() === G.seats.join()) return G;
    G.seats = seats; G.horses = {};
    for (const s of seats) G.horses[s] = Array(G.rules.horses).fill(BASE);
    return G;
  }
  let g = withSeats(createGame({ players, seed: ctx.seed, rules: rulesOf() }));
  const botTurn = () => !lobby && g.phase !== "over" && isBot(currentSeat(g));
  const botRng = makeRng(ctx.seed != null ? ctx.seed * 7 + 3 : Date.now());
  let botAt = 0, botKey = "";
  let paused = false, destroyed = false, raf = 0;
  // Hiệu ứng (chỉ phần vẽ, không ảnh hưởng logic):
  let diceAnim = null;      // { until, seat, face, sim, t0, land, bi } — xúc xắc đang bay trong sân của ghế `seat` (dice-throw.js)
  let pendThrow = null;     // online: đã tung, đang chờ máy chủ báo mặt → xúc xắc cứ lăn tiếp { seat, sim, t0, at, bi }
  let drag = null;          // người chơi đang cầm xúc xắc { id, x, y, sx, sy, a, samples }
  let restDie = null;       // chỗ xúc xắc nằm sau lần tung trước { seat, x, y, a }
  let throwsDone = 0;       // số lần người chơi tự tung — 3 lần đầu hiện gợi ý "Kéo để tung"
  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let hop = null;           // { seat, horse, pts:[{x,y}], t0, kick }
  let kickFx = null;        // { seat, horse, x, y, t0 } — ngựa bị đá văng lên (khung "bi-da") trước khi về chuồng
  let noMoveShow = null;    // { seat, face, until } — khay xám + ✕ trước khi xúc xắc sang người kế
  let lastRoll = null;      // { seat, dice, noMove }
  let stats = {};           // { [seat]: { kicks, sixes } } — cho bảng xếp hạng
  let shownSeat = currentSeat(g), shownDice = null, msg = "";
  const pops = [];
  let autoAt = 0, autoFor = -1;
  const art = { ready: false, board: null, horse: null, man: null, dice: null, tray: null, trayGrey: null, podium: null };
  const sfx = makeSfx("assets/sfx/", ["do-xuc-xac", "buoc-nhay", "da-quan", "ve-chuong", "thang", "tin-nhan", "qua-man", "thua"], sdk);
  Promise.all([loadImg(ART.board.src), loadJson(ART.board.grid), loadJson(ART.horse.manifest), loadImg(ART.dice.src), ...VIEW_COLORS.map((c) => loadImg(ART.horse.sheet(c)))])
    .then(([b, grid, man, d, ...sheets]) => {
      if (destroyed) return;
      const bad = gridMismatch(grid);
      if (bad.length) console.warn("board-v5-grid.json lệch với đường đi của game: " + bad.join(", "));
      GRID = grid;
      const horse = {}; VIEW_COLORS.forEach((c, i) => (horse[c] = sheets[i]));
      Object.assign(art, { ready: true, board: b, horse, man, dice: d });
    }).catch((e) => console.warn(e.message + " — dùng hình khối tạm"));
  // Asset UI/HUD: thiếu cái nào thì phần đó vẽ bằng hình khối, không chặn game.
  loadImg(TRAY.src).then((i) => (art.tray = i)).catch((e) => console.warn(e.message));
  loadImg(TRAY.grey).then((i) => (art.trayGrey = i)).catch((e) => console.warn(e.message));
  loadImg(PODIUM.src).then((i) => (art.podium = i)).catch((e) => console.warn(e.message));

  const colorOf = (seat) => VIEW_COLORS[seat];
  const playerAt = (seat) => (room && room.game ? room.players[room.game.seats.indexOf(seat)] : null);
  const nameOf = (seat) => { const p = net && playerAt(seat); return p ? (seat === mySeat() ? "Bạn" : p.name) : net ? SEAT_NAMES[colorOf(seat)] : seat === human ? "Bạn" : "Máy " + SEAT_NAMES[colorOf(seat)]; };
  const hud = createHud(el, {
    homeHref,
    shareUrl: () => { if (net && room) { const u = new URL(location.href); u.search = "?room=" + room.code; u.hash = ""; return u.href; } const u = new URL(location.href); u.searchParams.set("players", players); if (ruleKey === "16") u.searchParams.set("rule", "16"); else u.searchParams.delete("rule"); return u.href; },
    onPlayers(n) { if (net) return; if (lobby) { players = n; newGame(); } refocus(); },
    onColor(s) { if (net || ![0, 1, 2, 3].includes(s)) return; if (lobby) { human = s; saveColor(s); newGame(); } refocus(); },
    onBot(b) { if (net) net.send(b === "add" ? { t: "add-bot" } : { t: "kick-bot", seat: Number(b) }); refocus(); }, // chủ phòng online: lấp / bớt ghế bot
    onRule(k) { if (net) { net.send({ t: "rule", rule: k }); return; } if (lobby) { ruleKey = k; newGame(); } refocus(); },
    onPlay() { sfx.unlock(); if (net) { net.send({ t: "start" }); return; } lobby = false; newGame(); refocus(); },
    onDisband() { if (net && net.disband) net.disband(); }, // chủ phòng online: hủy phòng (online.js hỏi xác nhận nếu còn người khác)
    onLobby() { if (net) { net.leave(); return; } lobby = true; paused = false; newGame(); },
    onAgain() { sfx.unlock(); if (net) { net.send({ t: "again" }); return; } advanceOver(); refocus(); },
    onMute() { sdk.sound.muted = !sdk.sound.muted; ctx.onMuteChange && ctx.onMuteChange(sdk.sound.muted); sfx.unlock(); refocus(); },
    onPause() { if (net) { refocus(); return; } setPaused(!paused); refocus(); },
    onTray(s) {
      sfx.unlock(); refocus();
      if (lobby) return;
      if (paused) { setPaused(false); return; }
      if (net && s !== mySeat()) return;
      if (s === currentSeat(g) && g.phase === "roll") doRoll();
    },
  });

  const canvas = document.createElement("canvas");
  canvas.className = "cn-canvas";
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", "Bàn Cờ Cá Ngựa");
  canvas.tabIndex = 0;
  canvas.style.cssText = "display:block;width:100%;height:auto;aspect-ratio:" + W + "/" + H + ";touch-action:none;outline:none";
  hud.boardEl.appendChild(canvas);
  const c2 = canvas.getContext("2d");
  const refocus = () => canvas.focus({ preventScroll: true });
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = canvas.clientWidth || W;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round((cssW * H / W) * dpr);
    c2.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  const busy = () => (diceAnim && performance.now() < diceAnim.until) || !!hop || (!!noMoveShow && performance.now() < noMoveShow.until);
  function resetView() {
    diceAnim = hop = kickFx = noMoveShow = lastRoll = pendThrow = drag = restDie = null; autoAt = 0; autoFor = -1; pops.length = 0; botAt = 0; botKey = "";
    stats = {}; for (const s of g.seats) stats[s] = { kicks: 0, sixes: 0 };
    shownSeat = currentSeat(g); shownDice = null;
    msg = lobby ? (net ? lobbyMsg() : "Chơi với máy — chọn số đối thủ, luật xuất ngựa rồi bấm CHƠI") : "Lượt " + nameOf(shownSeat) + ": gieo xúc xắc";
  }
  function newGame() { g = withSeats(createGame({ players, seed: ctx.seed, rules: rulesOf() })); resetView(); }
  resetView();

  // ---------- Hành động ----------
  // spec = { x, y, vx, vy } từ cú kéo-thả (toạ độ bàn cờ); không có → tung nhẹ ngẫu nhiên từ chỗ xúc xắc đang nằm.
  const canRoll = () => !lobby && !paused && !busy() && g.phase === "roll" && !botTurn() && !pendThrow && (!net || (myTurn() && !inbox.length));
  function doRoll(spec) {
    if (!canRoll()) return false; // lượt của máy / người khác: không gieo hộ được
    throwsDone++;
    if (net) {
      if (!net.send({ t: "roll" })) return false;
      // tung ngay trên màn hình, mặt xúc xắc chờ máy chủ báo về (lăn tiếp nếu chậm)
      pendThrow = { seat: mySeat(), sim: makeThrow(mySeat(), spec), t0: performance.now(), at: performance.now(), bi: 0 };
      sfx.play("do-xuc-xac", 0.6);
      return true;
    }
    return applyRoll(undefined, spec);
  }
  // ---------- Xúc xắc tung trong sân (khối 5×5 ô ở góc) của từng ghế ----------
  const DIE = 60, DIE_R = 26;
  function yardOf(seat) { const [cc, cr] = CORNER[seat]; return [cc * C + 16, cr * C + 44, (cc + 5) * C - 16, (cr + 5) * C - 8]; } // chừa phía trên cho xúc xắc bay cao
  // Vùng cấm cho xúc xắc nằm yên: ngựa còn đứng trong lán của sân này (hình ngựa ~64×50px phía trên chân + số ngựa bên phải; xúc xắc ~56px).
  function keepOut(seat) {
    const out = [];
    if (!g.horses[seat]) return out;
    g.horses[seat].forEach((pos, h) => { if (pos === BASE) { const q = posXY(g, seat, h, BASE); out.push({ x: q.x + 3, y: q.y + FOOT - 24, r: 40 }); } });
    return out;
  }
  let idleMemo = { key: "", v: null };
  function idleDie(seat) {
    const ko = keepOut(seat), rd = restDie && restDie.seat === seat ? restDie : null;
    const key = seat + "|" + (rd ? rd.x + "," + rd.y : "") + "|" + ko.map((k) => k.x + "," + k.y).join(";");
    if (idleMemo.key === key) return idleMemo.v;
    // chỗ xúc xắc chờ / nằm sau lần tung trước — nếu có ngựa về lán đứng đè lên thì dời sang chỗ trống gần nhất
    const [x0, y0, x1, y1] = yardOf(seat), base = rd || { x: (x0 + x1) / 2, y: y0 + (y1 - y0) * 0.66, a: 0 };
    const p = freeSpot(base.x, base.y, yardOf(seat), DIE_R, ko);
    idleMemo = { key, v: { seat, x: p.x, y: p.y, a: base.a || 0 } };
    return idleMemo.v;
  }
  const throwFrom = (seat, x, y, extra) => simulateThrow({ x, y, bounds: yardOf(seat), r: DIE_R, seed: (Math.random() * 2 ** 32) >>> 0, reduced, keepOut: keepOut(seat), ...extra });
  function makeThrow(seat, spec, gentle = false) {
    const st = spec && spec.x != null ? spec : idleDie(seat);
    return throwFrom(seat, st.x, st.y, { vx: spec && spec.vx, vy: spec && spec.vy, gentle });
  }
  function bounceSfx(o, now) { // tiếng "cộp" mỗi lần xúc xắc nảy / dội mép — to nhỏ, cao thấp theo lực
    const b = o.sim.bounces;
    while (o.bi < b.length && b[o.bi].t <= now - o.t0) { const k = b[o.bi++].k; sfx.play("do-xuc-xac", 0.25 + 0.6 * k, 0, { rate: 0.85 + Math.random() * 0.4, offset: Math.random() * 0.15, dur: 0.09, tag: "do-xuc-xac:nay" }); }
  }
  function applyRoll(dice, spec) {
    const seat = currentSeat(g);
    roll(g, dice);
    const now = performance.now();
    let sim, t0 = now, bi = 0;
    if (pendThrow && pendThrow.seat === seat) { // online: tiếp tục đúng cú tung của mình, chỉ đáp xuống mặt máy chủ gieo
      ({ sim, t0, bi } = pendThrow);
      if (t0 + sim.duration - now < 220) { const e = sampleThrow(sim, now - t0); sim = throwFrom(seat, e.x, e.y, { gentle: true }); t0 = now; bi = 0; }
      pendThrow = null;
    } else { sim = makeThrow(seat, spec); sfx.play("do-xuc-xac", 0.6); } // tiếng tung: đúng 1 lần mỗi lần gieo
    const land = t0 + sim.duration;
    diceAnim = { until: land + (reduced ? 150 : 420), land, seat, face: g.dice, sim, t0, bi };
    shownSeat = seat;
    handleEvents();
    diceAnim.msg = msg; msg = nameOf(seat) + " đang gieo…"; // chưa lộ kết quả khi xúc xắc còn lăn
    return true;
  }
  function doMove(horse) {
    if (lobby || paused || busy() || g.phase !== "move" || botTurn()) return false;
    if (net) { if (!myTurn() || inbox.length || !g.moves.some((m) => m.horse === horse)) return false; net.send({ t: "move", horse }); return true; }
    return applyMove(horse);
  }
  function applyMove(horse) {
    const seat = currentSeat(g), from = g.horses[seat][horse];
    const m = move(g, horse);
    if (!m) return false;
    const pts = [];
    if (m.kind === "launch") pts.push(posXY(g, seat, horse, BASE), posXY(g, seat, horse, 0));
    else for (let p = from; p <= m.to; p++) pts.push(posXY(g, seat, horse, p));
    hop = { seat, horse, pts, t0: performance.now(), kick: m.kick, stepped: 0, home: isHome(g, m.to), win: g.phase === "over" };
    handleEvents();
    return true;
  }
  function handleEvents() {
    for (const ev of drainEvents(g)) {
      const who = nameOf(ev.seat);
      const st = stats[ev.seat] || (stats[ev.seat] = { kicks: 0, sixes: 0 });
      if (ev.type === "roll") { lastRoll = { seat: ev.seat, dice: ev.dice, noMove: false }; if (ev.dice === 6) st.sixes++; msg = who + " gieo được " + ev.dice + (ev.options ? " — chọn ngựa để đi" : ""); }
      if (ev.type === "noMove") { if (lastRoll) lastRoll.noMove = true; msg = who + " gieo " + ev.dice + ": không đi được" + (g.rules.extraTurnOn.includes(ev.dice) ? ", được gieo thêm" : ", mất lượt"); }
      if (ev.type === "kick") { st.kicks++; msg = who + " đá ngựa " + nameOf(ev.victim) + " về chuồng!"; }
      if (ev.type === "move" && ev.kind === "enter") msg = who + " đưa ngựa vào chuồng đích (bậc " + (ev.to - g.rules.trackLen + 1) + ")";
      if (ev.type === "move" && ev.kind === "launch") msg = who + " xuất ngựa";
      if (ev.type === "extraTurn") msg += " · gieo thêm lượt";
      if (ev.type === "win") { msg = who + " thắng!"; sdk.gameOver && sdk.gameOver({ winner: colorOf(ev.seat), players, rolls: g.rolls, won: ev.seat === meSeat() }); }
    }
  }
  function advanceOver() {
    if (net || lobby || g.phase !== "over" || busy()) return false;
    g = withSeats(restart(g));
    resetView();
    msg = "Ván mới — lượt " + nameOf(shownSeat) + ": gieo xúc xắc";
    return true;
  }
  function primary() {
    if (lobby) return;
    if (paused) { setPaused(false); return; }
    if (advanceOver()) return;
    if (g.phase === "roll") return doRoll();
    if (g.phase === "move" && g.moves.length === 1) return doMove(g.moves[0].horse);
  }

  // ---------- Online: nhận trạng thái máy chủ ----------
  function lobbyMsg() {
    if (!room) return "";
    const n = room.players.length, host = room.you === room.host;
    if (n < 2) return "Phòng " + room.code + " — gửi mã phòng cho bạn bè (cần ít nhất 2 người)";
    return host ? "Đủ " + n + " người — bấm BẮT ĐẦU khi mọi người đã vào" : "Đang chờ chủ phòng bắt đầu (" + n + "/4 người)";
  }
  function adopt(v) {   // nhận nguyên trạng thái (vào giữa ván, nối lại, hoặc phát hiện lệch)
    const G = v.game;
    pendThrow = null;
    g = createGame({ players: G.players, seed: 0, rules: G.rules });
    Object.assign(g, { turn: G.turn, phase: G.phase, dice: G.dice, moves: structuredClone(G.moves), horses: structuredClone(G.horses), winner: G.winner, rolls: G.rolls });
    netGid = v.gid; netSeq = v.seq; inbox.length = 0;
    resetView();
    shownDice = G.phase === "move" ? G.dice : null;
    msg = G.phase === "over" ? nameOf(G.winner) + " thắng!" : "Lượt " + nameOf(currentSeat(g)) + (G.phase === "move" ? ": chọn ngựa" : ": gieo xúc xắc");
  }
  function same(v) {
    const G = v.game;
    return g.turn === G.turn && g.phase === G.phase && g.dice === G.dice && JSON.stringify(g.horses) === JSON.stringify(G.horses) && g.winner === G.winner;
  }
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
    if (join) sfx.play("buoc-nhay", 0.6); else if (gone) sfx.play("da-quan", 0.35);
  }
  function netState(v) {
    const prev = room; room = v;
    presenceSfx(prev, v);
    if (prev && prev.phase === "lobby" && v.phase !== "lobby") sfx.play("qua-man", 0.5); // ván bắt đầu
    if (v.phase === "lobby") {
      ruleKey = v.rule; players = Math.max(2, v.players.length);
      if (!lobby || !prev || prev.phase !== "lobby" || prev.rule !== v.rule || prev.players.length !== v.players.length) {
        lobby = true; g = createGame({ players, seed: 0, rules: rulesOf() }); netGid = -1; netSeq = -1; inbox.length = 0; resetView();
      }
      msg = lobbyMsg();
      return;
    }
    if (lobby || v.gid !== netGid) { if (!lobby && netGid >= 0) sfx.play("qua-man", 0.5); lobby = false; adopt(v); return; } // ván mới trong cùng phòng
    if (v.seq > netSeq) inbox.push(v);
  }
  function pumpNet() {
    while (inbox.length && !busy()) {
      const v = inbox.shift();
      if (v.seq <= netSeq) continue;
      // thiếu gói / không có act → nhận snapshot MỚI NHẤT đang chờ (không bỏ rơi các trạng thái đến sau)
      if (v.seq !== netSeq + 1 || !v.act) { adopt(inbox.reduce((x, y) => (y.seq > x.seq ? y : x), v)); continue; }
      const ok = v.act.k === "roll" ? (g.phase === "roll" && applyRoll(v.act.dice) !== false) : (g.phase === "move" && applyMove(v.act.horse) !== false);
      netSeq = v.seq;
      if (!ok || !same(v)) { desyncs++; console.warn("Cờ Cá Ngựa online: lệch trạng thái — nhận lại từ máy chủ"); adopt(v); net.send({ t: "sync" }); }
    }
  }

  // ---------- Điều khiển ----------
  function onKey(e) {
    sfx.unlock();
    if (e.repeat) return;
    const k = e.code;
    if ((k === "Space" || k === "Enter") && e.target && e.target.closest && e.target.closest("button,a,[role=button]")) return; // để nút tự xử lý
    if (lobby) return;
    if ((k === "KeyP" || k === "Escape") && !net) { setPaused(!paused); e.preventDefault(); return; }
    if (k === "Space" || k === "Enter") { e.preventDefault(); primary(); return; }
    const n = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Numpad1: 0, Numpad2: 1, Numpad3: 2, Numpad4: 3 }[k];
    if (n != null) { e.preventDefault(); doMove(n); }
  }
  function toLogic(e) {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
  }
  function onPointer(e) {
    sfx.unlock();
    canvas.focus({ preventScroll: true });
    e.preventDefault();
    if (lobby) return;
    if (paused) { setPaused(false); return; }
    if (advanceOver()) return;
    const p = toLogic(e);
    if (canRoll() && !drag) { // tới lượt mình gieo: chạm trong sân mình → cầm xúc xắc (kéo-thả để tung, chạm nhẹ = tung nhẹ)
      const seat = currentSeat(g), [x0, y0, x1, y1] = yardOf(seat), d = idleDie(seat);
      if (p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1 || Math.hypot(p.x - d.x, p.y - d.y) < DIE) {
        drag = { id: e.pointerId, x: d.x, y: d.y, ox: d.x - p.x, oy: d.y - p.y, sx: p.x, sy: p.y, a: d.a || 0, samples: [{ x: p.x, y: p.y, t: performance.now() }] };
        if (Math.hypot(p.x - d.x, p.y - d.y) > DIE) { drag.ox = 0; drag.oy = 0; drag.x = p.x; drag.y = p.y; } // chạm chỗ khác trong sân: xúc xắc nhảy vào tay
        try { canvas.setPointerCapture(e.pointerId); } catch {}
        canvas.style.cursor = "grabbing";
        return;
      }
    }
    if (g.phase === "move" && !busy()) {
      const seat = currentSeat(g);
      let best = null, bd = C * 0.75;
      for (const m of g.moves) for (const q of [posXY(g, seat, m.horse, m.from), posXY(g, seat, m.horse, m.to)]) {
        const d = Math.hypot(q.x - p.x, q.y - p.y);
        if (d < bd) { bd = d; best = m; }
      }
      if (best) doMove(best.horse);
      return;
    }
    if (g.phase === "roll") doRoll();
  }
  function clampYard(seat, x, y) { const [x0, y0, x1, y1] = yardOf(seat); return [Math.max(x0 + DIE_R, Math.min(x1 - DIE_R, x)), Math.max(y0 + DIE_R, Math.min(y1 - DIE_R, y))]; }
  function onPointerMove(e) {
    const p = toLogic(e);
    if (drag && e.pointerId === drag.id) {
      if (!canRoll()) { drag = null; return; }
      const [x, y] = clampYard(currentSeat(g), p.x + drag.ox, p.y + drag.oy);
      drag.a += (x - drag.x) * 0.02; drag.x = x; drag.y = y;
      drag.samples.push({ x: p.x, y: p.y, t: performance.now() }); if (drag.samples.length > 12) drag.samples.shift();
      return;
    }
    // con trỏ "cầm" khi rê vào sân của mình lúc tới lượt gieo
    let cur = "";
    if (canRoll()) { const [x0, y0, x1, y1] = yardOf(currentSeat(g)); if (p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1) cur = "grab"; }
    else if (g.phase === "move" && !busy() && !botTurn() && (!net || myTurn())) cur = "pointer";
    if (canvas.style.cursor !== cur) canvas.style.cursor = cur;
  }
  function onPointerUp(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag; drag = null; canvas.style.cursor = "";
    if (e.type === "pointercancel" || !canRoll()) return;
    const p = toLogic(e), now = performance.now();
    d.samples.push({ x: p.x, y: p.y, t: now });
    const moved = Math.hypot(p.x - d.sx, p.y - d.sy) > 10;
    const v = moved ? releaseVelocity(d.samples, now) : { vx: 0, vy: 0 };
    doRoll({ x: d.x, y: d.y, vx: v.vx, vy: v.vy });
  }
  function onVis() { if (document.hidden && !lobby && !net) setPaused(true); }
  window.addEventListener("keydown", onKey);
  canvas.addEventListener("pointerdown", onPointer);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  document.addEventListener("visibilitychange", onVis);
  function setPaused(v) { if (paused !== v) sfx.play("buoc-nhay", 0.35); paused = v; botKey = ""; botAt = 0; } // máy cũng dừng; chơi tiếp thì máy đợi lại một nhịp

  // ---------- Vòng lặp ----------
  function frame(now) {
    if (destroyed) return;
    raf = requestAnimationFrame(frame);
    if (!paused && !lobby) {
      if (diceAnim && diceAnim.sim) bounceSfx(diceAnim, now);
      if (diceAnim && now >= diceAnim.until) {
        if (diceAnim.sim) restDie = { seat: diceAnim.seat, ...diceAnim.sim.end };
        shownDice = diceAnim.face; msg = diceAnim.msg; diceAnim = null;
        if (lastRoll && lastRoll.noMove) { noMoveShow = { seat: lastRoll.seat, face: lastRoll.dice, until: now + 900 }; shownSeat = lastRoll.seat; sfx.play("da-quan", 0.3); } // gieo mà không đi được
        else if (g.phase !== "move") shownSeat = currentSeat(g);
      }
      if (noMoveShow && now >= noMoveShow.until) { noMoveShow = null; shownSeat = currentSeat(g); }
      // Chỉ 1 lựa chọn (hoặc mọi lựa chọn đều là xuất ngựa giống nhau) → tự đi cho nhanh.
      if (!net && !diceAnim && !hop && g.phase === "move" && !botTurn() && autoFor !== g.rolls && (g.moves.length === 1 || g.moves.every((m) => m.kind === "launch"))) {
        autoFor = g.rolls; autoAt = now + 380;
      }
      if (autoAt && now >= autoAt && !busy()) { autoAt = 0; if (g.phase === "move") doMove(g.moves[0].horse); }
      // Lượt của máy: chờ hoạt ảnh trước khép lại, ngừng một nhịp (gieo ~0,5 s, "nghĩ" 0,4–0,7 s) rồi gieo / đi
      // bằng đúng đường của người chơi (applyRoll / applyMove) → cùng xúc xắc, bước nhảy, đá quân, về chuồng, âm thanh.
      if (botTurn() && !busy() && !autoAt) {
        const key = g.rolls + ":" + g.phase + ":" + g.turn;
        if (botKey !== key) { botKey = key; botAt = now + (g.phase === "roll" ? 450 + botRng() * 250 : 400 + botRng() * 300); }
        else if (botAt && now >= botAt) {
          botAt = 0;
          if (g.phase === "roll") applyRoll();
          else { const m = botMove(g, botRng); if (m) applyMove(m.horse); }
        }
      }
      // tiếng bước: mỗi lần ngựa đáp xuống một ô (hoạt ảnh 110ms/ô)
      if (hop) { const landed = Math.min(Math.floor((now - hop.t0) / 110), hop.pts.length - 1); while (hop.stepped < landed) { hop.stepped++; sfx.play("buoc-nhay", 0.8); } }
      if (hop && now - hop.t0 >= (hop.pts.length - 1) * 110 + 60) {
        if (hop.kick) sfx.play("da-quan");
        if (hop.home) sfx.play("ve-chuong");
        if (hop.win) sfx.play(hop.seat === meSeat() ? "thang" : net ? "qua-man" : "thua", 1, 0.3); // người thua (online / thua máy) không nghe nhạc thắng
        if (hop.kick) kickFx = { seat: hop.kick.seat, horse: hop.kick.horse, ...hop.pts[hop.pts.length - 1], t0: now };
        if (hop.kick) pops.push({ ...posXY(g, hop.seat, hop.horse, g.horses[hop.seat][hop.horse]), text: "ĐÁ!", t: now });
        hop = null;
        shownSeat = currentSeat(g);
        if (g.phase === "roll") msg = msg.split(" — ")[0] + " — lượt " + nameOf(shownSeat) + ": gieo xúc xắc";
      }
    }
    if (pendThrow) { // online: máy chủ chưa báo mặt → xúc xắc nảy tiếp vài cú nhẹ; quá 5 s thì thôi (máy chủ từ chối / mất mạng)
      bounceSfx(pendThrow, now);
      if (now - pendThrow.at > 5000) pendThrow = null;
      else if (now >= pendThrow.t0 + pendThrow.sim.duration) {
        const e = pendThrow.sim.end;
        pendThrow.sim = throwFrom(pendThrow.seat, e.x, e.y, { gentle: true });
        pendThrow.t0 = now; pendThrow.bi = 0;
      }
    }
    if (net && !lobby) pumpNet();   // sau khi hoạt ảnh trước đã khép lại mới phát lại hành động kế
    while (pops.length && now - pops[0].t > 1100) pops.shift();
    draw(now);
    const v = view(now);
    hud.update(v);
    hud.paintAvatars(paintAvatars);
    paintTrays(now, v.tray);
    if (v.over) paintPodium(now, v.over.order);
  }
  raf = requestAnimationFrame(frame);

  // ---------- Dữ liệu cho HUD ----------
  function trayView(now) {
    if (lobby || g.phase === "over") return null;
    if (diceAnim && now < diceAnim.until) return { seat: diceAnim.seat, state: "rolling" };
    if (pendThrow) return { seat: pendThrow.seat, state: "rolling" };
    if (noMoveShow) return { seat: noMoveShow.seat, state: "nomove", face: noMoveShow.face };
    if (hop) return { seat: hop.seat, state: "moving", face: shownDice };
    const seat = currentSeat(g), other = net ? seat !== mySeat() : isBot(seat);
    if (g.phase === "move") return { seat, state: other ? "otherpick" : "pick", face: shownDice };
    if (lastRoll && lastRoll.seat === seat && g.rules.extraTurnOn.includes(lastRoll.dice)) return { seat, state: other ? "wait" : "again", face: lastRoll.dice };
    return { seat, state: other ? "wait" : "ready", face: null };
  }
  const span = () => 4 * (g.rules.trackLen + g.rules.stableLen);
  const progressOf = (s) => g.horses[s].reduce((a, p) => a + (p === BASE ? 0 : p + 1), 0) / span();
  const homeOf = (s) => g.horses[s].filter((p) => isHome(g, p)).length;
  function view(now) {
    const tray = trayView(now);
    const cards = [0, 1, 2, 3].map((s) => !g.seats.includes(s) ? null : {
      home: homeOf(s), progress: Math.round(progressOf(s) * 100) / 100,
      slots: g.horses[s].map((p) => (p === BASE ? "base" : isHome(g, p) ? "home" : "track")).sort((a, b) => "home track base".indexOf(a) - "home track base".indexOf(b)),
    });
    let over = null;
    if (!lobby && g.phase === "over" && !hop) {
      const order = g.seats.map((s) => ({ seat: s, home: homeOf(s), prog: progressOf(s), kicks: (stats[s] || {}).kicks || 0, sixes: (stats[s] || {}).sixes || 0 }))
        .sort((a, b) => (b.seat === g.winner) - (a.seat === g.winner) || b.home - a.home || b.prog - a.prog);
      over = { order };
    }
    let online = null;
    if (net && room) {
      const list = room.players.map((p, i) => ({ seat: lobby ? g.seats[i] : p.seat, name: p.name, away: p.left ? "left" : p.connected ? "" : "away", me: i === room.you, host: i === room.host, bot: !!p.bot, idx: i }));
      online = { code: room.code, host: room.you === room.host, count: room.players.length, me: list[room.you] ? list[room.you].seat : -1, list, left: room.deadline && !inbox.length ? Math.max(0, Math.ceil((room.deadline - Date.now() - (room.skew || 0)) / 1000)) : null };
    }
    return { lobby, players, rule: ruleKey, seats: g.seats, active: tray ? tray.seat : -1, cards, tray, msg, paused, muted: !!sdk.sound.muted, over, online, vsBot: !net, me: meSeat() };
  }

  // ---------- Vẽ HUD bằng asset: khay xúc xắc, đầu ngựa đại diện, bục xếp hạng ----------
  function fitCanvas(cv) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2), w = Math.round((cv.clientWidth || 1) * dpr), h = Math.round((cv.clientHeight || 1) * dpr);
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    return [w, h];
  }
  function paintTrays(now, t) {
    for (const s of g.seats) {
      const cv = hud.trayCanvas(s);
      if (!cv.clientWidth) continue;
      const [w, h] = fitCanvas(cv), x = cv.getContext("2d");
      x.clearRect(0, 0, w, h);
      const on = t && t.seat === s, grey = on && t.state === "nomove";
      const img = grey ? art.trayGrey : art.tray;
      x.imageSmoothingEnabled = false;
      if (img) x.drawImage(img, 0, 0, w, h);
      else { x.fillStyle = grey ? "#555" : "#5a3a1e"; x.fillRect(0, 0, w, h); x.fillStyle = grey ? "#333" : "#2a1a10"; x.fillRect(w * 0.12, h * 0.12, w * 0.76, h * 0.76); }
      if (!on) continue;
      const rolling = t.state === "rolling";
      if (rolling) continue; // xúc xắc đang bay trên sân (bàn cờ) — khay chỉ ghi "Đang gieo…"
      const ready = t.state === "ready" || t.state === "again";
      const face = rolling ? 1 + Math.floor((now / 70) % 6) : t.face;
      const bob = ready ? Math.abs(Math.sin(now / 260)) * h * 0.05 : 0;
      x.save();
      if (grey) x.filter = "grayscale(1) brightness(.75)";
      paintDice(x, w / 2, h * 0.52 - bob, h * 0.62, now, face, rolling);
      x.restore();
      if (grey) { // dấu ✕ pixel
        x.save(); x.translate(w / 2, h / 2); x.rotate(Math.PI / 4); x.fillStyle = "#e0483d"; x.strokeStyle = "#000"; x.lineWidth = h * 0.02;
        const a = h * 0.36, b = h * 0.07; for (const [rw, rh] of [[a, b], [b, a]]) { x.fillRect(-rw, -rh, rw * 2, rh * 2); x.strokeRect(-rw, -rh, rw * 2, rh * 2); }
        x.restore();
      }
    }
  }
  // ---------- Ngựa board-v5: sheet 3×3 khung 64px (animation-manifest.json) ----------
  const frameIdx = (name, t, ms) => { const a = art.man.animations[name]; return a[Math.floor(t / ms) % a.length]; };
  // Vẽ khung `idx` của ngựa màu `color`, neo chân (anchor) tại (fx, fy), cao `size` px.
  function drawSprite(x, color, idx, fx, fy, size, flip) {
    const m = art.man, [fw, fh] = m.frameSize, cols = m.sheetSize[0] / fw, k = size / fh, [ax, ay] = m.anchor;
    x.save(); x.translate(fx, fy); if (flip) x.scale(-1, 1);
    x.imageSmoothingEnabled = false;
    x.drawImage(art.horse[color], (idx % cols) * fw, Math.floor(idx / cols) * fh, fw, fh, -ax * k, -ay * k, fw * k, fh * k);
    x.restore();
  }
  function paintAvatars(list) {
    if (!art.ready) return false;
    const m = art.man, [fw] = m.frameSize, cols = m.sheetSize[0] / fw, idx = m.animations["dung-yen"][0];
    for (const cv of list) {
      const s = Number(cv.closest("[data-seat]").dataset.seat), x = cv.getContext("2d");
      x.clearRect(0, 0, cv.width, cv.height);
      x.imageSmoothingEnabled = false;
      // khung đầu ngựa (ngựa quay phải → đầu ở góc trên-phải khung đứng yên)
      x.drawImage(art.horse[colorOf(s)], (idx % cols) * fw + 31, Math.floor(idx / cols) * fw + 9, 27, 27, 0, 0, cv.width, cv.height);
    }
    return true;
  }
  function paintPodium(now, order) {
    const cv = hud.podiumCanvas();
    if (!cv || !cv.clientWidth) return;
    const x = cv.getContext("2d"), K = cv.width / 320, OY = 60; // bục cao 124, chừa 60 cho ngựa đứng trên
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, cv.width, cv.height);
    x.setTransform(K, 0, 0, K, 0, 0);
    if (art.podium) {
      const off = paintPodium.off || (paintPodium.off = document.createElement("canvas"));
      off.width = 320; off.height = 124;
      const o = off.getContext("2d");
      o.drawImage(art.podium, 0, 0);
      o.globalCompositeOperation = "source-atop"; o.globalAlpha = 0.55;
      order.forEach((r, i) => { const [fx, fy, fw, fh] = PODIUM.front[i]; o.fillStyle = PAL[colorOf(r.seat)][0]; o.fillRect(fx, fy, fw, fh); });
      o.globalCompositeOperation = "source-over"; o.globalAlpha = 1;
      x.imageSmoothingEnabled = false; x.drawImage(off, 0, OY);
    } else {
      PODIUM.front.forEach(([fx, fy, fw, fh], i) => { x.fillStyle = order[i] ? PAL[colorOf(order[i].seat)][1] : "#333"; x.fillRect(fx, OY + fy - 26, fw, fh + 26); });
    }
    if (!art.ready) return;
    order.forEach((r, i) => {
      const [tx, ty] = PODIUM.top[i];
      const idx = i === 0 ? frameIdx("mung-thang", now, 260) : art.man.animations["dung-yen"][Math.floor(now / 700 + i) % 2];
      drawSprite(x, colorOf(r.seat), idx, tx, OY + ty + 18, i === 0 ? 84 : 68, false);
    });
  }

  // Xúc xắc (asset xuc-xac.webp, mặt trên vẽ lại theo số gieo) — vẽ vào khay của người đang có lượt.
  function paintDice(c, x0, y0, height, now, face, rolling) {
    if (!art.ready) {
      const s = height * 0.8;
      c.save(); c.translate(x0, y0); if (rolling) c.rotate(Math.sin(now / 40) * 0.25);
      c.fillStyle = "#fbf6ea"; c.fillRect(-s / 2, -s / 2, s, s); c.lineWidth = s * 0.06; c.strokeStyle = "#2a1a10"; c.strokeRect(-s / 2, -s / 2, s, s);
      if (face) { c.fillStyle = "#1d1d1d"; for (const [px, py] of DICE_PIPS[face]) { c.beginPath(); c.arc(px * s * 0.27, py * s * 0.27, s * 0.09, 0, Math.PI * 2); c.fill(); } }
      c.restore(); return;
    }
    const D = ART.dice, [bx, by, bw, bh] = D.box, k = height / bh;
    c.save(); c.translate(x0, y0);
    if (rolling) { c.rotate(Math.sin(now / 40) * 0.3); c.translate(0, -Math.abs(Math.sin(now / 60)) * height * 0.08); }
    c.beginPath(); c.ellipse(0, height / 2 - height * 0.04, bw * k * 0.42, height * 0.08, 0, 0, Math.PI * 2); c.fillStyle = "rgba(0,0,0,.35)"; c.fill();
    c.scale(k, k); c.translate(-(bx + bw / 2), -(by + bh / 2));
    c.imageSmoothingEnabled = true; c.imageSmoothingQuality = "high";
    c.drawImage(art.dice, 0, 0);
    if (face) {
      // Vẽ lại CẢ 3 mặt thấy được (ảnh gốc in sẵn 1 / 2 / 3): mặt trên = số gieo, 2 mặt bên = 2 mặt kề hợp lệ
      // (không mặt nào đối diện nhau — tổng 7) ⇒ không còn cảnh "ra 5 mà mặt bên vẫn hiện 2".
      const [T, R, B, L] = D.top, DN = D.down, [sl, sr] = DICE_SIDES[face];
      const add = (p, q, k = 1) => [p[0] + q[0] * k, p[1] + q[1] * k];
      const faceAt = (o, e1, e2, n, base, hi) => { // o: góc; e1, e2: 2 cạnh; n: số chấm
        const cx = o[0] + (e1[0] + e2[0]) / 2, cy = o[1] + (e1[1] + e2[1]) / 2, sh = 0.9;
        const P = (p) => [cx + (p[0] - cx) * sh, cy + (p[1] - cy) * sh];
        const a = P(o), b = P(add(o, e1)), d = P(add(add(o, e1), e2)), e = P(add(o, e2));
        c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.lineTo(...d); c.lineTo(...e); c.closePath(); c.fillStyle = base; c.fill();
        c.beginPath(); c.moveTo(...a); c.lineTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2); c.lineTo((e[0] + d[0]) / 2, (e[1] + d[1]) / 2); c.lineTo(...e); c.closePath(); c.fillStyle = hi; c.fill();
        c.fillStyle = "#120b08";
        for (const [u, v] of DICE_PIPS[n]) { const px = cx + (u * e1[0] + v * e2[0]) * 0.25, py = cy + (u * e1[1] + v * e2[1]) * 0.25; c.fillRect(px - 27, py - 27, 54, 54); }
      };
      const vec = (p, q) => [q[0] - p[0], q[1] - p[1]];
      faceAt(T, vec(T, R), vec(T, L), face, "#e1bc87", "#fcefbf");          // mặt trên
      faceAt(L, vec(L, B), DN, sl, "#e3c08b", "#fbecc0");                   // mặt trái
      faceAt(B, vec(B, R), DN, sr, "#d9b27c", "#efd9a5");                   // mặt phải (tối hơn)
    }
    c.restore();
  }

  // ---------- Vẽ (hình khối tạm) ----------
  function rect(c, r, w, h, fill, stroke) {
    const x = BX + c * C, y = BY + r * C;
    c2.fillStyle = fill; c2.fillRect(x + 1, y + 1, w * C - 2, h * C - 2);
    if (stroke) { c2.strokeStyle = stroke; c2.lineWidth = 2; c2.strokeRect(x + 1, y + 1, w * C - 2, h * C - 2); }
  }
  function drawBoard(now) {
    // khung gỗ
    c2.fillStyle = PAL.woodDark; c2.fillRect(BX - 10, BY - 10, N * C + 20, N * C + 20);
    c2.fillStyle = PAL.wood; c2.fillRect(BX - 6, BY - 6, N * C + 12, N * C + 12);
    c2.fillStyle = "#1a2229"; c2.fillRect(BX, BY, N * C, N * C);
    // góc chuồng xuất phát
    for (let s = 0; s < 4; s++) {
      const [cc, cr] = CORNER[s], [col, dark, light] = PAL[colorOf(s)];
      const active = g.seats.includes(s);
      rect(cc, cr, 5, 5, active ? col : "#3a4048", active ? dark : "#22272d");
      const glow = active && !lobby && s === shownSeat && g.phase !== "over";
      c2.fillStyle = active ? dark : "#2a2f36";
      c2.fillRect(BX + (cc + 0.5) * C, BY + (cr + 0.5) * C, 4 * C, 4 * C);
      for (const [sx, sy] of SLOT) {
        c2.beginPath(); c2.arc(BX + (cc + sx) * C, BY + (cr + sy) * C, C * 0.42, 0, Math.PI * 2);
        c2.fillStyle = active ? col : "#3a4048"; c2.fill();
      }
      if (glow) {
        c2.strokeStyle = PAL.gold; c2.lineWidth = 4 + 2 * Math.sin(now / 180);
        c2.strokeRect(BX + cc * C + 3, BY + cr * C + 3, 5 * C - 6, 5 * C - 6);
      }
    }
    // đường đi
    PATH.forEach(([c, r], i) => {
      const startSeat = i % 11 === 0 ? i / 11 : -1;
      const fill = startSeat >= 0 && g.seats.includes(startSeat) ? PAL[colorOf(startSeat)][2] : PAL.track;
      rect(c, r, 1, 1, fill, PAL.trackDark);
      if (i % 11 === 10) { // ô cửa chuồng đích của ghế kế tiếp
        const s = (i + 1) / 11 % 4;
        const q = cellXY([c, r]);
        c2.fillStyle = PAL[colorOf(s)][1]; c2.font = "800 18px system-ui"; c2.textAlign = "center"; c2.textBaseline = "middle";
        c2.fillText("▼▶▲◀"[s], q.x, q.y + 1);
      }
      if (startSeat >= 0) {
        const q = cellXY([c, r]);
        c2.fillStyle = PAL[colorOf(startSeat)][1]; c2.font = "800 13px system-ui"; c2.textAlign = "center"; c2.textBaseline = "middle";
        c2.fillText("XP", q.x, q.y + 1);
      }
    });
    // chuồng đích (4 bậc)
    STABLE.forEach((cells, s) => cells.forEach((cell, k) => {
      const [col, dark] = PAL[colorOf(s)];
      rect(cell[0], cell[1], 1, 1, g.seats.includes(s) ? col : "#3a4048", dark);
      const q = cellXY(cell);
      c2.fillStyle = "rgba(255,255,255,.75)"; c2.font = "800 15px system-ui"; c2.textAlign = "center"; c2.textBaseline = "middle";
      c2.fillText(String(k + 1), q.x, q.y + 1);
    }));
    // tâm bàn: 4 tam giác
    const cx = BX + 6.5 * C, cy = BY + 6.5 * C, h = 1.5 * C;
    const tri = [[[-h, -h], [h, -h]], [[-h, -h], [-h, h]], [[-h, h], [h, h]], [[h, -h], [h, h]]];
    tri.forEach(([a, b], s) => {
      c2.beginPath(); c2.moveTo(cx, cy); c2.lineTo(cx + a[0], cy + a[1]); c2.lineTo(cx + b[0], cy + b[1]); c2.closePath();
      c2.fillStyle = PAL[colorOf(s)][0]; c2.fill(); c2.strokeStyle = "#1a2229"; c2.lineWidth = 2; c2.stroke();
    });
  }
  function drawHorse(seat, h, x, y, ring, pose) {
    if (art.ready) return drawHorseArt(seat, h, x, y, ring, pose);
    const [col, dark, light] = PAL[colorOf(seat)];
    c2.beginPath(); c2.ellipse(x, y + C * 0.28, C * 0.3, C * 0.1, 0, 0, Math.PI * 2); c2.fillStyle = "rgba(0,0,0,.35)"; c2.fill();
    c2.beginPath(); c2.arc(x, y, C * 0.34, 0, Math.PI * 2);
    c2.fillStyle = col; c2.fill(); c2.lineWidth = 3; c2.strokeStyle = dark; c2.stroke();
    c2.beginPath(); c2.arc(x - C * 0.1, y - C * 0.12, C * 0.09, 0, Math.PI * 2); c2.fillStyle = light; c2.fill();
    c2.fillStyle = "#fff"; c2.font = "800 17px system-ui"; c2.textAlign = "center"; c2.textBaseline = "middle";
    c2.strokeStyle = dark; c2.lineWidth = 3; c2.strokeText(String(h + 1), x, y + 1); c2.fillText(String(h + 1), x, y + 1);
    if (ring) { c2.beginPath(); c2.arc(x, y, C * 0.46, 0, Math.PI * 2); c2.strokeStyle = PAL.gold; c2.lineWidth = 3; c2.setLineDash([6, 4]); c2.lineDashOffset = -ring / 40; c2.stroke(); c2.setLineDash([]); }
  }
  function drawHorses(now) {
    const movable = g.phase === "move" && !busy() ? g.moves : [];
    // chấm đích của từng nước đi được
    for (const m of movable) {
      const q = posXY(g, currentSeat(g), m.horse, m.to);
      c2.beginPath(); c2.arc(q.x, q.y, C * 0.2, 0, Math.PI * 2); c2.fillStyle = "rgba(255,201,74,.55)"; c2.fill();
    }
    for (const s of g.seats) g.horses[s].forEach((pos, h) => {
      if (hop && hop.seat === s && hop.horse === h) return;
      if (kickFx && kickFx.seat === s && kickFx.horse === h) return;
      // Ngựa bị đá: vẫn đứng ở ô cũ cho tới khi ngựa kia nhảy tới.
      let q = posXY(g, s, h, pos);
      if (hop && hop.kick && hop.kick.seat === s && hop.kick.horse === h) q = hop.pts[hop.pts.length - 1];
      drawHorse(s, h, q.x, q.y, movable.some((m) => m.horse === h) && s === currentSeat(g) ? now : 0);
    });
    if (hop) {
      const t = Math.max(0, now - hop.t0) / 110, i = Math.min(Math.floor(t), hop.pts.length - 1), f = Math.min(t - i, 1);
      const a = hop.pts[i], b = hop.pts[Math.min(i + 1, hop.pts.length - 1)];
      const nh = art.ready ? art.man.animations.nhay : [];
      drawHorse(hop.seat, hop.horse, a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f - Math.sin(f * Math.PI) * 12, 0,
        art.ready ? { idx: nh[Math.min(Math.floor(f * nh.length), nh.length - 1)], flip: b.x < a.x - 1 } : null);
    }
    // ngựa bị đá: khung "bi-da", văng lên rồi mờ dần (~0,7 giây), sau đó hiện lại trong chuồng
    if (kickFx) {
      const k = (now - kickFx.t0) / 700;
      if (k >= 1 || !art.ready) kickFx = null;
      else drawHorse(kickFx.seat, kickFx.horse, kickFx.x + k * 18, kickFx.y, 0, { idx: frameIdx("bi-da", now - kickFx.t0, 140), lift: Math.round(Math.sin(k * Math.PI) * 26), alpha: 1 - k * k });
    }
  }
  // ---------- Vẽ bằng asset thật ----------
  function drawBoardArt(now) {
    c2.imageSmoothingEnabled = false;
    c2.drawImage(art.board, 0, 0, W, H);
    for (let s = 0; s < 4; s++) {
      const [cc, cr] = CORNER[s], r = [cc * C + HUT, cr * C + HUT, HUT_SIZE, HUT_SIZE];
      if (!g.seats.includes(s)) { c2.fillStyle = "rgba(12,14,18,.7)"; c2.fillRect(...r); continue; }
      if (!lobby && s === shownSeat && g.phase !== "over") {
        const p = 4 + Math.round(2 * Math.sin(now / 180));
        c2.fillStyle = PAL.gold;  // viền vàng pixel (4 cạnh, góc cắt bậc)
        c2.fillRect(r[0] - p, r[1] - p - 4, r[2] + 2 * p, 4); c2.fillRect(r[0] - p, r[1] + r[3] + p, r[2] + 2 * p, 4);
        c2.fillRect(r[0] - p - 4, r[1] - p, 4, r[3] + 2 * p); c2.fillRect(r[0] + r[2] + p, r[1] - p, 4, r[3] + 2 * p);
      }
    }
  }
  // pose: { idx, flip, lift, alpha } — mặc định đứng yên (2 khung "dung-yen" lệch nhịp theo từng con), thắng thì "mung-thang".
  function drawHorseArt(seat, h, x, y, ring, pose) {
    const foot = y + FOOT, now = performance.now();
    const bob = ring ? Math.round(Math.abs(Math.sin(ring / 160)) * 4) : 0;
    let idx = pose && pose.idx != null ? pose.idx : art.man.animations["dung-yen"][Math.floor(now / 650 + seat * 0.37 + h * 0.61) % 2];
    if (!pose && g.phase === "over" && g.winner === seat) idx = frameIdx("mung-thang", now + h * 130, 260);
    c2.globalAlpha = pose && pose.alpha != null ? pose.alpha : 1;
    if (!pose || !pose.lift) { c2.beginPath(); c2.ellipse(x, foot, 24, 7, 0, 0, Math.PI * 2); c2.fillStyle = "rgba(0,0,0,.38)"; c2.fill(); }
    if (ring) { c2.beginPath(); c2.ellipse(x, foot, 30, 10, 0, 0, Math.PI * 2); c2.strokeStyle = PAL.gold; c2.lineWidth = 3; c2.setLineDash([6, 4]); c2.lineDashOffset = -ring / 40; c2.stroke(); c2.setLineDash([]); }
    // khung 64px: thân ngựa ~48×40, chân ở y≈52 (anchor manifest = 60) → vẽ 80px, hạ 10px cho chân chạm bóng
    drawSprite(c2, colorOf(seat), idx, x, foot + 10 - bob - (pose && pose.lift || 0), 80, pose && pose.flip);
    c2.globalAlpha = 1;
    if (pose && pose.lift) return;
    // số ngựa (1–4) để chọn bằng phím
    const nx = x + 27, ny = foot - 4 - bob;
    c2.beginPath(); c2.arc(nx, ny, 9, 0, Math.PI * 2); c2.fillStyle = "#14181c"; c2.fill(); c2.lineWidth = 2; c2.strokeStyle = ring ? PAL.gold : PAL[colorOf(seat)][2]; c2.stroke();
    c2.fillStyle = "#fff"; c2.font = "800 12px system-ui"; c2.textAlign = "center"; c2.textBaseline = "middle"; c2.fillText(String(h + 1), nx, ny + 1);
  }
  function overlay(title, lines, color) {
    c2.fillStyle = "rgba(8,11,13,.62)"; c2.fillRect(0, 0, W, H);
    const bw = 460, bh = 84 + lines.length * 30, bx = (W - bw) / 2, by = (H - bh) / 2;
    c2.fillStyle = "rgba(0,0,0,.6)"; c2.fillRect(bx + 6, by + 9, bw, bh);       // bóng cứng
    c2.fillStyle = "#000"; c2.fillRect(bx - 3, by, bw + 6, bh); c2.fillRect(bx, by - 3, bw, bh + 6); // viền góc cắt bậc
    c2.fillStyle = "#1d1a16"; c2.fillRect(bx, by, bw, bh);
    c2.fillStyle = "rgba(255,255,255,.13)"; c2.fillRect(bx, by, bw, 2);
    c2.textAlign = "center"; c2.textBaseline = "middle";
    c2.font = "800 30px 'Be Vietnam Pro', system-ui"; c2.fillStyle = "#000"; c2.fillText(title.toUpperCase(), W / 2 + 2, by + 44);
    c2.fillStyle = color; c2.fillText(title.toUpperCase(), W / 2, by + 42);
    c2.font = "600 17px 'Be Vietnam Pro', system-ui";
    lines.forEach((l, i) => { c2.fillStyle = PAL.soft; c2.fillText(l, W / 2, by + 86 + i * 30); });
  }
  // Xúc xắc trên sân: đang bay (diceAnim / pendThrow), đang bị cầm (drag), hoặc nằm chờ ở sân người tới lượt.
  const tumbleFace = (o, t) => 1 + (((o.sim.seed >>> 0) + Math.floor(t / 90) * 2654435761) >>> 0) % 6;
  function drawDie(now) {
    if (lobby) return;
    let d = null;
    if (diceAnim && diceAnim.sim) {
      const t = now - diceAnim.t0, q = sampleThrow(diceAnim.sim, t), landed = now >= diceAnim.land;
      d = { ...q, face: landed || t > diceAnim.sim.duration - 240 ? diceAnim.face : tumbleFace(diceAnim, t), pop: landed ? Math.min(1, (now - diceAnim.land) / (diceAnim.until - diceAnim.land)) : -1 };
    } else if (pendThrow) {
      const t = now - pendThrow.t0; d = { ...sampleThrow(pendThrow.sim, t), face: tumbleFace(pendThrow, now - pendThrow.at), pop: -1 };
    } else if (drag) d = { x: drag.x, y: drag.y, z: 14, a: drag.a, face: null, pop: -1, held: true };
    else if (g.phase !== "over") {
      const seat = noMoveShow ? noMoveShow.seat : hop ? hop.seat : currentSeat(g), r = idleDie(seat), showFace = restDie && restDie.seat === seat && (g.phase === "move" || noMoveShow || hop);
      const mine = canRoll();
      d = { x: r.x, y: r.y, z: mine ? Math.abs(Math.sin(now / 260)) * 6 : 0, a: r.a || 0, face: showFace ? shownDice || g.dice : null, pop: showFace && g.phase === "move" ? 2 : -1, idle: mine };
      if (noMoveShow) d.grey = true;
    }
    if (!d) return;
    const size = d.held ? DIE * 1.12 : DIE;
    // bóng: nhỏ + mờ dần khi xúc xắc bay cao
    const sh = Math.max(0.35, 1 - d.z / 120);
    c2.beginPath(); c2.ellipse(d.x, d.y + size * 0.36, size * 0.42 * sh, size * 0.12 * sh, 0, 0, Math.PI * 2); c2.fillStyle = "rgba(0,0,0," + (0.42 * sh).toFixed(3) + ")"; c2.fill();
    if (d.idle && !d.held) { // sân sáng nhẹ: chỗ được tung
      c2.save(); c2.strokeStyle = "rgba(255,201,74,.55)"; c2.lineWidth = 3; c2.setLineDash([10, 8]); c2.lineDashOffset = -now / 40;
      const [x0, y0, x1, y1] = yardOf(currentSeat(g)); c2.strokeRect(x0 + 4, y0 + 4, x1 - x0 - 8, y1 - y0 - 8); c2.restore();
    }
    let k = 1;
    if (d.pop >= 0 && d.pop <= 1) k = 1 + 0.28 * Math.sin(d.pop * Math.PI);
    if (d.pop >= 0) { // mặt cuối: vòng sáng vàng quanh xúc xắc
      const glow = d.pop <= 1 ? 1 - d.pop * 0.5 : 0.5 + 0.15 * Math.sin(now / 200);
      c2.beginPath(); c2.arc(d.x, d.y - d.z, size * 0.62 * k, 0, Math.PI * 2); c2.fillStyle = "rgba(255,201,74," + (0.28 * glow).toFixed(3) + ")"; c2.fill();
      c2.lineWidth = 4; c2.strokeStyle = "rgba(255,201,74," + (0.9 * glow).toFixed(3) + ")"; c2.stroke();
    }
    c2.save(); c2.translate(d.x, d.y - d.z); c2.rotate(d.a); c2.scale(k, k);
    if (d.grey) c2.filter = "grayscale(1) brightness(.75)";
    paintDice(c2, 0, 0, size, now, d.face, false);
    c2.restore();
    if (d.pop >= 0 && d.face) { // số to phía trên xúc xắc
      const yy = d.y - d.z - size * 0.75 * k - (d.pop <= 1 ? 10 * Math.sin(d.pop * Math.PI) : 0);
      c2.font = "800 " + Math.round(34 * (d.pop <= 1 ? k : 1)) + "px 'Be Vietnam Pro', system-ui"; c2.textAlign = "center"; c2.textBaseline = "middle";
      c2.lineWidth = 6; c2.strokeStyle = "#000"; c2.strokeText(String(d.face), d.x, yy); c2.fillStyle = PAL.gold; c2.fillText(String(d.face), d.x, yy);
    }
    if (d.idle && !d.held && throwsDone < 3) { // gợi ý 3 lần đầu
      c2.font = "800 15px 'Be Vietnam Pro', system-ui"; c2.textAlign = "center"; c2.textBaseline = "middle";
      // nhãn nằm dưới xúc xắc; nếu che ngựa trong lán thì đưa lên trên xúc xắc
      const below = d.y + size * 0.72, covers = keepOut(currentSeat(g)).some((k) => Math.abs(k.x - d.x) < k.r + 50 && Math.abs(k.y - below) < k.r + 12);
      const yy = covers ? d.y - size * 0.85 : below, txt = "KÉO ĐỂ TUNG";
      const tw = c2.measureText(txt).width + 18; c2.fillStyle = "rgba(0,0,0,.72)"; c2.fillRect(d.x - tw / 2, yy - 12, tw, 24);
      c2.fillStyle = PAL.gold; c2.fillText(txt, d.x, yy + 1);
    }
  }
  function draw(now) {
    c2.fillStyle = PAL.bg; c2.fillRect(0, 0, W, H);
    if (art.ready) drawBoardArt(now); else drawBoard(now);
    drawHorses(now);
    drawDie(now);
    for (const p of pops) {
      const k = (now - p.t) / 1100;
      c2.globalAlpha = Math.max(0, 1 - k);
      c2.fillStyle = "#fff"; c2.strokeStyle = "#7a1c17"; c2.lineWidth = 5; c2.font = "800 26px 'Be Vietnam Pro', system-ui"; c2.textAlign = "center";
      c2.strokeText(p.text, p.x, p.y - 30 - k * 30); c2.fillText(p.text, p.x, p.y - 30 - k * 30);
      c2.globalAlpha = 1;
    }
    if (lobby) { c2.fillStyle = "rgba(8,11,13,.25)"; c2.fillRect(0, 0, W, H); }
    else if (paused && g.phase !== "over") overlay("Tạm dừng", ["Nhấn P hoặc chạm để chơi tiếp"], PAL.ink);
  }

  const inst = {
    pause() { setPaused(true); },
    resume() { setPaused(false); },
    destroy() {
      destroyed = true; cancelAnimationFrame(raf); sfx.close(); ro.disconnect();
      window.removeEventListener("keydown", onKey);
      canvas.removeEventListener("pointerdown", onPointer);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      document.removeEventListener("visibilitychange", onVis);
      hud.destroy();
    },
    // Dành cho test/debug — không phải API cho core.
    get state() { return g; },
    set state(v) { g = v; kickFx = null; shownSeat = currentSeat(g); shownDice = g.dice; autoAt = 0; autoFor = -1; botAt = 0; botKey = ""; noMoveShow = null; msg = "Lượt " + nameOf(shownSeat) + (g.phase === "move" ? ": chọn ngựa" : ": gieo xúc xắc"); for (const s of g.seats) stats[s] = stats[s] || { kicks: 0, sixes: 0 }; },
    get paused() { return paused; },
    netState, chatSfx() { sfx.play("tin-nhan", 0.6); }, get room() { return room; }, get netSeq() { return netSeq; }, get desyncs() { return desyncs; }, get inbox() { return inbox.length; }, get mySeat() { return mySeat(); },
    get lobby() { return lobby; },
    get busy() { return busy() || !!autoAt || !!pendThrow; },
    // toạ độ CSS của xúc xắc đang nằm chờ ở sân người tới lượt (để test kéo-thả thật)
    dieScreen() { const d = drag || idleDie(currentSeat(g)), r = canvas.getBoundingClientRect(); return { x: r.left + d.x * r.width / W, y: r.top + d.y * r.height / H }; },
    get diceFlight() { return diceAnim && diceAnim.sim ? { seat: diceAnim.seat, face: diceAnim.face, duration: diceAnim.sim.duration, bounces: diceAnim.sim.bounces.length, start: diceAnim.sim.frames[0], end: diceAnim.sim.end, yard: yardOf(diceAnim.seat) } : null; },
    get botTurn() { return botTurn(); },
    get humanSeat() { return meSeat(); },
    keepOut(seat) { return keepOut(seat); },
    get restDie() { return restDie ? idleDie(restDie.seat) : null; },
    get artReady() { return art.ready; },
    get hudArtReady() { return !!(art.tray && art.trayGrey && art.podium); },
    get sfx() { return { loaded: sfx.loaded, state: sfx.state, log: sfx.log.slice() }; },
    // Toạ độ CSS của ngựa (seat, h) — hoặc của khay xúc xắc người đang có lượt (h = null) — để test bấm/chạm thật.
    screenOf(seat, h) {
      if (h == null) { const r = hud.trayRect(currentSeat(g)); if (r.width) return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
      const q = h == null ? { x: W / 2, y: H / 2 } : posXY(g, seat, h, g.horses[seat][h]);
      const r = canvas.getBoundingClientRect();
      return { x: r.left + q.x * r.width / W, y: r.top + q.y * r.height / H };
    },
  };
  return inst;
}
