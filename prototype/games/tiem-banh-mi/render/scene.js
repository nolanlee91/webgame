// Cảnh xe đẩy 1280×720 (toạ độ logic của cart-scene.webp). DOM sprite theo atlas, vẽ lại mỗi khung từ trạng thái (thuần hiển thị).
// Lớp: nền → chủ tiệm sau xe → lớp che mặt xe (cart-foreground) → đồ trên mặt xe (lò, lò than, hũ, thớt, tủ kính) → khách (theo y)
// → bong bóng thoại / thanh kiên nhẫn (lớp UI không phóng theo cảnh, chữ luôn đọc được).
// Toạ độ lấy từ manifest placements (Codex ghi) nếu có, không thì theo đề xuất ART-DIRECTION §6 (data/shift.js CART).
import { paint, placeAt, setSnap } from "./atlas.js?v=b1";
import { CART, WALK_MS, ORDER_ANIM_MS, BUBBLE_MS } from "../data/shift.js?v=b1";
import { patienceLeft } from "../core/shift.js?v=b1";
import { batchLevel } from "../core/oven.js?v=b1";
import { crustOf } from "./loafview.js?v=b1";

const W = 1280, H = 720;
const lerp = (a, b, p) => a + (b - a) * p;
const ease = (p) => p * p * (3 - 2 * p);
function el(tag, cls, parent) { const e = document.createElement(tag); if (cls) e.className = cls; parent?.appendChild(e); return e; }

/** Cảnh Bánh Mì vẽ cận (PLAYBOOK §1.2b): người ở hàng chờ cao ~260 px cảnh ⇒ ô nhân vật mục tiêu 288 px (asset-spec 216×288).
 *  Ô 144×192 của đợt 1 hiện ×1,5; ô 216×288 Codex vẽ lại sẽ tự về ×1 (luôn bội 0,5 ⇒ crisp/snap giữ nét). */
export const CHAR_H = 288;
export const charScale = (f) => (f ? Math.max(1, Math.round((CHAR_H / f.h) * 2) / 2) : 1);

/** Toạ độ đặt: manifest placements (dạng [x,y] hoặc { at:[x,y] }) ⇒ dự phòng. */
const pt = (v) => (Array.isArray(v) && typeof v[0] === "number" ? v : Array.isArray(v?.at) ? v.at : null);
const pts = (v) => (Array.isArray(v) && Array.isArray(v[0]) ? v : Array.isArray(v?.spots) ? v.spots : Array.isArray(v?.points) ? v.points : null);
export function scenePoints(placements = {}) {
  const at = (k, d) => pt(placements[k]) || d;
  return {
    entry: at("cartEntry", CART.entry), queue: pts(placements.cartQueueSpots) || CART.queue, exit: pts(placements.cartExitPath) || CART.exit,
    baker: at("cart-baker", CART.baker), oven: at("cart-oven", CART.oven), toaster: at("cart-toaster", CART.toaster), sauce: at("cart-sauce-bottles", CART.sauce),
    pate: at("cart-pate-jar", CART.pate), board: at("cart-board", CART.board), pickle: at("cart-pickle-jar", CART.pickle), herb: at("cart-herb-basket", CART.herb),
    display: at("cart-display", CART.display), paper: at("cart-paper-stack", CART.paper), cash: at("cart-cash-tin", CART.cash), gas: at("cart-gas-tank", CART.gas), tea: at("cart-tea-jug", CART.tea),
  };
}

/** Frame cho khách tại thời điểm ca t: [frame, lật, nhún]. */
export function customerFrame(atlas, c, t) {
  const role = c.sprite;
  if (c.phase === "enter" || c.phase === "leave") {
    const f = atlas.frame("walks", `${role}-walk-${Math.floor(t / 125) % 4 + 1}`);
    return [f || atlas.frame("chars", role), c.phase === "leave", f ? 0 : Math.abs(Math.sin(t / 120)) * 4];
  }
  if (c.mood === "surprised") return [atlas.frame("actions", `${role}-surprised-${Math.floor(t / 333) % 2 + 1}`), false, 0];
  if (c.phase === "wait" && c.arriveT !== null && t - c.arriveT < ORDER_ANIM_MS) return [atlas.frame("actions", `${role}-order-${t - c.arriveT < ORDER_ANIM_MS / 2 ? 1 : 2}`), false, 0];
  if (c.phase === "react") return [atlas.frame("reactions", `${role}-${c.mood === "happy" ? "happy" : "impatient"}`), false, 0];
  if (c.mood === "impatient") return [atlas.frame("reactions", `${role}-impatient`), false, Math.sin(t / 90) > 0.6 ? 1 : 0];
  return [atlas.frame("reactions", `${role}-waiting`) || atlas.frame("chars", role), false, 0];
}
/** Vị trí neo chân khách: cửa vào → chỗ xếp hàng → đường ra. */
export function customerPos(c, t, P) {
  const spot = P.queue[c.spot] || P.queue[P.queue.length - 1];
  if (c.phase === "enter") { const p = ease(Math.min(1, (t - c.t0) / WALK_MS)); return [lerp(P.entry[0], spot[0], p), lerp(P.entry[1], spot[1], p), 1]; }
  if (c.phase === "leave") {
    const path = [spot, ...P.exit], seg = path.length - 1;
    const p = Math.min(1, (t - (c.leaveT ?? t)) / WALK_MS) * seg, i = Math.min(seg - 1, Math.floor(p)), f = p - i;
    return [lerp(path[i][0], path[i + 1][0], f), lerp(path[i][1], path[i + 1][1], f), p / seg > 0.85 ? (1 - p / seg) / 0.15 : 1];
  }
  return [spot[0], spot[1], 1];
}

export function createScene(root, atlas, { onCustomer }) {
  root.textContent = "";
  const P = scenePoints(atlas.placements);
  const stage = el("div", "stage", root);
  stage.style.width = W + "px"; stage.style.height = H + "px";
  const layer = (alias, file) => {
    const img = el("img", "layer", stage); img.alt = ""; img.width = W; img.height = H; img.draggable = false;
    const real = atlas.sheet(alias); const f = real ? null : atlas.frame(alias, "scene");
    img.src = real ? atlas.base + file : f ? f.url : "";
    if (!img.src) img.hidden = true;
    return img;
  };
  layer("cart", "assets/cart-scene.webp");
  const bakerEl = el("div", "spr baker", stage);
  layer("cartFg", "assets/cart-foreground.webp");
  const put = (alias, name, at, scale, cls = "spr") => { const e = el("div", cls, stage); const f = atlas.frame(alias, name); paint(e, f, scale); placeAt(e, f, at[0], at[1], scale); return e; };
  const ovenEl = el("div", "spr oven", stage);
  const toasterEl = el("div", "spr", stage);
  put("equip", "sauce-bottles", P.sauce, 0.5);
  put("equip", "pate-jar", P.pate, 0.5);
  const boardEl = el("div", "spr", stage);
  put("equip", "pickle-jar", P.pickle, 0.5);
  put("equip", "herb-basket", P.herb, 0.5);
  put("equip", "paper-stack", P.paper, 0.5);
  put("equip", "cash-tin", P.cash, 0.5);
  put("equip", "tea-jug", P.tea, 0.5);
  const gasEl = el("div", "spr", stage);
  const display = el("div", "display", stage);
  const crowd = el("div", "crowd", stage);
  const fx = el("div", "fx", stage);
  const ui = el("div", "scene-ui", root);
  const nodes = new Map();
  let k = 1, ox = 0, oy = 0, lastOven = "", lastToast = "", lastBoard = "", lastGas = "", lastDisplay = "", actUntil = 0, actName = "idle";

  /** Camera: phủ kín khung × zoom, canh giữa (camX, camY), không lộ mép. Hệ số phóng lên bội 0,5 thiết bị nếu chỉ cắt mép ≤ 25%. */
  function layout(camX = 640, camY = 380, zoom = 1, exact = false) {
    const w = root.clientWidth, h = root.clientHeight;
    if (!w || !h) return;
    const d = globalThis.devicePixelRatio || 1;
    const base = Math.max(w / W, h / H) * zoom;
    const even = Math.ceil(base * d * 2 - 1e-6) / 2 / d;
    k = exact ? base : even <= base * 1.25 ? even : base;
    ox = Math.round(Math.min(0, Math.max(w - W * k, w / 2 - camX * k)) * d) / d;
    oy = Math.round(Math.min(0, Math.max(h - H * k, h / 2 - camY * k)) * d) / d;
    stage.classList.toggle("smooth", k * d < 0.5);
    setSnap(k * d);
    stage.style.transform = `translate(${ox}px, ${oy}px) scale(${k})`;
    lastOven = lastToast = lastBoard = lastGas = lastDisplay = "";
  }
  /** Khung theo vùng (mobile): luôn thấy đủ [x0..x1] × [y0..y1] cảnh; hệ số giữ bội 0,5 thiết bị khi được. */
  function layoutFit(x0, x1, y0, y1) {
    const w = root.clientWidth, h = root.clientHeight;
    if (!w || !h) return;
    const d = globalThis.devicePixelRatio || 1;
    const cover = Math.max(w / W, h / H);
    let fit = Math.min(w / (x1 - x0), h / (y1 - y0));
    // giữ hệ số bội 0,5 thiết bị (PLAYBOOK §2): phóng lên bội gần nhất nếu chỉ cắt thêm ≤ 25%, không thì thu xuống nếu vẫn phủ kín khung
    const up = Math.ceil(fit * d * 2 - 1e-6) / 2 / d, down = Math.floor(fit * d * 2 + 1e-6) / 2 / d;
    if (up <= fit * 1.25) fit = up; else if (down >= cover) fit = down;
    layout((x0 + x1) / 2, (y0 + y1) / 2, Math.max(1, fit / cover), true);
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
  function bakerFrame(t, sh) {
    const now = performance.now();
    let seq = "idle";
    if (now < actUntil) seq = actName;
    else if (sh?.boards.some((b) => b.loaf && !b.loaf.wrap)) seq = "slice";
    const n = seq === "idle" ? 2 : seq === "wrap" || seq === "change" ? 2 : 4;
    const f = atlas.frame("baker", `baker-${seq}-${Math.floor(t / (seq === "idle" ? 500 : 140)) % n + 1}`) || atlas.frame("baker", "baker-idle-1");
    return f || atlas.frame("chars", "baker");
  }
  /** Chủ tiệm làm một động tác (slice | oven | serve | wrap | change) trong ms. */
  function act(name, ms = 600) { actName = name; actUntil = performance.now() + ms; }

  function update(state, opts = {}) {
    const sh = state.shift, t = sh ? sh.t : performance.now();
    const fb = bakerFrame(t, sh), bs = charScale(fb);
    paint(bakerEl, fb, bs); placeAt(bakerEl, fb, P.baker[0], P.baker[1], bs);
    bakerEl.style.visibility = sh?.away ? "hidden" : "";
    // lò: trạng thái theo mẻ đầu tiên đang nướng
    const b0 = sh?.oven.find(Boolean);
    const lv = b0 ? batchLevel(state, b0) : null;
    const ovenName = !b0 ? "oven-mini-cold" : lv === "burnt" ? `oven-mini-smoke-${Math.floor(t / 250) % 2 + 1}` : lv === "golden" ? "oven-mini-ready" : `oven-mini-baking-${Math.floor(t / 166) % 4 + 1}`;
    if (ovenName !== lastOven) { lastOven = ovenName; const f = atlas.frame("ovens", ovenName); paint(ovenEl, f, 0.5); placeAt(ovenEl, f, P.oven[0], P.oven[1], 0.5); }
    ovenEl.classList.toggle("ready", lv === "golden");
    const toasting = sh?.boards.some((b) => b.loaf && b.loaf.toastT0 !== null);
    const tn = toasting ? `toaster-on-${Math.floor(t / 150) % 4 + 1}` : "toaster-idle";
    if (tn !== lastToast) { lastToast = tn; const f = atlas.frame("equip", tn); paint(toasterEl, f, 0.5); placeAt(toasterEl, f, P.toaster[0], P.toaster[1], 0.5); }
    const bn = sh?.boards[0]?.loaf ? "board-busy" : "board-empty";
    if (bn !== lastBoard) { lastBoard = bn; const f = atlas.frame("equip", bn); paint(boardEl, f, 0.5); placeAt(boardEl, f, P.board[0], P.board[1], 0.5); }
    const gas = state.stock.gas || 0, gn = gas <= 0 ? "gas-tank-empty" : gas < 6 ? "gas-tank-low" : "gas-tank-full";
    if (gn !== lastGas) { lastGas = gn; const f = atlas.frame("equip", gn); paint(gasEl, f, 0.5); placeAt(gasEl, f, P.gas[0], P.gas[1], 0.5); }
    // tủ kính: ổ nhỏ xếp hai hàng (loaf-whole theo mức vỏ)
    const loaves = sh ? sh.case : [];
    const dk = loaves.map((l) => crustOf(l)).join(",");
    if (dk !== lastDisplay) {
      lastDisplay = dk; display.textContent = "";
      loaves.slice(0, 9).forEach((l, i) => {
        const e = el("i", "spr", display); const f = atlas.frame("loaf", "loaf-whole-" + crustOf(l));
        // ba kệ trong tủ kính (điểm chạm P.display là chân tủ): 3 ổ mỗi kệ
        const x = P.display[0] - 30 + (i % 3) * 30, y = P.display[1] - 52 - Math.floor(i / 3) * 24;
        paint(e, f, 0.25); placeAt(e, f, x, y, 0.25);
      });
    }
    // khách
    const live = new Set();
    for (const c of sh?.customers || []) {
      live.add(c.id);
      const n = node(c);
      const [f, flip, bob] = customerFrame(atlas, c, t);
      const [x, y, alpha] = customerPos(c, t, P);
      const cs = charScale(f);
      paint(n.b, f, cs);
      placeAt(n.b, f, x, y - bob * cs, cs);
      n.b.style.zIndex = Math.round(y);
      n.b.style.opacity = alpha;
      n.b.classList.toggle("flip", flip);
      const pinned = sh.boards.some((b) => b.cid === c.id);
      n.b.classList.toggle("active", pinned);
      n.b.classList.toggle("can-pin", c.phase === "wait" && !pinned);
      n.b.classList.toggle("hint", !!opts.hintPin && c.phase === "wait" && !pinned);
      n.b.disabled = c.phase !== "wait";
      n.b.setAttribute("aria-label", `${c.name}${c.phase === "wait" ? ", đang chờ — chạm để ghim phiếu" : ""}`);
      n.b.dataset.phase = c.phase;
      const [sx, sy] = toScreen(x, y - (f ? f.ay * cs : 170) - 10);
      const showSay = c.say && t - c.say.at < BUBBLE_MS;
      n.bubble.hidden = !showSay;
      if (showSay) {
        if (n.sayAt !== c.say.at) { n.sayAt = c.say.at; n.bubble.textContent = c.say.text; n.bubble.classList.remove("pop"); void n.bubble.offsetWidth; n.bubble.classList.add("pop"); }
        n.bubble.style.left = sx + "px"; n.bubble.style.top = sy - 6 + "px";
        n.bubble.classList.toggle("left", sx > root.clientWidth * 0.62);
        n.bubble.classList.toggle("right", sx < root.clientWidth * 0.3);
      }
      const showBar = c.phase === "wait";
      n.bar.hidden = !showBar;
      if (showBar) {
        const p = patienceLeft(state, c);
        n.bar.firstChild.style.width = p * 100 + "%";
        n.bar.className = "pbar" + (p <= 0.35 ? " low" : p <= 0.6 ? " mid" : "");
        n.bar.style.left = sx + "px"; n.bar.style.top = sy + 8 + "px";
      }
      n.tag.hidden = !(c.phase === "wait" || c.phase === "enter" || c.phase === "pay") || showSay;
      n.tag.textContent = c.phase === "pay" ? "Chờ thối tiền" : pinned ? "Đang ráp" : c.items.length > 1 ? `${c.name} · ${c.items.length} ổ` : c.name;
      n.tag.classList.toggle("on", pinned || c.phase === "pay");
      n.tag.style.left = sx + "px"; n.tag.style.top = sy - 16 + "px";
    }
    for (const [id, n] of nodes) if (!live.has(id)) { n.b.remove(); n.bubble.remove(); n.bar.remove(); n.tag.remove(); nodes.delete(id); }
  }
  /** Hiệu ứng một lượt (clip fx manifest) tại toạ độ cảnh; chưa có clip thì bỏ qua. */
  function burst(clipName, x, y, scale = 1, reduced = false) {
    const clip = atlas.clip("fx", clipName);
    if (!clip || reduced) return;
    const e = el("div", "spr fxspr", fx);
    let i = 0;
    const stepF = () => { if (i >= clip.frames.length) { e.remove(); return; } const f = atlas.frame("fx", clip.frames[i++]); paint(e, f, scale); placeAt(e, f, x, y, scale); setTimeout(stepF, 1000 / clip.fps); };
    stepF();
  }
  const posOf = (state, cid) => { const c = state.shift?.customers.find((q) => q.id === cid); return c ? customerPos(c, state.shift.t, P) : null; };
  function visibleRect() { const w = root.clientWidth, h = root.clientHeight; return { x0: Math.max(0, -ox / k), x1: Math.min(W, (w - ox) / k), y0: Math.max(0, -oy / k), y1: Math.min(H, (h - oy) / k) }; }
  return { update, layout, layoutFit, toScreen, burst, posOf, act, visibleRect, points: P, get scale() { return k; } };
}
