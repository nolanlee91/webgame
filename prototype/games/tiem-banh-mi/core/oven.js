// Lò và tủ kính (GAME-DESIGN §3.1, ECONOMY §3). Thuần: thời gian là ms ca (sh.t).
// Vỏ: phôi → vàng nhạt (sống) → vàng óng (chín) → nâu sậm (xém) → đen (cháy). Rút: chín 100 · xém 90 · sống 60 · cháy = bỏ (hao phôi + gas).
// Bánh ra lò vào tủ kính, độ giòn −1 mỗi 2,5 s ca. Nướng lại ở lò than: ≥ 4 s đưa giòn lên ít nhất 85, quá 10 s là cháy ổ.
import { OVENS, PULL_CRISP, RAW_UNTIL, DISPLAY, TOASTER, TOAST_TO, STOCK } from "../data/economy.js?v=b1";

export const ovenOf = (s) => OVENS[s.oven] || OVENS.mini;
export const traySize = (s) => ovenOf(s).tray + (s.owned?.["tray-6"] && s.oven === "mini" ? 2 : 0);
export const caseCap = (s) => DISPLAY.cap + (s.owned?.["warm-case"] ? 4 : 0);
export const decayMs = (s) => (s.owned?.["warm-case"] ? 4200 : DISPLAY.decayMs);

/** Mức nướng theo số giây trong lò. */
export function doneness(sec, oven = OVENS.mini) {
  if (sec < RAW_UNTIL) return "raw";
  if (sec < oven.golden[0]) return "pale";
  if (sec <= oven.golden[1]) return "golden";
  if (sec <= oven.dark) return "dark";
  return "burnt";
}
/** Màu vỏ cho thanh tiến trình (ART-DIRECTION §2). */
export const CRUST = { raw: "#E9C48A", pale: "#E9C48A", golden: "#E3A04A", dark: "#8E4F22", burnt: "#3B2418" };
/** Độ giòn khi rút (null = cháy, bỏ mẻ). */
export function pullCrisp(level) {
  if (level === "burnt") return null;
  if (level === "golden") return PULL_CRISP.golden;
  if (level === "dark") return PULL_CRISP.dark;
  return PULL_CRISP.raw;
}
export const batchSec = (sh, b) => Math.max(0, (sh.t - b.t0) / 1000);
export const batchLevel = (s, b) => doneness(batchSec(s.shift, b), ovenOf(s));
/** Số ổ đang có + đang nướng (để không nướng quá sức chứa tủ). */
export const bakingCount = (sh) => sh.oven.reduce((a, b) => a + (b ? b.n : 0), 0);

export function newLoaf(s, crisp, src = "oven", extra = {}) {
  s.nextLoaf = (s.nextLoaf || 0) + 1;
  return { id: s.nextLoaf, crisp, src, ...extra };
}

/** Bỏ mẻ mới vào ngăn `slot`. Trừ phôi + 1 phần gas. */
export function loadBatch(s, slot, ev) {
  const sh = s.shift;
  if (!sh) return { err: "no-shift" };
  if (sh.away) return { err: "away" };
  if (!Number.isInteger(slot) || slot < 0 || slot >= sh.oven.length) return { err: "bad-slot" };
  if (sh.oven[slot]) return { err: "slot-busy" };
  if ((s.stock.gas || 0) < 1) { ev.push({ type: "noGas" }); return openGasDialog(s, ev); }
  const room = caseCap(s) - sh.case.length - bakingCount(sh);
  if (room <= 0) return { err: "case-full" };
  const n = Math.min(traySize(s), room, s.stock.phoi || 0);
  if (n <= 0) {
    if (!sh.dialog) { sh.dialog = { kind: "stockout", id: "banh", cid: null }; ev.push({ type: "stockout", id: "banh" }); }
    return { ok: true };
  }
  s.stock.phoi -= n;
  s.stock.gas -= 1;
  sh.oven[slot] = { n, t0: sh.t, said: {} };
  sh.stats.batches++;
  ev.push({ type: "batchLoaded", slot, n });
  return { ok: true };
}
/** Hết gas khi bỏ mẻ: hội thoại cứu (core/rescue.js) — luôn có lựa chọn miễn phí. */
function openGasDialog(s, ev) {
  if (!s.shift.dialog) { s.shift.dialog = { kind: "stockout", id: "gas", cid: null }; ev.push({ type: "stockout", id: "gas" }); }
  return { ok: true };
}

/** Rút mẻ ở ngăn `slot`: bánh vào tủ (hoặc bỏ nếu cháy). */
export function pullBatch(s, slot, ev) {
  const sh = s.shift;
  if (!sh) return { err: "no-shift" };
  if (sh.away) return { err: "away" };
  const b = sh.oven[slot];
  if (!b) return { err: "empty-slot" };
  const level = batchLevel(s, b);
  const crisp = pullCrisp(level);
  sh.oven[slot] = null;
  if (crisp === null) {
    addWaste(sh, "burnt", b.n * STOCK.phoi.cost + STOCK.gas.cost, `Mẻ cháy (${b.n} ổ)`);
    sh.stats.burntBatches++;
    ev.push({ type: "batchBurnt", slot, n: b.n });
    return { ok: true };
  }
  for (let i = 0; i < b.n; i++) sh.case.push(newLoaf(s, crisp, "oven", level === "dark" ? { dark: true } : {}));
  if (level === "golden") sh.stats.goldenPulls++;
  ev.push({ type: "batchPulled", slot, n: b.n, level, crisp });
  return { ok: true };
}

export function addWaste(sh, kind, k, label) {
  sh.waste[kind] = Math.round(((sh.waste[kind] || 0) + k) * 10) / 10;
  if (label) { sh.wasteLog.push(label); if (sh.wasteLog.length > 30) sh.wasteLog.shift(); }
}

/** Nhịp lò + tủ kính + lò than trong tick: báo "chín" / "xém" / "cháy" một lần mỗi mẻ, độ giòn giảm. */
export function tickOven(s, dt, ev) {
  const sh = s.shift;
  sh.oven.forEach((b, slot) => {
    if (!b) return;
    const lv = batchLevel(s, b);
    if (lv !== "raw" && lv !== "pale" && !b.said[lv]) { b.said[lv] = true; ev.push({ type: "batch" + lv[0].toUpperCase() + lv.slice(1), slot }); }
  });
  const d = dt / decayMs(s);
  for (const l of sh.case) l.crisp = Math.max(0, l.crisp - d);
  for (const bd of sh.boards) {
    const l = bd.loaf;
    if (!l) continue;
    if (l.toastT0 !== null && l.toastT0 !== undefined) {
      const el = sh.t - l.toastT0;
      if (el > TOASTER.burnMs && !l.burntWarned) { l.burntWarned = true; ev.push({ type: "toastBurnt" }); }
      else if (el >= TOASTER.ms && !l.readyWarned) { l.readyWarned = true; ev.push({ type: "toastReady" }); }
    } else l.crisp = Math.max(0, l.crisp - d);
  }
}

/** Mẻ đầu ngày ở Chuẩn bị ca: canh lò một lần ngoài giờ ca (UI đo số giây). Tối đa số ngăn × 2 mẻ. */
export function firstBatch(s, sec, ev) {
  if (s.shift) return { err: "shift-open" };
  if (!(typeof sec === "number" && Number.isFinite(sec) && sec >= 0 && sec <= 120)) return { err: "bad-sec" };
  const max = ovenOf(s).slots * 2;
  s.prep = s.prep || { batches: 0, loaves: [], burnt: 0 };
  if (s.prep.batches >= max) return { err: "prep-max" };
  if ((s.stock.gas || 0) < 1) return { err: "out-of-stock", detail: { id: "gas" } };
  const room = caseCap(s) - s.prep.loaves.length;
  const n = Math.min(traySize(s), room, s.stock.phoi || 0);
  if (n <= 0) return { err: room <= 0 ? "case-full" : "out-of-stock", detail: { id: "phoi" } };
  const level = doneness(sec, ovenOf(s));
  const crisp = pullCrisp(level);
  s.stock.phoi -= n; s.stock.gas -= 1; s.prep.batches++;
  if (crisp === null) s.prep.burnt += n;
  else for (let i = 0; i < n; i++) s.prep.loaves.push({ crisp, dark: level === "dark" });
  ev.push({ type: "firstBatch", n, level, crisp });
  return { ok: true, level, n };
}

/** Lò than: bắt đầu nướng lại ổ trên thớt. Trả độ giòn mới khi lấy ra theo số ms đã nướng. */
export function toastResult(loaf, ms) {
  if (ms > TOASTER.burnMs) return { crisp: 100, burnt: true, toasted: true };
  if (ms >= TOASTER.ms) return { crisp: Math.max(loaf.crisp, TOAST_TO), toasted: true };
  const p = Math.max(0, ms / TOASTER.ms);
  return { crisp: loaf.crisp + p * Math.max(0, TOAST_TO - loaf.crisp), toasted: false };
}
