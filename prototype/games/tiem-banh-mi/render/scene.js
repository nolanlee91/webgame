// Cảnh 1280×720: xe đẩy (cart-scene, cấp 1–6) hoặc tiệm (shop-scene, cấp 7+ sau khi thuê). DOM sprite theo atlas, vẽ lại mỗi khung từ trạng thái.
// Lớp: nền → chủ tiệm sau quầy → lớp che (cart-foreground / shop-counter-foreground) → đồ trên quầy (lò, lò than, hũ, thớt, tủ kính)
// → trang trí (tiệm) → khách (theo y) → bong bóng thoại / thanh kiên nhẫn (lớp UI không phóng theo cảnh, chữ luôn đọc được).
// Toạ độ lấy từ manifest placements (Codex ghi), không thì theo dự phòng ở data/shift.js (CART, SHOP).
// Bong bóng thoại không bao giờ che mặt chủ tiệm: thử trên đầu khách, rồi bên phải, bên trái; chọn chỗ không chạm vùng mặt chủ tiệm.
// Tủ kính: đợt 2 có tủ trống (fixtures "cart-display-empty") + ô xếp bánh placements["cart-display"].stockSlots ⇒ code vẽ từng ổ theo mức vỏ
// vào đúng ô. Tủ tiệm chưa có ô xếp thì đổi frame "display-case-*" theo số ổ (trống / ít / đầy). Chưa có fixtures thì không vẽ ổ chồng lên tranh
// (tranh đợt 1 đã vẽ sẵn bánh). Luôn có nhãn số ổ + độ giòn trung bình ở lớp UI.
// Đợt 2 còn: bảng hiệu bậc 1–3, dây xếp hàng, bàn phụ việc (fixtures), trang trí (decor, vị trí mặc định placements[id]), mưa (weather-fx).
import { paint, placeAt, setSnap } from "./atlas.js?v=b14";
import { CART, SHOP, WALK_MS, ORDER_ANIM_MS, BUBBLE_MS } from "../data/shift.js?v=b14";
import { DECOR } from "../data/equipment.js?v=b14";
import { patienceLeft } from "../core/shift.js?v=b14";
import { batchLevel } from "../core/oven.js?v=b14";
import { placeOf } from "../core/progress.js?v=b14";
import { crustOf } from "./loafview.js?v=b14";
import { orderQueue, exitRoute, entryRoute, along } from "../core/placements.js?v=b14";

const W = 1280, H = 720;
const lerp = (a, b, p) => a + (b - a) * p;
const ease = (p) => p * p * (3 - 2 * p);
function el(tag, cls, parent) { const e = document.createElement(tag); if (cls) e.className = cls; parent?.appendChild(e); return e; }

/** Cảnh Bánh Mì vẽ cận (PLAYBOOK §1.2b): ô nhân vật mục tiêu 288 px (asset-spec 216×288); ô nhỏ hơn hiện bội 0,5 gần nhất. */
export const CHAR_H = 288;
export const charScale = (f) => (f ? Math.max(1, Math.round((CHAR_H / f.h) * 2) / 2) : 1);

const pt = (v) => (Array.isArray(v) && typeof v[0] === "number" ? v : Array.isArray(v?.at) ? v.at : null);
const pts = (v) => (Array.isArray(v) && Array.isArray(v[0]) ? v : Array.isArray(v?.spots) ? v.spots : Array.isArray(v?.points) ? v.points : null);
export function scenePoints(placements = {}) {
  const at = (k, d) => pt(placements[k]) || d;
  return {
    mode: "cart", entry: at("cartEntry", CART.entry), queue: orderQueue(pts(placements.cartQueueSpots) || CART.queue, at("cart-baker", CART.baker), at("cartEntry", CART.entry)), exit: pts(placements.cartExitPath) || CART.exit,
    baker: at("cart-baker", CART.baker), oven: at("cart-oven", CART.oven), toaster: at("cart-toaster", CART.toaster), sauce: at("cart-sauce-bottles", CART.sauce),
    pate: at("cart-pate-jar", CART.pate), boards: [at("cart-board", CART.board)], pickle: at("cart-pickle-jar", CART.pickle), herb: at("cart-herb-basket", CART.herb),
    display: at("cart-display", CART.display), slots: placements["cart-display"]?.stockSlots || null, paper: at("cart-paper-stack", CART.paper), cash: at("cart-cash-tin", CART.cash), gas: at("cart-gas-tank", CART.gas), tea: at("cart-tea-jug", CART.tea),
  };
}
export function shopPoints(placements = {}) {
  const at = (k, d) => pt(placements[k]) || d;
  return {
    mode: "shop", entry: pt(placements.door) || SHOP.door, queue: orderQueue(pts(placements.queueSpots) || SHOP.queue, at("baker", SHOP.baker), pt(placements.door) || SHOP.door), exit: pts(placements.exitPath) || SHOP.exit,
    baker: at("baker", SHOP.baker), oven: at("oven", SHOP.oven), toaster: at("toaster", SHOP.toaster), grill: at("grill", SHOP.grill), pot: at("xiu-mai-pot", SHOP.pot), pan: at("egg-pan", SHOP.pan),
    sauce: at("sauce-bottles", SHOP.sauce), pate: at("pate-jar", SHOP.pate), butter: at("butter-tub", SHOP.butter), mayo: at("mayo-bottle", SHOP.mayo), chili: at("chili-bowl", SHOP.chili),
    boards: [at("board-1", SHOP.boards[0]), at("board-2", SHOP.boards[1]), at("board-3", SHOP.boards[2])], pickle: at("pickle-jar", SHOP.pickle), herb: at("herb-basket", SHOP.herb),
    display: at("display-case", SHOP.display), slots: placements["display-case"]?.stockSlots || null, sign: [at("signboard-1", SHOP.sign), at("signboard-2", SHOP.sign), at("signboard-3", SHOP.sign)],
    rope: at("queue-rope", [1100, 690]), helper: at("helper-station", [700, 500]), cash: at("cash-tin", SHOP.cash), paper: at("paper-stack", SHOP.paper), bag: at("bag-hook", SHOP.bag), gas: at("gas-tank", SHOP.gas), tea: at("tea-jug", SHOP.tea),
  };
}

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
/** Vị trí khách: đi vào theo entryRoute (tiệm: đi ngược lối ra, không cắt qua quầy), đứng đúng chỗ queueSpots theo thứ tự hàng, ra theo exitRoute. */
export function customerPos(c, t, P) {
  const spot = P.queue[c.spot] || P.queue[P.queue.length - 1];
  if (c.phase === "enter") return [...along(entryRoute(spot, P.exit, P.entry), ease(Math.min(1, (t - c.t0) / WALK_MS))), 1];
  if (c.phase === "leave") {
    const p = Math.min(1, (t - (c.leaveT ?? t)) / WALK_MS);
    return [...along(exitRoute(spot, P.exit), p), p > 0.85 ? (1 - p) / 0.15 : 1];
  }
  return [spot[0], spot[1], 1];
}
const overlap = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;

export function createScene(root, atlas, { onCustomer, avoid = () => [] }) {
  root.textContent = "";
  const stage = el("div", "stage", root);
  stage.style.width = W + "px"; stage.style.height = H + "px";
  const ui = el("div", "scene-ui", root);
  const caseTag = el("div", "ctag case-tag", ui);
  let P = scenePoints(atlas.placements), mode = "", k = 1, ox = 0, oy = 0, actUntil = 0, actName = "idle", lastCam = null;
  const nodes = new Map();
  let S = {}; // phần tử của cảnh hiện tại
  const last = {};

  const put = (parent, alias, name, at, scale, cls = "spr") => { const e = el("div", cls, parent); const f = atlas.frame(alias, name); paint(e, f, scale); placeAt(e, f, at[0], at[1], scale); e.hidden = !f; return e; };
  /** Dựng lớp tĩnh của cảnh (xe đẩy / tiệm). Gọi lại khi lên tiệm. */
  function build(m, state) {
    mode = m;
    for (const n of nodes.values()) { n.b.remove(); n.bubble.remove(); n.bar.remove(); n.tag.remove(); }
    nodes.clear();
    stage.textContent = "";
    P = m === "shop" ? shopPoints(atlas.placements) : scenePoints(atlas.placements);
    const layer = (alias, file) => {
      const img = el("img", "layer", stage); img.alt = ""; img.width = W; img.height = H; img.draggable = false;
      const real = atlas.sheet(alias); const f = real ? null : atlas.frame(alias, "scene");
      img.src = real ? atlas.base + file : f ? f.url : "";
      if (!img.src) img.hidden = true;
      img.dataset.layer = alias;
      return img;
    };
    S = {};
    layer(m === "shop" ? "shop" : "cart", m === "shop" ? "assets/shop-scene.webp" : "assets/cart-scene.webp");
    S.decor = el("div", "decor-layer", stage);
    if (m === "shop") { S.sign = el("div", "spr", stage); S.helper = el("div", "spr", stage); }
    S.baker = el("div", "spr baker", stage);
    layer(m === "shop" ? "shopFg" : "cartFg", m === "shop" ? "assets/shop-counter-foreground.webp" : "assets/cart-foreground.webp");
    S.oven = el("div", "spr oven", stage);
    S.toaster = el("div", "spr", stage);
    put(stage, "equip", "sauce-bottles", P.sauce, 0.5);
    put(stage, "equip", "pate-jar", P.pate, 0.5);
    if (m === "shop") { put(stage, "equip", "butter-tub", P.butter, 0.5); put(stage, "equip", "mayo-bottle", P.mayo, 0.5); put(stage, "equip", "chili-bowl", P.chili, 0.5); put(stage, "equip", "bag-hook", P.bag, 0.5); }
    S.boards = P.boards.map(() => el("div", "spr", stage));
    put(stage, "equip", "pickle-jar", P.pickle, 0.5);
    put(stage, "equip", "herb-basket", P.herb, 0.5);
    put(stage, "equip", "paper-stack", P.paper, 0.5);
    put(stage, "equip", "cash-tin", P.cash, 0.5);
    S.tea = put(stage, "equip", "tea-jug", P.tea, 0.5);
    S.gas = el("div", "spr", stage);
    S.extras = { grill: el("div", "spr", stage), pot: el("div", "spr", stage), pan: el("div", "spr", stage) };
    S.display = el("div", "display", stage);
    if (m === "shop") S.rope = el("div", "spr", stage);
    S.weather = el("div", "spr weather", stage);
    S.crowd = el("div", "crowd", stage);
    S.fx = el("div", "fx", stage);
    root.dataset.mode = m;
    for (const key of Object.keys(last)) delete last[key];
    if (lastCam) relayout();
    if (state) update(state, {});
  }

  /** Camera: phủ kín khung × zoom, canh giữa (camX, camY), không lộ mép. Hệ số phóng lên bội 0,5 thiết bị nếu chỉ cắt mép ≤ 25%. */
  function layout(camX = 640, camY = 380, zoom = 1, exact = false) {
    lastCam = { kind: "layout", args: [camX, camY, zoom, exact] };
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
    for (const key of Object.keys(last)) delete last[key];
  }
  /** Khung theo vùng (mobile): luôn thấy đủ [x0..x1] × [y0..y1] cảnh; hệ số giữ bội 0,5 thiết bị khi được. */
  function layoutFit(x0, x1, y0, y1) {
    const w = root.clientWidth, h = root.clientHeight;
    if (!w || !h) return;
    const d = globalThis.devicePixelRatio || 1;
    const cover = Math.max(w / W, h / H);
    let fit = Math.min(w / (x1 - x0), h / (y1 - y0));
    const up = Math.ceil(fit * d * 2 - 1e-6) / 2 / d, down = Math.floor(fit * d * 2 + 1e-6) / 2 / d;
    // ưu tiên thu xuống bội 0,5 gần nhất để thấy trọn vùng (chủ tiệm + chỗ đứng đầu hàng); chỉ phóng lên khi thu xuống lộ mép cảnh
    if (down >= cover) fit = down; else if (up <= fit * 1.25) fit = up;
    layout((x0 + x1) / 2, (y0 + y1) / 2, Math.max(1, fit / cover), true);
    lastCam = { kind: "fit", args: [x0, x1, y0, y1] };
  }
  function relayout() { if (!lastCam) return; if (lastCam.kind === "fit") layoutFit(...lastCam.args); else layout(...lastCam.args); }
  /** Vùng cần thấy trên mobile: chủ tiệm + hai chỗ đứng đầu hàng (+ lò ở xe đẩy). "queue" = lia sang hàng chờ. */
  function region(kind = "work") {
    const q0 = P.queue[0], q1 = P.queue[1] || q0, b = P.baker;
    if (kind === "queue") { const qs = P.queue.slice(0, 4); return [Math.min(...qs.map((p) => p[0])) - 140, Math.max(...qs.map((p) => p[0])) + 140, Math.min(...qs.map((p) => p[1])) - 300, Math.max(...qs.map((p) => p[1])) + 30]; }
    const xs = [b[0], q0[0], q1[0], P.oven[0]], ys = [b[1] - 260, q0[1] - 280, q0[1] + 30];
    return [Math.max(0, Math.min(...xs) - 120), Math.min(W, Math.max(...xs) + 120), Math.max(0, Math.min(...ys) - 90), Math.min(H, Math.max(...ys))]; // −90: chừa chỗ HUD / viên Lò trên đầu
  }
  const toScreen = (x, y) => [ox + x * k, oy + y * k];

  function node(c) {
    let n = nodes.get(c.id);
    if (n) return n;
    const b = el("button", "cust spr", S.crowd);
    b.type = "button"; b.dataset.cid = c.id;
    b.addEventListener("click", () => onCustomer(c.id));
    const bubble = el("div", "bubble", ui); bubble.hidden = true;
    const bar = el("div", "pbar", ui); el("i", "", bar);
    const tag = el("div", "ctag", ui);
    n = { b, bubble, bar, tag, sayAt: -1, side: "" };
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
  function act(name, ms = 600) { actName = name; actUntil = performance.now() + ms; }
  const setSpr = (key, e, alias, name, at, scale = 0.5) => { if (last[key] === name) return; last[key] = name; const f = atlas.frame(alias, name); paint(e, f, scale); placeAt(e, f, at[0], at[1], scale); e.hidden = !f; };

  let bakerFace = { x0: 0, x1: 0, y0: 0, y1: 0 };
  /** Đặt bong bóng: trên đầu → bên phải → bên trái (theo phía xa chủ tiệm trước); không chạm mặt chủ tiệm, không tràn khung. */
  let blocks = [];
  /** Đặt bong bóng: trên đầu → bên xa chủ tiệm → bên kia; không chạm mặt chủ tiệm, không đè HUD / viên Lò (avoid()), không tràn khung. */
  function placeBubble(n, hx, hy, headW) {
    const bw = n.bubble.offsetWidth || 200, bh = n.bubble.offsetHeight || 40, w = root.clientWidth, h = root.clientHeight;
    const awayRight = hx >= (bakerFace.x0 + bakerFace.x1) / 2;
    const hudBottom = blocks.reduce((a, r) => Math.max(a, r.y1), 0);
    const side = (right) => (right ? { side: "right", x0: hx + headW * 0.55, y0: hy - bh * 0.2 } : { side: "left", x0: hx - headW * 0.55 - bw, y0: hy - bh * 0.2 });
    const cands = [
      { side: "top", x0: hx - bw / 2, y0: hy - 8 - bh }, side(awayRight), side(!awayRight),
      { side: "top", x0: hx - bw / 2, y0: Math.min(hy - 8 - bh, bakerFace.y0 - bh - 6) },
      side(awayRight), side(!awayRight), // lượt 2: hạ xuống dưới HUD
    ];
    const box = (c, i) => { const r = { x0: Math.max(4, Math.min(w - bw - 4, c.x0)), y0: Math.max(2, c.y0) }; if (i >= 4) r.y0 = Math.max(r.y0, hudBottom + 4); r.x1 = r.x0 + bw; r.y1 = r.y0 + bh; return r; };
    let pick = null;
    for (let i = 0; i < cands.length && !pick; i++) { const r = box(cands[i], i); if (!overlap(r, bakerFace) && r.y1 <= h && !blocks.some((b) => overlap(r, b))) pick = { ...cands[i], r }; }
    if (!pick) { const r = box(cands[1], 4); pick = { ...cands[1], r }; }
    n.bubble.style.left = pick.r.x0 + "px"; n.bubble.style.top = pick.r.y0 + "px";
    n.rect = pick.r;
    if (n.side !== pick.side) { n.bubble.dataset.side = pick.side; n.side = pick.side; }
    const tail = Math.max(10, Math.min(bw - 10, hx - pick.r.x0));
    n.bubble.style.setProperty("--tail", tail + "px");
  }

  function update(state, opts = {}) {
    const want = state.shop ? "shop" : "cart";
    if (want !== mode) { build(want, null); }
    const sh = state.shift, t = sh ? sh.t : performance.now();
    const fb = bakerFrame(t, sh), bs = charScale(fb);
    paint(S.baker, fb, bs); placeAt(S.baker, fb, P.baker[0], P.baker[1], bs);
    S.baker.style.visibility = sh?.away ? "hidden" : "";
    { // vùng mặt chủ tiệm trên màn (đầu + vai): bong bóng khách tránh vùng này
      const top = P.baker[1] - (fb ? fb.ay * bs : 250), [x0, y0] = toScreen(P.baker[0] - 70, top - 6), [x1, y1] = toScreen(P.baker[0] + 70, top + 120);
      bakerFace = { x0, y0, x1, y1 };
    }
    // lò: theo mẻ đầu tiên đang nướng; tiệm dùng lò gas / điện
    const ovenId = mode === "shop" ? (state.oven === "electric" ? "oven-electric" : "oven-gas") : "oven-mini";
    const b0 = sh?.oven.find(Boolean);
    const lv = b0 ? batchLevel(state, b0) : null;
    const ovenName = !b0 ? `${ovenId}-cold` : lv === "burnt" ? `${ovenId}-smoke-${Math.floor(t / 250) % 2 + 1}` : lv === "golden" ? `${ovenId}-ready` : `${ovenId}-baking-${Math.floor(t / 166) % 4 + 1}`;
    setSpr("oven", S.oven, "ovens", ovenName, P.oven);
    S.oven.classList.toggle("ready", lv === "golden");
    const toasting = sh?.boards.some((b) => b.loaf && b.loaf.toastT0 !== null);
    setSpr("toaster", S.toaster, "equip", toasting ? `toaster-on-${Math.floor(t / 150) % 4 + 1}` : "toaster-idle", P.toaster);
    S.boards.forEach((e, i) => {
      const bd = sh?.boards[i];
      const show = i === 0 || (sh ? i < sh.boards.length : (state.owned?.[i === 1 ? "board-2" : "board-3"] || false));
      e.hidden = !show;
      if (show) setSpr("board" + i, e, "equip", bd?.loaf ? (bd.loaf.n > 1 && atlas.has("equip", "long-board") ? "long-board" : "board-busy") : "board-empty", P.boards[i]);
    });
    if (mode === "shop") {
      S.extras.grill.hidden = !state.owned?.grill; if (state.owned?.grill) setSpr("grill", S.extras.grill, "equip", "grill-idle", P.grill);
      S.extras.pot.hidden = !state.owned?.["xiu-mai-pot"]; if (state.owned?.["xiu-mai-pot"]) setSpr("pot", S.extras.pot, "equip", sh ? `xiu-mai-pot-steam-${Math.floor(t / 300) % 3 + 1}` : "xiu-mai-pot-idle", P.pot);
      S.extras.pan.hidden = !state.owned?.["egg-pan"]; if (state.owned?.["egg-pan"]) setSpr("pan", S.extras.pan, "equip", "egg-pan-idle", P.pan);
    } else for (const e of Object.values(S.extras)) e.hidden = true;
    S.tea.hidden = mode === "shop" && !state.owned?.["tea-jug"];
    const gas = state.stock.gas || 0;
    setSpr("gas", S.gas, "equip", gas <= 0 ? "gas-tank-empty" : gas < 6 ? "gas-tank-low" : "gas-tank-full", P.gas);
    // tủ kính: frame fixtures đợt 2 nếu có; tranh đợt 1 đã vẽ sẵn bánh ⇒ không vẽ ổ nhỏ chồng
    const loaves = sh ? sh.case : [];
    const fix = mode === "shop" ? (state.owned?.["warm-case"] ? "display-case-warm" : "display-case") : "cart-display";
    const lvl = loaves.length === 0 ? "empty" : loaves.length <= 4 ? "low" : "full";
    const slots = P.slots ? P.slots.flat() : null;
    const useSlots = slots && atlas.has("fixtures", `${fix}-empty`);
    const dk = useSlots ? fix + loaves.slice(0, slots.length).map((l) => crustOf(l)).join(",") : fix + lvl;
    if (last.display !== dk) {
      last.display = dk; S.display.textContent = "";
      if (useSlots) {
        put(S.display, "fixtures", `${fix}-empty`, P.display, 0.5);
        // ô thấp nhất trước (hàng dưới cùng của tủ)
        const order = slots.map((p, i) => [p, i]).sort((a, b) => b[0][1] - a[0][1] || a[0][0] - b[0][0]);
        loaves.slice(0, slots.length).forEach((l, i) => { const at = order[i][0]; put(S.display, "loaf", "loaf-whole-" + crustOf(l), [at[0], at[1] + 5], 0.125, "spr loafmini"); }); // ô xếp ~22 px: ổ nhỏ, tâm ổ đặt ở ô
      } else if (atlas.has("fixtures", `${fix}-${lvl}`)) put(S.display, "fixtures", `${fix}-${lvl}`, P.display, 0.5);
    }
    if (sh) {
      const [cx, cy] = toScreen(P.display[0], P.display[1] - 70);
      const avg = loaves.length ? Math.round(loaves.reduce((a, l) => a + l.crisp, 0) / loaves.length) : 0;
      const txt = loaves.length ? `Tủ ${loaves.length} ổ · giòn ${avg}` : "Tủ trống";
      if (caseTag.textContent !== txt) caseTag.textContent = txt;
      caseTag.style.left = cx + "px"; caseTag.style.top = cy + "px";
      caseTag.className = "ctag case-tag" + (loaves.length && avg < 50 ? " low" : "");
    }
    caseTag.hidden = !sh;
    if (mode === "shop") {
      const sg = state.owned?.["signboard-3"] ? 3 : state.owned?.["signboard-2"] ? 2 : 1;
      setSpr("sign", S.sign, "fixtures", `signboard-${sg}`, P.sign[sg - 1]);
      S.rope.hidden = !state.owned?.["queue-rope"]; if (state.owned?.["queue-rope"]) setSpr("rope", S.rope, "fixtures", "queue-rope", P.rope);
      const hp = !!(sh && (state.helperDay === state.day || (sh.helperUntil || 0) > sh.t));
      S.helper.hidden = !hp; if (hp) setSpr("helper", S.helper, "fixtures", "helper-station", P.helper);
    }
    const rain = state.weather?.kind === "rain" && state.weather.day === state.day && !!sh;
    S.weather.hidden = !rain || opts.reduced;
    if (rain && !opts.reduced) setSpr("weather", S.weather, "weather", `rain-${Math.floor(t / 120) % 4 + 1}`, [0, 0], 2);
    // trang trí (tiệm): theo vị trí đã kéo thả
    if (mode === "shop") {
      const dkey = JSON.stringify([Object.keys(DECOR).filter((id) => state.owned?.[id]), state.placement]);
      if (last.decor !== dkey) {
        last.decor = dkey; S.decor.textContent = "";
        for (const id of Object.keys(DECOR)) if (state.owned?.[id]) { const at = decorAt(state, id); const e = put(S.decor, "decor", id, at, 0.5, "spr decor"); e.dataset.decor = id; }
      }
    } else if (last.decor !== "") { last.decor = ""; S.decor.textContent = ""; }
    // khách (đơn đặt trước không đứng hàng chờ)
    const live = new Set();
    blocks = sh ? avoid() : [];
    for (const c of sh?.customers || []) {
      if (c.pre || c.spot < 0) continue;
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
      const headY = y - (f ? f.ay * cs : 250);
      const [sx, sy] = toScreen(x, headY);
      const headW = (f ? f.w * cs * 0.5 : 120) * k;
      const showSay = c.say && t - c.say.at < BUBBLE_MS;
      n.bubble.hidden = !showSay;
      if (showSay) {
        if (n.sayAt !== c.say.at) { n.sayAt = c.say.at; n.bubble.textContent = c.say.text; n.bubble.classList.remove("pop"); void n.bubble.offsetWidth; n.bubble.classList.add("pop"); }
        placeBubble(n, sx, sy + 26 * k, headW);
      }
      const showBar = c.phase === "wait";
      n.bar.hidden = !showBar;
      if (showBar) {
        const p = patienceLeft(state, c);
        n.bar.firstChild.style.width = p * 100 + "%";
        n.bar.className = "pbar" + (p <= 0.35 ? " low" : p <= 0.6 ? " mid" : "");
        n.bar.style.left = sx + "px"; n.bar.style.top = sy + 30 * k + "px";
      }
      n.tag.hidden = !(c.phase === "wait" || c.phase === "enter" || c.phase === "pay") || showSay;
      n.tag.textContent = c.phase === "pay" ? "Chờ thối tiền" : pinned ? "Đang ráp" : c.items.length > 1 ? `${c.name} · ${c.items.length} ổ` : c.name;
      n.tag.classList.toggle("on", pinned || c.phase === "pay");
      n.tag.style.left = sx + "px"; n.tag.style.top = sy + 18 * k + "px";
    }
    for (const [id, n] of nodes) if (!live.has(id)) { n.b.remove(); n.bubble.remove(); n.bar.remove(); n.tag.remove(); nodes.delete(id); }
  }
  function burst(clipName, x, y, scale = 1, reduced = false) {
    const clip = atlas.clip("fx", clipName);
    if (!clip || reduced || !S.fx) return;
    const e = el("div", "spr fxspr", S.fx);
    let i = 0;
    const stepF = () => { if (i >= clip.frames.length) { e.remove(); return; } const f = atlas.frame("fx", clip.frames[i++]); paint(e, f, scale); placeAt(e, f, x, y, scale); setTimeout(stepF, 1000 / clip.fps); };
    stepF();
  }
  const posOf = (state, cid) => { const c = state.shift?.customers.find((q) => q.id === cid); return c && !c.pre ? customerPos(c, state.shift.t, P) : null; };
  function visibleRect() { const w = root.clientWidth, h = root.clientHeight; return { x0: Math.max(0, -ox / k), x1: Math.min(W, (w - ox) / k), y0: Math.max(0, -oy / k), y1: Math.min(H, (h - oy) / k) }; }
  /** Toạ độ màn hình ⇒ toạ độ cảnh (kéo thả trang trí). */
  const toScene = (sx, sy) => [(sx - ox) / k, (sy - oy) / k];
  /** Vị trí trang trí: đã kéo thả > mặc định Codex (placements[id]) > mặc định code. */
  const decorAt = (state, id) => state.placement?.[id] || pt(atlas.placements[id]) || placeOf(state, id);
  build("cart", null);
  return { update, layout, layoutFit, region, toScreen, toScene, burst, posOf, act, visibleRect, get points() { return P; }, decorAt, get mode() { return mode; }, get scale() { return k; }, get bakerFace() { return bakerFace; } };
}
