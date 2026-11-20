// Atlas đọc từ data/asset-manifest.json (bản chép của docs/tiem-banh-mi/asset-manifest.json — test kiểm khớp).
// Mọi sprite lấy rect + anchor + clip từ đây theo tên frame trong docs/tiem-banh-mi/asset-spec.json. Bí danh ngắn (SHEETS) để code dễ đọc.
// Chưa có frame thật (asset Codex chưa giao) ⇒ frame() trả hình dự phòng vẽ bằng canvas (render/placeholder.js) đi đúng đường vẽ này,
// nên khi manifest có frame đúng tên thì game tự dùng ảnh thật, không cần sửa code. has() chỉ báo frame THẬT.
export const SHEETS = {
  shop: "assets/shop-scene.webp", shopFg: "assets/shop-counter-foreground.webp", cart: "assets/cart-scene.webp", cartFg: "assets/cart-foreground.webp",
  title: "assets/title-art.webp", chars: "assets/characters.webp", walks: "assets/customer-walk-cycles.webp", reactions: "assets/customer-reactions.webp",
  actions: "assets/customer-actions.webp", baker: "assets/baker-scene.webp", loaf: "assets/loaf-layers.webp", ovens: "assets/ovens.webp",
  equip: "assets/equipment.webp", ingr: "assets/ingredients.webp", bills: "assets/bills.webp", fx: "assets/fx.webp", icons: "assets/ui-icons.webp",
  fixtures: "assets/fixtures.webp", decor: "assets/decor.webp", weather: "assets/weather-fx.webp", journal: "assets/journal-card.webp",
};
/** Đợt 2 (asset-spec "wave": 2): không bắt buộc có trong manifest. */
export const OPTIONAL_SHEETS = new Set(["fixtures", "decor", "weather", "journal"]);
/** Sheet lớn không cần trong 10 giây đầu: tải nền sau khi tiệm hiện ra. */
export const LAZY_SHEETS = new Set(["assets/portrait-expressions-hd.webp", "assets/drama-portraits-hd.webp", "assets/weather-fx.webp", "assets/journal-card.webp", "assets/title-art.webp", "assets/shop-scene.webp", "assets/shop-counter-foreground.webp"]);
/** Bản cận cảnh vẽ lưới 1× (gấp đôi chi tiết, toạ độ đúng ×2 bản thường). Có frame cùng tên thì dùng bản HD, trả toạ độ quy về cỡ bản thường. */
export const HD_SHEETS = {
  loaf: "assets/loaf-layers-hd.webp", bakerhd: "assets/baker-actions-hd.webp", portraits: "assets/portraits-hd.webp",
  faces: "assets/portrait-expressions-hd.webp", drama: "assets/drama-portraits-hd.webp",
};

export function makeAtlas(manifest, base = "", { hd = true, fallback = null } = {}) {
  const byFile = new Map();
  for (const it of manifest.items || []) if (it.filename?.startsWith("assets/")) byFile.set(it.filename, it);
  const real = (alias, name) => {
    const hf = hd && HD_SHEETS[alias], hi = hf && byFile.get(hf), g = hi?.frames?.[name];
    if (g) return { url: base + hf, hd: true, sw: hi.dimensions[0] / 2, sh: hi.dimensions[1] / 2, x: g.rect[0] / 2, y: g.rect[1] / 2, w: g.rect[2] / 2, h: g.rect[3] / 2, ax: g.anchor[0] / 2, ay: g.anchor[1] / 2 };
    const file = SHEETS[alias] || alias;
    const it = byFile.get(file);
    const f = it?.frames?.[name];
    if (!f) return null;
    return { url: base + file, sw: it.dimensions[0], sh: it.dimensions[1], x: f.rect[0], y: f.rect[1], w: f.rect[2], h: f.rect[3], ax: f.anchor[0], ay: f.anchor[1] };
  };
  const frame = (alias, name) => real(alias, name) || (fallback ? fallback(alias, name) : null);
  const clip = (alias, name) => {
    const it = byFile.get(SHEETS[alias] || alias);
    const a = it?.animations?.[name];
    return a ? { frames: a.frames, fps: a.fps, loop: !!a.loop } : null;
  };
  const has = (alias, name) => !!real(alias, name);
  const sheet = (alias) => byFile.get(SHEETS[alias] || alias) || null;
  const placements = manifest.placements || {};
  return { frame, clip, has, sheet, base, placements };
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
// Toàn bộ tranh vẽ trên lưới 2× (1 điểm ảnh tranh = ô 2×2 px file). Nét chỉ đều khi 1 ô tranh phủ số nguyên px thiết bị
// ⇒ hệ số hiển thị chọn sao cho scale·dpr·2 là số nguyên (crisp), và sprite cỡ gốc đặt đúng lưới 2 px của cảnh (snap).
export const dpr = () => globalThis.devicePixelRatio || 1;
export function crisp(s) { const d = dpr() * 2; return Math.max(1, Math.round(s * d)) / d; }
let SNAP = 0;
export function setSnap(v) { SNAP = v > 0 ? v : 0; }
export const snap = (v, scale) => (scale === 1 ? Math.round(v / 2) * 2 : SNAP ? Math.round(v * SNAP) / SNAP : v);

/** Đặt sprite theo điểm neo (toạ độ logic trong cảnh). */
export function placeAt(el, f, x, y, scale = 1) {
  if (!f) return;
  el.style.left = snap(x - f.ax * scale, scale) + "px";
  el.style.top = snap(y - f.ay * scale, scale) + "px";
}
/** Phần tử icon (UI) từ [alias, frame], cao `px`. Ảnh ≥ 96 px làm tròn cỡ theo crisp; icon nhỏ giữ đúng cỡ bố cục. */
export function icon(atlas, ref, px = 40, cls = "ico") {
  const el = document.createElement("i");
  el.className = cls;
  el.setAttribute("aria-hidden", "true");
  const f = ref && atlas.frame(ref[0], ref[1]);
  if (!f) return el;
  const scale = px >= 96 ? crisp(px / f.h) : px / f.h;
  const st = el.style;
  st.width = f.w * scale + "px"; st.height = f.h * scale + "px";
  if (scale * dpr() < 0.5) st.imageRendering = "auto"; // nhỏ hơn nửa cỡ gốc thì pixel cứng rơi điểm ⇒ lọc mượt
  st.backgroundImage = `url("${f.url}")`;
  st.backgroundSize = `${f.sw * scale}px ${f.sh * scale}px`;
  st.backgroundPosition = `${-f.x * scale}px ${-f.y * scale}px`;
  return el;
}
