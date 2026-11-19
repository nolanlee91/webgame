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
};

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
// Lưới bắt điểm ảnh thiết bị: số px thiết bị trên 1 px cảnh (k·devicePixelRatio). 0 = không bắt.
let SNAP = 0;
export function setSnap(v) { SNAP = v > 0 ? v : 0; }
const snap = (v) => (SNAP ? Math.round(v * SNAP) / SNAP : v);

export function placeAt(el, f, x, y, scale = 1) {
  if (!f) return;
  el.style.left = snap(x - f.ax * scale) + "px";
  el.style.top = snap(y - f.ay * scale) + "px";
}
/** Phần tử icon nhỏ (UI) từ [alias, frame], cao `px` điểm ảnh. Có thể cắt vùng (crop: [x,y,w,h] trong frame). */
export function icon(atlas, ref, px = 40, cls = "ico", crop = null) {
  const el = document.createElement("i");
  el.className = cls;
  el.setAttribute("aria-hidden", "true");
  const f = ref && atlas.frame(ref[0], ref[1]);
  if (!f) return el;
  const c = crop || [0, 0, f.w, f.h];
  const scale = px / c[3];
  const st = el.style;
  st.width = c[2] * scale + "px"; st.height = px + "px";
  // thu nhỏ dưới 1:1 điểm ảnh thiết bị ⇒ lọc mượt (pixel cứng bị rơi điểm, trông nhòe)
  if (scale * (globalThis.devicePixelRatio || 1) < 0.999) st.imageRendering = "auto";
  st.backgroundImage = `url("${f.url}")`;
  st.backgroundSize = `${f.sw * scale}px ${f.sh * scale}px`;
  st.backgroundPosition = `${-(f.x + c[0]) * scale}px ${-(f.y + c[1]) * scale}px`;
  return el;
}
