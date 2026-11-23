// Atlas đọc từ data/asset-manifest.json (bản chép của docs/quan-com-tam/asset-manifest.json — test kiểm khớp).
// Mọi sprite lấy rect + anchor + clip từ đây theo tên frame trong docs/quan-com-tam/asset-spec.json. Bí danh ngắn (SHEETS) để code dễ đọc.
// Chưa có frame thật (asset Codex chưa giao) ⇒ frame() trả hình dự phòng vẽ bằng canvas (render/placeholder.js) đi đúng đường vẽ này,
// nên khi manifest có frame đúng tên thì game tự dùng ảnh thật, không cần sửa code. has() chỉ báo frame THẬT.
export const SHEETS = {
  street: "assets/street-scene.webp", streetFg: "assets/street-foreground.webp", quan: "assets/quan-scene.webp", quanFg: "assets/quan-foreground.webp",
  title: "assets/title-art.webp", chars: "assets/characters.webp", walks: "assets/customer-walk-cycles.webp", reactions: "assets/customer-reactions.webp",
  actions: "assets/customer-actions.webp", seated: "assets/customer-seated.webp", owner: "assets/owner-scene.webp", helper: "assets/helper-scene.webp",
  grill: "assets/grill.webp", grillItems: "assets/grill-items.webp", plate: "assets/plate-layers.webp", equip: "assets/equipment.webp",
  tables: "assets/tables.webp", tableItems: "assets/table-items.webp", ingr: "assets/ingredients.webp", bills: "assets/bills.webp", fx: "assets/fx.webp",
  icons: "assets/ui-icons.webp", fixtures: "assets/fixtures.webp", decor: "assets/decor.webp", weather: "assets/weather-fx.webp", journal: "assets/journal-card.webp",
};
/** Đợt 2 (asset-spec "wave": 2): không bắt buộc có trong manifest. */
export const OPTIONAL_SHEETS = new Set(["fixtures", "decor", "weather", "journal"]);
/** Sheet lớn không cần trong 10 giây đầu: tải nền sau khi quán hiện ra. */
export const LAZY_SHEETS = new Set(["assets/portrait-expressions-hd.webp", "assets/drama-portraits-hd.webp", "assets/portraits-hd.webp", "assets/owner-actions-hd.webp", "assets/weather-fx.webp", "assets/journal-card.webp", "assets/title-art.webp", "assets/quan-scene.webp", "assets/quan-foreground.webp", "assets/grill-hd.webp",
  "assets/plate-layers-hd.webp", "assets/grill-items-hd.webp", "assets/fixtures.webp", "assets/decor.webp"]); // V: + sheet đợt 2 lớn (dĩa HD, món HD, vật dụng, trang trí)
/** Bản cận cảnh vẽ lưới 1× (gấp đôi chi tiết, toạ độ đúng ×2 bản thường). Có frame cùng tên thì dùng bản HD, trả toạ độ quy về cỡ bản thường.
 *  plate-layers-hd và grill-items-hd cùng tên frame với bản thường (ART-DIRECTION §5–§6) ⇒ Cột Dĩa / chip vỉ tự nét khi Codex giao đợt 2. */
export const HD_SHEETS = {
  plate: "assets/plate-layers-hd.webp", grillItems: "assets/grill-items-hd.webp", ownerhd: "assets/owner-actions-hd.webp", portraits: "assets/portraits-hd.webp",
  faces: "assets/portrait-expressions-hd.webp", drama: "assets/drama-portraits-hd.webp",
  grillhd: "assets/grill-hd.webp", // V: bếp lớn cận cảnh (frame "grill-hd-*", không có bản thường)
};

/** Frame HD lỗi tạm (dùng bản thường). */
export const HD_SKIP = new Set([]);
/** Sheet thường vẫn cần tải dù đã có bản HD (cảnh vẫn vẽ món trên vỉ bằng grill-items thường). */
export const KEEP_BASE = new Set(["grillItems"]);
import { SHEET_SCALE } from "../data/scene.js?v=c3"; // A: hệ số hiện theo sheet
export function makeAtlas(manifest, base = "", { hd = true, fallback = null } = {}) {
  const byFile = new Map();
  for (const it of manifest.items || []) if (it.filename?.startsWith("assets/")) byFile.set(it.filename, it);
  const real = (alias, name, lo = false) => {
    const hf = hd && !lo && HD_SHEETS[alias] && !HD_SKIP.has(name) && HD_SHEETS[alias], hi = hf && byFile.get(hf), g = hi?.frames?.[name];
    if (g) return { url: base + hf, hd: true, sw: hi.dimensions[0] / 2, sh: hi.dimensions[1] / 2, x: g.rect[0] / 2, y: g.rect[1] / 2, w: g.rect[2] / 2, h: g.rect[3] / 2, ax: g.anchor[0] / 2, ay: g.anchor[1] / 2 };
    const file = SHEETS[alias] || alias;
    const it = byFile.get(file);
    const f = it?.frames?.[name];
    if (!f) return null;
    return { url: base + file, sw: it.dimensions[0], sh: it.dimensions[1], x: f.rect[0], y: f.rect[1], w: f.rect[2], h: f.rect[3], ax: f.anchor[0], ay: f.anchor[1] };
  };
  const frame = (alias, name) => real(alias, name) || (fallback ? fallback(alias, name) : null);
  /** V: frame bản thường (bỏ qua HD): cảnh vẽ lưới 2× vẫn dùng grill-items thường dù đã có grill-items-hd (KEEP_BASE). */
  const frameLo = (alias, name) => real(alias, name, true) || (fallback ? fallback(alias, name) : null);
  const clip = (alias, name) => {
    const it = byFile.get(SHEETS[alias] || alias);
    const a = it?.animations?.[name];
    return a ? { frames: a.frames, fps: a.fps, loop: !!a.loop } : null;
  };
  const has = (alias, name) => !!real(alias, name);
  const sheet = (alias) => byFile.get(SHEETS[alias] || alias) || null;
  const placements = manifest.placements || {};
  /** A: hệ số hiện của frame trong cảnh (data/scene.js SHEET_SCALE; manifest item.displayScale ưu tiên). */
  const scaleOf = (alias, name = "") => {
    const file = SHEETS[alias] || alias, it = byFile.get(file);
    if (it && Number.isFinite(it.displayScale) && it.displayScale > 0) return it.displayScale;
    const rule = SHEET_SCALE[file];
    if (!rule || (rule.frames && !rule.frames.test(name))) return 1;
    if (!it) return rule.scale; // hình dự phòng vẽ cùng ô đợt 1
    const m = rule.match || {};
    const same = (!m.productionStatus || it.productionStatus === m.productionStatus) && (!m.dimensions || (it.dimensions?.[0] === m.dimensions[0] && it.dimensions?.[1] === m.dimensions[1]));
    return same ? rule.scale : 1;
  };
  return { frame, frameLo, clip, has, sheet, base, placements, scaleOf };
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
/** V: bản HD lưới 1× (toạ độ quy về nửa): 1 px file = s·dpr/2 px thiết bị ⇒ làm tròn s về bội 1/dpr (hệ số thiết bị bội 0,5). */
export function crispHd(s) { const d = dpr(); return Math.max(1, Math.round(s * d)) / d; }
/** V: hệ số thiết bị thật trên 1 px file của frame (HD: nửa). */
export const devScale = (f, scale) => scale * dpr() * (f?.hd ? 0.5 : 1);
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
  const scale = px >= 96 ? (f.hd ? crispHd(px / f.h) : crisp(px / f.h)) : px / f.h; // V: HD làm tròn theo lưới 1×
  const st = el.style;
  st.width = f.w * scale + "px"; st.height = f.h * scale + "px";
  if (devScale(f, scale) < 0.5) st.imageRendering = "auto"; // nhỏ hơn nửa cỡ gốc thì pixel cứng rơi điểm ⇒ lọc mượt (V: HD tính theo px file thật)
  st.backgroundImage = `url("${f.url}")`;
  st.backgroundSize = `${f.sw * scale}px ${f.sh * scale}px`;
  st.backgroundPosition = `${-f.x * scale}px ${-f.y * scale}px`;
  return el;
}
