// Kho thống nhất theo id vật phẩm + giỏ tràn. Luật thuần, chỉ gọi trong apply().
// s.inv: { id: số lượng } trong Nhà kho. s.overflow: { id: số lượng } trong giỏ tràn (tổng ≤ OVERFLOW_MAX).
// Vật liệu (counts=false) luôn vào kho, không tính sức chứa, không vào giỏ tràn.
import { ITEM } from "../data/catalog.js?v=m1";
import { WAREHOUSE, OVERFLOW_MAX } from "../data/warehouse.js?v=m1";

export const capacity = (s) => WAREHOUSE[s.warehouse].cap;
const sum = (bag, pred = () => true) => Object.entries(bag).reduce((n, [id, q]) => n + (pred(id) ? q : 0), 0);
/** Chỗ đã dùng trong kho (không tính vật liệu). */
export const used = (s) => sum(s.inv, (id) => ITEM[id]?.counts);
export const overflowCount = (s) => sum(s.overflow);
export const free = (s) => Math.max(0, capacity(s) - used(s));
/** Số đang có (kho + giỏ tràn). */
export const have = (s, id) => (s.inv[id] || 0) + (s.overflow[id] || 0);

/** Thêm được n món không (kho + chỗ trống giỏ tràn). */
export function canAdd(s, id, n = 1) {
  const it = ITEM[id];
  if (!it) return false;
  if (!it.counts) return true;
  return free(s) + (OVERFLOW_MAX - overflowCount(s)) >= n;
}

/** Thêm vào kho, phần vượt vào giỏ tràn. Gọi sau canAdd. Trả { stored, overflowed }. */
export function add(s, id, n = 1) {
  const it = ITEM[id];
  if (!it || n <= 0) return { stored: 0, overflowed: 0 };
  if (!it.counts) { s.inv[id] = (s.inv[id] || 0) + n; return { stored: n, overflowed: 0 }; }
  const stored = Math.min(n, free(s));
  const overflowed = Math.min(n - stored, OVERFLOW_MAX - overflowCount(s));
  if (stored) s.inv[id] = (s.inv[id] || 0) + stored;
  if (overflowed) s.overflow[id] = (s.overflow[id] || 0) + overflowed;
  return { stored, overflowed };
}

/** Lấy n món (giỏ tràn trước, rồi kho). Gọi sau khi đã kiểm have ≥ n. */
export function take(s, id, n) {
  const fromBasket = Math.min(n, s.overflow[id] || 0);
  if (fromBasket) { s.overflow[id] -= fromBasket; if (!s.overflow[id]) delete s.overflow[id]; }
  const rest = n - fromBasket;
  if (rest) { s.inv[id] -= rest; if (!s.inv[id]) delete s.inv[id]; }
}

/** Kho có chỗ trống ⇒ chuyển hàng từ giỏ tràn vào kho. Trả số món đã chuyển. */
export function settleOverflow(s) {
  let moved = 0;
  for (const id of Object.keys(s.overflow)) {
    const n = Math.min(s.overflow[id], free(s));
    if (!n) break;
    s.overflow[id] -= n; if (!s.overflow[id]) delete s.overflow[id];
    s.inv[id] = (s.inv[id] || 0) + n;
    moved += n;
  }
  return moved;
}

/** Giao diện gọn cho các module sau (Milestone 2: xưởng, chợ) — vẫn chỉ dùng bên trong apply() trên bản nháp.
 *  count(id) · has(id, n) · take(id, n) → bool (không đủ ⇒ không trừ gì) · add(id, n) → { ok, overflow } (ok=false ⇒ không thêm gì). */
export function bag(s) {
  return {
    count: (id) => have(s, id),
    has: (id, n = 1) => Number.isInteger(n) && n >= 0 && have(s, id) >= n,
    take(id, n = 1) {
      if (!Number.isInteger(n) || n <= 0 || have(s, id) < n) return false;
      take(s, id, n);
      return true;
    },
    add(id, n = 1) {
      if (!Number.isInteger(n) || n <= 0 || !canAdd(s, id, n)) return { ok: false, overflow: 0 };
      const r = add(s, id, n);
      return { ok: true, overflow: r.overflowed };
    },
  };
}
