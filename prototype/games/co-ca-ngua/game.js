// Cờ Cá Ngựa — phần hiển thị + điều khiển, theo hợp đồng Game SDK (docs/tech-architecture.md §3.3):
//   mount(el, ctx) -> { pause, resume, destroy }
// Vẽ bằng asset pixel art thật của Codex (assets/board.webp, quan-co.webp, xuc-xac.webp).
// Nếu ảnh không tải được thì tự quay về hình khối tạm (lưới 13×13 đều) — vẫn chơi được.
// Luật nằm hết trong logic.js; file này chỉ vẽ + nhận thao tác.
import { SEAT_COLORS, SEAT_NAMES, BASE, createGame, roll, move, restart, currentSeat, stableLevel, isHome, drainEvents } from "./logic.js";

export const W = 720, H = 836;
const N = 13, C = 52, BX = (W - N * C) / 2, BY = 84;   // ô 52px, bàn 676×676
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
const CORNER = [[0, 0], [0, 8], [8, 8], [8, 0]]; // Đỏ: trên-trái, Xanh lá: dưới-trái, Vàng: dưới-phải, Xanh dương: trên-phải
const SLOT = [[1.4, 1.4], [3.6, 1.4], [1.4, 3.6], [3.6, 3.6]];

// ---------- Asset thật ----------
// board.webp (1280×960): khung bàn ở [165,5,950,950]. Ô trên ảnh KHÔNG chia đều tuyệt đối (nhánh dọc và
// nhánh ngang lệch nhau vài px), nên dùng tâm ô đo trực tiếp trên ảnh cho từng nhánh (toạ độ ảnh gốc).
export const ART = {
  board: { src: "assets/board.webp", crop: [165, 5, 950, 950], dst: [12, 74, 696] },
  armX: [570.5, 640, 709.5],                 // cột 5,6,7 (nhánh trên/dưới)
  topY: [88, 159, 231, 302, 368],            // hàng 0..4 (nhánh trên)
  botY: [593, 661, 731, 801, 869],           // hàng 8..12 (nhánh dưới)
  leftX: [247, 313, 379, 443, 507.5],        // cột 0..4 (nhánh trái)
  rightX: [770, 835, 899, 965, 1033],        // cột 8..12 (nhánh phải)
  sideY: [400, 472, 543],                    // hàng 5,6,7 (nhánh trái/phải)
  // Khối chuồng xuất phát 4×4 ô trên ảnh: [x,y,w,h]. Màu góc trên ảnh: TL đỏ, TR xanh dương, BL vàng, BR xanh lá.
  corner: { TL: [231, 63, 284, 288], TR: [765, 63, 284, 288], BL: [231, 603, 284, 284], BR: [765, 603, 284, 284] },
  // Ảnh có góc xanh lá/vàng lệch so với nhánh cùng màu → ngựa trong chuồng đặt theo GÓC CÙNG MÀU trên ảnh.
  seatCorner: ["TL", "BR", "BL", "TR"],      // ghế 0 Đỏ, 1 Xanh lá, 2 Vàng, 3 Xanh dương
  horse: { src: "assets/quan-co.webp", red: [244, 56, 308, 384], blue: [724, 56, 308, 384], yellow: [244, 508, 308, 384], green: [724, 508, 308, 388] },
  // xuc-xac.webp: xúc xắc isometric; mặt trên là hình thoi T-R-B-L (vẽ lại chấm theo mặt gieo được).
  dice: { src: "assets/xuc-xac.webp", box: [304, 136, 672, 716], top: [[640, 160], [940, 327], [640, 503], [340, 327]] },
};
const AS = ART.board.dst[2] / ART.board.crop[2];
const imgToScreen = (ix, iy) => ({ x: ART.board.dst[0] + (ix - ART.board.crop[0]) * AS, y: ART.board.dst[1] + (iy - ART.board.crop[1]) * AS });
// Tâm ô [cột, hàng] trên ảnh board.webp (toạ độ ảnh gốc).
export function cellImg([c, r]) {
  if (c >= 5 && c <= 7) return { x: ART.armX[c - 5], y: r <= 4 ? ART.topY[r] : r >= 8 ? ART.botY[r - 8] : ART.sideY[r - 5] };
  return { x: c <= 4 ? ART.leftX[c] : ART.rightX[c - 8], y: ART.sideY[r - 5] };
}
export function slotImg(seat, h) {
  const [x, y, w, hh] = ART.corner[ART.seatCorner[seat]];
  return { x: x + w * (h % 2 ? 0.72 : 0.28), y: y + hh * (h < 2 ? 0.3 : 0.74) };
}
export { PATH, STABLE };
let useArt = false; // bật khi ảnh đã tải xong

const cellXY = (cell) => {
  if (useArt) { const q = cellImg(cell); return imgToScreen(q.x, q.y); }
  const [c, r] = cell; return { x: BX + (c + 0.5) * C, y: BY + (r + 0.5) * C };
};
// Toạ độ màn hình của ngựa `h` ghế `seat` khi ở vị trí `pos`.
function posXY(g, seat, h, pos) {
  if (pos === BASE) {
    if (useArt) { const q = slotImg(seat, h); return imgToScreen(q.x, q.y); }
    const [cc, cr] = CORNER[seat], [sx, sy] = SLOT[h]; return { x: BX + (cc + sx) * C, y: BY + (cr + sy) * C };
  }
  if (isHome(g, pos)) return cellXY(STABLE[seat][stableLevel(g, pos) - 1]);
  return cellXY(PATH[(seat * 11 + pos) % 44]);
}
const loadImg = (src) => new Promise((ok, bad) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => bad(new Error("Không tải được " + src)); i.src = new URL(src, import.meta.url).href; });
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
    play(n, vol = 1, delay = 0) {
      if (muted() || !ac || !buf[n]) return false;
      if (ac.state === "suspended") ac.resume().catch(() => {});
      const s = ac.createBufferSource(), gn = ac.createGain();
      s.buffer = buf[n]; gn.gain.value = vol; s.connect(gn).connect(ac.destination);
      s.start(ac.currentTime + delay);
      log.push({ n, t: Math.round(performance.now() + delay * 1000) });
      if (log.length > 3000) log.shift();
      return true;
    },
    get loaded() { return Object.keys(buf).length; },
    get state() { return ac ? ac.state : "none"; },
    log,
    close() { if (ac) ac.close().catch(() => {}); },
  };
}

export function mount(el, ctx = {}) {
  const sdk = ctx.sdk || {};
  const players = [2, 3, 4].includes(ctx.localPlayers) ? ctx.localPlayers : 2;
  let g = createGame({ players, seed: ctx.seed, rules: ctx.rules });
  let paused = false, destroyed = false, raf = 0;
  // Hiệu ứng (chỉ phần vẽ, không ảnh hưởng logic):
  let diceAnim = null;      // { until, seat, face }
  let hop = null;           // { seat, horse, pts:[{x,y}], t0, kick }
  let shownSeat = currentSeat(g), shownDice = null;
  let msg = "Lượt " + SEAT_NAMES[SEAT_COLORS[shownSeat]] + ": chạm hoặc nhấn Space để gieo xúc xắc";
  const pops = [];
  let autoAt = 0, autoFor = -1;
  const art = { ready: false, board: null, horse: null, dice: null };
  const sfx = makeSfx("assets/sfx/", ["do-xuc-xac", "buoc-nhay", "da-quan", "ve-chuong", "thang"], sdk);
  useArt = false;
  Promise.all([loadImg(ART.board.src), loadImg(ART.horse.src), loadImg(ART.dice.src)]).then(([b, h, d]) => {
    if (destroyed) return;
    Object.assign(art, { ready: true, board: b, horse: h, dice: d });
    useArt = true;
  }).catch((e) => console.warn(e.message + " — dùng hình khối tạm"));

  const canvas = document.createElement("canvas");
  canvas.className = "cn-canvas";
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", "Bàn Cờ Cá Ngựa");
  canvas.tabIndex = 0;
  canvas.style.cssText = "display:block;width:100%;height:auto;aspect-ratio:" + W + "/" + H + ";touch-action:manipulation;outline:none";
  el.appendChild(canvas);
  const c2 = canvas.getContext("2d");
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

  const busy = () => (diceAnim && performance.now() < diceAnim.until) || !!hop;
  const colorOf = (seat) => SEAT_COLORS[seat];
  const nameOf = (seat) => SEAT_NAMES[colorOf(seat)];

  // ---------- Hành động ----------
  function doRoll() {
    if (paused || busy() || g.phase !== "roll") return false;
    const seat = currentSeat(g);
    roll(g);
    sfx.play("do-xuc-xac");
    diceAnim = { until: performance.now() + 520, seat, face: g.dice };
    shownSeat = seat;
    handleEvents();
    diceAnim.msg = msg; msg = nameOf(seat) + " đang gieo…"; // chưa lộ kết quả khi xúc xắc còn lăn
    return true;
  }
  function doMove(horse) {
    if (paused || busy() || g.phase !== "move") return false;
    const seat = currentSeat(g), from = g.horses[seat][horse];
    const m = move(g, horse);
    if (!m) return false;
    // Đường nhảy từng ô cho hoạt ảnh.
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
      if (ev.type === "roll") msg = who + " gieo được " + ev.dice + (ev.options ? " — chọn ngựa để đi" : "");
      if (ev.type === "noMove") msg = who + " gieo " + ev.dice + ": không đi được" + (g.rules.extraTurnOn.includes(ev.dice) ? ", được gieo thêm" : ", mất lượt");
      if (ev.type === "kick") { msg = who + " đá ngựa " + nameOf(ev.victim) + " về chuồng!"; }
      if (ev.type === "move" && ev.kind === "enter") msg = who + " đưa ngựa vào chuồng đích (bậc " + (ev.to - g.rules.trackLen + 1) + ")";
      if (ev.type === "move" && ev.kind === "launch") msg = who + " xuất ngựa";
      if (ev.type === "extraTurn") msg += " · gieo thêm lượt";
      if (ev.type === "win") { msg = who + " thắng!"; sdk.gameOver && sdk.gameOver({ winner: colorOf(ev.seat), players, rolls: g.rolls }); }
    }
  }
  function advanceOver() {
    if (g.phase !== "over" || busy()) return false;
    g = restart(g);
    shownSeat = currentSeat(g); shownDice = null;
    msg = "Ván mới — lượt " + nameOf(shownSeat) + ": gieo xúc xắc";
    return true;
  }
  function primary() {
    if (paused) { setPaused(false); return; }
    if (advanceOver()) return;
    if (g.phase === "roll") return doRoll();
    if (g.phase === "move" && g.moves.length === 1) return doMove(g.moves[0].horse);
  }

  // ---------- Điều khiển ----------
  function onKey(e) {
    sfx.unlock();
    if (e.repeat) return;
    const k = e.code;
    if (k === "KeyP" || k === "Escape") { setPaused(!paused); e.preventDefault(); return; }
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
    if (paused) { setPaused(false); return; }
    if (advanceOver()) return;
    const p = toLogic(e);
    if (g.phase === "move" && !busy()) {
      // Chạm vào ngựa đi được, hoặc vào ô đích (chấm mờ) của nó.
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
  function onVis() { if (document.hidden) setPaused(true); }
  window.addEventListener("keydown", onKey);
  canvas.addEventListener("pointerdown", onPointer);
  document.addEventListener("visibilitychange", onVis);
  function setPaused(v) { paused = v; }

  // ---------- Vòng lặp ----------
  function frame(now) {
    if (destroyed) return;
    raf = requestAnimationFrame(frame);
    if (!paused) {
      if (diceAnim && now >= diceAnim.until) {
        shownDice = diceAnim.face; msg = diceAnim.msg; diceAnim = null;
        if (g.phase !== "move") shownSeat = currentSeat(g);
      }
      // Chỉ 1 lựa chọn (hoặc mọi lựa chọn đều là xuất ngựa giống nhau) → tự đi cho nhanh.
      if (!diceAnim && !hop && g.phase === "move" && autoFor !== g.rolls && (g.moves.length === 1 || g.moves.every((m) => m.kind === "launch"))) {
        autoFor = g.rolls; autoAt = now + 380;
      }
      if (autoAt && now >= autoAt && !busy()) { autoAt = 0; if (g.phase === "move") doMove(g.moves[0].horse); }
      // tiếng bước: mỗi lần ngựa đáp xuống một ô (hoạt ảnh 110ms/ô)
      if (hop) { const landed = Math.min(Math.floor((now - hop.t0) / 110), hop.pts.length - 1); while (hop.stepped < landed) { hop.stepped++; sfx.play("buoc-nhay", 0.8); } }
      if (hop && now - hop.t0 >= (hop.pts.length - 1) * 110 + 60) {
        if (hop.kick) sfx.play("da-quan");
        if (hop.home) sfx.play("ve-chuong");
        if (hop.win) sfx.play("thang", 1, 0.3);
        if (hop.kick) pops.push({ ...posXY(g, hop.seat, hop.horse, g.horses[hop.seat][hop.horse]), text: "ĐÁ!", t: now });
        hop = null;
        shownSeat = currentSeat(g);
        if (g.phase === "roll") msg = msg.split(" — ")[0] + " — lượt " + nameOf(shownSeat) + ": gieo xúc xắc";
      }
    }
    while (pops.length && now - pops[0].t > 1100) pops.shift();
    draw(now);
  }
  raf = requestAnimationFrame(frame);

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
      const glow = active && s === shownSeat && g.phase !== "over";
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
  function drawHorse(seat, h, x, y, ring) {
    if (art.ready) return drawHorseArt(seat, h, x, y, ring);
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
      // Ngựa bị đá: vẫn đứng ở ô cũ cho tới khi ngựa kia nhảy tới.
      let q = posXY(g, s, h, pos);
      if (hop && hop.kick && hop.kick.seat === s && hop.kick.horse === h) q = hop.pts[hop.pts.length - 1];
      drawHorse(s, h, q.x, q.y, movable.some((m) => m.horse === h) && s === currentSeat(g) ? now : 0);
    });
    if (hop) {
      const t = Math.max(0, now - hop.t0) / 110, i = Math.min(Math.floor(t), hop.pts.length - 1), f = Math.min(t - i, 1);
      const a = hop.pts[i], b = hop.pts[Math.min(i + 1, hop.pts.length - 1)];
      drawHorse(hop.seat, hop.horse, a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f - Math.sin(f * Math.PI) * 12, 0);
    }
  }
  // ---------- Vẽ bằng asset thật ----------
  function imgRect([x, y, w, h], pad = 0) { const a = imgToScreen(x, y); return [a.x - pad, a.y - pad, w * AS + 2 * pad, h * AS + 2 * pad]; }
  function drawBoardArt(now) {
    const [sx, sy, sw] = ART.board.crop, [dx, dy, dw] = ART.board.dst;
    c2.imageSmoothingEnabled = true; c2.imageSmoothingQuality = "high";
    c2.drawImage(art.board, sx, sy, sw, sw, dx, dy, dw, dw);
    for (let s = 0; s < 4; s++) {
      const r = imgRect(ART.corner[ART.seatCorner[s]]);
      if (!g.seats.includes(s)) { c2.fillStyle = "rgba(12,14,18,.68)"; c2.fillRect(...r); continue; }
      // ô xuất phát: tô nhạt màu của ghế + "XP" để biết ngựa ra ô nào
      const q = cellXY(PATH[s * 11]), cs = 44;
      c2.fillStyle = PAL[colorOf(s)][0]; c2.globalAlpha = 0.55; c2.fillRect(q.x - cs / 2, q.y - cs / 2, cs, cs); c2.globalAlpha = 1;
      c2.strokeStyle = PAL[colorOf(s)][2]; c2.lineWidth = 3; c2.strokeRect(q.x - cs / 2, q.y - cs / 2, cs, cs);
      c2.fillStyle = "#fff"; c2.font = "800 12px system-ui"; c2.textAlign = "center"; c2.textBaseline = "middle"; c2.fillText("XP", q.x, q.y + 1);
      if (s === shownSeat && g.phase !== "over") {
        c2.strokeStyle = PAL.gold; c2.lineWidth = 4 + 2 * Math.sin(now / 180); c2.strokeRect(...imgRect(ART.corner[ART.seatCorner[s]], 6));
      }
    }
  }
  function drawHorseArt(seat, h, x, y, ring) {
    const [bx, by, bw, bh] = ART.horse[colorOf(seat)];
    const hh = 52, ww = hh * bw / bh, foot = y + 16;
    const bob = ring ? Math.abs(Math.sin(ring / 160)) * 4 : 0;
    c2.beginPath(); c2.ellipse(x, foot, 17, 6, 0, 0, Math.PI * 2); c2.fillStyle = "rgba(0,0,0,.4)"; c2.fill();
    if (ring) { c2.beginPath(); c2.ellipse(x, foot, 23, 9, 0, 0, Math.PI * 2); c2.strokeStyle = PAL.gold; c2.lineWidth = 3; c2.setLineDash([6, 4]); c2.lineDashOffset = -ring / 40; c2.stroke(); c2.setLineDash([]); }
    c2.imageSmoothingEnabled = true; c2.imageSmoothingQuality = "high";
    c2.drawImage(art.horse, bx, by, bw, bh, x - ww / 2, foot - hh - bob, ww, hh);
    // số ngựa (1–4) để chọn bằng phím
    const nx = x + ww / 2 - 3, ny = foot - 6 - bob;
    c2.beginPath(); c2.arc(nx, ny, 8, 0, Math.PI * 2); c2.fillStyle = "#14181c"; c2.fill(); c2.lineWidth = 2; c2.strokeStyle = ring ? PAL.gold : PAL[colorOf(seat)][2]; c2.stroke();
    c2.fillStyle = "#fff"; c2.font = "800 11px system-ui"; c2.textAlign = "center"; c2.textBaseline = "middle"; c2.fillText(String(h + 1), nx, ny + 1);
  }
  function drawDiceArt(now) {
    const D = ART.dice, [bx, by, bw, bh] = D.box;
    const c0 = imgToScreen(640, 478), k = 92 / bh;           // xúc xắc cao 92px giữa bàn
    const rolling = diceAnim && now < diceAnim.until;
    const face = rolling ? 1 + Math.floor((now / 70) % 6) : shownDice;
    const ready = g.phase === "roll" && !busy() && !paused;
    c2.save(); c2.translate(c0.x, c0.y);
    if (rolling) { c2.rotate(Math.sin(now / 40) * 0.3); c2.translate(0, -Math.abs(Math.sin(now / 60)) * 8); }
    if (ready) { c2.beginPath(); c2.arc(0, 0, 50 + 3 * Math.sin(now / 200), 0, Math.PI * 2); c2.fillStyle = "rgba(255,201,74,.28)"; c2.fill(); }
    c2.beginPath(); c2.ellipse(0, bh * k / 2 - 4, bw * k * 0.42, 8, 0, 0, Math.PI * 2); c2.fillStyle = "rgba(0,0,0,.35)"; c2.fill();
    c2.scale(k, k); c2.translate(-(bx + bw / 2), -(by + bh / 2));
    c2.imageSmoothingEnabled = true; c2.imageSmoothingQuality = "high";
    c2.drawImage(art.dice, 0, 0);
    if (face) {
      // vẽ lại mặt trên theo số gieo được: tô mặt 2 tông như ảnh, rồi chấm vuông theo phối cảnh hình thoi
      const [T, R, B, L] = D.top, cx = (T[0] + B[0]) / 2, cy = (T[1] + B[1]) / 2, sh = 0.93;
      const P = (p) => [cx + (p[0] - cx) * sh, cy + (p[1] - cy) * sh];
      const t = P(T), r = P(R), b = P(B), l = P(L);
      c2.beginPath(); c2.moveTo(...t); c2.lineTo(...r); c2.lineTo(...b); c2.lineTo(...l); c2.closePath();
      c2.fillStyle = "#e1bc87"; c2.fill();
      c2.beginPath(); c2.moveTo(...t); c2.lineTo((t[0] + r[0]) / 2, (t[1] + r[1]) / 2); c2.lineTo((l[0] + b[0]) / 2, (l[1] + b[1]) / 2); c2.lineTo(...l); c2.closePath();
      c2.fillStyle = "#fcefbf"; c2.fill();
      c2.save();
      c2.transform((R[0] - T[0]) / 2, (R[1] - T[1]) / 2, (L[0] - T[0]) / 2, (L[1] - T[1]) / 2, cx, cy);
      c2.fillStyle = "#120b08";
      for (const [u, v] of DICE_PIPS[face]) c2.fillRect(u * 0.48 - 0.15, v * 0.48 - 0.15, 0.3, 0.3);
      c2.restore();
    }
    c2.restore();
    if (!face && ready) { c2.fillStyle = "#fff"; c2.strokeStyle = "#2a1a10"; c2.lineWidth = 4; c2.font = "800 14px system-ui"; c2.textAlign = "center"; c2.strokeText("GIEO", c0.x, c0.y + 58); c2.fillText("GIEO", c0.x, c0.y + 58); }
  }
  function drawDice(now) {
    const cx = BX + 6.5 * C, cy = BY + 6.5 * C, s = C * 1.5;
    const rolling = diceAnim && now < diceAnim.until;
    const face = rolling ? 1 + Math.floor((now / 70) % 6) : shownDice;
    const seat = rolling ? diceAnim.seat : shownSeat;
    const ready = g.phase === "roll" && !busy() && !paused;
    c2.save(); c2.translate(cx, cy); if (rolling) c2.rotate(Math.sin(now / 40) * 0.25);
    c2.fillStyle = "rgba(0,0,0,.4)"; c2.fillRect(-s / 2 + 4, -s / 2 + 6, s, s);
    c2.fillStyle = "#fbf6ea"; c2.fillRect(-s / 2, -s / 2, s, s);
    c2.lineWidth = 4; c2.strokeStyle = ready ? PAL.gold : PAL[colorOf(seat)][1]; c2.strokeRect(-s / 2, -s / 2, s, s);
    if (face) {
      const P = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] }[face];
      c2.fillStyle = face === 1 || face === 6 ? "#c22f26" : "#1d1d1d";
      for (const [px, py] of P) { c2.beginPath(); c2.arc(px * s * 0.27, py * s * 0.27, s * 0.09, 0, Math.PI * 2); c2.fill(); }
    } else {
      c2.fillStyle = "#3a2508"; c2.font = "800 15px system-ui"; c2.textAlign = "center"; c2.textBaseline = "middle"; c2.fillText("GIEO", 0, 1);
    }
    c2.restore();
  }
  function hud() {
    c2.fillStyle = PAL.panel; c2.fillRect(0, 0, W, 64);
    c2.fillStyle = PAL.edge; c2.fillRect(0, 64, W, 2);
    // chip từng người: màu + số ngựa đã vào chuồng đích
    const n = g.seats.length, cw = Math.min(170, (W - 24) / n);
    g.seats.forEach((s, i) => {
      const x = 12 + i * cw, on = s === shownSeat && g.phase !== "over";
      const [col, dark] = PAL[colorOf(s)];
      c2.fillStyle = on ? col : "rgba(255,255,255,.06)"; c2.fillRect(x, 10, cw - 8, 44);
      c2.strokeStyle = on ? PAL.gold : dark; c2.lineWidth = on ? 3 : 2; c2.strokeRect(x, 10, cw - 8, 44);
      c2.beginPath(); c2.arc(x + 20, 32, 9, 0, Math.PI * 2); c2.fillStyle = on ? "#fff" : col; c2.fill();
      const home = g.horses[s].filter((p) => isHome(g, p)).length;
      c2.textAlign = "left"; c2.textBaseline = "middle"; c2.fillStyle = on ? "#14181c" : PAL.ink;
      c2.font = "700 16px 'Be Vietnam Pro', system-ui"; c2.fillText(nameOf(s), x + 36, 25);
      c2.font = "600 13px 'Be Vietnam Pro', system-ui"; c2.fillText("Về đích " + home + "/4", x + 36, 43);
    });
    // dòng thông báo dưới bàn
    const y = BY + N * C + 16;
    c2.fillStyle = PAL.panel; c2.fillRect(0, y, W, H - y);
    c2.fillStyle = PAL.ink; c2.font = "600 17px 'Be Vietnam Pro', system-ui"; c2.textAlign = "center"; c2.textBaseline = "middle";
    c2.fillText(msg, W / 2, y + (H - y) / 2, W - 24);
  }
  function overlay(title, lines, color) {
    c2.fillStyle = "rgba(8,11,13,.62)"; c2.fillRect(0, 0, W, H);
    const bw = 560, bh = 96 + lines.length * 30, bx = (W - bw) / 2, by = (H - bh) / 2;
    c2.fillStyle = "#080b0d"; c2.fillRect(bx + 4, by + 6, bw, bh);
    c2.fillStyle = "#1a2229"; c2.fillRect(bx, by, bw, bh);
    c2.strokeStyle = PAL.edge; c2.lineWidth = 4; c2.strokeRect(bx, by, bw, bh);
    c2.textAlign = "center"; c2.textBaseline = "middle";
    c2.fillStyle = color; c2.font = "800 34px 'Roboto Slab', Georgia, serif"; c2.fillText(title, W / 2, by + 46);
    c2.font = "600 18px 'Be Vietnam Pro', system-ui";
    lines.forEach((l, i) => { c2.fillStyle = i === lines.length - 1 ? PAL.gold : PAL.ink; c2.fillText(l, W / 2, by + 92 + i * 30); });
  }
  function draw(now) {
    c2.fillStyle = PAL.bg; c2.fillRect(0, 0, W, H);
    if (art.ready) { drawBoardArt(now); drawDiceArt(now); } else { drawBoard(now); drawDice(now); }
    drawHorses(now);
    for (const p of pops) {
      const k = (now - p.t) / 1100;
      c2.globalAlpha = Math.max(0, 1 - k);
      c2.fillStyle = "#fff"; c2.strokeStyle = "#7a1c17"; c2.lineWidth = 5; c2.font = "800 26px 'Roboto Slab', Georgia, serif"; c2.textAlign = "center";
      c2.strokeText(p.text, p.x, p.y - 30 - k * 30); c2.fillText(p.text, p.x, p.y - 30 - k * 30);
      c2.globalAlpha = 1;
    }
    hud();
    if (g.phase === "over" && !hop) {
      const order = g.seats.map((s) => [s, g.horses[s].filter((p) => isHome(g, p)).length]).sort((a, b) => b[1] - a[1]);
      overlay(nameOf(g.winner) + " thắng!", [order.map(([s, n]) => nameOf(s) + " " + n + "/4").join(" · "), "Sau " + g.rolls + " lượt gieo", "Nhấn Space hoặc chạm để chơi ván mới"], PAL[colorOf(g.winner)][2]);
    } else if (paused) overlay("Tạm dừng", ["Nhấn P hoặc chạm để chơi tiếp"], PAL.ink);
  }

  const inst = {
    pause() { setPaused(true); },
    resume() { setPaused(false); },
    destroy() {
      destroyed = true; cancelAnimationFrame(raf); sfx.close(); ro.disconnect();
      window.removeEventListener("keydown", onKey);
      canvas.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("visibilitychange", onVis);
      canvas.remove();
    },
    // Dành cho test/debug — không phải API cho core.
    get state() { return g; },
    set state(v) { g = v; shownSeat = currentSeat(g); shownDice = g.dice; autoAt = 0; autoFor = -1; },
    get paused() { return paused; },
    get busy() { return busy() || !!autoAt; },
    get artReady() { return art.ready; },
    get sfx() { return { loaded: sfx.loaded, state: sfx.state, log: sfx.log.slice() }; },
    // Toạ độ CSS (so với canvas) của ngựa / xúc xắc — để test bấm chuột/chạm thật.
    screenOf(seat, h) {
      const q = h == null ? (art.ready ? imgToScreen(640, 478) : { x: BX + 6.5 * C, y: BY + 6.5 * C }) : posXY(g, seat, h, g.horses[seat][h]);
      const r = canvas.getBoundingClientRect();
      return { x: r.left + q.x * r.width / W, y: r.top + q.y * r.height / H };
    },
  };
  return inst;
}
