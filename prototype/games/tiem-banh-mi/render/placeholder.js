// Hình dự phòng khi asset Codex chưa có (đợt 1 đang vẽ). Vẽ bằng canvas trên lưới 2× (vẽ nửa cỡ rồi phóng ×2 nearest),
// đúng ô + anchor của docs/tiem-banh-mi/asset-spec.json ⇒ đi chung đường vẽ với frame thật (atlas.frame), thay bằng ảnh thật tự động.
// Chỉ hình khối + màu theo ART-DIRECTION §2, không chữ trên đồ vật (trừ số trên tờ tiền dự phòng). Không bao giờ ra ảnh vỡ.
const CELL = {
  chars: [144, 192, 72, 174], walks: [144, 192, 72, 174], reactions: [144, 192, 72, 174], actions: [144, 192, 72, 174], baker: [144, 192, 72, 174],
  loaf: [160, 192, 80, 174], ovens: [256, 256, 128, 240], equip: [192, 192, 96, 168], ingr: [64, 64, 32, 32], bills: [96, 48, 48, 24],
  cart: [1280, 720, 0, 0], cartFg: [1280, 720, 0, 0], title: [1280, 720, 0, 0],
};
const ROLE = {
  baker: { skin: "#D9A27A", top: "#E9DCC0", top2: "#D2C2A0", bottom: "#3A2A20", hat: "#E9DCC0", apron: "#4A3024", hair: "#2A1D16", mustache: true },
  student: { skin: "#E6B892", top: "#F4F2EC", top2: "#D8D6CE", bottom: "#24365A", hair: "#2A1D16", pack: "#3A6FB8", short: true },
  worker: { skin: "#B98058", top: "#E0843C", top2: "#B8652A", bottom: "#8A7A5A", hat: "#C9B48A", wide: true, hair: "#2A1D16" },
  shipper: { skin: "#DDA882", top: "#4FA35A", top2: "#3B7F45", bottom: "#2E3440", hat: "#E8D040", stripe: "#EDEDB8", hair: "#2A1D16" },
  office: { skin: "#E8BC98", top: "#A8CBE8", top2: "#86AACB", bottom: "#3A3F50", hair: "#3A2418", long: true, badge: "#F4F4F4" },
  regular: { skin: "#C99A78", top: "#9C9A90", top2: "#7E7C74", bottom: "#5A5A55", hair: "#E8E8E2" },
  reviewer: { skin: "#E0AE88", top: "#4A6FA0", top2: "#3A5A85", bottom: "#2A2A33", hat: "#C83A3A", hair: "#2A1D16", phone: true },
  tourist: { skin: "#F2C9A8", top: "#3FB8B0", top2: "#2E918B", bottom: "#C8B48A", hair: "#E8C860", hat: "#D8C080", cone: true, pack: "#8A6A3A" },
  parent: { skin: "#E6B892", top: "#F0B0C0", top2: "#D48C9E", bottom: "#4A4A5A", hair: "#2A1D16", long: true, kid: true },
};
const CRUST = { raw: "#E9C48A", pale: "#EFD29A", golden: "#E3A04A", dark: "#8E4F22", burnt: "#3B2418" };
const cache = new Map();

function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; }
/** Vẽ ở nửa cỡ (mỗi điểm vẽ = ô 2×2 px), trả data URL. */
function render(w, h, draw, after) {
  const half = canvas(w / 2, h / 2), g = half.getContext("2d");
  const R = (x, y, ww, hh, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), Math.round(ww), Math.round(hh)); };
  const E = (cx, cy, rx, ry, col) => { g.fillStyle = col; for (let y = -ry; y <= ry; y++) { const k = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry)))); g.fillRect(Math.round(cx - k), Math.round(cy + y), k * 2, 1); } };
  draw(R, E, g);
  const full = canvas(w, h), G = full.getContext("2d");
  G.imageSmoothingEnabled = false;
  G.drawImage(half, 0, 0, w, h);
  if (after) after(G);
  return full.toDataURL("image/png");
}

// ---------- nhân vật ----------
function person(R, E, role, pose, step) {
  const P = ROLE[role] || ROLE.student;
  const cx = 36, foot = 87, small = P.short ? 4 : 0;
  // bóng
  E(cx, foot, 14, 2, "#1d1510");
  // chân
  const legA = step % 2 ? -3 : 0, legB = step % 2 ? 3 : 0;
  R(cx - 6 + legA, 54 + small, 5, 33 - small, P.bottom); R(cx + 1 + legB, 54 + small, 5, 33 - small, P.bottom);
  R(cx - 7 + legA, 85, 7, 2, "#241a14"); R(cx + 1 + legB, 85, 7, 2, "#241a14");
  // thân
  const top = 24 + small;
  R(cx - 10, top, 20, 32, P.top); R(cx + 4, top, 6, 32, P.top2);
  if (P.apron) { R(cx - 8, top + 8, 16, 26, P.apron); R(cx - 8, top + 8, 16, 2, "#5E3E2E"); }
  if (P.stripe) R(cx - 10, top + 16, 20, 2, P.stripe);
  if (P.badge) R(cx - 2, top + 10, 4, 5, P.badge);
  if (P.pack) R(cx - 14, top + 4, 5, 20, P.pack);
  // tay
  const armUp = pose === "order" || pose === "surprised" || pose === "serve", cross = pose === "impatient";
  if (cross) { R(cx - 10, top + 12, 20, 5, P.top2); R(cx - 6, top + 13, 4, 3, P.skin); }
  else {
    R(cx - 14, top + 2, 4, 22, P.top2); R(cx - 14, top + 24, 4, 4, P.skin);
    if (armUp) { R(cx + 10, top - 10, 4, 14, P.top2); R(cx + 10, top - 14, 4, 4, P.skin); }
    else if (pose === "work") { R(cx + 10, top + 2, 4, 12, P.top2); R(cx + 12, top + 12 + (step % 2) * 3, 8, 4, P.skin); }
    else { R(cx + 10, top + 2, 4, 22, P.top2); R(cx + 10, top + 24, 4, 4, P.skin); }
  }
  if (P.phone) R(cx + 14, top + 10, 3, 6, "#222");
  // đầu
  const hy = top - 16;
  R(cx - 7, hy, 14, 15, P.skin);
  R(cx - 7, hy, 14, 4, P.hair);
  if (P.long) { R(cx - 8, hy, 3, 18, P.hair); R(cx + 5, hy, 3, 18, P.hair); }
  if (P.hat) { if (P.wide) R(cx - 12, hy - 1, 24, 3, P.hat); if (P.cone) { R(cx - 12, hy - 1, 24, 2, P.hat); R(cx - 7, hy - 4, 14, 3, P.hat); R(cx - 3, hy - 6, 6, 2, P.hat); } else R(cx - 7, hy - 2, 14, 5, P.hat); }
  // mặt
  const eye = pose === "surprised" ? "#111" : "#2a1d16";
  R(cx - 4, hy + 6, 2, 2, eye); R(cx + 2, hy + 6, 2, 2, eye);
  if (pose === "impatient") { R(cx - 5, hy + 4, 3, 1, "#5a1d10"); R(cx + 2, hy + 4, 3, 1, "#5a1d10"); }
  if (P.mustache) R(cx - 4, hy + 10, 8, 2, "#2A1D16");
  if (pose === "happy") R(cx - 3, hy + 12, 6, 1, "#7a3020");
  else if (pose === "surprised" || pose === "order") R(cx - 1, hy + 11, 2, 2, "#7a3020");
  else R(cx - 2, hy + 12, 4, 1, "#6a3828");
  if (P.kid) { // bé tới thắt lưng
    const kx = cx + 18;
    R(kx - 4, 66, 8, 12, "#F6E27A"); R(kx - 3, 78, 2, 9, "#4A4A5A"); R(kx + 1, 78, 2, 9, "#4A4A5A"); R(kx - 4, 57, 8, 9, P.skin); R(kx - 4, 57, 8, 2, P.hair);
  }
}
function charFrame(alias, name) {
  let role = name.split("-")[0], pose = "idle", step = 0;
  const m = name.match(/-(\d)$/); if (m) step = Number(m[1]);
  if (alias === "baker" || role === "baker") { role = "baker"; pose = /slice|wrap|change|oven/.test(name) ? "work" : /serve/.test(name) ? "serve" : "idle"; }
  else if (/walk/.test(name)) pose = "walk";
  else if (/happy/.test(name)) pose = "happy";
  else if (/impatient/.test(name)) pose = "impatient";
  else if (/order/.test(name)) pose = "order";
  else if (/surprised/.test(name)) pose = "surprised";
  if (!ROLE[role]) return null;
  return render(144, 192, (R, E) => person(R, E, role, pose, pose === "walk" || pose === "work" ? step : 0));
}

// ---------- ổ bánh (loaf-layers 160×192, anchor [80,174]) ----------
function loafBody(R, E, col, open) {
  E(40, 76, 34, 9, col); E(40, 74, 32, 7, col);
  R(14, 72, 52, 2, shade(col)); // vệt nứt
  if (!open) for (let i = 0; i < 4; i++) R(22 + i * 10, 69, 6, 1, light(col));
}
const shade = (c) => mix(c, "#000000", 0.25), light = (c) => mix(c, "#ffffff", 0.35);
function mix(a, b, t) { const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b); return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join(""); }
const LAYER = {
  "loaf-open-back": (R, E) => { E(40, 74, 33, 10, "#D99A50"); E(40, 70, 30, 6, "#F6E7C1"); E(40, 69, 26, 3, "#EBD39E"); },
  "loaf-open-front": (R, E) => { E(40, 80, 33, 5, "#E3A04A"); R(10, 79, 60, 2, "#C9772E"); },
  "loaf-toasted-sheen": (R) => { for (let i = 0; i < 5; i++) R(16 + i * 11, 78, 5, 1, "#FFE3A8"); },
  "loaf-cut-half": (R, E) => { E(24, 74, 18, 9, "#E3A04A"); E(58, 74, 18, 9, "#E3A04A"); E(40, 70, 4, 6, "#F6E7C1"); },
  "spread-pate": (R) => R(14, 67, 52, 3, "#9C5A44"),
  "spread-bo": (R) => R(15, 66, 50, 2, "#F2D36A"),
  "spread-mayo": (R) => R(15, 65, 50, 2, "#FFF4D0"),
  "fill-cha-lua": (R, E) => { for (let i = 0; i < 4; i++) E(20 + i * 13, 64, 6, 3, "#F0C7B4"); },
  "fill-thit-nguoi": (R, E) => { for (let i = 0; i < 3; i++) E(24 + i * 15, 62, 7, 3, "#D9877E"); },
  "fill-xiu-mai": (R, E) => { for (let i = 0; i < 4; i++) E(20 + i * 13, 63, 4, 4, "#9A5434"); R(16, 66, 48, 2, "#C0643A"); },
  "fill-trung": (R, E) => { E(40, 63, 18, 4, "#FFFFF4"); E(40, 62, 6, 3, "#F2B22A"); },
  "fill-thit-nuong": (R) => { for (let i = 0; i < 6; i++) R(16 + i * 8, 61, 6, 3, i % 2 ? "#7A3A1E" : "#9A4A24"); },
  "fill-heo-quay": (R) => { for (let i = 0; i < 4; i++) { R(18 + i * 12, 60, 9, 2, "#C8742A"); R(18 + i * 12, 62, 9, 3, "#F2E2C8"); } },
  "fill-ga-xe": (R) => { for (let i = 0; i < 9; i++) R(16 + i * 5, 61 + (i % 2), 4, 2, "#E8D2A8"); },
  "fill-cha-chay": (R, E) => { for (let i = 0; i < 4; i++) E(20 + i * 13, 63, 6, 3, "#E8DCA0"); },
  "fill-cha-bong": (R) => { for (let i = 0; i < 14; i++) R(16 + i * 3.5, 59 + (i % 3), 2, 1, "#C8843A"); },
  "fill-trend": (R) => { R(16, 59, 48, 4, "#F2C230"); for (let i = 0; i < 8; i++) R(18 + i * 6, 58, 3, 1, "#F6F0E0"); },
  "do-chua": (R) => { for (let i = 0; i < 10; i++) R(16 + i * 5, 57 + (i % 2) * 2, 3, 4, i % 2 ? "#F4EEDD" : "#EE8A3C"); },
  "dua-leo": (R) => { for (let i = 0; i < 4; i++) { R(18 + i * 12, 56, 9, 3, "#4E8A3A"); R(19 + i * 12, 56, 7, 2, "#B8DA8A"); } },
  "rau-mui": (R) => { for (let i = 0; i < 7; i++) R(17 + i * 7, 53 + (i % 2) * 2, 4, 3, i % 2 ? "#4E8A3A" : "#7DB34A"); },
  "hanh-la": (R) => { for (let i = 0; i < 8; i++) R(16 + i * 6.5, 52 + (i % 3), 4, 1, "#9CC75A"); },
  "ot-it": (R) => { for (let i = 0; i < 3; i++) R(24 + i * 14, 52, 2, 2, "#C8342A"); },
  "ot-vua": (R) => { for (let i = 0; i < 6; i++) R(18 + i * 9, 51 + (i % 2), 2, 2, "#C8342A"); },
  "ot-nhieu": (R) => { for (let i = 0; i < 10; i++) R(16 + i * 5, 50 + (i % 3), 2, 2, i % 2 ? "#E2553B" : "#C8342A"); },
  "sauce-nuoc-tuong": (R) => { for (let i = 0; i < 5; i++) R(18 + i * 10, 55 + (i % 2), 6, 1, "#5A2E16"); },
  "sauce-tuong-ot": (R) => { for (let i = 0; i < 5; i++) R(22 + i * 9, 54 + (i % 2), 5, 1, "#D8442C"); },
  "wrap-paper": (R, E) => { R(12, 58, 56, 28, "#F2EAD8"); R(12, 58, 56, 2, "#D8CCB0"); R(36, 58, 2, 28, "#DCD0B4"); E(8, 74, 6, 8, "#E3A04A"); E(72, 74, 6, 8, "#E3A04A"); },
  "wrap-paper-half": (R, E) => { R(8, 60, 30, 26, "#F2EAD8"); R(42, 60, 30, 26, "#F2EAD8"); E(23, 60, 12, 4, "#E3A04A"); E(57, 60, 12, 4, "#E3A04A"); },
  "wrap-bag": (R) => { R(14, 40, 52, 46, "#C8A06A"); R(14, 40, 52, 4, "#A88250"); R(30, 34, 20, 6, "#A88250"); R(34, 36, 12, 4, "#C8A06A"); },
  "que-raw": (R) => R(8, 70, 64, 6, CRUST.raw), "que-golden": (R) => R(8, 70, 64, 6, CRUST.golden), "que-burnt": (R) => R(8, 70, 64, 6, CRUST.burnt),
  "que-pate": (R) => { R(8, 70, 64, 6, CRUST.golden); R(10, 70, 60, 2, "#9C5A44"); },
  "que-bag-5": (R) => { R(20, 30, 40, 56, "#E8D8B8"); for (let i = 0; i < 5; i++) R(24 + i * 7, 22, 4, 10, CRUST.golden); },
};
function loafFrame(name) {
  const w = name.match(/^loaf-whole-(\w+)$/);
  if (w && CRUST[w[1]]) return render(160, 192, (R, E) => loafBody(R, E, CRUST[w[1]], false));
  const f = LAYER[name];
  return f ? render(160, 192, f) : null;
}

// ---------- lò (ovens 256×256, anchor [128,240]) ----------
function ovenFrame(name) {
  const tray = name.match(/^(que-)?tray-(\w+)$/);
  if (tray) return render(256, 256, (R, E) => { R(24, 104, 80, 6, "#9AA0A8"); R(24, 110, 80, 2, "#5A6068"); const n = tray[1] ? 6 : 4; for (let i = 0; i < n; i++) { if (tray[1]) R(30 + i * 12, 98, 8, 6, CRUST[tray[2]] || CRUST.golden); else E(36 + i * 19, 100, 8, 4, CRUST[tray[2]] || CRUST.golden); } });
  const m = name.match(/^oven-(mini|gas|electric)-(.+)$/) || (name === "oven-electric-off" ? [0, "electric", "off"] : null);
  if (!m) return null;
  const kind = m[1], st = m[2];
  const W = kind === "mini" ? 70 : kind === "gas" ? 90 : 100;
  return render(256, 256, (R, E) => {
    const x0 = 64 - W / 2;
    E(64, 120, W / 2 + 6, 3, "#1d1510");
    R(x0, 46, W, 74, "#5C6670"); R(x0, 46, W, 4, "#8A949E"); R(x0 + W - 6, 46, 6, 74, "#46505A");
    R(x0 + 8, 58, W - 16, 44, "#20252b");
    const glow = /baking/.test(st) ? ["#E87830", "#F29A40", "#F2B050", "#E88A38"][(Number(st.slice(-1)) || 1) - 1] : st === "ready" ? "#F2C060" : st === "burnt" || /smoke/.test(st) ? "#3B2418" : null;
    if (glow) { R(x0 + 10, 60, W - 20, 40, glow); R(x0 + 10, 92, W - 20, 6, "#2a1a10"); }
    if (st === "ready") for (let i = 0; i < 3; i++) E(x0 + 20 + i * ((W - 40) / 2), 88, 6, 3, CRUST.golden);
    R(x0 + 8, 106, 10, 6, "#C8342A"); R(x0 + 22, 106, 10, 6, "#9AA0A8");
    if (/smoke/.test(st) || st === "burnt") for (let i = 0; i < 4; i++) E(x0 + 16 + i * 14, 34 - (i % 2) * 8 - (st.endsWith("2") ? 6 : 0), 7, 5, "#6A6A6A");
    if (st === "off") R(x0 + 8, 58, W - 16, 44, "#101215");
  });
}

// ---------- thiết bị (equipment 192×192, anchor [96,168]) ----------
const JAR = { "pate-jar": ["#C8D0D8", "#9C5A44"], "butter-tub": ["#F2E8C8", "#F2D36A"], "pickle-jar": ["#E8EEF2", "#EE8A3C"], "chili-bowl": ["#E8EEF2", "#C8342A"], "herb-basket": ["#B88A4A", "#7DB34A"], "mayo-bottle": ["#FFF4D0", "#F2D36A"] };
function equipFrame(name) {
  const base = name.replace(/-(idle|on-\d|fry-\d|steam-\d)$/, "");
  return render(192, 192, (R, E) => {
    E(48, 84, 26, 3, "#1d1510");
    if (JAR[base]) { const [a, b] = JAR[base]; if (base === "herb-basket") { R(26, 64, 44, 20, a); for (let i = 0; i < 8; i++) R(28 + i * 5, 56 + (i % 2) * 3, 4, 9, b); } else if (base === "chili-bowl") { E(48, 76, 20, 8, a); R(30, 70, 36, 4, b); } else if (base === "mayo-bottle") { R(40, 46, 16, 38, a); R(44, 40, 8, 6, b); } else { R(32, 54, 32, 30, a); R(30, 50, 36, 6, shade(a)); R(36, 60, 24, 14, b); if (base === "pickle-jar") for (let i = 0; i < 3; i++) R(36 + i * 8, 76, 4, 4, "#2F5D9A"); } return; }
    switch (base) {
      case "sauce-bottles": R(32, 44, 12, 40, "#5A2E16"); R(52, 48, 12, 36, "#D8442C"); R(34, 38, 8, 6, "#222"); R(54, 42, 8, 6, "#222"); break;
      case "toaster": case "grill": R(18, 62, 60, 22, "#3A3A40"); R(20, 58, 56, 4, "#6A6A72"); for (let i = 0; i < 6; i++) R(22 + i * 9, 60, 4, 2, /on/.test(name) ? (i % 2 ? "#F29A40" : "#E8501E") : "#2A2A2A"); break;
      case "egg-pan": E(44, 74, 24, 6, "#3A3A40"); R(66, 72, 22, 3, "#5A3A20"); if (/fry/.test(name)) { E(44, 72, 10, 3, "#FFFFF4"); E(44, 71, 3, 2, "#F2B22A"); } break;
      case "xiu-mai-pot": R(26, 52, 44, 32, "#8A949E"); R(24, 48, 48, 6, "#5C6670"); if (/steam/.test(name)) for (let i = 0; i < 3; i++) E(36 + i * 12, 38 - i * 2, 4, 5, "#E8E8E8"); break;
      case "gas-tank": R(34, 30, 28, 54, name.endsWith("empty") ? "#7A3A30" : "#C8342A"); R(40, 24, 16, 6, "#8A949E"); R(34, 30, 28, 4, "#E2553B"); break;
      case "board": case "long-board": R(base === "long-board" ? 8 : 20, 74, base === "long-board" ? 80 : 56, 10, "#A0623A"); R(base === "long-board" ? 8 : 20, 74, base === "long-board" ? 80 : 56, 2, "#C88A55"); if (name.endsWith("busy")) E(48, 72, 18, 4, CRUST.golden); break;
      case "paper-stack": for (let i = 0; i < 5; i++) R(28, 80 - i * 3, 40, 3, i % 2 ? "#F2EAD8" : "#E2D8C0"); break;
      case "bag-hook": R(46, 20, 4, 20, "#5A3A20"); R(30, 40, 36, 40, "#C8A06A"); break;
      case "cash-tin": case "change-tray": R(24, 62, 48, 22, "#8A949E"); R(24, 62, 48, 4, "#B8C0C8"); R(44, 70, 8, 4, "#2F5A50"); break;
      case "tea-jug": R(34, 38, 28, 46, "#E8C25A"); R(62, 46, 8, 20, "#C89A30"); R(34, 38, 28, 4, "#F2D880"); break;
      default: R(30, 50, 36, 34, "#8A6A4A");
    }
  });
}

// ---------- nguyên liệu (64×64) và tờ tiền (96×48) ----------
const ING = { phoi: CRUST.raw, "phoi-que": CRUST.raw, "banh-si": CRUST.golden, pate: "#9C5A44", bo: "#F2D36A", mayo: "#FFF4D0", "cha-lua": "#F0C7B4", "thit-nguoi": "#D9877E", "xiu-mai": "#9A5434", trung: "#F2B22A", "thit-nuong": "#7A3A1E", "heo-quay": "#C8742A", "ga-xe": "#E8D2A8", "cha-chay": "#E8DCA0", "cha-bong": "#C8843A", trend: "#F2C230", "do-chua": "#EE8A3C", "dua-leo": "#4E8A3A", "rau-mui": "#7DB34A", "hanh-la": "#9CC75A", ot: "#C8342A", "nuoc-tuong": "#5A2E16", "tuong-ot": "#D8442C", "giay-goi": "#F2EAD8", tui: "#C8A06A", gas: "#C8342A", than: "#2A2A2A", "tien-le": "#5B86C2" };
const BILL = { 1: "#8FA0B8", 2: "#9A8AB8", 5: "#6FA0C8", 10: "#C8A04A", 20: "#4A8AC8", 50: "#C8508A", 100: "#3A9A6A", 200: "#B86A3A", 500: "#3A8AA0" };
function ingrFrame(name) { const c = ING[name]; if (!c) return null; return render(64, 64, (R, E) => { E(16, 18, 11, 9, shade(c)); E(16, 16, 10, 8, c); R(10, 12, 5, 2, light(c)); }); }
function billFrame(name) {
  const m = name.match(/^bill-(\d+)k$/);
  if (name === "coin-stack") return render(96, 48, (R, E) => { for (let i = 0; i < 4; i++) E(24, 18 - i * 2, 10, 3, i % 2 ? "#C8A04A" : "#E8C25A"); });
  if (!m || !BILL[m[1]]) return null;
  const col = BILL[m[1]];
  return render(96, 48, (R) => { R(1, 2, 46, 20, shade(col)); R(2, 3, 44, 18, col); R(4, 5, 40, 14, light(col)); R(6, 7, 36, 10, col); }, (G) => { G.fillStyle = "#1a1a1a"; G.font = "bold 18px system-ui, sans-serif"; G.textAlign = "center"; G.textBaseline = "middle"; G.fillText(m[1] + "k", 48, 25); });
}

// ---------- cảnh xe đẩy 1280×720 + lớp che ----------
function cartScene(fg) {
  return render(1280, 720, (R, E) => {
    if (fg) { // mặt trước xe đẩy (che thân dưới chủ tiệm, chân đồ trên xe)
      R(330 / 2, 430 / 2, 630 / 2, 6, "#7A4526"); R(330 / 2, 436 / 2, 630 / 2, 70, "#A0623A");
      for (let i = 0; i < 6; i++) R(340 / 2 + i * 52, 444 / 2, 46, 58, i % 2 ? "#C88A55" : "#B07444");
      R(330 / 2, 430 / 2, 630 / 2, 2, "#C88A55"); R(330 / 2, 506 / 2, 630 / 2, 4, "#5A311E");
      E(370 / 2, 548 / 2, 16, 16, "#2A2A2A"); E(370 / 2, 548 / 2, 6, 6, "#8A949E"); E(920 / 2, 548 / 2, 16, 16, "#2A2A2A"); E(920 / 2, 548 / 2, 6, 6, "#8A949E");
      return;
    }
    // trời rạng sáng
    const sky = ["#18222F", "#1C2838", "#22344A", "#2C4058", "#3A4A62"];
    sky.forEach((c, i) => R(0, i * 24, 640, 24, c));
    // mặt bằng đóng cửa cuốn
    R(80, 40, 480, 190, "#3A3430"); R(80, 40, 480, 6, "#4A423C");
    R(110, 70, 420, 150, "#5E6670"); for (let y = 72; y < 220; y += 5) R(110, y, 420, 1, "#4A525C");
    R(100, 60, 440, 10, "#2F5A50");
    // cột điện + dây
    R(40, 10, 6, 260, "#4A4A4A"); R(0, 30, 640, 1, "#222"); R(0, 36, 640, 1, "#222");
    // cây bàng
    E(600, 70, 46, 40, "#24453F"); E(590, 60, 34, 28, "#2F5A50"); R(596, 100, 8, 130, "#5A3A20");
    // vỉa hè + lòng đường
    R(0, 230, 640, 130, "#5A5450"); for (let x = 0; x < 640; x += 32) R(x, 230, 1, 130, "#4A4440");
    for (let y = 262; y < 360; y += 32) R(0, y, 640, 1, "#4A4440");
    R(0, 228, 640, 3, "#7A746E");
    // xe đẩy: mái bạt sọc đỏ kem, đèn mây
    R(330 / 2, 300 / 2, 630 / 2, 6, "#5A311E");
    for (let i = 0; i < 14; i++) R(330 / 2 + i * 22.5, 120, 22.5, 30, i % 2 ? "#F2E8D8" : "#B8433A");
    for (let i = 0; i < 14; i++) E(330 / 2 + 11 + i * 22.5, 150, 11, 3, i % 2 ? "#F2E8D8" : "#B8433A");
    R(334 / 2, 150, 3, 66, "#5A311E"); R(954 / 2, 150, 3, 66, "#5A311E");
    E(640 / 2, 166, 10, 7, "#FFD27A"); R(318, 152, 4, 8, "#5A311E");
    // tủ kính trên xe (thân sau)
    R(740 / 2, 178, 150, 36, "#7A4526"); R(744 / 2, 180, 146, 32, "#2a3a44"); R(746 / 2, 182, 2, 28, "#C8D8E0");
    // ghế nhựa
    R(1000 / 2, 268, 24, 4, "#C8342A"); R(1002 / 2, 272, 3, 14, "#C8342A"); R(1018 / 2, 272, 3, 14, "#C8342A");
    // bóng đèn ấm lên vỉa hè
    E(320, 300, 160, 20, "#625a52");
  });
}

/** Trả fallback(alias, name) cho makeAtlas: frame dự phòng (data URL) hoặc null (không có bản dự phòng ⇒ UI dùng chữ). */
export function placeholderFallback() {
  if (typeof document === "undefined") return () => null;
  return (alias, name) => {
    const key = alias + "/" + name;
    if (cache.has(key)) return cache.get(key);
    const cell = CELL[alias];
    let url = null;
    try {
      if (!cell) url = null;
      else if (["chars", "walks", "reactions", "actions", "baker"].includes(alias)) url = charFrame(alias, name);
      else if (alias === "loaf") url = loafFrame(name);
      else if (alias === "ovens") url = ovenFrame(name);
      else if (alias === "equip") url = equipFrame(name);
      else if (alias === "ingr") url = ingrFrame(name);
      else if (alias === "bills") url = billFrame(name);
      else if (alias === "cart" || alias === "cartFg") url = cartScene(alias === "cartFg");
    } catch { url = null; }
    const f = url ? { url, sw: cell[0], sh: cell[1], x: 0, y: 0, w: cell[0], h: cell[1], ax: cell[2], ay: cell[3], ph: true } : null;
    cache.set(key, f);
    return f;
  };
}
