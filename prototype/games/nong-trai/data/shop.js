// Những gì chợ BÁN RA cho người chơi (DESIGN-2.0 §2.1: chợ chỉ bán hạt giống, vật tư, trang trí).
// Hạt giống mua xong là gieo ngay (không vào kho) ⇒ không bán lại được. Có test kiểm không món nào mua rồi bán lại có lời.
import { CROPS } from "./crops.js";
export const RESALE_MIN_RATIO = 1.6; // giá mua vào ≥ 1,6 × giá bán lại
export const SHOP = CROPS.map((c) => ({ id: "hat-" + c.id, kind: "seed", crop: c.id, price: c.seed }));
