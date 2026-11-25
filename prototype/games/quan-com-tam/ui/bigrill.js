// V: Bếp lớn (SCREENS.md "Bếp lớn"): bếp than cận cảnh grill-hd + các miếng grill-items-hd + cô chủ cận cảnh owner-actions-hd phía sau.
// Desktop: bảng nổi trên khung cảnh (nút "Bếp lớn" trên Thanh Bếp). Mobile: đầu vùng làm việc khi dock = Bếp.
// Hệ số thiết bị trên 1 px file HD là bội 0,5 (PLAYBOOK §2): desktop 1366@1,25 ⇒ 1,0 (512×320 CSS), mobile 390@3 ⇒ 1,5 (320×200 CSS).
// Chạm miếng = chạm chip (grillTap). Không bắt buộc dùng: mọi việc bếp vẫn làm được trên Thanh Bếp.
import { paint, dpr } from "../render/atlas.js?v=c6";
import { zoneOf, sideState, itemResult, isCooked, itemFrame, heatKey } from "../core/grill.js?v=c6";
import { ownerFree } from "../core/walker.js?v=c6";

// Bố cục tính bằng "nửa px HD" (đơn vị atlas trả cho frame HD): khung 320×200.
const W = 320, H = 200;
const GRILL_AT = [160, 197]; // anchor bếp (grill-hd [320,304] ⇒ [160,152]) trong khung
const OWNER_AT = [160, 154]; // anchor cô chủ ([160,316] ⇒ [80,158]); eo khuất sau mép vỉ
/** Chỗ 0–5 (anchor miếng [96,104] ⇒ [48,52]) theo ô vỉ trong tranh: vùng nóng cột 1 (trên, dưới), vùng vừa cột 2 + 3, giữ ấm trên mặt đồng. */
export const BIG_SLOTS = [[64, 157], [64, 179], [135, 168], [205, 168], [268, 158], [268, 178]];
/** Vùng chạm từng chỗ [x, y, rộng, cao] (nửa px HD), không chồng nhau: hai miếng xếp trên / dưới chia đôi theo phần lộ ra. */
const BIG_HIT = [[30, 109, 68, 32], [30, 141, 68, 40], [101, 118, 68, 54], [171, 118, 68, 54], [236, 110, 64, 32], [236, 142, 64, 38]];
const SIDE_TXT = { raw: "sống", half: "tái", done: "chín", charred: "cháy cạnh", burnt: "cháy" };
const OWNER_CLIP = { idle: [2, 3], grill: [4, 8], fan: [4, 8], plate: [4, 8], pour: [4, 8], box: [4, 8], bill: [4, 8] };

function el(tag, cls, parent) { const e = document.createElement(tag); if (cls) e.className = cls; parent?.appendChild(e); return e; }

export function createBigGrill(atlas, act, { onClose } = {}) {
  const root = el("div", "bigrill");
  root.hidden = true;
  root.setAttribute("aria-label", "Bếp lớn");
  const head = el("div", "bg-head", root);
  const title = el("b", "", head); title.textContent = "Bếp lớn";
  const info = el("span", "bg-info", head);
  const close = el("button", "bg-close", head); close.type = "button"; close.textContent = "Đóng"; close.dataset.act = "bigGrillClose";
  close.addEventListener("click", () => onClose?.());
  const stage = el("div", "bg-stage", root);
  const owner = el("div", "spr bg-owner", stage);
  const grill = el("div", "spr bg-grill", stage);
  const items = BIG_SLOTS.map(() => el("div", "spr bg-item", stage));
  const slots = BIG_SLOTS.map((_, i) => {
    const b = el("button", "bg-slot", stage); b.type = "button"; b.dataset.slot = i;
    b.addEventListener("click", () => act({ type: "grillTap", slot: i + base }));
    const lbl = el("span", "", b);
    return { b, lbl };
  });
  let base = 0, k = 0, maxF = 1.5, pulse = { name: "idle", until: 0 }, sig = {};
  const set = (key, e, f, at, scale) => {
    const s = (f ? f.url + f.x + "," + f.y : "") + "@" + scale;
    if (sig[key] === s) return;
    sig[key] = s;
    paint(e, f, scale);
    e.hidden = !f;
    if (f) { e.style.left = (at[0] - f.ax) * scale + "px"; e.style.top = (at[1] - f.ay) * scale + "px"; }
  };
  /** Hệ số: px CSS trên 1 đơn vị nửa-HD, sao cho px thiết bị trên 1 px file HD là bội 0,5, vừa bề ngang chỗ có. */
  function fit() {
    const avail = Math.max(160, (root.parentElement?.clientWidth || 640) - 16);
    const d = dpr();
    const f = Math.max(0.5, Math.min(maxF, Math.floor(((avail * d) / (W * 2)) * 2 + 1e-6) / 2)); // px thiết bị / px file HD
    const scale = (2 * f) / d;
    if (scale !== k) {
      k = scale; sig = {};
      stage.style.width = W * k + "px"; stage.style.height = H * k + "px";
      root.dataset.k = String(f);
      for (let i = 0; i < slots.length; i++) {
        const [x, y, w, h] = BIG_HIT[i], b = slots[i].b;
        b.style.left = x * k + "px"; b.style.top = y * k + "px"; b.style.width = w * k + "px"; b.style.height = h * k + "px";
      }
    }
  }
  function ownerFrame(s, now) {
    const sh = s.shift;
    let name = "idle";
    if (sh?.grill.fan || sh?.grill.blower) name = "fan";
    else if (now < pulse.until) name = pulse.name;
    const [n, fps] = OWNER_CLIP[name];
    const fr = `${name}-${Math.floor(now / (1000 / fps)) % n + 1}`;
    return atlas.frame("ownerhd", fr) || atlas.frame("ownerhd", "idle-1");
  }
  function render(s, { reduced = false } = {}) {
    const sh = s.shift;
    if (root.hidden || !sh) return;
    fit();
    const g = sh.grill, now = performance.now();
    if (g.slots.length <= 6) base = 0;
    // bếp: mức than (cold / low / mid / high / ash) + lửa bùng
    const heat = heatKey(g, sh.lit);
    const gname = g.flareUntil > sh.t ? `grill-hd-flare-${reduced ? 1 : Math.floor(now / 125) % 2 + 1}` : `grill-hd-${heat === "flare" ? "high" : heat}`;
    set("grill", grill, atlas.frame("grillhd", gname) || atlas.frame("grillhd", "grill-hd-mid"), GRILL_AT, k);
    set("owner", owner, reduced ? atlas.frame("ownerhd", "idle-1") : ownerFrame(s, now), OWNER_AT, k);
    const free = ownerFree(s);
    for (let i = 0; i < items.length; i++) {
      const it = g.slots[i + base], z = zoneOf(i), c = slots[i];
      set("it" + i, items[i], it ? atlas.frame("grillItems", itemFrame(it)) : null, BIG_SLOTS[i], k);
      let cls = "bg-slot " + z, label = "";
      if (it) {
        const r = itemResult(it), a = sideState(it.sides[0]);
        label = r === "burnt" ? "Cháy · bỏ" : isCooked(it) ? "Gắp" : it.sides[0] >= 100 ? "Lật!" : SIDE_TXT[a];
        if (isCooked(it) || (it.sides[0] >= 100 && it.sides[1] < 100)) cls += " ready";
        if (it.sides[0] >= 112 && r !== "burnt" && z !== "warm") cls += " danger";
      } else label = z === "warm" ? "" : "+";
      if (!free) cls += " locked";
      if (c.b.className !== cls) c.b.className = cls;
      if (c.lbl.textContent !== label) c.lbl.textContent = label;
      c.b.setAttribute("aria-label", `Bếp lớn, chỗ ${i + 1}${it ? `: mặt dưới ${SIDE_TXT[sideState(it.sides[0])]}, mặt trên ${SIDE_TXT[sideState(it.sides[1])]}` : ": trống"}`);
    }
    const txt = `Than ${Math.round(g.coal)} · Khói ${Math.round(g.smoke)}${g.slots.length > 6 ? (base ? " · bếp 2" : " · bếp 1") : ""}`;
    if (info.textContent !== txt) info.textContent = txt;
  }
  return {
    el: root, render,
    /** Cô chủ cận cảnh làm động tác ngắn (grill / plate / pour / box / bill). */
    pulse(name, ms = 700) { if (OWNER_CLIP[name]) pulse = { name, until: performance.now() + ms }; },
    setBase(b) { base = b; },
    get open() { return !root.hidden; },
    /** max: trần hệ số thiết bị (desktop 1,0 theo SCREENS; mobile 1,5). */
    show(on, max = maxF) { maxF = max; root.hidden = !on; if (on) { sig = {}; k = 0; } },
  };
}
