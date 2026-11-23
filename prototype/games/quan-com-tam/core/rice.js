// Trạm cơm (GAME-DESIGN §3.2): nồi cơm theo mẻ (gạo tấm), hũ mỡ hành, chảo trứng ốp la (cấp 2), xửng hấp chả (cấp 4). Thuần.
// Nồi: bấm Nấu ⇒ lấy gạo tấm trong kho bù cho đầy nồi, 40 giây sau có cơm; trong lúc nấu không xới được.
// Mỡ hành: hũ 20 phần, làm 8 giây ở bếp phụ (chủ quán đứng làm) bằng một bộ mỡ heo + hành lá; hũ giữ 2 ngày.
// Trứng: sống < 6 giây · lòng đào 6–9 · lòng vừa 9–13 · chín kỹ 13–18 · cháy > 18.
import { RICE, EGG, STEAMER, MO_HANH, STOCK } from "../data/economy.js?v=c2";

export function freshRice(n = 0, big = false) { const R = big ? RICE.big : RICE.small; return { n, size: R.size, ms: R.ms, cooking: null }; }
/** Bấm Nấu. Trả { ok, add } hoặc lỗi: rice-cooking (đang nấu), rice-full (nồi còn đầy), no-gao (hết gạo tấm). */
export function startCook(s, rice, t, ev = []) {
  if (rice.cooking) return { err: "rice-cooking" };
  const room = rice.size - rice.n;
  if (room <= 0) return { err: "rice-full" };
  const have = s.stock["gao-tam"] || 0;
  if (have <= 0) return { err: "no-gao" };
  const add = Math.min(room, have);
  s.stock["gao-tam"] = have - add;
  rice.cooking = { until: t + rice.ms, add };
  ev.push({ type: "riceCooking", add, ms: rice.ms });
  return { ok: true, add };
}
/** Nấu ngay (bảng Chuẩn bị: không tính giờ). */
export function cookNow(s, rice, ev = []) {
  if (rice.cooking) { rice.n += rice.cooking.add; rice.cooking = null; }
  const room = rice.size - rice.n, have = s.stock["gao-tam"] || 0;
  if (room <= 0) return { err: "rice-full" };
  if (have <= 0) return { err: "no-gao" };
  const add = Math.min(room, have);
  s.stock["gao-tam"] = have - add;
  rice.n += add;
  ev.push({ type: "riceReady", n: rice.n, prep: true });
  return { ok: true, add };
}
export function tickRice(rice, t, ev = []) {
  if (rice.cooking && t >= rice.cooking.until) { rice.n += rice.cooking.add; rice.cooking = null; ev.push({ type: "riceReady", n: rice.n }); }
}
/** Xới k vá. */
export function takeRice(rice, k = 1) {
  if (rice.n >= k) { rice.n -= k; return { ok: true }; }
  return { err: rice.cooking ? "rice-cooking" : "rice-empty" };
}
export const riceCost = (n) => n * STOCK["gao-tam"].cost;

// ---------- mỡ hành ----------
export function freshMoHanh(n = 0, day = 1) { return { n, day }; }
/** Làm một hũ (đã đủ thời gian đứng làm): trừ một bộ mỡ hành trong kho, hũ đầy 20 phần. */
export function makeJar(s, ev = []) {
  if ((s.stock["mo-hanh-bo"] || 0) <= 0) return { err: "no-mo-hanh-bo" };
  s.stock["mo-hanh-bo"]--;
  const waste = s.moHanh.n;
  s.moHanh = { n: MO_HANH.jar, day: s.day };
  ev.push({ type: "moHanhReady", n: MO_HANH.jar, waste });
  return { ok: true, waste };
}
export function takeMoHanh(s, k = 1) {
  if ((s.moHanh?.n || 0) >= k) { s.moHanh.n -= k; return { ok: true }; }
  return { err: "mo-hanh-empty" };
}

// ---------- chảo trứng ----------
export function eggState(pan, t) {
  if (!pan?.egg) return null;
  const sec = (t - pan.egg.t0) / 1000;
  if (sec >= EGG.burnt) return "burnt";
  if (sec >= EGG.hard) return "hard";
  if (sec >= EGG.set) return "set";
  if (sec >= EGG.runny) return "runny";
  return "raw";
}
export function startEgg(s, pan, t, ev = []) {
  if (pan.egg) return { err: "pan-busy" };
  if ((s.stock.trung || 0) <= 0) return { err: "no-trung" };
  s.stock.trung--;
  pan.egg = { t0: t };
  ev.push({ type: "eggFrying" });
  return { ok: true };
}
/** Gắp trứng ra: trả trạng thái lúc gắp (raw không gắp được). */
export function takeEgg(pan, t) {
  const st = eggState(pan, t);
  if (!st) return { err: "no-egg" };
  if (st === "raw") return { err: "egg-raw" };
  pan.egg = null;
  return { ok: true, state: st };
}

// ---------- xửng hấp chả ----------
export function freshSteamer() { return { done: 0, cooking: null }; }
export function loadSteamer(s, st, t, ev = []) {
  if (st.cooking) return { err: "steamer-busy" };
  const n = Math.min(STEAMER.tray, s.stock.cha || 0);
  if (n <= 0) return { err: "no-cha" };
  s.stock.cha -= n;
  st.cooking = { until: t + STEAMER.ms, n };
  ev.push({ type: "steaming", n });
  return { ok: true, n };
}
export function tickSteamer(st, t, ev = []) {
  if (st?.cooking && t >= st.cooking.until) { st.done += st.cooking.n; ev.push({ type: "chaReady", n: st.cooking.n }); st.cooking = null; }
}
