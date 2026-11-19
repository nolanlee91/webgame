// Nông Trại — lớp tương thích: gom luật thuần ở core/ và cấu hình ở data/ vào một chỗ cho game.js / save.js.
// Mọi thay đổi trạng thái đi qua apply(state, action, now) (core/apply.js). Không có DOM ở đây.
export { CROPS, CROP, FIELD_CROPS } from "./data/crops.js?v=m1";
export { ITEMS, ITEM, CATEGORIES, iconCell, ICON_COLS, ICON_ROWS } from "./data/catalog.js?v=m1";
export { NPCS, NPC } from "./data/npcs.js?v=m1";
export { WAREHOUSE, OVERFLOW_MAX } from "./data/warehouse.js?v=m1";
export { UPGRADES } from "./data/decor.js?v=m1";
export { TUTORIAL, QUEST_GIVER } from "./data/quests.js?v=m1";
export { ORDER_TYPES, CANCEL_REFILL_MS } from "./data/orders.js?v=m1";
export { LEVELS } from "./data/levels.js?v=m1";
export { apply, needsSync, invariantError, ACTIONS } from "./core/apply.js?v=m1";
export { createState, loadV3, migrateV2, dump, SAVE_VERSION, START_COINS } from "./core/state.js?v=m1";
export { W, H, plotCost, isReady, progress, stage, canBuy, readyWhileAway } from "./core/plots.js?v=m1";
export { xpNeed, cropUnlocked, hasFeature, orderSlotCount, unlocksAt, nextUnlock } from "./core/progression.js?v=m1";
export { capacity, used, overflowCount, have, free } from "./core/inventory.js?v=m1";
export { boardView, demand, cropUnit, SPECIAL_LEVEL, COMBO_LEVEL } from "./core/orders.js?v=m1";
export { currentQuest, questComplete } from "./core/quests.js?v=m1";
export { nextWarehouse, sellable, stuck } from "./core/economy.js?v=m1";
