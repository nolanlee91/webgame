// Kéo-thả trang trí: vị trí hợp lệ khi nằm trong vùng sàn / tường, không đè chỗ khách đứng và không chắn lối từ cửa vào.
// Thuần (không DOM). s.placement = { id: [x, y] } (toạ độ neo trong cảnh 1280×720). Không có ⇒ dùng `at` mặc định.
import { EQUIPMENT, PLACE_ZONES, SPOT_CLEARANCE, PATH_CLEARANCE } from "../data/equipment.js?v=m36";
import { SPOTS, DOOR } from "../data/shift.js?v=m36";
import { owns } from "./equipment.js?v=m36";

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
function distToSegment(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)));
  return dist(p, [a[0] + t * dx, a[1] + t * dy]);
}

export const placeable = (id) => !!EQUIPMENT[id]?.place;
export const placeOf = (s, id) => s.placement?.[id] || EQUIPMENT[id]?.at || null;

/** null nếu hợp lệ, ngược lại mã lý do: zone | spot | path. */
export function placeError(id, x, y) {
  const it = EQUIPMENT[id];
  if (!it?.place) return "fixed";
  if (!Number.isFinite(x) || !Number.isFinite(y)) return "zone";
  const z = PLACE_ZONES[it.place];
  if (x < z.x[0] || x > z.x[1] || y < z.y[0] || y > z.y[1]) return "zone";
  if (it.place === "floor") {
    if (SPOTS.some((sp) => dist([x, y], sp) < SPOT_CLEARANCE)) return "spot";
    if (SPOTS.some((sp) => distToSegment([x, y], DOOR, sp) < PATH_CLEARANCE)) return "path";
  }
  return null;
}
export const PLACE_REASON = {
  zone: "Chỗ này không đặt được: đồ sàn để trên sàn, đèn / biển treo trên tường.",
  spot: "Đặt đây khách hết chỗ đứng chờ.",
  path: "Đặt đây chắn lối từ cửa vào quầy.",
  fixed: "Máy móc cố định trên quầy.",
};

export function place(s, id, x, y, events) {
  if (s.shift) return { err: "shift-open" };
  if (!owns(s, id)) return { err: "not-owned" };
  const e = placeError(id, x, y);
  if (e) return { err: "place-" + e, reason: e };
  s.placement = s.placement || {};
  s.placement[id] = [Math.round(x), Math.round(y)];
  events.push({ type: "placed", id, at: s.placement[id] });
  return { ok: true };
}
export function resetPlace(s, id, events) {
  if (s.shift) return { err: "shift-open" };
  if (!s.placement?.[id]) return { err: "none" };
  delete s.placement[id];
  events.push({ type: "placed", id, at: EQUIPMENT[id].at });
  return { ok: true };
}
