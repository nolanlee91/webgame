// Toạ độ cảnh cho luật thuần + vẽ: bàn, ghế, chỗ chờ, lối đi, chỗ đứng của chủ quán, thau rửa…
// Nguồn: manifest.placements (Codex ghi theo tranh thật) → dự phòng data/scene.js. game.js gọi configureScene(manifest.placements) lúc mở;
// test không gọi thì dùng dự phòng. Thời gian đi bộ của chủ quán (core/walker.js) tính trên chính các đường này, nên khi có tranh thật
// thì bưng ra bàn xa mất đúng thời gian theo khoảng cách trong tranh.
// Khoá không tiền tố thuộc quan-scene; tiền tố street- thuộc street-scene; đường đi vỉa hè: streetEntry, streetWaitSpots, streetTables…
import { STREET, QUAN, GRILL_SLOTS } from "../data/scene.js?v=c12";

const pt = (v) => (Array.isArray(v) && typeof v[0] === "number" && v.length >= 2 ? [v[0], v[1]] : Array.isArray(v?.at) ? [v.at[0], v.at[1]] : null);
const pts = (v) => {
  const a = Array.isArray(v) && Array.isArray(v[0]) ? v : Array.isArray(v?.spots) ? v.spots : Array.isArray(v?.points) ? v.points : null;
  return a && a.every((p) => Array.isArray(p) && typeof p[0] === "number") ? a.map((p) => [p[0], p[1]]) : null;
};
function loadTables(list, fallback) {
  if (!Array.isArray(list) || !list.length) return fallback;
  const out = [];
  for (const t of list) {
    const at = pt(t?.at), seats = t?.seats === 4 ? 4 : 2;
    const spots = Array.isArray(t?.seatSpots) ? t.seatSpots.map((s) => ({ at: pt(s?.at || s), face: s?.face === "left" ? "left" : "right" })).filter((s) => s.at) : [];
    if (!at || typeof t.id !== "string" || spots.length < seats) continue;
    const fb = fallback.find((f) => f.id === t.id);
    out.push({
      id: t.id, seats, unlock: Number.isInteger(t.unlock) ? t.unlock : fb?.unlock ?? 1, at, seatSpots: spots.slice(0, seats),
      plateSpots: pts(t.plateSpots) || spots.slice(0, seats).map((s) => [Math.round((s.at[0] + at[0]) / 2), at[1] - 120]),
      servePoint: pt(t.servePoint) || [at[0], 610], ...(typeof t.joinWith === "string" ? { joinWith: t.joinWith } : fb?.joinWith ? { joinWith: fb.joinWith } : {}),
    });
  }
  return out.length ? out : fallback;
}

/** Ghép placements của manifest với dự phòng cho một cảnh ("street" | "quan"). */
export function buildPoints(stage, placements = {}) {
  const P = placements || {};
  const street = stage === "street";
  const FB = street ? STREET : QUAN;
  const key = (k) => (street ? "street-" + k : k);
  const at = (k) => pt(P[key(k)]) || FB[k] || null;
  const grillAt = at("grill");
  const slotRel = pts(P[key("grill")]?.slots) || GRILL_SLOTS;
  const slots = slotRel.length >= 6 ? slotRel.slice(0, 6) : GRILL_SLOTS;
  // slots trong manifest có thể là toạ độ tuyệt đối (lớn) hoặc tương đối anchor bếp (nhỏ, có số âm)
  const absolute = slots.every((p) => p[0] > 0 && p[1] > 200);
  const out = {
    stage,
    owner: at("owner"), grill: grillAt, grillSlots: slots.map((p) => (absolute ? p : [grillAt[0] + p[0], grillAt[1] + p[1]])),
    entry: pt(street ? P.streetEntry : P.door) || FB.entry,
    waitSpots: pts(street ? P.streetWaitSpots : P.waitSpots) || FB.waitSpots,
    queueSpots: pts(street ? P.streetQueueSpots : P.queueSpots) || FB.queueSpots,
    exitPath: pts(street ? P.streetExitPath : P.exitPath) || FB.exitPath,
    aisle: pts(street ? P.streetAisle : P.aisle) || FB.aisle,
    tables: loadTables(street ? P.streetTables : P.tables, FB.tables),
  };
  if (!street && out.waitSpots.length < 4) { const qb = pt(P["queue-bench"]); out.waitSpots = [...out.waitSpots, qb ? [qb[0] + 24, qb[1] + 6] : [962, 469]]; } // V: chỗ chờ thứ 4 cạnh ghế chờ (cấp 16 waitMax 4; manifest chỉ có 3)
  for (const k of ["suon-tray", "charcoal-sack", "plate-stack", "bi-tray", "mo-hanh-pot", "sauce-jar", "chili-jar", "glass-case", "pickle-jar", "cucumber-tray", "box-stack", "cash-tin", "ledger", "rice-cooker", "soup-pot", "steamer", "egg-pan", "tea-cooler", "wash-tub", "water-can"]) out[k] = at(k);
  if (!street) for (const k of ["helper-home", "grill-2", "rice-cooker-2", "electric-blower", "smoke-hood"]) out[k] = at(k);
  if (!street && out["grill-2"]) { const rel = pts(P["grill-2"]?.slots) || GRILL_SLOTS; out.grill2Slots = rel.slice(0, 6).map((p) => [out["grill-2"][0] + p[0], out["grill-2"][1] + p[1]]); } // A: bếp than thứ hai
  else for (const k of ["awning", "signboard", "lantern-string"]) out[k] = at(k);
  return out;
}

let CONF = { street: buildPoints("street"), quan: buildPoints("quan") };
/** game.js gọi một lần với manifest.placements. */
export function configureScene(placements) { CONF = { street: buildPoints("street", placements), quan: buildPoints("quan", placements) }; return CONF; }
export const scenePoints = (stage) => CONF[stage === "quan" ? "quan" : "street"];

// ---------- hình học đường đi ----------
export const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
export function pathLen(path) { let l = 0; for (let i = 1; i < path.length; i++) l += dist(path[i - 1], path[i]); return l; }
/** Vị trí trên đường gấp khúc theo quãng đã đi (px). */
export function alongDist(path, d) {
  if (path.length < 2) return path[0];
  let left = Math.max(0, d);
  for (let i = 1; i < path.length; i++) {
    const l = dist(path[i - 1], path[i]);
    if (left <= l || i === path.length - 1) { const f = l ? Math.min(1, left / l) : 1; return [path[i - 1][0] + (path[i][0] - path[i - 1][0]) * f, path[i - 1][1] + (path[i][1] - path[i - 1][1]) * f]; }
    left -= l;
  }
  return path[path.length - 1];
}
export const along = (path, p) => alongDist(path, Math.max(0, Math.min(1, p)) * pathLen(path));

/** Sau quầy (bếp, thau, nồi) hay ngoài sàn (bàn, chỗ chờ). Ranh giới = điểm đầu lối đi (đầu quầy). */
const behind = (P, p) => p[0] < P.aisle[0][0] - 4 && p[1] < P.aisle[1][1] - 20;
/** Đường đi của chủ quán: trong quầy đi thẳng; ra sàn thì qua đầu quầy rồi theo lối đi (y của lối đi). */
export function ownerRoute(P, from, to) {
  const lane = P.aisle[1][1];
  const a = behind(P, from), b = behind(P, to);
  if (a && b) return [from, to];
  const gate = [P.aisle[0], P.aisle[1]];
  const onLane = (p) => [p[0], lane];
  if (a && !b) return [from, ...gate, onLane(to), to];
  if (!a && b) return [from, onLane(from), ...gate.slice().reverse(), to];
  return [from, onLane(from), onLane(to), to];
}
/** Khách: cửa → chỗ chờ; chỗ chờ → ghế (theo lối đi); ghế → cửa ra (theo lối đi rồi exitPath). */
export function guestIn(P, spot) { return [P.entry, spot]; }
export function guestToSeat(P, from, seat) { const lane = P.aisle[1][1]; return [from, [from[0], lane], [seat[0], lane], seat]; }
export function guestOut(P, from) { const lane = P.aisle[1][1]; const ex = P.exitPath; return [from, [from[0], lane], ...ex]; }
export function shipperIn(P, spot) { return [P.entry, [P.entry[0] - 40, P.aisle[1][1] + 60], [spot[0] + 60, spot[1] - 6], spot]; }
export function shipperOut(P, spot) { return [spot, [spot[0] + 60, spot[1] - 6], [P.entry[0] - 40, P.aisle[1][1] + 60], P.entry]; }
