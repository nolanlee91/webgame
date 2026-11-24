// Hình dự phòng khi asset Codex chưa có (cảnh đợt 0 đang vẽ, nhân vật đợt 1 vẽ sau). Vẽ bằng canvas trên lưới 2× (vẽ nửa cỡ rồi phóng ×2 nearest),
// đúng ô + anchor của docs/quan-com-tam/asset-spec.json ⇒ đi chung đường vẽ với frame thật (atlas.frame), thay bằng ảnh thật tự động.
// Chỉ hình khối + màu theo ART-DIRECTION §2, không chữ trên đồ vật (trừ số trên tờ tiền dự phòng). Không bao giờ ra ảnh vỡ: tên lạ ⇒ khối màu trung tính.
import { GRILL_SLOTS } from "../data/scene.js?v=c4";

const PERSON = [216, 288, 108, 262];
export const CELL = {
  chars: PERSON, walks: PERSON, reactions: PERSON, actions: PERSON, seated: PERSON, owner: PERSON, helper: PERSON,
  grill: [320, 192, 160, 176], grillItems: [96, 64, 48, 52], plate: [160, 192, 80, 174], equip: [192, 192, 96, 168], tables: [320, 224, 160, 208],
  tableItems: [96, 96, 48, 84], ingr: [64, 64, 32, 32], bills: [96, 48, 48, 24], fx: [96, 96, 48, 48], icons: [48, 48, 24, 42],
  decor: [128, 128, 64, 120], // A: trang trí (đợt 2) — hình khối dự phòng
  street: [1280, 720, 0, 0], streetFg: [1280, 720, 0, 0], quan: [1280, 720, 0, 0], quanFg: [1280, 720, 0, 0], title: [1280, 720, 0, 0],
};
const ROLE = {
  owner: { skin: "#D9A27A", top: "#3E4E96", top2: "#2C3A78", bottom: "#2A2238", apron: "#5A3426", hair: "#22180F", scarf: "#2C3A78", towel: "#EDE6D8", bun: true },
  helper: { skin: "#E3AE86", top: "#D9A520", top2: "#B8881A", bottom: "#3A3040", apron: "#74472F", hair: "#2A1D16", ponytail: true },
  office: { skin: "#E8BC98", top: "#A8CBE8", top2: "#86AACB", bottom: "#3A3F50", hair: "#3A2418", long: true, badge: "#F4F4F4" },
  worker: { skin: "#B98058", top: "#E0843C", top2: "#B8652A", bottom: "#8A7A5A", hat: "#E8C840", hair: "#2A1D16", stripe: "#EDEDB8", wide: true },
  worker2: { skin: "#B07A52", top: "#8C8C8C", top2: "#6E6E6E", bottom: "#4A4A52", hair: "#1E1610", scarfNeck: "#C0503A", tall: true },
  student: { skin: "#E6B892", top: "#F4F2EC", top2: "#D8D6CE", bottom: "#24365A", hair: "#2A1D16", pack: "#3A6FB8", glasses: true, short: true },
  student2: { skin: "#EDC2A0", top: "#F0B0C0", top2: "#D48C9E", bottom: "#3A3A4A", hair: "#2A1D16", short: true, bob: true, tote: "#E8D8B0" },
  shipper: { skin: "#DDA882", top: "#4FA35A", top2: "#3B7F45", bottom: "#2E3440", hat: "#E8D040", stripe: "#EDEDB8", hair: "#2A1D16", bag: "#3B7F45" },
  regular: { skin: "#C99A78", top: "#C88AA0", top2: "#A86E84", bottom: "#4A3A44", hair: "#D8D8D2", hat: "#C9B48A", wide: true },
  reviewer: { skin: "#E0AE88", top: "#4A6FA0", top2: "#3A5A85", bottom: "#2A2A33", hat: "#C83A3A", hair: "#2A1D16", stick: true },
  driver: { skin: "#C8946E", top: "#7E8088", top2: "#64666E", bottom: "#33343A", hat: "#3A3A40", hair: "#2A1D16", mask: "#9AB0C0" },
  nurse: { skin: "#E6B892", top: "#3FB8A8", top2: "#2E9488", bottom: "#3FB8A8", hair: "#2A1D16", bun: true, badge: "#F4F4F4" },
  tourist: { skin: "#F2C9A8", top: "#3FB8B0", top2: "#2E918B", bottom: "#C8B48A", hair: "#8A5A3A", hat: "#D8C080", cone: true, pack: "#8A6A3A" },
};
const MEAT = { raw: "#D9887A", half: "#C26A4E", done: "#A4522A", charred: "#4A2210", burnt: "#231410" };
const ITEM_TINT = { suon: 0, "suon-non": 1, ga: 2, "lap-xuong": 3, "dau-hu": 4 };
const cache = new Map();

function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; }
/** Vẽ ở nửa cỡ (mỗi điểm vẽ = ô 2×2 px), trả data URL. */
function render(w, h, draw) {
  const half = canvas(w / 2, h / 2), g = half.getContext("2d");
  const R = (x, y, ww, hh, col) => { if (ww <= 0 || hh <= 0) return; g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), Math.round(ww), Math.round(hh)); };
  const E = (cx, cy, rx, ry, col) => { g.fillStyle = col; for (let y = -ry; y <= ry; y++) { const k = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry)))); if (k > 0) g.fillRect(Math.round(cx - k), Math.round(cy + y), k * 2, 1); } };
  draw(R, E, g);
  const full = canvas(w, h), G = full.getContext("2d");
  G.imageSmoothingEnabled = false;
  G.drawImage(half, 0, 0, w, h);
  return full.toDataURL("image/png");
}

// ---------- người đứng ----------
function person(R, E, role, pose, step = 0) {
  const P = ROLE[role] || ROLE.student;
  const cx = 54, foot = 131, tall = P.tall ? -3 : P.short ? 4 : 0;
  E(cx, foot, 17, 3, "#1d1510");
  const legA = pose === "walk" ? [0, -4, 0, 4][step % 4] : 0, legB = -legA;
  const hip = 74 + tall;
  R(cx - 9 + legA, hip, 8, foot - hip - 2, P.bottom); R(cx + 1 + legB, hip, 8, foot - hip - 2, P.bottom);
  R(cx - 10 + legA, foot - 3, 10, 3, "#241a14"); R(cx + 1 + legB, foot - 3, 10, 3, "#241a14");
  const top = 30 + tall;
  R(cx - 15, top, 30, hip - top + 4, P.top); R(cx + 6, top, 9, hip - top + 4, P.top2);
  if (P.apron) { R(cx - 12, top + 14, 24, hip - top + 14, P.apron); R(cx - 12, top + 14, 24, 2, "#3A2016"); }
  if (P.stripe) { R(cx - 15, top + 20, 30, 3, P.stripe); R(cx - 15, top + 32, 30, 3, P.stripe); }
  if (P.badge) R(cx - 3, top + 12, 6, 8, P.badge);
  if (P.pack) R(cx - 21, top + 4, 7, 28, P.pack);
  if (P.bag) R(cx - 23, top - 2, 9, 30, P.bag);
  if (P.tote) R(cx + 14, top + 26, 9, 14, P.tote);
  if (P.towel) { R(cx - 14, top, 7, 22, P.towel); }
  if (P.scarfNeck) R(cx - 9, top - 2, 18, 5, P.scarfNeck);
  // tay
  const up = ["order", "surprised", "call"].includes(pose), cross = pose === "impatient", fwd = ["carry", "serve", "grill", "plate", "pour", "box", "wipe"].includes(pose);
  const armL = () => { R(cx - 21, top + 3, 6, 30, P.top2); R(cx - 21, top + 33, 6, 6, P.skin); };
  if (cross) { R(cx - 15, top + 18, 30, 7, P.top2); R(cx - 9, top + 19, 6, 5, P.skin); R(cx + 3, top + 19, 6, 5, P.skin); }
  else if (fwd) {
    armL();
    const wave = step % 2 ? 3 : 0;
    R(cx + 12, top + 10 + wave, 18, 6, P.top2); R(cx + 30, top + 9 + wave, 6, 7, P.skin);
    if (pose === "carry" || pose === "serve") { E(cx + 30, top + 8 + wave, 12, 3, "#F2EEE6"); E(cx + 30, top + 6 + wave, 7, 2, "#E6DCC6"); }
    if (pose === "grill") R(cx + 34, top + 4 + wave, 3, 14, "#9A9AA2");
    if (pose === "pour") R(cx + 32, top + 2, 8, 12, "#C8A048");
    if (pose === "wipe") R(cx + 30, top + 14 + wave, 10, 4, "#EDE6D8");
    if (pose === "box") R(cx + 26, top + 6, 14, 9, "#C8A070");
  } else if (up) {
    armL();
    R(cx + 15, top - 16 + (step % 2) * 3, 6, 22, P.top2); R(cx + 15, top - 22 + (step % 2) * 3, 6, 6, P.skin);
    if (pose === "surprised") { R(cx - 21, top - 16, 6, 22, P.top2); R(cx - 21, top - 22, 6, 6, P.skin); }
  } else if (pose === "fan") {
    armL(); R(cx + 15, top + 3, 6, 18, P.top2); R(cx + 18, top + 18 - (step % 2) * 4, 12, 10, "#C8A86A");
  } else { armL(); R(cx + 15, top + 3, 6, 30, P.top2); R(cx + 15, top + 33, 6, 6, P.skin); }
  if (P.stick) { R(cx + 20, top - 10, 2, 40, "#333"); E(cx + 21, top - 12, 3, 3, "#F4F4E0"); }
  // đầu
  const hy = top - 25;
  R(cx - 10, hy, 20, 23, P.skin);
  R(cx - 10, hy, 20, 6, P.hair);
  if (P.long) { R(cx - 12, hy, 4, 28, P.hair); R(cx + 8, hy, 4, 28, P.hair); }
  if (P.bob) { R(cx - 12, hy, 4, 18, P.hair); R(cx + 8, hy, 4, 18, P.hair); }
  if (P.bun) E(cx, hy - 2, 6, 4, P.hair);
  if (P.ponytail) R(cx + 9, hy + 2, 5, 18, P.hair);
  if (P.scarf) { R(cx - 11, hy - 2, 22, 7, P.scarf); R(cx + 8, hy + 2, 6, 6, P.scarf); }
  if (P.hat) {
    if (P.cone) { R(cx - 17, hy, 34, 3, P.hat); R(cx - 10, hy - 4, 20, 4, P.hat); R(cx - 4, hy - 7, 8, 3, P.hat); }
    else if (P.wide) { R(cx - 15, hy, 30, 3, P.hat); R(cx - 10, hy - 5, 20, 6, P.hat); }
    else R(cx - 11, hy - 3, 22, 8, P.hat);
  }
  if (P.mask) R(cx - 7, hy + 18, 14, 4, P.mask);
  const eye = "#2a1d16";
  const wide = pose === "surprised";
  R(cx - 6, hy + 9, 3, wide ? 4 : 3, eye); R(cx + 3, hy + 9, 3, wide ? 4 : 3, eye);
  if (P.glasses) { R(cx - 8, hy + 8, 7, 1, "#222"); R(cx + 1, hy + 8, 7, 1, "#222"); }
  if (pose === "impatient" || pose === "annoyed") { R(cx - 7, hy + 6, 4, 1, "#5a1d10"); R(cx + 3, hy + 6, 4, 1, "#5a1d10"); }
  if (pose === "happy") R(cx - 4, hy + 17, 8, 2, "#7a3020");
  else if (wide || pose === "order" || pose === "call") R(cx - 2, hy + 16, 4, 3, "#7a3020");
  else R(cx - 3, hy + 17, 6, 1, "#6a3828");
}
// ---------- người ngồi (kèm ghế nhựa, nhìn 3/4 sang phải) ----------
function seated(R, E, role, pose, step = 0) {
  const P = ROLE[role] || ROLE.student;
  const cx = 50, foot = 131;
  E(cx + 2, foot, 16, 3, "#1d1510");
  // ghế nhựa đỏ thấp
  R(cx - 14, foot - 30, 30, 5, "#E2553B"); R(cx - 13, foot - 25, 4, 24, "#C8342A"); R(cx + 11, foot - 25, 4, 24, "#C8342A"); R(cx - 1, foot - 25, 3, 20, "#A82820");
  const seat = foot - 31;
  // chân: đùi ngang về phải, cẳng chân xuống
  R(cx - 6, seat - 9, 30, 9, P.bottom); R(cx + 18, seat - 2, 8, foot - seat - 1, P.bottom); R(cx + 18, foot - 3, 12, 3, "#241a14");
  // thân
  const top = seat - 48;
  R(cx - 14, top, 26, 46, P.top); R(cx + 5, top, 7, 46, P.top2);
  if (P.apron) R(cx - 10, top + 14, 20, 30, P.apron);
  if (P.stripe) R(cx - 14, top + 18, 26, 3, P.stripe);
  if (P.pack) R(cx - 20, top + 4, 6, 24, P.pack);
  if (P.scarfNeck) R(cx - 8, top - 2, 16, 5, P.scarfNeck);
  // tay
  if (pose === "call") { R(cx + 10, top - 14 + (step % 2) * 2, 6, 20, P.top2); R(cx + 10, top - 20 + (step % 2) * 2, 6, 6, P.skin); }
  else if (pose === "eat") { R(cx + 8, top + 12 - step * 4, 18, 6, P.top2); R(cx + 24, top + 10 - step * 4, 6, 6, P.skin); R(cx + 28, top + 2 - step * 4, 2, 10, "#C8A060"); }
  else if (pose === "annoyed") { R(cx - 12, top + 16, 24, 7, P.top2); }
  else if (pose === "happy") { R(cx - 4, top + 26, 18, 6, P.top2); R(cx + 10, top + 25, 6, 6, P.skin); }
  else { R(cx + 4, top + 22, 18, 6, P.top2); R(cx + 20, top + 22, 6, 6, P.skin); }
  // đầu
  const hy = top - 24;
  R(cx - 8, hy, 20, 22, P.skin); R(cx - 8, hy, 20, 6, P.hair);
  if (P.long) R(cx - 10, hy, 4, 26, P.hair);
  if (P.bob) R(cx - 10, hy, 4, 16, P.hair);
  if (P.bun) E(cx, hy - 2, 6, 4, P.hair);
  if (P.hat) { if (P.cone) { R(cx - 14, hy, 32, 3, P.hat); R(cx - 6, hy - 5, 18, 5, P.hat); } else R(cx - 9, hy - 3, 22, 7, P.hat); }
  if (P.mask) R(cx - 2, hy + 17, 14, 4, P.mask);
  R(cx + 2, hy + 9, 3, 3, "#2a1d16"); R(cx + 8, hy + 9, 3, 3, "#2a1d16");
  if (P.glasses) R(cx, hy + 8, 13, 1, "#222");
  if (pose === "annoyed") { R(cx + 1, hy + 6, 4, 1, "#5a1d10"); R(cx + 7, hy + 6, 4, 1, "#5a1d10"); }
  if (pose === "happy") R(cx + 3, hy + 16, 7, 2, "#7a3020"); else if (pose === "call") R(cx + 5, hy + 15, 3, 3, "#7a3020"); else R(cx + 4, hy + 16, 5, 1, "#6a3828");
}

// ---------- bếp + món ----------
function grill(R, E, name) {
  const key = name.replace("grill-", "");
  const ax = 80, base = 88;
  E(ax, base, 66, 4, "#1d1510");
  R(ax - 64, base - 34, 128, 34, "#3A3A40"); R(ax - 64, base - 34, 128, 4, "#55555E"); R(ax - 60, base - 6, 6, 6, "#2A2A30"); R(ax + 54, base - 6, 6, 6, "#2A2A30");
  const coal = { cold: ["#3A3634", "#4A4440"], low: ["#5A5450", "#C2361E"], mid: ["#C2361E", "#F2622A"], high: ["#F2622A", "#FFB14A"], ash: ["#9A938C", "#7A746E"] }[key] || ["#C2361E", "#F2622A"];
  for (let i = 0; i < 26; i++) { const x = ax - 60 + i * 4.6, y = base - 44 + (i % 3); R(x, y, 4, 8, i % 2 ? coal[0] : coal[1]); }
  R(ax + 22, base - 46, 40, 3, "#7A7A82"); // tấm kê vùng giữ ấm
  for (let i = 0; i <= 12; i++) R(ax - 62 + i * 10.4, base - 48, 1, 12, "#9A9AA2");
  R(ax - 62, base - 48, 124, 1, "#B8B8C0"); R(ax - 62, base - 37, 124, 1, "#B8B8C0");
  if (key.startsWith("flare")) { const n = Number(key.slice(-1)) || 1; for (let i = 0; i < 5; i++) { E(ax - 50 + i * 10, base - 52 - n * 3, 4, 8 + n * 2, i % 2 ? "#FFB14A" : "#F2622A"); } }
  if (key.startsWith("smoke")) { const n = Number(key.slice(-1)) || 1; for (let i = 0; i < 4; i++) E(ax - 40 + i * 26, base - 62 - n * 6 - (i % 2) * 6, 12, 8, "#E8E2D8"); }
}
function grillItem(R, E, name) {
  const cx = 24, cy = 24;
  if (name.startsWith("egg-")) {
    const st = name.slice(4);
    E(cx, cy + 2, 17, 7, "#1E1E22"); R(cx + 16, cy, 10, 3, "#2A2A30");
    E(cx, cy + 1, 13, 5, st === "burnt" ? "#7A5030" : "#FBF7EE");
    if (st !== "raw") E(cx, cy, 4, 3, st === "runny" ? "#FFB12E" : st === "set" ? "#F2C94C" : st === "hard" ? "#E8D070" : "#5A3A20");
    else E(cx, cy, 4, 3, "#FFC850");
    return;
  }
  const [item, st] = name.includes("-flip-") ? [name.split("-flip-")[0], "flip"] : [name.slice(0, name.lastIndexOf("-")), name.slice(name.lastIndexOf("-") + 1)];
  const tint = ITEM_TINT[item] ?? 0;
  const col = st === "flip" ? MEAT.half : MEAT[st] || MEAT.done;
  const w = item === "lap-xuong" ? 14 : item === "dau-hu" ? 10 : 13, h = item === "lap-xuong" ? 3 : item === "dau-hu" ? 6 : 6;
  if (st === "flip") { const n = Number(name.slice(-1)) || 1; R(cx - 6, cy - 6 - n * 3, 12, 10 + n * 2, col); R(cx - 6, cy - 6 - n * 3, 12, 2, "#7E3A1C"); return; }
  const c2 = item === "dau-hu" ? (st === "raw" ? "#F4E8C8" : st === "half" ? "#E8C890" : col) : item === "ga" && st !== "burnt" ? (st === "raw" ? "#E8B898" : col) : col;
  E(cx, cy, w, h, c2);
  if (st !== "raw" && st !== "burnt") for (let i = -2; i <= 2; i++) R(cx + i * 4 - 1, cy - h + 2, 2, h * 2 - 3, "#5A2810");
  if (st === "charred") { E(cx - w + 2, cy, 3, h - 1, "#231410"); E(cx + w - 2, cy, 3, h - 1, "#231410"); }
  if (tint === 3) R(cx - w, cy - 1, w * 2, 1, "#E07070");
}

// ---------- lớp dĩa ----------
function plateLayer(R, E, name) {
  const cx = 40, cy = 70;
  const dish = () => { E(cx, cy + 2, 36, 15, "#2F5D9A"); E(cx, cy + 1, 34, 13, "#E8EEF2"); E(cx, cy, 30, 11, "#F8FAFC"); };
  const box = (closed) => { R(cx - 32, cy - 14, 64, 28, "#B8865A"); R(cx - 30, cy - 12, 60, 24, closed ? "#C8986A" : "#E8D0A8"); if (!closed) R(cx - 32, cy - 26, 64, 12, "#C89868"); };
  switch (name) {
    case "plate-dia": dish(); break;
    case "plate-dia-dirty": dish(); E(cx - 8, cy, 8, 4, "#E6DCC6"); R(cx + 6, cy - 3, 12, 3, "#D9883A"); R(cx + 10, cy + 2, 8, 2, "#EFE6D0"); break;
    case "box-open": box(false); break;
    case "box-closed": box(true); R(cx - 2, cy - 14, 4, 28, "#9A6A40"); break;
    case "box-bag": R(cx - 34, cy - 30, 68, 46, "#F0EEE8"); R(cx - 12, cy - 40, 24, 10, "#F0EEE8"); R(cx - 8, cy - 36, 16, 6, "#00000000"); break;
    case "com": E(cx - 12, cy - 2, 15, 8, "#E6DCC6"); E(cx - 12, cy - 4, 13, 6, "#F5F0E4"); break;
    case "com-them": E(cx - 12, cy - 3, 18, 10, "#E6DCC6"); E(cx - 12, cy - 5, 16, 8, "#F5F0E4"); break;
    case "mo-hanh": for (let i = 0; i < 8; i++) R(cx - 22 + (i * 5) % 22, cy - 8 + (i * 3) % 7, 3, 2, i % 2 ? "#7DB34A" : "#A9CF5E"); R(cx - 18, cy - 6, 6, 1, "#F7E7A8"); break;
    case "hanh-phi": for (let i = 0; i < 8; i++) R(cx - 22 + (i * 5) % 22, cy - 8 + (i * 3) % 7, 3, 2, "#C8883A"); break;
    case "bi": case "bi-chay": for (let i = 0; i < 10; i++) R(cx - 20 + (i * 4) % 18, cy - 10 + (i * 5) % 6, 4, 1, name === "bi" ? "#F4E8C8" : "#E8E0B0"); break;
    case "cha": case "cha-chay": R(cx + 8, cy + 2, 14, 8, name === "cha" ? "#E8B040" : "#D8B880"); R(cx + 8, cy + 2, 14, 2, "#B88020"); break;
    case "lap-xuong": R(cx + 6, cy - 4, 20, 4, "#B83A3A"); R(cx + 6, cy + 1, 20, 4, "#A83030"); break;
    case "dau-hu": R(cx + 6, cy - 6, 16, 9, "#E8C070"); R(cx + 6, cy - 6, 16, 2, "#B88A3A"); break;
    case "do-chua": for (let i = 0; i < 6; i++) R(cx + 14 + (i % 3) * 3, cy + 4 + Math.floor(i / 3) * 2, 3, 2, i % 2 ? "#EE8A3C" : "#F4EEDD"); break;
    case "dua-leo": R(cx + 22, cy - 4, 8, 3, "#5E9E44"); R(cx + 22, cy - 1, 8, 3, "#BFE08A"); break;
    case "ca-chua": E(cx + 28, cy + 4, 4, 3, "#D8432E"); break;
    case "nuoc-mam-chan": R(cx - 22, cy - 2, 20, 3, "#D9883A"); R(cx - 18, cy + 1, 12, 2, "#E8A85A"); break;
    case "chen-nuoc-mam": E(cx - 24, cy - 16, 8, 4, "#2F5D9A"); E(cx - 24, cy - 17, 6, 3, "#D9883A"); R(cx - 26, cy - 18, 2, 1, "#C8342A"); break;
    case "bich-nuoc-mam": R(cx - 30, cy - 20, 10, 8, "#F0E8D8"); R(cx - 29, cy - 17, 8, 4, "#D9883A"); break;
    case "ot": R(cx + 2, cy - 8, 3, 2, "#C8342A"); R(cx + 6, cy - 6, 3, 2, "#C8342A"); break;
    case "chen-canh": E(cx + 24, cy - 16, 10, 5, "#E8EEF2"); E(cx + 24, cy - 17, 8, 3, "#B8A060"); R(cx + 22, cy - 18, 3, 1, "#5E9E44"); break;
    case "ngo-rac": for (let i = 0; i < 5; i++) R(cx - 6 + i * 4, cy - 10 + (i % 2) * 3, 2, 2, "#3E8A3A"); break;
    default:
      if (name.startsWith("suon-") || name.startsWith("ga-") || name.startsWith("suon-non-")) {
        const st = name.slice(name.lastIndexOf("-") + 1);
        const col = MEAT[st] || MEAT.done;
        const ga = name.startsWith("ga-");
        E(cx + 12, cy - 3, ga ? 13 : 16, ga ? 8 : 7, col);
        if (st !== "burnt") for (let i = -2; i <= 2; i++) R(cx + 12 + i * 5, cy - 8, 2, 10, "#5A2810");
        if (st === "charred") { E(cx - 2, cy - 3, 3, 5, "#231410"); E(cx + 26, cy - 3, 3, 5, "#231410"); }
        if (name.startsWith("suon-non-")) R(cx + 24, cy - 4, 6, 2, "#F4EEDD");
      } else if (name.startsWith("trung-")) {
        const st = name.slice(6);
        E(cx + 2, cy - 12, 11, 6, "#FBF7EE"); E(cx + 2, cy - 13, 4, 3, st === "runny" ? "#FFB12E" : st === "set" ? "#F2C94C" : "#E8D070");
        if (st === "runny") R(cx + 4, cy - 10, 2, 4, "#FFB12E");
      } else R(cx - 10, cy - 10, 20, 12, "#B8A890");
  }
}

// ---------- thiết bị ----------
const EQ = {
  "rice-cooker": (R, E, st, n) => {
    E(48, 84, 20, 3, "#1d1510"); R(28, 52, 40, 32, "#F0EEE8"); R(28, 52, 40, 4, "#D8D4CC"); E(48, 50, 21, 6, "#E0DCD4"); R(44, 41, 8, 4, "#888");
    R(32, 70, 6, 4, st === "cooking" ? "#E04030" : st === "broken" ? (n % 2 ? "#E04030" : "#400") : "#40A050");
    if (st === "cooking") E(48 + (n % 2) * 4, 34 - n * 2, 6, 4, "#F2EEE6");
    if (st === "empty") R(36, 47, 24, 3, "#B8B4AC");
  },
  "egg-pan": (R, E, st, n) => { E(48, 84, 22, 3, "#1d1510"); R(30, 74, 36, 10, "#5A5A62"); E(48, 70, 20, 7, "#1E1E22"); R(66, 68, 16, 3, "#2A2A30"); if (st === "fry") { E(48, 69, 9, 4, "#FBF7EE"); E(48, 68, 3, 2, "#FFB12E"); } },
  steamer: (R, E, st, n) => { E(48, 84, 20, 3, "#1d1510"); for (let i = 0; i < 3; i++) R(30, 60 + i * 8, 36, 7, i % 2 ? "#C8A068" : "#B8905A"); E(48, 58, 18, 5, "#D8B078"); if (st === "steam") E(48, 44 - n * 3, 8, 5, "#F2EEE6"); if (st === "tray") R(32, 54, 32, 4, n ? "#E8B040" : "#F0D080"); },
  "soup-pot": (R, E, st, n) => { E(48, 84, 20, 3, "#1d1510"); R(30, 56, 36, 28, "#9A9AA2"); E(48, 56, 18, 5, "#7A7A82"); E(48, 55, 15, 3, "#B8A060"); if (st === "steam") E(48, 42 - n * 3, 7, 5, "#F2EEE6"); },
  "mo-hanh-pot": (R, E, st) => { E(48, 84, 12, 2, "#1d1510"); R(38, 66, 20, 18, "#E8E2D0"); E(48, 66, 10, 3, st === "empty" ? "#C8C0A8" : "#7DB34A"); if (st === "full") R(40, 70, 16, 8, "#A9CF5E"); },
  "tea-cooler": (R, E, st) => { E(48, 84, 16, 3, "#1d1510"); R(34, 50, 28, 34, "#C8342A"); R(34, 50, 28, 5, "#E2553B"); R(58, 70, 6, 4, "#DDD"); R(37, 60, 22, st === "low" ? 4 : 16, "#C88A3A"); },
  "charcoal-sack": (R, E, st) => { E(48, 84, 20, 3, "#1d1510"); const h = st === "full" ? 34 : st === "low" ? 20 : 8; R(30, 84 - h, 36, h, "#C8B890"); R(30, 84 - h, 36, 3, "#A89870"); if (st !== "empty") for (let i = 0; i < 4; i++) R(34 + i * 7, 84 - h - 3, 5, 4, "#2A2624"); },
  "palm-fan": (R, E) => { E(48, 60, 16, 14, "#C8A86A"); R(46, 70, 4, 14, "#8A6A3A"); },
  "electric-blower": (R, E, st, n) => { R(40, 70, 16, 14, "#4A4A52"); E(48, 60, 14, 14, "#6A6A72"); if (st === "on") R(48 - (n % 2) * 6, 58, 12, 4, "#AAA"); },
  "plate-stack": (R, E, st) => { const k = st === "full" ? 8 : st === "low" ? 3 : 0; E(48, 84, 18, 3, "#1d1510"); for (let i = 0; i < k; i++) { E(48, 82 - i * 3, 16, 3, "#2F5D9A"); E(48, 81 - i * 3, 14, 2, "#F4F6F8"); } if (!k) E(48, 82, 14, 2, "#9A9088"); },
  "wash-tub": (R, E, st) => { E(48, 84, 26, 4, "#1d1510"); R(22, 66, 52, 18, "#5A8AB0"); E(48, 66, 26, 6, "#3A6A90"); E(48, 65, 22, 4, "#8AB8D8"); const k = st === "full" ? 6 : st === "half" ? 3 : 0; for (let i = 0; i < k; i++) E(36 + i * 5, 64 - (i % 2) * 2, 6, 2, "#EEE"); },
  "box-stack": (R, E) => { for (let i = 0; i < 4; i++) R(32, 78 - i * 6, 32, 6, i % 2 ? "#C8986A" : "#B8865A"); },
  "sauce-jar": (R, E) => { R(42, 68, 12, 16, "#E8EEF2"); R(43, 72, 10, 10, "#D9883A"); R(41, 66, 14, 3, "#2F5D9A"); },
  "chili-jar": (R, E) => { R(42, 70, 12, 14, "#E8EEF2"); R(43, 73, 10, 9, "#C8342A"); R(41, 68, 14, 3, "#888"); },
  "pickle-jar": (R, E) => { R(38, 62, 20, 22, "#E8EEF2"); R(40, 66, 16, 16, "#EE8A3C"); R(40, 72, 16, 3, "#F4EEDD"); R(37, 60, 22, 3, "#C8342A"); },
  "cucumber-tray": (R, E) => { R(32, 78, 32, 6, "#9A9AA2"); for (let i = 0; i < 4; i++) R(34 + i * 7, 74, 6, 4, i % 2 ? "#5E9E44" : "#D8432E"); },
  "bi-tray": (R, E) => { R(32, 78, 32, 6, "#9A9AA2"); for (let i = 0; i < 8; i++) R(34 + (i * 4) % 28, 74 + (i % 2), 3, 2, "#F4E8C8"); },
  "suon-tray": (R, E) => { R(28, 76, 40, 8, "#9A9AA2"); for (let i = 0; i < 3; i++) E(36 + i * 12, 74, 6, 3, "#D9887A"); },
  "cash-tin": (R, E) => { R(36, 72, 24, 12, "#8A4A2A"); R(36, 72, 24, 3, "#A85A32"); },
  ledger: (R, E) => { R(38, 76, 20, 8, "#3A5A85"); R(39, 77, 18, 1, "#F4F4F4"); },
  "bag-hook": (R, E) => { R(46, 40, 4, 30, "#888"); R(40, 60, 16, 20, "#F0EEE8"); },
  "smoke-hood": (R, E) => { R(20, 60, 56, 24, "#8A8A92"); R(40, 20, 16, 40, "#7A7A82"); },
  "water-can": (R, E) => { R(36, 56, 24, 28, "#3A7AC0"); R(44, 50, 8, 6, "#3A7AC0"); },
};
function equip(R, E, name) {
  const m = name.match(/^(rice-cooker-big|rice-cooker|egg-pan|steamer|soup-pot|mo-hanh-pot|tea-cooler|charcoal-sack|palm-fan|electric-blower|plate-stack|wash-tub|box-stack|sauce-jar|chili-jar|pickle-jar|cucumber-tray|bi-tray|suon-tray|cash-tin|ledger|bag-hook|smoke-hood|water-can)-?(.*)$/);
  if (!m) { R(32, 60, 32, 24, "#8A7A6A"); return; }
  const base = m[1] === "rice-cooker-big" ? "rice-cooker" : m[1];
  const rest = m[2] || "";
  const st = rest.replace(/-\d+$/, "").replace(/^(fry|steam|on|cooking|tray)-?.*$/, "$1") || "idle";
  const n = Number((rest.match(/(\d+)$/) || [0, 0])[1]);
  const trayDone = rest === "tray-done" ? 1 : 0;
  EQ[base](R, E, st === "tray" ? "tray" : st, st === "tray" ? trayDone : n);
}

// ---------- bàn + đồ trên bàn ----------
function table(R, E, name) {
  const [kind, st] = name.split("-");
  const four = kind === "table4";
  const ax = 80, base = 104, topY = base - 60, w = four ? 66 : 34;
  E(ax, base, w + 6, 4, "#1d1510");
  R(ax - w + 4, topY + 6, 4, base - topY - 6, "#4A2A1C"); R(ax + w - 8, topY + 6, 4, base - topY - 6, "#4A2A1C");
  R(ax - w + 10, topY + 8, 3, base - topY - 14, "#3A2016"); R(ax + w - 13, topY + 8, 3, base - topY - 14, "#3A2016");
  R(ax - w, topY - 8, w * 2, 12, "#8E5632"); R(ax - w, topY - 8, w * 2, 3, "#A86A40"); R(ax - w, topY + 3, w * 2, 3, "#6B3D24");
  if (st === "set" || st === "clean") { R(ax - 6, topY - 18, 5, 12, "#C8A060"); R(ax - 5, topY - 22, 1, 4, "#A88040"); R(ax - 3, topY - 22, 1, 4, "#A88040"); R(ax + 2, topY - 14, 6, 8, "#2F5D9A"); if (st === "set") R(ax - 16, topY - 12, 8, 6, "#F4F4F0"); }
  if (st === "dirty") { E(ax - 14, topY - 6, 9, 3, "#E8E4DC"); R(ax - 18, topY - 8, 6, 2, "#D9883A"); E(ax + 12, topY - 7, 8, 3, "#E8E4DC"); R(ax + 2, topY - 14, 4, 7, "#C88A3A"); R(ax + 22, topY - 10, 5, 4, "#F4F4F0"); if (four) { E(ax - 40, topY - 6, 8, 3, "#E8E4DC"); E(ax + 40, topY - 6, 8, 3, "#E8E4DC"); } }
  if (st === "wet") { R(ax - w + 6, topY - 6, w - 4, 1, "#E8F4FF"); R(ax + 4, topY - 4, w - 12, 1, "#C8E4F8"); }
}
function tableItem(R, E, name) {
  const cx = 24, base = 42;
  if (name.startsWith("stool-")) { const c = name === "stool-red" ? ["#E2553B", "#C8342A"] : ["#4A8FD0", "#2F6FB0"]; E(cx, base, 14, 2, "#1d1510"); R(cx - 14, base - 32, 28, 5, c[0]); R(cx - 13, base - 27, 4, 26, c[1]); R(cx + 9, base - 27, 4, 26, c[1]); return; }
  if (name.startsWith("plate-eating-")) { const st = name.slice(13); E(cx, base - 2, 12, 4, "#2F5D9A"); E(cx, base - 3, 10, 3, "#F4F6F8"); if (st !== "empty") { E(cx - 4, base - 4, st === "full" ? 5 : 3, 2, "#F5F0E4"); E(cx + 4, base - 4, st === "full" ? 5 : 2, 2, "#A4522A"); } return; }
  if (name === "box-eating") { R(cx - 10, base - 7, 20, 7, "#C8986A"); R(cx - 9, base - 6, 18, 4, "#E8D0A8"); return; }
  if (name.startsWith("tea-glass-")) { const st = name.slice(10); R(cx - 3, base - 12, 6, 12, "#D8E8F0"); const h = st === "full" ? 10 : st === "half" ? 5 : 0; if (h) R(cx - 2, base - 1 - h, 4, h, "#C88A3A"); return; }
  if (name === "tea-pitcher") { R(cx - 6, base - 18, 12, 18, "#D8E8F0"); R(cx - 5, base - 14, 10, 13, "#C88A3A"); return; }
  if (name === "khan-lanh") { R(cx - 6, base - 4, 12, 4, "#F4F4F0"); return; }
  if (name === "bill-tray") { R(cx - 8, base - 3, 16, 3, "#8A4A2A"); R(cx - 6, base - 6, 12, 3, "#F4EEDD"); return; }
  if (name === "dirty-stack") { for (let i = 0; i < 3; i++) E(cx, base - 2 - i * 3, 12, 3, i % 2 ? "#E8E4DC" : "#D8D4CC"); return; }
  if (name === "chen-canh-table") { E(cx, base - 3, 7, 3, "#E8EEF2"); E(cx, base - 4, 5, 2, "#B8A060"); return; }
  R(cx - 6, base - 10, 12, 10, "#8A7A6A");
}
const INGR_COL = { "gao-tam": "#F5F0E4", suon: "#D9887A", "suon-non": "#C87868", ga: "#E8B898", "lap-xuong": "#B83A3A", "dau-hu": "#E8C070", bi: "#F4E8C8", "bi-chay": "#E8E0B0", cha: "#E8B040", "cha-chay": "#D8B880", trung: "#FBF7EE", "do-chua": "#EE8A3C", "dua-leo": "#5E9E44", "ca-chua": "#D8432E", "hanh-la": "#7DB34A", "mo-heo": "#F7E7A8", "nuoc-mam": "#D9883A", "nuoc-tuong": "#6A3A1A", ot: "#C8342A", "rau-canh": "#5E9E44", tra: "#C88A3A", da: "#D8E8F0", than: "#2A2624", gas: "#3A6AB0", hop: "#C8986A", tui: "#F0EEE8", "khan-lanh": "#F4F4F0", dia: "#E8EEF2" };
function ingredient(R, E, name) { E(16, 17, 12, 10, "#4A3A2E"); E(16, 16, 11, 9, INGR_COL[name] || "#A89880"); E(13, 13, 3, 2, "#FFF6E0"); }
function bill(R, E, name) {
  if (name.startsWith("bill-")) { const v = parseInt(name.slice(5), 10); const col = v >= 200 ? "#C86A4A" : v >= 50 ? "#4A8A9A" : v >= 10 ? "#8A6AB0" : "#6A9A5A"; R(4, 4, 40, 16, col); R(6, 6, 36, 12, "#F4F0E0"); R(8, 8, 32, 8, col); return; }
  if (name === "coin-stack") { for (let i = 0; i < 4; i++) E(24, 18 - i * 2, 8, 2, "#D8B040"); return; }
  if (name.startsWith("slip-")) { R(12, 2, 24, 20, "#FBF7EE"); for (let i = 0; i < 4; i++) R(15, 6 + i * 4, 18, 1, "#B8A890"); if (name === "slip-paid") R(26, 14, 8, 6, "#40A050"); if (name === "slip-ghi-so") R(26, 14, 8, 6, "#C8342A"); return; }
  if (name === "qr-card") { R(14, 2, 20, 20, "#F4F4F4"); for (let i = 0; i < 16; i++) if ((i * 7) % 3) R(16 + (i % 4) * 4, 4 + Math.floor(i / 4) * 4, 3, 3, "#222"); }
}
function fx(R, E, name) {
  const n = Number(name.slice(-1)) || 1;
  if (name.startsWith("smoke-puff") || name.startsWith("steam")) { E(24, 28 - n * 4, 8 + n * 2, 6 + n, "#E8E2D8"); return; }
  if (name.startsWith("sizzle")) { for (let i = 0; i < 4; i++) R(14 + i * 6, 24 - ((i + n) % 3) * 3, 2, 2, "#FFE8A0"); return; }
  if (name.startsWith("flame")) { E(24, 26, 6, 10 + n * 2, "#F2622A"); E(24, 28, 3, 6, "#FFB14A"); return; }
  if (name.startsWith("sparkle")) { R(23, 14 + n * 2, 2, 10, "#FFF6C0"); R(18 + n, 19, 12 - n * 2, 2, "#FFF6C0"); return; }
  if (name.startsWith("coin-fly")) { E(24, 30 - n * 6, 5, 5, "#E8C040"); return; }
  if (name.startsWith("ding")) { E(24, 22, 6 + n * 2, 6 + n * 2, "#FFE8A0"); E(24, 22, 4 + n, 4 + n, "#00000000"); return; }
  if (name.startsWith("wipe-shine")) { R(12 + n * 4, 22, 14, 2, "#E8F4FF"); return; }
  if (name.startsWith("pour")) { R(22, 10 + n * 2, 3, 20, "#C88A3A"); }
}
const ICON_COL = { coin: "#E8C040", star: "#F2B33A", "star-empty": "#C8B8A0", follower: "#5A86C2", buzz: "#E0604F", xp: "#8A6AB0", clock: "#5A8A6A", "sound-on": "#3E7364", "sound-off": "#9A8A7A", pause: "#6B4A33", help: "#3E7364", journal: "#8E5632", stock: "#8A7A5A", grill: "#C2361E", flip: "#A4522A", fan: "#C8A86A", charcoal: "#2A2624", rice: "#F5F0E4", plate: "#5B86C2", tea: "#C88A3A", wipe: "#8AB8D8", table: "#8E5632", takeaway: "#C8986A", ticket: "#F4EEDD", bill: "#6A9A5A", ledger: "#3A5A85", smoke: "#B8B0A8", check: "#40A050", cross: "#C8342A", mission: "#D9A520", upgrade: "#3E7364", decor: "#E0559A", reviews: "#F2B33A", level: "#8A6AB0", preorder: "#C2361E" };
function uiIcon(R, E, name) { E(12, 13, 9, 9, "#3B2618"); E(12, 12, 9, 9, ICON_COL[name] || "#8A7A6A"); E(10, 9, 3, 2, "#FFF6E0"); }

// ---------- cảnh ----------
function sky(R, E) {
  R(0, 0, 640, 220, "#1C1A3A"); R(0, 120, 640, 60, "#22204A"); R(0, 170, 640, 50, "#2B2A5C");
  for (let i = 0; i < 70; i++) { const x = (i * 97) % 640, y = 20 + ((i * 53) % 150); R(x, y, 1, 1, i % 3 ? "#F6D27A" : "#E8A94A"); }
}
function lanterns(R, E) { for (let x = 260; x < 640; x += 3) R(x, 18 + Math.round(Math.sin(x / 40) * 3), 1, 1, "#5A4A3A"); for (let i = 0; i < 8; i++) { const x = 280 + i * 44; E(x, 26, 6, 6, "#F4B556"); E(x, 25, 4, 4, "#FFD98A"); } }
function counterBack(R) { R(196, 156, 156, 6, "#6B3D24"); R(200, 162, 150, 4, "#4A2A1C"); }
function street(R, E) {
  sky(R, E);
  // bờ sông + thành phố xa bên phải
  R(470, 150, 170, 70, "#2B2A5C"); for (let i = 0; i < 9; i++) R(480 + i * 18, 110 + (i % 3) * 12, 12, 110 - (i % 3) * 12, "#262450");
  for (let i = 0; i < 30; i++) R(484 + (i * 13) % 150, 120 + (i * 7) % 80, 1, 1, "#F6D27A");
  R(470, 205, 170, 15, "#3B3F7A"); for (let x = 472; x < 640; x += 8) R(x, 196, 2, 14, "#5A5A70"); R(470, 196, 170, 2, "#6A6A80");
  // mặt tiền nhà phố, cửa cuốn (cao ~330 px = 165 nửa), đáy y 440 (220 nửa)
  R(0, 30, 470, 190, "#4A3A30"); R(0, 30, 470, 6, "#3A2A20");
  R(30, 40, 150, 30, "#2E5A4C"); for (let x = 32; x < 180; x += 8) R(x, 40, 1, 30, "#3F7462");
  R(230, 40, 150, 30, "#2E5A4C"); for (let x = 232; x < 380; x += 8) R(x, 40, 1, 30, "#3F7462");
  R(40, 55 + 0, 380, 165, "#7A7A80"); for (let y = 58; y < 220; y += 6) R(40, y, 380, 1, "#6A6A70"); R(40, 55, 380, 4, "#5A5A60");
  R(420, 30, 8, 190, "#3A3A40"); // cột điện
  for (let x = 0; x < 470; x += 2) R(x, 34 + Math.round(Math.sin(x / 60) * 2), 1, 1, "#222");
  // hoa giấy góc trên trái
  for (let i = 0; i < 40; i++) E((i * 17) % 120, (i * 11) % 40, 3, 2, i % 3 ? "#C2336E" : "#E0559A");
  for (let i = 0; i < 16; i++) E((i * 23) % 110, (i * 7) % 36 + 4, 3, 2, "#2F6A3A");
  lanterns(R, E);
  // vỉa hè gạch y 440–720
  R(0, 220, 640, 140, "#8A7E70"); for (let y = 228; y < 360; y += 14) R(0, y, 640, 1, "#7A6E62"); for (let y = 220; y < 360; y += 14) for (let x = ((y / 14) % 2) * 14; x < 640; x += 28) R(x, y, 1, 14, "#7A6E62");
  R(600, 220, 40, 140, "#5A5450"); R(598, 220, 2, 140, "#B8B0A0"); // mép đường bên phải
  counterBack(R);
  // ánh đèn chao trên quầy
  
}
function quan(R, E) {
  R(0, 0, 640, 220, "#E8D8A0"); R(0, 120, 640, 100, "#F2F0EA"); for (let y = 120; y < 220; y += 10) R(0, y, 640, 1, "#D8D4CC"); for (let x = 0; x < 640; x += 10) R(x, 120, 1, 100, "#D8D4CC");
  R(20, 30, 90, 60, "#2B2A5C"); R(20, 30, 90, 3, "#6B3D24"); for (let i = 0; i < 12; i++) R(24 + (i * 7) % 82, 40 + (i * 5) % 40, 1, 1, "#F6D27A");
  R(250, 36, 140, 8, "#8E5632"); R(230, 10, 180, 22, "#C2361E");
  R(578, 55, 70, 165, "#3A2A20"); R(584, 60, 58, 160, "#1C1A3A"); // cửa sau phải, đáy y 440
  R(0, 220, 640, 140, "#B8A890"); for (let y = 220; y < 360; y += 16) R(0, y, 640, 1, "#A89880"); for (let x = 0; x < 640; x += 16) R(x, 220, 1, 140, "#A89880");
  counterBack(R);
  E(200, 60, 30, 8, "#C8C8C8"); lanterns(R, E);
}
function foreground(R, E) {
  // mặt trước quầy (xe nướng x 40–380, bàn bày x 380–680), che thân dưới cô chủ
  R(18, 206, 172, 70, "#3A3A40"); R(18, 206, 172, 6, "#5A5A62"); for (let x = 24; x < 190; x += 14) R(x, 214, 2, 60, "#2A2A30");
  R(190, 206, 152, 70, "#6B3D24"); R(190, 206, 152, 6, "#8E5632"); for (let y = 216; y < 276; y += 10) R(192, y, 148, 1, "#5A3220");
  R(24, 274, 8, 10, "#222"); R(176, 274, 8, 10, "#222"); E(28, 286, 6, 3, "#111"); E(180, 286, 6, 3, "#111");
}
function title(R, E) {
  street(R, E);

  E(220, 250, 90, 34, "#2F5D9A"); E(220, 248, 86, 31, "#F8FAFC"); E(190, 240, 34, 18, "#F5F0E4"); E(250, 238, 40, 16, "#A4522A"); for (let i = -3; i <= 3; i++) R(250 + i * 10, 226, 3, 22, "#5A2810");
  E(232, 216, 20, 10, "#FBF7EE"); E(232, 214, 7, 5, "#FFB12E");
  for (let i = 0; i < 6; i++) R(276 + i * 6, 252, 5, 4, i % 2 ? "#EE8A3C" : "#F4EEDD");
}

function draw(alias, name) {
  const c = CELL[alias] || [96, 96, 48, 84];
  const [w, h] = c;
  return render(w, h, (R, E, g) => {
    switch (alias) {
      case "street": return street(R, E);
      case "quan": return quan(R, E);
      case "streetFg": case "quanFg": return foreground(R, E);
      case "title": return title(R, E);
      case "grill": return grill(R, E, name);
      case "grillItems": return grillItem(R, E, name);
      case "plate": return plateLayer(R, E, name);
      case "equip": return equip(R, E, name);
      case "tables": return table(R, E, name);
      case "tableItems": return tableItem(R, E, name);
      case "ingr": return ingredient(R, E, name);
      case "bills": return bill(R, E, name);
      case "fx": return fx(R, E, name);
      case "icons": return uiIcon(R, E, name);
      case "decor": return decorPh(R, E, name); // A:
      case "seated": { const m = name.match(/^(.+)-sit-(eat-\d|wait|call|happy|annoyed)$/); if (!m) return; const [pose, n] = m[2].startsWith("eat") ? ["eat", Number(m[2].slice(-1)) - 1] : [m[2], 0]; return seated(R, E, m[1], pose, n); }
      default: {
        // nhân vật đứng: {vai} / {vai}-walk-n / {vai}-waiting|happy|impatient / {vai}-order-n / {vai}-surprised-n / owner-grill-n …
        const m = name.match(/^([a-z0-9]+)(?:-([a-z]+))?(?:-(\d))?$/);
        if (!m) return;
        const role = m[1], act = m[2] || "idle", n = Number(m[3] || 1) - 1;
        const pose = act === "waiting" || act === "idle" ? "idle" : act === "clear" ? "carry" : act;
        return person(R, E, role, pose, n);
      }
    }
  });
}

/** Hàm dự phòng cho makeAtlas: (alias, tên frame) ⇒ frame canvas đúng ô + anchor của asset-spec. */
/** A: đồ trang trí dự phòng (chậu, đèn lồng, khung treo tường) trên lưới 2×, ô 128 nửa cỡ = 64. */
function decorPh(R, E, name) {
  const wall = /lantern|lights|calendar|radio|fan|tv|cage|frame|neon/.test(name);
  if (/lantern/.test(name)) { R(31, 8, 2, 10, "#5a3a2a"); E(32, 30, 12, 14, name.startsWith("red") ? "#c8342a" : "#efe2c0"); R(26, 44, 12, 4, "#d9a520"); return; }
  if (/lights/.test(name)) { for (let i = 0; i < 6; i++) E(8 + i * 10, 20 + (i % 2) * 4, 3, 3, ["#f2c14a", "#e0604f", "#7fc08d"][i % 3]); R(4, 18, 56, 1, "#3a2c22"); return; }
  if (wall) { R(14, 18, 36, 28, /neon/.test(name) ? "#e0559a" : /tv/.test(name) ? "#3a3a40" : "#8e5632"); R(17, 21, 30, 22, /tv/.test(name) ? "#7a9ab0" : "#f4eedd"); return; }
  E(32, 58, 16, 3, "#1d1510");
  R(22, 40, 20, 18, /jar/.test(name) ? "#e8ecf0" : "#a4522a");
  if (/plant|pot/.test(name)) { E(32, 28, 16, 14, /bougainvillea/.test(name) ? "#e0559a" : "#4f8a4a"); E(26, 22, 6, 6, "#6aaa5a"); }
  if (/menu/.test(name)) { R(18, 20, 28, 30, "#2a3a30"); R(20, 24, 24, 2, "#e8e4d8"); R(20, 30, 18, 2, "#e8e4d8"); }
}
export function placeholderFallback() {
  return (alias, name) => {
    if (typeof document === "undefined") return null;
    const key = alias + "|" + name;
    if (cache.has(key)) return cache.get(key);
    const c = CELL[alias];
    if (!c) return null;
    const url = draw(alias, name);
    const f = { url, sw: c[0], sh: c[1], x: 0, y: 0, w: c[0], h: c[1], ax: c[2], ay: c[3], placeholder: true };
    cache.set(key, f);
    return f;
  };
}
export const GRILL_SLOT_OFFSETS = GRILL_SLOTS;
