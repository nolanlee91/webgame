// Cảnh 1280×720: quán vỉa hè (street-scene, cấp 1–6) hoặc quán có mái (quan-scene, cấp 7+). DOM sprite theo atlas, vẽ lại mỗi khung từ trạng thái.
// Lớp: nền → cô chủ khi đứng sau quầy → lớp che quầy (*-foreground) → đồ trên quầy (bếp + miếng trên vỉ, nồi cơm, hũ, chồng dĩa…)
// → sàn (bàn, ghế, khách ngồi, khách đứng, cô chủ khi ra sàn) sắp theo y chân → lớp UI không phóng (bong bóng, nhãn bàn, nút chạm bàn).
// Toạ độ từ core/placements.js (manifest placements → dự phòng data/scene.js). Camera: hệ số bội 0,5 thiết bị (PLAYBOOK §2), snap lưới 2 px.
// Khách ngồi: frame <vai>-sit-* vẽ quay phải; ghế face "left" ⇒ lật ngang quanh anchor (vẫn snap). Bong bóng nền đục, đặt bằng placeBubble.
import { paint, placeAt, setSnap } from "./atlas.js?v=c1";
import { scenePoints, along, guestIn, guestToSeat, shipperIn, ownerRoute, alongDist } from "../core/placements.js?v=c1";
import { itemFrame, heatKey } from "../core/grill.js?v=c1";
import { patienceLeft, tableJob, availableTables, allServed } from "../core/tables.js?v=c1";

const W = 1280, H = 720;
export const BUBBLE_MS = 3600;
const ease = (p) => p * p * (3 - 2 * p);
function el(tag, cls, parent) { const e = document.createElement(tag); if (cls) e.className = cls; parent?.appendChild(e); return e; }

/** Cảnh vẽ cận (PLAYBOOK §1.2b): ô nhân vật mục tiêu 288 px (asset-spec 216×288). Ô nhỏ hơn hiện bội 0,5 gần nhất. */
export const CHAR_H = 288;
export const charScale = (f) => (f ? Math.max(1, Math.round((CHAR_H / f.h) * 2) / 2) : 1);

/** Thiết bị (equipment.webp) vẽ to trong ô 192 (nồi cơm cao ~132 px) ⇒ hiện ×0,5 cho đúng thước cảnh (nồi ~66 px, ART-DIRECTION §0),
 *  như Tiệm Bánh Mì. Ly trà (table-items) cũng ×0,5; ghế, dĩa đang ăn, bàn, bếp, món trên vỉ hiện ×1. Đều là bội 0,5 ⇒ vẫn nét. */
export const EQUIP_SCALE = 0.5;
export const SMALL_ITEM_SCALE = 0.5;
export const JOB_LABEL = { seat: "Mời ngồi", visit: "Châm trà · lấy phiếu", bill: "Tính tiền", clean: "Dọn bàn", rice: "Thêm cơm" };

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
  const setSpr = (key, e, alias, name, at, scale = 1) => { const sig = name + "@" + at[0] + "," + at[1]; if (last[key] === sig) return; last[key] = sig; const f = atlas.frame(alias, name); paint(e, f, scale); placeAt(e, f, at[0], at[1], scale); e.hidden = !f; };

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
    S.items = P.grillSlots.map(() => el("div", "spr gitem", S.counter));
    S.eq = {};
    for (const key of ["rice-cooker", "mo-hanh-pot", "plate-stack", "suon-tray", "pickle-jar", "cucumber-tray", "sauce-jar", "chili-jar", "cash-tin", "box-stack", "egg-pan", "bi-tray", "steamer"]) if (P[key]) S.eq[key] = el("div", "spr", P[key][1] < 380 ? S.back : S.counter);
    S.floor = el("div", "floor-layer", stage);
    for (const key of ["wash-tub", "charcoal-sack"]) if (P[key]) S.eq[key] = el("div", "spr", S.floor);
    // bình trà đá: toạ độ đề xuất (ART-DIRECTION) đè ghế trái bàn 1 ⇒ chỉ vẽ khi manifest có toạ độ thật của Codex
    const teaKey = stageId === "street" ? "street-tea-cooler" : "tea-cooler";
    if (P["tea-cooler"] && atlas.placements[teaKey]) S.eq["tea-cooler"] = el("div", "spr", S.floor);
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
    const spread = (i) => [-i * 34, i * 8];
    if (g.takeaway) {
      const spot = P.queueSpots[g.spot] || P.queueSpots[0];
      if (g.phase === "enter") return [...along(shipperIn(P, spot), ease(Math.min(1, (t - g.t0) / g.walkMs))), false];
      if (g.phase === "leave") return [...along(g.outPath, Math.min(1, (t - g.leaveT) / g.walkMs)), false];
      return [spot[0], spot[1], false];
    }
    const spot = P.waitSpots[g.spot] || P.entry;
    const off = spread(m.idx);
    if (g.phase === "enter") { const sp = P.waitSpots[g.spots?.[m.idx]] || spot; const p = along(guestIn(P, sp), ease(Math.min(1, Math.max(0, (t - g.t0 - m.idx * 260) / g.walkMs)))); return [p[0], p[1], false]; }
    if (g.phase === "wait") { const sp = P.waitSpots[g.spots?.[m.idx]] ; return sp ? [sp[0], sp[1], false] : [spot[0] - m.idx * 30, spot[1] + m.idx * 10, false]; }
    const tp = P.tables.find((x) => x.id === g.table);
    const seat = tp?.seatSpots[m.idx]?.at || spot;
    if (g.phase === "toTable") { const sp = P.waitSpots[g.spots?.[m.idx]] || spot; const p = along(guestToSeat(P, sp, seat), Math.min(1, (t - g.seat0) / g.walkMs)); return [p[0], p[1], false]; }
    if (g.phase === "seated") return [seat[0], seat[1], true, tp?.seatSpots[m.idx]?.face === "left"];
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
    S.items.forEach((e, i) => {
      const it = g?.slots[i];
      if (!it) { if (last["gi" + i] !== "") { last["gi" + i] = ""; e.hidden = true; } return; }
      const name = itemFrame(it);
      setSpr("gi" + i, e, "grillItems", name, P.grillSlots[i]);
    });
    // ---- đồ trên quầy / sàn ----
    const rice = sh?.rice;
    const riceName = rice ? (rice.cooking ? `rice-cooker-cooking-${Math.floor(t / 300) % 3 + 1}` : rice.n === 0 ? "rice-cooker-empty" : rice.n <= 3 ? "rice-cooker-low" : "rice-cooker-ready") : s.kitchen?.rice > 0 ? "rice-cooker-ready" : "rice-cooker-empty";
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
    };
    for (const [key, e] of Object.entries(S.eq)) {
      const name = eqName[key];
      if (!name) { e.hidden = true; last["eq" + key] = ""; continue; }
      setSpr("eq" + key, e, "equip", name, P[key], EQUIP_SCALE);
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
      const st = tb.state === "dirty" ? "dirty" : tb.state === "wet" ? "wet" : grp || tb.state === "clean" ? "set" : "clean";
      setSpr("tb" + tb.id, n.sprite, "tables", `${tp.seats === 4 ? "table4" : "table2"}-${st}`, tp.at);
      n.sprite.style.zIndex = 1000 + tp.at[1];
      tp.seatSpots.forEach((sp, i) => {
        const m = grp?.phase === "seated" ? grp.members[i] : null;
        const stool = n.stools[i];
        if (m) stool.hidden = true;
        else { setSpr(`st${tb.id}${i}`, stool, "tableItems", i % 2 ? "stool-blue" : "stool-red", sp.at); stool.style.zIndex = 1000 + sp.at[1]; stool.classList.toggle("flip", sp.face === "left"); }
        const pe = n.plates[i], te = n.teas[i];
        const ps = tp.plateSpots[i] || [tp.at[0], tp.at[1] - 120];
        if (m?.plate) {
          const prog = m.eaten ? 1 : m.eatUntil ? 1 - (m.eatUntil - t) / m.eatMs : 0;
          const name = m.plate.kind === "hop" ? "box-eating" : prog >= 0.95 ? "plate-eating-empty" : prog > 0.5 ? "plate-eating-half" : "plate-eating-full";
          setSpr(`pe${tb.id}${i}`, pe, "tableItems", name, ps); pe.style.zIndex = 1001 + tp.at[1];
        } else { pe.hidden = true; last[`pe${tb.id}${i}`] = ""; }
        if (m) { const tx = ps[0] + (sp.face === "left" ? 22 : -22); setSpr(`te${tb.id}${i}`, te, "tableItems", `tea-glass-${m.tea}`, [tx, ps[1] - 2], SMALL_ITEM_SCALE); te.style.zIndex = 1002 + tp.at[1]; }
        else { te.hidden = true; last[`te${tb.id}${i}`] = ""; }
      });
      // nút chạm bàn: hình chữ nhật bao bàn + ghế (SCREENS: chạm bàn, không chạm ghế)
      const xs = tp.seatSpots.map((x) => x.at[0]);
      const [bx0, by0] = toScreen(Math.min(...xs) - 38, tp.at[1] - 180), [bx1, by1] = toScreen(Math.max(...xs) + 38, tp.at[1] + 24);
      const b = n.btn;
      tRects.push({ x0: bx0, y0: by0, x1: bx1, y1: by1 });
      b.style.left = bx0 + "px"; b.style.top = by0 + "px"; b.style.width = bx1 - bx0 + "px"; b.style.height = by1 - by0 + "px";
      const job = sh ? tableJob(s, tb.id) : null;
      const selFit = selGid !== null && sh?.groups.find((x) => x.id === selGid && x.phase === "wait" && tb.gid === null && tb.state !== "dirty" && tb.seats >= x.size);
      const label = selFit ? "Ngồi đây" : job ? JOB_LABEL[job] : grp ? (grp.paid ? "" : allServed(s, grp) ? "Đang ăn" : grp.orderT ? "Chờ món" : "") : tb.state === "dirty" ? "Bàn dơ" : "";
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
    for (const [id, n] of tableEls) if (!live.has(id)) { for (const e of [n.sprite, ...n.stools, ...n.plates, ...n.teas, n.btn]) e.remove(); tableEls.delete(id); }
    // ---- khách ----
    const liveG = new Set();
    for (const grp of sh?.groups || []) {
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
        const left = Math.max(2, Math.min(root.clientWidth - wpx - 2, hx - wpx / 2));
        let bottom = hy + 22;
        for (const r of tRects) if (r.x0 < left + wpx && r.x1 > left) bottom = Math.min(bottom, r.y0 - 2);
        gn.btn.style.left = left + "px"; gn.btn.style.top = Math.max(2, bottom - hpx) + "px";
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
      // bong bóng thoại (nền đục, không mờ dần)
      const show = grp.say && t - grp.say.at < BUBBLE_MS && grp.phase !== "leave" || (grp.say && grp.phase === "leave" && t - grp.say.at < 1600);
      if (show && head) {
        if (gn.sayAt !== grp.say.at) { gn.sayAt = grp.say.at; gn.bubble.textContent = grp.say.text; gn.bubble.classList.remove("pop"); void gn.bubble.offsetWidth; gn.bubble.classList.add("pop"); }
        gn.bubble.hidden = false;
        const [hx, hy] = toScreen(head.x, head.y);
        const keep = waiting ? [rectOf(gn.btn)] : grp.phase === "queue" ? [rectOf(gn.tag)] : [];
        const r = placeBubble(gn.bubble, hx, hy, head.w * k, keep.filter(Boolean));
        if (!r) gn.bubble.hidden = true;
      } else gn.bubble.hidden = true;
    }
    for (const [key, n] of cust) if (!usedCust.has(key)) { n.e.remove(); cust.delete(key); }
    for (const [id, n] of groupUi) if (!liveG.has(id)) { n.bubble.remove(); n.tag.remove(); n.btn.remove(); groupUi.delete(id); if (selGid === id) selGid = null; }
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
