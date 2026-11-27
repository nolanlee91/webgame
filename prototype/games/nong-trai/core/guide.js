// TLC12-01: mũi tên hướng dẫn NV1–NV5 — việc kế tiếp mà trẻ cần làm, thuần (không DOM) để test được "chỉ chạm theo mũi tên".
// game.js highlight() đổi kết quả thành nút trên màn (chọn chế độ Gieo / Tưới, mở Kho, mở Bảng đơn…).
// Không có mục tiêu đúng nghĩa (hết cây chín, kho trống, thiếu hàng giao đơn) ⇒ đi vòng: thu cây chín / chờ cây / gieo thêm,
// kèm `hint` (game.js tự mở gợi ý khi `detour`).
import { TUTORIAL } from "../data/quests.js?v=m18";
import { CROP } from "../data/crops.js?v=m18";
import { currentQuest, questComplete } from "./quests.js?v=m18";
import { isReady } from "./plots.js?v=m18";
import { cropUnlocked } from "./progression.js?v=m18";
import { boardView, demand } from "./orders.js?v=m18";
import { sellable } from "./economy.js?v=m18";
import { ITEM } from "../data/catalog.js?v=m18";

const FARM_TARGETS = new Set(["plot-empty", "plot-growing", "plot-ready", "sell", "orders"]);
/** Thứ tự xét ô: ô giữa (12) trước rồi lần lượt — giống firstPlot cũ trong game.js. */
function firstPlot(s, pred) {
  const order = [12, ...s.plots.keys()];
  const i = order.find((k) => s.plots[k] && pred(s.plots[k], k));
  return i === undefined ? null : i;
}
const growing = (p, t) => !!p.crop && !isReady(p, t);
const mmss = (ms) => { const sec = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`; };

/** Thu cây chín / chờ cây đang lớn / gieo thêm `crop` — đường vòng khi nhiệm vụ chưa có gì để chạm. */
function detour(s, t, crop, why) {
  const ready = firstPlot(s, (p) => p.open && isReady(p, t));
  if (ready !== null) return { do: "harvest", i: ready, detour: true, hint: `${why} Chạm cây chín để thu hoạch.` };
  let soon = null;
  s.plots.forEach((p, i) => { if (p.open && growing(p, t) && (soon === null || p.readyAt < s.plots[soon].readyAt)) soon = i; });
  if (soon !== null) {
    const p = s.plots[soon];
    if (!p.watered) return { do: "water", i: soon, detour: true, hint: `${why} Tưới cây cho mau chín (còn ${mmss(p.readyAt - t)}).` };
    return { do: "wait", i: soon, ms: p.readyAt - t, detour: true, hint: `${why} Chờ cây chín… ${mmss(p.readyAt - t)}` };
  }
  const empty = firstPlot(s, (p) => p.open && !p.crop);
  if (empty !== null) return { do: "plant", i: empty, crop, detour: true, hint: `${why} Chọn hạt ${CROP[crop].name.toLowerCase()} rồi chạm ô đất trống.` };
  return null;
}

/** Món đơn đang thiếu mà ruộng trồng được (ưu tiên đơn đầu tiên chưa đủ hàng); không có ⇒ cà rốt. */
function missingCrop(s, slots) {
  for (const v of slots) {
    if (!v?.order || v.ready) continue;
    for (const it of v.items) if (it.owned < it.need && CROP[it.id] && cropUnlocked(s, it.id) && !CROP[it.id].requires) return it.id;
  }
  return "ca-rot";
}

/**
 * Việc kế tiếp cho NV hướng dẫn trên ruộng. null ⇒ không phải các NV này (game.js dùng nhánh cũ).
 * { do: "claim" } | { do: "plant", i, crop } | { do: "water", i } | { do: "harvest", i } | { do: "wait", i, ms }
 * | { do: "sell", id } (bán 1 món, không bao giờ "Bán hết") | { do: "deliver", slot }; `detour` + `hint` khi phải đi vòng.
 */
export function tutorialGoal(s, t) {
  const q = currentQuest(s);
  if (!q || TUTORIAL.indexOf(q) < 0 || !FARM_TARGETS.has(q.target)) return null;
  if (questComplete(s)) return { do: "claim" };
  if (q.target === "plot-empty") {
    const i = firstPlot(s, (p) => p.open && !p.crop);
    return i !== null ? { do: "plant", i, crop: "ca-rot" } : detour(s, t, "ca-rot", "Ruộng đã kín.");
  }
  if (q.target === "plot-growing") {
    const i = firstPlot(s, (p) => p.open && growing(p, t) && !p.watered);
    if (i !== null) return { do: "water", i };
    const e = firstPlot(s, (p) => p.open && !p.crop);
    if (e !== null) return { do: "plant", i: e, crop: "ca-rot", detour: true, hint: "Chưa có cây nào cần tưới. Gieo một hạt cà rốt rồi tưới nó." };
    return detour(s, t, "ca-rot", "Chưa có cây nào cần tưới.");
  }
  if (q.target === "plot-ready") {
    const i = firstPlot(s, (p) => p.open && isReady(p, t));
    return i !== null ? { do: "harvest", i } : detour(s, t, "ca-rot", "Chưa có cây chín.");
  }
  if (q.target === "sell") {
    const need = demand(s);
    const bag = Object.entries(s.inv).filter(([id, n]) => n > 0 && sellable(id) && ITEM[id]?.cat === "nong-san");
    // bán món dư so với đơn đang cần trước ⇒ giữ đủ hàng cho NV5 "Giao đơn"
    const spare = bag.find(([id, n]) => n > (need[id] || 0)) || bag[0];
    return spare ? { do: "sell", id: spare[0] } : detour(s, t, "ca-rot", "Kho chưa có nông sản để bán.");
  }
  // orders
  const b = boardView(s);
  const slots = [...b.slots, b.special, b.special2].filter(Boolean);
  const ok = slots.find((v) => v.order && v.ready);
  if (ok) return { do: "deliver", slot: ok.slot };
  return detour(s, t, missingCrop(s, slots), "Đơn còn thiếu hàng.");
}
