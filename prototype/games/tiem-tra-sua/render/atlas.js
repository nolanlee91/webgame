// Atlas đọc từ data/asset-manifest.json (bản chép của docs/tiem-tra-sua/asset-manifest.json — test kiểm khớp).
// Mọi sprite trong game lấy rect + anchor + clip từ đây. Bí danh ngắn (SHEETS) để code dễ đọc.
export const SHEETS = {
  scene: "assets/shop-scene.webp", counter: "assets/shop-counter-foreground.webp", street: "assets/street-background.webp",
  equip: "assets/equipment.webp", chars: "assets/characters.webp", portraits: "assets/portraits.webp",
  cupui: "assets/cup-states-and-ingredients.webp", cupfx: "assets/cup-fx.webp", decor: "assets/decor-and-pantry.webp",
  motion: "assets/character-motion-sample.webp", cup: "assets/cup-layers.webp", lidfx: "assets/lid-and-ice-fx.webp",
  fixtures: "assets/shop-fixtures.webp", icons: "assets/ui-icons.webp", faces: "assets/portrait-expressions.webp",
  barista: "assets/barista-actions.webp", walks: "assets/customer-walk-cycles.webp", reactions: "assets/customer-reactions.webp",
  actions: "assets/customer-actions.webp", bfx: "assets/barista-fx.webp", journal: "assets/journal-card.webp",
  upgrades: "assets/upgrades.webp", pantry: "assets/pantry-supply.webp", tiles: "assets/shop-tiles.webp",
  bscene: "assets/barista-scene.webp", // Cần Codex #7 (chưa có file: atlas trả null, cảnh dùng dáng đứng characters.webp)
  weather: "assets/weather-fx.webp", // Cần Codex: mưa / chớp / cúp điện (ô 640×360, vẽ ×2 phủ cảnh). Chưa có ⇒ lớp CSS
};

/** Sheet sắp có (Codex đang vẽ): không bắt buộc có trong manifest, game không tải nếu chưa có. */
export const OPTIONAL_SHEETS = new Set(["bscene", "weather"]);
/** Sheet lớn chỉ dùng ở một màn riêng (hội thoại, thời tiết, thẻ Nhật Ký, ảnh phố màn chào): KHÔNG tải nền.
 *  Trình duyệt tải khi màn đó hiện (nền CSS / <img>), game.js tải trước đúng sheet của màn kế tiếp (prefetch). */
export const LAZY_SHEETS = new Set(["assets/portrait-expressions-hd.webp", "assets/portrait-expressions.webp", "assets/drama-portraits-hd.webp", "assets/weather-fx.webp", "assets/journal-card.webp", "assets/street-background.webp"]);
/** Sheet chỉ cần khi đã vào tiệm (khách, quầy pha, hiệu ứng, đồ nâng cấp): người chơi mới đang ở màn chào thì chưa tải,
 *  bấm "Nhận tiệm" mới tải trước; người chơi cũ (đã qua màn chào) tải cùng màn đầu như trước. */
export const DEFER_SHEETS = new Set(["assets/customer-walk-cycles.webp", "assets/customer-reactions.webp", "assets/customer-actions.webp",
  "assets/character-motion-sample.webp", "assets/barista-actions-hd.webp", "assets/barista-actions.webp", "assets/cup-layers-hd.webp", "assets/cup-layers.webp",
  "assets/cup-fx.webp", "assets/lid-and-ice-fx.webp", "assets/barista-fx.webp", "assets/upgrades.webp", "assets/decor-and-pantry.webp",
  "assets/shop-fixtures.webp", "assets/characters.webp"]);

/** Tải một ảnh (một lần cho mỗi url). Dùng cho màn đầu, tải trước màn kế tiếp, và trạng thái "đang tải" của icon. */
const READY = new Map(), LOADED = new Set();
export function preload(url) {
  let p = READY.get(url);
  if (!p) {
    p = new Promise((ok) => { const i = new Image(); i.onload = () => { LOADED.add(url); ok(true); }; i.onerror = () => ok(false); i.src = url; });
    READY.set(url, p);
  }
  return p;
}
export const isLoaded = (url) => LOADED.has(url);

/** Bản cận cảnh vẽ lưới 1× (gấp đôi chi tiết, toạ độ đúng ×2 bản thường). Có frame cùng tên thì dùng bản HD,
 *  trả về toạ độ đã quy về cỡ bản thường ⇒ mọi chỗ gọi giữ nguyên kích thước, chỉ mịn hơn. */
export const HD_SHEETS = {
  barista: "assets/barista-actions-hd.webp", cup: "assets/cup-layers-hd.webp",
  portraits: "assets/portraits-hd.webp", faces: "assets/portrait-expressions-hd.webp",
  drama: "assets/drama-portraits-hd.webp", // Cần Codex: chân dung NPC Drama có tên (chỉ có bản HD; chưa có ⇒ mượn vai cũ)
};

export function makeAtlas(manifest, base = "", { hd = true } = {}) {
  const byFile = new Map();
  for (const it of manifest.items || []) if (it.filename.startsWith("assets/")) byFile.set(it.filename, it);
  // lowRes: hình hiện nhỏ (bản HD sẽ thu dưới 0,75 px thiết bị mỗi px file ⇒ chi tiết HD không thấy được) ⇒ dùng bản thường nếu có frame
  const frame = (alias, name, lowRes = false) => {
    if (lowRes && HD_SHEETS[alias]) { const p = plain(alias, name); if (p) return p; }
    const hf = hd && HD_SHEETS[alias], hi = hf && byFile.get(hf), g = hi?.frames?.[name];
    if (g) return { url: base + hf, hd: true, sw: hi.dimensions[0] / 2, sh: hi.dimensions[1] / 2, x: g.rect[0] / 2, y: g.rect[1] / 2, w: g.rect[2] / 2, h: g.rect[3] / 2, ax: g.anchor[0] / 2, ay: g.anchor[1] / 2 };
    return plain(alias, name);
  };
  const plain = (alias, name) => {
    const file = SHEETS[alias] || alias;
    const it = byFile.get(file);
    const f = it?.frames?.[name];
    if (!f) return null;
    return { url: base + file, sw: it.dimensions[0], sh: it.dimensions[1], x: f.rect[0], y: f.rect[1], w: f.rect[2], h: f.rect[3], ax: f.anchor[0], ay: f.anchor[1] };
  };
  const clip = (alias, name) => {
    const it = byFile.get(SHEETS[alias] || alias);
    const a = it?.animations?.[name];
    return a ? { frames: a.frames, fps: a.fps, loop: !!a.loop } : null;
  };
  const has = (alias, name) => !!frame(alias, name);
  const sheet = (alias) => byFile.get(SHEETS[alias] || alias) || null;
  return { frame, clip, has, sheet, base };
}

/** Gán sprite vào phần tử (nền CSS, pixel cứng). scale = px hiển thị / px atlas. */
export function paint(el, f, scale = 1) {
  if (!f) { el.style.backgroundImage = "none"; return; }
  const st = el.style;
  st.width = f.w * scale + "px";
  st.height = f.h * scale + "px";
  st.backgroundImage = `url("${f.url}")`;
  st.backgroundSize = `${f.sw * scale}px ${f.sh * scale}px`;
  st.backgroundPosition = `${-f.x * scale}px ${-f.y * scale}px`;
}
/** Đặt sprite theo điểm neo (toạ độ logic trong cảnh). */
// Toàn bộ tranh Codex vẽ trên lưới 2× (1 điểm ảnh tranh = ô 2×2 px file). Nét chỉ đều khi 1 ô tranh phủ số nguyên px thiết bị
// ⇒ hệ số hiển thị chọn sao cho scale·dpr·2 là số nguyên (crisp), và sprite cỡ gốc đặt đúng lưới 2 px của cảnh.
export const dpr = () => globalThis.devicePixelRatio || 1;
export function crisp(s) { const d = dpr() * 2; return Math.max(1, Math.round(s * d)) / d; }
let SNAP = 0;
export function setSnap(v) { SNAP = v > 0 ? v : 0; }
const snap = (v, scale) => (scale === 1 ? Math.round(v / 2) * 2 : SNAP ? Math.round(v * SNAP) / SNAP : v);

export function placeAt(el, f, x, y, scale = 1) {
  if (!f) return;
  el.style.left = snap(x - f.ax * scale, scale) + "px";
  el.style.top = snap(y - f.ay * scale, scale) + "px";
}
/** Phần tử icon nhỏ (UI) từ [alias, frame], cao `px` điểm ảnh. Có thể cắt vùng (crop: [x,y,w,h] trong frame). */
export function icon(atlas, ref, px = 40, cls = "ico", crop = null) {
  const el = document.createElement("i");
  el.className = cls;
  el.setAttribute("aria-hidden", "true");
  let f = ref && atlas.frame(ref[0], ref[1]);
  if (!f) return el;
  const c = crop || [0, 0, f.w, f.h];
  // ảnh lớn (chân dung…): làm tròn cỡ để ô tranh 2×2 phủ số nguyên px thiết bị; icon nhỏ giữ đúng cỡ bố cục
  const scale = px >= 96 ? crisp(px / c[3]) : px / c[3];
  // bản HD hiện ở < 1,5 px thiết bị mỗi px bản thường ⇒ chi tiết HD bị rơi điểm, bản thường (Codex tự thu) nét bằng hoặc hơn
  // và nhẹ gấp ~10 lần (vd chân dung màn chào 60 KB thay 604 KB trên điện thoại dpr 1).
  if (f.hd && scale * dpr() < 1.5) { const lo = atlas.frame(ref[0], ref[1], true); if (lo && !lo.hd && lo.w === f.w && lo.h === f.h) f = lo; }
  const st = el.style;
  st.width = c[2] * scale + "px"; st.height = c[3] * scale + "px";
  // nhỏ hơn nửa cỡ gốc thì pixel cứng rơi điểm ⇒ lọc mượt
  if (scale * dpr() < 0.5) st.imageRendering = "auto";
  st.backgroundImage = `url("${f.url}")`;
  st.backgroundSize = `${f.sw * scale}px ${f.sh * scale}px`;
  st.backgroundPosition = `${-(f.x + c[0]) * scale}px ${-(f.y + c[1]) * scale}px`;
  // sheet chưa tải xong (tải khi cần): ô giữ đúng cỡ, nền mờ nhấp nháy nhẹ tới khi ảnh về (CSS .ico.loading)
  if (globalThis.Image && !LOADED.has(f.url)) { el.classList.add("loading"); preload(f.url).then(() => el.classList.remove("loading")); }
  return el;
}
