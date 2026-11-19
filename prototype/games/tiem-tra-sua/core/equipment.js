// Thiết bị và trang trí: mua khi tiệm đóng cửa, hiệu ứng đọc qua các hàm nhỏ dưới đây (shift.js / economy.js dùng).
import { EQUIPMENT, APPEAL_CAP } from "../data/equipment.js";
import { START_CAPACITY } from "../data/ingredients.js";

export const SEAL_BONUS_MS = 1500;
export const owns = (s, id) => !!s.owned?.[id];
export const appeal = (s) => Math.min(APPEAL_CAP, Object.keys(s.owned || {}).reduce((a, id) => a + (EQUIPMENT[id]?.appeal || 0), 0));
export const kitchenSlots = (s) => (owns(s, "dual-pot-cooker") ? 2 : 1);
export const capacityFor = (s) => Math.max(START_CAPACITY, ...Object.keys(s.owned || {}).map((id) => EQUIPMENT[id]?.capacity || 0));

export function buy(s, id, events) {
  const it = EQUIPMENT[id];
  if (!it) return { err: "unknown" };
  if (s.shift) return { err: "shift-open" };
  if (owns(s, id)) return { err: "owned" };
  if (s.level < it.unlock) return { err: "locked" };
  if (s.money < it.price) return { err: "money" };
  s.money -= it.price;
  s.owned[id] = true;
  s.capacity = capacityFor(s);
  s.stats.spentGear = (s.stats.spentGear || 0) + it.price;
  events.push({ type: "bought", id, price: it.price });
  return { ok: true };
}
