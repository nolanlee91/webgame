// Bếp than (GAME-DESIGN §3.1, ECONOMY §3.1). Thuần, không DOM.
// Vỉ 6 chỗ: 2 nóng (×1,5) · 2 vừa (×1) · 2 giữ ấm (×0,25, không cháy trước 60 giây ở vùng ấm).
// Mỗi miếng 2 mặt: sides[0] = mặt đang úp xuống than (chỉ mặt này chín), sides[1] = mặt trên. Lật = đổi chỗ hai mặt.
// Mỗi mặt 0 → 160: < 60 sống · 60–99 tái · 100–114 chín · 115–129 cháy cạnh · ≥ 130 cháy đen. Kết quả miếng = mặt kém hơn.
// Than 0–100 cháy −0,5/giây (quạt ×2); nấc than: ≥ 60 rực ×1,2 · 30–59 vừa ×1 · 10–29 yếu ×0,6 · < 10 tàn ×0. Quạt: +1 nấc.
// Thêm than: +35 sau 4 giây; thêm khi đang rực ⇒ lửa bùng 3 giây (vùng nóng ×2). Khói: +1/giây quạt, +3/giây khi có miếng ≥ 125, −2/giây khi yên.
import { GRILL } from "../data/economy.js?v=c2";

export const zoneOf = (i) => GRILL.zones[i % GRILL.slots] || "mid"; // A: bếp 2 (chỗ 6–11) cùng luật vùng
export function freshGrill(coal = 0) {
  return { slots: Array.from({ length: GRILL.slots }, () => null), coal, pending: [], flareUntil: 0, fan: false, smoke: 0, smokeMax: 0, nextId: 1 };
}

/** Nấc than hiện tại (không tính quạt): index trong GRILL.heat. */
export function heatIndex(coal) { return GRILL.heat.findIndex((h) => coal >= h.min); }
/** Hệ số nhiệt của cả bếp (có tính quạt). */
export function heatMul(g) {
  if (g.coal <= 0) return 0;
  const i = heatIndex(g.coal);
  if (!g.fan && !g.blower) return GRILL.heat[i].mul; // A: quạt máy cũng +1 nấc
  if (i === 0) return GRILL.blazeMul;
  return GRILL.heat[i - 1].mul;
}
/** Khoá frame bếp: cold (chưa nhóm / 0) · low · mid · high · ash (đã cháy hết, còn tro). */
export function heatKey(g, lit = true) {
  if (g.coal <= 0) return lit ? "ash" : "cold";
  return GRILL.heat[heatIndex(g.coal)].key === "ash" ? "low" : GRILL.heat[heatIndex(g.coal)].key;
}

/** Trạng thái một mặt. */
export function sideState(v) {
  if (v >= GRILL.burntMin) return "burnt";
  if (v >= GRILL.charMin) return "charred";
  if (v >= GRILL.doneMin) return "done";
  if (v >= GRILL.halfMin) return "half";
  return "raw";
}
const RANK = { raw: 0, half: 1, done: 4, charred: 3, burnt: 2 };
/** Kết quả miếng = mặt kém hơn: có mặt cháy đen ⇒ burnt; có mặt chưa chín ⇒ raw / half; có mặt cháy cạnh ⇒ charred; còn lại done. */
export function itemResult(it) {
  if (!it) return null;
  const a = sideState(it.sides[0]), b = sideState(it.sides[1]);
  if (a === "burnt" || b === "burnt") return "burnt";
  if (a === "raw" || b === "raw") return "raw";
  if (a === "half" || b === "half") return "half";
  if (a === "charred" || b === "charred") return "charred";
  return "done";
}
export const isCooked = (it) => ["done", "charred"].includes(itemResult(it));
export const isDry = (it) => !!it && it.fresh < GRILL.dryBelow;
export const resultRank = (r) => RANK[r] ?? 0;
/** Frame grill-items cho một miếng (theo mặt trên khi đang nướng, theo kết quả khi đã chín hai mặt). */
export function itemFrame(it) {
  const r = itemResult(it);
  if (r === "done" || r === "charred" || r === "burnt") return `${it.item}-${r}`;
  const top = sideState(it.sides[1]), bottom = sideState(it.sides[0]);
  // mép cháy của mặt dưới lộ ra ngoài
  if (bottom === "burnt" || bottom === "charred") return `${it.item}-${bottom}`;
  return `${it.item}-${top === "raw" && bottom === "raw" ? "raw" : "half"}`;
}

/** Bỏ miếng sống lên chỗ trống. */
export function placeItem(g, slot, item, freshMax = 100) {
  if (!(slot >= 0 && slot < g.slots.length)) return { err: "bad-slot" };
  if (g.slots[slot]) return { err: "slot-busy" };
  if (!GRILL.side[item]) return { err: "bad-item" };
  const it = { id: g.nextId++, item, sides: [0, 0], fresh: freshMax, freshMax, warmMs: 0, flips: 0, perfect: 0, said: {} };
  g.slots[slot] = it;
  return { ok: true, it };
}
/** Lật: mặt dưới lên trên. Lật đúng lúc (mặt dưới 100–114) ⇒ +1 lần "tay nướng". */
export function flip(g, slot, ev = []) {
  const it = g.slots[slot];
  if (!it) return { err: "empty-slot" };
  const b = it.sides[0];
  const perfect = b >= GRILL.perfect[0] && b <= GRILL.perfect[1];
  it.sides = [it.sides[1], it.sides[0]];
  it.flips++;
  if (perfect) it.perfect++;
  it.said = { ...it.said, done: false, near: false };
  ev.push({ type: "flip", slot, perfect, item: it.item });
  return { ok: true, perfect };
}
export function takeItem(g, slot) {
  const it = g.slots[slot];
  if (!it) return { err: "empty-slot" };
  g.slots[slot] = null;
  return { ok: true, it };
}
/** Dời miếng sang chỗ khác (thường là sang vùng giữ ấm). */
export function moveItem(g, from, to) {
  if (!g.slots[from]) return { err: "empty-slot" };
  if (!(to >= 0 && to < g.slots.length) || g.slots[to]) return { err: "slot-busy" };
  const it = g.slots[from];
  g.slots[from] = null;
  if (zoneOf(to) !== "warm") it.warmMs = 0;
  g.slots[to] = it;
  return { ok: true };
}
/** Chỗ trống ở vùng giữ ấm (ưu tiên chỗ trái). */
export const freeWarm = (g) => g.slots.findIndex((x, i) => !x && zoneOf(i) === "warm");
/** Chỗ trống nóng nhất. */
export const hottestFree = (g) => g.slots.findIndex((x, i) => !x && zoneOf(i) !== "warm");

/** Thêm một rổ than (đã trừ kho ở ngoài): +35 sau 4 giây; đang rực thì lửa bùng. */
export function addCoal(g, t, ev = []) {
  g.pending.push({ at: t + GRILL.coalDelayMs, n: GRILL.addCoal });
  if (g.coal >= GRILL.flareAt) { g.flareUntil = t + GRILL.flareMs; ev.push({ type: "flare" }); }
  ev.push({ type: "coalAdded", level: g.coal });
  return { ok: true };
}
export function setFan(g, on) { g.fan = !!on; return { ok: true }; }

/**
 * Cân bằng M3: vùng chín (100–114) và cháy cạnh (115–129) kéo dài theo GIÂY mỗi vùng (GRILL.bandSec), không theo tốc độ nướng của món.
 * Ở than rực (×1,2), vùng nóng chín được ~2,5 giây, vừa ~4,5 giây; quạt / lửa bùng / than yếu co giãn theo nhiệt. Trước 100 nướng như cũ.
 * Tốc độ trong dải = min(tốc độ thường, 15 / giây_dải × nhiệt / 1,2) ⇒ không bao giờ nhanh hơn ngoài dải (vùng giữ ấm vẫn chậm).
 */
export function bandRate(z, band, heat) {
  const sec = GRILL.bandSec?.[z]?.[band];
  if (!sec) return Infinity;
  return ((GRILL.charMin - GRILL.doneMin) / (sec * 1000)) * (heat / GRILL.heat[0].mul);
}
export function advanceSide(v, rate, dt, z, heat) {
  let left = dt;
  for (let guard = 0; guard < 4 && left > 0; guard++) {
    const band = v >= GRILL.burntMin ? null : v >= GRILL.charMin ? "charred" : v >= GRILL.doneMin ? "done" : null;
    const r = band ? Math.min(rate, bandRate(z, band, heat)) : rate;
    if (!(r > 0)) return v;
    const edge = v < GRILL.doneMin ? GRILL.doneMin : v < GRILL.charMin ? GRILL.charMin : v < GRILL.burntMin ? GRILL.burntMin : Infinity;
    const need = (edge - v) / r;
    if (need >= left) return v + r * left;
    v = edge; left -= need;
  }
  return v;
}
/** Giây miếng ở trong vùng chín / cháy cạnh (test + gợi ý): theo vùng, nhiệt hiện tại. */
export function windowSec(g, z, band = "done", item = "suon") {
  const heat = heatMul(g);
  const normal = (100 / (GRILL.side[item] * 1000)) * GRILL.zoneMul[z] * heat;
  const r = Math.min(normal, bandRate(z, band, heat));
  return r > 0 ? (GRILL.charMin - GRILL.doneMin) / r / 1000 : Infinity;
}

/** Một nhịp bếp: than cháy, than mới bén, nướng mặt dưới, giữ ấm, khói. */
/** speed: hệ số chung (ca hướng dẫn ngày 1 nướng chậm hơn: 0,7). */
export function tickGrill(g, dt, t, ev = [], speed = 1) {
  const sec = dt / 1000;
  // than
  for (const p of g.pending.filter((x) => x.at <= t)) g.coal = Math.min(GRILL.coalMax, g.coal + p.n);
  g.pending = g.pending.filter((x) => x.at > t);
  const before = g.coal;
  g.coal = Math.max(0, g.coal - GRILL.burnPerSec * (g.fan ? GRILL.fanBurnMul : g.blower ? 1.5 : 1) * sec); // A: quạt máy than ×1,5
  if (before >= 10 && g.coal < 10) ev.push({ type: "coalOut" });
  else if (before >= 25 && g.coal < 25) ev.push({ type: "coalLow" });
  const heat = heatMul(g) * speed;
  const flare = t < g.flareUntil;
  let burning = false;
  for (let i = 0; i < g.slots.length; i++) {
    const it = g.slots[i];
    if (!it) continue;
    const z = zoneOf(i);
    const fl = flare && z === "hot" ? GRILL.flareMul : 1;
    const rate = (100 / (GRILL.side[it.item] * 1000)) * GRILL.zoneMul[z] * heat * fl;
    const old = it.sides[0];
    let nv = Math.min(GRILL.sideMax, advanceSide(old, rate, dt, z, heat * fl));
    if (z === "warm") {
      it.warmMs += dt;
      if (it.warmMs < GRILL.warmSafeMs) nv = Math.min(nv, Math.max(old, GRILL.perfect[1]));
      if (isCooked(it)) it.fresh = Math.max(0, it.fresh - dt / GRILL.freshDecayMs);
    }
    it.sides[0] = nv;
    if (!it.said.done && old < GRILL.doneMin && nv >= GRILL.doneMin) { it.said.done = true; ev.push({ type: "sideDone", slot: i, both: it.sides[1] >= GRILL.doneMin }); }
    if (!it.said.near && old < 112 && nv >= 112) { it.said.near = true; ev.push({ type: "nearBurn", slot: i }); }
    if (!it.said.burnt && old < GRILL.burntMin && nv >= GRILL.burntMin) { it.said.burnt = true; ev.push({ type: "burnt", slot: i, item: it.item }); }
    if (it.sides[0] >= GRILL.nearBurn || it.sides[1] >= GRILL.nearBurn) burning = true;
  }
  const S = GRILL.smoke;
  const hood = g.hood ? 0.4 : 1; // A: chụp hút khói ×0,4; quạt máy khói ×0,6
  if (g.fan) g.smoke += S.fan * sec * hood;
  else if (g.blower) g.smoke += S.fan * 0.6 * sec * hood;
  if (burning) g.smoke += S.burning * sec * hood;
  if (!g.fan && !g.blower && !burning) g.smoke -= S.decay * sec;
  const sb = g.smoke;
  g.smoke = Math.max(0, Math.min(100, g.smoke));
  if (sb >= S.high && g.smokeMax < S.high) ev.push({ type: "smokeHigh" });
  g.smokeMax = Math.max(g.smokeMax, g.smoke);
}
