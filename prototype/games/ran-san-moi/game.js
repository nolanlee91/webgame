// Rắn Săn Mồi — phần vẽ (canvas, khối pixel vẽ bằng code), điều khiển (phím, vuốt, nút), HUD, âm thanh, kỷ lục. Luật trong logic.js.
import { N, START_LEN, GOLD_LIFE, newGame, step, turn, interval, speedLevel } from "./logic.js";
import { shareResult } from "../_shared/share.js?v=s3";
import * as CH from "../_shared/challenge.js?v=ch1"; // Đợt 10: "Thách cùng màn" (?thach=<seed>.<điểm>[.<tên>]; chế độ = bit thấp của seed)

const SAVE_KEY = "wgp.ransanmoi.v1";
const FONT = '"Be Vietnam Pro", system-ui, sans-serif';
// Bảng màu Art Bible V5: nền đất tối ấm, cỏ xanh lá rêu, rắn xanh lá phường Xanh, mồi đỏ phường Đỏ, đồng vàng.
const C = {
  line: "#0a0807", grassA: "#1d2716", grassB: "#212d19", grassDot: "#26341d", frame: "#4a3b2c", frameHi: "#6d5a44", frameD: "#2b2118",
  stone: "#5b5348", stoneHi: "#7d7564", stoneD: "#2a241d", wrapEdge: "#3f9a45", wrapHi: "#7fd47f",
  snake: "#3fae4a", snakeHi: "#8be08f", snakeD: "#17521c", belly: "#2f8a39", dead: "#5b5348", deadHi: "#7d7564", deadD: "#2a241d",
  red: "#e0483d", redHi: "#ff8f84", redD: "#7a1c17", leaf: "#3fae4a", stem: "#6b3410",
  gold: "#ffc94a", goldHi: "#ffe9a8", goldD: "#7a5410", ink: "#f4ead2", soft: "#b9ad93",
};
// Hình pixel 8×8 cho mồi: . trống, r đỏ, h đỏ sáng, d đỏ tối, g lá, s cuống
const APPLE = ["....sg..", "...sgg..", ".rrsrrr.", "rhhrrrrd", "rhrrrrrd", "rrrrrrdd", ".rrrrdd.", "..dddd.."];
const COIN = ["..yyyy..", ".yhhhhy.", "yhyyyydy", "yhyddydy", "yhyddydy", "yhyyyydy", ".yddddy.", "..yyyy.."];
const PIX = { r: C.red, h: C.redHi, d: C.redD, g: C.leaf, s: C.stem, y: C.gold, Y: C.goldHi };

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
    play(n, vol = 1, rate = 1) {
      if (muted() || !ac || !buf[n]) return false;
      if (ac.state === "suspended") ac.resume().catch(() => {});
      const s = ac.createBufferSource(), gn = ac.createGain();
      s.buffer = buf[n]; s.playbackRate.value = rate; gn.gain.value = vol; s.connect(gn).connect(ac.destination); s.start();
      log.push({ n, t: Math.round(performance.now()) }); if (log.length > 300) log.shift();
      return true;
    },
    log,
    close() { if (ac) ac.close().catch(() => {}); },
  };
}
function loadSave() {
  const d = { best: { classic: 0, wrap: 0 }, longest: { classic: 0, wrap: 0 }, mode: "classic" };
  try {
    const v = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (v && typeof v === "object") {
      for (const k of ["classic", "wrap"]) { d.best[k] = Math.max(0, (v.best && v.best[k]) | 0); d.longest[k] = Math.max(0, (v.longest && v.longest[k]) | 0); }
      if (v.mode === "wrap") d.mode = "wrap";
    }
  } catch {}
  return d;
}
const fmtTime = (t) => { const m = Math.floor(t / 60); return m + ":" + String(Math.floor(t - m * 60)).padStart(2, "0"); };
const fmtNum = (n) => n.toLocaleString("vi-VN");
const MODE_NAME = { classic: "Cổ điển", wrap: "Xuyên tường" };

export function mount(root, ctx = {}) {
  const sdk = ctx.sdk || { sound: { muted: false } };
  const $ = (id) => document.getElementById(id);
  const cv = $("cv"), stage = $("stage"), g = cv.getContext("2d");
  const ui = {
    score: $("hScore"), best: $("hBest"), len: $("hLen"), fill: $("hFill"), speed: $("hSpeed"), time: $("hTime"),
    pause: $("pauseBtn"), mute: $("muteBtn"), muteIc: $("muteIc"), pad: $("pad"),
    ovMenu: $("ovMenu"), ovPause: $("ovPause"), ovEnd: $("ovEnd"), play: $("playBtn"), mBest: $("mBest"),
    eTitle: $("eTitle"), eSub: $("eSub"), eResult: $("eResult"), eRecord: $("eRecord"),
  };
  const sfx = makeSfx("assets/sfx/", ["trung-kim-cuong", "trung-da", "buoc-nhay", "qua-man", "thang", "thua", "het-gio"], sdk);
  let save = loadSave(), mode = save.mode;
  // Thách cùng màn: link ?thach= hợp lệ ⇒ cùng seed (mồi rơi đúng thứ tự như người gửi), chế độ lấy từ bit thấp của seed.
  // Ván thách KHÔNG ghi kỷ lục / độ dài dài nhất (điểm so với người gửi, không lẫn vào thành tích riêng). Chơi thường giữ nguyên.
  let chal = CH.readChallenge("ran-san-moi"), chalEnded = false, runSeed = 0;
  if (chal) mode = CH.variantOf(chal.seed, 2) ? "wrap" : "classic";
  let s = null, paused = false, destroyed = false, raf = 0, last = performance.now(), acc = 0, time = 0;
  let seedBase = ctx.seed ?? (Date.now() & 0xffffff), games = 0, endTimer = 0, newRecord = false;
  let L = { cs: 20, dpr: 1, w: 0, h: 0, bx: 0, by: 0, fr: 0 };
  let fx = { parts: [], floats: [], shake: null, flash: null, deadAt: 0 };

  // ---------- Bố cục: bàn vuông N×N + khung, ô to nhất vừa khung ----------
  function layout() {
    const r = stage.getBoundingClientRect(), dpr = Math.min(3, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    const FR = 0.7;
    const cs = Math.max(8, Math.floor(Math.min((w - 6) / (N + 2 * FR), (h - 6) / (N + 2 * FR))));
    const tot = (N + 2 * FR) * cs;
    L = { cs, dpr, w, h, fr: FR, bx: Math.round((w - tot) / 2 + FR * cs), by: Math.round((h > w * 1.15 ? Math.min(6, h - tot) : (h - tot) / 2) + FR * cs) }; // màn dọc: bàn sát HUD, khoảng trống dồn về phía nút (gần ngón cái)
    grassPat = null;
  }
  const ro = new ResizeObserver(() => { layout(); draw(performance.now()); });
  ro.observe(stage);
  const cellPoint = (x, y) => [L.bx + (x + 0.5) * L.cs, L.by + (y + 0.5) * L.cs];

  // ---------- Vẽ ----------
  const P = (v) => Math.round(v * L.dpr);
  let grassPat = null;
  function grass(u) {
    if (grassPat) return grassPat;
    const cs = P(L.cs), p = document.createElement("canvas"); p.width = p.height = cs * 2;
    const x = p.getContext("2d");
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { x.fillStyle = (i + j) % 2 ? C.grassB : C.grassA; x.fillRect(i * cs, j * cs, cs, cs); }
    x.fillStyle = C.grassDot; // vài cọng cỏ pixel
    for (const [a, b] of [[0.2, 0.3], [0.65, 0.7], [1.3, 0.25], [1.75, 0.8], [0.4, 1.6], [1.5, 1.4], [0.85, 1.85], [1.1, 1.1]]) {
      x.fillRect(Math.round(a * cs), Math.round(b * cs), u, 2 * u); x.fillRect(Math.round(a * cs) + u, Math.round(b * cs) + u, u, u);
    }
    grassPat = g.createPattern(p, "repeat"); return grassPat;
  }
  function sprite(map, X, Y, S) {
    const k = S / 8;
    for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) {
      const ch = map[j][i]; if (ch === ".") continue;
      g.fillStyle = PIX[ch]; g.fillRect(Math.round(X + i * k), Math.round(Y + j * k), Math.ceil(k), Math.ceil(k));
    }
  }
  function frame() {
    const cs = P(L.cs), bx = P(L.bx), by = P(L.by), B = N * cs, f = Math.round(P(L.cs) * L.fr), u = Math.max(1, Math.round(cs / 10));
    // bóng cứng + khung gỗ
    g.fillStyle = "rgba(0,0,0,.55)"; g.fillRect(bx - f + 3 * u * 2, by - f + 4 * u * 2, B + 2 * f, B + 2 * f);
    g.fillStyle = C.line; g.fillRect(bx - f - 3 * u, by - f - 3 * u, B + 2 * f + 6 * u, B + 2 * f + 6 * u);
    if (s && s.mode === "wrap") { // viền xanh nét đứt = đi xuyên được
      g.fillStyle = C.frameD; g.fillRect(bx - f, by - f, B + 2 * f, B + 2 * f);
      g.fillStyle = C.wrapEdge;
      for (let i = 0; i < N; i += 1) {
        if (i % 2) continue;
        g.fillRect(bx + i * cs, by - f + u, cs, f - 2 * u); g.fillRect(bx + i * cs, by + B + u, cs, f - 2 * u);
        g.fillRect(bx - f + u, by + i * cs, f - 2 * u, cs); g.fillRect(bx + B + u, by + i * cs, f - 2 * u, cs);
      }
    } else { // tường đá
      g.fillStyle = C.stone; g.fillRect(bx - f, by - f, B + 2 * f, B + 2 * f);
      g.fillStyle = C.stoneD;
      const st = Math.max(4, Math.round(cs * 1.5));
      for (let x = bx - f; x < bx + B + f; x += st) { g.fillRect(x, by - f, u, f); g.fillRect(x + st / 2 | 0, by + B, u, f); }
      for (let y = by - f; y < by + B + f; y += st) { g.fillRect(bx - f, y, f, u); g.fillRect(bx + B, y + st / 2 | 0, f, u); }
      g.fillStyle = C.stoneHi; g.fillRect(bx - f, by - f, B + 2 * f, u); g.fillRect(bx - f, by - f, u, B + 2 * f);
    }
    g.fillStyle = C.line; g.fillRect(bx - 2 * u, by - 2 * u, B + 4 * u, B + 4 * u);
    g.fillStyle = grass(u); g.save(); g.translate(bx, by); g.fillRect(0, 0, B, B); g.restore();
  }
  // Toạ độ ô (thập phân) → điểm vẽ; nội suy giữa nhịp trước và nhịp này, bỏ nội suy khi vừa xuyên tường.
  function segs(t) {
    if (!s) return [];
    const cur = s.snake, prev = s.last;
    return cur.map((c, i) => {
      const p = prev && (prev[i] || prev[prev.length - 1]);
      if (!p || Math.abs(p.x - c.x) + Math.abs(p.y - c.y) > 1) return { x: c.x, y: c.y };
      return { x: p.x + (c.x - p.x) * t, y: p.y + (c.y - p.y) * t };
    });
  }
  function block(x, y, S, base, hi, dk, u) {
    g.fillStyle = C.line; g.fillRect(x - u, y - u, S + 2 * u, S + 2 * u);
    g.fillStyle = base; g.fillRect(x, y, S, S);
    g.fillStyle = hi; g.fillRect(x, y, S, u); g.fillRect(x, y, u, S);
    g.fillStyle = dk; g.fillRect(x, y + S - u, S, u); g.fillRect(x + S - u, y, u, S);
  }
  function drawSnake(t, now) {
    const cs = P(L.cs), bx = P(L.bx), by = P(L.by), u = Math.max(1, Math.round(cs / 10));
    const pts = segs(t), dead = s.status === "over", n = pts.length;
    const deadUpTo = dead ? Math.floor((now - fx.deadAt) / 35) : -1; // thân hóa đá dần từ đầu tới đuôi
    const col = (i) => (dead && i <= deadUpTo ? [C.dead, C.deadHi, C.deadD] : i % 4 === 2 ? [C.belly, C.snakeHi, C.snakeD] : [C.snake, C.snakeHi, C.snakeD]);
    const ins = 2 * u, S = cs - 2 * ins;
    const px = (p) => [bx + Math.round(p.x * cs) + ins, by + Math.round(p.y * cs) + ins];
    // vẽ từ đuôi lên đầu; nối 2 đốt liền nhau bằng khối giữa để thân liền mạch
    for (let i = n - 1; i >= 0; i--) {
      const [b, h, d] = col(i), p = pts[i];
      const taper = i === n - 1 && n > 2 ? 2 * u : 0;
      if (i < n - 1) {
        const q = pts[i + 1];
        if (Math.abs(q.x - p.x) + Math.abs(q.y - p.y) <= 1.01) {
          const [mx, my] = px({ x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 });
          block(mx, my, S, b, h, d, u);
        }
      }
      const [x, y] = px(p);
      block(x + taper, y + taper, S - 2 * taper, b, h, d, u);
    }
    // đầu: to hơn, mắt nhìn theo hướng, lưỡi thè ra theo nhịp
    const hp = pts[0], [hx, hy] = px(hp), HS = S + 2 * u, X = hx - u, Y = hy - u;
    const [hb, hh, hd] = dead ? [C.dead, C.deadHi, C.deadD] : [C.snake, C.snakeHi, C.snakeD];
    block(X, Y, HS, hb, hh, hd, u);
    const dir = s.dir, e = Math.max(2, Math.round(HS / 4)), m = Math.round(HS / 2);
    const eyes = dir === "right" ? [[HS - e - u, u * 2], [HS - e - u, HS - e - 2 * u]] : dir === "left" ? [[u, u * 2], [u, HS - e - 2 * u]]
      : dir === "up" ? [[u * 2, u], [HS - e - 2 * u, u]] : [[u * 2, HS - e - u], [HS - e - 2 * u, HS - e - u]];
    for (const [ex, ey] of eyes) {
      g.fillStyle = dead ? C.line : "#f4ead2"; g.fillRect(X + ex, Y + ey, e, e);
      if (!dead) { g.fillStyle = C.line; const pu = Math.max(1, e >> 1); g.fillRect(X + ex + (dir === "left" ? 0 : dir === "right" ? e - pu : (e - pu) >> 1), Y + ey + (dir === "up" ? 0 : dir === "down" ? e - pu : (e - pu) >> 1), pu, pu); }
      else { g.fillStyle = C.deadHi; g.fillRect(X + ex, Y + ey + (e >> 1), e, u); }
    }
    if (!dead && Math.floor(now / 260) % 4 === 0) {
      g.fillStyle = C.red; const tl = Math.round(HS / 3), tw = Math.max(1, u);
      if (dir === "right") g.fillRect(X + HS, Y + m - tw, tl, 2 * tw);
      if (dir === "left") g.fillRect(X - tl, Y + m - tw, tl, 2 * tw);
      if (dir === "up") g.fillRect(X + m - tw, Y - tl, 2 * tw, tl);
      if (dir === "down") g.fillRect(X + m - tw, Y + HS, 2 * tw, tl);
    }
  }
  function drawFood(now) {
    const cs = P(L.cs), bx = P(L.bx), by = P(L.by);
    if (s.food) {
      const bob = Math.floor(now / 220) % 2 ? Math.round(cs * 0.06) : 0, S = Math.round(cs * 0.86), o = (cs - S) >> 1;
      g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(bx + s.food.x * cs + o + 2, by + s.food.y * cs + cs - o - Math.round(cs * 0.12), S - 4, Math.round(cs * 0.12));
      sprite(APPLE, bx + s.food.x * cs + o, by + s.food.y * cs + o - bob, S);
    }
    if (s.gold) {
      const blink = s.gold.life < 12 && Math.floor(now / 120) % 2;
      if (!blink) {
        const S = Math.round(cs * 0.9), o = (cs - S) >> 1, spin = Math.floor(now / 150) % 4;
        const map = spin === 1 || spin === 3 ? COIN.map((r) => r.replace(/^\.{0}/, "")) : COIN;
        sprite(map, bx + s.gold.x * cs + o, by + s.gold.y * cs + o, S);
        if (spin === 0) { g.fillStyle = C.goldHi; g.fillRect(bx + s.gold.x * cs + o + Math.round(S * 0.62), by + s.gold.y * cs + o + Math.round(S * 0.12), Math.max(1, S >> 3), Math.max(1, S >> 3)); }
        // vòng thời gian còn lại: thanh nhỏ dưới đồng vàng
        const left = s.gold.life / GOLD_LIFE;
        g.fillStyle = C.line; g.fillRect(bx + s.gold.x * cs, by + s.gold.y * cs + cs - 3, cs, 3);
        g.fillStyle = C.gold; g.fillRect(bx + s.gold.x * cs, by + s.gold.y * cs + cs - 3, Math.round(cs * left), 2);
      }
    }
  }
  function draw(now) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, cv.width, cv.height);
    let sx = 0, sy = 0;
    if (fx.shake) { const k = 1 - (now - fx.shake.t) / 380; if (k <= 0) fx.shake = null; else { sx = Math.round((Math.random() - 0.5) * 12 * k) * L.dpr; sy = Math.round((Math.random() - 0.5) * 12 * k) * L.dpr; } }
    g.translate(sx, sy);
    frame();
    if (s) {
      const t = s.status === "play" && !paused ? Math.min(1, acc / interval(s)) : 1;
      drawFood(now);
      drawSnake(t, now);
    } else drawDemo(now);
    // hạt + chữ nổi
    const u = Math.max(2, Math.round(P(L.cs) / 6));
    for (const p of fx.parts) {
      const k = (now - p.t) / p.life; if (k >= 1) continue;
      const x = P(p.x + p.vx * k * p.life / 1000), y = P(p.y + p.vy * k * p.life / 1000 + 400 * (k * p.life / 1000) ** 2);
      g.globalAlpha = 1 - k; g.fillStyle = C.line; g.fillRect(x - 1, y - 1, u + 2, u + 2); g.fillStyle = p.c; g.fillRect(x, y, u, u);
    }
    fx.parts = fx.parts.filter((p) => now - p.t < p.life);
    g.globalAlpha = 1;
    g.textAlign = "center"; g.textBaseline = "middle";
    for (const f of fx.floats) {
      const k = (now - f.t) / 900; if (k >= 1) continue;
      g.globalAlpha = Math.min(1, (1 - k) * 2); g.font = `800 ${P(f.big ? 22 : 16)}px ${FONT}`;
      const x = P(f.x), y = P(f.y - 34 * k);
      g.fillStyle = C.line; g.fillText(f.txt, x + P(2), y + P(2)); g.fillStyle = f.c; g.fillText(f.txt, x, y);
    }
    fx.floats = fx.floats.filter((f) => now - f.t < 900);
    g.globalAlpha = 1;
    if (fx.flash) { const k = 1 - (now - fx.flash.t) / 260; if (k <= 0) fx.flash = null; else { g.fillStyle = fx.flash.c; g.globalAlpha = 0.35 * k; g.fillRect(-sx, -sy, cv.width, cv.height); g.globalAlpha = 1; } }
  }
  // Rắn mẫu bò vòng tròn sau menu cho đẹp mắt
  const demo = newGame({ seed: 5 });
  function drawDemo(now) {
    const k = Math.floor(now / 140), path = [];
    const ring = []; for (let x = 3; x < N - 3; x++) ring.push({ x, y: 3 }); for (let y = 4; y < N - 3; y++) ring.push({ x: N - 4, y });
    for (let x = N - 5; x >= 3; x--) ring.push({ x, y: N - 4 }); for (let y = N - 5; y > 3; y--) ring.push({ x: 3, y });
    for (let i = 0; i < 9; i++) path.push(ring[(k - i + ring.length * 9) % ring.length]);
    const h = path[0], nx = path[0], pv = path[1];
    demo.snake = path; demo.last = null; demo.status = "play";
    demo.dir = nx.x > pv.x ? "right" : nx.x < pv.x ? "left" : nx.y > pv.y ? "down" : "up";
    demo.food = { x: N >> 1, y: N >> 1 }; demo.gold = null;
    const keep = s; s = demo; drawFood(now); drawSnake(1, now); s = keep;
    void h;
  }

  // ---------- Vòng chơi ----------
  function tickLoop(now) {
    if (destroyed) return;
    const dt = Math.min(250, now - last); last = now;
    if (s && s.status === "play" && !paused) {
      time += dt / 1000; acc += dt;
      let guard = 0;
      while (s.status === "play" && acc >= interval(s) && guard++ < 5) { acc -= interval(s); onStep(step(s), now); }
      if (s.status !== "play") acc = 0;
    }
    draw(now); hud();
    raf = requestAnimationFrame(tickLoop);
  }
  let hadGold = false;
  function onStep(ev, now) {
    if (s.gold && !hadGold && !ev.ate) sfx.play("trung-kim-cuong", 0.4, 1.5); // đồng vàng vừa xuất hiện
    hadGold = !!s.gold;
    if (ev.ate) {
      const h = s.snake[0], [x, y] = cellPoint(h.x, h.y), gold = ev.ate === "gold";
      for (let i = 0; i < (gold ? 22 : 12); i++) { const a = Math.random() * Math.PI * 2, v = 60 + Math.random() * 150; fx.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 90, t: now, life: 500 + Math.random() * 300, c: gold ? [C.gold, C.goldHi][i % 2] : [C.red, C.redHi, C.leaf][i % 3] }); }
      fx.floats.push({ x, y: y - 6, txt: "+" + ev.pts, t: now, c: gold ? C.gold : C.ink, big: gold });
      sfx.play(gold ? "trung-kim-cuong" : "buoc-nhay", gold ? 0.8 : 0.6, gold ? 1 : 1 + Math.min(0.5, (s.snake.length - START_LEN) * 0.01));
      if (s.snake.length % 5 === START_LEN % 5 && ev.ate === "food") { fx.floats.push({ x, y: y - 28, txt: "Tăng tốc!", t: now + 120, c: "#7fd47f" }); sfx.play("qua-man", 0.35, 1.3); }
    }
    if (ev.goldGone) sfx.play("het-gio", 0.4);
    if (ev.died) {
      fx.shake = { t: now }; fx.flash = { t: now, c: C.red }; fx.deadAt = now;
      sfx.play("trung-da", 0.9);
      clearTimeout(endTimer); endTimer = setTimeout(() => finish(), 900);
    }
    if (s.status === "won") { sfx.play("thang", 0.9); clearTimeout(endTimer); endTimer = setTimeout(() => finish(), 600); }
  }

  function leaveChallenge() { chal = null; chalEnded = false; CH.stripParam(); }
  function start() {
    clearTimeout(endTimer);
    if (chal && chalEnded) { leaveChallenge(); mode = save.mode; } // hết ván thách ⇒ "Chơi màn mới" = ván thường
    if (!chal) { save.mode = mode; persist(); }
    // seed ván thường: bit thấp = chế độ (để link "Thách bạn" tái tạo đúng ván); ván thách: seed trong link
    runSeed = chal ? chal.seed : CH.seedWithVariant((seedBase + games * 7919) >>> 0, mode === "wrap" ? 1 : 0, 2);
    s = newGame({ seed: runSeed, mode });
    games++; paused = false; acc = 0; time = 0; newRecord = false; fx = { parts: [], floats: [], shake: null, flash: null, deadAt: 0 };
    showOv(null); sfx.play("qua-man", 0.6);
    cv.focus({ preventScroll: true });
  }
  function finish() {
    if (!s) return;
    const prev = save.best[s.mode];
    const inChal = !!chal;
    newRecord = !inChal && s.score > prev;
    if (!inChal) {
      if (newRecord) save.best[s.mode] = s.score;
      save.longest[s.mode] = Math.max(save.longest[s.mode], s.snake.length);
      persist();
    }
    const won = s.status === "won";
    ui.eTitle.textContent = won ? "Rắn phủ kín bàn!" : s.died && s.died.by === "wall" ? "Đụng tường rồi!" : "Cắn trúng đuôi!";
    ui.eSub.textContent = MODE_NAME[s.mode] + " · " + (inChal ? "Ván thách đấu (không tính kỷ lục)" : won ? "Bạn đã thắng tuyệt đối!" : "Thử lại để phá kỷ lục nhé.");
    ui.eResult.innerHTML = `<span>Mồi đã ăn</span><b>${s.eaten}</b><span>Độ dài</span><b>${s.snake.length}</b><span>Tốc độ đạt</span><b>Cấp ${speedLevel(s)}</b>`
      + `<span>Thời gian</span><b>${fmtTime(time)}</b><span class="total">Tổng điểm</span><b>${fmtNum(s.score)}</b>`;
    ui.eRecord.innerHTML = inChal ? "" : newRecord && s.score > 0 ? '<span class="record">★ Kỷ lục mới</span>' : prev ? `<div class="best">Kỷ lục ${MODE_NAME[s.mode]}: ${fmtNum(prev)}</div>` : "";
    ui.ovEnd.querySelector(".lk-chal--cmp")?.remove();
    if (inChal) { ui.eSub.after(CH.compareBox(chal, s.score)); chalEnded = true; chal.done(); } // so điểm ngay dưới tiêu đề: luôn thấy, không bị hàng nút ghim che
    lastRun = { score: s.score, record: newRecord && s.score > 0, prev, mode: s.mode, len: s.snake.length, eaten: s.eaten, time, won, seed: runSeed, chal: inChal ? chal : null };
    $("againBtn").textContent = inChal ? "▶ Chơi màn mới" : "▶ Chơi lại";
    $("chalBtnE").textContent = inChal ? "⚔ Thách lại" : "⚔ Thách bạn";
    showOv("ovEnd");
    if (!won) sfx.play(newRecord && s.score > 0 ? "thang" : "thua", 0.7);
    sdk.reportScore?.(s.score);
    sdk.gameOver?.({ score: s.score, length: s.snake.length, mode: s.mode });
  }
  // Khoe kết quả: số thật của ván vừa xong (lưu lúc finish, không đọc lại s vì có thể đã sang ván mới)
  let lastRun = null;
  function shareRun(e) {
    const r = lastRun; if (!r) return;
    // Bấm chuột/chạm: bỏ focus khỏi nút để đóng bảng xong Space/Enter vẫn là chơi lại
    if (e && e.detail > 0) e.currentTarget.blur();
    const tagline = r.won ? "Rắn phủ kín cả bàn — Nokia 1280 cũng phải quỳ!"
      : r.record && r.score >= 500 ? "Kỷ lục mới! Rắn này ăn hết vườn nhà hàng xóm rồi."
      : r.record ? "Kỷ lục mới! Ai chơi thử đi, phá được thì nói."
      : r.score >= 300 ? "Dài ngoằng mà vẫn cắn nhầm đuôi, tiếc ghê!"
      : r.score >= 80 ? "Rắn đang lớn, ván sau là kỷ lục!"
      : "Rắn còn non, mai luyện tiếp!";
    shareResult({
      game: "ran-san-moi",
      title: r.record ? `Kỷ lục mới ${fmtNum(r.score)} điểm` : `${fmtNum(r.score)} điểm`,
      lines: [`Độ dài: ${r.len} khúc`, `Mồi đã ăn: ${r.eaten}`, `Thời gian: ${fmtTime(r.time)}`,
        !r.record && r.prev ? `Kỷ lục: ${fmtNum(r.prev)}` : `Chế độ: ${MODE_NAME[r.mode]}`],
      tagline,
    });
  }
  // Thách bạn / Thách lại: link cùng seed + điểm của mình (số thật của ván vừa xong)
  function challengeRun(e) {
    const r = lastRun; if (!r) return;
    if (e && e.detail > 0) e.currentTarget.blur();
    CH.shareChallenge({ game: "ran-san-moi", seed: r.seed, score: r.score, against: r.chal });
  }
  function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch {} }
  // Màn nhận thách: thẻ riêng cùng kiểu thẻ menu (dựng bằng DOM, nút dùng class nút của game)
  if (chal) {
    const ovChal = document.createElement("div");
    ovChal.className = "ov ss-ov"; ovChal.id = "ovChal"; ovChal.hidden = true;
    const card = document.createElement("div"); card.className = "card";
    const h = document.createElement("h2"); h.textContent = "Thách đấu!";
    const sub = document.createElement("p"); sub.className = "sub"; sub.textContent = "Rắn Săn Mồi · " + MODE_NAME[mode] + " · mồi rơi đúng thứ tự như người thách";
    const acts = document.createElement("div"); acts.className = "actions ss-cta";
    const go = document.createElement("button"); go.type = "button"; go.className = "btn btn--big btn--primary"; go.id = "chalGo"; go.textContent = "⚔ Nhận thách đấu";
    const skip = document.createElement("button"); skip.type = "button"; skip.className = "btn btn--big"; skip.id = "chalSkip"; skip.textContent = "Chơi thường";
    go.addEventListener("click", start);
    skip.addEventListener("click", () => { leaveChallenge(); mode = save.mode; showMenu(); showOv("ovMenu"); });
    acts.append(go, skip); card.append(h, sub, CH.introBox(chal), acts); ovChal.appendChild(card);
    ui.ovMenu.after(ovChal);
    ui.ovChal = ovChal;
  }
  function showOv(which) {
    for (const k of ["ovMenu", "ovPause", "ovEnd", "ovChal"]) if (ui[k]) ui[k].hidden = k !== which;
    document.body.classList.toggle("is-menu", which === "ovMenu" || which === "ovEnd" || which === "ovChal");
  }
  function setPaused(on) {
    if (!s || s.status !== "play" || paused === on) return;
    paused = on; showOv(on ? "ovPause" : null);
    sfx.play("buoc-nhay", 0.4, on ? 0.8 : 1.2);
    if (!on) { last = performance.now(); cv.focus({ preventScroll: true }); }
  }
  function toMenu() { if (s) sfx.play("buoc-nhay", 0.35, 0.8); clearTimeout(endTimer); s = null; paused = false; if (chal) { leaveChallenge(); mode = save.mode; } showMenu(); showOv("ovMenu"); }
  function showMenu() {
    for (const b of document.querySelectorAll(".mode")) { const on = b.dataset.mode === mode; b.classList.toggle("on", on); b.setAttribute("aria-checked", on); }
    const bc = save.best.classic, bw = save.best.wrap;
    ui.mBest.textContent = bc || bw ? `Kỷ lục: Cổ điển ${bc ? fmtNum(bc) : "—"} · Xuyên tường ${bw ? fmtNum(bw) : "—"}` : "";
  }
  let hudKey = "";
  function hud() {
    const len = s ? s.snake.length : START_LEN, best = save.best[s ? s.mode : mode];
    const k = [s ? s.score : 0, best, len, s ? speedLevel(s) : 1, Math.floor(time), paused].join();
    if (k === hudKey) return; hudKey = k;
    ui.score.textContent = fmtNum(s ? s.score : 0);
    ui.best.textContent = best ? fmtNum(best) : "—";
    ui.len.textContent = len;
    ui.fill.style.width = (((len - START_LEN) % 5) / 5 * 100) + "%";
    ui.speed.textContent = s ? speedLevel(s) : 1;
    ui.time.textContent = fmtTime(time);
    ui.pause.disabled = !s || s.status !== "play";
  }

  // ---------- Điều khiển ----------
  function go(d) {
    if (!s) return;
    if (paused) return;
    if (turn(s, d)) sfx.play("buoc-nhay", 0.15, 1.8);
  }
  const KEYMAP = { arrowup: "up", w: "up", arrowdown: "down", s: "down", arrowleft: "left", a: "left", arrowright: "right", d: "right" };
  function onKey(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === "m") return toggleMute();
    if (KEYMAP[k]) { e.preventDefault(); if (s && s.status === "play") go(KEYMAP[k]); return; }
    if (k === "p" || k === "escape") { e.preventDefault(); if (s && s.status === "play") setPaused(!paused); return; }
    if (k === " " || k === "enter") {
      if (document.activeElement && document.activeElement.tagName === "BUTTON") return;
      e.preventDefault();
      if (!ui.ovMenu.hidden || !ui.ovEnd.hidden || (ui.ovChal && !ui.ovChal.hidden)) start(); else if (paused) setPaused(false);
    }
  }
  document.addEventListener("keydown", onKey);
  // vuốt: đổi hướng ngay khi kéo đủ 18px, gốc dời theo để vuốt liên tiếp trong một lần chạm
  let tch = null;
  cv.addEventListener("pointerdown", (e) => { if (e.pointerType === "mouse") return; tch = { id: e.pointerId, x: e.clientX, y: e.clientY }; });
  cv.addEventListener("pointermove", (e) => {
    if (!tch || e.pointerId !== tch.id) return;
    const dx = e.clientX - tch.x, dy = e.clientY - tch.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
    go(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up");
    tch.x = e.clientX; tch.y = e.clientY;
  });
  const endT = () => { tch = null; };
  cv.addEventListener("pointerup", endT); cv.addEventListener("pointercancel", endT);
  ui.pad.addEventListener("pointerdown", (e) => { const b = e.target.closest("[data-dir]"); if (!b) return; e.preventDefault(); go(b.dataset.dir); });
  ui.pad.addEventListener("click", (e) => { if (e.detail === 0) { const b = e.target.closest("[data-dir]"); if (b) go(b.dataset.dir); } }); // bàn phím/đọc màn hình
  for (const b of document.querySelectorAll(".mode")) b.addEventListener("click", () => { mode = b.dataset.mode; sfx.play("buoc-nhay", 0.5); showMenu(); hud(); });
  ui.play.addEventListener("click", start);
  $("againBtn").addEventListener("click", start);
  $("retryBtnP").addEventListener("click", start);
  $("shareBtnE").addEventListener("click", shareRun);
  $("chalBtnE").addEventListener("click", challengeRun);
  $("menuBtnE").addEventListener("click", toMenu);
  $("menuBtnP").addEventListener("click", toMenu);
  $("resumeBtn").addEventListener("click", () => setPaused(false));
  ui.pause.addEventListener("click", () => setPaused(true));
  function showMute() { const m = !!sdk.sound.muted; ui.muteIc.src = "assets/ui/" + (m ? "icon-am-thanh-tat.png" : "icon-am-thanh-bat.png"); ui.mute.setAttribute("aria-pressed", m); }
  function toggleMute() { sdk.sound.muted = !sdk.sound.muted; try { localStorage.setItem("wgp.muted", sdk.sound.muted ? "1" : "0"); } catch {} showMute(); }
  ui.mute.addEventListener("click", toggleMute);
  const onVis = () => { if (document.hidden) setPaused(true); };
  const onBlur = () => setPaused(true);
  document.addEventListener("visibilitychange", onVis);
  window.addEventListener("blur", onBlur);

  layout(); showMute(); showMenu(); showOv(chal ? "ovChal" : "ovMenu");
  raf = requestAnimationFrame(tickLoop);

  return {
    get state() { return s; }, get paused() { return paused; }, get challenge() { return chal; }, get runSeed() { return runSeed; }, get lastRun() { return lastRun; }, get save() { return save; }, get layout() { return L; }, get time() { return time; }, sfx,
    cellPoint, start, go, setPaused, toMenu,
    /** test: chạy n nhịp ngay lập tức */
    steps(n) { for (let i = 0; i < n && s && s.status === "play"; i++) onStep(step(s), performance.now()); },
    destroy() {
      destroyed = true; cancelAnimationFrame(raf); clearTimeout(endTimer); ro.disconnect();
      document.removeEventListener("keydown", onKey); document.removeEventListener("visibilitychange", onVis); window.removeEventListener("blur", onBlur);
      sfx.close();
    },
  };
}
