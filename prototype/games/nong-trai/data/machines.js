// Máy trong Xưởng (DESIGN-2.0 §2.3, §3). Thuần dữ liệu — luật ở core/production.js.
// unlock: cấp người chơi cần để xây. requires: công trình phải có (ctx.buildings) — Nồi đường đặt trong Nhà kính.
// buildCost / buildMs: giá + thời gian xây (§3: Bếp sên 150 xu / 1 ph, Lò bánh 400 xu; còn lại là số đề xuất).
// sprite: tiền tố frame trong assets/v3/machines.webp (`<sprite>-idle`, `-run-1`, `-run-2`); null ⇒ chưa có asset.
// Hàng chờ: 2 ô lúc xây (level 1). upgrades[i] đưa máy lên level i+2: +1 ô, tối đa 4 ô.
// Id "coi-xay" khớp producer trong data/items.js của M1 (sprite trong manifest tên "coi-bot").
// "Lò bánh cấp 2" (§3 cấp 16) = Lò bánh đã nâng lên level 2 ⇒ mở công thức Bánh flan (recipe.machineLevel = 2).

export const BASE_SLOTS = 2;
export const MAX_SLOTS = 4;

export const MACHINES = [
  { id: "bep-sen", name: "Bếp sên", unlock: 4, buildCost: 150, buildMs: 60_000, sprite: "bep-sen",
    upgrades: [{ cost: 200, slots: 3 }, { cost: 450, slots: 4 }] },
  { id: "coi-xay", name: "Cối xay", unlock: 5, buildCost: 250, buildMs: 90_000, sprite: "coi-bot",
    upgrades: [{ cost: 350, slots: 3 }, { cost: 750, slots: 4 }] },
  { id: "lo-banh", name: "Lò bánh", unlock: 8, buildCost: 400, buildMs: 120_000, sprite: "lo-banh",
    upgrades: [{ cost: 600, slots: 3 }, { cost: 1200, slots: 4 }] },
  { id: "may-bo-sua", name: "Máy bơ sữa", unlock: 12, buildCost: 800, buildMs: 180_000, sprite: null,
    upgrades: [{ cost: 1000, slots: 3 }, { cost: 2000, slots: 4 }] },
  { id: "noi-duong", name: "Nồi đường", unlock: 13, requires: "nha-kinh", buildCost: 1000, buildMs: 180_000, sprite: null,
    upgrades: [{ cost: 1200, slots: 3 }, { cost: 2400, slots: 4 }] },
];

export const MACHINE = Object.freeze(Object.assign(Object.create(null), Object.fromEntries(MACHINES.map((m) => [m.id, m]))));
