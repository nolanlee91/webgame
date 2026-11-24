// Ô Ăn Quan — hình vẽ bằng code (dùng khi chưa có ảnh Codex, hoặc ảnh tải lỗi). Vẽ đúng định dạng của hợp đồng asset
// (docs/o-an-quan/asset-spec.json): bàn 1200×480, sỏi ô 32×32 (dan-1..8), quan ô 96×96 (quan-left/right), nền sân lát gạch.
// Mọi nét vẽ theo lưới 2 px (1 điểm vẽ = ô 2×2) để khi phóng nguyên bội vẫn sắc như ảnh pixel thật.
// Toạ độ ô (placements) của bàn vẽ bằng code nằm ở DEFAULT_PLACEMENTS — data/asset-manifest.json mặc định dùng đúng số này.

export const SCENE = { w: 1200, h: 480 };
const PIT = 116, GAP = 14, COL0 = 600 - (5 * PIT + 4 * GAP) / 2, ROW0 = 240 - (2 * PIT + GAP) / 2;
const colX = (c) => COL0 + c * (PIT + GAP) + PIT / 2;
const rowY = (r) => ROW0 + r * (PIT + GAP) + PIT / 2;
export const BOARD_BOX = { x0: 36, y0: 66, x1: 1164, y1: 414 };
const QUAN_R = 140, QUAN_L = COL0 - GAP, QUAN_RX = 1200 - QUAN_L; // mép phẳng của hai ô quan bán nguyệt

export const DEFAULT_PLACEMENTS = (() => {
  const p = {};
  p["pit-0"] = { at: [QUAN_L - 64, 240], r: 60, half: [QUAN_R, QUAN_R] };
  p["pit-6"] = { at: [QUAN_RX + 64, 240], r: 60, half: [QUAN_R, QUAN_R] };
  for (let i = 1; i <= 5; i++) p["pit-" + i] = { at: [colX(i - 1), rowY(1)], r: 44, half: [PIT / 2, PIT / 2] };
  for (let i = 7; i <= 11; i++) p["pit-" + i] = { at: [colX(11 - i), rowY(0)], r: 44, half: [PIT / 2, PIT / 2] };
  p["tray-a"] = { at: [600, 448], w: 560, h: 44 };
  p["tray-b"] = { at: [600, 32], w: 560, h: 44 };
  return p;
})();

// ---------- tiện ích vẽ theo lưới 2 px
function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const ev = (v) => Math.round(v / 2) * 2;
function canvas(w, h) {
  const c = typeof OffscreenCanvas !== "undefined" && typeof document === "undefined" ? new OffscreenCanvas(w, h) : document.createElement("canvas");
  c.width = w; c.height = h; return c;
}
function rect(g, x, y, w, h, col) { g.fillStyle = col; g.fillRect(ev(x), ev(y), ev(w), ev(h)); }
// Tô một hình theo hàm inside(x, y) trên lưới 2 px.
function shape(g, x0, y0, x1, y1, inside, col) {
  g.fillStyle = col;
  for (let y = ev(y0); y < y1; y += 2) {
    let run = -1;
    for (let x = ev(x0); x <= x1 + 2; x += 2) {
      const on = x < x1 && inside(x + 1, y + 1);
      if (on && run < 0) run = x;
      if (!on && run >= 0) { g.fillRect(run, y, x - run, 2); run = -1; }
    }
  }
}
const inStadium = (bx, inset = 0) => (x, y) => {
  const r = (bx.y1 - bx.y0) / 2 - inset, cy = (bx.y0 + bx.y1) / 2, cl = bx.x0 + (bx.y1 - bx.y0) / 2, cr = bx.x1 - (bx.y1 - bx.y0) / 2;
  if (y < bx.y0 + inset || y > bx.y1 - inset) return false;
  if (x >= cl && x <= cr) return true;
  const cx = x < cl ? cl : cr;
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
};

// ---------- nền sân gạch tàu (ô lặp liền mạch 256×256: 4×4 viên gạch 64 px + bóng lá)
export function makeYardTile() {
  const T = 256, c = canvas(T, T), g = c.getContext("2d"), R = rng(7);
  rect(g, 0, 0, T, T, "#5a2a18"); // mạch vữa
  const tones = ["#b5523a", "#a94b34", "#bd5c40", "#9f4530", "#b9573b", "#c4643f"];
  for (let r = 0; r < 4; r++) for (let q = 0; q < 4; q++) {
    const x = q * 64, y = r * 64, base = tones[Math.floor(R() * tones.length)];
    rect(g, x + 2, y + 2, 60, 60, base);
    rect(g, x + 2, y + 2, 60, 2, "#d27a55");           // mép sáng trên
    rect(g, x + 2, y + 2, 2, 60, "#c86c4b");
    rect(g, x + 2, y + 60, 60, 2, "#7e3524");          // mép tối dưới
    rect(g, x + 60, y + 2, 2, 60, "#86392a");
    for (let k = 0; k < 14; k++) rect(g, x + 6 + R() * 50, y + 6 + R() * 50, 2, 2, R() < 0.5 ? "#93412d" : "#cf6f4c"); // lốm đốm
    if (R() < 0.35) rect(g, x + 10 + R() * 30, y + 10 + R() * 30, 8 + R() * 10, 2, "#8c3c2b"); // vết nứt
  }
  for (let k = 0; k < 26; k++) rect(g, Math.floor(R() * 4) * 64 + R() * 64, Math.floor(R() * 4) * 64 - 2 + (R() < 0.5 ? 0 : 64), 2 + R() * 6, 2, "#4f6b2a"); // rêu ở mạch
  // bóng lá loang (vẽ liền mạch theo cả 4 phía)
  g.globalAlpha = 0.22;
  const blobs = [];
  for (let k = 0; k < 9; k++) blobs.push([R() * T, R() * T, 14 + R() * 26]);
  for (const [bx, by, br] of blobs) for (const ox of [-T, 0, T]) for (const oy of [-T, 0, T]) {
    shape(g, bx + ox - br, by + oy - br, bx + ox + br, by + oy + br, (x, y) => ((x - bx - ox) / br) ** 2 + ((y - by - oy) / (br * 0.7)) ** 2 <= 1, "#2a0e06");
  }
  g.globalAlpha = 1;
  return c;
}

// ---------- bàn gỗ khắc ô (1200×480, nền trong suốt)
export function makeBoard() {
  const c = canvas(SCENE.w, SCENE.h), g = c.getContext("2d"), R = rng(11), B = BOARD_BOX;
  // bóng cứng dưới bàn
  g.globalAlpha = 0.5;
  shape(g, B.x0 + 10, B.y0 + 14, B.x1 + 12, B.y1 + 16, inStadium({ x0: B.x0 + 10, y0: B.y0 + 14, x1: B.x1 + 10, y1: B.y1 + 14 }), "#1c0a04");
  g.globalAlpha = 1;
  shape(g, B.x0 - 4, B.y0 - 4, B.x1 + 4, B.y1 + 4, inStadium({ x0: B.x0 - 4, y0: B.y0 - 4, x1: B.x1 + 4, y1: B.y1 + 4 }), "#2b1406"); // viền đen
  shape(g, B.x0, B.y0, B.x1, B.y1, inStadium(B), "#9c5a27");
  // vân gỗ: các vệt ngang dài ngắn
  const inB = inStadium(B, 4);
  for (let y = B.y0 + 4; y < B.y1 - 4; y += 2) {
    let x = B.x0 + R() * 40;
    while (x < B.x1) {
      const len = 20 + R() * 120, col = R() < 0.5 ? "#8e5021" : R() < 0.6 ? "#a8652f" : "#b06d35";
      for (let k = x; k < x + len; k += 2) if (inB(k + 1, y + 1)) rect(g, k, y, 2, 2, col);
      x += len + 10 + R() * 60;
      if (R() < 0.3) y += 0; // giữ nguyên hàng
    }
    if (R() < 0.4) y += 2;
  }
  // mép sáng trên / mép tối dưới
  shape(g, B.x0, B.y0, B.x1, B.y0 + 6, (x, y) => inStadium(B)(x, y) && !inStadium(B)(x, y - 6), "#c7894c");
  shape(g, B.x0, B.y1 - 8, B.x1, B.y1, (x, y) => inStadium(B)(x, y) && !inStadium(B)(x, y + 6), "#6b3a17");
  // rãnh khắc chạy quanh bàn
  const gIn = inStadium(B, 16), gIn2 = inStadium(B, 20);
  shape(g, B.x0, B.y0, B.x1, B.y1, (x, y) => gIn(x, y) && !gIn2(x, y), "#5c2f12");
  const gIn3 = inStadium(B, 22);
  shape(g, B.x0, B.y0, B.x1, B.y1, (x, y) => gIn2(x, y) && !gIn3(x, y), "#b97a40");
  // hoa văn khắc: dãy hình thoi giữa rãnh và hàng ô (trên + dưới)
  for (const yy of [B.y0 + 34, B.y1 - 38]) {
    for (let x = COL0 + 8; x < 1200 - COL0 - 8; x += 26) {
      for (let d = 0; d < 4; d++) { rect(g, x + 6 - d * 2, yy + d * 2, 2 + d * 4, 2, "#6e3a17"); rect(g, x + 6 - d * 2, yy + 12 - d * 2, 2 + d * 4, 2, "#6e3a17"); }
      rect(g, x + 6, yy + 6, 2, 2, "#c58a4e");
    }
  }
  // ô dân: hõm vuông cắt góc, bóng trong phía trên-trái, mép sáng dưới-phải
  for (let r = 0; r < 2; r++) for (let q = 0; q < 5; q++) {
    const x = COL0 + q * (PIT + GAP), y = ROW0 + r * (PIT + GAP);
    recess(g, x, y, PIT, PIT, R);
  }
  // ô quan bán nguyệt hai đầu (mép phẳng hướng vào trong)
  for (const side of [0, 1]) {
    const fx = side ? QUAN_RX : QUAN_L, sgn = side ? 1 : -1;
    const inQ = (ins) => (x, y) => (x - fx) * sgn >= ins && (x - fx) ** 2 + (y - 240) ** 2 <= (QUAN_R - ins) ** 2;
    const x0 = side ? fx : fx - QUAN_R, x1 = side ? fx + QUAN_R : fx;
    shape(g, x0 - 6, 240 - QUAN_R - 6, x1 + 6, 240 + QUAN_R + 6, (x, y) => (x - fx) * sgn >= -4 && (x - fx) ** 2 + (y - 240) ** 2 <= (QUAN_R + 4) ** 2, "#2b1406");
    shape(g, x0, 240 - QUAN_R, x1, 240 + QUAN_R, inQ(0), "#c08048");            // mép sáng (vát)
    shape(g, x0, 240 - QUAN_R, x1, 240 + QUAN_R, (x, y) => inQ(4)(x, y) && y < 240 + 30, "#3f1f0b"); // bóng trong phía trên
    shape(g, x0, 240 - QUAN_R, x1, 240 + QUAN_R, (x, y) => inQ(4)(x, y) && inQ(10)(x + 0, y - 8), "#5e3014");
    shape(g, x0, 240 - QUAN_R, x1, 240 + QUAN_R, (x, y) => inQ(12)(x, y - 10), "#6b3818");
    // lốm đốm đáy ô
    for (let k = 0; k < 60; k++) { const a = R() * Math.PI - Math.PI / 2, d = R() * (QUAN_R - 24); const x = fx + sgn * Math.abs(Math.cos(a) * d) + sgn * 12, y = 240 + Math.sin(a) * d; if (inQ(14)(x, y)) rect(g, x, y, 2, 2, R() < 0.5 ? "#5a2e12" : "#77421c"); }
  }
  return c;
}
function recess(g, x, y, w, h, R) {
  const cut = 6;
  const inR = (ins) => (px, py) => px >= x + ins && px < x + w - ins && py >= y + ins && py < y + h - ins &&
    !((px < x + cut + ins || px >= x + w - cut - ins) && (py < y + cut + ins || py >= y + h - cut - ins) && (Math.min(px - x - ins, x + w - ins - px) + Math.min(py - y - ins, y + h - ins - py) < cut));
  shape(g, x - 4, y - 4, x + w + 4, y + h + 4, inR(-4), "#2b1406");     // viền tối
  shape(g, x, y, x + w, y + h, inR(0), "#c08048");                      // mép vát sáng (lộ ở dưới-phải)
  shape(g, x, y, x + w, y + h, (px, py) => inR(0)(px, py) && inR(0)(px + 4, py + 4), "#3f1f0b"); // bóng trong trên-trái
  shape(g, x, y, x + w, y + h, (px, py) => inR(4)(px, py) && inR(4)(px - 6, py - 8), "#6b3818"); // đáy ô
  for (let k = 0; k < 22; k++) rect(g, x + 14 + R() * (w - 28), y + 16 + R() * (h - 28), 2, 2, R() < 0.5 ? "#5a2e12" : "#7a451e");
  rect(g, x + 10, y + h - 8, w - 18, 2, "#7d4620");
}

// ---------- sỏi dân: 8 biến thể trong ô 32×32 (dan-1..8), bóng cứng 2 px dưới chân
const PEBBLES = [
  ["#e9dcbc", "#fff4dc", "#b9a47c", "#5b4a33"], ["#d9c8a2", "#f3e6c6", "#a8926a", "#54432c"],
  ["#c9c4b6", "#ece8dc", "#8f8a7c", "#46433b"], ["#e2d2b0", "#fbf0d6", "#ad9771", "#584730"],
  ["#bba58a", "#e0cdb1", "#8a7358", "#45372a"], ["#efe3c6", "#fff9e8", "#c2ad86", "#5e4d36"],
  ["#a9a397", "#d6d1c4", "#7a7568", "#3c3a34"], ["#dccaa6", "#f6e9cc", "#a99271", "#56452f"],
];
export function makeStones() {
  const c = canvas(32 * 8, 32), g = c.getContext("2d"), frames = {};
  PEBBLES.forEach(([base, hi, lo, line], i) => {
    const ox = i * 32, rx = 10 + (i % 3 === 0 ? 1 : 0), ry = 7 + (i % 4 === 1 ? 2 : i % 2), cx = ox + 16, cy = 14;
    const ins = (dx, dy, a, b) => (x, y) => ((x - cx - dx) / a) ** 2 + ((y - cy - dy) / b) ** 2 <= 1;
    g.globalAlpha = 0.55; shape(g, cx - rx, cy - ry + 4, cx + rx + 2, cy + ry + 4, ins(0, 3, rx, ry - 1), "#1c0a04"); g.globalAlpha = 1;
    shape(g, cx - rx - 2, cy - ry - 2, cx + rx + 2, cy + ry + 2, ins(0, 0, rx + 1.5, ry + 1.5), line);
    shape(g, cx - rx, cy - ry, cx + rx, cy + ry, ins(0, 0, rx, ry), lo);
    shape(g, cx - rx, cy - ry, cx + rx, cy + ry, (x, y) => ins(0, 0, rx, ry)(x, y) && ins(-1.5, -1.8, rx - 1, ry - 1.2)(x, y), base);
    shape(g, cx - rx, cy - ry, cx + rx, cy, ins(-rx * 0.35, -ry * 0.45, rx * 0.38, ry * 0.32), hi);
    frames["dan-" + (i + 1)] = { rect: [ox, 0, 32, 32], anchor: [16, 16] };
  });
  return { img: c, frames };
}

// ---------- quân quan: viên đá lớn (trái ngọc lam, phải đỏ son) trong ô 96×96
const GEMS = { left: ["#3fae98", "#8be3cf", "#1f6e60", "#0f3a33", "#d6fff4"], right: ["#c8452e", "#ff9a7e", "#7f2414", "#3e0f07", "#ffe0d4"] };
export function makeQuan() {
  const c = canvas(192, 96), g = c.getContext("2d"), frames = {};
  ["left", "right"].forEach((k, i) => {
    const [base, hi, lo, line, spark] = GEMS[k], ox = i * 96, cx = ox + 48, cy = 46, rx = 30, ry = 24;
    const blob = (a, b, dx = 0, dy = 0) => (x, y) => { const u = (x - cx - dx) / a, v = (y - cy - dy) / b; return u ** 4 + v ** 4 + 0.6 * u * u * v * v <= 1; };
    g.globalAlpha = 0.55; shape(g, cx - rx, cy, cx + rx + 6, cy + ry + 10, blob(rx, ry - 2, 3, 7), "#1c0a04"); g.globalAlpha = 1;
    shape(g, cx - rx - 4, cy - ry - 4, cx + rx + 4, cy + ry + 4, blob(rx + 3, ry + 3), line);
    shape(g, cx - rx, cy - ry, cx + rx, cy + ry, blob(rx, ry), lo);
    shape(g, cx - rx, cy - ry, cx + rx, cy + ry, (x, y) => blob(rx, ry)(x, y) && blob(rx - 3, ry - 4, -2, -3)(x, y), base);
    shape(g, cx - rx, cy - ry, cx + rx, cy, blob(rx * 0.55, ry * 0.32, -8, -12), hi);
    // mặt cắt (facet) + lấp lánh
    for (let d = 0; d < 10; d += 2) rect(g, cx + 8 + d, cy - 4 + d, 2, 2, hi);
    rect(g, cx - 16, cy - 14, 4, 2, spark); rect(g, cx - 14, cy - 16, 2, 6, spark);
    rect(g, cx + 14, cy + 6, 2, 2, spark);
    frames["quan-" + k] = { rect: [ox, 0, 96, 96], anchor: [48, 48] };
  });
  return { img: c, frames };
}

// ---------- khay điểm (nong tre đan) — vẽ trực tiếp lên khung hình theo toạ độ cảnh
export function drawTray(g, cx, cy, w, h, accent) {
  const x = cx - w / 2, y = cy - h / 2;
  g.fillStyle = "rgba(28,10,4,.5)"; g.fillRect(x + 6, y + 8, w, h);
  g.fillStyle = "#2b1406"; g.fillRect(x - 4, y - 4, w + 8, h + 8);
  g.fillStyle = "#c79a55"; g.fillRect(x, y, w, h);
  g.fillStyle = "#b08544";
  for (let k = 0; k < w; k += 16) for (let j = 0; j < h; j += 8) if (((k / 16) + (j / 8)) % 2 === 0) g.fillRect(x + k, y + j, 8, 4);
  g.fillStyle = "#e0bb76"; g.fillRect(x, y, w, 2);
  g.fillStyle = "#8a6230"; g.fillRect(x, y + h - 4, w, 4);
  g.fillStyle = accent; g.fillRect(x - 4, y - 4, 12, h + 8);
}
