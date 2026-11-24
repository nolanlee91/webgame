// Hình: đọc data/asset-manifest.json (bản chép của docs/tham-tu-hem/asset-manifest.json — test kiểm khớp).
// Có frame / file thật thì dùng, không có thì vẽ thay bằng canvas (cảnh tối có hoạ tiết, chân dung pixel chữ cái đầu) — game luôn chơi trọn được.
// Crisp (PLAYBOOK §2): hệ số hiển thị = px thiết bị / px file luôn là bội 0,5. Cảnh lưới 2× (960×540), chân dung HD lưới 1× (ô 256).
import { h } from "./dom.js?v=t6";

export const SCENE_W = 960, SCENE_H = 540, CELL = 256;
let M = { items: [], hotspots: {} };
const byFile = new Map();
const frameIndex = new Map(); // tên frame chân dung ⇒ [{item, f}]
const clueIndex = new Map(); // id vật chứng ⇒ [{item, f}] (assets/clues-<vụ>.webp, ô 96, lưới 2×)
export function setManifest(m) {
  M = m && typeof m === "object" ? m : { items: [], hotspots: {} };
  byFile.clear(); frameIndex.clear(); clueIndex.clear();
  for (const it of M.items || []) {
    if (!it?.filename) continue;
    byFile.set(it.filename, it);
    if (/^assets\/clues-/.test(it.filename)) for (const [name, f] of Object.entries(it.frames || {})) { if (!clueIndex.has(name)) clueIndex.set(name, []); clueIndex.get(name).push({ it, f }); }
    if (/^assets\/portraits-/.test(it.filename)) for (const [name, f] of Object.entries(it.frames || {})) {
      if (!frameIndex.has(name)) frameIndex.set(name, []);
      frameIndex.get(name).push({ it, f });
    }
  }
}
export const hasFile = (file) => byFile.has(file);
export const dpr = () => globalThis.devicePixelRatio || 1;

/** Hệ số css cho ảnh `fileW` px sao cho phủ ≤ maxW×maxH và px thiết bị / px file là bội 0,5. Không vừa nổi bội nhỏ nhất thì trả hệ số mượt. */
export function crispScale(fileW, fileH, maxW, maxH) {
  const d = dpr();
  const m = Math.floor(Math.min(maxW / fileW, maxH / fileH) * d * 2);
  if (m >= 1) return { k: m / 2 / d, crisp: true };
  return { k: Math.min(maxW / fileW, maxH / fileH), crisp: false };
}
/** Cỡ chân dung css ≤ want: bội 128 px thiết bị (0,5 × ô 256). Dưới 1× thì lọc mượt (ảnh HD lưới 1× rơi điểm). */
export function portraitSize(want) {
  const d = dpr(), n = Math.floor((want * d) / 128);
  if (n < 1) return { size: Math.round(want), smooth: true }; // ảnh nhỏ (ảnh đại diện): lọc mượt
  return { size: (n * 128) / d, smooth: n < 2 };
}

// ---------- màu theo người ----------
const CAST_LOOK = {
  me: { shirt: "#8a6a3e", hair: "#3a2414", skin: "#d9a477", bg: "#2a3a4a", hat: "#5a3a22" },
  teo: { shirt: "#f2c232", hair: "#2a1a10", skin: "#e0ae80", bg: "#2f4a3a", spiky: true },
  batu: { shirt: "#c4507a", hair: "#a8a8a8", skin: "#d8a27a", bg: "#4a2f3a", glasses: true, floral: true },
  chuba: { shirt: "#3f7a5a", hair: "#2a2a2a", skin: "#c99064", bg: "#24384a", cap: "#2f5a46" },
  narr: { shirt: "#555", hair: "#333", skin: "#aaa", bg: "#222" },
};
const SHIRTS = ["#3a7bd5", "#e0483d", "#3fae4a", "#9a5ac8", "#e07f3a", "#2f8f7f", "#c8a03a", "#d0607a", "#5a6ad0", "#7a8a3a"];
const HAIRS = ["#2a1a10", "#3a2414", "#1a1a1a", "#5a3a22", "#a04a6a", "#d080a0", "#6a4a2a", "#20242e", "#7a3a1a"];
const SKINS = ["#e8b48a", "#d9a477", "#c99064", "#b87c50", "#f0c49c"];
const BGS = ["#2a3a4a", "#3a2a3a", "#2a3a32", "#3a3324", "#24304a", "#402a2a"];
const hash = (s) => { let x = 2166136261; for (const ch of String(s)) x = Math.imul(x ^ ch.codePointAt(0), 16777619); return x >>> 0; };
export function lookOf(pid) {
  if (CAST_LOOK[pid]) return CAST_LOOK[pid];
  const n = hash(pid);
  return { shirt: SHIRTS[n % SHIRTS.length], hair: HAIRS[(n >>> 4) % HAIRS.length], skin: SKINS[(n >>> 8) % SKINS.length], bg: BGS[(n >>> 12) % BGS.length], glasses: (n >>> 16) % 5 === 0, long: (n >>> 18) % 3 === 0 };
}
export const accentOf = (pid) => lookOf(pid).shirt;

// ---------- chân dung ----------
// Chân dung dùng lại từ vụ khác: people.<pid>.sheet = "<id vụ cũ>" ⇒ lấy frame từ portraits-<id vụ cũ>.webp. Đăng ký lúc nạp vụ.
const sheetOf = new Map(); // "caseId|pid" ⇒ id vụ có sheet
export function registerSheets(c) {
  if (!c?.id || !c.people) return;
  for (const [pid, p] of Object.entries(c.people)) if (p && typeof p.sheet === "string" && p.sheet) sheetOf.set(c.id + "|" + pid, p.sheet);
}
export const portraitSheet = (pid, caseId = "") => sheetOf.get(caseId + "|" + pid) || caseId;
/** Frame thật: ưu tiên sheet ghi trong people.<pid>.sheet (không có thì sheet của vụ), rồi sheet chung (cast), rồi bất kỳ sheet chân dung nào. Mood thiếu ⇒ neutral. */
export function portraitFrame(pid, mood = "neutral", caseId = "") {
  const own = `assets/portraits-${portraitSheet(pid, caseId)}.webp`, cur = `assets/portraits-${caseId}.webp`;
  for (const name of [`${pid}-${mood}`, `${pid}-neutral`]) {
    const list = frameIndex.get(name); if (!list) continue;
    const pick = list.find((x) => x.it.filename === own) || list.find((x) => x.it.filename === cur) || list.find((x) => x.it.filename === "assets/portraits-cast.webp") || list[0];
    return { url: pick.it.filename, sw: pick.it.dimensions[0], sh: pick.it.dimensions[1], x: pick.f.rect[0], y: pick.f.rect[1], w: pick.f.rect[2], h: pick.f.rect[3] };
  }
  return null;
}
const phCache = new Map();
/** Chân dung vẽ thay 64×64 (hiện ×2n nên luôn nét). */
export function placeholderPortrait(pid, mood = "neutral", name = "") {
  const key = pid + "|" + mood + "|" + name;
  if (phCache.has(key)) return phCache.get(key);
  const L = lookOf(pid), cv = document.createElement("canvas");
  cv.width = cv.height = 64;
  const g = cv.getContext("2d");
  const px = (c, x, y, w = 1, hh = 1) => { g.fillStyle = c; g.fillRect(x, y, w, hh); };
  // nền ô kẻ so le (dither) + khung
  px(L.bg, 0, 0, 64, 64);
  for (let y = 0; y < 64; y++) for (let x = (y % 2); x < 64; x += 2) if (y > 40 || (x + y) % 4 === 0) px("rgba(0,0,0,.18)", x, y);
  // vai + áo
  px("#0a0807", 10, 47, 44, 17); px(L.shirt, 11, 48, 42, 16);
  for (let y = 48; y < 64; y += 2) px("rgba(0,0,0,.14)", 11, y, 42, 1);
  if (L.floral) for (let i = 0; i < 9; i++) px("#ffd0e0", 13 + ((i * 11) % 38), 50 + ((i * 7) % 12), 2, 2);
  // cổ + đầu
  px("#0a0807", 27, 40, 10, 9); px(L.skin, 28, 41, 8, 8);
  const head = [[24, 13, 16], [21, 14, 22], [20, 15, 24], [19, 16, 26]];
  px("#0a0807", 20, 13, 24, 1); px("#0a0807", 18, 15, 28, 26); px("#0a0807", 20, 41, 24, 2);
  px(L.skin, 19, 16, 26, 24); px(L.skin, 21, 14, 22, 2); px(L.skin, 21, 40, 22, 2);
  void head;
  // tóc
  px(L.hair, 19, 14, 26, 6); px(L.hair, 18, 16, 3, 10); px(L.hair, 43, 16, 3, 10);
  if (L.long) { px(L.hair, 16, 20, 4, 24); px(L.hair, 44, 20, 4, 24); }
  if (L.spiky) for (let i = 0; i < 6; i++) { px(L.hair, 19 + i * 4, 9, 3, 5); px(L.hair, 20 + i * 4, 7, 1, 2); }
  if (L.hat) { px("#0a0807", 15, 9, 32, 7); px(L.hat, 16, 10, 30, 5); px(L.hat, 40, 8, 5, 3); }
  if (L.cap) { px("#0a0807", 17, 10, 30, 6); px(L.cap, 18, 11, 28, 4); px(L.cap, 40, 15, 10, 2); px("#ffc94a", 30, 12, 3, 2); }
  // mặt theo mood
  const eyeY = 26, ex1 = 24, ex2 = 35;
  const ink = "#1a1210";
  if (mood === "shock") { for (const ex of [ex1, ex2]) { px("#fff", ex - 1, eyeY - 1, 5, 5); px(ink, ex + 1, eyeY + 1, 2, 2); } px(ink, 29, 34, 6, 5); px("#7a2a2a", 30, 35, 4, 3); }
  else {
    for (const ex of [ex1, ex2]) px(ink, ex, eyeY, 3, mood === "happy" ? 1 : 3);
    if (mood === "angry") { px(ink, 22, 22, 3, 1); px(ink, 25, 23, 3, 1); px(ink, 36, 23, 3, 1); px(ink, 39, 22, 3, 1); px(ink, 28, 35, 8, 1); px("#e0483d", 40, 17, 3, 1); px("#e0483d", 41, 16, 1, 3); }
    else if (mood === "happy") { px(ink, 27, 33, 1, 1); px(ink, 28, 34, 8, 1); px(ink, 36, 33, 1, 1); px("#e88a8a", 21, 30, 3, 2); px("#e88a8a", 40, 30, 3, 2); }
    else if (mood === "smug") { px(ink, 23, 22, 4, 1); px(ink, 35, 21, 4, 1); px(ink, 28, 35, 6, 1); px(ink, 34, 34, 2, 1); }
    else if (mood === "nervous") { px(ink, 28, 35, 2, 1); px(ink, 30, 34, 2, 1); px(ink, 32, 35, 2, 1); px(ink, 34, 34, 2, 1); px("#9fd3e6", 45, 18, 3, 4); px("#d6f1fa", 45, 18, 1, 2); px("#9fd3e6", 46, 16, 1, 2); }
    else px(ink, 29, 35, 6, 1);
  }
  if (L.glasses) { px("#5a5a5a", 22, 24, 7, 1); px("#5a5a5a", 33, 24, 7, 1); px("#5a5a5a", 22, 29, 7, 1); px("#5a5a5a", 33, 29, 7, 1); px("#5a5a5a", 29, 26, 4, 1); px("#5a5a5a", 22, 24, 1, 6); px("#5a5a5a", 39, 24, 1, 6); px("#5a5a5a", 28, 24, 1, 6); px("#5a5a5a", 33, 24, 1, 6); }
  // chữ cái đầu trên áo (nhị phân hoá alpha ⇒ chữ pixel cứng)
  const ch = (name || pid).trim().charAt(0).toUpperCase();
  if (ch && pid !== "narr") {
    const t = document.createElement("canvas"); t.width = t.height = 16;
    const tg = t.getContext("2d"); tg.fillStyle = "#fff"; tg.font = "800 13px 'Be Vietnam Pro', system-ui, sans-serif"; tg.textAlign = "center"; tg.textBaseline = "middle"; tg.fillText(ch, 8, 9);
    const d = tg.getImageData(0, 0, 16, 16).data;
    px("#0a0807", 25, 49, 14, 14); px("#f4ead2", 26, 50, 12, 12);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (d[(y * 16 + x) * 4 + 3] > 110) { const X = 24 + x, Y = 48 + y; if (X >= 26 && X < 38 && Y >= 50 && Y < 62) px("#1d1a16", X, Y); }
  }
  // viền khung
  g.strokeStyle = "#0a0807"; g.lineWidth = 2; g.strokeRect(1, 1, 62, 62);
  const url = cv.toDataURL();
  phCache.set(key, url);
  return url;
}

/** Phần tử chân dung (div nền sprite). want = cỡ css mong muốn. */
export function portraitEl(pid, mood, caseId, want, name = "", cls = "") {
  const { size, smooth } = portraitSize(want);
  const el = h("div.portrait" + (cls ? "." + cls : ""), { data: { pid, mood: mood || "neutral" }, role: "img", "aria-label": name || pid });
  setPortrait(el, pid, mood, caseId, size, smooth, name);
  return el;
}
export function setPortrait(el, pid, mood, caseId, size, smooth, name = "") {
  const f = portraitFrame(pid, mood, caseId), st = el.style;
  st.width = st.height = size + "px";
  el.dataset.mood = mood || "neutral";
  if (f) {
    const k = size / CELL;
    st.backgroundImage = `url("${f.url}")`;
    st.backgroundSize = `${f.sw * k}px ${f.sh * k}px`;
    st.backgroundPosition = `${-f.x * k}px ${-f.y * k}px`;
    el.classList.toggle("smooth", smooth);
    el.classList.remove("ph");
  } else {
    st.backgroundImage = `url("${placeholderPortrait(pid, mood, name)}")`;
    st.backgroundSize = `${size}px ${size}px`; st.backgroundPosition = "0 0";
    el.classList.toggle("smooth", (size * dpr()) % 32 !== 0); el.classList.add("ph");
  }
}

// ---------- cảnh ----------
export const sceneFile = (caseId, scene) => `assets/scenes/${caseId}/${scene}.webp`;
const PALS = [
  { wall: "#2a3448", wall2: "#222b3c", floor: "#3a3128", floor2: "#2e271f", lamp: "#ffc94a" },
  { wall: "#3a2e3e", wall2: "#2f2533", floor: "#2c3a36", floor2: "#23302c", lamp: "#ffd47a" },
  { wall: "#2e3a32", wall2: "#25302a", floor: "#3c3326", floor2: "#30291f", lamp: "#ffe9a8" },
  { wall: "#3e3326", wall2: "#33291e", floor: "#283040", floor2: "#202736", lamp: "#ffc94a" },
];
const PROP = ["#8a5a2b", "#5a7a8a", "#7a4a5a", "#4a7a5a", "#8a7a4a", "#5a5a8a", "#9a6a3a"];
const sceneCache = new Map();
/** Cảnh vẽ thay 480×270 (hiện ×2 lưới cảnh). rects = vùng điểm soi (px cảnh 960×540) để vẽ đồ vật giả. */
export function placeholderScene(seedKey, rects = [], kind = "scene") {
  const key = seedKey + "|" + kind + "|" + rects.map((r) => r.join(",")).join(";");
  if (sceneCache.has(key)) return sceneCache.get(key);
  const cv = document.createElement("canvas"); cv.width = 480; cv.height = 270;
  const g = cv.getContext("2d"), n = hash(seedKey), P = PALS[n % PALS.length];
  const px = (c, x, y, w = 1, hh = 1) => { g.fillStyle = c; g.fillRect(x, y, w, hh); };
  const dither = (c, x0, y0, w, hh, every = 2) => { for (let y = y0; y < y0 + hh; y++) for (let x = x0 + (y % 2); x < x0 + w; x += every) px(c, x, y); };
  if (kind === "title" || kind === "map" || kind === "map2") return drawSpecial(cv, g, px, dither, kind, key);
  const horizon = 170;
  px(P.wall, 0, 0, 480, horizon); dither(P.wall2, 0, 0, 480, 60, 2); dither(P.wall2, 0, 60, 480, 40, 4);
  for (let x = 0; x < 480; x += 32) px("rgba(0,0,0,.18)", x, 0, 1, horizon); // khe tường
  px(P.floor, 0, horizon, 480, 100); dither(P.floor2, 0, horizon + 50, 480, 50, 2);
  for (let y = horizon + 10; y < 270; y += 18) px("rgba(0,0,0,.2)", 0, y, 480, 1);
  px("#0a0807", 0, horizon, 480, 2);
  // đèn treo + quầng (dither, không gradient)
  const lx = 60 + (n % 300);
  px("#0a0807", lx, 0, 2, 26); px(P.lamp, lx - 6, 26, 14, 5);
  for (let r = 0; r < 4; r++) dither("rgba(255,201,74,.10)", lx - 30 - r * 12, 31, 62 + r * 24, 30 + r * 10, 2 + r);
  // đồ vật giả ở vị trí điểm soi
  rects.forEach((r, i) => {
    const [x, y, w, hh] = r.map((v) => Math.round(v / 2));
    const c = PROP[(n + i * 3) % PROP.length];
    px("rgba(0,0,0,.35)", x + 3, y + hh - 2, w, 4); // bóng
    px("#0a0807", x - 1, y - 1, w + 2, hh + 2); px(c, x, y, w, hh);
    px("rgba(255,255,255,.18)", x, y, w, 2); px("rgba(0,0,0,.25)", x, y + hh - 3, w, 3);
    dither("rgba(0,0,0,.14)", x, y + 2, w, hh - 5, 3);
  });
  const url = cv.toDataURL(); sceneCache.set(key, url); return url;
}
/** Chữ pixel cứng: vẽ chữ lên canvas phụ rồi nhị phân hoá alpha. */
function pixelText(g, text, cx, cy, size, color) {
  const t = document.createElement("canvas"); t.width = size * text.length; t.height = size * 2;
  const tg = t.getContext("2d"); tg.fillStyle = "#fff"; tg.font = `800 ${size}px 'Be Vietnam Pro', system-ui, sans-serif`; tg.textAlign = "center"; tg.textBaseline = "middle"; tg.fillText(text, t.width / 2, t.height / 2 + 1);
  const d = tg.getImageData(0, 0, t.width, t.height).data;
  g.fillStyle = color;
  for (let y = 0; y < t.height; y++) for (let x = 0; x < t.width; x++) if (d[(y * t.width + x) * 4 + 3] > 120) g.fillRect(Math.round(cx - t.width / 2 + x), Math.round(cy - t.height / 2 + y), 1, 1);
}
function drawSpecial(cv, g, px, dither, kind, key) {
  if (kind === "title") {
    px("#141b28", 0, 0, 480, 270); dither("#1b2433", 0, 0, 480, 120, 2);
    // nhà hai bên hẻm
    const blocks = [[0, 30, 120, 240, "#232c3c"], [110, 70, 70, 200, "#1e2534"], [330, 50, 80, 220, "#1e2534"], [400, 20, 80, 250, "#232c3c"]];
    for (const [x, y, w, hh, c] of blocks) {
      px("#0a0807", x - 1, y - 1, w + 2, hh + 2); px(c, x, y, w, hh);
      for (let wy = y + 12; wy < y + hh - 50; wy += 26) for (let wx = x + 10; wx < x + w - 14; wx += 22) {
        const lit = (wx * 7 + wy * 3) % 5 < 2;
        px("#0a0807", wx - 1, wy - 1, 12, 16); px(lit ? "#ffc94a" : "#2f3a4f", wx, wy, 10, 14); if (lit) px("#ffe9a8", wx, wy, 10, 3);
      }
    }
    // mặt đường ướt + phản chiếu
    px("#1a2230", 0, 220, 480, 50); for (let x = 0; x < 480; x += 3) if ((x * 13) % 7 < 2) px("#2f8f7f", x, 230 + (x % 30), 1, 2);
    px("#ffc94a", 250, 240, 2, 26); dither("rgba(255,201,74,.35)", 236, 238, 30, 30, 3);
    // cột đèn
    px("#0a0807", 248, 90, 6, 140); px("#3a3a44", 249, 90, 4, 140); px("#0a0807", 236, 84, 30, 8); px("#ffc94a", 240, 92, 22, 4);
    for (let r = 0; r < 4; r++) dither("rgba(255,201,74,.12)", 220 - r * 14, 96 + r * 4, 62 + r * 28, 40 + r * 22, 2 + r);
    // biển văn phòng
    px("#0a0807", 300, 120, 92, 30); px("#5a1410", 302, 122, 88, 26); px("#c8382e", 302, 122, 88, 3);
    pixelText(g, "THÁM TỬ", 346, 136, 13, "#ffe9a8");
    // hai bóng người
    for (const [x, hh, hat] of [[200, 58, true], [222, 50, false]]) {
      px("#0a0807", x, 230 - hh, 14, hh); px("#0a0807", x + 2, 230 - hh - 12, 10, 12);
      if (hat) px("#0a0807", x - 1, 230 - hh - 15, 13, 4); else for (let i = 0; i < 4; i++) px("#0a0807", x + 2 + i * 3, 230 - hh - 15, 1, 3);
    }
    // mưa
    for (let i = 0; i < 160; i++) { const x = (i * 97) % 480, y = (i * 53) % 260; px("rgba(159,211,230,.45)", x, y, 1, 4); }
  } else if (kind === "map2") drawMarket(g, px, dither);
  else {
    px("#2e3a2c", 0, 0, 480, 270); dither("#283326", 0, 0, 480, 270, 3);
    for (const y of [60, 140, 210]) { px("#0a0807", 0, y - 1, 480, 14); px("#b9ad93", 0, y, 480, 12); dither("#a39780", 0, y, 480, 12, 3); }
    for (const x of [90, 240, 390]) { px("#0a0807", x - 1, 0, 14, 270); px("#b9ad93", x, 0, 12, 270); }
    const roofs = ["#7a3a2a", "#3a5a7a", "#6a5a3a", "#4a6a4a", "#7a4a6a", "#5a4a3a"];
    let i = 0;
    for (const [y0, y1] of [[8, 54], [76, 134], [156, 204], [226, 266]]) for (const [x0, x1] of [[8, 86], [106, 236], [256, 386], [406, 474]]) {
      const c = roofs[i++ % roofs.length];
      px("#0a0807", x0 - 1, y0 - 1, x1 - x0 + 2, y1 - y0 + 2); px(c, x0, y0, x1 - x0, y1 - y0);
      for (let y = y0 + 3; y < y1; y += 4) px("rgba(0,0,0,.18)", x0, y, x1 - x0, 1);
      px("rgba(255,255,255,.12)", x0, y0, x1 - x0, 2);
    }
  }
  const url = cv.toDataURL(); sceneCache.set(key, url); return url;
}

/** Bản đồ mùa 2 vẽ thay (480×270, hiện ×2): khu chợ nhìn từ trên xuống — đường lớn trên cùng, dãy sạp mái bạt sọc, lối đi lát gạch, sân khấu, nhà hoang. */
function drawMarket(g, px, dither) {
  px("#3a3324", 0, 0, 480, 270); dither("#332c1f", 0, 0, 480, 270, 3);
  // đường lớn đầu hẻm + vạch kẻ
  px("#0a0807", 0, 0, 480, 46); px("#2a2f38", 0, 0, 480, 44); dither("#252a32", 0, 0, 480, 44, 3);
  for (let x = 6; x < 480; x += 28) px("#e9e1c8", x, 21, 14, 2);
  px("#0a0807", 0, 44, 480, 2); px("#8a8270", 0, 46, 480, 4);
  // lối đi lát gạch (dọc + ngang)
  const paths = [[0, 128, 480, 16], [0, 210, 480, 14], [150, 50, 16, 220], [318, 50, 16, 220]];
  for (const [x, y, w, hh] of paths) { px("#0a0807", x - 1, y - 1, w + 2, hh + 2); px("#b9ad93", x, y, w, hh); for (let yy = y; yy < y + hh; yy += 4) for (let xx = x + ((yy / 4) % 2) * 3; xx < x + w; xx += 6) px("#a39780", xx, yy, 1, 3); }
  // dãy sạp mái bạt sọc
  const AW = [["#c8382e", "#efe2c0"], ["#2f8f7f", "#e9e1c8"], ["#3a5a9a", "#e9e1c8"], ["#c9a03a", "#5a3a08"], ["#9a5ac8", "#efe2c0"], ["#e07f3a", "#fff1d8"]];
  let i = 0;
  for (const [y0, y1] of [[56, 122], [150, 204], [230, 266]]) for (const [x0, x1] of [[8, 144], [172, 312], [340, 474]]) {
    const [a, b] = AW[i++ % AW.length];
    px("#0a0807", x0 - 1, y0 - 1, x1 - x0 + 2, y1 - y0 + 2);
    const cols = Math.max(1, Math.round((x1 - x0) / 34)), step = Math.floor((x1 - x0 - 2) / cols);
    for (let k = 0; k < cols; k++) {
      const sx = x0 + 2 + k * step, sw = step - 4;
      px("#0a0807", sx - 1, y0 + 1, sw + 2, y1 - y0 - 2);
      for (let s = 0; s < sw; s += 6) px(s % 12 ? b : a, sx + s, y0 + 2, Math.min(6, sw - s), y1 - y0 - 4);
      px("rgba(0,0,0,.28)", sx, y1 - 6, sw, 3); px("rgba(255,255,255,.18)", sx, y0 + 2, sw, 2);
    }
  }
  // đèn dây (bóng vàng) dọc lối đi ngang
  for (let x = 4; x < 480; x += 12) { px("#0a0807", x, 126, 3, 3); px("#ffc94a", x + 1, 127, 1, 1); }
  for (let x = 8; x < 480; x += 12) { px("#0a0807", x, 208, 3, 3); px("#ffe9a8", x + 1, 209, 1, 1); }
  // sân khấu karaoke (giữa) + nhà hoang số 13 (góc dưới phải, tối)
  px("#0a0807", 196, 152, 92, 50); px("#5a1410", 198, 154, 88, 46); px("#c8382e", 198, 154, 88, 4); dither("#3a0c08", 198, 160, 88, 40, 3);
  pixelText(g, "♪", 242, 178, 14, "#ffe9a8");
  px("#0a0807", 400, 230, 66, 38); px("#2a2530", 402, 232, 62, 36); dither("#1a161e", 402, 232, 62, 36, 2); pixelText(g, "13", 433, 249, 12, "#9fd3e6");
  // biển chợ
  px("#0a0807", 186, 4, 108, 26); px("#5a1410", 188, 6, 104, 22); px("#c8382e", 188, 6, 104, 3); pixelText(g, "CHỢ HẺM", 240, 18, 12, "#ffe9a8");
}

/** Toạ độ điểm soi (px cảnh 960×540): manifest.hotspots[file][id] → rect trong dữ liệu vụ → tự xếp lưới theo thứ tự trong danh sách đầy đủ. */
export function hotspotRect(file, h, index, total) {
  const m = M.hotspots?.[file]?.[h.id];
  if (Array.isArray(m) && m.length === 4) return { r: m, src: "manifest" };
  if (Array.isArray(h.rect) && h.rect.length === 4) return { r: h.rect, src: "case" };
  const cols = Math.min(4, Math.max(2, Math.ceil(Math.sqrt(total * 1.8)))), rows = Math.ceil(total / cols);
  const cw = SCENE_W / cols, ch = (SCENE_H - 120) / rows, col = index % cols, row = Math.floor(index / cols);
  const w = Math.min(190, cw - 40), hh = Math.min(130, ch - 30);
  return { r: [Math.round(col * cw + (cw - w) / 2), Math.round(100 + row * ch + (ch - hh) / 2), Math.round(w), Math.round(hh)], src: "grid" };
}
/** Chấm vụ trên bản đồ: manifest.hotspots[<file bản đồ>][caseId] (mùa 1 hem-map.webp, mùa 2 hem-map-2.webp). */
export const mapPin = (caseId, file = "assets/scenes/hem-map.webp") => M.hotspots?.[file]?.[caseId] || null;

// ---------- icon vật chứng ----------
/** Frame icon vật chứng (ưu tiên sheet của vụ). */
export function clueFrame(id, caseId = "") {
  const list = clueIndex.get(id); if (!list) return null;
  const pick = list.find((x) => x.it.filename === `assets/clues-${caseId}.webp`) || list[0];
  return { url: pick.it.filename, sw: pick.it.dimensions[0], sh: pick.it.dimensions[1], x: pick.f.rect[0], y: pick.f.rect[1], w: pick.f.rect[2], h: pick.f.rect[3] };
}
/** Cỡ css cho icon 96 px lưới 2×: px thiết bị / px file là bội 0,5 (ô 2×2 phủ số nguyên px). */
export function clueSize(want) {
  const d = dpr(), m = Math.max(1, Math.round((want * d) / 48));
  return (m * 48) / d;
}
export function clueSprite(id, caseId, want) {
  const f = clueFrame(id, caseId); if (!f) return null;
  const size = clueSize(want), k = size / f.w;
  return h("span.cicon-img", { "aria-hidden": "true", style: { width: size + "px", height: size + "px", backgroundImage: `url("${f.url}")`, backgroundSize: `${f.sw * k}px ${f.sh * k}px`, backgroundPosition: `${-f.x * k}px ${-f.y * k}px` } });
}
