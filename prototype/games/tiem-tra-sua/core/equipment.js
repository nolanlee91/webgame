// Thiết bị và trang trí: mua khi tiệm đóng cửa, hiệu ứng đọc qua các hàm nhỏ dưới đây (shift.js / economy.js dùng).
import { EQUIPMENT, APPEAL_CAP, APPEAL_CAP_FULL } from "../data/equipment.js?v=m36snd";
import { START_CAPACITY } from "../data/ingredients.js?v=m36snd";

export const SEAL_BONUS_MS = 1500;
export const owns = (s, id) => !!s.owned?.[id];
export const appealCap = (s) => (s.level >= 19 ? APPEAL_CAP_FULL : APPEAL_CAP);
export const appeal = (s) => Math.min(appealCap(s), Object.keys(s.owned || {}).reduce((a, id) => a + (EQUIPMENT[id]?.appeal || 0), 0));
export const kitchenSlots = (s) => (owns(s, "dual-pot-cooker") ? 2 : 1);
export const capacityFor = (s) => Math.max(START_CAPACITY, ...Object.keys(s.owned || {}).map((id) => EQUIPMENT[id]?.capacity || 0));
/** Số chỗ pha song song (1 lúc đầu, 2 với bàn pha đôi, 3 với bàn pha ba chỗ). */
export const stationCount = (s) => Math.max(1, ...Object.keys(s.owned || {}).map((id) => EQUIPMENT[id]?.stations || 0));
/** Hệ số kiên nhẫn cộng thêm từ trang trí (ghế chờ). */
export const patienceBonus = (s) => Object.keys(s.owned || {}).reduce((a, id) => a + (EQUIPMENT[id]?.patience || 0), 0);

export function buy(s, id, events) {
  const it = EQUIPMENT[id];
  if (!it) return { err: "unknown" };
  if (s.shift) return { err: "shift-open" };
  if (owns(s, id)) return { err: "owned" };
  if (s.level < it.unlock) return { err: "locked" };
  if (it.requires && !owns(s, it.requires)) return { err: "requires", need: it.requires };
  if (s.money < it.price) return { err: "money" };
  s.money -= it.price;
  s.owned[id] = true;
  s.capacity = capacityFor(s);
  s.stats.spentGear = (s.stats.spentGear || 0) + it.price;
  events.push({ type: "bought", id, price: it.price });
  return { ok: true };
}
