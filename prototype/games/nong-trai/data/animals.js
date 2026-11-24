// Vật nuôi (DESIGN-2.0 §2.4) — thuần dữ liệu. Luật ở core/animals.js (Milestone 4).
// Id vật nuôi: "ga" (gà) và "bo-sua" (bò sữa). KHÔNG dùng "bo" cho con bò vì "bo" là món Bơ trong kho (data/catalog.js).
// Save cũ có kind "bo" được core/animals.js sanitize() đổi sang "bo-sua" (LEGACY_KIND).
// Tiền tố frame trong assets/v3/animals.webp vẫn là "bo-*" (tên asset, không phải id luật).
//
// GIÁ: một nguồn sự thật là data/catalog.js —
//   • giá bán sản phẩm (trứng / sữa): ITEM[product].sell  → productValue(kind)
//   • giá mua / thức ăn / chu kỳ: ANIMAL_REF (id tham chiếu `ref`) — đọc lúc nạp module, thiếu thì dùng số dự phòng bên dưới.
// Đổi giá chỉ cần sửa catalog.js (xem core/README-M4.md "Balance to apply during wiring").
//
// level: cấp người chơi cần để mua. buy: giá mua 1 con (xu). feed: số bao thức ăn mỗi lần cho ăn (trừ LÚC cho ăn).
// cycleMs: chu kỳ từ lúc cho ăn tới lúc sản phẩm chín. product × qty vào kho khi "Thu". xp: kinh nghiệm mỗi lần thu.
// housing: công trình chứa (M3 xây). capacityByLevel[i]: số con tối đa khi chuồng ở level i+1 (§2.4: gà 6, bò 4 lúc xây).
// sprite: frame trong assets/v3/animals.webp (manifest.json → sheets.animals). bubble: bong bóng trên đầu.
import { ITEM, ANIMAL_REF } from "./catalog.js?v=m9";

export const FEED = "thuc-an-gia-suc";
/** Trần cứng (chống save bị sửa): không chuồng nào chứa quá số này, kể cả khi capacity() trả số lớn hơn. */
export const HARD_MAX = 12;
/** Id cũ → id mới (save trước khi đổi tên). */
export const LEGACY_KIND = Object.freeze({ bo: "bo-sua" });

const REF = Object.fromEntries((ANIMAL_REF || []).map((r) => [r.id, r]));
/** Số từ catalog.js ANIMAL_REF (một nguồn), thiếu ⇒ số dự phòng. */
const fromRef = (ref, fallback) => {
  const r = REF[ref] || {};
  const pick = (k, alt = k) => (Number.isFinite(r[alt]) ? r[alt] : fallback[k]);
  return { level: pick("level"), buy: pick("buy"), feed: pick("feed"), cycleMs: pick("cycleMs"), qty: pick("qty"),
    product: typeof r.output === "string" ? r.output : fallback.product };
};

export const ANIMALS = [
  {
    id: "ga", ref: "ga", name: "Gà", ...fromRef("ga", { level: 7, buy: 60, feed: 1, cycleMs: 240_000, product: "trung-ga", qty: 1 }), xp: 2,
    housing: "chuong-ga", housingName: "Chuồng gà", capacityByLevel: [6, 8, 10],
    sprite: {
      sheet: "animals", frameMs: 180, scale: 0.8,
      idle: ["ga-idle-1", "ga-idle-2"], eat: ["ga-an-1", "ga-an-2"], walk: ["ga-di-trai-1", "ga-di-trai-2"],
      bubbleReady: "bong-bong-trung", bubbleHungry: "bong-bong-doi",
    },
  },
  {
    id: "bo-sua", ref: "bo", name: "Bò sữa", ...fromRef("bo", { level: 9, buy: 180, feed: 2, cycleMs: 480_000, product: "sua", qty: 1 }), xp: 5,
    housing: "chuong-bo", housingName: "Chuồng bò", capacityByLevel: [4, 6],
    sprite: {
      sheet: "animals", frameMs: 180, scale: 0.72,
      idle: ["bo-idle-1", "bo-idle-2"], eat: ["bo-an-1", "bo-an-2"], walk: ["bo-di-trai-1", "bo-di-trai-2"],
      bubbleReady: "bong-bong-sua", bubbleHungry: "bong-bong-doi",
    },
  },
];

export const ANIMAL = Object.freeze(Object.assign(Object.create(null), Object.fromEntries(ANIMALS.map((a) => [a.id, a]))));
/** Công trình chứa → loại vật nuôi. */
export const HOUSING = Object.freeze(Object.assign(Object.create(null), Object.fromEntries(ANIMALS.map((a) => [a.housing, a.id]))));
/** Sản phẩm vật nuôi → loại vật nuôi ("trung-ga" → "ga", "sua" → "bo-sua"). */
export const PRODUCER_OF = Object.freeze(Object.assign(Object.create(null), Object.fromEntries(ANIMALS.map((a) => [a.product, a.id]))));
/** Giá bán gốc 1 sản phẩm của loại `kind` — đọc data/catalog.js (một nguồn giá). */
export const productValue = (kind) => ITEM[ANIMAL[kind]?.product]?.sell ?? 0;
/** Thời gian (ms) hiện animation "ăn" ngay sau khi cho ăn — chỉ để vẽ. */
export const EAT_ANIM_MS = 2_000;

/** Giá từ mô phỏng (tools/sim/report.md §9.4) — ĐÃ áp vào data/catalog.js khi ghép Milestone 4 (test/animals.test.mjs kiểm khớp). */
export const PROPOSED_SELL = Object.freeze({ "trung-ga": 32, sua: 72 });
