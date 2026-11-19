// Cảnh tiệm 1280×720 (toạ độ logic của shop-scene.webp). DOM sprite theo atlas, render lại mỗi khung từ trạng thái (thuần hiển thị).
// Lớp: nền quán → máy trên quầy sau → nhân viên → lớp che quầy (shop-counter-foreground) → đồ trên mặt quầy + ly đang pha → khách (theo y)
// → bong bóng thoại / thanh kiên nhẫn (lớp UI không phóng to theo cảnh, chữ luôn đọc được).
import { paint, placeAt, setSnap } from "./atlas.js?v=m35"; // tag: tránh trình duyệt ghép scene mới với atlas cũ trong bộ nhớ đệm
import { SPOTS, DOOR, BARISTA, WALK_MS, ORDER_ANIM_MS } from "../data/shift.js?v=m35";
import { patienceLeft } from "../core/shift.js?v=m35";
import { cupLayers } from "../core/cupview.js?v=m35";
import { EQUIPMENT, PLACE_ZONES } from "../data/equipment.js?v=m35";
import { placeOf, placeError } from "../core/decor.js?v=m35";

const W = 1280, H = 720;
const BUBBLE_MS = 4200;
const lerp = (a, b, p) => a + (b - a) * p;
const ease = (p) => p * p * (3 - 2 * p);

function el(tag, cls, parent) { const e = document.createElement(tag); if (cls) e.className = cls; parent?.appendChild(e); return e; }

/** Frame cho một khách tại thời điểm ca t. Trả [frame, flip, bob]. */
// Nhân vật (khách + chủ tiệm) hiển thị cao ~192 px cảnh. Sheet hiện tại ô 128 ⇒ ×1,5 (ô tranh 3×3, còn thô so với cảnh).
// Khi Codex gửi bản vẽ lớn (ô 192, cùng độ mịn lưới 2× như cảnh) ⇒ tự về ×1, nét như cảnh.
const CHAR_H = 192;
export const charScale = (f) => (f ? Math.max(1, Math.round((CHAR_H / f.h) * 2) / 2) : 1);

export function customerFrame(atlas, c, t) {
  const role = c.sprite;
  const walkFrame = () => {
    const i = Math.floor(t / 125) % 4;
    if (role === "regular") return atlas.frame("motion", `walk-${i + 1}`);
    return atlas.frame("walks", `${role}-walk-${i + 1}`); // office-worker chưa có chu kỳ đi ⇒ null ⇒ dùng dáng chờ + nhún (Cần Codex)
  };
  if (c.phase === "enter" || c.phase === "leave") {
    const f = walkFrame();
    if (f) return [f, c.phase === "leave", 0];
    return [atlas.frame("reactions", `${role}-waiting`), c.phase === "leave", Math.abs(Math.sin(t / 120)) * 5];
  }
  if (c.mood === "surprised") return [atlas.frame("actions", `${role}-surprised-${Math.floor(t / 333) % 2 + 1}`), false, 0];
  if (c.phase === "wait" && c.arriveT !== null && t - c.arriveT < ORDER_ANIM_MS) {
    const i = t - c.arriveT < ORDER_ANIM_MS / 2 ? 1 : 2;
    return [atlas.frame("actions", `${role}-order-${i}`), false, 0];
  }
  if (c.phase === "react") return [atlas.frame("reactions", `${role}-${c.mood === "happy" ? "happy" : "impatient"}`), false, 0];
  if (c.mood === "impatient") return [atlas.frame("reactions", `${role}-impatient`), false, Math.sin(t / 90) > 0.6 ? 1 : 0];
  return [atlas.frame("reactions", `${role}-waiting`), false, 0];
}

/** Vị trí neo chân khách. */
export function customerPos(c, t) {
  const spot = SPOTS[c.spot] || SPOTS[0];
  if (c.phase === "enter") { const p = ease(Math.min(1, (t - c.t0) / WALK_MS)); return [lerp(DOOR[0], spot[0], p), lerp(DOOR[1], spot[1], p), 1]; }
  if (c.phase === "leave") { const p = ease(Math.min(1, (t - c.leaveT) / WALK_MS)); return [lerp(spot[0], DOOR[0], p), lerp(spot[1], DOOR[1], p), p > 0.8 ? (1 - p) / 0.2 : 1]; }
  return [spot[0], spot[1], 1];
}

export function createScene(root, atlas, { onCustomer }) {
  root.textContent = "";
  const stage = el("div", "stage", root);
  stage.style.width = W + "px"; stage.style.height = H + "px";
  const bg = el("img", "layer", stage); bg.src = "assets/shop-scene.webp"; bg.alt = ""; bg.width = W; bg.height = H; bg.draggable = false;

  const put = (alias, name, x, y, scale, cls = "spr") => { const e = el("div", cls, stage); const f = atlas.frame(alias, name); paint(e, f, scale); placeAt(e, f, x, y, scale); return e; };
  put("equip", "tea-brewer", 356, 292, 0.5);
  const defaults = { "cup-sealer": put("equip", "cup-sealer", 222, 340, 0.42), "topping-stove": put("equip", "topping-stove", 452, 270, 0.42) };
  const STOVE = [452, 232];
  const backOwned = el("div", "owned", stage);
  const barista = el("div", "spr barista", stage);
  const fg = el("img", "layer", stage); fg.src = "assets/shop-counter-foreground.webp"; fg.alt = ""; fg.width = W; fg.height = H; fg.draggable = false;
  const frontOwned = el("div", "owned", stage);
  put("equip", "pearls-jar", 300, 428, 0.42);
  put("equip", "ice-jar", 250, 418, 0.36);
  put("pantry", "cup-stack", 650, 372, 0.42);
  // ly đang pha đặt trên mặt quầy (thu nhỏ của ly trong Quầy pha), một ly mỗi chỗ pha
  const miniCups = [];
  const miniAt = (i, n) => [548 + (i - (n - 1) / 2) * 46, 430];
  const zone = el("div", "place-zone", stage); zone.hidden = true;
  { const z = PLACE_ZONES.floor; Object.assign(zone.style, { left: z.x[0] + "px", top: z.y[0] + "px", width: z.x[1] - z.x[0] + "px", height: z.y[1] - z.y[0] + "px" }); }
  const tile = atlas.frame("tiles", "terrazzo-floor");
  if (tile) { // một ô của shop-tiles.webp lặp lại làm nền vùng đặt được (cắt ô qua canvas vì CSS không lặp được một vùng của sheet)
    const img = new Image();
    img.onload = () => { const c = document.createElement("canvas"); c.width = tile.w; c.height = tile.h; c.getContext("2d").drawImage(img, tile.x, tile.y, tile.w, tile.h, 0, 0, tile.w, tile.h); zone.style.backgroundImage = `url(${c.toDataURL()})`; };
    img.src = tile.url;
  }
  const crowd = el("div", "crowd", stage);
  const fx = el("div", "fx", stage);
  const ui = el("div", "scene-ui", root);

  const nodes = new Map();
  let ownedKey = "", steamAt = 0, arranging = null, stoveTok = 0;
  /** Đặt thiết bị / trang trí đã mua vào cảnh (đồ trên sàn xếp theo y cùng khách). */
  function setOwned(state) {
    const ids = Object.keys(state.owned || {}).filter((id) => EQUIPMENT[id]).sort();
    const key = ids.join(",") + "|" + JSON.stringify(state.placement || {});
    if (key === ownedKey) return;
    ownedKey = key;
    backOwned.textContent = ""; frontOwned.textContent = "";
    crowd.querySelectorAll(".decor").forEach((e) => e.remove());
    for (const d of Object.values(defaults)) d.hidden = false;
    const hiddenOwned = new Set(ids.map((id) => EQUIPMENT[id].replacesOwned).filter(Boolean));
    for (const id of ids) {
      const it = EQUIPMENT[id];
      if (hiddenOwned.has(id)) continue;
      const f = atlas.frame(it.sprite[0], it.sprite[1]);
      if (!f) continue;
      const at = placeOf(state, id);
      const floor = !it.front && (it.place === "floor" || (!it.place && at[1] >= 430));
      const e = el("div", "spr decor" + (it.place ? " movable" : ""), it.front ? frontOwned : floor ? crowd : backOwned);
      e.dataset.item = id;
      paint(e, f, it.scale); placeAt(e, f, at[0], at[1], it.scale);
      if (floor) e.style.zIndex = at[1];
      if (it.replaces && defaults[it.replaces]) defaults[it.replaces].hidden = true;
    }
  }

  // ---------- xếp chỗ trang trí (kéo-thả bằng chuột hoặc chạm) ----------
  const toScene = (cx, cy) => { const r = root.getBoundingClientRect(); return [(cx - r.left - ox) / k, (cy - r.top - oy) / k]; };
  let drag = null;
  function onDown(e) {
    if (!arranging) return;
    const t = e.target.closest(".decor.movable");
    if (!t) return;
    e.preventDefault();
    const id = t.dataset.item, it = EQUIPMENT[id], f = atlas.frame(it.sprite[0], it.sprite[1]);
    const at = placeOf(arranging.state(), id);
    const [sx, sy] = toScene(e.clientX, e.clientY);
    drag = { id, it, f, el: t, dx: at[0] - sx, dy: at[1] - sy, x: at[0], y: at[1], pid: e.pointerId };
    t.classList.add("dragging");
    try { root.setPointerCapture(e.pointerId); } catch {}
  }
  function onMove(e) {
    if (!drag || e.pointerId !== drag.pid) return;
    const [sx, sy] = toScene(e.clientX, e.clientY);
    drag.x = Math.round(sx + drag.dx); drag.y = Math.round(sy + drag.dy);
    placeAt(drag.el, drag.f, drag.x, drag.y, drag.it.scale);
    if (drag.it.place === "floor") drag.el.style.zIndex = drag.y;
    drag.el.classList.toggle("bad", !!placeError(drag.id, drag.x, drag.y));
  }
  function onUp(e) {
    if (!drag || e.pointerId !== drag.pid) return;
    const d = drag; drag = null;
    d.el.classList.remove("dragging", "bad");
    ownedKey = ""; // vẽ lại theo trạng thái (vị trí cũ nếu không hợp lệ)
    arranging?.onDrop(d.id, d.x, d.y);
  }
  root.addEventListener("pointerdown", onDown);
  root.addEventListener("pointermove", onMove);
  root.addEventListener("pointerup", onUp);
  root.addEventListener("pointercancel", onUp);
  /** Bật / tắt chế độ xếp chỗ: opts = { state: () => state, onDrop(id, x, y) }. */
  function setArrange(opts) {
    arranging = opts || null;
    stage.classList.toggle("arranging", !!arranging);
    zone.hidden = !arranging;
    ownedKey = "";
  }
  let lastCupStage = "";
  let k = 1, ox = 0, oy = 0;

  /** Camera: phủ kín khung (cover) × zoom, canh giữa điểm (camX, camY) nhưng không lộ mép cảnh. */
  function layout(camX = 640, camY = 360, zoom = 1, exact = false) {
    const w = root.clientWidth, h = root.clientHeight;
    if (!w || !h) return;
    // Tranh vẽ lưới 2× ⇒ nét đều khi k·dpr là bội của 0,5. Phóng lên bội gần nhất nếu chỉ phải cắt mép ≤ 25%;
    // xa hơn thì giữ pixel cứng (vẫn nét, ô hơi không đều). Chỉ lọc mượt khi nhỏ hơn nửa cỡ gốc. Gốc bắt lưới px thiết bị.
    const dpr = globalThis.devicePixelRatio || 1;
    const base = Math.max(w / W, h / H) * zoom;
    const even = Math.ceil(base * dpr * 2 - 1e-6) / 2 / dpr;
    k = exact ? base : even <= base * 1.25 ? even : base; // exact: khung theo vùng (mobile) không phóng thêm để giữ đủ cửa + nhân viên
    ox = Math.round(Math.min(0, Math.max(w - W * k, w / 2 - camX * k)) * dpr) / dpr;
    oy = Math.round(Math.min(0, Math.max(h - H * k, h / 2 - camY * k)) * dpr) / dpr;
    stage.classList.toggle("smooth", k * dpr < 0.5);
    setSnap(k * dpr);
    stage.style.transform = `translate(${ox}px, ${oy}px) scale(${k})`;
  }
  const toScreen = (x, y) => [ox + x * k, oy + y * k];

  function node(c) {
    let n = nodes.get(c.id);
    if (n) return n;
    const b = el("button", "cust spr", crowd);
    b.type = "button"; b.dataset.cid = c.id;
    b.addEventListener("click", () => onCustomer(c.id));
    const bubble = el("div", "bubble", ui); bubble.hidden = true;
    const bar = el("div", "pbar", ui); el("i", "", bar);
    const tag = el("div", "ctag", ui);
    n = { b, bubble, bar, tag, sayAt: -1 };
    nodes.set(c.id, n);
    return n;
  }

  const hasCup = (n) => atlas.has("cup", n);
  function drawMiniCups(stations) {
    const n = Math.max(1, stations.length);
    const key = n + ":" + stations.map((x) => cupLayers(x.cup, hasCup).stage).join("|");
    if (key === lastCupStage) return;
    lastCupStage = key;
    while (miniCups.length < n) miniCups.push(el("div", "minicup", stage));
    miniCups.forEach((m, i) => {
      m.hidden = i >= n;
      if (i >= n) return;
      const [x, y] = miniAt(i, n);
      m.style.left = x - 80 * 0.3 + "px"; m.style.top = y - 174 * 0.3 + "px";
      m.textContent = "";
      for (const name of cupLayers(stations[i]?.cup || null, hasCup).layers) { const e = el("i", "", m); paint(e, atlas.frame("cup", name), 0.3); }
    });
  }
  // nhân viên trong cảnh: dùng barista-scene.webp (Cần Codex #7: idle-1..2, pour-1..4, serve-1..4) khi có, ngược lại dáng đứng characters.webp
  function baristaFrame(t, busy, serving) {
    const B = atlas.sheet("bscene");
    if (B) {
      const seq = serving && atlas.has("bscene", "serve-1") ? ["serve-1", "serve-2", "serve-3", "serve-4"] : busy && atlas.has("bscene", "pour-1") ? ["pour-1", "pour-2", "pour-3", "pour-4"] : ["idle-1", "idle-2"];
      const f = atlas.frame("bscene", seq[Math.floor(t / (busy || serving ? 125 : 400)) % seq.length]);
      if (f) return [f, 0];
    }
    return [atlas.frame("chars", "barista"), busy && Math.floor(t / 250) % 2 ? 1 : 0];
  }
  let serveUntil = 0;
  // bếp đang nấu: clip equipment topping-stove-cooking (Cần Codex #10b) nếu có
  function stoveAnim(cooking, reduced) {
    const clip = atlas.clip("equip", "topping-stove-cooking");
    const d = defaults["topping-stove"];
    if (!clip || d.hidden) return;
    if (!cooking || reduced) { if (stoveTok) { stoveTok = 0; const f0 = atlas.frame("equip", "topping-stove"); paint(d, f0, 0.42); placeAt(d, f0, 470, 300, 0.42); } return; }
    const i = Math.floor(performance.now() / (1000 / clip.fps)) % clip.frames.length;
    if (stoveTok === i + 1) return;
    stoveTok = i + 1;
    const f = atlas.frame("equip", clip.frames[i]);
    if (f) { paint(d, f, 0.42); placeAt(d, f, 470, 300, 0.42); }
  }

  function update(state, opts = {}) {
    const sh = state.shift;
    const t = sh ? sh.t : 0;
    // nhân viên: dáng đứng có ly (characters.webp); nhún nhẹ khi đang pha
    const busy = (sh?.stations || []).some((x) => x.cup && !x.cup.sealed);
    const [fb, bob] = baristaFrame(t, busy, performance.now() < serveUntil);
    // chủ tiệm: cùng cỡ nhân vật với khách (charScale)
    const bs = charScale(fb);
    paint(barista, fb, bs);
    placeAt(barista, fb, BARISTA[0], BARISTA[1] + bob, bs);
    drawMiniCups(sh?.stations || [{ cup: null }]);
    stoveAnim(!!sh?.kitchen?.batches.length, opts.reduced);
    if (sh?.kitchen?.batches.length && !opts.reduced && performance.now() - steamAt > 1300) { steamAt = performance.now(); burst("cupfx", "steam", STOVE[0], STOVE[1] + 40, 0.4); }
    const live = new Set();
    for (const c of sh?.customers || []) {
      live.add(c.id);
      const n = node(c);
      const [f, flip, bob] = customerFrame(atlas, c, t);
      const [x, y, alpha] = customerPos(c, t);
      const cs = charScale(f);
      paint(n.b, f, cs);
      placeAt(n.b, f, x, y - bob * cs, cs);
      n.b.style.zIndex = Math.round(y);
      n.b.style.opacity = alpha;
      n.b.classList.toggle("flip", flip);
      const act = sh.stations[sh.sel]?.cid === c.id;
      n.b.classList.toggle("active", act);
      n.b.classList.toggle("can-pin", c.phase === "wait" && !act);
      n.b.disabled = c.phase !== "wait";
      n.b.setAttribute("aria-label", `${c.name}${c.phase === "wait" ? ", đang chờ — chạm để ghim phiếu" : ""}`);
      n.b.dataset.phase = c.phase; n.b.dataset.mood = c.mood;
      // UI trên đầu khách
      const [sx, sy] = toScreen(x, y - (f ? f.ay * cs : 116) - 16);
      const showSay = c.say && t - c.say.at < BUBBLE_MS;
      n.bubble.hidden = !showSay;
      if (showSay) {
        if (n.sayAt !== c.say.at) { n.sayAt = c.say.at; n.bubble.textContent = c.say.text; n.bubble.classList.remove("pop"); void n.bubble.offsetWidth; n.bubble.classList.add("pop"); }
        n.bubble.style.left = sx + "px"; n.bubble.style.top = sy - 6 + "px";
        n.bubble.classList.toggle("left", sx > root.clientWidth * 0.62);
      }
      const showBar = c.phase === "wait";
      n.bar.hidden = !showBar;
      if (showBar) {
        const p = patienceLeft(state, c);
        n.bar.firstChild.style.width = p * 100 + "%";
        n.bar.className = "pbar" + (p <= 0.35 ? " low" : p <= 0.6 ? " mid" : "");
        n.bar.style.left = sx + "px"; n.bar.style.top = sy + 8 + "px";
      }
      n.tag.hidden = !(c.phase === "wait" || c.phase === "enter") || showSay;
      n.tag.textContent = act ? "Đang pha" : c.items.length > 1 ? `${c.name} · ${c.items.length} ly` : c.name;
      n.tag.classList.toggle("on", act);
      n.tag.style.left = sx + "px"; n.tag.style.top = sy - 16 + "px";
      n.tag.style.opacity = alpha;
    }
    for (const [id, n] of nodes) if (!live.has(id)) { n.b.remove(); n.bubble.remove(); n.bar.remove(); n.tag.remove(); nodes.delete(id); }
  }

  /** Hiệu ứng một lượt (clip manifest) tại toạ độ cảnh. reduced ⇒ bỏ qua. */
  function burst(alias, clipName, x, y, scale = 1, reduced = false) {
    const clip = atlas.clip(alias, clipName);
    if (!clip || reduced) return;
    const e = el("div", "spr fxspr", fx);
    let i = 0;
    const stepF = () => {
      if (i >= clip.frames.length) { e.remove(); return; }
      const f = atlas.frame(alias, clip.frames[i++]);
      paint(e, f, scale); placeAt(e, f, x, y, scale);
      setTimeout(stepF, 1000 / clip.fps);
    };
    stepF();
  }
  const posOf = (state, cid) => { const c = state.shift?.customers.find((q) => q.id === cid); return c ? customerPos(c, state.shift.t) : null; };

  /** Khung theo vùng: luôn thấy đủ [x0..x1] × [y0..y1] của cảnh (mobile: từ nhân viên tới cửa). */
  function layoutFit(x0, x1, y0, y1) {
    const w = root.clientWidth, h = root.clientHeight;
    if (!w || !h) return;
    const cover = Math.max(w / W, h / H);
    const fit = Math.min(w / (x1 - x0), h / (y1 - y0));
    layout((x0 + x1) / 2, (y0 + y1) / 2, Math.max(1, fit / cover), true);
  }
  const served = () => { serveUntil = performance.now() + 500; };
  return { update, layout, layoutFit, burst, posOf, toScreen, setOwned, setArrange, served, get scale() { return k; } };
}
