// Đua Xe Vượt Đồi — phần hiển thị + điều khiển. Luật/vật lý nằm ở logic.js (không đụng DOM).
// Toàn bộ hình vẽ pixel bằng canvas ở độ phân giải thấp rồi phóng to "pixelated" (không dùng ảnh AI):
// xe địa hình đỏ, đồi 4 vùng (cỏ, cát, đá đỏ, tuyết), can xăng, đồng xu, cột mốc, cờ kỷ lục.
import * as L from "./logic.js";

const SAVE_KEY = "wgp.dua-xe.v1";
const OUT = "#160d0a";
const SFX = ["trung-vang", "trung-kim-cuong", "no-tnt", "thua", "thang", "qua-man", "keo-vat", "buoc-nhay"];

// bảng màu theo vùng (Art Bible V5: màu đất ấm, không neon)
const BIOME_PAL = [
  { sky: ["#7cbde4", "#94cbea", "#acd8ef", "#c6e5f3", "#def1f7"], far: "#8fb8b4", mid: "#5f9a6a", midD: "#4c8257",
    top: ["#9fe08f", "#5fb84f", "#3f9a45", "#2c7434"], dirt: ["#8a5a32", "#77492a", "#633b23", "#4f2e1b"], peb: "#3a2416", tuft: "#2c7434" },
  { sky: ["#e7b37c", "#eec18c", "#f3cf9e", "#f7dcb2", "#fae8c8"], far: "#d9a777", mid: "#c78b55", midD: "#b07a48",
    top: ["#fff0b8", "#f2d38a", "#e3bb6a", "#c99a4c"], dirt: ["#c8904a", "#b27c3e", "#986633", "#7d5129"], peb: "#6a4420", tuft: "#7a9a3a" },
  { sky: ["#e2846a", "#ea9a78", "#f1b088", "#f6c69c", "#f9dab4"], far: "#c97a62", mid: "#a8503e", midD: "#8e4234",
    top: ["#e9876a", "#c95a42", "#a8432f", "#842f22"], dirt: ["#9a3c2c", "#843226", "#6d2820", "#561f19"], peb: "#3c140e", tuft: "#6a7a3a" },
  { sky: ["#8db8de", "#a3c6e5", "#b9d4ec", "#cfe2f2", "#e5f0f8"], far: "#a9c1d6", mid: "#8aa4bc", midD: "#7590a8",
    top: ["#ffffff", "#eef4fa", "#d4e2ee", "#b0c4d6"], dirt: ["#6f7c8a", "#5f6b78", "#4f5a66", "#404954"], peb: "#2a3038", tuft: "#c8d8e6" },
];
const FONT = {
  0: ["111", "101", "101", "101", "111"], 1: ["010", "110", "010", "010", "111"], 2: ["111", "001", "111", "100", "111"],
  3: ["111", "001", "111", "001", "111"], 4: ["101", "101", "111", "001", "001"], 5: ["111", "100", "111", "001", "111"],
  6: ["111", "100", "111", "101", "111"], 7: ["111", "001", "010", "010", "010"], 8: ["111", "101", "111", "101", "111"],
  9: ["111", "101", "111", "001", "111"], m: ["000", "000", "111", "111", "101"], "+": ["000", "010", "111", "010", "000"],
  ".": ["000", "000", "000", "000", "010"], s: ["000", "011", "010", "001", "011"], x: ["000", "101", "010", "010", "101"],
};

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const fmt = (n) => Math.round(n).toLocaleString("vi-VN");
const kmh = (v) => Math.round(v * 3.6);
function hash(i) { let t = Math.imul(i | 0, 0x2c1b3c6d) ^ 0x297a2d39; t = Math.imul(t ^ (t >>> 15), 0x85ebca6b); t ^= t >>> 13; return (t >>> 0); }
function mix(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (s) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
  return "#" + ((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1);
}

function makeSfx(dir, names, sdk) {
  const AC = window.AudioContext || window.webkitAudioContext;
  const buf = {}, log = [];
  let ac = null, eng = null;
  if (AC) {
    try { ac = new AC(); } catch { ac = null; }
    if (ac) for (const n of names) {
      fetch(new URL(dir + n + ".ogg", import.meta.url)).then((r) => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
        .then((b) => ac.decodeAudioData(b)).then((d) => { buf[n] = d; })
        .catch(() => console.warn("Không tải được âm thanh " + n + ".ogg"));
    }
  }
  const muted = () => !!(sdk.sound && sdk.sound.muted);
  function engine() {
    if (eng || !ac) return eng;
    try {
      const o = ac.createOscillator(), o2 = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain();
      o.type = "sawtooth"; o2.type = "square"; o.frequency.value = 50; o2.frequency.value = 25;
      f.type = "lowpass"; f.frequency.value = 420; g.gain.value = 0;
      const g2 = ac.createGain(); g2.gain.value = 0.35;
      o.connect(f); o2.connect(g2).connect(f); f.connect(g).connect(ac.destination);
      o.start(); o2.start();
      eng = { o, o2, g };
    } catch { eng = null; }
    return eng;
  }
  return {
    unlock() { if (ac && ac.state === "suspended" && !muted()) ac.resume().catch(() => {}); engine(); },
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
    // tiếng máy: cao độ theo tốc độ + ga; vol = 0 khi không chạy
    engine(on, speed, gas) {
      const e = eng; if (!e || !ac) return;
      const t = ac.currentTime, f = 42 + speed * 5 + (gas ? 22 : 0);
      e.o.frequency.setTargetAtTime(f, t, 0.08); e.o2.frequency.setTargetAtTime(f / 2, t, 0.08);
      e.g.gain.setTargetAtTime(on && !muted() ? (gas ? 0.05 : 0.028) : 0, t, 0.06);
    },
    get loaded() { return Object.keys(buf).length; },
    log,
    close() { if (ac) ac.close().catch(() => {}); },
  };
}

function loadSave() {
  try { return L.sanitizeSave(JSON.parse(localStorage.getItem(SAVE_KEY))); } catch { return L.sanitizeSave(null); }
}

// ---------- sprite vẽ bằng code ----------
function cv(w, h) { const c = document.createElement("canvas"); c.width = Math.max(1, w); c.height = Math.max(1, h); return c; }
// thân xe (không gồm bánh), toạ độ mét trong hệ khung xe; trả về canvas + gốc (điểm khung (0,0))
function carSprite(ppm) {
  const M = 1.5, W = Math.ceil(2 * M * ppm) + 2, H = Math.ceil(2 * M * ppm) + 2;
  const c = cv(W, H), g = c.getContext("2d");
  const X = (x) => Math.round((x + M) * ppm), Y = (y) => Math.round((M - y) * ppm);
  const R = (x0, y0, x1, y1, col) => { g.fillStyle = col; const a = X(x0), b = Y(y1); g.fillRect(a, b, Math.max(1, X(x1) - a), Math.max(1, Y(y0) - b)); };
  const o = Math.max(1, Math.round(ppm / 14)); // độ dày viền (px)
  const ob = (x0, y0, x1, y1) => { g.fillStyle = OUT; const a = X(x0) - o, b = Y(y1) - o; g.fillRect(a, b, X(x1) - X(x0) + 2 * o, Y(y0) - Y(y1) + 2 * o); };
  // khung gầm + ống xả
  ob(-1.25, -0.16, 1.3, 0.02); R(-1.25, -0.16, 1.3, 0.02, "#3b302a"); R(-1.25, -0.04, 1.3, 0.02, "#5a4a40");
  ob(-1.42, 0.02, -1.18, 0.12); R(-1.42, 0.02, -1.18, 0.12, "#8c8378");
  // lồng bảo vệ (khung ống)
  const bar = (x0, y0, x1, y1) => { ob(x0, y0, x1, y1); R(x0, y0, x1, y1, "#d9cfb8"); };
  const t = Math.max(0.07, 1.6 / ppm);
  bar(-0.82, 0.45, -0.82 + t, 1.32); bar(-0.82, 1.32 - t, 0.22, 1.32); bar(0.22 - t, 0.6, 0.22, 1.32);
  bar(0.22 - t, 0.62, 0.62, 0.62 + t);
  // tài xế: áo xanh ngọc, mũ bảo hiểm
  ob(-0.5, 0.42, 0.02, 0.86); R(-0.5, 0.42, 0.02, 0.86, "#2f8f7f"); R(-0.5, 0.78, 0.02, 0.86, "#6fd0bb");
  R(-0.06, 0.55, 0.22, 0.64, "#f2c391"); // tay cầm lái
  ob(-0.42, 0.78, 0.02, 1.2); R(-0.42, 0.78, 0.02, 1.2, "#f2c391"); // mặt
  R(-0.44, 1.02, 0.04, 1.24, "#ffc94a"); R(-0.44, 1.18, 0.04, 1.24, "#fff0a8"); // mũ vàng
  R(-0.12, 0.92, 0.04, 1.02, OUT); R(-0.44, 0.94, -0.34, 1.02, "#e0a070");
  // vô-lăng
  ob(0.2, 0.5, 0.3, 0.72); R(0.2, 0.5, 0.3, 0.72, "#3b302a");
  // thân xe đỏ: thùng sau cao, nắp capô thấp phía trước
  ob(-1.32, 0.0, 0.5, 0.5); ob(0.4, 0.0, 1.38, 0.34);
  R(-1.32, 0.0, 0.5, 0.5, "#e0483d"); R(0.4, 0.0, 1.38, 0.34, "#e0483d");
  R(-1.32, 0.44, 0.5, 0.5, "#ff8a7a"); R(0.5, 0.28, 1.38, 0.34, "#ff8a7a");
  R(-1.32, 0.0, 1.38, 0.07, "#8e2219");
  R(-1.32, 0.17, 1.38, 0.25, "#f4ead2"); // sọc kem
  R(-0.55, 0.07, -0.42, 0.44, "#8e2219"); // khe cửa
  R(1.27, 0.12, 1.38, 0.24, "#ffe9a8"); R(-1.32, 0.3, -1.24, 0.42, "#ffc94a"); // đèn pha / đèn hậu
  // số xe
  R(0.75, 0.08, 1.05, 0.16, "#f4ead2");
  return { c, ox: X(0), oy: Y(0) };
}
function wheelSprite(ppm) {
  const r = Math.max(4, Math.round(L.WHEEL_R * ppm)), S = 2 * r + 2, c = cv(S, S), g = c.getContext("2d");
  const cx = S / 2, cy = S / 2;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy), a = Math.atan2(y + 0.5 - cy, x + 0.5 - cx);
    let col = null;
    if (d <= r + 0.3) col = OUT;
    if (d <= r - 0.7) col = (Math.floor((a + Math.PI) / (Math.PI / 6)) % 2 && d > r * 0.78) ? "#4a3d34" : "#2a211c";
    if (d <= r * 0.58) col = "#8c8378";
    if (d <= r * 0.5) col = "#b9ad93";
    if (d <= r * 0.5 && (Math.abs(Math.sin(a * 2)) < 0.28 * (r * 0.5) / Math.max(d, 1))) col = "#5a5048";
    if (d <= r * 0.2) col = "#f4ead2";
    if (col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); }
  }
  return { c, o: S / 2 };
}
function coinSprite(ppm, f) {
  const r = Math.max(3, Math.round(0.26 * ppm)), S = 2 * r + 2, c = cv(S, S), g = c.getContext("2d");
  const sx = [1, 0.7, 0.25, 0.7][f];
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const dx = (x + 0.5 - S / 2) / sx, dy = y + 0.5 - S / 2, d = Math.hypot(dx, dy);
    let col = null;
    if (d <= r + 0.4) col = OUT;
    if (d <= r - 0.6) col = dx + dy > r * 0.5 ? "#a8740e" : "#ffc94a";
    if (d <= r * 0.5 && f !== 2) col = "#e8a628";
    if (d <= r - 0.6 && dx + dy < -r * 0.6) col = "#fff0a8";
    if (col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); }
  }
  return c;
}
function fuelSprite(ppm) {
  const u = Math.max(1, Math.round(ppm * 0.7 / 12)), c = cv(12 * u + 2, 14 * u + 2), g = c.getContext("2d");
  const rows = [
    "...oooo.....", "...o..o.....", "..oooooooo..", ".oRRRRRRRRo.", ".oRWWRRRRdo.", ".oRWRRRRRdo.", ".oRRRRRRRdo.",
    ".oRRYYYYRdo.", ".oRRYooYRdo.", ".oRRYYYYRdo.", ".oRRRRRRRdo.", ".oRRRRRRRdo.", ".oddddddddo.", "..oooooooo..",
  ];
  const col = { o: OUT, R: "#e0483d", W: "#ff8a7a", d: "#8e2219", Y: "#ffc94a" };
  rows.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== ".") { g.fillStyle = col[ch]; g.fillRect(1 + i * u, 1 + j * u, u, u); } }));
  return c;
}
// biểu tượng nâng cấp 16×16
function iconSprite(kind) {
  const c = cv(16, 16), g = c.getContext("2d");
  const P = {
    engine: ["................", "...oooooooo.....", "...oSSSSSSo.....", ".oooSDDDDSooo...", ".oRRRRRRRRRRo...", "ooRWWRRRRRRRoo..", "oRRWRRRRRRRRRoo.", "oRRRRDDDDRRRRRo.", "oRRRRDooDRRRRRo.", "oRRRRDDDDRRRRo..", "ooRRRRRRRRRRRo..", ".oddddddddddo...", "..oo......oo....", "..oo......oo....", "................", "................"],
    grip: ["................", ".....oooooo.....", "...ooTTTTTToo...", "..oTTKKKKKKTTo..", ".oTKKGGGGGGKKTo.", ".oTKGGLLLLGGKTo.", "oTKGGLWWWLLGKTTo", "oTKGLWWHWWLGKTTo", "oTKGLWHHHWLGKKTo", "oTKGLWWHWWLGKTTo", ".oTKGLLLLLGGKTo.", ".oTKKGGGGGGKKTo.", "..oTTKKKKKKTTo..", "...ooTTTTTToo...", ".....oooooo.....", "................"],
    tank: ["....oooo........", "....o..o........", "...oooooooo.....", "..oRRRRRRRRo....", "..oRWWRRRRdo....", "..oRWRRRRRdo....", "..oRRRRRRRdo....", "..oRRYYYYRdo....", "..oRRYooYRdo....", "..oRRYYYYRdo....", "..oRRRRRRRdo....", "..oRRRRRRRdo....", "..oddddddddo....", "...oooooooo.....", "................", "................"],
  }[kind];
  const col = { o: OUT, R: "#e0483d", W: "#ff8a7a", d: "#8e2219", Y: "#ffc94a", S: "#b9ad93", D: "#5a5048", T: "#4a3d34", K: "#2a211c", G: "#8c8378", L: "#b9ad93", H: "#f4ead2" };
  P.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== ".") { g.fillStyle = col[ch]; g.fillRect(i, j, 1, 1); } }));
  return c;
}

export function mount(root, ctx = {}) {
  const sdk = ctx.sdk || { reportScore() {}, gameOver() {}, sound: { muted: false } };
  if (!sdk.sound) sdk.sound = { muted: false };
  const $ = (id) => root.querySelector("#" + id);
  const stage = $("stage"), canvas = $("cv"), g = canvas.getContext("2d");
  const ov = { menu: $("ovMenu"), pause: $("ovPause"), over: $("ovOver") };
  const sfx = makeSfx("./assets/sfx/", SFX, sdk);
  const save = loadSave();
  let mode = "menu", s = null, raf = 0, last = 0, destroyed = false, runNo = 0;
  let view = { W: 320, H: 180, P: 3, ppm: 20 }, spr = null;
  let cam = { x: L.START_X, y: 0, init: false }, shake = 0;
  let parts = [], floats = [], bonus = 0, lowWarned = false, overTimer = 0, lastRes = null;
  const keys = { gas: false, brake: false }, ped = { gas: new Set(), brake: new Set() };
  const timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (!destroyed) fn(); }, ms); timers.add(t); return t; };
  const input = () => ({ gas: keys.gas || ped.gas.size > 0, brake: keys.brake || ped.brake.size > 0 });

  function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch { /* bỏ qua */ } }
  function show(el) { for (const k in ov) ov[k].hidden = ov[k] !== el; }
  function setMode(m) { mode = m; root.classList.toggle("is-menu", m === "menu"); root.classList.toggle("is-over", m === "over"); }
  function toast(txt, cls = "") {
    stage.querySelectorAll(".toast").forEach((t) => t.remove());
    const d = document.createElement("div"); d.className = "toast " + cls; d.textContent = txt; stage.appendChild(d);
    later(() => d.remove(), 1500);
  }

  // ---------- bố cục ----------
  function layout() {
    const r = stage.getBoundingClientRect();
    const cw = Math.max(1, r.width), ch = Math.max(1, r.height);
    const P = clamp(Math.round(Math.min(cw, ch) / 200), 2, 4);
    const W = Math.ceil(cw / P), H = Math.ceil(ch / P);
    const ppm = Math.round(clamp(Math.min(W / (W < H ? 9.5 : 15), H / 9), 11, 32));
    const changed = ppm !== view.ppm || !spr;
    view = { W, H, P, ppm, cw, ch };
    canvas.width = W; canvas.height = H;
    if (changed) spr = { car: carSprite(ppm), wheel: wheelSprite(ppm), coin: [0, 1, 2, 3].map((f) => coinSprite(ppm, f)), fuel: fuelSprite(ppm) };
    draw();
  }

  // ---------- HUD ----------
  const hudCache = {};
  const setText = (id, v) => { if (hudCache[id] !== v) { hudCache[id] = v; $(id).textContent = v; } };
  function hud() {
    const d = s ? s.dist : 0;
    setText("hDist", fmt(d) + " m");
    const beat = s && save.best > 0 && d > save.best;
    setText("hBest", save.best > 0 ? (beat ? "Kỷ lục mới!" : "Kỷ lục " + fmt(save.best) + " m") : "Chưa có kỷ lục");
    $("hBest").classList.toggle("beat", !!beat);
    const f = s ? s.fuel / s.cfg.fuelMax : 1, pct = Math.ceil(f * 100);
    if (hudCache.fuel !== pct) { hudCache.fuel = pct; $("hFuel").style.width = clamp(f * 100, 0, 100) + "%"; $("hFuelTx").textContent = pct + "%"; }
    const fb = $("fuelBox"); fb.classList.toggle("low", f <= 0.2); fb.classList.toggle("mid", f > 0.2 && f <= 0.45);
    setText("hCoins", fmt(s ? s.coins : 0));
  }

  // ---------- cửa hàng nâng cấp ----------
  const ICON = { engine: iconSprite("engine"), grip: iconSprite("grip"), tank: iconSprite("tank") };
  function effText(key, lvl) {
    const c = L.carCfg({ [key]: lvl });
    return key === "engine" ? kmh(c.vmax) : key === "grip" ? Math.round(c.mu * 100) : c.fuelMax;
  }
  function renderShop() {
    setText("mBest", fmt(save.best) + " m"); setText("mCoins", fmt(save.coins));
    const box = $("ups");
    if (!box.children.length) {
      for (const key of Object.keys(L.UPG)) {
        const d = document.createElement("div"); d.className = "up"; d.dataset.k = key;
        const ic = cv(16, 16); ic.getContext("2d").drawImage(ICON[key], 0, 0);
        d.append(ic);
        d.insertAdjacentHTML("beforeend", `<b>${L.UPG[key].name}</b><div class="eff"></div><div class="pips">${"<i></i>".repeat(L.UPG[key].max)}</div><button class="btn btn--teal" type="button"></button>`);
        d.querySelector("button").addEventListener("click", () => buy(key));
        box.append(d);
      }
    }
    for (const d of box.children) {
      const key = d.dataset.k, lvl = save.up[key], cost = L.upgradeCost(lvl);
      const unit = { engine: " km/h", grip: "% bám", tank: " lít" }[key];
      d.querySelector(".eff").textContent = cost == null ? effText(key, lvl) + unit : effText(key, lvl) + " → " + effText(key, lvl + 1) + unit;
      d.querySelectorAll(".pips i").forEach((p, i) => p.classList.toggle("on", i < lvl));
      const b = d.querySelector("button");
      b.innerHTML = cost == null ? "Tối đa" : `<span class="lbl">Mua · </span>${fmt(cost)} xu`;
      b.disabled = cost == null || save.coins < cost;
      b.setAttribute("aria-label", `Nâng cấp ${L.UPG[key].name} cấp ${lvl + 1}` + (cost == null ? " (tối đa)" : `, giá ${cost} xu`));
    }
  }
  function buy(key) {
    sfx.unlock();
    if (!L.buyUpgrade(save, key)) return false;
    persist(); sfx.play("keo-vat");
    renderShop();
    const d = $("ups").querySelector(`[data-k="${key}"]`); d.classList.remove("bought"); void d.offsetWidth; d.classList.add("bought");
    return true;
  }

  // ---------- luồng ván ----------
  function start(seed) {
    sfx.unlock();
    runNo++;
    const sd = seed != null ? seed : ctx.seed != null ? (ctx.seed + runNo - 1) : (Math.random() * 1e9) | 0;
    s = L.newRun(sd, save.up);
    parts = []; floats = []; bonus = 0; lowWarned = false; lastRes = null; clearTimeout(overTimer);
    keys.gas = keys.brake = false;
    cam.init = false;
    setMode("play"); show(null); hud();
    stage.focus({ preventScroll: true });
    last = 0;
    return s;
  }
  function pause() { if (mode !== "play") return; setMode("pause"); $("pSub").textContent = "Đã đi " + fmt(s.dist) + " m · " + fmt(s.coins) + " xu"; show(ov.pause); sfx.engine(false, 0, false); sfx.play("buoc-nhay", 0.35, 0.8); }
  function resume() { if (mode !== "pause") return; sfx.play("buoc-nhay", 0.35, 1.2); setMode("play"); show(null); last = 0; stage.focus({ preventScroll: true }); }
  function showMenu() {
    if (s && (mode === "play" || mode === "pause") && s.status !== "over") { s.status = "over"; s.reason = "bo"; finish(true); }
    setMode("menu"); renderShop(); show(ov.menu); sfx.engine(false, 0, false);
  }
  function finish(quiet = false) {
    if (lastRes) return lastRes;
    const res = L.finishRun(save, s);
    lastRes = res; persist();
    try { sdk.reportScore(s.dist); sdk.gameOver({ score: s.dist, distance: s.dist, coins: s.coins, reason: s.reason, record: res.record }); } catch { /* bỏ qua */ }
    if (quiet) return res;
    sfx.engine(false, 0, false);
    const lat = s.reason === "lat";
    $("oTitle").textContent = lat ? "Xe lật!" : "Hết xăng!";
    $("oSub").textContent = lat ? "Đầu tài xế chạm đất. Nhớ nhả ga khi xe bốc đầu nhé!" : "Bình xăng cạn rồi. Lần sau nhặt thêm can xăng đỏ!";
    $("oResult").innerHTML =
      `<span>Quãng đường</span><b>${fmt(s.dist)} m</b>` +
      `<span>Xu nhặt được</span><b>${fmt(s.coins - bonus)}</b>` +
      `<span>Thưởng bay / lộn vòng</span><b>${fmt(bonus)}</b>` +
      `<span>Can xăng đã nhặt</span><b>${s.fuels}</b>` +
      `<span class="total">Ví sau ván</span><b>${fmt(save.coins)} xu</b>`;
    $("oRecord").innerHTML = res.record ? `<span class="record">Kỷ lục mới · ${fmt(s.dist)} m</span>` : `<span class="record" style="animation:none;background:var(--panel2);color:var(--soft)">Kỷ lục ${fmt(save.best)} m</span>`;
    const affordable = Object.keys(L.UPG).some((k) => { const c = L.upgradeCost(save.up[k]); return c != null && save.coins >= c; });
    $("shopBtn").textContent = affordable ? "Nâng cấp xe ★" : "Nâng cấp xe";
    setMode("over"); show(ov.over);
    sfx.play(res.record ? "thang" : "thua", 0.8);
    $("retryBtn").focus({ preventScroll: true });
    return res;
  }

  // ---------- sự kiện từ logic ----------
  function onEvents() {
    const ev = s.events.splice(0);
    for (const e of ev) {
      if (e.type === "coin") { sfx.play("trung-vang", 0.55, 1 + Math.random() * 0.15); floats.push({ x: e.x, y: e.y + 0.3, t: 0, txt: "+" + e.v, col: "#ffc94a" }); burst(e.x, e.y, ["#ffc94a", "#fff0a8"], 5); }
      else if (e.type === "fuel") { sfx.play("trung-kim-cuong", 0.7); toast("Đổ đầy xăng!", "teal"); burst(e.x, e.y, ["#e0483d", "#ffc94a"], 8); lowWarned = false; }
      else if (e.type === "mark") toast(fmt(e.d) + " m");
      else if (e.type === "biome") { sfx.play("qua-man", 0.6); toast(L.BIOMES[e.b], "teal"); }
      else if (e.type === "flip") { bonus += e.v; sfx.play("qua-man", 0.8); toast((e.n > 1 ? e.n + "× " : "") + "Lộn vòng! +" + e.v); }
      else if (e.type === "air") { bonus += e.v; floats.push({ x: L.carX(s), y: L.carY(s) + 1.6, t: 0, txt: "+" + e.v, col: "#6fd0bb" }); }
      else if (e.type === "land") sfx.play("buoc-nhay", clamp(e.t, 0.3, 1), 0.8);
      else if (e.type === "crash") { sfx.play("no-tnt", 0.8); shake = 0.45; burst(s.p[2].x, s.p[2].y, ["#f4ead2", "#b9ad93", "#e0483d"], 16); toast("Lật xe!", "warn"); }
      else if (e.type === "over") overTimer = later(() => finish(), s.reason === "lat" ? 250 : 500);
    }
    if (s.status === "run" && s.fuel / s.cfg.fuelMax < 0.2 && !lowWarned) { lowWarned = true; toast("Sắp hết xăng!", "warn"); sfx.play("buoc-nhay", 0.6, 0.6); }
  }
  function burst(x, y, cols, n) {
    for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, v = 1.5 + Math.random() * 3; parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v + 2, t: 0, life: 0.5 + Math.random() * 0.4, col: cols[i % cols.length], g: 9 }); }
  }

  // ---------- vẽ ----------
  function pixText(txt, x, y, k, col, shadow = OUT) {
    const draw1 = (ox, oy, c) => { g.fillStyle = c; let cx = ox; for (const ch of String(txt)) { const f = FONT[ch]; if (f) f.forEach((row, j) => [...row].forEach((b, i) => { if (b === "1") g.fillRect(cx + i * k, oy + j * k, k, k); })); cx += 4 * k; } };
    if (shadow) draw1(x + k, y + k, shadow);
    draw1(x, y, col);
  }
  const textW = (txt, k) => String(txt).length * 4 * k - k;

  function camTarget() {
    const x = s ? L.carX(s) : L.START_X, y = s ? L.carY(s) : L.groundY(L.makeTerrain(1), L.START_X) + 1;
    return { x, y };
  }
  function updateCam(dt) {
    const T = s ? s.terrain : null;
    const tg = camTarget();
    const ahead = s ? clamp(L.carVx(s) * 0.25, -1, 3) : 0;
    const gy = T ? L.groundY(T, tg.x + 6) : tg.y;
    const ty = tg.y * 0.7 + gy * 0.3;
    if (!cam.init) { cam.x = tg.x + ahead; cam.y = ty; cam.init = true; }
    const k = 1 - Math.exp(-dt * 5), ky = 1 - Math.exp(-dt * 3.5);
    cam.x += (tg.x + ahead - cam.x) * k; cam.y += (ty - cam.y) * ky;
    // không để xe ra khỏi khung
    const { W, H, ppm } = view, maxDy = (H * 0.38) / ppm;
    if (tg.y - cam.y > maxDy) cam.y = tg.y - maxDy; if (cam.y - tg.y > maxDy) cam.y = tg.y + maxDy;
    const maxDx = (W * 0.25) / ppm; if (Math.abs(tg.x - cam.x) > maxDx) cam.x = tg.x - Math.sign(tg.x - cam.x) * maxDx;
  }

  function draw() {
    const { W, H, ppm } = view;
    if (!spr) return;
    const run = s || demo;
    const T = run.terrain;
    const ax = Math.round(W * (W < H ? 0.3 : 0.33)), ay = Math.round(H * (W < H ? 0.6 : 0.58));
    let sx = 0, sy = 0;
    if (shake > 0) { sx = Math.round((Math.random() - 0.5) * 6 * shake); sy = Math.round((Math.random() - 0.5) * 6 * shake); }
    const camPX = Math.round(cam.x * ppm) - sx, camPY = Math.round(cam.y * ppm) + sy;
    const toSX = (x) => Math.round(x * ppm) - camPX + ax, toSY = (y) => camPY - Math.round(y * ppm) + ay;
    g.imageSmoothingEnabled = false;

    // vùng hiện tại theo vị trí camera (pha trộn 30 m quanh ranh giới)
    const dcam = cam.x - L.START_X, bi = L.biomeAt(dcam), into = ((dcam % L.BIOME_LEN) + L.BIOME_LEN) % L.BIOME_LEN;
    const bPrev = L.biomeAt(dcam - L.BIOME_LEN), tmix = dcam >= L.BIOME_LEN && into < 30 ? 1 - into / 30 : 0;
    const PA = BIOME_PAL[bi], PB = BIOME_PAL[bPrev];
    const pc = (key, i) => (tmix > 0 ? mix(i == null ? PA[key] : PA[key][i], i == null ? PB[key] : PB[key][i], tmix) : i == null ? PA[key] : PA[key][i]);

    // trời: dải màu bậc thang
    const nb = PA.sky.length, horizon = ay - Math.round(ppm * 2);
    for (let i = 0; i < nb; i++) { g.fillStyle = pc("sky", i); const y0 = Math.round((horizon * i) / nb) - 2 * i; g.fillRect(0, Math.max(0, y0), W, H); }
    // mặt trời
    const sunR = Math.round(ppm * 0.8), sunX = Math.round(W * 0.8), sunY = Math.round(H * 0.18);
    for (let dy = -sunR; dy < sunR; dy++) {
      const hw = Math.round(Math.sqrt(sunR * sunR - (dy + 0.5) ** 2));
      g.fillStyle = dy > sunR * 0.45 ? "#ffe9a8" : "#fff4d0"; g.fillRect(sunX - hw, sunY + dy, hw * 2, 1);
    }
    // mây (thị sai 0.1)
    for (let i = 0; i < 5; i++) {
      const span = W + 160, cx = (((i * 173 + 40 - camPX * 0.08) % span) + span) % span - 80, cy = 10 + ((i * 37) % Math.max(20, Math.round(H * 0.25)));
      const cw = 26 + (i % 3) * 12;
      g.fillStyle = "#ffffff"; g.fillRect(cx, cy, cw, 6); g.fillRect(cx + 6, cy - 4, cw - 14, 4); g.fillRect(cx + 10, cy - 7, cw - 24, 3);
      g.fillStyle = "rgba(160,190,210,0.55)"; g.fillRect(cx + 2, cy + 6, cw - 4, 2);
    }
    // đồi xa + đồi gần (thị sai)
    const hills = (par, base, amp, col, colD, f1, f2) => {
      g.fillStyle = col;
      const off = camPX * par, yoff = Math.round(camPY * par * 0.15);
      for (let x = 0; x < W; x += 2) {
        const u = x + off, h = Math.round(amp * (0.6 * Math.sin(u * f1) + 0.4 * Math.sin(u * f2 + 1.7)));
        const top = base - h + yoff;
        g.fillRect(x, top, 2, H - top);
      }
      if (colD) { // hàng cây nhỏ trên đồi gần
        g.fillStyle = colD;
        const step = 46, first = Math.floor(off / step) * step;
        for (let u = first; u < off + W + step; u += step) {
          const hh = hash(u), tx = Math.round(u - off + (hh % 20)), uu = tx + off;
          const top = base - Math.round(amp * (0.6 * Math.sin(uu * f1) + 0.4 * Math.sin(uu * f2 + 1.7))) + yoff;
          const th = 6 + (hh % 5);
          g.fillRect(tx - 1, top - th + 1, 2, th); g.fillRect(tx - 3, top - th + 3, 6, th - 5); g.fillRect(tx - 2, top - th, 4, 2);
        }
      }
    };
    hills(0.15, horizon - Math.round(ppm * 1.2), ppm * 1.1, pc("far"), null, 0.011, 0.027);
    hills(0.35, horizon + Math.round(ppm * 0.6), ppm * 1.0, pc("mid"), pc("midD"), 0.018, 0.043);

    // mặt đất: từng cột pixel, lớp mặt + đất nhiều tầng có răng cưa
    for (let x = 0; x < W; x++) {
      const wpx = camPX + x - ax, wx = wpx / ppm;
      const top = toSY(L.groundY(T, wx));
      if (top >= H) continue;
      const bP = BIOME_PAL[L.biomeAt(wx - L.START_X)], hh = hash(wpx);
      let y = top;
      const band = (h, col) => { if (y < H) { g.fillStyle = col; g.fillRect(x, y, 1, h); } y += h; };
      band(1, bP.top[0]); band(2, bP.top[1]); band(2 + (hh & 1), bP.top[2]); band(1 + ((hh >> 1) & 1), bP.top[3]);
      const deep = [7, 11, 16];
      for (let i = 0; i < 3; i++) band(deep[i] + ((hh >> (2 + i)) & 1), bP.dirt[i]);
      if (y < H) { g.fillStyle = bP.dirt[3]; g.fillRect(x, y, 1, H - y); }
      if (hh % 29 === 0) { g.fillStyle = bP.peb; g.fillRect(x, top + 9 + (hh % 13), 2, 2); }
      if (hh % 41 === 3) { g.fillStyle = bP.peb; g.fillRect(x, top + 22 + (hh % 17), 3, 2); }
      if (hh % 13 === 5) { g.fillStyle = bP.tuft; g.fillRect(x, top - 1 - (hh % 2), 1, 1 + (hh % 2)); }
    }
    // cột mốc mỗi 100 m + cờ kỷ lục
    const xa = cam.x - (ax + 20) / ppm, xb = cam.x + (W - ax + 20) / ppm;
    const k = ppm >= 22 ? 2 : 1;
    for (let d = Math.max(100, Math.ceil((xa - L.START_X) / 100) * 100); d + L.START_X <= xb; d += 100) {
      const wx = d + L.START_X, px = toSX(wx), py = toSY(L.groundY(T, wx));
      const ph = Math.round(ppm * 1.4), lbl = d + "m", tw = textW(lbl, k);
      g.fillStyle = OUT; g.fillRect(px - 2, py - ph, 4, ph); g.fillStyle = "#8a5a32"; g.fillRect(px - 1, py - ph, 2, ph);
      g.fillStyle = OUT; g.fillRect(px - tw / 2 - 3, py - ph - 5 * k - 5, tw + 6, 5 * k + 6);
      g.fillStyle = "#f4ead2"; g.fillRect(px - tw / 2 - 2, py - ph - 5 * k - 4, tw + 4, 5 * k + 4);
      pixText(lbl, Math.round(px - tw / 2), py - ph - 5 * k - 2, k, "#3b302a", null);
    }
    if (save.best > 0) {
      const wx = save.best + L.START_X;
      if (wx > xa && wx < xb) {
        const px = toSX(wx), py = toSY(L.groundY(T, wx)), ph = Math.round(ppm * 2.4);
        g.fillStyle = OUT; g.fillRect(px - 1, py - ph - 1, 3, ph + 1); g.fillStyle = "#d9cfb8"; g.fillRect(px, py - ph, 1, ph);
        const fw = Math.round(ppm * 1.1), fh = Math.round(ppm * 0.7), wave = Math.round(Math.sin(performance.now() / 200) * 1);
        g.fillStyle = OUT; g.fillRect(px + 1, py - ph - 1 + wave, fw + 2, fh + 2);
        g.fillStyle = "#2f8f7f"; g.fillRect(px + 2, py - ph + wave, fw, fh);
        g.fillStyle = "#6fd0bb"; g.fillRect(px + 2, py - ph + wave, fw, 2);
        const lbl = String(save.best), tw = textW(lbl, 1);
        pixText(lbl, Math.round(px + 2 + (fw - tw) / 2), py - ph + wave + Math.round((fh - 5) / 2), 1, "#f4ead2", "#0f3a33");
      }
    }
    // vật phẩm
    const now = performance.now() / 1000;
    if (s) for (const it of L.itemsNear(s, xa, xb)) {
      const bob = Math.round(Math.sin(now * 3 + it.x) * ppm * 0.06);
      if (it.kind === "coin") { const c = spr.coin[Math.floor(now * 8 + it.x * 2) % 4]; g.drawImage(c, toSX(it.x) - (c.width >> 1), toSY(it.y) - (c.height >> 1) + bob); }
      else { const c = spr.fuel; g.drawImage(c, toSX(it.x) - (c.width >> 1), toSY(it.y) - (c.height >> 1) + bob); }
    }
    // xe
    const P = run.p, ang = L.carAngle(run), ca = Math.cos(ang), sa = Math.sin(ang);
    const B = [(-0.95 + 1) / 2.05, (1.0 + 1) / 2.05];
    for (let kk = 0; kk < 2; kk++) { // tay đòn giảm xóc
      const A = P[3 + kk], bx = P[0].x + (P[1].x - P[0].x) * B[kk], by = P[0].y + (P[1].y - P[0].y) * B[kk];
      line(toSX(bx), toSY(by), toSX(A.x), toSY(A.y), Math.max(2, Math.round(ppm / 10)), "#3b302a");
    }
    const ox = P[0].x + ca * 1.0, oy = P[0].y + sa * 1.0;
    g.save(); g.translate(toSX(ox), toSY(oy)); g.rotate(-ang); g.drawImage(spr.car.c, -spr.car.ox, -spr.car.oy); g.restore();
    for (let kk = 0; kk < 2; kk++) {
      const A = P[3 + kk];
      g.save(); g.translate(toSX(A.x), toSY(A.y)); g.rotate(run.wa[kk]); g.drawImage(spr.wheel.c, -spr.wheel.o, -spr.wheel.o); g.restore();
    }
    // hạt bụi / mảnh vụn
    for (const p of parts) { const a = 1 - p.t / p.life; g.globalAlpha = clamp(a * 1.4, 0, 1); g.fillStyle = p.col; const z = Math.max(1, Math.round((p.z || 0.12) * ppm * (0.5 + a * 0.5))); g.fillRect(toSX(p.x) - (z >> 1), toSY(p.y) - (z >> 1), z, z); }
    g.globalAlpha = 1;
    for (const f of floats) { const tw = textW(f.txt, k); pixText(f.txt, Math.round(toSX(f.x) - tw / 2), toSY(f.y + f.t * 1.2), k, f.col); }
  }
  function line(x0, y0, x1, y1, w, col) {
    g.fillStyle = col;
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= n; i++) { const x = Math.round(x0 + ((x1 - x0) * i) / n), y = Math.round(y0 + ((y1 - y0) * i) / n); g.fillRect(x - (w >> 1), y - (w >> 1), w, w); }
  }

  // xe đứng chờ ở menu
  const demo = L.newRun(20261117, {});
  L.simulate(demo, { gas: false, brake: false }, 1);

  // ---------- vòng lặp ----------
  let dustAcc = 0;
  function frame(ts) {
    if (destroyed) return;
    raf = requestAnimationFrame(frame);
    const dt = last ? clamp((ts - last) / 1000, 0, 0.1) : 1 / 60;
    last = ts;
    if (mode === "play" && s) {
      const inp = input();
      L.update(s, inp, dt);
      onEvents();
      // bụi sau bánh khi ga trên đất, khói ống xả
      const sp = L.carSpeed(s);
      if (s.status === "run" && inp.gas && s.fuel > 0) {
        dustAcc += dt;
        while (dustAcc > 0.05) {
          dustAcc -= 0.05;
          const bP = BIOME_PAL[L.biomeAt(L.carX(s) - L.START_X)];
          if (s.wc[0]) { const A = s.p[3]; parts.push({ x: A.x - 0.2, y: A.y - L.WHEEL_R + 0.1, vx: -1 - Math.random() * 2 - sp * 0.1, vy: 1 + Math.random() * 1.5, t: 0, life: 0.45, col: bP.top[2], g: 6, z: 0.14 }); }
          const ang = L.carAngle(s), ex = s.p[0].x - Math.cos(ang) * 0.45, ey = s.p[0].y - Math.sin(ang) * 0.45 + 0.07;
          parts.push({ x: ex, y: ey, vx: -0.6 - Math.random(), vy: 0.6 + Math.random() * 0.5, t: 0, life: 0.6, col: "#b9ad93", g: -0.5, z: 0.16 });
        }
      }
      sfx.engine(s.status === "run", sp, inp.gas && s.fuel > 0);
      hud();
    }
    if (shake > 0) shake = Math.max(0, shake - dt);
    for (const p of parts) { p.t += dt; p.vy -= p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
    parts = parts.filter((p) => p.t < p.life);
    for (const f of floats) f.t += dt;
    floats = floats.filter((f) => f.t < 0.9);
    updateCam(dt);
    draw();
    root.querySelector("#gasBtn").classList.toggle("on", input().gas && mode === "play");
    root.querySelector("#brakeBtn").classList.toggle("on", input().brake && mode === "play");
  }

  // ---------- âm thanh ----------
  function showMute() {
    const m = !!sdk.sound.muted;
    root.querySelectorAll(".muteIc").forEach((i) => { i.src = "assets/ui/" + (m ? "icon-am-thanh-tat.png" : "icon-am-thanh-bat.png"); });
    $("muteBtn").setAttribute("aria-pressed", String(m));
    $("muteBtn").title = m ? "Bật âm thanh (M)" : "Tắt âm thanh (M)";
  }
  function toggleMute() {
    sdk.sound.muted = !sdk.sound.muted;
    try { localStorage.setItem("wgp.muted", sdk.sound.muted ? "1" : "0"); } catch { /* bỏ qua */ }
    showMute(); sfx.unlock();
    if (sdk.sound.muted) sfx.engine(false, 0, false);
  }

  // ---------- điều khiển ----------
  const GAS = ["ArrowRight", "KeyD", "ArrowUp", "KeyW"], BRK = ["ArrowLeft", "KeyA", "ArrowDown", "KeyS"];
  function onKey(e) {
    const down = e.type === "keydown";
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = (e.target && e.target.tagName) || "";
    const onBtn = tag === "BUTTON" || tag === "A";
    if (GAS.includes(e.code) || BRK.includes(e.code)) {
      if (mode !== "play") return;
      e.preventDefault();
      if (GAS.includes(e.code)) keys.gas = down; else keys.brake = down;
      if (down) sfx.unlock();
      return;
    }
    if (!down || e.repeat) return;
    if (e.code === "KeyM") { toggleMute(); return; }
    if (e.code === "KeyP" || e.code === "Escape") { if (mode === "play") pause(); else if (mode === "pause") resume(); e.preventDefault(); return; }
    if (e.code === "Enter" && (mode === "over" || (mode === "menu" && !onBtn))) { e.preventDefault(); start(); return; }
    if (e.code === "Space" && !onBtn) {
      if (mode === "menu" || mode === "over") { e.preventDefault(); start(); }
      else if (mode === "pause") { e.preventDefault(); resume(); }
    }
  }
  function bindPedal(el, key) {
    const down = (e) => {
      if (mode !== "play") return;
      e.preventDefault(); sfx.unlock();
      ped[key].add(e.pointerId);
      try { el.setPointerCapture(e.pointerId); } catch { /* bỏ qua */ }
    };
    const up = (e) => { ped[key].delete(e.pointerId); };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up); el.addEventListener("lostpointercapture", up);
    el.addEventListener("contextmenu", (e) => e.preventDefault());
  }
  bindPedal($("gasBtn"), "gas"); bindPedal($("brakeBtn"), "brake");
  const clearInput = () => { keys.gas = keys.brake = false; ped.gas.clear(); ped.brake.clear(); };
  $("playBtn").addEventListener("click", () => start());
  $("retryBtn").addEventListener("click", () => start());
  $("shopBtn").addEventListener("click", () => { showMenu(); later(() => $("ups").scrollIntoView({ block: "nearest" }), 0); });
  $("pauseBtn").addEventListener("click", () => (mode === "play" ? pause() : mode === "pause" ? resume() : null));
  $("resumeBtn").addEventListener("click", resume);
  $("quitBtn").addEventListener("click", showMenu);
  $("muteBtn").addEventListener("click", toggleMute);
  document.addEventListener("keydown", onKey); document.addEventListener("keyup", onKey);
  const onBlur = () => clearInput();
  const onVis = () => { if (document.hidden) { clearInput(); pause(); persist(); } };
  const onResize = () => layout();
  window.addEventListener("blur", onBlur);
  document.addEventListener("visibilitychange", onVis);
  window.addEventListener("resize", onResize);
  const ro = window.ResizeObserver ? new ResizeObserver(onResize) : null;
  if (ro) ro.observe(stage);

  layout(); renderShop(); showMute(); show(ov.menu); hud();
  raf = requestAnimationFrame(frame);

  return {
    get state() { return s; },
    get mode() { return mode; },
    get save() { return save; },
    get view() { return view; },
    get input() { return input(); },
    get bonus() { return bonus; },
    get pointers() { return { gas: [...ped.gas], brake: [...ped.brake] }; },
    sfx, start, pause, resume, showMenu, toggleMute, buy, finish,
    // dùng cho test: tua nhanh mô phỏng (bỏ qua thời gian thực) rồi xử lý sự kiện
    step(seconds, inp = { gas: false, brake: false }) { if (!s) return; L.simulate(s, inp, seconds); onEvents(); hud(); return s; },
    hud, draw,
    destroy() {
      destroyed = true; cancelAnimationFrame(raf);
      for (const t of timers) clearTimeout(t);
      document.removeEventListener("keydown", onKey); document.removeEventListener("keyup", onKey);
      document.removeEventListener("visibilitychange", onVis); window.removeEventListener("blur", onBlur); window.removeEventListener("resize", onResize);
      if (ro) ro.disconnect(); sfx.close();
    },
  };
}
