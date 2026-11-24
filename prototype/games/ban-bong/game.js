// Bắn Bóng Khủng Long — phần hiển thị + điều khiển. Luật nằm ở logic.js (không đụng DOM).
// Bóng 6 màu giữ ký hiệu riêng để dễ phân biệt. Khủng long dùng sprite riêng và có hình dự phòng khi ảnh chưa tải.
import * as L from "./logic.js";
import { shareResult } from "../_shared/share.js?v=s1";

const SAVE_KEY = "wgp.ban-bong.v1";
const FLY_SPEED = 26; // đơn vị (đường kính bóng) / giây

// [nền, sáng, tối] theo bảng màu Art Bible V5 (giữ cho hạt nổ / đường ngắm) + [gờ sáng, bóng sâu] cho khối cầu
const PAL = [
  ["#ef646c", "#ff9b9c", "#a62e52"], // đỏ — vòng tròn
  ["#f18b44", "#ffc07c", "#a74725"], // cam — ô vuông
  ["#edcf43", "#fff193", "#9b6c20"], // vàng — thoi
  ["#54ce94", "#99f0bd", "#167858"], // lá — tam giác
  ["#55a8f0", "#98d7ff", "#3155ae"], // xanh dương — chữ thập
  ["#ab7eea", "#d4afff", "#643384"], // tím — tim
];
const PAL2 = [["#ffd0c4", "#5a120c"], ["#ffe6c4", "#552a08"], ["#fff6d0", "#6a4606"], ["#d4f6c0", "#0c3410"], ["#d4e6ff", "#0c2248"], ["#eedcff", "#26123f"]];
const KIND_NAME = ["đỏ", "cam", "vàng", "xanh lá", "xanh dương", "tím"];
const OUT = "#160d0a";
const GLYPH = [
  [".###.", "#...#", "#...#", "#...#", ".###."],
  ["#####", "#...#", "#...#", "#...#", "#####"],
  ["..#..", ".###.", "#####", ".###.", "..#.."],
  ["..#..", ".###.", "#####"],
  ["..#..", "..#..", "#####", "..#..", "..#.."],
  [".#.#.", "#####", "#####", ".###.", "..#.."],
];
// Khủng long con 24×24 (nhìn sang phải) — cùng tạo hình ảnh bìa: thân xanh lá, gai lưng cam, bụng kem.
// o viền, g xanh, l xanh sáng, d xanh tối, b bụng kem, c bụng tối, s gai cam, S gai tối, w mắt trắng, k con ngươi, r má, t răng, m miệng
const DINO = [
  "........................",
  "...........ooooooo......",
  "..........ollllllgoo....",
  ".........ollggggggggo...",
  "....s....ogggggwwwggo...",
  "...sso...oggggwwkkggo...",
  "...sSo..ogggggwwkkgggo..",
  "..ssSoooggrrggggggggggo.",
  "..sSSogggrrgggggoootmtmo",
  ".ssSoggggggggggo.oooooo.",
  ".sSSoggggggggoo.........",
  ".sSoggggggbbgo..........",
  "ssSogggggbbbbgooo.......",
  "sSoggggbbbbbbgglgo......",
  "oSogggcbbbbbbgooo.......",
  ".oggggcbbbbbgdo.........",
  "..oggdccbbbbgdo.........",
  "..ogdddcbbbgddo.........",
  "...oddddgggddo..........",
  "...oddgggoddgo..........",
  "...odggo..odggo.........",
  "...oggo...ogggo.........",
  "..oooooo.oooooo.........",
  "........................",
];
const DINO_COL = { o: OUT, g: "#4aa84e", l: "#8fdc7a", d: "#1f5a26", b: "#ffe9c9", c: "#d9b98f", s: "#e8954a", S: "#a8541a", w: "#fff8ec", k: "#160d0a", r: "#e07a6a", t: "#fff8ec", m: "#5a1a14" };

// ---------- Sprite ----------
const BS = 20; // mỗi bóng là khối pixel 20×20 — hạt pixel thô, đếm được bằng mắt
function paint(fn, w = BS, h = BS) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d");
  fn((x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); }, g);
  return c;
}
const circ = (r, c = (BS - 1) / 2) => (x, y) => x >= 0 && y >= 0 && x < BS && y < BS && (x - c) ** 2 + (y - c) ** 2 <= r * r;
// khối cầu pixel: ánh sáng từ trên-trái, 5 bậc màu, dải chuyển bằng hạt so le (dithering), viền 1px, ánh phản chiếu dưới-phải
function sphere(px, m, [hi, lite, base, dark, deep], edgeCol = OUT) {
  const c = (BS - 1) / 2, r = BS / 2 - 0.6;
  const edge = (x, y) => m(x, y) && (!m(x - 1, y) || !m(x + 1, y) || !m(x, y - 1) || !m(x, y + 1));
  for (let y = 0; y < BS; y++) for (let x = 0; x < BS; x++) {
    if (!m(x, y)) continue;
    if (edge(x, y)) { px(x, y, edgeCol); continue; }
    const nx = (x - c) / r, ny = (y - c) / r, rr = Math.min(1, Math.hypot(nx, ny)), nz = Math.sqrt(1 - rr * rr);
    const d = -0.45 * nx - 0.55 * ny + 0.7 * nz, ch = (x + y) & 1; // pháp tuyến cầu · hướng sáng trên-trái-trước
    let col;
    if (d > 0.93) col = hi;
    else if (d > 0.88) col = ch ? hi : lite;
    else if (d > 0.68) col = lite;
    else if (d > 0.62) col = ch ? lite : base;
    else if (d > 0.3) col = base;
    else if (d > 0.22) col = ch ? base : dark;
    else if (d > -0.05) col = dark;
    else col = deep;
    if (rr > 0.72 && d < 0.05 && ny > 0.2 && nx > -0.2 && ch) col = dark; // ánh phản chiếu mép dưới-phải
    px(x, y, col);
  }
  return (x, y) => m(x, y) && !edge(x, y);
}
const tones = (k) => [PAL2[k][0], PAL[k][1], PAL[k][0], PAL[k][2], PAL2[k][1]];
const ORB_SIZE = 64;
function ballSprite(k) {
  const [base, light, shade] = PAL[k];
  const [glow, ink] = PAL2[k];
  return paint((_, g) => {
    const center = ORB_SIZE / 2;
    const glass = g.createRadialGradient(21, 16, 2, center, center, 34);
    glass.addColorStop(0, glow);
    glass.addColorStop(0.32, light);
    glass.addColorStop(0.64, base);
    glass.addColorStop(0.9, shade);
    glass.addColorStop(1, ink);
    g.beginPath(); g.arc(center, center, 29, 0, Math.PI * 2);
    g.fillStyle = glass; g.fill();
    g.lineWidth = 2; g.strokeStyle = ink; g.stroke();
    g.lineCap = "round";
    g.beginPath(); g.arc(center, center, 24, 3.65, 4.78);
    g.lineWidth = 2.7; g.strokeStyle = "#ffffffb3"; g.stroke();
    g.beginPath(); g.arc(center, center, 24, 0.45, 1.35);
    g.lineWidth = 1.9; g.strokeStyle = glow + "a0"; g.stroke();
    // Giữ ký hiệu theo màu để người chơi còn nhận ra nhóm bằng hình.
    const glyph = GLYPH[k], step = 3, x = (ORB_SIZE - glyph[0].length * step) / 2, y = (ORB_SIZE - glyph.length * step) / 2;
    g.fillStyle = ink;
    glyph.forEach((row, j) => [...row].forEach((ch, i) => {
      if (ch === "#") g.fillRect(x + i * step, y + j * step, step, step);
    }));
  }, ORB_SIZE, ORB_SIZE);
}
// trứng kem chấm màu nằm trong vòng bóng màu
const eggMask = (cx, cy, rx, ryT, ryB) => (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / (y < cy ? ryT : ryB)) ** 2 <= 1;
function drawEgg(px, k, cx = 9.5, cy = 10.4, rx = 4.7, ryT = 6.3, ryB = 5.2) {
  const em = eggMask(cx, cy, rx, ryT, ryB);
  const edge = (x, y) => em(x, y) && (!em(x - 1, y) || !em(x + 1, y) || !em(x, y - 1) || !em(x, y + 1));
  for (let y = 0; y < BS; y++) for (let x = 0; x < BS; x++) {
    if (!em(x, y)) continue;
    if (edge(x, y)) { px(x, y, "#5a3a20"); continue; }
    const sh = (x - cx) / rx + (y - cy) / ryB;
    px(x, y, sh > 0.9 ? "#d8c09a" : sh > 0.5 && (x + y) & 1 ? "#e8d4b0" : sh > 0.5 ? "#fff4e0" : "#fff4e0");
  }
  const dot = k >= 0 ? PAL[k][0] : "#8a6a40";
  for (const [x, y] of [[8, 8], [11, 9], [9, 12], [7, 13], [11, 13], [12, 11]]) if (em(x, y) && !edge(x, y)) px(x, y, dot);
  px(8, 6, "#ffffff"); px(7, 7, "#ffffff");
}
function eggSprite(k, ringless = false) {
  return paint((px) => {
    if (!ringless) {
      sphere(px, circ(9.4), tones(k));
      for (let y = 0; y < BS; y++) for (let x = 0; x < BS; x++) { const d = (x - 9.5) ** 2 + (y - 9.5) ** 2; if (d <= 6.9 ** 2) px(x, y, d > 6.1 ** 2 ? "#0e0906" : "#2a1e15"); }
    }
    drawEgg(px, k);
  });
}
// trứng nở: vỏ dưới răng cưa + đầu khủng long thò ra (dùng cho HUD, bảng thắng, hiệu ứng cứu trứng)
function hatchSprite() {
  return paint((px) => {
    const em = eggMask(9.5, 11, 5.2, 6.6, 5.8);
    const zig = (x) => 10 + ((x & 1) ? 1 : 0);
    const head = ["....ooooooo.", "...ollllggo.", "...ogggwkkgo", "...ogggwkkgo", "...ogrrggggo", "...oggggoooo", "....oggo...."];
    head.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== ".") px(i + 3, j + 3, DINO_COL[ch]); }));
    for (let y = 0; y < BS; y++) for (let x = 0; x < BS; x++) {
      if (!em(x, y) || y < zig(x)) continue;
      const edge = !em(x - 1, y) || !em(x + 1, y) || !em(x, y + 1) || y === zig(x);
      px(x, y, edge ? "#5a3a20" : x >= 12 ? "#e8d4b0" : "#fff4e0");
    }
  });
}
function stoneSprite() {
  return paint((px) => {
    const base = circ(9.4);
    const m = (x, y) => base(x, y) && !((x + y < 4) || (x - y > 15) || (y - x > 15) || (x + y > 34));
    const inner = sphere(px, m, ["#d8d0bc", "#b0a690", "#857c6a", "#575044", "#35302a"]);
    for (const [x, y] of [[7, 6], [8, 7], [8, 8], [9, 9], [10, 9], [11, 10], [12, 11], [6, 12], [7, 12], [5, 13], [13, 6], [14, 5]]) if (inner(x, y)) px(x, y, "#2e2a24");
    for (const [x, y] of [[9, 6], [12, 12], [7, 13]]) if (inner(x, y)) px(x, y, "#a39b8b");
    for (const [x, y] of [[4, 13], [5, 14], [14, 14], [15, 13]]) if (inner(x, y)) px(x, y, "#4e6a3a"); // rêu
  });
}
function bombSprite(f) {
  return paint((px) => {
    const m = (x, y) => x >= 0 && y >= 0 && x < BS && y < BS && (x - 9) ** 2 + (y - 11) ** 2 <= 8.2 ** 2;
    const inner = sphere(px, m, ["#8a8070", "#5e544a", "#3a332d", "#1e1814", "#100c0a"]);
    for (let x = 1; x < 18; x++) for (const y of [11, 12]) if (inner(x, y)) px(x, y, y === 11 ? "#e0483d" : "#8e2219");
    for (const [x, y] of [[13, 1], [14, 1], [14, 0], [15, 0], [12, 2], [13, 2]]) px(x, y, "#c8a070");
    px(12, 3, OUT); px(11, 3, OUT);
    const sp = f ? [[16, 0, "#ffc94a"], [17, 1, "#fff4e0"], [16, 1, "#e8954a"], [15, 1, "#ffe9a8"], [18, 0, "#e8954a"]] : [[16, 0, "#fff4e0"], [17, 0, "#ffc94a"], [16, 1, "#ffc94a"], [17, 2, "#e8954a"], [18, 1, "#e8954a"], [15, 0, "#ffe9a8"]];
    for (const [x, y, c] of sp) px(x, y, c);
  });
}
function dinoSprite() {
  return paint((px) => DINO.forEach((row, j) => [...row].forEach((ch, i) => {
    if (ch === ".") return;
    // vảy: hạt tối so le trên thân xanh
    px(i, j, ch === "g" && j > 8 && (i * 3 + j * 5) % 7 === 0 ? "#3a8e40" : DINO_COL[ch]);
  })), 24, 24);
}

let SPR = null;
function sprites() {
  if (SPR) return SPR;
  SPR = { ball: PAL.map((_, k) => ballSprite(k)), egg: PAL.map((_, k) => eggSprite(k)), eggPlain: eggSprite(-1, true), hatch: hatchSprite(), stone: stoneSprite(), bomb: [bombSprite(0), bombSprite(1)], dino: dinoSprite() };
  SPR.url = { eggPlain: SPR.eggPlain.toDataURL(), hatch: SPR.hatch.toDataURL(), egg: SPR.egg[3].toDataURL(), stone: SPR.stone.toDataURL(), bomb: SPR.bomb[0].toDataURL(), ball: SPR.ball.map((c) => c.toDataURL()) };
  return SPR;
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
  const d = { unlocked: 1, stars: {}, best: {}, freeBest: 0, sel: 1, game: null };
  try {
    const v = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (v && typeof v === "object") {
      d.unlocked = Math.min(L.LEVELS.length, Math.max(1, v.unlocked | 0));
      for (let i = 1; i <= L.LEVELS.length; i++) {
        if (v.stars && v.stars[i]) d.stars[i] = Math.min(3, Math.max(0, v.stars[i] | 0));
        if (v.best && v.best[i]) d.best[i] = Math.max(0, v.best[i] | 0);
      }
      d.freeBest = Math.max(0, v.freeBest | 0);
      if (v.sel === "free" || (Number.isInteger(v.sel) && v.sel >= 1 && v.sel <= d.unlocked)) d.sel = v.sel;
      if (v.game && L.deserialize(v.game)) d.game = v.game;
    }
  } catch { /* dữ liệu hỏng → mặc định */ }
  return d;
}

const fmt = (n) => Math.round(n).toLocaleString("vi-VN");
const centerP = (par, i) => { const r = L.R(i), c = L.C(i); return [c + 0.5 + ((r + par) & 1) * 0.5, r * L.RH + 0.5]; };
const DINO_X = L.LX - 3.05, DINO_Y = L.LY + 0.77, NEXT_X = L.LX + 2.3, NEXT_Y = L.LY + 0.2;
const LINE_Y = (L.LOSE_ROW - 0.5) * L.RH + 0.5;

export function mount(root, ctx = {}) {
  const sdk = ctx.sdk || { reportScore() {}, gameOver() {}, sound: { muted: false } };
  if (!sdk.sound) sdk.sound = { muted: false };
  const $ = (id) => root.querySelector("#" + id);
  const stage = $("stage"), frame = $("frame"), board = $("board"), cv = $("cv");
  const g = cv.getContext("2d");
  const ov = { menu: $("ovMenu"), win: $("ovWin"), lose: $("ovLose") };
  const S = sprites();
  const sfx = makeSfx("assets/sfx/", ["buoc-nhay", "do-xuc-xac", "het-gio", "keo-vat", "no-tnt", "qua-man", "tha-moc", "thang", "thua", "trung-da", "trung-kim-cuong"], sdk);
  let save = loadSave();
  let s = null, destroyed = false, gen = 0, speed = 1;
  let seedBase = ctx.seed ?? (Date.now() & 0xffffff), games = 0;
  let G = { cs: 40, u: 40, dpr: 1, bw: 440, bh: 548 };
  let aim = Math.PI / 2, guide = true, touching = false, lastType = "mouse";
  let vg = null;          // bàn đang vẽ: { grid, par } — trong lúc bóng bay là bản chụp trước khi bắn
  let fly = null;         // { path, segs, len, d, k, res, snapPar }
  let fx = [], pushAnim = null, shakeT = 0, dinoJump = 0, raf = 0, last = performance.now(), lastSec = -1, clock = 0;
  let pending = null;     // kết thúc ván đang chờ hiệu ứng xong
  function loadArt(file) {
    const art = new Image();
    art.src = new URL("assets/sprites/" + file, import.meta.url);
    return art;
  }
  const dinoArt = loadArt("dino-v2.webp");
  const launcherBase = loadArt("launcher-base.webp");
  const launcherBarrel = loadArt("launcher-barrel.webp");
  const timers = new Set();
  const wait = (ms) => new Promise((res) => { const t = setTimeout(() => { timers.delete(t); res(); }, ms * speed); timers.add(t); });
  const setText = (id, t) => { const e = $(id); if (e && e.textContent !== String(t)) e.textContent = t; };

  // ---------- Lưu ----------
  function persist() {
    try {
      if (s && s.status === "playing") save.game = L.serialize(s);
      else if (s) save.game = null;
      if (s && s.mode === "free") save.freeBest = Math.max(save.freeBest, s.score);
      localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    } catch { /* hết chỗ / chế độ riêng tư */ }
  }

  // ---------- Bố cục: sân dọc to nhất vừa khung ----------
  function layout() {
    const r = stage.getBoundingClientRect();
    const ht = $("hintTx"), hintH = ht && getComputedStyle(ht).display !== "none" ? 24 : 0;
    const fr = 4;
    const cs = Math.max(14, Math.min(58, Math.floor(Math.min((r.width - 2 * fr - 14) / L.W, (r.height - hintH - 2 * fr - 14) / L.FH))));
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const bw = cs * L.W, bh = Math.round(cs * L.FH);
    G = { cs, dpr, u: cs * dpr, bw, bh };
    frame.style.setProperty("--fr", fr + "px");
    board.style.setProperty("--cs", cs + "px");
    board.style.setProperty("--bw", bw + "px");
    board.style.setProperty("--bh", bh + "px");
    cv.width = Math.round(bw * dpr); cv.height = Math.round(bh * dpr);
    draw();
  }

  // ---------- Vẽ ----------
  function spr(b) { return b.t === L.EGG ? S.egg[b.k] : b.t === L.STONE ? S.stone : b.t === L.BOMB ? S.bomb[(clock * 4 | 0) & 1] : S.ball[b.k]; }
  function blit(img, x, y, size = 1, alpha = 1) {
    const u = G.u;
    if (alpha !== 1) g.globalAlpha = Math.max(0, alpha);
    g.imageSmoothingEnabled = img.width === ORB_SIZE;
    g.drawImage(img, Math.round((x - size / 2) * u), Math.round((y - size / 2) * u), Math.round(size * u), Math.round(size * u));
    g.imageSmoothingEnabled = false;
    if (alpha !== 1) g.globalAlpha = 1;
  }
  function text(t, x, y, size, col = "#f4ead2") {
    const u = G.u;
    g.font = `800 ${Math.round(size * u)}px "Be Vietnam Pro", system-ui, sans-serif`;
    g.textAlign = "center"; g.textBaseline = "middle";
    g.lineWidth = Math.max(2, u * 0.08); g.strokeStyle = "#0a0807"; g.lineJoin = "round";
    g.strokeText(t, x * u, y * u); g.fillStyle = col; g.fillText(t, x * u, y * u);
  }
  function draw() {
    if (!cv.width) return;
    const u = G.u;
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, cv.width, cv.height);
    g.save();
    if (shakeT > 0) g.translate(Math.round((Math.random() * 2 - 1) * u * 0.08 * Math.min(1, shakeT * 4)), 0);
    drawDino();
    const playing = s && s.status === "playing";
    // vạch đỏ nguy hiểm: nhấp nháy khi bóng xuống gần
    const low = vg ? lowest(vg) : -1, danger = low >= L.LOSE_ROW - 2;
    g.fillStyle = danger && (clock * 3 | 0) % 2 ? "#ffb0a0" : "#ed6963";
    g.globalAlpha = danger ? 1 : 0.55;
    const dash = Math.max(2, Math.round(u * 0.3)), lh = Math.max(2, Math.round(u * 0.06));
    for (let x = 0; x < cv.width; x += dash * 2) g.fillRect(x, Math.round(LINE_Y * u), dash, lh);
    g.globalAlpha = 1;
    // bóng trên lưới
    const yoff = pushAnim ? -L.RH * (1 - easeOut(Math.min(1, pushAnim.t / pushAnim.dur))) : 0;
    if (vg) for (let i = 0; i < L.N; i++) {
      const b = vg.grid[i]; if (!b) continue;
      const [x, y] = centerP(vg.par, i);
      let sc = 1;
      if (b.born != null) { const a = Math.min(1, (clock - b.born) / 0.25); sc = 0.3 + 0.7 * easeOut(a); if (a >= 1) delete b.born; }
      blit(spr(b), x, y + yoff, sc);
    }
    // đường ngắm
    if (playing && !fly && guide && !anyOverlay()) drawGuide();
    // bệ phóng
    drawLauncher();
    // bóng đang bay
    if (fly) {
      const [x, y] = posAt(fly, fly.d);
      for (let i = 3; i >= 1; i--) {
        const distance = fly.d - i * 0.31;
        if (distance <= 0) continue;
        const [tx, ty] = posAt(fly, distance);
        blit(S.ball[fly.k], tx, ty, 0.86 - i * 0.13, 0.22 - i * 0.05);
      }
      blit(S.ball[fly.k], x, y);
    }
    // hiệu ứng
    for (const e of fx) {
      const a = e.t / e.dur;
      if (e.type === "pop") blit(e.img, e.x, e.y, a < 0.35 ? 1 + a * 0.6 : Math.max(0, 1.2 * (1 - (a - 0.35) / 0.65)), 1);
      else if (e.type === "drop") blit(e.img, e.x, e.y, 1, 1 - Math.max(0, a - 0.75) * 4);
      else if (e.type === "part") { g.fillStyle = e.c; const p = Math.max(2, Math.round(u / 8)); g.globalAlpha = 1 - a; g.fillRect(Math.round(e.x * u), Math.round(e.y * u), p, p); g.globalAlpha = 1; }
      else if (e.type === "ring") { g.strokeStyle = a < 0.5 ? "#fff4e0" : "#ffc94a"; g.lineWidth = Math.max(2, u * 0.12); g.globalAlpha = 1 - a; g.beginPath(); g.arc(e.x * u, e.y * u, (0.4 + a * e.r) * u, 0, Math.PI * 2); g.stroke(); g.globalAlpha = 1; }
      else if (e.type === "egg") {
        const k = easeInOut(Math.min(1, a)), x = e.x + (DINO_X - e.x) * k, y = e.y + (DINO_Y - 0.6 - e.y) * k - Math.sin(k * Math.PI) * 2.2;
        blit(a < 0.25 ? S.egg[e.k] : S.hatch, x, y, 1 + Math.sin(k * Math.PI) * 0.35);
      }
      else if (e.type === "float") { const k = Math.min(1, a / 0.15); text(e.txt, e.x, e.y - a * 0.8, e.size * (0.7 + 0.3 * k), e.col); }
    }
    g.restore();
  }
  function drawGuide() {
    const { path, at } = L.trace(s, aim);
    const u = G.u, color = PAL[s.cur][1];
    let rest = 1.44, dot = 0;
    for (let j = 1; j < path.length; j++) {
      const [x0, y0] = path[j - 1], [x1, y1] = path[j], len = Math.hypot(x1 - x0, y1 - y0);
      let d = rest;
      while (d < len - (j === path.length - 1 ? 0.45 : 0)) {
        const x = x0 + ((x1 - x0) * d) / len, y = y0 + ((y1 - y0) * d) / len;
        g.globalAlpha = Math.max(0.38, 0.94 - dot * 0.027);
        g.fillStyle = color;
        g.beginPath();
        g.arc(x * u, y * u, Math.max(1.25, u * 0.048), 0, Math.PI * 2);
        g.fill();
        d += 0.37; dot++;
      }
      rest = d - len;
    }
    g.globalAlpha = 0.78;
    const [cx, cy] = centerP(s.par, at);
    g.strokeStyle = color;
    g.lineWidth = Math.max(1, u * 0.038);
    g.beginPath(); g.arc(cx * u, cy * u, u * 0.39, 0, Math.PI * 2); g.stroke();
    g.globalAlpha = 1;
  }
  function drawLauncher() {
    const u = G.u, X = L.LX, Y = L.LY;
    g.save();
    g.imageSmoothingEnabled = true;
    g.translate(X * u, Y * u);
    if (launcherBase.naturalWidth) {
      const height = 1.12 * u;
      const width = height * launcherBase.naturalWidth / launcherBase.naturalHeight;
      g.drawImage(launcherBase, -width / 2, -0.27 * u, width, height);
    } else {
      g.fillStyle = "#43766f";
      g.beginPath(); g.roundRect(-0.93 * u, -0.19 * u, 1.86 * u, 0.88 * u, 0.22 * u); g.fill();
    }
    g.rotate(-aim + Math.PI / 2);
    if (launcherBarrel.naturalWidth) {
      const height = 1.52 * u;
      const width = height * launcherBarrel.naturalWidth / launcherBarrel.naturalHeight;
      g.drawImage(launcherBarrel, -width / 2, -1.4 * u, width, height);
    } else {
      g.fillStyle = "#caad6d";
      g.beginPath(); g.roundRect(-0.26 * u, -1.33 * u, 0.52 * u, 1.25 * u, 0.16 * u); g.fill();
    }
    g.restore();
    if (s && !fly && s.status === "playing") blit(S.ball[s.cur], X, Y, 0.82);
    if (s && s.status === "playing") {
      g.beginPath(); g.arc(NEXT_X * u, NEXT_Y * u, 0.53 * u, 0, Math.PI * 2);
      g.fillStyle = "#123a40"; g.fill();
      g.strokeStyle = "#70a69a"; g.lineWidth = Math.max(1, 0.032 * u); g.stroke();
      blit(S.ball[s.next], NEXT_X, NEXT_Y, 0.78);
      text("⇄", (X + NEXT_X) / 2 + 0.22, NEXT_Y, 0.27, "#a0cbc1");
    }
  }
  function drawDino() {
    const u = G.u;
    const jump = dinoJump > 0 ? Math.sin((1 - dinoJump / 0.5) * Math.PI) * 0.45 : Math.sin(clock * 3) > 0.95 ? 0.06 : 0;
    const image = dinoArt.naturalWidth ? dinoArt : S.dino;
    const h = Math.round((image === dinoArt ? 2.7 : 2.1) * u);
    const w = Math.round(h * image.width / image.height);
    if (image === dinoArt) g.imageSmoothingEnabled = true;
    g.drawImage(image, Math.round(DINO_X * u - w / 2), Math.round((DINO_Y - jump) * u - h), w, h);
    g.imageSmoothingEnabled = false;
  }
  const easeOut = (t) => 1 - (1 - t) * (1 - t);
  const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
  function lowest(v) { for (let i = L.N - 1; i >= 0; i--) if (v.grid[i]) return L.R(i); return -1; }
  function posAt(f, d) {
    let acc = 0;
    for (let j = 1; j < f.path.length; j++) {
      const sl = f.segs[j - 1];
      if (d <= acc + sl || j === f.path.length - 1) { const k = sl ? Math.min(1, (d - acc) / sl) : 1, [x0, y0] = f.path[j - 1], [x1, y1] = f.path[j]; return [x0 + (x1 - x0) * k, y0 + (y1 - y0) * k]; }
      acc += sl;
    }
    return f.path[f.path.length - 1];
  }

  // ---------- Bắn ----------
  function fire(a = aim) {
    if (!s || s.status !== "playing" || fly || pending || anyOverlay()) return null;
    aim = L.clampAngle(a);
    const snapPar = s.par, snapGrid = s.grid.slice(), k = s.cur;
    const res = L.shoot(s, aim);
    vg = { grid: snapGrid, par: snapPar };
    const segs = []; let len = 0;
    for (let j = 1; j < res.path.length; j++) { const d = Math.hypot(res.path[j][0] - res.path[j - 1][0], res.path[j][1] - res.path[j - 1][1]); segs.push(d); len += d; }
    fly = { path: res.path, segs, len, d: 0, k, res, snapPar, bounced: 0 };
    sfx.unlock(); sfx.play("tha-moc", 0.45, 1.2);
    hud();
    return res;
  }
  function land(f) {
    const res = f.res, my = gen;
    fly = null;
    vg = s;
    const P = (at) => centerP(f.snapPar, at);
    const [lx, ly] = P(res.at);
    if (res.bombs.length) {
      for (const b of res.bombs) { const [x, y] = P(b); fx.push({ type: "ring", x, y, r: 1.6, t: 0, dur: 0.4 }); }
      shakeT = 0.35; sfx.play("no-tnt", 0.6);
    }
    res.popped.forEach((b, j) => {
      const [x, y] = P(b.at), img = b.t === L.EGG ? S.egg[b.k] : b.t === L.STONE ? S.stone : b.t === L.BOMB ? S.bomb[0] : S.ball[b.k];
      fx.push({ type: "pop", img, x, y, t: -j * 0.025, dur: 0.22 });
      const col = b.k >= 0 ? PAL[b.k] : ["#8a8070", "#e0483d", "#ffc94a"];
      for (let n = 0; n < 4; n++) { const an = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 3; fx.push({ type: "part", x, y, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp - 1, c: col[n % 3], t: -j * 0.025, dur: 0.45 }); }
    });
    res.dropped.forEach((b) => {
      const [x, y] = P(b.at), img = b.t === L.EGG ? S.egg[b.k] : b.t === L.STONE ? S.stone : b.t === L.BOMB ? S.bomb[0] : S.ball[b.k];
      fx.push({ type: "drop", img, x, y, vx: (Math.random() * 2 - 1) * 1.6, vy: -2 - Math.random() * 2, t: 0, dur: 1.1 });
    });
    res.popped.concat(res.dropped).filter((b) => b.t === L.EGG).forEach((b, j) => {
      const [x, y] = P(b.at);
      fx.push({ type: "egg", x, y, k: b.k, t: -0.1 - j * 0.12, dur: 0.75, done: false });
      fx.push({ type: "float", txt: "+100", x, y: y - 0.3, size: 0.5, col: "#ffc94a", t: -j * 0.12, dur: 0.9 });
    });
    const n = res.popped.length;
    if (n) {
      sfx.play("trung-da", 0.5, 1 + Math.min(0.5, n * 0.04));
      fx.push({ type: "float", txt: "+" + fmt(res.pts), x: lx, y: ly, size: res.pts >= 200 ? 0.6 : 0.45, col: res.pts >= 200 ? "#ffc94a" : "#f4ead2", t: 0, dur: 0.85 });
    } else sfx.play("buoc-nhay", 0.35, 0.9);
    if (res.dropped.length) setTimeout(() => sfx.play("keo-vat", 0.45), 120 * speed);
    if (res.dropped.length >= 6) banner(res.dropped.length >= 12 ? "Rơi cả mảng!" : "Rơi hàng loạt!");
    if (res.pushed) {
      pushAnim = { t: 0, dur: 0.35 };
      for (const b of res.pushed) { const cell = s.grid[b.at]; if (cell) cell.born = clock; }
      shakeT = Math.max(shakeT, 0.2); sfx.play("het-gio", 0.5);
      banner("Trần hạ xuống!", true);
    }
    if (res.refill) {
      for (const b of res.refill) { const cell = s.grid[b.at]; if (cell) cell.born = clock + Math.random() * 0.2; }
      banner("Dọn sạch! +500"); sfx.play("qua-man", 0.6);
    }
    hud(res);
    persist();
    if (s.status === "won") { pending = "won"; onWin(res, my); }
    else if (s.status === "lost") { pending = "lost"; onLose(res, my); }
  }

  function swap() {
    if (!s || fly || pending || anyOverlay() || s.cur === s.next) return false;
    L.swapBalls(s); sfx.play("buoc-nhay", 0.4, 1.3); persist(); return true;
  }

  // ---------- HUD ----------
  let eggsShown = -1;
  function hud(res) {
    if (!s) return;
    const lvl = s.mode === "level";
    setText("hShotsL", lvl ? "Còn viên" : "Đã bắn");
    setText("hShots", lvl ? s.shots : s.fired);
    $("shotsBox").classList.toggle("low", lvl && s.shots <= 5);
    if (lvl && s.shots <= 5 && s.shots > 0 && !s._lowWarned) { s._lowWarned = true; sfx.play("het-gio", 0.4); } // sắp hết viên
    setText("hLevel", lvl ? `${s.level}/${L.LEVELS.length}` : "Tự do");
    setText("hScore", fmt(s.score));
    setText("hBest", lvl ? (save.best[s.level] ? "Kỷ lục " + fmt(save.best[s.level]) : "") : "Kỷ lục " + fmt(Math.max(save.freeBest, s.score)));
    $("eggsBox").hidden = !lvl;
    if (lvl) {
      const got = s.eggsTotal - s.eggsLeft;
      if (got !== eggsShown || !$("hEggs").childElementCount) {
        let h = "";
        for (let i = 0; i < s.eggsTotal; i++) h += `<i class="${i < got ? "got" : ""}" style="background-image:url(${i < got ? S.url.hatch : S.url.eggPlain})" title="${i < got ? "đã cứu" : "chưa cứu"}"></i>`;
        $("hEggs").innerHTML = h + `<b>${got}/${s.eggsTotal}</b>`;
        if (eggsShown >= 0 && got > eggsShown) setTimeout(() => { dinoJump = 0.5; }, 650 * speed);
        eggsShown = got;
      }
    }
    $("pushBox").hidden = !s.push;
    if (s.push) {
      const left = s.push - s.misses;
      setText("hPushL", `Trần hạ khi hụt thêm ${left} lần`);
      $("hPush").innerHTML = Array.from({ length: s.push }, (_, j) => `<i class="${j < s.misses ? "on" : ""}"></i>`).join("");
      $("pushBox").classList.toggle("warn", left <= 1);
      if (left === 1 && s._pushWarnAt !== s.misses) { s._pushWarnAt = s.misses; sfx.play("het-gio", 0.3, 0.8); } // hụt thêm 1 lần là trần hạ
      $("pushBox").title = `Bắn hụt (không nổ bóng nào) ${left} lần nữa thì trần hạ một hàng`;
    }
    $("swapBtn").disabled = !s || s.status !== "playing" || s.cur === s.next;
    if (res && s.mode === "free" && s.score > save.freeBest && save.freeBest > 0 && !s._rec) { s._rec = true; banner("Kỷ lục mới!"); }
    sdk.reportScore && sdk.reportScore(s.score);
  }
  function banner(t, warn = false) {
    board.querySelectorAll(".banner").forEach((e) => e.remove());
    const b = document.createElement("div"); b.className = "banner" + (warn ? " warn" : ""); b.textContent = t;
    board.appendChild(b); setTimeout(() => b.remove(), 1250);
  }

  // ---------- Thắng / thua ----------
  async function onWin(res, my) {
    const lv = s.level;
    banner("Cứu hết trứng!");
    sfx.play("qua-man", 0.7);
    if (res.bonus) { await wait(500); if (my !== gen || destroyed) return; fx.push({ type: "float", txt: `+${fmt(res.bonus)} thưởng ${s.shots} viên dư`, x: L.W / 2, y: L.LY - 2.2, size: 0.5, col: "#ffc94a", t: 0, dur: 1.2 }); }
    await wait(1000);
    if (my !== gen || destroyed) return;
    const prevBest = save.best[lv] || 0, record = s.score > prevBest;
    save.best[lv] = Math.max(prevBest, s.score);
    save.stars[lv] = Math.max(save.stars[lv] || 0, s.stars);
    if (lv < L.LEVELS.length) { save.unlocked = Math.max(save.unlocked, lv + 1); save.sel = lv + 1; }
    persist();
    sdk.gameOver({ result: "won", level: lv, score: s.score, stars: s.stars, shots: s.fired });
    root.querySelectorAll("#wStars i").forEach((e, j) => e.classList.toggle("on", j < s.stars));
    setText("wTitle", lv < L.LEVELS.length ? `Qua màn ${lv}!` : "Phá đảo 12 màn!");
    setText("wSub", s.stars === 3 ? "Hoàn hảo — đủ 3 sao!" : s.stars === 2 ? "Rất tốt! Tiết kiệm thêm viên để lấy đủ 3 sao." : "Qua màn rồi! Chơi lại, bắn ít viên hơn để thêm sao.");
    $("wEggs").innerHTML = Array.from({ length: s.eggsTotal }, (_, j) => `<i style="background-image:url(${S.url.hatch});animation-delay:${0.1 + j * 0.08}s"></i>`).join("");
    $("wResult").innerHTML = `<span>Điểm bắn bóng</span><b>${fmt(s.score - s.bonus)}</b><span>Thưởng ${s.shots} viên dư</span><b>+${fmt(s.bonus)}</b><span>Số viên đã bắn</span><b>${s.fired}</b><span>Chuỗi nổ + rơi lớn nhất</span><b>${s.bestChain}</b><span class="total">Tổng điểm</span><b>${fmt(s.score)}</b>`;
    $("wRecord").innerHTML = record && prevBest ? `<span class="record">Kỷ lục mới!</span>` : prevBest ? `<span class="sub">Kỷ lục màn: ${fmt(save.best[lv])}</span>` : "";
    $("nextBtn").hidden = lv >= L.LEVELS.length;
    lastRun = { won: true, last: lv >= L.LEVELS.length, level: lv, score: s.score, record: record && prevBest > 0, prev: prevBest, stars: s.stars,
      eggs: s.eggsTotal, eggsTotal: s.eggsTotal, fired: s.fired, chain: s.bestChain, time: s.time };
    pending = null;
    show(ov.win);
    sfx.play("thang", 0.6);
    $(lv < L.LEVELS.length ? "nextBtn" : "replayBtn").focus({ preventScroll: true });
  }
  async function onLose(res, my) {
    sfx.play("thua", 0.6);
    if (res.reason === "line") { shakeT = 0.4; banner("Chạm vạch đỏ!", true); }
    await wait(1100);
    if (my !== gen || destroyed) return;
    const free = s.mode === "free";
    const prevFree = save.freeBest;
    persist();
    sdk.gameOver({ result: "lost", level: s.level, score: s.score, stars: 0, shots: s.fired });
    setText("lTitle", res.reason === "line" ? "Bóng chạm vạch đỏ!" : "Hết viên!");
    setText("lSub", free ? "Ván tự do kết thúc — bắn lại nào!" : `Màn ${s.level} — thử lại nhé, bàn mới sẽ khác!`);
    $("lMiss").innerHTML = free ? "" : `Còn ${s.eggsLeft} <i class="ic" style="background-image:url(${S.url.eggPlain})"></i> trứng chưa cứu`;
    $("lResult").innerHTML = free
      ? `<span>Điểm</span><b>${fmt(s.score)}</b><span>Số viên đã bắn</span><b>${s.fired}</b><span>Số lần dọn sạch bàn</span><b>${s.refills}</b>`
      : `<span>Điểm đạt được</span><b>${fmt(s.score)}</b><span>Trứng đã cứu</span><b>${s.eggsTotal - s.eggsLeft}/${s.eggsTotal}</b>`;
    const freeRec = free && s.score > 0 && s.score >= save.freeBest && s.score > (prevFree === s.score ? -1 : prevFree);
    lastRun = { won: false, free, level: s.level, score: s.score, record: freeRec, prev: free ? save.freeBest : save.best[s.level] || 0, line: res.reason === "line",
      eggs: s.eggsTotal - s.eggsLeft, eggsTotal: s.eggsTotal, fired: s.fired, refills: s.refills, chain: s.bestChain, time: s.time };
    $("lRecord").innerHTML = freeRec ? `<span class="record">Kỷ lục tự do: ${fmt(save.freeBest)}</span>` : free ? `<span class="sub">Kỷ lục tự do: ${fmt(save.freeBest)}</span>` : "";
    pending = null;
    show(ov.lose);
    $("retryBtn").focus({ preventScroll: true });
  }

  // ---------- Khoe kết quả (bảng thắng + bảng thua) ----------
  let lastRun = null;
  const fmtTime = (t) => { const m = Math.floor(t / 60); return m + ":" + String(Math.floor(t - m * 60)).padStart(2, "0"); };
  function shareRun(e) {
    const r = lastRun; if (!r) return;
    // Bấm chuột/chạm: trả focus về nút chính để đóng bảng xong Enter/Space vẫn là "Màn tiếp"/"Chơi lại"
    if (e && e.detail > 0) $(r.won ? (r.last ? "replayBtn" : "nextBtn") : "retryBtn").focus({ preventScroll: true });
    const title = r.record ? `Kỷ lục mới ${fmt(r.score)} điểm` : `${fmt(r.score)} điểm`;
    let lines, tagline;
    if (r.won) {
      lines = [`Màn: ${r.level} — ${"★".repeat(r.stars)}${"☆".repeat(3 - r.stars)}`, `Trứng cứu: ${r.eggs}/${r.eggsTotal}`, `Số viên đã bắn: ${r.fired}`,
        !r.record && r.prev ? `Kỷ lục màn: ${fmt(r.prev)}` : `Chuỗi lớn nhất: ${r.chain}`];
      tagline = r.last ? "Phá đảo 12 màn! Khủng long gọi bằng má rồi."
        : r.record ? "Kỷ lục mới! Bắn đâu trúng đó, trứng nở rần rần."
        : r.stars === 3 ? "3 sao gọn gàng, khủng long mẹ cảm ơn rối rít!"
        : "Qua màn rồi, nhưng sao còn thiếu — ai làm 3 sao thử coi?";
    } else if (r.free) {
      lines = [`Chế độ: Tự do`, `Số viên đã bắn: ${r.fired}`, `Dọn sạch bàn: ${r.refills} lần`, `Thời gian: ${fmtTime(r.time)}`];
      tagline = r.record ? "Kỷ lục tự do mới! Bóng nổ như pháo Tết." : r.refills >= 2 ? "Dọn bàn liền tay, chỉ thiếu chút may!" : "Bóng tràn xuống rồi, bắn lại nào!";
    } else {
      lines = [`Màn: ${r.level}`, `Trứng cứu: ${r.eggs}/${r.eggsTotal}`, `Số viên đã bắn: ${r.fired}`, r.prev ? `Kỷ lục màn: ${fmt(r.prev)}` : `Thời gian: ${fmtTime(r.time)}`];
      tagline = r.eggsTotal - r.eggs <= 1 ? "Còn đúng một trứng nữa thôi, tức ghê!" : r.line ? "Bóng chạm vạch đỏ, khủng long mẹ khóc ròng!" : "Hết viên rồi, trứng vẫn đang chờ cứu!";
    }
    shareResult({ game: "ban-bong", title, lines, tagline });
  }

  // ---------- Màn phủ / menu ----------
  const show = (e) => { e.hidden = false; root.classList.add("is-ov"); };
  const hide = (e) => { e.hidden = true; if (!anyOverlay()) root.classList.remove("is-ov"); };
  const anyOverlay = () => !ov.menu.hidden || !ov.win.hidden || !ov.lose.hidden;
  const savedMatches = (pick) => { const gm = save.game; return !!gm && (pick === "free" ? gm.mode === "free" : gm.mode === "level" && gm.level === pick); };

  function renderMenu() {
    const box = $("lvs");
    let html = "";
    for (let i = 1; i <= L.LEVELS.length; i++) {
      const lock = i > save.unlocked, st = save.stars[i] || 0;
      html += `<button class="lvb${lock ? " lock" : ""}${save.sel === i ? " on" : ""}" type="button" role="radio" aria-checked="${save.sel === i}" data-lv="${i}" ${lock ? 'aria-disabled="true"' : ""} aria-label="Màn ${i}${lock ? " (chưa mở)" : `, ${st} sao`}">
        <b>${lock ? "🔒" : i}</b><span class="st">${[0, 1, 2].map((j) => `<i class="${j < st ? "on" : ""}"></i>`).join("")}</span></button>`;
    }
    html += `<button class="lvb free${save.sel === "free" ? " on" : ""}" type="button" role="radio" aria-checked="${save.sel === "free"}" data-lv="free"><b>∞ Tự do</b><small>Kỷ lục ${fmt(save.freeBest)}</small></button>`;
    box.innerHTML = html;
    const p = save.sel;
    if (p === "free") $("pick").innerHTML = `<b>Chế độ tự do</b> — không giới hạn viên, dọn sạch bàn được +500 và bàn mới. Trụ càng lâu càng nhiều điểm!`;
    else {
      const info = L.levelInfo(p);
      const extra = [info.stones ? `${info.stones} đá` : "", info.bombs ? `${info.bombs} bom` : ""].filter(Boolean).join(", ");
      $("pick").innerHTML = `<b>Màn ${p}</b> · cứu <b>${info.eggs}</b> <i class="ic" style="background-image:url(${S.url.eggPlain})"></i> · ${info.shots} viên · ${info.kinds} màu${extra ? " · " + extra : ""}${save.best[p] ? ` · kỷ lục ${fmt(save.best[p])}` : ""}`;
    }
    const resume = savedMatches(p);
    $("playBtn").textContent = resume ? "▶ Chơi tiếp" : p === "free" ? "▶ Chơi tự do" : `▶ Chơi màn ${p}`;
    $("freshBtn").hidden = !resume;
  }
  function showMenu() {
    if (destroyed) return;
    hide(ov.win); hide(ov.lose);
    if (s && s.status !== "playing") s = null;
    persist();
    renderMenu();
    show(ov.menu);
    $("playBtn").focus({ preventScroll: true });
  }
  function start(fresh = false, pick = save.sel) {
    gen++;
    for (const t of timers) clearTimeout(t);
    timers.clear();
    save.sel = pick;
    let gm = null;
    if (!fresh && savedMatches(pick)) gm = L.deserialize(save.game);
    if (!gm) gm = L.newGame({ mode: pick === "free" ? "free" : "level", level: pick === "free" ? 1 : pick, seed: (seedBase + 7919 * games++) | 0 });
    s = gm; vg = s; fly = null; pending = null; fx = []; pushAnim = null; shakeT = 0; eggsShown = -1;
    aim = Math.PI / 2;
    board.querySelectorAll(".banner").forEach((e) => e.remove());
    hide(ov.menu); hide(ov.win); hide(ov.lose);
    hud(); persist();
    sfx.play("qua-man", 0.5); // vào ván có tiếng như Ghép Kẹo
    stage.focus({ preventScroll: true });
    return s;
  }

  // ---------- Âm thanh ----------
  function showMute() {
    const m = !!sdk.sound.muted;
    root.querySelectorAll(".muteIc").forEach((i) => { i.src = "assets/ui/" + (m ? "icon-am-thanh-tat.png" : "icon-am-thanh-bat.png"); });
    setText("muteTx", m ? "Âm thanh: tắt" : "Âm thanh: bật");
    $("muteBtn").setAttribute("aria-pressed", String(m));
  }
  function toggleMute() {
    sdk.sound.muted = !sdk.sound.muted;
    try { localStorage.setItem("wgp.muted", sdk.sound.muted ? "1" : "0"); } catch { /* bỏ qua */ }
    showMute(); sfx.unlock();
  }

  // ---------- Chuột / chạm ----------
  function toUnits(e) { const r = board.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * L.W, ((e.clientY - r.top) / r.height) * L.FH]; }
  function aimTo(x, y) {
    let a = Math.atan2(L.LY - y, x - L.LX);
    if (y > L.LY - 0.2) a = x < L.LX ? L.MAX_A : L.MIN_A; // dưới bệ: kẹp sát góc
    aim = L.clampAngle(a);
  }
  const onLauncher = (x, y) => Math.hypot(x - L.LX, y - L.LY) < 0.85 || Math.hypot(x - NEXT_X, y - NEXT_Y) < 0.8;
  let ptr = null;
  function onDown(e) {
    if (!s || anyOverlay() || e.button > 0) return;
    e.preventDefault();
    sfx.unlock();
    lastType = e.pointerType || "mouse";
    const [x, y] = toUnits(e);
    ptr = { id: e.pointerId, sx: e.clientX, sy: e.clientY, swap: onLauncher(x, y), moved: false };
    try { board.setPointerCapture(e.pointerId); } catch { /* bỏ qua */ }
    if (lastType !== "mouse") { touching = true; if (!ptr.swap) aimTo(x, y); guide = !ptr.swap; }
  }
  function onMove(e) {
    lastType = e.pointerType || "mouse";
    const [x, y] = toUnits(e);
    if (ptr && e.pointerId === ptr.id && Math.hypot(e.clientX - ptr.sx, e.clientY - ptr.sy) > 10) ptr.moved = true;
    if (lastType === "mouse") { guide = true; if (!onLauncher(x, y) || ptr) aimTo(x, y); board.style.cursor = onLauncher(x, y) ? "pointer" : "crosshair"; }
    else if (ptr && e.pointerId === ptr.id && (!ptr.swap || ptr.moved)) { guide = true; aimTo(x, y); }
  }
  function onUp(e) {
    if (!ptr || e.pointerId !== ptr.id) return;
    const p = ptr; ptr = null;
    const [x, y] = toUnits(e);
    if (e.pointerType !== "mouse") { touching = false; guide = false; }
    if (p.swap && !p.moved) { swap(); return; }
    if (x < 0 || x > L.W || y < 0) return;
    if (e.pointerType !== "mouse" && y > L.LY - 0.6) { banner("Đã hủy bắn"); return; } // kéo xuống dưới bệ = hủy
    if (e.pointerType === "mouse" && y > L.LY + 0.2) return;
    aimTo(x, y);
    fire(aim);
  }
  function onCancel() { ptr = null; touching = false; if (lastType !== "mouse") guide = false; }
  board.addEventListener("pointerdown", onDown);
  board.addEventListener("pointermove", onMove);
  board.addEventListener("pointerup", onUp);
  board.addEventListener("pointercancel", onCancel);
  board.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse" && !ptr) guide = true; });
  board.addEventListener("contextmenu", (e) => e.preventDefault());

  // ---------- Bàn phím ----------
  function onKey(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === "m") { toggleMute(); e.preventDefault(); return; }
    if (k === "escape") { if (!ov.menu.hidden) { if (s) { hide(ov.menu); stage.focus({ preventScroll: true }); } } else if (!pending) showMenu(); e.preventDefault(); return; }
    if (anyOverlay() || !s) return;
    const step = (e.shiftKey ? 0.5 : 2) * Math.PI / 180;
    if (k === "arrowleft" || k === "a") { aim = L.clampAngle(aim + step); guide = true; e.preventDefault(); }
    else if (k === "arrowright" || k === "d") { aim = L.clampAngle(aim - step); guide = true; e.preventDefault(); }
    else if (k === " " || k === "arrowup" || k === "enter" || k === "w") { if (!e.repeat) fire(aim); e.preventDefault(); }
    else if (k === "x" || k === "arrowdown" || k === "s") { swap(); e.preventDefault(); }
  }
  document.addEventListener("keydown", onKey);

  // ---------- Nút ----------
  $("lvs").addEventListener("click", (e) => {
    const b = e.target.closest(".lvb");
    if (!b || b.classList.contains("lock")) return;
    save.sel = b.dataset.lv === "free" ? "free" : +b.dataset.lv;
    persist(); renderMenu();
    $("lvs").querySelector(`[data-lv="${save.sel}"]`)?.focus({ preventScroll: true });
  });
  $("lvs").addEventListener("dblclick", (e) => { const b = e.target.closest(".lvb"); if (b && !b.classList.contains("lock")) start(false); });
  $("playBtn").addEventListener("click", () => start(false));
  $("freshBtn").addEventListener("click", () => start(true));
  $("nextBtn").addEventListener("click", () => start(true, Math.min(L.LEVELS.length, (s ? s.level : save.sel) + 1)));
  $("replayBtn").addEventListener("click", () => start(true, s ? (s.mode === "free" ? "free" : s.level) : save.sel));
  $("retryBtn").addEventListener("click", () => start(true, s ? (s.mode === "free" ? "free" : s.level) : save.sel));
  $("menuBtn").addEventListener("click", () => { if (!pending) showMenu(); });
  $("menuBtnW").addEventListener("click", showMenu);
  $("menuBtnL").addEventListener("click", showMenu);
  $("shareBtnW").addEventListener("click", shareRun);
  $("shareBtnL").addEventListener("click", shareRun);
  $("swapBtn").addEventListener("click", () => { swap(); hud(); stage.focus({ preventScroll: true }); });
  $("muteBtn").addEventListener("click", toggleMute);
  $("muteBtn2").addEventListener("click", toggleMute);
  root.querySelectorAll(".how .ic").forEach((e) => { e.style.backgroundImage = `url(${S.url[e.dataset.ic]})`; });

  // ---------- Vòng lặp ----------
  function frameLoop(now) {
    if (destroyed) return;
    const dt = Math.min(0.05, (now - last) / 1000) / speed; last = now;
    clock += dt;
    if (fly) {
      const before = fly.d;
      fly.d = Math.min(fly.len, fly.d + FLY_SPEED * dt);
      // tiếng nảy tường
      let acc = 0;
      for (let j = 0; j < fly.segs.length - 1; j++) { acc += fly.segs[j]; if (before < acc && fly.d >= acc) sfx.play("do-xuc-xac", 0.25, 1.6); }
      if (fly.d >= fly.len) land(fly);
    }
    for (const e of fx) {
      e.t += dt;
      if (e.t < 0) continue;
      if (e.type === "drop") { e.vy += 22 * dt; e.x += e.vx * dt; e.y += e.vy * dt; }
      else if (e.type === "part") { e.vy += 9 * dt; e.x += e.vx * dt; e.y += e.vy * dt; }
      else if (e.type === "egg" && !e.done && e.t >= e.dur) { e.done = true; dinoJump = 0.5; sfx.play("trung-kim-cuong", 0.5); }
    }
    fx = fx.filter((e) => e.t < e.dur);
    if (pushAnim) { pushAnim.t += dt; if (pushAnim.t >= pushAnim.dur) pushAnim = null; }
    if (shakeT > 0) shakeT -= dt;
    if (dinoJump > 0) dinoJump = Math.max(0, dinoJump - dt);
    if (s && s.status === "playing" && !anyOverlay() && !document.hidden) {
      s.time += dt * speed;
      const sec = Math.floor(s.time);
      if (sec !== lastSec) { lastSec = sec; if (sec % 5 === 0) persist(); }
    }
    draw();
    raf = requestAnimationFrame(frameLoop);
  }
  const onVis = () => { if (document.hidden) persist(); };
  const onResize = () => layout();
  document.addEventListener("visibilitychange", onVis);
  window.addEventListener("pagehide", persist);
  window.addEventListener("resize", onResize);
  const ro = window.ResizeObserver ? new ResizeObserver(onResize) : null;
  if (ro) ro.observe(stage);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!destroyed) draw(); });

  // Khởi động: sau menu là ván đang lưu (nếu có) hoặc bàn mẫu
  {
    const gm = save.game ? L.deserialize(save.game) : null;
    vg = gm || L.newGame({ mode: "level", level: 1, seed: 20261117 });
  }
  layout();
  renderMenu(); showMute(); show(ov.menu);
  raf = requestAnimationFrame(frameLoop);

  return {
    get state() { return s; },
    get busy() { return !!fly || !!pending; },
    get flying() { return !!fly; },
    get fxCount() { return fx.length; },
    get layout() { return G; },
    get save() { return save; },
    get aim() { return aim; },
    set aim(v) { aim = L.clampAngle(v); },
    set speed(v) { speed = v; },
    sfx,
    fire, swap, start, showMenu, toggleMute,
    resync() { vg = s; hud(); draw(); }, // dùng cho test: vẽ lại sau khi sửa bàn trực tiếp
    // tọa độ màn hình của một điểm trong sân (đơn vị bóng)
    toScreen(x, y) { const r = board.getBoundingClientRect(); return { x: r.left + (x / L.W) * r.width, y: r.top + (y / L.FH) * r.height }; },
    cellScreen(i) { const [x, y] = centerP(s.par, i); return this.toScreen(x, y); },
    destroy() {
      destroyed = true; gen++; cancelAnimationFrame(raf);
      for (const t of timers) clearTimeout(t);
      document.removeEventListener("keydown", onKey); document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("resize", onResize); window.removeEventListener("pagehide", persist);
      if (ro) ro.disconnect(); sfx.close();
    },
  };
}
