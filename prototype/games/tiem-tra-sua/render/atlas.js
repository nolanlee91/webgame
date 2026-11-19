// Atlas đọc từ data/asset-manifest.json (bản chép của docs/tiem-tra-sua/asset-manifest.json — test kiểm khớp).
// Mọi sprite trong game lấy rect + anchor + clip từ đây. Bí danh ngắn (SHEETS) để code dễ đọc.
export const SHEETS = {
  scene: "assets/shop-scene.webp", counter: "assets/shop-counter-foreground.webp", street: "assets/street-background.webp",
  equip: "assets/equipment.webp", chars: "assets/characters.webp", portraits: "assets/portraits.webp",
  cupui: "assets/cup-states-and-ingredients.webp", cupfx: "assets/cup-fx.webp", decor: "assets/decor-and-pantry.webp",
  motion: "assets/character-motion-sample.webp", cup: "assets/cup-layers.webp", lidfx: "assets/lid-and-ice-fx.webp",
  fixtures: "assets/shop-fixtures.webp", icons: "assets/ui-icons.webp", faces: "assets/portrait-expressions.webp",
  barista: "assets/barista-actions.webp", walks: "assets/customer-walk-cycles.webp", reactions: "assets/customer-reactions.webp",
  actions: "assets/customer-actions.webp", bfx: "assets/barista-fx.webp", journal: "assets/journal-card.png",
  upgrades: "assets/upgrades.webp", pantry: "assets/pantry-supply.webp", tiles: "assets/shop-tiles.webp",
  bscene: "assets/barista-scene.webp", // Cần Codex #7 (chưa có file: atlas trả null, cảnh dùng dáng đứng characters.webp)
};

/** Sheet sắp có (Codex đang vẽ): không bắt buộc có trong manifest, game không tải nếu chưa có. */
export const OPTIONAL_SHEETS = new Set(["bscene"]);

export function makeAtlas(manifest, base = "") {
  const byFile = new Map();
  for (const it of manifest.items || []) if (it.filename.startsWith("assets/")) byFile.set(it.filename, it);
  const frame = (alias, name) => {
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
  const f = ref && atlas.frame(ref[0], ref[1]);
  if (!f) return el;
  const c = crop || [0, 0, f.w, f.h];
  // ảnh lớn (chân dung…): làm tròn cỡ để ô tranh 2×2 phủ số nguyên px thiết bị; icon nhỏ giữ đúng cỡ bố cục
  const scale = px >= 96 ? crisp(px / c[3]) : px / c[3];
  const st = el.style;
  st.width = c[2] * scale + "px"; st.height = c[3] * scale + "px";
  // nhỏ hơn nửa cỡ gốc thì pixel cứng rơi điểm ⇒ lọc mượt
  if (scale * dpr() < 0.5) st.imageRendering = "auto";
  st.backgroundImage = `url("${f.url}")`;
  st.backgroundSize = `${f.sw * scale}px ${f.sh * scale}px`;
  st.backgroundPosition = `${-(f.x + c[0]) * scale}px ${-(f.y + c[1]) * scale}px`;
  return el;
}
