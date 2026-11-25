// Toạ độ cảnh dùng cho luật thuần (không DOM) + đường đi khách (render/scene.js dùng chung): chỗ đứng + cửa của cảnh tiệm.
// Mọi toạ độ gốc lấy từ manifest.placements (Codex ghi: door, queueSpots, exitPath, cartEntry, cartQueueSpots, cartExitPath); data/shift.js là dự phòng.
// Thứ tự hàng chờ: người đầu hàng đứng ở chỗ gần chủ tiệm nhất (chỗ giao bánh), người sau nối dần về phía cửa vào; chỗ phía bên kia
// (ví dụ góc cửa sổ của tiệm) chỉ dùng khi hàng đã dài. Trước M5 người đầu hàng đứng ở queueSpots[0] = góc trái cửa sổ, xa cửa và xa chủ tiệm.
import { SHOP } from "../data/shift.js?v=b8";

const d2 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
/** Sắp chỗ đứng theo thứ tự vào hàng: [đầu hàng (gần chủ tiệm), …về phía cửa, …phía còn lại]. */
export function orderQueue(spots, baker, entry) {
  if (!Array.isArray(spots) || spots.length < 2 || !baker) return spots || [];
  const front = spots.reduce((b, p) => (Math.abs(p[0] - baker[0]) < Math.abs(b[0] - baker[0]) ? p : b), spots[0]);
  const dir = Math.sign((entry?.[0] ?? front[0] + 1) - front[0]) || 1;
  const rest = spots.filter((p) => p !== front);
  const toward = rest.filter((p) => Math.sign(p[0] - front[0]) === dir).sort((a, b) => d2(a, front) - d2(b, front));
  const away = rest.filter((p) => Math.sign(p[0] - front[0]) !== dir).sort((a, b) => d2(a, front) - d2(b, front));
  return [front, ...toward, ...away];
}
/** Đường ra: từ chỗ đứng đi theo phần đuôi ngắn nhất của exitPath (luôn kết thúc ở điểm cuối), điểm đầu phải ở trước hàng (y ≥ chỗ đứng). */
export function exitRoute(spot, exit) {
  if (!exit?.length) return [spot];
  let best = null, bestLen = Infinity;
  for (let i = 0; i < exit.length; i++) {
    const tail = exit.slice(i);
    if (tail.length > 1 && tail[0][1] < spot[1] - 4) continue;
    let len = d2(spot, tail[0]);
    for (let k = 1; k < tail.length; k++) len += d2(tail[k - 1], tail[k]);
    if (tail.length === 1 && best) continue;
    if (len < bestLen - 1) { best = tail; bestLen = len; }
  }
  return [spot, ...(best || exit)];
}
/** Đường vào: nếu lối ra kết thúc ở cửa vào (tiệm) thì đi ngược lối ra (không cắt qua quầy); không thì đi thẳng (xe đẩy: vào bên phải, ra bên trái). */
export function entryRoute(spot, exit, entry) {
  if (exit?.length && d2(exit[exit.length - 1], entry) < 60) {
    const out = exitRoute(spot, exit);
    return out.slice().reverse().map((p, i) => (i === 0 ? entry : p));
  }
  return [entry, spot];
}
/** Vị trí trên một đường gấp khúc theo tỉ lệ 0..1. */
export function along(path, p) {
  if (path.length < 2) return path[0];
  const segs = []; let total = 0;
  for (let i = 1; i < path.length; i++) { const l = d2(path[i - 1], path[i]); segs.push(l); total += l; }
  let left = Math.max(0, Math.min(1, p)) * total;
  for (let i = 0; i < segs.length; i++) {
    if (left <= segs[i] || i === segs.length - 1) { const f = segs[i] ? Math.min(1, left / segs[i]) : 1; return [path[i][0] + (path[i + 1][0] - path[i][0]) * f, path[i][1] + (path[i + 1][1] - path[i][1]) * f]; }
    left -= segs[i];
  }
  return path[path.length - 1];
}
/** Luật thuần không đọc manifest: SHOP (data/shift.js) là bản chép placements của shop-scene, test kiểm khớp manifest. */
export const scenePointsShop = () => ({ door: SHOP.door, queue: orderQueue(SHOP.queue, SHOP.baker, SHOP.door) });
