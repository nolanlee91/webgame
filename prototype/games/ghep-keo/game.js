// Ghép Kẹo — phần hiển thị + điều khiển. Luật nằm ở logic.js (không đụng DOM).
// Kẹo là sprite pixel 16×16 vẽ bằng canvas ngay khi tải trang (không dùng ảnh AI), mỗi loại một hình riêng
// để người mù màu vẫn phân biệt được: tròn, vuông, thoi, giọt, lục giác, tim + kẹo sao cầu vồng.
import * as L from "./logic.js";

const SAVE_KEY = "wgp.ghep-keo.v1";
const IDLE_HINT = 6; // giây không thao tác thì tự gợi ý

// [nền, sáng, tối] theo bảng màu Art Bible V5
const PAL = [
  ["#e0483d", "#ff8a7a", "#8e2219"], // đỏ — tròn
  ["#e8954a", "#ffc58a", "#8a4a14"], // cam — vuông
  ["#ffc94a", "#fff0a8", "#a8740e"], // vàng — thoi
  ["#3f9a45", "#7fd47f", "#1d5222"], // lá — giọt
  ["#3a7bd5", "#8ab8ff", "#1a3f7a"], // xanh dương — lục giác
  ["#8a5cc2", "#c8a4f0", "#4a2a72"], // tím — tim
];
const KIND_NAME = ["kẹo đỏ", "kẹo cam", "kẹo vàng", "kẹo xanh lá", "kẹo xanh dương", "kẹo tím"];
const RAINBOW = ["#e0483d", "#e8954a", "#ffc94a", "#3f9a45", "#3a7bd5", "#8a5cc2"];
const OUT = "#160d0a";

// ---------- Sprite ----------
const SHAPES = [
  (x, y) => (x - 7.5) ** 2 + (y - 7.5) ** 2 <= 7 ** 2,
  (x, y) => x >= 1 && x <= 14 && y >= 1 && y <= 14 && !((x <= 1 || x >= 14) && (y <= 1 || y >= 14)),
  (x, y) => Math.abs(x - 7.5) + Math.abs(y - 7.5) <= 8,
  (x, y) => (y >= 8 && (x - 7.5) ** 2 + (y - 9) ** 2 <= 6.2 ** 2) || (y >= 0 && y < 9.5 && Math.abs(x - 7.5) <= y * 0.68 + 0.3),
  (x, y) => { const dx = Math.abs(x - 7.5), dy = Math.abs(y - 7.5); return dy <= 6.4 && dx <= 7.6 - dy * 0.62; },
  (x, y) => { const u = (x - 7.5) / 6.6, v = -(y - 7.2) / 6.6; return (u * u + v * v - 1) ** 3 - u * u * v * v * v <= 0; },
];
const spriteCache = new Map();
function sprite(k, sp) {
  const key = k + ":" + (sp || "");
  if (spriteCache.has(key)) return spriteCache.get(key);
  const c = document.createElement("canvas"); c.width = c.height = 16;
  const g = c.getContext("2d");
  const star = k === L.STAR;
  const shape = star ? SHAPES[0] : SHAPES[k];
  const m = (x, y) => x >= 0 && y >= 0 && x < 16 && y < 16 && shape(x, y);
  const edge = (x, y) => m(x, y) && (!m(x - 1, y) || !m(x + 1, y) || !m(x, y - 1) || !m(x, y + 1));
  const inner = (x, y) => m(x, y) && !edge(x, y);
  const [base, lite, dark] = star ? ["#f4ead2", "#ffffff", "#8a7a64"] : PAL[k];
  const px = (x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    if (!m(x, y)) continue;
    if (edge(x, y)) { px(x, y, sp === "b" ? "#ffc94a" : OUT); continue; }
    let col = base;
    if (star) { const a = Math.atan2(y - 7.5, x - 7.5) + Math.PI; col = RAINBOW[Math.floor(a / (Math.PI * 2) * 6 + 0.5) % 6]; }
    if (!inner(x - 2, y) || !inner(x, y - 2) || !inner(x - 1, y - 1)) col = star ? col : lite;
    else if (!inner(x + 2, y) || !inner(x, y + 2) || !inner(x + 1, y + 1)) col = star ? col : dark;
    if (sp === "h" && (y === 5 || y === 8 || y === 11)) col = (x + y) % 2 ? "#fff4e0" : "#ffe9c9";
    if (sp === "v" && (x === 5 || x === 8 || x === 11)) col = (x + y) % 2 ? "#fff4e0" : "#ffe9c9";
    px(x, y, col);
  }
  if (star) { for (const [x, y] of [[7, 5], [8, 5], [6, 7], [7, 7], [8, 7], [9, 7], [7, 9], [8, 9], [7, 6], [8, 6], [7, 8], [8, 8], [6, 9], [9, 9]]) px(x, y, "#fff4e0"); }
  else if (sp === "b") { for (const [x, y] of [[7, 6], [8, 6], [6, 7], [7, 7], [8, 7], [9, 7], [6, 8], [7, 8], [8, 8], [9, 8], [7, 9], [8, 9]]) px(x, y, OUT); px(7, 7, "#ffc94a"); px(9, 5, "#ffc94a"); px(10, 4, "#fff4e0"); }
  // điểm bóng trắng góc trên trái
  for (const [x, y] of [[4, 4], [5, 4], [4, 5]]) if (inner(x, y) && !(sp === "h" && y === 5)) px(x, y, "#fff8ec");
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
    const avail = Math.max(160, Math.min(r.width - 14, r.height - 14 - hintH, 680));
    const fr = Math.max(6, Math.min(14, Math.round(avail * 0.022)));
    const cs = Math.floor((avail - 2 * fr - 6) / L.W);
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
    show(ov.win);
    sfx.play("thang", 0.6);
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
    show(ov.lose);
    $("retryBtn").focus({ preventScroll: true });
  }

  // ---------- Gợi ý ----------
  function hint() {
    if (!s || s.status !== "playing" || busy || anyOverlay()) return null;
    hintPair = L.findMove(s.cells);
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
      if (!busy && !hintPair && sel < 0) { idle += dt; if (idle > IDLE_HINT) { idle = 0; hint(); } }
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
