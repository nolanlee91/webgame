// Xếp Gạch — phần vẽ (canvas), điều khiển (phím, chạm, nút), HUD, âm thanh, lưu kỷ lục. Luật chơi nằm hết trong logic.js.
import { W, H, HIDDEN, KINDS, SHAPES, CLEAR_TIME, SPRINT_LINES, newGame, step, move, rotate, softDrop, hardDrop, holdPiece, ghostY, cellsOf, stackHeight } from "./logic.js";
import { shareResult } from "../_shared/share.js?v=s2";

const SAVE_KEY = "wgp.xepgach.v1";
// Màu gạch theo khối (index 1..7 = I O T S Z J L, 8 = gạch xám khi thua). [chính, gờ sáng, bóng tối]
// Đỏ/xanh dương/xanh lá/vàng lấy đúng màu 4 phường Art Bible V5; thêm ngọc, tím, cam cùng độ bão hoà ấm.
const PAL = [null,
  ["#2f9e8f", "#6fd0bb", "#0f3a33"], ["#f2b632", "#ffe08a", "#7a5410"], ["#8a5cc2", "#c49bf0", "#3e2363"],
  ["#3fae4a", "#8be08f", "#17521c"], ["#e0483d", "#ff8f84", "#7a1c17"], ["#3a7bd5", "#8fb8f0", "#163a73"],
  ["#d9762b", "#f7b072", "#6b3410"], ["#5b5348", "#7d7564", "#2a241d"]];
const C = { bg: "#17110c", board: "#15120f", dither: "#1b1713", guide: "#100d0b", line: "#0a0807", frame: "#4a3b2c", frameHi: "#6d5a44", frameD: "#2b2118",
  panel: "#1d1a16", ink: "#f4ead2", soft: "#b9ad93", dim: "#7d7564", teal: "#7fd47f", red: "#e0483d", gold: "#ffc94a" };
const DAS = 0.16, ARR = 0.045, SOFT_INT = 0.035;
const LV_CHOICES = [1, 3, 5, 7, 10, 15];
const FONT = '"Be Vietnam Pro", system-ui, sans-serif';

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
  const d = { best: { endless: 0, sprint: 0 }, mode: "endless", startLevel: 1 };
  try {
    const v = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (v && typeof v === "object") {
      d.best.endless = Math.max(0, (v.best && v.best.endless) | 0);
      d.best.sprint = Math.max(0, Number(v.best && v.best.sprint) || 0);
      if (v.mode === "sprint") d.mode = "sprint";
      if (LV_CHOICES.includes(v.startLevel)) d.startLevel = v.startLevel;
    }
  } catch {}
  return d;
}
const fmtTime = (t, ms = false) => {
  const m = Math.floor(t / 60), sec = t - m * 60;
  return m + ":" + (ms ? sec.toFixed(2).padStart(5, "0") : String(Math.floor(sec)).padStart(2, "0"));
};
const fmtNum = (n) => n.toLocaleString("vi-VN");

export function mount(root, ctx = {}) {
  const sdk = ctx.sdk || { sound: { muted: false } };
  const $ = (id) => root.querySelector("#" + id) || document.getElementById(id);
  const cv = $("cv"), stage = $("stage"), g = cv.getContext("2d");
  const ui = {
    score: $("hScore"), best: $("hBest"), lines: $("hLines"), linesL: $("hLinesL"), fill: $("hFill"), level: $("hLevel"), time: $("hTime"),
    pause: $("pauseBtn"), mute: $("muteBtn"), muteIc: $("muteIc"), pad: $("pad"),
    ovMenu: $("ovMenu"), ovPause: $("ovPause"), ovEnd: $("ovEnd"), lvPick: $("lvPick"), play: $("playBtn"), mBest: $("mBest"),
    eTitle: $("eTitle"), eSub: $("eSub"), eResult: $("eResult"), eRecord: $("eRecord"),
  };
  const sfx = makeSfx("assets/sfx/", ["buoc-nhay", "trung-kim-cuong", "trung-da", "do-xuc-xac", "qua-man", "thang", "thua", "het-gio"], sdk);
  let save = loadSave();
  let mode = save.mode, startLevel = save.startLevel;
  let s = null, paused = false, destroyed = false, raf = 0, last = performance.now();
  let seedBase = ctx.seed ?? (Date.now() & 0xffffff), games = 0;
  let L = { cs: 30, dpr: 1, w: 0, h: 0, bx: 0, by: 0, hold: null, next: null, nNext: 5, variant: "A" };
  let fx = { parts: [], floats: [], trails: [], flash: null, shake: null, banner: null, over: null, clear: null };
  let endTimer = 0, newRecord = false;

  // ---------- Bố cục canvas: bàn 10×20 + ô Giữ + hàng chờ, chọn kiểu cho ô to nhất ----------
  function layout() {
    const r = stage.getBoundingClientRect();
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    const FR = 0.45, BW = 10 + 2 * FR, BH = 20 + 2 * FR, GAP = 0.6;
    // A: Giữ bên trái, hàng chờ bên phải (máy tính). B: cột phải chứa cả Giữ + hàng chờ nhỏ (điện thoại dọc).
    const kA = 0.8, boxA = 4 * kA + 1.1, kB = 0.55, boxB = 4 * kB + 0.9;
    const csA = Math.min((w - 8) / (BW + 2 * (boxA + GAP)), (h - 8) / BH);
    const csB = Math.min((w - 8) / (BW + boxB + GAP * 0.7), (h - 8) / BH);
    const variant = csA >= csB * 0.97 ? "A" : "B";
    const cs = Math.max(10, Math.min(46, Math.floor(variant === "A" ? csA : csB)));
    const k = variant === "A" ? kA : kB, box = variant === "A" ? boxA : boxB, nNext = variant === "A" ? 5 : 3;
    const totW = variant === "A" ? BW + 2 * (box + GAP) : BW + box + GAP * 0.7;
    const ox = Math.round((w - totW * cs) / 2), oy = Math.round((h - BH * cs) / 2);
    const slot = 2.5 * k, head = 1.0, holdH = head + slot + 0.5, nextH = head + nNext * slot + 0.4;
    let bx, hold, next;
    if (variant === "A") {
      hold = { x: ox, y: oy, w: box * cs, h: holdH * cs };
      bx = ox + (box + GAP + FR) * cs;
      next = { x: ox + (box + GAP + BW + GAP) * cs, y: oy, w: box * cs, h: nextH * cs };
    } else {
      bx = ox + FR * cs;
      hold = { x: ox + (BW + GAP * 0.7) * cs, y: oy, w: box * cs, h: holdH * cs };
      next = { x: hold.x, y: oy + (holdH + 0.5) * cs, w: box * cs, h: nextH * cs };
    }
    L = { cs, dpr, w, h, bx: Math.round(bx), by: Math.round(oy + FR * cs), hold, next, k, slot, head, nNext, variant, fr: FR };
  }
  const ro = new ResizeObserver(() => { layout(); draw(performance.now()); });
  ro.observe(stage);
  // Tâm ô (cột x, hàng logic y) theo toạ độ CSS — dùng cho hiệu ứng và test.
  const cellPoint = (x, y) => [L.bx + (x + 0.5) * L.cs, L.by + (y - HIDDEN + 0.5) * L.cs];

  // ---------- Vẽ ----------
  const P = (v) => Math.round(v * L.dpr);
  let ditherPat = null, ditherKey = "";
  function boardPattern(u) {
    const key = u + "";
    if (ditherPat && ditherKey === key) return ditherPat;
    const p = document.createElement("canvas"); p.width = p.height = 4 * u;
    const x = p.getContext("2d"); x.fillStyle = C.board; x.fillRect(0, 0, 4 * u, 4 * u);
    x.fillStyle = C.dither; x.fillRect(0, 0, u, u); x.fillRect(2 * u, 2 * u, u, u);
    ditherKey = key; ditherPat = g.createPattern(p, "repeat"); return ditherPat;
  }
  // Một viên gạch pixel: viền vữa tối, gờ sáng trên-trái, bóng dưới-phải, mạch gạch so le + hạt sáng.
  function brick(X, Y, S, v, alpha = 1, white = 0) {
    const [base, hi, dk] = PAL[v], u = Math.max(1, Math.round(S / 14));
    g.globalAlpha = alpha;
    g.fillStyle = C.line; g.fillRect(X, Y, S, S);
    const ix = X + u, iy = Y + u, is = S - 2 * u;
    g.fillStyle = base; g.fillRect(ix, iy, is, is);
    g.fillStyle = hi; g.fillRect(ix, iy, is, u); g.fillRect(ix, iy, u, is);
    g.fillStyle = dk; g.fillRect(ix, iy + is - 2 * u, is, 2 * u); g.fillRect(ix + is - u, iy, u, is);
    if (S >= 12) {
      const mid = iy + Math.round(is / 2) - (u >> 1);
      g.globalAlpha = alpha * 0.55; g.fillStyle = dk;
      g.fillRect(ix + u, mid, is - 2 * u, u);
      g.fillRect(ix + Math.round(is * 0.6), iy + u, u, mid - iy - u);
      g.fillRect(ix + Math.round(is * 0.28), mid + u, u, iy + is - 2 * u - mid - u);
      g.globalAlpha = alpha * 0.8; g.fillStyle = hi;
      g.fillRect(ix + 2 * u, iy + 2 * u, u, u); g.fillRect(ix + Math.round(is * 0.72), mid + 2 * u, u, u);
    }
    if (white > 0) { g.globalAlpha = alpha * white; g.fillStyle = "#fff6de"; g.fillRect(X, Y, S, S); }
    g.globalAlpha = 1;
  }
  function ghostCell(X, Y, S, v) {
    const [, hi] = PAL[v], u = Math.max(1, Math.round(S / 14));
    g.globalAlpha = 0.16; g.fillStyle = hi; g.fillRect(X + u, Y + u, S - 2 * u, S - 2 * u);
    g.globalAlpha = 0.75; g.fillStyle = hi;
    g.fillRect(X + u, Y + u, S - 2 * u, u); g.fillRect(X + u, Y + S - 2 * u, S - 2 * u, u);
    g.fillRect(X + u, Y + u, u, S - 2 * u); g.fillRect(X + S - 2 * u, Y + u, u, S - 2 * u);
    g.globalAlpha = 1;
  }
  function pxPanel(x, y, w, h, border = C.line) { // khung pixel: viền 3px + gờ vát, không bo tròn
    const b = P(3), X = P(x), Y = P(y), Wd = P(w), Hd = P(h);
    g.fillStyle = "rgba(0,0,0,.6)"; g.fillRect(X + P(4), Y + P(7), Wd, Hd); g.fillRect(X + P(7), Y + P(4), Wd, Hd);
    g.fillStyle = border; g.fillRect(X - b, Y, Wd + 2 * b, Hd); g.fillRect(X, Y - b, Wd, Hd + 2 * b);
    g.fillStyle = C.panel; g.fillRect(X, Y, Wd, Hd);
    g.fillStyle = "rgba(255,255,255,.13)"; g.fillRect(X, Y, Wd, P(2));
    g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(X, Y + Hd - P(2), Wd, P(2));
  }
  function text(str, x, y, size, color, align = "center", shadow = true) {
    g.font = `800 ${P(size)}px ${FONT}`; g.textAlign = align; g.textBaseline = "middle";
    if (shadow) { g.fillStyle = "#000"; g.fillText(str, P(x) + P(2), P(y) + P(2)); }
    g.fillStyle = color; g.fillText(str, P(x), P(y));
  }
  function miniPiece(kind, cx, cy, k, alpha = 1) {
    const cells = SHAPES[kind][0], S = P(L.cs * k);
    const xs = cells.map((c) => c[0]), ys = cells.map((c) => c[1]);
    const w = Math.max(...xs) - Math.min(...xs) + 1, h = Math.max(...ys) - Math.min(...ys) + 1;
    const X0 = P(cx) - Math.round((w * S) / 2), Y0 = P(cy) - Math.round((h * S) / 2);
    for (const [x, y] of cells) brick(X0 + (x - Math.min(...xs)) * S, Y0 + (y - Math.min(...ys)) * S, S, KINDS.indexOf(kind) + 1, alpha);
  }
  // Bàn trang trí khi đang ở menu (chưa có ván)
  const DEMO = ["..........", "..........", "......3...", "1....33..5", "1.2224...5", "122774.665", "1777744665", "4455.33366", "4455233366", "7766222.11"];

  function draw(now) {
    const d = L.dpr, cs = L.cs;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, cv.width, cv.height);
    let sx = 0, sy = 0;
    if (fx.shake) {
      const k = 1 - (now - fx.shake.t0) / fx.shake.dur;
      if (k <= 0) fx.shake = null; else { sy = Math.round(fx.shake.amp * k * d) * ((now / 40 | 0) % 2 ? 1 : -1); sx = fx.shake.amp > 3 ? -sy / 2 : 0; }
    }
    g.translate(sx, sy);

    // --- khung bàn: gỗ sẫm vát, cảnh báo đỏ nhấp nháy khi gạch cao gần nóc ---
    const BX = P(L.bx), BY = P(L.by), BWd = P(cs * W), BHd = P(cs * 20), fr = P(cs * L.fr);
    const danger = s && s.status === "playing" && stackHeight(s) >= 17;
    const blink = danger && ((now / 250) | 0) % 2 === 0;
    g.fillStyle = "rgba(0,0,0,.6)"; g.fillRect(BX - fr + P(5), BY - fr + P(8), BWd + 2 * fr, BHd + 2 * fr);
    g.fillStyle = C.line; g.fillRect(BX - fr - P(3), BY - fr - P(3), BWd + 2 * fr + P(6), BHd + 2 * fr + P(6));
    g.fillStyle = blink ? "#7a1c17" : C.frame; g.fillRect(BX - fr, BY - fr, BWd + 2 * fr, BHd + 2 * fr);
    g.fillStyle = blink ? C.red : C.frameHi; g.fillRect(BX - fr, BY - fr, BWd + 2 * fr, P(3)); g.fillRect(BX - fr, BY - fr, P(3), BHd + 2 * fr);
    g.fillStyle = C.frameD; g.fillRect(BX - fr, BY + BHd + fr - P(4), BWd + 2 * fr, P(4)); g.fillRect(BX + BWd + fr - P(3), BY - fr, P(3), BHd + 2 * fr);
    // đinh tán 4 góc khung
    const rv = Math.max(P(3), Math.round(fr * 0.35));
    g.fillStyle = C.frameD;
    for (const [x, y] of [[BX - fr / 2, BY - fr / 2], [BX + BWd + fr / 2, BY - fr / 2], [BX - fr / 2, BY + BHd + fr / 2], [BX + BWd + fr / 2, BY + BHd + fr / 2]]) g.fillRect(Math.round(x - rv / 2), Math.round(y - rv / 2), rv, rv);
    g.fillStyle = C.line; g.fillRect(BX - P(3), BY - P(3), BWd + P(6), BHd + P(6));
    g.fillStyle = boardPattern(Math.max(1, P(cs / 10))); g.fillRect(BX, BY, BWd, BHd);
    g.fillStyle = C.guide;
    for (let x = 1; x < W; x++) g.fillRect(BX + P(x * cs) - (d > 1 ? 1 : 0), BY, Math.max(1, Math.round(d)), BHd);

    const S = P(cs), cx = (x) => BX + P(x * cs), cy = (y) => BY + P((y - HIDDEN) * cs);
    g.save(); g.beginPath(); g.rect(BX, BY, BWd, BHd); g.clip();
    const hide = paused && s && s.status === "playing";
    if (!s) {
      DEMO.forEach((row, i) => [...row].forEach((ch, x) => { if (ch !== ".") brick(cx(x), cy(H - DEMO.length + i), S, +ch, 0.55); }));
    } else if (hide) {
      g.fillStyle = "rgba(10,8,7,.55)"; g.fillRect(BX, BY, BWd, BHd);
    } else {
      // gạch đã xếp (+ hiệu ứng thua: xám dần từ đáy lên)
      const greyFrom = fx.over ? H - Math.floor(Math.min(1, (now - fx.over.t0) / 900) * 20) : H + 1;
      const clr = s.clearing ? s.clearing : null;
      const cp = clr ? 1 - clr.t / CLEAR_TIME : 0;
      for (let y = HIDDEN; y < H; y++) {
        const isClr = clr && clr.rows.includes(y);
        for (let x = 0; x < W; x++) {
          const v = s.board[y][x];
          if (!v) continue;
          if (isClr) {
            const order = Math.abs(x - 4.5) / 5;           // vỡ từ giữa ra hai bên
            if (cp > 0.35 + order * 0.55) continue;
            brick(cx(x), cy(y), S, v, 1, cp < 0.35 ? 0.85 * (1 - Math.abs(cp / 0.35 - 0.5) * 2) + 0.15 : 0.6);
            continue;
          }
          brick(cx(x), cy(y), S, y >= greyFrom ? 8 : v);
        }
      }
      if (fx.flash) {
        const k = 1 - (now - fx.flash.t0) / 140;
        if (k <= 0) fx.flash = null; else for (const [x, y] of fx.flash.cells) if (y >= HIDDEN && s.board[y][x]) { g.globalAlpha = 0.5 * k; g.fillStyle = "#fff6de"; g.fillRect(cx(x), cy(y), S, S); g.globalAlpha = 1; }
      }
      // vệt thả rơi
      fx.trails = fx.trails.filter((t) => now - t.t0 < 180);
      for (const t of fx.trails) {
        const k = 1 - (now - t.t0) / 180;
        for (const [x, top, bot] of t.cols) {
          const y0 = cy(Math.max(HIDDEN, top)), y1 = cy(bot);
          if (y1 <= y0) continue;
          g.globalAlpha = 0.28 * k; g.fillStyle = PAL[t.v][1];
          g.fillRect(cx(x) + Math.round(S * 0.2), y0, Math.round(S * 0.6), y1 - y0);
          g.globalAlpha = 0.5 * k; g.fillRect(cx(x) + Math.round(S * 0.42), y0, Math.max(1, Math.round(S * 0.16)), y1 - y0);
        }
        g.globalAlpha = 1;
      }
      if (s.cur && s.status === "playing") {
        const p = s.cur, v = KINDS.indexOf(p.kind) + 1, gy = ghostY(s);
        if (gy !== p.y) for (const [x, y] of cellsOf(p.kind, p.rot, p.x, gy)) if (y >= HIDDEN) ghostCell(cx(x), cy(y), S, v);
        const lockK = s.lock > 0 ? Math.min(1, s.lock / 0.5) : 0;   // sắp khoá thì gạch nháy sáng nhẹ
        for (const [x, y] of cellsOf(p.kind, p.rot, p.x, p.y)) if (y >= HIDDEN) brick(cx(x), cy(y), S, v, 1, lockK * 0.25 * (((now / 90) | 0) % 2));
      }
    }
    // hạt gạch vỡ
    const dt = 1 / 60;
    fx.parts = fx.parts.filter((q) => now - q.t0 < q.life);
    for (const q of fx.parts) {
      if (now < q.start) continue;
      const t = (now - q.start) / 1000, k = 1 - (now - q.t0) / q.life;
      const x = q.x + q.vx * t, y = q.y + q.vy * t + 900 * t * t;
      g.globalAlpha = Math.max(0, Math.min(1, k * 1.6)); g.fillStyle = q.c;
      g.fillRect(P(x), P(y), Math.max(1, P(q.sz)), Math.max(1, P(q.sz)));
    }
    g.globalAlpha = 1;
    void dt;
    g.restore();

    // chữ nổi + băng rôn (vẽ ngoài vùng cắt để chữ to không bị cụt)
    fx.floats = fx.floats.filter((f) => now - f.t0 < f.life);
    for (const f of fx.floats) {
      const k = (now - f.t0) / f.life, rise = Math.round(k * 4) * cs * 0.25;   // nhảy bậc kiểu pixel
      g.globalAlpha = k > 0.75 ? (1 - k) * 4 : 1;
      text(f.str, f.x, f.y - rise, f.size, f.c);
      g.globalAlpha = 1;
    }
    if (fx.banner) {
      const k = (now - fx.banner.t0) / fx.banner.life;
      if (k >= 1) fx.banner = null;
      else {
        const bw = cs * 9.2, bh = cs * 1.9, x = L.bx + cs * 0.4, y = L.by + cs * 6.5;
        const slide = k < 0.15 ? Math.round((1 - k / 0.15) * 4) * cs : 0;
        g.globalAlpha = k > 0.8 ? (1 - k) * 5 : 1;
        g.fillStyle = C.line; g.fillRect(P(x - slide) - P(3), P(y) - P(3), P(bw) + P(6), P(bh) + P(6));
        g.fillStyle = fx.banner.bg; g.fillRect(P(x - slide), P(y), P(bw), P(bh));
        g.fillStyle = "rgba(255,255,255,.18)"; g.fillRect(P(x - slide), P(y), P(bw), P(3));
        g.fillStyle = "rgba(0,0,0,.3)"; g.fillRect(P(x - slide), P(y + bh) - P(3), P(bw), P(3));
        text(fx.banner.str, x - slide + bw / 2, y + bh * (fx.banner.sub ? 0.36 : 0.52), Math.min(cs * 0.8, 26), C.ink);
        if (fx.banner.sub) text(fx.banner.sub, x - slide + bw / 2, y + bh * 0.74, Math.min(cs * 0.42, 14), C.ink, "center", false);
        g.globalAlpha = 1;
      }
    }

    // --- ô Giữ + hàng chờ ---
    const lab = Math.max(10, Math.min(13, cs * 0.36));
    pxPanel(L.hold.x, L.hold.y, L.hold.w, L.hold.h);
    text("GIỮ", L.hold.x + L.hold.w / 2, L.hold.y + L.head * cs * 0.5, lab, C.soft, "center", false);
    if (s && s.hold && !hide) miniPiece(s.hold, L.hold.x + L.hold.w / 2, L.hold.y + (L.head + L.slot / 2) * cs, L.k, s.holdUsed ? 0.35 : 1);
    pxPanel(L.next.x, L.next.y, L.next.w, L.next.h);
    text("TIẾP", L.next.x + L.next.w / 2, L.next.y + L.head * cs * 0.5, lab, C.soft, "center", false);
    if (s && !hide) for (let i = 0; i < L.nNext; i++) {
      const kk = i === 0 ? L.k : L.k * 0.82;
      miniPiece(s.queue[i], L.next.x + L.next.w / 2, L.next.y + (L.head + L.slot * (i + 0.5)) * cs, kk, i === 0 ? 1 : 0.8);
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
  }

  // ---------- Hiệu ứng theo sự kiện từ logic ----------
  function burst(cells, color, now, delayFn = () => 0, n = 5) {
    for (const [x, y] of cells) {
      if (y < HIDDEN) continue;
      const [px, py] = cellPoint(x, y), start = now + delayFn(x, y);
      for (let i = 0; i < n; i++) fx.parts.push({ x: px + (Math.random() - 0.5) * L.cs * 0.6, y: py + (Math.random() - 0.5) * L.cs * 0.6,
        vx: (Math.random() - 0.5) * L.cs * 9, vy: -Math.random() * L.cs * 9 - L.cs * 2, sz: L.cs * (0.12 + Math.random() * 0.14),
        c: color(i), t0: now, start, life: 650 + (start - now) });
    }
  }
  function handleEvents(now) {
    if (!s) return;
    for (const e of s.events) {
      switch (e.type) {
        case "move": sfx.play("buoc-nhay", 0.12, 1.5); break;
        case "rotate": sfx.play("buoc-nhay", 0.3, 1.15); break;
        case "hold": sfx.play("buoc-nhay", 0.35, 0.8); break;
        case "hard": {
          const v = KINDS.indexOf(e.kind) + 1, cols = new Map();
          for (const [x, y] of cellsOf(e.kind, e.rot, e.x, e.to)) { const c = cols.get(x); if (!c || y < c[2]) cols.set(x, [x, 0, y]); }
          for (const [x, y] of cellsOf(e.kind, e.rot, e.x, e.from)) { const c = cols.get(x); if (c && (c[1] === 0 || y < c[1])) c[1] = y; }
          if (e.dist > 0) fx.trails.push({ t0: now, v, cols: [...cols.values()] });
          fx.shake = { t0: now, dur: 120, amp: 2 };
          sfx.play("do-xuc-xac", 0.4, 1.3);
          const bottom = cellsOf(e.kind, e.rot, e.x, e.to).filter(([x, y]) => !cellsOf(e.kind, e.rot, e.x, e.to).some(([x2, y2]) => x2 === x && y2 === y + 1)).map(([x, y]) => [x, y + 0.45]);
          burst(bottom, () => (Math.random() < 0.5 ? "#7d7564" : "#b9ad93"), now, () => 0, 2);
          break;
        }
        case "lock": fx.flash = { t0: now, cells: e.cells }; sfx.play("trung-da", 0.4, 1.1); break;
        case "clear": {
          const cells = []; for (const y of e.rows) for (let x = 0; x < W; x++) cells.push([x, y, s.board[y][x]]);
          burst(cells.map(([x, y]) => [x, y]), (i) => { const v = cells[0][2] || 1; return i % 2 ? "#fff6de" : PAL[v][0]; }, now, (x) => Math.round((0.35 + Math.abs(x - 4.5) / 5 * 0.55) * CLEAR_TIME * 1000), 3);
          // màu hạt theo đúng viên gạch
          for (const q of fx.parts.slice(-cells.length * 3)) { const idx = Math.floor(Math.random() * cells.length); q.c = Math.random() < 0.3 ? "#fff6de" : PAL[cells[idx][2] || 1][Math.random() < 0.5 ? 0 : 1]; }
          const midY = e.rows.reduce((a, b) => a + b, 0) / e.rows.length;
          const [fxp, fyp] = cellPoint(4.5, midY);
          fx.floats.push({ str: "+" + fmtNum(e.points), x: fxp, y: fyp, size: Math.min(L.cs * 0.75, 24), c: C.ink, t0: now, life: 900 });
          if (e.combo > 0) fx.floats.push({ str: "COMBO ×" + e.combo, x: fxp, y: fyp + L.cs * 1.1, size: Math.min(L.cs * 0.5, 16), c: C.teal, t0: now + 0, life: 900 });
          if (e.perfect) fx.banner = { str: "SẠCH BÀN!", sub: "+" + fmtNum(2000 * s.level) + " thưởng", bg: "#3f9a45", t0: now, life: 1500 };
          else if (e.count === 4) fx.banner = { str: e.b2b ? "XẾP 4 LIÊN TIẾP!" : "XẾP 4 HÀNG!", sub: e.b2b ? "điểm ×1,5" : "", bg: "#8a5cc2", t0: now, life: 1300 };
          if (e.count === 4 || e.perfect) { fx.shake = { t0: now, dur: 260, amp: 5 }; sfx.play("qua-man", 0.6); }
          else sfx.play("trung-kim-cuong", 0.55, 1 + Math.min(e.combo, 6) * 0.06);
          break;
        }
        case "level":
          fx.banner = { str: "LÊN CẤP " + e.level, sub: "Gạch rơi nhanh hơn", bg: "#3f9a45", t0: now + 380, life: 1400 };
          setTimeout(() => sfx.play("thang", 0.5), 380);
          break;
        case "over":
          fx.over = { t0: now }; sfx.play("thua", 0.6);
          endTimer = setTimeout(() => showEnd(), 1150);
          break;
        case "win":
          sfx.play("thang", 0.7);
          fx.banner = { str: "VỀ ĐÍCH!", sub: fmtTime(s.time, true), bg: "#3f9a45", t0: now, life: 1600 };
          endTimer = setTimeout(() => showEnd(), 1300);
          break;
      }
    }
    s.events.length = 0;
  }

  // ---------- HUD ----------
  const hudCache = {};
  const setText = (el, key, v) => { if (hudCache[key] !== v) { hudCache[key] = v; el.textContent = v; } };
  function hud() {
    if (!s) return;
    setText(ui.score, "score", fmtNum(s.score));
    const sprint = s.mode === "sprint";
    setText(ui.linesL, "ll", sprint ? "Hàng (về đích 40)" : "Hàng");
    setText(ui.lines, "lines", sprint ? Math.min(s.lines, SPRINT_LINES) + "/" + SPRINT_LINES : String(s.lines));
    const pct = sprint ? Math.min(100, (s.lines / SPRINT_LINES) * 100) : (s.lines % 10) * 10;
    if (hudCache.fill !== pct) { hudCache.fill = pct; ui.fill.style.width = pct + "%"; }
    setText(ui.level, "level", String(s.level));
    setText(ui.time, "time", sprint ? fmtTime(s.time, true) : fmtTime(s.time));
    const b = sprint ? (save.best.sprint ? fmtTime(save.best.sprint, true) : "—") : (save.best.endless ? fmtNum(save.best.endless) : "—");
    setText(ui.best, "best", b);
  }
  function showMute() {
    const m = !!sdk.sound.muted;
    ui.mute.setAttribute("aria-pressed", m ? "true" : "false");
    ui.muteIc.src = "assets/ui/icon-am-thanh-" + (m ? "tat" : "bat") + ".png";
  }
  function toggleMute() { sdk.sound.muted = !sdk.sound.muted; localStorage.setItem("wgp.muted", sdk.sound.muted ? "1" : "0"); showMute(); }

  // ---------- Luồng ván chơi ----------
  function writeSave() { try { localStorage.setItem(SAVE_KEY, JSON.stringify({ best: save.best, mode, startLevel })); } catch {} }
  function start() {
    clearTimeout(endTimer);
    s = newGame({ mode, startLevel, seed: (seedBase + games * 7919) >>> 0 }); games++;
    fx = { parts: [], floats: [], trails: [], flash: null, shake: null, banner: null, over: null };
    paused = false; newRecord = false; releaseAll();
    ui.ovMenu.hidden = ui.ovPause.hidden = ui.ovEnd.hidden = true;
    document.body.classList.remove("is-menu");
    writeSave(); sfx.unlock(); sfx.play("qua-man", 0.5);
    for (const k in hudCache) delete hudCache[k];
    layout(); hud(); cv.focus({ preventScroll: true });
  }
  function showMenu() {
    clearTimeout(endTimer);
    if (s) sfx.play("buoc-nhay", 0.35, 0.8);
    s = null; paused = false; releaseAll();
    ui.ovPause.hidden = ui.ovEnd.hidden = true; ui.ovMenu.hidden = false;
    document.body.classList.add("is-menu"); layout();
    renderMenu(); ui.play.focus({ preventScroll: true });
  }
  function renderMenu() {
    root.querySelectorAll(".mode").forEach((b) => { const on = b.dataset.mode === mode; b.classList.toggle("on", on); b.setAttribute("aria-checked", on ? "true" : "false"); });
    ui.lvPick.hidden = mode !== "endless";
    ui.lvPick.querySelectorAll("button").forEach((b) => b.classList.toggle("on", +b.dataset.lv === startLevel));
    const bits = [];
    if (save.best.endless) bits.push("Kỷ lục Vô tận: " + fmtNum(save.best.endless) + " điểm");
    if (save.best.sprint) bits.push("Về đích nhanh nhất: " + fmtTime(save.best.sprint, true));
    ui.mBest.textContent = bits.join(" · ");
    ui.score.textContent = "0"; ui.lines.textContent = mode === "sprint" ? "0/40" : "0"; ui.linesL.textContent = mode === "sprint" ? "Hàng (về đích 40)" : "Hàng";
    ui.level.textContent = mode === "sprint" ? "1" : String(startLevel); ui.time.textContent = "0:00"; ui.fill.style.width = "0%";
    ui.best.textContent = mode === "sprint" ? (save.best.sprint ? fmtTime(save.best.sprint, true) : "—") : (save.best.endless ? fmtNum(save.best.endless) : "—");
  }
  function showEnd() {
    if (!s) return;
    const won = s.status === "won", sprint = s.mode === "sprint";
    newRecord = false;
    const prevBest = sprint ? save.best.sprint : save.best.endless;
    if (sprint && won && (!save.best.sprint || s.time < save.best.sprint)) { save.best.sprint = +s.time.toFixed(2); newRecord = true; }
    if (!sprint && s.score > save.best.endless) { save.best.endless = s.score; newRecord = true; }
    writeSave();
    ui.eTitle.textContent = won ? "Về đích!" : "Hết chỗ!";
    ui.eSub.textContent = won ? "Bạn đã ăn đủ 40 hàng." : sprint ? "Gạch chạm nóc — còn " + (SPRINT_LINES - s.lines) + " hàng nữa là về đích." : "Gạch đã chồng tới nóc.";
    const rows = sprint
      ? [["Hàng đã ăn", s.lines + "/" + SPRINT_LINES], ["Khối đã xếp", s.pieces], ["Xếp 4 hàng", s.stats[4] + " lần"], ["Điểm", fmtNum(s.score)], [won ? "Thời gian" : "Đã chơi", fmtTime(s.time, true), true]]
      : [["Hàng đã ăn", s.lines], ["Cấp đạt được", s.level], ["Xếp 4 hàng", s.stats[4] + " lần"], ["Combo cao nhất", Math.max(0, s.stats.maxCombo)], ["Thời gian", fmtTime(s.time)], ["Tổng điểm", fmtNum(s.score), true]];
    ui.eResult.innerHTML = "";
    for (const [k, v, total] of rows) {
      const a = document.createElement("span"), b = document.createElement("b");
      a.textContent = k; b.textContent = v; if (total) a.className = "total";
      ui.eResult.append(a, b);
    }
    ui.eRecord.innerHTML = newRecord ? '<span class="record">Kỷ lục mới!</span>' : "";
    if (newRecord) setTimeout(() => sfx.play("trung-kim-cuong", 0.7, 1.2), 700); // kỷ lục mới
    lastRun = { won, sprint, record: newRecord, prevBest, score: s.score, lines: s.lines, level: s.level, pieces: s.pieces,
      tetris: s.stats[4], combo: Math.max(0, s.stats.maxCombo), time: s.time };
    ui.ovEnd.hidden = false;
    $("againBtn").focus({ preventScroll: true });
    sdk.reportScore && sdk.reportScore(s.score);
    sdk.gameOver && sdk.gameOver({ score: s.score, lines: s.lines, mode: s.mode, time: +s.time.toFixed(2), result: won ? "win" : "lose" });
  }
  // Khoe kết quả: số thật của ván vừa xong (chụp lúc showEnd)
  let lastRun = null;
  function shareRun(e) {
    const r = lastRun; if (!r) return;
    // Bấm chuột/chạm: trả focus về "Chơi lại" để đóng bảng xong Space/Enter vẫn là chơi lại
    if (e && e.detail > 0) $("againBtn").focus({ preventScroll: true });
    let title, lines, tagline;
    if (r.sprint) {
      title = r.won ? (r.record ? `Kỷ lục mới 40 hàng ${fmtTime(r.time, true)}` : `Về đích 40 hàng ${fmtTime(r.time, true)}`) : `${r.lines}/${SPRINT_LINES} hàng`;
      lines = [`Hàng đã ăn: ${r.lines}/${SPRINT_LINES}`, `Khối đã xếp: ${r.pieces}`, `Xếp 4 hàng: ${r.tetris} lần`,
        r.won ? (!r.record && r.prevBest ? `Kỷ lục: ${fmtTime(r.prevBest, true)}` : `Điểm: ${fmtNum(r.score)}`) : `Đã chơi: ${fmtTime(r.time, true)}`];
      tagline = r.won && r.record ? "Tay nhanh như chớp, đồng hồ chạy theo không kịp!"
        : r.won ? "Về đích rồi, nhưng kỷ lục cũ vẫn đang cười." : SPRINT_LINES - r.lines <= 10 ? "Còn chút xíu nữa thôi, tiếc hùi hụi!" : "Gạch chạm nóc rồi, thở đều rồi chơi lại!";
    } else {
      title = r.record ? `Kỷ lục mới ${fmtNum(r.score)} điểm` : `${fmtNum(r.score)} điểm`;
      lines = [`Hàng đã ăn: ${r.lines}`, `Cấp đạt được: ${r.level}`, `Xếp 4 hàng: ${r.tetris} lần`,
        !r.record && r.prevBest ? `Kỷ lục: ${fmtNum(r.prevBest)}` : `Thời gian: ${fmtTime(r.time)}`];
      tagline = r.record && r.lines >= 40 ? "Kỷ lục mới! Gạch xếp thẳng hơn cả bàn học hồi xưa."
        : r.record ? "Kỷ lục mới! Ai dám vô phá thử không?"
        : r.tetris >= 3 ? "Ăn 4 hàng như ăn kẹo, chỉ thiếu chút may!"
        : r.lines >= 20 ? "Xếp cũng ra gì đó, ván sau là kỷ lục!" : "Gạch rơi hơi nhanh, tay chưa kịp nóng!";
    }
    shareResult({ game: "xep-gach", title, lines, tagline });
  }
  function setPaused(p) {
    if (!s || s.status !== "playing") return;
    paused = p; ui.ovPause.hidden = !p; releaseAll();
    sfx.play("buoc-nhay", 0.4, p ? 0.8 : 1.2);
    if (p) $("resumeBtn").focus({ preventScroll: true }); else { cv.focus({ preventScroll: true }); last = performance.now(); }
  }
  const playing = () => s && s.status === "playing" && !paused;

  // ---------- Điều khiển: giữ phím/nút có lặp (DAS) ----------
  const rep = { left: null, right: null, soft: null };
  let lastDir = null;
  function act(a) {
    if (!playing()) return;
    sfx.unlock();
    if (a === "left") move(s, -1);
    else if (a === "right") move(s, 1);
    else if (a === "soft") softDrop(s);
    else if (a === "hard") hardDrop(s);
    else if (a === "cw") rotate(s, 1);
    else if (a === "ccw") rotate(s, -1);
    else if (a === "hold") holdPiece(s);
  }
  function press(a) {
    if (a in rep) {
      if (rep[a]) return;
      rep[a] = { t: 0, das: false, acc: 0 };
      if (a !== "soft") lastDir = a;
      act(a);
    } else act(a);
  }
  function release(a) { if (a in rep) { rep[a] = null; if (lastDir === a) lastDir = rep.left ? "left" : rep.right ? "right" : null; } }
  function releaseAll() { rep.left = rep.right = rep.soft = null; lastDir = null; root.querySelectorAll(".pad .is-down").forEach((b) => b.classList.remove("is-down")); }
  function repeat(dt) {
    if (!playing()) return;
    for (const a of ["left", "right"]) {
      const r = rep[a];
      if (!r || lastDir !== a) continue;
      r.t += dt;
      if (!r.das) { if (r.t >= DAS) { r.das = true; r.acc = 0; act(a); } }
      else { r.acc += dt; while (r.acc >= ARR) { r.acc -= ARR; if (!move(s, a === "left" ? -1 : 1)) { r.acc = 0; break; } } }
    }
    if (rep.soft) { rep.soft.acc += dt; while (rep.soft.acc >= SOFT_INT) { rep.soft.acc -= SOFT_INT; act("soft"); } }
  }

  const KEYMAP = { ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right", ArrowDown: "soft", KeyS: "soft",
    ArrowUp: "cw", KeyX: "cw", KeyW: "cw", KeyZ: "ccw", ControlLeft: "ccw", ControlRight: "ccw", Space: "hard",
    KeyC: "hold", ShiftLeft: "hold", ShiftRight: "hold" };
  function onKey(e) {
    if (e.ctrlKey && e.code !== "ControlLeft" && e.code !== "ControlRight") return;
    if (e.altKey || e.metaKey) return;
    if (e.code === "KeyM") { toggleMute(); return; }
    if (e.code === "KeyP" || e.code === "Escape") {
      if (s && s.status === "playing") { e.preventDefault(); setPaused(!paused); }
      return;
    }
    const a = KEYMAP[e.code];
    if (!a) return;
    if (!playing()) return;                      // ở menu/hộp thoại: để phím Space/Enter bấm nút như thường
    e.preventDefault();
    if (e.repeat) return;
    press(a);
  }
  function onKeyUp(e) { const a = KEYMAP[e.code]; if (a) release(a); }

  // Nút chạm: nhấn là chạy ngay (không chờ click), giữ để lặp.
  function padDown(e) {
    const b = e.target.closest("[data-act]"); if (!b) return;
    e.preventDefault();
    try { b.setPointerCapture(e.pointerId); } catch {}
    b.classList.add("is-down"); b._pid = e.pointerId;
    press(b.dataset.act);
  }
  function padUp(e) {
    const b = e.target.closest("[data-act]"); if (!b || b._pid !== e.pointerId) return;
    b.classList.remove("is-down"); b._pid = null;
    release(b.dataset.act);
  }
  function padClick(e) { // bấm bằng bàn phím (Enter/Space khi đang focus nút)
    const b = e.target.closest("[data-act]"); if (!b || e.detail !== 0) return;
    act(b.dataset.act);
  }
  ui.pad.addEventListener("pointerdown", padDown);
  ui.pad.addEventListener("pointerup", padUp);
  ui.pad.addEventListener("pointercancel", padUp);
  ui.pad.addEventListener("lostpointercapture", padUp);
  ui.pad.addEventListener("click", padClick);
  ui.pad.addEventListener("contextmenu", (e) => e.preventDefault());

  // Cử chỉ trên bàn (chạm/bút): chạm = xoay, kéo ngang = dời, kéo xuống = rơi nhanh, vuốt nhanh xuống = thả, vuốt lên = giữ.
  let gest = null;
  cv.addEventListener("pointerdown", (e) => {
    cv.focus({ preventScroll: true });
    if (e.pointerType === "mouse" || !playing() || gest) return;
    e.preventDefault();
    try { cv.setPointerCapture(e.pointerId); } catch {}
    gest = { id: e.pointerId, x0: e.clientX, y0: e.clientY, ax: e.clientX, ay: e.clientY, t0: performance.now(), moved: false, soft: 0 };
    sfx.unlock();
  });
  cv.addEventListener("pointermove", (e) => {
    if (!gest || e.pointerId !== gest.id || !playing()) return;
    const step = L.cs * 0.85;
    const tx = e.clientX - gest.x0, ty = e.clientY - gest.y0;
    while (e.clientX - gest.ax >= step) { gest.ax += step; move(s, 1); gest.moved = true; }
    while (e.clientX - gest.ax <= -step) { gest.ax -= step; move(s, -1); gest.moved = true; }
    if (ty > 0 && Math.abs(ty) > Math.abs(tx) * 1.2 && performance.now() - gest.t0 > 110) {
      while (e.clientY - gest.ay >= step) { gest.ay += step; softDrop(s); gest.moved = true; gest.soft++; }
    }
  });
  function gestEnd(e) {
    if (!gest || e.pointerId !== gest.id) return;
    const g0 = gest; gest = null;
    if (!playing() || e.type === "pointercancel") return;
    const dt = performance.now() - g0.t0, dx = e.clientX - g0.x0, dy = e.clientY - g0.y0;
    const fast = dt < 350;
    if (fast && dy > L.cs * 1.6 && Math.abs(dx) < dy * 0.7) { hardDrop(s); return; }
    if (fast && dy < -L.cs * 1.6 && Math.abs(dx) < -dy * 0.7) { holdPiece(s); return; }
    if (!g0.moved && Math.hypot(dx, dy) < Math.max(12, L.cs * 0.5) && dt < 350) rotate(s, 1);
  }
  cv.addEventListener("pointerup", gestEnd);
  cv.addEventListener("pointercancel", gestEnd);

  // Nút & menu
  ui.pause.addEventListener("click", () => { if (s && s.status === "playing") setPaused(!paused); });
  ui.mute.addEventListener("click", toggleMute);
  $("resumeBtn").addEventListener("click", () => setPaused(false));
  $("retryBtnP").addEventListener("click", start);
  $("menuBtnP").addEventListener("click", showMenu);
  $("againBtn").addEventListener("click", start);
  $("shareBtnE").addEventListener("click", shareRun);
  $("menuBtnE").addEventListener("click", showMenu);
  ui.play.addEventListener("click", start);
  root.querySelectorAll(".mode").forEach((b) => b.addEventListener("click", () => { mode = b.dataset.mode; writeSave(); renderMenu(); }));
  for (const lv of LV_CHOICES) {
    const b = document.createElement("button"); b.type = "button"; b.textContent = lv; b.dataset.lv = lv; b.setAttribute("aria-label", "Cấp " + lv);
    b.addEventListener("click", () => { startLevel = lv; writeSave(); renderMenu(); });
    ui.lvPick.append(b);
  }

  const onVis = () => { if (document.hidden) setPaused(true); };
  const onBlur = () => setPaused(true);
  window.addEventListener("keydown", onKey);
  window.addEventListener("keyup", onKeyUp);
  document.addEventListener("visibilitychange", onVis);
  window.addEventListener("blur", onBlur);

  // ---------- Vòng lặp ----------
  function frame(now) {
    if (destroyed) return;
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (playing()) { repeat(dt); step(s, dt); }
    handleEvents(now);
    hud();
    draw(now);
    raf = requestAnimationFrame(frame);
  }
  document.body.classList.add("is-menu");
  showMute(); layout(); renderMenu();
  raf = requestAnimationFrame(frame);

  return {
    get state() { return s; },
    get layout() { return L; },
    get paused() { return paused; },
    get sfx() { return sfx; },
    cellPoint, start, showMenu,
    destroy() {
      destroyed = true; cancelAnimationFrame(raf); ro.disconnect(); sfx.close(); clearTimeout(endTimer);
      window.removeEventListener("keydown", onKey); window.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("visibilitychange", onVis); window.removeEventListener("blur", onBlur);
    },
  };
}
