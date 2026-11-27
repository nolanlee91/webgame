// Ghép Kẹo — phần hiển thị + điều khiển. Luật nằm ở logic.js (không đụng DOM).
// Kẹo thường và kẹo đặc biệt được vẽ bằng Canvas, với hình riêng cho từng màu.
import * as L from "./logic.js";
import { shareResult } from "../_shared/share.js?v=s3";

const SAVE_KEY = "wgp.ghep-keo.v1";
const IDLE_HINT = 6; // giây không thao tác thì tự gợi ý

// [nền, sáng, tối] theo bảng màu Art Bible V5
const PAL = [
  ["#e0483d", "#ff8a7a", "#8e2219"], // đỏ — tim
  ["#e8954a", "#ffc58a", "#8a4a14"], // cam — lát cam
  ["#ffc94a", "#fff0a8", "#a8740e"], // vàng — sao
  ["#3f9a45", "#7fd47f", "#1d5222"], // lá — kẹo xoắn
  ["#3a7bd5", "#8ab8ff", "#1a3f7a"], // xanh dương — giọt
  ["#8a5cc2", "#c8a4f0", "#4a2a72"], // tím — chùm nho
];
const KIND_NAME = ["kẹo đỏ", "kẹo cam", "kẹo vàng", "kẹo xanh lá", "kẹo xanh dương", "kẹo tím"];
const RAINBOW = ["#e0483d", "#e8954a", "#ffc94a", "#3f9a45", "#3a7bd5", "#8a5cc2"];
const OUT = "#160d0a";

// ---------- Sprite ----------
// Kẹo 20×20 cùng bộ với ảnh bìa: tim đỏ, lát cam, sao vàng, kẹo xoắn xanh lá, giọt xanh dương, chùm nho tím
// (mỗi màu một hình riêng — người mù màu vẫn phân biệt được). Đổ bóng khối 5 bậc, viền 1px, điểm loá trên-trái.
const N = 20, C = 9.5;
const TONES = [
  ["#ffd0c4", "#ff8a7a", "#e0483d", "#8e2219", "#5a120c"],
  ["#ffe6c4", "#ffb060", "#e8954a", "#a8541a", "#552a08"],
  ["#fff6d0", "#ffe08a", "#f2b632", "#a8740e", "#6a4606"],
  ["#d4f6c0", "#8fdc7a", "#3fae4a", "#17521c", "#0c3410"],
  ["#d4e6ff", "#8ab8ff", "#3a7bd5", "#163a73", "#0c2248"],
  ["#eedcff", "#c8a4f0", "#8a5cc2", "#3e2268", "#26123f"],
];
const inPoly = (pts, x, y) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
const STAR_PTS = Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 5.3 : 10.6; return [C + Math.cos(a) * r, 10.9 + Math.sin(a) * r]; });
const GRAPES = [[5.2, 8.4, 3.4], [9.8, 8.2, 3.4], [14.4, 8.6, 3.3], [7.4, 12.6, 3.4], [12.2, 12.8, 3.4], [9.8, 16.4, 3.1]];
const SHAPES = [
  (x, y) => { const u = (x - C) / 8.1, v = -(y - 10.4) / 8.1; return (u * u + v * v - 1) ** 3 - u * u * v * v * v <= 0; }, // tim
  (x, y) => (x - C) ** 2 + (y - C) ** 2 <= 9.3 ** 2,                                                                    // lát cam
  (x, y) => inPoly(STAR_PTS, x + 0.5, y + 0.5),                                                                          // sao
  (x, y) => (x - C) ** 2 + (y - C) ** 2 <= 8.9 ** 2,                                                                    // kẹo xoắn
  (x, y) => (y >= 10 && (x - C) ** 2 + (y - 11.8) ** 2 <= 7.9 ** 2) || (y >= 0 && y < 12 && Math.abs(x - C) <= (y + 0.2) * 0.72), // giọt
  (x, y) => GRAPES.some(([gx, gy, r]) => (x - gx) ** 2 + (y - gy) ** 2 <= r * r) || (y >= 1 && y <= 4 && x >= 9 && x <= 14 && Math.abs(y - 2.5 + (x - 11.5) * 0.35) <= 1.4), // nho + lá
];
const mixc = (a, b, t) => "#" + [1, 3, 5].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, "0")).join("");
// bậc sáng của khối cầu tâm (cx,cy) bán kính r: 0 loá … 4 bóng sâu (dải chuyển bằng hạt so le)
function sphereTone(x, y, cx, cy, r) {
  const nx = (x - cx) / r, ny = (y - cy) / r, rr = Math.min(1, Math.hypot(nx, ny)), nz = Math.sqrt(1 - rr * rr);
  const d = -0.45 * nx - 0.55 * ny + 0.7 * nz, ch = (x + y) & 1;
  if (d > 0.93) return 0; if (d > 0.88) return ch ? 0 : 1; if (d > 0.7) return 1; if (d > 0.64) return ch ? 1 : 2;
  if (d > 0.3) return 2; if (d > 0.22) return ch ? 2 : 3; if (d > -0.05) return 3; return 4;
}
// Các viên thường dùng mặt kẹo bóng với viền cùng tông. Sáu hình giữ silhouette riêng.
const CANDY_SHAPES = [
  "M32 54C27 46 8 38 8 23C8 9 24 6 32 18C40 6 56 9 56 23C56 38 37 46 32 54Z",
  "M32 7A25 25 0 1 1 32 57A25 25 0 1 1 32 7Z",
  "M32 5L40 22L59 25L45 39L49 58L32 48L15 58L19 39L5 25L24 22Z",
  "M32 7A25 25 0 1 1 32 57A25 25 0 1 1 32 7Z",
  "M32 5C38 16 54 28 54 40A22 20 0 1 1 10 40C10 28 26 16 32 5Z",
];
function regularCandy(k) {
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const g = c.getContext("2d");
  g.lineJoin = "round";
  function glaze(shape, tones, bounds) {
    const [x, y, width, height] = bounds;
    const light = g.createLinearGradient(x + width * .18, y, x + width * .78, y + height);
    [0, .28, .51, .87, 1].forEach((stop, i) => light.addColorStop(stop, tones[i]));
    g.fillStyle = light; g.fill(shape);
    g.lineWidth = 2.6; g.strokeStyle = tones[4]; g.stroke(shape);
  }
  if (k === 5) {
    g.fillStyle = "#90cf76";
    g.fill(new Path2D("M30 15Q30 5 49 5Q43 16 30 18Z"));
    for (const [x, y] of [[22,24],[42,24],[15,37],[32,38],[49,37],[24,49],[40,49],[32,57]]) {
      const berry = new Path2D();
      berry.arc(x,y,8,0,Math.PI*2);
      glaze(berry,TONES[k],[x-8,y-8,16,16]);
    }
    return c.toDataURL();
  }
  const shape = new Path2D(CANDY_SHAPES[k]);
  glaze(shape,TONES[k],[6,6,52,52]);
  g.save();
  g.clip(shape);
  if (k === 1) {
    g.strokeStyle = "#ffe0ad"; g.lineWidth = 2;
    g.beginPath(); g.arc(32,32,20,0,Math.PI*2); g.stroke();
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      g.beginPath(); g.moveTo(32,32); g.lineTo(32 + 19*Math.cos(a),32 + 19*Math.sin(a)); g.stroke();
    }
  } else if (k === 3) {
    g.strokeStyle = "#c8f3a4"; g.lineWidth = 4; g.lineCap = "round";
    g.stroke(new Path2D("M34 33C34 26 23 28 25 37C28 48 45 47 48 33C51 19 35 12 24 16"));
  }
  g.strokeStyle = "#fff9e1b0"; g.lineCap = "round"; g.lineWidth = 3.5;
  g.stroke(new Path2D("M15 25Q19 15 28 14"));
  g.restore();
  return c.toDataURL();
}
const spriteCache = new Map();
function sprite(k, sp) {
  const key = k + ":" + (sp || "");
  if (spriteCache.has(key)) return spriteCache.get(key);
  if (!sp && k !== L.STAR) {
    const url = regularCandy(k);
    spriteCache.set(key, url);
    return url;
  }
  const c = document.createElement("canvas"); c.width = c.height = N;
  const g = c.getContext("2d");
  const star = k === L.STAR;
  const shape = star ? SHAPES[1] : SHAPES[k];
  const m = (x, y) => x >= 0 && y >= 0 && x < N && y < N && shape(x, y);
  const edge = (x, y) => m(x, y) && (!m(x - 1, y) || !m(x + 1, y) || !m(x, y - 1) || !m(x, y + 1));
  const inner = (x, y) => m(x, y) && !edge(x, y);
  const T = star ? null : TONES[k];
  const px = (x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (!m(x, y)) continue;
    if (edge(x, y)) { px(x, y, sp === "b" ? "#ffc94a" : OUT); continue; }
    let t, col;
    const rr = Math.hypot(x - C, y - C) / 9.3, ang = Math.atan2(y - C, x - C);
    if (star) { // kẹo sao cầu vồng: lát màu theo góc + khối cầu
      const base = RAINBOW[Math.floor(((ang + Math.PI) / (Math.PI * 2)) * 6 + 0.5) % 6];
      t = sphereTone(x, y, C, C, 9.3);
      col = t === 0 ? "#ffffff" : t === 1 ? mixc(base, "#ffffff", 0.45) : t === 2 ? base : t === 3 ? mixc(base, "#000000", 0.4) : mixc(base, "#000000", 0.62);
    } else if (k === 5) { // nho: mỗi quả một khối cầu; lá xanh ở trên
      const gp = GRAPES.find(([gx, gy, r]) => (x - gx) ** 2 + (y - gy) ** 2 <= r * r);
      if (!gp) col = (x + y) & 1 ? "#3fae4a" : "#8fdc7a";
      else {
        t = sphereTone(x, y, gp[0], gp[1], gp[2]); col = T[t];
        if (GRAPES.some((q) => q !== gp && q[1] < gp[1] && (x - q[0]) ** 2 + (y - q[1]) ** 2 <= (q[2] + 1) ** 2)) col = T[Math.min(4, t + 1)]; // bóng quả trên đổ xuống
      }
    } else if (k === 1) { // lát cam: vỏ, cùi trắng, múi
      t = sphereTone(x, y, C, C, 9.3);
      if (rr > 0.8) col = T[Math.max(1, Math.min(4, t + 1))];
      else if (rr > 0.68) col = t >= 3 ? "#e8d4b0" : "#fff4e0";
      else {
        const seg = ((ang + Math.PI) / (Math.PI / 4)) % 1;
        col = seg < 0.16 || seg > 0.9 || rr < 0.12 ? (t >= 3 ? "#f0d0a0" : "#fff0d0") : t <= 1 ? "#ffc58a" : t === 2 ? "#ffa850" : "#e8954a";
      }
    } else if (k === 3) { // kẹo xoắn: khối cầu xanh + dải xoắn sáng
      t = sphereTone(x, y, C, C, 8.9);
      const sw = ((ang + Math.PI) / (Math.PI * 2) + rr * 1.6) % 1;
      col = sw < 0.34 && rr > 0.12 ? (t <= 1 ? "#f0ffe0" : t === 2 ? "#bff0a0" : "#8fdc7a") : T[t];
    } else { // tim / sao / giọt: khối cầu + gờ sáng/tối theo mép
      const cy = k === 4 ? 11.8 : k === 0 ? 9.4 : 10.9, r = k === 2 ? 9.4 : k === 4 ? 9 : 8.6;
      t = sphereTone(x, y, C, cy, r);
      if (!inner(x - 1, y - 1) && t > 1) t = 1;
      if (!inner(x + 1, y + 1) && t < 3) t = 3;
      col = T[t];
    }
    if (sp === "h" && (y === 6 || y === 7 || y === 12 || y === 13)) col = (x + y) % 2 ? "#fff4e0" : "#ffe9c9";
    if (sp === "v" && (x === 6 || x === 7 || x === 12 || x === 13)) col = (x + y) % 2 ? "#fff4e0" : "#ffe9c9";
    px(x, y, col);
  }
  if (star) {
    for (const [x, y] of [[9, 5], [10, 5], [9, 6], [10, 6], [9, 7], [10, 7], [6, 8], [7, 8], [8, 8], [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [8, 9], [9, 9], [10, 9], [11, 9], [8, 10], [9, 10], [10, 10], [11, 10], [7, 11], [8, 11], [11, 11], [12, 11], [7, 12], [12, 12]]) px(x, y, "#fff4e0");
  } else if (sp === "b") {
    for (let y = 7; y <= 12; y++) for (let x = 7; x <= 12; x++) if ((x - 9.5) ** 2 + (y - 9.5) ** 2 <= 7.2) px(x, y, OUT);
    px(8, 8, "#5e544a"); px(11, 7, "#c8a070"); px(12, 6, "#ffc94a"); px(13, 5, "#fff4e0");
  }
  // điểm loá trắng góc trên trái
  const hl = k === 4 ? [[7, 9], [7, 10], [8, 9]] : k === 2 ? [[8, 7], [9, 6], [8, 8]] : k === 5 ? [[4, 7], [5, 7], [4, 8]] : [[5, 5], [6, 5], [5, 6], [6, 4]];
  for (const [x, y] of hl) if (inner(x, y) && !(sp === "h" && (y === 6 || y === 7)) && !(sp === "v" && (x === 6 || x === 7))) px(x, y, "#fffbef");
  const url = c.toDataURL();
  spriteCache.set(key, url);
  return url;
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

export function mount(root, ctx = {}) {
  const sdk = ctx.sdk || { reportScore() {}, gameOver() {}, sound: { muted: false } };
  if (!sdk.sound) sdk.sound = { muted: false };
  const $ = (id) => root.querySelector("#" + id);
  const stage = $("stage"), frame = $("frame"), board = $("board");
  const ov = { menu: $("ovMenu"), win: $("ovWin"), lose: $("ovLose") };
  const sfx = makeSfx("assets/sfx/", ["buoc-nhay", "do-xuc-xac", "het-gio", "no-tnt", "qua-man", "thang", "thua", "trung-da", "trung-kim-cuong"], sdk);
  let save = loadSave();
  let s = null, destroyed = false, busy = false, gen = 0, speed = 1;
  let seedBase = ctx.seed ?? (Date.now() & 0xffffff), games = 0;
  const els = new Map(); // id → phần tử kẹo
  let sel = -1, cur = -1, hintPair = null, idle = 0, raf = 0, last = performance.now(), lastSec = -1;
  let view = { score: 0, goals: [] }; // số liệu đang hiện trên HUD (chạy theo từng vòng nổ)
  let G = { cs: 50, bw: 400 };
  const timers = new Set();

  const wait = (ms) => new Promise((res) => { const t = setTimeout(() => { timers.delete(t); res(); }, ms * speed); timers.add(t); });

  // ---------- Lưu ----------
  function persist() {
    try {
      if (s && s.status === "playing") save.game = L.serialize(s);
      else if (s) save.game = null;
      localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    } catch { /* hết chỗ / chế độ riêng tư */ }
  }

  // ---------- Bố cục: bàn vuông to nhất vừa khung ----------
  function layout() {
    const r = stage.getBoundingClientRect();
    const ht = $("hintTx"), hintH = ht && getComputedStyle(ht).display !== "none" ? 24 : 0;
    const insetTop = parseFloat(getComputedStyle(stage).paddingTop);
    const avail = Math.max(160, Math.min(r.width - 14, r.height - insetTop - 14 - hintH, 680));
    const fr = Math.max(6, Math.min(14, Math.round(avail * 0.022)));
    const cs = Math.floor((avail - 2 * fr - 18) / L.W); // khung gỗ + viền gậy kẹo dày thêm 6px mỗi bên
    G = { cs, bw: cs * L.W };
    frame.style.setProperty("--fr", fr + "px");
    board.style.setProperty("--cs", cs + "px");
    board.style.setProperty("--bw", G.bw + "px");
    board.style.setProperty("--pp", Math.max(3, Math.round(cs / 9)) + "px");
  }

  // ---------- Kẹo ----------
  function setPos(el, at, yOff = 0) { el.dataset.at = at; el.style.setProperty("--x", L.X(at)); el.style.setProperty("--y", L.Y(at) - yOff); }
  function decorate(el, c) {
    el.dataset.k = c.k; el.dataset.sp = c.sp || "";
    el.firstChild.style.backgroundImage = `url(${sprite(c.k, c.sp)})`;
    el.classList.toggle("sb", c.sp === "b");
    el.classList.toggle("ss", c.k === L.STAR);
    el.setAttribute("aria-label", c.k === L.STAR ? "kẹo sao" : KIND_NAME[c.k] + (c.sp === "h" ? " sọc ngang" : c.sp === "v" ? " sọc dọc" : c.sp === "b" ? " bom" : ""));
  }
  function makeEl(c, at, yOff = 0, cls = "") {
    const el = document.createElement("div");
    el.className = "ck" + (cls ? " " + cls : "");
    el.dataset.id = c.id;
    el.setAttribute("role", "gridcell");
    const sp = document.createElement("div"); sp.className = "sp"; el.appendChild(sp);
    decorate(el, c);
    setPos(el, at, yOff);
    board.appendChild(el);
    els.set(c.id, el);
    return el;
  }
  function syncAll() {
    board.querySelectorAll(".ck,.part,.beam,.ring,.float,.banner").forEach((e) => e.remove());
    els.clear();
    if (s) s.cells.forEach((c, i) => makeEl(c, i));
    marks();
  }
  const elAt = (i) => (s && s.cells[i] ? els.get(s.cells[i].id) : null);
  function marks() {
    board.querySelectorAll(".ck.sel,.ck.cur,.ck.hint").forEach((e) => e.classList.remove("sel", "cur", "hint"));
    if (!s) return;
    if (sel >= 0) elAt(sel)?.classList.add("sel");
    if (cur >= 0) elAt(cur)?.classList.add("cur");
    if (hintPair) for (const i of hintPair) elAt(i)?.classList.add("hint");
  }

  // ---------- Hiệu ứng ----------
  function particles(at, k, n = 4) {
    const col = k === L.STAR ? RAINBOW : PAL[k] || PAL[0];
    for (let j = 0; j < n; j++) {
      const p = document.createElement("div");
      p.className = "part";
      const a = Math.random() * Math.PI * 2, d = G.cs * (0.5 + Math.random() * 0.6);
      p.style.left = (L.X(at) + 0.45) * G.cs + "px"; p.style.top = (L.Y(at) + 0.45) * G.cs + "px";
      p.style.background = col[j % col.length];
      p.style.setProperty("--dx", Math.cos(a) * d + "px"); p.style.setProperty("--dy", Math.sin(a) * d + "px");
      board.appendChild(p);
      setTimeout(() => p.remove(), 420);
    }
  }
  function fxEl(cls, x, y, w, h, extra = {}) {
    const e = document.createElement("div");
    e.className = cls;
    Object.assign(e.style, { left: x + "px", top: y + "px", width: w + "px", height: h + "px" });
    for (const [k, v] of Object.entries(extra)) e.style.setProperty(k, v);
    board.appendChild(e);
    setTimeout(() => e.remove(), 400);
  }
  function drawFx(f) {
    const cs = G.cs, x = L.X(f.at), y = L.Y(f.at), bw = G.bw;
    if (f.type === "h") fxEl("beam", 0, (y + 0.32) * cs, bw, cs * 0.36, { "--sy": 0.1 });
    else if (f.type === "v") fxEl("beam", (x + 0.32) * cs, 0, cs * 0.36, bw, { "--sx": 0.1 });
    else if (f.type === "h3") fxEl("beam", 0, (y - 1) * cs, bw, cs * 3, { "--sy": 0.1 });
    else if (f.type === "v3") fxEl("beam", (x - 1) * cs, 0, cs * 3, bw, { "--sx": 0.1 });
    else if (f.type === "b") fxEl("ring", (x - 1) * cs, (y - 1) * cs, cs * 3, cs * 3);
    else if (f.type === "b2") fxEl("ring", (x - 2) * cs, (y - 2) * cs, cs * 5, cs * 5);
    else if (f.type === "star") fxEl("ring", (x - 1.5) * cs, (y - 1.5) * cs, cs * 4, cs * 4);
    else if (f.type === "star2") fxEl("ring", 0, 0, bw, bw);
  }
  function floatText(text, at, big) {
    const e = document.createElement("div");
    e.className = "float" + (big ? " big" : "");
    e.textContent = text;
    e.style.setProperty("--fx", (L.X(at) + 0.1) * G.cs + "px");
    e.style.setProperty("--fy", (L.Y(at) + 0.2) * G.cs + "px");
    board.appendChild(e);
    setTimeout(() => e.remove(), 800);
  }
  function banner(text) {
    board.querySelectorAll(".banner").forEach((e) => e.remove());
    const e = document.createElement("div");
    e.className = "banner"; e.textContent = text;
    board.appendChild(e);
    setTimeout(() => e.remove(), 1150);
  }
  function shake() { board.classList.remove("shake"); void board.offsetWidth; board.classList.add("shake"); }

  // ---------- HUD ----------
  const setText = (id, t) => { const e = $(id); if (e && e.textContent !== String(t)) e.textContent = t; };
  function goalIcons(goals, done) {
    return goals.map((g) => `<span class="goal${g.left <= 0 ? " done" : ""}" data-k="${g.k}"><i style="background-image:url(${sprite(g.k, 0)})"></i><b>${done ? g.left : g.left}</b></span>`).join("");
  }
  function hud() {
    if (!s) return;
    const lvMode = s.mode === "level";
    setText("hMovesL", lvMode ? "Còn bước" : "Đã đi");
    setText("hMoves", lvMode ? s.movesLeft : s.moves);
    $("movesBox").classList.toggle("low", lvMode && s.movesLeft <= 5);
    setText("hLevel", lvMode ? `${s.level} / ${L.LEVELS.length}` : "Tự do");
    setText("hScoreL", lvMode ? `Điểm · mục tiêu ${fmt(s.target)}` : `Điểm · kỷ lục ${fmt(Math.max(save.freeBest, view.score))}`);
    setText("hScore", fmt(view.score));
    $("hBar").hidden = !lvMode;
    if (lvMode) {
      const top = s.target * L.STAR_RATIO[2];
      $("hFill").style.setProperty("--p", Math.min(1, view.score / top).toFixed(3));
      root.querySelectorAll("#hBar .tick").forEach((t, j) => t.classList.toggle("on", view.score >= s.target * L.STAR_RATIO[j]));
    }
    $("goalsBox").hidden = !view.goals.length;
    const gEl = $("hGoals");
    const sig = view.goals.map((g) => g.k + ":" + g.left).join(",");
    if (gEl.dataset.sig !== sig) {
      const prev = gEl.dataset.sig ? Object.fromEntries(gEl.dataset.sig.split(",").map((p) => p.split(":").map(Number))) : {};
      gEl.innerHTML = goalIcons(view.goals);
      gEl.dataset.sig = sig;
      gEl.querySelectorAll(".goal").forEach((e) => { const k = +e.dataset.k; if (prev[k] !== undefined && prev[k] !== view.goals.find((g) => g.k === k).left) e.classList.add("bump"); });
    }
    $("hintBtn").disabled = s.status !== "playing";
  }
  function syncView() { view = { score: s ? s.score : 0, goals: s ? s.goals.map((g) => ({ k: g.k, left: g.left })) : [] }; }

  // ---------- Một nước đi ----------
  async function trySwap(a, b) {
    if (!s || s.status !== "playing" || busy || anyOverlay() || !L.adjacent(a, b)) return false;
    sfx.unlock();
    sel = -1; hintPair = null; idle = 0; marks();
    const my = gen;
    busy = true;
    const A = elAt(a), B = elAt(b);
    const ok = L.validSwap(s.cells, a, b);
    for (const e of [A, B]) { e.style.setProperty("--t", 150 * speed + "ms"); e.style.zIndex = 2; }
    setPos(A, b); setPos(B, a);
    sfx.play("buoc-nhay", 0.5, ok ? 1.15 : 0.85);
    await wait(160);
    if (my !== gen || destroyed) return false;
    if (!ok) {
      setPos(A, a); setPos(B, b);
      await wait(160);
      if (my !== gen || destroyed) return false;
      for (const e of [A, B]) { e.style.zIndex = ""; e.style.removeProperty("--t"); }
      shake(); sfx.play("do-xuc-xac", 0.35, 1.4);
      busy = false; marks();
      return false;
    }
    for (const e of [A, B]) e.style.zIndex = "";
    const before = s.movesLeft;
    const res = L.swap(s, a, b);
    hud(); // số bước giảm ngay
    if (s.mode === "level" && before > 3 && s.movesLeft <= 3 && s.movesLeft > 0) sfx.play("het-gio", 0.5);
    await playRounds(res, my);
    if (my !== gen || destroyed) return true;
    syncView(); hud();
    if (s.mode === "free" && s.score > save.freeBest) save.freeBest = s.score;
    sdk.reportScore(s.score);
    persist();
    if (res.shuffle) {
      banner("Hết nước đi — xáo bàn!"); sfx.play("do-xuc-xac", 0.6);
      await wait(500);
      if (my !== gen || destroyed) return true;
      await animShuffle(res.shuffle);
      if (my !== gen || destroyed) return true;
    }
    if (s.status === "won") await onWin(res, my);
    else if (s.status === "lost") await onLose(my);
    if (my !== gen || destroyed) return true;
    busy = false; marks();
    return true;
  }

  async function playRounds(res, my) {
    for (let ri = 0; ri < res.rounds.length; ri++) {
      const r = res.rounds[ri];
      // 1) nổ
      for (const f of r.fx) drawFx(f);
      if (r.fx.length) sfx.play("no-tnt", 0.55, r.combo ? 0.9 : 1.1);
      sfx.play("trung-da", 0.6, 1 + Math.min(ri, 6) * 0.08);
      if (r.made.length) sfx.play("trung-kim-cuong", 0.55);
      const budget = Math.max(1, Math.floor(70 / Math.max(1, r.removed.length)));
      let cx = 0, cy = 0;
      for (const rm of r.removed) {
        const e = els.get(rm.id);
        if (e) { e.classList.add("pop"); els.delete(rm.id); setTimeout(() => e.remove(), 210 * speed); }
        particles(rm.at, rm.k, Math.min(4, budget));
        cx += L.X(rm.at); cy += L.Y(rm.at);
        const g = view.goals.find((g) => g.k === rm.k); if (g && g.left > 0) g.left--;
      }
      if (r.removed.length) {
        const n = r.removed.length, at = Math.round(cy / n) * L.W + Math.round(cx / n);
        floatText("+" + fmt(r.pts), at, r.pts >= 300);
      }
      view.score += r.pts;
      hud();
      if (ri === 2) banner("Tuyệt!"); else if (ri === 4) banner("Xuất sắc!"); else if (ri === 6) banner("Thần sầu!");
      if (r.combo === "star2") banner("Quét sạch bàn!");
      await wait(200);
      if (my !== gen || destroyed) return;
      // 2) kẹo đặc biệt mới
      for (const m of r.made) makeEl(m, m.at, 0, "born");
      // 3) rơi + sinh kẹo mới từ trên
      let longest = 0;
      for (const f of r.falls) {
        const e = els.get(f.id); if (!e) continue;
        const d = L.Y(f.to) - L.Y(f.from), t = Math.round((110 + 45 * d) * speed);
        longest = Math.max(longest, t);
        e.style.setProperty("--t", t + "ms"); e.style.setProperty("--e", "cubic-bezier(.45,0,.9,.6)");
        setPos(e, f.to);
      }
      const fresh = [];
      for (const sp of r.spawns) { const c = { id: sp.id, k: sp.k, sp: 0 }; fresh.push([makeEl(c, sp.at, sp.drop + 0.2), sp]); }
      if (fresh.length) {
        void board.offsetWidth; // chốt vị trí xuất phát phía trên bàn
        for (const [e, sp] of fresh) {
          const t = Math.round((110 + 45 * (sp.drop + 0.2)) * speed);
          longest = Math.max(longest, t);
          e.style.setProperty("--t", t + "ms"); e.style.setProperty("--e", "cubic-bezier(.45,0,.9,.6)");
          setPos(e, sp.at);
        }
      }
      await wait(longest / speed + 40);
      if (my !== gen || destroyed) return;
      for (const e of els.values()) { e.style.removeProperty("--t"); e.style.removeProperty("--e"); e.classList.remove("born"); }
    }
  }

  async function animShuffle(list) {
    if (list.some((x) => x.k !== undefined)) { syncAll(); return; } // trường hợp hiếm: bàn được làm lại
    for (const { id, at } of list) { const e = els.get(id); if (e) { e.style.setProperty("--t", 380 * speed + "ms"); setPos(e, at); } }
    await wait(400);
    for (const e of els.values()) e.style.removeProperty("--t");
    marks();
  }

  async function onWin(res, my) {
    const lv = s.level;
    banner("Qua màn!");
    sfx.play("qua-man", 0.7);
    if (res.bonus) { await wait(500); if (my !== gen || destroyed) return; floatText("+" + fmt(res.bonus) + " thưởng bước", 3 * L.W + 1, true); }
    await wait(800);
    if (my !== gen || destroyed) return;
    const prevBest = save.best[lv] || 0;
    const record = s.score > prevBest;
    save.best[lv] = Math.max(prevBest, s.score);
    save.stars[lv] = Math.max(save.stars[lv] || 0, s.stars);
    if (lv < L.LEVELS.length) { save.unlocked = Math.max(save.unlocked, lv + 1); save.sel = lv + 1; }
    persist();
    sdk.gameOver({ result: "won", level: lv, score: s.score, stars: s.stars, moves: s.moves });
    root.querySelectorAll("#wStars i").forEach((e, j) => e.classList.toggle("on", j < s.stars));
    setText("wTitle", lv < L.LEVELS.length ? `Qua màn ${lv}!` : "Phá đảo 12 màn!");
    setText("wSub", s.stars === 3 ? "Hoàn hảo — đủ 3 sao!" : s.stars === 2 ? "Rất tốt! Thêm điểm để lấy đủ 3 sao." : "Qua màn rồi! Chơi lại để lấy thêm sao.");
    $("wResult").innerHTML = `<span>Điểm nổ kẹo</span><b>${fmt(s.score - s.bonus)}</b><span>Thưởng ${s.movesLeft} bước dư</span><b>+${fmt(s.bonus)}</b><span>Combo dài nhất</span><b>×${s.maxCombo}</b><span class="total">Tổng điểm</span><b>${fmt(s.score)}</b>`;
    $("wRecord").innerHTML = record && prevBest ? `<span class="record">Kỷ lục mới!</span>` : prevBest ? `<span class="sub">Kỷ lục màn: ${fmt(save.best[lv])}</span>` : "";
    $("nextBtn").hidden = lv >= L.LEVELS.length;
    lastShare = winShare(lv, record && prevBest > 0);
    show(ov.win);
    sfx.play("thang", 0.6);
    if (record && prevBest) setTimeout(() => sfx.play("trung-kim-cuong", 0.7, 1.2), 700); // kỷ lục mới
    $(lv < L.LEVELS.length ? "nextBtn" : "replayBtn").focus({ preventScroll: true });
  }

  async function onLose(my) {
    board.classList.add("dim");
    sfx.play("thua", 0.6);
    await wait(700);
    if (my !== gen || destroyed) return;
    persist();
    sdk.gameOver({ result: "lost", level: s.level, score: s.score, stars: 0, moves: s.moves });
    setText("lTitle", "Hết bước!");
    setText("lSub", `Màn ${s.level} — thử lại nhé, lần này sẽ khác!`);
    const miss = [];
    if (s.score < s.target) miss.push(`${fmt(s.target - s.score)} điểm`);
    for (const g of s.goals) if (g.left > 0) miss.push(`${g.left} <i class="gi" style="display:inline-block;width:18px;height:18px;vertical-align:-4px;background-size:100% 100%;image-rendering:pixelated;background-image:url(${sprite(g.k, 0)})"></i>`);
    $("lMiss").innerHTML = "Còn thiếu: " + miss.join(" · ");
    $("lResult").innerHTML = `<span>Điểm đạt được</span><b>${fmt(s.score)}</b><span>Mục tiêu</span><b>${fmt(s.target)}</b>`;
    lastShare = loseShare();
    show(ov.lose);
    $("retryBtn").focus({ preventScroll: true });
  }

  // ---------- Khoe kết quả (số thật của ván vừa xong, chụp lúc hiện bảng) ----------
  let lastShare = null;
  function winShare(lv, record) {
    const last = lv >= L.LEVELS.length, stars = "★".repeat(s.stars) + "☆".repeat(3 - s.stars);
    return {
      game: "ghep-keo",
      title: last ? `Phá đảo ${L.LEVELS.length} màn!` : record ? `Kỷ lục màn ${lv}: ${fmt(s.score)}` : `Qua màn ${lv} ${stars}`,
      lines: [`Tổng điểm: ${fmt(s.score)}`, `Sao: ${stars}`, `Combo dài nhất: ×${s.maxCombo}`, `Bước dư: ${s.movesLeft}`],
      tagline: last ? "12 màn kẹo ngọt đã nằm gọn trong túi!" : record ? "Phá kỷ lục chính mình, kẹo cũng phải nể." : s.stars === 3 ? "Ba sao tròn trịa, tay nghề thợ kẹo lành nghề!" : s.movesLeft >= 5 ? "Dư cả nắm bước, qua màn nhẹ như kẹo bông." : "Qua rồi! Ai chơi lấy đủ ba sao thử coi?",
      accent: "#f4c3e1",
    };
  }
  function loseShare() {
    const lack = s.target - s.score, goalsLeft = s.goals.reduce((a, g) => a + Math.max(0, g.left), 0);
    const lines = [`Điểm: ${fmt(s.score)} / ${fmt(s.target)}`];
    if (lack > 0) lines.push(`Còn thiếu: ${fmt(lack)} điểm`);
    if (goalsLeft > 0) lines.push(`Kẹo chưa thu: ${goalsLeft} viên`);
    lines.push(`Combo dài nhất: ×${s.maxCombo}`);
    const close = (lack <= 0 || lack < s.target * 0.1) && goalsLeft <= 3;
    return {
      game: "ghep-keo",
      title: `Hết bước ở màn ${s.level}`,
      lines,
      tagline: close ? "Thiếu đúng một chút xíu, ức muốn xỉu luôn!" : "Kẹo ngọt mà màn này đắng ghê, ai qua giùm coi?",
      accent: "#f4c3e1",
    };
  }
  function share() { if (lastShare) shareResult(lastShare); }

  // ---------- Gợi ý ----------
  function hint(auto = false) {
    if (!s || s.status !== "playing" || busy || anyOverlay()) return null;
    hintPair = L.findMove(s.cells);
    if (hintPair) sfx.play("buoc-nhay", auto ? 0.2 : 0.45, 1.3); // tự gợi ý khi đứng yên thì nhỏ hơn
    marks();
    return hintPair;
  }

  // ---------- Màn phủ / menu ----------
  const show = (e) => { e.hidden = false; root.classList.add("is-ov"); };
  const hide = (e) => { e.hidden = true; if (!anyOverlay()) root.classList.remove("is-ov"); };
  const anyOverlay = () => !ov.menu.hidden || !ov.win.hidden || !ov.lose.hidden;
  const savedMatches = (pick) => { const g = save.game; return !!g && (pick === "free" ? g.mode === "free" : g.mode === "level" && g.level === pick); };

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
    if (p === "free") $("pick").innerHTML = `<b>Chế độ tự do</b> — không giới hạn bước, 6 loại kẹo, chơi thoải mái.`;
    else {
      const info = L.levelInfo(p);
      const col = (info.collect || []).map(([k, n]) => `<i class="gi" style="background-image:url(${sprite(k, 0)})"></i>${n}`).join(" ");
      $("pick").innerHTML = `<b>Màn ${p}</b> · ${info.moves} bước · mục tiêu <b>${fmt(info.target)}</b> điểm${col ? " · thu " + col : ""}${save.best[p] ? ` · kỷ lục ${fmt(save.best[p])}` : ""}`;
    }
    const resume = savedMatches(p);
    $("playBtn").textContent = resume ? "▶ Chơi tiếp" : p === "free" ? "▶ Chơi tự do" : `▶ Chơi màn ${p}`;
    $("freshBtn").hidden = !resume;
  }
  function showMenu() {
    if (destroyed) return;
    if (s) sfx.play("buoc-nhay", 0.35, 0.8);
    hide(ov.win); hide(ov.lose);
    if (s && s.status !== "playing") { s = null; }
    persist();
    renderMenu();
    show(ov.menu);
    $("playBtn").focus({ preventScroll: true });
  }
  function start(fresh = false, pick = save.sel) {
    gen++; busy = false;
    for (const t of timers) clearTimeout(t);
    timers.clear();
    save.sel = pick;
    let g = null;
    if (!fresh && savedMatches(pick)) g = L.deserialize(save.game);
    if (!g) g = L.newGame({ mode: pick === "free" ? "free" : "level", level: pick === "free" ? 1 : pick, seed: (seedBase + 7919 * games++) | 0 });
    s = g;
    sel = -1; cur = -1; hintPair = null; idle = 0;
    board.classList.remove("dim", "shake");
    hide(ov.menu); hide(ov.win); hide(ov.lose);
    syncView(); syncAll(); hud(); persist();
    sfx.play("qua-man", 0.5);
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
  let drag = null;
  function cellFromEvent(e) {
    const r = board.getBoundingClientRect();
    const x = Math.floor((e.clientX - r.left) / (r.width / L.W)), y = Math.floor((e.clientY - r.top) / (r.height / L.H));
    return x >= 0 && y >= 0 && x < L.W && y < L.H ? y * L.W + x : -1;
  }
  function onDown(e) {
    if (!s || anyOverlay() || e.button > 0) return;
    const i = cellFromEvent(e);
    if (i < 0) return;
    e.preventDefault();
    sfx.unlock();
    drag = { i, x: e.clientX, y: e.clientY, id: e.pointerId, moved: false };
    try { board.setPointerCapture(e.pointerId); } catch { /* bỏ qua */ }
  }
  function onMove(e) {
    if (!drag || e.pointerId !== drag.id || drag.moved) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y, th = G.cs * 0.35;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < th) return;
    drag.moved = true;
    const i = drag.i, x = L.X(i), y = L.Y(i);
    let j = -1;
    if (Math.abs(dx) > Math.abs(dy)) j = dx > 0 ? (x < L.W - 1 ? i + 1 : -1) : x > 0 ? i - 1 : -1;
    else j = dy > 0 ? (y < L.H - 1 ? i + L.W : -1) : y > 0 ? i - L.W : -1;
    if (j >= 0) trySwap(i, j);
  }
  function onUp(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag; drag = null;
    if (d.moved || busy || !s || s.status !== "playing") return;
    const i = cellFromEvent(e);
    if (i !== d.i) return;
    cur = -1;
    if (sel === i) sel = -1;
    else if (sel >= 0 && L.adjacent(sel, i)) { const a = sel; trySwap(a, i); return; }
    else { sel = i; sfx.play("buoc-nhay", 0.25, 1.4); }
    idle = 0; marks();
  }
  board.addEventListener("pointerdown", onDown);
  board.addEventListener("pointermove", onMove);
  board.addEventListener("pointerup", onUp);
  board.addEventListener("pointercancel", () => { drag = null; });
  board.addEventListener("contextmenu", (e) => e.preventDefault());

  // ---------- Bàn phím ----------
  const DIRS = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1], a: [-1, 0], d: [1, 0], w: [0, -1], s: [0, 1] };
  function onKey(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === "m") { toggleMute(); e.preventDefault(); return; }
    if (k === "Escape") {
      e.preventDefault();
      if (!ov.menu.hidden) { if (s && s.status === "playing") { hide(ov.menu); stage.focus({ preventScroll: true }); } }
      else if (!busy) showMenu();
      return;
    }
    if (anyOverlay()) return;
    if (!s || s.status !== "playing") return;
    if (k === "h") { hint(); e.preventDefault(); return; }
    if (DIRS[k]) {
      e.preventDefault();
      if (busy) return;
      const [dx, dy] = DIRS[k];
      const from = sel >= 0 ? sel : cur >= 0 ? cur : 27;
      const nx = L.X(from) + dx, ny = L.Y(from) + dy;
      if (nx < 0 || ny < 0 || nx >= L.W || ny >= L.H) { if (cur < 0) { cur = from; marks(); } return; }
      const to = ny * L.W + nx;
      if (sel >= 0) { cur = to; trySwap(sel, to).then((ok) => { if (!ok && s) { cur = from; marks(); } }); }
      else { cur = cur < 0 ? from : to; marks(); }
      idle = 0;
      return;
    }
    if (k === " " || k === "Enter") {
      e.preventDefault();
      if (busy) return;
      if (cur < 0) cur = 27;
      sel = sel === cur ? -1 : cur;
      if (sel >= 0) sfx.play("buoc-nhay", 0.25, 1.4);
      idle = 0; marks();
    }
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
  $("replayBtn").addEventListener("click", () => start(true, s ? s.level : save.sel));
  $("retryBtn").addEventListener("click", () => start(true, s ? s.level : save.sel));
  $("menuBtn").addEventListener("click", () => { if (!busy) showMenu(); });
  $("menuBtnW").addEventListener("click", showMenu);
  $("menuBtnL").addEventListener("click", showMenu);
  $("shareBtnW").addEventListener("click", share);
  $("shareBtnL").addEventListener("click", share);
  $("hintBtn").addEventListener("click", () => { hint(); stage.focus({ preventScroll: true }); });
  $("muteBtn").addEventListener("click", toggleMute);
  $("muteBtn2").addEventListener("click", toggleMute);
  root.querySelectorAll(".how .ic").forEach((e) => { const t = e.dataset.ic; e.style.backgroundImage = `url(${t === "s" ? sprite(L.STAR, 0) : sprite(t === "h" ? 0 : 4, t)})`; });

  // ---------- Vòng lặp: đồng hồ + tự gợi ý ----------
  function frameLoop(now) {
    if (destroyed) return;
    const dt = Math.min(0.25, (now - last) / 1000); last = now;
    if (s && s.status === "playing" && !anyOverlay() && !document.hidden) {
      s.time += dt;
      if (!busy && !hintPair && sel < 0) { idle += dt; if (idle > IDLE_HINT) { idle = 0; hint(true); } }
      const sec = Math.floor(s.time);
      if (sec !== lastSec) { lastSec = sec; if (sec % 5 === 0) persist(); }
    }
    raf = requestAnimationFrame(frameLoop);
  }
  const onVis = () => { if (document.hidden) persist(); };
  const onResize = () => { board.classList.add("snap"); layout(); requestAnimationFrame(() => board.classList.remove("snap")); };
  document.addEventListener("visibilitychange", onVis);
  window.addEventListener("pagehide", persist);
  window.addEventListener("resize", onResize);
  const ro = window.ResizeObserver ? new ResizeObserver(onResize) : null;
  if (ro) ro.observe(stage);

  // Khởi động: sau menu là ván đang lưu (nếu có) hoặc bàn mẫu
  layout();
  {
    const g = save.game ? L.deserialize(save.game) : null;
    s = g || L.newGame({ mode: "level", level: 1, seed: 20261117 });
    syncView(); syncAll(); hud();
    s = null;
  }
  renderMenu(); showMute(); show(ov.menu);
  raf = requestAnimationFrame(frameLoop);

  return {
    get state() { return s; },
    get busy() { return busy; },
    get layout() { return G; },
    get save() { return save; },
    get sel() { return sel; },
    get hintPair() { return hintPair; },
    set speed(v) { speed = v; },
    sfx,
    swap: trySwap, hint, start, showMenu, toggleMute,
    resync() { syncView(); syncAll(); hud(); }, // dùng cho test: vẽ lại sau khi sửa bàn trực tiếp
    cellRect(i) { const r = board.getBoundingClientRect(), c = r.width / L.W; return { x: r.left + (L.X(i) + 0.5) * c, y: r.top + (L.Y(i) + 0.5) * c, cs: c }; },
    domCheck() { // mỗi ô có đúng một phần tử đúng vị trí, đúng loại
      if (!s) return "no game";
      const live = [...board.querySelectorAll(".ck:not(.pop)")];
      if (live.length !== L.N) return "count " + live.length;
      for (let i = 0; i < L.N; i++) { const c = s.cells[i], e = els.get(c.id); if (!e || +e.dataset.at !== i || +e.dataset.k !== c.k || (e.dataset.sp || 0) != (c.sp || 0)) return "cell " + i; }
      return "ok";
    },
    destroy() {
      destroyed = true; gen++; cancelAnimationFrame(raf);
      for (const t of timers) clearTimeout(t);
      document.removeEventListener("keydown", onKey); document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("resize", onResize); window.removeEventListener("pagehide", persist);
      if (ro) ro.disconnect(); sfx.close();
    },
  };
}
