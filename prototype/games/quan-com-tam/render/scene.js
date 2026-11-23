// Cảnh 1280×720: quán vỉa hè (street-scene, cấp 1–6) hoặc quán có mái (quan-scene, cấp 7+). DOM sprite theo atlas, vẽ lại mỗi khung từ trạng thái.
// Lớp: nền → cô chủ khi đứng sau quầy → lớp che quầy (*-foreground) → đồ trên quầy (bếp + miếng trên vỉ, nồi cơm, hũ, chồng dĩa…)
// → sàn (bàn, ghế, khách ngồi, khách đứng, cô chủ khi ra sàn) sắp theo y chân → lớp UI không phóng (bong bóng, nhãn bàn, nút chạm bàn).
// Toạ độ từ core/placements.js (manifest placements → dự phòng data/scene.js). Camera: hệ số bội 0,5 thiết bị (PLAYBOOK §2), snap lưới 2 px.
// Khách ngồi: frame <vai>-sit-* vẽ quay phải; ghế face "left" ⇒ lật ngang quanh anchor (vẫn snap). Bong bóng nền đục, đặt bằng placeBubble.
import { paint, placeAt, setSnap } from "./atlas.js?v=c3";
import { scenePoints, along, guestIn, guestToSeat, shipperIn, ownerRoute, alongDist } from "../core/placements.js?v=c3";
import { itemFrame, heatKey, zoneOf, isCooked } from "../core/grill.js?v=c3";
import { patienceLeft, tableJob, availableTables, allServed } from "../core/tables.js?v=c3";
import { seatSpotsFor, decorAt, isFamous, rainToday } from "../core/progression.js?v=c3"; // A: bàn ghép, trang trí (V: + mưa)
import { decorFrame } from "../core/extras.js?v=c3"; // S: frame tạm cho đồ trang trí Drama tặng

const W = 1280, H = 720;
export const BUBBLE_MS = 3600;
const ease = (p) => p * p * (3 - 2 * p);
function el(tag, cls, parent) { const e = document.createElement(tag); if (cls) e.className = cls; parent?.appendChild(e); return e; }

/** Cảnh vẽ cận (PLAYBOOK §1.2b): ô nhân vật mục tiêu 288 px (asset-spec 216×288). Ô nhỏ hơn hiện bội 0,5 gần nhất. */
export const CHAR_H = 288;
export const charScale = (f) => (f ? Math.max(1, Math.round((CHAR_H / f.h) * 2) / 2) : 1);

/** A: hệ số hiện thiết bị / ly trà là dữ liệu theo sheet (data/scene.js SHEET_SCALE → atlas.scaleOf): bản đợt 1 vẽ to ⇒ ×0,5,
 *  bản Codex vẽ đúng thước sau này ⇒ ×1 tự động. Ghế, dĩa đang ăn, bàn, bếp, món trên vỉ hiện ×1. Đều là bội 0,5 ⇒ vẫn nét. */
const scaleOf = (atlas, alias, name) => (atlas.scaleOf ? atlas.scaleOf(alias, name) : 1);
export const JOB_LABEL = { seat: "Mời ngồi", visit: "Châm trà · lấy phiếu", bill: "Tính tiền", clean: "Dọn bàn", rice: "Thêm cơm" };
/** V: nhãn bàn ngắn cho khung cảnh hẹp (390 px: nút bàn chỉ ~90 px, nhãn dài đè nhãn bàn bên cạnh). */
const JOB_SHORT = { visit: "Lấy phiếu" };
/** V: vật dụng quán (fixtures.webp) → lớp vẽ. Toạ độ: manifest placements (street- cho vỉa hè), không có toạ độ thì không vẽ. */
const FIXTURES = [["lantern-string", "back"], ["menu-board", "back"], ["signboard", "back"], ["awning", "back"], ["takeaway-shelf", "back"],
  ["helper-station", "behind"], ["wash-station", "behind"], ["glass-case", "counter"], ["queue-bench", "floor"]];
/** V: khung trời nhìn được từ trong quán (quan-scene: cửa sổ trái, cửa sau phải) — mưa chỉ rơi trong hai khung này. */
const QUAN_SKY = ["inset(118px 1010px 352px 44px)", "inset(118px 56px 268px 1030px)"];
const WX_CLIP = { rain: ["rain-1", "rain-2", "rain-3", "rain-4"], flood: ["flood-1", "flood-2"], smoke: ["smoke-1", "smoke-2", "smoke-3"], bolt: ["lightning-1", "lightning-2"] };

/** Frame khách đứng / đi. */
export function standFrame(atlas, role, g, t, k = 0) {
  if (g.phase === "enter" || g.phase === "leave" || g.phase === "toTable") {
    const f = atlas.frame("walks", `${role}-walk-${(Math.floor(t / 125) + k) % 4 + 1}`);
    return f || atlas.frame("chars", role);
  }
  if (g.arriveT !== null && t - g.arriveT < 1200) return atlas.frame("actions", `${role}-order-${t - g.arriveT < 600 ? 1 : 2}`) || atlas.frame("chars", role);
  if (g.mood === "impatient") return atlas.frame("reactions", `${role}-impatient`) || atlas.frame("chars", role);
  return atlas.frame("reactions", `${role}-waiting`) || atlas.frame("chars", role);
}
/** Frame khách ngồi: ăn (2 khung lặp) · gọi (vẫy tay) · khó chịu · vui · chờ. */
export function seatFrame(atlas, s, g, m, t) {
  const role = m.role;
  let pose = "wait";
  if (g.paid) pose = "happy";
  else if (m.plate && !m.eaten) pose = `eat-${Math.floor(t / 250) % 2 + 1}`;
  else if (g.billT !== null || (m.tea === "empty" && m.plate) || m.req) pose = "call";
  else if (g.orderT === null && t - g.seatT > 9000) pose = "call";
  else if (patienceLeft(s, g) < 0.35) pose = "annoyed";
  if (m.score?.mistakes?.length && m.plate && !m.eaten && pose.startsWith("eat") && Math.floor(t / 1200) % 3 === 0) pose = "annoyed";
  return atlas.frame("seated", `${role}-sit-${pose}`) || atlas.frame("reactions", `${role}-waiting`) || atlas.frame("chars", role);
}
const overlap = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
/** V: chỗ ngồi hiển thị. Bàn 4: hai ghế cùng bên (so le) trong manifest chỉ cách nhau ~5 px ngang, ~26 px dọc ⇒ người ngồi sau bị người
 *  ngồi trước che kín đầu. Người ngồi ghế sau dời vào phía bàn + lùi lên (sau mép bàn), đầu lộ trên vai người trước. Ghế trống vẽ cùng chỗ. */
export const SEAT_BACK = [60, -42];
export function seatDisplay(tp, i) {
  const sp = tp?.seatSpots?.[i];
  if (!sp) return null;
  if (tp.seats !== 4) return [sp.at[0], sp.at[1]];
  const mate = tp.seatSpots.find((o, j) => j !== i && o.face === sp.face && Math.abs(o.at[0] - sp.at[0]) < 90);
  if (!mate || mate.at[1] <= sp.at[1]) return [sp.at[0], sp.at[1]];
  const dir = sp.face === "left" ? -1 : 1;
  return [sp.at[0] + dir * SEAT_BACK[0], sp.at[1] + SEAT_BACK[1]];
}
/** V: hàng chờ hiển thị: từ cửa lùi dọc tường sau, cách nhau 90 px cảnh (người đứng rộng ~106 px: đầu người sau không bị người trước che),
 *  so le 6 px. i = chỗ chờ (core); người không có chỗ (nhóm đông dồn vào) nối tiếp phía sau. */
export const QUEUE_GAP = 90;
export function waitDisplay(P, i) {
  const first = P.waitSpots[0] || P.entry;
  if (P.stage !== "quan") { const sp = P.waitSpots[i]; if (sp) return [sp[0], sp[1]]; return [first[0] - i * QUEUE_GAP, first[1] + (i % 2) * 8]; }
  return [Math.round(first[0] + 12 - i * QUEUE_GAP), first[1] - 2 + (i % 2) * 6];
}

export function createScene(root, atlas, { onTable, onGroup, avoid = () => [] }) {
  root.textContent = "";
  const stage = el("div", "stage", root);
  stage.style.width = W + "px"; stage.style.height = H + "px";
  const ui = el("div", "scene-ui", root);
  let P = scenePoints("street"), mode = "", k = 1, ox = 0, oy = 0, lastCam = null;
  let S = {};
  const last = {};
  const cust = new Map(); // khoá "g<id>m<idx>" → { e }
  const tableEls = new Map();
  const groupUi = new Map();
  let selGid = null;
  let actName = "idle", actUntil = 0, ownerFace = 1, ownerPrev = null;

  const put = (parent, alias, name, at, scale = 1, cls = "spr") => { const e = el("div", cls, parent); const f = atlas.frame(alias, name); paint(e, f, scale); placeAt(e, f, at[0], at[1], scale); e.hidden = !f; return e; };
  const setSpr = (key, e, alias, name, at, scale = 1, lo = false) => { const sig = name + "@" + at[0] + "," + at[1]; if (last[key] === sig) return; last[key] = sig; const f = lo && atlas.frameLo ? atlas.frameLo(alias, name) : atlas.frame(alias, name); paint(e, f, scale); placeAt(e, f, at[0], at[1], scale); e.hidden = !f; }; // V: lo = bản thường (cảnh lưới 2×, không lấy HD)

  /** V: toạ độ vật dụng: vỉa hè đọc "street-<id>", quán đọc "<id>" (manifest placements). */
  function fixAt(stageId, id) {
    const pl = atlas.placements || {};
    const v = stageId === "street" ? pl["street-" + id] : (id === "awning" ? null : pl[id]);
    const at = Array.isArray(v) ? v : v?.at;
    return Array.isArray(at) && typeof at[0] === "number" ? [at[0], at[1]] : null;
  }
  function build(stageId) {
    mode = stageId;
    for (const n of cust.values()) n.e.remove();
    cust.clear();
    for (const t of tableEls.values()) { t.btn.remove(); }
    tableEls.clear();
    for (const g of groupUi.values()) { g.bubble.remove(); g.tag.remove(); g.btn.remove(); }
    groupUi.clear();
    stage.textContent = "";
    P = scenePoints(stageId);
    const layer = (alias, z) => {
      const img = el("img", "layer", stage); img.alt = ""; img.width = W; img.height = H; img.draggable = false; img.style.zIndex = z;
      const real = atlas.sheet(alias); const f = real ? null : atlas.frame(alias, "scene");
      img.src = real ? atlas.base + real.filename : f ? f.url : "";
      if (!img.src) img.hidden = true;
      img.dataset.layer = alias;
      return img;
    };
    S = {};
    layer(stageId === "quan" ? "quan" : "street", 0);
    // kệ sau lưng cô chủ (nồi cơm, nồi canh, xửng, nóc tủ kính): sau cô chủ, sau bếp
    S.back = el("div", "back-layer", stage);
    S.owner = el("div", "spr owner", stage);
    layer(stageId === "quan" ? "quanFg" : "streetFg", 200);
    S.counter = el("div", "counter-layer", stage);
    S.grill = el("div", "spr grill", S.counter);
    S.grill2 = P["grill-2"] ? el("div", "spr grill", S.back) : null; // A: bếp than thứ hai (kệ sau)
    S.items = [...P.grillSlots, ...(P.grill2Slots || [])].map((p, i) => el("div", "spr gitem", i >= 6 ? S.back : S.counter));
    S.eq = {};
    for (const key of ["rice-cooker", "mo-hanh-pot", "plate-stack", "suon-tray", "pickle-jar", "cucumber-tray", "sauce-jar", "chili-jar", "cash-tin", "box-stack", "egg-pan", "bi-tray", "steamer", "soup-pot", "electric-blower", "smoke-hood"]) if (P[key]) S.eq[key] = el("div", "spr", P[key][1] < 380 ? S.back : S.counter); // A: + nồi canh, quạt máy, chụp hút khói
    S.floor = el("div", "floor-layer", stage);
    for (const key of ["wash-tub", "charcoal-sack", "water-can"]) if (P[key]) S.eq[key] = el("div", "spr", S.floor);
    S.decor = new Map(); // A: trang trí (khoá id → phần tử)
    S.helper = el("div", "spr helper", S.floor); S.helper.hidden = true; // A: phụ bàn Bông
    // bình trà đá: toạ độ đề xuất (ART-DIRECTION) đè ghế trái bàn 1 ⇒ chỉ vẽ khi manifest có toạ độ thật của Codex
    const teaKey = stageId === "street" ? "street-tea-cooler" : "tea-cooler";
    if (P["tea-cooler"] && atlas.placements[teaKey]) S.eq["tea-cooler"] = el("div", "spr", S.floor);
    // V: vật dụng quán (fixtures.webp, đợt 2, hiện ×1): tường / trần sau cô chủ, sau quầy, trên quầy, sàn (sắp theo y)
    S.fix = {};
    for (const [id, layerName] of FIXTURES) {
      const at = fixAt(stageId, id);
      if (!at) continue;
      const parent = layerName === "counter" ? S.counter : layerName === "floor" ? S.floor : layerName === "behind" ? stage : S.back;
      const e = el("div", "spr fixture", parent);
      e.dataset.fixture = id; e.hidden = true;
      if (layerName === "behind") e.style.zIndex = 90; // sau cô chủ (100), sau lớp che quầy (200)
      if (layerName === "floor") e.style.zIndex = 1000 + Math.round(at[1]) - 2;
      S.fix[id] = { e, at };
    }
    // V: thời tiết (weather-fx.webp 640×360 lưới 2× ⇒ hiện ×2 phủ cảnh): mưa ngoài trời trên mọi thứ; trong quán chỉ thấy mưa qua cửa sổ + cửa
    // (sau khách); nước ngập vỉa hè; khói dày trên bếp; cúp điện: tối + quầng đèn bình; chớp: loé trắng (+ tia sét ngoài trời).
    S.wxBack = el("div", "weather weather-back", stage);
    S.wx = el("div", "weather", stage);
    const wxEl = (cls, parent, clip) => { const e = el("div", "spr " + cls, parent); e.hidden = true; if (clip) e.style.clipPath = clip; return e; };
    S.wxEls = {
      rain: stageId === "quan" ? QUAN_SKY.map((c) => wxEl("wx-rain", S.wxBack, c)) : [wxEl("wx-rain", S.wx)],
      flood: stageId === "street" ? wxEl("wx-flood", S.wx) : null,
      smoke: wxEl("wx-smoke", S.wx),
      dark: el("div", "wx-dark", S.wx),
      glow: wxEl("wx-glow", S.wx),
      bolt: stageId === "street" ? wxEl("wx-bolt", S.wx) : null,
      flash: el("div", "wx-flash", S.wx),
    };
    S.wxEls.dark.hidden = true; S.wxEls.flash.hidden = true;
    S.fx = el("div", "fx", stage);
    root.dataset.mode = stageId;
    for (const key of Object.keys(last)) delete last[key];
    if (lastCam) relayout();
  }

  /** Camera: phủ kín khung × zoom, canh giữa (camX, camY), không lộ mép. Hệ số phóng lên bội 0,5 thiết bị nếu chỉ cắt mép ≤ 25%. */
  function layout(camX = 640, camY = 360, zoom = 1, exact = false) {
    lastCam = { args: [camX, camY, zoom, exact] };
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
  function relayout() { if (lastCam) layout(...lastCam.args); }
  const toScreen = (x, y) => [ox + x * k, oy + y * k];

  // ---------- cô chủ ----------
  function ownerFrame(s, t) {
    const sh = s.shift, o = sh?.owner;
    const cyc = (seq, n, ms = 140) => atlas.frame("owner", `owner-${seq}-${Math.floor(t / ms) % n + 1}`);
    if (!o) return cyc("idle", 2, 600);
    const tk = o.task;
    if (tk && tk.phase === "walk") return tk.plate || tk.kind === "rice" ? cyc("carry", 4) : cyc("walk", 4);
    if (tk && (tk.phase === "work" || tk.phase === "hold")) {
      const seq = { visit: "pour", deliver: "serve", clean: "wipe", wash: "wipe", bill: "idle", rice: "serve", moHanh: "plate", marinate: "plate" }[tk.kind] || "idle";
      return seq === "pour" || seq === "serve" ? cyc(seq, 2, 300) : seq === "idle" ? cyc("idle", 2, 600) : cyc(seq, 4);
    }
    if (sh.grill.fan) return cyc("fan", 4, 110);
    if (performance.now() < actUntil) return cyc(actName, actName === "box" ? 2 : 4);
    return cyc("idle", 2, 600);
  }
  function act(name, ms = 500) { actName = name; actUntil = performance.now() + ms; }

  let ownerBox = { x0: 0, y0: 0, x1: 0, y1: 0 };
  let blocks = [];
  /** Đặt bong bóng: trên đầu → hai bên; không chạm mặt cô chủ, không đè HUD / Thanh Bếp (avoid()), không tràn khung. Hết chỗ ⇒ trả false. */
  function placeBubble(b, hx, hy, headW, keepOut = []) {
    const bw = b.offsetWidth || 180, bh = b.offsetHeight || 40, w = root.clientWidth, h = root.clientHeight;
    const cands = [
      { side: "top", x0: hx - bw / 2, y0: hy - 8 - bh },
      { side: "right", x0: hx + headW * 0.55, y0: hy - bh * 0.2 },
      { side: "left", x0: hx - headW * 0.55 - bw, y0: hy - bh * 0.2 },
      { side: "top", x0: hx - bw / 2, y0: hy + 10 },
    ];
    const hard = [ownerBox, ...blocks, ...keepOut];
    for (const c of cands) {
      const r = { x0: Math.max(4, Math.min(w - bw - 4, c.x0)), y0: Math.max(2, Math.min(h - bh - 2, c.y0)) };
      r.x1 = r.x0 + bw; r.y1 = r.y0 + bh;
      if (hard.some((x) => overlap(r, x))) continue;
      b.style.left = r.x0 + "px"; b.style.top = r.y0 + "px";
      b.dataset.side = c.side;
      b.style.setProperty("--tail", Math.max(10, Math.min(bw - 10, hx - r.x0)) + "px");
      return r;
    }
    return null;
  }

  // ---------- bàn ----------
  function tableNode(tp) {
    let n = tableEls.get(tp.id);
    if (n) return n;
    const sprite = el("div", "spr table", S.floor);
    const stools = tp.seatSpots.map((sp, i) => el("div", "spr stool", S.floor));
    const plates = tp.seatSpots.map(() => el("div", "spr titem", S.floor));
    const teas = tp.seatSpots.map(() => el("div", "spr titem", S.floor));
    const btn = el("button", "tbtn-scene", ui);
    btn.type = "button"; btn.dataset.table = tp.id;
    btn.addEventListener("click", () => onTable(tp.id, selGid));
    const badge = el("span", "tbadge", btn);
    const ring = el("i", "tring", btn);
    n = { sprite, stools, plates, teas, btn, badge, ring };
    tableEls.set(tp.id, n);
    return n;
  }
  function custNode(key) {
    let n = cust.get(key);
    if (n) return n;
    n = { e: el("div", "spr cust", S.floor) };
    cust.set(key, n);
    return n;
  }
  function groupNode(g) {
    let n = groupUi.get(g.id);
    if (n) return n;
    const bubble = el("div", "bubble", ui); bubble.hidden = true;
    const tag = el("div", "gtag", ui); tag.hidden = true;
    const btn = el("button", "gbtn", ui); btn.type = "button"; btn.hidden = true; btn.dataset.gid = g.id;
    btn.addEventListener("click", () => onGroup(g.id));
    // nhóm chờ bàn: chính nhãn "n người" + thanh kiên nhẫn là nút chạm (≥ 44 px), đặt trên đầu khách, không đè nút bàn
    const host = g.takeaway ? tag : btn;
    const bar = el("i", "pfill", host);
    const lbl = el("b", "", host);
    n = { bubble, tag, btn, bar, lbl, sayAt: -1 };
    groupUi.set(g.id, n);
    return n;
  }
  /** Vị trí từng người trong nhóm (toạ độ cảnh). */
  function memberPos(s, g, m, t) {
    const sh = s.shift;
    if (g.takeaway) {
      const spot = P.queueSpots[g.spot] || P.queueSpots[0];
      if (g.phase === "enter") return [...along(shipperIn(P, spot), ease(Math.min(1, (t - g.t0) / g.walkMs))), false];
      if (g.phase === "leave") return [...along(g.outPath, Math.min(1, (t - g.leaveT) / g.walkMs)), false];
      return [spot[0], spot[1], false];
    }
    const spot = P.waitSpots[g.spot] || P.entry;
    // V: chỗ đứng hiển thị theo hàng chờ (waitDisplay); người không có chỗ riêng xếp nối sau cùng
    const slotOf = () => { const k = g.spots?.[m.idx]; return Number.isInteger(k) ? k : P.waitSpots.length + m.idx; };
    if (g.phase === "enter") { const sp = waitDisplay(P, slotOf()); const p = along(guestIn(P, sp), ease(Math.min(1, Math.max(0, (t - g.t0 - m.idx * 260) / g.walkMs)))); return [p[0], p[1], false]; }
    if (g.phase === "wait") { const sp = waitDisplay(P, slotOf()); return [sp[0], sp[1], false]; }
    const tp = P.tables.find((x) => x.id === g.table);
    const seat = seatDisplay(tp, m.idx) || spot;
    if (g.phase === "toTable") { const sp = waitDisplay(P, slotOf()); const p = along(guestToSeat(P, sp, seat), Math.min(1, (t - g.seat0) / g.walkMs)); return [p[0], p[1], false]; }
    if (g.phase === "seated") { // A: bàn ghép (V: + chỗ ngồi hiển thị bàn 4)
      const list = seatSpotsFor(s, g), sp = list[m.idx] || tp?.seatSpots[m.idx];
      const owner = sp && P.tables.find((x) => x.seatSpots.includes(sp));
      const at = owner ? seatDisplay(owner, owner.seatSpots.indexOf(sp)) : sp?.at || seat;
      return [at[0], at[1], true, sp?.face === "left"];
    }
    if (g.phase === "leave") { const p = along(g.outPath, Math.min(1, (t - g.leaveT) / g.walkMs)); return [p[0] + m.idx * 26, p[1], false]; }
    return [spot[0], spot[1], false];
  }

  function update(s, opts = {}) {
    const stageId = s.stage === "quan" ? "quan" : "street";
    if (stageId !== mode) build(stageId);
    const sh = s.shift, t = sh ? sh.t : performance.now();
    blocks = avoid();
    // ---- cô chủ ----
    const of = ownerFrame(s, t), osc = charScale(of);
    const opos = sh ? sh.owner.pos : P.owner;
    if (ownerPrev && Math.abs(opos[0] - ownerPrev[0]) > 0.5) ownerFace = opos[0] < ownerPrev[0] ? -1 : 1;
    if (sh && !sh.owner.task) ownerFace = 1;
    ownerPrev = [...opos];
    paint(S.owner, of, osc); placeAt(S.owner, of, opos[0], opos[1], osc);
    const behind = opos[0] < P.aisle[0][0] - 4 && opos[1] < P.aisle[1][1] - 20;
    S.owner.style.zIndex = behind ? 100 : 1000 + Math.round(opos[1]);
    S.owner.classList.toggle("flip", ownerFace < 0);
    S.owner.style.visibility = sh?.owner.away ? "hidden" : "";
    { const top = opos[1] - (of ? of.ay * osc : 250); const [x0, y0] = toScreen(opos[0] - 70, top - 6), [x1, y1] = toScreen(opos[0] + 70, top + 110); ownerBox = { x0, y0, x1, y1 }; }
    // ---- bếp + miếng trên vỉ ----
    const g = sh?.grill;
    const coalKey = g ? (g.flareUntil > t ? `flare-${Math.floor(t / 120) % 3 + 1}` : g.smoke >= 55 ? `smoke-${Math.floor(t / 250) % 3 + 1}` : heatKey(g, sh.lit)) : (s.kitchen?.coal > 0 ? "mid" : "cold");
    setSpr("grill", S.grill, "grill", `grill-${coalKey}`, P.grill);
    if (S.grill2) { const on = s.owned?.["grill-2"] && s.stage === "quan"; S.grill2.hidden = !on; if (on) setSpr("grill2", S.grill2, "grill", `grill-${coalKey}`, P["grill-2"]); else last.grill2 = ""; } // A:
    S.items.forEach((e, i) => {
      const it = g?.vegFrom != null && i >= g.vegFrom ? null : g?.slots[i]; // S: vỉ chay riêng chỉ hiện trên Thanh Bếp (chưa có chỗ vẽ trong cảnh)
      if (!it) { if (last["gi" + i] !== "") { last["gi" + i] = ""; e.hidden = true; } return; }
      const name = itemFrame(it);
      setSpr("gi" + i, e, "grillItems", name, i < 6 ? P.grillSlots[i] : P.grill2Slots[i - 6], 1, true); // V: cảnh dùng grill-items thường (HD chỉ ở chip + bếp lớn)
    });
    // ---- đồ trên quầy / sàn ----
    const rice = sh?.rice;
    const rc = s.stage === "quan" ? "rice-cooker-big" : "rice-cooker"; // A: nồi lớn ở quán
    const riceName = rice ? (rice.cooking ? `${rc}-cooking-${Math.floor(t / 300) % 3 + 1}` : rice.n === 0 ? `${rc}-empty` : rice.n <= 3 ? `${rc}-low` : `${rc}-ready`) : s.kitchen?.rice > 0 ? `${rc}-ready` : `${rc}-empty`;
    const eqName = {
      "rice-cooker": riceName,
      "mo-hanh-pot": s.moHanh.n <= 0 ? "mo-hanh-pot-empty" : s.moHanh.n <= 5 ? "mo-hanh-pot-low" : "mo-hanh-pot-full",
      "plate-stack": !sh ? "plate-stack-full" : sh.cleanPlates <= 0 ? "plate-stack-empty" : sh.cleanPlates <= 3 ? "plate-stack-low" : "plate-stack-full",
      "wash-tub": !sh || sh.dirty <= 0 ? "wash-tub-empty" : sh.dirty <= 4 ? "wash-tub-half" : "wash-tub-full",
      "charcoal-sack": (s.stock.than || 0) <= 0 ? "charcoal-sack-empty" : s.stock.than <= 3 ? "charcoal-sack-low" : "charcoal-sack-full",
      "tea-cooler": (s.stock.tra || 0) <= 6 ? "tea-cooler-low" : "tea-cooler-full",
      "suon-tray": "suon-tray", "pickle-jar": "pickle-jar", "cucumber-tray": "cucumber-tray", "sauce-jar": "sauce-jar", "chili-jar": "chili-jar", "cash-tin": "cash-tin",
      "box-stack": (s.stock.hop || 0) > 0 ? "box-stack" : null,
      "egg-pan": s.owned?.["egg-pan"] ? (sh?.pan?.egg ? `egg-pan-fry-${Math.floor(t / 200) % 2 + 1}` : "egg-pan-idle") : null,
      "bi-tray": s.level >= 3 ? "bi-tray" : null,
      steamer: s.owned?.steamer ? (sh?.steamer?.cooking ? `steamer-steam-${Math.floor(t / 300) % 3 + 1}` : "steamer-idle") : null,
      // A: đồ mua thêm
      "soup-pot": s.owned?.["soup-pot"] ? (sh?.soup?.n > 0 ? `soup-pot-steam-${Math.floor(t / 400) % 2 + 1}` : "soup-pot-idle") : null,
      "electric-blower": s.owned?.["electric-blower"] ? (g?.blower ? `electric-blower-on-${Math.floor(t / 120) % 2 + 1}` : "electric-blower-off") : null,
      "smoke-hood": s.owned?.["smoke-hood"] && s.stage === "quan" ? "smoke-hood" : null,
      "water-can": s.owned?.["water-can"] ? "water-can" : null,
    };
    for (const [key, e] of Object.entries(S.eq)) {
      const name = eqName[key];
      if (!name) { e.hidden = true; last["eq" + key] = ""; continue; }
      setSpr("eq" + key, e, "equip", name, P[key], scaleOf(atlas, "equip", name));
      if (e.parentElement === S.floor) e.style.zIndex = 1000 + P[key][1];
    }
    // ---- bàn ----
    const tables = sh ? sh.tables : availableTables(s).map((tp) => ({ id: tp.id, seats: tp.seats, state: "clean", gid: null }));
    const live = new Set();
    const usedCust = new Set();
    const tRects = [];
    for (const tb of tables) {
      const tp = P.tables.find((x) => x.id === tb.id);
      if (!tp) continue;
      live.add(tb.id);
      const n = tableNode(tp);
      const grp = tb.gid !== null && sh ? sh.groups.find((x) => x.id === tb.gid) : null;
      const off = tb.joinOf ? (tables.find((x) => x.id === tb.joinOf)?.seats || 2) : 0; // A: bàn ghép: người thứ 3–4 ngồi bàn bên cạnh
      const st = tb.state === "dirty" ? "dirty" : tb.state === "wet" ? "wet" : grp || tb.state === "clean" ? "set" : "clean";
      setSpr("tb" + tb.id, n.sprite, "tables", `${tp.seats === 4 ? "table4" : "table2"}-${st}`, tp.at);
      n.sprite.style.zIndex = 1000 + tp.at[1];
      tp.seatSpots.forEach((sp, i) => {
        const m = grp?.phase === "seated" ? grp.members[i + off] : null;
        const stool = n.stools[i];
        if (m) stool.hidden = true;
        else { const sat = seatDisplay(tp, i); setSpr(`st${tb.id}${i}`, stool, "tableItems", i % 2 ? "stool-blue" : "stool-red", sat); stool.style.zIndex = 1000 + sat[1]; stool.classList.toggle("flip", sp.face === "left"); } // V: chỗ ghế hiển thị
        const pe = n.plates[i], te = n.teas[i];
        const ps = tp.plateSpots[i] || [tp.at[0], tp.at[1] - 120];
        if (m?.plate) {
          const prog = m.eaten ? 1 : m.eatUntil ? 1 - (m.eatUntil - t) / m.eatMs : 0;
          const name = m.plate.kind === "hop" ? "box-eating" : prog >= 0.95 ? "plate-eating-empty" : prog > 0.5 ? "plate-eating-half" : "plate-eating-full";
          setSpr(`pe${tb.id}${i}`, pe, "tableItems", name, ps); pe.style.zIndex = 1001 + tp.at[1];
        } else { pe.hidden = true; last[`pe${tb.id}${i}`] = ""; }
        if (m) { const tx = ps[0] + (sp.face === "left" ? 22 : -22); setSpr(`te${tb.id}${i}`, te, "tableItems", `tea-glass-${m.tea}`, [tx, ps[1] - 2], scaleOf(atlas, "tableItems", "tea-glass-full")); te.style.zIndex = 1002 + tp.at[1]; }
        else { te.hidden = true; last[`te${tb.id}${i}`] = ""; }
      });
      // nút chạm bàn: hình chữ nhật bao bàn + ghế (SCREENS: chạm bàn, không chạm ghế)
      const xs = tp.seatSpots.map((x) => x.at[0]);
      const [bx0, by0] = toScreen(Math.min(...xs) - 38, tp.at[1] - 180), [bx1, by1] = toScreen(Math.max(...xs) + 38, tp.at[1] + 24);
      const b = n.btn;
      tRects.push({ x0: bx0, y0: by0, x1: bx1, y1: by1 });
      n.badgeAt = { x0: (bx0 + bx1) / 2 - 60, y0: by0, x1: (bx0 + bx1) / 2 + 60, y1: by0 + 22 }; // V: chỗ nhãn bàn (bong bóng tránh)
      b.style.left = bx0 + "px"; b.style.top = by0 + "px"; b.style.width = bx1 - bx0 + "px"; b.style.height = by1 - by0 + "px";
      const job = sh ? tableJob(s, tb.id) : null;
      const selFit = selGid !== null && sh?.groups.find((x) => x.id === selGid && x.phase === "wait" && tb.gid === null && tb.state !== "dirty" && tb.seats >= x.size);
      const label = selFit ? "Ngồi đây" : job ? (root.clientWidth < 560 && JOB_SHORT[job]) || JOB_LABEL[job] : grp ? (grp.paid ? "" : allServed(s, grp) ? "Đang ăn" : grp.orderT ? "Chờ món" : "") : tb.state === "dirty" ? "Bàn dơ" : "";
      if (n.badge.textContent !== label) n.badge.textContent = label;
      n.badge.hidden = !label || !sh;
      b.dataset.job = job || "";
      b.classList.toggle("hot", !!job || !!selFit);
      b.classList.toggle("hint", opts.hintTable === tb.id || (opts.hintSeat && job === "seat"));
      b.disabled = !sh;
      b.setAttribute("aria-label", `Bàn ${tb.id.slice(1)}${label ? ": " + label : ""}`);
      const showRing = grp && !grp.paid && !allServed(s, grp);
      n.ring.hidden = !showRing;
      if (showRing) { const p = patienceLeft(s, grp); n.ring.style.setProperty("--p", p.toFixed(3)); n.ring.className = "tring" + (p <= 0.35 ? " low" : p <= 0.6 ? " mid" : ""); }
    }
    drawHelper(s, t); drawDecor(s); // A:
    drawFixtures(s); drawWeather(s, opts.reduced); // V:
    for (const [id, n] of tableEls) if (!live.has(id)) { for (const e of [n.sprite, ...n.stools, ...n.plates, ...n.teas, n.btn]) e.remove(); tableEls.delete(id); }
    // ---- khách ----
    const liveG = new Set();
    const gRects = [], bRects = []; // nút nhóm chờ + bong bóng đã đặt trong khung này: nhóm đứng sát cửa không đè nhau (quán 390 px)
    const tagRects = [], bubbleJobs = []; // V:
    let badgeRects = null; // chỉ đo khi có bong bóng cần đặt
    const badges = () => (badgeRects ??= [...tableEls.values()].filter((n) => !n.badge.hidden && n.badgeAt).map((n) => { const w = n.badge.offsetWidth || 120; const c = (n.badgeAt.x0 + n.badgeAt.x1) / 2; return { x0: c - w / 2 - 2, y0: n.badgeAt.y0, x1: c + w / 2 + 2, y1: n.badgeAt.y0 + (n.badge.offsetHeight || 18) + 4 }; }));
    const hit = (r, list) => list.some((x) => r.x0 < x.x1 && r.x1 > x.x0 && r.y0 < x.y1 && r.y1 > x.y0);
    // nhóm chờ xếp theo chỗ đứng gần cửa trước, để nhãn của nhóm tới trước giữ chỗ trên đầu, nhóm sau tránh ra
    const order = (sh?.groups || []).slice().sort((a, b) => (a.phase === "wait" ? a.spot : 99) - (b.phase === "wait" ? b.spot : 99));
    for (const grp of order) {
      liveG.add(grp.id);
      const gn = groupNode(grp);
      let head = null;
      for (const m of grp.members) {
        const key = `g${grp.id}m${m.idx}`;
        usedCust.add(key);
        const cn = custNode(key);
        const [x, y, sit, flip] = memberPos(s, grp, m, t);
        const f = sit ? seatFrame(atlas, s, grp, m, t) : standFrame(atlas, m.role, grp, t, m.idx);
        const cs = charScale(f);
        paint(cn.e, f, cs); placeAt(cn.e, f, x, y, cs);
        cn.e.style.zIndex = 1000 + Math.round(y) + (sit ? 0 : 1);
        cn.e.classList.toggle("flip", !!flip || (grp.phase === "leave" && !grp.takeaway));
        cn.e.classList.toggle("sel", selGid === grp.id);
        cn.e.dataset.key = key; cn.e.dataset.phase = grp.phase; // V: cho e2e (chồng vùng đầu)
        const a = grp.phase === "leave" ? Math.max(0, 1 - Math.max(0, (t - grp.leaveT) / grp.walkMs - 0.85) / 0.15) : 1;
        cn.e.style.opacity = a;
        if (m.idx === (grp.say?.who ?? 0) || head === null) head = { x, y: y - (f ? f.ay * cs : 250) + (sit ? 4 : 0), w: (f ? f.w * cs * 0.4 : 90) };
      }
      // nút chọn nhóm đang chờ + nhãn số người + thanh kiên nhẫn
      const waiting = grp.phase === "wait";
      gn.btn.hidden = !waiting || !sh;
      gn.tag.hidden = !(grp.phase === "queue");
      if (waiting || grp.phase === "queue") {
        const spot = grp.takeaway ? P.queueSpots[grp.spot] : P.waitSpots[grp.spot];
        const [sx, sy] = toScreen(spot[0] - (grp.size > 1 ? 0 : 0), spot[1]);
        const [hx, hy] = toScreen(head.x, head.y);
        const wpx = grp.size > 1 ? 88 : 72, hpx = 44;
        let left = Math.max(2, Math.min(root.clientWidth - wpx - 2, hx - wpx / 2));
        let bottom = hy + 22;
        for (const r of tRects) if (r.x0 < left + wpx && r.x1 > left) bottom = Math.min(bottom, r.y0 - 2);
        let top = Math.max(2, bottom - hpx);
        if (waiting) {
          // tránh nút của nhóm chờ khác: lùi sang trái (về phía trong quán), hết chỗ thì xếp tầng lên trên
          let r = { x0: left, y0: top, x1: left + wpx, y1: top + hpx };
          for (let i = 0; i < 8 && hit(r, gRects); i++) {
            const other = gRects.find((x) => r.x0 < x.x1 && r.x1 > x.x0 && r.y0 < x.y1 && r.y1 > x.y0);
            const nx = other.x0 - wpx - 4;
            if (nx >= 2) left = nx; else top = Math.max(2, other.y0 - hpx - 4);
            r = { x0: left, y0: top, x1: left + wpx, y1: top + hpx };
          }
          gRects.push(r);
        }
        gn.btn.style.left = left + "px"; gn.btn.style.top = top + "px";
        gn.btn.style.width = wpx + "px"; gn.btn.style.height = hpx + "px";
        gn.btn.className = "gbtn" + (p0 => p0 <= 0.35 ? " low" : p0 <= 0.6 ? " mid" : "")(patienceLeft(s, grp));
        gn.btn.classList.toggle("sel", selGid === grp.id);
        gn.btn.classList.toggle("hint", !!opts.hintSeat && selGid === null);
        gn.btn.setAttribute("aria-label", `${grp.members[0].name}, ${grp.size} người đang chờ bàn — chạm để chọn rồi chạm bàn`);
        const p = patienceLeft(s, grp);
        gn.bar.style.width = Math.round(p * 100) + "%";
        gn.tag.className = "gtag" + (p <= 0.35 ? " low" : p <= 0.6 ? " mid" : "");
        const txt = grp.takeaway ? "Hộp mang về" : `${grp.size} người`;
        if (gn.lbl.textContent !== txt) gn.lbl.textContent = txt;
        gn.tag.style.left = hx + "px"; gn.tag.style.top = hy - 4 + "px";
      }
      if (selGid === grp.id && !waiting) selGid = null;
      // bong bóng thoại (nền đục, không mờ dần) — V: đặt sau khi mọi nhãn nhóm chờ đã có chỗ (nhãn nhóm sau không bị bong bóng nhóm trước đè)
      const show = grp.say && t - grp.say.at < BUBBLE_MS && grp.phase !== "leave" || (grp.say && grp.phase === "leave" && t - grp.say.at < 1600);
      if (show && head) bubbleJobs.push(() => {
        if (gn.sayAt !== grp.say.at) { gn.sayAt = grp.say.at; gn.bubble.textContent = grp.say.text; gn.bubble.classList.remove("pop"); void gn.bubble.offsetWidth; gn.bubble.classList.add("pop"); }
        gn.bubble.hidden = false;
        const [hx, hy] = toScreen(head.x, head.y);
        const keep = [...gRects, ...bRects, ...tagRects, ...badges()]; // không đè nút nhóm chờ / nhãn hộp mang về / nhãn bàn / bong bóng khác
        const r = placeBubble(gn.bubble, hx, hy, head.w * k, keep.filter(Boolean));
        if (!r) gn.bubble.hidden = true; else bRects.push(r);
      });
      else gn.bubble.hidden = true;
      if (grp.phase === "queue") tagRects.push(rectOf(gn.tag));
    }
    for (const job of bubbleJobs) job();
    for (const [key, n] of cust) if (!usedCust.has(key)) { n.e.remove(); cust.delete(key); }
    for (const [id, n] of groupUi) if (!liveG.has(id)) { n.bubble.remove(); n.tag.remove(); n.btn.remove(); groupUi.delete(id); if (selGid === id) selGid = null; }
  }
  // ---------- A: phụ bàn Bông + trang trí ----------
  let helperPrev = null, helperFace = 1;
  function drawHelper(s, t) {
    const h = s.shift?.helper;
    S.helper.hidden = !h;
    if (!h) return;
    const tk = h.task;
    const cyc = (seq, n, ms = 140) => atlas.frame("helper", `helper-${seq}-${Math.floor(t / ms) % n + 1}`);
    const f = tk?.phase === "walk" ? cyc("walk", 4) : tk?.phase === "work" ? (tk.kind === "pour" ? cyc("pour", 2, 300) : cyc("wipe", 4)) : cyc("idle", 2, 600);
    const sc = charScale(f);
    if (helperPrev && Math.abs(h.pos[0] - helperPrev[0]) > 0.5) helperFace = h.pos[0] < helperPrev[0] ? -1 : 1;
    helperPrev = [...h.pos];
    paint(S.helper, f, sc); placeAt(S.helper, f, h.pos[0], h.pos[1], sc);
    S.helper.style.zIndex = 1000 + Math.round(h.pos[1]) + 1;
    S.helper.classList.toggle("flip", helperFace < 0);
  }
  function drawDecor(s) {
    const live = new Set();
    for (const id of Object.keys(s.decor || {})) {
      live.add(id);
      let e = S.decor.get(id);
      if (!e) { e = el("div", "spr decor", S.floor); e.dataset.decor = id; S.decor.set(id, e); }
      const at = decorAt(s, id, atlas.placements);
      setSpr("dc" + id, e, "decor", decorFrame(id), at, scaleOf(atlas, "decor", decorFrame(id))); // S: đồ Drama tặng dùng frame tạm
      e.style.zIndex = at[1] < 380 ? 50 : 1000 + Math.round(at[1]);
    }
    for (const [id, e] of S.decor) if (!live.has(id)) { e.remove(); S.decor.delete(id); delete last["dc" + id]; }
    root.dataset.famous = isFamous(s) ? "1" : "";
  }
  // ---------- V: vật dụng quán + thời tiết ----------
  function fixtureFrame(s, id) {
    const sh = s.shift, own = (k) => !!s.owned?.[k], quan = s.stage === "quan";
    switch (id) {
      case "glass-case": {
        if (!own("glass-case")) return null;
        const warm = sh ? sh.grill.slots.filter((it, i) => it && zoneOf(i) === "warm" && isCooked(it)).length : 0;
        return warm >= 2 ? "glass-case-full" : warm === 1 || !sh ? "glass-case-low" : "glass-case-empty";
      }
      case "signboard": return own("signboard-3") ? "signboard-3" : own("signboard-2") ? "signboard-2" : "signboard-1";
      case "awning": return !quan && own("awning") ? "awning-street" : null;
      case "takeaway-shelf": return own("takeaway-shelf") ? "takeaway-shelf" : null;
      case "lantern-string": case "menu-board": return quan ? id : null;
      case "helper-station": return quan && (sh ? !!sh.helper : s.staff?.bong === s.day) ? id : null;
      case "wash-station": return quan && (sh ? !!sh.dishwasher : s.staff?.["di-nam"] === s.day) ? id : null;
      case "queue-bench": return quan && own("queue-bench") ? id : null;
      default: return null;
    }
  }
  function drawFixtures(s) {
    for (const [id, n] of Object.entries(S.fix || {})) {
      const name = fixtureFrame(s, id);
      if (!name || !atlas.has("fixtures", name)) { if (!n.e.hidden) { n.e.hidden = true; last["fix" + id] = ""; } continue; }
      setSpr("fix" + id, n.e, "fixtures", name, n.at, scaleOf(atlas, "fixtures", name));
    }
  }
  let powerUntil = -1, boltAt = -1;
  const wxFrame = (e, name) => { if (e.dataset.f === name) { e.hidden = false; return; } const f = atlas.frame("weather", name); e.dataset.f = f ? name : ""; paint(e, f, 2); if (f) { e.style.left = "0px"; e.style.top = "0px"; } e.hidden = !f; };
  const hide = (e) => { if (e && !e.hidden) e.hidden = true; };
  function drawWeather(s, reduced) {
    const E = S.wxEls; if (!E) return;
    const sh = s.shift, now = performance.now(), t = sh ? sh.t : now;
    const has = atlas.has("weather", "rain-1");
    const rain = has && rainToday(s);
    const dlg = sh?.dialog?.kind === "event" ? sh.dialog.id : null;
    const today = (id) => dlg === id || (s.drama?.history || []).some((h) => h.id === id && h.day === s.day);
    const cyc = (k, fps) => WX_CLIP[k][reduced ? 0 : Math.floor(now / (1000 / fps)) % WX_CLIP[k].length];
    for (const e of E.rain) { if (rain) wxFrame(e, cyc("rain", 9)); else hide(e); }
    const flood = rain && !!E.flood;
    if (flood) { wxFrame(E.flood, cyc("flood", 3)); E.flood.style.opacity = today("O04") ? ".85" : ".55"; } else hide(E.flood);
    // khói dày: khói bếp >= 55 (cùng ngưỡng bếp đổi hình khói) hoặc sự kiện khói mù; đậm dần theo khói
    const smoke = sh ? sh.grill.smoke : 0, smokeOn = has && (smoke >= 55 || dlg === "SM1");
    if (smokeOn) { wxFrame(E.smoke, cyc("smoke", 5)); E.smoke.style.opacity = String(Math.min(1, 0.45 + Math.max(0, smoke - 55) / 70)); } else hide(E.smoke);
    // cúp điện (O02): khi hội thoại mở + 20 giây ca sau đó
    if (sh && dlg === "O02") powerUntil = sh.t + 20000;
    if (!sh) powerUntil = -1;
    const power = has && !!sh && t < powerUntil;
    E.dark.hidden = !power;
    if (power) wxFrame(E.glow, "power-cut-glow"); else hide(E.glow);
    // chớp: ngày mưa, mỗi khoảng 12 giây một lần ở thời điểm lệch ngẫu nhiên (không có khi giảm chuyển động)
    let flash = false;
    if (rain && !reduced) {
      const slot = Math.floor(now / 12000), seed = Math.abs((Math.sin(slot * 91.7) * 43758.5453) % 1), at0 = slot * 12000 + seed * 9000;
      if (now >= at0 && now < at0 + 220) { flash = true; boltAt = at0; }
    }
    E.flash.hidden = !flash;
    if (E.bolt) { if (flash) wxFrame(E.bolt, WX_CLIP.bolt[now - boltAt < 110 ? 0 : 1]); else hide(E.bolt); }
    S.wx.dataset.rain = rain ? "1" : ""; S.wx.dataset.smoke = smokeOn ? "1" : ""; S.wx.dataset.power = power ? "1" : "";
  }
  const rectOf = (e) => { const r0 = root.getBoundingClientRect(), r = e.getBoundingClientRect(); return r.width ? { x0: r.left - r0.left, y0: r.top - r0.top, x1: r.right - r0.left, y1: r.bottom - r0.top } : null; };
  function burst(clipName, x, y, scale = 1, reduced = false) {
    if (reduced || !S.fx) return;
    const clip = atlas.clip("fx", clipName);
    const frames = clip ? clip.frames : [1, 2, 3].map((i) => `${clipName}-${i}`);
    const fps = clip?.fps || 10;
    const e = el("div", "spr fxspr", S.fx);
    let i = 0;
    const stepF = () => { if (i >= frames.length) { e.remove(); return; } const f = atlas.frame("fx", frames[i++]); paint(e, f, scale); placeAt(e, f, x, y, scale); setTimeout(stepF, 1000 / fps); };
    stepF();
  }
  build("street");
  return {
    update, layout, toScreen, burst, act,
    get points() { return P; }, get mode() { return mode; }, get scale() { return k; }, get ownerBox() { return ownerBox; },
    selectGroup(gid) { selGid = gid; }, get selected() { return selGid; },
    tablePoint: (id) => P.tables.find((x) => x.id === id),
  };
}
