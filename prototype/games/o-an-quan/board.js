// Ô Ăn Quan — vẽ bàn (canvas 2D), bố cục, chạm ô, mũi tên chọn hướng và hoạt cảnh rải từng viên theo chuỗi bước của logic.js.
// Toạ độ "cảnh" 1200×480 (khớp asset-spec). Một ma trận duy nhất đưa cảnh → điểm ảnh thiết bị: lật 180° khi mình là đội B
// (hàng mình luôn ở dưới), xoay 90° khi khung dọc (điện thoại) để bàn to gấp rưỡi. Hệ số phóng làm tròn bội 0,5 theo dpr
// (PLAYBOOK §2) để ảnh pixel sắc; tắt làm mượt ảnh khi phóng ≥ 0,5.
import { ROWS, QUAN, isQuan } from "./logic.js";
import { SCENE, DEFAULT_PLACEMENTS, drawTray } from "./art.js?v=oaq1";

const C = { gold: "#ffc94a", goldD: "#5a3a08", teal: "#6fd0bb", line: "#0a0807", ink: "#f4ead2", a: "#9cc8ff", b: "#ff8f84", aD: "#3f8be0", bD: "#e0483d" };
const TEAM_COL = [C.a, C.b], TEAM_ACC = [C.aD, C.bD];
const hash = (n) => { n = (n ^ 61) ^ (n >>> 16); n = (n + (n << 3)) | 0; n ^= n >>> 4; n = Math.imul(n, 0x27d4eb2d); return (n ^ (n >>> 15)) >>> 0; };
const mul = (A, B) => [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3], A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5]];
const app = (M, x, y) => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]];
const inv = (M) => { const d = M[0] * M[3] - M[1] * M[2]; return [M[3] / d, -M[1] / d, -M[2] / d, M[0] / d, (M[2] * M[5] - M[3] * M[4]) / d, (M[1] * M[4] - M[0] * M[5]) / d]; };
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const lerp = (a, b, t) => a + (b - a) * t;

export function createBoard(cv, { sfx = {}, onChange = () => {} } = {}) {
  const g = cv.getContext("2d");
  let sheets = null, P = DEFAULT_PLACEMENTS, yardPattern = null;
  let M = [1, 0, 0, 1, 0, 0], Mi = M, k = 1, kCss = 1, dpr = 1, rot = false, flip = false, W = 0, H = 0, smooth = false;
  let D = null;                  // trạng thái đang HIỂN THỊ (đi sau trạng thái thật trong lúc hoạt cảnh)
  let quiet = false, queue = [], cur = null, curT = 0, speed = 1, hand = null, flyers = [], floats = [], marks = [], lastNow = 0, done = null;
  const api = { mine: 0, canAct: false, preview: null, selected: null, cursor: null, hover: null, hoverArrow: 0, flash: null };

  // ---------- hình
  function setSheets(s) {
    sheets = s; P = s.placements || DEFAULT_PLACEMENTS;
    yardPattern = s.yardTile ? g.createPattern(s.yardTile, "repeat") : null;
  }
  const place = (pit) => P["pit-" + pit] || DEFAULT_PLACEMENTS["pit-" + pit];
  const tray = (side) => P[side ? "tray-b" : "tray-a"] || DEFAULT_PLACEMENTS[side ? "tray-b" : "tray-a"];
  const pitHalf = (pit) => { const p = place(pit); return p.half || [p.r * 1.3, p.r * 1.3]; };

  // ---------- bố cục
  function layout() {
    const r = cv.getBoundingClientRect();
    dpr = Math.min(3, window.devicePixelRatio || 1);
    W = Math.max(1, Math.round(r.width * dpr)); H = Math.max(1, Math.round(r.height * dpr));
    cv.width = W; cv.height = H;
    const m = 10, fitN = Math.min(W / (SCENE.w + 2 * m), H / (SCENE.h + 2 * m)), fitR = Math.min(W / (SCENE.h + 2 * m), H / (SCENE.w + 2 * m));
    rot = fitR > fitN * 1.15;
    const fit = rot ? fitR : fitN;
    const snapped = Math.floor(fit * 2) / 2;
    k = snapped >= 0.5 && snapped / fit >= 0.75 ? snapped : fit; // chịu nhỏ đi tới 25% để giữ bội 0,5 (nét)
    smooth = k < 0.5;
    kCss = k / dpr;
    const cw = (rot ? SCENE.h : SCENE.w) * k, ch = (rot ? SCENE.w : SCENE.h) * k;
    const ox = Math.round((W - cw) / 2), oy = Math.round((H - ch) / 2);
    // F: lật 180° (đội B nhìn từ phía mình) · R: xoay ngược kim đồng hồ 90° (bên phải cảnh → phía trên màn hình)
    const F = flip ? [-1, 0, 0, -1, SCENE.w, SCENE.h] : [1, 0, 0, 1, 0, 0];
    const R = rot ? [0, -1, 1, 0, 0, SCENE.w] : [1, 0, 0, 1, 0, 0];
    M = mul([k, 0, 0, k, ox, oy], mul(R, F));
    Mi = inv(M);
  }
  function setPerspective(team) { const f = team === 1; if (f !== flip) { flip = f; layout(); } api.mine = team; }

  // ---------- toạ độ
  const toDev = (x, y) => app(M, x, y);
  const toScene = (clientX, clientY) => { const r = cv.getBoundingClientRect(); return app(Mi, (clientX - r.left) * dpr, (clientY - r.top) * dpr); };
  const devToClient = ([x, y]) => { const r = cv.getBoundingClientRect(); return { x: r.left + x / dpr, y: r.top + y / dpr }; };
  // vectơ màn hình (đơn vị) theo chiều +1 dọc hàng của đội `team`
  function rowVec(team) {
    const row = ROWS[team], a = toDev(...place(row[0]).at), b = toDev(...place(row[4]).at);
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    return [dx / l, dy / l];
  }
  function stonePos(pit, i) {
    const p = place(pit), [cx, cy] = p.at, q = isQuan(pit);
    const cap = q ? 22 : 18, layer = Math.floor(i / cap), j = i % cap, h = hash(pit * 977 + i * 131);
    const a = j * 2.39996 + pit * 0.7 + ((h & 255) / 255) * 0.5;
    const rMin = q ? p.r * 0.56 : 0, rr = rMin + (p.r - rMin) * Math.sqrt((j + 0.6) / cap);
    return [Math.round(cx + Math.cos(a) * rr + (((h >> 8) & 7) - 3) + layer * 3), Math.round(cy + Math.sin(a) * rr * (q ? 1 : 0.92) + (((h >> 11) & 7) - 3) - layer * 4)];
  }
  const variant = (pit, i) => "dan-" + (1 + (hash(pit * 31 + i * 7 + 5) % 8));
  function trayPos(side, i, quan = false) {
    const t = tray(side), x0 = t.at[0] - t.w / 2, y0 = t.at[1] - t.h / 2;
    if (quan) return [x0 + 34 + i * 40, t.at[1]];
    const cols = Math.floor((t.w - 120) / 14), c = i % (cols * 2), layer = Math.floor(i / (cols * 2));
    return [x0 + 110 + (c % cols) * 14 + (Math.floor(c / cols) % 2) * 7 + layer * 3, y0 + 14 + Math.floor(c / cols) * 14 - layer * 4];
  }

  // ---------- vẽ sprite (toạ độ cảnh, đặt neo đúng lưới 2 px)
  function sprite(sheet, name, x, y, alpha = 1, scale = 1) {
    if (!sheet) return;
    const f = sheet.frames[name]; if (!f) return;
    const [sx, sy, sw, sh] = f.rect, [ax, ay] = f.anchor;
    g.globalAlpha = alpha;
    g.drawImage(sheet.img, sx, sy, sw, sh, Math.round(x - ax * scale), Math.round(y - ay * scale), sw * scale, sh * scale);
    g.globalAlpha = 1;
  }
  const stone = (name, x, y, a, s) => sprite(sheets.stones, name, x, y, a, s);
  const quanStone = (side, x, y, a, s) => sprite(sheets.quan, side ? "quan-right" : "quan-left", x, y, a, s);

  // chữ thẳng đứng trên màn hình (không xoay theo bàn)
  function text(str, dev, { size = 16, col = C.ink, bg = null, pad = 4, alpha = 1, stroke = true } = {}) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalAlpha = alpha;
    g.font = `800 ${Math.round(size * dpr)}px "Be Vietnam Pro", system-ui, sans-serif`;
    g.textAlign = "center"; g.textBaseline = "middle";
    const w = g.measureText(str).width, hgt = size * dpr;
    const x = Math.round(dev[0]), y = Math.round(dev[1]);
    if (bg) {
      const bw = Math.round(w + pad * 2 * dpr), bh = Math.round(hgt + pad * 1.2 * dpr), t = Math.max(1, Math.round(2 * dpr));
      g.fillStyle = C.line; g.fillRect(x - bw / 2 - t, y - bh / 2 - t, bw + 2 * t, bh + 2 * t);
      g.fillStyle = bg; g.fillRect(x - bw / 2, y - bh / 2, bw, bh);
    }
    if (stroke) { g.fillStyle = "#000"; g.fillText(str, x + Math.max(1, Math.round(2 * dpr)), y + Math.max(1, Math.round(2 * dpr))); }
    g.fillStyle = col; g.fillText(str, x, y);
    g.globalAlpha = 1;
    g.setTransform(...M);
  }

  // khung góc (ngoặc vuông pixel) quanh ô
  function brackets(pit, col, grow = 0) {
    const [cx, cy] = place(pit).at, [hx, hy] = pitHalf(pit), t = 6, L = 26;
    const x0 = cx - hx - grow, y0 = cy - hy - grow, x1 = cx + hx + grow, y1 = cy + hy + grow;
    g.fillStyle = C.line;
    for (const [x, y, sx, sy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]) {
      g.fillRect(sx > 0 ? x - 2 : x - L - 2, sy > 0 ? y - 2 : y - t - 2, L + 4, t + 4);
      g.fillRect(sx > 0 ? x - 2 : x - t - 2, sy > 0 ? y - 2 : y - L - 2, t + 4, L + 4);
    }
    g.fillStyle = col;
    for (const [x, y, sx, sy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]) {
      g.fillRect(sx > 0 ? x : x - L, sy > 0 ? y : y - t, L, t);
      g.fillRect(sx > 0 ? x : x - t, sy > 0 ? y : y - L, t, L);
    }
  }

  // ---------- mũi tên chọn hướng (hai nút vàng hai bên ô đang chọn)
  function arrowGeom(dir) {
    const pit = api.selected; if (pit == null) return null;
    const [cx, cy] = place(pit).at, [hx] = pitHalf(pit);
    // trục +1 của hàng trong toạ độ cảnh: từ ô đầu tới ô cuối hàng
    const row = ROWS[api.mine], a = place(row[0]).at, b = place(row[4]).at, l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const ux = (b[0] - a[0]) / l, uy = (b[1] - a[1]) / l;
    const size = Math.max(64, Math.round(50 / kCss)); // ≥ 50 px CSS cho ngón cái
    const off = hx + size * 0.18;
    return { x: cx + ux * off * dir, y: cy + uy * off * dir, ux: ux * dir, uy: uy * dir, size };
  }
  function drawArrow(dir) {
    const A = arrowGeom(dir); if (!A) return;
    const s = A.size, hov = api.hoverArrow === dir;
    // vẽ trong hệ quay theo hướng mũi tên
    const ang = Math.atan2(A.uy, A.ux);
    g.save(); g.translate(Math.round(A.x), Math.round(A.y)); g.rotate(ang);
    const u = Math.max(2, Math.round(s / 16 / 2) * 2), half = Math.round(s / 2 / u) * u;
    g.fillStyle = "rgba(0,0,0,.55)"; g.fillRect(-half + u * 2, -half + u * 2, half * 2, half * 2);
    g.fillStyle = C.line; g.fillRect(-half - u, -half, half * 2 + 2 * u, half * 2); g.fillRect(-half, -half - u, half * 2, half * 2 + 2 * u);
    g.fillStyle = hov ? "#ffe9a8" : C.gold; g.fillRect(-half, -half, half * 2, half * 2);
    g.fillStyle = "#fff3c9"; g.fillRect(-half, -half, half * 2, u);
    g.fillStyle = "#c48a1e"; g.fillRect(-half, half - u, half * 2, u);
    // mũi tên pixel: thân + đầu tam giác bậc thang (lưới u)
    g.fillStyle = "#2c1b05";
    const sn = (v) => Math.round(v / u) * u;
    const hb = Math.max(u, sn(half * 0.2)), bx0 = sn(-half * 0.62), hx0 = sn(half * 0.02), hx1 = sn(half * 0.66), hh = sn(half * 0.56);
    g.fillRect(bx0, -hb, hx0 - bx0, hb * 2);
    for (let x = hx0; x < hx1; x += u) { const h = Math.max(u, sn(hh * (1 - (x - hx0) / (hx1 - hx0)))); g.fillRect(x, -h, u, h * 2); }
    g.restore();
  }

  // ---------- vẽ một khung hình
  function draw(now) {
    const dt = lastNow ? Math.min(100, now - lastNow) : 16; lastNow = now;
    tick(dt);
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.imageSmoothingEnabled = smooth;
    g.fillStyle = "#4a2416"; g.fillRect(0, 0, W, H);
    if (!sheets) return;
    g.setTransform(...M);
    // nền sân: ảnh Codex (căn giữa bàn) hoặc gạch lặp vẽ bằng code
    const c0 = app(Mi, 0, 0), c1 = app(Mi, W, H), x0 = Math.min(c0[0], c1[0]) - 4, y0 = Math.min(c0[1], c1[1]) - 4, x1 = Math.max(c0[0], c1[0]) + 4, y1 = Math.max(c0[1], c1[1]) + 4;
    if (yardPattern) { g.fillStyle = yardPattern; g.fillRect(x0, y0, x1 - x0, y1 - y0); }
    if (sheets.yard) g.drawImage(sheets.yard, (SCENE.w - sheets.yard.width) / 2, (SCENE.h - sheets.yard.height) / 2);
    g.drawImage(sheets.board, 0, 0);
    if (!D) return;
    // khay điểm hai đội
    for (const side of [0, 1]) {
      const t = tray(side);
      drawTray(g, t.at[0], t.at[1], t.w, t.h, TEAM_ACC[side]);
      const shown = Math.max(0, Math.min(90, D.score[side] - 10 * D.eaten[side]));
      [0, 1].filter((q) => D.quanBy[q] === side).forEach((q, i) => quanStone(q, ...trayPos(side, i, true), 1, 0.5));
      for (let i = 0; i < shown; i++) stone(variant(side + 40, i), ...trayPos(side, i), 1, 0.75);
    }
    // ô có thể chọn / ô đang chọn
    const pulse = Math.floor(now / 380) % 2;
    if (api.canAct) for (const p of ROWS[api.mine]) if (D.pits[p] > 0 && p !== api.selected) brackets(p, p === api.cursor || p === api.hover ? C.gold : C.teal, pulse ? 2 : 0);
    if (api.flash && now - api.flash.t < 320) brackets(api.flash.pit, "#ff6a5a", 0);
    for (const m of marks) brackets(m.pit, m.col, 0);
    // quan + sỏi trong từng ô
    for (let pit = 0; pit < 12; pit++) {
      if (isQuan(pit) && D.quan[pit ? 1 : 0]) { const [x, y] = place(pit).at; quanStone(pit ? 1 : 0, x, y); }
      for (let i = 0; i < D.pits[pit]; i++) stone(variant(pit, i), ...stonePos(pit, i));
    }
    if (api.selected != null && api.canAct) brackets(api.selected, C.gold, 2);
    // nắm sỏi đang cầm + sỏi đang bay
    if (hand && hand.n > 0) {
      // nắm sỏi nhấc lên theo hướng "lên" của màn hình (bàn có thể đang xoay / lật)
      const [hx, hy] = hand.pos, lift = hand.lift ?? 1, [ux, uy] = upVec(), sx = -uy, sy = ux;
      const L = 26 * lift;
      if (sheets.hand) sprite(sheets.hand, "hand-hold", hx + ux * (L + 8), hy + uy * (L + 8));
      for (let i = 0; i < Math.min(hand.n, 12); i++) {
        const side = ((i * 7) % 15) - 7, up = L + Math.floor(i / 3) * 4;
        stone(variant(hand.at + 50, i), hx + ux * up + sx * side, hy + uy * up + sy * side, 1);
      }
    }
    for (const f of flyers) {
      const t = Math.max(0, Math.min(1, (curT - f.delay) / (f.dur || 1)));
      if (curT < f.delay) continue;
      const e = ease(t), x = lerp(f.from[0], f.to[0], e), y = lerp(f.from[1], f.to[1], e);
      const [lx, ly] = upVec(); const arc = Math.sin(Math.PI * t) * (f.arc ?? 36);
      if (f.quan !== undefined) quanStone(f.quan, x + lx * arc, y + ly * arc, 1, lerp(1, f.toScale ?? 1, e));
      else stone(f.frame, x + lx * arc, y + ly * arc, 1, lerp(1, f.toScale ?? 1, e));
    }
    // số đếm (chữ thẳng đứng)
    for (let pit = 0; pit < 12; pit++) {
      const n = D.pits[pit];
      const [cx, cy] = place(pit).at, [hx, hy] = pitHalf(pit);
      const corner = isQuan(pit) ? [cx, cy + hy * 0.66] : [cx + hx * 0.66, cy + hy * 0.7];
      const dev = toDev(...corner);
      if (n || !isQuan(pit)) text(String(n), dev, { size: Math.max(11, Math.min(15, 15 * kCss * 1.4)), col: n ? C.ink : "#8a7c66", bg: "rgba(18,12,8,.82)", pad: 3, stroke: false });
    }
    for (const side of [0, 1]) {
      const t = tray(side), dev = toDev(t.at[0] - t.w / 2 - 34, t.at[1]);
      text(String(D.score[side]), dev, { size: Math.max(13, Math.min(20, 20 * kCss * 1.3)), col: TEAM_COL[side], bg: "rgba(18,12,8,.9)", pad: 4 });
    }
    if (api.canAct && api.selected != null) { drawArrow(-1); drawArrow(1); }
    if (api.preview) { // máy / người khác vừa chọn ô + hướng: hiện một nhịp trước khi rải
      const keep = [api.selected, api.mine];
      api.selected = api.preview.pit; api.mine = api.preview.side;
      brackets(api.preview.pit, C.gold, 2); drawArrow(api.preview.dir);
      [api.selected, api.mine] = keep;
    }
    // chữ nổi
    floats = floats.filter((f) => now - f.t0 < f.dur);
    for (const f of floats) {
      const t = (now - f.t0) / f.dur, dev = toDev(...f.at);
      text(f.text, [dev[0], dev[1] - (18 + 40 * t) * dpr], { size: f.size, col: f.col, alpha: t > 0.75 ? Math.max(0, 1 - (t - 0.75) * 4) : 1, bg: f.bg || null, pad: 6 });
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
  }
  // hướng "lên" của màn hình trong toạ độ cảnh (để sỏi bay vòng cung lên trên dù bàn xoay/lật)
  function upVec() { const a = app(Mi, 0, 0), b = app(Mi, 0, -1); const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; }

  // ---------- hoạt cảnh theo chuỗi bước
  const DUR = { pick: 210, drop: 150, stop: 280, take: 560, refill: 760, collect: 760, repay: 900, end: 10 };
  const snd = (name, ...a) => { if (!quiet) sfx[name]?.(...a); };
  function float(text, at, { col = C.ink, size = 20, dur = 1200, bg = null } = {}) { if (!quiet) floats.push({ text, at, col, size, dur, t0: performance.now(), bg }); }
  function makeTask(st, names) {
    switch (st.k) {
      case "pick": return { dur: DUR.pick, start() { hand = { at: st.at, n: D.pits[st.at], pos: place(st.at).at.slice(), lift: 0 }; D.pits[st.at] = 0; snd("pick"); },
        draw(t) { if (hand) hand.lift = ease(t); } };
      case "drop": return { dur: DUR.drop, start() {
          const from = hand ? hand.pos.slice() : place(st.at).at.slice();
          const to = stonePos(st.at, D.pits[st.at]);
          const [ux, uy] = upVec();
          flyers = [{ from: [from[0] + ux * 26, from[1] + uy * 26], to, frame: variant(st.at, D.pits[st.at]), dur: DUR.drop, delay: 0, arc: 26 }];
          if (hand) { hand.n--; hand.from = from; hand.to = place(st.at).at.slice(); }
        },
        draw(t) { if (hand && hand.from) { const e = ease(t); hand.pos = [lerp(hand.from[0], hand.to[0], e), lerp(hand.from[1], hand.to[1], e)]; } },
        end() { D.pits[st.at]++; flyers = []; snd("tach", D.pits[st.at]); } };
      case "stop": return { dur: DUR.stop, start() {
          hand = null;
          if (st.why === "quan") float("Mất lượt", place(st.at).at, { col: "#b9ad93", size: 15, dur: 900 });
          else if (st.why === "quan-non") float("Quan non, chưa ăn được", place(st.at).at, { col: "#ff8f84", size: 15, dur: 1300 });
          marks = [{ pit: st.at, col: "#b9ad93" }];
        }, end() { marks = []; } };
      case "take": return { dur: DUR.take, start() {
          hand = null;
          const n = D.pits[st.at];
          flyers = [];
          const baseIdx = Math.max(0, D.score[st.side] - 10 * D.eaten[st.side]);
          for (let i = 0; i < n; i++) flyers.push({ from: stonePos(st.at, i), to: trayPos(st.side, baseIdx + i), frame: variant(st.at, i), dur: DUR.take * 0.7, delay: Math.min(i * 12, DUR.take * 0.28), toScale: 0.75 });
          if (st.quan) { flyers.push({ from: place(st.at).at, to: trayPos(st.side, [0, 1].filter((q) => D.quanBy[q] === st.side).length, true), quan: st.at ? 1 : 0, dur: DUR.take * 0.85, delay: 0, toScale: 0.5, arc: 60 }); D.quan[st.at ? 1 : 0] = false; }
          D.pits[st.at] = 0;
          marks = [{ pit: st.at, col: TEAM_COL[st.side] }];
          if (st.quan) { float("ĂN QUAN! +" + st.v, place(st.at).at, { col: C.gold, size: 26, dur: 1500, bg: "rgba(44,27,5,.9)" }); snd("quan"); }
          else { float("+" + st.v, place(st.at).at, { col: TEAM_COL[st.side], size: 22, dur: 1100 }); snd("take", st.v); }
        }, end() { D.score[st.side] += st.v; if (st.quan) { D.eaten[st.side]++; D.quanBy[st.at ? 1 : 0] = st.side; } flyers = []; marks = []; onChange(); } };
      case "refill": return { dur: DUR.refill, start() {
          const o = 1 - st.side;
          D.score[st.side] -= st.own; D.score[o] -= st.borrow; D.debt[st.side] += st.borrow;
          flyers = st.at.map((p, i) => ({ from: trayPos(i < st.own ? st.side : o, i), to: stonePos(p, D.pits[p]), frame: variant(p, D.pits[p]), dur: DUR.refill * 0.6, delay: i * 70 }));
          const who = names[st.side];
          const msg = st.borrow ? (st.own ? `${who} hết dân! Rải lại ${st.own}, vay thêm ${st.borrow} dân` : `${who} cháy túi! Vay ${st.borrow} dân rải lại`) : `${who} hết dân! Lấy 5 dân ra rải lại`;
          float(msg, place(ROWS[st.side][2]).at, { col: st.borrow ? "#ffe9a8" : C.ink, size: 16, dur: 2200, bg: "rgba(18,12,8,.9)" });
          snd("refill", !!st.borrow); onChange();
        }, end() { for (const p of st.at) D.pits[p]++; flyers = []; } };
      case "collect": return { dur: DUR.collect, start() {
          flyers = []; let i = Math.max(0, D.score[st.side] - 10 * D.eaten[st.side]);
          for (const [p, n] of st.at) { for (let j = 0; j < n; j++) flyers.push({ from: stonePos(p, j), to: trayPos(st.side, i++), frame: variant(p, j), dur: DUR.collect * 0.6, delay: Math.min(j * 30 + p * 10, DUR.collect * 0.35), toScale: 0.75 }); D.pits[p] = 0; }
          float(`Thu ${st.n} dân`, place(ROWS[st.side][2]).at, { col: TEAM_COL[st.side], size: 18, dur: 1300 });
          snd("take", st.n);
        }, end() { D.score[st.side] += st.n; flyers = []; onChange(); } };
      case "repay": return { dur: DUR.repay, start() {
          float(`${names[st.side]} trả nợ ${st.n} dân`, place(ROWS[st.side][2]).at, { col: "#ffe9a8", size: 16, dur: 1500, bg: "rgba(18,12,8,.9)" });
        }, end() { D.score[st.side] -= st.n; D.score[1 - st.side] += st.n; D.debt[st.side] = 0; onChange(); } };
      default: return { dur: DUR.end };
    }
  }
  function tick(dt) {
    let budget = dt * speed;
    while (budget > 0 && (cur || queue.length)) {
      if (!cur) { cur = queue.shift(); curT = 0; cur.start?.(); }
      const left = cur.dur - curT;
      if (budget >= left) { budget -= left; curT = cur.dur; cur.draw?.(1); cur.end?.(); cur = null; }
      else { curT += budget; budget = 0; cur.draw?.(curT / cur.dur); }
    }
    if (!cur && !queue.length && done) finishAnim();
  }
  function finishAnim() { const f = done; done = null; flyers = []; hand = null; marks = []; speed = 1; onChange(); f(); }
  let target = null;
  /** Chạy hoạt cảnh của một nước: steps = chuỗi bước logic.js, final = trạng thái thật sau nước đó. names = tên hai đội. */
  function animate(steps, final, names = ["Đội A", "Đội B"]) {
    if (done) skip();
    target = final;
    queue = steps.map((s) => makeTask(s, names));
    return new Promise((res) => { done = () => { show(target); res(); }; onChange(); });
  }
  function skip() {
    if (!done) return;
    quiet = true;
    if (cur) { cur.end?.(); cur = null; }
    for (const t of queue) { t.start?.(); t.end?.(); }
    quiet = false;
    queue = []; floats = floats.slice(-2);
    finishAnim();
  }
  function show(s) {
    D = s ? { pits: s.pits.slice(), quan: s.quan.slice(), score: s.score.slice(), debt: s.debt.slice(), eaten: s.eaten.slice(), quanBy: (s.quanBy || [-1, -1]).slice() } : null;
    onChange();
  }

  // ---------- chạm
  function hit(clientX, clientY) {
    const [x, y] = toScene(clientX, clientY);
    if (api.canAct && api.selected != null) for (const dir of [-1, 1]) {
      const A = arrowGeom(dir);
      if (A && Math.abs(x - A.x) <= A.size * 0.62 && Math.abs(y - A.y) <= A.size * 0.62) return { kind: "arrow", dir };
    }
    for (const pit of [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 0, 6]) { // ô dân trước: vùng bấm ô quan có thể chờm sang
      const [cx, cy] = place(pit).at, [hx, hy] = pitHalf(pit);
      if (Math.abs(x - cx) <= hx && Math.abs(y - cy) <= hy) return { kind: "pit", pit };
    }
    return null;
  }

  // defineProperties (không phải Object.assign) để giữ nguyên getter/setter
  Object.defineProperties(api, Object.getOwnPropertyDescriptors({
    setSheets, layout, setPerspective, draw, animate, skip, show, hit, float,
    get busy() { return !!done; },
    get fast() { return speed > 1; }, set fast(on) { speed = on ? 4 : 1; },
    get display() { return D; },
    get info() { return { k, kCss, dpr, rot, flip, smooth, W, H }; },
    /** Tâm ô theo toạ độ CSS của trang (cho test bấm thật). */
    pitPoint: (pit) => devToClient(toDev(...place(pit).at)),
    arrowPoint: (dir) => { const A = arrowGeom(dir); return A && devToClient(toDev(A.x, A.y)); },
    trayPoint: (side) => devToClient(toDev(...tray(side).at)),
    /** Chiều +1 trên màn hình của hàng đội team — để phím mũi tên chọn đúng hướng khi bàn xoay/lật. */
    dirFromKey(dx, dy) { const [ux, uy] = rowVec(api.mine); const d = ux * dx + uy * dy; return d > 0.3 ? 1 : d < -0.3 ? -1 : 0; },
    /** Khung bao bàn trên trang (CSS px) — test kiểm bàn nằm gọn. */
    boardRect() {
      const pts = [[0, 0], [SCENE.w, 0], [0, SCENE.h], [SCENE.w, SCENE.h]].map(([x, y]) => devToClient(toDev(x, y)));
      return { l: Math.min(...pts.map((p) => p.x)), r: Math.max(...pts.map((p) => p.x)), t: Math.min(...pts.map((p) => p.y)), b: Math.max(...pts.map((p) => p.y)) };
    },
  }));
  return api;
}
export { QUAN };
