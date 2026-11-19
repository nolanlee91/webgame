// Nông Trại — lớp tương thích: gom luật thuần ở core/ và cấu hình ở data/ vào một chỗ cho game.js / save.js.
// Mọi thay đổi trạng thái đi qua apply(state, action, now) (core/apply.js). Không có DOM ở đây.
export { CROPS, CROP, FIELD_CROPS } from "./data/crops.js?v=m2";
export { ITEMS, ITEM, CATEGORIES, iconCell, ICON_COLS, ICON_ROWS, isDecor, PRODUCTS } from "./data/catalog.js?v=m2";
export { MACHINES, MACHINE, MAX_SLOTS } from "./data/machines.js?v=m2";
export { RECIPES, RECIPE, recipesOf } from "./data/recipes.js?v=m2";
export { WORKSHOP } from "./data/workshop.js?v=m2";
export { NPCS, NPC, MARKET_LINES } from "./data/npcs.js?v=m2";
export { WAREHOUSE, OVERFLOW_MAX } from "./data/warehouse.js?v=m2";
export { UPGRADES } from "./data/decor.js?v=m2";
export { TUTORIAL, PROGRESSION, QUESTS, QUEST_GIVER } from "./data/quests.js?v=m2";
export { ORDER_TYPES, CANCEL_REFILL_MS } from "./data/orders.js?v=m2";
export { LEVELS } from "./data/levels.js?v=m2";
export { apply, needsSync, invariantError, ACTIONS } from "./core/apply.js?v=m2";
export { createState, loadSave, loadV3, migrateV2, dump, SAVE_VERSION, START_COINS } from "./core/state.js?v=m2";
export { W, H, plotCost, isReady, progress, stage, canBuy, readyWhileAway } from "./core/plots.js?v=m2";
export { xpNeed, cropUnlocked, hasFeature, orderSlotCount, unlocksAt, nextUnlock } from "./core/progression.js?v=m2";
export { capacity, used, overflowCount, have, free } from "./core/inventory.js?v=m2";
export { boardView, demand, cropUnit, SPECIAL_LEVEL, COMBO_LEVEL } from "./core/orders.js?v=m2";
export { currentQuest, questComplete } from "./core/quests.js?v=m2";
export { nextWarehouse, sellable, stuck, priceOf } from "./core/economy.js?v=m2";
export { MARKET, nextChangeAt, seedId } from "./core/market.js?v=m2";
export { status as machineStatus, canEnqueue, canBuild, nextUpgrade, capacity as queueCapacity } from "./core/production.js?v=m2";
export { workshopOf, workshopLevel, workshopState, ctxOf, MACHINES_NOW, nextWorkshopUpgrade, extraSlots, finishedJobs, finishedWhileAway } from "./core/workshop.js?v=m2";
export { bag } from "./core/inventory.js?v=m2";
