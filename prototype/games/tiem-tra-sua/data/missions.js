// Nhiệm vụ ngày (ECONOMY.md): mở ở cấp 2, mỗi ca 3 mục tiêu ngắn chọn theo cơ chế đã mở. Thưởng trả một lần khi xong.
// kind: cách đếm (core/missions.js). n: mục tiêu. at: "serve" (đếm khi giao) | "end" (xét lúc chốt ca) | "drama".
export const MISSIONS = [
  { id: "sugar-exact", kind: "sugarExact", at: "serve", n: 2, unlock: 2, text: "Giao {n} ly đúng mức đường", reward: { xp: 8, money: 0 } },
  { id: "ice-exact", kind: "iceExact", at: "serve", n: 3, unlock: 2, text: "Giao {n} ly đúng mức đá", reward: { xp: 8, money: 0 } },
  { id: "low-waste", kind: "lowWaste", at: "end", n: 5, unlock: 2, text: "Bán {n} ly mà hao hụt không quá 4k", reward: { xp: 12, money: 12 } },
  { id: "regular-4", kind: "regular4", at: "serve", n: 1, unlock: 2, text: "Phục vụ khách quen được từ 4 sao", reward: { xp: 12, money: 0 } },
  { id: "five-stars", kind: "fiveStars", at: "serve", n: 2, unlock: 2, text: "Nhận {n} review 5 sao", reward: { xp: 10, money: 8 } },
  { id: "no-lost", kind: "noLost", at: "end", n: 4, unlock: 2, text: "Phục vụ ít nhất {n} khách, không ai bỏ về", reward: { xp: 12, money: 10 } },
  { id: "fast", kind: "fast", at: "serve", n: 3, unlock: 2, text: "Giao {n} ly khi khách còn hơn nửa kiên nhẫn", reward: { xp: 10, money: 0 } },
  { id: "pearls", kind: "pearls", at: "serve", n: 3, unlock: 2, text: "Bán {n} ly có trân châu", reward: { xp: 8, money: 6 } },
  { id: "cups", kind: "cups", at: "serve", n: 8, unlock: 4, text: "Bán {n} ly trong ca", reward: { xp: 14, money: 10 } },
  { id: "multi", kind: "multi", at: "serve", n: 1, unlock: 3, text: "Giao trọn một đơn nhiều ly từ 3 sao", reward: { xp: 12, money: 8 } },
  { id: "revenue", kind: "revenue", at: "serve", n: 200, unlock: 5, text: "Doanh thu ca đạt {n}k", reward: { xp: 15, money: 15 } },
  { id: "drama", kind: "drama", at: "drama", n: 1, unlock: 2, text: "Xử lý một tình huống trong ca", reward: { xp: 6, money: 5 } },
];
export const MISSION = Object.fromEntries(MISSIONS.map((m) => [m.id, m]));
export const MISSIONS_PER_DAY = 3;
