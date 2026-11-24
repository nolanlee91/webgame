// Đào Vàng — phần hiển thị + điều khiển, theo hợp đồng Game SDK (docs/tech-architecture.md §3.3):
//   mount(el, ctx) -> { pause, resume, destroy }
// Hình vẽ dùng asset thật trong ./assets (nền hang, thợ mỏ + tời + móc, 8 vật thể gộp 1 ảnh — cắt theo SPRITES).
// Khi ảnh chưa tải xong hoặc lỗi, tự quay về hình khối tạm (vẫn chơi được).
import { W, H, CFG, KINDS, createGame, step, fire, nextLevel, restart, tipOf, drainEvents } from "./logic.js";
import { shareResult } from "../_shared/share.js?v=s1";

const DT = 1 / 60;
const SAVE_KEY = "wgp.daovang.v1"; // kỷ lục điểm (chỉ để khoe kết quả + hiện trên bảng "Hết giờ")
function loadBest() { try { const v = JSON.parse(localStorage.getItem(SAVE_KEY)); return { best: Math.max(0, (v && v.best) | 0), level: Math.max(0, (v && v.level) | 0) }; } catch { return { best: 0, level: 0 }; } }
const fmtNum = (n) => n.toLocaleString("vi-VN");
const fmtTime = (t) => { const m = Math.floor(t / 60); return m + ":" + String(Math.floor(t - m * 60)).padStart(2, "0"); };
const COLORS = {
  sky: "#1d2a35", skyLow: "#2c3b45", ground: "#5a3a26", dirt: "#4a2f1f", dirtDeep: "#3a2418", edge: "#7a5152",
  rope: "#d9c9a3", hook: "#c9ccd1", ink: "#f4ead2", soft: "#b9ad93", gold: "#ffc94a", goldDark: "#a8741a",
  diamond: "#7fe7ff", diamondDark: "#2b8fb0", rock: "#8a8f96", rockDark: "#4d5258", bag: "#c9a46a", bagDark: "#7a5a2c",
  tnt: "#d8433a", tntDark: "#7a1c17", p1: "#ffd27a", p2: "#7fe0c8", panel: "rgba(14,18,22,.86)", ok: "#7fe0a0", bad: "#ff8a7a",
};

// ---------- Asset thật ----------
// Ô cắt [x, y, w, h] tính trên ảnh gốc 1280×960 (đo bằng kênh alpha), cùng điểm neo và cỡ hiển thị.
const SHEET = { bg: "hang-dong-nen.webp", miner: "tho-mo.webp", objs: "vat-the.webp" };
const SPRITES = {
  goldS:   { box: [64, 248, 168, 148], size: 2.5 },
  goldM:   { box: [308, 208, 240, 204], size: 2.35 },
  goldL:   { box: [596, 144, 352, 288], size: 2.3 },
  diamond: { box: [996, 204, 244, 204], size: 3.0 },
  rockS:   { box: [40, 628, 200, 180], size: 2.35 },
  rockL:   { box: [284, 568, 308, 260], size: 2.35 },
  bag:     { box: [628, 528, 280, 312], size: 2.9 },
  tnt:     { box: [956, 552, 300, 284], size: 2.4 },
  // Thợ mỏ + tời (bỏ cột dây và càng móc ở góc trái ảnh); neo = đỉnh trống tời, đặt vào trục dây.
  station: { box: [280, 24, 892, 728], anchor: [485, 350], scale: 0.135 },
  // Càng móc; neo = giữa càng, đặt vào đầu móc (điểm xét va chạm).
  // clear = phần chân bệ tời lọt vào ô cắt, xoá đi.
  claw:    { box: [104, 712, 300, 232], anchor: [236, 740], scale: 0.2, clear: [290, 700, 120, 54] },
};
const art = { ready: false, bg: null, sprites: {} };
function loadImg(name) {
  return new Promise((ok, bad) => {
    const im = new Image();
    im.onload = () => ok(im);
    im.onerror = () => bad(new Error("Không tải được " + name));
    im.src = new URL("./assets/" + name, import.meta.url).href;
  });
}
function cut(img, [x, y, w, h], clear) {
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const cx = cv.getContext("2d");
  cx.drawImage(img, x, y, w, h, 0, 0, w, h);
  if (clear) cx.clearRect(clear[0] - x, clear[1] - y, clear[2], clear[3]);
  return cv;
}
let artPromise = null;
function loadArt() {
  if (artPromise) return artPromise;
  artPromise = Promise.all([loadImg(SHEET.bg), loadImg(SHEET.miner), loadImg(SHEET.objs)]).then(([bg, miner, objs]) => {
    // Nền: 1 ảnh phủ kín (không ghép lặp nên không có đường nối). Phóng 0,82 để mép đá xanh/đất nâu
    // (y≈400 trên ảnh) rơi đúng mặt đất CFG.groundY, đáy ảnh vẫn phủ hết khung 960×600.
    const cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const cx = cv.getContext("2d");
    cx.imageSmoothingQuality = "high";
    const s = 0.82, dw = bg.width * s, dh = bg.height * s;
    cx.drawImage(bg, (W - dw) / 2, CFG.groundY - 400 * s, dw, dh);
    // Phủ tối nhẹ vùng trên mặt đất để thợ mỏ/HUD nổi hơn nền đá.
    cx.fillStyle = "rgba(10,12,24,.28)"; cx.fillRect(0, 0, W, CFG.groundY);
    art.bg = cv;
    for (const [k, sp] of Object.entries(SPRITES)) {
      const src = k === "station" || k === "claw" ? miner : objs;
      art.sprites[k] = cut(src, sp.box, sp.clear);
    }
    art.ready = true;
  });
  artPromise.catch((e) => console.warn("[dao-vang] dùng hình khối tạm:", e.message));
  return artPromise;
}


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
  loadArt().catch(() => {});
  const sdk = ctx.sdk || {};
  const sfx = makeSfx("assets/sfx/", ["tha-moc", "keo-vat", "trung-vang", "trung-kim-cuong", "trung-da", "no-tnt", "het-gio", "qua-man", "thang", "thua"], sdk);
  const players = 1; // chỉ chơi 1 người (đã bỏ chế độ 2 người cùng máy; ctx.localPlayers cũ = 2 cũng thành 1 người)
  let g = createGame({ players, seed: ctx.seed });
  let paused = false, destroyed = false, acc = 0, last = performance.now(), raf = 0;
  const pops = [];   // điểm bay lên
  let shake = 0, flash = 0;
  // Số liệu cả lượt chơi (từ màn 1 tới lúc "Hết giờ") để khoe kết quả
  let run = { gold: 0, diamond: 0, time: 0 }, result = null, saved = loadBest();

  const canvas = document.createElement("canvas");
  canvas.className = "dv-canvas";
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", "Màn chơi Đào Vàng");
  canvas.tabIndex = 0;
  canvas.style.cssText = "display:block;width:100%;height:auto;aspect-ratio:" + W + "/" + H + ";touch-action:manipulation;outline:none;image-rendering:pixelated";
  el.appendChild(canvas);
  const c2 = canvas.getContext("2d");

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = canvas.clientWidth || W;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round((cssW * H / W) * dpr);
    c2.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    c2.imageSmoothingEnabled = false;
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  // ---------- Điều khiển ----------
  function advance() {
    // Khi màn kết thúc: một phím/chạm để sang màn hoặc chơi lại.
    if (g.status === "cleared") { g = nextLevel(g); sfx.play("qua-man"); return true; }
    if (g.status === "failed") { g = restart(g); run = { gold: 0, diamond: 0, time: 0 }; result = null; return true; }
    return false;
  }
  function act(i) {
    if (paused) { setPaused(false); return; }
    if (advance()) return;
    fire(g, i);
  }
  function onKey(e) {
    sfx.unlock();
    if (e.repeat) return;
    const k = e.code;
    if (k === "KeyP" || k === "Escape") { setPaused(!paused); e.preventDefault(); return; }
    if (!["Space", "ArrowDown", "KeyS", "Enter"].includes(k)) return;
    e.preventDefault();
    act(0);
  }
  function onPointer(e) {
    sfx.unlock();
    canvas.focus({ preventScroll: true });
    e.preventDefault();
    act(0);
  }
  function onVis() { if (document.hidden) setPaused(true); }
  window.addEventListener("keydown", onKey);
  canvas.addEventListener("pointerdown", onPointer);
  document.addEventListener("visibilitychange", onVis);

  function setPaused(v) {
    if (paused !== v) sfx.play("tha-moc", 0.3);
    paused = v;
    last = performance.now();
  }

  // ---------- Vòng lặp: bước logic cố định 1/60 s, vẽ theo khung hình ----------
  let reported = null;
  function frame(now) {
    if (destroyed) return;
    raf = requestAnimationFrame(frame);
    let dt = Math.min((now - last) / 1000, 0.25);
    last = now;
    if (!paused) {
      acc += dt;
      while (acc >= DT) { if (g.status === "playing") run.time += DT; step(g, DT); acc -= DT; }
      for (const ev of drainEvents(g)) handleEvent(ev);
    }
    for (const p of pops) p.t += paused ? 0 : dt;
    while (pops.length && pops[0].t > 1.2) pops.shift();
    shake = Math.max(0, shake - dt);
    flash = Math.max(0, flash - dt);
    draw();
  }
  function handleEvent(ev) {
    if (ev.type === "fire") sfx.play("tha-moc", 0.9);
    if (ev.type === "grab") sfx.play(ev.kind === "diamond" ? "trung-kim-cuong" : ev.kind.startsWith("rock") ? "trung-da" : "trung-vang");
    if (ev.type === "collect") {
      sfx.play("keo-vat", 0.9);
      if (ev.kind === "diamond") run.diamond++; else if (ev.kind && ev.kind.startsWith("gold")) run.gold++;
    }
    if (ev.type === "boom") sfx.play("no-tnt");
    if (ev.type === "levelEnd") {
      const late = ev.reason === "time" ? (sfx.play("het-gio"), 0.65) : 0;
      sfx.play(ev.status === "cleared" ? "thang" : "thua", 1, late);
    }
    if (ev.type === "collect") {
      pops.push({ x: ev.x, y: ev.y - 40, text: "+" + ev.value, color: ev.kind === "rockS" || ev.kind === "rockL" ? COLORS.soft : COLORS.gold, t: 0 });
      sdk.reportScore && sdk.reportScore(g.score);
    }
    if (ev.type === "boom") { shake = 0.35; flash = 0.18; pops.push({ x: ev.x, y: ev.y - 20, text: "BÙM!", color: COLORS.tnt, t: 0 }); }
    if (ev.type === "levelEnd" && reported !== g) {
      reported = g;
      if (ev.status === "failed") {
        const prev = saved.best, record = g.score > prev;
        if (record) { saved = { best: g.score, level: g.level }; try { localStorage.setItem(SAVE_KEY, JSON.stringify(saved)); } catch {} }
        result = { score: g.score, level: g.level, target: g.target, record, prev, gold: run.gold, diamond: run.diamond, time: run.time };
      }
      if (ev.status === "failed" && sdk.gameOver) sdk.gameOver({ score: g.score, level: g.level, players });
    }
  }
  raf = requestAnimationFrame(frame);

  // ---------- Vẽ (hình khối tạm) ----------
  function poly(x, y, r, n, rot, fill, stroke) {
    c2.beginPath();
    for (let i = 0; i < n; i++) {
      const a = rot + (i / n) * Math.PI * 2;
      c2.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    c2.closePath();
    c2.fillStyle = fill; c2.fill();
    c2.lineWidth = 3; c2.strokeStyle = stroke; c2.stroke();
  }
  function drawSprite(key, x, y, r) {
    const sp = SPRITES[key], cv = art.sprites[key];
    const k = (r * sp.size) / Math.max(cv.width, cv.height);
    const w = cv.width * k, h = cv.height * k;
    c2.imageSmoothingEnabled = true; c2.imageSmoothingQuality = "high";
    c2.drawImage(cv, x - w / 2, y - h / 2, w, h);
    c2.imageSmoothingEnabled = false;
  }
  function drawObject(o) {
    const { x, y, r } = o;
    if (art.ready) { drawSprite(o.kind, x, y, r); return; }
    switch (o.kind) {
      case "goldS": case "goldM": case "goldL":
        poly(x, y, r, 8, 0.3, COLORS.gold, COLORS.goldDark);
        c2.fillStyle = "#fff4c2"; c2.fillRect(x - r * 0.45, y - r * 0.5, r * 0.3, r * 0.22);
        break;
      case "diamond":
        poly(x, y, r * 1.25, 4, 0, COLORS.diamond, COLORS.diamondDark);
        c2.fillStyle = "#e9fbff"; c2.fillRect(x - 3, y - r * 0.6, 4, 4);
        break;
      case "rockS": case "rockL":
        poly(x, y, r, 7, 0.9, COLORS.rock, COLORS.rockDark);
        c2.fillStyle = "#a6abb2"; c2.fillRect(x - r * 0.4, y - r * 0.45, r * 0.35, r * 0.2);
        break;
      case "bag":
        c2.fillStyle = COLORS.bag; c2.strokeStyle = COLORS.bagDark; c2.lineWidth = 3;
        c2.fillRect(x - r, y - r * 0.7, r * 2, r * 1.7); c2.strokeRect(x - r, y - r * 0.7, r * 2, r * 1.7);
        c2.fillRect(x - r * 0.5, y - r * 1.1, r, r * 0.45);
        c2.fillStyle = COLORS.bagDark; c2.font = "bold 16px system-ui"; c2.textAlign = "center"; c2.textBaseline = "middle";
        c2.fillText("?", x, y + 2);
        break;
      case "tnt":
        c2.fillStyle = COLORS.tnt; c2.strokeStyle = COLORS.tntDark; c2.lineWidth = 3;
        c2.fillRect(x - r, y - r, r * 2, r * 2); c2.strokeRect(x - r, y - r, r * 2, r * 2);
        c2.fillStyle = "#fff"; c2.font = "bold 11px system-ui"; c2.textAlign = "center"; c2.textBaseline = "middle";
        c2.fillText("TNT", x, y + 1);
        break;
    }
  }
  function drawAnchored(key, x, y, rot) {
    const sp = SPRITES[key], cv = art.sprites[key];
    const ax = (sp.anchor[0] - sp.box[0]) * sp.scale, ay = (sp.anchor[1] - sp.box[1]) * sp.scale;
    c2.save(); c2.translate(x, y); if (rot) c2.rotate(rot);
    c2.imageSmoothingEnabled = true; c2.imageSmoothingQuality = "high";
    c2.drawImage(cv, -ax, -ay, cv.width * sp.scale, cv.height * sp.scale);
    c2.restore(); c2.imageSmoothingEnabled = false;
  }
  function drawMiner(h, i) {
    const col = i === 0 ? COLORS.p1 : COLORS.p2;
    if (art.ready) {
      const bob = h.state === "back" ? Math.round(Math.sin(performance.now() / 70)) : 0;
      drawAnchored("station", h.x, h.y + bob, 0);
      return;
    }
    // bệ tời
    c2.fillStyle = "#6b4a2e"; c2.fillRect(h.x - 34, CFG.groundY - 26, 68, 26);
    c2.strokeStyle = "#2a1a10"; c2.lineWidth = 3; c2.strokeRect(h.x - 34, CFG.groundY - 26, 68, 26);
    // trục tời
    c2.fillStyle = "#3b2a1c"; c2.fillRect(h.x - 18, h.y - 14, 36, 22);
    c2.fillStyle = "#9a7b52"; c2.fillRect(h.x - 14, h.y - 10, 28, 6);
    // người thợ (khối)
    const bob = h.state === "back" ? Math.sin(performance.now() / 70) * 2 : 0;
    c2.fillStyle = "#3a4f6a"; c2.fillRect(h.x + 22, h.y - 6 + bob, 20, 26);
    c2.fillStyle = "#f0c79a"; c2.fillRect(h.x + 24, h.y - 24 + bob, 16, 16);
    c2.fillStyle = col; c2.fillRect(h.x + 21, h.y - 30 + bob, 22, 8);
  }
  function drawHook(h, i) {
    const t = tipOf(h);
    c2.strokeStyle = COLORS.rope; c2.lineWidth = 2;
    c2.beginPath(); c2.moveTo(h.x, h.y); c2.lineTo(t.x, t.y); c2.stroke();
    if (art.ready) {
      c2.strokeStyle = "rgba(40,24,12,.6)"; c2.lineWidth = 1;
      c2.beginPath(); c2.moveTo(h.x + 1.5, h.y); c2.lineTo(t.x + 1.5, t.y); c2.stroke();
      drawAnchored("claw", t.x, t.y, -h.angle);
      return;
    }
    // càng móc
    c2.save(); c2.translate(t.x, t.y); c2.rotate(-h.angle);
    c2.strokeStyle = COLORS.hook; c2.lineWidth = 4;
    const open = h.carry ? 6 : 12;
    c2.beginPath(); c2.moveTo(0, 0); c2.lineTo(-open, 8); c2.lineTo(-open + 3, 16); c2.stroke();
    c2.beginPath(); c2.moveTo(0, 0); c2.lineTo(open, 8); c2.lineTo(open - 3, 16); c2.stroke();
    c2.fillStyle = i === 0 ? COLORS.p1 : COLORS.p2; c2.fillRect(-4, -4, 8, 8);
    c2.restore();
  }
  // ---- Lớp UI pixel (Art Bible V5): viền đen 3px góc khuyết, vát sáng/tối 2px, bóng cứng lệch 4px, không bo/không mờ.
  // Vàng chỉ dùng cho lời nhắc hành động chính (nút "tiếp tục") — điểm số dùng màu chữ thường.
  const PX = { panel: "#1d1a16", panel2: "#262019", line: "#0a0807", ink: "#f4ead2", soft: "#b9ad93", dim: "#7d7564",
    gold: "#ffc94a", goldL: "#ffe9a8", goldD: "#5a3a08", shadow: "rgba(0,0,0,.6)" };
  const FONT = (w, s) => w + " " + s + "px 'Be Vietnam Pro', system-ui, sans-serif";
  function pxBox(x, y, w, h, fill, edge, drop) {
    if (drop) { c2.fillStyle = PX.shadow; c2.fillRect(x + 4, y + 7, w, h); c2.fillRect(x + 7, y + 4, w, h); }
    c2.fillStyle = edge || PX.line; // viền 4 cạnh, chừa góc → góc khuyết bậc
    c2.fillRect(x, y - 3, w, 3); c2.fillRect(x, y + h, w, 3); c2.fillRect(x - 3, y, 3, h); c2.fillRect(x + w, y, 3, h);
    c2.fillStyle = fill; c2.fillRect(x, y, w, h);
    c2.fillStyle = "rgba(255,255,255,.13)"; c2.fillRect(x, y, w, 2);
    c2.fillStyle = "rgba(0,0,0,.35)"; c2.fillRect(x, y + h - 2, w, 2);
  }
  function pxText(t, x, y, col, font) { c2.font = font; c2.fillStyle = "#000"; c2.fillText(t, x + 2, y + 2); c2.fillStyle = col; c2.fillText(t, x, y); }
  function clockIcon(x, y, col) { // đồng hồ pixel 16×16
    c2.fillStyle = col; c2.fillRect(x + 4, y, 8, 2); c2.fillRect(x + 4, y + 14, 8, 2); c2.fillRect(x, y + 4, 2, 8); c2.fillRect(x + 14, y + 4, 2, 8);
    c2.fillRect(x + 2, y + 2, 2, 2); c2.fillRect(x + 12, y + 2, 2, 2); c2.fillRect(x + 2, y + 12, 2, 2); c2.fillRect(x + 12, y + 12, 2, 2);
    c2.fillRect(x + 7, y + 4, 2, 5); c2.fillRect(x + 9, y + 7, 3, 2);
  }
  function hud() {
    c2.fillStyle = PX.panel; c2.fillRect(0, 0, W, 44);
    c2.fillStyle = "rgba(255,255,255,.13)"; c2.fillRect(0, 0, W, 2);
    c2.fillStyle = PX.line; c2.fillRect(0, 44, W, 3);
    c2.textBaseline = "middle";
    const reached = g.score >= g.target;
    c2.textAlign = "left";
    pxText("ĐIỂM", 16, 23, PX.soft, FONT(800, 13));
    pxText(String(g.score), 62, 22, PX.ink, FONT(800, 20));
    pxText("MỤC TIÊU", 170, 23, PX.soft, FONT(800, 13));
    pxText(g.target + (reached ? " ✓" : ""), 250, 22, reached ? COLORS.ok : PX.ink, FONT(800, 20));
    c2.textAlign = "center";
    pxText("MÀN " + g.level, W / 2, 23, PX.ink, FONT(800, 15));
    c2.textAlign = "right";
    const low = g.time <= 10, tc = low ? COLORS.bad : PX.ink;
    if (low && g.time > 0 && !g._lowWarned) { g._lowWarned = true; sfx.play("het-gio", 0.45); } // còn 10 giây (cờ gắn vào màn hiện tại)
    pxText(Math.ceil(g.time) + " giây", W - 16, 22, tc, FONT(800, 18));
    clockIcon(W - 16 - c2.measureText(Math.ceil(g.time) + " giây").width - 26, 14, tc);
    // thanh thời gian chia ô (pixel), nằm dưới viền HUD
    const n = 40, cw = W / n, on = Math.ceil(n * Math.max(0, g.time) / CFG.levelTime);
    c2.fillStyle = PX.line; c2.fillRect(0, 47, W, 7);
    for (let i = 0; i < n; i++) {
      c2.fillStyle = i < on ? (low ? COLORS.bad : COLORS.p2) : "#120f0c";
      c2.fillRect(i * cw + 1, 47, cw - 2, 5);
      if (i < on) { c2.fillStyle = "rgba(0,0,0,.3)"; c2.fillRect(i * cw + 1, 50, cw - 2, 2); }
    }
  }
  function overlay(title, lines, color) {
    c2.fillStyle = "rgba(8,7,6,.62)"; c2.fillRect(0, 0, W, H);
    const bw = 540, bh = 112 + lines.length * 30, bx = Math.round((W - bw) / 2), by = Math.round((H - bh) / 2);
    pxBox(bx, by, bw, bh, PX.panel, PX.line, true);
    c2.fillStyle = color; c2.fillRect(bx, by, bw, 6); // dải màu trạng thái (như thẻ Cờ Cá Ngựa)
    c2.fillStyle = "rgba(0,0,0,.35)"; c2.fillRect(bx, by + 4, bw, 2);
    c2.textAlign = "center"; c2.textBaseline = "middle";
    pxText(title.toUpperCase(), W / 2, by + 48, color, FONT(800, 32));
    const body = lines.slice(0, -1), cta = lines[lines.length - 1];
    body.forEach((l, i) => pxText(l, W / 2, by + 92 + i * 30, PX.ink, FONT(600, 18)));
    // lời nhắc hành động chính = "nút" vàng
    c2.font = FONT(800, 15); const tw = Math.ceil(c2.measureText(cta.toUpperCase()).width) + 32;
    const cy = by + bh - 50, cx = Math.round(W / 2 - tw / 2);
    pxBox(cx, cy, tw, 34, PX.gold, PX.goldD, true);
    c2.fillStyle = PX.goldL; c2.fillRect(cx, cy, tw, 3);
    c2.fillStyle = "#2c1b05"; c2.fillText(cta.toUpperCase(), W / 2, cy + 18);
    return by + bh;
  }
  function draw() {
    c2.save();
    if (shake > 0) c2.translate((Math.random() - 0.5) * 10 * shake / 0.35, (Math.random() - 0.5) * 10 * shake / 0.35);
    if (art.ready) c2.drawImage(art.bg, -6, -6, W + 12, H + 12);
    else {
    // nền tạm: bầu trời + các lớp đất
    c2.fillStyle = COLORS.sky; c2.fillRect(-10, -10, W + 20, CFG.groundY + 10);
    c2.fillStyle = COLORS.skyLow; c2.fillRect(-10, CFG.groundY - 50, W + 20, 50);
    c2.fillStyle = COLORS.ground; c2.fillRect(-10, CFG.groundY, W + 20, 14);
    c2.fillStyle = COLORS.dirt; c2.fillRect(-10, CFG.groundY + 14, W + 20, 200);
    c2.fillStyle = COLORS.dirtDeep; c2.fillRect(-10, CFG.groundY + 214, W + 20, H);
    c2.fillStyle = "rgba(0,0,0,.12)";
    for (let y = CFG.groundY + 30; y < H; y += 36) for (let x = (y / 36 % 2) * 40; x < W; x += 80) c2.fillRect(x, y, 10, 4);
    }
    for (const o of g.objects) if (!o.taken) drawObject(o);
    g.hooks.forEach((h, i) => drawMiner(h, i));
    g.hooks.forEach((h, i) => { drawHook(h, i); if (h.carry) drawObject(h.carry); });
    for (const p of pops) {
      c2.globalAlpha = Math.max(0, 1 - p.t / 1.2);
      c2.textAlign = "center"; c2.textBaseline = "middle";
      pxText(p.text, p.x, p.y - p.t * 40, p.color, FONT(800, 24));
      c2.globalAlpha = 1;
    }
    c2.restore();
    if (flash > 0) { c2.fillStyle = "rgba(255,220,160," + flash * 2 + ")"; c2.fillRect(0, 0, W, H); }
    hud();
    const keyHint = "Space / ↓ hoặc chạm màn hình để thả móc";
    if (g.status === "playing" && g.tick < 240 && !paused) {
      c2.font = FONT(700, 15); const kw = Math.ceil(c2.measureText(keyHint).width) + 32;
      pxBox(Math.round(W / 2 - kw / 2), H - 48, kw, 32, PX.panel, PX.line, true);
      c2.textAlign = "center"; c2.textBaseline = "middle"; pxText(keyHint, W / 2, H - 31, PX.ink, FONT(700, 15));
    }
    if (g.status === "cleared") {
      overlay("Qua màn " + g.level + "!", ["Điểm " + g.score + " / mục tiêu " + g.target, "Nhấn Space hoặc chạm để sang màn " + (g.level + 1)], COLORS.ok);
    }
    let shareAt = 0;
    if (g.status === "failed") {
      const rec = result && result.record && result.score > 0 ? "Kỷ lục mới!" : saved.best ? "Kỷ lục: " + saved.best : null;
      shareAt = overlay("Hết giờ!", ["Thiếu " + (g.target - g.score) + " điểm để qua màn " + g.level, "Tổng điểm: " + g.score, ...(rec ? [rec] : []), "Nhấn Space hoặc chạm để chơi lại"], COLORS.bad);
    } else if (paused) {
      overlay("Tạm dừng", ["Trò chơi đang dừng", "Nhấn P hoặc chạm để chơi tiếp"], PX.ink);
    }
    placeShare(shareAt);
  }

  // ---------- Nút "Khoe kết quả" (DOM, nằm ngay dưới bảng "Hết giờ" trên canvas) ----------
  const shareBtn = document.createElement("button");
  shareBtn.type = "button"; shareBtn.className = "btn dv-share"; shareBtn.id = "shareBtn"; shareBtn.textContent = "Khoe kết quả"; shareBtn.hidden = true;
  el.appendChild(shareBtn);
  let shareTop = -1;
  function placeShare(y) {
    const show = y > 0 && !paused;
    if (shareBtn.hidden === show) shareBtn.hidden = !show;
    if (show && y !== shareTop) { shareTop = y; shareBtn.style.top = (y + 18) / H * 100 + "%"; }
  }
  shareBtn.addEventListener("click", () => {
    const r = result; if (!r) return;
    const tagline = r.record && r.level >= 4 ? "Kỷ lục mới! Mỏ vàng này giờ đứng tên tui."
      : r.record ? "Kỷ lục mới! Móc câu thần sầu, ai dám đọ?"
      : r.diamond >= 2 ? "Kim cương gom cả nắm mà vẫn trễ giờ, tiếc ghê!"
      : r.level >= 3 ? "Đào tới màn " + r.level + " rồi, ván sau phá đảo!"
      : "Toàn kéo trúng đá, mai đào tiếp!";
    shareResult({
      game: "dao-vang",
      title: r.record && r.score > 0 ? `Kỷ lục mới ${fmtNum(r.score)} điểm` : `${fmtNum(r.score)} điểm`,
      lines: [`Màn đạt: ${r.level}`, `Vàng gắp được: ${r.gold} cục`, `Kim cương: ${r.diamond} viên`,
        !r.record && r.prev ? `Kỷ lục: ${fmtNum(r.prev)}` : `Thời gian: ${fmtTime(r.time)}`],
      tagline,
    });
  });

  const inst = {
    pause() { setPaused(true); },
    resume() { setPaused(false); },
    destroy() {
      destroyed = true; cancelAnimationFrame(raf); ro.disconnect(); sfx.close();
      window.removeEventListener("keydown", onKey);
      canvas.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("visibilitychange", onVis);
      canvas.remove(); shareBtn.remove();
    },
    // Dành cho test/debug — không phải API cho core.
    get state() { return g; },
    set state(v) { g = v; },
    get paused() { return paused; },
    get result() { return result; },
    get artReady() { return art.ready; },
    get sfx() { return { loaded: sfx.loaded, state: sfx.state, log: sfx.log.slice() }; },
  };
  return inst;
}
