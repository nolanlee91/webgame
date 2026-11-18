// Nối Thú — phần vẽ (canvas), điều khiển, HUD, âm thanh, lưu tiến độ. Luật chơi nằm hết trong logic.js.
import { LEVELS, newGame, nextLevel, retryLevel, pick, hint, shuffle, tick, remaining, H, W } from "./logic.js";
import { TILES, renderAnimal } from "./sprites.js";

const TILE_ART_SIZE = 64;
const TILE_ART_COLUMNS = 6;

const SAVE_KEY = "wgp.noithu.v1";
const C = {
  board: "#27433c", boardDither: "#304c41", plank: "#254039", rim: "#4a7361", rimHi: "#83a18a", rimD: "#263e32", panel: "#1d1a16", line: "#0a0807", outline: "#2b1d14",
  face: "#efe2c2", faceHi: "#fff6de", depth: "#bfa77a", depthD: "#8d7650", back: "#7a5634", backHi: "#9a7046",
  gold: "#ffc94a", goldD: "#a8741a", teal: "#7fd47f", tealD: "#17521c", goldL: "#ffe9a8", red: "#e0483d", ink: "#f4ead2",
};
// Hướng ô dồn → mũi tên hiển thị (khi bàn xoay dọc trên điện thoại, hàng logic thành cột nên mũi tên xoay theo).
const ARROW = { none: ["—", "—"], down: ["↓", "→"], up: ["↑", "←"], left: ["←", "↑"], right: ["→", "↓"] };

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
    play(n, vol = 1, delay = 0) {
      if (muted() || !ac || !buf[n]) return false;
      if (ac.state === "suspended") ac.resume().catch(() => {});
      const s = ac.createBufferSource(), gn = ac.createGain();
      s.buffer = buf[n]; gn.gain.value = vol; s.connect(gn).connect(ac.destination);
      s.start(ac.currentTime + delay);
      log.push({ n, t: Math.round(performance.now() + delay * 1000) });
      if (log.length > 500) log.shift();
      return true;
    },
    get loaded() { return Object.keys(buf).length; },
    log,
    close() { if (ac) ac.close().catch(() => {}); },
  };
}

function loadSave() {
  try { const v = JSON.parse(localStorage.getItem(SAVE_KEY)); if (v && typeof v === "object") return { unlocked: Math.min(LEVELS.length - 1, Math.max(0, v.unlocked | 0)), best: Math.max(0, v.best | 0) }; } catch {}
  return { unlocked: 0, best: 0 };
}
const fmtTime = (t) => { const s = Math.ceil(t); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
const ease = (k) => 1 - (1 - k) * (1 - k);

export function mount(root, ctx = {}) {
  const sdk = ctx.sdk || { sound: { muted: false } };
  const $ = (id) => root.querySelector("#" + id) || document.getElementById(id);
  const cv = $("cv"), stage = $("stage"), g2 = cv.getContext("2d");
  const ui = {
    level: $("hLevel"), score: $("hScore"), grav: $("hGrav"), time: $("hTime"), bar: $("hBar"), fill: $("hFill"),
    hint: $("hintBtn"), hintN: $("hintN"), shuf: $("shufBtn"), shufN: $("shufN"), pause: $("pauseBtn"), mute: $("muteBtn"), muteIc: $("muteIc"),
    ovMenu: $("ovMenu"), ovPause: $("ovPause"), ovEnd: $("ovEnd"), mActions: $("mActions"), mBest: $("mBest"), mLvls: $("mLvls"),
    eTitle: $("eTitle"), eSub: $("eSub"), eResult: $("eResult"), eRecord: $("eRecord"), eActions: $("eActions"),
  };
  const sfx = makeSfx("assets/sfx/", ["buoc-nhay", "trung-kim-cuong", "trung-da", "do-xuc-xac", "het-gio", "qua-man", "thang", "thua"], sdk);
  const sprites = TILES.map((t) => renderAnimal(t));
  const tileArt = new Image();
  tileArt.src = new URL("assets/sprites/tiles-v2.webp", import.meta.url);
  let save = loadSave();
  let s = null;                // trạng thái logic (null = đang ở menu)
  let paused = false, destroyed = false, raf = 0, last = performance.now();
  let seedBase = ctx.seed ?? (Date.now() & 0xffffff);
  let L = { cs: 40, ox: 0, oy: 0, tr: false, dpr: 1, w: 0, h: 0 };
  let cursor = null;           // ô đang trỏ bằng bàn phím [r,c]
  let fx = { pops: [], paths: [], floats: [], slides: new Map(), shake: null, hint: null, banner: null };
  let newRecord = false;

  // ---------- Bố cục: bàn tự xoay dọc khi khung chơi cao hơn rộng (điện thoại cầm dọc) ----------
  function layout() {
    const r = stage.getBoundingClientRect();
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    const rows = s ? H(s.grid) - 2 : 9, cols = s ? W(s.grid) - 2 : 16;
    const tr = h > w * 1.05;
    const dw = (tr ? rows : cols) + 1, dh = (tr ? cols : rows) + 1; // +1 = nửa ô viền mỗi bên (đường nối đi qua)
    const cs = Math.max(14, Math.min(84, Math.floor(Math.min((w - 12) / dw, (h - 12) / dh))));
    L = { cs, tr, dpr, w, h, ox: Math.round((w - dw * cs) / 2), oy: Math.round((h - dh * cs) / 2), dw, dh };
  }
  const center = (r, c) => (L.tr ? [L.ox + r * L.cs, L.oy + c * L.cs] : [L.ox + c * L.cs, L.oy + r * L.cs]);
  function cellAt(x, y) {
    const a = Math.round((x - L.ox) / L.cs), b = Math.round((y - L.oy) / L.cs);
    const [r, c] = L.tr ? [a, b] : [b, a];
    if (!s || r < 1 || c < 1 || r > H(s.grid) - 2 || c > W(s.grid) - 2) return null;
    const [cx, cy] = center(r, c);
    if (Math.abs(x - cx) > L.cs / 2 || Math.abs(y - cy) > L.cs / 2) return null;
    return [r, c];
  }
  const ro = new ResizeObserver(() => { layout(); draw(performance.now()); });
  ro.observe(stage);

  // ---------- Vẽ ----------
  let ditherPat = null, ditherU = 0;
  function dither(u) {
    if (ditherPat && ditherU === u) return ditherPat;
    const p = document.createElement("canvas"); p.width = p.height = 4 * u;
    const x = p.getContext("2d"); x.fillStyle = C.board; x.fillRect(0, 0, 4 * u, 4 * u);
    x.fillStyle = C.boardDither; x.fillRect(0, 0, u, u); x.fillRect(2 * u, 2 * u, u, u);
    ditherU = u; ditherPat = g2.createPattern(p, "repeat"); return ditherPat;
  }
  function drawTile(x, y, t, opt = {}) {
    const d = L.dpr, size = L.cs - Math.max(2, Math.round(L.cs * 0.06));
    const u = Math.max(1, Math.round(size * d / 26));
    let X = Math.round((x - size / 2) * d), Y = Math.round((y - size / 2) * d);
    const S = Math.round(size * d), dep = 4 * u;
    if (opt.lift) Y -= 2 * u;
    if (opt.scale && opt.scale !== 1) { const ns = Math.round(S * opt.scale); X += (S - ns) >> 1; Y += (S - ns) >> 1; return drawTileBox(X, Y, ns, u, t, opt, Math.max(u, Math.round(dep * opt.scale))); }
    drawTileBox(X, Y, S, u, t, opt, dep);
  }
  function drawTileBox(X, Y, S, u, t, opt, dep) {
    // bóng cứng lệch xuống-phải
    g2.fillStyle = "rgba(0,0,0,.45)"; g2.fillRect(X + 2 * u, Y + 2 * u, S, S);
    g2.fillStyle = C.outline; g2.fillRect(X, Y, S, S);
    const back = opt.back;
    g2.fillStyle = back ? C.back : opt.sel ? "#fff1c2" : C.face; g2.fillRect(X + u, Y + u, S - 2 * u, S - 2 * u);
    g2.fillStyle = back ? C.backHi : C.faceHi; g2.fillRect(X + u, Y + u, S - 2 * u, u); g2.fillRect(X + u, Y + u, u, S - 2 * u - dep);
    g2.fillStyle = back ? "#5a3e24" : C.depth; g2.fillRect(X + u, Y + S - u - dep, S - 2 * u, dep);
    g2.fillStyle = back ? "#3e2a18" : C.depthD; g2.fillRect(X + u, Y + S - u - u, S - 2 * u, u);
    if (back) { g2.fillStyle = "#5a3e24"; const q = Math.max(u, Math.round(S / 8)); g2.fillRect(X + (S >> 1) - q, Y + (S >> 1) - q - (dep >> 1), 2 * q, 2 * q); }
    else if (t) {
      const room = Math.max(u, S - dep - 3 * u), sz = Math.round(room);
      const x = X + ((S - sz) >> 1), y = Y + ((S - dep - sz) >> 1);
      const index = t - 1;
      if (tileArt.naturalWidth) {
        const col = index % TILE_ART_COLUMNS, row = Math.floor(index / TILE_ART_COLUMNS);
        g2.imageSmoothingEnabled = true;
        g2.drawImage(tileArt, col * TILE_ART_SIZE, row * TILE_ART_SIZE, TILE_ART_SIZE, TILE_ART_SIZE, x, y, sz, sz);
        g2.imageSmoothingEnabled = false;
      } else g2.drawImage(sprites[index], x, y, sz, sz);
    }
    const ring = (col, w) => { g2.fillStyle = col; g2.fillRect(X - w, Y - w, S + 2 * w, w); g2.fillRect(X - w, Y + S, S + 2 * w, w); g2.fillRect(X - w, Y, w, S); g2.fillRect(X + S, Y, w, S); };
    if (opt.sel) { ring(C.goldD, 3 * u); ring(C.gold, 2 * u); }
    if (opt.hint) { ring(C.tealD, 3 * u); ring(C.teal, 2 * u); }
    if (opt.bad) { ring(C.red, 2 * u); }
    if (opt.cursor) { g2.fillStyle = C.ink; const w = u, L2 = Math.max(3 * u, S >> 3);
      for (const [cx, cy, sx, sy] of [[X - 2 * w, Y - 2 * w, 1, 1], [X + S + w, Y - 2 * w, -1, 1], [X - 2 * w, Y + S + w, 1, -1], [X + S + w, Y + S + w, -1, -1]]) {
        g2.fillRect(sx > 0 ? cx : cx - L2 + w, cy, L2, w); g2.fillRect(cx, sy > 0 ? cy : cy - L2 + w, w, L2); } }
  }

  function draw(now) {
    const d = L.dpr;
    g2.setTransform(1, 0, 0, 1, 0, 0);
    g2.imageSmoothingEnabled = false;
    g2.clearRect(0, 0, cv.width, cv.height);
    if (!s) return;
    const u = Math.max(1, Math.round(L.cs * d / 26));
    // Lòng khay ít tương phản để các ô sáng nổi rõ.
    const bx = Math.round(L.ox * d), by = Math.round(L.oy * d), bw = Math.round(L.dw * L.cs * d), bh = Math.round(L.dh * L.cs * d), b3 = Math.max(1, Math.round(d));
    g2.fillStyle = "rgba(0,0,0,.6)"; g2.fillRect(bx + 4 * d + b3, by + 7 * d + b3, bw, bh);
    // Vành khay mỏng, giữ đủ khoảng trống cho đường nối bên ngoài.
    const rw = Math.max(b3 * 2, Math.round(L.cs * d * 0.10));
    g2.fillStyle = C.line; g2.fillRect(bx - rw - b3, by - rw - b3, bw + 2 * (rw + b3), bh + 2 * (rw + b3));
    g2.fillStyle = C.rim; g2.fillRect(bx - rw, by - rw, bw + 2 * rw, bh + 2 * rw);
    g2.fillStyle = C.rimHi; g2.fillRect(bx - rw, by - rw, bw + 2 * rw, Math.round(2 * d)); g2.fillRect(bx - rw, by - rw, Math.round(2 * d), bh + 2 * rw);
    g2.fillStyle = C.rimD; g2.fillRect(bx - rw, by + bh + rw - Math.round(2 * d), bw + 2 * rw, Math.round(2 * d)); g2.fillRect(bx + bw + rw - Math.round(2 * d), by - rw, Math.round(2 * d), bh + 2 * rw);
    g2.fillStyle = C.line; g2.fillRect(bx - b3, by - b3, bw + 2 * b3, bh + 2 * b3);
    g2.fillStyle = dither(Math.max(1, Math.round(2 * d))); g2.fillRect(bx, by, bw, bh);
    g2.fillStyle = C.plank; const ph = Math.max(2, Math.round(L.cs * d * 0.5)), pl = Math.max(1, Math.round(d));
    for (let y = by + ph, i = 0; y < by + bh; y += ph, i++) { g2.fillRect(bx, y, bw, pl); for (let x = bx + ((i * 3) % 7) * ph; x < bx + bw; x += ph * 7) g2.fillRect(x, y, pl, ph); }
    g2.fillStyle = "rgba(0,0,0,.28)"; g2.fillRect(bx, by, bw, Math.round(3 * d)); g2.fillRect(bx, by, Math.round(3 * d), bh); // bóng vành đổ vào lòng khay

    const hidden = paused && !s.ended;
    const hintIds = fx.hint && now < fx.hint.until ? fx.hint.ids : null;
    const blinkOn = Math.floor(now / 260) % 2 === 0;
    const sel = s.sel;
    // ô đang trượt (trọng lực) vẽ ở vị trí nội suy
    for (let r = 1; r < H(s.grid) - 1; r++) for (let c = 1; c < W(s.grid) - 1; c++) {
      const t = s.grid[r][c]; if (!t) continue;
      let [x, y] = center(r, c);
      const sl = fx.slides.get(t.id);
      if (sl) { const k = (now - sl.start) / 170; if (k >= 1) fx.slides.delete(t.id); else { const e = ease(Math.max(0, k)); const [fx0, fy0] = center(sl.from[0], sl.from[1]); x = fx0 + (x - fx0) * e; y = fy0 + (y - fy0) * e; } }
      let opt = { back: hidden };
      if (!hidden) {
        if (sel && sel[0] === r && sel[1] === c) opt.sel = opt.lift = true;
        if (hintIds && hintIds.has(t.id) && blinkOn) opt.hint = true;
        if (fx.shake && fx.shake.id === t.id && now - fx.shake.start < 300) { opt.bad = true; x += Math.round(Math.sin((now - fx.shake.start) / 22) * 3); }
      }
      if (cursor && cursor[0] === r && cursor[1] === c && document.activeElement === cv) opt.cursor = true;
      drawTile(x, y, t.t, opt);
    }
    // ô vừa nối: thu nhỏ theo bậc + hạt pixel bắn ra
    fx.pops = fx.pops.filter((p) => now - p.start < 320);
    for (const p of fx.pops) {
      const [px, py] = center(...p.at);
      const k = (now - p.start) / 320, step = Math.floor(k * 4) / 4;
      if (step < 0.75) drawTile(px, py, p.t, { scale: 1 - step, sel: true });
      g2.fillStyle = step < 0.5 ? C.gold : C.ink;
      const q = Math.max(2, Math.round(L.cs * d / 10)), dist = L.cs * d * (0.3 + k * 0.5);
      for (const [dx, dy] of [[1, 1], [-1, 1], [1, -1], [-1, -1], [0, 1.3], [0, -1.3]]) g2.fillRect(Math.round(px * d + dx * dist - q / 2), Math.round(py * d + dy * dist - q / 2), q, q);
    }
    // đường nối: viền vàng tối + lõi vàng sáng (như ảnh bìa), góc vuông kiểu pixel
    fx.paths = fx.paths.filter((p) => now - p.start < 380);
    for (const p of fx.paths) {
      const pts = p.pts.map(([r, c]) => center(r, c).map((v) => Math.round(v * d)));
      g2.lineJoin = "miter"; g2.lineCap = "square";
      for (const [col, wd] of [[C.goldD, Math.max(4, Math.round(L.cs * d * 0.22))], [C.gold, Math.max(3, Math.round(L.cs * d * 0.13))], [C.goldL, Math.max(1, Math.round(L.cs * d * 0.05))]]) {
        g2.strokeStyle = col; g2.lineWidth = wd; g2.beginPath(); pts.forEach(([x, y], i) => (i ? g2.lineTo(x, y) : g2.moveTo(x, y))); g2.stroke();
      }
      g2.fillStyle = C.ink; const q = Math.max(3, Math.round(L.cs * d * 0.12));
      for (const [x, y] of pts.slice(1, -1)) g2.fillRect(x - q / 2, y - q / 2, q, q);
    }
    // điểm nổi lên
    fx.floats = fx.floats.filter((f) => now - f.start < 700);
    g2.textAlign = "center"; g2.textBaseline = "middle";
    for (const f of fx.floats) {
      const [fx0, fy0] = center(...f.at), k = (now - f.start) / 700, y = (fy0 - L.cs * 0.6 - k * L.cs * 0.8) * d;
      g2.font = `800 ${Math.round(Math.max(13, L.cs * 0.42) * d)}px "Be Vietnam Pro", system-ui`;
      g2.fillStyle = "#000"; g2.fillText(f.text, fx0 * d + 2 * d, y + 2 * d);
      g2.fillStyle = f.col; g2.fillText(f.text, fx0 * d, y);
    }
    // băng rôn đầu màn / tự đảo
    if (fx.banner && now < fx.banner.until && !hidden) {
      const fs = Math.round(Math.max(16, Math.min(30, L.cs * 0.55)) * d);
      g2.font = `800 ${fs}px "Be Vietnam Pro", system-ui`;
      const tw = g2.measureText(fx.banner.text).width + fs * 1.6, th = fs * 2.1, x = (L.w * d - tw) / 2, y = (L.h * d - th) / 2;
      g2.fillStyle = "rgba(0,0,0,.6)"; g2.fillRect(x + 4 * d, y + 7 * d, tw, th);
      g2.fillStyle = C.line; g2.fillRect(x - b3, y - b3, tw + 2 * b3, th + 2 * b3);
      g2.fillStyle = C.panel; g2.fillRect(x, y, tw, th);
      g2.fillStyle = "rgba(255,255,255,.13)"; g2.fillRect(x, y, tw, 2 * d);
      g2.fillStyle = C.ink; g2.fillText(fx.banner.text, L.w * d / 2, L.h * d / 2 + d);
    }
  }

  // ---------- HUD ----------
  let hudCache = "";
  function hud() {
    if (!s) return;
    const low = s.time <= 20 && s.status === "playing";
    const key = [s.level, s.score, Math.ceil(s.time), s.hints, s.shuffles, L.tr, low, s.status, paused].join("|");
    ui.fill.style.width = (100 * s.time / s.timeMax).toFixed(2) + "%";
    if (key === hudCache) return; hudCache = key;
    ui.level.textContent = s.level + 1 + "/" + LEVELS.length;
    ui.score.textContent = s.score;
    ui.grav.textContent = ARROW[s.gravity][L.tr ? 1 : 0];
    ui.time.textContent = fmtTime(s.time);
    ui.bar.classList.toggle("low", low);
    const live = s.status === "playing" && !paused;
    ui.hintN.textContent = s.hints; ui.hint.disabled = !live || s.hints <= 0;
    ui.shufN.textContent = s.shuffles; ui.shuf.disabled = !live || s.shuffles <= 0;
    ui.pause.disabled = s.status !== "playing";
  }
  function showMute() {
    const m = !!sdk.sound.muted;
    ui.muteIc.src = "assets/ui/icon-am-thanh-" + (m ? "tat" : "bat") + ".png";
    ui.mute.setAttribute("aria-pressed", String(m)); ui.mute.title = m ? "Âm thanh: tắt (M)" : "Âm thanh: bật (M)";
  }
  function toggleMute() { sdk.sound.muted = !sdk.sound.muted; localStorage.setItem("wgp.muted", sdk.sound.muted ? "1" : "0"); showMute(); }

  // ---------- Luồng màn chơi ----------
  const nextSeed = () => (seedBase = (seedBase * 1103515245 + 12345) & 0x7fffffff);
  function startState(st) {
    s = st; paused = false; cursor = null; newRecord = false;
    fx = { pops: [], paths: [], floats: [], slides: new Map(), shake: null, hint: null, banner: null };
    ui.ovMenu.hidden = ui.ovPause.hidden = ui.ovEnd.hidden = true;
    layout(); hudCache = "";
    const g = s.gravity === "none" ? "" : " · ô dồn " + ARROW[s.gravity][L.tr ? 1 : 0];
    fx.banner = { text: "Màn " + (s.level + 1) + g, until: performance.now() + 1500 };
    last = performance.now(); warnSec = -1;
    sfx.play("qua-man", 0.5);
    cv.focus({ preventScroll: true });
  }
  const startLevel = (lv) => startState(newGame({ level: lv, seed: nextSeed() }));

  function persist() {
    const before = save.best;
    if (s.status === "cleared") save.unlocked = Math.max(save.unlocked, Math.min(LEVELS.length - 1, s.level + 1));
    if (s.score > save.best) save.best = s.score;
    newRecord = s.score > before && s.score > 0;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch {}
  }

  function btn(label, cls, fn, id) {
    const b = document.createElement("button"); b.type = "button"; b.className = "btn btn--big" + (cls ? " " + cls : ""); b.textContent = label; b.onclick = fn; if (id) b.id = id; return b;
  }
  function showMenu() {
    if (s) sfx.play("buoc-nhay", 0.35);
    s = null; paused = false; hudCache = "";
    ui.level.textContent = "–"; ui.score.textContent = "0"; ui.grav.textContent = "—"; ui.time.textContent = "–:––"; ui.fill.style.width = "100%"; ui.bar.classList.remove("low");
    for (const b of [ui.hint, ui.shuf, ui.pause]) b.disabled = true;
    ui.ovPause.hidden = ui.ovEnd.hidden = true; ui.ovMenu.hidden = false;
    save = loadSave();
    ui.mActions.replaceChildren(...(save.unlocked > 0
      ? [btn("▶ Chơi tiếp màn " + (save.unlocked + 1), "btn--primary", () => startLevel(save.unlocked), "playBtn"), btn("Chơi từ màn 1", "", () => startLevel(0), "freshBtn")]
      : [btn("▶ Bắt đầu chơi", "btn--primary", () => startLevel(0), "playBtn")]));
    ui.mLvls.replaceChildren(...LEVELS.map((_, i) => { const e = document.createElement("i"); if (i <= save.unlocked) e.className = "on"; return e; }));
    ui.mBest.textContent = save.best ? "Kỷ lục của bạn: " + save.best + " điểm · đã mở " + (save.unlocked + 1) + "/" + LEVELS.length + " màn" : "Tiến độ được lưu tự động trên máy này.";
    draw(performance.now());
    setTimeout(() => { const p = root.querySelector("#playBtn"); p && p.focus({ preventScroll: true }); }, 0);
  }
  function showEnd() {
    persist();
    s.ended = true; paused = false; ui.ovPause.hidden = true;
    const lv = s.level + 1, rows = [];
    const row = (k, v, cls) => rows.push(`<span${cls ? ' class="' + cls + '"' : ""}>${k}</span><b>${v}</b>`);
    if (s.status === "timeout") {
      ui.eTitle.textContent = "Hết giờ!";
      ui.eSub.textContent = "Màn " + lv + " còn " + remaining(s) + " ô chưa nối. Thử lại nhé!";
      row("Cặp đã nối", s.pairs); row("Điểm", s.score, "total");
      ui.eActions.replaceChildren(btn("↻ Chơi lại màn " + lv, "btn--primary", () => startState(retryLevel(s, nextSeed())), "againBtn"), btn("Về menu", "", showMenu, "endMenuBtn"));
      sdk.gameOver && sdk.gameOver({ score: s.score, level: lv, result: "lose" });
    } else if (s.status === "cleared") {
      ui.eTitle.textContent = "Qua màn " + lv + "!";
      ui.eSub.textContent = "Bàn đã sạch. Màn " + (lv + 1) + " lớn hơn" + (LEVELS[lv].gravity !== "none" ? " và ô sẽ dồn " + ARROW[LEVELS[lv].gravity][L.tr ? 1 : 0] : "") + ".";
      row("Cặp đã nối", s.pairs); row("Thưởng thời gian", "+" + s.bonus); row("Tổng điểm", s.score, "total");
      ui.eActions.replaceChildren(btn("Màn " + (lv + 1) + " →", "btn--primary", () => startState(nextLevel(s, nextSeed())), "nextBtn"), btn("Về menu", "", showMenu, "endMenuBtn"));
    } else {
      ui.eTitle.textContent = "Phá đảo 8 màn!";
      ui.eSub.textContent = "Bạn đã dọn sạch cả 8 bàn. Rủ bạn vào chơi thử xem ai điểm cao hơn!";
      row("Thưởng thời gian màn cuối", "+" + s.bonus); row("Tổng điểm", s.score, "total");
      ui.eActions.replaceChildren(btn("↻ Chơi lại từ màn 1", "btn--primary", () => startLevel(0), "againBtn"), btn("Về menu", "", showMenu, "endMenuBtn"));
      sdk.gameOver && sdk.gameOver({ score: s.score, level: lv, result: "win" });
    }
    ui.eResult.innerHTML = rows.join("");
    if (newRecord) sfx.play("trung-kim-cuong", 0.7, 0.8); // kỷ lục mới, trễ 0,8 s sau tiếng thắng/thua
    ui.eRecord.innerHTML = newRecord ? '<span class="record">Kỷ lục mới!</span>' : '<div class="best">Kỷ lục: ' + save.best + " điểm</div>";
    sdk.reportScore && sdk.reportScore(s.score);
    ui.ovEnd.hidden = false; hudCache = ""; hud();
    setTimeout(() => { const b = ui.eActions.querySelector(".btn--primary"); b && b.focus({ preventScroll: true }); }, 0);
  }
  function setPaused(p) {
    if (!s || s.status !== "playing" || paused === p) return;
    paused = p; ui.ovPause.hidden = !p; hudCache = "";
    sfx.play("buoc-nhay", 0.4);
    if (p) setTimeout(() => $("resumeBtn").focus({ preventScroll: true }), 0); else { last = performance.now(); cv.focus({ preventScroll: true }); }
  }

  // ---------- Hành động người chơi ----------
  function doPick(p) {
    if (!s || paused || s.status !== "playing" || !p) return;
    sfx.unlock();
    const now = performance.now();
    const e = pick(s, p);
    if (e.type === "ignored") return;
    if (e.type === "select" || e.type === "deselect") sfx.play("buoc-nhay", 0.55);
    if (e.type === "mismatch" || e.type === "blocked") {
      const [r, c] = e.from; const t = s.grid[r][c]; fx.shake = { id: t && t.id, start: now }; sfx.play("trung-da", 0.5);
      if (e.type === "blocked") { fx.floats.push({ at: e.at, text: "Bị chặn", col: C.red, start: now }); }
    }
    if (e.type === "match") {
      fx.hint = null;
      fx.paths.push({ pts: e.path, start: now });
      for (const t of e.removed) fx.pops.push({ at: t.at, t: t.t, start: now + 60 });
      for (const m of e.moves) fx.slides.set(m.id, { from: m.from, start: now + 140 });
      fx.floats.push({ at: e.removed[1].at, text: "+" + e.gained + (e.combo ? " x" + (e.combo + 1) : ""), col: e.combo ? C.goldL : C.ink, start: now });
      sfx.play("trung-kim-cuong", 0.8);
      if (e.autoShuffle) { fx.banner = { text: "Hết nước đi · tự đảo bàn", until: now + 1400 }; sfx.play("do-xuc-xac", 0.8, 0.25); }
      if (e.cleared) { sfx.play(s.status === "won" ? "thang" : "qua-man", 1, 0.3); setTimeout(() => !destroyed && s && showEnd(), 650); }
    }
    hud();
  }
  function doHint() {
    if (!s || paused) return;
    const h = hint(s); if (!h) return;
    sfx.unlock(); sfx.play("buoc-nhay", 0.7);
    fx.hint = { ids: new Set([s.grid[h.a[0]][h.a[1]].id, s.grid[h.b[0]][h.b[1]].id]), until: performance.now() + 3000 };
    hud();
  }
  function doShuffle() {
    if (!s || paused) return;
    if (!shuffle(s)) return;
    sfx.unlock(); sfx.play("do-xuc-xac", 0.8);
    fx.hint = null; fx.slides.clear();
    hud();
  }

  // Chạm/nhấp: dùng pointerdown để phản hồi ngay (cả chuột lẫn cảm ứng), một lần bấm = một lần chọn.
  const onPointer = (e) => {
    if (e.button > 0) return;
    const r = cv.getBoundingClientRect();
    const p = cellAt(e.clientX - r.left, e.clientY - r.top);
    if (p) { cursor = null; doPick(p); }
    cv.focus({ preventScroll: true });
    e.preventDefault();
  };
  cv.addEventListener("pointerdown", onPointer);
  cv.addEventListener("contextmenu", (e) => e.preventDefault());

  const onKey = (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.code === "KeyM" && !e.repeat) { toggleMute(); return; }
    if (!s) return;
    if ((e.code === "KeyP" || e.code === "Escape") && !e.repeat && s.status === "playing") { setPaused(!paused); e.preventDefault(); return; }
    if (paused || s.status !== "playing") return;
    if (e.code === "KeyH" && !e.repeat) { doHint(); return; }
    if (e.code === "KeyS" && !e.repeat) { doShuffle(); return; }
    if (document.activeElement !== cv) return;
    const mv = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[e.code];
    if (mv) {
      e.preventDefault();
      const rows = H(s.grid) - 2, cols = W(s.grid) - 2;
      if (!cursor) cursor = s.sel ? [...s.sel] : [1, 1];
      else { // phím mũi tên đi theo hướng trên màn hình (kể cả khi bàn xoay dọc)
        const [dx, dy] = mv; const [dr, dc] = L.tr ? [dx, dy] : [dy, dx];
        cursor = [Math.min(rows, Math.max(1, cursor[0] + dr)), Math.min(cols, Math.max(1, cursor[1] + dc))];
      }
    } else if ((e.code === "Enter" || e.code === "Space") && cursor) { e.preventDefault(); doPick(cursor); }
  };
  window.addEventListener("keydown", onKey);

  ui.hint.onclick = () => doHint();
  ui.shuf.onclick = () => doShuffle();
  ui.pause.onclick = () => setPaused(true);
  ui.mute.onclick = () => toggleMute();
  $("resumeBtn").onclick = () => setPaused(false);
  $("retryBtnP").onclick = () => { if (s) startState(retryLevel(s, nextSeed())); };
  $("menuBtnP").onclick = () => showMenu();
  // Tự dừng khi chuyển tab / rời cửa sổ để không mất giờ oan
  const onVis = () => { if (document.hidden) setPaused(true); };
  const onBlur = () => setPaused(true);
  document.addEventListener("visibilitychange", onVis);
  window.addEventListener("blur", onBlur);

  // cảnh báo sắp hết giờ: một tiếng khi còn 20 s, rồi tích mỗi giây từ 5 s
  let warnSec = -1;
  function frame(now) {
    if (destroyed) return;
    const dt = Math.min(0.1, Math.max(0, (now - last) / 1000)); last = now;
    if (s && !paused && s.status === "playing") {
      const e = tick(s, dt);
      if (e && e.type === "timeout") { sfx.play("het-gio"); sfx.play("thua", 1, 0.65); showEnd(); }
      else { const sec = Math.ceil(s.time); if (sec !== warnSec && (sec === 20 || (sec <= 5 && sec > 0))) { warnSec = sec; sfx.play("het-gio", sec === 20 ? 0.55 : 0.3); } }
    }
    hud(); draw(now);
    raf = requestAnimationFrame(frame);
  }

  showMute(); layout(); showMenu();
  if (Number.isInteger(ctx.startLevel) && ctx.startLevel >= 0 && ctx.startLevel < LEVELS.length) startLevel(ctx.startLevel);
  raf = requestAnimationFrame(frame);

  return {
    get state() { return s; },
    get paused() { return paused; },
    get layout() { return { ...L }; },
    get sfx() { return { loaded: sfx.loaded, log: sfx.log.slice() }; },
    // Toạ độ tâm ô (px trong trang) — để test tự động bấm đúng chỗ như người thật.
    cellPoint(r, c) { const b = cv.getBoundingClientRect(); const [x, y] = center(r, c); return [b.left + x, b.top + y]; },
    pause: () => setPaused(true), resume: () => setPaused(false),
    destroy() { destroyed = true; cancelAnimationFrame(raf); ro.disconnect(); sfx.close(); window.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onVis); window.removeEventListener("blur", onBlur); },
  };
}
