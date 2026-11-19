// Nông Trại — lớp tương thích: gom luật thuần ở core/ và cấu hình ở data/ vào một chỗ cho game.js / save.js.
// Mọi thay đổi trạng thái đi qua apply(state, action, now) (core/apply.js). Không có DOM ở đây.
export { CROPS, CROP, FIELD_CROPS } from "./data/crops.js?v=m5";
export { ITEMS, ITEM, CATEGORIES, iconCell, ICON_COLS, ICON_ROWS, isDecor, PRODUCTS } from "./data/catalog.js?v=m5";
export { MACHINES, MACHINE, MAX_SLOTS } from "./data/machines.js?v=m5";
export { RECIPES, RECIPE, recipesOf } from "./data/recipes.js?v=m5";
export { WORKSHOP } from "./data/workshop.js?v=m5";
export { NPCS, NPC, MARKET_LINES } from "./data/npcs.js?v=m5";
export { WAREHOUSE, OVERFLOW_MAX } from "./data/warehouse.js?v=m5";
export { UPGRADES } from "./data/decor.js?v=m5";
export { TUTORIAL, PROGRESSION, QUESTS, QUEST_GIVER } from "./data/quests.js?v=m5";
export { ORDER_TYPES, CANCEL_REFILL_MS } from "./data/orders.js?v=m5";
export { LEVELS } from "./data/levels.js?v=m5";
export { apply, needsSync, invariantError, ACTIONS } from "./core/apply.js?v=m5";
export { createState, loadSave, loadV3, migrateV2, dump, SAVE_VERSION, START_COINS } from "./core/state.js?v=m5";
export { W, H, PLOT_COUNT, BASE_PLOTS, EAST_FIRST, EAST_COUNT, GH_FIRST, GH_COUNT, plotCost, isReady, progress, stage, canBuy, readyWhileAway } from "./core/plots.js?v=m5";
export { xpNeed, cropUnlocked, hasFeature, orderSlotCount, unlocksAt, nextUnlock } from "./core/progression.js?v=m5";
export { capacity, used, overflowCount, have, free } from "./core/inventory.js?v=m5";
export { boardView, demand, cropUnit, orderPayout, SPECIAL_LEVEL, COMBO_LEVEL } from "./core/orders.js?v=m5";
export { currentQuest, questComplete } from "./core/quests.js?v=m5";
export { sellable, stuck, priceOf } from "./core/economy.js?v=m5";
export { MARKET, nextChangeAt, seedId } from "./core/market.js?v=m5";
export { status as machineStatus, canEnqueue, canBuild, nextUpgrade, capacity as queueCapacity } from "./core/production.js?v=m5";
export { workshopOf, workshopLevel, workshopState, ctxOf, MACHINES_NOW, nextWorkshopUpgrade, extraSlots, finishedJobs, finishedWhileAway } from "./core/workshop.js?v=m5";
export { bag } from "./core/inventory.js?v=m5";
// Milestone 3: xây dựng, bản đồ theo cấp, trang trí
export { BUILDINGS, BUILDING, DECOR, DECOR_ITEM, DECOR_SLOTS, DECOR_SLOT, FIELD, EAST_FIELD, MAP_W, MAP_H, EAST_W, maxLevel, SCENERY, FAME_TITLES } from "./data/buildings.js?v=m5";
export { mapLayout, unlocksAt as mapUnlocksAt } from "./core/levels-map.js?v=m5";
export { effects, levelOf, nextStep, affordError, canStartBuild, canStartUpgrade, isBuilt, isBusy, slotOpen } from "./core/build.js?v=m5";
export { inMilestone, milestoneOf } from "./core/construct.js?v=m5";
export { CURRENT_MILESTONE, featureLevel } from "./data/levels.js?v=m5";
// Milestone 4: chăn nuôi, làng, nhiệm vụ làng, xe giao hàng
export { rulesCtx, M4DEPS } from "./core/apply.js?v=m5";
export { status as animalStatus, readyWhileAway as animalsReadyWhileAway } from "./core/animals.js?v=m5";
export { ANIMALS, ANIMAL } from "./data/animals.js?v=m5";
export { questLog as villageLog, tutorialDone } from "./core/village.js?v=m5";
export { VILLAGE_LEVEL, VILLAGER, PROGRESSION_GIVER, PROGRESSION as VILLAGE_PROGRESSION } from "./data/village.js?v=m5";
