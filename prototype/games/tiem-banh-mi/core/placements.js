// Toạ độ cảnh dùng cho luật thuần (không DOM): chỗ đứng + cửa của cảnh tiệm để kiểm chỗ đặt trang trí (core/progress.js placeError).
import { SHOP } from "../data/shift.js?v=b3";
export const scenePointsShop = () => ({ door: SHOP.door, queue: SHOP.queue });
