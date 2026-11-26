// Đồ nấu theo mẻ (Milestone 5, ECONOMY §1, §3, §6): trứng ốp la chiên trên chảo (6 giây / trứng; chảo đôi chiên 2 trứng cùng lúc) và thịt nướng
// trên bếp than (mẻ 5 phần, chín 25 giây, cháy sau 33 giây; thịt chín giữ ấm tới hết ca). Bước "Nhân" lấy trứng / thịt ĐÃ CHÍN; chưa có thì
// tự bắc chảo / bỏ mẻ thịt (nếu còn hàng sống) và báo chờ. Dư cuối ca ghi hao hụt. Thuần: thời gian là ms ca (sh.t).
import { STOCK } from "../data/economy.js?v=b11";
import { addWaste } from "./oven.js?v=b11";

export const COOK = { eggMs: 6000, grill: { n: 5, golden: 25000, burnt: 33000 } };
export const panSlots = (s) => (s.owned?.["egg-pan-2"] ? 2 : s.owned?.["egg-pan"] ? 1 : 0);
export const freshCook = (s) => ({ pan: Array.from({ length: Math.max(1, panSlots(s)) }, () => null), eggs: 0, grill: null, meat: 0, meatAt: null });
export function loadCook(c, s, t) {
  const o = freshCook(s);
  if (!c || typeof c !== "object") return o;
  o.pan = o.pan.map((_, i) => (typeof c.pan?.[i] === "number" && Number.isFinite(c.pan[i]) ? Math.min(t, c.pan[i]) : null));
  o.eggs = Math.max(0, Math.min(30, c.eggs | 0)); o.meat = Math.max(0, Math.min(60, c.meat | 0));
  o.meatAt = typeof c.meatAt === "number" && Number.isFinite(c.meatAt) ? Math.min(t, c.meatAt) : null;
  if (c.grill && typeof c.grill === "object" && Number.isFinite(c.grill.t0)) o.grill = { n: Math.max(1, Math.min(10, c.grill.n | 0 || 1)), t0: Math.min(t, c.grill.t0), said: { ready: !!c.grill.said?.ready, burnt: !!c.grill.said?.burnt } };
  return o;
}
const ck = (s) => (s.shift.cook ||= freshCook(s));
export const cookOf = (s) => s.shift?.cook || null;

/** Bắc một trứng lên chảo (ô trống đầu tiên). */
export function fry(s, ev) {
  const sh = s.shift;
  if (!sh) return { err: "no-shift" };
  if (sh.away) return { err: "away" };
  if (!panSlots(s)) return { err: "locked" };
  const c = ck(s);
  while (c.pan.length < panSlots(s)) c.pan.push(null);
  const i = c.pan.findIndex((x) => x === null);
  if (i < 0) return { err: "pan-busy" };
  if ((s.stock.trung || 0) < 1) return { err: "out-of-stock", detail: { id: "trung" } };
  s.stock.trung -= 1;
  c.pan[i] = sh.t;
  ev.push({ type: "eggFrying", slot: i });
  return { ok: true };
}
/** Bỏ mẻ thịt lên bếp than (tối đa 5 phần). */
export function grillLoad(s, ev) {
  const sh = s.shift;
  if (!sh) return { err: "no-shift" };
  if (sh.away) return { err: "away" };
  if (!s.owned?.grill) return { err: "locked" };
  const c = ck(s);
  if (c.grill) return { err: "grill-busy" };
  const n = Math.min(COOK.grill.n, s.stock["thit-nuong"] || 0);
  if (n <= 0) return { err: "out-of-stock", detail: { id: "thit-nuong" } };
  s.stock["thit-nuong"] -= n;
  c.grill = { n, t0: sh.t, said: {} };
  ev.push({ type: "grillLoaded", n });
  return { ok: true };
}
export const grillLevel = (sh) => { const g = sh?.cook?.grill; if (!g) return null; const el = sh.t - g.t0; return el < COOK.grill.golden ? "raw" : el <= COOK.grill.burnt ? "golden" : "burnt"; };
/** Gắp mẻ thịt: chưa chín thì chưa gắp được; quá lửa thì cháy cả mẻ (hao hụt). */
export function grillPull(s, ev) {
  const sh = s.shift;
  if (!sh) return { err: "no-shift" };
  if (sh.away) return { err: "away" };
  const c = ck(s), g = c.grill;
  if (!g) return { err: "empty-slot" };
  const lv = grillLevel(sh);
  if (lv === "raw") return { err: "grill-raw" };
  c.grill = null;
  if (lv === "burnt") { addWaste(sh, "burnt", g.n * STOCK["thit-nuong"].cost, `Mẻ thịt nướng cháy (${g.n} phần)`); sh.stats.burntMeat = (sh.stats.burntMeat || 0) + 1; ev.push({ type: "grillBurnt", n: g.n, pulled: true }); return { ok: true }; }
  c.meat += g.n; c.meatAt = sh.t;
  ev.push({ type: "grillPulled", n: g.n });
  return { ok: true };
}
/** Nhịp chảo + bếp than trong tick. */
export function tickCook(s, ev) {
  const sh = s.shift, c = sh.cook;
  if (!c) return;
  c.pan.forEach((t0, i) => { if (t0 !== null && sh.t - t0 >= COOK.eggMs) { c.pan[i] = null; c.eggs++; ev.push({ type: "eggReady", slot: i }); } });
  const g = c.grill;
  if (g) {
    const el = sh.t - g.t0;
    if (el >= COOK.grill.golden && !g.said.ready) { g.said.ready = true; ev.push({ type: "grillReady" }); }
    if (el > COOK.grill.burnt && !g.said.burnt) { g.said.burnt = true; ev.push({ type: "grillBurnt", n: g.n }); }
  }
}
/** Bước Nhân cần `n` phần đồ nấu `id` ("trung" | "thit-nuong"). Có sẵn ⇒ lấy ra { ok }. Chưa có ⇒ tự bắc chảo / bỏ mẻ (nếu được), trả { wait }. */
export function takeCooked(s, id, n, ev) {
  const c = ck(s);
  if (id === "trung") {
    if (c.eggs >= n) { c.eggs -= n; return { ok: true }; }
    while (c.eggs + c.pan.filter((x) => x !== null).length < n && !fry(s, ev).err);
    return { wait: c.pan.some((x) => x !== null) ? "egg" : "egg-stock" };
  }
  if (c.meat >= n) { c.meat -= n; return { ok: true, held: c.meatAt !== null ? s.shift.t - c.meatAt : 0 }; }
  if (!c.grill) return grillLoad(s, ev).err ? { wait: "meat-stock" } : { wait: "meat" };
  return { wait: grillLevel(s.shift) === "raw" ? "meat" : "meat-pull" };
}
/** Chốt ca: trứng / thịt chín dư và mẻ đang nướng ghi hao hụt. */
export function cookLeftover(sh) {
  const c = sh.cook;
  if (!c) return;
  const eggs = c.eggs + c.pan.filter((x) => x !== null).length, meat = c.meat + (c.grill?.n || 0);
  if (eggs) addWaste(sh, "leftover", eggs * STOCK.trung.cost, `Trứng chiên dư (${eggs})`);
  if (meat) addWaste(sh, "leftover", meat * STOCK["thit-nuong"].cost, `Thịt nướng dư (${meat} phần)`);
}
