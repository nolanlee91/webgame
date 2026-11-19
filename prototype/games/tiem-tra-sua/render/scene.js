// Cảnh tiệm 1280×720 (toạ độ logic của shop-scene.webp). DOM sprite theo atlas, render lại mỗi khung từ trạng thái (thuần hiển thị).
// Lớp: nền quán → máy trên quầy sau → nhân viên → lớp che quầy (shop-counter-foreground) → đồ trên mặt quầy + ly đang pha → khách (theo y)
// → bong bóng thoại / thanh kiên nhẫn (lớp UI không phóng to theo cảnh, chữ luôn đọc được).
import { paint, placeAt, setSnap } from "./atlas.js?v=snap2"; // tag: tránh trình duyệt ghép scene mới với atlas cũ trong bộ nhớ đệm
import { SPOTS, DOOR, BARISTA, WALK_MS, ORDER_ANIM_MS } from "../data/shift.js";
import { patienceLeft } from "../core/shift.js";
import { cupLayers } from "../core/cupview.js";
import { EQUIPMENT } from "../data/equipment.js";

const W = 1280, H = 720;
const BUBBLE_MS = 4200;
const lerp = (a, b, p) => a + (b - a) * p;
const ease = (p) => p * p * (3 - 2 * p);

function el(tag, cls, parent) { const e = document.createElement(tag); if (cls) e.className = cls; parent?.appendChild(e); return e; }

/** Frame cho một khách tại thời điểm ca t. Trả [frame, flip, bob]. */
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
  put("equip", "pearls-jar", 300, 428, 0.42);
  put("equip", "ice-jar", 250, 418, 0.36);
  put("pantry", "cup-stack", 650, 372, 0.42);
  // ly đang pha đặt trên mặt quầy (thu nhỏ của ly trong Quầy pha)
  const miniCup = el("div", "minicup", stage);
  miniCup.style.left = 548 - 80 * 0.3 + "px"; miniCup.style.top = 430 - 174 * 0.3 + "px";
  const crowd = el("div", "crowd", stage);
  const fx = el("div", "fx", stage);
  const ui = el("div", "scene-ui", root);

  const nodes = new Map();
  let ownedKey = "", steamAt = 0;
  /** Đặt thiết bị / trang trí đã mua vào cảnh (đồ trên sàn xếp theo y cùng khách). */
  function setOwned(state) {
    const ids = Object.keys(state.owned || {}).filter((id) => EQUIPMENT[id]).sort();
    const key = ids.join(",");
    if (key === ownedKey) return;
    ownedKey = key;
    backOwned.textContent = "";
    crowd.querySelectorAll(".decor").forEach((e) => e.remove());
    for (const d of Object.values(defaults)) d.hidden = false;
    for (const id of ids) {
      const it = EQUIPMENT[id];
      const f = atlas.frame(it.sprite[0], it.sprite[1]);
      if (!f) continue;
      const floor = it.at[1] >= 430;
      const e = el("div", "spr decor", floor ? crowd : backOwned);
      e.dataset.item = id;
      paint(e, f, it.scale); placeAt(e, f, it.at[0], it.at[1], it.scale);
      if (floor) e.style.zIndex = it.at[1];
      if (it.replaces && defaults[it.replaces]) defaults[it.replaces].hidden = true;
    }
  }
  let lastCupStage = "";
  let k = 1, ox = 0, oy = 0;

  /** Camera: phủ kín khung (cover) × zoom, canh giữa điểm (camX, camY) nhưng không lộ mép cảnh. */
  function layout(camX = 640, camY = 360, zoom = 1) {
    const w = root.clientWidth, h = root.clientHeight;
    if (!w || !h) return;
    // Tranh vẽ lưới 2× ⇒ nét đều khi k·dpr là bội của 0,5. Phóng lên bội gần nhất nếu chỉ phải cắt mép ≤ 25%;
    // xa hơn thì giữ pixel cứng (vẫn nét, ô hơi không đều). Chỉ lọc mượt khi nhỏ hơn nửa cỡ gốc. Gốc bắt lưới px thiết bị.
    const dpr = globalThis.devicePixelRatio || 1;
    const base = Math.max(w / W, h / H) * zoom;
    const even = Math.ceil(base * dpr * 2 - 1e-6) / 2 / dpr;
    k = even <= base * 1.25 ? even : base;
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

  function drawMiniCup(cup) {
    const { layers, stage: st } = cupLayers(cup);
    if (st === lastCupStage) return;
    lastCupStage = st;
    miniCup.textContent = "";
    for (const name of layers) { const e = el("i", "", miniCup); paint(e, atlas.frame("cup", name), 0.3); }
  }

  function update(state, opts = {}) {
    const sh = state.shift;
    const t = sh ? sh.t : 0;
    // nhân viên: dáng đứng có ly (characters.webp); nhún nhẹ khi đang pha
    const fb = atlas.frame("chars", "barista");
    paint(barista, fb, 1);
    const busy = sh?.cup && !sh.cup.sealed;
    placeAt(barista, fb, BARISTA[0], BARISTA[1] + (busy && Math.floor(t / 250) % 2 ? 1 : 0), 1);
    drawMiniCup(sh?.cup || null);
    if (sh?.kitchen?.batches.length && !opts.reduced && performance.now() - steamAt > 1300) { steamAt = performance.now(); burst("cupfx", "steam", STOVE[0], STOVE[1] + 40, 0.4); }
    const live = new Set();
    for (const c of sh?.customers || []) {
      live.add(c.id);
      const n = node(c);
      const [f, flip, bob] = customerFrame(atlas, c, t);
      const [x, y, alpha] = customerPos(c, t);
      paint(n.b, f, 1);
      placeAt(n.b, f, x, y - bob, 1);
      n.b.style.zIndex = Math.round(y);
      n.b.style.opacity = alpha;
      n.b.classList.toggle("flip", flip);
      n.b.classList.toggle("active", sh.active === c.id);
      n.b.classList.toggle("can-pin", c.phase === "wait" && sh.active !== c.id);
      n.b.disabled = c.phase !== "wait";
      n.b.setAttribute("aria-label", `${c.name}${c.phase === "wait" ? ", đang chờ — chạm để ghim phiếu" : ""}`);
      n.b.dataset.phase = c.phase; n.b.dataset.mood = c.mood;
      // UI trên đầu khách
      const [sx, sy] = toScreen(x, y - 132);
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
      n.tag.textContent = sh.active === c.id ? "Đang pha" : c.name;
      n.tag.classList.toggle("on", sh.active === c.id);
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

  return { update, layout, burst, posOf, toScreen, setOwned, get scale() { return k; } };
}
