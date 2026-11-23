// S (M5): lối chơi còn thiếu sau M3 + M4 — thuần, không DOM, mọi thay đổi đi qua core/apply.js (gộp bằng một dòng `...sHandlers()`).
// Gồm: bật / tắt món trong menu, hội chợ (cấp 18), ca thử thách + huy hiệu (cấp 20), bày ×N cho bàn cùng món, tủ kính giữ ấm,
// vỉ chay riêng, bếp 2 than riêng, nợ Anh Sáu chung sổ nợ, trang trí từ Drama thành đồ kéo thả.
import { DISHES } from "../data/economy.js?v=c2";

// ---------- menu ----------
/** Bật / tắt một món (bảng Chuẩn bị · Menu). Tắt ⇒ khách không gọi; món mới mở không tự bật lại món đã tắt. Luôn còn ít nhất một món. */
export function toggleDish(s, id, on, ev = []) {
  const d = DISHES[id];
  if (!d || d.rescue || d.special) return { err: "bad-dish" };
  if (s.shift) return { err: "in-shift" };
  s.menu = Array.isArray(s.menu) ? s.menu : ["com-suon"];
  s.menuOff = Array.isArray(s.menuOff) ? s.menuOff : [];
  const want = on === undefined ? !s.menu.includes(id) : !!on;
  if (want) {
    if (d.level > s.level) return { err: "locked" };
    if ((d.needs || []).some((k) => !s.owned?.[k])) return { err: "needs" };
    if (!s.menu.includes(id)) s.menu.push(id);
    s.menuOff = s.menuOff.filter((x) => x !== id);
  } else {
    if (s.menu.filter((x) => !DISHES[x]?.special && x !== id).length < 1) return { err: "last-dish" };
    s.menu = s.menu.filter((x) => x !== id);
    if (!s.menuOff.includes(id)) s.menuOff.push(id);
  }
  ev.push({ type: "menu", id, on: want });
  return { ok: true, on: want };
}

// ---------- hội chợ / thử thách (điền ở phần sau) ----------
export const FAIR = { price: 180, level: 18 };
export const fairAvailable = () => false;
export const fairToday = () => false;
export const challengeToday = () => null;
export const batchCandidates = () => [];

/** Thao tác mới cho core/apply.js. */
export function sHandlers({ noShift }) {
  return {
    toggleDish: noShift((s, a, ev) => toggleDish(s, a.id, a.on, ev)),
  };
}
