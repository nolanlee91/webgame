// Việc của chủ tiệm ngoài quầy: gói ký gửi khi hụt vốn (không bao giờ kẹt), quảng bá địa phương (cấp 14).
import { STOCK, useOf } from "../data/ingredients.js?v=m36audio";
import { RECIPE } from "../data/recipes.js?v=m36audio";
import { costOfUse, hasStock, stockUsed, capacity, packPrice, useOfSpec } from "./economy.js?v=m36audio";
import { PEARL_RAW } from "../data/equipment.js?v=m36audio";
import { SHIFT_FEE, DRAMA } from "../data/shift.js?v=m36audio";
import { CONSIGN_LINES } from "../data/lines-m3.js?v=m36audio";
import { pick } from "./rng.js?v=m36audio";

/** Cờ của game cho Drama Engine (core/drama.js ENGINE_FLAG). until = ngày cuối còn hiệu lực. */
const flag = (s, f, until) => { if (s.drama) s.drama.flags[f] = until; };

/** Gói ký gửi của Dì Ba: đủ khoảng 6 ly trà đào + 3 ly trà sữa trân châu. Trả dần bằng giá vốn khi bán. */
export const CONSIGN_KIT = { "ly": 6, "hong-tra": 6, "dao": 4, "sua": 3, "duong": 6, "da": 6, [PEARL_RAW]: 3 };
export const BASIC = ["tra-dao", "tra-sua-truyen-thong"];

/** Có tự pha (hoặc tự mua đủ hàng để pha) được ít nhất một món cơ bản không? */
export function canMakeBasic(s) {
  for (const rid of BASIC) {
    const use = useOfSpec(RECIPE[rid]);
    let money = s.money - Math.min(SHIFT_FEE, s.money);
    let ok = true;
    for (const [id, n] of Object.entries(use)) {
      const have = s.stock[id] || 0;
      if (have >= n) continue;
      const p = packPrice(id);
      if (money < p) { ok = false; break; }
      money -= p;
    }
    if (ok) return true;
  }
  return false;
}
export const needsBailout = (s) => !s.shift && !canMakeBasic(s);
export const consignAvailable = (s) => needsBailout(s) && s.consign?.day !== s.day;

export function consign(s, events) {
  if (s.shift) return { err: "shift-open" };
  if (!needsBailout(s)) return { err: "not-needed" };
  if (s.consign?.day === s.day) return { err: "once-per-day" };
  let room = capacity(s) - stockUsed(s);
  const got = {};
  for (const [id, n] of Object.entries(CONSIGN_KIT)) {
    const k = Math.max(0, Math.min(n, room));
    if (!k) continue;
    s.stock[id] = (s.stock[id] || 0) + k; got[id] = k; room -= k;
  }
  const owed = costOfUse(got);
  s.consign = { day: s.day, owed: (s.consign?.owed || 0) + owed };
  flag(s, "ky-gui", s.day + DRAMA.flagDays); // Dì Ba ghé hỏi thăm trong ca (sự kiện B01)
  events.push({ type: "consigned", got, owed, line: pick(s, CONSIGN_LINES) });
  return { ok: true };
}
/** Khi bán: trừ dần nợ ký gửi bằng giá vốn ly (không vượt tiền thu). Trả về số trừ. */
export function consignRepay(s, max) {
  const owed = s.consign?.owed || 0;
  if (!owed || max <= 0) return 0;
  const d = Math.min(owed, max);
  s.consign.owed = owed - d;
  if (!s.consign.owed && s.drama) { delete s.drama.flags["ky-gui"]; flag(s, "ky-gui-xong", s.day + DRAMA.flagDays); } // ngày trả đủ (sự kiện B02)
  return d;
}

/** Quảng bá (cấp 14), một lần mỗi ngày, trước ca. guests = khách thêm ca tới. */
export const PROMOS = {
  "to-roi": { name: "Phát tờ rơi đầu hẻm", price: 20, guests: 2, followers: 0, buzz: 0, line: "Tờ rơi in chữ to, chủ yếu để hàng xóm biết tiệm còn sống." },
  "check-in": { name: "Mini game check-in tặng nắp kêu cạch", price: 40, guests: 3, followers: 25, buzz: 1, line: "Ai check-in được tặng một tiếng cạch. Khách thích lạ lùng." },
  "livestream": { name: "Livestream pha chế", price: 0, guests: 1, followers: 40, buzz: 1, line: "Livestream 40 phút, 12 người xem, 3 người hỏi giá, 1 người là mẹ." },
};
export const PROMO_UNLOCK = 14;
export function promo(s, kind, events) {
  const P = PROMOS[kind];
  if (!P) return { err: "bad-promo" };
  if (s.shift) return { err: "shift-open" };
  if (s.level < PROMO_UNLOCK) return { err: "locked" };
  if (s.promo?.day === s.day) return { err: "once-per-day" };
  if (s.money < P.price) return { err: "money" };
  s.money -= P.price;
  s.promo = { day: s.day, kind };
  s.followers = (s.followers || 0) + P.followers;
  s.buzz = (s.buzz || 0) + P.buzz;
  flag(s, "promo-" + kind, s.day); // chỉ ca hôm nay: lên mạng / phản tác dụng / khách ăn ké (sự kiện Q01–Q09)
  events.push({ type: "promoted", kind, price: P.price, line: P.line });
  return { ok: true };
}
export const promoGuests = (s) => (s.promo?.day === s.day ? PROMOS[s.promo.kind]?.guests || 0 : 0);
export { STOCK, useOf, hasStock };
