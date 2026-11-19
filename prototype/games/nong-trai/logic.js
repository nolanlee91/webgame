// Nông Trại — lớp tương thích: gom luật thuần ở core/ và cấu hình ở data/ vào một chỗ cho game.js / save.js.
// Mọi thay đổi trạng thái đi qua apply(state, action, now) (core/apply.js). Không có DOM ở đây.
export { CROPS, CROP, FIELD_CROPS } from "./data/crops.js?v=m3b";
export { ITEMS, ITEM, CATEGORIES, iconCell, ICON_COLS, ICON_ROWS, isDecor, PRODUCTS } from "./data/catalog.js?v=m3b";
export { MACHINES, MACHINE, MAX_SLOTS } from "./data/machines.js?v=m3b";
export { RECIPES, RECIPE, recipesOf } from "./data/recipes.js?v=m3b";
export { WORKSHOP } from "./data/workshop.js?v=m3b";
export { NPCS, NPC, MARKET_LINES } from "./data/npcs.js?v=m3b";
export { WAREHOUSE, OVERFLOW_MAX } from "./data/warehouse.js?v=m3b";
export { UPGRADES } from "./data/decor.js?v=m3b";
export { TUTORIAL, PROGRESSION, QUESTS, QUEST_GIVER } from "./data/quests.js?v=m3b";
export { ORDER_TYPES, CANCEL_REFILL_MS } from "./data/orders.js?v=m3b";
export { LEVELS } from "./data/levels.js?v=m3b";
export { apply, needsSync, invariantError, ACTIONS } from "./core/apply.js?v=m3b";
export { createState, loadSave, loadV3, migrateV2, dump, SAVE_VERSION, START_COINS } from "./core/state.js?v=m3b";
export { W, H, PLOT_COUNT, BASE_PLOTS, EAST_FIRST, EAST_COUNT, GH_FIRST, GH_COUNT, plotCost, isReady, progress, stage, canBuy, readyWhileAway } from "./core/plots.js?v=m3b";
export { xpNeed, cropUnlocked, hasFeature, orderSlotCount, unlocksAt, nextUnlock } from "./core/progression.js?v=m3b";
export { capacity, used, overflowCount, have, free } from "./core/inventory.js?v=m3b";
export { boardView, demand, cropUnit, SPECIAL_LEVEL, COMBO_LEVEL } from "./core/orders.js?v=m3b";
export { currentQuest, questComplete } from "./core/quests.js?v=m3b";
export { sellable, stuck, priceOf } from "./core/economy.js?v=m3b";
export { MARKET, nextChangeAt, seedId } from "./core/market.js?v=m3b";
export { status as machineStatus, canEnqueue, canBuild, nextUpgrade, capacity as queueCapacity } from "./core/production.js?v=m3b";
export { workshopOf, workshopLevel, workshopState, ctxOf, MACHINES_NOW, nextWorkshopUpgrade, extraSlots, finishedJobs, finishedWhileAway } from "./core/workshop.js?v=m3b";
export { bag } from "./core/inventory.js?v=m3b";
// Milestone 3: xây dựng, bản đồ theo cấp, trang trí
export { BUILDINGS, BUILDING, DECOR, DECOR_ITEM, DECOR_SLOTS, DECOR_SLOT, FIELD, EAST_FIELD, MAP_W, MAP_H, EAST_W, maxLevel, SCENERY } from "./data/buildings.js?v=m3b";
export { mapLayout, unlocksAt as mapUnlocksAt } from "./core/levels-map.js?v=m3b";
export { effects, levelOf, nextStep, affordError, canStartBuild, canStartUpgrade, isBuilt, isBusy, slotOpen } from "./core/build.js?v=m3b";
export { inMilestone, milestoneOf } from "./core/construct.js?v=m3b";
export { CURRENT_MILESTONE, featureLevel } from "./data/levels.js?v=m3b";
