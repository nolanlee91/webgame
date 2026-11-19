// Vật nuôi (DESIGN-2.0 §2.4) — thuần dữ liệu. Luật ở core/animals.js (Milestone 4).
// Id "ga" / "bo" khớp data/catalog.js (producer { kind: "animal", id }) và tiền tố frame trong assets/v3/animals.webp.
// Lưu ý: id vật nuôi "bo" (con bò) là không gian tên riêng, KHÁC món "bo" (Bơ) trong kho — kho chỉ nhận `product`.
//
// level: cấp người chơi cần để mua. buy: giá mua 1 con (xu). feed: số bao thức ăn mỗi lần cho ăn (trừ LÚC cho ăn).
// cycleMs: chu kỳ từ lúc cho ăn tới lúc sản phẩm chín. product × qty vào kho khi "Thu". xp: kinh nghiệm mỗi lần thu.
// housing: công trình chứa (M3 xây). capacityByLevel[i]: số con tối đa khi chuồng ở level i+1 (§2.4: gà 6, bò 4 lúc xây).
// sprite: frame trong assets/v3/animals.webp (manifest.json → sheets.animals). bubble: bong bóng trên đầu.

export const FEED = "thuc-an-gia-suc";
/** Trần cứng (chống save bị sửa): không chuồng nào chứa quá số này, kể cả khi capacity() trả số lớn hơn. */
export const HARD_MAX = 12;

export const ANIMALS = [
  {
    id: "ga", name: "Gà", level: 7, buy: 60, feed: 1, cycleMs: 240_000, product: "trung-ga", qty: 1, xp: 2,
    housing: "chuong-ga", capacityByLevel: [6, 8, 10],
    sprite: {
      sheet: "animals", frameMs: 180,
      idle: ["ga-idle-1", "ga-idle-2"], eat: ["ga-an-1", "ga-an-2"], walk: ["ga-di-trai-1", "ga-di-trai-2"],
      bubbleReady: "bong-bong-trung", bubbleHungry: "bong-bong-doi",
    },
  },
  {
    id: "bo", name: "Bò", level: 9, buy: 180, feed: 2, cycleMs: 480_000, product: "sua", qty: 1, xp: 5,
    housing: "chuong-bo", capacityByLevel: [4, 6],
    sprite: {
      sheet: "animals", frameMs: 180,
      idle: ["bo-idle-1", "bo-idle-2"], eat: ["bo-an-1", "bo-an-2"], walk: ["bo-di-trai-1", "bo-di-trai-2"],
      bubbleReady: "bong-bong-sua", bubbleHungry: "bong-bong-doi",
    },
  },
];

export const ANIMAL = Object.freeze(Object.assign(Object.create(null), Object.fromEntries(ANIMALS.map((a) => [a.id, a]))));
/** Công trình chứa → loại vật nuôi. */
export const HOUSING = Object.freeze(Object.assign(Object.create(null), Object.fromEntries(ANIMALS.map((a) => [a.housing, a.id]))));
/** Thời gian (ms) hiện animation "ăn" ngay sau khi cho ăn — chỉ để vẽ. */
export const EAT_ANIM_MS = 2_000;
