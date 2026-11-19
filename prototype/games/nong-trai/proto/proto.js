// Prototype duyệt Art Direction — Nông Trại 2.0 (Milestone 0). KHÔNG phải game: chỉ ghép sprite thật thành 3 cảnh
// tương tác được (Nông trại chính · Xưởng chế biến · Khu chợ) để chủ dự án duyệt hình ảnh / bố cục.
// Sprite đọc theo lưới trong ASSET-BRIEF (DESIGN-2.0.md §7); nếu assets/v3/manifest.json có `names` thì dùng tên trong đó.
// Ô nào chưa có ảnh ⇒ khung nét đứt + tên, để thấy chỗ còn thiếu.

const W = 960, H = 600; // khung cảnh logic, phóng theo màn hình (giữ pixel vuông)
const V3 = "../assets/v3/", GARDEN = "../assets/garden/";

// Lưới mặc định — khớp prompt đã gửi Codex. names theo thứ tự hàng → cột.
const SHEETS = {
  buildings: { file: "buildings.webp", cell: 256, cols: 4, rows: 3, names: ["nha-kho", "nha-xuong", "coi-xay-than", "coi-xay-canh", "chuong-ga", "chuong-bo", "nha-kinh", "bang-don", "gian-giao", "ban-ve", "bien-lang", "xe-tai"] },
  decor: { file: "decor.webp", cell: 128, cols: 4, rows: 2, names: ["den-long", "chau-hoa", "bu-nhin", "ghe-tre", "gieng-da", "cong-tre", "dong-bi-ngo", "co-lau"] },
  workshop: { file: "workshop.webp", cell: 64, cols: 4, rows: 2, names: ["san-a", "san-b", "tuong", "chan-tuong", "cua-so", "ke-go", "bao-bot", "thung-go"] },
  machines: { file: "machines.webp", cell: 192, cols: 3, rows: 3, names: ["bep-sen", "bep-sen-1", "bep-sen-2", "coi-xay-bot", "coi-xay-bot-1", "coi-xay-bot-2", "lo-banh", "lo-banh-1", "lo-banh-2"] },
  market: { file: "market.webp", cell: 192, cols: 3, rows: 2, names: ["quay", "mai-bat", "bang-gia", "thung-rau", "gio-trai-cay", "can-dia"] },
  npc: { file: "npc.webp", cell: 128, cols: 4, rows: 2, names: ["co-hai", "co-hai-1", "co-hai-vay", "co-hai-chan-dung", "chi-ba", "chi-ba-1", "chi-ba-vay", "chi-ba-chan-dung"] },
  "market-stall": { file: "market-stall.webp", cell: 384, cols: 1, rows: 1, names: ["quay-cho-hoan-chinh"] },
  "npc-market": { file: "npc-market.webp", cell: 192, cols: 1, rows: 1, names: ["co-hai-sau-quay"] },
  items: { file: "items.webp", cell: 64, cols: 8, rows: 4, names: ["ca-rot", "ca-chua", "dau-tay", "ngo", "bi-ngo", "lua", "mia", "bao-hat", "mut-dau", "sot-ca-chua", "nuoc-ep", "thuc-an", "bot-gao", "bap-rang", "banh-trung", "banh-bi-ngo", "trung", "sua", "bo", "pho-mai", "duong", "banh-flan", "van-go", "dinh", "son", "xu", "xp", "kho", "bua", "don", "chuong", "khoa"] },
};
const GARDEN_IMGS = ["grass", "path", "soil", "wet", "house", "market", "tree", "pond", "flowers", "fence", "crops"];

let COUNTER_STEP = 192, STALL = null; // STALL = thông số gian chợ hoàn chỉnh từ manifest (repeatStepX, keeperLayer)
const img = {}, sprite = {}; // sprite[name] = { im, sx, sy, s }
const load = (src) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });

async function loadAll() {
  let man = null;
  try { const r = await fetch(V3 + "manifest.json", { cache: "no-store" }); if (r.ok) man = await r.json(); } catch {}
  await Promise.all(GARDEN_IMGS.map(async (n) => { img[n] = await load(GARDEN + n + ".webp"); }));
  await Promise.all(Object.entries(SHEETS).map(async ([key, def]) => {
    const m = man?.sheets?.[key] || man?.[key] || {};
    const file = m.file || def.file, cell = m.cell || m.cellSize || m.frame || def.cell;
    const cols = m.cols || def.cols, names = Array.isArray(m.names) ? m.names : def.names;
    const im = await load(V3 + file);
    if (!im) return;
    const cw = Array.isArray(cell) ? cell[0] : cell, ch = Array.isArray(cell) ? cell[1] : cell;
    // manifest của Codex: frames[{id,x,y,width,height}] theo đúng thứ tự lưới ⇒ đăng ký cả tên của prototype lẫn id của Codex
    const frames = Array.isArray(m.frames) ? m.frames : null;
    names.forEach((n, k) => {
      const f = frames?.[k];
      const s = f ? { im, sx: f.x, sy: f.y, w: f.width, h: f.height, anchor: key === "items" || (key === "workshop" && k < 4) ? null : f.anchor } : { im, sx: (k % cols) * cw, sy: Math.floor(k / cols) * ch, w: cw, h: ch };
      sprite[n] = s; if (f?.id) sprite[f.id] = s;
    });
    if (key === "market-stall" && m.repeatStepX) STALL = { step: m.repeatStepX, keeper: m.keeperLayer?.drawRect || [127, 130, 130, 130], size: m.frameWidth || 384 };
    if (key === "market" && m.counterRepeat?.suggestedStepX) COUNTER_STEP = m.counterRepeat.suggestedStepX * 192 / (m.frameWidth || 192);
  }));
  return Object.keys(sprite).length;
}

// ---------- vẽ ----------
const cv = document.getElementById("cv"), g = cv.getContext("2d");
g.imageSmoothingEnabled = false;
function placeholder(x, y, w, h, label) {
  g.save(); g.setLineDash([6, 5]); g.strokeStyle = "rgba(255,230,160,.8)"; g.lineWidth = 2; g.strokeRect(x + 1, y + 1, w - 2, h - 2);
  g.fillStyle = "rgba(20,14,8,.45)"; g.fillRect(x + 2, y + 2, w - 4, h - 4);
  g.fillStyle = "#ffe8a8"; g.font = "700 13px 'Be Vietnam Pro', sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText(label, x + w / 2, y + h / 2, w - 8); g.restore();
}
/** Vẽ sprite theo tên, neo đáy-giữa tại (x, y), kích thước w. Thiếu ảnh ⇒ khung chờ. */
function spr(name, x, y, w, h = w, label = name, useAnchor = true) {
  const s0 = sprite[name], s = s0 && !useAnchor ? { ...s0, anchor: null } : s0;
  if (!s) return placeholder(x - w / 2, y - h, w, h, label);
  // có điểm neo (chân sprite) trong manifest ⇒ đặt đúng chân tại (x, y); không có ⇒ đáy-giữa ô
  const ax = s.anchor ? s.anchor[0] * w / s.w : w / 2, ay = s.anchor ? s.anchor[1] * h / s.h : h;
  g.drawImage(s.im, s.sx, s.sy, s.w, s.h, Math.round(x - ax), Math.round(y - ay), w, h);
}
function gimg(name, x, y, w, h) { const i = img[name]; if (i) g.drawImage(i, Math.round(x), Math.round(y), w ?? i.width, h ?? i.height); else placeholder(x, y, w || 64, h || 64, name); }
function tile(name, x0, y0, x1, y1, size = 64) {
  const i = img[name]; if (!i) return;
  for (let y = y0; y < y1; y += size) for (let x = x0; x < x1; x += size) g.drawImage(i, x, y, size, size);
}
function text(t, x, y, { size = 14, color = "#fff6dc", align = "center", bold = 800, shadow = true } = {}) {
  g.font = `${bold} ${size}px 'Be Vietnam Pro', sans-serif`; g.textAlign = align; g.textBaseline = "middle";
  if (shadow) { g.fillStyle = "rgba(0,0,0,.75)"; g.fillText(t, x + 1, y + 2); }
  g.fillStyle = color; g.fillText(t, x, y);
}

// ---------- trạng thái prototype ----------
const state = { scene: "farm", bstate: "done", t0: performance.now(), jobs: {}, bubble: 0, hits: [] };
const BSTATES = { locked: "Khoá", avail: "Có thể xây", building: "Đang xây", done: "Hoàn thành" };

// Lô công trình trên bản đồ nông trại (toạ độ đáy-giữa) — cố định như thiết kế §1.
const LOTS = [
  { id: "nha-kho", name: "Nhà kho", x: 150, y: 330, w: 150, lv: 3 },
  { id: "nha-xuong", name: "Xưởng chế biến", x: 805, y: 255, w: 170, lv: 4, go: "workshop" },
  { id: "coi-xay", name: "Cối xay", x: 905, y: 430, w: 110, lv: 5 },
  { id: "chuong-ga", name: "Chuồng gà", x: 120, y: 560, w: 130, lv: 7 },
  { id: "nha-kinh", name: "Nhà kính", x: 830, y: 585, w: 150, lv: 10 },
  { id: "bang-don", name: "Bảng đơn hàng", x: 560, y: 150, w: 86, lv: 1 },
];

function drawFarm(t) {
  tile("grass", 0, 0, W, H);
  // đường đất từ cổng trên xuống ruộng, rẽ sang xưởng
  tile("path", 448, 0, 512, 400);
  tile("path", 512, 216, 768, 280);
  gimg("house", 270, 40, 269, 184);
  gimg("tree", 30, 20, 180, 180);
  gimg("pond", 700, 330, 170, 158);
  gimg("flowers", 300, 470, 130, 77);
  gimg("fence", 20, 525, 229, 77);
  // ruộng 3×3 ở giữa, vài ô có cây đang lớn
  const ox = 384, oy = 290;
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    const x = ox + c * 64, y = oy + r * 64, wet = (r + c) % 3 === 0;
    gimg(wet ? "wet" : "soil", x, y, 64, 64);
    const k = (r * 3 + c) % 5, stg = (r * 3 + c + Math.floor((t / 2500))) % 5;
    if (img.crops) g.drawImage(img.crops, stg * 80, k * 80, 80, 80, x - 8, y - 22, 80, 80);
  }
  // sạp chợ (ảnh garden) — chạm để sang Khu chợ
  gimg("market", 600, 20, 160, 148);
  hit(600, 20, 160, 148, "Khu chợ", () => go("market"));
  // các lô công trình
  for (const L of LOTS) drawLot(L, t);
  // cối xay: cánh quay riêng
  if (state.bstate === "done" && sprite["coi-xay-canh"]) {
    const L = LOTS[2], s = sprite["coi-xay-canh"], a = (t / 900) % (Math.PI * 2);
    const k = L.w / 256, body = sprite['coi-xay-than'], hub = [114, 98], an = body?.anchor || [128, 226]; // trục cánh = bodyHub trong manifest
    g.save(); g.translate(L.x + (hub[0] - an[0]) * k, L.y + (hub[1] - an[1]) * k); g.rotate(a); g.drawImage(s.im, s.sx, s.sy, s.w, s.h, -L.w / 2, -L.w / 2, L.w, L.w); g.restore();
  }
  // Chị Ba ở góc ruộng
  npc("chi-ba", 350, 470, 72, t);
  hud("Nông trại chính", "Chạm Xưởng hoặc Sạp chợ để vào khu đó · chạm lô đất để xem trạng thái");
}
function drawLot(L, t) {
  const st = state.bstate, x = L.x, y = L.y, w = L.w;
  if (st === "locked" || st === "avail") {
    spr("ban-ve", x, y, w, w * 0.6, "Lô trống");
    if (st === "avail") { g.save(); g.globalAlpha = 0.25 + 0.2 * Math.sin(t / 300); g.fillStyle = "#7fe3ff"; g.fillRect(x - w / 2, y - w * 0.6, w, w * 0.6); g.restore(); }
    text(st === "locked" ? `Khoá · cấp ${L.lv}` : "Có thể xây", x, y - w * 0.3, { size: 13 });
  } else if (st === "building") {
    spr("gian-giao", x, y, w, w, "Giàn giáo");
    const k = ((t - state.t0) / 8000) % 1;
    g.fillStyle = "#1c140c"; g.fillRect(x - 40, y + 6, 80, 9); g.fillStyle = "#f5c542"; g.fillRect(x - 39, y + 7, 78 * k, 7);
  } else {
    const name = L.id === "coi-xay" ? "coi-xay-than" : L.id;
    spr(name, x, y, w, w, L.name);
  }
  text(L.name, x, y + 26, { size: 12, color: "#fbe9b7" });
  hit(x - w / 2, y - w, w, w, L.name, () => { if (L.go && st === "done") go(L.go); else toast(`${L.name}: ${BSTATES[st]} (mở ở cấp ${L.lv})`); });
}

const MACHINES = [
  { id: "bep-sen", name: "Bếp sên", recipe: "Mứt dâu", need: "3 dâu tây", ms: 6000, out: "mut-dau" },
  { id: "coi-xay-bot", name: "Cối xay", recipe: "Thức ăn gia súc ×3", need: "2 ngô", ms: 4000, out: "thuc-an" },
  { id: "lo-banh", name: "Lò bánh", recipe: "Bánh bí ngô", need: "1 bí · 1 bột · 1 trứng", ms: 9000, out: "banh-bi-ngo" },
];
function drawWorkshop(t) {
  // tường trên, sàn dưới
  for (let x = 0; x < W; x += 64) { for (let y = 0; y < 192; y += 64) spr("tuong", x + 32, y + 64, 64, 64, ""); spr("chan-tuong", x + 32, 256, 64, 64, ""); }
  for (let y = 256; y < H; y += 64) for (let x = 0; x < W; x += 64) spr(((x + y) / 64) % 2 ? "san-a" : "san-b", x + 32, y + 64, 64, 64, "");
  spr("cua-so", 140, 150, 96, 96, "Cửa sổ"); spr("cua-so", 820, 150, 96, 96, "Cửa sổ");
  spr("ke-go", 480, 120, 128, 64, "Kệ"); spr("bao-bot", 70, 560, 80, 80, "Bao bột"); spr("thung-go", 890, 560, 80, 80, "Thùng");
  MACHINES.forEach((M, k) => {
    const x = 200 + k * 280, y = 430, job = state.jobs[M.id];
    const running = job && t < job.end, frame = running ? (Math.floor(t / 220) % 2) + 1 : 0;
    spr(frame ? `${M.id}-${frame}` : M.id, x, y, 200, 200, M.name);
    text(M.name, x, y + 18, { size: 15 });
    // hàng chờ 2 ô dưới máy
    for (let q = 0; q < 2; q++) {
      const qx = x - 70 + q * 76, qy = y + 40;
      g.fillStyle = "#1b130c"; g.fillRect(qx, qy, 64, 64); g.strokeStyle = "#7a5a32"; g.lineWidth = 3; g.strokeRect(qx + 1.5, qy + 1.5, 61, 61);
      if (q === 0 && job) {
        spr(M.out, qx + 32, qy + 60, 56, 56, M.recipe);
        if (running) { const k2 = 1 - (job.end - t) / M.ms; g.fillStyle = "rgba(0,0,0,.55)"; g.fillRect(qx + 2, qy + 2, 60, 60 * (1 - k2)); text(Math.ceil((job.end - t) / 1000) + "s", qx + 32, qy + 32, { size: 16 }); }
        else text("Nhận", qx + 32, qy + 52, { size: 12, color: "#9cff9c" });
      }
    }
    hit(x - 100, y - 200, 200, 300, M.name, () => {
      const j = state.jobs[M.id];
      if (!j) { state.jobs[M.id] = { end: t + M.ms }; toast(`${M.name}: bắt đầu ${M.recipe} (cần ${M.need})`); }
      else if (t >= j.end) { delete state.jobs[M.id]; toast(`Nhận ${M.recipe} vào kho`); }
      else toast(`${M.name} đang làm ${M.recipe}…`);
    });
  });
  hud("Xưởng chế biến", "Chạm máy để bắt đầu / nhận thành phẩm · khung chạy 2 frame khi máy hoạt động");
  backBtn();
}

const GOODS = [["ca-rot", "Cà rốt", 6, 0], ["ca-chua", "Cà chua", 12, 1], ["dau-tay", "Dâu tây", 18, -1], ["mut-dau", "Mứt dâu", 74, 1], ["sot-ca-chua", "Sốt cà chua", 48, 0], ["trung", "Trứng gà", 26, -1]];
const BUY = [["bao-hat", "Hạt giống", 5], ["thuc-an", "Thức ăn", 32], ["den-long", "Đèn lồng", 120], ["chau-hoa", "Chậu hoa", 60]];
function drawMarket(t) {
  // nền: cỏ + hàng cây phía sau, mặt đất lát đá phía trước quầy
  tile("grass", 0, 0, W, 260); tile("path", 0, 260, W, H);
  gimg("tree", -30, 20, 200, 200); gimg("tree", 790, 10, 210, 210);
  gimg("market", 150, 40, 150, 139); gimg("market", 660, 46, 140, 130); // sạp phía xa cho có chiều sâu
  spr("co-lau", 340, 250, 90, 90, "", true); spr("den-long", 610, 250, 90, 90, "", true);
  // 3 gian chợ hoàn chỉnh (cột tre + bạt + quầy) dùng chung cột theo repeatStepX; Cô Hai vẽ TRƯỚC gian giữa (keeperLayer)
  const SZ = 300, k = SZ / (STALL?.size || 384), step = (STALL?.step || 264) * k, cy = 470; // cy = chân gian chợ
  const xs = [480 - step, 480, 480 + step];
  if (sprite["quay-cho-hoan-chinh"]) {
    xs.forEach((x, i) => {
      const left = x - SZ / 2, top = cy - SZ;
      if (i === 1) { const [kx, ky, kw, kh] = STALL.keeper, wave = state.bubble && t - state.bubble < 900, bob = !wave && Math.floor(t / 750) % 2 ? 1 : 0;
        const s0 = sprite["co-hai-sau-quay"]; if (s0) g.drawImage(s0.im, s0.sx, s0.sy, s0.w, s0.h, Math.round(left + kx * k), Math.round(top + ky * k + bob), Math.round(kw * k), Math.round(kh * k)); }
      const st = sprite["quay-cho-hoan-chinh"]; g.drawImage(st.im, st.sx, st.sy, st.w, st.h, Math.round(left), Math.round(top), SZ, SZ);
    });
  } else {
    npc("co-hai", 480, 478, 200, t);
    for (let x = 150; x <= 810; x += 165) spr("mai-bat", x, 330, 200, 140, "Mái bạt");
    for (let x = 170; x <= 800; x += COUNTER_STEP) spr("quay", x, 470, 192, 192, "Quầy");
  }
  // hàng BÁN bày trên mặt quầy + giá
  GOODS.forEach(([id, name, price, d], k) => {
    const x = 215 + k * 106, y = 362;
    spr(id, x, y, 54, 54, name);
    g.fillStyle = "rgba(20,14,8,.78)"; g.fillRect(x - 38, y + 4, 76, 20);
    text(`${price} xu ${d > 0 ? "↑" : d < 0 ? "↓" : "·"}`, x, y + 14, { size: 12, color: d > 0 ? "#9cff9c" : d < 0 ? "#ff9c8c" : "#fff6dc" });
  });
  // bong bóng thoại của Cô Hai
  const lines = ["Hôm nay mứt dâu giá tốt nha!", "Hạt cà chua mới về đó con.", "Trời này trồng ngô là trúng."];
  const line = lines[Math.floor(t / 4000) % lines.length];
  g.font = "700 14px 'Be Vietnam Pro', sans-serif"; const bw = g.measureText(line).width + 28;
  g.fillStyle = "#fff8e6"; g.fillRect(560, 120, bw, 42); g.fillStyle = "#3a2a18"; g.fillRect(560, 160, bw, 3);
  g.beginPath(); g.moveTo(572, 162); g.lineTo(552, 184); g.lineTo(592, 162); g.fillStyle = "#fff8e6"; g.fill();
  text(line, 560 + bw / 2, 141, { size: 14, color: "#3a2a18", shadow: false, bold: 700 });
  // bảng giá bên trái, đồ trang trí phía trước
  spr("bang-gia", 90, 470, 150, 150, "Bảng giá"); text("GIÁ HÔM NAY", 90, 360, { size: 12 });
  text("đổi giá sau 1:24:10", 90, 410, { size: 11, color: "#e9dcc0", bold: 600 });
  spr("can-dia", 470, 560, 80, 80, "Cân"); spr("gio-trai-cay", 600, 575, 100, 100, "Giỏ"); spr("thung-rau", 330, 580, 110, 110, "Thùng rau");
  // kệ MUA bên phải
  g.fillStyle = "rgba(20,14,8,.72)"; g.fillRect(720, 500, 230, 70); text("MUA", 745, 514, { size: 13, color: "#ffd45a" });
  BUY.forEach(([id, name, price], k) => { const x = 755 + k * 54, y = 556; spr(id, x, y - 4, 40, 40, name); text(`${price}`, x, y + 6, { size: 11 }); });
  hit(400, 200, 160, 200, "Cô Hai", () => { state.bubble = t; toast("Cô Hai: \"Con muốn bán gì, mua gì cứ nói cô!\""); });
  hud("Khu chợ", "Chạm Cô Hai để chào · hàng bán bày trên quầy, giá có mũi tên lên / xuống · kệ Mua bên phải");
  backBtn();
}

function npc(base, x, y, w, t) {
  const wave = state.bubble && t - state.bubble < 900;
  const f = wave ? `${base}-vay` : Math.floor(t / 650) % 2 ? `${base}-1` : base;
  spr(sprite[f] ? f : base, x, y, w, w, base === "co-hai" ? "Cô Hai" : "Chị Ba");
}
function hud(title, hint) {
  g.fillStyle = "rgba(18,12,7,.78)"; g.fillRect(0, 0, W, 34);
  spr("xu", 22, 30, 26, 26, "", false); text("1.240", 52, 17, { size: 15, align: "left" });
  spr("xp", 140, 30, 26, 26, "", false); text("Cấp 8", 160, 17, { size: 15, align: "left" });
  text(title, W / 2, 17, { size: 16, color: "#ffd45a" });
  g.fillStyle = "rgba(18,12,7,.7)"; g.fillRect(0, H - 28, W, 28);
  text(hint, W / 2, H - 14, { size: 12, color: "#e9dcc0", bold: 600, shadow: false });
}
function backBtn() { g.fillStyle = "#3a2a18"; g.fillRect(W - 150, 42, 140, 36); text("← Nông trại", W - 80, 60, { size: 14 }); hit(W - 150, 42, 140, 36, "Về nông trại", () => go("farm")); }

let toastMsg = "", toastAt = 0;
function toast(m) { toastMsg = m; toastAt = performance.now(); }
function drawToast(t) {
  if (!toastMsg || t - toastAt > 2600) return;
  g.font = "700 15px 'Be Vietnam Pro', sans-serif"; const w = Math.min(W - 40, g.measureText(toastMsg).width + 40);
  g.fillStyle = "rgba(20,14,8,.92)"; g.fillRect(W / 2 - w / 2, H - 82, w, 38); text(toastMsg, W / 2, H - 63, { size: 15 });
}
function hit(x, y, w, h, label, fn) { state.hits.push({ x, y, w, h, label, fn }); }
function go(scene) { state.scene = scene; document.querySelectorAll("[data-scene]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.scene === scene))); }

function frame(t) {
  state.hits = [];
  g.clearRect(0, 0, W, H);
  ({ farm: drawFarm, workshop: drawWorkshop, market: drawMarket })[state.scene](t);
  drawToast(t);
  requestAnimationFrame(frame);
}
cv.addEventListener("click", (e) => {
  const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * W / r.width, y = (e.clientY - r.top) * H / r.height;
  const h = [...state.hits].reverse().find((h) => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h);
  h?.fn();
});
document.querySelectorAll("[data-scene]").forEach((b) => (b.onclick = () => go(b.dataset.scene)));
document.querySelectorAll("[data-b]").forEach((b) => (b.onclick = () => { state.bstate = b.dataset.b; state.t0 = performance.now(); document.querySelectorAll("[data-b]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); }));

loadAll().then((n) => {
  document.getElementById("status").textContent = n ? `Đã nạp ${n} sprite từ assets/v3/` : "Chưa có assets/v3/ — đang dùng ảnh màn 1 + khung chờ (nét đứt = sprite Codex sẽ giao)";
  window.__proto = { state, sprite: Object.keys(sprite) };
  requestAnimationFrame(frame);
});
